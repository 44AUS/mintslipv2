from fastapi import FastAPI, HTTPException, UploadFile, File, Depends, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Optional
import os
import json
import httpx
from bs4 import BeautifulSoup
from dotenv import load_dotenv
import uuid
from datetime import datetime, timezone, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
import io
import re
import hashlib
import secrets
import shutil
from collections import defaultdict
import time
import base64

load_dotenv()

# Import Emergent Integrations for Gemini
from emergentintegrations.llm.chat import LlmChat, UserMessage

# Stripe Configuration
import stripe
STRIPE_API_KEY = os.environ.get("STRIPE_API_KEY")
stripe.api_key = STRIPE_API_KEY

# Rate limiting storage (in production, use Redis)
rate_limit_storage = defaultdict(list)

# PDF and DOCX parsing
try:
    import pdfplumber
    PDF_SUPPORT = True
except ImportError:
    PDF_SUPPORT = False

try:
    from docx import Document
    DOCX_SUPPORT = True
except ImportError:
    DOCX_SUPPORT = False

app = FastAPI()

# Create uploads directory if not exists
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads", "blog")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Mount static files for blog uploads
app.mount("/api/uploads", StaticFiles(directory=os.path.join(os.path.dirname(__file__), "uploads")), name="uploads")

# Security
security = HTTPBearer(auto_error=False)

# MongoDB Connection
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "mintslip_db")

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]
discounts_collection = db["discount_codes"]
admins_collection = db["admins"]
users_collection = db["users"]
purchases_collection = db["purchases"]
sessions_collection = db["sessions"]
subscriptions_collection = db["subscriptions"]
blog_posts_collection = db["blog_posts"]
blog_categories_collection = db["blog_categories"]
saved_documents_collection = db["saved_documents"]
site_settings_collection = db["site_settings"]

# Create uploads directory for user documents if not exists
USER_DOCUMENTS_DIR = os.path.join(os.path.dirname(__file__), "uploads", "user_documents")
os.makedirs(USER_DOCUMENTS_DIR, exist_ok=True)

# Constants for saved documents
DOCUMENT_EXPIRY_DAYS = 30

# Saved documents limits by subscription tier
SAVED_DOCS_LIMITS = {
    "starter": 10,
    "professional": 30,
    "business": -1  # -1 means unlimited
}

# Password hashing - Using bcrypt for better security
def hash_password(password: str) -> str:
    # Add salt for additional security
    salt = "MintSlip_Salt_2025_Secure"
    return hashlib.sha256((password + salt).encode()).hexdigest()

def verify_password(password: str, hashed: str) -> bool:
    return hash_password(password) == hashed

# Session token generation
def generate_session_token() -> str:
    return secrets.token_urlsafe(32)

# Rate limiting function
def check_rate_limit(identifier: str, max_requests: int = 10, window_seconds: int = 60) -> bool:
    """
    Simple rate limiting. Returns True if request is allowed, False if rate limited.
    In production, use Redis for distributed rate limiting.
    """
    current_time = time.time()
    window_start = current_time - window_seconds
    
    # Clean old entries
    rate_limit_storage[identifier] = [t for t in rate_limit_storage[identifier] if t > window_start]
    
    # Check if rate limited
    if len(rate_limit_storage[identifier]) >= max_requests:
        return False
    
    # Add current request
    rate_limit_storage[identifier].append(current_time)
    return True

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://localhost:3000",
        "https://mintslip.com",
        "https://www.mintslip.com",
        "https://mintslip.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models
class WorkExperience(BaseModel):
    company: str
    position: str
    location: Optional[str] = ""
    startDate: str
    endDate: str
    current: bool = False
    responsibilities: List[str]

class Education(BaseModel):
    institution: str
    degree: str
    field: str
    graduationDate: str
    gpa: Optional[str] = ""

class ResumeInput(BaseModel):
    personalInfo: dict
    workExperience: List[WorkExperience]
    education: List[Education]
    skills: List[str]
    targetJobTitle: str
    jobDescription: str
    jobUrl: Optional[str] = ""

class JobScrapeRequest(BaseModel):
    url: str

# Discount Code Models
class DiscountCodeCreate(BaseModel):
    code: str
    discountPercent: float
    startDate: str  # ISO date string
    expiryDate: str  # ISO date string
    usageType: str  # "unlimited", "limited", "one_per_customer"
    usageLimit: Optional[int] = None
    applicableTo: str  # "all" or "specific"
    specificGenerators: Optional[List[str]] = None
    isActive: bool = True

class DiscountCodeUpdate(BaseModel):
    code: Optional[str] = None
    discountPercent: Optional[float] = None
    startDate: Optional[str] = None
    expiryDate: Optional[str] = None
    usageType: Optional[str] = None
    usageLimit: Optional[int] = None
    applicableTo: Optional[str] = None
    specificGenerators: Optional[List[str]] = None
    isActive: Optional[bool] = None

class CouponValidateRequest(BaseModel):
    code: str
    generatorType: str
    customerIdentifier: Optional[str] = None  # email or IP for one-per-customer

# ========== ADMIN & USER AUTHENTICATION MODELS ==========

class AdminLogin(BaseModel):
    email: str
    password: str

class UserSignup(BaseModel):
    email: str
    password: str
    name: str
    saveDocuments: Optional[bool] = False  # User preference to save documents

class UserLogin(BaseModel):
    email: str
    password: str

class UserPreferencesUpdate(BaseModel):
    saveDocuments: Optional[bool] = None

class SaveDocumentRequest(BaseModel):
    documentType: str
    fileName: str
    fileData: str  # Base64 encoded file content
    template: Optional[str] = None

# ========== PURCHASE TRACKING MODELS ==========

class PurchaseCreate(BaseModel):
    documentType: str  # paystub, resume, w2, w9, 1099-nec, 1099-misc, bank-statement, offer-letter, vehicle-bill-of-sale, schedule-c, utility-bill
    amount: float
    paypalEmail: str
    paypalTransactionId: Optional[str] = None
    discountCode: Optional[str] = None
    discountAmount: Optional[float] = 0
    userId: Optional[str] = None  # For subscribed users
    template: Optional[str] = None  # Template name/ID used (for paystubs, bank statements)

class ManualPurchaseCreate(BaseModel):
    documentType: str
    amount: float
    paypalEmail: str
    purchaseDate: Optional[str] = None  # ISO date string, defaults to now
    template: Optional[str] = None
    discountCode: Optional[str] = None
    discountAmount: Optional[float] = 0
    notes: Optional[str] = None  # Admin notes

# ========== SUBSCRIPTION MODELS ==========

SUBSCRIPTION_TIERS = {
    "starter": {
        "name": "Starter",
        "price": 19.99,
        "price_cents": 1999,
        "downloads": 10,
        "stripePriceId": ""  # Will be filled when Stripe products are created
    },
    "professional": {
        "name": "Professional", 
        "price": 29.99,
        "price_cents": 2999,
        "downloads": 30,
        "stripePriceId": ""
    },
    "business": {
        "name": "Business",
        "price": 49.99,
        "price_cents": 4999,
        "downloads": -1,  # -1 means unlimited
        "stripePriceId": ""
    }
}

class SubscriptionCreate(BaseModel):
    userId: str
    tier: str  # starter, professional, business
    stripeSubscriptionId: str
    stripeCustomerId: str

class CreateCheckoutSession(BaseModel):
    tier: str
    successUrl: Optional[str] = None
    cancelUrl: Optional[str] = None

# ========== BLOG MODELS ==========

class BlogCategoryCreate(BaseModel):
    name: str
    slug: str
    description: Optional[str] = ""

class BlogPostCreate(BaseModel):
    title: str
    slug: str
    metaTitle: Optional[str] = None
    metaDescription: Optional[str] = None
    author: Optional[str] = "MintSlip Team"
    featuredImage: Optional[str] = None
    content: str  # Markdown content
    excerpt: Optional[str] = None
    category: Optional[str] = None  # Category slug
    tags: Optional[List[str]] = []
    faqSchema: Optional[List[dict]] = []  # [{question, answer}]
    status: Optional[str] = "draft"  # draft, published
    indexFollow: Optional[bool] = True
    publishDate: Optional[str] = None

class BlogPostUpdate(BaseModel):
    title: Optional[str] = None
    slug: Optional[str] = None
    metaTitle: Optional[str] = None
    metaDescription: Optional[str] = None
    author: Optional[str] = None
    featuredImage: Optional[str] = None
    content: Optional[str] = None
    excerpt: Optional[str] = None
    category: Optional[str] = None
    tags: Optional[List[str]] = None
    faqSchema: Optional[List[dict]] = None
    status: Optional[str] = None
    indexFollow: Optional[bool] = None
    publishDate: Optional[str] = None

# Blog Categories
BLOG_CATEGORIES = [
    {"slug": "pay-stubs", "name": "Pay Stubs", "description": "Everything about pay stubs and paycheck documentation"},
    {"slug": "proof-of-income", "name": "Proof of Income", "description": "Guides and tips for proof of income documentation"},
    {"slug": "payroll", "name": "Payroll", "description": "Payroll management and best practices"},
    {"slug": "taxes", "name": "Taxes", "description": "Tax forms, filing, and financial documentation"},
    {"slug": "employment", "name": "Employment", "description": "Employment documentation and workplace guides"},
]

# Initialize Gemini LLM Chat
def get_llm_chat():
    api_key = os.environ.get("EMERGENT_LLM_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="EMERGENT_LLM_KEY not configured")
    
    chat = LlmChat(
        api_key=api_key,
        session_id=str(uuid.uuid4()),
        system_message="You are an expert resume writer and ATS optimization specialist. You help create professional, ATS-optimized resumes tailored to specific job descriptions."
    ).with_model("gemini", "gemini-2.5-flash")
    
    return chat

@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}

# ========== AUTHENTICATION HELPERS ==========

async def get_current_admin(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Verify admin session token"""
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    token = credentials.credentials
    session = await sessions_collection.find_one({"token": token, "type": "admin"}, {"_id": 0})
    
    if not session:
        raise HTTPException(status_code=401, detail="Invalid or expired session")
    
    # Check if session is expired (24 hours)
    created_at = datetime.fromisoformat(session["createdAt"].replace("Z", "+00:00"))
    if (datetime.now(timezone.utc) - created_at).total_seconds() > 86400:
        await sessions_collection.delete_one({"token": token})
        raise HTTPException(status_code=401, detail="Session expired")
    
    return session

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Verify user session token"""
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    token = credentials.credentials
    session = await sessions_collection.find_one({"token": token, "type": "user"}, {"_id": 0})
    
    if not session:
        raise HTTPException(status_code=401, detail="Invalid or expired session")
    
    # Check if session is expired (7 days)
    created_at = datetime.fromisoformat(session["createdAt"].replace("Z", "+00:00"))
    if (datetime.now(timezone.utc) - created_at).total_seconds() > 604800:
        await sessions_collection.delete_one({"token": token})
        raise HTTPException(status_code=401, detail="Session expired")
    
    return session

# ========== ADMIN AUTHENTICATION ENDPOINTS ==========

@app.post("/api/admin/login")
async def admin_login(data: AdminLogin, request: Request):
    """Admin login endpoint with rate limiting"""
    # Get client IP for rate limiting
    client_ip = request.client.host if request.client else "unknown"
    
    # Rate limit: 5 login attempts per minute per IP
    if not check_rate_limit(f"admin_login_{client_ip}", max_requests=5, window_seconds=60):
        raise HTTPException(status_code=429, detail="Too many login attempts. Please try again later.")
    
    admin = await admins_collection.find_one({"email": data.email.lower()}, {"_id": 0})
    
    if not admin:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(data.password, admin["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Create session
    token = generate_session_token()
    session = {
        "id": str(uuid.uuid4()),
        "token": token,
        "adminId": admin["id"],
        "email": admin["email"],
        "type": "admin",
        "createdAt": datetime.now(timezone.utc).isoformat()
    }
    await sessions_collection.insert_one(session)
    
    return {
        "success": True,
        "token": token,
        "admin": {
            "id": admin["id"],
            "email": admin["email"],
            "name": admin.get("name", "Admin")
        }
    }

@app.post("/api/admin/logout")
async def admin_logout(session: dict = Depends(get_current_admin)):
    """Admin logout endpoint"""
    await sessions_collection.delete_one({"token": session["token"]})
    return {"success": True}

@app.get("/api/admin/verify")
async def verify_admin(session: dict = Depends(get_current_admin)):
    """Verify admin session"""
    admin = await admins_collection.find_one({"id": session["adminId"]}, {"_id": 0, "password": 0})
    return {"success": True, "admin": admin}

class ChangeAdminPassword(BaseModel):
    currentPassword: str
    newPassword: str

@app.put("/api/admin/change-password")
async def change_admin_password(data: ChangeAdminPassword, session: dict = Depends(get_current_admin)):
    """Change admin password (requires current password)"""
    admin = await admins_collection.find_one({"id": session["adminId"]})
    if not admin:
        raise HTTPException(status_code=404, detail="Admin not found")
    
    # Verify current password
    if not verify_password(data.currentPassword, admin["password"]):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    
    # Update password
    await admins_collection.update_one(
        {"id": session["adminId"]},
        {"$set": {"password": hash_password(data.newPassword)}}
    )
    
    return {"success": True, "message": "Password changed successfully"}

@app.post("/api/admin/setup")
async def setup_admin():
    """Initialize default admin account (run once) - only works if no admin exists"""
    # Check if any admin already exists
    admin_count = await admins_collection.count_documents({})
    if admin_count > 0:
        raise HTTPException(status_code=403, detail="Admin setup already completed")
    
    admin = {
        "id": str(uuid.uuid4()),
        "email": "admin@mintslip.com",
        "password": hash_password("MINTSLIP2025!"),
        "name": "Admin",
        "createdAt": datetime.now(timezone.utc).isoformat()
    }
    await admins_collection.insert_one(admin)
    return {"message": "Admin account created successfully"}

# ========== USER AUTHENTICATION ENDPOINTS ==========

@app.post("/api/user/signup")
async def user_signup(data: UserSignup):
    """User signup endpoint"""
    # Check if email already exists
    existing = await users_collection.find_one({"email": data.email.lower()})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user = {
        "id": str(uuid.uuid4()),
        "email": data.email.lower(),
        "password": hash_password(data.password),
        "name": data.name,
        "subscription": None,
        "downloadsUsed": 0,
        "downloadsReset": None,
        "preferences": {
            "saveDocuments": data.saveDocuments if data.saveDocuments else False
        },
        "createdAt": datetime.now(timezone.utc).isoformat()
    }
    await users_collection.insert_one(user)
    
    # Create session
    token = generate_session_token()
    session = {
        "id": str(uuid.uuid4()),
        "token": token,
        "userId": user["id"],
        "email": user["email"],
        "type": "user",
        "createdAt": datetime.now(timezone.utc).isoformat()
    }
    await sessions_collection.insert_one(session)
    
    return {
        "success": True,
        "token": token,
        "user": {
            "id": user["id"],
            "email": user["email"],
            "name": user["name"],
            "subscription": None,
            "preferences": user["preferences"]
        }
    }

@app.post("/api/user/login")
async def user_login(data: UserLogin, request: Request):
    """User login endpoint with rate limiting"""
    # Get client IP for rate limiting
    client_ip = request.client.host if request.client else "unknown"
    
    # Rate limit: 5 login attempts per minute per IP
    if not check_rate_limit(f"user_login_{client_ip}", max_requests=5, window_seconds=60):
        raise HTTPException(status_code=429, detail="Too many login attempts. Please try again later.")
    
    user = await users_collection.find_one({"email": data.email.lower()}, {"_id": 0})
    
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Check if user is banned
    if user.get("isBanned", False):
        raise HTTPException(status_code=403, detail="Your account has been suspended. Please contact support.")
    
    # Create session
    token = generate_session_token()
    session = {
        "id": str(uuid.uuid4()),
        "token": token,
        "userId": user["id"],
        "email": user["email"],
        "type": "user",
        "createdAt": datetime.now(timezone.utc).isoformat()
    }
    await sessions_collection.insert_one(session)
    
    return {
        "success": True,
        "token": token,
        "user": {
            "id": user["id"],
            "email": user["email"],
            "name": user["name"],
            "subscription": user.get("subscription")
        }
    }

@app.post("/api/user/logout")
async def user_logout(session: dict = Depends(get_current_user)):
    """User logout endpoint"""
    await sessions_collection.delete_one({"token": session["token"]})
    return {"success": True}

@app.get("/api/user/me")
async def get_user_profile(session: dict = Depends(get_current_user)):
    """Get current user profile"""
    user = await users_collection.find_one({"id": session["userId"]}, {"_id": 0, "password": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"success": True, "user": user}


class ChangeUserPassword(BaseModel):
    currentPassword: str
    newPassword: str

@app.put("/api/user/change-password")
async def change_user_password(data: ChangeUserPassword, request: Request, session: dict = Depends(get_current_user)):
    """Change user password (requires current password)"""
    # Get client IP for rate limiting
    client_ip = request.client.host if request.client else "unknown"
    
    # Rate limit: 3 password change attempts per minute
    if not check_rate_limit(f"user_change_password_{client_ip}", max_requests=3, window_seconds=60):
        raise HTTPException(status_code=429, detail="Too many attempts. Please try again later.")
    
    # Get current user with password
    user = await users_collection.find_one({"id": session["userId"]})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Verify current password
    if not verify_password(data.currentPassword, user["password"]):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    
    # Validate new password
    if len(data.newPassword) < 8:
        raise HTTPException(status_code=400, detail="New password must be at least 8 characters")
    
    # Update password
    await users_collection.update_one(
        {"id": session["userId"]},
        {"$set": {
            "password": hash_password(data.newPassword),
            "passwordChangedAt": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {"success": True, "message": "Password changed successfully"}


# ========== USER PREFERENCES ENDPOINTS ==========

@app.put("/api/user/preferences")
async def update_user_preferences(data: UserPreferencesUpdate, session: dict = Depends(get_current_user)):
    """Update user preferences"""
    update_data = {}
    
    if data.saveDocuments is not None:
        update_data["preferences.saveDocuments"] = data.saveDocuments
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No preferences to update")
    
    await users_collection.update_one(
        {"id": session["userId"]},
        {"$set": update_data}
    )
    
    # Get updated user
    user = await users_collection.find_one({"id": session["userId"]}, {"_id": 0, "password": 0})
    
    return {"success": True, "user": user, "message": "Preferences updated successfully"}


# ========== SAVED DOCUMENTS ENDPOINTS ==========

@app.get("/api/user/saved-documents")
async def get_saved_documents(
    session: dict = Depends(get_current_user),
    skip: int = 0,
    limit: int = 20
):
    """Get user's saved documents"""
    user_id = session["userId"]
    
    # Clean up expired documents first
    expiry_date = datetime.now(timezone.utc) - timedelta(days=DOCUMENT_EXPIRY_DAYS)
    expired_docs = await saved_documents_collection.find({
        "userId": user_id,
        "createdAt": {"$lt": expiry_date.isoformat()}
    }).to_list(100)
    
    # Delete expired documents and their files
    for doc in expired_docs:
        file_path = os.path.join(USER_DOCUMENTS_DIR, doc.get("storedFileName", ""))
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
            except:
                pass
        await saved_documents_collection.delete_one({"id": doc["id"]})
    
    # Get saved documents
    documents = await saved_documents_collection.find(
        {"userId": user_id},
        {"_id": 0, "storedFileName": 0}  # Don't expose internal filename
    ).sort("createdAt", -1).skip(skip).limit(limit).to_list(limit)
    
    total = await saved_documents_collection.count_documents({"userId": user_id})
    
    # Add days remaining for each document
    now = datetime.now(timezone.utc)
    for doc in documents:
        created_at = datetime.fromisoformat(doc["createdAt"].replace("Z", "+00:00"))
        expiry_date = created_at + timedelta(days=DOCUMENT_EXPIRY_DAYS)
        days_remaining = (expiry_date - now).days
        doc["daysRemaining"] = max(0, days_remaining)
        doc["expiresAt"] = expiry_date.isoformat()
    
    # Get user's subscription tier to determine max documents
    user = await users_collection.find_one({"id": user_id}, {"_id": 0})
    subscription_tier = user.get("subscription", {}).get("tier", "starter") if user else "starter"
    max_documents = SAVED_DOCS_LIMITS.get(subscription_tier, 10)
    
    return {
        "success": True,
        "documents": documents,
        "total": total,
        "maxDocuments": max_documents,
        "subscriptionTier": subscription_tier
    }


@app.post("/api/user/saved-documents")
async def save_document(data: SaveDocumentRequest, session: dict = Depends(get_current_user)):
    """Save a document for later access"""
    user_id = session["userId"]
    
    # Check user preference
    user = await users_collection.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if user has save documents enabled
    if not user.get("preferences", {}).get("saveDocuments", False):
        raise HTTPException(status_code=400, detail="Document saving is not enabled. Enable it in your settings.")
    
    # Get user's subscription tier to determine max documents
    subscription_tier = user.get("subscription", {}).get("tier", "starter") if user.get("subscription") else None
    if not subscription_tier:
        raise HTTPException(status_code=400, detail="Active subscription required to save documents.")
    
    max_documents = SAVED_DOCS_LIMITS.get(subscription_tier, 10)
    
    # Check document count limit (skip if unlimited)
    doc_count = await saved_documents_collection.count_documents({"userId": user_id})
    if max_documents != -1 and doc_count >= max_documents:
        raise HTTPException(
            status_code=400, 
            detail=f"Maximum saved documents limit ({max_documents}) reached for your {subscription_tier.capitalize()} plan. Delete some documents to save new ones."
        )
    
    # Decode base64 file data
    try:
        file_content = base64.b64decode(data.fileData)
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid file data")
    
    # Generate unique filename
    file_ext = os.path.splitext(data.fileName)[1] or ".pdf"
    stored_filename = f"{user_id}_{uuid.uuid4()}{file_ext}"
    file_path = os.path.join(USER_DOCUMENTS_DIR, stored_filename)
    
    # Save file
    try:
        with open(file_path, "wb") as f:
            f.write(file_content)
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to save document")
    
    # Create document record
    doc_id = str(uuid.uuid4())
    document = {
        "id": doc_id,
        "userId": user_id,
        "documentType": data.documentType,
        "fileName": data.fileName,
        "storedFileName": stored_filename,
        "fileSize": len(file_content),
        "template": data.template,
        "createdAt": datetime.now(timezone.utc).isoformat()
    }
    
    await saved_documents_collection.insert_one(document)
    
    # Calculate expiry info
    expiry_date = datetime.now(timezone.utc) + timedelta(days=DOCUMENT_EXPIRY_DAYS)
    
    return {
        "success": True,
        "document": {
            "id": doc_id,
            "documentType": data.documentType,
            "fileName": data.fileName,
            "fileSize": len(file_content),
            "template": data.template,
            "createdAt": document["createdAt"],
            "daysRemaining": DOCUMENT_EXPIRY_DAYS,
            "expiresAt": expiry_date.isoformat()
        },
        "message": f"Document saved. It will be available for {DOCUMENT_EXPIRY_DAYS} days."
    }


@app.get("/api/user/saved-documents/{doc_id}/download")
async def download_saved_document(doc_id: str, session: dict = Depends(get_current_user)):
    """Download a saved document"""
    from fastapi.responses import FileResponse
    
    user_id = session["userId"]
    
    # Find document
    document = await saved_documents_collection.find_one({
        "id": doc_id,
        "userId": user_id
    })
    
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Check if expired
    created_at = datetime.fromisoformat(document["createdAt"].replace("Z", "+00:00"))
    if datetime.now(timezone.utc) - created_at > timedelta(days=DOCUMENT_EXPIRY_DAYS):
        # Delete expired document
        file_path = os.path.join(USER_DOCUMENTS_DIR, document["storedFileName"])
        if os.path.exists(file_path):
            os.remove(file_path)
        await saved_documents_collection.delete_one({"id": doc_id})
        raise HTTPException(status_code=404, detail="Document has expired and been deleted")
    
    # Get file path
    file_path = os.path.join(USER_DOCUMENTS_DIR, document["storedFileName"])
    
    if not os.path.exists(file_path):
        await saved_documents_collection.delete_one({"id": doc_id})
        raise HTTPException(status_code=404, detail="Document file not found")
    
    # Determine media type
    file_ext = os.path.splitext(document["fileName"])[1].lower()
    media_types = {
        ".pdf": "application/pdf",
        ".zip": "application/zip"
    }
    media_type = media_types.get(file_ext, "application/octet-stream")
    
    return FileResponse(
        path=file_path,
        filename=document["fileName"],
        media_type=media_type
    )


@app.delete("/api/user/saved-documents/{doc_id}")
async def delete_saved_document(doc_id: str, session: dict = Depends(get_current_user)):
    """Delete a saved document"""
    user_id = session["userId"]
    
    # Find document
    document = await saved_documents_collection.find_one({
        "id": doc_id,
        "userId": user_id
    })
    
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Delete file
    file_path = os.path.join(USER_DOCUMENTS_DIR, document["storedFileName"])
    if os.path.exists(file_path):
        try:
            os.remove(file_path)
        except:
            pass
    
    # Delete record
    await saved_documents_collection.delete_one({"id": doc_id})
    
    return {"success": True, "message": "Document deleted successfully"}


@app.get("/api/user/saved-documents/count")
async def get_saved_documents_count(session: dict = Depends(get_current_user)):
    """Get count of saved documents for current user"""
    user_id = session["userId"]
    count = await saved_documents_collection.count_documents({"userId": user_id})
    
    # Get user's subscription tier to determine max documents
    user = await users_collection.find_one({"id": user_id}, {"_id": 0})
    subscription_tier = user.get("subscription", {}).get("tier", "starter") if user and user.get("subscription") else "starter"
    max_documents = SAVED_DOCS_LIMITS.get(subscription_tier, 10)
    
    remaining = "unlimited" if max_documents == -1 else max(0, max_documents - count)
    
    return {
        "success": True,
        "count": count,
        "maxDocuments": max_documents,
        "remaining": remaining,
        "subscriptionTier": subscription_tier
    }



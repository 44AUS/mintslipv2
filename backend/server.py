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

# PayPal Configuration
PAYPAL_CLIENT_ID = os.environ.get("PAYPAL_CLIENT_ID")
PAYPAL_SECRET = os.environ.get("PAYPAL_SECRET")
PAYPAL_MODE = os.environ.get("PAYPAL_MODE", "sandbox")
PAYPAL_API_BASE = "https://api-m.sandbox.paypal.com" if PAYPAL_MODE == "sandbox" else "https://api-m.paypal.com"

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
        "downloads": 10,
        "paypalPlanId": ""  # To be filled with PayPal plan ID
    },
    "professional": {
        "name": "Professional", 
        "price": 29.99,
        "downloads": 30,
        "paypalPlanId": ""
    },
    "business": {
        "name": "Business",
        "price": 49.99,
        "downloads": -1,  # -1 means unlimited
        "paypalPlanId": ""
    }
}

class SubscriptionCreate(BaseModel):
    userId: str
    tier: str  # starter, professional, business
    paypalSubscriptionId: str
    paypalEmail: str

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


# ========== PAYPAL SUBSCRIPTION ENDPOINTS ==========

# Subscription Plans Configuration
SUBSCRIPTION_PLANS = {
    "starter": {
        "name": "Starter",
        "price": "19.99",
        "downloads": 10,
        "description": "10 downloads per month"
    },
    "professional": {
        "name": "Professional", 
        "price": "29.99",
        "downloads": 30,
        "description": "30 downloads per month"
    },
    "business": {
        "name": "Business",
        "price": "49.99",
        "downloads": -1,  # -1 means unlimited
        "description": "Unlimited downloads"
    }
}

# Store for PayPal Plan IDs (will be populated when plans are created)
paypal_plan_ids = {}

async def get_paypal_access_token():
    """Get PayPal OAuth access token"""
    auth = base64.b64encode(f"{PAYPAL_CLIENT_ID}:{PAYPAL_SECRET}".encode()).decode()
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{PAYPAL_API_BASE}/v1/oauth2/token",
            headers={
                "Authorization": f"Basic {auth}",
                "Content-Type": "application/x-www-form-urlencoded"
            },
            data={"grant_type": "client_credentials"}
        )
        
        if response.status_code != 200:
            raise HTTPException(status_code=500, detail="Failed to get PayPal access token")
        
        return response.json()["access_token"]


async def create_paypal_product():
    """Create a PayPal product for subscriptions"""
    access_token = await get_paypal_access_token()
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{PAYPAL_API_BASE}/v1/catalogs/products",
            headers={
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json"
            },
            json={
                "name": "MintSlip Subscription",
                "description": "Monthly subscription for MintSlip document generator",
                "type": "SERVICE",
                "category": "SOFTWARE"
            }
        )
        
        if response.status_code not in [200, 201]:
            print(f"Error creating product: {response.text}")
            raise HTTPException(status_code=500, detail="Failed to create PayPal product")
        
        return response.json()["id"]


async def create_paypal_plan(product_id: str, tier: str):
    """Create a PayPal subscription plan"""
    plan_config = SUBSCRIPTION_PLANS[tier]
    access_token = await get_paypal_access_token()
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{PAYPAL_API_BASE}/v1/billing/plans",
            headers={
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json"
            },
            json={
                "product_id": product_id,
                "name": f"MintSlip {plan_config['name']} Plan",
                "description": plan_config["description"],
                "billing_cycles": [
                    {
                        "frequency": {
                            "interval_unit": "MONTH",
                            "interval_count": 1
                        },
                        "tenure_type": "REGULAR",
                        "sequence": 1,
                        "total_cycles": 0,  # 0 = infinite
                        "pricing_scheme": {
                            "fixed_price": {
                                "value": plan_config["price"],
                                "currency_code": "USD"
                            }
                        }
                    }
                ],
                "payment_preferences": {
                    "auto_bill_outstanding": True,
                    "setup_fee": {
                        "value": "0",
                        "currency_code": "USD"
                    },
                    "setup_fee_failure_action": "CONTINUE",
                    "payment_failure_threshold": 3
                }
            }
        )
        
        if response.status_code not in [200, 201]:
            print(f"Error creating plan: {response.text}")
            raise HTTPException(status_code=500, detail=f"Failed to create PayPal plan for {tier}")
        
        return response.json()["id"]


@app.post("/api/subscriptions/setup-plans")
async def setup_paypal_plans(session: dict = Depends(get_current_admin)):
    """Setup PayPal subscription plans (admin only, run once)"""
    global paypal_plan_ids
    
    try:
        # Create product first
        product_id = await create_paypal_product()
        
        # Create plans for each tier
        for tier in SUBSCRIPTION_PLANS.keys():
            plan_id = await create_paypal_plan(product_id, tier)
            paypal_plan_ids[tier] = plan_id
            
            # Store in database for persistence
            await db["paypal_plans"].update_one(
                {"tier": tier},
                {"$set": {"plan_id": plan_id, "product_id": product_id}},
                upsert=True
            )
        
        return {
            "success": True,
            "message": "PayPal plans created successfully",
            "plans": paypal_plan_ids
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/subscriptions/plans")
async def get_subscription_plans():
    """Get available subscription plans with PayPal plan IDs"""
    # Load plan IDs from database
    plans_from_db = await db["paypal_plans"].find({}).to_list(length=10)
    plan_id_map = {p["tier"]: p["plan_id"] for p in plans_from_db}
    
    plans = []
    for tier, config in SUBSCRIPTION_PLANS.items():
        plans.append({
            "tier": tier,
            "name": config["name"],
            "price": config["price"],
            "downloads": config["downloads"],
            "description": config["description"],
            "paypal_plan_id": plan_id_map.get(tier)
        })
    
    return {"success": True, "plans": plans}


class CreateSubscriptionRequest(BaseModel):
    tier: str

@app.post("/api/subscriptions/create")
async def create_subscription(data: CreateSubscriptionRequest, session: dict = Depends(get_current_user)):
    """Create a PayPal subscription for the user"""
    if data.tier not in SUBSCRIPTION_PLANS:
        raise HTTPException(status_code=400, detail="Invalid subscription tier")
    
    # Get the plan ID from database
    plan_record = await db["paypal_plans"].find_one({"tier": data.tier})
    if not plan_record:
        raise HTTPException(status_code=400, detail="Subscription plans not set up. Please contact admin.")
    
    plan_id = plan_record["plan_id"]
    access_token = await get_paypal_access_token()
    
    # Get user info
    user = await users_collection.find_one({"id": session["userId"]})
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{PAYPAL_API_BASE}/v1/billing/subscriptions",
            headers={
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json"
            },
            json={
                "plan_id": plan_id,
                "subscriber": {
                    "name": {
                        "given_name": user.get("name", "").split()[0] if user.get("name") else "User",
                        "surname": " ".join(user.get("name", "").split()[1:]) if user.get("name") and len(user.get("name", "").split()) > 1 else ""
                    },
                    "email_address": user.get("email", "")
                },
                "application_context": {
                    "brand_name": "MintSlip",
                    "locale": "en-US",
                    "shipping_preference": "NO_SHIPPING",
                    "user_action": "SUBSCRIBE_NOW",
                    "return_url": f"{os.environ.get('FRONTEND_URL', 'http://mintslip.com')}/subscription/success",
                    "cancel_url": f"{os.environ.get('FRONTEND_URL', 'http://mintslip.com')}/subscription/cancel"
                }
            }
        )
        
        if response.status_code not in [200, 201]:
            print(f"Error creating subscription: {response.text}")
            raise HTTPException(status_code=500, detail="Failed to create subscription")
        
        subscription_data = response.json()
        
        # Find the approval link
        approval_url = None
        for link in subscription_data.get("links", []):
            if link["rel"] == "approve":
                approval_url = link["href"]
                break
        
        # Store pending subscription
        await db["pending_subscriptions"].insert_one({
            "id": subscription_data["id"],
            "user_id": session["userId"],
            "tier": data.tier,
            "status": "PENDING",
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        
        return {
            "success": True,
            "subscription_id": subscription_data["id"],
            "approval_url": approval_url
        }


@app.post("/api/subscriptions/activate")
async def activate_subscription(subscription_id: str, session: dict = Depends(get_current_user)):
    """Activate a subscription after PayPal approval"""
    # Get pending subscription
    pending = await db["pending_subscriptions"].find_one({
        "id": subscription_id,
        "user_id": session["userId"]
    })
    
    if not pending:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    access_token = await get_paypal_access_token()
    
    # Get subscription details from PayPal
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{PAYPAL_API_BASE}/v1/billing/subscriptions/{subscription_id}",
            headers={
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json"
            }
        )
        
        if response.status_code != 200:
            raise HTTPException(status_code=500, detail="Failed to verify subscription")
        
        sub_data = response.json()
        
        if sub_data["status"] != "ACTIVE":
            raise HTTPException(status_code=400, detail=f"Subscription is not active. Status: {sub_data['status']}")
    
    # Get plan config
    tier = pending["tier"]
    plan_config = SUBSCRIPTION_PLANS[tier]
    
    # Update user with subscription
    subscription_info = {
        "tier": tier,
        "paypal_subscription_id": subscription_id,
        "status": "active",
        "downloads_remaining": plan_config["downloads"],
        "downloads_total": plan_config["downloads"],
        "started_at": datetime.now(timezone.utc).isoformat(),
        "current_period_end": (datetime.now(timezone.utc) + timedelta(days=30)).isoformat()
    }
    
    await users_collection.update_one(
        {"id": session["userId"]},
        {"$set": {"subscription": subscription_info}}
    )
    
    # Remove pending subscription
    await db["pending_subscriptions"].delete_one({"id": subscription_id})
    
    # Get updated user
    user = await users_collection.find_one({"id": session["userId"]}, {"_id": 0, "password": 0})
    
    return {
        "success": True,
        "message": "Subscription activated successfully",
        "user": user
    }


@app.post("/api/subscriptions/cancel")
async def cancel_subscription(session: dict = Depends(get_current_user)):
    """Cancel user's PayPal subscription"""
    user = await users_collection.find_one({"id": session["userId"]})
    
    if not user or not user.get("subscription"):
        raise HTTPException(status_code=400, detail="No active subscription found")
    
    subscription_id = user["subscription"].get("paypal_subscription_id")
    if not subscription_id:
        raise HTTPException(status_code=400, detail="No PayPal subscription ID found")
    
    access_token = await get_paypal_access_token()
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{PAYPAL_API_BASE}/v1/billing/subscriptions/{subscription_id}/cancel",
            headers={
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json"
            },
            json={"reason": "User requested cancellation"}
        )
        
        if response.status_code not in [200, 204]:
            print(f"Error cancelling subscription: {response.text}")
            raise HTTPException(status_code=500, detail="Failed to cancel subscription")
    
    # Update user subscription status
    await users_collection.update_one(
        {"id": session["userId"]},
        {"$set": {
            "subscription.status": "cancelled",
            "subscription.cancelled_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {"success": True, "message": "Subscription cancelled successfully"}


class UpgradeSubscriptionRequest(BaseModel):
    newTier: str


@app.post("/api/subscriptions/calculate-upgrade")
async def calculate_upgrade_cost(data: UpgradeSubscriptionRequest, session: dict = Depends(get_current_user)):
    """Calculate the prorated cost for upgrading subscription"""
    user = await users_collection.find_one({"id": session["userId"]})
    
    if not user or not user.get("subscription"):
        raise HTTPException(status_code=400, detail="No active subscription found")
    
    current_subscription = user["subscription"]
    current_tier = current_subscription.get("tier")
    new_tier = data.newTier
    
    if new_tier not in SUBSCRIPTION_PLANS:
        raise HTTPException(status_code=400, detail="Invalid subscription tier")
    
    if current_tier == new_tier:
        raise HTTPException(status_code=400, detail="Already on this plan")
    
    # Get prices
    current_price = float(SUBSCRIPTION_PLANS.get(current_tier, {}).get("price", "0"))
    new_price = float(SUBSCRIPTION_PLANS[new_tier]["price"])
    
    # Only allow upgrades (new price > current price)
    if new_price <= current_price:
        raise HTTPException(status_code=400, detail="Can only upgrade to a higher tier. Use downgrade endpoint for lower tiers.")
    
    # Calculate days remaining in current billing cycle
    current_period_end = current_subscription.get("current_period_end")
    if current_period_end:
        period_end = datetime.fromisoformat(current_period_end.replace('Z', '+00:00'))
        now = datetime.now(timezone.utc)
        days_remaining = max(0, (period_end - now).days)
    else:
        days_remaining = 30  # Default to full month if no end date
    
    # Calculate prorated amount
    # Price difference per day * days remaining
    daily_difference = (new_price - current_price) / 30
    prorated_amount = round(daily_difference * days_remaining, 2)
    
    return {
        "success": True,
        "currentTier": current_tier,
        "newTier": new_tier,
        "currentPrice": current_price,
        "newPrice": new_price,
        "daysRemaining": days_remaining,
        "proratedAmount": prorated_amount,
        "newDownloads": SUBSCRIPTION_PLANS[new_tier]["downloads"]
    }


@app.post("/api/subscriptions/upgrade/create-order")
async def create_upgrade_order(data: UpgradeSubscriptionRequest, session: dict = Depends(get_current_user)):
    """Create a PayPal order for the prorated upgrade amount"""
    user = await users_collection.find_one({"id": session["userId"]})
    
    if not user or not user.get("subscription"):
        raise HTTPException(status_code=400, detail="No active subscription found")
    
    current_subscription = user["subscription"]
    current_tier = current_subscription.get("tier")
    new_tier = data.newTier
    
    if new_tier not in SUBSCRIPTION_PLANS:
        raise HTTPException(status_code=400, detail="Invalid subscription tier")
    
    # Get prices
    current_price = float(SUBSCRIPTION_PLANS.get(current_tier, {}).get("price", "0"))
    new_price = float(SUBSCRIPTION_PLANS[new_tier]["price"])
    
    if new_price <= current_price:
        raise HTTPException(status_code=400, detail="Can only upgrade to a higher tier")
    
    # Calculate prorated amount
    current_period_end = current_subscription.get("current_period_end")
    if current_period_end:
        period_end = datetime.fromisoformat(current_period_end.replace('Z', '+00:00'))
        now = datetime.now(timezone.utc)
        days_remaining = max(0, (period_end - now).days)
    else:
        days_remaining = 30
    
    daily_difference = (new_price - current_price) / 30
    prorated_amount = round(daily_difference * days_remaining, 2)
    
    # Minimum charge of $1.00 (PayPal requirement)
    if prorated_amount < 1.00:
        prorated_amount = 1.00
    
    access_token = await get_paypal_access_token()
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{PAYPAL_API_BASE}/v2/checkout/orders",
            headers={
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json"
            },
            json={
                "intent": "CAPTURE",
                "purchase_units": [{
                    "amount": {
                        "currency_code": "USD",
                        "value": str(prorated_amount)
                    },
                    "description": f"Upgrade from {SUBSCRIPTION_PLANS.get(current_tier, {}).get('name', current_tier)} to {SUBSCRIPTION_PLANS[new_tier]['name']} (prorated)"
                }],
                "application_context": {
                    "brand_name": "MintSlip",
                    "landing_page": "NO_PREFERENCE",
                    "user_action": "PAY_NOW",
                    "return_url": f"{os.environ.get('FRONTEND_URL', 'http://mintslip.com')}/subscription/upgrade/success",
                    "cancel_url": f"{os.environ.get('FRONTEND_URL', 'http://mintslip.com')}/subscription/upgrade/cancel"
                }
            }
        )
        
        if response.status_code not in [200, 201]:
            print(f"Error creating upgrade order: {response.text}")
            raise HTTPException(status_code=500, detail="Failed to create upgrade order")
        
        order_data = response.json()
        
        # Store pending upgrade
        await db["pending_upgrades"].insert_one({
            "order_id": order_data["id"],
            "user_id": session["userId"],
            "current_tier": current_tier,
            "new_tier": new_tier,
            "prorated_amount": prorated_amount,
            "days_remaining": days_remaining,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        
        # Get approval URL
        approval_url = None
        for link in order_data.get("links", []):
            if link.get("rel") == "approve":
                approval_url = link.get("href")
                break
        
        return {
            "success": True,
            "orderId": order_data["id"],
            "approvalUrl": approval_url,
            "proratedAmount": prorated_amount
        }


@app.post("/api/subscriptions/upgrade/capture")
async def capture_upgrade_order(order_id: str, session: dict = Depends(get_current_user)):
    """Capture the upgrade payment and update subscription"""
    # Get pending upgrade
    pending = await db["pending_upgrades"].find_one({
        "order_id": order_id,
        "user_id": session["userId"]
    })
    
    if not pending:
        raise HTTPException(status_code=404, detail="Upgrade order not found")
    
    access_token = await get_paypal_access_token()
    
    # Capture the payment
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{PAYPAL_API_BASE}/v2/checkout/orders/{order_id}/capture",
            headers={
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json"
            }
        )
        
        if response.status_code not in [200, 201]:
            print(f"Error capturing upgrade payment: {response.text}")
            raise HTTPException(status_code=500, detail="Failed to capture upgrade payment")
        
        capture_data = response.json()
        
        if capture_data.get("status") != "COMPLETED":
            raise HTTPException(status_code=400, detail="Payment was not completed")
    
    new_tier = pending["new_tier"]
    plan_config = SUBSCRIPTION_PLANS[new_tier]
    
    # Get current user subscription to preserve period end
    user = await users_collection.find_one({"id": session["userId"]})
    current_subscription = user.get("subscription", {})
    
    # Update user subscription to new tier
    # Keep the same billing period end, just upgrade the tier and reset downloads
    updated_subscription = {
        "tier": new_tier,
        "paypal_subscription_id": current_subscription.get("paypal_subscription_id"),
        "status": "active",
        "downloads_remaining": plan_config["downloads"],
        "downloads_total": plan_config["downloads"],
        "started_at": current_subscription.get("started_at"),
        "current_period_end": current_subscription.get("current_period_end"),
        "upgraded_at": datetime.now(timezone.utc).isoformat(),
        "upgraded_from": pending["current_tier"]
    }
    
    await users_collection.update_one(
        {"id": session["userId"]},
        {"$set": {"subscription": updated_subscription}}
    )
    
    # Record the upgrade payment
    upgrade_record = {
        "id": str(uuid.uuid4()),
        "user_id": session["userId"],
        "order_id": order_id,
        "from_tier": pending["current_tier"],
        "to_tier": new_tier,
        "prorated_amount": pending["prorated_amount"],
        "status": "completed",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db["subscription_upgrades"].insert_one(upgrade_record)
    
    # Remove pending upgrade
    await db["pending_upgrades"].delete_one({"order_id": order_id})
    
    # Get updated user
    user = await users_collection.find_one({"id": session["userId"]}, {"_id": 0, "password": 0})
    
    return {
        "success": True,
        "message": f"Successfully upgraded to {plan_config['name']}",
        "user": user
    }



async def paypal_webhook(request: Request):
    """Handle PayPal webhooks for subscription events"""
    try:
        body = await request.json()
        event_type = body.get("event_type", "")
        resource = body.get("resource", {})
        
        print(f"PayPal Webhook: {event_type}")
        
        if event_type == "BILLING.SUBSCRIPTION.ACTIVATED":
            subscription_id = resource.get("id")
            # Find user with this subscription
            user = await users_collection.find_one({
                "subscription.paypal_subscription_id": subscription_id
            })
            if user:
                await users_collection.update_one(
                    {"id": user["id"]},
                    {"$set": {"subscription.status": "active"}}
                )
        
        elif event_type == "BILLING.SUBSCRIPTION.CANCELLED":
            subscription_id = resource.get("id")
            user = await users_collection.find_one({
                "subscription.paypal_subscription_id": subscription_id
            })
            if user:
                await users_collection.update_one(
                    {"id": user["id"]},
                    {"$set": {"subscription.status": "cancelled"}}
                )
        
        elif event_type == "BILLING.SUBSCRIPTION.SUSPENDED":
            subscription_id = resource.get("id")
            user = await users_collection.find_one({
                "subscription.paypal_subscription_id": subscription_id
            })
            if user:
                await users_collection.update_one(
                    {"id": user["id"]},
                    {"$set": {"subscription.status": "suspended"}}
                )
        
        elif event_type == "PAYMENT.SALE.COMPLETED":
            # Subscription payment received - reset downloads
            subscription_id = resource.get("billing_agreement_id")
            user = await users_collection.find_one({
                "subscription.paypal_subscription_id": subscription_id
            })
            if user and user.get("subscription"):
                tier = user["subscription"].get("tier")
                plan_config = SUBSCRIPTION_PLANS.get(tier, {})
                await users_collection.update_one(
                    {"id": user["id"]},
                    {"$set": {
                        "subscription.downloads_remaining": plan_config.get("downloads", 0),
                        "subscription.current_period_end": (datetime.now(timezone.utc) + timedelta(days=30)).isoformat()
                    }}
                )
        
        return {"status": "received"}
    except Exception as e:
        print(f"Webhook error: {str(e)}")
        return {"status": "error", "message": str(e)}


# ========== PURCHASE TRACKING ENDPOINTS ==========

@app.post("/api/purchases/track")
async def track_purchase(data: PurchaseCreate):
    """Track a purchase"""
    purchase = {
        "id": str(uuid.uuid4()),
        "documentType": data.documentType,
        "amount": data.amount,
        "paypalEmail": data.paypalEmail,
        "paypalTransactionId": data.paypalTransactionId,
        "discountCode": data.discountCode,
        "discountAmount": data.discountAmount,
        "userId": data.userId,
        "template": data.template,
        "createdAt": datetime.now(timezone.utc).isoformat(),
        "downloadedAt": datetime.now(timezone.utc).isoformat()
    }
    await purchases_collection.insert_one(purchase)
    
    # If user has subscription, decrement downloads
    if data.userId:
        user = await users_collection.find_one({"id": data.userId})
        if user and user.get("subscription"):
            tier = SUBSCRIPTION_TIERS.get(user["subscription"]["tier"])
            if tier and tier["downloads"] != -1:  # Not unlimited
                await users_collection.update_one(
                    {"id": data.userId},
                    {"$inc": {"downloadsUsed": 1}}
                )
    
    return {"success": True, "purchaseId": purchase["id"]}

@app.get("/api/admin/purchases")
async def get_all_purchases(
    session: dict = Depends(get_current_admin),
    skip: int = 0,
    limit: int = 50,
    documentType: Optional[str] = None,
    startDate: Optional[str] = None,
    endDate: Optional[str] = None
):
    """Get all purchases (admin only)"""
    query = {}
    
    if documentType:
        query["documentType"] = documentType
    
    if startDate:
        query["createdAt"] = {"$gte": startDate}
    
    if endDate:
        if "createdAt" in query:
            query["createdAt"]["$lte"] = endDate
        else:
            query["createdAt"] = {"$lte": endDate}
    
    purchases = await purchases_collection.find(query, {"_id": 0}).sort("createdAt", -1).skip(skip).limit(limit).to_list(limit)
    total = await purchases_collection.count_documents(query)
    
    return {
        "success": True,
        "purchases": purchases,
        "total": total,
        "skip": skip,
        "limit": limit
    }

@app.get("/api/admin/dashboard")
async def get_admin_dashboard(session: dict = Depends(get_current_admin)):
    """Get admin dashboard data"""
    # Total purchases
    total_purchases = await purchases_collection.count_documents({})
    
    # Total revenue
    pipeline = [
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
    ]
    revenue_result = await purchases_collection.aggregate(pipeline).to_list(1)
    total_revenue = revenue_result[0]["total"] if revenue_result else 0
    
    # Purchases by document type
    type_pipeline = [
        {"$group": {"_id": "$documentType", "count": {"$sum": 1}, "revenue": {"$sum": "$amount"}}}
    ]
    purchases_by_type = await purchases_collection.aggregate(type_pipeline).to_list(100)
    
    # Recent purchases (last 10)
    recent_purchases = await purchases_collection.find({}, {"_id": 0}).sort("createdAt", -1).limit(10).to_list(10)
    
    # Total subscribers
    total_subscribers = await users_collection.count_documents({"subscription": {"$ne": None}})
    
    # Total users
    total_users = await users_collection.count_documents({})
    
    # Today's purchases
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
    today_purchases = await purchases_collection.count_documents({"createdAt": {"$gte": today_start}})
    
    # Today's revenue
    today_revenue_pipeline = [
        {"$match": {"createdAt": {"$gte": today_start}}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
    ]
    today_revenue_result = await purchases_collection.aggregate(today_revenue_pipeline).to_list(1)
    today_revenue = today_revenue_result[0]["total"] if today_revenue_result else 0
    
    return {
        "success": True,
        "stats": {
            "totalPurchases": total_purchases,
            "totalRevenue": round(total_revenue, 2),
            "totalSubscribers": total_subscribers,
            "totalUsers": total_users,
            "todayPurchases": today_purchases,
            "todayRevenue": round(today_revenue, 2)
        },
        "purchasesByType": purchases_by_type,
        "recentPurchases": recent_purchases
    }

@app.get("/api/admin/users")
async def get_all_users(
    session: dict = Depends(get_current_admin),
    skip: int = 0,
    limit: int = 50
):
    """Get all users (admin only)"""
    users = await users_collection.find({}, {"_id": 0, "password": 0}).sort("createdAt", -1).skip(skip).limit(limit).to_list(limit)
    total = await users_collection.count_documents({})
    
    return {
        "success": True,
        "users": users,
        "total": total
    }

@app.get("/api/admin/revenue")
async def get_revenue_by_period(
    session: dict = Depends(get_current_admin),
    startDate: Optional[str] = None,
    endDate: Optional[str] = None
):
    """Get revenue for a specific period (admin only)"""
    query = {}
    
    if startDate:
        query["createdAt"] = {"$gte": startDate}
    
    if endDate:
        if "createdAt" in query:
            query["createdAt"]["$lte"] = endDate
        else:
            query["createdAt"] = {"$lte": endDate}
    
    # Calculate revenue
    pipeline = [
        {"$match": query} if query else {"$match": {}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}, "count": {"$sum": 1}}}
    ]
    
    result = await purchases_collection.aggregate(pipeline).to_list(1)
    
    return {
        "success": True,
        "revenue": round(result[0]["total"], 2) if result else 0,
        "purchaseCount": result[0]["count"] if result else 0,
        "period": {
            "startDate": startDate,
            "endDate": endDate
        }
    }

# ========== SUBSCRIPTION ENDPOINTS ==========

@app.get("/api/subscription/tiers")
async def get_subscription_tiers():
    """Get available subscription tiers"""
    return {
        "success": True,
        "tiers": SUBSCRIPTION_TIERS
    }

@app.post("/api/subscription/create")
async def create_subscription(data: SubscriptionCreate, session: dict = Depends(get_current_user)):
    """Create a subscription for a user"""
    if data.tier not in SUBSCRIPTION_TIERS:
        raise HTTPException(status_code=400, detail="Invalid subscription tier")
    
    subscription = {
        "id": str(uuid.uuid4()),
        "userId": data.userId,
        "tier": data.tier,
        "paypalSubscriptionId": data.paypalSubscriptionId,
        "paypalEmail": data.paypalEmail,
        "status": "active",
        "createdAt": datetime.now(timezone.utc).isoformat(),
        "currentPeriodStart": datetime.now(timezone.utc).isoformat(),
        "currentPeriodEnd": None  # Will be updated by PayPal webhook
    }
    
    await subscriptions_collection.insert_one(subscription)
    
    # Update user with subscription
    await users_collection.update_one(
        {"id": data.userId},
        {
            "$set": {
                "subscription": {
                    "id": subscription["id"],
                    "tier": data.tier,
                    "status": "active"
                },
                "downloadsUsed": 0,
                "downloadsReset": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    return {"success": True, "subscriptionId": subscription["id"]}

# ========== SUBSCRIPTION DOWNLOAD ENDPOINT ==========

class SubscriptionDownloadRequest(BaseModel):
    documentType: str  # paystub, w9, 1099-nec, etc.
    template: Optional[str] = None  # Template used (for paystubs)
    count: int = 1  # Number of documents being downloaded (for paystubs with multiple stubs)


@app.post("/api/user/subscription-download")
async def subscription_download(data: SubscriptionDownloadRequest, session: dict = Depends(get_current_user)):
    """
    Validate and track a subscription-based download.
    Returns success if user can download, decrements remaining count.
    Supports downloading multiple documents at once (e.g., multiple paystubs).
    """
    user = await users_collection.find_one({"id": session["userId"]}, {"_id": 0})
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if user has active subscription
    subscription = user.get("subscription")
    if not subscription or subscription.get("status") != "active":
        raise HTTPException(status_code=403, detail="No active subscription found. Please subscribe to download.")
    
    # Get subscription tier config
    tier = subscription.get("tier")
    
    # Try SUBSCRIPTION_PLANS first (for PayPal subscriptions), then SUBSCRIPTION_TIERS (for admin-assigned)
    plan_config = SUBSCRIPTION_PLANS.get(tier) or SUBSCRIPTION_TIERS.get(tier)
    
    if not plan_config:
        raise HTTPException(status_code=400, detail="Invalid subscription tier")
    
    # Validate count
    download_count = max(1, data.count)  # Minimum 1 download
    
    # Check downloads remaining
    downloads_remaining = subscription.get("downloads_remaining", 0)
    
    # -1 means unlimited
    if downloads_remaining != -1:
        if downloads_remaining <= 0:
            raise HTTPException(
                status_code=403, 
                detail="No downloads remaining this month. Please upgrade your plan or wait for the next billing cycle."
            )
        
        if downloads_remaining < download_count:
            raise HTTPException(
                status_code=403, 
                detail=f"Not enough downloads remaining. You have {downloads_remaining} downloads left but are trying to download {download_count} documents."
            )
        
        # Decrement downloads remaining by the count
        new_remaining = downloads_remaining - download_count
        await users_collection.update_one(
            {"id": session["userId"]},
            {"$set": {"subscription.downloads_remaining": new_remaining}}
        )
    else:
        new_remaining = -1  # Still unlimited
    
    # Track the download in purchases collection (with $0 amount for subscription)
    purchase = {
        "id": str(uuid.uuid4()),
        "documentType": data.documentType,
        "amount": 0,  # Subscription download = $0
        "paypalEmail": user.get("email", ""),
        "paypalTransactionId": None,
        "discountCode": None,
        "discountAmount": 0,
        "userId": user["id"],
        "template": data.template,
        "subscriptionDownload": True,  # Flag to identify subscription downloads
        "subscriptionTier": tier,
        "downloadCount": download_count,  # Track how many documents were downloaded
        "createdAt": datetime.now(timezone.utc).isoformat(),
        "downloadedAt": datetime.now(timezone.utc).isoformat()
    }
    await purchases_collection.insert_one(purchase)
    
    return {
        "success": True,
        "message": "Download authorized",
        "downloadsRemaining": new_remaining,
        "unlimited": new_remaining == -1,
        "purchaseId": purchase["id"]
    }


@app.get("/api/user/downloads-remaining")
async def get_downloads_remaining(session: dict = Depends(get_current_user)):
    """Get remaining downloads for subscribed user"""
    user = await users_collection.find_one({"id": session["userId"]}, {"_id": 0})
    
    if not user or not user.get("subscription"):
        return {"success": True, "hasSubscription": False, "downloadsRemaining": 0}
    
    subscription = user.get("subscription")
    if subscription.get("status") != "active":
        return {"success": True, "hasSubscription": False, "downloadsRemaining": 0}
    
    # Get downloads_remaining directly from user's subscription
    downloads_remaining = subscription.get("downloads_remaining", 0)
    downloads_total = subscription.get("downloads_total", 0)
    
    # -1 means unlimited
    if downloads_remaining == -1:
        return {"success": True, "hasSubscription": True, "downloadsRemaining": -1, "unlimited": True}
    
    return {
        "success": True,
        "hasSubscription": True,
        "downloadsRemaining": max(0, downloads_remaining),
        "totalDownloads": downloads_total,
        "tier": subscription.get("tier")
    }

@app.get("/api/user/downloads")
async def get_user_downloads(
    session: dict = Depends(get_current_user),
    skip: int = 0,
    limit: int = 20,
    document_type: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
):
    """Get user's download history with optional document type and date filters"""
    # For now, get purchases associated with the user's email or userId
    user = await users_collection.find_one({"id": session["userId"]}, {"_id": 0})
    
    if not user:
        return {"success": True, "downloads": [], "total": 0}
    
    # Query purchases by userId or paypal email
    query = {
        "$or": [
            {"userId": user["id"]},
            {"paypalEmail": user["email"]}
        ]
    }
    
    # Add document type filter if provided
    if document_type and document_type != "all":
        query["documentType"] = document_type
    
    # Add date range filters if provided
    if start_date or end_date:
        date_filter = {}
        if start_date:
            # Start of the day
            date_filter["$gte"] = f"{start_date}T00:00:00"
        if end_date:
            # End of the day
            date_filter["$lte"] = f"{end_date}T23:59:59"
        if date_filter:
            query["createdAt"] = date_filter
    
    downloads = await purchases_collection.find(query, {"_id": 0}).sort("createdAt", -1).skip(skip).limit(limit).to_list(limit)
    total = await purchases_collection.count_documents(query)
    
    return {
        "success": True,
        "downloads": downloads,
        "total": total
    }

# ========== DELETE ENDPOINTS ==========

@app.delete("/api/admin/purchases/{purchase_id}")
async def delete_purchase(purchase_id: str, session: dict = Depends(get_current_admin)):
    """Delete a purchase record (admin only)"""
    result = await purchases_collection.delete_one({"id": purchase_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Purchase not found")
    return {"success": True, "message": "Purchase deleted"}

@app.post("/api/admin/purchases")
async def create_manual_purchase(data: ManualPurchaseCreate, session: dict = Depends(get_current_admin)):
    """Manually add a purchase record (admin only) - for historical purchases"""
    # Use provided date or default to now
    if data.purchaseDate:
        try:
            purchase_date = data.purchaseDate
        except:
            purchase_date = datetime.now(timezone.utc).isoformat()
    else:
        purchase_date = datetime.now(timezone.utc).isoformat()
    
    purchase = {
        "id": str(uuid.uuid4()),
        "documentType": data.documentType,
        "amount": data.amount,
        "paypalEmail": data.paypalEmail,
        "template": data.template,
        "discountCode": data.discountCode,
        "discountAmount": data.discountAmount or 0,
        "notes": data.notes,
        "manualEntry": True,  # Flag to indicate this was manually added
        "addedBy": session.get("adminId"),
        "createdAt": purchase_date
    }
    
    await purchases_collection.insert_one(purchase)
    
    return {"success": True, "message": "Purchase added successfully", "purchase": {k: v for k, v in purchase.items() if k != "_id"}}

@app.put("/api/admin/purchases/{purchase_id}")
async def update_purchase(purchase_id: str, data: ManualPurchaseCreate, session: dict = Depends(get_current_admin)):
    """Update a purchase record (admin only)"""
    existing = await purchases_collection.find_one({"id": purchase_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Purchase not found")
    
    # Use provided date or keep existing
    if data.purchaseDate:
        try:
            purchase_date = data.purchaseDate
        except:
            purchase_date = existing.get("createdAt")
    else:
        purchase_date = existing.get("createdAt")
    
    update_data = {
        "documentType": data.documentType,
        "amount": data.amount,
        "paypalEmail": data.paypalEmail,
        "template": data.template,
        "discountCode": data.discountCode,
        "discountAmount": data.discountAmount or 0,
        "notes": data.notes,
        "createdAt": purchase_date,
        "updatedAt": datetime.now(timezone.utc).isoformat(),
        "updatedBy": session.get("adminId")
    }
    
    await purchases_collection.update_one(
        {"id": purchase_id},
        {"$set": update_data}
    )
    
    return {"success": True, "message": "Purchase updated successfully"}

@app.delete("/api/admin/users/{user_id}")
async def delete_user(user_id: str, session: dict = Depends(get_current_admin)):
    """Delete a user (admin only)"""
    # Delete user's sessions
    await sessions_collection.delete_many({"userId": user_id})
    # Delete user's subscriptions
    await subscriptions_collection.delete_many({"userId": user_id})
    # Delete the user
    result = await users_collection.delete_one({"id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"success": True, "message": "User deleted"}

@app.put("/api/admin/users/{user_id}/ban")
async def ban_user(user_id: str, session: dict = Depends(get_current_admin)):
    """Ban/unban a user (admin only)"""
    user = await users_collection.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    new_status = not user.get("isBanned", False)
    await users_collection.update_one(
        {"id": user_id},
        {"$set": {"isBanned": new_status}}
    )
    
    # If banning, also invalidate their sessions
    if new_status:
        await sessions_collection.delete_many({"userId": user_id})
    
    return {"success": True, "isBanned": new_status}

class UpdateUserSubscription(BaseModel):
    tier: Optional[str] = None  # starter, professional, business, or null to remove

class UpdateUserDownloads(BaseModel):
    downloads_to_add: int  # Number of bonus downloads to add

@app.put("/api/admin/users/{user_id}/subscription")
async def update_user_subscription(user_id: str, data: UpdateUserSubscription, session: dict = Depends(get_current_admin)):
    """Update a user's subscription plan (admin only)"""
    user = await users_collection.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Validate tier if provided
    if data.tier and data.tier not in SUBSCRIPTION_TIERS:
        raise HTTPException(status_code=400, detail="Invalid subscription tier")
    
    if data.tier:
        # Set or update subscription
        tier_config = SUBSCRIPTION_TIERS.get(data.tier)
        if not tier_config:
            raise HTTPException(status_code=400, detail="Invalid subscription tier")
        
        subscription = {
            "id": str(uuid.uuid4()),
            "tier": data.tier,
            "status": "active",
            "adminAssigned": True,
            "downloads_remaining": tier_config["downloads"],
            "downloads_total": tier_config["downloads"],
            "updatedAt": datetime.now(timezone.utc).isoformat()
        }
        await users_collection.update_one(
            {"id": user_id},
            {
                "$set": {
                    "subscription": subscription,
                    "downloadsUsed": 0,
                    "downloadsReset": datetime.now(timezone.utc).isoformat()
                }
            }
        )
        return {"success": True, "message": f"User subscription updated to {data.tier}", "subscription": subscription}
    else:
        # Remove subscription
        await users_collection.update_one(
            {"id": user_id},
            {
                "$set": {
                    "subscription": None
                }
            }
        )
        return {"success": True, "message": "User subscription removed", "subscription": None}


@app.put("/api/admin/users/{user_id}/downloads")
async def update_user_downloads(user_id: str, data: UpdateUserDownloads, session: dict = Depends(get_current_admin)):
    """Add bonus downloads to a user's account (admin only) - resets on next billing cycle"""
    user = await users_collection.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if not user.get("subscription"):
        raise HTTPException(status_code=400, detail="User has no active subscription")
    
    # Validate downloads to add
    if data.downloads_to_add < 1:
        raise HTTPException(status_code=400, detail="Please enter a positive number of downloads to add")
    
    current_downloads = user["subscription"].get("downloads_remaining", 0)
    
    # If user has unlimited downloads, no need to add more
    if current_downloads == -1:
        return {
            "success": True,
            "message": "User already has unlimited downloads",
            "user": user
        }
    
    # Add bonus downloads to current count
    new_downloads = current_downloads + data.downloads_to_add
    
    # Update downloads_remaining
    await users_collection.update_one(
        {"id": user_id},
        {
            "$set": {
                "subscription.downloads_remaining": new_downloads,
                "subscription.updatedAt": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    # Get updated user
    updated_user = await users_collection.find_one({"id": user_id}, {"_id": 0, "password": 0})
    
    return {
        "success": True, 
        "message": f"Added {data.downloads_to_add} bonus downloads. New total: {new_downloads}",
        "previousDownloads": current_downloads,
        "addedDownloads": data.downloads_to_add,
        "newTotal": new_downloads,
        "user": updated_user
    }


# ========== DISCOUNT CODES ENDPOINTS (Token-based Auth) ==========

@app.get("/api/admin/discounts")
async def get_discounts(session: dict = Depends(get_current_admin)):
    """Get all discount codes (admin only - token auth)"""
    discounts = await discounts_collection.find({}, {"_id": 0}).to_list(1000)
    return discounts

@app.post("/api/admin/discounts")
async def create_discount(request: dict, session: dict = Depends(get_current_admin)):
    """Create a new discount code (admin only - token auth)"""
    discount = {
        "id": str(uuid.uuid4()),
        "code": request.get("code", "").upper(),
        "discountPercent": request.get("discountPercent", 10),
        "startDate": request.get("startDate"),
        "expiryDate": request.get("expiryDate"),
        "usageType": request.get("usageType", "unlimited"),
        "usageLimit": request.get("usageLimit", 100),
        "usageCount": 0,
        "applicableTo": request.get("applicableTo", "all"),
        "specificGenerators": request.get("specificGenerators", []),
        "isActive": request.get("isActive", True),
        "usedByCustomers": [],
        "createdAt": datetime.now(timezone.utc).isoformat()
    }
    
    # Check if code already exists
    existing = await discounts_collection.find_one({"code": discount["code"]})
    if existing:
        raise HTTPException(status_code=400, detail="Discount code already exists")
    
    await discounts_collection.insert_one(discount)
    return {"success": True, "id": discount["id"]}

@app.put("/api/admin/discounts/{discount_id}")
async def update_discount(discount_id: str, request: dict, session: dict = Depends(get_current_admin)):
    """Update a discount code (admin only - token auth)"""
    update_data = {
        "code": request.get("code", "").upper(),
        "discountPercent": request.get("discountPercent"),
        "startDate": request.get("startDate"),
        "expiryDate": request.get("expiryDate"),
        "usageType": request.get("usageType"),
        "usageLimit": request.get("usageLimit"),
        "applicableTo": request.get("applicableTo"),
        "specificGenerators": request.get("specificGenerators", []),
        "isActive": request.get("isActive")
    }
    
    result = await discounts_collection.update_one(
        {"id": discount_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Discount not found")
    
    return {"success": True}

@app.delete("/api/admin/discounts/{discount_id}")
async def delete_discount(discount_id: str, session: dict = Depends(get_current_admin)):
    """Delete a discount code (admin only - token auth)"""
    result = await discounts_collection.delete_one({"id": discount_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Discount not found")
    return {"success": True}


# ========== PROMOTIONAL BANNER ENDPOINTS ==========

@app.get("/api/banner")
async def get_active_banner():
    """Get the currently active promotional banner (public endpoint)"""
    settings = await site_settings_collection.find_one({"key": "promotional_banner"})
    
    if not settings or not settings.get("isActive"):
        return {"success": True, "banner": None}
    
    # Check if the associated discount is still valid
    if settings.get("discountId"):
        discount = await discounts_collection.find_one({"id": settings["discountId"]})
        if discount:
            # Check if discount is active and not expired
            now = datetime.now(timezone.utc).isoformat()
            if not discount.get("isActive"):
                return {"success": True, "banner": None}
            if discount.get("expiryDate") and discount["expiryDate"] < now:
                return {"success": True, "banner": None}
            if discount.get("startDate") and discount["startDate"] > now:
                return {"success": True, "banner": None}
    
    return {
        "success": True,
        "banner": {
            "message": settings.get("message", ""),
            "discountCode": settings.get("discountCode", ""),
            "discountPercent": settings.get("discountPercent", 0),
            "backgroundColor": settings.get("backgroundColor", "#10b981"),
            "textColor": settings.get("textColor", "#ffffff"),
            "isActive": settings.get("isActive", False)
        }
    }


@app.get("/api/admin/banner")
async def get_banner_settings(session: dict = Depends(get_current_admin)):
    """Get banner settings (admin only)"""
    settings = await site_settings_collection.find_one({"key": "promotional_banner"}, {"_id": 0})
    
    if not settings:
        return {
            "success": True,
            "banner": {
                "isActive": False,
                "message": "",
                "discountId": None,
                "discountCode": "",
                "discountPercent": 0,
                "backgroundColor": "#10b981",
                "textColor": "#ffffff"
            }
        }
    
    return {"success": True, "banner": settings}


@app.put("/api/admin/banner")
async def update_banner_settings(request: dict, session: dict = Depends(get_current_admin)):
    """Update promotional banner settings (admin only)"""
    discount_id = request.get("discountId")
    discount_code = ""
    discount_percent = 0
    
    # If a discount is selected, get its details
    if discount_id:
        discount = await discounts_collection.find_one({"id": discount_id})
        if discount:
            discount_code = discount.get("code", "")
            discount_percent = discount.get("discountPercent", 0)
    
    banner_settings = {
        "key": "promotional_banner",
        "isActive": request.get("isActive", False),
        "message": request.get("message", ""),
        "discountId": discount_id,
        "discountCode": discount_code,
        "discountPercent": discount_percent,
        "backgroundColor": request.get("backgroundColor", "#10b981"),
        "textColor": request.get("textColor", "#ffffff"),
        "updatedAt": datetime.now(timezone.utc).isoformat()
    }
    
    await site_settings_collection.update_one(
        {"key": "promotional_banner"},
        {"$set": banner_settings},
        upsert=True
    )
    
    return {"success": True, "banner": banner_settings}

@app.post("/api/parse-resume")
async def parse_resume(file: UploadFile = File(...)):
    """Parse an uploaded resume (PDF or DOCX) and extract structured data"""
    try:
        # Check file type
        filename = file.filename.lower()
        if not (filename.endswith('.pdf') or filename.endswith('.docx')):
            raise HTTPException(status_code=400, detail="Only PDF and DOCX files are supported")
        
        # Read file content
        content = await file.read()
        
        # Extract text based on file type
        extracted_text = ""
        
        if filename.endswith('.pdf'):
            if not PDF_SUPPORT:
                raise HTTPException(status_code=500, detail="PDF parsing not available. Please upload a DOCX file.")
            
            with pdfplumber.open(io.BytesIO(content)) as pdf:
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        extracted_text += page_text + "\n"
        
        elif filename.endswith('.docx'):
            if not DOCX_SUPPORT:
                raise HTTPException(status_code=500, detail="DOCX parsing not available. Please upload a PDF file.")
            
            doc = Document(io.BytesIO(content))
            for para in doc.paragraphs:
                extracted_text += para.text + "\n"
            # Also extract from tables
            for table in doc.tables:
                for row in table.rows:
                    for cell in row.cells:
                        extracted_text += cell.text + " "
                    extracted_text += "\n"
        
        if not extracted_text.strip():
            raise HTTPException(status_code=400, detail="Could not extract text from the resume. Please ensure the file is not empty or corrupted.")
        
        # Use AI to parse the extracted text into structured format
        chat = get_llm_chat()
        
        prompt = f"""Parse the following resume text and extract structured information. Return ONLY valid JSON, no markdown code blocks.

RESUME TEXT:
{extracted_text[:8000]}

Extract and return this exact JSON structure (use empty strings or empty arrays if information is not found):
{{
    "personalInfo": {{
        "fullName": "Full name of the person",
        "email": "email@example.com",
        "phone": "phone number",
        "location": "City, State",
        "linkedin": "LinkedIn URL if present",
        "website": "Personal website if present"
    }},
    "workExperience": [
        {{
            "company": "Company Name",
            "position": "Job Title",
            "location": "City, State",
            "startDate": "MM/YYYY or Month YYYY",
            "endDate": "MM/YYYY or Month YYYY or Present",
            "current": false,
            "responsibilities": ["Responsibility 1", "Responsibility 2", "Responsibility 3"]
        }}
    ],
    "education": [
        {{
            "institution": "University/School Name",
            "degree": "Degree Type (e.g., Bachelor of Science)",
            "field": "Field of Study",
            "graduationDate": "YYYY or Month YYYY",
            "gpa": "GPA if mentioned"
        }}
    ],
    "skills": ["Skill 1", "Skill 2", "Skill 3"]
}}

Important:
- Extract ALL work experiences found, ordered from most recent to oldest
- Extract ALL education entries found
- For responsibilities, extract 3-5 bullet points per job
- If a field is not found in the resume, use an empty string "" or empty array []
- Set "current" to true if the job says "Present" or "Current"
- Return ONLY the JSON object, nothing else"""

        user_message = UserMessage(text=prompt)
        response = await chat.send_message(user_message)
        
        # Parse the JSON response
        response_text = response.strip()
        
        try:
            # Find JSON in the response
            start_idx = response_text.find('{')
            end_idx = response_text.rfind('}') + 1
            if start_idx != -1 and end_idx > start_idx:
                json_str = response_text[start_idx:end_idx]
                parsed_data = json.loads(json_str)
            else:
                raise ValueError("No JSON found in response")
        except json.JSONDecodeError as e:
            print(f"JSON parse error: {e}")
            print(f"Response was: {response_text[:500]}")
            # Return a basic structure if parsing fails
            parsed_data = {
                "personalInfo": {
                    "fullName": "",
                    "email": "",
                    "phone": "",
                    "location": "",
                    "linkedin": "",
                    "website": ""
                },
                "workExperience": [],
                "education": [],
                "skills": []
            }
        
        return {
            "success": True,
            "data": parsed_data,
            "rawTextLength": len(extracted_text)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error parsing resume: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error parsing resume: {str(e)}")

@app.post("/api/scrape-job")
async def scrape_job(request: JobScrapeRequest):
    """Scrape job description from URL"""
    try:
        async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            }
            response = await client.get(request.url, headers=headers)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Remove script and style elements
            for script in soup(["script", "style", "nav", "footer", "header"]):
                script.decompose()
            
            # Try to find job description in common containers
            job_text = ""
            
            # Common job description selectors
            selectors = [
                'div[class*="job-description"]',
                'div[class*="jobDescription"]',
                'div[class*="description"]',
                'section[class*="description"]',
                'div[id*="job-description"]',
                'div[id*="jobDescription"]',
                'article',
                'main',
                '.job-details',
                '.posting-requirements',
            ]
            
            for selector in selectors:
                elements = soup.select(selector)
                if elements:
                    job_text = " ".join([el.get_text(separator="\n", strip=True) for el in elements])
                    if len(job_text) > 200:
                        break
            
            # Fallback to body text if no specific container found
            if len(job_text) < 200:
                job_text = soup.get_text(separator="\n", strip=True)
            
            # Clean up the text
            lines = [line.strip() for line in job_text.split('\n') if line.strip()]
            job_text = "\n".join(lines[:150])  # Limit to ~150 lines
            
            if len(job_text) < 100:
                raise HTTPException(status_code=400, detail="Could not extract meaningful job description from URL")
            
            return {"jobDescription": job_text[:8000]}  # Limit to 8000 chars
            
    except httpx.HTTPError as e:
        raise HTTPException(status_code=400, detail=f"Failed to fetch URL: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error scraping job: {str(e)}")

@app.post("/api/generate-resume")
async def generate_resume(data: ResumeInput):
    """Generate AI-optimized resume content"""
    try:
        chat = get_llm_chat()
        
        # Build context from user data - include job location
        work_history = "\n".join([
            f"- {exp.position} at {exp.company}, {exp.location} ({exp.startDate} - {'Present' if exp.current else exp.endDate})\n  Responsibilities: {'; '.join(exp.responsibilities)}"
            for exp in data.workExperience
        ])
        
        education_history = "\n".join([
            f"- {edu.degree} in {edu.field} from {edu.institution} ({edu.graduationDate})"
            for edu in data.education
        ])
        
        skills_list = ", ".join(data.skills) if data.skills else "Not specified"
        
        prompt = f"""Your task is to create an optimized resume tailored to a specific job posting.

IMPORTANT RULES:
1. ONLY use information provided by the user - DO NOT fabricate any employers, dates, degrees, locations, or certifications
2. For each work experience, use the EXACT location provided by the user (not the user's personal location)
3. Rewrite and enhance existing responsibilities using action verbs and quantifiable achievements where possible
4. Align the resume content to match the job requirements and keywords
5. Ensure ATS-friendly formatting with relevant keywords from the job description
6. Match the tone and seniority level of the target position

USER'S PERSONAL INFO:
Name: {data.personalInfo.get('fullName', 'Candidate')}
Email: {data.personalInfo.get('email', '')}
Phone: {data.personalInfo.get('phone', '')}
Personal Location: {data.personalInfo.get('location', '')}
LinkedIn: {data.personalInfo.get('linkedin', '')}

WORK EXPERIENCE (use these exact company locations, NOT the personal location above):
{work_history}

EDUCATION:
{education_history}

SKILLS:
{skills_list}

TARGET JOB TITLE: {data.targetJobTitle}

JOB DESCRIPTION:
{data.jobDescription[:4000]}

IMPORTANT: The user has provided {len(data.workExperience)} work experience entries. You MUST return exactly {len(data.workExperience)} entries in the optimizedExperience array, one for each job. Each entry must have UNIQUE and DIFFERENT bullet points tailored to that specific role. Do NOT duplicate or reuse bullet points across different positions.

Please generate the following in JSON format. ONLY output valid JSON, no markdown code blocks:
{{
    "professionalSummary": "A compelling 3-4 sentence professional summary tailored to this role",
    "optimizedExperience": [
        // Return EXACTLY {len(data.workExperience)} entries here - one for EACH work experience provided above
        // Each entry should look like:
        {{
            "company": "Exact company name from user input",
            "position": "Exact position title from user input",
            "location": "Exact location from user input",
            "startDate": "Exact start date from user input",
            "endDate": "Exact end date from user input or Present",
            "bullets": ["Unique bullet 1 for THIS role", "Unique bullet 2 for THIS role", "Unique bullet 3 for THIS role", "Unique bullet 4 for THIS role"]
        }}
    ],
    "optimizedSkills": {{
        "technical": ["skill1", "skill2"],
        "soft": ["skill1", "skill2"],
        "other": ["skill1", "skill2"]
    }},
    "keywordsUsed": ["keyword1", "keyword2"],
    "atsScore": 85,
    "suggestions": ["suggestion1", "suggestion2"]
}}

CRITICAL: You MUST generate {len(data.workExperience)} SEPARATE work experience entries with DIFFERENT bullet points for each. Each position's bullets should be tailored to the specific responsibilities mentioned for that role. Do NOT copy the same bullets across different positions.
"""

        user_message = UserMessage(text=prompt)
        response = await chat.send_message(user_message)
        
        # Parse the JSON response
        response_text = response
        
        # Try to extract JSON from the response
        try:
            # Find JSON in the response
            start_idx = response_text.find('{')
            end_idx = response_text.rfind('}') + 1
            if start_idx != -1 and end_idx > start_idx:
                json_str = response_text[start_idx:end_idx]
                result = json.loads(json_str)
            else:
                raise ValueError("No JSON found in response")
        except json.JSONDecodeError:
            # If JSON parsing fails, return a structured error response
            result = {
                "professionalSummary": "Experienced professional seeking new opportunities.",
                "optimizedExperience": [
                    {
                        "company": exp.company,
                        "position": exp.position,
                        "location": exp.location,
                        "startDate": exp.startDate,
                        "endDate": "Present" if exp.current else exp.endDate,
                        "bullets": exp.responsibilities[:4]
                    }
                    for exp in data.workExperience
                ],
                "optimizedSkills": {
                    "technical": data.skills[:5] if data.skills else [],
                    "soft": [],
                    "other": []
                },
                "keywordsUsed": [],
                "atsScore": 70,
                "suggestions": ["Consider adding more specific achievements", "Add relevant certifications"]
            }
        
        # Add original data for reference
        result["personalInfo"] = data.personalInfo
        result["education"] = [edu.dict() for edu in data.education]
        result["targetJobTitle"] = data.targetJobTitle
        
        return result
        
    except Exception as e:
        print(f"Error generating resume: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating resume: {str(e)}")

@app.post("/api/regenerate-section")
async def regenerate_section(data: dict):
    """Regenerate a specific section of the resume"""
    try:
        chat = get_llm_chat()
        
        section = data.get("section")
        current_content = data.get("currentContent")
        job_description = data.get("jobDescription", "")
        user_context = data.get("userContext", {})
        
        prompts = {
            "summary": f"""Rewrite this professional summary to better align with the job description. Keep it 3-4 sentences, compelling, and ATS-friendly.

Current Summary: {current_content}

Job Description: {job_description[:2000]}

Return only the new summary text, nothing else.""",

            "experience": f"""Rewrite these work experience bullet points to better align with the job description. Use strong action verbs, include metrics where possible, and ensure ATS optimization.

Current Bullets: {json.dumps(current_content)}

Job Description: {job_description[:2000]}

Return a JSON array of improved bullet points: ["bullet1", "bullet2", ...]""",

            "skills": f"""Reorganize and optimize these skills based on the job description. Prioritize the most relevant skills and add any that are implied by the experience.

Current Skills: {json.dumps(current_content)}
User Experience Context: {json.dumps(user_context)}

Job Description: {job_description[:2000]}

Return a JSON object: {{"technical": [...], "soft": [...], "other": [...]}}"""
        }
        
        prompt = prompts.get(section)
        if not prompt:
            raise HTTPException(status_code=400, detail=f"Unknown section: {section}")
        
        user_message = UserMessage(text=prompt)
        response = await chat.send_message(user_message)
        
        response_text = response.strip()
        
        # Try to parse as JSON if applicable
        if section in ["experience", "skills"]:
            try:
                start_idx = response_text.find('[') if section == "experience" else response_text.find('{')
                end_idx = response_text.rfind(']') + 1 if section == "experience" else response_text.rfind('}') + 1
                if start_idx != -1 and end_idx > start_idx:
                    json_str = response_text[start_idx:end_idx]
                    return {"content": json.loads(json_str)}
            except (json.JSONDecodeError, ValueError):
                pass
        
        return {"content": response_text}
        
    except Exception as e:
        print(f"Error regenerating section: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error regenerating section: {str(e)}")


# AI Generate Responsibilities for Work Experience
class GenerateResponsibilitiesRequest(BaseModel):
    position: str
    company: str
    industry: Optional[str] = ""
    jobDescription: Optional[str] = ""

@app.post("/api/generate-responsibilities")
async def generate_responsibilities(data: GenerateResponsibilitiesRequest):
    """Generate AI-powered responsibilities/achievements for a work position"""
    try:
        chat = get_llm_chat()
        
        context = f"""Position: {data.position}
Company: {data.company}
{"Industry: " + data.industry if data.industry else ""}
{"Target Job Description: " + data.jobDescription[:500] if data.jobDescription else ""}"""
        
        prompt = f"""Generate 4-5 professional, impactful job responsibilities and achievements for the following role:

{context}

Requirements:
1. Start each bullet point with a strong action verb (Led, Developed, Managed, Implemented, etc.)
2. Include quantifiable metrics where appropriate (%, $, numbers)
3. Focus on achievements and impact, not just duties
4. Make them ATS-friendly with relevant keywords
5. Each bullet should be 1-2 sentences, specific and measurable

Return ONLY a JSON array of strings, no explanation:
["First responsibility with metrics and impact", "Second responsibility...", "Third...", "Fourth...", "Fifth..."]"""
        
        user_message = UserMessage(text=prompt)
        response = await chat.send_message(user_message)
        
        # Try to parse JSON array from response
        try:
            # Find JSON array in response
            json_match = re.search(r'\[[\s\S]*?\]', response)
            if json_match:
                responsibilities = json.loads(json_match.group())
                if isinstance(responsibilities, list) and all(isinstance(r, str) for r in responsibilities):
                    return {"success": True, "responsibilities": responsibilities}
        except json.JSONDecodeError:
            pass
        
        # Fallback: split by newlines if JSON parsing fails
        lines = [line.strip().lstrip('•-*').strip() for line in response.split('\n') if line.strip() and len(line.strip()) > 20]
        if lines:
            return {"success": True, "responsibilities": lines[:5]}
        
        raise HTTPException(status_code=500, detail="Failed to generate responsibilities")
        
    except Exception as e:
        print(f"Error generating responsibilities: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating responsibilities: {str(e)}")


# ============================================
# DISCOUNT CODE ENDPOINTS
# ============================================

ADMIN_PASSWORD = "MintSlip2025!"

def verify_admin_password(password: str):
    if password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Unauthorized")

@app.post("/api/admin/discounts")
async def create_discount_code(data: DiscountCodeCreate, password: str):
    """Create a new discount code"""
    verify_admin_password(password)
    
    # Check if code already exists
    existing = await discounts_collection.find_one({"code": data.code.upper()})
    if existing:
        raise HTTPException(status_code=400, detail="Discount code already exists")
    
    discount_doc = {
        "id": str(uuid.uuid4()),
        "code": data.code.upper(),
        "discountPercent": data.discountPercent,
        "startDate": data.startDate,
        "expiryDate": data.expiryDate,
        "usageType": data.usageType,
        "usageLimit": data.usageLimit if data.usageType == "limited" else None,
        "usageCount": 0,
        "usedByCustomers": [],
        "applicableTo": data.applicableTo,
        "specificGenerators": data.specificGenerators if data.applicableTo == "specific" else None,
        "isActive": data.isActive,
        "createdAt": datetime.utcnow().isoformat()
    }
    
    await discounts_collection.insert_one(discount_doc)
    discount_doc.pop("_id", None)
    return discount_doc

@app.get("/api/admin/discounts")
async def list_discount_codes(password: str):
    """List all discount codes"""
    verify_admin_password(password)
    
    codes = await discounts_collection.find().to_list(length=100)
    for code in codes:
        code.pop("_id", None)
    return codes

@app.put("/api/admin/discounts/{discount_id}")
async def update_discount_code(discount_id: str, data: DiscountCodeUpdate, password: str):
    """Update a discount code"""
    verify_admin_password(password)
    
    existing = await discounts_collection.find_one({"id": discount_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Discount code not found")
    
    update_data = {k: v for k, v in data.dict().items() if v is not None}
    if "code" in update_data:
        update_data["code"] = update_data["code"].upper()
    
    await discounts_collection.update_one(
        {"id": discount_id},
        {"$set": update_data}
    )
    
    updated = await discounts_collection.find_one({"id": discount_id})
    updated.pop("_id", None)
    return updated

@app.delete("/api/admin/discounts/{discount_id}")
async def delete_discount_code(discount_id: str, password: str):
    """Delete a discount code"""
    verify_admin_password(password)
    
    result = await discounts_collection.delete_one({"id": discount_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Discount code not found")
    
    return {"message": "Discount code deleted successfully"}

@app.post("/api/validate-coupon")
async def validate_coupon(data: CouponValidateRequest):
    """Validate a coupon code and return discount details"""
    code = data.code.upper().strip()
    
    discount = await discounts_collection.find_one({"code": code})
    
    if not discount:
        raise HTTPException(status_code=404, detail="Invalid coupon code")
    
    # Check if active
    if not discount.get("isActive", True):
        raise HTTPException(status_code=400, detail="This coupon code is no longer active")
    
    # Check date validity
    now = datetime.utcnow()
    start_date = datetime.fromisoformat(discount["startDate"].replace("Z", ""))
    expiry_date = datetime.fromisoformat(discount["expiryDate"].replace("Z", ""))
    
    if now < start_date:
        raise HTTPException(status_code=400, detail="This coupon code is not yet active")
    
    if now > expiry_date:
        raise HTTPException(status_code=400, detail="This coupon code has expired")
    
    # Check usage limits
    usage_type = discount.get("usageType", "unlimited")
    
    if usage_type == "limited":
        if discount.get("usageCount", 0) >= discount.get("usageLimit", 0):
            raise HTTPException(status_code=400, detail="This coupon code has reached its usage limit")
    
    if usage_type == "one_per_customer" and data.customerIdentifier:
        used_by = discount.get("usedByCustomers", [])
        if data.customerIdentifier in used_by:
            raise HTTPException(status_code=400, detail="You have already used this coupon code")
    
    # Check generator applicability
    if discount.get("applicableTo") == "specific":
        allowed_generators = discount.get("specificGenerators", [])
        if data.generatorType not in allowed_generators:
            raise HTTPException(status_code=400, detail=f"This coupon code is not valid for {data.generatorType}")
    
    return {
        "valid": True,
        "code": discount["code"],
        "discountPercent": discount["discountPercent"],
        "message": f"{int(discount['discountPercent'])}% discount applied!"
    }

@app.post("/api/use-coupon")
async def use_coupon(data: CouponValidateRequest):
    """Mark a coupon as used after successful payment"""
    code = data.code.upper().strip()
    
    discount = await discounts_collection.find_one({"code": code})
    if not discount:
        return {"success": False, "message": "Coupon not found"}
    
    update_ops = {"$inc": {"usageCount": 1}}
    
    if data.customerIdentifier and discount.get("usageType") == "one_per_customer":
        update_ops["$push"] = {"usedByCustomers": data.customerIdentifier}
    
    await discounts_collection.update_one({"code": code}, update_ops)
    
    return {"success": True, "message": "Coupon usage recorded"}

# ========== BLOG ENDPOINTS ==========

# Initialize default blog categories
@app.on_event("startup")
async def init_blog_categories():
    for cat in BLOG_CATEGORIES:
        existing = await blog_categories_collection.find_one({"slug": cat["slug"]})
        if not existing:
            await blog_categories_collection.insert_one({
                "id": str(uuid.uuid4()),
                **cat,
                "createdAt": datetime.now(timezone.utc).isoformat()
            })

# ===== PUBLIC BLOG ENDPOINTS =====

@app.get("/api/blog/posts")
async def get_public_blog_posts(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=50),
    category: Optional[str] = None,
    tag: Optional[str] = None,
    search: Optional[str] = None,
    sort: Optional[str] = "newest"  # newest, oldest, popular
):
    """Get published blog posts (public)"""
    query = {"status": "published"}
    
    if category:
        query["category"] = category
    
    if tag:
        query["tags"] = tag
    
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"content": {"$regex": search, "$options": "i"}},
            {"excerpt": {"$regex": search, "$options": "i"}},
            {"tags": {"$regex": search, "$options": "i"}}
        ]
    
    # Sorting
    sort_order = -1 if sort == "newest" else 1
    sort_field = "publishDate" if sort in ["newest", "oldest"] else "views"
    
    skip = (page - 1) * limit
    total = await blog_posts_collection.count_documents(query)
    
    posts = await blog_posts_collection.find(
        query, 
        {"_id": 0, "content": 0}  # Exclude full content for list
    ).sort(sort_field, sort_order).skip(skip).limit(limit).to_list(limit)
    
    return {
        "success": True,
        "posts": posts,
        "total": total,
        "page": page,
        "pages": (total + limit - 1) // limit
    }

@app.get("/api/blog/posts/{slug}")
async def get_public_blog_post(slug: str):
    """Get a single published blog post by slug (public)"""
    post = await blog_posts_collection.find_one(
        {"slug": slug, "status": "published"},
        {"_id": 0}
    )
    
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    # Increment view count
    await blog_posts_collection.update_one(
        {"slug": slug},
        {"$inc": {"views": 1}}
    )
    
    # Get related posts (same category, excluding current)
    related = []
    if post.get("category"):
        related = await blog_posts_collection.find(
            {"category": post["category"], "status": "published", "slug": {"$ne": slug}},
            {"_id": 0, "content": 0}
        ).limit(3).to_list(3)
    
    return {
        "success": True,
        "post": post,
        "related": related
    }

@app.get("/api/blog/categories")
async def get_blog_categories():
    """Get all blog categories (public)"""
    categories = await blog_categories_collection.find({}, {"_id": 0}).to_list(100)
    
    # Get post counts for each category
    for cat in categories:
        count = await blog_posts_collection.count_documents({
            "category": cat["slug"],
            "status": "published"
        })
        cat["postCount"] = count
    
    return {"success": True, "categories": categories}

@app.get("/api/blog/categories/{slug}")
async def get_blog_category(slug: str):
    """Get a single category with its posts"""
    category = await blog_categories_collection.find_one({"slug": slug}, {"_id": 0})
    
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    return {"success": True, "category": category}

# ===== ADMIN BLOG ENDPOINTS =====

@app.get("/api/admin/blog/posts")
async def get_admin_blog_posts(
    session: dict = Depends(get_current_admin),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    status: Optional[str] = None
):
    """Get all blog posts (admin)"""
    query = {}
    if status:
        query["status"] = status
    
    skip = (page - 1) * limit
    total = await blog_posts_collection.count_documents(query)
    
    posts = await blog_posts_collection.find(
        query,
        {"_id": 0}
    ).sort("createdAt", -1).skip(skip).limit(limit).to_list(limit)
    
    return {
        "success": True,
        "posts": posts,
        "total": total,
        "page": page,
        "pages": (total + limit - 1) // limit
    }

@app.get("/api/admin/blog/posts/{post_id}")
async def get_admin_blog_post(post_id: str, session: dict = Depends(get_current_admin)):
    """Get a single blog post by ID (admin)"""
    post = await blog_posts_collection.find_one({"id": post_id}, {"_id": 0})
    
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    return {"success": True, "post": post}

@app.post("/api/admin/blog/posts")
async def create_blog_post(data: BlogPostCreate, session: dict = Depends(get_current_admin)):
    """Create a new blog post (admin)"""
    # Check for duplicate slug
    existing = await blog_posts_collection.find_one({"slug": data.slug})
    if existing:
        raise HTTPException(status_code=400, detail="A post with this slug already exists")
    
    # Calculate reading time (avg 200 words per minute)
    word_count = len(data.content.split()) if data.content else 0
    reading_time = max(1, round(word_count / 200))
    
    post = {
        "id": str(uuid.uuid4()),
        "title": data.title,
        "slug": data.slug,
        "metaTitle": data.metaTitle or data.title,
        "metaDescription": data.metaDescription or (data.excerpt or data.content[:160] if data.content else ""),
        "author": data.author or "MintSlip Team",
        "featuredImage": data.featuredImage,
        "content": data.content,
        "excerpt": data.excerpt or (data.content[:200] + "..." if data.content and len(data.content) > 200 else data.content),
        "category": data.category,
        "tags": data.tags or [],
        "faqSchema": data.faqSchema or [],
        "status": data.status or "draft",
        "indexFollow": data.indexFollow if data.indexFollow is not None else True,
        "publishDate": data.publishDate or datetime.now(timezone.utc).isoformat(),
        "readingTime": reading_time,
        "views": 0,
        "createdAt": datetime.now(timezone.utc).isoformat(),
        "updatedAt": datetime.now(timezone.utc).isoformat(),
        "createdBy": session.get("adminId")
    }
    
    await blog_posts_collection.insert_one(post)
    
    return {"success": True, "message": "Post created", "post": {k: v for k, v in post.items() if k != "_id"}}

@app.put("/api/admin/blog/posts/{post_id}")
async def update_blog_post(post_id: str, data: BlogPostUpdate, session: dict = Depends(get_current_admin)):
    """Update a blog post (admin)"""
    existing = await blog_posts_collection.find_one({"id": post_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Post not found")
    
    # Check for duplicate slug if changing
    if data.slug and data.slug != existing["slug"]:
        slug_exists = await blog_posts_collection.find_one({"slug": data.slug, "id": {"$ne": post_id}})
        if slug_exists:
            raise HTTPException(status_code=400, detail="A post with this slug already exists")
    
    update_data = {k: v for k, v in data.dict().items() if v is not None}
    
    # Recalculate reading time if content changed
    if data.content:
        word_count = len(data.content.split())
        update_data["readingTime"] = max(1, round(word_count / 200))
    
    update_data["updatedAt"] = datetime.now(timezone.utc).isoformat()
    update_data["updatedBy"] = session.get("adminId")
    
    await blog_posts_collection.update_one({"id": post_id}, {"$set": update_data})
    
    return {"success": True, "message": "Post updated"}

@app.delete("/api/admin/blog/posts/{post_id}")
async def delete_blog_post(post_id: str, session: dict = Depends(get_current_admin)):
    """Delete a blog post (admin)"""
    result = await blog_posts_collection.delete_one({"id": post_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Post not found")
    
    return {"success": True, "message": "Post deleted"}

@app.post("/api/admin/blog/upload-image")
async def upload_blog_image(file: UploadFile = File(...), session: dict = Depends(get_current_admin)):
    """Upload an image for blog posts (admin)"""
    # Validate file type
    allowed_types = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Invalid file type. Allowed: JPEG, PNG, WebP, GIF")
    
    # Generate unique filename
    ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    filename = f"{uuid.uuid4()}.{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    
    # Save file
    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Return URL
    image_url = f"/api/uploads/blog/{filename}"
    
    return {"success": True, "url": image_url, "filename": filename}

@app.post("/api/admin/blog/categories")
async def create_blog_category(data: BlogCategoryCreate, session: dict = Depends(get_current_admin)):
    """Create a new blog category (admin)"""
    existing = await blog_categories_collection.find_one({"slug": data.slug})
    if existing:
        raise HTTPException(status_code=400, detail="Category with this slug already exists")
    
    category = {
        "id": str(uuid.uuid4()),
        "name": data.name,
        "slug": data.slug,
        "description": data.description or "",
        "createdAt": datetime.now(timezone.utc).isoformat()
    }
    
    await blog_categories_collection.insert_one(category)
    
    return {"success": True, "message": "Category created", "category": {k: v for k, v in category.items() if k != "_id"}}

@app.delete("/api/admin/blog/categories/{category_id}")
async def delete_blog_category(category_id: str, session: dict = Depends(get_current_admin)):
    """Delete a blog category (admin)"""
    result = await blog_categories_collection.delete_one({"id": category_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Category not found")
    
    return {"success": True, "message": "Category deleted"}

# AI Blog Content Generation
@app.post("/api/admin/blog/ai-generate")
async def ai_generate_blog_content(
    topic: str = Query(..., description="Blog topic or title"),
    keywords: str = Query("", description="Target keywords, comma separated"),
    tone: str = Query("professional", description="Writing tone: professional, casual, informative"),
    session: dict = Depends(get_current_admin)
):
    """Generate blog content using AI (admin)"""
    try:
        chat = get_llm_chat()
        
        prompt = f"""Write a comprehensive, SEO-optimized blog article about: {topic}

Target Keywords: {keywords if keywords else 'pay stub, proof of income, payroll'}
Tone: {tone}

Requirements:
1. Write in HTML format suitable for a WYSIWYG editor (use <h2>, <h3>, <p>, <ul>, <li>, <strong>, <em> tags)
2. Include an engaging introduction
3. Use <h2> and <h3> tags for headings
4. Include practical tips and actionable advice
5. Add a conclusion with a call-to-action mentioning MintSlip's pay stub generator
6. Aim for 1000-1500 words
7. Include internal link suggestions using <a href="/paystub-generator"> and <a href="/how-to-make-a-paystub">

Also provide:
- A compelling meta title (under 60 characters)
- A meta description (under 160 characters)
- An excerpt (2-3 sentences)
- 3-5 FAQ questions with answers related to the topic

Format your response as JSON:
{{
    "content": "HTML content here with proper tags",
    "metaTitle": "SEO title",
    "metaDescription": "meta description",
    "excerpt": "short excerpt",
    "suggestedSlug": "url-friendly-slug",
    "faqSchema": [
        {{"question": "Q1", "answer": "A1"}},
        {{"question": "Q2", "answer": "A2"}}
    ],
    "suggestedTags": ["tag1", "tag2"]
}}"""
        
        user_message = UserMessage(text=prompt)
        response = await chat.send_message(user_message)
        
        # Try to parse JSON from response
        try:
            # Find JSON in response
            json_match = re.search(r'\{[\s\S]*\}', response)
            if json_match:
                result = json.loads(json_match.group())
                return {"success": True, "generated": result}
        except json.JSONDecodeError:
            pass
        
        # If JSON parsing fails, return raw content
        return {
            "success": True,
            "generated": {
                "content": response,
                "metaTitle": topic[:60],
                "metaDescription": topic[:160],
                "excerpt": topic,
                "suggestedSlug": re.sub(r'[^a-z0-9]+', '-', topic.lower()).strip('-'),
                "faqSchema": [],
                "suggestedTags": []
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI generation failed: {str(e)}")


# ============================================
# Social Media Meta Tags API
# ============================================

# Page-specific meta configurations
PAGE_META_CONFIG = {
    "/": {
        "title": "Paystub Generator | No.1 Paystub Generator - MintSlip",
        "description": "Our paystub generator instantly creates pay stubs online. This easy checkstub maker online handles calculations automatically with no software needed.",
        "image": "https://www.mintslip.com/favicon.ico"
    },
    "/paystub-generator": {
        "title": "Free Paystub Generator Online | Create Pay Stubs Instantly - MintSlip",
        "description": "Generate professional pay stubs in minutes. Our free paystub generator creates accurate, printable check stubs with automatic calculations.",
        "image": "https://www.mintslip.com/favicon.ico"
    },
    "/w2-generator": {
        "title": "W-2 Form Generator | Create W-2 Tax Forms Online - MintSlip",
        "description": "Generate accurate W-2 tax forms online. Create professional W-2 wage and tax statements for employees with our easy-to-use generator.",
        "image": "https://www.mintslip.com/favicon.ico"
    },
    "/1099-generator": {
        "title": "1099 Form Generator | Create 1099 Tax Forms Online - MintSlip",
        "description": "Generate 1099-NEC and 1099-MISC forms online. Create professional tax documents for contractors and freelancers instantly.",
        "image": "https://www.mintslip.com/favicon.ico"
    },
    "/ai-resume-builder": {
        "title": "AI Resume Builder | Create ATS-Optimized Resumes - MintSlip",
        "description": "Build professional, ATS-optimized resumes with AI. Our smart resume builder tailors your resume to job descriptions for maximum impact.",
        "image": "https://www.mintslip.com/favicon.ico"
    },
    "/blog": {
        "title": "Blog - Pay Stub Tips, Payroll Guides & Financial Documentation | MintSlip",
        "description": "Expert guides on pay stubs, proof of income, payroll management, and financial documentation. Learn how to create professional pay stubs.",
        "image": "https://www.mintslip.com/favicon.ico"
    }
}

@app.get("/api/meta-tags/{path:path}")
async def get_meta_tags(path: str):
    """Get meta tags for a specific page - used for social media sharing"""
    full_path = f"/{path}" if path else "/"
    
    # Check if it's a blog post
    if full_path.startswith("/blog/") and len(full_path) > 6:
        slug = full_path[6:]  # Remove "/blog/"
        post = await db["blog_posts"].find_one({"slug": slug, "status": "published"})
        
        if post:
            # Use the blog post's featured image for social sharing
            image_url = post.get("featuredImage", "https://www.mintslip.com/favicon.ico")
            if image_url and image_url.startswith("/"):
                image_url = f"https://www.mintslip.com{image_url}"
            
            return {
                "success": True,
                "meta": {
                    "title": post.get("metaTitle") or post.get("title", "MintSlip Blog"),
                    "description": post.get("metaDescription") or post.get("excerpt", ""),
                    "image": image_url,
                    "type": "article",
                    "url": f"https://www.mintslip.com/blog/{slug}",
                    "author": post.get("author", "MintSlip Team"),
                    "publishedTime": post.get("publishDate", ""),
                }
            }
    
    # Check predefined pages
    if full_path in PAGE_META_CONFIG:
        config = PAGE_META_CONFIG[full_path]
        return {
            "success": True,
            "meta": {
                "title": config["title"],
                "description": config["description"],
                "image": config["image"],
                "type": "website",
                "url": f"https://www.mintslip.com{full_path}"
            }
        }
    
    # Default fallback
    return {
        "success": True,
        "meta": {
            "title": "MintSlip - Professional Document Generator",
            "description": "Create professional pay stubs, W-2 forms, 1099 forms, and more. MintSlip makes document generation easy and accurate.",
            "image": "https://www.mintslip.com/favicon.ico",
            "type": "website",
            "url": f"https://www.mintslip.com{full_path}"
        }
    }


from fastapi import Request
from fastapi.responses import HTMLResponse

# List of social media bot user agents
SOCIAL_BOTS = [
    'facebookexternalhit',
    'Facebot',
    'Twitterbot',
    'LinkedInBot',
    'Pinterest',
    'Slackbot',
    'TelegramBot',
    'WhatsApp',
    'Discordbot',
    'Googlebot',
    'bingbot',
    'Applebot'
]

def is_social_bot(user_agent: str) -> bool:
    """Check if the request is from a social media bot"""
    if not user_agent:
        return False
    user_agent_lower = user_agent.lower()
    return any(bot.lower() in user_agent_lower for bot in SOCIAL_BOTS)

@app.get("/api/oembed")
async def get_oembed(url: str, request: Request):
    """oEmbed endpoint for rich link previews"""
    # Parse the URL to get the path
    from urllib.parse import urlparse
    parsed = urlparse(url)
    path = parsed.path
    
    # Get meta tags for this path
    meta_response = await get_meta_tags(path.lstrip('/'))
    meta = meta_response.get("meta", {})
    
    return {
        "version": "1.0",
        "type": "link",
        "title": meta.get("title", "MintSlip"),
        "author_name": meta.get("author", "MintSlip"),
        "provider_name": "MintSlip",
        "provider_url": "https://www.mintslip.com",
        "thumbnail_url": meta.get("image", "https://www.mintslip.com/favicon.ico"),
        "thumbnail_width": 200,
        "thumbnail_height": 200
    }


@app.get("/api/social-preview/{path:path}")
async def get_social_preview_html(path: str, request: Request):
    """
    Serve HTML with proper meta tags for social media crawlers.
    This endpoint can be used by a reverse proxy to serve to social bots.
    """
    full_path = f"/{path}" if path else "/"
    
    # Get meta tags
    meta_response = await get_meta_tags(path)
    meta = meta_response.get("meta", {})
    
    # For blog posts with featured images, use summary_large_image card
    twitter_card = "summary_large_image" if "blog/" in full_path else "summary"
    
    html = f'''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    
    <title>{meta.get("title", "MintSlip")}</title>
    <meta name="description" content="{meta.get("description", "")}">
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="{meta.get("type", "website")}">
    <meta property="og:url" content="{meta.get("url", "https://www.mintslip.com")}">
    <meta property="og:title" content="{meta.get("title", "MintSlip")}">
    <meta property="og:description" content="{meta.get("description", "")}">
    <meta property="og:image" content="{meta.get("image", "https://www.mintslip.com/favicon.ico")}">
    <meta property="og:site_name" content="MintSlip">
    
    <!-- Twitter -->
    <meta name="twitter:card" content="{twitter_card}">
    <meta name="twitter:url" content="{meta.get("url", "https://www.mintslip.com")}">
    <meta name="twitter:title" content="{meta.get("title", "MintSlip")}">
    <meta name="twitter:description" content="{meta.get("description", "")}">
    <meta name="twitter:image" content="{meta.get("image", "https://www.mintslip.com/favicon.ico")}">
    
    <!-- Article specific (for blog posts) -->
    {"<meta property='article:published_time' content='" + meta.get("publishedTime", "") + "'>" if meta.get("publishedTime") else ""}
    {"<meta property='article:author' content='" + meta.get("author", "") + "'>" if meta.get("author") else ""}
    
    <link rel="canonical" href="{meta.get("url", "https://www.mintslip.com")}">
    <link rel="icon" href="https://www.mintslip.com/favicon.ico">
    
    <!-- Redirect regular browsers to the actual page -->
    <script>
        window.location.href = "{meta.get("url", "https://www.mintslip.com")}";
    </script>
    <noscript>
        <meta http-equiv="refresh" content="0;url={meta.get("url", "https://www.mintslip.com")}">
    </noscript>
</head>
<body>
    <h1>{meta.get("title", "MintSlip")}</h1>
    <p>{meta.get("description", "")}</p>
    <a href="{meta.get("url", "https://www.mintslip.com")}">Visit MintSlip</a>
</body>
</html>'''
    
    return HTMLResponse(content=html)


# ============================================
# Dynamic Sitemap Generation
# ============================================

from fastapi.responses import Response

# Static pages for the sitemap
STATIC_SITEMAP_PAGES = [
    {"loc": "https://mintslip.com/", "priority": "1.0", "changefreq": "weekly"},
    {"loc": "https://mintslip.com/paystub-generator", "priority": "0.9", "changefreq": "weekly"},
    {"loc": "https://mintslip.com/paystub-for-apartment", "priority": "0.9", "changefreq": "weekly"},
    {"loc": "https://mintslip.com/mintslip-vs-thepaystubs", "priority": "0.9", "changefreq": "monthly"},
    {"loc": "https://mintslip.com/paystub-for-mortgage", "priority": "0.9", "changefreq": "weekly"},
    {"loc": "https://mintslip.com/paystub-template-download", "priority": "0.9", "changefreq": "weekly"},
    {"loc": "https://mintslip.com/create-a-paystub", "priority": "0.9", "changefreq": "weekly"},
    {"loc": "https://mintslip.com/paystub-samples", "priority": "0.8", "changefreq": "weekly"},
    {"loc": "https://mintslip.com/instant-paystub-generator", "priority": "0.8", "changefreq": "weekly"},
    {"loc": "https://mintslip.com/self-employed-paystub-generator", "priority": "0.8", "changefreq": "weekly"},
    {"loc": "https://mintslip.com/contractor-paystub-generator", "priority": "0.8", "changefreq": "weekly"},
    {"loc": "https://mintslip.com/canadian-paystub-generator", "priority": "0.8", "changefreq": "weekly"},
    {"loc": "https://mintslip.com/w2-generator", "priority": "0.8", "changefreq": "weekly"},
    {"loc": "https://mintslip.com/w9-generator", "priority": "0.8", "changefreq": "weekly"},
    {"loc": "https://mintslip.com/1099-nec-generator", "priority": "0.8", "changefreq": "weekly"},
    {"loc": "https://mintslip.com/1099-misc-generator", "priority": "0.8", "changefreq": "weekly"},
    {"loc": "https://mintslip.com/schedule-c-generator", "priority": "0.8", "changefreq": "weekly"},
    {"loc": "https://mintslip.com/accounting-mockup-generator", "priority": "0.8", "changefreq": "weekly"},
    {"loc": "https://mintslip.com/offer-letter-generator", "priority": "0.8", "changefreq": "weekly"},
    {"loc": "https://mintslip.com/vehicle-bill-of-sale-generator", "priority": "0.8", "changefreq": "weekly"},
    {"loc": "https://mintslip.com/service-expense-generator", "priority": "0.8", "changefreq": "weekly"},
    {"loc": "https://mintslip.com/ai-resume-builder", "priority": "0.8", "changefreq": "weekly"},
    {"loc": "https://mintslip.com/how-to-make-a-paystub", "priority": "0.9", "changefreq": "monthly"},
    {"loc": "https://mintslip.com/about", "priority": "0.7", "changefreq": "monthly"},
    {"loc": "https://mintslip.com/contact", "priority": "0.7", "changefreq": "monthly"},
    {"loc": "https://mintslip.com/faq", "priority": "0.7", "changefreq": "monthly"},
    {"loc": "https://mintslip.com/reviews", "priority": "0.7", "changefreq": "monthly"},
    {"loc": "https://mintslip.com/privacy", "priority": "0.5", "changefreq": "yearly"},
    {"loc": "https://mintslip.com/terms", "priority": "0.5", "changefreq": "yearly"},
    {"loc": "https://mintslip.com/blog", "priority": "0.8", "changefreq": "daily"},
]

# State-specific paystub generator pages
US_STATES = [
    "alabama", "alaska", "arizona", "arkansas", "california", "colorado", "connecticut",
    "delaware", "florida", "georgia", "hawaii", "idaho", "illinois", "indiana", "iowa",
    "kansas", "kentucky", "louisiana", "maine", "maryland", "massachusetts", "michigan",
    "minnesota", "mississippi", "missouri", "montana", "nebraska", "nevada", "new-hampshire",
    "new-jersey", "new-mexico", "new-york", "north-carolina", "north-dakota", "ohio",
    "oklahoma", "oregon", "pennsylvania", "rhode-island", "south-carolina", "south-dakota",
    "tennessee", "texas", "utah", "vermont", "virginia", "washington", "west-virginia",
    "wisconsin", "wyoming", "canada"
]

# High priority states
HIGH_PRIORITY_STATES = ["california", "florida", "new-york", "texas"]

@app.get("/api/sitemap.xml")
async def generate_sitemap():
    """Generate dynamic sitemap.xml including all blog posts"""
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    
    # Start XML
    xml_parts = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
    ]
    
    # Add static pages
    for page in STATIC_SITEMAP_PAGES:
        xml_parts.append(f'''  <url>
    <loc>{page["loc"]}</loc>
    <lastmod>{today}</lastmod>
    <changefreq>{page["changefreq"]}</changefreq>
    <priority>{page["priority"]}</priority>
  </url>''')
    
    # Add state-specific paystub generator pages
    for state in US_STATES:
        priority = "0.9" if state in HIGH_PRIORITY_STATES else "0.8"
        xml_parts.append(f'''  <url>
    <loc>https://mintslip.com/paystub-generator/{state}</loc>
    <lastmod>{today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>{priority}</priority>
  </url>''')
    
    # Add blog posts from database
    try:
        blog_posts = await db["blog_posts"].find(
            {"status": "published"},
            {"slug": 1, "publishDate": 1, "updatedAt": 1}
        ).to_list(length=1000)
        
        for post in blog_posts:
            # Use updatedAt if available, otherwise publishDate
            lastmod = post.get("updatedAt") or post.get("publishDate") or today
            if isinstance(lastmod, datetime):
                lastmod = lastmod.strftime("%Y-%m-%d")
            elif isinstance(lastmod, str) and "T" in lastmod:
                lastmod = lastmod.split("T")[0]
            
            xml_parts.append(f'''  <url>
    <loc>https://mintslip.com/blog/{post["slug"]}</loc>
    <lastmod>{lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>''')
    except Exception as e:
        print(f"Error fetching blog posts for sitemap: {e}")
    
    # Close XML
    xml_parts.append('</urlset>')
    
    xml_content = '\n'.join(xml_parts)
    
    return Response(
        content=xml_content,
        media_type="application/xml",
        headers={"Content-Type": "application/xml; charset=utf-8"}
    )


@app.get("/api/sitemap/refresh")
async def refresh_sitemap_info():
    """Get information about sitemap contents (for debugging)"""
    try:
        blog_count = await db["blog_posts"].count_documents({"status": "published"})
        static_count = len(STATIC_SITEMAP_PAGES) + len(US_STATES)
        
        return {
            "success": True,
            "sitemap_url": "/api/sitemap.xml",
            "static_pages": static_count,
            "blog_posts": blog_count,
            "total_urls": static_count + blog_count,
            "message": "Sitemap is generated dynamically. Access /api/sitemap.xml for the full sitemap."
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)

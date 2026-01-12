from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Depends, Query, Request, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Optional
import os
import json
import httpx
import logging
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
import asyncio

# Configure logging
logger = logging.getLogger(__name__)

load_dotenv()

# Import Email Service
from email_service import (
    send_welcome_email,
    send_verification_email,
    schedule_getting_started_email,
    schedule_subscription_thank_you,
    send_download_confirmation,
    schedule_signup_no_purchase_reminder,
    track_checkout_started,
    cancel_abandoned_checkout_email,
    send_review_request,
    send_password_changed_email,
    send_password_reset_email,
    cancel_signup_no_purchase_reminder,
    process_scheduled_emails
)

# Import PDF Engine
from pdf_engine import (
    analyze_pdf_metadata,
    normalize_pdf_metadata,
    generate_analysis_report_pdf,
    PDFAnalysisResult,
    get_document_types,
    get_legitimate_producers,
    DOCUMENT_TYPES,
    analyze_document_with_ai,
    apply_ai_analysis_to_result,
    edit_and_regenerate_pdf,
    get_metadata_presets,
    METADATA_PRESETS,
    clean_paystub_pdf,
    clean_bank_statement_pdf
)

# Import Emergent Integrations for Gemini
from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent

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
subscription_payments_collection = db["subscription_payments"]
blog_posts_collection = db["blog_posts"]
blog_categories_collection = db["blog_categories"]
saved_documents_collection = db["saved_documents"]
site_settings_collection = db["site_settings"]
banned_ips_collection = db["banned_ips"]

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

# Helper function to get client IP address
def get_client_ip(request: Request) -> str:
    """Extract client IP from request, handling proxies"""
    # Check for forwarded headers (common with proxies/load balancers)
    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        # Take the first IP in the chain (original client)
        return forwarded_for.split(",")[0].strip()
    
    real_ip = request.headers.get("x-real-ip")
    if real_ip:
        return real_ip.strip()
    
    # Fallback to direct client IP
    if request.client:
        return request.client.host
    
    return "unknown"

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
    email: Optional[str] = None
    stripePaymentIntentId: Optional[str] = None
    discountCode: Optional[str] = None
    discountAmount: Optional[float] = 0
    userId: Optional[str] = None  # For subscribed users
    template: Optional[str] = None  # Template name/ID used (for paystubs, bank statements)
    quantity: Optional[int] = 1  # Number of documents (e.g., number of paystubs)

class ManualPurchaseCreate(BaseModel):
    documentType: str
    amount: float
    paypalEmail: str
    purchaseDate: Optional[str] = None  # ISO date string, defaults to now
    template: Optional[str] = None
    discountCode: Optional[str] = None
    discountAmount: Optional[float] = 0
    notes: Optional[str] = None  # Admin notes
    quantity: Optional[int] = 1  # Number of documents
    ipAddress: Optional[str] = None  # Customer IP address

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
async def user_signup(data: UserSignup, request: Request):
    """User signup endpoint"""
    # Get client IP
    client_ip = get_client_ip(request)
    
    # Check if IP is banned
    banned = await banned_ips_collection.find_one({"ip": client_ip, "isActive": True})
    if banned:
        raise HTTPException(status_code=403, detail="Access denied")
    
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
        "ipAddress": client_ip,
        "emailVerified": False,
        "verificationCode": secrets.token_hex(3).upper(),  # 6-char code
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
    
    # Send emails asynchronously (don't wait for them)
    asyncio.create_task(send_welcome_email(user["email"], user["name"]))
    asyncio.create_task(send_verification_email(
        user["email"], 
        user["name"], 
        user["verificationCode"],
        f"{os.environ.get('SITE_URL', 'https://mintslip.com')}/verify-email?code={user['verificationCode']}&email={user['email']}"
    ))
    asyncio.create_task(schedule_getting_started_email(user["email"], user["name"], user["id"]))
    asyncio.create_task(schedule_signup_no_purchase_reminder(user["email"], user["name"], user["id"]))
    
    return {
        "success": True,
        "token": token,
        "user": {
            "id": user["id"],
            "email": user["email"],
            "name": user["name"],
            "subscription": None,
            "preferences": user["preferences"],
            "emailVerified": False
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
            "subscription": user.get("subscription"),
            "emailVerified": user.get("emailVerified", True)  # Default True for existing users
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
    
    # Send password changed notification email
    asyncio.create_task(send_password_changed_email(user["email"], user.get("name", "")))
    
    return {"success": True, "message": "Password changed successfully"}


# ========== CHANGE EMAIL ENDPOINT ==========

class ChangeEmailRequest(BaseModel):
    newEmail: str
    password: str

@app.put("/api/user/change-email")
async def change_email(data: ChangeEmailRequest, session: dict = Depends(get_current_user)):
    """Change user's email address - requires password verification and email re-verification"""
    user = await users_collection.find_one({"id": session["userId"]})
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Verify password
    if not verify_password(data.password, user["password"]):
        raise HTTPException(status_code=400, detail="Incorrect password")
    
    # Validate new email format
    new_email = data.newEmail.lower().strip()
    if not new_email or "@" not in new_email or "." not in new_email.split("@")[-1]:
        raise HTTPException(status_code=400, detail="Invalid email address")
    
    # Check if new email is same as current
    if new_email == user["email"].lower():
        raise HTTPException(status_code=400, detail="New email is the same as current email")
    
    # Check if new email is already in use by another user (case-insensitive)
    existing_user = await users_collection.find_one({
        "email": {"$regex": f"^{re.escape(new_email)}$", "$options": "i"},
        "id": {"$ne": session["userId"]}  # Exclude current user
    })
    if existing_user:
        raise HTTPException(status_code=400, detail="This email is already registered to another account")
    
    # Double-check with exact match as well
    exact_match = await users_collection.find_one({"email": new_email})
    if exact_match and exact_match.get("id") != session["userId"]:
        raise HTTPException(status_code=400, detail="This email is already registered to another account")
    
    # Generate new verification code
    verification_code = secrets.token_hex(3).upper()
    old_email = user["email"]
    
    # Update user's email and set as unverified
    await users_collection.update_one(
        {"id": session["userId"]},
        {"$set": {
            "email": new_email,
            "emailVerified": False,
            "verificationCode": verification_code,
            "previousEmail": old_email,
            "emailChangedAt": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # Update session with new email
    await sessions_collection.update_many(
        {"userId": session["userId"]},
        {"$set": {"email": new_email}}
    )
    
    # Send verification email to new address
    asyncio.create_task(send_verification_email(
        new_email,
        user.get("name", ""),
        verification_code,
        f"{os.environ.get('SITE_URL', 'https://mintslip.com')}/verify-email?code={verification_code}&email={new_email}"
    ))
    
    # Return updated user info
    updated_user = await users_collection.find_one({"id": session["userId"]}, {"_id": 0, "password": 0})
    
    return {
        "success": True, 
        "message": "Email updated. Please verify your new email address.",
        "user": {
            "id": updated_user["id"],
            "email": updated_user["email"],
            "name": updated_user.get("name", ""),
            "subscription": updated_user.get("subscription"),
            "preferences": updated_user.get("preferences", {}),
            "emailVerified": False
        }
    }


# ========== EMAIL VERIFICATION ENDPOINTS ==========

class VerifyEmailRequest(BaseModel):
    email: str
    code: str

@app.post("/api/user/verify-email")
async def verify_email(data: VerifyEmailRequest):
    """Verify user's email address"""
    user = await users_collection.find_one({"email": data.email.lower()})
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.get("emailVerified"):
        return {"success": True, "message": "Email already verified"}
    
    if user.get("verificationCode") != data.code.upper():
        raise HTTPException(status_code=400, detail="Invalid verification code")
    
    await users_collection.update_one(
        {"email": data.email.lower()},
        {"$set": {"emailVerified": True}, "$unset": {"verificationCode": ""}}
    )
    
    return {"success": True, "message": "Email verified successfully"}


@app.post("/api/user/resend-verification")
async def resend_verification(session: dict = Depends(get_current_user)):
    """Resend verification email"""
    user = await users_collection.find_one({"id": session["userId"]})
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.get("emailVerified"):
        return {"success": True, "message": "Email already verified"}
    
    # Generate new code
    new_code = secrets.token_hex(3).upper()
    await users_collection.update_one(
        {"id": session["userId"]},
        {"$set": {"verificationCode": new_code}}
    )
    
    # Send verification email
    asyncio.create_task(send_verification_email(
        user["email"],
        user.get("name", ""),
        new_code,
        f"{os.environ.get('SITE_URL', 'https://mintslip.com')}/verify-email?code={new_code}&email={user['email']}"
    ))
    
    return {"success": True, "message": "Verification email sent"}


# ========== FORGOT PASSWORD ENDPOINTS ==========

class ForgotPasswordRequest(BaseModel):
    email: str

@app.post("/api/user/forgot-password")
async def forgot_password(data: ForgotPasswordRequest, request: Request):
    """Send password reset email"""
    # Get client IP for rate limiting
    client_ip = request.client.host if request.client else "unknown"
    
    # Rate limit: 3 password reset requests per minute per IP
    if not check_rate_limit(f"forgot_password_{client_ip}", max_requests=3, window_seconds=60):
        raise HTTPException(status_code=429, detail="Too many requests. Please try again later.")
    
    user = await users_collection.find_one({"email": data.email.lower()})
    
    # Always return success even if user doesn't exist (security best practice)
    if not user:
        return {"success": True, "message": "If an account exists with this email, you will receive a password reset link."}
    
    # Generate reset token and code
    reset_token = secrets.token_urlsafe(32)
    reset_code = secrets.token_hex(3).upper()  # 6-char code
    reset_expiry = datetime.now(timezone.utc) + timedelta(hours=1)
    
    # Store reset token in user record
    await users_collection.update_one(
        {"email": data.email.lower()},
        {"$set": {
            "passwordResetToken": reset_token,
            "passwordResetCode": reset_code,
            "passwordResetExpiry": reset_expiry.isoformat()
        }}
    )
    
    # Send reset email
    reset_link = f"{os.environ.get('SITE_URL', 'https://mintslip.com')}/reset-password?token={reset_token}&email={data.email.lower()}"
    asyncio.create_task(send_password_reset_email(
        user["email"],
        user.get("name", ""),
        reset_link,
        reset_code
    ))
    
    return {"success": True, "message": "If an account exists with this email, you will receive a password reset link."}


class ResetPasswordRequest(BaseModel):
    email: str
    token: Optional[str] = None
    code: Optional[str] = None
    newPassword: str

@app.post("/api/user/reset-password")
async def reset_password(data: ResetPasswordRequest, request: Request):
    """Reset password using token or code"""
    # Get client IP for rate limiting
    client_ip = request.client.host if request.client else "unknown"
    
    # Rate limit: 5 reset attempts per minute per IP
    if not check_rate_limit(f"reset_password_{client_ip}", max_requests=5, window_seconds=60):
        raise HTTPException(status_code=429, detail="Too many attempts. Please try again later.")
    
    user = await users_collection.find_one({"email": data.email.lower()})
    
    if not user:
        raise HTTPException(status_code=400, detail="Invalid reset request")
    
    # Check if reset token/code exists and is valid
    stored_token = user.get("passwordResetToken")
    stored_code = user.get("passwordResetCode")
    expiry = user.get("passwordResetExpiry")
    
    if not stored_token or not expiry:
        raise HTTPException(status_code=400, detail="No password reset request found. Please request a new reset link.")
    
    # Check expiry
    expiry_dt = datetime.fromisoformat(expiry.replace('Z', '+00:00')) if isinstance(expiry, str) else expiry
    if datetime.now(timezone.utc) > expiry_dt:
        # Clear expired reset data
        await users_collection.update_one(
            {"email": data.email.lower()},
            {"$unset": {"passwordResetToken": "", "passwordResetCode": "", "passwordResetExpiry": ""}}
        )
        raise HTTPException(status_code=400, detail="Reset link has expired. Please request a new one.")
    
    # Verify token or code
    token_valid = data.token and data.token == stored_token
    code_valid = data.code and data.code.upper() == stored_code
    
    if not token_valid and not code_valid:
        raise HTTPException(status_code=400, detail="Invalid reset token or code")
    
    # Validate new password
    if len(data.newPassword) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
    
    # Update password and clear reset data
    await users_collection.update_one(
        {"email": data.email.lower()},
        {
            "$set": {
                "password": hash_password(data.newPassword),
                "passwordChangedAt": datetime.now(timezone.utc).isoformat()
            },
            "$unset": {
                "passwordResetToken": "",
                "passwordResetCode": "",
                "passwordResetExpiry": ""
            }
        }
    )
    
    # Send password changed notification
    asyncio.create_task(send_password_changed_email(user["email"], user.get("name", "")))
    
    return {"success": True, "message": "Password reset successfully. You can now log in with your new password."}


# ========== DOWNLOAD EMAIL WITH FILE ATTACHMENT ENDPOINT ==========

class SendDownloadEmailRequest(BaseModel):
    email: str
    userName: Optional[str] = ""
    documentType: str
    pdfBase64: str  # Base64 encoded file content (PDF or ZIP)
    fileName: Optional[str] = None
    isGuest: bool = False
    isZip: bool = False  # True if the file is a ZIP archive

@app.post("/api/send-download-email")
async def send_download_email_with_attachment(data: SendDownloadEmailRequest):
    """
    Send download confirmation email with file attached (PDF or ZIP).
    File is passed in memory and not stored - respects user privacy.
    """
    document_names = {
        "paystub": "Pay Stub",
        "canadian-paystub": "Canadian Pay Stub",
        "w2": "W-2 Form",
        "w9": "W-9 Form",
        "1099-nec": "1099-NEC Form",
        "1099-misc": "1099-MISC Form",
        "bank-statement": "Accounting Mockup",
        "ai-resume": "AI Resume",
        "offer-letter": "Offer Letter",
        "schedule-c": "Schedule C",
        "utility-bill": "Utility Bill",
        "vehicle-bill-of-sale": "Vehicle Bill of Sale"
    }
    
    doc_name = document_names.get(data.documentType, data.documentType.replace("-", " ").title())
    
    # Generate filename if not provided - use .zip extension for ZIP files
    file_ext = ".zip" if data.isZip else ".pdf"
    filename = data.fileName or f"MintSlip_{doc_name.replace(' ', '_')}_{datetime.now().strftime('%Y%m%d')}{file_ext}"
    
    # Ensure correct extension
    if data.isZip and not filename.endswith('.zip'):
        filename = filename.rsplit('.', 1)[0] + '.zip'
    elif not data.isZip and not filename.endswith('.pdf'):
        filename = filename.rsplit('.', 1)[0] + '.pdf'
    
    # Prepare attachment (Resend accepts base64 content directly)
    file_attachment = {
        "filename": filename,
        "content": data.pdfBase64  # Already base64 encoded from frontend
    }
    
    try:
        result = await send_download_confirmation(
            user_email=data.email,
            user_name=data.userName or "",
            document_type=data.documentType,
            download_link=None,
            is_guest=data.isGuest,
            pdf_attachment=file_attachment
        )
        
        if result.get("success"):
            logger.info(f"Download email with {'ZIP' if data.isZip else 'PDF'} attachment sent to {data.email}")
            return {"success": True, "message": f"Email sent with {'ZIP' if data.isZip else 'PDF'} attachment"}
        else:
            logger.error(f"Failed to send download email: {result.get('error')}")
            raise HTTPException(status_code=500, detail=f"Failed to send email: {result.get('error')}")
            
    except Exception as e:
        logger.error(f"Error sending download email with attachment: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to send email: {str(e)}")


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
    subscription = user.get("subscription") if user else None
    subscription_tier = subscription.get("tier", "starter") if subscription else "starter"
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
    
    # Generate unique filename (for reference only)
    file_ext = os.path.splitext(data.fileName)[1] or ".pdf"
    stored_filename = f"{user_id}_{uuid.uuid4()}{file_ext}"
    
    # Store file content as base64 in MongoDB for persistence
    # Also save to disk as backup/cache
    file_path = os.path.join(USER_DOCUMENTS_DIR, stored_filename)
    try:
        with open(file_path, "wb") as f:
            f.write(file_content)
    except Exception as e:
        logger.warning(f"Failed to save file to disk (will use MongoDB): {e}")
    
    # Create document record with file content stored in MongoDB
    doc_id = str(uuid.uuid4())
    document = {
        "id": doc_id,
        "userId": user_id,
        "documentType": data.documentType,
        "fileName": data.fileName,
        "storedFileName": stored_filename,
        "fileSize": len(file_content),
        "template": data.template,
        "fileContent": data.fileData,  # Store base64 content in MongoDB for persistence
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
    from fastapi.responses import FileResponse, Response
    
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
    
    # Determine media type
    file_ext = os.path.splitext(document["fileName"])[1].lower()
    media_types = {
        ".pdf": "application/pdf",
        ".zip": "application/zip"
    }
    media_type = media_types.get(file_ext, "application/octet-stream")
    
    # Try to get file from disk first
    file_path = os.path.join(USER_DOCUMENTS_DIR, document["storedFileName"])
    
    if os.path.exists(file_path):
        return FileResponse(
            path=file_path,
            filename=document["fileName"],
            media_type=media_type
        )
    
    # If file not on disk, try to restore from MongoDB content
    if document.get("fileContent"):
        try:
            file_content = base64.b64decode(document["fileContent"])
            # Restore file to disk for future access
            try:
                with open(file_path, "wb") as f:
                    f.write(file_content)
                logger.info(f"Restored file from MongoDB: {file_path}")
            except Exception as e:
                logger.warning(f"Could not restore file to disk: {e}")
            
            return Response(
                content=file_content,
                media_type=media_type,
                headers={"Content-Disposition": f'attachment; filename="{document["fileName"]}"'}
            )
        except Exception as e:
            logger.error(f"Failed to decode file content from MongoDB: {e}")
    
    raise HTTPException(status_code=404, detail="Document file not found")


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



# ========== STRIPE SUBSCRIPTION ENDPOINTS ==========

# Subscription Plans Configuration
SUBSCRIPTION_PLANS = {
    "starter": {
        "name": "Starter",
        "price": 19.99,
        "price_cents": 1999,
        "downloads": 10,
        "description": "10 downloads per month"
    },
    "professional": {
        "name": "Professional", 
        "price": 29.99,
        "price_cents": 2999,
        "downloads": 30,
        "description": "30 downloads per month"
    },
    "business": {
        "name": "Business",
        "price": 49.99,
        "price_cents": 4999,
        "downloads": -1,
        "description": "Unlimited downloads"
    }
}

# Store for Stripe Price IDs (will be populated when products are created)
stripe_price_ids = {}


@app.get("/api/subscriptions/plans")
async def get_subscription_plans():
    """Get available subscription plans"""
    plans = []
    for tier, config in SUBSCRIPTION_PLANS.items():
        plans.append({
            "tier": tier,
            "name": config["name"],
            "price": config["price"],
            "downloads": config["downloads"],
            "downloads_display": "Unlimited" if config["downloads"] == -1 else str(config["downloads"])
        })
    return {"success": True, "plans": plans}


@app.get("/api/stripe/config")
async def get_stripe_config():
    """Get Stripe publishable key for frontend"""
    return {
        "publishableKey": os.environ.get("STRIPE_PUBLISHABLE_KEY", "pk_test_51SOOSM0OuJwef38xP0FqCJ3b45STthDKnJWP572LoODAaxGIq8ujrAwp1W0MeGkI6XczeweTr7lOLIKC6MnLadoX00iDo2VzYM")
    }


@app.post("/api/stripe/create-checkout-session")
async def create_checkout_session(data: CreateCheckoutSession, session: dict = Depends(get_current_user)):
    """Create a Stripe checkout session for subscription"""
    tier = data.tier
    
    if tier not in SUBSCRIPTION_PLANS:
        raise HTTPException(status_code=400, detail="Invalid subscription tier")
    
    plan = SUBSCRIPTION_PLANS[tier]
    user = await users_collection.find_one({"id": session["userId"]})
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    try:
        # Create or get Stripe customer
        stripe_customer_id = user.get("stripeCustomerId")
        
        if not stripe_customer_id:
            customer = stripe.Customer.create(
                email=user["email"],
                name=user.get("name", ""),
                metadata={"userId": user["id"]}
            )
            stripe_customer_id = customer.id
            await users_collection.update_one(
                {"id": user["id"]},
                {"$set": {"stripeCustomerId": stripe_customer_id}}
            )
        
        # Create price if not exists
        price_id = stripe_price_ids.get(tier)
        if not price_id:
            # Create product and price
            product = stripe.Product.create(
                name=f"MintSlip {plan['name']} Plan",
                description=plan["description"]
            )
            
            price = stripe.Price.create(
                product=product.id,
                unit_amount=plan["price_cents"],
                currency="usd",
                recurring={"interval": "month"}
            )
            price_id = price.id
            stripe_price_ids[tier] = price_id
        
        # Get frontend URL from environment or use default
        frontend_url = os.environ.get("FRONTEND_URL", "https://l7ltqw-3000.csb.app")
        
        # Create checkout session
        checkout_session = stripe.checkout.Session.create(
            customer=stripe_customer_id,
            payment_method_types=["card"],
            line_items=[{
                "price": price_id,
                "quantity": 1
            }],
            mode="subscription",
            success_url=data.successUrl or f"{frontend_url}/subscription/success?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=data.cancelUrl or f"{frontend_url}/subscription/cancel",
            metadata={
                "userId": user["id"],
                "tier": tier
            }
        )
        
        return {
            "success": True,
            "sessionId": checkout_session.id,
            "url": checkout_session.url
        }
        
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/stripe/create-payment-intent")
async def create_payment_intent(request: dict):
    """Create a Stripe payment intent for one-time purchase"""
    amount = request.get("amount")  # Amount in dollars
    document_type = request.get("documentType")
    template = request.get("template")
    email = request.get("email")
    discount_code = request.get("discountCode")
    discount_amount = request.get("discountAmount", 0)
    
    if not amount:
        raise HTTPException(status_code=400, detail="Amount is required")
    
    try:
        # Convert to cents
        amount_cents = int(float(amount) * 100)
        
        # Create payment intent
        intent = stripe.PaymentIntent.create(
            amount=amount_cents,
            currency="usd",
            metadata={
                "documentType": document_type or "",
                "template": template or "",
                "email": email or "",
                "discountCode": discount_code or "",
                "discountAmount": str(discount_amount)
            }
        )
        
        return {
            "success": True,
            "clientSecret": intent.client_secret,
            "paymentIntentId": intent.id
        }
        
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e))


class TrackCheckoutStarted(BaseModel):
    email: str
    documentType: str
    userName: Optional[str] = ""
    userId: Optional[str] = None

@app.post("/api/track-checkout-started")
async def api_track_checkout_started(data: TrackCheckoutStarted):
    """Track when a user starts checkout for abandoned cart emails"""
    if data.email:
        asyncio.create_task(track_checkout_started(
            data.email,
            data.userName or "",
            data.userId,
            data.documentType
        ))
    return {"success": True}


class OneTimeCheckoutRequest(BaseModel):
    amount: float
    documentType: str
    template: Optional[str] = None
    discountCode: Optional[str] = None
    discountAmount: Optional[float] = 0
    successUrl: Optional[str] = None
    cancelUrl: Optional[str] = None
    userId: Optional[str] = None  # Optional userId for logged-in users
    userEmail: Optional[str] = None  # Optional user email
    quantity: Optional[int] = 1  # Number of documents (e.g., number of paystubs)


@app.post("/api/stripe/create-one-time-checkout")
async def create_one_time_checkout(data: OneTimeCheckoutRequest, request: Request, authorization: Optional[str] = Header(None)):
    """Create a Stripe checkout session for one-time document purchase"""
    try:
        # Try to get user info from token if provided
        user_id = data.userId
        user_email = data.userEmail
        
        if authorization and authorization.startswith("Bearer "):
            token = authorization.split(" ")[1]
            session = await sessions_collection.find_one({"token": token})
            if session:
                user = await users_collection.find_one({"id": session["userId"]})
                if user:
                    user_id = user["id"]
                    user_email = user["email"]
        
        # Get client IP for tracking
        client_ip = get_client_ip(request)
        
        # Convert to cents
        amount_cents = int(float(data.amount) * 100)
        
        # Get frontend URL from environment or use default
        frontend_url = os.environ.get("FRONTEND_URL", "https://l7ltqw-3000.csb.app")
        
        # Create checkout session for one-time payment
        # Map document types to display names for Stripe
        doc_display_names = {
            "bank-statement": "Accounting Mockup",
        }
        display_name = doc_display_names.get(data.documentType, data.documentType.replace('-', ' ').title())
        
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=[{
                "price_data": {
                    "currency": "usd",
                    "product_data": {
                        "name": f"MintSlip - {display_name}",
                        "description": f"Professional {display_name} document generation"
                    },
                    "unit_amount": amount_cents,
                },
                "quantity": 1
            }],
            mode="payment",
            success_url=data.successUrl or f"{frontend_url}/payment-success?type={data.documentType}&session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=data.cancelUrl or frontend_url,
            metadata={
                "documentType": data.documentType,
                "template": data.template or "",
                "discountCode": data.discountCode or "",
                "discountAmount": str(data.discountAmount or 0),
                "type": "one_time_purchase",
                "userId": user_id or "",
                "userEmail": user_email or "",
                "clientIp": client_ip,
                "quantity": str(data.quantity or 1)
            }
        )
        
        return {
            "success": True,
            "sessionId": checkout_session.id,
            "url": checkout_session.url
        }
        
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/api/stripe/checkout-status/{session_id}")
async def get_checkout_status(session_id: str):
    """Get the status of a Stripe checkout session"""
    try:
        session = stripe.checkout.Session.retrieve(session_id)
        
        # If payment is complete, process accordingly
        if session.payment_status == "paid" and session.status == "complete":
            user_id = session.metadata.get("userId")
            tier = session.metadata.get("tier")
            purchase_type = session.metadata.get("type")
            
            if user_id and tier:
                # Handle subscription activation
                user = await users_collection.find_one({"id": user_id})
                if user and (not user.get("subscription") or user.get("subscription", {}).get("stripeSubscriptionId") != session.subscription):
                    plan_config = SUBSCRIPTION_PLANS.get(tier, {})
                    
                    # Update user subscription
                    await users_collection.update_one(
                        {"id": user_id},
                        {"$set": {
                            "subscription": {
                                "tier": tier,
                                "status": "active",
                                "stripeSubscriptionId": session.subscription,
                                "stripeCustomerId": session.customer,
                                "downloads_remaining": plan_config.get("downloads", 0),
                                "downloads_total": plan_config.get("downloads", 0),
                                "current_period_start": datetime.now(timezone.utc).isoformat(),
                                "current_period_end": (datetime.now(timezone.utc) + timedelta(days=30)).isoformat(),
                                "createdAt": datetime.now(timezone.utc).isoformat()
                            }
                        }}
                    )
            
            elif purchase_type == "one_time_purchase":
                # Track one-time purchase (if not already tracked)
                existing = await purchases_collection.find_one({"stripeSessionId": session_id})
                if not existing:
                    document_type = session.metadata.get("documentType", "unknown")
                    template = session.metadata.get("template", "")
                    discount_code = session.metadata.get("discountCode", "")
                    discount_amount = float(session.metadata.get("discountAmount", 0))
                    user_id = session.metadata.get("userId", "")
                    user_email = session.metadata.get("userEmail", "")
                    
                    # Get customer email from session if not in metadata
                    customer_email = user_email
                    if not customer_email and hasattr(session, 'customer_details') and session.customer_details:
                        customer_email = getattr(session.customer_details, 'email', "") or ""
                    
                    purchase = {
                        "id": str(uuid.uuid4()),
                        "documentType": document_type,
                        "amount": session.amount_total / 100 if session.amount_total else 0,
                        "email": customer_email,
                        "userId": user_id if user_id else None,
                        "stripeSessionId": session_id,
                        "stripePaymentIntentId": session.payment_intent,
                        "discountCode": discount_code if discount_code else None,
                        "discountAmount": discount_amount,
                        "template": template if template else None,
                        "isGuest": not bool(user_id),
                        "createdAt": datetime.now(timezone.utc).isoformat()
                    }
                    await purchases_collection.insert_one(purchase)
                    print(f"Tracked purchase via status check: {document_type} - ${purchase['amount']} - userId: {user_id or 'guest'}")
                    
                    # Send download confirmation and review request emails
                    if customer_email:
                        # Get user name if logged in
                        user_name = ""
                        if user_id:
                            user = await users_collection.find_one({"id": user_id})
                            if user:
                                user_name = user.get("name", "")
                        is_guest = not bool(user_id)
                        # NOTE: Download confirmation with PDF attachment is now sent from frontend
                        # Only send review request and cancel abandoned checkout emails here
                        asyncio.create_task(send_review_request(customer_email, user_name, document_type, user_id if user_id else None))
                        asyncio.create_task(cancel_abandoned_checkout_email(customer_email))
                    
                    # Increment discount code usage if one was used
                    if discount_code:
                        customer_identifier = customer_email or user_id or session_id
                        update_ops = {"$inc": {"usageCount": 1}}
                        # Check if it's a one_per_customer discount
                        discount = await discounts_collection.find_one({"code": discount_code.upper()})
                        if discount and discount.get("usageType") == "one_per_customer" and customer_identifier:
                            update_ops["$push"] = {"usedByCustomers": customer_identifier}
                        await discounts_collection.update_one({"code": discount_code.upper()}, update_ops)
                        print(f"Incremented usage count for discount code: {discount_code}")
        
        return {
            "status": session.status,
            "payment_status": session.payment_status,
            "amount_total": session.amount_total,
            "currency": session.currency,
            "metadata": dict(session.metadata) if session.metadata else {},
            "customer_email": getattr(session.customer_details, 'email', "") if hasattr(session, 'customer_details') and session.customer_details else ""
        }
        
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/stripe/webhook")
async def stripe_webhook(request: Request):
    """Handle Stripe webhooks"""
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    
    # In production, verify webhook signature
    # For now, just parse the event
    try:
        event = stripe.Event.construct_from(
            json.loads(payload), stripe.api_key
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Webhook error: {str(e)}")
    
    # Handle the event
    if event.type == "checkout.session.completed":
        session = event.data.object
        
        # Get metadata
        user_id = session.metadata.get("userId")
        tier = session.metadata.get("tier")
        purchase_type = session.metadata.get("type")
        
        if user_id and tier:
            # Handle subscription purchase
            plan_config = SUBSCRIPTION_PLANS.get(tier, {})
            
            # Update user subscription
            await users_collection.update_one(
                {"id": user_id},
                {"$set": {
                    "subscription": {
                        "tier": tier,
                        "status": "active",
                        "stripeSubscriptionId": session.subscription,
                        "stripeCustomerId": session.customer,
                        "downloads_remaining": plan_config.get("downloads", 0),
                        "downloads_total": plan_config.get("downloads", 0),
                        "current_period_start": datetime.now(timezone.utc).isoformat(),
                        "current_period_end": (datetime.now(timezone.utc) + timedelta(days=30)).isoformat(),
                        "createdAt": datetime.now(timezone.utc).isoformat()
                    }
                }}
            )
            
            # Create subscription record
            subscription_record = {
                "id": str(uuid.uuid4()),
                "userId": user_id,
                "tier": tier,
                "stripeSubscriptionId": session.subscription,
                "stripeCustomerId": session.customer,
                "status": "active",
                "createdAt": datetime.now(timezone.utc).isoformat()
            }
            await subscriptions_collection.insert_one(subscription_record)
            
            # Send subscription thank you email and cancel no-purchase reminder
            user = await users_collection.find_one({"id": user_id})
            if user:
                asyncio.create_task(schedule_subscription_thank_you(
                    user["email"],
                    user.get("name", ""),
                    user_id,
                    plan_config.get("name", tier.title()),
                    str(plan_config.get("price", 0)),
                    plan_config.get("downloads", 0)
                ))
                asyncio.create_task(cancel_signup_no_purchase_reminder(user_id))
        
        elif purchase_type == "one_time_purchase":
            # Handle one-time guest purchase
            document_type = session.metadata.get("documentType", "unknown")
            template = session.metadata.get("template", "")
            discount_code = session.metadata.get("discountCode", "")
            discount_amount = float(session.metadata.get("discountAmount", 0))
            
            # Get customer email from session if available
            customer_email = ""
            if session.customer_details:
                customer_email = session.customer_details.get("email", "")
            
            # Get client IP from the webhook request
            client_ip = get_client_ip(request)
            
            # Also try to get IP from metadata if passed during checkout creation
            metadata_ip = session.metadata.get("clientIp", "")
            
            # Get quantity from metadata
            quantity = int(session.metadata.get("quantity", 1))
            
            purchase = {
                "id": str(uuid.uuid4()),
                "documentType": document_type,
                "amount": session.amount_total / 100 if session.amount_total else 0,
                "email": customer_email,
                "stripeSessionId": session.id,
                "stripePaymentIntentId": session.payment_intent,
                "discountCode": discount_code if discount_code else None,
                "discountAmount": discount_amount,
                "template": template if template else None,
                "quantity": quantity,
                "isGuest": True,
                "ipAddress": metadata_ip if metadata_ip else client_ip,
                "createdAt": datetime.now(timezone.utc).isoformat()
            }
            await purchases_collection.insert_one(purchase)
            print(f"Tracked guest purchase: {document_type} - ${purchase['amount']}")
            
            # Send emails for guest purchase
            if customer_email:
                # NOTE: Download confirmation with PDF attachment is now sent from frontend
                asyncio.create_task(send_review_request(customer_email, "", document_type, None))
                asyncio.create_task(cancel_abandoned_checkout_email(customer_email))
            
            # Increment discount code usage if one was used
            if discount_code:
                customer_identifier = customer_email or session.id
                update_ops = {"$inc": {"usageCount": 1}}
                # Check if it's a one_per_customer discount
                discount = await discounts_collection.find_one({"code": discount_code.upper()})
                if discount and discount.get("usageType") == "one_per_customer" and customer_identifier:
                    update_ops["$push"] = {"usedByCustomers": customer_identifier}
                await discounts_collection.update_one({"code": discount_code.upper()}, update_ops)
                print(f"Incremented usage count for discount code: {discount_code}")
    
    elif event.type == "invoice.payment_succeeded":
        invoice = event.data.object
        subscription_id = invoice.subscription
        
        if subscription_id:
            # Find user with this subscription
            user = await users_collection.find_one({"subscription.stripeSubscriptionId": subscription_id})
            if user:
                tier = user["subscription"].get("tier")
                plan_config = SUBSCRIPTION_PLANS.get(tier, {})
                
                # Record the subscription payment
                payment_amount = invoice.amount_paid / 100  # Convert from cents
                subscription_payment = {
                    "id": str(uuid.uuid4()),
                    "userId": user["id"],
                    "userEmail": user.get("email", ""),
                    "tier": tier,
                    "amount": payment_amount,
                    "stripeInvoiceId": invoice.id,
                    "stripeSubscriptionId": subscription_id,
                    "billingReason": invoice.billing_reason,  # 'subscription_create', 'subscription_cycle', 'subscription_update'
                    "createdAt": datetime.now(timezone.utc).isoformat()
                }
                await subscription_payments_collection.insert_one(subscription_payment)
                print(f"Recorded subscription payment: {payment_amount} for user {user['id']} tier {tier}")
                
                # Reset downloads for the new billing period
                await users_collection.update_one(
                    {"id": user["id"]},
                    {"$set": {
                        "subscription.downloads_remaining": plan_config.get("downloads", 0),
                        "subscription.current_period_end": (datetime.now(timezone.utc) + timedelta(days=30)).isoformat()
                    }}
                )
    
    elif event.type == "customer.subscription.deleted":
        subscription = event.data.object
        subscription_id = subscription.id
        
        # Find and update user
        user = await users_collection.find_one({"subscription.stripeSubscriptionId": subscription_id})
        if user:
            await users_collection.update_one(
                {"id": user["id"]},
                {"$set": {"subscription.status": "cancelled"}}
            )
    
    elif event.type == "customer.subscription.updated":
        # Handle subscription updates from Stripe (e.g., plan changes, renewals)
        subscription = event.data.object
        subscription_id = subscription.id
        
        # Find user with this subscription
        user = await users_collection.find_one({"subscription.stripeSubscriptionId": subscription_id})
        if user:
            # Get the current price/plan from Stripe subscription
            if subscription.items and subscription.items.data:
                current_item = subscription.items.data[0]
                stripe_price_id = current_item.price.id
                
                # Try to find the matching tier from our stored price IDs
                new_tier = None
                for tier, price_id in stripe_price_ids.items():
                    if price_id == stripe_price_id:
                        new_tier = tier
                        break
                
                # If we found a matching tier and it's different from current, update
                if new_tier and new_tier != user.get("subscription", {}).get("tier"):
                    plan_config = SUBSCRIPTION_PLANS.get(new_tier, {})
                    await users_collection.update_one(
                        {"id": user["id"]},
                        {"$set": {
                            "subscription.tier": new_tier,
                            "subscription.downloads_remaining": plan_config.get("downloads", 0),
                            "subscription.downloads_total": plan_config.get("downloads", 0),
                            "subscription.status": subscription.status,
                            "subscription.updatedAt": datetime.now(timezone.utc).isoformat()
                        }}
                    )
                    print(f"Webhook updated user {user['id']} subscription to {new_tier}")
                else:
                    # Just update the status if tier hasn't changed
                    await users_collection.update_one(
                        {"id": user["id"]},
                        {"$set": {
                            "subscription.status": subscription.status,
                            "subscription.updatedAt": datetime.now(timezone.utc).isoformat()
                        }}
                    )
    
    elif event.type == "payment_intent.succeeded":
        payment_intent = event.data.object
        
        # Track purchase for one-time payments
        metadata = payment_intent.metadata
        if metadata.get("documentType"):
            purchase = {
                "id": str(uuid.uuid4()),
                "documentType": metadata.get("documentType"),
                "amount": payment_intent.amount / 100,
                "email": metadata.get("email", ""),
                "stripePaymentIntentId": payment_intent.id,
                "discountCode": metadata.get("discountCode"),
                "discountAmount": float(metadata.get("discountAmount", 0)),
                "template": metadata.get("template"),
                "createdAt": datetime.now(timezone.utc).isoformat()
            }
            await purchases_collection.insert_one(purchase)
    
    return {"status": "received"}


@app.post("/api/stripe/cancel-subscription")
async def cancel_stripe_subscription(session: dict = Depends(get_current_user)):
    """Cancel user's Stripe subscription"""
    user = await users_collection.find_one({"id": session["userId"]})
    
    if not user or not user.get("subscription"):
        raise HTTPException(status_code=404, detail="No active subscription found")
    
    subscription_id = user["subscription"].get("stripeSubscriptionId")
    
    if not subscription_id:
        raise HTTPException(status_code=400, detail="No Stripe subscription found")
    
    try:
        # Cancel at period end (user keeps access until end of billing period)
        stripe.Subscription.modify(
            subscription_id,
            cancel_at_period_end=True
        )
        
        await users_collection.update_one(
            {"id": user["id"]},
            {"$set": {"subscription.status": "cancelling"}}
        )
        
        return {"success": True, "message": "Subscription will be cancelled at the end of the billing period"}
        
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/stripe/reactivate-subscription")
async def reactivate_stripe_subscription(session: dict = Depends(get_current_user)):
    """Reactivate a cancelled Stripe subscription"""
    user = await users_collection.find_one({"id": session["userId"]})
    
    if not user or not user.get("subscription"):
        raise HTTPException(status_code=404, detail="No subscription found")
    
    subscription_id = user["subscription"].get("stripeSubscriptionId")
    
    if not subscription_id:
        raise HTTPException(status_code=400, detail="No Stripe subscription found")
    
    try:
        stripe.Subscription.modify(
            subscription_id,
            cancel_at_period_end=False
        )
        
        await users_collection.update_one(
            {"id": user["id"]},
            {"$set": {"subscription.status": "active"}}
        )
        
        return {"success": True, "message": "Subscription reactivated"}
        
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/stripe/preview-proration")
async def preview_subscription_proration(request: dict, session: dict = Depends(get_current_user)):
    """Preview the prorated amount for a subscription change"""
    new_tier = request.get("tier")
    
    if new_tier not in SUBSCRIPTION_PLANS:
        raise HTTPException(status_code=400, detail="Invalid subscription tier")
    
    user = await users_collection.find_one({"id": session["userId"]})
    
    if not user or not user.get("subscription"):
        raise HTTPException(status_code=404, detail="No active subscription found")
    
    current_tier = user["subscription"].get("tier")
    if current_tier == new_tier:
        raise HTTPException(status_code=400, detail="Already on this plan")
    
    subscription_id = user["subscription"].get("stripeSubscriptionId")
    
    if not subscription_id:
        raise HTTPException(status_code=400, detail="No Stripe subscription found")
    
    try:
        # Get current subscription
        subscription = stripe.Subscription.retrieve(subscription_id)
        
        # Get or create price for new tier
        price_id = stripe_price_ids.get(new_tier)
        if not price_id:
            plan = SUBSCRIPTION_PLANS[new_tier]
            product = stripe.Product.create(
                name=f"MintSlip {plan['name']} Plan",
                description=plan["description"]
            )
            price = stripe.Price.create(
                product=product.id,
                unit_amount=plan["price_cents"],
                currency="usd",
                recurring={"interval": "month"}
            )
            price_id = price.id
            stripe_price_ids[new_tier] = price_id
        
        # Create an invoice preview to see the proration
        upcoming_invoice = stripe.Invoice.create_preview(
            customer=subscription.customer,
            subscription=subscription_id,
            subscription_details={
                "items": [{
                    "id": subscription["items"]["data"][0].id,
                    "price": price_id
                }],
                "proration_behavior": "create_prorations"
            }
        )
        
        # Calculate proration amounts from invoice lines
        # The invoice preview includes: proration charges + next billing period
        # We only want to show the proration (immediate charge), not the next period
        proration_charge = 0  # Amount charged for new plan's remaining time
        proration_credit = 0  # Credit for old plan's unused time
        next_period_amount = 0  # Next full billing cycle (not immediate)
        
        for line in upcoming_invoice.lines.data:
            description = getattr(line, 'description', '') or ''
            amount = line.amount
            
            # Debug: print line details
            print(f"Invoice line: {description[:50]}... amount={amount}")
            
            # Proration lines contain "Remaining time" or "Unused time"
            # Or they might say "time on [Plan Name]"
            is_proration_line = any(phrase in description.lower() for phrase in [
                'remaining time', 'unused time', 'time on', 'proration'
            ])
            
            if is_proration_line:
                if amount > 0:
                    proration_charge += amount
                else:
                    proration_credit += abs(amount)
            else:
                # This is the next billing period charge
                next_period_amount += amount
        
        # Net proration amount (what user pays NOW, not including next period)
        net_proration = proration_charge - proration_credit
        
        is_upgrade = SUBSCRIPTION_PLANS[new_tier]["price_cents"] > SUBSCRIPTION_PLANS[current_tier]["price_cents"]
        
        # Get period end date - use get() for safety
        period_end_timestamp = getattr(subscription, 'current_period_end', None)
        if period_end_timestamp:
            period_end = datetime.fromtimestamp(period_end_timestamp)
            days_remaining = (period_end - datetime.now()).days
        else:
            period_end = datetime.now() + timedelta(days=30)
            days_remaining = 30
        
        # Calculate a sensible proration if Stripe's numbers seem off
        # Proration should be: (new_price - old_price) * (days_remaining / 30)
        old_price = SUBSCRIPTION_PLANS[current_tier]["price_cents"]
        new_price = SUBSCRIPTION_PLANS[new_tier]["price_cents"]
        expected_proration = (new_price - old_price) * (max(0, days_remaining) / 30)
        
        # Use calculated proration if Stripe's seems unreasonable
        # (more than 2x the monthly difference is suspicious)
        monthly_diff = abs(new_price - old_price)
        if abs(net_proration) > monthly_diff * 2:
            print(f"Warning: Stripe proration {net_proration} seems high, using calculated: {expected_proration}")
            net_proration = int(expected_proration)
        
        return {
            "success": True,
            "preview": {
                "currentTier": current_tier,
                "currentTierName": SUBSCRIPTION_PLANS[current_tier]["name"],
                "newTier": new_tier,
                "newTierName": SUBSCRIPTION_PLANS[new_tier]["name"],
                "isUpgrade": is_upgrade,
                "currentPlanCredit": proration_credit / 100,  # Convert cents to dollars
                "newPlanCharge": proration_charge / 100,
                "netAmountDue": net_proration / 100,  # Just the proration, not next period
                "newMonthlyPrice": new_price / 100,
                "daysRemainingInPeriod": max(0, days_remaining),
                "periodEndDate": period_end.isoformat(),
                "immediateCharge": net_proration > 0,
                "creditApplied": net_proration < 0
            }
        }
        
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/stripe/change-subscription")
async def change_stripe_subscription(request: dict, session: dict = Depends(get_current_user)):
    """Change subscription tier"""
    new_tier = request.get("tier")
    
    if new_tier not in SUBSCRIPTION_PLANS:
        raise HTTPException(status_code=400, detail="Invalid subscription tier")
    
    user = await users_collection.find_one({"id": session["userId"]})
    
    if not user or not user.get("subscription"):
        raise HTTPException(status_code=404, detail="No active subscription found")
    
    subscription_id = user["subscription"].get("stripeSubscriptionId")
    
    if not subscription_id:
        raise HTTPException(status_code=400, detail="No Stripe subscription found")
    
    try:
        # Get current subscription
        subscription = stripe.Subscription.retrieve(subscription_id)
        
        # Get or create price for new tier
        price_id = stripe_price_ids.get(new_tier)
        if not price_id:
            plan = SUBSCRIPTION_PLANS[new_tier]
            product = stripe.Product.create(
                name=f"MintSlip {plan['name']} Plan",
                description=plan["description"]
            )
            price = stripe.Price.create(
                product=product.id,
                unit_amount=plan["price_cents"],
                currency="usd",
                recurring={"interval": "month"}
            )
            price_id = price.id
            stripe_price_ids[new_tier] = price_id
        
        # Update subscription in Stripe
        updated_stripe_sub = stripe.Subscription.modify(
            subscription_id,
            items=[{
                "id": subscription["items"]["data"][0].id,
                "price": price_id
            }],
            proration_behavior="create_prorations"
        )
        
        print(f"Stripe subscription updated: {updated_stripe_sub.id} to price {price_id}")
        
        # Update user record in MongoDB
        plan_config = SUBSCRIPTION_PLANS[new_tier]
        update_result = await users_collection.update_one(
            {"id": user["id"]},
            {"$set": {
                "subscription.tier": new_tier,
                "subscription.downloads_remaining": plan_config["downloads"],
                "subscription.downloads_total": plan_config["downloads"],
                "subscription.updatedAt": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        print(f"MongoDB update result: matched={update_result.matched_count}, modified={update_result.modified_count}")
        
        # Verify the update
        updated_user = await users_collection.find_one({"id": user["id"]})
        if updated_user:
            print(f"Verified user subscription tier: {updated_user.get('subscription', {}).get('tier')}")
        
        return {"success": True, "message": f"Subscription changed to {plan_config['name']}", "newTier": new_tier}
        
    except stripe.error.StripeError as e:
        print(f"Stripe error during subscription change: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/api/stripe/subscription-status")
async def get_subscription_status(session: dict = Depends(get_current_user)):
    """Get current user's subscription status from Stripe"""
    user = await users_collection.find_one({"id": session["userId"]})
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if not user.get("subscription") or not user["subscription"].get("stripeSubscriptionId"):
        return {"success": True, "hasSubscription": False}
    
    try:
        subscription = stripe.Subscription.retrieve(user["subscription"]["stripeSubscriptionId"])
        
        return {
            "success": True,
            "hasSubscription": True,
            "status": subscription.status,
            "cancelAtPeriodEnd": subscription.cancel_at_period_end,
            "currentPeriodEnd": datetime.fromtimestamp(subscription.current_period_end).isoformat(),
            "tier": user["subscription"].get("tier"),
            "downloadsRemaining": user["subscription"].get("downloads_remaining", 0)
        }
        
    except stripe.error.StripeError as e:
        return {"success": False, "error": str(e)}

# ========== PURCHASE TRACKING ENDPOINTS ==========

@app.post("/api/purchases/track")
async def track_purchase(data: PurchaseCreate, request: Request):
    """Track a purchase"""
    # Get client IP
    client_ip = get_client_ip(request)
    
    purchase = {
        "id": str(uuid.uuid4()),
        "documentType": data.documentType,
        "amount": data.amount,
        "email": data.email,
        "stripePaymentIntentId": data.stripePaymentIntentId,
        "discountCode": data.discountCode,
        "discountAmount": data.discountAmount,
        "userId": data.userId,
        "template": data.template,
        "quantity": data.quantity or 1,
        "ipAddress": client_ip,
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
    # Total purchases (count of purchase records)
    total_purchases = await purchases_collection.count_documents({})
    
    # Total downloads (sum of quantities - for paystubs etc.)
    total_downloads_pipeline = [
        {"$group": {"_id": None, "total": {"$sum": {"$ifNull": ["$quantity", 1]}}}}
    ]
    downloads_result = await purchases_collection.aggregate(total_downloads_pipeline).to_list(1)
    total_downloads = downloads_result[0]["total"] if downloads_result else total_purchases
    
    # Total revenue from one-time purchases
    pipeline = [
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
    ]
    revenue_result = await purchases_collection.aggregate(pipeline).to_list(1)
    total_revenue = revenue_result[0]["total"] if revenue_result else 0
    
    # Purchases by document type (with quantity sum)
    type_pipeline = [
        {"$group": {
            "_id": "$documentType", 
            "count": {"$sum": 1}, 
            "totalQuantity": {"$sum": {"$ifNull": ["$quantity", 1]}},
            "revenue": {"$sum": "$amount"}
        }}
    ]
    purchases_by_type = await purchases_collection.aggregate(type_pipeline).to_list(100)
    
    # Get purchases for the last year for chart data
    one_year_ago = datetime.now(timezone.utc) - timedelta(days=365)
    recent_purchases = await purchases_collection.find(
        {"createdAt": {"$gte": one_year_ago.isoformat()}},
        {"_id": 0}
    ).sort("createdAt", -1).to_list(5000)
    
    # Get subscription payments for the last year for chart data
    recent_subscription_payments = await subscription_payments_collection.find(
        {"createdAt": {"$gte": one_year_ago.isoformat()}},
        {"_id": 0}
    ).sort("createdAt", -1).to_list(5000)
    
    # Total users
    total_users = await users_collection.count_documents({})
    
    # ===== SUBSCRIPTION STATS =====
    # Total active subscribers
    total_subscribers = await users_collection.count_documents({
        "subscription.status": "active"
    })
    
    # Total cancelling subscribers (pending cancellation at period end)
    cancelling_subscribers = await users_collection.count_documents({
        "subscription.status": "cancelling"
    })
    
    # Subscribers by tier (active only)
    subscribers_by_tier = {
        "starter": await users_collection.count_documents({"subscription.tier": "starter", "subscription.status": "active"}),
        "professional": await users_collection.count_documents({"subscription.tier": "professional", "subscription.status": "active"}),
        "business": await users_collection.count_documents({"subscription.tier": "business", "subscription.status": "active"})
    }
    
    # Cancelling subscribers by tier
    cancelling_by_tier = {
        "starter": await users_collection.count_documents({"subscription.tier": "starter", "subscription.status": "cancelling"}),
        "professional": await users_collection.count_documents({"subscription.tier": "professional", "subscription.status": "cancelling"}),
        "business": await users_collection.count_documents({"subscription.tier": "business", "subscription.status": "cancelling"})
    }
    
    # Monthly subscription revenue (calculated from active subscribers only)
    subscription_prices = {"starter": 19.99, "professional": 29.99, "business": 49.99}
    monthly_subscription_revenue = sum(
        count * subscription_prices.get(tier, 0) 
        for tier, count in subscribers_by_tier.items()
    )
    
    # Recent subscriptions (users who subscribed recently)
    recent_subscribers = await users_collection.find(
        {"subscription.status": {"$in": ["active", "cancelling"]}},
        {"_id": 0, "password": 0}
    ).sort("subscription.createdAt", -1).limit(10).to_list(10)
    
    # Subscription records from subscriptions collection
    subscription_records = await subscriptions_collection.find(
        {},
        {"_id": 0}
    ).sort("createdAt", -1).limit(20).to_list(20)
    
    # Today's stats
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
    today_purchases = await purchases_collection.count_documents({"createdAt": {"$gte": today_start}})
    
    # Today's revenue from guest purchases
    today_revenue_pipeline = [
        {"$match": {"createdAt": {"$gte": today_start}}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
    ]
    today_revenue_result = await purchases_collection.aggregate(today_revenue_pipeline).to_list(1)
    today_guest_revenue = today_revenue_result[0]["total"] if today_revenue_result else 0
    
    # Today's subscription revenue
    today_sub_revenue_pipeline = [
        {"$match": {"createdAt": {"$gte": today_start}}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
    ]
    today_sub_revenue_result = await subscription_payments_collection.aggregate(today_sub_revenue_pipeline).to_list(1)
    today_subscription_revenue = today_sub_revenue_result[0]["total"] if today_sub_revenue_result else 0
    
    # Combined today's revenue
    today_revenue = today_guest_revenue + today_subscription_revenue
    
    # New subscribers today
    today_new_subscribers = await subscriptions_collection.count_documents({"createdAt": {"$gte": today_start}})
    
    # ===== ALL-TIME SUBSCRIPTION REVENUE =====
    # Total revenue from subscription payments (all-time)
    total_sub_revenue_pipeline = [
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
    ]
    total_sub_revenue_result = await subscription_payments_collection.aggregate(total_sub_revenue_pipeline).to_list(1)
    total_subscription_revenue = total_sub_revenue_result[0]["total"] if total_sub_revenue_result else 0
    
    # Combined all-time revenue (guest purchases + subscription payments)
    combined_total_revenue = total_revenue + total_subscription_revenue
    
    # ===== USER REGISTRATION TRENDS (for charts) =====
    # Get user registrations over the last 30 days
    thirty_days_ago = (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()
    user_registration_pipeline = [
        {"$match": {"createdAt": {"$gte": thirty_days_ago}}},
        {"$group": {
            "_id": {"$substr": ["$createdAt", 0, 10]},  # Group by date (YYYY-MM-DD)
            "count": {"$sum": 1}
        }},
        {"$sort": {"_id": 1}}
    ]
    user_registrations = await users_collection.aggregate(user_registration_pipeline).to_list(31)
    
    return {
        "success": True,
        "stats": {
            "totalPurchases": total_purchases,
            "totalDownloads": total_downloads,
            "totalRevenue": round(total_revenue, 2),
            "totalSubscriptionRevenue": round(total_subscription_revenue, 2),
            "combinedTotalRevenue": round(combined_total_revenue, 2),
            "totalSubscribers": total_subscribers,
            "cancellingSubscribers": cancelling_subscribers,
            "totalUsers": total_users,
            "todayPurchases": today_purchases,
            "todayRevenue": round(today_revenue, 2),
            "todayGuestRevenue": round(today_guest_revenue, 2),
            "todaySubscriptionRevenue": round(today_subscription_revenue, 2),
            "todayNewSubscribers": today_new_subscribers,
            "monthlySubscriptionRevenue": round(monthly_subscription_revenue, 2)
        },
        "subscriptionStats": {
            "total": total_subscribers,
            "cancelling": cancelling_subscribers,
            "byTier": subscribers_by_tier,
            "cancellingByTier": cancelling_by_tier,
            "monthlyRevenue": round(monthly_subscription_revenue, 2),
            "totalRevenue": round(total_subscription_revenue, 2),
            "recentSubscribers": recent_subscribers,
            "subscriptionRecords": subscription_records
        },
        "purchasesByType": purchases_by_type,
        "recentPurchases": recent_purchases,
        "recentSubscriptionPayments": recent_subscription_payments,
        "userRegistrations": user_registrations
    }

@app.get("/api/admin/users")
async def get_all_users(
    session: dict = Depends(get_current_admin),
    skip: int = 0,
    limit: int = 50,
    search: Optional[str] = None,
    subscription_type: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None
):
    """Get all users (admin only) with optional filtering and search"""
    # Build query based on filters
    query = {}
    conditions = []
    
    # Search by name or email
    if search:
        search_regex = {"$regex": search, "$options": "i"}
        conditions.append({
            "$or": [
                {"name": search_regex},
                {"email": search_regex}
            ]
        })
    
    # Filter by subscription type
    if subscription_type:
        if subscription_type == "none":
            # Users with no subscription (either field doesn't exist or is null)
            conditions.append({
                "$or": [
                    {"subscription": {"$exists": False}},
                    {"subscription": None}
                ]
            })
        elif subscription_type in ["starter", "professional", "business"]:
            conditions.append({"subscription.tier": subscription_type})
    
    # Filter by join date
    if date_from or date_to:
        date_query = {}
        if date_from:
            date_query["$gte"] = date_from
        if date_to:
            date_query["$lte"] = date_to
        if date_query:
            conditions.append({"createdAt": date_query})
    
    # Combine all conditions
    if conditions:
        if len(conditions) == 1:
            query = conditions[0]
        else:
            query["$and"] = conditions
    
    users = await users_collection.find(query, {"_id": 0, "password": 0}).sort("createdAt", -1).skip(skip).limit(limit).to_list(limit)
    total = await users_collection.count_documents(query)
    
    return {
        "success": True,
        "users": users,
        "total": total
    }

@app.get("/api/admin/revenue")
async def get_revenue_by_period(
    session: dict = Depends(get_current_admin),
    startDate: Optional[str] = None,
    endDate: Optional[str] = None,
    userType: Optional[str] = None,  # "guest" or "registered"
    revenueType: Optional[str] = None  # "all", "guest", "subscription"
):
    """Get revenue for a specific period (admin only)"""
    
    # Build date conditions
    date_conditions = []
    if startDate:
        date_conditions.append({"createdAt": {"$gte": startDate}})
    if endDate:
        date_conditions.append({"createdAt": {"$lte": endDate}})
    
    # Calculate guest/one-time purchase revenue
    guest_revenue = 0
    guest_count = 0
    guest_downloads = 0
    
    if revenueType in [None, "all", "guest"]:
        conditions = date_conditions.copy()
        
        # Filter by user type for guest purchases
        if userType == "guest":
            conditions.append({
                "$or": [
                    {"userId": None}, 
                    {"userId": ""}, 
                    {"userId": {"$exists": False}}, 
                    {"isGuest": True}
                ]
            })
        elif userType == "registered":
            conditions.append({
                "$and": [
                    {"userId": {"$exists": True}},
                    {"userId": {"$ne": None}},
                    {"userId": {"$ne": ""}}
                ]
            })
        
        query = {"$and": conditions} if conditions else {}
        
        pipeline = [
            {"$match": query} if query else {"$match": {}},
            {"$group": {
                "_id": None, 
                "total": {"$sum": "$amount"}, 
                "count": {"$sum": 1},
                "downloadCount": {"$sum": {"$ifNull": ["$quantity", 1]}}
            }}
        ]
        
        result = await purchases_collection.aggregate(pipeline).to_list(1)
        if result:
            guest_revenue = result[0]["total"]
            guest_count = result[0]["count"]
            guest_downloads = result[0]["downloadCount"]
    
    # Calculate subscription revenue
    subscription_revenue = 0
    subscription_count = 0
    
    if revenueType in [None, "all", "subscription"]:
        sub_conditions = date_conditions.copy()
        sub_query = {"$and": sub_conditions} if sub_conditions else {}
        
        sub_pipeline = [
            {"$match": sub_query} if sub_query else {"$match": {}},
            {"$group": {
                "_id": None, 
                "total": {"$sum": "$amount"}, 
                "count": {"$sum": 1}
            }}
        ]
        
        sub_result = await subscription_payments_collection.aggregate(sub_pipeline).to_list(1)
        if sub_result:
            subscription_revenue = sub_result[0]["total"]
            subscription_count = sub_result[0]["count"]
    
    # Calculate totals based on filter
    if revenueType == "guest":
        total_revenue = guest_revenue
        total_count = guest_count
    elif revenueType == "subscription":
        total_revenue = subscription_revenue
        total_count = subscription_count
    else:  # "all" or None
        total_revenue = guest_revenue + subscription_revenue
        total_count = guest_count + subscription_count
    
    return {
        "success": True,
        "revenue": round(total_revenue, 2),
        "guestRevenue": round(guest_revenue, 2),
        "subscriptionRevenue": round(subscription_revenue, 2),
        "purchaseCount": total_count,
        "guestPurchaseCount": guest_count,
        "subscriptionPaymentCount": subscription_count,
        "downloadCount": guest_downloads,
        "period": {
            "startDate": startDate,
            "endDate": endDate
        },
        "userType": userType,
        "revenueType": revenueType or "all"
    }

@app.post("/api/admin/import-historical-subscriptions")
async def import_historical_subscriptions(
    session: dict = Depends(get_current_admin),
    limit: int = 100  # Process in batches to avoid timeout
):
    """
    Import historical subscription payments from Stripe.
    Fetches all paid invoices from Stripe and records them in subscription_payments_collection.
    """
    try:
        imported_count = 0
        skipped_count = 0
        error_count = 0
        already_exists_count = 0
        
        # First, get all subscriptions from Stripe and import their invoices
        has_more = True
        starting_after = None
        total_processed = 0
        processed_invoice_ids = set()  # Track to avoid duplicates
        
        logger.info("Starting historical subscription import...")
        
        # Method 1: Get all subscriptions and their invoices
        subscriptions_has_more = True
        sub_starting_after = None
        
        while subscriptions_has_more and total_processed < limit:
            sub_params = {"limit": 100, "status": "all"}
            if sub_starting_after:
                sub_params["starting_after"] = sub_starting_after
            
            subscriptions = stripe.Subscription.list(**sub_params)
            logger.info(f"Fetched {len(subscriptions.data)} subscriptions from Stripe")
            
            for subscription in subscriptions.data:
                # Get all invoices for this subscription
                invoice_params = {
                    "subscription": subscription.id,
                    "status": "paid",
                    "limit": 100
                }
                
                try:
                    sub_invoices = stripe.Invoice.list(**invoice_params)
                    logger.info(f"Subscription {subscription.id}: found {len(sub_invoices.data)} paid invoices")
                    
                    for invoice in sub_invoices.data:
                        if invoice.id in processed_invoice_ids:
                            continue
                        processed_invoice_ids.add(invoice.id)
                        total_processed += 1
                        
                        if total_processed > limit:
                            break
                        
                        try:
                            # Check if this payment already exists
                            existing = await subscription_payments_collection.find_one({
                                "stripeInvoiceId": invoice.id
                            })
                            if existing:
                                logger.info(f"Invoice {invoice.id} already exists in DB")
                                already_exists_count += 1
                                continue
                            
                            # Get subscription ID
                            subscription_id = subscription.id
                            
                            # Get customer ID
                            customer_id = invoice.customer if isinstance(invoice.customer, str) else (invoice.customer.id if hasattr(invoice.customer, 'id') else None)
                            
                            # Try to find the user by Stripe customer ID or subscription ID
                            user = None
                            if subscription_id or customer_id:
                                query_conditions = []
                                if subscription_id:
                                    query_conditions.append({"subscription.stripeSubscriptionId": subscription_id})
                                if customer_id:
                                    query_conditions.append({"subscription.stripeCustomerId": customer_id})
                                    query_conditions.append({"stripeCustomerId": customer_id})
                                
                                if query_conditions:
                                    user = await users_collection.find_one({"$or": query_conditions})
                            
                            # Determine the tier from the subscription or invoice
                            tier = "unknown"
                            
                            # Try to get tier from subscription items
                            if hasattr(subscription, 'items') and subscription.items and hasattr(subscription.items, 'data'):
                                for item in subscription.items.data:
                                    if hasattr(item, 'price') and item.price:
                                        amount = item.price.unit_amount if hasattr(item.price, 'unit_amount') else 0
                                        # Map amount to tier
                                        if amount == 1999:
                                            tier = "starter"
                                        elif amount == 2999:
                                            tier = "professional"
                                        elif amount == 4999:
                                            tier = "business"
                                        
                                        # Also try to match by price ID
                                        if tier == "unknown" and hasattr(item.price, 'id'):
                                            for t, pid in stripe_price_ids.items():
                                                if pid == item.price.id:
                                                    tier = t
                                                    break
                            
                            # If we couldn't determine tier, try from user
                            if tier == "unknown" and user and user.get("subscription", {}).get("tier"):
                                tier = user["subscription"]["tier"]
                            
                            # Create the payment record
                            payment_amount = (invoice.amount_paid or 0) / 100  # Convert from cents
                            
                            # Convert Stripe timestamp to ISO format
                            created_at = datetime.fromtimestamp(invoice.created, tz=timezone.utc).isoformat()
                            
                            # Get customer email safely
                            customer_email = ""
                            if user:
                                customer_email = user.get("email", "")
                            elif hasattr(invoice, 'customer_email') and invoice.customer_email:
                                customer_email = invoice.customer_email
                            
                            subscription_payment = {
                                "id": str(uuid.uuid4()),
                                "userId": user["id"] if user else None,
                                "userEmail": customer_email,
                                "tier": tier,
                                "amount": payment_amount,
                                "stripeInvoiceId": invoice.id,
                                "stripeSubscriptionId": subscription_id,
                                "stripeCustomerId": customer_id,
                                "billingReason": getattr(invoice, 'billing_reason', None) or "unknown",
                                "createdAt": created_at,
                                "importedAt": datetime.now(timezone.utc).isoformat(),
                                "isHistoricalImport": True
                            }
                            
                            await subscription_payments_collection.insert_one(subscription_payment)
                            imported_count += 1
                            logger.info(f"Imported invoice {invoice.id} for subscription {subscription_id} - ${payment_amount}")
                            
                        except Exception as e:
                            logger.error(f"Error processing invoice {invoice.id}: {str(e)}")
                            error_count += 1
                            continue
                
                except Exception as e:
                    logger.error(f"Error fetching invoices for subscription {subscription.id}: {str(e)}")
                    error_count += 1
            
            # Check if there are more subscriptions
            subscriptions_has_more = subscriptions.has_more
            if subscriptions.data:
                sub_starting_after = subscriptions.data[-1].id
        
        # Method 2: Also check for any paid invoices that might have been missed
        # (e.g., invoices with subscription field set but subscription deleted)
        logger.info("Checking for additional paid invoices...")
        inv_has_more = True
        inv_starting_after = None
        
        while inv_has_more and total_processed < limit:
            inv_params = {
                "status": "paid",
                "limit": min(100, limit - total_processed)
            }
            if inv_starting_after:
                inv_params["starting_after"] = inv_starting_after
            
            invoices = stripe.Invoice.list(**inv_params)
            
            for invoice in invoices.data:
                if invoice.id in processed_invoice_ids:
                    continue
                processed_invoice_ids.add(invoice.id)
                total_processed += 1
                
                try:
                    # Get subscription ID - handle both string and None cases
                    subscription_id = None
                    if hasattr(invoice, 'subscription') and invoice.subscription:
                        if isinstance(invoice.subscription, str):
                            subscription_id = invoice.subscription
                        elif hasattr(invoice.subscription, 'id'):
                            subscription_id = invoice.subscription.id
                    
                    # Skip non-subscription invoices
                    if not subscription_id:
                        logger.debug(f"Skipping invoice {invoice.id}: no subscription ID (one-time payment)")
                        skipped_count += 1
                        continue
                    
                    logger.info(f"Found additional subscription invoice: {invoice.id} with subscription {subscription_id}")
                    
                    # Check if this payment already exists
                    existing = await subscription_payments_collection.find_one({
                        "stripeInvoiceId": invoice.id
                    })
                    if existing:
                        logger.info(f"Invoice {invoice.id} already exists in DB")
                        already_exists_count += 1
                        continue
                    
                    # Get customer ID
                    customer_id = invoice.customer if isinstance(invoice.customer, str) else (invoice.customer.id if hasattr(invoice.customer, 'id') else None)
                    
                    # Try to find the user by Stripe customer ID or subscription ID
                    user = None
                    if subscription_id or customer_id:
                        query_conditions = []
                        if subscription_id:
                            query_conditions.append({"subscription.stripeSubscriptionId": subscription_id})
                        if customer_id:
                            query_conditions.append({"subscription.stripeCustomerId": customer_id})
                            query_conditions.append({"stripeCustomerId": customer_id})
                        
                        if query_conditions:
                            user = await users_collection.find_one({"$or": query_conditions})
                    
                    # Determine the tier from the invoice line items
                    tier = "unknown"
                    if hasattr(invoice, 'lines') and invoice.lines and hasattr(invoice.lines, 'data'):
                        for line in invoice.lines.data:
                            if hasattr(line, 'price') and line.price:
                                # Try to get amount to determine tier
                                amount = line.price.unit_amount if hasattr(line.price, 'unit_amount') else 0
                                if amount == 1999:
                                    tier = "starter"
                                elif amount == 2999:
                                    tier = "professional"
                                elif amount == 4999:
                                    tier = "business"
                                
                                # Also try to match by price ID
                                if tier == "unknown" and hasattr(line.price, 'id'):
                                    for t, pid in stripe_price_ids.items():
                                        if pid == line.price.id:
                                            tier = t
                                            break
                    
                    # If we couldn't determine tier from price, try to get from user
                    if tier == "unknown" and user and user.get("subscription", {}).get("tier"):
                        tier = user["subscription"]["tier"]
                    
                    # Create the payment record
                    payment_amount = (invoice.amount_paid or 0) / 100  # Convert from cents
                    
                    # Convert Stripe timestamp to ISO format
                    created_at = datetime.fromtimestamp(invoice.created, tz=timezone.utc).isoformat()
                    
                    # Get customer email safely
                    customer_email = ""
                    if user:
                        customer_email = user.get("email", "")
                    elif hasattr(invoice, 'customer_email') and invoice.customer_email:
                        customer_email = invoice.customer_email
                    
                    subscription_payment = {
                        "id": str(uuid.uuid4()),
                        "userId": user["id"] if user else None,
                        "userEmail": customer_email,
                        "tier": tier,
                        "amount": payment_amount,
                        "stripeInvoiceId": invoice.id,
                        "stripeSubscriptionId": subscription_id,
                        "stripeCustomerId": customer_id,
                        "billingReason": getattr(invoice, 'billing_reason', None) or "unknown",
                        "createdAt": created_at,
                        "importedAt": datetime.now(timezone.utc).isoformat(),
                        "isHistoricalImport": True
                    }
                    
                    await subscription_payments_collection.insert_one(subscription_payment)
                    imported_count += 1
                    
                except Exception as e:
                    logger.error(f"Error processing invoice {invoice.id}: {str(e)}")
                    error_count += 1
                    continue
            
            # Check if there are more invoices
            inv_has_more = invoices.has_more
            if invoices.data:
                inv_starting_after = invoices.data[-1].id
        
        # Calculate total imported revenue
        total_revenue_pipeline = [
            {"$match": {"isHistoricalImport": True}},
            {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
        ]
        revenue_result = await subscription_payments_collection.aggregate(total_revenue_pipeline).to_list(1)
        total_imported_revenue = revenue_result[0]["total"] if revenue_result else 0
        
        return {
            "success": True,
            "message": f"Historical subscription import complete",
            "stats": {
                "totalProcessed": total_processed,
                "imported": imported_count,
                "skipped": skipped_count,
                "alreadyExists": already_exists_count,
                "errors": error_count,
                "totalImportedRevenue": round(total_imported_revenue, 2)
            }
        }
        
    except stripe.error.StripeError as e:
        print(f"Stripe error during import: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Stripe error: {str(e)}")
    except Exception as e:
        print(f"General error during import: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Import error: {str(e)}")

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
    
    # Check if user has active or cancelling subscription (access continues until period ends)
    subscription = user.get("subscription")
    if not subscription or subscription.get("status") not in ["active", "cancelling"]:
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
    
    # Send review request email (download confirmation with PDF is sent from frontend)
    user_email = user.get("email")
    user_name = user.get("name", "")
    if user_email:
        # NOTE: Download confirmation with PDF attachment is now sent from frontend
        asyncio.create_task(send_review_request(user_email, user_name, data.documentType, user["id"]))
    
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
    # Allow both active and cancelling subscriptions (access continues until period ends)
    if subscription.get("status") not in ["active", "cancelling"]:
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
    # Get purchases associated with the user's email or userId
    user = await users_collection.find_one({"id": session["userId"]}, {"_id": 0})
    
    if not user:
        return {"success": True, "downloads": [], "total": 0}
    
    # Query purchases by userId or email (works for both PayPal and Stripe)
    query = {
        "$or": [
            {"userId": user["id"]},
            {"paypalEmail": user["email"]},
            {"email": user["email"]}  # For Stripe purchases
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
        "quantity": data.quantity or 1,
        "ipAddress": data.ipAddress,
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

class UpdateUserDetails(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    ipAddress: Optional[str] = None

@app.put("/api/admin/users/{user_id}")
async def update_user_details(user_id: str, data: UpdateUserDetails, session: dict = Depends(get_current_admin)):
    """Update a user's details (admin only)"""
    user = await users_collection.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    update_data = {}
    
    if data.name is not None:
        update_data["name"] = data.name.strip()
    
    if data.email is not None:
        new_email = data.email.strip().lower()
        # Check if email is already taken by another user
        if new_email != user.get("email", "").lower():
            existing_user = await users_collection.find_one({"email": new_email, "id": {"$ne": user_id}})
            if existing_user:
                raise HTTPException(status_code=400, detail="Email already in use by another user")
        update_data["email"] = new_email
    
    if data.ipAddress is not None:
        update_data["ipAddress"] = data.ipAddress.strip() if data.ipAddress.strip() else None
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    await users_collection.update_one(
        {"id": user_id},
        {"$set": update_data}
    )
    
    return {"success": True, "message": "User updated successfully"}

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


# ========== ADMIN SAVED DOCUMENTS MANAGEMENT ==========

@app.get("/api/admin/saved-documents")
async def get_all_saved_documents(
    skip: int = 0,
    limit: int = 20,
    userId: Optional[str] = None,
    documentType: Optional[str] = None,
    session: dict = Depends(get_current_admin)
):
    """Get all saved documents (admin only)"""
    query = {}
    
    if userId:
        query["userId"] = userId
    if documentType and documentType != "all":
        query["documentType"] = documentType
    
    # Get documents with pagination (exclude fileContent from response for performance)
    documents = await saved_documents_collection.find(query, {"_id": 0, "fileContent": 0}).sort("createdAt", -1).skip(skip).limit(limit).to_list(limit)
    total = await saved_documents_collection.count_documents(query)
    
    # Enrich with user info and file existence check
    enriched_documents = []
    for doc in documents:
        user = await users_collection.find_one({"id": doc.get("userId")}, {"_id": 0, "email": 1, "name": 1})
        
        # Check if file exists on disk
        stored_filename = doc.get("storedFileName", "")
        file_exists = False
        has_content_backup = False
        
        if stored_filename:
            file_path = os.path.join(USER_DOCUMENTS_DIR, stored_filename)
            file_exists = os.path.exists(file_path)
            
            # If file not on disk, check if we have content in MongoDB
            if not file_exists:
                # Check if fileContent exists (just check existence, don't load it)
                doc_with_content = await saved_documents_collection.find_one(
                    {"id": doc.get("id")},
                    {"fileContent": 1}
                )
                has_content_backup = bool(doc_with_content and doc_with_content.get("fileContent"))
                
                # If we have content backup, try to restore the file
                if has_content_backup:
                    try:
                        file_content = base64.b64decode(doc_with_content["fileContent"])
                        with open(file_path, "wb") as f:
                            f.write(file_content)
                        file_exists = True
                        logger.info(f"Auto-restored file from MongoDB: {file_path}")
                    except Exception as e:
                        logger.warning(f"Could not auto-restore file: {e}")
        
        enriched_documents.append({
            **doc,
            "userEmail": user.get("email", "Unknown") if user else "Deleted User",
            "userName": user.get("name", "") if user else "",
            "fileExists": file_exists,
            "hasBackup": has_content_backup if not file_exists else True
        })
    
    return {
        "documents": enriched_documents,
        "total": total,
        "skip": skip,
        "limit": limit
    }


@app.delete("/api/admin/saved-documents/{doc_id}")
async def admin_delete_saved_document(doc_id: str, session: dict = Depends(get_current_admin)):
    """Delete a saved document (admin only)"""
    # Find the document first
    document = await saved_documents_collection.find_one({"id": doc_id})
    
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Delete the actual file if it exists
    stored_filename = document.get("storedFileName")
    if stored_filename:
        file_path = os.path.join(USER_DOCUMENTS_DIR, stored_filename)
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
                logger.info(f"Admin deleted file: {file_path}")
            except Exception as e:
                logger.error(f"Failed to delete file {file_path}: {e}")
    
    # Delete from database
    result = await saved_documents_collection.delete_one({"id": doc_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Document not found")
    
    return {"success": True, "message": "Document deleted successfully"}


@app.get("/api/admin/saved-documents/{doc_id}/download")
async def admin_download_saved_document(doc_id: str, session: dict = Depends(get_current_admin)):
    """Download/view a saved document (admin only)"""
    from fastapi.responses import FileResponse, Response
    
    # Find document
    document = await saved_documents_collection.find_one({"id": doc_id})
    
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Determine media type
    file_ext = os.path.splitext(document["fileName"])[1].lower()
    media_types = {
        ".pdf": "application/pdf",
        ".zip": "application/zip"
    }
    media_type = media_types.get(file_ext, "application/octet-stream")
    
    # Get file path
    file_path = os.path.join(USER_DOCUMENTS_DIR, document["storedFileName"])
    
    if os.path.exists(file_path):
        return FileResponse(
            path=file_path,
            filename=document["fileName"],
            media_type=media_type
        )
    
    # If file not on disk, try to restore from MongoDB content
    if document.get("fileContent"):
        try:
            file_content = base64.b64decode(document["fileContent"])
            # Restore file to disk for future access
            try:
                with open(file_path, "wb") as f:
                    f.write(file_content)
                logger.info(f"Admin restored file from MongoDB: {file_path}")
            except Exception as e:
                logger.warning(f"Could not restore file to disk: {e}")
            
            return Response(
                content=file_content,
                media_type=media_type,
                headers={"Content-Disposition": f'attachment; filename="{document["fileName"]}"'}
            )
        except Exception as e:
            logger.error(f"Failed to decode file content from MongoDB: {e}")
    
    raise HTTPException(status_code=404, detail="Document file not found on server")


@app.delete("/api/admin/users/{user_id}/saved-documents")
async def admin_delete_user_saved_documents(user_id: str, session: dict = Depends(get_current_admin)):
    """Delete all saved documents for a user (admin only)"""
    # Get all documents for this user
    documents = await saved_documents_collection.find({"userId": user_id}).to_list(1000)
    
    deleted_count = 0
    for doc in documents:
        # Delete the actual file if it exists
        stored_filename = doc.get("storedFileName")
        if stored_filename:
            file_path = os.path.join(USER_DOCUMENTS_DIR, stored_filename)
            if os.path.exists(file_path):
                try:
                    os.remove(file_path)
                except Exception as e:
                    logger.error(f"Failed to delete file {file_path}: {e}")
        deleted_count += 1
    
    # Delete all from database
    await saved_documents_collection.delete_many({"userId": user_id})
    
    return {"success": True, "message": f"Deleted {deleted_count} documents for user"}


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


# ========== BANNED IPS ENDPOINTS ==========

class BannedIPCreate(BaseModel):
    ip: str
    reason: Optional[str] = None

@app.get("/api/check-ip-ban")
async def check_ip_ban(request: Request):
    """Check if the current IP is banned - public endpoint"""
    client_ip = get_client_ip(request)
    banned = await banned_ips_collection.find_one({"ip": client_ip, "isActive": True})
    
    if banned:
        return {
            "banned": True,
            "reason": banned.get("reason", "Your access has been restricted."),
            "bannedAt": banned.get("bannedAt")
        }
    
    return {"banned": False}

@app.get("/api/admin/banned-ips")
async def get_banned_ips(session: dict = Depends(get_current_admin)):
    """Get all banned IPs (admin only)"""
    banned_ips = await banned_ips_collection.find({}, {"_id": 0}).sort("bannedAt", -1).to_list(1000)
    return {"success": True, "bannedIps": banned_ips}

@app.post("/api/admin/banned-ips")
async def ban_ip(data: BannedIPCreate, session: dict = Depends(get_current_admin)):
    """Ban an IP address (admin only)"""
    # Check if IP is already banned
    existing = await banned_ips_collection.find_one({"ip": data.ip})
    
    if existing:
        # Reactivate if previously unbanned
        await banned_ips_collection.update_one(
            {"ip": data.ip},
            {
                "$set": {
                    "isActive": True,
                    "reason": data.reason or existing.get("reason"),
                    "bannedAt": datetime.now(timezone.utc).isoformat(),
                    "bannedBy": session.get("adminId")
                }
            }
        )
        return {"success": True, "message": f"IP {data.ip} has been banned"}
    
    banned_ip = {
        "id": str(uuid.uuid4()),
        "ip": data.ip,
        "reason": data.reason,
        "isActive": True,
        "bannedAt": datetime.now(timezone.utc).isoformat(),
        "bannedBy": session.get("adminId")
    }
    
    await banned_ips_collection.insert_one(banned_ip)
    return {"success": True, "message": f"IP {data.ip} has been banned", "bannedIp": {k: v for k, v in banned_ip.items() if k != "_id"}}

@app.delete("/api/admin/banned-ips/{ip}")
async def unban_ip(ip: str, session: dict = Depends(get_current_admin)):
    """Unban an IP address (admin only)"""
    # URL decode the IP (in case it was encoded)
    from urllib.parse import unquote
    decoded_ip = unquote(ip)
    
    result = await banned_ips_collection.update_one(
        {"ip": decoded_ip},
        {
            "$set": {
                "isActive": False,
                "unbannedAt": datetime.now(timezone.utc).isoformat(),
                "unbannedBy": session.get("adminId")
            }
        }
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="IP not found in ban list")
    
    return {"success": True, "message": f"IP {decoded_ip} has been unbanned"}

@app.post("/api/admin/ban-user-ip/{user_id}")
async def ban_user_ip(user_id: str, data: dict, session: dict = Depends(get_current_admin)):
    """Ban a user's IP address (admin only)"""
    user = await users_collection.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    ip = user.get("ipAddress")
    if not ip or ip == "unknown":
        raise HTTPException(status_code=400, detail="User IP address not available")
    
    # Ban the IP
    reason = data.get("reason", f"Banned via user {user.get('email')}")
    
    existing = await banned_ips_collection.find_one({"ip": ip})
    if existing:
        await banned_ips_collection.update_one(
            {"ip": ip},
            {
                "$set": {
                    "isActive": True,
                    "reason": reason,
                    "bannedAt": datetime.now(timezone.utc).isoformat(),
                    "bannedBy": session.get("adminId"),
                    "associatedUserId": user_id
                }
            }
        )
    else:
        banned_ip = {
            "id": str(uuid.uuid4()),
            "ip": ip,
            "reason": reason,
            "isActive": True,
            "bannedAt": datetime.now(timezone.utc).isoformat(),
            "bannedBy": session.get("adminId"),
            "associatedUserId": user_id
        }
        await banned_ips_collection.insert_one(banned_ip)
    
    return {"success": True, "message": f"IP {ip} has been banned", "ip": ip}


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

# Background task for processing scheduled emails
async def email_scheduler_task():
    """Background task that runs every 5 minutes to process scheduled emails"""
    while True:
        try:
            await process_scheduled_emails()
        except Exception as e:
            print(f"Error in email scheduler: {e}")
        await asyncio.sleep(300)  # Run every 5 minutes

@app.on_event("startup")
async def start_email_scheduler():
    """Start the email scheduler background task"""
    asyncio.create_task(email_scheduler_task())
    print("Email scheduler started")

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

class AIImageGenerateRequest(BaseModel):
    title: str
    category: Optional[str] = None
    keywords: Optional[str] = None

@app.post("/api/admin/blog/generate-image")
async def generate_blog_image(data: AIImageGenerateRequest, session: dict = Depends(get_current_admin)):
    """Generate a blog featured image using AI (admin)"""
    import base64
    
    api_key = os.environ.get("EMERGENT_LLM_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="EMERGENT_LLM_KEY not configured")
    
    try:
        # Create a prompt for the blog image
        category_context = f" about {data.category}" if data.category else ""
        keywords_context = f" Keywords: {data.keywords}" if data.keywords else ""
        
        prompt = f"""Create a professional, modern blog featured image for an article titled: "{data.title}"{category_context}.{keywords_context}

The image should be:
- Clean and professional looking
- Suitable for a financial/business blog
- Modern flat design or minimalist style
- No text overlays
- Visually appealing with good color contrast
- 16:9 aspect ratio composition"""

        # Initialize LLM Chat with image generation capabilities
        chat = LlmChat(
            api_key=api_key,
            session_id=str(uuid.uuid4()),
            system_message="You are an expert at generating professional blog featured images."
        ).with_model("gemini", "gemini-2.5-flash-image-preview").with_params(modalities=["image", "text"])
        
        # Generate image
        msg = UserMessage(text=prompt)
        text_response, images = await chat.send_message_multimodal_response(msg)
        
        if not images or len(images) == 0:
            raise HTTPException(status_code=500, detail="Failed to generate image - no image returned")
        
        # Get the first generated image
        img = images[0]
        image_bytes = base64.b64decode(img['data'])
        
        # Save the generated image
        filename = f"ai_{uuid.uuid4()}.png"
        filepath = os.path.join(UPLOAD_DIR, filename)
        
        with open(filepath, "wb") as f:
            f.write(image_bytes)
        
        # Return URL
        image_url = f"/api/uploads/blog/{filename}"
        
        return {
            "success": True, 
            "url": image_url, 
            "filename": filename,
            "message": "Image generated successfully"
        }
        
    except Exception as e:
        print(f"Error generating blog image: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate image: {str(e)}")

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


# ============================================
# PDF METADATA & CONSISTENCY ENGINE
# Business Plan Feature Only
# ============================================

# Max file size for PDF analysis (10MB default)
PDF_ENGINE_MAX_SIZE = int(os.environ.get("PDF_ENGINE_MAX_SIZE", 10 * 1024 * 1024))

async def verify_business_subscription(session: dict) -> dict:
    """Verify user has an active Business subscription"""
    user = await users_collection.find_one({"id": session["userId"]})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    subscription = user.get("subscription") or {}
    if subscription.get("status") != "active" or subscription.get("tier") != "business":
        raise HTTPException(
            status_code=403, 
            detail="This feature requires an active Business subscription"
        )
    
    return user


@app.get("/api/pdf-engine/check-access")
async def check_pdf_engine_access(session: dict = Depends(get_current_user)):
    """Check if user has access to PDF Engine (Business plan only)"""
    user = await users_collection.find_one({"id": session["userId"]})
    if not user:
        return {"hasAccess": False, "reason": "User not found"}
    
    subscription = user.get("subscription") or {}
    status = subscription.get("status")
    tier = subscription.get("tier")
    
    # Allow access for both active and cancelling subscriptions (until period ends)
    has_valid_status = status in ["active", "cancelling"]
    has_access = has_valid_status and tier == "business"
    
    reason = None
    if not has_access:
        if tier != "business":
            reason = "Business subscription required"
        elif status not in ["active", "cancelling"]:
            reason = "Active subscription required"
    
    return {
        "hasAccess": has_access,
        "currentTier": tier or "none",
        "subscriptionStatus": status or "none",
        "reason": reason
    }


class PDFEngineAnalyzeRequest(BaseModel):
    normalize: bool = False  # Whether to also normalize the PDF
    normalizeOptions: Optional[dict] = None


@app.get("/api/pdf-engine/document-types")
async def get_pdf_document_types(session: dict = Depends(get_current_user)):
    """Get available document types for PDF analysis"""
    return {
        "documentTypes": DOCUMENT_TYPES,
        "success": True
    }


@app.get("/api/pdf-engine/producers/{document_type}")
async def get_pdf_producers(document_type: str, session: dict = Depends(get_current_user)):
    """Get legitimate producers for a document type"""
    producers = get_legitimate_producers(document_type)
    return {
        "documentType": document_type,
        "producers": {k: {"name": v["names"][0], "notes": v.get("notes", "")} for k, v in producers.items()},
        "success": True
    }


@app.post("/api/pdf-engine/analyze")
async def analyze_pdf_endpoint(
    file: UploadFile = File(...),
    normalize: bool = False,
    document_type: str = "other",
    enable_ai: bool = True,
    session: dict = Depends(get_current_user)
):
    """
    Analyze PDF metadata and document consistency
    Business Plan feature only
    
    document_type options: paystub, bank_statement, tax_form, other
    enable_ai: Enable AI-powered content analysis (default: True)
    """
    # Verify Business subscription
    user = await verify_business_subscription(session)
    
    # Validate document type
    if document_type not in DOCUMENT_TYPES:
        document_type = "other"
    
    # Validate file type
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(
            status_code=400, 
            detail="Only PDF files are supported. Please upload a .pdf file."
        )
    
    # Validate content type
    if file.content_type and 'pdf' not in file.content_type.lower():
        raise HTTPException(
            status_code=400,
            detail="Invalid file type. Only PDF files are accepted."
        )
    
    # Read file content
    try:
        pdf_bytes = await file.read()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read file: {str(e)}")
    
    # Check file size
    if len(pdf_bytes) > PDF_ENGINE_MAX_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size is {PDF_ENGINE_MAX_SIZE // (1024*1024)}MB"
        )
    
    # Verify it's a valid PDF
    if not pdf_bytes.startswith(b'%PDF'):
        raise HTTPException(
            status_code=400,
            detail="Invalid PDF file. The file does not appear to be a valid PDF."
        )
    
    try:
        # Analyze the PDF with document type
        analysis = analyze_pdf_metadata(pdf_bytes, document_type)
        
        # Run AI analysis if enabled and text content exists
        ai_analysis_result = None
        if enable_ai and analysis.text_content:
            ai_analysis_result = await analyze_document_with_ai(
                analysis.text_content,
                document_type,
                analysis.metadata
            )
            # Apply AI findings to the analysis result
            if ai_analysis_result and ai_analysis_result.get("success"):
                apply_ai_analysis_to_result(analysis, ai_analysis_result)
        
        result = {
            "success": True,
            "filename": file.filename,
            "analysis": analysis.to_dict(),
            "analyzedAt": datetime.now(timezone.utc).isoformat(),
            "aiEnabled": enable_ai,
            "aiAnalysisSuccess": ai_analysis_result.get("success") if ai_analysis_result else False
        }
        
        # If normalize requested, also normalize
        if normalize:
            normalized_bytes, normalize_result = normalize_pdf_metadata(pdf_bytes)
            result["normalization"] = normalize_result
            
            if normalize_result.get("success"):
                # Encode normalized PDF as base64 for download
                result["normalizedPdfBase64"] = base64.b64encode(normalized_bytes).decode('utf-8')
        
        return result
        
    except Exception as e:
        logger.error(f"PDF analysis error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Analysis failed: {str(e)}"
        )


@app.post("/api/pdf-engine/normalize")
async def normalize_pdf_endpoint(
    file: UploadFile = File(...),
    standardize_producer: bool = True,
    fix_dates: bool = True,
    flatten_document: bool = True,
    session: dict = Depends(get_current_user)
):
    """
    Normalize PDF metadata to reduce verification red flags
    Business Plan feature only
    """
    # Verify Business subscription
    user = await verify_business_subscription(session)
    
    # Validate file type
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
    
    # Read file
    pdf_bytes = await file.read()
    
    # Check file size
    if len(pdf_bytes) > PDF_ENGINE_MAX_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size is {PDF_ENGINE_MAX_SIZE // (1024*1024)}MB"
        )
    
    # Verify PDF
    if not pdf_bytes.startswith(b'%PDF'):
        raise HTTPException(status_code=400, detail="Invalid PDF file")
    
    try:
        # Normalize options
        options = {
            "standardize_producer": standardize_producer,
            "fix_dates": fix_dates,
            "flatten_document": flatten_document
        }
        
        # Perform normalization
        normalized_bytes, result = normalize_pdf_metadata(pdf_bytes, options)
        
        if not result.get("success"):
            raise HTTPException(
                status_code=500,
                detail=f"Normalization failed: {result.get('error', 'Unknown error')}"
            )
        
        return {
            "success": True,
            "filename": file.filename,
            "changes": result.get("changes", []),
            "normalizedPdfBase64": base64.b64encode(normalized_bytes).decode('utf-8'),
            "normalizedAt": datetime.now(timezone.utc).isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"PDF normalization error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Normalization failed: {str(e)}")


@app.post("/api/pdf-engine/generate-report")
async def generate_analysis_report(
    file: UploadFile = File(...),
    format: str = "pdf",  # "pdf" or "json"
    session: dict = Depends(get_current_user)
):
    """
    Generate a detailed analysis report
    Business Plan feature only
    """
    from fastapi.responses import Response
    
    # Verify Business subscription
    user = await verify_business_subscription(session)
    
    # Validate file type
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
    
    # Read file
    pdf_bytes = await file.read()
    
    # Check file size
    if len(pdf_bytes) > PDF_ENGINE_MAX_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size is {PDF_ENGINE_MAX_SIZE // (1024*1024)}MB"
        )
    
    # Verify PDF
    if not pdf_bytes.startswith(b'%PDF'):
        raise HTTPException(status_code=400, detail="Invalid PDF file")
    
    try:
        # Analyze
        analysis = analyze_pdf_metadata(pdf_bytes)
        
        if format == "json":
            return {
                "success": True,
                "filename": file.filename,
                "report": analysis.to_dict(),
                "generatedAt": datetime.now(timezone.utc).isoformat()
            }
        else:
            # Generate PDF report
            report_pdf = generate_analysis_report_pdf(analysis, file.filename)
            
            return Response(
                content=report_pdf,
                media_type="application/pdf",
                headers={
                    "Content-Disposition": f'attachment; filename="analysis_report_{file.filename}"'
                }
            )
            
    except Exception as e:
        logger.error(f"Report generation error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Report generation failed: {str(e)}")


@app.get("/api/pdf-engine/metadata-presets")
async def get_metadata_presets_endpoint(session: dict = Depends(get_current_user)):
    """Get available metadata presets for common legitimate sources"""
    # Verify Business subscription
    await verify_business_subscription(session)
    
    return {
        "success": True,
        "presets": METADATA_PRESETS
    }


class MetadataEditRequest(BaseModel):
    producer: Optional[str] = None
    creator: Optional[str] = None
    author: Optional[str] = None
    title: Optional[str] = None
    subject: Optional[str] = None
    creationDate: Optional[str] = None  # ISO format or 'now'
    modificationDate: Optional[str] = None  # ISO format or 'now'


@app.post("/api/pdf-engine/edit-metadata")
async def edit_pdf_metadata_endpoint(
    file: UploadFile = File(...),
    producer: Optional[str] = None,
    creator: Optional[str] = None,
    author: Optional[str] = None,
    title: Optional[str] = None,
    subject: Optional[str] = None,
    creation_date: Optional[str] = None,
    modification_date: Optional[str] = None,
    preset: Optional[str] = None,
    session: dict = Depends(get_current_user)
):
    """
    Edit PDF metadata and regenerate as a clean PDF without edit traces.
    Business Plan feature only.
    
    You can either:
    1. Use a preset (e.g., 'adp', 'paychex', 'chase') which sets producer/creator automatically
    2. Provide custom values for each field
    
    Dates can be:
    - ISO format string (e.g., '2024-01-15T10:30:00')
    - Date only (e.g., '2024-01-15')
    - 'now' for current timestamp
    """
    # Verify Business subscription
    await verify_business_subscription(session)
    
    # Validate file type
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
    
    # Read file
    pdf_bytes = await file.read()
    
    # Check file size
    if len(pdf_bytes) > PDF_ENGINE_MAX_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size is {PDF_ENGINE_MAX_SIZE // (1024*1024)}MB"
        )
    
    # Verify PDF
    if not pdf_bytes.startswith(b'%PDF'):
        raise HTTPException(status_code=400, detail="Invalid PDF file")
    
    try:
        # Build metadata dict
        new_metadata = {}
        
        # Apply preset if specified
        if preset and preset in METADATA_PRESETS:
            preset_data = METADATA_PRESETS[preset]
            new_metadata.update(preset_data)
        
        # Override with custom values if provided
        if producer:
            new_metadata['producer'] = producer
        if creator:
            new_metadata['creator'] = creator
        if author:
            new_metadata['author'] = author
        if title:
            new_metadata['title'] = title
        if subject:
            new_metadata['subject'] = subject
        if creation_date:
            new_metadata['creationDate'] = creation_date
        if modification_date:
            new_metadata['modificationDate'] = modification_date
        
        if not new_metadata:
            raise HTTPException(
                status_code=400, 
                detail="No metadata changes specified. Provide at least one field or use a preset."
            )
        
        # Edit and regenerate PDF
        regenerated_pdf, result = edit_and_regenerate_pdf(pdf_bytes, new_metadata)
        
        if not result.get("success"):
            raise HTTPException(
                status_code=500,
                detail=f"Failed to regenerate PDF: {result.get('error', 'Unknown error')}"
            )
        
        return {
            "success": True,
            "filename": file.filename,
            "changes": result.get("changes", []),
            "message": result.get("message", "PDF regenerated successfully"),
            "regeneratedPdfBase64": base64.b64encode(regenerated_pdf).decode('utf-8'),
            "regeneratedAt": datetime.now(timezone.utc).isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Metadata edit error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to edit metadata: {str(e)}")


@app.post("/api/clean-paystub-pdf")
async def clean_paystub_pdf_endpoint(
    file: UploadFile = File(...),
    template: str = Form("template-a"),
    pay_date: Optional[str] = Form(None)
):
    """
    Clean a paystub PDF to remove all traces of editing and apply proper metadata.
    Makes the PDF appear as a fresh document generated by the appropriate payroll system.
    
    This is a public endpoint used by the paystub generator.
    
    Args:
        file: The PDF file to clean
        template: The template type ('template-a', 'template-b', 'template-c', 'template-h')
        pay_date: The pay date (ISO format) - creation date will be set to 2 days before this
    """
    # Validate file type
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
    
    # Read file
    pdf_bytes = await file.read()
    
    # Check file size (max 10MB for paystubs)
    max_size = 10 * 1024 * 1024
    if len(pdf_bytes) > max_size:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size is {max_size // (1024*1024)}MB"
        )
    
    # Verify PDF
    if not pdf_bytes.startswith(b'%PDF'):
        raise HTTPException(status_code=400, detail="Invalid PDF file")
    
    try:
        # Clean the PDF with pay_date for creation date calculation
        cleaned_pdf, result = clean_paystub_pdf(pdf_bytes, template, pay_date)
        
        if not result.get("success"):
            raise HTTPException(
                status_code=500,
                detail=f"Failed to clean PDF: {result.get('error', 'Unknown error')}"
            )
        
        return {
            "success": True,
            "cleanedPdfBase64": base64.b64encode(cleaned_pdf).decode('utf-8'),
            "metadata": result.get("metadata_applied", {})
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"PDF cleaning error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to clean PDF: {str(e)}")


@app.post("/api/clean-bank-statement-pdf")
async def clean_bank_statement_pdf_endpoint(
    file: UploadFile = File(...),
    template: str = Form("chime"),
    statement_month: Optional[str] = Form(None),
    account_name: Optional[str] = Form(None)
):
    """
    Clean a bank statement PDF to remove all traces of editing and apply proper metadata.
    
    Args:
        file: The PDF file to clean
        template: The template type ('chime', 'bank-of-america', 'chase')
        statement_month: The statement month (YYYY-MM) - creation date will be last day of month
        account_name: Account holder's name for title generation
    """
    # Validate file type
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
    
    # Read file
    pdf_bytes = await file.read()
    
    # Check file size (max 10MB)
    max_size = 10 * 1024 * 1024
    if len(pdf_bytes) > max_size:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size is {max_size // (1024*1024)}MB"
        )
    
    # Verify PDF
    if not pdf_bytes.startswith(b'%PDF'):
        raise HTTPException(status_code=400, detail="Invalid PDF file")
    
    try:
        # Clean the PDF
        cleaned_pdf, result = clean_bank_statement_pdf(pdf_bytes, template, statement_month, account_name)
        
        if not result.get("success"):
            raise HTTPException(
                status_code=500,
                detail=f"Failed to clean PDF: {result.get('error', 'Unknown error')}"
            )
        
        return {
            "success": True,
            "cleanedPdfBase64": base64.b64encode(cleaned_pdf).decode('utf-8'),
            "metadata": result.get("metadata_applied", {})
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Bank statement PDF cleaning error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to clean PDF: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)

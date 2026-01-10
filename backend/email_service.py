"""
Email Service for MintSlip using Resend
Handles all transactional emails including scheduled/delayed emails
"""

import os
import asyncio
import logging
import resend
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any
from motor.motor_asyncio import AsyncIOMotorClient

# Configure logging
logger = logging.getLogger(__name__)

# Initialize Resend
resend.api_key = os.environ.get("RESEND_API_KEY")
SENDER_EMAIL = os.environ.get("SENDER_EMAIL", "onboarding@resend.dev")
TRUSTPILOT_URL = os.environ.get("TRUSTPILOT_URL", "https://www.trustpilot.com/review/mintslip.com")
SITE_URL = os.environ.get("SITE_URL", "https://mintslip.com")

# MongoDB connection for scheduled emails
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "mintslip_db")

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]
scheduled_emails_collection = db["scheduled_emails"]
email_logs_collection = db["email_logs"]


# ============================================================
# EMAIL TEMPLATES
# ============================================================

def get_base_template(content: str, preview_text: str = "") -> str:
    """Wrap email content in a base HTML template"""
    return f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MintSlip</title>
    <!--[if !mso]><!-->
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <!--<![endif]-->
    <style>
        body {{ margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ text-align: center; padding: 20px 0; border-bottom: 1px solid #e5e7eb; }}
        .logo {{ font-size: 24px; font-weight: bold; color: #10b981; }}
        .content {{ padding: 30px 20px; }}
        .button {{ display: inline-block; padding: 12px 24px; background-color: #10b981; color: white; text-decoration: none; border-radius: 6px; font-weight: 500; }}
        .button:hover {{ background-color: #059669; }}
        .footer {{ padding: 20px; text-align: center; color: #6b7280; font-size: 12px; border-top: 1px solid #e5e7eb; }}
        .highlight {{ background-color: #f0fdf4; padding: 15px; border-radius: 8px; border-left: 4px solid #10b981; }}
        h1 {{ color: #111827; margin-bottom: 10px; }}
        p {{ color: #374151; line-height: 1.6; }}
        .text-muted {{ color: #6b7280; }}
    </style>
</head>
<body style="background-color: #f9fafb;">
    <span style="display: none; max-height: 0; overflow: hidden;">{preview_text}</span>
    <div class="container">
        <div class="header">
            <div class="logo">💼 MintSlip</div>
        </div>
        <div class="content">
            {content}
        </div>
        <div class="footer">
            <p>© {datetime.now().year} MintSlip. All rights reserved.</p>
            <p>
                <a href="{SITE_URL}" style="color: #10b981;">Visit our website</a>
            </p>
        </div>
    </div>
</body>
</html>
"""


def template_welcome(user_name: str, user_email: str) -> Dict[str, str]:
    """Welcome / Account Created email"""
    content = f"""
        <h1>Welcome to MintSlip! 🎉</h1>
        <p>Hi {user_name or 'there'},</p>
        <p>Thank you for creating an account with MintSlip. We're excited to have you on board!</p>
        <p>With MintSlip, you can generate professional documents in seconds:</p>
        <ul style="color: #374151; line-height: 2;">
            <li>✅ Pay Stubs & Canadian Pay Stubs</li>
            <li>✅ W-2 Forms & 1099 Forms</li>
            <li>✅ Bank Statements</li>
            <li>✅ AI-Powered Resumes</li>
            <li>✅ And much more!</li>
        </ul>
        <p style="text-align: center; margin: 30px 0;">
            <a href="{SITE_URL}/dashboard" class="button">Go to Dashboard</a>
        </p>
        <p class="text-muted">If you have any questions, just reply to this email. We're here to help!</p>
    """
    return {
        "subject": "Welcome to MintSlip! 🎉",
        "html": get_base_template(content, "Welcome to MintSlip - Your account has been created")
    }


def template_email_verification(user_name: str, verification_code: str, verification_link: str) -> Dict[str, str]:
    """Email verification"""
    content = f"""
        <h1>Verify Your Email Address</h1>
        <p>Hi {user_name or 'there'},</p>
        <p>Please verify your email address to complete your registration and unlock all features.</p>
        <div class="highlight" style="text-align: center;">
            <p style="margin: 0; font-size: 14px; color: #6b7280;">Your verification code:</p>
            <p style="font-size: 32px; font-weight: bold; color: #10b981; letter-spacing: 4px; margin: 10px 0;">{verification_code}</p>
        </div>
        <p style="text-align: center; margin: 20px 0;">Or click the button below:</p>
        <p style="text-align: center;">
            <a href="{verification_link}" class="button">Verify Email</a>
        </p>
        <p class="text-muted" style="font-size: 12px;">This code expires in 24 hours. If you didn't create an account, please ignore this email.</p>
    """
    return {
        "subject": "Verify your email address - MintSlip",
        "html": get_base_template(content, f"Your verification code is {verification_code}")
    }


def template_getting_started(user_name: str) -> Dict[str, str]:
    """Getting started guide - sent 10-30 min after signup"""
    content = f"""
        <h1>Getting Started with MintSlip 🚀</h1>
        <p>Hi {user_name or 'there'},</p>
        <p>Now that you've created your account, here's how to make the most of MintSlip:</p>
        
        <div class="highlight" style="margin: 20px 0;">
            <h3 style="margin-top: 0; color: #059669;">Step 1: Choose Your Document</h3>
            <p style="margin-bottom: 0;">Browse our collection of professional document generators - from pay stubs to tax forms.</p>
        </div>
        
        <div class="highlight" style="margin: 20px 0;">
            <h3 style="margin-top: 0; color: #059669;">Step 2: Fill in the Details</h3>
            <p style="margin-bottom: 0;">Enter your information using our easy-to-use forms. Preview before you download!</p>
        </div>
        
        <div class="highlight" style="margin: 20px 0;">
            <h3 style="margin-top: 0; color: #059669;">Step 3: Download Instantly</h3>
            <p style="margin-bottom: 0;">Get your professional PDF document immediately. It's that simple!</p>
        </div>
        
        <h3>💡 Pro Tips:</h3>
        <ul style="color: #374151; line-height: 2;">
            <li><strong>Subscribe & Save:</strong> Get unlimited downloads with our subscription plans</li>
            <li><strong>Save Your Documents:</strong> Registered users can save documents for 30 days</li>
            <li><strong>Use Templates:</strong> Save time by reusing your information</li>
        </ul>
        
        <p style="text-align: center; margin: 30px 0;">
            <a href="{SITE_URL}/generators" class="button">Start Creating Documents</a>
        </p>
    """
    return {
        "subject": "Getting Started with MintSlip - Quick Guide",
        "html": get_base_template(content, "Here's how to make the most of MintSlip")
    }


def template_subscription_thank_you(user_name: str, plan_name: str, plan_price: str, downloads_per_month: int) -> Dict[str, str]:
    """Thank you for subscribing"""
    content = f"""
        <h1>Thank You for Subscribing! 🎉</h1>
        <p>Hi {user_name or 'there'},</p>
        <p>Welcome to the <strong>{plan_name}</strong> plan! Your subscription is now active.</p>
        
        <div class="highlight">
            <h3 style="margin-top: 0;">Your Plan Details:</h3>
            <table style="width: 100%; color: #374151;">
                <tr>
                    <td style="padding: 8px 0;"><strong>Plan:</strong></td>
                    <td style="padding: 8px 0;">{plan_name}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0;"><strong>Price:</strong></td>
                    <td style="padding: 8px 0;">${plan_price}/month</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0;"><strong>Downloads:</strong></td>
                    <td style="padding: 8px 0;">{downloads_per_month} per month</td>
                </tr>
            </table>
        </div>
        
        <h3>What's Included:</h3>
        <ul style="color: #374151; line-height: 2;">
            <li>✅ {downloads_per_month} document downloads per month</li>
            <li>✅ All document types included</li>
            <li>✅ Priority support</li>
            <li>✅ Save documents for 30 days</li>
        </ul>
        
        <p style="text-align: center; margin: 30px 0;">
            <a href="{SITE_URL}/user/dashboard" class="button">Go to Dashboard</a>
        </p>
        
        <p class="text-muted">Need help? Reply to this email and we'll get back to you within 24 hours.</p>
    """
    return {
        "subject": f"Welcome to {plan_name}! Your MintSlip subscription is active",
        "html": get_base_template(content, f"Your {plan_name} subscription is now active")
    }


def template_download_confirmation(user_name: str, document_type: str, download_link: Optional[str] = None, is_guest: bool = False) -> Dict[str, str]:
    """Download confirmation after purchase"""
    document_names = {
        "paystub": "Pay Stub",
        "canadian-paystub": "Canadian Pay Stub",
        "w2": "W-2 Form",
        "w9": "W-9 Form",
        "1099-nec": "1099-NEC Form",
        "1099-misc": "1099-MISC Form",
        "bank-statement": "Bank Statement",
        "ai-resume": "AI Resume",
        "offer-letter": "Offer Letter",
        "schedule-c": "Schedule C",
        "utility-bill": "Utility Bill",
        "vehicle-bill-of-sale": "Vehicle Bill of Sale"
    }
    doc_name = document_names.get(document_type, document_type.replace("-", " ").title())
    
    download_section = ""
    if download_link:
        download_section = f"""
        <p style="text-align: center; margin: 30px 0;">
            <a href="{download_link}" class="button">Download Document</a>
        </p>
        <p class="text-muted" style="text-align: center; font-size: 12px;">This link expires in 24 hours</p>
        """
    
    # Different message for guests vs registered users
    if is_guest:
        access_message = """
        <p>Your document should have downloaded automatically. If you missed it, don't worry - you can generate a new one anytime.</p>
        
        <div class="highlight" style="margin-top: 20px;">
            <h3 style="margin-top: 0; color: #059669;">💡 Create a Free Account</h3>
            <p style="margin-bottom: 0;">Sign up to save your documents for 30 days, access them from any device, and get exclusive discounts on future purchases!</p>
        </div>
        
        <p style="text-align: center; margin: 20px 0;">
            <a href="{SITE_URL}/signup" class="button" style="background-color: #6366f1;">Create Free Account</a>
        </p>
        """
    else:
        access_message = f"""
        <p>Your document should have downloaded automatically. If not, you can access it from your <a href="{SITE_URL}/user/downloads" style="color: #10b981;">Downloads page</a>.</p>
        
        <p class="text-muted">Need to make changes? You can generate a new document anytime from your dashboard.</p>
        """
    
    content = f"""
        <h1>Your Document is Ready! 📄</h1>
        <p>Hi {user_name or 'there'},</p>
        <p>Great news! Your <strong>{doc_name}</strong> has been successfully generated and is ready for download.</p>
        
        <div class="highlight">
            <table style="width: 100%; color: #374151;">
                <tr>
                    <td style="padding: 8px 0;"><strong>Document:</strong></td>
                    <td style="padding: 8px 0;">{doc_name}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0;"><strong>Date:</strong></td>
                    <td style="padding: 8px 0;">{datetime.now().strftime('%B %d, %Y')}</td>
                </tr>
            </table>
        </div>
        
        {download_section}
        
        {access_message}
    """
    return {
        "subject": f"Your {doc_name} is Ready - MintSlip",
        "html": get_base_template(content, f"Your {doc_name} has been generated and is ready for download")
    }


def template_signup_no_purchase(user_name: str) -> Dict[str, str]:
    """Reminder for users who signed up but didn't purchase - sent 24h after signup"""
    content = f"""
        <h1>Still Thinking It Over? 🤔</h1>
        <p>Hi {user_name or 'there'},</p>
        <p>We noticed you created a MintSlip account but haven't generated any documents yet.</p>
        <p>Need professional documents? We've got you covered:</p>
        
        <div class="highlight">
            <h3 style="margin-top: 0;">Why Choose MintSlip?</h3>
            <ul style="margin-bottom: 0; color: #374151; line-height: 2;">
                <li>⚡ Generate documents in under 60 seconds</li>
                <li>📄 Professional, print-ready PDFs</li>
                <li>🔒 Secure and confidential</li>
                <li>💰 Affordable pricing starting at $9.99</li>
            </ul>
        </div>
        
        <h3>Popular Documents:</h3>
        <ul style="color: #374151; line-height: 2;">
            <li>💼 Pay Stubs - Perfect for proof of income</li>
            <li>📋 W-2 & 1099 Forms - Tax season essentials</li>
            <li>🏦 Bank Statements - Financial verification</li>
            <li>📝 AI Resumes - Stand out from the crowd</li>
        </ul>
        
        <p style="text-align: center; margin: 30px 0;">
            <a href="{SITE_URL}/generators" class="button">Browse Documents</a>
        </p>
        
        <p class="text-muted">Have questions? Just reply to this email - we're happy to help!</p>
    """
    return {
        "subject": "Your MintSlip documents are waiting for you",
        "html": get_base_template(content, "Create your first professional document today")
    }


def template_abandoned_checkout(user_name: str, document_type: str) -> Dict[str, str]:
    """Abandoned checkout reminder - sent 1-3h after checkout started"""
    document_names = {
        "paystub": "Pay Stub",
        "canadian-paystub": "Canadian Pay Stub",
        "w2": "W-2 Form",
        "w9": "W-9 Form",
        "1099-nec": "1099-NEC Form",
        "1099-misc": "1099-MISC Form",
        "bank-statement": "Bank Statement",
        "ai-resume": "AI Resume",
        "offer-letter": "Offer Letter",
        "schedule-c": "Schedule C",
        "utility-bill": "Utility Bill",
        "vehicle-bill-of-sale": "Vehicle Bill of Sale"
    }
    doc_name = document_names.get(document_type, document_type.replace("-", " ").title())
    
    content = f"""
        <h1>Did Something Go Wrong? 🛒</h1>
        <p>Hi {user_name or 'there'},</p>
        <p>We noticed you started creating a <strong>{doc_name}</strong> but didn't complete your purchase.</p>
        <p>No worries - your progress might still be saved! You can pick up right where you left off.</p>
        
        <div class="highlight">
            <p style="margin: 0;"><strong>Your document:</strong> {doc_name}</p>
        </div>
        
        <p style="text-align: center; margin: 30px 0;">
            <a href="{SITE_URL}/{document_type.replace('_', '-')}-generator" class="button">Complete Your Purchase</a>
        </p>
        
        <h3>Need Help?</h3>
        <p>If you encountered any issues during checkout, please let us know. Common solutions:</p>
        <ul style="color: #374151; line-height: 2;">
            <li>Try a different payment method</li>
            <li>Clear your browser cache and try again</li>
            <li>Contact us for assistance</li>
        </ul>
        
        <p class="text-muted">Just reply to this email if you need any help!</p>
    """
    return {
        "subject": f"Complete your {doc_name} purchase - MintSlip",
        "html": get_base_template(content, f"Your {doc_name} is waiting for you")
    }


def template_review_request(user_name: str, document_type: str) -> Dict[str, str]:
    """Review request for Trustpilot - sent after purchase"""
    document_names = {
        "paystub": "Pay Stub",
        "canadian-paystub": "Canadian Pay Stub",
        "w2": "W-2 Form",
        "w9": "W-9 Form",
        "1099-nec": "1099-NEC Form",
        "1099-misc": "1099-MISC Form",
        "bank-statement": "Bank Statement",
        "ai-resume": "AI Resume",
        "offer-letter": "Offer Letter",
        "schedule-c": "Schedule C",
        "utility-bill": "Utility Bill",
        "vehicle-bill-of-sale": "Vehicle Bill of Sale"
    }
    doc_name = document_names.get(document_type, document_type.replace("-", " ").title())
    
    content = f"""
        <h1>How Did We Do? ⭐</h1>
        <p>Hi {user_name or 'there'},</p>
        <p>Thank you for using MintSlip to create your <strong>{doc_name}</strong>!</p>
        <p>We'd love to hear about your experience. Your feedback helps us improve and helps others discover MintSlip.</p>
        
        <div class="highlight" style="text-align: center;">
            <p style="margin: 0 0 15px 0;">Would you take 30 seconds to leave us a review?</p>
            <a href="{TRUSTPILOT_URL}" class="button" style="background-color: #00b67a;">Leave a Review on Trustpilot ⭐</a>
        </div>
        
        <p style="margin-top: 30px;">Your review makes a real difference:</p>
        <ul style="color: #374151; line-height: 2;">
            <li>⭐ Helps other customers find us</li>
            <li>💡 Gives us feedback to improve</li>
            <li>🙏 Shows your support for small businesses</li>
        </ul>
        
        <p class="text-muted">Thank you for being a valued customer!</p>
    """
    return {
        "subject": "How was your MintSlip experience? ⭐",
        "html": get_base_template(content, "We'd love your feedback on Trustpilot")
    }


def template_password_changed(user_name: str) -> Dict[str, str]:
    """Password changed notification"""
    content = f"""
        <h1>Password Changed Successfully 🔐</h1>
        <p>Hi {user_name or 'there'},</p>
        <p>Your MintSlip password has been successfully changed.</p>
        
        <div class="highlight">
            <table style="width: 100%; color: #374151;">
                <tr>
                    <td style="padding: 8px 0;"><strong>Date:</strong></td>
                    <td style="padding: 8px 0;">{datetime.now().strftime('%B %d, %Y at %I:%M %p')}</td>
                </tr>
            </table>
        </div>
        
        <p><strong>Didn't make this change?</strong></p>
        <p>If you didn't change your password, please take these steps immediately:</p>
        <ol style="color: #374151; line-height: 2;">
            <li>Reset your password using the "Forgot Password" link</li>
            <li>Contact us at support@mintslip.com</li>
        </ol>
        
        <p style="text-align: center; margin: 30px 0;">
            <a href="{SITE_URL}/login" class="button">Go to Login</a>
        </p>
        
        <p class="text-muted">This is an automated security notification.</p>
    """
    return {
        "subject": "Your password has been changed - MintSlip",
        "html": get_base_template(content, "Your MintSlip password has been updated")
    }


# ============================================================
# EMAIL SENDING FUNCTIONS
# ============================================================

async def send_email(to_email: str, subject: str, html_content: str, email_type: str = "general") -> Dict[str, Any]:
    """Send an email immediately using Resend"""
    if not resend.api_key:
        logger.error("Resend API key not configured")
        return {"success": False, "error": "Email service not configured"}
    
    params = {
        "from": SENDER_EMAIL,
        "to": [to_email],
        "subject": subject,
        "html": html_content
    }
    
    try:
        # Run sync SDK in thread to keep FastAPI non-blocking
        result = await asyncio.to_thread(resend.Emails.send, params)
        
        # Log the email
        await email_logs_collection.insert_one({
            "to": to_email,
            "subject": subject,
            "email_type": email_type,
            "status": "sent",
            "resend_id": result.get("id"),
            "sent_at": datetime.now(timezone.utc).isoformat()
        })
        
        logger.info(f"Email sent successfully to {to_email}: {subject}")
        return {"success": True, "email_id": result.get("id")}
        
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {str(e)}")
        
        # Log the failure
        await email_logs_collection.insert_one({
            "to": to_email,
            "subject": subject,
            "email_type": email_type,
            "status": "failed",
            "error": str(e),
            "attempted_at": datetime.now(timezone.utc).isoformat()
        })
        
        return {"success": False, "error": str(e)}


async def schedule_email(
    to_email: str,
    email_type: str,
    send_at: datetime,
    template_data: Dict[str, Any],
    user_id: Optional[str] = None
) -> Dict[str, Any]:
    """Schedule an email for later delivery"""
    scheduled_email = {
        "id": str(datetime.now().timestamp()),
        "to_email": to_email,
        "email_type": email_type,
        "template_data": template_data,
        "send_at": send_at.isoformat(),
        "user_id": user_id,
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await scheduled_emails_collection.insert_one(scheduled_email)
    logger.info(f"Scheduled {email_type} email to {to_email} for {send_at}")
    
    return {"success": True, "scheduled_for": send_at.isoformat()}


async def process_scheduled_emails():
    """Process and send scheduled emails that are due"""
    now = datetime.now(timezone.utc)
    
    # Find emails that are due
    due_emails = await scheduled_emails_collection.find({
        "status": "pending",
        "send_at": {"$lte": now.isoformat()}
    }).to_list(100)
    
    for email in due_emails:
        try:
            # Generate the email content based on type
            email_type = email["email_type"]
            template_data = email["template_data"]
            to_email = email["to_email"]
            
            template = None
            if email_type == "getting_started":
                template = template_getting_started(template_data.get("user_name", ""))
            elif email_type == "subscription_thank_you":
                template = template_subscription_thank_you(
                    template_data.get("user_name", ""),
                    template_data.get("plan_name", ""),
                    template_data.get("plan_price", ""),
                    template_data.get("downloads_per_month", 0)
                )
            elif email_type == "signup_no_purchase":
                template = template_signup_no_purchase(template_data.get("user_name", ""))
            elif email_type == "abandoned_checkout":
                template = template_abandoned_checkout(
                    template_data.get("user_name", ""),
                    template_data.get("document_type", "")
                )
            
            if template:
                result = await send_email(to_email, template["subject"], template["html"], email_type)
                
                if result["success"]:
                    await scheduled_emails_collection.update_one(
                        {"_id": email["_id"]},
                        {"$set": {"status": "sent", "sent_at": now.isoformat()}}
                    )
                else:
                    await scheduled_emails_collection.update_one(
                        {"_id": email["_id"]},
                        {"$set": {"status": "failed", "error": result.get("error")}}
                    )
            else:
                logger.warning(f"Unknown email type: {email_type}")
                await scheduled_emails_collection.update_one(
                    {"_id": email["_id"]},
                    {"$set": {"status": "failed", "error": "Unknown email type"}}
                )
                
        except Exception as e:
            logger.error(f"Error processing scheduled email: {str(e)}")
            await scheduled_emails_collection.update_one(
                {"_id": email["_id"]},
                {"$set": {"status": "failed", "error": str(e)}}
            )


async def cancel_scheduled_email(user_id: str, email_type: str) -> bool:
    """Cancel a pending scheduled email"""
    result = await scheduled_emails_collection.update_many(
        {"user_id": user_id, "email_type": email_type, "status": "pending"},
        {"$set": {"status": "cancelled"}}
    )
    return result.modified_count > 0


# ============================================================
# HIGH-LEVEL EMAIL FUNCTIONS (Call these from server.py)
# ============================================================

async def send_welcome_email(user_email: str, user_name: str):
    """Send welcome email immediately after signup"""
    template = template_welcome(user_name, user_email)
    return await send_email(user_email, template["subject"], template["html"], "welcome")


async def send_verification_email(user_email: str, user_name: str, verification_code: str, verification_link: str):
    """Send email verification immediately after signup"""
    template = template_email_verification(user_name, verification_code, verification_link)
    return await send_email(user_email, template["subject"], template["html"], "verification")


async def schedule_getting_started_email(user_email: str, user_name: str, user_id: str):
    """Schedule getting started guide for 15 minutes after signup"""
    send_at = datetime.now(timezone.utc) + timedelta(minutes=15)
    return await schedule_email(
        user_email,
        "getting_started",
        send_at,
        {"user_name": user_name},
        user_id
    )


async def schedule_subscription_thank_you(user_email: str, user_name: str, user_id: str, plan_name: str, plan_price: str, downloads_per_month: int):
    """Schedule subscription thank you for 15 minutes after purchase"""
    send_at = datetime.now(timezone.utc) + timedelta(minutes=15)
    return await schedule_email(
        user_email,
        "subscription_thank_you",
        send_at,
        {
            "user_name": user_name,
            "plan_name": plan_name,
            "plan_price": plan_price,
            "downloads_per_month": downloads_per_month
        },
        user_id
    )


async def send_download_confirmation(user_email: str, user_name: str, document_type: str, download_link: Optional[str] = None):
    """Send download confirmation immediately after purchase"""
    template = template_download_confirmation(user_name, document_type, download_link)
    return await send_email(user_email, template["subject"], template["html"], "download_confirmation")


async def schedule_signup_no_purchase_reminder(user_email: str, user_name: str, user_id: str):
    """Schedule reminder for 24 hours after signup if no purchase made"""
    send_at = datetime.now(timezone.utc) + timedelta(hours=24)
    return await schedule_email(
        user_email,
        "signup_no_purchase",
        send_at,
        {"user_name": user_name},
        user_id
    )


async def track_checkout_started(user_email: str, user_name: str, user_id: Optional[str], document_type: str):
    """Track when checkout is started for abandoned checkout emails"""
    # Schedule abandoned checkout email for 2 hours later
    send_at = datetime.now(timezone.utc) + timedelta(hours=2)
    await schedule_email(
        user_email,
        "abandoned_checkout",
        send_at,
        {"user_name": user_name, "document_type": document_type},
        user_id
    )


async def cancel_abandoned_checkout_email(user_email: str):
    """Cancel abandoned checkout email when purchase is completed"""
    result = await scheduled_emails_collection.update_many(
        {"to_email": user_email, "email_type": "abandoned_checkout", "status": "pending"},
        {"$set": {"status": "cancelled"}}
    )
    return result.modified_count > 0


async def send_review_request(user_email: str, user_name: str, document_type: str, user_id: Optional[str] = None):
    """Send review request - only once for registered users, every time for guests"""
    if user_id:
        # Check if we've already sent a review request to this user
        existing = await email_logs_collection.find_one({
            "to": user_email,
            "email_type": "review_request",
            "status": "sent"
        })
        if existing:
            logger.info(f"Review request already sent to {user_email}, skipping")
            return {"success": True, "skipped": True, "reason": "already_sent"}
    
    template = template_review_request(user_name, document_type)
    return await send_email(user_email, template["subject"], template["html"], "review_request")


async def send_password_changed_email(user_email: str, user_name: str):
    """Send password changed notification immediately"""
    template = template_password_changed(user_name)
    return await send_email(user_email, template["subject"], template["html"], "password_changed")


async def cancel_signup_no_purchase_reminder(user_id: str):
    """Cancel the signup no-purchase reminder when user makes a purchase or subscribes"""
    return await cancel_scheduled_email(user_id, "signup_no_purchase")

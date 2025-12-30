from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os
import json
import httpx
from bs4 import BeautifulSoup
from dotenv import load_dotenv
import uuid
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient
import io
import re

load_dotenv()

# Import Emergent Integrations for Gemini
from emergentintegrations.llm.chat import LlmChat, UserMessage

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

# MongoDB Connection
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "mintslip_db")

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]
discounts_collection = db["discount_codes"]

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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

Please generate the following in JSON format. ONLY output valid JSON, no markdown code blocks:
{{
    "professionalSummary": "A compelling 3-4 sentence professional summary tailored to this role",
    "optimizedExperience": [
        {{
            "company": "Company Name",
            "position": "Position Title",
            "location": "City, State",
            "startDate": "Start Date",
            "endDate": "End Date or Present",
            "bullets": ["Bullet point 1", "Bullet point 2", "Bullet point 3", "Bullet point 4"]
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

Ensure each work experience entry has 3-5 impactful bullet points using the STAR method where applicable. Use action verbs and include metrics/numbers when the original data supports it.
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
            except:
                pass
        
        return {"content": response_text}
        
    except Exception as e:
        print(f"Error regenerating section: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error regenerating section: {str(e)}")

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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os
import json
import httpx
from bs4 import BeautifulSoup
from dotenv import load_dotenv
import uuid

load_dotenv()

# Import Emergent Integrations for Gemini
from emergentintegrations.llm.chat import LlmChat, UserMessage

app = FastAPI()

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
        llm = get_llm()
        
        # Build context from user data
        work_history = "\n".join([
            f"- {exp.position} at {exp.company} ({exp.startDate} - {'Present' if exp.current else exp.endDate})\n  Responsibilities: {'; '.join(exp.responsibilities)}"
            for exp in data.workExperience
        ])
        
        education_history = "\n".join([
            f"- {edu.degree} in {edu.field} from {edu.institution} ({edu.graduationDate})"
            for edu in data.education
        ])
        
        skills_list = ", ".join(data.skills) if data.skills else "Not specified"
        
        prompt = f"""You are an expert resume writer and ATS optimization specialist. Your task is to create an optimized resume tailored to a specific job posting.

IMPORTANT RULES:
1. ONLY use information provided by the user - DO NOT fabricate any employers, dates, degrees, or certifications
2. Rewrite and enhance existing responsibilities using action verbs and quantifiable achievements where possible
3. Align the resume content to match the job requirements and keywords
4. Ensure ATS-friendly formatting with relevant keywords from the job description
5. Match the tone and seniority level of the target position

USER'S BACKGROUND:
Name: {data.personalInfo.get('fullName', 'Candidate')}
Email: {data.personalInfo.get('email', '')}
Phone: {data.personalInfo.get('phone', '')}
Location: {data.personalInfo.get('location', '')}
LinkedIn: {data.personalInfo.get('linkedin', '')}

WORK EXPERIENCE:
{work_history}

EDUCATION:
{education_history}

SKILLS:
{skills_list}

TARGET JOB TITLE: {data.targetJobTitle}

JOB DESCRIPTION:
{data.jobDescription[:4000]}

Please generate the following in JSON format:
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

        messages = [Message(role="user", content=prompt)]
        response = await llm.chat(messages)
        
        # Parse the JSON response
        response_text = response.content
        
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
        llm = get_llm()
        
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
        
        messages = [Message(role="user", content=prompt)]
        response = await llm.chat(messages)
        
        response_text = response.content.strip()
        
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)

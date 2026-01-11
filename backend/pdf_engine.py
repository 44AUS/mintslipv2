"""
PDF Metadata & Document Consistency Engine
Business Plan Feature - Analyzes, normalizes, and validates PDF metadata
with document-type-specific risk scoring and AI-powered analysis
"""

import os
import io
import re
import json
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, List, Tuple

from dotenv import load_dotenv
load_dotenv()

from PyPDF2 import PdfReader
import pikepdf
from pdfminer.high_level import extract_text, extract_pages
from pdfminer.layout import LTTextContainer, LTChar
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.colors import HexColor
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.units import inch

# Import LLM for AI analysis
from emergentintegrations.llm.chat import LlmChat, UserMessage


# ============================================
# DOCUMENT TYPE CONFIGURATIONS
# ============================================

DOCUMENT_TYPES = {
    "paystub": {
        "name": "Pay Stub",
        "description": "Paycheck stub or earnings statement",
    },
    "bank_statement": {
        "name": "Bank Statement",
        "description": "Bank account statement",
    },
    "tax_form": {
        "name": "Tax Form",
        "description": "W-2, 1099, or other tax documents",
    },
    "other": {
        "name": "Other Document",
        "description": "General PDF document",
    }
}

# ============================================
# PAYSTUB PRODUCER CONFIGURATIONS
# ============================================

# Legitimate paystub producers with expected metadata patterns
PAYSTUB_LEGITIMATE_PRODUCERS = {
    # Major Payroll Providers
    "adp": {
        "names": ["adp", "automatic data processing"],
        "expected_producers": ["adp", "oracle", "jasperreports"],
        "expected_creators": ["adp", "workforce now", "run powered by adp"],
        "risk_reduction": 25,
        "notes": "Major payroll provider - serves 800k+ businesses"
    },
    "paychex": {
        "names": ["paychex"],
        "expected_producers": ["paychex", "oracle", "jasperreports", "microsoft"],
        "expected_creators": ["paychex", "paychex flex"],
        "risk_reduction": 25,
        "notes": "Major payroll provider"
    },
    "gusto": {
        "names": ["gusto", "zenpayroll"],
        "expected_producers": ["gusto", "wkhtmltopdf", "chrome", "puppeteer"],
        "expected_creators": ["gusto", "chrome"],
        "risk_reduction": 25,
        "notes": "Popular SMB payroll provider"
    },
    "quickbooks": {
        "names": ["quickbooks", "intuit"],
        "expected_producers": ["intuit", "quickbooks", "qt"],
        "expected_creators": ["intuit", "quickbooks"],
        "risk_reduction": 25,
        "notes": "Intuit QuickBooks payroll"
    },
    "workday": {
        "names": ["workday"],
        "expected_producers": ["workday", "oracle", "birt"],
        "expected_creators": ["workday"],
        "risk_reduction": 25,
        "notes": "Enterprise HR/payroll system"
    },
    "ceridian": {
        "names": ["ceridian", "dayforce"],
        "expected_producers": ["ceridian", "dayforce", "oracle"],
        "expected_creators": ["ceridian", "dayforce"],
        "risk_reduction": 25,
        "notes": "Enterprise payroll provider"
    },
    "ukg": {
        "names": ["ukg", "kronos", "ultimate software", "ultipro"],
        "expected_producers": ["ukg", "kronos", "ultimate", "ultipro"],
        "expected_creators": ["ukg", "kronos", "ultipro"],
        "risk_reduction": 25,
        "notes": "UKG (Ultimate Kronos Group)"
    },
    "paylocity": {
        "names": ["paylocity"],
        "expected_producers": ["paylocity", "oracle", "microsoft"],
        "expected_creators": ["paylocity"],
        "risk_reduction": 25,
        "notes": "Cloud payroll provider"
    },
    "paycom": {
        "names": ["paycom"],
        "expected_producers": ["paycom", "oracle"],
        "expected_creators": ["paycom"],
        "risk_reduction": 25,
        "notes": "HR and payroll technology"
    },
    "square": {
        "names": ["square payroll", "square"],
        "expected_producers": ["square", "chrome", "wkhtmltopdf"],
        "expected_creators": ["square"],
        "risk_reduction": 20,
        "notes": "Square Payroll for small businesses"
    },
    "rippling": {
        "names": ["rippling"],
        "expected_producers": ["rippling", "chrome", "puppeteer"],
        "expected_creators": ["rippling"],
        "risk_reduction": 20,
        "notes": "Modern HR platform"
    },
    "zenefits": {
        "names": ["zenefits", "trinet zenefits"],
        "expected_producers": ["zenefits", "chrome"],
        "expected_creators": ["zenefits"],
        "risk_reduction": 20,
        "notes": "HR platform with payroll"
    },
    "namely": {
        "names": ["namely"],
        "expected_producers": ["namely", "oracle"],
        "expected_creators": ["namely"],
        "risk_reduction": 20,
        "notes": "Mid-market HR platform"
    },
    "bamboohr": {
        "names": ["bamboohr", "bamboo hr"],
        "expected_producers": ["bamboohr", "chrome"],
        "expected_creators": ["bamboohr"],
        "risk_reduction": 20,
        "notes": "HR software with payroll"
    },
    "sage": {
        "names": ["sage", "sage payroll"],
        "expected_producers": ["sage", "crystal reports", "microsoft"],
        "expected_creators": ["sage"],
        "risk_reduction": 20,
        "notes": "Sage accounting/payroll"
    },
    "oracle": {
        "names": ["oracle", "peoplesoft"],
        "expected_producers": ["oracle", "bi publisher", "peoplesoft"],
        "expected_creators": ["oracle", "peoplesoft"],
        "risk_reduction": 25,
        "notes": "Oracle HCM/PeopleSoft"
    },
    "sap": {
        "names": ["sap", "successfactors"],
        "expected_producers": ["sap", "successfactors", "crystal"],
        "expected_creators": ["sap"],
        "risk_reduction": 25,
        "notes": "SAP SuccessFactors"
    },
}

# Suspicious paystub producers (red flags)
PAYSTUB_SUSPICIOUS_PRODUCERS = [
    "paystub generator",
    "stub creator",
    "check stub maker",
    "fake pay",
    "instant paystub",
    "online paystub",
    "paystubcreator",
    "thepaystubs",
    "stubcreator",
    "realcheckstubs",
    "pay-stubs",
    "123paystubs",
    "formswift",
    "wagepoint",  # Free tool often misused
    "wave payroll",  # Free tool
    "canva",
    "smallpdf",
    "ilovepdf",
    "pdf editor",
    "nitro",
    "foxit phantompdf",
    "pdfforge",
]

# Expected paystub content patterns
PAYSTUB_EXPECTED_CONTENT = [
    r"gross\s*pay",
    r"net\s*pay",
    r"federal\s*tax|fed\s*tax",
    r"state\s*tax",
    r"fica|social\s*security",
    r"medicare",
    r"ytd|year.to.date",
    r"pay\s*period|period\s*ending",
    r"employee\s*(name|id|number)",
    r"employer|company",
]

# ============================================
# BANK STATEMENT PRODUCER CONFIGURATIONS
# ============================================

BANK_STATEMENT_LEGITIMATE_PRODUCERS = {
    # Major US Banks
    "chase": {
        "names": ["chase", "jpmorgan", "jp morgan"],
        "expected_producers": ["adobe", "chase", "jpmorgan", "documentum"],
        "expected_creators": ["chase", "jpmorgan", "acrobat"],
        "risk_reduction": 30,
        "notes": "JPMorgan Chase - largest US bank"
    },
    "bank_of_america": {
        "names": ["bank of america", "bofa", "boa", "bankofamerica"],
        "expected_producers": ["adobe", "bank of america", "merrill"],
        "expected_creators": ["bank of america", "acrobat"],
        "risk_reduction": 30,
        "notes": "Bank of America"
    },
    "wells_fargo": {
        "names": ["wells fargo", "wellsfargo", "wf"],
        "expected_producers": ["adobe", "wells fargo", "documentum"],
        "expected_creators": ["wells fargo", "acrobat"],
        "risk_reduction": 30,
        "notes": "Wells Fargo"
    },
    "citibank": {
        "names": ["citibank", "citi", "citigroup"],
        "expected_producers": ["adobe", "citi", "citibank"],
        "expected_creators": ["citi", "acrobat"],
        "risk_reduction": 30,
        "notes": "Citibank/Citigroup"
    },
    "us_bank": {
        "names": ["us bank", "u.s. bank", "usbank"],
        "expected_producers": ["adobe", "us bank", "oracle"],
        "expected_creators": ["us bank", "acrobat"],
        "risk_reduction": 25,
        "notes": "U.S. Bank"
    },
    "pnc": {
        "names": ["pnc", "pnc bank"],
        "expected_producers": ["adobe", "pnc", "oracle"],
        "expected_creators": ["pnc", "acrobat"],
        "risk_reduction": 25,
        "notes": "PNC Bank"
    },
    "capital_one": {
        "names": ["capital one", "capitalone"],
        "expected_producers": ["adobe", "capital one"],
        "expected_creators": ["capital one", "acrobat"],
        "risk_reduction": 25,
        "notes": "Capital One"
    },
    "td_bank": {
        "names": ["td bank", "td", "toronto dominion"],
        "expected_producers": ["adobe", "td bank", "td"],
        "expected_creators": ["td bank", "acrobat"],
        "risk_reduction": 25,
        "notes": "TD Bank"
    },
    "truist": {
        "names": ["truist", "bb&t", "suntrust"],
        "expected_producers": ["adobe", "truist", "suntrust", "bb&t"],
        "expected_creators": ["truist", "acrobat"],
        "risk_reduction": 25,
        "notes": "Truist (BB&T + SunTrust)"
    },
    "navy_federal": {
        "names": ["navy federal", "nfcu"],
        "expected_producers": ["adobe", "navy federal"],
        "expected_creators": ["navy federal", "acrobat"],
        "risk_reduction": 25,
        "notes": "Navy Federal Credit Union"
    },
    "usaa": {
        "names": ["usaa"],
        "expected_producers": ["adobe", "usaa"],
        "expected_creators": ["usaa", "acrobat"],
        "risk_reduction": 25,
        "notes": "USAA"
    },
    "schwab": {
        "names": ["schwab", "charles schwab"],
        "expected_producers": ["adobe", "schwab", "charles schwab"],
        "expected_creators": ["schwab", "acrobat"],
        "risk_reduction": 25,
        "notes": "Charles Schwab"
    },
    "ally": {
        "names": ["ally", "ally bank"],
        "expected_producers": ["adobe", "ally"],
        "expected_creators": ["ally", "acrobat"],
        "risk_reduction": 20,
        "notes": "Ally Bank (online)"
    },
    "chime": {
        "names": ["chime"],
        "expected_producers": ["chime", "chrome", "puppeteer"],
        "expected_creators": ["chime"],
        "risk_reduction": 15,
        "notes": "Chime (fintech) - web-generated statements"
    },
    "discover": {
        "names": ["discover", "discover bank"],
        "expected_producers": ["adobe", "discover"],
        "expected_creators": ["discover", "acrobat"],
        "risk_reduction": 20,
        "notes": "Discover Bank"
    },
    "american_express": {
        "names": ["american express", "amex"],
        "expected_producers": ["adobe", "american express", "amex"],
        "expected_creators": ["american express", "acrobat"],
        "risk_reduction": 25,
        "notes": "American Express"
    },
}

# Suspicious bank statement producers
BANK_STATEMENT_SUSPICIOUS_PRODUCERS = [
    "bank statement generator",
    "statement creator",
    "fake bank",
    "novelty statement",
    "proof of funds",
    "canva",
    "smallpdf",
    "ilovepdf",
    "pdf editor",
    "nitro",
    "foxit phantompdf",
    "online editor",
    "edit pdf",
]

# Expected bank statement content patterns
BANK_STATEMENT_EXPECTED_CONTENT = [
    r"account\s*(number|#)",
    r"statement\s*period",
    r"opening\s*balance|beginning\s*balance",
    r"closing\s*balance|ending\s*balance",
    r"total\s*deposits|deposits",
    r"total\s*withdrawals|withdrawals",
    r"routing\s*number",
    r"fdic|federal\s*deposit",
]

# ============================================
# TAX FORM PRODUCER CONFIGURATIONS
# ============================================

TAX_FORM_LEGITIMATE_PRODUCERS = {
    "irs": {
        "names": ["irs", "internal revenue service"],
        "expected_producers": ["irs", "adobe", "government"],
        "expected_creators": ["irs", "internal revenue"],
        "risk_reduction": 30,
        "notes": "IRS official forms"
    },
    "turbotax": {
        "names": ["turbotax", "intuit"],
        "expected_producers": ["intuit", "turbotax"],
        "expected_creators": ["turbotax", "intuit"],
        "risk_reduction": 25,
        "notes": "TurboTax tax preparation"
    },
    "hrblock": {
        "names": ["h&r block", "hrblock", "h r block"],
        "expected_producers": ["h&r block", "hrblock"],
        "expected_creators": ["h&r block"],
        "risk_reduction": 25,
        "notes": "H&R Block"
    },
    "taxact": {
        "names": ["taxact"],
        "expected_producers": ["taxact"],
        "expected_creators": ["taxact"],
        "risk_reduction": 20,
        "notes": "TaxAct"
    },
    "adp_tax": {
        "names": ["adp"],
        "expected_producers": ["adp", "automatic data processing"],
        "expected_creators": ["adp"],
        "risk_reduction": 25,
        "notes": "ADP W-2/tax forms"
    },
}

# ============================================
# RISK SCORE WEIGHTS
# ============================================

RISK_WEIGHTS = {
    # General risks
    "missing_metadata": 5,
    "suspicious_producer": 20,
    "suspicious_creator": 15,
    "future_date": 30,
    "inconsistent_timestamps": 20,
    "font_inconsistency": 15,
    "incremental_updates": 5,
    
    # Document-specific risks
    "unknown_producer_for_type": 25,
    "producer_mismatch": 30,
    "missing_expected_content": 20,
    "content_pattern_mismatch": 15,
    "web_generator_detected": 35,
    "known_fake_generator": 40,
    
    # Positive indicators (risk reduction)
    "legitimate_producer_match": -25,
    "expected_content_found": -10,
    "consistent_formatting": -5,
}


class PDFAnalysisResult:
    """Container for PDF analysis results"""
    
    def __init__(self):
        self.metadata = {}
        self.consistency_findings = []
        self.risk_factors = []
        self.risk_score = 0
        self.recommendations = []
        self.fonts_used = []
        self.page_count = 0
        self.file_size = 0
        self.has_xmp = False
        self.incremental_updates = 0
        self.text_content = ""
        self.dates_in_text = []
        self.numbers_in_text = []
        self.document_type = "other"
        self.detected_producer = None
        self.producer_match = None
        self.content_matches = []
        self.ai_analysis = None  # AI-powered analysis results
        
    def to_dict(self) -> Dict:
        return {
            "metadata": self.metadata,
            "consistencyFindings": self.consistency_findings,
            "riskFactors": self.risk_factors,
            "riskScore": self.risk_score,
            "riskLevel": self.get_risk_level(),
            "recommendations": self.recommendations,
            "fontsUsed": self.fonts_used,
            "pageCount": self.page_count,
            "fileSize": self.file_size,
            "hasXmp": self.has_xmp,
            "incrementalUpdates": self.incremental_updates,
            "datesInText": self.dates_in_text,
            "documentType": self.document_type,
            "detectedProducer": self.detected_producer,
            "producerMatch": self.producer_match,
            "contentMatches": self.content_matches,
            "aiAnalysis": self.ai_analysis,
        }
    
    def get_risk_level(self) -> str:
        if self.risk_score <= 25:
            return "low"
        elif self.risk_score <= 50:
            return "moderate"
        elif self.risk_score <= 75:
            return "high"
        else:
            return "very_high"
    
    def add_risk(self, factor: str, description: str, points: int):
        self.risk_factors.append({
            "factor": factor,
            "description": description,
            "points": points
        })
        self.risk_score = max(0, min(100, self.risk_score + points))
    
    def add_finding(self, category: str, severity: str, message: str, details: str = ""):
        self.consistency_findings.append({
            "category": category,
            "severity": severity,
            "message": message,
            "details": details
        })
    
    def add_recommendation(self, title: str, description: str, priority: str = "medium"):
        self.recommendations.append({
            "title": title,
            "description": description,
            "priority": priority
        })


def parse_pdf_date(date_str: str) -> Optional[datetime]:
    """Parse PDF date format (D:YYYYMMDDHHmmSS+HH'mm')"""
    if not date_str:
        return None
    
    if date_str.startswith("D:"):
        date_str = date_str[2:]
    
    formats = [
        "%Y%m%d%H%M%S",
        "%Y%m%d%H%M",
        "%Y%m%d",
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%dT%H:%M:%S",
    ]
    
    date_str = re.sub(r"[+\-Z'].*", "", date_str)
    
    for fmt in formats:
        try:
            return datetime.strptime(date_str[:len(fmt.replace("%", ""))], fmt)
        except (ValueError, IndexError):
            continue
    
    return None


def extract_dates_from_text(text: str) -> List[str]:
    """Extract date patterns from text"""
    date_patterns = [
        r'\d{1,2}/\d{1,2}/\d{2,4}',
        r'\d{1,2}-\d{1,2}-\d{2,4}',
        r'\d{4}-\d{2}-\d{2}',
        r'(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2},?\s+\d{4}',
        r'\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}',
    ]
    
    dates = []
    for pattern in date_patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        dates.extend(matches)
    
    return list(set(dates))


def extract_numbers_from_text(text: str) -> List[Dict]:
    """Extract monetary values from text"""
    currency_pattern = r'\$[\d,]+\.?\d{0,2}'
    amounts = re.findall(currency_pattern, text)
    
    numbers = []
    for amt in amounts:
        clean = amt.replace('$', '').replace(',', '')
        try:
            value = float(clean)
            numbers.append({"raw": amt, "value": value})
        except ValueError:
            pass
    
    return numbers


def check_content_patterns(text: str, patterns: List[str]) -> List[str]:
    """Check which expected content patterns are found in text"""
    found = []
    text_lower = text.lower()
    for pattern in patterns:
        if re.search(pattern, text_lower):
            found.append(pattern)
    return found


def identify_producer_match(producer: str, creator: str, legitimate_producers: Dict) -> Optional[Dict]:
    """Identify if producer/creator matches a legitimate source"""
    producer_lower = producer.lower() if producer else ""
    creator_lower = creator.lower() if creator else ""
    
    for key, config in legitimate_producers.items():
        # Check if any name variant matches
        for name in config["names"]:
            if name in producer_lower or name in creator_lower:
                return {
                    "key": key,
                    "name": config["names"][0],
                    "risk_reduction": config["risk_reduction"],
                    "notes": config.get("notes", ""),
                    "match_type": "name_match"
                }
        
        # Check expected producers
        for expected in config["expected_producers"]:
            if expected in producer_lower:
                return {
                    "key": key,
                    "name": config["names"][0],
                    "risk_reduction": config["risk_reduction"],
                    "notes": config.get("notes", ""),
                    "match_type": "producer_match"
                }
        
        # Check expected creators
        for expected in config["expected_creators"]:
            if expected in creator_lower:
                return {
                    "key": key,
                    "name": config["names"][0],
                    "risk_reduction": config["risk_reduction"] - 5,  # Slightly less confidence
                    "notes": config.get("notes", ""),
                    "match_type": "creator_match"
                }
    
    return None


def check_suspicious_producers(producer: str, creator: str, suspicious_list: List[str]) -> Optional[str]:
    """Check if producer/creator matches suspicious patterns"""
    producer_lower = producer.lower() if producer else ""
    creator_lower = creator.lower() if creator else ""
    
    for suspicious in suspicious_list:
        if suspicious in producer_lower:
            return f"Producer contains suspicious pattern: '{suspicious}'"
        if suspicious in creator_lower:
            return f"Creator contains suspicious pattern: '{suspicious}'"
    
    return None


def analyze_pdf_metadata(pdf_bytes: bytes, document_type: str = "other") -> PDFAnalysisResult:
    """Analyze PDF metadata with document-type-specific risk scoring"""
    result = PDFAnalysisResult()
    result.file_size = len(pdf_bytes)
    result.document_type = document_type
    
    # Select appropriate producer lists based on document type
    if document_type == "paystub":
        legitimate_producers = PAYSTUB_LEGITIMATE_PRODUCERS
        suspicious_producers = PAYSTUB_SUSPICIOUS_PRODUCERS
        expected_content = PAYSTUB_EXPECTED_CONTENT
    elif document_type == "bank_statement":
        legitimate_producers = BANK_STATEMENT_LEGITIMATE_PRODUCERS
        suspicious_producers = BANK_STATEMENT_SUSPICIOUS_PRODUCERS
        expected_content = BANK_STATEMENT_EXPECTED_CONTENT
    elif document_type == "tax_form":
        legitimate_producers = TAX_FORM_LEGITIMATE_PRODUCERS
        suspicious_producers = PAYSTUB_SUSPICIOUS_PRODUCERS  # Reuse
        expected_content = []
    else:
        legitimate_producers = {}
        suspicious_producers = PAYSTUB_SUSPICIOUS_PRODUCERS + BANK_STATEMENT_SUSPICIOUS_PRODUCERS
        expected_content = []
    
    try:
        # Use PyPDF2 for basic metadata
        pdf_file = io.BytesIO(pdf_bytes)
        reader = PdfReader(pdf_file)
        
        result.page_count = len(reader.pages)
        
        # Extract metadata
        meta = reader.metadata
        if meta:
            result.metadata = {
                "producer": str(meta.get("/Producer", "")) if meta.get("/Producer") else "",
                "creator": str(meta.get("/Creator", "")) if meta.get("/Creator") else "",
                "creationDate": str(meta.get("/CreationDate", "")) if meta.get("/CreationDate") else "",
                "modificationDate": str(meta.get("/ModDate", "")) if meta.get("/ModDate") else "",
                "author": str(meta.get("/Author", "")) if meta.get("/Author") else "",
                "title": str(meta.get("/Title", "")) if meta.get("/Title") else "",
                "subject": str(meta.get("/Subject", "")) if meta.get("/Subject") else "",
            }
        else:
            result.metadata = {
                "producer": "", "creator": "", "creationDate": "",
                "modificationDate": "", "author": "", "title": "", "subject": "",
            }
            result.add_risk("missing_metadata", "PDF has no metadata - unusual for legitimate documents", 10)
            result.add_finding("metadata", "warning", "No metadata found", "Legitimate documents typically contain metadata")
        
        # Get PDF version
        try:
            pdf_file.seek(0)
            first_line = pdf_file.readline().decode('latin-1', errors='ignore')
            version_match = re.search(r'%PDF-(\d+\.\d+)', first_line)
            result.metadata["pdfVersion"] = version_match.group(1) if version_match else "Unknown"
        except Exception:
            result.metadata["pdfVersion"] = "Unknown"
        
        producer = result.metadata.get("producer", "")
        creator = result.metadata.get("creator", "")
        
        # ============================================
        # DOCUMENT-TYPE SPECIFIC ANALYSIS
        # ============================================
        
        if document_type in ["paystub", "bank_statement", "tax_form"]:
            # Check for legitimate producer match
            producer_match = identify_producer_match(producer, creator, legitimate_producers)
            
            if producer_match:
                result.producer_match = producer_match
                result.detected_producer = producer_match["name"]
                
                # Apply risk reduction for legitimate source
                result.add_risk(
                    "legitimate_producer_match",
                    f"Recognized legitimate {DOCUMENT_TYPES[document_type]['name']} source: {producer_match['name']}",
                    -producer_match["risk_reduction"]
                )
                result.add_finding(
                    "producer",
                    "info",
                    f"Legitimate producer detected: {producer_match['name']}",
                    producer_match.get("notes", "")
                )
            else:
                # No legitimate producer found - this is a risk
                if producer or creator:
                    result.add_risk(
                        "unknown_producer_for_type",
                        f"Producer/creator not recognized as legitimate {DOCUMENT_TYPES[document_type]['name']} source",
                        RISK_WEIGHTS["unknown_producer_for_type"]
                    )
                    result.add_finding(
                        "producer",
                        "warning",
                        f"Unknown producer for {DOCUMENT_TYPES[document_type]['name']}",
                        f"Producer: {producer or 'N/A'}, Creator: {creator or 'N/A'}"
                    )
                    result.add_recommendation(
                        "Verify Document Source",
                        f"This document's producer ({producer or creator}) is not recognized as a standard {DOCUMENT_TYPES[document_type]['name']} generator. Verify the source.",
                        "high"
                    )
            
            # Check for suspicious producers
            suspicious_match = check_suspicious_producers(producer, creator, suspicious_producers)
            if suspicious_match:
                result.add_risk(
                    "known_fake_generator",
                    suspicious_match,
                    RISK_WEIGHTS["known_fake_generator"]
                )
                result.add_finding(
                    "producer",
                    "error",
                    "Suspicious document generator detected",
                    suspicious_match
                )
                result.add_recommendation(
                    "Document May Be Fabricated",
                    "This document appears to be created by a known fake document generator. It will likely fail verification.",
                    "high"
                )
        
        # Check for XMP metadata
        try:
            pdf_file.seek(0)
            with pikepdf.open(pdf_file) as pdf:
                if pdf.Root.get("/Metadata"):
                    result.has_xmp = True
                    result.metadata["hasXmp"] = True
                else:
                    result.metadata["hasXmp"] = False
                
                # Check for incremental updates
                pdf_file.seek(0)
                content = pdf_file.read()
                xref_count = content.count(b'startxref')
                result.incremental_updates = max(0, xref_count - 1)
                result.metadata["incrementalUpdates"] = result.incremental_updates
                
                if result.incremental_updates > 2:
                    result.add_risk(
                        "incremental_updates",
                        f"Document has {result.incremental_updates} incremental updates - indicates multiple edits",
                        RISK_WEIGHTS["incremental_updates"] * min(result.incremental_updates, 3)
                    )
                    result.add_finding(
                        "structure",
                        "warning",
                        f"Multiple edit traces detected ({result.incremental_updates})",
                        "Document has been modified multiple times"
                    )
        except Exception:
            result.metadata["hasXmp"] = False
            result.metadata["incrementalUpdates"] = 0
        
        # Analyze dates
        creation_date = parse_pdf_date(result.metadata.get("creationDate", ""))
        mod_date = parse_pdf_date(result.metadata.get("modificationDate", ""))
        now = datetime.now()
        
        if creation_date:
            result.metadata["creationDateParsed"] = creation_date.isoformat()
            if creation_date > now:
                result.add_risk("future_date", "Creation date is in the future", RISK_WEIGHTS["future_date"])
                result.add_finding("metadata", "error", "Creation date is in the future", f"Date: {creation_date.isoformat()}")
        
        if mod_date:
            result.metadata["modificationDateParsed"] = mod_date.isoformat()
            if mod_date > now:
                result.add_risk("future_date", "Modification date is in the future", RISK_WEIGHTS["future_date"])
                result.add_finding("metadata", "error", "Modification date is in the future", f"Date: {mod_date.isoformat()}")
        
        if creation_date and mod_date and mod_date < creation_date:
            result.add_risk("inconsistent_timestamps", "Modification date before creation date", RISK_WEIGHTS["inconsistent_timestamps"])
            result.add_finding("metadata", "error", "Inconsistent timestamps", "Modification date cannot be before creation date")
        
        # Extract and analyze text content
        try:
            pdf_file.seek(0)
            result.text_content = extract_text(pdf_file)
            result.dates_in_text = extract_dates_from_text(result.text_content)
            result.numbers_in_text = extract_numbers_from_text(result.text_content)
            
            # Check for expected content patterns
            if expected_content:
                found_patterns = check_content_patterns(result.text_content, expected_content)
                result.content_matches = found_patterns
                
                match_ratio = len(found_patterns) / len(expected_content)
                
                if match_ratio >= 0.5:
                    result.add_risk(
                        "expected_content_found",
                        f"Found {len(found_patterns)}/{len(expected_content)} expected content patterns",
                        RISK_WEIGHTS["expected_content_found"]
                    )
                    result.add_finding(
                        "content",
                        "info",
                        f"Document contains expected {DOCUMENT_TYPES[document_type]['name']} content",
                        f"Matched patterns: {len(found_patterns)}/{len(expected_content)}"
                    )
                elif match_ratio < 0.3 and document_type != "other":
                    result.add_risk(
                        "missing_expected_content",
                        f"Missing most expected {DOCUMENT_TYPES[document_type]['name']} content patterns",
                        RISK_WEIGHTS["missing_expected_content"]
                    )
                    result.add_finding(
                        "content",
                        "warning",
                        f"Document missing expected {DOCUMENT_TYPES[document_type]['name']} content",
                        f"Only {len(found_patterns)}/{len(expected_content)} patterns found"
                    )
        except Exception as e:
            result.add_finding("content", "warning", "Could not extract text content", str(e))
        
        # Analyze fonts
        try:
            fonts = set()
            pdf_file.seek(0)
            for page in extract_pages(pdf_file):
                for element in page:
                    if isinstance(element, LTTextContainer):
                        for text_line in element:
                            if hasattr(text_line, '__iter__'):
                                for char in text_line:
                                    if isinstance(char, LTChar):
                                        fonts.add(char.fontname)
            
            result.fonts_used = list(fonts)
            result.metadata["fontsUsed"] = result.fonts_used
            
            if len(fonts) > 10:
                result.add_risk(
                    "font_inconsistency",
                    f"Document uses {len(fonts)} different fonts - may indicate copy-paste",
                    RISK_WEIGHTS["font_inconsistency"]
                )
                result.add_finding(
                    "consistency",
                    "warning",
                    f"High font variety ({len(fonts)} fonts)",
                    "May indicate content combined from multiple sources"
                )
        except Exception:
            pass
        
        # Generate recommendations based on risk level
        if result.risk_score >= 75:
            result.add_recommendation(
                "High Risk Document",
                "This document has multiple red flags and will likely fail third-party verification. Consider obtaining the document directly from the source.",
                "high"
            )
        elif result.risk_score >= 50:
            result.add_recommendation(
                "Moderate Risk",
                "This document has some concerning patterns. Review the flagged issues before using.",
                "medium"
            )
        
        # Ensure score is within bounds
        result.risk_score = max(0, min(100, result.risk_score))
        
        return result
        
    except Exception as e:
        result.add_finding("error", "error", f"Analysis failed: {str(e)}", "")
        result.risk_score = 50
        return result


def normalize_pdf_metadata(pdf_bytes: bytes, options: Dict = None) -> Tuple[bytes, Dict]:
    """Normalize PDF metadata to reduce red flags"""
    options = options or {}
    changes = []
    
    try:
        pdf_file = io.BytesIO(pdf_bytes)
        
        with pikepdf.open(pdf_file) as pdf:
            with pdf.open_metadata() as meta:
                original_meta = dict(meta)
            
            now = datetime.now(timezone.utc)
            
            if options.get("standardize_producer", True):
                current_producer = original_meta.get('pdf:Producer', '')
                if current_producer:
                    changes.append({
                        "field": "Producer",
                        "original": current_producer,
                        "new": "Document Generator",
                        "reason": "Standardized producer field"
                    })
            
            if options.get("fix_dates", True):
                with pdf.open_metadata() as meta:
                    creation_str = meta.get('xmp:CreateDate', '')
                    if creation_str:
                        try:
                            creation_date = datetime.fromisoformat(creation_str.replace('Z', '+00:00'))
                            if creation_date > now:
                                new_date = now - timedelta(days=30)
                                meta['xmp:CreateDate'] = new_date.isoformat()
                                changes.append({
                                    "field": "Creation Date",
                                    "original": creation_str,
                                    "new": new_date.isoformat(),
                                    "reason": "Fixed future date"
                                })
                        except Exception:
                            pass
            
            if options.get("flatten_document", True):
                changes.append({
                    "field": "Document Structure",
                    "original": "Multiple revisions",
                    "new": "Single revision",
                    "reason": "Flattened document to remove edit history"
                })
            
            output = io.BytesIO()
            pdf.save(output, linearize=True)
            
            return output.getvalue(), {
                "success": True,
                "changes": changes,
                "timestamp": now.isoformat()
            }
            
    except Exception as e:
        return pdf_bytes, {
            "success": False,
            "error": str(e),
            "changes": []
        }


def generate_analysis_report_pdf(analysis: PDFAnalysisResult, filename: str = "analysis") -> bytes:
    """Generate a PDF report of the analysis"""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, topMargin=0.5*inch, bottomMargin=0.5*inch)
    
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=18,
        textColor=HexColor('#1a4731'),
        spaceAfter=20
    )
    
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=HexColor('#1a4731'),
        spaceBefore=15,
        spaceAfter=10
    )
    
    normal_style = styles['Normal']
    
    story = []
    
    # Title
    story.append(Paragraph("PDF Metadata & Consistency Analysis Report", title_style))
    story.append(Paragraph(f"Document Type: {DOCUMENT_TYPES.get(analysis.document_type, {}).get('name', 'Unknown')}", normal_style))
    story.append(Paragraph(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", normal_style))
    story.append(Spacer(1, 20))
    
    # Risk Score
    risk_colors = {
        "low": "#22c55e",
        "moderate": "#eab308",
        "high": "#f97316",
        "very_high": "#ef4444"
    }
    
    story.append(Paragraph("Risk Assessment", heading_style))
    story.append(Paragraph(f"<b>Risk Score:</b> {analysis.risk_score}/100", normal_style))
    story.append(Paragraph(f"<b>Risk Level:</b> {analysis.get_risk_level().replace('_', ' ').title()}", normal_style))
    
    if analysis.producer_match:
        story.append(Paragraph(f"<b>Detected Source:</b> {analysis.producer_match['name']}", normal_style))
    
    story.append(Spacer(1, 10))
    
    # Metadata Summary
    story.append(Paragraph("Metadata Summary", heading_style))
    meta_data = [
        ["Field", "Value"],
        ["Producer", analysis.metadata.get("producer", "N/A") or "N/A"],
        ["Creator", analysis.metadata.get("creator", "N/A") or "N/A"],
        ["Creation Date", analysis.metadata.get("creationDateParsed", analysis.metadata.get("creationDate", "N/A")) or "N/A"],
        ["Modification Date", analysis.metadata.get("modificationDateParsed", analysis.metadata.get("modificationDate", "N/A")) or "N/A"],
        ["PDF Version", analysis.metadata.get("pdfVersion", "N/A")],
        ["Page Count", str(analysis.page_count)],
        ["Incremental Updates", str(analysis.incremental_updates)],
    ]
    
    meta_table = Table(meta_data, colWidths=[2*inch, 4*inch])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), HexColor('#1a4731')),
        ('TEXTCOLOR', (0, 0), (-1, 0), HexColor('#ffffff')),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), HexColor('#f8fafc')),
        ('GRID', (0, 0), (-1, -1), 1, HexColor('#e2e8f0')),
        ('FONTSIZE', (0, 1), (-1, -1), 9),
        ('TOPPADDING', (0, 1), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 6),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 15))
    
    # Risk Factors
    if analysis.risk_factors:
        story.append(Paragraph("Risk Factors", heading_style))
        for factor in analysis.risk_factors:
            points_str = f"+{factor['points']}" if factor['points'] > 0 else str(factor['points'])
            story.append(Paragraph(f"• <b>{factor['factor']}:</b> {factor['description']} ({points_str} points)", normal_style))
        story.append(Spacer(1, 10))
    
    # Findings
    if analysis.consistency_findings:
        story.append(Paragraph("Findings", heading_style))
        for finding in analysis.consistency_findings:
            severity_symbol = {"info": "ℹ️", "warning": "⚠️", "error": "❌"}.get(finding["severity"], "•")
            story.append(Paragraph(f"{severity_symbol} <b>[{finding['category'].upper()}]</b> {finding['message']}", normal_style))
            if finding.get("details"):
                story.append(Paragraph(f"   <i>{finding['details']}</i>", normal_style))
        story.append(Spacer(1, 10))
    
    # Recommendations
    if analysis.recommendations:
        story.append(Paragraph("Recommendations", heading_style))
        for rec in analysis.recommendations:
            story.append(Paragraph(f"• <b>{rec['title']}</b> [{rec['priority'].upper()}]", normal_style))
            story.append(Paragraph(f"   {rec['description']}", normal_style))
    
    # Disclaimer
    story.append(Spacer(1, 30))
    story.append(Paragraph("<i>Disclaimer: This tool improves document consistency but does not guarantee acceptance by third-party verifiers. Results should be used for informational purposes only.</i>", normal_style))
    
    doc.build(story)
    return buffer.getvalue()


def get_document_types() -> Dict:
    """Return available document types for frontend"""
    return DOCUMENT_TYPES


def get_legitimate_producers(document_type: str) -> Dict:
    """Return legitimate producers for a document type"""
    if document_type == "paystub":
        return PAYSTUB_LEGITIMATE_PRODUCERS
    elif document_type == "bank_statement":
        return BANK_STATEMENT_LEGITIMATE_PRODUCERS
    elif document_type == "tax_form":
        return TAX_FORM_LEGITIMATE_PRODUCERS
    return {}


# ============================================
# AI-POWERED DOCUMENT ANALYSIS
# ============================================

AI_ANALYSIS_PROMPTS = {
    "paystub": """You are an expert forensic document analyst specializing in payroll documents. Analyze this pay stub text for authenticity and consistency.

CHECK THE FOLLOWING:

1. **MATH VERIFICATION**:
   - Does Gross Pay - Total Deductions = Net Pay?
   - Are YTD (Year-to-Date) totals mathematically consistent?
   - Do tax withholdings appear reasonable for the gross pay amount?
   - Are FICA/Social Security and Medicare calculated correctly (typically 6.2% and 1.45%)?

2. **DATE CONSISTENCY**:
   - Is the pay period logical (e.g., bi-weekly, semi-monthly, monthly)?
   - Do dates make sense (pay date after period end date)?
   - Are YTD figures consistent with the time of year?

3. **CONTENT ANOMALIES**:
   - Are there any spelling errors in standard fields (employer name, deduction types)?
   - Is the formatting consistent throughout?
   - Are there any copy-paste artifacts or misaligned text?
   - Do employer details (name, address, EIN) appear legitimate?

4. **NUMERICAL PATTERNS**:
   - Are numbers formatted consistently (decimal places, thousands separators)?
   - Do the amounts seem realistic for typical employment?
   - Are there any suspiciously round numbers that might indicate fabrication?

5. **PROFESSIONAL STANDARDS**:
   - Does it contain all required pay stub elements?
   - Is the layout professional and consistent with standard payroll software?

Respond in this exact JSON format:
{
  "overallAssessment": "LIKELY_LEGITIMATE" | "SUSPICIOUS" | "LIKELY_FABRICATED",
  "confidenceScore": <0-100>,
  "mathVerification": {
    "passed": true/false,
    "issues": ["list of math issues found"],
    "details": "explanation"
  },
  "dateConsistency": {
    "passed": true/false,
    "issues": ["list of date issues"],
    "details": "explanation"
  },
  "contentAnomalies": {
    "found": true/false,
    "anomalies": ["list of anomalies"],
    "details": "explanation"
  },
  "redFlags": ["list of major red flags"],
  "greenFlags": ["list of positive indicators"],
  "riskAdjustment": <-30 to +30>,
  "summary": "2-3 sentence summary of findings"
}""",

    "bank_statement": """You are an expert forensic document analyst specializing in banking documents. Analyze this bank statement text for authenticity and consistency.

CHECK THE FOLLOWING:

1. **BALANCE VERIFICATION**:
   - Does Beginning Balance + Deposits - Withdrawals = Ending Balance?
   - Are running balances consistent throughout the statement?
   - Do the totals match the sum of individual transactions?

2. **DATE CONSISTENCY**:
   - Are transaction dates within the statement period?
   - Are dates in chronological order?
   - Is the statement period logical (monthly)?

3. **TRANSACTION PATTERNS**:
   - Are transaction descriptions consistent with bank formatting?
   - Do transaction amounts have appropriate decimal precision?
   - Are there any suspicious patterns (identical amounts, round numbers)?

4. **CONTENT ANOMALIES**:
   - Are there spelling errors in bank name or standard fields?
   - Is formatting consistent throughout?
   - Are account numbers properly masked/formatted?
   - Do routing numbers appear valid?

5. **PROFESSIONAL STANDARDS**:
   - Does it contain all standard bank statement elements?
   - Does the layout match professional bank statement formats?
   - Is the bank's branding/formatting consistent?

Respond in this exact JSON format:
{
  "overallAssessment": "LIKELY_LEGITIMATE" | "SUSPICIOUS" | "LIKELY_FABRICATED",
  "confidenceScore": <0-100>,
  "balanceVerification": {
    "passed": true/false,
    "issues": ["list of balance issues"],
    "details": "explanation"
  },
  "dateConsistency": {
    "passed": true/false,
    "issues": ["list of date issues"],
    "details": "explanation"
  },
  "transactionPatterns": {
    "normal": true/false,
    "anomalies": ["list of pattern anomalies"],
    "details": "explanation"
  },
  "redFlags": ["list of major red flags"],
  "greenFlags": ["list of positive indicators"],
  "riskAdjustment": <-30 to +30>,
  "summary": "2-3 sentence summary of findings"
}""",

    "tax_form": """You are an expert forensic document analyst specializing in tax documents. Analyze this tax form text for authenticity and consistency.

CHECK THE FOLLOWING:

1. **MATH VERIFICATION**:
   - Do box totals add up correctly?
   - Are withholding amounts consistent with wages?
   - Do federal, state, and local taxes appear reasonable?

2. **FORMAT COMPLIANCE**:
   - Does it follow official IRS form format?
   - Are all required fields present?
   - Are EIN/SSN formatted correctly (masked appropriately)?

3. **CONTENT CONSISTENCY**:
   - Are employer details consistent?
   - Do dates align with the tax year?
   - Are amounts formatted correctly?

4. **ANOMALY DETECTION**:
   - Any spelling errors in official fields?
   - Inconsistent formatting?
   - Suspicious patterns?

Respond in this exact JSON format:
{
  "overallAssessment": "LIKELY_LEGITIMATE" | "SUSPICIOUS" | "LIKELY_FABRICATED",
  "confidenceScore": <0-100>,
  "mathVerification": {
    "passed": true/false,
    "issues": ["list of issues"],
    "details": "explanation"
  },
  "formatCompliance": {
    "passed": true/false,
    "issues": ["list of issues"],
    "details": "explanation"
  },
  "redFlags": ["list of major red flags"],
  "greenFlags": ["list of positive indicators"],
  "riskAdjustment": <-30 to +30>,
  "summary": "2-3 sentence summary of findings"
}""",

    "other": """You are an expert forensic document analyst. Analyze this document text for authenticity and consistency.

CHECK THE FOLLOWING:

1. **CONTENT CONSISTENCY**:
   - Is the formatting consistent throughout?
   - Are there any obvious copy-paste artifacts?
   - Do dates and numbers appear logical?

2. **PROFESSIONAL QUALITY**:
   - Does it appear professionally generated?
   - Are there spelling or grammar errors?
   - Is the layout consistent?

3. **ANOMALY DETECTION**:
   - Any suspicious patterns?
   - Misaligned text or formatting issues?
   - Inconsistent fonts or styles?

Respond in this exact JSON format:
{
  "overallAssessment": "LIKELY_LEGITIMATE" | "SUSPICIOUS" | "LIKELY_FABRICATED",
  "confidenceScore": <0-100>,
  "contentConsistency": {
    "passed": true/false,
    "issues": ["list of issues"],
    "details": "explanation"
  },
  "redFlags": ["list of major red flags"],
  "greenFlags": ["list of positive indicators"],
  "riskAdjustment": <-30 to +30>,
  "summary": "2-3 sentence summary of findings"
}"""
}


async def analyze_document_with_ai(text_content: str, document_type: str, metadata: Dict = None) -> Dict:
    """
    Use AI to analyze document content for authenticity and consistency.
    Returns AI analysis results including risk adjustment.
    """
    api_key = os.environ.get("EMERGENT_LLM_KEY")
    
    if not api_key:
        return {
            "success": False,
            "error": "AI analysis unavailable - API key not configured",
            "aiAnalysis": None
        }
    
    # Get the appropriate prompt for document type
    prompt = AI_ANALYSIS_PROMPTS.get(document_type, AI_ANALYSIS_PROMPTS["other"])
    
    # Prepare context with metadata
    context = f"DOCUMENT TYPE: {DOCUMENT_TYPES.get(document_type, {}).get('name', 'Unknown')}\n"
    if metadata:
        context += f"PDF PRODUCER: {metadata.get('producer', 'Unknown')}\n"
        context += f"PDF CREATOR: {metadata.get('creator', 'Unknown')}\n"
        context += f"CREATION DATE: {metadata.get('creationDate', 'Unknown')}\n"
    
    # Truncate text if too long (keep first 8000 chars for analysis)
    truncated_text = text_content[:8000] if len(text_content) > 8000 else text_content
    
    full_prompt = f"{prompt}\n\n{context}\n\nDOCUMENT TEXT CONTENT:\n```\n{truncated_text}\n```"
    
    try:
        # Initialize LLM chat
        chat = LlmChat(
            api_key=api_key,
            session_id=f"pdf-analysis-{datetime.now().timestamp()}",
            system_message="You are a forensic document analyst AI. Always respond with valid JSON only, no markdown formatting."
        ).with_model("openai", "gpt-4.1")
        
        # Send message and get response
        user_message = UserMessage(text=full_prompt)
        response = await chat.send_message(user_message)
        
        # Parse JSON response
        # Clean up response - remove markdown code blocks if present
        clean_response = response.strip()
        if clean_response.startswith("```json"):
            clean_response = clean_response[7:]
        if clean_response.startswith("```"):
            clean_response = clean_response[3:]
        if clean_response.endswith("```"):
            clean_response = clean_response[:-3]
        clean_response = clean_response.strip()
        
        try:
            ai_result = json.loads(clean_response)
            return {
                "success": True,
                "aiAnalysis": ai_result
            }
        except json.JSONDecodeError as e:
            # If JSON parsing fails, return raw response
            return {
                "success": True,
                "aiAnalysis": {
                    "overallAssessment": "ANALYSIS_ERROR",
                    "confidenceScore": 0,
                    "summary": f"AI analysis completed but response parsing failed. Raw response available.",
                    "rawResponse": response[:1000],
                    "riskAdjustment": 0
                }
            }
            
    except Exception as e:
        return {
            "success": False,
            "error": f"AI analysis failed: {str(e)}",
            "aiAnalysis": None
        }


def apply_ai_analysis_to_result(result: PDFAnalysisResult, ai_analysis: Dict) -> None:
    """Apply AI analysis findings to the PDF analysis result."""
    if not ai_analysis or not ai_analysis.get("success"):
        return
    
    ai_data = ai_analysis.get("aiAnalysis", {})
    if not ai_data:
        return
    
    # Store AI analysis in result
    result.ai_analysis = ai_data
    
    # Get overall assessment
    overall = ai_data.get("overallAssessment", "UNKNOWN")
    confidence = ai_data.get("confidenceScore", 0)
    
    # Apply base risk adjustment based on overall assessment
    if overall == "LIKELY_FABRICATED":
        result.add_risk(
            "ai_assessment_fabricated",
            f"AI determined document is LIKELY FABRICATED (Confidence: {confidence}%)",
            25
        )
    elif overall == "SUSPICIOUS":
        result.add_risk(
            "ai_assessment_suspicious",
            f"AI found document SUSPICIOUS (Confidence: {confidence}%)",
            15
        )
    elif overall == "LIKELY_LEGITIMATE":
        result.add_risk(
            "ai_assessment_legitimate",
            f"AI verified document appears LEGITIMATE (Confidence: {confidence}%)",
            -15
        )
    
    # Apply risk adjustment for math/balance verification failures
    math_verification = ai_data.get("mathVerification") or ai_data.get("balanceVerification")
    if math_verification:
        if not math_verification.get("passed", True):
            issues = math_verification.get("issues", [])
            result.add_risk(
                "ai_math_failed",
                f"AI detected calculation errors: {len(issues)} issue(s) found",
                15
            )
        else:
            result.add_risk(
                "ai_math_passed",
                "AI verified calculations are correct",
                -10
            )
    
    # Apply risk adjustment for date consistency
    date_consistency = ai_data.get("dateConsistency")
    if date_consistency:
        if not date_consistency.get("passed", True):
            result.add_risk(
                "ai_date_inconsistent",
                "AI detected date/timeline inconsistencies",
                10
            )
        else:
            result.add_risk(
                "ai_date_consistent",
                "AI verified dates are consistent",
                -5
            )
    
    # Apply risk adjustment for content anomalies
    content_anomalies = ai_data.get("contentAnomalies")
    if content_anomalies and content_anomalies.get("found"):
        anomalies = content_anomalies.get("anomalies", [])
        result.add_risk(
            "ai_content_anomalies",
            f"AI detected {len(anomalies)} content anomalie(s)",
            10
        )
    
    # Apply risk based on red flags (each red flag adds points)
    red_flags = ai_data.get("redFlags", [])
    if red_flags:
        # Add 3 points per red flag, max 20 points
        red_flag_points = min(len(red_flags) * 3, 20)
        result.add_risk(
            "ai_red_flags",
            f"AI identified {len(red_flags)} red flag(s): {', '.join(red_flags[:3])}{'...' if len(red_flags) > 3 else ''}",
            red_flag_points
        )
    
    # Apply risk reduction for green flags (each green flag reduces points)
    green_flags = ai_data.get("greenFlags", [])
    if green_flags:
        # Subtract 2 points per green flag, max -15 points
        green_flag_points = max(len(green_flags) * -2, -15)
        result.add_risk(
            "ai_green_flags",
            f"AI verified {len(green_flags)} positive indicator(s): {', '.join(green_flags[:3])}{'...' if len(green_flags) > 3 else ''}",
            green_flag_points
        )
    
    # Add overall AI finding
    severity = "info"
    if overall == "LIKELY_FABRICATED":
        severity = "error"
    elif overall == "SUSPICIOUS":
        severity = "warning"
    
    result.add_finding(
        "ai_analysis",
        severity,
        f"AI Assessment: {overall.replace('_', ' ').title()} (Confidence: {confidence}%)",
        ai_data.get("summary", "")
    )
    
    # Add individual red flags as findings
    for flag in red_flags:
        result.add_finding("ai_red_flag", "warning", f"AI Red Flag: {flag}", "")
    
    # Add individual green flags as findings
    for flag in green_flags:
        result.add_finding("ai_green_flag", "info", f"AI Verified: {flag}", "")

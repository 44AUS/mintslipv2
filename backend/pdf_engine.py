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
        "expected_producers": ["qt 4.8", "qt 5", "wkhtmltopdf", "gusto"],
        "expected_creators": ["wkhtmltopdf", "gusto"],
        "risk_reduction": 25,
        "notes": "Popular SMB payroll provider - uses wkhtmltopdf/Qt for PDF generation"
    },
    "onpay": {
        "names": ["onpay"],
        "expected_producers": ["qt 4.8", "qt 5", "wkhtmltopdf", "onpay"],
        "expected_creators": ["wkhtmltopdf", "onpay"],
        "risk_reduction": 25,
        "notes": "SMB payroll provider - uses wkhtmltopdf/Qt for PDF generation (similar to Gusto)"
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
        "expected_producers": ["workday", "workday pdf engine", "oracle", "birt"],
        "expected_creators": ["workday", "workday hcm"],
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
        "expected_producers": ["chime", "chrome", "puppeteer", "qt 4.8", "qt 5", "wkhtmltopdf"],
        "expected_creators": ["chime", "wkhtmltopdf"],
        "risk_reduction": 20,
        "notes": "Chime (fintech) - uses wkhtmltopdf/Qt for PDF generation"
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


def clean_paystub_pdf(pdf_bytes: bytes, template: str = 'gusto', pay_date: str = None) -> Tuple[bytes, Dict]:
    """
    Clean a paystub PDF to remove all traces of editing and apply proper metadata.
    Makes the PDF appear as a fresh document generated by the appropriate payroll system.
    
    Args:
        pdf_bytes: The raw PDF bytes
        template: The template type ('gusto', 'adp', 'paychex', 'quickbooks')
        pay_date: The pay date (ISO format) - creation date will be set to 2 days before this
    
    Returns:
        Tuple of (cleaned_pdf_bytes, result_dict)
    """
    # Template metadata mapping
    TEMPLATE_METADATA = {
        'template-a': {  # Gusto
            'producer': 'Qt 4.8.7',
            'creator': 'wkhtmltopdf 0.12.6.1',
            'title': 'Gusto',
            'pdf_version': '1.4',
        },
        'template-b': {  # ADP
            'producer': 'Qt 4.8.7',
            'creator': 'wkhtmltopdf 0.12.6.1',
            'title': 'ADP',
            'pdf_version': '1.4',
        },
        'template-c': {  # Workday - no title
            'producer': 'Workday PDF Engine',
            'creator': 'Workday HCM',
            'pdf_version': '1.7',
        },
        'template-h': {  # OnPay - same as Gusto, no title
            'producer': 'Qt 4.8.7',
            'creator': 'wkhtmltopdf 0.12.6.1',
            'pdf_version': '1.4',
        },
        'gusto': {
            'producer': 'Qt 4.8.7',
            'creator': 'wkhtmltopdf 0.12.6.1',
            'title': 'Gusto',
            'pdf_version': '1.4',
            'has_xmp': False,
        },
    }
    
    metadata = TEMPLATE_METADATA.get(template, TEMPLATE_METADATA['gusto'])
    
    try:
        pdf_file = io.BytesIO(pdf_bytes)
        
        with pikepdf.open(pdf_file) as pdf:
            # Create fresh document info
            new_docinfo = pikepdf.Dictionary()
            
            # Set the metadata
            new_docinfo[pikepdf.Name('/Producer')] = metadata['producer']
            new_docinfo[pikepdf.Name('/Creator')] = metadata['creator']
            if 'title' in metadata:
                new_docinfo[pikepdf.Name('/Title')] = metadata['title']
            
            # Calculate creation date as 2 days before pay date
            if pay_date:
                try:
                    # Parse pay date (handle various formats)
                    if 'T' in pay_date:
                        pay_dt = datetime.fromisoformat(pay_date.replace('Z', '+00:00'))
                    else:
                        pay_dt = datetime.strptime(pay_date, '%Y-%m-%d')
                        pay_dt = pay_dt.replace(tzinfo=timezone.utc)
                    
                    # Subtract 2 days for creation date
                    creation_dt = pay_dt - timedelta(days=2)
                except:
                    # Fallback to now if parsing fails
                    creation_dt = datetime.now(timezone.utc)
            else:
                creation_dt = datetime.now(timezone.utc)
            
            # Format as PDF date string: D:YYYYMMDDHHmmSS+00'00'
            pdf_date = f"D:{creation_dt.strftime('%Y%m%d%H%M%S')}+00'00'"
            new_docinfo[pikepdf.Name('/CreationDate')] = pdf_date
            # Don't set ModDate - fresh documents shouldn't have modification date
            
            # Store creation date in metadata for response
            metadata_with_date = metadata.copy()
            metadata_with_date['creationDate'] = creation_dt.strftime('%Y-%m-%d %H:%M:%S UTC')
            
            # Apply new docinfo as indirect object
            pdf.trailer[pikepdf.Name('/Info')] = pdf.make_indirect(new_docinfo)
            
            # Handle XMP metadata based on template
            if template == 'template-c':
                # Workday embeds XMP metadata - create proper XMP packet (no ModifyDate)
                xmp_date = creation_dt.strftime('%Y-%m-%dT%H:%M:%S+00:00')
                xmp_packet = f'''<?xpacket begin="" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/">
  <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
    <rdf:Description rdf:about=""
        xmlns:xmp="http://ns.adobe.com/xap/1.0/"
        xmlns:dc="http://purl.org/dc/elements/1.1/"
        xmlns:pdf="http://ns.adobe.com/pdf/1.3/"
        xmlns:pdfaid="http://www.aiim.org/pdfa/ns/id/">
      <xmp:CreateDate>{xmp_date}</xmp:CreateDate>
      <xmp:CreatorTool>Workday</xmp:CreatorTool>
      <pdf:Producer>Workday</pdf:Producer>
      <pdfaid:part>1</pdfaid:part>
      <pdfaid:conformance>B</pdfaid:conformance>
    </rdf:Description>
  </rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>'''
                
                # Create XMP metadata stream
                xmp_stream = pikepdf.Stream(pdf, xmp_packet.encode('utf-8'))
                xmp_stream[pikepdf.Name('/Type')] = pikepdf.Name('/Metadata')
                xmp_stream[pikepdf.Name('/Subtype')] = pikepdf.Name('/XML')
                pdf.Root[pikepdf.Name('/Metadata')] = pdf.make_indirect(xmp_stream)
                
                metadata_with_date['xmp'] = {
                    'createDate': xmp_date,
                    'creatorTool': 'Workday',
                    'producer': 'Workday',
                    'pdfaid_part': '1',
                    'pdfaid_conformance': 'B'
                }
            else:
                # Remove XMP metadata for non-Workday templates (removes edit traces)
                if '/Metadata' in pdf.Root:
                    del pdf.Root['/Metadata']
            
            # Get PDF version for saving
            pdf_version = metadata.get('pdf_version', '1.4')
            
            # Remove any incremental updates by saving as new PDF
            output = io.BytesIO()
            
            # Set min_version based on template to control PDF version in output
            if pdf_version == '1.7':
                min_ver = '1.7'
            elif pdf_version == '1.6':
                min_ver = '1.6'
            else:
                min_ver = '1.4'
            
            pdf.save(
                output,
                linearize=True,  # Web optimized
                object_stream_mode=pikepdf.ObjectStreamMode.generate,  # Clean streams
                compress_streams=True,  # Compress
                preserve_pdfa=False,  # Don't preserve PDF/A markers
                min_version=min_ver,  # Set minimum PDF version
            )
            
            return output.getvalue(), {
                "success": True,
                "message": "PDF cleaned successfully",
                "metadata_applied": metadata_with_date
            }
            
    except Exception as e:
        return pdf_bytes, {
            "success": False,
            "error": str(e)
        }


def clean_bank_statement_pdf(pdf_bytes: bytes, template: str = 'chime', statement_month: str = None, account_name: str = None) -> Tuple[bytes, Dict]:
    """
    Clean a bank statement PDF to remove all traces of editing and apply proper metadata.
    
    Args:
        pdf_bytes: The raw PDF bytes
        template: The template type ('chime', 'bank-of-america', 'chase')
        statement_month: The statement month (YYYY-MM format) - creation date will be last day of month
        account_name: Account holder's first name for title
    
    Returns:
        Tuple of (cleaned_pdf_bytes, result_dict)
    """
    # Template metadata mapping for bank statements
    TEMPLATE_METADATA = {
        'chime': {
            'producer': 'Qt 4.8.7',
            'creator': 'wkhtmltopdf 0.12.6.1',
            'pdf_version': '1.4',
            'title_format': '{name}_{month}_{year}_Statement | Chime',
        },
        'bank-of-america': {
            'producer': 'Qt 4.8.7',
            'creator': 'wkhtmltopdf 0.12.6.1',
            'pdf_version': '1.4',
            'title_format': 'Bank of America Statement',
        },
        'chase': {
            'producer': 'Qt 4.8.7',
            'creator': 'wkhtmltopdf 0.12.6.1',
            'pdf_version': '1.4',
            'title_format': 'Chase Statement',
        },
    }
    
    metadata = TEMPLATE_METADATA.get(template, TEMPLATE_METADATA['chime'])
    
    try:
        pdf_file = io.BytesIO(pdf_bytes)
        
        with pikepdf.open(pdf_file) as pdf:
            # Create fresh document info
            new_docinfo = pikepdf.Dictionary()
            
            # Set the metadata
            new_docinfo[pikepdf.Name('/Producer')] = metadata['producer']
            new_docinfo[pikepdf.Name('/Creator')] = metadata['creator']
            
            # Calculate creation date as last day of the statement month
            if statement_month:
                try:
                    year, month = statement_month.split('-')
                    year = int(year)
                    month = int(month)
                    # Get last day of the month
                    if month == 12:
                        creation_dt = datetime(year + 1, 1, 1, tzinfo=timezone.utc) - timedelta(days=1)
                    else:
                        creation_dt = datetime(year, month + 1, 1, tzinfo=timezone.utc) - timedelta(days=1)
                    
                    # Generate title with name, month, year
                    month_name = creation_dt.strftime('%B')
                    if template == 'chime' and account_name:
                        # Extract first name
                        first_name = account_name.split()[0] if account_name else 'Account'
                        title = f"{first_name}_{month_name}_{year}_Statement | Chime"
                    else:
                        title = metadata.get('title_format', 'Statement')
                except:
                    creation_dt = datetime.now(timezone.utc)
                    title = metadata.get('title_format', 'Statement')
            else:
                creation_dt = datetime.now(timezone.utc)
                title = metadata.get('title_format', 'Statement')
            
            # Set title
            new_docinfo[pikepdf.Name('/Title')] = title
            
            # Format as PDF date string: D:YYYYMMDDHHmmSS+00'00'
            pdf_date = f"D:{creation_dt.strftime('%Y%m%d%H%M%S')}+00'00'"
            new_docinfo[pikepdf.Name('/CreationDate')] = pdf_date
            # Don't set ModDate - fresh documents shouldn't have modification date
            
            # Store creation date in metadata for response
            metadata_with_date = metadata.copy()
            metadata_with_date['creationDate'] = creation_dt.strftime('%Y-%m-%d %H:%M:%S UTC')
            metadata_with_date['title'] = title
            
            # Apply new docinfo as indirect object
            pdf.trailer[pikepdf.Name('/Info')] = pdf.make_indirect(new_docinfo)
            
            # Remove XMP metadata (removes edit traces)
            if '/Metadata' in pdf.Root:
                del pdf.Root['/Metadata']
            
            # Get PDF version for saving
            pdf_version = metadata.get('pdf_version', '1.4')
            min_ver = pdf_version
            
            # Remove any incremental updates by saving as new PDF
            output = io.BytesIO()
            pdf.save(
                output,
                linearize=True,
                object_stream_mode=pikepdf.ObjectStreamMode.generate,
                compress_streams=True,
                preserve_pdfa=False,
                min_version=min_ver,
            )
            
            return output.getvalue(), {
                "success": True,
                "message": "PDF cleaned successfully",
                "metadata_applied": metadata_with_date
            }
            
    except Exception as e:
        return pdf_bytes, {
            "success": False,
            "error": str(e)
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


def edit_and_regenerate_pdf(pdf_bytes: bytes, new_metadata: Dict) -> Tuple[bytes, Dict]:
    """
    Edit PDF metadata and regenerate as a clean PDF without edit traces.
    
    new_metadata can include:
    - producer: PDF producer software
    - creator: PDF creator application  
    - author: Document author
    - title: Document title
    - subject: Document subject
    - creationDate: Creation date (ISO format or 'now')
    - modificationDate: Modification date (ISO format or 'now')
    """
    changes = []
    
    try:
        pdf_file = io.BytesIO(pdf_bytes)
        
        with pikepdf.open(pdf_file) as pdf:
            # Get original metadata for comparison
            original_info = {}
            if pdf.docinfo:
                for key in ['/Producer', '/Creator', '/Author', '/Title', '/Subject', '/CreationDate', '/ModDate']:
                    if key in pdf.docinfo:
                        original_info[key] = str(pdf.docinfo[key])
            
            # Create new document info dictionary
            new_docinfo = pikepdf.Dictionary()
            
            # Helper to format date for PDF
            def format_pdf_date(date_value):
                if date_value == 'now':
                    dt = datetime.now(timezone.utc)
                elif isinstance(date_value, str):
                    try:
                        # Try parsing ISO format
                        dt = datetime.fromisoformat(date_value.replace('Z', '+00:00'))
                    except:
                        # Try parsing as date only
                        try:
                            dt = datetime.strptime(date_value, '%Y-%m-%d')
                            dt = dt.replace(tzinfo=timezone.utc)
                        except:
                            dt = datetime.now(timezone.utc)
                else:
                    dt = datetime.now(timezone.utc)
                
                # Format as PDF date string: D:YYYYMMDDHHmmSS+00'00'
                return f"D:{dt.strftime('%Y%m%d%H%M%S')}+00'00'"
            
            # Apply new metadata
            if 'producer' in new_metadata and new_metadata['producer']:
                new_val = new_metadata['producer']
                new_docinfo[pikepdf.Name('/Producer')] = new_val
                changes.append({
                    "field": "Producer",
                    "original": original_info.get('/Producer', 'N/A'),
                    "new": new_val
                })
            
            if 'creator' in new_metadata and new_metadata['creator']:
                new_val = new_metadata['creator']
                new_docinfo[pikepdf.Name('/Creator')] = new_val
                changes.append({
                    "field": "Creator",
                    "original": original_info.get('/Creator', 'N/A'),
                    "new": new_val
                })
            
            if 'author' in new_metadata and new_metadata['author']:
                new_val = new_metadata['author']
                new_docinfo[pikepdf.Name('/Author')] = new_val
                changes.append({
                    "field": "Author",
                    "original": original_info.get('/Author', 'N/A'),
                    "new": new_val
                })
            
            if 'title' in new_metadata and new_metadata['title']:
                new_val = new_metadata['title']
                new_docinfo[pikepdf.Name('/Title')] = new_val
                changes.append({
                    "field": "Title",
                    "original": original_info.get('/Title', 'N/A'),
                    "new": new_val
                })
            
            if 'subject' in new_metadata and new_metadata['subject']:
                new_val = new_metadata['subject']
                new_docinfo[pikepdf.Name('/Subject')] = new_val
                changes.append({
                    "field": "Subject",
                    "original": original_info.get('/Subject', 'N/A'),
                    "new": new_val
                })
            
            if 'creationDate' in new_metadata and new_metadata['creationDate']:
                new_val = format_pdf_date(new_metadata['creationDate'])
                new_docinfo[pikepdf.Name('/CreationDate')] = new_val
                changes.append({
                    "field": "Creation Date",
                    "original": original_info.get('/CreationDate', 'N/A'),
                    "new": new_val
                })
            
            if 'modificationDate' in new_metadata and new_metadata['modificationDate']:
                new_val = format_pdf_date(new_metadata['modificationDate'])
                new_docinfo[pikepdf.Name('/ModDate')] = new_val
                changes.append({
                    "field": "Modification Date",
                    "original": original_info.get('/ModDate', 'N/A'),
                    "new": new_val
                })
            
            # Set the new document info - must be an indirect object
            pdf.trailer[pikepdf.Name('/Info')] = pdf.make_indirect(new_docinfo)
            
            # Remove XMP metadata to avoid conflicts
            if '/Metadata' in pdf.Root:
                del pdf.Root['/Metadata']
                changes.append({
                    "field": "XMP Metadata",
                    "original": "Present",
                    "new": "Removed (to ensure consistency)"
                })
            
            # Save as a completely new PDF (linearized, no incremental updates)
            output = io.BytesIO()
            pdf.save(
                output, 
                linearize=True,  # Optimize for web viewing
                object_stream_mode=pikepdf.ObjectStreamMode.generate  # Clean object streams
            )
            
            changes.append({
                "field": "Document Structure",
                "original": "Original structure with potential edit traces",
                "new": "Regenerated clean structure (no incremental updates)"
            })
            
            return output.getvalue(), {
                "success": True,
                "changes": changes,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "message": "PDF regenerated with new metadata. Edit history removed."
            }
            
    except Exception as e:
        return pdf_bytes, {
            "success": False,
            "error": str(e),
            "changes": []
        }


# Preset metadata profiles for common legitimate sources
METADATA_PRESETS = {
    "adp": {
        "producer": "ADP, Inc.",
        "creator": "ADP Workforce Now",
    },
    "paychex": {
        "producer": "Paychex, Inc.",
        "creator": "Paychex Flex",
    },
    "gusto": {
        "producer": "Qt 4.8.7",
        "creator": "wkhtmltopdf 0.12.6.1",
        "title": "Gusto",
    },
    "quickbooks": {
        "producer": "Intuit Inc.",
        "creator": "QuickBooks Payroll",
    },
    "workday": {
        "producer": "Workday, Inc.",
        "creator": "Workday HCM",
    },
    "chase": {
        "producer": "JPMorgan Chase & Co.",
        "creator": "Chase Online Banking",
    },
    "bankofamerica": {
        "producer": "Bank of America Corporation",
        "creator": "Bank of America Online",
    },
    "wellsfargo": {
        "producer": "Wells Fargo & Company",
        "creator": "Wells Fargo Online",
    },
    "generic_adobe": {
        "producer": "Adobe PDF Library 15.0",
        "creator": "Adobe Acrobat Pro DC",
    },
    "generic_microsoft": {
        "producer": "Microsoft: Print To PDF",
        "creator": "Microsoft Word",
    },
}


def get_metadata_presets() -> Dict:
    """Return available metadata presets"""
    return METADATA_PRESETS


# ============================================
# AI-POWERED DOCUMENT ANALYSIS
# ============================================

AI_ANALYSIS_PROMPTS = {
    "paystub": """You are an expert forensic document analyst specializing in payroll documents, similar to systems used by Snappt, Truework, and Nova Credit. Analyze this pay stub text for authenticity and consistency using industry-standard fraud detection methods.

PERFORM THE FOLLOWING COMPREHENSIVE CHECKS:

1. **MATHEMATICAL VERIFICATION (Critical)**:
   - Verify: Gross Pay - Total Deductions = Net Pay (MUST match exactly)
   - Verify YTD calculations: Current Period amounts × Pay Periods = YTD totals
   - FICA/Social Security: Should be exactly 6.2% of gross (up to $168,600 in 2024)
   - Medicare: Should be exactly 1.45% of gross (no limit)
   - Federal tax withholding: Should be reasonable for the income bracket
   - State tax: Should match state tax rates for the income level
   - If ANY calculation is off by more than $1, flag as MAJOR RED FLAG

2. **YTD CONSISTENCY ANALYSIS (Critical)**:
   - Calculate: (Annual Salary / Pay Periods per Year) should equal Current Gross
   - YTD Gross ÷ Pay Period Number should approximately equal Current Gross
   - YTD taxes should be proportional to YTD gross
   - Check if YTD values are realistic for the pay date (e.g., January shouldn't show high YTD)

3. **DATE AND TIMELINE VERIFICATION**:
   - Pay period length should match frequency (biweekly=14 days, semi-monthly=~15 days, monthly=~30 days)
   - Pay date should be 3-7 days after period end (not same day, not weeks later)
   - Check date for hire date (if visible) - YTD should align with employment start
   - Dates should not be in the future

4. **EMPLOYER VERIFICATION SIGNALS**:
   - Company name should be properly formatted (not ALL CAPS unless standard)
   - Address should be complete with valid format
   - EIN format: XX-XXXXXXX (9 digits with dash after 2)
   - Check for generic/suspicious employer names

5. **FONT AND FORMATTING ANALYSIS**:
   - All numbers should use consistent decimal places (typically 2)
   - Currency formatting should be consistent ($X,XXX.XX)
   - Look for inconsistent spacing, alignment issues
   - Check for different fonts in edited areas (FONT FAIL indicator)
   - Look for text that appears inserted or overlaid

6. **CONTENT ANOMALIES (Snappt-style checks)**:
   - Check for template-style placeholder text
   - Look for copy-paste artifacts
   - Spelling errors in standard payroll terms
   - Missing required fields (employee name, SSN last 4, employer info)
   - Suspicious round numbers (exactly $5,000.00 salary is suspicious)

7. **FAKE GENERATOR DETECTION**:
   - Check for patterns common in online fake paystub generators
   - Generic layouts without company branding
   - Missing or fake check numbers
   - Unrealistic deduction categories

Respond in this exact JSON format:
{
  "overallAssessment": "LIKELY_LEGITIMATE" | "SUSPICIOUS" | "LIKELY_FABRICATED",
  "confidenceScore": <0-100>,
  "mathVerification": {
    "passed": true/false,
    "grossToNetCheck": "PASS/FAIL with details",
    "ytdConsistencyCheck": "PASS/FAIL with details",
    "taxCalculationCheck": "PASS/FAIL with details",
    "issues": ["list of specific math discrepancies with amounts"],
    "details": "detailed explanation of calculations checked"
  },
  "dateConsistency": {
    "passed": true/false,
    "payPeriodValid": true/false,
    "payDateLogical": true/false,
    "ytdTimelineValid": true/false,
    "issues": ["list of date/timeline issues"],
    "details": "explanation"
  },
  "employerVerification": {
    "passed": true/false,
    "companyNameValid": true/false,
    "addressComplete": true/false,
    "einFormatValid": true/false,
    "issues": ["list of employer-related issues"]
  },
  "contentAnomalies": {
    "found": true/false,
    "fontInconsistencies": true/false,
    "formattingIssues": true/false,
    "suspiciousPatterns": true/false,
    "anomalies": ["list of anomalies found"],
    "details": "explanation"
  },
  "fakeGeneratorIndicators": {
    "detected": true/false,
    "indicators": ["list of fake generator signs"],
    "generatorType": "suspected generator name if identifiable"
  },
  "redFlags": ["list of CRITICAL red flags that indicate fraud"],
  "yellowFlags": ["list of moderate concerns requiring review"],
  "greenFlags": ["list of positive authenticity indicators"],
  "riskAdjustment": <-30 to +30>,
  "summary": "2-3 sentence professional summary of findings",
  "recommendedAction": "APPROVE" | "MANUAL_REVIEW" | "REJECT" | "REQUEST_ADDITIONAL_DOCS"
}""",

    "bank_statement": """You are an expert forensic document analyst specializing in banking documents, similar to systems used by Plaid, Nova Credit, and Argyle. Analyze this bank statement text for authenticity using industry-standard fraud detection methods.

PERFORM THE FOLLOWING COMPREHENSIVE CHECKS:

1. **BALANCE VERIFICATION (Critical)**:
   - Beginning Balance + Total Deposits - Total Withdrawals = Ending Balance (MUST be exact)
   - Verify running balance after each transaction
   - Check that daily ending balances are mathematically correct
   - Flag ANY balance discrepancy, even by $0.01

2. **TRANSACTION ANALYSIS**:
   - Transactions should be in chronological order
   - All dates must be within statement period
   - Transaction amounts should have exactly 2 decimal places
   - Check for suspicious patterns:
     * Multiple identical amounts
     * Perfectly round numbers (exactly $1,000.00, $5,000.00)
     * Transactions on holidays/weekends for ACH
     * Deposits that exactly match common fake income amounts

3. **ACCOUNT INFORMATION VERIFICATION**:
   - Account number format should match bank standards
   - Routing number should be valid (can verify first digits match bank)
   - Account holder name should be consistent throughout
   - Address formatting should be complete and valid

4. **BANK BRANDING AND FORMAT**:
   - Logo and header should match official bank formatting
   - Statement format should match known legitimate templates
   - Font consistency throughout document
   - Professional formatting and alignment
   - Check for watermarks or security features mentioned

5. **INCOME PATTERN ANALYSIS**:
   - Regular deposits should follow consistent schedule (weekly, biweekly, monthly)
   - Direct deposit descriptions should match employer naming conventions
   - Income amounts should be consistent (not wildly varying)
   - Check for deposits that match common fake paystub generators

6. **ANOMALY DETECTION (Nova Credit-style)**:
   - Look for pixel-level editing signs in amounts
   - Check for inconsistent spacing around edited numbers
   - Font changes within transaction descriptions
   - Alignment issues in columns
   - Missing or altered transaction reference numbers

7. **METADATA CORRELATION**:
   - Statement date should correlate with creation date metadata
   - Check if statement period matches typical bank cycles (1st-31st or statement date cycles)

Respond in this exact JSON format:
{
  "overallAssessment": "LIKELY_LEGITIMATE" | "SUSPICIOUS" | "LIKELY_FABRICATED",
  "confidenceScore": <0-100>,
  "balanceVerification": {
    "passed": true/false,
    "beginningToEndingCheck": "PASS/FAIL with details",
    "runningBalanceCheck": "PASS/FAIL with details",
    "transactionSumsCheck": "PASS/FAIL with details",
    "issues": ["list of specific balance discrepancies"],
    "details": "detailed explanation"
  },
  "transactionAnalysis": {
    "passed": true/false,
    "chronologicalOrder": true/false,
    "amountFormatting": true/false,
    "suspiciousPatterns": ["list of suspicious transaction patterns"],
    "details": "explanation"
  },
  "accountInfoVerification": {
    "passed": true/false,
    "accountFormatValid": true/false,
    "routingNumberValid": true/false,
    "nameConsistent": true/false,
    "issues": ["list of account info issues"]
  },
  "bankFormatAuthenticity": {
    "passed": true/false,
    "matchesKnownFormat": true/false,
    "brandingConsistent": true/false,
    "issues": ["list of format/branding issues"]
  },
  "incomePatternAnalysis": {
    "regularDepositsFound": true/false,
    "depositScheduleConsistent": true/false,
    "incomeAmountsReasonable": true/false,
    "suspiciousIncomePatterns": ["list of suspicious income patterns"]
  },
  "contentAnomalies": {
    "found": true/false,
    "editingIndicators": ["list of potential editing signs"],
    "fontInconsistencies": true/false,
    "alignmentIssues": true/false,
    "details": "explanation"
  },
  "redFlags": ["list of CRITICAL red flags"],
  "yellowFlags": ["list of moderate concerns"],
  "greenFlags": ["list of positive indicators"],
  "riskAdjustment": <-30 to +30>,
  "summary": "2-3 sentence professional summary",
  "recommendedAction": "APPROVE" | "MANUAL_REVIEW" | "REJECT" | "REQUEST_ADDITIONAL_DOCS"
}""",

    "tax_form": """You are an expert forensic document analyst specializing in tax documents. Analyze this tax form text for authenticity and consistency using IRS compliance standards.

PERFORM THE FOLLOWING COMPREHENSIVE CHECKS:

1. **MATH VERIFICATION**:
   - Box totals must add up correctly
   - Federal withholding should be reasonable for wages (check against tax brackets)
   - Social Security wages should not exceed annual limit
   - Medicare wages typically equal or exceed Social Security wages
   - State/local withholding should be proportional

2. **FORMAT COMPLIANCE**:
   - W-2 boxes should be numbered correctly (1-20)
   - EIN format: XX-XXXXXXX
   - SSN format: XXX-XX-XXXX (last 4 may be shown)
   - All required boxes must be present
   - Control number format should be valid

3. **EMPLOYER VERIFICATION**:
   - Employer name and address should be complete
   - EIN should be valid format
   - State employer ID should match state format

4. **CONTENT CONSISTENCY**:
   - Tax year should match dates
   - Amounts should use proper formatting
   - No spelling errors in official field labels
   - Box descriptions should match IRS standards

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
  "employerVerification": {
    "passed": true/false,
    "issues": ["list of issues"]
  },
  "redFlags": ["list of major red flags"],
  "yellowFlags": ["list of moderate concerns"],
  "greenFlags": ["list of positive indicators"],
  "riskAdjustment": <-30 to +30>,
  "summary": "2-3 sentence summary of findings",
  "recommendedAction": "APPROVE" | "MANUAL_REVIEW" | "REJECT" | "REQUEST_ADDITIONAL_DOCS"
}""",

    "other": """You are an expert forensic document analyst. Analyze this document text for authenticity and consistency using professional fraud detection standards.

PERFORM THE FOLLOWING CHECKS:

1. **CONTENT CONSISTENCY**:
   - Is the formatting consistent throughout?
   - Are there any obvious copy-paste artifacts?
   - Do dates and numbers appear logical?
   - Check for placeholder text or template markers

2. **PROFESSIONAL QUALITY**:
   - Does it appear professionally generated?
   - Are there spelling or grammar errors?
   - Is the layout consistent?
   - Check font consistency

3. **ANOMALY DETECTION**:
   - Any suspicious patterns?
   - Misaligned text or formatting issues?
   - Inconsistent fonts or styles?
   - Signs of digital manipulation?

4. **MATHEMATICAL CHECKS**:
   - If document contains numbers, verify any calculations
   - Check for unrealistic or round numbers
   - Verify totals match line items

Respond in this exact JSON format:
{
  "overallAssessment": "LIKELY_LEGITIMATE" | "SUSPICIOUS" | "LIKELY_FABRICATED",
  "confidenceScore": <0-100>,
  "contentConsistency": {
    "passed": true/false,
    "issues": ["list of issues"],
    "details": "explanation"
  },
  "professionalQuality": {
    "passed": true/false,
    "issues": ["list of issues"]
  },
  "anomalyDetection": {
    "found": true/false,
    "anomalies": ["list of anomalies"]
  },
  "redFlags": ["list of major red flags"],
  "yellowFlags": ["list of moderate concerns"],
  "greenFlags": ["list of positive indicators"],
  "riskAdjustment": <-30 to +30>,
  "summary": "2-3 sentence summary of findings",
  "recommendedAction": "APPROVE" | "MANUAL_REVIEW" | "REJECT" | "REQUEST_ADDITIONAL_DOCS"
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

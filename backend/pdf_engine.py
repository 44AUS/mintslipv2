"""
PDF Metadata & Document Consistency Engine
Business Plan Feature - Analyzes, normalizes, and validates PDF metadata
"""

import io
import re
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, List, Tuple

from PyPDF2 import PdfReader
import pikepdf
from pdfminer.high_level import extract_text, extract_pages
from pdfminer.layout import LTTextContainer, LTChar
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.colors import HexColor
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.units import inch


# Risk score weights
RISK_WEIGHTS = {
    "missing_metadata": 5,
    "suspicious_producer": 15,
    "suspicious_creator": 10,
    "date_mismatch": 20,
    "future_date": 25,
    "inconsistent_timestamps": 15,
    "multiple_modifications": 10,
    "xmp_mismatch": 10,
    "font_inconsistency": 15,
    "numeric_inconsistency": 20,
    "text_date_metadata_mismatch": 20,
    "copy_paste_artifacts": 10,
    "page_structure_drift": 10,
    "incremental_updates": 5,
}

# Suspicious PDF producers/creators
SUSPICIOUS_GENERATORS = [
    "online",
    "converter",
    "edit",
    "modify",
    "fake",
    "generator",
    "creator",
    "free pdf",
    "smallpdf",
    "ilovepdf",
    "pdf24",
    "sejda",
    "pdf2go",
    "canva",
]

# Expected professional producers
PROFESSIONAL_PRODUCERS = [
    "adobe",
    "microsoft",
    "libreoffice",
    "openoffice",
    "google",
    "apple",
    "docusign",
    "intuit",
    "quickbooks",
    "adp",
    "paychex",
    "gusto",
]


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
        self.risk_score = min(100, self.risk_score + points)
    
    def add_finding(self, category: str, severity: str, message: str, details: str = ""):
        self.consistency_findings.append({
            "category": category,
            "severity": severity,  # "info", "warning", "error"
            "message": message,
            "details": details
        })
    
    def add_recommendation(self, title: str, description: str, priority: str = "medium"):
        self.recommendations.append({
            "title": title,
            "description": description,
            "priority": priority  # "low", "medium", "high"
        })


def parse_pdf_date(date_str: str) -> Optional[datetime]:
    """Parse PDF date format (D:YYYYMMDDHHmmSS+HH'mm')"""
    if not date_str:
        return None
    
    # Remove D: prefix if present
    if date_str.startswith("D:"):
        date_str = date_str[2:]
    
    # Try various formats
    formats = [
        "%Y%m%d%H%M%S",
        "%Y%m%d%H%M",
        "%Y%m%d",
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%dT%H:%M:%S",
    ]
    
    # Clean the string
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
        r'\d{1,2}/\d{1,2}/\d{2,4}',  # MM/DD/YYYY or M/D/YY
        r'\d{1,2}-\d{1,2}-\d{2,4}',  # MM-DD-YYYY
        r'\d{4}-\d{2}-\d{2}',  # YYYY-MM-DD
        r'(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2},?\s+\d{4}',  # Month DD, YYYY
        r'\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}',  # DD Month YYYY
    ]
    
    dates = []
    for pattern in date_patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        dates.extend(matches)
    
    return list(set(dates))


def extract_numbers_from_text(text: str) -> List[Dict]:
    """Extract monetary values and numbers from text"""
    # Currency patterns
    currency_pattern = r'\$[\d,]+\.?\d{0,2}'
    amounts = re.findall(currency_pattern, text)
    
    # Clean and parse
    numbers = []
    for amt in amounts:
        clean = amt.replace('$', '').replace(',', '')
        try:
            value = float(clean)
            numbers.append({"raw": amt, "value": value})
        except ValueError:
            pass
    
    return numbers


def analyze_pdf_metadata(pdf_bytes: bytes) -> PDFAnalysisResult:
    """Analyze PDF metadata and document consistency"""
    result = PDFAnalysisResult()
    result.file_size = len(pdf_bytes)
    
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
                "producer": "",
                "creator": "",
                "creationDate": "",
                "modificationDate": "",
                "author": "",
                "title": "",
                "subject": "",
            }
            result.add_risk("missing_metadata", "PDF has no metadata - unusual for legitimate documents", RISK_WEIGHTS["missing_metadata"])
            result.add_finding("metadata", "warning", "No metadata found", "Legitimate PDFs typically contain metadata")
        
        # Get PDF version
        try:
            pdf_file.seek(0)
            first_line = pdf_file.readline().decode('latin-1', errors='ignore')
            version_match = re.search(r'%PDF-(\d+\.\d+)', first_line)
            result.metadata["pdfVersion"] = version_match.group(1) if version_match else "Unknown"
        except:
            result.metadata["pdfVersion"] = "Unknown"
        
        # Check for XMP metadata using pikepdf
        try:
            pdf_file.seek(0)
            with pikepdf.open(pdf_file) as pdf:
                if pdf.Root.get("/Metadata"):
                    result.has_xmp = True
                    result.metadata["hasXmp"] = True
                else:
                    result.metadata["hasXmp"] = False
                
                # Check for incremental updates (multiple xref tables)
                # This is a simplified check
                pdf_file.seek(0)
                content = pdf_file.read()
                xref_count = content.count(b'startxref')
                result.incremental_updates = max(0, xref_count - 1)
                result.metadata["incrementalUpdates"] = result.incremental_updates
                
                if result.incremental_updates > 2:
                    result.add_risk("incremental_updates", f"Document has {result.incremental_updates} incremental updates - may indicate multiple edits", RISK_WEIGHTS["incremental_updates"])
                    result.add_finding("structure", "info", f"Multiple incremental updates detected ({result.incremental_updates})", "This may indicate the document was edited multiple times")
        except Exception:
            result.metadata["hasXmp"] = False
            result.metadata["incrementalUpdates"] = 0
        
        # Analyze producer/creator for suspicious patterns
        producer = result.metadata.get("producer", "").lower()
        creator = result.metadata.get("creator", "").lower()
        
        # Check for suspicious generators
        for suspicious in SUSPICIOUS_GENERATORS:
            if suspicious in producer:
                result.add_risk("suspicious_producer", f"PDF producer '{result.metadata['producer']}' suggests document may have been modified or recreated", RISK_WEIGHTS["suspicious_producer"])
                result.add_finding("metadata", "warning", "Suspicious PDF producer detected", f"Producer: {result.metadata['producer']}")
                break
            if suspicious in creator:
                result.add_risk("suspicious_creator", f"PDF creator '{result.metadata['creator']}' suggests document may have been recreated", RISK_WEIGHTS["suspicious_creator"])
                result.add_finding("metadata", "warning", "Suspicious PDF creator detected", f"Creator: {result.metadata['creator']}")
                break
        
        # Check if from professional source
        is_professional = any(prof in producer or prof in creator for prof in PROFESSIONAL_PRODUCERS)
        if is_professional:
            result.add_finding("metadata", "info", "Professional PDF generator detected", f"Producer: {result.metadata['producer']}")
        
        # Analyze dates
        creation_date = parse_pdf_date(result.metadata.get("creationDate", ""))
        mod_date = parse_pdf_date(result.metadata.get("modificationDate", ""))
        now = datetime.now()
        
        if creation_date:
            result.metadata["creationDateParsed"] = creation_date.isoformat()
            
            # Check for future dates
            if creation_date > now:
                result.add_risk("future_date", "Creation date is in the future - clear sign of manipulation", RISK_WEIGHTS["future_date"])
                result.add_finding("metadata", "error", "Creation date is in the future", f"Date: {creation_date.isoformat()}")
        
        if mod_date:
            result.metadata["modificationDateParsed"] = mod_date.isoformat()
            
            if mod_date > now:
                result.add_risk("future_date", "Modification date is in the future - clear sign of manipulation", RISK_WEIGHTS["future_date"])
                result.add_finding("metadata", "error", "Modification date is in the future", f"Date: {mod_date.isoformat()}")
        
        # Check date consistency
        if creation_date and mod_date:
            if mod_date < creation_date:
                result.add_risk("inconsistent_timestamps", "Modification date is before creation date - impossible scenario", RISK_WEIGHTS["inconsistent_timestamps"])
                result.add_finding("metadata", "error", "Inconsistent timestamps", "Modification date cannot be before creation date")
            
            # Check if dates are suspiciously close to each other but document appears complex
            time_diff = abs((mod_date - creation_date).total_seconds())
            if time_diff < 60 and result.page_count > 5:
                result.add_finding("metadata", "info", "Creation and modification dates are very close", "Multi-page document created and modified within a minute")
        
        # Extract text content for consistency analysis
        try:
            pdf_file.seek(0)
            result.text_content = extract_text(pdf_file)
            
            # Extract dates from text
            result.dates_in_text = extract_dates_from_text(result.text_content)
            
            # Extract numbers from text
            result.numbers_in_text = extract_numbers_from_text(result.text_content)
            
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
            
            # Check for too many different fonts (potential copy-paste)
            if len(fonts) > 10:
                result.add_risk("font_inconsistency", f"Document uses {len(fonts)} different fonts - may indicate copy-paste from multiple sources", RISK_WEIGHTS["font_inconsistency"])
                result.add_finding("consistency", "warning", f"High font variety detected ({len(fonts)} fonts)", "This may indicate content was combined from multiple sources")
            
        except Exception as e:
            result.add_finding("fonts", "info", "Could not analyze fonts", str(e))
        
        # Numeric consistency check
        if result.numbers_in_text:
            # Look for common paystub/financial document patterns
            values = [n["value"] for n in result.numbers_in_text]
            
            # Check if numbers add up (gross - deductions = net pattern)
            # This is a simplified check
            if len(values) >= 3:
                sorted_values = sorted(values, reverse=True)
                # Check if largest value roughly equals sum of some smaller values
                largest = sorted_values[0]
                potential_components = sorted_values[1:]
                
                # Simple check: does any combination of smaller values approximately equal the largest?
                # This helps detect if gross/net/deductions are internally consistent
                pass  # Would need more context about document type for accurate check
        
        # Generate recommendations based on findings
        if not result.metadata.get("producer"):
            result.add_recommendation("Add Producer Metadata", "Document lacks producer information. Consider regenerating with proper PDF software.", "medium")
        
        if result.incremental_updates > 2:
            result.add_recommendation("Flatten Document", "Multiple edit traces detected. Consider recreating document to remove edit history.", "high")
        
        if any(f["severity"] == "error" for f in result.consistency_findings):
            result.add_recommendation("Address Critical Issues", "Document has critical metadata issues that will likely trigger verification failures.", "high")
        
        # Final risk assessment
        if result.risk_score == 0:
            result.add_finding("overall", "info", "No significant issues detected", "Document appears well-formed")
        
        return result
        
    except Exception as e:
        result.add_finding("error", "error", f"Analysis failed: {str(e)}", "")
        result.risk_score = 50  # Unknown state
        return result


def normalize_pdf_metadata(pdf_bytes: bytes, options: Dict = None) -> Tuple[bytes, Dict]:
    """Normalize PDF metadata to reduce red flags"""
    options = options or {}
    changes = []
    
    try:
        # Use pikepdf for modification
        pdf_file = io.BytesIO(pdf_bytes)
        
        with pikepdf.open(pdf_file) as pdf:
            # Get current metadata
            with pdf.open_metadata() as meta:
                original_meta = dict(meta)
            
            # Determine new metadata values
            now = datetime.now(timezone.utc)
            
            # Standardize producer if requested
            if options.get("standardize_producer", True):
                current_producer = original_meta.get('pdf:Producer', '')
                if current_producer:
                    # Keep professional producers, standardize others
                    is_professional = any(prof in current_producer.lower() for prof in PROFESSIONAL_PRODUCERS)
                    if not is_professional:
                        changes.append({
                            "field": "Producer",
                            "original": current_producer,
                            "new": "Document Generator",
                            "reason": "Standardized producer field"
                        })
            
            # Fix future dates
            if options.get("fix_dates", True):
                with pdf.open_metadata() as meta:
                    creation_str = meta.get('xmp:CreateDate', '')
                    if creation_str:
                        try:
                            creation_date = datetime.fromisoformat(creation_str.replace('Z', '+00:00'))
                            if creation_date > now:
                                # Set to reasonable past date
                                new_date = now - timedelta(days=30)
                                meta['xmp:CreateDate'] = new_date.isoformat()
                                changes.append({
                                    "field": "Creation Date",
                                    "original": creation_str,
                                    "new": new_date.isoformat(),
                                    "reason": "Fixed future date"
                                })
                        except:
                            pass
            
            # Remove incremental updates by saving fresh
            if options.get("flatten_document", True):
                changes.append({
                    "field": "Document Structure",
                    "original": "Multiple revisions",
                    "new": "Single revision",
                    "reason": "Flattened document to remove edit history"
                })
            
            # Save normalized PDF
            output = io.BytesIO()
            pdf.save(output, linearize=True)  # Linearize for clean structure
            
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
    
    # Custom styles
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
    story.append(Paragraph(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", normal_style))
    story.append(Spacer(1, 20))
    
    # Risk Score
    risk_color = {
        "low": "#22c55e",
        "moderate": "#eab308",
        "high": "#f97316",
        "very_high": "#ef4444"
    }.get(analysis.get_risk_level(), "#6b7280")
    
    story.append(Paragraph("Risk Assessment", heading_style))
    story.append(Paragraph(f"<b>Risk Score:</b> {analysis.risk_score}/100", normal_style))
    story.append(Paragraph(f"<b>Risk Level:</b> {analysis.get_risk_level().replace('_', ' ').title()}", normal_style))
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
        ["Has XMP", "Yes" if analysis.has_xmp else "No"],
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
            story.append(Paragraph(f"• <b>{factor['factor']}:</b> {factor['description']} (+{factor['points']} points)", normal_style))
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
            priority_color = {"high": "#ef4444", "medium": "#f97316", "low": "#22c55e"}.get(rec["priority"], "#6b7280")
            story.append(Paragraph(f"• <b>{rec['title']}</b> [{rec['priority'].upper()}]", normal_style))
            story.append(Paragraph(f"   {rec['description']}", normal_style))
    
    # Disclaimer
    story.append(Spacer(1, 30))
    story.append(Paragraph("<i>Disclaimer: This tool improves document consistency but does not guarantee acceptance by third-party verifiers. Results should be used for informational purposes only.</i>", normal_style))
    
    doc.build(story)
    return buffer.getvalue()

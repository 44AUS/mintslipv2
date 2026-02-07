#!/usr/bin/env python3
"""
Comprehensive test for PDF Cleaning Endpoint
Tests all supported templates and validates metadata
"""

import requests
import io
import base64
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter

def create_test_pdf():
    """Create a simple test PDF"""
    pdf_buffer = io.BytesIO()
    c = canvas.Canvas(pdf_buffer, pagesize=letter)
    c.drawString(100, 750, "Test Paystub Document")
    c.drawString(100, 730, "Employee: Jane Smith")
    c.drawString(100, 710, "Pay Period: 01/01/2024 - 01/15/2024")
    c.drawString(100, 690, "Gross Pay: $3,000.00")
    c.drawString(100, 670, "Net Pay: $2,200.00")
    c.save()
    
    pdf_bytes = pdf_buffer.getvalue()
    pdf_buffer.close()
    return pdf_bytes

def test_pdf_cleaning_template(template_name, api_url):
    """Test PDF cleaning with a specific template"""
    print(f"\n🧪 Testing template: {template_name}")
    
    pdf_bytes = create_test_pdf()
    
    files = {
        'file': ('test_paystub.pdf', pdf_bytes, 'application/pdf')
    }
    data = {
        'template': template_name
    }
    
    try:
        response = requests.post(
            f"{api_url}/clean-paystub-pdf",
            files=files,
            data=data,
            timeout=30
        )
        
        if response.status_code != 200:
            print(f"❌ HTTP {response.status_code}: {response.text}")
            return False
        
        response_data = response.json()
        
        # Check required fields
        if not response_data.get("success"):
            print(f"❌ API returned success=false: {response_data}")
            return False
        
        if "cleanedPdfBase64" not in response_data:
            print(f"❌ Missing cleanedPdfBase64 field")
            return False
        
        if "metadata" not in response_data:
            print(f"❌ Missing metadata field")
            return False
        
        # Verify metadata
        metadata = response_data["metadata"]
        expected_producer = "Qt 4.8.7"
        expected_creator = "wkhtmltopdf 0.12.6.1"
        
        actual_producer = metadata.get("producer", "")
        actual_creator = metadata.get("creator", "")
        
        if actual_producer != expected_producer:
            print(f"❌ Wrong producer: expected '{expected_producer}', got '{actual_producer}'")
            return False
        
        if actual_creator != expected_creator:
            print(f"❌ Wrong creator: expected '{expected_creator}', got '{actual_creator}'")
            return False
        
        # Verify base64 PDF is valid
        cleaned_pdf_b64 = response_data["cleanedPdfBase64"]
        if not cleaned_pdf_b64:
            print(f"❌ Empty cleanedPdfBase64")
            return False
        
        try:
            cleaned_pdf_bytes = base64.b64decode(cleaned_pdf_b64)
            if not cleaned_pdf_bytes.startswith(b'%PDF'):
                print(f"❌ Invalid PDF in cleanedPdfBase64")
                return False
        except Exception as e:
            print(f"❌ Failed to decode base64 PDF: {str(e)}")
            return False
        
        print(f"✅ Template {template_name} - SUCCESS")
        print(f"   Producer: {actual_producer}")
        print(f"   Creator: {actual_creator}")
        print(f"   Title: {metadata.get('title', 'N/A')}")
        print(f"   Cleaned PDF size: {len(cleaned_pdf_bytes)} bytes")
        return True
        
    except Exception as e:
        print(f"❌ Exception: {str(e)}")
        return False

def main():
    api_url = "https://user-counter-update.preview.emergentagent.com/api"
    
    print("🧹 Comprehensive PDF Cleaning Endpoint Test")
    print("=" * 50)
    
    # Test all supported templates
    templates = ['template-a', 'template-b', 'template-c', 'template-h']
    
    results = {}
    for template in templates:
        results[template] = test_pdf_cleaning_template(template, api_url)
    
    print("\n" + "=" * 50)
    print("📊 SUMMARY")
    print("=" * 50)
    
    passed = sum(1 for result in results.values() if result)
    total = len(results)
    
    for template, result in results.items():
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{template}: {status}")
    
    print(f"\nOverall: {passed}/{total} templates passed ({(passed/total)*100:.1f}%)")
    
    if passed == total:
        print("🎉 ALL TEMPLATES WORKING CORRECTLY!")
        return True
    else:
        print("⚠️  Some templates failed - check details above")
        return False

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
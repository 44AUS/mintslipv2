#!/usr/bin/env python3
"""
Debug test for PDF Cleaning Endpoint template handling
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
    c.drawString(100, 730, "Employee: Debug Test")
    c.save()
    
    pdf_bytes = pdf_buffer.getvalue()
    pdf_buffer.close()
    return pdf_bytes

def test_template_debug(template_name):
    """Debug test for a specific template"""
    api_url = "https://metascan.preview.emergentagent.com/api"
    
    print(f"\n🔍 Debug test for template: {template_name}")
    
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
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            response_data = response.json()
            metadata = response_data.get("metadata", {})
            
            print(f"Template sent: {template_name}")
            print(f"Metadata received:")
            print(f"  Producer: {metadata.get('producer', 'N/A')}")
            print(f"  Creator: {metadata.get('creator', 'N/A')}")
            print(f"  Title: {metadata.get('title', 'N/A')}")
            
            # Expected titles for each template
            expected_titles = {
                'template-a': 'Gusto',
                'template-b': 'ADP', 
                'template-c': 'Paychex',
                'template-h': 'Pay Statement'
            }
            
            expected_title = expected_titles.get(template_name, 'Unknown')
            actual_title = metadata.get('title', 'N/A')
            
            if actual_title == expected_title:
                print(f"✅ Title correct: {actual_title}")
            else:
                print(f"❌ Title mismatch: expected '{expected_title}', got '{actual_title}'")
        else:
            print(f"❌ Error: {response.text}")
            
    except Exception as e:
        print(f"❌ Exception: {str(e)}")

def main():
    print("🔍 PDF Cleaning Template Debug Test")
    print("=" * 40)
    
    # Test each template individually
    templates = ['template-a', 'template-b', 'template-c', 'template-h']
    
    for template in templates:
        test_template_debug(template)

if __name__ == "__main__":
    main()
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

// Get template URL based on year
const getTemplateUrl = (taxYear) => {
  const year = parseInt(taxYear);
  return `/templates/w9-${year}.pdf`;
};

// Field positions matching the main generator
const FIELD_POSITIONS = {
  name: { x: 35, y: 680, fontSize: 10 },
  businessName: { x: 35, y: 650, fontSize: 10 },
  checkIndividual: { x: 35, y: 615, fontSize: 10 },
  checkCCorp: { x: 200, y: 615, fontSize: 10 },
  checkSCorp: { x: 260, y: 615, fontSize: 10 },
  checkPartnership: { x: 322, y: 615, fontSize: 10 },
  checkTrust: { x: 395, y: 615, fontSize: 10 },
  checkLLC: { x: 35, y: 600, fontSize: 10 },
  llcClassification: { x: 185, y: 600, fontSize: 10 },
  checkOther: { x: 260, y: 600, fontSize: 10 },
  otherText: { x: 300, y: 600, fontSize: 9 },
  checkForeignPartner: { x: 35, y: 580, fontSize: 10 },
  exemptPayeeCode: { x: 415, y: 655, fontSize: 9 },
  fatcaCode: { x: 530, y: 655, fontSize: 9 },
  address: { x: 35, y: 560, fontSize: 10 },
  cityStateZip: { x: 35, y: 530, fontSize: 10 },
  accountNumbers: { x: 35, y: 500, fontSize: 9 },
  requesterName: { x: 415, y: 580, fontSize: 9 },
  ssn1: { x: 360, y: 460, fontSize: 11 },
  ssn2: { x: 395, y: 460, fontSize: 11 },
  ssn3: { x: 445, y: 460, fontSize: 11 },
  ein1: { x: 500, y: 460, fontSize: 11 },
  ein2: { x: 540, y: 460, fontSize: 11 },
  signatureDate: { x: 435, y: 325, fontSize: 10 },
  signature: { x: 70, y: 325, fontSize: 12 }
};

// Generate W-9 preview with watermark
export const generateW9Preview = async (formData, taxYear) => {
  try {
    // Fetch the PDF template
    const templateUrl = getTemplateUrl(taxYear);
    const templateResponse = await fetch(templateUrl);
    const templateBytes = await templateResponse.arrayBuffer();
    
    // Load the PDF
    const pdfDoc = await PDFDocument.load(templateBytes);
    const pages = pdfDoc.getPages();
    const page = pages[0];
    const { width, height } = page.getSize();
    
    // Get fonts
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    // Helper function to draw text
    const drawText = (text, position, useBold = false) => {
      if (!text) return;
      const textStr = String(text);
      const selectedFont = useBold ? boldFont : font;
      const fontSize = position.fontSize || 10;
      
      page.drawText(textStr, {
        x: position.x,
        y: position.y,
        size: fontSize,
        font: selectedFont,
        color: rgb(0, 0, 0),
      });
    };
    
    // Draw checkbox (X mark)
    const drawCheckbox = (position, checked) => {
      if (checked) {
        drawText("X", position, true);
      }
    };
    
    // Fill in form fields
    drawText(formData.name, FIELD_POSITIONS.name, true);
    drawText(formData.businessName, FIELD_POSITIONS.businessName);
    
    // Tax classification checkboxes
    drawCheckbox(FIELD_POSITIONS.checkIndividual, formData.taxClassification === 'individual');
    drawCheckbox(FIELD_POSITIONS.checkCCorp, formData.taxClassification === 'c_corp');
    drawCheckbox(FIELD_POSITIONS.checkSCorp, formData.taxClassification === 's_corp');
    drawCheckbox(FIELD_POSITIONS.checkPartnership, formData.taxClassification === 'partnership');
    drawCheckbox(FIELD_POSITIONS.checkTrust, formData.taxClassification === 'trust');
    drawCheckbox(FIELD_POSITIONS.checkLLC, formData.taxClassification === 'llc');
    drawCheckbox(FIELD_POSITIONS.checkOther, formData.taxClassification === 'other');
    
    if (formData.taxClassification === 'llc' && formData.llcClassification) {
      drawText(formData.llcClassification, FIELD_POSITIONS.llcClassification);
    }
    
    if (formData.taxClassification === 'other' && formData.otherDescription) {
      drawText(formData.otherDescription, FIELD_POSITIONS.otherText);
    }
    
    drawCheckbox(FIELD_POSITIONS.checkForeignPartner, formData.isForeignPartner);
    
    if (formData.exemptPayeeCode) {
      drawText(formData.exemptPayeeCode, FIELD_POSITIONS.exemptPayeeCode);
    }
    if (formData.fatcaCode) {
      drawText(formData.fatcaCode, FIELD_POSITIONS.fatcaCode);
    }
    
    const addressLine = [formData.address, formData.apt].filter(Boolean).join(', ');
    drawText(addressLine, FIELD_POSITIONS.address);
    
    const cityStateZip = [formData.city, formData.state, formData.zip].filter(Boolean).join(', ');
    drawText(cityStateZip, FIELD_POSITIONS.cityStateZip);
    
    if (formData.accountNumbers) {
      drawText(formData.accountNumbers, FIELD_POSITIONS.accountNumbers);
    }
    
    if (formData.requesterName) {
      drawText(formData.requesterName, FIELD_POSITIONS.requesterName);
    }
    
    // TIN
    if (formData.tinType === 'ssn' && formData.ssn) {
      const ssnClean = formData.ssn.replace(/-/g, '');
      if (ssnClean.length >= 3) {
        drawText(ssnClean.substring(0, 3), FIELD_POSITIONS.ssn1, true);
      }
      if (ssnClean.length >= 5) {
        drawText(ssnClean.substring(3, 5), FIELD_POSITIONS.ssn2, true);
      }
      if (ssnClean.length >= 9) {
        drawText(ssnClean.substring(5, 9), FIELD_POSITIONS.ssn3, true);
      }
    } else if (formData.tinType === 'ein' && formData.ein) {
      const einClean = formData.ein.replace(/-/g, '');
      if (einClean.length >= 2) {
        drawText(einClean.substring(0, 2), FIELD_POSITIONS.ein1, true);
      }
      if (einClean.length >= 9) {
        drawText(einClean.substring(2, 9), FIELD_POSITIONS.ein2, true);
      }
    }
    
    if (formData.signature) {
      drawText(formData.signature, FIELD_POSITIONS.signature, true);
    }
    
    if (formData.signatureDate) {
      drawText(formData.signatureDate, FIELD_POSITIONS.signatureDate);
    }
    
    // Add WATERMARK - diagonal across the page
    page.drawText("MintSlip", {
      x: width / 2 - 100,
      y: height / 2,
      size: 60,
      font: boldFont,
      color: rgb(0.8, 0.8, 0.8),
      rotate: { type: 'degrees', angle: -35 },
      opacity: 0.5,
    });
    
    page.drawText("PREVIEW", {
      x: width / 2 - 60,
      y: height / 2 - 50,
      size: 24,
      font: boldFont,
      color: rgb(0.8, 0.8, 0.8),
      rotate: { type: 'degrees', angle: -35 },
      opacity: 0.5,
    });
    
    // Save and return as base64 data URL
    const pdfBytes = await pdfDoc.save();
    
    // Convert Uint8Array to base64 properly
    let binary = '';
    const bytes = new Uint8Array(pdfBytes);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = window.btoa(binary);
    const dataUrl = `data:application/pdf;base64,${base64}`;
    
    return dataUrl;
    
  } catch (error) {
    console.error("Error generating W-9 preview:", error);
    throw error;
  }
};

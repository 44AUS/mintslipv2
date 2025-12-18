import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

// Federal Tax Classification options
export const TAX_CLASSIFICATIONS = [
  { value: "individual", label: "Individual/sole proprietor or single-member LLC" },
  { value: "c_corp", label: "C Corporation" },
  { value: "s_corp", label: "S Corporation" },
  { value: "partnership", label: "Partnership" },
  { value: "trust", label: "Trust/estate" },
  { value: "llc", label: "Limited liability company" },
  { value: "other", label: "Other" }
];

// LLC Tax Classification options
export const LLC_TAX_CLASSIFICATIONS = [
  { value: "C", label: "C - C corporation" },
  { value: "S", label: "S - S corporation" },
  { value: "P", label: "P - Partnership" }
];

// Get template URL based on year
const getTemplateUrl = (taxYear) => {
  const year = parseInt(taxYear);
  return `/templates/w9-${year}.pdf`;
};

// Field positions for W-9 form (coordinates from bottom-left)
// These positions are based on the official IRS W-9 form layout
const FIELD_POSITIONS = {
  // Line 1 - Name
  name: { x: 35, y: 680, fontSize: 10 },
  
  // Line 2 - Business name
  businessName: { x: 35, y: 650, fontSize: 10 },
  
  // Line 3 - Federal tax classification checkboxes
  // These are approximate checkbox positions
  checkIndividual: { x: 35, y: 615, fontSize: 10 },
  checkCCorp: { x: 200, y: 615, fontSize: 10 },
  checkSCorp: { x: 260, y: 615, fontSize: 10 },
  checkPartnership: { x: 322, y: 615, fontSize: 10 },
  checkTrust: { x: 395, y: 615, fontSize: 10 },
  checkLLC: { x: 35, y: 600, fontSize: 10 },
  llcClassification: { x: 185, y: 600, fontSize: 10 },
  checkOther: { x: 260, y: 600, fontSize: 10 },
  otherText: { x: 300, y: 600, fontSize: 9 },
  
  // Line 3b - Foreign partner checkbox
  checkForeignPartner: { x: 35, y: 580, fontSize: 10 },
  
  // Line 4 - Exemptions
  exemptPayeeCode: { x: 415, y: 655, fontSize: 9 },
  fatcaCode: { x: 530, y: 655, fontSize: 9 },
  
  // Line 5 - Address
  address: { x: 35, y: 560, fontSize: 10 },
  
  // Line 6 - City, state, ZIP
  cityStateZip: { x: 35, y: 530, fontSize: 10 },
  
  // Line 7 - Account numbers (requester's info)
  accountNumbers: { x: 35, y: 500, fontSize: 9 },
  
  // Requester's name and address (right side)
  requesterName: { x: 415, y: 580, fontSize: 9 },
  
  // Part I - TIN (SSN or EIN)
  ssn1: { x: 360, y: 460, fontSize: 11 },
  ssn2: { x: 395, y: 460, fontSize: 11 },
  ssn3: { x: 445, y: 460, fontSize: 11 },
  
  ein1: { x: 500, y: 460, fontSize: 11 },
  ein2: { x: 540, y: 460, fontSize: 11 },
  
  // Part II - Certification
  signatureDate: { x: 435, y: 325, fontSize: 10 },
  signature: { x: 70, y: 325, fontSize: 12 }
};

// Generate W-9 by filling in PDF template
export const generateW9PDF = async (formData, taxYear) => {
  try {
    // Fetch the PDF template
    const templateUrl = getTemplateUrl(taxYear);
    const templateResponse = await fetch(templateUrl);
    const templateBytes = await templateResponse.arrayBuffer();
    
    // Load the PDF
    const pdfDoc = await PDFDocument.load(templateBytes);
    const pages = pdfDoc.getPages();
    const page = pages[0];
    
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
    
    // Line 1 - Name
    drawText(formData.name, FIELD_POSITIONS.name, true);
    
    // Line 2 - Business name
    drawText(formData.businessName, FIELD_POSITIONS.businessName);
    
    // Line 3 - Tax classification checkboxes
    drawCheckbox(FIELD_POSITIONS.checkIndividual, formData.taxClassification === 'individual');
    drawCheckbox(FIELD_POSITIONS.checkCCorp, formData.taxClassification === 'c_corp');
    drawCheckbox(FIELD_POSITIONS.checkSCorp, formData.taxClassification === 's_corp');
    drawCheckbox(FIELD_POSITIONS.checkPartnership, formData.taxClassification === 'partnership');
    drawCheckbox(FIELD_POSITIONS.checkTrust, formData.taxClassification === 'trust');
    drawCheckbox(FIELD_POSITIONS.checkLLC, formData.taxClassification === 'llc');
    drawCheckbox(FIELD_POSITIONS.checkOther, formData.taxClassification === 'other');
    
    // LLC classification letter
    if (formData.taxClassification === 'llc' && formData.llcClassification) {
      drawText(formData.llcClassification, FIELD_POSITIONS.llcClassification);
    }
    
    // Other text
    if (formData.taxClassification === 'other' && formData.otherDescription) {
      drawText(formData.otherDescription, FIELD_POSITIONS.otherText);
    }
    
    // Line 3b - Foreign partner
    drawCheckbox(FIELD_POSITIONS.checkForeignPartner, formData.isForeignPartner);
    
    // Line 4 - Exemptions
    if (formData.exemptPayeeCode) {
      drawText(formData.exemptPayeeCode, FIELD_POSITIONS.exemptPayeeCode);
    }
    if (formData.fatcaCode) {
      drawText(formData.fatcaCode, FIELD_POSITIONS.fatcaCode);
    }
    
    // Line 5 - Address
    const addressLine = [formData.address, formData.apt].filter(Boolean).join(', ');
    drawText(addressLine, FIELD_POSITIONS.address);
    
    // Line 6 - City, state, ZIP
    const cityStateZip = [formData.city, formData.state, formData.zip].filter(Boolean).join(', ');
    drawText(cityStateZip, FIELD_POSITIONS.cityStateZip);
    
    // Line 7 - Account numbers
    if (formData.accountNumbers) {
      drawText(formData.accountNumbers, FIELD_POSITIONS.accountNumbers);
    }
    
    // Requester's name and address
    if (formData.requesterName) {
      drawText(formData.requesterName, FIELD_POSITIONS.requesterName);
    }
    
    // Part I - TIN (Social Security Number or EIN)
    if (formData.tinType === 'ssn' && formData.ssn) {
      // Parse SSN and split into parts
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
      // Parse EIN and split into parts
      const einClean = formData.ein.replace(/-/g, '');
      if (einClean.length >= 2) {
        drawText(einClean.substring(0, 2), FIELD_POSITIONS.ein1, true);
      }
      if (einClean.length >= 9) {
        drawText(einClean.substring(2, 9), FIELD_POSITIONS.ein2, true);
      }
    }
    
    // Part II - Certification
    // Signature (typed name)
    if (formData.signature) {
      drawText(formData.signature, FIELD_POSITIONS.signature, true);
    }
    
    // Date
    if (formData.signatureDate) {
      drawText(formData.signatureDate, FIELD_POSITIONS.signatureDate);
    }
    
    // Save the PDF
    const pdfBytes = await pdfDoc.save();
    return pdfBytes;
    
  } catch (error) {
    console.error("Error generating W-9 PDF:", error);
    throw error;
  }
};

// Generate and download W-9
export const generateAndDownloadW9 = async (formData, taxYear) => {
  try {
    const pdfBytes = await generateW9PDF(formData, taxYear);
    
    // Create blob and download
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.href = url;
    const lastName = formData.name ? formData.name.split(' ').pop() : 'Form';
    link.download = `W9_${taxYear}_${lastName}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
    return true;
  } catch (error) {
    console.error("Error downloading W-9:", error);
    throw error;
  }
};

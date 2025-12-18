import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

// Get template URL based on tax year
const getTemplateUrl = (taxYear) => {
  const year = parseInt(taxYear);
  // 2021-2023 use the 2018 revision, 2024 uses the new revision
  if (year <= 2023) {
    return `/templates/w9-${year}.pdf`;
  }
  return `/templates/w9-2024.pdf`;
};

// Field positions for W-9 form (2018 revision for 2021-2023)
const FIELD_POSITIONS_2018 = {
  // Line 1 - Name
  name: { x: 42, y: 656, fontSize: 11 },
  
  // Line 2 - Business name
  businessName: { x: 42, y: 620, fontSize: 10 },
  
  // Line 3 - Federal tax classification checkboxes
  individual: { x: 48, y: 584, fontSize: 10 },
  ccorp: { x: 154, y: 584, fontSize: 10 },
  scorp: { x: 207, y: 584, fontSize: 10 },
  partnership: { x: 260, y: 584, fontSize: 10 },
  trust: { x: 330, y: 584, fontSize: 10 },
  llc: { x: 400, y: 584, fontSize: 10 },
  llcCode: { x: 492, y: 584, fontSize: 10 },
  other: { x: 48, y: 566, fontSize: 10 },
  otherText: { x: 100, y: 566, fontSize: 9 },
  
  // Exemptions (Line 4)
  exemptPayeeCode: { x: 505, y: 638, fontSize: 9 },
  fatcaCode: { x: 505, y: 615, fontSize: 9 },
  
  // Address (Line 5)
  address: { x: 42, y: 524, fontSize: 10 },
  
  // City, State, ZIP (Line 6)
  cityStateZip: { x: 42, y: 490, fontSize: 10 },
  
  // Account numbers (Line 7)
  accountNumbers: { x: 42, y: 456, fontSize: 9 },
  
  // Part I - TIN
  ssn1: { x: 345, y: 430, fontSize: 14 },
  ssn2: { x: 390, y: 430, fontSize: 14 },
  ssn3: { x: 460, y: 430, fontSize: 14 },
  ein1: { x: 345, y: 400, fontSize: 14 },
  ein2: { x: 420, y: 400, fontSize: 14 },
  
  // Part II - Signature and Date
  signatureDate: { x: 470, y: 260, fontSize: 10 }
};

// Field positions for W-9 form (2024 revision)
const FIELD_POSITIONS_2024 = {
  // Line 1 - Name
  name: { x: 42, y: 640, fontSize: 11 },
  
  // Line 2 - Business name
  businessName: { x: 42, y: 600, fontSize: 10 },
  
  // Line 3 - Federal tax classification checkboxes
  individual: { x: 48, y: 564, fontSize: 10 },
  ccorp: { x: 154, y: 564, fontSize: 10 },
  scorp: { x: 207, y: 564, fontSize: 10 },
  partnership: { x: 260, y: 564, fontSize: 10 },
  trust: { x: 330, y: 564, fontSize: 10 },
  llc: { x: 400, y: 564, fontSize: 10 },
  llcCode: { x: 492, y: 564, fontSize: 10 },
  other: { x: 48, y: 546, fontSize: 10 },
  otherText: { x: 100, y: 546, fontSize: 9 },
  
  // Exemptions (Line 4)
  exemptPayeeCode: { x: 505, y: 618, fontSize: 9 },
  fatcaCode: { x: 505, y: 595, fontSize: 9 },
  
  // Address (Line 5)
  address: { x: 42, y: 498, fontSize: 10 },
  
  // City, State, ZIP (Line 6)
  cityStateZip: { x: 42, y: 464, fontSize: 10 },
  
  // Account numbers (Line 7)
  accountNumbers: { x: 42, y: 430, fontSize: 9 },
  
  // Part I - TIN
  ssn1: { x: 345, y: 398, fontSize: 14 },
  ssn2: { x: 390, y: 398, fontSize: 14 },
  ssn3: { x: 460, y: 398, fontSize: 14 },
  ein1: { x: 345, y: 368, fontSize: 14 },
  ein2: { x: 420, y: 368, fontSize: 14 },
  
  // Part II - Signature and Date
  signatureDate: { x: 470, y: 232, fontSize: 10 }
};

// Get field positions based on tax year
const getFieldPositions = (taxYear) => {
  const year = parseInt(taxYear);
  if (year >= 2024) {
    return FIELD_POSITIONS_2024;
  }
  return FIELD_POSITIONS_2018;
};

// Generate W-9 PDF
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
    
    // Get field positions for this year
    const FIELD_POSITIONS = getFieldPositions(taxYear);
    
    // Helper function to draw text
    const drawText = (text, position, useBold = false) => {
      if (!text) return;
      const textStr = String(text);
      page.drawText(textStr, {
        x: position.x,
        y: position.y,
        size: position.fontSize || 10,
        font: useBold ? boldFont : font,
        color: rgb(0, 0, 0),
      });
    };
    
    // Helper to draw checkbox mark
    const drawCheckmark = (position) => {
      page.drawText("X", {
        x: position.x,
        y: position.y,
        size: position.fontSize || 10,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
    };
    
    // Fill in the form fields
    
    // Line 1 - Name
    drawText(formData.name, FIELD_POSITIONS.name, true);
    
    // Line 2 - Business name
    drawText(formData.businessName, FIELD_POSITIONS.businessName);
    
    // Line 3 - Federal tax classification
    switch (formData.taxClassification) {
      case "individual":
        drawCheckmark(FIELD_POSITIONS.individual);
        break;
      case "ccorp":
        drawCheckmark(FIELD_POSITIONS.ccorp);
        break;
      case "scorp":
        drawCheckmark(FIELD_POSITIONS.scorp);
        break;
      case "partnership":
        drawCheckmark(FIELD_POSITIONS.partnership);
        break;
      case "trust":
        drawCheckmark(FIELD_POSITIONS.trust);
        break;
      case "llc":
        drawCheckmark(FIELD_POSITIONS.llc);
        if (formData.llcTaxCode) {
          drawText(formData.llcTaxCode, FIELD_POSITIONS.llcCode);
        }
        break;
      case "other":
        drawCheckmark(FIELD_POSITIONS.other);
        if (formData.otherClassification) {
          drawText(formData.otherClassification, FIELD_POSITIONS.otherText);
        }
        break;
    }
    
    // Exemptions
    drawText(formData.exemptPayeeCode, FIELD_POSITIONS.exemptPayeeCode);
    drawText(formData.fatcaCode, FIELD_POSITIONS.fatcaCode);
    
    // Line 5 - Address
    drawText(formData.address, FIELD_POSITIONS.address);
    
    // Line 6 - City, State, ZIP
    const cityStateZip = [formData.city, formData.state, formData.zipCode].filter(Boolean).join(", ");
    drawText(cityStateZip, FIELD_POSITIONS.cityStateZip);
    
    // Line 7 - Account numbers
    drawText(formData.accountNumbers, FIELD_POSITIONS.accountNumbers);
    
    // Part I - TIN
    if (formData.tinType === "ssn" && formData.ssn) {
      // SSN format: XXX-XX-XXXX
      const ssnParts = formData.ssn.replace(/-/g, "").match(/.{1,3}/g) || [];
      if (ssnParts[0]) drawText(ssnParts[0], FIELD_POSITIONS.ssn1);
      if (ssnParts[1]) drawText(ssnParts[1], FIELD_POSITIONS.ssn2);
      if (ssnParts[2]) drawText(ssnParts[2], FIELD_POSITIONS.ssn3);
    } else if (formData.tinType === "ein" && formData.ein) {
      // EIN format: XX-XXXXXXX
      const einParts = formData.ein.split("-");
      if (einParts[0]) drawText(einParts[0], FIELD_POSITIONS.ein1);
      if (einParts[1]) drawText(einParts[1], FIELD_POSITIONS.ein2);
    }
    
    // Part II - Date
    drawText(formData.signatureDate, FIELD_POSITIONS.signatureDate);
    
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
    link.download = `W9_${taxYear}_${formData.name?.replace(/\s+/g, '_') || 'Form'}.pdf`;
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

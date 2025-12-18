import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

// Format currency for display on form
const formatCurrency = (amount) => {
  const num = parseFloat(amount) || 0;
  if (num === 0) return "";
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// Get template URL based on tax year
const getTemplateUrl = (taxYear) => {
  const year = parseInt(taxYear);
  return `/templates/1099nec-${year}.pdf`;
};

// Field positions for 1099-NEC form
const FIELD_POSITIONS = {
  // Payer information
  payerName: { x: 38, y: 695, fontSize: 9 },
  payerAddress: { x: 38, y: 680, fontSize: 9 },
  payerCityStateZip: { x: 38, y: 665, fontSize: 9 },
  payerPhone: { x: 38, y: 650, fontSize: 8 },
  payerTIN: { x: 38, y: 620, fontSize: 10 },
  
  // Recipient information
  recipientTIN: { x: 38, y: 585, fontSize: 10 },
  recipientName: { x: 38, y: 555, fontSize: 10 },
  recipientAddress: { x: 38, y: 525, fontSize: 9 },
  recipientCityStateZip: { x: 38, y: 510, fontSize: 9 },
  accountNumber: { x: 38, y: 475, fontSize: 9 },
  
  // Checkboxes
  secondTINNotice: { x: 210, y: 585, fontSize: 10 },
  
  // Compensation boxes
  box1: { x: 310, y: 620, fontSize: 10 },
  box2: { x: 415, y: 620, fontSize: 10 },
  box4: { x: 310, y: 585, fontSize: 10 },
  
  // State information - Row 1
  state1: { x: 38, y: 440, fontSize: 9 },
  payerStateNo1: { x: 80, y: 440, fontSize: 8 },
  stateIncome1: { x: 180, y: 440, fontSize: 9 },
  stateTaxWithheld1: { x: 280, y: 440, fontSize: 9 },
  
  // State information - Row 2
  state2: { x: 38, y: 420, fontSize: 9 },
  payerStateNo2: { x: 80, y: 420, fontSize: 8 },
  stateIncome2: { x: 180, y: 420, fontSize: 9 },
  stateTaxWithheld2: { x: 280, y: 420, fontSize: 9 }
};

// Generate 1099-NEC PDF
export const generate1099NECPDF = async (formData, taxYear) => {
  try {
    // Fetch the PDF template
    const templateUrl = getTemplateUrl(taxYear);
    const templateResponse = await fetch(templateUrl);
    const templateBytes = await templateResponse.arrayBuffer();
    
    // Load the PDF
    const pdfDoc = await PDFDocument.load(templateBytes);
    const pages = pdfDoc.getPages();
    // Use page 3 (index 2) - Copy 1 for State Tax Department
    const page = pages[2];
    
    // Get fonts
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
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
    
    // Fill in the form fields
    
    // Payer Information
    drawText(formData.payerName, FIELD_POSITIONS.payerName, true);
    drawText(formData.payerAddress, FIELD_POSITIONS.payerAddress);
    const payerCityStateZip = [formData.payerCity, formData.payerState, formData.payerZip].filter(Boolean).join(", ");
    drawText(payerCityStateZip, FIELD_POSITIONS.payerCityStateZip);
    drawText(formData.payerPhone, FIELD_POSITIONS.payerPhone);
    drawText(formData.payerTIN, FIELD_POSITIONS.payerTIN);
    
    // Recipient Information
    drawText(formData.recipientTIN, FIELD_POSITIONS.recipientTIN);
    drawText(formData.recipientName, FIELD_POSITIONS.recipientName, true);
    drawText(formData.recipientAddress, FIELD_POSITIONS.recipientAddress);
    const recipientCityStateZip = [formData.recipientCity, formData.recipientState, formData.recipientZip].filter(Boolean).join(", ");
    drawText(recipientCityStateZip, FIELD_POSITIONS.recipientCityStateZip);
    drawText(formData.accountNumber, FIELD_POSITIONS.accountNumber);
    
    // Checkboxes
    if (formData.secondTINNotice) {
      drawText("X", FIELD_POSITIONS.secondTINNotice, true);
    }
    
    // Compensation boxes
    drawText(formatCurrency(formData.box1), FIELD_POSITIONS.box1);
    if (formData.box2) {
      drawText("X", FIELD_POSITIONS.box2, true);
    }
    drawText(formatCurrency(formData.box4), FIELD_POSITIONS.box4);
    
    // State Information - Row 1
    drawText(formData.state1, FIELD_POSITIONS.state1);
    drawText(formData.payerStateNo1, FIELD_POSITIONS.payerStateNo1);
    drawText(formatCurrency(formData.stateIncome1), FIELD_POSITIONS.stateIncome1);
    drawText(formatCurrency(formData.stateTaxWithheld1), FIELD_POSITIONS.stateTaxWithheld1);
    
    // State Information - Row 2
    drawText(formData.state2, FIELD_POSITIONS.state2);
    drawText(formData.payerStateNo2, FIELD_POSITIONS.payerStateNo2);
    drawText(formatCurrency(formData.stateIncome2), FIELD_POSITIONS.stateIncome2);
    drawText(formatCurrency(formData.stateTaxWithheld2), FIELD_POSITIONS.stateTaxWithheld2);
    
    // Save the PDF
    const pdfBytes = await pdfDoc.save();
    return pdfBytes;
    
  } catch (error) {
    console.error("Error generating 1099-NEC PDF:", error);
    throw error;
  }
};

// Generate and download 1099-NEC
export const generateAndDownload1099NEC = async (formData, taxYear) => {
  try {
    const pdfBytes = await generate1099NECPDF(formData, taxYear);
    
    // Create blob and download
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.href = url;
    link.download = `1099NEC_${taxYear}_${formData.recipientName?.replace(/\s+/g, '_') || 'Form'}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
    return true;
  } catch (error) {
    console.error("Error downloading 1099-NEC:", error);
    throw error;
  }
};

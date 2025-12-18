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
  payerName: { x: 38, y: 695, fontSize: 9 },
  payerAddress: { x: 38, y: 680, fontSize: 9 },
  payerCityStateZip: { x: 38, y: 665, fontSize: 9 },
  payerPhone: { x: 38, y: 650, fontSize: 8 },
  payerTIN: { x: 38, y: 620, fontSize: 10 },
  recipientTIN: { x: 38, y: 585, fontSize: 10 },
  recipientName: { x: 38, y: 555, fontSize: 10 },
  recipientAddress: { x: 38, y: 525, fontSize: 9 },
  recipientCityStateZip: { x: 38, y: 510, fontSize: 9 },
  accountNumber: { x: 38, y: 475, fontSize: 9 },
  secondTINNotice: { x: 210, y: 585, fontSize: 10 },
  box1: { x: 310, y: 620, fontSize: 10 },
  box2: { x: 415, y: 620, fontSize: 10 },
  box4: { x: 310, y: 585, fontSize: 10 },
  state1: { x: 38, y: 440, fontSize: 9 },
  payerStateNo1: { x: 80, y: 440, fontSize: 8 },
  stateIncome1: { x: 180, y: 440, fontSize: 9 },
  stateTaxWithheld1: { x: 280, y: 440, fontSize: 9 },
  state2: { x: 38, y: 420, fontSize: 9 },
  payerStateNo2: { x: 80, y: 420, fontSize: 8 },
  stateIncome2: { x: 180, y: 420, fontSize: 9 },
  stateTaxWithheld2: { x: 280, y: 420, fontSize: 9 }
};

// Generate 1099-NEC preview with watermark
export const generate1099NECPreview = async (formData, taxYear) => {
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
      page.drawText(textStr, {
        x: position.x,
        y: position.y,
        size: position.fontSize || 10,
        font: useBold ? boldFont : font,
        color: rgb(0, 0, 0),
      });
    };
    
    // Fill in the form fields
    drawText(formData.payerName, FIELD_POSITIONS.payerName, true);
    drawText(formData.payerAddress, FIELD_POSITIONS.payerAddress);
    const payerCityStateZip = [formData.payerCity, formData.payerState, formData.payerZip].filter(Boolean).join(", ");
    drawText(payerCityStateZip, FIELD_POSITIONS.payerCityStateZip);
    drawText(formData.payerPhone, FIELD_POSITIONS.payerPhone);
    drawText(formData.payerTIN, FIELD_POSITIONS.payerTIN);
    
    drawText(formData.recipientTIN, FIELD_POSITIONS.recipientTIN);
    drawText(formData.recipientName, FIELD_POSITIONS.recipientName, true);
    drawText(formData.recipientAddress, FIELD_POSITIONS.recipientAddress);
    const recipientCityStateZip = [formData.recipientCity, formData.recipientState, formData.recipientZip].filter(Boolean).join(", ");
    drawText(recipientCityStateZip, FIELD_POSITIONS.recipientCityStateZip);
    drawText(formData.accountNumber, FIELD_POSITIONS.accountNumber);
    
    if (formData.secondTINNotice) {
      drawText("X", FIELD_POSITIONS.secondTINNotice, true);
    }
    
    drawText(formatCurrency(formData.box1), FIELD_POSITIONS.box1);
    if (formData.box2) {
      drawText("X", FIELD_POSITIONS.box2, true);
    }
    drawText(formatCurrency(formData.box4), FIELD_POSITIONS.box4);
    
    drawText(formData.state1, FIELD_POSITIONS.state1);
    drawText(formData.payerStateNo1, FIELD_POSITIONS.payerStateNo1);
    drawText(formatCurrency(formData.stateIncome1), FIELD_POSITIONS.stateIncome1);
    drawText(formatCurrency(formData.stateTaxWithheld1), FIELD_POSITIONS.stateTaxWithheld1);
    
    drawText(formData.state2, FIELD_POSITIONS.state2);
    drawText(formData.payerStateNo2, FIELD_POSITIONS.payerStateNo2);
    drawText(formatCurrency(formData.stateIncome2), FIELD_POSITIONS.stateIncome2);
    drawText(formatCurrency(formData.stateTaxWithheld2), FIELD_POSITIONS.stateTaxWithheld2);
    
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
    console.error("Error generating 1099-NEC preview:", error);
    throw error;
  }
};

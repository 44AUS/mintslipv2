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
  return `/templates/1099misc-${year}.pdf`;
};

// Field positions for 1099-MISC form (Copy 1 - page index 2)
// Page height: 792, coordinates from bottom
const FIELD_POSITIONS = {
  // Payer information (top left, PAYER'S name section y_top ~37-133)
  payerName: { x: 60, y: 740, fontSize: 9 },
  payerAddress: { x: 60, y: 724, fontSize: 9 },
  payerCityStateZip: { x: 60, y: 708, fontSize: 9 },
  payerPhone: { x: 60, y: 692, fontSize: 8 },
  payerTIN: { x: 60, y: 650, fontSize: 10 },
  
  // Recipient information
  recipientTIN: { x: 185, y: 650, fontSize: 10 },
  recipientName: { x: 60, y: 602, fontSize: 10 },
  recipientAddress: { x: 60, y: 566, fontSize: 9 },
  recipientCityStateZip: { x: 60, y: 530, fontSize: 9 },
  accountNumber: { x: 60, y: 458, fontSize: 9 },
  
  // Checkboxes
  secondTINNotice: { x: 265, y: 650, fontSize: 10 },
  fatcaFiling: { x: 262, y: 494, fontSize: 10 },
  
  // Income boxes - Left column (x around 300-310)
  box1: { x: 310, y: 728, fontSize: 9 },   // Rents (y_top=60)
  box2: { x: 310, y: 692, fontSize: 9 },   // Royalties (y_top=96)
  box3: { x: 310, y: 668, fontSize: 9 },   // Other income (y_top=120)
  box5: { x: 310, y: 620, fontSize: 9 },   // Fishing boat proceeds (y_top=168)
  box7: { x: 310, y: 578, fontSize: 10 },  // Direct sales checkbox area (y_top=181-207)
  box9: { x: 310, y: 548, fontSize: 9 },   // Crop insurance (y_top=240)
  box11: { x: 310, y: 512, fontSize: 9 },  // Fish purchased for resale (y_top=276)
  
  // Income boxes - Right column (x around 400-410)
  box4: { x: 410, y: 668, fontSize: 9 },   // Federal tax withheld (y_top=120)
  box6: { x: 410, y: 620, fontSize: 9 },   // Medical payments (y_top=168)
  box8: { x: 410, y: 584, fontSize: 9 },   // Substitute payments (y_top=204)
  box10: { x: 410, y: 548, fontSize: 9 },  // Gross proceeds to attorney (y_top=240)
  box12: { x: 410, y: 512, fontSize: 9 },  // Section 409A deferrals (y_top=276)
  box15: { x: 410, y: 476, fontSize: 9 },  // Nonqualified deferred comp (y_top=312)
  
  // State information - Row 1 (y_top ~325-348)
  stateTaxWithheld1: { x: 310, y: 452, fontSize: 9 },
  state1: { x: 410, y: 462, fontSize: 9 },
  payerStateNo1: { x: 450, y: 462, fontSize: 8 },
  stateIncome1: { x: 510, y: 452, fontSize: 9 },
  
  // State information - Row 2
  stateTaxWithheld2: { x: 310, y: 440, fontSize: 9 },
  state2: { x: 410, y: 444, fontSize: 9 },
  payerStateNo2: { x: 450, y: 444, fontSize: 8 },
  stateIncome2: { x: 510, y: 440, fontSize: 9 }
};

// Generate 1099-MISC PDF
export const generate1099MISCPDF = async (formData, taxYear) => {
  try {
    // Fetch the PDF template
    const templateUrl = getTemplateUrl(taxYear);
    const templateResponse = await fetch(templateUrl);
    const templateBytes = await templateResponse.arrayBuffer();
    
    // Load the source PDF template
    const sourcePdf = await PDFDocument.load(templateBytes, { ignoreEncryption: true });
    
    // Create a new PDF with only page 3 (index 2) - Copy 1 for State Tax Department
    const pdfDoc = await PDFDocument.create();
    const [copiedPage] = await pdfDoc.copyPages(sourcePdf, [2]);
    pdfDoc.addPage(copiedPage);
    const page = pdfDoc.getPages()[0];
    
    // Get fonts
    const font = await pdfDoc.embedFont(StandardFonts.Courier);
    const boldFont = await pdfDoc.embedFont(StandardFonts.CourierBold);
    
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
    if (formData.fatcaFiling) {
      drawText("X", FIELD_POSITIONS.fatcaFiling, true);
    }
    
    // Income boxes
    drawText(formatCurrency(formData.box1), FIELD_POSITIONS.box1);
    drawText(formatCurrency(formData.box2), FIELD_POSITIONS.box2);
    drawText(formatCurrency(formData.box3), FIELD_POSITIONS.box3);
    drawText(formatCurrency(formData.box4), FIELD_POSITIONS.box4);
    drawText(formatCurrency(formData.box5), FIELD_POSITIONS.box5);
    drawText(formatCurrency(formData.box6), FIELD_POSITIONS.box6);
    if (formData.box7) {
      drawText("X", FIELD_POSITIONS.box7, true);
    }
    drawText(formatCurrency(formData.box8), FIELD_POSITIONS.box8);
    drawText(formatCurrency(formData.box9), FIELD_POSITIONS.box9);
    drawText(formatCurrency(formData.box10), FIELD_POSITIONS.box10);
    drawText(formatCurrency(formData.box11), FIELD_POSITIONS.box11);
    drawText(formatCurrency(formData.box12), FIELD_POSITIONS.box12);
    drawText(formatCurrency(formData.box15), FIELD_POSITIONS.box15);
    
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
    console.error("Error generating 1099-MISC PDF:", error);
    throw error;
  }
};

// Generate and download 1099-MISC
export const generateAndDownload1099MISC = async (formData, taxYear) => {
  try {
    const pdfBytes = await generate1099MISCPDF(formData, taxYear);
    
    // Create blob and download
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const pdfFileName = `1099MISC_${taxYear}_${formData.recipientName?.replace(/\s+/g, '_') || 'Form'}.pdf`;
    
    // Store download info for payment success page
    sessionStorage.setItem('lastDownloadUrl', url);
    sessionStorage.setItem('lastDownloadFileName', pdfFileName);
    
    const link = document.createElement("a");
    link.href = url;
    link.download = pdfFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Don't revoke URL immediately - needed for re-download on success page
    return true;
  } catch (error) {
    console.error("Error downloading 1099-MISC:", error);
    throw error;
  }
};

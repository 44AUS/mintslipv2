import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import * as pdfjsLib from 'pdfjs-dist';

// Set up pdf.js worker using unpkg CDN with correct version
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

// Convert PDF bytes to image using pdf.js
async function convertPdfToImage(pdfBytes) {
  const loadingTask = pdfjsLib.getDocument({ data: pdfBytes });
  const pdf = await loadingTask.promise;
  
  // Get the first page
  const page = await pdf.getPage(1);
  
  // Set scale for good quality preview
  const scale = 2;
  const viewport = page.getViewport({ scale });
  
  // Create a canvas to render the PDF page
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  
  // Render the page to canvas
  await page.render({
    canvasContext: context,
    viewport: viewport
  }).promise;
  
  // Convert canvas to image data URL
  const imageDataUrl = canvas.toDataURL('image/png', 0.9);
  
  return imageDataUrl;
}

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

// Field positions for 1099-NEC form (Copy 1 for State - page index 2)
// Page height: 792, coordinates from bottom
const FIELD_POSITIONS = {
  // Payer information (top left, PAYER'S name section y_top ~37-109)
  payerName: { x: 60, y: 729, fontSize: 9 },
  payerAddress: { x: 60, y: 716, fontSize: 9 },
  payerCityStateZip: { x: 60, y: 704, fontSize: 9 },
  payerPhone: { x: 60, y: 690, fontSize: 8 },
  payerTIN: { x: 60, y: 665, fontSize: 10 },
  recipientTIN: { x: 185, y: 665, fontSize: 10 },
  recipientName: { x: 60, y: 640, fontSize: 10 },
  recipientAddress: { x: 60, y: 605, fontSize: 9 },
  recipientCityStateZip: { x: 60, y: 581, fontSize: 9 },
  accountNumber: { x: 60, y: 558, fontSize: 9 },
  secondTINNotice: { x: 265, y: 672, fontSize: 10 },
  box1: { x: 310, y: 665, fontSize: 10 },
  box2: { x: 485, y: 645, fontSize: 10 },
  box4: { x: 310, y: 593, fontSize: 10 },
  state1: { x: 310, y: 574, fontSize: 9 },
  payerStateNo1: { x: 390, y: 570, fontSize: 8 },
  stateTaxWithheld1: { x: 310, y: 570, fontSize: 9 },
  stateIncome1: { x: 510, y: 570, fontSize: 9 },
  state2: { x: 310, y: 570, fontSize: 9 },
  payerStateNo2: { x: 390, y: 555, fontSize: 8 },
  stateTaxWithheld2: { x: 310, y: 555, fontSize: 9 },
  stateIncome2: { x: 510, y: 555, fontSize: 9 }
};

// Generate 1099-NEC preview with watermark
export const generate1099NECPreview = async (formData, taxYear) => {
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
    const { width, height } = page.getSize();
    
    console.log("PDF Preview: Created single-page PDF, size:", width, "x", height);
    
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
    
    // Save and return as image
    const pdfBytes = await pdfDoc.save();
    
    // Convert PDF to image for preview display
    const imageDataUrl = await convertPdfToImage(pdfBytes);
    
    return imageDataUrl;
    
  } catch (error) {
    console.error("Error generating 1099-NEC preview:", error);
    throw error;
  }
};

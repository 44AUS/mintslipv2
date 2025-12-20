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
  return `/templates/1099misc-${year}.pdf`;
};

// Field positions for 1099-MISC form
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
  fatcaFiling: { x: 210, y: 570, fontSize: 10 },
  box1: { x: 310, y: 695, fontSize: 9 },
  box2: { x: 310, y: 665, fontSize: 9 },
  box3: { x: 310, y: 635, fontSize: 9 },
  box4: { x: 310, y: 605, fontSize: 9 },
  box5: { x: 310, y: 575, fontSize: 9 },
  box6: { x: 310, y: 545, fontSize: 9 },
  box7: { x: 310, y: 515, fontSize: 10 },
  box8: { x: 450, y: 695, fontSize: 9 },
  box9: { x: 450, y: 665, fontSize: 9 },
  box10: { x: 450, y: 635, fontSize: 9 },
  box11: { x: 450, y: 605, fontSize: 9 },
  box12: { x: 450, y: 575, fontSize: 9 },
  box15: { x: 450, y: 515, fontSize: 9 },
  state1: { x: 38, y: 440, fontSize: 9 },
  payerStateNo1: { x: 80, y: 440, fontSize: 8 },
  stateIncome1: { x: 180, y: 440, fontSize: 9 },
  stateTaxWithheld1: { x: 280, y: 440, fontSize: 9 },
  state2: { x: 38, y: 420, fontSize: 9 },
  payerStateNo2: { x: 80, y: 420, fontSize: 8 },
  stateIncome2: { x: 180, y: 420, fontSize: 9 },
  stateTaxWithheld2: { x: 280, y: 420, fontSize: 9 }
};

// Generate 1099-MISC preview with watermark
export const generate1099MISCPreview = async (formData, taxYear) => {
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
    if (formData.fatcaFiling) {
      drawText("X", FIELD_POSITIONS.fatcaFiling, true);
    }
    
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
    
    drawText(formData.state1, FIELD_POSITIONS.state1);
    drawText(formData.payerStateNo1, FIELD_POSITIONS.payerStateNo1);
    drawText(formatCurrency(formData.stateIncome1), FIELD_POSITIONS.stateIncome1);
    drawText(formatCurrency(formData.stateTaxWithheld1), FIELD_POSITIONS.stateTaxWithheld1);
    
    drawText(formData.state2, FIELD_POSITIONS.state2);
    drawText(formData.payerStateNo2, FIELD_POSITIONS.payerStateNo2);
    drawText(formatCurrency(formData.stateIncome2), FIELD_POSITIONS.stateIncome2);
    drawText(formatCurrency(formData.stateTaxWithheld2), FIELD_POSITIONS.stateTaxWithheld2);
    
    // Add WATERMARK
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
    console.error("Error generating 1099-MISC preview:", error);
    throw error;
  }
};

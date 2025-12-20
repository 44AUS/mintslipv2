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

// Get template URL based on tax year
const getTemplateUrl = (taxYear) => {
  const year = parseInt(taxYear);
  return `/templates/w9-${year}.pdf`;
};

// Field positions for W-9 form (2018 revision for 2021-2023)
const FIELD_POSITIONS_2018 = {
  name: { x: 42, y: 656, fontSize: 11 },
  businessName: { x: 42, y: 620, fontSize: 10 },
  individual: { x: 48, y: 584, fontSize: 10 },
  ccorp: { x: 154, y: 584, fontSize: 10 },
  scorp: { x: 207, y: 584, fontSize: 10 },
  partnership: { x: 260, y: 584, fontSize: 10 },
  trust: { x: 330, y: 584, fontSize: 10 },
  llc: { x: 400, y: 584, fontSize: 10 },
  llcCode: { x: 492, y: 584, fontSize: 10 },
  other: { x: 48, y: 566, fontSize: 10 },
  otherText: { x: 100, y: 566, fontSize: 9 },
  exemptPayeeCode: { x: 505, y: 638, fontSize: 9 },
  fatcaCode: { x: 505, y: 615, fontSize: 9 },
  address: { x: 42, y: 524, fontSize: 10 },
  cityStateZip: { x: 42, y: 490, fontSize: 10 },
  accountNumbers: { x: 42, y: 456, fontSize: 9 },
  ssn1: { x: 345, y: 430, fontSize: 14 },
  ssn2: { x: 390, y: 430, fontSize: 14 },
  ssn3: { x: 460, y: 430, fontSize: 14 },
  ein1: { x: 345, y: 400, fontSize: 14 },
  ein2: { x: 420, y: 400, fontSize: 14 },
  signatureDate: { x: 470, y: 260, fontSize: 10 }
};

// Field positions for W-9 form (2024 revision)
const FIELD_POSITIONS_2024 = {
  name: { x: 42, y: 640, fontSize: 11 },
  businessName: { x: 42, y: 600, fontSize: 10 },
  individual: { x: 48, y: 564, fontSize: 10 },
  ccorp: { x: 154, y: 564, fontSize: 10 },
  scorp: { x: 207, y: 564, fontSize: 10 },
  partnership: { x: 260, y: 564, fontSize: 10 },
  trust: { x: 330, y: 564, fontSize: 10 },
  llc: { x: 400, y: 564, fontSize: 10 },
  llcCode: { x: 492, y: 564, fontSize: 10 },
  other: { x: 48, y: 546, fontSize: 10 },
  otherText: { x: 100, y: 546, fontSize: 9 },
  exemptPayeeCode: { x: 505, y: 618, fontSize: 9 },
  fatcaCode: { x: 505, y: 595, fontSize: 9 },
  address: { x: 42, y: 498, fontSize: 10 },
  cityStateZip: { x: 42, y: 464, fontSize: 10 },
  accountNumbers: { x: 42, y: 430, fontSize: 9 },
  ssn1: { x: 345, y: 398, fontSize: 14 },
  ssn2: { x: 390, y: 398, fontSize: 14 },
  ssn3: { x: 460, y: 398, fontSize: 14 },
  ein1: { x: 345, y: 368, fontSize: 14 },
  ein2: { x: 420, y: 368, fontSize: 14 },
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
    drawText(formData.name, FIELD_POSITIONS.name, true);
    drawText(formData.businessName, FIELD_POSITIONS.businessName);
    
    // Tax classification
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
    
    // Address
    drawText(formData.address, FIELD_POSITIONS.address);
    
    // City, State, ZIP
    const cityStateZip = [formData.city, formData.state, formData.zipCode].filter(Boolean).join(", ");
    drawText(cityStateZip, FIELD_POSITIONS.cityStateZip);
    
    // Account numbers
    drawText(formData.accountNumbers, FIELD_POSITIONS.accountNumbers);
    
    // TIN
    if (formData.tinType === "ssn" && formData.ssn) {
      const ssnParts = formData.ssn.replace(/-/g, "").match(/.{1,3}/g) || [];
      if (ssnParts[0]) drawText(ssnParts[0], FIELD_POSITIONS.ssn1);
      if (ssnParts[1]) drawText(ssnParts[1], FIELD_POSITIONS.ssn2);
      if (ssnParts[2]) drawText(ssnParts[2], FIELD_POSITIONS.ssn3);
    } else if (formData.tinType === "ein" && formData.ein) {
      const einParts = formData.ein.split("-");
      if (einParts[0]) drawText(einParts[0], FIELD_POSITIONS.ein1);
      if (einParts[1]) drawText(einParts[1], FIELD_POSITIONS.ein2);
    }
    
    // Date
    drawText(formData.signatureDate, FIELD_POSITIONS.signatureDate);
    
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

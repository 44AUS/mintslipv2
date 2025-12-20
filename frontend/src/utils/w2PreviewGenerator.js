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

// Format currency without dollar sign for W-2
const formatCurrency = (amount) => {
  const num = parseFloat(amount) || 0;
  if (num === 0) return "";
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// Template mapping for tax years
// const getTemplateUrl = (taxYear) => {
//   const year = parseInt(taxYear);
//   if (year >= 2025) {
//     return "/templates/w2-2025.pdf";
//   }
//   return "/templates/w2-2024.pdf";
// };

const getTemplateUrl = (taxYear) => {
  const year = parseInt(taxYear);
  return `/templates/w2-${year}.pdf`;
};


// Field positions matching the main generator
// Page size: 612 x 792 points
const FIELD_POSITIONS = {
  employeeSSN: { x: 175, y: 736, fontSize: 11 },
  employerEIN: { x: 55, y: 712, fontSize: 10 },
  employerName: { x: 55, y: 685, fontSize: 9 },
  employerAddress: { x: 55, y: 675, fontSize: 9 },
  employerCityStateZip: { x: 55, y: 665, fontSize: 9 },
  controlNumber: { x: 55, y: 617, fontSize: 9 },
  employeeFirstName: { x: 55, y: 592, fontSize: 10 },
  employeeLastName: { x: 180, y: 592, fontSize: 10 },
  employeeAddress: { x: 55, y: 530, fontSize: 9 },
  employeeCityStateZip: { x: 55, y: 515, fontSize: 9 },
  box1: { x: 360, y: 713, fontSize: 10, align: 'right', width: 90 },
  box2: { x: 490, y: 713, fontSize: 10, align: 'right', width: 85 },
  box3: { x: 360, y: 690, fontSize: 10, align: 'right', width: 90 },
  box4: { x: 490, y: 690, fontSize: 10, align: 'right', width: 85 },
  box5: { x: 360, y: 665, fontSize: 10, align: 'right', width: 90 },
  box6: { x: 490, y: 665, fontSize: 10, align: 'right', width: 85 },
  box7: { x: 360, y: 640, fontSize: 10, align: 'right', width: 90 },
  box8: { x: 490, y: 640, fontSize: 10, align: 'right', width: 85 },
  box9: { x: 360, y: 618, fontSize: 10 },
  box10: { x: 490, y: 618, fontSize: 10, align: 'right', width: 85 },
  box11: { x: 360, y: 592, fontSize: 10, align: 'right', width: 90 },
  box12aCode: { x: 470, y: 592, fontSize: 9 },
  box12aAmount: { x: 515, y: 592, fontSize: 9, align: 'right', width: 75 },
  box12bCode: { x: 470, y: 568, fontSize: 9 },
  box12bAmount: { x: 515, y: 568, fontSize: 9, align: 'right', width: 75 },
  box12cCode: { x: 470, y: 544, fontSize: 9 },
  box12cAmount: { x: 515, y: 544, fontSize: 9, align: 'right', width: 75 },
  box12dCode: { x: 470, y: 520, fontSize: 9 },
  box12dAmount: { x: 515, y: 520, fontSize: 9, align: 'right', width: 75 },
  box13Statutory: { x: 350, y: 568, fontSize: 10 },
  box13Retirement: { x: 385, y: 568, fontSize: 10 },
  box13ThirdParty: { x: 422, y: 568, fontSize: 10 },
  box14: { x: 345, y: 540, fontSize: 8 },
  state: { x: 50, y: 485, fontSize: 9 },
  employerStateId: { x: 85, y: 485, fontSize: 8 },
  box16: { x: 210, y: 485, fontSize: 9, align: 'right', width: 70 },
  box17: { x: 295, y: 485, fontSize: 9, align: 'right', width: 60 },
  box18: { x: 375, y: 485, fontSize: 9, align: 'right', width: 70 },
  box19: { x: 460, y: 485, fontSize: 9, align: 'right', width: 60 },
  box20: { x: 540, y: 485, fontSize: 8 },
};

// Generate W-2 preview with watermark
export const generateW2Preview = async (formData, taxYear) => {
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
      if (!text || text === "none") return;
      const textStr = String(text);
      const selectedFont = useBold ? boldFont : font;
      const fontSize = position.fontSize || 10;
      
      let xPos = position.x;
      
      if (position.align === 'right' && position.width) {
        const textWidth = selectedFont.widthOfTextAtSize(textStr, fontSize);
        xPos = position.x + position.width - textWidth;
      }
      
      page.drawText(textStr, {
        x: xPos,
        y: position.y,
        size: fontSize,
        font: selectedFont,
        color: rgb(0, 0, 0),
      });
    };
    
    // Fill in the form fields
    drawText(formData.employeeSSN, FIELD_POSITIONS.employeeSSN, true);
    drawText(formData.employerEIN, FIELD_POSITIONS.employerEIN);
    drawText(formData.employerName, FIELD_POSITIONS.employerName, true);
    drawText(formData.employerAddress, FIELD_POSITIONS.employerAddress);
    
    const employerCityStateZip = [
      formData.employerCity,
      formData.employerState,
      formData.employerZip
    ].filter(Boolean).join(", ");
    drawText(employerCityStateZip, FIELD_POSITIONS.employerCityStateZip);
    
    drawText(formData.controlNumber, FIELD_POSITIONS.controlNumber);
    
    const firstName = [formData.employeeFirstName, formData.employeeMiddleInitial].filter(Boolean).join(" ");
    drawText(firstName, FIELD_POSITIONS.employeeFirstName, true);
    drawText(formData.employeeLastName, FIELD_POSITIONS.employeeLastName, true);
    
    drawText(formData.employeeAddress, FIELD_POSITIONS.employeeAddress);
    const employeeCityStateZip = [
      formData.employeeCity,
      formData.employeeState,
      formData.employeeZip
    ].filter(Boolean).join(", ");
    drawText(employeeCityStateZip, FIELD_POSITIONS.employeeCityStateZip);
    
    // Wage/tax boxes
    drawText(formatCurrency(formData.wagesTips), FIELD_POSITIONS.box1);
    drawText(formatCurrency(formData.federalTaxWithheld), FIELD_POSITIONS.box2);
    drawText(formatCurrency(formData.socialSecurityWages), FIELD_POSITIONS.box3);
    drawText(formatCurrency(formData.socialSecurityTax), FIELD_POSITIONS.box4);
    drawText(formatCurrency(formData.medicareWages), FIELD_POSITIONS.box5);
    drawText(formatCurrency(formData.medicareTax), FIELD_POSITIONS.box6);
    drawText(formatCurrency(formData.socialSecurityTips), FIELD_POSITIONS.box7);
    drawText(formatCurrency(formData.allocatedTips), FIELD_POSITIONS.box8);
    drawText(formatCurrency(formData.dependentCareBenefits), FIELD_POSITIONS.box10);
    drawText(formatCurrency(formData.nonqualifiedPlans), FIELD_POSITIONS.box11);
    
    // Box 12
    if (formData.box12aCode && formData.box12aCode !== "none") {
      drawText(formData.box12aCode, FIELD_POSITIONS.box12aCode);
      drawText(formatCurrency(formData.box12aAmount), FIELD_POSITIONS.box12aAmount);
    }
    if (formData.box12bCode && formData.box12bCode !== "none") {
      drawText(formData.box12bCode, FIELD_POSITIONS.box12bCode);
      drawText(formatCurrency(formData.box12bAmount), FIELD_POSITIONS.box12bAmount);
    }
    if (formData.box12cCode && formData.box12cCode !== "none") {
      drawText(formData.box12cCode, FIELD_POSITIONS.box12cCode);
      drawText(formatCurrency(formData.box12cAmount), FIELD_POSITIONS.box12cAmount);
    }
    if (formData.box12dCode && formData.box12dCode !== "none") {
      drawText(formData.box12dCode, FIELD_POSITIONS.box12dCode);
      drawText(formatCurrency(formData.box12dAmount), FIELD_POSITIONS.box12dAmount);
    }
    
    // Box 13 checkboxes
    if (formData.statutoryEmployee) drawText("X", FIELD_POSITIONS.box13Statutory, true);
    if (formData.retirementPlan) drawText("X", FIELD_POSITIONS.box13Retirement, true);
    if (formData.thirdPartySickPay) drawText("X", FIELD_POSITIONS.box13ThirdParty, true);
    
    // Box 14
    drawText(formData.other, FIELD_POSITIONS.box14);
    
    // State/Local
    drawText(formData.state, FIELD_POSITIONS.state);
    drawText(formData.employerStateId, FIELD_POSITIONS.employerStateId);
    drawText(formatCurrency(formData.stateWages), FIELD_POSITIONS.box16);
    drawText(formatCurrency(formData.stateIncomeTax), FIELD_POSITIONS.box17);
    drawText(formatCurrency(formData.localWages), FIELD_POSITIONS.box18);
    drawText(formatCurrency(formData.localIncomeTax), FIELD_POSITIONS.box19);
    drawText(formData.localityName, FIELD_POSITIONS.box20);
    
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
    console.error("Error generating W-2 preview:", error);
    throw error;
  }
};

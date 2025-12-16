import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

// Format currency without dollar sign for W-2
const formatCurrency = (amount) => {
  const num = parseFloat(amount) || 0;
  if (num === 0) return "";
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// Template mapping for tax years
const getTemplateUrl = (taxYear) => {
  const year = parseInt(taxYear);
  if (year >= 2025) {
    return "/templates/w2-2025.pdf";
  }
  return "/templates/w2-2024.pdf";
};

// Field positions matching the main generator
const FIELD_POSITIONS = {
  employeeSSN: { x: 48, y: 728, fontSize: 10 },
  employerEIN: { x: 48, y: 695, fontSize: 10 },
  employerName: { x: 48, y: 665, fontSize: 9 },
  employerAddress: { x: 48, y: 653, fontSize: 9 },
  employerCityStateZip: { x: 48, y: 641, fontSize: 9 },
  controlNumber: { x: 48, y: 608, fontSize: 9 },
  employeeName: { x: 48, y: 575, fontSize: 10 },
  employeeAddress: { x: 48, y: 530, fontSize: 9 },
  employeeCityStateZip: { x: 48, y: 518, fontSize: 9 },
  box1: { x: 340, y: 695, fontSize: 10 },
  box2: { x: 480, y: 695, fontSize: 10 },
  box3: { x: 340, y: 665, fontSize: 10 },
  box4: { x: 480, y: 665, fontSize: 10 },
  box5: { x: 340, y: 635, fontSize: 10 },
  box6: { x: 480, y: 635, fontSize: 10 },
  box7: { x: 340, y: 608, fontSize: 10 },
  box8: { x: 480, y: 608, fontSize: 10 },
  box9: { x: 340, y: 578, fontSize: 10 },
  box10: { x: 480, y: 578, fontSize: 10 },
  box11: { x: 340, y: 548, fontSize: 10 },
  box12aCode: { x: 480, y: 548, fontSize: 9 },
  box12aAmount: { x: 520, y: 548, fontSize: 9 },
  box12bCode: { x: 480, y: 525, fontSize: 9 },
  box12bAmount: { x: 520, y: 525, fontSize: 9 },
  box12cCode: { x: 480, y: 502, fontSize: 9 },
  box12cAmount: { x: 520, y: 502, fontSize: 9 },
  box12dCode: { x: 480, y: 479, fontSize: 9 },
  box12dAmount: { x: 520, y: 479, fontSize: 9 },
  box13Statutory: { x: 344, y: 518, fontSize: 10 },
  box13Retirement: { x: 344, y: 502, fontSize: 10 },
  box13ThirdParty: { x: 344, y: 486, fontSize: 10 },
  box14: { x: 340, y: 455, fontSize: 8 },
  state: { x: 48, y: 470, fontSize: 9 },
  employerStateId: { x: 85, y: 470, fontSize: 8 },
  box16: { x: 200, y: 470, fontSize: 9 },
  box17: { x: 280, y: 470, fontSize: 9 },
  box18: { x: 360, y: 470, fontSize: 9 },
  box19: { x: 440, y: 470, fontSize: 9 },
  box20: { x: 520, y: 470, fontSize: 8 },
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
      page.drawText(String(text), {
        x: position.x,
        y: position.y,
        size: position.fontSize || 10,
        font: useBold ? boldFont : font,
        color: rgb(0, 0, 0),
      });
    };
    
    // Fill in the form fields (same as main generator)
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
    
    const employeeName = [
      formData.employeeFirstName,
      formData.employeeMiddleInitial,
      formData.employeeLastName
    ].filter(Boolean).join(" ");
    drawText(employeeName, FIELD_POSITIONS.employeeName, true);
    
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
    
    // Add WATERMARK
    const watermarkText = "MintSlip";
    const watermarkSize = 72;
    
    // Draw diagonal watermark across the page
    page.drawText(watermarkText, {
      x: width / 2 - 120,
      y: height / 2 - 20,
      size: watermarkSize,
      font: boldFont,
      color: rgb(0.85, 0.85, 0.85),
      rotate: { type: 'degrees', angle: -35 },
      opacity: 0.4,
    });
    
    // Add smaller watermarks
    page.drawText("PREVIEW", {
      x: width / 2 - 60,
      y: height / 2 - 60,
      size: 24,
      font: boldFont,
      color: rgb(0.85, 0.85, 0.85),
      rotate: { type: 'degrees', angle: -35 },
      opacity: 0.4,
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
    console.error("Error generating W-2 preview:", error);
    throw error;
  }
};

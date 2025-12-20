import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

// Box 12 codes
export const BOX_12_CODES = [
  { code: "none", label: "None" },
  { code: "A", label: "A - Uncollected social security or RRTA tax on tips" },
  { code: "B", label: "B - Uncollected Medicare tax on tips" },
  { code: "C", label: "C - Taxable cost of group-term life insurance over $50,000" },
  { code: "D", label: "D - Elective deferrals to 401(k)" },
  { code: "E", label: "E - Elective deferrals to 403(b)" },
  { code: "F", label: "F - Elective deferrals to 408(k)(6) SEP" },
  { code: "G", label: "G - Elective deferrals to 457(b)" },
  { code: "H", label: "H - Elective deferrals to 501(c)(18)(D)" },
  { code: "J", label: "J - Nontaxable sick pay" },
  { code: "K", label: "K - 20% excise tax on excess golden parachute" },
  { code: "L", label: "L - Substantiated employee business expense reimbursements" },
  { code: "M", label: "M - Uncollected social security or RRTA tax on group-term life insurance" },
  { code: "N", label: "N - Uncollected Medicare tax on group-term life insurance" },
  { code: "P", label: "P - Excludable moving expense reimbursements" },
  { code: "Q", label: "Q - Nontaxable combat pay" },
  { code: "R", label: "R - Employer contributions to Archer MSA" },
  { code: "S", label: "S - Employee salary reduction contributions to 408(p) SIMPLE" },
  { code: "T", label: "T - Adoption benefits" },
  { code: "V", label: "V - Income from exercise of nonstatutory stock option(s)" },
  { code: "W", label: "W - Employer contributions to HSA" },
  { code: "Y", label: "Y - Deferrals under 409A nonqualified deferred compensation plan" },
  { code: "Z", label: "Z - Income under 409A nonqualified deferred compensation plan" },
  { code: "AA", label: "AA - Designated Roth contributions to 401(k)" },
  { code: "BB", label: "BB - Designated Roth contributions to 403(b)" },
  { code: "DD", label: "DD - Cost of employer-sponsored health coverage" },
  { code: "EE", label: "EE - Designated Roth contributions to governmental 457(b)" },
  { code: "FF", label: "FF - Permitted benefits under qualified small employer HRA" },
  { code: "GG", label: "GG - Income from qualified equity grants under section 83(i)" },
  { code: "HH", label: "HH - Aggregate deferrals under section 83(i) elections" },
];

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


// Field positions on the PDF - coordinates are from bottom-left (PDF standard)
// Page size: 612 x 792 points
// Form is in top half of page, labels analyzed with y_top (from top), converted to y (from bottom)
const FIELD_POSITIONS = {
  // Box a - Employee SSN (y_top ~37-50)
  employeeSSN: { x: 175, y: 742, fontSize: 11 },
  
  // Box b - Employer EIN (y_top ~61-75)
  employerEIN: { x: 55, y: 715, fontSize: 10 },
  
  // Box c - Employer info (y_top ~85-150)
  employerName: { x: 55, y: 695, fontSize: 9 },
  employerAddress: { x: 55, y: 680, fontSize: 9 },
  employerCityStateZip: { x: 55, y: 665, fontSize: 9 },
  
  // Box d - Control number (y_top ~157-170)
  controlNumber: { x: 55, y: 622, fontSize: 9 },
  
  // Box e - Employee name (y_top ~181-200)
  employeeFirstName: { x: 55, y: 592, fontSize: 10 },
  employeeLastName: { x: 180, y: 592, fontSize: 10 },
  
  // Box f - Employee address (y_top ~277-290)
  employeeAddress: { x: 55, y: 530, fontSize: 9 },
  employeeCityStateZip: { x: 55, y: 515, fontSize: 9 },
  
  // Right side - Wage/Tax boxes
  // Box 1 & 2 (y_top ~61-75)
  box1: { x: 385, y: 715, fontSize: 10, align: 'right', width: 90 },
  box2: { x: 515, y: 715, fontSize: 10, align: 'right', width: 85 },
  
  // Box 3 & 4 (y_top ~85-100)
  box3: { x: 385, y: 690, fontSize: 10, align: 'right', width: 90 },
  box4: { x: 515, y: 690, fontSize: 10, align: 'right', width: 85 },
  
  // Box 5 & 6 (y_top ~109-125)
  box5: { x: 385, y: 665, fontSize: 10, align: 'right', width: 90 },
  box6: { x: 515, y: 665, fontSize: 10, align: 'right', width: 85 },
  
  // Box 7 & 8 (y_top ~133-150)
  box7: { x: 385, y: 640, fontSize: 10, align: 'right', width: 90 },
  box8: { x: 515, y: 640, fontSize: 10, align: 'right', width: 85 },
  
  // Box 9 & 10 (y_top ~157-173)
  box9: { x: 385, y: 618, fontSize: 10 },
  box10: { x: 515, y: 618, fontSize: 10, align: 'right', width: 85 },
  
  // Box 11 (y_top ~181-200)
  box11: { x: 385, y: 592, fontSize: 10, align: 'right', width: 90 },
  
  // Box 12 codes and amounts (y_top ~181-275)
  box12aCode: { x: 470, y: 592, fontSize: 9 },
  box12aAmount: { x: 515, y: 592, fontSize: 9, align: 'right', width: 75 },
  box12bCode: { x: 470, y: 568, fontSize: 9 },
  box12bAmount: { x: 515, y: 568, fontSize: 9, align: 'right', width: 75 },
  box12cCode: { x: 470, y: 544, fontSize: 9 },
  box12cAmount: { x: 515, y: 544, fontSize: 9, align: 'right', width: 75 },
  box12dCode: { x: 470, y: 520, fontSize: 9 },
  box12dAmount: { x: 515, y: 520, fontSize: 9, align: 'right', width: 75 },
  
  // Box 13 checkboxes (y_top ~205-216)
  box13Statutory: { x: 358, y: 575, fontSize: 10 },
  box13Retirement: { x: 398, y: 575, fontSize: 10 },
  box13ThirdParty: { x: 438, y: 575, fontSize: 10 },
  
  // Box 14 - Other (y_top ~229-240)
  box14: { x: 345, y: 550, fontSize: 8 },
  
  // State/Local section (Boxes 15-20) - (y_top ~289-310)
  state: { x: 55, y: 494, fontSize: 9 },
  employerStateId: { x: 85, y: 494, fontSize: 8 },
  box16: { x: 210, y: 494, fontSize: 9, align: 'right', width: 70 },
  box17: { x: 295, y: 494, fontSize: 9, align: 'right', width: 60 },
  box18: { x: 375, y: 494, fontSize: 9, align: 'right', width: 70 },
  box19: { x: 460, y: 494, fontSize: 9, align: 'right', width: 60 },
  box20: { x: 540, y: 494, fontSize: 8 },
};

// Generate W-2 by filling in PDF template
export const generateW2PDF = async (formData, taxYear) => {
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
      if (!text || text === "none") return;
      const textStr = String(text);
      const selectedFont = useBold ? boldFont : font;
      const fontSize = position.fontSize || 10;
      
      let xPos = position.x;
      
      // Handle right alignment
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
    
    // Box a - Employee SSN
    drawText(formData.employeeSSN, FIELD_POSITIONS.employeeSSN, true);
    
    // Box b - Employer EIN
    drawText(formData.employerEIN, FIELD_POSITIONS.employerEIN);
    
    // Box c - Employer name and address
    drawText(formData.employerName, FIELD_POSITIONS.employerName, true);
    drawText(formData.employerAddress, FIELD_POSITIONS.employerAddress);
    const employerCityStateZip = [
      formData.employerCity,
      formData.employerState,
      formData.employerZip
    ].filter(Boolean).join(", ");
    drawText(employerCityStateZip, FIELD_POSITIONS.employerCityStateZip);
    
    // Box d - Control number
    drawText(formData.controlNumber, FIELD_POSITIONS.controlNumber);
    
    // Box e - Employee name
    const firstName = [formData.employeeFirstName, formData.employeeMiddleInitial].filter(Boolean).join(" ");
    drawText(firstName, FIELD_POSITIONS.employeeFirstName, true);
    drawText(formData.employeeLastName, FIELD_POSITIONS.employeeLastName, true);
    
    // Box f - Employee address
    drawText(formData.employeeAddress, FIELD_POSITIONS.employeeAddress);
    const employeeCityStateZip = [
      formData.employeeCity,
      formData.employeeState,
      formData.employeeZip
    ].filter(Boolean).join(", ");
    drawText(employeeCityStateZip, FIELD_POSITIONS.employeeCityStateZip);
    
    // Boxes 1-6 - Main wage/tax boxes
    drawText(formatCurrency(formData.wagesTips), FIELD_POSITIONS.box1);
    drawText(formatCurrency(formData.federalTaxWithheld), FIELD_POSITIONS.box2);
    drawText(formatCurrency(formData.socialSecurityWages), FIELD_POSITIONS.box3);
    drawText(formatCurrency(formData.socialSecurityTax), FIELD_POSITIONS.box4);
    drawText(formatCurrency(formData.medicareWages), FIELD_POSITIONS.box5);
    drawText(formatCurrency(formData.medicareTax), FIELD_POSITIONS.box6);
    
    // Boxes 7-11
    drawText(formatCurrency(formData.socialSecurityTips), FIELD_POSITIONS.box7);
    drawText(formatCurrency(formData.allocatedTips), FIELD_POSITIONS.box8);
    drawText(formatCurrency(formData.dependentCareBenefits), FIELD_POSITIONS.box10);
    drawText(formatCurrency(formData.nonqualifiedPlans), FIELD_POSITIONS.box11);
    
    // Box 12 a-d
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
    if (formData.statutoryEmployee) {
      drawText("X", FIELD_POSITIONS.box13Statutory, true);
    }
    if (formData.retirementPlan) {
      drawText("X", FIELD_POSITIONS.box13Retirement, true);
    }
    if (formData.thirdPartySickPay) {
      drawText("X", FIELD_POSITIONS.box13ThirdParty, true);
    }
    
    // Box 14 - Other
    drawText(formData.other, FIELD_POSITIONS.box14);
    
    // Boxes 15-20 - State/Local
    drawText(formData.state, FIELD_POSITIONS.state);
    drawText(formData.employerStateId, FIELD_POSITIONS.employerStateId);
    drawText(formatCurrency(formData.stateWages), FIELD_POSITIONS.box16);
    drawText(formatCurrency(formData.stateIncomeTax), FIELD_POSITIONS.box17);
    drawText(formatCurrency(formData.localWages), FIELD_POSITIONS.box18);
    drawText(formatCurrency(formData.localIncomeTax), FIELD_POSITIONS.box19);
    drawText(formData.localityName, FIELD_POSITIONS.box20);
    
    // Save the PDF
    const pdfBytes = await pdfDoc.save();
    return pdfBytes;
    
  } catch (error) {
    console.error("Error generating W-2 PDF:", error);
    throw error;
  }
};

// Generate and download W-2
export const generateAndDownloadW2 = async (formData, taxYear) => {
  try {
    const pdfBytes = await generateW2PDF(formData, taxYear);
    
    // Create blob and download
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.href = url;
    link.download = `W2_${taxYear}_${formData.employeeLastName || 'Employee'}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
    return true;
  } catch (error) {
    console.error("Error downloading W-2:", error);
    throw error;
  }
};

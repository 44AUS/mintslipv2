import { jsPDF } from "jspdf";

// W-2 Box definitions
export const W2_BOXES = {
  box1: { label: "Wages, tips, other compensation", key: "wagesTips" },
  box2: { label: "Federal income tax withheld", key: "federalTaxWithheld" },
  box3: { label: "Social security wages", key: "socialSecurityWages" },
  box4: { label: "Social security tax withheld", key: "socialSecurityTax" },
  box5: { label: "Medicare wages and tips", key: "medicareWages" },
  box6: { label: "Medicare tax withheld", key: "medicareTax" },
  box7: { label: "Social security tips", key: "socialSecurityTips" },
  box8: { label: "Allocated tips", key: "allocatedTips" },
  box10: { label: "Dependent care benefits", key: "dependentCareBenefits" },
  box11: { label: "Nonqualified plans", key: "nonqualifiedPlans" },
  box12a: { label: "12a Code", key: "box12aCode" },
  box12aAmt: { label: "12a Amount", key: "box12aAmount" },
  box12b: { label: "12b Code", key: "box12bCode" },
  box12bAmt: { label: "12b Amount", key: "box12bAmount" },
  box12c: { label: "12c Code", key: "box12cCode" },
  box12cAmt: { label: "12c Amount", key: "box12cAmount" },
  box12d: { label: "12d Code", key: "box12dCode" },
  box12dAmt: { label: "12d Amount", key: "box12dAmount" },
  box13Statutory: { label: "Statutory employee", key: "statutoryEmployee" },
  box13Retirement: { label: "Retirement plan", key: "retirementPlan" },
  box13ThirdParty: { label: "Third-party sick pay", key: "thirdPartySickPay" },
  box14: { label: "Other", key: "other" },
  box15State: { label: "State", key: "state" },
  box15EIN: { label: "Employer's state ID number", key: "employerStateId" },
  box16: { label: "State wages, tips, etc.", key: "stateWages" },
  box17: { label: "State income tax", key: "stateIncomeTax" },
  box18: { label: "Local wages, tips, etc.", key: "localWages" },
  box19: { label: "Local income tax", key: "localIncomeTax" },
  box20: { label: "Locality name", key: "localityName" },
};

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

// Format currency
const formatCurrency = (amount) => {
  const num = parseFloat(amount) || 0;
  if (num === 0) return "";
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// Generate W-2 PDF matching IRS format
export const generateW2PDF = (formData, taxYear) => {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 25;
  const formWidth = pageWidth - 2 * margin;
  
  // Draw the W-2 form
  drawIRSW2Form(doc, formData, taxYear, margin, formWidth);

  return doc;
};

// Draw the official IRS W-2 form layout
function drawIRSW2Form(doc, data, taxYear, margin, formWidth) {
  const rowHeight = 28;
  const smallRowHeight = 24;
  let y = margin;
  
  // Column widths based on IRS layout (left section ~60%, right section ~40%)
  const leftColWidth = formWidth * 0.55;
  const rightColWidth = formWidth * 0.45;
  const halfRightCol = rightColWidth / 2;
  
  // Colors
  const boxBorderColor = [0, 0, 0];
  const labelColor = [0, 0, 0];
  
  doc.setDrawColor(...boxBorderColor);
  doc.setLineWidth(0.5);
  
  // === TOP ROW: Control number placeholder & OMB ===
  const topRowHeight = 22;
  
  // Void checkbox area (small)
  doc.rect(margin, y, 40, topRowHeight);
  doc.setFontSize(6);
  doc.setFont("helvetica", "normal");
  doc.text("22222", margin + 5, y + 8);
  doc.rect(margin + 8, y + 10, 6, 6);
  doc.setFontSize(5);
  doc.text("Void", margin + 16, y + 15);
  
  // Box a - Employee's SSN
  const ssnBoxWidth = leftColWidth - 50;
  doc.rect(margin + 45, y, ssnBoxWidth, topRowHeight);
  doc.setFontSize(6);
  doc.text("a  Employee's social security number", margin + 48, y + 7);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(data.employeeSSN || "", margin + 50, y + 18);
  
  // OMB Number
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text("OMB No. 1545-0008", margin + leftColWidth + 5, y + 10);
  
  y += topRowHeight;
  
  // === ROW 1: EIN + Box 1 + Box 2 ===
  // Box b - Employer EIN
  doc.rect(margin, y, leftColWidth, rowHeight);
  doc.setFontSize(6);
  doc.setFont("helvetica", "normal");
  doc.text("b  Employer identification number (EIN)", margin + 3, y + 7);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(data.employerEIN || "", margin + 5, y + 20);
  
  // Box 1 - Wages
  const rightX = margin + leftColWidth;
  doc.rect(rightX, y, halfRightCol, rowHeight);
  doc.setFontSize(6);
  doc.setFont("helvetica", "normal");
  doc.text("1  Wages, tips, other compensation", rightX + 3, y + 7);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(formatCurrency(data.wagesTips), rightX + halfRightCol - 5, y + 20, { align: "right" });
  
  // Box 2 - Federal tax withheld
  doc.rect(rightX + halfRightCol, y, halfRightCol, rowHeight);
  doc.setFontSize(6);
  doc.setFont("helvetica", "normal");
  doc.text("2  Federal income tax withheld", rightX + halfRightCol + 3, y + 7);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(formatCurrency(data.federalTaxWithheld), rightX + rightColWidth - 5, y + 20, { align: "right" });
  
  y += rowHeight;
  
  // === ROW 2: Employer Name + Box 3 + Box 4 ===
  const employerBoxHeight = rowHeight * 2;
  
  // Box c - Employer's name, address
  doc.rect(margin, y, leftColWidth, employerBoxHeight);
  doc.setFontSize(6);
  doc.setFont("helvetica", "normal");
  doc.text("c  Employer's name, address, and ZIP code", margin + 3, y + 7);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  
  // Draw employer info
  let employerY = y + 16;
  if (data.employerName) {
    doc.text(data.employerName, margin + 5, employerY);
    employerY += 10;
  }
  if (data.employerAddress) {
    doc.text(data.employerAddress, margin + 5, employerY);
    employerY += 10;
  }
  const cityStateZip = `${data.employerCity || ""}${data.employerCity && data.employerState ? ", " : ""}${data.employerState || ""} ${data.employerZip || ""}`.trim();
  if (cityStateZip) {
    doc.text(cityStateZip, margin + 5, employerY);
  }
  
  // Box 3 - Social security wages
  doc.rect(rightX, y, halfRightCol, rowHeight);
  doc.setFontSize(6);
  doc.setFont("helvetica", "normal");
  doc.text("3  Social security wages", rightX + 3, y + 7);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(formatCurrency(data.socialSecurityWages), rightX + halfRightCol - 5, y + 20, { align: "right" });
  
  // Box 4 - Social security tax withheld
  doc.rect(rightX + halfRightCol, y, halfRightCol, rowHeight);
  doc.setFontSize(6);
  doc.setFont("helvetica", "normal");
  doc.text("4  Social security tax withheld", rightX + halfRightCol + 3, y + 7);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(formatCurrency(data.socialSecurityTax), rightX + rightColWidth - 5, y + 20, { align: "right" });
  
  y += rowHeight;
  
  // === ROW 3: (still employer box) + Box 5 + Box 6 ===
  // Box 5 - Medicare wages
  doc.rect(rightX, y, halfRightCol, rowHeight);
  doc.setFontSize(6);
  doc.setFont("helvetica", "normal");
  doc.text("5  Medicare wages and tips", rightX + 3, y + 7);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(formatCurrency(data.medicareWages), rightX + halfRightCol - 5, y + 20, { align: "right" });
  
  // Box 6 - Medicare tax withheld
  doc.rect(rightX + halfRightCol, y, halfRightCol, rowHeight);
  doc.setFontSize(6);
  doc.setFont("helvetica", "normal");
  doc.text("6  Medicare tax withheld", rightX + halfRightCol + 3, y + 7);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(formatCurrency(data.medicareTax), rightX + rightColWidth - 5, y + 20, { align: "right" });
  
  y += rowHeight;
  
  // === ROW 4: Control number + Box 7 + Box 8 ===
  // Box d - Control number
  doc.rect(margin, y, leftColWidth, smallRowHeight);
  doc.setFontSize(6);
  doc.setFont("helvetica", "normal");
  doc.text("d  Control number", margin + 3, y + 7);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text(data.controlNumber || "", margin + 5, y + 18);
  
  // Box 7 - SS tips
  doc.rect(rightX, y, halfRightCol, smallRowHeight);
  doc.setFontSize(6);
  doc.setFont("helvetica", "normal");
  doc.text("7  Social security tips", rightX + 3, y + 7);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(formatCurrency(data.socialSecurityTips), rightX + halfRightCol - 5, y + 18, { align: "right" });
  
  // Box 8 - Allocated tips
  doc.rect(rightX + halfRightCol, y, halfRightCol, smallRowHeight);
  doc.setFontSize(6);
  doc.setFont("helvetica", "normal");
  doc.text("8  Allocated tips", rightX + halfRightCol + 3, y + 7);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(formatCurrency(data.allocatedTips), rightX + rightColWidth - 5, y + 18, { align: "right" });
  
  y += smallRowHeight;
  
  // === ROW 5: Employee name + Box 9 + Box 10 ===
  // Box e - Employee's name
  doc.rect(margin, y, leftColWidth, rowHeight);
  doc.setFontSize(6);
  doc.setFont("helvetica", "normal");
  doc.text("e  Employee's first name and initial", margin + 3, y + 7);
  doc.text("Last name", margin + leftColWidth * 0.45, y + 7);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  const firstName = `${data.employeeFirstName || ""} ${data.employeeMiddleInitial || ""}`.trim();
  doc.text(firstName, margin + 5, y + 20);
  doc.text(data.employeeLastName || "", margin + leftColWidth * 0.45, y + 20);
  
  // Box 9 - Blank/Verification code
  doc.rect(rightX, y, halfRightCol, smallRowHeight);
  doc.setFontSize(6);
  doc.setFont("helvetica", "normal");
  doc.text("9", rightX + 3, y + 7);
  
  // Box 10 - Dependent care benefits
  doc.rect(rightX + halfRightCol, y, halfRightCol, smallRowHeight);
  doc.setFontSize(6);
  doc.setFont("helvetica", "normal");
  doc.text("10  Dependent care benefits", rightX + halfRightCol + 3, y + 7);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(formatCurrency(data.dependentCareBenefits), rightX + rightColWidth - 5, y + 18, { align: "right" });
  
  y += rowHeight;
  
  // === ROW 6: Employee address part 1 + Box 11 + Box 12a ===
  const addressBoxHeight = rowHeight * 1.5;
  
  // Box f - Employee's address (spans 2 rows)
  doc.rect(margin, y, leftColWidth, addressBoxHeight);
  doc.setFontSize(6);
  doc.setFont("helvetica", "normal");
  doc.text("f  Employee's address and ZIP code", margin + 3, y + 7);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  
  let addrY = y + 17;
  if (data.employeeAddress) {
    doc.text(data.employeeAddress, margin + 5, addrY);
    addrY += 10;
  }
  const empCityStateZip = `${data.employeeCity || ""}${data.employeeCity && data.employeeState ? ", " : ""}${data.employeeState || ""} ${data.employeeZip || ""}`.trim();
  if (empCityStateZip) {
    doc.text(empCityStateZip, margin + 5, addrY);
  }
  
  // Box 11 - Nonqualified plans
  doc.rect(rightX, y, halfRightCol, smallRowHeight);
  doc.setFontSize(6);
  doc.setFont("helvetica", "normal");
  doc.text("11  Nonqualified plans", rightX + 3, y + 7);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(formatCurrency(data.nonqualifiedPlans), rightX + halfRightCol - 5, y + 18, { align: "right" });
  
  // Box 12a
  drawBox12Entry(doc, rightX + halfRightCol, y, halfRightCol, smallRowHeight, "12a", data.box12aCode, data.box12aAmount);
  
  y += smallRowHeight;
  
  // === ROW 7: (address continues) + See instructions + Box 12b ===
  // "See instructions for box 12" text
  doc.rect(rightX, y, halfRightCol, smallRowHeight);
  doc.setFontSize(5);
  doc.setFont("helvetica", "normal");
  doc.text("See instructions for box 12", rightX + 3, y + 10);
  
  // Box 12b
  drawBox12Entry(doc, rightX + halfRightCol, y, halfRightCol, smallRowHeight, "12b", data.box12bCode, data.box12bAmount);
  
  y += smallRowHeight + (addressBoxHeight - smallRowHeight * 2);
  
  // === ROW 8: Box 13 + Box 12c ===
  const box13Height = smallRowHeight * 2;
  
  // Box 13 - Checkboxes
  doc.rect(rightX, y, halfRightCol, box13Height);
  doc.setFontSize(6);
  doc.setFont("helvetica", "normal");
  doc.text("13", rightX + 3, y + 8);
  
  // Checkboxes
  drawCheckbox(doc, rightX + 5, y + 14, "Statutory employee", data.statutoryEmployee);
  drawCheckbox(doc, rightX + 5, y + 26, "Retirement plan", data.retirementPlan);
  drawCheckbox(doc, rightX + 5, y + 38, "Third-party sick pay", data.thirdPartySickPay);
  
  // Box 12c
  drawBox12Entry(doc, rightX + halfRightCol, y, halfRightCol, smallRowHeight, "12c", data.box12cCode, data.box12cAmount);
  
  // Box 12d (below 12c)
  drawBox12Entry(doc, rightX + halfRightCol, y + smallRowHeight, halfRightCol, smallRowHeight, "12d", data.box12dCode, data.box12dAmount);
  
  y += box13Height;
  
  // === ROW 9: Box 14 (Other) ===
  // Box 14 - Other (full width of left column)
  doc.rect(margin, y, leftColWidth + rightColWidth, rowHeight);
  doc.setFontSize(6);
  doc.setFont("helvetica", "normal");
  doc.text("14  Other", margin + 3, y + 7);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text(data.other || "", margin + 5, y + 20);
  
  y += rowHeight + 3;
  
  // === STATE/LOCAL TAX SECTION ===
  const stateRowHeight = 26;
  const col1 = formWidth * 0.08;  // State
  const col2 = formWidth * 0.17;  // Employer state ID
  const col3 = formWidth * 0.18;  // State wages
  const col4 = formWidth * 0.15;  // State income tax
  const col5 = formWidth * 0.18;  // Local wages  
  const col6 = formWidth * 0.12;  // Local income tax
  const col7 = formWidth * 0.12;  // Locality name
  
  // First state/local row
  let sx = margin;
  
  // Box 15 - State
  doc.rect(sx, y, col1, stateRowHeight);
  doc.setFontSize(5);
  doc.setFont("helvetica", "normal");
  doc.text("15 State", sx + 2, y + 6);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text(data.state || "", sx + 3, y + 18);
  sx += col1;
  
  // Employer's state ID number
  doc.rect(sx, y, col2, stateRowHeight);
  doc.setFontSize(5);
  doc.setFont("helvetica", "normal");
  doc.text("Employer's state ID number", sx + 2, y + 6);
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.text(data.employerStateId || "", sx + 3, y + 18);
  sx += col2;
  
  // Box 16 - State wages
  doc.rect(sx, y, col3, stateRowHeight);
  doc.setFontSize(5);
  doc.setFont("helvetica", "normal");
  doc.text("16 State wages, tips, etc.", sx + 2, y + 6);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text(formatCurrency(data.stateWages), sx + col3 - 3, y + 18, { align: "right" });
  sx += col3;
  
  // Box 17 - State income tax
  doc.rect(sx, y, col4, stateRowHeight);
  doc.setFontSize(5);
  doc.setFont("helvetica", "normal");
  doc.text("17 State income tax", sx + 2, y + 6);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text(formatCurrency(data.stateIncomeTax), sx + col4 - 3, y + 18, { align: "right" });
  sx += col4;
  
  // Box 18 - Local wages
  doc.rect(sx, y, col5, stateRowHeight);
  doc.setFontSize(5);
  doc.setFont("helvetica", "normal");
  doc.text("18 Local wages, tips, etc.", sx + 2, y + 6);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text(formatCurrency(data.localWages), sx + col5 - 3, y + 18, { align: "right" });
  sx += col5;
  
  // Box 19 - Local income tax
  doc.rect(sx, y, col6, stateRowHeight);
  doc.setFontSize(5);
  doc.setFont("helvetica", "normal");
  doc.text("19 Local income tax", sx + 2, y + 6);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text(formatCurrency(data.localIncomeTax), sx + col6 - 3, y + 18, { align: "right" });
  sx += col6;
  
  // Box 20 - Locality name
  doc.rect(sx, y, col7, stateRowHeight);
  doc.setFontSize(5);
  doc.setFont("helvetica", "normal");
  doc.text("20 Locality name", sx + 2, y + 6);
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.text(data.localityName || "", sx + 3, y + 18);
  
  y += stateRowHeight;
  
  // Second state/local row (empty, for additional states)
  sx = margin;
  doc.rect(sx, y, col1, stateRowHeight);
  sx += col1;
  doc.rect(sx, y, col2, stateRowHeight);
  sx += col2;
  doc.rect(sx, y, col3, stateRowHeight);
  sx += col3;
  doc.rect(sx, y, col4, stateRowHeight);
  sx += col4;
  doc.rect(sx, y, col5, stateRowHeight);
  sx += col5;
  doc.rect(sx, y, col6, stateRowHeight);
  sx += col6;
  doc.rect(sx, y, col7, stateRowHeight);
  
  y += stateRowHeight + 10;
  
  // === FOOTER ===
  // Form title bar
  doc.setFillColor(0, 0, 0);
  doc.rect(margin, y, formWidth, 18, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("Form", margin + 5, y + 12);
  doc.setFontSize(14);
  doc.text("W-2", margin + 28, y + 13);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("Wage and Tax Statement", margin + 60, y + 12);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(taxYear, margin + formWidth / 2 - 15, y + 13);
  doc.setFontSize(6);
  doc.setFont("helvetica", "normal");
  doc.text("Department of the Treasury—Internal Revenue Service", margin + formWidth - 5, y + 12, { align: "right" });
  
  y += 25;
  
  // Copy designation
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.text("Copy B—To Be Filed With Employee's FEDERAL Tax Return.", margin, y);
  y += 10;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6);
  doc.text("This information is being furnished to the Internal Revenue Service.", margin, y);
}

// Draw Box 12 entry (code + amount format)
function drawBox12Entry(doc, x, y, width, height, label, code, amount) {
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.rect(x, y, width, height);
  
  // Vertical divider for code section
  const codeWidth = 25;
  doc.line(x + codeWidth, y, x + codeWidth, y + height);
  
  // Label
  doc.setFontSize(5);
  doc.setFont("helvetica", "normal");
  doc.text(label, x + 3, y + 6);
  doc.text("Code", x + 3, y + 12);
  
  // Code value (skip if "none" or empty)
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  if (code && code !== "none") {
    doc.text(code, x + 5, y + height - 4);
  }
  
  // Amount
  if (amount) {
    doc.setFontSize(9);
    doc.text(formatCurrency(amount), x + width - 3, y + height - 4, { align: "right" });
  }
}

// Draw checkbox with label
function drawCheckbox(doc, x, y, label, checked) {
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.rect(x, y, 7, 7);
  
  if (checked) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("X", x + 1, y + 6);
  }
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6);
  doc.text(label, x + 10, y + 5);
}

// Generate and download W-2
export const generateAndDownloadW2 = async (formData, taxYear) => {
  try {
    const doc = generateW2PDF(formData, taxYear);
    
    const fileName = `W2_${taxYear}_${formData.employeeLastName || 'Employee'}.pdf`;
    doc.save(fileName);
    
    return true;
  } catch (error) {
    console.error("Error generating W-2:", error);
    throw error;
  }
};

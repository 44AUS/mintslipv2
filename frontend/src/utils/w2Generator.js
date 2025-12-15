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
  { code: "", label: "None" },
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
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// Generate W-2 PDF
export const generateW2PDF = (formData, taxYear) => {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 30;

  // Draw W-2 form
  drawW2Form(doc, formData, taxYear, margin, pageWidth, pageHeight);

  return doc;
};

// Draw the W-2 form
function drawW2Form(doc, data, taxYear, margin, pageWidth, pageHeight) {
  const boxHeight = 45;
  const smallBoxHeight = 35;
  let y = margin;

  // Header
  doc.setFillColor(0, 0, 0);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.rect(margin, y, pageWidth - 2 * margin, 25, "F");
  doc.text(`Form W-2 Wage and Tax Statement ${taxYear}`, pageWidth / 2, y + 17, { align: "center" });
  y += 35;

  doc.setTextColor(0, 0, 0);

  // Control number and year boxes (top row)
  const topBoxWidth = (pageWidth - 2 * margin - 10) / 2;
  
  // Box a - Employee's social security number
  drawLabeledBox(doc, margin, y, topBoxWidth, boxHeight, "a Employee's social security number", data.employeeSSN || "XXX-XX-XXXX");
  
  // OMB box
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text("OMB No. 1545-0008", margin + topBoxWidth + 15, y + 10);
  drawLabeledBox(doc, margin + topBoxWidth + 10, y, topBoxWidth, boxHeight, "Safe, accurate, FAST! Use efile", "");
  y += boxHeight + 5;

  // Employer info section
  const leftColWidth = (pageWidth - 2 * margin) * 0.6;
  const rightColWidth = (pageWidth - 2 * margin) * 0.4 - 5;

  // Box b - Employer identification number (EIN)
  drawLabeledBox(doc, margin, y, leftColWidth, boxHeight, "b Employer identification number (EIN)", data.employerEIN || "XX-XXXXXXX");
  
  // Box 1 - Wages, tips, other compensation
  drawLabeledBox(doc, margin + leftColWidth + 5, y, rightColWidth / 2 - 2, boxHeight, "1 Wages, tips, other compensation", formatCurrency(data.wagesTips));
  
  // Box 2 - Federal income tax withheld
  drawLabeledBox(doc, margin + leftColWidth + 5 + rightColWidth / 2, y, rightColWidth / 2, boxHeight, "2 Federal income tax withheld", formatCurrency(data.federalTaxWithheld));
  y += boxHeight + 2;

  // Box c - Employer's name, address, and ZIP code
  const employerAddress = `${data.employerName || "Employer Name"}\n${data.employerAddress || "123 Main St"}\n${data.employerCity || "City"}, ${data.employerState || "ST"} ${data.employerZip || "12345"}`;
  drawLabeledBox(doc, margin, y, leftColWidth, boxHeight * 1.5, "c Employer's name, address, and ZIP code", employerAddress, true);
  
  // Box 3 - Social security wages
  drawLabeledBox(doc, margin + leftColWidth + 5, y, rightColWidth / 2 - 2, boxHeight, "3 Social security wages", formatCurrency(data.socialSecurityWages));
  
  // Box 4 - Social security tax withheld
  drawLabeledBox(doc, margin + leftColWidth + 5 + rightColWidth / 2, y, rightColWidth / 2, boxHeight, "4 Social security tax withheld", formatCurrency(data.socialSecurityTax));
  y += boxHeight + 2;

  // Box 5 - Medicare wages and tips
  drawLabeledBox(doc, margin + leftColWidth + 5, y, rightColWidth / 2 - 2, boxHeight, "5 Medicare wages and tips", formatCurrency(data.medicareWages));
  
  // Box 6 - Medicare tax withheld
  drawLabeledBox(doc, margin + leftColWidth + 5 + rightColWidth / 2, y, rightColWidth / 2, boxHeight, "6 Medicare tax withheld", formatCurrency(data.medicareTax));
  y += boxHeight * 0.5 + 5;

  // Box d - Control number
  drawLabeledBox(doc, margin, y, leftColWidth, smallBoxHeight, "d Control number", data.controlNumber || "");
  
  // Box 7 - Social security tips
  drawLabeledBox(doc, margin + leftColWidth + 5, y, rightColWidth / 2 - 2, smallBoxHeight, "7 Social security tips", formatCurrency(data.socialSecurityTips));
  
  // Box 8 - Allocated tips
  drawLabeledBox(doc, margin + leftColWidth + 5 + rightColWidth / 2, y, rightColWidth / 2, smallBoxHeight, "8 Allocated tips", formatCurrency(data.allocatedTips));
  y += smallBoxHeight + 2;

  // Box e - Employee's name
  drawLabeledBox(doc, margin, y, leftColWidth, boxHeight, "e Employee's first name and initial    Last name", `${data.employeeFirstName || "First"} ${data.employeeMiddleInitial || ""} ${data.employeeLastName || "Last"}`);
  
  // Box 9 - Blank
  drawLabeledBox(doc, margin + leftColWidth + 5, y, rightColWidth / 2 - 2, smallBoxHeight, "9", "");
  
  // Box 10 - Dependent care benefits
  drawLabeledBox(doc, margin + leftColWidth + 5 + rightColWidth / 2, y, rightColWidth / 2, smallBoxHeight, "10 Dependent care benefits", formatCurrency(data.dependentCareBenefits));
  y += boxHeight + 2;

  // Box f - Employee's address
  const employeeAddress = `${data.employeeAddress || "456 Employee St"}\n${data.employeeCity || "City"}, ${data.employeeState || "ST"} ${data.employeeZip || "12345"}`;
  drawLabeledBox(doc, margin, y, leftColWidth, boxHeight * 1.2, "f Employee's address and ZIP code", employeeAddress, true);
  
  // Box 11 - Nonqualified plans
  drawLabeledBox(doc, margin + leftColWidth + 5, y, rightColWidth / 2 - 2, smallBoxHeight, "11 Nonqualified plans", formatCurrency(data.nonqualifiedPlans));
  
  // Box 12a
  const box12Width = rightColWidth / 2;
  drawBox12(doc, margin + leftColWidth + 5 + rightColWidth / 2, y, box12Width, smallBoxHeight, "12a", data.box12aCode, data.box12aAmount);
  y += smallBoxHeight + 2;

  // Box 12b
  drawLabeledBox(doc, margin + leftColWidth + 5, y, rightColWidth / 2 - 2, smallBoxHeight, "See instructions for box 12", "");
  drawBox12(doc, margin + leftColWidth + 5 + rightColWidth / 2, y, box12Width, smallBoxHeight, "12b", data.box12bCode, data.box12bAmount);
  y += smallBoxHeight + 2;

  // Box 12c, 12d and Box 13
  y += boxHeight * 0.2;
  
  // Box 13 checkboxes
  const checkboxY = y;
  drawLabeledBox(doc, margin + leftColWidth + 5, y, rightColWidth / 2 - 2, boxHeight, "13", "");
  doc.setFontSize(7);
  drawCheckbox(doc, margin + leftColWidth + 10, y + 15, "Statutory employee", data.statutoryEmployee);
  drawCheckbox(doc, margin + leftColWidth + 10, y + 27, "Retirement plan", data.retirementPlan);
  drawCheckbox(doc, margin + leftColWidth + 10, y + 39, "Third-party sick pay", data.thirdPartySickPay);
  
  // Box 12c
  drawBox12(doc, margin + leftColWidth + 5 + rightColWidth / 2, y, box12Width, smallBoxHeight, "12c", data.box12cCode, data.box12cAmount);
  y += smallBoxHeight + 2;
  
  // Box 12d
  drawBox12(doc, margin + leftColWidth + 5 + rightColWidth / 2, y, box12Width, smallBoxHeight, "12d", data.box12dCode, data.box12dAmount);
  y += smallBoxHeight + 5;

  // Box 14 - Other
  drawLabeledBox(doc, margin, y, leftColWidth, boxHeight, "14 Other", data.other || "");
  y += boxHeight + 5;

  // State/Local section
  const stateColWidth = (pageWidth - 2 * margin) / 6;
  
  // Headers
  doc.setFontSize(6);
  doc.setFont("helvetica", "normal");
  
  drawLabeledBox(doc, margin, y, stateColWidth * 0.8, smallBoxHeight, "15 State", data.state || "");
  drawLabeledBox(doc, margin + stateColWidth * 0.8 + 2, y, stateColWidth * 1.2, smallBoxHeight, "Employer's state ID number", data.employerStateId || "");
  drawLabeledBox(doc, margin + stateColWidth * 2 + 4, y, stateColWidth, smallBoxHeight, "16 State wages, tips, etc.", formatCurrency(data.stateWages));
  drawLabeledBox(doc, margin + stateColWidth * 3 + 6, y, stateColWidth, smallBoxHeight, "17 State income tax", formatCurrency(data.stateIncomeTax));
  drawLabeledBox(doc, margin + stateColWidth * 4 + 8, y, stateColWidth, smallBoxHeight, "18 Local wages, tips, etc.", formatCurrency(data.localWages));
  drawLabeledBox(doc, margin + stateColWidth * 5 + 10, y, stateColWidth - 12, smallBoxHeight, "19 Local income tax", formatCurrency(data.localIncomeTax));
  y += smallBoxHeight + 2;

  // Box 20 - Locality name (second row for state/local)
  drawLabeledBox(doc, margin + stateColWidth * 4 + 8, y, stateColWidth * 2 - 12, smallBoxHeight, "20 Locality name", data.localityName || "");

  // Footer
  y = pageHeight - 50;
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text("Copy B - To Be Filed With Employee's FEDERAL Tax Return", pageWidth / 2, y, { align: "center" });
  doc.text("This information is being furnished to the Internal Revenue Service.", pageWidth / 2, y + 12, { align: "center" });
}

// Draw a labeled box
function drawLabeledBox(doc, x, y, width, height, label, value, multiline = false) {
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.rect(x, y, width, height);
  
  // Label
  doc.setFontSize(6);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);
  doc.text(label, x + 3, y + 8);
  
  // Value
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  
  if (multiline && value.includes('\n')) {
    const lines = value.split('\n');
    let lineY = y + 20;
    lines.forEach(line => {
      doc.text(line, x + 5, lineY);
      lineY += 12;
    });
  } else {
    doc.text(String(value || ""), x + 5, y + height - 8);
  }
}

// Draw Box 12 format (code + amount)
function drawBox12(doc, x, y, width, height, label, code, amount) {
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.rect(x, y, width, height);
  
  // Label
  doc.setFontSize(6);
  doc.setFont("helvetica", "normal");
  doc.text(label, x + 3, y + 8);
  
  // Code
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text(code || "", x + 5, y + height - 5);
  
  // Amount
  if (amount) {
    doc.text(formatCurrency(amount), x + width - 5, y + height - 5, { align: "right" });
  }
}

// Draw checkbox
function drawCheckbox(doc, x, y, label, checked) {
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.rect(x, y, 8, 8);
  
  if (checked) {
    doc.setFont("helvetica", "bold");
    doc.text("X", x + 1.5, y + 6.5);
  }
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text(label, x + 12, y + 6);
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

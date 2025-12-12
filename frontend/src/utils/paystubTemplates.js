// Template A: Gusto-Style Professional
export function generateTemplateA(doc, data, pageWidth, pageHeight, margin) {
  const { formData, hours, overtime, regularPay, overtimePay, grossPay, ssTax, medTax, stateTax, localTax, totalTax, netPay, rate, startDate, endDate, payDate, payFrequency, stubNum, totalStubs } = data;
  
  const totalHours = Number(hours) + Number(overtime || 0);
  const overtimeRate = rate * 1.5;
  let y = 40;

  // ========== HEADER SECTION ==========
  // Logo/Branding
  doc.setFontSize(18);
  doc.setTextColor(0, 168, 155); // Gusto teal
  doc.setFont(undefined, 'bold');
  doc.text("Gusto", margin, y);
  
  // Earnings Statement Title
  y += 30;
  doc.setFontSize(18);
  doc.setTextColor(51, 51, 51);
  doc.text("Earnings Statement", margin, y);
  
  // Pay Period Info
  y += 20;
  doc.setFontSize(9);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(102, 102, 102);
  doc.text(`Pay period: ${startDate.toLocaleDateString()} – ${endDate.toLocaleDateString()}   Pay Day: ${payDate.toLocaleDateString()}`, margin, y);
  y += 12;
  doc.text(`Hire Date: ${formData.hireDate || startDate.toLocaleDateString()}`, margin, y);
  y += 12;
  doc.text(`${formData.name || ''} (...Direct Deposit to ${formData.bankName || 'Bank'} ******${formData.bank ? formData.bank.slice(-4) : '0000'})`, margin, y);

  // Info Boxes (Company and Employee) - Right Side
  const boxTop = 30;
  const boxHeight = 70;
  const boxWidth = 130;
  const box1X = pageWidth - margin - boxWidth * 2 - 10;
  const box2X = pageWidth - margin - boxWidth;
  
  // Company Box
  doc.setFillColor(248, 248, 248);
  doc.rect(box1X, boxTop, boxWidth, boxHeight, 'F');
  doc.setFontSize(8);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(51, 51, 51);
  doc.text("Company", box1X + 8, boxTop + 14);
  doc.setFont(undefined, 'normal');
  doc.setFontSize(7);
  doc.setTextColor(102, 102, 102);
  doc.text(formData.company || "Company Name", box1X + 8, boxTop + 28, { maxWidth: boxWidth - 16 });
  doc.text(formData.companyAddress || "", box1X + 8, boxTop + 40, { maxWidth: boxWidth - 16 });
  doc.text(`${formData.companyCity || ""}, ${formData.companyState || ""} ${formData.companyZip || ""}`, box1X + 8, boxTop + 52, { maxWidth: boxWidth - 16 });
  doc.text(formData.companyPhone || "", box1X + 8, boxTop + 64, { maxWidth: boxWidth - 16 });

  // Employee Box
  doc.setFillColor(248, 248, 248);
  doc.rect(box2X, boxTop, boxWidth, boxHeight, 'F');
  doc.setFontSize(8);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(51, 51, 51);
  doc.text("Employee", box2X + 8, boxTop + 14);
  doc.setFont(undefined, 'normal');
  doc.setFontSize(7);
  doc.setTextColor(102, 102, 102);
  doc.text(formData.name || "", box2X + 8, boxTop + 28, { maxWidth: boxWidth - 16 });
  doc.text(`XXX-XX-${formData.ssn || "0000"}`, box2X + 8, boxTop + 40);
  doc.text(formData.address || "", box2X + 8, boxTop + 52, { maxWidth: boxWidth - 16 });
  doc.text(`${formData.city || ""}, ${formData.state || ""} ${formData.zip || ""}`, box2X + 8, boxTop + 64, { maxWidth: boxWidth - 16 });

  y = Math.max(y, boxTop + boxHeight) + 30;

  // ========== EARNINGS SECTION ==========
  doc.setFontSize(11);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(51, 51, 51);
  doc.text("Employee Gross Earnings", margin, y);
  doc.setDrawColor(0, 168, 155);
  doc.setLineWidth(1);
  doc.line(margin, y + 3, pageWidth - margin, y + 3);
  
  y += 20;
  
  // Earnings Table Header
  doc.setFontSize(9);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(51, 51, 51);
  doc.text("Description", margin + 4, y);
  doc.text("Rate", margin + 250, y, { align: 'right' });
  doc.text("Hours", margin + 310, y, { align: 'right' });
  doc.text("Current", margin + 390, y, { align: 'right' });
  doc.text("Year-To-Date", pageWidth - margin - 4, y, { align: 'right' });
  
  doc.setDrawColor(221, 221, 221);
  doc.setLineWidth(0.5);
  doc.line(margin, y + 2, pageWidth - margin, y + 2);
  
  y += 16;
  
  // Regular Hours Row
  doc.setFillColor(245, 245, 245);
  doc.rect(margin, y - 11, pageWidth - 2 * margin, 16, 'F');
  doc.setFont(undefined, 'normal');
  doc.setTextColor(51, 51, 51);
  
  // Underline "Regular Hours"
  const regularText = "Regular Hours";
  const regularTextWidth = doc.getTextWidth(regularText);
  doc.text(`${regularText} | Hourly`, margin + 4, y);
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.line(margin + 4, y + 1, margin + 4 + regularTextWidth, y + 1);
  
  doc.text(`$${rate.toFixed(2)}`, margin + 250, y, { align: 'right' });
  doc.text(hours.toString(), margin + 310, y, { align: 'right' });
  doc.text(`$${regularPay.toFixed(2)}`, margin + 390, y, { align: 'right' });
  doc.text(`$${regularPay.toFixed(2)}`, pageWidth - margin - 4, y, { align: 'right' });
  
  // Vertical lines
  doc.setDrawColor(224, 224, 224);
  doc.line(margin + 230, y - 11, margin + 230, y + 5);
  doc.line(margin + 290, y - 11, margin + 290, y + 5);
  doc.line(margin + 360, y - 11, margin + 360, y + 5);
  doc.line(margin + 450, y - 11, margin + 450, y + 5);
  
  y += 16;
  
  // Overtime Row (if applicable)
  if (overtime > 0) {
    doc.setFillColor(255, 255, 255);
    doc.rect(margin, y - 11, pageWidth - 2 * margin, 16, 'F');
    
    const overtimeText = "Overtime Hours";
    const overtimeTextWidth = doc.getTextWidth(overtimeText);
    doc.text(`${overtimeText} | 1.5x`, margin + 4, y);
    doc.setDrawColor(0, 0, 0);
    doc.line(margin + 4, y + 1, margin + 4 + overtimeTextWidth, y + 1);
    
    doc.text(`$${overtimeRate.toFixed(2)}`, margin + 250, y, { align: 'right' });
    doc.text(overtime.toString(), margin + 310, y, { align: 'right' });
    doc.text(`$${overtimePay.toFixed(2)}`, margin + 390, y, { align: 'right' });
    doc.text(`$${overtimePay.toFixed(2)}`, pageWidth - margin - 4, y, { align: 'right' });
    
    doc.setDrawColor(224, 224, 224);
    doc.line(margin + 230, y - 11, margin + 230, y + 5);
    doc.line(margin + 290, y - 11, margin + 290, y + 5);
    doc.line(margin + 360, y - 11, margin + 360, y + 5);
    doc.line(margin + 450, y - 11, margin + 450, y + 5);
    
    y += 16;
  }
  
  y += 10;

  // ========== TAXES SECTION (Two Columns) ==========
  const taxColWidth = (pageWidth - 2 * margin - 10) / 2;
  const leftTaxX = margin;
  const rightTaxX = margin + taxColWidth + 10;
  
  // Left Column: Employee Taxes
  let leftY = y;
  doc.setFontSize(11);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(51, 51, 51);
  doc.text("Employee Taxes Withheld", leftTaxX, leftY);
  doc.setDrawColor(0, 168, 155);
  doc.setLineWidth(1);
  doc.line(leftTaxX, leftY + 3, leftTaxX + taxColWidth, leftY + 3);
  
  leftY += 18;
  
  // Employee Tax Table Header
  doc.setFontSize(9);
  doc.setFont(undefined, 'bold');
  doc.text("Description", leftTaxX + 4, leftY);
  doc.text("Current", leftTaxX + taxColWidth - 100, leftY, { align: 'right' });
  doc.text("YTD", leftTaxX + taxColWidth - 4, leftY, { align: 'right' });
  doc.setDrawColor(221, 221, 221);
  doc.line(leftTaxX, leftY + 2, leftTaxX + taxColWidth, leftY + 2);
  
  leftY += 16;
  
  // Employee tax rows
  const employeeTaxes = [
    ["Social Security", ssTax],
    ["Medicare", medTax],
    [`${formData.state?.toUpperCase() || 'State'} Withholding Tax`, stateTax],
  ];
  
  if (formData.includeLocalTax && localTax > 0) {
    employeeTaxes.push(["Local Tax", localTax]);
  }
  
  employeeTaxes.forEach((tax, idx) => {
    const isGray = idx % 2 === 1;
    if (isGray) {
      doc.setFillColor(245, 245, 245);
      doc.rect(leftTaxX, leftY - 11, taxColWidth, 16, 'F');
    }
    
    doc.setFont(undefined, 'normal');
    doc.setTextColor(51, 51, 51);
    const taxText = tax[0];
    const taxTextWidth = doc.getTextWidth(taxText);
    doc.text(taxText, leftTaxX + 4, leftY);
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.line(leftTaxX + 4, leftY + 1, leftTaxX + 4 + taxTextWidth, leftY + 1);
    
    doc.text(`$${tax[1].toFixed(2)}`, leftTaxX + taxColWidth - 100, leftY, { align: 'right' });
    doc.text(`$${tax[1].toFixed(2)}`, leftTaxX + taxColWidth - 4, leftY, { align: 'right' });
    
    doc.setDrawColor(224, 224, 224);
    doc.line(leftTaxX + taxColWidth - 120, leftY - 11, leftTaxX + taxColWidth - 120, leftY + 5);
    doc.line(leftTaxX + taxColWidth - 50, leftY - 11, leftTaxX + taxColWidth - 50, leftY + 5);
    
    leftY += 16;
  });

  // Right Column: Employer Taxes
  let rightY = y;
  doc.setFontSize(11);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(51, 51, 51);
  doc.text("Employer Tax", rightTaxX, rightY);
  doc.setDrawColor(0, 168, 155);
  doc.setLineWidth(1);
  doc.line(rightTaxX, rightY + 3, rightTaxX + taxColWidth, rightY + 3);
  
  rightY += 18;
  
  // Employer Tax Table Header
  doc.setFontSize(9);
  doc.setFont(undefined, 'bold');
  doc.text("Company Tax", rightTaxX + 4, rightY);
  doc.text("Current", rightTaxX + taxColWidth - 100, rightY, { align: 'right' });
  doc.text("YTD", rightTaxX + taxColWidth - 4, rightY, { align: 'right' });
  doc.setDrawColor(221, 221, 221);
  doc.line(rightTaxX, rightY + 2, rightTaxX + taxColWidth, rightY + 2);
  
  rightY += 16;
  
  // Employer tax rows
  const employerTaxes = [
    ["Social Security", grossPay * 0.062],
    ["Medicare", grossPay * 0.0145],
    ["FUTA", grossPay * 0.006],
    [`${formData.state?.toUpperCase() || 'State'} Unemployment Tax`, grossPay * 0.01],
  ];
  
  employerTaxes.forEach((tax, idx) => {
    const isGray = idx % 2 === 1;
    if (isGray) {
      doc.setFillColor(245, 245, 245);
      doc.rect(rightTaxX, rightY - 11, taxColWidth, 16, 'F');
    }
    
    doc.setFont(undefined, 'normal');
    doc.setTextColor(51, 51, 51);
    const taxText = tax[0];
    const taxTextWidth = doc.getTextWidth(taxText);
    doc.text(taxText, rightTaxX + 4, rightY);
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.line(rightTaxX + 4, rightY + 1, rightTaxX + 4 + taxTextWidth, rightY + 1);
    
    doc.text(`$${tax[1].toFixed(2)}`, rightTaxX + taxColWidth - 100, rightY, { align: 'right' });
    doc.text(`$${tax[1].toFixed(2)}`, rightTaxX + taxColWidth - 4, rightY, { align: 'right' });
    
    doc.setDrawColor(224, 224, 224);
    doc.line(rightTaxX + taxColWidth - 120, rightY - 11, rightTaxX + taxColWidth - 120, rightY + 5);
    doc.line(rightTaxX + taxColWidth - 50, rightY - 11, rightTaxX + taxColWidth - 50, rightY + 5);
    
    rightY += 16;
  });

  y = Math.max(leftY, rightY) + 10;

  // ========== DEDUCTIONS SECTION ==========
  doc.setFontSize(11);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(51, 51, 51);
  doc.text("Employee Deductions", margin, y);
  doc.setDrawColor(0, 168, 155);
  doc.setLineWidth(1);
  doc.line(margin, y + 3, pageWidth - margin, y + 3);
  y += 18;
  
  doc.setFontSize(9);
  doc.setFont(undefined, 'bold');
  doc.text("Description", margin + 4, y);
  doc.text("Type", margin + 200, y);
  doc.text("Current", pageWidth - margin - 150, y, { align: 'right' });
  doc.text("Year-To-Date", pageWidth - margin - 4, y, { align: 'right' });
  doc.setDrawColor(221, 221, 221);
  doc.line(margin, y + 2, pageWidth - margin, y + 2);
  y += 16;
  
  doc.setFont(undefined, 'normal');
  doc.text("None", margin + 4, y);
  doc.text("–", margin + 200, y);
  doc.text("$0.00", pageWidth - margin - 150, y, { align: 'right' });
  doc.text("$0.00", pageWidth - margin - 4, y, { align: 'right' });
  
  y += 30;

  // ========== CONTRIBUTIONS SECTION ==========
  doc.setFontSize(11);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(51, 51, 51);
  doc.text("Employee Contributions", margin, y);
  doc.setDrawColor(0, 168, 155);
  doc.setLineWidth(1);
  doc.line(margin, y + 3, pageWidth - margin, y + 3);
  y += 18;
  
  doc.setFontSize(9);
  doc.setFont(undefined, 'bold');
  doc.text("Description", margin + 4, y);
  doc.text("Type", margin + 200, y);
  doc.text("Current", pageWidth - margin - 150, y, { align: 'right' });
  doc.text("Year-To-Date", pageWidth - margin - 4, y, { align: 'right' });
  doc.setDrawColor(221, 221, 221);
  doc.line(margin, y + 2, pageWidth - margin, y + 2);
  y += 16;
  
  doc.setFont(undefined, 'normal');
  doc.text("None", margin + 4, y);
  doc.text("–", margin + 200, y);
  doc.text("$0.00", pageWidth - margin - 150, y, { align: 'right' });
  doc.text("$0.00", pageWidth - margin - 4, y, { align: 'right' });
  
  y += 30;

  // ========== SUMMARY SECTION ==========
  doc.setFontSize(11);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(51, 51, 51);
  doc.text("Summary", margin, y);
  doc.setDrawColor(0, 168, 155);
  doc.setLineWidth(1);
  doc.line(margin, y + 3, pageWidth - margin, y + 3);
  y += 18;
  
  doc.setFontSize(9);
  doc.setFont(undefined, 'bold');
  doc.text("Description", margin + 4, y);
  doc.text("Current", pageWidth - margin - 150, y, { align: 'right' });
  doc.text("Year-To-Date", pageWidth - margin - 4, y, { align: 'right' });
  doc.setDrawColor(221, 221, 221);
  doc.line(margin, y + 2, pageWidth - margin, y + 2);
  y += 16;
  
  const summaryItems = [
    ["Gross Earnings", grossPay],
    ["Taxes", totalTax],
    ["Net Pay", netPay],
    ["Total Reimbursements", 0],
    ["Check Amount", netPay],
    ["Hours Worked", totalHours],
  ];
  
  summaryItems.forEach((item) => {
    doc.setFont(undefined, 'normal');
    const itemText = item[0];
    const itemTextWidth = doc.getTextWidth(itemText);
    doc.text(itemText, margin + 4, y);
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.line(margin + 4, y + 1, margin + 4 + itemTextWidth, y + 1);
    
    const currentValue = item[0] === "Hours Worked" ? item[1].toFixed(2) : `$${item[1].toFixed(2)}`;
    doc.text(currentValue, pageWidth - margin - 150, y, { align: 'right' });
    doc.text(currentValue, pageWidth - margin - 4, y, { align: 'right' });
    y += 14;
  });

  // Footer
  y += 20;
  doc.setFontSize(8);
  doc.setTextColor(153, 153, 153);
  doc.text(`Statement ${stubNum + 1} of ${totalStubs}`, pageWidth / 2, pageHeight - 30, { align: 'center' });
}

// Template B: Modern Minimalist
export function generateTemplateB(doc, data, pageWidth, pageHeight, margin) {
  const { formData, hours, overtime, regularPay, overtimePay, grossPay, ssTax, medTax, stateTax, localTax, totalTax, netPay, rate, startDate, endDate, payDate, payFrequency, stubNum, totalStubs } = data;
  
  let y = 30;
  
  // Minimalist Header - No background
  doc.setFontSize(14);
  doc.setTextColor(100, 100, 100);
  doc.setFont(undefined, 'normal');
  doc.text(formData.company || "Company Name", margin, y);
  doc.setFontSize(8);
  doc.text(`${formData.companyAddress || ""} | ${formData.companyCity || ""}, ${formData.companyState || ""} | ${formData.companyPhone || ""}`, margin, y + 15);

  // Large Pay Stub Title - Bold and Centered
  y = 80;
  doc.setFontSize(36);
  doc.setTextColor(41, 128, 185);
  doc.setFont(undefined, 'bold');
  doc.text("PAYCHECK", pageWidth / 2, y, { align: 'center' });

  // Period on same line as title (smaller)
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.setFont(undefined, 'normal');
  doc.text(`${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`, pageWidth / 2, y + 20, { align: 'center' });

  // Two-column layout
  y = 130;
  const leftCol = margin;
  const rightCol = pageWidth / 2 + 20;

  // Left Column - Employee
  doc.setFontSize(9);
  doc.setTextColor(150, 150, 150);
  doc.text("EMPLOYEE", leftCol, y);
  y += 15;
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.setFont(undefined, 'bold');
  doc.text(formData.name || "", leftCol, y);
  y += 15;
  doc.setFont(undefined, 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text(`SSN: ****${formData.ssn || "0000"}`, leftCol, y);
  y += 12;
  doc.text(formData.address || "", leftCol, y);
  y += 12;
  doc.text(`${formData.city || ""}, ${formData.state || ""} ${formData.zip || ""}`, leftCol, y);

  // Right Column - Payment Info
  y = 130;
  doc.setFontSize(9);
  doc.setTextColor(150, 150, 150);
  doc.text("PAYMENT DATE", rightCol, y);
  y += 15;
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.setFont(undefined, 'bold');
  doc.text(payDate.toLocaleDateString(), rightCol, y);
  y += 20;
  doc.setFont(undefined, 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text(`Frequency: ${payFrequency === 'biweekly' ? 'Bi-Weekly' : 'Weekly'}`, rightCol, y);

  // Earnings Table - Minimalist
  y = 240;
  doc.setFillColor(245, 245, 245);
  doc.rect(margin, y, pageWidth - 2 * margin, 25, 'F');
  y += 17;
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.setFont(undefined, 'bold');
  doc.text("DESCRIPTION", margin + 10, y);
  doc.text("HOURS", margin + 250, y);
  doc.text("RATE", margin + 340, y);
  doc.text("AMOUNT", pageWidth - margin - 10, y, { align: 'right' });

  y += 25;
  doc.setFont(undefined, 'normal');
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  doc.text("Regular Pay", margin + 10, y);
  doc.text(hours.toFixed(1), margin + 250, y);
  doc.text(`$${rate.toFixed(2)}`, margin + 340, y);
  doc.text(`$${regularPay.toFixed(2)}`, pageWidth - margin - 10, y, { align: 'right' });
  
  if (overtime > 0) {
    y += 18;
    doc.text("Overtime (1.5x)", margin + 10, y);
    doc.text(overtime.toFixed(1), margin + 250, y);
    doc.text(`$${(rate * 1.5).toFixed(2)}`, margin + 340, y);
    doc.text(`$${overtimePay.toFixed(2)}`, pageWidth - margin - 10, y, { align: 'right' });
  }

  y += 25;
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(1);
  doc.line(margin, y, pageWidth - margin, y);
  y += 18;
  doc.setFont(undefined, 'bold');
  doc.setFontSize(11);
  doc.text("Gross Pay", margin + 10, y);
  doc.text(`$${grossPay.toFixed(2)}`, pageWidth - margin - 10, y, { align: 'right' });

  // Deductions
  y += 30;
  doc.setFillColor(245, 245, 245);
  doc.rect(margin, y, pageWidth - 2 * margin, 25, 'F');
  y += 17;
  doc.setFontSize(10);
  doc.text("DEDUCTIONS", margin + 10, y);

  y += 25;
  doc.setFont(undefined, 'normal');
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  doc.text("Social Security", margin + 10, y);
  doc.text(`$${ssTax.toFixed(2)}`, pageWidth - margin - 10, y, { align: 'right' });
  y += 18;
  doc.text("Medicare", margin + 10, y);
  doc.text(`$${medTax.toFixed(2)}`, pageWidth - margin - 10, y, { align: 'right' });
  y += 18;
  doc.text("State Tax", margin + 10, y);
  doc.text(`$${stateTax.toFixed(2)}`, pageWidth - margin - 10, y, { align: 'right' });
  
  if (formData.includeLocalTax) {
    y += 18;
    doc.text("Local Tax", margin + 10, y);
    doc.text(`$${localTax.toFixed(2)}`, pageWidth - margin - 10, y, { align: 'right' });
  }

  y += 25;
  doc.setLineWidth(1);
  doc.line(margin, y, pageWidth - margin, y);
  y += 18;
  doc.setFont(undefined, 'bold');
  doc.setFontSize(11);
  doc.text("Total Deductions", margin + 10, y);
  doc.text(`$${totalTax.toFixed(2)}`, pageWidth - margin - 10, y, { align: 'right' });

  // NET PAY - Large and Bold
  y += 40;
  doc.setFillColor(41, 128, 185);
  doc.rect(margin, y - 10, pageWidth - 2 * margin, 60, 'F');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text("NET PAY", margin + 15, y + 10);
  doc.setFontSize(28);
  doc.setFont(undefined, 'bold');
  doc.text(`$${netPay.toFixed(2)}`, pageWidth - margin - 15, y + 15, { align: 'right' });

  // Bank Info
  y += 75;
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.setFont(undefined, 'normal');
  doc.text(`Deposited to ${formData.bankName || ""} ****${formData.bank || "0000"}`, pageWidth / 2, y, { align: 'center' });

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(`${stubNum + 1}/${totalStubs}`, pageWidth / 2, pageHeight - 30, { align: 'center' });
}

// Template C: Detailed Corporate
export function generateTemplateC(doc, data, pageWidth, pageHeight, margin) {
  const { formData, hours, overtime, regularPay, overtimePay, grossPay, ssTax, medTax, stateTax, localTax, totalTax, netPay, rate, startDate, endDate, payDate, payFrequency, stubNum, totalStubs } = data;
  
  let y = 40;
  
  // Corporate Header with Border
  doc.setDrawColor(142, 68, 173);
  doc.setLineWidth(3);
  doc.line(margin, y, pageWidth - margin, y);
  
  y += 20;
  doc.setFontSize(24);
  doc.setTextColor(142, 68, 173);
  doc.setFont(undefined, 'bold');
  doc.text(formData.company || "Company Name", margin, y);
  
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.setFont(undefined, 'normal');
  y += 15;
  doc.text(formData.companyAddress || "", margin, y);
  y += 12;
  doc.text(`${formData.companyCity || ""}, ${formData.companyState || ""} ${formData.companyZip || ""}`, margin, y);
  y += 12;
  doc.text(`Tel: ${formData.companyPhone || ""}`, margin, y);

  // Document Title Box
  y += 30;
  doc.setFillColor(155, 89, 182);
  doc.rect(margin, y, pageWidth - 2 * margin, 40, 'F');
  y += 27;
  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.setFont(undefined, 'bold');
  doc.text("EARNINGS STATEMENT", pageWidth / 2, y, { align: 'center' });

  // Info Grid
  y += 40;
  const boxWidth = (pageWidth - 2 * margin - 20) / 2;
  const boxHeight = 80;
  
  // Employee Box (Left)
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(1);
  doc.rect(margin, y, boxWidth, boxHeight, 'S');
  doc.setFillColor(250, 250, 250);
  doc.rect(margin, y, boxWidth, 20, 'F');
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.setFont(undefined, 'bold');
  doc.text("EMPLOYEE DETAILS", margin + 5, y + 13);
  
  y += 30;
  doc.setFont(undefined, 'normal');
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text(`Name: ${formData.name || ""}`, margin + 5, y);
  y += 15;
  doc.setFontSize(9);
  doc.text(`SSN: ***-**-${formData.ssn || "0000"}`, margin + 5, y);
  y += 12;
  doc.text(`${formData.address || ""}`, margin + 5, y);
  y += 12;
  doc.text(`${formData.city || ""}, ${formData.state || ""} ${formData.zip || ""}`, margin + 5, y);

  // Pay Period Box (Right)
  y = y - 54;
  const rightBoxX = margin + boxWidth + 20;
  doc.rect(rightBoxX, y - 15, boxWidth, boxHeight, 'S');
  doc.setFillColor(250, 250, 250);
  doc.rect(rightBoxX, y - 15, boxWidth, 20, 'F');
  doc.setFont(undefined, 'bold');
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text("PAY PERIOD", rightBoxX + 5, y - 2);
  
  y += 15;
  doc.setFont(undefined, 'normal');
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text(`Period Start: ${startDate.toLocaleDateString()}`, rightBoxX + 5, y);
  y += 15;
  doc.text(`Period End: ${endDate.toLocaleDateString()}`, rightBoxX + 5, y);
  y += 15;
  doc.text(`Pay Date: ${payDate.toLocaleDateString()}`, rightBoxX + 5, y);
  y += 12;
  doc.setFontSize(9);
  doc.text(`Frequency: ${payFrequency === 'biweekly' ? 'Bi-Weekly' : 'Weekly'}`, rightBoxX + 5, y);

  // Earnings Table
  y += 40;
  const tableY = y;
  doc.setFillColor(245, 242, 248);
  doc.rect(margin, y, pageWidth - 2 * margin, 20, 'F');
  doc.setDrawColor(142, 68, 173);
  doc.setLineWidth(1);
  doc.rect(margin, y, pageWidth - 2 * margin, 20, 'S');
  
  y += 14;
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.setFont(undefined, 'bold');
  doc.text("EARNINGS", margin + 5, y);
  doc.text("HOURS", margin + 220, y);
  doc.text("RATE", margin + 300, y);
  doc.text("AMOUNT", pageWidth - margin - 5, y, { align: 'right' });

  y += 20;
  doc.setLineWidth(0.5);
  doc.setDrawColor(200, 200, 200);
  doc.rect(margin, tableY, pageWidth - 2 * margin, overtime > 0 ? 60 : 40, 'S');
  
  doc.setFont(undefined, 'normal');
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text("Regular Pay", margin + 5, y);
  doc.text(hours.toFixed(2), margin + 220, y);
  doc.text(`$${rate.toFixed(2)}/hr`, margin + 300, y);
  doc.text(`$${regularPay.toFixed(2)}`, pageWidth - margin - 5, y, { align: 'right' });
  
  if (overtime > 0) {
    y += 20;
    doc.text("Overtime Pay (1.5x)", margin + 5, y);
    doc.text(overtime.toFixed(2), margin + 220, y);
    doc.text(`$${(rate * 1.5).toFixed(2)}/hr`, margin + 300, y);
    doc.text(`$${overtimePay.toFixed(2)}`, pageWidth - margin - 5, y, { align: 'right' });
  }

  y += 20;
  doc.setFillColor(250, 250, 250);
  doc.rect(margin, y - 5, pageWidth - 2 * margin, 20, 'F');
  doc.setFont(undefined, 'bold');
  doc.text("GROSS PAY", margin + 5, y + 8);
  doc.text(`$${grossPay.toFixed(2)}`, pageWidth - margin - 5, y + 8, { align: 'right' });

  // Deductions Table
  y += 35;
  const deductY = y;
  doc.setFillColor(245, 242, 248);
  doc.rect(margin, y, pageWidth - 2 * margin, 20, 'F');
  doc.setDrawColor(142, 68, 173);
  doc.setLineWidth(1);
  doc.rect(margin, y, pageWidth - 2 * margin, 20, 'S');
  
  y += 14;
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.text("DEDUCTIONS", margin + 5, y);
  doc.text("RATE", margin + 300, y);
  doc.text("AMOUNT", pageWidth - margin - 5, y, { align: 'right' });

  y += 20;
  const deductHeight = formData.includeLocalTax ? 80 : 60;
  doc.setLineWidth(0.5);
  doc.setDrawColor(200, 200, 200);
  doc.rect(margin, deductY, pageWidth - 2 * margin, deductHeight + 20, 'S');
  
  doc.setFont(undefined, 'normal');
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text("Social Security", margin + 5, y);
  doc.text("6.2%", margin + 300, y);
  doc.text(`$${ssTax.toFixed(2)}`, pageWidth - margin - 5, y, { align: 'right' });
  y += 15;
  doc.text("Medicare", margin + 5, y);
  doc.text("1.45%", margin + 300, y);
  doc.text(`$${medTax.toFixed(2)}`, pageWidth - margin - 5, y, { align: 'right' });
  y += 15;
  doc.text("State Tax", margin + 5, y);
  doc.text(`${(data.stateRate * 100).toFixed(2)}%`, margin + 300, y);
  doc.text(`$${stateTax.toFixed(2)}`, pageWidth - margin - 5, y, { align: 'right' });
  
  if (formData.includeLocalTax) {
    y += 15;
    doc.text("Local Tax", margin + 5, y);
    doc.text("1.0%", margin + 300, y);
    doc.text(`$${localTax.toFixed(2)}`, pageWidth - margin - 5, y, { align: 'right' });
  }

  y += 20;
  doc.setFillColor(250, 250, 250);
  doc.rect(margin, y - 5, pageWidth - 2 * margin, 20, 'F');
  doc.setFont(undefined, 'bold');
  doc.setTextColor(220, 53, 69);
  doc.text("TOTAL DEDUCTIONS", margin + 5, y + 8);
  doc.text(`$${totalTax.toFixed(2)}`, pageWidth - margin - 5, y + 8, { align: 'right' });

  // NET PAY - Purple Box
  y += 40;
  doc.setFillColor(142, 68, 173);
  doc.rect(margin, y - 10, pageWidth - 2 * margin, 50, 'F');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.setFont(undefined, 'bold');
  doc.text("NET PAY (TAKE HOME)", margin + 10, y + 10);
  doc.setFontSize(24);
  doc.text(`$${netPay.toFixed(2)}`, pageWidth - margin - 10, y + 12, { align: 'right' });

  // Bank Info
  y += 60;
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.setFont(undefined, 'normal');
  doc.text(`Payment Method: Direct Deposit | ${formData.bankName || ""} | Account ending in ${formData.bank || "0000"}`, margin, y);

  // Footer with border
  doc.setDrawColor(142, 68, 173);
  doc.setLineWidth(2);
  doc.line(margin, pageHeight - 40, pageWidth - margin, pageHeight - 40);
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text(`Statement ${stubNum + 1} of ${totalStubs}`, pageWidth / 2, pageHeight - 25, { align: 'center' });
}

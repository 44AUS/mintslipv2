// Template A: Classic Professional
export function generateTemplateA(doc, data, pageWidth, pageHeight, margin) {
  const { formData, hours, overtime, regularPay, overtimePay, grossPay, ssTax, medTax, stateTax, localTax, totalTax, netPay, rate, startDate, endDate, payDate, payFrequency, stubNum, totalStubs } = data;
  
  let y = 40;
  
  // Header with gray background
  doc.setFillColor(236, 240, 241);
  doc.rect(0, 0, pageWidth, 100, 'F');
  
  doc.setFontSize(28);
  doc.setTextColor(44, 62, 80);
  doc.setFont(undefined, 'bold');
  doc.text(formData.company || "Company Name", margin, y + 30);
  
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(formData.companyAddress || "", margin, y + 50);
  doc.text(`${formData.companyCity || ""}, ${formData.companyState || ""} ${formData.companyZip || ""}`, margin, y + 65);
  doc.text(`Phone: ${formData.companyPhone || ""}`, margin, y + 80);

  // Pay Stub Title
  y = 130;
  doc.setFontSize(20);
  doc.setTextColor(52, 73, 94);
  doc.setFont(undefined, 'bold');
  doc.text("PAY STUB", pageWidth / 2, y, { align: 'center' });

  // Employee Info Box
  y = 170;
  doc.setFillColor(248, 249, 250);
  doc.rect(margin, y, pageWidth - 2 * margin, 90, 'F');
  
  y += 20;
  doc.setFontSize(11);
  doc.setTextColor(60, 60, 60);
  doc.setFont(undefined, 'bold');
  doc.text("Employee Information", margin + 10, y);
  
  y += 20;
  doc.setFont(undefined, 'normal');
  doc.setFontSize(10);
  doc.text(`Name: ${formData.name || ""}`, margin + 10, y);
  doc.text(`SSN: ***-**-${formData.ssn || "0000"}`, pageWidth - margin - 150, y);
  y += 15;
  doc.text(`${formData.address || ""}`, margin + 10, y);
  y += 15;
  doc.text(`${formData.city || ""}, ${formData.state || ""} ${formData.zip || ""}`, margin + 10, y);

  // Pay Period
  y += 35;
  doc.setFont(undefined, 'bold');
  doc.setTextColor(44, 62, 80);
  doc.text("Pay Period Details", margin, y);
  y += 5;
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, pageWidth - margin, y);
  y += 20;
  doc.setFont(undefined, 'normal');
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  doc.text(`Period: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`, margin, y);
  doc.text(`Pay Date: ${payDate.toLocaleDateString()}`, pageWidth - margin - 150, y);
  y += 15;
  doc.text(`Pay Frequency: ${payFrequency === 'biweekly' ? 'Bi-Weekly' : 'Weekly'}`, margin, y);

  // Earnings
  y += 35;
  doc.setFont(undefined, 'bold');
  doc.setFontSize(12);
  doc.setTextColor(44, 62, 80);
  doc.text("Earnings", margin, y);
  y += 5;
  doc.line(margin, y, pageWidth - margin, y);
  y += 20;
  doc.setFont(undefined, 'normal');
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text("Description", margin, y);
  doc.text("Hours", margin + 200, y);
  doc.text("Rate", margin + 280, y);
  doc.text("Amount", pageWidth - margin - 80, y, { align: 'right' });
  y += 15;
  doc.setTextColor(60, 60, 60);
  doc.text("Regular Pay", margin, y);
  doc.text(hours.toFixed(2), margin + 200, y);
  doc.text(`$${rate.toFixed(2)}`, margin + 280, y);
  doc.text(`$${regularPay.toFixed(2)}`, pageWidth - margin - 80, y, { align: 'right' });
  
  if (overtime > 0) {
    y += 15;
    doc.text("Overtime Pay", margin, y);
    doc.text(overtime.toFixed(2), margin + 200, y);
    doc.text(`$${(rate * 1.5).toFixed(2)}`, margin + 280, y);
    doc.text(`$${overtimePay.toFixed(2)}`, pageWidth - margin - 80, y, { align: 'right' });
  }
  
  y += 20;
  doc.setDrawColor(220, 220, 220);
  doc.line(margin, y, pageWidth - margin, y);
  y += 15;
  doc.setFont(undefined, 'bold');
  doc.text("Gross Pay", margin, y);
  doc.text(`$${grossPay.toFixed(2)}`, pageWidth - margin - 80, y, { align: 'right' });

  // Deductions
  y += 30;
  doc.setFontSize(12);
  doc.setTextColor(44, 62, 80);
  doc.text("Deductions", margin, y);
  y += 5;
  doc.line(margin, y, pageWidth - margin, y);
  y += 20;
  doc.setFont(undefined, 'normal');
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  doc.text("Social Security (6.2%)", margin, y);
  doc.text(`$${ssTax.toFixed(2)}`, pageWidth - margin - 80, y, { align: 'right' });
  y += 15;
  doc.text("Medicare (1.45%)", margin, y);
  doc.text(`$${medTax.toFixed(2)}`, pageWidth - margin - 80, y, { align: 'right' });
  y += 15;
  doc.text(`State Tax (${(data.stateRate * 100).toFixed(2)}%)`, margin, y);
  doc.text(`$${stateTax.toFixed(2)}`, pageWidth - margin - 80, y, { align: 'right' });
  
  if (formData.includeLocalTax) {
    y += 15;
    doc.text("Local Tax (1%)", margin, y);
    doc.text(`$${localTax.toFixed(2)}`, pageWidth - margin - 80, y, { align: 'right' });
  }
  
  y += 20;
  doc.setDrawColor(220, 220, 220);
  doc.line(margin, y, pageWidth - margin, y);
  y += 15;
  doc.setFont(undefined, 'bold');
  doc.setTextColor(220, 53, 69);
  doc.text("Total Deductions", margin, y);
  doc.text(`$${totalTax.toFixed(2)}`, pageWidth - margin - 80, y, { align: 'right' });

  // Net Pay Box
  y += 30;
  doc.setFillColor(52, 73, 94);
  doc.rect(margin, y - 15, pageWidth - 2 * margin, 45, 'F');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.setFont(undefined, 'bold');
  doc.text("NET PAY", margin + 15, y + 5);
  doc.text(`$${netPay.toFixed(2)}`, pageWidth - margin - 15, y + 5, { align: 'right' });

  // Direct Deposit
  y += 60;
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.setFont(undefined, 'normal');
  doc.text(`Direct Deposit: ${formData.bankName || ""} | Account: ****${formData.bank || "0000"}`, margin, y);

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(`Stub ${stubNum + 1} of ${totalStubs}`, pageWidth / 2, pageHeight - 30, { align: 'center' });
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

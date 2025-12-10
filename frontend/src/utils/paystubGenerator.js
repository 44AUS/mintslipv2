import { jsPDF } from "jspdf";

export const generateAndDownloadPaystub = async (formData) => {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  
  const rate = parseFloat(formData.rate) || 0;
  const numStubs = parseInt(formData.numStubs) || 1;
  const defaultHours = formData.payFrequency === "weekly" ? 40 : 80;
  const periodLength = formData.payFrequency === "biweekly" ? 14 : 7;
  
  const hoursArray = formData.hoursList
    .split(",")
    .map((h) => parseFloat(h.trim()) || 0)
    .slice(0, numStubs) || [];
  const overtimeArray = formData.overtimeList
    .split(",")
    .map((h) => parseFloat(h.trim()) || 0)
    .slice(0, numStubs) || [];

  const hireDate = formData.hireDate ? new Date(formData.hireDate) : new Date();
  let startDate = new Date(hireDate);

  for (let stubNum = 0; stubNum < numStubs; stubNum++) {
    if (stubNum > 0) doc.addPage();
    
    const hours = hoursArray[stubNum] || defaultHours;
    const overtime = overtimeArray[stubNum] || 0;
    const regularPay = rate * hours;
    const overtimePay = rate * 1.5 * overtime;
    const grossPay = regularPay + overtimePay;
    
    const ssTax = grossPay * 0.062;
    const medTax = grossPay * 0.0145;
    const stateTax = grossPay * 0.05;
    const localTax = formData.includeLocalTax ? grossPay * 0.01 : 0;
    const totalTax = ssTax + medTax + stateTax + localTax;
    const netPay = grossPay - totalTax;

    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + periodLength - 1);
    const payDate = new Date(endDate);
    payDate.setDate(payDate.getDate() + 2);

    let y = 40;
    const margin = 40;
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFontSize(24);
    doc.setTextColor(26, 71, 49);
    doc.text(formData.company || "Company Name", margin, y);
    
    y += 30;
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    doc.text(formData.companyAddress || "", margin, y);
    y += 15;
    doc.text(`${formData.companyCity || ""}, ${formData.companyState || ""} ${formData.companyZip || ""}`, margin, y);
    y += 15;
    doc.text(formData.companyPhone || "", margin, y);

    // Pay Stub Title
    y += 40;
    doc.setFontSize(18);
    doc.setTextColor(26, 71, 49);
    doc.text("PAY STUB", margin, y);

    // Employee Info
    y += 30;
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`Employee: ${formData.name || ""}`, margin, y);
    y += 15;
    doc.text(`SSN: ***-**-${formData.ssn || "0000"}`, margin, y);
    y += 15;
    doc.text(`${formData.address || ""}`, margin, y);
    y += 15;
    doc.text(`${formData.city || ""}, ${formData.state || ""} ${formData.zip || ""}`, margin, y);

    // Pay Period
    y += 30;
    doc.setFontSize(12);
    doc.setTextColor(26, 71, 49);
    doc.text("Pay Period", margin, y);
    y += 20;
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`Period: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`, margin, y);
    y += 15;
    doc.text(`Pay Date: ${payDate.toLocaleDateString()}`, margin, y);

    // Earnings
    y += 30;
    doc.setFontSize(12);
    doc.setTextColor(26, 71, 49);
    doc.text("Earnings", margin, y);
    y += 20;
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.setLineWidth(1);
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y, pageWidth - margin, y);
    y += 15;
    doc.text("Regular Hours", margin, y);
    doc.text(`${hours.toFixed(2)}`, margin + 200, y);
    doc.text(`@ $${rate.toFixed(2)}`, margin + 280, y);
    doc.text(`$${regularPay.toFixed(2)}`, pageWidth - margin - 80, y, { align: "right" });
    
    if (overtime > 0) {
      y += 15;
      doc.text("Overtime Hours", margin, y);
      doc.text(`${overtime.toFixed(2)}`, margin + 200, y);
      doc.text(`@ $${(rate * 1.5).toFixed(2)}`, margin + 280, y);
      doc.text(`$${overtimePay.toFixed(2)}`, pageWidth - margin - 80, y, { align: "right" });
    }
    
    y += 20;
    doc.line(margin, y, pageWidth - margin, y);
    y += 15;
    doc.setFont(undefined, 'bold');
    doc.text("Gross Pay", margin, y);
    doc.text(`$${grossPay.toFixed(2)}`, pageWidth - margin - 80, y, { align: "right" });
    doc.setFont(undefined, 'normal');

    // Deductions
    y += 30;
    doc.setFontSize(12);
    doc.setTextColor(26, 71, 49);
    doc.text("Deductions", margin, y);
    y += 20;
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.line(margin, y, pageWidth - margin, y);
    y += 15;
    doc.text("Social Security (6.2%)", margin, y);
    doc.text(`$${ssTax.toFixed(2)}`, pageWidth - margin - 80, y, { align: "right" });
    y += 15;
    doc.text("Medicare (1.45%)", margin, y);
    doc.text(`$${medTax.toFixed(2)}`, pageWidth - margin - 80, y, { align: "right" });
    y += 15;
    doc.text("State Tax (5%)", margin, y);
    doc.text(`$${stateTax.toFixed(2)}`, pageWidth - margin - 80, y, { align: "right" });
    
    if (formData.includeLocalTax) {
      y += 15;
      doc.text("Local Tax (1%)", margin, y);
      doc.text(`$${localTax.toFixed(2)}`, pageWidth - margin - 80, y, { align: "right" });
    }
    
    y += 20;
    doc.line(margin, y, pageWidth - margin, y);
    y += 15;
    doc.setFont(undefined, 'bold');
    doc.text("Total Deductions", margin, y);
    doc.text(`$${totalTax.toFixed(2)}`, pageWidth - margin - 80, y, { align: "right" });
    doc.setFont(undefined, 'normal');

    // Net Pay
    y += 30;
    doc.setFillColor(26, 71, 49);
    doc.rect(margin, y - 10, pageWidth - 2 * margin, 40, 'F');
    y += 10;
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.setFont(undefined, 'bold');
    doc.text("NET PAY", margin + 10, y);
    doc.text(`$${netPay.toFixed(2)}`, pageWidth - margin - 10, y, { align: "right" });
    doc.setFont(undefined, 'normal');

    // Direct Deposit
    y += 40;
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text("Direct Deposit", margin, y);
    y += 15;
    doc.text(`Bank: ${formData.bankName || ""} | Account: ****${formData.bank || "0000"}`, margin, y);

    startDate.setDate(startDate.getDate() + periodLength);
  }

  doc.save(`PayStub-${formData.name || "document"}.pdf`);
};
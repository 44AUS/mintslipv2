import { jsPDF } from "jspdf";
import JSZip from "jszip";
import { saveAs } from "file-saver";

// Helper to calculate next weekday
const DAY_MAP = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
};

function nextWeekday(date, weekday) {
  const result = new Date(date);
  const target = DAY_MAP[weekday];
  if (target === undefined) return result;
  while (result.getDay() !== target) {
    result.setDate(result.getDate() + 1);
  }
  return result;
}

export const generateAndDownloadPaystub = async (formData, template = 'template-a', numStubs) => {
  const rate = parseFloat(formData.rate) || 0;
  const calculatedNumStubs = numStubs || 1;
  const payFrequency = formData.payFrequency || "biweekly";
  const periodLength = payFrequency === "biweekly" ? 14 : 7;
  const defaultHours = payFrequency === "weekly" ? 40 : 80;
  const payDay = formData.payDay || "Friday";

  const hoursArray = formData.hoursList
    .split(",")
    .map((h) => parseFloat(h.trim()) || 0)
    .slice(0, calculatedNumStubs) || [];
  const overtimeArray = formData.overtimeList
    .split(",")
    .map((h) => parseFloat(h.trim()) || 0)
    .slice(0, calculatedNumStubs) || [];

  const hireDate = formData.hireDate ? new Date(formData.hireDate) : new Date();
  let startDate = formData.startDate ? new Date(formData.startDate) : new Date(hireDate);

  // State tax rates
  const stateRates = {
    AL: 0.05, AK: 0, AZ: 0.025, AR: 0.047, CA: 0.06, CO: 0.0455, CT: 0.05,
    DE: 0.052, FL: 0, GA: 0.0575, HI: 0.07, ID: 0.059, IL: 0.0495, IN: 0.0323,
    IA: 0.05, KS: 0.0525, KY: 0.045, LA: 0.045, ME: 0.0715, MD: 0.0575,
    MA: 0.05, MI: 0.0425, MN: 0.055, MS: 0.05, MO: 0.05, MT: 0.0675, NE: 0.05,
    NV: 0, NH: 0, NJ: 0.0637, NM: 0.049, NY: 0.064, NC: 0.0475, ND: 0.027,
    OH: 0.035, OK: 0.05, OR: 0.08, PA: 0.0307, RI: 0.0375, SC: 0.07, SD: 0,
    TN: 0, TX: 0, UT: 0.0485, VT: 0.065, VA: 0.0575, WA: 0, WV: 0.065,
    WI: 0.053, WY: 0,
  };

  const state = formData.state?.toUpperCase() || "";
  const stateRate = stateRates[state] || 0.05;

  // If multiple stubs, create ZIP
  if (calculatedNumStubs > 1) {
    const zip = new JSZip();
    let currentStartDate = new Date(startDate);
    
    for (let stubNum = 0; stubNum < calculatedNumStubs; stubNum++) {
      const doc = new jsPDF({ unit: "pt", format: "letter" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      
      const stubData = generateSingleStub(
        doc, formData, template, stubNum, new Date(currentStartDate), periodLength, 
        hoursArray, overtimeArray, defaultHours, rate, stateRate, 
        payDay, pageWidth, pageHeight, calculatedNumStubs
      );
      
      // Simple filename with date
      const fileName = `PayStub_${stubData.payDate.toISOString().split('T')[0]}.pdf`;
      
      // Add PDF directly to zip root
      const pdfBlob = doc.output('blob');
      zip.file(fileName, pdfBlob);
      
      currentStartDate.setDate(currentStartDate.getDate() + periodLength);
    }
    
    // Generate and download ZIP
    const zipBlob = await zip.generateAsync({ type: "blob" });
    saveAs(zipBlob, `PayStubs_${formData.name || "Employee"}.zip`);
    
  } else {
    // Single stub - download directly as PDF
    const doc = new jsPDF({ unit: "pt", format: "letter" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    generateSingleStub(
      doc, formData, template, 0, startDate, periodLength,
      hoursArray, overtimeArray, defaultHours, rate, stateRate,
      payDay, pageWidth, pageHeight, 1
    );
    
    doc.save(`PayStub-${formData.name || "document"}.pdf`);
  }
};

// Helper function to generate a single paystub
function generateSingleStub(
  doc, formData, template, stubNum, startDate, periodLength,
  hoursArray, overtimeArray, defaultHours, rate, stateRate,
  payDay, pageWidth, pageHeight, totalStubs
) {
  const hours = hoursArray[stubNum] || defaultHours;
  const overtime = overtimeArray[stubNum] || 0;
  const regularPay = rate * hours;
  const overtimePay = rate * 1.5 * overtime;
  const grossPay = regularPay + overtimePay;

  const ssTax = grossPay * 0.062;
  const medTax = grossPay * 0.0145;
  const stateTax = grossPay * stateRate;
  const localTax = formData.includeLocalTax ? grossPay * 0.01 : 0;
  const totalTax = ssTax + medTax + stateTax + localTax;
  const netPay = grossPay - totalTax;

  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + periodLength - 1);
  const payDate = nextWeekday(new Date(endDate), payDay);

    // Template-specific styling
    let primaryColor, accentColor, headerBg;
    if (template === 'template-b') {
      primaryColor = [41, 128, 185]; // Blue
      accentColor = [52, 152, 219];
      headerBg = [236, 240, 241];
    } else if (template === 'template-c') {
      primaryColor = [142, 68, 173]; // Purple
      accentColor = [155, 89, 182];
      headerBg = [245, 242, 248];
    } else {
      primaryColor = [44, 62, 80]; // Dark gray (default)
      accentColor = [52, 73, 94];
      headerBg = [236, 240, 241];
    }

    let y = 40;
    const margin = 40;

    // Header with company name
    doc.setFillColor(...headerBg);
    doc.rect(0, 0, pageWidth, 100, 'F');
    
    doc.setFontSize(28);
    doc.setTextColor(...primaryColor);
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
    doc.setTextColor(...accentColor);
    doc.setFont(undefined, 'bold');
    doc.text("PAY STUB", pageWidth / 2, y, { align: 'center' });

    // Employee Info Section
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

    // Pay Period Section
    y += 35;
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...primaryColor);
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

    // Earnings Section
    y += 35;
    doc.setFont(undefined, 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...primaryColor);
    doc.text("Earnings", margin, y);
    
    y += 5;
    doc.line(margin, y, pageWidth - margin, y);
    
    y += 20;
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    
    // Table header
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

    // Deductions Section
    y += 30;
    doc.setFontSize(12);
    doc.setTextColor(...primaryColor);
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
    doc.text(`State Tax (${(stateRate * 100).toFixed(2)}%)`, margin, y);
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

    // Net Pay - Highlighted
    y += 30;
    doc.setFillColor(...accentColor);
    doc.rect(margin, y - 15, pageWidth - 2 * margin, 45, 'F');
    
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.setFont(undefined, 'bold');
    doc.text("NET PAY", margin + 15, y + 5);
    doc.text(`$${netPay.toFixed(2)}`, pageWidth - margin - 15, y + 5, { align: 'right' });

    // Direct Deposit Info
    y += 60;
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.setFont(undefined, 'normal');
    doc.text(`Direct Deposit: ${formData.bankName || ""} | Account: ****${formData.bank || "0000"}`, margin, y);

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Stub ${stubNum + 1} of ${totalStubs}`, pageWidth / 2, pageHeight - 30, { align: 'center' });

  return { payDate, startDate, endDate };
}
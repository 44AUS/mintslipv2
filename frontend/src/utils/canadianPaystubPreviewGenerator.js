import { jsPDF } from "jspdf";
import { generateCanadianTemplateA, generateCanadianTemplateB, generateCanadianTemplateC } from "./canadianPaystubTemplates";
import { calculateCanadianTaxes } from "./canadianTaxRates";
import * as pdfjsLib from 'pdfjs-dist';

// Set up pdf.js worker using unpkg CDN with correct version
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

// Convert PDF to image using pdf.js
async function convertPdfToImage(pdfDataUrl) {
  const base64Data = pdfDataUrl.split(',')[1];
  const binaryString = atob(base64Data);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  const loadingTask = pdfjsLib.getDocument({ data: bytes.buffer });
  const pdf = await loadingTask.promise;
  const page = await pdf.getPage(1);
  
  const scale = 2;
  const viewport = page.getViewport({ scale });
  
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  
  await page.render({
    canvasContext: context,
    viewport: viewport
  }).promise;
  
  return canvas.toDataURL('image/png', 0.9);
}

// Helper to calculate next weekday
const DAY_MAP = {
  Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6,
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

// Helper function to calculate number of pay periods from hire date
function calculatePayPeriodsFromHireDate(hireDate, currentPeriodEnd, periodLength) {
  const payPeriodYear = currentPeriodEnd.getFullYear();
  const startOfYear = new Date(payPeriodYear, 0, 1);
  const ytdStartDate = hireDate > startOfYear ? hireDate : startOfYear;
  const diffTime = currentPeriodEnd.getTime() - ytdStartDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(1, Math.ceil(diffDays / periodLength));
}

// Add watermark to all pages
function addWatermarkToAllPages(doc, pageWidth, pageHeight) {
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.saveGraphicsState();
    doc.setTextColor(200, 200, 200);
    doc.setFontSize(60);
    doc.setFont("helvetica", "bold");
    const text = "MintSlip";
    const centerX = pageWidth / 2;
    const centerY = pageHeight / 2;
    doc.text(text, centerX, centerY, { align: "center", angle: 45 });
    doc.setFontSize(14);
    doc.setTextColor(180, 180, 180);
    doc.text("Watermark removed after payment", centerX, centerY + 40, { align: "center" });
    doc.restoreGraphicsState();
  }
}

export async function generateCanadianPreviewPDF(formData, template) {
  try {
    const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "letter" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 40;

    // Parse form data
    const rate = parseFloat(formData.rate) || 0;
    const annualSalary = parseFloat(formData.annualSalary) || 0;
    const payFrequency = formData.payFrequency || "biweekly";
    const periodLength = payFrequency === "biweekly" ? 14 : 7;
    const defaultHours = payFrequency === "weekly" ? 40 : 80;
    const payDay = formData.payDay || "Friday";
    const payType = formData.payType || "hourly";
    const workerType = formData.workerType || "employee";
    const isContractor = workerType === "contractor";
    const province = formData.province || "ON";
    const isQuebec = province === "QC";
    
    const periodsPerYear = payFrequency === "weekly" ? 52 : 26;

    // Get hours
    const hours = formData.hoursList 
      ? parseFloat(formData.hoursList.split(",")[0]) || defaultHours 
      : defaultHours;
    const overtime = isContractor ? 0 : (formData.overtimeList 
      ? parseFloat(formData.overtimeList.split(",")[0]) || 0 
      : 0);

    // Calculate period dates
    const startDate = formData.startDate ? new Date(formData.startDate) : new Date();
    const endDate = formData.endDate ? new Date(formData.endDate) : new Date(startDate.getTime() + (periodLength - 1) * 24 * 60 * 60 * 1000);
    const payDate = nextWeekday(endDate, payDay);
    const hireDate = formData.hireDate ? new Date(formData.hireDate) : startDate;

    // Calculate YTD pay periods
    const ytdPayPeriods = calculatePayPeriodsFromHireDate(hireDate, endDate, periodLength);

    // Calculate earnings
    let regularPay, overtimePay, grossPay;
    if (payType === "salary") {
      regularPay = annualSalary / periodsPerYear;
      overtimePay = 0;
      grossPay = regularPay;
    } else {
      regularPay = rate * hours;
      overtimePay = rate * 1.5 * overtime;
      grossPay = regularPay + overtimePay;
    }

    // Calculate Canadian taxes
    let cpp = 0, ei = 0, qpip = 0, federalTax = 0, provincialTax = 0, totalTax = 0;
    
    if (!isContractor && province) {
      const taxes = calculateCanadianTaxes(grossPay, payFrequency, province, 0);
      cpp = taxes.cpp;
      ei = taxes.ei;
      qpip = taxes.qpip;
      federalTax = taxes.federalTax;
      provincialTax = taxes.provincialTax;
      totalTax = taxes.totalTax;
    }

    // Process deductions
    const deductions = formData.deductions || [];
    let totalDeductions = 0;
    const deductionsData = deductions.map(d => {
      const amount = d.isPercentage ? (grossPay * parseFloat(d.amount) / 100) : parseFloat(d.amount) || 0;
      totalDeductions += amount;
      return { ...d, amount, ytdAmount: amount * ytdPayPeriods };
    });

    // Process contributions
    const contributions = formData.contributions || [];
    let totalContributions = 0;
    const contributionsData = contributions.map(c => {
      const amount = c.isPercentage ? (grossPay * parseFloat(c.amount) / 100) : parseFloat(c.amount) || 0;
      totalContributions += amount;
      return { ...c, amount, ytdAmount: amount * ytdPayPeriods };
    });

    const netPay = grossPay - totalTax - totalDeductions;
    const totalHours = hours + overtime;

    // Prepare template data
    const templateData = {
      formData,
      hours,
      overtime,
      regularPay,
      overtimePay,
      grossPay,
      cpp,
      ei,
      qpip,
      federalTax,
      provincialTax,
      totalTax,
      netPay,
      rate,
      startDate,
      endDate,
      payDate,
      payFrequency,
      stubNum: 1,
      totalStubs: 1,
      ytdRegularPay: regularPay * ytdPayPeriods,
      ytdOvertimePay: overtimePay * ytdPayPeriods,
      ytdGrossPay: grossPay * ytdPayPeriods,
      ytdCpp: cpp * ytdPayPeriods,
      ytdEi: ei * ytdPayPeriods,
      ytdQpip: qpip * ytdPayPeriods,
      ytdFederalTax: federalTax * ytdPayPeriods,
      ytdProvincialTax: provincialTax * ytdPayPeriods,
      ytdTotalTax: totalTax * ytdPayPeriods,
      ytdNetPay: netPay * ytdPayPeriods,
      ytdHours: totalHours * ytdPayPeriods,
      payType,
      workerType,
      isContractor,
      annualSalary,
      deductionsData,
      totalDeductions,
      contributionsData,
      totalContributions,
      ytdDeductions: totalDeductions * ytdPayPeriods,
      ytdContributions: totalContributions * ytdPayPeriods,
      ytdPayPeriods,
      logoDataUrl: formData.logoDataUrl || formData.companyLogo,
      isQuebec,
      cppLabel: isQuebec ? 'QPP' : 'CPP',
      isPreview: true,
    };

    // Generate selected template
    if (template === "template-b") {
      await generateCanadianTemplateB(doc, templateData, pageWidth, pageHeight, margin);
    } else if (template === "template-c") {
      await generateCanadianTemplateC(doc, templateData, pageWidth, pageHeight, margin);
    } else {
      await generateCanadianTemplateA(doc, templateData, pageWidth, pageHeight, margin);
    }

    // Add watermark
    addWatermarkToAllPages(doc, pageWidth, pageHeight);

    // Convert to image for preview
    const pdfDataUrl = doc.output('dataurlstring');
    const imageDataUrl = await convertPdfToImage(pdfDataUrl);
    
    return imageDataUrl;
  } catch (error) {
    console.error("Error generating Canadian preview:", error);
    throw error;
  }
}

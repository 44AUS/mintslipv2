import { jsPDF } from "jspdf";
import { generateCanadianTemplateA, generateCanadianTemplateB, generateCanadianTemplateC } from "./canadianPaystubTemplates";
import { calculateCanadianTaxes } from "./canadianTaxRates";

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

// Calculate number of pay periods from hire date to current period
function calculatePayPeriodsFromHireDate(hireDate, currentPeriodEnd, periodLength) {
  const payPeriodYear = currentPeriodEnd.getFullYear();
  const startOfYear = new Date(payPeriodYear, 0, 1);
  const ytdStartDate = hireDate > startOfYear ? hireDate : startOfYear;
  const diffTime = currentPeriodEnd.getTime() - ytdStartDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const numPeriods = Math.max(1, Math.ceil(diffDays / periodLength));
  return numPeriods;
}

export async function generateAndDownloadCanadianPaystub(formData, template) {
  const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "letter" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;

  // Parse form data
  const start = new Date(formData.startDate);
  const end = new Date(formData.endDate);
  const hire = formData.hireDate ? new Date(formData.hireDate) : start;
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const periodLength = formData.payFrequency === "biweekly" ? 14 : 7;
  const numStubs = Math.max(1, Math.ceil(diffDays / periodLength));
  const defaultHours = formData.payFrequency === "weekly" ? 40 : 80;
  
  const rate = parseFloat(formData.rate) || 0;
  const annualSalary = parseFloat(formData.annualSalary) || 0;
  const periodsPerYear = formData.payFrequency === "weekly" ? 52 : 26;
  
  const hoursArray = formData.hoursList
    ? formData.hoursList.split(",").map((h) => parseFloat(h.trim()) || defaultHours)
    : Array(numStubs).fill(defaultHours);
  const overtimeArray = formData.overtimeList
    ? formData.overtimeList.split(",").map((h) => parseFloat(h.trim()) || 0)
    : Array(numStubs).fill(0);

  const isContractor = formData.workerType === "contractor";
  const payType = formData.payType || "hourly";
  const isQuebec = formData.province === "QC";

  // Process deductions and contributions
  const deductions = formData.deductions || [];
  const contributions = formData.contributions || [];

  // YTD tracking
  let ytdGrossPay = 0, ytdRegularPay = 0, ytdOvertimePay = 0;
  let ytdCpp = 0, ytdEi = 0, ytdQpip = 0, ytdFederalTax = 0, ytdProvincialTax = 0, ytdTotalTax = 0;
  let ytdNetPay = 0, ytdHours = 0;
  let ytdDeductions = 0, ytdContributions = 0;

  // Calculate number of prior pay periods for YTD
  let currentPeriodStart = new Date(start);
  for (let i = 0; i < numStubs; i++) {
    const periodEnd = new Date(currentPeriodStart);
    periodEnd.setDate(currentPeriodStart.getDate() + periodLength - 1);
    
    const ytdPayPeriods = calculatePayPeriodsFromHireDate(hire, periodEnd, periodLength);
    
    const hours = hoursArray[i] || defaultHours;
    const overtime = isContractor ? 0 : (overtimeArray[i] || 0);
    const totalHours = hours + overtime;

    // Calculate pay
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
    
    if (!isContractor) {
      const taxes = calculateCanadianTaxes(grossPay, formData.payFrequency, formData.province, ytdGrossPay);
      cpp = taxes.cpp;
      ei = taxes.ei;
      qpip = taxes.qpip;
      federalTax = taxes.federalTax;
      provincialTax = taxes.provincialTax;
      totalTax = taxes.totalTax;
    }

    // Calculate deductions for this period
    let periodDeductions = 0;
    const deductionsData = deductions.map(d => {
      const amount = d.isPercentage ? (grossPay * parseFloat(d.amount) / 100) : parseFloat(d.amount) || 0;
      periodDeductions += amount;
      return { ...d, amount, ytdAmount: (ytdDeductions / (i || 1)) * (i + 1) + amount };
    });

    // Calculate contributions for this period
    let periodContributions = 0;
    const contributionsData = contributions.map(c => {
      const amount = c.isPercentage ? (grossPay * parseFloat(c.amount) / 100) : parseFloat(c.amount) || 0;
      periodContributions += amount;
      return { ...c, amount, ytdAmount: (ytdContributions / (i || 1)) * (i + 1) + amount };
    });

    // Update YTD totals
    ytdGrossPay += grossPay;
    ytdRegularPay += regularPay;
    ytdOvertimePay += overtimePay;
    ytdCpp += cpp;
    ytdEi += ei;
    ytdQpip += qpip;
    ytdFederalTax += federalTax;
    ytdProvincialTax += provincialTax;
    ytdTotalTax += totalTax;
    ytdHours += totalHours;
    ytdDeductions += periodDeductions;
    ytdContributions += periodContributions;

    const netPay = grossPay - totalTax - periodDeductions;
    ytdNetPay += netPay;

    // Calculate pay date
    const payDate = nextWeekday(periodEnd, formData.payDay || "Friday");

    // Prepare data for template
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
      startDate: currentPeriodStart,
      endDate: periodEnd,
      payDate,
      payFrequency: formData.payFrequency,
      stubNum: i + 1,
      totalStubs: numStubs,
      ytdRegularPay,
      ytdOvertimePay,
      ytdGrossPay,
      ytdCpp,
      ytdEi,
      ytdQpip,
      ytdFederalTax,
      ytdProvincialTax,
      ytdTotalTax,
      ytdNetPay,
      ytdHours,
      payType,
      workerType: formData.workerType,
      isContractor,
      annualSalary,
      deductionsData,
      totalDeductions: periodDeductions,
      contributionsData,
      totalContributions: periodContributions,
      ytdDeductions,
      ytdContributions,
      ytdPayPeriods,
      logoDataUrl: formData.logoDataUrl,
      isQuebec,
      cppLabel: isQuebec ? 'QPP' : 'CPP',
    };

    // Add new page for subsequent stubs
    if (i > 0) {
      doc.addPage();
    }

    // Generate based on template
    if (template === "template-b") {
      await generateCanadianTemplateB(doc, templateData, pageWidth, pageHeight, margin);
    } else if (template === "template-c") {
      await generateCanadianTemplateC(doc, templateData, pageWidth, pageHeight, margin);
    } else {
      await generateCanadianTemplateA(doc, templateData, pageWidth, pageHeight, margin);
    }

    // Move to next period
    currentPeriodStart = new Date(periodEnd);
    currentPeriodStart.setDate(currentPeriodStart.getDate() + 1);
  }

  // Download the PDF
  const fileName = `canadian_paystub_${formData.name?.replace(/\s+/g, '_') || 'employee'}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}

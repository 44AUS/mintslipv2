import { jsPDF } from "jspdf";
import { generateTemplateA, generateTemplateB, generateTemplateC } from "./paystubTemplates";
import { calculateFederalTax, calculateStateTax, getStateTaxRate } from "./federalTaxCalculator";

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

// Helper function to calculate number of pay periods from hire date
function calculatePayPeriodsFromHireDate(hireDate, currentPeriodEnd, periodLength) {
  const payPeriodYear = currentPeriodEnd.getFullYear();
  const startOfYear = new Date(payPeriodYear, 0, 1);
  const ytdStartDate = hireDate > startOfYear ? hireDate : startOfYear;
  const diffTime = currentPeriodEnd.getTime() - ytdStartDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const numPeriods = Math.max(1, Math.ceil(diffDays / periodLength));
  return numPeriods;
}

// Add watermark to ALL pages of the PDF
function addWatermarkToAllPages(doc, pageWidth, pageHeight) {
  const totalPages = doc.internal.getNumberOfPages();
  
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    
    // Save current state
    doc.saveGraphicsState();
    
    // Set watermark properties
    doc.setTextColor(200, 200, 200); // Light gray
    doc.setFontSize(60);
    doc.setFont("helvetica", "bold");
    
    // Calculate center position
    const text = "MintSlip";
    const textWidth = doc.getTextWidth(text);
    
    // Rotate and draw watermark diagonally across the page
    const centerX = pageWidth / 2;
    const centerY = pageHeight / 2;
    
    // Draw multiple watermarks
    for (let j = 0; j < 3; j++) {
      const yOffset = (j - 1) * 200;
      doc.text(text, centerX - textWidth / 2, centerY + yOffset, { 
        angle: 45,
        align: 'center'
      });
    }
    
    // Add "PREVIEW" text at top
    doc.setFontSize(40);
    doc.setTextColor(255, 100, 100); // Light red
    doc.text("PREVIEW", centerX, 50, { align: 'center' });
    
    // Restore state
    doc.restoreGraphicsState();
  }
}

// Generate preview PDF as base64 data URL
export const generatePreviewPDF = async (formData, template = 'template-a') => {
  try {
    const rate = parseFloat(formData.rate) || 0;
    const annualSalary = parseFloat(formData.annualSalary) || 0;
    const payFrequency = formData.payFrequency || "biweekly";
    const periodLength = payFrequency === "biweekly" ? 14 : 7;
    const defaultHours = payFrequency === "weekly" ? 40 : 80;
    const payDay = formData.payDay || "Friday";
    const payType = formData.payType || "hourly";
    const workerType = formData.workerType || "employee";
    const isContractor = workerType === "contractor";

    const periodsPerYear = payFrequency === "weekly" ? 52 : 26;

    const hoursArray = (formData.hoursList || "")
      .split(",")
      .map((h) => parseFloat(h.trim()) || 0);
    const overtimeArray = (formData.overtimeList || "")
      .split(",")
      .map((h) => parseFloat(h.trim()) || 0);

    const hireDate = formData.hireDate ? new Date(formData.hireDate) : new Date();
    const startDate = formData.startDate ? new Date(formData.startDate) : new Date(hireDate);

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
    const stateRate = isContractor ? 0 : (stateRates[state] || 0.05);

    // Create PDF document
    const doc = new jsPDF({ unit: "pt", format: "letter" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 40;

    // Calculate pay values for preview (first stub)
    let hours = 0;
    let overtime = 0;
    let regularPay = 0;
    let overtimePay = 0;
    let grossPay = 0;

    if (payType === "salary") {
      grossPay = annualSalary / periodsPerYear;
      regularPay = grossPay;
      hours = defaultHours;
      overtime = 0;
      overtimePay = 0;
    } else {
      hours = hoursArray[0] || defaultHours;
      overtime = overtimeArray[0] || 0;
      regularPay = rate * hours;
      overtimePay = rate * 1.5 * overtime;
      grossPay = regularPay + overtimePay;
    }

    const ssTax = isContractor ? 0 : grossPay * 0.062;
    const medTax = isContractor ? 0 : grossPay * 0.0145;
    
    // Calculate federal income tax based on filing status (no allowances per 2020+ W-4)
    let federalTax = 0;
    if (!isContractor) {
      if (formData.federalFilingStatus) {
        federalTax = calculateFederalTax(
          grossPay,
          payFrequency,
          formData.federalFilingStatus
        );
      } else {
        federalTax = grossPay * 0.22;
      }
    }
    
    // Calculate state tax with allowances (only for applicable states)
    let stateTax = 0;
    if (!isContractor) {
      stateTax = calculateStateTax(
        grossPay,
        formData.state,
        payFrequency,
        formData.stateAllowances || 0,
        stateRate
      );
    }
    
    const localTax = isContractor ? 0 : (formData.includeLocalTax ? grossPay * 0.01 : 0);
    const totalTax = ssTax + medTax + federalTax + stateTax + localTax;

    // Calculate deductions for preview
    const deductionsData = (formData.deductions || []).map(d => {
      const amount = parseFloat(d.amount) || 0;
      const currentAmount = d.isPercentage ? (grossPay * amount / 100) : amount;
      return {
        ...d,
        currentAmount,
        name: d.type === 'other' ? d.name : d.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
      };
    });
    const totalDeductions = deductionsData.reduce((sum, d) => sum + d.currentAmount, 0);

    // Calculate contributions for preview
    const contributionsData = (formData.contributions || []).map(c => {
      const amount = parseFloat(c.amount) || 0;
      const currentAmount = c.isPercentage ? (grossPay * amount / 100) : amount;
      return {
        ...c,
        currentAmount,
        name: c.type === 'other' ? c.name : c.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
      };
    });
    const totalContributions = contributionsData.reduce((sum, c) => sum + c.currentAmount, 0);

    const netPay = grossPay - totalTax - totalDeductions - totalContributions;

    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + periodLength - 1);
    const payDate = nextWeekday(new Date(endDate), payDay);

    // Calculate YTD
    const ytdPayPeriods = calculatePayPeriodsFromHireDate(hireDate, endDate, periodLength);
    const ytdRegularPay = regularPay * ytdPayPeriods;
    const ytdOvertimePay = overtimePay * ytdPayPeriods;
    const ytdGrossPay = grossPay * ytdPayPeriods;
    const ytdSsTax = ssTax * ytdPayPeriods;
    const ytdMedTax = medTax * ytdPayPeriods;
    const ytdFederalTax = federalTax * ytdPayPeriods;
    const ytdStateTax = stateTax * ytdPayPeriods;
    const ytdLocalTax = localTax * ytdPayPeriods;
    const ytdTotalTax = totalTax * ytdPayPeriods;
    const ytdDeductions = totalDeductions * ytdPayPeriods;
    const ytdContributions = totalContributions * ytdPayPeriods;
    const ytdNetPay = netPay * ytdPayPeriods;
    const ytdHours = (hours + overtime) * ytdPayPeriods;

    const templateData = {
      formData,
      hours,
      overtime,
      regularPay,
      overtimePay,
      grossPay,
      ssTax,
      medTax,
      federalTax,
      stateTax,
      localTax,
      totalTax,
      netPay,
      rate,
      stateRate,
      startDate,
      endDate,
      payDate,
      payFrequency,
      stubNum: 0,
      totalStubs: 1,
      ytdPayPeriods,
      ytdRegularPay,
      ytdOvertimePay,
      ytdGrossPay,
      ytdSsTax,
      ytdMedTax,
      ytdFederalTax,
      ytdStateTax,
      ytdLocalTax,
      ytdTotalTax,
      ytdNetPay,
      ytdHours,
      payType,
      workerType,
      isContractor,
      annualSalary,
      // Deductions and contributions
      deductionsData,
      totalDeductions,
      contributionsData,
      totalContributions,
      ytdDeductions,
      ytdContributions
    };

    // Generate the template based on selection
    switch (template) {
      case 'template-b':
        generateTemplateB(doc, templateData, pageWidth, pageHeight, margin);
        break;
      case 'template-c':
        generateTemplateC(doc, templateData, pageWidth, pageHeight, margin);
        break;
      case 'template-a':
      default:
        await generateTemplateA(doc, templateData, pageWidth, pageHeight, margin);
        break;
    }

    // Add watermark on ALL pages
    addWatermarkToAllPages(doc, pageWidth, pageHeight);

    // Convert to base64 data URL
    const pdfDataUrl = doc.output('dataurlstring');
    
    return pdfDataUrl;
  } catch (error) {
    console.error("Error generating preview:", error);
    return null;
  }
};

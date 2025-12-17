import { jsPDF } from "jspdf";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { generateTemplateA, generateTemplateB, generateTemplateC } from "./paystubTemplates";
import { getLocalTaxRate, getSUTARate } from "./taxRates";
import { calculateFederalTax, calculateStateTax } from "./federalTaxCalculator";

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
  try {
    console.log("Starting PDF generation...", { formData, template, numStubs });
    
    const rate = parseFloat(formData.rate) || 0;
    const annualSalary = parseFloat(formData.annualSalary) || 0;
    const calculatedNumStubs = numStubs || 1;
    const payFrequency = formData.payFrequency || "biweekly";
    const periodLength = payFrequency === "biweekly" ? 14 : 7;
    const defaultHours = payFrequency === "weekly" ? 40 : 80;
    const payDay = formData.payDay || "Friday";
    const payType = formData.payType || "hourly";
    const workerType = formData.workerType || "employee";
    const isContractor = workerType === "contractor";

    // Calculate salary per period if salary type
    const periodsPerYear = payFrequency === "weekly" ? 52 : 26;
    const salaryPerPeriod = payType === "salary" ? annualSalary / periodsPerYear : 0;

    const hoursArray = (formData.hoursList || "")
      .split(",")
      .map((h) => parseFloat(h.trim()) || 0)
      .slice(0, calculatedNumStubs);
    const overtimeArray = (formData.overtimeList || "")
      .split(",")
      .map((h) => parseFloat(h.trim()) || 0)
      .slice(0, calculatedNumStubs);

    const hireDate = formData.hireDate ? new Date(formData.hireDate) : new Date();
    let startDate = formData.startDate ? new Date(formData.startDate) : new Date(hireDate);

    // State tax rates (not applied to contractors)
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

    console.log("Calculated values:", { calculatedNumStubs, rate, payFrequency, payType, workerType, isContractor });

    // If multiple stubs, create ZIP
    if (calculatedNumStubs > 1) {
      console.log("Creating ZIP for multiple stubs...");
      const zip = new JSZip();
      let currentStartDate = new Date(startDate);
      
      for (let stubNum = 0; stubNum < calculatedNumStubs; stubNum++) {
        console.log(`Generating stub ${stubNum + 1}/${calculatedNumStubs}`);
        const doc = new jsPDF({ unit: "pt", format: "letter" });
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        
        const stubData = await generateSingleStub(
          doc, formData, template, stubNum, new Date(currentStartDate), periodLength, 
          hoursArray, overtimeArray, defaultHours, rate, stateRate, 
          payDay, pageWidth, pageHeight, calculatedNumStubs, payFrequency
        );
        
        // Simple filename with date
        const fileName = `${formData.name}-paystub-${stubData.payDate.toISOString().split('T')[0]}.pdf`;
        console.log(`Adding ${fileName} to ZIP`);
        
        // Add PDF directly to zip root
        const pdfBlob = doc.output('blob');
        zip.file(fileName, pdfBlob);
        
        currentStartDate.setDate(currentStartDate.getDate() + periodLength);
      }
      
      // Generate and download ZIP
      console.log("Generating ZIP file...");
      const zipBlob = await zip.generateAsync({ type: "blob" });
      saveAs(zipBlob, `Paystubs_${formData.name || "Employee"}.zip`);
      console.log("ZIP downloaded successfully");
      
    } else {
      // Single stub - download directly as PDF
      console.log("Generating single PDF...");
      const doc = new jsPDF({ unit: "pt", format: "letter" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      
      await generateSingleStub(
        doc, formData, template, 0, startDate, periodLength,
        hoursArray, overtimeArray, defaultHours, rate, stateRate,
        payDay, pageWidth, pageHeight, 1, payFrequency
      );
      
      doc.save(`PayStub-${formData.name || "document"}.pdf`);
      console.log("PDF downloaded successfully");
    }
  } catch (error) {
    console.error("Error generating paystub:", error);
    throw error;
  }
};

// Helper function to calculate number of pay periods from hire date to current pay period end
function calculatePayPeriodsFromHireDate(hireDate, currentPeriodEnd, periodLength) {
  // Use the start of the year of the current pay period OR hire date, whichever is later
  const payPeriodYear = currentPeriodEnd.getFullYear();
  const startOfYear = new Date(payPeriodYear, 0, 1);
  
  // YTD starts from either January 1 of the pay period year OR hire date (whichever is later)
  const ytdStartDate = hireDate > startOfYear ? hireDate : startOfYear;
  
  // Calculate number of days from YTD start to current period end
  const diffTime = currentPeriodEnd.getTime() - ytdStartDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  // Calculate number of complete pay periods (at least 1)
  const numPeriods = Math.max(1, Math.ceil(diffDays / periodLength));
  
  return numPeriods;
}

// Helper function to generate a single paystub
async function generateSingleStub(
  doc, formData, template, stubNum, startDate, periodLength,
  hoursArray, overtimeArray, defaultHours, rate, stateRate,
  payDay, pageWidth, pageHeight, totalStubs, payFrequency
) {
  const payType = formData.payType || "hourly";
  const workerType = formData.workerType || "employee";
  const isContractor = workerType === "contractor";
  const annualSalary = parseFloat(formData.annualSalary) || 0;
  const periodsPerYear = payFrequency === "weekly" ? 52 : 26;
  
  // Calculate gross pay based on pay type
  let hours = 0;
  let overtime = 0;
  let regularPay = 0;
  let overtimePay = 0;
  let grossPay = 0;
  
  if (payType === "salary") {
    // Salary calculation - fixed amount per period
    grossPay = annualSalary / periodsPerYear;
    regularPay = grossPay;
    hours = defaultHours; // Standard hours for display purposes
    overtime = 0;
    overtimePay = 0;
  } else {
    // Hourly calculation
    hours = hoursArray[stubNum] || defaultHours;
    overtime = overtimeArray[stubNum] || 0;
    regularPay = rate * hours;
    overtimePay = rate * 1.5 * overtime;
    grossPay = regularPay + overtimePay;
  }

  // Get actual local tax rate
  const localTaxRate = getLocalTaxRate(formData.state, formData.city);
  
  // Get actual SUTA rate for employer taxes
  const sutaRate = getSUTARate(formData.state);

  // Contractors don't have taxes withheld
  const ssTax = isContractor ? 0 : grossPay * 0.062;
  const medTax = isContractor ? 0 : grossPay * 0.0145;
  const stateTax = isContractor ? 0 : grossPay * stateRate;
  const localTax = isContractor ? 0 : (formData.includeLocalTax && localTaxRate > 0 ? grossPay * localTaxRate : 0);
  const totalTax = ssTax + medTax + stateTax + localTax;

  // Calculate deductions for this pay period
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

  // Calculate contributions for this pay period
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

  // Calculate YTD values based on pay periods from hire date
  const hireDate = formData.hireDate ? new Date(formData.hireDate) : new Date(startDate);
  const ytdPayPeriods = calculatePayPeriodsFromHireDate(hireDate, endDate, periodLength);
  
  // Calculate YTD values
  const ytdRegularPay = regularPay * ytdPayPeriods;
  const ytdOvertimePay = overtimePay * ytdPayPeriods;
  const ytdGrossPay = grossPay * ytdPayPeriods;
  const ytdSsTax = ssTax * ytdPayPeriods;
  const ytdMedTax = medTax * ytdPayPeriods;
  const ytdStateTax = stateTax * ytdPayPeriods;
  const ytdLocalTax = localTax * ytdPayPeriods;
  const ytdTotalTax = totalTax * ytdPayPeriods;
  const ytdDeductions = totalDeductions * ytdPayPeriods;
  const ytdContributions = totalContributions * ytdPayPeriods;
  const ytdNetPay = netPay * ytdPayPeriods;
  const ytdHours = (hours + overtime) * ytdPayPeriods;

  const margin = 40;
  
  // Prepare data object for template
  const templateData = {
    formData,
    hours,
    overtime,
    regularPay,
    overtimePay,
    grossPay,
    ssTax,
    medTax,
    stateTax,
    localTax,
    totalTax,
    netPay,
    rate,
    stateRate,
    localTaxRate,
    sutaRate,
    startDate,
    endDate,
    payDate,
    payFrequency,
    stubNum,
    totalStubs,
    // Deductions and contributions
    deductionsData,
    totalDeductions,
    contributionsData,
    totalContributions,
    ytdDeductions,
    ytdContributions,
    // YTD values
    ytdPayPeriods,
    ytdRegularPay,
    ytdOvertimePay,
    ytdGrossPay,
    ytdSsTax,
    ytdMedTax,
    ytdStateTax,
    ytdLocalTax,
    ytdTotalTax,
    ytdNetPay,
    ytdHours,
    // Worker and pay type
    payType,
    workerType,
    isContractor,
    annualSalary
  };

  // Call the appropriate template
  if (template === 'template-b') {
    generateTemplateB(doc, templateData, pageWidth, pageHeight, margin);
  } else if (template === 'template-c') {
    generateTemplateC(doc, templateData, pageWidth, pageHeight, margin);
  } else {
    await generateTemplateA(doc, templateData, pageWidth, pageHeight, margin);
  }

  return { payDate, startDate, endDate };
}

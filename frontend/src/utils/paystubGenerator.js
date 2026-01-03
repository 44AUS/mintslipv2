import { jsPDF } from "jspdf";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { generateTemplateA, generateTemplateB, generateTemplateC, generateTemplateH } from "./paystubTemplates";
import { getLocalTaxRate, getSUTARate } from "./taxRates";
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

// Helper to format name for filenames (firstName-lastName format)
function formatNameForFilename(name) {
  if (!name) return 'Employee';
  // Replace spaces with dashes and remove any special characters
  return name.trim().replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '');
}

// Helper to get template-specific individual paystub filename
function getIndividualPaystubFilename(template, name, payDate) {
  const date = new Date(payDate);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const yearShort = String(year).slice(-2);
  
  switch (template) {
    case 'template-a': // Gusto: firstName-lastName-paystub-2025-03-21.pdf
      return `${formatNameForFilename(name)}-paystub-${year}-${month}-${day}.pdf`;
    
    case 'template-c': // Workday: Payslip-03_21_2025.pdf
      return `Payslip-${month}_${day}_${year}.pdf`;
    
    case 'template-b': // ADP: Name-Earning Statement_04-21-23.pdf
      return `${formatNameForFilename(name)}-Earning Statement_${month}-${day}-${yearShort}.pdf`;
    
    default:
      return `${formatNameForFilename(name)}-paystub-${year}-${month}-${day}.pdf`;
  }
}

// Helper to get template-specific ZIP filename for multiple paystubs
function getMultiplePaystubsZipFilename(template, name) {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const downloadDate = `${year}-${month}-${day}`;
  
  // All templates use the same ZIP naming format: name-paystubs-downloadDate.zip
  return `${formatNameForFilename(name)}-paystubs-${downloadDate}.zip`;
}

export const generateAndDownloadPaystub = async (formData, template = 'template-a', numStubs, returnBlob = false) => {
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
    
    // Parse per-period check numbers and memos for OnPay template
    const checkNumberArray = (formData.checkNumberList || "")
      .split(",")
      .map((c) => c.trim())
      .slice(0, calculatedNumStubs);
    const memoArray = (formData.memoList || "")
      .split("|||")
      .map((m) => m.trim())
      .slice(0, calculatedNumStubs);
    
    // Parse per-period dates (start, end, pay dates)
    const startDateArray = (formData.startDateList || "")
      .split(",")
      .map((d) => d.trim())
      .filter(d => d)
      .slice(0, calculatedNumStubs);
    const endDateArray = (formData.endDateList || "")
      .split(",")
      .map((d) => d.trim())
      .filter(d => d)
      .slice(0, calculatedNumStubs);
    const payDateArray = (formData.payDateList || "")
      .split(",")
      .map((d) => d.trim())
      .filter(d => d)
      .slice(0, calculatedNumStubs);

    const hireDate = formData.hireDate ? new Date(formData.hireDate) : new Date();
    let startDate = formData.startDate ? new Date(formData.startDate) : new Date(hireDate);

    // Get state tax rate from centralized tax calculator
    const state = formData.state?.toUpperCase() || "";
    const stateRate = isContractor ? 0 : getStateTaxRate(state);

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
          payDay, pageWidth, pageHeight, calculatedNumStubs, payFrequency,
          checkNumberArray, memoArray,
          startDateArray, endDateArray, payDateArray
        );
        
        // Template-specific filename with pay date
        const fileName = getIndividualPaystubFilename(template, formData.name, stubData.payDate);
        console.log(`Adding ${fileName} to ZIP`);
        
        // Add PDF directly to zip root
        const pdfBlob = doc.output('blob');
        zip.file(fileName, pdfBlob);
        
        currentStartDate.setDate(currentStartDate.getDate() + periodLength);
      }
      
      // Generate and download ZIP with template-specific naming
      console.log("Generating ZIP file...");
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const zipFileName = getMultiplePaystubsZipFilename(template, formData.name);
      
      // Store download info for payment success page (use localStorage for persistence)
      const blobUrl = URL.createObjectURL(zipBlob);
      localStorage.setItem('lastDownloadUrl', blobUrl);
      localStorage.setItem('lastDownloadFileName', zipFileName);
      
      saveAs(zipBlob, zipFileName);
      console.log("ZIP downloaded successfully");
      
      // Return blob if requested for saving (with small delay to ensure download initiates)
      if (returnBlob) {
        await new Promise(resolve => setTimeout(resolve, 100));
        return zipBlob;
      }
      
    } else {
      // Single stub - download directly as PDF
      console.log("Generating single PDF...");
      const doc = new jsPDF({ unit: "pt", format: "letter" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      
      const stubData = await generateSingleStub(
        doc, formData, template, 0, startDate, periodLength,
        hoursArray, overtimeArray, defaultHours, rate, stateRate,
        payDay, pageWidth, pageHeight, 1, payFrequency,
        checkNumberArray, memoArray,
        startDateArray, endDateArray, payDateArray
      );
      
      // Template-specific filename with pay date
      const pdfFileName = getIndividualPaystubFilename(template, formData.name, stubData.payDate);
      
      // Store download info for payment success page (use localStorage for persistence)
      const pdfBlob = doc.output('blob');
      const blobUrl = URL.createObjectURL(pdfBlob);
      localStorage.setItem('lastDownloadUrl', blobUrl);
      localStorage.setItem('lastDownloadFileName', pdfFileName);
      
      doc.save(pdfFileName);
      console.log("PDF downloaded successfully");
      
      // Return blob if requested for saving (with small delay to ensure download initiates)
      if (returnBlob) {
        await new Promise(resolve => setTimeout(resolve, 100));
        return pdfBlob;
      }
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
  payDay, pageWidth, pageHeight, totalStubs, payFrequency,
  checkNumberArray = [], memoArray = [],
  startDateArray = [], endDateArray = [], payDateArray = []
) {
  const payType = formData.payType || "hourly";
  const workerType = formData.workerType || "employee";
  const isContractor = workerType === "contractor";
  const annualSalary = parseFloat(formData.annualSalary) || 0;
  const periodsPerYear = payFrequency === "weekly" ? 52 : 26;
  
  // Get per-period check number and memo for OnPay template
  const periodCheckNumber = checkNumberArray[stubNum] || "";
  const periodMemo = memoArray[stubNum] || "";
  
  // Use user-provided dates if available, otherwise use calculated dates
  const actualStartDate = startDateArray[stubNum] ? new Date(startDateArray[stubNum]) : new Date(startDate);
  const actualEndDate = endDateArray[stubNum] ? new Date(endDateArray[stubNum]) : (() => {
    const end = new Date(actualStartDate);
    end.setDate(actualStartDate.getDate() + periodLength - 1);
    return end;
  })();
  
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
      // Default flat rate if no filing status selected
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
  
  const localTax = isContractor ? 0 : (formData.includeLocalTax && localTaxRate > 0 ? grossPay * localTaxRate : 0);
  const totalTax = ssTax + medTax + federalTax + stateTax + localTax;

  // Pre-tax deduction types
  const preTaxDeductionTypes = ['401k', 'health_insurance', 'dental_insurance', 'vision_insurance'];
  const preTaxContributionTypes = ['401k', 'hsa', 'fsa', 'dependent_care_fsa', 'commuter'];

  // Calculate deductions for this pay period
  const deductionsData = (formData.deductions || []).map(d => {
    const amount = parseFloat(d.amount) || 0;
    const currentAmount = d.isPercentage ? (grossPay * amount / 100) : amount;
    const isPreTax = d.preTax !== undefined ? d.preTax : preTaxDeductionTypes.includes(d.type);
    return {
      ...d,
      currentAmount,
      preTax: isPreTax,
      name: d.type === 'other' ? d.name : d.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    };
  });
  const totalDeductions = deductionsData.reduce((sum, d) => sum + d.currentAmount, 0);
  const preTaxDeductions = deductionsData.filter(d => d.preTax).reduce((sum, d) => sum + d.currentAmount, 0);
  const postTaxDeductions = deductionsData.filter(d => !d.preTax).reduce((sum, d) => sum + d.currentAmount, 0);

  // Calculate contributions for this pay period
  const contributionsData = (formData.contributions || []).map(c => {
    const amount = parseFloat(c.amount) || 0;
    const currentAmount = c.isPercentage ? (grossPay * amount / 100) : amount;
    const isPreTax = c.preTax !== undefined ? c.preTax : preTaxContributionTypes.includes(c.type);
    return {
      ...c,
      currentAmount,
      preTax: isPreTax,
      name: c.type === 'other' ? c.name : c.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    };
  });
  const totalContributions = contributionsData.reduce((sum, c) => sum + c.currentAmount, 0);
  const preTaxContributions = contributionsData.filter(c => c.preTax).reduce((sum, c) => sum + c.currentAmount, 0);
  const postTaxContributions = contributionsData.filter(c => !c.preTax).reduce((sum, c) => sum + c.currentAmount, 0);

  // Combined pre-tax and post-tax totals
  const totalPreTax = preTaxDeductions + preTaxContributions;
  const totalPostTax = postTaxDeductions + postTaxContributions;

  const netPay = grossPay - totalTax - totalDeductions - totalContributions;

  // Use user-provided end date if available, otherwise calculate from start date
  const endDate = new Date(actualEndDate);
  
  // Use user-provided pay date if available, otherwise calculate next weekday after end date
  const payDate = payDateArray[stubNum] 
    ? new Date(payDateArray[stubNum]) 
    : nextWeekday(new Date(endDate), payDay);

  // Calculate YTD values based on pay periods from hire date
  const hireDate = formData.hireDate ? new Date(formData.hireDate) : new Date(actualStartDate);
  const ytdPayPeriods = calculatePayPeriodsFromHireDate(hireDate, endDate, periodLength);
  
  // Calculate YTD values
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

  const margin = 40;
  
  // Prepare absence plans data for Template C
  const absencePlansData = (formData.absencePlans || []).map(plan => ({
    description: plan.description || "PTO Plan",
    accrued: plan.accrued || "0",
    reduced: plan.reduced || "0"
  }));

  // Prepare employer benefits data for Template C
  const employerBenefits = formData.employerBenefits || [];
  let totalEmployerBenefits = 0;
  const employerBenefitsData = employerBenefits.map(b => {
    let amount;
    if (b.type === '401k_match') {
      // Calculate 401k match based on employee contribution
      const employee401k = contributionsData.find(c => c.type === '401k' || c.type === 'roth_401k');
      if (employee401k) {
        const matchUpTo = parseFloat(b.matchUpTo) || 6;
        const matchPercent = parseFloat(b.matchPercent) || 50;
        const maxMatchableAmount = grossPay * (matchUpTo / 100);
        const matchableAmount = Math.min(employee401k.currentAmount, maxMatchableAmount);
        amount = matchableAmount * (matchPercent / 100);
      } else {
        amount = 0;
      }
    } else {
      amount = b.isPercentage ? (grossPay * parseFloat(b.amount) / 100) : parseFloat(b.amount) || 0;
    }
    totalEmployerBenefits += amount;
    return { 
      name: b.name || "Employer Benefit", 
      type: b.type,
      currentAmount: amount 
    };
  });
  
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
    federalTax,
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
    preTaxDeductions,
    postTaxDeductions,
    contributionsData,
    totalContributions,
    preTaxContributions,
    postTaxContributions,
    totalPreTax,
    totalPostTax,
    ytdDeductions,
    ytdContributions,
    // YTD values
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
    // Worker and pay type
    payType,
    workerType,
    isContractor,
    annualSalary,
    // Logo for Workday template
    logoDataUrl: formData.logoDataUrl || null,
    // Absence plans for Template C (Workday)
    absencePlansData,
    // Employer benefits for Template C (Workday)
    employerBenefitsData,
    totalEmployerBenefits,
    // Per-period check number and memo for OnPay template
    periodCheckNumber,
    periodMemo
  };

  // Call the appropriate template
  if (template === 'template-b') {
    generateTemplateB(doc, templateData, pageWidth, pageHeight, margin);
  } else if (template === 'template-c') {
    await generateTemplateC(doc, templateData, pageWidth, pageHeight, margin);
  } else if (template === 'template-h') {
    generateTemplateH(doc, templateData, pageWidth, pageHeight, margin);
  } else {
    await generateTemplateA(doc, templateData, pageWidth, pageHeight, margin);
  }

  return { payDate, startDate, endDate };
}

import { jsPDF } from "jspdf";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { generateTemplateA, generateTemplateB, generateTemplateC, generateTemplateH } from "./paystubTemplates";
import { getLocalTaxRate, getSUTARate } from "./taxRates";
import { calculateFederalTax, calculateStateTax, getStateTaxRate } from "./federalTaxCalculator";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

// Helper to clean PDF via backend to remove edit traces
async function cleanPdfViaBackend(pdfBlob, template, payDate) {
  try {
    console.log('Cleaning PDF via backend...', { template, payDate });
    const formData = new FormData();
    formData.append('file', pdfBlob, 'paystub.pdf');
    formData.append('template', template);
    
    // Pass pay date so creation date can be set to 2 days before
    if (payDate) {
      // Format date as ISO string
      const dateStr = payDate instanceof Date 
        ? payDate.toISOString().split('T')[0]
        : payDate;
      formData.append('pay_date', dateStr);
      console.log('Pay date for cleaning:', dateStr);
    }
    
    const response = await fetch(`${BACKEND_URL}/api/clean-paystub-pdf`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.warn('PDF cleaning failed:', response.status, errorText);
      return pdfBlob;
    }
    
    const result = await response.json();
    console.log('PDF cleaning result:', result);
    
    if (result.success && result.cleanedPdfBase64) {
      // Convert base64 to blob
      const byteCharacters = atob(result.cleanedPdfBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      console.log('PDF cleaned successfully, new size:', byteArray.length);
      return new Blob([byteArray], { type: 'application/pdf' });
    }
    
    console.warn('PDF cleaning returned no data');
    return pdfBlob;
  } catch (error) {
    console.error('PDF cleaning error:', error);
    return pdfBlob;
  }
}

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
  // Handle timezone issues by parsing the date string directly if it's in YYYY-MM-DD format
  let year, month, day;
  
  if (typeof payDate === 'string' && payDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
    // Parse YYYY-MM-DD format directly to avoid timezone conversion
    const parts = payDate.split('-');
    year = parts[0];
    month = parts[1];
    day = parts[2];
  } else {
    // For Date objects, use local date methods
    const date = payDate instanceof Date ? payDate : new Date(payDate);
    // Use UTC methods to avoid timezone shifting
    year = date.getUTCFullYear();
    month = String(date.getUTCMonth() + 1).padStart(2, '0');
    day = String(date.getUTCDate()).padStart(2, '0');
  }
  
  const yearShort = String(year).slice(-2);
  
  switch (template) {
    case 'template-a': // Gusto: firstName-lastName-paystub-2025-03-21.pdf
      return `${formatNameForFilename(name)}-paystub-${year}-${month}-${day}.pdf`;
    
    case 'template-c': // Workday: Payslip-03_21_2025.pdf
      return `Payslip-${month}_${day}_${year}.pdf`;
    
    case 'template-b': // ADP: Name-Earning Statement_04-21-23.pdf
      return `${formatNameForFilename(name)}-Earning Statement_${month}-${day}-${yearShort}.pdf`;
    
    case 'template-h': // OnPay: Name-Pay Stub-2025-03-21.pdf
      return `${formatNameForFilename(name)}-Pay Stub-${year}-${month}-${day}.pdf`;
    
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

// PDF metadata configuration per template (matching real document signatures)
const TEMPLATE_METADATA = {
  'template-a': {  // Gusto template
    title: 'Gusto',
    creator: 'wkhtmltopdf 0.12.6.1',
    producer: 'Qt 4.8.7',
  },
  'template-b': {  // ADP template
    title: 'ADP',
    creator: 'wkhtmltopdf 0.12.6.1',
    producer: 'Qt 4.8.7',
  },
  'template-c': {  // Workday template - no title
    creator: 'Workday HCM',
    producer: 'Workday PDF Engine',
  },
  'template-h': {  // OnPay template - no title (same metadata as Gusto)
    creator: 'wkhtmltopdf 0.12.6.1',
    producer: 'Qt 4.8.7',
  },
};

// Apply template-specific PDF metadata - must be called right before output/save
function applyPdfMetadata(doc, template) {
  const metadata = TEMPLATE_METADATA[template] || TEMPLATE_METADATA['template-a'];
  // Set properties including creator to override jsPDF default
  const props = {
    creator: metadata.creator,
    producer: metadata.producer,
  };
  // Only set title if it exists in metadata
  if (metadata.title) {
    props.title = metadata.title;
  }
  doc.setProperties(props);
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
    
    // Parse commission array
    const commissionArray = (formData.commissionList || "")
      .split(",")
      .map((c) => parseFloat(c.trim()) || 0)
      .slice(0, calculatedNumStubs);
    
    // Parse tips array
    const tipsArray = (formData.tipsList || "")
      .split(",")
      .map((t) => parseFloat(t.trim()) || 0)
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

    // Parse dates carefully to avoid timezone issues
    // When parsing YYYY-MM-DD, add T12:00:00 to ensure it stays on the correct day
    const parseLocalDate = (dateStr) => {
      if (!dateStr) return new Date();
      if (dateStr instanceof Date) return dateStr;
      const d = new Date(dateStr + 'T12:00:00');
      return isNaN(d.getTime()) ? new Date() : d;
    };

    const hireDate = parseLocalDate(formData.hireDate);
    let startDate = formData.startDate ? parseLocalDate(formData.startDate) : new Date(hireDate);

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
          startDateArray, endDateArray, payDateArray, commissionArray, tipsArray
        );
        
        // Template-specific filename with pay date
        const fileName = getIndividualPaystubFilename(template, formData.name, stubData.payDate);
        console.log(`Adding ${fileName} to ZIP`);
        
        // Apply template-specific metadata right before output
        applyPdfMetadata(doc, template);
        
        // Get PDF blob and clean it via backend (pass payDate for creation date calculation)
        let pdfBlob = doc.output('blob');
        pdfBlob = await cleanPdfViaBackend(pdfBlob, template, stubData.payDate);
        
        // Add cleaned PDF to zip
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
        startDateArray, endDateArray, payDateArray, commissionArray
      );
      
      // Template-specific filename with pay date
      const pdfFileName = getIndividualPaystubFilename(template, formData.name, stubData.payDate);
      
      // Apply template-specific metadata right before output
      applyPdfMetadata(doc, template);
      
      // Get PDF blob and clean it via backend (pass payDate for creation date calculation)
      let pdfBlob = doc.output('blob');
      pdfBlob = await cleanPdfViaBackend(pdfBlob, template, stubData.payDate);
      
      // Store download info for payment success page (use localStorage for persistence)
      const blobUrl = URL.createObjectURL(pdfBlob);
      localStorage.setItem('lastDownloadUrl', blobUrl);
      localStorage.setItem('lastDownloadFileName', pdfFileName);
      
      // Save the cleaned PDF
      saveAs(pdfBlob, pdfFileName);
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
  startDateArray = [], endDateArray = [], payDateArray = [],
  commissionArray = []
) {
  const payType = formData.payType || "hourly";
  const workerType = formData.workerType || "employee";
  const isContractor = workerType === "contractor";
  const annualSalary = parseFloat(formData.annualSalary) || 0;
  const periodsPerYear = payFrequency === "weekly" ? 52 : 26;
  
  // Get per-period check number and memo for OnPay template
  const periodCheckNumber = checkNumberArray[stubNum] || "";
  const periodMemo = memoArray[stubNum] || "";
  
  // Helper to parse dates without timezone issues
  const parseLocalDate = (dateStr) => {
    if (!dateStr) return null;
    if (dateStr instanceof Date) return dateStr;
    const d = new Date(dateStr + 'T12:00:00');
    return isNaN(d.getTime()) ? null : d;
  };
  
  // Use user-provided dates if available, otherwise use calculated dates
  const actualStartDate = startDateArray[stubNum] ? parseLocalDate(startDateArray[stubNum]) || new Date(startDate) : new Date(startDate);
  const actualEndDate = endDateArray[stubNum] ? parseLocalDate(endDateArray[stubNum]) || (() => {
    const end = new Date(actualStartDate);
    end.setDate(actualStartDate.getDate() + periodLength - 1);
    return end;
  })() : (() => {
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
  let commission = commissionArray[stubNum] || 0;
  
  if (payType === "salary") {
    // Salary calculation - fixed amount per period plus commission
    grossPay = (annualSalary / periodsPerYear) + commission;
    regularPay = annualSalary / periodsPerYear;
    hours = defaultHours; // Standard hours for display purposes
    overtime = 0;
    overtimePay = 0;
  } else {
    // Hourly calculation
    hours = hoursArray[stubNum] || defaultHours;
    overtime = overtimeArray[stubNum] || 0;
    regularPay = rate * hours;
    overtimePay = rate * 1.5 * overtime;
    grossPay = regularPay + overtimePay + commission;
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
  const preTaxDeductionTypes = ['health_insurance', 'dental_insurance', 'vision_insurance'];
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
    ? (parseLocalDate(payDateArray[stubNum]) || nextWeekday(new Date(endDate), payDay))
    : nextWeekday(new Date(endDate), payDay);

  // Calculate YTD values based on pay periods from hire date
  const hireDate = formData.hireDate ? (parseLocalDate(formData.hireDate) || new Date(actualStartDate)) : new Date(actualStartDate);
  const ytdPayPeriods = calculatePayPeriodsFromHireDate(hireDate, endDate, periodLength);
  
  // Calculate YTD values
  const ytdRegularPay = regularPay * ytdPayPeriods;
  const ytdOvertimePay = overtimePay * ytdPayPeriods;
  
  // YTD Commission should be cumulative sum of all commissions up to and including current stub
  const ytdCommission = commissionArray.slice(0, stubNum + 1).reduce((sum, c) => sum + (c || 0), 0);
  
  // YTD Gross Pay = (base pay * periods) + cumulative commission
  // Base pay is regularPay + overtimePay (without commission)
  const basePay = regularPay + overtimePay;
  const ytdGrossPay = (basePay * ytdPayPeriods) + ytdCommission;
  
  // YTD Taxes should be calculated on YTD Gross Pay for accuracy
  // SS and Medicare are flat percentages, so calculate directly on ytdGrossPay
  const ytdSsTax = isContractor ? 0 : Math.round(ytdGrossPay * 0.062 * 100) / 100;
  const ytdMedTax = isContractor ? 0 : Math.round(ytdGrossPay * 0.0145 * 100) / 100;
  
  // For federal and state taxes, we approximate by using the average gross pay per period
  // This accounts for varying commissions across periods
  const avgGrossPayPerPeriod = ytdGrossPay / ytdPayPeriods;
  let ytdFederalTax = 0;
  if (!isContractor) {
    if (formData.federalFilingStatus) {
      const avgFederalTax = calculateFederalTax(avgGrossPayPerPeriod, payFrequency, formData.federalFilingStatus);
      ytdFederalTax = Math.round(avgFederalTax * ytdPayPeriods * 100) / 100;
    } else {
      ytdFederalTax = Math.round(ytdGrossPay * 0.22 * 100) / 100;
    }
  }
  
  let ytdStateTax = 0;
  if (!isContractor) {
    const avgStateTax = calculateStateTax(avgGrossPayPerPeriod, formData.state, payFrequency, formData.stateAllowances || 0, stateRate);
    ytdStateTax = Math.round(avgStateTax * ytdPayPeriods * 100) / 100;
  }
  
  const ytdLocalTax = isContractor ? 0 : (formData.includeLocalTax && localTaxRate > 0 ? Math.round(ytdGrossPay * localTaxRate * 100) / 100 : 0);
  const ytdTotalTax = Math.round((ytdSsTax + ytdMedTax + ytdFederalTax + ytdStateTax + ytdLocalTax) * 100) / 100;
  
  const ytdDeductions = Math.round(totalDeductions * ytdPayPeriods * 100) / 100;
  const ytdContributions = Math.round(totalContributions * ytdPayPeriods * 100) / 100;
  
  // Calculate YTD Pre-Tax and Post-Tax amounts
  const ytdPreTax = Math.round(totalPreTax * ytdPayPeriods * 100) / 100;
  const ytdPostTax = Math.round(totalPostTax * ytdPayPeriods * 100) / 100;
  
  const ytdNetPay = Math.round((ytdGrossPay - ytdTotalTax - ytdDeductions - ytdContributions) * 100) / 100;
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
    commission,
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
    startDate: actualStartDate,
    endDate: endDate,
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
    ytdPreTax,
    ytdPostTax,
    // YTD values
    ytdPayPeriods,
    ytdRegularPay,
    ytdOvertimePay,
    ytdCommission,
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

  return { payDate, startDate: actualStartDate, endDate };
}

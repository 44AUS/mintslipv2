import { jsPDF } from "jspdf";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { generateCanadianTemplateA, generateCanadianTemplateB, generateCanadianTemplateC, generateCanadianTemplateH } from "./canadianPaystubTemplates";
import { calculateCanadianTaxes } from "./canadianTaxRates";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

// Helper to clean PDF via backend to remove edit traces
async function cleanPdfViaBackend(pdfBlob, template, payDate) {
  try {
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
    }
    
    const response = await fetch(`${BACKEND_URL}/api/clean-paystub-pdf`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      console.warn('PDF cleaning failed, using original PDF');
      return pdfBlob;
    }
    
    const result = await response.json();
    if (result.success && result.cleanedPdfBase64) {
      // Convert base64 to blob
      const byteCharacters = atob(result.cleanedPdfBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      return new Blob([byteArray], { type: 'application/pdf' });
    }
    
    return pdfBlob;
  } catch (error) {
    console.warn('PDF cleaning error, using original PDF:', error);
    return pdfBlob;
  }
}

// PDF metadata configuration per template (matching real document signatures)
const TEMPLATE_METADATA = {
  'template-a': { title: 'Gusto', creator: 'wkhtmltopdf 0.12.6.1', producer: 'Qt 4.8.7' },
  'template-b': { title: 'ADP', creator: 'wkhtmltopdf 0.12.6.1', producer: 'Qt 4.8.7' },
  'template-c': { title: 'Paychex', creator: 'wkhtmltopdf 0.12.6.1', producer: 'Qt 4.8.7' },
  'template-h': { title: 'Pay Statement', creator: 'wkhtmltopdf 0.12.6.1', producer: 'Qt 4.8.7' },
};

// Apply template-specific PDF metadata
function applyPdfMetadata(doc, template) {
  const metadata = TEMPLATE_METADATA[template] || TEMPLATE_METADATA['template-a'];
  doc.setProperties({ title: metadata.title, creator: metadata.creator, producer: metadata.producer });
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

// Helper to get provincial tax rate for YTD calculations
function getProvincialTaxRate(province) {
  const rates = {
    'ON': 0.0505,  // Ontario
    'QC': 0.14,    // Quebec
    'BC': 0.0506,  // British Columbia
    'AB': 0.10,    // Alberta
    'SK': 0.105,   // Saskatchewan
    'MB': 0.108,   // Manitoba
    'NB': 0.094,   // New Brunswick
    'NS': 0.0879,  // Nova Scotia
    'PE': 0.098,   // Prince Edward Island
    'NL': 0.087,   // Newfoundland and Labrador
    'YT': 0.064,   // Yukon
    'NT': 0.059,   // Northwest Territories
    'NU': 0.04,    // Nunavut
  };
  return rates[province] || 0.05;
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

export const generateAndDownloadCanadianPaystub = async (formData, template = 'template-a', numStubs, returnBlob = false) => {
  try {
    console.log("Starting Canadian PDF generation...", { formData, template, numStubs });
    
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
    const province = formData.province || "ON";

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

    const hireDate = formData.hireDate ? new Date(formData.hireDate) : new Date();
    let startDate = formData.startDate ? new Date(formData.startDate) : new Date(hireDate);

    console.log("Calculated values:", { calculatedNumStubs, rate, payFrequency, payType, workerType, isContractor, province });

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
        
        const stubData = await generateSingleCanadianStub(
          doc, formData, template, stubNum, new Date(currentStartDate), periodLength, 
          hoursArray, overtimeArray, defaultHours, rate, province,
          payDay, pageWidth, pageHeight, calculatedNumStubs, payFrequency,
          checkNumberArray, memoArray, commissionArray
        );
        
        // Template-specific filename with pay date (same as US)
        const fileName = getIndividualPaystubFilename(template, formData.name, stubData.payDate);
        console.log(`Adding ${fileName} to ZIP`);
        
        // Apply metadata before output
        applyPdfMetadata(doc, template);
        
        // Get PDF blob and clean it via backend
        let pdfBlob = doc.output('blob');
        pdfBlob = await cleanPdfViaBackend(pdfBlob, template);
        
        // Add cleaned PDF to zip
        zip.file(fileName, pdfBlob);
        
        currentStartDate.setDate(currentStartDate.getDate() + periodLength);
      }
      
      // Generate and download ZIP with template-specific filename (same as US)
      console.log("Generating ZIP file...");
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const zipFileName = getMultiplePaystubsZipFilename(template, formData.name);
      
      // Store download info for payment success page
      const blobUrl = URL.createObjectURL(zipBlob);
      sessionStorage.setItem('lastDownloadUrl', blobUrl);
      sessionStorage.setItem('lastDownloadFileName', zipFileName);
      
      saveAs(zipBlob, zipFileName);
      console.log("ZIP downloaded successfully");
      
      if (returnBlob) {
        return zipBlob;
      }
      
    } else {
      // Single stub - download directly as PDF
      console.log("Generating single PDF...");
      const doc = new jsPDF({ unit: "pt", format: "letter" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      
      const stubData = await generateSingleCanadianStub(
        doc, formData, template, 0, startDate, periodLength,
        hoursArray, overtimeArray, defaultHours, rate, province,
        payDay, pageWidth, pageHeight, 1, payFrequency,
        checkNumberArray, memoArray, commissionArray
      );
      
      // Template-specific filename with pay date (same as US)
      const pdfFileName = getIndividualPaystubFilename(template, formData.name, stubData.payDate);
      
      // Apply metadata before output
      applyPdfMetadata(doc, template);
      
      // Get PDF blob and clean it via backend
      let pdfBlob = doc.output('blob');
      pdfBlob = await cleanPdfViaBackend(pdfBlob, template);
      
      // Store download info for payment success page
      const blobUrl = URL.createObjectURL(pdfBlob);
      sessionStorage.setItem('lastDownloadUrl', blobUrl);
      sessionStorage.setItem('lastDownloadFileName', pdfFileName);
      
      // Save the cleaned PDF
      saveAs(pdfBlob, pdfFileName);
      console.log("PDF downloaded successfully");
      
      if (returnBlob) {
        return pdfBlob;
      }
    }
  } catch (error) {
    console.error("Error generating Canadian paystub:", error);
    throw error;
  }
};

// Helper function to calculate number of pay periods from hire date to current pay period end
function calculatePayPeriodsFromHireDate(hireDate, currentPeriodEnd, periodLength) {
  const payPeriodYear = currentPeriodEnd.getFullYear();
  const startOfYear = new Date(payPeriodYear, 0, 1);
  const ytdStartDate = hireDate > startOfYear ? hireDate : startOfYear;
  const diffTime = currentPeriodEnd.getTime() - ytdStartDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const numPeriods = Math.max(1, Math.ceil(diffDays / periodLength));
  return numPeriods;
}

// Helper function to generate a single Canadian paystub
async function generateSingleCanadianStub(
  doc, formData, template, stubNum, startDate, periodLength,
  hoursArray, overtimeArray, defaultHours, rate, province,
  payDay, pageWidth, pageHeight, totalStubs, payFrequency,
  checkNumberArray = [], memoArray = [], commissionArray = []
) {
  const payType = formData.payType || "hourly";
  const workerType = formData.workerType || "employee";
  const isContractor = workerType === "contractor";
  const isQuebec = province === "QC";
  const annualSalary = parseFloat(formData.annualSalary) || 0;
  const periodsPerYear = payFrequency === "weekly" ? 52 : 26;
  const margin = 40;
  
  // Get per-period check number and memo for OnPay template
  const periodCheckNumber = checkNumberArray[stubNum] || "";
  const periodMemo = memoArray[stubNum] || "";
  
  // Calculate period dates
  const periodStart = new Date(startDate);
  const periodEnd = new Date(startDate);
  periodEnd.setDate(periodEnd.getDate() + periodLength - 1);
  const payDate = nextWeekday(periodEnd, payDay);
  
  // Get hire date for YTD calculations
  const hireDate = formData.hireDate ? new Date(formData.hireDate) : periodStart;
  
  // Calculate number of pay periods from hire/year start to current period for accurate YTD
  const ytdPayPeriods = calculatePayPeriodsFromHireDate(hireDate, periodEnd, periodLength);
  
  // Get hours for this pay period
  const hours = hoursArray[stubNum] || defaultHours;
  const overtime = isContractor ? 0 : (overtimeArray[stubNum] || 0);
  const totalHours = hours + overtime;
  const commission = commissionArray[stubNum] || 0;
  
  // Calculate earnings
  let regularPay, overtimePay, grossPay;
  if (payType === "salary") {
    regularPay = annualSalary / periodsPerYear;
    overtimePay = 0;
    grossPay = regularPay + commission;
  } else {
    regularPay = rate * hours;
    overtimePay = rate * 1.5 * overtime;
    grossPay = regularPay + overtimePay + commission;
  }
  
  // Calculate Canadian taxes (only for employees)
  let cpp = 0, ei = 0, qpip = 0, federalTax = 0, provincialTax = 0, totalTax = 0;
  
  if (!isContractor) {
    // Get allowances and marital status from form data for tax calculation
    const federalAllowances = parseFloat(formData.federalAllowances) || 0;
    const provincialAllowances = parseFloat(formData.provincialAllowances) || 0;
    const maritalStatus = formData.maritalStatus || 'single';
    
    const taxes = calculateCanadianTaxes(grossPay, payFrequency, province, 0, federalAllowances, provincialAllowances, maritalStatus);
    cpp = taxes.cpp;
    ei = taxes.ei;
    qpip = taxes.qpip;
    federalTax = taxes.federalTax;
    provincialTax = taxes.provincialTax;
    totalTax = taxes.totalTax;
  }
  
  // Process deductions and contributions
  const deductions = formData.deductions || [];
  const contributions = formData.contributions || [];
  
  let totalDeductions = 0;
  const deductionsData = deductions.map(d => {
    const currentAmount = d.isPercentage ? (grossPay * parseFloat(d.amount) / 100) : parseFloat(d.amount) || 0;
    totalDeductions += currentAmount;
    return { ...d, currentAmount };
  });
  
  let totalContributions = 0;
  const contributionsData = contributions.map(c => {
    const currentAmount = c.isPercentage ? (grossPay * parseFloat(c.amount) / 100) : parseFloat(c.amount) || 0;
    totalContributions += currentAmount;
    return { ...c, currentAmount };
  });
  
  // Calculate net pay
  const netPay = grossPay - totalTax - totalDeductions;
  
  // Calculate YTD values based on pay periods from hire date
  const ytdRegularPay = regularPay * ytdPayPeriods;
  const ytdOvertimePay = overtimePay * ytdPayPeriods;
  
  // YTD Commission should be cumulative sum of all commissions up to and including current stub
  const ytdCommission = commissionArray.slice(0, stubNum + 1).reduce((sum, c) => sum + (c || 0), 0);
  
  // YTD Gross Pay = (base pay * periods) + cumulative commission
  const basePay = regularPay + overtimePay;
  const ytdGrossPay = (basePay * ytdPayPeriods) + ytdCommission;
  
  // YTD Taxes should be calculated on YTD Gross Pay for accuracy
  // CPP/QPP, EI, QPIP are flat percentages, so calculate directly on ytdGrossPay
  const ytdCpp = Math.round(ytdGrossPay * (isQuebec ? 0.064 : 0.0595) * 100) / 100;
  const ytdEi = Math.round(ytdGrossPay * (isQuebec ? 0.0127 : 0.0163) * 100) / 100;
  const ytdQpip = isQuebec ? Math.round(ytdGrossPay * 0.00494 * 100) / 100 : 0;
  
  // For federal and provincial taxes, use ytdGrossPay with approximate rates
  const ytdFederalTax = Math.round(ytdGrossPay * 0.15 * 100) / 100; // Federal base rate approximation
  const ytdProvincialTax = Math.round(ytdGrossPay * (getProvincialTaxRate(province) || 0.05) * 100) / 100;
  const ytdTotalTax = Math.round((ytdCpp + ytdEi + ytdQpip + ytdFederalTax + ytdProvincialTax) * 100) / 100;
  
  const ytdDeductions = Math.round(totalDeductions * ytdPayPeriods * 100) / 100;
  const ytdContributions = Math.round(totalContributions * ytdPayPeriods * 100) / 100;
  const ytdNetPay = Math.round((ytdGrossPay - ytdTotalTax - ytdDeductions + ytdContributions) * 100) / 100;
  const ytdHours = totalHours * ytdPayPeriods;
  
  // Process employer benefits for Template C
  const employerBenefits = formData.employerBenefits || [];
  let totalEmployerBenefits = 0;
  const employerBenefitsData = employerBenefits.map(b => {
    let amount;
    if (b.type === 'rrsp_match') {
      // Calculate RRSP match based on employee contribution
      const employeeRRSP = contributionsData.find(c => c.type === 'rrsp');
      if (employeeRRSP) {
        const matchUpTo = parseFloat(b.matchUpTo) || 6;
        const matchPercent = parseFloat(b.matchPercent) || 50;
        const maxMatchableAmount = grossPay * (matchUpTo / 100);
        const matchableAmount = Math.min(employeeRRSP.currentAmount, maxMatchableAmount);
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

  // Prepare template data
  const templateData = {
    formData,
    hours,
    overtime,
    commission,
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
    startDate: periodStart,
    endDate: periodEnd,
    payDate,
    payFrequency,
    stubNum: stubNum + 1,
    totalStubs,
    ytdRegularPay,
    ytdOvertimePay,
    ytdCommission,
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
    workerType,
    isContractor,
    annualSalary,
    deductionsData,
    totalDeductions,
    contributionsData,
    totalContributions,
    ytdDeductions,
    ytdContributions,
    ytdPayPeriods,
    logoDataUrl: formData.logoDataUrl || formData.companyLogo,
    isQuebec,
    cppLabel: isQuebec ? 'QPP' : 'CPP',
    // Absence plans for Template C (Workday)
    absencePlansData: (formData.absencePlans || []).map(plan => ({
      description: plan.description || "PTO Plan",
      accrued: plan.accrued || "0",
      reduced: plan.reduced || "0"
    })),
    // Employer benefits for Template C (Workday)
    employerBenefitsData,
    totalEmployerBenefits,
    // Per-period check number and memo for OnPay template
    periodCheckNumber,
    periodMemo
  };
  
  // Generate the selected template
  if (template === "template-b") {
    await generateCanadianTemplateB(doc, templateData, pageWidth, pageHeight, margin);
  } else if (template === "template-c") {
    await generateCanadianTemplateC(doc, templateData, pageWidth, pageHeight, margin);
  } else if (template === "template-h") {
    await generateCanadianTemplateH(doc, templateData, pageWidth, pageHeight, margin);
  } else {
    await generateCanadianTemplateA(doc, templateData, pageWidth, pageHeight, margin);
  }
  
  return { payDate };
}

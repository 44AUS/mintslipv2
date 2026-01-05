import { jsPDF } from "jspdf";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { generateCanadianTemplateA, generateCanadianTemplateB, generateCanadianTemplateC, generateCanadianTemplateH } from "./canadianPaystubTemplates";
import { calculateCanadianTaxes } from "./canadianTaxRates";

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

// Helper to set PDF metadata based on template
function setPdfMetadata(doc, template, payDate) {
  if (template === 'template-a') {
    // Gusto template - specific metadata
    // Creation date is one day before pay date
    let creationDate;
    if (payDate instanceof Date) {
      creationDate = new Date(payDate);
    } else if (typeof payDate === 'string' && payDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const parts = payDate.split('-');
      creationDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    } else {
      creationDate = new Date(payDate);
    }
    creationDate.setDate(creationDate.getDate() - 1);
    
    doc.setProperties({
      title: 'Gusto',
      subject: '',
      author: '',
      keywords: '',
      creator: 'wkhtmltopdf 0.12.6.1',
    });
    
    // Set the creation date in PDF info
    doc.setCreationDate(creationDate);
    
    // Override the producer by modifying internal PDF info
    if (doc.internal && doc.internal.events) {
      doc.internal.events.subscribe('putInfo', function() {
        this.internal.write('/Producer (Qt 4.8.7)');
      }.bind(doc));
    }
  }
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
          checkNumberArray, memoArray
        );
        
        // Set PDF metadata based on template
        setPdfMetadata(doc, template, stubData.payDate);
        
        // Simple filename with date
        const fileName = `${formData.name}-canadian-paystub-${stubData.payDate.toISOString().split('T')[0]}.pdf`;
        console.log(`Adding ${fileName} to ZIP`);
        
        // Add PDF directly to zip root
        const pdfBlob = doc.output('blob');
        zip.file(fileName, pdfBlob);
        
        currentStartDate.setDate(currentStartDate.getDate() + periodLength);
      }
      
      // Generate and download ZIP
      console.log("Generating ZIP file...");
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const zipFileName = `Canadian_Paystubs_${formData.name || "Employee"}.zip`;
      
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
      
      await generateSingleCanadianStub(
        doc, formData, template, 0, startDate, periodLength,
        hoursArray, overtimeArray, defaultHours, rate, province,
        payDay, pageWidth, pageHeight, 1, payFrequency,
        checkNumberArray, memoArray
      );
      
      // Set PDF metadata based on template
      // For single stub, calculate pay date from startDate
      const payDate = nextWeekday(new Date(startDate.getTime() + (periodLength - 1) * 24 * 60 * 60 * 1000), formData.payDay || "Friday");
      setPdfMetadata(doc, template, payDate);
      
      const pdfFileName = `Canadian-PayStub-${formData.name || "document"}.pdf`;
      
      // Store download info for payment success page
      const pdfBlob = doc.output('blob');
      const blobUrl = URL.createObjectURL(pdfBlob);
      sessionStorage.setItem('lastDownloadUrl', blobUrl);
      sessionStorage.setItem('lastDownloadFileName', pdfFileName);
      
      doc.save(pdfFileName);
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
  checkNumberArray = [], memoArray = []
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
  const ytdGrossPay = grossPay * ytdPayPeriods;
  const ytdRegularPay = regularPay * ytdPayPeriods;
  const ytdOvertimePay = overtimePay * ytdPayPeriods;
  const ytdCpp = cpp * ytdPayPeriods;
  const ytdEi = ei * ytdPayPeriods;
  const ytdQpip = qpip * ytdPayPeriods;
  const ytdFederalTax = federalTax * ytdPayPeriods;
  const ytdProvincialTax = provincialTax * ytdPayPeriods;
  const ytdTotalTax = totalTax * ytdPayPeriods;
  const ytdNetPay = netPay * ytdPayPeriods;
  const ytdDeductions = totalDeductions * ytdPayPeriods;
  const ytdContributions = totalContributions * ytdPayPeriods;
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

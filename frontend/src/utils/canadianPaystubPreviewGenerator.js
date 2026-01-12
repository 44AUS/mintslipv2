import { jsPDF } from "jspdf";
import { generateCanadianTemplateA, generateCanadianTemplateB, generateCanadianTemplateC, generateCanadianTemplateH } from "./canadianPaystubTemplates";
import { calculateCanadianTaxes } from "./canadianTaxRates";
import * as pdfjsLib from 'pdfjs-dist';

// Set up pdf.js worker using unpkg CDN with correct version
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

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
    const commission = formData.commissionList 
      ? parseFloat(formData.commissionList.split(",")[0]) || 0 
      : 0;

    // Parse custom dates for each period
    const startDateArray = (formData.startDateList || "")
      .split(",")
      .map((d) => d.trim())
      .filter(d => d);
    const endDateArray = (formData.endDateList || "")
      .split(",")
      .map((d) => d.trim())
      .filter(d => d);
    const payDateArray = (formData.payDateList || "")
      .split(",")
      .map((d) => d.trim())
      .filter(d => d);

    // Calculate period dates - use custom dates if available
    const startDate = startDateArray[0] 
      ? new Date(startDateArray[0]) 
      : (formData.startDate ? new Date(formData.startDate) : new Date());
    const endDate = endDateArray[0] 
      ? new Date(endDateArray[0])
      : (formData.endDate ? new Date(formData.endDate) : new Date(startDate.getTime() + (periodLength - 1) * 24 * 60 * 60 * 1000));
    // Use custom pay date if available, otherwise calculate from end date
    const payDate = payDateArray[0] 
      ? new Date(payDateArray[0])
      : nextWeekday(endDate, payDay);
    const hireDate = formData.hireDate ? new Date(formData.hireDate) : startDate;

    // Calculate YTD pay periods
    const ytdPayPeriods = calculatePayPeriodsFromHireDate(hireDate, endDate, periodLength);

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

    // Calculate Canadian taxes
    let cpp = 0, ei = 0, qpip = 0, federalTax = 0, provincialTax = 0, totalTax = 0;
    
    if (!isContractor && province) {
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

    // Process deductions
    const deductions = formData.deductions || [];
    let totalDeductions = 0;
    const deductionsData = deductions.map(d => {
      const currentAmount = d.isPercentage ? (grossPay * parseFloat(d.amount) / 100) : parseFloat(d.amount) || 0;
      totalDeductions += currentAmount;
      return { ...d, currentAmount, ytdAmount: currentAmount * ytdPayPeriods };
    });

    // Process contributions
    const contributions = formData.contributions || [];
    let totalContributions = 0;
    const contributionsData = contributions.map(c => {
      const currentAmount = c.isPercentage ? (grossPay * parseFloat(c.amount) / 100) : parseFloat(c.amount) || 0;
      totalContributions += currentAmount;
      return { ...c, currentAmount, ytdAmount: currentAmount * ytdPayPeriods };
    });

    const netPay = grossPay - totalTax - totalDeductions;
    const totalHours = hours + overtime;

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
      startDate,
      endDate,
      payDate,
      payFrequency,
      stubNum: 1,
      totalStubs: 1,
      ytdRegularPay: regularPay * ytdPayPeriods,
      ytdOvertimePay: overtimePay * ytdPayPeriods,
      ytdCommission: commission * ytdPayPeriods,
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
      // Absence plans for Template C (Workday)
      absencePlansData: (formData.absencePlans || []).map(plan => ({
        description: plan.description || "PTO Plan",
        accrued: plan.accrued || "0",
        reduced: plan.reduced || "0"
      })),
      // Employer benefits for Template C (Workday)
      employerBenefitsData: (formData.employerBenefits || []).map(b => {
        let amount;
        if (b.type === 'rrsp_match') {
          // Calculate RRSP match based on employee contribution
          const employeeRRSP = contributionsData.find(c => c.type === 'rrsp');
          if (employeeRRSP) {
            const matchUpTo = parseFloat(b.matchUpTo) || 6;
            const matchPercent = parseFloat(b.matchPercent) || 50;
            const maxMatchableAmount = grossPay * (matchUpTo / 100);
            const matchableAmount = Math.min(employeeRRSP.amount, maxMatchableAmount);
            amount = matchableAmount * (matchPercent / 100);
          } else {
            amount = 0;
          }
        } else {
          amount = b.isPercentage ? (grossPay * parseFloat(b.amount) / 100) : parseFloat(b.amount) || 0;
        }
        return { name: b.name || "Employer Benefit", type: b.type, currentAmount: amount };
      }),
      totalEmployerBenefits: (formData.employerBenefits || []).reduce((sum, b) => {
        let amount;
        if (b.type === 'rrsp_match') {
          const employeeRRSP = contributionsData.find(c => c.type === 'rrsp');
          if (employeeRRSP) {
            const matchUpTo = parseFloat(b.matchUpTo) || 6;
            const matchPercent = parseFloat(b.matchPercent) || 50;
            const maxMatchableAmount = grossPay * (matchUpTo / 100);
            const matchableAmount = Math.min(employeeRRSP.amount, maxMatchableAmount);
            amount = matchableAmount * (matchPercent / 100);
          } else {
            amount = 0;
          }
        } else {
          amount = b.isPercentage ? (grossPay * parseFloat(b.amount) / 100) : parseFloat(b.amount) || 0;
        }
        return sum + amount;
      }, 0)
    };

    // Generate selected template
    if (template === "template-b") {
      await generateCanadianTemplateB(doc, templateData, pageWidth, pageHeight, margin);
    } else if (template === "template-c") {
      await generateCanadianTemplateC(doc, templateData, pageWidth, pageHeight, margin);
    } else if (template === "template-h") {
      await generateCanadianTemplateH(doc, templateData, pageWidth, pageHeight, margin);
    } else {
      await generateCanadianTemplateA(doc, templateData, pageWidth, pageHeight, margin);
    }

    // Add watermark
    addWatermarkToAllPages(doc, pageWidth, pageHeight);

    // Apply metadata before output
    applyPdfMetadata(doc, template);

    // Convert to image for preview
    const pdfDataUrl = doc.output('dataurlstring');
    const imageDataUrl = await convertPdfToImage(pdfDataUrl);
    
    return imageDataUrl;
  } catch (error) {
    console.error("Error generating Canadian preview:", error);
    throw error;
  }
}

// Helper function to generate a single Canadian stub preview
async function generateSingleCanadianStubPreview(formData, template, stubIndex, totalStubs, commonData) {
  const {
    rate, annualSalary, payFrequency, periodLength, defaultHours, payDay,
    payType, workerType, isContractor, province, isQuebec, periodsPerYear, 
    hoursArray, overtimeArray, commissionArray, startDateArray, endDateArray, payDateArray, hireDate
  } = commonData;

  const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "letter" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;

  // Calculate start date for this stub
  let startDate;
  if (startDateArray[stubIndex]) {
    startDate = new Date(startDateArray[stubIndex]);
  } else if (formData.startDate) {
    startDate = new Date(formData.startDate);
    startDate.setDate(startDate.getDate() + (stubIndex * periodLength));
  } else {
    startDate = new Date(hireDate);
    startDate.setDate(startDate.getDate() + (stubIndex * periodLength));
  }

  // Get hours for this stub
  const hours = hoursArray[stubIndex] !== undefined ? hoursArray[stubIndex] : defaultHours;
  const overtime = isContractor ? 0 : (overtimeArray[stubIndex] || 0);
  const commission = commissionArray[stubIndex] || 0;

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

  // Calculate end date
  const endDate = endDateArray[stubIndex] 
    ? new Date(endDateArray[stubIndex])
    : (() => {
        const calculated = new Date(startDate);
        calculated.setDate(startDate.getDate() + periodLength - 1);
        return calculated;
      })();

  // Calculate pay date
  const payDate = payDateArray[stubIndex] 
    ? new Date(payDateArray[stubIndex])
    : nextWeekday(new Date(endDate), payDay);

  // Calculate YTD
  const ytdPayPeriods = calculatePayPeriodsFromHireDate(hireDate, endDate, periodLength);

  // Calculate Canadian taxes
  let cpp = 0, ei = 0, qpip = 0, federalTax = 0, provincialTax = 0, totalTax = 0;
  
  if (!isContractor && province) {
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

  // Process deductions
  const deductions = formData.deductions || [];
  let totalDeductions = 0;
  const deductionsData = deductions.map(d => {
    const currentAmount = d.isPercentage ? (grossPay * parseFloat(d.amount) / 100) : parseFloat(d.amount) || 0;
    totalDeductions += currentAmount;
    return { ...d, currentAmount, ytdAmount: currentAmount * ytdPayPeriods };
  });

  // Process contributions
  const contributions = formData.contributions || [];
  let totalContributions = 0;
  const contributionsData = contributions.map(c => {
    const currentAmount = c.isPercentage ? (grossPay * parseFloat(c.amount) / 100) : parseFloat(c.amount) || 0;
    totalContributions += currentAmount;
    return { ...c, currentAmount, ytdAmount: currentAmount * ytdPayPeriods };
  });

  const netPay = grossPay - totalTax - totalDeductions;
  const totalHours = hours + overtime;

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
    startDate,
    endDate,
    payDate,
    payFrequency,
    stubNum: stubIndex + 1,
    totalStubs,
    ytdRegularPay: regularPay * ytdPayPeriods,
    ytdOvertimePay: overtimePay * ytdPayPeriods,
    ytdCommission: commission * ytdPayPeriods,
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
    absencePlansData: (formData.absencePlans || []).map(plan => ({
      description: plan.description || "PTO Plan",
      accrued: plan.accrued || "0",
      reduced: plan.reduced || "0"
    })),
    employerBenefitsData: (formData.employerBenefits || []).map(b => {
      let amount;
      if (b.type === 'rrsp_match') {
        const employeeRRSP = contributionsData.find(c => c.type === 'rrsp');
        if (employeeRRSP) {
          const matchUpTo = parseFloat(b.matchUpTo) || 6;
          const matchPercent = parseFloat(b.matchPercent) || 50;
          const maxMatchableAmount = grossPay * (matchUpTo / 100);
          const matchableAmount = Math.min(employeeRRSP.amount, maxMatchableAmount);
          amount = matchableAmount * (matchPercent / 100);
        } else {
          amount = 0;
        }
      } else {
        amount = b.isPercentage ? (grossPay * parseFloat(b.amount) / 100) : parseFloat(b.amount) || 0;
      }
      return { name: b.name || "Employer Benefit", type: b.type, currentAmount: amount };
    }),
    totalEmployerBenefits: (formData.employerBenefits || []).reduce((sum, b) => {
      let amount;
      if (b.type === 'rrsp_match') {
        const employeeRRSP = contributionsData.find(c => c.type === 'rrsp');
        if (employeeRRSP) {
          const matchUpTo = parseFloat(b.matchUpTo) || 6;
          const matchPercent = parseFloat(b.matchPercent) || 50;
          const maxMatchableAmount = grossPay * (matchUpTo / 100);
          const matchableAmount = Math.min(employeeRRSP.amount, maxMatchableAmount);
          amount = matchableAmount * (matchPercent / 100);
        } else {
          amount = 0;
        }
      } else {
        amount = b.isPercentage ? (grossPay * parseFloat(b.amount) / 100) : parseFloat(b.amount) || 0;
      }
      return sum + amount;
    }, 0)
  };

  // Generate selected template
  if (template === "template-b") {
    await generateCanadianTemplateB(doc, templateData, pageWidth, pageHeight, margin);
  } else if (template === "template-c") {
    await generateCanadianTemplateC(doc, templateData, pageWidth, pageHeight, margin);
  } else if (template === "template-h") {
    await generateCanadianTemplateH(doc, templateData, pageWidth, pageHeight, margin);
  } else {
    await generateCanadianTemplateA(doc, templateData, pageWidth, pageHeight, margin);
  }

  // Add watermark
  addWatermarkToAllPages(doc, pageWidth, pageHeight);

  // Apply metadata before output
  applyPdfMetadata(doc, template);

  // Convert to image
  const pdfDataUrl = doc.output('dataurlstring');
  const imageDataUrl = await convertPdfToImage(pdfDataUrl);
  
  return imageDataUrl;
}

// Generate all Canadian preview PDFs as an array of base64 image URLs
export async function generateAllCanadianPreviewPDFs(formData, template = 'template-a', numStubs = 1) {
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
    const province = formData.province || "ON";
    const isQuebec = province === "QC";
    const periodsPerYear = payFrequency === "weekly" ? 52 : 26;

    const hoursArray = (formData.hoursList || "").split(",").map((h) => parseFloat(h.trim()) || 0);
    const overtimeArray = (formData.overtimeList || "").split(",").map((h) => parseFloat(h.trim()) || 0);
    const commissionArray = (formData.commissionList || "").split(",").map((c) => parseFloat(c.trim()) || 0);
    const startDateArray = (formData.startDateList || "").split(",").map((d) => d.trim()).filter(d => d);
    const endDateArray = (formData.endDateList || "").split(",").map((d) => d.trim()).filter(d => d);
    const payDateArray = (formData.payDateList || "").split(",").map((d) => d.trim()).filter(d => d);

    const hireDate = formData.hireDate ? new Date(formData.hireDate) : new Date();

    const commonData = {
      rate, annualSalary, payFrequency, periodLength, defaultHours, payDay,
      payType, workerType, isContractor, province, isQuebec, periodsPerYear,
      hoursArray, overtimeArray, commissionArray, startDateArray, endDateArray, payDateArray, hireDate
    };

    // Generate previews for all stubs
    const previews = [];
    const actualNumStubs = Math.max(1, numStubs);
    
    for (let i = 0; i < actualNumStubs; i++) {
      const preview = await generateSingleCanadianStubPreview(formData, template, i, actualNumStubs, commonData);
      previews.push(preview);
    }

    return previews;
  } catch (error) {
    console.error("Error generating all Canadian previews:", error);
    return [null];
  }
}

import { jsPDF } from "jspdf";
import { generateTemplateA, generateTemplateB, generateTemplateC, generateTemplateH } from "./paystubTemplates";
import { calculateFederalTax, calculateStateTax, getStateTaxRate } from "./federalTaxCalculator";
import { getLocalTaxRate } from "./taxRates";
import * as pdfjsLib from 'pdfjs-dist';

// Set up pdf.js worker using unpkg CDN with correct version
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

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
  const props = {
    creator: metadata.creator,
    producer: metadata.producer,
  };
  if (metadata.title) {
    props.title = metadata.title;
  }
  doc.setProperties(props);
}

// Convert PDF to image using pdf.js
async function convertPdfToImage(pdfDataUrl) {
  // Convert base64 to ArrayBuffer
  const base64Data = pdfDataUrl.split(',')[1];
  const binaryString = atob(base64Data);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  const loadingTask = pdfjsLib.getDocument({ data: bytes.buffer });
  const pdf = await loadingTask.promise;
  
  // Get the first page
  const page = await pdf.getPage(1);
  
  // Set scale for good quality preview
  const scale = 2;
  const viewport = page.getViewport({ scale });
  
  // Create a canvas to render the PDF page
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  
  // Render the page to canvas
  await page.render({
    canvasContext: context,
    viewport: viewport
  }).promise;
  
  // Convert canvas to image data URL
  const imageDataUrl = canvas.toDataURL('image/png', 0.9);
  
  return imageDataUrl;
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

// Helper function to generate a single stub preview
async function generateSingleStubPreview(formData, template, stubIndex, totalStubs, commonData) {
  const {
    rate, annualSalary, payFrequency, periodLength, defaultHours, payDay,
    payType, workerType, isContractor, periodsPerYear, hoursArray, overtimeArray,
    commissionArray, tipsArray, startDateArray, endDateArray, payDateArray, hireDate, stateRate, state
  } = commonData;

  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;

  // Calculate start date for this stub
  let startDate;
  if (startDateArray[stubIndex]) {
    startDate = new Date(startDateArray[stubIndex]);
  } else if (formData.startDate) {
    startDate = new Date(formData.startDate);
    // Move forward by stub index * period length
    startDate.setDate(startDate.getDate() + (stubIndex * periodLength));
  } else {
    startDate = new Date(hireDate);
    startDate.setDate(startDate.getDate() + (stubIndex * periodLength));
  }

  // Calculate pay values for this stub
  let hours = 0;
  let overtime = 0;
  let regularPay = 0;
  let overtimePay = 0;
  let commission = commissionArray[stubIndex] || 0;
  let tips = tipsArray[stubIndex] || 0;
  let grossPay = 0;

  if (payType === "salary") {
    grossPay = annualSalary / periodsPerYear + commission + tips;
    regularPay = annualSalary / periodsPerYear;
    hours = defaultHours;
    overtime = 0;
    overtimePay = 0;
  } else {
    hours = hoursArray[stubIndex] || defaultHours;
    overtime = overtimeArray[stubIndex] || 0;
    regularPay = rate * hours;
    overtimePay = rate * 1.5 * overtime;
    grossPay = regularPay + overtimePay + commission + tips;
  }

  const ssTax = isContractor ? 0 : grossPay * 0.062;
  const medTax = isContractor ? 0 : grossPay * 0.0145;
  
  let federalTax = 0;
  if (!isContractor) {
    if (formData.federalFilingStatus) {
      federalTax = calculateFederalTax(grossPay, payFrequency, formData.federalFilingStatus);
    } else {
      federalTax = grossPay * 0.22;
    }
  }
  
  let stateTax = 0;
  if (!isContractor) {
    stateTax = calculateStateTax(grossPay, formData.state, payFrequency, formData.stateAllowances || 0, stateRate);
  }
  
  const localTaxRate = getLocalTaxRate(formData.state, formData.city);
  const localTax = isContractor ? 0 : (formData.includeLocalTax && localTaxRate > 0 ? grossPay * localTaxRate : 0);
  const totalTax = ssTax + medTax + federalTax + stateTax + localTax;

  // Pre-tax deduction types
  const preTaxDeductionTypes = ['health_insurance', 'dental_insurance', 'vision_insurance'];
  const preTaxContributionTypes = ['401k', 'hsa', 'fsa', 'dependent_care_fsa', 'commuter'];

  // Calculate deductions
  const deductionsData = (formData.deductions || []).map(d => {
    const amount = parseFloat(d.amount) || 0;
    const currentAmount = d.isPercentage ? (grossPay * amount / 100) : amount;
    const isPreTax = d.preTax !== undefined ? d.preTax : preTaxDeductionTypes.includes(d.type);
    return { ...d, currentAmount, preTax: isPreTax, name: d.type === 'other' ? d.name : d.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) };
  });
  const totalDeductions = deductionsData.reduce((sum, d) => sum + d.currentAmount, 0);
  const preTaxDeductions = deductionsData.filter(d => d.preTax).reduce((sum, d) => sum + d.currentAmount, 0);
  const postTaxDeductions = deductionsData.filter(d => !d.preTax).reduce((sum, d) => sum + d.currentAmount, 0);

  // Calculate contributions
  const contributionsData = (formData.contributions || []).map(c => {
    const amount = parseFloat(c.amount) || 0;
    const currentAmount = c.isPercentage ? (grossPay * amount / 100) : amount;
    const isPreTax = c.preTax !== undefined ? c.preTax : preTaxContributionTypes.includes(c.type);
    return { ...c, currentAmount, preTax: isPreTax, name: c.type === 'other' ? c.name : c.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) };
  });
  const totalContributions = contributionsData.reduce((sum, c) => sum + c.currentAmount, 0);
  const preTaxContributions = contributionsData.filter(c => c.preTax).reduce((sum, c) => sum + c.currentAmount, 0);
  const postTaxContributions = contributionsData.filter(c => !c.preTax).reduce((sum, c) => sum + c.currentAmount, 0);

  // Combined pre-tax and post-tax totals
  const totalPreTax = preTaxDeductions + preTaxContributions;
  const totalPostTax = postTaxDeductions + postTaxContributions;

  const netPay = grossPay - totalTax - totalDeductions - totalContributions;

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
  const ytdRegularPay = regularPay * ytdPayPeriods;
  const ytdOvertimePay = overtimePay * ytdPayPeriods;
  
  // YTD Commission should be cumulative sum of all commissions up to and including current stub
  const ytdCommission = commissionArray.slice(0, stubIndex + 1).reduce((sum, c) => sum + (c || 0), 0);
  
  // YTD Tips should be cumulative sum of all tips up to and including current stub
  const ytdTips = tipsArray.slice(0, stubIndex + 1).reduce((sum, t) => sum + (t || 0), 0);
  
  // YTD Gross Pay = (base pay * periods) + cumulative commission + cumulative tips
  // Base pay is regularPay + overtimePay (without commission and tips)
  const basePay = regularPay + overtimePay;
  const ytdGrossPay = (basePay * ytdPayPeriods) + ytdCommission + ytdTips;
  
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

  const templateData = {
    formData, hours, overtime, commission, tips, regularPay, overtimePay, grossPay,
    ssTax, medTax, federalTax, stateTax, localTax, localTaxRate, totalTax, netPay,
    rate, stateRate, startDate, endDate, payDate, payFrequency,
    stubNum: stubIndex, totalStubs,
    ytdPayPeriods, ytdRegularPay, ytdOvertimePay, ytdCommission, ytdTips, ytdGrossPay,
    ytdSsTax, ytdMedTax, ytdFederalTax, ytdStateTax, ytdLocalTax, ytdTotalTax,
    ytdNetPay, ytdHours, payType, workerType, isContractor, annualSalary,
    deductionsData, totalDeductions, preTaxDeductions, postTaxDeductions,
    contributionsData, totalContributions, preTaxContributions, postTaxContributions,
    totalPreTax, totalPostTax, ytdPreTax, ytdPostTax,
    ytdDeductions, ytdContributions,
    logoDataUrl: formData.logoDataUrl || null,
    isPreview: true,
    absencePlansData: (formData.absencePlans || []).map(plan => ({
      description: plan.description || "PTO Plan", accrued: plan.accrued || "0", reduced: plan.reduced || "0"
    })),
    employerBenefitsData: (formData.employerBenefits || []).map(b => {
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
      return { name: b.name || "Employer Benefit", type: b.type, currentAmount: amount };
    }),
    totalEmployerBenefits: (formData.employerBenefits || []).reduce((sum, b) => {
      let amount;
      if (b.type === '401k_match') {
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
      return sum + amount;
    }, 0)
  };

  // Generate the template
  switch (template) {
    case 'template-b':
      generateTemplateB(doc, templateData, pageWidth, pageHeight, margin);
      break;
    case 'template-c':
      await generateTemplateC(doc, templateData, pageWidth, pageHeight, margin);
      break;
    case 'template-h':
      generateTemplateH(doc, templateData, pageWidth, pageHeight, margin);
      break;
    case 'template-a':
    default:
      await generateTemplateA(doc, templateData, pageWidth, pageHeight, margin);
      break;
  }

  // Add watermark
  addWatermarkToAllPages(doc, pageWidth, pageHeight);

  // Apply template-specific metadata before output
  applyPdfMetadata(doc, template);

  // Convert to image
  const pdfDataUrl = doc.output('dataurlstring');
  const imageDataUrl = await convertPdfToImage(pdfDataUrl);
  
  return imageDataUrl;
}

// Generate all preview PDFs as an array of base64 image URLs
export const generateAllPreviewPDFs = async (formData, template = 'template-a', numStubs = 1) => {
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

    const hoursArray = (formData.hoursList || "").split(",").map((h) => parseFloat(h.trim()) || 0);
    const overtimeArray = (formData.overtimeList || "").split(",").map((h) => parseFloat(h.trim()) || 0);
    const commissionArray = (formData.commissionList || "").split(",").map((c) => parseFloat(c.trim()) || 0);
    const startDateArray = (formData.startDateList || "").split(",").map((d) => d.trim()).filter(d => d);
    const endDateArray = (formData.endDateList || "").split(",").map((d) => d.trim()).filter(d => d);
    const payDateArray = (formData.payDateList || "").split(",").map((d) => d.trim()).filter(d => d);

    const hireDate = formData.hireDate ? new Date(formData.hireDate) : new Date();
    const state = formData.state?.toUpperCase() || "";
    const stateRate = isContractor ? 0 : getStateTaxRate(state);

    const commonData = {
      rate, annualSalary, payFrequency, periodLength, defaultHours, payDay,
      payType, workerType, isContractor, periodsPerYear, hoursArray, overtimeArray,
      commissionArray, startDateArray, endDateArray, payDateArray, hireDate, stateRate, state
    };

    // Generate previews for all stubs
    const previews = [];
    const actualNumStubs = Math.max(1, numStubs);
    
    for (let i = 0; i < actualNumStubs; i++) {
      const preview = await generateSingleStubPreview(formData, template, i, actualNumStubs, commonData);
      previews.push(preview);
    }

    return previews;
  } catch (error) {
    console.error("Error generating all previews:", error);
    return [null];
  }
};

// Generate preview PDF as base64 data URL (legacy - returns first stub only)
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
    const commissionArray = (formData.commissionList || "")
      .split(",")
      .map((c) => parseFloat(c.trim()) || 0);
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

    const hireDate = formData.hireDate ? new Date(formData.hireDate) : new Date();
    // Use custom start date from first period if available, otherwise use formData.startDate
    const startDate = startDateArray[0] 
      ? new Date(startDateArray[0]) 
      : (formData.startDate ? new Date(formData.startDate) : new Date(hireDate));

    // Get state tax rate from centralized tax calculator
    const state = formData.state?.toUpperCase() || "";
    const stateRate = isContractor ? 0 : getStateTaxRate(state);

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
    let commission = commissionArray[0] || 0;
    let grossPay = 0;

    if (payType === "salary") {
      grossPay = annualSalary / periodsPerYear + commission;
      regularPay = annualSalary / periodsPerYear;
      hours = defaultHours;
      overtime = 0;
      overtimePay = 0;
    } else {
      hours = hoursArray[0] || defaultHours;
      overtime = overtimeArray[0] || 0;
      regularPay = rate * hours;
      overtimePay = rate * 1.5 * overtime;
      grossPay = regularPay + overtimePay + commission;
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
    
    // Get actual local tax rate
    const localTaxRate = getLocalTaxRate(formData.state, formData.city);
    const localTax = isContractor ? 0 : (formData.includeLocalTax && localTaxRate > 0 ? grossPay * localTaxRate : 0);
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

    // Use custom end date from first period if available, otherwise calculate from start date
    const endDate = endDateArray[0] 
      ? new Date(endDateArray[0])
      : (() => {
          const calculated = new Date(startDate);
          calculated.setDate(startDate.getDate() + periodLength - 1);
          return calculated;
        })();
    // Use custom pay date if available, otherwise calculate from end date
    const payDate = payDateArray[0] 
      ? new Date(payDateArray[0])
      : nextWeekday(new Date(endDate), payDay);

    // Calculate YTD
    const ytdPayPeriods = calculatePayPeriodsFromHireDate(hireDate, endDate, periodLength);
    const ytdRegularPay = regularPay * ytdPayPeriods;
    const ytdOvertimePay = overtimePay * ytdPayPeriods;
    const ytdCommission = commission * ytdPayPeriods;
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
      commission,
      regularPay,
      overtimePay,
      grossPay,
      ssTax,
      medTax,
      federalTax,
      stateTax,
      localTax,
      localTaxRate,
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
      ytdContributions,
      // Pass the logo for preview - use uploaded logo if available
      logoDataUrl: formData.logoDataUrl || null,
      isPreview: true,
      // Absence plans for Template C (Workday)
      absencePlansData: (formData.absencePlans || []).map(plan => ({
        description: plan.description || "PTO Plan",
        accrued: plan.accrued || "0",
        reduced: plan.reduced || "0"
      })),
      // Employer benefits for Template C (Workday)
      employerBenefitsData: (formData.employerBenefits || []).map(b => {
        const amount = b.isPercentage ? (grossPay * parseFloat(b.amount) / 100) : parseFloat(b.amount) || 0;
        return { name: b.name || "Employer Benefit", type: b.type, currentAmount: amount };
      }),
      totalEmployerBenefits: (formData.employerBenefits || []).reduce((sum, b) => {
        const amount = b.isPercentage ? (grossPay * parseFloat(b.amount) / 100) : parseFloat(b.amount) || 0;
        return sum + amount;
      }, 0)
    };

    // Generate the template based on selection
    switch (template) {
      case 'template-b':
        generateTemplateB(doc, templateData, pageWidth, pageHeight, margin);
        break;
      case 'template-c':
        await generateTemplateC(doc, templateData, pageWidth, pageHeight, margin);
        break;
      case 'template-h':
        generateTemplateH(doc, templateData, pageWidth, pageHeight, margin);
        break;
      case 'template-a':
      default:
        await generateTemplateA(doc, templateData, pageWidth, pageHeight, margin);
        break;
    }

    // Add watermark on ALL pages
    addWatermarkToAllPages(doc, pageWidth, pageHeight);

    // Convert to base64 data URL (PDF)
    const pdfDataUrl = doc.output('dataurlstring');
    
    // Convert PDF to image for preview display
    const imageDataUrl = await convertPdfToImage(pdfDataUrl);
    
    return imageDataUrl;
  } catch (error) {
    console.error("Error generating preview:", error);
    return null;
  }
};

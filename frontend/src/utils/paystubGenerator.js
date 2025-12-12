import { jsPDF } from "jspdf";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { generateTemplateA, generateTemplateB, generateTemplateC } from "./paystubTemplates";

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
    const calculatedNumStubs = numStubs || 1;
    const payFrequency = formData.payFrequency || "biweekly";
    const periodLength = payFrequency === "biweekly" ? 14 : 7;
    const defaultHours = payFrequency === "weekly" ? 40 : 80;
    const payDay = formData.payDay || "Friday";

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
    const stateRate = stateRates[state] || 0.05;

    console.log("Calculated values:", { calculatedNumStubs, rate, payFrequency });

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
        
        const stubData = generateSingleStub(
          doc, formData, template, stubNum, new Date(currentStartDate), periodLength, 
          hoursArray, overtimeArray, defaultHours, rate, stateRate, 
          payDay, pageWidth, pageHeight, calculatedNumStubs, payFrequency
        );
        
        // Simple filename with date
        const fileName = `PayStub_${stubData.payDate.toISOString().split('T')[0]}.pdf`;
        console.log(`Adding ${fileName} to ZIP`);
        
        // Add PDF directly to zip root
        const pdfBlob = doc.output('blob');
        zip.file(fileName, pdfBlob);
        
        currentStartDate.setDate(currentStartDate.getDate() + periodLength);
      }
      
      // Generate and download ZIP
      console.log("Generating ZIP file...");
      const zipBlob = await zip.generateAsync({ type: "blob" });
      saveAs(zipBlob, `PayStubs_${formData.name || "Employee"}.zip`);
      console.log("ZIP downloaded successfully");
      
    } else {
      // Single stub - download directly as PDF
      console.log("Generating single PDF...");
      const doc = new jsPDF({ unit: "pt", format: "letter" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      
      generateSingleStub(
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

// Helper function to generate a single paystub
async function generateSingleStub(
  doc, formData, template, stubNum, startDate, periodLength,
  hoursArray, overtimeArray, defaultHours, rate, stateRate,
  payDay, pageWidth, pageHeight, totalStubs, payFrequency
) {
  const hours = hoursArray[stubNum] || defaultHours;
  const overtime = overtimeArray[stubNum] || 0;
  const regularPay = rate * hours;
  const overtimePay = rate * 1.5 * overtime;
  const grossPay = regularPay + overtimePay;

  const ssTax = grossPay * 0.062;
  const medTax = grossPay * 0.0145;
  const stateTax = grossPay * stateRate;
  const localTax = formData.includeLocalTax ? grossPay * 0.01 : 0;
  const totalTax = ssTax + medTax + stateTax + localTax;
  const netPay = grossPay - totalTax;

  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + periodLength - 1);
  const payDate = nextWeekday(new Date(endDate), payDay);

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
    startDate,
    endDate,
    payDate,
    payFrequency,
    stubNum,
    totalStubs
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

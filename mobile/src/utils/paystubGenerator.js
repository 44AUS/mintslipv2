import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import JSZip from 'jszip';
import { generateHTMLTemplateA, generateHTMLTemplateB, generateHTMLTemplateC } from './paystubTemplates';

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

export const generateAndDownloadPaystub = async (formData, template = 'template-a', numStubs, onProgress) => {
  try {
    console.log('Starting PDF generation...', { formData, template, numStubs });
    
    const rate = parseFloat(formData.rate) || 0;
    const calculatedNumStubs = numStubs || 1;
    const payFrequency = formData.payFrequency || 'biweekly';
    const periodLength = payFrequency === 'biweekly' ? 14 : 7;
    const defaultHours = payFrequency === 'weekly' ? 40 : 80;
    const payDay = formData.payDay || 'Friday';

    const hoursArray = (formData.hoursList || '')
      .split(',')
      .map((h) => parseFloat(h.trim()) || 0)
      .slice(0, calculatedNumStubs);
    const overtimeArray = (formData.overtimeList || '')
      .split(',')
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

    const state = formData.state?.toUpperCase() || '';
    const stateRate = stateRates[state] || 0.05;

    // If multiple stubs, create ZIP
    if (calculatedNumStubs > 1) {
      console.log('Creating ZIP for multiple stubs...');
      const zip = new JSZip();
      let currentStartDate = new Date(startDate);
      
      for (let stubNum = 0; stubNum < calculatedNumStubs; stubNum++) {
        if (onProgress) {
          onProgress((stubNum + 1) / calculatedNumStubs);
        }
        
        console.log(`Generating stub ${stubNum + 1}/${calculatedNumStubs}`);
        
        const stubData = generateSingleStubData(
          formData, stubNum, new Date(currentStartDate), periodLength,
          hoursArray, overtimeArray, defaultHours, rate, stateRate,
          payDay, calculatedNumStubs, payFrequency
        );
        
        // Generate HTML based on template
        let html;
        if (template === 'template-b') {
          html = generateHTMLTemplateB(stubData);
        } else if (template === 'template-c') {
          html = generateHTMLTemplateC(stubData);
        } else {
          html = generateHTMLTemplateA(stubData);
        }
        
        // Generate PDF
        const { uri } = await Print.printToFileAsync({ html });
        
        // Read file as base64
        const pdfBase64 = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        
        // Add to ZIP
        const fileName = `PayStub_${stubData.payDate.toISOString().split('T')[0]}.pdf`;
        zip.file(fileName, pdfBase64, { base64: true });
        
        currentStartDate.setDate(currentStartDate.getDate() + periodLength);
      }
      
      // Generate ZIP
      console.log('Generating ZIP file...');
      const zipBase64 = await zip.generateAsync({ type: 'base64' });
      
      // Save ZIP to file system
      const zipUri = FileSystem.documentDirectory + `PayStubs_${formData.name || 'Employee'}.zip`;
      await FileSystem.writeAsStringAsync(zipUri, zipBase64, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      // Share the ZIP file
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(zipUri);
      }
      
      console.log('ZIP downloaded successfully');
      return { success: true, numFiles: calculatedNumStubs };
    } else {
      // Single stub
      console.log('Generating single stub...');
      
      const stubData = generateSingleStubData(
        formData, 0, new Date(startDate), periodLength,
        hoursArray, overtimeArray, defaultHours, rate, stateRate,
        payDay, 1, payFrequency
      );
      
      // Generate HTML based on template
      let html;
      if (template === 'template-b') {
        html = generateHTMLTemplateB(stubData);
      } else if (template === 'template-c') {
        html = generateHTMLTemplateC(stubData);
      } else {
        html = generateHTMLTemplateA(stubData);
      }
      
      // Generate PDF
      const { uri } = await Print.printToFileAsync({ html });
      
      // Share the PDF
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri);
      }
      
      console.log('PDF downloaded successfully');
      return { success: true, numFiles: 1 };
    }
  } catch (error) {
    console.error('Error generating paystub:', error);
    throw error;
  }
};

function generateSingleStubData(
  formData, stubNum, currentStartDate, periodLength,
  hoursArray, overtimeArray, defaultHours, rate, stateRate,
  payDay, totalStubs, payFrequency
) {
  const endDate = new Date(currentStartDate);
  endDate.setDate(endDate.getDate() + periodLength - 1);
  
  const payDate = nextWeekday(new Date(endDate), payDay);
  
  const hours = hoursArray[stubNum] || defaultHours;
  const overtime = overtimeArray[stubNum] || 0;
  
  const regularPay = hours * rate;
  const overtimePay = overtime * rate * 1.5;
  const grossPay = regularPay + overtimePay;
  
  const ssTax = grossPay * 0.062;
  const medTax = grossPay * 0.0145;
  const stateTax = grossPay * stateRate;
  const localTax = formData.includeLocalTax ? grossPay * 0.01 : 0;
  const totalTax = ssTax + medTax + stateTax + localTax;
  const netPay = grossPay - totalTax;
  
  return {
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
    startDate: currentStartDate,
    endDate,
    payDate,
    payFrequency,
    stubNum,
    totalStubs,
  };
}

import { jsPDF } from "jspdf";
import { saveAs } from "file-saver";
import { generateBankTemplateA, generateBankTemplateB, generateBankTemplateC } from "./bankStatementTemplates";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

// Helper to clean bank statement PDF via backend
async function cleanBankStatementPdfViaBackend(pdfBlob, template, statementMonth, accountName) {
  try {
    console.log('Cleaning bank statement PDF via backend...', { template, statementMonth, accountName });
    const formData = new FormData();
    formData.append('file', pdfBlob, 'statement.pdf');
    formData.append('template', template);
    
    if (statementMonth) {
      formData.append('statement_month', statementMonth);
    }
    if (accountName) {
      formData.append('account_name', accountName);
    }
    
    const response = await fetch(`${BACKEND_URL}/api/clean-bank-statement-pdf`, {
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
      const byteCharacters = atob(result.cleanedPdfBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      console.log('PDF cleaned successfully, new size:', byteArray.length);
      return new Blob([byteArray], { type: 'application/pdf' });
    }
    
    return pdfBlob;
  } catch (error) {
    console.error('PDF cleaning error:', error);
    return pdfBlob;
  }
}

function parseCurrency(s) {
  const cleaned = String(s || "").replace(/[^0-9.-]/g, "");
  if (cleaned === "" || cleaned === "." || cleaned === "-") return 0;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

function formatShortDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  const month = d.getMonth() + 1;
  const day = String(d.getDate()).padStart(2, "0");
  const year = d.getFullYear();
  return `${month}/${day}/${year}`;
}

function formatDateLong(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleString("en-US", {
    month: "long",
    day: "2-digit",
    year: "numeric",
  });
}

export const generateAndDownloadBankStatement = async (data, template = 'template-a', returnBlob = false) => {
  const {
    accountName,
    accountAddress1,
    accountAddress2,
    accountNumber,
    selectedMonth,
    beginningBalance,
    transactions,
    bankLogo
  } = data;

  const doc = new jsPDF({ unit: "pt", format: "letter" });
  
  const margin = 25;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Calculate statement dates
  const [year, month] = selectedMonth.split("-").map(Number);
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0);
  const statementStart = start.toISOString().split("T")[0];
  const statementEnd = end.toISOString().split("T")[0];

  // Calculate summary
  const beginning = parseCurrency(beginningBalance);
  let ending = beginning;
  let deposits = 0, purchases = 0, transfers = 0, refunds = 0;

  transactions.forEach((tx) => {
    const amount = parseCurrency(tx.amount);
    switch (tx.type) {
      case "Deposit":
        deposits += amount;
        ending += amount;
        break;
      case "Refund":
        refunds += amount;
        ending += amount;
        break;
      case "Purchase":
        purchases += amount;
        ending -= amount;
        break;
      case "Transfer":
        transfers += amount;
        ending -= amount;
        break;
      default:
        break;
    }
  });

  const toFixed = (n) =>
    n.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const monthText = new Date(year, month - 1).toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });
  const dateRange = `(${formatDateLong(statementStart)} - ${formatDateLong(statementEnd)})`;

  // Prepare data for templates
  const templateData = {
    accountName,
    accountAddress1,
    accountAddress2,
    accountNumber,
    year,
    month,
    selectedMonth,
    statementStart,
    statementEnd,
    beginning,
    ending,
    deposits,
    purchases,
    transfers,
    refunds,
    monthText,
    dateRange,
    transactions,
    toFixed,
    formatShortDate,
    formatDateLong,
    parseCurrency,
    bankLogo: bankLogo || null
  };

  // Call appropriate template
  if (template === 'template-b') {
    generateBankTemplateB(doc, templateData, pageWidth, pageHeight, margin);
  } else if (template === 'template-c') {
    await generateBankTemplateC(doc, templateData, pageWidth, pageHeight, margin);
  } else {
    await generateBankTemplateA(doc, templateData, pageWidth, pageHeight, margin);
  }

  // Add page numbers
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setTextColor(102, 102, 102);
    doc.text(
      `Page ${i} of ${totalPages}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 30,
      { align: "center" }
    );
  }

  const pdfFileName = `Chime-Statement-${accountName || "statement"}.pdf`;
  
  // Get PDF blob and clean it via backend
  let pdfBlob = doc.output('blob');
  
  // Map template to backend template name
  const templateMap = {
    'template-a': 'chime',
    'template-b': 'bank-of-america',
    'template-c': 'chase'
  };
  const backendTemplate = templateMap[template] || 'chime';
  
  // Clean PDF with proper metadata (creation date = last day of statement month)
  pdfBlob = await cleanBankStatementPdfViaBackend(pdfBlob, backendTemplate, selectedMonth, accountName);
  
  // Store download info for payment success page
  const blobUrl = URL.createObjectURL(pdfBlob);
  sessionStorage.setItem('lastDownloadUrl', blobUrl);
  sessionStorage.setItem('lastDownloadFileName', pdfFileName);
  
  // Save the cleaned PDF
  saveAs(pdfBlob, pdfFileName);
  
  if (returnBlob) {
    return pdfBlob;
  }
};

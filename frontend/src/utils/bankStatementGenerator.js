import { jsPDF } from "jspdf";
import { saveAs } from "file-saver";
import { generateBankTemplateA, generateBankTemplateB, generateBankTemplateC } from "./bankStatementTemplates";
import { fetchPublishedLayout, renderLayout } from "./layoutEngine";

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

// Last-resort statement renderer — plain jsPDF text/lines only, no external
// template modules, no images, no backend. Whatever else fails, this always
// produces a valid, readable statement from the same data so the customer's
// download never comes back empty.
function drawFallbackStatement(doc, td, pageWidth, pageHeight, margin) {
  const money = (n) => `$${Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  let y = 60;
  doc.setTextColor(30, 51, 50);
  doc.setFont("helvetica", "bold"); doc.setFontSize(20);
  doc.text(td.bankName || "Chime", margin, y);
  doc.setFont("helvetica", "bold"); doc.setFontSize(12);
  doc.text("Checking Account Statement", margin, y + 22);
  doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(100, 116, 139);
  doc.text(td.monthText || "", pageWidth - margin, y, { align: "right" });
  y += 48;
  doc.setDrawColor(30, 198, 119); doc.setLineWidth(1.5);
  doc.line(margin, y, pageWidth - margin, y); y += 22;

  doc.setTextColor(30, 51, 50); doc.setFont("helvetica", "bold"); doc.setFontSize(10.5);
  doc.text(td.accountName || "", margin, y); y += 14;
  doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(51, 65, 85);
  if (td.accountAddress1) { doc.text(String(td.accountAddress1), margin, y); y += 12; }
  if (td.accountAddress2) { doc.text(String(td.accountAddress2), margin, y); y += 12; }
  const acct = String(td.accountNumber || "");
  if (acct) doc.text(`Account: ****${acct.slice(-4)}`, pageWidth - margin, y - 12, { align: "right" });
  y += 12;

  const summary = [
    ["Beginning Balance", td.beginning],
    ["Deposits", td.deposits], ["Purchases", td.purchases],
    ["Transfers", td.transfers], ["Refunds", td.refunds],
    ["Ending Balance", td.ending],
  ];
  doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.setTextColor(30, 198, 119);
  doc.text("Summary", margin, y); y += 16;
  doc.setFont("helvetica", "normal"); doc.setFontSize(9.5); doc.setTextColor(30, 51, 50);
  summary.forEach(([label, val]) => {
    doc.text(label, margin, y);
    doc.text(money(val), margin + 220, y, { align: "right" });
    y += 15;
  });
  y += 12;

  doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.setTextColor(30, 198, 119);
  doc.text("Transactions", margin, y); y += 16;
  doc.setFontSize(8.5); doc.setTextColor(100, 116, 139);
  doc.text("DATE", margin, y); doc.text("DESCRIPTION", margin + 70, y);
  doc.text("TYPE", margin + 330, y); doc.text("AMOUNT", pageWidth - margin, y, { align: "right" });
  y += 6; doc.setDrawColor(226, 232, 240); doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y); y += 14;

  doc.setFont("helvetica", "normal"); doc.setTextColor(30, 51, 50);
  (Array.isArray(td.transactions) ? td.transactions : []).forEach((tx) => {
    if (y > pageHeight - 60) { doc.addPage(); y = 60; }
    const credit = tx.type === "Deposit" || tx.type === "Refund";
    doc.text(String(tx.date || ""), margin, y);
    doc.text(String(tx.description || "").slice(0, 46), margin + 70, y);
    doc.text(String(tx.type || ""), margin + 330, y);
    doc.text(`${credit ? "+" : "-"}${money(td.parseCurrency ? td.parseCurrency(tx.amount) : tx.amount)}`, pageWidth - margin, y, { align: "right" });
    y += 14;
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

  // Calculate statement dates — tolerate a missing/blank month
  const now = new Date();
  let [year, month] = String(selectedMonth || "").split("-").map(Number);
  if (!year || !month) { year = now.getFullYear(); month = now.getMonth() + 1; }
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0);
  const statementStart = start.toISOString().split("T")[0];
  const statementEnd = end.toISOString().split("T")[0];

  // Calculate summary
  const beginning = parseCurrency(beginningBalance);
  let ending = beginning;
  let deposits = 0, purchases = 0, transfers = 0, refunds = 0;
  const txList = Array.isArray(transactions) ? transactions : [];

  txList.forEach((tx) => {
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
    transactions: txList,
    toFixed,
    formatShortDate,
    formatDateLong,
    parseCurrency,
    bankLogo: bankLogo || null
  };

  // Call appropriate template (admin-designed layouts render via the engine).
  // If any template path throws, fall back to a plain but complete statement
  // so the download always succeeds. A fresh jsPDF is used for the fallback
  // in case the primary attempt left partial content on the page.
  let useDoc = doc;
  try {
    if (template && String(template).startsWith('custom:')) {
      const customLayout = await fetchPublishedLayout(template.slice(7));
      if (customLayout) {
        renderLayout(doc, customLayout, { formData: data }, 'bank-statement');
      } else {
        await generateBankTemplateA(doc, templateData, pageWidth, pageHeight, margin);
      }
    } else if (template === 'template-b') {
      generateBankTemplateB(doc, templateData, pageWidth, pageHeight, margin);
    } else if (template === 'template-c') {
      await generateBankTemplateC(doc, templateData, pageWidth, pageHeight, margin);
    } else {
      await generateBankTemplateA(doc, templateData, pageWidth, pageHeight, margin);
    }
  } catch (tplErr) {
    console.error("Statement template failed, using fallback layout:", tplErr);
    useDoc = new jsPDF({ unit: "pt", format: "letter" });
    drawFallbackStatement(useDoc, templateData, pageWidth, pageHeight, margin);
  }

  // Add page numbers
  const totalPages = useDoc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    useDoc.setPage(i);
    useDoc.setFontSize(9);
    useDoc.setTextColor(102, 102, 102);
    useDoc.text(
      `Page ${i} of ${totalPages}`,
      pageWidth / 2,
      useDoc.internal.pageSize.getHeight() - 30,
      { align: "center" }
    );
  }

  // Real Chime downloads are named ChimeCheckingStatement{Month}{Year}.pdf
  const [selYear, selMonth] = String(selectedMonth || "").split("-").map(Number);
  const monthName = selYear && selMonth
    ? new Date(selYear, selMonth - 1, 1).toLocaleDateString("en-US", { month: "long" })
    : "";
  const pdfFileName = monthName
    ? `ChimeCheckingStatement${monthName}${selYear}.pdf`
    : `ChimeCheckingStatement.pdf`;
  
  // Get PDF blob and clean it via backend
  let pdfBlob = useDoc.output('blob');

  // Map template to backend template name
  const templateMap = {
    'template-a': 'chime',
    'template-b': 'bank-of-america',
    'template-c': 'chase'
  };
  const backendTemplate = templateMap[template] || 'chime';

  // Clean PDF with the real provider metadata (Chime-matched docinfo).
  // Never let cleaning damage the download: keep the freshly rendered PDF
  // unless the cleaner returns a valid, similarly-sized document. A backend
  // that echoes a blank/mangled/tiny result must not replace the real
  // statement — that would make the download look nothing like the preview.
  const rawBlob = pdfBlob;
  try {
    const cleaned = await cleanBankStatementPdfViaBackend(pdfBlob, backendTemplate, selectedMonth, accountName);
    const looksValid = cleaned && cleaned.size >= 1024 && cleaned.size >= rawBlob.size * 0.5;
    pdfBlob = looksValid ? cleaned : rawBlob;
    if (!looksValid) console.warn("Cleaned PDF looked invalid (size", cleaned && cleaned.size, "vs raw", rawBlob.size, ") — keeping rendered PDF");
  } catch (cleanErr) {
    console.error("PDF cleaning threw, using uncleaned PDF:", cleanErr);
    pdfBlob = rawBlob;
  }
  
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

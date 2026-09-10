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

  // jsPDF.text throws "Invalid arguments passed to jsPDF.text" on a null,
  // undefined or non-string value. Optional fields (address lines, blank
  // transaction cells, AI-filled values) can legitimately be empty, so coerce
  // every text argument to a safe string/array. Scoped to this fresh document,
  // this guards the built-in templates, the page-number footer and any custom
  // layout rendered into the same doc, so a blank field can never fail the
  // whole generation.
  const _origText = doc.text.bind(doc);
  doc.text = (txt, ...rest) => _origText(
    txt == null ? "" : (Array.isArray(txt) ? txt.map((t) => (t == null ? "" : String(t))) : String(txt)),
    ...rest
  );

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
  const useDoc = doc;
  if (template && String(template).startsWith('custom:')) {
    // A custom (admin-published) layout must never be able to fail the whole
    // generation — if fetching or rendering it throws, fall back to the
    // built-in Chime template so the buyer always gets a document.
    let rendered = false;
    try {
      const customLayout = await fetchPublishedLayout(template.slice(7));
      if (customLayout) {
        renderLayout(doc, customLayout, { formData: data }, 'bank-statement');
        rendered = true;
      }
    } catch (layoutErr) {
      console.error('Custom accounting-mockup layout failed, falling back to Chime:', layoutErr);
    }
    if (!rendered) {
      await generateBankTemplateA(doc, templateData, pageWidth, pageHeight, margin);
    }
  } else if (template === 'template-b') {
    generateBankTemplateB(doc, templateData, pageWidth, pageHeight, margin);
  } else if (template === 'template-c') {
    await generateBankTemplateC(doc, templateData, pageWidth, pageHeight, margin);
  } else {
    await generateBankTemplateA(doc, templateData, pageWidth, pageHeight, margin);
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

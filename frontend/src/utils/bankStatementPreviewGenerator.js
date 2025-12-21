import { jsPDF } from "jspdf";
import { generateBankTemplateA, generateBankTemplateB, generateBankTemplateC } from "./bankStatementTemplates";
import * as pdfjsLib from 'pdfjs-dist';

// Set up pdf.js worker using unpkg CDN with correct version
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

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

// Generate preview PDF as base64 data URL
export const generateBankStatementPreview = async (formData, template = 'template-a') => {
  try {
    const {
      accountName,
      accountAddress1,
      accountAddress2,
      accountNumber,
      selectedMonth,
      beginningBalance,
      transactions,
      bankLogo
    } = formData;

    // Need minimum data to generate preview
    if (!selectedMonth) {
      return null;
    }

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

    (transactions || []).forEach((tx) => {
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
          purchases += amount;
          ending -= amount;
          break;
      }
    });

    // Helper function for formatting numbers
    const toFixed = (n) =>
      n.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });

    // Calculate month text and date range
    const monthText = new Date(year, month - 1).toLocaleString("en-US", {
      month: "long",
      year: "numeric",
    });
    const dateRange = `(${formatDateLong(statementStart)} - ${formatDateLong(statementEnd)})`;

    // Prepare template data (matching what the main generator passes)
    // Pass the uploaded logo for preview - user can see their logo in real-time
    const templateData = {
      accountName: accountName || "Account Holder",
      accountAddress1: accountAddress1 || "123 Main Street",
      accountAddress2: accountAddress2 || "City, State 12345",
      accountNumber: accountNumber || "XXXX-XXXX",
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
      transactions: transactions || [],
      toFixed,
      formatShortDate,
      formatDateLong,
      parseCurrency,
      bankLogo: bankLogo || null  // Use uploaded logo in preview
    };

    // Generate the template based on selection
    switch (template) {
      case 'template-b':
        generateBankTemplateB(doc, templateData, pageWidth, pageHeight, margin);
        break;
      case 'template-c':
        await generateBankTemplateC(doc, templateData, pageWidth, pageHeight, margin);
        break;
      case 'template-a':
      default:
        await generateBankTemplateA(doc, templateData, pageWidth, pageHeight, margin);
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
    console.error("Error generating bank statement preview:", error);
    return null;
  }
};

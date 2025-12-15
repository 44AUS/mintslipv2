import { jsPDF } from "jspdf";
import { generateBankTemplateA } from "./bankStatementTemplates";

function parseCurrency(s) {
  const cleaned = String(s || "").replace(/[^0-9.-]/g, "");
  if (cleaned === "" || cleaned === "." || cleaned === "-") return 0;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

// Add watermark to the PDF
function addWatermark(doc, pageWidth, pageHeight) {
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
  for (let i = 0; i < 3; i++) {
    const yOffset = (i - 1) * 200;
    doc.text(text, centerX - textWidth / 2, centerY + yOffset, { 
      angle: 45,
      align: 'center'
    });
  }
  
  // Add "PREVIEW" text
  doc.setFontSize(40);
  doc.setTextColor(255, 100, 100); // Light red
  doc.text("PREVIEW", centerX, 50, { align: 'center' });
  
  // Restore state
  doc.restoreGraphicsState();
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
      transactions
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
    let atmWithdrawals = 0, adjustments = 0, roundUpTransfers = 0, fees = 0, spotMeTips = 0;

    (transactions || []).forEach((tx) => {
      const amount = parseCurrency(tx.amount);
      switch (tx.type) {
        case "Deposit":
          deposits += amount;
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
        case "ATM Withdrawal":
          atmWithdrawals += amount;
          ending -= amount;
          break;
        case "Adjustment":
          adjustments += amount;
          ending += amount; // Adjustments can be positive
          break;
        case "Round Up Transfer":
          roundUpTransfers += amount;
          ending -= amount;
          break;
        case "Fee":
          fees += amount;
          ending -= amount;
          break;
        case "SpotMe Tip":
          spotMeTips += amount;
          ending -= amount;
          break;
        case "Refund":
          refunds += amount;
          ending += amount;
          break;
        default:
          purchases += amount;
          ending -= amount;
      }
    });

    // Format transactions for template
    const formattedTransactions = (transactions || []).map((tx) => {
      const d = tx.date ? new Date(tx.date + "T00:00:00") : new Date();
      return {
        date: tx.date || "",
        description: tx.description || "",
        type: tx.type || "Purchase",
        amount: parseCurrency(tx.amount),
        balance: 0, // Will be calculated in template
      };
    });

    // Prepare template data
    const templateData = {
      accountName: accountName || "Account Holder",
      accountAddress1: accountAddress1 || "",
      accountAddress2: accountAddress2 || "",
      accountNumber: accountNumber || "XXXX",
      statementStart,
      statementEnd,
      beginning,
      ending,
      deposits,
      purchases,
      transfers,
      refunds,
      atmWithdrawals,
      adjustments,
      roundUpTransfers,
      fees,
      spotMeTips,
      transactions: formattedTransactions,
      margin,
      pageWidth,
      pageHeight,
    };

    // Generate the template (only Template A for now as it's the main one)
    await generateBankTemplateA(doc, templateData);

    // Add watermark on top
    addWatermark(doc, pageWidth, pageHeight);

    // Convert to base64 data URL
    const pdfDataUrl = doc.output('dataurlstring');
    
    return pdfDataUrl;
  } catch (error) {
    console.error("Error generating bank statement preview:", error);
    return null;
  }
};

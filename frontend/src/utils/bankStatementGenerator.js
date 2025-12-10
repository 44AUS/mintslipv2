import { jsPDF } from "jspdf";
import { generateBankTemplateA, generateBankTemplateB, generateBankTemplateC } from "./bankStatementTemplates";

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

export const generateAndDownloadBankStatement = async (data, template = 'template-a') => {
  const {
    accountName,
    accountAddress1,
    accountAddress2,
    accountNumber,
    selectedMonth,
    beginningBalance,
    transactions
  } = data;

  const doc = new jsPDF({ unit: "pt", format: "letter" });
  
  const margin = 40;
  let y = margin + 20;
  const pageWidth = doc.internal.pageSize.getWidth();

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

  // Template-specific colors
  let primaryColor, accentColor;
  if (template === 'template-b') {
    primaryColor = [41, 128, 185]; // Blue
    accentColor = [52, 152, 219];
  } else if (template === 'template-c') {
    primaryColor = [142, 68, 173]; // Purple
    accentColor = [155, 89, 182];
  } else {
    primaryColor = [0, 178, 106]; // Green (default)
    accentColor = [233, 112, 50];
  }

  // Header
  doc.setFontSize(32);
  doc.setTextColor(...primaryColor);
  doc.setFont(undefined, 'bold');
  doc.text("BANK STATEMENT", margin, y);
  
  y += 30;
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.setFont(undefined, 'normal');
  doc.text("Customer Service: (800) 422-3641", pageWidth - margin, y, { align: "right" });

  // Account Info
  y += 50;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.text(accountName, margin, y);
  doc.text(accountAddress1, margin, y + 15);
  doc.text(accountAddress2, margin, y + 30);

  // Statement Title
  y += 70;
  doc.setFontSize(16);
  doc.setTextColor(100, 100, 100);
  doc.text("Checking Account Statement", margin, y);

  // Account Number and Period
  y += 30;
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text("Account Number", margin, y);
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text(String(accountNumber || ""), margin, y + 15);

  const monthText = new Date(year, month - 1).toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });
  const dateRange = `(${formatDateLong(statementStart)} - ${formatDateLong(statementEnd)})`;

  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text("Statement Period", margin, y + 40);
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text(monthText, margin, y + 55);
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  const monthWidth = doc.getTextWidth(monthText);
  doc.text(` ${dateRange}`, margin + monthWidth, y + 55);

  // Summary Section
  y += 90;
  const summaryWidth = 300;
  doc.setFontSize(12);
  doc.setTextColor(...accentColor);
  doc.setFont(undefined, 'bold');
  doc.text("Summary", margin, y);
  y += 5;

  const beginningDateText = statementStart
    ? `Beginning balance on ${formatDateLong(statementStart)}`
    : "Beginning balance";
  const endingDateText = statementEnd
    ? `Ending balance on ${formatDateLong(statementEnd)}`
    : "Ending balance";

  const summaryRows = [
    [beginningDateText, beginning, "#000"],
    ["Deposits", deposits, "#000"],
    ["Purchases", purchases, "#000"],
    ["Transfers", transfers, "#000"],
    [endingDateText, ending, `rgb(${accentColor[0]}, ${accentColor[1]}, ${accentColor[2]})`],
  ];

  const rowHeight = 25;
  doc.setFont(undefined, 'normal');
  summaryRows.forEach(([label, val, color], idx) => {
    const isLastRow = idx === summaryRows.length - 1;
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(margin, y, margin + summaryWidth, y);
    y += rowHeight / 2 + 5;
    doc.setFontSize(9);
    doc.setTextColor(color);
    doc.text(label, margin, y);
    doc.text(`$${toFixed(val)}`, margin + summaryWidth, y, { align: "right" });
    y += rowHeight / 2;
    if (!isLastRow) {
      doc.line(margin, y, margin + summaryWidth, y);
    }
  });

  // Transactions Section
  y += 35;
  doc.setTextColor(...accentColor);
  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.text("Transactions", margin, y);
  y += 5;
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, pageWidth - margin, y);
  y += 15;

  const col = {
    date: margin,
    desc: margin + 90,
    type: margin + 280,
    amt: pageWidth - margin - 10,
  };

  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.setFont(undefined, 'bold');
  doc.text("DATE", col.date, y);
  doc.text("DESCRIPTION", col.desc, y);
  doc.text("TYPE", col.type, y);
  doc.text("AMOUNT", col.amt, y, { align: "right" });
  y += 8;
  doc.line(margin, y, pageWidth - margin, y);
  y += 12;

  const bottomLimit = doc.internal.pageSize.getHeight() - 60;
  const lineHeight = 18;

  doc.setFont(undefined, 'normal');
  transactions.forEach((tx) => {
    if (y + lineHeight > bottomLimit) {
      doc.addPage();
      y = margin + 20;
    }

    const type = (tx.type || "").toLowerCase();
    const isDeduction =
      type.includes("purchase") ||
      type.includes("transfer") ||
      type.includes("payment");

    const amountValue = parseCurrency(tx.amount);
    const formattedAmount = `${isDeduction ? "-" : ""}$${amountValue.toLocaleString(
      undefined,
      { minimumFractionDigits: 2 }
    )}`;
    const formattedDate = formatShortDate(tx.date);

    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.text(formattedDate, col.date, y);
    doc.text(tx.description || "", col.desc, y);
    doc.text(tx.type || "", col.type, y);
    doc.text(formattedAmount, col.amt, y, { align: "right" });

    y += lineHeight;
  });

  // Footer page
  doc.addPage();
  doc.setFontSize(14);
  doc.setTextColor(60, 60, 60);
  doc.setFont(undefined, 'bold');
  doc.text("Important Information", margin, margin + 40);

  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  const text = "In case of errors or questions about your electronic transactions, please contact us as soon as possible. We must hear from you no later than 60 days after we sent the first statement on which the problem or error appeared. If you think your statement or receipt is wrong or if you need more information about a transaction, please contact customer service immediately.";
  const wrappedText = doc.splitTextToSize(text, pageWidth - margin * 2);
  doc.text(wrappedText, margin, margin + 70);

  // Page Numbers
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    doc.text(
      `Page ${i} of ${totalPages}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 30,
      { align: "center" }
    );
  }

  doc.save(`BankStatement-${accountName || "statement"}.pdf`);
};
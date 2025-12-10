import { jsPDF } from "jspdf";

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

export const generateAndDownloadBankStatement = async (data) => {
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
  
  const margin = 25;
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

  // Header
  doc.setFontSize(28);
  doc.setTextColor(0, 178, 106);
  doc.text("BANK", margin, y);
  
  y += 30;
  doc.setFontSize(7);
  doc.setTextColor(180, 180, 180);
  doc.text("Member Services", pageWidth - margin, y, { align: "right" });
  doc.setTextColor(0, 0, 0);
  doc.text("(800) 422-3641", pageWidth - margin, y + 12, { align: "right" });

  // Account Info
  y += 60;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(7);
  doc.text(accountName, margin, y);
  doc.text(accountAddress1, margin, y + 12);
  doc.text(accountAddress2, margin, y + 24);

  // Statement Title
  y += 80;
  doc.setFontSize(16);
  doc.setTextColor(180, 180, 180);
  doc.text("Checking Account Statement", margin, y);

  // Account Number and Period
  y += 30;
  doc.setFontSize(8);
  doc.setTextColor(156, 156, 156);
  doc.text("Account number", margin, y);
  doc.setTextColor(180, 180, 180);
  doc.text(String(accountNumber || ""), margin, y + 14);

  const monthText = new Date(year, month - 1).toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });
  const dateRange = `(${formatDateLong(statementStart)} - ${formatDateLong(statementEnd)})`;

  doc.setFontSize(8);
  doc.setTextColor(156, 156, 156);
  doc.text("Statement period", margin, y + 36);
  doc.setFontSize(8);
  doc.setTextColor(180, 180, 180);
  doc.text(monthText, margin, y + 50);
  const monthWidth = doc.getTextWidth(monthText);
  doc.setFontSize(7);
  doc.text(` ${dateRange}`, margin + monthWidth, y + 50);

  // Issued By
  y += 70;
  doc.setFontSize(7);
  doc.setTextColor(180, 180, 180);
  doc.text("Issued by Bank, Member FDIC", margin, y);

  // Summary Section
  y += 50;
  const summaryWidth = 220;
  doc.setFontSize(8);
  doc.setTextColor(233, 112, 50);
  doc.text("Summary", margin, y);
  y += 10;

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
    [endingDateText, ending, "#1a51aa"],
  ];

  const rowHeight = 20;
  summaryRows.forEach(([label, val, color], idx) => {
    const isLastRow = idx === summaryRows.length - 1;
    doc.setDrawColor(221, 221, 221);
    doc.setLineWidth(0.7);
    doc.line(margin, y, margin + summaryWidth, y);
    y += rowHeight / 2;
    doc.setFontSize(7);
    doc.setTextColor(color);
    doc.text(label, margin, y);
    doc.text(`$${toFixed(val)}`, margin + summaryWidth, y, { align: "right" });
    y += rowHeight / 3;
    if (!isLastRow) {
      doc.line(margin, y, margin + summaryWidth, y);
    }
  });

  // Transactions Section
  y += 40;
  doc.setTextColor(233, 112, 50);
  doc.setFontSize(8);
  doc.text("Transactions", margin, y);
  y += 10;
  doc.setDrawColor(220, 220, 220);
  doc.line(margin, y, pageWidth - margin, y);
  y += 14;

  const col = {
    date: margin,
    desc: margin + 90,
    type: margin + 280,
    amt: margin + 400,
  };

  doc.setFontSize(7);
  doc.setTextColor(0, 0, 0);
  doc.text("TRANSACTION DATE", col.date, y);
  doc.text("DESCRIPTION", col.desc, y);
  doc.text("TYPE", col.type, y);
  doc.text("AMOUNT", col.amt, y, { align: "right" });
  y += 8;
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;

  const bottomLimit = doc.internal.pageSize.getHeight() - 60;
  const lineHeight = 14;

  transactions.forEach((tx) => {
    if (y + lineHeight > bottomLimit) {
      doc.addPage();
      y = margin;
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

    doc.setFontSize(7);
    doc.setTextColor(0, 0, 0);
    doc.text(formattedDate, col.date, y);
    doc.text(tx.description || "", col.desc, y);
    doc.text(tx.type || "", col.type, y);
    doc.text(formattedAmount, col.amt, y, { align: "right" });

    y += lineHeight;
  });

  // Footer
  doc.addPage();
  doc.setFontSize(12);
  doc.setTextColor(51, 51, 51);
  doc.text("Error Resolution Procedures", margin, margin + 50);

  doc.setFontSize(10);
  const text = "In case of errors or questions about your electronic transactions, please contact us as soon as possible. We must hear from you no later than 60 days after we sent the first statement on which the problem or error appeared.";
  const wrappedText = doc.splitTextToSize(text, pageWidth - margin * 2);
  doc.text(wrappedText, margin, margin + 90);

  // Page Numbers
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

  doc.save(`BankStatement-${accountName || "statement"}.pdf`);
};
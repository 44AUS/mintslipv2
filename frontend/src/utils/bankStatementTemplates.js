import ChimeLogo from "../assests/chime.png";


// Template A: Chime/Sutton Style Bank Statement
export function generateBankTemplateA(doc, data, pageWidth, pageHeight, margin) {
  const { 
    accountName, 
    accountAddress1, 
    accountAddress2, 
    accountNumber, 
    selectedMonth,
    statementStart, 
    statementEnd, 
    beginning, 
    ending, 
    deposits, 
    purchases, 
    transfers, 
    monthText, 
    dateRange, 
    transactions, 
    toFixed, 
    formatShortDate, 
    formatDateLong,
    parseCurrency,
    bankLogo
  } = data;
  
  let y = margin + 20;
  
  // --- Header Section ---
  doc.setFontSize(28);
  doc.setTextColor("#00b26a");
  // Use custom uploaded logo if available, otherwise fall back to default Chime logo
  try {
    if (bankLogo) {
      // For base64 data URLs, jsPDF can handle them directly
      doc.addImage(bankLogo, "PNG", margin, y - 18, 65, 20);
    } else {
      doc.addImage(ChimeLogo, "PNG", margin, y - 18, 65, 20);
    }
  } catch (e) {
    // fallback to text if addImage fails
    console.error("Template A logo error:", e);
    doc.text("Chime", margin, y);
  }

  // --- Member Services Header ---
  doc.setFontSize(7);
  const rightAlignX = pageWidth - margin;
  y += 15;

  doc.setTextColor("#b4b4b4"); // Light gray for labels
  const label = "Member Services";
  doc.text(label, rightAlignX, y - 15, { align: "right" });

  // Phone number underneath
  const textWidth = doc.getTextWidth(label);
  const leftX = rightAlignX - textWidth;
  doc.setTextColor("#000000"); // Black for phone number
  doc.text("(800) 422-3641", leftX, y - 3);

  // --- Account Information Section ---
  y += 45;
  doc.setTextColor("#000");
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text(accountName, margin, y);
  doc.text(accountAddress1, margin, y + 12);
  doc.text(accountAddress2, margin, y + 24);

  // --- Statement Title ---
  y += 70;
  doc.setFontSize(16);
  doc.setTextColor("#b4b4b4");
  doc.text("Checking Account Statement", margin, y);

  // --- Account Number and Statement Period ---
  y += 30;
  doc.setFontSize(8);

  doc.setTextColor("#9c9c9c");
  doc.text("Account number", margin, y);

  doc.setTextColor("#b4b4b4");
  doc.text(String(accountNumber || ""), margin, y + 14);

  if (statementStart && statementEnd) {
    const [year, month] = selectedMonth.split("-").map(Number);
    const monthTextLocal = new Date(year, month - 1).toLocaleString("en-US", {
      month: "long",
      year: "numeric",
    });

    const dateRangeLocal = `(${formatDateLong(statementStart)} - ${formatDateLong(statementEnd)})`;

    // Label for Statement Period
    doc.setFontSize(8);
    doc.setTextColor("#9c9c9c");
    doc.text("Statement period", margin, y + 36);

    // Month and Date Range
    doc.setFontSize(8);
    doc.setTextColor("#b4b4b4");
    doc.text(monthTextLocal, margin, y + 50);
    const monthWidth = doc.getTextWidth(monthTextLocal);
    doc.setFontSize(7);
    doc.text(` ${dateRangeLocal}`, margin + monthWidth, y + 50);
  }

  // --- Issued By ---
  y += 70;
  doc.setFontSize(7);
  doc.setTextColor("#b4b4b4");
  doc.text("Issued by Sutton Bank, Member FDIC", margin, y);

  // --- Summary Section ---
  y += 50;
  const summaryWidth = 220;
  doc.setFontSize(8);

  doc.setTextColor("#e97032"); // Orange color for section title
  doc.text("Summary", margin, y);
  y += 10;

  const beginningDateText = statementStart
    ? `Beginning balance on ${formatDateLong(statementStart)}`
    : "Beginning balance";
  const endingDateText = statementEnd
    ? `Ending balance on ${formatDateLong(statementEnd)}`
    : "Ending balance";

  // Define rows for the summary table
  const summaryRows = [
    [beginningDateText, beginning, "#000"],
    ["Deposits", deposits, "#000"],
    ["ATM Withdrawals", 0, "#000"],
    ["Purchases", purchases, "#000"],
    ["Adjustments", 0, "#000"],
    ["Transfers", transfers, "#000"],
    ["Round Up Transfers", 0, "#000"],
    ["Fees", 0, "#000"],
    ["SpotMe Tips", 0, "#000"],
    [endingDateText, ending, "#1a51aa"], // Blue for ending balance
  ];

  const rowHeight = 20;
  summaryRows.forEach(([labelText, val, color], idx) => {
    const isLastRow = idx === summaryRows.length - 1;

    // Draw divider line before each row
    doc.setDrawColor("#dddddd");
    doc.setLineWidth(0.7);
    doc.line(margin, y, margin + summaryWidth, y);
    y += rowHeight / 2;

    doc.setFontSize(7);
    doc.setTextColor(color);
    doc.text(labelText, margin, y);
    doc.text(`$${toFixed(val)}`, margin + summaryWidth, y, {
      align: "right",
    });

    y += rowHeight / 3;

    // Draw divider line after each row except the last one
    if (!isLastRow) {
      doc.line(margin, y, margin + summaryWidth, y);
    }
  });

  // --- Transactions Section ---
  y += 40;
  doc.setTextColor("#e97032");
  doc.setFontSize(8);
  doc.text("Transactions", margin, y);
  y += 10;
  doc.setDrawColor("#dcdcdc");
  doc.line(margin, y, pageWidth - margin, y);
  y += 14;

  // Define column positions for transaction table headers
  const col = {
    date: margin,
    desc: margin + 90,
    type: margin + 320,
    netAmt: margin + 400,
    amt: margin + 465,
    settle: margin + 470,
  };

  // Table Headers
  doc.setFont("helvetica", "bold");
  doc.setTextColor("#000");
  doc.setFontSize(7);
  doc.text("TRANSACTION DATE", col.date, y);
  doc.text("DESCRIPTION", col.desc, y);
  doc.text("TYPE", col.type, y);
  doc.text("AMOUNT", col.netAmt, y, { align: "right" });
  doc.text("NET AMOUNT", col.amt, y, { align: "right" });
  doc.text("SETTLEMENT DATE", col.settle, y);
  y += 8;
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;

  // --- Render Transactions ---
  const bottomLimit = pageHeight - 60;
  const lineHeight = 14;

  // Helper to auto-generate realistic settlement dates based on transaction type and date
  const getAutoSettlementDate = (tx) => {
    if (!tx.date) return "";
    const baseDate = new Date(tx.date + "T00:00:00");
    const type = (tx.type || "").toLowerCase();

    // Deposits, Transfers, Refunds typically settle on the same day
    if (["deposit", "transfer", "refund"].some((t) => type.includes(t))) {
      return formatShortDate(tx.date);
    }

    // Other types settle randomly 1-2 days later
    const daysToAdd = Math.random() < 0.5 ? 1 : 2;
    baseDate.setDate(baseDate.getDate() + daysToAdd);
    const isoDate = baseDate.toISOString().split("T")[0];
    return formatShortDate(isoDate);
  };

  doc.setFont("helvetica", "normal");
  // Iterate through transactions and render them on the PDF
  transactions.forEach((tx) => {
    // Add a new page if the current transaction will exceed the bottom limit
    if (y + lineHeight > bottomLimit) {
      doc.addPage();
      y = margin; // Reset vertical position to top margin
    }

    const type = (tx.type || "").toLowerCase();
    // Determine if the transaction amount is a deduction (negative)
    const isDeduction =
      type.includes("withdrawal") ||
      type.includes("purchase") ||
      type.includes("fee") ||
      type.includes("transfer") ||
      type.includes("payment") ||
      type.includes("atm");

    const amountValue = parseCurrency(tx.amount);
    const formattedAmount = `${isDeduction ? "-" : ""}$${amountValue.toLocaleString(undefined, {
      minimumFractionDigits: 2,
    })}`;
    const formattedNetAmount = `${isDeduction ? "-" : ""}$${amountValue.toLocaleString(undefined, {
      minimumFractionDigits: 2,
    })}`;

    const formattedDate = formatShortDate(tx.date);
    const formattedSettlementDate = getAutoSettlementDate(tx);

    // Logic for splitting description into two lines if it's long
    const fullDesc = (tx.description || "").trim();
    let firstLine = "";
    let secondLine = "";

    if (type.includes("transfer")) {
      // Transfers are displayed on a single line
      firstLine = fullDesc;
      secondLine = "";
    } else {
      // Other types get a two-line description format
      firstLine =
        fullDesc.length > 22 ? fullDesc.substring(0, 22).trim() + "" : fullDesc;
      secondLine = fullDesc.toUpperCase();
    }

    doc.setFont("helvetica", "normal");
    doc.setTextColor("#000");

    // Render transaction details
    doc.text(formattedDate, col.date, y);
    doc.setFontSize(7);
    doc.text(firstLine, col.desc, y);

    if (secondLine && !type.includes("transfer")) {
      doc.setFontSize(6);
      doc.text(secondLine, col.desc, y + 8);
      doc.setFontSize(7); // Reset font size for subsequent lines
    }

    doc.text(tx.type || "", col.type, y);
    doc.text(formattedAmount, col.amt, y, { align: "right" });
    doc.text(formattedNetAmount, col.netAmt, y, { align: "right" });
    doc.text(formattedSettlementDate, col.settle, y);

    // Adjust vertical position based on whether a second line was used
    y += secondLine && !type.includes("transfer") ? lineHeight * 1.5 : lineHeight;
  });

  // --- Error Resolution Procedures Section ---
  doc.addPage(); // Add a new page for the error resolution section
  doc.setFontSize(12);

  doc.setTextColor("#333");
  doc.text("Error Resolution Procedures", margin, margin + 50);

  doc.setFontSize(10);
  let yPos = margin + 90;

  // Define text parts for the error resolution procedures
  const beforePhone =
    "In case of errors or questions about your electronic transactions, call ";
  const phoneNumber = "1-800-422-3641";
  const afterPhone =
    ", write to Sutton Bank Member Services, P.O. Box 505, Attica, OH 44807-505, as soon as you can, if you think your statement or receipt is wrong or if you need more information about a transfer listed on the statement or receipt. We must hear from you no later than 60 days after we sent the FIRST statement on which the problem or error appeared.";

  const fullText = beforePhone + phoneNumber + afterPhone;

  // Wrap the text to fit within the page width
  const wrappedText = doc.splitTextToSize(fullText, pageWidth - margin * 2);

  // Render each line, coloring the phone number and making it a clickable link
  let lineY = yPos;
  for (const line of wrappedText) {
    if (line.includes(phoneNumber)) {
      const parts = line.split(phoneNumber);
      let x = margin;

      // Text before the phone number
      doc.setTextColor("#333");
      doc.text(parts[0], x, lineY);
      x += doc.getTextWidth(parts[0]);

      // Phone number (blue color and clickable link)
      const blueColor = "#215e99";
      doc.setTextColor(blueColor);
      doc.textWithLink(phoneNumber, x, lineY, { url: "tel:18004223641" });
      x += doc.getTextWidth(phoneNumber);

      // Text after the phone number
      if (parts[1]) {
        doc.setTextColor("#333");
        doc.text(parts[1], x, lineY);
      }
    } else {
      doc.setTextColor("#333");
      doc.text(line, margin, lineY);
    }
    lineY += 12; // Line spacing
  }

  // --- Additional steps for error resolution ---
  lineY += 12; // Space before the numbered list
  const additionalText = `(1) Tell us your name and account number (if any).

(2) Describe the error or the transfer you are unsure about, and explain as clearly as you can why you believe it is an error or why you need more information.

(3) Tell us the dollar amount of the suspected error.

We will investigate your complaint and will correct any error promptly. If we take more than 10 business days to do this, we will credit your account for the amount you think is in error, so that you will have the use of the money during the time it takes us to complete our investigation.`;

  // Wrap and print the additional text
  const wrappedAdditional = doc.splitTextToSize(additionalText, pageWidth - margin * 2);
  doc.setTextColor("#333");
  doc.text(wrappedAdditional, margin, lineY);
}

// Template B: Modern Digital Statement (Bank of America style)
export function generateBankTemplateB(doc, data, pageWidth, pageHeight, margin) {
  const { accountName, accountAddress1, accountAddress2, accountNumber, year, month, statementStart, statementEnd, beginning, ending, deposits, purchases, transfers, monthText, transactions, toFixed, formatShortDate, parseCurrency, bankLogo } = data;
  
  let y = 30;
  
  // Modern Header - Blue theme
  doc.setFillColor(41, 128, 185);
  doc.rect(0, 0, pageWidth, 80, 'F');
  
  // Add custom logo if uploaded (white background area for logo)
  if (bankLogo) {
    try {
      doc.setFillColor(255, 255, 255);
      doc.rect(pageWidth - margin - 80, 15, 70, 50, 'F');
      doc.addImage(bankLogo, "PNG", pageWidth - margin - 75, 20, 60, 40);
    } catch (e) {
      console.error("Failed to add logo to Template B:", e);
    }
  }
  
  y = 35;
  doc.setFontSize(28);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.text("ACCOUNT STATEMENT", margin, y);
  
  y += 25;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(monthText, margin, y);

  // Account Holder Card
  y = 110;
  doc.setFillColor(245, 245, 245);
  doc.rect(margin, y, pageWidth - 2 * margin, 70, 'F');
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(1);
  doc.rect(margin, y, pageWidth - 2 * margin, 70, 'S');
  
  y += 20;
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text("ACCOUNT HOLDER", margin + 10, y);
  y += 18;
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  doc.text(accountName, margin + 10, y);
  y += 15;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text(`${accountAddress1} | ${accountAddress2}`, margin + 10, y);

  // Account Number on right
  y = 110 + 20;
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text("ACCOUNT #", pageWidth - margin - 120, y);
  y += 18;
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  doc.text(String(accountNumber || ""), pageWidth - margin - 120, y);

  // Balance Cards
  y = 200;
  const cardWidth = (pageWidth - 2 * margin - 20) / 3;
  
  // Beginning Balance Card
  doc.setFillColor(255, 255, 255);
  doc.rect(margin, y, cardWidth, 60, 'F');
  doc.setDrawColor(41, 128, 185);
  doc.setLineWidth(2);
  doc.rect(margin, y, cardWidth, 60, 'S');
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.setFont("helvetica", "normal");
  doc.text("BEGINNING BALANCE", margin + 10, y + 20);
  doc.setFontSize(16);
  doc.setTextColor(41, 128, 185);
  doc.setFont("helvetica", "bold");
  doc.text(`$${toFixed(beginning)}`, margin + 10, y + 45);

  // Activity Card
  const midCard = margin + cardWidth + 10;
  doc.setFillColor(255, 255, 255);
  doc.rect(midCard, y, cardWidth, 60, 'F');
  doc.setDrawColor(41, 128, 185);
  doc.rect(midCard, y, cardWidth, 60, 'S');
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.setFont("helvetica", "normal");
  doc.text("ACTIVITY", midCard + 10, y + 20);
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text(`Deposits: $${toFixed(deposits)}`, midCard + 10, y + 35);
  doc.text(`Debits: $${toFixed(purchases + transfers)}`, midCard + 10, y + 50);

  // Ending Balance Card
  const rightCard = midCard + cardWidth + 10;
  doc.setFillColor(41, 128, 185);
  doc.rect(rightCard, y, cardWidth, 60, 'F');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text("ENDING BALANCE", rightCard + 10, y + 20);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(`$${toFixed(ending)}`, rightCard + 10, y + 45);

  // Transactions Table
  y = 290;
  doc.setFillColor(245, 245, 245);
  doc.rect(margin, y, pageWidth - 2 * margin, 30, 'F');
  
  y += 20;
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  doc.text("TRANSACTION HISTORY", margin + 10, y);

  y += 25;
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  const col = {
    date: margin + 10,
    desc: margin + 100,
    type: margin + 300,
    amt: pageWidth - margin - 20,
  };
  doc.text("DATE", col.date, y);
  doc.text("DESCRIPTION", col.desc, y);
  doc.text("TYPE", col.type, y);
  doc.text("AMOUNT", col.amt, y, { align: "right" });
  
  y += 5;
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, pageWidth - margin, y);
  y += 15;

  const bottomLimit = pageHeight - 60;
  const lineHeight = 20;

  doc.setFont("helvetica", "normal");
  transactions.forEach((tx, idx) => {
    if (y + lineHeight > bottomLimit) {
      doc.addPage();
      y = margin + 20;
    }

    // Alternating row colors
    if (idx % 2 === 0) {
      doc.setFillColor(250, 250, 250);
      doc.rect(margin, y - 10, pageWidth - 2 * margin, lineHeight, 'F');
    }

    const type = (tx.type || "").toLowerCase();
    const isDeduction = type.includes("purchase") || type.includes("transfer") || type.includes("payment");
    const amountValue = parseCurrency(tx.amount);
    const formattedAmount = `${isDeduction ? "-" : "+"}$${amountValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
    const formattedDate = formatShortDate(tx.date);

    doc.setFontSize(9);
    doc.setTextColor(isDeduction ? 220 : 0, isDeduction ? 53 : 150, isDeduction ? 69 : 0);
    doc.text(formattedDate, col.date, y);
    doc.setTextColor(0, 0, 0);
    doc.text(tx.description || "", col.desc, y);
    doc.setTextColor(100, 100, 100);
    doc.text(tx.type || "", col.type, y);
    doc.setTextColor(isDeduction ? 220 : 0, isDeduction ? 53 : 150, isDeduction ? 69 : 0);
    doc.setFont("helvetica", "bold");
    doc.text(formattedAmount, col.amt, y, { align: "right" });
    doc.setFont("helvetica", "normal");
    
    y += lineHeight;
  });
}

// Template C: Professional Corporate Statement (Chase style)
export function generateBankTemplateC(doc, data, pageWidth, pageHeight, margin) {
  const { accountName, accountAddress1, accountAddress2, accountNumber, year, month, statementStart, statementEnd, beginning, ending, deposits, purchases, transfers, monthText, dateRange, transactions, toFixed, formatShortDate, formatDateLong, parseCurrency, bankLogo } = data;
  
  let y = 40;
  
  // Corporate Header with Logo Space
  doc.setDrawColor(142, 68, 173);
  doc.setLineWidth(4);
  doc.line(margin, y - 10, pageWidth - margin, y - 10);
  
  // Add custom logo if uploaded
  if (bankLogo) {
    try {
      doc.addImage(bankLogo, "PNG", margin, y - 5, 60, 40);
      // Move text to the right if logo is present
      doc.setFontSize(18);
      doc.setTextColor(142, 68, 173);
      doc.setFont("helvetica", "bold");
      doc.text("Account Statement", margin + 75, y + 15);
    } catch (e) {
      console.error("Failed to add logo to Template C:", e);
      doc.setFontSize(32);
      doc.setTextColor(142, 68, 173);
      doc.setFont("helvetica", "bold");
      doc.text("FINANCIAL INSTITUTION", margin, y);
    }
  } else {
    doc.setFontSize(32);
    doc.setTextColor(142, 68, 173);
    doc.setFont("helvetica", "bold");
    doc.text("FINANCIAL INSTITUTION", margin, y);
    
    y += 20;
    doc.setFontSize(18);
    doc.setTextColor(100, 100, 100);
    doc.text("Account Statement", margin, y);
  }

  // Statement Period Box
  y += 10;
  doc.setFillColor(245, 242, 248);
  doc.rect(pageWidth - margin - 150, y - 20, 150, 50, 'F');
  doc.setDrawColor(142, 68, 173);
  doc.setLineWidth(1);
  doc.rect(pageWidth - margin - 150, y - 20, 150, 50, 'S');
  
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.setFont("helvetica", "normal");
  doc.text("STATEMENT PERIOD", pageWidth - margin - 140, y - 5);
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  doc.text(monthText, pageWidth - margin - 140, y + 10);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text(dateRange, pageWidth - margin - 140, y + 22);

  // Account Information Grid
  y = 120;
  const gridHeight = 90;
  
  // Left box - Account Holder
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(1);
  doc.rect(margin, y, (pageWidth - 2 * margin - 10) / 2, gridHeight, 'S');
  doc.setFillColor(250, 250, 250);
  doc.rect(margin, y, (pageWidth - 2 * margin - 10) / 2, 25, 'F');
  
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.setFont("helvetica", "bold");
  doc.text("ACCOUNT HOLDER", margin + 10, y + 17);
  
  y += 40;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text(accountName, margin + 10, y);
  y += 15;
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text(accountAddress1, margin + 10, y);
  y += 12;
  doc.text(accountAddress2, margin + 10, y);

  // Right box - Account Details
  y = 120;
  const rightBoxX = margin + (pageWidth - 2 * margin - 10) / 2 + 10;
  doc.rect(rightBoxX, y, (pageWidth - 2 * margin - 10) / 2, gridHeight, 'S');
  doc.setFillColor(250, 250, 250);
  doc.rect(rightBoxX, y, (pageWidth - 2 * margin - 10) / 2, 25, 'F');
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.text("ACCOUNT DETAILS", rightBoxX + 10, y + 17);
  
  y += 40;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text(`Account Number: ${accountNumber}`, rightBoxX + 10, y);
  y += 15;
  doc.text(`Type: Checking Account`, rightBoxX + 10, y);
  y += 15;
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text(`Statement Date: ${formatDateLong(statementEnd)}`, rightBoxX + 10, y);

  // Summary Table
  y = 230;
  doc.setFillColor(245, 242, 248);
  doc.rect(margin, y, pageWidth - 2 * margin, 30, 'F');
  doc.setDrawColor(142, 68, 173);
  doc.setLineWidth(2);
  doc.rect(margin, y, pageWidth - 2 * margin, 30, 'S');
  
  y += 20;
  doc.setFontSize(12);
  doc.setTextColor(142, 68, 173);
  doc.setFont("helvetica", "bold");
  doc.text("ACCOUNT SUMMARY", margin + 10, y);

  y += 30;
  const summaryData = [
    ["Beginning Balance", beginning],
    ["Total Deposits (+)", deposits],
    ["Total Purchases (-)", purchases],
    ["Total Transfers (-)", transfers],
  ];

  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  
  summaryData.forEach(([label, amount]) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    doc.text(label, margin + 10, y);
    doc.text(`$${toFixed(amount)}`, pageWidth - margin - 10, y, { align: "right" });
    y += 20;
    doc.line(margin, y - 10, pageWidth - margin, y - 10);
  });

  // Ending Balance - Highlighted
  doc.setFillColor(142, 68, 173);
  doc.rect(margin, y, pageWidth - 2 * margin, 35, 'F');
  y += 23;
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.text("ENDING BALANCE", margin + 10, y);
  doc.setFontSize(18);
  doc.text(`$${toFixed(ending)}`, pageWidth - margin - 10, y, { align: "right" });

  // Transaction Details
  y += 50;
  doc.setFillColor(245, 242, 248);
  doc.rect(margin, y, pageWidth - 2 * margin, 30, 'F');
  doc.setDrawColor(142, 68, 173);
  doc.setLineWidth(2);
  doc.rect(margin, y, pageWidth - 2 * margin, 30, 'S');
  
  y += 20;
  doc.setFontSize(12);
  doc.setTextColor(142, 68, 173);
  doc.text("TRANSACTION DETAILS", margin + 10, y);

  y += 25;
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 15;

  // Table headers
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.setFont("helvetica", "bold");
  const col = {
    date: margin + 10,
    desc: margin + 100,
    type: margin + 300,
    amt: pageWidth - margin - 20,
  };
  doc.text("DATE", col.date, y);
  doc.text("DESCRIPTION", col.desc, y);
  doc.text("TRANSACTION TYPE", col.type, y);
  doc.text("AMOUNT", col.amt, y, { align: "right" });
  
  y += 8;
  doc.line(margin, y, pageWidth - margin, y);
  y += 15;

  const bottomLimit = pageHeight - 80;
  const lineHeight = 18;

  doc.setFont("helvetica", "normal");
  transactions.forEach((tx) => {
    if (y + lineHeight > bottomLimit) {
      doc.addPage();
      y = margin + 20;
    }

    const type = (tx.type || "").toLowerCase();
    const isDeduction = type.includes("purchase") || type.includes("transfer") || type.includes("payment");
    const amountValue = parseCurrency(tx.amount);
    const formattedAmount = `${isDeduction ? "-" : "+"}$${amountValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
    const formattedDate = formatShortDate(tx.date);

    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.text(formattedDate, col.date, y);
    doc.text(tx.description || "", col.desc, y);
    doc.setTextColor(100, 100, 100);
    doc.text(tx.type || "", col.type, y);
    doc.setTextColor(isDeduction ? 220 : 0, isDeduction ? 53 : 150, isDeduction ? 69 : 0);
    doc.setFont("helvetica", "bold");
    doc.text(formattedAmount, col.amt, y, { align: "right" });
    doc.setFont("helvetica", "normal");
    
    y += lineHeight;
    doc.setDrawColor(230, 230, 230);
    doc.line(margin, y - 5, pageWidth - margin, y - 5);
  });

  // Footer with border
  const footerY = pageHeight - 50;
  doc.setDrawColor(142, 68, 173);
  doc.setLineWidth(2);
  doc.line(margin, footerY, pageWidth - margin, footerY);
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.setFont("helvetica", "normal");
  doc.text("For questions or concerns, please contact us at (800) 422-3641", pageWidth / 2, footerY + 15, { align: "center" });
}

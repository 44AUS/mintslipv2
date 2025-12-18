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
  let logoAdded = false;
  if (bankLogo && typeof bankLogo === 'string' && bankLogo.includes('base64')) {
    try {
      // For base64 data URLs from uploaded files - jsPDF accepts full data URL
      doc.addImage(bankLogo, margin, y - 18, 65, 20);
      logoAdded = true;
    } catch (e) {
      console.error("Template A custom logo error:", e);
    }
  }
  
  if (!logoAdded) {
    try {
      doc.addImage(ChimeLogo, "PNG", margin, y - 18, 65, 20);
    } catch (e) {
      doc.text("Chime", margin, y);
    }
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
  if (bankLogo && typeof bankLogo === 'string' && bankLogo.includes('base64')) {
    try {
      doc.setFillColor(255, 255, 255);
      doc.rect(pageWidth - margin - 80, 15, 70, 50, 'F');
      doc.addImage(bankLogo, pageWidth - margin - 75, 20, 60, 40);
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

// Template C: Chase Bank Statement Style
export function generateBankTemplateC(doc, data, pageWidth, pageHeight, margin) {
  const { accountName, accountAddress1, accountAddress2, accountNumber, year, month, statementStart, statementEnd, beginning, ending, deposits, purchases, transfers, monthText, dateRange, transactions, toFixed, formatShortDate, formatDateLong, parseCurrency, bankLogo } = data;
  
  // Chase blue color
  const chaseBlue = [0, 50, 120];
  
  // Increased margins for barcode space - use larger margin for all content
  const contentMargin = margin + 25;
  const rightContentMargin = margin + 60; // Extra space on right for barcode
  
  // Header margin (even more inset for header area)
  const headerMargin = contentMargin + 10;
  const headerRightMargin = rightContentMargin + 10;
  
  // Format statement date range for header
  const formatStatementDateRange = () => {
    if (statementStart && statementEnd) {
      const start = new Date(statementStart);
      const end = new Date(statementEnd);
      const options = { month: 'long', day: '2-digit', year: 'numeric' };
      return `${start.toLocaleDateString('en-US', options)} through ${end.toLocaleDateString('en-US', options)}`;
    }
    return dateRange;
  };
  
  // Separate transactions into deposits and withdrawals
  const depositsTransactions = transactions.filter(tx => {
    const type = (tx.type || "").toLowerCase();
    return type.includes("deposit") || type.includes("credit") || type.includes("refund") || type.includes("incoming");
  });
  
  const withdrawalsTransactions = transactions.filter(tx => {
    const type = (tx.type || "").toLowerCase();
    return type.includes("purchase") || type.includes("transfer") || type.includes("payment") || type.includes("withdrawal") || type.includes("debit");
  });
  
  // Track total pages - will be updated after all content is added
  let currentPage = 1;
  
  // Helper function to add bank logo (top left of every page)
  const addBankLogo = () => {
    let logoAddedC = false;
    if (bankLogo && typeof bankLogo === 'string' && bankLogo.includes('base64')) {
      try {
        doc.addImage(bankLogo, headerMargin, 15, 70, 25);
        logoAddedC = true;
      } catch (e) {
        console.error("Failed to add logo:", e);
      }
    }
    
    if (!logoAddedC) {
      doc.setFontSize(24);
      doc.setTextColor(...chaseBlue);
      doc.setFont("helvetica", "bold");
      doc.text("CHASE", headerMargin, 32);
    }
  };
  
  // Helper function to add page header (logo + statement dates and account number in top right)
  const addPageHeader = (isFirstPage = false) => {
    // Bank logo - top left (with header margin)
    addBankLogo();
    
    // Statement date range - top right (with header margin)
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");
    doc.text(formatStatementDateRange(), pageWidth - headerRightMargin, 25, { align: "right" });
    doc.text(`Account Number: ${accountNumber}`, pageWidth - headerRightMargin, 37, { align: "right" });
    
    // Customer Service Information - only on first page
    if (isFirstPage) {
      let csY = 52;
      const csBoxWidth = 160;
      const csBoxX = pageWidth - headerRightMargin - csBoxWidth;
      
      // Top thick black border
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(1.5);
      doc.line(csBoxX, csY - 3, pageWidth - headerRightMargin, csY - 3);
      
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text("CUSTOMER SERVICE INFORMATION", pageWidth - headerRightMargin, csY + 5, { align: "right" });
      
      csY += 15;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.text("Web site: Chase.com", pageWidth - headerRightMargin, csY, { align: "right" });
      csY += 9;
      doc.text("Service Center: 1-800-935-9935", pageWidth - headerRightMargin, csY, { align: "right" });
      csY += 9;
      doc.text("Deaf and Hard of Hearing: 1-800-242-7383", pageWidth - headerRightMargin, csY, { align: "right" });
      csY += 9;
      doc.text("Para Espanol: 1-877-312-4273", pageWidth - headerRightMargin, csY, { align: "right" });
      csY += 9;
      doc.text("International Calls: 1-713-262-1679", pageWidth - headerRightMargin, csY, { align: "right" });
      
      // Bottom thick black border
      csY += 5;
      doc.setLineWidth(1.5);
      doc.line(csBoxX, csY, pageWidth - headerRightMargin, csY);
    }
  };
  
  // Helper function to add page footer with page number
  const addPageFooter = (pageNum, totalPages) => {
    doc.setFontSize(8);
    doc.setTextColor(80, 80, 80);
    doc.setFont("helvetica", "normal");
    doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth - margin, pageHeight - 25, { align: "right" });
  };
  
  // Helper to draw a section title box (Chase style - complete rectangle with black border)
  const drawSectionTitle = (title, yPos) => {
    const boxHeight = 18;
    const paddingX = 10;
    
    // Calculate box width based on text length
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    const textWidth = doc.getTextWidth(title.toUpperCase());
    const boxWidth = textWidth + (paddingX * 2);
    
    // White background with solid black border (all 4 sides, thicker line)
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(1.5);
    doc.rect(contentMargin, yPos, boxWidth, boxHeight, 'FD');
    
    // Bold black text, centered vertically with left padding
    doc.setTextColor(0, 0, 0);
    doc.text(title.toUpperCase(), contentMargin + paddingX, yPos + 12);
    
    // Horizontal line extending from the RIGHT edge of the box to the right margin (at bottom of box)
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.line(contentMargin + boxWidth, yPos + boxHeight - 1, pageWidth - rightContentMargin, yPos + boxHeight - 1);
    
    return yPos + boxHeight;
  };
  
  // Helper to draw transaction table headers
  const drawTableHeaders = (yPos) => {
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");
    doc.text("DATE", contentMargin + 5, yPos);
    doc.text("DESCRIPTION", contentMargin + 60, yPos);
    doc.text("AMOUNT", pageWidth - rightContentMargin - 5, yPos, { align: "right" });
    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.3);
    doc.line(contentMargin, yPos + 3, pageWidth - rightContentMargin, yPos + 3);
    return yPos + 12;
  };
  
  // Helper to draw horizontal barcode on right edge (page 1 only)
  const drawBarcode = async () => {
    // Position barcode horizontally on the right side of page 1
    const barcodeWidth = 45;
    const barcodeHeight = 180;
    const barcodeX = pageWidth - margin - barcodeWidth + 5;
    const barcodeY = 50;
    
    // Try to load the barcode image
    try {
      const response = await fetch('/chase-barcode.png');
      const blob = await response.blob();
      const reader = new FileReader();
      
      await new Promise((resolve, reject) => {
        reader.onload = () => {
          try {
            doc.addImage(reader.result, 'PNG', barcodeX, barcodeY, barcodeWidth, barcodeHeight);
          } catch (e) {
            console.error("Failed to add barcode image:", e);
          }
          resolve();
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (e) {
      // Fallback: draw simple barcode pattern if image fails
      console.error("Failed to load barcode image:", e);
      doc.setFillColor(0, 0, 0);
      for (let i = 0; i < 40; i++) {
        if (i % 2 === 0) {
          doc.rect(barcodeX + 5, barcodeY + (i * 4), 35, 2, 'F');
        }
      }
    }
  };

  // ============ PAGE 1: Header + Summary ============
  let y = 30;
  
  // Add page header (logo + dates + account number)
  addPageHeader(true);
  
  // Bank address (below logo)
  y = 50;
  doc.setFontSize(7);
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");
  doc.text("JPMorgan Chase Bank, N.A.", headerMargin, y);
  doc.text("PO Box 182051", headerMargin, y + 10);
  doc.text("Columbus, OH 43218-2051", headerMargin, y + 20);
  
  // Draw barcode on right side
  drawBarcode();
  
  // Account holder info (with header margin - more centered)
  y += 45;
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");
  doc.text(accountName, headerMargin, y);
  doc.text(accountAddress1, headerMargin, y + 12);
  doc.text(accountAddress2, headerMargin, y + 24);
  
  // CHECKING SUMMARY section - use the box style
  y += 55;
  y = drawSectionTitle("Checking Summary", y);
  
  // Account type label - positioned closer to the title box (not far right)
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Chase Personal Checking", contentMargin + 180, y - 5);
  
  y += 10;
  
  // Summary table - narrower width (not full page width)
  const summaryTableWidth = 280;
  const summaryRightEdge = contentMargin + summaryTableWidth;
  
  const summaryItems = [
    { label: "Beginning Balance", amount: beginning },
    { label: "Deposits and Additions", amount: deposits },
    { label: "Electronic Withdrawals", amount: purchases },
    { label: "Ending Balance", amount: ending, bold: true }
  ];
  
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.3);
  
  // Draw summary header
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 80);
  doc.setFont("helvetica", "bold");
  doc.text("AMOUNT", summaryRightEdge, y, { align: "right" });
  doc.line(contentMargin, y + 5, summaryRightEdge, y + 5);
  y += 15;
  
  summaryItems.forEach((item, index) => {
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", item.bold ? "bold" : "normal");
    doc.text(item.label, contentMargin + 5, y);
    
    const amountStr = `$${toFixed(item.amount)}`;
    doc.text(amountStr, summaryRightEdge, y, { align: "right" });
    
    if (index < summaryItems.length - 1) {
      doc.setDrawColor(200, 200, 200);
      doc.line(contentMargin, y + 8, summaryRightEdge, y + 8);
    }
    y += 18;
  });
  
  // ============ FEE WAIVER MESSAGE ============
  y += 15;
  
  // Determine if fee is waived based on user's data
  const beginningBalance = parseFloat(beginning) || 0;
  const totalDepositsAmount = parseFloat(deposits) || 0;
  const feeWaived = beginningBalance >= 2000 || totalDepositsAmount >= 500;
  
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);
  
  const feeTextWidth = pageWidth - contentMargin - rightContentMargin;
  
  if (feeWaived) {
    doc.setFont("helvetica", "bold");
    doc.text("Congratulations, thanks to your qualifying actions, we waived the $15.00 monthly service fee for this statement period.", contentMargin, y);
  } else {
    doc.setFont("helvetica", "normal");
    doc.text("There is a $15.00 monthly service fee for this statement period.", contentMargin, y);
  }
  
  y += 12;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  const feeWaiverText1 = "Here's how your activity can help you avoid the $15.00 monthly service fee: the fee is waived if any of the following is achieved over the statement period:";
  const feeWaiverLines1 = doc.splitTextToSize(feeWaiverText1, feeTextWidth);
  doc.text(feeWaiverLines1, contentMargin, y);
  y += feeWaiverLines1.length * 8 + 5;
  
  // Bullet points
  const bulletPoints = [
    "Maintain a minimum daily balance of $2,000.00 or more",
    "Have $500.00 or more in qualifying electronic deposits"
  ];
  
  bulletPoints.forEach((point) => {
    doc.text("•", contentMargin + 5, y);
    const pointLines = doc.splitTextToSize(point, feeTextWidth - 15);
    doc.text(pointLines, contentMargin + 15, y);
    y += pointLines.length * 8 + 2;
  });
  
  y += 8;
  doc.setFont("helvetica", "bold");
  doc.text("Here's a summary of your activity this period:", contentMargin, y);
  y += 12;
  
  doc.setFont("helvetica", "normal");
  const activitySummary = [
    "• Minimum Daily Balance: $" + toFixed(beginningBalance),
    "• Qualifying electronic deposits into your account: $" + toFixed(totalDepositsAmount)
  ];
  
  activitySummary.forEach((item) => {
    doc.text(item, contentMargin + 5, y);
    y += 10;
  });
  
  // ============ PAGE 2: Transaction Details ============
  doc.addPage();
  currentPage = 2;
  y = 50;
  
  addPageHeader();
  
  // DEPOSITS AND ADDITIONS section
  y = drawSectionTitle("Deposits and Additions", y);
  y = drawTableHeaders(y + 8);
  
  const lineHeight = 14;
  const bottomLimit = pageHeight - 100;
  
  // Calculate totals
  let totalDeposits = 0;
  let totalWithdrawals = 0;
  
  // Draw deposit transactions
  doc.setFont("helvetica", "normal");
  depositsTransactions.forEach((tx) => {
    if (y + lineHeight > bottomLimit) {
      addPageFooter(currentPage, 3);
      doc.addPage();
      currentPage++;
      y = 50;
      addPageHeader();
      y = drawSectionTitle("Deposits and Additions (continued)", y);
      y = drawTableHeaders(y + 8);
    }
    
    const amountValue = parseCurrency(tx.amount);
    totalDeposits += amountValue;
    const formattedAmount = `$${amountValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
    const formattedDate = formatShortDate(tx.date);
    
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    doc.text(formattedDate, margin + 5, y);
    
    // Truncate description if too long
    let desc = tx.description || "";
    if (desc.length > 60) desc = desc.substring(0, 57) + "...";
    doc.text(desc, margin + 60, y);
    
    doc.text(formattedAmount, pageWidth - margin - 5, y, { align: "right" });
    
    y += lineHeight;
  });
  
  // Deposits total
  y += 5;
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);
  y += 12;
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("Total Deposits and Additions", margin + 5, y);
  doc.text(`$${totalDeposits.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, pageWidth - margin - 5, y, { align: "right" });
  
  // WITHDRAWALS section
  y += 30;
  
  if (y + 100 > bottomLimit) {
    addPageFooter(currentPage, 3);
    doc.addPage();
    currentPage++;
    y = 50;
    addPageHeader();
  }
  
  y = drawSectionTitle("Electronic Withdrawals", y);
  y = drawTableHeaders(y + 8);
  
  // Draw withdrawal transactions
  doc.setFont("helvetica", "normal");
  withdrawalsTransactions.forEach((tx) => {
    if (y + lineHeight > bottomLimit) {
      addPageFooter(currentPage, 3);
      doc.addPage();
      currentPage++;
      y = 50;
      addPageHeader();
      y = drawSectionTitle("Electronic Withdrawals (continued)", y);
      y = drawTableHeaders(y + 8);
    }
    
    const amountValue = parseCurrency(tx.amount);
    totalWithdrawals += amountValue;
    const formattedAmount = `$${amountValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
    const formattedDate = formatShortDate(tx.date);
    
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    doc.text(formattedDate, margin + 5, y);
    
    let desc = tx.description || "";
    if (desc.length > 60) desc = desc.substring(0, 57) + "...";
    doc.text(desc, margin + 60, y);
    
    doc.text(formattedAmount, pageWidth - margin - 5, y, { align: "right" });
    
    y += lineHeight;
  });
  
  // Withdrawals total
  y += 5;
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);
  y += 12;
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("Total Electronic Withdrawals", margin + 5, y);
  doc.text(`$${totalWithdrawals.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, pageWidth - margin - 5, y, { align: "right" });
  
  // ============ LAST PAGE: Legal Disclaimer ============
  doc.addPage();
  currentPage++;
  y = 50;
  
  addPageHeader();
  
  // Legal disclaimer text
  const legalText1Title = "IN CASE OF ERRORS OR QUESTIONS ABOUT YOUR ELECTRONIC FUNDS TRANSFERS:";
  const legalText1Body = `Call us at 1-866-564-2262 or write us at the address on the front of this statement (non-personal accounts contact Customer Service) immediately if you think your statement or receipt is incorrect or if you need more information about a transfer listed on the statement or receipt.

For personal accounts only: We must hear from you no later than 60 days after we sent you the FIRST statement on which the problem or error appeared. Be prepared to give us the following information:

    • Your name and account number
    • The dollar amount of the suspected error
    • A description of the error or transfer you are unsure of, why you believe it is an error, or why you need more information.

We will investigate your complaint and will correct any error promptly. If we take more than 10 business days (or 20 business days for new accounts) to do this, we will credit your account for the amount you think is in error so that you will have use of the money during the time it takes us to complete our investigation.`;

  const legalText2Title = "IN CASE OF ERRORS OR QUESTIONS ABOUT NON-ELECTRONIC TRANSACTIONS:";
  const legalText2Body = `Contact the bank immediately if your statement is incorrect or if you need more information about any non-electronic transactions (checks or deposits) on this statement. If any such error appears, you must notify the bank in writing no later than 30 days after the statement was made available to you. For more complete details, see the Account Rules and Regulations or other applicable account agreement that governs your account.

Deposit products and services are offered by JPMorgan Chase Bank, N.A. Member FDIC`;

  // Draw first legal section
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  const titleLines1 = doc.splitTextToSize(legalText1Title, pageWidth - 2 * margin);
  doc.text(titleLines1, margin, y);
  y += titleLines1.length * 10 + 5;
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  const bodyLines1 = doc.splitTextToSize(legalText1Body, pageWidth - 2 * margin);
  doc.text(bodyLines1, margin, y);
  y += bodyLines1.length * 9 + 25;
  
  // Draw second legal section
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  const titleLines2 = doc.splitTextToSize(legalText2Title, pageWidth - 2 * margin);
  doc.text(titleLines2, margin, y);
  y += titleLines2.length * 10 + 5;
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  const bodyLines2 = doc.splitTextToSize(legalText2Body, pageWidth - 2 * margin);
  doc.text(bodyLines2, margin, y);
  
  // Now go back and add page footers to all pages
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addPageFooter(i, totalPages);
  }
}

// Template A: Traditional Bank Statement
export function generateBankTemplateA(doc, data, pageWidth, pageHeight, margin) {
  const { accountName, accountAddress1, accountAddress2, accountNumber, year, month, statementStart, statementEnd, beginning, ending, deposits, purchases, transfers, monthText, dateRange, transactions, toFixed, formatShortDate, parseCurrency } = data;
  
  let y = margin + 20;
  
  // Traditional Bank Header
  doc.setFontSize(32);
  doc.setTextColor(0, 178, 106);
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
  doc.setTextColor(233, 112, 50);
  doc.setFont(undefined, 'bold');
  doc.text("Summary", margin, y);
  y += 5;

  const summaryRows = [
    [`Beginning balance on ${data.formatDateLong(statementStart)}`, beginning, "#000"],
    ["Deposits", deposits, "#000"],
    ["Purchases", purchases, "#000"],
    ["Transfers", transfers, "#000"],
    [`Ending balance on ${data.formatDateLong(statementEnd)}`, ending, "rgb(0, 178, 106)"],
  ];

  const rowHeight = 25;
  doc.setFont(undefined, 'normal');
  summaryRows.forEach(([label, val, color], idx) => {
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(margin, y, margin + summaryWidth, y);
    y += rowHeight / 2 + 5;
    doc.setFontSize(9);
    doc.setTextColor(color);
    doc.text(label, margin, y);
    doc.text(`$${toFixed(val)}`, margin + summaryWidth, y, { align: "right" });
    y += rowHeight / 2;
  });

  // Transactions Section
  y += 35;
  doc.setTextColor(233, 112, 50);
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
    const isDeduction = type.includes("purchase") || type.includes("transfer") || type.includes("payment");
    const amountValue = parseCurrency(tx.amount);
    const formattedAmount = `${isDeduction ? "-" : ""}$${amountValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
    const formattedDate = formatShortDate(tx.date);

    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.text(formattedDate, col.date, y);
    doc.text(tx.description || "", col.desc, y);
    doc.text(tx.type || "", col.type, y);
    doc.text(formattedAmount, col.amt, y, { align: "right" });
    y += lineHeight;
  });
}

// Template B: Modern Digital Statement
export function generateBankTemplateB(doc, data, pageWidth, pageHeight, margin) {
  const { accountName, accountAddress1, accountAddress2, accountNumber, year, month, statementStart, statementEnd, beginning, ending, deposits, purchases, transfers, monthText, transactions, toFixed, formatShortDate, parseCurrency } = data;
  
  let y = 30;
  
  // Modern Header - Blue theme
  doc.setFillColor(41, 128, 185);
  doc.rect(0, 0, pageWidth, 80, 'F');
  
  y = 35;
  doc.setFontSize(28);
  doc.setTextColor(255, 255, 255);
  doc.setFont(undefined, 'bold');
  doc.text("ACCOUNT STATEMENT", margin, y);
  
  y += 25;
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
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
  doc.setFont(undefined, 'bold');
  doc.text(accountName, margin + 10, y);
  y += 15;
  doc.setFont(undefined, 'normal');
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
  doc.setFont(undefined, 'bold');
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
  doc.text("BEGINNING BALANCE", margin + 10, y + 20);
  doc.setFontSize(16);
  doc.setTextColor(41, 128, 185);
  doc.setFont(undefined, 'bold');
  doc.text(`$${toFixed(beginning)}`, margin + 10, y + 45);

  // Activity Card
  const midCard = margin + cardWidth + 10;
  doc.setFillColor(255, 255, 255);
  doc.rect(midCard, y, cardWidth, 60, 'F');
  doc.setDrawColor(41, 128, 185);
  doc.rect(midCard, y, cardWidth, 60, 'S');
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.setFont(undefined, 'normal');
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
  doc.setFont(undefined, 'bold');
  doc.text(`$${toFixed(ending)}`, rightCard + 10, y + 45);

  // Transactions Table
  y = 290;
  doc.setFillColor(245, 245, 245);
  doc.rect(margin, y, pageWidth - 2 * margin, 30, 'F');
  
  y += 20;
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.setFont(undefined, 'bold');
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

  const bottomLimit = doc.internal.pageSize.getHeight() - 60;
  const lineHeight = 20;

  doc.setFont(undefined, 'normal');
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
    doc.setFont(undefined, 'bold');
    doc.text(formattedAmount, col.amt, y, { align: "right" });
    doc.setFont(undefined, 'normal');
    
    y += lineHeight;
  });
}

// Template C: Professional Corporate Statement
export function generateBankTemplateC(doc, data, pageWidth, pageHeight, margin) {
  const { accountName, accountAddress1, accountAddress2, accountNumber, year, month, statementStart, statementEnd, beginning, ending, deposits, purchases, transfers, monthText, dateRange, transactions, toFixed, formatShortDate, parseCurrency } = data;
  
  let y = 40;
  
  // Corporate Header with Logo Space
  doc.setDrawColor(142, 68, 173);
  doc.setLineWidth(4);
  doc.line(margin, y - 10, pageWidth - margin, y - 10);
  
  doc.setFontSize(32);
  doc.setTextColor(142, 68, 173);
  doc.setFont(undefined, 'bold');
  doc.text("FINANCIAL INSTITUTION", margin, y);
  
  y += 20;
  doc.setFontSize(18);
  doc.setTextColor(100, 100, 100);
  doc.text("Account Statement", margin, y);

  // Statement Period Box
  y += 10;
  doc.setFillColor(245, 242, 248);
  doc.rect(pageWidth - margin - 150, y - 20, 150, 50, 'F');
  doc.setDrawColor(142, 68, 173);
  doc.setLineWidth(1);
  doc.rect(pageWidth - margin - 150, y - 20, 150, 50, 'S');
  
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.setFont(undefined, 'normal');
  doc.text("STATEMENT PERIOD", pageWidth - margin - 140, y - 5);
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.setFont(undefined, 'bold');
  doc.text(monthText, pageWidth - margin - 140, y + 10);
  doc.setFontSize(8);
  doc.setFont(undefined, 'normal');
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
  doc.setFont(undefined, 'bold');
  doc.text("ACCOUNT HOLDER", margin + 10, y + 17);
  
  y += 40;
  doc.setFont(undefined, 'normal');
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
  
  doc.setFont(undefined, 'bold');
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.text("ACCOUNT DETAILS", rightBoxX + 10, y + 17);
  
  y += 40;
  doc.setFont(undefined, 'normal');
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text(`Account Number: ${accountNumber}`, rightBoxX + 10, y);
  y += 15;
  doc.text(`Type: Checking Account`, rightBoxX + 10, y);
  y += 15;
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text(`Statement Date: ${data.formatDateLong(statementEnd)}`, rightBoxX + 10, y);

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
  doc.setFont(undefined, 'bold');
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
    doc.setFont(undefined, 'normal');
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
  doc.setFont(undefined, 'bold');
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
  doc.setFont(undefined, 'bold');
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

  const bottomLimit = doc.internal.pageSize.getHeight() - 80;
  const lineHeight = 18;

  doc.setFont(undefined, 'normal');
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
    doc.setFont(undefined, 'bold');
    doc.text(formattedAmount, col.amt, y, { align: "right" });
    doc.setFont(undefined, 'normal');
    
    y += lineHeight;
    doc.setDrawColor(230, 230, 230);
    doc.line(margin, y - 5, pageWidth - margin, y - 5);
  });

  // Footer with border
  const footerY = doc.internal.pageSize.getHeight() - 50;
  doc.setDrawColor(142, 68, 173);
  doc.setLineWidth(2);
  doc.line(margin, footerY, pageWidth - margin, footerY);
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.setFont(undefined, 'normal');
  doc.text("For questions or concerns, please contact us at (800) 422-3641", pageWidth / 2, footerY + 15, { align: "center" });
}

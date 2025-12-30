// Canadian Template H: Modern Colorful Pay Stub with Blue Headers
// Identical to US OnPay template, adapted for Canadian taxes

export function generateCanadianTemplateH(doc, data, pageWidth, pageHeight, margin) {
  const { 
    formData, hours, overtime, commission = 0, regularPay, overtimePay, grossPay, 
    cpp, ei, qpip, federalTax, provincialTax, totalTax, netPay, rate, 
    startDate, endDate, payDate, payFrequency, stubNum, totalStubs,
    ytdGrossPay = grossPay, ytdCpp = cpp, ytdEi = ei, ytdQpip = qpip,
    ytdFederalTax = federalTax, ytdProvincialTax = provincialTax,
    ytdRegularPay = regularPay, ytdOvertimePay = overtimePay, ytdCommission = 0,
    deductionsData = [], totalDeductions = 0, contributionsData = [], totalContributions = 0,
    ytdDeductions = 0, ytdContributions = 0, ytdPayPeriods = 1,
    logoDataUrl, isQuebec, cppLabel = 'CPP',
    periodCheckNumber = "", periodMemo = "",
    absencePlansData = []
  } = data;
  
  // Color scheme - Blue themed, matching US OnPay template
  const colors = {
    blue: [37, 128, 216],         // #2580d8 - Header blue
    lightBlue: [215, 215, 215],   // Light gray for sub-headers
    lightGray: [240, 240, 240],   // #f0f0f0 - Footer content background
    borderGray: [200, 200, 200],  // #C8C8C8 - Borders
    white: [255, 255, 255],
    black: [0, 0, 0],
  };
  
  // Helper to format currency
  const fmtCurrency = (n) => Number(n || 0).toLocaleString("en-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  
  // Helper function to format date as MM/DD/YYYY
  const formatDate = (date) => {
    let mm, dd, yyyy;
    if (typeof date === 'string' && date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const parts = date.split('-').map(Number);
      yyyy = parts[0];
      mm = String(parts[1]).padStart(2, '0');
      dd = String(parts[2]).padStart(2, '0');
    } else if (date instanceof Date) {
      mm = String(date.getUTCMonth() + 1).padStart(2, '0');
      dd = String(date.getUTCDate()).padStart(2, '0');
      yyyy = date.getUTCFullYear();
    } else {
      const d = new Date(date);
      mm = String(d.getMonth() + 1).padStart(2, '0');
      dd = String(d.getDate()).padStart(2, '0');
      yyyy = d.getFullYear();
    }
    return `${mm}/${dd}/${yyyy}`;
  };

  const m = 15; // Margin
  let y = 12;

  // ==================== TOP SECTION - EMPLOYEE NAME ====================
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...colors.black);
  doc.text(formData.name || "Employee Name", m + 50, y + 5);
  
  // ***DD*** badge on right (regular rectangle)
  doc.setFillColor(...colors.blue);
  doc.rect(pageWidth - m - 35, y - 2, 40, 12, 'F');
  doc.setTextColor(...colors.white);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("***DD***", pageWidth - m - 30, y + 6);
  
  y += 15;

  // ==================== DIRECT DEPOSIT BLUE BANNER ====================
  doc.setFillColor(...colors.blue);
  doc.rect(m, y, pageWidth - 2 * m, 20, 'F');
  
  doc.setTextColor(...colors.white);
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  const ddText = "DIRECT DEPOSIT *** DIRECT DEPOSIT **************************************************************************";
  doc.text(ddText, m + 10, y + 14);
  
  y += 16;

  // ==================== EMPLOYEE ADDRESS SECTION ====================
  y+=20;
  doc.setFillColor(...colors.white);
  doc.rect(m, y, pageWidth - 2 * m, 35, 'F');
  
  // Employee address on left
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...colors.black);
  doc.text(formData.name || "Employee Name", m + 5, y + 10);
  doc.text(formData.address || "123 Employee Street", m + 5, y + 20);
  doc.text(`${formData.city || "City"}, ${formData.province || "ON"} ${formData.postalCode || "A0A 0A0"}`, m + 5, y + 30);

  y+=10;
  
  // "Thank you for your hard work" message
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("Thank you for your hard work.", m + 5, y + 40);

  y+=20;
  
  // *** VOID *** watermark on right
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(...colors.black);
  doc.text("*** VOID ***", pageWidth - m - 130, y + 40);
  
  doc.setTextColor(...colors.black);
  y += 40;

  // ==================== PAYSTUB INFO BAR ====================
  doc.setFillColor(...colors.white);
  doc.rect(m, y, pageWidth - 2 * m, 36, 'F');
  
  // Employee name with blue background box - extends to end of Cheque Date area
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  const employeeName = formData.name || "Employee Name";
  const blueBoxWidth = 155; // Extends to cover through Cheque Date area
  doc.setFillColor(...colors.blue);
  doc.rect(m + 2, y + 1, blueBoxWidth, 12, 'F');
  doc.setTextColor(...colors.white);
  doc.text(employeeName, m + 6, y + 10);
  doc.setTextColor(...colors.black);

  y+=5;
  
  // Info section with two rows
  doc.setFontSize(7);
  // Use per-period cheque number if provided, otherwise auto-generate
  const checkNum = periodCheckNumber || String(Math.floor(1 + Math.random() * 999));
  const empNum = formData.employeeId || String(Math.floor(1000000 + Math.random() * 9000000));
  
  // Row 1: Cheque # and Cheque Date (left side)
  doc.setFont("helvetica", "bold");
  doc.text("Cheque #:", m + 5, y + 18);
  doc.setFont("helvetica", "normal");
  doc.text(checkNum, m + 40, y + 18);
  
  doc.setFont("helvetica", "bold");
  doc.text("Cheque Date:", m + 90, y + 18);
  doc.setFont("helvetica", "normal");
  doc.text(formatDate(payDate), m + 145, y + 18);
  
  // Row 2: Period Start and Period Ending (left side) - aligned with Row 1
  doc.setFont("helvetica", "bold");
  doc.text("Period Start:", m + 5, y + 30);
  doc.setFont("helvetica", "normal");
  doc.text(formatDate(startDate), m + 50, y + 30);
  
  doc.setFont("helvetica", "bold");
  doc.text("Period Ending:", m + 90, y + 30);
  doc.setFont("helvetica", "normal");
  doc.text(formatDate(endDate), m + 145, y + 30);
  
  // Right side: MEMO stacked above EMP# - starting at same height as name
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.text("MEMO:", pageWidth - m - 325, y + 9);
  doc.setFont("helvetica", "normal");
  // Use per-period memo if provided, otherwise default message
  const memoText = periodMemo || "Thank you for your hard work.";
  doc.text(memoText, pageWidth - m - 295, y + 9);
  
  doc.setFont("helvetica", "bold");
  doc.text("EMP#:", pageWidth - m - 325, y + 20);
  doc.setFont("helvetica", "normal");
  doc.text(empNum, pageWidth - m - 295, y + 20);
  
  y += 40;

  // ==================== MAIN DATA TABLES ====================
  const tableWidth = pageWidth - 2 * m;
  const col1Width = tableWidth * 0.40;  // Gross Wages - wider for more columns
  const col2Width = tableWidth * 0.28;  // Withholding Taxes
  const col3Width = tableWidth * 0.32;  // Deductions/Benefits
  
  const col1X = m;
  const col2X = m + col1Width;
  const col3X = m + col1Width + col2Width;
  
  const headerHeight = 12;
  const subHeaderHeight = 10;
  const rowHeight = 8;
  const numRows = 25;

  // ==================== GROSS WAGES TABLE ====================
  // Main header
  doc.setFillColor(...colors.blue);
  doc.rect(col1X, y, col1Width, headerHeight, 'F');
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...colors.white);
  doc.text("Gross Wages", col1X + col1Width/2, y + 8, { align: 'center' });
  
  let tableY = y + headerHeight;
  
  // Sub headers
  doc.setFillColor(...colors.lightBlue);
  doc.rect(col1X, tableY, col1Width, subHeaderHeight, 'F');
  doc.setDrawColor(...colors.borderGray);
  doc.rect(col1X, tableY, col1Width, subHeaderHeight);
  
  doc.setFontSize(6);
  doc.setTextColor(...colors.black);
  doc.setFont("courier", "normal");
  
  // Column widths for Gross Wages: Desc, Hours, Rate, Amt, YTD
  const gw = {
    desc: col1Width * 0.28,
    hours: col1Width * 0.16,
    rate: col1Width * 0.18,
    amt: col1Width * 0.18,
    ytd: col1Width * 0.20
  };
  
  let xPos = col1X + 2;
  doc.text("Desc", xPos, tableY + 7);
  xPos += gw.desc;
  doc.text("Hours", xPos + gw.hours / 2, tableY + 7, { align: 'center' });
  xPos += gw.hours;
  doc.text("Rate", xPos + gw.rate / 2, tableY + 7, { align: 'center' });
  xPos += gw.rate;
  doc.text("Amt", xPos + gw.amt / 2, tableY + 7, { align: 'center' });
  xPos += gw.amt;
  doc.text("YTD", xPos + gw.ytd / 2, tableY + 7, { align: 'center' });
  
  tableY += subHeaderHeight;
  
  // Gross Wages data - 25 rows
  const earningsRows = [
    ["Regular", hours > 0 ? hours.toFixed(3) : "0.000", rate > 0 ? fmtCurrency(rate) : "0.00", fmtCurrency(regularPay), fmtCurrency(ytdRegularPay)],
    ["Overtime", overtime > 0 ? overtime.toFixed(3) : "0.000", rate > 0 ? fmtCurrency(rate * 1.5) : "0.00", fmtCurrency(overtimePay), fmtCurrency(ytdOvertimePay)],
    ["Commission", "0.000", "0.00", commission > 0 ? fmtCurrency(commission) : "0.00", commission > 0 ? fmtCurrency(ytdCommission) : "0.00"],
    ["", "", "", "", ""],
    ["", "", "", "", ""],
    ["", "", "", "", ""],
    ["", "", "", "", ""],
    ["", "", "", "", ""],
    ["", "", "", "", ""],
    ["", "", "", "", ""],
    ["", "", "", "", ""],
    ["", "", "", "", ""],
    ["", "", "", "", ""],
    ["", "", "", "", ""],
    ["", "", "", "", ""],
    ["", "", "", "", ""],
    ["", "", "", "", ""],
    ["", "", "", "", ""],
    ["", "", "", "", ""],
    ["", "", "", "", ""],
    ["", "", "", "", ""],
    ["", "", "", "", ""],
    ["", "", "", "", ""],
    ["", "", "", "", ""],
    ["", "", "", "", ""],
  ];
  
  doc.setFont("courier", "normal");
  doc.setFontSize(6);
  
  const grossWagesStartY = tableY;
  earningsRows.forEach((row) => {
    xPos = col1X + 2;
    doc.text(row[0], xPos, tableY + 6);
    xPos += gw.desc;
    doc.text(row[1], xPos + gw.hours - 3, tableY + 6, { align: 'right' });
    xPos += gw.hours;
    doc.text(row[2], xPos + gw.rate - 3, tableY + 6, { align: 'right' });
    xPos += gw.rate;
    doc.text(row[3], xPos + gw.amt - 3, tableY + 6, { align: 'right' });
    xPos += gw.amt;
    doc.text(row[4], xPos + gw.ytd - 5, tableY + 6, { align: 'right' });
    
    tableY += rowHeight;
  });
  
  // Draw vertical column dividers for Gross Wages (after Desc row, between columns)
  doc.setDrawColor(...colors.borderGray);
  doc.setLineWidth(0.5);
  const gwEndY = tableY;
  // Vertical line after Desc column
  doc.line(col1X + gw.desc, grossWagesStartY, col1X + gw.desc, gwEndY);
  // Vertical line after Hours column
  doc.line(col1X + gw.desc + gw.hours, grossWagesStartY, col1X + gw.desc + gw.hours, gwEndY);
  // Vertical line after Rate column
  doc.line(col1X + gw.desc + gw.hours + gw.rate, grossWagesStartY, col1X + gw.desc + gw.hours + gw.rate, gwEndY);
  // Vertical line after Amt column
  doc.line(col1X + gw.desc + gw.hours + gw.rate + gw.amt, grossWagesStartY, col1X + gw.desc + gw.hours + gw.rate + gw.amt, gwEndY);
  // Outer borders (left, right, bottom) - BLACK
  doc.setDrawColor(...colors.black);
  doc.line(col1X, grossWagesStartY, col1X, gwEndY); // Left border
  doc.line(col1X + col1Width, grossWagesStartY, col1X + col1Width, gwEndY); // Right border
  doc.line(col1X, gwEndY, col1X + col1Width, gwEndY); // Bottom border

  // ==================== WITHHOLDING TAXES TABLE ====================
  tableY = y + headerHeight;
  
  // Main header
  doc.setFillColor(...colors.blue);
  doc.rect(col2X, y, col2Width, headerHeight, 'F');
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...colors.white);
  doc.text("Withholding Taxes", col2X + col2Width/2, y + 8, { align: 'center' });
  
  // Sub headers
  doc.setFillColor(...colors.lightBlue);
  doc.rect(col2X, tableY, col2Width, subHeaderHeight, 'F');
  doc.setDrawColor(...colors.borderGray);
  doc.rect(col2X, tableY, col2Width, subHeaderHeight);
  
  doc.setFontSize(6);
  doc.setTextColor(...colors.black);
  doc.setFont("courier", "normal");
  
  // Column widths for Withholding: Desc, Amt, YTD
  const wt = {
    desc: col2Width * 0.50,
    amt: col2Width * 0.25,
    ytd: col2Width * 0.25
  };
  
  xPos = col2X + 2;
  doc.text("Desc", xPos, tableY + 7);
  xPos += wt.desc;
  doc.text("Amt", xPos, tableY + 7);
  xPos += wt.amt;
  doc.text("YTD", xPos, tableY + 7);
  
  tableY += subHeaderHeight;
  
  // Withholding data - Canadian taxes (CPP/QPP, EI, QPIP, Federal, Provincial)
  const provinceCode = formData.province || "ON";
  const taxRows = [
    [cppLabel || "CPP", fmtCurrency(cpp), fmtCurrency(ytdCpp)],
    ["EI", fmtCurrency(ei), fmtCurrency(ytdEi)],
    ...(isQuebec ? [["QPIP", fmtCurrency(qpip || 0), fmtCurrency(ytdQpip || 0)]] : []),
    ["FIT", fmtCurrency(federalTax), fmtCurrency(ytdFederalTax)],
    [`PIT-${provinceCode}`, fmtCurrency(provincialTax), fmtCurrency(ytdProvincialTax)],
    ["", "", ""],
    ["", "", ""],
    ["", "", ""],
    ["", "", ""],
    ["", "", ""],
    ["", "", ""],
    ["", "", ""],
    ["", "", ""],
    ["", "", ""],
    ["", "", ""],
    ["", "", ""],
    ["", "", ""],
    ["", "", ""],
    ["", "", ""],
    ["", "", ""],
    ["", "", ""],
    ["", "", ""],
    ["", "", ""],
    ["", "", ""],
    ["", "", ""],
  ];
  
  // Fill to exactly 25 rows
  while (taxRows.length < 25) {
    taxRows.push(["", "", ""]);
  }
  
  doc.setFont("courier", "normal");
  doc.setFontSize(6);
  
  const withholdingStartY = tableY;
  taxRows.slice(0, 25).forEach((row) => {
    xPos = col2X + 2;
    doc.text(row[0], xPos, tableY + 6);
    xPos += wt.desc;
    doc.text(row[1], xPos + wt.amt - 3, tableY + 6, { align: 'right' });
    xPos += wt.amt;
    doc.text(row[2], xPos + wt.ytd - 5, tableY + 6, { align: 'right' });
    
    tableY += rowHeight;
  });
  
  // Draw vertical column dividers for Withholding Taxes (after Desc row, between columns)
  doc.setDrawColor(...colors.borderGray);
  doc.setLineWidth(0.5);
  const wtEndY = tableY;
  // Vertical line after Desc column
  doc.line(col2X + wt.desc, withholdingStartY, col2X + wt.desc, wtEndY);
  // Vertical line after Amt column
  doc.line(col2X + wt.desc + wt.amt, withholdingStartY, col2X + wt.desc + wt.amt, wtEndY);
  // Outer borders (left, right, bottom) - BLACK
  doc.setDrawColor(...colors.black);
  doc.line(col2X, withholdingStartY, col2X, wtEndY); // Left border
  doc.line(col2X + col2Width, withholdingStartY, col2X + col2Width, wtEndY); // Right border
  doc.line(col2X, wtEndY, col2X + col2Width, wtEndY); // Bottom border

  // ==================== DEDUCTIONS/BENEFITS TABLE ====================
  tableY = y + headerHeight;
  
  // Main header
  doc.setFillColor(...colors.blue);
  doc.rect(col3X, y, col3Width, headerHeight, 'F');
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...colors.white);
  doc.text("Deductions/Benefits", col3X + col3Width/2, y + 8, { align: 'center' });
  
  // Sub headers
  doc.setFillColor(...colors.lightBlue);
  doc.rect(col3X, tableY, col3Width, subHeaderHeight, 'F');
  doc.setDrawColor(...colors.borderGray);
  doc.rect(col3X, tableY, col3Width, subHeaderHeight);
  
  doc.setFontSize(6);
  doc.setTextColor(...colors.black);
  doc.setFont("courier", "normal");
  
  // Column widths for Deductions: Desc, Ben, Amt, YTD
  const db = {
    desc: col3Width * 0.35,
    ben: col3Width * 0.15,
    amt: col3Width * 0.25,
    ytd: col3Width * 0.25
  };
  
  xPos = col3X + 2;
  doc.text("Desc", xPos, tableY + 7);
  xPos += db.desc;
  doc.text("Ben", xPos, tableY + 7);
  xPos += db.ben;
  doc.text("Amt", xPos, tableY + 7);
  xPos += db.amt;
  doc.text("YTD", xPos, tableY + 7);
  
  tableY += subHeaderHeight;
  
  // Build deductions rows from data
  const dedRows = [];
  if (deductionsData && deductionsData.length > 0) {
    deductionsData.forEach(d => {
      const name = (d.name || d.type || "Deduction").substring(0, 10);
      dedRows.push([name, "", fmtCurrency(d.currentAmount || 0), fmtCurrency((d.currentAmount || 0) * ytdPayPeriods)]);
    });
  }
  if (contributionsData && contributionsData.length > 0) {
    contributionsData.forEach(c => {
      const name = (c.name || c.type || "Contrib").substring(0, 10);
      dedRows.push([name, "", fmtCurrency(c.currentAmount || 0), fmtCurrency((c.currentAmount || 0) * ytdPayPeriods)]);
    });
  }
  // Fill to 25 rows
  while (dedRows.length < 25) {
    dedRows.push(["", "", "", ""]);
  }
  
  doc.setFont("courier", "normal");
  doc.setFontSize(6);
  
  const deductionsStartY = tableY;
  dedRows.slice(0, 25).forEach((row) => {
    xPos = col3X + 2;
    doc.text(row[0], xPos, tableY + 6);
    xPos += db.desc;
    doc.text(row[1], xPos + db.ben - 3, tableY + 6, { align: 'right' });
    xPos += db.ben;
    doc.text(row[2], xPos + db.amt - 3, tableY + 6, { align: 'right' });
    xPos += db.amt;
    doc.text(row[3], xPos + db.ytd - 5, tableY + 6, { align: 'right' });
    
    tableY += rowHeight;
  });
  
  // Draw vertical column dividers for Deductions/Benefits (after Desc row, between columns)
  doc.setDrawColor(...colors.borderGray);
  doc.setLineWidth(0.5);
  const dbEndY = tableY;
  // Vertical line after Desc column
  doc.line(col3X + db.desc, deductionsStartY, col3X + db.desc, dbEndY);
  // Vertical line after Ben column
  doc.line(col3X + db.desc + db.ben, deductionsStartY, col3X + db.desc + db.ben, dbEndY);
  // Vertical line after Amt column
  doc.line(col3X + db.desc + db.ben + db.amt, deductionsStartY, col3X + db.desc + db.ben + db.amt, dbEndY);
  // Outer borders (left, right, bottom) - BLACK
  doc.setDrawColor(...colors.black);
  doc.line(col3X, deductionsStartY, col3X, dbEndY); // Left border
  doc.line(col3X + col3Width, deductionsStartY, col3X + col3Width, dbEndY); // Right border
  doc.line(col3X, dbEndY, col3X + col3Width, dbEndY); // Bottom border

  // ==================== TOTALS ROW ====================
  const totalsY = y + headerHeight + subHeaderHeight + (numRows * rowHeight);
  
  // Calculate YTD total tax
  const ytdTotalTax = (ytdCpp || 0) + (ytdEi || 0) + (ytdQpip || 0) + (ytdFederalTax || 0) + (ytdProvincialTax || 0);
  
  // Gross Wages Total - white background
  doc.setFillColor(...colors.white);
  doc.rect(col1X, totalsY, col1Width, rowHeight + 2, 'F');
  doc.setDrawColor(...colors.borderGray);
  doc.line(col1X, totalsY, col1X + col1Width, totalsY); // Gray top border
  // Black side and bottom borders
  doc.setDrawColor(...colors.black);
  doc.line(col1X, totalsY, col1X, totalsY + rowHeight + 2); // Left border
  doc.line(col1X + col1Width, totalsY, col1X + col1Width, totalsY + rowHeight + 2); // Right border
  doc.line(col1X, totalsY + rowHeight + 2, col1X + col1Width, totalsY + rowHeight + 2); // Bottom border
  doc.setFont("courier");
  doc.setFontSize(6);
  doc.setTextColor(...colors.black);
  doc.text("", col1X + 3, totalsY + 6);
  doc.text(fmtCurrency(grossPay), col1X + gw.desc + gw.hours + gw.rate + gw.amt - 3, totalsY + 6, { align: 'right' });
  doc.text(fmtCurrency(ytdGrossPay), col1X + col1Width - 5, totalsY + 6, { align: 'right' });
  
  // Withholding Total - white background
  doc.setFillColor(...colors.white);
  doc.rect(col2X, totalsY, col2Width, rowHeight + 2, 'F');
  doc.setDrawColor(...colors.borderGray);
  doc.line(col2X, totalsY, col2X + col2Width, totalsY); // Gray top border
  // Black side and bottom borders
  doc.setDrawColor(...colors.black);
  doc.line(col2X, totalsY, col2X, totalsY + rowHeight + 2); // Left border
  doc.line(col2X + col2Width, totalsY, col2X + col2Width, totalsY + rowHeight + 2); // Right border
  doc.line(col2X, totalsY + rowHeight + 2, col2X + col2Width, totalsY + rowHeight + 2); // Bottom border
  doc.text("", col2X + 3, totalsY + 6);
  doc.text(fmtCurrency(totalTax), col2X + wt.desc + wt.amt - 3, totalsY + 6, { align: 'right' });
  doc.text(fmtCurrency(ytdTotalTax), col2X + col2Width - 5, totalsY + 6, { align: 'right' });
  
  // Deductions Total - white background
  doc.setFillColor(...colors.white);
  doc.rect(col3X, totalsY, col3Width, rowHeight + 2, 'F');
  doc.setDrawColor(...colors.borderGray);
  doc.line(col3X, totalsY, col3X + col3Width, totalsY); // Gray top border
  // Black side and bottom borders
  doc.setDrawColor(...colors.black);
  doc.line(col3X, totalsY, col3X, totalsY + rowHeight + 2); // Left border
  doc.line(col3X + col3Width, totalsY, col3X + col3Width, totalsY + rowHeight + 2); // Right border
  doc.line(col3X, totalsY + rowHeight + 2, col3X + col3Width, totalsY + rowHeight + 2); // Bottom border
  doc.text("", col3X + 3, totalsY + 6);
  doc.text(fmtCurrency(totalDeductions + totalContributions), col3X + db.desc + db.ben + db.amt - 3, totalsY + 6, { align: 'right' });
  doc.text(fmtCurrency(ytdDeductions + ytdContributions), col3X + col3Width - 5, totalsY + 6, { align: 'right' });

  // ==================== FOOTER SECTION ====================
  const footerY = totalsY + rowHeight + 8;
  const footerHeight = 50;
  const footerColWidth = (pageWidth - 2 * m) / 4;
  
  // White footer background
  doc.setFillColor(...colors.white);
  doc.rect(m, footerY, pageWidth - 2 * m, footerHeight, 'F');
  
  // Footer column headers (blue bars)
  const footerHeaders = ["Accruals", "ACH", "Net Pay", "Company"];
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...colors.white);
  
  footerHeaders.forEach((header, i) => {
    const colX = m + i * footerColWidth;
    doc.setFillColor(...colors.blue);
    doc.rect(colX, footerY, footerColWidth, 12, 'F');
    doc.text(header, colX + footerColWidth/2, footerY + 8, { align: 'center' });
  });
  
  // Footer content
  const contentY = footerY + 15;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6);
  doc.setTextColor(...colors.black);
  
  // Accruals column
  const accrualsX = m + 3;
  doc.text("Sick: 0.00 used | 0.00 accr | 0.00 remn", accrualsX, contentY + 5);
  doc.text("PTO: 0.00 used | 0.00 accr | 0.00 remn", accrualsX, contentY + 13);
  
  // ACH column - empty or with bank info
  const achX = m + footerColWidth + 3;
  const bankLast4 = formData.bank || "0000";
  doc.text(`Direct Deposit****${bankLast4}`, achX, contentY + 5);
  doc.text(`$${fmtCurrency(netPay)}`, achX, contentY + 13);
  
  // Net Pay column
  const netPayX = m + 2 * footerColWidth + 3;
  doc.setFont("helvetica");
  doc.setFontSize(6);
  doc.text(`Net: $${fmtCurrency(netPay)}`, netPayX, contentY + 5);
  doc.setFontSize(6);
  doc.setFont("helvetica", "normal");
  doc.text(`Direct Deposit: $${fmtCurrency(netPay)}`, netPayX, contentY + 13);
  
  // Company column
  const companyX = m + 3 * footerColWidth + 3;
  doc.setFont("helvetica");
  doc.setFontSize(6);
  doc.text(formData.company || "Company Name", companyX, contentY + 5);
  doc.setFont("helvetica", "normal");
  doc.text(formData.companyAddress || "123 Company St", companyX, contentY + 13);
  doc.text(`${formData.companyCity || "City"}, ${formData.companyProvince || "ON"}`, companyX, contentY + 21);
  doc.text(formData.companyPostalCode || "A0A 0A0", companyX, contentY + 29);

  // Draw vertical dividers in footer content area
  doc.setDrawColor(100, 100, 100);
  doc.setLineWidth(0.3);
  for (let i = 1; i < 4; i++) {
    const divX = m + i * footerColWidth;
    doc.line(divX, footerY + 12, divX, footerY + footerHeight);
  }
}

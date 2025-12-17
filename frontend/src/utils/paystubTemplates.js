// Helper to load logo safely
async function loadImageAsBase64(url) {
  try {
    const r = await fetch(url);
    if (!r.ok) return null;
    const blob = await r.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

// Number formatter (adds commas)
function fmt(n) {
  return Number(n).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// Format filing status for display
function formatFilingStatus(status) {
  const statusMap = {
    'single': 'Single',
    'married_jointly': 'Married Filing Jointly',
    'married_separately': 'Married Filing Separately',
    'head_of_household': 'Head of Household'
  };
  return statusMap[status] || status;
}

// Format date as "Mar 10, 2025"
function formatDate(date) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const d = new Date(date);
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

// Template A: Gusto-Style Professional (matches artifact exactly)
export async function generateTemplateA(doc, data, pageWidth, pageHeight, margin) {
  const { formData, hours, overtime, regularPay, overtimePay, grossPay, ssTax, medTax, federalTax, stateTax, localTax, totalTax, netPay, rate, stateRate, localTaxRate, sutaRate, startDate, endDate, payDate, payFrequency, stubNum, totalStubs,
    ytdRegularPay, ytdOvertimePay, ytdGrossPay, ytdSsTax, ytdMedTax, ytdFederalTax, ytdStateTax, ytdLocalTax, ytdTotalTax, ytdNetPay, ytdHours,
    payType, workerType, isContractor, annualSalary,
    deductionsData, totalDeductions, contributionsData, totalContributions, ytdDeductions, ytdContributions
  } = data;
  
  const totalHours = Number(hours) + Number(overtime || 0);
  const overtimeRate = rate * 1.5;
  const left = margin;
  const usableWidth = pageWidth - 2 * margin;
  let y = 40;
  
  // Labels based on worker type
  const workerLabel = isContractor ? "Contractor" : "Employee";
  const hireLabel = isContractor ? "Start Date" : "Hire Date";
  const statementTitle = isContractor ? "Contractor Payment Statement" : "Earnings Statement";

  // ========== HEADER SECTION ==========
  const top = y;
  const logoX = left;
  const logoWidth = 70;

  // Load and draw logo
  try {
    const logoData = await loadImageAsBase64("/gustoLogo.png");
    if (logoData) {
      const img = new Image();
      img.src = logoData;
      await new Promise((resolve) => {
        img.onload = () => {
          const aspect = img.height / img.width || 0.4;
          doc.addImage(img, "PNG", logoX, top, logoWidth, logoWidth * aspect);
          resolve();
        };
        img.onerror = resolve;
      });
    } else {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(0, 168, 161);
      doc.text("Gusto", logoX, top + 20);
    }
  } catch {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(0, 168, 161);
    doc.text("Gusto", logoX, top + 20);
  }

  // Left column: earnings info
  let leftY = top + 60;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(0, 0, 0);
  doc.text(statementTitle, logoX, leftY);
  leftY += 30;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  doc.text(
    `Pay period: ${formatDate(startDate)} – ${formatDate(endDate)}   Pay Day: ${formatDate(payDate)}`,
    logoX,
    leftY
  );
  leftY += 12;
  // doc.text(`${hireLabel}: ${formData.hireDate || startDate.toLocaleDateString()}`, logoX, leftY);
  // leftY += 12;
  doc.text(`${formData.name || ''} (...******${formData.bank ? formData.bank.slice(-4) : '0000'})`, logoX, leftY);

  // Right: Company + Employee/Contractor boxes
  const boxTop = top + 30;
  const boxHeight = 70;
  const boxWidth = 130;
  const rightStartX = left + 270;

  doc.setFillColor(248, 248, 248);
  doc.rect(rightStartX, boxTop, boxWidth, boxHeight, "F");
  doc.rect(rightStartX + boxWidth + 10, boxTop, boxWidth, boxHeight, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);
  doc.text("Company", rightStartX + 8, boxTop + 14);
  doc.text(workerLabel, rightStartX + boxWidth + 18, boxTop + 14);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(0, 0, 0);
  doc.text(formData.company || "Company Name", rightStartX + 8, boxTop + 28);
  doc.text(formData.companyAddress || "", rightStartX + 8, boxTop + 40);
  doc.text(`${formData.companyCity || ""}, ${formData.companyState || ""} ${formData.companyZip || ""}`, rightStartX + 8, boxTop + 52);
  doc.text(formData.companyPhone || "", rightStartX + 8, boxTop + 64);
  doc.text(formData.name || "", rightStartX + boxWidth + 18, boxTop + 28);
  doc.text(isContractor ? `EIN/SSN: ***-**-${formData.ssn || "0000"}` : `XXX-XX-${formData.ssn || "0000"}`, rightStartX + boxWidth + 18, boxTop + 40);
  doc.text(formData.address || "", rightStartX + boxWidth + 18, boxTop + 52);
  doc.text(`${formData.city || ""}, ${formData.state || ""} ${formData.zip || ""}`, rightStartX + boxWidth + 18, boxTop + 64);

  y = Math.max(leftY, boxTop + boxHeight) + 20;

  // ========== FILING STATUS SECTION (Optional) ==========
  if (!isContractor && (formData.federalFilingStatus || parseInt(formData.stateAllowances) > 0)) {
    doc.setFillColor(248, 248, 248);
    doc.rect(left, y, usableWidth, 22, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    doc.text("Tax Withholding Info", left + 8, y + 8);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    let filingY = y + 17;
    let filingX = left + 8;
    if (formData.federalFilingStatus) {
      doc.text(`Federal: ${formatFilingStatus(formData.federalFilingStatus)}`, filingX, filingY);
      filingX += 140;
    }
    if (parseInt(formData.stateAllowances) > 0) {
      doc.text(`State Allowances: ${formData.stateAllowances}`, filingX, filingY);
    }
    y += 30;
  } else {
    y += 10;
  }

  // ========== EARNINGS SECTION ==========
  const earningsSectionTitle = isContractor ? "Contractor Gross Earnings" : "Employee Gross Earnings";
  sectionHeader(doc, earningsSectionTitle, left, y, usableWidth);
  y += 20;

  // Build earnings rows based on pay type
  const earningsRows = [
    ["Description", "Rate", "Hours", "Current", "Year-To-Date"],
  ];
  
  if (payType === "salary") {
    // For salary, show as fixed amount per period
    const periodsPerYear = payFrequency === "weekly" ? 52 : 26;
    earningsRows.push([
      "Salary | Per Period",
      `$${fmt(annualSalary)}/yr`,
      "-",
      `$${fmt(regularPay)}`,
      `$${fmt(ytdRegularPay)}`,
    ]);
  } else {
    // Hourly pay
    earningsRows.push([
      "Regular Hours | Hourly",
      `$${fmt(rate)}`,
      hours.toString(),
      `$${fmt(regularPay)}`,
      `$${fmt(ytdRegularPay)}`,
    ]);
  }

  if (Number(overtime) > 0 && payType === "hourly") {
    earningsRows.push([
      "Overtime Hours | 1.5x",
      `$${fmt(overtimeRate)}`,
      overtime.toString(),
      `$${fmt(overtimePay)}`,
      `$${fmt(ytdOvertimePay)}`,
    ]);
  }

  drawEarningsTableWithUnderline(doc, left, y, earningsRows, 16, usableWidth);
  y += 60;

  // ========== TAXES SECTION (Two Columns) - Only for Employees ==========
  if (!isContractor) {
    const taxGap = 10;
    const taxTableWidth = (usableWidth - taxGap) / 2;
    const taxLeftX = left;
    const taxRightX = left + taxTableWidth + taxGap;

    sectionHeader(doc, "Employee Taxes Withheld", taxLeftX, y, taxTableWidth);
    sectionHeader(doc, "Employer Tax", taxRightX, y, taxTableWidth);
    y += 18;

    // Employee tax rows - use actual rates
    const empTaxRows = [["Description", "Current", "YTD"]];
    const erTaxRows = [["Company Tax", "Current", "YTD"]];

    // Federal Income Tax with filing status indicator (no more allowances per 2020+ W-4)
    const fedStatusLabel = formData.federalFilingStatus 
      ? ` (${formData.federalFilingStatus === 'married_jointly' ? 'MFJ' : formData.federalFilingStatus === 'head_of_household' ? 'HOH' : 'S'})`
      : '';
    empTaxRows.push([`Federal Income Tax${fedStatusLabel}`, `$${fmt(federalTax || 0)}`, `$${fmt(ytdFederalTax || 0)}`]);
    erTaxRows.push(["Social Security (6.2%)", `$${fmt(grossPay * 0.062)}`, `$${fmt(ytdGrossPay * 0.062)}`]);

    empTaxRows.push(["Social Security (6.2%)", `$${fmt(ssTax)}`, `$${fmt(ytdSsTax)}`]);
    erTaxRows.push(["Medicare (1.45%)", `$${fmt(grossPay * 0.0145)}`, `$${fmt(ytdGrossPay * 0.0145)}`]);

    empTaxRows.push(["Medicare (1.45%)", `$${fmt(medTax)}`, `$${fmt(ytdMedTax)}`]);
    erTaxRows.push(["FUTA (0.6%)", `$${fmt(grossPay * 0.006)}`, `$${fmt(ytdGrossPay * 0.006)}`]);

    // State tax with allowances (only for states that use them)
    const stateRatePercent = stateRate ? (stateRate * 100).toFixed(2) : "5.00";
    const stateAllowLabel = parseInt(formData.stateAllowances) > 0 ? ` (${formData.stateAllowances} allow.)` : '';
    empTaxRows.push([`${formData.state?.toUpperCase() || "State"} Tax${stateAllowLabel}`, `$${fmt(stateTax)}`, `$${fmt(ytdStateTax)}`]);
    
    // SUTA with actual rate
    const actualSutaRate = sutaRate || 0.027;
    const sutaRatePercent = (actualSutaRate * 100).toFixed(2);
    erTaxRows.push([`${formData.state?.toUpperCase() || "State"} Unemp. (${sutaRatePercent}%)`, `$${fmt(grossPay * actualSutaRate)}`, `$${fmt(ytdGrossPay * actualSutaRate)}`]);

    // Local tax with actual rate
    if (formData.includeLocalTax && localTax > 0 && localTaxRate > 0) {
      const localRatePercent = (localTaxRate * 100).toFixed(2);
      const cityName = formData.city || "Local";
      empTaxRows.push([`${cityName} Tax (${localRatePercent}%)`, `$${fmt(localTax)}`, `$${fmt(ytdLocalTax)}`]);
    }

    const taxYStart = y;
    const empTaxHeight = drawTable(doc, taxLeftX, y, empTaxRows, 16, taxTableWidth, true, true, 0.60);
    const erTaxHeight = drawTable(doc, taxRightX, y, erTaxRows, 16, taxTableWidth, true, true, 0.60);
    y = taxYStart + Math.max(empTaxHeight, erTaxHeight) + 10;

    // ========== DEDUCTIONS SECTION ==========
    sectionHeader(doc, "Employee Deductions", left, y, usableWidth);
    y += 18;
    
    // Build deductions rows
    const deductionRows = [["Description", "Type", "Current", "Year-To-Date"]];
    if (deductionsData && deductionsData.length > 0) {
      deductionsData.forEach(d => {
        const typeLabel = d.isPercentage ? `${d.amount}% of Gross` : "Fixed";
        deductionRows.push([
          d.name || "Deduction",
          typeLabel,
          `$${fmt(d.currentAmount)}`,
          `$${fmt(d.currentAmount * (data.ytdPayPeriods || 1))}`
        ]);
      });
    } else {
      deductionRows.push(["None", "–", "$0.00", "$0.00"]);
    }
    
    drawTable(doc, left, y, deductionRows, 16, usableWidth, false, true);
    y += deductionRows.length * 16 + 10;

    // ========== CONTRIBUTIONS SECTION ==========
    sectionHeader(doc, "Employee Contributions", left, y, usableWidth);
    y += 18;
    
    // Build contributions rows
    const contributionRows = [["Description", "Type", "Current", "Year-To-Date"]];
    if (contributionsData && contributionsData.length > 0) {
      contributionsData.forEach(c => {
        const typeLabel = c.isPercentage ? `${c.amount}% of Gross` : "Fixed";
        contributionRows.push([
          c.name || "Contribution",
          typeLabel,
          `$${fmt(c.currentAmount)}`,
          `$${fmt(c.currentAmount * (data.ytdPayPeriods || 1))}`
        ]);
      });
    } else {
      contributionRows.push(["None", "–", "$0.00", "$0.00"]);
    }
    
    drawTable(doc, left, y, contributionRows, 16, usableWidth, false, true);
    y += contributionRows.length * 16 + 10;
  } else {
    // Contractor - No taxes withheld notice
    sectionHeader(doc, "Tax Information", left, y, usableWidth);
    y += 18;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(102, 102, 102);
    doc.text("No taxes withheld. As an independent contractor (1099), you are responsible for", left, y);
    y += 12;
    doc.text("paying self-employment taxes and any applicable federal/state income taxes.", left, y);
    y += 30;
  }

  // ========== SUMMARY SECTION ==========
  sectionHeader(doc, "Summary", left, y, usableWidth);
  y += 18;
  
  // Build summary rows based on worker type
  const summaryRows = [
    ["Description", "Current", "Year-To-Date"],
    ["Gross Earnings", `$${fmt(grossPay)}`, `$${fmt(ytdGrossPay)}`],
  ];
  
  if (!isContractor) {
    // Pre-Tax Deductions/Contributions (before taxes) - using deductionsData and contributionsData
    const totalPreTax = totalDeductions + totalContributions;
    const ytdPreTax = ytdDeductions + ytdContributions;
    
    // Always show Pre-Tax row
    summaryRows.push(["Pre-Tax Deductions/Contributions", `$${fmt(totalPreTax)}`, `$${fmt(ytdPreTax)}`]);
    
    // Taxes
    summaryRows.push(["Taxes", `$${fmt(totalTax)}`, `$${fmt(ytdTotalTax)}`]);
    
    // Post-Tax Deductions/Contributions (after taxes) - placeholder for now
    // Could be expanded later to support post-tax deductions like Roth 401k, garnishments, etc.
    summaryRows.push(["Post-Tax Deductions/Contributions", "$0.00", "$0.00"]);
    
    summaryRows.push(["Net Pay", `$${fmt(netPay)}`, `$${fmt(ytdNetPay)}`]);
    summaryRows.push(["Total Reimbursements", "$0.00", "$0.00"]);
    summaryRows.push(["Check Amount", `$${fmt(netPay)}`, `$${fmt(ytdNetPay)}`]);
  } else {
    summaryRows.push(["Taxes Withheld", "$0.00", "$0.00"]);
    summaryRows.push(["Total Payment", `$${fmt(grossPay)}`, `$${fmt(ytdGrossPay)}`]);
  }
  
  // Add hours for hourly pay type only
  if (payType === "hourly") {
    summaryRows.push(["Hours Worked", `${fmt(totalHours)}`, `${fmt(ytdHours)}`]);
  }
  
  drawTable(
    doc,
    left,
    y,
    summaryRows,
    16,
    usableWidth,
    true,
    true
  );

  // Footer
  // doc.setFontSize(8);
  // doc.setTextColor(153, 153, 153);
  // doc.text(`Statement ${stubNum + 1} of ${totalStubs}`, pageWidth / 2, pageHeight - 30, { align: 'center' });
}

// Helper functions
function sectionHeader(doc, text, x, y, width) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text(text, x, y);
  doc.setFillColor(0, 168, 161);
  doc.rect(x - 0.5, y + 3, width + 1, 1, "F");
}

function drawEarningsTableWithUnderline(doc, startX, startY, rows, rowHeight = 16, tableWidth = 500) {
  const colWidths = [
    tableWidth * 0.45,
    tableWidth * 0.13,
    tableWidth * 0.1,
    tableWidth * 0.14,
    tableWidth * 0.18,
  ];
  let y = startY;
  doc.setFontSize(9);
  doc.setDrawColor(200);
  doc.setLineWidth(0.3);

  rows.forEach((row, i) => {
    if (i === 0) {
      doc.setFont("helvetica", "bold");
      doc.setFillColor(255, 255, 255);
      doc.rect(startX, y - 11, tableWidth, rowHeight, "F");
    } else {
      const isGray = i % 2 === 1;
      if (isGray) {
        doc.setFillColor(245, 245, 245);
        doc.rect(startX, y - 11, tableWidth, rowHeight, "F");
      }
      doc.setFont("helvetica", "normal");
    }
    doc.setTextColor(0, 0, 0);
    let x = startX;
    row.forEach((cell, colIndex) => {
      if (colIndex === 0) {
        const textX = x + 4;
        const text = String(cell);
        doc.text(text, textX, y, { align: "left" });
        if (text.includes("Regular Hours")) {
          const underlineWidth = doc.getTextWidth("Regular Hours");
          doc.setDrawColor(0);
          doc.line(textX, y + 1, textX + underlineWidth, y + 1);
          doc.setDrawColor(200);
        }
      } else {
        doc.text(String(cell), x + colWidths[colIndex] - 4, y, { align: "right" });
      }
      if (colIndex > 0) doc.line(x, y - 11, x, y + rowHeight - 11);
      x += colWidths[colIndex];
    });
    y += rowHeight;
  });
  return rows.length * rowHeight;
}

function drawTable(
  doc,
  startX,
  startY,
  rows,
  rowHeight = 16,
  tableWidth = 500,
  underline = true,
  bottomBorder = false,
  descriptionWidth = 0.55 // 55% for description column by default
) {
  const numCols = rows[0].length;
  const colWidths = [tableWidth * descriptionWidth, ...Array(numCols - 1).fill(tableWidth * (1 - descriptionWidth) / (numCols - 1))];
  let y = startY;
  doc.setFontSize(9);
  doc.setDrawColor(200);
  doc.setLineWidth(0.3);

  rows.forEach((row, i) => {
    if (i === 0) {
      doc.setFont("helvetica", "bold");
      doc.setFillColor(255, 255, 255);
      doc.rect(startX, y - 11, tableWidth, rowHeight, "F");
    } else {
      const isGray = i % 2 === 1;
      if (isGray) {
        doc.setFillColor(245, 245, 245);
        doc.rect(startX, y - 11, tableWidth, rowHeight, "F");
      }
      doc.setFont("helvetica", "normal");
    }
    doc.setTextColor(0, 0, 0);
    let x = startX;
    row.forEach((cell, colIndex) => {
      const text = String(cell);
      if (colIndex === 0) {
        const textX = x + 4;
        doc.text(text, textX, y, { align: "left" });
        if (underline && i > 0 && text.toLowerCase() !== "description") {
          const underlineWidth = doc.getTextWidth(text);
          doc.setDrawColor(0);
          doc.line(textX, y + 1, textX + underlineWidth, y + 1);
          doc.setDrawColor(200);
        }
      } else {
        doc.text(text, x + colWidths[colIndex] - 4, y, { align: "right" });
      }
      if (colIndex > 0) doc.line(x, y - 11, x, y + rowHeight - 11);
      x += colWidths[colIndex];
    });
    y += rowHeight;
  });

  if (bottomBorder) {
    doc.setDrawColor(200);
    doc.setLineWidth(0.5);
    doc.line(startX, y - 11, startX + tableWidth, y - 11);
  }

  return rows.length * rowHeight;
}

// Template B: Modern Minimalist
export function generateTemplateB(doc, data, pageWidth, pageHeight, margin) {
  const { formData, hours, overtime, regularPay, overtimePay, grossPay, ssTax, medTax, federalTax, stateTax, localTax, totalTax, netPay, rate, startDate, endDate, payDate, payFrequency, stubNum, totalStubs, ytdFederalTax } = data;
  
  let y = 30;
  
  // Minimalist Header - No background
  doc.setFontSize(14);
  doc.setTextColor(100, 100, 100);
  doc.setFont(undefined, 'normal');
  doc.text(formData.company || "Company Name", margin, y);
  doc.setFontSize(8);
  doc.text(`${formData.companyAddress || ""} | ${formData.companyCity || ""}, ${formData.companyState || ""} | ${formData.companyPhone || ""}`, margin, y + 15);

  // Large Pay Stub Title - Bold and Centered
  y = 80;
  doc.setFontSize(36);
  doc.setTextColor(41, 128, 185);
  doc.setFont(undefined, 'bold');
  doc.text("PAYCHECK", pageWidth / 2, y, { align: 'center' });

  // Period on same line as title (smaller)
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.setFont(undefined, 'normal');
  doc.text(`${formatDate(startDate)} - ${formatDate(endDate)}`, pageWidth / 2, y + 20, { align: 'center' });

  // Two-column layout
  y = 130;
  const leftCol = margin;
  const rightCol = pageWidth / 2 + 20;

  // Left Column - Employee
  doc.setFontSize(9);
  doc.setTextColor(150, 150, 150);
  doc.text("EMPLOYEE", leftCol, y);
  y += 15;
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.setFont(undefined, 'bold');
  doc.text(formData.name || "", leftCol, y);
  y += 15;
  doc.setFont(undefined, 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text(`SSN: ****${formData.ssn || "0000"}`, leftCol, y);
  y += 12;
  doc.text(formData.address || "", leftCol, y);
  y += 12;
  doc.text(`${formData.city || ""}, ${formData.state || ""} ${formData.zip || ""}`, leftCol, y);
  
  // Filing Status (if provided)
  if (formData.federalFilingStatus || parseInt(formData.stateAllowances) > 0) {
    y += 15;
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    if (formData.federalFilingStatus) {
      doc.text(`Federal: ${formatFilingStatus(formData.federalFilingStatus)}`, leftCol, y);
    }
    if (parseInt(formData.stateAllowances) > 0) {
      y += 10;
      doc.text(`State Allowances: ${formData.stateAllowances}`, leftCol, y);
    }
  }

  // Right Column - Payment Info
  y = 130;
  doc.setFontSize(9);
  doc.setTextColor(150, 150, 150);
  doc.text("PAYMENT DATE", rightCol, y);
  y += 15;
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.setFont(undefined, 'bold');
  doc.text(formatDate(payDate), rightCol, y);
  y += 20;
  doc.setFont(undefined, 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text(`Frequency: ${payFrequency === 'biweekly' ? 'Bi-Weekly' : 'Weekly'}`, rightCol, y);

  // Earnings Table - Minimalist
  y = 240;
  doc.setFillColor(245, 245, 245);
  doc.rect(margin, y, pageWidth - 2 * margin, 25, 'F');
  y += 17;
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.setFont(undefined, 'bold');
  doc.text("DESCRIPTION", margin + 10, y);
  doc.text("HOURS", margin + 250, y);
  doc.text("RATE", margin + 340, y);
  doc.text("AMOUNT", pageWidth - margin - 10, y, { align: 'right' });

  y += 25;
  doc.setFont(undefined, 'normal');
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  doc.text("Regular Pay", margin + 10, y);
  doc.text(hours.toFixed(1), margin + 250, y);
  doc.text(`$${rate.toFixed(2)}`, margin + 340, y);
  doc.text(`$${regularPay.toFixed(2)}`, pageWidth - margin - 10, y, { align: 'right' });
  
  if (overtime > 0) {
    y += 18;
    doc.text("Overtime (1.5x)", margin + 10, y);
    doc.text(overtime.toFixed(1), margin + 250, y);
    doc.text(`$${(rate * 1.5).toFixed(2)}`, margin + 340, y);
    doc.text(`$${overtimePay.toFixed(2)}`, pageWidth - margin - 10, y, { align: 'right' });
  }

  y += 25;
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(1);
  doc.line(margin, y, pageWidth - margin, y);
  y += 18;
  doc.setFont(undefined, 'bold');
  doc.setFontSize(11);
  doc.text("Gross Pay", margin + 10, y);
  doc.text(`$${grossPay.toFixed(2)}`, pageWidth - margin - 10, y, { align: 'right' });

  // Deductions
  y += 30;
  doc.setFillColor(245, 245, 245);
  doc.rect(margin, y, pageWidth - 2 * margin, 25, 'F');
  y += 17;
  doc.setFontSize(10);
  doc.text("DEDUCTIONS", margin + 10, y);

  y += 25;
  doc.setFont(undefined, 'normal');
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  
  // Federal Income Tax with filing status
  const fedLabel = formData.federalFilingStatus 
    ? `Federal Tax (${formData.federalFilingStatus === 'married_jointly' ? 'MFJ' : formData.federalFilingStatus === 'single' ? 'S' : 'HOH'})`
    : "Federal Tax";
  doc.text(fedLabel, margin + 10, y);
  doc.text(`$${(federalTax || 0).toFixed(2)}`, pageWidth - margin - 10, y, { align: 'right' });
  y += 18;
  doc.text("Social Security", margin + 10, y);
  doc.text(`$${ssTax.toFixed(2)}`, pageWidth - margin - 10, y, { align: 'right' });
  y += 18;
  doc.text("Medicare", margin + 10, y);
  doc.text(`$${medTax.toFixed(2)}`, pageWidth - margin - 10, y, { align: 'right' });
  y += 18;
  
  // State Tax with allowances (only for states that use them)
  const stateLabel = parseInt(formData.stateAllowances) > 0
    ? `State Tax (${formData.stateAllowances} allow.)`
    : "State Tax";
  doc.text(stateLabel, margin + 10, y);
  doc.text(`$${stateTax.toFixed(2)}`, pageWidth - margin - 10, y, { align: 'right' });
  
  if (formData.includeLocalTax) {
    y += 18;
    doc.text("Local Tax", margin + 10, y);
    doc.text(`$${localTax.toFixed(2)}`, pageWidth - margin - 10, y, { align: 'right' });
  }

  y += 25;
  doc.setLineWidth(1);
  doc.line(margin, y, pageWidth - margin, y);
  y += 18;
  doc.setFont(undefined, 'bold');
  doc.setFontSize(11);
  doc.text("Total Deductions", margin + 10, y);
  doc.text(`$${totalTax.toFixed(2)}`, pageWidth - margin - 10, y, { align: 'right' });

  // NET PAY - Large and Bold
  y += 40;
  doc.setFillColor(41, 128, 185);
  doc.rect(margin, y - 10, pageWidth - 2 * margin, 60, 'F');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text("NET PAY", margin + 15, y + 10);
  doc.setFontSize(28);
  doc.setFont(undefined, 'bold');
  doc.text(`$${netPay.toFixed(2)}`, pageWidth - margin - 15, y + 15, { align: 'right' });

  // Bank Info
  y += 75;
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.setFont(undefined, 'normal');
  doc.text(`Deposited to ${formData.bankName || ""} ****${formData.bank || "0000"}`, pageWidth / 2, y, { align: 'center' });

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(`${stubNum + 1}/${totalStubs}`, pageWidth / 2, pageHeight - 30, { align: 'center' });
}

// Template C: Workday Style Professional Payslip
export async function generateTemplateC(doc, data, pageWidth, pageHeight, margin) {
  const { formData, hours, overtime, regularPay, overtimePay, grossPay, ssTax, medTax, federalTax, stateTax, localTax, localTaxRate, totalTax, netPay, rate, stateRate, startDate, endDate, payDate, payFrequency, stubNum, totalStubs,
    ytdRegularPay, ytdOvertimePay, ytdGrossPay, ytdSsTax, ytdMedTax, ytdFederalTax, ytdStateTax, ytdLocalTax, ytdTotalTax, ytdNetPay,
    deductionsData, totalDeductions, contributionsData, totalContributions, ytdDeductions, ytdContributions, ytdPayPeriods,
    logoDataUrl
  } = data;
  
  const m = 30; // Tighter margin for single page
  const usableWidth = pageWidth - 2 * m;
  let y = 25;
  
  // ========== HEADER - Company Logo or Name ==========
  if (logoDataUrl) {
    try {
      // Add logo image (max height 40px to fit header)
      const logoHeight = 35;
      const logoWidth = 120; // Approximate width, will scale proportionally
      doc.addImage(logoDataUrl, 'PNG', m, y - 10, logoWidth, logoHeight);
      y += 30;
    } catch (e) {
      // Fallback to text if logo fails
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "bold");
      doc.text(formData.company || "Company Name", m, y);
      y += 12;
    }
  } else {
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.text(formData.company || "Company Name", m, y);
    y += 12;
  }
  
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(60, 60, 60);
  doc.text(`${formData.companyAddress || ""}, ${formData.companyCity || ""}, ${formData.companyState || ""} ${formData.companyZip || ""}`, m, y);
  y += 10;
  doc.text(formData.companyPhone || "", m, y);
  
  // Employee name and address (right side of header)
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  doc.text(formData.name || "", pageWidth - m - 150, 25);
  doc.setFontSize(8);
  doc.setTextColor(60, 60, 60);
  doc.text(formData.address || "", pageWidth - m - 150, 37);
  doc.text(`${formData.city || ""}, ${formData.state || ""} ${formData.zip || ""}`, pageWidth - m - 150, 47);
  
  // ========== EMPLOYEE INFO ROW ==========
  y += 15;
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.5);
  doc.line(m, y, pageWidth - m, y);
  y += 12;
  
  doc.setFontSize(7);
  doc.setTextColor(100, 100, 100);
  const infoLabels = ["Name", "Company", "Employee ID", "Pay Period Begin", "Pay Period End", "Check Date"];
  const infoValues = [
    formData.name || "",
    formData.company || "",
    formData.employeeId || "",
    formatDate(startDate),
    formatDate(endDate),
    formatDate(payDate)
  ];
  const colWidth = usableWidth / 6;
  
  infoLabels.forEach((label, i) => {
    doc.setFont("helvetica", "bold");
    doc.text(label, m + i * colWidth, y);
    doc.setFont("helvetica", "normal");
    doc.text(infoValues[i], m + i * colWidth, y + 10);
  });
  
  y += 25;
  doc.line(m, y, pageWidth - m, y);
  
  // ========== SUMMARY TABLE ==========
  y += 8;
  doc.setFillColor(240, 240, 240);
  doc.rect(m, y, usableWidth, 14, 'F');
  
  const sumCols = ["", "Hours Worked", "Gross Pay", "Pre Tax Ded.", "Employee Taxes", "Post Tax Ded.", "Net Pay"];
  const sumColW = usableWidth / 7;
  
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(60, 60, 60);
  sumCols.forEach((col, i) => {
    doc.text(col, m + i * sumColW + 3, y + 10);
  });
  
  y += 14;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);
  
  // Current row
  const currentRow = ["Current", hours.toFixed(2), fmt(grossPay), fmt(totalDeductions), fmt(totalTax), "0.00", fmt(netPay)];
  currentRow.forEach((val, i) => {
    doc.text(val, m + i * sumColW + 3, y + 10);
  });
  
  y += 12;
  // YTD row
  const ytdRow = ["YTD", (hours * (ytdPayPeriods || 1)).toFixed(2), fmt(ytdGrossPay || grossPay), fmt(ytdDeductions || totalDeductions), fmt(ytdTotalTax || totalTax), "0.00", fmt(ytdNetPay || netPay)];
  ytdRow.forEach((val, i) => {
    doc.text(val, m + i * sumColW + 3, y + 10);
  });
  
  y += 18;
  doc.setLineWidth(0.3);
  doc.line(m, y, pageWidth - m, y);
  
  // ========== EARNING SECTION ==========
  y += 8;
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text("Earning", m, y);
  
  y += 10;
  doc.setFillColor(245, 245, 245);
  doc.rect(m, y, usableWidth, 12, 'F');
  
  const earnCols = ["Description", "Dates", "Hours", "Rate", "Amount", "YTD"];
  const earnColW = [usableWidth * 0.25, usableWidth * 0.22, usableWidth * 0.1, usableWidth * 0.12, usableWidth * 0.15, usableWidth * 0.16];
  let earnX = m;
  
  doc.setFontSize(7);
  doc.setTextColor(80, 80, 80);
  earnCols.forEach((col, i) => {
    doc.text(col, earnX + 2, y + 9);
    earnX += earnColW[i];
  });
  
  y += 12;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);
  
  // Regular earning row
  earnX = m;
  const earnRow = [
    "Regular Earning HRLY",
    `${formatDate(startDate)} - ${formatDate(endDate)}`,
    hours.toFixed(2),
    fmt(rate),
    fmt(regularPay),
    fmt(ytdRegularPay || regularPay)
  ];
  earnRow.forEach((val, i) => {
    doc.text(val, earnX + 2, y + 8);
    earnX += earnColW[i];
  });
  
  y += 12;
  if (overtime > 0) {
    earnX = m;
    const otRow = ["Overtime HRLY (1.5x)", `${formatDate(startDate)} - ${formatDate(endDate)}`, overtime.toFixed(2), fmt(rate * 1.5), fmt(overtimePay), fmt(ytdOvertimePay || overtimePay)];
    otRow.forEach((val, i) => {
      doc.text(val, earnX + 2, y + 8);
      earnX += earnColW[i];
    });
    y += 12;
  }
  
  // Earning total
  doc.setFont("helvetica", "bold");
  doc.text("Earning", m + 2, y + 8);
  doc.text(fmt(grossPay), m + earnColW[0] + earnColW[1] + earnColW[2] + earnColW[3] + 2, y + 8);
  doc.text(fmt(ytdGrossPay || grossPay), m + earnColW[0] + earnColW[1] + earnColW[2] + earnColW[3] + earnColW[4] + 2, y + 8);
  
  y += 15;
  doc.setLineWidth(0.3);
  doc.line(m, y, pageWidth - m, y);
  
  // ========== EMPLOYEE TAXES SECTION ==========
  y += 8;
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("Employee Taxes", m, y);
  
  y += 10;
  doc.setFillColor(245, 245, 245);
  doc.rect(m, y, usableWidth, 12, 'F');
  
  const taxCols = ["Description", "Amount", "YTD"];
  const taxColW = [usableWidth * 0.6, usableWidth * 0.2, usableWidth * 0.2];
  let taxX = m;
  
  doc.setFontSize(7);
  doc.setTextColor(80, 80, 80);
  taxCols.forEach((col, i) => {
    doc.text(col, taxX + 2, y + 9);
    taxX += taxColW[i];
  });
  
  y += 12;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);
  
  // Tax rows
  const taxRows = [
    ["OASDI (Social Security)", fmt(ssTax), fmt(ytdSsTax || ssTax)],
    ["Medicare", fmt(medTax), fmt(ytdMedTax || medTax)],
    [`Federal Withholding${formData.federalFilingStatus ? ` (${formData.federalFilingStatus === 'married_jointly' ? 'MFJ' : formData.federalFilingStatus === 'head_of_household' ? 'HOH' : 'S'})` : ''}`, fmt(federalTax || 0), fmt(ytdFederalTax || federalTax || 0)],
    [`State Tax - ${formData.state || 'ST'}${parseInt(formData.stateAllowances) > 0 ? ` (${formData.stateAllowances} allow.)` : ''}`, fmt(stateTax), fmt(ytdStateTax || stateTax)]
  ];
  
  // Add local tax if applicable
  if (formData.includeLocalTax && localTax > 0) {
    const localRatePercent = localTaxRate ? (localTaxRate * 100).toFixed(2) : "1.00";
    taxRows.push([`City Tax - ${formData.city || 'Local'} (${localRatePercent}%)`, fmt(localTax), fmt(ytdLocalTax || localTax)]);
  }
  
  taxRows.forEach(row => {
    taxX = m;
    row.forEach((val, i) => {
      doc.text(val, taxX + 2, y + 8);
      taxX += taxColW[i];
    });
    y += 10;
  });
  
  // Tax total
  doc.setFont("helvetica", "bold");
  taxX = m;
  ["Employee Taxes", fmt(totalTax), fmt(ytdTotalTax || totalTax)].forEach((val, i) => {
    doc.text(val, taxX + 2, y + 8);
    taxX += taxColW[i];
  });
  
  y += 15;
  doc.setLineWidth(0.3);
  doc.line(m, y, pageWidth - m, y);
  
  // ========== PRE TAX DEDUCTIONS (if any) ==========
  if (deductionsData && deductionsData.length > 0) {
    y += 8;
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("Pre Tax Deductions", m, y);
    
    y += 10;
    doc.setFillColor(245, 245, 245);
    doc.rect(m, y, usableWidth, 12, 'F');
    
    taxX = m;
    doc.setFontSize(7);
    doc.setTextColor(80, 80, 80);
    taxCols.forEach((col, i) => {
      doc.text(col, taxX + 2, y + 9);
      taxX += taxColW[i];
    });
    
    y += 12;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);
    
    deductionsData.forEach(d => {
      taxX = m;
      [d.name || "Deduction", fmt(d.currentAmount), fmt(d.currentAmount * (ytdPayPeriods || 1))].forEach((val, i) => {
        doc.text(val, taxX + 2, y + 8);
        taxX += taxColW[i];
      });
      y += 10;
    });
    
    doc.setFont("helvetica", "bold");
    taxX = m;
    ["Pre Tax Deductions", fmt(totalDeductions), fmt(ytdDeductions || totalDeductions)].forEach((val, i) => {
      doc.text(val, taxX + 2, y + 8);
      taxX += taxColW[i];
    });
    
    y += 15;
    doc.line(m, y, pageWidth - m, y);
  }
  
  // ========== EMPLOYER PAID BENEFITS (Contributions) ==========
  if (contributionsData && contributionsData.length > 0) {
    y += 8;
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("Employer Paid Benefits", m, y);
    
    y += 10;
    doc.setFillColor(245, 245, 245);
    doc.rect(m, y, usableWidth, 12, 'F');
    
    taxX = m;
    doc.setFontSize(7);
    doc.setTextColor(80, 80, 80);
    taxCols.forEach((col, i) => {
      doc.text(col, taxX + 2, y + 9);
      taxX += taxColW[i];
    });
    
    y += 12;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);
    
    contributionsData.forEach(c => {
      taxX = m;
      [c.name || "Contribution", fmt(c.currentAmount), fmt(c.currentAmount * (ytdPayPeriods || 1))].forEach((val, i) => {
        doc.text(val, taxX + 2, y + 8);
        taxX += taxColW[i];
      });
      y += 10;
    });
    
    doc.setFont("helvetica", "bold");
    taxX = m;
    ["Employer Paid Benefits", fmt(totalContributions), fmt(ytdContributions || totalContributions)].forEach((val, i) => {
      doc.text(val, taxX + 2, y + 8);
      taxX += taxColW[i];
    });
    
    y += 15;
    doc.line(m, y, pageWidth - m, y);
  }
  
  // ========== FILING STATUS INFO ==========
  y += 10;
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 80);
  
  const halfW = usableWidth / 2;
  doc.setFont("helvetica", "bold");
  doc.text("Federal", m + halfW * 0.3, y);
  doc.text("State", m + halfW * 0.7, y);
  
  y += 12;
  doc.setFont("helvetica", "normal");
  doc.text("Marital Status", m, y);
  const fedStatus = formData.federalFilingStatus 
    ? (formData.federalFilingStatus === 'married_jointly' ? 'Married filing jointly' : formData.federalFilingStatus === 'head_of_household' ? 'Head of household' : 'Single or Married filing separately')
    : 'Single';
  doc.text(fedStatus, m + halfW * 0.2, y);
  
  y += 10;
  doc.text("Allowances", m, y);
  doc.text("0", m + halfW * 0.35, y);
  doc.text(formData.stateAllowances || "0", m + halfW * 0.75, y);
  
  y += 15;
  doc.setLineWidth(0.3);
  doc.line(m, y, pageWidth - m, y);
  
  // ========== PAYMENT INFO ==========
  y += 8;
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("Payment Information", m, y);
  
  y += 10;
  doc.setFillColor(245, 245, 245);
  doc.rect(m, y, usableWidth, 12, 'F');
  
  const payCols = ["Bank", "Account Name", "Account Number", "USD Amount"];
  const payColW = [usableWidth * 0.2, usableWidth * 0.3, usableWidth * 0.25, usableWidth * 0.25];
  let payX = m;
  
  doc.setFontSize(7);
  doc.setTextColor(80, 80, 80);
  payCols.forEach((col, i) => {
    doc.text(col, payX + 2, y + 9);
    payX += payColW[i];
  });
  
  y += 12;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);
  
  payX = m;
  const payRow = [
    formData.bankName || "Bank",
    `${formData.bankName || "Account"} ******${formData.bank || "0000"}`,
    `******${formData.bank || "0000"}`,
    `${fmt(netPay)} USD`
  ];
  payRow.forEach((val, i) => {
    doc.text(val, payX + 2, y + 8);
    payX += payColW[i];
  });
  
  // ========== FOOTER ==========
  doc.setFontSize(7);
  doc.setTextColor(120, 120, 120);
  doc.text(`Page ${stubNum + 1} of ${totalStubs}`, pageWidth / 2, pageHeight - 20, { align: 'center' });
}

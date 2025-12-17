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
    `Pay period: ${startDate.toLocaleDateString()} – ${endDate.toLocaleDateString()}   Pay Day: ${payDate.toLocaleDateString()}`,
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
  if (!isContractor && (formData.federalFilingStatus || formData.stateFilingStatus)) {
    doc.setFillColor(248, 248, 248);
    doc.rect(left, y, usableWidth, 22, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    doc.text("Filing Status", left + 8, y + 8);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    let filingY = y + 17;
    let filingX = left + 8;
    if (formData.federalFilingStatus) {
      doc.text(`Federal: ${formatFilingStatus(formData.federalFilingStatus)}`, filingX, filingY);
      filingX += 140;
    }
    if (formData.stateFilingStatus) {
      doc.text(`State: ${formatFilingStatus(formData.stateFilingStatus)}`, filingX, filingY);
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

    // Federal Income Tax with filing status indicator
    const fedStatusLabel = formData.federalFilingStatus 
      ? ` (${formData.federalFilingStatus === 'married_jointly' ? 'MFJ' : formData.federalFilingStatus === 'married_separately' ? 'MFS' : formData.federalFilingStatus === 'head_of_household' ? 'HOH' : 'S'}${formData.federalExemptions > 0 ? `-${formData.federalExemptions}` : ''})`
      : '';
    empTaxRows.push([`Federal Income Tax${fedStatusLabel}`, `$${fmt(federalTax || 0)}`, `$${fmt(ytdFederalTax || 0)}`]);
    erTaxRows.push(["Social Security (6.2%)", `$${fmt(grossPay * 0.062)}`, `$${fmt(ytdGrossPay * 0.062)}`]);

    empTaxRows.push(["Social Security (6.2%)", `$${fmt(ssTax)}`, `$${fmt(ytdSsTax)}`]);
    erTaxRows.push(["Medicare (1.45%)", `$${fmt(grossPay * 0.0145)}`, `$${fmt(ytdGrossPay * 0.0145)}`]);

    empTaxRows.push(["Medicare (1.45%)", `$${fmt(medTax)}`, `$${fmt(ytdMedTax)}`]);
    erTaxRows.push(["FUTA (0.6%)", `$${fmt(grossPay * 0.006)}`, `$${fmt(ytdGrossPay * 0.006)}`]);

    // State tax with actual rate and filing status
    const stateRatePercent = stateRate ? (stateRate * 100).toFixed(2) : "5.00";
    const stateStatusLabel = formData.stateFilingStatus
      ? ` (${formData.stateFilingStatus === 'married_jointly' ? 'MFJ' : formData.stateFilingStatus === 'married_separately' ? 'MFS' : formData.stateFilingStatus === 'head_of_household' ? 'HOH' : 'S'}${formData.stateExemptions > 0 ? `-${formData.stateExemptions}` : ''})`
      : '';
    empTaxRows.push([`${formData.state?.toUpperCase() || "State"} Tax${stateStatusLabel}`, `$${fmt(stateTax)}`, `$${fmt(ytdStateTax)}`]);
    
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
    const empTaxHeight = drawTable(doc, taxLeftX, y, empTaxRows, 16, taxTableWidth, true, true);
    const erTaxHeight = drawTable(doc, taxRightX, y, erTaxRows, 16, taxTableWidth, true, true);
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
  bottomBorder = false
) {
  const numCols = rows[0].length;
  const colWidths = [tableWidth * 0.4, ...Array(numCols - 1).fill(tableWidth * 0.6 / (numCols - 1))];
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
  doc.text(`${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`, pageWidth / 2, y + 20, { align: 'center' });

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
  if (formData.federalFilingStatus || formData.stateFilingStatus) {
    y += 15;
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    if (formData.federalFilingStatus) {
      doc.text(`Federal: ${formatFilingStatus(formData.federalFilingStatus)}`, leftCol, y);
    }
    if (formData.stateFilingStatus) {
      y += 10;
      doc.text(`State: ${formatFilingStatus(formData.stateFilingStatus)}`, leftCol, y);
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
  doc.text(payDate.toLocaleDateString(), rightCol, y);
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
  
  // State Tax with filing status
  const stateLabel = formData.stateFilingStatus 
    ? `State Tax (${formData.stateFilingStatus === 'married_jointly' ? 'MFJ' : formData.stateFilingStatus === 'single' ? 'S' : 'HOH'})`
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

// Template C: Detailed Corporate
export function generateTemplateC(doc, data, pageWidth, pageHeight, margin) {
  const { formData, hours, overtime, regularPay, overtimePay, grossPay, ssTax, medTax, stateTax, localTax, totalTax, netPay, rate, startDate, endDate, payDate, payFrequency, stubNum, totalStubs } = data;
  
  let y = 40;
  
  // Corporate Header with Border
  doc.setDrawColor(142, 68, 173);
  doc.setLineWidth(3);
  doc.line(margin, y, pageWidth - margin, y);
  
  y += 20;
  doc.setFontSize(24);
  doc.setTextColor(142, 68, 173);
  doc.setFont(undefined, 'bold');
  doc.text(formData.company || "Company Name", margin, y);
  
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.setFont(undefined, 'normal');
  y += 15;
  doc.text(formData.companyAddress || "", margin, y);
  y += 12;
  doc.text(`${formData.companyCity || ""}, ${formData.companyState || ""} ${formData.companyZip || ""}`, margin, y);
  y += 12;
  doc.text(`Tel: ${formData.companyPhone || ""}`, margin, y);

  // Document Title Box
  y += 30;
  doc.setFillColor(155, 89, 182);
  doc.rect(margin, y, pageWidth - 2 * margin, 40, 'F');
  y += 27;
  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.setFont(undefined, 'bold');
  doc.text("EARNINGS STATEMENT", pageWidth / 2, y, { align: 'center' });

  // Info Grid
  y += 40;
  const boxWidth = (pageWidth - 2 * margin - 20) / 2;
  const boxHeight = 80;
  
  // Employee Box (Left)
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(1);
  doc.rect(margin, y, boxWidth, boxHeight, 'S');
  doc.setFillColor(250, 250, 250);
  doc.rect(margin, y, boxWidth, 20, 'F');
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.setFont(undefined, 'bold');
  doc.text("EMPLOYEE DETAILS", margin + 5, y + 13);
  
  y += 30;
  doc.setFont(undefined, 'normal');
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text(`Name: ${formData.name || ""}`, margin + 5, y);
  y += 15;
  doc.setFontSize(9);
  doc.text(`SSN: ***-**-${formData.ssn || "0000"}`, margin + 5, y);
  y += 12;
  doc.text(`${formData.address || ""}`, margin + 5, y);
  y += 12;
  doc.text(`${formData.city || ""}, ${formData.state || ""} ${formData.zip || ""}`, margin + 5, y);
  // Filing Status (if provided)
  if (formData.federalFilingStatus || formData.stateFilingStatus) {
    y += 12;
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    let filingText = "";
    if (formData.federalFilingStatus) {
      filingText += `Fed: ${formatFilingStatus(formData.federalFilingStatus)}`;
    }
    if (formData.stateFilingStatus) {
      if (filingText) filingText += " | ";
      filingText += `State: ${formatFilingStatus(formData.stateFilingStatus)}`;
    }
    doc.text(filingText, margin + 5, y);
  }

  // Pay Period Box (Right)
  y = y - 54;
  const rightBoxX = margin + boxWidth + 20;
  doc.rect(rightBoxX, y - 15, boxWidth, boxHeight, 'S');
  doc.setFillColor(250, 250, 250);
  doc.rect(rightBoxX, y - 15, boxWidth, 20, 'F');
  doc.setFont(undefined, 'bold');
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text("PAY PERIOD", rightBoxX + 5, y - 2);
  
  y += 15;
  doc.setFont(undefined, 'normal');
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text(`Period Start: ${startDate.toLocaleDateString()}`, rightBoxX + 5, y);
  y += 15;
  doc.text(`Period End: ${endDate.toLocaleDateString()}`, rightBoxX + 5, y);
  y += 15;
  doc.text(`Pay Date: ${payDate.toLocaleDateString()}`, rightBoxX + 5, y);
  y += 12;
  doc.setFontSize(9);
  doc.text(`Frequency: ${payFrequency === 'biweekly' ? 'Bi-Weekly' : 'Weekly'}`, rightBoxX + 5, y);

  // Earnings Table
  y += 40;
  const tableY = y;
  doc.setFillColor(245, 242, 248);
  doc.rect(margin, y, pageWidth - 2 * margin, 20, 'F');
  doc.setDrawColor(142, 68, 173);
  doc.setLineWidth(1);
  doc.rect(margin, y, pageWidth - 2 * margin, 20, 'S');
  
  y += 14;
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.setFont(undefined, 'bold');
  doc.text("EARNINGS", margin + 5, y);
  doc.text("HOURS", margin + 220, y);
  doc.text("RATE", margin + 300, y);
  doc.text("AMOUNT", pageWidth - margin - 5, y, { align: 'right' });

  y += 20;
  doc.setLineWidth(0.5);
  doc.setDrawColor(200, 200, 200);
  doc.rect(margin, tableY, pageWidth - 2 * margin, overtime > 0 ? 60 : 40, 'S');
  
  doc.setFont(undefined, 'normal');
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text("Regular Pay", margin + 5, y);
  doc.text(hours.toFixed(2), margin + 220, y);
  doc.text(`$${rate.toFixed(2)}/hr`, margin + 300, y);
  doc.text(`$${regularPay.toFixed(2)}`, pageWidth - margin - 5, y, { align: 'right' });
  
  if (overtime > 0) {
    y += 20;
    doc.text("Overtime Pay (1.5x)", margin + 5, y);
    doc.text(overtime.toFixed(2), margin + 220, y);
    doc.text(`$${(rate * 1.5).toFixed(2)}/hr`, margin + 300, y);
    doc.text(`$${overtimePay.toFixed(2)}`, pageWidth - margin - 5, y, { align: 'right' });
  }

  y += 20;
  doc.setFillColor(250, 250, 250);
  doc.rect(margin, y - 5, pageWidth - 2 * margin, 20, 'F');
  doc.setFont(undefined, 'bold');
  doc.text("GROSS PAY", margin + 5, y + 8);
  doc.text(`$${grossPay.toFixed(2)}`, pageWidth - margin - 5, y + 8, { align: 'right' });

  // Deductions Table
  y += 35;
  const deductY = y;
  doc.setFillColor(245, 242, 248);
  doc.rect(margin, y, pageWidth - 2 * margin, 20, 'F');
  doc.setDrawColor(142, 68, 173);
  doc.setLineWidth(1);
  doc.rect(margin, y, pageWidth - 2 * margin, 20, 'S');
  
  y += 14;
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.text("DEDUCTIONS", margin + 5, y);
  doc.text("RATE", margin + 300, y);
  doc.text("AMOUNT", pageWidth - margin - 5, y, { align: 'right' });

  y += 20;
  const deductHeight = formData.includeLocalTax ? 80 : 60;
  doc.setLineWidth(0.5);
  doc.setDrawColor(200, 200, 200);
  doc.rect(margin, deductY, pageWidth - 2 * margin, deductHeight + 20, 'S');
  
  doc.setFont(undefined, 'normal');
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text("Social Security", margin + 5, y);
  doc.text("6.2%", margin + 300, y);
  doc.text(`$${ssTax.toFixed(2)}`, pageWidth - margin - 5, y, { align: 'right' });
  y += 15;
  doc.text("Medicare", margin + 5, y);
  doc.text("1.45%", margin + 300, y);
  doc.text(`$${medTax.toFixed(2)}`, pageWidth - margin - 5, y, { align: 'right' });
  y += 15;
  doc.text("State Tax", margin + 5, y);
  doc.text(`${(data.stateRate * 100).toFixed(2)}%`, margin + 300, y);
  doc.text(`$${stateTax.toFixed(2)}`, pageWidth - margin - 5, y, { align: 'right' });
  
  if (formData.includeLocalTax) {
    y += 15;
    doc.text("Local Tax", margin + 5, y);
    doc.text("1.0%", margin + 300, y);
    doc.text(`$${localTax.toFixed(2)}`, pageWidth - margin - 5, y, { align: 'right' });
  }

  y += 20;
  doc.setFillColor(250, 250, 250);
  doc.rect(margin, y - 5, pageWidth - 2 * margin, 20, 'F');
  doc.setFont(undefined, 'bold');
  doc.setTextColor(220, 53, 69);
  doc.text("TOTAL DEDUCTIONS", margin + 5, y + 8);
  doc.text(`$${totalTax.toFixed(2)}`, pageWidth - margin - 5, y + 8, { align: 'right' });

  // NET PAY - Purple Box
  y += 40;
  doc.setFillColor(142, 68, 173);
  doc.rect(margin, y - 10, pageWidth - 2 * margin, 50, 'F');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.setFont(undefined, 'bold');
  doc.text("NET PAY (TAKE HOME)", margin + 10, y + 10);
  doc.setFontSize(24);
  doc.text(`$${netPay.toFixed(2)}`, pageWidth - margin - 10, y + 12, { align: 'right' });

  // Bank Info
  y += 60;
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.setFont(undefined, 'normal');
  doc.text(`Payment Method: Direct Deposit | ${formData.bankName || ""} | Account ending in ${formData.bank || "0000"}`, margin, y);

  // Footer with border
  doc.setDrawColor(142, 68, 173);
  doc.setLineWidth(2);
  doc.line(margin, pageHeight - 40, pageWidth - margin, pageHeight - 40);
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text(`Statement ${stubNum + 1} of ${totalStubs}`, pageWidth / 2, pageHeight - 25, { align: 'center' });
}

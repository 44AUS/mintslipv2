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
    deductionsData, totalDeductions, contributionsData, totalContributions, ytdDeductions, ytdContributions,
    logoDataUrl
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

  // Load and draw logo - use custom logo if provided, otherwise default Gusto logo
  if (logoDataUrl) {
    try {
      doc.addImage(logoDataUrl, 'PNG', logoX, top, 120, 35);
    } catch (e) {
      // Fallback to Gusto text if custom logo fails
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(0, 168, 161);
      doc.text("Gusto", logoX, top + 20);
    }
  } else {
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

// Template B: ADP-Style Earnings Statement with Background Image
export async function generateTemplateB(doc, data, pageWidth, pageHeight, margin) {
  const { 
    formData, hours, overtime, regularPay, overtimePay, grossPay, 
    ssTax, medTax, federalTax, stateTax, localTax, totalTax, netPay, rate, 
    startDate, endDate, payDate, payFrequency, stubNum, totalStubs,
    ytdGrossPay = grossPay, ytdSsTax = ssTax, ytdMedTax = medTax, 
    ytdFederalTax = federalTax, ytdStateTax = stateTax, ytdLocalTax = localTax,
    ytdRegularPay = regularPay, ytdOvertimePay = overtimePay,
    deductionsData = [], totalDeductions = 0, contributionsData = [], totalContributions = 0,
    ytdDeductions = 0, ytdContributions = 0,
    logoDataUrl
  } = data;
  
  // Load the ADP template background image
  let bgImageLoaded = false;
  try {
    const bgImage = await loadImageAsBase64("/adp-template-bg.png");
    if (bgImage) {
      // Add background image to fill the entire page
      doc.addImage(bgImage, 'PNG', 0, 0, pageWidth, pageHeight);
      bgImageLoaded = true;
    }
  } catch (e) {
    console.log("Could not load ADP background template, using fallback");
  }
  
  const m = 25; // margin
  const leftWidth = 310; // Left section width
  const rightStart = 340; // Right section start
  const rightWidth = pageWidth - rightStart - m;
  
  // Helper function to format date as MM/DD/YYYY
  const formatDateADP = (date) => {
    const d = new Date(date);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${mm}/${dd}/${yyyy}`;
  };
  
  // Helper to format currency
  const fmtCurrency = (n) => {
    return Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };
  
  // Generate random-looking company code
  const companyCode = `RJ/${formData.company ? formData.company.substring(0, 3).toUpperCase() : 'XXX'} ${Math.floor(10000000 + Math.random() * 90000000)}`;
  const locDept = String(Math.floor(10 + Math.random() * 90)).padStart(3, '0');
  const docNumber = String(Math.floor(1000000 + Math.random() * 9000000));
  
  // ========== TOP HEADER ROW ==========
  let y = 25;
  doc.setFontSize(7);
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");
  
  // Company Code, Loc/Dept, Number, Page
  doc.text("Company Code", m, y);
  doc.text("Loc/Dept", m + 90, y);
  doc.text("Number", m + 130, y);
  doc.text("Page", m + 175, y);
  y += 10;
  doc.setFont("helvetica", "bold");
  doc.text(companyCode, m, y);
  doc.text(locDept, m + 90, y);
  doc.text(docNumber, m + 130, y);
  doc.text(`1 of 1`, m + 175, y);
  
  // Company name and address below
  y += 10;
  doc.setFont("helvetica", "normal");
  doc.text(formData.company || "Company Name", m, y);
  y += 9;
  doc.text(formData.companyAddress || "", m, y);
  y += 9;
  doc.text(`${formData.companyCity || ""}, ${formData.companyState || ""} ${formData.companyZip || ""}`, m, y);
  
  // "Earnings Statement" title and ADP logo on right
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Earnings", rightStart + 20, 32);
  doc.setFont("helvetica", "normal");
  doc.text("Statement", rightStart + 72, 32);
  
  // ADP Logo (text representation)
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(200, 0, 0);
  doc.text("ADP", pageWidth - m - 35, 35);
  doc.setFontSize(5);
  doc.setTextColor(0, 0, 0);
  doc.text("®", pageWidth - m - 8, 28);
  
  // Period info under title
  doc.setFontSize(7);
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");
  doc.text("Period Starting:", rightStart + 20, 48);
  doc.text(formatDateADP(startDate), rightStart + 75, 48);
  doc.text("Period Ending:", rightStart + 20, 57);
  doc.text(formatDateADP(endDate), rightStart + 75, 57);
  doc.text("Pay Date:", rightStart + 20, 66);
  doc.text(formatDateADP(payDate), rightStart + 75, 66);
  
  // ========== TAX INFO SECTION (LEFT) ==========
  y = 85;
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  
  // Taxable Marital Status
  const maritalStatus = formData.federalFilingStatus === 'married_jointly' || formData.federalFilingStatus === 'married_separately' ? 'Married' : 'Single';
  doc.text("Taxable Marital Status:", m, y);
  doc.text(maritalStatus, m + 95, y);
  
  // Tax Override header
  doc.text("Tax Override:", m + 165, y);
  
  y += 10;
  doc.text("Exemptions/Allowances:", m, y);
  
  // Federal, State, Local allowances
  y += 10;
  doc.text("Federal:", m + 10, y);
  doc.text(formData.stateAllowances || "1", m + 45, y);
  doc.text("Federal:", m + 165, y);
  
  y += 9;
  doc.text("State:", m + 10, y);
  doc.text(formData.stateAllowances || "1", m + 45, y);
  doc.text("State:", m + 165, y);
  
  y += 9;
  doc.text("Local:", m + 10, y);
  doc.text("0", m + 45, y);
  doc.text("Local:", m + 165, y);
  
  y += 9;
  doc.text("Social Security Number:", m, y);
  const ssnDisplay = formData.ssn ? `***-**-${formData.ssn}` : "***-**-****";
  doc.text(ssnDisplay, m + 95, y);
  
  // ========== EMPLOYEE NAME & ADDRESS (RIGHT) ==========
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(formData.name || "Employee Name", rightStart + 20, 95);
  
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(formData.address || "", rightStart + 20, 107);
  doc.text(`${formData.city || ""}, ${formData.state || ""} ${formData.zip || ""}`, rightStart + 20, 117);
  
  // ========== EARNINGS TABLE (LEFT SIDE) ==========
  y = 145;
  
  // Earnings header with underline
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  
  // Column headers
  doc.text("Earnings", m, y);
  doc.text("rate", m + 85, y);
  doc.text("hours/units", m + 115, y);
  doc.text("this period", m + 170, y);
  doc.text("year to date", m + 225, y);
  
  // Underline header
  doc.line(m, y + 2, m + 280, y + 2);
  
  y += 12;
  doc.setFont("helvetica", "normal");
  
  // Regular Pay row
  doc.text("Regular", m, y);
  doc.text(rate > 0 ? fmtCurrency(rate) : "", m + 85, y);
  doc.text(hours > 0 ? hours.toFixed(2) : "0.00", m + 125, y);
  doc.text(fmtCurrency(regularPay), m + 175, y);
  doc.text(fmtCurrency(ytdRegularPay), m + 230, y);
  
  // Overtime row (if any)
  if (overtime > 0) {
    y += 10;
    doc.text("Overtime", m, y);
    doc.text(fmtCurrency(rate * 1.5), m + 85, y);
    doc.text(overtime.toFixed(2), m + 125, y);
    doc.text(fmtCurrency(overtimePay), m + 175, y);
    doc.text(fmtCurrency(ytdOvertimePay), m + 230, y);
  }
  
  // Gross Pay line
  y += 15;
  doc.setLineWidth(0.3);
  doc.line(m + 50, y - 5, m + 280, y - 5);
  doc.setFont("helvetica", "bold");
  doc.text("Gross Pay", m + 50, y);
  doc.text(`$${fmtCurrency(grossPay)}`, m + 170, y);
  doc.text(`$${fmtCurrency(ytdGrossPay)}`, m + 225, y);
  
  // ========== STATUTORY DEDUCTIONS ==========
  y += 20;
  doc.setFont("helvetica", "bold");
  doc.text("Statutory Deductions", m, y);
  doc.text("this period", m + 170, y);
  doc.text("year to date", m + 225, y);
  doc.line(m, y + 2, m + 280, y + 2);
  
  y += 12;
  doc.setFont("helvetica", "normal");
  
  // Federal Income
  doc.text("Federal Income", m, y);
  doc.text(`-${fmtCurrency(federalTax)}`, m + 175, y);
  doc.text(fmtCurrency(ytdFederalTax), m + 230, y);
  
  y += 10;
  doc.text("Social Security", m, y);
  doc.text(`-${fmtCurrency(ssTax)}`, m + 175, y);
  doc.text(fmtCurrency(ytdSsTax), m + 230, y);
  
  y += 10;
  doc.text("Medicare", m, y);
  doc.text(`-${fmtCurrency(medTax)}`, m + 175, y);
  doc.text(fmtCurrency(ytdMedTax), m + 230, y);
  
  y += 10;
  const stateName = formData.state || "State";
  doc.text(`${stateName} State Income`, m, y);
  doc.text(`-${fmtCurrency(stateTax)}`, m + 175, y);
  doc.text(fmtCurrency(ytdStateTax), m + 230, y);
  
  // Local Tax if applicable
  if (localTax > 0) {
    y += 10;
    doc.text("Local Tax", m, y);
    doc.text(`-${fmtCurrency(localTax)}`, m + 175, y);
    doc.text(fmtCurrency(ytdLocalTax), m + 230, y);
  }
  
  // ========== VOLUNTARY DEDUCTIONS ==========
  y += 18;
  doc.setFont("helvetica", "bold");
  doc.text("Voluntary Deductions", m, y);
  doc.text("this period", m + 170, y);
  doc.text("year to date", m + 225, y);
  doc.line(m, y + 2, m + 280, y + 2);
  
  y += 12;
  doc.setFont("helvetica", "normal");
  
  // Show deductions if any
  if (deductionsData && deductionsData.length > 0) {
    deductionsData.forEach((d) => {
      const displayName = d.name || d.type || "Deduction";
      doc.text(`*${displayName}`, m, y);
      doc.text(`-${fmtCurrency(d.currentAmount || 0)}`, m + 175, y);
      doc.text(fmtCurrency((d.currentAmount || 0) * (data.ytdPayPeriods || 1)), m + 230, y);
      y += 10;
    });
  }
  
  // Show contributions if any (employer contributions)
  if (contributionsData && contributionsData.length > 0) {
    contributionsData.forEach((c) => {
      const displayName = c.name || c.type || "Contribution";
      doc.text(`*${displayName}`, m, y);
      doc.text(`-${fmtCurrency(c.currentAmount || 0)}`, m + 175, y);
      doc.text(fmtCurrency((c.currentAmount || 0) * (data.ytdPayPeriods || 1)), m + 230, y);
      y += 10;
    });
  }
  
  // If no deductions, add placeholder space
  if ((!deductionsData || deductionsData.length === 0) && (!contributionsData || contributionsData.length === 0)) {
    y += 5;
  }
  
  // ========== NET PAY ==========
  y += 10;
  doc.setLineWidth(0.5);
  doc.line(m, y - 5, m + 280, y - 5);
  doc.setFont("helvetica", "bold");
  doc.text("Net Pay", m, y);
  doc.text(`$${fmtCurrency(netPay)}`, m + 170, y);
  
  // ========== OTHER BENEFITS (RIGHT SIDE) ==========
  let rightY = 145;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.text("Other Benefits and", rightStart + 20, rightY);
  rightY += 9;
  doc.text("Information", rightStart + 20, rightY);
  doc.text("this period", rightStart + 125, rightY - 9);
  doc.text("year to date", rightStart + 170, rightY - 9);
  doc.line(rightStart + 20, rightY + 2, pageWidth - m, rightY + 2);
  
  rightY += 12;
  doc.setFont("helvetica", "normal");
  
  // Employer match (if contributions exist)
  if (contributionsData && contributionsData.length > 0) {
    contributionsData.forEach((c) => {
      if (c.type && c.type.includes('match')) {
        const displayName = c.name || "Employer match";
        doc.text(`*${displayName}`, rightStart + 20, rightY);
        doc.text(fmtCurrency(c.currentAmount || 0), rightStart + 130, rightY);
        doc.text(fmtCurrency((c.currentAmount || 0) * (data.ytdPayPeriods || 1)), rightStart + 175, rightY);
        rightY += 10;
      }
    });
  }
  
  // ========== DEPOSITS SECTION (RIGHT) ==========
  rightY += 20;
  doc.setFont("helvetica", "bold");
  doc.text("Deposits", rightStart + 20, rightY);
  rightY += 9;
  doc.text("account number", rightStart + 20, rightY);
  doc.text("transit/ABA", rightStart + 95, rightY);
  doc.text("amount", rightStart + 170, rightY);
  doc.line(rightStart + 20, rightY + 2, pageWidth - m, rightY + 2);
  
  rightY += 12;
  doc.setFont("helvetica", "normal");
  
  // Bank account deposit
  const bankLast4 = formData.bank || "0000";
  const maskedAccount = `XXXXXX${bankLast4}`;
  const maskedRouting = "XXXXXXXXX";
  
  doc.text(maskedAccount, rightStart + 20, rightY);
  doc.text(maskedRouting, rightStart + 95, rightY);
  doc.text(fmtCurrency(netPay), rightStart + 170, rightY);
  
  // ========== FEDERAL TAXABLE WAGES NOTE ==========
  const taxableWages = grossPay - (totalDeductions || 0);
  y = Math.max(y, rightY) + 50;
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text(`Your federal taxable wages this period are $${fmtCurrency(taxableWages)}`, rightStart + 20, y);
  y += 9;
  doc.text("* Excluded from Federal taxable wages", rightStart + 20, y);
  
  // ========== BOTTOM SECTION / CHECK STUB ==========
  // Divider line
  y += 30;
  doc.setLineWidth(0.5);
  doc.setDrawColor(0, 0, 0);
  doc.line(m, y, pageWidth - m, y);
  
  y += 20;
  
  // Company info repeated
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text(formData.company || "Company Name", m, y);
  doc.text(formData.companyAddress || "", m, y + 9);
  doc.text(`${formData.companyCity || ""}, ${formData.companyState || ""} ${formData.companyZip || ""}`, m, y + 18);
  
  // Pay Date on right
  doc.setFont("helvetica", "bold");
  doc.text("Pay Date:", rightStart + 50, y);
  doc.setFont("helvetica", "normal");
  doc.text(formatDateADP(payDate), rightStart + 90, y);
  
  // "THIS IS NOT A CHECK" watermark (diagonal text)
  y += 35;
  doc.setFontSize(14);
  doc.setTextColor(180, 180, 180);
  doc.setFont("helvetica", "bold");
  
  // Save current state and rotate for watermark
  const centerX = pageWidth / 2;
  const centerY = y + 10;
  
  // Draw rotated text (simulated with spacing)
  doc.text("T H I S   I S   N O T   A   C H E C K", centerX - 100, centerY, { angle: -15 });
  
  doc.setTextColor(0, 0, 0);
  
  // ========== BOTTOM DEPOSIT INFO ==========
  y += 40;
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.line(m, y, pageWidth - m, y);
  
  y += 10;
  doc.text("Deposited to the account", m, y);
  doc.text("account number", m + 170, y);
  doc.text("transit/ABA", rightStart + 40, y);
  doc.text("amount", rightStart + 130, y);
  
  y += 10;
  doc.setFont("helvetica", "normal");
  doc.text(`${formData.bankName || "Bank"} Direct Deposit`, m, y);
  doc.text(maskedAccount, m + 170, y);
  doc.text(maskedRouting, rightStart + 40, y);
  doc.text(fmtCurrency(netPay), rightStart + 130, y);
  
  // ========== EMPLOYEE NAME/ADDRESS AT BOTTOM ==========
  y += 30;
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text(formData.name || "Employee Name", m, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(formData.address || "", m, y + 12);
  doc.text(`${formData.city || ""}, ${formData.state || ""} ${formData.zip || ""}`, m, y + 22);
  
  // Page number footer
  doc.setFontSize(7);
  doc.setTextColor(100, 100, 100);
  doc.text(`${stubNum + 1}/${totalStubs}`, pageWidth - m - 20, pageHeight - 20);
}

// Template C: Workday Style Professional Payslip
export async function generateTemplateC(doc, data, pageWidth, pageHeight, margin) {
  try {
  const { formData, hours = 0, overtime = 0, regularPay = 0, overtimePay = 0, grossPay = 0, ssTax = 0, medTax = 0, federalTax = 0, stateTax = 0, localTax = 0, localTaxRate = 0, totalTax = 0, netPay = 0, rate = 0, stateRate = 0, startDate, endDate, payDate, payFrequency = 'biweekly', stubNum = 0, totalStubs = 1,
    ytdRegularPay = 0, ytdOvertimePay = 0, ytdGrossPay = 0, ytdSsTax = 0, ytdMedTax = 0, ytdFederalTax = 0, ytdStateTax = 0, ytdLocalTax = 0, ytdTotalTax = 0, ytdNetPay = 0,
    deductionsData = [], totalDeductions = 0, contributionsData = [], totalContributions = 0, ytdDeductions = 0, ytdContributions = 0, ytdPayPeriods = 1,
    logoDataUrl
  } = data || {};
  
  const m = 30;
  const usableWidth = pageWidth - 2 * m;
  let y = 25;
  
  // ========== HEADER LOGO/NAME ==========
  const isPreview = data.isPreview || false;
  
  // Always show custom logo if uploaded, regardless of preview mode
  if (logoDataUrl) {
    try {
      doc.addImage(logoDataUrl, 'PNG', m, y - 10, 120, 35);
      y += 30;
    } catch (e) {
      // Fallback to text if logo fails to load
      doc.setFontSize(14); doc.setTextColor(0, 0, 0); doc.setFont("helvetica", "bold"); doc.text(formData.company || "Company Name", m, y);
      y += 12;
    }
  } else if (isPreview) {
    // For preview without custom logo, show Workday text
    doc.setFontSize(18); 
    doc.setTextColor(0, 85, 164); // Workday blue color
    doc.setFont("helvetica", "bold"); 
    doc.text("WORKDAY", m, y + 10);
    y += 30;
  } else {
    doc.setFontSize(14); doc.setTextColor(0, 0, 0); doc.setFont("helvetica", "bold"); doc.text(formData.company || "Company Name", m, y);
    y += 12;
  }
  
  doc.setFontSize(8); doc.setFont("helvetica", "normal"); doc.setTextColor(60, 60, 60);
  doc.text(`${formData.companyAddress || ""}, ${formData.companyCity || ""}, ${formData.companyState || ""} ${formData.companyZip || ""}`, m, y);
  y += 10;
  doc.text(formData.companyPhone || "", m, y);
  
  doc.setFontSize(9); doc.setTextColor(0, 0, 0);
  doc.text(formData.name || "", pageWidth - m - 150, 25);
  doc.setFontSize(8); doc.setTextColor(60, 60, 60);
  doc.text(formData.address || "", pageWidth - m - 150, 37);
  doc.text(`${formData.city || ""}, ${formData.state || ""} ${formData.zip || ""}`, pageWidth - m - 150, 47);
  
  y += 15;

  // HELPER: Refactored for Enclosed Black Borders including Title
  const drawTableSection = (title, columns, colWidths, rowsData, isBoldLastRow = false, showInternalVerticals = true) => {
    const startY = y;
    const titleHeight = title ? 14 : 0;
    const headerHeight = 12;
    const rowHeight = 10;

    // 1. Draw Title Area (Dark Grey Background)
    if (title) {
      doc.setFillColor(80, 80, 80);
      doc.rect(m, y, usableWidth, titleHeight, 'F');
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(255, 255, 255);
      doc.text(title, pageWidth / 2, y + 10, { align: 'center' });
      y += titleHeight;
    }

    // 2. Column Header Area (Light Grey Background)
    doc.setFillColor(240, 240, 240);
    doc.rect(m, y, usableWidth, headerHeight, 'F');
    
    // Header Labels
    let currentX = m;
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(191, 191, 191);
    columns.forEach((col, i) => {
      doc.text(col, currentX + 3, y + 8);
      currentX += colWidths[i];
    });
    y += headerHeight;

    // 3. Data Rows
    doc.setTextColor(0, 0, 0);
    rowsData.forEach((row, rowIndex) => {
      currentX = m;
      const isLastRow = rowIndex === rowsData.length - 1;
      if (isBoldLastRow && isLastRow) doc.setFont("helvetica", "bold");
      else doc.setFont("helvetica", "normal");

      row.forEach((cell, colIndex) => {
        doc.text(String(cell), currentX + 3, y + 7);
        currentX += colWidths[colIndex];
      });
      y += rowHeight;
    });

    const endY = y;
    
    // 4. Final Borders
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    
    // Full Outer Bounding Box (Encloses title, headers, and rows)
    doc.rect(m, startY, usableWidth, endY - startY);
    
    // Line under Title
    if (title) doc.line(m, startY + titleHeight, pageWidth - m, startY + titleHeight);
    // Line under Headers
    doc.line(m, startY + titleHeight + headerHeight, pageWidth - m, startY + titleHeight + headerHeight);

    // Internal Vertical Lines (Only for Info and Summary)
    if (showInternalVerticals) {
      let lineX = m;
      for (let i = 0; i < colWidths.length - 1; i++) {
        lineX += colWidths[i];
        // Vertical lines start after the title area
        doc.line(lineX, startY + titleHeight, lineX, endY);
      }
    }

    y += 12; 
  };

  // ========== RENDER SECTIONS ==========

  // 1. Info Area
  const infoCols = ["Name", "Company", "Employee ID", "Pay Begin", "Pay End", "Check Date"];
  const infoWidths = Array(6).fill(usableWidth/6);
  const infoRow = [formData.name || "", formData.company || "", formData.employeeId || "", formatDate(startDate), formatDate(endDate), formatDate(payDate)];
  drawTableSection(null, infoCols, infoWidths, [infoRow], false, true);

  // 2. Summary
  const sumCols = ["", "Hours", "Gross Pay", "Pre Tax Ded.", "Taxes", "Post Tax Ded.", "Net Pay"];
  const sumWidths = Array(7).fill(usableWidth/7);
  const sumRows = [
    ["Current", hours.toFixed(2), fmt(grossPay), fmt(totalDeductions), fmt(totalTax), "0.00", fmt(netPay)],
    ["YTD", (hours * (ytdPayPeriods || 1)).toFixed(2), fmt(ytdGrossPay || grossPay), fmt(ytdDeductions || totalDeductions), fmt(ytdTotalTax || totalTax), "0.00", fmt(ytdNetPay || netPay)]
  ];
  drawTableSection(null, sumCols, sumWidths, sumRows, false, true);

  // 3. Earnings (With Black Outer Border)
  const earnCols = ["Description", "Dates", "Hours", "Rate", "Amount", "YTD"];
  const earnWidths = [usableWidth * 0.25, usableWidth * 0.22, usableWidth * 0.1, usableWidth * 0.12, usableWidth * 0.15, usableWidth * 0.16];
  const earnRows = [["Regular Earning", `${formatDate(startDate)} - ${formatDate(endDate)}`, hours.toFixed(2), fmt(rate), fmt(regularPay), fmt(ytdRegularPay || regularPay)]];
  if (overtime > 0) earnRows.push(["Overtime (1.5x)", `${formatDate(startDate)} - ${formatDate(endDate)}`, overtime.toFixed(2), fmt(rate * 1.5), fmt(overtimePay), fmt(ytdOvertimePay || overtimePay)]);
  earnRows.push(["Total Earnings", "", "", "", fmt(grossPay), fmt(ytdGrossPay || grossPay)]);
  drawTableSection("Earnings", earnCols, earnWidths, earnRows, true, false);

  // 4. Taxes (With Black Outer Border)
  const taxCols = ["Description", "Amount", "YTD"];
  const taxWidths = [usableWidth * 0.6, usableWidth * 0.2, usableWidth * 0.2];
  const taxRows = [
    ["OASDI (Social Security)", fmt(ssTax), fmt(ytdSsTax || ssTax)],
    ["Medicare", fmt(medTax), fmt(ytdMedTax || medTax)],
    ["Federal Withholding", fmt(federalTax || 0), fmt(ytdFederalTax || federalTax || 0)],
    [`State Tax - ${formData.state || 'ST'}`, fmt(stateTax), fmt(ytdStateTax || stateTax)]
  ];
  if (formData.includeLocalTax && localTax > 0) taxRows.push([`City Tax`, fmt(localTax), fmt(ytdLocalTax || localTax)]);
  taxRows.push(["Total Taxes", fmt(totalTax), fmt(ytdTotalTax || totalTax)]);
  drawTableSection("Employee Taxes", taxCols, taxWidths, taxRows, true, false);

  // 5. Deductions
  if (deductionsData && deductionsData.length > 0) {
    const dedRows = deductionsData.map(d => [d.name || "Deduction", fmt(d.currentAmount), fmt(d.currentAmount * (ytdPayPeriods || 1))]);
    dedRows.push(["Total Deductions", fmt(totalDeductions), fmt(ytdDeductions || totalDeductions)]);
    drawTableSection("Pre Tax Deductions", taxCols, taxWidths, dedRows, true, false);
  }

  // 6. Payment Info
  const payCols = ["Bank Name", "Account Name", "Account Number", "Distribution"];
  const payWidths = Array(4).fill(usableWidth/4);
  const payRows = [[formData.bankName || "Bank", formData.name || "Employee", `******${formData.bank || "0000"}`, `${fmt(netPay)}` ]];
  drawTableSection("Payment Information", payCols, payWidths, payRows, false, true);

  // FOOTER
  doc.setFontSize(7);
  doc.setTextColor(120, 120, 120);
  doc.text(`Page ${stubNum + 1} of ${totalStubs}`, pageWidth / 2, pageHeight - 20, { align: 'center' });
  } catch (error) {
    console.error("Error generating Template C:", error);
    // Add error message to PDF
    doc.setFontSize(12);
    doc.setTextColor(255, 0, 0);
    doc.text("Error generating document. Please check your inputs.", 40, 100);
  }
}
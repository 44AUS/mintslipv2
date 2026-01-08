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

// Format date as "Mar 10, 2025" - handles timezone-safe parsing
function formatDate(date) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  // Handle both Date objects and string dates (YYYY-MM-DD)
  let d;
  if (typeof date === 'string' && date.match(/^\d{4}-\d{2}-\d{2}$/)) {
    // Parse YYYY-MM-DD format manually to avoid timezone issues
    const [year, month, day] = date.split('-').map(Number);
    d = new Date(year, month - 1, day);
  } else {
    d = new Date(date);
    // If it's a Date object passed from the generator, use UTC values to avoid timezone shift
    if (date instanceof Date) {
      return `${months[date.getUTCMonth()]} ${date.getUTCDate()}, ${date.getUTCFullYear()}`;
    }
  }
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

// Template A: Gusto-Style Professional (matches artifact exactly)
export async function generateTemplateA(doc, data, pageWidth, pageHeight, margin) {
  const { formData, hours, overtime, commission = 0, regularPay, overtimePay, grossPay, ssTax, medTax, federalTax, stateTax, localTax, totalTax, netPay, rate, stateRate, localTaxRate, sutaRate, startDate, endDate, payDate, payFrequency, stubNum, totalStubs,
    ytdRegularPay, ytdOvertimePay, ytdCommission = 0, ytdGrossPay, ytdSsTax, ytdMedTax, ytdFederalTax, ytdStateTax, ytdLocalTax, ytdTotalTax, ytdNetPay, ytdHours,
    payType, workerType, isContractor, annualSalary,
    deductionsData, totalDeductions, preTaxDeductions = 0, postTaxDeductions = 0,
    contributionsData, totalContributions, preTaxContributions = 0, postTaxContributions = 0,
    totalPreTax = 0, totalPostTax = 0,
    ytdDeductions, ytdContributions,
    logoDataUrl, ytdPayPeriods = 1
  } = data;
  
  // Debug log to trace commission value
  console.log('Template A - Commission Debug:', { commission, ytdCommission, grossPay, data: JSON.stringify({ commission: data.commission, ytdCommission: data.ytdCommission }) });
  
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
  const maxLogoWidth = 120;  // Maximum width for custom logo
  const maxLogoHeight = 35;  // Maximum height for custom logo

  // Load and draw logo - use custom logo if provided, otherwise default Gusto logo
  if (logoDataUrl) {
    try {
      // Calculate proper dimensions to maintain aspect ratio
      const img = new Image();
      img.src = logoDataUrl;
      await new Promise((resolve) => {
        img.onload = () => {
          const aspectRatio = img.height / img.width;
          let renderWidth = maxLogoWidth;
          let renderHeight = renderWidth * aspectRatio;
          
          // If height exceeds max, scale down by height instead
          if (renderHeight > maxLogoHeight) {
            renderHeight = maxLogoHeight;
            renderWidth = renderHeight / aspectRatio;
          }
          
          doc.addImage(logoDataUrl, 'PNG', logoX, top, renderWidth, renderHeight);
          resolve();
        };
        img.onerror = () => {
          // Fallback to Gusto text if image loading fails
          doc.setFont("helvetica", "bold");
          doc.setFontSize(18);
          doc.setTextColor(0, 168, 161);
          doc.text("Gusto", logoX, top + 20);
          resolve();
        };
      });
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

  // ========== FILING STATUS SECTION - Hidden for Gusto template ==========
  // Tax withholding info box is not shown on Gusto template PDF
  y += 10;

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

  if (commission > 0) {
    earningsRows.push([
      "Commission",
      "-",
      "-",
      `$${fmt(commission)}`,
      `$${fmt(ytdCommission)}`,
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
    
    // Build deductions rows - separate pre-tax and post-tax
    const deductionRows = [["Description", "Tax Type", "Current", "Year-To-Date"]];
    if (deductionsData && deductionsData.length > 0) {
      deductionsData.forEach(d => {
        const taxLabel = d.preTax ? "Pre-Tax" : "Post-Tax";
        deductionRows.push([
          d.name || "Deduction",
          taxLabel,
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
    
    // Build contributions rows - separate pre-tax and post-tax
    const contributionRows = [["Description", "Tax Type", "Current", "Year-To-Date"]];
    if (contributionsData && contributionsData.length > 0) {
      contributionsData.forEach(c => {
        const taxLabel = c.preTax ? "Pre-Tax" : "Post-Tax";
        contributionRows.push([
          c.name || "Contribution",
          taxLabel,
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
    // Pre-Tax Deductions/Contributions (before taxes)
    // Includes: 401k, Health/Dental/Vision Insurance, HSA, FSA, Commuter Benefits
    const currentPreTax = totalPreTax || 0;
    const ytdPreTax = currentPreTax * (ytdPayPeriods || 1);
    summaryRows.push(["Pre-Tax Deductions/Contributions", `$${fmt(currentPreTax)}`, `$${fmt(ytdPreTax)}`]);
    
    // Taxes
    summaryRows.push(["Taxes", `$${fmt(totalTax)}`, `$${fmt(ytdTotalTax)}`]);
    
    // Post-Tax Deductions/Contributions (after taxes)
    // Includes: Roth 401k, Life Insurance, Disability Insurance, Union Dues, Garnishments, etc.
    const currentPostTax = totalPostTax || 0;
    const ytdPostTax = currentPostTax * (ytdPayPeriods || 1);
    summaryRows.push(["Post-Tax Deductions/Contributions", `$${fmt(currentPostTax)}`, `$${fmt(ytdPostTax)}`]);
    
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
  doc.setFontSize(10);  // One size bigger than subheaders (9)
  doc.setTextColor(106, 106, 106);  // #6a6a6a
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

// Template B: ADP-Style Earnings Statement (Programmatically Generated)
// Exact layout matching ADP format with two-column design
export function generateTemplateB(doc, data, pageWidth, pageHeight, margin) {
  const { 
    formData, hours, overtime, commission = 0, regularPay, overtimePay, grossPay, 
    ssTax, medTax, federalTax, stateTax, localTax, totalTax, netPay, rate, 
    startDate, endDate, payDate, payFrequency, stubNum, totalStubs,
    ytdGrossPay = grossPay, ytdSsTax = ssTax, ytdMedTax = medTax, 
    ytdFederalTax = federalTax, ytdStateTax = stateTax, ytdLocalTax = localTax,
    ytdRegularPay = regularPay, ytdOvertimePay = overtimePay, ytdCommission = 0,
    deductionsData = [], totalDeductions = 0, contributionsData = [], totalContributions = 0,
    preTaxDeductions = 0, postTaxDeductions = 0, preTaxContributions = 0, postTaxContributions = 0,
    totalPreTax = 0, totalPostTax = 0,
    ytdDeductions = 0, ytdContributions = 0, ytdPayPeriods = 1,
    logoDataUrl
  } = data;
  
  // Helper to format currency
  const fmtCurrency = (n) => Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  
  // Helper function to format date as MM/DD/YYYY
  const formatDateADP = (date) => {
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

  // Helper to draw hatched/textured background bar
  const drawHatchedBar = (x, y, width, height) => {
    doc.setFillColor(230, 230, 230);
    doc.rect(x, y, width, height, 'F');
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.15);
    const spacing = 2;
    for (let i = 0; i < width + height; i += spacing) {
      const x1 = x + Math.max(0, i - height);
      const y1 = y + Math.min(i, height);
      const x2 = x + Math.min(i, width);
      const y2 = y + Math.max(0, i - width);
      if (x1 <= x + width && x2 >= x && y1 <= y + height && y2 >= y) {
        doc.line(x1, y1, x2, y2);
      }
    }
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.3);
  };

  // Layout constants - narrower left column design
  const m = 15; // Left margin
  const leftColWidth = 200; // Left column width (approx 55% of usable width)
  const rightColStart = m + leftColWidth + 10; // Right column start
  const rightColWidth = pageWidth - rightColStart - m; // Right column width
  
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);

  // ==================== TOP HEADER ROW (LEFT SIDE) ====================
  let y = 15;
  doc.setFontSize(6);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  
  // Header labels with hatched background
  const headerHeight = 10;
  drawHatchedBar(m, y - 3, leftColWidth, headerHeight);
  
  doc.text("CO", m + 3, y + 2);
  doc.text("FILE", m + 25, y + 2);
  doc.text("DEPT", m + 60, y + 2);
  doc.text("CLOCK", m + 90, y + 2);
  doc.text("VCHR NO", m + 125, y + 2);
  doc.text("NO", m + 170, y + 2);
  
  // Header values row
  y += 10;
  const companyCode = formData.companyCode || "74F";
  const fileNum = formData.fileNum || String(Math.floor(1000000 + Math.random() * 9000000));
  const deptNum = formData.deptNum || "01";
  const clockNum = formData.clockNum || String(Math.floor(10000000 + Math.random() * 90000000));
  const vchrNum = formData.voucherNumber || String(Math.floor(100 + Math.random() * 900));
  
  doc.setFont("helvetica", "normal");
  doc.text(companyCode, m + 3, y);
  doc.text(fileNum, m + 25, y);
  doc.text(deptNum, m + 60, y);
  doc.text(clockNum, m + 90, y);
  doc.text(vchrNum, m + 125, y);
  doc.text("1", m + 170, y);

  // ==================== COMPANY INFO (LEFT COLUMN) ====================
  y += 12;
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text(formData.company || "COMPANY NAME", m, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  y += 9;
  doc.text(formData.companyAddress || "123 Main Street", m, y);
  y += 8;
  doc.text(`${formData.companyCity || "City"}, ${formData.companyState || "ST"} ${formData.companyZip || "00000"}`, m, y);

  // ==================== TAX INFO SECTION (LEFT COLUMN) ====================
  y += 15;
  doc.setFontSize(7);
  doc.text("Taxable Marital Status: ", m + 20, y);
  const maritalStatus = formData.federalFilingStatus === 'married_jointly' || formData.federalFilingStatus === 'married_separately' ? 'Married' : 'Single';
  doc.text(maritalStatus, m + 70, y);
  
  y += 9;
  doc.text("Exemptions / Allowances:", m + 20, y);
  
  y += 9;
  doc.text("Federal:", m + 25, y);
  doc.text(formData.federalAllowances || "0", m + 80, y);
  
  y += 8;
  doc.text("State:", m + 25, y);
  doc.text(formData.stateAllowances || "0", m + 80, y);
  
  y += 8;
  doc.text("Local:", m + 25, y);
  doc.text("0", m + 80, y);
  
  y += 10;
  doc.text("SOCIAL SECURITY NO:", m + 20, y);
  const ssnDisplay = formData.ssn ? `XXX-XX-${formData.ssn}` : "XXX-XX-XXXX";
  doc.text(ssnDisplay, m + 75, y);

  // ==================== EARNINGS STATEMENT TITLE & LOGO (RIGHT COLUMN) ====================
  let rightY = 15;
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Earnings Statement", rightColStart, rightY);
  
  // Logo on far right
  if (logoDataUrl) {
    try {
      doc.addImage(logoDataUrl, 'PNG', pageWidth - m - 40, rightY - 5, 35, 15);
    } catch (e) {
      // Logo failed
    }
  }

  // ==================== PERIOD INFO (RIGHT COLUMN) ====================
  rightY += 18;
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text("Period Beginning:", rightColStart, rightY);
  doc.text(formatDateADP(startDate), rightColStart + 50, rightY);
  rightY += 9;
  doc.text("Period Ending:", rightColStart, rightY);
  doc.text(formatDateADP(endDate), rightColStart + 50, rightY);
  rightY += 9;
  doc.text("Pay Date:", rightColStart, rightY);
  doc.text(formatDateADP(payDate), rightColStart + 50, rightY);

  // ==================== EMPLOYEE NAME & ADDRESS (RIGHT COLUMN) ====================
  rightY += 15;
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text(formData.name || "EMPLOYEE NAME", rightColStart, rightY);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  rightY += 9;
  doc.text(formData.address || "123 Employee Street", rightColStart, rightY);
  rightY += 8;
  doc.text(`${formData.city || "City"}, ${formData.state || "ST"} ${formData.zip || "00000"}`, rightColStart, rightY);

  // ==================== EARNINGS SECTION (LEFT COLUMN) ====================
  y += 15;
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text("Earnings", m, y);
  
  // Column positions for earnings
  const eRateCol = m + 55;
  const eHoursCol = m + 85;
  const ePeriodCol = m + 120;
  const eYtdCol = m + 165;
  
  doc.setFontSize(6);
  doc.setFont("helvetica", "normal");
  doc.text("rate", eRateCol, y);
  doc.text("hours", eHoursCol, y);
  doc.text("this period", ePeriodCol, y);
  doc.text("year to date", eYtdCol, y);
  
  // Underline
  y += 2;
  doc.line(m, y, m + leftColWidth, y);
  
  // Regular/Salary row
  y += 10;
  doc.setFontSize(7);
  const isHourly = rate > 0 && hours > 0;
  
  if (isHourly) {
    doc.text("Regular", m, y);
    doc.text(fmtCurrency(rate), eRateCol, y);
    doc.text(hours.toFixed(2), eHoursCol, y);
  } else {
    doc.text("Salary", m, y);
  }
  doc.text(fmtCurrency(regularPay), ePeriodCol, y);
  doc.text(fmtCurrency(ytdRegularPay), eYtdCol, y);
  
  // Overtime row (if applicable)
  if (overtime > 0) {
    y += 9;
    doc.text("Overtime", m, y);
    doc.text(fmtCurrency(rate * 1.5), eRateCol, y);
    doc.text(overtime.toFixed(2), eHoursCol, y);
    doc.text(fmtCurrency(overtimePay), ePeriodCol, y);
    doc.text(fmtCurrency(ytdOvertimePay), eYtdCol, y);
  }
  
  // Commission row (if applicable)
  if (commission > 0) {
    y += 9;
    doc.text("Commission", m, y);
    doc.text(fmtCurrency(commission), ePeriodCol, y);
    doc.text(fmtCurrency(ytdCommission), eYtdCol, y);
  }

  // ==================== GROSS PAY BAR ====================
  y += 12;
  const barHeight = 10;
  drawHatchedBar(m, y - 6, leftColWidth, barHeight);
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.text("Gross Pay", m + 3, y);
  doc.text(`$${fmtCurrency(grossPay)}`, ePeriodCol, y);
  doc.text(fmtCurrency(ytdGrossPay), eYtdCol, y);

  // ==================== OTHER BENEFITS SECTION (RIGHT COLUMN) ====================
  rightY += 15;
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("Other Benefits and", rightColStart, rightY);
  rightY += 8;
  doc.text("Information", rightColStart, rightY);
  
  const otherPeriodCol = rightColStart + 60;
  const otherYtdCol = rightColStart + 95;
  
  doc.setFontSize(6);
  doc.setFont("helvetica", "normal");
  doc.text("this period", otherPeriodCol, rightY - 8);
  doc.text("total to date", otherYtdCol, rightY - 8);
  
  rightY += 2;
  doc.line(rightColStart, rightY, pageWidth - m, rightY);
  
  // Show contributions if any
  rightY += 10;
  if (contributionsData && contributionsData.length > 0) {
    contributionsData.forEach((c) => {
      if (c.type && c.type.includes('match')) {
        doc.setFontSize(6);
        doc.text(`${c.name || "Employer Match"}`, rightColStart, rightY);
        doc.text(fmtCurrency(c.currentAmount || 0), otherPeriodCol, rightY);
        doc.text(fmtCurrency((c.currentAmount || 0) * (ytdPayPeriods || 1)), otherYtdCol, rightY);
        rightY += 8;
      }
    });
  }

  // ==================== IMPORTANT NOTES (RIGHT COLUMN) ====================
  rightY += 8;
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("Important Notes", rightColStart, rightY);
  rightY += 2;
  doc.line(rightColStart, rightY, pageWidth - m, rightY);
  rightY += 10;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6);
  doc.text(`BASIS OF PAY: ${isHourly ? 'HOURLY' : 'SALARY'}`, rightColStart, rightY);

  // ==================== DEDUCTIONS SECTION (LEFT COLUMN) ====================
  y += 15;
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("Deductions", m, y);
  
  y += 10;
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.text("Statutory", m + 5, y);
  
  y += 2;
  doc.line(m, y, m + leftColWidth, y);
  
  // Deduction column positions
  const dPeriodCol = m + 100;
  const dYtdCol = m + 150;
  
  // Federal Income Tax
  y += 10;
  doc.setFont("helvetica", "normal");
  doc.text("Federal Income Tax", m + 10, y);
  doc.text(`-${fmtCurrency(federalTax)}`, dPeriodCol, y);
  doc.text(fmtCurrency(ytdFederalTax), dYtdCol, y);
  
  // Social Security Tax
  y += 9;
  doc.text("Social Security Tax", m + 10, y);
  doc.text(`-${fmtCurrency(ssTax)}`, dPeriodCol, y);
  doc.text(fmtCurrency(ytdSsTax), dYtdCol, y);
  
  // Medicare Tax
  y += 9;
  doc.text("Medicare Tax", m + 10, y);
  doc.text(`-${fmtCurrency(medTax)}`, dPeriodCol, y);
  doc.text(fmtCurrency(ytdMedTax), dYtdCol, y);
  
  // State Income Tax
  y += 9;
  doc.text(`${formData.state || "ST"} State Income Tax`, m + 10, y);
  doc.text(`-${fmtCurrency(stateTax)}`, dPeriodCol, y);
  doc.text(fmtCurrency(ytdStateTax), dYtdCol, y);

  // Voluntary deductions if any
  if (deductionsData && deductionsData.length > 0) {
    deductionsData.forEach((d) => {
      y += 9;
      doc.text(`${d.name || d.type || "Deduction"}`, m + 10, y);
      doc.text(`-${fmtCurrency(d.currentAmount || 0)}`, dPeriodCol, y);
      doc.text(fmtCurrency((d.currentAmount || 0) * (ytdPayPeriods || 1)), dYtdCol, y);
    });
  }

  // ==================== ADDITIONAL TAX INFO (RIGHT COLUMN) ====================
  rightY += 15;
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.text("Additional Tax Withholding Information", rightColStart, rightY);
  rightY += 2;
  doc.line(rightColStart, rightY, pageWidth - m, rightY);
  rightY += 10;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6);
  doc.text(`Taxable Marital Status: ${maritalStatus}`, rightColStart, rightY);
  rightY += 8;
  doc.text(`Exemptions/ Allowances: ${formData.stateAllowances || "0"}`, rightColStart, rightY);

  // ==================== NET PAY BAR ====================
  y += 15;
  drawHatchedBar(m, y - 6, leftColWidth, barHeight);
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.text("Net Pay", m + 3, y);
  doc.text(`$${fmtCurrency(netPay)}`, dPeriodCol, y);
  
  // Checking line
  y += 12;
  doc.setFont("helvetica", "normal");
  doc.text("Checking 1", m + 10, y);
  doc.text(`-${fmtCurrency(netPay)}`, dPeriodCol, y);
  
  // Net Check bar
  y += 10;
  drawHatchedBar(m, y - 6, leftColWidth, barHeight);
  doc.setFont("helvetica", "bold");
  doc.text("Net Check", m + 3, y);
  doc.text("$0.00", dPeriodCol, y);

  // ==================== FEDERAL TAXABLE WAGES NOTE ====================
  y += 20;
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  const taxableWages = grossPay - (totalDeductions || 0);
  doc.text("Your federal taxable wages this period are", m, y);
  y += 8;
  doc.text(`$${fmtCurrency(taxableWages)}`, m, y);

  // ==================== BOTTOM DIVIDER ====================
  y += 15;
  doc.setLineWidth(0.5);
  doc.line(m, y, pageWidth - m, y);

  // ==================== CHECK STUB SECTION ====================
  y += 12;
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  
  // Company info repeated
  doc.text(formData.company || "Company Name", m, y);
  doc.text(formData.companyAddress || "", m, y + 8);
  doc.text(`${formData.companyCity || ""}, ${formData.companyState || ""} ${formData.companyZip || ""}`, m, y + 16);
  
  // Pay Date on right
  doc.setFont("helvetica", "bold");
  doc.text("Pay Date:", rightColStart, y);
  doc.setFont("helvetica", "normal");
  doc.text(formatDateADP(payDate), rightColStart + 35, y);

  // ==================== THIS IS NOT A CHECK WATERMARK ====================
  y += 35;
  doc.setFontSize(11);
  doc.setTextColor(180, 180, 180);
  doc.setFont("helvetica", "bold");
  
  const watermarkText = "THIS IS NOT A CHECK";
  const centerX = pageWidth / 2;
  doc.text(watermarkText, centerX, y, { align: 'center', angle: -12 });
  
  doc.setTextColor(0, 0, 0);

  // ==================== BOTTOM DEPOSIT TABLE ====================
  y += 25;
  doc.setFontSize(6);
  doc.setFont("helvetica", "bold");
  doc.line(m, y, pageWidth - m, y);
  
  y += 8;
  doc.text("Deposited to the account", m, y);
  doc.text("account number", m + 100, y);
  doc.text("transit/ABA", m + 160, y);
  doc.text("amount", rightColStart + 50, y);
  
  y += 8;
  doc.setFont("helvetica", "normal");
  const bankLast4 = formData.bank || "0000";
  const maskedAccount = `XXXXXX${bankLast4}`;
  doc.text(`${formData.bankName || "Bank"} DirectDeposit`, m, y);
  doc.text(maskedAccount, m + 100, y);
  doc.text("XXXXXXXXX", m + 160, y);
  doc.text(fmtCurrency(netPay), rightColStart + 50, y);

  // ==================== EMPLOYEE INFO AT BOTTOM ====================
  y += 18;
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text(formData.name || "Employee Name", m, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text(formData.address || "", m, y + 8);
  doc.text(`${formData.city || ""}, ${formData.state || ""} ${formData.zip || ""}`, m, y + 15);
}

// Template C: Workday Style Professional Payslip - MasterBrand/Workday Layout
export async function generateTemplateC(doc, data, pageWidth, pageHeight, margin) {
  try {
  const { formData, hours = 0, overtime = 0, commission = 0, regularPay = 0, overtimePay = 0, grossPay = 0, ssTax = 0, medTax = 0, federalTax = 0, stateTax = 0, localTax = 0, localTaxRate = 0, totalTax = 0, netPay = 0, rate = 0, stateRate = 0, startDate, endDate, payDate, payFrequency = 'biweekly', stubNum = 0, totalStubs = 1,
    ytdRegularPay = 0, ytdOvertimePay = 0, ytdCommission = 0, ytdGrossPay = 0, ytdSsTax = 0, ytdMedTax = 0, ytdFederalTax = 0, ytdStateTax = 0, ytdLocalTax = 0, ytdTotalTax = 0, ytdNetPay = 0, ytdHours = 0,
    deductionsData = [], totalDeductions = 0, contributionsData = [], totalContributions = 0,
    preTaxDeductions = 0, postTaxDeductions = 0, preTaxContributions = 0, postTaxContributions = 0,
    totalPreTax = 0, totalPostTax = 0,
    ytdDeductions = 0, ytdContributions = 0, ytdPayPeriods = 1,
    logoDataUrl, absencePlansData = [], payType = 'hourly'
  } = data || {};
  
  const m = 20; // Left margin
  const usableWidth = pageWidth - 2 * m;
  let y = 18;
  
  // Format date as MM/DD/YYYY - handles timezone-safe parsing
  const formatDateMDY = (date) => {
    let mm, dd, yyyy;
    // Handle string dates (YYYY-MM-DD) to avoid timezone issues
    if (typeof date === 'string' && date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const parts = date.split('-').map(Number);
      yyyy = parts[0];
      mm = String(parts[1]).padStart(2, '0');
      dd = String(parts[2]).padStart(2, '0');
    } else if (date instanceof Date) {
      // Use UTC values for Date objects to avoid timezone shift
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
  
  // ========== HEADER SECTION - LOGO/COMPANY NAME ==========
  const isPreview = data.isPreview || false;
  const maxLogoWidth = 120;
  const maxLogoHeight = 35;
  
  if (logoDataUrl) {
    try {
      const img = new Image();
      img.src = logoDataUrl;
      await new Promise((resolve) => {
        img.onload = () => {
          const aspectRatio = img.height / img.width;
          let renderWidth = maxLogoWidth;
          let renderHeight = renderWidth * aspectRatio;
          if (renderHeight > maxLogoHeight) {
            renderHeight = maxLogoHeight;
            renderWidth = renderHeight / aspectRatio;
          }
          doc.addImage(logoDataUrl, 'PNG', m, y - 5, renderWidth, renderHeight);
          resolve();
        };
        img.onerror = () => {
          doc.setFontSize(14); doc.setTextColor(0, 0, 0); doc.setFont("helvetica", "bold"); 
          doc.text(formData.company || "COMPANY NAME", m, y + 15);
          resolve();
        };
      });
    } catch (e) {
      doc.setFontSize(14); doc.setTextColor(0, 0, 0); doc.setFont("helvetica", "bold"); 
      doc.text(formData.company || "COMPANY NAME", m, y + 15);
    }
  } else if (isPreview) {
    // For preview without logo, show company name from form data
    doc.setFontSize(16); 
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold"); 
    doc.text(formData.company || "COMPANY NAME", m, y + 15);
  } else {
    doc.setFontSize(14); doc.setTextColor(0, 0, 0); doc.setFont("helvetica", "bold"); 
    doc.text(formData.company || "COMPANY NAME", m, y + 15);
  }
  
  y += 40;
  
  // Company address and phone (centered)
  doc.setFontSize(8); doc.setFont("helvetica", "normal"); doc.setTextColor(0, 0, 0);
  const companyLine1 = `${formData.company || "Company Name"}   ${formData.companyAddress || "One Company Drive"} ${formData.companyCity || "City"}, ${formData.companyState || "ST"} ${formData.companyZip || "00000"}   ${formData.companyPhone || "+1 (000) 000-0000"}`;
  doc.text(companyLine1, pageWidth / 2, y, { align: 'center' });
  y += 10;
  
  // Employee address line
  const employeeLine = `${formData.name || "Employee Name"}   ${formData.address || ""} ${formData.city || ""}, ${formData.state || ""} ${formData.zip || ""}`;
  doc.text(employeeLine, pageWidth / 2, y, { align: 'center' });
  y += 12;
  
  // ========== HELPER: Draw Table with Dark Header ==========
  const drawWorkdayTable = (title, columns, colWidths, rowsData, options = {}) => {
    const { showTitle = true, isBoldLastRow = false, rightAlignFrom = 1, whiteHeader = false, rowDividers = false, borderAboveLastRow = false, noVerticalDividers = false, rightAlignColumns = [], centerColumns = [] } = options;
    const startY = y;
    const titleHeight = showTitle && title ? 14 : 0;
    const headerHeight = 12;
    const rowHeight = 11;

    // Helper to determine column alignment
    const getAlignment = (colIndex) => {
      if (centerColumns.includes(colIndex)) return 'center';
      if (rightAlignColumns.includes(colIndex) || colIndex >= rightAlignFrom) return 'right';
      return 'left';
    };

    // Helper to truncate text that exceeds column width
    const truncateText = (text, maxWidth, fontSize) => {
      doc.setFontSize(fontSize);
      const textStr = String(text);
      const textWidth = doc.getTextWidth(textStr);
      if (textWidth <= maxWidth - 6) return textStr; // 6px padding
      
      // Truncate with ellipsis
      let truncated = textStr;
      while (doc.getTextWidth(truncated + '...') > maxWidth - 6 && truncated.length > 0) {
        truncated = truncated.slice(0, -1);
      }
      return truncated.length < textStr.length ? truncated + '...' : textStr;
    };

    // 1. Gray Title Area (light gray #bebebe matching Workday style)
    if (showTitle && title) {
      doc.setFillColor(190, 190, 190);
      doc.rect(m, y, usableWidth, titleHeight, 'F');
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);
      doc.text(title, pageWidth / 2, y + 9, { align: 'center' });
      y += titleHeight;
    }

    // 2. Header Area - white or gray based on option
    if (whiteHeader) {
      doc.setFillColor(255, 255, 255);
    } else {
      doc.setFillColor(190, 190, 190);
    }
    doc.rect(m, y, usableWidth, headerHeight, 'F');
    
    let currentX = m;
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);
    columns.forEach((col, i) => {
      const align = getAlignment(i);
      if (align === 'right') {
        doc.text(col, currentX + colWidths[i] - 3, y + 8, { align: 'right' });
      } else if (align === 'center') {
        doc.text(col, currentX + colWidths[i] / 2, y + 8, { align: 'center' });
      } else {
        doc.text(col, currentX + 3, y + 8);
      }
      currentX += colWidths[i];
    });
    y += headerHeight;

    // Track row positions for dividers
    const rowPositions = [];
    
    // 3. Data Rows
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");
    rowsData.forEach((row, rowIndex) => {
      rowPositions.push(y);
      currentX = m;

      row.forEach((cell, colIndex) => {
        const align = getAlignment(colIndex);
        const truncatedCell = truncateText(cell, colWidths[colIndex], 7);
        if (align === 'right') {
          doc.text(truncatedCell, currentX + colWidths[colIndex] - 3, y + 7, { align: 'right' });
        } else if (align === 'center') {
          doc.text(truncatedCell, currentX + colWidths[colIndex] / 2, y + 7, { align: 'center' });
        } else {
          doc.text(truncatedCell, currentX + 3, y + 7);
        }
        currentX += colWidths[colIndex];
      });
      y += rowHeight;
    });

    const endY = y;
    
    // 4. Draw borders (thicker lines)
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.75);
    doc.rect(m, startY, usableWidth, endY - startY);
    
    // Horizontal lines under title and header
    if (showTitle && title) {
      doc.line(m, startY + titleHeight, pageWidth - m, startY + titleHeight);
    }
    doc.line(m, startY + titleHeight + headerHeight, pageWidth - m, startY + titleHeight + headerHeight);

    // Row dividers (horizontal lines between each row)
    if (rowDividers && rowPositions.length > 1) {
      for (let i = 1; i < rowPositions.length; i++) {
        doc.line(m, rowPositions[i], pageWidth - m, rowPositions[i]);
      }
    }

    // Border above last row (for totals row like "Earning")
    if (borderAboveLastRow && rowPositions.length > 1) {
      doc.setLineWidth(0.75);
      doc.line(m, rowPositions[rowPositions.length - 1], pageWidth - m, rowPositions[rowPositions.length - 1]);
    }

    // Vertical column dividers
    if (!noVerticalDividers) {
      let lineX = m;
      for (let i = 0; i < colWidths.length - 1; i++) {
        lineX += colWidths[i];
        doc.line(lineX, startY + titleHeight, lineX, endY);
      }
    }

    y += 6;
  };

  // ========== 1. EMPLOYEE INFO TABLE ==========
  const infoCols = ["Name", "Company", "Employee ID", "Pay Period Begin", "Pay Period End", "Check Date", "Check Number"];
  const infoWidths = [usableWidth * 0.18, usableWidth * 0.18, usableWidth * 0.12, usableWidth * 0.13, usableWidth * 0.13, usableWidth * 0.12, usableWidth * 0.14];
  const infoRow = [
    formData.name || "", 
    formData.company || "", 
    formData.employeeId || "", 
    formatDateMDY(startDate), 
    formatDateMDY(endDate), 
    formatDateMDY(payDate),
    formData.checkNumber || ""
  ];
  drawWorkdayTable(null, infoCols, infoWidths, [infoRow], { showTitle: false, rightAlignFrom: 99, rightAlignColumns: [2, 4, 5, 6], centerColumns: [3] });

  // ========== 2. CURRENT/YTD SUMMARY ==========
  const sumCols = ["", "Hours Worked", "Gross Pay", "Pre Tax Deductions", "Employee Taxes", "Post Tax Deductions", "Net Pay"];
  const sumWidths = [usableWidth * 0.18, usableWidth * 0.12, usableWidth * 0.12, usableWidth * 0.15, usableWidth * 0.14, usableWidth * 0.15, usableWidth * 0.14];
  const currentYtdHours = ytdHours > 0 ? ytdHours : (hours * (ytdPayPeriods || 1));
  const currentPreTax = totalPreTax || totalDeductions || 0;
  const currentPostTax = totalPostTax || 0;
  const ytdPreTax = (totalPreTax || totalDeductions || 0) * (ytdPayPeriods || 1);
  const ytdPostTax = (totalPostTax || 0) * (ytdPayPeriods || 1);
  const sumRows = [
    ["Current", hours.toFixed(2), fmt(grossPay), fmt(currentPreTax), fmt(totalTax), fmt(currentPostTax), fmt(netPay)],
    ["YTD", currentYtdHours.toFixed(2), fmt(ytdGrossPay || grossPay), fmt(ytdPreTax), fmt(ytdTotalTax || totalTax), fmt(ytdPostTax), fmt(ytdNetPay || netPay)]
  ];
  drawWorkdayTable(null, sumCols, sumWidths, sumRows, { showTitle: false, rightAlignFrom: 1, borderAboveLastRow: true });

  // ========== 3. EARNING SECTION ==========
  const earnCols = ["Description", "Dates", "Hours", "Rate", "Amount", "YTD"];
  const earnWidths = [usableWidth * 0.25, usableWidth * 0.25, usableWidth * 0.10, usableWidth * 0.12, usableWidth * 0.14, usableWidth * 0.14];
  const isSalary = payType === 'salary';
  const earnRows = [[
    isSalary ? "Regular Earnings SLRY" : "Regular Earning HRLY", 
    `${formatDateMDY(startDate)} – ${formatDateMDY(endDate)}`, 
    hours.toFixed(2), 
    isSalary ? "" : fmt(rate), 
    fmt(regularPay), 
    fmt(ytdRegularPay || regularPay)
  ]];
  if (overtime > 0) {
    earnRows.push([
      "Overtime (1.5x)", 
      `${formatDateMDY(startDate)} – ${formatDateMDY(endDate)}`, 
      overtime.toFixed(2), 
      fmt(rate * 1.5), 
      fmt(overtimePay), 
      fmt(ytdOvertimePay || overtimePay)
    ]);
  }
  if (commission > 0) {
    earnRows.push([
      "Commission", 
      `${formatDateMDY(startDate)} – ${formatDateMDY(endDate)}`, 
      "", 
      "", 
      fmt(commission), 
      fmt(ytdCommission || commission)
    ]);
  }
  // Add blank rows for spacing like the reference
  earnRows.push(["", "", "", "", "", ""]);
  earnRows.push(["", "", "", "", "", ""]);
  earnRows.push(["", "", "", "", "", ""]);
  earnRows.push(["", "", "", "", "", ""]);
  earnRows.push(["", "", "", "", "", ""]);
  earnRows.push(["Earning", "", "", "", fmt(grossPay), fmt(ytdGrossPay || grossPay)]);
  drawWorkdayTable("Earning", earnCols, earnWidths, earnRows, { rightAlignFrom: 2, isBoldLastRow: true, whiteHeader: true, borderAboveLastRow: true, noVerticalDividers: true });

  // ========== 4. EMPLOYEE TAXES SECTION ==========
  const taxCols = ["Description", "Amount", "YTD"];
  const taxWidths = [usableWidth * 0.60, usableWidth * 0.20, usableWidth * 0.20];
  const taxRows = [
    ["OASDI", fmt(ssTax), fmt(ytdSsTax || ssTax)],
    ["Medicare", fmt(medTax), fmt(ytdMedTax || medTax)],
    ["Federal Withholding", fmt(federalTax || 0), fmt(ytdFederalTax || federalTax || 0)],
    [`State Tax - ${formData.state || 'ST'}`, fmt(stateTax), fmt(ytdStateTax || stateTax)]
  ];
  if (formData.includeLocalTax && localTax > 0) {
    taxRows.push([`City Tax - ${formData.city || 'City'}`, fmt(localTax), fmt(ytdLocalTax || localTax)]);
  }
  // Add School District Tax placeholder if local tax is included
  if (formData.includeLocalTax && formData.schoolDistrictTax) {
    taxRows.push([`School District Tax – ${formData.schoolDistrict || 'District'}`, fmt(formData.schoolDistrictTax || 0), fmt((formData.schoolDistrictTax || 0) * (ytdPayPeriods || 1))]);
  }
  taxRows.push(["Employee Taxes", fmt(totalTax), fmt(ytdTotalTax || totalTax)]);
  drawWorkdayTable("Employee Taxes", taxCols, taxWidths, taxRows, { rightAlignFrom: 1, whiteHeader: true, noVerticalDividers: true });

  // ========== 5. PRE TAX & POST TAX DEDUCTIONS SECTION (SIDE BY SIDE) ==========
  // Helper to draw side-by-side tables
  const drawSideBySideTables = (leftTitle, rightTitle, leftRows, rightRows, cols, options = {}) => {
    const { rightAlignFrom = 1, whiteHeader = false, noVerticalDividers = false, borderAboveLastRow = false } = options;
    const tableGap = 8;
    const tableWidth = (usableWidth - tableGap) / 2;
    const leftX = m;
    const rightX = m + tableWidth + tableGap;
    const startY = y;
    const titleHeight = 14;
    const headerHeight = 12;
    const rowHeight = 11;
    
    // Calculate column widths for each table (proportional to half width)
    const colWidths = [tableWidth * 0.50, tableWidth * 0.25, tableWidth * 0.25];
    
    // Pad rows to make both tables the same length
    const maxRows = Math.max(leftRows.length, rightRows.length);
    const emptyRow = cols.map(() => "");
    while (leftRows.length < maxRows) {
      leftRows.splice(leftRows.length - 1, 0, emptyRow); // Insert before last (totals) row
    }
    while (rightRows.length < maxRows) {
      rightRows.splice(rightRows.length - 1, 0, emptyRow); // Insert before last (totals) row
    }
    
    // Helper to get alignment
    const getAlignment = (colIndex) => colIndex >= rightAlignFrom ? 'right' : 'left';
    
    // Draw a single table at given X position
    const drawTable = (x, title, rows, tableW, colW) => {
      let localY = startY;
      
      // 1. Gray Title Area
      doc.setFillColor(190, 190, 190);
      doc.rect(x, localY, tableW, titleHeight, 'F');
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);
      doc.text(title, x + tableW / 2, localY + 9, { align: 'center' });
      localY += titleHeight;
      
      // 2. Header Area
      if (whiteHeader) {
        doc.setFillColor(255, 255, 255);
      } else {
        doc.setFillColor(190, 190, 190);
      }
      doc.rect(x, localY, tableW, headerHeight, 'F');
      
      let currentX = x;
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);
      cols.forEach((col, i) => {
        const align = getAlignment(i);
        if (align === 'right') {
          doc.text(col, currentX + colW[i] - 3, localY + 8, { align: 'right' });
        } else {
          doc.text(col, currentX + 3, localY + 8);
        }
        currentX += colW[i];
      });
      localY += headerHeight;
      
      // Track row positions for border above last row
      const rowPositions = [];
      
      // 3. Data Rows
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "normal");
      rows.forEach((row, rowIndex) => {
        rowPositions.push(localY);
        currentX = x;
        row.forEach((cell, colIndex) => {
          const align = getAlignment(colIndex);
          if (align === 'right') {
            doc.text(String(cell), currentX + colW[colIndex] - 3, localY + 7, { align: 'right' });
          } else {
            doc.text(String(cell), currentX + 3, localY + 7);
          }
          currentX += colW[colIndex];
        });
        localY += rowHeight;
      });
      
      const endY = localY;
      
      // 4. Draw borders
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.75);
      doc.rect(x, startY, tableW, endY - startY);
      
      // Horizontal lines under title and header
      doc.line(x, startY + titleHeight, x + tableW, startY + titleHeight);
      doc.line(x, startY + titleHeight + headerHeight, x + tableW, startY + titleHeight + headerHeight);
      
      // Border above last row
      if (borderAboveLastRow && rowPositions.length > 1) {
        doc.setLineWidth(0.75);
        doc.line(x, rowPositions[rowPositions.length - 1], x + tableW, rowPositions[rowPositions.length - 1]);
      }
      
      return endY;
    };
    
    // Draw both tables
    const leftEndY = drawTable(leftX, leftTitle, leftRows, tableWidth, colWidths);
    const rightEndY = drawTable(rightX, rightTitle, rightRows, tableWidth, colWidths);
    
    // Set y to the max of both tables
    y = Math.max(leftEndY, rightEndY) + 6;
  };
  
  // Separate deductions AND contributions into pre-tax and post-tax
  const preTaxDeductionRows = [];
  const postTaxDeductionRows = [];
  
  // Add deductions
  if (deductionsData && deductionsData.length > 0) {
    deductionsData.forEach(d => {
      const row = [d.name || "Deduction", fmt(d.currentAmount || 0), fmt((d.currentAmount || 0) * (ytdPayPeriods || 1))];
      if (d.preTax) {
        preTaxDeductionRows.push(row);
      } else {
        postTaxDeductionRows.push(row);
      }
    });
  }
  
  // Add contributions (like 401k, HSA, etc.) to the appropriate column
  if (contributionsData && contributionsData.length > 0) {
    contributionsData.forEach(c => {
      const row = [c.name || "Contribution", fmt(c.currentAmount || 0), fmt((c.currentAmount || 0) * (ytdPayPeriods || 1))];
      if (c.preTax) {
        preTaxDeductionRows.push(row);
      } else {
        postTaxDeductionRows.push(row);
      }
    });
  }
  
  // Add placeholder if no deductions/contributions
  if (preTaxDeductionRows.length === 0) {
    preTaxDeductionRows.push(["No Pre Tax Deductions", "0.00", "0.00"]);
  }
  if (postTaxDeductionRows.length === 0) {
    postTaxDeductionRows.push(["No Post Tax Deductions", "0.00", "0.00"]);
  }
  
  // Calculate totals (include both deductions and contributions)
  const preTaxDedTotal = deductionsData ? deductionsData.filter(d => d.preTax).reduce((sum, d) => sum + (d.currentAmount || 0), 0) : 0;
  const postTaxDedTotal = deductionsData ? deductionsData.filter(d => !d.preTax).reduce((sum, d) => sum + (d.currentAmount || 0), 0) : 0;
  const preTaxContribTotal = contributionsData ? contributionsData.filter(c => c.preTax).reduce((sum, c) => sum + (c.currentAmount || 0), 0) : 0;
  const postTaxContribTotal = contributionsData ? contributionsData.filter(c => !c.preTax).reduce((sum, c) => sum + (c.currentAmount || 0), 0) : 0;
  
  const preTaxTotal = preTaxDedTotal + preTaxContribTotal;
  const postTaxTotal = postTaxDedTotal + postTaxContribTotal;
  
  // Add totals row
  preTaxDeductionRows.push(["Pre Tax Deductions", fmt(preTaxTotal), fmt(preTaxTotal * (ytdPayPeriods || 1))]);
  postTaxDeductionRows.push(["Post Tax Deductions", fmt(postTaxTotal), fmt(postTaxTotal * (ytdPayPeriods || 1))]);
  
  const dedCols = ["Description", "Amount", "YTD"];
  drawSideBySideTables("Pre Tax Deductions", "Post Tax Deductions", preTaxDeductionRows, postTaxDeductionRows, dedCols, { rightAlignFrom: 1, whiteHeader: true, noVerticalDividers: true, borderAboveLastRow: true });

  // ========== 6. EMPLOYER PAID BENEFITS & TAXABLE WAGES SECTION (SIDE BY SIDE) ==========
  // Build Employer Paid Benefits rows
  const employerBenefitsData = data.employerBenefitsData || [];
  const totalEmployerBenefits = data.totalEmployerBenefits || 0;
  const benefitRows = [];
  
  if (employerBenefitsData.length > 0) {
    employerBenefitsData.forEach(b => {
      benefitRows.push([b.name || "Employer Benefit", fmt(b.currentAmount || 0), fmt((b.currentAmount || 0) * (ytdPayPeriods || 1))]);
    });
  } else {
    benefitRows.push(["No Employer Benefits", "0.00", "0.00"]);
  }
  
  const totalBenefits = employerBenefitsData.length > 0 ? totalEmployerBenefits : 0;
  benefitRows.push(["Employer Paid Benefits", fmt(totalBenefits), fmt(totalBenefits * (ytdPayPeriods || 1))]);
  
  // Build Taxable Wages rows
  const federalTaxableWages = grossPay - totalDeductions;
  const taxableWagesRows = [
    ["OASDI – Taxable Wages", fmt(grossPay), fmt(ytdGrossPay || grossPay)],
    ["Medicare – Taxable Wages", fmt(grossPay), fmt(ytdGrossPay || grossPay)],
    ["Federal Withholding – Taxable Wages", fmt(federalTaxableWages), fmt((ytdGrossPay || grossPay) - (ytdDeductions || totalDeductions))]
  ];
  taxableWagesRows.push(["Taxable Wages", fmt(federalTaxableWages), fmt((ytdGrossPay || grossPay) - (ytdDeductions || totalDeductions))]);
  
  const benefitTaxCols = ["Description", "Amount", "YTD"];
  drawSideBySideTables("Employer Paid Benefits", "Taxable Wages", benefitRows, taxableWagesRows, benefitTaxCols, { rightAlignFrom: 1, whiteHeader: true, noVerticalDividers: true, borderAboveLastRow: true });

  // ========== 7. TAX WITHHOLDING & ABSENCE PLANS SECTION (SIDE BY SIDE) ==========
  // Helper to draw side-by-side tables with different column structures
  const drawSideBySideTablesCustom = (leftTitle, rightTitle, leftCols, rightCols, leftColWidths, rightColWidths, leftRows, rightRows, options = {}) => {
    const { whiteHeader = false, borderAboveLastRow = false, leftRowDividers = false, rightRowDividers = false } = options;
    const tableGap = 8;
    const tableWidth = (usableWidth - tableGap) / 2;
    const leftX = m;
    const rightX = m + tableWidth + tableGap;
    const startY = y;
    const titleHeight = 14;
    const headerHeight = 12;
    const rowHeight = 11;
    
    // Pad rows to make both tables the same length
    const maxRows = Math.max(leftRows.length, rightRows.length);
    const emptyLeftRow = leftCols.map(() => "");
    const emptyRightRow = rightCols.map(() => "");
    while (leftRows.length < maxRows) {
      leftRows.push(emptyLeftRow);
    }
    while (rightRows.length < maxRows) {
      rightRows.push(emptyRightRow);
    }
    
    // Draw a single table at given X position with custom columns
    const drawTableCustom = (x, title, cols, colWidths, rows, tableW, showRowDividers) => {
      let localY = startY;
      
      // 1. Gray Title Area
      doc.setFillColor(190, 190, 190);
      doc.rect(x, localY, tableW, titleHeight, 'F');
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);
      doc.text(title, x + tableW / 2, localY + 9, { align: 'center' });
      localY += titleHeight;
      
      // 2. Header Area
      if (whiteHeader) {
        doc.setFillColor(255, 255, 255);
      } else {
        doc.setFillColor(190, 190, 190);
      }
      doc.rect(x, localY, tableW, headerHeight, 'F');
      
      let currentX = x;
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);
      cols.forEach((col, i) => {
        // Right align numeric columns (all except first)
        if (i === 0) {
          doc.text(col, currentX + 3, localY + 8);
        } else {
          doc.text(col, currentX + colWidths[i] - 3, localY + 8, { align: 'right' });
        }
        currentX += colWidths[i];
      });
      localY += headerHeight;
      
      // Track row positions
      const rowPositions = [];
      
      // 3. Data Rows
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "normal");
      rows.forEach((row, rowIndex) => {
        rowPositions.push(localY);
        currentX = x;
        row.forEach((cell, colIndex) => {
          if (colIndex === 0) {
            doc.text(String(cell), currentX + 3, localY + 7);
          } else {
            doc.text(String(cell), currentX + colWidths[colIndex] - 3, localY + 7, { align: 'right' });
          }
          currentX += colWidths[colIndex];
        });
        localY += rowHeight;
      });
      
      const endY = localY;
      
      // 4. Draw borders
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.75);
      doc.rect(x, startY, tableW, endY - startY);
      
      // Horizontal lines under title and header
      doc.line(x, startY + titleHeight, x + tableW, startY + titleHeight);
      doc.line(x, startY + titleHeight + headerHeight, x + tableW, startY + titleHeight + headerHeight);
      
      // Row dividers (only if enabled for this table)
      if (showRowDividers && rowPositions.length > 1) {
        for (let i = 1; i < rowPositions.length; i++) {
          doc.line(x, rowPositions[i], x + tableW, rowPositions[i]);
        }
      }
      
      // Border above last row
      if (borderAboveLastRow && rowPositions.length > 1) {
        doc.setLineWidth(0.75);
        doc.line(x, rowPositions[rowPositions.length - 1], x + tableW, rowPositions[rowPositions.length - 1]);
      }
      
      return endY;
    };
    
    // Draw both tables with their respective row divider settings
    const leftEndY = drawTableCustom(leftX, leftTitle, leftCols, leftColWidths, leftRows, tableWidth, leftRowDividers);
    const rightEndY = drawTableCustom(rightX, rightTitle, rightCols, rightColWidths, rightRows, tableWidth, rightRowDividers);
    
    // Set y to the max of both tables
    y = Math.max(leftEndY, rightEndY) + 6;
  };
  
  // Build Tax Withholding rows
  let filingStatusDisplay = "Single or Married filing separately";
  if (formData.federalFilingStatus === "married_jointly") {
    filingStatusDisplay = "Married filing jointly";
  } else if (formData.federalFilingStatus === "head_of_household") {
    filingStatusDisplay = "Head of Household";
  } else if (formData.federalFilingStatus === "single") {
    filingStatusDisplay = "Single or Married filing separately";
  }
  const stateAllowances = formData.stateAllowances || "0";
  const federalAdditionalWithholding = formData.federalAdditionalWithholding || "0";
  const stateAdditionalWithholding = formData.stateAdditionalWithholding || "0";
  
  const withholdingCols = ["", "Federal", "State"];
  const halfTableWidth = (usableWidth - 8) / 2;
  const withholdingColWidths = [halfTableWidth * 0.40, halfTableWidth * 0.30, halfTableWidth * 0.30];
  const withholdingRows = [
    ["Marital Status", filingStatusDisplay, ""],
    ["Allowances", "0", stateAllowances],
    ["Additional Withholding", federalAdditionalWithholding, stateAdditionalWithholding]
  ];
  
  // Build Absence Plans rows - always show, with placeholder if no data
  const absenceCols = ["Description", "Accrued", "Reduced", "Available"];
  const absenceColWidths = [halfTableWidth * 0.40, halfTableWidth * 0.20, halfTableWidth * 0.20, halfTableWidth * 0.20];
  let absenceRows = [];
  if (absencePlansData && absencePlansData.length > 0) {
    absenceRows = absencePlansData.map(plan => [
      plan.description || "PTO Plan",
      plan.accrued || "0",
      plan.reduced || "0",
      String((parseFloat(plan.accrued) || 0) - (parseFloat(plan.reduced) || 0))
    ]);
  } else {
    // Placeholder row when no absence plans data
    absenceRows.push(["PTO Plan", "0", "0", "0"]);
  }
  
  drawSideBySideTablesCustom("Tax Withholding Information", "Absence Plans", withholdingCols, absenceCols, withholdingColWidths, absenceColWidths, withholdingRows, absenceRows, { whiteHeader: true, leftRowDividers: true, rightRowDividers: false });

  // ========== 8. PAYMENT INFORMATION SECTION ==========
  const paymentCols = ["Bank", "Account Name", "Account Number", "USD Amount", "Amount"];
  const paymentWidths = [usableWidth * 0.15, usableWidth * 0.25, usableWidth * 0.20, usableWidth * 0.20, usableWidth * 0.20];
  const bankName = formData.bankName || "Bank";
  const last4 = (formData.bank || '0000').slice(-4);
  const accountName = `${bankName} ****${last4}`;
  const accountNumber = `****${last4}`;
  const paymentRows = [
    [bankName, accountName, accountNumber, "" /* `${fmt(netPay)}` */, `${fmt(netPay)} USD`],
    ["", "", "", "", ""]
  ];
  drawWorkdayTable("Payment Information", paymentCols, paymentWidths, paymentRows, { rightAlignFrom: 3, whiteHeader: true, noVerticalDividers: true });

  } catch (error) {
    console.error("Error generating Template C:", error);
    doc.setFontSize(12);
    doc.setTextColor(255, 0, 0);
    doc.text("Error generating document. Please check your inputs.", 40, 100);
  }
}

// Template H: Modern Colorful Pay Stub with Blue Headers
// Exact match to the provided screenshot design
export function generateTemplateH(doc, data, pageWidth, pageHeight, margin) {
  const { 
    formData, hours, overtime, commission = 0, regularPay, overtimePay, grossPay, 
    ssTax, medTax, federalTax, stateTax, localTax, totalTax, netPay, rate, 
    startDate, endDate, payDate, payFrequency, stubNum, totalStubs,
    ytdGrossPay = grossPay, ytdSsTax = ssTax, ytdMedTax = medTax, 
    ytdFederalTax = federalTax, ytdStateTax = stateTax, ytdLocalTax = localTax,
    ytdRegularPay = regularPay, ytdOvertimePay = overtimePay, ytdCommission = 0,
    deductionsData = [], totalDeductions = 0, contributionsData = [], totalContributions = 0,
    ytdDeductions = 0, ytdContributions = 0, ytdPayPeriods = 1,
    logoDataUrl,
    periodCheckNumber = "", periodMemo = "",
    absencePlansData = []
  } = data;
  
  // Color scheme - Blue themed, no orange
  const colors = {
    blue: [37, 128, 216],         // #2580d8 - Header blue
    lightBlue: [215, 215, 215],   // Light gray for sub-headers
    lightGray: [240, 240, 240],   // #f0f0f0 - Footer content background
    borderGray: [200, 200, 200],  // #C8C8C8 - Borders
    white: [255, 255, 255],
    black: [0, 0, 0],
  };
  
  // Helper to format currency
  const fmtCurrency = (n) => Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  
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
  doc.text(`${formData.city || "City"}, ${formData.state || "ST"} ${formData.zip || "00000"}`, m + 5, y + 30);

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
  
  // Employee name with blue background box - extends to end of Check Date area
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  const employeeName = formData.name || "Employee Name";
  const blueBoxWidth = 155; // Extends to cover through Check Date area
  doc.setFillColor(...colors.blue);
  doc.rect(m + 2, y + 1, blueBoxWidth, 12, 'F');
  doc.setTextColor(...colors.white);
  doc.text(employeeName, m + 6, y + 10);
  doc.setTextColor(...colors.black);

  y+=5;
  
  // Info section with two rows
  doc.setFontSize(7);
  // Use per-period check number if provided, otherwise auto-generate
  const checkNum = periodCheckNumber || String(Math.floor(1 + Math.random() * 999));
  const empNum = formData.employeeId || String(Math.floor(1000000 + Math.random() * 9000000));
  
  // Row 1: Check # and Check Date (left side)
  doc.setFont("helvetica", "bold");
  doc.text("Check #:", m + 5, y + 18);
  doc.setFont("helvetica", "normal");
  doc.text(checkNum, m + 35, y + 18);
  
  doc.setFont("helvetica", "bold");
  doc.text("Check Date:", m + 90, y + 18);
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
  // Add black side borders to subheader
  doc.setDrawColor(...colors.black);
  doc.line(col1X, tableY, col1X, tableY + subHeaderHeight); // Left border
  doc.line(col1X + col1Width, tableY, col1X + col1Width, tableY + subHeaderHeight); // Right border
  
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
  // Add black side borders to subheader
  doc.setDrawColor(...colors.black);
  doc.line(col2X, tableY, col2X, tableY + subHeaderHeight); // Left border
  doc.line(col2X + col2Width, tableY, col2X + col2Width, tableY + subHeaderHeight); // Right border
  
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
  doc.text("Amt", xPos + wt.amt / 2, tableY + 7, { align: 'center' });
  xPos += wt.amt;
  doc.text("YTD", xPos + wt.ytd / 2, tableY + 7, { align: 'center' });
  
  tableY += subHeaderHeight;
  
  // Withholding data - 25 rows
  const stateCode = formData.state || "ST";
  const taxRows = [
    ["SS", fmtCurrency(ssTax), fmtCurrency(ytdSsTax)],
    ["FIT", fmtCurrency(federalTax), fmtCurrency(ytdFederalTax)],
    ["MEDI", fmtCurrency(medTax), fmtCurrency(ytdMedTax)],
    [`SIT-${stateCode}`, fmtCurrency(stateTax), fmtCurrency(ytdStateTax)],
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
    ["", "", ""],
  ];
  
  doc.setFont("courier", "normal");
  doc.setFontSize(6);
  
  const withholdingStartY = tableY;
  taxRows.forEach((row) => {
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
  // Add black side borders to subheader
  doc.setDrawColor(...colors.black);
  doc.line(col3X, tableY, col3X, tableY + subHeaderHeight); // Left border
  doc.line(col3X + col3Width, tableY, col3X + col3Width, tableY + subHeaderHeight); // Right border
  
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
  doc.text("Ben", xPos + db.ben / 2, tableY + 7, { align: 'center' });
  xPos += db.ben;
  doc.text("Amt", xPos + db.amt / 2, tableY + 7, { align: 'center' });
  xPos += db.amt;
  doc.text("YTD", xPos + db.ytd / 2, tableY + 7, { align: 'center' });
  
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
  doc.text(fmtCurrency(ytdSsTax + ytdMedTax + ytdFederalTax + ytdStateTax), col2X + col2Width - 5, totalsY + 6, { align: 'right' });
  
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
  
  // Light gray footer background (#f0f0f0)
  doc.setFillColor(...colors.lightGray);
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
  
  // Accruals column - Use absence plans data if available
  const accrualsX = m + 3;
  if (absencePlansData && absencePlansData.length > 0) {
    let accLineY = contentY + 5;
    absencePlansData.slice(0, 4).forEach(plan => {
      const desc = (plan.description || "PTO").substring(0, 6);
      const accrued = parseFloat(plan.accrued) || 0;
      const reduced = parseFloat(plan.reduced) || 0;
      const available = accrued - reduced;
      doc.text(`${desc}: ${reduced.toFixed(2)} used | ${accrued.toFixed(2)} accr | ${available.toFixed(2)} remn`, accrualsX, accLineY);
      accLineY += 8;
    });
  } else {
    doc.text("Sick: 0.00 used | 0.00 accr | 0.00 remn", accrualsX, contentY + 5);
    doc.text("PTO: 0.00 used | 0.00 accr | 0.00 remn", accrualsX, contentY + 13);
  }
  
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
  doc.text(`${formData.companyCity || "City"}, ${formData.companyState || "ST"}`, companyX, contentY + 21);
  doc.text(formData.companyZip || "00000", companyX, contentY + 29);

  // Draw vertical dividers in footer content area
  doc.setDrawColor(100, 100, 100);
  doc.setLineWidth(0.3);
  for (let i = 1; i < 4; i++) {
    const divX = m + i * footerColWidth;
    doc.line(divX, footerY + 12, divX, footerY + footerHeight);
  }
  
  // Draw gray border around footer content area (below blue headers)
  doc.setDrawColor(100, 100, 100);
  doc.setLineWidth(0.3);
  // Left border
  doc.line(m, footerY + 12, m, footerY + footerHeight);
  // Right border
  doc.line(pageWidth - m, footerY + 12, pageWidth - m, footerY + footerHeight);
  // Bottom border
  doc.line(m, footerY + footerHeight, pageWidth - m, footerY + footerHeight);
}

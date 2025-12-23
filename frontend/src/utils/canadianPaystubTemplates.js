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
export async function generateCanadianTemplateA(doc, data, pageWidth, pageHeight, margin) {
  const { formData, hours, overtime, commission = 0, regularPay, overtimePay, grossPay, cpp, ei, qpip, federalTax, provincialTax, totalTax, netPay, rate, startDate, endDate, payDate, payFrequency, stubNum, totalStubs,
    ytdRegularPay, ytdOvertimePay, ytdCommission = 0, ytdGrossPay, ytdCpp, ytdEi, ytdQpip, ytdFederalTax, ytdProvincialTax, ytdTotalTax, ytdNetPay, ytdHours,
    payType, workerType, isContractor, annualSalary,
    deductionsData, totalDeductions, contributionsData, totalContributions, ytdDeductions, ytdContributions,
    logoDataUrl, isQuebec, cppLabel
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
  doc.text(isContractor ? `SIN: ***-**-${formData.sin || "0000"}` : `***-***-${formData.sin || "0000"}`, rightStartX + boxWidth + 18, boxTop + 40);
  doc.text(formData.address || "", rightStartX + boxWidth + 18, boxTop + 52);
  doc.text(`${formData.city || ""}, ${formData.province || ""} ${formData.postalCode || ""}`, rightStartX + boxWidth + 18, boxTop + 64);

  y = Math.max(leftY, boxTop + boxHeight) + 20;

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
    const erTaxRows = [["Employer Contributions", "Current", "YTD"]];

    // Federal Income Tax
    empTaxRows.push([`Federal Income Tax`, `$${fmt(federalTax || 0)}`, `$${fmt(ytdFederalTax || 0)}`]);
    
    // CPP/QPP
    const cppRate = isQuebec ? "6.40" : "5.95";
    empTaxRows.push([`${cppLabel || 'CPP'} (${cppRate}%)`, `$${fmt(cpp)}`, `$${fmt(ytdCpp)}`]);
    erTaxRows.push([`${cppLabel || 'CPP'} (${cppRate}%)`, `$${fmt(cpp)}`, `$${fmt(ytdCpp)}`]);

    // EI
    const eiRate = isQuebec ? "1.32" : "1.66";
    empTaxRows.push([`EI (${eiRate}%)`, `$${fmt(ei)}`, `$${fmt(ytdEi)}`]);
    erTaxRows.push([`EI (${isQuebec ? '1.85' : '2.32'}%)`, `$${fmt(ei * 1.4)}`, `$${fmt(ytdEi * 1.4)}`]);

    // QPIP (Quebec only)
    if (isQuebec && qpip > 0) {
      empTaxRows.push([`QPIP (0.494%)`, `$${fmt(qpip)}`, `$${fmt(ytdQpip)}`]);
      erTaxRows.push([`QPIP (0.692%)`, `$${fmt(qpip * 1.4)}`, `$${fmt(ytdQpip * 1.4)}`]);
    }

    // Provincial Tax
    empTaxRows.push([`${formData.province || "Prov."} Income Tax`, `$${fmt(provincialTax)}`, `$${fmt(ytdProvincialTax)}`]);

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

// Template B: ADP-Style Earnings Statement (Programmatically Generated)
export function generateCanadianTemplateB(doc, data, pageWidth, pageHeight, margin) {
  const { 
    formData, hours, overtime, commission = 0, regularPay, overtimePay, grossPay, 
    cpp, ei, qpip, federalTax, provincialTax, totalTax, netPay, rate, 
    startDate, endDate, payDate, payFrequency, stubNum, totalStubs,
    ytdGrossPay = grossPay, ytdCpp = cpp, ytdEi = ei, ytdQpip = qpip,
    ytdFederalTax = federalTax, ytdProvincialTax = provincialTax,
    ytdRegularPay = regularPay, ytdOvertimePay = overtimePay, ytdCommission = 0,
    deductionsData = [], totalDeductions = 0, contributionsData = [], totalContributions = 0,
    ytdDeductions = 0, ytdContributions = 0,
    logoDataUrl, isQuebec, cppLabel
  } = data;
  
  // Helper to format currency
  const fmtCurrency = (n) => Number(n || 0).toLocaleString("en-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  
  // Helper function to format date as MM/DD/YYYY - handles timezone-safe parsing
  const formatDateADP = (date) => {
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

  const m = 25; // Left margin
  const rightCol = 320; // Right column start
  
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);

  // ==================== TOP HEADER ====================
  let y = 22;
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);
  
  // Header labels
  doc.text("Company Code", m, y);
  doc.text("Loc/Dept", m + 95, y);
  doc.text("Number", m + 135, y);
  doc.text("Page", m + 175, y);
  
  // Header underlines
  doc.line(m, y + 2, m + 80, y + 2);
  doc.line(m + 95, y + 2, m + 125, y + 2);
  doc.line(m + 135, y + 2, m + 165, y + 2);
  doc.line(m + 175, y + 2, m + 200, y + 2);
  
  // Helper to truncate text to fit within a max width
  const truncateText = (text, maxWidth) => {
    if (!text) return "";
    let truncated = text;
    while (doc.getTextWidth(truncated) > maxWidth && truncated.length > 0) {
      truncated = truncated.slice(0, -1);
    }
    return truncated;
  };
  
  // Header values - use form data if provided, otherwise generate random
  // Apply truncation to fit within column widths
  y += 10;
  const companyCode = formData.companyCode || `RJ/${(formData.company || "XXX").substring(0, 3).toUpperCase()}H ${Math.floor(10000000 + Math.random() * 90000000)}`;
  const locDept = formData.locDept || String(Math.floor(100 + Math.random() * 900)).padStart(3, '0');
  const checkNumber = formData.checkNumber || String(Math.floor(1000000 + Math.random() * 9000000));
  
  doc.setFont("helvetica", "bold");
  doc.text(truncateText(companyCode, 70), m, y);  // Max width before Loc/Dept
  doc.text(truncateText(locDept, 25), m + 95, y);  // Max width before Number
  doc.text(truncateText(checkNumber, 30), m + 135, y);  // Max width before Page
  doc.text("1 of 1", m + 175, y);
  
  // Company name and address - truncate to not overlap with Loc/Dept (max width ~65)
  const maxCompanyWidth = 65;
  y += 8;
  doc.setFont("helvetica", "normal");
  doc.text(truncateText(formData.company || "", maxCompanyWidth), m, y);
  y += 8;
  doc.text(truncateText(formData.companyAddress || "", maxCompanyWidth), m, y);
  y += 8;
  doc.text(truncateText(`${formData.companyCity || ""}, ${formData.companyState || ""} ${formData.companyZip || ""}`, maxCompanyWidth), m, y);

  // ==================== EARNINGS STATEMENT TITLE & LOGO (RIGHT SIDE) ====================
  // Title - both words in normal font
  doc.setFontSize(14);
  doc.setFont("helvetica", "normal");
  doc.text("Earnings Statement", rightCol, 25);
  
  // Logo on far right - only show if uploaded, otherwise leave blank
  if (logoDataUrl) {
    try {
      doc.addImage(logoDataUrl, 'PNG', pageWidth - m - 55, 12, 50, 22);
    } catch (e) {
      // Logo failed to load - leave blank
    }
  }
  // No fallback to company name - leave blank if no logo
  
  // Period info - below title
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text("Period Starting:", rightCol, 42);
  doc.text(formatDateADP(startDate), rightCol + 55, 42);
  doc.text("Period Ending:", rightCol, 51);
  doc.text(formatDateADP(endDate), rightCol + 55, 51);
  doc.text("Pay Date:", rightCol, 60);
  doc.text(formatDateADP(payDate), rightCol + 55, 60);

  // ==================== TAX INFO SECTION (LEFT) ====================
  y = 75;
  doc.setFontSize(7);
  
  // Taxable Marital Status
  doc.text("Taxable Marital Status:", m, y);
  const maritalStatus = formData.federalFilingStatus === 'married_jointly' || formData.federalFilingStatus === 'married_separately' ? 'Married' : 'Single';
  doc.text(maritalStatus, m + 85, y);
  
  // Tax Override
  doc.text("Tax Override:", m + 140, y);
  
  y += 10;
  doc.text("Exemptions/Allowances:", m, y);
  
  y += 10;
  doc.text("Federal:", m + 10, y);
  doc.text(formData.provinceAllowances || "1", m + 40, y);
  doc.text("Federal:", m + 140, y);
  
  y += 8;
  doc.text("State:", m + 10, y);
  doc.text(formData.provinceAllowances || "1", m + 40, y);
  doc.text("State:", m + 140, y);
  
  y += 8;
  doc.text("Local:", m + 10, y);
  doc.text("0", m + 40, y);
  doc.text("Local:", m + 140, y);
  
  y += 10;
  doc.text("Social Insurance Number:", m, y);
  const sinDisplay = formData.sin ? `***-**-${formData.sin}` : "***-**-****";
  doc.text(sinDisplay, m + 85, y);

  // ==================== EMPLOYEE NAME & ADDRESS (RIGHT) ====================
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(formData.name || "Employee Name", rightCol, 80);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(formData.address || "", rightCol, 92);
  doc.text(`${formData.city || ""}, ${formData.province || ""} ${formData.postalCode || ""}`, rightCol, 102);

  // ==================== EARNINGS TABLE ====================
  y = 135;
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  
  // Earnings header
  doc.text("Earnings", m, y);
  doc.text("rate", m + 80, y);
  doc.text("hours/units", m + 110, y);
  doc.text("this period", m + 160, y);
  doc.text("year to date", m + 210, y);
  doc.line(m, y + 2, m + 260, y + 2);
  
  // Regular row
  y += 12;
  doc.setFont("helvetica", "normal");
  doc.text("Regular", m, y);
  if (rate > 0) doc.text(fmtCurrency(rate), m + 80, y);
  doc.text(hours > 0 ? hours.toFixed(2) : "0.00", m + 120, y);
  doc.text(fmtCurrency(regularPay), m + 165, y);
  doc.text(fmtCurrency(ytdRegularPay), m + 215, y);
  
  // Overtime row
  y += 10;
  doc.text("Overtime", m, y);
  if (overtime > 0) {
    doc.text(fmtCurrency(rate * 1.5), m + 80, y);
    doc.text(overtime.toFixed(2), m + 120, y);
    doc.text(fmtCurrency(overtimePay), m + 165, y);
    doc.text(fmtCurrency(ytdOvertimePay), m + 215, y);
  }
  
  // Commission row
  if (commission > 0) {
    y += 10;
    doc.text("Commission", m, y);
    doc.text("", m + 80, y);
    doc.text("", m + 120, y);
    doc.text(fmtCurrency(commission), m + 165, y);
    doc.text(fmtCurrency(ytdCommission), m + 215, y);
  }
  
  // Gross Pay
  y += 15;
  doc.line(m + 50, y - 5, m + 260, y - 5);
  doc.setFont("helvetica", "bold");
  doc.text("Gross Pay", m + 50, y);
  doc.text(`$${fmtCurrency(grossPay)}`, m + 160, y);
  doc.text(`$${fmtCurrency(ytdGrossPay)}`, m + 210, y);

  // ==================== OTHER BENEFITS (RIGHT SIDE) ====================
  let rightY = 135;
  doc.setFont("helvetica", "bold");
  doc.text("Other Benefits and", rightCol, rightY);
  rightY += 8;
  doc.text("Information", rightCol, rightY);
  doc.text("this period", rightCol + 80, rightY - 8);
  doc.text("year to date", rightCol + 125, rightY - 8);
  doc.line(rightCol, rightY + 2, pageWidth - m, rightY + 2);
  
  rightY += 12;
  doc.setFont("helvetica", "normal");
  
  // Employer match
  if (contributionsData && contributionsData.length > 0) {
    contributionsData.forEach((c) => {
      if (c.type && c.type.includes('match')) {
        doc.text(`*${c.name || "Employer match"}`, rightCol, rightY);
        doc.text(fmtCurrency(c.currentAmount || 0), rightCol + 85, rightY);
        doc.text(fmtCurrency((c.currentAmount || 0) * (data.ytdPayPeriods || 1)), rightCol + 130, rightY);
        rightY += 10;
      }
    });
  }

  // ==================== STATUTORY DEDUCTIONS ====================
  y += 20;
  doc.setFont("helvetica", "bold");
  doc.text("Statutory Deductions", m, y);
  doc.text("this period", m + 160, y);
  doc.text("year to date", m + 210, y);
  doc.line(m, y + 2, m + 260, y + 2);
  
  y += 12;
  doc.setFont("helvetica", "normal");
  
  doc.text("Federal Income", m, y);
  doc.text(`-${fmtCurrency(federalTax)}`, m + 165, y);
  doc.text(fmtCurrency(ytdFederalTax), m + 215, y);
  
  y += 10;
  doc.text(cppLabel || "CPP", m, y);
  doc.text(`-${fmtCurrency(cpp)}`, m + 165, y);
  doc.text(fmtCurrency(ytdCpp), m + 215, y);
  
  y += 10;
  doc.text("EI", m, y);
  doc.text(`-${fmtCurrency(ei)}`, m + 165, y);
  doc.text(fmtCurrency(ytdEi), m + 215, y);
  
  if (isQuebec && qpip > 0) {
    y += 10;
    doc.text("QPIP", m, y);
    doc.text(`-${fmtCurrency(qpip)}`, m + 165, y);
    doc.text(fmtCurrency(ytdQpip), m + 215, y);
  }
  
  y += 10;
  doc.text(`${formData.province || "Prov."} Income Tax`, m, y);
  doc.text(`-${fmtCurrency(provincialTax)}`, m + 165, y);
  doc.text(fmtCurrency(ytdProvincialTax), m + 215, y);

  // ==================== DEPOSITS SECTION (RIGHT) ====================
  rightY += 15;
  doc.setFont("helvetica", "bold");
  doc.text("Deposits", rightCol, rightY);
  rightY += 8;
  doc.text("account number", rightCol, rightY);
  doc.text("transit/ABA", rightCol + 65, rightY);
  doc.text("amount", rightCol + 125, rightY);
  doc.line(rightCol, rightY + 2, pageWidth - m, rightY + 2);
  
  rightY += 12;
  doc.setFont("helvetica", "normal");
  const bankLast4 = formData.bank || "0000";
  const maskedAccount = `XXXXXX${bankLast4}`;
  doc.text(maskedAccount, rightCol, rightY);
  doc.text("XXXXXXXXX", rightCol + 65, rightY);
  doc.text(fmtCurrency(netPay), rightCol + 125, rightY);

  // ==================== VOLUNTARY DEDUCTIONS ====================
  y += 18;
  doc.setFont("helvetica", "bold");
  doc.text("Voluntary Deductions", m, y);
  doc.text("this period", m + 160, y);
  doc.text("year to date", m + 210, y);
  doc.line(m, y + 2, m + 260, y + 2);
  
  y += 12;
  doc.setFont("helvetica", "normal");
  
  if (deductionsData && deductionsData.length > 0) {
    deductionsData.forEach((d) => {
      doc.text(`*${d.name || d.type || "Deduction"}`, m, y);
      doc.text(`-${fmtCurrency(d.currentAmount || 0)}`, m + 165, y);
      doc.text(fmtCurrency((d.currentAmount || 0) * (data.ytdPayPeriods || 1)), m + 215, y);
      y += 10;
    });
  }
  
  if (contributionsData && contributionsData.length > 0) {
    contributionsData.forEach((c) => {
      if (!c.type || !c.type.includes('match')) {
        doc.text(`*${c.name || c.type || "Contribution"}`, m, y);
        doc.text(`-${fmtCurrency(c.currentAmount || 0)}`, m + 165, y);
        doc.text(fmtCurrency((c.currentAmount || 0) * (data.ytdPayPeriods || 1)), m + 215, y);
        y += 10;
      }
    });
  }

  // ==================== NET PAY ====================
  y += 10;
  doc.line(m, y - 5, m + 260, y - 5);
  doc.setFont("helvetica", "bold");
  doc.text("Net Pay", m, y);
  doc.text(`$${fmtCurrency(netPay)}`, m + 160, y);

  // ==================== FEDERAL TAXABLE WAGES NOTE ====================
  const taxableWages = grossPay - (totalDeductions || 0);
  y = Math.max(y, rightY) + 40;
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text(`Your federal taxable wages this period are $${fmtCurrency(taxableWages)}`, rightCol, y);
  y += 8;
  doc.text("* Excluded from Federal taxable wages", rightCol, y);

  // ==================== BOTTOM DIVIDER ====================
  y += 25;
  doc.setLineWidth(0.5);
  doc.line(m, y, pageWidth - m, y);

  // ==================== CHECK STUB SECTION ====================
  y += 15;
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  
  // Company info repeated
  doc.text(formData.company || "Company Name", m, y);
  doc.text(formData.companyAddress || "", m, y + 8);
  doc.text(`${formData.companyCity || ""}, ${formData.companyState || ""} ${formData.companyZip || ""}`, m, y + 16);
  
  // Pay Date
  doc.setFont("helvetica", "bold");
  doc.text("Pay Date:", rightCol + 30, y);
  doc.setFont("helvetica", "normal");
  doc.text(formatDateADP(payDate), rightCol + 65, y);

  // ==================== THIS IS NOT A CHECK WATERMARK ====================
  y += 35;
  doc.setFontSize(12);
  doc.setTextColor(180, 180, 180);
  doc.setFont("helvetica", "bold");
  
  // Draw diagonal watermark text
  const watermarkText = "THIS IS NOT A CHECK";
  const centerX = pageWidth / 2;
  doc.text(watermarkText, centerX, y, { align: 'center', angle: -12 });
  
  doc.setTextColor(0, 0, 0);

  // ==================== BOTTOM DEPOSIT TABLE ====================
  y += 30;
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.line(m, y, pageWidth - m, y);
  
  y += 10;
  doc.text("Deposited to the account", m, y);
  doc.text("account number", m + 150, y);
  doc.text("transit/ABA", rightCol, y);
  doc.text("amount", rightCol + 80, y);
  
  y += 10;
  doc.setFont("helvetica", "normal");
  doc.text(`${formData.bankName || "Bank"} DirectDeposit`, m, y);
  doc.text(maskedAccount, m + 150, y);
  doc.text("XXXXXXXXX", rightCol, y);
  doc.text(fmtCurrency(netPay), rightCol + 80, y);

  // ==================== EMPLOYEE INFO AT BOTTOM ====================
  y += 25;
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text(formData.name || "Employee Name", m, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(formData.address || "", m, y + 10);
  doc.text(`${formData.city || ""}, ${formData.province || ""} ${formData.postalCode || ""}`, m, y + 18);
}

// Template C: Workday Style Professional Payslip - MasterBrand/Workday Layout (Canadian)
export async function generateCanadianTemplateC(doc, data, pageWidth, pageHeight, margin) {
  try {
  const { formData, hours = 0, overtime = 0, commission = 0, regularPay = 0, overtimePay = 0, grossPay = 0, cpp = 0, ei = 0, qpip = 0, federalTax = 0, provincialTax = 0, totalTax = 0, netPay = 0, rate = 0, startDate, endDate, payDate, payFrequency = 'biweekly', stubNum = 0, totalStubs = 1,
    ytdRegularPay = 0, ytdOvertimePay = 0, ytdCommission = 0, ytdGrossPay = 0, ytdCpp = 0, ytdEi = 0, ytdQpip = 0, ytdFederalTax = 0, ytdProvincialTax = 0, ytdTotalTax = 0, ytdNetPay = 0, ytdHours = 0,
    deductionsData = [], totalDeductions = 0, contributionsData = [], totalContributions = 0, ytdDeductions = 0, ytdContributions = 0, ytdPayPeriods = 1,
    logoDataUrl, isQuebec, cppLabel, absencePlansData = [], payType = 'hourly'
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
  const companyLine1 = `${formData.company || "Company Name"}   ${formData.companyAddress || "One Company Drive"} ${formData.companyCity || "City"}, ${formData.companyState || formData.province || "Prov"} ${formData.companyZip || formData.postalCode || ""}   ${formData.companyPhone || "+1 (000) 000-0000"}`;
  doc.text(companyLine1, pageWidth / 2, y, { align: 'center' });
  y += 10;
  
  // Employee address line
  const employeeLine = `${formData.name || "Employee Name"}   ${formData.address || ""} ${formData.city || ""}, ${formData.province || ""} ${formData.postalCode || ""}`;
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
        if (align === 'right') {
          doc.text(String(cell), currentX + colWidths[colIndex] - 3, y + 7, { align: 'right' });
        } else if (align === 'center') {
          doc.text(String(cell), currentX + colWidths[colIndex] / 2, y + 7, { align: 'center' });
        } else {
          doc.text(String(cell), currentX + 3, y + 7);
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
  const sumRows = [
    ["Current", hours.toFixed(2), fmt(grossPay), fmt(totalDeductions), fmt(totalTax), "0.00", fmt(netPay)],
    ["YTD", currentYtdHours.toFixed(2), fmt(ytdGrossPay || grossPay), fmt(ytdDeductions || totalDeductions), fmt(ytdTotalTax || totalTax), "0.00", fmt(ytdNetPay || netPay)]
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
  drawWorkdayTable("Earning", earnCols, earnWidths, earnRows, { rightAlignFrom: 2, whiteHeader: true, borderAboveLastRow: true, noVerticalDividers: true });

  // ========== 4. EMPLOYEE TAXES SECTION ==========
  const taxCols = ["Description", "Amount", "YTD"];
  const taxWidths = [usableWidth * 0.60, usableWidth * 0.20, usableWidth * 0.20];
  const taxRows = [
    [cppLabel || "CPP", fmt(cpp), fmt(ytdCpp || cpp)],
    ["EI", fmt(ei), fmt(ytdEi || ei)],
    ["Federal Withholding", fmt(federalTax || 0), fmt(ytdFederalTax || federalTax || 0)],
    [`${formData.province || 'Prov.'} Tax`, fmt(provincialTax), fmt(ytdProvincialTax || provincialTax)]
  ];
  if (isQuebec && qpip > 0) {
    taxRows.splice(2, 0, ["QPIP", fmt(qpip), fmt(ytdQpip || qpip)]);
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
  
  // Separate deductions into pre-tax and post-tax
  const preTaxDeductionRows = [];
  const postTaxDeductionRows = [];
  
  if (deductionsData && deductionsData.length > 0) {
    deductionsData.forEach(d => {
      const row = [d.name || "Deduction", fmt(d.currentAmount || 0), fmt((d.currentAmount || 0) * (ytdPayPeriods || 1))];
      if (d.preTax === true || d.preTax === undefined) {
        preTaxDeductionRows.push(row);
      } else {
        postTaxDeductionRows.push(row);
      }
    });
  }
  
  // Add placeholder if no deductions
  if (preTaxDeductionRows.length === 0) {
    preTaxDeductionRows.push(["No Pre Tax Deductions", "0.00", "0.00"]);
  }
  if (postTaxDeductionRows.length === 0) {
    postTaxDeductionRows.push(["No Post Tax Deductions", "0.00", "0.00"]);
  }
  
  // Calculate totals
  const preTaxTotal = deductionsData ? deductionsData.filter(d => d.preTax === true || d.preTax === undefined).reduce((sum, d) => sum + (d.currentAmount || 0), 0) : 0;
  const postTaxTotal = deductionsData ? deductionsData.filter(d => d.preTax === false).reduce((sum, d) => sum + (d.currentAmount || 0), 0) : 0;
  
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
  
  // Build Taxable Wages rows (Canadian version with CPP/QPP and EI)
  const federalTaxableWages = grossPay - totalDeductions;
  const taxableWagesRows = [
    [`${cppLabel || "CPP"} – Taxable Wages`, fmt(grossPay), fmt(ytdGrossPay || grossPay)],
    ["EI – Taxable Wages", fmt(grossPay), fmt(ytdGrossPay || grossPay)],
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
  
  // Build Tax Withholding rows (Canadian version with Provincial instead of State)
  const maritalStatusMap = {
    'single': 'Single (Never Married)',
    'married': 'Married',
    'common_law': 'Living Common-Law',
    'separated': 'Separated',
    'divorced': 'Divorced',
    'widowed': 'Widowed'
  };
  const maritalStatusDisplay = maritalStatusMap[formData.maritalStatus] || 'Single (Never Married)';
  const federalAllowances = formData.federalAllowances || "0";
  const provincialAllowances = formData.provincialAllowances || "0";
  
  const withholdingCols = ["", "Federal", "Provincial"];
  const halfTableWidth = (usableWidth - 8) / 2;
  const withholdingColWidths = [halfTableWidth * 0.40, halfTableWidth * 0.30, halfTableWidth * 0.30];
  const withholdingRows = [
    ["Marital Status", maritalStatusDisplay, ""],
    ["Allowances", federalAllowances, provincialAllowances]
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
  const paymentCols = ["Bank", "Account Name", "Account Number", "CAD Amount", "Amount"];
  const paymentWidths = [usableWidth * 0.15, usableWidth * 0.25, usableWidth * 0.20, usableWidth * 0.20, usableWidth * 0.20];
  const bankName = formData.bankName || "Bank";
  const last4 = (formData.bank || '0000').slice(-4);
  const accountName = `${bankName} ****${last4}`;
  const accountNumber = `****${last4}`;
  const paymentRows = [
    [bankName, accountName, accountNumber, "" /* `${fmt(netPay)}` */, `${fmt(netPay)} CAD`],
    ["", "", "", "", ""]
  ];
  drawWorkdayTable("Payment Information", paymentCols, paymentWidths, paymentRows, { rightAlignFrom: 3, whiteHeader: true, noVerticalDividers: true });

  } catch (error) {
    console.error("Error generating Canadian Template C:", error);
    doc.setFontSize(12);
    doc.setTextColor(255, 0, 0);
    doc.text("Error generating document. Please check your inputs.", 40, 100);
  }
}
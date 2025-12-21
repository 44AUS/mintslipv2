// Canadian Paystub Templates
// Similar to US templates but with Canadian tax structure

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

// Number formatter (adds commas) - Canadian format
function fmt(n) {
  return Number(n).toLocaleString("en-CA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// Format date as "Mar 10, 2025"
function formatDate(date) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const d = new Date(date);
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

// Template A: Gusto-Style Professional (Canadian Version)
export async function generateCanadianTemplateA(doc, data, pageWidth, pageHeight, margin) {
  const { formData, hours, overtime, regularPay, overtimePay, grossPay, cpp, ei, qpip, federalTax, provincialTax, totalTax, netPay, rate, startDate, endDate, payDate, payFrequency, stubNum, totalStubs,
    ytdRegularPay, ytdOvertimePay, ytdGrossPay, ytdCpp, ytdEi, ytdQpip, ytdFederalTax, ytdProvincialTax, ytdTotalTax, ytdNetPay, ytdHours,
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
  const maxLogoWidth = 120;
  const maxLogoHeight = 35;

  // Load and draw logo
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
          doc.addImage(logoDataUrl, 'PNG', logoX, top, renderWidth, renderHeight);
          resolve();
        };
        img.onerror = () => {
          doc.setFont("helvetica", "bold");
          doc.setFontSize(18);
          doc.setTextColor(0, 168, 161);
          doc.text("Gusto", logoX, top + 20);
          resolve();
        };
      });
    } catch (e) {
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
  doc.setTextColor(51, 51, 51);
  doc.text(statementTitle, logoX, leftY);
  leftY += 18;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(102, 102, 102);
  doc.text(`Pay Period: ${formatDate(startDate)} - ${formatDate(endDate)}`, logoX, leftY);
  leftY += 14;
  doc.text(`${formData.name || ''} (...******${formData.bank ? formData.bank.slice(-4) : '0000'})`, logoX, leftY);

  // Right side: company info
  const rightX = pageWidth - margin;
  let rightY = top;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(51, 51, 51);
  doc.text(formData.company || "Company Name", rightX, rightY, { align: "right" });
  rightY += 14;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(102, 102, 102);
  if (formData.companyAddress) {
    doc.text(formData.companyAddress, rightX, rightY, { align: "right" });
    rightY += 12;
  }
  doc.text(`${formData.companyCity || ''}, ${formData.companyProvince || ''} ${formData.companyPostalCode || ''}`, rightX, rightY, { align: "right" });
  rightY += 12;
  if (formData.companyPhone) {
    doc.text(formData.companyPhone, rightX, rightY, { align: "right" });
  }

  y = leftY + 30;

  // ========== EARNINGS SECTION ==========
  doc.setFillColor(0, 168, 161);
  doc.rect(left, y, usableWidth, 22, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text("EARNINGS", left + 8, y + 14);
  doc.text("RATE", left + usableWidth * 0.35, y + 14);
  doc.text("HOURS", left + usableWidth * 0.5, y + 14);
  doc.text("CURRENT", left + usableWidth * 0.65, y + 14);
  doc.text("YTD", left + usableWidth * 0.85, y + 14);
  y += 22;

  // Earnings rows
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(51, 51, 51);
  
  const rowHeight = 18;
  
  if (payType === "salary") {
    // Salary row
    doc.setFillColor(249, 249, 249);
    doc.rect(left, y, usableWidth, rowHeight, "F");
    doc.text("Salary", left + 8, y + 12);
    doc.text("-", left + usableWidth * 0.35, y + 12);
    doc.text("-", left + usableWidth * 0.5, y + 12);
    doc.text(`$${fmt(regularPay)}`, left + usableWidth * 0.65, y + 12);
    doc.text(`$${fmt(ytdRegularPay)}`, left + usableWidth * 0.85, y + 12);
    y += rowHeight;
  } else {
    // Regular hours row
    doc.setFillColor(249, 249, 249);
    doc.rect(left, y, usableWidth, rowHeight, "F");
    doc.text("Regular", left + 8, y + 12);
    doc.text(`$${fmt(rate)}/hr`, left + usableWidth * 0.35, y + 12);
    doc.text(`${hours}`, left + usableWidth * 0.5, y + 12);
    doc.text(`$${fmt(regularPay)}`, left + usableWidth * 0.65, y + 12);
    doc.text(`$${fmt(ytdRegularPay)}`, left + usableWidth * 0.85, y + 12);
    y += rowHeight;

    // Overtime row (if applicable)
    if (overtime > 0 && !isContractor) {
      doc.setFillColor(255, 255, 255);
      doc.rect(left, y, usableWidth, rowHeight, "F");
      doc.text("Overtime", left + 8, y + 12);
      doc.text(`$${fmt(overtimeRate)}/hr`, left + usableWidth * 0.35, y + 12);
      doc.text(`${overtime}`, left + usableWidth * 0.5, y + 12);
      doc.text(`$${fmt(overtimePay)}`, left + usableWidth * 0.65, y + 12);
      doc.text(`$${fmt(ytdOvertimePay)}`, left + usableWidth * 0.85, y + 12);
      y += rowHeight;
    }
  }

  // Gross Pay row
  doc.setFillColor(230, 247, 246);
  doc.rect(left, y, usableWidth, rowHeight, "F");
  doc.setFont("helvetica", "bold");
  doc.text("Gross Pay", left + 8, y + 12);
  doc.text("", left + usableWidth * 0.35, y + 12);
  doc.text(payType === "salary" ? "-" : `${totalHours}`, left + usableWidth * 0.5, y + 12);
  doc.text(`$${fmt(grossPay)}`, left + usableWidth * 0.65, y + 12);
  doc.text(`$${fmt(ytdGrossPay)}`, left + usableWidth * 0.85, y + 12);
  y += rowHeight + 15;

  // ========== DEDUCTIONS SECTION ==========
  if (!isContractor) {
    doc.setFillColor(0, 168, 161);
    doc.rect(left, y, usableWidth, 22, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.text("DEDUCTIONS", left + 8, y + 14);
    doc.text("CURRENT", left + usableWidth * 0.65, y + 14);
    doc.text("YTD", left + usableWidth * 0.85, y + 14);
    y += 22;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(51, 51, 51);

    // CPP/QPP row
    doc.setFillColor(249, 249, 249);
    doc.rect(left, y, usableWidth, rowHeight, "F");
    doc.text(cppLabel || 'CPP', left + 8, y + 12);
    doc.text(`$${fmt(cpp)}`, left + usableWidth * 0.65, y + 12);
    doc.text(`$${fmt(ytdCpp)}`, left + usableWidth * 0.85, y + 12);
    y += rowHeight;

    // EI row
    doc.setFillColor(255, 255, 255);
    doc.rect(left, y, usableWidth, rowHeight, "F");
    doc.text("EI", left + 8, y + 12);
    doc.text(`$${fmt(ei)}`, left + usableWidth * 0.65, y + 12);
    doc.text(`$${fmt(ytdEi)}`, left + usableWidth * 0.85, y + 12);
    y += rowHeight;

    // QPIP row (Quebec only)
    if (isQuebec && qpip > 0) {
      doc.setFillColor(249, 249, 249);
      doc.rect(left, y, usableWidth, rowHeight, "F");
      doc.text("QPIP", left + 8, y + 12);
      doc.text(`$${fmt(qpip)}`, left + usableWidth * 0.65, y + 12);
      doc.text(`$${fmt(ytdQpip)}`, left + usableWidth * 0.85, y + 12);
      y += rowHeight;
    }

    // Federal Tax row
    doc.setFillColor(isQuebec ? 255 : 249, isQuebec ? 255 : 249, isQuebec ? 255 : 249);
    doc.rect(left, y, usableWidth, rowHeight, "F");
    doc.text("Federal Income Tax", left + 8, y + 12);
    doc.text(`$${fmt(federalTax)}`, left + usableWidth * 0.65, y + 12);
    doc.text(`$${fmt(ytdFederalTax)}`, left + usableWidth * 0.85, y + 12);
    y += rowHeight;

    // Provincial Tax row
    doc.setFillColor(isQuebec ? 249 : 255, isQuebec ? 249 : 255, isQuebec ? 249 : 255);
    doc.rect(left, y, usableWidth, rowHeight, "F");
    doc.text("Provincial Income Tax", left + 8, y + 12);
    doc.text(`$${fmt(provincialTax)}`, left + usableWidth * 0.65, y + 12);
    doc.text(`$${fmt(ytdProvincialTax)}`, left + usableWidth * 0.85, y + 12);
    y += rowHeight;

    // Custom deductions
    if (deductionsData && deductionsData.length > 0) {
      deductionsData.forEach((d, i) => {
        const bg = i % 2 === 0 ? 249 : 255;
        doc.setFillColor(bg, bg, bg);
        doc.rect(left, y, usableWidth, rowHeight, "F");
        doc.text(d.name || d.type, left + 8, y + 12);
        doc.text(`$${fmt(d.amount)}`, left + usableWidth * 0.65, y + 12);
        doc.text(`$${fmt(d.ytdAmount || d.amount)}`, left + usableWidth * 0.85, y + 12);
        y += rowHeight;
      });
    }

    // Total Deductions row
    doc.setFillColor(230, 247, 246);
    doc.rect(left, y, usableWidth, rowHeight, "F");
    doc.setFont("helvetica", "bold");
    doc.text("Total Deductions", left + 8, y + 12);
    doc.text(`$${fmt(totalTax + totalDeductions)}`, left + usableWidth * 0.65, y + 12);
    doc.text(`$${fmt(ytdTotalTax + ytdDeductions)}`, left + usableWidth * 0.85, y + 12);
    y += rowHeight + 15;
  } else {
    // Contractor notice
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(102, 102, 102);
    doc.text("As an independent contractor, you are responsible for your own tax remittances to CRA.", left, y);
    y += 20;
  }

  // ========== NET PAY SECTION ==========
  doc.setFillColor(0, 168, 161);
  doc.rect(left, y, usableWidth, 30, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text("NET PAY", left + 8, y + 20);
  doc.text(`$${fmt(netPay)}`, left + usableWidth * 0.65, y + 20);
  doc.text(`$${fmt(ytdNetPay)}`, left + usableWidth * 0.85, y + 20);
  y += 45;

  // ========== EMPLOYEE INFO SECTION ==========
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(51, 51, 51);
  doc.text(`${workerLabel} Information`, left, y);
  y += 14;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(102, 102, 102);
  
  const infoColWidth = usableWidth / 3;
  doc.text(`Name: ${formData.name || ''}`, left, y);
  doc.text(`SIN: ***-***-${formData.sin ? formData.sin.slice(-3) : '000'}`, left + infoColWidth, y);
  doc.text(`${hireLabel}: ${formData.hireDate || ''}`, left + infoColWidth * 2, y);
  y += 12;
  
  doc.text(`Address: ${formData.address || ''}`, left, y);
  y += 12;
  doc.text(`${formData.city || ''}, ${formData.province || ''} ${formData.postalCode || ''}`, left, y);

  // Footer
  y = pageHeight - 30;
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(`Pay stub ${stubNum} of ${totalStubs} | Pay Date: ${formatDate(payDate)}`, pageWidth / 2, y, { align: "center" });
}

// Template B: ADP-Style Professional (Canadian Version)
export async function generateCanadianTemplateB(doc, data, pageWidth, pageHeight, margin) {
  const { formData, hours = 0, overtime = 0, regularPay = 0, overtimePay = 0, grossPay = 0, cpp = 0, ei = 0, qpip = 0, federalTax = 0, provincialTax = 0, totalTax = 0, netPay = 0, rate = 0, startDate, endDate, payDate, payFrequency = 'biweekly', stubNum = 1, totalStubs = 1,
    ytdRegularPay = 0, ytdOvertimePay = 0, ytdGrossPay = 0, ytdCpp = 0, ytdEi = 0, ytdQpip = 0, ytdFederalTax = 0, ytdProvincialTax = 0, ytdTotalTax = 0, ytdNetPay = 0, ytdHours = 0,
    payType = 'hourly', workerType = 'employee', isContractor = false, annualSalary = 0,
    deductionsData = [], totalDeductions = 0, contributionsData = [], totalContributions = 0, ytdDeductions = 0, ytdContributions = 0,
    logoDataUrl, isQuebec, cppLabel
  } = data;

  const m = margin;
  const usableWidth = pageWidth - 2 * m;
  let y = 15;
  const totalHours = Number(hours) + Number(overtime || 0);

  // ========== ADP HEADER ==========
  // Company Code / Loc/Dept / Number / Page header
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);
  
  const headerY = y;
  doc.text("Company Code", m, headerY);
  doc.text("Loc/Dept", m + 80, headerY);
  doc.text("Number", m + 130, headerY);
  doc.text("Page", pageWidth - m - 20, headerY);
  
  doc.setFont("helvetica", "bold");
  doc.text(formData.companyCode || "COMPANY", m, headerY + 8);
  doc.text(formData.locDept || "001", m + 80, headerY + 8);
  doc.text(formData.checkNumber || "000001", m + 130, headerY + 8);
  doc.text(`${stubNum}`, pageWidth - m - 20, headerY + 8);
  
  y = headerY + 20;
  
  // Earnings Statement title with ADP logo
  doc.setFillColor(255, 255, 255);
  doc.rect(m, y, usableWidth, 18, "F");
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text("Earnings Statement", m, y + 12);
  
  // ADP Logo on right
  doc.setTextColor(255, 0, 0);
  doc.setFontSize(16);
  doc.text("ADP", pageWidth - m - 25, y + 12);
  
  y += 25;
  
  // Period Starting / Period Ending / Pay Date
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);
  
  doc.text("Period Starting", m, y);
  doc.text("Period Ending", m + 70, y);
  doc.text("Pay Date", m + 140, y);
  
  doc.setFont("helvetica", "bold");
  doc.text(formatDate(startDate), m, y + 8);
  doc.text(formatDate(endDate), m + 70, y + 8);
  doc.text(formatDate(payDate), m + 140, y + 8);
  
  // Employee name and address on right
  const rightColX = pageWidth - m - 100;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text(formData.name || "Employee Name", rightColX, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(formData.address || "", rightColX, y + 10);
  doc.text(`${formData.city || ""}, ${formData.province || ""} ${formData.postalCode || ""}`, rightColX, y + 18);
  
  y += 35;
  
  // ========== EARNINGS TABLE ==========
  doc.setFillColor(220, 220, 220);
  doc.rect(m, y, usableWidth, 12, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);
  
  const col1 = m + 5;
  const col2 = m + 80;
  const col3 = m + 120;
  const col4 = m + 160;
  const col5 = pageWidth - m - 40;
  
  doc.text("Earnings", col1, y + 8);
  doc.text("Rate", col2, y + 8);
  doc.text("Hours/Units", col3, y + 8);
  doc.text("This Period", col4, y + 8);
  doc.text("Year to Date", col5, y + 8);
  
  y += 12;
  
  doc.setFont("helvetica", "normal");
  const rowH = 10;
  
  if (payType === "salary") {
    doc.text("Salary", col1, y + 7);
    doc.text("-", col2, y + 7);
    doc.text("-", col3, y + 7);
    doc.text(`$${fmt(regularPay)}`, col4, y + 7);
    doc.text(`$${fmt(ytdRegularPay)}`, col5, y + 7);
    y += rowH;
  } else {
    doc.text("Regular", col1, y + 7);
    doc.text(`$${fmt(rate)}`, col2, y + 7);
    doc.text(`${hours}`, col3, y + 7);
    doc.text(`$${fmt(regularPay)}`, col4, y + 7);
    doc.text(`$${fmt(ytdRegularPay)}`, col5, y + 7);
    y += rowH;
    
    if (overtime > 0) {
      doc.text("Overtime", col1, y + 7);
      doc.text(`$${fmt(rate * 1.5)}`, col2, y + 7);
      doc.text(`${overtime}`, col3, y + 7);
      doc.text(`$${fmt(overtimePay)}`, col4, y + 7);
      doc.text(`$${fmt(ytdOvertimePay)}`, col5, y + 7);
      y += rowH;
    }
  }
  
  // Gross line
  doc.setFont("helvetica", "bold");
  doc.text("Gross Pay", col1, y + 7);
  doc.text(`$${fmt(grossPay)}`, col4, y + 7);
  doc.text(`$${fmt(ytdGrossPay)}`, col5, y + 7);
  y += rowH + 5;
  
  // ========== STATUTORY DEDUCTIONS ==========
  if (!isContractor) {
    doc.setFillColor(220, 220, 220);
    doc.rect(m, y, usableWidth, 12, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("Statutory Deductions", col1, y + 8);
    doc.text("This Period", col4, y + 8);
    doc.text("Year to Date", col5, y + 8);
    y += 12;
    
    doc.setFont("helvetica", "normal");
    
    // CPP/QPP
    doc.text(cppLabel || "CPP", col1, y + 7);
    doc.text(`$${fmt(cpp)}`, col4, y + 7);
    doc.text(`$${fmt(ytdCpp)}`, col5, y + 7);
    y += rowH;
    
    // EI
    doc.text("EI", col1, y + 7);
    doc.text(`$${fmt(ei)}`, col4, y + 7);
    doc.text(`$${fmt(ytdEi)}`, col5, y + 7);
    y += rowH;
    
    // QPIP (Quebec only)
    if (isQuebec && qpip > 0) {
      doc.text("QPIP", col1, y + 7);
      doc.text(`$${fmt(qpip)}`, col4, y + 7);
      doc.text(`$${fmt(ytdQpip)}`, col5, y + 7);
      y += rowH;
    }
    
    // Federal Income Tax
    doc.text("Federal Income Tax", col1, y + 7);
    doc.text(`$${fmt(federalTax)}`, col4, y + 7);
    doc.text(`$${fmt(ytdFederalTax)}`, col5, y + 7);
    y += rowH;
    
    // Provincial Income Tax
    doc.text("Provincial Income Tax", col1, y + 7);
    doc.text(`$${fmt(provincialTax)}`, col4, y + 7);
    doc.text(`$${fmt(ytdProvincialTax)}`, col5, y + 7);
    y += rowH;
    
    // Voluntary Deductions if any
    if (deductionsData && deductionsData.length > 0) {
      y += 5;
      doc.setFillColor(220, 220, 220);
      doc.rect(m, y, usableWidth, 12, "F");
      doc.setFont("helvetica", "bold");
      doc.text("Voluntary Deductions *", col1, y + 8);
      y += 12;
      
      doc.setFont("helvetica", "normal");
      deductionsData.forEach(d => {
        doc.text(d.name || d.type, col1, y + 7);
        doc.text(`$${fmt(d.amount)}`, col4, y + 7);
        doc.text(`$${fmt(d.ytdAmount || d.amount)}`, col5, y + 7);
        y += rowH;
      });
    }
    
    y += 5;
  }
  
  // ========== NET PAY ==========
  doc.setFillColor(200, 200, 200);
  doc.rect(m, y, usableWidth, 14, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Net Pay", col1, y + 10);
  doc.text(`$${fmt(netPay)}`, col4, y + 10);
  doc.text(`$${fmt(ytdNetPay)}`, col5, y + 10);
  y += 20;
  
  // ========== DEPOSIT INFO ==========
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text("Other Benefits and Information", m, y);
  y += 10;
  
  doc.setFillColor(240, 240, 240);
  doc.rect(m, y, usableWidth, 10, "F");
  doc.setFont("helvetica", "bold");
  doc.text("Deposits", m + 5, y + 7);
  doc.text("Account Number", m + 80, y + 7);
  doc.text("Transit/Inst", m + 150, y + 7);
  doc.text("Amount", pageWidth - m - 40, y + 7);
  y += 10;
  
  doc.setFont("helvetica", "normal");
  doc.text("Direct Deposit", m + 5, y + 7);
  doc.text(`****${formData.bank || '0000'}`, m + 80, y + 7);
  doc.text(formData.bankName || "Bank", m + 150, y + 7);
  doc.text(`$${fmt(netPay)}`, pageWidth - m - 40, y + 7);
  y += 15;
  
  // Footer note
  doc.setFontSize(6);
  doc.setTextColor(100, 100, 100);
  doc.text("* Items excluded from taxable wages", m, y);
  
  // Bottom stub
  y = pageHeight - 60;
  doc.setDrawColor(150, 150, 150);
  doc.setLineDash([2, 2]);
  doc.line(m, y, pageWidth - m, y);
  doc.setLineDash([]);
  
  y += 10;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text("THIS IS NOT A CHEQUE", pageWidth / 2, y, { align: "center" });
  
  y += 15;
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text(`Deposited to account ending in ${formData.bank || '0000'}`, m, y);
  doc.text(`Amount: $${fmt(netPay)}`, m + 120, y);
  doc.text(`Pay Date: ${formatDate(payDate)}`, pageWidth - m - 60, y);
}

// Template C: Workday-Style Professional (Canadian Version)
export async function generateCanadianTemplateC(doc, data, pageWidth, pageHeight, margin) {
  const { formData, hours = 0, overtime = 0, regularPay = 0, overtimePay = 0, grossPay = 0, cpp = 0, ei = 0, qpip = 0, federalTax = 0, provincialTax = 0, totalTax = 0, netPay = 0, rate = 0, startDate, endDate, payDate, payFrequency = 'biweekly', stubNum = 0, totalStubs = 1,
    ytdRegularPay = 0, ytdOvertimePay = 0, ytdGrossPay = 0, ytdCpp = 0, ytdEi = 0, ytdQpip = 0, ytdFederalTax = 0, ytdProvincialTax = 0, ytdTotalTax = 0, ytdNetPay = 0,
    deductionsData = [], totalDeductions = 0, contributionsData = [], totalContributions = 0, ytdDeductions = 0, ytdContributions = 0, ytdPayPeriods = 1,
    logoDataUrl, isQuebec, cppLabel, payType = 'hourly'
  } = data || {};
  
  const m = 30;
  const usableWidth = pageWidth - 2 * m;
  let y = 25;
  
  // ========== HEADER LOGO/NAME ==========
  const isPreview = data.isPreview || false;
  const maxLogoWidth = 100;
  const maxLogoHeight = 30;
  
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
          doc.addImage(logoDataUrl, 'PNG', m, y - 10, renderWidth, renderHeight);
          resolve();
        };
        img.onerror = () => {
          doc.setFontSize(14); doc.setTextColor(0, 0, 0); doc.setFont("helvetica", "bold"); doc.text(formData.company || "Company Name", m, y);
          resolve();
        };
      });
      y += 30;
    } catch (e) {
      doc.setFontSize(14); doc.setTextColor(0, 0, 0); doc.setFont("helvetica", "bold"); doc.text(formData.company || "Company Name", m, y);
      y += 12;
    }
  } else if (isPreview) {
    doc.setFontSize(18); 
    doc.setTextColor(0, 85, 164);
    doc.setFont("helvetica", "bold"); 
    doc.text("WORKDAY", m, y + 10);
    y += 30;
  } else {
    doc.setFontSize(14); doc.setTextColor(0, 0, 0); doc.setFont("helvetica", "bold"); doc.text(formData.company || "Company Name", m, y);
    y += 12;
  }
  
  doc.setFontSize(8); doc.setFont("helvetica", "normal"); doc.setTextColor(60, 60, 60);
  doc.text(`${formData.companyAddress || ""}, ${formData.companyCity || ""}, ${formData.companyProvince || ""} ${formData.companyPostalCode || ""}`, m, y);
  y += 10;
  doc.text(formData.companyPhone || "", m, y);
  
  doc.setFontSize(9); doc.setTextColor(0, 0, 0);
  doc.text(formData.name || "", pageWidth - m - 150, 25);
  doc.setFontSize(8); doc.setTextColor(60, 60, 60);
  doc.text(formData.address || "", pageWidth - m - 150, 37);
  doc.text(`${formData.city || ""}, ${formData.province || ""} ${formData.postalCode || ""}`, pageWidth - m - 150, 47);
  
  y += 15;

  // Helper function for tables
  const drawTableSection = (title, columns, colWidths, rowsData, isBoldLastRow = false, showInternalVerticals = true) => {
    const startY = y;
    const titleHeight = title ? 14 : 0;
    const headerHeight = 12;
    const rowHeight = 10;

    if (title) {
      doc.setFillColor(80, 80, 80);
      doc.rect(m, y, usableWidth, titleHeight, 'F');
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(255, 255, 255);
      doc.text(title, pageWidth / 2, y + 10, { align: 'center' });
      y += titleHeight;
    }

    doc.setFillColor(230, 230, 230);
    doc.rect(m, y, usableWidth, headerHeight, 'F');
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);

    let currentX = m;
    columns.forEach((col, i) => {
      const colW = colWidths[i];
      doc.text(col, currentX + 3, y + 8);
      currentX += colW;
    });
    y += headerHeight;

    doc.setFont("helvetica", "normal");
    rowsData.forEach((row, rowIndex) => {
      const isLastRow = rowIndex === rowsData.length - 1;
      if (isLastRow && isBoldLastRow) {
        doc.setFillColor(210, 210, 210);
        doc.rect(m, y, usableWidth, rowHeight, 'F');
        doc.setFont("helvetica", "bold");
      } else {
        doc.setFillColor(rowIndex % 2 === 0 ? 250 : 240, rowIndex % 2 === 0 ? 250 : 240, rowIndex % 2 === 0 ? 250 : 240);
        doc.rect(m, y, usableWidth, rowHeight, 'F');
      }
      
      currentX = m;
      row.forEach((cell, i) => {
        const colW = colWidths[i];
        doc.text(String(cell), currentX + 3, y + 7);
        currentX += colW;
      });
      y += rowHeight;
      
      if (isLastRow && isBoldLastRow) {
        doc.setFont("helvetica", "normal");
      }
    });

    // Draw borders
    const tableHeight = y - startY;
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.rect(m, startY, usableWidth, tableHeight, 'S');

    y += 8;
    return y;
  };

  // ========== PAY PERIOD INFO ==========
  const payPeriodCols = ["Pay Period", "Pay Date", "Employee ID"];
  const payPeriodWidths = [usableWidth * 0.4, usableWidth * 0.3, usableWidth * 0.3];
  const payPeriodRows = [
    [`${formatDate(startDate)} - ${formatDate(endDate)}`, formatDate(payDate), formData.employeeId || "N/A"]
  ];
  drawTableSection("Pay Statement", payPeriodCols, payPeriodWidths, payPeriodRows);

  // ========== EARNINGS TABLE ==========
  const earningsCols = ["Description", "Rate", "Hours", "Current", "YTD"];
  const earningsWidths = [usableWidth * 0.3, usableWidth * 0.15, usableWidth * 0.15, usableWidth * 0.2, usableWidth * 0.2];
  const earningsRows = [];

  if (payType === "salary") {
    earningsRows.push(["Salary", "-", "-", `$${fmt(regularPay)}`, `$${fmt(ytdRegularPay)}`]);
  } else {
    earningsRows.push(["Regular Pay", `$${fmt(rate)}`, `${hours}`, `$${fmt(regularPay)}`, `$${fmt(ytdRegularPay)}`]);
    if (overtime > 0) {
      earningsRows.push(["Overtime Pay", `$${fmt(rate * 1.5)}`, `${overtime}`, `$${fmt(overtimePay)}`, `$${fmt(ytdOvertimePay)}`]);
    }
  }
  earningsRows.push(["Gross Pay", "", "", `$${fmt(grossPay)}`, `$${fmt(ytdGrossPay)}`]);
  
  drawTableSection("Earnings", earningsCols, earningsWidths, earningsRows, true);

  // ========== DEDUCTIONS TABLE ==========
  const deductionsCols = ["Description", "Current", "YTD"];
  const deductionsWidths = [usableWidth * 0.5, usableWidth * 0.25, usableWidth * 0.25];
  const deductionsRows = [];

  deductionsRows.push([cppLabel || "CPP", `$${fmt(cpp)}`, `$${fmt(ytdCpp)}`]);
  deductionsRows.push(["EI", `$${fmt(ei)}`, `$${fmt(ytdEi)}`]);
  if (isQuebec && qpip > 0) {
    deductionsRows.push(["QPIP", `$${fmt(qpip)}`, `$${fmt(ytdQpip)}`]);
  }
  deductionsRows.push(["Federal Tax", `$${fmt(federalTax)}`, `$${fmt(ytdFederalTax)}`]);
  deductionsRows.push(["Provincial Tax", `$${fmt(provincialTax)}`, `$${fmt(ytdProvincialTax)}`]);

  if (deductionsData && deductionsData.length > 0) {
    deductionsData.forEach(d => {
      deductionsRows.push([d.name || d.type, `$${fmt(d.amount)}`, `$${fmt(d.ytdAmount || d.amount)}`]);
    });
  }

  deductionsRows.push(["Total Deductions", `$${fmt(totalTax + totalDeductions)}`, `$${fmt(ytdTotalTax + ytdDeductions)}`]);
  
  drawTableSection("Deductions", deductionsCols, deductionsWidths, deductionsRows, true);

  // ========== NET PAY ==========
  doc.setFillColor(0, 85, 164);
  doc.rect(m, y, usableWidth, 20, 'F');
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text("Net Pay", m + 10, y + 13);
  doc.text(`$${fmt(netPay)}`, pageWidth - m - 10, y + 13, { align: "right" });
  y += 30;

  // ========== PAYMENT INFO ==========
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 80);
  doc.text(`Direct Deposit to account ending in ${formData.bank || '****'}`, m, y);
  y += 10;
  doc.text(`Pay Date: ${formatDate(payDate)}`, m, y);

  // Footer
  y = pageHeight - 25;
  doc.setFontSize(7);
  doc.setTextColor(150, 150, 150);
  doc.text(`Page ${stubNum} of ${totalStubs}`, pageWidth / 2, y, { align: "center" });
}

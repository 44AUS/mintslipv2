import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

// Helper to format date
const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' });
};

// Helper to format currency
const formatCurrency = (amount) => {
  const num = parseFloat(amount) || 0;
  return num.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
};

// Calculate totals
const calculateTotals = (formData) => {
  const previous = parseFloat(formData.previousBalance) || 0;
  const payment = parseFloat(formData.paymentReceived) || 0;
  const base = parseFloat(formData.baseCharge) || 0;
  const usage = parseFloat(formData.usageCharge) || 0;
  const taxes = parseFloat(formData.taxes) || 0;
  const fees = parseFloat(formData.fees) || 0;
  const discount = parseFloat(formData.discountAmount) || 0;
  
  const balanceForward = previous - payment;
  const currentCharges = base + usage + taxes + fees;
  const totalDue = balanceForward + currentCharges - discount;
  
  return {
    previous,
    payment,
    balanceForward,
    base,
    usage,
    taxes,
    fees,
    discount,
    currentCharges,
    totalDue
  };
};

// Template A: Xfinity Style - Purple accent, modern telecom layout
const generateTemplateA = async (doc, formData, fonts, isPreview = false) => {
  const page = doc.addPage([612, 792]); // Letter size
  const { width, height } = page.getSize();
  const { bold, regular } = fonts;
  
  // Colors
  const purple = rgb(0.4, 0.2, 0.6);
  const darkGray = rgb(0.2, 0.2, 0.2);
  const lightGray = rgb(0.6, 0.6, 0.6);
  const black = rgb(0, 0, 0);
  
  const totals = calculateTotals(formData);
  let y = height - 50;
  
  // Logo area
  if (formData.logoDataUrl) {
    try {
      const logoBytes = await fetch(formData.logoDataUrl).then(res => res.arrayBuffer());
      let logoImage;
      if (formData.logoDataUrl.includes('png')) {
        logoImage = await doc.embedPng(logoBytes);
      } else {
        logoImage = await doc.embedJpg(logoBytes);
      }
      const logoDims = logoImage.scale(0.3);
      const maxLogoWidth = 120;
      const maxLogoHeight = 50;
      const scale = Math.min(maxLogoWidth / logoDims.width, maxLogoHeight / logoDims.height, 1);
      page.drawImage(logoImage, {
        x: 50,
        y: y - 40,
        width: logoDims.width * scale,
        height: logoDims.height * scale,
      });
    } catch (e) {
      page.drawText(formData.companyName || 'Utility Company', { x: 50, y: y - 20, size: 20, font: bold, color: purple });
    }
  } else {
    page.drawText(formData.companyName || 'Utility Company', { x: 50, y: y - 20, size: 20, font: bold, color: purple });
  }
  
  // Account info - right side
  page.drawText('Account Number:', { x: 400, y: y, size: 9, font: regular, color: lightGray });
  page.drawText(formData.accountNumber || '—', { x: 400, y: y - 12, size: 10, font: bold, color: darkGray });
  page.drawText('Billing Date:', { x: 400, y: y - 30, size: 9, font: regular, color: lightGray });
  page.drawText(formatDate(formData.billingDate), { x: 400, y: y - 42, size: 10, font: regular, color: darkGray });
  page.drawText('Page 1 of 1', { x: 540, y: y, size: 9, font: regular, color: lightGray });
  
  y -= 80;
  
  // Greeting
  page.drawText(`Hello ${formData.customerName || 'Customer'},`, { x: 50, y, size: 16, font: bold, color: darkGray });
  y -= 18;
  page.drawText(`Thank you for choosing ${formData.companyName || 'us'}.`, { x: 50, y, size: 10, font: regular, color: lightGray });
  
  y -= 40;
  
  // Bill at a glance section
  page.drawText('Your bill at a glance', { x: 50, y, size: 14, font: bold, color: darkGray });
  y -= 18;
  page.drawText(`For ${formData.serviceAddress || ''}, ${formData.serviceCity || ''}, ${formData.serviceState || ''} ${formData.serviceZip || ''}`, { x: 50, y, size: 9, font: regular, color: lightGray });
  
  y -= 30;
  
  // Billing summary box
  const boxY = y;
  page.drawRectangle({ x: 50, y: y - 150, width: 250, height: 150, borderColor: rgb(0.85, 0.85, 0.85), borderWidth: 1 });
  
  // Summary items
  const summaryItems = [
    { label: 'Previous balance', value: formatCurrency(totals.previous) },
    { label: `Payment received${formData.paymentDate ? ` - ${formatDate(formData.paymentDate)}` : ''}`, value: totals.payment > 0 ? `-${formatCurrency(totals.payment)}` : formatCurrency(0) },
    { label: 'Balance forward', value: formatCurrency(totals.balanceForward) },
    { label: `${formData.serviceType} charges`, value: formatCurrency(totals.base + totals.usage) },
    { label: 'Taxes, fees and other charges', value: formatCurrency(totals.taxes + totals.fees) },
  ];
  
  if (totals.discount > 0) {
    summaryItems.push({ label: formData.discountDescription || 'Discount', value: `-${formatCurrency(totals.discount)}` });
  }
  
  summaryItems.push({ label: 'New charges', value: formatCurrency(totals.currentCharges - totals.discount), bold: true });
  
  let itemY = boxY - 15;
  summaryItems.forEach((item, idx) => {
    page.drawText(item.label, { x: 60, y: itemY, size: 9, font: item.bold ? bold : regular, color: darkGray });
    page.drawText(item.value, { x: 250, y: itemY, size: 9, font: item.bold ? bold : regular, color: item.value.startsWith('-') ? rgb(0, 0.5, 0) : darkGray });
    itemY -= 18;
  });
  
  // Amount due box (purple background)
  const amountBoxY = y - 180;
  page.drawRectangle({ x: 50, y: amountBoxY, width: 250, height: 45, color: rgb(0.93, 0.9, 0.97) });
  page.drawText('Amount due', { x: 60, y: amountBoxY + 28, size: 11, font: bold, color: purple });
  page.drawText(formatCurrency(totals.totalDue), { x: 60, y: amountBoxY + 8, size: 18, font: bold, color: purple });
  page.drawText(`Due by ${formatDate(formData.dueDate)}`, { x: 180, y: amountBoxY + 15, size: 9, font: regular, color: purple });
  
  // Right column - Bill explained
  const rightX = 330;
  let rightY = boxY + 20;
  page.drawText('Your bill explained', { x: rightX, y: rightY, size: 14, font: bold, color: darkGray });
  rightY -= 25;
  
  // Service period info
  page.drawText('Service Period:', { x: rightX, y: rightY, size: 9, font: bold, color: darkGray });
  rightY -= 14;
  page.drawText(`${formatDate(formData.servicePeriodStart)} to ${formatDate(formData.servicePeriodEnd)}`, { x: rightX, y: rightY, size: 9, font: regular, color: lightGray });
  rightY -= 25;
  
  // Usage info
  if (formData.usageAmount) {
    page.drawText('Usage this period:', { x: rightX, y: rightY, size: 9, font: bold, color: darkGray });
    rightY -= 14;
    page.drawText(`${formData.usageAmount} ${formData.usageUnit}`, { x: rightX, y: rightY, size: 9, font: regular, color: lightGray });
    rightY -= 25;
  }
  
  // Meter info
  if (formData.meterNumber) {
    page.drawText('Meter Information:', { x: rightX, y: rightY, size: 9, font: bold, color: darkGray });
    rightY -= 14;
    page.drawText(`Meter #: ${formData.meterNumber}`, { x: rightX, y: rightY, size: 9, font: regular, color: lightGray });
    if (formData.previousReading && formData.currentReading) {
      rightY -= 12;
      page.drawText(`Reading: ${formData.previousReading} → ${formData.currentReading}`, { x: rightX, y: rightY, size: 9, font: regular, color: lightGray });
    }
  }
  
  // Contact info at bottom
  y = 150;
  page.drawLine({ start: { x: 50, y }, end: { x: width - 50, y }, thickness: 0.5, color: rgb(0.85, 0.85, 0.85) });
  y -= 20;
  
  page.drawText('Need help?', { x: 50, y, size: 10, font: bold, color: darkGray });
  y -= 14;
  if (formData.companyWebsite) {
    page.drawText(`Visit ${formData.companyWebsite}`, { x: 50, y, size: 9, font: regular, color: lightGray });
  }
  if (formData.companyPhone) {
    page.drawText(`Call ${formData.companyPhone}`, { x: 250, y, size: 9, font: regular, color: lightGray });
  }
  
  // Payment stub at very bottom
  y = 100;
  page.drawLine({ start: { x: 50, y }, end: { x: width - 50, y }, thickness: 1, dashArray: [5, 5], color: lightGray });
  y -= 20;
  
  page.drawText('PAYMENT STUB - Detach and return with payment', { x: 50, y, size: 8, font: regular, color: lightGray });
  y -= 20;
  page.drawText(`Account: ${formData.accountNumber || '—'}`, { x: 50, y, size: 9, font: regular, color: darkGray });
  page.drawText(`Amount Due: ${formatCurrency(totals.totalDue)}`, { x: 250, y, size: 9, font: bold, color: darkGray });
  page.drawText(`Due Date: ${formatDate(formData.dueDate)}`, { x: 420, y, size: 9, font: regular, color: darkGray });
  
  // Preview watermark
  if (isPreview) {
    page.drawText('PREVIEW', {
      x: width / 2 - 100,
      y: height / 2,
      size: 60,
      font: bold,
      color: rgb(0.9, 0.9, 0.9),
      rotate: { type: 'degrees', angle: -45 },
    });
  }
};

// Template B: Traditional Utility - Blue theme, classic layout
const generateTemplateB = async (doc, formData, fonts, isPreview = false) => {
  const page = doc.addPage([612, 792]);
  const { width, height } = page.getSize();
  const { bold, regular } = fonts;
  
  // Colors
  const blue = rgb(0.1, 0.3, 0.6);
  const darkGray = rgb(0.2, 0.2, 0.2);
  const lightGray = rgb(0.5, 0.5, 0.5);
  
  const totals = calculateTotals(formData);
  let y = height - 40;
  
  // Header with blue bar
  page.drawRectangle({ x: 0, y: height - 80, width, height: 80, color: blue });
  
  // Logo or company name in header
  if (formData.logoDataUrl) {
    try {
      const logoBytes = await fetch(formData.logoDataUrl).then(res => res.arrayBuffer());
      let logoImage;
      if (formData.logoDataUrl.includes('png')) {
        logoImage = await doc.embedPng(logoBytes);
      } else {
        logoImage = await doc.embedJpg(logoBytes);
      }
      const logoDims = logoImage.scale(0.25);
      const maxLogoWidth = 100;
      const maxLogoHeight = 40;
      const scale = Math.min(maxLogoWidth / logoDims.width, maxLogoHeight / logoDims.height, 1);
      page.drawImage(logoImage, {
        x: 50,
        y: height - 60,
        width: logoDims.width * scale,
        height: logoDims.height * scale,
      });
    } catch (e) {
      page.drawText(formData.companyName || 'UTILITY COMPANY', { x: 50, y: height - 50, size: 18, font: bold, color: rgb(1, 1, 1) });
    }
  } else {
    page.drawText(formData.companyName || 'UTILITY COMPANY', { x: 50, y: height - 50, size: 18, font: bold, color: rgb(1, 1, 1) });
  }
  
  // Statement title
  page.drawText(`${formData.serviceType} STATEMENT`, { x: 400, y: height - 45, size: 12, font: bold, color: rgb(1, 1, 1) });
  page.drawText(formatDate(formData.billingDate), { x: 400, y: height - 60, size: 10, font: regular, color: rgb(0.9, 0.9, 0.9) });
  
  y = height - 110;
  
  // Two column layout
  // Left: Customer info
  page.drawText('CUSTOMER INFORMATION', { x: 50, y, size: 10, font: bold, color: blue });
  y -= 18;
  page.drawText(formData.customerName || '—', { x: 50, y, size: 11, font: bold, color: darkGray });
  y -= 14;
  page.drawText(formData.serviceAddress || '', { x: 50, y, size: 10, font: regular, color: darkGray });
  y -= 12;
  page.drawText(`${formData.serviceCity || ''}, ${formData.serviceState || ''} ${formData.serviceZip || ''}`, { x: 50, y, size: 10, font: regular, color: darkGray });
  
  // Right: Account info
  let rightY = height - 110;
  page.drawText('ACCOUNT INFORMATION', { x: 350, y: rightY, size: 10, font: bold, color: blue });
  rightY -= 18;
  page.drawText(`Account Number: ${formData.accountNumber || '—'}`, { x: 350, y: rightY, size: 10, font: regular, color: darkGray });
  rightY -= 14;
  page.drawText(`Service Period: ${formatDate(formData.servicePeriodStart)} - ${formatDate(formData.servicePeriodEnd)}`, { x: 350, y: rightY, size: 9, font: regular, color: darkGray });
  rightY -= 14;
  page.drawText(`Due Date: ${formatDate(formData.dueDate)}`, { x: 350, y: rightY, size: 10, font: bold, color: darkGray });
  
  y -= 50;
  
  // Amount Due Box
  page.drawRectangle({ x: 350, y: y - 50, width: 200, height: 60, color: rgb(0.95, 0.97, 1), borderColor: blue, borderWidth: 2 });
  page.drawText('AMOUNT DUE', { x: 360, y: y - 15, size: 10, font: bold, color: blue });
  page.drawText(formatCurrency(totals.totalDue), { x: 360, y: y - 38, size: 22, font: bold, color: blue });
  
  y -= 80;
  
  // Billing Summary Table
  page.drawRectangle({ x: 50, y: y - 200, width: 250, height: 200, borderColor: rgb(0.8, 0.8, 0.8), borderWidth: 1 });
  page.drawRectangle({ x: 50, y: y - 25, width: 250, height: 25, color: rgb(0.95, 0.95, 0.95) });
  page.drawText('BILLING SUMMARY', { x: 60, y: y - 18, size: 10, font: bold, color: darkGray });
  
  const billingItems = [
    { label: 'Previous Balance', value: formatCurrency(totals.previous) },
    { label: 'Payments Received', value: formatCurrency(-totals.payment) },
    { label: 'Balance Forward', value: formatCurrency(totals.balanceForward), separator: true },
    { label: 'Base Charge', value: formatCurrency(totals.base) },
    { label: 'Usage Charge', value: formatCurrency(totals.usage) },
    { label: 'Taxes & Fees', value: formatCurrency(totals.taxes + totals.fees) },
  ];
  
  if (totals.discount > 0) {
    billingItems.push({ label: 'Discount', value: formatCurrency(-totals.discount) });
  }
  
  billingItems.push({ label: 'TOTAL DUE', value: formatCurrency(totals.totalDue), bold: true, separator: true });
  
  let tableY = y - 45;
  billingItems.forEach((item) => {
    if (item.separator) {
      page.drawLine({ start: { x: 55, y: tableY + 8 }, end: { x: 295, y: tableY + 8 }, thickness: 0.5, color: rgb(0.8, 0.8, 0.8) });
    }
    page.drawText(item.label, { x: 60, y: tableY, size: 9, font: item.bold ? bold : regular, color: darkGray });
    page.drawText(item.value, { x: 230, y: tableY, size: 9, font: item.bold ? bold : regular, color: darkGray });
    tableY -= 18;
  });
  
  // Usage Details on right
  if (formData.usageAmount) {
    let usageY = y - 80;
    page.drawText('USAGE DETAILS', { x: 350, y: usageY, size: 10, font: bold, color: blue });
    usageY -= 20;
    page.drawText(`Current Reading: ${formData.currentReading || '—'}`, { x: 350, y: usageY, size: 9, font: regular, color: darkGray });
    usageY -= 14;
    page.drawText(`Previous Reading: ${formData.previousReading || '—'}`, { x: 350, y: usageY, size: 9, font: regular, color: darkGray });
    usageY -= 14;
    page.drawText(`Usage: ${formData.usageAmount} ${formData.usageUnit}`, { x: 350, y: usageY, size: 10, font: bold, color: darkGray });
    if (formData.meterNumber) {
      usageY -= 20;
      page.drawText(`Meter #: ${formData.meterNumber}`, { x: 350, y: usageY, size: 9, font: regular, color: lightGray });
    }
  }
  
  // Footer
  y = 80;
  page.drawLine({ start: { x: 50, y }, end: { x: width - 50, y }, thickness: 1, color: blue });
  y -= 20;
  
  const footerText = [
    formData.companyName || '',
    formData.companyAddress ? `${formData.companyAddress}, ${formData.companyCity}, ${formData.companyState} ${formData.companyZip}` : '',
    formData.companyPhone ? `Phone: ${formData.companyPhone}` : '',
    formData.companyWebsite ? `Web: ${formData.companyWebsite}` : ''
  ].filter(Boolean).join(' | ');
  
  page.drawText(footerText, { x: 50, y, size: 8, font: regular, color: lightGray });
  
  if (isPreview) {
    page.drawText('PREVIEW', {
      x: width / 2 - 100,
      y: height / 2,
      size: 60,
      font: bold,
      color: rgb(0.9, 0.9, 0.9),
      rotate: { type: 'degrees', angle: -45 },
    });
  }
};

// Template C: Modern Minimal - Green accents, clean design
const generateTemplateC = async (doc, formData, fonts, isPreview = false) => {
  const page = doc.addPage([612, 792]);
  const { width, height } = page.getSize();
  const { bold, regular } = fonts;
  
  // Colors
  const green = rgb(0.1, 0.5, 0.3);
  const darkGray = rgb(0.15, 0.15, 0.15);
  const lightGray = rgb(0.6, 0.6, 0.6);
  
  const totals = calculateTotals(formData);
  let y = height - 50;
  
  // Minimal header with logo
  if (formData.logoDataUrl) {
    try {
      const logoBytes = await fetch(formData.logoDataUrl).then(res => res.arrayBuffer());
      let logoImage;
      if (formData.logoDataUrl.includes('png')) {
        logoImage = await doc.embedPng(logoBytes);
      } else {
        logoImage = await doc.embedJpg(logoBytes);
      }
      const logoDims = logoImage.scale(0.25);
      const maxLogoWidth = 100;
      const maxLogoHeight = 40;
      const scale = Math.min(maxLogoWidth / logoDims.width, maxLogoHeight / logoDims.height, 1);
      page.drawImage(logoImage, {
        x: 50,
        y: y - 30,
        width: logoDims.width * scale,
        height: logoDims.height * scale,
      });
    } catch (e) {
      page.drawText(formData.companyName || 'Company', { x: 50, y: y - 10, size: 16, font: bold, color: green });
    }
  } else {
    page.drawText(formData.companyName || 'Company', { x: 50, y: y - 10, size: 16, font: bold, color: green });
  }
  
  // Statement label - right aligned
  page.drawText('STATEMENT', { x: width - 130, y: y, size: 10, font: bold, color: lightGray });
  page.drawText(formatDate(formData.billingDate), { x: width - 130, y: y - 14, size: 9, font: regular, color: lightGray });
  
  y -= 70;
  
  // Green accent line
  page.drawRectangle({ x: 50, y, width: width - 100, height: 3, color: green });
  
  y -= 40;
  
  // Customer and account info in clean columns
  page.drawText('Bill To', { x: 50, y, size: 9, font: bold, color: lightGray });
  page.drawText('Account', { x: 250, y, size: 9, font: bold, color: lightGray });
  page.drawText('Service Period', { x: 420, y, size: 9, font: bold, color: lightGray });
  
  y -= 16;
  page.drawText(formData.customerName || '—', { x: 50, y, size: 11, font: bold, color: darkGray });
  page.drawText(formData.accountNumber || '—', { x: 250, y, size: 11, font: regular, color: darkGray });
  page.drawText(`${formatDate(formData.servicePeriodStart)}`, { x: 420, y, size: 10, font: regular, color: darkGray });
  
  y -= 14;
  page.drawText(formData.serviceAddress || '', { x: 50, y, size: 10, font: regular, color: darkGray });
  page.drawText(`Service: ${formData.serviceType}`, { x: 250, y, size: 9, font: regular, color: lightGray });
  page.drawText(`to ${formatDate(formData.servicePeriodEnd)}`, { x: 420, y, size: 10, font: regular, color: darkGray });
  
  y -= 12;
  page.drawText(`${formData.serviceCity || ''}, ${formData.serviceState || ''} ${formData.serviceZip || ''}`, { x: 50, y, size: 10, font: regular, color: darkGray });
  
  y -= 50;
  
  // Amount due - prominent display
  page.drawRectangle({ x: 50, y: y - 60, width: width - 100, height: 70, color: rgb(0.95, 0.98, 0.96), borderColor: green, borderWidth: 1 });
  page.drawText('Amount Due', { x: 70, y: y - 20, size: 12, font: regular, color: darkGray });
  page.drawText(formatCurrency(totals.totalDue), { x: 70, y: y - 45, size: 28, font: bold, color: green });
  page.drawText(`Due by ${formatDate(formData.dueDate)}`, { x: 350, y: y - 35, size: 10, font: regular, color: darkGray });
  
  y -= 100;
  
  // Charges breakdown - minimal table
  page.drawText('Charges', { x: 50, y, size: 11, font: bold, color: darkGray });
  y -= 25;
  
  const charges = [
    { label: 'Previous Balance', value: totals.previous },
    { label: 'Payment Received', value: -totals.payment },
    { label: 'Balance Forward', value: totals.balanceForward, divider: true },
    { label: 'Service Charge', value: totals.base },
    { label: `Usage (${formData.usageAmount || 0} ${formData.usageUnit})`, value: totals.usage },
    { label: 'Taxes & Fees', value: totals.taxes + totals.fees },
  ];
  
  if (totals.discount > 0) {
    charges.push({ label: formData.discountDescription || 'Discount', value: -totals.discount });
  }
  
  charges.forEach((item) => {
    if (item.divider) {
      page.drawLine({ start: { x: 50, y: y + 8 }, end: { x: 300, y: y + 8 }, thickness: 0.5, color: rgb(0.85, 0.85, 0.85) });
    }
    page.drawText(item.label, { x: 50, y, size: 10, font: regular, color: darkGray });
    page.drawText(formatCurrency(item.value), { x: 230, y, size: 10, font: regular, color: item.value < 0 ? green : darkGray });
    y -= 20;
  });
  
  // Total line
  page.drawLine({ start: { x: 50, y: y + 8 }, end: { x: 300, y: y + 8 }, thickness: 1, color: green });
  page.drawText('Total Due', { x: 50, y, size: 11, font: bold, color: darkGray });
  page.drawText(formatCurrency(totals.totalDue), { x: 230, y, size: 11, font: bold, color: green });
  
  // Meter info on right side
  if (formData.meterNumber || formData.usageAmount) {
    let meterY = y + 120;
    page.drawText('Meter Details', { x: 380, y: meterY, size: 10, font: bold, color: darkGray });
    meterY -= 20;
    if (formData.meterNumber) {
      page.drawText(`Meter: ${formData.meterNumber}`, { x: 380, y: meterY, size: 9, font: regular, color: lightGray });
      meterY -= 14;
    }
    if (formData.previousReading) {
      page.drawText(`Prev: ${formData.previousReading}`, { x: 380, y: meterY, size: 9, font: regular, color: lightGray });
      meterY -= 14;
    }
    if (formData.currentReading) {
      page.drawText(`Curr: ${formData.currentReading}`, { x: 380, y: meterY, size: 9, font: regular, color: lightGray });
    }
  }
  
  // Footer
  y = 60;
  page.drawRectangle({ x: 50, y: y - 10, width: width - 100, height: 1, color: rgb(0.9, 0.9, 0.9) });
  y -= 25;
  
  page.drawText(formData.companyName || '', { x: 50, y, size: 8, font: regular, color: lightGray });
  if (formData.companyPhone) {
    page.drawText(formData.companyPhone, { x: 200, y, size: 8, font: regular, color: lightGray });
  }
  if (formData.companyWebsite) {
    page.drawText(formData.companyWebsite, { x: 350, y, size: 8, font: regular, color: lightGray });
  }
  
  if (isPreview) {
    page.drawText('PREVIEW', {
      x: width / 2 - 100,
      y: height / 2,
      size: 60,
      font: bold,
      color: rgb(0.9, 0.9, 0.9),
      rotate: { type: 'degrees', angle: -45 },
    });
  }
};

// Main generator function
export const generateUtilityBillPDF = async (formData, template, isPreview = false) => {
  const doc = await PDFDocument.create();
  
  const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);
  const regularFont = await doc.embedFont(StandardFonts.Helvetica);
  const fonts = { bold: boldFont, regular: regularFont };
  
  switch (template) {
    case 'template-a':
      await generateTemplateA(doc, formData, fonts, isPreview);
      break;
    case 'template-b':
      await generateTemplateB(doc, formData, fonts, isPreview);
      break;
    case 'template-c':
      await generateTemplateC(doc, formData, fonts, isPreview);
      break;
    default:
      await generateTemplateA(doc, formData, fonts, isPreview);
  }
  
  return await doc.save();
};

// Download function
export const generateAndDownloadUtilityBill = async (formData, template) => {
  const pdfBytes = await generateUtilityBillPDF(formData, template, false);
  
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `utility-bill-${formData.customerName?.replace(/\s+/g, '-') || 'statement'}-${new Date().toISOString().split('T')[0]}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

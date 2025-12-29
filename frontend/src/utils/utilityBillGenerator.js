import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

// Helper to format date
const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' });
};

// Helper to format date in MM-DD-YY format
const formatDateShort = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = String(date.getFullYear()).slice(-2);
  return `${month}-${day}-${year}`;
};

// Helper to format date as MM/DD/YY
const formatDateSlash = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = String(date.getFullYear()).slice(-2);
  return `${month}/${day}/${year}`;
};

// Helper to format currency
const formatCurrency = (amount) => {
  const num = parseFloat(amount) || 0;
  return num.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
};

// Helper to format simple number with 2 decimals
const formatNumber = (amount) => {
  const num = parseFloat(amount) || 0;
  return num.toFixed(2);
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

// Generate month labels for the past 13 months
const generateMonthLabels = (servicePeriodEnd) => {
  const endDate = servicePeriodEnd ? new Date(servicePeriodEnd) : new Date();
  const labels = [];
  
  for (let i = 12; i >= 0; i--) {
    const date = new Date(endDate);
    date.setMonth(date.getMonth() - i);
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = monthNames[date.getMonth()];
    const year = String(date.getFullYear()).slice(-2);
    labels.push(`${month} ${year}`);
  }
  
  return labels;
};

// Generate random-ish consumption data that looks realistic
const generateConsumptionData = (currentUsage, servicePeriodEnd) => {
  const baseUsage = parseFloat(currentUsage) || 5000;
  const data = [];
  
  // Generate 13 months of data ending with current usage
  for (let i = 0; i < 13; i++) {
    if (i === 12) {
      // Last month is actual usage
      data.push(baseUsage / 1000);
    } else {
      // Random variation within reasonable range (±30% of base with some seasonal pattern)
      const seasonalFactor = 1 + 0.3 * Math.sin((i / 12) * Math.PI * 2);
      const randomFactor = 0.7 + Math.random() * 0.6;
      const usage = (baseUsage / 1000) * seasonalFactor * randomFactor;
      data.push(Math.round(usage * 10) / 10);
    }
  }
  
  return data;
};

// Template A: Xfinity Style - Purple accent, modern telecom layout
const generateTemplateA = async (doc, formData, fonts, isPreview = false) => {
  const page = doc.addPage([612, 792]); // Letter size
  const { width, height } = page.getSize();
  const { bold, regular } = fonts;
  
  // Colors
  const purple = rgb(0.322, 0.31, 0.635);
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
  page.drawText(`Hello ${formData.customerName || 'Customer'},`, { x: 50, y, size: 16, font: bold, color: rgb(0.322, 0.31, 0.635) });
  y -= 18;
  page.drawText(`Thank you for choosing ${formData.companyName || 'us'}.`, { x: 50, y, size: 10, font: regular, color: rgb(0, 0, 0) });
  
  y -= 60;
  
  // Billing summary box
  const boxY = y;
  page.drawRectangle({ x: 50, y: y - 150, width: 250, height: 180, borderColor: rgb(0.322, 0.31, 0.635), borderWidth: 1 });

  // Bill at a glance section
  y+=10
  page.drawText('Your bill at a glance', { x: 60, y, size: 14, font: bold, color: rgb(0.322, 0.31, 0.635) });
  y+=-15
  page.drawText(`For ${formData.serviceAddress || ''}, ${formData.serviceCity || ''}, ${formData.serviceState || ''} ${formData.serviceZip || ''}`, { x: 60, y, size: 9, font: regular, color: rgb(0, 0, 0) });
  
  // Summary items
  const summaryItems = [
    { label: 'Previous balance', value: formatCurrency(totals.previous) },
    { label: `Payment received${formData.paymentDate ? ` - ${formatDate(formData.paymentDate)}` : ''}`, value: totals.payment > 0 ? `-${formatCurrency(totals.payment)}` : formatCurrency(0) },
    { label: 'Balance forward', value: formatCurrency(totals.balanceForward), bold: true },
    { label: `Regular monthly charges`, value: formatCurrency(totals.base + totals.usage) },
    { label: 'Taxes, fees and other charges', value: formatCurrency(totals.taxes + totals.fees) },
  ];
  
  if (totals.discount > 0) {
    summaryItems.push({ label: formData.discountDescription || 'Discount', value: `-${formatCurrency(totals.discount)}` });
  }
  
  summaryItems.push({ label: 'New charges', value: formatCurrency(totals.currentCharges - totals.discount), bold: true });
  
  let itemY = boxY - 35;
  summaryItems.forEach((item, idx) => {
    page.drawText(item.label, { x: 60, y: itemY, size: 9, font: item.bold ? bold : regular, color: darkGray });
    page.drawText(item.value, { x: 250, y: itemY, size: 9, font: item.bold ? bold : regular, color: item.value.startsWith('-') ? rgb(0, 0.5, 0) : darkGray });
    itemY -= 18;
  });
  
  // Amount due box (purple background)
  const amountBoxY = y - 180;
  page.drawRectangle({ x: 50, y: amountBoxY, width: 250, height: 35, color: rgb(0.322, 0.31, 0.635), borderColor: rgb(0.322, 0.31, 0.635), borderWidth: 1 });
  page.drawText('Amount due', { x: 60, y: amountBoxY + 15, size: 11, font: bold, color: rgb(1, 1, 1) });
  page.drawText(formatCurrency(totals.totalDue), { x: 250, y: amountBoxY + 15, size: 11, font: bold, color: rgb(1, 1, 1) });
  
  // Right column - Bill explained
  page.drawRectangle({ x: 330, y: y - 145, width: 250, height: 180, color: rgb(0.863, 0.867, 0.871) });
  const rightX = 340;
  let rightY = boxY + 10;
  page.drawText('Your bill explained', { x: rightX, y: rightY, size: 14, font: bold, color: darkGray });
  rightY -= 25;
  
  // Service period info
  // A detailed breakdown of your charges begins on page 3
  page.drawText('This page gives you a quick summary of your monthly', { x: rightX, y: rightY, size: 7, color: darkGray });
  rightY -= 14;
  page.drawText(`bill. A detailed breakdown of your charges begins on page 3`, { x: rightX, y: rightY, size: 7, font: regular, color: darkGray });
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

// Template B: Traditional Water/Utility Bill - Matches Cobb County Water System style
const generateTemplateB = async (doc, formData, fonts, isPreview = false) => {
  const page = doc.addPage([612, 792]); // Letter size
  const { width, height } = page.getSize();
  const { bold, regular } = fonts;
  
  // Colors - matching the water bill
  const blue = rgb(0, 0, 0.5); // Dark blue for headers
  const white = rgb(1, 1, 1);
  const black = rgb(0, 0, 0);
  const lightGray = rgb(0.5, 0.5, 0.5);
  const borderGray = rgb(0.7, 0.7, 0.7);
  
  // Calculate water-specific totals
  const waterDeposit = parseFloat(formData.waterDepositApplication) || 0;
  const waterTier1 = parseFloat(formData.waterTier1Charge) || 0;
  const waterTier2 = parseFloat(formData.waterTier2Charge) || 0;
  const costOfBasicService = parseFloat(formData.costOfBasicService) || parseFloat(formData.baseCharge) || 0;
  const sewerCharge = parseFloat(formData.sewerCharge) || 0;
  const streetLightCharge = parseFloat(formData.streetLightCharge) || 0;
  const previousBalance = parseFloat(formData.previousBalance) || 0;
  const paymentReceived = parseFloat(formData.paymentReceived) || 0;
  const balanceForward = previousBalance - paymentReceived;
  
  const currentCharges = waterDeposit + waterTier1 + waterTier2 + costOfBasicService + sewerCharge + streetLightCharge;
  const totalDue = balanceForward + currentCharges;
  
  let y = height - 30;
  
  // Company header - top left
  page.drawText(formData.companyName || 'County Water System', { x: 40, y: y, size: 11, font: bold, color: black });
  y -= 12;
  page.drawText(formData.companyAddress || '660 South Main St', { x: 40, y: y, size: 9, font: regular, color: black });
  y -= 10;
  page.drawText(`${formData.companyCity || 'City'}, ${formData.companyState || 'ST'}  ${formData.companyZip || '00000'}`, { x: 40, y: y, size: 9, font: regular, color: black });
  
  // Right side header boxes
  const boxStartX = 340;
  const boxWidth = 75;
  const boxHeight = 38;
  const headerY = height - 20;
  
  // Call Center Hours box
  page.drawRectangle({ x: boxStartX, y: headerY - boxHeight, width: boxWidth, height: boxHeight, borderColor: borderGray, borderWidth: 1 });
  page.drawRectangle({ x: boxStartX, y: headerY - 13, width: boxWidth, height: 13, color: blue });
  page.drawText('Hours', { x: boxStartX + 5, y: headerY - 9, size: 6, font: bold, color: white });
  page.drawText('Monday - Friday', { x: boxStartX + 10, y: headerY - 26, size: 6, font: regular, color: black });
  page.drawText('8:00 am - 5 pm', { x: boxStartX + 12, y: headerY - 33, size: 6, font: regular, color: black });
  
  // Drive-Through Hours box
  page.drawRectangle({ x: boxStartX + boxWidth, y: headerY - boxHeight, width: boxWidth, height: boxHeight, borderColor: borderGray, borderWidth: 1 });
  page.drawRectangle({ x: boxStartX + boxWidth, y: headerY - 13, width: boxWidth, height: 13, color: blue });
  page.drawText('Drive - Through Hours', { x: boxStartX + boxWidth + 5, y: headerY - 11, size: 5.5, font: bold, color: white, align: 'center' });
  page.drawText('Monday - Friday', { x: boxStartX + boxWidth + 10, y: headerY - 26, size: 6, font: regular, color: black });
  page.drawText('7:30 am - 5 pm', { x: boxStartX + boxWidth + 12, y: headerY - 33, size: 6, font: regular, color: black });
  
  // Contact Numbers box
  page.drawRectangle({ x: boxStartX + boxWidth * 2, y: headerY - boxHeight, width: boxWidth, height: boxHeight, borderColor: borderGray, borderWidth: 1 });
  page.drawRectangle({ x: boxStartX + boxWidth * 2, y: headerY - 13, width: boxWidth, height: 13, color: blue });
  page.drawText('Contact Numbers', { x: boxStartX + boxWidth * 2 + 8, y: headerY - 11, size: 6, font: bold, color: white });
  page.drawText('Office:', { x: boxStartX + boxWidth * 2 + 5, y: headerY - 24, size: 5.5, font: regular, color: black });
  page.drawText(formData.companyPhone || '770-419-6200', { x: boxStartX + boxWidth * 2 + 23, y: headerY - 24, size: 5.5, font: regular, color: black });
  page.drawText('Fax:', { x: boxStartX + boxWidth * 2 + 5, y: headerY - 32, size: 5.5, font: regular, color: black });
  page.drawText(formData.companyFax || '770-419-6224', { x: boxStartX + boxWidth * 2 + 18, y: headerY - 32, size: 5.5, font: regular, color: black });
  
  // Second row of boxes
  const row2Y = headerY - boxHeight - 5;
  
  // Statement Date box
  page.drawRectangle({ x: boxStartX, y: row2Y - 25, width: boxWidth, height: 25, borderColor: borderGray, borderWidth: 1 });
  page.drawRectangle({ x: boxStartX, y: row2Y - 10, width: boxWidth, height: 10, color: blue });
  page.drawText('Statement Date', { x: boxStartX + 12, y: row2Y - 8, size: 6, font: bold, color: white });
  page.drawText(formatDateShort(formData.billingDate), { x: boxStartX + 18, y: row2Y - 20, size: 7, font: regular, color: black });
  
  // Current Charges Due box
  page.drawRectangle({ x: boxStartX + boxWidth, y: row2Y - 25, width: boxWidth, height: 25, borderColor: borderGray, borderWidth: 1 });
  page.drawRectangle({ x: boxStartX + boxWidth, y: row2Y - 10, width: boxWidth, height: 10, color: blue });
  page.drawText('Current Charges Due', { x: boxStartX + boxWidth + 5, y: row2Y - 8, size: 5.5, font: bold, color: white });
  page.drawText(formatDateShort(formData.dueDate), { x: boxStartX + boxWidth + 18, y: row2Y - 20, size: 7, font: regular, color: black });
  
  // Account Status box
  page.drawRectangle({ x: boxStartX + boxWidth * 2, y: row2Y - 25, width: boxWidth, height: 25, borderColor: borderGray, borderWidth: 1 });
  page.drawRectangle({ x: boxStartX + boxWidth * 2, y: row2Y - 10, width: boxWidth, height: 10, color: blue });
  page.drawText('Account Status', { x: boxStartX + boxWidth * 2 + 12, y: row2Y - 8, size: 6, font: bold, color: white });
  page.drawText(formData.accountStatus || 'Current', { x: boxStartX + boxWidth * 2 + 18, y: row2Y - 20, size: 7, font: regular, color: black });
  
  // Website link
  y = height - 80;
  page.drawText('Visit', { x: 40, y: y, size: 8, font: regular, color: blue });
  page.drawText(formData.companyWebsite || ' www.watercompany.org/waterpay', { x: 55, y: y, size: 8, font: bold, color: blue });
  
  // Bullet points for services
  y -= 15;
  const bulletPoints = [
    'Make Payments',
    'Set up AutoPay - New',
    'Sign up for eBills',
    'Set up a Payment Reminder - New'
  ];
  
  bulletPoints.forEach((point, idx) => {
    page.drawText('•', { x: 45, y: y - (idx * 11), size: 8, font: bold, color: black });
    if (point.includes('-New') || point.includes('-NEW')) {
      const parts = point.split(/-New|-NEW/);
      page.drawText(parts[0], { x: 55, y: y - (idx * 11), size: 8, font: regular, color: black });
      page.drawText('-New', { x: 55 + parts[0].length * 4, y: y - (idx * 11), size: 8, font: regular, color: blue });
    } else {
      page.drawText(point, { x: 55, y: y - (idx * 11), size: 8, font: regular, color: black });
    }
  });
  
  y -= 55;
  page.drawText('Free, Easy, Secure and Convenient.', { x: 40, y: y, size: 8, font: bold, color: blue });
  
  // Service Location
  const row3Y = row2Y - 32;
  page.drawRectangle({ x: boxStartX, y: row3Y - 12, width: boxWidth * 3, height: 12, color: rgb(0.95, 0.95, 0.95) });
  page.drawText(`Service Location: ${formData.serviceAddress || '3700 MAIN DR'}`, { x: boxStartX + 5, y: row3Y - 9, size: 7, font: bold, color: black });
  
  // Account Activity Section
  y -= 20;
  page.drawText('Account Activity Since Last Statement', { x: 40, y: y, size: 10, font: bold, color: black });
  y -= 5;
  page.drawLine({ start: { x: 40, y: y }, end: { x: 270, y: y }, thickness: 1, color: black });
  
  y -= 18;
  page.drawText('Account Number:', { x: 40, y: y, size: 9, font: bold, color: black });
  page.drawText(formData.accountNumber || '1217855-189873', { x: 180, y: y, size: 9, font: bold, color: black });
  
  y -= 15;
  page.drawText('Previous Balance:', { x: 40, y: y, size: 9, font: regular, color: black });
  page.drawText(formatNumber(previousBalance), { x: 230, y: y, size: 9, font: regular, color: black });
  
  y -= 12;
  page.drawText('Payments:', { x: 40, y: y, size: 9, font: regular, color: black });
  page.drawText(formatNumber(paymentReceived), { x: 230, y: y, size: 9, font: regular, color: black });
  
  y -= 15;
  page.drawText('Balance Forward:', { x: 40, y: y, size: 9, font: regular, color: black });
  page.drawText(formatNumber(balanceForward), { x: 230, y: y, size: 9, font: regular, color: black });
  
  // Adjustments Section
  y -= 20;
  page.drawText('Adjustments Since Last Statement', { x: 40, y: y, size: 10, font: bold, color: black });
  y -= 5;
  page.drawLine({ start: { x: 40, y: y }, end: { x: 270, y: y }, thickness: 1, color: black });
  
  y -= 15;
  page.drawText('Total Adjustments', { x: 40, y: y, size: 9, font: regular, color: black });
  page.drawText('$0.00', { x: 230, y: y, size: 9, font: regular, color: black });
  
  // Current Summary of Charges Section
  y -= 25;
  page.drawText('Current Summary of Charges', { x: 40, y: y, size: 10, font: bold, color: black });
  y -= 5;
  page.drawLine({ start: { x: 40, y: y }, end: { x: 270, y: y }, thickness: 1, color: black });
  
  // Charge items with gallons
  const chargeItems = [];
  
  if (waterDeposit !== 0) {
    chargeItems.push({ label: 'Water Deposit Application', gal: '', value: formatNumber(waterDeposit) });
  }
  
  if (waterTier1 > 0 || formData.waterTier1Gallons) {
    chargeItems.push({ 
      label: 'Water', 
      gal: `${formData.waterTier1Gallons || '3,000'}`, 
      unit: 'gal',
      value: formatNumber(waterTier1) 
    });
  }
  
  if (waterTier2 > 0 || formData.waterTier2Gallons) {
    chargeItems.push({ 
      label: 'Water (Tier Two)', 
      gal: `${formData.waterTier2Gallons || '2,000'}`, 
      unit: 'gal',
      value: formatNumber(waterTier2) 
    });
  }
  
  chargeItems.push({ label: 'Cost Of Basic Service', gal: '', value: formatNumber(costOfBasicService) });
  
  if (sewerCharge > 0 || formData.sewerGallons) {
    chargeItems.push({ 
      label: 'Sewer', 
      gal: `${formData.sewerGallons || '5,000'}`, 
      unit: 'gal',
      value: formatNumber(sewerCharge) 
    });
  }
  
  if (streetLightCharge > 0) {
    chargeItems.push({ label: 'Street Light', gal: '', value: formatNumber(streetLightCharge) });
  }
  
  y -= 12;
  chargeItems.forEach((item) => {
    page.drawText(item.label, { x: 40, y: y, size: 8, font: regular, color: black });
    if (item.gal) {
      page.drawText(item.gal, { x: 150, y: y, size: 8, font: regular, color: black });
      if (item.unit) {
        page.drawText(item.unit, { x: 185, y: y, size: 8, font: regular, color: black });
      }
    }
    page.drawText(item.value, { x: 230, y: y, size: 8, font: regular, color: black });
    y -= 11;
  });
  
  // Total Current Charges
  y -= 5;
  page.drawText('Total Current Charges', { x: 40, y: y, size: 9, font: bold, color: black });
  page.drawText(formatNumber(currentCharges), { x: 230, y: y, size: 9, font: bold, color: black });
  
  // TOTAL AMOUNT DUE
  y -= 20;
  page.drawText('TOTAL AMOUNT DUE', { x: 40, y: y, size: 10, font: bold, color: black });
  page.drawText(formatNumber(totalDue), { x: 230, y: y, size: 10, font: bold, color: black });
  
  // ===== RIGHT SIDE CONTENT =====
  
  // Important Notice Section
  let rightY = row3Y - 35;
  const noticeX = 300;
  
  page.drawText('Important Notice', { x: noticeX, y: rightY, size: 10, font: bold, color: black });
  rightY -= 5;
  page.drawLine({ start: { x: noticeX, y: rightY }, end: { x: width - 40, y: rightY }, thickness: 1, color: black });
  
  // Notice content
  rightY -= 12;
  page.drawText('Protect Your Pipes This Holiday Season', { x: noticeX, y: rightY, size: 8, font: bold, color: black });
  rightY -= 10;
  
  const noticeText = formData.importantNotice || 
    'Prevent sewer problems by scraping leftovers and wiping fats, oils, and grease off plates and pans into the trash, using a sink strainer and emptying the collected debris into the trash. Never put frying oil/grease or leftovers down the garbage disposal.';
  
  // Wrap notice text
  const maxWidth = width - noticeX - 45;
  const words = noticeText.split(' ');
  let line = '';
  words.forEach(word => {
    const testLine = line + (line ? ' ' : '') + word;
    const testWidth = regular.widthOfTextAtSize(testLine, 7);
    if (testWidth > maxWidth && line) {
      page.drawText(line, { x: noticeX, y: rightY, size: 7, font: regular, color: black });
      rightY -= 9;
      line = word;
    } else {
      line = testLine;
    }
  });
  if (line) {
    page.drawText(line, { x: noticeX, y: rightY, size: 7, font: regular, color: black });
    rightY -= 9;
  }
  
  // Website link
  rightY -= 5;
  page.drawText(formData.companyWebsite || 'https://www.watercompany.org/FOG', { x: noticeX, y: rightY, size: 7, font: regular, color: blue });
  
  // Second notice section
  rightY -= 18;
  page.drawText('Proteja sus tuberias esta temporada', { x: noticeX, y: rightY, size: 8, font: bold, color: black });
  rightY -= 10;
  
  const spanishNotice = formData.spanishNotice || 
    'Evite problemas de alcantarillado raspando sobras de sus platos y sartenes en la basura, usando un colador de fregadero y tirando los desechos en la basura. No eche aceite de freir, grasas o sobras en el triturador.';
  
  const spanishWords = spanishNotice.split(' ');
  line = '';
  spanishWords.forEach(word => {
    const testLine = line + (line ? ' ' : '') + word;
    const testWidth = regular.widthOfTextAtSize(testLine, 7);
    if (testWidth > maxWidth && line) {
      page.drawText(line, { x: noticeX, y: rightY, size: 7, font: regular, color: black });
      rightY -= 9;
      line = word;
    } else {
      line = testLine;
    }
  });
  if (line) {
    page.drawText(line, { x: noticeX, y: rightY, size: 7, font: regular, color: black });
    rightY -= 9;
  }
  
  // ===== CONSUMPTION HISTORY CHART =====
  rightY -= 20;
  page.drawText('Your Consumption History (1000 Gallons)', { x: noticeX + 20, y: rightY, size: 8, font: bold, color: black });
  
  // Chart dimensions
  const chartX = noticeX + 15;
  const chartY = rightY - 110;
  const chartWidth = 230;
  const chartHeight = 90;
  
  // Draw chart border
  page.drawRectangle({ 
    x: chartX, 
    y: chartY, 
    width: chartWidth, 
    height: chartHeight, 
    borderColor: borderGray, 
    borderWidth: 1 
  });
  
  // Get consumption data
  const consumptionData = formData.consumptionHistory || generateConsumptionData(formData.usageAmount || formData.sewerGallons || 5000, formData.servicePeriodEnd);
  const monthLabels = generateMonthLabels(formData.servicePeriodEnd);
  
  // Calculate max value for scale
  const maxConsumption = Math.max(...consumptionData, 10);
  const yScale = chartHeight / (maxConsumption + 2);
  
  // Draw Y-axis labels
  const yAxisSteps = [0, 2, 4, 6, 8, 10];
  yAxisSteps.forEach(val => {
    if (val <= maxConsumption + 2) {
      const labelY = chartY + (val * yScale);
      page.drawText(String(val), { x: chartX - 12, y: labelY - 3, size: 6, font: regular, color: black });
      // Grid line
      page.drawLine({ start: { x: chartX, y: labelY }, end: { x: chartX + chartWidth, y: labelY }, thickness: 0.3, color: rgb(0.85, 0.85, 0.85) });
    }
  });
  
  // Draw bars
  const barWidth = 14;
  const barGap = 4;
  const totalBarsWidth = (barWidth + barGap) * consumptionData.length - barGap;
  const startX = chartX + (chartWidth - totalBarsWidth) / 2;
  
  consumptionData.forEach((value, idx) => {
    const barHeight = value * yScale;
    const barX = startX + idx * (barWidth + barGap);
    
    // Draw bar
    page.drawRectangle({
      x: barX,
      y: chartY,
      width: barWidth,
      height: barHeight,
      color: blue
    });
    
    // Draw month label (rotated text - just draw vertically)
    const label = monthLabels[idx];
    // Draw each character vertically
    const labelX = barX + barWidth / 2 - 2;
    page.drawText(label, { x: barX - 1, y: chartY - 12, size: 5, font: regular, color: black });
  });
  
  // ===== METER INFORMATION TABLE =====
  y = chartY - 35;
  
  page.drawText('Rate Information on Back', { x: width / 2 - 50, y: y, size: 9, font: bold, color: black });
  
  y -= 20;
  
  // Table header
  const tableX = 40;
  const tableWidth = width - 80;
  const colWidths = [70, 95, 55, 70, 70, 95, 40];
  const headers = ['METER', 'SERVICE', 'DAYS IN', 'PREVIOUS', 'PRESENT', 'CONSUMPTION', 'BILL'];
  const headers2 = ['NUMBER', 'PERIOD', 'PERIOD', 'READING', 'READING', '(GALLONS)', 'CYCLE'];
  
  // Header row background
  page.drawRectangle({ x: tableX, y: y - 24, width: tableWidth, height: 24, color: blue });
  
  // Draw headers
  let colX = tableX;
  headers.forEach((header, idx) => {
    page.drawText(header, { x: colX + 3, y: y - 9, size: 6.5, font: bold, color: white });
    page.drawText(headers2[idx], { x: colX + 3, y: y - 18, size: 6.5, font: bold, color: white });
    colX += colWidths[idx];
  });
  
  // Data row
  y -= 24;
  page.drawRectangle({ x: tableX, y: y - 18, width: tableWidth, height: 18, borderColor: borderGray, borderWidth: 1 });
  
  const servicePeriodText = `${formatDateSlash(formData.servicePeriodStart)}- ${formatDateSlash(formData.servicePeriodEnd)}`;
  const daysInPeriod = formData.daysInPeriod || '34';
  const consumption = formData.usageAmount || formData.sewerGallons || '5,000';
  const billCycle = formData.billCycle || '16';
  
  const dataValues = [
    formData.meterNumber || '52164363',
    servicePeriodText,
    daysInPeriod,
    formData.previousReading || '776',
    formData.currentReading || '781 A',
    consumption,
    billCycle
  ];
  
  colX = tableX;
  dataValues.forEach((val, idx) => {
    page.drawText(String(val), { x: colX + 3, y: y - 12, size: 7, font: regular, color: black });
    colX += colWidths[idx];
  });
  
  // ===== PAYMENT STUB =====
  y -= 50;
  
  // Dotted line separator
  page.drawLine({ start: { x: 40, y: y }, end: { x: width - 40, y: y }, thickness: 1, dashArray: [3, 3], color: lightGray });
  
  y -= 10;
  page.drawText('RETURN LOWER PORTION WITH PAYMENT', { x: width / 2 - 90, y: y, size: 7, font: regular, color: lightGray });
  
  y -= 15;
  page.drawText(`Make Checks Payable to: ${formData.companyName || 'County Water System'}`, { x: width / 2 - 120, y: y, size: 10, font: bold, color: blue });
  
  y -= 20;
  page.drawText('Account Number:', { x: 50, y: y, size: 9, font: bold, color: black });
  page.drawText(formData.accountNumber || '1217855-189873', { x: 130, y: y, size: 9, font: bold, color: blue });
  
  // Due date box
  const dueBoxX = 360;
  const dueBoxY = y - 30;
  page.drawRectangle({ x: dueBoxX, y: dueBoxY, width: 170, height: 45, borderColor: borderGray, borderWidth: 1 });
  
  page.drawText('Due Date:', { x: dueBoxX + 10, y: dueBoxY + 32, size: 8, font: bold, color: black });
  page.drawText(formatDateShort(formData.dueDate), { x: dueBoxX + 100, y: dueBoxY + 32, size: 8, font: bold, color: black });
  
  page.drawText('Total Amount Due:', { x: dueBoxX + 10, y: dueBoxY + 18, size: 8, font: bold, color: blue });
  page.drawText(formatNumber(totalDue), { x: dueBoxX + 100, y: dueBoxY + 18, size: 8, font: bold, color: blue });
  
  page.drawText('Amount Paid:', { x: dueBoxX + 10, y: dueBoxY + 5, size: 8, font: bold, color: black });
  page.drawLine({ start: { x: dueBoxX + 80, y: dueBoxY + 3 }, end: { x: dueBoxX + 160, y: dueBoxY + 3 }, thickness: 0.5, color: black });
  
  // Customer address at bottom left
  y = dueBoxY - 30;
  page.drawText(formData.customerName || 'CUSTOMER NAME', { x: 50, y: y, size: 9, font: bold, color: black });
  y -= 11;
  page.drawText(formData.serviceAddress || '3700 MAIN DR NW', { x: 50, y: y, size: 9, font: regular, color: black });
  y -= 11;
  page.drawText(`${formData.serviceCity || 'CITY'} ${formData.serviceState || 'ST'} ${formData.serviceZip || '00000-0000'}`, { x: 50, y: y, size: 9, font: regular, color: black });
  
  // Company return address at bottom right
  page.drawText(`${formData.companyName || 'COUNTY WATER SYSTEM'}`, { x: 360, y: y + 22, size: 8, font: bold, color: black });
  page.drawText(formData.companyMailingAddress || 'PO BOX 580440', { x: 360, y: y + 11, size: 8, font: regular, color: black });
  page.drawText(formData.companyMailingCity || 'CHARLOTTE NC 28258-0440', { x: 360, y: y, size: 8, font: regular, color: black });
  
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

// Template C: Modern Minimal - Green accents, clean design
const generateTemplateC = async (doc, formData, fonts, isPreview = false) => {
  const page = doc.addPage([612, 792]);
  const { width, height } = page.getSize();
  const { bold, regular } = fonts;
  
  // Colors
  const green = rgb(0.1, 0.5, 0.3);
  const darkGray = rgb(0.15, 0.15, 0.15);
  const lightGray = rgb(0.6, 0.6, 0.6);
  const xfinityPurple = rgb(82, 79, 162);
  
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
  const pdfFileName = `utility-bill-${formData.customerName?.replace(/\s+/g, '-') || 'statement'}-${new Date().toISOString().split('T')[0]}.pdf`;
  
  // Store download info for payment success page
  sessionStorage.setItem('lastDownloadUrl', url);
  sessionStorage.setItem('lastDownloadFileName', pdfFileName);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = pdfFileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  // Don't revoke URL immediately - needed for re-download on success page
};

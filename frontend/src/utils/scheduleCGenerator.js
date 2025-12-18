import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

// Format currency without dollar sign
const formatCurrency = (amount) => {
  const num = parseFloat(amount) || 0;
  if (num === 0) return "";
  return num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
};

// Template URL based on tax year
const getTemplateUrl = (taxYear) => {
  const year = parseInt(taxYear);
  return `/templates/schedulec-${year}.pdf`;
};

// Field positions on the Schedule C PDF
// Coordinates are from bottom-left (PDF standard)
// Page size: 612 x 792 points (Letter)
const FIELD_POSITIONS_2024 = {
  // Header
  proprietorName: { x: 75, y: 713, fontSize: 10 },
  ssn: { x: 495, y: 713, fontSize: 10 },
  
  // Line A - Principal business
  principalBusiness: { x: 75, y: 686, fontSize: 9 },
  // Line B - Business code
  businessCode: { x: 495, y: 686, fontSize: 9 },
  // Line C - Business name
  businessName: { x: 75, y: 668, fontSize: 9 },
  // Line D - EIN
  ein: { x: 495, y: 668, fontSize: 9 },
  // Line E - Business address
  businessAddress: { x: 75, y: 650, fontSize: 9 },
  // Line F - City, state, ZIP
  businessCityStateZip: { x: 75, y: 632, fontSize: 9 },
  
  // Accounting method checkboxes
  cashMethod: { x: 265, y: 618, fontSize: 10 },
  accrualMethod: { x: 310, y: 618, fontSize: 10 },
  otherMethod: { x: 358, y: 618, fontSize: 10 },
  otherMethodText: { x: 410, y: 618, fontSize: 8 },
  
  // Line G - Material participation
  materialParticipationYes: { x: 540, y: 618, fontSize: 10 },
  materialParticipationNo: { x: 573, y: 618, fontSize: 10 },
  
  // Line H - Started/acquired checkbox
  startedAcquired: { x: 573, y: 600, fontSize: 10 },
  
  // Line I - Payments requiring 1099
  payments1099Yes: { x: 385, y: 584, fontSize: 10 },
  payments1099No: { x: 420, y: 584, fontSize: 10 },
  
  // Line J - Filed 1099s
  filed1099Yes: { x: 540, y: 584, fontSize: 10 },
  filed1099No: { x: 573, y: 584, fontSize: 10 },
  
  // Part I - Income
  line1: { x: 530, y: 535, fontSize: 10, align: 'right', width: 65 },
  line1Checkbox: { x: 350, y: 535, fontSize: 10 },
  line2: { x: 530, y: 521, fontSize: 10, align: 'right', width: 65 },
  line3: { x: 530, y: 508, fontSize: 10, align: 'right', width: 65 },
  line4: { x: 530, y: 494, fontSize: 10, align: 'right', width: 65 },
  line5: { x: 530, y: 480, fontSize: 10, align: 'right', width: 65 },
  line6: { x: 530, y: 467, fontSize: 10, align: 'right', width: 65 },
  line7: { x: 530, y: 453, fontSize: 10, align: 'right', width: 65 },
  
  // Part II - Expenses (Left column)
  line8: { x: 235, y: 410, fontSize: 9, align: 'right', width: 55 },
  line9: { x: 235, y: 396, fontSize: 9, align: 'right', width: 55 },
  line10: { x: 235, y: 383, fontSize: 9, align: 'right', width: 55 },
  line11: { x: 235, y: 369, fontSize: 9, align: 'right', width: 55 },
  line12: { x: 235, y: 355, fontSize: 9, align: 'right', width: 55 },
  line13: { x: 235, y: 341, fontSize: 9, align: 'right', width: 55 },
  line14: { x: 235, y: 328, fontSize: 9, align: 'right', width: 55 },
  line15a: { x: 235, y: 314, fontSize: 9, align: 'right', width: 55 },
  line15b: { x: 235, y: 300, fontSize: 9, align: 'right', width: 55 },
  line16a: { x: 235, y: 286, fontSize: 9, align: 'right', width: 55 },
  line16b: { x: 235, y: 273, fontSize: 9, align: 'right', width: 55 },
  line17: { x: 235, y: 259, fontSize: 9, align: 'right', width: 55 },
  
  // Part II - Expenses (Right column)
  line18: { x: 530, y: 410, fontSize: 9, align: 'right', width: 55 },
  line19a: { x: 530, y: 396, fontSize: 9, align: 'right', width: 55 },
  line19b: { x: 530, y: 383, fontSize: 9, align: 'right', width: 55 },
  line20: { x: 530, y: 369, fontSize: 9, align: 'right', width: 55 },
  line21: { x: 530, y: 355, fontSize: 9, align: 'right', width: 55 },
  line22: { x: 530, y: 341, fontSize: 9, align: 'right', width: 55 },
  line23a: { x: 530, y: 328, fontSize: 9, align: 'right', width: 55 },
  line23b: { x: 530, y: 314, fontSize: 9, align: 'right', width: 55 },
  line24: { x: 530, y: 300, fontSize: 9, align: 'right', width: 55 },
  line25: { x: 530, y: 286, fontSize: 9, align: 'right', width: 55 },
  line26a: { x: 530, y: 273, fontSize: 9, align: 'right', width: 55 },
  line26b: { x: 530, y: 259, fontSize: 9, align: 'right', width: 55 },
  
  // Totals section
  line27: { x: 530, y: 232, fontSize: 10, align: 'right', width: 65 },
  line28: { x: 530, y: 218, fontSize: 10, align: 'right', width: 65 },
  line29: { x: 530, y: 192, fontSize: 10, align: 'right', width: 65 },
  line30: { x: 530, y: 165, fontSize: 10, align: 'right', width: 65 },
  line31: { x: 530, y: 138, fontSize: 10, align: 'right', width: 65 },
  
  // Line 32 checkboxes
  line32a: { x: 347, y: 98, fontSize: 10 },
  line32b: { x: 347, y: 72, fontSize: 10 },
};

// Use same positions for all years (may need adjustment per year)
const getFieldPositions = (taxYear) => {
  // Positions are similar across years, minor adjustments if needed
  return FIELD_POSITIONS_2024;
};

// Generate Schedule C PDF by filling template
export const generateScheduleCPDF = async (formData, taxYear) => {
  try {
    const templateUrl = getTemplateUrl(taxYear);
    const templateResponse = await fetch(templateUrl);
    const templateBytes = await templateResponse.arrayBuffer();
    
    const pdfDoc = await PDFDocument.load(templateBytes);
    const pages = pdfDoc.getPages();
    const page = pages[0];
    
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    const positions = getFieldPositions(taxYear);
    
    // Helper function to draw text
    const drawText = (text, position, useBold = false) => {
      if (!text && text !== 0) return;
      const textStr = String(text);
      const selectedFont = useBold ? boldFont : font;
      const fontSize = position.fontSize || 10;
      
      let xPos = position.x;
      
      if (position.align === 'right' && position.width) {
        const textWidth = selectedFont.widthOfTextAtSize(textStr, fontSize);
        xPos = position.x + position.width - textWidth;
      }
      
      page.drawText(textStr, {
        x: xPos,
        y: position.y,
        size: fontSize,
        font: selectedFont,
        color: rgb(0, 0, 0),
      });
    };
    
    // Header info
    drawText(formData.proprietorName, positions.proprietorName, true);
    drawText(formData.ssn, positions.ssn);
    
    // Business info
    drawText(formData.principalBusiness, positions.principalBusiness);
    drawText(formData.businessCode, positions.businessCode);
    drawText(formData.businessName, positions.businessName);
    drawText(formData.ein, positions.ein);
    drawText(formData.businessAddress, positions.businessAddress);
    
    const cityStateZip = [formData.businessCity, formData.businessState, formData.businessZip].filter(Boolean).join(", ");
    drawText(cityStateZip, positions.businessCityStateZip);
    
    // Accounting method
    if (formData.accountingMethod === 'cash') drawText('X', positions.cashMethod, true);
    if (formData.accountingMethod === 'accrual') drawText('X', positions.accrualMethod, true);
    if (formData.accountingMethod === 'other') {
      drawText('X', positions.otherMethod, true);
      drawText(formData.otherMethodText, positions.otherMethodText);
    }
    
    // Material participation
    if (formData.materialParticipation === 'yes') drawText('X', positions.materialParticipationYes, true);
    if (formData.materialParticipation === 'no') drawText('X', positions.materialParticipationNo, true);
    
    // Started/acquired
    if (formData.startedAcquired) drawText('X', positions.startedAcquired, true);
    
    // 1099 questions
    if (formData.payments1099 === 'yes') drawText('X', positions.payments1099Yes, true);
    if (formData.payments1099 === 'no') drawText('X', positions.payments1099No, true);
    if (formData.filed1099 === 'yes') drawText('X', positions.filed1099Yes, true);
    if (formData.filed1099 === 'no') drawText('X', positions.filed1099No, true);
    
    // Part I - Income
    drawText(formatCurrency(formData.line1), positions.line1);
    if (formData.line1Statutory) drawText('X', positions.line1Checkbox, true);
    drawText(formatCurrency(formData.line2), positions.line2);
    drawText(formatCurrency(formData.line3), positions.line3);
    drawText(formatCurrency(formData.line4), positions.line4);
    drawText(formatCurrency(formData.line5), positions.line5);
    drawText(formatCurrency(formData.line6), positions.line6);
    drawText(formatCurrency(formData.line7), positions.line7);
    
    // Part II - Expenses (Left column)
    drawText(formatCurrency(formData.line8), positions.line8);
    drawText(formatCurrency(formData.line9), positions.line9);
    drawText(formatCurrency(formData.line10), positions.line10);
    drawText(formatCurrency(formData.line11), positions.line11);
    drawText(formatCurrency(formData.line12), positions.line12);
    drawText(formatCurrency(formData.line13), positions.line13);
    drawText(formatCurrency(formData.line14), positions.line14);
    drawText(formatCurrency(formData.line15a), positions.line15a);
    drawText(formatCurrency(formData.line15b), positions.line15b);
    drawText(formatCurrency(formData.line16a), positions.line16a);
    drawText(formatCurrency(formData.line16b), positions.line16b);
    drawText(formatCurrency(formData.line17), positions.line17);
    
    // Part II - Expenses (Right column)
    drawText(formatCurrency(formData.line18), positions.line18);
    drawText(formatCurrency(formData.line19a), positions.line19a);
    drawText(formatCurrency(formData.line19b), positions.line19b);
    drawText(formatCurrency(formData.line20), positions.line20);
    drawText(formatCurrency(formData.line21), positions.line21);
    drawText(formatCurrency(formData.line22), positions.line22);
    drawText(formatCurrency(formData.line23a), positions.line23a);
    drawText(formatCurrency(formData.line23b), positions.line23b);
    drawText(formatCurrency(formData.line24), positions.line24);
    drawText(formatCurrency(formData.line25), positions.line25);
    drawText(formatCurrency(formData.line26a), positions.line26a);
    drawText(formatCurrency(formData.line26b), positions.line26b);
    
    // Totals
    drawText(formatCurrency(formData.line27), positions.line27);
    drawText(formatCurrency(formData.line28), positions.line28);
    drawText(formatCurrency(formData.line29), positions.line29);
    drawText(formatCurrency(formData.line30), positions.line30);
    drawText(formatCurrency(formData.line31), positions.line31);
    
    // Line 32 loss checkboxes
    if (formData.line32 === 'a') drawText('X', positions.line32a, true);
    if (formData.line32 === 'b') drawText('X', positions.line32b, true);
    
    const pdfBytes = await pdfDoc.save();
    return pdfBytes;
    
  } catch (error) {
    console.error("Error generating Schedule C PDF:", error);
    throw error;
  }
};

// Generate and download Schedule C
export const generateAndDownloadScheduleC = async (formData, taxYear) => {
  try {
    const pdfBytes = await generateScheduleCPDF(formData, taxYear);
    
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.href = url;
    link.download = `ScheduleC_${taxYear}_${formData.proprietorName?.split(' ')[0] || 'Form'}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
    return true;
  } catch (error) {
    console.error("Error downloading Schedule C:", error);
    throw error;
  }
};

import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

// Helper to convert hex color to RGB
const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16) / 255,
    g: parseInt(result[2], 16) / 255,
    b: parseInt(result[3], 16) / 255
  } : { r: 0, g: 0, b: 0 };
};

// Format date for display
const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
};

// Format currency
const formatCurrency = (amount) => {
  const num = parseFloat(amount) || 0;
  return num.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
};

// Get template colors
const getTemplateColors = (template, primaryColor, accentColor) => {
  switch (template) {
    case "classic":
      return {
        primary: { r: 0.1, g: 0.1, b: 0.3 }, // Navy blue
        accent: { r: 0.2, g: 0.2, b: 0.5 },
        text: { r: 0.1, g: 0.1, b: 0.1 },
        border: { r: 0.3, g: 0.3, b: 0.3 }
      };
    case "modern":
      return {
        primary: { r: 0.15, g: 0.15, b: 0.15 }, // Dark gray
        accent: { r: 0.02, g: 0.59, b: 0.41 }, // Green
        text: { r: 0.2, g: 0.2, b: 0.2 },
        border: { r: 0.4, g: 0.4, b: 0.4 }
      };
    case "minimal":
      return {
        primary: { r: 0.0, g: 0.0, b: 0.0 }, // Black
        accent: { r: 0.5, g: 0.5, b: 0.5 },
        text: { r: 0.1, g: 0.1, b: 0.1 },
        border: { r: 0.6, g: 0.6, b: 0.6 }
      };
    case "custom":
      return {
        primary: hexToRgb(primaryColor),
        accent: hexToRgb(accentColor),
        text: { r: 0.1, g: 0.1, b: 0.1 },
        border: { r: 0.4, g: 0.4, b: 0.4 }
      };
    default:
      return {
        primary: { r: 0.1, g: 0.1, b: 0.3 },
        accent: { r: 0.2, g: 0.2, b: 0.5 },
        text: { r: 0.1, g: 0.1, b: 0.1 },
        border: { r: 0.3, g: 0.3, b: 0.3 }
      };
  }
};

// Generate Vehicle Bill of Sale PDF
export const generateVehicleBillOfSalePDF = async (formData, isPreview = false) => {
  try {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([612, 792]); // Letter size
    const { width, height } = page.getSize();
    
    // Embed fonts
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const italicFont = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
    
    const colors = getTemplateColors(formData.template, formData.primaryColor, formData.accentColor);
    
    let y = height - 40;
    const margin = 50;
    const contentWidth = width - (margin * 2);
    const lineHeight = 14;
    
    // Helper to draw text
    const drawText = (text, x, yPos, options = {}) => {
      const { size = 10, fontType = 'regular', color = colors.text } = options;
      const selectedFont = fontType === 'bold' ? boldFont : (fontType === 'italic' ? italicFont : font);
      page.drawText(text || '', {
        x,
        y: yPos,
        size,
        font: selectedFont,
        color: rgb(color.r, color.g, color.b),
      });
    };
    
    // Helper to draw a line
    const drawLine = (x1, y1, x2, y2, thickness = 1) => {
      page.drawLine({
        start: { x: x1, y: y1 },
        end: { x: x2, y: y2 },
        thickness,
        color: rgb(colors.border.r, colors.border.g, colors.border.b),
      });
    };
    
    // Helper to draw a box
    const drawBox = (x, y, w, h) => {
      page.drawRectangle({
        x,
        y: y - h,
        width: w,
        height: h,
        borderColor: rgb(colors.border.r, colors.border.g, colors.border.b),
        borderWidth: 1,
      });
    };
    
    // Helper to draw section header
    const drawSectionHeader = (text, yPos) => {
      page.drawRectangle({
        x: margin,
        y: yPos - 16,
        width: contentWidth,
        height: 18,
        color: rgb(colors.primary.r, colors.primary.g, colors.primary.b),
      });
      drawText(text, margin + 8, yPos - 12, { size: 10, fontType: 'bold', color: { r: 1, g: 1, b: 1 } });
      return yPos - 24;
    };

    // === HEADER ===
    if (formData.template === 'modern') {
      // Modern template with accent bar
      page.drawRectangle({
        x: 0,
        y: height - 80,
        width: width,
        height: 80,
        color: rgb(colors.primary.r, colors.primary.g, colors.primary.b),
      });
      // Center title in the colored bar
      const modernTitleWidth = boldFont.widthOfTextAtSize('VEHICLE BILL OF SALE', 22);
      drawText('VEHICLE BILL OF SALE', (width - modernTitleWidth) / 2, height - 50, { size: 22, fontType: 'bold', color: { r: 1, g: 1, b: 1 } });
      y = height - 100;
    } else if (formData.template === 'minimal') {
      // Minimal template - centered title
      const minimalTitleWidth = boldFont.widthOfTextAtSize('VEHICLE BILL OF SALE', 18);
      drawText('VEHICLE BILL OF SALE', (width - minimalTitleWidth) / 2, y, { size: 18, fontType: 'bold', color: colors.primary });
      y -= 10;
      drawLine(margin, y, width - margin, y, 2);
      y -= 25;
    } else {
      // Classic and Custom templates with border
      // Title centered above the border box
      const titleWidth = boldFont.widthOfTextAtSize('VEHICLE BILL OF SALE', 20);
      drawText('VEHICLE BILL OF SALE', (width - titleWidth) / 2, height - 35, { size: 20, fontType: 'bold', color: colors.primary });
      
      // Border box starts below the title - adjusted to contain all content
      page.drawRectangle({
        x: margin - 10,
        y: margin - 20,
        width: width - (margin * 2) + 20,
        height: height - (margin * 2) - 15,
        borderColor: rgb(colors.primary.r, colors.primary.g, colors.primary.b),
        borderWidth: 2,
      });
      y = height - 65;
    }
    
    // State info
    drawText(`State of ${formData.state || '_______________'}`, margin, y, { size: 10 });
    drawText(`County of ${formData.county || '_______________'}`, margin + 200, y, { size: 10 });
    drawText(`Date: ${formatDate(formData.saleDate) || '_______________'}`, width - margin - 150, y, { size: 10 });
    y -= 25;
    
    // === SELLER INFORMATION ===
    y = drawSectionHeader('SELLER INFORMATION', y);
    y -= 5;
    
    drawText('Full Legal Name:', margin, y, { size: 9, fontType: 'bold' });
    drawText(formData.sellerName || '___________________________', margin + 90, y, { size: 10 });
    y -= lineHeight;
    
    drawText('Address:', margin, y, { size: 9, fontType: 'bold' });
    const sellerAddress = [formData.sellerAddress, formData.sellerCity, formData.sellerState, formData.sellerZip].filter(Boolean).join(', ');
    drawText(sellerAddress || '___________________________', margin + 90, y, { size: 10 });
    y -= lineHeight;
    
    drawText('Driver\'s License / ID:', margin, y, { size: 9, fontType: 'bold' });
    drawText(formData.sellerId || '___________________________', margin + 110, y, { size: 10 });
    drawText('State:', margin + 280, y, { size: 9, fontType: 'bold' });
    drawText(formData.sellerIdState || '____', margin + 310, y, { size: 10 });
    y -= 25;
    
    // === BUYER INFORMATION ===
    y = drawSectionHeader('BUYER INFORMATION', y);
    y -= 5;
    
    drawText('Full Legal Name:', margin, y, { size: 9, fontType: 'bold' });
    drawText(formData.buyerName || '___________________________', margin + 90, y, { size: 10 });
    y -= lineHeight;
    
    drawText('Address:', margin, y, { size: 9, fontType: 'bold' });
    const buyerAddress = [formData.buyerAddress, formData.buyerCity, formData.buyerState, formData.buyerZip].filter(Boolean).join(', ');
    drawText(buyerAddress || '___________________________', margin + 90, y, { size: 10 });
    y -= lineHeight;
    
    drawText('Driver\'s License / ID:', margin, y, { size: 9, fontType: 'bold' });
    drawText(formData.buyerId || '___________________________', margin + 110, y, { size: 10 });
    drawText('State:', margin + 280, y, { size: 9, fontType: 'bold' });
    drawText(formData.buyerIdState || '____', margin + 310, y, { size: 10 });
    y -= 25;
    
    // === VEHICLE INFORMATION ===
    y = drawSectionHeader('VEHICLE INFORMATION', y);
    y -= 5;
    
    // Row 1: Year, Make, Model
    drawText('Year:', margin, y, { size: 9, fontType: 'bold' });
    drawText(formData.vehicleYear || '________', margin + 35, y, { size: 10 });
    drawText('Make:', margin + 100, y, { size: 9, fontType: 'bold' });
    drawText(formData.vehicleMake || '________________', margin + 135, y, { size: 10 });
    drawText('Model:', margin + 280, y, { size: 9, fontType: 'bold' });
    drawText(formData.vehicleModel || '________________', margin + 320, y, { size: 10 });
    y -= lineHeight;
    
    // Row 2: VIN, Color
    drawText('VIN:', margin, y, { size: 9, fontType: 'bold' });
    drawText(formData.vehicleVin || '________________________________', margin + 30, y, { size: 10 });
    drawText('Color:', margin + 320, y, { size: 9, fontType: 'bold' });
    drawText(formData.vehicleColor || '____________', margin + 355, y, { size: 10 });
    y -= lineHeight;
    
    // Row 3: Body Type, Odometer
    drawText('Body Type:', margin, y, { size: 9, fontType: 'bold' });
    drawText(formData.vehicleBodyType || '________________', margin + 60, y, { size: 10 });
    drawText('Odometer Reading:', margin + 220, y, { size: 9, fontType: 'bold' });
    drawText(`${formData.odometerReading || '_________'} miles`, margin + 320, y, { size: 10 });
    y -= 25;
    
    // === SALE INFORMATION ===
    y = drawSectionHeader('SALE INFORMATION', y);
    y -= 5;
    
    drawText('Sale Price:', margin, y, { size: 9, fontType: 'bold' });
    drawText(formData.salePrice ? formatCurrency(formData.salePrice) : '$_______________', margin + 65, y, { size: 11, fontType: 'bold' });
    drawText('Payment Method:', margin + 220, y, { size: 9, fontType: 'bold' });
    drawText(formData.paymentMethod || '________________', margin + 320, y, { size: 10 });
    y -= 20;
    
    // === ODOMETER DISCLOSURE ===
    y = drawSectionHeader('ODOMETER DISCLOSURE STATEMENT', y);
    y -= 5;
    
    const odometerText = `The seller certifies that the odometer reading of ${formData.odometerReading || '_______'} miles:`;
    drawText(odometerText, margin, y, { size: 9 });
    y -= lineHeight + 2;
    
    // Checkboxes for odometer disclosure
    const odometerOptions = [
      { value: 'actual', label: 'Reflects the actual mileage of the vehicle' },
      { value: 'exceeds', label: 'Exceeds the odometer\'s mechanical limits' },
      { value: 'discrepancy', label: 'Is NOT the actual mileage (discrepancy exists)' }
    ];
    
    odometerOptions.forEach(option => {
      const isChecked = formData.odometerDisclosure === option.value;
      page.drawRectangle({
        x: margin + 10,
        y: y - 8,
        width: 10,
        height: 10,
        borderColor: rgb(0, 0, 0),
        borderWidth: 1,
      });
      if (isChecked) {
        drawText('X', margin + 12, y - 6, { size: 10, fontType: 'bold' });
      }
      drawText(option.label, margin + 28, y - 5, { size: 9 });
      y -= lineHeight;
    });
    y -= 10;
    
    // === CONDITION DISCLOSURE ===
    y = drawSectionHeader('CONDITION DISCLOSURE', y);
    y -= 5;
    
    const conditionOptions = [
      { value: 'as-is', label: 'AS-IS: The vehicle is sold "AS-IS" without any warranty, express or implied.' },
      { value: 'warranty', label: 'WITH WARRANTY: The seller provides the following warranty:' }
    ];
    
    conditionOptions.forEach(option => {
      const isChecked = formData.conditionType === option.value;
      page.drawRectangle({
        x: margin + 10,
        y: y - 8,
        width: 10,
        height: 10,
        borderColor: rgb(0, 0, 0),
        borderWidth: 1,
      });
      if (isChecked) {
        drawText('X', margin + 12, y - 6, { size: 10, fontType: 'bold' });
      }
      drawText(option.label, margin + 28, y - 5, { size: 9 });
      y -= lineHeight;
    });
    
    if (formData.conditionType === 'warranty' && formData.warrantyDetails) {
      drawText(`Warranty Details: ${formData.warrantyDetails}`, margin + 28, y - 3, { size: 9, fontType: 'italic' });
      y -= lineHeight;
    }
    y -= 15;
    
    // === CERTIFICATION ===
    const certText = 'The undersigned Seller certifies that they are the legal owner of the above-described vehicle and have the right to sell it. The Seller certifies that the vehicle is free of all liens and encumbrances, except as noted. The Buyer certifies they have inspected the vehicle and accepts it in its current condition.';
    
    // Word wrap certification text
    const words = certText.split(' ');
    let line = '';
    const certLines = [];
    for (const word of words) {
      const testLine = line + (line ? ' ' : '') + word;
      const textWidth = font.widthOfTextAtSize(testLine, 8);
      if (textWidth > contentWidth - 20 && line) {
        certLines.push(line);
        line = word;
      } else {
        line = testLine;
      }
    }
    if (line) certLines.push(line);
    
    certLines.forEach(l => {
      drawText(l, margin, y, { size: 8 });
      y -= 11;
    });
    y -= 10;
    
    // === SIGNATURES ===
    y = drawSectionHeader('SIGNATURES', y);
    y -= 15;
    
    const sigColWidth = (contentWidth - 40) / 2;
    
    // Seller signature
    drawText('SELLER:', margin, y, { size: 9, fontType: 'bold' });
    drawText('BUYER:', margin + sigColWidth + 40, y, { size: 9, fontType: 'bold' });
    y -= 30;
    
    // Signature lines
    drawLine(margin, y, margin + sigColWidth, y);
    drawLine(margin + sigColWidth + 40, y, width - margin, y);
    y -= 12;
    
    drawText('Signature', margin, y, { size: 8 });
    drawText('Signature', margin + sigColWidth + 40, y, { size: 8 });
    y -= 20;
    
    // Print name lines
    drawText(formData.sellerName || '', margin, y + 8, { size: 10 });
    drawText(formData.buyerName || '', margin + sigColWidth + 40, y + 8, { size: 10 });
    drawLine(margin, y, margin + sigColWidth, y);
    drawLine(margin + sigColWidth + 40, y, width - margin, y);
    y -= 12;
    
    drawText('Print Name', margin, y, { size: 8 });
    drawText('Print Name', margin + sigColWidth + 40, y, { size: 8 });
    y -= 20;
    
    // Date lines
    drawLine(margin, y, margin + sigColWidth, y);
    drawLine(margin + sigColWidth + 40, y, width - margin, y);
    y -= 12;
    
    drawText('Date', margin, y, { size: 8 });
    drawText('Date', margin + sigColWidth + 40, y, { size: 8 });
    
    // === OPTIONAL NOTARY SECTION ===
    if (formData.includeNotary) {
      // Check if we need a new page
      if (y < 200) {
        const newPage = pdfDoc.addPage([612, 792]);
        y = 750;
        // Use the new page for notary
      }
      y -= 30;
      
      y = drawSectionHeader('NOTARY ACKNOWLEDGMENT (OPTIONAL)', y);
      y -= 8;
      
      drawText(`State of ${formData.notaryState || '_______________'}`, margin, y, { size: 9 });
      drawText(`County of ${formData.notaryCounty || '_______________'}`, margin + 180, y, { size: 9 });
      y -= 18;
      
      const notaryText = `On this _______ day of _______________, 20____, before me personally appeared the above-named Seller and Buyer, known to me (or proved to me on the basis of satisfactory evidence) to be the persons whose names are subscribed to this instrument, and acknowledged that they executed the same.`;
      
      const notaryWords = notaryText.split(' ');
      let notaryLine = '';
      for (const word of notaryWords) {
        const testLine = notaryLine + (notaryLine ? ' ' : '') + word;
        const textWidth = font.widthOfTextAtSize(testLine, 8);
        if (textWidth > contentWidth - 20 && notaryLine) {
          drawText(notaryLine, margin, y, { size: 8 });
          y -= 11;
          notaryLine = word;
        } else {
          notaryLine = testLine;
        }
      }
      if (notaryLine) {
        drawText(notaryLine, margin, y, { size: 8 });
        y -= 11;
      }
      y -= 25;
      
      drawLine(margin, y, margin + 200, y);
      y -= 12;
      drawText('Notary Public Signature', margin, y, { size: 8 });
      y -= 20;
      
      drawText('My Commission Expires: _______________', margin, y, { size: 9 });
      drawText('[NOTARY SEAL]', margin + 300, y, { size: 9, fontType: 'italic' });
    }
    
    // === WATERMARK (Preview only) ===
    if (isPreview) {
      const watermarkText = 'PREVIEW - MINTSLIP';
      page.drawText(watermarkText, {
        x: 150,
        y: height / 2,
        size: 50,
        font: boldFont,
        color: rgb(0.9, 0.9, 0.9),
        rotate: { type: 'degrees', angle: 45 },
        opacity: 0.5,
      });
    }
    
    const pdfBytes = await pdfDoc.save();
    return pdfBytes;
    
  } catch (error) {
    console.error('Error generating Vehicle Bill of Sale PDF:', error);
    throw error;
  }
};

// Generate and download
export const generateAndDownloadVehicleBillOfSale = async (formData, returnBlob = false) => {
  try {
    const pdfBytes = await generateVehicleBillOfSalePDF(formData, false);
    
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const pdfFileName = `Vehicle_Bill_of_Sale_${formData.vehicleYear || ''}_${formData.vehicleMake || ''}_${formData.vehicleModel || ''}.pdf`.replace(/\s+/g, '_');
    
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
    
    if (returnBlob) {
      return blob;
    }
    
  } catch (error) {
    console.error('Error downloading Vehicle Bill of Sale:', error);
    throw error;
  }
};

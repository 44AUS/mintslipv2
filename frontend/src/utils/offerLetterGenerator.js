import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";

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

// Format compensation
const formatCompensation = (amount, type) => {
  const num = parseFloat(amount) || 0;
  const formatted = num.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  switch (type) {
    case "annual": return `${formatted} per year`;
    case "hourly": return `${formatted} per hour`;
    case "monthly": return `${formatted} per month`;
    default: return formatted;
  }
};

// Get template colors
const getTemplateColors = (template, primaryColor, accentColor) => {
  switch (template) {
    case "professional":
      return {
        primary: { r: 0.1, g: 0.28, b: 0.19 }, // Dark green
        accent: { r: 0.02, g: 0.59, b: 0.41 },  // Green
        text: { r: 0.1, g: 0.1, b: 0.1 }
      };
    case "modern":
      return {
        primary: { r: 0.15, g: 0.15, b: 0.15 }, // Dark gray
        accent: { r: 0.25, g: 0.47, b: 0.85 },   // Blue
        text: { r: 0.2, g: 0.2, b: 0.2 }
      };
    case "custom":
      return {
        primary: hexToRgb(primaryColor),
        accent: hexToRgb(accentColor),
        text: { r: 0.1, g: 0.1, b: 0.1 }
      };
    default:
      return {
        primary: { r: 0.1, g: 0.28, b: 0.19 },
        accent: { r: 0.02, g: 0.59, b: 0.41 },
        text: { r: 0.1, g: 0.1, b: 0.1 }
      };
  }
};

// Helper to embed image from base64
const embedImage = async (pdfDoc, base64Data) => {
  try {
    // Remove data URL prefix if present
    const base64 = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
    const imageBytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
    
    // Try PNG first, then JPEG
    if (base64Data.includes('image/png')) {
      return await pdfDoc.embedPng(imageBytes);
    } else {
      return await pdfDoc.embedJpg(imageBytes);
    }
  } catch (error) {
    console.error('Error embedding image:', error);
    return null;
  }
};

// Generate offer letter PDF
export const generateOfferLetterPDF = async (formData, isPreview = false) => {
  try {
    // Create new PDF document
    const pdfDoc = await PDFDocument.create();
    
    // Register fontkit for custom font support
    pdfDoc.registerFontkit(fontkit);
    
    const page = pdfDoc.addPage([612, 792]); // Letter size
    const { width, height } = page.getSize();
    
    // Embed fonts
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const italicFont = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
    
    // Load and embed Yellowtail font for signatures
    let signatureFont;
    try {
      const fontResponse = await fetch('/fonts/Yellowtail-Regular.ttf');
      const fontBytes = await fontResponse.arrayBuffer();
      signatureFont = await pdfDoc.embedFont(fontBytes);
    } catch (fontError) {
      console.warn('Could not load Yellowtail font, falling back to italic:', fontError);
      signatureFont = italicFont;
    }
    }
    
    // Get template colors
    const colors = getTemplateColors(formData.template, formData.primaryColor, formData.accentColor);
    
    let y = height - 50;
    const margin = 50;
    const lineHeight = 16;
    const maxWidth = width - (margin * 2);
    
    // Helper to draw text
    const drawText = (text, x, yPos, options = {}) => {
      const { size = 11, fontType = 'regular', color = colors.text, maxChars = 100 } = options;
      const selectedFont = fontType === 'bold' ? boldFont : (fontType === 'italic' ? italicFont : font);
      
      // Simple text wrapping
      const words = text.split(' ');
      let line = '';
      let currentY = yPos;
      
      for (const word of words) {
        const testLine = line + (line ? ' ' : '') + word;
        const textWidth = selectedFont.widthOfTextAtSize(testLine, size);
        
        if (textWidth > maxWidth && line) {
          page.drawText(line, {
            x,
            y: currentY,
            size,
            font: selectedFont,
            color: rgb(color.r, color.g, color.b),
          });
          line = word;
          currentY -= lineHeight;
        } else {
          line = testLine;
        }
      }
      
      if (line) {
        page.drawText(line, {
          x,
          y: currentY,
          size,
          font: selectedFont,
          color: rgb(color.r, color.g, color.b),
        });
        currentY -= lineHeight;
      }
      
      return currentY;
    };
    
    // === HEADER ===
    // Embed company logo if provided
    let companyLogoImage = null;
    if (formData.companyLogo) {
      companyLogoImage = await embedImage(pdfDoc, formData.companyLogo);
    }
    
    if (formData.template === "modern") {
      // Modern template - colored bar at top
      page.drawRectangle({
        x: 0,
        y: height - 80,
        width: width,
        height: 80,
        color: rgb(colors.primary.r, colors.primary.g, colors.primary.b),
      });
      
      // Company logo or name in header
      if (companyLogoImage) {
        const logoDims = companyLogoImage.scale(0.5);
        const logoHeight = Math.min(logoDims.height, 50);
        const logoWidth = (logoDims.width / logoDims.height) * logoHeight;
        page.drawImage(companyLogoImage, {
          x: margin,
          y: height - 65,
          width: logoWidth,
          height: logoHeight,
        });
      } else {
        page.drawText(formData.companyName || 'Company Name', {
          x: margin,
          y: height - 50,
          size: 24,
          font: boldFont,
          color: rgb(1, 1, 1),
        });
      }
      
      y = height - 120;
    } else {
      // Professional/Custom template
      if (companyLogoImage) {
        const logoDims = companyLogoImage.scale(0.5);
        const logoHeight = Math.min(logoDims.height, 50);
        const logoWidth = (logoDims.width / logoDims.height) * logoHeight;
        page.drawImage(companyLogoImage, {
          x: margin,
          y: y - logoHeight + 15,
          width: logoWidth,
          height: logoHeight,
        });
        y -= logoHeight + 5;
      } else {
        page.drawText(formData.companyName || 'Company Name', {
          x: margin,
          y: y,
          size: 20,
          font: boldFont,
          color: rgb(colors.primary.r, colors.primary.g, colors.primary.b),
        });
        y -= 18;
      }
      
      // Company address
      if (formData.companyAddress) {
        const companyFullAddress = [
          formData.companyAddress,
          [formData.companyCity, formData.companyState, formData.companyZip].filter(Boolean).join(', ')
        ].filter(Boolean).join(' | ');
        
        page.drawText(companyFullAddress, {
          x: margin,
          y: y,
          size: 9,
          font: font,
          color: rgb(0.4, 0.4, 0.4),
        });
        y -= 12;
      }
      
      if (formData.companyPhone || formData.companyEmail) {
        const contactInfo = [formData.companyPhone, formData.companyEmail].filter(Boolean).join(' | ');
        page.drawText(contactInfo, {
          x: margin,
          y: y,
          size: 9,
          font: font,
          color: rgb(0.4, 0.4, 0.4),
        });
        y -= 12;
      }
      
      // Divider line
      page.drawLine({
        start: { x: margin, y: y },
        end: { x: width - margin, y: y },
        thickness: 1,
        color: rgb(colors.accent.r, colors.accent.g, colors.accent.b),
      });
      
      y -= 30;
    }
    
    // === DATE ===
    page.drawText(formatDate(formData.letterDate) || formatDate(new Date().toISOString()), {
      x: margin,
      y: y,
      size: 11,
      font: font,
      color: rgb(colors.text.r, colors.text.g, colors.text.b),
    });
    y -= 30;
    
    // === CANDIDATE ADDRESS ===
    if (formData.candidateName) {
      page.drawText(formData.candidateName, {
        x: margin,
        y: y,
        size: 11,
        font: boldFont,
        color: rgb(colors.text.r, colors.text.g, colors.text.b),
      });
      y -= lineHeight;
    }
    
    if (formData.candidateAddress) {
      page.drawText(formData.candidateAddress, {
        x: margin,
        y: y,
        size: 11,
        font: font,
        color: rgb(colors.text.r, colors.text.g, colors.text.b),
      });
      y -= lineHeight;
    }
    
    const candidateCityStateZip = [formData.candidateCity, formData.candidateState, formData.candidateZip].filter(Boolean).join(', ');
    if (candidateCityStateZip) {
      page.drawText(candidateCityStateZip, {
        x: margin,
        y: y,
        size: 11,
        font: font,
        color: rgb(colors.text.r, colors.text.g, colors.text.b),
      });
      y -= lineHeight;
    }
    
    y -= 20;
    
    // === SUBJECT LINE ===
    page.drawText(`RE: Offer of Employment - ${formData.jobTitle || 'Position'}`, {
      x: margin,
      y: y,
      size: 12,
      font: boldFont,
      color: rgb(colors.primary.r, colors.primary.g, colors.primary.b),
    });
    y -= 25;
    
    // === GREETING ===
    page.drawText(`Dear ${formData.candidateName || 'Candidate'},`, {
      x: margin,
      y: y,
      size: 11,
      font: font,
      color: rgb(colors.text.r, colors.text.g, colors.text.b),
    });
    y -= 20;
    
    // === OPENING PARAGRAPH ===
    const openingText = `We are pleased to extend this offer of employment to you for the position of ${formData.jobTitle || '[Position]'} at ${formData.companyName || '[Company]'}. We were impressed with your qualifications and believe you will be a valuable addition to our team.`;
    y = drawText(openingText, margin, y);
    y -= 10;
    
    // === POSITION DETAILS ===
    page.drawText('Position Details:', {
      x: margin,
      y: y,
      size: 11,
      font: boldFont,
      color: rgb(colors.primary.r, colors.primary.g, colors.primary.b),
    });
    y -= 18;
    
    const details = [
      { label: 'Position', value: formData.jobTitle },
      { label: 'Department', value: formData.department },
      { label: 'Employment Type', value: formData.employmentType?.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) },
      { label: 'Work Location', value: formData.workLocation?.replace(/\b\w/g, l => l.toUpperCase()) },
      { label: 'Start Date', value: formatDate(formData.startDate) },
      { label: 'Reporting To', value: formData.reportingManager ? `${formData.reportingManager}${formData.reportingTitle ? `, ${formData.reportingTitle}` : ''}` : '' },
    ].filter(d => d.value);
    
    for (const detail of details) {
      page.drawText(`• ${detail.label}: `, {
        x: margin + 10,
        y: y,
        size: 10,
        font: boldFont,
        color: rgb(colors.text.r, colors.text.g, colors.text.b),
      });
      const labelWidth = boldFont.widthOfTextAtSize(`• ${detail.label}: `, 10);
      page.drawText(detail.value, {
        x: margin + 10 + labelWidth,
        y: y,
        size: 10,
        font: font,
        color: rgb(colors.text.r, colors.text.g, colors.text.b),
      });
      y -= 14;
    }
    
    y -= 10;
    
    // === COMPENSATION ===
    page.drawText('Compensation:', {
      x: margin,
      y: y,
      size: 11,
      font: boldFont,
      color: rgb(colors.primary.r, colors.primary.g, colors.primary.b),
    });
    y -= 18;
    
    const compensationText = `Your ${formData.compensationType === 'hourly' ? 'hourly rate' : (formData.compensationType === 'monthly' ? 'monthly salary' : 'annual salary')} will be ${formatCompensation(formData.compensationAmount, formData.compensationType)}, paid ${formData.payFrequency?.replace('-', ' ')}.`;
    y = drawText(compensationText, margin, y);
    y -= 10;
    
    // === BENEFITS ===
    if (formData.benefits) {
      page.drawText('Benefits:', {
        x: margin,
        y: y,
        size: 11,
        font: boldFont,
        color: rgb(colors.primary.r, colors.primary.g, colors.primary.b),
      });
      y -= 18;
      
      const benefitLines = formData.benefits.split('\n').filter(Boolean);
      for (const line of benefitLines) {
        if (y < 150) break; // Prevent overflow
        page.drawText(line, {
          x: margin + 10,
          y: y,
          size: 10,
          font: font,
          color: rgb(colors.text.r, colors.text.g, colors.text.b),
        });
        y -= 14;
      }
      y -= 5;
    }
    
    // === ADDITIONAL TERMS ===
    if (formData.additionalTerms) {
      page.drawText('Additional Terms:', {
        x: margin,
        y: y,
        size: 11,
        font: boldFont,
        color: rgb(colors.primary.r, colors.primary.g, colors.primary.b),
      });
      y -= 18;
      y = drawText(formData.additionalTerms, margin, y);
      y -= 10;
    }
    
    // === RESPONSE DEADLINE ===
    if (formData.responseDeadline) {
      const deadlineText = `Please confirm your acceptance of this offer by ${formatDate(formData.responseDeadline)}.`;
      y = drawText(deadlineText, margin, y);
      y -= 10;
    }
    
    // === CLOSING ===
    const closingText = `We are excited about the possibility of you joining our team. If you have any questions, please don't hesitate to contact us.`;
    y = drawText(closingText, margin, y);
    y -= 25;
    
    page.drawText('Sincerely,', {
      x: margin,
      y: y,
      size: 11,
      font: font,
      color: rgb(colors.text.r, colors.text.g, colors.text.b),
    });
    y -= 20;
    
    // HR Signature - either custom image or generated
    if (formData.hrSignatureType === "custom" && formData.hrSignatureImage) {
      // Custom signature image
      const hrSigImage = await embedImage(pdfDoc, formData.hrSignatureImage);
      if (hrSigImage) {
        const sigDims = hrSigImage.scale(0.3);
        const sigHeight = Math.min(sigDims.height, 40);
        const sigWidth = (sigDims.width / sigDims.height) * sigHeight;
        page.drawImage(hrSigImage, {
          x: margin,
          y: y - sigHeight,
          width: sigWidth,
          height: sigHeight,
        });
        y -= sigHeight + 10;
      }
    } else {
      // Generated signature using Yellowtail cursive font
      const signatureName = formData.signerName || '[Signer Name]';
      page.drawText(signatureName, {
        x: margin,
        y: y,
        size: 22,
        font: signatureFont,
        color: rgb(0.1, 0.1, 0.3),
      });
      y -= 25;
    }
    
    // Signature line
    page.drawLine({
      start: { x: margin, y: y },
      end: { x: margin + 200, y: y },
      thickness: 1,
      color: rgb(0.3, 0.3, 0.3),
    });
    y -= 15;
    
    page.drawText(formData.signerName || '[Signer Name]', {
      x: margin,
      y: y,
      size: 11,
      font: boldFont,
      color: rgb(colors.text.r, colors.text.g, colors.text.b),
    });
    y -= 14;
    
    page.drawText(formData.signerTitle || '[Title]', {
      x: margin,
      y: y,
      size: 10,
      font: font,
      color: rgb(0.4, 0.4, 0.4),
    });
    y -= 14;
    
    page.drawText(formData.companyName || '[Company]', {
      x: margin,
      y: y,
      size: 10,
      font: font,
      color: rgb(0.4, 0.4, 0.4),
    });
    
    // === CANDIDATE ACCEPTANCE (bottom of page) ===
    const acceptY = 100;
    
    page.drawLine({
      start: { x: margin, y: acceptY + 30 },
      end: { x: width - margin, y: acceptY + 30 },
      thickness: 0.5,
      color: rgb(0.7, 0.7, 0.7),
    });
    
    page.drawText('ACCEPTANCE', {
      x: margin,
      y: acceptY + 15,
      size: 9,
      font: boldFont,
      color: rgb(colors.primary.r, colors.primary.g, colors.primary.b),
    });
    
    page.drawText('I accept this offer of employment and agree to the terms outlined above.', {
      x: margin,
      y: acceptY,
      size: 9,
      font: font,
      color: rgb(0.4, 0.4, 0.4),
    });
    
    // Employee signature - handle different types
    const empSigType = formData.employeeSignatureType || 'blank';
    
    if (empSigType === "custom" && formData.employeeSignatureImage) {
      // Custom signature image - position ABOVE the signature line
      const empSigImage = await embedImage(pdfDoc, formData.employeeSignatureImage);
      if (empSigImage) {
        const sigDims = empSigImage.scale(0.3);
        const sigHeight = Math.min(sigDims.height, 35);
        const sigWidth = (sigDims.width / sigDims.height) * sigHeight;
        // Position signature so its bottom aligns just above the signature line (which is at acceptY - 30)
        page.drawImage(empSigImage, {
          x: margin,
          y: acceptY - 28, // Position above the line (line is at acceptY - 30)
          width: sigWidth,
          height: sigHeight,
        });
      }
    } else if (empSigType === "generated") {
      // Generated signature using Yellowtail cursive font
      const empSignatureName = formData.employeeSignatureName || formData.candidateName || '';
      if (empSignatureName) {
        page.drawText(empSignatureName, {
          x: margin + 5,
          y: acceptY - 20,
          size: 18,
          font: signatureFont,
          color: rgb(0.1, 0.1, 0.3),
        });
      }
    }
    // For 'blank' type, we just leave the signature line empty
    
    // Candidate signature line
    page.drawLine({
      start: { x: margin, y: acceptY - 30 },
      end: { x: 250, y: acceptY - 30 },
      thickness: 1,
      color: rgb(0.3, 0.3, 0.3),
    });
    page.drawText('Signature', {
      x: margin,
      y: acceptY - 42,
      size: 8,
      font: font,
      color: rgb(0.5, 0.5, 0.5),
    });
    
    // Print name line (for blank signatures)
    if (empSigType === "blank") {
      page.drawLine({
        start: { x: margin, y: acceptY - 55 },
        end: { x: 250, y: acceptY - 55 },
        thickness: 1,
        color: rgb(0.3, 0.3, 0.3),
      });
      page.drawText('Print Name', {
        x: margin,
        y: acceptY - 67,
        size: 8,
        font: font,
        color: rgb(0.5, 0.5, 0.5),
      });
    }
    
    // Date line
    page.drawLine({
      start: { x: 300, y: acceptY - 30 },
      end: { x: 450, y: acceptY - 30 },
      thickness: 1,
      color: rgb(0.3, 0.3, 0.3),
    });
    page.drawText('Date', {
      x: 300,
      y: acceptY - 42,
      size: 8,
      font: font,
      color: rgb(0.5, 0.5, 0.5),
    });
    
    // === WATERMARK (preview only) ===
    if (isPreview) {
      page.drawText('MintSlip', {
        x: width / 2 - 100,
        y: height / 2,
        size: 60,
        font: boldFont,
        color: rgb(0.85, 0.85, 0.85),
        rotate: { type: 'degrees', angle: -35 },
        opacity: 0.5,
      });
      
      page.drawText('PREVIEW', {
        x: width / 2 - 60,
        y: height / 2 - 50,
        size: 24,
        font: boldFont,
        color: rgb(0.85, 0.85, 0.85),
        rotate: { type: 'degrees', angle: -35 },
        opacity: 0.5,
      });
    }
    
    // Save the PDF
    const pdfBytes = await pdfDoc.save();
    return pdfBytes;
    
  } catch (error) {
    console.error("Error generating Offer Letter PDF:", error);
    throw error;
  }
};

// Generate and download offer letter
export const generateAndDownloadOfferLetter = async (formData) => {
  try {
    const pdfBytes = await generateOfferLetterPDF(formData, false);
    
    // Create blob and download
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.href = url;
    const fileName = `Offer_Letter_${formData.candidateName?.replace(/\s+/g, '_') || 'Candidate'}_${formData.companyName?.replace(/\s+/g, '_') || 'Company'}.pdf`;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
    return true;
  } catch (error) {
    console.error("Error downloading Offer Letter:", error);
    throw error;
  }
};

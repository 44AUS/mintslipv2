import { generateOfferLetterPDF } from './offerLetterGenerator';

// Generate offer letter preview with watermark
export const generateOfferLetterPreview = async (formData) => {
  try {
    // Generate PDF with preview watermark
    const pdfBytes = await generateOfferLetterPDF(formData, true);
    
    // Convert Uint8Array to base64 properly
    let binary = '';
    const bytes = new Uint8Array(pdfBytes);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = window.btoa(binary);
    const dataUrl = `data:application/pdf;base64,${base64}`;
    
    return dataUrl;
    
  } catch (error) {
    console.error("Error generating Offer Letter preview:", error);
    throw error;
  }
};

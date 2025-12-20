import { generateOfferLetterPDF } from './offerLetterGenerator';
import * as pdfjsLib from 'pdfjs-dist';

// Set up pdf.js worker using unpkg CDN with correct version
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

// Convert PDF bytes to image using pdf.js
async function convertPdfToImage(pdfBytes) {
  const loadingTask = pdfjsLib.getDocument({ data: pdfBytes });
  const pdf = await loadingTask.promise;
  
  // Get the first page
  const page = await pdf.getPage(1);
  
  // Set scale for good quality preview
  const scale = 2;
  const viewport = page.getViewport({ scale });
  
  // Create a canvas to render the PDF page
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  
  // Render the page to canvas
  await page.render({
    canvasContext: context,
    viewport: viewport
  }).promise;
  
  // Convert canvas to image data URL
  const imageDataUrl = canvas.toDataURL('image/png', 0.9);
  
  return imageDataUrl;
}

// Generate offer letter preview with watermark
export const generateOfferLetterPreview = async (formData) => {
  try {
    // Generate PDF with preview watermark
    const pdfBytes = await generateOfferLetterPDF(formData, true);
    
    // Convert PDF to image for preview display
    const imageDataUrl = await convertPdfToImage(pdfBytes);
    
    return imageDataUrl;
    
  } catch (error) {
    console.error("Error generating Offer Letter preview:", error);
    throw error;
  }
};

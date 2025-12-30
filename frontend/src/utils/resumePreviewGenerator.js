import { generateResumePDF } from "./resumeGenerator";

// Lazy load pdf.js only when needed to avoid affecting other pages
let pdfjsLib = null;

async function initPdfJs() {
  if (!pdfjsLib) {
    pdfjsLib = await import('pdfjs-dist');
    // Use a working CDN version
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  }
  return pdfjsLib;
}

// Convert PDF to image
async function convertPdfToImage(pdfDataUrl) {
  try {
    const pdfjs = await initPdfJs();
    const pdf = await pdfjs.getDocument(pdfDataUrl).promise;
    const page = await pdf.getPage(1);
    
    const scale = 2;
    const viewport = page.getViewport({ scale });
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    
    await page.render({
      canvasContext: context,
      viewport: viewport
    }).promise;
    
    return canvas.toDataURL('image/jpeg', 0.9);
  } catch (error) {
    console.error('Error converting PDF to image:', error);
    throw error;
  }
}

// Generate resume preview image
export const generateResumePreview = async (data) => {
  try {
    // Generate PDF with watermark if not paid
    const addWatermark = !data.isPaid;
    const pdfDoc = await generateResumePDF(data, addWatermark);
    
    // Convert to data URL
    const pdfDataUrl = pdfDoc.output('dataurlstring');
    
    // Convert to image
    const imageDataUrl = await convertPdfToImage(pdfDataUrl);
    
    return imageDataUrl;
  } catch (error) {
    console.error('Error generating resume preview:', error);
    throw error;
  }
};

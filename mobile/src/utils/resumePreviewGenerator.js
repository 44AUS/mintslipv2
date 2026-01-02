import { generateResumePDF } from "./resumeGenerator";
import * as pdfjsLib from 'pdfjs-dist';

// Set worker path - use same pattern as other preview generators
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

// Convert PDF to image
async function convertPdfToImage(pdfDataUrl) {
  try {
    // Convert data URL to array buffer
    const response = await fetch(pdfDataUrl);
    const pdfBytes = await response.arrayBuffer();
    
    const loadingTask = pdfjsLib.getDocument({ data: pdfBytes });
    const pdf = await loadingTask.promise;
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

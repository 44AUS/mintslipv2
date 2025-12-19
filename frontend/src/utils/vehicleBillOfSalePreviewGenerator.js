import { generateVehicleBillOfSalePDF } from './vehicleBillOfSaleGenerator';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Set up pdf.js worker using local bundled worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

// Generate Vehicle Bill of Sale preview as an image (no iframe needed)
export const generateVehicleBillOfSalePreview = async (formData) => {
  try {
    // Generate PDF with preview watermark
    const pdfBytes = await generateVehicleBillOfSalePDF(formData, true);
    
    // Convert PDF to image using pdf.js
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
    
  } catch (error) {
    console.error("Error generating Vehicle Bill of Sale preview:", error);
    throw error;
  }
};

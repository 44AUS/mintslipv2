import { generateCeaseAndDesistPDF } from './ceaseAndDesistGenerator';
import * as pdfjsLib from 'pdfjs-dist';

// Set up pdf.js worker using unpkg CDN with correct version
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

// Convert PDF bytes to image using pdf.js
async function convertPdfToImage(pdfBytes) {
  const loadingTask = pdfjsLib.getDocument({ data: pdfBytes });
  const pdf = await loadingTask.promise;

  const page = await pdf.getPage(1);

  const scale = 2;
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.width = viewport.width;
  canvas.height = viewport.height;

  await page.render({
    canvasContext: context,
    viewport: viewport
  }).promise;

  return canvas.toDataURL('image/png', 0.9);
}

// Generate cease and desist preview with watermark
export const generateCeaseAndDesistPreview = async (formData) => {
  try {
    const pdfBytes = await generateCeaseAndDesistPDF(formData, true);
    const imageDataUrl = await convertPdfToImage(pdfBytes);
    return imageDataUrl;
  } catch (error) {
    console.error("Error generating Cease and Desist preview:", error);
    throw error;
  }
};

import { generateCommercialLeasePDF } from './commercialLeaseGenerator';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

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

  await page.render({ canvasContext: context, viewport }).promise;

  return canvas.toDataURL('image/png', 0.9);
}

export const generateCommercialLeasePreview = async (formData) => {
  try {
    const pdfBytes = await generateCommercialLeasePDF(formData, true);
    return await convertPdfToImage(pdfBytes);
  } catch (error) {
    console.error("Error generating Commercial Lease preview:", error);
    throw error;
  }
};

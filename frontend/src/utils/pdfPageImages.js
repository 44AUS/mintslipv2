import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

// Render every page of a PDF to PNG data URLs so multi-page documents can
// show the full preview with the page slider (capped for safety).
export async function pdfToPageImages(pdfBytes, { scale = 2, maxPages = 12 } = {}) {
  const pdf = await pdfjsLib.getDocument({ data: pdfBytes }).promise;
  const count = Math.min(pdf.numPages, maxPages);
  const images = [];
  for (let i = 1; i <= count; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    await page.render({ canvasContext: canvas.getContext("2d"), viewport }).promise;
    images.push(canvas.toDataURL("image/png", 0.9));
  }
  return images;
}

// Shared preview watermark for every sample/preview document: the MintSlip
// logo is stamped at low opacity at the top, middle and bottom of each page
// (the old red "PREVIEW" banner has been removed). All three stamps use the
// same opacity. Works for both PDF stacks in use — jsPDF and pdf-lib.
import logoUrl from "../assests/mintslip-logo.png";

let logoCache; // { dataUrl, bytes, w, h } | null once resolved

async function getLogo() {
  if (logoCache !== undefined) return logoCache;
  try {
    const res = await fetch(logoUrl);
    const bytes = new Uint8Array(await res.arrayBuffer());
    const dims = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
      img.onerror = reject;
      img.src = logoUrl;
    });
    const blob = new Blob([bytes], { type: "image/png" });
    const dataUrl = await new Promise((resolve) => {
      const r = new FileReader();
      r.onloadend = () => resolve(r.result);
      r.readAsDataURL(blob);
    });
    logoCache = { dataUrl, bytes, ...dims };
  } catch (e) {
    console.error("Preview watermark: failed to load logo", e);
    logoCache = null;
  }
  return logoCache;
}

const LOGO_WIDTH_RATIO = 0.55; // of page width
const LOGO_OPACITY = 0.1;
// Vertical centres of the three stamps, as a fraction from the top of the page.
const STAMP_CENTERS = [0.2, 0.5, 0.8];

// jsPDF: stamp every page of the document.
export async function addPreviewWatermarkJsPdf(doc, pageWidth, pageHeight) {
  const logo = await getLogo();
  if (!logo) return;
  const lw = pageWidth * LOGO_WIDTH_RATIO;
  const lh = lw * (logo.h / logo.w);
  const pages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.saveGraphicsState();
    try { doc.setGState(new doc.GState({ opacity: LOGO_OPACITY })); } catch (e) { /* older jsPDF */ }
    STAMP_CENTERS.forEach((f) => {
      // jsPDF y is the image top edge, measured from the top of the page.
      doc.addImage(logo.dataUrl, "PNG", (pageWidth - lw) / 2, pageHeight * f - lh / 2, lw, lh);
    });
    doc.restoreGraphicsState();
  }
}

// pdf-lib: stamp every page of the document. `boldFont` is accepted for
// backward compatibility with existing callers but is no longer used.
export async function addPreviewWatermarkPdfLib(pdfDoc) {
  const logo = await getLogo();
  if (!logo) return;
  const image = await pdfDoc.embedPng(logo.bytes);
  for (const page of pdfDoc.getPages()) {
    const { width, height } = page.getSize();
    const lw = width * LOGO_WIDTH_RATIO;
    const lh = lw * (image.height / image.width);
    STAMP_CENTERS.forEach((f) => {
      // pdf-lib y is the image bottom edge, measured from the bottom of the
      // page, so a top-fraction centre f maps to (1 - f) from the bottom.
      page.drawImage(image, {
        x: (width - lw) / 2,
        y: height * (1 - f) - lh / 2,
        width: lw,
        height: lh,
        opacity: LOGO_OPACITY,
      });
    });
  }
}

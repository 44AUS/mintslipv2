// Shared preview watermark for every sample/preview document: the red
// "PREVIEW" banner stays at the top of each page, and the MintSlip logo is
// stamped dead-centre at low opacity (replacing the old diagonal text spam).
// Works for both PDF stacks in use — jsPDF and pdf-lib.
import { rgb, StandardFonts } from "pdf-lib";
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
    logoCache = null; // fall back to PREVIEW-only watermarks
  }
  return logoCache;
}

const LOGO_WIDTH_RATIO = 0.55; // of page width
const LOGO_OPACITY = 0.1;

// jsPDF: stamp every page of the document.
export async function addPreviewWatermarkJsPdf(doc, pageWidth, pageHeight) {
  const logo = await getLogo();
  const pages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    if (logo) {
      const lw = pageWidth * LOGO_WIDTH_RATIO;
      const lh = lw * (logo.h / logo.w);
      doc.saveGraphicsState();
      try { doc.setGState(new doc.GState({ opacity: LOGO_OPACITY })); } catch (e) { /* older jsPDF */ }
      doc.addImage(logo.dataUrl, "PNG", (pageWidth - lw) / 2, (pageHeight - lh) / 2, lw, lh);
      doc.restoreGraphicsState();
    }
    doc.saveGraphicsState();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(40);
    doc.setTextColor(255, 100, 100);
    doc.text("PREVIEW", pageWidth / 2, 50, { align: "center" });
    doc.restoreGraphicsState();
  }
}

// pdf-lib: stamp every page of the document. Pass the already-embedded bold
// font when the caller has one; otherwise one is embedded here.
export async function addPreviewWatermarkPdfLib(pdfDoc, boldFont = null) {
  const logo = await getLogo();
  const image = logo ? await pdfDoc.embedPng(logo.bytes) : null;
  const font = boldFont || await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  for (const page of pdfDoc.getPages()) {
    const { width, height } = page.getSize();
    if (image) {
      const lw = width * LOGO_WIDTH_RATIO;
      const lh = lw * (image.height / image.width);
      page.drawImage(image, {
        x: (width - lw) / 2,
        y: (height - lh) / 2,
        width: lw,
        height: lh,
        opacity: LOGO_OPACITY,
      });
    }
    const size = 40;
    const tw = font.widthOfTextAtSize("PREVIEW", size);
    page.drawText("PREVIEW", {
      x: (width - tw) / 2,
      y: height - 55,
      size,
      font,
      color: rgb(1, 0.39, 0.39),
    });
  }
}

import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";

// Helper to convert hex color to RGB
const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16) / 255,
    g: parseInt(result[2], 16) / 255,
    b: parseInt(result[3], 16) / 255
  } : { r: 0, g: 0, b: 0 };
};

// Format date for display
const formatDate = (dateStr) => {
  if (!dateStr) return "";
  const date = new Date(dateStr + "T00:00:00");
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
};

// Template colors
const getTemplateColors = (template, primaryColor, accentColor) => {
  switch (template) {
    case "modern":
      return {
        primary: { r: 0.15, g: 0.15, b: 0.15 },
        accent:  { r: 0.72, g: 0.11, b: 0.11 },
        text:    { r: 0.15, g: 0.15, b: 0.15 },
      };
    case "custom":
      return {
        primary: hexToRgb(primaryColor || "#1a1a1a"),
        accent:  hexToRgb(accentColor  || "#b71c1c"),
        text:    { r: 0.1, g: 0.1, b: 0.1 },
      };
    case "professional":
    default:
      return {
        primary: { r: 0.1,  g: 0.15, b: 0.28 },
        accent:  { r: 0.72, g: 0.11, b: 0.11 },
        text:    { r: 0.1,  g: 0.1,  b: 0.1  },
      };
  }
};

// Embed a base64/data-url image
const embedImage = async (pdfDoc, dataUrl) => {
  try {
    if (!dataUrl) return null;
    const base64 = dataUrl.includes(",") ? dataUrl.split(",")[1] : dataUrl;
    const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
    if (dataUrl.includes("image/png")) return await pdfDoc.embedPng(bytes);
    return await pdfDoc.embedJpg(bytes);
  } catch (err) {
    console.warn("Could not embed image:", err);
    return null;
  }
};

// Body copy for each violation type
const VIOLATION_BODIES = {
  harassment: (d) => [
    `This letter serves as formal notice to immediately CEASE AND DESIST all harassing conduct directed toward ${d.senderName || "the sender"}.`,
    `It has come to my attention that you have engaged in the following conduct: ${d.description || "harassing behavior"}. This conduct is unwelcome, has caused substantial distress, and may constitute harassment under applicable state and federal law.`,
    `You are hereby directed to immediately stop all such conduct, including but not limited to contacting, following, monitoring, or communicating with me by any means, whether directly or through third parties.`,
  ],
  defamation: (d) => [
    `This letter serves as formal notice to immediately CEASE AND DESIST the publication of false and defamatory statements concerning ${d.senderName || "the sender"}.`,
    `Specifically, you have made the following false statements: ${d.description || "defamatory statements"}. These statements are false, were published to third parties, and have caused damage to my reputation, business, and standing in the community.`,
    `You are hereby directed to immediately cease making such statements, to retract all prior statements, and to remove any such content published online or in any other medium.`,
  ],
  "ip-infringement": (d) => [
    `This letter serves as formal notice to immediately CEASE AND DESIST all unauthorized use of intellectual property owned by ${d.senderName || "the sender"}.`,
    `It has come to my attention that you are using the following protected material without authorization: ${d.description || "protected intellectual property"}. I am the rightful owner of this material and have never granted you a license or permission to use it.`,
    `You are hereby directed to immediately stop all use, reproduction, distribution, and display of the material, and to remove it from all platforms, products, and marketing materials under your control.`,
  ],
  "debt-collection": (d) => [
    `This letter serves as formal notice to immediately CEASE AND DESIST all further communication regarding the alleged debt referenced below.`,
    `Pursuant to the Fair Debt Collection Practices Act (FDCPA), 15 U.S.C. § 1692c(c), you are required to cease all communication with me regarding this alleged debt upon receipt of this written request. The matter concerns: ${d.description || "the alleged debt"}.`,
    `You may only contact me hereafter to confirm that further communication has ceased or to notify me of a specific legal remedy you intend to pursue. Any further contact in violation of this notice may subject you to statutory damages.`,
  ],
  "breach-of-contract": (d) => [
    `This letter serves as formal notice to immediately CEASE AND DESIST conduct that constitutes a breach of the agreement between us.`,
    `You are in breach of our agreement in the following respects: ${d.description || "the breaching conduct"}. This conduct is a material violation of the terms to which you agreed.`,
    `You are hereby directed to immediately cure this breach and to cease all conduct that violates the terms of our agreement.`,
  ],
  other: (d) => [
    `This letter serves as formal notice to immediately CEASE AND DESIST the conduct described below.`,
    `The conduct at issue is as follows: ${d.description || "the conduct at issue"}. This conduct is unlawful and/or violates my legal rights.`,
    `You are hereby directed to immediately stop this conduct and to refrain from engaging in it in the future.`,
  ],
};

export const generateCeaseAndDesistPDF = async (formData, isPreview = false) => {
  try {
    const pdfDoc = await PDFDocument.create();
    pdfDoc.registerFontkit(fontkit);

    const font       = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    const boldFont   = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
    const italicFont = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);

    // Signature font (Yellowtail) with italic fallback
    let signatureFont = italicFont;
    try {
      const fontUrl = window.location.origin + "/fonts/Yellowtail-Regular.ttf";
      const res = await fetch(fontUrl);
      if (res.ok) {
        const bytes = await res.arrayBuffer();
        signatureFont = await pdfDoc.embedFont(new Uint8Array(bytes));
      }
    } catch (e) {
      console.warn("Yellowtail font unavailable, using italic fallback");
    }

    const colors = getTemplateColors(formData.template, formData.primaryColor, formData.accentColor);

    const PAGE_W = 612, PAGE_H = 792;
    const margin = 60;
    const maxWidth = PAGE_W - margin * 2;
    const lineHeight = 15;

    let page = pdfDoc.addPage([PAGE_W, PAGE_H]);
    let y = PAGE_H - margin;

    const newPage = () => {
      page = pdfDoc.addPage([PAGE_W, PAGE_H]);
      y = PAGE_H - margin;
    };

    const ensureSpace = (needed) => {
      if (y - needed < margin + 40) newPage();
    };

    // Draw wrapped text, returns new y
    const drawText = (text, opts = {}) => {
      const {
        size = 11,
        fontType = "regular",
        color = colors.text,
        x = margin,
        width = maxWidth,
        lh = lineHeight,
        indent = 0,
      } = opts;
      if (!text) return y;
      const f = fontType === "bold" ? boldFont : fontType === "italic" ? italicFont : font;

      // Preserve explicit newlines
      const paragraphs = String(text).split("\n");
      for (const para of paragraphs) {
        if (!para.trim()) { y -= lh; continue; }
        const words = para.split(" ");
        let line = "";
        for (const word of words) {
          const test = line ? line + " " + word : word;
          if (f.widthOfTextAtSize(test, size) > width - indent && line) {
            ensureSpace(lh);
            page.drawText(line, { x: x + indent, y, size, font: f, color: rgb(color.r, color.g, color.b) });
            y -= lh;
            line = word;
          } else {
            line = test;
          }
        }
        if (line) {
          ensureSpace(lh);
          page.drawText(line, { x: x + indent, y, size, font: f, color: rgb(color.r, color.g, color.b) });
          y -= lh;
        }
      }
      return y;
    };

    // ── HEADER ──────────────────────────────────────────────────────────────
    const logoImage = formData.senderLogo ? await embedImage(pdfDoc, formData.senderLogo) : null;

    if (formData.template === "modern") {
      page.drawRectangle({ x: 0, y: PAGE_H - 70, width: PAGE_W, height: 70, color: rgb(colors.primary.r, colors.primary.g, colors.primary.b) });
      if (logoImage) {
        const d = logoImage.scale(0.5);
        const h = Math.min(d.height, 42);
        const w = (d.width / d.height) * h;
        page.drawImage(logoImage, { x: margin, y: PAGE_H - 56, width: w, height: h });
      } else {
        page.drawText(formData.senderName || "", {
          x: margin, y: PAGE_H - 45, size: 18, font: boldFont, color: rgb(1, 1, 1),
        });
      }
      y = PAGE_H - 100;
    } else {
      if (logoImage) {
        const d = logoImage.scale(0.5);
        const h = Math.min(d.height, 48);
        const w = (d.width / d.height) * h;
        page.drawImage(logoImage, { x: margin, y: y - h, width: w, height: h });
        y -= h + 12;
      }
      // Sender letterhead block
      if (formData.senderName) {
        page.drawText(formData.senderName, { x: margin, y, size: 14, font: boldFont, color: rgb(colors.primary.r, colors.primary.g, colors.primary.b) });
        y -= 16;
      }
      const senderLines = [
        formData.senderAddress,
        [formData.senderCity, formData.senderState].filter(Boolean).join(", ") + (formData.senderZip ? ` ${formData.senderZip}` : ""),
        formData.senderPhone,
        formData.senderEmail,
      ].filter(l => l && l.trim() && l.trim() !== ",");
      for (const l of senderLines) {
        page.drawText(l, { x: margin, y, size: 10, font, color: rgb(0.35, 0.35, 0.35) });
        y -= 12;
      }
      y -= 6;
      page.drawLine({
        start: { x: margin, y }, end: { x: PAGE_W - margin, y },
        thickness: 1.5, color: rgb(colors.accent.r, colors.accent.g, colors.accent.b),
      });
      y -= 24;
    }

    // ── DATE ────────────────────────────────────────────────────────────────
    drawText(formatDate(formData.letterDate) || formatDate(new Date().toISOString().slice(0, 10)), { size: 11 });
    y -= 12;

    // ── RECIPIENT BLOCK ─────────────────────────────────────────────────────
    if (formData.recipientName) {
      drawText(formData.recipientName, { size: 11, fontType: "bold" });
    }
    const recipLines = [
      formData.recipientCompany,
      formData.recipientAddress,
      [formData.recipientCity, formData.recipientState].filter(Boolean).join(", ") + (formData.recipientZip ? ` ${formData.recipientZip}` : ""),
    ].filter(l => l && l.trim() && l.trim() !== ",");
    for (const l of recipLines) drawText(l, { size: 11 });
    y -= 14;

    // ── DELIVERY METHOD ─────────────────────────────────────────────────────
    if (formData.deliveryMethod) {
      const methods = {
        "certified-mail": "VIA CERTIFIED MAIL, RETURN RECEIPT REQUESTED",
        email: "VIA ELECTRONIC MAIL",
        both: "VIA CERTIFIED MAIL AND ELECTRONIC MAIL",
        "hand-delivery": "VIA HAND DELIVERY",
      };
      const label = methods[formData.deliveryMethod];
      if (label) {
        drawText(label, { size: 9.5, fontType: "bold", color: { r: 0.4, g: 0.4, b: 0.4 } });
        y -= 10;
      }
    }

    // ── SUBJECT LINE ────────────────────────────────────────────────────────
    ensureSpace(40);
    const subject = formData.subject?.trim() || "CEASE AND DESIST DEMAND";
    drawText(`RE: ${subject.toUpperCase()}`, { size: 12, fontType: "bold", color: colors.accent });
    y -= 14;

    // ── SALUTATION ──────────────────────────────────────────────────────────
    const salutation = formData.recipientName ? `Dear ${formData.recipientName}:` : "To Whom It May Concern:";
    drawText(salutation, { size: 11 });
    y -= 12;

    // ── BODY ────────────────────────────────────────────────────────────────
    const bodyFn = VIOLATION_BODIES[formData.violationType] || VIOLATION_BODIES.other;
    const paragraphs = bodyFn(formData);

    for (const p of paragraphs) {
      drawText(p, { size: 11 });
      y -= 10;
    }

    // Incident date / location detail
    if (formData.incidentDate || formData.incidentLocation) {
      const parts = [];
      if (formData.incidentDate) parts.push(`on or about ${formatDate(formData.incidentDate)}`);
      if (formData.incidentLocation) parts.push(`at ${formData.incidentLocation}`);
      drawText(`The conduct referenced above occurred ${parts.join(" ")}.`, { size: 11 });
      y -= 10;
    }

    // Additional custom statement
    if (formData.additionalDetails?.trim()) {
      drawText(formData.additionalDetails.trim(), { size: 11 });
      y -= 10;
    }

    // ── DEMAND / DEADLINE ───────────────────────────────────────────────────
    ensureSpace(60);
    const days = parseInt(formData.complianceDays, 10) || 10;
    drawText(
      `You are required to comply with this demand within ${days} days of receipt of this letter. Please confirm in writing that you have complied and that you will refrain from such conduct in the future.`,
      { size: 11 }
    );
    y -= 10;

    // ── CONSEQUENCES ────────────────────────────────────────────────────────
    ensureSpace(60);
    const consequence = formData.legalAction?.trim()
      ? formData.legalAction.trim()
      : "Should you fail to comply with this demand, I am prepared to pursue all available legal remedies, which may include filing a civil action seeking injunctive relief, monetary damages, and recovery of attorneys' fees and costs to the fullest extent permitted by law.";
    drawText(consequence, { size: 11 });
    y -= 10;

    // ── RESERVATION OF RIGHTS ───────────────────────────────────────────────
    ensureSpace(50);
    drawText(
      "This letter is written without prejudice to any of my rights and remedies, all of which are expressly reserved. Nothing contained herein shall be construed as a waiver of any right or remedy available to me at law or in equity.",
      { size: 10, fontType: "italic", color: { r: 0.3, g: 0.3, b: 0.3 } }
    );
    y -= 22;

    // ── SIGNATURE ───────────────────────────────────────────────────────────
    ensureSpace(110);
    drawText("Sincerely,", { size: 11 });
    y -= 24;

    // Signature image or scripted name
    if (formData.signatureImage) {
      const sigImg = await embedImage(pdfDoc, formData.signatureImage);
      if (sigImg) {
        // Fit within a 220x48pt box, preserving aspect ratio. Drawn signatures
        // can be very wide, so constrain on both axes.
        const MAX_W = 220, MAX_H = 48;
        const ratio = sigImg.width / sigImg.height;
        let h = MAX_H;
        let w = h * ratio;
        if (w > MAX_W) { w = MAX_W; h = w / ratio; }
        page.drawImage(sigImg, { x: margin, y: y - h + 10, width: w, height: h });
        y -= h - 2;
      }
    } else if (formData.signatureName?.trim() || formData.senderName) {
      const sigText = formData.signatureName?.trim() || formData.senderName;
      page.drawText(sigText, {
        x: margin, y, size: 22, font: signatureFont,
        color: rgb(colors.primary.r, colors.primary.g, colors.primary.b),
      });
      y -= 8;
    }

    y -= 14;

    if (formData.senderName) {
      page.drawText(formData.senderName, { x: margin, y, size: 11, font: boldFont, color: rgb(colors.text.r, colors.text.g, colors.text.b) });
      y -= 13;
    }
    if (formData.senderTitle) {
      page.drawText(formData.senderTitle, { x: margin, y, size: 10, font, color: rgb(0.35, 0.35, 0.35) });
      y -= 13;
    }

    // ── PREVIEW WATERMARK ───────────────────────────────────────────────────
    if (isPreview) {
      const pages = pdfDoc.getPages();
      for (const p of pages) {
        const { width: w, height: h } = p.getSize();
        p.drawText("PREVIEW", {
          x: w / 2 - 150, y: h / 2, size: 72, font: boldFont,
          color: rgb(0.85, 0.85, 0.85), opacity: 0.45, rotate: { type: "degrees", angle: 45 },
        });
      }
    }

    return await pdfDoc.save();
  } catch (error) {
    console.error("Error generating Cease and Desist PDF:", error);
    throw error;
  }
};

// Generate and download
export const generateAndDownloadCeaseAndDesist = async (formData, returnBlob = false) => {
  try {
    const pdfBytes = await generateCeaseAndDesistPDF(formData, false);
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const who = formData.recipientName?.replace(/\s+/g, "_") || "Recipient";
    const pdfFileName = `Cease_and_Desist_${who}.pdf`;

    sessionStorage.setItem("lastDownloadUrl", url);
    sessionStorage.setItem("lastDownloadFileName", pdfFileName);

    const link = document.createElement("a");
    link.href = url;
    link.download = pdfFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (returnBlob) return blob;
    return true;
  } catch (error) {
    console.error("Error downloading Cease and Desist letter:", error);
    throw error;
  }
};

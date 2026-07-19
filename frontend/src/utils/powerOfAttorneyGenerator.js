import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";

// ── helpers ──────────────────────────────────────────────────────────────────

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
};

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

// Powers that can be granted, in the conventional statutory order
export const POA_POWERS = [
  { id: "realEstate",      label: "Real property transactions",
    desc: "Buy, sell, lease, mortgage, and manage real estate." },
  { id: "personalProperty",label: "Tangible personal property transactions",
    desc: "Buy, sell, and manage vehicles, furnishings, and other personal property." },
  { id: "securities",      label: "Stocks, bonds, and other securities",
    desc: "Buy, sell, and exercise rights in securities and brokerage accounts." },
  { id: "banking",         label: "Banking and financial institution transactions",
    desc: "Open, close, and operate accounts; write checks; make deposits and withdrawals." },
  { id: "business",        label: "Business operating transactions",
    desc: "Operate, manage, and make decisions for a business interest." },
  { id: "insurance",       label: "Insurance and annuity transactions",
    desc: "Purchase, modify, surrender, and make claims on policies and annuities." },
  { id: "estates",         label: "Estate, trust, and other beneficiary transactions",
    desc: "Act on interests in estates, trusts, and other beneficial interests." },
  { id: "claims",          label: "Claims and litigation",
    desc: "Assert, defend, settle, and compromise legal claims on my behalf." },
  { id: "familyMaintenance", label: "Personal and family maintenance",
    desc: "Pay for support, housing, medical care, and living expenses of my family." },
  { id: "governmentBenefits", label: "Benefits from governmental programs",
    desc: "Apply for and manage Social Security, Medicare, Medicaid, and military benefits." },
  { id: "retirement",      label: "Retirement plan transactions",
    desc: "Contribute to, withdraw from, and manage retirement accounts." },
  { id: "taxes",           label: "Tax matters",
    desc: "Prepare, sign, and file tax returns and handle matters with tax authorities." },
  { id: "digitalAssets",   label: "Digital assets and online accounts",
    desc: "Access, manage, and close digital accounts, files, and online records." },
  { id: "safeDeposit",     label: "Safe deposit box access",
    desc: "Enter, add to, and remove contents from any safe deposit box." },
  { id: "gifts",           label: "Making limited gifts",
    desc: "Make gifts consistent with my history of giving and estate plan." },
];

export const generatePowerOfAttorneyPDF = async (formData, isPreview = false) => {
  try {
    const pdfDoc = await PDFDocument.create();
    pdfDoc.registerFontkit(fontkit);

    const font       = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    const boldFont   = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
    const italicFont = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);

    let signatureFont = italicFont;
    try {
      const res = await fetch(window.location.origin + "/fonts/Yellowtail-Regular.ttf");
      if (res.ok) signatureFont = await pdfDoc.embedFont(new Uint8Array(await res.arrayBuffer()));
    } catch { /* italic fallback */ }

    const PAGE_W = 612, PAGE_H = 792;
    const margin = 62;
    const maxWidth = PAGE_W - margin * 2;
    const BODY = 10.5;
    const LH = 14.5;

    let page = pdfDoc.addPage([PAGE_W, PAGE_H]);
    let y = PAGE_H - margin;
    const pageRefs = [page];

    const newPage = () => {
      page = pdfDoc.addPage([PAGE_W, PAGE_H]);
      pageRefs.push(page);
      y = PAGE_H - margin;
    };

    const ensure = (needed) => { if (y - needed < margin + 30) newPage(); };

    // Wrapped text writer
    const write = (text, opts = {}) => {
      const {
        size = BODY, fontType = "regular", color = { r: 0.1, g: 0.1, b: 0.1 },
        x = margin, width = maxWidth, lh = LH, align = "left", indent = 0,
      } = opts;
      if (text === undefined || text === null) return;
      const f = fontType === "bold" ? boldFont : fontType === "italic" ? italicFont : font;

      for (const para of String(text).split("\n")) {
        if (!para.trim()) { y -= lh; continue; }
        const words = para.split(" ");
        let line = "";
        const flush = (str) => {
          ensure(lh);
          let drawX = x + indent;
          if (align === "center") drawX = (PAGE_W - f.widthOfTextAtSize(str, size)) / 2;
          page.drawText(str, { x: drawX, y, size, font: f, color: rgb(color.r, color.g, color.b) });
          y -= lh;
        };
        for (const w of words) {
          const test = line ? line + " " + w : w;
          if (f.widthOfTextAtSize(test, size) > width - indent && line) { flush(line); line = w; }
          else line = test;
        }
        if (line) flush(line);
      }
    };

    // Section heading
    const heading = (text) => {
      ensure(LH * 3);
      y -= 6;
      write(text, { size: 11.5, fontType: "bold" });
      y -= 2;
    };

    // Labelled fill-in line, e.g. "Name: Jane Doe"
    const labelled = (label, value, opts = {}) => {
      const { lineWidth = maxWidth } = opts;
      ensure(LH + 6);
      const labelW = boldFont.widthOfTextAtSize(label, BODY);
      page.drawText(label, { x: margin, y, size: BODY, font: boldFont, color: rgb(0.1, 0.1, 0.1) });
      const valX = margin + labelW + 6;
      page.drawText(value || "", { x: valX, y, size: BODY, font, color: rgb(0.1, 0.1, 0.1) });
      // underline the value area
      page.drawLine({
        start: { x: valX, y: y - 3 }, end: { x: margin + lineWidth, y: y - 3 },
        thickness: 0.5, color: rgb(0.72, 0.72, 0.72),
      });
      y -= LH + 4;
    };

    const state = (formData.governingState || "").trim();
    const principal = (formData.principalName || "").trim();
    const agent = (formData.agentName || "").trim();

    const fullAddress = (a, c, s, z) =>
      [a, [c, s].filter(Boolean).join(", "), z].filter(Boolean).join(" ").replace(/\s+,/g, ",").trim();

    // ── TITLE ────────────────────────────────────────────────────────────────
    write("DURABLE GENERAL POWER OF ATTORNEY", { size: 16, fontType: "bold", align: "center", lh: 22 });
    if (state) write(`State of ${state}`, { size: 11, align: "center", lh: 18, color: { r: 0.35, g: 0.35, b: 0.35 } });
    y -= 6;
    page.drawLine({ start: { x: margin, y }, end: { x: PAGE_W - margin, y }, thickness: 1.2, color: rgb(0.15, 0.28, 0.19) });
    y -= 20;

    // ── NOTICE ───────────────────────────────────────────────────────────────
    write("IMPORTANT INFORMATION", { size: 10, fontType: "bold" });
    write(
      "This is an important legal document. By signing it, you are authorizing another person to act for you, the Principal. " +
      "Before you sign, you should read this document carefully and understand the authority you are granting. Your Agent has a duty " +
      "to act in your best interest, to act in good faith, and to keep a record of all receipts, disbursements, and transactions made " +
      "on your behalf. This power of attorney does not authorize your Agent to make health care decisions for you. You may revoke this " +
      "power of attorney at any time while you have capacity to do so.",
      { size: 9.5, fontType: "italic", lh: 12.5, color: { r: 0.3, g: 0.3, b: 0.3 } }
    );
    y -= 8;

    // ── 1. DESIGNATION ───────────────────────────────────────────────────────
    heading("1. DESIGNATION OF AGENT");
    write(
      `I, ${principal || "________________________"}, of ${fullAddress(formData.principalAddress, formData.principalCity, formData.principalState, formData.principalZip) || "________________________"} ` +
      `(the "Principal"), hereby appoint the person named below as my Agent (attorney-in-fact) to act for me in any lawful way with respect ` +
      `to the powers granted in this document.`
    );
    y -= 4;
    labelled("Agent Name:", agent);
    labelled("Agent Address:", fullAddress(formData.agentAddress, formData.agentCity, formData.agentState, formData.agentZip));
    labelled("Agent Phone:", formData.agentPhone);
    labelled("Relationship to Principal:", formData.agentRelationship);

    // ── 2. SUCCESSOR AGENT ───────────────────────────────────────────────────
    if (formData.successorName?.trim()) {
      heading("2. SUCCESSOR AGENT");
      write(
        "If my Agent named above is unable, unwilling, or unavailable to serve, or resigns, dies, or is adjudicated incompetent, " +
        "I appoint the following person to serve as my successor Agent with the same authority granted above:"
      );
      y -= 4;
      labelled("Successor Agent:", formData.successorName);
      labelled("Successor Address:", fullAddress(formData.successorAddress, formData.successorCity, formData.successorState, formData.successorZip));
      labelled("Successor Phone:", formData.successorPhone);
    }

    // ── 3. GRANT OF AUTHORITY ────────────────────────────────────────────────
    const sectionNum = formData.successorName?.trim() ? 3 : 2;
    heading(`${sectionNum}. GRANT OF GENERAL AUTHORITY`);
    write(
      "I grant my Agent full power and authority to act on my behalf with respect to each subject marked below. My Agent may take any " +
      "action reasonably necessary to carry out that authority, including signing documents, and shall have the same power over my " +
      "property and affairs that I would have if acting personally."
    );
    y -= 8;

    const granted = formData.powers || {};
    const grantAll = !!formData.grantAllPowers;

    for (const p of POA_POWERS) {
      const isOn = grantAll || !!granted[p.id];
      ensure(LH + 8);
      // checkbox
      page.drawRectangle({
        x: margin + 2, y: y - 1.5, width: 9, height: 9,
        borderColor: rgb(0.35, 0.35, 0.35), borderWidth: 0.8,
        color: isOn ? rgb(0.15, 0.28, 0.19) : undefined,
      });
      if (isOn) {
        page.drawText("X", { x: margin + 3.6, y: y + 0.2, size: 8, font: boldFont, color: rgb(1, 1, 1) });
      }
      page.drawText(p.label, {
        x: margin + 18, y, size: BODY,
        font: isOn ? boldFont : font,
        color: isOn ? rgb(0.1, 0.1, 0.1) : rgb(0.5, 0.5, 0.5),
      });
      y -= LH;
      write(p.desc, {
        size: 9, indent: 18, lh: 11.5,
        color: isOn ? { r: 0.35, g: 0.35, b: 0.35 } : { r: 0.62, g: 0.62, b: 0.62 },
      });
      y -= 3;
    }

    // ── SPECIAL INSTRUCTIONS ─────────────────────────────────────────────────
    if (formData.specialInstructions?.trim()) {
      heading(`${sectionNum + 1}. SPECIAL INSTRUCTIONS AND LIMITATIONS`);
      write(formData.specialInstructions.trim());
    }

    const nextNum = formData.specialInstructions?.trim() ? sectionNum + 2 : sectionNum + 1;

    // ── EFFECTIVE DATE ───────────────────────────────────────────────────────
    heading(`${nextNum}. EFFECTIVE DATE`);
    if (formData.effectiveType === "springing") {
      write(
        "This power of attorney shall become effective only upon my incapacity. My incapacity shall be determined in writing by a " +
        "licensed physician who has examined me and who certifies that I am unable to manage my property and financial affairs " +
        "effectively. This power of attorney shall remain in effect thereafter until my death or until it is revoked."
      );
    } else {
      write(
        `This power of attorney is effective immediately upon execution${formData.effectiveDate ? ` on ${formatDate(formData.effectiveDate)}` : ""} ` +
        "and shall continue in effect until my death or until it is revoked."
      );
    }

    // ── DURABILITY ───────────────────────────────────────────────────────────
    heading(`${nextNum + 1}. DURABILITY`);
    write(
      "THIS IS A DURABLE POWER OF ATTORNEY. This power of attorney shall not be affected by my subsequent disability, incapacity, or " +
      "incompetence. All acts done by my Agent pursuant to this power of attorney during any period of my disability or incapacity shall " +
      "have the same effect and bind me and my heirs, devisees, and personal representatives as if I were competent and not disabled.",
      { fontType: "bold" }
    );

    // ── AGENT DUTIES ─────────────────────────────────────────────────────────
    heading(`${nextNum + 2}. AGENT'S DUTIES`);
    write(
      "My Agent shall act in good faith, within the scope of authority granted, and in my best interest. My Agent shall keep my property " +
      "separate and distinct from any other property owned or controlled by the Agent, and shall maintain complete and accurate records of " +
      "all receipts, disbursements, and transactions made on my behalf. My Agent shall not be liable to me or my successors for any act or " +
      "omission taken in good faith and without willful misconduct or gross negligence."
    );

    // ── COMPENSATION ─────────────────────────────────────────────────────────
    heading(`${nextNum + 3}. COMPENSATION AND REIMBURSEMENT`);
    write(
      formData.agentCompensation === "compensated"
        ? "My Agent shall be entitled to reasonable compensation for services rendered, together with reimbursement for reasonable expenses " +
          "properly incurred in carrying out the authority granted under this power of attorney."
        : "My Agent shall serve without compensation, but shall be entitled to reimbursement for reasonable expenses properly incurred in " +
          "carrying out the authority granted under this power of attorney."
    );

    // ── THIRD PARTY RELIANCE ─────────────────────────────────────────────────
    heading(`${nextNum + 4}. RELIANCE BY THIRD PARTIES`);
    write(
      "Any third party who receives a copy of this document may rely upon and act in accordance with it. Revocation of this power of attorney " +
      "shall not be effective as to any third party until that third party receives actual notice of the revocation. I agree to indemnify and " +
      "hold harmless any third party who acts in good faith reliance on this power of attorney. A photocopy or electronic copy of this signed " +
      "document shall have the same force and effect as the original."
    );

    // ── REVOCATION ───────────────────────────────────────────────────────────
    heading(`${nextNum + 5}. REVOCATION OF PRIOR POWERS`);
    write(
      formData.revokePrior
        ? "I hereby revoke any and all general powers of attorney previously executed by me. This revocation does not affect any health care " +
          "power of attorney or advance directive previously executed by me."
        : "This power of attorney does not revoke any power of attorney previously executed by me, which shall remain in full force and effect " +
          "to the extent not inconsistent with this document."
    );

    // ── GOVERNING LAW ────────────────────────────────────────────────────────
    heading(`${nextNum + 6}. GOVERNING LAW`);
    write(
      `This power of attorney shall be governed by and construed in accordance with the laws of the State of ${state || "________________"}. ` +
      "If any provision of this document is held invalid or unenforceable, the remaining provisions shall continue in full force and effect."
    );

    // ── SIGNATURE OF PRINCIPAL ───────────────────────────────────────────────
    ensure(170);
    y -= 12;
    heading(`${nextNum + 7}. SIGNATURE OF PRINCIPAL`);
    write(
      `IN WITNESS WHEREOF, I have executed this Durable General Power of Attorney on ${formatDate(formData.executionDate) || "________________"}.`
    );
    y -= 22;

    // Principal signature (drawn/uploaded image or scripted name)
    const drawSignature = async (imgData, typedName, xPos, labelText) => {
      const baselineY = y;
      if (imgData) {
        const img = await embedImage(pdfDoc, imgData);
        if (img) {
          const MAX_W = 190, MAX_H = 40;
          const ratio = img.width / img.height;
          let h = MAX_H, w = h * ratio;
          if (w > MAX_W) { w = MAX_W; h = w / ratio; }
          page.drawImage(img, { x: xPos, y: baselineY + 4, width: w, height: h });
        }
      } else if (typedName) {
        page.drawText(typedName, { x: xPos, y: baselineY + 6, size: 20, font: signatureFont, color: rgb(0.1, 0.1, 0.3) });
      }
      page.drawLine({
        start: { x: xPos, y: baselineY }, end: { x: xPos + 210, y: baselineY },
        thickness: 0.8, color: rgb(0.35, 0.35, 0.35),
      });
      page.drawText(labelText, { x: xPos, y: baselineY - 12, size: 8.5, font, color: rgb(0.45, 0.45, 0.45) });
    };

    await drawSignature(formData.principalSignatureImage, principal, margin, "Signature of Principal");
    page.drawText(formatDate(formData.executionDate) || "", {
      x: margin + 300, y: y + 6, size: BODY, font, color: rgb(0.1, 0.1, 0.1),
    });
    page.drawLine({
      start: { x: margin + 300, y }, end: { x: PAGE_W - margin, y },
      thickness: 0.8, color: rgb(0.35, 0.35, 0.35),
    });
    page.drawText("Date", { x: margin + 300, y: y - 12, size: 8.5, font, color: rgb(0.45, 0.45, 0.45) });
    y -= 34;

    page.drawText(`Printed Name: ${principal}`, { x: margin, y, size: BODY, font, color: rgb(0.1, 0.1, 0.1) });
    y -= 30;

    // ── WITNESSES ────────────────────────────────────────────────────────────
    if (formData.includeWitnesses) {
      ensure(190);
      heading("WITNESS ATTESTATION");
      write(
        "The Principal signed this document in our presence, and appeared to us to be of sound mind and under no duress, fraud, or undue " +
        "influence. We are not the Agent named in this document, and we are each at least eighteen (18) years of age.",
        { size: 9.5, lh: 12.5 }
      );
      y -= 18;

      for (const w of [1, 2]) {
        ensure(70);
        page.drawLine({ start: { x: margin, y }, end: { x: margin + 210, y }, thickness: 0.8, color: rgb(0.35, 0.35, 0.35) });
        page.drawText(`Witness ${w} Signature`, { x: margin, y: y - 12, size: 8.5, font, color: rgb(0.45, 0.45, 0.45) });

        page.drawLine({ start: { x: margin + 300, y }, end: { x: PAGE_W - margin, y }, thickness: 0.8, color: rgb(0.35, 0.35, 0.35) });
        page.drawText("Date", { x: margin + 300, y: y - 12, size: 8.5, font, color: rgb(0.45, 0.45, 0.45) });
        y -= 32;

        const wName = w === 1 ? formData.witness1Name : formData.witness2Name;
        page.drawText(`Printed Name: ${wName || ""}`, { x: margin, y, size: 9.5, font, color: rgb(0.2, 0.2, 0.2) });
        page.drawLine({ start: { x: margin + 78, y: y - 3 }, end: { x: margin + 280, y: y - 3 }, thickness: 0.5, color: rgb(0.72, 0.72, 0.72) });
        y -= 30;
      }
    }

    // ── NOTARY ───────────────────────────────────────────────────────────────
    if (formData.includeNotary) {
      ensure(230);
      y -= 6;
      page.drawLine({ start: { x: margin, y }, end: { x: PAGE_W - margin, y }, thickness: 1, color: rgb(0.5, 0.5, 0.5) });
      y -= 18;
      write("NOTARY ACKNOWLEDGMENT", { size: 11.5, fontType: "bold", align: "center", lh: 18 });
      y -= 6;

      labelled("State of", formData.notaryState || state, { lineWidth: 260 });
      labelled("County of", formData.notaryCounty, { lineWidth: 260 });
      y -= 4;

      write(
        `On this ______ day of ____________________, 20______, before me personally appeared ` +
        `${principal || "________________________"}, known to me or satisfactorily proven to be the person whose name is subscribed to the ` +
        `within instrument, who acknowledged that he or she executed the same for the purposes therein contained, and who appeared to be of ` +
        `sound mind and under no duress, fraud, or undue influence.`,
        { size: 9.5, lh: 12.5 }
      );
      y -= 24;

      page.drawLine({ start: { x: margin, y }, end: { x: margin + 230, y }, thickness: 0.8, color: rgb(0.35, 0.35, 0.35) });
      page.drawText("Notary Public Signature", { x: margin, y: y - 12, size: 8.5, font, color: rgb(0.45, 0.45, 0.45) });
      y -= 34;

      page.drawLine({ start: { x: margin, y }, end: { x: margin + 230, y }, thickness: 0.8, color: rgb(0.35, 0.35, 0.35) });
      page.drawText("My Commission Expires", { x: margin, y: y - 12, size: 8.5, font, color: rgb(0.45, 0.45, 0.45) });

      // Notary seal box
      page.drawRectangle({
        x: PAGE_W - margin - 150, y: y - 6, width: 150, height: 74,
        borderColor: rgb(0.6, 0.6, 0.6), borderWidth: 0.8, borderDashArray: [3, 3],
      });
      page.drawText("Affix Notary Seal", {
        x: PAGE_W - margin - 116, y: y + 26, size: 8.5, font, color: rgb(0.6, 0.6, 0.6),
      });
      y -= 40;
    }

    // ── AGENT ACCEPTANCE ─────────────────────────────────────────────────────
    if (formData.includeAgentAcceptance) {
      ensure(150);
      y -= 8;
      page.drawLine({ start: { x: margin, y }, end: { x: PAGE_W - margin, y }, thickness: 1, color: rgb(0.5, 0.5, 0.5) });
      y -= 18;
      write("ACCEPTANCE BY AGENT", { size: 11.5, fontType: "bold", align: "center", lh: 18 });
      y -= 4;
      write(
        `I, ${agent || "________________________"}, have read the foregoing Durable General Power of Attorney and accept appointment as Agent. ` +
        "I understand that I have a duty to act in the Principal's best interest, to act in good faith, to act only within the scope of authority " +
        "granted, and to keep a complete and accurate record of all transactions made on the Principal's behalf.",
        { size: 9.5, lh: 12.5 }
      );
      y -= 26;

      await drawSignature(formData.agentSignatureImage, agent, margin, "Signature of Agent");
      page.drawLine({
        start: { x: margin + 300, y }, end: { x: PAGE_W - margin, y },
        thickness: 0.8, color: rgb(0.35, 0.35, 0.35),
      });
      page.drawText("Date", { x: margin + 300, y: y - 12, size: 8.5, font, color: rgb(0.45, 0.45, 0.45) });
      y -= 32;
      page.drawText(`Printed Name: ${agent}`, { x: margin, y, size: BODY, font, color: rgb(0.1, 0.1, 0.1) });
    }

    // ── PAGE NUMBERS + WATERMARK ─────────────────────────────────────────────
    const total = pageRefs.length;
    pageRefs.forEach((p, i) => {
      p.drawText(`Page ${i + 1} of ${total}`, {
        x: PAGE_W / 2 - 28, y: 30, size: 8.5, font, color: rgb(0.55, 0.55, 0.55),
      });
      if (isPreview) {
        p.drawText("PREVIEW", {
          x: PAGE_W / 2 - 150, y: PAGE_H / 2, size: 72, font: boldFont,
          color: rgb(0.85, 0.85, 0.85), opacity: 0.45, rotate: { type: "degrees", angle: 45 },
        });
      }
    });

    return await pdfDoc.save();
  } catch (error) {
    console.error("Error generating Power of Attorney PDF:", error);
    throw error;
  }
};

export const generateAndDownloadPowerOfAttorney = async (formData, returnBlob = false) => {
  try {
    const pdfBytes = await generatePowerOfAttorneyPDF(formData, false);
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const who = formData.principalName?.replace(/\s+/g, "_") || "Principal";
    const pdfFileName = `Durable_Power_of_Attorney_${who}.pdf`;

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
    console.error("Error downloading Power of Attorney:", error);
    throw error;
  }
};

import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";

// ── helpers ──────────────────────────────────────────────────────────────────

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
};

const money = (v) => {
  const n = parseFloat(String(v).replace(/[^0-9.-]/g, ""));
  if (isNaN(n)) return "";
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
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

export const LEASE_TYPES = [
  { value: "triple-net",     label: "Triple Net (NNN)",
    blurb: "Tenant pays base rent plus property taxes, building insurance, and common area maintenance." },
  { value: "double-net",     label: "Double Net (NN)",
    blurb: "Tenant pays base rent plus property taxes and building insurance; Landlord covers structural maintenance." },
  { value: "single-net",     label: "Single Net (N)",
    blurb: "Tenant pays base rent plus property taxes; Landlord covers insurance and maintenance." },
  { value: "gross",          label: "Gross (Full Service)",
    blurb: "Tenant pays a single rent amount; Landlord pays taxes, insurance, and maintenance." },
  { value: "modified-gross", label: "Modified Gross",
    blurb: "Rent includes some operating expenses; the parties split the rest as specified below." },
  { value: "percentage",     label: "Percentage Lease",
    blurb: "Tenant pays base rent plus a percentage of gross sales above a stated breakpoint." },
];

const LEASE_EXPENSE_CLAUSE = {
  "triple-net":
    "This is a TRIPLE NET (NNN) lease. In addition to Base Rent, Tenant shall pay its proportionate share of all real property taxes and assessments, building insurance premiums, and common area maintenance (CAM) charges attributable to the Premises. Such amounts shall be payable as Additional Rent.",
  "double-net":
    "This is a DOUBLE NET (NN) lease. In addition to Base Rent, Tenant shall pay its proportionate share of all real property taxes and assessments and building insurance premiums. Landlord shall remain responsible for structural maintenance and repair of the Premises.",
  "single-net":
    "This is a SINGLE NET (N) lease. In addition to Base Rent, Tenant shall pay its proportionate share of all real property taxes and assessments. Landlord shall remain responsible for building insurance and maintenance.",
  "gross":
    "This is a GROSS (FULL SERVICE) lease. Base Rent includes real property taxes, building insurance, and common area maintenance. Landlord shall pay such expenses, subject to any expense stop or escalation set forth in this Lease.",
  "modified-gross":
    "This is a MODIFIED GROSS lease. Base Rent includes certain operating expenses as specified in this Lease. The parties shall share remaining operating expenses in the manner described in the Additional Provisions section.",
  "percentage":
    "This is a PERCENTAGE lease. In addition to Base Rent, Tenant shall pay Percentage Rent as set forth below, calculated on Tenant's gross sales generated from the Premises during each lease year.",
};

export const generateCommercialLeasePDF = async (formData, isPreview = false) => {
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

    let sectionNo = 0;
    const section = (title) => {
      sectionNo += 1;
      ensure(LH * 3);
      y -= 7;
      write(`${sectionNo}. ${title.toUpperCase()}`, { size: 11, fontType: "bold" });
      y -= 1;
    };

    const labelled = (label, value, lineWidth = maxWidth) => {
      ensure(LH + 6);
      const lw = boldFont.widthOfTextAtSize(label, BODY);
      page.drawText(label, { x: margin, y, size: BODY, font: boldFont, color: rgb(0.1, 0.1, 0.1) });
      const vx = margin + lw + 6;
      page.drawText(value || "", { x: vx, y, size: BODY, font, color: rgb(0.1, 0.1, 0.1) });
      page.drawLine({
        start: { x: vx, y: y - 3 }, end: { x: margin + lineWidth, y: y - 3 },
        thickness: 0.5, color: rgb(0.72, 0.72, 0.72),
      });
      y -= LH + 4;
    };

    const addr = (a, c, s, z) =>
      [a, [c, s].filter(Boolean).join(", "), z].filter(Boolean).join(" ").replace(/\s+,/g, ",").trim();

    const landlord = (formData.landlordName || "").trim();
    const tenant   = (formData.tenantName || "").trim();
    const state    = (formData.governingState || "").trim();

    // ── TITLE ────────────────────────────────────────────────────────────────
    write("COMMERCIAL LEASE AGREEMENT", { size: 16, fontType: "bold", align: "center", lh: 22 });
    if (state) write(`State of ${state}`, { size: 11, align: "center", lh: 18, color: { r: 0.35, g: 0.35, b: 0.35 } });
    y -= 6;
    page.drawLine({ start: { x: margin, y }, end: { x: PAGE_W - margin, y }, thickness: 1.2, color: rgb(0.15, 0.28, 0.19) });
    y -= 20;

    write(
      `THIS COMMERCIAL LEASE AGREEMENT (this "Lease") is made and entered into on ${formatDate(formData.agreementDate) || "________________"} ` +
      `(the "Effective Date") by and between ${landlord || "________________________"} ("Landlord") and ` +
      `${tenant || "________________________"} ("Tenant"). Landlord and Tenant may be referred to individually as a "Party" and ` +
      `collectively as the "Parties."`
    );
    y -= 6;

    // ── 1. PARTIES ───────────────────────────────────────────────────────────
    section("Parties");
    write("LANDLORD:", { fontType: "bold", size: 10 });
    labelled("Name:", landlord);
    labelled("Address:", addr(formData.landlordAddress, formData.landlordCity, formData.landlordState, formData.landlordZip));
    labelled("Phone / Email:", [formData.landlordPhone, formData.landlordEmail].filter(Boolean).join("  |  "));
    y -= 4;
    write("TENANT:", { fontType: "bold", size: 10 });
    labelled("Name:", tenant);
    if (formData.tenantEntityType) labelled("Entity Type:", formData.tenantEntityType);
    labelled("Address:", addr(formData.tenantAddress, formData.tenantCity, formData.tenantState, formData.tenantZip));
    labelled("Phone / Email:", [formData.tenantPhone, formData.tenantEmail].filter(Boolean).join("  |  "));

    // ── 2. PREMISES ──────────────────────────────────────────────────────────
    section("Premises");
    write(
      "Landlord hereby leases to Tenant, and Tenant hereby leases from Landlord, the commercial premises described below " +
      '(the "Premises"), together with any rights of ingress and egress and the non-exclusive use of common areas.'
    );
    y -= 4;
    labelled("Property Address:", addr(formData.premisesAddress, formData.premisesCity, formData.premisesState, formData.premisesZip));
    if (formData.premisesUnit)     labelled("Suite / Unit:", formData.premisesUnit);
    if (formData.squareFootage)    labelled("Approximate Square Footage:", `${formData.squareFootage} sq. ft.`);
    if (formData.propertyType)     labelled("Property Type:", formData.propertyType);
    if (formData.parkingSpaces)    labelled("Parking Spaces:", String(formData.parkingSpaces));
    if (formData.premisesDescription?.trim()) {
      y -= 2;
      write(formData.premisesDescription.trim());
    }

    // ── 3. PERMITTED USE ─────────────────────────────────────────────────────
    section("Permitted Use");
    write(
      `Tenant shall use and occupy the Premises solely for the following purpose: ` +
      `${formData.permittedUse?.trim() || "________________________________________"}. ` +
      "Tenant shall not use the Premises for any other purpose without Landlord's prior written consent. Tenant shall comply with all " +
      "applicable laws, ordinances, zoning requirements, and regulations governing its use of the Premises, and shall obtain and maintain " +
      "all licenses and permits required for its business."
    );

    // ── 4. TERM ──────────────────────────────────────────────────────────────
    section("Lease Term");
    write(
      `The term of this Lease shall commence on ${formatDate(formData.leaseStartDate) || "________________"} (the "Commencement Date") ` +
      `and shall expire on ${formatDate(formData.leaseEndDate) || "________________"} (the "Expiration Date"), unless sooner terminated ` +
      "or extended in accordance with this Lease."
    );
    if (formData.renewalOption) {
      y -= 4;
      write(
        `RENEWAL OPTION. Provided Tenant is not in default, Tenant shall have the option to renew this Lease for ` +
        `${formData.renewalTerms || "one (1)"} additional term(s) of ${formData.renewalLength || "________"} , ` +
        `upon written notice to Landlord not less than ${formData.renewalNoticeDays || "90"} days prior to the Expiration Date. ` +
        "Rent for any renewal term shall be as agreed by the Parties in writing, or as otherwise specified in this Lease."
      );
    }

    // ── 5. RENT ──────────────────────────────────────────────────────────────
    section("Base Rent");
    write(
      `Tenant shall pay to Landlord base rent in the amount of ${money(formData.monthlyRent) || "$__________"} per month ` +
      `("Base Rent"), payable in advance on the ${formData.rentDueDay || "1st"} day of each calendar month, without demand, deduction, ` +
      "or offset. Rent for any partial month shall be prorated on a daily basis."
    );
    y -= 4;
    if (formData.annualRent) labelled("Annual Base Rent:", money(formData.annualRent));
    if (formData.rentPaymentMethod) labelled("Payment Method:", formData.rentPaymentMethod);

    if (formData.lateFee) {
      y -= 2;
      write(
        `LATE CHARGE. If any installment of Rent is not received within ${formData.lateFeeGraceDays || "5"} days after the date due, ` +
        `Tenant shall pay a late charge of ${money(formData.lateFee) || formData.lateFee}. ` +
        "Acceptance of a late charge shall not constitute a waiver of Tenant's default."
      );
    }

    if (formData.rentIncreaseType === "percentage" && formData.rentIncreasePercent) {
      y -= 2;
      write(
        `RENT ESCALATION. Base Rent shall increase by ${formData.rentIncreasePercent}% on each anniversary of the Commencement Date ` +
        "for the remainder of the Term."
      );
    } else if (formData.rentIncreaseType === "fixed" && formData.rentIncreaseAmount) {
      y -= 2;
      write(
        `RENT ESCALATION. Base Rent shall increase by ${money(formData.rentIncreaseAmount)} on each anniversary of the ` +
        "Commencement Date for the remainder of the Term."
      );
    }

    if (formData.leaseType === "percentage" && formData.percentageRate) {
      y -= 2;
      write(
        `PERCENTAGE RENT. In addition to Base Rent, Tenant shall pay Percentage Rent equal to ${formData.percentageRate}% of gross sales ` +
        `in excess of ${money(formData.percentageBreakpoint) || "$__________"} per lease year, payable within thirty (30) days after the ` +
        "close of each lease year, together with a statement of gross sales certified by Tenant."
      );
    }

    // ── 6. LEASE TYPE / EXPENSES ─────────────────────────────────────────────
    section("Operating Expenses and Lease Type");
    write(LEASE_EXPENSE_CLAUSE[formData.leaseType] || LEASE_EXPENSE_CLAUSE["gross"]);
    if (formData.camCharges) {
      y -= 4;
      labelled("Estimated CAM / Additional Rent:", `${money(formData.camCharges)} per month`);
    }

    // ── 7. SECURITY DEPOSIT ──────────────────────────────────────────────────
    section("Security Deposit");
    if (formData.securityDeposit) {
      write(
        `Upon execution of this Lease, Tenant shall deposit with Landlord the sum of ${money(formData.securityDeposit)} as a security ` +
        "deposit (the \"Security Deposit\") to secure Tenant's performance of its obligations. Landlord may apply the Security Deposit " +
        "to cure any default or to repair damage beyond ordinary wear and tear. Any unapplied balance shall be returned to Tenant " +
        `within ${formData.depositReturnDays || "30"} days after the expiration or earlier termination of this Lease and Tenant's ` +
        "surrender of the Premises."
      );
    } else {
      write("No security deposit shall be required under this Lease.");
    }

    // ── 8. UTILITIES ─────────────────────────────────────────────────────────
    section("Utilities and Services");
    write(
      formData.utilitiesPaidBy === "landlord"
        ? "Landlord shall pay for all utilities and services furnished to the Premises, including water, sewer, gas, electricity, heat, and trash removal."
        : formData.utilitiesPaidBy === "shared"
          ? `Utilities shall be allocated between the Parties as follows: ${formData.utilitiesDetail?.trim() || "as separately agreed in writing."}`
          : "Tenant shall pay, directly and when due, for all utilities and services furnished to the Premises, including water, sewer, gas, electricity, telephone, internet, and trash removal, together with any deposits or connection fees."
    );

    // ── 9. MAINTENANCE ───────────────────────────────────────────────────────
    section("Maintenance and Repairs");
    write(
      "LANDLORD. Landlord shall maintain in good order and repair the structural elements of the building, including the foundation, " +
      "exterior walls, and roof, except to the extent damage is caused by the negligence or misuse of Tenant, its employees, agents, or invitees."
    );
    y -= 4;
    write(
      "TENANT. Tenant shall, at its sole expense, keep and maintain the interior of the Premises in good, clean, and sanitary condition " +
      "and repair, including all fixtures, interior walls, floor coverings, doors, windows, and Tenant's trade fixtures and equipment. " +
      "Tenant shall surrender the Premises at the end of the Term in the condition received, ordinary wear and tear excepted."
    );
    if (formData.hvacResponsibility) {
      y -= 4;
      write(`HVAC. Responsibility for heating, ventilation, and air conditioning systems: ${formData.hvacResponsibility}.`);
    }

    // ── 10. ALTERATIONS ──────────────────────────────────────────────────────
    section("Alterations and Improvements");
    write(
      "Tenant shall make no alterations, additions, or improvements to the Premises without Landlord's prior written consent, which " +
      "shall not be unreasonably withheld. All permanent alterations and improvements shall become the property of Landlord upon " +
      "expiration or termination of this Lease, unless Landlord requires their removal. Tenant's trade fixtures and personal property " +
      "shall remain Tenant's property and may be removed, provided Tenant repairs any damage caused by removal."
    );
    if (formData.tenantImprovementAllowance) {
      y -= 4;
      write(`TENANT IMPROVEMENT ALLOWANCE. Landlord shall provide a tenant improvement allowance of ${money(formData.tenantImprovementAllowance)}, disbursed in accordance with terms mutually agreed in writing.`);
    }

    // ── 11. INSURANCE ────────────────────────────────────────────────────────
    section("Insurance");
    write(
      `Tenant shall, at its own expense, maintain commercial general liability insurance covering the Premises with limits of not less ` +
      `than ${money(formData.liabilityInsuranceAmount) || "$1,000,000"} per occurrence, together with property insurance covering ` +
      "Tenant's personal property and trade fixtures. Tenant shall name Landlord as an additional insured and shall deliver certificates " +
      "of insurance to Landlord upon request and prior to occupancy. Each Party waives all rights of subrogation against the other to " +
      "the extent covered by insurance."
    );

    // ── 12. INDEMNIFICATION ──────────────────────────────────────────────────
    section("Indemnification");
    write(
      "Tenant shall indemnify, defend, and hold harmless Landlord from and against any and all claims, damages, liabilities, costs, and " +
      "expenses (including reasonable attorneys' fees) arising out of Tenant's use or occupancy of the Premises, or any act or omission " +
      "of Tenant, its employees, agents, contractors, or invitees, except to the extent caused by Landlord's gross negligence or willful " +
      "misconduct."
    );

    // ── 13. ASSIGNMENT ───────────────────────────────────────────────────────
    section("Assignment and Subletting");
    write(
      formData.allowSublease
        ? "Tenant may assign this Lease or sublet all or any portion of the Premises with Landlord's prior written consent, which shall " +
          "not be unreasonably withheld, conditioned, or delayed. No assignment or sublease shall relieve Tenant of its obligations under this Lease."
        : "Tenant shall not assign this Lease, nor sublet all or any portion of the Premises, without Landlord's prior written consent, " +
          "which Landlord may grant or withhold in its sole discretion. Any attempted assignment or sublease without such consent shall be void."
    );

    // ── 14. DEFAULT ──────────────────────────────────────────────────────────
    section("Default and Remedies");
    write(
      `Tenant shall be in default under this Lease if: (a) Tenant fails to pay Rent when due and such failure continues for ` +
      `${formData.defaultCureDays || "10"} days after written notice; (b) Tenant fails to perform any other obligation and such failure ` +
      `continues for ${formData.defaultCureDaysOther || "30"} days after written notice; (c) Tenant abandons the Premises; or ` +
      "(d) Tenant becomes insolvent or files for bankruptcy. Upon default, Landlord may terminate this Lease, re-enter and repossess " +
      "the Premises, and recover all damages permitted by law, including unpaid Rent, costs of reletting, and reasonable attorneys' fees."
    );

    // ── 15. HOLDOVER ─────────────────────────────────────────────────────────
    section("Holding Over");
    write(
      `If Tenant remains in possession after expiration of the Term without Landlord's written consent, the tenancy shall be month-to-month ` +
      `and Base Rent shall be ${formData.holdoverPercent || "150"}% of the Rent in effect immediately prior to expiration. Such holding ` +
      "over shall not constitute a renewal or extension of this Lease."
    );

    // ── 16. ADDITIONAL PROVISIONS ────────────────────────────────────────────
    if (formData.additionalProvisions?.trim()) {
      section("Additional Provisions");
      write(formData.additionalProvisions.trim());
    }

    // ── 17. NOTICES ──────────────────────────────────────────────────────────
    section("Notices");
    write(
      "All notices under this Lease shall be in writing and shall be deemed delivered when personally delivered, or three (3) business " +
      "days after deposit in the United States mail, certified, return receipt requested, postage prepaid, addressed to the Parties at " +
      "the addresses set forth in Section 1, or such other address as a Party designates in writing."
    );

    // ── 18. GENERAL ──────────────────────────────────────────────────────────
    section("General Provisions");
    write(
      `GOVERNING LAW. This Lease shall be governed by and construed under the laws of the State of ${state || "________________"}, ` +
      "without regard to conflict of law principles.\n\n" +
      "ENTIRE AGREEMENT. This Lease constitutes the entire agreement between the Parties concerning the Premises and supersedes all " +
      "prior negotiations, representations, and agreements, whether written or oral. This Lease may be amended only by a written " +
      "instrument signed by both Parties.\n\n" +
      "SEVERABILITY. If any provision of this Lease is held invalid or unenforceable, the remaining provisions shall remain in full " +
      "force and effect.\n\n" +
      "BINDING EFFECT. This Lease shall be binding upon and inure to the benefit of the Parties and their respective heirs, successors, " +
      "and permitted assigns.\n\n" +
      "COUNTERPARTS. This Lease may be executed in counterparts, each of which shall be deemed an original, and electronic or " +
      "photocopied signatures shall have the same effect as originals."
    );

    // ── SIGNATURES ───────────────────────────────────────────────────────────
    ensure(230);
    y -= 14;
    write("IN WITNESS WHEREOF, the Parties have executed this Commercial Lease Agreement as of the date first written above.", { size: 10 });
    y -= 22;

    const signBlock = async (label, name, imgData, extraLabel) => {
      ensure(96);
      const baseY = y;
      if (imgData) {
        const img = await embedImage(pdfDoc, imgData);
        if (img) {
          const MAX_W = 190, MAX_H = 38;
          const ratio = img.width / img.height;
          let h = MAX_H, w = h * ratio;
          if (w > MAX_W) { w = MAX_W; h = w / ratio; }
          page.drawImage(img, { x: margin, y: baseY + 4, width: w, height: h });
        }
      } else if (name) {
        page.drawText(name, { x: margin, y: baseY + 6, size: 19, font: signatureFont, color: rgb(0.1, 0.1, 0.3) });
      }
      page.drawLine({ start: { x: margin, y: baseY }, end: { x: margin + 220, y: baseY }, thickness: 0.8, color: rgb(0.35, 0.35, 0.35) });
      page.drawText(label, { x: margin, y: baseY - 12, size: 8.5, font, color: rgb(0.45, 0.45, 0.45) });

      page.drawLine({ start: { x: margin + 300, y: baseY }, end: { x: PAGE_W - margin, y: baseY }, thickness: 0.8, color: rgb(0.35, 0.35, 0.35) });
      page.drawText("Date", { x: margin + 300, y: baseY - 12, size: 8.5, font, color: rgb(0.45, 0.45, 0.45) });

      y = baseY - 30;
      page.drawText(`Printed Name: ${name || ""}`, { x: margin, y, size: 9.5, font, color: rgb(0.2, 0.2, 0.2) });
      if (extraLabel) {
        y -= 13;
        page.drawText(extraLabel, { x: margin, y, size: 9, font, color: rgb(0.45, 0.45, 0.45) });
      }
      y -= 26;
    };

    await signBlock("Landlord Signature", landlord, formData.landlordSignatureImage,
      formData.landlordTitle ? `Title: ${formData.landlordTitle}` : null);
    await signBlock("Tenant Signature", tenant, formData.tenantSignatureImage,
      formData.tenantTitle ? `Title: ${formData.tenantTitle}` : null);

    // ── GUARANTOR ────────────────────────────────────────────────────────────
    if (formData.includeGuarantor) {
      ensure(170);
      y -= 4;
      page.drawLine({ start: { x: margin, y }, end: { x: PAGE_W - margin, y }, thickness: 1, color: rgb(0.5, 0.5, 0.5) });
      y -= 18;
      write("PERSONAL GUARANTY", { size: 11.5, fontType: "bold", align: "center", lh: 18 });
      y -= 4;
      write(
        `In consideration of Landlord entering into this Lease, the undersigned ("Guarantor") personally and unconditionally guarantees ` +
        "the full and timely payment of all Rent and the performance of all obligations of Tenant under this Lease. This guaranty is a " +
        "guaranty of payment and performance, not merely of collection, and shall remain in effect for the entire Term and any renewal.",
        { size: 9.5, lh: 12.5 }
      );
      y -= 22;
      await signBlock("Guarantor Signature", formData.guarantorName, formData.guarantorSignatureImage, null);
      if (formData.guarantorAddress) {
        page.drawText(`Address: ${formData.guarantorAddress}`, { x: margin, y, size: 9, font, color: rgb(0.45, 0.45, 0.45) });
        y -= 20;
      }
    }

    // ── NOTARY ───────────────────────────────────────────────────────────────
    if (formData.includeNotary) {
      ensure(210);
      y -= 4;
      page.drawLine({ start: { x: margin, y }, end: { x: PAGE_W - margin, y }, thickness: 1, color: rgb(0.5, 0.5, 0.5) });
      y -= 18;
      write("NOTARY ACKNOWLEDGMENT", { size: 11.5, fontType: "bold", align: "center", lh: 18 });
      y -= 6;
      labelled("State of", formData.notaryState || state, 260);
      labelled("County of", formData.notaryCounty, 260);
      y -= 4;
      write(
        "On this ______ day of ____________________, 20______, before me personally appeared the person(s) whose name(s) are subscribed " +
        "to the within instrument, and acknowledged that they executed the same for the purposes therein contained.",
        { size: 9.5, lh: 12.5 }
      );
      y -= 24;
      page.drawLine({ start: { x: margin, y }, end: { x: margin + 230, y }, thickness: 0.8, color: rgb(0.35, 0.35, 0.35) });
      page.drawText("Notary Public Signature", { x: margin, y: y - 12, size: 8.5, font, color: rgb(0.45, 0.45, 0.45) });
      y -= 34;
      page.drawLine({ start: { x: margin, y }, end: { x: margin + 230, y }, thickness: 0.8, color: rgb(0.35, 0.35, 0.35) });
      page.drawText("My Commission Expires", { x: margin, y: y - 12, size: 8.5, font, color: rgb(0.45, 0.45, 0.45) });

      page.drawRectangle({
        x: PAGE_W - margin - 150, y: y - 6, width: 150, height: 74,
        borderColor: rgb(0.6, 0.6, 0.6), borderWidth: 0.8, borderDashArray: [3, 3],
      });
      page.drawText("Affix Notary Seal", { x: PAGE_W - margin - 116, y: y + 26, size: 8.5, font, color: rgb(0.6, 0.6, 0.6) });
      y -= 40;
    }

    // ── PAGE NUMBERS + WATERMARK ─────────────────────────────────────────────
    const total = pageRefs.length;
    pageRefs.forEach((p, i) => {
      p.drawText(`Page ${i + 1} of ${total}`, { x: PAGE_W / 2 - 28, y: 30, size: 8.5, font, color: rgb(0.55, 0.55, 0.55) });
      if (isPreview) {
        p.drawText("PREVIEW", {
          x: PAGE_W / 2 - 150, y: PAGE_H / 2, size: 72, font: boldFont,
          color: rgb(0.85, 0.85, 0.85), opacity: 0.45, rotate: { type: "degrees", angle: 45 },
        });
      }
    });

    return await pdfDoc.save();
  } catch (error) {
    console.error("Error generating Commercial Lease PDF:", error);
    throw error;
  }
};

export const generateAndDownloadCommercialLease = async (formData, returnBlob = false) => {
  try {
    const pdfBytes = await generateCommercialLeasePDF(formData, false);
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const who = formData.tenantName?.replace(/\s+/g, "_") || "Tenant";
    const pdfFileName = `Commercial_Lease_${who}.pdf`;

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
    console.error("Error downloading Commercial Lease:", error);
    throw error;
  }
};

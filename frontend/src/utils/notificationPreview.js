// Rebuilds the preview pages for an /app notification so the notifications
// drawer can show "what you bought" — the same multi-page preview the
// generator modals render. It reads the same pending-form data the redownload
// flow uses (see AppLayout.handleRedownload) and runs each document's preview
// generator, normalizing every result to an array of image data URLs that
// <PreviewPager> can page through. Returns [] when the data is gone (the form
// was reset after a much older purchase) so callers can show a friendly note.

import { generateAllPreviewImages } from "@/utils/paystubPreviewGenerator";
import { generateAllCanadianPreviewImages } from "@/utils/canadianPaystubPreviewGenerator";
import { generateOfferLetterPreviewPages } from "@/utils/offerLetterPreviewGenerator";
import { generateResumePreview } from "@/utils/resumePreviewGenerator";
import { generateW2Preview } from "@/utils/w2PreviewGenerator";
import { generateW9Preview } from "@/utils/w9PreviewGenerator";
import { generate1099NECPreview } from "@/utils/1099necPreviewGenerator";
import { generate1099MISCPreview } from "@/utils/1099miscPreviewGenerator";
import { generateScheduleCPreview } from "@/utils/scheduleCPreviewGenerator";
import { generateBankStatementPreviewPages } from "@/utils/bankStatementPreviewGenerator";
import { generateCommercialLeasePreviewPages } from "@/utils/commercialLeasePreviewGenerator";
import { generateUtilityBillPreview } from "@/utils/utilityBillPreviewGenerator";
import { generateCeaseAndDesistPreviewPages } from "@/utils/ceaseAndDesistPreviewGenerator";
import { generatePowerOfAttorneyPreviewPages } from "@/utils/powerOfAttorneyPreviewGenerator";
import { generateVehicleBillOfSalePreview } from "@/utils/vehicleBillOfSalePreviewGenerator";

const getObj = (key) => {
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return raw; }
};
const getStr = (key, fallback) => localStorage.getItem(key) || fallback;
// Every preview generator returns either one image data URL or an array of
// them; collapse both to a clean array.
const asPages = (result) => (Array.isArray(result) ? result.filter(Boolean) : result ? [result] : []);

const resumePages = async () => {
  const d = getObj("pendingResumeData");
  if (!d || !d.generatedResume) return [];
  const f = d.formData || {};
  return asPages(await generateResumePreview({
    ...d.generatedResume,
    template: f.template || "ats",
    font: f.font || "Calibri",
    sectionLayout: f.sectionLayout || "standard",
    onePage: f.onePage || false,
    isPaid: false,
  }));
};

// Each builder reads the pending data for its document type and returns pages.
const BUILDERS = {
  paystub: async () => {
    const d = getObj("pendingPaystubData");
    if (!d) return [];
    return asPages(await generateAllPreviewImages(d, getStr("pendingPaystubTemplate", "template-a"), parseInt(getStr("pendingPaystubCount", "1"), 10) || 1));
  },
  "canadian-paystub": async () => {
    const d = getObj("pendingCanadianPaystubData");
    if (!d) return [];
    return asPages(await generateAllCanadianPreviewImages(d, getStr("pendingCanadianPaystubTemplate", "template-a"), parseInt(getStr("pendingCanadianPaystubCount", "1"), 10) || 1));
  },
  "offer-letter": async () => {
    const d = getObj("pendingOfferLetterData");
    if (!d) return [];
    return asPages(await generateOfferLetterPreviewPages(d));
  },
  resume: resumePages,
  "ai-resume": resumePages,
  w2: async () => {
    const d = getObj("pendingW2Data");
    if (!d) return [];
    return asPages(await generateW2Preview(d, getStr("pendingW2TaxYear", "2024")));
  },
  w9: async () => {
    const d = getObj("pendingW9Data");
    if (!d) return [];
    return asPages(await generateW9Preview(d, getStr("pendingW9TaxYear", "2024")));
  },
  "1099-nec": async () => {
    const d = getObj("pending1099NECData");
    if (!d) return [];
    return asPages(await generate1099NECPreview(d, getStr("pending1099NECTaxYear", "2024")));
  },
  "1099-misc": async () => {
    const d = getObj("pending1099MISCData");
    if (!d) return [];
    return asPages(await generate1099MISCPreview(d, getStr("pending1099MISCTaxYear", "2024")));
  },
  "schedule-c": async () => {
    const d = getObj("pendingScheduleCData");
    if (!d) return [];
    return asPages(await generateScheduleCPreview(d, getStr("pendingScheduleCTaxYear", "2024")));
  },
  "bank-statement": async () => {
    const d = getObj("pendingBankStatementData");
    if (!d) return [];
    return asPages(await generateBankStatementPreviewPages(d.formData || d, getStr("pendingBankStatementTemplate", "template-a")));
  },
  "commercial-lease": async () => {
    const d = getObj("pendingCommercialLeaseData");
    if (!d) return [];
    return asPages(await generateCommercialLeasePreviewPages(d));
  },
  "utility-bill": async () => {
    const d = getObj("pendingUtilityBillData");
    if (!d) return [];
    return asPages(await generateUtilityBillPreview(d, getStr("pendingUtilityBillTemplate", "template-a")));
  },
  "cease-and-desist": async () => {
    const d = getObj("pendingCeaseAndDesistData");
    if (!d) return [];
    return asPages(await generateCeaseAndDesistPreviewPages(d));
  },
  "power-of-attorney": async () => {
    const d = getObj("pendingPowerOfAttorneyData");
    if (!d) return [];
    return asPages(await generatePowerOfAttorneyPreviewPages(d));
  },
  "vehicle-bill-of-sale": async () => {
    const d = getObj("pendingVehicleBillOfSaleData");
    if (!d) return [];
    return asPages(await generateVehicleBillOfSalePreview(d));
  },
};

// Whether a preview can be shown for this notification type at all.
export function canPreviewNotification(notif) {
  return !!(notif && notif.type && BUILDERS[notif.type]);
}

// Returns an array of preview image data URLs for the notification, or [] if
// the type is unknown or the source form data is no longer available.
export async function buildNotificationPreviewPages(notif) {
  const builder = notif && notif.type ? BUILDERS[notif.type] : null;
  if (!builder) return [];
  try {
    return (await builder()) || [];
  } catch (err) {
    console.error("Notification preview failed:", err);
    return [];
  }
}

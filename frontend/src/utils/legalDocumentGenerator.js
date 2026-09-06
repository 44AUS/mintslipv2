// Legal document generator — renders an admin-designed "legal-document"
// template (from the doc template editor) with the customer's form data.
// Unlike the hardcoded generators, all layout comes from the published
// template; this file only feeds it data and handles download/preview.

import { jsPDF } from "jspdf";
import { saveAs } from "file-saver";
import { fetchPublishedLayout, renderLayout } from "./layoutEngine";

export async function generateLegalDocumentPDF(formData) {
  const templateId = String(formData.templateId || "");
  if (!templateId) throw new Error("No template selected");
  const layout = await fetchPublishedLayout(templateId);
  if (!layout) throw new Error("This template is no longer available");

  const doc = new jsPDF({ unit: "pt", format: "letter" });
  renderLayout(doc, layout, { formData }, "legal-document");
  return doc;
}

export function legalDocumentFileName(formData) {
  const base = (formData.documentTitle || "legal_document").trim().replace(/[^\w\s-]/g, "").replace(/\s+/g, "_");
  return `${base || "legal_document"}.pdf`;
}

// Returns a data URL for the live <iframe> preview.
export async function generateLegalDocumentPreview(formData) {
  const doc = await generateLegalDocumentPDF(formData);
  return doc.output("datauristring");
}

export async function generateAndDownloadLegalDocument(formData, returnBlob = false) {
  const doc = await generateLegalDocumentPDF(formData);
  const blob = doc.output("blob");
  saveAs(blob, legalDocumentFileName(formData));
  if (returnBlob) return blob;
}

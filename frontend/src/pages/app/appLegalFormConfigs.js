// Field schemas for the app's native legal-form modals (Cease & Desist,
// Power of Attorney, Vehicle Bill of Sale). Field names match what the web
// generators consume, so previews, downloads, and PaymentSuccess all work
// off the same data and pending localStorage keys.

import { generateCeaseAndDesistPreview } from "@/utils/ceaseAndDesistPreviewGenerator";
import { generatePowerOfAttorneyPreview } from "@/utils/powerOfAttorneyPreviewGenerator";
import { generateVehicleBillOfSalePreview } from "@/utils/vehicleBillOfSalePreviewGenerator";
import { generateAndDownloadCeaseAndDesist } from "@/utils/ceaseAndDesistGenerator";
import { generateAndDownloadPowerOfAttorney, POA_POWERS } from "@/utils/powerOfAttorneyGenerator";
import { generateAndDownloadVehicleBillOfSale } from "@/utils/vehicleBillOfSaleGenerator";

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","DC","FL","GA","HI","ID","IL","IN",
  "IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH",
  "NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT",
  "VT","VA","WA","WV","WI","WY",
];
const stateOptions = US_STATES.map(s => ({ value: s, label: s }));

// ── Cease and Desist ─────────────────────────────────────────────────────────
const CEASE_CONFIG = {
  key: "cease-and-desist", docType: "cease-and-desist", title: "Cease and Desist Letter", price: 9.99,
  storageKey: "appCeaseAndDesistFormData",
  cancelPath: "/app/legal-forms",
  preview: (fd) => generateCeaseAndDesistPreview(fd),
  download: (fd, _year, returnBlob) => generateAndDownloadCeaseAndDesist(fd, returnBlob),
  derive: (fd) => ({ template: "professional", violationType: "harassment", deliveryMethod: "certified-mail", complianceDays: "10", ...fd }),
  checkoutTemplate: (fd) => fd.template || "professional",
  buildPending: (fd) => ({
    pendingCeaseAndDesistData: fd,
    pendingCeaseAndDesistTemplate: fd.template || "professional",
  }),
  validate: (fd) => {
    if (!String(fd.senderName || "").trim())    return "Please enter your full name";
    if (!String(fd.recipientName || "").trim()) return "Please enter the recipient's name";
    if (!String(fd.description || "").trim())   return "Please describe the conduct you want stopped";
    return null;
  },
  sections: [
    { title: "Template Style", fields: [
      { name: "template", label: "Template", type: "segment", size: "12", options: [
        { value: "professional", label: "Professional" }, { value: "modern", label: "Modern" }, { value: "custom", label: "Custom" },
      ]},
      { name: "primaryColor", label: "Primary Color", type: "color", default: "#1a1a1a", size: "6", showIf: fd => fd.template === "custom" },
      { name: "accentColor", label: "Accent Color", type: "color", default: "#b71c1c", size: "6", showIf: fd => fd.template === "custom" },
    ]},
    { title: "Your Information (Sender)", fields: [
      { name: "senderName", label: "Full Name *", size: "6" },
      { name: "senderTitle", label: "Title (optional)", size: "6" },
      { name: "senderAddress", label: "Address", size: "12" },
      { name: "senderCity", label: "City", size: "6" },
      { name: "senderState", label: "State", type: "select", options: stateOptions, size: "3" },
      { name: "senderZip", label: "ZIP", size: "3" },
      { name: "senderPhone", label: "Phone", type: "tel", size: "6" },
      { name: "senderEmail", label: "Email", type: "email", size: "6" },
      { name: "senderLogo", label: "Letterhead logo (optional)", type: "image", size: "12" },
    ]},
    { title: "Recipient", fields: [
      { name: "recipientName", label: "Recipient Name *", size: "6" },
      { name: "recipientCompany", label: "Company (optional)", size: "6" },
      { name: "recipientAddress", label: "Address", size: "12" },
      { name: "recipientCity", label: "City", size: "6" },
      { name: "recipientState", label: "State", type: "select", options: stateOptions, size: "3" },
      { name: "recipientZip", label: "ZIP", size: "3" },
    ]},
    { title: "Letter Details", fields: [
      { name: "letterDate", label: "Letter Date", type: "date", size: "6" },
      { name: "subject", label: "Subject (optional)", size: "6" },
      { name: "violationType", label: "Type of Conduct", type: "select", size: "12", options: [
        { value: "harassment", label: "Harassment / Stalking" },
        { value: "defamation", label: "Defamation / Slander / Libel" },
        { value: "ip-infringement", label: "Copyright / Trademark Infringement" },
        { value: "debt-collection", label: "Debt Collection (FDCPA)" },
        { value: "breach-of-contract", label: "Breach of Contract" },
        { value: "other", label: "Other Conduct" },
      ]},
      { name: "description", label: "Describe the conduct *", type: "textarea", rows: 4, size: "12" },
      { name: "incidentDate", label: "Incident Date", type: "date", size: "6" },
      { name: "incidentLocation", label: "Incident Location", size: "6" },
      { name: "additionalDetails", label: "Additional details (optional)", type: "textarea", size: "12" },
      { name: "complianceDays", label: "Days to comply", type: "number", size: "6" },
      { name: "deliveryMethod", label: "Delivery Method", type: "select", size: "6", options: [
        { value: "certified-mail", label: "Certified Mail, Return Receipt" },
        { value: "email", label: "Electronic Mail" },
        { value: "both", label: "Certified Mail and Email" },
        { value: "hand-delivery", label: "Hand Delivery" },
      ]},
      { name: "legalAction", label: "Legal action you will pursue (optional)", type: "textarea", size: "12" },
    ]},
    { title: "Signature", fields: [
      { name: "signatureImage", label: "Your signature", type: "signature", nameField: "signatureName", size: "12" },
    ]},
  ],
};

// ── Durable Power of Attorney ────────────────────────────────────────────────
const POA_CONFIG = {
  key: "power-of-attorney", docType: "power-of-attorney", title: "Power of Attorney", price: 9.99,
  storageKey: "appPowerOfAttorneyFormData",
  cancelPath: "/app/legal-forms",
  preview: (fd) => generatePowerOfAttorneyPreview(fd),
  download: (fd, _year, returnBlob) => generateAndDownloadPowerOfAttorney(fd, returnBlob),
  derive: (fd) => {
    const out = {
      effectiveType: "immediate", agentCompensation: "uncompensated",
      revokePrior: true, includeWitnesses: true, includeNotary: true, includeAgentAcceptance: true,
      grantAllPowers: fd.grantAllPowers !== false,
      effectiveDate: new Date().toISOString().slice(0, 10),
      executionDate: new Date().toISOString().slice(0, 10),
      ...fd,
    };
    const powers = { ...(fd.powers || {}) };
    if (out.grantAllPowers) POA_POWERS.forEach(p => { powers[p.id] = true; });
    else POA_POWERS.forEach(p => { powers[p.id] = !!powers[p.id]; });
    out.powers = powers;
    return out;
  },
  buildPending: (fd) => ({ pendingPowerOfAttorneyData: fd }),
  checkoutTemplate: () => "standard",
  validate: (fd) => {
    if (!String(fd.principalName || "").trim()) return "Please enter the principal's name";
    if (!String(fd.agentName || "").trim())     return "Please enter the agent's name";
    if (!String(fd.governingState || "").trim()) return "Please choose the governing state";
    return null;
  },
  sections: [
    { title: "Governing State", fields: [
      { name: "governingState", label: "Governing State *", type: "select", options: stateOptions, size: "6" },
    ]},
    { title: "Principal (person granting power)", fields: [
      { name: "principalName", label: "Full Name *", size: "6" },
      { name: "principalPhone", label: "Phone", type: "tel", size: "6" },
      { name: "principalAddress", label: "Address", size: "12" },
      { name: "principalCity", label: "City", size: "6" },
      { name: "principalState", label: "State", type: "select", options: stateOptions, size: "3" },
      { name: "principalZip", label: "ZIP", size: "3" },
    ]},
    { title: "Agent (attorney-in-fact)", fields: [
      { name: "agentName", label: "Full Name *", size: "6" },
      { name: "agentRelationship", label: "Relationship", size: "6" },
      { name: "agentAddress", label: "Address", size: "12" },
      { name: "agentCity", label: "City", size: "6" },
      { name: "agentState", label: "State", type: "select", options: stateOptions, size: "3" },
      { name: "agentZip", label: "ZIP", size: "3" },
      { name: "agentPhone", label: "Phone", type: "tel", size: "6" },
    ]},
    { title: "Successor Agent (optional)", fields: [
      { name: "successorName", label: "Full Name", size: "6" },
      { name: "successorPhone", label: "Phone", type: "tel", size: "6" },
      { name: "successorAddress", label: "Address", size: "12" },
      { name: "successorCity", label: "City", size: "6" },
      { name: "successorState", label: "State", type: "select", options: stateOptions, size: "3" },
      { name: "successorZip", label: "ZIP", size: "3" },
    ]},
    { title: "Powers Granted", fields: [
      { name: "grantAllPowers", label: "Grant ALL powers listed below", type: "checkbox", size: "12" },
      { name: "powers", type: "checkboxGroup", size: "12", showIf: fd => fd.grantAllPowers === false,
        options: POA_POWERS.map(p => ({ id: p.id, label: p.label })) },
      { name: "specialInstructions", label: "Special instructions (optional)", type: "textarea", size: "12" },
    ]},
    { title: "Terms", fields: [
      { name: "effectiveType", label: "When does it take effect?", type: "segment", size: "12", options: [
        { value: "immediate", label: "Immediately" }, { value: "springing", label: "Upon incapacity" },
      ]},
      { name: "effectiveDate", label: "Effective Date", type: "date", size: "6" },
      { name: "executionDate", label: "Execution Date", type: "date", size: "6" },
      { name: "agentCompensation", label: "Agent compensation", type: "segment", size: "12", options: [
        { value: "uncompensated", label: "Serves without pay" }, { value: "compensated", label: "Reasonable compensation" },
      ]},
      { name: "revokePrior", label: "Revoke all prior powers of attorney", type: "checkbox", size: "12" },
    ]},
    { title: "Execution Blocks", fields: [
      { name: "includeWitnesses", label: "Include witness signature lines", type: "checkbox", size: "12" },
      { name: "witness1Name", label: "Witness 1 name", size: "6", showIf: fd => fd.includeWitnesses !== false },
      { name: "witness2Name", label: "Witness 2 name", size: "6", showIf: fd => fd.includeWitnesses !== false },
      { name: "includeNotary", label: "Include notary acknowledgment block", type: "checkbox", size: "12" },
      { name: "notaryState", label: "Notary state", type: "select", options: stateOptions, size: "6", showIf: fd => fd.includeNotary !== false },
      { name: "notaryCounty", label: "Notary county", size: "6", showIf: fd => fd.includeNotary !== false },
      { name: "includeAgentAcceptance", label: "Include agent acceptance block", type: "checkbox", size: "12" },
    ]},
    { title: "Signatures (optional — can also sign after printing)", fields: [
      { name: "principalSignatureImage", label: "Principal signature", type: "signature", size: "12" },
      { name: "agentSignatureImage", label: "Agent signature", type: "signature", size: "12" },
    ]},
  ],
};

// ── Vehicle Bill of Sale ─────────────────────────────────────────────────────
const VEHICLE_CONFIG = {
  key: "vehicle-bill-of-sale", docType: "vehicle-bill-of-sale", title: "Vehicle Bill of Sale", price: 9.99,
  storageKey: "appVehicleBillOfSaleFormData",
  cancelPath: "/app/legal-forms",
  preview: (fd) => generateVehicleBillOfSalePreview(fd),
  download: (fd, _year, returnBlob) => generateAndDownloadVehicleBillOfSale(fd, returnBlob),
  derive: (fd) => ({
    template: "classic", primaryColor: "#1a1a4d", accentColor: "#3333aa",
    saleDate: new Date().toISOString().split("T")[0],
    odometerDisclosure: "actual", conditionType: "as-is",
    ...fd,
  }),
  buildPending: (fd) => ({ pendingVehicleBillOfSaleData: fd }),
  checkoutTemplate: (fd) => fd.template || "classic",
  validate: (fd) => {
    if (!String(fd.sellerName || "").trim()) return "Please enter the seller's name";
    if (!String(fd.buyerName || "").trim())  return "Please enter the buyer's name";
    if (!String(fd.salePrice || "").trim())  return "Please enter the sale price";
    return null;
  },
  sections: [
    { title: "Template Style", fields: [
      { name: "template", label: "Template", type: "select", size: "12", options: [
        { value: "classic", label: "Classic — formal with navy border" },
        { value: "modern", label: "Modern — green accents" },
        { value: "minimal", label: "Minimal — clean black & white" },
        { value: "custom", label: "Custom — pick your colors" },
      ]},
      { name: "primaryColor", label: "Primary Color", type: "color", default: "#1a1a4d", size: "6", showIf: fd => fd.template === "custom" },
      { name: "accentColor", label: "Accent Color", type: "color", default: "#3333aa", size: "6", showIf: fd => fd.template === "custom" },
    ]},
    { title: "Sale Details", fields: [
      { name: "state", label: "State of Sale", type: "select", options: stateOptions, size: "4" },
      { name: "county", label: "County", size: "4" },
      { name: "saleDate", label: "Sale Date", type: "date", size: "4" },
      { name: "salePrice", label: "Sale Price ($) *", type: "number", size: "6" },
      { name: "paymentMethod", label: "Payment Method", type: "select", size: "6", options: [
        "Cash", "Certified Check", "Cashier's Check", "Bank Transfer", "Money Order", "Personal Check", "Financing", "Other",
      ].map(m => ({ value: m, label: m })) },
    ]},
    { title: "Seller", fields: [
      { name: "sellerName", label: "Full Name *", size: "12" },
      { name: "sellerAddress", label: "Address", size: "12" },
      { name: "sellerCity", label: "City", size: "6" },
      { name: "sellerState", label: "State", type: "select", options: stateOptions, size: "3" },
      { name: "sellerZip", label: "ZIP", size: "3" },
      { name: "sellerId", label: "Driver's License / ID", size: "6" },
      { name: "sellerIdState", label: "ID State", type: "select", options: stateOptions, size: "6" },
    ]},
    { title: "Buyer", fields: [
      { name: "buyerName", label: "Full Name *", size: "12" },
      { name: "buyerAddress", label: "Address", size: "12" },
      { name: "buyerCity", label: "City", size: "6" },
      { name: "buyerState", label: "State", type: "select", options: stateOptions, size: "3" },
      { name: "buyerZip", label: "ZIP", size: "3" },
      { name: "buyerId", label: "Driver's License / ID", size: "6" },
      { name: "buyerIdState", label: "ID State", type: "select", options: stateOptions, size: "6" },
    ]},
    { title: "Vehicle", fields: [
      { name: "vehicleYear", label: "Year", type: "number", size: "4" },
      { name: "vehicleMake", label: "Make", size: "4" },
      { name: "vehicleModel", label: "Model", size: "4" },
      { name: "vehicleVin", label: "VIN", size: "6" },
      { name: "vehicleColor", label: "Color", size: "3" },
      { name: "vehicleBodyType", label: "Body Type", size: "3" },
      { name: "odometerReading", label: "Odometer Reading (miles)", type: "number", size: "6" },
      { name: "odometerDisclosure", label: "Odometer disclosure", type: "segment", size: "12", options: [
        { value: "actual", label: "Actual" }, { value: "exceeds", label: "Exceeds limit" }, { value: "discrepancy", label: "Not actual" },
      ]},
    ]},
    { title: "Condition & Notary", fields: [
      { name: "conditionType", label: "Condition of sale", type: "segment", size: "12", options: [
        { value: "as-is", label: "Sold as-is" }, { value: "warranty", label: "With warranty" },
      ]},
      { name: "warrantyDetails", label: "Warranty details", type: "textarea", size: "12", showIf: fd => fd.conditionType === "warranty" },
      { name: "includeNotary", label: "Include notary acknowledgment block", type: "checkbox", size: "12" },
      { name: "notaryState", label: "Notary state", type: "select", options: stateOptions, size: "6", showIf: fd => !!fd.includeNotary },
      { name: "notaryCounty", label: "Notary county", size: "6", showIf: fd => !!fd.includeNotary },
    ]},
  ],
};

export const LEGAL_FORM_CONFIGS = {
  "cease-and-desist": CEASE_CONFIG,
  "power-of-attorney": POA_CONFIG,
  "vehicle-bill-of-sale": VEHICLE_CONFIG,
};

// Field schemas for the app's native tax-form modals. Field names match what
// the web generators consume, so previews, downloads, and the post-payment
// regeneration in PaymentSuccess all work off the same data.

import { generateW2Preview } from "@/utils/w2PreviewGenerator";
import { generateW9Preview } from "@/utils/w9PreviewGenerator";
import { generate1099NECPreview } from "@/utils/1099necPreviewGenerator";
import { generate1099MISCPreview } from "@/utils/1099miscPreviewGenerator";
import { generateScheduleCPreview } from "@/utils/scheduleCPreviewGenerator";
import { generateAndDownloadW2, BOX_12_CODES } from "@/utils/w2Generator";
import { generateAndDownloadW9 } from "@/utils/w9Generator";
import { generateAndDownload1099NEC } from "@/utils/1099necGenerator";
import { generateAndDownload1099MISC } from "@/utils/1099miscGenerator";
import { generateAndDownloadScheduleC } from "@/utils/scheduleCGenerator";

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","DC","FL","GA","HI","ID","IL","IN",
  "IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH",
  "NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT",
  "VT","VA","WA","WV","WI","WY",
];
const stateOptions = US_STATES.map(s => ({ value: s, label: s }));
const box12Options = BOX_12_CODES.map(c => ({ value: c.code, label: c.label }));
const yesNo = [{ value: "yes", label: "Yes" }, { value: "no", label: "No" }];

const num = (v) => parseFloat(v) || 0;

// ── W-2 ──────────────────────────────────────────────────────────────────────
const W2_CONFIG = {
  key: "w2", docType: "w2", title: "W-2 Wage & Tax Statement", price: 14.99,
  taxYears: ["2025", "2024", "2023", "2022", "2021", "2020"], defaultYear: "2024",
  storageKey: "appW2FormData",
  pendingDataKey: "pendingW2Data", pendingYearKey: "pendingW2TaxYear",
  preview: (fd, year) => generateW2Preview(fd, year),
  download: (fd, year, returnBlob) => generateAndDownloadW2(fd, year, returnBlob),
  // Blank SS/Medicare/state boxes derive from Box 1, like the web form
  derive: (fd) => {
    const wages = num(fd.wagesTips);
    const out = { ...fd };
    if (wages > 0) {
      if (!num(out.socialSecurityWages)) out.socialSecurityWages = wages.toFixed(2);
      if (!num(out.socialSecurityTax))   out.socialSecurityTax = (wages * 0.062).toFixed(2);
      if (!num(out.medicareWages))       out.medicareWages = wages.toFixed(2);
      if (!num(out.medicareTax))         out.medicareTax = (wages * 0.0145).toFixed(2);
      if (out.state && !num(out.stateWages)) out.stateWages = wages.toFixed(2);
    }
    return out;
  },
  validate: (fd) => {
    if (!String(fd.employerName || "").trim())      return "Please enter the employer name";
    if (!String(fd.employeeFirstName || "").trim()) return "Please enter the employee's first name";
    if (!num(fd.wagesTips))                         return "Please enter Box 1 wages";
    return null;
  },
  sections: [
    { title: "Employer Information", fields: [
      { name: "employerName", label: "Employer Name *", size: "6" },
      { name: "employerEIN", label: "Employer EIN *", placeholder: "12-3456789", size: "6" },
      { name: "employerAddress", label: "Address", size: "12" },
      { name: "employerCity", label: "City", size: "6" },
      { name: "employerState", label: "State", type: "select", options: stateOptions, size: "3" },
      { name: "employerZip", label: "ZIP", size: "3" },
      { name: "controlNumber", label: "Control Number (Box d)", size: "6" },
    ]},
    { title: "Employee Information", fields: [
      { name: "employeeFirstName", label: "First Name *", size: "5" },
      { name: "employeeMiddleInitial", label: "M.I.", size: "2" },
      { name: "employeeLastName", label: "Last Name *", size: "5" },
      { name: "employeeSSN", label: "SSN", placeholder: "123-45-6789", size: "6" },
      { name: "employeeAddress", label: "Address", size: "12" },
      { name: "employeeCity", label: "City", size: "6" },
      { name: "employeeState", label: "State", type: "select", options: stateOptions, size: "3" },
      { name: "employeeZip", label: "ZIP", size: "3" },
    ]},
    { title: "Wages & Taxes", note: "Boxes 3-6 auto-calculate from Box 1 when left blank.", fields: [
      { name: "wagesTips", label: "Box 1 — Wages, tips *", type: "number", size: "6" },
      { name: "federalTaxWithheld", label: "Box 2 — Federal tax withheld", type: "number", size: "6" },
      { name: "socialSecurityWages", label: "Box 3 — Social security wages", type: "number", size: "6" },
      { name: "socialSecurityTax", label: "Box 4 — Social security tax", type: "number", size: "6" },
      { name: "medicareWages", label: "Box 5 — Medicare wages", type: "number", size: "6" },
      { name: "medicareTax", label: "Box 6 — Medicare tax", type: "number", size: "6" },
      { name: "socialSecurityTips", label: "Box 7 — Social security tips", type: "number", size: "6" },
      { name: "allocatedTips", label: "Box 8 — Allocated tips", type: "number", size: "6" },
      { name: "dependentCareBenefits", label: "Box 10 — Dependent care benefits", type: "number", size: "6" },
      { name: "nonqualifiedPlans", label: "Box 11 — Nonqualified plans", type: "number", size: "6" },
    ]},
    { title: "Box 12", fields: [
      { name: "box12aCode", label: "12a Code", type: "select", options: box12Options, size: "7" },
      { name: "box12aAmount", label: "12a Amount", type: "number", size: "5" },
      { name: "box12bCode", label: "12b Code", type: "select", options: box12Options, size: "7" },
      { name: "box12bAmount", label: "12b Amount", type: "number", size: "5" },
      { name: "box12cCode", label: "12c Code", type: "select", options: box12Options, size: "7" },
      { name: "box12cAmount", label: "12c Amount", type: "number", size: "5" },
      { name: "box12dCode", label: "12d Code", type: "select", options: box12Options, size: "7" },
      { name: "box12dAmount", label: "12d Amount", type: "number", size: "5" },
    ]},
    { title: "Box 13 & 14", fields: [
      { name: "statutoryEmployee", label: "Statutory employee", type: "checkbox", size: "12" },
      { name: "retirementPlan", label: "Retirement plan", type: "checkbox", size: "12" },
      { name: "thirdPartySickPay", label: "Third-party sick pay", type: "checkbox", size: "12" },
      { name: "other", label: "Box 14 — Other", size: "12" },
    ]},
    { title: "State & Local", fields: [
      { name: "state", label: "State", type: "select", options: stateOptions, size: "4" },
      { name: "employerStateId", label: "Employer state ID", size: "8" },
      { name: "stateWages", label: "Box 16 — State wages", type: "number", size: "6" },
      { name: "stateIncomeTax", label: "Box 17 — State income tax", type: "number", size: "6" },
      { name: "localWages", label: "Box 18 — Local wages", type: "number", size: "6" },
      { name: "localIncomeTax", label: "Box 19 — Local income tax", type: "number", size: "6" },
      { name: "localityName", label: "Box 20 — Locality name", size: "6" },
    ]},
  ],
};

// ── W-9 ──────────────────────────────────────────────────────────────────────
const W9_CONFIG = {
  key: "w9", docType: "w9", title: "W-9 Taxpayer Identification", price: 14.99,
  taxYears: ["2024", "2023", "2022", "2021", "2018"], defaultYear: "2024",
  storageKey: "appW9FormData",
  pendingDataKey: "pendingW9Data", pendingYearKey: null,
  preview: (fd, year) => generateW9Preview(fd, year),
  download: (fd, year, returnBlob) => generateAndDownloadW9(fd, year, returnBlob),
  derive: (fd) => fd,
  validate: (fd) => {
    if (!String(fd.name || "").trim()) return "Please enter your name";
    if (fd.tinType === "ssn" && !String(fd.ssn || "").trim()) return "Please enter your SSN";
    if (fd.tinType === "ein" && !String(fd.ein || "").trim()) return "Please enter your EIN";
    return null;
  },
  sections: [
    { title: "Taxpayer", fields: [
      { name: "name", label: "Name (as shown on your tax return) *", size: "12" },
      { name: "businessName", label: "Business name / disregarded entity", size: "12" },
      { name: "taxClassification", label: "Federal tax classification", type: "select", size: "12", options: [
        { value: "individual", label: "Individual / sole proprietor" },
        { value: "ccorp", label: "C Corporation" },
        { value: "scorp", label: "S Corporation" },
        { value: "partnership", label: "Partnership" },
        { value: "trust", label: "Trust / estate" },
        { value: "llc", label: "Limited liability company (LLC)" },
        { value: "other", label: "Other" },
      ]},
      { name: "llcTaxCode", label: "LLC tax classification", type: "select", size: "6", showIf: fd => fd.taxClassification === "llc", options: [
        { value: "C", label: "C — C corporation" }, { value: "S", label: "S — S corporation" }, { value: "P", label: "P — Partnership" },
      ]},
      { name: "otherClassification", label: "Other classification", size: "12", showIf: fd => fd.taxClassification === "other" },
      { name: "exemptPayeeCode", label: "Exempt payee code", size: "6" },
      { name: "fatcaCode", label: "FATCA exemption code", size: "6" },
    ]},
    { title: "Address", fields: [
      { name: "address", label: "Street address", size: "12" },
      { name: "city", label: "City", size: "6" },
      { name: "state", label: "State", type: "select", options: stateOptions, size: "3" },
      { name: "zipCode", label: "ZIP", size: "3" },
      { name: "accountNumbers", label: "Account number(s) (optional)", size: "12" },
    ]},
    { title: "Taxpayer Identification Number", fields: [
      { name: "tinType", label: "TIN type", type: "segment", size: "12", options: [
        { value: "ssn", label: "SSN" }, { value: "ein", label: "EIN" },
      ]},
      { name: "ssn", label: "Social Security Number *", placeholder: "123-45-6789", size: "6", showIf: fd => fd.tinType !== "ein" },
      { name: "ein", label: "Employer ID Number *", placeholder: "12-3456789", size: "6", showIf: fd => fd.tinType === "ein" },
      { name: "signatureDate", label: "Signature date", type: "date", size: "6" },
    ]},
  ],
};

// ── shared payer/recipient sections for the 1099s ────────────────────────────
const payerSection = {
  title: "Payer Information", fields: [
    { name: "payerName", label: "Payer Name *", size: "12" },
    { name: "payerAddress", label: "Address", size: "12" },
    { name: "payerCity", label: "City", size: "6" },
    { name: "payerState", label: "State", type: "select", options: stateOptions, size: "3" },
    { name: "payerZip", label: "ZIP", size: "3" },
    { name: "payerPhone", label: "Phone", type: "tel", size: "6" },
    { name: "payerTIN", label: "Payer TIN *", placeholder: "12-3456789", size: "6" },
  ],
};
const recipientSection = {
  title: "Recipient Information", fields: [
    { name: "recipientName", label: "Recipient Name *", size: "12" },
    { name: "recipientTIN", label: "Recipient TIN *", placeholder: "123-45-6789", size: "6" },
    { name: "accountNumber", label: "Account number (optional)", size: "6" },
    { name: "recipientAddress", label: "Address", size: "12" },
    { name: "recipientCity", label: "City", size: "6" },
    { name: "recipientState", label: "State", type: "select", options: stateOptions, size: "3" },
    { name: "recipientZip", label: "ZIP", size: "3" },
    { name: "secondTINNotice", label: "2nd TIN notice", type: "checkbox", size: "12" },
  ],
};
const stateTaxSection = {
  title: "State Tax Information", fields: [
    { name: "state1", label: "State", type: "select", options: stateOptions, size: "3" },
    { name: "payerStateNo1", label: "Payer state no.", size: "3" },
    { name: "stateIncome1", label: "State income", type: "number", size: "3" },
    { name: "stateTaxWithheld1", label: "State tax", type: "number", size: "3" },
    { name: "state2", label: "State 2", type: "select", options: stateOptions, size: "3" },
    { name: "payerStateNo2", label: "Payer state no. 2", size: "3" },
    { name: "stateIncome2", label: "State income 2", type: "number", size: "3" },
    { name: "stateTaxWithheld2", label: "State tax 2", type: "number", size: "3" },
  ],
};

// ── 1099-NEC ─────────────────────────────────────────────────────────────────
const NEC_CONFIG = {
  key: "1099-nec", docType: "1099-nec", title: "1099-NEC Nonemployee Compensation", price: 14.99,
  taxYears: ["2025", "2024", "2023", "2022", "2021"], defaultYear: "2024",
  storageKey: "app1099NECFormData",
  pendingDataKey: "pending1099NECData", pendingYearKey: "pending1099NECTaxYear",
  preview: (fd, year) => generate1099NECPreview(fd, year),
  download: (fd, year, returnBlob) => generateAndDownload1099NEC(fd, year, returnBlob),
  derive: (fd) => fd,
  validate: (fd) => {
    if (!String(fd.payerName || "").trim())     return "Please enter the payer name";
    if (!String(fd.recipientName || "").trim()) return "Please enter the recipient name";
    if (!num(fd.box1))                          return "Please enter Box 1 compensation";
    return null;
  },
  sections: [
    payerSection,
    recipientSection,
    { title: "Amounts", fields: [
      { name: "box1", label: "Box 1 — Nonemployee compensation *", type: "number", size: "6" },
      { name: "box4", label: "Box 4 — Federal income tax withheld", type: "number", size: "6" },
      { name: "box2", label: "Box 2 — Payer made direct sales totaling $5,000 or more", type: "checkbox", size: "12" },
    ]},
    stateTaxSection,
  ],
};

// ── 1099-MISC ────────────────────────────────────────────────────────────────
const MISC_CONFIG = {
  key: "1099-misc", docType: "1099-misc", title: "1099-MISC Miscellaneous Income", price: 14.99,
  taxYears: ["2025", "2024", "2023", "2022", "2021"], defaultYear: "2024",
  storageKey: "app1099MISCFormData",
  pendingDataKey: "pending1099MISCData", pendingYearKey: "pending1099MISCTaxYear",
  preview: (fd, year) => generate1099MISCPreview(fd, year),
  download: (fd, year, returnBlob) => generateAndDownload1099MISC(fd, year, returnBlob),
  derive: (fd) => fd,
  validate: (fd) => {
    if (!String(fd.payerName || "").trim())     return "Please enter the payer name";
    if (!String(fd.recipientName || "").trim()) return "Please enter the recipient name";
    return null;
  },
  sections: [
    payerSection,
    { ...recipientSection, fields: [...recipientSection.fields,
      { name: "fatcaFiling", label: "FATCA filing requirement", type: "checkbox", size: "12" },
    ]},
    { title: "Amounts", fields: [
      { name: "box1", label: "Box 1 — Rents", type: "number", size: "6" },
      { name: "box2", label: "Box 2 — Royalties", type: "number", size: "6" },
      { name: "box3", label: "Box 3 — Other income", type: "number", size: "6" },
      { name: "box4", label: "Box 4 — Federal income tax withheld", type: "number", size: "6" },
      { name: "box5", label: "Box 5 — Fishing boat proceeds", type: "number", size: "6" },
      { name: "box6", label: "Box 6 — Medical & health care payments", type: "number", size: "6" },
      { name: "box7", label: "Box 7 — Payer made direct sales totaling $5,000 or more", type: "checkbox", size: "12" },
      { name: "box8", label: "Box 8 — Substitute payments", type: "number", size: "6" },
      { name: "box9", label: "Box 9 — Crop insurance proceeds", type: "number", size: "6" },
      { name: "box10", label: "Box 10 — Gross proceeds to an attorney", type: "number", size: "6" },
      { name: "box11", label: "Box 11 — Fish purchased for resale", type: "number", size: "6" },
      { name: "box12", label: "Box 12 — Section 409A deferrals", type: "number", size: "6" },
      { name: "box15", label: "Box 15 — Nonqualified deferred compensation", type: "number", size: "6" },
    ]},
    stateTaxSection,
  ],
};

// ── Schedule C ───────────────────────────────────────────────────────────────
const SCHEDC_CONFIG = {
  key: "schedule-c", docType: "schedule-c", title: "Schedule C Profit or Loss", price: 14.99,
  taxYears: ["2024", "2023", "2022"], defaultYear: "2024",
  storageKey: "appScheduleCFormData",
  pendingDataKey: "pendingScheduleCData", pendingYearKey: "pendingScheduleCTaxYear",
  preview: (fd, year) => generateScheduleCPreview(fd, year),
  download: (fd, year, returnBlob) => generateAndDownloadScheduleC(fd, year, returnBlob),
  // Totals compute exactly like the web form's autoCalculate
  derive: (fd) => {
    const line3 = num(fd.line1) - num(fd.line2);
    const line5 = line3 - num(fd.line4);
    const line7 = line5 + num(fd.line6);
    const expenses = ["line8","line9","line10","line11","line12","line13","line14","line15a","line15b",
      "line16a","line17","line18","line19a","line19b","line20","line21","line22","line23a","line23b",
      "line24","line25","line26a","line26b"].reduce((s, k) => s + num(fd[k]), 0);
    const line28 = line7 - expenses;
    const line30 = line28 - num(fd.line29);
    return {
      ...fd,
      line3: line3.toFixed(0), line5: line5.toFixed(0), line7: line7.toFixed(0),
      line27: expenses.toFixed(0), line28: line28.toFixed(0),
      line30: line30.toFixed(0), line31: line30.toFixed(0),
    };
  },
  validate: (fd) => {
    if (!String(fd.proprietorName || "").trim())    return "Please enter the proprietor's name";
    if (!String(fd.principalBusiness || "").trim()) return "Please describe the principal business";
    if (!num(fd.line1))                             return "Please enter gross receipts (Line 1)";
    return null;
  },
  sections: [
    { title: "Business Information", fields: [
      { name: "proprietorName", label: "Proprietor Name *", size: "6" },
      { name: "ssn", label: "SSN", placeholder: "123-45-6789", size: "6" },
      { name: "principalBusiness", label: "Principal business or profession *", size: "12" },
      { name: "businessCode", label: "Business code (6 digits)", size: "6" },
      { name: "businessName", label: "Business name", size: "6" },
      { name: "ein", label: "EIN", placeholder: "12-3456789", size: "6" },
      { name: "businessAddress", label: "Business address", size: "12" },
      { name: "businessCity", label: "City", size: "6" },
      { name: "businessState", label: "State", type: "select", options: stateOptions, size: "3" },
      { name: "businessZip", label: "ZIP", size: "3" },
    ]},
    { title: "Accounting & Questions", fields: [
      { name: "accountingMethod", label: "Accounting method", type: "segment", size: "12", options: [
        { value: "cash", label: "Cash" }, { value: "accrual", label: "Accrual" }, { value: "other", label: "Other" },
      ]},
      { name: "otherMethodText", label: "Other method", size: "12", showIf: fd => fd.accountingMethod === "other" },
      { name: "materialParticipation", label: "Materially participated?", type: "segment", size: "6", options: yesNo },
      { name: "payments1099", label: "Made payments requiring 1099s?", type: "segment", size: "6", options: yesNo },
      { name: "filed1099", label: "Will you file required 1099s?", type: "segment", size: "6", options: yesNo, showIf: fd => fd.payments1099 === "yes" },
      { name: "startedAcquired", label: "Started or acquired this business during the year", type: "checkbox", size: "12" },
    ]},
    { title: "Part I — Income", note: "Gross profit and totals calculate automatically.", fields: [
      { name: "line1", label: "Line 1 — Gross receipts *", type: "number", size: "6" },
      { name: "line2", label: "Line 2 — Returns and allowances", type: "number", size: "6" },
      { name: "line4", label: "Line 4 — Cost of goods sold", type: "number", size: "6" },
      { name: "line6", label: "Line 6 — Other income", type: "number", size: "6" },
      { name: "line1Statutory", label: "Statutory employee income reported on W-2", type: "checkbox", size: "12" },
    ]},
    { title: "Part II — Expenses", fields: [
      { name: "line8", label: "8. Advertising", type: "number", size: "6" },
      { name: "line9", label: "9. Car and truck expenses", type: "number", size: "6" },
      { name: "line10", label: "10. Commissions and fees", type: "number", size: "6" },
      { name: "line11", label: "11. Contract labor", type: "number", size: "6" },
      { name: "line12", label: "12. Depreciation", type: "number", size: "6" },
      { name: "line13", label: "13. Employee benefit programs", type: "number", size: "6" },
      { name: "line14", label: "14. Insurance (other than health)", type: "number", size: "6" },
      { name: "line15a", label: "15a. Interest — Mortgage", type: "number", size: "6" },
      { name: "line15b", label: "15b. Interest — Other", type: "number", size: "6" },
      { name: "line16a", label: "16. Legal and professional services", type: "number", size: "6" },
      { name: "line17", label: "17. Office expense", type: "number", size: "6" },
      { name: "line18", label: "18. Pension and profit-sharing", type: "number", size: "6" },
      { name: "line19a", label: "19a. Rent — Vehicles/equipment", type: "number", size: "6" },
      { name: "line19b", label: "19b. Rent — Other property", type: "number", size: "6" },
      { name: "line20", label: "20. Repairs and maintenance", type: "number", size: "6" },
      { name: "line21", label: "21. Supplies", type: "number", size: "6" },
      { name: "line22", label: "22. Taxes and licenses", type: "number", size: "6" },
      { name: "line23a", label: "23a. Travel", type: "number", size: "6" },
      { name: "line23b", label: "23b. Deductible meals", type: "number", size: "6" },
      { name: "line24", label: "24. Utilities", type: "number", size: "6" },
      { name: "line25", label: "25. Wages", type: "number", size: "6" },
      { name: "line26a", label: "26a. Other expenses", type: "number", size: "6" },
      { name: "line26b", label: "26b. Energy efficient buildings deduction", type: "number", size: "6" },
      { name: "line29", label: "29. Expenses for business use of home", type: "number", size: "6" },
    ]},
  ],
};

export const TAX_FORM_CONFIGS = {
  "w2": W2_CONFIG,
  "w9": W9_CONFIG,
  "1099-nec": NEC_CONFIG,
  "1099-misc": MISC_CONFIG,
  "schedule-c": SCHEDC_CONFIG,
};

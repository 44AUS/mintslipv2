// Field schemas for the app's native business-form modals (Commercial Lease,
// Utility Bill, Bank Statement). Field names and pending localStorage keys
// match the web forms, so the shared generators and PaymentSuccess work
// unchanged.

import { generateCommercialLeasePreview } from "@/utils/commercialLeasePreviewGenerator";
import { generateUtilityBillPreview } from "@/utils/utilityBillPreviewGenerator";
import { generateBankStatementPreview } from "@/utils/bankStatementPreviewGenerator";
import { generateAndDownloadCommercialLease, LEASE_TYPES } from "@/utils/commercialLeaseGenerator";
import { generateAndDownloadUtilityBill } from "@/utils/utilityBillGenerator";
import { generateAndDownloadBankStatement } from "@/utils/bankStatementGenerator";

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","DC","FL","GA","HI","ID","IL","IN",
  "IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH",
  "NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT",
  "VT","VA","WA","WV","WI","WY",
];
const stateOptions = US_STATES.map(s => ({ value: s, label: s }));
const isLocalhost = typeof window !== "undefined" &&
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

// ── Commercial Lease ─────────────────────────────────────────────────────────
const LEASE_CONFIG = {
  key: "commercial-lease", docType: "commercial-lease", title: "Commercial Lease Agreement", price: 9.99,
  storageKey: "appCommercialLeaseFormData",
  cancelPath: "/app/business-forms",
  preview: (fd) => generateCommercialLeasePreview(fd),
  download: (fd, _year, returnBlob) => generateAndDownloadCommercialLease(fd, returnBlob),
  derive: (fd) => ({
    agreementDate: new Date().toISOString().slice(0, 10),
    leaseType: "triple-net", rentDueDay: "1st", lateFeeGraceDays: "5",
    rentIncreaseType: "none", depositReturnDays: "30", utilitiesPaidBy: "tenant",
    renewalTerms: "one (1)", renewalNoticeDays: "90", liabilityInsuranceAmount: "1000000",
    defaultCureDays: "10", holdoverPercent: "150",
    ...fd,
  }),
  buildPending: (fd) => ({ pendingCommercialLeaseData: fd }),
  checkoutTemplate: (fd) => fd.leaseType || "triple-net",
  validate: (fd) => {
    if (!String(fd.landlordName || "").trim()) return "Please enter the landlord's name";
    if (!String(fd.tenantName || "").trim())   return "Please enter the tenant's name";
    if (!String(fd.monthlyRent || "").trim())  return "Please enter the monthly rent";
    return null;
  },
  sections: [
    { title: "Agreement", fields: [
      { name: "governingState", label: "Governing State", type: "select", options: stateOptions, size: "6" },
      { name: "agreementDate", label: "Agreement Date", type: "date", size: "6" },
      { name: "leaseType", label: "Lease Type", type: "select", size: "12",
        options: LEASE_TYPES.map(t => ({ value: t.value, label: t.label })) },
      { name: "camCharges", label: "Monthly CAM charges ($)", type: "number", size: "6", showIf: fd => (fd.leaseType || "triple-net") !== "gross" },
      { name: "percentageRate", label: "Percentage rate (%)", type: "number", size: "6", showIf: fd => fd.leaseType === "percentage" },
      { name: "percentageBreakpoint", label: "Sales breakpoint ($)", type: "number", size: "6", showIf: fd => fd.leaseType === "percentage" },
    ]},
    { title: "Landlord", fields: [
      { name: "landlordName", label: "Name *", size: "6" },
      { name: "landlordTitle", label: "Title (optional)", size: "6" },
      { name: "landlordAddress", label: "Address", size: "12" },
      { name: "landlordCity", label: "City", size: "6" },
      { name: "landlordState", label: "State", type: "select", options: stateOptions, size: "3" },
      { name: "landlordZip", label: "ZIP", size: "3" },
      { name: "landlordPhone", label: "Phone", type: "tel", size: "6" },
      { name: "landlordEmail", label: "Email", type: "email", size: "6" },
    ]},
    { title: "Tenant", fields: [
      { name: "tenantName", label: "Name *", size: "6" },
      { name: "tenantEntityType", label: "Entity type (e.g. LLC)", size: "6" },
      { name: "tenantAddress", label: "Address", size: "12" },
      { name: "tenantCity", label: "City", size: "6" },
      { name: "tenantState", label: "State", type: "select", options: stateOptions, size: "3" },
      { name: "tenantZip", label: "ZIP", size: "3" },
      { name: "tenantPhone", label: "Phone", type: "tel", size: "6" },
      { name: "tenantEmail", label: "Email", type: "email", size: "6" },
    ]},
    { title: "Premises", fields: [
      { name: "premisesAddress", label: "Premises Address", size: "12" },
      { name: "premisesUnit", label: "Unit / Suite", size: "4" },
      { name: "premisesCity", label: "City", size: "4" },
      { name: "premisesState", label: "State", type: "select", options: stateOptions, size: "2" },
      { name: "premisesZip", label: "ZIP", size: "2" },
      { name: "squareFootage", label: "Square Footage", type: "number", size: "4" },
      { name: "propertyType", label: "Property Type (e.g. retail)", size: "4" },
      { name: "parkingSpaces", label: "Parking Spaces", type: "number", size: "4" },
      { name: "permittedUse", label: "Permitted Use", size: "12" },
      { name: "premisesDescription", label: "Premises description (optional)", type: "textarea", size: "12" },
    ]},
    { title: "Term & Renewal", fields: [
      { name: "leaseStartDate", label: "Lease Start", type: "date", size: "6" },
      { name: "leaseEndDate", label: "Lease End", type: "date", size: "6" },
      { name: "renewalOption", label: "Include renewal option", type: "checkbox", size: "12" },
      { name: "renewalLength", label: "Renewal length (e.g. 5 years)", size: "6", showIf: fd => !!fd.renewalOption },
      { name: "renewalNoticeDays", label: "Renewal notice (days)", type: "number", size: "6", showIf: fd => !!fd.renewalOption },
    ]},
    { title: "Rent & Deposit", fields: [
      { name: "monthlyRent", label: "Monthly Rent ($) *", type: "number", size: "6" },
      { name: "rentDueDay", label: "Rent due day (e.g. 1st)", size: "6" },
      { name: "lateFee", label: "Late fee ($)", type: "number", size: "6" },
      { name: "lateFeeGraceDays", label: "Grace period (days)", type: "number", size: "6" },
      { name: "rentIncreaseType", label: "Annual rent increase", type: "segment", size: "12", options: [
        { value: "none", label: "None" }, { value: "percentage", label: "Percentage" }, { value: "fixed", label: "Fixed amount" },
      ]},
      { name: "rentIncreasePercent", label: "Increase (%)", type: "number", size: "6", showIf: fd => fd.rentIncreaseType === "percentage" },
      { name: "rentIncreaseAmount", label: "Increase ($)", type: "number", size: "6", showIf: fd => fd.rentIncreaseType === "fixed" },
      { name: "securityDeposit", label: "Security Deposit ($)", type: "number", size: "6" },
      { name: "depositReturnDays", label: "Deposit return (days)", type: "number", size: "6" },
    ]},
    { title: "Utilities & Other Terms", fields: [
      { name: "utilitiesPaidBy", label: "Utilities paid by", type: "segment", size: "12", options: [
        { value: "tenant", label: "Tenant" }, { value: "landlord", label: "Landlord" }, { value: "shared", label: "Shared" },
      ]},
      { name: "utilitiesDetail", label: "Utility details", size: "12", showIf: fd => fd.utilitiesPaidBy === "shared" },
      { name: "hvacResponsibility", label: "HVAC maintenance responsibility", size: "6" },
      { name: "tenantImprovementAllowance", label: "Tenant improvement allowance ($)", type: "number", size: "6" },
      { name: "liabilityInsuranceAmount", label: "Liability insurance ($)", type: "number", size: "6" },
      { name: "allowSublease", label: "Allow sublease with consent", type: "checkbox", size: "6" },
      { name: "additionalProvisions", label: "Additional provisions (optional)", type: "textarea", size: "12" },
    ]},
    { title: "Execution", fields: [
      { name: "includeGuarantor", label: "Include personal guarantor", type: "checkbox", size: "12" },
      { name: "guarantorName", label: "Guarantor name", size: "6", showIf: fd => !!fd.includeGuarantor },
      { name: "guarantorAddress", label: "Guarantor address", size: "6", showIf: fd => !!fd.includeGuarantor },
      { name: "includeNotary", label: "Include notary acknowledgment", type: "checkbox", size: "12" },
      { name: "notaryState", label: "Notary state", type: "select", options: stateOptions, size: "6", showIf: fd => !!fd.includeNotary },
      { name: "notaryCounty", label: "Notary county", size: "6", showIf: fd => !!fd.includeNotary },
      { name: "landlordSignatureImage", label: "Landlord signature (optional)", type: "signature", size: "12" },
      { name: "tenantSignatureImage", label: "Tenant signature (optional)", type: "signature", size: "12" },
    ]},
  ],
};

// ── Utility Bill ─────────────────────────────────────────────────────────────
const UTILITY_PROVIDERS = [
  { id: "xfinity", name: "Xfinity Style", template: "template-a" },
  { id: "traditional", name: "Traditional (H20 Expense)", template: "template-b" },
  ...(isLocalhost ? [{ id: "modern", name: "Modern Minimal", template: "template-c" }] : []),
];
const providerFor = (fd) => UTILITY_PROVIDERS.find(p => p.id === fd.providerId) || UTILITY_PROVIDERS[0];

const UTILITY_CONFIG = {
  key: "utility-bill", docType: "utility-bill", title: "Utility Bill", price: 9.99,
  storageKey: "appUtilityBillFormData",
  cancelPath: "/app/business-forms",
  preview: (fd) => generateUtilityBillPreview({ ...fd, uploadedLogo: fd.uploadedLogo }, providerFor(fd).template),
  download: (fd, _year, returnBlob) =>
    generateAndDownloadUtilityBill({ ...fd, selectedProvider: providerFor(fd), uploadedLogo: fd.uploadedLogo }, providerFor(fd).template, returnBlob),
  derive: (fd) => ({
    providerId: "xfinity", accountStatus: "Current", serviceType: "Water",
    billingDate: new Date().toISOString().split("T")[0],
    previousBalance: "0.00", paymentReceived: "0.00",
    baseCharge: "0.00", usageCharge: "0.00", taxes: "0.00", fees: "0.00", usageUnit: "gallons",
    ...fd,
  }),
  buildPending: (fd) => ({
    pendingUtilityBillData: { ...fd, selectedProvider: providerFor(fd), uploadedLogo: fd.uploadedLogo },
    pendingUtilityBillTemplate: providerFor(fd).template,
  }),
  checkoutTemplate: (fd) => providerFor(fd).id,
  validate: (fd) => {
    if (!fd.uploadedLogo)                        return "Please upload the provider logo";
    if (!String(fd.companyName || "").trim())    return "Please enter the utility company name";
    if (!String(fd.customerName || "").trim())   return "Please enter the customer name";
    if (!String(fd.accountNumber || "").trim())  return "Please enter the account number";
    return null;
  },
  sections: [
    { title: "Bill Style", fields: [
      { name: "providerId", label: "Bill Style", type: "segment", size: "12",
        options: UTILITY_PROVIDERS.map(p => ({ value: p.id, label: p.name })) },
      { name: "uploadedLogo", label: "Provider logo *", type: "image", size: "12" },
    ]},
    { title: "Utility Company", fields: [
      { name: "companyName", label: "Company Name *", size: "6" },
      { name: "companyPhone", label: "Phone", type: "tel", size: "6" },
      { name: "companyAddress", label: "Address", size: "12" },
      { name: "companyCity", label: "City", size: "6" },
      { name: "companyState", label: "State", type: "select", options: stateOptions, size: "3" },
      { name: "companyZip", label: "ZIP", size: "3" },
      { name: "companyWebsite", label: "Website", size: "6" },
    ]},
    { title: "Account & Service Address", fields: [
      { name: "customerName", label: "Customer Name *", size: "6" },
      { name: "accountNumber", label: "Account Number *", size: "6" },
      { name: "serviceAddress", label: "Service Address", size: "12" },
      { name: "serviceCity", label: "City", size: "6" },
      { name: "serviceState", label: "State", type: "select", options: stateOptions, size: "3" },
      { name: "serviceZip", label: "ZIP", size: "3" },
      { name: "accountStatus", label: "Account Status", type: "segment", size: "12", options: [
        { value: "Current", label: "Current" }, { value: "Past Due", label: "Past Due" },
      ]},
    ]},
    { title: "Billing Period", fields: [
      { name: "billingDate", label: "Billing Date", type: "date", size: "6" },
      { name: "dueDate", label: "Due Date", type: "date", size: "6" },
      { name: "servicePeriodStart", label: "Service Period Start", type: "date", size: "6" },
      { name: "servicePeriodEnd", label: "Service Period End", type: "date", size: "6" },
      { name: "serviceType", label: "Service Type", type: "select", size: "6", options: [
        "Electric", "Gas", "Water", "Internet", "Cable TV", "Phone", "Bundled Services", "Other",
      ].map(s => ({ value: s, label: s })) },
    ]},
    { title: "Charges", fields: [
      { name: "previousBalance", label: "Previous Balance ($)", type: "number", size: "6" },
      { name: "paymentReceived", label: "Payment Received ($)", type: "number", size: "6" },
      { name: "paymentDate", label: "Payment Date", type: "date", size: "6" },
      { name: "baseCharge", label: "Base Charge ($)", type: "number", size: "6" },
      { name: "usageCharge", label: "Usage Charge ($)", type: "number", size: "6" },
      { name: "usageAmount", label: "Usage Amount", type: "number", size: "3" },
      { name: "usageUnit", label: "Unit", type: "select", size: "3", options: [
        "gallons", "kWh", "therms", "GB",
      ].map(u => ({ value: u, label: u })) },
      { name: "taxes", label: "Taxes ($)", type: "number", size: "6" },
      { name: "fees", label: "Fees ($)", type: "number", size: "6" },
    ]},
  ],
};

// ── Bank Statement ───────────────────────────────────────────────────────────
const BANKS = [
  { id: "chime", name: "Chime", template: "template-a" },
  ...(isLocalhost ? [
    { id: "bank-of-america", name: "Bank of America", template: "template-b" },
    { id: "chase", name: "Chase", template: "template-c" },
  ] : []),
  { id: "other", name: "Other (upload logo)", template: "template-a" },
];
const bankFor = (fd) => BANKS.find(b => b.id === fd.bankId) || BANKS[0];
const flatBank = (fd) => ({
  accountName: fd.accountName, accountAddress1: fd.accountAddress1, accountAddress2: fd.accountAddress2,
  accountNumber: fd.accountNumber, selectedMonth: fd.selectedMonth,
  beginningBalance: fd.beginningBalance || "0.00",
  transactions: Array.isArray(fd.transactions) ? fd.transactions : [],
  bankName: fd.bankId === "other" ? (fd.customBankName || "") : bankFor(fd).name,
  bankLogo: fd.bankLogo || null,
});

const BANK_CONFIG = {
  key: "bank-statement", docType: "bank-statement", title: "Accounting Mockup (Bank Statement)",
  price: (fd) => {
    const t = bankFor(fd).template;
    return (t === "template-b" || t === "template-c") ? 69.99 : 49.99;
  },
  storageKey: "appBankStatementFormData",
  cancelPath: "/app/business-forms",
  preview: (fd) => generateBankStatementPreview(flatBank(fd), bankFor(fd).template),
  download: (fd, _year, returnBlob) => generateAndDownloadBankStatement(flatBank(fd), bankFor(fd).template, returnBlob),
  derive: (fd) => ({
    bankId: "chime",
    selectedMonth: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`,
    beginningBalance: "0.00",
    transactions: [{ date: "", description: "", type: "Purchase", amount: "" }],
    ...fd,
  }),
  // Mirrors the web form's pending shape exactly
  buildPending: (fd) => ({
    pendingBankStatementData: {
      formData: flatBank(fd),
      transactions: flatBank(fd).transactions,
      bankLogo: fd.bankLogo || null,
      beginningBalance: fd.beginningBalance || "0.00",
      statementPeriod: fd.selectedMonth,
    },
    pendingBankStatementTemplate: bankFor(fd).template,
  }),
  checkoutTemplate: (fd) => bankFor(fd).template,
  validate: (fd) => {
    if (!String(fd.accountName || "").trim())   return "Please enter the account holder name";
    if (!String(fd.accountNumber || "").trim()) return "Please enter the account number";
    if (!String(fd.selectedMonth || "").trim()) return "Please choose the statement month";
    const txs = (fd.transactions || []).filter(t => t.description || t.amount);
    if (!txs.length)                            return "Please add at least one transaction";
    return null;
  },
  sections: [
    { title: "Bank & Statement", fields: [
      { name: "bankId", label: "Bank Style", type: "select", size: "6",
        options: BANKS.map(b => ({ value: b.id, label: b.name })) },
      { name: "customBankName", label: "Bank name", size: "6", showIf: fd => fd.bankId === "other" },
      { name: "bankLogo", label: "Bank logo (optional)", type: "image", size: "12", showIf: fd => fd.bankId === "other" },
      { name: "selectedMonth", label: "Statement Month *", type: "month", size: "6" },
      { name: "beginningBalance", label: "Beginning Balance ($)", type: "number", size: "6" },
    ]},
    { title: "Account Holder", fields: [
      { name: "accountName", label: "Account Holder Name *", size: "6" },
      { name: "accountNumber", label: "Account Number *", size: "6" },
      { name: "accountAddress1", label: "Address Line 1", size: "12" },
      { name: "accountAddress2", label: "Address Line 2 (City, State ZIP)", size: "12" },
    ]},
    { title: "Transactions", note: "Deposits and refunds are credits; everything else is a debit.", fields: [
      { name: "transactions", type: "rowList", size: "12", addLabel: "Add Transaction",
        newRow: () => ({ date: "", description: "", type: "Purchase", amount: "" }),
        columns: [
          { name: "date", label: "Date", type: "date", size: "3", sizeSm: "6" },
          { name: "description", label: "Description", size: "4", sizeSm: "6" },
          { name: "type", label: "Type", type: "select", size: "2", sizeSm: "6", options: [
            "Purchase", "Deposit", "Transfer", "Refund", "Withdrawal",
          ].map(t => ({ value: t, label: t })) },
          { name: "amount", label: "Amount ($)", type: "number", size: "2", sizeSm: "6" },
        ]},
    ]},
  ],
};

export const BUSINESS_FORM_CONFIGS = {
  "commercial-lease": LEASE_CONFIG,
  "utility-bill": UTILITY_CONFIG,
  "bank-statement": BANK_CONFIG,
};

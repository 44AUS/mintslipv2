import { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import { IonSpinner } from "@ionic/react";
import { generateCommercialLeasePreview } from "@/utils/commercialLeasePreviewGenerator";
import { generateUtilityBillPreview } from "@/utils/utilityBillPreviewGenerator";
import { generateBankStatementPreview } from "@/utils/bankStatementPreviewGenerator";
import AppTaxFormModal from "./AppTaxFormModal";
import { BUSINESS_FORM_CONFIGS } from "./appBusinessFormConfigs";

// A simple text logo for the sample utility bill / bank statement previews
function makeTextLogo(text, color) {
  const canvas = document.createElement("canvas");
  canvas.width = 240; canvas.height = 64;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.font = "bold 34px 'Segoe UI', Arial, sans-serif";
  ctx.fillStyle = color;
  ctx.textBaseline = "middle";
  ctx.fillText(text, 8, 34);
  return canvas.toDataURL("image/png");
}

const LEASE_SAMPLE = {
  governingState: "NY", agreementDate: "2026-09-01", leaseType: "triple-net", camCharges: "450",
  landlordName: "Acme Properties LLC", landlordAddress: "456 Business Ave",
  landlordCity: "New York", landlordState: "NY", landlordZip: "10002",
  tenantName: "Smith Consulting LLC", tenantEntityType: "LLC",
  tenantAddress: "123 Main Street", tenantCity: "New York", tenantState: "NY", tenantZip: "10001",
  premisesAddress: "789 Commerce Street", premisesUnit: "Suite 200",
  premisesCity: "New York", premisesState: "NY", premisesZip: "10003",
  squareFootage: "2400", propertyType: "office", permittedUse: "General office and administrative use",
  leaseStartDate: "2026-10-01", leaseEndDate: "2029-09-30",
  monthlyRent: "4800", annualRent: "57600", rentDueDay: "1st",
  lateFee: "250", lateFeeGraceDays: "5", rentIncreaseType: "none",
  securityDeposit: "9600", depositReturnDays: "30", utilitiesPaidBy: "tenant",
  liabilityInsuranceAmount: "1000000", defaultCureDays: "10", holdoverPercent: "150",
  renewalTerms: "one (1)", renewalNoticeDays: "90",
};
const UTILITY_SAMPLE = {
  providerId: "xfinity",
  companyName: "City Power & Light", companyAddress: "100 Utility Way",
  companyCity: "New York", companyState: "NY", companyZip: "10001", companyPhone: "(800) 555-0100",
  customerName: "John Smith", accountNumber: "4477-8899-01",
  serviceAddress: "123 Main Street", serviceCity: "New York", serviceState: "NY", serviceZip: "10001",
  accountStatus: "Current", serviceType: "Electric",
  billingDate: "2026-09-01", servicePeriodStart: "2026-08-01", servicePeriodEnd: "2026-08-31", dueDate: "2026-09-20",
  previousBalance: "142.50", paymentReceived: "142.50",
  baseCharge: "24.00", usageCharge: "96.40", usageAmount: "812", usageUnit: "kWh",
  taxes: "9.85", fees: "4.50",
};
const BANK_SAMPLE = {
  bankId: "chime",
  accountName: "John Smith", accountNumber: "1234",
  accountAddress1: "123 Main Street", accountAddress2: "New York, NY 10001",
  selectedMonth: "2026-08", beginningBalance: "2450.00",
  transactions: [
    { date: "2026-08-01", description: "Payroll Deposit — Acme Corp", type: "Deposit", amount: "1963.08" },
    { date: "2026-08-03", description: "Whole Foods Market", type: "Purchase", amount: "86.42" },
    { date: "2026-08-07", description: "Shell Gas Station", type: "Purchase", amount: "48.10" },
    { date: "2026-08-12", description: "Netflix.com", type: "Purchase", amount: "15.49" },
    { date: "2026-08-15", description: "Payroll Deposit — Acme Corp", type: "Deposit", amount: "1963.08" },
    { date: "2026-08-21", description: "Con Edison Utility", type: "Purchase", amount: "134.75" },
  ],
};

const BUSINESS_FORMS = [
  { key: "commercial-lease", name: "Commercial Lease", title: "Commercial Lease Agreement", color: "#0891b2",
    preview: () => generateCommercialLeasePreview(LEASE_SAMPLE) },
  { key: "utility-bill", name: "Utility Bill", title: "Utility Bill", color: "#64748b",
    preview: () => generateUtilityBillPreview({ ...UTILITY_SAMPLE, uploadedLogo: makeTextLogo("City Power", "#6d28d9") }, "template-a") },
  { key: "bank-statement", name: "Bank Statement", title: "Accounting Mockup", color: "#16a34a",
    preview: () => generateBankStatementPreview({ ...BANK_SAMPLE, bankName: "Chime", bankLogo: null }, "template-a") },
];

export default function AppBusinessForms() {
  const [previews, setPreviews] = useState({});
  const [loadingPreviews, setLoadingPreviews] = useState(true);
  const [activeForm, setActiveForm] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      for (const form of BUSINESS_FORMS) {
        try {
          const img = await form.preview();
          if (cancelled) return;
          if (img) setPreviews(prev => ({ ...prev, [form.key]: img }));
        } catch (err) {
          console.error(`Business form preview failed for ${form.key}:`, err);
        }
      }
      if (!cancelled) setLoadingPreviews(false);
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <AppLayout fillHeight>
      <div style={{ padding: 10, height: "100%", boxSizing: "border-box" }}>
        <div style={{ background: "var(--ion-card-background)", borderRadius: 12, padding: "20px 20px 24px", height: "100%", overflowY: "auto", boxShadow: "0 2px 12px rgba(0,0,0,0.10)", boxSizing: "border-box" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
            {BUSINESS_FORMS.map(form => (
              <div key={form.key}
                onClick={() => setActiveForm(form.key)}
                style={{ cursor: "pointer", borderRadius: 10, border: "1.5px solid var(--app-divider, rgba(0,0,0,0.12))", background: "var(--ion-card-background)", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.08)", transition: "box-shadow 0.2s, transform 0.15s" }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.18)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)"; e.currentTarget.style.transform = "none"; }}
              >
                <div style={{ position: "relative", background: "#fff", overflow: "hidden", minHeight: 160 }}>
                  <div style={{ position: "absolute", top: 10, left: 10, zIndex: 2, background: form.color, color: "#fff", padding: "4px 12px", borderRadius: 999, fontSize: "0.72rem", fontWeight: 700, boxShadow: "0 2px 8px rgba(0,0,0,0.28)" }}>
                    {form.name}
                  </div>
                  {previews[form.key] ? (
                    <div style={{ position: "relative", paddingTop: "141.4%", overflow: "hidden", pointerEvents: "none" }}>
                      <img src={previews[form.key]} alt={`${form.name} sample`} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "top", display: "block" }} />
                      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 56, background: "linear-gradient(to top, rgba(0,0,0,0.28), transparent)" }} />
                    </div>
                  ) : loadingPreviews ? (
                    <div style={{ height: 180, display: "flex", alignItems: "center", justifyContent: "center", background: "#f9fafb" }}>
                      <IonSpinner name="crescent" />
                    </div>
                  ) : (
                    <div style={{ height: 180, display: "flex", alignItems: "center", justifyContent: "center", background: "#f9fafb" }}>
                      <span style={{ color: "#9ca3af", fontSize: "0.8rem" }}>Preview unavailable</span>
                    </div>
                  )}
                </div>
                <div style={{ padding: "8px 16px 12px", textAlign: "center", borderTop: "1px solid var(--app-divider, rgba(0,0,0,0.06))" }}>
                  <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--ion-color-primary)" }}>Create {form.name} →</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {activeForm && <AppTaxFormModal config={BUSINESS_FORM_CONFIGS[activeForm]} onClose={() => setActiveForm(null)} />}
    </AppLayout>
  );
}

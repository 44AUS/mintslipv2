import { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import { IonSpinner } from "@ionic/react";
import { generateW2Preview } from "@/utils/w2PreviewGenerator";
import { generateW9Preview } from "@/utils/w9PreviewGenerator";
import { generate1099NECPreview } from "@/utils/1099necPreviewGenerator";
import { generate1099MISCPreview } from "@/utils/1099miscPreviewGenerator";
import { generateScheduleCPreview } from "@/utils/scheduleCPreviewGenerator";
import AppTaxFormModal from "./AppTaxFormModal";

const SAMPLE_YEAR = "2024";

// Sample data used to render the card previews — the real filled IRS forms,
// same idea as the paystub template cards.
const W2_SAMPLE = {
  employeeSSN: "123-45-6789", employerEIN: "12-3456789",
  employerName: "Acme Corporation", employerAddress: "456 Business Ave",
  employerCity: "New York", employerState: "NY", employerZip: "10002",
  employeeFirstName: "John", employeeLastName: "Smith",
  employeeAddress: "123 Main Street", employeeCity: "New York", employeeState: "NY", employeeZip: "10001",
  wagesTips: 52000, federalTaxWithheld: 6240, socialSecurityWages: 52000, socialSecurityTax: 3224,
  medicareWages: 52000, medicareTax: 754, state: "NY", stateWages: 52000, stateIncomeTax: 2600,
};
const W9_SAMPLE = {
  name: "John Smith", businessName: "Smith Consulting LLC", taxClassification: "individual",
  address: "123 Main Street", city: "New York", state: "NY", zipCode: "10001",
  tinType: "ssn", ssn: "123-45-6789", signatureDate: `${SAMPLE_YEAR}-12-15`,
};
const NEC_SAMPLE = {
  payerName: "Acme Corporation", payerAddress: "456 Business Ave",
  payerCity: "New York", payerState: "NY", payerZip: "10002", payerPhone: "(555) 123-4567",
  payerTIN: "12-3456789", recipientTIN: "123-45-6789", recipientName: "John Smith",
  recipientAddress: "123 Main Street", recipientCity: "New York", recipientState: "NY", recipientZip: "10001",
  box1: 48500, box4: 0, state1: "NY", stateIncome1: 48500,
};
const MISC_SAMPLE = {
  payerName: "Acme Corporation", payerAddress: "456 Business Ave",
  payerCity: "New York", payerState: "NY", payerZip: "10002", payerPhone: "(555) 123-4567",
  payerTIN: "12-3456789", recipientTIN: "123-45-6789", recipientName: "John Smith",
  recipientAddress: "123 Main Street", recipientCity: "New York", recipientState: "NY", recipientZip: "10001",
  box1: 24000, box3: 1500,
};
const SCHEDC_SAMPLE = {
  proprietorName: "John Smith", ssn: "123-45-6789",
  principalBusiness: "Business consulting services", businessCode: "541610",
  businessName: "Smith Consulting LLC", businessAddress: "123 Main Street",
  businessCity: "New York", businessState: "NY", businessZip: "10001",
  accountingMethod: "cash", materialParticipation: "yes",
  line1: 85000, line2: 0, line3: 85000, line4: 0, line5: 85000, line7: 85000,
};

// One card per tax form: name badge + sample preview; tapping opens the
// native form modal (AppTaxFormModal).
const TAX_FORMS = [
  { key: "w2", name: "W-2", title: "W-2 Wage & Tax Statement", color: "#7c3aed",
    preview: () => generateW2Preview(W2_SAMPLE, SAMPLE_YEAR) },
  { key: "w9", name: "W-9", title: "W-9 Taxpayer Identification", color: "#0891b2",
    preview: () => generateW9Preview(W9_SAMPLE, SAMPLE_YEAR) },
  { key: "1099-nec", name: "1099-NEC", title: "1099-NEC Nonemployee Compensation", color: "#d97706",
    preview: () => generate1099NECPreview(NEC_SAMPLE, SAMPLE_YEAR) },
  { key: "1099-misc", name: "1099-MISC", title: "1099-MISC Miscellaneous Income", color: "#ea580c",
    preview: () => generate1099MISCPreview(MISC_SAMPLE, SAMPLE_YEAR) },
  { key: "schedule-c", name: "Schedule C", title: "Schedule C Profit or Loss", color: "#92400e",
    preview: () => generateScheduleCPreview(SCHEDC_SAMPLE, SAMPLE_YEAR) },
];

export default function AppTaxForms() {
  const [previews, setPreviews] = useState({});
  const [loadingPreviews, setLoadingPreviews] = useState(true);
  const [activeForm, setActiveForm] = useState(null); // key of the open form modal

  useEffect(() => {
    let cancelled = false;
    (async () => {
      for (const form of TAX_FORMS) {
        try {
          const img = await form.preview();
          if (cancelled) return;
          if (img) setPreviews(prev => ({ ...prev, [form.key]: img }));
        } catch (err) {
          console.error(`Tax form preview failed for ${form.key}:`, err);
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
            {TAX_FORMS.map(form => (
              <div key={form.key}
                onClick={() => setActiveForm(form.key)}
                style={{ cursor: "pointer", borderRadius: 10, border: "1.5px solid var(--app-divider, rgba(0,0,0,0.12))", background: "var(--ion-card-background)", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.08)", transition: "box-shadow 0.2s, transform 0.15s" }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.18)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)"; e.currentTarget.style.transform = "none"; }}
              >
                <div style={{ position: "relative", background: "#fff", overflow: "hidden", minHeight: 160 }}>
                  {/* Form name badge over the preview (paystub-card style) */}
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

      {/* ── Native form modal (same flow as the paystub modal) ── */}
      {activeForm && <AppTaxFormModal formKey={activeForm} onClose={() => setActiveForm(null)} />}
    </AppLayout>
  );
}

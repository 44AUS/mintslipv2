import { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import { IonSpinner } from "@ionic/react";
import { generateCeaseAndDesistPreview } from "@/utils/ceaseAndDesistPreviewGenerator";
import { generatePowerOfAttorneyPreview } from "@/utils/powerOfAttorneyPreviewGenerator";
import { generateVehicleBillOfSalePreview } from "@/utils/vehicleBillOfSalePreviewGenerator";
import AppTaxFormModal from "./AppTaxFormModal";
import { LEGAL_FORM_CONFIGS } from "./appLegalFormConfigs";
import { useDisabledGenerators } from "@/utils/generatorAvailability";

// Sample data for the card previews — the real generators render these.
const CEASE_SAMPLE = {
  template: "professional", primaryColor: "#1a1a1a", accentColor: "#b71c1c",
  senderName: "John Smith", senderAddress: "123 Main Street",
  senderCity: "New York", senderState: "NY", senderZip: "10001",
  senderPhone: "(555) 123-4567", senderEmail: "john@example.com",
  recipientName: "Jane Doe", recipientCompany: "Acme Collections LLC",
  recipientAddress: "456 Business Ave", recipientCity: "New York", recipientState: "NY", recipientZip: "10002",
  letterDate: "2026-09-01", violationType: "harassment",
  description: "Repeated unwanted phone calls and messages at all hours despite multiple requests to stop contacting me.",
  complianceDays: "10", deliveryMethod: "certified-mail", signatureName: "John Smith",
};
const POA_SAMPLE = {
  governingState: "NY",
  principalName: "John Smith", principalAddress: "123 Main Street",
  principalCity: "New York", principalState: "NY", principalZip: "10001",
  agentName: "Jane Smith", agentRelationship: "Spouse",
  agentAddress: "123 Main Street", agentCity: "New York", agentState: "NY", agentZip: "10001",
  grantAllPowers: true, powers: {}, effectiveType: "immediate",
  effectiveDate: "2026-09-01", executionDate: "2026-09-01",
  agentCompensation: "uncompensated", revokePrior: true,
  includeWitnesses: true, includeNotary: true, includeAgentAcceptance: true,
};
const VEHICLE_SAMPLE = {
  template: "classic", primaryColor: "#1a1a4d", accentColor: "#3333aa",
  state: "NY", county: "New York", saleDate: "2026-09-01",
  sellerName: "John Smith", sellerAddress: "123 Main Street",
  sellerCity: "New York", sellerState: "NY", sellerZip: "10001",
  buyerName: "Jane Doe", buyerAddress: "456 Oak Avenue",
  buyerCity: "Brooklyn", buyerState: "NY", buyerZip: "11201",
  vehicleYear: "2019", vehicleMake: "Toyota", vehicleModel: "Camry SE",
  vehicleVin: "4T1B11HK5KU211234", vehicleColor: "Silver", vehicleBodyType: "Sedan",
  odometerReading: "48250", salePrice: "14500", paymentMethod: "Certified Check",
  odometerDisclosure: "actual", conditionType: "as-is",
};

const LEGAL_FORMS = [
  { key: "cease-and-desist", name: "Cease & Desist", title: "Cease and Desist Letter", color: "#b91c1c",
    preview: () => generateCeaseAndDesistPreview(CEASE_SAMPLE) },
  { key: "power-of-attorney", name: "Power of Attorney", title: "Durable Power of Attorney", color: "#7c3aed",
    preview: () => generatePowerOfAttorneyPreview({ ...POA_SAMPLE }) },
  { key: "vehicle-bill-of-sale", name: "Bill of Sale", title: "Vehicle Bill of Sale", color: "#dc2626",
    preview: () => generateVehicleBillOfSalePreview(VEHICLE_SAMPLE) },
];

export default function AppLegalForms() {
  const [previews, setPreviews] = useState({});
  const [loadingPreviews, setLoadingPreviews] = useState(true);
  const [activeForm, setActiveForm] = useState(null);
  const disabledGenerators = useDisabledGenerators();
  const visibleForms = LEGAL_FORMS.filter(form => !disabledGenerators.has(form.key));

  useEffect(() => {
    let cancelled = false;
    (async () => {
      for (const form of LEGAL_FORMS) {
        try {
          const img = await form.preview();
          if (cancelled) return;
          if (img) setPreviews(prev => ({ ...prev, [form.key]: img }));
        } catch (err) {
          console.error(`Legal form preview failed for ${form.key}:`, err);
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
          {visibleForms.length === 0 && !loadingPreviews && (
            <p style={{ color: "var(--ion-color-medium)", fontSize: "0.9rem", textAlign: "center", padding: "32px 0" }}>
              No forms are currently available.
            </p>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
            {visibleForms.map(form => (
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

      {activeForm && <AppTaxFormModal config={LEGAL_FORM_CONFIGS[activeForm]} onClose={() => setActiveForm(null)} />}
    </AppLayout>
  );
}

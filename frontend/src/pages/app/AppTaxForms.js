import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { IonPage, IonContent } from "@ionic/react";
import { FileSpreadsheet, ClipboardList, Receipt, FileBarChart, ArrowRight } from "lucide-react";

// The app's Tax Forms landing: one card per tax-form generator, in the same
// card style as the paystub template grid. Tapping a card opens the full
// generator embedded in the app shell (see AppEmbeddedForm below).
const TAX_FORMS = [
  {
    key: "w2", name: "W-2", color: "#7c3aed", icon: FileSpreadsheet,
    title: "W-2 Wage & Tax Statement",
    desc: "The annual wage and tax statement employers issue to employees — every box calculated for you.",
    path: "/app/tax-forms/w2",
  },
  {
    key: "w9", name: "W-9", color: "#0891b2", icon: ClipboardList,
    title: "W-9 Taxpayer Identification",
    desc: "Request for taxpayer identification and certification, used by contractors and vendors.",
    path: "/app/tax-forms/w9",
  },
  {
    key: "1099-nec", name: "1099-NEC", color: "#d97706", icon: Receipt,
    title: "1099-NEC Nonemployee Compensation",
    desc: "Report payments to independent contractors and freelancers.",
    path: "/app/tax-forms/1099-nec",
  },
  {
    key: "1099-misc", name: "1099-MISC", color: "#ea580c", icon: Receipt,
    title: "1099-MISC Miscellaneous Income",
    desc: "Report rents, royalties, prizes, and other miscellaneous income.",
    path: "/app/tax-forms/1099-misc",
  },
  {
    key: "schedule-c", name: "Schedule C", color: "#92400e", icon: FileBarChart,
    title: "Schedule C Profit or Loss",
    desc: "Profit or loss from business for sole proprietors, ready to file with Form 1040.",
    path: "/app/tax-forms/schedule-c",
  },
];

export default function AppTaxForms() {
  const navigate = useNavigate();
  return (
    <AppLayout fillHeight>
      <div style={{ padding: 10, height: "100%", boxSizing: "border-box" }}>
        <div style={{ background: "var(--ion-card-background)", borderRadius: 12, padding: "20px 20px 24px", height: "100%", overflowY: "auto", boxShadow: "0 2px 12px rgba(0,0,0,0.10)", boxSizing: "border-box" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
            {TAX_FORMS.map(form => {
              const Icon = form.icon;
              return (
                <div
                  key={form.key}
                  onClick={() => navigate(form.path)}
                  style={{ cursor: "pointer", borderRadius: 10, border: "1.5px solid var(--app-divider, rgba(0,0,0,0.12))", background: "var(--ion-card-background)", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.08)", transition: "box-shadow 0.2s, transform 0.15s", display: "flex", flexDirection: "column" }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.18)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)"; e.currentTarget.style.transform = "none"; }}
                >
                  {/* Tinted header with the form icon + name badge (template-card style) */}
                  <div style={{ position: "relative", height: 120, background: `${form.color}14`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ position: "absolute", top: 10, left: 10, background: form.color, color: "#fff", padding: "4px 12px", borderRadius: 999, fontSize: "0.72rem", fontWeight: 700, boxShadow: "0 2px 8px rgba(0,0,0,0.28)" }}>
                      {form.name}
                    </div>
                    <div style={{ width: 56, height: 56, borderRadius: 14, background: form.color, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 6px 18px rgba(0,0,0,0.22)" }}>
                      <Icon size={28} color="#ffffff" />
                    </div>
                  </div>
                  <div style={{ padding: "14px 16px 12px", flex: 1 }}>
                    <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--ion-text-color)", marginBottom: 6 }}>{form.title}</div>
                    <div style={{ fontSize: "0.8rem", color: "var(--ion-color-medium)", lineHeight: 1.5 }}>{form.desc}</div>
                  </div>
                  <div style={{ padding: "8px 16px 12px", textAlign: "center", borderTop: "1px solid var(--app-divider, rgba(0,0,0,0.06))", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                    <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--ion-color-primary)" }}>Create {form.name}</span>
                    <ArrowRight size={14} style={{ color: "var(--ion-color-primary)" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

// Wraps one of the full web tax-form generators inside the app shell —
// the form renders with `embedded` so its site Header/Footer stay hidden.
export function AppEmbeddedForm({ children }) {
  return (
    <AppLayout>
      <IonPage>
        <IonContent>
          {children}
        </IonContent>
      </IonPage>
    </AppLayout>
  );
}

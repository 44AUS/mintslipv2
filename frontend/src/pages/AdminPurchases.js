import { useState, useEffect, useCallback } from "react";
import {
  IonSegment, IonSegmentButton, IonLabel, IonIcon, IonButton, IonSpinner,
} from "@ionic/react";
import {
  refreshOutline, downloadOutline, chevronForwardOutline,
  funnelOutline, ellipse, squareOutline,
} from "ionicons/icons";
import { CreditCard, Trash2 } from "lucide-react";
import AdminLayout from "@/components/AdminLayout";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";

const DOCUMENT_TYPES = {
  "paystub":              "Pay Stub",
  "canadian-paystub":    "Canadian Pay Stub",
  "resume":              "AI Resume",
  "w2":                  "W-2 Form",
  "w9":                  "W-9 Form",
  "1099-nec":            "1099-NEC",
  "1099-misc":           "1099-MISC",
  "bank-statement":      "Bank Statement",
  "offer-letter":        "Offer Letter",
  "vehicle-bill-of-sale":"Vehicle Bill of Sale",
  "schedule-c":          "Schedule C",
  "utility-bill":        "Utility Bill",
};

const DOC_COLORS = {
  "paystub":              "#16a34a",
  "canadian-paystub":    "#16a34a",
  "resume":              "#2563eb",
  "w2":                  "#7c3aed",
  "w9":                  "#7c3aed",
  "1099-nec":            "#d97706",
  "1099-misc":           "#d97706",
  "bank-statement":      "#0891b2",
  "offer-letter":        "#059669",
  "vehicle-bill-of-sale":"#dc2626",
  "schedule-c":          "#92400e",
  "utility-bill":        "#64748b",
};

const TEMPLATE_NAMES = {
  "template-a": "Gusto", "template-b": "ADP", "template-c": "Workday",
  "template-h": "OnPay", "chime": "Chime", "bank-of-america": "Bank of America",
  "chase": "Chase", "standard": "Standard", "detailed": "Detailed",
  "modern": "Modern", "classic": "Classic", "minimal": "Minimal",
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "1 day ago";
  if (days < 30)  return `${days} days ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

function formatDate(dateStr) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getInitials(email) {
  if (!email) return "?";
  const parts = email.split("@")[0].split(/[._-]/);
  return parts.length >= 2
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : email[0].toUpperCase();
}

const tdBase = {
  padding: "0 12px",
  fontSize: "0.875rem",
  color: "var(--ion-text-color)",
  borderBottom: "1px solid var(--ion-border-color)",
  height: 64,
  verticalAlign: "middle",
  position: "relative",
  overflow: "hidden",
};

const segBtnStyle = {
  "--color":          "var(--ion-color-medium)",
  "--color-checked":  "var(--ion-text-color)",
  "--indicator-color":"var(--ion-text-color)",
  "--border-radius":  "0",
  "--padding-top":    "0",
  "--padding-bottom": "0",
  minHeight: 46,
  flexShrink: 0,
};

const TABS = [
  { value: "all",        label: "ALL" },
  { value: "registered", label: "REGISTERED" },
  { value: "guest",      label: "GUEST" },
  { value: "refunded",   label: "REFUNDED" },
];

export default function AdminPurchases() {
  const [purchases, setPurchases] = useState([]);
  const [total, setTotal]         = useState(0);
  const [loading, setLoading]     = useState(true);
  const [segment, setSegment]     = useState("all");

  const fetchPurchases = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`${BACKEND_URL}/api/admin/purchases?skip=0&limit=500`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setPurchases(data.purchases || []);
        setTotal(data.total || 0);
      }
    } catch (_) {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchPurchases(); }, [fetchPurchases]);

  const filtered = purchases.filter(p => {
    if (segment === "refunded")   return p.refunded;
    if (segment === "registered") return !!p.userId;
    if (segment === "guest")      return !p.userId;
    return true;
  });

  const counts = {
    all:        purchases.length,
    registered: purchases.filter(p => !!p.userId).length,
    guest:      purchases.filter(p => !p.userId).length,
    refunded:   purchases.filter(p => p.refunded).length,
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Delete this purchase?")) return;
    const token = localStorage.getItem("adminToken");
    await fetch(`${BACKEND_URL}/api/admin/purchases/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    setPurchases(prev => prev.filter(p => p.id !== id));
  };

  const exportCSV = () => {
    const rows = [
      ["Date","Email","Document","Template","Amount","Status","Discount","IP"],
      ...filtered.map(p => [
        new Date(p.createdAt).toISOString(),
        p.email || p.paypalEmail || "",
        DOCUMENT_TYPES[p.documentType] || p.documentType || "",
        TEMPLATE_NAMES[p.template] || p.template || "",
        p.amount || 0,
        p.userId ? "Registered" : "Guest",
        p.discountCode || "",
        p.ipAddress || "",
      ]),
    ];
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "purchases.csv";
    a.click();
  };

  return (
    <AdminLayout fillHeight>
      <div style={{ padding: 10, height: "100%", boxSizing: "border-box", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: "4px 6px" }}>
          <div style={{ display: "flex", flexDirection: "column", flex: "1 1 0%", overflow: "hidden", background: "var(--ion-card-background)", borderRadius: 6, boxShadow: "0 4px 24px rgba(0,0,0,0.18)" }}>

            {/* ── Card header ── */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 24px", flexShrink: 0 }}>
              <div>
                <h2 style={{ margin: "0 0 2px", fontWeight: 700, fontSize: "1.1rem", color: "var(--ion-text-color)", letterSpacing: "-0.01em" }}>
                  Purchases
                </h2>
                <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--ion-color-medium)" }}>
                  {total} total purchases
                </p>
              </div>
              <div style={{ display: "flex", gap: 4 }}>
                <IonButton fill="solid" size="small" style={{ "--background": "var(--ion-background-color)", "--color": "var(--ion-text-color)" }}>
                  <span slot="start" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", lineHeight: 0, flexShrink: 0, fontSize: "1rem", marginInlineEnd: 6 }}>
                    <IonIcon icon={funnelOutline} style={{ fontSize: "inherit", color: "inherit", pointerEvents: "none" }} />
                  </span>
                  Filter
                </IonButton>
                <IonButton fill="solid" size="small" onClick={exportCSV} style={{ "--background": "var(--ion-background-color)", "--color": "var(--ion-text-color)" }}>
                  <span slot="start" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", lineHeight: 0, flexShrink: 0, fontSize: "1rem", marginInlineEnd: 6 }}>
                    <IonIcon icon={downloadOutline} style={{ fontSize: "inherit", color: "inherit", pointerEvents: "none" }} />
                  </span>
                  Export
                </IonButton>
              </div>
            </div>

            {/* ── Segment row ── */}
            <div style={{ display: "flex", alignItems: "stretch", background: "var(--ion-card-background)", borderBottom: "1px solid var(--ion-border-color)", flexShrink: 0 }}>
              <IonSegment
                scrollable
                value={segment}
                onIonChange={e => setSegment(e.detail.value)}
                style={{ "--background": "transparent", flex: "1 1 0%" }}
              >
                {TABS.map(tab => (
                  <IonSegmentButton key={tab.value} value={tab.value} layout="label-only" style={segBtnStyle}>
                    <IonLabel style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700, letterSpacing: "0.08em", whiteSpace: "nowrap" }}>
                      {tab.label}
                      <span style={{ background: "var(--ion-background-color)", borderRadius: 4, padding: "1px 5px", fontSize: "0.65rem", fontWeight: 700, color: "var(--ion-color-medium)" }}>
                        {counts[tab.value]}
                      </span>
                    </IonLabel>
                  </IonSegmentButton>
                ))}
              </IonSegment>
              <div style={{ display: "flex", alignItems: "center", paddingRight: 12, flexShrink: 0 }}>
                <IonButton title="Refresh" fill="clear" shape="round" color="medium" onClick={fetchPurchases}>
                  <span slot="icon-only" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", lineHeight: 0, flexShrink: 0, fontSize: "1rem" }}>
                    <IonIcon icon={refreshOutline} style={{ fontSize: "inherit", color: "inherit", pointerEvents: "none" }} />
                  </span>
                </IonButton>
              </div>
            </div>

            {/* ── Table ── */}
            <div style={{ flex: "1 1 0%", overflow: "auto" }}>
              {loading ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
                  <IonSpinner name="crescent" />
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 860 }}>
                    <thead>
                      <tr>
                        {[
                          ["Age",      80],
                          ["Customer", 160],
                          ["Document", 180],
                          ["Date",     80],
                          ["Amount",   90],
                          ["Template", 100],
                          ["Status",   90],
                          ["Discount", 80],
                          ["IP",       120],
                          ["",         60],
                        ].map(([h, w]) => (
                          <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontSize: "0.72rem", fontWeight: 400, color: "var(--ion-color-medium)", background: "var(--ion-background-color)", whiteSpace: "nowrap", ...(w ? { width: w, minWidth: w } : {}) }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.length === 0 && (
                        <tr>
                          <td colSpan={10} style={{ textAlign: "center", padding: "48px 12px", color: "var(--ion-color-medium)", fontSize: "0.875rem" }}>
                            No purchases found
                          </td>
                        </tr>
                      )}
                      {filtered.map(p => {
                        const color   = DOC_COLORS[p.documentType] || "#64748b";
                        const email   = p.email || p.paypalEmail || "N/A";
                        const docLabel = DOCUMENT_TYPES[p.documentType] || p.documentType || "-";
                        const qty     = p.quantity > 1 ? ` ×${p.quantity}` : "";
                        return (
                          <tr key={p.id} style={{ cursor: "pointer", height: 64 }}>

                            {/* Age */}
                            <td className="ion-activatable" style={tdBase}>
                              <ion-ripple-effect />
                              <span style={{ fontSize: "0.75rem", color: "var(--ion-color-medium)", whiteSpace: "nowrap" }}>
                                {timeAgo(p.createdAt)}
                              </span>
                            </td>

                            {/* Customer */}
                            <td className="ion-activatable" style={{ ...tdBase, minWidth: 160 }}>
                              <ion-ripple-effect />
                              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <div style={{ width: 26, height: 26, borderRadius: "50%", background: "var(--ion-color-primary)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                  <span style={{ fontSize: "0.58rem", color: "#fff", fontWeight: 700 }}>{getInitials(email)}</span>
                                </div>
                                <div style={{ minWidth: 0 }}>
                                  <span style={{ fontSize: "0.75rem", display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 130 }}>{email}</span>
                                </div>
                              </div>
                            </td>

                            {/* Document — Lane style */}
                            <td className="ion-activatable" style={{ ...tdBase, padding: 0, minWidth: 180 }}>
                              <ion-ripple-effect />
                              <div style={{ position: "absolute", left: 0, top: "18%", bottom: "18%", width: 3, background: color }} />
                              <div style={{ paddingLeft: 16, display: "flex", alignItems: "stretch", gap: 8, height: "100%" }}>
                                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 2, paddingBottom: 2, justifyContent: "center" }}>
                                  <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", lineHeight: 0, flexShrink: 0, fontSize: 8, color }}>
                                    <IonIcon icon={ellipse} style={{ fontSize: "inherit", color: "inherit", pointerEvents: "none" }} />
                                  </span>
                                  <div style={{ width: 1.5, flex: "1 1 0%", background: "var(--ion-border-color)", margin: "2px 0", maxHeight: 14 }} />
                                  <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", lineHeight: 0, flexShrink: 0, fontSize: 8, color: "var(--ion-color-medium)" }}>
                                    <IonIcon icon={squareOutline} style={{ fontSize: "inherit", color: "inherit", pointerEvents: "none" }} />
                                  </span>
                                </div>
                                <div style={{ minWidth: 0, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                                  <span style={{ fontSize: "0.78rem", display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", lineHeight: 1.6 }}>
                                    {docLabel}{qty}
                                  </span>
                                  <span style={{ fontSize: "0.7rem", color: "var(--ion-color-medium)", display: "block", whiteSpace: "nowrap", lineHeight: 1.6 }}>
                                    {p.userId ? "Registered" : "Guest"}
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* Date */}
                            <td className="ion-activatable" style={tdBase}>
                              <ion-ripple-effect />
                              <span style={{ fontSize: "0.75rem", whiteSpace: "nowrap" }}>{formatDate(p.createdAt)}</span>
                            </td>

                            {/* Amount */}
                            <td className="ion-activatable" style={{ ...tdBase, minWidth: 90 }}>
                              <ion-ripple-effect />
                              <span style={{ fontSize: "0.875rem", fontWeight: 700, display: "block", whiteSpace: "nowrap", color: p.refunded ? "var(--ion-color-warning)" : "var(--ion-color-success)" }}>
                                ${Number(p.amount || 0).toFixed(2)}
                              </span>
                              {p.refunded && (
                                <span style={{ fontSize: "0.65rem", color: "var(--ion-color-warning)", display: "block" }}>
                                  refunded
                                </span>
                              )}
                            </td>

                            {/* Template */}
                            <td className="ion-activatable" style={{ ...tdBase, minWidth: 100 }}>
                              <ion-ripple-effect />
                              <span style={{ fontSize: "0.75rem", display: "block", whiteSpace: "nowrap" }}>
                                {TEMPLATE_NAMES[p.template] || p.template || "-"}
                              </span>
                            </td>

                            {/* Status */}
                            <td className="ion-activatable" style={{ ...tdBase, minWidth: 90 }}>
                              <ion-ripple-effect />
                              <span style={{ fontSize: "0.75rem", display: "block", whiteSpace: "nowrap" }}>
                                {p.userId ? "Registered" : "Guest"}
                              </span>
                              {p.refunded && (
                                <span style={{ fontSize: "0.6rem", color: "var(--ion-color-warning)", display: "block" }}>Refunded</span>
                              )}
                            </td>

                            {/* Discount */}
                            <td className="ion-activatable" style={{ ...tdBase, minWidth: 80 }}>
                              <ion-ripple-effect />
                              <span style={{ fontSize: "0.75rem", color: p.discountCode ? "var(--ion-color-primary)" : "var(--ion-color-medium)" }}>
                                {p.discountCode || "-"}
                              </span>
                            </td>

                            {/* IP */}
                            <td className="ion-activatable" style={{ ...tdBase, minWidth: 120 }}>
                              <ion-ripple-effect />
                              <span style={{ fontSize: "0.72rem", fontFamily: "monospace", color: "var(--ion-color-medium)", whiteSpace: "nowrap" }}>
                                {p.ipAddress || "-"}
                              </span>
                            </td>

                            {/* Actions */}
                            <td className="ion-activatable" style={{ ...tdBase, padding: "0 6px 0 0", width: 60 }}>
                              <ion-ripple-effect />
                              <div style={{ display: "flex", alignItems: "center" }}>
                                <button
                                  title="Refund"
                                  onClick={e => e.stopPropagation()}
                                  disabled={p.refunded || !p.stripePaymentIntentId}
                                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ion-color-primary)", padding: 4, display: "flex", borderRadius: 4, opacity: (p.refunded || !p.stripePaymentIntentId) ? 0.35 : 1 }}
                                >
                                  <CreditCard size={14} />
                                </button>
                                <button
                                  title="Delete"
                                  onClick={e => handleDelete(p.id, e)}
                                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ion-color-danger)", padding: 4, display: "flex", borderRadius: 4 }}
                                >
                                  <Trash2 size={14} />
                                </button>
                                <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", lineHeight: 0, flexShrink: 0, fontSize: 18, color: "var(--ion-color-medium)" }}>
                                  <IonIcon icon={chevronForwardOutline} style={{ fontSize: "inherit", color: "inherit", pointerEvents: "none" }} />
                                </span>
                              </div>
                            </td>

                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

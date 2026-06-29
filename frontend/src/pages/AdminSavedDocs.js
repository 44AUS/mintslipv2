import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { IonSegment, IonSegmentButton, IonLabel, IonIcon, IonButton, IonSpinner } from "@ionic/react";
import { refreshOutline, chevronForwardOutline } from "ionicons/icons";
import { Eye, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import AdminLayout from "@/components/AdminLayout";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";

const DOCUMENT_TYPES = {
  "paystub":               "Pay Stub",
  "canadian-paystub":      "Canadian Pay Stub",
  "resume":                "AI Resume",
  "w2":                    "W-2 Form",
  "w9":                    "W-9 Form",
  "1099-nec":              "1099-NEC",
  "1099-misc":             "1099-MISC",
  "bank-statement":        "Bank Statement",
  "offer-letter":          "Offer Letter",
  "vehicle-bill-of-sale":  "Vehicle Bill of Sale",
  "schedule-c":            "Schedule C",
  "utility-bill":          "Utility Bill",
};

const DOC_COLORS = {
  "paystub":               "#16a34a",
  "canadian-paystub":      "#16a34a",
  "resume":                "#2563eb",
  "w2":                    "#7c3aed",
  "w9":                    "#7c3aed",
  "1099-nec":              "#d97706",
  "1099-misc":             "#d97706",
  "bank-statement":        "#0891b2",
  "offer-letter":          "#059669",
  "vehicle-bill-of-sale":  "#dc2626",
  "schedule-c":            "#92400e",
  "utility-bill":          "#64748b",
};

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
  "--color":           "var(--ion-color-medium)",
  "--color-checked":   "var(--ion-text-color)",
  "--indicator-color": "var(--ion-text-color)",
  "--border-radius":   "0",
  "--padding-top":     "0",
  "--padding-bottom":  "0",
  minHeight: 46,
  flexShrink: 0,
};

const TABS = [
  { value: "all",                  label: "ALL" },
  { value: "paystub",              label: "PAY STUBS" },
  { value: "bank-statement",       label: "BANK STMTS" },
  { value: "resume",               label: "RESUMES" },
  { value: "w2",                   label: "W-2 / W-9" },
];

function getInitials(email) {
  if (!email) return "?";
  const parts = email.split("@")[0].split(/[._-]/);
  return parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : email[0].toUpperCase();
}

export default function AdminSavedDocs() {
  const navigate = useNavigate();

  const [docs, setDocs]       = useState([]);
  const [total, setTotal]     = useState(0);
  const [loading, setLoading] = useState(true);
  const [segment, setSegment] = useState("all");

  const fetchDocs = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("adminToken");
      const PAGE = 500;
      const all = [];
      let skip = 0;
      let totalCount = 0;
      // Page through every saved document (the admin list excludes file
      // content, so records are lightweight) so nothing is capped at 500.
      while (true) {
        const params = new URLSearchParams({ skip: String(skip), limit: String(PAGE) });
        const res = await fetch(`${BACKEND_URL}/api/admin/saved-documents?${params}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) break;
        const data = await res.json();
        const batch = data.documents || [];
        all.push(...batch);
        totalCount = data.total || all.length;
        skip += PAGE;
        if (batch.length < PAGE || all.length >= totalCount) break;
      }
      setDocs(all);
      setTotal(totalCount);
    } catch (_) {}
    setLoading(false);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) { navigate("/admin/login"); return; }
    fetchDocs();
  }, [fetchDocs]);

  const filtered = docs.filter(d => {
    if (segment === "all") return true;
    if (segment === "w2")  return d.documentType === "w2" || d.documentType === "w9";
    return d.documentType === segment;
  });

  const counts = {
    all:             docs.length,
    paystub:         docs.filter(d => d.documentType === "paystub" || d.documentType === "canadian-paystub").length,
    "bank-statement": docs.filter(d => d.documentType === "bank-statement").length,
    resume:          docs.filter(d => d.documentType === "resume").length,
    w2:              docs.filter(d => d.documentType === "w2" || d.documentType === "w9").length,
  };

  const deleteDoc = async (docId, e) => {
    e.stopPropagation();
    if (!window.confirm("Delete this saved document? This cannot be undone.")) return;
    const token = localStorage.getItem("adminToken");
    const res = await fetch(`${BACKEND_URL}/api/admin/saved-documents/${docId}`, {
      method: "DELETE", headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) { toast.success("Document deleted"); setDocs(prev => prev.filter(d => d.id !== docId)); }
    else toast.error("Failed to delete document");
  };

  const viewDoc = async (doc) => {
    const token = localStorage.getItem("adminToken");
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/saved-documents/${doc.id}/download`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.detail || `HTTP ${res.status}`); }
      window.open(URL.createObjectURL(await res.blob()), "_blank");
    } catch (err) {
      toast.error(`Failed to open: ${err.message}`);
    }
  };

  return (
    <AdminLayout fillHeight>
      <div style={{ padding: 10, height: "100%", boxSizing: "border-box", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: "4px 6px" }}>
          <div style={{ display: "flex", flexDirection: "column", flex: "1 1 0%", overflow: "hidden", background: "var(--ion-card-background)", borderRadius: 6, boxShadow: "0 4px 24px rgba(0,0,0,0.18)" }}>

            {/* ── Card header ── */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 24px", flexShrink: 0 }}>
              <div>
                <h2 style={{ margin: "0 0 2px", fontWeight: 700, fontSize: "1.1rem", color: "var(--ion-text-color)", letterSpacing: "-0.01em" }}>Saved Documents</h2>
                <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--ion-color-medium)" }}>{total} total saved documents</p>
              </div>
            </div>

            {/* ── Segment row ── */}
            <div style={{ display: "flex", alignItems: "stretch", background: "var(--ion-card-background)", borderBottom: "1px solid var(--ion-border-color)", flexShrink: 0 }}>
              <IonSegment scrollable value={segment} onIonChange={e => setSegment(e.detail.value)} style={{ "--background": "transparent", flex: "1 1 0%" }}>
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
                <IonButton title="Refresh" fill="clear" shape="round" color="medium" onClick={fetchDocs}>
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
                  <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 720 }}>
                    <thead>
                      <tr>
                        {[["User", 200], ["Document", 200], ["File", 220], ["Size", 80], ["Created", 110], ["", 60]].map(([h, w]) => (
                          <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontSize: "0.72rem", fontWeight: 400, color: "var(--ion-color-medium)", background: "var(--ion-background-color)", whiteSpace: "nowrap", ...(w ? { width: w, minWidth: w } : {}) }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.length === 0 && (
                        <tr><td colSpan={6} style={{ textAlign: "center", padding: "48px 12px", color: "var(--ion-color-medium)", fontSize: "0.875rem" }}>No saved documents found</td></tr>
                      )}
                      {filtered.map(doc => {
                        const label = DOCUMENT_TYPES[doc.documentType] || doc.documentType || "—";
                        return (
                          <tr key={doc.id} style={{ height: 64 }}>

                            {/* User */}
                            <td className="ion-activatable" style={{ ...tdBase, minWidth: 200 }}>
                              <ion-ripple-effect />
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--ion-color-primary)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                  <span style={{ fontSize: "0.6rem", color: "#fff", fontWeight: 700 }}>{getInitials(doc.userEmail)}</span>
                                </div>
                                <div style={{ minWidth: 0 }}>
                                  <span style={{ fontSize: "0.78rem", fontWeight: 600, display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 160 }}>{doc.userEmail || "—"}</span>
                                  {doc.userName && <span style={{ fontSize: "0.7rem", color: "var(--ion-color-medium)", display: "block" }}>{doc.userName}</span>}
                                </div>
                              </div>
                            </td>

                            {/* Document */}
                            <td className="ion-activatable" style={{ ...tdBase, minWidth: 200 }}>
                              <ion-ripple-effect />
                              <span style={{ fontSize: "0.78rem", display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{label}</span>
                            </td>

                            {/* File */}
                            <td className="ion-activatable" style={{ ...tdBase, minWidth: 220 }}>
                              <ion-ripple-effect />
                              {doc.fileExists === false ? (
                                <span style={{ color: "#ef4444", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: 4 }}>
                                  <X size={12} style={{ flexShrink: 0 }} />
                                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 180 }}>{doc.fileName}</span>
                                  <span style={{ fontSize: "0.72rem", color: "#f87171", flexShrink: 0 }}>(missing)</span>
                                </span>
                              ) : (
                                <button
                                  onClick={() => viewDoc(doc)}
                                  style={{ color: "#3b82f6", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: 4, cursor: "pointer", background: "none", border: "none", padding: 0, maxWidth: "100%", overflow: "hidden" }}
                                >
                                  <Eye size={12} style={{ flexShrink: 0 }} />
                                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc.fileName}</span>
                                </button>
                              )}
                            </td>

                            {/* Size */}
                            <td className="ion-activatable" style={{ ...tdBase, minWidth: 80 }}>
                              <ion-ripple-effect />
                              <span style={{ fontSize: "0.75rem", color: "var(--ion-color-medium)" }}>
                                {doc.fileSize ? `${(doc.fileSize / 1024).toFixed(1)} KB` : "—"}
                              </span>
                            </td>

                            {/* Created */}
                            <td className="ion-activatable" style={{ ...tdBase, minWidth: 110 }}>
                              <ion-ripple-effect />
                              <span style={{ fontSize: "0.75rem", whiteSpace: "nowrap" }}>
                                {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"}
                              </span>
                            </td>

                            {/* Actions */}
                            <td className="ion-activatable" style={{ ...tdBase, padding: "0 8px", width: 60 }}>
                              <ion-ripple-effect />
                              <button
                                className="admin-action-btn danger"
                                onClick={e => deleteDoc(doc.id, e)}
                              >
                                <Trash2 size={14} />
                              </button>
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

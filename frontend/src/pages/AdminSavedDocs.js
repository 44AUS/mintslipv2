import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { IonSegment, IonSegmentButton, IonLabel, IonIcon, IonButton, IonList, IonRippleEffect, IonSpinner } from "@ionic/react";
import {
  refreshOutline, chevronForwardOutline, appsOutline,
  documentTextOutline, leafOutline, calculatorOutline, scaleOutline, briefcaseOutline, readerOutline,
} from "ionicons/icons";
import { Eye, Trash2, X } from "lucide-react";
import { toast } from "@/utils/toast";
import { confirmAlert } from "@/utils/confirmAlert";
import AdminLayout from "@/components/AdminLayout";
import AdminDetailModal from "@/components/AdminDetailModal";
import AdminListItem from "@/components/AdminListItem";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";

const DOCUMENT_TYPES = {
  "paystub":               "Pay Stub",
  "canadian-paystub":      "Canadian Pay Stub",
  "resume":                "AI Resume",
  "w2":                    "W-2 Form",
  "w9":                    "W-9 Form",
  "1099-nec":              "1099-NEC",
  "1099-misc":             "1099-MISC",
  "bank-statement":        "Accounting Mockup",
  "offer-letter":          "Offer Letter",
  "cease-and-desist":      "Cease and Desist",
  "power-of-attorney":     "Power of Attorney",
  "commercial-lease":      "Commercial Lease",
  "vehicle-bill-of-sale":  "Vehicle Bill of Sale",
  "schedule-c":            "Schedule C",
  "utility-bill":          "Utility Bill",
};

const DOC_COLORS = {
  "paystub":               "#059669",
  "canadian-paystub":      "#059669",
  "resume":                "#2563eb",
  "w2":                    "#7c3aed",
  "w9":                    "#7c3aed",
  "1099-nec":              "#d97706",
  "1099-misc":             "#d97706",
  "bank-statement":        "#0891b2",
  "offer-letter":          "#059669",
  "cease-and-desist":      "#b91c1c",
  "power-of-attorney":     "#7c3aed",
  "commercial-lease":      "#0891b2",
  "vehicle-bill-of-sale":  "#dc2626",
  "schedule-c":            "#92400e",
  "utility-bill":          "#64748b",
};

// Cells stay unpositioned so the row-wide ripple overlay (inside the first
// cell) resolves its 100% width/height against the position:relative <tr>.
const tdBase = {
  padding: "0 12px",
  fontSize: "0.875rem",
  color: "var(--ion-text-color)",
  borderBottom: "1px solid var(--ion-border-color)",
  height: 64,
  verticalAlign: "middle",
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

// Same document categories as the /app topbar, plus ALL.
const CATEGORY_TYPES = {
  "paystub":          ["paystub"],
  "canadian-paystub": ["canadian-paystub"],
  "tax-forms":        ["w2", "w9", "1099-nec", "1099-misc", "schedule-c"],
  "legal-forms":      ["cease-and-desist", "power-of-attorney", "vehicle-bill-of-sale", "legal-document"],
  "business-forms":   ["bank-statement", "utility-bill", "commercial-lease", "offer-letter"],
  "resumes":          ["resume", "ai-resume"],
};

const TABS = [
  { value: "all",              label: "ALL",            icon: appsOutline },
  { value: "paystub",          label: "PAY STUBS",      icon: documentTextOutline },
  { value: "canadian-paystub", label: "CANADIAN STUBS", icon: leafOutline },
  { value: "tax-forms",        label: "TAX FORMS",      icon: calculatorOutline },
  { value: "legal-forms",      label: "LEGAL FORMS",    icon: scaleOutline },
  { value: "business-forms",   label: "BUSINESS FORMS", icon: briefcaseOutline },
  { value: "resumes",          label: "RESUMES",        icon: readerOutline },
];

function getInitials(email) {
  if (!email) return "?";
  const parts = email.split("@")[0].split(/[._-]/);
  return parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : email[0].toUpperCase();
}

// "Expires in 2d" — from the server's expiresAt (retention-configurable);
// docs saved before the backend sent expiresAt fall back to the default
// 60-day window. null expiresAt = retention disabled (kept permanently).
function expiryLabel(doc) {
  let exp = null;
  if (doc.expiresAt) exp = new Date(doc.expiresAt);
  else if (doc.expiresAt === undefined && doc.createdAt) exp = new Date(new Date(doc.createdAt).getTime() + 60 * 86400000);
  if (!exp || isNaN(exp.getTime())) return null;
  const days = Math.ceil((exp.getTime() - Date.now()) / 86400000);
  if (days <= 0) return "Expires today";
  return `Expires in ${days}d`;
}

export default function AdminSavedDocs() {
  const navigate = useNavigate();

  const [docs, setDocs]       = useState([]);
  const [total, setTotal]     = useState(0);
  const [loading, setLoading] = useState(true);
  const [segment, setSegment] = useState("all");
  const [detail, setDetail]   = useState(null);
  const [resending, setResending] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

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
    const types = CATEGORY_TYPES[segment] || [segment];
    return types.includes(d.documentType);
  });

  const counts = Object.fromEntries([
    ["all", docs.length],
    ...Object.entries(CATEGORY_TYPES).map(([cat, types]) => [cat, docs.filter(d => types.includes(d.documentType)).length]),
  ]);

  const deleteDoc = async (docId, e) => {
    e?.stopPropagation();
    if (!(await confirmAlert({ header: "Delete this saved document?", message: "This cannot be undone." }))) return false;
    const token = localStorage.getItem("adminToken");
    const res = await fetch(`${BACKEND_URL}/api/admin/saved-documents/${docId}`, {
      method: "DELETE", headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) { toast.success("Document deleted"); setDocs(prev => prev.filter(d => d.id !== docId)); return true; }
    toast.error("Failed to delete document");
    return false;
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

  // Email the file to its owner again — for "I never got my download".
  const resendDoc = async (doc) => {
    const email = doc.userEmail && doc.userEmail.includes("@") ? doc.userEmail : null;
    if (!window.confirm(`Email ${doc.fileName || "this file"} to ${email || "the customer on file"}?`)) return;
    setResending(true);
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`${BACKEND_URL}/api/admin/saved-documents/resend`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ docIds: [doc.id], ...(email ? { email } : {}) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || "Resend failed");
      toast.success(`File sent to ${data.to}`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setResending(false);
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
                      <IonIcon icon={tab.icon} style={{ fontSize: 15, flexShrink: 0 }} />
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
              ) : isMobile ? (
                /* Condensed whodat-style rows: readable without sideways
                   scrolling, native per-row taps (no tr-anchored overlay,
                   which iOS Safari mis-positions). Actions live in the modal. */
                filtered.length === 0 ? (
                  <div className="adm-empty">No saved documents found</div>
                ) : (
                  <IonList lines="full" style={{ background: "transparent", padding: 0 }}>
                    {filtered.map(doc => {
                      const label = DOCUMENT_TYPES[doc.documentType] || doc.documentType || "—";
                      const size = doc.fileSize ? `${(doc.fileSize / 1024).toFixed(1)} KB` : null;
                      const date = doc.createdAt ? new Date(doc.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : null;
                      return (
                        <AdminListItem
                          key={doc.id}
                          onClick={() => setDetail(doc)}
                          start={
                            <div style={{ width: 34, height: 34, borderRadius: "50%", background: DOC_COLORS[doc.documentType] || "var(--ion-color-primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <span style={{ fontSize: "0.65rem", color: "#fff", fontWeight: 700 }}>{getInitials(doc.userEmail)}</span>
                            </div>
                          }
                          title={label}
                          badges={doc.fileExists === false && <span className="admin-badge admin-badge-red">Missing</span>}
                          subtitle={doc.userEmail || "—"}
                          meta={[doc.fileName, size, date, expiryLabel(doc)].filter(Boolean).join(" · ")}
                        />
                      );
                    })}
                  </IonList>
                )
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
                          <tr key={doc.id} style={{ position: "relative", height: 64, transform: "translateZ(0)" }}>

                            {/* User — also hosts the row-wide click/ripple overlay,
                                which spans the whole row because the <tr> is its
                                containing block */}
                            <td style={{ ...tdBase, minWidth: 200 }}>
                              <div
                                className="ion-activatable"
                                onClick={() => setDetail(doc)}
                                style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "100%", overflow: "hidden", cursor: "pointer", zIndex: 1 }}
                              >
                                <ion-ripple-effect />
                              </div>
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
                            <td style={{ ...tdBase, minWidth: 200 }}>
                              <span style={{ fontSize: "0.78rem", display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{label}</span>
                            </td>

                            {/* File — raised above the row overlay so the view
                                link opens the PDF instead of the modal */}
                            <td style={{ ...tdBase, minWidth: 220, position: "relative", zIndex: 2 }}>
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
                            <td style={{ ...tdBase, minWidth: 80 }}>
                              <span style={{ fontSize: "0.75rem", color: "var(--ion-color-medium)" }}>
                                {doc.fileSize ? `${(doc.fileSize / 1024).toFixed(1)} KB` : "—"}
                              </span>
                            </td>

                            {/* Created — date with the retention expiry underneath */}
                            <td style={{ ...tdBase, minWidth: 110 }}>
                              <span style={{ fontSize: "0.75rem", whiteSpace: "nowrap", display: "block" }}>
                                {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"}
                              </span>
                              {expiryLabel(doc) && (
                                <span style={{ fontSize: "0.68rem", whiteSpace: "nowrap", display: "block", marginTop: 2, color: /today|in [1-7]d/.test(expiryLabel(doc)) ? "var(--ion-color-warning)" : "var(--ion-color-medium)" }}>
                                  {expiryLabel(doc)}
                                </span>
                              )}
                            </td>

                            {/* Actions — raised above the row overlay */}
                            <td style={{ ...tdBase, padding: "0 8px", width: 60, position: "relative", zIndex: 2 }}>
                              <button
                                className="ion-activatable admin-action-btn danger"
                                onClick={e => deleteDoc(doc.id, e)}
                              >
                                <Trash2 size={14} /><IonRippleEffect />
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

      {/* ── Saved document detail modal (whodat admin style) ── */}
      <AdminDetailModal
        isOpen={!!detail}
        onClose={() => setDetail(null)}
        title={detail ? (detail.fileName || "Saved Document") : "Saved Document"}
        rows={detail ? [
          ["User", (
            <span>
              {detail.userEmail || "—"}
              {detail.userName ? <span style={{ color: "var(--ion-color-medium)" }}> · {detail.userName}</span> : null}
            </span>
          )],
          ["Document", (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: DOC_COLORS[detail.documentType] || "#64748b", display: "inline-block" }} />
              {DOCUMENT_TYPES[detail.documentType] || detail.documentType || "—"}
            </span>
          )],
          detail.template && ["Template", String(detail.template).startsWith("custom:") ? "Custom template" : detail.template],
          ["File", (
            <span style={{ fontFamily: "monospace", fontSize: "0.8rem" }}>
              {detail.fileName || "—"}
              {detail.fileExists === false && <span className="admin-badge admin-badge-red" style={{ marginLeft: 8 }}>Missing</span>}
            </span>
          )],
          ["Size", detail.fileSize ? `${(detail.fileSize / 1024).toFixed(1)} KB` : "—"],
          ["Saved", detail.createdAt ? new Date(detail.createdAt).toLocaleString() : "—"],
          ["Expires", expiryLabel(detail) || "Never (retention disabled)"],
        ] : []}
      >
        {detail && (
          <>
            <IonButton expand="block" color="primary" onClick={() => viewDoc(detail)} disabled={detail.fileExists === false}>
              {detail.fileExists === false ? "File Missing" : "View Document"}
            </IonButton>
            {detail.fileExists !== false && (
              <IonButton
                expand="block"
                fill="outline"
                color="primary"
                onClick={() => resendDoc(detail)}
                disabled={resending}
                title="Email this file to the user again"
              >
                {resending ? "Sending…" : "Resend File to User"}
              </IonButton>
            )}
            {detail.userEmail && (
              <IonButton expand="block" fill="outline" color="medium" href={`mailto:${detail.userEmail}`}>
                Email User
              </IonButton>
            )}
            <IonButton expand="block" fill="outline" color="danger" onClick={async () => {
              if (await deleteDoc(detail.id)) setDetail(null);
            }}>
              Delete Document
            </IonButton>
          </>
        )}
      </AdminDetailModal>
    </AdminLayout>
  );
}

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "@/components/AdminLayout";
import AdminDetailModal from "@/components/AdminDetailModal";
import AdminListItem from "@/components/AdminListItem";
import { IonButton, IonRippleEffect, IonSpinner, IonList } from "@ionic/react";
import { Plus, Pencil, Copy, Trash2, Upload, Undo2, LayoutTemplate } from "lucide-react";
import { toast } from "@/utils/toast";
import { STARTER_LAYOUTS } from "@/utils/layoutEngine";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";

const DOC_TYPE_LABELS = { paystub: "Pay Stub", "canadian-paystub": "Canadian Pay Stub", "offer-letter": "Offer Letter", "legal-document": "Legal Document", resume: "Resume", "bank-statement": "Accounting Mockup" };

export default function AdminTemplates() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);
  const [starterOpen, setStarterOpen] = useState(false);
  const [detail, setDetail] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem("adminToken")}` });

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/doc-templates`, { headers: authHeaders() });
      if (!res.ok) throw new Error("Failed to load templates");
      const data = await res.json();
      setTemplates(data.templates || []);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

  const createTemplate = async (starter) => {
    setStarterOpen(false);
    setBusy("create");
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/doc-templates`, {
        method: "POST",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ name: `New ${starter.name}`, description: starter.description || "", documentType: starter.documentType, layout: starter.layout }),
      });
      if (!res.ok) throw new Error("Failed to create template");
      const data = await res.json();
      navigate(`/admin/templates/edit/${data.template.id}`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(null);
    }
  };

  const StarterMenu = () => (
    <div style={{ position: "absolute", right: 0, top: "calc(100% + 6px)", zIndex: 50, minWidth: 230, background: "var(--ion-card-background)", borderRadius: 8, boxShadow: "0 8px 30px rgba(0,0,0,0.18)", border: "1px solid var(--ion-border-color)", padding: "6px 0" }}>
      <p style={{ margin: "4px 12px 6px", fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--admin-text-muted)" }}>Start from</p>
      {STARTER_LAYOUTS.map((s) => (
        <button key={s.key} onClick={() => createTemplate(s)}
          style={{ display: "block", width: "100%", textAlign: "left", padding: "8px 12px", border: "none", background: "transparent", color: "var(--admin-text)", fontSize: "0.85rem", cursor: "pointer" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--ion-color-step-50)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
          {s.name}
          <span style={{ display: "block", fontSize: "0.7rem", color: "var(--admin-text-muted)" }}>{DOC_TYPE_LABELS[s.documentType]}</span>
        </button>
      ))}
    </div>
  );

  const act = async (id, action, method = "POST") => {
    setBusy(id + action);
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/doc-templates/${id}${action}`, { method, headers: authHeaders() });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || "Action failed");
      fetchTemplates();
      return true;
    } catch (err) {
      toast.error(err.message);
      return false;
    } finally {
      setBusy(null);
    }
  };

  return (
    <AdminLayout>
      <div>
        <div className="flex items-center justify-between" style={{ marginBottom: 24, flexWrap: "wrap", gap: 10 }}>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Document Templates</h1>
            <p className="text-sm text-gray-500 mt-1">Design, edit, and publish custom document layouts</p>
          </div>
          <div style={{ position: "relative" }}>
            <IonButton color="primary" onClick={() => setStarterOpen((o) => !o)} disabled={busy === "create"}>
              <Plus size={16} style={{ marginRight: 6 }} />New Template
            </IonButton>
            {starterOpen && <StarterMenu />}
          </div>
        </div>

        <div className="table-card">
          {loading ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 0" }}>
              <IonSpinner name="crescent" color="primary" style={{ width: 32, height: 32 }} />
            </div>
          ) : templates.length === 0 ? (
            <div style={{ textAlign: "center", padding: "80px 24px" }}>
              <LayoutTemplate size={56} style={{ color: "#cbd5e1", margin: "0 auto 16px" }} />
              <h3 style={{ fontSize: "1.15rem", fontWeight: 600, color: "var(--admin-text)", marginBottom: 8 }}>No custom templates yet</h3>
              <p style={{ color: "var(--admin-text-muted)", marginBottom: 16, fontSize: "0.9rem" }}>
                Create your first template — it starts from a complete paystub layout you can freely rearrange.
              </p>
              <IonButton color="primary" onClick={() => createTemplate(STARTER_LAYOUTS[0])} disabled={busy === "create"}>
                <Plus size={16} style={{ marginRight: 6 }} />Create Template
              </IonButton>
            </div>
          ) : isMobile ? (
            /* Condensed whodat-style rows: readable without sideways
               scrolling; actions live in the detail modal. */
            <IonList lines="full" style={{ background: "transparent", padding: 0 }}>
              {templates.map((t) => (
                <AdminListItem
                  key={t.id}
                  onClick={() => setDetail(t)}
                  start={
                    <div style={{ width: 34, height: 34, borderRadius: 8, background: "var(--ion-color-step-100)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <LayoutTemplate size={16} style={{ color: "var(--ion-color-primary)" }} />
                    </div>
                  }
                  title={t.name}
                  badges={t.status === "published"
                    ? <span className="admin-badge admin-badge-green" style={{ marginLeft: 6 }}>Published</span>
                    : <span className="admin-badge admin-badge-amber" style={{ marginLeft: 6 }}>Draft</span>}
                  subtitle={DOC_TYPE_LABELS[t.documentType] || t.documentType}
                  meta={[t.version ? `v${t.version}` : null, t.updatedAt ? new Date(t.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : null].filter(Boolean).join(" · ")}
                />
              ))}
            </IonList>
          ) : (
            <div className="overflow-x-auto">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Template</th>
                    <th>Document</th>
                    <th>Status</th>
                    <th>Version</th>
                    <th>Updated</th>
                    <th style={{ width: 260 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {templates.map((t) => (
                    <tr key={t.id}>
                      <td>
                        <span style={{ fontWeight: 500, display: "block" }}>{t.name}</span>
                        {t.description && <span style={{ fontSize: "0.75rem", color: "var(--admin-text-muted)" }}>{t.description}</span>}
                      </td>
                      <td><span className="admin-badge admin-badge-slate">{DOC_TYPE_LABELS[t.documentType] || t.documentType}</span></td>
                      <td>
                        {t.status === "published"
                          ? <span className="admin-badge admin-badge-green">Published</span>
                          : <span className="admin-badge admin-badge-amber">Draft</span>}
                      </td>
                      <td style={{ color: "var(--admin-text-muted)" }}>{t.version ? `v${t.version}` : "—"}</td>
                      <td style={{ color: "var(--admin-text-muted)", fontSize: "0.8rem", whiteSpace: "nowrap" }}>
                        {t.updatedAt ? new Date(t.updatedAt).toLocaleString() : "—"}
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                          <button className="ion-activatable admin-action-btn primary" title="Edit" onClick={() => navigate(`/admin/templates/edit/${t.id}`)}>
                            <Pencil size={15} /><IonRippleEffect />
                          </button>
                          <button className="ion-activatable admin-action-btn" title="Duplicate" disabled={busy === t.id + "/duplicate"}
                            onClick={() => act(t.id, "/duplicate")}>
                            <Copy size={15} /><IonRippleEffect />
                          </button>
                          {t.status === "published" ? (
                            <button className="ion-activatable admin-action-btn warning" title="Unpublish" disabled={busy === t.id + "/unpublish"}
                              onClick={() => act(t.id, "/unpublish")}>
                              <Undo2 size={15} /><IonRippleEffect />
                            </button>
                          ) : (
                            <button className="ion-activatable admin-action-btn primary" title="Publish" disabled={busy === t.id + "/publish"}
                              onClick={async () => { if (await act(t.id, "/publish")) toast.success("Template published"); }}>
                              <Upload size={15} /><IonRippleEffect />
                            </button>
                          )}
                          <button className="ion-activatable admin-action-btn danger" title="Delete"
                            onClick={() => { if (window.confirm(`Delete "${t.name}"? This cannot be undone.`)) act(t.id, "", "DELETE"); }}>
                            <Trash2 size={15} /><IonRippleEffect />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── Template detail modal (mobile actions live here) ── */}
      <AdminDetailModal
        isOpen={!!detail}
        onClose={() => setDetail(null)}
        title={detail ? detail.name : "Template"}
        rows={detail ? [
          detail.description && ["Description", detail.description],
          ["Document", <span className="admin-badge admin-badge-slate">{DOC_TYPE_LABELS[detail.documentType] || detail.documentType}</span>],
          ["Status", detail.status === "published"
            ? <span className="admin-badge admin-badge-green">Published</span>
            : <span className="admin-badge admin-badge-amber">Draft</span>],
          ["Version", detail.version ? `v${detail.version}` : "—"],
          ["Updated", detail.updatedAt ? new Date(detail.updatedAt).toLocaleString() : "—"],
        ] : []}
      >
        {detail && (
          <>
            <IonButton expand="block" color="primary" onClick={() => navigate(`/admin/templates/edit/${detail.id}`)}>
              Edit Template
            </IonButton>
            {detail.status === "published" ? (
              <IonButton expand="block" fill="outline" color="warning" disabled={busy === detail.id + "/unpublish"}
                onClick={async () => { if (await act(detail.id, "/unpublish")) setDetail(null); }}>
                Unpublish
              </IonButton>
            ) : (
              <IonButton expand="block" fill="outline" color="primary" disabled={busy === detail.id + "/publish"}
                onClick={async () => { if (await act(detail.id, "/publish")) { toast.success("Template published"); setDetail(null); } }}>
                Publish
              </IonButton>
            )}
            <IonButton expand="block" fill="outline" color="medium" disabled={busy === detail.id + "/duplicate"}
              onClick={async () => { if (await act(detail.id, "/duplicate")) setDetail(null); }}>
              Duplicate
            </IonButton>
            <IonButton expand="block" fill="outline" color="danger"
              onClick={async () => {
                if (!window.confirm(`Delete "${detail.name}"? This cannot be undone.`)) return;
                if (await act(detail.id, "", "DELETE")) setDetail(null);
              }}>
              Delete Template
            </IonButton>
          </>
        )}
      </AdminDetailModal>
    </AdminLayout>
  );
}

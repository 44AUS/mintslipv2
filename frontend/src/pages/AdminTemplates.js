import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "@/components/AdminLayout";
import { IonButton, IonSpinner } from "@ionic/react";
import { Plus, Pencil, Copy, Trash2, Upload, Undo2, LayoutTemplate } from "lucide-react";
import { toast } from "sonner";
import { DEFAULT_PAYSTUB_LAYOUT } from "@/utils/layoutEngine";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";

const DOC_TYPE_LABELS = { paystub: "Pay Stub" };

export default function AdminTemplates() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);

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

  const createTemplate = async () => {
    setBusy("create");
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/doc-templates`, {
        method: "POST",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ name: "New Paystub Template", documentType: "paystub", layout: DEFAULT_PAYSTUB_LAYOUT }),
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
        <div className="flex items-center justify-between" style={{ marginBottom: 24 }}>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Document Templates</h1>
            <p className="text-sm text-gray-500 mt-1">Design, edit, and publish custom document layouts</p>
          </div>
          <IonButton color="primary" onClick={createTemplate} disabled={busy === "create"}>
            <Plus size={16} style={{ marginRight: 6 }} />New Template
          </IonButton>
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
              <IonButton color="primary" onClick={createTemplate} disabled={busy === "create"}>
                <Plus size={16} style={{ marginRight: 6 }} />Create Template
              </IonButton>
            </div>
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
                      <td style={{ fontWeight: 500 }}>{t.name}</td>
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
                          <button className="admin-action-btn primary" title="Edit" onClick={() => navigate(`/admin/templates/edit/${t.id}`)}>
                            <Pencil size={15} />
                          </button>
                          <button className="admin-action-btn" title="Duplicate" disabled={busy === t.id + "/duplicate"}
                            onClick={() => act(t.id, "/duplicate")}>
                            <Copy size={15} />
                          </button>
                          {t.status === "published" ? (
                            <button className="admin-action-btn warning" title="Unpublish" disabled={busy === t.id + "/unpublish"}
                              onClick={() => act(t.id, "/unpublish")}>
                              <Undo2 size={15} />
                            </button>
                          ) : (
                            <button className="admin-action-btn primary" title="Publish" disabled={busy === t.id + "/publish"}
                              onClick={async () => { if (await act(t.id, "/publish")) toast.success("Template published"); }}>
                              <Upload size={15} />
                            </button>
                          )}
                          <button className="admin-action-btn danger" title="Delete"
                            onClick={() => { if (window.confirm(`Delete "${t.name}"? This cannot be undone.`)) act(t.id, "", "DELETE"); }}>
                            <Trash2 size={15} />
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
    </AdminLayout>
  );
}

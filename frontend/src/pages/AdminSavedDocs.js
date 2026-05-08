import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { IonButton, IonSpinner } from "@ionic/react";
import { toast } from "sonner";
import { FolderArchive, RefreshCw, Eye, Trash2, ChevronLeft, ChevronRight, X } from "lucide-react";
import AdminLayout from "@/components/AdminLayout";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";
const PAGE_SIZE = 20;

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

export default function AdminSavedDocs() {
  const navigate = useNavigate();

  const [docs, setDocs]           = useState([]);
  const [total, setTotal]         = useState(0);
  const [loading, setLoading]     = useState(true);
  const [page, setPage]           = useState(0);
  const [typeFilter, setTypeFilter] = useState("all");
  const [userFilter, setUserFilter] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) navigate("/admin/login");
  }, []);

  const fetchDocs = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("adminToken");
      const params = new URLSearchParams({
        skip: (page * PAGE_SIZE).toString(),
        limit: PAGE_SIZE.toString(),
      });
      if (typeFilter !== "all")     params.append("documentType", typeFilter);
      if (userFilter.trim())        params.append("userId", userFilter.trim());
      const res = await fetch(`${BACKEND_URL}/api/admin/saved-documents?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setDocs(data.documents || []);
        setTotal(data.total || 0);
      }
    } catch (_) {}
    setLoading(false);
  }, [page, typeFilter, userFilter]);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  const deleteDoc = async (docId) => {
    if (!window.confirm("Delete this saved document? This cannot be undone.")) return;
    const token = localStorage.getItem("adminToken");
    const res = await fetch(`${BACKEND_URL}/api/admin/saved-documents/${docId}`, {
      method: "DELETE", headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) { toast.success("Document deleted"); fetchDocs(); }
    else toast.error("Failed to delete document");
  };

  const viewDoc = async (doc) => {
    const token = localStorage.getItem("adminToken");
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/saved-documents/${doc.id}/download`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `HTTP ${res.status}`);
      }
      const blob = await res.blob();
      window.open(URL.createObjectURL(blob), "_blank");
    } catch (err) {
      toast.error(`Failed to open document: ${err.message}`);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm p-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <FolderArchive className="w-5 h-5" />
              Saved Documents ({total})
            </h2>
            <div className="flex flex-wrap gap-2">
              <select
                className="admin-select"
                value={typeFilter}
                onChange={e => { setTypeFilter(e.target.value); setPage(0); }}
              >
                <option value="all">All Types</option>
                {Object.entries(DOCUMENT_TYPES).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
              <input
                className="admin-input"
                placeholder="Filter by User ID…"
                value={userFilter}
                onChange={e => { setUserFilter(e.target.value); setPage(0); }}
                style={{ width: 200 }}
              />
              <IonButton fill="outline" size="small" color="medium" onClick={fetchDocs}>
                <RefreshCw size={16} />
              </IonButton>
            </div>
          </div>

          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "48px 0" }}>
              <IonSpinner name="crescent" color="primary" style={{ width: 32, height: 32 }} />
            </div>
          ) : docs.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <FolderArchive className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No saved documents found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Document Type</th>
                      <th>File Name</th>
                      <th>Size</th>
                      <th>Created</th>
                      <th style={{ textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {docs.map(doc => (
                      <tr key={doc.id}>
                        <td>
                          <p className="font-medium text-slate-800">{doc.userEmail}</p>
                          {doc.userName && <p className="text-xs text-slate-500">{doc.userName}</p>}
                        </td>
                        <td>
                          <span className="admin-badge admin-badge-slate">
                            {DOCUMENT_TYPES[doc.documentType] || doc.documentType}
                          </span>
                        </td>
                        <td>
                          {doc.fileExists === false ? (
                            <span style={{ color: "#ef4444", fontSize: "0.875rem", display: "flex", alignItems: "center", gap: 4 }}>
                              <X size={12} style={{ flexShrink: 0 }} />
                              {doc.fileName}
                              <span style={{ fontSize: "0.75rem", color: "#f87171" }}>(missing)</span>
                            </span>
                          ) : (
                            <button
                              onClick={() => viewDoc(doc)}
                              style={{ color: "#3b82f6", fontSize: "0.875rem", display: "flex", alignItems: "center", gap: 4, cursor: "pointer", background: "none", border: "none", padding: 0 }}
                            >
                              <Eye size={12} style={{ flexShrink: 0 }} />
                              {doc.fileName}
                            </button>
                          )}
                        </td>
                        <td>
                          <span className="text-sm text-slate-500">
                            {doc.fileSize ? `${(doc.fileSize / 1024).toFixed(1)} KB` : "-"}
                          </span>
                        </td>
                        <td>
                          <span className="text-sm text-slate-500">
                            {new Date(doc.createdAt).toLocaleDateString()}
                          </span>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <button className="admin-action-btn danger" onClick={() => deleteDoc(doc.id)}>
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="admin-pagination" style={{ marginTop: 16 }}>
                <span>Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total}</span>
                <div className="admin-pagination-btns">
                  <IonButton fill="outline" size="small" color="medium" disabled={page === 0} onClick={() => setPage(p => p - 1)}><ChevronLeft size={16} /></IonButton>
                  <IonButton fill="outline" size="small" color="medium" disabled={(page + 1) * PAGE_SIZE >= total} onClick={() => setPage(p => p + 1)}><ChevronRight size={16} /></IonButton>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

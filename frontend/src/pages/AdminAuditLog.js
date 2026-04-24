import { useState, useEffect, useCallback } from "react";
import AdminLayout from "@/components/AdminLayout";
import { IonButton, IonSpinner } from "@ionic/react";
import { toast } from "sonner";
import { Search, Trash2, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";
const PAGE_SIZE = 50;

const ACTION_BADGE = {
  delete_user: "admin-badge-red",
  ban_user: "admin-badge-red",
  unban_user: "admin-badge-green",
  ban_ip: "admin-badge-red",
  unban_ip: "admin-badge-green",
  delete_discount: "admin-badge-red",
  create_discount: "admin-badge-green",
  delete_blog_post: "admin-badge-red",
  create_blog_post: "admin-badge-green",
  update_blog_post: "admin-badge-slate",
  update_email_template: "admin-badge-slate",
  reset_email_template: "admin-badge-slate",
  send_mass_email: "admin-badge-blue",
  create_moderator: "admin-badge-blue",
  delete_moderator: "admin-badge-red",
  export_csv: "admin-badge-slate",
  update_banner: "admin-badge-slate",
  maintenance_enabled: "admin-badge-red",
  maintenance_disabled: "admin-badge-green",
  auth_enabled: "admin-badge-green",
  auth_disabled: "admin-badge-red",
  update_ticket: "admin-badge-slate",
  delete_ticket: "admin-badge-red",
};

export default function AdminAuditLog() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [resourceFilter, setResourceFilter] = useState("all");
  const [clearing, setClearing] = useState(false);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("adminToken");
      const params = new URLSearchParams({ skip: page * PAGE_SIZE, limit: PAGE_SIZE });
      if (search) params.set("actor", search);
      if (actionFilter !== "all") params.set("action", actionFilter);
      if (resourceFilter !== "all") params.set("resource_type", resourceFilter);

      const res = await fetch(`${BACKEND_URL}/api/admin/audit-log?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load audit log");
      const data = await res.json();
      setLogs(data.logs || []);
      setTotal(data.total || 0);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, search, actionFilter, resourceFilter]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const handleClear = async () => {
    if (!window.confirm("Clear the entire audit log? This cannot be undone.")) return;
    setClearing(true);
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`${BACKEND_URL}/api/admin/audit-log`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to clear log");
      toast.success("Audit log cleared");
      setLogs([]);
      setTotal(0);
      setPage(0);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setClearing(false);
    }
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>
            <p className="text-sm text-gray-500 mt-1">{total} total entries</p>
          </div>
          <div className="flex gap-2">
            <IonButton fill="outline" color="medium" size="small" onClick={fetchLogs} disabled={loading}>
              <RefreshCw size={14} style={{ marginRight: 6 }} />Refresh
            </IonButton>
            <IonButton color="danger" size="small" onClick={handleClear} disabled={clearing || loading}>
              <Trash2 size={14} style={{ marginRight: 6 }} />Clear Log
            </IonButton>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
            <Search size={16} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none" }} />
            <input
              className="admin-input"
              style={{ paddingLeft: 34 }}
              placeholder="Search by actor email..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            />
          </div>
          <select className="admin-select" style={{ width: 192 }} value={actionFilter} onChange={(e) => { setActionFilter(e.target.value); setPage(0); }}>
            <option value="all">All Actions</option>
            <option value="delete_user">Delete User</option>
            <option value="ban_user">Ban User</option>
            <option value="unban_user">Unban User</option>
            <option value="ban_ip">Ban IP</option>
            <option value="unban_ip">Unban IP</option>
            <option value="create_discount">Create Discount</option>
            <option value="delete_discount">Delete Discount</option>
            <option value="create_blog_post">Create Blog Post</option>
            <option value="update_blog_post">Update Blog Post</option>
            <option value="delete_blog_post">Delete Blog Post</option>
            <option value="update_email_template">Update Template</option>
            <option value="send_mass_email">Mass Email</option>
            <option value="create_moderator">Create Moderator</option>
            <option value="delete_moderator">Delete Moderator</option>
            <option value="export_csv">CSV Export</option>
          </select>
          <select className="admin-select" style={{ width: 176 }} value={resourceFilter} onChange={(e) => { setResourceFilter(e.target.value); setPage(0); }}>
            <option value="all">All Resources</option>
            <option value="user">User</option>
            <option value="banned_ip">Banned IP</option>
            <option value="discount">Discount</option>
            <option value="blog_post">Blog Post</option>
            <option value="email_template">Email Template</option>
            <option value="mass_email">Mass Email</option>
            <option value="moderator">Moderator</option>
            <option value="site_settings">Site Settings</option>
            <option value="support_ticket">Support Ticket</option>
          </select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Actor</th>
                <th>Role</th>
                <th>Action</th>
                <th>Resource</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "32px 0" }}>
                    <IonSpinner name="crescent" color="primary" />
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "32px 0", color: "#94a3b8" }}>No log entries found</td>
                </tr>
              ) : logs.map((log) => (
                <tr key={log.id}>
                  <td style={{ fontSize: "0.8125rem", whiteSpace: "nowrap", color: "var(--admin-text-muted)" }}>
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td style={{ fontWeight: 500, whiteSpace: "nowrap" }}>{log.actorEmail || log.actorId}</td>
                  <td>
                    <span className={`admin-badge ${log.role === "admin" ? "admin-badge-blue" : "admin-badge-slate"}`} style={{ textTransform: "capitalize" }}>
                      {log.role}{log.level ? ` L${log.level}` : ""}
                    </span>
                  </td>
                  <td>
                    <span className={`admin-badge ${ACTION_BADGE[log.action] || "admin-badge-slate"}`}>
                      {log.action.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td>
                    {log.resourceType && (
                      <span style={{ textTransform: "capitalize" }}>{log.resourceType.replace(/_/g, " ")}</span>
                    )}
                    {log.resourceId && (
                      <span style={{ marginLeft: 4, color: "#94a3b8", fontSize: "0.75rem", fontFamily: "monospace" }}>
                        ({log.resourceId.length > 20 ? log.resourceId.slice(0, 20) + "…" : log.resourceId})
                      </span>
                    )}
                  </td>
                  <td style={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--admin-text-muted)" }}>
                    {log.details}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="admin-pagination">
            <span>Page {page + 1} of {totalPages} ({total} entries)</span>
            <div className="admin-pagination-btns">
              <IonButton fill="outline" size="small" color="medium" onClick={() => setPage(p => p - 1)} disabled={page === 0}><ChevronLeft size={16} /></IonButton>
              <IonButton fill="outline" size="small" color="medium" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1}><ChevronRight size={16} /></IonButton>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

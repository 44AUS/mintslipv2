import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "@/components/AdminLayout";
import { Loader2, ChevronLeft, ChevronRight, UserMinus, CheckCircle, XCircle, Clock } from "lucide-react";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";

const STATUS_STYLES = {
  pending:  "bg-amber-50 text-amber-700 border-amber-200",
  approved: "bg-green-50 text-green-700 border-green-200",
  denied:   "bg-red-50 text-red-700 border-red-200",
};
const STATUS_ICONS = { pending: Clock, approved: CheckCircle, denied: XCircle };

function fmt(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function AdminOptOuts() {
  const navigate = useNavigate();
  const token = localStorage.getItem("adminToken");

  const [requests, setRequests] = useState([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [pages, setPages]       = useState(1);
  const [loading, setLoading]   = useState(false);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [actingId, setActingId] = useState(null);

  useEffect(() => {
    if (!token) { navigate("/admin/login"); return; }
    fetchRequests(1);
  }, []); // eslint-disable-line

  const fetchRequests = useCallback(async (p, overrideStatus) => {
    setLoading(true);
    const s = overrideStatus !== undefined ? overrideStatus : statusFilter;
    try {
      const params = new URLSearchParams({ status: s, page: p });
      const res = await fetch(`${BACKEND_URL}/api/admin/opt-outs?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) { navigate("/admin/login"); return; }
      const data = await res.json();
      setRequests(data.requests || []);
      setTotal(data.total || 0);
      setPage(data.page || 1);
      setPages(data.pages || 1);
    } catch {
      toast.error("Failed to load opt-out requests");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, token, navigate]);

  const handleApprove = async (id, name) => {
    setActingId(id);
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/opt-outs/${id}/approve`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.detail || "Failed"); return; }
      toast.success(`Approved — ${data.deleted} record(s) removed for ${name}`);
      fetchRequests(page);
    } catch {
      toast.error("Action failed");
    } finally {
      setActingId(null);
    }
  };

  const handleDeny = async (id) => {
    setActingId(id);
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/opt-outs/${id}/deny`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) { toast.error("Failed"); return; }
      toast.success("Request denied");
      fetchRequests(page);
    } catch {
      toast.error("Action failed");
    } finally {
      setActingId(null);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Opt-Out Requests</h1>
            <p className="text-sm text-slate-500 mt-0.5">People requesting removal of their records</p>
          </div>
          {total > 0 && (
            <span className="bg-amber-100 text-amber-700 text-sm font-semibold px-3 py-1 rounded-full">
              {total} {statusFilter === "pending" ? "pending" : ""}
            </span>
          )}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2">
          {["pending", "approved", "denied", "all"].map(s => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); fetchRequests(1, s); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                statusFilter === s
                  ? "bg-green-600 text-white"
                  : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-green-600" />
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-16">
              <UserMinus className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">No {statusFilter !== "all" ? statusFilter : ""} opt-out requests</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    {["Name", "Email", "Phone", "Reason", "Status", "Submitted", "Actions"].map(h => (
                      <th key={h} className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {requests.map(req => {
                    const StatusIcon = STATUS_ICONS[req.status] || Clock;
                    const isActing = actingId === req.id;
                    return (
                      <tr key={req.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-4 py-3 font-medium text-slate-900 dark:text-white whitespace-nowrap">{req.name}</td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{req.email}</td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">{req.phone || "—"}</td>
                        <td className="px-4 py-3 text-slate-500 max-w-[200px] truncate" title={req.reason}>{req.reason || "—"}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${STATUS_STYLES[req.status] || STATUS_STYLES.pending}`}>
                            <StatusIcon className="w-3 h-3" />
                            {req.status}
                            {req.status === "approved" && req.deletedCount != null && ` (${req.deletedCount} removed)`}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{fmt(req.createdAt)}</td>
                        <td className="px-4 py-3">
                          {req.status === "pending" ? (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleApprove(req.id, req.name)}
                                disabled={isActing}
                                className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg font-semibold disabled:opacity-50 transition-colors"
                              >
                                {isActing ? <Loader2 className="w-3 h-3 animate-spin" /> : "Approve"}
                              </button>
                              <button
                                onClick={() => handleDeny(req.id)}
                                disabled={isActing}
                                className="text-xs border border-red-200 text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg font-semibold disabled:opacity-50 transition-colors"
                              >
                                Deny
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Page {page} of {pages}</p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { const p = page - 1; setPage(p); fetchRequests(p); }}
                disabled={page <= 1}
                className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4 text-slate-600" />
              </button>
              <button
                onClick={() => { const p = page + 1; setPage(p); fetchRequests(p); }}
                disabled={page >= pages}
                className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4 text-slate-600" />
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

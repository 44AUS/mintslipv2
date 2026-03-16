import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "@/components/AdminLayout";
import { Search, Trash2, Loader2, ChevronLeft, ChevronRight, Database } from "lucide-react";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";

const SOURCE_COLORS = {
  fec:         "bg-green-50 text-green-700 border-green-200",
  nsopw:       "bg-red-50 text-red-700 border-red-200",
  nppes:       "bg-blue-50 text-blue-700 border-blue-200",
  faa:         "bg-sky-50 text-sky-700 border-sky-200",
  voter_rolls: "bg-purple-50 text-purple-700 border-purple-200",
  whitepages:  "bg-amber-50 text-amber-700 border-amber-200",
  internal:    "bg-slate-100 text-slate-600 border-slate-200",
};

const SOURCES = ["", "fec", "nsopw", "nppes", "faa", "voter_rolls", "whitepages", "internal"];

function fmt(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function AdminPeopleRecords() {
  const navigate = useNavigate();
  const token = localStorage.getItem("adminToken");

  const [records, setRecords]     = useState([]);
  const [total, setTotal]         = useState(0);
  const [page, setPage]           = useState(1);
  const [pages, setPages]         = useState(1);
  const [loading, setLoading]     = useState(false);
  const [q, setQ]                 = useState("");
  const [source, setSource]       = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [confirmId, setConfirmId] = useState(null);

  useEffect(() => {
    if (!token) { navigate("/admin/login"); return; }
    fetchRecords(1);
  }, []); // eslint-disable-line

  const fetchRecords = useCallback(async (p, overrideQ, overrideSrc) => {
    setLoading(true);
    const qVal   = overrideQ  !== undefined ? overrideQ  : q;
    const srcVal = overrideSrc !== undefined ? overrideSrc : source;
    try {
      const params = new URLSearchParams({ page: p, q: qVal, source: srcVal });
      const res = await fetch(`${BACKEND_URL}/api/admin/people-records/browse?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) { navigate("/admin/login"); return; }
      const data = await res.json();
      setRecords(data.records || []);
      setTotal(data.total || 0);
      setPage(data.page || 1);
      setPages(data.pages || 1);
    } catch {
      toast.error("Failed to load records");
    } finally {
      setLoading(false);
    }
  }, [q, source, token, navigate]);

  const handleSearch = () => fetchRecords(1);

  const handleDelete = async (recordId) => {
    setDeletingId(recordId);
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/people-records/record/${recordId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) { toast.error("Failed to delete record"); return; }
      toast.success("Record deleted");
      setConfirmId(null);
      fetchRecords(page);
    } catch {
      toast.error("Delete failed");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">People Records</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {total.toLocaleString()} total records across all sources
            </p>
          </div>
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg">
            <Database className="w-4 h-4 text-slate-500" />
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{total.toLocaleString()}</span>
          </div>
        </div>

        {/* Search bar */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex gap-3 flex-wrap">
            <div className="flex-1 min-w-[220px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                value={q}
                onChange={e => setQ(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSearch()}
                placeholder="Search by name or phone…"
                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-slate-800 dark:border-slate-600 dark:text-white"
              />
            </div>
            <select
              value={source}
              onChange={e => { setSource(e.target.value); fetchRecords(1, q, e.target.value); }}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-slate-800 dark:border-slate-600 dark:text-white"
            >
              {SOURCES.map(s => (
                <option key={s} value={s}>{s ? s.toUpperCase() : "All Sources"}</option>
              ))}
            </select>
            <button
              onClick={handleSearch}
              disabled={loading}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Search
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-green-600" />
            </div>
          ) : records.length === 0 ? (
            <div className="text-center py-16">
              <Database className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">No records found</p>
              <p className="text-slate-400 text-sm mt-1">Run a scraper from the Data Sources page to populate records</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    {["Name", "Source", "State", "Address", "Phone", "Added", ""].map(h => (
                      <th key={h} className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {records.map(rec => {
                    const addr = rec.addresses?.[0];
                    const addrStr = addr ? [addr.street, addr.city, addr.state].filter(Boolean).join(", ") : "—";
                    const phone = rec.phones?.[0] || "—";
                    return (
                      <tr key={rec.recordId} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-4 py-3 font-medium text-slate-900 dark:text-white whitespace-nowrap">
                          {rec.firstName} {rec.lastName}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${SOURCE_COLORS[rec.source] || SOURCE_COLORS.internal}`}>
                            {rec.source}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{rec.state || "—"}</td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-400 max-w-[200px] truncate">{addrStr}</td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">{phone}</td>
                        <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{fmt(rec.createdAt)}</td>
                        <td className="px-4 py-3 text-right">
                          {confirmId === rec.recordId ? (
                            <div className="flex items-center gap-2 justify-end">
                              <button
                                onClick={() => handleDelete(rec.recordId)}
                                disabled={deletingId === rec.recordId}
                                className="text-xs bg-red-600 hover:bg-red-700 text-white px-2.5 py-1 rounded-lg font-semibold disabled:opacity-50"
                              >
                                {deletingId === rec.recordId ? "Deleting…" : "Confirm"}
                              </button>
                              <button
                                onClick={() => setConfirmId(null)}
                                className="text-xs text-slate-500 hover:text-slate-700 px-2 py-1"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmId(rec.recordId)}
                              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete record"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
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
            <p className="text-sm text-slate-500">
              Page {page} of {pages} · {total.toLocaleString()} records
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { const p = page - 1; setPage(p); fetchRecords(p); }}
                disabled={page <= 1}
                className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-slate-600" />
              </button>
              <button
                onClick={() => { const p = page + 1; setPage(p); fetchRecords(p); }}
                disabled={page >= pages}
                className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition-colors"
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

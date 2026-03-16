import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "@/components/AdminLayout";
import {
  Search, CheckCircle, DollarSign, TrendingUp, Loader2,
  ChevronLeft, ChevronRight, Phone, User, MapPin, FileSearch, Save,
} from "lucide-react";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";

const TYPE_LABELS = {
  phone_lookup:      "Phone Lookup",
  name_lookup:       "Name Lookup",
  address_lookup:    "Address Lookup",
  background_report: "Background Report",
};

const TYPE_ICONS = {
  phone_lookup:      Phone,
  name_lookup:       User,
  address_lookup:    MapPin,
  background_report: FileSearch,
};

function StatCard({ icon: Icon, label, value, sub, color = "text-slate-700", bg = "bg-slate-50" }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-start gap-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${bg}`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <div>
        <p className="text-xl font-bold text-slate-900">{value}</p>
        <p className="text-sm text-slate-500 mt-0.5">{label}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function AdminPeopleSearch() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [searches, setSearches] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [prices, setPrices] = useState({
    phone_lookup: "",
    name_lookup: "",
    address_lookup: "",
    background_report: "",
  });
  const [savingPrices, setSavingPrices] = useState(false);

  const LIMIT = 25;

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) { navigate("/admin/login"); return; }
    fetchStats();
    fetchSearches(1);
    fetchPrices();
  }, []);

  const fetchPrices = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/people-search/prices`);
      const data = await res.json();
      if (res.ok) setPrices({
        phone_lookup:      String(data.phone_lookup      ?? "0.99"),
        name_lookup:       String(data.name_lookup       ?? "1.49"),
        address_lookup:    String(data.address_lookup    ?? "1.49"),
        background_report: String(data.background_report ?? "4.99"),
      });
    } catch {}
  };

  const savePrices = async () => {
    setSavingPrices(true);
    try {
      const token = localStorage.getItem("adminToken");
      const body = {};
      for (const k of Object.keys(prices)) {
        const v = parseFloat(prices[k]);
        if (isNaN(v) || v < 0) { toast.error(`Invalid price for ${TYPE_LABELS[k]}`); return; }
        body[k] = v;
      }
      const res = await fetch(`${BACKEND_URL}/api/admin/people-search/prices`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      if (res.ok) toast.success("Prices saved successfully.");
      else toast.error("Failed to save prices.");
    } catch { toast.error("Failed to save prices."); }
    finally { setSavingPrices(false); }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`${BACKEND_URL}/api/admin/people-search/stats`, {
        headers: { "Authorization": `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setStats(data);
    } catch {}
  };

  const fetchSearches = async (p) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(
        `${BACKEND_URL}/api/admin/people-search/searches?page=${p}&limit=${LIMIT}`,
        { headers: { "Authorization": `Bearer ${token}` } },
      );
      const data = await res.json();
      if (res.ok) {
        setSearches(data.searches || []);
        setTotal(data.total || 0);
        setPage(p);
      }
    } catch {}
    finally { setLoading(false); }
  };

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));
  const convRate = stats
    ? stats.totalSearches > 0
      ? ((stats.paidSearches / stats.totalSearches) * 100).toFixed(1)
      : "0.0"
    : "–";

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-slate-800">People Search Analytics</h1>
          <p className="text-sm text-slate-500 mt-1">Track searches, revenue, and conversion rates.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            icon={Search}
            label="Total Searches"
            value={stats ? stats.totalSearches.toLocaleString() : "–"}
            bg="bg-slate-50"
            color="text-slate-500"
          />
          <StatCard
            icon={CheckCircle}
            label="Paid Lookups"
            value={stats ? stats.paidSearches.toLocaleString() : "–"}
            bg="bg-green-50"
            color="text-green-600"
          />
          <StatCard
            icon={DollarSign}
            label="Total Revenue"
            value={stats ? `$${stats.totalRevenue.toFixed(2)}` : "–"}
            bg="bg-green-50"
            color="text-green-600"
          />
          <StatCard
            icon={TrendingUp}
            label="Conversion Rate"
            value={`${convRate}%`}
            bg="bg-blue-50"
            color="text-blue-600"
          />
        </div>

        {/* Breakdown by type */}
        <div className="bg-white rounded-xl border border-slate-200 mb-6 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-800">Breakdown by Lookup Type</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {["phone_lookup", "name_lookup", "address_lookup", "background_report"].map(type => {
              const info = stats?.byType?.[type] || { count: 0, paid: 0 };
              const conv = info.count > 0 ? ((info.paid / info.count) * 100).toFixed(1) : "0.0";
              const Icon = TYPE_ICONS[type] || Search;
              return (
                <div key={type} className="flex items-center justify-between px-5 py-3">
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-700">{TYPE_LABELS[type]}</span>
                  </div>
                  <div className="flex items-center gap-8 text-sm text-slate-500">
                    <span>{info.count} searches</span>
                    <span>{info.paid} paid</span>
                    <span className="text-green-600 font-medium">{conv}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Price Management */}
        <div className="bg-white rounded-xl border border-slate-200 mb-6 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-800">Lookup Prices</h2>
              <p className="text-xs text-slate-400 mt-0.5">Set the price charged per lookup type.</p>
            </div>
            <button
              onClick={savePrices}
              disabled={savingPrices}
              className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
            >
              {savingPrices ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Save Prices
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {["phone_lookup", "name_lookup", "address_lookup", "background_report"].map(type => {
              const Icon = TYPE_ICONS[type] || Search;
              return (
                <div key={type} className="flex items-center justify-between px-5 py-3">
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-700">{TYPE_LABELS[type]}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-400">$</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={prices[type]}
                      onChange={e => setPrices(p => ({ ...p, [type]: e.target.value }))}
                      className="w-24 text-sm border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent searches table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-800">
              Recent Searches
              <span className="ml-2 text-xs font-normal text-slate-400">({total} total)</span>
            </h2>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
            </div>
          ) : searches.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">No searches yet.</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      {["Type", "Query", "IP", "Paid", "Date"].map(h => (
                        <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {searches.map(s => (
                      <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3">
                          <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                            {TYPE_LABELS[s.lookupType] || s.lookupType}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-700 max-w-[160px] truncate">{s.query}</td>
                        <td className="px-4 py-3 text-slate-400 font-mono text-xs">{s.clientIp}</td>
                        <td className="px-4 py-3">
                          {s.isPaid ? (
                            <span className="flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded-full w-fit">
                              <CheckCircle className="w-3 h-3" /> Paid
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full">Unpaid</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-400 text-xs">
                          {s.createdAt ? new Date(s.createdAt).toLocaleDateString() : "–"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100">
                  <span className="text-xs text-slate-400">
                    Page {page} of {totalPages}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => fetchSearches(page - 1)}
                      disabled={page <= 1}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" /> Prev
                    </button>
                    <button
                      onClick={() => fetchSearches(page + 1)}
                      disabled={page >= totalPages}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Next <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

import { useState, useEffect } from "react";
import AdminLayout from "@/components/AdminLayout";
import { toast } from "@/utils/toast";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { IonButton } from "@ionic/react";
import { RefreshCw } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";

const DOCUMENT_TYPES = {
  "paystub": "Pay Stub",
  "resume": "AI Resume",
  "w2": "W-2 Form",
  "w9": "W-9 Form",
  "1099-nec": "1099-NEC",
  "1099-misc": "1099-MISC",
  "bank-statement": "Bank Statement",
  "offer-letter": "Offer Letter",
  "cease-and-desist": "Cease and Desist Letter",
  "power-of-attorney": "Power of Attorney",
  "commercial-lease": "Commercial Lease",
  "vehicle-bill-of-sale": "Vehicle Bill of Sale",
  "schedule-c": "Schedule C",
  "utility-bill": "Utility Bill",
  "canadian-paystub": "Canadian Pay Stub",
};

const PIE_COLORS = [
  '#16a34a', '#3b82f6', '#f59e0b', '#ef4444',
  '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16',
  '#f97316', '#6366f1', '#14b8a6', '#a855f7',
];

const TOOLTIP_STYLE = {
  backgroundColor: '#fff',
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
};

function fmt(n) {
  return `$${Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// KPI card matching the whodat analytics page (.kpi): uppercase label,
// serif value, optional green/red delta line.
function MetricCard({ label, value, sub, subPositive }) {
  return (
    <div className="kpi">
      <div className="label">{label}</div>
      <div className="value">{value}</div>
      {sub && (
        <div className={`delta${subPositive ? "" : " down"}`}>
          {subPositive ? "▲" : "▼"} {sub}
        </div>
      )}
    </div>
  );
}

export default function AdminRevenue() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState("30");

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`${BACKEND_URL}/api/admin/revenue/summary`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load revenue data");
      const json = await res.json();
      setData(json);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Slice daily data based on selected period
  const chartData = data
    ? data.dailyData.slice(-Number(period)).map(d => ({
        name: d.date.slice(5), // MM-DD
        revenue: d.revenue,
        count: d.count,
      }))
    : [];

  const pieData = data
    ? data.byDocType.map((d, i) => ({
        name: DOCUMENT_TYPES[d.documentType] || d.documentType,
        value: d.revenue,
        fill: PIE_COLORS[i % PIE_COLORS.length],
      }))
    : [];

  // Month-over-month change
  const momChange = data && data.lastMonthRevenue > 0
    ? ((data.thisMonthRevenue - data.lastMonthRevenue) / data.lastMonthRevenue * 100).toFixed(1)
    : null;
  const momPositive = momChange !== null && Number(momChange) >= 0;

  return (
    <AdminLayout>
      <div>
        {/* Header */}
        <div className="flex items-center justify-between" style={{ marginBottom: 24 }}>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Revenue</h1>
            <p className="text-sm text-gray-500 mt-1">One-time purchase analytics</p>
          </div>
          <IonButton fill="outline" color="medium" size="small" onClick={fetchData} disabled={loading}>
            <RefreshCw size={14} style={{ marginRight: 6 }} />Refresh
          </IonButton>
        </div>

        {/* Metric cards */}
        <div className="kpi-grid kpi-grid-5">
          <MetricCard
            label="Total Revenue"
            value={data ? fmt(data.totalRevenue) : "—"}
          />
          <MetricCard
            label="This Month"
            value={data ? fmt(data.thisMonthRevenue) : "—"}
            sub={momChange !== null ? `${Math.abs(Number(momChange))}% vs last month` : null}
            subPositive={momPositive}
          />
          <MetricCard
            label="Last Month"
            value={data ? fmt(data.lastMonthRevenue) : "—"}
          />
          <MetricCard
            label="Avg Order Value"
            value={data ? fmt(data.avgOrderValue) : "—"}
          />
          <MetricCard
            label="Total Purchases"
            value={data ? data.totalPurchases.toLocaleString() : "—"}
          />
        </div>

        {/* Revenue over time chart */}
        <div className="chart-card" style={{ marginBottom: 32 }}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="chart-title" style={{ marginBottom: 0 }}>Revenue Over Time</h2>
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
              {[["7", "7D"], ["30", "30D"], ["90", "90D"]].map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => setPeriod(val)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    period === val ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="h-[280px]">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#16a34a" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} tickFormatter={v => `$${v}`} />
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE}
                    formatter={(val, name) => [
                      name === "revenue" ? fmt(val) : val,
                      name === "revenue" ? "Revenue" : "Orders",
                    ]}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#16a34a" strokeWidth={2} fillOpacity={1} fill="url(#revGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
                {loading ? "Loading..." : "No data for this period"}
              </div>
            )}
          </div>
        </div>

        {/* Revenue by document type */}
        <div className="chart-grid-even">
          {/* Pie chart */}
          <div className="chart-card">
            <h2 className="chart-title" style={{ marginBottom: 16 }}>Revenue by Document Type</h2>
            <div className="h-[280px]">
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={TOOLTIP_STYLE}
                      formatter={(val) => [fmt(val), "Revenue"]}
                    />
                    <Legend layout="vertical" align="right" verticalAlign="middle" wrapperStyle={{ fontSize: "12px" }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400">
                  {loading ? "Loading..." : "No data"}
                </div>
              )}
            </div>
          </div>

          {/* Breakdown table */}
          <div className="chart-card">
            <h2 className="chart-title" style={{ marginBottom: 16 }}>Breakdown by Document</h2>
            <div className="overflow-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b border-gray-100">
                    <th className="pb-2 font-medium">Document Type</th>
                    <th className="pb-2 font-medium text-right">Revenue</th>
                    <th className="pb-2 font-medium text-right">Orders</th>
                    <th className="pb-2 font-medium text-right">Avg Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {(data?.byDocType || []).map((row, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="py-2.5 flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                        />
                        {DOCUMENT_TYPES[row.documentType] || row.documentType}
                      </td>
                      <td className="py-2.5 text-right font-medium text-gray-900">{fmt(row.revenue)}</td>
                      <td className="py-2.5 text-right text-gray-600">{row.count}</td>
                      <td className="py-2.5 text-right text-gray-600">{fmt(row.avgPrice)}</td>
                    </tr>
                  ))}
                  {!data && (
                    <tr><td colSpan={4} className="py-4 text-center text-gray-400">{loading ? "Loading..." : "No data"}</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

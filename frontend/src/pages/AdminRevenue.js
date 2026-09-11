import { useState, useEffect } from "react";
import AdminLayout from "@/components/AdminLayout";
import { toast } from "@/utils/toast";
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { IonButton, IonIcon, IonSegment, IonSegmentButton, IonLabel } from "@ionic/react";
import { refreshOutline } from "ionicons/icons";
import { IonMonthInput } from "@/components/DateInput";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";

const DOCUMENT_TYPES = {
  "paystub": "Pay Stub",
  "resume": "AI Resume",
  "w2": "W-2 Form",
  "w9": "W-9 Form",
  "1099-nec": "1099-NEC",
  "1099-misc": "1099-MISC",
  "bank-statement": "Accounting Mockup",
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
  '#059669', '#3b82f6', '#f59e0b', '#ef4444',
  '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16',
  '#f97316', '#6366f1', '#14b8a6', '#a855f7',
];

const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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
// bold value, optional green/red delta line.
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

// Chart data switches as native iOS Ionic segments — the same segment style
// used across the app (support center tabs, form modals).
function PillGroup({ value, onChange, options }) {
  return (
    <IonSegment
      mode="ios"
      value={value}
      onIonChange={(e) => onChange(e.detail.value)}
      style={{ width: "auto", flexShrink: 0 }}
    >
      {options.map(([val, label]) => (
        <IonSegmentButton key={val} value={val} style={{ minWidth: 58, minHeight: 26, "--padding-top": "1px", "--padding-bottom": "1px" }}>
          <IonLabel style={{ fontSize: "0.72rem", fontWeight: 600 }}>{label}</IonLabel>
        </IonSegmentButton>
      ))}
    </IonSegment>
  );
}

// Renders one timeseries as the picked chart type (area / line / bar) with a
// shared axis/tooltip setup — the "manipulative" half of every chart below.
function FlexChart({ type, data, dataKey, money, color = "#059669", gradId }) {
  const common = (
    <>
      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
      <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} interval="preserveStartEnd" />
      <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} tickFormatter={v => (money ? `$${v}` : v)} />
      <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(val) => [money ? fmt(val) : val, money ? "Revenue" : "Orders"]} />
    </>
  );
  if (type === "bar") {
    return (
      <BarChart data={data}>
        {common}
        <Bar dataKey={dataKey} fill={color} radius={[4, 4, 0, 0]} />
      </BarChart>
    );
  }
  if (type === "line") {
    return (
      <LineChart data={data}>
        {common}
        <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2.5} dot={false} />
      </LineChart>
    );
  }
  return (
    <AreaChart data={data}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor={color} stopOpacity={0.3} />
          <stop offset="95%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      {common}
      <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} fillOpacity={1} fill={`url(#${gradId})`} />
    </AreaChart>
  );
}

export default function AdminRevenue() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Per-chart controls
  const [period, setPeriod] = useState("30");            // over-time range
  const [fromMonth, setFromMonth] = useState("");        // custom month range
  const [toMonth, setToMonth] = useState("");
  const [otType, setOtType] = useState("area");          // over-time chart type
  const [otMetric, setOtMetric] = useState("revenue");   // revenue | orders | cumulative
  const [docView, setDocView] = useState("pie");         // pie | bar
  const [docMetric, setDocMetric] = useState("revenue"); // revenue | orders
  const [dowMetric, setDowMetric] = useState("revenue");
  const [moType, setMoType] = useState("bar");
  const [moMetric, setMoMetric] = useState("revenue");

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

  // ── Over time: preset period slice, or the custom From/To month range ──
  const usingRange = period === "custom" && fromMonth && toMonth;
  const [rangeLo, rangeHi] = fromMonth <= toMonth ? [fromMonth, toMonth] : [toMonth, fromMonth];
  const sliced = data
    ? (usingRange
        ? data.dailyData.filter(d => { const m = d.date.slice(0, 7); return m >= rangeLo && m <= rangeHi; })
        : (period === "all" ? data.dailyData : data.dailyData.slice(-Number(period === "custom" ? 30 : period))))
    : [];
  let running = 0;
  const overTime = sliced.map(d => ({
    name: d.date.slice(5), // MM-DD
    revenue: d.revenue,
    count: d.count,
    cumulative: +(running += d.revenue).toFixed(2),
  }));
  const otKey = otMetric === "orders" ? "count" : otMetric === "cumulative" ? "cumulative" : "revenue";
  const otMoney = otMetric !== "orders";

  // ── By document type ──
  const pieData = data
    ? data.byDocType.map((d, i) => ({
        name: DOCUMENT_TYPES[d.documentType] || d.documentType,
        value: docMetric === "orders" ? d.count : d.revenue,
        fill: PIE_COLORS[i % PIE_COLORS.length],
      }))
    : [];

  // ── Day-of-week aggregate (respects the over-time period) ──
  const dowAgg = DOW.map((name) => ({ name, revenue: 0, count: 0 }));
  sliced.forEach((d) => {
    const day = new Date(`${d.date}T12:00:00`).getDay();
    dowAgg[day].revenue = +(dowAgg[day].revenue + d.revenue).toFixed(2);
    dowAgg[day].count += d.count;
  });

  // ── Monthly trend (last 12 months from all daily data) ──
  const monthMap = new Map();
  (data?.dailyData || []).forEach((d) => {
    const key = d.date.slice(0, 7); // YYYY-MM
    const cur = monthMap.get(key) || { revenue: 0, count: 0 };
    cur.revenue = +(cur.revenue + d.revenue).toFixed(2);
    cur.count += d.count;
    monthMap.set(key, cur);
  });
  const monthly = [...monthMap.entries()]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .slice(-12)
    .map(([key, v]) => ({ name: key.slice(2), ...v })); // YY-MM

  // Month-over-month change
  const momChange = data && data.lastMonthRevenue > 0
    ? ((data.thisMonthRevenue - data.lastMonthRevenue) / data.lastMonthRevenue * 100).toFixed(1)
    : null;
  const momPositive = momChange !== null && Number(momChange) >= 0;

  const empty = (label) => (
    <div className="h-full flex items-center justify-center text-gray-400">
      {loading ? "Loading..." : label}
    </div>
  );

  return (
    <AdminLayout>
      <div>
        {/* Header */}
        <div className="flex items-center justify-between" style={{ marginBottom: 24 }}>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Revenue</h1>
            <p className="text-sm text-gray-500 mt-1">One-time purchase analytics</p>
          </div>
          <IonButton title="Refresh" fill="clear" shape="round" color="medium" onClick={fetchData} disabled={loading}>
            <span slot="icon-only" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", lineHeight: 0, flexShrink: 0, fontSize: "1.1rem" }}>
              <IonIcon icon={refreshOutline} style={{ fontSize: "inherit", color: "inherit", pointerEvents: "none" }} />
            </span>
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

        {/* Revenue over time — period, chart type, and metric are all switchable */}
        <div className="chart-card" style={{ marginBottom: 32 }}>
          <div className="flex items-center justify-between mb-5" style={{ flexWrap: "wrap", gap: 8 }}>
            <h2 className="chart-title" style={{ marginBottom: 0 }}>Revenue Over Time</h2>
            <div className="flex items-center" style={{ gap: 8, flexWrap: "wrap" }}>
              <PillGroup value={otMetric} onChange={setOtMetric} options={[["revenue", "Revenue"], ["orders", "Orders"], ["cumulative", "Cumulative"]]} />
              <PillGroup value={otType} onChange={setOtType} options={[["area", "Area"], ["line", "Line"], ["bar", "Bar"]]} />
              <PillGroup
                value={period}
                onChange={(v) => { setPeriod(v); if (v !== "custom") { setFromMonth(""); setToMonth(""); } }}
                options={[["7", "7D"], ["30", "30D"], ["90", "90D"], ["all", "All"], ["custom", "Months"]]}
              />
              {period === "custom" && (
                <div className="flex items-center" style={{ gap: 6 }}>
                  <IonMonthInput
                    className="admin-field" mode="md"
                    label="From" value={fromMonth} onChange={setFromMonth}
                    style={{ minWidth: 140, maxWidth: 160 }}
                  />
                  <IonMonthInput
                    className="admin-field" mode="md"
                    label="To" value={toMonth} onChange={setToMonth}
                    style={{ minWidth: 140, maxWidth: 160 }}
                  />
                </div>
              )}
            </div>
          </div>
          <div className="h-[280px]">
            {overTime.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                {FlexChart({ type: otType, data: overTime, dataKey: otKey, money: otMoney, gradId: "revGrad" })}
              </ResponsiveContainer>
            ) : empty(period === "custom" && !(fromMonth && toMonth) ? "Pick From and To months" : "No data for this period")}
          </div>
        </div>

        {/* Revenue by document type */}
        <div className="chart-grid-even" style={{ marginBottom: 32 }}>
          {/* Pie / bar view */}
          <div className="chart-card">
            <div className="flex items-center justify-between" style={{ flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
              <h2 className="chart-title" style={{ marginBottom: 0 }}>Revenue by Document Type</h2>
              <div className="flex" style={{ gap: 8, flexWrap: "wrap" }}>
                <PillGroup value={docMetric} onChange={setDocMetric} options={[["revenue", "Revenue"], ["orders", "Orders"]]} />
                <PillGroup value={docView} onChange={setDocView} options={[["pie", "Pie"], ["bar", "Bar"]]} />
              </div>
            </div>
            <div className="h-[280px]">
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  {docView === "pie" ? (
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
                        formatter={(val) => [docMetric === "orders" ? val : fmt(val), docMetric === "orders" ? "Orders" : "Revenue"]}
                      />
                      <Legend layout="vertical" align="right" verticalAlign="middle" wrapperStyle={{ fontSize: "12px" }} />
                    </PieChart>
                  ) : (
                    <BarChart data={pieData} layout="vertical" margin={{ left: 40 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} tickFormatter={v => (docMetric === "orders" ? v : `$${v}`)} />
                      <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} />
                      <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(val) => [docMetric === "orders" ? val : fmt(val), docMetric === "orders" ? "Orders" : "Revenue"]} />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                        {pieData.map((entry, i) => (
                          <Cell key={i} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  )}
                </ResponsiveContainer>
              ) : empty("No data")}
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

        {/* Day-of-week + monthly trend */}
        <div className="chart-grid-even">
          <div className="chart-card">
            <div className="flex items-center justify-between" style={{ flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
              <h2 className="chart-title" style={{ marginBottom: 0 }}>By Day of Week</h2>
              <PillGroup value={dowMetric} onChange={setDowMetric} options={[["revenue", "Revenue"], ["orders", "Orders"]]} />
            </div>
            <div className="h-[260px]">
              {sliced.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  {FlexChart({ type: "bar", data: dowAgg, dataKey: dowMetric === "orders" ? "count" : "revenue", money: dowMetric !== "orders", color: "#0891b2", gradId: "dowGrad" })}
                </ResponsiveContainer>
              ) : empty("No data for this period")}
            </div>
            <p className="text-xs text-gray-400" style={{ margin: "6px 0 0" }}>Follows the period picked on Revenue Over Time.</p>
          </div>

          <div className="chart-card">
            <div className="flex items-center justify-between" style={{ flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
              <h2 className="chart-title" style={{ marginBottom: 0 }}>Monthly Trend</h2>
              <div className="flex" style={{ gap: 8, flexWrap: "wrap" }}>
                <PillGroup value={moMetric} onChange={setMoMetric} options={[["revenue", "Revenue"], ["orders", "Orders"]]} />
                <PillGroup value={moType} onChange={setMoType} options={[["bar", "Bar"], ["line", "Line"], ["area", "Area"]]} />
              </div>
            </div>
            <div className="h-[260px]">
              {monthly.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  {FlexChart({ type: moType, data: monthly, dataKey: moMetric === "orders" ? "count" : "revenue", money: moMetric !== "orders", color: "#8b5cf6", gradId: "moGrad" })}
                </ResponsiveContainer>
              ) : empty("No data")}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

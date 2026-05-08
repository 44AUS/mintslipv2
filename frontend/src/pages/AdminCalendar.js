import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  IonSegment, IonSegmentButton, IonLabel, IonIcon,
  IonButton, IonSpinner,
} from "@ionic/react";
import {
  chevronBackOutline, chevronForwardOutline, chevronDownOutline,
} from "ionicons/icons";
import AdminLayout from "@/components/AdminLayout";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";

const DOC_COLORS = {
  "paystub":               "#16a34a",
  "canadian-paystub":      "#16a34a",
  "resume":                "#2563eb",
  "w2":                    "#7c3aed",
  "w9":                    "#7c3aed",
  "1099-nec":              "#d97706",
  "1099-misc":             "#d97706",
  "bank-statement":        "#0891b2",
  "offer-letter":          "#059669",
  "vehicle-bill-of-sale":  "#dc2626",
  "schedule-c":            "#92400e",
  "utility-bill":          "#64748b",
};

const DOC_LABELS = {
  "paystub":               "Pay Stub",
  "canadian-paystub":      "CA Pay Stub",
  "resume":                "AI Resume",
  "w2":                    "W-2",
  "w9":                    "W-9",
  "1099-nec":              "1099-NEC",
  "1099-misc":             "1099-MISC",
  "bank-statement":        "Bank Stmt",
  "offer-letter":          "Offer Letter",
  "vehicle-bill-of-sale":  "Bill of Sale",
  "schedule-c":            "Schedule C",
  "utility-bill":          "Utility Bill",
};

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

function daysInMonth(y, m) { return new Date(y, m + 1, 0).getDate(); }
function firstDayOfWeek(y, m) { return new Date(y, m, 1).getDay(); }

function dateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function isToday(d) {
  const t = new Date();
  return d.getFullYear()===t.getFullYear() && d.getMonth()===t.getMonth() && d.getDate()===t.getDate();
}

const segBtnStyle = {
  "--indicator-color": "var(--ion-card-background)",
  "--color": "var(--ion-color-medium)",
  "--color-checked": "var(--ion-text-color)",
  "--border-radius": "8px",
  "--indicator-box-shadow": "0 1px 4px rgba(0,0,0,0.15)",
  minHeight: 28,
};

export default function AdminCalendar() {
  const navigate = useNavigate();
  const today = new Date();

  const [view, setView] = useState("month");
  const [curDate, setCurDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPicker, setShowPicker] = useState(false);

  const year = curDate.getFullYear();
  const month = curDate.getMonth();

  const fetchPurchases = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("adminToken");
      const params = new URLSearchParams({ skip: "0", limit: "2000" });
      const res = await fetch(`${BACKEND_URL}/api/admin/purchases?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setPurchases(data.purchases || []);
      }
    } catch (_) {}
    setLoading(false);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) { navigate("/admin/login"); return; }
    fetchPurchases();
  }, [fetchPurchases, navigate]);

  // Group purchases by "YYYY-MM-DD"
  const byDate = {};
  purchases.forEach(p => {
    if (!p.createdAt) return;
    const k = dateKey(new Date(p.createdAt));
    if (!byDate[k]) byDate[k] = [];
    byDate[k].push(p);
  });

  // Month totals
  const monthPurchases = purchases.filter(p => {
    const d = new Date(p.createdAt || 0);
    return d.getFullYear() === year && d.getMonth() === month;
  });
  const monthRevenue = monthPurchases.reduce((s, p) => s + (p.amount || 0), 0);

  // Build 42-cell grid (6 weeks)
  const first = firstDayOfWeek(year, month);
  const dim = daysInMonth(year, month);
  const prevDim = daysInMonth(year, month - 1);
  const cells = [];
  for (let i = first - 1; i >= 0; i--)
    cells.push({ day: prevDim - i, cur: false, date: new Date(year, month - 1, prevDim - i) });
  for (let d = 1; d <= dim; d++)
    cells.push({ day: d, cur: true, date: new Date(year, month, d) });
  while (cells.length < 42)
    cells.push({ day: cells.length - first - dim + 1, cur: false, date: new Date(year, month + 1, cells.length - first - dim + 1) });
  const weeks = Array.from({ length: 6 }, (_, i) => cells.slice(i * 7, i * 7 + 7));

  const prevMonth = () => setCurDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurDate(new Date(year, month + 1, 1));
  const goToday  = () => setCurDate(new Date(today.getFullYear(), today.getMonth(), 1));

  // ── Render ───────────────────────────────────────────────────────────────────

  const renderMonth = () => (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Day-of-week headers */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", borderBottom: "1px solid var(--ion-border-color)", flexShrink: 0 }}>
        {DAYS.map(d => (
          <div key={d} style={{ padding: "10px 0", textAlign: "center" }}>
            <span style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--ion-color-medium)", letterSpacing: "0.05em" }}>{d}</span>
          </div>
        ))}
      </div>

      {/* Week rows */}
      <div style={{ flex: "1 1 0%", display: "grid", gridTemplateRows: "repeat(6,1fr)" }}>
        {weeks.map((week, wi) => {
          // Count max events across the week for bottom-padding
          const maxEvts = Math.max(...week.map(c => Math.min((byDate[dateKey(c.date)] || []).length, 3)));
          const bottomPad = maxEvts > 0 ? maxEvts * 24 + 8 : 8;

          return (
            <div key={wi} style={{ position: "relative", display: "grid", gridTemplateColumns: "repeat(7,1fr)", borderBottom: wi < 5 ? "1px solid var(--ion-border-color)" : "none" }}>
              {/* Day cells */}
              {week.map((cell, ci) => (
                <div key={ci} style={{
                  padding: `6px 8px ${bottomPad}px`,
                  borderRight: ci < 6 ? "1px solid var(--ion-border-color)" : "none",
                  background: !cell.cur ? "rgba(0,0,0,0.024)" : "transparent",
                  minHeight: 100,
                }}>
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <div style={{
                      width: 26, height: 26,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      borderRadius: "50%", cursor: "pointer",
                      background: isToday(cell.date) ? "#E65100" : "transparent",
                    }}>
                      <span style={{
                        fontSize: "0.8rem",
                        fontWeight: isToday(cell.date) ? 800 : cell.cur ? 500 : 400,
                        color: isToday(cell.date) ? "#fff" : cell.cur ? "var(--ion-text-color)" : "var(--ion-color-medium)",
                        lineHeight: 1, userSelect: "none",
                      }}>{cell.day}</span>
                    </div>
                  </div>
                </div>
              ))}

              {/* Event pills */}
              {week.map((cell, ci) => {
                const evts = (byDate[dateKey(cell.date)] || []).slice(0, 3);
                return evts.map((p, pi) => {
                  const color = DOC_COLORS[p.documentType] || "#64748b";
                  const label = `${DOC_LABELS[p.documentType] || p.documentType} — $${(p.amount || 0).toFixed(2)}`;
                  return (
                    <div
                      key={`${dateKey(cell.date)}-${pi}`}
                      title={label}
                      style={{
                        position: "absolute",
                        top: 34 + pi * 24,
                        left: `calc(${(ci / 7) * 100}% + 3px)`,
                        width: `calc(${100 / 7}% - 6px)`,
                        height: 20,
                        background: color,
                        color: "#fff",
                        borderRadius: 4,
                        fontSize: "0.68rem",
                        fontWeight: 600,
                        padding: "0 6px",
                        display: "flex",
                        alignItems: "center",
                        overflow: "hidden",
                        whiteSpace: "nowrap",
                        cursor: "pointer",
                        zIndex: 1,
                      }}
                    >
                      {label}
                    </div>
                  );
                });
              })}
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderAgenda = () => {
    const sorted = [...monthPurchases].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    if (!sorted.length) {
      return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--ion-color-medium)", fontSize: "0.875rem" }}>
          No purchases in {MONTHS[month]} {year}
        </div>
      );
    }
    return (
      <div style={{ overflow: "auto", height: "100%", padding: "8px 0" }}>
        {sorted.map((p, i) => {
          const color = DOC_COLORS[p.documentType] || "#64748b";
          const d = new Date(p.createdAt);
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 24px", borderBottom: "1px solid var(--ion-border-color)" }}>
              <div style={{ width: 44, textAlign: "center", flexShrink: 0 }}>
                <div style={{ fontSize: "0.7rem", color: "var(--ion-color-medium)", fontWeight: 600 }}>{DAYS[d.getDay()]}</div>
                <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--ion-text-color)" }}>{d.getDate()}</div>
              </div>
              <div style={{ width: 4, height: 40, borderRadius: 2, background: color, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "0.875rem", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {DOC_LABELS[p.documentType] || p.documentType}
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--ion-color-medium)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {p.paypalEmail || p.userEmail || "—"}
                </div>
              </div>
              <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "#2dd36f", flexShrink: 0 }}>
                ${(p.amount || 0).toFixed(2)}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderWeekOrDay = () => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--ion-color-medium)", fontSize: "0.875rem" }}>
      {view.charAt(0).toUpperCase() + view.slice(1)} view coming soon
    </div>
  );

  return (
    <AdminLayout fillHeight>
      {/* Dismiss month picker on outside click */}
      {showPicker && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 99 }}
          onClick={() => setShowPicker(false)}
        />
      )}

      <div style={{ padding: 10, height: "100%", boxSizing: "border-box", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "4px 6px", position: "relative", height: "100%", display: "flex", flexDirection: "column" }}>
          <div style={{ borderRadius: 6, overflow: "hidden", boxShadow: "0 4px 24px rgba(0,0,0,0.18)", background: "var(--ion-card-background)", flex: "1 1 0%", display: "flex", flexDirection: "column" }}>

            <style>{`@media (max-width: 768px) { .cal-toprow-scroll { overflow-x: auto; scrollbar-width: thin; } }`}</style>

            {/* ── Row 1: month picker + view tabs + purchase count ── */}
            <div className="cal-toprow-scroll" style={{ flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 24px", minWidth: "max-content", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>

                  {/* Month / Year button */}
                  <div style={{ position: "relative" }}>
                    <IonButton
                      fill="clear"
                      onClick={() => setShowPicker(p => !p)}
                      style={{ fontWeight: 700, fontSize: "1rem", "--color": "var(--ion-text-color)" }}
                    >
                      {MONTHS[month]} {year}
                      <span slot="end" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", lineHeight: 0, flexShrink: 0, fontSize: "1rem" }}>
                        <IonIcon icon={chevronDownOutline} style={{ fontSize: "inherit", color: "inherit", pointerEvents: "none" }} />
                      </span>
                    </IonButton>

                    {/* Month picker popover */}
                    {showPicker && (
                      <div style={{
                        position: "absolute", top: "100%", left: 0, zIndex: 100,
                        background: "var(--ion-card-background)",
                        border: "1px solid var(--ion-border-color)",
                        borderRadius: 8, boxShadow: "0 4px 20px rgba(0,0,0,0.22)",
                        padding: 10, minWidth: 230,
                      }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, padding: "0 4px" }}>
                          <IonButton fill="clear" size="small" onClick={e => { e.stopPropagation(); setCurDate(new Date(year - 1, month, 1)); }}>‹</IonButton>
                          <span style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--ion-text-color)" }}>{year}</span>
                          <IonButton fill="clear" size="small" onClick={e => { e.stopPropagation(); setCurDate(new Date(year + 1, month, 1)); }}>›</IonButton>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 4 }}>
                          {MONTHS.map((m, i) => (
                            <button
                              key={m}
                              onClick={e => { e.stopPropagation(); setCurDate(new Date(year, i, 1)); setShowPicker(false); }}
                              style={{
                                padding: "6px 4px", borderRadius: 6, border: "none", cursor: "pointer",
                                fontSize: "0.8rem", fontWeight: i === month ? 700 : 400,
                                background: i === month ? "var(--ion-color-primary)" : "transparent",
                                color: i === month ? "#fff" : "var(--ion-text-color)",
                              }}
                            >
                              {m.slice(0, 3)}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* View segment */}
                  <IonSegment
                    mode="ios"
                    value={view}
                    onIonChange={e => setView(e.detail.value)}
                    style={{ "--background": "rgba(0,0,0,0.08)", minHeight: 34 }}
                  >
                    {["month", "week", "day", "agenda"].map(v => (
                      <IonSegmentButton key={v} value={v} layout="label-only" style={segBtnStyle}>
                        <IonLabel style={{ fontSize: "0.78rem", fontWeight: 600, whiteSpace: "nowrap", margin: "4px 0" }}>
                          {v.charAt(0).toUpperCase() + v.slice(1)}
                        </IonLabel>
                      </IonSegmentButton>
                    ))}
                  </IonSegment>
                </div>

                {/* Purchase count chip */}
                <IonButton fill="solid" size="small" color="medium" style={{ flexShrink: 0 }}>
                  {monthPurchases.length} Purchases
                </IonButton>
              </div>
            </div>

            {/* ── Row 2: prev/today/next + month revenue ── */}
            <div className="cal-toprow-scroll" style={{ flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 24px", minWidth: "max-content", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <IonButton fill="clear" shape="round" size="small" onClick={prevMonth}>
                    <span slot="icon-only" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", lineHeight: 0, flexShrink: 0, fontSize: "1rem" }}>
                      <IonIcon icon={chevronBackOutline} style={{ fontSize: "inherit", color: "inherit", pointerEvents: "none" }} />
                    </span>
                  </IonButton>
                  <IonButton fill="clear" size="small" onClick={goToday}>Today</IonButton>
                  <IonButton fill="clear" shape="round" size="small" onClick={nextMonth}>
                    <span slot="icon-only" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", lineHeight: 0, flexShrink: 0, fontSize: "1rem" }}>
                      <IonIcon icon={chevronForwardOutline} style={{ fontSize: "inherit", color: "inherit", pointerEvents: "none" }} />
                    </span>
                  </IonButton>
                </div>

                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--ion-text-color)", lineHeight: 1.3 }}>{MONTHS[month]}</div>
                  <div style={{ fontSize: "0.9rem", fontWeight: 800, color: "#2dd36f", lineHeight: 1.2 }}>
                    ${monthRevenue.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>

            {/* ── Calendar body ── */}
            <div style={{ flex: "1 1 0%", overflow: "hidden" }}>
              {loading ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
                  <IonSpinner name="crescent" />
                </div>
              ) : view === "month" ? renderMonth()
                : view === "agenda" ? renderAgenda()
                : renderWeekOrDay()}
            </div>

          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

import { useState, useEffect, useCallback, useRef, useLayoutEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  IonSegment, IonSegmentButton, IonLabel, IonIcon,
  IonButton, IonSpinner, IonPopover, IonDatetime,
  IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonContent, IonList,
  createGesture,
} from "@ionic/react";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, LineChart, Line } from "recharts";
import {
  chevronBackOutline, chevronForwardOutline, chevronDownOutline, closeOutline,
} from "ionicons/icons";
import AdminLayout from "@/components/AdminLayout";
import PurchaseDetailModal from "@/components/PurchaseDetailModal";
import AdminListItem from "@/components/AdminListItem";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";

const DOC_COLORS = {
  "paystub":               "#059669",
  "canadian-paystub":      "#059669",
  "resume":                "#2563eb",
  "w2":                    "#7c3aed",
  "w9":                    "#7c3aed",
  "1099-nec":              "#d97706",
  "1099-misc":             "#d97706",
  "bank-statement":        "#0891b2",
  "offer-letter":          "#059669",
  "cease-and-desist":      "#b91c1c",
  "power-of-attorney":     "#7c3aed",
  "commercial-lease":      "#0891b2",
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
  "bank-statement":        "Accounting Mockup",
  "offer-letter":          "Offer Letter",
  "cease-and-desist":      "Cease and Desist",
  "power-of-attorney":     "Power of Attorney",
  "commercial-lease":      "Commercial Lease",
  "vehicle-bill-of-sale":  "Bill of Sale",
  "schedule-c":            "Schedule C",
  "utility-bill":          "Utility Bill",
};

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const TRACK_MID = "translateX(-33.3333%)"; // week carousel: show the middle (current) panel

function daysInMonth(y, m) { return new Date(y, m + 1, 0).getDate(); }
function firstDayOfWeek(y, m) { return new Date(y, m, 1).getDay(); }

function dateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function isToday(d) {
  const t = new Date();
  return d.getFullYear()===t.getFullYear() && d.getMonth()===t.getMonth() && d.getDate()===t.getDate();
}

function timeAgo(iso) {
  if (!iso) return "—";
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function getInitials(email) {
  return String(email || "?").slice(0, 2).toUpperCase();
}


export default function AdminCalendar() {
  const navigate = useNavigate();
  const today = new Date();

  // The selected view is remembered as an admin preference (per browser).
  const [view, setViewState] = useState(() => {
    try { return localStorage.getItem("adminCalendarView") || "month"; } catch { return "month"; }
  });
  const setView = (v) => { setViewState(v); try { localStorage.setItem("adminCalendarView", v); } catch {} };
  const [curDate, setCurDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pickerMenu, setPickerMenu] = useState({ open: false, event: undefined });
  const [dayModal, setDayModal] = useState(null); // Date whose purchases are listed
  const [monthModalOpen, setMonthModalOpen] = useState(false);
  const [chartModalOpen, setChartModalOpen] = useState(false); // revenue charts for the view
  const [detail, setDetail] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  // Week-view swipe carousel
  const weekViewportRef = useRef(null);
  const weekTrackRef = useRef(null);
  const pendingStepRef = useRef(0);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

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

  // View-aware navigation: month view steps by month (snapped to the 1st),
  // week view by 7 days, day view by 1 day.
  const addDays = (base, n) => { const d = new Date(base); d.setDate(d.getDate() + n); return d; };
  const step = (dir) => {
    if (view === "week") setCurDate(addDays(curDate, dir * 7));
    else if (view === "day") setCurDate(addDays(curDate, dir));
    else setCurDate(new Date(year, month + dir, 1));
  };
  const prevMonth = () => step(-1);
  const nextMonth = () => step(1);
  const goToday  = () => setCurDate(view === "month"
    ? new Date(today.getFullYear(), today.getMonth(), 1)
    : new Date(today.getFullYear(), today.getMonth(), today.getDate()));

  // Smooth week-view swipe: a 3-panel carousel (prev / current / next week)
  // that follows the finger and animates the snap. On completion the week
  // steps and the track re-centers with no visible jump.
  const onWeekTransitionEnd = () => {
    const dir = pendingStepRef.current;
    if (!dir) return;
    pendingStepRef.current = 0;
    Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
    step(dir); // curDate ±7 → panels re-render, layout effect re-centers the track
  };

  // Re-center the track (no animation) whenever the week changes.
  useLayoutEffect(() => {
    const track = weekTrackRef.current;
    if (track && view === "week") { track.style.transition = "none"; track.style.transform = TRACK_MID; }
  }, [curDate, view]);

  // Attach the drag gesture while the week view is mounted. `loading` is a
  // dependency because on a fresh page load with the saved view already
  // "week", the first run happens while the spinner is up — the viewport div
  // isn't mounted yet, so we must re-attach once loading finishes.
  useEffect(() => {
    if (view !== "week" || loading) return undefined;
    const el = weekViewportRef.current;
    if (!el) return undefined;
    const gesture = createGesture({
      el,
      gestureName: "week-swipe",
      direction: "x",
      threshold: 8,
      onStart: () => { const t = weekTrackRef.current; if (t) t.style.transition = "none"; },
      onMove: (d) => { const t = weekTrackRef.current; if (t) t.style.transform = `translateX(calc(-33.3333% + ${d.deltaX}px))`; },
      onEnd: (d) => {
        const t = weekTrackRef.current; if (!t) return;
        const w = el.offsetWidth || 1;
        const min = Math.min(90, w * 0.22);
        t.style.transition = "transform 0.3s cubic-bezier(0.22, 1, 0.36, 1)";
        if (d.deltaX <= -min) { t.style.transform = "translateX(-66.6666%)"; pendingStepRef.current = 1; }
        else if (d.deltaX >= min) { t.style.transform = "translateX(0%)"; pendingStepRef.current = -1; }
        else { t.style.transform = TRACK_MID; pendingStepRef.current = 0; }
      },
    });
    gesture.enable();
    return () => gesture.destroy();
  }, [view, loading]); // eslint-disable-line

  // Week containing curDate (Sun–Sat), plus the neighbours for the swipe carousel
  const weekStart = addDays(curDate, -curDate.getDay());
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const prevWeekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i - 7));
  const nextWeekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i + 7));
  const purchasesForDate = (d) => (byDate[dateKey(d)] || []).slice().sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

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

      {/* Week rows — minmax(0,1fr) keeps all six rows the exact same height
          regardless of how many event pills a week carries */}
      <div style={{ flex: "1 1 0%", display: "grid", gridTemplateRows: "repeat(6, minmax(0, 1fr))" }}>
        {weeks.map((week, wi) => {
          return (
            <div key={wi} style={{ position: "relative", display: "grid", gridTemplateColumns: "repeat(7,1fr)", minHeight: 0, overflow: "hidden", borderBottom: wi < 5 ? "1px solid var(--ion-border-color)" : "none" }}>
              {/* Day cells — click opens the day's purchases, with ripple */}
              {week.map((cell, ci) => (
                <div key={ci}
                  className="ion-activatable"
                  onClick={() => setDayModal(cell.date)}
                  style={{
                    padding: "6px 8px",
                    borderRight: ci < 6 ? "1px solid var(--ion-border-color)" : "none",
                    background: !cell.cur ? "rgba(0,0,0,0.024)" : "transparent",
                    minHeight: 0,
                    cursor: "pointer",
                    position: "relative",
                    overflow: "hidden",
                  }}>
                  <ion-ripple-effect />
                  <div style={{ display: "flex", justifyContent: isMobile ? "center" : "flex-end" }}>
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

              {/* Events — colored dots on mobile (cells are too narrow for a
                  label), full text pills on desktop. Tapping the day opens the
                  list with full labels either way. */}
              {week.map((cell, ci) => {
                const all = byDate[dateKey(cell.date)] || [];
                if (!all.length) return null;
                if (isMobile) {
                  const dots = all.slice(0, 4);
                  return (
                    <div key={`dots-${dateKey(cell.date)}`}
                      style={{ position: "absolute", top: 34, left: `${(ci / 7) * 100}%`, width: `${100 / 7}%`,
                        display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 3, pointerEvents: "none" }}>
                      {dots.map((p, pi) => (
                        <span key={pi} style={{ width: 6, height: 6, borderRadius: "50%", background: DOC_COLORS[p.documentType] || "#64748b" }} />
                      ))}
                    </div>
                  );
                }
                return all.slice(0, 3).map((p, pi) => {
                  const color = DOC_COLORS[p.documentType] || "#64748b";
                  const label = `${DOC_LABELS[p.documentType] || p.documentType} — $${(p.amount || 0).toFixed(2)}`;
                  return (
                    <div
                      key={`${dateKey(cell.date)}-${pi}`}
                      title={label}
                      onClick={() => setDetail(p)}
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
    // Group into day sections
    const groups = [];
    sorted.forEach((p) => {
      const k = dateKey(new Date(p.createdAt));
      let g = groups.find((x) => x.key === k);
      if (!g) { g = { key: k, date: new Date(p.createdAt), items: [] }; groups.push(g); }
      g.items.push(p);
    });
    return (
      <div style={{ overflow: "auto", height: "100%" }}>
        {groups.map((g) => {
          const dayTotal = g.items.reduce((s, p) => s + (p.amount || 0), 0);
          return (
            <div key={g.key}>
              {/* Sticky day header — click opens the day modal, with ripple */}
              <div className="ion-activatable"
                onClick={() => setDayModal(g.date)}
                style={{ position: "sticky", top: 0, zIndex: 2, overflow: "hidden", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "8px 24px", background: "var(--ion-card-background)", borderBottom: "1px solid var(--ion-border-color)" }}>
                <ion-ripple-effect />
                <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--ion-text-color)" }}>
                  {isToday(g.date) ? "Today · " : ""}{g.date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                </span>
                <span style={{ fontSize: "0.78rem", fontWeight: 800, color: "#10b981" }}>${dayTotal.toFixed(2)}</span>
              </div>
              {g.items.map((p, i) => {
                const color = DOC_COLORS[p.documentType] || "#64748b";
                const d = new Date(p.createdAt);
                const email = p.email || p.paypalEmail || "—";
                return (
                  <div
                    key={i}
                    className="ion-activatable"
                    onClick={() => setDetail(p)}
                    onMouseEnter={e => (e.currentTarget.style.background = "var(--ion-color-step-50)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                    style={{ position: "relative", overflow: "hidden", display: "flex", alignItems: "center", gap: 12, padding: "10px 24px", borderBottom: "1px solid var(--ion-border-color)", cursor: "pointer", transition: "background 0.12s" }}
                  >
                    <ion-ripple-effect />
                    <div style={{ width: 52, textAlign: "center", flexShrink: 0, fontSize: "0.72rem", color: "var(--ion-color-medium)", fontWeight: 600 }}>
                      {d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                    </div>
                    <div style={{ width: 4, height: 40, borderRadius: 2, background: color, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "0.875rem", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {DOC_LABELS[p.documentType] || p.documentType}{p.quantity > 1 ? ` ×${p.quantity}` : ""}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "var(--ion-color-medium)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {email}
                      </div>
                    </div>
                    <div style={{ fontSize: "0.875rem", fontWeight: 700, color: p.refunded ? "var(--ion-color-warning)" : "#10b981", flexShrink: 0 }}>
                      ${(p.amount || 0).toFixed(2)}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    );
  };

  // ── Week view: 7 day columns, each a scrollable list of purchase pills ──
  // One week's 7 columns (reused by all three carousel panels).
  const weekColumns = (days) => (
    // minmax(0,1fr) forces truly equal columns — plain 1fr can't shrink below
    // content width, which let wide revenue text squeeze Sat/Sun into an
    // overlapping scrunch on phones.
    <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", height: "100%", minHeight: 0 }}>
      {days.map((d, ci) => {
        const evts = purchasesForDate(d);
        const dayTotal = evts.reduce((s, p) => s + (p.amount || 0), 0);
        const tdy = isToday(d);
        return (
          <div key={ci} style={{ display: "flex", flexDirection: "column", minHeight: 0, minWidth: 0, overflow: "hidden", borderRight: ci < 6 ? "1px solid var(--ion-border-color)" : "none" }}>
            {/* Column header — click opens the day modal, with ripple */}
            <div className="ion-activatable"
              onClick={() => setDayModal(d)}
              style={{ position: "relative", overflow: "hidden", cursor: "pointer", textAlign: "center", padding: "8px 4px", borderBottom: "1px solid var(--ion-border-color)", flexShrink: 0 }}>
              <ion-ripple-effect />
              <div style={{ fontSize: "0.68rem", fontWeight: 600, color: "var(--ion-color-medium)", letterSpacing: "0.04em" }}>{DAYS[d.getDay()]}</div>
              <div style={{ margin: "3px auto 0", width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", background: tdy ? "#E65100" : "transparent" }}>
                <span style={{ fontSize: "0.85rem", fontWeight: tdy ? 800 : 600, color: tdy ? "#fff" : "var(--ion-text-color)" }}>{d.getDate()}</span>
              </div>
              {/* Revenue always shown, even $0.00 */}
              <div style={{ fontSize: "0.62rem", fontWeight: 700, color: evts.length ? "#10b981" : "var(--ion-color-medium)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>${dayTotal.toFixed(2)}</div>
            </div>
            {/* Pills */}
            <div style={{ flex: "1 1 0%", overflowY: "auto", padding: "6px 4px", display: "flex", flexDirection: "column", gap: 4 }}>
              {evts.map((p, pi) => {
                const color = DOC_COLORS[p.documentType] || "#64748b";
                return (
                  <div key={pi} onClick={() => setDetail(p)} title={`${DOC_LABELS[p.documentType] || p.documentType} — $${(p.amount || 0).toFixed(2)}`}
                    style={{ background: color, color: "#fff", borderRadius: 4, fontSize: "0.66rem", fontWeight: 600, padding: "3px 6px", cursor: "pointer", lineHeight: 1.25 }}>
                    <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{DOC_LABELS[p.documentType] || p.documentType}</div>
                    <div style={{ opacity: 0.9 }}>${(p.amount || 0).toFixed(2)}</div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderWeek = () => (
    <div ref={weekViewportRef} style={{ height: "100%", overflow: "hidden", position: "relative", touchAction: "pan-y" }}>
      <div ref={weekTrackRef} onTransitionEnd={onWeekTransitionEnd}
        style={{ display: "flex", height: "100%", width: "300%", transform: TRACK_MID, willChange: "transform" }}>
        <div style={{ width: "33.3333%", flexShrink: 0, height: "100%" }}>{weekColumns(prevWeekDays)}</div>
        <div style={{ width: "33.3333%", flexShrink: 0, height: "100%" }}>{weekColumns(weekDays)}</div>
        <div style={{ width: "33.3333%", flexShrink: 0, height: "100%" }}>{weekColumns(nextWeekDays)}</div>
      </div>
    </div>
  );

  // ── Day view: condensed agenda-style list of the selected day's purchases ──
  const renderDay = () => {
    const evts = purchasesForDate(curDate);
    const dayTotal = evts.reduce((s, p) => s + (p.amount || 0), 0);
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 24px", borderBottom: "1px solid var(--ion-border-color)", flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--ion-color-medium)" }}>{DAYS[curDate.getDay()]}</div>
            <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--ion-text-color)" }}>
              {curDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "0.72rem", color: "var(--ion-color-medium)" }}>{evts.length} purchase{evts.length === 1 ? "" : "s"}</div>
            <div style={{ fontSize: "1rem", fontWeight: 800, color: "#10b981" }}>${dayTotal.toFixed(2)}</div>
          </div>
        </div>
        {evts.length === 0 ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: "1 1 0%", color: "var(--ion-color-medium)", fontSize: "0.875rem" }}>
            No purchases on this day
          </div>
        ) : (
          <div style={{ overflowY: "auto", flex: "1 1 0%" }}>
            {evts.map((p, i) => {
              const color = DOC_COLORS[p.documentType] || "#64748b";
              const d = new Date(p.createdAt);
              const email = p.email || p.paypalEmail || "—";
              return (
                <div key={i} onClick={() => setDetail(p)}
                  className="ion-activatable"
                  onMouseEnter={e => (e.currentTarget.style.background = "var(--ion-color-step-50)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  style={{ position: "relative", overflow: "hidden", display: "flex", alignItems: "center", gap: 12, padding: "10px 24px", borderBottom: "1px solid var(--ion-border-color)", cursor: "pointer", transition: "background 0.12s" }}>
                  <ion-ripple-effect />
                  <div style={{ width: 52, textAlign: "center", flexShrink: 0, fontSize: "0.72rem", color: "var(--ion-color-medium)", fontWeight: 600 }}>
                    {d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                  </div>
                  <div style={{ width: 4, height: 40, borderRadius: 2, background: color, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "0.875rem", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {DOC_LABELS[p.documentType] || p.documentType}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--ion-color-medium)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{email}</div>
                  </div>
                  <div style={{ fontSize: "0.875rem", fontWeight: 700, color: p.refunded ? "var(--ion-color-warning)" : "#10b981", flexShrink: 0 }}>
                    ${(p.amount || 0).toFixed(2)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <AdminLayout fillHeight>
      <div style={{ padding: 10, height: "100%", boxSizing: "border-box", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "4px 6px", position: "relative", height: "100%", display: "flex", flexDirection: "column" }}>
          <div style={{ borderRadius: 6, overflow: "hidden", boxShadow: "0 4px 24px rgba(0,0,0,0.18)", background: "var(--ion-card-background)", flex: "1 1 0%", display: "flex", flexDirection: "column" }}>

            <style>{`@media (max-width: 768px) { .cal-toprow-scroll { overflow-x: auto; scrollbar-width: thin; } }`}</style>

            {/* ── Row 1: month picker + view tabs + purchase count ── */}
            <div className="cal-toprow-scroll" style={{ flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 24px", minWidth: "max-content", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>

                  {/* Month / Year button — opens the Ionic month-year wheels
                      (same picker the /app date inputs use, fresh-mounted) */}
                  <IonButton
                    fill="clear"
                    onClick={(e) => setPickerMenu({ open: true, event: e.nativeEvent })}
                    style={{ fontWeight: 700, fontSize: "1rem", "--color": "var(--ion-text-color)" }}
                  >
                    {MONTHS[month]} {year}
                    <span slot="end" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", lineHeight: 0, flexShrink: 0, fontSize: "1rem" }}>
                      <IonIcon icon={chevronDownOutline} style={{ fontSize: "inherit", color: "inherit", pointerEvents: "none" }} />
                    </span>
                  </IonButton>
                  {pickerMenu.open && (
                    <IonPopover
                      isOpen={true}
                      event={pickerMenu.event}
                      onDidDismiss={() => setPickerMenu({ open: false, event: undefined })}
                      side="bottom"
                      alignment="start"
                      style={{ "--width": "auto" }}
                    >
                      <IonDatetime
                        presentation="month-year"
                        value={`${year}-${String(month + 1).padStart(2, "0")}-01`}
                        onIonChange={(e) => {
                          const v = e.detail.value;
                          if (typeof v === "string" && v) {
                            const [yy, mm] = v.split("-").map(Number);
                            if (yy && mm) setCurDate(new Date(yy, mm - 1, 1));
                          }
                        }}
                      />
                    </IonPopover>
                  )}

                  {/* View segment — stock Ionic segment in iOS mode, untouched */}
                  <IonSegment mode="ios" value={view} onIonChange={e => setView(e.detail.value)}>
                    {["month", "week", "day", "agenda"].map(v => (
                      <IonSegmentButton key={v} value={v}>
                        <IonLabel>{v.charAt(0).toUpperCase() + v.slice(1)}</IonLabel>
                      </IonSegmentButton>
                    ))}
                  </IonSegment>
                </div>

                {/* Purchase count chip — opens the month's purchase list */}
                <IonButton fill="solid" size="small" color="dark" style={{ flexShrink: 0 }}
                  onClick={() => setMonthModalOpen(true)}>
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

                {(() => {
                  // Context label + revenue for the current view
                  let ctxLabel, ctxRevenue;
                  if (view === "week") {
                    const wEnd = weekDays[6];
                    const sameMonth = weekStart.getMonth() === wEnd.getMonth();
                    ctxLabel = sameMonth
                      ? `${MONTHS[weekStart.getMonth()].slice(0, 3)} ${weekStart.getDate()}–${wEnd.getDate()}`
                      : `${MONTHS[weekStart.getMonth()].slice(0, 3)} ${weekStart.getDate()} – ${MONTHS[wEnd.getMonth()].slice(0, 3)} ${wEnd.getDate()}`;
                    ctxRevenue = weekDays.reduce((s, d) => s + purchasesForDate(d).reduce((t, p) => t + (p.amount || 0), 0), 0);
                  } else if (view === "day") {
                    ctxLabel = `${MONTHS[curDate.getMonth()].slice(0, 3)} ${curDate.getDate()}`;
                    ctxRevenue = purchasesForDate(curDate).reduce((t, p) => t + (p.amount || 0), 0);
                  } else {
                    ctxLabel = MONTHS[month];
                    ctxRevenue = monthRevenue;
                  }
                  return (
                    <div className="ion-activatable" onClick={() => setChartModalOpen(true)}
                      title="View revenue charts"
                      style={{ position: "relative", overflow: "hidden", textAlign: "center", cursor: "pointer", padding: "4px 14px", borderRadius: 8 }}>
                      <ion-ripple-effect />
                      <div style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--ion-text-color)", lineHeight: 1.3 }}>{ctxLabel}</div>
                      <div style={{ fontSize: "0.9rem", fontWeight: 800, color: "#10b981", lineHeight: 1.2 }}>
                        ${ctxRevenue.toFixed(2)}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* ── Calendar body ── */}
            <div style={{ flex: "1 1 0%", overflow: "hidden" }}>
              {loading ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
                  <IonSpinner name="crescent" />
                </div>
              ) : view === "month" ? renderMonth()
                : view === "week" ? renderWeek()
                : view === "day" ? renderDay()
                : renderAgenda()}
            </div>

          </div>
        </div>
      </div>

      {/* ── Day / month purchases modal — the purchases page, scoped ── */}
      {(dayModal || monthModalOpen) && (() => {
        const list = dayModal
          ? (byDate[dateKey(dayModal)] || []).slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          : [...monthPurchases].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        const label = dayModal
          ? dayModal.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })
          : `${MONTHS[month]} ${year}`;
        const total = list.reduce((s, p) => s + (p.amount || 0), 0);
        const close = () => { setDayModal(null); setMonthModalOpen(false); };
        const tdBase = { padding: "10px 12px", borderBottom: "1px solid var(--ion-border-color)", verticalAlign: "middle" };
        const fmtDate = (iso) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
        return (
          <IonModal
            isOpen={true}
            onDidDismiss={close}
            className="admin-detail-modal admin-day-modal"
          >
            <IonHeader>
              <IonToolbar>
                <IonTitle>{label}</IonTitle>
                <IonButtons slot="end">
                  <IonButton onClick={close} aria-label="Close">
                    <IonIcon icon={closeOutline} slot="icon-only" />
                  </IonButton>
                </IonButtons>
              </IonToolbar>
            </IonHeader>
            <IonContent>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px 4px" }}>
                <span style={{ fontSize: "0.8rem", color: "var(--ion-color-medium)" }}>
                  {list.length} purchase{list.length === 1 ? "" : "s"}
                </span>
                <span style={{ fontSize: "0.9rem", fontWeight: 800, color: "#10b981" }}>${total.toFixed(2)}</span>
              </div>
              {list.length === 0 ? (
                <div style={{ textAlign: "center", padding: "48px 12px", color: "var(--ion-color-medium)", fontSize: "0.875rem" }}>
                  No purchases found
                </div>
              ) : isMobile ? (
                /* Condensed whodat-style rows, same as the purchases page */
                <IonList lines="full" style={{ background: "transparent", padding: 0 }}>
                  {list.map((p) => {
                    const email = p.email || p.paypalEmail || "N/A";
                    const docLabel = DOC_LABELS[p.documentType] || p.documentType || "-";
                    const qty = p.quantity > 1 ? ` ×${p.quantity}` : "";
                    return (
                      <AdminListItem
                        key={p.id}
                        onClick={() => setDetail(p)}
                        start={
                          <div style={{ width: 34, height: 34, borderRadius: "50%", background: "var(--ion-color-primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <span style={{ fontSize: "0.65rem", color: "#fff", fontWeight: 700 }}>{getInitials(email)}</span>
                          </div>
                        }
                        title={`$${Number(p.amount || 0).toFixed(2)}`}
                        badges={<>
                          {p.refunded
                            ? <span className="admin-badge admin-badge-amber">Refunded</span>
                            : <span className="admin-badge admin-badge-green">Paid</span>}
                          {!p.userId && <span className="admin-badge admin-badge-slate">Guest</span>}
                        </>}
                        subtitle={email}
                        meta={[`${docLabel}${qty}`, fmtDate(p.createdAt), timeAgo(p.createdAt)].filter(Boolean).join(" · ")}
                      />
                    );
                  })}
                </IonList>
              ) : (
                <div style={{ overflowX: "auto", padding: "0 4px 16px" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 560 }}>
                    <thead>
                      <tr>
                        {["Age", "Customer", "Document", "Amount", "Status"].map((h) => (
                          <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontSize: "0.72rem", fontWeight: 400, color: "var(--ion-color-medium)", background: "var(--ion-background-color)", whiteSpace: "nowrap" }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {list.map((p) => {
                        const email = p.email || p.paypalEmail || "N/A";
                        const docLabel = DOC_LABELS[p.documentType] || p.documentType || "-";
                        const qty = p.quantity > 1 ? ` ×${p.quantity}` : "";
                        return (
                          <tr key={p.id} onClick={() => setDetail(p)} style={{ position: "relative", transform: "translateZ(0)", height: 56, cursor: "pointer" }}>
                            {/* Age — hosts the row-wide ripple overlay (same
                                pattern as the purchases page table) */}
                            <td style={tdBase}>
                              <div
                                className="ion-activatable"
                                style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "100%", overflow: "hidden", zIndex: 1 }}
                              >
                                <ion-ripple-effect />
                              </div>
                              <span style={{ fontSize: "0.75rem", color: "var(--ion-color-medium)", whiteSpace: "nowrap" }}>{timeAgo(p.createdAt)}</span>
                            </td>
                            <td style={{ ...tdBase, minWidth: 170 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <div style={{ width: 26, height: 26, borderRadius: "50%", background: "var(--ion-color-primary)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                  <span style={{ fontSize: "0.58rem", color: "#fff", fontWeight: 700 }}>{getInitials(email)}</span>
                                </div>
                                <span style={{ fontSize: "0.75rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 160 }}>{email}</span>
                              </div>
                            </td>
                            <td style={tdBase}>
                              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: "0.78rem", whiteSpace: "nowrap" }}>
                                <span style={{ width: 8, height: 8, borderRadius: "50%", background: DOC_COLORS[p.documentType] || "#64748b", display: "inline-block" }} />
                                {docLabel}{qty}
                              </span>
                            </td>
                            <td style={tdBase}>
                              <span style={{ fontSize: "0.875rem", fontWeight: 700, whiteSpace: "nowrap", color: p.refunded ? "var(--ion-color-warning)" : "var(--ion-color-success)" }}>
                                ${Number(p.amount || 0).toFixed(2)}
                              </span>
                            </td>
                            <td style={tdBase}>
                              {p.refunded
                                ? <span className="admin-badge admin-badge-amber">Refunded</span>
                                : <span className="admin-badge admin-badge-green">Paid</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </IonContent>
          </IonModal>
        );
      })()}

      {/* ── Revenue charts modal — full screen, comparing the current view's
          period against the previous one (month vs last month, week vs last
          week, day vs yesterday). ── */}
      {chartModalOpen && (() => {
        const sum = (arr) => arr.reduce((s, p) => s + (p.amount || 0), 0);
        let title, bars, periodPurchases, prevPurchases, curName, prevName;
        if (view === "week") {
          const wEnd = weekDays[6];
          const prevWeek = weekDays.map((d) => addDays(d, -7));
          title = `Revenue · ${MONTHS[weekStart.getMonth()].slice(0, 3)} ${weekStart.getDate()}–${wEnd.getDate()}`;
          curName = "This week"; prevName = "Last week";
          periodPurchases = weekDays.flatMap((d) => purchasesForDate(d));
          prevPurchases = prevWeek.flatMap((d) => purchasesForDate(d));
          bars = weekDays.map((d, i) => ({
            label: `${DAYS[d.getDay()]} ${d.getDate()}`,
            revenue: sum(purchasesForDate(d)),
            prev: sum(purchasesForDate(prevWeek[i])),
          }));
        } else if (view === "day") {
          const prevDay = addDays(curDate, -1);
          title = `Revenue · ${curDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
          curName = "Today"; prevName = "Yesterday";
          periodPurchases = purchasesForDate(curDate);
          prevPurchases = purchasesForDate(prevDay);
          const cur = {}, prv = {};
          periodPurchases.forEach((p) => { const k = DOC_LABELS[p.documentType] || p.documentType || "Other"; cur[k] = (cur[k] || 0) + (p.amount || 0); });
          prevPurchases.forEach((p) => { const k = DOC_LABELS[p.documentType] || p.documentType || "Other"; prv[k] = (prv[k] || 0) + (p.amount || 0); });
          bars = [...new Set([...Object.keys(cur), ...Object.keys(prv)])]
            .map((label) => ({ label, revenue: cur[label] || 0, prev: prv[label] || 0 }));
        } else {
          const pm = month === 0 ? 11 : month - 1;
          const py = month === 0 ? year - 1 : year;
          const prevDim = daysInMonth(py, pm);
          title = `Revenue · ${MONTHS[month]} ${year}`;
          curName = "This month"; prevName = "Last month";
          periodPurchases = monthPurchases;
          prevPurchases = Array.from({ length: prevDim }, (_, i) => byDate[dateKey(new Date(py, pm, i + 1))] || []).flat();
          bars = Array.from({ length: Math.max(dim, prevDim) }, (_, i) => {
            const day = i + 1;
            return {
              label: String(day),
              revenue: day <= dim ? sum(byDate[dateKey(new Date(year, month, day))] || []) : 0,
              prev: day <= prevDim ? sum(byDate[dateKey(new Date(py, pm, day))] || []) : 0,
            };
          });
        }

        // Cumulative revenue race: current vs previous period. The day view
        // accumulates by hour; week/month accumulate across the bars.
        let cumData;
        if (view === "day") {
          const hourRev = (list, h) => sum(list.filter((p) => new Date(p.createdAt).getHours() === h));
          let a = 0, b = 0;
          cumData = Array.from({ length: 24 }, (_, h) => {
            a += hourRev(periodPurchases, h); b += hourRev(prevPurchases, h);
            return { label: `${h}:00`, current: +a.toFixed(2), previous: +b.toFixed(2) };
          });
        } else {
          let a = 0, b = 0;
          cumData = bars.map((r) => {
            a += r.revenue; b += r.prev;
            return { label: r.label, current: +a.toFixed(2), previous: +b.toFixed(2) };
          });
        }

        const totalRev = sum(periodPurchases), prevRev = sum(prevPurchases);
        const count = periodPurchases.length, prevCount = prevPurchases.length;
        const avg = count ? totalRev / count : 0, prevAvg = prevCount ? prevRev / prevCount : 0;
        const empty = !bars.length || bars.every((r) => r.revenue === 0 && r.prev === 0);
        const close = () => setChartModalOpen(false);
        const card = { background: "var(--ion-color-step-50)", borderRadius: 10, padding: "12px", textAlign: "center" };
        const chartCard = { background: "var(--ion-color-step-50)", borderRadius: 12, padding: "14px 12px 8px" };
        const sectionLabel = { fontSize: "0.72rem", fontWeight: 600, color: "var(--ion-color-medium)", margin: "0 0 8px 4px" };
        const tooltipStyle = { background: "var(--ion-card-background)", border: "1px solid var(--ion-border-color)", borderRadius: 8, color: "var(--ion-text-color)" };
        // Change vs the previous period, shown under each summary number
        const DeltaChip = ({ cur, prev, money }) => {
          if (!prev) {
            return <div style={{ fontSize: "0.66rem", color: "var(--ion-color-medium)", marginTop: 2 }}>— vs {prevName.toLowerCase()}</div>;
          }
          const pct = ((cur - prev) / prev) * 100;
          const up = pct >= 0;
          return (
            <div style={{ fontSize: "0.66rem", fontWeight: 700, color: up ? "#10b981" : "#ef4444", marginTop: 2 }}>
              {up ? "▲" : "▼"} {Math.abs(pct).toFixed(0)}% vs {prevName.toLowerCase()} ({money ? `$${prev.toFixed(2)}` : prev})
            </div>
          );
        };
        return (
          <IonModal isOpen={true} onDidDismiss={close} className="admin-detail-modal admin-fullscreen-modal">
            <IonHeader>
              <IonToolbar>
                <IonTitle>{title}</IonTitle>
                <IonButtons slot="end">
                  <IonButton onClick={close} aria-label="Close">
                    <IonIcon icon={closeOutline} slot="icon-only" />
                  </IonButton>
                </IonButtons>
              </IonToolbar>
            </IonHeader>
            <IonContent>
              <div style={{ padding: 16, maxWidth: 1400, margin: "0 auto" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 16 }}>
                  <div style={card}>
                    <div style={{ fontSize: "0.68rem", color: "var(--ion-color-medium)" }}>Revenue</div>
                    <div style={{ fontSize: "1.05rem", fontWeight: 800, color: "#10b981" }}>${totalRev.toFixed(2)}</div>
                    <DeltaChip cur={totalRev} prev={prevRev} money />
                  </div>
                  <div style={card}>
                    <div style={{ fontSize: "0.68rem", color: "var(--ion-color-medium)" }}>Purchases</div>
                    <div style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--ion-text-color)" }}>{count}</div>
                    <DeltaChip cur={count} prev={prevCount} />
                  </div>
                  <div style={card}>
                    <div style={{ fontSize: "0.68rem", color: "var(--ion-color-medium)" }}>Avg / sale</div>
                    <div style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--ion-text-color)" }}>${avg.toFixed(2)}</div>
                    <DeltaChip cur={avg} prev={prevAvg} money />
                  </div>
                </div>

                {/* Side-by-side on wide screens, stacked when narrow */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(460px, 100%), 1fr))", gap: 14 }}>
                  <div style={chartCard}>
                    <div style={sectionLabel}>
                      {view === "day" ? "Revenue by document" : "Revenue by day"} — {curName.toLowerCase()} vs {prevName.toLowerCase()}
                    </div>
                    <div style={{ width: "100%", height: 320 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={bars} margin={{ top: 8, right: 8, left: -8, bottom: 8 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.22)" vertical={false} />
                          <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94a3b8" }} interval={view === "month" ? "preserveStartEnd" : 0}
                            angle={view === "day" ? -20 : 0} textAnchor={view === "day" ? "end" : "middle"} height={view === "day" ? 60 : 24} />
                          <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} width={52} tickFormatter={(v) => `$${v}`} />
                          <Tooltip
                            cursor={{ fill: "rgba(16,185,129,0.08)" }}
                            contentStyle={tooltipStyle}
                            formatter={(v, name) => [`$${Number(v).toFixed(2)}`, name]}
                          />
                          <Legend wrapperStyle={{ fontSize: 12 }} />
                          <Bar dataKey="prev" name={prevName} fill="#94a3b8" fillOpacity={0.55} radius={[4, 4, 0, 0]} />
                          <Bar dataKey="revenue" name={curName} fill="#10b981" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div style={chartCard}>
                    <div style={sectionLabel}>
                      Cumulative revenue — {curName.toLowerCase()} vs {prevName.toLowerCase()}{view === "day" ? " (by hour)" : ""}
                    </div>
                    <div style={{ width: "100%", height: 320 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={cumData} margin={{ top: 8, right: 8, left: -8, bottom: 8 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.22)" vertical={false} />
                          <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94a3b8" }} interval="preserveStartEnd" />
                          <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} width={52} tickFormatter={(v) => `$${v}`} />
                          <Tooltip contentStyle={tooltipStyle} formatter={(v, name) => [`$${Number(v).toFixed(2)}`, name]} />
                          <Legend wrapperStyle={{ fontSize: 12 }} />
                          <Line type="monotone" dataKey="previous" name={prevName} stroke="#94a3b8" strokeWidth={2} strokeDasharray="6 4" dot={false} />
                          <Line type="monotone" dataKey="current" name={curName} stroke="#10b981" strokeWidth={2.5} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {empty && (
                  <div style={{ textAlign: "center", color: "var(--ion-color-medium)", fontSize: "0.85rem", marginTop: 12 }}>
                    No revenue in this period or the previous one
                  </div>
                )}
              </div>
            </IonContent>
          </IonModal>
        );
      })()}

      {/* ── Payment detail modal (whodat admin payments style) ── */}
      <PurchaseDetailModal
        purchase={detail}
        onClose={() => setDetail(null)}
        onRefunded={(p, amount) => {
          setPurchases(prev => prev.map(x => x.id === p.id ? { ...x, refunded: true, refundedAmount: amount } : x));
          setDetail(d => (d ? { ...d, refunded: true, refundedAmount: amount } : d));
        }}
        onViewAll={() => { setDetail(null); navigate("/admin/purchases"); }}
      />
    </AdminLayout>
  );
}

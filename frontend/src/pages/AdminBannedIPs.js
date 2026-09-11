import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  IonSegment, IonSegmentButton, IonLabel, IonButton, IonIcon, IonList, IonSpinner,
  IonHeader, IonToolbar, IonTitle, IonButtons, IonInput,
} from "@ionic/react";
import {
  shieldOutline, addOutline, refreshOutline,
  alertCircleOutline, closeOutline, globeOutline,
} from "ionicons/icons";
import { toast } from "@/utils/toast";
import AdminLayout from "@/components/AdminLayout";
import AdminDetailModal from "@/components/AdminDetailModal";
import AdminListItem from "@/components/AdminListItem";
import { confirmAlert } from "@/utils/confirmAlert";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";

const segBtnStyle = {
  "--border-radius":   "0",
  "--padding-top":     "0",
  "--padding-bottom":  "0",
};

const IPV4_RE = /^(\d{1,3}\.){3}\d{1,3}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const banValue = (b) => b.ip || b.email || "—";
const banType = (b) => (b.email ? "Email" : "IP");

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleString();
}

const thStyle = {
  padding: "10px 12px",
  textAlign: "left",
  fontSize: "0.72rem",
  fontWeight: 500,
  color: "var(--ion-color-medium)",
  background: "var(--ion-background-color)",
  whiteSpace: "nowrap",
  borderBottom: "1px solid var(--ion-border-color)",
  position: "sticky",
  top: 0,
  zIndex: 1,
};

// Cells stay unpositioned so the row-wide ripple overlay (inside the first
// cell) resolves its 100% width/height against the position:relative <tr>.
const tdStyle = {
  padding: "0 12px",
  fontSize: "0.82rem",
  color: "var(--ion-text-color)",
  borderBottom: "1px solid var(--ion-border-color)",
};

export default function AdminBannedIPs() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminToken,      setAdminToken]      = useState(null);
  const [bannedIps,       setBannedIps]       = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [segment,         setSegment]         = useState("active");
  const [detail,          setDetail]          = useState(null);
  const [isMobile,        setIsMobile]        = useState(window.innerWidth < 768);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  const [isDialogOpen,    setIsDialogOpen]    = useState(false);
  const [newValue,        setNewValue]        = useState("");
  const [newReason,       setNewReason]       = useState("");
  const [isAdding,        setIsAdding]        = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) { navigate("/admin/login"); return; }
    verifyAdminSession(token);
  }, [navigate]); // eslint-disable-line

  const verifyAdminSession = async (token) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/verify`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setAdminToken(token);
        setIsAuthenticated(true);
        fetchBannedIps(token);
      } else {
        localStorage.removeItem("adminToken");
        navigate("/admin/login");
      }
    } catch {
      localStorage.removeItem("adminToken");
      navigate("/admin/login");
    }
  };

  const fetchBannedIps = async (token) => {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/banned-ips`, {
        headers: { Authorization: `Bearer ${token || adminToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setBannedIps(data.bannedIps || []);
      } else {
        toast.error("Failed to fetch the ban list");
      }
    } catch {
      toast.error("Error fetching the ban list");
    } finally {
      setLoading(false);
    }
  };

  // Bans an IP or an email (the input accepts either)
  const ban = async (rawValue, rawReason) => {
    const value = (rawValue ?? newValue).trim();
    const reason = ((rawReason ?? newReason) || "").trim();
    if (!value) { toast.error("Enter an IP address or an email address"); return; }
    const isIp = IPV4_RE.test(value);
    const isEmail = EMAIL_RE.test(value);
    if (!isIp && !isEmail) {
      toast.error("Enter a valid IPv4 address (e.g. 192.168.1.1) or email address");
      return;
    }
    setIsAdding(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/banned-ips`, {
        method: "POST",
        headers: { Authorization: `Bearer ${adminToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ ...(isIp ? { ip: value } : { email: value.toLowerCase() }), reason: reason || null }),
      });
      if (res.ok) {
        toast.success(`${value} has been banned`);
        closeDialog();
        setDetail(null);
        fetchBannedIps();
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.detail || "Failed to add the ban");
      }
    } catch {
      toast.error("Error adding the ban");
    } finally {
      setIsAdding(false);
    }
  };

  const unban = async (value) => {
    if (!(await confirmAlert({ header: `Unban ${value}?`, message: "This removes the ban immediately.", confirmText: "Unban" }))) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/banned-ips/${encodeURIComponent(value)}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (res.ok) {
        toast.success(`${value} has been unbanned`);
        setDetail(null);
        fetchBannedIps();
      } else {
        toast.error("Failed to remove the ban");
      }
    } catch {
      toast.error("Error removing the ban");
    }
  };

  const closeDialog = () => { setIsDialogOpen(false); setNewValue(""); setNewReason(""); };

  if (!isAuthenticated) return null;

  const activeIps   = bannedIps.filter(ip =>  ip.isActive);
  const inactiveIps = bannedIps.filter(ip => !ip.isActive);
  const rows        = segment === "active" ? activeIps : inactiveIps;

  return (
    <AdminLayout fillHeight>
      <div style={{ padding: 10, height: "100%", boxSizing: "border-box", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: "4px 6px" }}>
          <div style={{ display: "flex", flexDirection: "column", flex: "1 1 0%", overflow: "hidden", background: "var(--ion-card-background)", borderRadius: 6, boxShadow: "0 4px 24px rgba(0,0,0,0.18)" }}>

            {/* ── header ── */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 24px", flexShrink: 0, borderBottom: "1px solid var(--ion-border-color)" }}>
              <div>
                <h2 style={{ margin: "0 0 2px", fontWeight: 700, fontSize: "1.05rem", color: "var(--ion-text-color)", letterSpacing: "-0.01em" }}>
                  Banned
                </h2>
                <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--ion-color-medium)" }}>
                  {activeIps.length} active · {inactiveIps.length} previously unbanned
                </p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <IonButton fill="clear" color="medium" size="small" onClick={() => fetchBannedIps()} style={{ "--border-radius": "50%" }}>
                  <IonIcon slot="icon-only" icon={refreshOutline} style={{ fontSize: 18 }} />
                </IonButton>
                <IonButton color="danger" size="small" onClick={() => setIsDialogOpen(true)} style={{ "--border-radius": "8px" }}>
                  <IonIcon slot="start" icon={addOutline} style={{ fontSize: 16 }} />
                  Ban
                </IonButton>
              </div>
            </div>

            {/* ── segment tabs ── */}
            <div style={{ display: "flex", alignItems: "stretch", background: "var(--ion-card-background)", borderBottom: "1px solid var(--ion-border-color)", flexShrink: 0 }}>
              <IonSegment
                scrollable
                value={segment}
                onIonChange={e => setSegment(e.detail.value)}
                style={{ "--background": "transparent", flex: "1 1 0%" }}
              >
                {[
                  { value: "active",   label: "Active Bans",          count: activeIps.length },
                  { value: "inactive", label: "Previously Unbanned",   count: inactiveIps.length },
                ].map(tab => (
                  <IonSegmentButton key={tab.value} value={tab.value} layout="label-only" style={segBtnStyle}>
                    <IonLabel style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700, letterSpacing: "0.06em", whiteSpace: "nowrap" }}>
                      {tab.label}
                      <span style={{ background: "var(--ion-background-color)", borderRadius: 4, padding: "1px 6px", fontSize: "0.65rem", fontWeight: 700, color: "var(--ion-color-medium)" }}>
                        {tab.count}
                      </span>
                    </IonLabel>
                  </IonSegmentButton>
                ))}
              </IonSegment>
            </div>

            {/* ── list ── */}
            <div style={{ flex: "1 1 0%", overflow: "auto" }}>
              {loading ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
                  <IonSpinner name="crescent" color="primary" style={{ width: 32, height: 32 }} />
                </div>
              ) : rows.length === 0 ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 10, color: "var(--ion-color-medium)" }}>
                  <IonIcon icon={segment === "active" ? shieldOutline : globeOutline} style={{ fontSize: 40 }} />
                  <span style={{ fontSize: "0.875rem" }}>
                    {segment === "active" ? "Nothing is currently banned" : "No previously unbanned entries"}
                  </span>
                  {segment === "active" && (
                    <IonButton size="small" fill="outline" color="danger" onClick={() => setIsDialogOpen(true)}>
                      <IonIcon slot="start" icon={addOutline} />Ban an IP or email
                    </IonButton>
                  )}
                </div>
              ) : isMobile ? (
                /* Condensed purchases-style rows — tap opens the detail modal
                   where the unban/re-ban actions live */
                <IonList lines="full" style={{ background: "transparent", padding: 0 }}>
                  {rows.map(banned => (
                    <AdminListItem
                      key={banned.id}
                      onClick={() => setDetail(banned)}
                      title={<span style={{ fontFamily: "monospace" }}>{banValue(banned)}</span>}
                      badges={<span className="admin-badge admin-badge-slate" style={{ marginLeft: 6 }}>{banType(banned)}</span>}
                      subtitle={banned.reason || "—"}
                      meta={`${segment === "active" ? "Banned" : "Unbanned"} ${formatDate(segment === "active" ? banned.bannedAt : banned.unbannedAt)}`}
                    />
                  ))}
                </IonList>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 600 }}>
                    <thead>
                      <tr>
                        <th style={{ ...thStyle, width: 220 }}>IP / Email</th>
                        <th style={{ ...thStyle, width: 90 }}>Type</th>
                        <th style={thStyle}>Reason</th>
                        <th style={{ ...thStyle, width: 180 }}>{segment === "active" ? "Banned At" : "Unbanned At"}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map(banned => (
                        <tr key={banned.id} style={{ position: "relative", height: 56, transform: "translateZ(0)", cursor: "pointer" }}>
                          {/* Value — also hosts the row-wide click/ripple overlay */}
                          <td style={tdStyle}>
                            <div
                              className="ion-activatable"
                              onClick={() => setDetail(banned)}
                              style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "100%", overflow: "hidden", cursor: "pointer", zIndex: 1 }}
                            >
                              <ion-ripple-effect />
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <div style={{
                                width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
                                background: segment === "active" ? "var(--ion-color-danger)" : "var(--ion-color-success)",
                              }} />
                              <span style={{ fontFamily: "monospace", fontWeight: 600, fontSize: "0.85rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 190 }}>{banValue(banned)}</span>
                            </div>
                          </td>
                          <td style={tdStyle}>
                            <span className="admin-badge admin-badge-slate">{banType(banned)}</span>
                          </td>
                          <td style={{ ...tdStyle, color: "var(--ion-color-medium)", fontSize: "0.8rem" }}>
                            {banned.reason || "—"}
                          </td>
                          <td style={{ ...tdStyle, color: "var(--ion-color-medium)", fontSize: "0.78rem" }}>
                            {segment === "active" ? formatDate(banned.bannedAt) : formatDate(banned.unbannedAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* ── Ban detail modal (purchases style) — unban / re-ban live here ── */}
      <AdminDetailModal
        isOpen={!!detail}
        onClose={() => setDetail(null)}
        title={detail ? banValue(detail) : "Ban"}
        rows={detail ? [
          ["Value", <span style={{ fontFamily: "monospace", fontSize: "0.85rem" }}>{banValue(detail)}</span>],
          ["Type", <span className="admin-badge admin-badge-slate">{banType(detail)} address</span>],
          ["Status", detail.isActive
            ? <span className="admin-badge admin-badge-red">Active ban</span>
            : <span className="admin-badge admin-badge-green">Unbanned</span>],
          ["Reason", detail.reason || "—"],
          ["Banned At", formatDate(detail.bannedAt)],
          !detail.isActive && ["Unbanned At", formatDate(detail.unbannedAt)],
        ] : []}
      >
        {detail && (
          detail.isActive ? (
            <IonButton expand="block" color="success" onClick={() => unban(banValue(detail))}>
              Unban
            </IonButton>
          ) : (
            <IonButton expand="block" color="danger" onClick={() => ban(banValue(detail), detail.reason || "")} disabled={isAdding}>
              {isAdding ? "Banning…" : "Re-ban"}
            </IonButton>
          )
        )}
      </AdminDetailModal>

      {/* ── Ban modal — same portalled slide-up style as the /app paystub
          modals: full-screen on mobile, centered card on desktop ── */}
      {isDialogOpen && createPortal(
        <div className="modal-backdrop" style={{ position: "fixed", inset: 0, zIndex: 10001, background: window.innerWidth >= 768 ? "rgba(0,0,0,0.5)" : "var(--ion-background-color, #f2f2f7)", display: "flex", alignItems: window.innerWidth >= 768 ? "center" : "stretch", justifyContent: window.innerWidth >= 768 ? "center" : "stretch" }}>
          <div className="modal-slide-up" style={{ background: "var(--ion-background-color, #f2f2f7)", color: "var(--ion-text-color)", display: "flex", flexDirection: "column", width: "100%", maxWidth: window.innerWidth >= 768 ? 600 : "100%", height: window.innerWidth >= 768 ? "auto" : "100%", maxHeight: window.innerWidth >= 768 ? "90vh" : "100%", overflow: "hidden" }}>
            <IonHeader>
              <IonToolbar style={{ "--background": "var(--ion-card-background)", "--color": "var(--ion-text-color)" }}>
                <IonButtons slot="start">
                  <IonButton fill="clear" shape="round" onClick={closeDialog}>
                    <span slot="icon-only" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", lineHeight: 0, flexShrink: 0, fontSize: "1rem", color: "var(--ion-text-color)" }}>
                      <IonIcon icon={closeOutline} style={{ fontSize: "inherit", color: "inherit", pointerEvents: "none" }} />
                    </span>
                  </IonButton>
                </IonButtons>
                <IonTitle style={{ fontWeight: 700 }}>Ban IP or Email</IonTitle>
              </IonToolbar>
            </IonHeader>
            <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <IonInput
                  className="admin-field" mode="md" fill="outline" labelPlacement="floating"
                  label="IP address or email *"
                  placeholder="192.168.1.1 or user@example.com"
                  value={newValue}
                  onIonInput={e => setNewValue(e.detail.value ?? "")}
                  onKeyDown={e => e.key === "Enter" && ban()}
                  style={{ fontFamily: "monospace" }}
                />
                <IonInput
                  className="admin-field" mode="md" fill="outline" labelPlacement="floating"
                  label="Reason"
                  placeholder="e.g. Chargeback fraud, abuse"
                  value={newReason}
                  onIonInput={e => setNewReason(e.detail.value ?? "")}
                />
                <div style={{
                  display: "flex", alignItems: "flex-start", gap: 10,
                  padding: 12, borderRadius: 8,
                  background: "rgba(var(--ion-color-warning-rgb), 0.16)",
                }}>
                  <IonIcon icon={alertCircleOutline} style={{ color: "var(--ion-color-warning-shade)", fontSize: 18, flexShrink: 0, marginTop: 1 }} />
                  <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--ion-text-color)", opacity: 0.8, lineHeight: 1.5 }}>
                    Banned IPs see a "You are banned" page. Banned IPs and emails are blocked from making purchases, and the reason is shown to them.
                  </p>
                </div>
              </div>

              {/* Stacked full-width Ionic buttons, paystub-modal style */}
              <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 10 }}>
                <IonButton expand="block" color="danger" onClick={() => ban()} disabled={isAdding}>
                  {isAdding && <IonSpinner name="crescent" slot="start" style={{ width: 14, height: 14 }} />}
                  {isAdding ? "Banning…" : "Ban"}
                </IonButton>
                <IonButton expand="block" fill="outline" color="medium" onClick={closeDialog}>
                  Cancel
                </IonButton>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </AdminLayout>
  );
}

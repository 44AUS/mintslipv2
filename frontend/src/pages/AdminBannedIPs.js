import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  IonSegment, IonSegmentButton, IonLabel, IonButton, IonIcon, IonSpinner,
  IonModal, IonHeader, IonToolbar, IonTitle, IonContent as IonModalContent,
  IonFooter, IonButtons,
} from "@ionic/react";
import {
  shieldOutline, addOutline, checkmarkOutline, refreshOutline,
  alertCircleOutline, closeOutline, globeOutline,
} from "ionicons/icons";
import { toast } from "sonner";
import AdminLayout from "@/components/AdminLayout";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";

const segBtnStyle = {
  "--border-radius":   "0",
  "--padding-top":     "0",
  "--padding-bottom":  "0",
};

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
  const [isDialogOpen,    setIsDialogOpen]    = useState(false);
  const [newIp,           setNewIp]           = useState("");
  const [newReason,       setNewReason]       = useState("");
  const [isAdding,        setIsAdding]        = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) { navigate("/admin/login"); return; }
    verifyAdminSession(token);
  }, [navigate]);

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
        toast.error("Failed to fetch banned IPs");
      }
    } catch {
      toast.error("Error fetching banned IPs");
    } finally {
      setLoading(false);
    }
  };

  const banIp = async () => {
    if (!newIp.trim()) { toast.error("Please enter an IP address"); return; }
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(newIp.trim())) {
      toast.error("Please enter a valid IPv4 address (e.g., 192.168.1.1)");
      return;
    }
    setIsAdding(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/banned-ips`, {
        method: "POST",
        headers: { Authorization: `Bearer ${adminToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ ip: newIp.trim(), reason: newReason.trim() || null }),
      });
      if (res.ok) {
        toast.success(`IP ${newIp} has been banned`);
        closeDialog();
        fetchBannedIps();
      } else {
        const data = await res.json();
        toast.error(data.detail || "Failed to ban IP");
      }
    } catch {
      toast.error("Error banning IP");
    } finally {
      setIsAdding(false);
    }
  };

  const unbanIp = async (ip) => {
    if (!window.confirm(`Unban IP ${ip}?`)) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/banned-ips/${encodeURIComponent(ip)}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (res.ok) {
        toast.success(`IP ${ip} has been unbanned`);
        fetchBannedIps();
      } else {
        toast.error("Failed to unban IP");
      }
    } catch {
      toast.error("Error unbanning IP");
    }
  };

  const closeDialog = () => { setIsDialogOpen(false); setNewIp(""); setNewReason(""); };

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
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(235,68,90,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <IonIcon icon={shieldOutline} style={{ color: "var(--ion-color-danger)", fontSize: 18 }} />
                </div>
                <div>
                  <h2 style={{ margin: "0 0 2px", fontWeight: 700, fontSize: "1.05rem", color: "var(--ion-text-color)", letterSpacing: "-0.01em" }}>
                    Banned IP Addresses
                  </h2>
                  <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--ion-color-medium)" }}>
                    {activeIps.length} active · {inactiveIps.length} previously unbanned
                  </p>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <IonButton fill="clear" color="medium" size="small" onClick={() => fetchBannedIps()} style={{ "--border-radius": "50%" }}>
                  <IonIcon slot="icon-only" icon={refreshOutline} style={{ fontSize: 18 }} />
                </IonButton>
                <IonButton color="danger" size="small" onClick={() => setIsDialogOpen(true)} style={{ "--border-radius": "8px" }}>
                  <IonIcon slot="start" icon={addOutline} style={{ fontSize: 16 }} />
                  Ban IP
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
                  { value: "active",   label: "Active Bans",          count: activeIps.length,   color: "var(--ion-color-danger)"  },
                  { value: "inactive", label: "Previously Unbanned",   count: inactiveIps.length, color: "var(--ion-color-success)" },
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

            {/* ── table ── */}
            <div style={{ flex: "1 1 0%", overflow: "auto" }}>
              {loading ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
                  <IonSpinner name="crescent" color="primary" style={{ width: 32, height: 32 }} />
                </div>
              ) : rows.length === 0 ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 10, color: "var(--ion-color-medium)" }}>
                  <IonIcon icon={segment === "active" ? shieldOutline : globeOutline} style={{ fontSize: 40 }} />
                  <span style={{ fontSize: "0.875rem" }}>
                    {segment === "active" ? "No IP addresses are currently banned" : "No previously unbanned IPs"}
                  </span>
                  {segment === "active" && (
                    <IonButton size="small" fill="outline" color="danger" onClick={() => setIsDialogOpen(true)}>
                      <IonIcon slot="start" icon={addOutline} />Ban an IP
                    </IonButton>
                  )}
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 600 }}>
                    <thead>
                      <tr>
                        <th style={{ ...thStyle, width: 180 }}>IP Address</th>
                        <th style={thStyle}>Reason</th>
                        <th style={{ ...thStyle, width: 160 }}>{segment === "active" ? "Banned At" : "Unbanned At"}</th>
                        <th style={{ ...thStyle, width: 100, textAlign: "right" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map(banned => (
                        <tr key={banned.id} style={{ height: 56, background: segment === "active" ? "rgba(235,68,90,0.03)" : "transparent" }}>
                          <td style={tdStyle}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <div style={{
                                width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
                                background: segment === "active" ? "var(--ion-color-danger)" : "var(--ion-color-success)",
                              }} />
                              <span style={{ fontFamily: "monospace", fontWeight: 600, fontSize: "0.88rem" }}>{banned.ip}</span>
                            </div>
                          </td>
                          <td style={{ ...tdStyle, color: "var(--ion-color-medium)", fontSize: "0.8rem" }}>
                            {banned.reason || "—"}
                          </td>
                          <td style={{ ...tdStyle, color: "var(--ion-color-medium)", fontSize: "0.78rem" }}>
                            {segment === "active" ? formatDate(banned.bannedAt) : formatDate(banned.unbannedAt)}
                          </td>
                          <td style={{ ...tdStyle, textAlign: "right" }}>
                            {segment === "active" ? (
                              <IonButton fill="clear" size="small" color="success" onClick={() => unbanIp(banned.ip)}>
                                <IonIcon slot="start" icon={checkmarkOutline} style={{ fontSize: 14 }} />
                                Unban
                              </IonButton>
                            ) : (
                              <IonButton fill="clear" size="small" color="danger" onClick={() => { setNewIp(banned.ip); setNewReason(banned.reason || ""); setIsDialogOpen(true); }}>
                                <IonIcon slot="start" icon={shieldOutline} style={{ fontSize: 14 }} />
                                Re-ban
                              </IonButton>
                            )}
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

      {/* ── Ban IP modal ── */}
      <IonModal isOpen={isDialogOpen} onDidDismiss={closeDialog} style={{ "--width": "460px", "--max-width": "95vw", "--height": "auto" }}>
        <IonHeader>
          <IonToolbar style={{ "--background": "var(--ion-card-background)" }}>
            <IonTitle style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700 }}>
              <IonIcon icon={shieldOutline} style={{ color: "var(--ion-color-danger)", fontSize: 16 }} />
              Ban IP Address
            </IonTitle>
            <IonButtons slot="end">
              <IonButton fill="clear" color="medium" onClick={closeDialog}>
                <IonIcon slot="icon-only" icon={closeOutline} />
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>

        <IonModalContent style={{ "--background": "var(--ion-card-background)", padding: 0 }}>
          <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "var(--ion-color-medium)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                IP Address *
              </label>
              <input
                value={newIp}
                onChange={e => setNewIp(e.target.value)}
                placeholder="e.g., 192.168.1.1"
                onKeyDown={e => e.key === "Enter" && banIp()}
                style={{
                  width: "100%", boxSizing: "border-box",
                  padding: "10px 14px", borderRadius: 8,
                  border: "1px solid var(--ion-border-color)",
                  background: "var(--ion-background-color)",
                  color: "var(--ion-text-color)",
                  fontFamily: "monospace", fontSize: "0.9rem",
                  outline: "none",
                }}
              />
              <p style={{ margin: "4px 0 0", fontSize: "0.72rem", color: "var(--ion-color-medium)" }}>
                Enter the IPv4 address to block
              </p>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "var(--ion-color-medium)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Reason (optional)
              </label>
              <input
                value={newReason}
                onChange={e => setNewReason(e.target.value)}
                placeholder="e.g., Spam, Abuse, Fraud"
                style={{
                  width: "100%", boxSizing: "border-box",
                  padding: "10px 14px", borderRadius: 8,
                  border: "1px solid var(--ion-border-color)",
                  background: "var(--ion-background-color)",
                  color: "var(--ion-text-color)",
                  fontSize: "0.875rem", outline: "none",
                }}
              />
            </div>

            <div style={{
              display: "flex", alignItems: "flex-start", gap: 10,
              padding: 12, borderRadius: 8,
              background: "rgba(245,158,11,0.08)",
              border: "1px solid rgba(245,158,11,0.25)",
            }}>
              <IonIcon icon={alertCircleOutline} style={{ color: "#d97706", fontSize: 18, flexShrink: 0, marginTop: 1 }} />
              <p style={{ margin: 0, fontSize: "0.8rem", color: "#92400e", lineHeight: 1.5 }}>
                Banning this IP will show a "You are banned" page to all visitors from that address.
              </p>
            </div>
          </div>
        </IonModalContent>

        <IonFooter>
          <IonToolbar style={{ "--background": "var(--ion-card-background)", padding: "8px 16px" }}>
            <IonButtons slot="end">
              <IonButton fill="outline" color="medium" onClick={closeDialog}>Cancel</IonButton>
              <IonButton color="danger" onClick={banIp} disabled={isAdding} style={{ "--border-radius": "8px" }}>
                {isAdding
                  ? <IonSpinner name="crescent" style={{ width: 16, height: 16, marginRight: 6 }} />
                  : <IonIcon slot="start" icon={shieldOutline} style={{ fontSize: 14 }} />}
                {isAdding ? "Banning…" : "Ban IP"}
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonFooter>
      </IonModal>
    </AdminLayout>
  );
}

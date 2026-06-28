import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  IonSegment, IonSegmentButton, IonLabel, IonIcon, IonButton, IonSpinner,
  IonModal, IonHeader, IonToolbar, IonTitle, IonContent as IonModalContent,
  IonFooter, IonButtons,
} from "@ionic/react";
import {
  refreshOutline, downloadOutline, chevronForwardOutline, searchOutline,
} from "ionicons/icons";
import {
  MoreVertical, Pencil, CreditCard, Download, Ban, Shield, UserX, MailCheck, X, Clock,
} from "lucide-react";
import { toast } from "sonner";
import AdminLayout from "@/components/AdminLayout";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";

const SUBSCRIPTION_TIERS = {
  starter:      { name: "Starter",      price: 19.99, downloads: 10 },
  professional: { name: "Professional", price: 29.99, downloads: 30 },
  business:     { name: "Business",     price: 49.99, downloads: -1 },
};


const tdBase = {
  padding: "0 12px",
  fontSize: "0.875rem",
  color: "var(--ion-text-color)",
  borderBottom: "1px solid var(--ion-border-color)",
  height: 64,
  verticalAlign: "middle",
  position: "relative",
  overflow: "hidden",
};

const segBtnStyle = {
  "--color":           "var(--ion-color-medium)",
  "--color-checked":   "var(--ion-text-color)",
  "--indicator-color": "var(--ion-text-color)",
  "--border-radius":   "0",
  "--padding-top":     "0",
  "--padding-bottom":  "0",
  minHeight: 46,
  flexShrink: 0,
};

const TABS = [
  { value: "all",         label: "ALL" },
  { value: "subscribers", label: "SUBSCRIBERS" },
  { value: "free",        label: "FREE" },
  { value: "banned",      label: "BANNED" },
];

function getInitials(name, email) {
  const src = name || email || "?";
  const parts = src.split(/[\s._@-]/);
  return parts.length >= 2
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : src[0].toUpperCase();
}

export default function AdminUsers() {
  const navigate = useNavigate();

  const [users, setUsers]     = useState([]);
  const [total, setTotal]     = useState(0);
  const [loading, setLoading] = useState(true);
  const [segment, setSegment] = useState("all");
  const [search, setSearch]   = useState("");

  // modals
  const [openMenuId, setOpenMenuId]   = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [subModalOpen, setSubModalOpen] = useState(false);
  const [selectedTier, setSelectedTier] = useState("");
  const [dlModalOpen, setDlModalOpen]   = useState(false);
  const [dlCount, setDlCount]           = useState("");
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editData, setEditData]           = useState({ name: "", email: "", ipAddress: "" });
  const [editLoading, setEditLoading]     = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("adminToken");
      const params = new URLSearchParams({ skip: "0", limit: "500" });
      if (search.trim()) params.append("search", search.trim());
      const res = await fetch(`${BACKEND_URL}/api/admin/users?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
        setTotal(data.total || 0);
      }
    } catch (_) {}
    setLoading(false);
  }, [search]);

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) { navigate("/admin/login"); return; }
    fetchUsers();
  }, [fetchUsers]);

  const filtered = users.filter(u => {
    if (segment === "subscribers") return !!u.subscription;
    if (segment === "free")        return !u.subscription;
    if (segment === "banned")      return !!u.isBanned;
    return true;
  });

  const counts = {
    all:         users.length,
    subscribers: users.filter(u => !!u.subscription).length,
    free:        users.filter(u => !u.subscription).length,
    banned:      users.filter(u => !!u.isBanned).length,
  };

  // ── actions ────────────────────────────────────────────────────────────────
  const deleteUser = async (userId) => {
    if (!window.confirm("Delete this user? This will remove their subscription and session data.")) return;
    const token = localStorage.getItem("adminToken");
    const res = await fetch(`${BACKEND_URL}/api/admin/users/${userId}`, {
      method: "DELETE", headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) { toast.success("User deleted"); setUsers(prev => prev.filter(u => u.id !== userId)); }
    else toast.error("Failed to delete user");
  };

  const toggleBan = async (userId, banned) => {
    if (!window.confirm(`${banned ? "Unban" : "Ban"} this user?`)) return;
    const token = localStorage.getItem("adminToken");
    const res = await fetch(`${BACKEND_URL}/api/admin/users/${userId}/ban`, {
      method: "PUT", headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const d = await res.json();
      toast.success(d.isBanned ? "User banned" : "User unbanned");
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, isBanned: d.isBanned } : u));
    } else toast.error("Failed");
  };

  const banIP = async (user) => {
    if (!user.ipAddress || user.ipAddress === "unknown") { toast.error("IP not available"); return; }
    if (!window.confirm(`Ban IP ${user.ipAddress}?`)) return;
    const token = localStorage.getItem("adminToken");
    const res = await fetch(`${BACKEND_URL}/api/admin/ban-user-ip/${user.id}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ reason: `Banned via user ${user.email}` }),
    });
    if (res.ok) { const d = await res.json(); toast.success(`IP ${d.ip} banned`); }
    else { const d = await res.json(); toast.error(d.detail || "Failed"); }
  };

  const confirmEmail = async (userId) => {
    if (!window.confirm("Confirm this user's email?")) return;
    const token = localStorage.getItem("adminToken");
    const res = await fetch(`${BACKEND_URL}/api/admin/users/${userId}/verify`, {
      method: "PUT", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    });
    if (res.ok) { toast.success("Email confirmed"); fetchUsers(); }
    else { const d = await res.json(); toast.error(d.detail || "Failed"); }
  };

  const updateSubscription = async () => {
    const token = localStorage.getItem("adminToken");
    const res = await fetch(`${BACKEND_URL}/api/admin/users/${selectedUser.id}/subscription`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ tier: selectedTier === "none" ? null : selectedTier }),
    });
    if (res.ok) {
      toast.success("Subscription updated"); setSubModalOpen(false);
      fetchUsers();
    } else toast.error("Failed to update subscription");
  };

  const updateDownloads = async () => {
    const n = parseInt(dlCount, 10);
    if (isNaN(n) || n < 1) { toast.error("Enter a valid positive number"); return; }
    const token = localStorage.getItem("adminToken");
    const res = await fetch(`${BACKEND_URL}/api/admin/users/${selectedUser.id}/downloads`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ downloads_to_add: n }),
    });
    const data = await res.json();
    if (res.ok) {
      toast.success(data.message || `Added ${n} bonus downloads`);
      setDlModalOpen(false); setDlCount(""); fetchUsers();
    } else toast.error(data.detail || "Failed");
  };

  const updateUser = async () => {
    if (!editData.name.trim() || !editData.email.trim()) { toast.error("Name and email are required"); return; }
    setEditLoading(true);
    const token = localStorage.getItem("adminToken");
    const res = await fetch(`${BACKEND_URL}/api/admin/users/${selectedUser.id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ name: editData.name.trim(), email: editData.email.trim(), ipAddress: editData.ipAddress.trim() || null }),
    });
    const data = await res.json();
    if (res.ok) {
      toast.success("User updated"); setEditModalOpen(false); fetchUsers();
    } else toast.error(data.detail || "Failed");
    setEditLoading(false);
  };

  const exportCSV = () => {
    const rows = [
      ["Name", "Email", "IP", "Status", "Subscription", "Downloads Remaining", "Joined"],
      ...filtered.map(u => [
        u.name || "",
        u.email || "",
        u.ipAddress || "",
        u.isBanned ? "Banned" : u.emailVerified === false ? "Unverified" : "Active",
        u.subscription?.tier || "None",
        u.subscription?.downloads_remaining === -1 ? "Unlimited" : u.subscription?.downloads_remaining ?? "",
        u.createdAt ? new Date(u.createdAt).toISOString() : "",
      ]),
    ];
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "users.csv";
    a.click();
  };

  return (
    <AdminLayout fillHeight>
      <div style={{ padding: 10, height: "100%", boxSizing: "border-box", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: "4px 6px" }}>
          <div style={{ display: "flex", flexDirection: "column", flex: "1 1 0%", overflow: "hidden", background: "var(--ion-card-background)", borderRadius: 6, boxShadow: "0 4px 24px rgba(0,0,0,0.18)" }}>

            {/* ── Card header ── */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 24px", flexShrink: 0 }}>
              <div>
                <h2 style={{ margin: "0 0 2px", fontWeight: 700, fontSize: "1.1rem", color: "var(--ion-text-color)", letterSpacing: "-0.01em" }}>Users</h2>
                <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--ion-color-medium)" }}>{total} total users</p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {/* Search */}
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", display: "inline-flex", fontSize: 16, color: "var(--ion-color-medium)", pointerEvents: "none" }}>
                    <IonIcon icon={searchOutline} style={{ fontSize: "inherit" }} />
                  </span>
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search name or email…"
                    style={{ paddingLeft: 34, paddingRight: 12, height: 34, border: "1px solid var(--ion-border-color)", borderRadius: 6, background: "var(--ion-background-color)", color: "var(--ion-text-color)", fontSize: "0.875rem", outline: "none", width: 220 }}
                  />
                </div>
                <IonButton fill="solid" size="small" onClick={exportCSV} style={{ "--background": "var(--ion-background-color)", "--color": "var(--ion-text-color)" }}>
                  <span slot="start" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", lineHeight: 0, flexShrink: 0, fontSize: "1rem", marginInlineEnd: 6 }}>
                    <IonIcon icon={downloadOutline} style={{ fontSize: "inherit", color: "inherit", pointerEvents: "none" }} />
                  </span>
                  Export
                </IonButton>
              </div>
            </div>

            {/* ── Segment row ── */}
            <div style={{ display: "flex", alignItems: "stretch", background: "var(--ion-card-background)", borderBottom: "1px solid var(--ion-border-color)", flexShrink: 0 }}>
              <IonSegment scrollable value={segment} onIonChange={e => setSegment(e.detail.value)} style={{ "--background": "transparent", flex: "1 1 0%" }}>
                {TABS.map(tab => (
                  <IonSegmentButton key={tab.value} value={tab.value} layout="label-only" style={segBtnStyle}>
                    <IonLabel style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700, letterSpacing: "0.08em", whiteSpace: "nowrap" }}>
                      {tab.label}
                      <span style={{ background: "var(--ion-background-color)", borderRadius: 4, padding: "1px 5px", fontSize: "0.65rem", fontWeight: 700, color: "var(--ion-color-medium)" }}>
                        {counts[tab.value]}
                      </span>
                    </IonLabel>
                  </IonSegmentButton>
                ))}
              </IonSegment>
              <div style={{ display: "flex", alignItems: "center", paddingRight: 12, flexShrink: 0 }}>
                <IonButton title="Refresh" fill="clear" shape="round" color="medium" onClick={fetchUsers}>
                  <span slot="icon-only" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", lineHeight: 0, flexShrink: 0, fontSize: "1rem" }}>
                    <IonIcon icon={refreshOutline} style={{ fontSize: "inherit", color: "inherit", pointerEvents: "none" }} />
                  </span>
                </IonButton>
              </div>
            </div>

            {/* ── Table ── */}
            <div style={{ flex: "1 1 0%", overflow: "auto" }}>
              {loading ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
                  <IonSpinner name="crescent" />
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 820 }}>
                    <thead>
                      <tr>
                        {[["User", 200], ["Status", 90], ["Subscription", 130], ["Downloads", 110], ["IP Address", 130], ["Joined", 150], ["", 60]].map(([h, w]) => (
                          <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontSize: "0.72rem", fontWeight: 400, color: "var(--ion-color-medium)", background: "var(--ion-background-color)", whiteSpace: "nowrap", ...(w ? { width: w, minWidth: w } : {}) }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.length === 0 && (
                        <tr><td colSpan={7} style={{ textAlign: "center", padding: "48px 12px", color: "var(--ion-color-medium)", fontSize: "0.875rem" }}>No users found</td></tr>
                      )}
                      {filtered.map(u => {
                        const tier = u.subscription ? SUBSCRIPTION_TIERS[u.subscription.tier] : null;
                        const isUnlimited = u.subscription?.downloads_remaining === -1 || tier?.downloads === -1;
                        const remaining = u.subscription?.downloads_remaining ?? 0;
                        const tierTotal  = u.subscription?.downloads_total || tier?.downloads || 0;
                        return (
                          <tr key={u.id} style={{ height: 64, cursor: "default" }}>

                            {/* User */}
                            <td className="ion-activatable" style={{ ...tdBase, minWidth: 200 }}>
                              <ion-ripple-effect />
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <div style={{ width: 30, height: 30, borderRadius: "50%", background: u.isBanned ? "#ef4444" : "var(--ion-color-primary)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                  <span style={{ fontSize: "0.6rem", color: "#fff", fontWeight: 700 }}>{getInitials(u.name, u.email)}</span>
                                </div>
                                <div style={{ minWidth: 0 }}>
                                  <span style={{ fontSize: "0.8rem", fontWeight: 600, display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 160 }}>{u.name || "—"}</span>
                                  <span style={{ fontSize: "0.72rem", color: "var(--ion-color-medium)", display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 160 }}>{u.email}</span>
                                </div>
                              </div>
                            </td>

                            {/* Status */}
                            <td className="ion-activatable" style={{ ...tdBase, minWidth: 90 }}>
                              <ion-ripple-effect />
                              {u.isBanned
                                ? <span className="admin-badge admin-badge-red">Banned</span>
                                : u.emailVerified === false
                                  ? <span className="admin-badge admin-badge-amber">Unverified</span>
                                  : <span className="admin-badge admin-badge-green">Active</span>}
                            </td>

                            {/* Subscription */}
                            <td className="ion-activatable" style={{ ...tdBase, minWidth: 130 }}>
                              <ion-ripple-effect />
                              {u.subscription ? (
                                <div style={{ minWidth: 0 }}>
                                  <span style={{ fontSize: "0.78rem", display: "block", whiteSpace: "nowrap", lineHeight: 1.6 }}>{tier?.name || u.subscription.tier}</span>
                                  {u.subscription.status === "cancelling" && (
                                    <span style={{ fontSize: "0.67rem", color: "#f97316", display: "flex", alignItems: "center", gap: 3, lineHeight: 1.4 }}>
                                      <Clock size={9} /> Cancelling
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span style={{ fontSize: "0.8rem", color: "var(--ion-color-medium)" }}>None</span>
                              )}
                            </td>

                            {/* Downloads */}
                            <td className="ion-activatable" style={{ ...tdBase, minWidth: 110 }}>
                              <ion-ripple-effect />
                              {u.subscription
                                ? isUnlimited
                                  ? <span style={{ fontWeight: 700, color: "#8b5cf6" }}>Unlimited</span>
                                  : <span><span style={{ fontWeight: 700 }}>{remaining}</span><span style={{ color: "var(--ion-color-medium)", fontSize: "0.8rem" }}> / {tierTotal}</span></span>
                                : <span style={{ color: "var(--ion-color-medium)" }}>—</span>}
                            </td>

                            {/* IP */}
                            <td className="ion-activatable" style={{ ...tdBase, minWidth: 130 }}>
                              <ion-ripple-effect />
                              <span style={{ fontSize: "0.72rem", fontFamily: "monospace", color: "var(--ion-color-medium)", whiteSpace: "nowrap" }}>{u.ipAddress || "—"}</span>
                            </td>

                            {/* Joined */}
                            <td className="ion-activatable" style={{ ...tdBase, minWidth: 150 }}>
                              <ion-ripple-effect />
                              <span style={{ fontSize: "0.75rem", whiteSpace: "nowrap" }}>
                                {u.createdAt ? new Date(u.createdAt).toLocaleString() : "—"}
                              </span>
                            </td>

                            {/* Actions */}
                            <td className="ion-activatable" style={{ ...tdBase, padding: "0 8px", width: 60 }}>
                              <ion-ripple-effect />
                              <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <button
                                  className="admin-action-btn"
                                  onClick={e => { e.stopPropagation(); setOpenMenuId(openMenuId === u.id ? null : u.id); }}
                                >
                                  <MoreVertical size={16} />
                                </button>
                                {openMenuId === u.id && (
                                  <div className="user-action-menu" style={{ right: 0, left: "auto" }}>
                                    <button className="profile-menu-item" onClick={() => { setSelectedUser(u); setEditData({ name: u.name || "", email: u.email || "", ipAddress: u.ipAddress || "" }); setEditModalOpen(true); setOpenMenuId(null); }}>
                                      <Pencil size={13} /> Edit User
                                    </button>
                                    <button className="profile-menu-item" style={{ color: "#3b82f6" }} onClick={() => { setSelectedUser(u); setSelectedTier(u.subscription?.tier || ""); setSubModalOpen(true); setOpenMenuId(null); }}>
                                      <CreditCard size={13} /> Change Subscription
                                    </button>
                                    {u.subscription && (
                                      <button className="profile-menu-item" style={{ color: "var(--ion-color-primary)" }} onClick={() => { setSelectedUser(u); setDlCount(""); setDlModalOpen(true); setOpenMenuId(null); }}>
                                        <Download size={13} /> Add Bonus Downloads
                                      </button>
                                    )}
                                    {u.emailVerified === false && (
                                      <button className="profile-menu-item" style={{ color: "#10b981" }} onClick={() => { confirmEmail(u.id); setOpenMenuId(null); }}>
                                        <MailCheck size={13} /> Confirm Email
                                      </button>
                                    )}
                                    <div className="profile-menu-divider" />
                                    <button className="profile-menu-item" style={{ color: u.isBanned ? "var(--ion-color-primary)" : "#f97316" }} onClick={() => { toggleBan(u.id, u.isBanned); setOpenMenuId(null); }}>
                                      <Ban size={13} /> {u.isBanned ? "Unban" : "Ban User"}
                                    </button>
                                    {u.ipAddress && u.ipAddress !== "unknown" && (
                                      <button className="profile-menu-item danger" onClick={() => { banIP(u); setOpenMenuId(null); }}>
                                        <Shield size={13} /> Ban IP
                                      </button>
                                    )}
                                    <button className="profile-menu-item danger" onClick={() => { deleteUser(u.id); setOpenMenuId(null); }}>
                                      <UserX size={13} /> Delete User
                                    </button>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* Change Subscription Modal */}
      <IonModal isOpen={subModalOpen} onDidDismiss={() => setSubModalOpen(false)} style={{ "--width": "540px", "--max-width": "95vw", "--height": "auto" }}>
        <IonHeader><IonToolbar>
          <IonTitle>Change Subscription</IonTitle>
          <IonButtons slot="end"><IonButton fill="clear" color="medium" onClick={() => setSubModalOpen(false)}><X size={20} /></IonButton></IonButtons>
        </IonToolbar></IonHeader>
        <IonModalContent className="ion-padding">
          <p style={{ color: "#64748b", fontSize: "0.875rem", marginBottom: 12 }}>
            Current plan for {selectedUser?.name} ({selectedUser?.email}): <strong>{selectedUser?.subscription ? (SUBSCRIPTION_TIERS[selectedUser.subscription.tier]?.name || selectedUser.subscription.tier) : "None"}</strong>
          </p>
          <div className="admin-form-group">
            <select className="admin-select" value={selectedTier} onChange={e => setSelectedTier(e.target.value)}>
              <option value="">Select a plan</option>
              <option value="none">No Subscription</option>
              {Object.entries(SUBSCRIPTION_TIERS).map(([k, t]) => (
                <option key={k} value={k}>{t.name} – ${t.price}/mo ({t.downloads === -1 ? "Unlimited" : t.downloads} downloads)</option>
              ))}
            </select>
          </div>
        </IonModalContent>
        <IonFooter><IonToolbar style={{ padding: "8px 16px" }}>
          <IonButtons slot="end">
            <IonButton fill="outline" color="medium" onClick={() => setSubModalOpen(false)}>Cancel</IonButton>
            <IonButton color="primary" onClick={updateSubscription}>Update</IonButton>
          </IonButtons>
        </IonToolbar></IonFooter>
      </IonModal>

      {/* Bonus Downloads Modal */}
      <IonModal isOpen={dlModalOpen} onDidDismiss={() => setDlModalOpen(false)} style={{ "--width": "480px", "--max-width": "95vw", "--height": "auto" }}>
        <IonHeader><IonToolbar>
          <IonTitle>Add Bonus Downloads</IonTitle>
          <IonButtons slot="end"><IonButton fill="clear" color="medium" onClick={() => setDlModalOpen(false)}><X size={20} /></IonButton></IonButtons>
        </IonToolbar></IonHeader>
        <IonModalContent className="ion-padding">
          <p style={{ color: "#64748b", fontSize: "0.875rem", marginBottom: 16 }}>Extra downloads for {selectedUser?.name} ({selectedUser?.email})</p>
          {selectedUser?.subscription?.downloads_remaining === -1
            ? <p style={{ color: "#3b82f6", fontSize: "0.875rem" }}>This user already has unlimited downloads.</p>
            : (
              <div className="admin-form-group">
                <label className="admin-form-label">Number of downloads to add</label>
                <input className="admin-input" type="number" min="1" value={dlCount} onChange={e => setDlCount(e.target.value)} placeholder="e.g. 5" />
              </div>
            )}
        </IonModalContent>
        <IonFooter><IonToolbar style={{ padding: "8px 16px" }}>
          <IonButtons slot="end">
            <IonButton fill="outline" color="medium" onClick={() => setDlModalOpen(false)}>Cancel</IonButton>
            <IonButton color="primary" onClick={updateDownloads} disabled={selectedUser?.subscription?.downloads_remaining === -1 || !dlCount || parseInt(dlCount) < 1}>Add</IonButton>
          </IonButtons>
        </IonToolbar></IonFooter>
      </IonModal>

      {/* Edit User Modal */}
      <IonModal isOpen={editModalOpen} onDidDismiss={() => setEditModalOpen(false)} style={{ "--width": "480px", "--max-width": "95vw", "--height": "auto" }}>
        <IonHeader><IonToolbar>
          <IonTitle>Edit User</IonTitle>
          <IonButtons slot="end"><IonButton fill="clear" color="medium" onClick={() => setEditModalOpen(false)}><X size={20} /></IonButton></IonButtons>
        </IonToolbar></IonHeader>
        <IonModalContent className="ion-padding">
          <div className="admin-form-group">
            <label className="admin-form-label">Name</label>
            <input className="admin-input" type="text" value={editData.name} onChange={e => setEditData(p => ({ ...p, name: e.target.value }))} placeholder="Name" />
          </div>
          <div className="admin-form-group">
            <label className="admin-form-label">Email</label>
            <input className="admin-input" type="email" value={editData.email} onChange={e => setEditData(p => ({ ...p, email: e.target.value }))} placeholder="Email" />
          </div>
          <div className="admin-form-group">
            <label className="admin-form-label">IP Address</label>
            <input className="admin-input" type="text" value={editData.ipAddress} onChange={e => setEditData(p => ({ ...p, ipAddress: e.target.value }))} placeholder="Optional" />
          </div>
        </IonModalContent>
        <IonFooter><IonToolbar style={{ padding: "8px 16px" }}>
          <IonButtons slot="end">
            <IonButton fill="outline" color="medium" onClick={() => setEditModalOpen(false)}>Cancel</IonButton>
            <IonButton color="primary" onClick={updateUser} disabled={editLoading}>
              {editLoading ? <IonSpinner name="crescent" style={{ width: 16, height: 16 }} /> : "Save"}
            </IonButton>
          </IonButtons>
        </IonToolbar></IonFooter>
      </IonModal>
    </AdminLayout>
  );
}

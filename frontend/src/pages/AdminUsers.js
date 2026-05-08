import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  IonModal, IonHeader, IonToolbar, IonTitle, IonContent as IonModalContent,
  IonFooter, IonButton, IonButtons, IonSpinner,
} from "@ionic/react";
import { toast } from "sonner";
import {
  Users, UserCheck, Clock, DollarSign, Search, CreditCard, Calendar,
  ChevronLeft, ChevronRight, MoreVertical, Pencil, Download, Ban,
  Shield, UserX, MailCheck, X,
} from "lucide-react";
import AdminLayout from "@/components/AdminLayout";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";
const PAGE_SIZE = 20;

const SUBSCRIPTION_TIERS = {
  starter:      { name: "Starter",      price: 19.99, downloads: 10 },
  professional: { name: "Professional", price: 29.99, downloads: 30 },
  business:     { name: "Business",     price: 49.99, downloads: -1 },
};

function StatCard({ title, value, sub, icon: Icon, color }) {
  const palette = {
    blue:   { bg: "rgba(59,130,246,0.12)",  fg: "#3b82f6" },
    green:  { bg: "rgba(22,163,74,0.12)",   fg: "#16a34a" },
    orange: { bg: "rgba(249,115,22,0.12)",  fg: "#f97316" },
    purple: { bg: "rgba(139,92,246,0.12)",  fg: "#8b5cf6" },
  };
  const c = palette[color] || palette.blue;
  return (
    <div className="admin-stat-card">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <p className="admin-stat-label">{title}</p>
          <p className="admin-stat-value">{value}</p>
          {sub && <p style={{ fontSize: "0.72rem", color: c.fg, marginTop: 2 }}>{sub}</p>}
        </div>
        <div style={{ width: 48, height: 48, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", background: c.bg }}>
          <Icon size={24} style={{ color: c.fg }} />
        </div>
      </div>
    </div>
  );
}

export default function AdminUsers() {
  const navigate = useNavigate();

  // ── data ──────────────────────────────────────────────────────────────────
  const [users, setUsers]           = useState([]);
  const [total, setTotal]           = useState(0);
  const [loading, setLoading]       = useState(true);
  const [stats, setStats]           = useState(null);
  const [page, setPage]             = useState(0);

  // ── filters ───────────────────────────────────────────────────────────────
  const [search, setSearch]           = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [subFilter, setSubFilter]     = useState("all");
  const [dateFilter, setDateFilter]   = useState("all");
  const [mrrPeriod, setMrrPeriod]     = useState("monthly");
  const searchTimer                   = useRef(null);

  // ── dropdown ──────────────────────────────────────────────────────────────
  const [openMenuId, setOpenMenuId]   = useState(null);

  // ── modals ────────────────────────────────────────────────────────────────
  const [selectedUser, setSelectedUser]                 = useState(null);
  const [subModalOpen, setSubModalOpen]                 = useState(false);
  const [selectedTier, setSelectedTier]                 = useState("");
  const [dlModalOpen, setDlModalOpen]                   = useState(false);
  const [dlCount, setDlCount]                           = useState("");
  const [editModalOpen, setEditModalOpen]               = useState(false);
  const [editData, setEditData]                         = useState({ name: "", email: "", ipAddress: "" });
  const [editLoading, setEditLoading]                   = useState(false);

  // ── auth ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) { navigate("/admin/login"); return; }
    fetchStats();
  }, []);

  // ── debounce search ───────────────────────────────────────────────────────
  useEffect(() => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => { setSearchDebounced(search); setPage(0); }, 400);
    return () => clearTimeout(searchTimer.current);
  }, [search]);

  // ── fetch stats ───────────────────────────────────────────────────────────
  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`${BACKEND_URL}/api/admin/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setStats(await res.json());
    } catch (_) {}
  };

  // ── fetch users ───────────────────────────────────────────────────────────
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("adminToken");
      const params = new URLSearchParams({
        skip: (page * PAGE_SIZE).toString(),
        limit: PAGE_SIZE.toString(),
      });
      if (searchDebounced.trim()) params.append("search", searchDebounced.trim());
      if (subFilter !== "all")    params.append("subscription_type", subFilter);
      if (dateFilter !== "all") {
        const now = new Date();
        const offsets = { today: 0, week: 7, month: 30, quarter: 90, year: 365 };
        const days = offsets[dateFilter];
        if (days === 0) {
          const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          params.append("date_from", d.toISOString());
        } else if (days) {
          params.append("date_from", new Date(now.getTime() - days * 86400000).toISOString());
        }
      }
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
  }, [page, searchDebounced, subFilter, dateFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // ── actions ───────────────────────────────────────────────────────────────
  const deleteUser = async (userId) => {
    if (!window.confirm("Delete this user? This will also remove their subscription and session data.")) return;
    const token = localStorage.getItem("adminToken");
    const res = await fetch(`${BACKEND_URL}/api/admin/users/${userId}`, {
      method: "DELETE", headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) { toast.success("User deleted"); fetchUsers(); fetchStats(); }
    else toast.error("Failed to delete user");
  };

  const toggleBan = async (userId, banned) => {
    if (!window.confirm(`${banned ? "Unban" : "Ban"} this user?`)) return;
    const token = localStorage.getItem("adminToken");
    const res = await fetch(`${BACKEND_URL}/api/admin/users/${userId}/ban`, {
      method: "PUT", headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) { const d = await res.json(); toast.success(d.isBanned ? "User banned" : "User unbanned"); fetchUsers(); }
    else toast.error("Failed");
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
    if (!selectedUser) return;
    const token = localStorage.getItem("adminToken");
    const res = await fetch(`${BACKEND_URL}/api/admin/users/${selectedUser.id}/subscription`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ tier: selectedTier === "none" ? null : selectedTier }),
    });
    if (res.ok) {
      toast.success("Subscription updated");
      setSubModalOpen(false); setSelectedUser(null);
      fetchUsers(); fetchStats();
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
      setDlModalOpen(false); setSelectedUser(null); setDlCount("");
      fetchUsers();
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
      toast.success("User updated"); setEditModalOpen(false); setSelectedUser(null);
      setEditData({ name: "", email: "", ipAddress: "" }); fetchUsers();
    } else toast.error(data.detail || "Failed");
    setEditLoading(false);
  };

  const clearFilters = () => { setSubFilter("all"); setDateFilter("all"); setSearch(""); setPage(0); };
  const hasFilters = subFilter !== "all" || dateFilter !== "all" || search;

  const fmt = (d) => d ? new Date(d).toLocaleString() : "-";
  const fmtMoney = (v) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(v || 0);

  const s = stats?.stats || {};
  const ss = stats?.subscriptionStats || {};
  const mrr = mrrPeriod === "monthly" ? (s.monthlySubscriptionRevenue || 0) : (s.monthlySubscriptionRevenue || 0) * 12;

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard title="Total Users"       value={s.totalUsers || 0}       icon={Users}      color="blue" />
          <StatCard title="Active Subscribers" value={s.totalSubscribers || 0} icon={UserCheck}  color="green" />
          <StatCard title="Cancelling"         value={s.cancellingSubscribers || 0} sub="Pending cancellation" icon={Clock} color="orange" />
          <div className="admin-stat-card">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <p className="admin-stat-label">{mrrPeriod === "monthly" ? "Monthly" : "Annual"} Recurring Revenue</p>
                  <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5">
                    <button onClick={() => setMrrPeriod("monthly")} className={`px-2 py-1 text-xs rounded-md transition-colors ${mrrPeriod === "monthly" ? "bg-white text-purple-600 shadow-sm font-medium" : "text-slate-500 hover:text-slate-700"}`}>Mo</button>
                    <button onClick={() => setMrrPeriod("yearly")}  className={`px-2 py-1 text-xs rounded-md transition-colors ${mrrPeriod === "yearly"  ? "bg-white text-purple-600 shadow-sm font-medium" : "text-slate-500 hover:text-slate-700"}`}>Yr</button>
                  </div>
                </div>
                <p className="admin-stat-value">{fmtMoney(mrr)}</p>
                <p style={{ fontSize: "0.72rem", color: "#8b5cf6", marginTop: 2 }}>From active subscriptions</p>
              </div>
              <div style={{ width: 48, height: 48, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(139,92,246,0.12)", marginLeft: 12 }}>
                <DollarSign size={24} style={{ color: "#8b5cf6" }} />
              </div>
            </div>
          </div>
        </div>

        {/* Tier breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {[
            { label: "Starter Plan",       tier: "starter",      price: "$19.99/mo", border: "#16a34a", color: "#16a34a" },
            { label: "Professional Plan",  tier: "professional", price: "$29.99/mo", border: "#3b82f6", color: "#3b82f6" },
            { label: "Business Plan",      tier: "business",     price: "$49.99/mo", border: "#8b5cf6", color: "#8b5cf6" },
          ].map(({ label, tier, price, border, color }) => (
            <div key={tier} className="bg-white rounded-xl shadow-sm p-6" style={{ borderLeft: `4px solid ${border}` }}>
              <p className="text-sm text-slate-500">{label}</p>
              <p className="text-2xl font-bold mt-1" style={{ color }}>{ss.byTier?.[tier] || 0}</p>
              <p className="text-xs text-slate-400 mt-1">{price}</p>
              {(ss.cancellingByTier?.[tier] > 0) && (
                <p className="text-xs text-orange-500 mt-1">{ss.cancellingByTier[tier]} cancelling</p>
              )}
            </div>
          ))}
        </div>

        {/* Users table card */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800">Registered Users</h2>
              <span className="text-sm text-slate-500">{total} total</span>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
              <div style={{ position: "relative", flex: 1, minWidth: 200, maxWidth: 300 }}>
                <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--admin-text-muted)", pointerEvents: "none" }} />
                <input className="admin-input" style={{ paddingLeft: 32 }} placeholder="Search name or email…" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <div className="flex items-center gap-2">
                <CreditCard size={14} style={{ color: "var(--admin-text-muted)" }} />
                <select className="admin-select" style={{ width: 165 }} value={subFilter} onChange={e => { setSubFilter(e.target.value); setPage(0); }}>
                  <option value="all">All Subscriptions</option>
                  <option value="none">No Subscription</option>
                  <option value="starter">Starter</option>
                  <option value="professional">Professional</option>
                  <option value="business">Business</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={14} style={{ color: "var(--admin-text-muted)" }} />
                <select className="admin-select" style={{ width: 150 }} value={dateFilter} onChange={e => { setDateFilter(e.target.value); setPage(0); }}>
                  <option value="all">All Time</option>
                  <option value="today">Joined Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="quarter">This Quarter</option>
                  <option value="year">This Year</option>
                </select>
              </div>
              {hasFilters && (
                <IonButton fill="clear" size="small" color="medium" onClick={clearFilters}>Clear Filters</IonButton>
              )}
            </div>
            <p className="text-sm text-slate-500">Showing {users.length} of {total} users{hasFilters && " (filtered)"}</p>
          </div>

          {loading ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 0" }}>
              <IonSpinner name="crescent" color="primary" style={{ width: 32, height: 32 }} />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">{hasFilters ? "No users match your filters" : "No registered users yet"}</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>IP Address</th>
                      <th>Status</th>
                      <th>Subscription</th>
                      <th>Downloads</th>
                      <th>Joined</th>
                      <th style={{ width: 60 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(user => {
                      const tier = user.subscription ? SUBSCRIPTION_TIERS[user.subscription.tier] : null;
                      const isUnlimited = user.subscription?.downloads_remaining === -1 || tier?.downloads === -1;
                      const remaining = user.subscription?.downloads_remaining ?? 0;
                      const total_ = user.subscription?.downloads_total || tier?.downloads || 0;
                      return (
                        <tr key={user.id} style={user.isBanned ? { background: "rgba(220,38,38,0.04)" } : {}}>
                          <td style={{ fontWeight: 600 }}>{user.name}</td>
                          <td style={{ fontSize: "0.875rem" }}>{user.email}</td>
                          <td><span style={{ fontSize: "0.75rem", fontFamily: "monospace", color: "var(--admin-text-muted)" }}>{user.ipAddress || "-"}</span></td>
                          <td>
                            {user.isBanned
                              ? <span className="admin-badge admin-badge-red">Banned</span>
                              : user.emailVerified === false
                                ? <span className="admin-badge admin-badge-amber">Unverified</span>
                                : <span className="admin-badge admin-badge-green">Active</span>}
                          </td>
                          <td>
                            {user.subscription ? (
                              <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                                <span className={`admin-badge ${
                                  ["business","unlimited"].includes(user.subscription.tier) ? "admin-badge-purple" :
                                  ["professional","pro"].includes(user.subscription.tier) ? "admin-badge-blue" : "admin-badge-green"
                                }`}>
                                  {tier?.name || user.subscription.tier}
                                </span>
                                {user.subscription.status === "cancelling" && (
                                  <span className="admin-badge admin-badge-amber" style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                                    <Clock size={10} /> Cancelling
                                  </span>
                                )}
                              </div>
                            ) : <span style={{ color: "var(--admin-text-muted)" }}>None</span>}
                          </td>
                          <td>
                            {user.subscription
                              ? isUnlimited
                                ? <span style={{ fontWeight: 600, color: "#8b5cf6" }}>Unlimited</span>
                                : <span><span style={{ fontWeight: 600 }}>{remaining}</span><span style={{ color: "var(--admin-text-muted)" }}> / {total_}</span></span>
                              : <span style={{ color: "var(--admin-text-muted)" }}>-</span>}
                          </td>
                          <td style={{ fontSize: "0.8125rem" }}>{fmt(user.createdAt)}</td>
                          <td>
                            <div style={{ position: "relative" }}>
                              <button className="admin-action-btn" onClick={() => setOpenMenuId(openMenuId === user.id ? null : user.id)}>
                                <MoreVertical size={16} />
                              </button>
                              {openMenuId === user.id && (
                                <div className="user-action-menu">
                                  <button className="profile-menu-item" onClick={() => { setSelectedUser(user); setEditData({ name: user.name || "", email: user.email || "", ipAddress: user.ipAddress || "" }); setEditModalOpen(true); setOpenMenuId(null); }}>
                                    <Pencil size={13} /> Edit User
                                  </button>
                                  <button className="profile-menu-item" style={{ color: "#3b82f6" }} onClick={() => { setSelectedUser(user); setSelectedTier(user.subscription?.tier || ""); setSubModalOpen(true); setOpenMenuId(null); }}>
                                    <CreditCard size={13} /> Change Subscription
                                  </button>
                                  {user.subscription && (
                                    <button className="profile-menu-item" style={{ color: "var(--ion-color-primary)" }} onClick={() => { setSelectedUser(user); setDlCount(""); setDlModalOpen(true); setOpenMenuId(null); }}>
                                      <Download size={13} /> Add Bonus Downloads
                                    </button>
                                  )}
                                  {user.emailVerified === false && (
                                    <button className="profile-menu-item" style={{ color: "#10b981" }} onClick={() => { confirmEmail(user.id); setOpenMenuId(null); }}>
                                      <MailCheck size={13} /> Confirm Email
                                    </button>
                                  )}
                                  <div className="profile-menu-divider" />
                                  <button className="profile-menu-item" style={{ color: user.isBanned ? "var(--ion-color-primary)" : "#f97316" }} onClick={() => { toggleBan(user.id, user.isBanned); setOpenMenuId(null); }}>
                                    <Ban size={13} /> {user.isBanned ? "Unban User" : "Ban User"}
                                  </button>
                                  {user.ipAddress && user.ipAddress !== "unknown" && (
                                    <button className="profile-menu-item danger" onClick={() => { banIP(user); setOpenMenuId(null); }}>
                                      <Shield size={13} /> Ban IP Address
                                    </button>
                                  )}
                                  <button className="profile-menu-item danger" onClick={() => { deleteUser(user.id); setOpenMenuId(null); }}>
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
              <div className="admin-pagination" style={{ marginTop: 16 }}>
                <span>Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total}</span>
                <div className="admin-pagination-btns">
                  <IonButton fill="outline" size="small" color="medium" disabled={page === 0} onClick={() => setPage(p => p - 1)}><ChevronLeft size={16} /></IonButton>
                  <IonButton fill="outline" size="small" color="medium" disabled={(page + 1) * PAGE_SIZE >= total} onClick={() => setPage(p => p + 1)}><ChevronRight size={16} /></IonButton>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Change Subscription Modal */}
      <IonModal isOpen={subModalOpen} onDidDismiss={() => setSubModalOpen(false)} style={{ "--width": "540px", "--max-width": "95vw", "--height": "auto" }}>
        <IonHeader><IonToolbar>
          <IonTitle>Change User Subscription</IonTitle>
          <IonButtons slot="end"><IonButton fill="clear" color="medium" onClick={() => setSubModalOpen(false)}><X size={20} /></IonButton></IonButtons>
        </IonToolbar></IonHeader>
        <IonModalContent className="ion-padding">
          <p style={{ color: "#64748b", fontSize: "0.875rem", marginBottom: 16 }}>Update subscription for {selectedUser?.name} ({selectedUser?.email})</p>
          <p style={{ fontSize: "0.875rem", color: "#475569", marginBottom: 12 }}>
            Current plan: <strong>{selectedUser?.subscription?.tier ? (SUBSCRIPTION_TIERS[selectedUser.subscription.tier]?.name || selectedUser.subscription.tier) : "None"}</strong>
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
            <IonButton color="primary" onClick={updateSubscription}>Update Subscription</IonButton>
          </IonButtons>
        </IonToolbar></IonFooter>
      </IonModal>

      {/* Bonus Downloads Modal */}
      <IonModal isOpen={dlModalOpen} onDidDismiss={() => setDlModalOpen(false)} style={{ "--width": "540px", "--max-width": "95vw", "--height": "auto" }}>
        <IonHeader><IonToolbar>
          <IonTitle>Add Bonus Downloads</IonTitle>
          <IonButtons slot="end"><IonButton fill="clear" color="medium" onClick={() => setDlModalOpen(false)}><X size={20} /></IonButton></IonButtons>
        </IonToolbar></IonHeader>
        <IonModalContent className="ion-padding">
          <p style={{ color: "#64748b", fontSize: "0.875rem", marginBottom: 16 }}>Add extra downloads for {selectedUser?.name} ({selectedUser?.email})</p>
          {selectedUser?.subscription?.downloads_remaining === -1 ? (
            <p style={{ color: "#3b82f6", fontSize: "0.875rem" }}>This user already has unlimited downloads.</p>
          ) : (
            <>
              <div className="admin-form-group">
                <label className="admin-form-label">Bonus Downloads to Add</label>
                <input className="admin-input" type="number" min="1" value={dlCount} onChange={e => setDlCount(e.target.value)} placeholder="Enter number of downloads to add" />
              </div>
              {dlCount && parseInt(dlCount) > 0 && (
                <p style={{ fontSize: "0.875rem", color: "#16a34a" }}>After adding: {(selectedUser?.subscription?.downloads_remaining || 0) + parseInt(dlCount)} downloads</p>
              )}
            </>
          )}
        </IonModalContent>
        <IonFooter><IonToolbar style={{ padding: "8px 16px" }}>
          <IonButtons slot="end">
            <IonButton fill="outline" color="medium" onClick={() => setDlModalOpen(false)}>Cancel</IonButton>
            <IonButton color="primary" onClick={updateDownloads} disabled={selectedUser?.subscription?.downloads_remaining === -1 || !dlCount || parseInt(dlCount) < 1}>
              Add Downloads
            </IonButton>
          </IonButtons>
        </IonToolbar></IonFooter>
      </IonModal>

      {/* Edit User Modal */}
      <IonModal isOpen={editModalOpen} onDidDismiss={() => setEditModalOpen(false)} style={{ "--width": "540px", "--max-width": "95vw", "--height": "auto" }}>
        <IonHeader><IonToolbar>
          <IonTitle>Edit User</IonTitle>
          <IonButtons slot="end"><IonButton fill="clear" color="medium" onClick={() => setEditModalOpen(false)}><X size={20} /></IonButton></IonButtons>
        </IonToolbar></IonHeader>
        <IonModalContent className="ion-padding">
          <p style={{ color: "#64748b", fontSize: "0.875rem", marginBottom: 16 }}>Update information for {selectedUser?.email}</p>
          <div className="admin-form-group">
            <label className="admin-form-label">Name</label>
            <input className="admin-input" type="text" value={editData.name} onChange={e => setEditData(p => ({ ...p, name: e.target.value }))} placeholder="Enter name" />
          </div>
          <div className="admin-form-group">
            <label className="admin-form-label">Email</label>
            <input className="admin-input" type="email" value={editData.email} onChange={e => setEditData(p => ({ ...p, email: e.target.value }))} placeholder="Enter email" />
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
              {editLoading ? <IonSpinner name="crescent" style={{ width: 16, height: 16 }} /> : "Save Changes"}
            </IonButton>
          </IonButtons>
        </IonToolbar></IonFooter>
      </IonModal>
    </AdminLayout>
  );
}

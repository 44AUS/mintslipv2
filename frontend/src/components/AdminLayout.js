import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  IonApp, IonSplitPane, IonMenu, IonHeader, IonToolbar,
  IonContent, IonMenuButton, IonBadge, IonButtons,
  IonPage, IonSegment, IonSegmentButton, IonLabel,
  IonList, IonItem,
} from "@ionic/react";
import {
  FileText, LogOut, Bell,
  Lock, ChevronDown, Receipt, FileSpreadsheet, FileBarChart,
  Building2, Car, Briefcase, User, ExternalLink,
  Moon, Sun,
} from "lucide-react";
import IonIcon from "./IonIcon";
import MintSlipLogo from "../assests/mintslip-logo.png";
import "../admin-theme.css";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";

const DOC_ICONS = {
  "paystub":              Receipt,
  "canadian-paystub":     Receipt,
  "resume":               FileText,
  "w2":                   FileSpreadsheet,
  "w9":                   FileSpreadsheet,
  "1099-nec":             FileSpreadsheet,
  "1099-misc":            FileSpreadsheet,
  "bank-statement":       Building2,
  "offer-letter":         Briefcase,
  "vehicle-bill-of-sale": Car,
  "schedule-c":           FileBarChart,
  "utility-bill":         FileText,
};

// Tabs hidden from the top-bar segment (still visible in sidebar)
const TOPBAR_EXCLUDE = new Set([
  "overview", "saved-docs", "email-templates",
  "site-settings", "banned-ips", "export",
]);

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function NavItem({ tab, isActive, onClick }) {
  return (
    <IonItem
      button
      detail={false}
      onClick={onClick}
      style={{
        "--background":            isActive ? "var(--ion-color-step-100)" : "transparent",
        "--background-hover":      "var(--ion-color-step-100)",
        "--background-hover-opacity": "1",
        "--background-activated":  "var(--ion-color-step-150)",
        "--color":                 isActive ? "var(--ion-color-primary)" : "var(--ion-text-color)",
        "--border-color":          "var(--app-divider)",
        "--min-height":            "48px",
        "--padding-start":         "20px",
        "--padding-end":           "0",
        "--inner-padding-end":     "0",
        fontWeight:                isActive ? 600 : 400,
      }}
    >
      <div slot="start" style={{ position: "relative", display: "flex" }}>
        <span style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          lineHeight: 0, flexShrink: 0, fontSize: "1.25rem",
        }}>
          <IonIcon
            name={tab.ionicon}
            style={{ fontSize: "inherit", color: "inherit", pointerEvents: "none" }}
          />
        </span>
      </div>
      <IonLabel>{tab.label}</IonLabel>
    </IonItem>
  );
}

export default function AdminLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount,   setUnreadCount]   = useState(0);
  const [notifOpen,     setNotifOpen]     = useState(false);
  const notifRef = useRef(null);

  const [adminProfile, setAdminProfile] = useState(null);
  const [profileOpen,  setProfileOpen]  = useState(false);
  const profileRef = useRef(null);

  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem("adminDarkMode") === "true",
  );

  /* Apply/remove dark class on body */
  useEffect(() => {
    document.body.classList.toggle("dark", darkMode);
    localStorage.setItem("adminDarkMode", darkMode);
  }, [darkMode]);

  /* Apply ionic-active so public pages still scroll when user navigates back */
  useEffect(() => {
    document.documentElement.classList.add("ionic-active");
    document.body.classList.add("ionic-active");
    return () => {
      document.documentElement.classList.remove("ionic-active");
      document.body.classList.remove("ionic-active");
    };
  }, []);

  /* Close dropdowns on outside click */
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current   && !notifRef.current.contains(e.target))   setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    fetchNotifications();
    fetchAdminProfile();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) return;
      const res = await fetch(`${BACKEND_URL}/api/admin/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setNotifications(data.notifications);
          setUnreadCount(data.unreadCount);
        }
      }
    } catch (_) {}
  };

  const fetchAdminProfile = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) return;
      const res = await fetch(`${BACKEND_URL}/api/admin/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) setAdminProfile(data.profile);
      }
    } catch (_) {
      const info = localStorage.getItem("adminInfo");
      if (info) { try { setAdminProfile(JSON.parse(info)); } catch (__) {} }
    }
  };

  const handleMarkRead = async () => {
    if (unreadCount === 0) return;
    const token = localStorage.getItem("adminToken");
    await fetch(`${BACKEND_URL}/api/admin/notifications/mark-read`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
    });
    setUnreadCount(0);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleClearNotifications = async () => {
    const token = localStorage.getItem("adminToken");
    await fetch(`${BACKEND_URL}/api/admin/notifications`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    setNotifications([]);
    setUnreadCount(0);
  };

  const handleLogout = async () => {
    const token = localStorage.getItem("adminToken");
    try {
      await fetch(`${BACKEND_URL}/api/admin/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (_) {}
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminInfo");
    localStorage.removeItem("adminRole");
    localStorage.removeItem("adminPermissions");
    navigate("/admin/login");
  };

  const toggleDark = () => setDarkMode(prev => !prev);

  const getActiveTab = () => {
    const path = location.pathname;
    if (path.includes("/admin/users"))           return "users";
    if (path.includes("/admin/purchases"))       return "purchases";
    if (path.includes("/admin/saved-docs"))      return "saved-docs";
    if (path.includes("/admin/discounts"))       return "discounts";
    if (path.includes("/admin/banned-ips"))      return "banned-ips";
    if (path.includes("/admin/email-templates")) return "email-templates";
    if (path.includes("/admin/mass-email"))      return "mass-email";
    if (path.includes("/admin/blog"))            return "blog";
    if (path.includes("/admin/site-settings"))   return "site-settings";
    if (path.includes("/admin/moderators"))      return "moderators";
    if (path.includes("/admin/audit-log"))       return "audit-log";
    if (path.includes("/admin/support"))         return "support";
    if (path.includes("/admin/export"))          return "export";
    if (path.includes("/admin/revenue"))         return "revenue";
    if (path.includes("/admin/subscriptions"))   return "subscriptions";
    if (path.includes("/admin/settings"))        return "settings";
    return "overview";
  };

  const activeTab = getActiveTab();

  const adminRole        = localStorage.getItem("adminRole") || "admin";
  const adminPermissions = (() => {
    try { return JSON.parse(localStorage.getItem("adminPermissions")); }
    catch { return null; }
  })();
  const isFullAdmin = adminRole === "admin";
  const hasPerm = (key) => isFullAdmin || (adminPermissions && adminPermissions[key]);

  const allTabs = [
    { id: "overview",        label: "Overview",        ionicon: "grid-outline",              path: "/admin/overview",        perm: null },
    { id: "purchases",       label: "Purchases",       ionicon: "cart-outline",              path: "/admin/purchases",       perm: "view_purchases" },
    { id: "users",           label: "Users",           ionicon: "people-outline",            path: "/admin/users",           perm: "view_users" },
    { id: "saved-docs",      label: "Saved Docs",      ionicon: "folder-outline",            path: "/admin/saved-docs",      perm: "view_saved_docs" },
    { id: "discounts",       label: "Discounts",       ionicon: "pricetag-outline",          path: "/admin/discounts",       perm: "view_discounts" },
    { id: "banned-ips",      label: "Banned IPs",      ionicon: "shield-outline",            path: "/admin/banned-ips",      perm: "view_banned_ips" },
    { id: "blog",            label: "Blog",            ionicon: "document-text-outline",     path: "/admin/blog",            perm: "view_blog" },
    { id: "email-templates", label: "Email Templates", ionicon: "mail-outline",              path: "/admin/email-templates", perm: "view_email_templates" },
    { id: "mass-email",      label: "Mass Email",      ionicon: "send-outline",              path: "/admin/mass-email",      perm: "send_mass_email" },
    { id: "site-settings",   label: "Site Settings",   ionicon: "options-outline",           path: "/admin/site-settings",   perm: "view_site_settings" },
    { id: "moderators",      label: "Moderators",      ionicon: "person-add-outline",        path: "/admin/moderators",      perm: "admin_only" },
    { id: "audit-log",       label: "Audit Log",       ionicon: "list-outline",              path: "/admin/audit-log",       perm: "admin_only" },
    { id: "revenue",         label: "Revenue",         ionicon: "trending-up-outline",       path: "/admin/revenue",         perm: "view_purchases" },
    { id: "subscriptions",   label: "Subscriptions",   ionicon: "card-outline",              path: "/admin/subscriptions",   perm: "admin_only" },
    { id: "support",         label: "Support",         ionicon: "chatbox-outline",           path: "/admin/support",         perm: null },
    { id: "export",          label: "Export",          ionicon: "download-outline",          path: "/admin/export",          perm: "view_purchases" },
  ];

  const tabs = allTabs.filter(t => {
    if (t.perm === null)         return true;
    if (t.perm === "admin_only") return isFullAdmin;
    return hasPerm(t.perm);
  });

  // Only a subset of tabs appear in the top-bar segment
  const topbarTabs = tabs.filter(t => !TOPBAR_EXCLUDE.has(t.id));

  const adminInitials = adminProfile?.name
    ? adminProfile.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)
    : adminProfile?.email
      ? adminProfile.email[0].toUpperCase()
      : "A";

  const segmentBtnStyle = {
    "--color":           "rgba(255,255,255,0.65)",
    "--color-checked":   "#ffffff",
    "--indicator-color": "#ffffff",
    "--border-radius":   "0",
    "--padding-top":     "0",
    "--padding-bottom":  "0",
    minHeight: 60,
  };

  return (
    <IonApp className="admin-app">
      <IonSplitPane
        contentId="admin-main"
        when="md"
        style={{ "--side-width": "300px", "--side-max-width": "300px", "--side-min-width": "300px" }}
      >

        {/* ── Sidebar ── */}
        <IonMenu contentId="admin-main" type="overlay" menuId="adminSidebar">
          <IonHeader>
            <IonToolbar>
              <div style={{ padding: "4px 16px", display: "flex", alignItems: "center" }}>
                <button
                  onClick={() => navigate("/admin/overview")}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
                >
                  <img src={MintSlipLogo} alt="MintSlip" style={{ height: 30, width: "auto" }} />
                </button>
              </div>
            </IonToolbar>
          </IonHeader>

          <IonContent>
            <IonList
              lines="inset"
              style={{ flexGrow: 1, overflowY: "auto", padding: "0px", "--background": "transparent" }}
            >
              {tabs.map(tab => (
                <NavItem
                  key={tab.id}
                  tab={tab}
                  isActive={activeTab === tab.id}
                  onClick={() => navigate(tab.path)}
                />
              ))}
            </IonList>
          </IonContent>
        </IonMenu>

        {/* ── Main area ── */}
        <IonPage id="admin-main">
          <IonHeader>
            <IonToolbar>

              {/* Left: hamburger + brand */}
              <IonButtons slot="start">
                <IonMenuButton autoHide={false} style={{ color: "#ffffff" }} />
              </IonButtons>

              {/* Center: scrollable nav tabs (subset) */}
              <IonSegment
                scrollable
                value={activeTab}
                onIonChange={e => {
                  const tab = topbarTabs.find(t => t.id === e.detail.value);
                  if (tab) navigate(tab.path);
                }}
                style={{
                  "--background":      "transparent",
                  "--color":           "rgba(255,255,255,0.65)",
                  "--color-checked":   "#ffffff",
                  "--indicator-color": "#ffffff",
                }}
              >
                {topbarTabs.map(tab => (
                  <IonSegmentButton key={tab.id} value={tab.id} style={segmentBtnStyle}>
                    <IonLabel style={{ fontSize: "0.72rem", fontWeight: 500, margin: 0 }}>
                      {tab.label}
                    </IonLabel>
                  </IonSegmentButton>
                ))}
              </IonSegment>

              {/* Right: actions */}
              <IonButtons slot="end" style={{ gap: 0 }}>

                {/* Dark mode toggle */}
                <button
                  className="admin-header-icon-btn"
                  onClick={toggleDark}
                  title={darkMode ? "Switch to light" : "Switch to dark"}
                >
                  {darkMode
                    ? <Sun  size={17} color="var(--ion-color-warning)" />
                    : <Moon size={17} color="rgba(255,255,255,0.8)" />}
                </button>

                {/* View site */}
                <a
                  href="https://mintslip.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="admin-header-icon-btn"
                  style={{ textDecoration: "none", gap: 4, fontSize: "0.72rem", fontWeight: 600, padding: "7px 10px" }}
                >
                  <ExternalLink size={14} color="rgba(255,255,255,0.8)" />
                  <span style={{ display: window.innerWidth < 640 ? "none" : "inline" }}>Site</span>
                </a>

                {/* Notifications */}
                <div ref={notifRef} style={{ position: "relative" }}>
                  <button
                    className="admin-header-icon-btn"
                    style={{ position: "relative" }}
                    onClick={() => { setNotifOpen(v => !v); if (!notifOpen) handleMarkRead(); }}
                  >
                    <Bell size={18} color="rgba(255,255,255,0.8)" />
                    {unreadCount > 0 && (
                      <IonBadge
                        color="danger"
                        style={{
                          position: "absolute", top: 2, right: 2,
                          fontSize: 9, minWidth: 16, height: 16,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          borderRadius: 999, padding: "0 4px",
                        }}
                      >
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </IonBadge>
                    )}
                  </button>

                  {notifOpen && (
                    <div className="admin-dropdown notif-dropdown">
                      <div className="dropdown-header">
                        <p className="dropdown-header-title">Notifications</p>
                        <div className="dropdown-header-actions">
                          {unreadCount > 0 && (
                            <button className="dropdown-text-btn primary" onClick={handleMarkRead}>
                              Mark all read
                            </button>
                          )}
                          {notifications.length > 0 && (
                            <button className="dropdown-text-btn danger" onClick={handleClearNotifications}>
                              Clear all
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="notif-list">
                        {notifications.length === 0 ? (
                          <div className="notif-empty">
                            <Bell size={28} style={{ marginBottom: 8, opacity: 0.3 }} />
                            <div>No notifications yet</div>
                          </div>
                        ) : notifications.map(n => {
                          const Icon = DOC_ICONS[n.docType] || FileText;
                          return (
                            <div key={n.id} className={`notif-item${n.read ? "" : " unread"}`}>
                              <div className="notif-icon"><Icon size={16} /></div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <p className="notif-title">{n.docDisplayName} created</p>
                                <p className="notif-sub">{n.customerEmail || "Guest"} · ${n.amount?.toFixed(2)}</p>
                                <p className="notif-time">{timeAgo(n.createdAt)}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Profile */}
                <div ref={profileRef} style={{ position: "relative" }}>
                  <button className="admin-profile-btn" onClick={() => setProfileOpen(v => !v)}>
                    {adminProfile?.photo
                      ? <img src={adminProfile.photo} alt="avatar" className="admin-avatar" />
                      : <div className="admin-avatar-initials">{adminInitials}</div>}
                    <span
                      className="admin-profile-name"
                      style={{ display: window.innerWidth < 640 ? "none" : undefined }}
                    >
                      {adminProfile?.name || adminProfile?.email || "Admin"}
                    </span>
                    <ChevronDown size={13} color="rgba(255,255,255,0.7)" />
                  </button>

                  {profileOpen && (
                    <div className="admin-dropdown profile-dropdown">
                      <div className="profile-info">
                        <p className="profile-name">{adminProfile?.name || "Admin"}</p>
                        <p className="profile-email">{adminProfile?.email}</p>
                      </div>
                      <div className="profile-menu">
                        <button
                          className="profile-menu-item"
                          onClick={() => { navigate("/admin/settings"); setProfileOpen(false); }}
                        >
                          <User size={15} color="var(--admin-text-muted)" />
                          Profile & Settings
                        </button>
                        <button
                          className="profile-menu-item"
                          onClick={() => { navigate("/admin/settings?tab=password"); setProfileOpen(false); }}
                        >
                          <Lock size={15} color="var(--admin-text-muted)" />
                          Change Password
                        </button>
                        <div className="profile-menu-divider" />
                        <button
                          className="profile-menu-item danger"
                          onClick={() => { setProfileOpen(false); handleLogout(); }}
                        >
                          <LogOut size={15} />
                          Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>

              </IonButtons>
            </IonToolbar>
          </IonHeader>

          <IonContent style={{ "--background": "var(--ion-background-color)" }}>
            <div className="admin-page-content">
              {children}
            </div>
          </IonContent>

        </IonPage>

      </IonSplitPane>
    </IonApp>
  );
}

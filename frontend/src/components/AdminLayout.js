import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useLocation } from "react-router-dom";
import {
  IonApp, IonSplitPane, IonMenu, IonHeader, IonToolbar,
  IonContent, IonBadge, IonButtons, IonButton, IonIcon,
  IonPage, IonSegment, IonSegmentButton, IonLabel,
  IonList, IonItem, IonAvatar, IonPopover, IonTitle, IonActionSheet,
} from "@ionic/react";
import {
  menuOutline, closeOutline, moonOutline, sunnyOutline, arrowBackOutline, chevronDownOutline,
  calendarOutline, cartOutline, peopleOutline, folderOutline,
  pricetagOutline, shieldOutline, documentTextOutline,
  mailOutline, sendOutline, optionsOutline, personAddOutline,
  listOutline, trendingUpOutline, cardOutline, chatboxOutline,
  downloadOutline, chevronForwardOutline,
  personOutline, lockClosedOutline, logOutOutline, settingsOutline,
  notificationsOutline, addOutline,
} from "ionicons/icons";
import {
  FileText,
  Receipt, FileSpreadsheet, FileBarChart,
  Building2, Car, Briefcase,
} from "lucide-react";
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

// Tabs hidden from the top-bar segment (shown in sidebar or settings)
const TOPBAR_EXCLUDE = new Set([
  "saved-docs", "email-templates",
  "site-settings", "banned-ips", "export",
  "moderators", "mass-email", "audit-log", "support",
  "settings",
]);

// Tabs hidden from the sidebar nav (shown in top-bar)
const SIDEBAR_EXCLUDE = new Set([
  "calendar", "purchases", "users", "discounts", "blog", "revenue", "subscriptions",
  "site-settings",
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
    <button
      onClick={onClick}
      className="sidebar-nav-btn"
      style={{
        width: "100%",
        background: isActive ? "var(--ion-color-step-100)" : "transparent",
        border: "none",
        borderBottom: "1px solid var(--app-divider)",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: "0 20px",
        minHeight: 48,
        textAlign: "left",
        color: isActive ? "var(--ion-color-primary)" : "var(--ion-text-color)",
        fontWeight: isActive ? 600 : 400,
        fontFamily: "var(--ion-font-family, system-ui)",
        fontSize: "0.9375rem",
      }}
    >
      <IonIcon icon={tab.icon} style={{ fontSize: 20, flexShrink: 0, color: "inherit" }} />
      {tab.label}
    </button>
  );
}

// Persists sidebar state across route-driven remounts
let _adminSidebarOpen = true;

export default function AdminLayout({ children, fillHeight = false }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount,   setUnreadCount]   = useState(0);
  const [notifOpen,     setNotifOpen]     = useState(false);
  const [createOpen,    setCreateOpen]    = useState(false);
  const [isMobile,      setIsMobile]      = useState(window.innerWidth < 768);

  const [adminProfile, setAdminProfile] = useState(null);

  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem("adminDarkMode") === "true",
  );
  const [sidebarOpen, _setSidebarOpen] = useState(_adminSidebarOpen);
  const setSidebarOpen = (valOrFn) => {
    _setSidebarOpen(prev => {
      const next = typeof valOrFn === "function" ? valOrFn(prev) : valOrFn;
      _adminSidebarOpen = next;
      return next;
    });
  };
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const handleMenuToggle = () => {
    if (window.innerWidth < 768) {
      setMobileSidebarOpen(v => !v);
    } else {
      setSidebarOpen(prev => !prev);
    }
  };

  const handleCloseSidebar = () => {
    if (window.innerWidth < 768) {
      setMobileSidebarOpen(false);
    } else {
      setSidebarOpen(false);
    }
  };

  /* Apply/remove dark class on body */
  useEffect(() => {
    document.body.classList.toggle("dark", darkMode);
    localStorage.setItem("adminDarkMode", darkMode);
  }, [darkMode]);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  /* Apply ionic-active so public pages still scroll when user navigates back */
  useEffect(() => {
    document.documentElement.classList.add("ionic-active");
    document.body.classList.add("ionic-active");
    return () => {
      document.documentElement.classList.remove("ionic-active");
      document.body.classList.remove("ionic-active");
    };
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
    if (path.includes("/admin/calendar"))        return "calendar";
    if (path.includes("/admin/calendar"))        return "calendar";
    return "calendar";
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
    { id: "calendar",        label: "Calendar",        icon: calendarOutline,      path: "/admin/calendar",        perm: null },
    { id: "purchases",       label: "Purchases",       icon: cartOutline,          path: "/admin/purchases",       perm: "view_purchases" },
    { id: "users",           label: "Users",           icon: peopleOutline,        path: "/admin/users",           perm: "view_users" },
    { id: "saved-docs",      label: "Saved Docs",      icon: folderOutline,        path: "/admin/saved-docs",      perm: "view_saved_docs" },
    { id: "discounts",       label: "Discounts",       icon: pricetagOutline,      path: "/admin/discounts",       perm: "view_discounts" },
    { id: "banned-ips",      label: "Banned IPs",      icon: shieldOutline,        path: "/admin/banned-ips",      perm: "view_banned_ips" },
    { id: "blog",            label: "Blog",            icon: documentTextOutline,  path: "/admin/blog",            perm: "view_blog" },
    { id: "email-templates", label: "Email Templates", icon: mailOutline,          path: "/admin/email-templates", perm: "view_email_templates" },
    { id: "mass-email",      label: "Mass Email",      icon: sendOutline,          path: "/admin/mass-email",      perm: "send_mass_email" },
    { id: "site-settings",   label: "Site Settings",   icon: optionsOutline,       path: "/admin/site-settings",   perm: "view_site_settings" },
    { id: "moderators",      label: "Moderators",      icon: personAddOutline,     path: "/admin/moderators",      perm: "admin_only" },
    { id: "audit-log",       label: "Audit Log",       icon: listOutline,          path: "/admin/audit-log",       perm: "admin_only" },
    { id: "revenue",         label: "Revenue",         icon: trendingUpOutline,    path: "/admin/revenue",         perm: "view_purchases" },
    { id: "subscriptions",   label: "Subscriptions",   icon: cardOutline,          path: "/admin/subscriptions",   perm: "admin_only" },
    { id: "support",         label: "Support",         icon: chatboxOutline,       path: "/admin/support",         perm: null },
    { id: "export",          label: "Export",          icon: downloadOutline,      path: "/admin/export",          perm: "view_purchases" },
  ];

  const tabs = allTabs.filter(t => {
    if (t.perm === null)         return true;
    if (t.perm === "admin_only") return isFullAdmin;
    return hasPerm(t.perm);
  });

  // Only a subset of tabs appear in the top-bar segment
  const topbarTabs = tabs.filter(t => !TOPBAR_EXCLUDE.has(t.id));

  const isInnerPage = TOPBAR_EXCLUDE.has(activeTab);
  const pageTitle   = activeTab === "settings"
    ? "Settings"
    : allTabs.find(t => t.id === activeTab)?.label || "";

  const adminInitials = adminProfile?.name
    ? adminProfile.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)
    : adminProfile?.email
      ? adminProfile.email[0].toUpperCase()
      : "A";

  const segmentBtnStyle = {
    "--color":              "rgba(255,255,255,0.7)",
    "--color-checked":      "#ffffff",
    "--indicator-color":    "#ffffff",
    "--background-checked": "rgba(255,255,255,0.12)",
    "--border-radius":      "0",
    "--padding-top":        "0",
    "--padding-bottom":     "0",
    minHeight: 60,
    flexShrink: 0,
  };

  return (
    <IonApp className="admin-app">
      <IonSplitPane
        contentId="admin-main"
        when={sidebarOpen ? "md" : "(max-width: -1px)"}
        style={{ "--side-width": "300px", "--side-max-width": "300px", "--side-min-width": "300px" }}
      >

        {/* ── Sidebar ── */}
        <IonMenu contentId="admin-main" type="overlay" menuId="adminSidebar" disabled={isMobile}>
          <IonHeader>
            <IonToolbar>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 12px", width: "100%" }}>
                {/* Close sidebar */}
                <IonButton fill="clear" onClick={handleCloseSidebar} style={{ "--border-radius": "50%" }}>
                  <span slot="icon-only" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", lineHeight: 0, flexShrink: 0, fontSize: "20px", color: "var(--ion-text-color)" }}>
                    <IonIcon icon={closeOutline} style={{ fontSize: "inherit", color: "inherit", pointerEvents: "none" }} />
                  </span>
                </IonButton>

                {/* Logo */}
                <button onClick={() => navigate("/admin/calendar")} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                  <img src={MintSlipLogo} alt="MintSlip" style={{ height: 30, width: "auto" }} />
                </button>

                {/* Dark mode toggle */}
                <IonButton fill="clear" onClick={toggleDark} title={darkMode ? "Light mode" : "Dark mode"} style={{ "--border-radius": "50%" }}>
                  <span slot="icon-only" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", lineHeight: 0, flexShrink: 0, fontSize: "20px", color: "var(--ion-text-color)" }}>
                    <IonIcon icon={darkMode ? sunnyOutline : moonOutline} style={{ fontSize: "inherit", color: "inherit", pointerEvents: "none" }} />
                  </span>
                </IonButton>
              </div>
            </IonToolbar>
          </IonHeader>

          <IonContent>
            {/* Profile card */}
            <div style={{ padding: "12px 8px 12px", flexShrink: 0 }}>
              <div style={{ borderRadius: 10, overflow: "hidden", background: "var(--ion-card-background)", border: "1px solid var(--app-divider)" }}>
                {/* Business row */}
                <div id="sidebar-biz-trigger" style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 20px", cursor: "pointer", borderBottom: "1px solid var(--app-divider)" }}>
                  <IonAvatar style={{ width: 40, height: 40, flexShrink: 0 }}>
                    <img src={MintSlipLogo} alt="MintSlip" style={{ width: "100%", height: "100%", objectFit: "contain", borderRadius: "50%", background: "var(--ion-color-step-100)" }} />
                  </IonAvatar>
                  <div style={{ minWidth: 0, flex: "1 1 0%" }}>
                    <div style={{ fontSize: "0.68rem", color: "var(--ion-color-medium)", lineHeight: 1.2, marginBottom: 1 }}>Business</div>
                    <div style={{ fontSize: "0.9rem", color: "var(--ion-text-color)", lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>MintSlip</div>
                  </div>
                  <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", lineHeight: 0, flexShrink: 0, fontSize: 18, color: "var(--ion-color-medium)" }}>
                    <IonIcon icon={chevronForwardOutline} style={{ fontSize: "inherit", color: "inherit", pointerEvents: "none" }} />
                  </span>
                </div>

                {/* User row */}
                <div id="sidebar-user-trigger" style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 20px", cursor: "pointer" }}>
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    <IonAvatar style={{ width: 40, height: 40 }}>
                      {adminProfile?.photo
                        ? <img src={adminProfile.photo} alt={adminProfile?.name || "Admin"} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
                        : <div style={{ width: "100%", height: "100%", borderRadius: "50%", background: "var(--ion-color-primary)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem", fontWeight: 700 }}>{adminInitials}</div>
                      }
                    </IonAvatar>
                  </div>
                  <div style={{ minWidth: 0, flex: "1 1 0%" }}>
                    <div style={{ fontSize: "0.9rem", color: "var(--ion-text-color)", lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 500 }}>
                      {adminProfile?.name || adminProfile?.email || "Admin"}
                    </div>
                    <div style={{ fontSize: "0.72rem", color: "var(--ion-color-medium)", lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {adminRole === "admin" ? "Super Admin" : "Moderator"}
                    </div>
                  </div>
                  <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", lineHeight: 0, flexShrink: 0, fontSize: 18, color: "var(--ion-color-medium)" }}>
                    <IonIcon icon={chevronForwardOutline} style={{ fontSize: "inherit", color: "inherit", pointerEvents: "none" }} />
                  </span>
                </div>
              </div>
            </div>

            {/* Business popover */}
            <IonPopover
              trigger="sidebar-biz-trigger"
              triggerAction="click"
              side="bottom"
              alignment="start"
              style={{ "--width": "284px", "--offset-y": "4px" }}
            >
              <IonContent>
                <IonList lines="none" style={{ padding: "4px 0" }}>
                  <IonItem
                    button
                    detail={false}
                    onClick={() => { navigate("/admin/site-settings"); document.querySelectorAll("ion-popover").forEach(p => p.dismiss()); }}
                    style={{ "--min-height": "44px", "--padding-start": "14px", "--inner-padding-end": "14px", fontSize: "0.88rem" }}
                  >
                    <div slot="start" style={{ display: "inline-flex", alignItems: "center", marginRight: 10 }}>
                      <IonIcon icon={settingsOutline} style={{ fontSize: 18 }} />
                    </div>
                    <IonLabel>Site Settings</IonLabel>
                  </IonItem>
                </IonList>
              </IonContent>
            </IonPopover>

            {/* User profile popover */}
            <IonPopover
              trigger="sidebar-user-trigger"
              triggerAction="click"
              side="bottom"
              alignment="start"
              style={{ "--width": "284px", "--offset-y": "4px" }}
            >
              <IonContent>
                <IonList lines="none" style={{ padding: "4px 0" }}>
                  <IonItem
                    button
                    detail={false}
                    onClick={() => { navigate("/admin/settings"); document.querySelector("ion-popover")?.dismiss(); }}
                    style={{ "--min-height": "44px", "--padding-start": "14px", "--inner-padding-end": "14px", fontSize: "0.88rem" }}
                  >
                    <div slot="start" style={{ display: "inline-flex", alignItems: "center", marginRight: 10 }}>
                      <IonIcon icon={personOutline} style={{ fontSize: 18 }} />
                    </div>
                    <IonLabel>Profile &amp; Settings</IonLabel>
                  </IonItem>
                  <IonItem
                    button
                    detail={false}
                    onClick={() => { navigate("/admin/settings?tab=password"); document.querySelector("ion-popover")?.dismiss(); }}
                    style={{ "--min-height": "44px", "--padding-start": "14px", "--inner-padding-end": "14px", fontSize: "0.88rem" }}
                  >
                    <div slot="start" style={{ display: "inline-flex", alignItems: "center", marginRight: 10 }}>
                      <IonIcon icon={lockClosedOutline} style={{ fontSize: 18 }} />
                    </div>
                    <IonLabel>Change Password</IonLabel>
                  </IonItem>
                  <div style={{ height: 1, background: "var(--app-divider)", margin: "2px 0" }} />
                  <IonItem
                    button
                    detail={false}
                    onClick={() => { document.querySelector("ion-popover")?.dismiss(); handleLogout(); }}
                    style={{ "--min-height": "44px", "--padding-start": "14px", "--inner-padding-end": "14px", "--color": "var(--ion-color-danger)", fontSize: "0.88rem" }}
                  >
                    <div slot="start" style={{ display: "inline-flex", alignItems: "center", marginRight: 10 }}>
                      <IonIcon icon={logOutOutline} style={{ fontSize: 18, color: "var(--ion-color-danger)" }} />
                    </div>
                    <IonLabel>Log Out</IonLabel>
                  </IonItem>
                </IonList>
              </IonContent>
            </IonPopover>

            <div style={{ flexGrow: 1, overflowY: "auto", padding: "0 0 8px 0" }}>
              {tabs.filter(t => !SIDEBAR_EXCLUDE.has(t.id)).map(tab => (
                <NavItem
                  key={tab.id}
                  tab={tab}
                  isActive={activeTab === tab.id}
                  onClick={() => { navigate(tab.path); handleCloseSidebar(); }}
                />
              ))}
            </div>

            {/* Pinned settings button */}
            <div slot="fixed" style={{ bottom: 0, left: 0, right: 0, background: "var(--app-sidebar-bg, #fff)", borderTop: "1px solid var(--app-divider)", zIndex: 10 }}>
              <button
                onClick={() => { navigate("/admin/settings"); handleCloseSidebar(); }}
                className="sidebar-nav-btn"
                style={{
                  width: "100%",
                  background: activeTab === "settings" ? "var(--ion-color-step-100)" : "transparent",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  padding: "0 20px",
                  minHeight: 48,
                  textAlign: "left",
                  color: activeTab === "settings" ? "var(--ion-color-primary)" : "var(--ion-text-color)",
                  fontWeight: activeTab === "settings" ? 600 : 400,
                  fontFamily: "var(--ion-font-family, system-ui)",
                  fontSize: "0.9375rem",
                }}
              >
                <IonIcon icon={settingsOutline} style={{ fontSize: 20, flexShrink: 0, color: "inherit" }} />
                Settings
              </button>
            </div>
          </IonContent>
        </IonMenu>

        {/* ── Main area ── */}
        <IonPage id="admin-main">
          <IonHeader>
            <IonToolbar>
              {isInnerPage ? (
                <>
                  {/* Inner page: back arrow + title */}
                  <IonButtons slot="start">
                    <IonButton
                      fill="clear"
                      onClick={() => { setSidebarOpen(true); navigate(-1); }}
                      style={{ "--color": "rgba(255,255,255,0.85)", "--border-radius": "50%" }}
                    >
                      <span slot="icon-only" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", lineHeight: 0, flexShrink: 0, fontSize: "22px" }}>
                        <IonIcon icon={arrowBackOutline} style={{ fontSize: "inherit", color: "inherit", pointerEvents: "none" }} />
                      </span>
                    </IonButton>
                  </IonButtons>
                  <IonTitle style={{ color: "#ffffff", fontSize: "1rem", fontWeight: 600 }}>
                    {pageTitle}
                  </IonTitle>
                </>
              ) : (
                <>
                  {/* Hamburger */}
                  <IonButtons slot="start">
                    <IonButton fill="clear" onClick={handleMenuToggle} style={{ "--color": "rgba(255,255,255,0.85)", "--border-radius": "50%" }}>
                      <span slot="icon-only" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", lineHeight: 0, flexShrink: 0, fontSize: "20px" }}>
                        <IonIcon icon={menuOutline} style={{ fontSize: "inherit", color: "inherit", pointerEvents: "none" }} />
                      </span>
                    </IonButton>
                  </IonButtons>

                  {isMobile ? (
                    <>
                      {/* Mobile: current tab label button → popover */}
                      <IonButton id="mobile-nav-trigger" fill="clear" style={{ "--color": "#fff", flex: 1, maxWidth: "none", textTransform: "none" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.88rem", fontWeight: 700, letterSpacing: "0.03em" }}>
                          {topbarTabs.find(t => t.id === activeTab)?.label || "Navigate"}
                          <IonIcon icon={chevronDownOutline} style={{ fontSize: 14, pointerEvents: "none" }} />
                        </span>
                      </IonButton>
                      <IonPopover trigger="mobile-nav-trigger" triggerAction="click" side="bottom" alignment="start" style={{ "--width": "240px" }}>
                        <IonContent>
                          <IonList lines="none" style={{ padding: "4px 0" }}>
                            {topbarTabs.map(tab => (
                              <IonItem
                                key={tab.id}
                                button
                                detail={false}
                                onClick={() => { navigate(tab.path); document.querySelectorAll("ion-popover").forEach(p => p.dismiss()); }}
                                style={{
                                  "--min-height": "48px",
                                  "--padding-start": "14px",
                                  "--inner-padding-end": "14px",
                                  "--background": activeTab === tab.id ? "var(--ion-color-step-100)" : "transparent",
                                  "--color": activeTab === tab.id ? "var(--ion-color-primary)" : "var(--ion-text-color)",
                                  fontWeight: activeTab === tab.id ? 600 : 400,
                                }}
                              >
                                <div slot="start" style={{ display: "inline-flex", alignItems: "center", marginRight: 10 }}>
                                  <IonIcon icon={tab.icon} style={{ fontSize: 18 }} />
                                </div>
                                <IonLabel>{tab.label}</IonLabel>
                              </IonItem>
                            ))}
                          </IonList>
                        </IonContent>
                      </IonPopover>
                    </>
                  ) : (
                    /* Desktop: scrollable segment */
                    <IonSegment
                      scrollable
                      value={activeTab}
                      onIonChange={e => {
                        const tab = topbarTabs.find(t => t.id === e.detail.value);
                        if (tab) navigate(tab.path);
                      }}
                      style={{ "--background": "transparent", "--color": "rgba(255,255,255,0.65)", "--color-checked": "#ffffff", "--indicator-color": "#ffffff" }}
                    >
                      {topbarTabs.map(tab => (
                        <IonSegmentButton key={tab.id} value={tab.id} layout="icon-start" style={segmentBtnStyle}>
                          <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", lineHeight: 0, flexShrink: 0, fontSize: "1rem" }}>
                            <IonIcon icon={tab.icon} style={{ fontSize: "inherit", color: "inherit", pointerEvents: "none" }} />
                          </span>
                          <IonLabel style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                            {tab.label}
                          </IonLabel>
                        </IonSegmentButton>
                      ))}
                    </IonSegment>
                  )}
                </>
              )}

              {/* Right: notifications (always visible) */}
              <IonButtons slot="end" style={{ gap: 0 }}>

                {/* Notifications */}
                <div style={{ position: "relative" }}>
                  <IonButton
                    fill="clear"
                    onClick={() => { setNotifOpen(v => !v); if (!notifOpen) handleMarkRead(); }}
                    style={{ "--color": "rgba(255,255,255,0.8)", "--border-radius": "50%" }}
                  >
                    <span slot="icon-only" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", lineHeight: 0, flexShrink: 0, fontSize: "22px" }}>
                      <IonIcon icon={notificationsOutline} style={{ fontSize: "inherit", color: "inherit", pointerEvents: "none" }} />
                    </span>
                  </IonButton>
                  {unreadCount > 0 && (
                    <IonBadge color="danger" style={{ position: "absolute", top: 6, right: 6, fontSize: 9, minWidth: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 999, padding: "0 4px", pointerEvents: "none" }}>
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </IonBadge>
                  )}
                </div>

              </IonButtons>
            </IonToolbar>
          </IonHeader>

          <IonContent style={{ "--background": "var(--ion-background-color)" }}>
            {fillHeight ? (
              <div style={{ height: "100%", overflow: "hidden" }}>{children}</div>
            ) : (
              <div className="admin-page-content">{children}</div>
            )}
          </IonContent>

        </IonPage>

      </IonSplitPane>

      {/* ── Floating Create button (topbar pages only) ── */}
      {!isInnerPage && (
        <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", zIndex: 1000 }}>
          <IonButton
            onClick={() => setCreateOpen(true)}
            style={{ "--background": "#E65100", "--background-activated": "#E65100", "--background-hover": "#E65100", "--border-color": "#E65100", "--box-shadow": "0 6px 20px rgba(0,0,0,0.3)" }}
          >
            <span slot="start" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", lineHeight: 0, flexShrink: 0, fontSize: "1rem" }}>
              <IonIcon icon={addOutline} style={{ fontSize: "inherit", color: "inherit", pointerEvents: "none" }} />
            </span>
            Create
          </IonButton>
        </div>
      )}

      <IonActionSheet
        isOpen={createOpen}
        mode="ios"
        onDidDismiss={() => setCreateOpen(false)}
        buttons={[
          {
            text: "Create Pay Stub",
            handler: () => { navigate("/app/paystub"); },
          },
          {
            text: "Create Canadian Paystub",
            handler: () => { navigate("/app/canadian-paystub"); },
          },
          {
            text: "Cancel",
            role: "cancel",
          },
        ]}
      />

      {/* ── Notifications drawer (right) ── */}
      {notifOpen && (
        <div onClick={() => setNotifOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 9998, background: "rgba(0,0,0,0.3)" }} />
      )}
      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0, zIndex: 9999,
        width: 340, maxWidth: "90vw",
        background: "var(--ion-card-background)",
        boxShadow: "-4px 0 24px rgba(0,0,0,0.18)",
        display: "flex", flexDirection: "column",
        transform: notifOpen ? "translateX(0)" : "translateX(100%)",
        transition: "transform 0.28s cubic-bezier(0.4,0,0.2,1)",
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", padding: "0 8px 0 16px", minHeight: 60, borderBottom: "1px solid var(--app-divider)", flexShrink: 0, gap: 8 }}>
          <div style={{ flex: 1, fontWeight: 600, fontSize: "1rem" }}>Notifications</div>
          {unreadCount > 0 && (
            <IonButton fill="clear" onClick={handleMarkRead} style={{ "--color": "var(--ion-color-primary)", fontSize: "0.78rem" }}>
              Mark all read
            </IonButton>
          )}
          {notifications.length > 0 && (
            <IonButton fill="clear" onClick={handleClearNotifications} style={{ "--color": "var(--ion-color-danger)", fontSize: "0.78rem" }}>
              Clear all
            </IonButton>
          )}
          <IonButton fill="clear" onClick={() => setNotifOpen(false)} style={{ "--color": "var(--ion-color-medium)", "--border-radius": "50%" }}>
            <span slot="icon-only" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", lineHeight: 0, flexShrink: 0, fontSize: "20px" }}>
              <IonIcon icon={closeOutline} style={{ fontSize: "inherit", color: "inherit", pointerEvents: "none" }} />
            </span>
          </IonButton>
        </div>
        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {notifications.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", opacity: 0.4, gap: 12 }}>
              <IonIcon icon={notificationsOutline} style={{ fontSize: 40 }} />
              <div style={{ fontSize: "0.9rem" }}>No notifications yet</div>
            </div>
          ) : (
            <IonList lines="inset" style={{ padding: 0, "--background": "transparent" }}>
              {notifications.map(n => {
                const Icon = DOC_ICONS[n.docType] || FileText;
                return (
                  <IonItem key={n.id} style={{ "--background": n.read ? "transparent" : "var(--ion-color-step-50)", "--min-height": "64px", "--padding-start": "16px", "--inner-padding-end": "16px" }}>
                    <div slot="start" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: "50%", background: "var(--ion-color-step-100)", flexShrink: 0 }}>
                      <Icon size={16} />
                    </div>
                    <IonLabel style={{ whiteSpace: "normal" }}>
                      <div style={{ fontSize: "0.85rem", fontWeight: 600 }}>{n.docDisplayName} created</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--ion-color-medium)", marginTop: 2 }}>{n.customerEmail || "Guest"} · ${n.amount?.toFixed(2)}</div>
                      <div style={{ fontSize: "0.72rem", color: "var(--ion-color-medium)", marginTop: 2 }}>{timeAgo(n.createdAt)}</div>
                    </IonLabel>
                    {!n.read && <IonBadge color="primary" slot="end" style={{ width: 8, height: 8, borderRadius: "50%", padding: 0, minWidth: 0 }} />}
                  </IonItem>
                );
              })}
            </IonList>
          )}
        </div>
      </div>

      {mobileSidebarOpen && createPortal(<>
      {/* ── Mobile sidebar overlay ── */}
      <div
        className="mob-sidebar-backdrop"
        onClick={() => setMobileSidebarOpen(false)}
        style={{ position: "fixed", inset: 0, zIndex: 9996, background: "rgba(0,0,0,0.5)" }}
      />
      <div
        className="mob-sidebar-panel"
        style={{
          position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 9997,
          width: 300, maxWidth: "85vw",
          background: "var(--app-sidebar-bg, #ffffff)",
          boxShadow: "4px 0 24px rgba(0,0,0,0.25)",
          display: "flex", flexDirection: "column",
          overflowY: "auto",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 12px", minHeight: 60, flexShrink: 0, borderBottom: "1px solid var(--app-divider)" }}>
          <button onClick={() => setMobileSidebarOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", padding: 8, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <IonIcon icon={closeOutline} style={{ fontSize: 22, color: "var(--ion-text-color)" }} />
          </button>
          <button onClick={() => { navigate("/admin/calendar"); setMobileSidebarOpen(false); }} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
            <img src={MintSlipLogo} alt="MintSlip" style={{ height: 30, width: "auto" }} />
          </button>
          <button onClick={toggleDark} style={{ background: "none", border: "none", cursor: "pointer", padding: 8, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <IonIcon icon={darkMode ? sunnyOutline : moonOutline} style={{ fontSize: 22, color: "var(--ion-text-color)" }} />
          </button>
        </div>

        {/* Profile card */}
        <div style={{ padding: "12px 8px", flexShrink: 0 }}>
          <div style={{ borderRadius: 10, overflow: "hidden", background: "var(--ion-card-background)", border: "1px solid var(--app-divider)" }}>
            <button onClick={() => { navigate("/admin/site-settings"); setMobileSidebarOpen(false); }} style={{ width: "100%", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 12, padding: "12px 20px", borderBottom: "1px solid var(--app-divider)", textAlign: "left" }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--ion-color-step-100)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <img src={MintSlipLogo} alt="MintSlip" style={{ width: 30, height: 30, objectFit: "contain" }} />
              </div>
              <div style={{ minWidth: 0, flex: "1 1 0%" }}>
                <div style={{ fontSize: "0.68rem", color: "var(--ion-color-medium)", lineHeight: 1.2, marginBottom: 1 }}>Business</div>
                <div style={{ fontSize: "0.9rem", color: "var(--ion-text-color)", lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>MintSlip</div>
              </div>
              <IonIcon icon={chevronForwardOutline} style={{ fontSize: 18, color: "var(--ion-color-medium)", flexShrink: 0 }} />
            </button>
            <button onClick={() => { navigate("/admin/settings"); setMobileSidebarOpen(false); }} style={{ width: "100%", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 12, padding: "12px 20px", textAlign: "left" }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--ion-color-primary)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                {adminProfile?.photo
                  ? <img src={adminProfile.photo} alt="admin" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <span style={{ color: "#fff", fontSize: "1rem", fontWeight: 700 }}>{adminInitials}</span>
                }
              </div>
              <div style={{ minWidth: 0, flex: "1 1 0%" }}>
                <div style={{ fontSize: "0.9rem", color: "var(--ion-text-color)", lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 500 }}>{adminProfile?.name || adminProfile?.email || "Admin"}</div>
                <div style={{ fontSize: "0.72rem", color: "var(--ion-color-medium)", lineHeight: 1.2 }}>{adminRole === "admin" ? "Super Admin" : "Moderator"}</div>
              </div>
              <IonIcon icon={chevronForwardOutline} style={{ fontSize: 18, color: "var(--ion-color-medium)", flexShrink: 0 }} />
            </button>
          </div>
        </div>

        {/* Nav links */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {tabs.filter(t => !SIDEBAR_EXCLUDE.has(t.id)).map(tab => (
            <button
              key={tab.id}
              onClick={() => { navigate(tab.path); setMobileSidebarOpen(false); }}
              style={{
                width: "100%", background: activeTab === tab.id ? "rgba(0,0,0,0.08)" : "none",
                border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 16,
                padding: "0 20px", minHeight: 48, textAlign: "left",
                color: activeTab === tab.id ? "#16a34a" : "var(--ion-text-color)",
                fontWeight: activeTab === tab.id ? 600 : 400,
                fontFamily: "var(--ion-font-family)", fontSize: "0.9375rem",
              }}
            >
              <IonIcon icon={tab.icon} style={{ fontSize: 20, flexShrink: 0, color: "inherit" }} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Settings pinned at bottom */}
        <div style={{ borderTop: "1px solid var(--app-divider)", flexShrink: 0 }}>
          <button
            onClick={() => { navigate("/admin/settings"); setMobileSidebarOpen(false); }}
            style={{
              width: "100%", background: activeTab === "settings" ? "rgba(0,0,0,0.08)" : "none",
              border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 16,
              padding: "0 20px", minHeight: 48, textAlign: "left",
              color: activeTab === "settings" ? "#16a34a" : "var(--ion-text-color)",
              fontWeight: activeTab === "settings" ? 600 : 400,
              fontFamily: "var(--ion-font-family)", fontSize: "0.9375rem",
            }}
          >
            <IonIcon icon={settingsOutline} style={{ fontSize: 20, flexShrink: 0, color: "inherit" }} />
            Settings
          </button>
        </div>
      </div>
      </>, document.body)}

    </IonApp>
  );
}

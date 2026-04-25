import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  IonApp, IonSplitPane, IonMenu, IonHeader, IonToolbar,
  IonContent, IonMenuButton, IonBadge, IonButton,
} from "@ionic/react";
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
} from "@dnd-kit/core";
import {
  SortableContext, useSortable, verticalListSortingStrategy, arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  LayoutDashboard, ShoppingCart, Users, Tag, FileText, LogOut,
  Shield, FolderArchive, Mail, SlidersHorizontal, Bell, Settings,
  Lock, ChevronDown, Receipt, FileSpreadsheet, FileBarChart,
  Building2, Car, Briefcase, User, Send, ExternalLink, UserCog,
  ClipboardList, Inbox, Download, TrendingUp, CreditCard, Moon, Sun,
  GripVertical,
} from "lucide-react";
import MintSlipLogo from "../assests/mintslip-logo.png";
import "../admin-theme.css";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";

const DOC_ICONS = {
  "paystub":            Receipt,
  "canadian-paystub":   Receipt,
  "resume":             FileText,
  "w2":                 FileSpreadsheet,
  "w9":                 FileSpreadsheet,
  "1099-nec":           FileSpreadsheet,
  "1099-misc":          FileSpreadsheet,
  "bank-statement":     Building2,
  "offer-letter":       Briefcase,
  "vehicle-bill-of-sale": Car,
  "schedule-c":         FileBarChart,
  "utility-bill":       FileText,
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function SortableNavItem({ tab, isActive, onClick }) {
  const {
    attributes, listeners, setNodeRef, transform, transition, isDragging,
  } = useSortable({ id: tab.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
  };
  const Icon = tab.icon;
  return (
    <div ref={setNodeRef} style={style} className="sortable-nav-item">
      <button
        onClick={onClick}
        className={`admin-nav-btn${isActive ? " active" : ""}`}
      >
        <span
          {...attributes}
          {...listeners}
          className="drag-handle"
          onClick={e => e.stopPropagation()}
        >
          <GripVertical size={13} />
        </span>
        <Icon size={16} style={{ flexShrink: 0 }} />
        {tab.label}
      </button>
    </div>
  );
}

export default function AdminLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef(null);

  const [adminProfile, setAdminProfile] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem("adminDarkMode") === "true",
  );
  const [navOrder, setNavOrder] = useState(() => {
    try { return JSON.parse(localStorage.getItem("adminNavOrder")) || null; }
    catch { return null; }
  });

  const dnsSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  /* Apply ionic-active class so public pages still scroll */
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
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
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

  const toggleDark = () => {
    setDarkMode(prev => {
      const next = !prev;
      localStorage.setItem("adminDarkMode", next);
      return next;
    });
  };

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

  const adminRole = localStorage.getItem("adminRole") || "admin";
  const adminPermissions = (() => {
    try { return JSON.parse(localStorage.getItem("adminPermissions")); }
    catch { return null; }
  })();
  const isFullAdmin = adminRole === "admin";
  const hasPerm = (key) => isFullAdmin || (adminPermissions && adminPermissions[key]);

  const allTabs = [
    { id: "overview",        label: "Overview",          icon: LayoutDashboard,   path: "/admin/overview",         perm: null },
    { id: "purchases",       label: "Purchases",         icon: ShoppingCart,      path: "/admin/purchases",        perm: "view_purchases" },
    { id: "users",           label: "Users",             icon: Users,             path: "/admin/users",            perm: "view_users" },
    { id: "saved-docs",      label: "Saved Docs",        icon: FolderArchive,     path: "/admin/saved-docs",       perm: "view_saved_docs" },
    { id: "discounts",       label: "Discounts",         icon: Tag,               path: "/admin/discounts",        perm: "view_discounts" },
    { id: "banned-ips",      label: "Banned IPs",        icon: Shield,            path: "/admin/banned-ips",       perm: "view_banned_ips" },
    { id: "blog",            label: "Blog",              icon: FileText,          path: "/admin/blog",             perm: "view_blog" },
    { id: "email-templates", label: "Email Templates",   icon: Mail,              path: "/admin/email-templates",  perm: "view_email_templates" },
    { id: "mass-email",      label: "Mass Email",        icon: Send,              path: "/admin/mass-email",       perm: "send_mass_email" },
    { id: "site-settings",   label: "Site Settings",     icon: SlidersHorizontal, path: "/admin/site-settings",    perm: "view_site_settings" },
    { id: "moderators",      label: "Moderators",        icon: UserCog,           path: "/admin/moderators",       perm: "admin_only" },
    { id: "audit-log",       label: "Audit Log",         icon: ClipboardList,     path: "/admin/audit-log",        perm: "admin_only" },
    { id: "revenue",         label: "Revenue",           icon: TrendingUp,        path: "/admin/revenue",          perm: "view_purchases" },
    { id: "subscriptions",   label: "Subscriptions",     icon: CreditCard,        path: "/admin/subscriptions",    perm: "admin_only" },
    { id: "support",         label: "Support Inbox",     icon: Inbox,             path: "/admin/support",          perm: null },
    { id: "export",          label: "Data Export",       icon: Download,          path: "/admin/export",           perm: "view_purchases" },
  ];

  const tabs = allTabs.filter(t => {
    if (t.perm === null) return true;
    if (t.perm === "admin_only") return isFullAdmin;
    return hasPerm(t.perm);
  });

  const sortedTabs = (() => {
    if (!navOrder) return tabs;
    const tabMap = Object.fromEntries(tabs.map(t => [t.id, t]));
    const ordered = navOrder.filter(id => tabMap[id]).map(id => tabMap[id]);
    const unseen  = tabs.filter(t => !navOrder.includes(t.id));
    return [...ordered, ...unseen];
  })();

  const handleNavDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    const oldIdx = sortedTabs.findIndex(t => t.id === active.id);
    const newIdx = sortedTabs.findIndex(t => t.id === over.id);
    const reordered = arrayMove(sortedTabs, oldIdx, newIdx);
    const newOrder = reordered.map(t => t.id);
    setNavOrder(newOrder);
    localStorage.setItem("adminNavOrder", JSON.stringify(newOrder));
  };

  const adminInitials = adminProfile?.name
    ? adminProfile.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)
    : adminProfile?.email
      ? adminProfile.email[0].toUpperCase()
      : "A";

  return (
    <IonApp className={darkMode ? "ion-palette-dark admin-app" : "admin-app"}>
      <IonSplitPane contentId="admin-main" when="md">

        {/* ── Sidebar ── */}
        <IonMenu contentId="admin-main" type="overlay" menuId="adminSidebar">
          <IonHeader>
            <IonToolbar>
              <div style={{ padding: "4px 8px", display: "flex", alignItems: "center" }}>
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
            <DndContext
              sensors={dnsSensors}
              collisionDetection={closestCenter}
              onDragEnd={handleNavDragEnd}
            >
              <SortableContext
                items={sortedTabs.map(t => t.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="admin-nav-list">
                  {sortedTabs.map(tab => (
                    <SortableNavItem
                      key={tab.id}
                      tab={tab}
                      isActive={activeTab === tab.id}
                      onClick={() => navigate(tab.path)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </IonContent>
        </IonMenu>

        {/* ── Main area (plain divs — no Ionic page/header to avoid offset bugs) ── */}
        <div id="admin-main" className="ion-page" style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>

          {/* Topbar */}
          <div className="admin-topbar">
            <div className="admin-topbar-start">
              <IonMenuButton autoHide={false} style={{ color: "var(--admin-text-muted)" }} />
            </div>

            <div className="admin-topbar-end">
              {/* Dark mode */}
              <button className="admin-header-icon-btn" onClick={toggleDark} title={darkMode ? "Switch to light mode" : "Switch to dark mode"}>
                {darkMode ? <Sun size={16} color="var(--ion-color-warning)" /> : <Moon size={16} />}
              </button>

              {/* View site */}
              <a
                href="https://mintslip.com"
                target="_blank"
                rel="noopener noreferrer"
                className="admin-header-icon-btn"
                style={{ textDecoration: "none", fontSize: "0.75rem", fontWeight: 600, gap: 4, display: "flex", alignItems: "center", padding: "7px 10px" }}
              >
                <ExternalLink size={14} />
                <span style={{ display: window.innerWidth < 576 ? "none" : "inline" }}>View Site</span>
              </a>

              {/* Notifications */}
              <div ref={notifRef} style={{ position: "relative" }}>
                <button
                  className="admin-header-icon-btn"
                  style={{ position: "relative" }}
                  onClick={() => { setNotifOpen(v => !v); if (!notifOpen) handleMarkRead(); }}
                >
                  <Bell size={18} />
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
                          <button className="dropdown-text-btn primary" onClick={handleMarkRead}>Mark all read</button>
                        )}
                        {notifications.length > 0 && (
                          <button className="dropdown-text-btn danger" onClick={handleClearNotifications}>Clear all</button>
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
                  <span className="admin-profile-name" style={{ display: window.innerWidth < 576 ? "none" : undefined }}>
                    {adminProfile?.name || adminProfile?.email || "Admin"}
                  </span>
                  <ChevronDown size={13} color="var(--admin-text-muted)" />
                </button>

                {profileOpen && (
                  <div className="admin-dropdown profile-dropdown">
                    <div className="profile-info">
                      <p className="profile-name">{adminProfile?.name || "Admin"}</p>
                      <p className="profile-email">{adminProfile?.email}</p>
                    </div>
                    <div className="profile-menu">
                      <button className="profile-menu-item" onClick={() => { navigate("/admin/settings"); setProfileOpen(false); }}>
                        <User size={15} color="var(--admin-text-muted)" />Profile & Settings
                      </button>
                      <button className="profile-menu-item" onClick={() => { navigate("/admin/settings?tab=password"); setProfileOpen(false); }}>
                        <Lock size={15} color="var(--admin-text-muted)" />Change Password
                      </button>
                      <div className="profile-menu-divider" />
                      <button className="profile-menu-item danger" onClick={() => { setProfileOpen(false); handleLogout(); }}>
                        <LogOut size={15} />Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Scrollable content */}
          <div className="admin-main-scroll">
            <div className="admin-page-content">
              {children}
            </div>
          </div>

        </div>

      </IonSplitPane>
    </IonApp>
  );
}

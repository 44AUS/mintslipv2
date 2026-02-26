import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import MintSlipLogo from '../assests/mintslip-logo.png';
import {
  LayoutDashboard, ShoppingCart, Users, Tag, FileText, LogOut,
  Shield, Menu, X, FolderArchive, Wrench, UserX, Mail,
  Bell, Settings, Lock, ChevronDown, Receipt, FileSpreadsheet,
  FileBarChart, Building2, Car, Briefcase, User,
} from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";

const DOC_ICONS = {
  "paystub": Receipt,
  "canadian-paystub": Receipt,
  "resume": FileText,
  "w2": FileSpreadsheet,
  "w9": FileSpreadsheet,
  "1099-nec": FileSpreadsheet,
  "1099-misc": FileSpreadsheet,
  "bank-statement": Building2,
  "offer-letter": Briefcase,
  "vehicle-bill-of-sale": Car,
  "schedule-c": FileBarChart,
  "utility-bill": FileText,
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

export default function AdminLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceLoading, setMaintenanceLoading] = useState(false);
  const [authEnabled, setAuthEnabled] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef(null);

  const [adminProfile, setAdminProfile] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    fetchMaintenanceStatus();
    fetchAuthSettings();
    fetchNotifications();
    fetchAdminProfile();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchMaintenanceStatus = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`${BACKEND_URL}/api/admin/maintenance`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) setMaintenanceMode(data.maintenance?.isActive || false);
      }
    } catch (e) {}
  };

  const fetchAuthSettings = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`${BACKEND_URL}/api/admin/auth-settings`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) setAuthEnabled(data.authEnabled !== false);
      }
    } catch (e) {}
  };

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) return;
      const res = await fetch(`${BACKEND_URL}/api/admin/notifications`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setNotifications(data.notifications);
          setUnreadCount(data.unreadCount);
        }
      }
    } catch (e) {}
  };

  const fetchAdminProfile = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) return;
      const res = await fetch(`${BACKEND_URL}/api/admin/profile`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) setAdminProfile(data.profile);
      }
    } catch (e) {
      // fallback to localStorage
      const info = localStorage.getItem("adminInfo");
      if (info) { try { setAdminProfile(JSON.parse(info)); } catch (_) {} }
    }
  };

  const handleMarkRead = async () => {
    if (unreadCount === 0) return;
    const token = localStorage.getItem("adminToken");
    await fetch(`${BACKEND_URL}/api/admin/notifications/mark-read`, {
      method: "PUT",
      headers: { "Authorization": `Bearer ${token}` }
    });
    setUnreadCount(0);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const toggleMaintenanceMode = async () => {
    setMaintenanceLoading(true);
    try {
      const token = localStorage.getItem("adminToken");
      const newStatus = !maintenanceMode;
      const res = await fetch(`${BACKEND_URL}/api/admin/maintenance`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ isActive: newStatus, message: "We're currently performing scheduled maintenance. We'll be back shortly!", estimatedTime: "" })
      });
      if (res.ok) setMaintenanceMode(newStatus);
    } catch (e) {} finally { setMaintenanceLoading(false); }
  };

  const toggleAuthEnabled = async () => {
    setAuthLoading(true);
    try {
      const token = localStorage.getItem("adminToken");
      const newStatus = !authEnabled;
      const res = await fetch(`${BACKEND_URL}/api/admin/auth-settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ isEnabled: newStatus })
      });
      if (res.ok) setAuthEnabled(newStatus);
    } catch (e) {} finally { setAuthLoading(false); }
  };

  const handleLogout = async () => {
    const token = localStorage.getItem("adminToken");
    try {
      await fetch(`${BACKEND_URL}/api/admin/logout`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
    } catch (e) {}
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminInfo");
    navigate("/admin/login");
  };

  const getActiveTab = () => {
    const path = location.pathname;
    if (path.includes("/admin/users")) return "users";
    if (path.includes("/admin/purchases")) return "purchases";
    if (path.includes("/admin/saved-docs")) return "saved-docs";
    if (path.includes("/admin/discounts")) return "discounts";
    if (path.includes("/admin/banned-ips")) return "banned-ips";
    if (path.includes("/admin/email-templates")) return "email-templates";
    if (path.includes("/admin/blog")) return "blog";
    if (path.includes("/admin/settings")) return "settings";
    return "overview";
  };

  const activeTab = getActiveTab();

  const tabs = [
    { id: "overview", label: "Overview", icon: LayoutDashboard, path: "/admin/overview" },
    { id: "purchases", label: "Purchases", icon: ShoppingCart, path: "/admin/purchases" },
    { id: "users", label: "Users", icon: Users, path: "/admin/users" },
    { id: "saved-docs", label: "Saved Docs", icon: FolderArchive, path: "/admin/saved-docs" },
    { id: "discounts", label: "Discounts", icon: Tag, path: "/admin/discounts" },
    { id: "banned-ips", label: "Banned IPs", icon: Shield, path: "/admin/banned-ips" },
    { id: "blog", label: "Blog", icon: FileText, path: "/admin/blog" },
    { id: "email-templates", label: "Email Templates", icon: Mail, path: "/admin/email-templates" },
  ];

  const handleNavigation = (path) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  const adminInitials = adminProfile?.name
    ? adminProfile.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)
    : adminProfile?.email
      ? adminProfile.email[0].toUpperCase()
      : "A";

  const Toggle = ({ on, onClick, disabled, onColor = "bg-green-500", offColor = "bg-slate-300" }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none ${on ? onColor : offColor} ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${on ? "translate-x-5" : "translate-x-0"}`} />
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="px-4 py-3 flex items-center justify-between">

          {/* Left: Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5 text-slate-700" /> : <Menu className="w-5 h-5 text-slate-700" />}
          </button>

          {/* Mobile logo */}
          <button onClick={() => navigate("/admin/overview")} className="md:hidden hover:opacity-80 transition-opacity">
            <img src={MintSlipLogo} alt="MintSlip" style={{ height: "30px", width: "auto" }} />
          </button>

          {/* Right: controls */}
          <div className="flex items-center gap-2 ml-auto">

            {/* Desktop toggles */}
            <div className="hidden md:flex items-center gap-3 mr-2">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-200">
                <Wrench className={`w-3.5 h-3.5 ${maintenanceMode ? "text-orange-500" : "text-slate-400"}`} />
                <span className="text-xs font-medium text-slate-600 hidden lg:inline">Maintenance</span>
                <Toggle on={maintenanceMode} onClick={toggleMaintenanceMode} disabled={maintenanceLoading} onColor="bg-orange-500" offColor="bg-slate-300" />
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-200">
                <UserX className={`w-3.5 h-3.5 ${!authEnabled ? "text-red-500" : "text-slate-400"}`} />
                <span className="text-xs font-medium text-slate-600 hidden lg:inline">User Auth</span>
                <Toggle on={authEnabled} onClick={toggleAuthEnabled} disabled={authLoading} onColor="bg-green-500" offColor="bg-red-400" />
              </div>
            </div>

            {/* Notifications */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => { setNotifOpen(v => !v); if (!notifOpen) handleMarkRead(); }}
                className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <Bell className="w-5 h-5 text-slate-600" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-lg border border-slate-200 z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-800">Notifications</p>
                    {unreadCount > 0 && (
                      <button onClick={handleMarkRead} className="text-xs text-green-600 hover:text-green-700 font-medium">
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center">
                        <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-sm text-slate-400">No notifications yet</p>
                      </div>
                    ) : notifications.map(n => {
                      const Icon = DOC_ICONS[n.docType] || FileText;
                      return (
                        <div key={n.id} className={`px-4 py-3 flex gap-3 items-start ${n.read ? "" : "bg-green-50"}`}>
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${n.read ? "bg-slate-100" : "bg-green-100"}`}>
                            <Icon className={`w-4 h-4 ${n.read ? "text-slate-500" : "text-green-600"}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-800">{n.docDisplayName} created</p>
                            <p className="text-xs text-slate-500 truncate">{n.customerEmail || "Guest"} · ${n.amount?.toFixed(2)}</p>
                            <p className="text-xs text-slate-400 mt-0.5">{timeAgo(n.createdAt)}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Admin profile dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileOpen(v => !v)}
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                {adminProfile?.photo ? (
                  <img src={adminProfile.photo} alt="avatar" className="w-7 h-7 rounded-full object-cover" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-green-600 flex items-center justify-center text-white text-xs font-bold">
                    {adminInitials}
                  </div>
                )}
                <span className="hidden sm:block text-sm font-medium text-slate-700 max-w-[120px] truncate">
                  {adminProfile?.name || adminProfile?.email || "Admin"}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-lg border border-slate-200 z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-100">
                    <p className="text-sm font-semibold text-slate-800 truncate">{adminProfile?.name || "Admin"}</p>
                    <p className="text-xs text-slate-400 truncate">{adminProfile?.email}</p>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={() => { navigate("/admin/settings"); setProfileOpen(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <User className="w-4 h-4 text-slate-400" />
                      Profile & Settings
                    </button>
                    <button
                      onClick={() => { navigate("/admin/settings?tab=password"); setProfileOpen(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <Lock className="w-4 h-4 text-slate-400" />
                      Change Password
                    </button>
                    <div className="my-1 border-t border-slate-100" />
                    <button
                      onClick={() => { setProfileOpen(false); handleLogout(); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white">
            <div className="px-4 py-3 space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleNavigation(tab.path)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === tab.id ? "bg-green-600 text-white" : "text-slate-700 hover:bg-slate-100"}`}
                >
                  <tab.icon className="w-5 h-5" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              ))}
              <div className="border-t border-slate-200 my-2" />
              <div className="flex items-center justify-between px-4 py-3 rounded-lg bg-slate-50">
                <div className="flex items-center gap-3">
                  <Wrench className={`w-5 h-5 ${maintenanceMode ? "text-orange-500" : "text-slate-400"}`} />
                  <span className="font-medium text-slate-700">Maintenance</span>
                </div>
                <Toggle on={maintenanceMode} onClick={toggleMaintenanceMode} disabled={maintenanceLoading} onColor="bg-orange-500" offColor="bg-slate-300" />
              </div>
              <div className="flex items-center justify-between px-4 py-3 rounded-lg bg-slate-50">
                <div className="flex items-center gap-3">
                  <UserX className={`w-5 h-5 ${!authEnabled ? "text-red-500" : "text-slate-400"}`} />
                  <span className="font-medium text-slate-700">User Auth</span>
                </div>
                <Toggle on={authEnabled} onClick={toggleAuthEnabled} disabled={authLoading} />
              </div>
              <button
                onClick={() => { navigate("/admin/settings"); setMobileMenuOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <Settings className="w-5 h-5" />
                <span className="font-medium">Settings</span>
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium">Logout</span>
              </button>
            </div>
          </div>
        )}
      </header>

      <div className="flex flex-1">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex flex-col w-56 bg-white border-r border-slate-200 flex-shrink-0">
          {/* Sidebar logo */}
          <div className="px-4 py-5 border-b border-slate-100">
            <button onClick={() => navigate("/admin/overview")} className="hover:opacity-80 transition-opacity">
              <img src={MintSlipLogo} alt="MintSlip" style={{ height: "32px", width: "auto" }} />
            </button>
          </div>

          {/* Nav links */}
          <nav className="p-3 space-y-0.5 flex-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => navigate(tab.path)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  activeTab === tab.id
                    ? "bg-green-600 text-white font-medium"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-800"
                }`}
              >
                <tab.icon className="w-4 h-4 flex-shrink-0" />
                {tab.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

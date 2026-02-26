import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  Tag,
  FileText,
  LogOut,
  RefreshCw,
  Lock,
  Shield,
  Menu,
  X,
  FolderArchive,
  Wrench,
  UserX,
  Mail,
} from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";

export default function AdminLayout({ children, onRefresh, adminInfo, showPasswordModal }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceLoading, setMaintenanceLoading] = useState(false);
  const [authEnabled, setAuthEnabled] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);

  // Fetch maintenance status on mount
  useEffect(() => {
    const fetchMaintenanceStatus = async () => {
      try {
        const token = localStorage.getItem("adminToken");
        const response = await fetch(`${BACKEND_URL}/api/admin/maintenance`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setMaintenanceMode(data.maintenance?.isActive || false);
          }
        }
      } catch (error) {
        console.error("Error fetching maintenance status:", error);
      }
    };

    const fetchAuthSettings = async () => {
      try {
        const token = localStorage.getItem("adminToken");
        const response = await fetch(`${BACKEND_URL}/api/admin/auth-settings`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setAuthEnabled(data.authEnabled !== false);
          }
        }
      } catch (error) {
        console.error("Error fetching auth settings:", error);
      }
    };

    fetchMaintenanceStatus();
    fetchAuthSettings();
  }, []);

  const toggleMaintenanceMode = async () => {
    setMaintenanceLoading(true);
    try {
      const token = localStorage.getItem("adminToken");
      const newStatus = !maintenanceMode;
      
      const response = await fetch(`${BACKEND_URL}/api/admin/maintenance`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          isActive: newStatus,
          message: "We're currently performing scheduled maintenance. We'll be back shortly!",
          estimatedTime: ""
        })
      });

      if (response.ok) {
        setMaintenanceMode(newStatus);
      }
    } catch (error) {
      console.error("Error toggling maintenance mode:", error);
    } finally {
      setMaintenanceLoading(false);
    }
  };
  
  const toggleAuthEnabled = async () => {
    setAuthLoading(true);
    try {
      const token = localStorage.getItem("adminToken");
      const newStatus = !authEnabled;

      const response = await fetch(`${BACKEND_URL}/api/admin/auth-settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ isEnabled: newStatus })
      });

      if (response.ok) {
        setAuthEnabled(newStatus);
      }
    } catch (error) {
      console.error("Error toggling auth settings:", error);
    } finally {
      setAuthLoading(false);
    }
  };

  // Determine active tab from URL path
  const getActiveTab = () => {
    const path = location.pathname;
    if (path.includes("/admin/users")) return "users";
    if (path.includes("/admin/purchases")) return "purchases";
    if (path.includes("/admin/saved-docs")) return "saved-docs";
    if (path.includes("/admin/discounts")) return "discounts";
    if (path.includes("/admin/banned-ips")) return "banned-ips";
    if (path.includes("/admin/email-templates")) return "email-templates";
    if (path.includes("/admin/blog")) return "blog";
    return "overview";
  };
  
  const activeTab = getActiveTab();

  const handleLogout = async () => {
    const token = localStorage.getItem("adminToken");
    
    try {
      await fetch(`${BACKEND_URL}/api/admin/logout`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
    } catch (error) {
      console.error("Logout error:", error);
    }
    
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminInfo");
    navigate("/admin/login");
  };

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

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Favicon Logo */}
            <img 
              src="/favicon.ico" 
              alt="MintSlip" 
              className="w-10 h-10 rounded-xl"
            />
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold text-slate-800">MintSlip Admin</h1>
              <p className="text-sm text-slate-500">{adminInfo?.email}</p>
            </div>
            <div className="sm:hidden">
              <h1 className="text-lg font-bold text-slate-800">Admin</h1>
            </div>
          </div>
          
          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            {/* Maintenance Mode Toggle */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-200">
              <Wrench className={`w-4 h-4 ${maintenanceMode ? 'text-orange-500' : 'text-slate-400'}`} />
              <span className="text-sm font-medium text-slate-600 hidden lg:inline">Maintenance</span>
              <button
                onClick={toggleMaintenanceMode}
                disabled={maintenanceLoading}
                className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${
                  maintenanceMode ? 'bg-orange-500' : 'bg-slate-300'
                } ${maintenanceLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                title={maintenanceMode ? 'Disable maintenance mode' : 'Enable maintenance mode'}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
                    maintenanceMode ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Auth Enabled Toggle */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-200">
              <UserX className={`w-4 h-4 ${!authEnabled ? 'text-red-500' : 'text-slate-400'}`} />
              <span className="text-sm font-medium text-slate-600 hidden lg:inline">User Auth</span>
              <button
                onClick={toggleAuthEnabled}
                disabled={authLoading}
                className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${
                  authEnabled ? 'bg-green-500' : 'bg-red-400'
                } ${authLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                title={authEnabled ? 'Disable user signup/login' : 'Enable user signup/login'}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
                    authEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {onRefresh && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                className="gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </Button>
            )}
            {showPasswordModal && (
              <Button
                variant="outline"
                size="sm"
                onClick={showPasswordModal}
                className="gap-2"
              >
                <Lock className="w-4 h-4" />
                <span className="hidden lg:inline">Change Password</span>
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>

          {/* Mobile Hamburger Button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6 text-slate-700" />
            ) : (
              <Menu className="w-6 h-6 text-slate-700" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white">
            <div className="px-4 py-3 space-y-2">
              {/* Mobile Navigation Tabs */}
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleNavigation(tab.path)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    activeTab === tab.id 
                      ? "bg-green-600 text-white" 
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              ))}
              
              {/* Mobile Actions Divider */}
              <div className="border-t border-slate-200 my-3"></div>
              
              {/* Mobile Maintenance Toggle */}
              <div className="flex items-center justify-between px-4 py-3 rounded-lg bg-slate-50">
                <div className="flex items-center gap-3">
                  <Wrench className={`w-5 h-5 ${maintenanceMode ? 'text-orange-500' : 'text-slate-400'}`} />
                  <span className="font-medium text-slate-700">Maintenance Mode</span>
                </div>
                <button
                  onClick={toggleMaintenanceMode}
                  disabled={maintenanceLoading}
                  className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
                    maintenanceMode ? 'bg-orange-500' : 'bg-slate-300'
                  } ${maintenanceLoading ? 'opacity-50' : ''}`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
                      maintenanceMode ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Mobile Auth Toggle */}
              <div className="flex items-center justify-between px-4 py-3 rounded-lg bg-slate-50">
                <div className="flex items-center gap-3">
                  <UserX className={`w-5 h-5 ${!authEnabled ? 'text-red-500' : 'text-slate-400'}`} />
                  <span className="font-medium text-slate-700">User Signup/Login</span>
                </div>
                <button
                  onClick={toggleAuthEnabled}
                  disabled={authLoading}
                  className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
                    authEnabled ? 'bg-green-500' : 'bg-red-400'
                  } ${authLoading ? 'opacity-50' : ''}`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
                      authEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Mobile Actions */}
              {onRefresh && (
                <button
                  onClick={() => {
                    onRefresh();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <RefreshCw className="w-5 h-5" />
                  <span className="font-medium">Refresh</span>
                </button>
              )}
              {showPasswordModal && (
                <button
                  onClick={() => {
                    showPasswordModal();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <Lock className="w-5 h-5" />
                  <span className="font-medium">Change Password</span>
                </button>
              )}
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

import { useState } from "react";
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
} from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";

export default function AdminLayout({ children, onRefresh, adminInfo, showPasswordModal }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Determine active tab from URL path
  const getActiveTab = () => {
    const path = location.pathname;
    if (path.includes("/admin/users")) return "users";
    if (path.includes("/admin/purchases")) return "purchases";
    if (path.includes("/admin/saved-docs")) return "saved-docs";
    if (path.includes("/admin/discounts")) return "discounts";
    if (path.includes("/admin/banned-ips")) return "banned-ips";
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
    { id: "blog", label: "Blog", icon: FileText, path: "/admin/blog" }
  ];

  const handleNavigation = (path) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-100">
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

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Desktop Navigation Tabs */}
        <div className="hidden md:flex gap-2 mb-6 bg-white rounded-xl p-2 shadow-sm flex-wrap">
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? "default" : "ghost"}
              onClick={() => navigate(tab.path)}
              className={`gap-2 ${activeTab === tab.id ? "bg-green-600 hover:bg-green-700" : ""}`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </Button>
          ))}
        </div>

        {/* Page Content */}
        {children}
      </div>
    </div>
  );
}

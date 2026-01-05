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
} from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";

export default function AdminLayout({ children, onRefresh, adminInfo, showPasswordModal }) {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Determine active tab from URL path
  const getActiveTab = () => {
    const path = location.pathname;
    if (path.includes("/admin/users")) return "users";
    if (path.includes("/admin/purchases")) return "purchases";
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
    { id: "discounts", label: "Discounts", icon: Tag, path: "/admin/discounts" },
    { id: "banned-ips", label: "Banned IPs", icon: Shield, path: "/admin/banned-ips" },
    { id: "blog", label: "Blog", icon: FileText, path: "/admin/blog" }
  ];

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
              <LayoutDashboard className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">MintSlip Admin</h1>
              <p className="text-sm text-slate-500">{adminInfo?.email}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
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
                <span className="hidden sm:inline">Change Password</span>
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
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Navigation Tabs */}
        <div className="flex gap-2 mb-6 bg-white rounded-xl p-2 shadow-sm flex-wrap">
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

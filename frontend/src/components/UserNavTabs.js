import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Download, Settings, FileSearch, Crown } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";

const USER_TABS = [
  { id: "dashboard", label: "Dashboard", path: "/user/dashboard", icon: LayoutDashboard },
  { id: "downloads", label: "Downloads", path: "/user/downloads", icon: Download },
  { id: "pdf-engine", label: "PDF Engine", path: "/user/pdf-engine", icon: FileSearch, businessOnly: true },
  { id: "settings", label: "Settings", path: "/user/settings", icon: Settings },
];

export default function UserNavTabs() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isBusinessUser, setIsBusinessUser] = useState(false);
  
  const currentPath = location.pathname;
  
  // Check if user has Business subscription
  useEffect(() => {
    const checkSubscription = async () => {
      const token = localStorage.getItem("userToken");
      const userInfo = localStorage.getItem("userInfo");
      
      if (userInfo) {
        try {
          const user = JSON.parse(userInfo);
          if (user?.subscription?.tier === "business" && user?.subscription?.status === "active") {
            setIsBusinessUser(true);
            return;
          }
        } catch (e) {}
      }
      
      // Fallback: check with API
      if (token) {
        try {
          const response = await fetch(`${BACKEND_URL}/api/pdf-engine/check-access`, {
            headers: { "Authorization": `Bearer ${token}` }
          });
          if (response.ok) {
            const data = await response.json();
            setIsBusinessUser(data.hasAccess);
          }
        } catch (e) {}
      }
    };
    
    checkSubscription();
  }, []);

  // Filter tabs based on subscription
  const visibleTabs = USER_TABS.filter(tab => !tab.businessOnly || isBusinessUser);

  return (
    <div className="flex flex-wrap gap-2 mb-8">
      {visibleTabs.map((tab) => {
        const isActive = currentPath === tab.path;
        const Icon = tab.icon;
        
        return (
          <button
            key={tab.id}
            onClick={() => navigate(tab.path)}
            className={`
              flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all
              ${isActive 
                ? tab.businessOnly 
                  ? "bg-purple-600 text-white shadow-md"
                  : "bg-green-600 text-white shadow-md" 
                : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200 hover:border-slate-300"
              }
            `}
          >
            <Icon className="w-4 h-4" />
            {tab.label}
            {tab.businessOnly && !isActive && (
              <Crown className="w-3 h-3 text-purple-500" />
            )}
          </button>
        );
      })}
    </div>
  );
}

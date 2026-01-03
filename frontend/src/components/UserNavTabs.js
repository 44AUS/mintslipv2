import { useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Download, Settings } from "lucide-react";

const USER_TABS = [
  { id: "dashboard", label: "Dashboard", path: "/user/dashboard", icon: LayoutDashboard },
  { id: "downloads", label: "Downloads", path: "/user/downloads", icon: Download },
  { id: "settings", label: "Settings", path: "/user/settings", icon: Settings },
];

export default function UserNavTabs() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const currentPath = location.pathname;

  return (
    <div className="flex flex-wrap gap-2 mb-8">
      {USER_TABS.map((tab) => {
        const isActive = currentPath === tab.path;
        const Icon = tab.icon;
        
        return (
          <button
            key={tab.id}
            onClick={() => navigate(tab.path)}
            className={`
              flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all
              ${isActive 
                ? "bg-green-600 text-white shadow-md" 
                : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200 hover:border-slate-300"
              }
            `}
          >
            <Icon className="w-4 h-4" />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FileText, ChevronDown, LogOut, Settings, Download, LayoutDashboard, ShieldCheck } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import MintSlip from '../assests/mintslip-logo.png';
import '../marketing-nav.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";

// User account dropdown (logged-in avatar) — shown in the pill's actions
function UserAccountDropdown({ user, onNavigate, onLogout }) {
  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center gap-2 px-3 py-2 rounded-full bg-emerald-100 hover:bg-emerald-200 transition-all"
          data-testid="nav-user-dropdown"
        >
          <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center">
            <span className="text-sm font-bold text-white">
              {user.name?.charAt(0)?.toUpperCase() || "U"}
            </span>
          </div>
          <ChevronDown className="w-3 h-3 text-emerald-700" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-3 py-2 border-b border-slate-100">
          <p className="font-medium text-slate-800">{user.name}</p>
          <p className="text-xs text-slate-500">{user.email}</p>
        </div>
        <DropdownMenuItem
          onClick={() => onNavigate("/user/dashboard")}
          className="flex items-center gap-2 cursor-pointer"
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Dashboard</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onNavigate("/user/downloads")}
          className="flex items-center gap-2 cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>My Downloads</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onNavigate("/user/settings")}
          className="flex items-center gap-2 cursor-pointer"
        >
          <Settings className="w-4 h-4" />
          <span>Settings</span>
        </DropdownMenuItem>
        {(user.subscription?.tier === 'business' && ['active', 'cancelling'].includes(user.subscription?.status)) && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onNavigate("/user/pdf-engine")}
              className="flex items-center gap-2 cursor-pointer text-purple-600 hover:text-purple-700"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>PDF Engine</span>
              <span className="ml-auto text-[10px] px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded-full font-medium">Business</span>
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={onLogout}
          className="flex items-center gap-2 cursor-pointer text-red-600 hover:text-red-700"
        >
          <LogOut className="w-4 h-4" />
          <span>Log Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function Header({ title }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [authEnabled, setAuthEnabled] = useState(true);

  // Check for logged in user
  useEffect(() => {
    const userInfo = localStorage.getItem("userInfo");
    if (userInfo) {
      try {
        setUser(JSON.parse(userInfo));
      } catch (e) {
        setUser(null);
      }
    }
  }, []);

  // Fetch auth status
  useEffect(() => {
    fetch(`${BACKEND_URL}/api/auth-status`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setAuthEnabled(data.authEnabled !== false);
      })
      .catch(() => {});
  }, []);

  const handleNavigation = (path) => {
    navigate(path);
  };

  // Scroll to a home page section; from other pages, go home first (Home
  // reads the hash on load and scrolls there).
  const goToSection = (id) => {
    if (location.pathname === "/") {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    } else {
      navigate(`/#${id}`);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("userToken");
    localStorage.removeItem("userInfo");
    setUser(null);
    navigate("/");
  };

  return (
    <>
      {/* Green wash behind the navbar — whodat's purple top wash, in green.
          Anchored to the page top so it scrolls away while the pill sticks. */}
      <div aria-hidden="true" className="nav-wash" />

      {/* Floating glass pill header (whodat marketing nav) */}
      <div className="navbar">
        <nav className="navbar-pill">
          <button className="navbar-brand" onClick={() => navigate("/")} aria-label="MintSlip home">
            <img src={MintSlip} alt="MintSlip" />
          </button>

          <div className="navbar-links">
            <a onClick={() => goToSection("how-it-works")}>How it works</a>
            <a href="/#">Reviews</a>
            <a href="/#">Compare</a>
            <a onClick={() => goToSection("faq")}>FAQ</a>
          </div>

          <div className="navbar-actions">
            {user ? (
              <UserAccountDropdown user={user} onNavigate={handleNavigation} onLogout={handleLogout} />
            ) : authEnabled ? (
              <button className="navbar-secondary" onClick={() => handleNavigation("/login")}>Log in</button>
            ) : null}
            <button className="navbar-cta" onClick={() => handleNavigation("/app")}>
              <FileText size={18} />
              <span>Create a paystub</span>
            </button>


          </div>
        </nav>
      </div>
    </>
  );
}




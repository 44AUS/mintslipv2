import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, FileText, FileBarChart, Menu, Mail, HelpCircle, Info, ChevronDown, Receipt, FileSpreadsheet, Sparkles, User, LogOut, Settings, Download, LayoutDashboard, Phone, ShieldCheck, Search } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import MintSlip from '../assests/mintslip-logo.png';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";

// Tax Forms dropdown items
const TAX_FORMS = [
  { name: "W-2 Generator", path: "/w2-generator", icon: FileSpreadsheet },
  { name: "W-9 Generator", path: "/w9-generator", icon: FileSpreadsheet },
  { name: "1099 NEC Generator", path: "/1099-nec-generator", icon: FileSpreadsheet },
  { name: "1099 Misc Generator", path: "/1099-misc-generator", icon: FileSpreadsheet },
  { name: "Schedule C Generator", path: "/schedule-c-generator", icon: FileSpreadsheet },
  // Add more tax forms here as needed
];

// Other Forms dropdown items
const OTHER_FORMS = [
  { name: "Service Expense Generator", path: "/service-expense-generator", icon: FileSpreadsheet },
  { name: "Voided Check", path: "/voided-check-generator", icon: FileSpreadsheet },
  { name: "Offer Letter Generator", path: "/offer-letter-generator", icon: FileSpreadsheet },
  { name: "Invoice Generator", path: "/invoice-generator-generator", icon: FileSpreadsheet },
  { name: "Vehicle Bill of Sale", path: "/vehicle-bill-of-sale-generator", icon: FileSpreadsheet },
  // Add more forms here as needed
];

// Default desktop nav items (order is user-configurable)
const DEFAULT_NAV_ITEMS = [
  { id: "paystubs",       type: "dropdown" },
  { id: "resume",         type: "link", path: "/ai-resume-builder",  label: "AI Resume Builder", icon: Sparkles },
  { id: "generators",     type: "link", path: "/generators",         label: "All Generators",    icon: FileText },
  { id: "people-search",  type: "link", path: "/people-search",      label: "People Search",     icon: Search, badge: "NEW" },
  { id: "contact",        type: "link", path: "/contact",            label: "Contact",            icon: Mail },
];

function DesktopNavItem({ item, location, onNavigate }) {
  const isActive = (path) => location.pathname === path;
  const isPaystubActive = location.pathname === "/paystub-generator" || location.pathname === "/paystub-samples" || location.pathname === "/canadian-paystub-generator";

  const btnBase = "flex items-center gap-2 px-4 py-2 rounded-md transition-all text-sm";
  const activeClasses = `${btnBase} bg-green-100 text-green-800 font-semibold`;
  const idleClasses   = `${btnBase} hover:bg-green-50 text-slate-500 hover:text-green-700`;

  if (item.type === "dropdown") {
    return (
      <div className="flex items-center">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className={isPaystubActive ? activeClasses : idleClasses} data-testid="nav-paystub-dropdown">
              <FileText className="w-4 h-4" />
              <span>Pay Stubs</span>
              <ChevronDown className="w-3 h-3 ml-1" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            {[
              { path: "/paystub-generator",          label: "Create Paystub" },
              { path: "/canadian-paystub-generator", label: "Canada Pay Stubs" },
              { path: "/paystub-samples",             label: "Sample Templates" },
            ].map(({ path, label }) => (
              <DropdownMenuItem key={path} onClick={() => onNavigate(path)}
                className={`flex items-center gap-2 cursor-pointer ${isActive(path) ? "bg-green-50 text-green-800 font-semibold" : ""}`}>
                <FileText className="w-4 h-4" /><span>{label}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  const Icon = item.icon;
  return (
    <div className="flex items-center">
      <button onClick={() => onNavigate(item.path)}
        className={`${isActive(item.path) ? activeClasses : idleClasses} relative`}>
        <Icon className="w-4 h-4" />
        <span>{item.label}</span>
        {item.badge && (
          <span className="ml-1 text-[10px] font-semibold bg-green-600 text-white px-1.5 py-0.5 rounded-full">{item.badge}</span>
        )}
      </button>
    </div>
  );
}

function DesktopNavLinks({ location, onNavigate }) {
  const [orderedItems, setOrderedItems] = useState(DEFAULT_NAV_ITEMS);

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/nav-order`)
      .then(r => r.json())
      .then(data => {
        if (data.success && Array.isArray(data.order)) {
          const map = Object.fromEntries(DEFAULT_NAV_ITEMS.map(i => [i.id, i]));
          const ordered = data.order.filter(id => map[id]).map(id => map[id]);
          const unseen  = DEFAULT_NAV_ITEMS.filter(i => !data.order.includes(i.id));
          setOrderedItems([...ordered, ...unseen]);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <>
      {orderedItems.map(item => (
        <DesktopNavItem key={item.id} item={item} location={location} onNavigate={onNavigate} />
      ))}
    </>
  );
}

// User account dropdown component for desktop
function UserAccountDropdown({ user, onNavigate, onLogout, authEnabled }) {
  if (!user) {
    if (!authEnabled) return null;
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={() => onNavigate("/login")}
          className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-green-700 hover:bg-green-50 rounded-md transition-colors"
        >
          Log In
        </button>
        <button
          onClick={() => onNavigate("/signup")}
          className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors"
        >
          Sign Up
        </button>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center gap-2 px-3 py-2 rounded-full bg-green-100 hover:bg-green-200 transition-all"
          data-testid="nav-user-dropdown"
        >
          <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
            <span className="text-sm font-bold text-white">
              {user.name?.charAt(0)?.toUpperCase() || "U"}
            </span>
          </div>
          <ChevronDown className="w-3 h-3 text-green-700" />
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

// Navigation links component for mobile
function MobileNavLinks({ location, onNavigate }) {
  const [taxFormsOpen, setTaxFormsOpen] = useState(false);
  const [otherFormsOpen, setOtherFormsOpen] = useState(false);
  const [paystubsOpen, setPaystubsOpen] = useState(false);
  const isActive = (path) => location.pathname === path;
  const isTaxFormActive = TAX_FORMS.some(form => location.pathname === form.path);
  const isOtherFormActive = OTHER_FORMS.some(form => location.pathname === form.path);
  const isPaystubActive = location.pathname === '/paystub-generator' || location.pathname === '/paystub-samples';
  
  const getButtonClasses = (path) => {
    const base = "flex items-center gap-2 px-4 py-3 w-full justify-start rounded-md transition-all";
    if (isActive(path)) {
      return `${base} bg-green-100 text-green-800 font-semibold`;
    }
    return `${base} hover:bg-green-50 text-slate-500 hover:text-green-700`;
  };

  return (
    <>
      {/* Pay Stubs Collapsible for Mobile */}
      <Collapsible open={paystubsOpen} onOpenChange={setPaystubsOpen}>
        <CollapsibleTrigger asChild>
          <button
            className={`flex items-center justify-between gap-2 px-4 py-3 w-full rounded-md transition-all ${
              isPaystubActive 
                ? 'bg-green-100 text-green-800 font-semibold' 
                : 'hover:bg-green-50 text-slate-500 hover:text-green-700'
            }`}
            data-testid="nav-paystub-mobile"
          >
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              <span className="text-base">Pay Stubs</span>
            </div>
            <ChevronDown className={`w-4 h-4 transition-transform ${paystubsOpen ? 'rotate-180' : ''}`} />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="pl-6 space-y-1 mt-1">
          <button
            onClick={() => onNavigate("/paystub-generator")}
            className={`flex items-center gap-2 px-4 py-2 w-full justify-start rounded-md transition-all ${
              isActive("/paystub-generator") 
                ? 'bg-green-100 text-green-800 font-semibold' 
                : 'hover:bg-green-50 text-slate-500 hover:text-green-700'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Create Paystub</span>
          </button>
          <button
            onClick={() => onNavigate("/canadian-paystub-generator")}
            className={`flex items-center gap-2 px-4 py-2 w-full justify-start rounded-md transition-all ${
              isActive("/canadian-paystub-generator") 
                ? 'bg-green-100 text-green-800 font-semibold' 
                : 'hover:bg-green-50 text-slate-500 hover:text-green-700'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Canada Pay Stubs</span>
          </button>
          <button
            onClick={() => onNavigate("/paystub-samples")}
            className={`flex items-center gap-2 px-4 py-2 w-full justify-start rounded-md transition-all ${
              isActive("/paystub-samples") 
                ? 'bg-green-100 text-green-800 font-semibold' 
                : 'hover:bg-green-50 text-slate-500 hover:text-green-700'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Sample Templates</span>
          </button>
        </CollapsibleContent>
      </Collapsible>
      
      <button
        onClick={() => onNavigate("/ai-resume-builder")}
        className={getButtonClasses("/ai-resume-builder")}
        data-testid="nav-bankstatement-link-mobile"
      >
        <Sparkles className="w-5 h-5" />
        <span className="text-base">AI Resume Builder</span>
      </button>

      {/* Tax Forms Collapsible for Mobile */}
      <Collapsible open={taxFormsOpen} onOpenChange={setTaxFormsOpen}>
        <CollapsibleTrigger asChild>
          <button
            className={`flex items-center justify-between gap-2 px-4 py-3 w-full rounded-md transition-all ${
              isTaxFormActive 
                ? 'bg-green-100 text-green-800 font-semibold' 
                : 'hover:bg-green-50 text-slate-500 hover:text-green-700'
            }`}
            data-testid="nav-taxforms-mobile"
          >
            <div className="flex items-center gap-2">
              <Receipt className="w-5 h-5" />
              <span className="text-base">Tax Forms</span>
            </div>
            <ChevronDown className={`w-4 h-4 transition-transform ${taxFormsOpen ? 'rotate-180' : ''}`} />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="pl-6 space-y-1 mt-1">
          {TAX_FORMS.map((form) => {
            const IconComponent = form.icon;
            return (
              <button
                key={form.path}
                onClick={() => onNavigate(form.path)}
                className={`flex items-center gap-2 px-4 py-2 w-full justify-start rounded-md transition-all ${
                  isActive(form.path) 
                    ? 'bg-green-100 text-green-800 font-semibold' 
                    : 'hover:bg-green-50 text-slate-500 hover:text-green-700'
                }`}
              >
                <IconComponent className="w-4 h-4" />
                <span className="text-sm">{form.name}</span>
              </button>
            );
          })}
        </CollapsibleContent>
      </Collapsible>

      {/* Other Forms Collapsible for Mobile
      <Collapsible open={otherFormsOpen} onOpenChange={setOtherFormsOpen}>
        <CollapsibleTrigger asChild>
          <button
            className={`flex items-center justify-between gap-2 px-4 py-3 w-full rounded-md transition-all ${
              isOtherFormActive 
                ? 'bg-green-100 text-green-800 font-semibold' 
                : 'hover:bg-green-50 text-slate-500 hover:text-green-700'
            }`}
            data-testid="nav-otherforms-mobile"
          >
            <div className="flex items-center gap-2">
              <Receipt className="w-5 h-5" />
              <span className="text-base">Other Forms</span>
            </div>
            <ChevronDown className={`w-4 h-4 transition-transform ${otherFormsOpen ? 'rotate-180' : ''}`} />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="pl-6 space-y-1 mt-1">
          {OTHER_FORMS.map((form) => {
            const IconComponent = form.icon;
            return (
              <button
                key={form.path}
                onClick={() => onNavigate(form.path)}
                className={`flex items-center gap-2 px-4 py-2 w-full justify-start rounded-md transition-all ${
                  isActive(form.path) 
                    ? 'bg-green-100 text-green-800 font-semibold' 
                    : 'hover:bg-green-50 text-slate-500 hover:text-green-700'
                }`}
              >
                <IconComponent className="w-4 h-4" />
                <span className="text-sm">{form.name}</span>
              </button>
            );
          })}
        </CollapsibleContent>
      </Collapsible> */}

      <button
        onClick={() => onNavigate("/generators")}
        className={getButtonClasses("/generators")}
        data-testid="nav-generators-link-mobile"
      >
        <FileSpreadsheet className="w-5 h-5" />
        <span className="text-base">All Generators</span>
      </button>

      <button
        onClick={() => onNavigate("/people-search")}
        className={getButtonClasses("/people-search")}
        data-testid="nav-people-search-mobile"
      >
        <Search className="w-5 h-5" />
        <span className="text-base">People Search</span>
        <span className="ml-auto text-[10px] font-semibold bg-green-600 text-white px-1.5 py-0.5 rounded-full">NEW</span>
      </button>

      <button
        onClick={() => onNavigate("/about")}
        className={getButtonClasses("/about")}
        data-testid="nav-about-link-mobile"
      >
        <Info className="w-5 h-5" />
        <span className="text-base">About</span>
      </button>
      
      <button
        onClick={() => onNavigate("/faq")}
        className={getButtonClasses("/faq")}
        data-testid="nav-faq-link-mobile"
      >
        <HelpCircle className="w-5 h-5" />
        <span className="text-base">FAQ</span>
      </button>
      
      <button
        onClick={() => onNavigate("/contact")}
        className={getButtonClasses("/contact")}
        data-testid="nav-contact-link-mobile"
      >
        <Mail className="w-5 h-5" />
        <span className="text-base">Contact</span>
      </button>
    </>
  );
}

export default function Header({ title }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === "/";
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
    setMobileMenuOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("userToken");
    localStorage.removeItem("userInfo");
    setUser(null);
    navigate("/");
  };

  return (
    <>
      {/* Support Bar */}
      <div className="bg-slate-800 text-white py-1.5 px-4 text-center text-sm hidden sm:block">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-6">
          <a 
            href="tel:+18556236746" 
            className="flex items-center gap-1.5 hover:text-green-400 transition-colors"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Support: (855) 623-6746</span>
          </a>
          <span className="text-slate-500">|</span>
          <a 
            href="mailto:support@mintslip.com" 
            className="flex items-center gap-1.5 hover:text-green-400 transition-colors"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>support@mintslip.com</span>
          </a>
        </div>
      </div>
      
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-black/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left: Logo */}
            <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
              <img 
                src={MintSlip}
                className="text-xl sm:text-2xl font-black tracking-tight cursor-pointer" 
                style={{ fontFamily: 'Outfit, sans-serif', height: '40px', width: 'auto' }}
                onClick={() => navigate("/")}
              />
            </div>
            
            {/* Center: Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-2 absolute left-1/2 transform -translate-x-1/2">
              <DesktopNavLinks location={location} onNavigate={handleNavigation} />
            </nav>

            {/* Right: User Account (Desktop) + Mobile Menu */}
            <div className="flex items-center gap-3">
              {/* User Account - Desktop Only */}
              <div className="hidden lg:block">
                <UserAccountDropdown user={user} onNavigate={handleNavigation} onLogout={handleLogout} authEnabled={authEnabled} />
            </div>

            {/* Mobile/Tablet Hamburger Menu */}
            <div className="lg:hidden">
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <button
                    className="p-2 rounded-md hover:bg-green-50 transition-colors"
                    data-testid="mobile-menu-button"
                    aria-label="Open navigation menu"
                  >
                    <Menu className="w-6 h-6" style={{ color: '#1a4731' }} />
                  </button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[280px] sm:w-[320px] overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle 
                      className="text-xl font-black tracking-tight text-left"
                      style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}
                    >
                      MintSlip
                    </SheetTitle>
                  </SheetHeader>
                  <nav className="flex flex-col gap-2 mt-6 pb-20">
                    <MobileNavLinks location={location} onNavigate={handleNavigation} />
                  </nav>
                  
                  {/* Auth buttons in mobile menu when logged out */}
                  {!user && authEnabled && (
                    <div className="mt-4 pt-4 border-t border-gray-200 flex flex-col gap-2 px-4">
                      <button
                        onClick={() => handleNavigation("/signup")}
                        className="w-full py-2.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors"
                      >
                        Sign Up
                      </button>
                      <button
                        onClick={() => handleNavigation("/login")}
                        className="w-full py-2.5 text-sm font-medium text-slate-700 border border-slate-200 hover:bg-slate-50 rounded-md transition-colors"
                      >
                        Log In
                      </button>
                    </div>
                  )}

                  {/* User info in mobile menu */}
                  {user ? (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="px-4 py-2 mb-2">
                        <p className="font-medium text-slate-800">{user.name}</p>
                        <p className="text-xs text-slate-500">{user.email}</p>
                      </div>
                      <button
                        onClick={() => handleNavigation("/user/dashboard")}
                        className="flex items-center gap-2 px-4 py-2 w-full justify-start rounded-md hover:bg-green-50 transition-colors text-slate-600"
                      >
                        <LayoutDashboard className="w-4 h-4" />
                        <span>Dashboard</span>
                      </button>
                      <button
                        onClick={() => handleNavigation("/user/downloads")}
                        className="flex items-center gap-2 px-4 py-2 w-full justify-start rounded-md hover:bg-green-50 transition-colors text-slate-600"
                      >
                        <Download className="w-4 h-4" />
                        <span>My Downloads</span>
                      </button>
                      {(user.subscription?.tier === 'business' && ['active', 'cancelling'].includes(user.subscription?.status)) && (
                        <button
                          onClick={() => handleNavigation("/user/pdf-engine")}
                          className="flex items-center gap-2 px-4 py-2 w-full justify-start rounded-md hover:bg-purple-50 transition-colors text-purple-600"
                        >
                          <ShieldCheck className="w-4 h-4" />
                          <span>PDF Engine</span>
                          <span className="ml-auto text-[10px] px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded-full font-medium">Business</span>
                        </button>
                      )}
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-4 py-2 w-full justify-start rounded-md hover:bg-red-50 transition-colors text-red-600"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Log Out</span>
                      </button>
                    </div>
                  ) : null}
                  
                  {/* Home link in mobile menu */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => handleNavigation("/")}
                      className="flex items-center gap-2 px-4 py-3 w-full justify-start rounded-md hover:bg-green-50 transition-colors"
                      data-testid="nav-home-link-mobile"
                      style={{ color: location.pathname === '/' ? '#1a4731' : '#64748b' }}
                    >
                      <ArrowLeft className="w-5 h-5" />
                      <span className="font-medium text-base">Back to Home</span>
                    </button>
                  </div>
                  
                  {/* Support Contact in Mobile Menu */}
                  <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
                    <p className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Support</p>
                    <a 
                      href="tel:+18556236746" 
                      className="flex items-center gap-2 px-4 py-2 w-full rounded-md hover:bg-green-50 transition-colors text-slate-600"
                    >
                      <Phone className="w-4 h-4 text-green-600" />
                      <span className="text-sm">(855) 623-6746</span>
                    </a>
                    <a 
                      href="mailto:support@mintslip.com" 
                      className="flex items-center gap-2 px-4 py-2 w-full rounded-md hover:bg-green-50 transition-colors text-slate-600"
                    >
                      <Mail className="w-4 h-4 text-green-600" />
                      <span className="text-sm">support@mintslip.com</span>
                    </a>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>
      </header>
    </>
  );
}




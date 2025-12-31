import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, FileText, FileBarChart, Menu, Mail, HelpCircle, Info, ChevronDown, Receipt, FileSpreadsheet, Sparkles, User, LogOut, Settings, Download, LayoutDashboard } from "lucide-react";
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

// Navigation links component for desktop
function DesktopNavLinks({ location, onNavigate, user, onLogout }) {
  const isActive = (path) => location.pathname === path;
  const isTaxFormActive = TAX_FORMS.some(form => location.pathname === form.path);
  const isOtherFormActive = OTHER_FORMS.some(form => location.pathname === form.path);
  const isPaystubActive = location.pathname === '/paystub-generator' || location.pathname === '/paystub-samples';
  
  const getButtonClasses = (path) => {
    const base = "flex items-center gap-2 px-4 py-2 rounded-md transition-all";
    if (isActive(path)) {
      return `${base} bg-green-100 text-green-800 font-semibold`;
    }
    return `${base} hover:bg-green-50 text-slate-500 hover:text-green-700`;
  };

  const getDropdownTriggerClasses = (isDropdownActive) => {
    const base = "flex items-center gap-2 px-4 py-2 rounded-md transition-all";
    if (isDropdownActive) {
      return `${base} bg-green-100 text-green-800 font-semibold`;
    }
    return `${base} hover:bg-green-50 text-slate-500 hover:text-green-700`;
  };

  return (
    <>
      {/* Pay Stubs Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className={getDropdownTriggerClasses(isPaystubActive)}
            data-testid="nav-paystub-dropdown"
          >
            <FileText className="w-4 h-4" />
            <span className="text-sm">Pay Stubs</span>
            <ChevronDown className="w-3 h-3 ml-1" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          <DropdownMenuItem
            onClick={() => onNavigate("/paystub-generator")}
            className={`flex items-center gap-2 cursor-pointer ${
              isActive("/paystub-generator") ? 'bg-green-50 text-green-800 font-semibold' : ''
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Create Paystub</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => onNavigate("/canadian-paystub-generator")}
            className={`flex items-center gap-2 cursor-pointer ${
              isActive("/canadian-paystub-generator") ? 'bg-green-50 text-green-800 font-semibold' : ''
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Canada Pay Stubs</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => onNavigate("/paystub-samples")}
            className={`flex items-center gap-2 cursor-pointer ${
              isActive("/paystub-samples") ? 'bg-green-50 text-green-800 font-semibold' : ''
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Sample Templates</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      {/* <button
        onClick={() => onNavigate("/accounting-mockup-generator")}
        className={getButtonClasses("/accounting-mockup-generator")}
        data-testid="nav-bankstatement-link"
      >
        <FileBarChart className="w-4 h-4" />
        <span className="text-sm">Accounting Mockups</span>
      </button> */}

      <button
        onClick={() => onNavigate("/ai-resume-builder")}
        className={getButtonClasses("/ai-resume-builder")}
        data-testid="nav-resume-builder-link"
      >
        <Sparkles className="w-4 h-4" />
        <span className="text-sm">AI Resume Builder</span>
      </button>

      {/* Tax Forms Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className={getDropdownTriggerClasses(isTaxFormActive)}
            data-testid="nav-taxforms-dropdown"
          >
            <Receipt className="w-4 h-4" />
            <span className="text-sm">Tax Forms</span>
            <ChevronDown className="w-3 h-3 ml-1" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          {TAX_FORMS.map((form) => {
            const IconComponent = form.icon;
            return (
              <DropdownMenuItem
                key={form.path}
                onClick={() => onNavigate(form.path)}
                className={`flex items-center gap-2 cursor-pointer ${
                  isActive(form.path) ? 'bg-green-50 text-green-800 font-semibold' : ''
                }`}
              >
                <IconComponent className="w-4 h-4" />
                <span>{form.name}</span>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Other Forms/Generators Dropdown
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className={getDropdownTriggerClasses(isOtherFormActive)}
            data-testid="nav-otherforms-dropdown"
          >
            <Receipt className="w-4 h-4" />
            <span className="text-sm">Other Forms</span>
            <ChevronDown className="w-3 h-3 ml-1" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          {OTHER_FORMS.map((form) => {
            const IconComponent = form.icon;
            return (
              <DropdownMenuItem
                key={form.path}
                onClick={() => onNavigate(form.path)}
                className={`flex items-center gap-2 cursor-pointer ${
                  isActive(form.path) ? 'bg-green-50 text-green-800 font-semibold' : ''
                }`}
              >
                <IconComponent className="w-4 h-4" />
                <span>{form.name}</span>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu> */}

      <button
        onClick={() => onNavigate("/generators")}
        className={getButtonClasses("/generators")}
        data-testid="nav-generators-link"
      >
        <FileText className="w-4 h-4" />
        <span className="text-sm">All Generators</span>
      </button>
      
      <button
        onClick={() => onNavigate("/contact")}
        className={getButtonClasses("/contact")}
        data-testid="nav-contact-link"
      >
        <Mail className="w-4 h-4" />
        <span className="text-sm">Contact</span>
      </button>

      {/* User Account Dropdown - Only shown when logged in */}
      {user && (
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
      )}
    </>
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
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-black/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            <h1 
              className="text-xl sm:text-2xl font-black tracking-tight cursor-pointer" 
              style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}
              onClick={() => navigate("/")}
            >
              MintSlip
            </h1>
          </div>
          
          {/* Desktop Navigation Links - Hidden on mobile/tablet */}
          <nav className="hidden md:flex items-center gap-2">
            <DesktopNavLinks location={location} onNavigate={handleNavigation} user={user} onLogout={handleLogout} />
          </nav>

          {/* Mobile/Tablet Hamburger Menu - Visible only on mobile/tablet */}
          <div className="md:hidden">
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
              <SheetContent side="right" className="w-[280px] sm:w-[320px]">
                <SheetHeader>
                  <SheetTitle 
                    className="text-xl font-black tracking-tight text-left"
                    style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}
                  >
                    MintSlip
                  </SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-2 mt-6">
                  <MobileNavLinks location={location} onNavigate={handleNavigation} />
                </nav>
                
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
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}

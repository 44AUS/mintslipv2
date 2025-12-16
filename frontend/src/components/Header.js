import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, FileText, FileBarChart, Menu, Mail, HelpCircle, Info } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

// Navigation links component - defined outside to avoid re-creating on each render
function NavLinks({ location, onNavigate, isMobile = false }) {
  const isActive = (path) => location.pathname === path;
  
  const getButtonClasses = (path) => {
    const base = `flex items-center gap-2 px-4 py-2 rounded-md transition-all ${
      isMobile ? "w-full justify-start text-base py-3" : ""
    }`;
    
    if (isActive(path)) {
      return `${base} bg-green-100 text-green-800 font-semibold`;
    }
    return `${base} hover:bg-green-50 text-slate-500 hover:text-green-700`;
  };

  return (
    <>
      <button
        onClick={() => onNavigate("/paystub")}
        className={getButtonClasses("/paystub")}
        data-testid="nav-paystub-link"
      >
        <FileText className={isMobile ? "w-5 h-5" : "w-4 h-4"} />
        <span className={isMobile ? "text-base" : "text-sm"}>Pay Stubs</span>
      </button>
      <button
        onClick={() => onNavigate("/bank-statement")}
        className={getButtonClasses("/bank-statement")}
        data-testid="nav-bankstatement-link"
      >
        <FileBarChart className={isMobile ? "w-5 h-5" : "w-4 h-4"} />
        <span className={isMobile ? "text-base" : "text-sm"}>Bank Statements</span>
      </button>
      <button
        onClick={() => onNavigate("/about")}
        className={getButtonClasses("/about")}
        data-testid="nav-about-link"
      >
        <Info className={isMobile ? "w-5 h-5" : "w-4 h-4"} />
        <span className={isMobile ? "text-base" : "text-sm"}>About</span>
      </button>
      <button
        onClick={() => onNavigate("/faq")}
        className={getButtonClasses("/faq")}
        data-testid="nav-faq-link"
      >
        <HelpCircle className={isMobile ? "w-5 h-5" : "w-4 h-4"} />
        <span className={isMobile ? "text-base" : "text-sm"}>FAQ</span>
      </button>
      <button
        onClick={() => onNavigate("/contact")}
        className={getButtonClasses("/contact")}
        data-testid="nav-contact-link"
      >
        <Mail className={isMobile ? "w-5 h-5" : "w-4 h-4"} />
        <span className={isMobile ? "text-base" : "text-sm"}>Contact</span>
      </button>
    </>
  );
}

export default function Header({ title }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === "/";
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavigation = (path) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-black/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            {!isHome && (
              <button 
                onClick={() => navigate("/")} 
                className="hover:opacity-70 transition-opacity"
                data-testid="back-button"
              >
                <ArrowLeft className="w-5 h-5" style={{ color: '#1a4731' }} />
              </button>
            )}
            <h1 
              className="text-xl sm:text-2xl font-black tracking-tight cursor-pointer" 
              style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}
              onClick={() => navigate("/")}
            >
              {title || "MintSlip"}
            </h1>
          </div>
          
          {/* Desktop Navigation Links - Hidden on mobile/tablet */}
          <nav className="hidden md:flex items-center gap-4">
            <NavLinks location={location} onNavigate={handleNavigation} />
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
                  <NavLinks location={location} onNavigate={handleNavigation} isMobile={true} />
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

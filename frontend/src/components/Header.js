import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, FileText, FileBarChart } from "lucide-react";

export default function Header({ title }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === "/";

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-black/5">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
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
              className="text-2xl font-black tracking-tight cursor-pointer" 
              style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}
              onClick={() => navigate("/")}
            >
              {title || "DocuMint"}
            </h1>
          </div>
          
          {/* Navigation Links */}
          <nav className="flex items-center gap-4">
            <button
              onClick={() => navigate("/paystub")}
              className="flex items-center gap-2 px-4 py-2 rounded-md hover:bg-green-50 transition-colors"
              data-testid="nav-paystub-link"
              style={{ color: location.pathname === '/paystub' ? '#1a4731' : '#64748b' }}
            >
              <FileText className="w-4 h-4" />
              <span className="text-sm font-medium">Pay Stubs</span>
            </button>
            <button
              onClick={() => navigate("/bankstatement")}
              className="flex items-center gap-2 px-4 py-2 rounded-md hover:bg-green-50 transition-colors"
              data-testid="nav-bankstatement-link"
              style={{ color: location.pathname === '/bankstatement' ? '#1a4731' : '#64748b' }}
            >
              <FileBarChart className="w-4 h-4" />
              <span className="text-sm font-medium">Bank Statements</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
}
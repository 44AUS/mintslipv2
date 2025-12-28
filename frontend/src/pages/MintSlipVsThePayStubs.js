import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { Helmet } from "react-helmet-async";
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Shield, 
  FileText, 
  Zap, 
  Users, 
  CreditCard,
  Download,
  Lock,
  Eye,
  Smartphone,
  Award,
  ArrowRight,
  Sparkles,
  Star,
  DollarSign,
  AlertTriangle,
  ThumbsUp,
  Percent
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

// Custom hook for intersection observer
const useInView = (options = {}) => {
  const ref = useRef(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsInView(true);
        observer.disconnect();
      }
    }, { threshold: 0.3, ...options });

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return [ref, isInView];
};

// Main VS Comparison Animation Component
const VsComparisonAnimation = ({ isVisible }) => (
  <div className="relative w-full h-full flex items-center justify-center">
    <svg viewBox="0 0 280 220" className="w-full h-full max-w-md">
      {/* Left side - "ThePayStubs" (outdated, issues) */}
      <g style={{ 
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateX(0)' : 'translateX(-20px)',
        transition: 'all 0.5s ease-out'
      }}>
        {/* Outdated document */}
        <rect x="20" y="40" width="80" height="110" rx="4" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="4 2"/>
        {/* Messy/faded lines */}
        <line x1="30" y1="60" x2="85" y2="60" stroke="#cbd5e1" strokeWidth="2" opacity="0.5"/>
        <line x1="30" y1="75" x2="70" y2="75" stroke="#cbd5e1" strokeWidth="2" opacity="0.4"/>
        <line x1="30" y1="90" x2="80" y2="90" stroke="#cbd5e1" strokeWidth="2" opacity="0.3"/>
        <line x1="30" y1="105" x2="65" y2="105" stroke="#cbd5e1" strokeWidth="2" opacity="0.4"/>
        <line x1="30" y1="120" x2="75" y2="120" stroke="#cbd5e1" strokeWidth="2" opacity="0.3"/>
        {/* Dollar sign indicating high cost */}
        <text x="60" y="145" textAnchor="middle" fill="#ef4444" fontSize="20" fontWeight="bold"
          style={{ opacity: 0, animation: isVisible ? 'fadeIn 0.4s ease-out 0.6s forwards' : 'none' }}>$$$</text>
        {/* "ThePayStubs" label */}
        <rect x="20" y="160" width="80" height="18" rx="4" fill="#94a3b8"
          style={{ opacity: 0, animation: isVisible ? 'fadeIn 0.4s ease-out 0.4s forwards' : 'none' }}/>
        <text x="60" y="173" textAnchor="middle" fill="#ffffff" fontSize="7" fontWeight="bold"
          style={{ opacity: 0, animation: isVisible ? 'fadeIn 0.4s ease-out 0.4s forwards' : 'none' }}>THEPAYSTUBS</text>
        {/* X mark */}
        <g style={{ opacity: 0, animation: isVisible ? 'fadeIn 0.3s ease-out 0.8s forwards' : 'none' }}>
          <circle cx="60" cy="95" r="20" fill="#fee2e2" stroke="#ef4444" strokeWidth="2"/>
          <path d="M52,87 L68,103 M68,87 L52,103" stroke="#ef4444" strokeWidth="3" strokeLinecap="round"/>
        </g>
      </g>

      {/* VS divider */}
      <g style={{ opacity: 0, animation: isVisible ? 'popIn 0.5s ease-out 0.3s forwards' : 'none' }}>
        <circle cx="140" cy="105" r="22" fill="#1a4731"/>
        <text x="140" y="112" textAnchor="middle" fill="#ffffff" fontSize="14" fontWeight="bold">VS</text>
      </g>

      {/* Right side - "MintSlip" (professional, modern) */}
      <g style={{ 
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateX(0) scale(1)' : 'translateX(20px) scale(0.95)',
        transition: 'all 0.6s ease-out 0.2s'
      }}>
        {/* Professional document with glow */}
        <rect x="175" y="35" width="90" height="120" rx="6" fill="#ffffff" stroke="#1a4731" strokeWidth="3" filter="url(#glow)"/>
        {/* Document header */}
        <rect x="175" y="35" width="90" height="25" rx="6" fill="#1a4731"/>
        <text x="220" y="52" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="bold">MINTSLIP</text>
        {/* Clean organized lines */}
        <line x1="185" y1="72" x2="255" y2="72" stroke="#1a4731" strokeWidth="2" opacity="0.8"
          style={{ strokeDasharray: 70, strokeDashoffset: isVisible ? 0 : 70, transition: 'stroke-dashoffset 0.5s ease-out 0.7s' }}/>
        <line x1="185" y1="87" x2="245" y2="87" stroke="#1a4731" strokeWidth="2" opacity="0.6"
          style={{ strokeDasharray: 60, strokeDashoffset: isVisible ? 0 : 60, transition: 'stroke-dashoffset 0.5s ease-out 0.8s' }}/>
        <line x1="185" y1="102" x2="250" y2="102" stroke="#1a4731" strokeWidth="2" opacity="0.6"
          style={{ strokeDasharray: 65, strokeDashoffset: isVisible ? 0 : 65, transition: 'stroke-dashoffset 0.5s ease-out 0.9s' }}/>
        {/* Amount highlight */}
        <rect x="185" y="115" width="70" height="20" rx="3" fill="#dcfce7" stroke="#22c55e" strokeWidth="1"
          style={{ opacity: 0, animation: isVisible ? 'fadeIn 0.4s ease-out 1s forwards' : 'none' }}/>
        <text x="220" y="129" textAnchor="middle" fill="#166534" fontSize="10" fontWeight="bold"
          style={{ opacity: 0, animation: isVisible ? 'fadeIn 0.4s ease-out 1.1s forwards' : 'none' }}>$7.99</text>
        {/* MINTSLIP label */}
        <rect x="185" y="165" width="70" height="18" rx="4" fill="#1a4731"
          style={{ opacity: 0, animation: isVisible ? 'slideUp 0.4s ease-out 0.5s forwards' : 'none' }}/>
        <text x="220" y="178" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="bold"
          style={{ opacity: 0, animation: isVisible ? 'slideUp 0.4s ease-out 0.5s forwards' : 'none' }}>MINTSLIP</text>
        {/* Checkmark */}
        <g style={{ opacity: 0, animation: isVisible ? 'bounceIn 0.5s ease-out 1.2s forwards' : 'none' }}>
          <circle cx="220" cy="95" r="18" fill="#22c55e"/>
          <path d="M212,95 L217,101 L230,86" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
        </g>
      </g>

      {/* Floating benefits */}
      <g style={{ opacity: 0, animation: isVisible ? 'fadeIn 0.4s ease-out 1.4s forwards' : 'none' }}>
        {/* Price badge */}
        <g style={{ animation: isVisible ? 'floatBadge 3s ease-in-out infinite 1.5s' : 'none' }}>
          <rect x="170" y="5" width="55" height="20" rx="10" fill="#22c55e"/>
          <text x="197" y="18" textAnchor="middle" fill="#ffffff" fontSize="7" fontWeight="bold">💰 SAVE 60%</text>
        </g>
        {/* Quality badge */}
        <g style={{ animation: isVisible ? 'floatBadge 3s ease-in-out infinite 1.8s' : 'none' }}>
          <rect x="230" y="15" width="48" height="20" rx="10" fill="#fbbf24"/>
          <text x="254" y="28" textAnchor="middle" fill="#1a1a1a" fontSize="7" fontWeight="bold">⭐ BETTER</text>
        </g>
      </g>

      {/* Sparkles around MintSlip */}
      <g style={{ opacity: isVisible ? 1 : 0, transition: 'opacity 0.5s ease-out 1.3s' }}>
        <circle cx="270" cy="50" r="3" fill="#fbbf24" style={{ animation: isVisible ? 'sparkle 1.5s ease-in-out infinite' : 'none' }}/>
        <circle cx="175" cy="165" r="2.5" fill="#fbbf24" style={{ animation: isVisible ? 'sparkle 1.8s ease-in-out infinite 0.2s' : 'none' }}/>
        <circle cx="268" cy="140" r="2" fill="#fbbf24" style={{ animation: isVisible ? 'sparkle 1.6s ease-in-out infinite 0.4s' : 'none' }}/>
      </g>

      {/* Arrow pointing to MintSlip */}
      <g style={{ opacity: 0, animation: isVisible ? 'slideRight 0.5s ease-out 1s forwards' : 'none' }}>
        <path d="M120,200 Q140,185 160,195" fill="none" stroke="#1a4731" strokeWidth="2" strokeLinecap="round"/>
        <path d="M155,190 L162,196 L154,200" fill="#1a4731"/>
        <text x="130" y="215" textAnchor="middle" fill="#1a4731" fontSize="8" fontWeight="bold">SMART CHOICE</text>
      </g>

      {/* SVG filter for glow effect */}
      <defs>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
    </svg>

    <style>{`
      @keyframes fadeIn {
        0% { opacity: 0; }
        100% { opacity: 1; }
      }
      @keyframes popIn {
        0% { opacity: 0; transform: scale(0); }
        70% { transform: scale(1.15); }
        100% { opacity: 1; transform: scale(1); }
      }
      @keyframes bounceIn {
        0% { opacity: 0; transform: scale(0); }
        60% { transform: scale(1.2); }
        100% { opacity: 1; transform: scale(1); }
      }
      @keyframes slideUp {
        0% { opacity: 0; transform: translateY(10px); }
        100% { opacity: 1; transform: translateY(0); }
      }
      @keyframes slideRight {
        0% { opacity: 0; transform: translateX(-10px); }
        100% { opacity: 1; transform: translateX(0); }
      }
      @keyframes floatBadge {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-5px); }
      }
      @keyframes sparkle {
        0%, 100% { opacity: 0.4; transform: scale(1); }
        50% { opacity: 1; transform: scale(1.5); }
      }
    `}</style>
  </div>
);

// Price Comparison Animation
const PriceComparisonAnimation = ({ isVisible }) => (
  <div className="relative w-full h-full flex items-center justify-center">
    <svg viewBox="0 0 200 200" className="w-full h-full max-w-xs">
      {/* Background circle */}
      <circle cx="100" cy="100" r="80" fill="#f0fdf4" opacity="0.5"
        style={{ animation: isVisible ? 'pulseBg 2s ease-in-out infinite' : 'none' }}/>
      
      {/* ThePayStubs price (crossed out) */}
      <g style={{ 
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(-10px)',
        transition: 'all 0.5s ease-out 0.2s'
      }}>
        <text x="100" y="70" textAnchor="middle" fill="#94a3b8" fontSize="18" fontWeight="bold">$19.99</text>
        <line x1="60" y1="68" x2="140" y2="68" stroke="#ef4444" strokeWidth="3" strokeLinecap="round"
          style={{ opacity: 0, animation: isVisible ? 'strikeThrough 0.3s ease-out 0.8s forwards' : 'none' }}/>
        <text x="100" y="85" textAnchor="middle" fill="#94a3b8" fontSize="10">ThePayStubs</text>
      </g>

      {/* MintSlip price (highlighted) */}
      <g style={{ 
        opacity: 0,
        animation: isVisible ? 'bounceIn 0.6s ease-out 1s forwards' : 'none'
      }}>
        <rect x="45" y="100" width="110" height="50" rx="8" fill="#1a4731"/>
        <text x="100" y="128" textAnchor="middle" fill="#ffffff" fontSize="24" fontWeight="bold">$7.99</text>
        <text x="100" y="142" textAnchor="middle" fill="#86efac" fontSize="10">MintSlip</text>
      </g>

      {/* Savings badge */}
      <g style={{ opacity: 0, animation: isVisible ? 'popIn 0.5s ease-out 1.4s forwards' : 'none' }}>
        <rect x="55" y="160" width="90" height="24" rx="12" fill="#22c55e"/>
        <text x="100" y="176" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="bold">SAVE 60%</text>
      </g>

      {/* Dollar signs floating */}
      <g style={{ opacity: isVisible ? 1 : 0, transition: 'opacity 0.5s ease-out 1.2s' }}>
        <text x="25" y="100" fill="#22c55e" fontSize="16" style={{ animation: isVisible ? 'floatMoney 2s ease-in-out infinite' : 'none' }}>$</text>
        <text x="175" y="90" fill="#22c55e" fontSize="14" style={{ animation: isVisible ? 'floatMoney 2.5s ease-in-out infinite 0.3s' : 'none' }}>$</text>
        <text x="165" y="130" fill="#22c55e" fontSize="12" style={{ animation: isVisible ? 'floatMoney 2.2s ease-in-out infinite 0.6s' : 'none' }}>$</text>
      </g>
    </svg>

    <style>{`
      @keyframes pulseBg {
        0%, 100% { transform: scale(1); opacity: 0.5; }
        50% { transform: scale(1.02); opacity: 0.7; }
      }
      @keyframes strikeThrough {
        0% { opacity: 0; stroke-dasharray: 80; stroke-dashoffset: 80; }
        100% { opacity: 1; stroke-dashoffset: 0; }
      }
      @keyframes bounceIn {
        0% { opacity: 0; transform: scale(0.5); }
        60% { transform: scale(1.1); }
        100% { opacity: 1; transform: scale(1); }
      }
      @keyframes popIn {
        0% { opacity: 0; transform: scale(0); }
        70% { transform: scale(1.15); }
        100% { opacity: 1; transform: scale(1); }
      }
      @keyframes floatMoney {
        0%, 100% { transform: translateY(0); opacity: 0.6; }
        50% { transform: translateY(-10px); opacity: 1; }
      }
    `}</style>
  </div>
);

// Quality Animation
const QualityAnimation = ({ isVisible }) => (
  <div className="relative w-full h-full flex items-center justify-center">
    <svg viewBox="0 0 200 200" className="w-full h-full max-w-xs">
      {/* Background glow */}
      <circle cx="100" cy="100" r="75" fill="#fef3c7" opacity="0.4"
        style={{ animation: isVisible ? 'pulseBg 2s ease-in-out infinite' : 'none' }}/>
      
      {/* Star shape */}
      <g style={{ 
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'scale(1) rotate(0deg)' : 'scale(0.5) rotate(-30deg)',
        transformOrigin: '100px 90px',
        transition: 'all 0.6s ease-out 0.2s'
      }}>
        <polygon 
          points="100,30 115,70 158,70 123,97 137,140 100,115 63,140 77,97 42,70 85,70" 
          fill="#fbbf24" 
          stroke="#f59e0b" 
          strokeWidth="3"
        />
        {/* Inner star highlight */}
        <polygon 
          points="100,45 110,70 140,70 117,88 127,115 100,97 73,115 83,88 60,70 90,70" 
          fill="#fde68a" 
          opacity="0.6"
        />
      </g>

      {/* "PREMIUM" text in center */}
      <text x="100" y="95" textAnchor="middle" fill="#1a4731" fontSize="12" fontWeight="bold"
        style={{ opacity: 0, animation: isVisible ? 'fadeIn 0.4s ease-out 0.8s forwards' : 'none' }}>PREMIUM</text>

      {/* Quality badge */}
      <g style={{ opacity: 0, animation: isVisible ? 'slideUp 0.5s ease-out 1s forwards' : 'none' }}>
        <rect x="50" y="155" width="100" height="28" rx="14" fill="#1a4731"/>
        <text x="100" y="174" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="bold">⭐ TOP QUALITY</text>
      </g>

      {/* Floating stars */}
      <g style={{ opacity: isVisible ? 1 : 0, transition: 'opacity 0.5s ease-out 0.9s' }}>
        <text x="35" y="50" fill="#fbbf24" fontSize="14" style={{ animation: isVisible ? 'twinkle 1.5s ease-in-out infinite' : 'none' }}>★</text>
        <text x="165" y="60" fill="#fbbf24" fontSize="12" style={{ animation: isVisible ? 'twinkle 1.8s ease-in-out infinite 0.3s' : 'none' }}>★</text>
        <text x="160" y="140" fill="#fbbf24" fontSize="10" style={{ animation: isVisible ? 'twinkle 1.6s ease-in-out infinite 0.6s' : 'none' }}>★</text>
        <text x="30" y="130" fill="#fbbf24" fontSize="11" style={{ animation: isVisible ? 'twinkle 2s ease-in-out infinite 0.4s' : 'none' }}>★</text>
      </g>
    </svg>

    <style>{`
      @keyframes pulseBg {
        0%, 100% { transform: scale(1); opacity: 0.4; }
        50% { transform: scale(1.03); opacity: 0.6; }
      }
      @keyframes fadeIn {
        0% { opacity: 0; }
        100% { opacity: 1; }
      }
      @keyframes slideUp {
        0% { opacity: 0; transform: translateY(15px); }
        100% { opacity: 1; transform: translateY(0); }
      }
      @keyframes twinkle {
        0%, 100% { opacity: 0.4; transform: scale(1); }
        50% { opacity: 1; transform: scale(1.3); }
      }
    `}</style>
  </div>
);

// Comparison Table Row Component
const ComparisonRow = ({ feature, mintslip, competitor, mintslipBetter = true }) => (
  <tr className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
    <td className="py-4 px-4 font-medium text-slate-700">{feature}</td>
    <td className="py-4 px-4 text-center">
      {typeof mintslip === 'boolean' ? (
        mintslip ? (
          <CheckCircle className="w-6 h-6 text-green-500 mx-auto" />
        ) : (
          <XCircle className="w-6 h-6 text-red-400 mx-auto" />
        )
      ) : (
        <span className={`font-semibold ${mintslipBetter ? 'text-green-600' : 'text-slate-600'}`}>{mintslip}</span>
      )}
    </td>
    <td className="py-4 px-4 text-center">
      {typeof competitor === 'boolean' ? (
        competitor ? (
          <CheckCircle className="w-6 h-6 text-green-500 mx-auto" />
        ) : (
          <XCircle className="w-6 h-6 text-red-400 mx-auto" />
        )
      ) : (
        <span className={`font-semibold ${!mintslipBetter ? 'text-green-600' : 'text-slate-400'}`}>{competitor}</span>
      )}
    </td>
  </tr>
);

export default function MintSlipVsThePayStubs() {
  const navigate = useNavigate();
  const [heroRef, heroInView] = useInView();
  const [priceRef, priceInView] = useInView();
  const [qualityRef, qualityInView] = useInView();
  const [tableRef, tableInView] = useInView();

  return (
    <>
      <Helmet>
        <title>MintSlip vs ThePayStubs (2025) | Honest Comparison & Review</title>
        <meta name="description" content="Comparing MintSlip vs ThePayStubs for paystub generation. See why MintSlip offers better value at $7.99 vs $19.99, more templates, accurate tax calculations, and instant downloads." />
        <meta name="keywords" content="MintSlip vs ThePayStubs, paystub generator comparison, best paystub maker, ThePayStubs alternative, cheap paystub generator, paystub generator review" />
        <link rel="canonical" href="https://mintslip.com/mintslip-vs-thepaystubs" />
        
        {/* Open Graph */}
        <meta property="og:title" content="MintSlip vs ThePayStubs (2025) | Honest Comparison" />
        <meta property="og:description" content="See why thousands choose MintSlip over ThePayStubs. Better price, more features, instant downloads." />
        <meta property="og:type" content="article" />
        <meta property="og:url" content="https://mintslip.com/mintslip-vs-thepaystubs" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="MintSlip vs ThePayStubs Comparison" />
        <meta name="twitter:description" content="Honest comparison of the two paystub generators. MintSlip wins on price, features, and quality." />

        {/* Schema.org structured data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": "MintSlip vs ThePayStubs: Complete Comparison Guide 2025",
            "description": "Detailed comparison between MintSlip and ThePayStubs paystub generators",
            "author": {
              "@type": "Organization",
              "name": "MintSlip"
            },
            "datePublished": "2025-01-01",
            "dateModified": "2025-01-01"
          })}
        </script>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        <Header />
        
        {/* Hero Section */}
        <section ref={heroRef} className="relative py-16 md:py-24 overflow-hidden">
          {/* Background decorations */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-20 left-10 w-72 h-72 bg-green-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse" />
            <div className="absolute top-40 right-10 w-72 h-72 bg-yellow-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse" style={{ animationDelay: '1s' }} />
          </div>

          <div className="container mx-auto px-4 relative z-10">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left Content */}
              <div className={`transition-all duration-700 ${heroInView ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}>
                <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
                  <Sparkles className="w-4 h-4" />
                  2025 Comparison Guide
                </div>
                
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 mb-6" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  MintSlip vs{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-500">
                    ThePayStubs
                  </span>
                </h1>
                
                <p className="text-xl text-slate-600 mb-8 leading-relaxed">
                  Looking for the best paystub generator? We compare MintSlip and ThePayStubs head-to-head 
                  on price, features, quality, and user experience. <strong>Save 60% with MintSlip.</strong>
                </p>
                
                <div className="flex flex-wrap gap-4 mb-8">
                  <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    <span className="text-slate-700 font-medium">$7.99 vs $19.99</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm">
                    <Zap className="w-5 h-5 text-yellow-500" />
                    <span className="text-slate-700 font-medium">Instant Download</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm">
                    <Shield className="w-5 h-5 text-blue-500" />
                    <span className="text-slate-700 font-medium">More Templates</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4">
                  <Button 
                    onClick={() => navigate('/paystub-generator')}
                    className="bg-gradient-to-r from-green-700 to-green-600 hover:from-green-800 hover:to-green-700 text-white px-8 py-6 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all"
                  >
                    Try MintSlip Today
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => document.getElementById('comparison-table').scrollIntoView({ behavior: 'smooth' })}
                    className="px-8 py-6 text-lg rounded-xl border-2 border-slate-200 hover:border-green-500 hover:bg-green-50"
                  >
                    See Full Comparison
                  </Button>
                </div>
              </div>

              {/* Right Animation */}
              <div className={`h-80 md:h-96 transition-all duration-700 delay-200 ${heroInView ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}>
                <VsComparisonAnimation isVisible={heroInView} />
              </div>
            </div>
          </div>
        </section>

        {/* Quick Stats Section */}
        <section className="py-12 bg-gradient-to-r from-green-800 to-green-700">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-white">
              <div>
                <div className="text-4xl md:text-5xl font-bold mb-2">60%</div>
                <div className="text-green-200">Cheaper</div>
              </div>
              <div>
                <div className="text-4xl md:text-5xl font-bold mb-2">4+</div>
                <div className="text-green-200">Template Styles</div>
              </div>
              <div>
                <div className="text-4xl md:text-5xl font-bold mb-2">50</div>
                <div className="text-green-200">State Tax Calculations</div>
              </div>
              <div>
                <div className="text-4xl md:text-5xl font-bold mb-2">24/7</div>
                <div className="text-green-200">Instant Access</div>
              </div>
            </div>
          </div>
        </section>

        {/* Price Comparison Section */}
        <section ref={priceRef} className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Animation */}
              <div className={`h-72 md:h-80 order-2 lg:order-1 transition-all duration-700 ${priceInView ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}>
                <PriceComparisonAnimation isVisible={priceInView} />
              </div>

              {/* Content */}
              <div className={`order-1 lg:order-2 transition-all duration-700 delay-200 ${priceInView ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}>
                <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium mb-4">
                  <DollarSign className="w-4 h-4" />
                  Price Comparison
                </div>
                
                <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  Save 60% With MintSlip
                </h2>
                
                <p className="text-lg text-slate-600 mb-6">
                  ThePayStubs charges <strong className="text-red-500">$19.99</strong> per paystub while MintSlip offers 
                  the same professional quality at just <strong className="text-green-600">$7.99</strong>. 
                  That's over 60% savings on every document you create.
                </p>

                <div className="bg-slate-50 rounded-xl p-6 mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-slate-600">ThePayStubs</span>
                    <span className="text-xl font-bold text-slate-400 line-through">$19.99</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-900 font-medium">MintSlip</span>
                    <span className="text-2xl font-bold text-green-600">$7.99</span>
                  </div>
                  <div className="border-t border-slate-200 mt-4 pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-green-700 font-medium">Your Savings</span>
                      <span className="text-xl font-bold text-green-600">$12.00 (60%)</span>
                    </div>
                  </div>
                </div>

                <p className="text-slate-500 text-sm">
                  * Prices as of January 2025. MintSlip pricing includes instant download.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Quality & Features Section */}
        <section ref={qualityRef} className="py-16 md:py-24 bg-slate-50">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Content */}
              <div className={`transition-all duration-700 ${qualityInView ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}>
                <div className="inline-flex items-center gap-2 bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full text-sm font-medium mb-4">
                  <Star className="w-4 h-4" />
                  Quality & Features
                </div>
                
                <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  More Features, Better Quality
                </h2>
                
                <p className="text-lg text-slate-600 mb-8">
                  MintSlip doesn't just save you money—it offers more features and better quality than ThePayStubs.
                  Here's what you get with MintSlip:
                </p>

                <div className="space-y-4">
                  {[
                    { icon: FileText, text: 'Multiple professional templates (Gusto, Workday, OnPay, ADP styles)' },
                    { icon: Zap, text: 'Instant PDF generation and download' },
                    { icon: Shield, text: 'Accurate tax calculations for all 50 states' },
                    { icon: Eye, text: 'Live preview as you type' },
                    { icon: Users, text: 'Support for both W-2 employees and 1099 contractors' },
                    { icon: Download, text: 'Unlimited revisions before purchase' },
                  ].map((item, index) => (
                    <div 
                      key={index} 
                      className="flex items-start gap-3 bg-white p-4 rounded-lg shadow-sm"
                      style={{ 
                        opacity: qualityInView ? 1 : 0,
                        transform: qualityInView ? 'translateY(0)' : 'translateY(20px)',
                        transition: `all 0.5s ease-out ${0.1 * index}s`
                      }}
                    >
                      <item.icon className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-slate-700">{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Animation */}
              <div className={`h-72 md:h-80 transition-all duration-700 delay-200 ${qualityInView ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}>
                <QualityAnimation isVisible={qualityInView} />
              </div>
            </div>
          </div>
        </section>

        {/* Detailed Comparison Table */}
        <section id="comparison-table" ref={tableRef} className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium mb-4">
                <FileText className="w-4 h-4" />
                Feature-by-Feature
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>
                Complete Comparison Table
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                See exactly how MintSlip and ThePayStubs compare across all important features.
              </p>
            </div>

            <div className={`overflow-x-auto transition-all duration-700 ${tableInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <table className="w-full bg-white rounded-2xl shadow-xl overflow-hidden">
                <thead>
                  <tr className="bg-gradient-to-r from-green-800 to-green-700 text-white">
                    <th className="py-5 px-6 text-left font-semibold">Feature</th>
                    <th className="py-5 px-6 text-center font-semibold">
                      <div className="flex items-center justify-center gap-2">
                        <Award className="w-5 h-5 text-yellow-300" />
                        MintSlip
                      </div>
                    </th>
                    <th className="py-5 px-6 text-center font-semibold">ThePayStubs</th>
                  </tr>
                </thead>
                <tbody>
                  <ComparisonRow feature="Price per Paystub" mintslip="$7.99" competitor="$19.99" mintslipBetter={true} />
                  <ComparisonRow feature="Professional Templates" mintslip="4+ Professional Styles" competitor="Multiple Generic Styles" mintslipBetter={true} />
                  <ComparisonRow feature="Instant Download" mintslip={true} competitor={true} />
                  <ComparisonRow feature="Blazing Fast Live Preview" mintslip={true} competitor={false} />
                  <ComparisonRow feature="All 50 State Tax Calculations" mintslip={true} competitor={true} />
                  <ComparisonRow feature="W-2 Employee Support" mintslip={true} competitor={true} />
                  <ComparisonRow feature="1099 Contractor Support" mintslip={true} competitor={true} />
                  <ComparisonRow feature="YTD Calculations" mintslip={true} competitor={true} />
                  <ComparisonRow feature="Overtime Calculations" mintslip={true} competitor={true} />
                  <ComparisonRow feature="Custom Deductions" mintslip={true} competitor={true} />
                  <ComparisonRow feature="Employer Contributions" mintslip={true} competitor={false} />
                  <ComparisonRow feature="Mobile Friendly" mintslip={true} competitor={true} />
                  <ComparisonRow feature="No Account Required" mintslip={true} competitor={true} />
                  <ComparisonRow feature="Canadian Paystubs" mintslip={true} competitor={false} />
                  <ComparisonRow feature="Mobile App" mintslip={true} competitor={false} mintslipBetter={true} />
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Why People Switch Section */}
        <section className="py-16 md:py-24 bg-gradient-to-b from-slate-50 to-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>
                Why People Switch to MintSlip
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Thousands of users have made the switch from ThePayStubs to MintSlip. Here's what they love:
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: DollarSign,
                  title: "Better Value",
                  description: "Save over 60% on every paystub without sacrificing quality. More money in your pocket.",
                  color: "green"
                },
                {
                  icon: Zap,
                  title: "Faster & Easier",
                  description: "Our intuitive interface lets you create professional paystubs in under 5 minutes. No learning curve.",
                  color: "yellow"
                },
                {
                  icon: Shield,
                  title: "More Features",
                  description: "From contractor support to custom deductions, MintSlip offers features ThePayStubs doesn't have.",
                  color: "blue"
                }
              ].map((item, index) => (
                <div 
                  key={index}
                  className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1"
                >
                  <div className={`w-14 h-14 rounded-xl bg-${item.color}-100 flex items-center justify-center mb-6`}>
                    <item.icon className={`w-7 h-7 text-${item.color}-600`} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">{item.title}</h3>
                  <p className="text-slate-600">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  Frequently Asked Questions
                </h2>
              </div>

              <div className="space-y-6">
                {[
                  {
                    q: "Is MintSlip really cheaper than ThePayStubs?",
                    a: "Yes! MintSlip charges $7.99 per paystub while ThePayStubs charges $19.99. That's a savings of over 60% on every document you create."
                  },
                  {
                    q: "Are MintSlip paystubs as professional as ThePayStubs?",
                    a: "Absolutely. MintSlip offers multiple professional templates including styles that match popular payroll providers like Gusto, Workday, OnPay, and ADP. Our paystubs are accepted by landlords, banks, and employers nationwide."
                  },
                  {
                    q: "Does MintSlip calculate taxes accurately?",
                    a: "Yes, MintSlip calculates federal taxes, Social Security, Medicare, and state taxes for all 50 US states. Our tax tables are regularly updated to ensure accuracy."
                  },
                  {
                    q: "Can I create paystubs for contractors on MintSlip?",
                    a: "Yes, MintSlip supports both W-2 employees and 1099 contractors."
                  },
                  {
                    q: "How fast can I get my paystub?",
                    a: "Instantly! Once you complete your information and payment, your PDF is available for immediate download. No waiting, no email delays."
                  },
                  {
                    q: "Do I need to create an account?",
                    a: "No account required. MintSlip lets you create and download paystubs without signing up."
                  }
                ].map((faq, index) => (
                  <div key={index} className="bg-white rounded-xl p-6 shadow-md">
                    <h3 className="text-lg font-bold text-slate-900 mb-3">{faq.q}</h3>
                    <p className="text-slate-600">{faq.a}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-16 md:py-24 bg-gradient-to-r from-green-800 to-green-700">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Ready to Save 60% on Your Next Paystub?
            </h2>
            <p className="text-xl text-green-100 mb-8 max-w-2xl mx-auto">
              Join thousands who've switched from ThePayStubs to MintSlip. Better quality, more features, lower price.
            </p>
            <Button 
              onClick={() => navigate('/paystub-generator')}
              className="bg-white text-green-800 hover:bg-green-50 px-10 py-6 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all"
            >
              Create Your Paystub Now
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <p className="text-green-200 mt-4 text-sm">
              No account required • Instant download • 100% satisfaction guaranteed
            </p>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
}

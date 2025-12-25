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
  Star
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
      {/* Left side - "Others" (faded, outdated) */}
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
        {/* Question mark indicating confusion */}
        <text x="60" y="145" textAnchor="middle" fill="#94a3b8" fontSize="24" fontWeight="bold"
          style={{ opacity: 0, animation: isVisible ? 'fadeIn 0.4s ease-out 0.6s forwards' : 'none' }}>?</text>
        {/* "OTHERS" label */}
        <rect x="30" y="160" width="60" height="18" rx="4" fill="#94a3b8"
          style={{ opacity: 0, animation: isVisible ? 'fadeIn 0.4s ease-out 0.4s forwards' : 'none' }}/>
        <text x="60" y="173" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="bold"
          style={{ opacity: 0, animation: isVisible ? 'fadeIn 0.4s ease-out 0.4s forwards' : 'none' }}>OTHERS</text>
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
          style={{ opacity: 0, animation: isVisible ? 'fadeIn 0.4s ease-out 1.1s forwards' : 'none' }}>$2,450.00</text>
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
        {/* Speed badge */}
        <g style={{ animation: isVisible ? 'floatBadge 3s ease-in-out infinite 1.5s' : 'none' }}>
          <rect x="170" y="5" width="50" height="20" rx="10" fill="#fbbf24"/>
          <text x="195" y="18" textAnchor="middle" fill="#1a1a1a" fontSize="7" fontWeight="bold">⚡ FAST</text>
        </g>
        {/* Accurate badge */}
        <g style={{ animation: isVisible ? 'floatBadge 3s ease-in-out infinite 1.8s' : 'none' }}>
          <rect x="230" y="15" width="48" height="20" rx="10" fill="#22c55e"/>
          <text x="254" y="28" textAnchor="middle" fill="#ffffff" fontSize="7" fontWeight="bold">✓ ACCURATE</text>
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
        <text x="130" y="215" textAnchor="middle" fill="#1a4731" fontSize="8" fontWeight="bold">CHOOSE BETTER</text>
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

// Instant Download Animation Component
const InstantDownloadAnimation = ({ isVisible }) => (
  <div className="relative w-full h-full flex items-center justify-center">
    <svg viewBox="0 0 200 200" className="w-full h-full max-w-xs">
      {/* Cloud shape */}
      <g style={{ 
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(-20px)',
        transition: 'all 0.5s ease-out'
      }}>
        <ellipse cx="100" cy="50" rx="50" ry="25" fill="#e8f5e9"/>
        <ellipse cx="70" cy="55" rx="30" ry="18" fill="#e8f5e9"/>
        <ellipse cx="130" cy="55" rx="30" ry="18" fill="#e8f5e9"/>
        <ellipse cx="100" cy="60" rx="45" ry="20" fill="#e8f5e9"/>
      </g>

      {/* Document with download animation */}
      <g style={{ 
        opacity: isVisible ? 1 : 0,
        animation: isVisible ? 'downloadSlide 1.5s ease-out 0.3s infinite' : 'none'
      }}>
        {/* Document */}
        <rect x="75" y="70" width="50" height="65" rx="4" fill="#ffffff" stroke="#1a4731" strokeWidth="2"/>
        {/* Document corner fold */}
        <path d="M115,70 L115,82 L125,82 Z" fill="#e8f5e9" stroke="#1a4731" strokeWidth="1"/>
        {/* Document lines */}
        <line x1="82" y1="90" x2="108" y2="90" stroke="#1a4731" strokeWidth="2" strokeLinecap="round" opacity="0.3"/>
        <line x1="82" y1="100" x2="115" y2="100" stroke="#1a4731" strokeWidth="2" strokeLinecap="round" opacity="0.3"/>
        <line x1="82" y1="110" x2="105" y2="110" stroke="#1a4731" strokeWidth="2" strokeLinecap="round" opacity="0.3"/>
        <line x1="82" y1="120" x2="112" y2="120" stroke="#1a4731" strokeWidth="2" strokeLinecap="round" opacity="0.3"/>
      </g>

      {/* Download arrow */}
      <g style={{ 
        opacity: isVisible ? 1 : 0,
        animation: isVisible ? 'arrowBounce 1.5s ease-out 0.3s infinite' : 'none'
      }}>
        <path d="M100,140 L100,175" stroke="#1a4731" strokeWidth="4" strokeLinecap="round"/>
        <path d="M88,163 L100,178 L112,163" fill="none" stroke="#1a4731" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
      </g>

      {/* Download base/device */}
      <g style={{ 
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 0.4s ease-out 0.5s'
      }}>
        <rect x="60" y="180" width="80" height="12" rx="3" fill="#1a4731"/>
        <rect x="70" y="176" width="60" height="8" rx="2" fill="#1a4731"/>
      </g>

      {/* Speed lines */}
      <g style={{ 
        opacity: isVisible ? 0.5 : 0,
        animation: isVisible ? 'speedLines 1.5s ease-out 0.3s infinite' : 'none'
      }}>
        <line x1="55" y1="95" x2="45" y2="95" stroke="#22c55e" strokeWidth="2" strokeLinecap="round"/>
        <line x1="55" y1="105" x2="40" y2="105" stroke="#22c55e" strokeWidth="2" strokeLinecap="round"/>
        <line x1="55" y1="115" x2="48" y2="115" stroke="#22c55e" strokeWidth="2" strokeLinecap="round"/>
        <line x1="145" y1="95" x2="155" y2="95" stroke="#22c55e" strokeWidth="2" strokeLinecap="round"/>
        <line x1="145" y1="105" x2="160" y2="105" stroke="#22c55e" strokeWidth="2" strokeLinecap="round"/>
        <line x1="145" y1="115" x2="152" y2="115" stroke="#22c55e" strokeWidth="2" strokeLinecap="round"/>
      </g>

      {/* Checkmark that appears */}
      <g style={{ 
        opacity: 0,
        animation: isVisible ? 'checkAppear 1.5s ease-out 0.3s infinite' : 'none'
      }}>
        <circle cx="130" cy="160" r="15" fill="#22c55e"/>
        <path d="M122,160 L128,167 L140,152" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
      </g>

      {/* Sparkles */}
      <g style={{ opacity: isVisible ? 1 : 0, transition: 'opacity 0.5s ease-out 0.8s' }}>
        <circle cx="45" cy="70" r="3" fill="#fbbf24" style={{ animation: isVisible ? 'sparkle 1.2s ease-in-out infinite' : 'none' }}/>
        <circle cx="160" cy="75" r="2.5" fill="#fbbf24" style={{ animation: isVisible ? 'sparkle 1.5s ease-in-out infinite 0.2s' : 'none' }}/>
        <circle cx="170" cy="140" r="2" fill="#fbbf24" style={{ animation: isVisible ? 'sparkle 1.3s ease-in-out infinite 0.4s' : 'none' }}/>
      </g>
    </svg>

    <style>{`
      @keyframes downloadSlide {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(15px); }
      }
      @keyframes arrowBounce {
        0%, 100% { transform: translateY(0); opacity: 1; }
        50% { transform: translateY(8px); opacity: 0.7; }
      }
      @keyframes speedLines {
        0%, 100% { opacity: 0; }
        40%, 60% { opacity: 0.6; }
      }
      @keyframes checkAppear {
        0%, 60% { opacity: 0; transform: scale(0); }
        70% { opacity: 1; transform: scale(1.2); }
        80%, 100% { opacity: 1; transform: scale(1); }
      }
      @keyframes sparkle {
        0%, 100% { opacity: 0.4; transform: scale(1); }
        50% { opacity: 1; transform: scale(1.4); }
      }
    `}</style>
  </div>
);

// No Data Stored Animation Component
const NoDataStoredAnimation = ({ isVisible }) => (
  <div className="relative w-full h-full flex items-center justify-center">
    <svg viewBox="0 0 200 200" className="w-full h-full max-w-xs">
      {/* Shield shape */}
      <g style={{ 
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'scale(1)' : 'scale(0.8)',
        transformOrigin: '100px 100px',
        transition: 'all 0.6s ease-out'
      }}>
        <path 
          d="M100,20 L160,45 L160,100 C160,140 130,170 100,185 C70,170 40,140 40,100 L40,45 Z" 
          fill="#fef2f2" 
          stroke="#ef4444" 
          strokeWidth="3"
        />
        {/* Shield inner glow */}
        <path 
          d="M100,35 L145,55 L145,100 C145,130 120,155 100,167 C80,155 55,130 55,100 L55,55 Z" 
          fill="#ffffff" 
          opacity="0.7"
        />
      </g>

      {/* Lock icon */}
      <g style={{ 
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(10px)',
        transition: 'all 0.5s ease-out 0.3s'
      }}>
        {/* Lock body */}
        <rect x="80" y="90" width="40" height="35" rx="5" fill="#dc2626"/>
        {/* Lock shackle */}
        <path 
          d="M85,90 L85,75 C85,60 115,60 115,75 L115,90" 
          fill="none" 
          stroke="#dc2626" 
          strokeWidth="6"
          strokeLinecap="round"
        />
        {/* Keyhole */}
        <circle cx="100" cy="102" r="6" fill="#ffffff"/>
        <rect x="97" y="105" width="6" height="12" rx="2" fill="#ffffff"/>
      </g>

      {/* Crossed out data/document */}
      <g style={{ 
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 0.4s ease-out 0.6s'
      }}>
        {/* Small document icon */}
        <rect x="145" y="60" width="30" height="40" rx="3" fill="#fecaca" stroke="#ef4444" strokeWidth="1.5"/>
        <line x1="150" y1="72" x2="170" y2="72" stroke="#ef4444" strokeWidth="1.5" opacity="0.5"/>
        <line x1="150" y1="80" x2="165" y2="80" stroke="#ef4444" strokeWidth="1.5" opacity="0.5"/>
        <line x1="150" y1="88" x2="168" y2="88" stroke="#ef4444" strokeWidth="1.5" opacity="0.5"/>
        {/* X over document */}
        <line x1="143" y1="55" x2="178" y2="105" stroke="#dc2626" strokeWidth="3" strokeLinecap="round"
          style={{
            strokeDasharray: 70,
            strokeDashoffset: isVisible ? 0 : 70,
            transition: 'stroke-dashoffset 0.5s ease-out 0.8s'
          }}/>
        <line x1="178" y1="55" x2="143" y2="105" stroke="#dc2626" strokeWidth="3" strokeLinecap="round"
          style={{
            strokeDasharray: 70,
            strokeDashoffset: isVisible ? 0 : 70,
            transition: 'stroke-dashoffset 0.5s ease-out 1s'
          }}/>
      </g>

      {/* Database icon crossed out */}
      <g style={{ 
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 0.4s ease-out 0.7s'
      }}>
        {/* Database shape */}
        <ellipse cx="40" cy="75" rx="18" ry="8" fill="#fecaca" stroke="#ef4444" strokeWidth="1.5"/>
        <path d="M22,75 L22,105 C22,113 58,113 58,105 L58,75" fill="#fecaca" stroke="#ef4444" strokeWidth="1.5"/>
        <ellipse cx="40" cy="90" rx="18" ry="5" fill="none" stroke="#ef4444" strokeWidth="1" opacity="0.5"/>
        {/* X over database */}
        <line x1="20" y1="65" x2="60" y2="115" stroke="#dc2626" strokeWidth="3" strokeLinecap="round"
          style={{
            strokeDasharray: 60,
            strokeDashoffset: isVisible ? 0 : 60,
            transition: 'stroke-dashoffset 0.5s ease-out 0.9s'
          }}/>
        <line x1="60" y1="65" x2="20" y2="115" stroke="#dc2626" strokeWidth="3" strokeLinecap="round"
          style={{
            strokeDasharray: 60,
            strokeDashoffset: isVisible ? 0 : 60,
            transition: 'stroke-dashoffset 0.5s ease-out 1.1s'
          }}/>
      </g>

      {/* Privacy checkmarks */}
      <g style={{ 
        opacity: 0,
        animation: isVisible ? 'fadeInCheck 0.4s ease-out 1.3s forwards' : 'none'
      }}>
        <circle cx="100" cy="155" r="12" fill="#22c55e"/>
        <path d="M94,155 L98,160 L108,148" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      </g>

      {/* "PRIVATE" badge */}
      <g style={{ 
        opacity: 0,
        animation: isVisible ? 'slideBadge 0.5s ease-out 1.5s forwards' : 'none'
      }}>
        <rect x="70" y="175" width="60" height="18" rx="9" fill="#1a4731"/>
        <text x="100" y="187" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="bold">PRIVATE</text>
      </g>

      {/* Floating secure icons */}
      <g style={{ opacity: isVisible ? 1 : 0, transition: 'opacity 0.5s ease-out 1.2s' }}>
        <circle cx="25" cy="140" r="3" fill="#22c55e" style={{ animation: isVisible ? 'float 2s ease-in-out infinite' : 'none' }}/>
        <circle cx="175" cy="145" r="2.5" fill="#22c55e" style={{ animation: isVisible ? 'float 2.5s ease-in-out infinite 0.3s' : 'none' }}/>
        <circle cx="170" cy="30" r="2" fill="#22c55e" style={{ animation: isVisible ? 'float 2.2s ease-in-out infinite 0.6s' : 'none' }}/>
      </g>
    </svg>

    <style>{`
      @keyframes fadeInCheck {
        0% { opacity: 0; transform: scale(0); }
        70% { transform: scale(1.2); }
        100% { opacity: 1; transform: scale(1); }
      }
      @keyframes slideBadge {
        0% { opacity: 0; transform: translateY(10px); }
        100% { opacity: 1; transform: translateY(0); }
      }
      @keyframes float {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-8px); }
      }
    `}</style>
  </div>
);

// Lightning Bolt Animation for "Fast Generation" feature
const LightningBoltAnimation = ({ isVisible }) => (
  <div className="relative w-full h-full flex items-center justify-center">
    <svg viewBox="0 0 200 200" className="w-full h-full max-w-xs">
      {/* Background circle with pulse */}
      <circle cx="100" cy="100" r="75" fill="#fef3c7" opacity="0.5"
        style={{ 
          animation: isVisible ? 'pulseBg 2s ease-in-out infinite' : 'none',
          transformOrigin: '100px 100px'
        }}/>
      
      {/* Inner glow circle */}
      <circle cx="100" cy="100" r="55" fill="#fef9c3" opacity="0.8"
        style={{ 
          opacity: isVisible ? 0.8 : 0,
          transition: 'opacity 0.5s ease-out'
        }}/>

      {/* Main Lightning Bolt */}
      <g style={{ 
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'scale(1) translateY(0)' : 'scale(0.5) translateY(-20px)',
        transformOrigin: '100px 100px',
        transition: 'all 0.6s ease-out 0.2s'
      }}>
        <path 
          d="M115,45 L85,95 L100,95 L75,155 L125,90 L105,90 L125,45 Z" 
          fill="#fbbf24" 
          stroke="#f59e0b" 
          strokeWidth="3"
          strokeLinejoin="round"
        />
        {/* Inner highlight */}
        <path 
          d="M110,55 L90,90 L100,90 L85,135 L115,95 L105,95 L115,55 Z" 
          fill="#fde68a" 
          opacity="0.6"
        />
      </g>

      {/* Electric sparks around bolt */}
      <g style={{ opacity: isVisible ? 1 : 0, transition: 'opacity 0.5s ease-out 0.8s' }}>
        {/* Left sparks */}
        <line x1="55" y1="80" x2="45" y2="75" stroke="#fbbf24" strokeWidth="3" strokeLinecap="round"
          style={{ animation: isVisible ? 'sparkFlash 0.8s ease-in-out infinite' : 'none' }}/>
        <line x1="50" y1="100" x2="38" y2="100" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round"
          style={{ animation: isVisible ? 'sparkFlash 0.8s ease-in-out infinite 0.2s' : 'none' }}/>
        <line x1="55" y1="120" x2="45" y2="125" stroke="#fbbf24" strokeWidth="3" strokeLinecap="round"
          style={{ animation: isVisible ? 'sparkFlash 0.8s ease-in-out infinite 0.4s' : 'none' }}/>
        
        {/* Right sparks */}
        <line x1="145" y1="80" x2="155" y2="75" stroke="#fbbf24" strokeWidth="3" strokeLinecap="round"
          style={{ animation: isVisible ? 'sparkFlash 0.8s ease-in-out infinite 0.1s' : 'none' }}/>
        <line x1="150" y1="100" x2="162" y2="100" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round"
          style={{ animation: isVisible ? 'sparkFlash 0.8s ease-in-out infinite 0.3s' : 'none' }}/>
        <line x1="145" y1="120" x2="155" y2="125" stroke="#fbbf24" strokeWidth="3" strokeLinecap="round"
          style={{ animation: isVisible ? 'sparkFlash 0.8s ease-in-out infinite 0.5s' : 'none' }}/>
      </g>

      {/* Small lightning bolts around */}
      <g style={{ opacity: 0, animation: isVisible ? 'fadeIn 0.4s ease-out 0.6s forwards' : 'none' }}>
        {/* Top left mini bolt */}
        <path d="M45,50 L40,60 L45,60 L38,72 L50,58 L45,58 L52,48 Z" fill="#fbbf24" opacity="0.7"
          style={{ animation: isVisible ? 'miniFloat 2s ease-in-out infinite' : 'none' }}/>
        {/* Top right mini bolt */}
        <path d="M155,55 L150,65 L155,65 L148,77 L160,63 L155,63 L162,53 Z" fill="#fbbf24" opacity="0.7"
          style={{ animation: isVisible ? 'miniFloat 2s ease-in-out infinite 0.5s' : 'none' }}/>
        {/* Bottom mini bolt */}
        <path d="M60,145 L55,155 L60,155 L53,167 L65,153 L60,153 L67,143 Z" fill="#fbbf24" opacity="0.6"
          style={{ animation: isVisible ? 'miniFloat 2.5s ease-in-out infinite 0.3s' : 'none' }}/>
      </g>

      {/* "INSTANT" badge */}
      <g style={{ opacity: 0, animation: isVisible ? 'bounceIn 0.5s ease-out 1s forwards' : 'none' }}>
        <rect x="55" y="170" width="90" height="24" rx="12" fill="#1a4731"/>
        <text x="100" y="186" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="bold">⚡ INSTANT</text>
      </g>

      {/* Sparkle dots */}
      <g style={{ opacity: isVisible ? 1 : 0, transition: 'opacity 0.5s ease-out 0.9s' }}>
        <circle cx="30" cy="90" r="3" fill="#fbbf24" style={{ animation: isVisible ? 'sparkle 1.2s ease-in-out infinite' : 'none' }}/>
        <circle cx="170" cy="95" r="2.5" fill="#fbbf24" style={{ animation: isVisible ? 'sparkle 1.5s ease-in-out infinite 0.2s' : 'none' }}/>
        <circle cx="140" cy="160" r="2" fill="#fbbf24" style={{ animation: isVisible ? 'sparkle 1.3s ease-in-out infinite 0.4s' : 'none' }}/>
        <circle cx="35" cy="140" r="2" fill="#22c55e" style={{ animation: isVisible ? 'sparkle 1.6s ease-in-out infinite 0.3s' : 'none' }}/>
      </g>
    </svg>

    <style>{`
      @keyframes pulseBg {
        0%, 100% { transform: scale(1); opacity: 0.5; }
        50% { transform: scale(1.05); opacity: 0.7; }
      }
      @keyframes sparkFlash {
        0%, 100% { opacity: 0.3; }
        50% { opacity: 1; }
      }
      @keyframes miniFloat {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-5px); }
      }
      @keyframes bounceIn {
        0% { opacity: 0; transform: scale(0); }
        60% { transform: scale(1.2); }
        100% { opacity: 1; transform: scale(1); }
      }
      @keyframes fadeIn {
        0% { opacity: 0; }
        100% { opacity: 1; }
      }
      @keyframes sparkle {
        0%, 100% { opacity: 0.4; transform: scale(1); }
        50% { opacity: 1; transform: scale(1.4); }
      }
    `}</style>
  </div>
);

// Comparison Table Feature Item Component
const FeatureRow = ({ feature, mintslip, others, isVisible, delay }) => (
  <div 
    className="grid grid-cols-3 gap-4 py-4 border-b border-slate-100 items-center"
    style={{
      opacity: isVisible ? 1 : 0,
      transform: isVisible ? 'translateX(0)' : 'translateX(-20px)',
      transition: `all 0.4s ease-out ${delay}s`
    }}
  >
    <div className="text-slate-700 font-medium flex items-center gap-2">
      {feature.icon && <feature.icon className="w-4 h-4 text-slate-500" />}
      {feature.name}
    </div>
    <div className="flex items-center justify-center">
      {mintslip === true ? (
        <div className="flex items-center gap-2 text-green-600">
          <CheckCircle className="w-5 h-5" />
          <span className="hidden md:inline text-sm font-medium">Yes</span>
        </div>
      ) : mintslip === false ? (
        <div className="flex items-center gap-2 text-slate-400">
          <XCircle className="w-5 h-5" />
          <span className="hidden md:inline text-sm">No</span>
        </div>
      ) : (
        <span className="text-green-600 font-semibold text-sm">{mintslip}</span>
      )}
    </div>
    <div className="flex items-center justify-center">
      {others === true ? (
        <div className="flex items-center gap-2 text-green-600">
          <CheckCircle className="w-5 h-5" />
          <span className="hidden md:inline text-sm font-medium">Yes</span>
        </div>
      ) : others === false ? (
        <div className="flex items-center gap-2 text-slate-400">
          <XCircle className="w-5 h-5" />
          <span className="hidden md:inline text-sm">No</span>
        </div>
      ) : (
        <span className="text-slate-500 text-sm">{others}</span>
      )}
    </div>
  </div>
);

export default function ComparisonPage() {
  const navigate = useNavigate();
  const [heroRef, heroInView] = useInView();
  const [tableRef, tableInView] = useInView();
  const [cardsRef, cardsInView] = useInView();
  const [featuresRef, featuresInView] = useInView();

  const comparisonFeatures = [
    { name: "Instant PDF Download", icon: Download, mintslip: true, others: "Sometimes" },
    { name: "No Registration Required", icon: Users, mintslip: true, others: false },
    { name: "Professional Templates", icon: FileText, mintslip: "7+ Templates", others: "1-2 Templates" },
    { name: "Real-Time Preview", icon: Eye, mintslip: true, others: false },
    { name: "Mobile Friendly", icon: Smartphone, mintslip: true, others: "Limited" },
    { name: "Secure Payment (PayPal)", icon: CreditCard, mintslip: true, others: "Varies" },
    { name: "No Data Storage", icon: Lock, mintslip: true, others: false },
    { name: "Auto Tax Calculations", icon: Zap, mintslip: true, others: "Manual" },
    { name: "YTD Calculations", icon: Clock, mintslip: true, others: false },
    { name: "Customer Support", icon: Users, mintslip: "24/7", others: "Limited" },
    { name: "Contractor/1099 Support", icon: FileText, mintslip: true, others: false },
    { name: "Canadian Paystubs", icon: FileText, mintslip: true, others: false },
  ];

  const highlights = [
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Generate professional paystubs in under 2 minutes. No waiting, no delays."
    },
    {
      icon: Shield,
      title: "100% Secure",
      description: "We don't store your personal data. Your privacy is our priority."
    },
    {
      icon: Award,
      title: "Professional Quality",
      description: "Industry-standard templates designed for clarity and accuracy."
    },
    {
      icon: Users,
      title: "No Sign-Up",
      description: "Start generating immediately without creating an account."
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>MintSlip vs Other Paystub Generators | Feature Comparison</title>
        <meta name="description" content="Compare MintSlip with other paystub generators. See why MintSlip offers faster generation, more templates, better privacy, and professional quality documents." />
        <meta name="keywords" content="paystub generator comparison, best paystub generator, MintSlip vs competitors, paystub maker comparison" />
        <meta property="og:title" content="MintSlip vs Other Paystub Generators" />
        <meta property="og:description" content="See why thousands choose MintSlip for professional paystub generation. Compare features, speed, and quality." />
        <link rel="canonical" href="https://mintslip.com/mintslip-vs-other-paystub-generators" />
      </Helmet>

      <Header title="MintSlip" />

      {/* Hero Section */}
      <section ref={heroRef} className="relative py-16 md:py-24 bg-gradient-to-br from-slate-50 to-green-50 overflow-hidden">
        {/* Background Decorations */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-green-100 rounded-full filter blur-3xl opacity-30 animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-emerald-100 rounded-full filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '1s' }} />
        
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left side - Text content */}
            <div 
              className="space-y-6"
              style={{
                opacity: heroInView ? 1 : 0,
                transform: heroInView ? 'translateX(0)' : 'translateX(-30px)',
                transition: 'all 0.6s ease-out'
              }}
            >
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-green-200 shadow-sm">
                <Sparkles className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">Feature Comparison</span>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight" style={{ fontFamily: 'Outfit, sans-serif', lineHeight: '1.1' }}>
                <span className="text-slate-800">MintSlip</span>
                <span className="block text-green-700">vs</span>
                <span className="block text-slate-800">Other Paystub</span>
                <span className="block text-slate-800">Generators</span>
              </h1>

              <p className="text-lg text-slate-600 leading-relaxed max-w-lg">
                See why thousands of users choose MintSlip for their professional document needs. Compare features, speed, and quality side by side.
              </p>

              <div className="flex flex-wrap gap-4">
                <Button
                  onClick={() => navigate("/paystub-generator")}
                  size="lg"
                  className="gap-2 px-8 py-6 bg-gradient-to-r from-green-700 to-emerald-600 hover:from-green-800 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all"
                >
                  <FileText className="w-5 h-5" />
                  Create a Paystub
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>

              {/* Trust badges */}
              <div className="flex items-center gap-4 pt-4">
                <div className="flex -space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  ))}
                </div>
                <span className="text-sm text-slate-600">Trusted by 10,000+ users</span>
              </div>
            </div>

            {/* Right side - VS Animation */}
            <div 
              className="flex justify-center items-center"
              style={{
                opacity: heroInView ? 1 : 0,
                transform: heroInView ? 'translateX(0)' : 'translateX(30px)',
                transition: 'all 0.6s ease-out 0.2s'
              }}
            >
              <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
                <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl h-64 md:h-80 flex items-center justify-center">
                  <VsComparisonAnimation isVisible={heroInView} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section ref={featuresRef} className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 
              className="text-3xl md:text-4xl font-black mb-4"
              style={{ 
                fontFamily: 'Outfit, sans-serif',
                opacity: featuresInView ? 1 : 0,
                transform: featuresInView ? 'translateY(0)' : 'translateY(20px)',
                transition: 'all 0.5s ease-out'
              }}
            >
              Why MintSlip <span className="text-green-700">Stands Out</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {highlights.map((item, index) => (
              <div 
                key={index}
                className="bg-slate-50 rounded-xl p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                style={{
                  opacity: featuresInView ? 1 : 0,
                  transform: featuresInView ? 'translateY(0)' : 'translateY(20px)',
                  transition: `all 0.5s ease-out ${0.1 * index}s`
                }}
              >
                <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center mb-4">
                  <item.icon className="w-6 h-6 text-green-700" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  {item.title}
                </h3>
                <p className="text-sm text-slate-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section ref={tableRef} className="py-16 bg-slate-50">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 
              className="text-3xl md:text-4xl font-black mb-4"
              style={{ 
                fontFamily: 'Outfit, sans-serif',
                opacity: tableInView ? 1 : 0,
                transform: tableInView ? 'translateY(0)' : 'translateY(20px)',
                transition: 'all 0.5s ease-out'
              }}
            >
              Feature <span className="text-green-700">Comparison</span>
            </h2>
            <p 
              className="text-slate-600"
              style={{
                opacity: tableInView ? 1 : 0,
                transition: 'opacity 0.5s ease-out 0.2s'
              }}
            >
              See how MintSlip compares to typical paystub generators
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-3 gap-4 p-4 bg-slate-800 text-white">
              <div className="font-semibold">Feature</div>
              <div className="text-center font-semibold flex items-center justify-center gap-2">
                <span className="inline-block w-3 h-3 rounded-full bg-green-500"></span>
                MintSlip
              </div>
              <div className="text-center font-semibold flex items-center justify-center gap-2">
                <span className="inline-block w-3 h-3 rounded-full bg-slate-400"></span>
                Others
              </div>
            </div>

            {/* Table Body */}
            <div className="p-4">
              {comparisonFeatures.map((feature, index) => (
                <FeatureRow 
                  key={index}
                  feature={feature}
                  mintslip={feature.mintslip}
                  others={feature.others}
                  isVisible={tableInView}
                  delay={0.1 + (index * 0.05)}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Animated Feature Cards */}
      <section ref={cardsRef} className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 
              className="text-3xl md:text-4xl font-black mb-4"
              style={{ 
                fontFamily: 'Outfit, sans-serif',
                opacity: cardsInView ? 1 : 0,
                transform: cardsInView ? 'translateY(0)' : 'translateY(20px)',
                transition: 'all 0.5s ease-out'
              }}
            >
              What Makes Us <span className="text-green-700">Different</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Speed Card */}
            <div 
              className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-8 text-center"
              style={{
                opacity: cardsInView ? 1 : 0,
                transform: cardsInView ? 'translateY(0)' : 'translateY(30px)',
                transition: 'all 0.6s ease-out'
              }}
            >
              <h3 className="text-2xl font-black mb-2 text-slate-800" style={{ fontFamily: 'Outfit, sans-serif' }}>
                Blazing Fast
              </h3>
              <p className="text-slate-600 mb-6">Generate documents in under 2 minutes</p>
              <div className="h-48">
                <LightningBoltAnimation isVisible={cardsInView} />
              </div>
            </div>

            {/* Instant Download Card */}
            <div 
              className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8 text-center"
              style={{
                opacity: cardsInView ? 1 : 0,
                transform: cardsInView ? 'translateY(0)' : 'translateY(30px)',
                transition: 'all 0.6s ease-out 0.1s'
              }}
            >
              <h3 className="text-2xl font-black mb-2 text-slate-800" style={{ fontFamily: 'Outfit, sans-serif' }}>
                Instant Download
              </h3>
              <p className="text-slate-600 mb-6">Get your PDF immediately after creation</p>
              <div className="h-48">
                <InstantDownloadAnimation isVisible={cardsInView} />
              </div>
            </div>

            {/* Privacy Card */}
            <div 
              className="bg-gradient-to-br from-red-50 to-rose-50 rounded-2xl p-8 text-center"
              style={{
                opacity: cardsInView ? 1 : 0,
                transform: cardsInView ? 'translateY(0)' : 'translateY(30px)',
                transition: 'all 0.6s ease-out 0.2s'
              }}
            >
              <h3 className="text-2xl font-black mb-2 text-slate-800" style={{ fontFamily: 'Outfit, sans-serif' }}>
                No Data Stored
              </h3>
              <p className="text-slate-600 mb-6">Your information stays private</p>
              <div className="h-48">
                <NoDataStoredAnimation isVisible={cardsInView} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-green-800 to-emerald-900">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-black text-white mb-6" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Ready to Experience the Difference?
          </h2>
          <p className="text-green-100 text-lg mb-8 max-w-2xl mx-auto">
            Join thousands of satisfied users who choose MintSlip for fast, secure, and professional document generation.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => navigate("/paystub-generator")}
              size="lg"
              className="gap-2 px-8 py-6 bg-white text-green-800 hover:bg-green-50 shadow-lg hover:shadow-xl transition-all"
            >
              <FileText className="w-5 h-5" />
              Create Pay Stub Now
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button
              onClick={() => navigate("/")}
              size="lg"
              variant="outline"
              className="gap-2 px-8 py-6 border-2 border-white text-white hover:bg-white/10 transition-all"
            >
              View All Documents
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { Helmet } from "react-helmet-async";
import { FileText, FileBarChart, CheckCircle, Shield, Clock, PiggyBank, Calendar, Receipt, ArrowRight, ArrowUp, Sparkles, Zap, MessageCircle, ClipboardList, Users, Landmark, Mail, Car, MapPin, TreePine, Eye, Download, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MintSlipLogo from '../assests/mintslip-logo.png';
import EmilyPhoto from '../assests/images/Emily.png';
import JakePhoto from '../assests/images/Jake.png';
import KevinPhoto from '../assests/images/Kevin.png';
import SophiaPhoto from '../assests/images/Sophia.png';
import LeftLeaf from '../assests/images/left-leaf.avif';
import RightLeaf from '../assests/images/right-leaf.avif';

// Rotating hero word: flips out, swaps, flips back in on a loop
const FLIP_WORDS = ["Paystubs", "Tax Forms", "Resumes", "Documents"];
const FlipWord = () => {
  const [idx, setIdx] = useState(0);
  const [flipping, setFlipping] = useState(false);

  useEffect(() => {
    const cycle = setInterval(() => {
      setFlipping(true);
      setTimeout(() => {
        setIdx(i => (i + 1) % FLIP_WORDS.length);
        setFlipping(false);
      }, 250);
    }, 2600);
    return () => clearInterval(cycle);
  }, []);

  return (
    <span className="flip-word">
      <span key={idx} className={`flip-word-inner${flipping ? " is-out" : ""}`}>
        {FLIP_WORDS[idx]}
      </span>
    </span>
  );
};

// Telegram icon SVG component
const TelegramIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
  </svg>
);

// Instant Paystub Generation Animation Component
const EnvelopeAnimation = ({ isVisible }) => (
  <div className="relative w-full h-full flex items-center justify-center">
    <svg viewBox="0 0 280 240" className="w-full h-full max-w-md">
      {/* Background circle pulse */}
      <circle cx="140" cy="120" r="100" fill="#d1fae5" opacity="0.3"
        style={{ 
          animation: isVisible ? 'pulse 2s ease-in-out infinite' : 'none',
          transformOrigin: '140px 120px'
        }}/>

      {/* Input form (left side) */}
      <g style={{ 
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateX(0)' : 'translateX(-30px)',
        transition: 'all 0.5s ease-out'
      }}>
        <rect x="20" y="60" width="70" height="90" rx="6" fill="#ffffff" stroke="#1a4731" strokeWidth="2"/>
        <rect x="20" y="60" width="70" height="20" rx="6" fill="#1a4731"/>
        <text x="55" y="74" textAnchor="middle" fill="#ffffff" fontSize="7" fontWeight="bold">INPUT</text>
        {/* Form fields */}
        <rect x="28" y="88" width="54" height="8" rx="2" fill="#f1f5f9" stroke="#e2e8f0" strokeWidth="1"/>
        <rect x="28" y="102" width="54" height="8" rx="2" fill="#f1f5f9" stroke="#e2e8f0" strokeWidth="1"/>
        <rect x="28" y="116" width="40" height="8" rx="2" fill="#f1f5f9" stroke="#e2e8f0" strokeWidth="1"/>
        <rect x="28" y="130" width="48" height="8" rx="2" fill="#f1f5f9" stroke="#e2e8f0" strokeWidth="1"/>
        {/* Typing cursor animation */}
        <rect x="50" y="90" width="2" height="5" fill="#1a4731"
          style={{ animation: isVisible ? 'blink 0.8s infinite 0.5s' : 'none' }}/>
      </g>

      {/* Arrow 1 - Input to Processing */}
      <g style={{ 
        opacity: 0,
        animation: isVisible ? 'fadeIn 0.3s ease-out 0.6s forwards' : 'none'
      }}>
        <path d="M95,105 L115,105" stroke="#1a4731" strokeWidth="2" strokeLinecap="round"
          style={{ strokeDasharray: 20, strokeDashoffset: isVisible ? 0 : 20, transition: 'stroke-dashoffset 0.4s ease-out 0.6s' }}/>
        <path d="M112,100 L118,105 L112,110" fill="none" stroke="#1a4731" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </g>

      {/* Processing gear (center) */}
      <g style={{ 
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 0.4s ease-out 0.8s'
      }}>
        <circle cx="140" cy="105" r="22" fill="#1a4731"/>
        {/* Gear teeth */}
        <g style={{ 
          transformOrigin: '140px 105px',
          animation: isVisible ? 'spin 2s linear infinite 1s' : 'none'
        }}>
          <rect x="136" y="80" width="8" height="10" rx="2" fill="#1a4731"/>
          <rect x="136" y="120" width="8" height="10" rx="2" fill="#1a4731"/>
          <rect x="115" y="101" width="10" height="8" rx="2" fill="#1a4731"/>
          <rect x="155" y="101" width="10" height="8" rx="2" fill="#1a4731"/>
          <rect x="119" y="85" width="8" height="8" rx="2" fill="#1a4731" transform="rotate(45 123 89)"/>
          <rect x="153" y="85" width="8" height="8" rx="2" fill="#1a4731" transform="rotate(45 157 89)"/>
          <rect x="119" y="117" width="8" height="8" rx="2" fill="#1a4731" transform="rotate(45 123 121)"/>
          <rect x="153" y="117" width="8" height="8" rx="2" fill="#1a4731" transform="rotate(45 157 121)"/>
        </g>
        <circle cx="140" cy="105" r="12" fill="#ffffff"/>
        <text x="140" y="109" textAnchor="middle" fill="#1a4731" fontSize="8" fontWeight="bold">⚡</text>
      </g>

      {/* Arrow 2 - Processing to Output */}
      <g style={{ 
        opacity: 0,
        animation: isVisible ? 'fadeIn 0.3s ease-out 1.2s forwards' : 'none'
      }}>
        <path d="M165,105 L185,105" stroke="#1a4731" strokeWidth="2" strokeLinecap="round"
          style={{ strokeDasharray: 20, strokeDashoffset: isVisible ? 0 : 20, transition: 'stroke-dashoffset 0.4s ease-out 1.2s' }}/>
        <path d="M182,100 L188,105 L182,110" fill="none" stroke="#1a4731" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </g>

      {/* Output paystub (right side) */}
      <g style={{ 
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateX(0) scale(1)' : 'translateX(30px) scale(0.9)',
        transition: 'all 0.6s ease-out 1.4s'
      }}>
        <rect x="195" y="50" width="75" height="110" rx="6" fill="#ffffff" stroke="#10b981" strokeWidth="3" filter="url(#glowGreen)"/>
        <rect x="195" y="50" width="75" height="22" rx="6" fill="#1a4731"/>
        <text x="232" y="65" textAnchor="middle" fill="#ffffff" fontSize="7" fontWeight="bold">PAYSTUB</text>
        {/* Paystub content lines */}
        <line x1="203" y1="82" x2="262" y2="82" stroke="#1a4731" strokeWidth="1.5" opacity="0.7"
          style={{ strokeDasharray: 60, strokeDashoffset: isVisible ? 0 : 60, transition: 'stroke-dashoffset 0.3s ease-out 1.6s' }}/>
        <line x1="203" y1="94" x2="250" y2="94" stroke="#1a4731" strokeWidth="1.5" opacity="0.5"
          style={{ strokeDasharray: 50, strokeDashoffset: isVisible ? 0 : 50, transition: 'stroke-dashoffset 0.3s ease-out 1.7s' }}/>
        <line x1="203" y1="106" x2="255" y2="106" stroke="#1a4731" strokeWidth="1.5" opacity="0.5"
          style={{ strokeDasharray: 55, strokeDashoffset: isVisible ? 0 : 55, transition: 'stroke-dashoffset 0.3s ease-out 1.8s' }}/>
        {/* Amount box */}
        <rect x="203" y="118" width="62" height="18" rx="3" fill="#d1fae5" stroke="#10b981" strokeWidth="1"
          style={{ opacity: 0, animation: isVisible ? 'fadeIn 0.3s ease-out 1.9s forwards' : 'none' }}/>
        <text x="234" y="131" textAnchor="middle" fill="#065f46" fontSize="9" fontWeight="bold"
          style={{ opacity: 0, animation: isVisible ? 'fadeIn 0.3s ease-out 2s forwards' : 'none' }}>$2,450.00</text>
        {/* Checkmark badge */}
        <g style={{ opacity: 0, animation: isVisible ? 'bounceIn 0.5s ease-out 2.1s forwards' : 'none' }}>
          <circle cx="262" cy="58" r="12" fill="#10b981" stroke="#ffffff" strokeWidth="2"/>
          <path d="M256,58 L260,63 L270,52" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        </g>
      </g>

      {/* "INSTANT" badge */}
      <g style={{ opacity: 0, animation: isVisible ? 'slideUp 0.4s ease-out 2.3s forwards' : 'none' }}>
        <rect x="105" y="165" width="70" height="24" rx="12" fill="#1a4731"/>
        <text x="140" y="181" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="bold">⚡ INSTANT</text>
      </g>

      {/* Time indicator */}
      <g style={{ opacity: 0, animation: isVisible ? 'fadeIn 0.4s ease-out 2.5s forwards' : 'none' }}>
        <circle cx="140" cy="210" r="15" fill="#fef3c7" stroke="#f59e0b" strokeWidth="2"/>
        <text x="140" y="214" textAnchor="middle" fill="#92400e" fontSize="8" fontWeight="bold">2min</text>
      </g>

      {/* Sparkles */}
      <g style={{ opacity: isVisible ? 1 : 0, transition: 'opacity 0.5s ease-out 2.2s' }}>
        <circle cx="270" cy="40" r="3" fill="#fbbf24" style={{ animation: isVisible ? 'sparkle 1.5s ease-in-out infinite 2.2s' : 'none' }}/>
        <circle cx="20" cy="170" r="2.5" fill="#fbbf24" style={{ animation: isVisible ? 'sparkle 1.8s ease-in-out infinite 2.4s' : 'none' }}/>
        <circle cx="275" cy="150" r="2" fill="#fbbf24" style={{ animation: isVisible ? 'sparkle 1.6s ease-in-out infinite 2.6s' : 'none' }}/>
        <circle cx="100" cy="40" r="2.5" fill="#10b981" style={{ animation: isVisible ? 'sparkle 2s ease-in-out infinite 2.3s' : 'none' }}/>
      </g>

      {/* Flow lines connecting everything */}
      <g style={{ opacity: 0, animation: isVisible ? 'fadeIn 0.5s ease-out 0.4s forwards' : 'none' }}>
        <path d="M55,155 Q55,175 80,175 Q100,175 120,165" fill="none" stroke="#10b981" strokeWidth="1.5" strokeDasharray="4 2" opacity="0.4"/>
        <path d="M225,165 Q240,175 255,175 Q270,175 270,190" fill="none" stroke="#10b981" strokeWidth="1.5" strokeDasharray="4 2" opacity="0.4"/>
      </g>

      {/* SVG filter for glow effect */}
      <defs>
        <filter id="glowGreen" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
    </svg>

    <style>{`
      @keyframes pulse {
        0%, 100% { transform: scale(1); opacity: 0.3; }
        50% { transform: scale(1.1); opacity: 0.5; }
      }
      @keyframes blink {
        0%, 50% { opacity: 1; }
        51%, 100% { opacity: 0; }
      }
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      @keyframes fadeIn {
        0% { opacity: 0; }
        100% { opacity: 1; }
      }
      @keyframes slideUp {
        0% { opacity: 0; transform: translateY(10px); }
        100% { opacity: 1; transform: translateY(0); }
      }
      @keyframes bounceIn {
        0% { opacity: 0; transform: scale(0); }
        60% { transform: scale(1.2); }
        100% { opacity: 1; transform: scale(1); }
      }
      @keyframes sparkle {
        0%, 100% { opacity: 0.4; transform: scale(1); }
        50% { opacity: 1; transform: scale(1.5); }
      }
    `}</style>
  </div>
);

// Why Choose Us Animation - Comparison Animation Component
const SpeedServiceAnimation = ({ isVisible }) => (
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
        <rect x="185" y="115" width="70" height="20" rx="3" fill="#d1fae5" stroke="#10b981" strokeWidth="1"
          style={{ opacity: 0, animation: isVisible ? 'fadeIn 0.4s ease-out 1s forwards' : 'none' }}/>
        <text x="220" y="129" textAnchor="middle" fill="#065f46" fontSize="10" fontWeight="bold"
          style={{ opacity: 0, animation: isVisible ? 'fadeIn 0.4s ease-out 1.1s forwards' : 'none' }}>$2,450.00</text>
        {/* MINTSLIP label */}
        <rect x="185" y="165" width="70" height="18" rx="4" fill="#1a4731"
          style={{ opacity: 0, animation: isVisible ? 'slideUp 0.4s ease-out 0.5s forwards' : 'none' }}/>
        <text x="220" y="178" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="bold"
          style={{ opacity: 0, animation: isVisible ? 'slideUp 0.4s ease-out 0.5s forwards' : 'none' }}>MINTSLIP</text>
        {/* Checkmark */}
        <g style={{ opacity: 0, animation: isVisible ? 'bounceIn 0.5s ease-out 1.2s forwards' : 'none' }}>
          <circle cx="220" cy="95" r="18" fill="#10b981"/>
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
          <rect x="230" y="15" width="48" height="20" rx="10" fill="#10b981"/>
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

// Instant Download Animation Component - for "Instant Download" card
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
        <line x1="55" y1="95" x2="45" y2="95" stroke="#10b981" strokeWidth="2" strokeLinecap="round"/>
        <line x1="55" y1="105" x2="40" y2="105" stroke="#10b981" strokeWidth="2" strokeLinecap="round"/>
        <line x1="55" y1="115" x2="48" y2="115" stroke="#10b981" strokeWidth="2" strokeLinecap="round"/>
        <line x1="145" y1="95" x2="155" y2="95" stroke="#10b981" strokeWidth="2" strokeLinecap="round"/>
        <line x1="145" y1="105" x2="160" y2="105" stroke="#10b981" strokeWidth="2" strokeLinecap="round"/>
        <line x1="145" y1="115" x2="152" y2="115" stroke="#10b981" strokeWidth="2" strokeLinecap="round"/>
      </g>

      {/* Checkmark that appears */}
      <g style={{ 
        opacity: 0,
        animation: isVisible ? 'checkAppear 1.5s ease-out 0.3s infinite' : 'none'
      }}>
        <circle cx="130" cy="160" r="15" fill="#10b981"/>
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

// No Data Stored Animation Component - for "No Data Stored" card  
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
        <circle cx="100" cy="155" r="12" fill="#10b981"/>
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
        <circle cx="25" cy="140" r="3" fill="#10b981" style={{ animation: isVisible ? 'float 2s ease-in-out infinite' : 'none' }}/>
        <circle cx="175" cy="145" r="2.5" fill="#10b981" style={{ animation: isVisible ? 'float 2.5s ease-in-out infinite 0.3s' : 'none' }}/>
        <circle cx="170" cy="30" r="2" fill="#10b981" style={{ animation: isVisible ? 'float 2.2s ease-in-out infinite 0.6s' : 'none' }}/>
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

// Testimonials — social proof for the trust section (replaces the old
// Secure & Instant animation). Portraits are the same ones the paywall uses.
const HOME_TESTIMONIALS = [
  {
    img: JakePhoto,
    name: "Jake",
    city: "Dallas, TX",
    quote: "I needed proof of income for an apartment and didn't have a ton of options. MintSlip worked — clean, accurate stubs in under five minutes.",
  },
  {
    img: SophiaPhoto,
    name: "Sophia",
    city: "Phoenix, AZ",
    quote: "Every time I needed a document it was just there — paystubs, W-2s, even my offer letter. Everything matched perfectly and looked completely professional.",
  },
  {
    img: EmilyPhoto,
    name: "Emily",
    city: "Atlanta, GA",
    quote: "i couldn't find my old stubs to save my life n MintSlip let me remake them in like 2 minutes. def worked for me!!!! thank yoouuuu",
    stars: true,
  },
  {
    img: KevinPhoto,
    name: "Kevin",
    city: "Chicago, IL",
    quote: "My lender wanted two months of pay stubs.... I had them done the same afternoon. Don't even think about it, just use it.",
  },
];

const TestimonialCard = ({ t, inView, delay }) => (
  <div
    className={`bg-white border border-slate-200 rounded-2xl shadow-sm p-4 md:p-5 flex flex-col sm:flex-row items-center gap-5 md:gap-8 transition-all duration-700 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
    style={{ transitionDelay: `${delay}ms` }}
  >
    <img
      src={t.img}
      alt={`${t.name}, MintSlip customer`}
      className="w-full sm:w-44 md:w-52 aspect-square rounded-xl object-cover flex-shrink-0"
    />
    <div className="flex-1 text-center px-1 sm:pr-4">
      <p className="text-slate-600 leading-relaxed">{t.quote}</p>
      {t.stars && (
        <div className="mt-2 text-xl tracking-wide" role="img" aria-label="Rated 5 out of 5 stars">
          ⭐⭐⭐⭐⭐
        </div>
      )}
      <p className="mt-4 font-bold" style={{ color: '#1a4731' }}>{t.name}</p>
      <p className="text-slate-600">{t.city}</p>
    </div>
  </div>
);

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

// FAQs shown on the landing page Ã¢â‚¬” content mirrors the /faq page verbatim.
const LANDING_FAQS = [
  {
    question: "How will I receive my documents?",
    answer: "After completing your purchase, your documents will be automatically downloaded to your computer as a PDF file. The download happens instantly after payment confirmation - no waiting required!",
  },
  {
    question: "How long does it take to create a document?",
    answer: "It only takes a few minutes to create a document with our generator. Simply enter your information, preview your document, complete payment, and download instantly. Our system automatically calculates taxes and formats everything professionally.",
  },
  {
    question: "Will my information be safe on this site?",
    answer: "Absolutely! We prioritize your privacy and security. All documents are generated directly in your browser - we do not store your personal information on our servers. Your data stays on your device and is never transmitted to third parties.",
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept all major payment methods through Stripe, including credit cards (Visa, Mastercard, American Express, Discover), debit cards, Apple Pay, and Google Pay. All payments are processed securely.",
  },
  {
    question: "Is there a charge to remove the watermark?",
    answer: "No, there's no additional charge. The watermark appears on the preview only. Once you complete your purchase, your downloaded document will not have any watermark.",
  },
  {
    question: "Can I create documents from my mobile device?",
    answer: "Yes! Our website is fully responsive and works on all devices including smartphones and tablets. You can create and download your documents on any device with a modern web browser.",
  },
];

// Product mockup for the hero: a browser window running the paystub generator
// with a live preview, built from plain markup so it stays lightweight.
function HeroProductPreview() {
  const fieldRow = (label, filled, focused) => (
    <div>
      <div className="text-[10px] font-medium text-slate-500 mb-1">{label}</div>
      <div className={`h-7 rounded-md border px-2 flex items-center ${focused ? "border-emerald-600 ring-2 ring-emerald-100 bg-white" : "border-slate-200 bg-slate-50"}`}>
        <div className={`h-1.5 rounded-full ${filled ? "bg-slate-300" : "bg-transparent"}`} style={{ width: filled }} />
      </div>
    </div>
  );

  return (
    <div className="relative mx-auto w-full max-w-xl lg:max-w-none select-none" aria-hidden="true">
      {/* Browser window */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-[0_32px_64px_-28px_rgba(16,63,40,0.28)] overflow-hidden">
        {/* Title bar */}
        <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-slate-100 bg-slate-50/80">
          <span className="w-2.5 h-2.5 rounded-full bg-red-300" />
          <span className="w-2.5 h-2.5 rounded-full bg-amber-300" />
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-300" />
          <div className="ml-3 h-6 flex-1 max-w-[210px] rounded-md bg-white border border-slate-200 flex items-center gap-1.5 px-2.5">
            <Lock className="w-2.5 h-2.5 text-emerald-700" />
            <span className="text-[10px] text-slate-500 tracking-wide">mintslip.com/paystub-generator</span>
          </div>
        </div>
        {/* App body */}
        <div className="grid grid-cols-5">
          {/* Form column */}
          <div className="col-span-2 p-4 space-y-3 border-r border-slate-100">
            <div className="flex items-center gap-1.5">
              <Receipt className="w-3.5 h-3.5 text-emerald-700" />
              <span className="text-[11px] font-semibold text-slate-800">Pay Stub Details</span>
            </div>
            {fieldRow("Company name", "80%")}
            {fieldRow("Employee name", "65%")}
            {fieldRow("Hourly rate", "40%", true)}
            {fieldRow("Pay period", "55%")}
            <div className="h-8 rounded-lg bg-emerald-700 text-white text-[11px] font-semibold flex items-center justify-center gap-1.5 shadow-sm">
              Generate Pay Stub
              <ArrowRight className="w-3 h-3" />
            </div>
          </div>
          {/* Live preview column */}
          <div className="col-span-3 bg-slate-100/70 p-4 sm:p-5">
            <div className="rounded-lg bg-white border border-slate-200 shadow-sm overflow-hidden">
              <div className="bg-emerald-800 px-3 py-2 flex items-center justify-between">
                <span className="text-[10px] font-bold tracking-widest text-white">MINTSLIP CORP.</span>
                <span className="text-[9px] text-emerald-200">EARNINGS STATEMENT</span>
              </div>
              <div className="p-3 space-y-2.5">
                <div className="flex justify-between gap-3">
                  <div className="space-y-1.5 flex-1">
                    <div className="h-1.5 w-3/4 rounded-full bg-slate-200" />
                    <div className="h-1.5 w-1/2 rounded-full bg-slate-100" />
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <div className="h-1.5 w-2/3 rounded-full bg-slate-200 ml-auto" />
                    <div className="h-1.5 w-1/2 rounded-full bg-slate-100 ml-auto" />
                  </div>
                </div>
                <div className="border-t border-slate-100 pt-2 space-y-1.5">
                  {["w-full", "w-11/12", "w-full", "w-10/12"].map((w, i) => (
                    <div key={i} className={`h-1.5 ${w} rounded-full ${i % 2 ? "bg-slate-100" : "bg-slate-200"}`} />
                  ))}
                </div>
                <div className="flex items-center justify-between rounded-md bg-emerald-50 border border-emerald-100 px-2.5 py-2">
                  <span className="text-[9px] font-semibold text-emerald-900 tracking-wide">NET PAY</span>
                  <span className="text-xs font-bold text-emerald-800">$2,847.50</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating chip: instant download */}
      <div className="absolute -bottom-6 left-2 sm:-left-6 bg-white rounded-xl border border-slate-200 shadow-lg px-3.5 py-2.5 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
          <Download className="w-4 h-4 text-emerald-700" />
        </div>
        <div className="leading-tight">
          <p className="text-[11px] font-semibold text-slate-800">paystub.pdf</p>
          <p className="text-[10px] text-slate-500">Downloaded instantly</p>
        </div>
        <CheckCircle className="w-4 h-4 text-emerald-600" />
      </div>

      {/* Floating chip: secure checkout */}
      <div className="absolute -top-4 right-2 sm:-right-4 bg-white rounded-xl border border-slate-200 shadow-lg px-3 py-2 flex items-center gap-2">
        <Shield className="w-3.5 h-3.5 text-emerald-700" />
        <span className="text-[11px] font-semibold text-slate-700">Secure checkout</span>
      </div>
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  // Hero stats are hardcoded (the live API numbers read too small)
  const userCount = "1,000+";

  // Animation on mount
  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Scroll to the section named in the URL hash (nav links from other pages
  // land here as /#how-it-works or /#faq)
  useEffect(() => {
    const id = window.location.hash.replace("#", "");
    if (!id) return;
    const t = setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    }, 300);
    return () => clearTimeout(t);
  }, []);

  const trustPoints = [
    { icon: CheckCircle, text: "Instant download" },
    { icon: Shield, text: "Secure payment" },
    { icon: Clock, text: "No sign-up required" },
  ];

  return (
    // overflow-x: clip contains the decorative blur circles without creating a
    // scroll container, so the sticky pill header keeps pinning on scroll
    // (overflow: hidden would break position: sticky).
    <div className="min-h-screen bg-white relative" style={{ overflowX: "clip" }}>
      <Helmet>
        <title>MintSlip - Professional Instant Paystub & Document Generator | Instant Download</title>
        <meta name="description" content="Generate professional pay stubs, W-2 forms, accountant mockups, 1099s, and more in minutes. No registration required. Trusted by 1,000+ users. Secure payment." />
        <meta name="keywords" content="paystub generator, pay stub maker, W-2 generator, accountant mockup generator, 1099 form, document generator, instant download" />
        <meta property="og:title" content="MintSlip - Professional Document Generator" />
        <meta property="og:description" content="Create professional pay stubs, tax forms, and budgeting documents instantly. No sign-up required." />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="MintSlip" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="MintSlip - Professional Document Generator" />
        <meta name="twitter:description" content="Generate pay stubs, W-2s, 1099s, and more in minutes. Instant download." />
        <link rel="canonical" href="https://mintslip.com" />
      </Helmet>
      
      <div className="noise-overlay" />
      
      <Header title="MintSlip" />

      {/* Hero Section */}
      <section className="relative max-w-7xl mx-auto px-6 pt-14 pb-20 md:pt-20 md:pb-28">
        {/* Background Decorations */}
        <div aria-hidden="true" className="absolute top-10 -left-32 w-96 h-96 bg-emerald-100/60 rounded-full filter blur-3xl pointer-events-none" />
        <div aria-hidden="true" className="absolute bottom-0 -right-32 w-[28rem] h-[28rem] bg-emerald-50 rounded-full filter blur-3xl pointer-events-none" />

        <div className={`relative grid grid-cols-1 lg:grid-cols-2 gap-14 lg:gap-16 items-center transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          {/* Left: copy */}
          <div className="text-center lg:text-left">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-emerald-50 rounded-full border border-emerald-200/80 mb-6">
              <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
              <span className="text-sm font-medium text-emerald-900">Trusted by {userCount} users</span>
              <div className="flex gap-0.5" aria-hidden="true">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} xmlns="http://www.w3.org/2000/svg" width="11" height="10" viewBox="0 0 27.39 25.547">
                    <path d="M88.4,376.72l3.246,9.758H102.1l-8.476,6.031,3.226,9.758L88.4,396.236l-8.456,6.031,3.226-9.758-8.456-6.031H85.169Z" transform="translate(-74.71 -376.72)" fill="#ffb600"/>
                  </svg>
                ))}
              </div>
            </div>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-[3.4rem] font-bold tracking-tight text-slate-900 mb-5" style={{ lineHeight: 1.1 }}>
              Generate Professional{' '}
              <span className="text-emerald-700"><FlipWord /></span>{' '}
              in Minutes
            </h1>
            <p className="text-lg md:text-xl leading-relaxed text-slate-600 max-w-xl mx-auto lg:mx-0 mb-8">
              Create accurate pay stubs, ATS-optimized resumes, W-2 forms, and more in minutes. No sign-up required.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <Button
                onClick={() => navigate("/app")}
                size="lg"
                className="cta-shine group gap-2 text-base px-7 py-6 rounded-xl bg-emerald-700 hover:bg-emerald-800 shadow-md shadow-emerald-900/10 hover:shadow-lg hover:shadow-emerald-900/15 transition-all duration-200"
              >
                <FileText className="w-5 h-5" />
                Create Pay Stub
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
              </Button>
              <Button
                onClick={() => navigate("/app/resumes")}
                size="lg"
                variant="outline"
                className="group gap-2 text-base px-7 py-6 rounded-xl border-slate-300 text-slate-700 hover:border-emerald-600 hover:text-emerald-800 hover:bg-emerald-50/60 transition-all duration-200"
              >
                <Sparkles className="w-5 h-5" />
                AI Resume Builder
              </Button>
            </div>

            {/* Trust indicators */}
            <ul className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-6 justify-center lg:justify-start">
              {trustPoints.map((point) => (
                <li key={point.text} className="flex items-center gap-1.5 text-sm text-slate-500">
                  <point.icon className="w-4 h-4 text-emerald-600" aria-hidden="true" />
                  {point.text}
                </li>
              ))}
            </ul>

            {/* Telegram Support link */}
            <a
              href="https://t.me/+oV7eIADvNlozYTYx"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-6 text-sm font-medium text-slate-500 hover:text-[#0088cc] transition-colors duration-200"
            >
              <TelegramIcon className="w-4 h-4" />
              <span>Join our Telegram support community</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Right: product preview */}
          <HeroProductPreview />
        </div>

      </section>

      {/* Most-loved laurel section: rotating stats between the leaf marks.
          The "Featured in" logo strip is intentionally hidden for now. */}
      {(() => {
        const [lovedRef, lovedInView] = useInView();
        const stats = [
          { big: "4.9", small: "App Store Rating" },
          { big: "1,000+", small: "User Reviews" },
          { big: "15+", small: "Document Types" },
          { big: "24/7", small: "Live Chat Support" },
        ];
        return (
          <section ref={lovedRef} className="bg-white py-20 md:py-24">
            <div className="max-w-[1288px] mx-auto px-6 text-center">
              <h2 className={`font-display text-4xl md:text-5xl lg:text-6xl tracking-tight text-slate-900 font-medium mb-6 transition-all duration-700 ${lovedInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
                The most-loved <span className="font-black">document generator</span>.
              </h2>
              <p className={`text-lg md:text-xl text-slate-600 max-w-2xl mx-auto mb-14 transition-all duration-700 delay-100 ${lovedInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
                We've helped thousands of people just like you take control of their paperwork.
              </p>

              <div className={`laurel-stats transition-all duration-700 delay-200 ${lovedInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
                <img src={LeftLeaf} alt="" aria-hidden="true" className="laurel-img" />
                <div className="laurel-ticker" aria-label="MintSlip highlights">
                  <div className="laurel-track">
                    {[...stats, stats[0]].map((s, i) => (
                      <div className="laurel-slide" key={i}>
                        <span className="laurel-big">{s.big}</span>
                        <span className="laurel-small">{s.small}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <img src={RightLeaf} alt="" aria-hidden="true" className="laurel-img" />
              </div>
            </div>

            <style>{`
              .laurel-stats {
                --laurel-slide-h: 130px;
                display: flex; align-items: center; justify-content: center; gap: 0;
              }
              .laurel-img { height: 215px; width: auto; flex-shrink: 0; }
              .laurel-ticker { height: var(--laurel-slide-h); min-width: 215px; overflow: hidden; }
              .laurel-track { display: flex; flex-direction: column; animation: laurelScroll 14s infinite; }
              .laurel-slide {
                height: var(--laurel-slide-h); flex-shrink: 0;
                display: flex; flex-direction: column; align-items: center; justify-content: center;
              }
              .laurel-big {
                font-family: 'Outfit', sans-serif; font-weight: 900;
                font-size: 56px; line-height: 1.05; color: #0f172a;
              }
              .laurel-small { margin-top: 4px; font-size: 17px; color: #475569; }
              @keyframes laurelScroll {
                0%, 21%   { transform: translateY(0); }
                25%, 46%  { transform: translateY(calc(var(--laurel-slide-h) * -1)); }
                50%, 71%  { transform: translateY(calc(var(--laurel-slide-h) * -2)); }
                75%, 96%  { transform: translateY(calc(var(--laurel-slide-h) * -3)); }
                100%      { transform: translateY(calc(var(--laurel-slide-h) * -4)); }
              }
              @media (max-width: 640px) {
                .laurel-stats { --laurel-slide-h: 104px; }
                .laurel-img { height: 155px; }
                .laurel-ticker { min-width: 165px; }
                .laurel-big { font-size: 42px; }
                .laurel-small { font-size: 15px; }
              }
              @media (prefers-reduced-motion: reduce) {
                .laurel-track { animation: none; }
              }
            `}</style>
          </section>
        );
      })()}

      {/* Build documents, fast. — Kikoff-style feature grid: black chart card
          with floating payroll-format chips, plus three stacked benefit cards
          (gray / mint / black) with white arrow circles. */}
      {(() => {
        const [buildRef, buildInView] = useInView();
        const card = (i) => `transition-all duration-700 ${buildInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`;
        const delay = (i) => ({ transitionDelay: `${i * 120}ms` });
        return (
          <section ref={buildRef} className="bg-white pb-20 md:pb-24">
            <div className="max-w-[1288px] mx-auto px-6">
              <h2 className={`font-display text-center text-4xl md:text-5xl lg:text-6xl tracking-tight text-slate-900 font-medium mb-12 transition-all duration-700 ${buildInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
                Build documents, <span className="font-black italic underline decoration-4 underline-offset-8">fast.</span>
              </h2>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
                {/* Left: black chart card */}
                <div className={`relative rounded-3xl bg-[#0b0b0b] p-6 md:p-9 flex flex-col ${card(0)}`} style={delay(0)}>
                  <div className="relative flex-1 min-h-[300px] md:min-h-[360px]">
                    <svg viewBox="0 0 400 320" className="absolute inset-0 w-full h-full" aria-hidden="true">
                      {/* Dotted gridlines */}
                      {[40, 72, 104, 136, 168, 200, 232, 264, 296, 328, 360].map((x) => (
                        <line key={x} x1={x} y1="16" x2={x} y2="304" stroke="#2c2c2c" strokeWidth="1.5" strokeDasharray="2 7" />
                      ))}
                      <defs>
                        <linearGradient id="mintStair" x1="0" y1="1" x2="1" y2="0">
                          <stop offset="0%" stopColor="#10b981" />
                          <stop offset="100%" stopColor="#34d399" />
                        </linearGradient>
                      </defs>
                      {/* 3D underside, then the mint staircase ribbon */}
                      <polygon
                        points="32,277 122,202 172,202 232,145 282,145 362,55 362,89 282,179 232,179 172,236 122,236 32,311"
                        fill="#065f46"
                      />
                      <polygon
                        points="25,270 115,195 165,195 225,138 275,138 355,48 355,82 275,172 225,172 165,229 115,229 25,304"
                        fill="url(#mintStair)"
                      />
                    </svg>
                    {/* Floating document-type chips */}
                    <div className="absolute left-1/2 top-[6%] -translate-x-[10%] bg-white rounded-xl shadow-lg px-5 py-3 font-display font-bold text-slate-900 text-base md:text-lg whitespace-nowrap">
                      Paystubs
                    </div>
                    <div className="absolute left-[5%] top-[34%] bg-white rounded-xl shadow-lg px-5 py-3 font-display font-bold text-slate-900 text-base md:text-lg whitespace-nowrap">
                      Tax Forms
                    </div>
                    <div className="absolute right-[4%] top-[56%] bg-white rounded-xl shadow-lg px-5 py-3 font-display font-bold text-slate-900 text-base md:text-lg whitespace-nowrap">
                      Business Docs
                    </div>
                    <div className="absolute left-[16%] top-[76%] bg-white rounded-xl shadow-lg px-5 py-3 font-display font-bold text-slate-900 text-base md:text-lg whitespace-nowrap">
                      Resumes
                    </div>
                  </div>
                  <p className="text-white text-center text-base md:text-lg font-medium leading-relaxed mt-6 max-w-md mx-auto">
                    MintSlip templates are modeled after <span className="text-emerald-400 font-bold">real payroll formats</span> with
                    accurate <span className="text-emerald-400 font-bold">taxes</span>, <span className="text-emerald-400 font-bold">deductions</span>,
                    and <span className="text-emerald-400 font-bold">year-to-date totals</span>.
                  </p>
                </div>

                {/* Right: stacked benefit cards */}
                <div className="flex flex-col gap-6">
                  <div className={`flex items-center gap-6 rounded-3xl bg-slate-100 p-7 md:p-8 flex-1 ${card(1)}`} style={delay(1)}>
                    <span className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-white shadow-sm flex items-center justify-center flex-shrink-0">
                      <ArrowUp className="w-7 h-7 text-slate-900" strokeWidth={2.5} />
                    </span>
                    <span>
                      <span className="font-display block text-2xl md:text-3xl font-medium text-slate-900 mb-1">Accurate calculations</span>
                      <span className="block text-slate-600 leading-relaxed">Taxes, deductions, and YTD totals are done for you — no math required.</span>
                    </span>
                  </div>
                  <div className={`flex items-center gap-6 rounded-3xl bg-emerald-400 p-7 md:p-8 flex-1 ${card(2)}`} style={delay(2)}>
                    <span className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-white shadow-sm flex items-center justify-center flex-shrink-0">
                      <ArrowUp className="w-7 h-7 text-slate-900" strokeWidth={2.5} />
                    </span>
                    <span>
                      <span className="font-display block text-2xl md:text-3xl font-medium text-emerald-950 mb-1">Instant download</span>
                      <span className="block text-emerald-900 leading-relaxed">Your PDF is generated and ready the second you finish.</span>
                    </span>
                  </div>
                  <div className={`flex items-center gap-6 rounded-3xl bg-[#0b0b0b] p-7 md:p-8 flex-1 ${card(3)}`} style={delay(3)}>
                    <span className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-white shadow-sm flex items-center justify-center flex-shrink-0">
                      <ArrowUp className="w-7 h-7 text-slate-900" strokeWidth={2.5} />
                    </span>
                    <span>
                      <span className="font-display block text-2xl md:text-3xl font-medium text-white mb-1">Professional templates</span>
                      <span className="block text-slate-300 leading-relaxed">Pixel-perfect layouts for pay stubs, tax forms, letters, and more.</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        );
      })()}

      {/* Quick Solution Section */}
      {(() => {
        const [quickSolutionRef, quickSolutionInView] = useInView();
        return (
          <section ref={quickSolutionRef} className="py-20 bg-white">
            <div className="max-w-7xl mx-auto px-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                {/* Left Content - appears below animation on mobile */}
                <div className="space-y-6 order-2 lg:order-1">
                  <span className="inline-block text-sm font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-4 py-1.5 rounded-full">
                    Quick Solution
                  </span>
                  <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight leading-tight text-slate-900">
                    How MintSlip Makes{' '}
                    <span className="relative inline-block" style={{ color: '#1a4731' }}>
                      Pay Stubs
                      <svg 
                        className="absolute -bottom-2 left-0 w-full" 
                        viewBox="0 0 120 20" 
                        preserveAspectRatio="none"
                        style={{ overflow: 'visible', height: '12px' }}
                      >
                        <path 
                          d="M2,14 Q30,14 60,12 Q90,10 105,8 Q112,6 118,3" 
                          stroke="#1a4731" 
                          strokeWidth="4" 
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          style={{
                            strokeDasharray: 150,
                            strokeDashoffset: quickSolutionInView ? 0 : 150,
                            transition: 'stroke-dashoffset 0.6s ease-out 0.3s'
                          }}
                        />
                      </svg>
                    </span>
                    {' '}Instantly
                  </h2>
                  <p className="text-lg text-slate-600 leading-relaxed">
                    With MintSlip, you can instantly create accurate paycheck stubs for any situation. Our platform simplifies the process, offering customized pay stubs ready for use in minutes. Choose from PDF or other digital file types for fast, secure download.
                  </p>
                  <p className="text-lg text-slate-600 leading-relaxed">
                    Whether you need detailed pay stubs or record keeping, MintSlip makes it quick and easy to create accurate and reliable paycheck documentation anytime.
                  </p>
                  <button
                    onClick={() => navigate("/app")}
                    className="group inline-flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold px-7 py-3.5 rounded-xl transition-all duration-200 shadow-md shadow-emerald-900/10 hover:shadow-lg"
                  >
                    Get Your Pay Stub Now
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
                  </button>
                </div>

                {/* Right - Animation - appears above text on mobile */}
                <div className="flex justify-center items-center order-1 lg:order-2">
                  <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/70 rounded-2xl overflow-hidden h-96 w-full border border-emerald-100 shadow-sm flex items-center justify-center">
                    <EnvelopeAnimation isVisible={quickSolutionInView} />
                  </div>
                </div>
              </div>
            </div>
          </section>
        );
      })()}

      {/* How it works — Kikoff-style: three gray cards, each with a step
          bubble and a cropped iPhone mockup walking the MintSlip flow. */}
      {(() => {
        const [howRef, howInView] = useInView();
        const StatusBar = () => (
          <div className="relative flex items-center justify-between text-[13px] font-semibold text-slate-900 pt-3 px-5">
            <span>9:41</span>
            <span className="absolute left-1/2 -translate-x-1/2 top-[10px] w-24 h-[26px] bg-[#111] rounded-full" aria-hidden="true" />
            <span className="flex items-center gap-1.5" aria-hidden="true">
              <svg width="17" height="11" viewBox="0 0 17 11" fill="currentColor"><rect x="0" y="7" width="3" height="4" rx="1" /><rect x="4.5" y="5" width="3" height="6" rx="1" /><rect x="9" y="2.5" width="3" height="8.5" rx="1" /><rect x="13.5" y="0" width="3" height="11" rx="1" /></svg>
              <svg width="15" height="11" viewBox="0 0 15 11" fill="currentColor"><path d="M7.5 10 L10 7.4 A3.8 3.8 0 0 0 5 7.4 Z" /><path d="M2.9 5.2 A6.8 6.8 0 0 1 12.1 5.2 L10.6 6.8 A4.8 4.8 0 0 0 4.4 6.8 Z" /><path d="M0.6 2.8 A10 10 0 0 1 14.4 2.8 L12.9 4.4 A7.9 7.9 0 0 0 2.1 4.4 Z" /></svg>
              <svg width="25" height="12" viewBox="0 0 25 12"><rect x="0.5" y="0.5" width="21" height="11" rx="3.5" fill="none" stroke="currentColor" opacity="0.4" /><rect x="2" y="2" width="18" height="8" rx="2" fill="currentColor" /><path d="M23 4 A2.2 2.2 0 0 1 23 8 Z" fill="currentColor" opacity="0.4" /></svg>
            </span>
          </div>
        );
        const Phone = ({ children }) => (
          <div className="relative mx-auto mt-auto w-[88%] max-w-[330px] bg-[#111] rounded-[46px] p-[9px] shadow-2xl -mb-14">
            <div className="bg-white rounded-[38px] overflow-hidden min-h-[560px]">
              <StatusBar />
              {children}
            </div>
          </div>
        );
        const StepPill = ({ n }) => (
          <span className="bg-emerald-400 text-emerald-950 text-[13px] font-bold px-3 py-1.5 rounded-full whitespace-nowrap flex-shrink-0">Step {n}</span>
        );
        const cardCls = (i) => `rounded-3xl bg-[#f0f0f0] px-4 pt-8 md:px-6 overflow-hidden flex flex-col gap-10 transition-all duration-700 ${howInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`;
        return (
          <section id="how-it-works" ref={howRef} className="py-20 md:py-24 bg-white scroll-mt-24">
            <div className="max-w-[1288px] mx-auto px-6">
              <h2 className={`font-display text-center text-4xl md:text-5xl lg:text-6xl tracking-tight text-slate-900 font-medium mb-12 transition-all duration-700 ${howInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
                How it works
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
                {/* Step 1: start a document */}
                <div className={cardCls(0)} style={{ transitionDelay: '0ms' }}>
                  <div className="bg-white rounded-3xl p-5 md:p-6 flex items-start gap-3">
                    <StepPill n={1} />
                    <p className="text-[16px] md:text-[17px] leading-snug text-slate-900">
                      Create your document in minutes with <strong>no account required. No subscriptions or hidden fees.</strong>
                    </p>
                  </div>
                  <Phone>
                    <div className="px-6 pt-8">
                      <img src={MintSlipLogo} alt="MintSlip" className="h-7 w-auto" />
                      <h3 className="font-display text-[27px] leading-tight font-bold text-slate-900 mt-8">
                        Ready to make your paystub? Let's go!
                      </h3>
                      <div className="mt-8 space-y-4">
                        <div className="border border-slate-300 rounded-xl px-4 py-4 text-slate-400 text-[15px]">Company name</div>
                        <div className="border border-slate-300 rounded-xl px-4 py-4 text-slate-400 text-[15px]">Employee name</div>
                      </div>
                      <div className="mt-7 bg-slate-200 rounded-full py-4 text-center text-slate-500 font-semibold">
                        Start my paystub
                      </div>
                    </div>
                  </Phone>
                </div>

                {/* Step 2: pick + fill */}
                <div className={cardCls(1)} style={{ transitionDelay: '120ms' }}>
                  <div className="bg-white rounded-3xl p-5 md:p-6 flex items-start gap-3">
                    <StepPill n={2} />
                    <p className="text-[16px] md:text-[17px] leading-snug text-slate-900">
                      Pick the document that fits your needs, <strong>starting at $9.99</strong>. Fill it in and the math is done for you.
                    </p>
                  </div>
                  <Phone>
                    <div className="px-6 pt-6">
                      <h3 className="font-display text-[26px] font-bold text-slate-900">Select your document</h3>
                      <p className="text-[13px] text-slate-500 mt-3 leading-relaxed">
                        Every document is a one-time purchase with no subscriptions or hidden fees. Pick the one that fits your needs.
                      </p>
                      <div className="flex gap-2 mt-5">
                        <span className="px-4 py-2 rounded-full bg-emerald-500 text-white text-sm font-semibold">Paystub</span>
                        <span className="px-4 py-2 rounded-full bg-white border border-slate-200 shadow-sm text-sm font-semibold text-slate-700">W-2</span>
                        <span className="px-4 py-2 rounded-full bg-white border border-slate-200 shadow-sm text-sm font-semibold text-slate-700">1099</span>
                      </div>
                      <div className="mt-6 text-center text-[13px] text-slate-600 font-medium border-b border-slate-100 pb-2">Taxes &amp; deductions</div>
                      <div className="grid grid-cols-3 text-center mt-3 text-[14px]">
                        <span className="text-emerald-600 font-bold">Automatic</span>
                        <span className="text-slate-800 font-semibold">Automatic</span>
                        <span className="text-slate-800 font-semibold">Automatic</span>
                      </div>
                      <div className="mt-5 text-center text-[13px] text-slate-600 font-medium border-b border-slate-100 pb-2">Instant PDF download</div>
                    </div>
                  </Phone>
                </div>

                {/* Step 3: go further */}
                <div className={cardCls(2)} style={{ transitionDelay: '240ms' }}>
                  <div className="bg-white rounded-3xl p-5 md:p-6 flex items-start gap-3">
                    <StepPill n={3} />
                    <p className="text-[16px] md:text-[17px] leading-snug text-slate-900">
                      Take your documents even further with <strong>powerful extra features</strong>. Save and re-download. Build resumes with AI. And more.
                    </p>
                  </div>
                  <Phone>
                    <div className="px-5 pt-6">
                      <h3 className="font-display text-[22px] font-bold text-slate-900 px-1">More ways to use MintSlip</h3>
                      <div className="mt-5 space-y-4">
                        {[
                          { icon: Download, t: "Saved Documents", g: "Re-download anytime", rest: " — your files stay safe" },
                          { icon: Sparkles, t: "AI Resume Builder", g: "Land interviews", rest: " with a tailored resume" },
                          { icon: MessageCircle, t: "Live Support", g: "Chat with a human", rest: " whenever you need help" },
                        ].map((f) => (
                          <div key={f.t} className="bg-white border border-slate-100 rounded-2xl shadow-md shadow-slate-200/60 p-4 flex items-start gap-3">
                            <span className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                              <f.icon className="w-5 h-5 text-white" />
                            </span>
                            <span>
                              <span className="block font-bold text-slate-900 text-[15px]">{f.t}</span>
                              <span className="block text-[13px] text-slate-600 mt-0.5">
                                <span className="text-emerald-600 font-bold">{f.g}</span>{f.rest}
                              </span>
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Phone>
                </div>
              </div>
            </div>
          </section>
        );
      })()}

      {/* Why Choose Our Paystub Generator Section */}
      {(() => {
        const [whyChooseRef, whyChooseInView] = useInView();
        return (
          <section ref={whyChooseRef} className="py-20 bg-white">
            <div className="max-w-7xl mx-auto px-6">
              {/* Top Section - Why Choose Us (Full Width) */}
              <div className="bg-slate-50/70 rounded-3xl border border-slate-200/80 p-8 md:p-12 mb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                  <div className="space-y-6 order-2 md:order-1">
                    <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-slate-900">
                      Why Choose Our{' '}
                      <span className="relative inline-block" style={{ color: '#1a4731' }}>
                        Paystub
                        <svg 
                          className="absolute -bottom-2 left-0 w-full" 
                          viewBox="0 0 120 20" 
                          preserveAspectRatio="none"
                          style={{ overflow: 'visible', height: '12px' }}
                        >
                          <path 
                            d="M2,14 Q30,14 60,12 Q90,10 105,8 Q112,6 118,3" 
                            stroke="#1a4731" 
                            strokeWidth="4" 
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            style={{
                              strokeDasharray: 150,
                              strokeDashoffset: whyChooseInView ? 0 : 150,
                              transition: 'stroke-dashoffset 0.6s ease-out 0.3s'
                            }}
                          />
                        </svg>
                      </span>
                      <br />Generator Vs. Others
                    </h2>
                    <p className="text-lg leading-relaxed text-slate-600">
                      Unlike other paystub generators that rely on generic, outdated templates, our paystub generator delivers meticulously designed paystub templates built for a modern, professional look. Each pay stub template is crafted for clarity, accuracy, and real world usability. Our advanced pay stub calculator makes generating accurate, professional pay stubs fast, easy, and problem-free.
                    </p>
                    <ul className="space-y-3">
                      <li className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                        <span className="text-slate-700">Lightning-Fast Paystub Generation</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                        <span className="text-slate-700">Top-Notch Customer Support</span>
                      </li>
                    </ul>
                  </div>
                  <div className="flex justify-center items-center order-1 md:order-2">
                    <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/70 rounded-2xl overflow-hidden h-72 w-full border border-emerald-100 shadow-sm flex items-center justify-center">
                      <SpeedServiceAnimation isVisible={whyChooseInView} />
                    </div>
                  </div>
                </div>
              </div>

          {/* Bottom Section - Two Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Instant Download Card */}
            <div className="bg-emerald-50/80 rounded-3xl border border-emerald-100 p-8 overflow-hidden">
              <h3 className="font-display text-2xl md:text-3xl font-bold mb-2 text-center text-slate-900">
                Instant Download
              </h3>
              <p className="text-slate-600 mb-5 text-center">
                Download your generated documents immediately after creation
              </p>
              <div className="relative">
                <div className="bg-white rounded-2xl overflow-hidden border border-emerald-100 shadow-sm h-64 flex items-center justify-center">
                  <InstantDownloadAnimation isVisible={whyChooseInView} />
                </div>
              </div>
            </div>

            {/* No Data Stored Card */}
            <div className="bg-slate-50/80 rounded-3xl border border-slate-200 p-8 overflow-hidden">
              <h3 className="font-display text-2xl md:text-3xl font-bold mb-2 text-center text-slate-900">
                No Data Stored
              </h3>
              <p className="text-slate-600 mb-5 text-center">
                We don&apos;t save your personal information or generated documents
              </p>
              <div className="relative">
                <div className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm h-64 flex items-center justify-center">
                  <NoDataStoredAnimation isVisible={whyChooseInView} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
        );
      })()}

      {/* Latest Blog Posts Section */}
      {(() => {
        const [blogRef, blogInView] = useInView();
        const [latestPosts, setLatestPosts] = useState([]);
        const [isLoadingPosts, setIsLoadingPosts] = useState(true);
        const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";
        
        useEffect(() => {
          const fetchLatestPosts = async () => {
            try {
              const response = await fetch(`${BACKEND_URL}/api/blog/posts?limit=3&sort=newest`);
              const data = await response.json();
              if (data.success) {
                setLatestPosts(data.posts);
              }
            } catch (error) {
              console.error("Error fetching blog posts:", error);
            } finally {
              setIsLoadingPosts(false);
            }
          };
          fetchLatestPosts();
        }, [BACKEND_URL]);

        const formatDate = (dateString) => {
          return new Date(dateString).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric"
          });
        };

        // Only render if there are posts
        if (!isLoadingPosts && latestPosts.length === 0) return null;

        return (
          <section ref={blogRef} className="py-20 bg-white">
            <div className="max-w-6xl mx-auto px-6">
              {/* Section Header */}
              <div className={`text-center mb-12 transition-all duration-700 ${blogInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                <h3 className="font-display text-4xl md:text-5xl lg:text-6xl tracking-tight text-slate-900 font-medium max-w-4xl mx-auto mb-4">
                  Latest <span className="font-black">articles & guides</span>
                </h3>
                <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                  Expert tips on pay stubs, tax forms, and financial documentation to help you succeed.
                </p>
              </div>

              {/* Blog Posts Grid */}
              {isLoadingPosts ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-slate-100 rounded-xl h-80 animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {latestPosts.map((post, index) => (
                    <article
                      key={post.id}
                      className={`group bg-white border border-slate-200 rounded-2xl overflow-hidden hover:border-emerald-400 hover:shadow-lg transition-all duration-300 cursor-pointer ${blogInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
                      style={{ transitionDelay: `${index * 100}ms` }}
                      onClick={() => navigate(`/blog/${post.slug}`)}
                    >
                      {/* Featured Image */}
                      <div className="relative h-48 bg-gradient-to-br from-emerald-100 to-emerald-50 overflow-hidden">
                        {post.featuredImage ? (
                          <img
                            src={post.featuredImage.startsWith('/') ? `${BACKEND_URL}${post.featuredImage}` : post.featuredImage}
                            alt={post.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <FileText className="w-16 h-16 text-emerald-300" />
                          </div>
                        )}
                        {/* Category Badge and Views */}
                        <div className="absolute top-3 left-3 right-3 flex justify-between items-center">
                          {post.category && (
                            <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-emerald-700 text-xs font-semibold rounded-full capitalize">
                              {post.category.replace(/-/g, ' ')}
                            </span>
                          )}
                          <span className="px-2 py-1 bg-black/50 backdrop-blur-sm text-white text-xs font-medium rounded-full flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {post.views || 0}
                          </span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-5">
                        {/* Date & Read Time */}
                        <div className="flex items-center gap-3 text-xs text-slate-500 mb-3">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(post.publishDate)}
                          </span>
                          {post.readTime && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {post.readTime} min read
                            </span>
                          )}
                        </div>

                        {/* Title */}
                        <h4 className="font-bold text-slate-800 text-lg mb-2 line-clamp-2 group-hover:text-emerald-700 transition-colors">
                          {post.title}
                        </h4>

                        {/* Excerpt */}
                        <p className="text-sm text-slate-600 line-clamp-2 mb-4">
                          {post.excerpt}
                        </p>

                        {/* Read More Link */}
                        <div className="flex items-center gap-1 text-emerald-600 font-medium text-sm group-hover:gap-2 transition-all">
                          Read Article
                          <ArrowRight className="w-4 h-4" />
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}

              {/* View All Button */}
              <div className={`text-center mt-10 transition-all duration-700 delay-300 ${blogInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                <Button
                  onClick={() => navigate("/blog")}
                  size="lg"
                  variant="outline"
                  className="group gap-2 border-2 border-emerald-600 text-emerald-700 hover:bg-emerald-50"
                >
                  View All Articles
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </div>
          </section>
        );
      })()}

      {/* Trust Section - Testimonials */}
      {(() => {
        const [trustRef, trustInView] = useInView();
        return (
          <section ref={trustRef} className="bg-white py-20 md:py-24">
            <div className="max-w-[1288px] mx-auto px-6">
              {/* Overlapping avatar strip */}
              <div className={`flex justify-center mb-10 transition-all duration-700 ${trustInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
                {[EmilyPhoto, JakePhoto, SophiaPhoto, KevinPhoto].map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    alt=""
                    aria-hidden="true"
                    className={`w-16 h-16 md:w-20 md:h-20 rounded-full object-cover ring-4 ring-white shadow-md ${i > 0 ? '-ml-3' : ''}`}
                  />
                ))}
              </div>

              {/* Headline */}
              <h2 className={`font-display text-center text-4xl md:text-5xl lg:text-6xl tracking-tight text-slate-900 font-medium max-w-4xl mx-auto mb-14 transition-all duration-700 delay-100 ${trustInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
                We've helped people <span className="font-black">prove their income</span> and <span className="font-black">save hours</span> on paperwork
              </h2>

              {/* Testimonial cards */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {HOME_TESTIMONIALS.map((t, i) => (
                  <TestimonialCard key={t.name} t={t} inView={trustInView} delay={150 + i * 120} />
                ))}
              </div>
            </div>
          </section>
        );
      })()}

      {/* FAQ Section */}
      <section id="faq" className="py-20 md:py-24 bg-white scroll-mt-24">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl tracking-tight text-slate-900 font-medium mb-4">
              Frequently asked <span className="font-black">questions</span>
            </h2>
            <p className="text-lg text-slate-600">
              Quick answers about how MintSlip works.
            </p>
          </div>

          <Accordion type="single" collapsible className="w-full">
            {LANDING_FAQS.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="border-slate-200">
                <AccordionTrigger className="text-left text-base font-semibold text-slate-800 hover:text-emerald-800 hover:no-underline py-5">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-base leading-relaxed text-slate-600 pb-5">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="pb-20 md:pb-24 px-6 bg-white">
        <div className="relative max-w-5xl mx-auto rounded-3xl bg-gradient-to-br from-emerald-50 via-emerald-50/60 to-white border border-emerald-100 px-6 py-14 md:px-16 md:py-16 text-center overflow-hidden">
          <div aria-hidden="true" className="absolute -top-24 -right-24 w-72 h-72 bg-emerald-100/70 rounded-full filter blur-3xl pointer-events-none" />
          <div className="relative">
            <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-slate-900 mb-4">
              Create Your First Document in Minutes
            </h2>
            <p className="text-lg text-slate-600 max-w-xl mx-auto mb-8">
              Professional pay stubs, tax forms, and more — generated instantly, downloaded immediately. No sign-up required.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={() => navigate("/app")}
                size="lg"
                className="cta-shine group gap-2 text-base px-7 py-6 rounded-xl bg-emerald-700 hover:bg-emerald-800 shadow-md shadow-emerald-900/10 hover:shadow-lg transition-all duration-200"
              >
                Create Pay Stub
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
              </Button>
              <Button
                onClick={() => navigate("/generators")}
                size="lg"
                variant="outline"
                className="gap-2 text-base px-7 py-6 rounded-xl border-slate-300 text-slate-700 hover:border-emerald-600 hover:text-emerald-800 hover:bg-white transition-all duration-200"
              >
                Browse All Generators
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

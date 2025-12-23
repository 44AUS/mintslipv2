import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { Helmet } from "react-helmet-async";
import { FileText, FileBarChart, CheckCircle, Shield, Clock, PiggyBank, Calendar, Receipt, ArrowRight, Sparkles, Zap, Star, MessageCircle, ClipboardList, Users, Landmark, Mail, Car, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import select from '../assests/select.png';
import inputInfo from '../assests/inputInfo.png';
import download from '../assests/download.png';

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
      <circle cx="140" cy="120" r="100" fill="#dcfce7" opacity="0.3"
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
        <rect x="195" y="50" width="75" height="110" rx="6" fill="#ffffff" stroke="#22c55e" strokeWidth="3" filter="url(#glowGreen)"/>
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
        <rect x="203" y="118" width="62" height="18" rx="3" fill="#dcfce7" stroke="#22c55e" strokeWidth="1"
          style={{ opacity: 0, animation: isVisible ? 'fadeIn 0.3s ease-out 1.9s forwards' : 'none' }}/>
        <text x="234" y="131" textAnchor="middle" fill="#166534" fontSize="9" fontWeight="bold"
          style={{ opacity: 0, animation: isVisible ? 'fadeIn 0.3s ease-out 2s forwards' : 'none' }}>$2,450.00</text>
        {/* Checkmark badge */}
        <g style={{ opacity: 0, animation: isVisible ? 'bounceIn 0.5s ease-out 2.1s forwards' : 'none' }}>
          <circle cx="262" cy="58" r="12" fill="#22c55e" stroke="#ffffff" strokeWidth="2"/>
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
        <circle cx="100" cy="40" r="2.5" fill="#22c55e" style={{ animation: isVisible ? 'sparkle 2s ease-in-out infinite 2.3s' : 'none' }}/>
      </g>

      {/* Flow lines connecting everything */}
      <g style={{ opacity: 0, animation: isVisible ? 'fadeIn 0.5s ease-out 0.4s forwards' : 'none' }}>
        <path d="M55,155 Q55,175 80,175 Q100,175 120,165" fill="none" stroke="#22c55e" strokeWidth="1.5" strokeDasharray="4 2" opacity="0.4"/>
        <path d="M225,165 Q240,175 255,175 Q270,175 270,190" fill="none" stroke="#22c55e" strokeWidth="1.5" strokeDasharray="4 2" opacity="0.4"/>
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

// Paystub Reveal Animation Component - for "What is a Pay Stub?" section
const PaystubRevealAnimation = ({ isVisible }) => (
  <div className="relative w-full h-full flex items-center justify-center p-4">
    <svg viewBox="0 0 300 380" className="w-full h-full max-w-md drop-shadow-2xl">
      {/* Main paystub document */}
      <g style={{ 
        opacity: isVisible ? 1 : 0, 
        transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
        transition: 'all 0.6s ease-out'
      }}>
        {/* Document shadow */}
        <rect x="18" y="18" width="264" height="344" rx="8" fill="rgba(0,0,0,0.1)"/>
        {/* Document background */}
        <rect x="12" y="12" width="264" height="344" rx="8" fill="#ffffff" stroke="#e2e8f0" strokeWidth="2"/>
        
        {/* Company Header - slides down */}
        <g style={{ 
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0)' : 'translateY(-20px)',
          transition: 'all 0.5s ease-out 0.3s'
        }}>
          <rect x="12" y="12" width="264" height="50" rx="8" fill="#1a4731"/>
          <text x="144" y="35" textAnchor="middle" fill="#ffffff" fontSize="14" fontWeight="bold" style={{ fontFamily: 'system-ui' }}>MINTSLIP CORPORATION</text>
          <text x="144" y="52" textAnchor="middle" fill="#a7f3d0" fontSize="8">EARNINGS STATEMENT</text>
        </g>

        {/* Pay Period Info - fades in */}
        <g style={{ 
          opacity: isVisible ? 1 : 0,
          transition: 'opacity 0.4s ease-out 0.6s'
        }}>
          <rect x="24" y="72" width="120" height="32" rx="4" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1"/>
          <text x="32" y="85" fill="#64748b" fontSize="7">PAY PERIOD</text>
          <text x="32" y="97" fill="#1a4731" fontSize="9" fontWeight="600">01/01/2025 - 01/15/2025</text>
          
          <rect x="152" y="72" width="112" height="32" rx="4" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1"/>
          <text x="160" y="85" fill="#64748b" fontSize="7">PAY DATE</text>
          <text x="160" y="97" fill="#1a4731" fontSize="9" fontWeight="600">01/20/2025</text>
        </g>

        {/* Employee Info Section - slides in from left */}
        <g style={{ 
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateX(0)' : 'translateX(-30px)',
          transition: 'all 0.5s ease-out 0.8s'
        }}>
          <rect x="24" y="114" width="240" height="40" rx="4" fill="#ecfdf5" stroke="#a7f3d0" strokeWidth="1"/>
          <text x="32" y="128" fill="#64748b" fontSize="7">EMPLOYEE</text>
          <text x="32" y="142" fill="#1a4731" fontSize="11" fontWeight="700">John M. Smith</text>
          <text x="160" y="128" fill="#64748b" fontSize="7">EMPLOYEE ID</text>
          <text x="160" y="142" fill="#1a4731" fontSize="10" fontWeight="600">EMP-2025-0142</text>
        </g>

        {/* Earnings Section Header */}
        <g style={{ 
          opacity: isVisible ? 1 : 0,
          transition: 'opacity 0.4s ease-out 1s'
        }}>
          <rect x="24" y="164" width="240" height="20" rx="2" fill="#1a4731"/>
          <text x="32" y="177" fill="#ffffff" fontSize="8" fontWeight="600">EARNINGS</text>
          <text x="130" y="177" fill="#ffffff" fontSize="8" fontWeight="600">HOURS</text>
          <text x="175" y="177" fill="#ffffff" fontSize="8" fontWeight="600">RATE</text>
          <text x="220" y="177" fill="#ffffff" fontSize="8" fontWeight="600">AMOUNT</text>
        </g>

        {/* Earnings Row - animates value */}
        <g style={{ 
          opacity: isVisible ? 1 : 0,
          transition: 'opacity 0.4s ease-out 1.2s'
        }}>
          <rect x="24" y="186" width="240" height="22" rx="0" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1"/>
          <text x="32" y="200" fill="#334155" fontSize="9">Regular Pay</text>
          <text x="138" y="200" fill="#334155" fontSize="9" fontWeight="500">80.00</text>
          <text x="175" y="200" fill="#334155" fontSize="9">$25.00</text>
          <text x="220" y="200" fill="#1a4731" fontSize="9" fontWeight="600"
            style={{
              opacity: isVisible ? 1 : 0,
              animation: isVisible ? 'countUp 0.8s ease-out 1.5s forwards' : 'none'
            }}>$2,000.00</text>
        </g>

        {/* Overtime Row */}
        <g style={{ 
          opacity: isVisible ? 1 : 0,
          transition: 'opacity 0.4s ease-out 1.4s'
        }}>
          <rect x="24" y="208" width="240" height="22" rx="0" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1"/>
          <text x="32" y="222" fill="#334155" fontSize="9">Overtime</text>
          <text x="138" y="222" fill="#334155" fontSize="9" fontWeight="500">8.00</text>
          <text x="175" y="222" fill="#334155" fontSize="9">$37.50</text>
          <text x="220" y="222" fill="#1a4731" fontSize="9" fontWeight="600">$300.00</text>
        </g>

        {/* Gross Pay */}
        <g style={{ 
          opacity: isVisible ? 1 : 0,
          transition: 'opacity 0.4s ease-out 1.6s'
        }}>
          <rect x="24" y="232" width="240" height="22" rx="0" fill="#dcfce7" stroke="#86efac" strokeWidth="1"/>
          <text x="32" y="246" fill="#166534" fontSize="9" fontWeight="700">GROSS PAY</text>
          <text x="220" y="246" fill="#166534" fontSize="10" fontWeight="700">$2,300.00</text>
        </g>

        {/* Deductions Section */}
        <g style={{ 
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateX(0)' : 'translateX(30px)',
          transition: 'all 0.5s ease-out 1.8s'
        }}>
          <rect x="24" y="262" width="240" height="18" rx="2" fill="#fef2f2"/>
          <text x="32" y="274" fill="#991b1b" fontSize="8" fontWeight="600">DEDUCTIONS</text>
          
          <g>
            <text x="32" y="292" fill="#64748b" fontSize="8">Federal Tax</text>
            <text x="220" y="292" fill="#dc2626" fontSize="8" fontWeight="500">-$287.50</text>
          </g>
          <g>
            <text x="32" y="306" fill="#64748b" fontSize="8">State Tax</text>
            <text x="220" y="306" fill="#dc2626" fontSize="8" fontWeight="500">-$115.00</text>
          </g>
          <g>
            <text x="32" y="320" fill="#64748b" fontSize="8">Social Security</text>
            <text x="220" y="320" fill="#dc2626" fontSize="8" fontWeight="500">-$142.60</text>
          </g>
        </g>

        {/* Net Pay - Final reveal with emphasis */}
        <g style={{ 
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'scale(1)' : 'scale(0.9)',
          transformOrigin: '144px 342px',
          transition: 'all 0.5s ease-out 2.2s'
        }}>
          <rect x="24" y="330" width="240" height="26" rx="4" fill="#1a4731"/>
          <text x="32" y="347" fill="#ffffff" fontSize="10" fontWeight="700">NET PAY</text>
          <text x="210" y="347" fill="#4ade80" fontSize="12" fontWeight="800"
            style={{
              textShadow: '0 0 10px rgba(74, 222, 128, 0.5)'
            }}>$1,754.90</text>
        </g>
      </g>

      {/* Floating decorative elements */}
      <g style={{ 
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 0.5s ease-out 2.5s'
      }}>
        {/* Checkmark badge */}
        <g style={{
          animation: isVisible ? 'bounceIn 0.6s ease-out 2.6s forwards' : 'none',
          opacity: 0
        }}>
          <circle cx="264" cy="30" r="20" fill="#22c55e" stroke="#ffffff" strokeWidth="3"/>
          <path d="M254,30 L261,38 L276,22" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
            style={{
              strokeDasharray: 30,
              strokeDashoffset: isVisible ? 0 : 30,
              transition: 'stroke-dashoffset 0.4s ease-out 2.8s'
            }}/>
        </g>

        {/* Dollar signs floating */}
        <text x="8" y="100" fill="#22c55e" fontSize="18" opacity="0.4"
          style={{ animation: isVisible ? 'floatUp 2s ease-in-out infinite 2.5s' : 'none' }}>$</text>
        <text x="278" y="200" fill="#22c55e" fontSize="14" opacity="0.3"
          style={{ animation: isVisible ? 'floatUp 2.5s ease-in-out infinite 2.7s' : 'none' }}>$</text>
        <text x="5" y="300" fill="#22c55e" fontSize="12" opacity="0.3"
          style={{ animation: isVisible ? 'floatUp 2.2s ease-in-out infinite 2.9s' : 'none' }}>$</text>
      </g>

      {/* Sparkle effects */}
      <g style={{ opacity: isVisible ? 1 : 0, transition: 'opacity 0.3s ease-out 2.8s' }}>
        <circle cx="280" cy="80" r="3" fill="#fbbf24" style={{ animation: isVisible ? 'sparkle 1.5s ease-in-out infinite' : 'none' }}/>
        <circle cx="20" cy="180" r="2" fill="#fbbf24" style={{ animation: isVisible ? 'sparkle 1.8s ease-in-out infinite 0.3s' : 'none' }}/>
        <circle cx="285" cy="280" r="2.5" fill="#fbbf24" style={{ animation: isVisible ? 'sparkle 1.6s ease-in-out infinite 0.6s' : 'none' }}/>
      </g>
    </svg>
    
    <style>{`
      @keyframes countUp {
        0% { opacity: 0; }
        100% { opacity: 1; }
      }
      @keyframes bounceIn {
        0% { opacity: 0; transform: scale(0); }
        60% { transform: scale(1.2); }
        100% { opacity: 1; transform: scale(1); }
      }
      @keyframes floatUp {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-10px); }
      }
      @keyframes sparkle {
        0%, 100% { opacity: 0.3; transform: scale(1); }
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

// Secure & Instant Animation Component - for Trust Section
const SecureInstantAnimation = ({ isVisible }) => (
  <div className="relative w-full h-full flex items-center justify-center">
    <svg viewBox="0 0 300 280" className="w-full h-full max-w-md">
      {/* Background secure circle */}
      <circle cx="150" cy="140" r="120" fill="#f0fdf4" opacity="0.5"
        style={{ 
          animation: isVisible ? 'securePulse 3s ease-in-out infinite' : 'none',
          transformOrigin: '150px 140px'
        }}/>

      {/* Credit Card / Payment */}
      <g style={{ 
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateX(0) rotate(0deg)' : 'translateX(-40px) rotate(-10deg)',
        transition: 'all 0.6s ease-out'
      }}>
        <rect x="30" y="80" width="90" height="60" rx="8" fill="#1a4731"/>
        <rect x="30" y="80" width="90" height="20" rx="8" fill="#166534"/>
        {/* Card chip */}
        <rect x="42" y="105" width="18" height="14" rx="3" fill="#fbbf24"/>
        <line x1="46" y1="109" x2="56" y2="109" stroke="#d97706" strokeWidth="1"/>
        <line x1="46" y1="113" x2="56" y2="113" stroke="#d97706" strokeWidth="1"/>
        {/* Card number dots */}
        <g fill="#ffffff" opacity="0.8">
          <circle cx="75" cy="125" r="2"/>
          <circle cx="82" cy="125" r="2"/>
          <circle cx="89" cy="125" r="2"/>
          <circle cx="96" cy="125" r="2"/>
          <circle cx="106" cy="125" r="2"/>
          <circle cx="113" cy="125" r="2"/>
        </g>
      </g>

      {/* Arrow from card to lock */}
      <g style={{ 
        opacity: 0,
        animation: isVisible ? 'fadeIn 0.4s ease-out 0.5s forwards' : 'none'
      }}>
        <path d="M125,110 Q145,95 150,95" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round"
          style={{ strokeDasharray: 40, strokeDashoffset: isVisible ? 0 : 40, transition: 'stroke-dashoffset 0.5s ease-out 0.5s' }}/>
        <circle cx="125" cy="110" r="4" fill="#22c55e"/>
      </g>

      {/* Central Lock / Security */}
      <g style={{ 
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'scale(1)' : 'scale(0.5)',
        transformOrigin: '150px 115px',
        transition: 'all 0.5s ease-out 0.7s'
      }}>
        {/* Lock body */}
        <rect x="130" y="100" width="40" height="35" rx="6" fill="#22c55e"/>
        {/* Lock shackle */}
        <path d="M137,100 L137,88 C137,75 163,75 163,88 L163,100" fill="none" stroke="#22c55e" strokeWidth="7" strokeLinecap="round"/>
        {/* Keyhole */}
        <circle cx="150" cy="113" r="5" fill="#ffffff"/>
        <rect x="148" y="115" width="4" height="10" rx="2" fill="#ffffff"/>
        {/* Shine effect */}
        <ellipse cx="142" cy="108" rx="4" ry="6" fill="#ffffff" opacity="0.3"/>
      </g>

      {/* Encryption circles around lock */}
      <g style={{ opacity: isVisible ? 1 : 0, transition: 'opacity 0.5s ease-out 1s' }}>
        <circle cx="150" cy="115" r="35" fill="none" stroke="#22c55e" strokeWidth="1" strokeDasharray="5 5"
          style={{ animation: isVisible ? 'rotateSlow 10s linear infinite' : 'none', transformOrigin: '150px 115px' }}/>
        <circle cx="150" cy="115" r="45" fill="none" stroke="#22c55e" strokeWidth="1" strokeDasharray="8 4" opacity="0.5"
          style={{ animation: isVisible ? 'rotateSlowReverse 15s linear infinite' : 'none', transformOrigin: '150px 115px' }}/>
      </g>

      {/* Arrow from lock to document */}
      <g style={{ 
        opacity: 0,
        animation: isVisible ? 'fadeIn 0.4s ease-out 1.2s forwards' : 'none'
      }}>
        <path d="M175,110 Q195,95 210,100" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round"
          style={{ strokeDasharray: 40, strokeDashoffset: isVisible ? 0 : 40, transition: 'stroke-dashoffset 0.5s ease-out 1.2s' }}/>
        <path d="M205,95 L212,100 L205,105" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </g>

      {/* Document / PDF Output */}
      <g style={{ 
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateX(0) rotate(0deg)' : 'translateX(40px) rotate(10deg)',
        transition: 'all 0.6s ease-out 1.4s'
      }}>
        <rect x="200" y="75" width="70" height="90" rx="6" fill="#ffffff" stroke="#1a4731" strokeWidth="2"/>
        {/* PDF badge */}
        <rect x="200" y="75" width="70" height="22" rx="6" fill="#ef4444"/>
        <text x="235" y="90" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="bold">PDF</text>
        {/* Document lines */}
        <line x1="210" y1="108" x2="260" y2="108" stroke="#1a4731" strokeWidth="2" opacity="0.3"
          style={{ strokeDasharray: 50, strokeDashoffset: isVisible ? 0 : 50, transition: 'stroke-dashoffset 0.4s ease-out 1.6s' }}/>
        <line x1="210" y1="122" x2="250" y2="122" stroke="#1a4731" strokeWidth="2" opacity="0.3"
          style={{ strokeDasharray: 40, strokeDashoffset: isVisible ? 0 : 40, transition: 'stroke-dashoffset 0.4s ease-out 1.7s' }}/>
        <line x1="210" y1="136" x2="255" y2="136" stroke="#1a4731" strokeWidth="2" opacity="0.3"
          style={{ strokeDasharray: 45, strokeDashoffset: isVisible ? 0 : 45, transition: 'stroke-dashoffset 0.4s ease-out 1.8s' }}/>
        {/* Download arrow on document */}
        <g style={{ opacity: 0, animation: isVisible ? 'bounceIn 0.4s ease-out 2s forwards' : 'none' }}>
          <circle cx="235" cy="148" r="10" fill="#22c55e"/>
          <path d="M235,143 L235,153 M230,150 L235,155 L240,150" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </g>
      </g>

      {/* PayPal Logo representation */}
      <g style={{ 
        opacity: 0,
        animation: isVisible ? 'fadeIn 0.5s ease-out 0.3s forwards' : 'none'
      }}>
        <rect x="45" y="150" width="55" height="25" rx="5" fill="#003087"/>
        <text x="72" y="167" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="bold">PayPal</text>
      </g>

      {/* Secure badge */}
      <g style={{ 
        opacity: 0,
        animation: isVisible ? 'bounceIn 0.5s ease-out 2.2s forwards' : 'none'
      }}>
        <rect x="105" y="175" width="90" height="28" rx="14" fill="#1a4731"/>
        <text x="127" y="193" fill="#ffffff" fontSize="9" fontWeight="bold">🔒 SECURE</text>
      </g>

      {/* Instant badge */}
      <g style={{ 
        opacity: 0,
        animation: isVisible ? 'bounceIn 0.5s ease-out 2.4s forwards' : 'none'
      }}>
        <rect x="105" y="210" width="90" height="28" rx="14" fill="#22c55e"/>
        <text x="127" y="228" fill="#ffffff" fontSize="9" fontWeight="bold">⚡ INSTANT</text>
      </g>

      {/* Time indicator */}
      <g style={{ 
        opacity: 0,
        animation: isVisible ? 'fadeIn 0.4s ease-out 2.6s forwards' : 'none'
      }}>
        <circle cx="235" cy="195" r="18" fill="#fef3c7" stroke="#f59e0b" strokeWidth="2"/>
        <text x="235" y="192" textAnchor="middle" fill="#92400e" fontSize="7" fontWeight="bold">Under</text>
        <text x="235" y="202" textAnchor="middle" fill="#92400e" fontSize="8" fontWeight="bold">2 min</text>
      </g>

      {/* Floating shield icons */}
      <g style={{ opacity: isVisible ? 1 : 0, transition: 'opacity 0.5s ease-out 2s' }}>
        <path d="M25,50 L25,62 C25,70 35,75 35,75 C35,75 45,70 45,62 L45,50 L35,45 Z" fill="#22c55e" opacity="0.6"
          style={{ animation: isVisible ? 'floatShield 3s ease-in-out infinite' : 'none' }}/>
        <path d="M265,180 L265,190 C265,196 273,200 273,200 C273,200 281,196 281,190 L281,180 L273,176 Z" fill="#22c55e" opacity="0.5"
          style={{ animation: isVisible ? 'floatShield 3.5s ease-in-out infinite 0.5s' : 'none' }}/>
      </g>

      {/* Sparkles */}
      <g style={{ opacity: isVisible ? 1 : 0, transition: 'opacity 0.5s ease-out 2.3s' }}>
        <circle cx="280" cy="60" r="3" fill="#fbbf24" style={{ animation: isVisible ? 'sparkle 1.5s ease-in-out infinite' : 'none' }}/>
        <circle cx="20" cy="200" r="2.5" fill="#fbbf24" style={{ animation: isVisible ? 'sparkle 1.8s ease-in-out infinite 0.2s' : 'none' }}/>
        <circle cx="290" cy="240" r="2" fill="#fbbf24" style={{ animation: isVisible ? 'sparkle 1.6s ease-in-out infinite 0.4s' : 'none' }}/>
        <circle cx="15" cy="120" r="2" fill="#22c55e" style={{ animation: isVisible ? 'sparkle 2s ease-in-out infinite 0.3s' : 'none' }}/>
      </g>

      {/* Checkmarks showing completed steps */}
      <g style={{ opacity: 0, animation: isVisible ? 'fadeIn 0.3s ease-out 1s forwards' : 'none' }}>
        <circle cx="75" cy="60" r="10" fill="#22c55e"/>
        <path d="M70,60 L73,64 L81,55" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </g>
      <g style={{ opacity: 0, animation: isVisible ? 'fadeIn 0.3s ease-out 1.5s forwards' : 'none' }}>
        <circle cx="150" cy="55" r="10" fill="#22c55e"/>
        <path d="M145,55 L148,59 L156,50" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </g>
      <g style={{ opacity: 0, animation: isVisible ? 'fadeIn 0.3s ease-out 2s forwards' : 'none' }}>
        <circle cx="235" cy="55" r="10" fill="#22c55e"/>
        <path d="M230,55 L233,59 L241,50" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </g>
    </svg>

    <style>{`
      @keyframes securePulse {
        0%, 100% { transform: scale(1); opacity: 0.5; }
        50% { transform: scale(1.05); opacity: 0.7; }
      }
      @keyframes rotateSlow {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      @keyframes rotateSlowReverse {
        0% { transform: rotate(360deg); }
        100% { transform: rotate(0deg); }
      }
      @keyframes fadeIn {
        0% { opacity: 0; }
        100% { opacity: 1; }
      }
      @keyframes bounceIn {
        0% { opacity: 0; transform: scale(0); }
        60% { transform: scale(1.15); }
        100% { opacity: 1; transform: scale(1); }
      }
      @keyframes floatShield {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-8px); }
      }
      @keyframes sparkle {
        0%, 100% { opacity: 0.4; transform: scale(1); }
        50% { opacity: 1; transform: scale(1.5); }
      }
    `}</style>
  </div>
);

// Form Typing Animation Component
const FormTypingAnimation = ({ isVisible }) => (
  <div className="relative w-full h-full flex items-center justify-center p-4">
    <svg viewBox="0 0 280 220" className="w-full h-full max-w-sm">
      {/* Form container */}
      <rect x="20" y="10" width="240" height="200" rx="12" fill="#ffffff" stroke="#1a4731" strokeWidth="2"/>
      
      {/* Form header */}
      <rect x="20" y="10" width="240" height="35" rx="12" fill="#1a4731"/>
      <text x="140" y="33" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="bold">PAYSTUB GENERATOR</text>
      
      {/* Company Name Field */}
      <g style={{ opacity: isVisible ? 1 : 0, transition: 'opacity 0.3s ease-out' }}>
        <text x="35" y="65" fill="#666666" fontSize="8">Company Name</text>
        <rect x="35" y="70" width="110" height="22" rx="4" fill="#f8f8f8" stroke="#e0e0e0" strokeWidth="1"/>
        <text x="40" y="84" fill="#1a4731" fontSize="10" fontWeight="500"
          style={{ 
            opacity: isVisible ? 1 : 0,
            animation: isVisible ? 'typeText 0.8s steps(10) 0.3s forwards' : 'none'
          }}>
          <tspan className="typing-text">MintSlip Inc</tspan>
        </text>
        {/* Cursor */}
        <rect x="100" y="74" width="2" height="12" fill="#1a4731"
          style={{ 
            opacity: isVisible ? 1 : 0,
            animation: isVisible ? 'blink 0.5s infinite 0.3s, moveCursor1 0.8s ease-out 0.3s forwards' : 'none'
          }}/>
      </g>
      
      {/* Employee Name Field */}
      <g style={{ opacity: isVisible ? 1 : 0, transition: 'opacity 0.3s ease-out 0.5s' }}>
        <text x="155" y="65" fill="#666666" fontSize="8">Employee Name</text>
        <rect x="155" y="70" width="95" height="22" rx="4" fill="#f8f8f8" stroke="#e0e0e0" strokeWidth="1"/>
        <text x="160" y="84" fill="#1a4731" fontSize="10" fontWeight="500"
          style={{ 
            opacity: isVisible ? 1 : 0,
            animation: isVisible ? 'typeText 0.6s steps(8) 1s forwards' : 'none'
          }}>John Doe</text>
      </g>
      
      {/* Hourly Rate Field */}
      <g style={{ opacity: isVisible ? 1 : 0, transition: 'opacity 0.3s ease-out 1s' }}>
        <text x="35" y="108" fill="#666666" fontSize="8">Hourly Rate</text>
        <rect x="35" y="113" width="80" height="22" rx="4" fill="#f8f8f8" stroke="#e0e0e0" strokeWidth="1"/>
        <text x="40" y="127" fill="#1a4731" fontSize="10" fontWeight="500"
          style={{ 
            opacity: isVisible ? 1 : 0,
            animation: isVisible ? 'typeText 0.4s steps(6) 1.5s forwards' : 'none'
          }}>$25.00</text>
      </g>
      
      {/* Hours Worked Field */}
      <g style={{ opacity: isVisible ? 1 : 0, transition: 'opacity 0.3s ease-out 1.3s' }}>
        <text x="125" y="108" fill="#666666" fontSize="8">Hours Worked</text>
        <rect x="125" y="113" width="60" height="22" rx="4" fill="#f8f8f8" stroke="#e0e0e0" strokeWidth="1"/>
        <text x="130" y="127" fill="#1a4731" fontSize="10" fontWeight="500"
          style={{ 
            opacity: isVisible ? 1 : 0,
            animation: isVisible ? 'typeText 0.3s steps(2) 1.8s forwards' : 'none'
          }}>40</text>
      </g>
      
      {/* Pay Period Field */}
      <g style={{ opacity: isVisible ? 1 : 0, transition: 'opacity 0.3s ease-out 1.5s' }}>
        <text x="195" y="108" fill="#666666" fontSize="8">Pay Period</text>
        <rect x="195" y="113" width="55" height="22" rx="4" fill="#f8f8f8" stroke="#e0e0e0" strokeWidth="1"/>
        <text x="200" y="127" fill="#1a4731" fontSize="10" fontWeight="500"
          style={{ 
            opacity: isVisible ? 1 : 0,
            animation: isVisible ? 'typeText 0.5s steps(8) 2s forwards' : 'none'
          }}>Bi-Weekly</text>
      </g>
      
      {/* Gross Pay Display */}
      <g style={{ opacity: 0, animation: isVisible ? 'fadeIn 0.5s ease-out 2.3s forwards' : 'none' }}>
        <rect x="35" y="145" width="100" height="25" rx="4" fill="#e8f5e9" stroke="#1a4731" strokeWidth="1"/>
        <text x="45" y="155" fill="#666666" fontSize="7">GROSS PAY</text>
        <text x="45" y="166" fill="#1a4731" fontSize="11" fontWeight="bold">$1,000.00</text>
      </g>
      
      {/* Net Pay Display */}
      <g style={{ opacity: 0, animation: isVisible ? 'fadeIn 0.5s ease-out 2.5s forwards' : 'none' }}>
        <rect x="145" y="145" width="100" height="25" rx="4" fill="#1a4731"/>
        <text x="155" y="155" fill="#a7f3d0" fontSize="7">NET PAY</text>
        <text x="155" y="166" fill="#ffffff" fontSize="11" fontWeight="bold">$780.00</text>
      </g>
      
      {/* Generate Button */}
      <g style={{ opacity: 0, animation: isVisible ? 'popIn 0.4s ease-out 2.8s forwards' : 'none' }}>
        <rect x="35" y="180" width="210" height="24" rx="12" fill="#1a4731"/>
        <text x="140" y="196" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="bold">✓ GENERATE PAYSTUB</text>
      </g>
      
      {/* Floating elements */}
      <g style={{ opacity: 0, animation: isVisible ? 'floatIn 0.5s ease-out 3s forwards' : 'none' }}>
        {/* Dollar signs floating */}
        <text x="5" y="80" fill="#1a4731" fontSize="14" opacity="0.3">$</text>
        <text x="265" y="120" fill="#1a4731" fontSize="12" opacity="0.3">$</text>
        <text x="10" y="160" fill="#1a4731" fontSize="10" opacity="0.3">$</text>
      </g>
    </svg>
    <style>{`
      @keyframes typeText {
        0% { opacity: 0; }
        100% { opacity: 1; }
      }
      @keyframes blink {
        0%, 50% { opacity: 1; }
        51%, 100% { opacity: 0; }
      }
      @keyframes moveCursor1 {
        0% { transform: translateX(0); }
        100% { transform: translateX(55px); }
      }
      @keyframes floatIn {
        0% { opacity: 0; transform: translateY(10px); }
        100% { opacity: 1; transform: translateY(0); }
      }
    `}</style>
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

export default function Home() {
  const navigate = useNavigate();
  const [activeFeature, setActiveFeature] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  // Animation on mount
  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Auto-rotate features
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % 3);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const features = [
    { icon: CheckCircle, text: "Instant Download", desc: "Get your documents in seconds" },
    { icon: Shield, text: "Secure Payment", desc: "256-bit SSL encryption" },
    { icon: Clock, text: "No Registration", desc: "Start generating immediately" },
  ];

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      <Helmet>
        <title>MintSlip - Professional Instant Paystub & Document Generator | Instant Download</title>
        <meta name="description" content="Generate professional pay stubs, W-2 forms, accountant mockups, 1099s, and more in minutes. No registration required. Trusted by 10,000+ users. Secure PayPal payment." />
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

      {/* Hero Section - Centered */}
      <section className="relative max-w-5xl mx-auto px-6 py-16 md:py-24">
        {/* Background Decorations */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-green-100 rounded-full filter blur-3xl opacity-30 animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-emerald-100 rounded-full filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '1s' }} />
        
        <div className={`relative text-center space-y-8 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-50 to-emerald-50 rounded-full border border-green-200">
            <Sparkles className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-800">Trusted by 10,000+ users</span>
            <div className="flex -space-x-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3 h-3 text-yellow-500 fill-yellow-500" />
              ))}
            </div>
          </div>

          <div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6" style={{ fontFamily: 'Outfit, sans-serif', lineHeight: '1.1' }}>
              <span className="block text-slate-800">Generate</span>
              <span className="block bg-gradient-to-r from-green-700 to-emerald-600 bg-clip-text text-transparent">Professional</span>
              <span className="block text-slate-800">Paystubs in Minutes</span>
            </h1>
            <p className="text-lg md:text-xl leading-relaxed text-slate-600 max-w-2xl mx-auto">
              Create accurate pay stubs, accounting mockups, W-2 forms, and more in minutes. No sign-up required.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => navigate("/paystub-generator")}
              size="lg"
              className="group gap-2 text-lg px-8 py-6 bg-gradient-to-r from-green-700 to-emerald-600 hover:from-green-800 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <FileText className="w-5 h-5" />
              Create Pay Stub
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button
              onClick={() => navigate("/accounting-mockup-generator")}
              size="lg"
              variant="outline"
              className="group gap-2 text-lg px-8 py-6 border-2 border-slate-300 hover:border-green-600 hover:bg-green-50 transition-all duration-300"
            >
              <FileBarChart className="w-5 h-5" />
              Accounting Mockups
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>

          {/* Telegram Support Button */}
          <div className="pt-2">
            <a
              href="https://t.me/+oV7eIADvNlozYTYx"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#0088cc] hover:bg-[#0077b5] text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
            >
              <TelegramIcon className="w-5 h-5" />
              <span className="font-medium">Join Telegram Support</span>
            </a>
          </div>

          {/* Interactive Feature Pills */}
          <div className="flex flex-wrap gap-3 pt-4 justify-center">
            {features.map((feature, index) => (
              <div
                key={index}
                onClick={() => setActiveFeature(index)}
                className={`cursor-pointer inline-flex items-center gap-2 px-4 py-3 rounded-lg border-2 transition-all duration-300 ${
                  activeFeature === index
                    ? 'bg-green-100 border-green-500 shadow-md scale-105'
                    : 'bg-white border-slate-200 hover:border-green-300 hover:bg-green-50'
                }`}
              >
                <feature.icon className={`w-5 h-5 ${activeFeature === index ? 'text-green-700' : 'text-slate-500'}`} />
                <div className="text-left">
                  <span className={`text-sm font-semibold block ${activeFeature === index ? 'text-green-800' : 'text-slate-700'}`}>
                    {feature.text}
                  </span>
                  <span className={`text-xs ${activeFeature === index ? 'text-green-600' : 'text-slate-500'}`}>
                    {feature.desc}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Stats Bar */}
        <div className={`mt-20 grid grid-cols-2 md:grid-cols-4 gap-6 transition-all duration-1000 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          {[
            { number: "50K+", label: "Documents Created" },
            { number: "10K+", label: "Happy Users" },
            { number: "99.9%", label: "Uptime" },
            { number: "24/7", label: "Support" },
          ].map((stat, index) => (
            <div key={index} className="text-center p-4 bg-slate-50 rounded-xl border border-slate-200 hover:border-green-300 hover:shadow-md transition-all">
              <p className="text-3xl font-black text-green-700" style={{ fontFamily: 'Outfit, sans-serif' }}>{stat.number}</p>
              <p className="text-sm text-slate-600 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* What is a Pay stub? Section - with scroll-triggered animation */}
      {(() => {
        const [paystubRef, paystubInView] = useInView();
        return (
          <section ref={paystubRef} className="bg-slate-50 border-y border-slate-200 py-20">
            <div className="max-w-7xl mx-auto px-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl shadow-xl border border-slate-200 h-[450px] flex items-center justify-center overflow-hidden">
                  <PaystubRevealAnimation isVisible={paystubInView} />
                </div>
                <div className="space-y-6">
                  <h3 className="text-3xl md:text-4xl font-black tracking-tight" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
                    What is a Pay Stub?
                  </h3>
                  <p className="text-lg leading-relaxed text-slate-600">
                    A pay stub is a document that summarizes an employee&apos;s pay for a specific pay period. It&apos;s typically created by an employer in conjunction with each paycheck and can be provided in paper or electronic form.
                  </p>
                  <p className="text-base leading-relaxed text-slate-600">
                    Pay stubs are also known as paycheck stubs, check stubs, earnings statements, or pay slips. They show your gross pay, deductions for taxes, insurance, and retirement contributions, resulting in your net pay — the amount you actually take home.
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-700 mt-1 flex-shrink-0" />
                      <span className="text-slate-700">Create accurate income documentation</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-700 mt-1 flex-shrink-0" />
                      <span className="text-slate-700">Essential for tax filing & records</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-700 mt-1 flex-shrink-0" />
                      <span className="text-slate-700">Track earnings & deductions clearly</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </section>
        );
      })()}

      {/* Accurate Income Documentation Section */}
      {(() => {
        const [docRef, docInView] = useInView();
        return (
          <section ref={docRef} className="py-20 bg-white">
            <div className="max-w-7xl mx-auto px-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                <div className="order-2 md:order-1 space-y-6">
                  <p className="text-xs uppercase tracking-widest text-slate-500" style={{ letterSpacing: '0.15em' }}>
                    Accurate Income Documentation
                  </p>
                  <h3 className="text-3xl md:text-4xl font-black tracking-tight" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
                    Our Paystub Generator Has Your Accurate Income Documentation Needs
                  </h3>
                  <p className="text-lg leading-relaxed text-slate-600">
                    MintSlip provides a wide selection of paystub templates to suit your needs. Whether you&apos;re a freelancer, small business owner, or employee, we&apos;ve got you covered with professional, accurate documents.
                  </p>
                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <div className="p-4 bg-green-50 rounded-md border border-green-200">
                      <FileText className="w-8 h-8 text-green-700 mb-2" />
                      <h4 className="font-bold text-slate-800">Earnings Record</h4>
                      <p className="text-sm text-slate-600">Accurate calculations</p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-md border border-green-200">
                      <FileBarChart className="w-8 h-8 text-green-700 mb-2" />
                      <h4 className="font-bold text-slate-800">Tax Filing</h4>
                      <p className="text-sm text-slate-600">Accurate tax records</p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-md border border-green-200">
                      <Shield className="w-8 h-8 text-green-700 mb-2" />
                      <h4 className="font-bold text-slate-800">Business Documentation</h4>
                      <p className="text-sm text-slate-600">Accurate records for freelancers</p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-md border border-green-200">
                      <Clock className="w-8 h-8 text-green-700 mb-2" />
                      <h4 className="font-bold text-slate-800">Instant Generation</h4>
                      <p className="text-sm text-slate-600">Ready in minutes</p>
                    </div>
                  </div>
                </div>
                <div className="order-1 md:order-2">
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-xl border border-slate-200 h-96 flex items-center justify-center">
                    <FormTypingAnimation isVisible={docInView} />
                  </div>
                </div>
              </div>
            </div>
          </section>
        );
      })()}

      {/* Best Pricing Section */}
      <section className="bg-gradient-to-br from-green-900 to-green-800 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-xs uppercase tracking-widest text-green-300 mb-4" style={{ letterSpacing: '0.15em' }}>
              THE BEST PRICING
            </p>
            <h3 className="text-3xl md:text-5xl font-black tracking-tight mb-4 text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>
              We Offer the Best Pricing in The Paystub Generator Industry
            </h3>
            <p className="text-lg text-green-100 max-w-2xl mx-auto">
              Transparent Pricing, Unmatched Value — That&apos;s the MintSlip Promise
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Pay Stub Pricing */}
            <div className="bg-white rounded-lg p-8 text-center shadow-xl">
              <Receipt className="w-12 h-12 text-green-700 mx-auto mb-4" />
              <h4 className="text-2xl font-bold mb-2" style={{ color: '#1a4731' }}>Pay Stub Generator</h4>
              <div className="mb-4">
                <span className="text-5xl font-black" style={{ color: '#1a4731' }}>$9.99</span>
                <span className="text-slate-500 ml-2">/ stub</span>
              </div>
              <ul className="text-left space-y-2 mb-6">
                <li className="flex items-center gap-2 text-slate-600">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>100% Accurate Calculations</span>
                </li>
                <li className="flex items-center gap-2 text-slate-600">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Professional Templates</span>
                </li>
                <li className="flex items-center gap-2 text-slate-600">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Instant PDF Download</span>
                </li>
              </ul>
              <button
                onClick={() => navigate("/paystub-generator")}
                className="w-full py-3 bg-green-800 text-white rounded-md font-semibold hover:bg-green-900 transition-colors"
              >
                Generate Now
              </button>
            </div>

            {/* Canadian Pay Stub Pricing */}
            <div className="bg-white rounded-lg p-8 text-center shadow-xl relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                NEW
              </div>
              <MapPin className="w-12 h-12 text-red-600 mx-auto mb-4" />
              <h4 className="text-2xl font-bold mb-2" style={{ color: '#1a4731' }}>Canadian Pay Stub</h4>
              <div className="mb-4">
                <span className="text-5xl font-black" style={{ color: '#1a4731' }}>$9.99</span>
                <span className="text-slate-500 ml-2">/ stub</span>
              </div>
              <ul className="text-left space-y-2 mb-6">
                <li className="flex items-center gap-2 text-slate-600">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>CPP/QPP & EI Calculations</span>
                </li>
                <li className="flex items-center gap-2 text-slate-600">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>All Provinces & Territories</span>
                </li>
                <li className="flex items-center gap-2 text-slate-600">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Provincial Tax Brackets</span>
                </li>
              </ul>
              <button
                onClick={() => navigate("/canadian-paystub-generator")}
                className="w-full py-3 bg-red-600 text-white rounded-md font-semibold hover:bg-red-700 transition-colors"
              >
                Generate Now
              </button>
            </div>

            {/* accounting mockups Pricing */}
            <div className="bg-white rounded-lg p-8 text-center shadow-xl relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                POPULAR
              </div>
              <PiggyBank className="w-12 h-12 text-green-700 mx-auto mb-4" />
              <h4 className="text-2xl font-bold mb-2" style={{ color: '#1a4731' }}>Accounting Mockups</h4>
              <div className="mb-4">
                <span className="text-5xl font-black" style={{ color: '#1a4731' }}>$49.99</span>
                <span className="text-slate-500 ml-2">/ doc</span>
              </div>
              <ul className="text-left space-y-2 mb-6">
                <li className="flex items-center gap-2 text-slate-600">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Full Transaction History</span>
                </li>
                <li className="flex items-center gap-2 text-slate-600">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Multiple Templates</span>
                </li>
                <li className="flex items-center gap-2 text-slate-600">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Professional Formatting</span>
                </li>
              </ul>
              <button
                onClick={() => navigate("/accounting-mockup-generator")}
                className="w-full py-3 bg-green-800 text-white rounded-md font-semibold hover:bg-green-900 transition-colors"
              >
                Generate Now
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Solution Section */}
      {(() => {
        const [quickSolutionRef, quickSolutionInView] = useInView();
        return (
          <section ref={quickSolutionRef} className="py-20 bg-white">
            <div className="max-w-7xl mx-auto px-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                {/* Left Content - appears below animation on mobile */}
                <div className="space-y-6 order-2 lg:order-1">
                  <span className="inline-block text-sm font-semibold text-green-700 bg-green-100 px-4 py-1.5 rounded-full">
                    Quick Solution
                  </span>
                  <h3 className="text-3xl md:text-4xl font-black tracking-tight leading-tight" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a1a1a' }}>
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
                  </h3>
                  <p className="text-lg text-slate-600 leading-relaxed">
                    With MintSlip, you can instantly create accurate paycheck stubs for any situation. Our platform simplifies the process, offering customized pay stubs ready for use in minutes. Choose from PDF or other digital file types for fast, secure download.
                  </p>
                  <p className="text-lg text-slate-600 leading-relaxed">
                    Whether you need detailed pay stubs or record keeping, MintSlip makes it quick and easy to create accurate and reliable paycheck documentation anytime.
                  </p>
                  <button 
                    onClick={() => navigate("/paystub-generator")}
                    className="inline-flex items-center gap-2 bg-green-800 hover:bg-green-900 text-white font-semibold px-8 py-4 rounded-full transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    Get Your Pay Stub Now
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
                
                {/* Right - Animation - appears above text on mobile */}
                <div className="flex justify-center items-center order-1 lg:order-2">
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl overflow-hidden h-96 w-full shadow-lg flex items-center justify-center">
                    <EnvelopeAnimation isVisible={quickSolutionInView} />
                  </div>
                </div>
              </div>
            </div>
          </section>
        );
      })()}

      {/* Steps to Use Section */}
      <section className="py-20 bg-slate-50 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-6">
          <h3 className="text-3xl md:text-5xl font-black tracking-tight mb-16 text-center" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
            Steps to use our Check Stub Maker
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="flex flex-col">
              <div className="bg-slate-white rounded-2xl p-6 flex-1">
                <div className="relative">
                  <div className="absolute -top-2 -left-2 z-10">
                    <span className="bg-red-500 text-white font-bold px-4 py-1.5 rounded text-sm shadow-lg">
                      STEP 1
                    </span>
                  </div>
                  <div className="bg-white rounded-lg overflow-hidden h-64 w-full">
                    <img src={select} />
                  </div>
                </div>
              </div>
              <p className="text-lg mt-6 text-center text-slate-700" style={{ fontFamily: 'Outfit, sans-serif' }}>
                Choose a pay stub template from our meticulously designed templates
              </p>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col">
              <div className="bg-slate-white rounded-2xl p-6 flex-1">
                <div className="relative">
                  <div className="absolute -top-2 -left-2 z-10">
                    <span className="bg-yellow-500 text-white font-bold px-4 py-1.5 rounded text-sm shadow-lg">
                      STEP 2
                    </span>
                  </div>
                  <div className="bg-white rounded-lg overflow-hidden h-64 w-full">
                    <img src={inputInfo} />
                  </div>
                </div>
              </div>
              <p className="text-lg mt-6 text-center text-slate-700" style={{ fontFamily: 'Outfit, sans-serif' }}>
                Enter Information such as company name, your work schedule and salary details
              </p>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col">
              <div className="bg-slate-white rounded-2xl p-6 flex-1">
                <div className="relative">
                  <div className="absolute -top-2 -left-2 z-10">
                    <span className="bg-green-500 text-white font-bold px-4 py-1.5 rounded text-sm shadow-lg">
                      STEP 3
                    </span>
                  </div>
                  <div className="bg-white rounded-lg overflow-hidden h-64 w-full">
                    <img src={download} />
                  </div>
                </div>
              </div>
              <p className="text-lg mt-6 text-center text-slate-700" style={{ fontFamily: 'Outfit, sans-serif' }}>
                Download your paycheck stubs directly to your computer or mobile device in PDF format
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Our Paystub Generator Section */}
      {(() => {
        const [whyChooseRef, whyChooseInView] = useInView();
        return (
          <section ref={whyChooseRef} className="py-20 bg-white">
            <div className="max-w-7xl mx-auto px-6">
              {/* Top Section - Why Choose Us (Full Width) */}
              <div className="bg-slate-50 rounded-2xl p-8 md:p-12 mb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                  <div className="space-y-6 order-2 md:order-1">
                    <h3 className="text-3xl md:text-4xl font-black tracking-tight" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a1a1a' }}>
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
                    </h3>
                    <p className="text-lg leading-relaxed text-slate-600">
                      Unlike other paystub generators that rely on generic, outdated templates, our paystub generator delivers meticulously designed paystub templates built for a modern, professional look. Each pay stub template is crafted for clarity, accuracy, and real world usability. Our advanced pay stub calculator makes generating accurate, professional pay stubs fast, easy, and problem-free.
                    </p>
                    <ul className="space-y-3">
                      <li className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                        <span className="text-slate-700">Lightning-Fast Paystub Generation</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                        <span className="text-slate-700">Top-Notch Customer Support</span>
                      </li>
                    </ul>
                  </div>
                  <div className="flex justify-center items-center order-1 md:order-2">
                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg overflow-hidden h-72 w-full shadow-lg flex items-center justify-center">
                      <SpeedServiceAnimation isVisible={whyChooseInView} />
                    </div>
                  </div>
                </div>
              </div>

          {/* Bottom Section - Two Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Instant Download Card */}
            <div className="bg-green-50 rounded-2xl p-8 overflow-hidden">
              <h4 className="text-2xl md:text-3xl font-black mb-2 text-center" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a1a1a' }}>
                Instant Download
              </h4>
              <p className="text-slate-600 mb-4 text-center">
                Download your generated documents immediately after creation
              </p>
              <div className="relative">
                <div className="bg-gradient-to-br from-white to-green-50 rounded-lg overflow-hidden shadow-lg h-64 flex items-center justify-center">
                  <InstantDownloadAnimation isVisible={whyChooseInView} />
                </div>
              </div>
            </div>

            {/* No Data Stored Card */}
            <div className="bg-red-50 rounded-2xl p-8 overflow-hidden">
              <h4 className="text-2xl md:text-3xl font-black mb-2 text-center" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a1a1a' }}>
                No Data Stored
              </h4>
              <p className="text-slate-600 mb-4 text-center">
                We don’t save your personal information or generated documents
              </p>
              <div className="relative">
                <div className="bg-gradient-to-br from-white to-red-50 rounded-lg overflow-hidden shadow-lg h-64 flex items-center justify-center">
                  <NoDataStoredAnimation isVisible={whyChooseInView} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
        );
      })()}

      {/* Document Selection Grid */}
      <section className="max-w-7xl mx-auto px-6 py-32">
        <div className="text-center mb-16">
          <h3 className="text-3xl md:text-5xl font-black tracking-tight mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Choose Your Document
          </h3>
          <p className="text-lg text-slate-600">Select the document type you need to generate</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Pay Stub Card */}
          <button
            data-testid="paystub-card-button"
            onClick={() => navigate("/paystub-generator")}
            className="group relative p-8 md:p-12 bg-white border-2 border-slate-200 rounded-md hover:border-green-800 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 text-left"
          >
            <div className="absolute top-6 right-6 w-16 h-16 rounded-full bg-green-50 flex items-center justify-center group-hover:bg-green-800 transition-colors">
              <Receipt className="w-8 h-8 text-green-800 group-hover:text-white transition-colors" />
            </div>
            
            <div className="space-y-4">
              <h4 className="text-2xl md:text-3xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
                Pay Stub Generator
              </h4>
              <p className="text-slate-600 text-base leading-relaxed pr-16">
                Generate professional pay stubs with accurate tax calculations, direct deposit information, and customizable pay periods.
              </p>
              <div className="pt-4">
                <div className="inline-flex items-center gap-2">
                  <span className="text-3xl font-black" style={{ color: '#1a4731' }}>$9.99</span>
                  <span className="text-slate-500">per document</span>
                </div>
              </div>
            </div>
          </button>

          {/* Canadian Pay Stub Card */}
          <button
            data-testid="canadian-paystub-card-button"
            onClick={() => navigate("/canadian-paystub-generator")}
            className="group relative p-8 md:p-12 bg-white border-2 border-slate-200 rounded-md hover:border-green-800 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 text-left"
          >
            <span className="absolute top-4 left-4 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">NEW</span>
            <div className="absolute top-6 right-6 w-16 h-16 rounded-full bg-red-50 flex items-center justify-center group-hover:bg-red-600 transition-colors">
              <MapPin className="w-8 h-8 text-red-600 group-hover:text-white transition-colors" />
            </div>
            
            <div className="space-y-4">
              <h4 className="text-2xl md:text-3xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
                Canadian Pay Stub Generator
              </h4>
              <p className="text-slate-600 text-base leading-relaxed pr-16">
                Generate Canadian pay stubs with accurate CPP/QPP, EI, and provincial tax calculations for all provinces and territories.
              </p>
              <div className="pt-4">
                <div className="inline-flex items-center gap-2">
                  <span className="text-3xl font-black" style={{ color: '#1a4731' }}>$9.99</span>
                  <span className="text-slate-500">per document</span>
                </div>
              </div>
            </div>
          </button>

          {/* accounting mockups Card */}
          <button
            data-testid="accountingmockup-card-button"
            onClick={() => navigate("/accounting-mockup-generator")}
            className="group relative p-8 md:p-12 bg-white border-2 border-slate-200 rounded-md hover:border-green-800 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 text-left"
          >
            <div className="absolute top-6 right-6 w-16 h-16 rounded-full bg-green-50 flex items-center justify-center group-hover:bg-green-800 transition-colors">
              <PiggyBank className="w-8 h-8 text-green-800 group-hover:text-white transition-colors" />
            </div>
            
            <div className="space-y-4">
              <h4 className="text-2xl md:text-3xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
                Accounting Mockups Generator
              </h4>
              <p className="text-slate-600 text-base leading-relaxed pr-16">
                Generate statement templates for personal bookkeeping and organizational purposes.
              </p>
              <div className="pt-4">
                <div className="inline-flex items-center gap-2">
                  <span className="text-3xl font-black" style={{ color: '#1a4731' }}>$49.99</span>
                  <span className="text-slate-500">per statement</span>
                </div>
              </div>
            </div>
          </button>

           {/* W-2 Card */}
          <button
            data-testid="w2-card-button"
            onClick={() => navigate("/w2-generator")}
            className="group relative p-8 md:p-12 bg-white border-2 border-slate-200 rounded-md hover:border-green-800 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 text-left"
          >
            <div className="absolute top-6 right-6 w-16 h-16 rounded-full bg-green-50 flex items-center justify-center group-hover:bg-green-800 transition-colors">
              <Calendar className="w-8 h-8 text-green-800 group-hover:text-white transition-colors" />
            </div>
            
            <div className="space-y-4">
              <h4 className="text-2xl md:text-3xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
                W-2 Form Generator
              </h4>
              <p className="text-slate-600 text-base leading-relaxed pr-16">
                Create fully detailed W-2 forms with accurate wage information, tax breakdowns, employer/employee details, and clean, professional formatting.
              </p>
              <div className="pt-4">
                <div className="inline-flex items-center gap-2">
                  <span className="text-3xl font-black" style={{ color: '#1a4731' }}>$14.99</span>
                  <span className="text-slate-500">per document</span>
                </div>
              </div>
            </div>
          </button>

          {/* W-9 Card */}
          <button
            data-testid="w9-card-button"
            onClick={() => navigate("/w9-generator")}
            className="group relative p-8 md:p-12 bg-white border-2 border-slate-200 rounded-md hover:border-green-800 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 text-left"
          >
            <div className="absolute top-6 right-6 w-16 h-16 rounded-full bg-green-50 flex items-center justify-center group-hover:bg-green-800 transition-colors">
              <ClipboardList className="w-8 h-8 text-green-800 group-hover:text-white transition-colors" />
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h4 className="text-2xl md:text-3xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
                  W-9 Form Generator
                </h4>
              </div>
              <p className="text-slate-600 text-base leading-relaxed pr-16">
                Generate W-9 Request for Taxpayer Identification Number and Certification forms with all required fields.
              </p>
              <div className="pt-4">
                <div className="inline-flex items-center gap-2">
                  <span className="text-3xl font-black" style={{ color: '#1a4731' }}>$9.99</span>
                  <span className="text-slate-500">per document</span>
                </div>
              </div>
            </div>
          </button>

          {/* 1099-NEC Card */}
          <button
            data-testid="1099nec-card-button"
            onClick={() => navigate("/1099-nec-generator")}
            className="group relative p-8 md:p-12 bg-white border-2 border-slate-200 rounded-md hover:border-green-800 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 text-left"
          >
            <div className="absolute top-6 right-6 w-16 h-16 rounded-full bg-green-50 flex items-center justify-center group-hover:bg-green-800 transition-colors">
              <Users className="w-8 h-8 text-green-800 group-hover:text-white transition-colors" />
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h4 className="text-2xl md:text-3xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
                  1099-NEC Generator
                </h4>
              </div>
              <p className="text-slate-600 text-base leading-relaxed pr-16">
                Generate 1099-NEC forms for nonemployee compensation. Perfect for contractor and freelancer payments.
              </p>
              <div className="pt-4">
                <div className="inline-flex items-center gap-2">
                  <span className="text-3xl font-black" style={{ color: '#1a4731' }}>$9.99</span>
                  <span className="text-slate-500">per document</span>
                </div>
              </div>
            </div>
          </button>

          {/* 1099-MISC Card */}
          <button
            data-testid="1099misc-card-button"
            onClick={() => navigate("/1099-misc-generator")}
            className="group relative p-8 md:p-12 bg-white border-2 border-slate-200 rounded-md hover:border-green-800 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 text-left"
          >
            <div className="absolute top-6 right-6 w-16 h-16 rounded-full bg-green-50 flex items-center justify-center group-hover:bg-green-800 transition-colors">
              <Landmark className="w-8 h-8 text-green-800 group-hover:text-white transition-colors" />
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h4 className="text-2xl md:text-3xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
                  1099-MISC Generator
                </h4>
              </div>
              <p className="text-slate-600 text-base leading-relaxed pr-16">
                Generate 1099-MISC forms for rents, royalties, prizes, awards, medical payments, and more.
              </p>
              <div className="pt-4">
                <div className="inline-flex items-center gap-2">
                  <span className="text-3xl font-black" style={{ color: '#1a4731' }}>$9.99</span>
                  <span className="text-slate-500">per document</span>
                </div>
              </div>
            </div>
          </button>

          {/* Offer Letter Card */}
          <button
            data-testid="offer-letter-card-button"
            onClick={() => navigate("/offer-letter-generator")}
            className="group relative p-8 md:p-12 bg-white border-2 border-slate-200 rounded-md hover:border-green-800 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 text-left"
          >
            <div className="absolute top-6 right-6 w-16 h-16 rounded-full bg-green-50 flex items-center justify-center group-hover:bg-green-800 transition-colors">
              <Mail className="w-8 h-8 text-green-800 group-hover:text-white transition-colors" />
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h4 className="text-2xl md:text-3xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
                  Offer Letter Generator
                </h4>
              </div>
              <p className="text-slate-600 text-base leading-relaxed pr-16">
                Create professional employment offer letters with 3 customizable templates and signature lines.
              </p>
              <div className="pt-4">
                <div className="inline-flex items-center gap-2">
                  <span className="text-3xl font-black" style={{ color: '#1a4731' }}>$9.99</span>
                  <span className="text-slate-500">per document</span>
                </div>
              </div>
            </div>
          </button>

          {/* Schedule C Card */}
          <button
            data-testid="schedulec-card-button"
            onClick={() => navigate("/schedule-c-generator")}
            className="group relative p-8 md:p-12 bg-white border-2 border-slate-200 rounded-md hover:border-green-800 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 text-left"
          >
            <div className="absolute top-6 right-6 w-16 h-16 rounded-full bg-green-50 flex items-center justify-center group-hover:bg-green-800 transition-colors">
              <FileBarChart className="w-8 h-8 text-green-800 group-hover:text-white transition-colors" />
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h4 className="text-2xl md:text-3xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
                  Schedule C Generator
                </h4>
              </div>
              <p className="text-slate-600 text-base leading-relaxed pr-16">
                Generate Schedule C forms for sole proprietors with complete income, expenses, and profit/loss calculations.
              </p>
              <div className="pt-4">
                <div className="inline-flex items-center gap-2">
                  <span className="text-3xl font-black" style={{ color: '#1a4731' }}>$9.99</span>
                  <span className="text-slate-500">per document</span>
                </div>
              </div>
            </div>
          </button>

          {/* Vehicle Bill of Sale Card */}
          <button
            data-testid="vehicle-bill-of-sale-card-button"
            onClick={() => navigate("/vehicle-bill-of-sale-generator")}
            className="group relative p-8 md:p-12 bg-white border-2 border-slate-200 rounded-md hover:border-green-800 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 text-left"
          >
            <div className="absolute top-6 right-6 w-16 h-16 rounded-full bg-green-50 flex items-center justify-center group-hover:bg-green-800 transition-colors">
              <Car className="w-8 h-8 text-green-800 group-hover:text-white transition-colors" />
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h4 className="text-2xl md:text-3xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
                  Vehicle Bill of Sale Generator
                </h4>
              </div>
              <p className="text-slate-600 text-base leading-relaxed pr-16">
                Create professional vehicle bill of sale documents with seller/buyer info, vehicle details, and optional notary section.
              </p>
              <div className="pt-4">
                <div className="inline-flex items-center gap-2">
                  <span className="text-3xl font-black" style={{ color: '#1a4731' }}>$9.99</span>
                  <span className="text-slate-500">per document</span>
                </div>
              </div>
            </div>
          </button>

          {/* Service Expense Bill Card */}
          <button
            data-testid="service-expense-l-card-button"
            onClick={() => navigate("/service-expense-generator")}
            className="group relative p-8 md:p-12 bg-white border-2 border-slate-200 rounded-md hover:border-green-800 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 text-left"
          >
            <div className="absolute top-6 right-6 w-16 h-16 rounded-full bg-green-50 flex items-center justify-center group-hover:bg-green-800 transition-colors">
              <Zap className="w-8 h-8 text-green-800 group-hover:text-white transition-colors" />
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h4 className="text-2xl md:text-3xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
                  Service Expense Generator
                </h4>
              </div>
              <p className="text-slate-600 text-base leading-relaxed pr-16">
                Generate professional service expense statements for home budgeting, and more with custom logos and 3 template styles.
              </p>
              <div className="pt-4">
                <div className="inline-flex items-center gap-2">
                  <span className="text-3xl font-black" style={{ color: '#1a4731' }}>$49.99</span>
                  <span className="text-slate-500">per statement</span>
                </div>
              </div>
            </div>
          </button>

        </div>
      </section>

      {/* Trust Section - Secure & Instant */}
      {(() => {
        const [trustRef, trustInView] = useInView();
        return (
          <section ref={trustRef} className="bg-slate-50 border-y border-slate-200 py-20">
            <div className="max-w-7xl mx-auto px-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                <div className="order-2 md:order-1">
                  <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl shadow-xl border border-slate-200 h-[400px] flex items-center justify-center overflow-hidden">
                    <SecureInstantAnimation isVisible={trustInView} />
                  </div>
                </div>
                <div className="space-y-6 order-1 md:order-2">
                  <h3 className="text-3xl md:text-4xl font-black tracking-tight" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
                    Secure & Instant
                  </h3>
                  <p className="text-lg leading-relaxed text-slate-600">
                    Your payment is processed securely through PayPal. Once payment is confirmed, your document is generated and downloaded immediately.
                  </p>
                  <ul className="space-y-4">
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-700 mt-1 flex-shrink-0" />
                      <span className="text-slate-700">Industry-standard encryption</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-700 mt-1 flex-shrink-0" />
                      <span className="text-slate-700">No data storage after download</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-700 mt-1 flex-shrink-0" />
                      <span className="text-slate-700">Instant PDF generation</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </section>
        );
      })()}

      <Footer />
    </div>
  );
}
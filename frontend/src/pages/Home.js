import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { Helmet } from "react-helmet-async";
import { FileText, FileBarChart, CheckCircle, Shield, Clock, PiggyBank, Calendar, Receipt, ArrowRight, Sparkles, Zap, Star, MessageCircle, ClipboardList, Users, Landmark, Mail, Car } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Example from '../assests/paystub.png';
import secure from '../assests/secure.png';
import Paystub from '../assests/paystub.png';

// Telegram icon SVG component
const TelegramIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
  </svg>
);

// Envelope Animation Component
const EnvelopeAnimation = ({ isVisible }) => (
  <div className="relative w-full h-full flex items-center justify-center">
    <svg viewBox="0 0 200 200" className="w-64 h-64">
      {/* Envelope body */}
      <rect 
        x="30" y="70" width="140" height="100" rx="8" 
        fill="#e8f5e9" 
        stroke="#1a4731" 
        strokeWidth="3"
      />
      {/* Envelope flap */}
      <path 
        d="M30,70 L100,120 L170,70" 
        fill="none" 
        stroke="#1a4731" 
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Letter/Document */}
      <g className={isVisible ? 'animate-letter' : ''}>
        <rect 
          x="50" y="40" width="100" height="70" rx="4" 
          fill="#ffffff" 
          stroke="#1a4731" 
          strokeWidth="2"
          className={isVisible ? 'letter-slide' : ''}
        />
        {/* Lines on letter */}
        <line x1="60" y1="55" x2="140" y2="55" stroke="#1a4731" strokeWidth="2" opacity="0.3"/>
        <line x1="60" y1="70" x2="130" y2="70" stroke="#1a4731" strokeWidth="2" opacity="0.3"/>
        <line x1="60" y1="85" x2="120" y2="85" stroke="#1a4731" strokeWidth="2" opacity="0.3"/>
      </g>
      {/* Checkmark */}
      <circle 
        cx="100" cy="130" r="25" 
        fill="#1a4731"
        className={isVisible ? 'checkmark-circle' : ''}
        style={{ opacity: 0 }}
      />
      <path 
        d="M88,130 L96,140 L115,118" 
        fill="none" 
        stroke="#ffffff" 
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={isVisible ? 'checkmark-path' : ''}
        style={{ 
          strokeDasharray: 50, 
          strokeDashoffset: isVisible ? 0 : 50,
          opacity: 0
        }}
      />
    </svg>
    <style>{`
      .letter-slide {
        animation: slideDown 0.8s ease-out forwards;
      }
      .checkmark-circle {
        animation: fadeInScale 0.4s ease-out 0.8s forwards;
      }
      .checkmark-path {
        animation: drawCheck 0.4s ease-out 1s forwards;
      }
      @keyframes slideDown {
        0% { transform: translateY(-30px); }
        100% { transform: translateY(0); }
      }
      @keyframes fadeInScale {
        0% { opacity: 0; transform: scale(0); }
        100% { opacity: 1; transform: scale(1); }
      }
      @keyframes drawCheck {
        0% { stroke-dashoffset: 50; opacity: 0; }
        1% { opacity: 1; }
        100% { stroke-dashoffset: 0; opacity: 1; }
      }
    `}</style>
  </div>
);

// Lightning Fast & Customer Service Animation Component
const SpeedServiceAnimation = ({ isVisible }) => (
  <div className="relative w-full h-full flex items-center justify-center">
    <svg viewBox="0 0 240 200" className="w-72 h-72">
      {/* Stopwatch/Clock - representing speed */}
      <g className={isVisible ? 'animate-clock' : ''} style={{ opacity: isVisible ? 1 : 0 }}>
        {/* Clock body */}
        <circle cx="70" cy="100" r="45" fill="#e8f5e9" stroke="#1a4731" strokeWidth="3"/>
        {/* Clock inner circle */}
        <circle cx="70" cy="100" r="35" fill="#ffffff" stroke="#1a4731" strokeWidth="2"/>
        {/* Clock top button */}
        <rect x="65" y="50" width="10" height="8" rx="2" fill="#1a4731"/>
        {/* Clock center dot */}
        <circle cx="70" cy="100" r="4" fill="#1a4731"/>
        {/* Clock hand - animated */}
        <line 
          x1="70" y1="100" x2="70" y2="72" 
          stroke="#1a4731" 
          strokeWidth="3" 
          strokeLinecap="round"
          style={{
            transformOrigin: '70px 100px',
            animation: isVisible ? 'spinFast 0.8s ease-out forwards' : 'none'
          }}
        />
        {/* Speed lines */}
        <g style={{ opacity: isVisible ? 1 : 0, animation: isVisible ? 'fadeIn 0.3s ease-out 0.5s forwards' : 'none' }}>
          <line x1="125" y1="85" x2="140" y2="85" stroke="#1a4731" strokeWidth="2" strokeLinecap="round"/>
          <line x1="125" y1="100" x2="145" y2="100" stroke="#1a4731" strokeWidth="2" strokeLinecap="round"/>
          <line x1="125" y1="115" x2="140" y2="115" stroke="#1a4731" strokeWidth="2" strokeLinecap="round"/>
        </g>
      </g>

      {/* Lightning bolt */}
      <g style={{ opacity: 0, animation: isVisible ? 'boltFlash 0.6s ease-out 0.3s forwards' : 'none' }}>
        <path 
          d="M150,60 L135,95 L150,95 L130,140 L155,100 L140,100 Z" 
          fill="#1a4731"
          stroke="#1a4731"
          strokeWidth="1"
        />
      </g>

      {/* Customer Service Rep - Headset person */}
      <g className={isVisible ? 'animate-support' : ''} style={{ opacity: 0, animation: isVisible ? 'slideInRight 0.5s ease-out 0.6s forwards' : 'none' }}>
        {/* Head */}
        <circle cx="190" cy="110" r="25" fill="#e8f5e9" stroke="#1a4731" strokeWidth="3"/>
        {/* Smile */}
        <path d="M180,118 Q190,128 200,118" fill="none" stroke="#1a4731" strokeWidth="2" strokeLinecap="round"/>
        {/* Eyes */}
        <circle cx="182" cy="105" r="3" fill="#1a4731"/>
        <circle cx="198" cy="105" r="3" fill="#1a4731"/>
        {/* Headset band */}
        <path d="M165,100 Q165,75 190,75 Q215,75 215,100" fill="none" stroke="#1a4731" strokeWidth="3" strokeLinecap="round"/>
        {/* Headset ear pieces */}
        <rect x="160" y="95" width="10" height="20" rx="3" fill="#1a4731"/>
        <rect x="210" y="95" width="10" height="20" rx="3" fill="#1a4731"/>
        {/* Microphone */}
        <path d="M160,110 Q150,110 150,125 L150,130" fill="none" stroke="#1a4731" strokeWidth="3" strokeLinecap="round"/>
        <circle cx="150" cy="133" r="5" fill="#1a4731"/>
      </g>

      {/* Speech bubble with checkmark */}
      <g style={{ opacity: 0, animation: isVisible ? 'popIn 0.4s ease-out 1s forwards' : 'none' }}>
        {/* Bubble */}
        <path d="M195,50 Q195,32 215,32 L240,32 Q258,32 258,50 L258,68 Q258,86 240,86 L215,86 L205,98 L210,86 Q195,86 195,68 Z" fill="#1a4731"/>
        {/* Circle around checkmark */}
        <circle cx="226" cy="59" r="18" fill="#ffffff" opacity="0.2"/>
        <circle cx="226" cy="59" r="14" fill="none" stroke="#ffffff" strokeWidth="2"/>
        {/* Checkmark in bubble */}
        <path 
          d="M218,59 L224,66 L236,52" 
          fill="none" 
          stroke="#ffffff" 
          strokeWidth="3" 
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            strokeDasharray: 40,
            strokeDashoffset: isVisible ? 0 : 40,
            transition: 'stroke-dashoffset 0.4s ease-out 1.2s'
          }}
        />
      </g>

      {/* "FAST" text badge */}
      <g style={{ opacity: 0, animation: isVisible ? 'fadeIn 0.3s ease-out 0.8s forwards' : 'none' }}>
        <rect x="45" y="150" width="50" height="20" rx="10" fill="#1a4731"/>
        <text x="70" y="164" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="bold">FAST</text>
      </g>
    </svg>
    <style>{`
      @keyframes spinFast {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(720deg); }
      }
      @keyframes fadeIn {
        0% { opacity: 0; }
        100% { opacity: 1; }
      }
      @keyframes boltFlash {
        0% { opacity: 0; transform: scale(0.5); }
        50% { opacity: 1; transform: scale(1.2); }
        100% { opacity: 1; transform: scale(1); }
      }
      @keyframes slideInRight {
        0% { opacity: 0; transform: translateX(30px); }
        100% { opacity: 1; transform: translateX(0); }
      }
      @keyframes popIn {
        0% { opacity: 0; transform: scale(0); }
        70% { transform: scale(1.1); }
        100% { opacity: 1; transform: scale(1); }
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

      {/* Hero Section - Enhanced */}
      <section className="relative max-w-7xl mx-auto px-6 py-16 md:py-24">
        {/* Background Decorations */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-green-100 rounded-full filter blur-3xl opacity-30 animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-emerald-100 rounded-full filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '1s' }} />
        
        <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left: Hero Content */}
          <div className={`lg:col-span-7 space-y-8 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
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
              <p className="text-lg md:text-xl leading-relaxed text-slate-600 max-w-xl">
                Create accurate pay stubs, accounting mockups, W-2 forms, and more in minutes. No sign-up required.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
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
            <div className="flex flex-wrap gap-3 pt-4">
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

          {/* Right: Visual Element - Enhanced */}
          <div className={`lg:col-span-5 transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}>
            <div className="relative">
              {/* Main Image */}
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-white">
                <img
                  src={Example}
                  alt="Professional document example"
                  className="w-full h-auto transform hover:scale-105 transition-transform duration-500"
                />
                {/* Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
              </div>

              {/* Floating Elements - Over the image with z-index */}
              <div className="absolute -top-4 -left-4 z-20 bg-white p-3 rounded-lg shadow-lg border border-slate-200 animate-bounce" style={{ animationDuration: '3s' }}>
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  <span className="text-sm font-semibold text-slate-700">Instant</span>
                </div>
              </div>
              
              <div className="absolute -bottom-4 -right-4 z-20 bg-white p-3 rounded-lg shadow-lg border border-slate-200 animate-bounce" style={{ animationDuration: '3s', animationDelay: '1s' }}>
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-semibold text-slate-700">Secure</span>
                </div>
              </div>

              {/* Stats Badge - Over the image */}
              <div className="absolute top-1/2 -left-8 z-20 transform -translate-y-1/2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-lg shadow-lg hidden md:block">
                <p className="text-2xl font-bold">$10-$100</p>
                <p className="text-xs opacity-90">Per Document</p>
              </div>

              {/* Document Count - Over the image */}
              <div className="absolute -bottom-6 left-1/2 z-20 transform -translate-x-1/2 bg-white px-6 py-3 rounded-full shadow-lg border border-slate-200">
                <p className="text-sm text-slate-600">
                  <span className="font-bold text-green-700">50,000+</span> documents generated
                </p>
              </div>
            </div>
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

      {/* What is a Pay stub? Section */}
      <section className="bg-slate-50 border-y border-slate-200 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <img
                src={Paystub}
                alt="What is a pay stub"
                className="w-full h-auto rounded-md shadow-xl border border-slate-300 object-cover max-h-96"
              />
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
                <span className="text-5xl font-black" style={{ color: '#1a4731' }}>$10</span>
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

            {/* accounting mockups Pricing */}
            <div className="bg-white rounded-lg p-8 text-center shadow-xl relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                POPULAR
              </div>
              <PiggyBank className="w-12 h-12 text-green-700 mx-auto mb-4" />
              <h4 className="text-2xl font-bold mb-2" style={{ color: '#1a4731' }}>Accounting Mockups Generator</h4>
              <div className="mb-4">
                <span className="text-5xl font-black" style={{ color: '#1a4731' }}>$50-70</span>
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

            {/* W-2 Pricing */}
            <div className="bg-white rounded-lg p-8 text-center shadow-xl">
              <Calendar className="w-12 h-12 text-green-700 mx-auto mb-4" />
              <h4 className="text-2xl font-bold mb-2" style={{ color: '#1a4731' }}>W-2 Form Generator</h4>
              <div className="mb-4">
                <span className="text-5xl font-black" style={{ color: '#1a4731' }}>$15</span>
                <span className="text-slate-500 ml-2">/ form</span>
              </div>
              <ul className="text-left space-y-2 mb-6">
                <li className="flex items-center gap-2 text-slate-600">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Compliant Format</span>
                </li>
                <li className="flex items-center gap-2 text-slate-600">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>All Standard W-2 Boxes</span>
                </li>
                <li className="flex items-center gap-2 text-slate-600">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Auto-Calculate Taxes</span>
                </li>
              </ul>
              <button
                onClick={() => navigate("/w2-generator")}
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
                {/* Left Content */}
                <div className="space-y-6">
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
                    Whether you need detailed pay stubs or proof of income, MintSlip makes it quick and easy to create accurate and reliable paycheck documentation anytime.
                  </p>
                  <button 
                    onClick={() => navigate("/paystub-generator")}
                    className="inline-flex items-center gap-2 bg-green-800 hover:bg-green-900 text-white font-semibold px-8 py-4 rounded-full transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    Get Your Pay Stub Now
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
                
                {/* Right - Envelope Animation */}
                <div className="flex justify-center items-center">
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
              <div className="bg-slate-800 rounded-2xl p-6 flex-1">
                <div className="relative">
                  <div className="absolute -top-2 -left-2 z-10">
                    <span className="bg-red-500 text-white font-bold px-4 py-1.5 rounded text-sm shadow-lg">
                      STEP 1
                    </span>
                  </div>
                  <div className="bg-white rounded-lg overflow-hidden h-64 w-full">
                    {/* Placeholder for Step 1 image */}
                  </div>
                </div>
              </div>
              <p className="text-lg mt-6 text-center text-slate-700" style={{ fontFamily: 'Outfit, sans-serif' }}>
                Choose a pay stub template from our 10 designs
              </p>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col">
              <div className="bg-slate-800 rounded-2xl p-6 flex-1">
                <div className="relative">
                  <div className="absolute -top-2 -left-2 z-10">
                    <span className="bg-yellow-500 text-white font-bold px-4 py-1.5 rounded text-sm shadow-lg">
                      STEP 2
                    </span>
                  </div>
                  <div className="bg-white rounded-lg overflow-hidden h-64 w-full">
                    {/* Placeholder for Step 2 image */}
                  </div>
                </div>
              </div>
              <p className="text-lg mt-6 text-center text-slate-700" style={{ fontFamily: 'Outfit, sans-serif' }}>
                Enter Information such as company name, your work schedule and salary details
              </p>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col">
              <div className="bg-slate-800 rounded-2xl p-6 flex-1">
                <div className="relative">
                  <div className="absolute -top-2 -left-2 z-10">
                    <span className="bg-green-500 text-white font-bold px-4 py-1.5 rounded text-sm shadow-lg">
                      STEP 3
                    </span>
                  </div>
                  <div className="bg-white rounded-lg overflow-hidden h-64 w-full">
                    {/* Placeholder for Step 3 image */}
                  </div>
                </div>
              </div>
              <p className="text-lg mt-6 text-center text-slate-700" style={{ fontFamily: 'Outfit, sans-serif' }}>
                Download your paycheck stubs directly from your email in PDF format
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
                  <div className="space-y-6">
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
                      Our paystub generator, unlike any other online paystub maker, is problem free. In less than two minutes, you can complete your pay stub by simply entering your company name and salary details. Our efficient pay stub calculator software makes it quick and easy for you to get professional results.
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
                  <div className="flex justify-center items-center">
                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg overflow-hidden h-72 w-full shadow-lg flex items-center justify-center">
                      <SpeedServiceAnimation isVisible={whyChooseInView} />
                    </div>
                  </div>
                </div>
              </div>

          {/* Bottom Section - Two Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Personal Profile Card */}
            <div className="bg-green-50 rounded-2xl p-8 pb-0 overflow-hidden">
              <h4 className="text-2xl md:text-3xl font-black mb-2 text-center" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a1a1a' }}>
                Personal Profile
              </h4>
              <p className="text-slate-600 mb-6 text-center">
                Where you can download all your old document
              </p>
              <div className="relative">
                <div className="bg-white rounded-t-lg overflow-hidden shadow-lg h-64 translate-y-4">
                  {/* Placeholder for profile dashboard image */}
                </div>
              </div>
            </div>

            {/* 10% Off Card */}
            <div className="bg-red-50 rounded-2xl p-8 pb-0 overflow-hidden">
              <h4 className="text-2xl md:text-3xl font-black mb-2 text-center" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a1a1a' }}>
                10% Off First Time
              </h4>
              <p className="text-slate-600 mb-6 text-center">
                Use coupon code: <span className="font-bold">WELCOME10</span>
              </p>
              <div className="relative">
                <div className="bg-white rounded-t-lg overflow-hidden shadow-lg h-64 translate-y-4">
                  {/* Placeholder for checkout/coupon image */}
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
                  <span className="text-3xl font-black" style={{ color: '#1a4731' }}>$10</span>
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
                  <span className="text-3xl font-black" style={{ color: '#1a4731' }}>$50-$70</span>
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
                  <span className="text-3xl font-black" style={{ color: '#1a4731' }}>$15</span>
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
                  <span className="text-3xl font-black" style={{ color: '#1a4731' }}>$10</span>
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
                  <span className="text-3xl font-black" style={{ color: '#1a4731' }}>$10</span>
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
                  <span className="text-3xl font-black" style={{ color: '#1a4731' }}>$10</span>
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
                  <span className="text-3xl font-black" style={{ color: '#1a4731' }}>$10</span>
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
                  <span className="text-3xl font-black" style={{ color: '#1a4731' }}>$15</span>
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
                  <span className="text-3xl font-black" style={{ color: '#1a4731' }}>$10</span>
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
                Generate professional service expense statements for electric, gas, water, internet, and more with custom logos and 3 template styles.
              </p>
              <div className="pt-4">
                <div className="inline-flex items-center gap-2">
                  <span className="text-3xl font-black" style={{ color: '#1a4731' }}>$50</span>
                  <span className="text-slate-500">per statement</span>
                </div>
              </div>
            </div>
          </button>

        </div>
      </section>

      {/* Trust Section */}
      <section className="bg-slate-50 border-y border-slate-200 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <img
                src={secure}
                alt="Secure payment"
                className="w-full h-auto rounded-md shadow-xl border border-slate-300"
              />
            </div>
            <div className="space-y-6">
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

      <Footer />
    </div>
  );
}
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { Helmet } from "react-helmet-async";
import { FileText, FileBarChart, CheckCircle, Shield, Clock, PiggyBank, Calendar, Receipt, ArrowRight, ArrowUp, Sparkles, Zap, MessageCircle, ClipboardList, Users, Landmark, Mail, Car, MapPin, TreePine, Eye, Download, Lock, Check, X } from "lucide-react";
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
// Compressed 480px JPEGs (the source PNGs are ~2MB each — they made the
// mobile homepage crawl; these are ~35KB)
import EmilyPhoto from '../assests/images/Emily.jpg';
import JakePhoto from '../assests/images/Jake.jpg';
import KevinPhoto from '../assests/images/Kevin.jpg';
import SophiaPhoto from '../assests/images/Sophia.jpg';
import LeftLeaf from '../assests/images/left-leaf.avif';
import RightLeaf from '../assests/images/right-leaf.avif';

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
      loading="lazy"
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

// Custom hook for intersection observer.
// Threshold is deliberately tiny: several sections are 2-3x the viewport on
// mobile, so a 0.3 ratio is nearly unreachable there and the section would
// stay invisible (opacity-0) — reading as a giant blank gap while scrolling.
const useInView = (options = {}) => {
  const ref = useRef(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsInView(true);
        observer.disconnect();
      }
    }, { threshold: 0.05, ...options });

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

// iOS status bar shared by the hero phone and the How-it-works phone cards.
// `dark` matches the strip to a dark app screen behind it (the hero iframe
// renders in the visitor's saved /app theme).
const StatusBar = ({ dark = false }) => (
  <div className={`relative flex items-center justify-between text-[13px] font-semibold pt-3 px-5 ${dark ? 'text-white' : 'text-slate-900'}`}>
    <span>9:41</span>
    <span className="absolute left-1/2 -translate-x-1/2 top-[10px] w-24 h-[26px] bg-[#111] rounded-full" aria-hidden="true" />
    <span className="flex items-center gap-1.5" aria-hidden="true">
      <svg width="17" height="11" viewBox="0 0 17 11" fill="currentColor"><rect x="0" y="7" width="3" height="4" rx="1" /><rect x="4.5" y="5" width="3" height="6" rx="1" /><rect x="9" y="2.5" width="3" height="8.5" rx="1" /><rect x="13.5" y="0" width="3" height="11" rx="1" /></svg>
      <svg width="15" height="11" viewBox="0 0 15 11" fill="currentColor"><path d="M7.5 10 L10 7.4 A3.8 3.8 0 0 0 5 7.4 Z" /><path d="M2.9 5.2 A6.8 6.8 0 0 1 12.1 5.2 L10.6 6.8 A4.8 4.8 0 0 0 4.4 6.8 Z" /><path d="M0.6 2.8 A10 10 0 0 1 14.4 2.8 L12.9 4.4 A7.9 7.9 0 0 0 2.1 4.4 Z" /></svg>
      <svg width="25" height="12" viewBox="0 0 25 12"><rect x="0.5" y="0.5" width="21" height="11" rx="3.5" fill="none" stroke="currentColor" opacity="0.4" /><rect x="2" y="2" width="18" height="8" rx="2" fill="currentColor" /><path d="M23 4 A2.2 2.2 0 0 1 23 8 Z" fill="currentColor" opacity="0.4" /></svg>
    </span>
  </div>
);

// Live product preview for the hero: the REAL /app/paystubs page running in
// an iframe inside the iPhone frame, with the create form opened via
// ?heroPreview=1. Non-interactive (pointer-events none) — it is a preview.
export default function Home() {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  // The hero phone's iframe renders in the visitor's saved /app theme
  const heroAppDark = (() => {
    try { return localStorage.getItem("appDarkMode") === "true"; } catch { return false; }
  })();
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

      {/* Hero Section — Kikoff-style: centered headline + CTA, then a bento
          grid of stat cards around one live /app phone. */}
      <section className="relative max-w-[1288px] mx-auto px-6 pt-14 pb-20 md:pt-20 md:pb-24">
        <div className={`relative transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          {/* Centered headline with the mint sparkle */}
          <h1 className="font-display text-center text-4xl sm:text-5xl lg:text-6xl font-medium tracking-tight text-slate-900 mb-5" style={{ lineHeight: 1.08 }}>
            Create <span className="font-black text-emerald-700">documents</span> in minutes
            <svg className="inline-block w-7 h-7 md:w-9 md:h-9 ml-2 align-super text-emerald-400" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 0 C13 7 17 11 24 12 C17 13 13 17 12 24 C11 17 7 13 0 12 C7 11 11 7 12 0 Z" />
            </svg>
          </h1>
          <p className="text-center text-lg md:text-xl leading-relaxed text-slate-600 max-w-2xl mx-auto mb-8">
            Create accurate pay stubs, ATS-optimized resumes, W-2 forms, and more in minutes. No sign-up required.
          </p>

          {/* CTA */}
          <div className="flex justify-center mb-4">
            <Button
              onClick={() => navigate("/app")}
              size="lg"
              className="cta-shine group gap-2 text-base px-8 py-6 rounded-xl bg-emerald-700 hover:bg-emerald-800 shadow-md shadow-emerald-900/10 hover:shadow-lg hover:shadow-emerald-900/15 transition-all duration-200"
            >
              <FileText className="w-5 h-5" />
              Create Pay Stub
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
            </Button>
          </div>
          <p className="text-center text-slate-500 mb-14">Instant download. No sign-up required.</p>

          {/* Bento grid around the phone */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr_1.05fr_1fr] gap-5">
            {/* Mint headline stat */}
            <div className="lg:col-span-2 rounded-[28px] bg-emerald-400 px-8 py-14 flex flex-col items-center justify-center text-center">
              <span className="font-display font-black text-6xl md:text-7xl text-slate-900">1,000+</span>
              <span className="mt-4 text-lg text-emerald-950 max-w-md">people just like you have created professional documents with MintSlip</span>
            </div>

            {/* Pricing */}
            <div className="rounded-[28px] bg-slate-100 px-8 py-14 flex flex-col items-center justify-center text-center lg:col-start-4 lg:row-start-1">
              <span className="text-xl text-slate-800">Documents start at</span>
              <span className="font-display font-black text-6xl md:text-7xl text-slate-900 my-2">$9.99</span>
              <span className="text-xl text-slate-800">each</span>
            </div>

            {/* Document count */}
            <div className="rounded-[28px] bg-[#0b0b0b] px-8 py-14 flex flex-col items-center justify-center text-center lg:col-start-1 lg:row-start-2">
              <span className="font-display font-black text-6xl md:text-7xl text-white">15<span className="text-emerald-400">+</span></span>
              <span className="mt-3 text-lg text-slate-300">document types ready to generate</span>
            </div>

            {/* Tagline */}
            <div className="rounded-[28px] bg-slate-100 px-8 py-14 flex items-center justify-center lg:col-start-2 lg:row-start-2">
              <span className="font-display text-4xl md:text-5xl text-slate-900 font-medium text-center leading-tight">One form.<br />Done in minutes.</span>
            </div>

            {/* Live /app phone */}
            <div className="relative flex items-center justify-center lg:col-start-3 lg:row-start-1 lg:row-span-2 py-6 lg:py-0">
              <div className="relative bg-[#111] rounded-[48px] p-[10px] shadow-2xl pointer-events-none select-none" aria-hidden="true">
                <div className="rounded-[40px] overflow-hidden relative" style={{ background: heroAppDark ? '#1e1e1e' : '#ffffff', width: 280 }}>
                  <StatusBar dark={heroAppDark} />
                  <iframe
                    src="/app"
                    title="Live MintSlip app"
                    loading="lazy"
                    scrolling="no"
                    tabIndex={-1}
                    className="w-full border-0 block"
                    style={{ height: 596 }}
                  />
                </div>
              </div>
            </div>

            {/* Brand gauge */}
            <div className="rounded-[28px] bg-[#0b0b0b] px-8 py-14 flex items-center justify-center lg:col-start-4 lg:row-start-2">
              <div className="relative w-40 h-40 flex items-center justify-center">
                <svg viewBox="0 0 160 160" className="absolute inset-0 w-full h-full" aria-hidden="true">
                  <circle cx="80" cy="80" r="66" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="14" strokeLinecap="round" strokeDasharray="300 500" transform="rotate(115 80 80)" />
                  <circle cx="80" cy="80" r="66" fill="none" stroke="#34d399" strokeWidth="14" strokeLinecap="round" strokeDasharray="110 500" transform="rotate(115 80 80)" />
                </svg>
                <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center overflow-hidden">
                  <img src={MintSlipLogo} alt="MintSlip" className="w-16 h-auto" />
                </div>
              </div>
            </div>
          </div>
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

      {/* How it works — Kikoff-style: three gray cards, each with a step
          bubble and a cropped iPhone mockup walking the MintSlip flow. */}
      {(() => {
        const [howRef, howInView] = useInView();
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

      {/* How MintSlip compares — whodat's landing compare table in the mint
          palette: green gradient check pills with the looping shine, gray X
          or muted text for the Others column. */}
      {(() => {
        const [compareRef, compareInView] = useInView();
        const rows = [
          ["Automatic tax & deduction math", "Some"],
          ["Modern, professional templates", "no"],
          ["Instant PDF download", "Some"],
          ["No account or subscription required", "no"],
          ["Live human support", "Varies"],
        ];
        return (
          <section id="compare" ref={compareRef} className="py-20 md:py-24 bg-white scroll-mt-24">
            <div className="max-w-[1288px] mx-auto px-6">
              <h2 className={`font-display text-center text-4xl md:text-5xl lg:text-6xl tracking-tight text-slate-900 font-medium mb-6 transition-all duration-700 ${compareInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
                How <span className="font-black">MintSlip</span> compares to others.
              </h2>
              <p className={`text-center text-lg md:text-xl text-slate-600 max-w-2xl mx-auto mb-12 transition-all duration-700 delay-100 ${compareInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
                Most generators hand you a generic template and leave the math to you. MintSlip calculates everything, looks professional, and downloads instantly.
              </p>

              <div className={`overflow-x-auto transition-all duration-700 delay-200 ${compareInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                <div className="rounded-[20px] border border-slate-200 overflow-hidden bg-white min-w-[520px] max-w-4xl mx-auto">
                  <table className="w-full border-collapse text-[15px]">
                    <thead>
                      <tr>
                        <th className="px-5 md:px-6 py-4 text-left bg-slate-50 font-medium text-slate-900 border-b border-slate-200">Capability</th>
                        <th className="px-5 md:px-6 py-4 text-center bg-slate-50 font-medium text-slate-900 border-b border-slate-200 w-[150px]">MintSlip</th>
                        <th className="px-5 md:px-6 py-4 text-center bg-slate-50 font-medium text-slate-900 border-b border-slate-200 w-[150px]">Others</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map(([cap, o], i) => {
                        const bb = i === rows.length - 1 ? "" : " border-b border-slate-200";
                        return (
                          <tr key={cap}>
                            <td className={`px-5 md:px-6 py-4 text-slate-800${bb}`}>{cap}</td>
                            <td className={`px-5 md:px-6 py-4 text-center${bb}`}>
                              <span
                                className="cta-shine inline-flex items-center justify-center min-w-[96px] h-9 px-5 rounded-full text-white"
                                style={{ background: 'linear-gradient(180deg, #34d399, #10b981)', boxShadow: '0 8px 20px rgba(16, 185, 129, 0.38), inset 0 1px 0 rgba(255, 255, 255, 0.4)' }}
                                aria-label="Yes"
                              >
                                <Check className="w-5 h-5" strokeWidth={3} />
                              </span>
                            </td>
                            <td className={`px-5 md:px-6 py-4 text-center${bb}`}>
                              {o === "no"
                                ? <X className="w-5 h-5 text-slate-300 inline" strokeWidth={2.5} aria-label="No" />
                                : <span className="text-sm text-slate-500">{o}</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </section>
        );
      })()}

      {/* Latest Blog Posts Section — hidden unless the admin turns it on in
          Site Settings (homepage_sections.showBlog). */}
      {(() => {
        const [blogRef, blogInView] = useInView();
        const [latestPosts, setLatestPosts] = useState([]);
        const [isLoadingPosts, setIsLoadingPosts] = useState(true);
        const [showBlog, setShowBlog] = useState(false);
        const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";

        useEffect(() => {
          fetch(`${BACKEND_URL}/api/homepage-sections`)
            .then((r) => (r.ok ? r.json() : null))
            .then((d) => { if (d?.sections?.showBlog) setShowBlog(true); })
            .catch(() => {});
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

        // Hidden until the admin toggle says otherwise; also skip when empty
        if (!showBlog) return null;
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
          <section id="reviews" ref={trustRef} className="bg-white py-20 md:py-24 scroll-mt-24">
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
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

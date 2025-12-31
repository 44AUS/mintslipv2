import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import {
  Sparkles, FileText, Download, CheckCircle, Shield, Clock, Zap, Star,
  ArrowRight, Target, Brain, Wand2, Upload, Layers, Award, Users,
  ChevronDown, ChevronUp, Briefcase, GraduationCap, TrendingUp,
  FileCheck, Layout, PenTool, Globe, Lock, RefreshCw
} from "lucide-react";

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
    }, { threshold: 0.2, ...options });

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return [ref, isInView];
};

// Animated counter component
const AnimatedCounter = ({ end, duration = 2000, suffix = "" }) => {
  const [count, setCount] = useState(0);
  const [ref, isInView] = useInView();

  useEffect(() => {
    if (!isInView) return;
    
    let startTime = null;
    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [isInView, end, duration]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
};

// FAQ Accordion Item
const FAQItem = ({ question, answer, isOpen, onClick }) => (
  <div className="border-b border-slate-200">
    <button
      onClick={onClick}
      className="w-full py-5 px-6 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
    >
      <span className="font-semibold text-slate-800 pr-4">{question}</span>
      {isOpen ? (
        <ChevronUp className="w-5 h-5 text-emerald-600 flex-shrink-0" />
      ) : (
        <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0" />
      )}
    </button>
    {isOpen && (
      <div className="px-6 pb-5 text-slate-600 leading-relaxed">
        {answer}
      </div>
    )}
  </div>
);

// Template Preview Card
const TemplateCard = ({ name, description, color, popular }) => (
  <div className="group relative bg-white rounded-xl border-2 border-slate-200 hover:border-emerald-500 transition-all duration-300 overflow-hidden hover:shadow-xl">
    {popular && (
      <div className="absolute top-3 right-3 bg-emerald-500 text-white text-xs font-bold px-2 py-1 rounded-full z-10">
        POPULAR
      </div>
    )}
    <div className="p-6">
      {/* Mock resume preview */}
      <div className="aspect-[8.5/11] bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden mb-4">
        <div className={`h-12 ${color}`}></div>
        <div className="p-3 space-y-2">
          <div className="h-3 bg-slate-800 rounded w-3/4"></div>
          <div className="h-2 bg-slate-300 rounded w-1/2"></div>
          <div className="mt-3 space-y-1.5">
            <div className="h-2 bg-slate-200 rounded"></div>
            <div className="h-2 bg-slate-200 rounded w-5/6"></div>
            <div className="h-2 bg-slate-200 rounded w-4/6"></div>
          </div>
          <div className="mt-3 space-y-1.5">
            <div className="h-2 bg-slate-100 rounded"></div>
            <div className="h-2 bg-slate-100 rounded w-5/6"></div>
          </div>
        </div>
      </div>
      <h3 className="font-bold text-slate-800">{name}</h3>
      <p className="text-sm text-slate-500 mt-1">{description}</p>
    </div>
    <div className="absolute inset-0 bg-emerald-600/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
      <Button className="bg-white text-emerald-700 hover:bg-emerald-50">
        Use This Template
      </Button>
    </div>
  </div>
);

export default function AIResumeLanding() {
  const navigate = useNavigate();
  const [openFAQ, setOpenFAQ] = useState(0);
  const [heroRef, heroInView] = useInView();
  const [featuresRef, featuresInView] = useInView();
  const [howItWorksRef, howItWorksInView] = useInView();

  const faqs = [
    {
      question: "How does the AI Resume Builder work?",
      answer: "Our AI Resume Builder uses advanced artificial intelligence (powered by GPT-4) to analyze your work experience, skills, and target job description. It then generates optimized bullet points, professional summaries, and suggests relevant keywords to help your resume pass ATS screening systems and impress hiring managers."
    },
    {
      question: "Is the AI Resume Builder free to use?",
      answer: "You can start building your resume for free and preview your AI-optimized content. To download your completed resume in PDF and DOCX formats, a one-time payment of $9.99 is required. This includes unlimited revisions and regenerations."
    },
    {
      question: "What makes your AI different from other resume builders?",
      answer: "Our AI is specifically trained on thousands of successful resumes across industries. It doesn't just fill in templates—it tailors content to your target job, optimizes for ATS compatibility, provides an ATS score, and suggests improvements. Plus, it can analyze job descriptions to highlight matching keywords."
    },
    {
      question: "Can I upload my existing resume?",
      answer: "Yes! You can upload your existing resume in PDF or DOCX format. Our AI will parse it, extract your information, and auto-fill the form fields. You can then enhance and optimize your content with AI-powered suggestions."
    },
    {
      question: "What file formats can I download?",
      answer: "After payment, you can download your resume as a professional PDF and editable DOCX file. Both formats are optimized for ATS systems and print-ready."
    },
    {
      question: "Are the resumes ATS-friendly?",
      answer: "Absolutely! All our templates are designed with ATS (Applicant Tracking System) compatibility in mind. We use clean formatting, standard fonts, and proper heading structures that ATS software can easily parse. Our AI also includes relevant keywords to improve your chances."
    },
    {
      question: "Can I customize fonts and layouts?",
      answer: "Yes! You can choose from multiple professional fonts (Montserrat, Times New Roman, Calibri, Arial, Helvetica), three template styles (ATS Optimized, Modern, Classic), and layout options. You can also enable a one-page mode for concise resumes."
    },
    {
      question: "How long does it take to create a resume?",
      answer: "Most users complete their AI-optimized resume in under 10 minutes. Simply enter your information, let the AI enhance your content, preview, and download. It's that fast!"
    }
  ];

  const features = [
    {
      icon: Brain,
      title: "AI-Powered Content",
      description: "GPT-4 analyzes your experience and generates compelling, job-specific bullet points and summaries."
    },
    {
      icon: Target,
      title: "ATS Optimization",
      description: "Get an ATS compatibility score and keyword suggestions to pass automated screening systems."
    },
    {
      icon: Upload,
      title: "Resume Upload",
      description: "Upload your existing resume and let our AI extract and enhance your information automatically."
    },
    {
      icon: Layers,
      title: "Multiple Templates",
      description: "Choose from professional, ATS-friendly templates designed by career experts."
    },
    {
      icon: PenTool,
      title: "Custom Fonts",
      description: "Select from 5 professional fonts with embedded PDF support for consistent rendering."
    },
    {
      icon: RefreshCw,
      title: "Unlimited Regeneration",
      description: "Not satisfied? Regenerate any section unlimited times until it's perfect."
    },
    {
      icon: FileCheck,
      title: "Instant Preview",
      description: "See real-time previews of your resume as you build it. No surprises."
    },
    {
      icon: Lock,
      title: "Secure & Private",
      description: "Your data is encrypted and never shared. We respect your privacy."
    }
  ];

  const steps = [
    {
      number: "01",
      title: "Enter Your Information",
      description: "Fill in your personal details, work experience, education, and skills. Upload an existing resume to auto-fill.",
      icon: FileText
    },
    {
      number: "02",
      title: "Add Your Target Job",
      description: "Paste the job description you're applying for. Our AI analyzes it to tailor your resume content.",
      icon: Briefcase
    },
    {
      number: "03",
      title: "Let AI Optimize",
      description: "Click generate and watch as AI creates compelling bullet points, summaries, and keyword-optimized content.",
      icon: Sparkles
    },
    {
      number: "04",
      title: "Download & Apply",
      description: "Preview, customize, and download your professional resume in PDF and DOCX formats.",
      icon: Download
    }
  ];

  const testimonials = [
    {
      name: "Sarah M.",
      role: "Marketing Manager",
      company: "Hired at Fortune 500",
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face",
      quote: "The AI suggestions were incredibly relevant to my industry. I got 3 interview calls within a week of using my new resume!",
      rating: 5
    },
    {
      name: "James K.",
      role: "Software Engineer",
      company: "Landed Dream Job",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
      quote: "Finally, a resume builder that understands tech roles. The ATS optimization feature is a game-changer.",
      rating: 5
    },
    {
      name: "Emily R.",
      role: "Recent Graduate",
      company: "First Job Success",
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
      quote: "As a new grad with limited experience, the AI helped me highlight transferable skills I didn't know I had.",
      rating: 5
    }
  ];

  const templates = [
    { name: "ATS Optimized", description: "Clean, scannable format", color: "bg-slate-800", popular: true },
    { name: "Modern Professional", description: "Contemporary with accent colors", color: "bg-emerald-600", popular: false },
    { name: "Classic Executive", description: "Traditional formal style", color: "bg-slate-700", popular: false }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>Free AI Resume Builder 2025 | Create ATS-Optimized Resumes | MintSlip</title>
        <meta name="description" content="Build a professional, ATS-optimized resume in minutes with our free AI Resume Builder. GPT-4 powered content generation, multiple templates, instant download. Land your dream job faster!" />
        <meta name="keywords" content="AI resume builder, free resume builder, ATS resume, resume generator, resume maker, professional resume, job application, career, CV builder, resume templates 2025" />
        <meta property="og:title" content="Free AI Resume Builder 2025 | Create ATS-Optimized Resumes" />
        <meta property="og:description" content="Build a professional, ATS-optimized resume in minutes with AI. GPT-4 powered content, multiple templates, instant PDF download." />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Free AI Resume Builder 2025 | MintSlip" />
        <meta name="twitter:description" content="Create ATS-optimized resumes with AI. Land more interviews with professionally crafted content." />
        <link rel="canonical" href="https://mintslip.com/resume-builder" />
        
        {/* Schema.org structured data */}
        <script type="application/ld+json">{`
          {
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "MintSlip AI Resume Builder",
            "applicationCategory": "BusinessApplication",
            "operatingSystem": "Web",
            "offers": {
              "@type": "Offer",
              "price": "9.99",
              "priceCurrency": "USD"
            },
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": "4.8",
              "ratingCount": "2847"
            },
            "description": "AI-powered resume builder that creates ATS-optimized professional resumes in minutes."
          }
        `}</script>
      </Helmet>

      <Header />

      {/* Hero Section */}
      <section 
        ref={heroRef}
        className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 text-white"
      >
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-500/20 rounded-full filter blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/10 rounded-full filter blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-600/5 rounded-full filter blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 py-20 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left content */}
            <div className={`space-y-8 transition-all duration-1000 ${heroInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-medium text-emerald-300">AI-Powered Resume Builder</span>
                <span className="px-2 py-0.5 bg-emerald-500 text-white text-xs font-bold rounded-full">2025</span>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
                Create an{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
                  ATS-Optimized
                </span>{" "}
                Resume in Minutes
              </h1>

              <p className="text-lg md:text-xl text-slate-300 leading-relaxed max-w-xl">
                Let AI craft compelling content tailored to your target job. Our GPT-4 powered builder helps you 
                <span className="text-emerald-400 font-semibold"> land 3x more interviews</span> with professionally optimized resumes.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={() => navigate("/ai-resume-builder")}
                  size="lg"
                  className="group gap-2 text-lg px-8 py-6 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 transition-all duration-300"
                >
                  <Wand2 className="w-5 h-5" />
                  Build My Resume Free
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button
                  onClick={() => navigate("/ai-resume-builder")}
                  size="lg"
                  variant="outline"
                  className="group gap-2 text-lg px-8 py-6 border-2 border-white/30 text-white hover:bg-white/10 transition-all duration-300"
                >
                  <Upload className="w-5 h-5" />
                  Upload Existing Resume
                </Button>
              </div>

              {/* Trust indicators */}
              <div className="flex flex-wrap items-center gap-6 pt-4">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                    ))}
                  </div>
                  <span className="text-sm text-slate-300">4.8/5 from 2,847 reviews</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-300">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span>No credit card required</span>
                </div>
              </div>
            </div>

            {/* Right content - Resume preview mockup */}
            <div className={`relative transition-all duration-1000 delay-300 ${heroInView ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}>
              <div className="relative">
                {/* Glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-2xl blur-2xl opacity-30" />
                
                {/* Resume mockup */}
                <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden">
                  {/* Header */}
                  <div className="bg-slate-800 p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center">
                        <span className="text-2xl font-bold text-white">JD</span>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">John Doe</h3>
                        <p className="text-emerald-400">Senior Software Engineer</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="p-6 space-y-4">
                    {/* AI indicator */}
                    <div className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full w-fit">
                      <Sparkles className="w-4 h-4" />
                      <span className="font-medium">AI-Enhanced Content</span>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="h-3 bg-slate-200 rounded w-full animate-pulse"></div>
                      <div className="h-3 bg-slate-200 rounded w-5/6 animate-pulse" style={{ animationDelay: '0.1s' }}></div>
                      <div className="h-3 bg-slate-200 rounded w-4/6 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    
                    <div className="pt-2 space-y-2">
                      <div className="h-2 bg-slate-100 rounded"></div>
                      <div className="h-2 bg-slate-100 rounded w-5/6"></div>
                      <div className="h-2 bg-slate-100 rounded w-4/5"></div>
                    </div>
                    
                    {/* ATS Score */}
                    <div className="flex items-center justify-between bg-slate-50 p-4 rounded-lg mt-4">
                      <span className="font-semibold text-slate-700">ATS Score</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div className="w-[92%] h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full"></div>
                        </div>
                        <span className="font-bold text-emerald-600">92%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating badges */}
                <div className="absolute -top-4 -right-4 bg-white rounded-lg shadow-lg px-3 py-2 flex items-center gap-2 animate-bounce" style={{ animationDuration: '3s' }}>
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                  <span className="text-sm font-semibold text-slate-700">ATS Approved</span>
                </div>
                
                <div className="absolute -bottom-4 -left-4 bg-white rounded-lg shadow-lg px-3 py-2 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  <span className="text-sm font-semibold text-slate-700">Ready in 5 min</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 50L60 45C120 40 240 30 360 25C480 20 600 20 720 30C840 40 960 60 1080 65C1200 70 1320 60 1380 55L1440 50V100H1380C1320 100 1200 100 1080 100C960 100 840 100 720 100C600 100 480 100 360 100C240 100 120 100 60 100H0V50Z" fill="white"/>
          </svg>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: 50000, suffix: "+", label: "Resumes Created" },
              { value: 92, suffix: "%", label: "Avg. ATS Score" },
              { value: 10000, suffix: "+", label: "Job Offers" },
              { value: 5, suffix: " min", label: "Average Time" }
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <p className="text-3xl md:text-4xl font-black text-emerald-600">
                  <AnimatedCounter end={stat.value} suffix={stat.suffix} />
                </p>
                <p className="text-slate-600 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section ref={howItWorksRef} className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 bg-emerald-100 text-emerald-700 text-sm font-semibold rounded-full mb-4">
              HOW IT WORKS
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-slate-800 mb-4">
              Build Your Resume in 4 Easy Steps
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Our AI-powered process makes resume creation effortless. From data entry to download, 
              you'll have a professional resume in minutes.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div 
                key={index}
                className={`relative transition-all duration-700 ${howItWorksInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
                style={{ transitionDelay: `${index * 150}ms` }}
              >
                {/* Connector line */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-12 left-[60%] w-full h-0.5 bg-gradient-to-r from-emerald-300 to-transparent" />
                )}
                
                <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow border border-slate-100 relative z-10">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/30">
                      <step.icon className="w-6 h-6" />
                    </div>
                    <span className="text-4xl font-black text-slate-200">{step.number}</span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">{step.title}</h3>
                  <p className="text-slate-600">{step.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button
              onClick={() => navigate("/ai-resume-builder")}
              size="lg"
              className="gap-2 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 shadow-lg"
            >
              Start Building Now
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section ref={featuresRef} className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 bg-emerald-100 text-emerald-700 text-sm font-semibold rounded-full mb-4">
              POWERFUL FEATURES
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-slate-800 mb-4">
              Everything You Need to Land Your Dream Job
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Our AI Resume Builder comes packed with features designed to give you a competitive edge.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div 
                key={index}
                className={`group p-6 rounded-2xl border border-slate-200 hover:border-emerald-300 hover:shadow-lg transition-all duration-500 bg-white ${featuresInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className="w-12 h-12 bg-emerald-100 group-hover:bg-emerald-500 rounded-xl flex items-center justify-center mb-4 transition-colors">
                  <feature.icon className="w-6 h-6 text-emerald-600 group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">{feature.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Demo Section */}
      <section className="py-20 bg-gradient-to-br from-slate-900 to-slate-800 text-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-block px-4 py-1.5 bg-emerald-500/20 text-emerald-400 text-sm font-semibold rounded-full mb-4">
                AI-POWERED
              </span>
              <h2 className="text-3xl md:text-4xl font-black mb-6">
                Let AI Write Your{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
                  Perfect Bullet Points
                </span>
              </h2>
              <p className="text-lg text-slate-300 mb-8 leading-relaxed">
                Simply describe your role and responsibilities, and our AI will generate compelling, 
                achievement-focused bullet points optimized for ATS systems and hiring managers.
              </p>

              <div className="space-y-4">
                {[
                  "Tailored to your target job description",
                  "Uses powerful action verbs and metrics",
                  "Optimized with industry-specific keywords",
                  "Regenerate until you're satisfied"
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-slate-300">{item}</span>
                  </div>
                ))}
              </div>

              <Button
                onClick={() => navigate("/ai-resume-builder")}
                size="lg"
                className="mt-8 gap-2 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600"
              >
                <Sparkles className="w-5 h-5" />
                Try AI Generation
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>

            <div className="bg-slate-800/50 backdrop-blur rounded-2xl p-6 border border-slate-700">
              {/* Input */}
              <div className="mb-6">
                <label className="text-sm text-slate-400 mb-2 block">Your Input:</label>
                <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                  <p className="text-slate-300">"managed team of developers, worked on web applications"</p>
                </div>
              </div>

              {/* AI Output */}
              <div>
                <label className="text-sm text-emerald-400 mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  AI-Generated:
                </label>
                <div className="bg-emerald-900/30 rounded-lg p-4 border border-emerald-700/50 space-y-3">
                  {[
                    "Led cross-functional team of 8 developers, delivering 15+ web applications with 99.9% uptime",
                    "Spearheaded agile transformation, reducing sprint cycle time by 40% and increasing team velocity",
                    "Architected scalable microservices infrastructure serving 100K+ daily active users"
                  ].map((bullet, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <span className="text-emerald-400 mt-1">•</span>
                      <p className="text-white">{bullet}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Templates Section */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 bg-emerald-100 text-emerald-700 text-sm font-semibold rounded-full mb-4">
              PROFESSIONAL TEMPLATES
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-slate-800 mb-4">
              Choose Your Perfect Template
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              All templates are ATS-friendly and designed by career experts to help you stand out.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {templates.map((template, index) => (
              <div 
                key={index} 
                className="cursor-pointer"
                onClick={() => navigate("/ai-resume-builder")}
              >
                <TemplateCard {...template} />
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button
              onClick={() => navigate("/ai-resume-builder")}
              size="lg"
              variant="outline"
              className="gap-2 border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-50"
            >
              <Layout className="w-4 h-4" />
              View All Templates
            </Button>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 bg-emerald-100 text-emerald-700 text-sm font-semibold rounded-full mb-4">
              SUCCESS STORIES
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-slate-800 mb-4">
              Join Thousands of Happy Job Seekers
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              See how our AI Resume Builder has helped professionals land their dream jobs.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div 
                key={index}
                className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100 hover:shadow-xl transition-shadow"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-slate-700 mb-6 leading-relaxed">"{testimonial.quote}"</p>
                <div className="flex items-center gap-4">
                  <img 
                    src={testimonial.image} 
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-bold text-slate-800">{testimonial.name}</p>
                    <p className="text-sm text-slate-500">{testimonial.role}</p>
                    <p className="text-sm text-emerald-600 font-medium">{testimonial.company}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 bg-emerald-100 text-emerald-700 text-sm font-semibold rounded-full mb-4">
              FAQ
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-slate-800 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-slate-600">
              Everything you need to know about our AI Resume Builder.
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
            {faqs.map((faq, index) => (
              <FAQItem
                key={index}
                question={faq.question}
                answer={faq.answer}
                isOpen={openFAQ === index}
                onClick={() => setOpenFAQ(openFAQ === index ? -1 : index)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 bg-gradient-to-br from-emerald-600 to-cyan-600 text-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-5xl font-black mb-6">
            Ready to Build Your Winning Resume?
          </h2>
          <p className="text-xl text-emerald-100 mb-8 max-w-2xl mx-auto">
            Join over 50,000 job seekers who've landed interviews with our AI-powered resume builder. 
            Start for free today!
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => navigate("/ai-resume-builder")}
              size="lg"
              className="gap-2 text-lg px-10 py-7 bg-white text-emerald-700 hover:bg-emerald-50 shadow-xl"
            >
              <Wand2 className="w-5 h-5" />
              Build My Resume Free
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex flex-wrap justify-center gap-6 mt-8 text-sm text-emerald-100">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>Ready in 5 minutes</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span>100% secure</span>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

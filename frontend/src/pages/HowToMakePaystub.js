import { useNavigate, Link } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { Helmet } from "react-helmet-async";
import { 
  FileText, 
  CheckCircle, 
  Shield, 
  Clock, 
  ArrowRight, 
  Star, 
  Download,
  Building2,
  User,
  DollarSign,
  Calendar,
  Calculator,
  ChevronDown,
  ChevronUp,
  FileBarChart,
  Receipt,
  Briefcase,
  HelpCircle,
  Zap,
  MousePointer,
  Edit3,
  CreditCard
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import select from '../assests/select.png';
import inputInfo from '../assests/inputInfo.png';
import download from '../assests/download.png';

// FAQ Accordion Component
const FAQItem = ({ question, answer, isOpen, onClick }) => (
  <div className="border border-slate-200 rounded-lg overflow-hidden mb-3">
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between p-4 text-left bg-white hover:bg-slate-50 transition-colors"
    >
      <span className="font-semibold text-slate-800 pr-4">{question}</span>
      {isOpen ? (
        <ChevronUp className="w-5 h-5 text-green-600 flex-shrink-0" />
      ) : (
        <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0" />
      )}
    </button>
    {isOpen && (
      <div className="px-4 pb-4 bg-white">
        <p className="text-slate-600 leading-relaxed">{answer}</p>
      </div>
    )}
  </div>
);

// Internal Link Card Component
const InternalLinkCard = ({ title, description, path, icon: Icon }) => {
  const navigate = useNavigate();
  return (
    <div 
      onClick={() => navigate(path)}
      className="group bg-white border border-slate-200 rounded-xl p-5 cursor-pointer hover:border-green-400 hover:shadow-lg transition-all duration-300"
    >
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition-colors">
          <Icon className="w-6 h-6 text-green-700" />
        </div>
        <div className="flex-1">
          <h4 className="font-bold text-slate-800 group-hover:text-green-700 transition-colors mb-1">{title}</h4>
          <p className="text-sm text-slate-500">{description}</p>
        </div>
        <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-green-600 group-hover:translate-x-1 transition-all" />
      </div>
    </div>
  );
};

// Template Preview Card
const TemplateCard = ({ name, description, features, imageBg }) => {
  const navigate = useNavigate();
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300">
      <div className={`h-40 ${imageBg} flex items-center justify-center`}>
        <FileText className="w-16 h-16 text-white/80" />
      </div>
      <div className="p-5">
        <h4 className="font-bold text-lg text-slate-800 mb-2">{name}</h4>
        <p className="text-sm text-slate-500 mb-4">{description}</p>
        <ul className="space-y-2 mb-4">
          {features.map((feature, idx) => (
            <li key={idx} className="flex items-center gap-2 text-sm text-slate-600">
              <CheckCircle className="w-4 h-4 text-green-500" />
              {feature}
            </li>
          ))}
        </ul>
        <Button
          onClick={() => navigate("/paystub-generator")}
          className="w-full bg-green-700 hover:bg-green-800"
        >
          Use This Template
        </Button>
      </div>
    </div>
  );
};

export default function HowToMakePaystub() {
  const navigate = useNavigate();
  const [openFAQ, setOpenFAQ] = useState(0);
  const [isVisible] = useState(true);

  const faqs = [
    {
      question: "What information do I need to create a paystub?",
      answer: "To create an accurate paystub, you&apos;ll need: your employer&apos;s name and address, employee name and details, pay period dates, hourly rate or salary, hours worked, federal and state tax information, and any deductions like insurance or retirement contributions. Our generator guides you through each field step by step."
    },
    {
      question: "How long does it take to generate a paystub with MintSlip?",
      answer: "Most users complete their paystub in under 5 minutes. Our streamlined interface and auto-calculation features handle the complex math for taxes and deductions, so you just enter your basic information and we do the rest."
    },
    {
      question: "Are MintSlip paystubs accurate for tax purposes?",
      answer: "Yes! MintSlip uses current federal and state tax rates to calculate accurate withholdings. Our templates follow standard payroll formatting used by major employers, ensuring your paystub contains all the information typically found on professional pay stubs."
    },
    {
      question: "Can I create paystubs for self-employment or contract work?",
      answer: "Absolutely! MintSlip offers both W-2 employee paystubs and 1099 contractor payment statements. For self-employed individuals, our system can generate accurate documentation of your earnings without tax withholdings, as is standard for independent contractors."
    },
    {
      question: "What paystub template formats are available?",
      answer: "We offer multiple professional templates including Gusto-style, ADP-style, Workday-style, and custom templates. Each is designed to match the look of paystubs from major payroll providers, giving you professional documentation regardless of your employer setup."
    },
    {
      question: "Is my information secure when using MintSlip?",
      answer: "Your privacy is our priority. We use secure PayPal payment processing and do not store your personal information after your document is generated. Your data is processed in real-time and immediately discarded after your paystub is created."
    }
  ];

  const internalLinks = [
    {
      title: "Pay Stub Generator",
      description: "Create professional paystubs instantly with accurate tax calculations",
      path: "/paystub-generator",
      icon: FileText
    },
    {
      title: "W-2 Form Generator",
      description: "Generate IRS-compliant W-2 forms for tax filing",
      path: "/w2-generator",
      icon: Receipt
    },
    {
      title: "1099-NEC Generator",
      description: "Create 1099 forms for contractor and freelance payments",
      path: "/1099-nec-generator",
      icon: FileBarChart
    },
    {
      title: "Canadian Paystub Generator",
      description: "Generate paystubs with Canadian tax calculations",
      path: "/canadian-paystub-generator",
      icon: Building2
    },
    {
      title: "Self-Employed Paystub Generator",
      description: "Documentation for freelancers and self-employed individuals",
      path: "/self-employed-paystub-generator",
      icon: Briefcase
    },
    {
      title: "Contractor Paystub Generator",
      description: "Create payment statements for 1099 contractors",
      path: "/contractor-paystub-generator",
      icon: User
    },
    {
      title: "Accounting Mockups",
      description: "Professional financial statement templates",
      path: "/accounting-mockup-generator",
      icon: Calculator
    },
    {
      title: "Paystub Samples & Templates",
      description: "Browse our collection of professional paystub templates",
      path: "/paystub-samples",
      icon: FileText
    }
  ];

  const templates = [
    {
      name: "Gusto-Style Template",
      description: "Clean, modern design used by 300,000+ businesses",
      features: ["Modern layout", "Clear earnings breakdown", "Digital-first design"],
      imageBg: "bg-gradient-to-br from-green-600 to-green-800"
    },
    {
      name: "ADP-Style Template",
      description: "Classic corporate paystub format",
      features: ["Traditional format", "Detailed tax sections", "Professional appearance"],
      imageBg: "bg-gradient-to-br from-red-600 to-red-800"
    },
    {
      name: "Workday-Style Template",
      description: "Enterprise-grade paystub layout",
      features: ["Enterprise format", "Comprehensive details", "YTD tracking"],
      imageBg: "bg-gradient-to-br from-orange-500 to-orange-700"
    }
  ];

  // Schema.org structured data for SEO
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": "How to Make a Paystub",
    "description": "Learn how to create professional paystubs in minutes using MintSlip's online paystub generator. Step-by-step guide with templates.",
    "image": "https://mintslip.com/og-image.png",
    "totalTime": "PT5M",
    "estimatedCost": {
      "@type": "MonetaryAmount",
      "currency": "USD",
      "value": "8.99"
    },
    "step": [
      {
        "@type": "HowToStep",
        "name": "Choose Your Template",
        "text": "Select from professional paystub templates including Gusto, ADP, and Workday styles",
        "position": 1
      },
      {
        "@type": "HowToStep",
        "name": "Enter Your Information",
        "text": "Fill in employer details, employee information, pay period, earnings, and deductions",
        "position": 2
      },
      {
        "@type": "HowToStep",
        "name": "Review and Download",
        "text": "Preview your paystub, make any adjustments, then download the professional PDF",
        "position": 3
      }
    ]
  };

  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>How to Make a Paystub | Step-by-Step Guide 2025 | MintSlip</title>
        <meta name="description" content="Learn how to make a paystub in minutes with our step-by-step guide. Create professional pay stubs with accurate tax calculations. Free preview, instant download. Trusted by 10,000+ users." />
        <meta name="keywords" content="how to make a paystub, create paystub, paystub generator, pay stub maker, free paystub template, make pay stub online, paystub creator, generate paystub" />
        <meta property="og:title" content="How to Make a Paystub - Complete Step-by-Step Guide 2025" />
        <meta property="og:description" content="Create professional paystubs in under 5 minutes. Our guide shows you exactly how to make accurate pay stubs with proper tax calculations." />
        <meta property="og:type" content="article" />
        <meta property="og:url" content="https://mintslip.com/how-to-make-a-paystub" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="How to Make a Paystub | MintSlip" />
        <meta name="twitter:description" content="Step-by-step guide to creating professional paystubs with accurate tax calculations." />
        <link rel="canonical" href="https://mintslip.com/how-to-make-a-paystub" />
        <script type="application/ld+json">
          {JSON.stringify(schemaData)}
        </script>
      </Helmet>
      
      <Header />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-green-900 via-green-800 to-emerald-900 text-white py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 25px 25px, rgba(255,255,255,0.15) 2px, transparent 0)',
            backgroundSize: '50px 50px'
          }} />
        </div>
        
        <div className="max-w-5xl mx-auto px-6 relative z-10">
          <div className={`text-center transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            {/* Breadcrumb */}
            <nav className="mb-6 text-sm">
              <ol className="flex items-center justify-center gap-2 text-green-200">
                <li><Link to="/" className="hover:text-white transition-colors">Home</Link></li>
                <li>/</li>
                <li className="text-white font-medium">How to Make a Paystub</li>
              </ol>
            </nav>

            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full mb-6">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              <span className="text-sm font-medium">Updated for 2025 Tax Rates</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-6" style={{ fontFamily: 'Outfit, sans-serif' }}>
              How to Make a Paystub
            </h1>
            <p className="text-lg md:text-xl text-green-100 leading-relaxed max-w-3xl mx-auto mb-8">
              Creating professional pay stubs has never been easier. Follow our step-by-step guide to generate accurate paystubs with proper tax calculations in under 5 minutes.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => navigate("/paystub-generator")}
                size="lg"
                className="group gap-2 text-lg px-8 py-6 bg-white text-green-800 hover:bg-green-50 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Zap className="w-5 h-5" />
                Create Paystub Now
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button
                onClick={() => navigate("/paystub-samples")}
                size="lg"
                variant="outline"
                className="group gap-2 text-lg px-8 py-6 border-2 border-white/30 text-white hover:bg-white/10 transition-all duration-300"
              >
                View Sample Templates
              </Button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-6 mt-12 max-w-2xl mx-auto">
              <div className="text-center">
                <p className="text-3xl font-black text-white">5 min</p>
                <p className="text-sm text-green-200">Average Time</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-black text-white">50K+</p>
                <p className="text-sm text-green-200">Paystubs Created</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-black text-white">99.9%</p>
                <p className="text-sm text-green-200">Accuracy Rate</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What is a Paystub Section */}
      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <div className="prose prose-lg max-w-none">
            <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-6" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
              What is a Paystub and Why Do You Need One?
            </h2>
            
            <p className="text-slate-600 text-lg leading-relaxed mb-6">
              A <strong>paystub</strong> (also called a pay stub, paycheck stub, or earnings statement) is a document that itemizes your earnings for a specific pay period. It shows your gross pay, deductions for taxes and benefits, and your net (take-home) pay. Whether you&apos;re an employee, freelancer, or small business owner, understanding how to make a paystub is essential for financial documentation.
            </p>

            <p className="text-slate-600 text-lg leading-relaxed mb-6">
              Paystubs serve multiple important purposes in today&apos;s financial landscape. For employees, they provide a clear breakdown of earnings and deductions, helping you verify that your pay is correct and understand where your money goes. For self-employed individuals and contractors, paystubs serve as proof of income for loan applications, apartment rentals, and other financial transactions.
            </p>

            <div className="bg-green-50 border-l-4 border-green-600 p-6 rounded-r-lg mb-8">
              <h3 className="font-bold text-green-800 mb-3">Common Uses for Paystubs</h3>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-slate-700">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span>Apartment rental applications</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span>Mortgage and loan applications</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span>Tax preparation and filing</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span>Proof of employment</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span>Child support documentation</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span>Government benefit applications</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Detailed Step-by-Step Guide */}
      <section className="py-16 md:py-20 bg-slate-50 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
              Step-by-Step Guide: How to Make a Paystub
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Follow these three simple steps to create a professional paystub with MintSlip. Our platform handles all the complex calculations automatically.
            </p>
          </div>
          
          {/* Step 1 - Detailed */}
          <div className="mb-16">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div className="order-2 lg:order-1">
                <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-200">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-full bg-red-500 text-white flex items-center justify-center font-bold text-xl">1</div>
                    <h3 className="text-2xl font-black text-slate-800" style={{ fontFamily: 'Outfit, sans-serif' }}>Choose Your Paystub Template</h3>
                  </div>
                  
                  <p className="text-slate-600 mb-6 leading-relaxed">
                    Start by selecting a professional paystub template that matches your needs. MintSlip offers several industry-standard formats:
                  </p>
                  
                  <ul className="space-y-4 mb-6">
                    <li className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <strong className="text-slate-800">Gusto-Style Template</strong>
                        <p className="text-sm text-slate-500">Clean, modern design preferred by tech companies and startups</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <strong className="text-slate-800">ADP-Style Template</strong>
                        <p className="text-sm text-slate-500">Traditional corporate format used by large enterprises</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <strong className="text-slate-800">Workday-Style Template</strong>
                        <p className="text-sm text-slate-500">Enterprise-grade format with comprehensive details</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <strong className="text-slate-800">Custom Template</strong>
                        <p className="text-sm text-slate-500">Personalize colors and branding to match your company</p>
                      </div>
                    </li>
                  </ul>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                      <strong>Pro Tip:</strong> Choose a template that matches your employer&apos;s actual payroll provider for the most authentic appearance.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="order-1 lg:order-2">
                <div className="bg-white rounded-2xl p-6 shadow-xl border border-slate-200">
                  <div className="relative">
                    <div className="absolute -top-3 -left-3 z-10">
                      <span className="bg-red-500 text-white font-bold px-4 py-1.5 rounded-lg text-sm shadow-lg flex items-center gap-2">
                        <MousePointer className="w-4 h-4" />
                        STEP 1
                      </span>
                    </div>
                    <div className="bg-slate-100 rounded-lg overflow-hidden">
                      <img src={select} alt="Step 1: Select a professional paystub template from MintSlip's template library" className="w-full h-auto" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 2 - Detailed */}
          <div className="mb-16">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div>
                <div className="bg-white rounded-2xl p-6 shadow-xl border border-slate-200">
                  <div className="relative">
                    <div className="absolute -top-3 -left-3 z-10">
                      <span className="bg-yellow-500 text-white font-bold px-4 py-1.5 rounded-lg text-sm shadow-lg flex items-center gap-2">
                        <Edit3 className="w-4 h-4" />
                        STEP 2
                      </span>
                    </div>
                    <div className="bg-slate-100 rounded-lg overflow-hidden">
                      <img src={inputInfo} alt="Step 2: Enter your employer information, employee details, earnings, and deductions" className="w-full h-auto" />
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-200">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-full bg-yellow-500 text-white flex items-center justify-center font-bold text-xl">2</div>
                    <h3 className="text-2xl font-black text-slate-800" style={{ fontFamily: 'Outfit, sans-serif' }}>Enter Your Information</h3>
                  </div>
                  
                  <p className="text-slate-600 mb-6 leading-relaxed">
                    Fill in your details in our intuitive form. Our smart system automatically calculates taxes and deductions based on current rates. Here&apos;s what you&apos;ll need:
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="bg-slate-50 p-4 rounded-lg">
                      <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-green-600" />
                        Employer Info
                      </h4>
                      <ul className="text-sm text-slate-600 space-y-1">
                        <li>• Company name</li>
                        <li>• Business address</li>
                        <li>• EIN (optional)</li>
                      </ul>
                    </div>
                    
                    <div className="bg-slate-50 p-4 rounded-lg">
                      <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                        <User className="w-4 h-4 text-green-600" />
                        Employee Info
                      </h4>
                      <ul className="text-sm text-slate-600 space-y-1">
                        <li>• Full name</li>
                        <li>• Address</li>
                        <li>• SSN (last 4 digits)</li>
                      </ul>
                    </div>
                    
                    <div className="bg-slate-50 p-4 rounded-lg">
                      <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-green-600" />
                        Earnings
                      </h4>
                      <ul className="text-sm text-slate-600 space-y-1">
                        <li>• Hourly rate or salary</li>
                        <li>• Hours worked</li>
                        <li>• Overtime hours</li>
                      </ul>
                    </div>
                    
                    <div className="bg-slate-50 p-4 rounded-lg">
                      <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-green-600" />
                        Pay Period
                      </h4>
                      <ul className="text-sm text-slate-600 space-y-1">
                        <li>• Start date</li>
                        <li>• End date</li>
                        <li>• Pay date</li>
                      </ul>
                    </div>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-sm text-green-800">
                      <strong>Auto-Calculation:</strong> Our system automatically calculates federal income tax, Social Security, Medicare, and state taxes based on current 2025 tax rates.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 3 - Detailed */}
          <div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div className="order-2 lg:order-1">
                <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-200">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-full bg-green-500 text-white flex items-center justify-center font-bold text-xl">3</div>
                    <h3 className="text-2xl font-black text-slate-800" style={{ fontFamily: 'Outfit, sans-serif' }}>Preview, Pay & Download</h3>
                  </div>
                  
                  <p className="text-slate-600 mb-6 leading-relaxed">
                    Before finalizing, you&apos;ll see a live preview of your paystub with a MintSlip watermark. This lets you verify all information is correct. Once satisfied:
                  </p>
                  
                  <ol className="space-y-4 mb-6">
                    <li className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-bold mt-0.5">1</div>
                      <div>
                        <strong className="text-slate-800">Review Your Preview</strong>
                        <p className="text-sm text-slate-500">Check all details are accurate, including earnings, taxes, and deductions</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-bold mt-0.5">2</div>
                      <div>
                        <strong className="text-slate-800">Secure PayPal Payment</strong>
                        <p className="text-sm text-slate-500">Pay securely via PayPal - we never see your financial information</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-bold mt-0.5">3</div>
                      <div>
                        <strong className="text-slate-800">Instant PDF Download</strong>
                        <p className="text-sm text-slate-500">Your professional paystub downloads immediately - no watermark</p>
                      </div>
                    </li>
                  </ol>

                  <div className="flex gap-3 mb-6">
                    <div className="flex-1 bg-slate-50 p-3 rounded-lg text-center">
                      <Shield className="w-6 h-6 text-green-600 mx-auto mb-1" />
                      <p className="text-xs text-slate-600 font-medium">Secure Payment</p>
                    </div>
                    <div className="flex-1 bg-slate-50 p-3 rounded-lg text-center">
                      <Clock className="w-6 h-6 text-green-600 mx-auto mb-1" />
                      <p className="text-xs text-slate-600 font-medium">Instant Download</p>
                    </div>
                    <div className="flex-1 bg-slate-50 p-3 rounded-lg text-center">
                      <FileText className="w-6 h-6 text-green-600 mx-auto mb-1" />
                      <p className="text-xs text-slate-600 font-medium">PDF Format</p>
                    </div>
                  </div>

                  <Button
                    onClick={() => navigate("/paystub-generator")}
                    size="lg"
                    className="w-full gap-2 bg-green-700 hover:bg-green-800"
                  >
                    <Zap className="w-5 h-5" />
                    Start Creating Your Paystub
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              <div className="order-1 lg:order-2">
                <div className="bg-white rounded-2xl p-6 shadow-xl border border-slate-200">
                  <div className="relative">
                    <div className="absolute -top-3 -left-3 z-10">
                      <span className="bg-green-500 text-white font-bold px-4 py-1.5 rounded-lg text-sm shadow-lg flex items-center gap-2">
                        <Download className="w-4 h-4" />
                        STEP 3
                      </span>
                    </div>
                    <div className="bg-slate-100 rounded-lg overflow-hidden">
                      <img src={download} alt="Step 3: Preview your paystub, pay securely via PayPal, and download your PDF instantly" className="w-full h-auto" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Template Examples Section */}
      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-4" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
              Professional Paystub Templates
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Choose from industry-standard templates that match the format used by major payroll providers. Each template includes accurate tax calculations and YTD tracking.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {templates.map((template, idx) => (
              <TemplateCard key={idx} {...template} />
            ))}
          </div>

          <div className="text-center mt-10">
            <Button
              onClick={() => navigate("/paystub-samples")}
              variant="outline"
              size="lg"
              className="gap-2 border-2 border-green-600 text-green-700 hover:bg-green-50"
            >
              View All Templates
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Long-form SEO Content */}
      <section className="py-16 md:py-20 bg-slate-50">
        <div className="max-w-4xl mx-auto px-6">
          <article className="prose prose-lg max-w-none">
            <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-6" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
              Complete Guide to Making Professional Paystubs
            </h2>

            <h3 className="text-2xl font-bold text-slate-800 mt-8 mb-4">Understanding Paystub Components</h3>
            
            <p className="text-slate-600 leading-relaxed mb-4">
              Before you learn how to make a paystub, it&apos;s important to understand what information a professional pay stub contains. Every paystub, regardless of the template or employer, includes several key sections that break down your compensation and deductions.
            </p>

            <p className="text-slate-600 leading-relaxed mb-4">
              <strong>Gross Pay</strong> represents your total earnings before any deductions. For hourly employees, this is calculated by multiplying your hourly rate by the number of hours worked. Salaried employees see their gross pay as a portion of their annual salary divided by the number of pay periods. Understanding your gross pay is the foundation of reading any paystub.
            </p>

            <p className="text-slate-600 leading-relaxed mb-4">
              <strong>Federal Income Tax</strong> is withheld based on the information you provided on your W-4 form. The amount withheld depends on your filing status, number of dependents, and whether you&apos;ve elected additional withholding. MintSlip&apos;s paystub generator uses current IRS tax tables to calculate accurate federal withholding amounts.
            </p>

            <p className="text-slate-600 leading-relaxed mb-4">
              <strong>FICA Taxes</strong> include Social Security (6.2% of gross pay up to the annual wage base) and Medicare (1.45% of all gross pay). These taxes fund federal retirement and healthcare programs. High earners may also see Additional Medicare Tax of 0.9% on wages exceeding $200,000.
            </p>

            <h3 className="text-2xl font-bold text-slate-800 mt-8 mb-4">State and Local Tax Considerations</h3>

            <p className="text-slate-600 leading-relaxed mb-4">
              <strong>State Income Tax</strong> varies significantly by location. Some states like Texas, Florida, and Nevada have no state income tax, while others like California and New York have progressive tax rates that can exceed 10% for high earners. When you create a paystub with MintSlip, our system automatically applies the correct state tax rate based on your location.
            </p>

            <p className="text-slate-600 leading-relaxed mb-4">
              <strong>Local Taxes</strong> are required in certain cities and counties. For example, New York City residents pay an additional city income tax, and some Ohio cities have local income taxes. Always verify your local tax obligations when creating paystubs to ensure accuracy.
            </p>

            <h3 className="text-2xl font-bold text-slate-800 mt-8 mb-4">Pre-Tax vs. Post-Tax Deductions</h3>

            <p className="text-slate-600 leading-relaxed mb-4">
              <strong>Pre-tax deductions</strong> reduce your taxable income before federal and state taxes are calculated. Common pre-tax deductions include 401(k) contributions, health insurance premiums, Health Savings Account (HSA) contributions, and Flexible Spending Account (FSA) contributions. These deductions lower your tax liability while still providing valuable benefits.
            </p>

            <p className="text-slate-600 leading-relaxed mb-4">
              <strong>Post-tax deductions</strong> are taken from your pay after taxes have been calculated. Examples include Roth 401(k) contributions, life insurance premiums that exceed certain limits, union dues, and garnishments. Understanding the difference between pre-tax and post-tax deductions helps you accurately interpret your paystub.
            </p>

            <h3 className="text-2xl font-bold text-slate-800 mt-8 mb-4">Year-to-Date (YTD) Tracking</h3>

            <p className="text-slate-600 leading-relaxed mb-4">
              Every professional paystub includes year-to-date totals showing your cumulative earnings and deductions from January 1st through the current pay period. YTD information is crucial for:
            </p>

            <ul className="list-disc pl-6 mb-4 text-slate-600 space-y-2">
              <li>Tracking progress toward Social Security wage base limits</li>
              <li>Monitoring 401(k) contribution limits ($23,000 in 2025)</li>
              <li>Verifying your income for loan applications</li>
              <li>Preparing for tax season by knowing your total earnings</li>
              <li>Budgeting and financial planning throughout the year</li>
            </ul>

            <h3 className="text-2xl font-bold text-slate-800 mt-8 mb-4">Paystubs for Different Worker Types</h3>

            <p className="text-slate-600 leading-relaxed mb-4">
              <strong>W-2 Employees</strong> receive the most comprehensive paystubs with all taxes automatically withheld. Employers are legally required to withhold federal, state, and FICA taxes from each paycheck. If you're a W-2 employee needing documentation, MintSlip creates authentic-looking paystubs that match what major employers provide.
            </p>

            <p className="text-slate-600 leading-relaxed mb-4">
              <strong>1099 Contractors</strong> are responsible for their own taxes, so their payment statements don't include tax withholdings. Instead, contractors receive the full payment amount and must make quarterly estimated tax payments. MintSlip offers a contractor paystub option that clearly shows the payment without misleading tax withholding information.
            </p>

            <p className="text-slate-600 leading-relaxed mb-4">
              <strong>Self-Employed Individuals</strong> often need to create paystubs as proof of income even though they don't receive traditional paychecks. Whether you're a freelancer, gig worker, or small business owner, MintSlip helps you document your earnings professionally for mortgage applications, rental agreements, or other financial purposes.
            </p>

            <h3 className="text-2xl font-bold text-slate-800 mt-8 mb-4">Best Practices for Creating Paystubs</h3>

            <p className="text-slate-600 leading-relaxed mb-4">
              When learning how to make a paystub, accuracy is paramount. Here are essential best practices to follow:
            </p>

            <ol className="list-decimal pl-6 mb-4 text-slate-600 space-y-3">
              <li><strong>Double-check all personal information</strong> - Names, addresses, and identification numbers must be accurate</li>
              <li><strong>Use correct pay period dates</strong> - The pay period should accurately reflect the dates you're documenting</li>
              <li><strong>Verify hourly rates or salary</strong> - Ensure your compensation matches your actual agreement</li>
              <li><strong>Account for overtime correctly</strong> - Overtime is typically paid at 1.5x your regular rate</li>
              <li><strong>Include all relevant deductions</strong> - Don't forget health insurance, retirement contributions, or other regular deductions</li>
              <li><strong>Keep records</strong> - Save copies of all paystubs for tax purposes and financial documentation</li>
            </ol>

            <div className="bg-green-50 border-l-4 border-green-600 p-6 rounded-r-lg my-8">
              <h4 className="font-bold text-green-800 mb-2">Ready to Create Your Paystub?</h4>
              <p className="text-slate-700 mb-4">
                MintSlip makes it easy to create professional, accurate paystubs in under 5 minutes. Our platform handles all the complex tax calculations so you can focus on what matters.
              </p>
              <Button
                onClick={() => navigate("/paystub-generator")}
                className="bg-green-700 hover:bg-green-800 gap-2"
              >
                Create Your Paystub Now
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </article>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-4" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-slate-600">
              Common questions about creating paystubs with MintSlip
            </p>
          </div>

          <div>
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

          <div className="text-center mt-8">
            <Button
              onClick={() => navigate("/faq")}
              variant="outline"
              className="gap-2 border-slate-300"
            >
              <HelpCircle className="w-4 h-4" />
              View All FAQs
            </Button>
          </div>
        </div>
      </section>

      {/* Internal Links Section */}
      <section className="py-16 md:py-20 bg-slate-50 border-t border-slate-200">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-4" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
              Explore More Document Generators
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              MintSlip offers a complete suite of professional document generators for all your financial documentation needs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {internalLinks.map((link, idx) => (
              <InternalLinkCard key={idx} {...link} />
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-16 md:py-20 bg-gradient-to-br from-green-900 via-green-800 to-emerald-900 text-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-6" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Ready to Create Your Professional Paystub?
          </h2>
          <p className="text-lg text-green-100 mb-8 max-w-2xl mx-auto">
            Join over 10,000 satisfied users who trust MintSlip for accurate, professional pay stubs. Create yours in under 5 minutes with our easy-to-use generator.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => navigate("/paystub-generator")}
              size="lg"
              className="group gap-2 text-lg px-8 py-6 bg-white text-green-800 hover:bg-green-50 shadow-lg"
            >
              <FileText className="w-5 h-5" />
              Create Paystub Now
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button
              onClick={() => navigate("/contact")}
              size="lg"
              variant="outline"
              className="gap-2 text-lg px-8 py-6 border-2 border-white/30 text-white hover:bg-white/10"
            >
              <CreditCard className="w-4 h-4" />
              Contact Support
            </Button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-8 mt-12 text-green-200 text-sm">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              <span>Secure PayPal Payment</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              <span>Instant Download</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              <span>No Account Required</span>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

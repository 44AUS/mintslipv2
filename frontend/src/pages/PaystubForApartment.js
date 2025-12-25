import { useNavigate, Link } from "react-router-dom";
import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { 
  FileText, 
  CheckCircle, 
  Shield, 
  Clock, 
  ArrowRight, 
  Star, 
  Building2,
  User,
  DollarSign,
  Calendar,
  ChevronDown,
  ChevronUp,
  FileBarChart,
  Receipt,
  Briefcase,
  HelpCircle,
  Zap,
  Home as HomeIcon,
  Key,
  ClipboardCheck,
  AlertTriangle,
  FileCheck,
  Users,
  Calculator,
  CreditCard
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

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

export default function PaystubForApartment() {
  const navigate = useNavigate();
  const [openFAQ, setOpenFAQ] = useState(0);
  const [isVisible] = useState(true);

  const faqs = [
    {
      question: "How many paystubs do landlords typically require?",
      answer: "Most landlords request two to three of your most recent paystubs. Some property management companies may ask for up to four paystubs to verify consistent income over a longer period. Having several recent paystubs ready can help speed up your application process."
    },
    {
      question: "What income-to-rent ratio do landlords look for?",
      answer: "The standard guideline is that your gross monthly income should be at least three times the monthly rent. For example, if rent is $1,500 per month, landlords typically want to see gross monthly income of at least $4,500. Some landlords may accept a 2.5x ratio, especially in high-cost areas."
    },
    {
      question: "Can self-employed individuals use paystubs for apartment applications?",
      answer: "Self-employed individuals often face additional scrutiny but can still document their income effectively. Instead of traditional paystubs, they may need to provide tax returns or create income documentation that shows their earnings. Many landlords will accept alternative forms of income verification for freelancers and business owners."
    },
    {
      question: "What if my paystubs show variable income?",
      answer: "If your income varies (common for commission-based jobs, freelancers, or gig workers), landlords may average your earnings over several months. Providing more paystubs or additional documentation like tax returns can help demonstrate your average income over time."
    },
    {
      question: "Do landlords verify paystub information?",
      answer: "Yes, many landlords verify income information by contacting employers, requesting tax returns, or using third-party verification services. Always ensure the information on your paystubs accurately reflects your actual earnings and employment status."
    },
    {
      question: "What other documents might landlords request besides paystubs?",
      answer: "Landlords commonly request additional documentation such as tax returns (W-2s or 1099s), employment verification letters, government-issued ID, rental history, and credit reports. Being prepared with these documents can speed up your application."
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
      description: "Generate IRS-compliant W-2 forms for tax documentation",
      path: "/w2-generator",
      icon: Receipt
    },
    {
      title: "1099-NEC Generator",
      description: "Create 1099 forms for contractor and freelance income",
      path: "/1099-nec-generator",
      icon: FileBarChart
    },
    {
      title: "How to Make a Paystub",
      description: "Step-by-step guide to creating professional paystubs",
      path: "/how-to-make-a-paystub",
      icon: ClipboardCheck
    },
    {
      title: "Self-Employed Paystub Generator",
      description: "Documentation for freelancers and self-employed individuals",
      path: "/self-employed-paystub-generator",
      icon: Briefcase
    }
  ];

  // Schema.org structured data for SEO
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "Paystub for Apartment: Complete Guide to Proof of Income for Renters",
    "description": "Learn what landlords look for in paystubs when renting an apartment. Understand income requirements, documentation needs, and how to present your financial information professionally.",
    "image": "https://mintslip.com/og-image.png",
    "author": {
      "@type": "Organization",
      "name": "MintSlip"
    },
    "publisher": {
      "@type": "Organization",
      "name": "MintSlip",
      "logo": {
        "@type": "ImageObject",
        "url": "https://mintslip.com/logo.png"
      }
    },
    "datePublished": "2025-01-01",
    "dateModified": "2025-07-01"
  };

  // FAQ Schema for SEO
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };

  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>Paystub for Apartment | Proof of Income Guide for Renters 2025 | MintSlip</title>
        <meta name="description" content="Learn how to use paystubs for apartment applications. Understand what landlords look for in proof of income documentation. Create professional paystubs with accurate calculations. Trusted guide for renters." />
        <meta name="keywords" content="paystub for apartment, proof of income for renting, apartment application paystub, landlord income verification, rental income requirements, paystub for rent application, income documentation apartment" />
        <meta property="og:title" content="Paystub for Apartment - Complete Proof of Income Guide for Renters 2025" />
        <meta property="og:description" content="Everything you need to know about using paystubs for apartment applications. Learn income requirements and documentation tips." />
        <meta property="og:type" content="article" />
        <meta property="og:url" content="https://mintslip.com/paystub-for-apartment" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Paystub for Apartment | MintSlip" />
        <meta name="twitter:description" content="Complete guide to proof of income for apartment applications." />
        <link rel="canonical" href="https://mintslip.com/paystub-for-apartment" />
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
                <li className="text-white font-medium">Paystub for Apartment</li>
              </ol>
            </nav>

            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full mb-6">
              <HomeIcon className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-medium">Complete Renter's Guide</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-6" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Paystub for Apartment
            </h1>
            <p className="text-lg md:text-xl text-green-100 leading-relaxed max-w-3xl mx-auto mb-8">
              Your complete guide to understanding proof of income requirements when renting an apartment. Learn what landlords look for, how to prepare your documentation, and create professional paystubs.
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
                onClick={() => navigate("/how-to-make-a-paystub")}
                size="lg"
                variant="outline"
                className="group gap-2 text-lg px-8 py-6 border-2 border-white/30 text-white hover:bg-white/10 transition-all duration-300"
              >
                Learn How to Make a Paystub
              </Button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-6 mt-12 max-w-2xl mx-auto">
              <div className="text-center">
                <p className="text-3xl font-black text-white">3x</p>
                <p className="text-sm text-green-200">Typical Income Ratio</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-black text-white">2-3</p>
                <p className="text-sm text-green-200">Paystubs Required</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-black text-white">5 min</p>
                <p className="text-sm text-green-200">To Create</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Introduction Section */}
      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <div className="prose prose-lg max-w-none">
            <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-6" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
              Why Landlords Require Paystubs for Apartment Applications
            </h2>
            
            <p className="text-slate-600 text-lg leading-relaxed mb-6">
              When applying to rent an apartment, one of the most important documents you will need is proof of income. Landlords and property management companies use paystubs to verify that prospective tenants have sufficient and stable income to afford the monthly rent. Understanding what landlords look for in your income documentation can help you prepare a stronger rental application.
            </p>

            <p className="text-slate-600 text-lg leading-relaxed mb-6">
              A <strong>paystub</strong> (also called a pay stub or earnings statement) provides detailed information about your earnings, including your gross pay, tax withholdings, deductions, and net pay. This document gives landlords confidence that you have a reliable source of income and can consistently meet your monthly rent obligations.
            </p>

            <p className="text-slate-600 text-lg leading-relaxed mb-6">
              Whether you are a traditional employee, freelancer, contractor, or self-employed individual, having proper income documentation is essential for securing the apartment you want. This guide will walk you through everything you need to know about using paystubs for apartment applications.
            </p>

            <div className="bg-green-50 border-l-4 border-green-600 p-6 rounded-r-lg mb-4">
              <h3 className="font-bold text-green-800 mb-3">What Landlords Typically Look For</h3>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-slate-700">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span>Consistent income over multiple pay periods</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span>Gross income that meets minimum requirements</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span>Employer information and verification</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span>Year-to-date earnings history</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span>Recent pay dates (within 30 days)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span>Professional formatting and completeness</span>
                </li>
              </ul>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-5 mb-8">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-amber-800 mb-1">Important Disclaimer</p>
                  <p className="text-sm text-amber-700">
                    MintSlip is intended for lawful and legitimate use only. Users are responsible for ensuring all information entered is accurate and reflects their actual income. Misrepresenting income on rental applications may constitute fraud and can result in legal consequences. Always provide truthful information to landlords and property managers.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Income Requirements Section */}
      <section className="py-16 md:py-20 bg-slate-50 border-y border-slate-200">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-4" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
              Understanding Income Requirements for Renting
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Most landlords follow standard income-to-rent ratios when evaluating applications. Understanding these requirements helps you know if you qualify.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="bg-white rounded-xl p-6 shadow-md border border-slate-200">
              <div className="w-14 h-14 rounded-lg bg-green-100 flex items-center justify-center mb-4">
                <Calculator className="w-7 h-7 text-green-700" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3" style={{ fontFamily: 'Outfit, sans-serif' }}>
                The 3x Rule
              </h3>
              <p className="text-slate-600 mb-4">
                The most common requirement is that your gross monthly income should be at least three times the monthly rent. This is the industry standard for most landlords.
              </p>
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-sm text-slate-500 mb-1">Example Calculation:</p>
                <p className="text-slate-800 font-medium">$1,500 rent × 3 = $4,500 gross monthly income required</p>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md border border-slate-200">
              <div className="w-14 h-14 rounded-lg bg-blue-100 flex items-center justify-center mb-4">
                <Users className="w-7 h-7 text-blue-700" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3" style={{ fontFamily: 'Outfit, sans-serif' }}>
                Combined Income
              </h3>
              <p className="text-slate-600 mb-4">
                When applying with roommates or a partner, landlords typically consider your combined gross income. Each applicant may need to provide their own paystubs.
              </p>
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-sm text-slate-500 mb-1">Example:</p>
                <p className="text-slate-800 font-medium">Applicant A: $3,000 + Applicant B: $2,500 = $5,500 combined</p>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md border border-slate-200">
              <div className="w-14 h-14 rounded-lg bg-purple-100 flex items-center justify-center mb-4">
                <FileCheck className="w-7 h-7 text-purple-700" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3" style={{ fontFamily: 'Outfit, sans-serif' }}>
                Documentation Period
              </h3>
              <p className="text-slate-600 mb-4">
                Landlords typically want to see your two to three most recent paystubs. The pay dates should be within the last 30 to 60 days for relevance.
              </p>
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-sm text-slate-500 mb-1">Standard Request:</p>
                <p className="text-slate-800 font-medium">2-3 recent paystubs from the past 30-60 days</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What Paystubs Show Section */}
      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <article className="prose prose-lg max-w-none">
            <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-6" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
              What Information Landlords Review on Your Paystub
            </h2>

            <p className="text-slate-600 leading-relaxed mb-6">
              When a landlord or property manager reviews your paystub, they are looking for specific information that helps them assess your ability to pay rent consistently. Understanding what they examine can help you ensure your documentation is complete and professional.
            </p>

            <h3 className="text-2xl font-bold text-slate-800 mt-8 mb-4">Gross Income vs. Net Income</h3>
            
            <p className="text-slate-600 leading-relaxed mb-4">
              <strong>Gross income</strong> is your total earnings before any taxes or deductions are taken out. This is typically the figure landlords use when calculating whether you meet their income requirements. Your gross pay shows your full earning potential and is the standard measure used in rental qualifications.
            </p>

            <p className="text-slate-600 leading-relaxed mb-4">
              <strong>Net income</strong> (or take-home pay) is what remains after all taxes and deductions. While some landlords may consider net income, the industry standard is to base requirements on gross income. Make sure your paystubs clearly show both figures for transparency.
            </p>

            <h3 className="text-2xl font-bold text-slate-800 mt-8 mb-4">Employer Information</h3>

            <p className="text-slate-600 leading-relaxed mb-4">
              Your paystub should include your employer's name, address, and contact information. Many landlords verify employment by calling the employer directly or using third-party verification services. Having complete employer information on your paystubs facilitates this verification process.
            </p>

            <h3 className="text-2xl font-bold text-slate-800 mt-8 mb-4">Pay Period and Frequency</h3>

            <p className="text-slate-600 leading-relaxed mb-4">
              The pay period dates and pay frequency (weekly, biweekly, semi-monthly, or monthly) help landlords calculate your monthly income accurately. For example, if you are paid biweekly, landlords will multiply your gross pay by 26 and divide by 12 to determine your average monthly income.
            </p>

            <h3 className="text-2xl font-bold text-slate-800 mt-8 mb-4">Year-to-Date (YTD) Information</h3>

            <p className="text-slate-600 leading-relaxed mb-4">
              YTD figures show your cumulative earnings from January 1st through the current pay period. This information helps landlords see your income history and verify consistency over time. Strong YTD numbers can strengthen your application, especially if you have been employed for several months.
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 my-8">
              <h4 className="font-bold text-blue-800 mb-3 flex items-center gap-2">
                <Key className="w-5 h-5" />
                Key Paystub Elements for Apartment Applications
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-slate-700">
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-blue-600 mt-1 flex-shrink-0" />
                    <span>Employee name and address</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-blue-600 mt-1 flex-shrink-0" />
                    <span>Employer name and address</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-blue-600 mt-1 flex-shrink-0" />
                    <span>Pay period start and end dates</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-blue-600 mt-1 flex-shrink-0" />
                    <span>Pay date</span>
                  </li>
                </ul>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-blue-600 mt-1 flex-shrink-0" />
                    <span>Gross earnings</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-blue-600 mt-1 flex-shrink-0" />
                    <span>Deductions and taxes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-blue-600 mt-1 flex-shrink-0" />
                    <span>Net pay</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-blue-600 mt-1 flex-shrink-0" />
                    <span>Year-to-date totals</span>
                  </li>
                </ul>
              </div>
            </div>
          </article>
        </div>
      </section>

      {/* Different Worker Types Section */}
      <section className="py-16 md:py-20 bg-slate-50">
        <div className="max-w-4xl mx-auto px-6">
          <article className="prose prose-lg max-w-none">
            <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-6" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
              Income Documentation for Different Employment Types
            </h2>

            <p className="text-slate-600 leading-relaxed mb-6">
              Not everyone receives traditional paystubs from an employer. The type of income documentation you need may vary based on your employment situation. Here is how different worker types can document their income for apartment applications.
            </p>

            <h3 className="text-2xl font-bold text-slate-800 mt-8 mb-4">Traditional W-2 Employees</h3>
            
            <p className="text-slate-600 leading-relaxed mb-4">
              If you work for an employer who withholds taxes from your paycheck, you are a W-2 employee. Your paystubs will show gross wages, federal and state tax withholdings, Social Security and Medicare taxes, and any benefit deductions. This is the most straightforward documentation for landlords to review.
            </p>

            <h3 className="text-2xl font-bold text-slate-800 mt-8 mb-4">Self-Employed and Freelancers</h3>

            <p className="text-slate-600 leading-relaxed mb-4">
              Self-employed individuals and freelancers may not receive traditional paystubs. In these cases, landlords typically accept alternative documentation such as tax returns from the previous year, profit and loss statements, or 1099 forms. Some self-employed individuals create their own income statements to document their earnings professionally.
            </p>

            <h3 className="text-2xl font-bold text-slate-800 mt-8 mb-4">1099 Contractors</h3>

            <p className="text-slate-600 leading-relaxed mb-4">
              Independent contractors who receive 1099 forms do not have taxes withheld from their payments. Their payment statements look different from traditional W-2 paystubs. Landlords reviewing contractor income will want to see consistent payment history and may request additional documentation like contracts to verify income stability.
            </p>

            <h3 className="text-2xl font-bold text-slate-800 mt-8 mb-4">Multiple Income Sources</h3>

            <p className="text-slate-600 leading-relaxed mb-4">
              If you have multiple jobs or income sources, you can provide paystubs from each source. Landlords will add up your total income when determining if you meet their requirements. Having documentation ready from all income sources can strengthen your application and demonstrate financial stability.
            </p>

            <div className="bg-green-50 border-l-4 border-green-600 p-6 rounded-r-lg my-8">
              <h4 className="font-bold text-green-800 mb-2">Create Professional Income Documentation</h4>
              <p className="text-slate-700 mb-4">
                MintSlip helps you create professional paystubs with accurate calculations. Our templates are designed to include all the information landlords look for when reviewing rental applications.
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

      {/* Tips Section */}
      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-4" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
              Tips for a Successful Apartment Application
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Follow these best practices to strengthen your rental application and improve your chances of approval.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-green-700" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 mb-2">Prepare Documents in Advance</h3>
                  <p className="text-slate-600 text-sm">
                    Gather all required documentation before you start apartment hunting. Having your paystubs, ID, references, and other documents ready shows landlords you are organized and serious.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <DollarSign className="w-5 h-5 text-blue-700" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 mb-2">Know Your Budget</h3>
                  <p className="text-slate-600 text-sm">
                    Calculate what rent you can afford based on the income shown on your paystubs. Looking at apartments within your qualified range saves time for you and landlords.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-5 h-5 text-purple-700" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 mb-2">Keep Paystubs Current</h3>
                  <p className="text-slate-600 text-sm">
                    Make sure your paystubs are recent. Most landlords want to see pay dates within the last 30 to 60 days. Update your documentation regularly during your apartment search.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-amber-700" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 mb-2">Be Honest and Accurate</h3>
                  <p className="text-slate-600 text-sm">
                    Always provide accurate information that reflects your actual income. Landlords verify information, and discrepancies can result in application denial or lease termination.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                  <ClipboardCheck className="w-5 h-5 text-red-700" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 mb-2">Provide Additional Documentation</h3>
                  <p className="text-slate-600 text-sm">
                    Strengthen your application by offering additional documents like tax returns or an employment verification letter from your employer.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-5 h-5 text-teal-700" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 mb-2">Protect Sensitive Information</h3>
                  <p className="text-slate-600 text-sm">
                    Be cautious about sharing sensitive information like your full Social Security number. Many landlords only need the last four digits. Only provide complete information through secure channels.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 md:py-20 bg-slate-50">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-4" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-slate-600">
              Common questions about paystubs and apartment applications
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
      <section className="py-16 md:py-20 bg-white border-t border-slate-200">
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

      {/* Disclaimer Section */}
      <section className="py-12 bg-slate-100 border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-6">
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-start gap-4">
              <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-slate-800 mb-2">Legal Disclaimer</h3>
                <p className="text-sm text-slate-600 leading-relaxed mb-3">
                  MintSlip provides tools for creating income documentation and is intended for lawful and legitimate use only. The information provided on this page is for educational purposes and does not constitute legal or financial advice.
                </p>
                <p className="text-sm text-slate-600 leading-relaxed mb-3">
                  Users are solely responsible for ensuring that all information entered into MintSlip accurately reflects their actual income and employment status. Misrepresenting income or employment information on rental applications may constitute fraud and can result in criminal charges, civil liability, eviction, and other legal consequences.
                </p>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Always provide truthful and accurate information to landlords and property managers. MintSlip does not verify the accuracy of user-entered information and is not responsible for how documents are used. By using MintSlip, you agree to our <Link to="/terms" className="text-green-700 hover:text-green-800 underline">Terms of Service</Link> and <Link to="/privacy" className="text-green-700 hover:text-green-800 underline">Privacy Policy</Link>.
                </p>
              </div>
            </div>
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
            Create professional paystubs with accurate tax calculations in under five minutes. Our easy-to-use generator helps you document your income professionally for apartment applications.
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

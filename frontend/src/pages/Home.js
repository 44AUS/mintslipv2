import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { FileText, FileBarChart, CheckCircle, Shield, Clock, PiggyBank, Calendar, Receipt, ArrowRight, Sparkles, Zap, Star, MessageCircle, ClipboardList, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Example from '../assests/example.png';
import secure from '../assests/secure.png';

// Telegram icon SVG component
const TelegramIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
  </svg>
);

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
                <span className="block text-slate-800">Documents</span>
              </h1>
              <p className="text-lg md:text-xl leading-relaxed text-slate-600 max-w-xl">
                Create authentic pay stubs, bank statements, and W-2 forms in minutes. No sign-up required.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={() => navigate("/paystub")}
                size="lg"
                className="group gap-2 text-lg px-8 py-6 bg-gradient-to-r from-green-700 to-emerald-600 hover:from-green-800 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <FileText className="w-5 h-5" />
                Create Pay Stub
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button
                onClick={() => navigate("/bank-statement")}
                size="lg"
                variant="outline"
                className="group gap-2 text-lg px-8 py-6 border-2 border-slate-300 hover:border-green-600 hover:bg-green-50 transition-all duration-300"
              >
                <FileBarChart className="w-5 h-5" />
                Bank Statement
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
                src="https://images.pexels.com/photos/5980853/pexels-photo-5980853.jpeg"
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
                  <span className="text-slate-700">Proof of income for loans & rentals</span>
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

      {/* Income Verification Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1 space-y-6">
              <p className="text-xs uppercase tracking-widest text-slate-500" style={{ letterSpacing: '0.15em' }}>
                INCOME VERIFICATION
              </p>
              <h3 className="text-3xl md:text-4xl font-black tracking-tight" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
                Our Paystub Generator Has Your Income Verification Needs
              </h3>
              <p className="text-lg leading-relaxed text-slate-600">
                MintSlip provides a wide selection of paystub templates to suit your needs. Whether you&apos;re a freelancer, small business owner, or employee, we&apos;ve got you covered with professional, accurate documents.
              </p>
              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="p-4 bg-green-50 rounded-md border border-green-200">
                  <FileText className="w-8 h-8 text-green-700 mb-2" />
                  <h4 className="font-bold text-slate-800">Proof of Income</h4>
                  <p className="text-sm text-slate-600">For loan & rental applications</p>
                </div>
                <div className="p-4 bg-green-50 rounded-md border border-green-200">
                  <FileBarChart className="w-8 h-8 text-green-700 mb-2" />
                  <h4 className="font-bold text-slate-800">Tax Filing</h4>
                  <p className="text-sm text-slate-600">Accurate tax records</p>
                </div>
                <div className="p-4 bg-green-50 rounded-md border border-green-200">
                  <Shield className="w-8 h-8 text-green-700 mb-2" />
                  <h4 className="font-bold text-slate-800">Employment Verification</h4>
                  <p className="text-sm text-slate-600">Verify work history</p>
                </div>
                <div className="p-4 bg-green-50 rounded-md border border-green-200">
                  <Clock className="w-8 h-8 text-green-700 mb-2" />
                  <h4 className="font-bold text-slate-800">Instant Generation</h4>
                  <p className="text-sm text-slate-600">Ready in minutes</p>
                </div>
              </div>
            </div>
            <div className="order-1 md:order-2">
              <img
                src="https://images.pexels.com/photos/6289058/pexels-photo-6289058.jpeg"
                alt="Income verification documents"
                className="w-full h-auto rounded-md shadow-xl border border-slate-300 object-cover max-h-96"
              />
            </div>
          </div>
        </div>
      </section>

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
              <h4 className="text-2xl font-bold mb-2" style={{ color: '#1a4731' }}>Pay Stub</h4>
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
                onClick={() => navigate("/paystub")}
                className="w-full py-3 bg-green-800 text-white rounded-md font-semibold hover:bg-green-900 transition-colors"
              >
                Generate Now
              </button>
            </div>

            {/* Bank Statement Pricing */}
            <div className="bg-white rounded-lg p-8 text-center shadow-xl relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                POPULAR
              </div>
              <PiggyBank className="w-12 h-12 text-green-700 mx-auto mb-4" />
              <h4 className="text-2xl font-bold mb-2" style={{ color: '#1a4731' }}>Bank Statement</h4>
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
                onClick={() => navigate("/bank-statement")}
                className="w-full py-3 bg-green-800 text-white rounded-md font-semibold hover:bg-green-900 transition-colors"
              >
                Generate Now
              </button>
            </div>

            {/* W-2 Pricing */}
            <div className="bg-white rounded-lg p-8 text-center shadow-xl">
              <Calendar className="w-12 h-12 text-green-700 mx-auto mb-4" />
              <h4 className="text-2xl font-bold mb-2" style={{ color: '#1a4731' }}>W-2 Form</h4>
              <div className="mb-4">
                <span className="text-5xl font-black" style={{ color: '#1a4731' }}>$15</span>
                <span className="text-slate-500 ml-2">/ form</span>
              </div>
              <ul className="text-left space-y-2 mb-6">
                <li className="flex items-center gap-2 text-slate-600">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>IRS-Compliant Format</span>
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
                onClick={() => navigate("/w2")}
                className="w-full py-3 bg-green-800 text-white rounded-md font-semibold hover:bg-green-900 transition-colors"
              >
                Generate Now
              </button>
            </div>
          </div>
          
          {/* Second Row - W-9, 1099-NEC, and Schedule C */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* W-9 Pricing */}
            <div className="bg-white rounded-lg p-8 text-center shadow-xl relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                NEW
              </div>
              <ClipboardList className="w-12 h-12 text-green-700 mx-auto mb-4" />
              <h4 className="text-2xl font-bold mb-2" style={{ color: '#1a4731' }}>W-9 Form</h4>
              <div className="mb-4">
                <span className="text-5xl font-black" style={{ color: '#1a4731' }}>$10</span>
                <span className="text-slate-500 ml-2">/ form</span>
              </div>
              <ul className="text-left space-y-2 mb-6">
                <li className="flex items-center gap-2 text-slate-600">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Request for TIN</span>
                </li>
                <li className="flex items-center gap-2 text-slate-600">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>IRS-Compliant Format</span>
                </li>
                <li className="flex items-center gap-2 text-slate-600">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Multiple Tax Years</span>
                </li>
              </ul>
              <button
                onClick={() => navigate("/w9")}
                className="w-full py-3 bg-green-800 text-white rounded-md font-semibold hover:bg-green-900 transition-colors"
              >
                Generate Now
              </button>
            </div>

            {/* 1099-NEC Pricing */}
            <div className="bg-white rounded-lg p-8 text-center shadow-xl relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-orange-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                NEW
              </div>
              <Users className="w-12 h-12 text-green-700 mx-auto mb-4" />
              <h4 className="text-2xl font-bold mb-2" style={{ color: '#1a4731' }}>1099-NEC</h4>
              <div className="mb-4">
                <span className="text-5xl font-black" style={{ color: '#1a4731' }}>$12</span>
                <span className="text-slate-500 ml-2">/ form</span>
              </div>
              <ul className="text-left space-y-2 mb-6">
                <li className="flex items-center gap-2 text-slate-600">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Nonemployee Compensation</span>
                </li>
                <li className="flex items-center gap-2 text-slate-600">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Contractor Payments</span>
                </li>
                <li className="flex items-center gap-2 text-slate-600">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Years 2021-2025</span>
                </li>
              </ul>
              <button
                onClick={() => navigate("/1099-nec")}
                className="w-full py-3 bg-green-800 text-white rounded-md font-semibold hover:bg-green-900 transition-colors"
              >
                Generate Now
              </button>
            </div>

            {/* Schedule C Pricing */}
            <div className="bg-white rounded-lg p-8 text-center shadow-xl relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                NEW
              </div>
              <FileBarChart className="w-12 h-12 text-green-700 mx-auto mb-4" />
              <h4 className="text-2xl font-bold mb-2" style={{ color: '#1a4731' }}>Schedule C</h4>
              <div className="mb-4">
                <span className="text-5xl font-black" style={{ color: '#1a4731' }}>$15</span>
                <span className="text-slate-500 ml-2">/ form</span>
              </div>
              <ul className="text-left space-y-2 mb-6">
                <li className="flex items-center gap-2 text-slate-600">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>IRS Form 1040 Schedule C</span>
                </li>
                <li className="flex items-center gap-2 text-slate-600">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Profit & Loss Calculation</span>
                </li>
                <li className="flex items-center gap-2 text-slate-600">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>All Business Expenses</span>
                </li>
              </ul>
              <button
                onClick={() => navigate("/schedule-c")}
                className="w-full py-3 bg-green-800 text-white rounded-md font-semibold hover:bg-green-900 transition-colors"
              >
                Generate Now
              </button>
            </div>
          </div>
        </div>
      </section>

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
            onClick={() => navigate("/paystub")}
            className="group relative p-8 md:p-12 bg-white border-2 border-slate-200 rounded-md hover:border-green-800 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 text-left"
          >
            <div className="absolute top-6 right-6 w-16 h-16 rounded-full bg-green-50 flex items-center justify-center group-hover:bg-green-800 transition-colors">
              <Receipt className="w-8 h-8 text-green-800 group-hover:text-white transition-colors" />
            </div>
            
            <div className="space-y-4">
              <h4 className="text-2xl md:text-3xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
                Pay Stub
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

          {/* Bank Statement Card */}
          <button
            data-testid="bankstatement-card-button"
            onClick={() => navigate("/bank-statement")}
            className="group relative p-8 md:p-12 bg-white border-2 border-slate-200 rounded-md hover:border-green-800 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 text-left"
          >
            <div className="absolute top-6 right-6 w-16 h-16 rounded-full bg-green-50 flex items-center justify-center group-hover:bg-green-800 transition-colors">
              <PiggyBank className="w-8 h-8 text-green-800 group-hover:text-white transition-colors" />
            </div>
            
            <div className="space-y-4">
              <h4 className="text-2xl md:text-3xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
                Bank Statement
              </h4>
              <p className="text-slate-600 text-base leading-relaxed pr-16">
                Create real detailed bank statements with transaction history, account summaries, and professional formatting.
              </p>
              <div className="pt-4">
                <div className="inline-flex items-center gap-2">
                  <span className="text-3xl font-black" style={{ color: '#1a4731' }}>$50-$70</span>
                  <span className="text-slate-500">per document</span>
                </div>
              </div>
            </div>
          </button>

           {/* W-2 Card */}
          <button
            data-testid="w2-card-button"
            onClick={() => navigate("/w2")}
            className="group relative p-8 md:p-12 bg-white border-2 border-slate-200 rounded-md hover:border-green-800 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 text-left"
          >
            <div className="absolute top-6 right-6 w-16 h-16 rounded-full bg-green-50 flex items-center justify-center group-hover:bg-green-800 transition-colors">
              <Calendar className="w-8 h-8 text-green-800 group-hover:text-white transition-colors" />
            </div>
            
            <div className="space-y-4">
              <h4 className="text-2xl md:text-3xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
                W-2 Form
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
            onClick={() => navigate("/w9")}
            className="group relative p-8 md:p-12 bg-white border-2 border-slate-200 rounded-md hover:border-green-800 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 text-left"
          >
            <div className="absolute top-6 right-6 w-16 h-16 rounded-full bg-green-50 flex items-center justify-center group-hover:bg-green-800 transition-colors">
              <ClipboardList className="w-8 h-8 text-green-800 group-hover:text-white transition-colors" />
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h4 className="text-2xl md:text-3xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
                  W-9 Form
                </h4>
                <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded-full">NEW</span>
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
            onClick={() => navigate("/1099-nec")}
            className="group relative p-8 md:p-12 bg-white border-2 border-slate-200 rounded-md hover:border-green-800 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 text-left"
          >
            <div className="absolute top-6 right-6 w-16 h-16 rounded-full bg-green-50 flex items-center justify-center group-hover:bg-green-800 transition-colors">
              <Users className="w-8 h-8 text-green-800 group-hover:text-white transition-colors" />
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h4 className="text-2xl md:text-3xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
                  1099-NEC
                </h4>
                <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2 py-1 rounded-full">NEW</span>
              </div>
              <p className="text-slate-600 text-base leading-relaxed pr-16">
                Generate 1099-NEC forms for nonemployee compensation. Perfect for contractor and freelancer payments.
              </p>
              <div className="pt-4">
                <div className="inline-flex items-center gap-2">
                  <span className="text-3xl font-black" style={{ color: '#1a4731' }}>$12</span>
                  <span className="text-slate-500">per document</span>
                </div>
              </div>
            </div>
          </button>

          {/* Schedule C Card */}
          <button
            data-testid="schedulec-card-button"
            onClick={() => navigate("/schedule-c")}
            className="group relative p-8 md:p-12 bg-white border-2 border-slate-200 rounded-md hover:border-green-800 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 text-left"
          >
            <div className="absolute top-6 right-6 w-16 h-16 rounded-full bg-green-50 flex items-center justify-center group-hover:bg-green-800 transition-colors">
              <FileBarChart className="w-8 h-8 text-green-800 group-hover:text-white transition-colors" />
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h4 className="text-2xl md:text-3xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
                  Schedule C
                </h4>
                <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-1 rounded-full">NEW</span>
              </div>
              <p className="text-slate-600 text-base leading-relaxed pr-16">
                Generate IRS Schedule C forms for sole proprietors with complete income, expenses, and profit/loss calculations.
              </p>
              <div className="pt-4">
                <div className="inline-flex items-center gap-2">
                  <span className="text-3xl font-black" style={{ color: '#1a4731' }}>$15</span>
                  <span className="text-slate-500">per document</span>
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
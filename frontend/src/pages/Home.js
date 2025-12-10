import { useNavigate } from "react-router-dom";
import { FileText, FileBarChart, CheckCircle, Shield, Clock } from "lucide-react";
import Header from "@/components/Header";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white relative">
      <div className="noise-overlay" />
      
      <Header title="DocuMint" />

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-20 md:py-32">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
          {/* Left: Hero Content */}
          <div className="md:col-span-7 space-y-8">
            <div>
              <p className="text-xs uppercase tracking-widest text-slate-500 mb-4" style={{ letterSpacing: '0.15em' }}>
                PROFESSIONAL DOCUMENT GENERATION
              </p>
              <h2 className="text-5xl md:text-7xl font-black tracking-tight mb-6" style={{ fontFamily: 'Outfit, sans-serif', lineHeight: '1' }}>
                Generate
                <span className="block" style={{ color: '#1a4731' }}>Authentic</span>
                <span className="block">Documents</span>
              </h2>
              <p className="text-lg md:text-xl leading-relaxed text-slate-600 max-w-2xl">
                Create professional pay stubs and bank statements instantly. Simple, secure, and ready to use.
              </p>
            </div>

            {/* Feature Pills */}
            <div className="flex flex-wrap gap-3">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 rounded-md border border-green-200">
                <CheckCircle className="w-4 h-4 text-green-700" />
                <span className="text-sm font-medium text-green-900">Instant Download</span>
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 rounded-md border border-green-200">
                <Shield className="w-4 h-4 text-green-700" />
                <span className="text-sm font-medium text-green-900">Secure Payment</span>
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 rounded-md border border-green-200">
                <Clock className="w-4 h-4 text-green-700" />
                <span className="text-sm font-medium text-green-900">No Registration</span>
              </div>
            </div>
          </div>

          {/* Right: Visual Element */}
          <div className="md:col-span-5">
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1762831063505-68022b6133a9?crop=entropy&cs=srgb&fm=jpg&q=85&w=800"
                alt="Professional workspace"
                className="w-full h-auto rounded-md shadow-2xl border border-slate-200"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Document Selection Grid */}
      <section className="max-w-7xl mx-auto px-6 pb-32">
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
              <FileText className="w-8 h-8 text-green-800 group-hover:text-white transition-colors" />
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
            onClick={() => navigate("/bankstatement")}
            className="group relative p-8 md:p-12 bg-white border-2 border-slate-200 rounded-md hover:border-green-800 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 text-left"
          >
            <div className="absolute top-6 right-6 w-16 h-16 rounded-full bg-green-50 flex items-center justify-center group-hover:bg-green-800 transition-colors">
              <FileBarChart className="w-8 h-8 text-green-800 group-hover:text-white transition-colors" />
            </div>
            
            <div className="space-y-4">
              <h4 className="text-2xl md:text-3xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
                Bank Statement
              </h4>
              <p className="text-slate-600 text-base leading-relaxed pr-16">
                Create detailed bank statements with transaction history, account summaries, and professional formatting.
              </p>
              <div className="pt-4">
                <div className="inline-flex items-center gap-2">
                  <span className="text-3xl font-black" style={{ color: '#1a4731' }}>$50</span>
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
                src="https://images.unsplash.com/photo-1696013910376-c56f76dd8178?crop=entropy&cs=srgb&fm=jpg&q=85&w=600"
                alt="Secure payment"
                className="w-full h-auto rounded-md shadow-xl border border-slate-300"
              />
            </div>
            <div className="space-y-6">
              <h3 className="text-3xl md:text-4xl font-black tracking-tight" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
                Secure & Instant
              </h3>
              <p className="text-lg leading-relaxed text-slate-600">
                Your payment is processed securely through Razorpay. Once payment is confirmed, your document is generated and downloaded immediately.
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

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-8">
        <div className="max-w-7xl mx-auto px-6 text-center text-slate-500 text-sm">
          <p>© 2025 DocuMint. Professional document generation service.</p>
        </div>
      </footer>
    </div>
  );
}
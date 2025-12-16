import { useNavigate } from "react-router-dom";
import { FileText, FileBarChart, CheckCircle, Shield, Clock, PiggyBank, Calendar, Receipt } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Example from '../assests/example.png';
import secure from '../assests/secure.png';

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white relative">
      <div className="noise-overlay" />
      
      <Header title="MintSlip" />

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
                src={Example}
                alt="Professional workspace"
                className="w-full h-auto rounded-md shadow-2xl border border-slate-200"
              />
            </div>
          </div>
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
                A pay stub is a document that summarizes an employee's pay for a specific pay period. It's typically created by an employer in conjunction with each paycheck and can be provided in paper or electronic form.
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
                MintSlip provides a wide selection of paystub templates to suit your needs. Whether you're a freelancer, small business owner, or employee, we've got you covered with professional, accurate documents.
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
              Transparent Pricing, Unmatched Value — That's the MintSlip Promise
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

          {/* Utility Card */}
          <button
            data-testid="bankstatement-card-button"
            onClick={() => navigate("/")}
            className="group relative p-8 md:p-12 bg-white border-2 border-slate-200 rounded-md hover:border-green-800 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 text-left"
          >
            <div className="absolute top-6 right-6 w-16 h-16 rounded-full bg-green-50 flex items-center justify-center group-hover:bg-green-800 transition-colors">
              <FileText className="w-8 h-8 text-green-800 group-hover:text-white transition-colors" />
            </div>
            
            <div className="space-y-4">
              <h4 className="text-2xl md:text-3xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
                Utility Bill (Coming Soon)
              </h4>
              <p className="text-slate-600 text-base leading-relaxed pr-16">
                Create fully detailed utility bills with usage summaries, billing periods, account details, and itemized charges.
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
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { CheckCircle, Target, Eye, Award, Users, Shield, Zap, FileText } from "lucide-react";

const STATS = [
  { value: "50K+", label: "Documents Generated", icon: FileText },
  { value: "99.9%", label: "Accuracy Rate", icon: CheckCircle },
  { value: "24hr", label: "Support Response", icon: Zap },
  { value: "100%", label: "Secure & Private", icon: Shield },
];

const TESTIMONIALS = [
  {
    name: "Sarah Mitchell",
    role: "Small Business Owner",
    quote: "MintSlip has saved me countless hours. The pay stubs are accurate and professional. My accountant loves how organized everything is now.",
    stat: "35%",
    statLabel: "Time Saved"
  },
  {
    name: "David Chen",
    role: "Freelance Contractor",
    quote: "As a contractor, I needed a reliable way to generate proof of income. MintSlip delivers every time with accurate calculations and professional formatting.",
    stat: "$10K+",
    statLabel: "Income Documented"
  },
  {
    name: "Jennifer Adams",
    role: "HR Manager",
    quote: "We've switched to MintSlip for all our document needs. The W-2 generator alone has reduced our administrative workload significantly.",
    stat: "40%",
    statLabel: "Less Errors"
  },
];

const VALUES = [
  {
    icon: Target,
    title: "Mission",
    description: "To make financial document generation simple, accurate, and accessible to everyone. We believe everyone deserves professional-quality documents without the complexity."
  },
  {
    icon: Eye,
    title: "Vision",
    description: "To be the most trusted document generation platform in the USA, known for accuracy, affordability, and exceptional user experience."
  },
  {
    icon: Award,
    title: "Achievements",
    description: "Over 50,000 documents generated with a 99.9% accuracy rate. We've helped thousands of individuals and businesses create professional financial documents."
  },
];

export default function About() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-green-900 via-green-800 to-green-900 text-white py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-6" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Your Trusted Partner in Document Generation
            </h1>
            <p className="text-lg md:text-xl text-green-100 leading-relaxed mb-8">
              At MintSlip, we understand the importance of accurate financial documentation. Our commitment is to simplify the process, offering an accurate, easy-to-use, and affordable document generator tailored to the unique needs of businesses, entrepreneurs, and individuals across the USA.
            </p>
            <Button 
              onClick={() => navigate("/")}
              size="lg"
              className="h-12 px-8 text-base font-semibold bg-white text-green-800 hover:bg-green-50"
            >
              Get Started
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-green-50 border-y border-green-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {STATS.map((stat, index) => {
              const IconComponent = stat.icon;
              return (
                <div key={index} className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mb-3">
                    <IconComponent className="w-6 h-6 text-green-700" />
                  </div>
                  <p className="text-3xl md:text-4xl font-black text-green-800 mb-1">{stat.value}</p>
                  <p className="text-sm text-slate-600">{stat.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-6" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
                From a Simple Idea to Industry Leaders
              </h2>
              <p className="text-slate-600 text-lg leading-relaxed mb-6">
                MintSlip began with a mission to revolutionize the way financial documents are created. Frustrated by the inaccuracy, high costs, and complexity of traditional methods, we saw an opportunity for innovation.
              </p>
              <p className="text-slate-600 text-lg leading-relaxed mb-6">
                Today, we're proud to be recognized as a trusted solution for pay stubs, accounting mockups, W-2 forms, and more. Our platform empowers individuals and businesses to generate professional documents in minutes, not hours.
              </p>
              <p className="text-slate-600 text-lg leading-relaxed">
                We believe that everyone deserves access to professional-quality financial documents without the need for expensive software or accounting expertise.
              </p>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-green-100 to-green-50 rounded-2xl p-8 md:p-12">
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-white rounded-xl p-6 shadow-sm">
                    <FileText className="w-10 h-10 text-green-700 mb-3" />
                    <p className="font-bold text-green-800 text-lg">Pay Stubs</p>
                    <p className="text-sm text-slate-500">Professional & Accurate</p>
                  </div>
                  <div className="bg-white rounded-xl p-6 shadow-sm">
                    <Shield className="w-10 h-10 text-green-700 mb-3" />
                    <p className="font-bold text-green-800 text-lg">Accounting Mockups</p>
                    <p className="text-sm text-slate-500">Detailed & Complete</p>
                  </div>
                  <div className="bg-white rounded-xl p-6 shadow-sm">
                    <Award className="w-10 h-10 text-green-700 mb-3" />
                    <p className="font-bold text-green-800 text-lg">W-2 Forms</p>
                    <p className="text-sm text-slate-500">Compliant</p>
                  </div>
                  <div className="bg-white rounded-xl p-6 shadow-sm">
                    <Users className="w-10 h-10 text-green-700 mb-3" />
                    <p className="font-bold text-green-800 text-lg">Support</p>
                    <p className="text-sm text-slate-500">24hr Response</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission, Vision, Achievements */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-4" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
              What Drives Us
            </h2>
            <p className="text-slate-600 text-lg max-w-2xl mx-auto">
              Our core values guide everything we do at MintSlip
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {VALUES.map((value, index) => {
              const IconComponent = value.icon;
              return (
                <div key={index} className="bg-white rounded-xl p-8 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                  <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mb-5">
                    <IconComponent className="w-7 h-7 text-green-700" />
                  </div>
                  <h3 className="text-xl font-bold text-green-800 mb-3">{value.title}</h3>
                  <p className="text-slate-600 leading-relaxed">{value.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-4" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
              Proven Results - Here's What Our Clients Say
            </h2>
            <p className="text-slate-600 text-lg max-w-2xl mx-auto">
              Thousands of satisfied customers trust MintSlip for their document needs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {TESTIMONIALS.map((testimonial, index) => (
              <div key={index} className="bg-white rounded-xl p-8 shadow-lg border border-slate-100">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-green-600 to-green-800 flex items-center justify-center">
                    <span className="text-white font-bold text-lg">{testimonial.name.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">{testimonial.name}</p>
                    <p className="text-sm text-slate-500">{testimonial.role}</p>
                  </div>
                </div>
                
                <blockquote className="text-slate-600 leading-relaxed mb-6">
                  "{testimonial.quote}"
                </blockquote>
                
                <div className="pt-4 border-t border-slate-100">
                  <p className="text-2xl font-black text-green-700">{testimonial.stat}</p>
                  <p className="text-sm text-slate-500">{testimonial.statLabel}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-br from-green-800 to-green-900 text-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Ready to Get Started?
          </h2>
          <p className="text-green-100 text-lg mb-8 max-w-xl mx-auto">
            Create professional pay stubs, accounting mockups, W-2 forms, and more in minutes. No complicated software required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={() => navigate("/")}
              size="lg"
              className="h-12 px-8 text-base font-semibold bg-white text-green-800 hover:bg-green-50"
            >
              Create Your Document
            </Button>
            <Button 
              onClick={() => navigate("/contact")}
              size="lg"
              variant="outline"
              className="h-12 px-8 text-base font-semibold border-white text-white hover:bg-white/10"
            >
              Contact Us
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

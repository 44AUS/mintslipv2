import { useNavigate } from "react-router-dom";
import { Home, ArrowLeft, FileText, FileBarChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white relative flex flex-col">
      <div className="noise-overlay" />
      
      <Header title="MintSlip" />

      <div className="flex-1 flex items-center justify-center px-6 py-20">
        <div className="text-center max-w-2xl mx-auto">
          {/* 404 Number */}
          <div className="relative mb-8">
            <h1 
              className="text-[180px] md:text-[220px] font-black leading-none select-none"
              style={{ 
                fontFamily: 'Outfit, sans-serif',
                color: '#1a4731',
                opacity: 0.1
              }}
            >
              404
            </h1>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <h2 
                  className="text-4xl md:text-5xl font-bold mb-4"
                  style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}
                >
                  Page Not Found
                </h2>
                <p className="text-lg text-slate-600">
                  Oops! The page you're looking for doesn't exist or has been moved.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Button
              onClick={() => navigate(-1)}
              variant="outline"
              size="lg"
              className="gap-2 min-w-[180px]"
            >
              <ArrowLeft className="w-4 h-4" />
              Go Back
            </Button>
            <Button
              onClick={() => navigate("/")}
              size="lg"
              className="gap-2 min-w-[180px]"
              style={{ backgroundColor: '#1a4731' }}
            >
              <Home className="w-4 h-4" />
              Back to Home
            </Button>
          </div>

          {/* Quick Links */}
          <div className="border-t border-slate-200 pt-8">
            <p className="text-sm text-slate-500 mb-6">Or try one of these popular pages:</p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Button
                onClick={() => navigate("/paystub-generator")}
                variant="ghost"
                className="gap-2 text-slate-600 hover:text-green-800"
              >
                <FileText className="w-4 h-4" />
                Generate Pay Stub
              </Button>
              <Button
                onClick={() => navigate("/accountant-mockup")}
                variant="ghost"
                className="gap-2 text-slate-600 hover:text-green-800"
              >
                <FileBarChart className="w-4 h-4" />
                Generate Accountant Mockup
              </Button>
              <Button
                onClick={() => navigate("/faq")}
                variant="ghost"
                className="gap-2 text-slate-600 hover:text-green-800"
              >
                FAQ
              </Button>
              <Button
                onClick={() => navigate("/contact")}
                variant="ghost"
                className="gap-2 text-slate-600 hover:text-green-800"
              >
                Contact Us
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

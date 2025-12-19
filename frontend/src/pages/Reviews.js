import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HelpCircle, FileText, Building2, Receipt, Search } from "lucide-react";
import { Input } from "@/components/ui/input";


export default function Reviews() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("general");

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-green-900 via-green-800 to-green-900 text-white py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-6" style={{ fontFamily: 'Outfit, sans-serif' }}>
            MintSlip Reviews
          </h1>
          <p className="text-lg md:text-xl text-green-100 max-w-2xl mx-auto mb-10">
            MintSlip's most frequently asked questions by our customers
          </p>
        </div>
      </section>

      {/* Review Content */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        
      </section>

      {/* Still Have Questions CTA */}
      <section className="bg-green-50 py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-6">
            <HelpCircle className="w-8 h-8 text-green-700" />
          </div>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight mb-4" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
            Still have questions?
          </h2>
          <p className="text-slate-600 text-lg mb-8 max-w-xl mx-auto">
            Can't find the answer you're looking for? Our support team is here to help.
          </p>
          <Button 
            onClick={() => navigate("/contact")}
            size="lg"
            className="h-12 px-8 text-base font-semibold bg-green-800 hover:bg-green-900"
          >
            Contact Support
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
}

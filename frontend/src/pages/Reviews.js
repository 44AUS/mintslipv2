import { useState } from "react";
import { openSupportChat } from "@/utils/openSupportChat";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HelpCircle, FileText, Building2, Receipt, Search } from "lucide-react";
import { Input } from "@/components/ui/input";


export default function Reviews() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("general");

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-14 sm:pt-16 sm:pb-16">
        <div aria-hidden="true" className="absolute top-10 -left-32 w-96 h-96 bg-emerald-100/60 rounded-full filter blur-3xl pointer-events-none" />
        <div aria-hidden="true" className="absolute bottom-0 -right-32 w-[28rem] h-[28rem] bg-emerald-50 rounded-full filter blur-3xl pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 mb-6" style={{ fontFamily: 'Outfit, sans-serif' }}>
            MintSlip <span className="text-emerald-700">Reviews</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto mb-10">
            What our customers say about MintSlip
          </p>
        </div>
      </section>

      {/* Review Content */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        
      </section>

      {/* Still Have Questions CTA */}
      <section className="bg-emerald-50 py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 mb-6">
            <HelpCircle className="w-8 h-8 text-emerald-700" />
          </div>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight mb-4" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
            Still have questions?
          </h2>
          <p className="text-slate-600 text-lg mb-8 max-w-xl mx-auto">
            Can't find the answer you're looking for? Our support team is here to help.
          </p>
          <Button 
            onClick={() => openSupportChat()}
            size="lg"
            className="h-12 px-8 text-base font-semibold bg-emerald-800 hover:bg-emerald-900"
          >
            Contact Support
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
}

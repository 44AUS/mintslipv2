import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { toast } from "sonner";
import { Mail, MapPin, Clock, Send, MessageSquare, HelpCircle } from "lucide-react";

const CONTACT_REASONS = [
  { value: "order-issue", label: "Didn't receive order" },
  { value: "pricing", label: "Pricing questions" },
  { value: "partnership", label: "Partnership/Outreach opportunity" },
  { value: "document-error", label: "Error with documents" },
  { value: "refund", label: "Refund request" },
  { value: "other", label: "Other" },
];

const FAQS = [
  {
    question: "How much does it cost to generate a document?",
    answer: "Our pricing is transparent and affordable. Pay stubs start at $10, bank statements range from $50-$70, and W-2 forms are $15 per document."
  },
  {
    question: "Is MintSlip secure and confidential?",
    answer: "Absolutely! We prioritize your privacy. All documents are generated in your browser and we do not store any of your personal information after download."
  },
  {
    question: "Can I generate documents for previous dates?",
    answer: "Yes, you can create documents with custom dates to match your specific needs, whether for current or past periods."
  },
  {
    question: "How quickly will I receive my document?",
    answer: "Instantly! Once payment is confirmed, your document is generated and downloaded immediately. No waiting required."
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept all major payment methods through PayPal, including credit cards, debit cards, and PayPal balance."
  },
];

export default function Contact() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    reason: "",
    message: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.reason || !formData.message) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsSubmitting(true);
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    toast.success("Message sent successfully! We'll get back to you within 24 hours.");
    setFormData({ name: "", email: "", reason: "", message: "" });
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-green-900 via-green-800 to-green-900 text-white py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-6" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Get in touch with us today
          </h1>
          <p className="text-lg md:text-xl text-green-100 max-w-2xl mx-auto">
            We're always here to help! Reach out to us with any questions or concerns, and our team will respond within 24 hours.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          {/* Contact Form */}
          <div className="order-2 lg:order-1">
            <div className="bg-white p-8 rounded-xl shadow-lg border border-slate-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-green-700" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
                    Send us a message
                  </h2>
                  <p className="text-sm text-slate-500">Fill out the form below</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Your full name"
                    value={formData.name}
                    onChange={handleChange}
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={handleChange}
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reason">Reason for contact *</Label>
                  <Select value={formData.reason} onValueChange={(val) => setFormData({...formData, reason: val})}>
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Select a reason" />
                    </SelectTrigger>
                    <SelectContent>
                      {CONTACT_REASONS.map(reason => (
                        <SelectItem key={reason.value} value={reason.value}>{reason.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message *</Label>
                  <Textarea
                    id="message"
                    name="message"
                    placeholder="How can we help you?"
                    value={formData.message}
                    onChange={handleChange}
                    rows={5}
                    className="resize-none"
                  />
                </div>

                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full h-12 text-base font-semibold bg-green-800 hover:bg-green-900"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Sending...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Send className="w-4 h-4" />
                      Send Message
                    </span>
                  )}
                </Button>
              </form>
            </div>
          </div>

          {/* Contact Info */}
          <div className="order-1 lg:order-2 space-y-8">
            <div className="bg-gradient-to-br from-green-800 to-green-900 text-white p-8 rounded-xl shadow-lg">
              <h2 className="text-2xl font-bold mb-6" style={{ fontFamily: 'Outfit, sans-serif' }}>
                Contact Information
              </h2>
              <p className="text-green-100 mb-8">
                Fill up the form and our team will get back to you within 24 hours.
              </p>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-green-700/50 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-5 h-5 text-green-200" />
                  </div>
                  <div>
                    <p className="text-sm text-green-200 mb-1">Email Us</p>
                    <a href="mailto:support@mintslip.com" className="text-white hover:text-green-200 transition-colors font-medium">
                      support@mintslip.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-green-700/50 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 text-green-200" />
                  </div>
                  <div>
                    <p className="text-sm text-green-200 mb-1">Response Time</p>
                    <p className="text-white font-medium">Within 24 hours</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-green-700/50 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-green-200" />
                  </div>
                  <div>
                    <p className="text-sm text-green-200 mb-1">Location</p>
                    <p className="text-white font-medium">United States</p>
                  </div>
                </div>
              </div>

              {/* Decorative element */}
              <div className="mt-10 pt-8 border-t border-green-700/50">
                <p className="text-sm text-green-200">
                  Need immediate assistance? Check our FAQ section below for quick answers to common questions.
                </p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-50 p-6 rounded-xl border border-green-100 text-center">
                <p className="text-3xl font-black text-green-800 mb-1">24h</p>
                <p className="text-sm text-slate-600">Response Time</p>
              </div>
              <div className="bg-green-50 p-6 rounded-xl border border-green-100 text-center">
                <p className="text-3xl font-black text-green-800 mb-1">98%</p>
                <p className="text-sm text-slate-600">Satisfaction Rate</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-slate-50 py-16">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
              <HelpCircle className="w-8 h-8 text-green-700" />
            </div>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-4" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
              Frequently Asked Questions
            </h2>
            <p className="text-slate-600 text-lg">
              Get quick answers to common questions
            </p>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            {FAQS.map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`}
                className="bg-white rounded-xl border border-slate-200 px-6 shadow-sm"
              >
                <AccordionTrigger className="text-left font-semibold text-slate-800 hover:text-green-800 py-5">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-slate-600 pb-5">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-2xl md:text-3xl font-black tracking-tight mb-4" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
            Ready to generate your documents?
          </h2>
          <p className="text-slate-600 mb-8">
            Create professional pay stubs, bank statements, and W-2 forms in minutes.
          </p>
          <Button 
            onClick={() => navigate("/")}
            size="lg"
            className="h-12 px-8 text-base font-semibold bg-green-800 hover:bg-green-900"
          >
            Get Started Now
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-8">
        <div className="max-w-7xl mx-auto px-6 text-center text-slate-500 text-sm">
          <p>© 2025 MintSlip. Professional document generation service.</p>
        </div>
      </footer>
    </div>
  );
}

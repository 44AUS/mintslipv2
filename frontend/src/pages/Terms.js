import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { FileText, AlertCircle, CreditCard, Ban, Scale, RefreshCw, Mail } from "lucide-react";

const TERMS_SECTIONS = [
  {
    icon: FileText,
    title: "Acceptance of Terms",
    content: `By accessing and using MintSlip's services, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.

• These terms constitute a legally binding agreement between you and MintSlip.
• If you do not agree to these terms, please do not use our services.
• We reserve the right to update these terms at any time. Continued use of our services after changes constitutes acceptance of the new terms.
• You must be at least 18 years old to use our services.`
  },
  {
    icon: AlertCircle,
    title: "Service Description",
    content: `MintSlip provides online document generation services including:

• **Pay Stub Generator**: Create professional pay stubs for employees and contractors.
• **Bank Statement Generator**: Generate detailed bank statements.
• **W-2 Form Generator**: Create W-2 tax forms with accurate calculations.

All documents are generated directly in your browser. We do not store your personal or financial information on our servers.`
  },
  {
    icon: Scale,
    title: "Acceptable Use",
    content: `You agree to use MintSlip's services only for lawful purposes. Specifically, you agree NOT to:

• Use our services for any fraudulent, illegal, or deceptive purposes.
• Create documents containing false or misleading information.
• Use generated documents to misrepresent your income, employment status, or financial situation.
• Attempt to circumvent any security features of our platform.
• Use our services in any way that could harm MintSlip or other users.

**Important**: Documents generated through MintSlip should only be used for legitimate purposes. You are solely responsible for the accuracy of information you enter and how you use the generated documents.`
  },
  {
    icon: CreditCard,
    title: "Payment Terms",
    content: `Our payment terms are as follows:

• **Pricing**: Pay stubs are $10 each, bank statements are $50-$70, and W-2 forms are $15 each.
• **Payment Processing**: All payments are processed securely through PayPal.
• **Immediate Delivery**: Documents are generated and available for download immediately upon successful payment.
• **Currency**: All prices are in US Dollars (USD).
• **No Hidden Fees**: The price shown is the total price you pay.`
  },
  {
    icon: RefreshCw,
    title: "Refund Policy",
    content: `Due to the digital nature of our products:

• **General Policy**: We do not offer refunds for completed document generations, as the service is delivered immediately upon payment.
• **Exceptions**: If you experience technical issues that prevent you from downloading your document, please contact us within 24 hours of purchase.
• **Duplicate Purchases**: If you accidentally made a duplicate purchase, contact us with your transaction details for review.
• **Quality Issues**: If there's a genuine error in our calculations or document generation, we will work with you to resolve the issue.

To request assistance, contact us at support@mintslip.com with your PayPal transaction ID.`
  },
  {
    icon: Ban,
    title: "Limitation of Liability",
    content: `To the fullest extent permitted by law:

• MintSlip provides services "as is" without warranties of any kind.
• We are not liable for any indirect, incidental, or consequential damages arising from your use of our services.
• We are not responsible for how you use the documents generated through our platform.
• Our total liability is limited to the amount you paid for the specific service in question.
• We do not guarantee that our services will be uninterrupted or error-free.

You agree to use our services at your own risk and to verify all information in generated documents.`
  },
  {
    icon: Mail,
    title: "Contact Information",
    content: `For questions about these Terms of Service or our services:

• **Email**: support@mintslip.com
• **Response Time**: Within 24 hours
• **Support Hours**: 24/7 email support

We are committed to addressing your concerns promptly and professionally.`
  }
];

export default function Terms() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-green-900 via-green-800 to-green-900 text-white py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-3xl">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-700/50 mb-6">
              <Scale className="w-8 h-8 text-green-200" />
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-6" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Terms of Service
            </h1>
            <p className="text-lg md:text-xl text-green-100 leading-relaxed">
              Please read these terms carefully before using MintSlip's document generation services.
            </p>
            <p className="text-sm text-green-200 mt-4">
              Last updated: January 2025
            </p>
          </div>
        </div>
      </section>

      {/* Introduction */}
      <section className="py-12 bg-green-50 border-b border-green-100">
        <div className="max-w-4xl mx-auto px-6">
          <p className="text-lg text-slate-700 leading-relaxed">
            Welcome to MintSlip. These Terms of Service ("Terms") govern your use of our website and document generation services. 
            By using our services, you agree to comply with and be bound by these Terms. Please review them carefully before using our platform.
          </p>
        </div>
      </section>

      {/* Terms Sections */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-6">
          <div className="space-y-12">
            {TERMS_SECTIONS.map((section, index) => {
              const IconComponent = section.icon;
              return (
                <div key={index} className="relative">
                  <div className="flex items-start gap-6">
                    <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-green-100 flex items-center justify-center">
                      <IconComponent className="w-7 h-7 text-green-700" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold text-green-800 mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>
                        {section.title}
                      </h2>
                      <div className="prose prose-slate max-w-none">
                        {section.content.split('\n\n').map((paragraph, pIndex) => (
                          <p key={pIndex} className="text-slate-600 leading-relaxed mb-4 whitespace-pre-line">
                            {paragraph.split('**').map((part, partIndex) => 
                              partIndex % 2 === 1 ? <strong key={partIndex}>{part}</strong> : part
                            )}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                  {index < TERMS_SECTIONS.length - 1 && (
                    <div className="border-b border-slate-200 mt-12"></div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 bg-slate-50">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h3 className="text-xl font-bold text-green-800 mb-4">Questions About Our Terms?</h3>
          <p className="text-slate-600 mb-6">
            If you have any questions about these Terms of Service, please don't hesitate to reach out.
          </p>
          <button
            onClick={() => navigate("/contact")}
            className="inline-flex items-center gap-2 px-6 py-3 bg-green-800 text-white rounded-lg font-semibold hover:bg-green-900 transition-colors"
          >
            <Mail className="w-4 h-4" />
            Contact Us
          </button>
        </div>
      </section>

      <Footer />
    </div>
  );
}

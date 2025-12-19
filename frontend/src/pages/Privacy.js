import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Shield, Lock, Eye, FileText, Users, Mail } from "lucide-react";

const PRIVACY_SECTIONS = [
  {
    icon: FileText,
    title: "Information We Collect",
    content: `When you use MintSlip, we may collect certain information to provide our services effectively:

• **Personal Information**: Name, email address, and contact details when you reach out to our support team.
• **Document Data**: Information you enter into our document generators (pay stubs, accounting mockups, W-2 forms, etc). This data is processed in your browser and is NOT stored on our servers.
• **Payment Information**: Payment details are processed securely through PayPal. We do not store your credit card or bank account information.
• **Usage Data**: General analytics about how you interact with our website to improve our services.`
  },
  {
    icon: Lock,
    title: "How We Use Your Information",
    content: `We use the information we collect for the following purposes:

• **Service Delivery**: To generate the documents you request and process your payments.
• **Customer Support**: To respond to your inquiries and provide assistance.
• **Service Improvement**: To understand how users interact with our platform and make improvements.
• **Communication**: To send important updates about our services (only when necessary).

We do NOT sell, rent, or share your personal information with third parties for marketing purposes.`
  },
  {
    icon: Shield,
    title: "Data Security",
    content: `We take the security of your information seriously:

• **Browser-Based Processing**: All document generation happens directly in your browser. Your sensitive data (wages, SSN, etc.) is never transmitted to or stored on our servers.
• **Secure Payments**: All payment transactions are processed through PayPal's secure payment system.
• **SSL Encryption**: Our website uses SSL encryption to protect data transmission.
• **No Data Retention**: We do not retain copies of the documents you generate. Once downloaded, the data exists only on your device.`
  },
  {
    icon: Eye,
    title: "Your Privacy Rights",
    content: `You have the following rights regarding your personal information:

• **Access**: You can request information about what personal data we have about you.
• **Correction**: You can request corrections to any inaccurate information.
• **Deletion**: You can request deletion of your personal information from our systems.
• **Opt-Out**: You can opt out of any marketing communications at any time.

To exercise any of these rights, please contact us at support@mintslip.com.`
  },
  {
    icon: Users,
    title: "Third-Party Services",
    content: `We use the following third-party services:

• **PayPal**: For secure payment processing. PayPal's privacy policy governs how they handle your payment information.
• **Analytics**: We may use analytics services to understand website usage patterns. These services collect anonymized data only.

We carefully select our partners and require them to maintain appropriate security measures.`
  },
  {
    icon: Mail,
    title: "Contact Us",
    content: `If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:

• **Email**: support@mintslip.com
• **Response Time**: We typically respond within 24 hours

We are committed to resolving any privacy concerns promptly and transparently.`
  }
];

export default function Privacy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-green-900 via-green-800 to-green-900 text-white py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-3xl">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-700/50 mb-6">
              <Shield className="w-8 h-8 text-green-200" />
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-6" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Privacy Policy
            </h1>
            <p className="text-lg md:text-xl text-green-100 leading-relaxed">
              Your privacy matters to us. This policy explains how MintSlip collects, uses, and protects your information.
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
            At MintSlip, we are committed to protecting your privacy and ensuring the security of your personal information. 
            This Privacy Policy describes how we collect, use, and safeguard your data when you use our document generation services. 
            By using our services, you agree to the practices described in this policy.
          </p>
        </div>
      </section>

      {/* Privacy Sections */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-6">
          <div className="space-y-12">
            {PRIVACY_SECTIONS.map((section, index) => {
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
                  {index < PRIVACY_SECTIONS.length - 1 && (
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
          <h3 className="text-xl font-bold text-green-800 mb-4">Have Questions?</h3>
          <p className="text-slate-600 mb-6">
            If you have any questions about our privacy practices, we're here to help.
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

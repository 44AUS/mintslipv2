import { useNavigate } from "react-router-dom";
import { Mail, MapPin, Phone, Facebook, Twitter, Instagram, Linkedin, Youtube } from "lucide-react";

const FOOTER_LINKS = {
  documents: {
    title: "Documents",
    links: [
      { name: "Pay Stub Generator", path: "/paystub-generator" },
      { name: "Canadian Pay Stub Generator", path: "/canadian-paystub-generator" },
      { name: "Accounting Mockups", path: "/accounting-mockup-generator" },
      { name: "W-2 Form Generator", path: "/w2-generator" },
      { name: "W-9 Form Generator", path: "/w9-generator" },
      { name: "1099-NEC Form Generator", path: "/1099-nec-generator" },
      { name: "1099-MISC Form Generator", path: "/1099-misc-generator" },
      { name: "Offer Letter Generator", path: "/offer-letter-generator" },
      { name: "Schedule C Form Generator", path: "/schedule-c-generator" },
      { name: "Vehicle Bill of Sale Generator", path: "/vehicle-bill-of-sale-generator" },
      { name: "Service Expense Generator", path: "/service-expense-generator" },
      { name: "Contractor Paystub Generator", path: "/contractor-paystub-generator" },
      { name: "Instant Paystub Generator", path: "/instant-paystub-generator" },
      { name: "Self Employed Paystub Generator", path: "/self-employed-paystub-generator" },
    ]
  },
  company: {
    title: "Company",
    links: [
      { name: "About Us", path: "/about" },
      { name: "Contact", path: "/contact" },
      { name: "FAQ", path: "/faq" },
      { name: "How to Make a Paystub", path: "/how-to-make-a-paystub" },
    ]
  },
  legal: {
    title: "Legal",
    links: [
      { name: "Privacy Policy", path: "/privacy" },
      { name: "Terms of Service", path: "/terms" },
      { name: "Refund Policy", path: "/contact" },
    ]
  }
};

const SOCIAL_LINKS = [
  { icon: Facebook, href: "https://www.facebook.com/MintSlip", label: "Facebook" },
  { icon: Twitter, href: "https://www.x.com/MintSlip", label: "Twitter" },
  { icon: Instagram, href: "https://www.instagram.com/MintSlip", label: "Instagram" },
  { icon: Linkedin, href: "https://www.linkedin.com/MintSlip", label: "LinkedIn" },
  { icon: Youtube, href: "https://www.youtube.com/MintSlip", label: "YouTube" },
];

export default function Footer() {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-6 pt-16 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          
          {/* Brand & Description */}
          <div className="lg:col-span-2">
            <button 
              onClick={() => navigate("/")}
              className="text-2xl font-black tracking-tight mb-4 block"
              style={{ fontFamily: 'Outfit, sans-serif' }}
            >
              <span className="text-green-400">mint</span>
              <span className="text-white">slip</span>
            </button>
            <p className="text-slate-400 text-sm leading-relaxed mb-6 max-w-sm">
              Maximize your personal & business potential with our SaaS technology
            </p>
            
            {/* Contact Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-slate-400">
                <Mail className="w-4 h-4 text-green-400" />
                <a href="mailto:support@mintslip.com" className="hover:text-white transition-colors">
                  support@mintslip.com
                </a>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-400">
                <MapPin className="w-4 h-4 text-green-400" />
                <span>United States</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-400">
                <Phone className="w-4 h-4 text-green-400" />
                <span>24/7 Support Available</span>
              </div>
            </div>
          </div>

          {/* Document Links */}
          <div>
            <h4 className="font-bold text-white mb-4 text-sm uppercase tracking-wider">
              {FOOTER_LINKS.documents.title}
            </h4>
            <ul className="space-y-3">
              {FOOTER_LINKS.documents.links.map((link) => (
                <li key={link.name}>
                  <button
                    onClick={() => navigate(link.path)}
                    className="text-slate-400 hover:text-green-400 transition-colors text-sm"
                  >
                    {link.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="font-bold text-white mb-4 text-sm uppercase tracking-wider">
              {FOOTER_LINKS.company.title}
            </h4>
            <ul className="space-y-3">
              {FOOTER_LINKS.company.links.map((link) => (
                <li key={link.name}>
                  <button
                    onClick={() => navigate(link.path)}
                    className="text-slate-400 hover:text-green-400 transition-colors text-sm"
                  >
                    {link.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="font-bold text-white mb-4 text-sm uppercase tracking-wider">
              {FOOTER_LINKS.legal.title}
            </h4>
            <ul className="space-y-3">
              {FOOTER_LINKS.legal.links.map((link) => (
                <li key={link.name}>
                  <button
                    onClick={() => navigate(link.path)}
                    className="text-slate-400 hover:text-green-400 transition-colors text-sm"
                  >
                    {link.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-700 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            
            {/* Copyright */}
            <p className="text-slate-500 text-sm">
              © {currentYear} MintSlip. All rights reserved.
            </p>

            {/* Social Links */}
            <div className="flex items-center gap-4">
              {SOCIAL_LINKS.map((social) => {
                const IconComponent = social.icon;
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    aria-label={social.label}
                    className="w-10 h-10 rounded-full bg-slate-800 hover:bg-green-600 flex items-center justify-center transition-colors"
                  >
                    <IconComponent className="w-4 h-4 text-slate-400 hover:text-white" />
                  </a>
                );
              })}
            </div>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="mt-8 pt-8 border-t border-slate-800">
          <div className="flex flex-wrap justify-center items-center gap-8 text-slate-500 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-green-900/50 flex items-center justify-center">
                <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <span>Secure Payments</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-green-900/50 flex items-center justify-center">
                <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <span>Privacy Protected</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-green-900/50 flex items-center justify-center">
                <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span>Instant Download</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-green-900/50 flex items-center justify-center">
                <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <span>24/7 Support</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

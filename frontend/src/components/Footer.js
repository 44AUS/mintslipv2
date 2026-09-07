import { useNavigate } from "react-router-dom";
import MintSlipLogo from '../assests/mintslip-logo.png';
import '../marketing-nav.css';

// Marketing footer — whodat's footer layout (wide brand column + four mono
// link columns + bottom bar with copyright and disclaimer), in MintSlip green.
const COLUMNS = [
  {
    title: "Product",
    links: [
      { name: "Pay Stub Generator", path: "/paystub-generator" },
      { name: "Canadian Pay Stubs", path: "/canadian-paystub-generator" },
      { name: "Sample Templates", path: "/paystub-samples" },
      { name: "AI Resume Builder", path: "/ai-resume-builder" },
    ],
  },
  {
    title: "Tax Forms",
    links: [
      { name: "W-2 Generator", path: "/w2-generator" },
      { name: "W-9 Generator", path: "/w9-generator" },
      { name: "1099-NEC Generator", path: "/1099-nec-generator" },
      { name: "Schedule C Generator", path: "/schedule-c-generator" },
    ],
  },
  {
    title: "Tools & Compare",
    links: [
      { name: "All Generators", path: "/generators" },
      { name: "Offer Letter Generator", path: "/offer-letter-generator" },
      { name: "Commercial Lease", path: "/commercial-lease-generator" },
      { name: "MintSlip vs Others", path: "/mintslip-vs-other-paystub-generators" },
    ],
  },
  {
    title: "Trust",
    links: [
      { name: "About Us", path: "/about" },
      { name: "Privacy Policy", path: "/privacy" },
      { name: "Terms of Service", path: "/terms" },
      { name: "FAQ & Refunds", path: "/faq" },
    ],
  },
];

export default function Footer() {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="footer-container">
        <div className="footer-grid">
          <div className="footer-col footer-brand-col">
            <button className="footer-brand" onClick={() => navigate("/")} aria-label="MintSlip home"
              style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}>
              <img src={MintSlipLogo} alt="MintSlip" />
            </button>
            <div className="footer-badges">
              <a href="https://apps.apple.com/us/iphone/today" target="_blank" rel="noopener noreferrer">
                <img src="https://customer-assets.emergentagent.com/job_email-service-repair/artifacts/ekke591i_685b07d537802a80992e4b58_Group-1538236230.svg" alt="Download on the App Store" />
              </a>
              <a href="https://play.google.com/store/apps/details?id=com.mintslip.app&hl=en_US" target="_blank" rel="noopener noreferrer">
                <img src="https://customer-assets.emergentagent.com/job_email-service-repair/artifacts/g56lcgcv_685b07d5f3fb1a2291ebea9b_Group-1538236231.svg" alt="Get it on Google Play" />
              </a>
            </div>
          </div>

          {COLUMNS.map(col => (
            <div key={col.title} className="footer-col">
              <h4>{col.title}</h4>
              {col.links.map(link => (
                <button key={link.name} type="button" className="footer-link-btn" onClick={() => navigate(link.path)}>
                  {link.name}
                </button>
              ))}
            </div>
          ))}
        </div>

        <div className="footer-bottom">
          <span>© {currentYear} MintSlip, Inc.</span>
          <span>MintSlip generates documents from information you provide. You are responsible for the accuracy and lawful use of any document you create.</span>
        </div>
      </div>
    </footer>
  );
}

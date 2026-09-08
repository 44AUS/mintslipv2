import { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import Leaf3D from "@/components/Leaf3D";
import MintSlipLogo from "@/assests/mintslip-logo.png";
import { t, useLanguage } from "@/utils/i18n";

// Rotating "what you can make here" lines under the leaf — English keys, the
// i18n dictionaries carry the Spanish/French versions.
const PHRASES = [
  "Create a Pay Stub",
  "Create a W-2",
  "Build Your AI Resume",
  "Create a Commercial Lease",
  "Create an Offer Letter",
  "Generate a 1099",
  "Create a Power of Attorney",
];

// /app landing — the whodat app-home treatment: the brand's 3D object (the
// mint leaf, like whodat's magnifying glass) floating over a pulsing glow in
// an otherwise-calm content card, with a cycling line of things to create.
export default function AppHome() {
  useLanguage();
  const [phraseIdx, setPhraseIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setPhraseIdx((i) => (i + 1) % PHRASES.length), 2400);
    return () => clearInterval(id);
  }, []);

  return (
    <AppLayout fillHeight>
      <style>{`
        @keyframes mshPhraseIn { 0% { opacity: 0; transform: translateY(10px); } 100% { opacity: 1; transform: translateY(0); } }
      `}</style>
      <div style={{ padding: 10, height: "100%", boxSizing: "border-box" }}>
        <div style={{
          background: "var(--ion-card-background)", borderRadius: 12, padding: "20px 20px 24px",
          height: "100%", overflowY: "auto", boxShadow: "0 2px 12px rgba(0,0,0,0.10)", boxSizing: "border-box",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{ maxWidth: 480, width: "100%", textAlign: "center", padding: "24px 0" }}>

            {/* Real 3D leaf (Three.js, drag to spin) over its glow */}
            <div style={{ marginBottom: 10 }}>
              <Leaf3D height={230} />
            </div>

            {/* Brand */}
            <img src={MintSlipLogo} alt="MintSlip" style={{ height: 38, width: "auto", display: "block", margin: "0 auto 8px" }} />

            <div style={{ fontSize: "0.95rem", fontWeight: 500, color: "var(--ion-color-medium)", marginBottom: 20 }}>
              {t("What would you like to create today?")}
            </div>

            {/* Cycling create line */}
            <div style={{ height: 34, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
              <div key={phraseIdx} style={{
                fontFamily: "Outfit, sans-serif", fontWeight: 800, fontSize: "1.35rem",
                color: "#059669", letterSpacing: "-0.01em", whiteSpace: "nowrap",
                animation: "mshPhraseIn 0.45s ease both",
              }}>
                {t(PHRASES[phraseIdx])}
              </div>
            </div>

            <div style={{ fontSize: "0.8rem", color: "var(--ion-color-step-400, var(--ion-color-medium))", marginTop: 22 }}>
              {t("Professional documents in minutes.")}
            </div>

          </div>
        </div>
      </div>
    </AppLayout>
  );
}

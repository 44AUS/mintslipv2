import { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
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
  "Create a Bank Statement",
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

  const leafFace = (
    <svg viewBox="0 0 64 74" width="132" height="153" aria-hidden="true">
      <defs>
        <linearGradient id="mshLeafG" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#4ade80" />
          <stop offset="1" stopColor="#15803d" />
        </linearGradient>
      </defs>
      <path d="M32 4 C 12 16 6 34 12 48 C 17 59 27 63 32 64 C 37 63 47 59 52 48 C 58 34 52 16 32 4 Z" fill="url(#mshLeafG)" />
      <path d="M32 10 L 32 62" stroke="rgba(255,255,255,0.55)" strokeWidth="2" fill="none" />
      <path d="M32 24 C 26 26 21 30 18 35 M32 36 C 27 38 23 42 21 46 M32 24 C 38 26 43 30 46 35 M32 36 C 37 38 41 42 43 46"
        stroke="rgba(255,255,255,0.4)" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      <path d="M32 62 C 32 66 33 70 35 73" stroke="#15803d" strokeWidth="3.5" fill="none" strokeLinecap="round" />
    </svg>
  );

  return (
    <AppLayout fillHeight>
      <style>{`
        @keyframes mshLeafSpin { 0% { transform: rotateY(0deg); } 100% { transform: rotateY(360deg); } }
        @keyframes mshLeafFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }
        @keyframes mshGlowPulse { 0%, 100% { opacity: 0.5; transform: translateX(-50%) scale(1); } 50% { opacity: 0.9; transform: translateX(-50%) scale(1.18); } }
        @keyframes mshPhraseIn { 0% { opacity: 0; transform: translateY(10px); } 100% { opacity: 1; transform: translateY(0); } }
        @media (prefers-reduced-motion: reduce) {
          .msh-leaf-spin, .msh-leaf-float, .msh-glow { animation: none !important; }
        }
      `}</style>
      <div style={{ padding: 10, height: "100%", boxSizing: "border-box" }}>
        <div style={{
          background: "var(--ion-card-background)", borderRadius: 12, padding: "20px 20px 24px",
          height: "100%", overflowY: "auto", boxShadow: "0 2px 12px rgba(0,0,0,0.10)", boxSizing: "border-box",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{ maxWidth: 480, width: "100%", textAlign: "center", padding: "24px 0" }}>

            {/* 3D floating leaf over its glow */}
            <div style={{ position: "relative", height: 210, marginBottom: 4 }}>
              <div aria-hidden="true" className="msh-glow" style={{
                position: "absolute", left: "50%", bottom: 0, transform: "translateX(-50%)",
                width: 210, height: 66,
                background: "radial-gradient(ellipse at center, rgba(34,197,94,0.35) 0%, transparent 70%)",
                filter: "blur(16px)", animation: "mshGlowPulse 2.8s ease-in-out infinite",
              }} />
              <div className="msh-leaf-float" style={{
                position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
                animation: "mshLeafFloat 3.4s ease-in-out infinite", perspective: 700,
              }}>
                <div className="msh-leaf-spin" style={{
                  position: "relative", width: 132, height: 153, transformStyle: "preserve-3d",
                  animation: "mshLeafSpin 5s linear infinite",
                  filter: "drop-shadow(0 12px 28px rgba(21,128,61,0.35))",
                }}>
                  <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden" }}>{leafFace}</div>
                  <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>{leafFace}</div>
                </div>
              </div>
            </div>

            {/* Brand */}
            <div style={{ fontFamily: "Outfit, sans-serif", fontWeight: 900, fontSize: 30, letterSpacing: "0.02em", color: "var(--ion-text-color)", marginBottom: 6 }}>
              mint<span style={{ color: "#16a34a" }}>slip</span>
            </div>

            <div style={{ fontSize: "0.95rem", fontWeight: 500, color: "var(--ion-color-medium)", marginBottom: 20 }}>
              {t("What would you like to create today?")}
            </div>

            {/* Cycling create line */}
            <div style={{ height: 34, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
              <div key={phraseIdx} style={{
                fontFamily: "Outfit, sans-serif", fontWeight: 800, fontSize: "1.35rem",
                color: "#16a34a", letterSpacing: "-0.01em", whiteSpace: "nowrap",
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

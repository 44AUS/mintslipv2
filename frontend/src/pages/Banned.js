import { useEffect, useState } from "react";
import { IonButton, IonIcon } from "@ionic/react";
import { mailOutline } from "ionicons/icons";
import RedX3D from "@/components/RedX3D";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";

// The banned screen, in the same design language as the /app payment-success
// animation screen: a full-viewport wash that follows the app's dark mode, a
// floating 3D mark over a pulsing glow (the success screen's leaf, here a red
// X), the Outfit headline, and the status copy underneath — the ban reason.
export default function Banned() {
  const [banInfo, setBanInfo] = useState(null);
  const dark = typeof window !== "undefined" && localStorage.getItem("appDarkMode") === "true";

  useEffect(() => {
    const checkBan = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/check-ip-ban`);
        if (response.ok) {
          const data = await response.json();
          if (data.banned) setBanInfo(data);
        }
      } catch (error) {
        console.error("Error checking ban status:", error);
      }
    };
    checkBan();
  }, []);

  const bg = dark ? "#121212" : "#f6faf7";
  const ink = dark ? "#ffffff" : "#0f172a";
  const sub = dark ? "rgba(255,255,255,0.62)" : "#64748b";
  const reason = (banInfo?.reason || "").trim() || "violating our terms of service";

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, background: bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <style>{`
        @keyframes bnMsgIn { 0% { opacity: 0; transform: translateY(6px); } 100% { opacity: 1; transform: translateY(0); } }
      `}</style>
      <div style={{ maxWidth: 380, width: "100%", textAlign: "center" }}>
        {/* 3D red X over its glow — the success screen's leaf, gone wrong */}
        <div style={{ marginBottom: 8 }}>
          <RedX3D height={190} />
        </div>

        {/* Thin red rule where the success screen keeps its progress bar */}
        <div style={{ height: 6, borderRadius: 99, background: dark ? "rgba(239,68,68,0.35)" : "rgba(239,68,68,0.22)", overflow: "hidden", marginBottom: 22 }}>
          <div style={{ width: "100%", height: "100%", background: "#ef4444", opacity: 0.85 }} />
        </div>

        <h2 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, fontSize: 22, color: ink, margin: "0 0 8px" }}>
          You have been banned
        </h2>
        <p style={{ color: sub, fontSize: 15, margin: 0, lineHeight: 1.55, animation: "bnMsgIn 0.35s ease" }}>
          You have been banned from using MintSlip because of <span style={{ color: "#ef4444", fontWeight: 600 }}>{reason}</span>.
        </p>

        <p style={{ color: sub, fontSize: 12.5, margin: "14px 0 0", opacity: 0.8 }}>
          {banInfo?.bannedAt
            ? `Banned ${new Date(banInfo.bannedAt).toLocaleString()}`
            : `Checked ${new Date().toLocaleString()}`}
        </p>

        <div style={{ marginTop: 24 }}>
          <IonButton
            expand="block"
            color="danger"
            fill="outline"
            href="mailto:support@mintslip.com"
            style={{ "--border-radius": "10px" }}
          >
            <IonIcon slot="start" icon={mailOutline} style={{ fontSize: 16 }} />
            Contact Support
          </IonButton>
          <p style={{ color: sub, fontSize: 12, margin: "12px 0 0", lineHeight: 1.5 }}>
            If you believe this is a mistake, reach out and include the time shown above.
          </p>
        </div>

        <p style={{ color: sub, fontSize: 12, margin: "26px 0 0", opacity: 0.7 }}>
          © {new Date().getFullYear()} MintSlip. All rights reserved.
        </p>
      </div>
    </div>
  );
}

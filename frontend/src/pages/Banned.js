import { useEffect, useState } from "react";
import { IonIcon } from "@ionic/react";
import { banOutline, mailOutline } from "ionicons/icons";
import MintSlipLogo from "@/assests/mintslip-logo.png";
import "@/styles/paywall.css";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";

// The banned screen — the exit-intent paywall's exact design language,
// retinted red (.pw-banned), with no close button: it is not dismissible.
// Shown only when a banned visitor tries to enter the /app area.
export default function Banned() {
  const [banInfo, setBanInfo] = useState(null);

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

  const reason = (banInfo?.reason || "").trim() || "violating our terms of service";

  return (
    <div className="pw pw-banned">
      <span className="pw-scrim" aria-hidden="true" />

      {/* Brand bar — same as the paywall (no close button: not dismissible) */}
      <div className="pw-brandbar">
        <img className="pw-logo" src={MintSlipLogo} alt="MintSlip" />
      </div>

      {/* Header block */}
      <div className="pw-head pw-swap">
        <span className="pw-badge"><IonIcon icon={banOutline} /> Account Restricted</span>
        <h1 className="pw-title">You have been banned</h1>
        <p className="pw-subtitle">Access to the MintSlip app has been revoked</p>
      </div>

      {/* Bottom: reason card + contact CTA — the paywall's offer card layout */}
      <div className="pw-foot pw-swap">
        <div className="pw-plan">
          <span className="pw-plan-info">
            <strong>Reason for this ban</strong>
            <span style={{ fontSize: 14, color: "#fecaca", fontWeight: 600 }}>
              You have been banned from using MintSlip because of {reason}.
            </span>
            {banInfo?.bannedAt && (
              <span>Banned {new Date(banInfo.bannedAt).toLocaleString()}</span>
            )}
          </span>
        </div>
        <a className="pw-cta" href="mailto:support@mintslip.com" style={{ textDecoration: "none" }}>
          <IonIcon icon={mailOutline} /> Contact Support
        </a>
        <p className="pw-fine">
          If you believe this is a mistake, email support@mintslip.com. © {new Date().getFullYear()} MintSlip.
        </p>
      </div>
    </div>
  );
}

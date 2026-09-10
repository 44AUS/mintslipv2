import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { IonIcon } from "@ionic/react";
import { closeOutline, timeOutline, lockClosedOutline, checkmarkCircle } from "ionicons/icons";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import MintSlipLogo from "@/assests/mintslip-logo.png";
import FiveStars from "@/assests/images/5star.png";
import { launchConfetti } from "@/utils/confetti";
import "@/styles/paywall.css";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";

// Client-side defaults so the discount + countdown always show, even if the
// server offer endpoint isn't reachable. The server offer (when available)
// overrides these and is enforced at charge time.
const DEFAULT_PERCENT = 20;
const DEFAULT_MINUTES = 10;

const money = (n) => {
  const v = Number(n) || 0;
  return Number.isInteger(v) ? `$${v}` : `$${v.toFixed(2)}`;
};

const REVIEWS = [
  { quote: "“Looked exactly like my real one — approved for my apartment the same day.”", name: "Marcus T." },
  { quote: "“Fast, clean, and the formatting was perfect. Saved me a huge headache.”", name: "Priya K." },
  { quote: "“Needed proof of income last minute — this was a total lifesaver.”", name: "Daniel R." },
  { quote: "“Super easy to fill out and the download was instant. Worth every penny.”", name: "Jessica M." },
];

const Stars = ({ className = "" }) => (
  <img className={`pw-stars-img ${className}`} src={FiveStars} alt="5 star rating" />
);

function hapticCelebrate() {
  try {
    [0, 120, 240, 420, 600].forEach((ms) =>
      setTimeout(() => Haptics.impact({ style: ImpactStyle.Heavy }).catch(() => {}), ms));
  } catch (_) { /* best-effort */ }
}

// Exit-intent paywall. Two screens: an offer screen ("Download your …") and, if
// that's closed, an "Are you sure?" last-chance screen with testimonials +
// confetti. Always shows on abandon; only an admin "off" hides it.
export default function Paywall({ docLabel, basePrice, previewImage, onUnlock, onDismiss }) {
  const [screen, setScreen] = useState("offer"); // "offer" | "sure"
  const [offer, setOffer] = useState(() => ({
    pct: DEFAULT_PERCENT,
    expiresAt: new Date(Date.now() + DEFAULT_MINUTES * 60000).toISOString(),
    serverEnforced: false,
  }));
  const [dismissed, setDismissed] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [reviewIdx, setReviewIdx] = useState(0);
  const dismissedRef = useRef(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        let token = "";
        try { token = localStorage.getItem("userToken") || ""; } catch {}
        const res = await fetch(`${BACKEND_URL}/api/paywall/offer`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = res.ok ? await res.json() : null;
        if (!alive) return;
        if (data?.success && data.active && data.discountPercent > 0) {
          setOffer({ pct: data.discountPercent, expiresAt: data.expiresAt, serverEnforced: true });
        } else if (data?.success && data.active === false) {
          setDismissed(true); // admin turned it off
        } else {
          console.warn(`Paywall: server offer unavailable (HTTP ${res.status}); using client-side offer.`);
        }
      } catch (e) {
        console.warn("Paywall: offer request failed; using client-side offer.", e);
      }
    })();
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (dismissed && !dismissedRef.current) { dismissedRef.current = true; onDismiss?.(); }
  }, [dismissed, onDismiss]);

  // Countdown to expiry.
  useEffect(() => {
    const deadline = new Date(offer.expiresAt).getTime();
    const tick = () => setSecondsLeft(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)));
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [offer.expiresAt]);

  // Rotate testimonials (only relevant on the "sure" screen).
  useEffect(() => {
    if (screen !== "sure") return undefined;
    setReviewIdx(0);
    const iv = setInterval(() => setReviewIdx((i) => (i + 1) % REVIEWS.length), 4000);
    return () => clearInterval(iv);
  }, [screen]);

  // Celebrate when the last-chance screen appears.
  useEffect(() => {
    if (screen === "sure") { launchConfetti(); hapticCelebrate(); }
  }, [screen]);

  const { discountedPrice, pct } = useMemo(() => {
    const baseCents = Math.round(basePrice * 100);
    const discCents = Math.max(50, Math.round(baseCents * (100 - offer.pct) / 100));
    return { discountedPrice: discCents / 100, pct: offer.pct };
  }, [offer, basePrice]);

  const expired = secondsLeft <= 0;
  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");

  if (dismissed) return null;

  const onX = () => { if (screen === "offer") setScreen("sure"); else onDismiss?.(); };

  // Shared offer card + CTA (full width).
  const OfferBlock = () => (
    <>
      <div className="pw-feature"><IonIcon icon={checkmarkCircle} /> Instant download · No subscription</div>
      <div className="pw-plan">
        <span className="pw-plan-info">
          <strong>{docLabel}</strong>
          <span>One-time purchase</span>
        </span>
        <span className="pw-plan-price">
          <strong>
            <s className="pw-strike">{money(basePrice)}</s>
            {money(discountedPrice)}
          </strong>
          <span className="pw-plan-save">You save {money(basePrice - discountedPrice)}</span>
        </span>
      </div>
      <button className="pw-cta" onClick={() => onUnlock?.(discountedPrice, offer.serverEnforced)} disabled={expired}>
        <IonIcon icon={lockClosedOutline} /> {expired ? "Offer expired" : `Complete for ${money(discountedPrice)}`}
      </button>
      {expired
        ? <button className="pw-textbtn" onClick={() => onDismiss?.()}>Close</button>
        : <p className="pw-fine">One-time purchase. No subscription required.</p>}
    </>
  );

  return createPortal(
    <div className="pw">
      {/* Blurred replica of the document behind the paywall (what was in the
          modal), the same approach whodat uses — filter:blur renders reliably
          on every device, unlike backdrop-filter. */}
      {previewImage
        ? <img className="pw-bgimg" src={previewImage} alt="" aria-hidden="true" />
        : <span className="pw-bgfill" aria-hidden="true" />}
      <span className="pw-scrim" aria-hidden="true" />

      <button className="pw-x" onClick={onX} aria-label="Close">
        <IonIcon icon={closeOutline} />
      </button>

      <div className="pw-brandbar">
        <img className="pw-logo" src={MintSlipLogo} alt="MintSlip" />
      </div>

      {screen === "offer" ? (
        <>
          <div className="pw-head pw-swap" key="offer-head">
            <span className="pw-badge"><IonIcon icon={timeOutline} /> {pct}% Off — Limited Time</span>
            <h1 className="pw-title">Download your {docLabel}</h1>
            <p className="pw-subtitle">The #1 Document Creation App</p>
            <Stars />
            {!expired && (
              <>
                <p className="pw-expires">Offer expires in</p>
                <div className="pw-countdown">
                  <div className="pw-cd-box">
                    <span className="pw-cd-num">{mm}</span>
                    <span className="pw-cd-label">Minutes</span>
                  </div>
                  <span className="pw-cd-sep">:</span>
                  <div className="pw-cd-box">
                    <span className="pw-cd-num">{ss}</span>
                    <span className="pw-cd-label">Seconds</span>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="pw-foot pw-swap" key="offer-foot">
            <OfferBlock />
          </div>
        </>
      ) : (
        <>
          <div className="pw-head pw-swap" key="sure-head">
            <span className="pw-badge"><IonIcon icon={timeOutline} /> {pct}% Off — Limited Time</span>
            <h1 className="pw-title">Are you sure?</h1>
          </div>

          <div className="pw-foot pw-swap" key="sure-foot">
            <div className="pw-reviews">
              <div className="pw-reviews-track" style={{ transform: `translateX(-${reviewIdx * 100}%)` }}>
                {REVIEWS.map((r, i) => (
                  <div className="pw-review" key={i}>
                    <Stars className="pw-review-stars" />
                    <p>{r.quote}</p>
                    <span>— {r.name}</span>
                  </div>
                ))}
              </div>
              <div className="pw-dots" aria-hidden="true">
                {REVIEWS.map((_, i) => <span key={i} className={i === reviewIdx ? "on" : ""} />)}
              </div>
            </div>
            <OfferBlock />
          </div>
        </>
      )}
    </div>,
    document.body,
  );
}

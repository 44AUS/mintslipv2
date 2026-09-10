import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { IonIcon } from "@ionic/react";
import { closeOutline, timeOutline, lockClosedOutline, checkmarkCircle, star } from "ionicons/icons";
import MintSlipLogo from "@/assests/mintslip-logo.png";
import "@/styles/paywall.css";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";

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

const Stars = () => (
  <span className="pw-stars" aria-label="5 star rating">
    {[0, 1, 2, 3, 4].map((i) => <IonIcon key={i} icon={star} />)}
  </span>
);

// Exit-intent paywall: shown when a buyer closes the checkout without paying.
// It ALWAYS appears on abandon (that's the point) and only stays hidden when an
// admin has explicitly turned the offer off. When there's an active offer it
// shows the discounted, server-enforced price + countdown; if the offer can't
// be fetched it falls back to the full price (never overcharging) so the paywall
// still shows and the failure is diagnosable in the console.
export default function Paywall({ docLabel, basePrice, previewImage, onUnlock, onDismiss }) {
  // offer: undefined = loading, "disabled" = admin off (dismiss), object = active,
  //        "failed" = couldn't fetch (still show at full price)
  const [offer, setOffer] = useState(undefined);
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
          setOffer({ pct: data.discountPercent, expiresAt: data.expiresAt });
        } else if (data?.success && data.active === false) {
          setOffer("disabled"); // admin turned it off
        } else {
          console.warn(`Paywall: offer unavailable (HTTP ${res.status}); showing at full price.`);
          setOffer("failed");
        }
      } catch (e) {
        console.warn("Paywall: offer request failed; showing at full price.", e);
        if (alive) setOffer("failed");
      }
    })();
    return () => { alive = false; };
  }, []);

  // Admin turned the offer off → behave like a normal close.
  useEffect(() => {
    if (offer === "disabled" && !dismissedRef.current) { dismissedRef.current = true; onDismiss?.(); }
  }, [offer, onDismiss]);

  const active = offer && typeof offer === "object";

  // Countdown to the offer's expiry.
  useEffect(() => {
    if (!active) return undefined;
    const deadline = new Date(offer.expiresAt).getTime();
    const tick = () => setSecondsLeft(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)));
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [active, offer]);

  // Rotate testimonials.
  useEffect(() => {
    const iv = setInterval(() => setReviewIdx((i) => (i + 1) % REVIEWS.length), 4000);
    return () => clearInterval(iv);
  }, []);

  const { discountedPrice, pct } = useMemo(() => {
    if (!active) return { discountedPrice: basePrice, pct: 0 };
    const baseCents = Math.round(basePrice * 100);
    const discCents = Math.max(50, Math.round(baseCents * (100 - offer.pct) / 100));
    return { discountedPrice: discCents / 100, pct: offer.pct };
  }, [active, offer, basePrice]);

  const loading = offer === undefined;
  const expired = active && secondsLeft <= 0;
  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");

  // Only stay hidden when the admin disabled the offer (the dismiss effect closes it).
  if (offer === "disabled") return null;

  const ctaLabel = loading
    ? "Just a sec…"
    : active
      ? (expired ? "Offer expired" : `Unlock for ${money(discountedPrice)}`)
      : `Complete for ${money(basePrice)}`;

  return createPortal(
    <div className="pw">
      {previewImage ? <img className="pw-bgimg" src={previewImage} alt="" aria-hidden="true" /> : null}
      <span className="pw-scrim" aria-hidden="true" />

      <button className="pw-x" onClick={() => onDismiss?.()} aria-label="Close">
        <IonIcon icon={closeOutline} />
      </button>

      <div className="pw-brandbar">
        <img className="pw-logo" src={MintSlipLogo} alt="MintSlip" />
      </div>

      <div className="pw-head pw-swap">
        {active
          ? <span className="pw-badge"><IonIcon icon={timeOutline} /> {pct}% Off — Limited Time</span>
          : <span className="pw-badge"><IonIcon icon={lockClosedOutline} /> Almost There</span>}
        <h1 className="pw-title">{active ? `Wait — here's ${pct}% off` : "Wait — don't miss out"}</h1>
        <p className="pw-subtitle">
          {active ? `Finish your ${docLabel} at a one-time special price` : `Finish your ${docLabel} — you're one step away`}
        </p>
        <Stars />
        {active && !expired && (
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

      <div className="pw-foot">
        <div className="pw-reviews">
          <div className="pw-reviews-track" style={{ transform: `translateX(-${reviewIdx * 100}%)` }}>
            {REVIEWS.map((r, i) => (
              <div className="pw-review" key={i}>
                <Stars />
                <p>{r.quote}</p>
                <span>— {r.name}</span>
              </div>
            ))}
          </div>
          <div className="pw-dots" aria-hidden="true">
            {REVIEWS.map((_, i) => <span key={i} className={i === reviewIdx ? "on" : ""} />)}
          </div>
        </div>

        <div className="pw-feature"><IonIcon icon={checkmarkCircle} /> Instant download · No subscription</div>

        <div className="pw-plan">
          <span className="pw-plan-info">
            <strong>{docLabel}</strong>
            <span>One-time purchase</span>
          </span>
          <span className="pw-plan-price">
            <strong>
              {active && <s className="pw-strike">{money(basePrice)}</s>}
              {money(discountedPrice)}
            </strong>
            {active && <span className="pw-plan-save">You save {money(basePrice - discountedPrice)}</span>}
          </span>
        </div>

        <button className="pw-cta" onClick={() => onUnlock?.(discountedPrice)} disabled={loading || expired}>
          <IonIcon icon={lockClosedOutline} /> {ctaLabel}
        </button>
        {expired
          ? <button className="pw-textbtn" onClick={() => onDismiss?.()}>Close</button>
          : <p className="pw-fine">One-time purchase. No subscription required.</p>}
      </div>
    </div>,
    document.body,
  );
}

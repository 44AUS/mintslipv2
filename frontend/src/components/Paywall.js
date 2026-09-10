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

const money = (n) => {
  const v = Number(n) || 0;
  return Number.isInteger(v) ? `$${v}` : `$${v.toFixed(2)}`;
};

// Document-specific testimonials so a buyer never sees paystub reviews on an
// offer-letter paywall.
const GENERIC_REVIEWS = [
  { q: "“Fast, clean, and the formatting was perfect. Saved me a huge headache.”", n: "Marcus T." },
  { q: "“Exactly what I needed and the download was instant. Worth every penny.”", n: "Priya K." },
  { q: "“Super easy to fill out — had my document in a couple of minutes.”", n: "Daniel R." },
  { q: "“Looked professional and completely legit. Would use again.”", n: "Jessica M." },
];
const TAX_REVIEWS = [
  { q: "“All the boxes lined up perfectly — filed without a single issue.”", n: "Marcus T." },
  { q: "“Saved me a trip to my accountant. Clean and accurate.”", n: "Priya K." },
  { q: "“Needed it last minute for my taxes and it was ready in minutes.”", n: "Emily R." },
  { q: "“Looked exactly like the official form. Huge time-saver.”", n: "Kevin B." },
];
const LEGAL_REVIEWS = [
  { q: "“Professional and thorough — my agreement was signed the same day.”", n: "Alicia M." },
  { q: "“Had all the right clauses. Saved me hundreds in legal fees.”", n: "Jared P." },
  { q: "“Clean formatting and easy to fill out. Exactly what I needed.”", n: "Sophia L." },
  { q: "“Looked like my attorney drafted it. Worth every penny.”", n: "Kevin B." },
];
const REVIEWS_BY_TYPE = {
  paystub: [
    { q: "“Looked exactly like my real one — approved for my apartment the same day.”", n: "Marcus T." },
    { q: "“Needed proof of income last minute for my lease. Total lifesaver.”", n: "Priya K." },
    { q: "“Clean, accurate, and the math was perfect. Printed it and I was set.”", n: "Daniel R." },
    { q: "“Way easier than my old payroll portal. Had my stub in two minutes.”", n: "Jessica M." },
  ],
  "offer-letter": [
    { q: "“Professional offer letter in minutes — my new hire signed that afternoon.”", n: "Alicia M." },
    { q: "“Looked like it came straight from HR. Saved me drafting from scratch.”", n: "Kevin B." },
    { q: "“Clean formatting and all the right sections. Exactly what I needed.”", n: "Sophia L." },
    { q: "“Needed an offer letter for a visa — this did the job perfectly.”", n: "Jared P." },
  ],
  "bank-statement": [
    { q: "“The statement formatting was spot-on. Everything lined up like the real thing.”", n: "Marcus T." },
    { q: "“Perfect for my bookkeeping mockup — clean, clear, and fast.”", n: "Priya K." },
    { q: "“Saved me hours rebuilding a statement by hand. Worth it.”", n: "Daniel R." },
    { q: "“Looked exactly right down to the transaction rows.”", n: "Emily R." },
  ],
  resume: [
    { q: "“Landed two interviews the week I sent this resume out.”", n: "Jordan K." },
    { q: "“The AI nailed my experience — barely had to edit anything.”", n: "Sophia L." },
    { q: "“Clean, modern, and recruiter-ready. Downloaded and applied same day.”", n: "Kevin B." },
    { q: "“Best-looking resume I've had. Instant download too.”", n: "Emily R." },
  ],
};
function reviewsFor(dt) {
  const t = dt === "canadian-paystub" ? "paystub" : dt === "ai-resume" ? "resume" : dt;
  if (["w2", "w9", "1099-nec", "1099-misc", "schedule-c"].includes(t)) return TAX_REVIEWS;
  if (["commercial-lease", "power-of-attorney", "cease-and-desist", "legal-document"].includes(t)) return LEGAL_REVIEWS;
  return REVIEWS_BY_TYPE[t] || GENERIC_REVIEWS;
}

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
// confetti. The discount + countdown are a server-tracked, per-IP, weekly offer
// (persists across reopens). Without an active offer the paywall still shows as
// a nudge, at full price. Only an admin "off" hides it.
export default function Paywall({ docLabel, documentType, basePrice, previewImage, onUnlock, onDismiss }) {
  const [screen, setScreen] = useState("offer"); // "offer" | "sure"
  const [offer, setOffer] = useState(undefined);  // undefined=loading, null=dismiss, {active,pct,expiresAt}
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [reviewIdx, setReviewIdx] = useState(0);
  const dismissedRef = useRef(false);
  const reviews = useMemo(() => reviewsFor(documentType), [documentType]);

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
        if (data?.success && data.enabled === false) {
          setOffer(null); // admin turned it off
        } else if (data?.success && data.active && data.discountPercent > 0) {
          setOffer({ active: true, pct: data.discountPercent, expiresAt: data.expiresAt });
        } else {
          // Enabled but no active offer for this IP (already used this week), or
          // unreachable → show the paywall at full price (never a fake discount).
          if (!data) console.warn(`Paywall: offer request failed (HTTP ${res.status}); showing at full price.`);
          setOffer({ active: false, pct: 0, expiresAt: null });
        }
      } catch (e) {
        console.warn("Paywall: offer request failed; showing at full price.", e);
        if (alive) setOffer({ active: false, pct: 0, expiresAt: null });
      }
    })();
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (offer === null && !dismissedRef.current) { dismissedRef.current = true; onDismiss?.(); }
  }, [offer, onDismiss]);

  const active = !!(offer && offer.active && offer.expiresAt);

  // Countdown to the server's expiry (persists across reopens — same expiresAt).
  useEffect(() => {
    if (!active) { setSecondsLeft(0); return undefined; }
    const deadline = new Date(offer.expiresAt).getTime();
    const tick = () => setSecondsLeft(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)));
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [active, offer]);

  useEffect(() => {
    if (screen !== "sure") return undefined;
    setReviewIdx(0);
    const iv = setInterval(() => setReviewIdx((i) => (i + 1) % reviews.length), 4000);
    return () => clearInterval(iv);
  }, [screen, reviews.length]);

  useEffect(() => {
    if (screen === "sure") { launchConfetti(); hapticCelebrate(); }
  }, [screen]);

  const { discountedPrice, pct } = useMemo(() => {
    if (!active) return { discountedPrice: basePrice, pct: 0 };
    const baseCents = Math.round(basePrice * 100);
    const discCents = Math.max(50, Math.round(baseCents * (100 - offer.pct) / 100));
    return { discountedPrice: discCents / 100, pct: offer.pct };
  }, [active, offer, basePrice]);

  const expired = active && secondsLeft <= 0;
  const showCountdown = active && !expired;
  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");

  if (offer === null || offer === undefined) return null;

  const onX = () => { if (screen === "offer") setScreen("sure"); else onDismiss?.(); };

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
            {active && <s className="pw-strike">{money(basePrice)}</s>}
            {money(discountedPrice)}
          </strong>
          {active && <span className="pw-plan-save">You save {money(basePrice - discountedPrice)}</span>}
        </span>
      </div>
      <button className="pw-cta" onClick={() => onUnlock?.(discountedPrice, active)}>
        <IonIcon icon={lockClosedOutline} /> Complete for {money(discountedPrice)}
      </button>
      <p className="pw-fine">One-time purchase. No subscription required.</p>
    </>
  );

  return createPortal(
    <div className="pw">
      {/* Blurred backdrop. filter:blur on the preview image renders on every
          device (unlike backdrop-filter), guaranteeing the preview is blurred;
          the scrim also backdrop-blurs the live app chrome where supported. */}
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
            {active && <span className="pw-badge"><IonIcon icon={timeOutline} /> {pct}% Off — Limited Time</span>}
            <h1 className="pw-title">Download your {docLabel}</h1>
            <p className="pw-subtitle">The #1 Document Creation App</p>
            <Stars />
            {showCountdown && (
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
            {active && <span className="pw-badge"><IonIcon icon={timeOutline} /> {pct}% Off — Limited Time</span>}
            <h1 className="pw-title">Are you sure?</h1>
          </div>

          <div className="pw-foot pw-swap" key="sure-foot">
            <div className="pw-reviews">
              <div className="pw-reviews-track" style={{ transform: `translateX(-${reviewIdx * 100}%)` }}>
                {reviews.map((r, i) => (
                  <div className="pw-review" key={i}>
                    <Stars className="pw-review-stars" />
                    <p>{r.q}</p>
                    <span>— {r.n}</span>
                  </div>
                ))}
              </div>
              <div className="pw-dots" aria-hidden="true">
                {reviews.map((_, i) => <span key={i} className={i === reviewIdx ? "on" : ""} />)}
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

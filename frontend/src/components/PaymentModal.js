import { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon,
  IonInput, IonSpinner, IonNote,
} from "@ionic/react";
import { closeOutline, lockClosedOutline, checkmarkCircle } from "ionicons/icons";
import {
  useStripe, useElements, CardNumberElement, CardExpiryElement, CardCvcElement,
} from "@stripe/react-stripe-js";
import { nativePost } from "@/utils/nativeHttp";
import { sendDownloadEmailWithPdf } from "@/utils/emailWithPdf";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";

// Shared post-purchase delivery: email the generated file to the buyer and
// archive it to their account (logged-in) or the guest store (by email) so it
// shows in admin Saved Docs and the purchase detail modal. Mirrors what
// PaymentSuccess.js did for the hosted-checkout flow.
export async function deliverPurchasedDocument({ blob, documentType, template = null, email, userName = "" }) {
  if (!(blob instanceof Blob)) return;
  const isZip = !!blob.type && (blob.type.includes("zip"));
  if (email && email.includes("@")) {
    sendDownloadEmailWithPdf({
      email, userName, documentType, fileBlob: blob,
      isGuest: !localStorage.getItem("userToken"), isZip,
    }).catch(() => {});
  }
  try {
    const base64 = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    const fileName = `${documentType}_${new Date().toISOString().split("T")[0]}${isZip ? ".zip" : ".pdf"}`;
    const token = localStorage.getItem("userToken");
    if (token) {
      await fetch(`${BACKEND_URL}/api/user/saved-documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ documentType, fileName, fileData: base64, template }),
      });
    } else if (email && email.includes("@")) {
      await fetch(`${BACKEND_URL}/api/guest/saved-documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guestEmail: email, documentType, fileName, fileData: base64, template }),
      });
    }
  } catch (err) {
    console.error("Failed to archive purchased document:", err);
  }
}

// In-app card checkout modal — sits on top of the document form/preview modals
// (z 10010) with the same portal + slide-up chrome. Card details live in
// Stripe Elements iframes (never in our inputs); only the name and email are
// regular Ionic inputs. On success the host modal generates and downloads the
// document client-side while this modal shows a "preparing" state.
export default function PaymentModal({
  docLabel, documentType, template = null, basePrice, discount = null,
  quantity = 1, prefillEmail = "", prefillName = "", onSuccess, onClose,
}) {
  const stripe = useStripe();
  const elements = useElements();
  const isMobile = window.innerWidth < 768;

  const finalAmount = discount ? discount.discountedPrice : basePrice;
  const discountValue = discount ? Math.max(0, basePrice - discount.discountedPrice) : 0;

  const [name, setName] = useState(prefillName);
  const [email, setEmail] = useState(prefillEmail);
  const [focusedBox, setFocusedBox] = useState(null);
  const [cardErrors, setCardErrors] = useState({});
  const [error, setError] = useState("");
  const [stage, setStage] = useState("form"); // form | paying | delivering | delivered | deliverFailed

  const busy = stage === "paying" || stage === "delivering";

  // Stripe iframes can't read our CSS variables, so resolve theme colors once.
  const stripeStyle = useMemo(() => {
    const dark = document.body.classList.contains("dark");
    return {
      base: {
        color: dark ? "#f4f5f8" : "#111827",
        fontSize: "15px",
        fontFamily: '"Manrope", "Helvetica Neue", Helvetica, Arial, sans-serif',
        "::placeholder": { color: dark ? "rgba(244,245,248,0.45)" : "#9ca3af" },
        iconColor: dark ? "#9ba0a6" : "#6b7280",
      },
      invalid: { color: "#eb445a", iconColor: "#eb445a" },
    };
  }, []);

  const cardStyle = { backgroundColor: "var(--ion-card-background)", borderRadius: 8, boxShadow: "rgba(0,0,0,0.18) 0px 4px 24px", padding: 16, display: "flex", flexDirection: "column", gap: 14 };
  const headingStyle = { fontWeight: 700, fontSize: "0.95rem", color: "var(--ion-text-color)" };
  const smallLabelStyle = { fontSize: "0.75rem", color: "var(--ion-color-medium)", marginBottom: 4, display: "block" };
  const boxStyle = (key) => ({
    padding: "13px 12px",
    borderRadius: 6,
    border: `1px solid ${cardErrors[key] ? "var(--ion-color-danger)" : focusedBox === key ? "var(--ion-color-primary)" : "var(--ion-color-step-300, rgba(0,0,0,0.23))"}`,
    boxShadow: focusedBox === key ? "0 0 0 1px var(--ion-color-primary)" : "none",
    background: "var(--ion-card-background)",
    transition: "border-color 0.15s ease, box-shadow 0.15s ease",
  });
  const elementProps = (key) => ({
    onFocus: () => setFocusedBox(key),
    onBlur: () => setFocusedBox((f) => (f === key ? null : f)),
    onChange: (ev) => {
      setCardErrors((prev) => ({ ...prev, [key]: ev.error ? ev.error.message : null }));
    },
    options: { style: stripeStyle, ...(key === "number" ? { showIcon: true } : {}) },
  });

  const handlePay = async () => {
    setError("");
    if (!stripe || !elements) { setError("Payment form is still loading. Please try again."); return; }
    if (!name.trim()) { setError("Please enter the name on the card."); return; }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError("Please enter a valid email address."); return; }
    const firstCardError = ["number", "expiry", "cvc"].map((k) => cardErrors[k]).find(Boolean);
    if (firstCardError) { setError(firstCardError); return; }

    setStage("paying");
    try {
      const { ok, data } = await nativePost(`${BACKEND_URL}/api/stripe/create-payment-intent`, {
        amount: finalAmount,
        documentType,
        template,
        email: email.trim(),
        discountCode: discount?.code || null,
        discountAmount: discount ? parseFloat(discountValue.toFixed(2)) : 0,
        quantity,
      });
      if (!data) throw new Error("Server error. Please try again.");
      if (!ok || !data.clientSecret) throw new Error(data.detail || "Could not start the payment. Please try again.");

      const result = await stripe.confirmCardPayment(data.clientSecret, {
        payment_method: {
          card: elements.getElement(CardNumberElement),
          billing_details: { name: name.trim(), email: email.trim() },
        },
      });
      if (result.error) throw new Error(result.error.message || "Your card was declined. Please try again.");
      if (result.paymentIntent?.status !== "succeeded") throw new Error("Payment did not complete. Please try again.");

      setStage("delivering");
      try {
        await onSuccess({ email: email.trim(), name: name.trim(), paymentIntentId: result.paymentIntent.id });
        setStage("delivered");
        onClose();
      } catch (deliverErr) {
        console.error("Post-payment delivery failed:", deliverErr);
        setStage("deliverFailed");
      }
    } catch (err) {
      setError(err.message || "Payment failed. Please try again.");
      setStage("form");
    }
  };

  return createPortal(
    <div className="modal-backdrop" style={{ position: "fixed", inset: 0, zIndex: 10010, background: isMobile ? "var(--ion-background-color, #f2f2f7)" : "rgba(0,0,0,0.55)", display: "flex", alignItems: isMobile ? "stretch" : "center", justifyContent: isMobile ? "stretch" : "center" }}>
      <div className="modal-slide-up" style={{ background: "var(--ion-background-color, #f2f2f7)", color: "var(--ion-text-color)", display: "flex", flexDirection: "column", width: "100%", maxWidth: isMobile ? "100%" : 440, height: isMobile ? "100%" : "auto", maxHeight: isMobile ? "100%" : "92vh", borderRadius: isMobile ? 0 : 6, overflow: "hidden" }}>
        <IonHeader>
          <IonToolbar style={{ "--background": "var(--ion-card-background)", "--color": "var(--ion-text-color)" }}>
            <IonButtons slot="start">
              <IonButton fill="clear" shape="round" onClick={onClose} disabled={busy}>
                <span slot="icon-only" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", lineHeight: 0, flexShrink: 0, fontSize: "1rem", color: "var(--ion-text-color)" }}>
                  <IonIcon icon={closeOutline} style={{ fontSize: "inherit", color: "inherit", pointerEvents: "none" }} />
                </span>
              </IonButton>
            </IonButtons>
            <IonTitle style={{ fontWeight: 700 }}>Secure Checkout</IonTitle>
          </IonToolbar>
        </IonHeader>

        {stage === "delivering" || stage === "delivered" ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "56px 24px", gap: 12 }}>
            <IonIcon icon={checkmarkCircle} color="success" style={{ fontSize: "3rem" }} />
            <div style={{ fontWeight: 700, fontSize: "1.05rem" }}>Payment successful!</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--ion-color-medium)", fontSize: "0.85rem" }}>
              <IonSpinner name="crescent" style={{ width: 18, height: 18 }} />
              Preparing your download…
            </div>
          </div>
        ) : stage === "deliverFailed" ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 24px", gap: 12, textAlign: "center" }}>
            <IonIcon icon={checkmarkCircle} color="success" style={{ fontSize: "3rem" }} />
            <div style={{ fontWeight: 700, fontSize: "1.05rem" }}>Payment received</div>
            <div style={{ color: "var(--ion-color-medium)", fontSize: "0.85rem", maxWidth: 320 }}>
              Your payment went through, but preparing the download failed. Your purchase is recorded — please contact support and we'll send your document.
            </div>
            <IonButton color="light" onClick={onClose} style={{ marginTop: 8 }}>Close</IonButton>
          </div>
        ) : (
          <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Order summary */}
            <div style={cardStyle}>
              <div style={headingStyle}>Order summary</div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem" }}>
                <span>{docLabel}</span>
                <span>${basePrice.toFixed(2)}</span>
              </div>
              {discount && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem", color: "var(--ion-color-success-shade)" }}>
                  <span>{discount.code} — {discount.discountPercent}% off</span>
                  <span>−${discountValue.toFixed(2)}</span>
                </div>
              )}
              <div style={{ borderTop: "1px solid var(--ion-color-step-150, rgba(0,0,0,0.08))", paddingTop: 10, display: "flex", justifyContent: "space-between", fontWeight: 700 }}>
                <span>Total</span>
                <span>${finalAmount.toFixed(2)}</span>
              </div>
              <div style={{ fontSize: "0.72rem", color: "var(--ion-color-medium)" }}>One-time payment · instant download</div>
            </div>

            {/* Payment details */}
            <div style={cardStyle}>
              <div style={headingStyle}>Payment details</div>
              <IonInput fill="outline" labelPlacement="floating" label="Name on card" value={name}
                autocomplete="cc-name" disabled={busy}
                onIonInput={(e) => setName(e.detail.value || "")} />
              <IonInput fill="outline" labelPlacement="floating" label="Email for your receipt" type="email" value={email}
                autocomplete="email" disabled={busy} helperText="Your document and receipt are sent here"
                onIonInput={(e) => setEmail(e.detail.value || "")} />
              <div>
                <span style={smallLabelStyle}>Card number</span>
                <div style={boxStyle("number")}>
                  <CardNumberElement {...elementProps("number")} />
                </div>
                {cardErrors.number && <IonNote color="danger" style={{ display: "block", marginTop: 4, fontSize: "0.72rem" }}>{cardErrors.number}</IonNote>}
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <span style={smallLabelStyle}>Expiry</span>
                  <div style={boxStyle("expiry")}>
                    <CardExpiryElement {...elementProps("expiry")} />
                  </div>
                  {cardErrors.expiry && <IonNote color="danger" style={{ display: "block", marginTop: 4, fontSize: "0.72rem" }}>{cardErrors.expiry}</IonNote>}
                </div>
                <div style={{ flex: 1 }}>
                  <span style={smallLabelStyle}>CVC</span>
                  <div style={boxStyle("cvc")}>
                    <CardCvcElement {...elementProps("cvc")} />
                  </div>
                  {cardErrors.cvc && <IonNote color="danger" style={{ display: "block", marginTop: 4, fontSize: "0.72rem" }}>{cardErrors.cvc}</IonNote>}
                </div>
              </div>

              {error && <IonNote color="danger" style={{ display: "block", fontSize: "0.8rem" }}>{error}</IonNote>}

              <IonButton expand="block" color="success" style={{ "--border-radius": "8px" }} onClick={handlePay} disabled={busy}>
                {stage === "paying"
                  ? <IonSpinner name="crescent" />
                  : <><IonIcon icon={lockClosedOutline} slot="start" />Pay ${finalAmount.toFixed(2)}</>}
              </IonButton>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: "0.72rem", color: "var(--ion-color-medium)" }}>
                <IonIcon icon={lockClosedOutline} style={{ fontSize: "0.85rem" }} />
                Payments are encrypted and processed securely by Stripe
              </div>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.querySelector("ion-app") || document.body
  );
}

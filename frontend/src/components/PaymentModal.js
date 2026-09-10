import { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon,
  IonSpinner, IonNote,
} from "@ionic/react";
import { closeOutline, lockClosedOutline, checkmarkCircle, cloudDownloadOutline } from "ionicons/icons";
import {
  useStripe, useElements, CardNumberElement, CardExpiryElement, CardCvcElement,
  PaymentRequestButtonElement,
} from "@stripe/react-stripe-js";
import { nativePost } from "@/utils/nativeHttp";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";

// In-app card checkout modal — sits on top of the document form/preview modals
// (z 10010) with the same portal + slide-up chrome. Card details live in
// Stripe Elements iframes (never in our inputs); only the name and email are
// regular Ionic inputs. On success the host modal stores its pending form data
// and hands off to /payment-success, which generates, downloads, emails, and
// shows the animated success screen.
export default function PaymentModal({
  docLabel, documentType, template = null, basePrice, discount = null,
  quantity = 1, onSuccess, onClose,
}) {
  const stripe = useStripe();
  const elements = useElements();
  const isMobile = window.innerWidth < 768;

  const finalAmount = discount ? discount.discountedPrice : basePrice;
  const discountValue = discount ? Math.max(0, basePrice - discount.discountedPrice) : 0;
  // A 100%-off coupon makes the order free: no card form, just the download.
  const isFree = finalAmount <= 0;

  // Exit-intent offer: the discount is server-enforced. We send the BASE price
  // plus a paywallOffer flag and an auth token; the backend re-derives the
  // discount from the user's one-time window so the shown price is the charged
  // price and an expired offer can't be replayed.
  const isOffer = discount?.offer === true;
  const offerAuthHeaders = () => {
    if (!isOffer) return {};
    let token = "";
    try { token = localStorage.getItem("userToken") || ""; } catch {}
    return token ? { Authorization: `Bearer ${token}` } : {};
  };
  const intentBody = (payerEmail) => ({
    amount: isOffer ? basePrice : finalAmount,
    documentType,
    template,
    email: payerEmail || "",
    discountCode: isOffer ? null : (discount?.code || null),
    discountAmount: isOffer ? 0 : (discount ? parseFloat(discountValue.toFixed(2)) : 0),
    paywallOffer: isOffer,
    quantity,
  });

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [focusedBox, setFocusedBox] = useState(null);
  const [cardErrors, setCardErrors] = useState({});
  const [error, setError] = useState("");
  const [stage, setStage] = useState("form"); // form | paying | delivering | delivered | deliverFailed
  const [paymentRequest, setPaymentRequest] = useState(null);

  const busy = stage === "paying" || stage === "delivering";

  // Apple Pay (iOS/Safari) and Google Pay (Android/Chrome) via Stripe's
  // Payment Request button — it renders only when the device has a wallet.
  useEffect(() => {
    if (!stripe || isFree) return;
    const pr = stripe.paymentRequest({
      country: "US",
      currency: "usd",
      total: { label: `MintSlip — ${docLabel}`, amount: Math.round(finalAmount * 100) },
      requestPayerName: true,
      requestPayerEmail: true,
    });
    let cancelled = false;
    pr.canMakePayment().then((result) => { if (!cancelled && result) setPaymentRequest(pr); });
    pr.on("paymentmethod", async (ev) => {
      setError("");
      setStage("paying");
      try {
        const { ok, data } = await nativePost(`${BACKEND_URL}/api/stripe/create-payment-intent`, intentBody(ev.payerEmail), offerAuthHeaders());
        if (!ok || !data?.clientSecret) { ev.complete("fail"); throw new Error(data?.detail || "Could not start the payment. Please try again."); }
        const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
          data.clientSecret, { payment_method: ev.paymentMethod.id }, { handleActions: false }
        );
        if (confirmError) { ev.complete("fail"); throw new Error(confirmError.message || "Payment failed. Please try again."); }
        ev.complete("success");
        let pi = paymentIntent;
        if (pi.status === "requires_action") {
          const followUp = await stripe.confirmCardPayment(data.clientSecret);
          if (followUp.error) throw new Error(followUp.error.message || "Payment authentication failed.");
          pi = followUp.paymentIntent;
        }
        if (pi.status !== "succeeded") throw new Error("Payment did not complete. Please try again.");
        setStage("delivering");
        try {
          await onSuccess({ email: ev.payerEmail || "", name: ev.payerName || "", paymentIntentId: pi.id });
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
    });
    return () => { cancelled = true; };
  }, [stripe]); // eslint-disable-line

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
  // Name/email render exactly like the Stripe element boxes: the container
  // carries the border/focus ring, the bare input matches Stripe's base style.
  const nativeInputStyle = {
    width: "100%", border: "none", outline: "none", background: "transparent",
    padding: 0, margin: 0, color: stripeStyle.base.color,
    fontSize: stripeStyle.base.fontSize, fontFamily: stripeStyle.base.fontFamily,
    lineHeight: "1.2", WebkitTextFillColor: stripeStyle.base.color,
  };
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

  // Free order (100%-off coupon): skip Stripe entirely and deliver the
  // document straight away.
  const handleFreeDownload = async () => {
    setError("");
    let freeEmail = "";
    try { freeEmail = JSON.parse(localStorage.getItem("userInfo") || "null")?.email || ""; } catch {}
    setStage("delivering");
    try {
      await onSuccess({ email: freeEmail, name: "", paymentIntentId: `free_${Date.now().toString(36)}` });
      setStage("delivered");
      onClose();
    } catch (deliverErr) {
      console.error("Free download delivery failed:", deliverErr);
      setStage("deliverFailed");
    }
  };

  const handlePay = async () => {
    setError("");
    if (!stripe || !elements) { setError("Payment form is still loading. Please try again."); return; }
    if (!name.trim()) { setError("Please enter the name on the card."); return; }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError("Please enter a valid email address."); return; }
    const firstCardError = ["number", "expiry", "cvc"].map((k) => cardErrors[k]).find(Boolean);
    if (firstCardError) { setError(firstCardError); return; }

    setStage("paying");
    try {
      const { ok, data } = await nativePost(`${BACKEND_URL}/api/stripe/create-payment-intent`, intentBody(email.trim()), offerAuthHeaders());
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
      <style>{`.msh-pay-input::placeholder { color: ${stripeStyle.base["::placeholder"].color}; }`}</style>
      <div className="modal-slide-up" style={{ background: "var(--ion-background-color, #f2f2f7)", color: "var(--ion-text-color)", display: "flex", flexDirection: "column", width: "100%", maxWidth: isMobile ? "100%" : 600, height: isMobile ? "100%" : "auto", maxHeight: isMobile ? "100%" : "90vh", overflow: "hidden" }}>
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
            <div style={{ fontWeight: 700, fontSize: "1.05rem" }}>{isFree ? "Order confirmed!" : "Payment successful!"}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--ion-color-medium)", fontSize: "0.85rem" }}>
              <IonSpinner name="crescent" style={{ width: 18, height: 18 }} />
              Preparing your download…
            </div>
          </div>
        ) : stage === "deliverFailed" ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 24px", gap: 12, textAlign: "center" }}>
            <IonIcon icon={checkmarkCircle} color="success" style={{ fontSize: "3rem" }} />
            <div style={{ fontWeight: 700, fontSize: "1.05rem" }}>{isFree ? "Order confirmed" : "Payment received"}</div>
            <div style={{ color: "var(--ion-color-medium)", fontSize: "0.85rem", maxWidth: 320 }}>
              {isFree
                ? "Preparing the download failed. Please try again or contact support and we'll send your document."
                : "Your payment went through, but preparing the download failed. Your purchase is recorded — please contact support and we'll send your document."}
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

            {/* Payment details — or a free download when a coupon covers it all */}
            {isFree ? (
            <div style={cardStyle}>
              <div style={headingStyle}>No payment needed</div>
              <div style={{ fontSize: "0.85rem", color: "var(--ion-color-medium)" }}>
                Your coupon covers the full price — download your document for free.
              </div>
              {error && <IonNote color="danger" style={{ display: "block", fontSize: "0.8rem" }}>{error}</IonNote>}
              <IonButton expand="block" color="success" style={{ "--border-radius": "8px" }} onClick={handleFreeDownload} disabled={busy}>
                <IonIcon icon={cloudDownloadOutline} slot="start" />
                Download — Free
              </IonButton>
            </div>
            ) : (
            <div style={cardStyle}>
              <div style={headingStyle}>Payment details</div>
              {paymentRequest && (
                <>
                  <PaymentRequestButtonElement
                    options={{ paymentRequest, style: { paymentRequestButton: { theme: "dark", height: "44px" } } }}
                  />
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ flex: 1, height: 1, background: "var(--ion-color-step-150, rgba(0,0,0,0.12))" }} />
                    <span style={{ fontSize: "0.72rem", color: "var(--ion-color-medium)", whiteSpace: "nowrap" }}>or pay with card</span>
                    <div style={{ flex: 1, height: 1, background: "var(--ion-color-step-150, rgba(0,0,0,0.12))" }} />
                  </div>
                </>
              )}
              <div>
                <span style={smallLabelStyle}>Name on card</span>
                <div style={boxStyle("name")}>
                  <input
                    className="msh-pay-input"
                    type="text" value={name} autoComplete="off"
                    disabled={busy} style={nativeInputStyle}
                    onFocus={() => setFocusedBox("name")}
                    onBlur={() => setFocusedBox((f) => (f === "name" ? null : f))}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <span style={smallLabelStyle}>Email</span>
                <div style={boxStyle("email")}>
                  <input
                    className="msh-pay-input"
                    type="email" value={email} autoComplete="off"
                    disabled={busy} style={nativeInputStyle}
                    onFocus={() => setFocusedBox("email")}
                    onBlur={() => setFocusedBox((f) => (f === "email" ? null : f))}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <span style={{ fontSize: "0.7rem", color: "var(--ion-color-medium)", marginTop: 4, display: "block" }}>
                  Your document and receipt are sent here
                </span>
              </div>
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
            )}
          </div>
        )}
      </div>
    </div>,
    document.querySelector("ion-app") || document.body
  );
}

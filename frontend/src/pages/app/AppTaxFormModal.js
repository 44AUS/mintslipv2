import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon, IonSpinner,
  IonInput, IonSelect, IonSelectOption, IonSegment, IonSegmentButton, IonLabel,
  IonCheckbox, IonGrid, IonRow, IonCol, IonNote, IonToast, IonTextarea,
} from "@ionic/react";
import { closeOutline, checkmarkOutline, cloudDownloadOutline, eyeOutline, addOutline, trashOutline, imageOutline } from "ionicons/icons";
import { isNative, nativePost, getStripeOrigin } from "@/utils/nativeHttp"; // eslint-disable-line no-unused-vars
import { useDisabledGenerators } from "@/utils/generatorAvailability";
import SignaturePad from "@/components/SignaturePad";
import PreviewPager from "@/components/PreviewPager";
import AiTransactionsGenerator from "@/components/AiTransactionsGenerator";
import { IonDateInput, IonMonthInput } from "@/components/DateInput";
import PaymentModal from "@/components/PaymentModal";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";
const cardStyle = { backgroundColor: "var(--ion-card-background)", borderRadius: 8, boxShadow: "rgba(0,0,0,0.18) 0px 4px 24px", padding: 16, display: "flex", flexDirection: "column", gap: 16 };
const sectionHeadingStyle = { fontWeight: 700, fontSize: "0.95rem", color: "var(--ion-text-color)" };
const ionInputStyle = { marginBottom: 8 };
const labelStyle = { fontSize: "0.75rem", color: "var(--ion-color-medium)", marginBottom: 4, display: "block" };

const readFileAsDataUrl = (file) => new Promise((resolve, reject) => {
  const r = new FileReader();
  r.onloadend = () => resolve(r.result);
  r.onerror = () => reject(new Error("Failed to read file"));
  r.readAsDataURL(file);
});

// Native document-form modal (tax, legal, and business forms) — same chrome
// and flow as the paystub form modal: Ionic inputs/selects/segments in card
// sections, and the toolbar checkmark opens the preview modal with coupon,
// price, and Pay & Download. Driven entirely by a form config.
export default function AppTaxFormModal({ config, onClose }) {

  const [formData, setFormData] = useState(() => {
    try {
      const s = localStorage.getItem(config.storageKey);
      if (s) return JSON.parse(s);
    } catch {}
    // Start from the config's defaults (same ones the web form seeds)
    try { return config.derive ? config.derive({}) : {}; } catch { return {}; }
  });
  const [taxYear, setTaxYear] = useState(() => {
    try { return localStorage.getItem(`${config.storageKey}Year`) || config.defaultYear || ""; }
    catch { return config.defaultYear || ""; }
  });
  const [sigModes, setSigModes] = useState({}); // per-signature-field draw|type|upload
  const fileInputRefs = useRef({});

  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewImg, setPreviewImg] = useState(null);
  const [previewPageIndex, setPreviewPageIndex] = useState(0);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [pendingCheckout, setPendingCheckout] = useState(null); // {derived, checkoutTemplate} while the payment modal is open
  const [couponCode, setCouponCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [couponError, setCouponError] = useState("");
  const [toastState, setToastState] = useState({ isOpen: false, message: "", color: "danger" });
  const showToast = (message, color = "danger") => setToastState({ isOpen: true, message, color });

  // Published admin layouts for this document type (e.g. custom accounting
  // mockups) — appended to any select field marked appendCustomTemplates.
  const disabledGenerators = useDisabledGenerators();
  const [customTplOptions, setCustomTplOptions] = useState([]);
  useEffect(() => {
    if (!config.customTemplatesFor) return;
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/doc-templates?documentType=${config.customTemplatesFor}`);
        const d = await res.json();
        if (alive && d.success) {
          setCustomTplOptions((d.templates || []).map(t => ({ value: `custom:${t.id}`, label: t.name })));
        }
      } catch {}
    })();
    return () => { alive = false; };
  }, []); // eslint-disable-line
  const visibleCustomTplOptions = customTplOptions.filter(o => !disabledGenerators.has(o.value));

  const setField = (name, value) => setFormData(prev => ({ ...prev, [name]: value }));

  const basePrice = typeof config.price === "function" ? config.price(formData) : config.price;

  // Preview generators may return one image or an array of page images —
  // normalize so multi-page documents get the page slider.
  const previewPages = Array.isArray(previewImg) ? previewImg : previewImg ? [previewImg] : [];
  const pageIdx = Math.min(previewPageIndex, Math.max(0, previewPages.length - 1));

  useEffect(() => {
    try {
      localStorage.setItem(config.storageKey, JSON.stringify(formData));
      localStorage.setItem(`${config.storageKey}Year`, taxYear);
    } catch {}
  }, [formData, taxYear]); // eslint-disable-line

  // ── Subscription check (same as the paystub modal) ──
  useEffect(() => {
    (async () => {
      const token = localStorage.getItem("userToken");
      const userInfo = localStorage.getItem("userInfo");
      if (!token || !userInfo) return;
      try {
        const ud = JSON.parse(userInfo);
        setUser(ud);
        if (ud.subscription?.status === "active" &&
            (ud.subscription.downloads_remaining > 0 || ud.subscription.downloads_remaining === -1)) {
          setHasActiveSubscription(true);
        }
        const res = await fetch(`${BACKEND_URL}/api/user/me`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const d = await res.json();
          if (d.success && d.user) {
            setUser(d.user);
            localStorage.setItem("userInfo", JSON.stringify(d.user));
            setHasActiveSubscription(
              d.user.subscription?.status === "active" &&
              (d.user.subscription.downloads_remaining > 0 || d.user.subscription.downloads_remaining === -1)
            );
          }
        }
      } catch {}
    })();
  }, []); // eslint-disable-line

  // ── Debounced live preview ──
  useEffect(() => {
    const t = setTimeout(async () => {
      setIsGeneratingPreview(true);
      try {
        const img = await config.preview(config.derive(formData), taxYear);
        setPreviewImg(img || null);
      } catch (err) {
        console.error("Tax form preview failed:", err);
      }
      setIsGeneratingPreview(false);
    }, 700);
    return () => clearTimeout(t);
  }, [formData, taxYear]); // eslint-disable-line

  // ── Coupon ──
  // Auto-apply: as the user types or pastes a code we look it up (debounced)
  // and apply it with a toast — no Apply button.
  useEffect(() => {
    const code = couponCode.trim();
    if (!code || appliedDiscount) { setIsValidatingCoupon(false); return; }
    let cancelled = false;
    const t = setTimeout(async () => {
      setIsValidatingCoupon(true);
      try {
        const { ok, data } = await nativePost(`${BACKEND_URL}/api/validate-coupon`, { code, generatorType: config.docType });
        if (cancelled) return;
        if (ok && data?.valid) {
          const discountAmount = basePrice * data.discountPercent / 100;
          setAppliedDiscount({ code: data.code, discountPercent: data.discountPercent, discountedPrice: parseFloat((basePrice - discountAmount).toFixed(2)) });
          setCouponError("");
          showToast(`Coupon ${data.code} applied: ${data.discountPercent}% off!`, "success");
        } else {
          setCouponError(data?.detail || "Invalid coupon code");
          setAppliedDiscount(null);
        }
      } catch { if (!cancelled) { setCouponError("Connection error. Please try again."); setAppliedDiscount(null); } }
      finally { if (!cancelled) setIsValidatingCoupon(false); }
    }, 600);
    return () => { cancelled = true; clearTimeout(t); };
  }, [couponCode]); // eslint-disable-line
  const removeCoupon = () => { setCouponCode(""); setAppliedDiscount(null); setCouponError(""); };

  // ── Clear form (same behaviour as the paystub modals) ──
  const clearForm = () => {
    let fresh = {};
    try { fresh = config.derive ? config.derive({}) : {}; } catch {}
    setFormData(fresh);
    setSigModes({});
    setTaxYear(config.defaultYear || "");
    try {
      localStorage.removeItem(config.storageKey);
      localStorage.removeItem(`${config.storageKey}Year`);
    } catch {}
    showToast("Form cleared successfully", "success");
  };

  // ── Checkmark → preview modal ──
  const handleNext = () => {
    const err = config.validate(formData);
    if (err) { showToast(err); return; }
    setPreviewModalOpen(true);
  };

  // ── Pay / download ──
  const handleGenerate = async () => {
    const err = config.validate(formData);
    if (err) { showToast(err); return; }
    const derived = config.derive(formData);

    const checkoutTemplate = config.checkoutTemplate ? config.checkoutTemplate(derived, taxYear) : taxYear;

    if (hasActiveSubscription) {
      const token = localStorage.getItem("userToken");
      setIsProcessing(true);
      try {
        const res = await fetch(`${BACKEND_URL}/api/user/subscription-download`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ documentType: config.docType, template: checkoutTemplate }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || "Failed to process subscription download");

        const pdfBlob = await config.download(derived, taxYear, true);
        if (user && pdfBlob instanceof Blob) {
          try {
            const reader = new FileReader();
            reader.onloadend = async () => {
              await fetch(`${BACKEND_URL}/api/user/saved-documents`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                  documentType: config.docType,
                  fileName: `${config.key.replace(/-/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`,
                  fileData: reader.result.split(",")[1],
                  template: checkoutTemplate,
                }),
              });
            };
            reader.readAsDataURL(pdfBlob);
          } catch (e) { console.error("Failed to save document:", e); }
        }
        if (data.downloadsRemaining !== undefined) {
          const u = { ...user, subscription: { ...user?.subscription, downloads_remaining: data.downloadsRemaining } };
          setUser(u);
          localStorage.setItem("userInfo", JSON.stringify(u));
          if (data.downloadsRemaining === 0) setHasActiveSubscription(false);
        }
        showToast("Document downloaded successfully!", "success");
        setPreviewModalOpen(false);
      } catch (e2) {
        showToast(e2.message || "Download failed. Please try again.");
      } finally { setIsProcessing(false); }
      return;
    }

    // One-time purchase: open the in-app card checkout on top of the preview
    setPendingCheckout({ derived, checkoutTemplate });
  };

  // Runs after the card payment succeeds — store the pending form data (same
  // keys the hosted-checkout flow used) and hand off to /payment-success,
  // which generates + downloads + emails and shows the success screen. The
  // webhook records the purchase from the payment-intent metadata.
  const handlePaymentSuccess = ({ email, paymentIntentId }) => {
    const { derived } = pendingCheckout;
    const pendingEntries = config.buildPending
      ? config.buildPending(derived, taxYear)
      : { [config.pendingDataKey]: derived, ...(config.pendingYearKey ? { [config.pendingYearKey]: taxYear } : {}) };
    Object.entries(pendingEntries).forEach(([k, v]) =>
      localStorage.setItem(k, typeof v === "string" ? v : JSON.stringify(v)));
    localStorage.setItem("pendingCustomerEmail", email);
    navigate(`/payment-success?type=${config.docType}&source=app&payment_intent=${encodeURIComponent(paymentIntentId)}`);
  };

  // ── Field renderer ──
  const renderField = (field) => {
    if (field.showIf && !field.showIf(formData)) return null;
    const value = formData[field.name];
    const col = (children) => (
      <IonCol key={field.name} size="12" sizeMd={field.size || "6"}>{children}</IonCol>
    );
    switch (field.type) {
      case "select":
        return col(
          <IonSelect fill="outline" labelPlacement="floating" label={field.label} value={value ?? ""}
            onIonChange={e => setField(field.name, e.detail.value)} style={ionInputStyle}>
            {(field.appendCustomTemplates ? [...field.options, ...visibleCustomTplOptions] : field.options)
              .map(o => <IonSelectOption key={o.value} value={o.value}>{o.label}</IonSelectOption>)}
          </IonSelect>
        );
      case "segment":
        return col(
          <div style={{ marginBottom: 8 }}>
            <span style={{ fontSize: "0.75rem", color: "var(--ion-color-medium)", display: "block", marginBottom: 4 }}>{field.label}</span>
            <IonSegment mode="ios" style={{ width: "100%" }} value={value ?? field.options[0].value} onIonChange={e => setField(field.name, e.detail.value)}>
              {field.options.map(o => (
                <IonSegmentButton key={o.value} value={o.value}><IonLabel>{o.label}</IonLabel></IonSegmentButton>
              ))}
            </IonSegment>
          </div>
        );
      case "checkbox":
        return col(
          <IonCheckbox checked={!!value} onIonChange={e => setField(field.name, e.detail.checked)}
            labelPlacement="end" justify="start" style={{ marginBottom: 8 }}>
            <span style={{ fontSize: "0.85rem", whiteSpace: "normal" }}>{field.label}</span>
          </IonCheckbox>
        );
      case "textarea":
        return col(
          <IonTextarea fill="outline" labelPlacement="floating" label={field.label}
            autoGrow rows={field.rows || 3} placeholder={field.placeholder}
            value={value ?? ""} onIonInput={e => setField(field.name, e.detail.value)} style={ionInputStyle} />
        );
      case "color":
        return col(
          <div style={{ marginBottom: 8 }}>
            <span style={labelStyle}>{field.label}</span>
            <input type="color" value={value || field.default || "#1a1a1a"}
              onChange={e => setField(field.name, e.target.value)}
              style={{ width: "100%", height: 40, borderRadius: 6, border: "1px solid var(--ion-color-step-200)", cursor: "pointer", display: "block" }} />
          </div>
        );
      case "image":
        return col(
          <div style={{ marginBottom: 8 }}>
            <span style={labelStyle}>{field.label}</span>
            {value ? (
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 8, border: "1px solid var(--ion-color-step-200)", background: "var(--ion-color-step-50)" }}>
                <img src={value} alt="" style={{ height: 36, width: "auto", maxWidth: 100, objectFit: "contain" }} />
                <span style={{ flex: 1, fontSize: "0.78rem", color: "var(--ion-color-medium)" }}>Uploaded</span>
                <IonButton fill="clear" size="small" onClick={() => setField(field.name, null)}>
                  <IonIcon icon={closeOutline} slot="icon-only" />
                </IonButton>
              </div>
            ) : (
              <div onClick={() => fileInputRefs.current[field.name]?.click()}
                style={{ padding: 14, borderRadius: 8, border: "2px dashed var(--ion-color-step-200)", textAlign: "center", cursor: "pointer", color: "var(--ion-color-medium)", fontSize: "0.82rem" }}>
                <IonIcon icon={imageOutline} style={{ fontSize: 22, display: "block", margin: "0 auto 4px" }} />
                Tap to upload image
              </div>
            )}
            <input ref={el => { fileInputRefs.current[field.name] = el; }} type="file" accept="image/*" style={{ display: "none" }}
              onChange={async e => { const f = e.target.files?.[0]; e.target.value = ""; if (f) setField(field.name, await readFileAsDataUrl(f)); }} />
          </div>
        );
      case "signature": {
        const mode = sigModes[field.name] || "draw";
        const modes = field.nameField ? ["draw", "type", "upload"] : ["draw", "upload"];
        return col(
          <div style={{ marginBottom: 8 }}>
            <span style={labelStyle}>{field.label}</span>
            <IonSegment mode="ios" value={mode} style={{ marginBottom: 8, width: "100%" }}
              onIonChange={e => { const m = e.detail.value; setSigModes(prev => ({ ...prev, [field.name]: m })); setField(field.name, null); }}>
              {modes.map(m => (
                <IonSegmentButton key={m} value={m}>
                  <IonLabel>{m === "draw" ? "Draw" : m === "type" ? "Type" : "Upload"}</IonLabel>
                </IonSegmentButton>
              ))}
            </IonSegment>
            {mode === "draw" && <SignaturePad height={150} onChange={dataUrl => setField(field.name, dataUrl)} />}
            {mode === "type" && field.nameField && (
              <>
                <IonInput fill="outline" labelPlacement="floating" label="Typed signature name"
                  value={formData[field.nameField] ?? ""} onIonInput={e => setField(field.nameField, e.detail.value)} style={ionInputStyle} />
                {formData[field.nameField] && (
                  <div style={{ border: "1px solid var(--ion-color-step-200)", borderRadius: 8, background: "var(--ion-color-step-50)", padding: "10px 14px" }}>
                    <span style={{ fontSize: "1.4rem", fontStyle: "italic", fontFamily: "Georgia, 'Times New Roman', serif", color: "var(--ion-text-color)" }}>
                      {formData[field.nameField]}
                    </span>
                  </div>
                )}
              </>
            )}
            {mode === "upload" && (
              value ? (
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 8, border: "1px solid var(--ion-color-step-200)", background: "var(--ion-color-step-50)" }}>
                  <img src={value} alt="signature" style={{ height: 32, width: "auto", maxWidth: 120, objectFit: "contain" }} />
                  <span style={{ flex: 1, fontSize: "0.78rem", color: "var(--ion-color-medium)" }}>Uploaded</span>
                  <IonButton fill="clear" size="small" onClick={() => setField(field.name, null)}>
                    <IonIcon icon={closeOutline} slot="icon-only" />
                  </IonButton>
                </div>
              ) : (
                <>
                  <div onClick={() => fileInputRefs.current[field.name]?.click()}
                    style={{ padding: 14, borderRadius: 8, border: "2px dashed var(--ion-color-step-200)", textAlign: "center", cursor: "pointer", color: "var(--ion-color-medium)", fontSize: "0.82rem" }}>
                    Tap to upload signature image
                  </div>
                  <input ref={el => { fileInputRefs.current[field.name] = el; }} type="file" accept="image/*" style={{ display: "none" }}
                    onChange={async e => { const f = e.target.files?.[0]; e.target.value = ""; if (f) setField(field.name, await readFileAsDataUrl(f)); }} />
                </>
              )
            )}
          </div>
        );
      }
      case "checkboxGroup": {
        const map = value || {};
        return col(
          <div style={{ marginBottom: 8, display: "flex", flexDirection: "column", gap: 6 }}>
            {field.label && <span style={labelStyle}>{field.label}</span>}
            {field.options.map(o => (
              <IonCheckbox key={o.id} checked={!!map[o.id]} labelPlacement="end" justify="start"
                onIonChange={e => setField(field.name, { ...map, [o.id]: e.detail.checked })}>
                <span style={{ fontSize: "0.85rem", whiteSpace: "normal" }}>{o.label}</span>
              </IonCheckbox>
            ))}
          </div>
        );
      }
      case "rowList": {
        const rows = Array.isArray(value) ? value : [];
        const updateRow = (idx, colName, v) => {
          const next = rows.map((r, i) => (i === idx ? { ...r, [colName]: v } : r));
          setField(field.name, next);
        };
        return (
          <IonCol key={field.name} size="12">
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 8 }}>
              {field.label && <span style={labelStyle}>{field.label}</span>}
              {rows.map((row, idx) => (
                <div key={idx} style={{ background: "var(--ion-color-step-100)", borderRadius: 8, padding: 10 }}>
                  <IonGrid style={{ padding: 0 }}>
                    <IonRow>
                      {field.columns.map(c => (
                        <IonCol key={c.name} size={c.sizeSm || "6"} sizeMd={c.size || "3"}>
                          {c.type === "select" ? (
                            <IonSelect fill="outline" labelPlacement="floating" label={c.label} value={row[c.name] ?? ""}
                              onIonChange={e => updateRow(idx, c.name, e.detail.value)} style={ionInputStyle}>
                              {c.options.map(o => <IonSelectOption key={o.value} value={o.value}>{o.label}</IonSelectOption>)}
                            </IonSelect>
                          ) : c.type === "date" ? (
                            <IonDateInput label={c.label} value={row[c.name] ?? ""}
                              onChange={v => updateRow(idx, c.name, v)} style={ionInputStyle} />
                          ) : (
                            <IonInput fill="outline" labelPlacement="floating" label={c.label} type={c.type || "text"}
                              value={row[c.name] ?? ""} onIonInput={e => updateRow(idx, c.name, e.detail.value)} style={ionInputStyle} />
                          )}
                        </IonCol>
                      ))}
                      <IonCol size="12">
                        <IonButton expand="block" color="danger" size="small" style={{ width: "100%" }}
                          onClick={() => setField(field.name, rows.filter((_, i) => i !== idx))}>
                          <IonIcon icon={trashOutline} slot="start" />
                          Remove
                        </IonButton>
                      </IonCol>
                    </IonRow>
                  </IonGrid>
                </div>
              ))}
              <IonButton color="primary" size="small" style={{ alignSelf: "center" }}
                onClick={() => setField(field.name, [...rows, field.newRow ? field.newRow() : {}])}>
                <IonIcon slot="start" icon={addOutline} />
                {field.addLabel || "Add Row"}
              </IonButton>
            </div>
          </IonCol>
        );
      }
      case "date":
        return col(
          <IonDateInput label={field.label} value={value ?? ""}
            onChange={v => setField(field.name, v)} style={ionInputStyle} />
        );
      case "month":
        return col(
          <IonMonthInput label={field.label} value={value ?? ""}
            onChange={v => setField(field.name, v)} style={ionInputStyle} />
        );
      case "aiTransactions":
        return col(
          <div style={{ marginBottom: 8 }}>
            <AiTransactionsGenerator formData={formData} setField={setField} showToast={showToast} />
          </div>
        );
      default:
        return col(
          <IonInput fill="outline" labelPlacement="floating" label={field.label}
            type={field.type || "text"} placeholder={field.placeholder}
            value={value ?? ""} onIonInput={e => setField(field.name, e.detail.value)} style={ionInputStyle} />
        );
    }
  };

  // Tracked as state so rotation/resizes keep the modal full-screen on mobile
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);
  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return createPortal(
    <>
      {/* ── Form Modal ── */}
      <div className="modal-backdrop" style={{ position: "fixed", inset: 0, zIndex: 10000, background: isDesktop ? "rgba(0,0,0,0.5)" : "var(--ion-background-color, #f2f2f7)", display: "flex", alignItems: isDesktop ? "center" : "stretch", justifyContent: isDesktop ? "center" : "stretch" }}>
        <div className="modal-slide-up" style={{ background: "var(--ion-background-color, #f2f2f7)", color: "var(--ion-text-color)", display: "flex", flexDirection: "column", width: "100%", maxWidth: isDesktop ? 600 : "100%", height: isDesktop ? "auto" : "100%", maxHeight: isDesktop ? "90vh" : "100%", overflow: "hidden" }}>
          <IonHeader>
            <IonToolbar style={{ "--background": "var(--ion-card-background)", "--color": "var(--ion-text-color)" }}>
              <IonButtons slot="start">
                <IonButton fill="clear" shape="round" onClick={onClose}>
                  <span slot="icon-only" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", lineHeight: 0, flexShrink: 0, fontSize: "1rem", color: "var(--ion-text-color)" }}>
                    <IonIcon icon={closeOutline} style={{ fontSize: "inherit", color: "inherit", pointerEvents: "none" }} />
                  </span>
                </IonButton>
              </IonButtons>
              <IonTitle style={{ fontWeight: 700 }}>{config.title}</IonTitle>
              <IonButtons slot="end">
                <IonButton fill="clear" shape="round" onClick={handleNext} style={{ opacity: isGeneratingPreview ? 0.6 : 1 }}>
                  <span slot="icon-only" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", lineHeight: 0, flexShrink: 0, fontSize: "1rem", color: "var(--ion-color-success)" }}>
                    {isGeneratingPreview
                      ? <IonSpinner name="crescent" style={{ width: 18, height: 18, color: "var(--ion-color-medium)" }} />
                      : <IonIcon icon={checkmarkOutline} style={{ fontSize: "inherit", color: "inherit", pointerEvents: "none" }} />}
                  </span>
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <div style={{ flex: 1, overflowY: "auto", scrollbarGutter: "stable", padding: "16px 16px 40px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              {/* Tax year (tax forms only) */}
              {config.taxYears && (
                <div style={cardStyle}>
                  <span style={sectionHeadingStyle}>Tax Year</span>
                  <IonSelect fill="outline" labelPlacement="floating" label="Tax Year" value={taxYear}
                    onIonChange={e => setTaxYear(e.detail.value)} style={ionInputStyle}>
                    {config.taxYears.map(y => <IonSelectOption key={y} value={y}>{y}</IonSelectOption>)}
                  </IonSelect>
                </div>
              )}

              {config.sections.map(section => (
                <div key={section.title} style={cardStyle}>
                  <span style={sectionHeadingStyle}>{section.title}</span>
                  {section.note && <IonNote style={{ fontSize: "0.75rem" }}>{section.note}</IonNote>}
                  <IonGrid>
                    <IonRow>
                      {section.fields.map(renderField)}
                    </IonRow>
                  </IonGrid>
                </div>
              ))}

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <IonButton expand="block" color="light" onClick={handleNext}>
                  <IonIcon icon={eyeOutline} slot="start" />
                  Preview
                </IonButton>
                <IonButton expand="block" color="danger" onClick={clearForm}>
                  <IonIcon icon={trashOutline} slot="start" />
                  Clear Form
                </IonButton>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* ── Preview Modal (same as the paystub preview modal) ── */}
      {previewModalOpen && (
        <div className="modal-backdrop" style={{ position: "fixed", inset: 0, zIndex: 10001, background: isDesktop ? "rgba(0,0,0,0.5)" : "var(--ion-background-color, #f2f2f7)", display: "flex", alignItems: isDesktop ? "center" : "stretch", justifyContent: isDesktop ? "center" : "stretch" }}>
          <div className="modal-slide-up" style={{ background: "var(--ion-background-color, #f2f2f7)", color: "var(--ion-text-color)", display: "flex", flexDirection: "column", width: "100%", maxWidth: isDesktop ? 600 : "100%", height: isDesktop ? "auto" : "100%", maxHeight: isDesktop ? "90vh" : "100%", overflow: "hidden" }}>
            <IonHeader>
              <IonToolbar style={{ "--background": "var(--ion-card-background)", "--color": "var(--ion-text-color)" }}>
                <IonButtons slot="start">
                  <IonButton fill="clear" shape="round" onClick={() => setPreviewModalOpen(false)}>
                    <span slot="icon-only" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", lineHeight: 0, flexShrink: 0, fontSize: "1rem", color: "var(--ion-text-color)" }}>
                      <IonIcon icon={closeOutline} style={{ fontSize: "inherit", color: "inherit", pointerEvents: "none" }} />
                    </span>
                  </IonButton>
                </IonButtons>
                <IonTitle style={{ fontWeight: 700 }}>Preview</IonTitle>
              </IonToolbar>
            </IonHeader>
            <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
              {isGeneratingPreview ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 320, background: "var(--ion-color-step-100)", borderRadius: 8 }}>
                  <IonSpinner name="crescent" style={{ marginBottom: 8 }} />
                  <span style={{ fontSize: "0.8rem", color: "var(--ion-color-medium)" }}>Generating preview…</span>
                </div>
              ) : previewPages.length > 0 ? (
                <>
                  <PreviewPager pages={previewPages} index={pageIdx} onIndexChange={setPreviewPageIndex} altPrefix={`${config.title} preview`} />
                  <p style={{ textAlign: "center", fontSize: "0.75rem", color: "var(--ion-color-medium)", marginTop: 8 }}>Watermark removed after payment</p>
                </>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 320, background: "var(--ion-color-step-100)", borderRadius: 8, border: "2px dashed var(--ion-color-light-shade)" }}>
                  <IonIcon icon={eyeOutline} style={{ fontSize: "2.5rem", color: "var(--ion-color-medium)", marginBottom: 8 }} />
                  <p style={{ fontSize: "0.8rem", color: "var(--ion-color-medium)", textAlign: "center", margin: 0 }}>No preview available yet</p>
                </div>
              )}

              {!hasActiveSubscription && (
                <div style={{ marginTop: 20 }}>
                  {!appliedDiscount ? (
                    <>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <IonInput
                          fill="outline" labelPlacement="floating" label="Coupon code"
                          value={couponCode}
                          onIonInput={e => { setCouponCode((e.detail.value || "").toUpperCase()); setCouponError(""); }}
                          style={{ flex: 1, fontFamily: "monospace" }}
                        />
                        {isValidatingCoupon && <IonSpinner name="crescent" style={{ flexShrink: 0 }} />}
                      </div>
                      {couponError && <IonNote color="danger" style={{ display: "block", marginTop: 4, fontSize: "0.75rem" }}>{couponError}</IonNote>}
                    </>
                  ) : (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 10px", background: "var(--ion-color-success)", borderRadius: 6 }}>
                      <span style={{ color: "var(--ion-color-success-contrast)", fontWeight: 600, fontSize: "0.85rem" }}>
                        {appliedDiscount.code} — {appliedDiscount.discountPercent}% off
                      </span>
                      <IonButton fill="clear" size="small" onClick={removeCoupon} style={{ "--color": "var(--ion-color-success-contrast)" }}>
                        <IonIcon slot="icon-only" icon={closeOutline} />
                      </IonButton>
                    </div>
                  )}
                </div>
              )}

              {!hasActiveSubscription && (
                <div style={{ marginTop: 12, paddingTop: 12, textAlign: "center" }}>
                  {appliedDiscount ? (
                    <>
                      <p style={{ textDecoration: "line-through", color: "var(--ion-color-medium)", fontSize: "0.9rem", margin: "0 0 4px" }}>${basePrice.toFixed(2)}</p>
                      <p style={{ fontWeight: 700, fontSize: "1.3rem", color: "var(--ion-color-success-shade)", margin: "0 0 4px" }}>${appliedDiscount.discountedPrice.toFixed(2)}</p>
                      <p style={{ fontSize: "0.75rem", color: "var(--ion-color-success)", margin: 0 }}>{appliedDiscount.discountPercent}% discount applied</p>
                    </>
                  ) : (
                    <>
                      <p style={{ fontWeight: 700, fontSize: "1.2rem", color: "var(--ion-color-success-shade)", margin: "0 0 4px" }}>${basePrice.toFixed(2)}</p>
                      <p style={{ fontSize: "0.75rem", color: "var(--ion-color-medium)", margin: 0 }}>One-time payment · instant download</p>
                    </>
                  )}
                </div>
              )}

              {hasActiveSubscription && (
                <div style={{ marginTop: 12, padding: 8, background: "rgba(var(--ion-color-success-rgb),0.15)", borderRadius: 8, textAlign: "center" }}>
                  <p style={{ color: "var(--ion-color-success-shade)", fontWeight: 600, fontSize: "0.875rem", margin: "0 0 4px" }}>Subscription Active — Free Download</p>
                  {user?.subscription?.downloads_remaining !== -1 && (
                    <p style={{ fontSize: "0.75rem", color: "var(--ion-color-medium)", margin: 0 }}>{user?.subscription?.downloads_remaining} downloads remaining</p>
                  )}
                </div>
              )}

              <IonButton
                expand="block"
                color="success"
                style={{ marginTop: 20, "--border-radius": "8px" }}
                disabled={isProcessing}
                onClick={handleGenerate}
              >
                {isProcessing ? (
                  <IonSpinner name="crescent" style={{ marginRight: 8 }} />
                ) : (
                  <IonIcon slot="start" icon={cloudDownloadOutline} />
                )}
                {isProcessing
                  ? "Processing..."
                  : hasActiveSubscription
                    ? "Download Document"
                    : `Pay & Download — $${appliedDiscount ? appliedDiscount.discountedPrice.toFixed(2) : basePrice.toFixed(2)}`}
              </IonButton>
            </div>
          </div>
        </div>
      )}

      {pendingCheckout && (
        <PaymentModal
          docLabel={config.title}
          documentType={config.docType}
          template={pendingCheckout.checkoutTemplate}
          basePrice={basePrice}
          discount={appliedDiscount}
          onSuccess={handlePaymentSuccess}
          onClose={() => setPendingCheckout(null)}
        />
      )}

      <IonToast
        isOpen={toastState.isOpen}
        message={toastState.message}
        color={toastState.color}
        duration={3000}
        onDidDismiss={() => setToastState(s => ({ ...s, isOpen: false }))}
        position="top"
      />
    </>,
    document.querySelector("ion-app") || document.body
  );
}

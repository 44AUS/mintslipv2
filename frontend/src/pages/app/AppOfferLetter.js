import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  IonHeader, IonToolbar, IonTitle, IonButtons,
  IonInput, IonSelect, IonSelectOption,
  IonButton, IonIcon, IonSpinner, IonTextarea, IonToast,
  IonSegment, IonSegmentButton, IonLabel, IonNote,
} from "@ionic/react";
import {
  cloudDownloadOutline, eyeOutline, closeOutline, imageOutline, checkmarkOutline,
} from "ionicons/icons";
import { IonDateInput } from "@/components/DateInput";
import SignaturePad from "@/components/SignaturePad";
import PreviewPager from "@/components/PreviewPager";
import { generateAndDownloadOfferLetter } from "@/utils/offerLetterGenerator";
import { generateOfferLetterPreviewPages } from "@/utils/offerLetterPreviewGenerator";
import { isNative, nativePost, getStripeOrigin } from "@/utils/nativeHttp"; // eslint-disable-line no-unused-vars
import PaymentModal from "@/components/PaymentModal";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";
const STORAGE_KEY = "offerLetterFormData";

const cardStyle = {
  backgroundColor: "var(--ion-card-background)",
  borderRadius: 8,
  boxShadow: "rgba(0,0,0,0.14) 0px 2px 12px",
  padding: 16,
  display: "flex",
  flexDirection: "column",
  gap: 14,
};
const headingStyle = { fontWeight: 700, fontSize: "0.95rem", color: "var(--ion-text-color)" };
const labelStyle = { fontSize: "0.75rem", color: "var(--ion-color-medium)", marginBottom: 4, display: "block" };

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","DC","FL","GA","HI","ID","IL","IN",
  "IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH",
  "NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT",
  "VT","VA","WA","WV","WI","WY",
];

const TEMPLATES = [
  { value: "professional", label: "Professional", desc: "Traditional business" },
  { value: "modern",       label: "Modern",       desc: "Clean & contemporary" },
  { value: "custom",       label: "Custom",       desc: "Pick your colors" },
];

const EMPLOYMENT_TYPES = [
  { value: "full-time",  label: "Full-Time" },
  { value: "part-time",  label: "Part-Time" },
  { value: "contract",   label: "Contract" },
  { value: "temporary",  label: "Temporary" },
  { value: "internship", label: "Internship" },
];

const WORK_LOCATIONS = [
  { value: "on-site", label: "On-Site" },
  { value: "remote",  label: "Remote" },
  { value: "hybrid",  label: "Hybrid" },
];

const COMPENSATION_TYPES = [
  { value: "annual",  label: "Annual Salary" },
  { value: "hourly",  label: "Hourly Rate" },
  { value: "monthly", label: "Monthly Salary" },
];

const PAY_FREQUENCIES = [
  { value: "weekly",       label: "Weekly" },
  { value: "bi-weekly",    label: "Bi-Weekly" },
  { value: "semi-monthly", label: "Semi-Monthly" },
  { value: "monthly",      label: "Monthly" },
];

const defaultFormData = {
  template: "professional",
  companyName: "", companyLogo: null, companyLogoName: "",
  companyAddress: "", companyCity: "", companyState: "", companyZip: "",
  companyPhone: "", companyEmail: "", companyWebsite: "",
  candidateName: "", candidateAddress: "", candidateCity: "",
  candidateState: "", candidateZip: "",
  jobTitle: "", department: "", employmentType: "full-time",
  workLocation: "on-site", workAddress: "", startDate: "",
  reportingManager: "", reportingTitle: "",
  compensationType: "annual", compensationAmount: "", payFrequency: "bi-weekly",
  benefits: "• Health Insurance (Medical, Dental, Vision)\n• 401(k) Retirement Plan with company match\n• Paid Time Off (PTO)\n• Paid Holidays\n• Life Insurance\n• Professional Development",
  additionalTerms: "", responseDeadline: "",
  signerName: "", signerTitle: "",
  hrSignatureType: "generated", hrSignatureImage: null,
  letterDate: new Date().toISOString().split("T")[0],
  employeeSignatureType: "generated", employeeSignatureImage: null,
  employeeSignatureName: "", employeeSignDate: "",
  primaryColor: "#1a4731", accentColor: "#059669",
};

export default function AppOfferLetter({ isOpen, onClose }) {
  const logoRef   = useRef(null);
  const hrSigRef  = useRef(null);
  const empSigRef = useRef(null);

  const [formData, setFormData] = useState(() => {
    try {
      const s = localStorage.getItem(STORAGE_KEY);
      return s ? { ...defaultFormData, ...JSON.parse(s) } : defaultFormData;
    } catch { return defaultFormData; }
  });

  const navigate = useNavigate();
  const [user, setUser]                                   = useState(null);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [isProcessing, setIsProcessing]                   = useState(false);
  const [previewPages, setPreviewPages]                   = useState([]);
  const [previewPageIndex, setPreviewPageIndex]           = useState(0);
  const [previewModalOpen, setPreviewModalOpen]           = useState(false);
  const [isGeneratingPreview, setIsGeneratingPreview]     = useState(false);
  const [toastOpen, setToastOpen]                         = useState(false);
  const [toastMessage, setToastMessage]                   = useState("");
  const [toastColor, setToastColor]                       = useState("success");
  const [paymentOpen, setPaymentOpen]                     = useState(false);
  const [couponCode, setCouponCode]                       = useState("");
  const [isValidatingCoupon, setIsValidatingCoupon]       = useState(false);
  const [couponError, setCouponError]                     = useState("");
  const [appliedDiscount, setAppliedDiscount]             = useState(null);

  const showToast = (msg, color = "success") => {
    setToastMessage(msg); setToastColor(color); setToastOpen(true);
  };

  // ── Coupon ──
  // Auto-apply: as the user types or pastes a code we look it up (debounced)
  // and apply it with a toast — no Apply button.
  const OFFER_PRICE = 9.99;
  useEffect(() => {
    const code = couponCode.trim();
    if (!code || appliedDiscount) { setIsValidatingCoupon(false); return; }
    let cancelled = false;
    const t = setTimeout(async () => {
      setIsValidatingCoupon(true);
      try {
        const { ok, data } = await nativePost(`${BACKEND_URL}/api/validate-coupon`, { code, generatorType: "offer-letter" });
        if (cancelled) return;
        if (ok && data?.valid) {
          const discountAmount = OFFER_PRICE * data.discountPercent / 100;
          setAppliedDiscount({ code: data.code, discountPercent: data.discountPercent, discountedPrice: parseFloat((OFFER_PRICE - discountAmount).toFixed(2)) });
          setCouponError("");
          showToast(`Coupon ${data.code} applied: ${data.discountPercent}% off!`);
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
  const finalPrice = appliedDiscount ? appliedDiscount.discountedPrice : OFFER_PRICE;

  const setField = (field, value) =>
    setFormData(prev => ({ ...prev, [field]: value }));

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(formData)); } catch {}
  }, [formData]);

  useEffect(() => { checkSub(); }, []); // eslint-disable-line

  const checkSub = async () => {
    const token    = localStorage.getItem("userToken");
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
  };

  // Debounced live preview (all pages, for the preview modal's slider)
  useEffect(() => {
    if (!formData.companyName || !formData.candidateName) { setPreviewPages([]); return; }
    const t = setTimeout(async () => {
      setIsGeneratingPreview(true);
      try {
        setPreviewPages(await generateOfferLetterPreviewPages(formData));
      } catch {}
      setIsGeneratingPreview(false);
    }, 900);
    return () => clearTimeout(t);
  }, [formData]);

  // ── Checkmark / Preview → preview modal ──
  const handleNext = () => {
    if (!String(formData.companyName || "").trim())   { showToast("Please enter the company name", "danger"); return; }
    if (!String(formData.candidateName || "").trim()) { showToast("Please enter the candidate's full name", "danger"); return; }
    setPreviewModalOpen(true);
  };

  const handleLogoFile = file => {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { showToast("Logo must be under 2MB", "danger"); return; }
    if (!file.type.includes("image")) { showToast("Please upload an image file", "danger"); return; }
    const r = new FileReader();
    r.onloadend = () => setFormData(p => ({ ...p, companyLogo: r.result, companyLogoName: file.name }));
    r.readAsDataURL(file);
  };

  const handleSigFile = (field, file) => {
    if (!file) return;
    if (file.size > 1 * 1024 * 1024) { showToast("Signature must be under 1MB", "danger"); return; }
    if (!file.type.includes("image")) { showToast("Please upload an image file", "danger"); return; }
    const r = new FileReader();
    r.onloadend = () => setFormData(p => ({ ...p, [field]: r.result }));
    r.readAsDataURL(file);
  };

  const handleSubscriptionDownload = async () => {
    const token = localStorage.getItem("userToken");
    if (!token) { showToast("Please log in to use your subscription", "warning"); return; }
    setIsProcessing(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/user/subscription-download`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ documentType: "offer-letter", template: formData.template }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to process download");
      const pdfBlob = await generateAndDownloadOfferLetter(formData, !!user);
      // Archive to the account so it appears in downloads and the admin Saved Docs.
      if (user && pdfBlob instanceof Blob) {
        try {
          const reader = new FileReader();
          reader.onloadend = async () => {
            await fetch(`${BACKEND_URL}/api/user/saved-documents`, {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
              body: JSON.stringify({
                documentType: "offer-letter",
                fileName: `Offer_Letter_${formData.candidateName?.replace(/\s+/g, "_") || "Candidate"}.pdf`,
                fileData: reader.result.split(",")[1],
                template: formData.template,
              }),
            });
          };
          reader.readAsDataURL(pdfBlob);
        } catch (e) { console.error("Failed to save document:", e); }
      }
      if (data.downloadsRemaining !== undefined) {
        const u = { ...user, subscription: { ...user.subscription, downloads_remaining: data.downloadsRemaining } };
        setUser(u);
        localStorage.setItem("userInfo", JSON.stringify(u));
        if (data.downloadsRemaining === 0) setHasActiveSubscription(false);
      }
      showToast("Offer letter downloaded!");
    } catch (err) {
      showToast(err.message || "Download failed. Please try again.", "danger");
    } finally { setIsProcessing(false); }
  };

  // One-time purchase: open the in-app card checkout
  const handleStripeCheckout = () => setPaymentOpen(true);

  // Runs after the card payment succeeds — store the pending form data (same
  // keys the hosted-checkout flow used) and hand off to /payment-success,
  // which generates + downloads + emails and shows the success screen. The
  // webhook records the purchase from the payment-intent metadata.
  const handlePaymentSuccess = ({ email, paymentIntentId }) => {
    localStorage.setItem("pendingOfferLetterData",     JSON.stringify(formData));
    localStorage.setItem("pendingOfferLetterTemplate", formData.template);
    localStorage.setItem("pendingCustomerEmail", email);
    navigate(`/payment-success?type=offer-letter&source=app&payment_intent=${encodeURIComponent(paymentIntentId)}`);
  };

  // ── Small sub-components ──────────────────────────────────────────────

  // Plain render functions (not inline components) so the Ionic inputs and
  // the signature canvas never remount mid-typing/mid-drawing — same
  // pattern as the tax/legal/business modal.
  const renderField = (label, field, type = "text", placeholder = "") => (
    type === "date" ? (
      <IonDateInput label={label} value={formData[field]} onChange={v => setField(field, v)} />
    ) : (
      <IonInput value={formData[field]} onIonInput={e => setField(field, e.detail.value)}
        type={type} placeholder={placeholder} fill="outline" labelPlacement="floating" label={label} />
    )
  );

  const renderSelect = (label, field, options) => (
    <IonSelect fill="outline" labelPlacement="floating" label={label} value={formData[field]}
      onIonChange={e => setField(field, e.detail.value)}>
      {options.map(o => (
        <IonSelectOption key={o.value} value={o.value}>{o.label}</IonSelectOption>
      ))}
    </IonSelect>
  );

  const renderSigToggle = (typeField, imageField, sigRef) => (
    <div>
      <IonSegment mode="ios" value={formData[typeField]} style={{ marginBottom: 8, width: "100%" }}
        onIonChange={e => { const m = e.detail.value; setFormData(p => ({ ...p, [typeField]: m, [imageField]: null })); }}>
        <IonSegmentButton value="generated"><IonLabel>Auto</IonLabel></IonSegmentButton>
        <IonSegmentButton value="draw"><IonLabel>Draw</IonLabel></IonSegmentButton>
        <IonSegmentButton value="custom"><IonLabel>Upload</IonLabel></IonSegmentButton>
      </IonSegment>
      {formData[typeField] === "draw" && (
        <SignaturePad height={150} onChange={dataUrl => setField(imageField, dataUrl)} />
      )}
      {formData[typeField] === "custom" && (
        formData[imageField] ? (
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 8, border: "1px solid var(--ion-color-step-200)", background: "var(--ion-color-step-50)" }}>
            <img src={formData[imageField]} alt="sig" style={{ height: 32, width: "auto", maxWidth: 120, objectFit: "contain" }} />
            <span style={{ flex: 1, fontSize: "0.78rem", color: "var(--ion-color-medium)" }}>Uploaded</span>
            <IonButton fill="clear" size="small" onClick={() => { setField(imageField, null); if (sigRef.current) sigRef.current.value = ""; }}>
              <IonIcon icon={closeOutline} slot="icon-only" />
            </IonButton>
          </div>
        ) : (
          <div onClick={() => sigRef.current?.click()}
            style={{ padding: 14, borderRadius: 8, border: "2px dashed var(--ion-color-step-200)", textAlign: "center", cursor: "pointer", color: "var(--ion-color-medium)", fontSize: "0.8rem" }}>
            Tap to upload signature image
          </div>
        )
      )}
      <input ref={sigRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => handleSigFile(imageField, e.target.files?.[0])} />
    </div>
  );

  if (!isOpen) return null;

  const isMobile = window.innerWidth < 768;

  return createPortal(
    <div className="modal-backdrop" style={{ position: "fixed", inset: 0, zIndex: 10000, background: isMobile ? "var(--ion-background-color, #f2f2f7)" : "rgba(0,0,0,0.5)", display: "flex", alignItems: isMobile ? "stretch" : "center", justifyContent: isMobile ? "stretch" : "center" }}>
      <div className="modal-slide-up" style={{ background: "var(--ion-background-color, #f2f2f7)", color: "var(--ion-text-color)", display: "flex", flexDirection: "column", width: "100%", maxWidth: isMobile ? "100%" : 620, height: isMobile ? "100%" : "auto", maxHeight: isMobile ? "100%" : "92vh", overflow: "hidden" }}>

        <IonHeader>
          <IonToolbar style={{ "--background": "var(--ion-card-background)", "--color": "var(--ion-text-color)" }}>
            <IonButtons slot="start">
              <IonButton fill="clear" shape="round" onClick={onClose}>
                <span slot="icon-only" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", lineHeight: 0, flexShrink: 0, fontSize: "1rem", color: "var(--ion-text-color)" }}>
                  <IonIcon icon={closeOutline} style={{ fontSize: "inherit", color: "inherit", pointerEvents: "none" }} />
                </span>
              </IonButton>
            </IonButtons>
            <IonTitle style={{ fontWeight: 700 }}>Offer Letter</IonTitle>
            <IonButtons slot="end">
              <IonButton fill="clear" shape="round" onClick={handleNext}>
                <span slot="icon-only" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", lineHeight: 0, flexShrink: 0, fontSize: "1rem", color: "var(--ion-color-success)" }}>
                  <IonIcon icon={checkmarkOutline} style={{ fontSize: "inherit", color: "inherit", pointerEvents: "none" }} />
                </span>
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>

        <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 40px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Template */}
            <div style={cardStyle}>
              <div style={headingStyle}>Template Style</div>
              <IonSegment mode="ios" value={formData.template} style={{ width: "100%" }}
                onIonChange={e => setField("template", e.detail.value)}>
                {TEMPLATES.map(t => (
                  <IonSegmentButton key={t.value} value={t.value}>
                    <IonLabel>{t.label}</IonLabel>
                  </IonSegmentButton>
                ))}
              </IonSegment>
              {formData.template === "custom" && (
                <div style={{ display: "flex", gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <span style={labelStyle}>Primary Color</span>
                    <input type="color" value={formData.primaryColor} onChange={e => setField("primaryColor", e.target.value)}
                      style={{ width: "100%", height: 40, borderRadius: 6, border: "1px solid var(--ion-color-step-200)", cursor: "pointer", display: "block" }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <span style={labelStyle}>Accent Color</span>
                    <input type="color" value={formData.accentColor} onChange={e => setField("accentColor", e.target.value)}
                      style={{ width: "100%", height: 40, borderRadius: 6, border: "1px solid var(--ion-color-step-200)", cursor: "pointer", display: "block" }} />
                  </div>
                </div>
              )}
            </div>

            {/* Company Info */}
            <div style={cardStyle}>
              <div style={headingStyle}>Company Information</div>
              {renderField("Company Name *", "companyName")}
              <div>
                <span style={labelStyle}>Company Logo (Optional)</span>
                {formData.companyLogo ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 8, border: "1px solid var(--ion-color-step-200)", background: "var(--ion-color-step-50)" }}>
                    <img src={formData.companyLogo} alt="logo" style={{ height: 36, width: "auto", maxWidth: 80, objectFit: "contain" }} />
                    <span style={{ flex: 1, fontSize: "0.78rem", color: "var(--ion-color-medium)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{formData.companyLogoName}</span>
                    <IonButton fill="clear" size="small" onClick={() => { setFormData(p => ({ ...p, companyLogo: null, companyLogoName: "" })); if (logoRef.current) logoRef.current.value = ""; }}>
                      <IonIcon icon={closeOutline} slot="icon-only" />
                    </IonButton>
                  </div>
                ) : (
                  <div onClick={() => logoRef.current?.click()}
                    style={{ padding: 16, borderRadius: 8, border: "2px dashed var(--ion-color-step-200)", textAlign: "center", cursor: "pointer", color: "var(--ion-color-medium)", fontSize: "0.85rem" }}>
                    <IonIcon icon={imageOutline} style={{ fontSize: 24, display: "block", margin: "0 auto 4px" }} />
                    Tap to upload logo
                  </div>
                )}
                <input ref={logoRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => handleLogoFile(e.target.files?.[0])} />
              </div>
              {renderField("Address", "companyAddress")}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 100px 100px", gap: 8 }}>
                {renderField("City", "companyCity")}
                {renderSelect("State", "companyState", US_STATES.map(s => ({ value: s, label: s })))}
                {renderField("ZIP", "companyZip")}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {renderField("Phone", "companyPhone", "tel")}
                {renderField("Email", "companyEmail", "email")}
              </div>
              {renderField("Website", "companyWebsite")}
            </div>

            {/* Candidate Info */}
            <div style={cardStyle}>
              <div style={headingStyle}>Candidate Information</div>
              {renderField("Candidate Full Name *", "candidateName")}
              {renderField("Address", "candidateAddress")}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 100px 100px", gap: 8 }}>
                {renderField("City", "candidateCity")}
                {renderSelect("State", "candidateState", US_STATES.map(s => ({ value: s, label: s })))}
                {renderField("ZIP", "candidateZip")}
              </div>
            </div>

            {/* Position Details */}
            <div style={cardStyle}>
              <div style={headingStyle}>Position Details</div>
              {renderField("Job Title *", "jobTitle")}
              {renderField("Department", "department")}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {renderSelect("Employment Type", "employmentType", EMPLOYMENT_TYPES)}
                {renderSelect("Work Location", "workLocation", WORK_LOCATIONS)}
              </div>
              {formData.workLocation !== "remote" && renderField("Work Address", "workAddress")}
              {renderField("Start Date", "startDate", "date")}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {renderField("Reporting Manager", "reportingManager")}
                {renderField("Manager's Title", "reportingTitle")}
              </div>
            </div>

            {/* Compensation */}
            <div style={cardStyle}>
              <div style={headingStyle}>Compensation</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {renderSelect("Compensation Type", "compensationType", COMPENSATION_TYPES)}
                {renderSelect("Pay Frequency", "payFrequency", PAY_FREQUENCIES)}
              </div>
              {renderField("Amount ($)", "compensationAmount", "number")}
            </div>

            {/* Benefits */}
            <div style={cardStyle}>
              <div style={headingStyle}>Benefits & Terms</div>
              <IonTextarea value={formData.benefits} onIonInput={e => setField("benefits", e.detail.value)}
                rows={6} fill="outline" labelPlacement="floating" label="Benefits Package" />
              <IonTextarea value={formData.additionalTerms} onIonInput={e => setField("additionalTerms", e.detail.value)}
                rows={3} placeholder="Any additional terms or conditions..." fill="outline" labelPlacement="floating" label="Additional Terms (Optional)" />
              {renderField("Response Deadline", "responseDeadline", "date")}
            </div>

            {/* HR Signature */}
            <div style={cardStyle}>
              <div style={headingStyle}>HR Signature</div>
              {renderField("Letter Date", "letterDate", "date")}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {renderField("Signer Name", "signerName")}
                {renderField("Signer Title", "signerTitle")}
              </div>
              <div>
                <span style={labelStyle}>HR Signature Style</span>
                {renderSigToggle("hrSignatureType", "hrSignatureImage", hrSigRef)}
              </div>
            </div>

            {/* Employee Signature */}
            <div style={cardStyle}>
              <div style={headingStyle}>Employee Signature (Optional)</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {renderField("Employee Full Name", "employeeSignatureName")}
                {renderField("Sign Date", "employeeSignDate", "date")}
              </div>
              <div>
                <span style={labelStyle}>Employee Signature Style</span>
                {renderSigToggle("employeeSignatureType", "employeeSignatureImage", empSigRef)}
              </div>
            </div>

            {/* Preview */}
            <div style={cardStyle}>
              <div style={headingStyle}>Preview & Download</div>
              <IonButton expand="block" color="light" onClick={handleNext}>
                <IonIcon icon={eyeOutline} slot="start" />
                Preview
              </IonButton>
            </div>

          </div>
        </div>
      </div>

      {/* ── Preview modal — same flow as the paystub modals ── */}
      {previewModalOpen && (() => {
        const pageIdx = Math.min(previewPageIndex, Math.max(0, previewPages.length - 1));
        return (
        <div className="modal-backdrop" style={{ position: "fixed", inset: 0, zIndex: 10001, background: isMobile ? "var(--ion-background-color, #f2f2f7)" : "rgba(0,0,0,0.5)", display: "flex", alignItems: isMobile ? "stretch" : "center", justifyContent: isMobile ? "stretch" : "center" }}>
          <div className="modal-slide-up" style={{ background: "var(--ion-background-color, #f2f2f7)", color: "var(--ion-text-color)", display: "flex", flexDirection: "column", width: "100%", maxWidth: isMobile ? "100%" : 600, height: isMobile ? "100%" : "auto", maxHeight: isMobile ? "100%" : "90vh", overflow: "hidden" }}>
            <IonHeader>
              <IonToolbar style={{ "--background": "var(--ion-card-background)", "--color": "var(--ion-text-color)" }}>
                <IonButtons slot="start">
                  <IonButton fill="clear" shape="round" onClick={() => setPreviewModalOpen(false)}>
                    <span slot="icon-only" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", lineHeight: 0, flexShrink: 0, fontSize: "1rem", color: "var(--ion-text-color)" }}>
                      <IonIcon icon={closeOutline} style={{ fontSize: "inherit", color: "inherit", pointerEvents: "none" }} />
                    </span>
                  </IonButton>
                </IonButtons>
                <IonTitle style={{ fontWeight: 700 }}>
                  Preview {previewPages.length > 1 ? `(${pageIdx + 1} of ${previewPages.length})` : ""}
                </IonTitle>
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
                  <PreviewPager pages={previewPages} index={pageIdx} onIndexChange={setPreviewPageIndex} altPrefix="Offer letter preview" />
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
                      <p style={{ textDecoration: "line-through", color: "var(--ion-color-medium)", fontSize: "0.9rem", margin: "0 0 4px" }}>${OFFER_PRICE.toFixed(2)}</p>
                      <p style={{ fontWeight: 700, fontSize: "1.3rem", color: "var(--ion-color-success-shade)", margin: "0 0 4px" }}>${appliedDiscount.discountedPrice.toFixed(2)}</p>
                      <p style={{ fontSize: "0.75rem", color: "var(--ion-color-success)", margin: 0 }}>{appliedDiscount.discountPercent}% discount applied</p>
                    </>
                  ) : (
                    <>
                      <p style={{ fontWeight: 700, fontSize: "1.2rem", color: "var(--ion-color-success-shade)", margin: "0 0 4px" }}>${OFFER_PRICE.toFixed(2)}</p>
                      <p style={{ fontSize: "0.75rem", color: "var(--ion-color-medium)", margin: 0 }}>One-time payment · instant download</p>
                    </>
                  )}
                </div>
              )}

              <IonButton
                expand="block"
                color="success"
                style={{ marginTop: 20, "--border-radius": "8px" }}
                disabled={isProcessing}
                onClick={hasActiveSubscription ? handleSubscriptionDownload : handleStripeCheckout}
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
                    : `Pay & Download — $${finalPrice.toFixed(2)}`}
              </IonButton>
            </div>
          </div>
        </div>
        );
      })()}

      {paymentOpen && (
        <PaymentModal
          docLabel="Offer Letter"
          documentType="offer-letter"
          template={formData.template}
          basePrice={OFFER_PRICE}
          discount={appliedDiscount}
          onSuccess={handlePaymentSuccess}
          onClose={() => setPaymentOpen(false)}
        />
      )}

      <IonToast isOpen={toastOpen} onDidDismiss={() => setToastOpen(false)}
        message={toastMessage} duration={3500} position="top" color={toastColor} />
    </div>,
    document.querySelector("ion-app") || document.body
  );
}

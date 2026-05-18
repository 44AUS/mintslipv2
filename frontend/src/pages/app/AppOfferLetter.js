import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  IonHeader, IonToolbar, IonTitle, IonButtons,
  IonInput, IonSelect, IonSelectOption,
  IonButton, IonIcon, IonSpinner, IonTextarea, IonToast,
} from "@ionic/react";
import {
  cloudDownloadOutline, eyeOutline, closeOutline, imageOutline,
} from "ionicons/icons";
import { generateAndDownloadOfferLetter } from "@/utils/offerLetterGenerator";
import { generateOfferLetterPreview } from "@/utils/offerLetterPreviewGenerator";
import { isNative, nativePost, getStripeOrigin } from "@/utils/nativeHttp";

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
const inputStyle = {
  "--background": "var(--ion-color-step-50)",
  "--color": "var(--ion-text-color)",
  "--border-color": "var(--ion-color-step-200)",
  "--border-radius": "6px",
  "--padding-start": "10px",
  "--padding-end": "10px",
  fontSize: "0.9rem",
};

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

  const [user, setUser]                                   = useState(null);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [isProcessing, setIsProcessing]                   = useState(false);
  const [pdfPreview, setPdfPreview]                       = useState(null);
  const [isGeneratingPreview, setIsGeneratingPreview]     = useState(false);
  const [showPreview, setShowPreview]                     = useState(false);
  const [toastOpen, setToastOpen]                         = useState(false);
  const [toastMessage, setToastMessage]                   = useState("");
  const [toastColor, setToastColor]                       = useState("success");

  const showToast = (msg, color = "success") => {
    setToastMessage(msg); setToastColor(color); setToastOpen(true);
  };

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

  // Debounced preview
  useEffect(() => {
    if (!formData.companyName || !formData.candidateName) return;
    const t = setTimeout(async () => {
      setIsGeneratingPreview(true);
      try {
        const url = await generateOfferLetterPreview(formData);
        setPdfPreview(url);
      } catch {}
      setIsGeneratingPreview(false);
    }, 900);
    return () => clearTimeout(t);
  }, [formData]);

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
      await generateAndDownloadOfferLetter(formData, !!user);
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

  const handleStripeCheckout = async () => {
    setIsProcessing(true);
    try {
      localStorage.setItem("pendingOfferLetterData",     JSON.stringify(formData));
      localStorage.setItem("pendingOfferLetterTemplate", formData.template);
      const origin = getStripeOrigin(BACKEND_URL);
      const { ok, data } = await nativePost(`${BACKEND_URL}/api/stripe/create-one-time-checkout`, {
        amount: 9.99,
        documentType: "offer-letter",
        template: formData.template,
        successUrl: `${origin}/payment-success?type=offer-letter&session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl:  `${origin}/app/paystub`,
      });
      if (!ok || !data?.url) throw new Error(data?.detail || "Failed to create checkout session");
      window.location.href = data.url;
    } catch (err) {
      showToast(err.message || "Payment failed. Please try again.", "danger");
    } finally { setIsProcessing(false); }
  };

  // ── Small sub-components ──────────────────────────────────────────────

  const Field = ({ label, field, type = "text", placeholder = "" }) => (
    <div>
      {label && <span style={labelStyle}>{label}</span>}
      <IonInput value={formData[field]} onIonInput={e => setField(field, e.detail.value)}
        type={type} placeholder={placeholder} fill="outline" style={inputStyle} />
    </div>
  );

  const SelectField = ({ label, field, options }) => (
    <div>
      {label && <span style={labelStyle}>{label}</span>}
      <IonSelect value={formData[field]} onIonChange={e => setField(field, e.detail.value)}
        fill="outline" style={inputStyle}>
        {options.map(o => (
          <IonSelectOption key={o.value} value={o.value}>{o.label}</IonSelectOption>
        ))}
      </IonSelect>
    </div>
  );

  const SigToggle = ({ typeField, imageField, sigRef }) => (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        {["generated", "custom"].map(t => (
          <button key={t} onClick={() => setField(typeField, t)}
            style={{
              flex: 1, padding: "6px 8px", borderRadius: 6,
              border: `2px solid ${formData[typeField] === t ? "var(--ion-color-primary)" : "var(--ion-color-step-200)"}`,
              background: formData[typeField] === t ? "rgba(var(--ion-color-primary-rgb),0.08)" : "transparent",
              cursor: "pointer", fontSize: "0.78rem", fontWeight: 600,
              color: formData[typeField] === t ? "var(--ion-color-primary)" : "var(--ion-text-color)",
            }}>
            {t === "generated" ? "Auto-generate" : "Upload Image"}
          </button>
        ))}
      </div>
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
          </IonToolbar>
        </IonHeader>

        <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 40px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Template */}
            <div style={cardStyle}>
              <div style={headingStyle}>Template Style</div>
              <div style={{ display: "flex", gap: 8 }}>
                {TEMPLATES.map(t => (
                  <button key={t.value} onClick={() => setField("template", t.value)}
                    style={{
                      flex: 1, padding: "10px 6px", borderRadius: 8,
                      border: `2px solid ${formData.template === t.value ? "var(--ion-color-primary)" : "var(--ion-color-step-200)"}`,
                      background: formData.template === t.value ? "rgba(var(--ion-color-primary-rgb),0.08)" : "transparent",
                      cursor: "pointer", textAlign: "center",
                    }}>
                    <div style={{ fontSize: "0.8rem", fontWeight: 700, color: formData.template === t.value ? "var(--ion-color-primary)" : "var(--ion-text-color)" }}>{t.label}</div>
                    <div style={{ fontSize: "0.65rem", color: "var(--ion-color-medium)", marginTop: 2 }}>{t.desc}</div>
                  </button>
                ))}
              </div>
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
              <Field label="Company Name *" field="companyName" />
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
              <Field label="Address" field="companyAddress" />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 90px", gap: 8 }}>
                <Field label="City" field="companyCity" />
                <SelectField label="State" field="companyState" options={US_STATES.map(s => ({ value: s, label: s }))} />
                <Field label="ZIP" field="companyZip" />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <Field label="Phone" field="companyPhone" type="tel" />
                <Field label="Email" field="companyEmail" type="email" />
              </div>
              <Field label="Website" field="companyWebsite" />
            </div>

            {/* Candidate Info */}
            <div style={cardStyle}>
              <div style={headingStyle}>Candidate Information</div>
              <Field label="Candidate Full Name *" field="candidateName" />
              <Field label="Address" field="candidateAddress" />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 90px", gap: 8 }}>
                <Field label="City" field="candidateCity" />
                <SelectField label="State" field="candidateState" options={US_STATES.map(s => ({ value: s, label: s }))} />
                <Field label="ZIP" field="candidateZip" />
              </div>
            </div>

            {/* Position Details */}
            <div style={cardStyle}>
              <div style={headingStyle}>Position Details</div>
              <Field label="Job Title *" field="jobTitle" />
              <Field label="Department" field="department" />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <SelectField label="Employment Type" field="employmentType" options={EMPLOYMENT_TYPES} />
                <SelectField label="Work Location" field="workLocation" options={WORK_LOCATIONS} />
              </div>
              {formData.workLocation !== "remote" && <Field label="Work Address" field="workAddress" />}
              <Field label="Start Date" field="startDate" type="date" />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <Field label="Reporting Manager" field="reportingManager" />
                <Field label="Manager's Title" field="reportingTitle" />
              </div>
            </div>

            {/* Compensation */}
            <div style={cardStyle}>
              <div style={headingStyle}>Compensation</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <SelectField label="Compensation Type" field="compensationType" options={COMPENSATION_TYPES} />
                <SelectField label="Pay Frequency" field="payFrequency" options={PAY_FREQUENCIES} />
              </div>
              <Field label="Amount ($)" field="compensationAmount" type="number" />
            </div>

            {/* Benefits */}
            <div style={cardStyle}>
              <div style={headingStyle}>Benefits & Terms</div>
              <div>
                <span style={labelStyle}>Benefits Package</span>
                <IonTextarea value={formData.benefits} onIonInput={e => setField("benefits", e.detail.value)}
                  rows={6} fill="outline"
                  style={{ "--background": "var(--ion-color-step-50)", "--color": "var(--ion-text-color)", "--border-color": "var(--ion-color-step-200)", fontSize: "0.88rem" }} />
              </div>
              <div>
                <span style={labelStyle}>Additional Terms (Optional)</span>
                <IonTextarea value={formData.additionalTerms} onIonInput={e => setField("additionalTerms", e.detail.value)}
                  rows={3} placeholder="Any additional terms or conditions..." fill="outline"
                  style={{ "--background": "var(--ion-color-step-50)", "--color": "var(--ion-text-color)", "--border-color": "var(--ion-color-step-200)", fontSize: "0.88rem" }} />
              </div>
              <Field label="Response Deadline" field="responseDeadline" type="date" />
            </div>

            {/* HR Signature */}
            <div style={cardStyle}>
              <div style={headingStyle}>HR Signature</div>
              <Field label="Letter Date" field="letterDate" type="date" />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <Field label="Signer Name" field="signerName" />
                <Field label="Signer Title" field="signerTitle" />
              </div>
              <div>
                <span style={labelStyle}>HR Signature Style</span>
                <SigToggle typeField="hrSignatureType" imageField="hrSignatureImage" sigRef={hrSigRef} />
              </div>
            </div>

            {/* Employee Signature */}
            <div style={cardStyle}>
              <div style={headingStyle}>Employee Signature (Optional)</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <Field label="Employee Full Name" field="employeeSignatureName" />
                <Field label="Sign Date" field="employeeSignDate" type="date" />
              </div>
              <div>
                <span style={labelStyle}>Employee Signature Style</span>
                <SigToggle typeField="employeeSignatureType" imageField="employeeSignatureImage" sigRef={empSigRef} />
              </div>
            </div>

            {/* Preview & Download */}
            <div style={cardStyle}>
              <div style={headingStyle}>Preview & Download</div>
              {formData.companyName && formData.candidateName && (
                <IonButton fill="outline" size="small" onClick={() => setShowPreview(v => !v)}
                  disabled={isGeneratingPreview}
                  style={{ "--color": "var(--ion-text-color)", "--border-color": "var(--ion-color-step-300)", alignSelf: "flex-start" }}>
                  {isGeneratingPreview
                    ? <IonSpinner name="crescent" slot="start" style={{ width: 16, height: 16 }} />
                    : <IonIcon icon={eyeOutline} slot="start" />}
                  {showPreview ? "Hide Preview" : "Show Preview"}
                </IonButton>
              )}
              {showPreview && pdfPreview && (
                <div style={{ borderRadius: 8, overflow: "hidden", border: "1px solid var(--ion-color-step-200)" }}>
                  <iframe src={pdfPreview} style={{ width: "100%", height: 420, border: "none" }} title="Preview" />
                </div>
              )}
              {hasActiveSubscription ? (
                <IonButton expand="block" onClick={handleSubscriptionDownload} disabled={isProcessing}
                  style={{ "--background": "#16a34a", "--background-activated": "#15803d" }}>
                  {isProcessing ? <IonSpinner name="crescent" style={{ color: "#fff" }} />
                    : <><IonIcon icon={cloudDownloadOutline} slot="start" />Download (Subscription)</>}
                </IonButton>
              ) : (
                <IonButton expand="block" onClick={handleStripeCheckout} disabled={isProcessing}
                  style={{ "--background": "#16a34a", "--background-activated": "#15803d" }}>
                  {isProcessing ? <IonSpinner name="crescent" style={{ color: "#fff" }} />
                    : <><IonIcon icon={cloudDownloadOutline} slot="start" />Buy &amp; Download — $9.99</>}
                </IonButton>
              )}
            </div>

          </div>
        </div>
      </div>

      <IonToast isOpen={toastOpen} onDidDismiss={() => setToastOpen(false)}
        message={toastMessage} duration={3500} position="top" color={toastColor} />
    </div>,
    document.querySelector("ion-app") || document.body
  );
}

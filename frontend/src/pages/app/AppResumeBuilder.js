import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  IonHeader, IonToolbar, IonTitle, IonButtons,
  IonInput, IonSelect, IonSelectOption,
  IonButton, IonIcon, IonSpinner, IonTextarea, IonToast,
  IonSegment, IonSegmentButton, IonLabel, IonCheckbox, IonNote,
} from "@ionic/react";
import {
  cloudDownloadOutline, cloudUploadOutline, documentTextOutline, eyeOutline, trashOutline, addOutline,
  closeOutline, chevronBackOutline, chevronForwardOutline, sparklesOutline,
  refreshOutline, personOutline, briefcaseOutline, schoolOutline,
  bulbOutline, searchOutline,
} from "ionicons/icons";
import { generateAndDownloadResume } from "@/utils/resumeGenerator";
import { generateResumePreview } from "@/utils/resumePreviewGenerator";
import { isNative, nativePost, getStripeOrigin } from "@/utils/nativeHttp"; // eslint-disable-line no-unused-vars
import { useDisabledGenerators } from "@/utils/generatorAvailability";
import PaymentModal from "@/components/PaymentModal";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";
const STORAGE_KEY = "resumeBuilderFormData";
const GENERATED_KEY = "resumeBuilderGenerated";

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
// Inputs match the paystub modal: plain outline + floating label, no overrides
const inputStyle = {};

const TEMPLATES = [
  { value: "ats",     label: "ATS Optimized",      desc: "Passes ATS scanners",      color: "#2563eb" },
  { value: "modern",  label: "Modern Professional", desc: "Contemporary with accents", color: "#059669" },
  { value: "classic", label: "Classic Executive",   desc: "Formal, senior roles",     color: "#1e293b" },
];

const FONTS = [
  { value: "Calibri",         label: "Calibri" },
  { value: "Arial",           label: "Arial" },
  { value: "Montserrat",      label: "Montserrat" },
  { value: "Helvetica",       label: "Helvetica" },
  { value: "Times New Roman", label: "Times New Roman" },
];

const STEPS = [
  { id: 1, label: "Personal",   icon: personOutline },
  { id: 2, label: "Experience", icon: briefcaseOutline },
  { id: 3, label: "Education",  icon: schoolOutline },
  { id: 4, label: "Skills",     icon: bulbOutline },
  { id: 5, label: "Target Job", icon: searchOutline },
  { id: 6, label: "Generate",   icon: sparklesOutline },
];

const makeWork = () => ({
  id: `work_${Date.now()}_${Math.random().toString(36).slice(2)}`,
  company: "", position: "", location: "",
  startDate: "", endDate: "", current: false,
  responsibilities: [""],
});

const makeEdu = () => ({
  id: `edu_${Date.now()}_${Math.random().toString(36).slice(2)}`,
  institution: "", degree: "", field: "", graduationDate: "", gpa: "",
});

const defaultFormData = {
  template: "ats", font: "Calibri", sectionLayout: "standard", onePage: false,
  personalInfo: { fullName: "", email: "", phone: "", location: "", linkedin: "", website: "" },
  workExperience: [makeWork()],
  education: [makeEdu()],
  skills: [""],
  targetJobTitle: "", jobDescription: "", jobUrl: "",
};

export default function AppResumeBuilder({ isOpen, onClose }) {
  const [formData, setFormData] = useState(() => {
    try { const s = localStorage.getItem(STORAGE_KEY); return s ? { ...defaultFormData, ...JSON.parse(s) } : defaultFormData; }
    catch { return defaultFormData; }
  });

  const [generatedResume, setGeneratedResume] = useState(() => {
    try { const s = localStorage.getItem(GENERATED_KEY); return s ? JSON.parse(s) : null; }
    catch { return null; }
  });

  const navigate = useNavigate();
  const [currentStep, setCurrentStep]                       = useState(1);
  const [customTemplates, setCustomTemplates]               = useState([]);
  const [user, setUser]                                     = useState(null);
  const [hasActiveSubscription, setHasActiveSubscription]   = useState(false);
  const [isGenerating, setIsGenerating]                     = useState(false);
  const [isGeneratingBullets, setIsGeneratingBullets]       = useState(null);
  const [isScrapingJob, setIsScrapingJob]                   = useState(false);
  const [isProcessing, setIsProcessing]                     = useState(false);
  const [pdfPreview, setPdfPreview]                         = useState(null);
  const [isGeneratingPreview, setIsGeneratingPreview]       = useState(false);
  const [showPreview, setShowPreview]                       = useState(false);
  const [toastOpen, setToastOpen]                           = useState(false);
  const [toastMessage, setToastMessage]                     = useState("");
  const [toastColor, setToastColor]                         = useState("success");
  const [paymentOpen, setPaymentOpen]                       = useState(false);
  const [couponCode, setCouponCode]                         = useState("");
  const [isValidatingCoupon, setIsValidatingCoupon]         = useState(false);
  const [couponError, setCouponError]                       = useState("");
  const [appliedDiscount, setAppliedDiscount]               = useState(null);

  const showToast = (msg, color = "success") => { setToastMessage(msg); setToastColor(color); setToastOpen(true); };
  const setField = (f, v) => setFormData(p => ({ ...p, [f]: v }));

  // ── Upload + parse an existing resume to auto-fill (same endpoint as web) ──
  const resumeFileRef = useRef(null);
  const [isParsingResume, setIsParsingResume] = useState(false);
  const [uploadedResumeName, setUploadedResumeName] = useState(null);

  const handleResumeUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const validTypes = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (!validTypes.includes(file.type) && !/\.(pdf|docx)$/i.test(file.name)) {
      showToast("Please upload a PDF or DOCX file", "danger");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showToast("File size must be less than 10MB", "danger");
      return;
    }
    setIsParsingResume(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`${BACKEND_URL}/api/parse-resume`, { method: "POST", body: fd });
      if (!res.ok) {
        let msg = "Failed to parse resume";
        try { msg = (await res.json()).detail || msg; } catch {}
        throw new Error(msg);
      }
      const result = await res.json();
      if (result.success && result.data) {
        const parsed = result.data;
        setFormData(prev => ({
          ...prev,
          personalInfo: {
            fullName: parsed.personalInfo?.fullName || prev.personalInfo.fullName,
            email: parsed.personalInfo?.email || prev.personalInfo.email,
            phone: parsed.personalInfo?.phone || prev.personalInfo.phone,
            location: parsed.personalInfo?.location || prev.personalInfo.location,
            linkedin: parsed.personalInfo?.linkedin || prev.personalInfo.linkedin,
            website: parsed.personalInfo?.website || prev.personalInfo.website,
          },
          workExperience: parsed.workExperience?.length > 0
            ? parsed.workExperience.map((exp, i) => ({
                id: `work_parsed_${Date.now()}_${i}`,
                company: exp.company || "", position: exp.position || "", location: exp.location || "",
                startDate: exp.startDate || "", endDate: exp.endDate || "", current: exp.current || false,
                responsibilities: exp.responsibilities?.length ? exp.responsibilities : [""],
              }))
            : prev.workExperience,
          education: parsed.education?.length > 0
            ? parsed.education.map((edu, i) => ({
                id: `edu_parsed_${Date.now()}_${i}`,
                institution: edu.institution || "", degree: edu.degree || "", field: edu.field || "",
                graduationDate: edu.graduationDate || "", gpa: edu.gpa || "",
              }))
            : prev.education,
          skills: parsed.skills?.length > 0 ? parsed.skills : prev.skills,
        }));
        setUploadedResumeName(file.name);
        showToast("Resume parsed — your details have been filled in.", "success");
      } else {
        showToast("Could not extract information from the resume", "danger");
      }
    } catch (err) {
      showToast(err.message || "Failed to parse resume", "danger");
    } finally {
      setIsParsingResume(false);
    }
  };

  useEffect(() => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(formData)); } catch {} }, [formData]);
  useEffect(() => { try { if (generatedResume) localStorage.setItem(GENERATED_KEY, JSON.stringify(generatedResume)); } catch {} }, [generatedResume]);
  useEffect(() => { checkSub(); }, []); // eslint-disable-line

  // Admin-published custom resume templates (from the doc template editor)
  useEffect(() => {
    fetch(`${BACKEND_URL}/api/doc-templates?documentType=resume`)
      .then((r) => r.json())
      .then((d) => { if (d.success) setCustomTemplates(d.templates || []); })
      .catch(() => {});
  }, []);

  // Admin can disable built-in styles or custom templates from Site Settings
  const disabledGenerators = useDisabledGenerators();
  const templateOptions = [
    ...TEMPLATES.filter((t) => !disabledGenerators.has(`resume-${t.value}`)),
    ...customTemplates
      .filter((t) => !disabledGenerators.has(`custom:${t.id}`))
      .map((t) => ({ value: `custom:${t.id}`, label: t.name, desc: t.description || "Custom design", color: t.badgeColor || "#059669" })),
  ];

  const checkSub = async () => {
    const token = localStorage.getItem("userToken");
    const userInfo = localStorage.getItem("userInfo");
    if (!token || !userInfo) return;
    try {
      const ud = JSON.parse(userInfo);
      setUser(ud);
      if (ud.subscription?.status === "active" && (ud.subscription.downloads_remaining > 0 || ud.subscription.downloads_remaining === -1))
        setHasActiveSubscription(true);
      const res = await fetch(`${BACKEND_URL}/api/user/me`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const d = await res.json();
        if (d.success && d.user) {
          setUser(d.user); localStorage.setItem("userInfo", JSON.stringify(d.user));
          setHasActiveSubscription(d.user.subscription?.status === "active" && (d.user.subscription.downloads_remaining > 0 || d.user.subscription.downloads_remaining === -1));
        }
      }
    } catch {}
  };

  // Preview whenever generated resume or style changes
  useEffect(() => {
    if (!generatedResume) return;
    const t = setTimeout(() => triggerPreview(generatedResume), 600);
    return () => clearTimeout(t);
  }, [generatedResume, formData.template, formData.font, formData.sectionLayout, formData.onePage]); // eslint-disable-line

  const triggerPreview = async resume => {
    if (!resume) return;
    setIsGeneratingPreview(true);
    try {
      const url = await generateResumePreview({ ...resume, template: formData.template, font: formData.font, sectionLayout: formData.sectionLayout, onePage: formData.onePage, isPaid: false });
      setPdfPreview(url);
    } catch {}
    setIsGeneratingPreview(false);
  };

  // ── Work helpers ────────────────────────────────────────────────────────
  const updateWork = (id, f, v) => setFormData(p => ({ ...p, workExperience: p.workExperience.map(e => e.id === id ? { ...e, [f]: v } : e) }));
  const addWork    = () => setFormData(p => ({ ...p, workExperience: [...p.workExperience, makeWork()] }));
  const removeWork = id => setFormData(p => ({ ...p, workExperience: p.workExperience.filter(e => e.id !== id) }));
  const addBullet  = expId => setFormData(p => ({ ...p, workExperience: p.workExperience.map(e => e.id === expId ? { ...e, responsibilities: [...e.responsibilities, ""] } : e) }));
  const updateBullet = (expId, idx, val) => setFormData(p => ({ ...p, workExperience: p.workExperience.map(e => e.id === expId ? { ...e, responsibilities: e.responsibilities.map((r, i) => i === idx ? val : r) } : e) }));
  const removeBullet = (expId, idx) => setFormData(p => ({ ...p, workExperience: p.workExperience.map(e => e.id === expId ? { ...e, responsibilities: e.responsibilities.filter((_, i) => i !== idx) } : e) }));

  const generateAIBullets = async expId => {
    const exp = formData.workExperience.find(e => e.id === expId);
    if (!exp?.position || !exp?.company) { showToast("Enter job title and company first", "warning"); return; }
    setIsGeneratingBullets(expId);
    try {
      const res = await fetch(`${BACKEND_URL}/api/generate-responsibilities`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ position: exp.position, company: exp.company, jobDescription: formData.jobDescription }),
      });
      const data = await res.json();
      if (data.success && data.responsibilities) {
        setFormData(p => ({ ...p, workExperience: p.workExperience.map(e => e.id === expId ? { ...e, responsibilities: data.responsibilities } : e) }));
        showToast("AI bullets generated!");
      } else throw new Error(data.detail || "Failed");
    } catch (err) { showToast(err.message || "Failed to generate bullets", "danger"); }
    finally { setIsGeneratingBullets(null); }
  };

  // ── Education helpers ───────────────────────────────────────────────────
  const updateEdu = (id, f, v) => setFormData(p => ({ ...p, education: p.education.map(e => e.id === id ? { ...e, [f]: v } : e) }));
  const addEdu    = () => setFormData(p => ({ ...p, education: [...p.education, makeEdu()] }));
  const removeEdu = id => setFormData(p => ({ ...p, education: p.education.filter(e => e.id !== id) }));

  // ── Skills helpers ──────────────────────────────────────────────────────
  const updateSkill = (idx, val) => setFormData(p => ({ ...p, skills: p.skills.map((s, i) => i === idx ? val : s) }));
  const addSkill    = () => setFormData(p => ({ ...p, skills: [...p.skills, ""] }));
  const removeSkill = idx => setFormData(p => ({ ...p, skills: p.skills.filter((_, i) => i !== idx) }));

  // ── AI generation ───────────────────────────────────────────────────────
  const generateResume = async () => {
    if (!formData.personalInfo.fullName) { showToast("Enter your name in Step 1 first", "warning"); return; }
    if (!formData.jobDescription) { showToast("Add a job description in Step 5 first", "warning"); return; }
    setIsGenerating(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/generate-resume`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personalInfo: formData.personalInfo,
          workExperience: formData.workExperience.filter(e => e.company),
          education: formData.education.filter(e => e.institution),
          skills: formData.skills.filter(Boolean),
          targetJobTitle: formData.targetJobTitle,
          jobDescription: formData.jobDescription,
        }),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.detail || "Generation failed"); }
      const result = await res.json();
      setGeneratedResume({ ...result, generatedAt: Date.now() });
      showToast("Resume generated! Review and download below.");
    } catch (err) { showToast(err.message || "Failed to generate resume. Please try again.", "danger"); }
    finally { setIsGenerating(false); }
  };

  const scrapeJobUrl = async () => {
    if (!formData.jobUrl) { showToast("Enter a job posting URL first", "warning"); return; }
    setIsScrapingJob(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/scrape-job`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: formData.jobUrl }) });
      if (!res.ok) throw new Error("Failed to extract job posting");
      const data = await res.json();
      setField("jobDescription", data.jobDescription);
      showToast("Job description extracted!");
    } catch (err) { showToast(err.message || "Failed to extract. Paste the description manually.", "danger"); }
    finally { setIsScrapingJob(false); }
  };

  // ── Download handlers ───────────────────────────────────────────────────
  const handleSubscriptionDownload = async () => {
    if (!generatedResume) { showToast("Generate your resume first", "warning"); return; }
    const token = localStorage.getItem("userToken");
    if (!token) { showToast("Please log in to use your subscription", "warning"); return; }
    setIsProcessing(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/user/subscription-download`, {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ documentType: "ai-resume", template: formData.template }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to process download");
      const zipBlob = await generateAndDownloadResume({ ...generatedResume, template: formData.template, font: formData.font, sectionLayout: formData.sectionLayout, onePage: formData.onePage }, !!user);
      // Archive to the account so it appears in downloads and the admin Saved Docs.
      if (user && zipBlob instanceof Blob) {
        try {
          const reader = new FileReader();
          reader.onloadend = async () => {
            await fetch(`${BACKEND_URL}/api/user/saved-documents`, {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
              body: JSON.stringify({
                documentType: "resume",
                fileName: `resume_${new Date().toISOString().split("T")[0]}.zip`,
                fileData: reader.result.split(",")[1],
                template: formData.template,
              }),
            });
          };
          reader.readAsDataURL(zipBlob);
        } catch (e) { console.error("Failed to save document:", e); }
      }
      if (data.downloadsRemaining !== undefined) {
        const u = { ...user, subscription: { ...user.subscription, downloads_remaining: data.downloadsRemaining } };
        setUser(u); localStorage.setItem("userInfo", JSON.stringify(u));
        if (data.downloadsRemaining === 0) setHasActiveSubscription(false);
      }
      showToast("Resume downloaded!");
    } catch (err) { showToast(err.message || "Download failed. Please try again.", "danger"); }
    finally { setIsProcessing(false); }
  };

  // ── Coupon ──
  // Auto-apply: as the user types or pastes a code we look it up (debounced)
  // and apply it with a toast — no Apply button.
  const RESUME_PRICE = 9.99;
  useEffect(() => {
    const code = couponCode.trim();
    if (!code || appliedDiscount) { setIsValidatingCoupon(false); return; }
    let cancelled = false;
    const t = setTimeout(async () => {
      setIsValidatingCoupon(true);
      try {
        const { ok, data } = await nativePost(`${BACKEND_URL}/api/validate-coupon`, { code, generatorType: "ai-resume" });
        if (cancelled) return;
        if (ok && data?.valid) {
          const discountAmount = RESUME_PRICE * data.discountPercent / 100;
          setAppliedDiscount({ code: data.code, discountPercent: data.discountPercent, discountedPrice: parseFloat((RESUME_PRICE - discountAmount).toFixed(2)) });
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
  const finalPrice = appliedDiscount ? appliedDiscount.discountedPrice : RESUME_PRICE;

  const renderCouponBlock = () => (
    <div>
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
  );

  // One-time purchase: open the in-app card checkout
  const handleStripeCheckout = () => {
    if (!generatedResume) { showToast("Generate your resume first", "warning"); return; }
    setPaymentOpen(true);
  };

  // Runs after the card payment succeeds — store the pending form data (same
  // keys the hosted-checkout flow used) and hand off to /payment-success,
  // which generates + downloads + emails and shows the success screen. The
  // webhook records the purchase from the payment-intent metadata.
  const handlePaymentSuccess = ({ email, paymentIntentId }) => {
    localStorage.setItem("pendingResumeData", JSON.stringify({ generatedResume, formData, selectedTemplate: formData.template }));
    localStorage.setItem("pendingCustomerEmail", email);
    navigate(`/payment-success?type=ai-resume&source=app&payment_intent=${encodeURIComponent(paymentIntentId)}`);
  };

  // ── Helper components ───────────────────────────────────────────────────
  const Field = ({ label, value, onChange, type = "text", placeholder = "" }) => (
    <IonInput value={value} onIonInput={e => onChange(e.detail.value)} type={type} placeholder={placeholder}
      fill="outline" labelPlacement="floating" label={label} style={inputStyle} />
  );

  // ── Step renderers ────────────────────────────────────────────────────

  const renderStep1 = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Upload an existing resume to auto-fill every step */}
      <div>
        <span style={labelStyle}>Have a resume already?</span>
        {uploadedResumeName && !isParsingResume ? (
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 8, background: "rgba(5,150,105,0.08)", border: "1px solid rgba(5,150,105,0.35)" }}>
            <IonIcon icon={documentTextOutline} style={{ fontSize: 18, color: "#059669", flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--ion-text-color)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{uploadedResumeName}</div>
              <div style={{ fontSize: "0.72rem", color: "var(--ion-color-medium)" }}>Parsed — your details were filled in below</div>
            </div>
            <IonButton fill="clear" size="small" onClick={() => resumeFileRef.current?.click()} style={{ flexShrink: 0 }}>Replace</IonButton>
          </div>
        ) : (
          <div onClick={() => !isParsingResume && resumeFileRef.current?.click()}
            style={{ padding: 14, borderRadius: 8, border: "2px dashed var(--ion-color-step-200)", textAlign: "center", cursor: isParsingResume ? "default" : "pointer", color: "var(--ion-color-medium)", fontSize: "0.82rem" }}>
            {isParsingResume ? (
              <><IonSpinner name="crescent" style={{ width: 18, height: 18, verticalAlign: "middle", marginRight: 8 }} />Parsing your resume…</>
            ) : (
              <><IonIcon icon={cloudUploadOutline} style={{ fontSize: 22, display: "block", margin: "0 auto 4px" }} />Upload your current resume (PDF or DOCX) to auto-fill</>
            )}
          </div>
        )}
        <input ref={resumeFileRef} type="file" style={{ display: "none" }}
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={handleResumeUpload} />
      </div>

      <div style={headingStyle}>Personal Information</div>
      <Field label="Full Name *" value={formData.personalInfo.fullName} onChange={v => setFormData(p => ({ ...p, personalInfo: { ...p.personalInfo, fullName: v } }))} />
      <Field label="Email" value={formData.personalInfo.email} onChange={v => setFormData(p => ({ ...p, personalInfo: { ...p.personalInfo, email: v } }))} type="email" />
      <Field label="Phone" value={formData.personalInfo.phone} onChange={v => setFormData(p => ({ ...p, personalInfo: { ...p.personalInfo, phone: v } }))} type="tel" />
      <Field label="Location (City, State)" value={formData.personalInfo.location} onChange={v => setFormData(p => ({ ...p, personalInfo: { ...p.personalInfo, location: v } }))} />
      <Field label="LinkedIn URL" value={formData.personalInfo.linkedin} onChange={v => setFormData(p => ({ ...p, personalInfo: { ...p.personalInfo, linkedin: v } }))} />
      <Field label="Portfolio / Website" value={formData.personalInfo.website} onChange={v => setFormData(p => ({ ...p, personalInfo: { ...p.personalInfo, website: v } }))} />
    </div>
  );

  const renderStep2 = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={headingStyle}>Work Experience</div>
      {formData.workExperience.map((exp, idx) => (
        <div key={exp.id} style={{ padding: 14, borderRadius: 8, border: "1px solid var(--ion-color-step-200)", display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontWeight: 600, fontSize: "0.85rem", color: "var(--ion-text-color)" }}>{exp.company || `Job ${idx + 1}`}</span>
            {formData.workExperience.length > 1 && (
              <IonButton fill="clear" size="small" color="danger" onClick={() => removeWork(exp.id)}>
                <IonIcon icon={trashOutline} slot="icon-only" style={{ fontSize: 16 }} />
              </IonButton>
            )}
          </div>
          <Field label="Job Title" value={exp.position} onChange={v => updateWork(exp.id, "position", v)} />
          <Field label="Company" value={exp.company} onChange={v => updateWork(exp.id, "company", v)} />
          <Field label="Location" value={exp.location} onChange={v => updateWork(exp.id, "location", v)} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <Field label="Start Date" type="month" value={exp.startDate} onChange={v => updateWork(exp.id, "startDate", v)} />
            {!exp.current && <Field label="End Date" type="month" value={exp.endDate} onChange={v => updateWork(exp.id, "endDate", v)} />}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <IonCheckbox checked={exp.current} onIonChange={e => updateWork(exp.id, "current", e.detail.checked)} />
            <span style={{ fontSize: "0.82rem", color: "var(--ion-text-color)" }}>Currently working here</span>
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={labelStyle}>Responsibilities / Bullets</span>
              <IonButton color="tertiary" size="small" onClick={() => generateAIBullets(exp.id)} disabled={isGeneratingBullets === exp.id}>
                {isGeneratingBullets === exp.id
                  ? <IonSpinner name="crescent" style={{ width: 14, height: 14 }} />
                  : <><IonIcon icon={sparklesOutline} slot="start" style={{ fontSize: 12 }} />AI Generate</>}
              </IonButton>
            </div>
            {exp.responsibilities.map((r, rIdx) => (
              <div key={rIdx} style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                <IonInput value={r} onIonInput={e => updateBullet(exp.id, rIdx, e.detail.value)} fill="outline" labelPlacement="floating" label={`Bullet ${rIdx + 1}`} style={{ ...inputStyle, flex: 1 }} />
                {exp.responsibilities.length > 1 && (
                  <IonButton fill="clear" size="small" color="medium" onClick={() => removeBullet(exp.id, rIdx)}>
                    <IonIcon icon={trashOutline} slot="icon-only" style={{ fontSize: 15 }} />
                  </IonButton>
                )}
              </div>
            ))}
            <IonButton color="light" size="small" onClick={() => addBullet(exp.id)}>
              <IonIcon icon={addOutline} slot="start" />Add Bullet
            </IonButton>
          </div>
        </div>
      ))}
      <IonButton color="light" expand="block" onClick={addWork}>
        <IonIcon icon={addOutline} slot="start" />Add Job
      </IonButton>
    </div>
  );

  const renderStep3 = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={headingStyle}>Education</div>
      {formData.education.map((edu, idx) => (
        <div key={edu.id} style={{ padding: 14, borderRadius: 8, border: "1px solid var(--ion-color-step-200)", display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontWeight: 600, fontSize: "0.85rem", color: "var(--ion-text-color)" }}>{edu.institution || `School ${idx + 1}`}</span>
            {formData.education.length > 1 && (
              <IonButton fill="clear" size="small" color="danger" onClick={() => removeEdu(edu.id)}>
                <IonIcon icon={trashOutline} slot="icon-only" style={{ fontSize: 16 }} />
              </IonButton>
            )}
          </div>
          <Field label="Institution" value={edu.institution} onChange={v => updateEdu(edu.id, "institution", v)} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <Field label="Degree" value={edu.degree} onChange={v => updateEdu(edu.id, "degree", v)} placeholder="B.S., M.A." />
            <Field label="Field of Study" value={edu.field} onChange={v => updateEdu(edu.id, "field", v)} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <Field label="Graduation Date" type="month" value={edu.graduationDate} onChange={v => updateEdu(edu.id, "graduationDate", v)} />
            <Field label="GPA (Optional)" value={edu.gpa} onChange={v => updateEdu(edu.id, "gpa", v)} placeholder="3.8" />
          </div>
        </div>
      ))}
      <IonButton color="light" expand="block" onClick={addEdu}>
        <IonIcon icon={addOutline} slot="start" />Add Education
      </IonButton>
    </div>
  );

  const renderStep4 = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={headingStyle}>Skills</div>
      <p style={{ fontSize: "0.82rem", color: "var(--ion-color-medium)", margin: 0 }}>Add technical skills, tools, languages, and certifications.</p>
      {formData.skills.map((skill, idx) => (
        <div key={idx} style={{ display: "flex", gap: 6 }}>
          <IonInput value={skill} onIonInput={e => updateSkill(idx, e.detail.value)} fill="outline" labelPlacement="floating" label={`Skill ${idx + 1}`} style={{ ...inputStyle, flex: 1 }} />
          {formData.skills.length > 1 && (
            <IonButton fill="clear" size="small" color="medium" onClick={() => removeSkill(idx)}>
              <IonIcon icon={trashOutline} slot="icon-only" style={{ fontSize: 15 }} />
            </IonButton>
          )}
        </div>
      ))}
      <IonButton color="light" expand="block" onClick={addSkill}>
        <IonIcon icon={addOutline} slot="start" />Add Skill
      </IonButton>
    </div>
  );

  const renderStep5 = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={headingStyle}>Target Job</div>
      <Field label="Target Job Title" value={formData.targetJobTitle} onChange={v => setField("targetJobTitle", v)} placeholder="e.g. Senior Software Engineer" />
      <div style={{ display: "flex", gap: 8 }}>
        <IonInput value={formData.jobUrl} onIonInput={e => setField("jobUrl", e.detail.value)}
          fill="outline" labelPlacement="floating" label="Job Posting URL (Optional)" style={{ ...inputStyle, flex: 1 }} />
        <IonButton color="tertiary" onClick={scrapeJobUrl} disabled={isScrapingJob} style={{ flexShrink: 0 }}>
          {isScrapingJob ? <IonSpinner name="crescent" style={{ width: 18, height: 18 }} /> : "Extract"}
        </IonButton>
      </div>
      <IonTextarea value={formData.jobDescription} onIonInput={e => setField("jobDescription", e.detail.value)}
        rows={10} fill="outline" labelPlacement="floating" label="Job Description *"
        placeholder="Paste the full job description — the AI tailors your resume to it" style={inputStyle} />
    </div>
  );

  const renderStep6 = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={headingStyle}>Style &amp; Generate</div>
      <div>
        <span style={labelStyle}>Template</span>
        <IonSegment mode="ios" style={{ width: "100%" }} value={formData.template}
          onIonChange={e => setField("template", e.detail.value)}>
          {templateOptions.map(t => (
            <IonSegmentButton key={t.value} value={t.value}>
              <IonLabel style={{ fontSize: "0.78rem", fontWeight: 600, whiteSpace: "nowrap" }}>{t.label}</IonLabel>
            </IonSegmentButton>
          ))}
        </IonSegment>
      </div>
      <IonSelect value={formData.font} onIonChange={e => setField("font", e.detail.value)}
        fill="outline" labelPlacement="floating" label="Font" style={inputStyle}>
        {FONTS.map(f => <IonSelectOption key={f.value} value={f.value}>{f.label}</IonSelectOption>)}
      </IonSelect>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <IonCheckbox checked={formData.onePage} onIonChange={e => setField("onePage", e.detail.checked)} />
        <span style={{ fontSize: "0.88rem", color: "var(--ion-text-color)" }}>Fit to one page</span>
      </div>
      <IonButton expand="block" color="tertiary" onClick={generateResume} disabled={isGenerating}>
        {isGenerating
          ? <><IonSpinner name="crescent" slot="start" />Generating with AI...</>
          : <><IonIcon icon={sparklesOutline} slot="start" />Generate Resume</>}
      </IonButton>
      {generatedResume && (
        <>
          <div style={{ padding: 14, borderRadius: 8, background: "var(--ion-color-success)", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--ion-color-success-contrast)", flexShrink: 0 }} />
            <span style={{ fontSize: "0.85rem", color: "var(--ion-color-success-contrast)", fontWeight: 500, flex: 1 }}>
              {(() => {
                const ts = generatedResume.generatedAt;
                if (!ts) return "Resume generated — ready to download";
                const d = new Date(ts);
                const sameDay = d.toDateString() === new Date().toDateString();
                const when = sameDay
                  ? d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
                  : d.toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
                return `Resume generated at ${when} — ready to download`;
              })()}
            </span>
            <IonButton fill="clear" size="small" onClick={generateResume} style={{ "--color": "var(--ion-color-success-contrast)", flexShrink: 0 }}>
              <IonIcon icon={refreshOutline} slot="icon-only" style={{ fontSize: 16 }} />
            </IonButton>
          </div>
          <IonButton expand="block" color="light" onClick={() => setShowPreview(true)} disabled={isGeneratingPreview}>
            {isGeneratingPreview ? <IonSpinner name="crescent" slot="start" style={{ width: 16, height: 16 }} /> : <IonIcon icon={eyeOutline} slot="start" />}
            Preview
          </IonButton>
          {hasActiveSubscription ? (
            <IonButton expand="block" onClick={handleSubscriptionDownload} disabled={isProcessing}
              style={{ "--background": "#059669", "--background-activated": "#047857" }}>
              {isProcessing ? <IonSpinner name="crescent" style={{ color: "#fff" }} /> : <><IonIcon icon={cloudDownloadOutline} slot="start" />Download (Subscription)</>}
            </IonButton>
          ) : (
            <>
              {renderCouponBlock()}
              <IonButton expand="block" onClick={handleStripeCheckout} disabled={isProcessing}
                style={{ "--background": "#059669", "--background-activated": "#047857" }}>
                {isProcessing ? <IonSpinner name="crescent" style={{ color: "#fff" }} /> : <><IonIcon icon={cloudDownloadOutline} slot="start" />Buy &amp; Download — ${finalPrice.toFixed(2)}</>}
              </IonButton>
            </>
          )}
        </>
      )}
    </div>
  );

  const stepContent = [renderStep1, renderStep2, renderStep3, renderStep4, renderStep5, renderStep6];

  if (!isOpen) return null;
  const isMobile = window.innerWidth < 768;

  return createPortal(
    <div className="modal-backdrop" style={{ position: "fixed", inset: 0, zIndex: 10000, background: isMobile ? "var(--ion-background-color, #f2f2f7)" : "rgba(0,0,0,0.5)", display: "flex", alignItems: isMobile ? "stretch" : "center", justifyContent: isMobile ? "stretch" : "center" }}>
      <div className="modal-slide-up" style={{ background: "var(--ion-background-color, #f2f2f7)", color: "var(--ion-text-color)", display: "flex", flexDirection: "column", width: "100%", maxWidth: isMobile ? "100%" : 640, height: isMobile ? "100%" : "auto", maxHeight: isMobile ? "100%" : "92vh", overflow: "hidden" }}>

        <IonHeader>
          <IonToolbar style={{ "--background": "var(--ion-card-background)", "--color": "var(--ion-text-color)" }}>
            <IonButtons slot="start">
              <IonButton fill="clear" shape="round" onClick={onClose}>
                <span slot="icon-only" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", lineHeight: 0, flexShrink: 0, fontSize: "1rem", color: "var(--ion-text-color)" }}>
                  <IonIcon icon={closeOutline} style={{ fontSize: "inherit", color: "inherit", pointerEvents: "none" }} />
                </span>
              </IonButton>
            </IonButtons>
            <IonTitle style={{ fontWeight: 700 }}>AI Resume Builder</IonTitle>
          </IonToolbar>
        </IonHeader>

        {/* Step tabs */}
        <div style={{ background: "var(--ion-card-background)", flexShrink: 0, borderBottom: "1px solid var(--app-divider)" }}>
          <IonSegment scrollable value={String(currentStep)} onIonChange={e => setCurrentStep(Number(e.detail.value))}
            style={{ "--background": "transparent" }}>
            {STEPS.map(step => (
              <IonSegmentButton key={step.id} value={String(step.id)} layout="icon-top"
                style={{ "--color": "var(--ion-color-medium)", "--color-checked": "var(--ion-color-primary)", "--indicator-color": "var(--ion-color-primary)", "--padding-top": "8px", "--padding-bottom": "8px", minWidth: 72, flexShrink: 0 }}>
                <IonIcon icon={step.icon} style={{ fontSize: 17 }} />
                <IonLabel style={{ fontSize: "0.62rem", fontWeight: 600 }}>{step.label}</IonLabel>
              </IonSegmentButton>
            ))}
          </IonSegment>
        </div>

        {/* Step content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 24px" }}>
          <div style={cardStyle}>
            {stepContent[currentStep - 1]()}
          </div>

          {/* Prev / Next */}
          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            {currentStep > 1 && (
              <IonButton color="light" onClick={() => setCurrentStep(s => s - 1)} style={{ flex: 1 }}>
                <IonIcon icon={chevronBackOutline} slot="start" />Back
              </IonButton>
            )}
            {currentStep < 6 && (
              <IonButton color="primary" onClick={() => setCurrentStep(s => s + 1)} style={{ flex: 1 }}>
                Next<IonIcon icon={chevronForwardOutline} slot="end" />
              </IonButton>
            )}
          </div>
        </div>
      </div>

      {/* Preview modal — same layout as the paystub preview: full-screen on
          mobile, centered panel on desktop, download CTA at the bottom */}
      {showPreview && (
        <div className="modal-backdrop" style={{ position: "fixed", inset: 0, zIndex: 10002, background: isMobile ? "var(--ion-background-color, #f2f2f7)" : "rgba(0,0,0,0.5)", display: "flex", alignItems: isMobile ? "stretch" : "center", justifyContent: isMobile ? "stretch" : "center" }}>
          <div className="modal-slide-up" style={{ background: "var(--ion-background-color, #f2f2f7)", color: "var(--ion-text-color)", display: "flex", flexDirection: "column", width: "100%", maxWidth: isMobile ? "100%" : 600, height: isMobile ? "100%" : "auto", maxHeight: isMobile ? "100%" : "90vh", overflow: "hidden" }}>
            <IonHeader>
              <IonToolbar style={{ "--background": "var(--ion-card-background)", "--color": "var(--ion-text-color)" }}>
                <IonButtons slot="start">
                  <IonButton fill="clear" shape="round" onClick={() => setShowPreview(false)}>
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
              ) : pdfPreview ? (
                <div style={{ borderRadius: 8, overflow: "hidden", border: "1px solid var(--ion-color-light-shade)", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
                  <img src={pdfPreview} alt="Resume preview" style={{ width: "100%", display: "block" }} />
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 320, background: "var(--ion-color-step-100)", borderRadius: 8, border: "2px dashed var(--ion-color-light-shade)" }}>
                  <IonIcon icon={eyeOutline} style={{ fontSize: "2.5rem", color: "var(--ion-color-medium)", marginBottom: 8 }} />
                  <p style={{ fontSize: "0.8rem", color: "var(--ion-color-medium)", textAlign: "center", margin: 0 }}>No preview available yet</p>
                </div>
              )}
              {hasActiveSubscription ? (
                <IonButton expand="block" onClick={handleSubscriptionDownload} disabled={isProcessing}
                  style={{ marginTop: 20, "--background": "#059669", "--background-activated": "#047857" }}>
                  {isProcessing ? <IonSpinner name="crescent" style={{ color: "#fff" }} /> : <><IonIcon icon={cloudDownloadOutline} slot="start" />Download (Subscription)</>}
                </IonButton>
              ) : (
                <>
                  <div style={{ marginTop: 20 }}>{renderCouponBlock()}</div>
                  <IonButton expand="block" onClick={handleStripeCheckout} disabled={isProcessing}
                    style={{ marginTop: 12, "--background": "#059669", "--background-activated": "#047857" }}>
                    {isProcessing ? <IonSpinner name="crescent" style={{ color: "#fff" }} /> : <><IonIcon icon={cloudDownloadOutline} slot="start" />Buy &amp; Download — ${finalPrice.toFixed(2)}</>}
                  </IonButton>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {paymentOpen && (
        <PaymentModal
          docLabel="AI Resume"
          documentType="ai-resume"
          template={formData.template}
          basePrice={RESUME_PRICE}
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

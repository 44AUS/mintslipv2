import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  IonHeader, IonToolbar, IonTitle, IonButtons,
  IonInput, IonSelect, IonSelectOption,
  IonButton, IonIcon, IonSpinner, IonTextarea, IonToast,
  IonSegment, IonSegmentButton, IonLabel, IonCheckbox,
} from "@ionic/react";
import {
  cloudDownloadOutline, eyeOutline, trashOutline, addOutline,
  closeOutline, chevronBackOutline, chevronForwardOutline, sparklesOutline,
  refreshOutline, personOutline, briefcaseOutline, schoolOutline,
  bulbOutline, searchOutline,
} from "ionicons/icons";
import { generateAndDownloadResume } from "@/utils/resumeGenerator";
import { generateResumePreview } from "@/utils/resumePreviewGenerator";
import { isNative, nativePost, getStripeOrigin } from "@/utils/nativeHttp";

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
const inputStyle = {
  "--background": "var(--ion-color-step-50)",
  "--color": "var(--ion-text-color)",
  "--border-color": "var(--ion-color-step-200)",
  "--border-radius": "6px",
  "--padding-start": "10px",
  "--padding-end": "10px",
  fontSize: "0.9rem",
};

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

  const [currentStep, setCurrentStep]                       = useState(1);
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

  const showToast = (msg, color = "success") => { setToastMessage(msg); setToastColor(color); setToastOpen(true); };
  const setField = (f, v) => setFormData(p => ({ ...p, [f]: v }));

  useEffect(() => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(formData)); } catch {} }, [formData]);
  useEffect(() => { try { if (generatedResume) localStorage.setItem(GENERATED_KEY, JSON.stringify(generatedResume)); } catch {} }, [generatedResume]);
  useEffect(() => { checkSub(); }, []); // eslint-disable-line

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
      const url = await generateResumePreview({ ...resume, template: formData.template, font: formData.font, sectionLayout: formData.sectionLayout, onePage: formData.onePage, isPaid: true });
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
      setGeneratedResume(result);
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
      await generateAndDownloadResume({ ...generatedResume, template: formData.template, font: formData.font, sectionLayout: formData.sectionLayout, onePage: formData.onePage });
      if (data.downloadsRemaining !== undefined) {
        const u = { ...user, subscription: { ...user.subscription, downloads_remaining: data.downloadsRemaining } };
        setUser(u); localStorage.setItem("userInfo", JSON.stringify(u));
        if (data.downloadsRemaining === 0) setHasActiveSubscription(false);
      }
      showToast("Resume downloaded!");
    } catch (err) { showToast(err.message || "Download failed. Please try again.", "danger"); }
    finally { setIsProcessing(false); }
  };

  const handleStripeCheckout = async () => {
    if (!generatedResume) { showToast("Generate your resume first", "warning"); return; }
    setIsProcessing(true);
    try {
      localStorage.setItem("pendingResumeData", JSON.stringify({ generatedResume, formData, selectedTemplate: formData.template }));
      const origin = getStripeOrigin(BACKEND_URL);
      const { ok, data } = await nativePost(`${BACKEND_URL}/api/stripe/create-one-time-checkout`, {
        amount: 9.99, documentType: "ai-resume", template: formData.template,
        successUrl: `${origin}/payment-success?type=ai-resume&source=app&session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl:  `${origin}/app/paystub`,
      });
      if (!ok || !data?.url) throw new Error(data?.detail || "Failed to create checkout session");
      window.location.href = data.url;
    } catch (err) { showToast(err.message || "Payment failed. Please try again.", "danger"); }
    finally { setIsProcessing(false); }
  };

  // ── Helper components ───────────────────────────────────────────────────
  const Field = ({ label, value, onChange, type = "text", placeholder = "" }) => (
    <div>
      {label && <span style={labelStyle}>{label}</span>}
      <IonInput value={value} onIonInput={e => onChange(e.detail.value)} type={type} placeholder={placeholder} fill="outline" style={inputStyle} />
    </div>
  );

  // ── Step renderers ────────────────────────────────────────────────────

  const renderStep1 = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
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
              <IonButton fill="clear" size="small" onClick={() => generateAIBullets(exp.id)} disabled={isGeneratingBullets === exp.id}
                style={{ "--color": "#7c3aed", fontSize: "0.72rem", height: 28 }}>
                {isGeneratingBullets === exp.id
                  ? <IonSpinner name="crescent" style={{ width: 14, height: 14 }} />
                  : <><IonIcon icon={sparklesOutline} slot="start" style={{ fontSize: 12 }} />AI Generate</>}
              </IonButton>
            </div>
            {exp.responsibilities.map((r, rIdx) => (
              <div key={rIdx} style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                <IonInput value={r} onIonInput={e => updateBullet(exp.id, rIdx, e.detail.value)} placeholder={`Bullet ${rIdx + 1}`} fill="outline" style={{ ...inputStyle, flex: 1 }} />
                {exp.responsibilities.length > 1 && (
                  <IonButton fill="clear" size="small" color="medium" onClick={() => removeBullet(exp.id, rIdx)}>
                    <IonIcon icon={trashOutline} slot="icon-only" style={{ fontSize: 15 }} />
                  </IonButton>
                )}
              </div>
            ))}
            <IonButton fill="outline" size="small" onClick={() => addBullet(exp.id)}
              style={{ "--color": "var(--ion-text-color)", "--border-color": "var(--ion-color-step-300)" }}>
              <IonIcon icon={addOutline} slot="start" />Add Bullet
            </IonButton>
          </div>
        </div>
      ))}
      <IonButton fill="outline" expand="block" onClick={addWork}
        style={{ "--color": "var(--ion-text-color)", "--border-color": "var(--ion-color-step-300)" }}>
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
      <IonButton fill="outline" expand="block" onClick={addEdu}
        style={{ "--color": "var(--ion-text-color)", "--border-color": "var(--ion-color-step-300)" }}>
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
          <IonInput value={skill} onIonInput={e => updateSkill(idx, e.detail.value)} placeholder={`Skill ${idx + 1}`} fill="outline" style={{ ...inputStyle, flex: 1 }} />
          {formData.skills.length > 1 && (
            <IonButton fill="clear" size="small" color="medium" onClick={() => removeSkill(idx)}>
              <IonIcon icon={trashOutline} slot="icon-only" style={{ fontSize: 15 }} />
            </IonButton>
          )}
        </div>
      ))}
      <IonButton fill="outline" expand="block" onClick={addSkill}
        style={{ "--color": "var(--ion-text-color)", "--border-color": "var(--ion-color-step-300)" }}>
        <IonIcon icon={addOutline} slot="start" />Add Skill
      </IonButton>
    </div>
  );

  const renderStep5 = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={headingStyle}>Target Job</div>
      <Field label="Target Job Title" value={formData.targetJobTitle} onChange={v => setField("targetJobTitle", v)} placeholder="e.g. Senior Software Engineer" />
      <div>
        <span style={labelStyle}>Job Posting URL (Optional — auto-extracts description)</span>
        <div style={{ display: "flex", gap: 8 }}>
          <IonInput value={formData.jobUrl} onIonInput={e => setField("jobUrl", e.detail.value)}
            placeholder="Paste job URL..." fill="outline" style={{ ...inputStyle, flex: 1 }} />
          <IonButton onClick={scrapeJobUrl} disabled={isScrapingJob}
            style={{ "--background": "#7c3aed", "--background-activated": "#6d28d9", flexShrink: 0 }}>
            {isScrapingJob ? <IonSpinner name="crescent" style={{ color: "#fff", width: 18, height: 18 }} /> : "Extract"}
          </IonButton>
        </div>
      </div>
      <div>
        <span style={labelStyle}>Job Description * (the AI tailors your resume to this)</span>
        <IonTextarea value={formData.jobDescription} onIonInput={e => setField("jobDescription", e.detail.value)}
          rows={10} placeholder="Paste the full job description here..." fill="outline"
          style={{ "--background": "var(--ion-color-step-50)", "--color": "var(--ion-text-color)", "--border-color": "var(--ion-color-step-200)", fontSize: "0.88rem" }} />
      </div>
    </div>
  );

  const renderStep6 = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={headingStyle}>Style &amp; Generate</div>
      <div>
        <span style={labelStyle}>Template</span>
        <div style={{ display: "flex", gap: 8 }}>
          {TEMPLATES.map(t => (
            <button key={t.value} onClick={() => setField("template", t.value)}
              style={{ flex: 1, padding: "10px 6px", borderRadius: 8, border: `2px solid ${formData.template === t.value ? t.color : "var(--ion-color-step-200)"}`, background: formData.template === t.value ? `${t.color}15` : "transparent", cursor: "pointer", textAlign: "center" }}>
              <div style={{ fontSize: "0.78rem", fontWeight: 700, color: formData.template === t.value ? t.color : "var(--ion-text-color)" }}>{t.label}</div>
              <div style={{ fontSize: "0.62rem", color: "var(--ion-color-medium)", marginTop: 2 }}>{t.desc}</div>
            </button>
          ))}
        </div>
      </div>
      <div>
        <span style={labelStyle}>Font</span>
        <IonSelect value={formData.font} onIonChange={e => setField("font", e.detail.value)} fill="outline" style={inputStyle}>
          {FONTS.map(f => <IonSelectOption key={f.value} value={f.value}>{f.label}</IonSelectOption>)}
        </IonSelect>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <IonCheckbox checked={formData.onePage} onIonChange={e => setField("onePage", e.detail.checked)} />
        <span style={{ fontSize: "0.88rem", color: "var(--ion-text-color)" }}>Fit to one page</span>
      </div>
      <IonButton expand="block" onClick={generateResume} disabled={isGenerating}
        style={{ "--background": "#7c3aed", "--background-activated": "#6d28d9" }}>
        {isGenerating
          ? <><IonSpinner name="crescent" slot="start" style={{ color: "#fff" }} />Generating with AI...</>
          : <><IonIcon icon={sparklesOutline} slot="start" />Generate Resume</>}
      </IonButton>
      {generatedResume && (
        <>
          <div style={{ padding: 14, borderRadius: 8, background: "rgba(22,163,74,0.08)", border: "1px solid rgba(22,163,74,0.3)", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#16a34a", flexShrink: 0 }} />
            <span style={{ fontSize: "0.85rem", color: "var(--ion-text-color)", fontWeight: 500, flex: 1 }}>Resume generated — ready to download</span>
            <IonButton fill="clear" size="small" onClick={generateResume} style={{ "--color": "var(--ion-color-medium)", flexShrink: 0 }}>
              <IonIcon icon={refreshOutline} slot="icon-only" style={{ fontSize: 16 }} />
            </IonButton>
          </div>
          <IonButton fill="outline" size="small" onClick={() => setShowPreview(v => !v)} disabled={isGeneratingPreview}
            style={{ "--color": "var(--ion-text-color)", "--border-color": "var(--ion-color-step-300)", alignSelf: "flex-start" }}>
            {isGeneratingPreview ? <IonSpinner name="crescent" slot="start" style={{ width: 16, height: 16 }} /> : <IonIcon icon={eyeOutline} slot="start" />}
            {showPreview ? "Hide Preview" : "Show Preview"}
          </IonButton>
          {showPreview && pdfPreview && (
            <div style={{ borderRadius: 8, overflow: "hidden", border: "1px solid var(--ion-color-step-200)" }}>
              <iframe src={pdfPreview} style={{ width: "100%", height: 420, border: "none" }} title="Resume Preview" />
            </div>
          )}
          {hasActiveSubscription ? (
            <IonButton expand="block" onClick={handleSubscriptionDownload} disabled={isProcessing}
              style={{ "--background": "#16a34a", "--background-activated": "#15803d" }}>
              {isProcessing ? <IonSpinner name="crescent" style={{ color: "#fff" }} /> : <><IonIcon icon={cloudDownloadOutline} slot="start" />Download (Subscription)</>}
            </IonButton>
          ) : (
            <IonButton expand="block" onClick={handleStripeCheckout} disabled={isProcessing}
              style={{ "--background": "#16a34a", "--background-activated": "#15803d" }}>
              {isProcessing ? <IonSpinner name="crescent" style={{ color: "#fff" }} /> : <><IonIcon icon={cloudDownloadOutline} slot="start" />Buy &amp; Download — $9.99</>}
            </IonButton>
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
              <IonButton fill="outline" onClick={() => setCurrentStep(s => s - 1)}
                style={{ "--color": "var(--ion-text-color)", "--border-color": "var(--ion-color-step-300)", flex: 1 }}>
                <IonIcon icon={chevronBackOutline} slot="start" />Back
              </IonButton>
            )}
            {currentStep < 6 && (
              <IonButton expand="block" onClick={() => setCurrentStep(s => s + 1)}
                style={{ "--background": "#16a34a", "--background-activated": "#15803d", flex: 1 }}>
                Next<IonIcon icon={chevronForwardOutline} slot="end" />
              </IonButton>
            )}
          </div>
        </div>
      </div>

      <IonToast isOpen={toastOpen} onDidDismiss={() => setToastOpen(false)}
        message={toastMessage} duration={3500} position="top" color={toastColor} />
    </div>,
    document.querySelector("ion-app") || document.body
  );
}

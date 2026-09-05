import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/utils/toast";
import { createStripeCheckout } from "@/utils/stripePayment";
import CouponInput from "@/components/CouponInput";
import { generateAndDownloadCeaseAndDesist } from "@/utils/ceaseAndDesistGenerator";
import { generateCeaseAndDesistPreview } from "@/utils/ceaseAndDesistPreviewGenerator";
import { saveGuestDocument } from "@/utils/guestSave";
import { formatPhoneNumber, formatZipCode } from "@/utils/validation";
import { Upload, X, ShieldAlert, Palette, CreditCard, Lock, Loader2, PenTool, Type } from "lucide-react";
import SignaturePad from "@/components/SignaturePad";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { trackDocumentGenerated, trackPaymentInitiated } from "@/utils/analyticsTracker";
import useAuthEnabled from "@/hooks/useAuthEnabled";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";
const PRICE = 9.99;

const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "DC", "FL", "GA", "HI", "ID", "IL", "IN",
  "IA", "KS", "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH",
  "NJ", "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT",
  "VT", "VA", "WA", "WV", "WI", "WY"
];

const TEMPLATES = [
  { value: "professional", label: "Professional", description: "Formal legal letterhead style" },
  { value: "modern", label: "Modern", description: "Clean design with a colored header bar" },
  { value: "custom", label: "Custom", description: "Choose your own brand colors" },
];

const VIOLATION_TYPES = [
  { value: "harassment", label: "Harassment / Stalking", blurb: "Stop unwanted contact, following, or intimidation." },
  { value: "defamation", label: "Defamation / Slander / Libel", blurb: "Demand retraction of false, damaging statements." },
  { value: "ip-infringement", label: "Copyright / Trademark Infringement", blurb: "Stop unauthorized use of your protected work." },
  { value: "debt-collection", label: "Debt Collection (FDCPA)", blurb: "Require a collector to stop contacting you." },
  { value: "breach-of-contract", label: "Breach of Contract", blurb: "Demand the other party cure a violation." },
  { value: "other", label: "Other Conduct", blurb: "Describe the conduct in your own words." },
];

const DELIVERY_METHODS = [
  { value: "certified-mail", label: "Certified Mail, Return Receipt Requested" },
  { value: "email", label: "Electronic Mail" },
  { value: "both", label: "Certified Mail and Email" },
  { value: "hand-delivery", label: "Hand Delivery" },
];

export default function CeaseAndDesistForm() {
  const navigate = useNavigate();
  const authEnabled = useAuthEnabled();
  const sigInputRef = useRef(null);
  const logoInputRef = useRef(null);

  const [user, setUser] = useState(null);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [pdfPreview, setPdfPreview] = useState(null);
  const [appliedDiscount, setAppliedDiscount] = useState(null);
  const [signatureMode, setSignatureMode] = useState("draw"); // draw | type | upload

  const [formData, setFormData] = useState({
    template: "professional",
    primaryColor: "#1a1a1a",
    accentColor: "#b71c1c",

    // Sender
    senderName: "",
    senderTitle: "",
    senderAddress: "",
    senderCity: "",
    senderState: "",
    senderZip: "",
    senderPhone: "",
    senderEmail: "",
    senderLogo: null,

    // Recipient
    recipientName: "",
    recipientCompany: "",
    recipientAddress: "",
    recipientCity: "",
    recipientState: "",
    recipientZip: "",

    // Letter
    letterDate: new Date().toISOString().slice(0, 10),
    subject: "",
    violationType: "harassment",
    description: "",
    incidentDate: "",
    incidentLocation: "",
    additionalDetails: "",
    complianceDays: "10",
    legalAction: "",
    deliveryMethod: "certified-mail",

    // Signature
    signatureName: "",
    signatureImage: null,
  });

  // Load user / subscription
  useEffect(() => {
    const token = localStorage.getItem("userToken");
    const info = localStorage.getItem("userInfo");
    if (token && info) {
      try {
        const parsed = JSON.parse(info);
        setUser(parsed);
        const sub = parsed.subscription;
        const remaining = sub?.downloads_remaining;
        setHasActiveSubscription(
          !!sub && (sub.status === "active" || sub.status === "cancelling") && (remaining === -1 || remaining > 0)
        );
      } catch (_) {}
    }
  }, []);

  const update = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  // Switching signature mode clears the other mode's value, since the PDF
  // prefers an image over the typed name.
  const changeSignatureMode = (mode) => {
    setSignatureMode(mode);
    setFormData(prev => ({ ...prev, signatureImage: null }));
    if (sigInputRef.current) sigInputRef.current.value = "";
  };

  // Debounced live preview
  useEffect(() => {
    if (isProcessing) return;
    const timer = setTimeout(async () => {
      if (formData.senderName && formData.recipientName && formData.description) {
        setIsGeneratingPreview(true);
        try {
          const url = await generateCeaseAndDesistPreview(formData);
          setPdfPreview(url);
        } catch (err) {
          console.error("Preview generation failed:", err);
        }
        setIsGeneratingPreview(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [formData, isProcessing]);

  const handleImageUpload = (field, file) => {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be under 2MB");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => update(field, reader.result);
    reader.readAsDataURL(file);
  };

  const validate = () => {
    if (!formData.senderName.trim())    { toast.error("Please enter your full name"); return false; }
    if (!formData.recipientName.trim()) { toast.error("Please enter the recipient's name"); return false; }
    if (!formData.description.trim())   { toast.error("Please describe the conduct you want stopped"); return false; }
    return true;
  };

  // ── Subscription download ────────────────────────────────────────────────
  const handleSubscriptionDownload = async () => {
    if (!validate()) return;
    const token = localStorage.getItem("userToken");
    if (!token) { toast.error("Please log in"); return; }

    setIsProcessing(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/user/subscription-download`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ documentType: "cease-and-desist", template: formData.template }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to process subscription download");

      const pdfBlob = await generateAndDownloadCeaseAndDesist(formData, true);

      // Save to the user's account
      if (pdfBlob instanceof Blob) {
        const reader = new FileReader();
        reader.onloadend = async () => {
          try {
            await fetch(`${BACKEND_URL}/api/user/saved-documents`, {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
              body: JSON.stringify({
                documentType: "cease-and-desist",
                fileName: `Cease_and_Desist_${formData.recipientName.replace(/\s+/g, "_")}.pdf`,
                fileData: reader.result.split(",")[1],
                template: formData.template,
              }),
            });
          } catch (e) { console.error("Failed to save document:", e); }
        };
        reader.readAsDataURL(pdfBlob);
      }

      if (data.downloadsRemaining !== undefined) {
        const updated = { ...user };
        if (updated.subscription) updated.subscription.downloads_remaining = data.downloadsRemaining;
        setUser(updated);
        localStorage.setItem("userInfo", JSON.stringify(updated));
        if (data.downloadsRemaining === 0) setHasActiveSubscription(false);
      }

      trackDocumentGenerated("cease_and_desist", formData.template, 0, "subscription");
      toast.success("Cease and desist letter downloaded!");
    } catch (err) {
      toast.error(err.message || "Download failed");
    } finally {
      setIsProcessing(false);
    }
  };

  // ── Stripe checkout ──────────────────────────────────────────────────────
  const handleStripeCheckout = async () => {
    if (!validate()) return;
    setIsProcessing(true);
    try {
      localStorage.setItem("pendingCeaseAndDesistData", JSON.stringify(formData));
      localStorage.setItem("pendingCeaseAndDesistTemplate", formData.template);

      trackPaymentInitiated("cease_and_desist", appliedDiscount ? appliedDiscount.discountedPrice : PRICE);

      const { url } = await createStripeCheckout({
        amount: PRICE,
        documentType: "cease-and-desist",
        template: formData.template,
        appliedDiscount,
        successPath: "/payment-success",
        cancelPath: "/cease-and-desist-generator",
      });
      window.location.href = url;
    } catch (err) {
      toast.error(err.message || "Payment failed. Please try again.");
      setIsProcessing(false);
    }
  };

  const selectedViolation = VIOLATION_TYPES.find(v => v.value === formData.violationType);

  return (
    <div className="min-h-screen bg-slate-50">
      <Helmet>
        <title>Cease and Desist Letter Generator | Create a Legal Demand Letter | MintSlip</title>
        <meta name="description" content="Create a professional cease and desist letter in minutes. Stop harassment, defamation, copyright infringement, or debt collector calls. Instant PDF download for $9.99." />
        <link rel="canonical" href="https://mintslip.com/cease-and-desist-generator" />
      </Helmet>

      <Header />

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: "Outfit, sans-serif", color: "#1a4731" }}>
            Cease and Desist Letter Generator
          </h1>
          <p className="text-slate-600">
            Create a formal demand letter to stop harassment, defamation, infringement, or unwanted contact.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* ── LEFT: FORM ── */}
          <div className="lg:col-span-7">
            <form className="space-y-8 bg-white p-8 rounded-lg shadow-sm border border-slate-200" onSubmit={e => e.preventDefault()}>

              {/* Template */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold" style={{ fontFamily: "Outfit, sans-serif", color: "#1a4731" }}>
                  Template Style
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {TEMPLATES.map(t => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => update("template", t.value)}
                      className={`text-left p-4 rounded-lg border-2 transition-colors ${
                        formData.template === t.value
                          ? "border-green-600 bg-green-50"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="font-semibold text-slate-900">{t.label}</div>
                      <div className="text-xs text-slate-500 mt-1">{t.description}</div>
                    </button>
                  ))}
                </div>

                {formData.template === "custom" && (
                  <div className="grid grid-cols-2 gap-4 mt-4 p-4 bg-slate-50 rounded-lg">
                    <div>
                      <Label className="flex items-center gap-2"><Palette className="w-4 h-4" /> Primary Color</Label>
                      <Input type="color" value={formData.primaryColor} onChange={e => update("primaryColor", e.target.value)} className="h-10 mt-1" />
                    </div>
                    <div>
                      <Label className="flex items-center gap-2"><Palette className="w-4 h-4" /> Accent Color</Label>
                      <Input type="color" value={formData.accentColor} onChange={e => update("accentColor", e.target.value)} className="h-10 mt-1" />
                    </div>
                  </div>
                )}
              </div>

              {/* Your info */}
              <div className="space-y-4 pt-6 border-t border-slate-200">
                <h2 className="text-2xl font-bold" style={{ fontFamily: "Outfit, sans-serif", color: "#1a4731" }}>
                  Your Information (Sender)
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Full Name *</Label>
                    <Input value={formData.senderName} onChange={e => update("senderName", e.target.value)} placeholder="Jane Doe" />
                  </div>
                  <div>
                    <Label>Title / Company (optional)</Label>
                    <Input value={formData.senderTitle} onChange={e => update("senderTitle", e.target.value)} placeholder="Owner, Acme LLC" />
                  </div>
                </div>
                <div>
                  <Label>Street Address</Label>
                  <Input value={formData.senderAddress} onChange={e => update("senderAddress", e.target.value)} placeholder="123 Main St" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>City</Label>
                    <Input value={formData.senderCity} onChange={e => update("senderCity", e.target.value)} placeholder="Austin" />
                  </div>
                  <div>
                    <Label>State</Label>
                    <Select value={formData.senderState} onValueChange={v => update("senderState", v)}>
                      <SelectTrigger><SelectValue placeholder="State" /></SelectTrigger>
                      <SelectContent className="max-h-60">
                        {US_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>ZIP</Label>
                    <Input value={formData.senderZip} onChange={e => update("senderZip", formatZipCode(e.target.value))} placeholder="78701" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Phone</Label>
                    <Input value={formData.senderPhone} onChange={e => update("senderPhone", formatPhoneNumber(e.target.value))} placeholder="(555) 123-4567" />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input type="email" value={formData.senderEmail} onChange={e => update("senderEmail", e.target.value)} placeholder="jane@example.com" />
                  </div>
                </div>

                {/* Logo */}
                <div>
                  <Label>Letterhead Logo (optional)</Label>
                  {formData.senderLogo ? (
                    <div className="flex items-center gap-3 mt-2">
                      <img src={formData.senderLogo} alt="Logo" className="h-12 w-auto border border-slate-200 rounded p-1 bg-white" />
                      <Button type="button" variant="outline" size="sm" onClick={() => { update("senderLogo", null); if (logoInputRef.current) logoInputRef.current.value = ""; }}>
                        <X className="w-4 h-4 mr-1" /> Remove
                      </Button>
                    </div>
                  ) : (
                    <div className="mt-2">
                      <input ref={logoInputRef} type="file" accept="image/png,image/jpeg" className="hidden" onChange={e => handleImageUpload("senderLogo", e.target.files?.[0])} />
                      <Button type="button" variant="outline" size="sm" onClick={() => logoInputRef.current?.click()}>
                        <Upload className="w-4 h-4 mr-1" /> Upload Logo
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Recipient */}
              <div className="space-y-4 pt-6 border-t border-slate-200">
                <h2 className="text-2xl font-bold" style={{ fontFamily: "Outfit, sans-serif", color: "#1a4731" }}>
                  Recipient Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Recipient Name *</Label>
                    <Input value={formData.recipientName} onChange={e => update("recipientName", e.target.value)} placeholder="John Smith" />
                  </div>
                  <div>
                    <Label>Company (optional)</Label>
                    <Input value={formData.recipientCompany} onChange={e => update("recipientCompany", e.target.value)} placeholder="ABC Collections Inc." />
                  </div>
                </div>
                <div>
                  <Label>Street Address</Label>
                  <Input value={formData.recipientAddress} onChange={e => update("recipientAddress", e.target.value)} placeholder="456 Oak Ave" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>City</Label>
                    <Input value={formData.recipientCity} onChange={e => update("recipientCity", e.target.value)} placeholder="Dallas" />
                  </div>
                  <div>
                    <Label>State</Label>
                    <Select value={formData.recipientState} onValueChange={v => update("recipientState", v)}>
                      <SelectTrigger><SelectValue placeholder="State" /></SelectTrigger>
                      <SelectContent className="max-h-60">
                        {US_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>ZIP</Label>
                    <Input value={formData.recipientZip} onChange={e => update("recipientZip", formatZipCode(e.target.value))} placeholder="75201" />
                  </div>
                </div>
              </div>

              {/* The demand */}
              <div className="space-y-4 pt-6 border-t border-slate-200">
                <h2 className="text-2xl font-bold" style={{ fontFamily: "Outfit, sans-serif", color: "#1a4731" }}>
                  Nature of the Demand
                </h2>

                <div>
                  <Label>Type of Violation *</Label>
                  <Select value={formData.violationType} onValueChange={v => update("violationType", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {VIOLATION_TYPES.map(v => <SelectItem key={v.value} value={v.value}>{v.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {selectedViolation && (
                    <p className="text-xs text-slate-500 mt-1">{selectedViolation.blurb}</p>
                  )}
                </div>

                <div>
                  <Label>Subject Line (optional)</Label>
                  <Input value={formData.subject} onChange={e => update("subject", e.target.value)} placeholder="Cease and Desist Demand — Unauthorized Use of Copyrighted Work" />
                  <p className="text-xs text-slate-500 mt-1">Leave blank to use "Cease and Desist Demand".</p>
                </div>

                <div>
                  <Label>Describe the Conduct *</Label>
                  <Textarea
                    rows={5}
                    value={formData.description}
                    onChange={e => update("description", e.target.value)}
                    placeholder="Describe specifically what the recipient did — dates, statements made, material used, or contact attempts."
                  />
                  <p className="text-xs text-slate-500 mt-1">Be factual and specific. This text is inserted into the letter body.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Date of Incident (optional)</Label>
                    <Input type="date" value={formData.incidentDate} onChange={e => update("incidentDate", e.target.value)} />
                  </div>
                  <div>
                    <Label>Location / Platform (optional)</Label>
                    <Input value={formData.incidentLocation} onChange={e => update("incidentLocation", e.target.value)} placeholder="Facebook, my workplace, etc." />
                  </div>
                </div>

                <div>
                  <Label>Additional Statement (optional)</Label>
                  <Textarea
                    rows={3}
                    value={formData.additionalDetails}
                    onChange={e => update("additionalDetails", e.target.value)}
                    placeholder="Any additional paragraph you want included in the letter."
                  />
                </div>
              </div>

              {/* Deadline & consequences */}
              <div className="space-y-4 pt-6 border-t border-slate-200">
                <h2 className="text-2xl font-bold" style={{ fontFamily: "Outfit, sans-serif", color: "#1a4731" }}>
                  Deadline &amp; Delivery
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Days to Comply</Label>
                    <Input type="number" min="1" max="90" value={formData.complianceDays} onChange={e => update("complianceDays", e.target.value)} />
                  </div>
                  <div>
                    <Label>Delivery Method</Label>
                    <Select value={formData.deliveryMethod} onValueChange={v => update("deliveryMethod", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {DELIVERY_METHODS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Consequences of Non-Compliance (optional)</Label>
                  <Textarea
                    rows={3}
                    value={formData.legalAction}
                    onChange={e => update("legalAction", e.target.value)}
                    placeholder="Leave blank to use standard language reserving all legal remedies."
                  />
                </div>
                <div>
                  <Label>Letter Date</Label>
                  <Input type="date" value={formData.letterDate} onChange={e => update("letterDate", e.target.value)} />
                </div>
              </div>

              {/* Signature */}
              <div className="space-y-4 pt-6 border-t border-slate-200">
                <h2 className="text-2xl font-bold" style={{ fontFamily: "Outfit, sans-serif", color: "#1a4731" }}>
                  Signature
                </h2>

                {/* Mode tabs */}
                <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
                  {[
                    { value: "draw",   label: "Draw",   icon: PenTool },
                    { value: "type",   label: "Type",   icon: Type },
                    { value: "upload", label: "Upload", icon: Upload },
                  ].map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => changeSignatureMode(value)}
                      className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                        signatureMode === value
                          ? "bg-white text-slate-900 shadow-sm"
                          : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      <Icon className="w-4 h-4" /> {label}
                    </button>
                  ))}
                </div>

                {/* Draw */}
                {signatureMode === "draw" && (
                  <SignaturePad onChange={dataUrl => update("signatureImage", dataUrl)} />
                )}

                {/* Type */}
                {signatureMode === "type" && (
                  <div>
                    <Label>Signature Name</Label>
                    <Input
                      value={formData.signatureName}
                      onChange={e => update("signatureName", e.target.value)}
                      placeholder={formData.senderName || "Jane Doe"}
                    />
                    <p className="text-xs text-slate-500 mt-1">Rendered in a handwriting font. Defaults to your name.</p>
                    {(formData.signatureName || formData.senderName) && (
                      <div className="mt-3 p-4 bg-white border border-slate-200 rounded-lg">
                        <p className="text-xs text-slate-400 mb-1">Preview</p>
                        <span style={{ fontFamily: "Yellowtail, cursive", fontSize: "2rem", color: "#1a1a1a" }}>
                          {formData.signatureName || formData.senderName}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Upload */}
                {signatureMode === "upload" && (
                  <div>
                    <Label>Upload a signature image</Label>
                    {formData.signatureImage ? (
                      <div className="flex items-center gap-3 mt-2">
                        <img src={formData.signatureImage} alt="Signature" className="h-12 w-auto border border-slate-200 rounded p-1 bg-white" />
                        <Button type="button" variant="outline" size="sm" onClick={() => { update("signatureImage", null); if (sigInputRef.current) sigInputRef.current.value = ""; }}>
                          <X className="w-4 h-4 mr-1" /> Remove
                        </Button>
                      </div>
                    ) : (
                      <div className="mt-2">
                        <input ref={sigInputRef} type="file" accept="image/png,image/jpeg" className="hidden" onChange={e => handleImageUpload("signatureImage", e.target.files?.[0])} />
                        <Button type="button" variant="outline" size="sm" onClick={() => sigInputRef.current?.click()}>
                          <Upload className="w-4 h-4 mr-1" /> Upload Signature
                        </Button>
                        <p className="text-xs text-slate-500 mt-2">PNG with a transparent background works best.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </form>

            {/* FAQ */}
            <div className="mt-8 bg-white p-8 rounded-lg shadow-sm border border-slate-200">
              <h2 className="text-2xl font-bold mb-4" style={{ fontFamily: "Outfit, sans-serif", color: "#1a4731" }}>
                Frequently Asked Questions
              </h2>
              <Accordion type="single" collapsible>
                <AccordionItem value="q1">
                  <AccordionTrigger>Is a cease and desist letter legally binding?</AccordionTrigger>
                  <AccordionContent>
                    A cease and desist letter is not a court order, so it does not itself compel anyone to act. It is a formal
                    written demand that puts the recipient on notice, creates a documented record of your objection, and is often
                    the required first step before filing a lawsuit. Many disputes are resolved at this stage without going to court.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="q2">
                  <AccordionTrigger>Do I need a lawyer to send one?</AccordionTrigger>
                  <AccordionContent>
                    No. Individuals and businesses regularly send cease and desist letters on their own behalf. A letter sent by an
                    attorney may carry more weight, but a clear, factual letter you send yourself still establishes notice and a
                    paper trail. For complex or high-value disputes, consult a licensed attorney in your state.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="q3">
                  <AccordionTrigger>How should I send the letter?</AccordionTrigger>
                  <AccordionContent>
                    Certified mail with return receipt requested is the standard method because it creates proof of delivery. Many
                    people send by both certified mail and email. Keep a copy of the signed letter and the delivery receipt.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="q4">
                  <AccordionTrigger>Can I use this to stop debt collector calls?</AccordionTrigger>
                  <AccordionContent>
                    Yes. Under the Fair Debt Collection Practices Act (15 U.S.C. § 1692c(c)), a collector must stop contacting you
                    once it receives a written request to cease communication. Select the "Debt Collection (FDCPA)" violation type
                    and the letter will cite that statute.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="q5">
                  <AccordionTrigger>What happens if the recipient ignores it?</AccordionTrigger>
                  <AccordionContent>
                    If the conduct continues past your stated deadline, your documented letter strengthens any later legal action.
                    Depending on the matter, next steps may include filing a civil suit, a DMCA takedown, a police report, or a
                    complaint with a regulator such as the CFPB.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>

          {/* ── RIGHT: PREVIEW + PAYMENT ── */}
          <div className="lg:col-span-5">
            <div className="sticky top-24 space-y-6">

              {/* Summary */}
              <div className="p-6 bg-green-50 border-2 border-green-200 rounded-md">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ fontFamily: "Outfit, sans-serif", color: "#1a4731" }}>
                  <ShieldAlert className="w-5 h-5" /> Letter Summary
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-700">Template:</span>
                    <span className="font-medium text-slate-900 capitalize">{formData.template}</span>
                  </div>
                  <div className="border-t border-green-300 my-2" />
                  <div className="flex justify-between">
                    <span className="text-slate-700">From:</span>
                    <span className="font-medium text-slate-900">{formData.senderName || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-700">To:</span>
                    <span className="font-medium text-slate-900">{formData.recipientName || "—"}</span>
                  </div>
                  <div className="border-t border-green-300 my-2" />
                  <div className="flex justify-between">
                    <span className="text-slate-700">Violation:</span>
                    <span className="font-medium text-slate-900 text-right">{selectedViolation?.label || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-700">Deadline:</span>
                    <span className="font-medium text-slate-900">{formData.complianceDays || "10"} days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-700">Delivery:</span>
                    <span className="font-medium text-slate-900 text-right">
                      {DELIVERY_METHODS.find(m => m.value === formData.deliveryMethod)?.label || "—"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div className="p-4 bg-white border-2 border-slate-200 rounded-md">
                <h3 className="text-lg font-bold mb-3" style={{ fontFamily: "Outfit, sans-serif", color: "#1a4731" }}>
                  Live Preview
                </h3>
                {isGeneratingPreview ? (
                  <div className="flex items-center justify-center h-64 text-slate-400 gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" /> Generating preview…
                  </div>
                ) : pdfPreview ? (
                  <img src={pdfPreview} alt="Cease and desist preview" className="w-full border border-slate-200 rounded" />
                ) : (
                  <div className="flex flex-col items-center justify-center h-64 text-slate-400 text-center px-4">
                    <ShieldAlert className="w-10 h-10 mb-2 opacity-40" />
                    <p className="text-sm">Fill in your name, the recipient's name, and a description to see a live preview.</p>
                  </div>
                )}
              </div>

              {/* Payment */}
              <div className="p-6 bg-slate-50 border-2 border-slate-200 rounded-md">
                <h3 className="text-lg font-bold mb-4" style={{ fontFamily: "Outfit, sans-serif", color: "#1a4731" }}>
                  {hasActiveSubscription ? "Download Document" : "Complete Payment"}
                </h3>

                {hasActiveSubscription ? (
                  <div className="space-y-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-green-700 mb-1 font-semibold">Subscription Active</div>
                      <p className="text-sm text-green-600">
                        Downloads remaining: {user?.subscription?.downloads_remaining === -1 ? "Unlimited" : user?.subscription?.downloads_remaining}
                      </p>
                    </div>
                    <Button onClick={handleSubscriptionDownload} disabled={isProcessing} className="w-full bg-green-600 hover:bg-green-700 text-white py-6 text-lg font-semibold">
                      {isProcessing ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Generating…</> : "Download Letter (Included in Plan)"}
                    </Button>
                  </div>
                ) : (
                  <>
                    <CouponInput
                      generatorType="cease-and-desist"
                      originalPrice={PRICE}
                      onDiscountApplied={setAppliedDiscount}
                    />
                    <p className="text-sm text-slate-600 mb-4">
                      Total: <strong>${appliedDiscount ? appliedDiscount.discountedPrice.toFixed(2) : PRICE.toFixed(2)}</strong>
                      {appliedDiscount && <span className="text-green-600 ml-1">({appliedDiscount.discountPercent}% off)</span>}
                      {!appliedDiscount && " for your cease and desist letter"}
                    </p>

                    <Button
                      onClick={handleStripeCheckout}
                      disabled={isProcessing}
                      className="w-full bg-green-600 hover:bg-green-700 text-white py-6 text-lg font-semibold rounded-xl gap-2"
                    >
                      {isProcessing
                        ? <><Loader2 className="w-5 h-5 animate-spin" />Processing…</>
                        : <><CreditCard className="w-5 h-5" />Pay ${appliedDiscount ? appliedDiscount.discountedPrice.toFixed(2) : PRICE.toFixed(2)}</>}
                    </Button>
                    <div className="flex items-center justify-center gap-2 text-xs text-slate-500 mt-2">
                      <Lock className="w-3 h-3" /><span>Secured by Stripe</span>
                    </div>

                    {authEnabled && (
                      <div className="mt-4 pt-4 border-t border-slate-200 text-center">
                        <p className="text-sm text-slate-500 mb-2">Save with a subscription plan</p>
                        <Button variant="outline" size="sm" onClick={() => navigate("/pricing")} className="text-green-600 border-green-600 hover:bg-green-50">
                          View Subscription Plans
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Legal disclaimer */}
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-md">
                <p className="text-xs text-amber-800 leading-relaxed">
                  <strong>Not legal advice.</strong> MintSlip provides a document template service, not legal representation.
                  This letter does not create an attorney–client relationship. For complex disputes, consult a licensed attorney
                  in your jurisdiction.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

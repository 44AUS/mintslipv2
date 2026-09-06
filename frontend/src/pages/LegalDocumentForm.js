import { useState, useEffect, useRef } from "react";
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
import { generateAndDownloadLegalDocument, generateLegalDocumentPreview } from "@/utils/legalDocumentGenerator";
import { formatPhoneNumber, formatZipCode } from "@/utils/validation";
import { Upload, X, Scale, CreditCard, Lock, Loader2, PenTool, Type, FileSignature } from "lucide-react";
import SignaturePad from "@/components/SignaturePad";
import { trackDocumentGenerated, trackPaymentInitiated } from "@/utils/analyticsTracker";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";
const PRICE = 9.99;

const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "DC", "FL", "GA", "HI", "ID", "IL", "IN",
  "IA", "KS", "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH",
  "NJ", "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT",
  "VT", "VA", "WA", "WV", "WI", "WY"
];

const emptyForm = {
  templateId: "",
  documentTitle: "",
  effectiveDate: new Date().toISOString().slice(0, 10),
  governingState: "",

  partyAName: "", partyATitle: "", partyAAddress: "",
  partyACity: "", partyAState: "", partyAZip: "",
  partyAEmail: "", partyAPhone: "",

  partyBName: "", partyBTitle: "", partyBAddress: "",
  partyBCity: "", partyBState: "", partyBZip: "",
  partyBEmail: "", partyBPhone: "",

  recitals: "", terms: "", additionalTerms: "",

  partyASignatureName: "", partyASignatureImage: null, partyASignDate: new Date().toISOString().slice(0, 10),
  partyBSignatureName: "", partyBSignatureImage: null, partyBSignDate: new Date().toISOString().slice(0, 10),
};

// One party's signature capture: draw / type / upload, mirroring the cease
// and desist generator's signature section.
function SignatureSection({ party, formData, update }) {
  const [mode, setMode] = useState("draw");
  const fileRef = useRef(null);
  const imgField = `party${party}SignatureImage`;
  const nameField = `party${party}SignatureName`;
  const dateField = `party${party}SignDate`;
  const fallbackName = formData[`party${party}Name`];

  const changeMode = (m) => {
    setMode(m);
    update(imgField, null);
  };

  const handleUpload = (file) => {
    if (!file) return;
    if (!file.type.includes("png") && !file.type.includes("jpeg")) {
      toast.error("Signature image must be PNG or JPG");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => update(imgField, reader.result);
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-4">
      <p className="font-semibold text-slate-800">Party {party} Signature</p>
      <div className="flex gap-2">
        {[["draw", PenTool, "Draw"], ["type", Type, "Type"], ["upload", Upload, "Upload"]].map(([value, Icon, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => changeMode(value)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border transition-colors ${
              mode === value ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
            }`}
          >
            <Icon className="w-3.5 h-3.5" /> {label}
          </button>
        ))}
      </div>

      {mode === "draw" && <SignaturePad onChange={(dataUrl) => update(imgField, dataUrl)} height={160} />}

      {mode === "type" && (
        <div className="space-y-2">
          <Label>Typed signature name</Label>
          <Input
            value={formData[nameField]}
            onChange={(e) => update(nameField, e.target.value)}
            placeholder={fallbackName || "Full legal name"}
          />
          {(formData[nameField] || fallbackName) && (
            <div className="border border-slate-200 rounded-md bg-white px-4 py-3">
              <span className="text-2xl italic" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
                {formData[nameField] || fallbackName}
              </span>
            </div>
          )}
        </div>
      )}

      {mode === "upload" && (
        <div className="space-y-2">
          <Label>Upload a signature image</Label>
          {formData[imgField] ? (
            <div className="flex items-center gap-3">
              <img src={formData[imgField]} alt="Signature" className="h-12 w-auto border border-slate-200 rounded p-1 bg-white" />
              <Button type="button" variant="outline" size="sm" onClick={() => { update(imgField, null); if (fileRef.current) fileRef.current.value = ""; }}>
                <X className="w-4 h-4 mr-1" /> Remove
              </Button>
            </div>
          ) : (
            <>
              <input ref={fileRef} type="file" accept="image/png,image/jpeg" className="hidden" onChange={(e) => handleUpload(e.target.files?.[0])} />
              <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                <Upload className="w-4 h-4 mr-1" /> Upload Signature
              </Button>
            </>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label>Sign date</Label>
          <Input type="date" value={formData[dateField]} onChange={(e) => update(dateField, e.target.value)} />
        </div>
      </div>
    </div>
  );
}

export default function LegalDocumentForm() {
  const [user, setUser] = useState(null);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [appliedDiscount, setAppliedDiscount] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [pdfPreview, setPdfPreview] = useState(null);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [formData, setFormData] = useState(emptyForm);

  const update = (field, value) => setFormData((prev) => ({ ...prev, [field]: value }));

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

  // Published legal-document templates from the admin doc template editor
  useEffect(() => {
    fetch(`${BACKEND_URL}/api/doc-templates?documentType=legal-document`)
      .then((r) => r.json())
      .then((d) => {
        const list = d.success ? d.templates || [] : [];
        setTemplates(list);
        if (list.length === 1) setFormData((prev) => ({ ...prev, templateId: prev.templateId || list[0].id }));
      })
      .catch(() => {})
      .finally(() => setTemplatesLoading(false));
  }, []);

  // Debounced live preview
  useEffect(() => {
    if (!formData.templateId) { setPdfPreview(null); return; }
    const timer = setTimeout(async () => {
      setIsGeneratingPreview(true);
      try {
        setPdfPreview(await generateLegalDocumentPreview(formData));
      } catch (err) {
        console.error("Legal document preview failed:", err);
      } finally {
        setIsGeneratingPreview(false);
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [formData]);

  const validate = () => {
    if (!formData.templateId)          { toast.error("Please choose a template"); return false; }
    if (!formData.documentTitle.trim()){ toast.error("Please enter the document title"); return false; }
    if (!formData.partyAName.trim())   { toast.error("Please enter Party A's name"); return false; }
    if (!formData.partyBName.trim())   { toast.error("Please enter Party B's name"); return false; }
    if (!formData.terms.trim())        { toast.error("Please enter the terms of the agreement"); return false; }
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
        body: JSON.stringify({ documentType: "legal-document", template: `custom:${formData.templateId}` }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to process subscription download");

      const pdfBlob = await generateAndDownloadLegalDocument(formData, true);

      if (pdfBlob instanceof Blob) {
        const reader = new FileReader();
        reader.onloadend = async () => {
          try {
            await fetch(`${BACKEND_URL}/api/user/saved-documents`, {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
              body: JSON.stringify({
                documentType: "legal-document",
                fileName: `${(formData.documentTitle || "Legal_Document").replace(/\s+/g, "_")}.pdf`,
                fileData: reader.result.split(",")[1],
                template: `custom:${formData.templateId}`,
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

      trackDocumentGenerated("legal_document", formData.templateId, 0, "subscription");
      toast.success("Legal document downloaded!");
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
      localStorage.setItem("pendingLegalDocumentData", JSON.stringify(formData));

      trackPaymentInitiated("legal_document", appliedDiscount ? appliedDiscount.discountedPrice : PRICE);

      const { url } = await createStripeCheckout({
        amount: PRICE,
        documentType: "legal-document",
        template: `custom:${formData.templateId}`,
        appliedDiscount,
        successPath: "/payment-success",
        cancelPath: "/legal-document-generator",
      });
      window.location.href = url;
    } catch (err) {
      toast.error(err.message || "Payment failed. Please try again.");
      setIsProcessing(false);
    }
  };

  const selectedTemplate = templates.find((t) => t.id === formData.templateId);

  return (
    <div className="min-h-screen bg-slate-50">
      <Helmet>
        <title>Legal Document Generator | Custom Agreements with E-Signatures | MintSlip</title>
        <meta name="description" content="Create professional legal documents — agreements, NDAs, contracts and more — with drawn or typed signatures for both parties. Instant PDF download for $9.99." />
        <link rel="canonical" href="https://mintslip.com/legal-document-generator" />
      </Helmet>

      <Header />

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: "Outfit, sans-serif", color: "#1a4731" }}>
            Legal Document Generator
          </h1>
          <p className="text-slate-600">
            Fill in both parties, your terms, and signatures — we generate a polished, signed PDF agreement.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* ── LEFT: FORM ── */}
          <div className="lg:col-span-7">
            <form className="space-y-8 bg-white p-8 rounded-lg shadow-sm border border-slate-200" onSubmit={(e) => e.preventDefault()}>

              {/* Template */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Scale className="w-5 h-5 text-green-700" />
                  <h2 className="text-lg font-semibold text-slate-800">Document Template</h2>
                </div>
                {templatesLoading ? (
                  <p className="text-sm text-slate-500">Loading templates…</p>
                ) : templates.length === 0 ? (
                  <p className="text-sm text-slate-500">No legal document templates are available yet. Please check back soon.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {templates.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => update("templateId", t.id)}
                        className={`text-left border-2 rounded-lg p-4 transition-all ${
                          formData.templateId === t.id ? "border-green-600 bg-green-50" : "border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: (t.badgeColor || "#16a34a") + "22" }}>
                            <FileSignature className="w-4.5 h-4.5" style={{ color: t.badgeColor || "#16a34a", width: 18, height: 18 }} />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800 text-sm">{t.name}</p>
                            {t.description && <p className="text-xs text-slate-500 mt-0.5">{t.description}</p>}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Document details */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-slate-800">Document Details</h2>
                <div>
                  <Label>Document title *</Label>
                  <Input value={formData.documentTitle} onChange={(e) => update("documentTitle", e.target.value)} placeholder='e.g. "Prenuptial Agreement", "Mutual Non-Disclosure Agreement"' />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Effective date</Label>
                    <Input type="date" value={formData.effectiveDate} onChange={(e) => update("effectiveDate", e.target.value)} />
                  </div>
                  <div>
                    <Label>Governing state</Label>
                    <Select value={formData.governingState} onValueChange={(v) => update("governingState", v)}>
                      <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
                      <SelectContent>
                        {US_STATES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Parties */}
              {["A", "B"].map((party) => (
                <div key={party} className="space-y-4">
                  <h2 className="text-lg font-semibold text-slate-800">Party {party}</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label>Full name *</Label>
                      <Input value={formData[`party${party}Name`]} onChange={(e) => update(`party${party}Name`, e.target.value)} />
                    </div>
                    <div>
                      <Label>Title / role (optional)</Label>
                      <Input value={formData[`party${party}Title`]} onChange={(e) => update(`party${party}Title`, e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <Label>Street address</Label>
                    <Input value={formData[`party${party}Address`]} onChange={(e) => update(`party${party}Address`, e.target.value)} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <Label>City</Label>
                      <Input value={formData[`party${party}City`]} onChange={(e) => update(`party${party}City`, e.target.value)} />
                    </div>
                    <div>
                      <Label>State</Label>
                      <Select value={formData[`party${party}State`]} onValueChange={(v) => update(`party${party}State`, v)}>
                        <SelectTrigger><SelectValue placeholder="State" /></SelectTrigger>
                        <SelectContent>
                          {US_STATES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>ZIP</Label>
                      <Input value={formData[`party${party}Zip`]} onChange={(e) => update(`party${party}Zip`, formatZipCode(e.target.value))} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label>Email</Label>
                      <Input type="email" value={formData[`party${party}Email`]} onChange={(e) => update(`party${party}Email`, e.target.value)} />
                    </div>
                    <div>
                      <Label>Phone</Label>
                      <Input value={formData[`party${party}Phone`]} onChange={(e) => update(`party${party}Phone`, formatPhoneNumber(e.target.value))} />
                    </div>
                  </div>
                </div>
              ))}

              {/* Content */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-slate-800">Agreement Content</h2>
                <div>
                  <Label>Recitals (optional)</Label>
                  <Textarea rows={3} value={formData.recitals} onChange={(e) => update("recitals", e.target.value)}
                    placeholder={'WHEREAS, the parties wish to …\nWHEREAS, …'} />
                  <p className="text-xs text-slate-500 mt-1">The "WHEREAS" background clauses that open many agreements.</p>
                </div>
                <div>
                  <Label>Terms and conditions *</Label>
                  <Textarea rows={8} value={formData.terms} onChange={(e) => update("terms", e.target.value)}
                    placeholder={"1. …\n\n2. …\n\n3. …"} />
                  <p className="text-xs text-slate-500 mt-1">Number your clauses; line breaks are kept in the document.</p>
                </div>
                <div>
                  <Label>Additional terms (optional)</Label>
                  <Textarea rows={3} value={formData.additionalTerms} onChange={(e) => update("additionalTerms", e.target.value)} />
                </div>
              </div>

              {/* Signatures */}
              <div className="space-y-8">
                <SignatureSection party="A" formData={formData} update={update} />
                <SignatureSection party="B" formData={formData} update={update} />
              </div>

              {/* Payment */}
              <div className="space-y-4 border-t border-slate-200 pt-6">
                <CouponInput
                  generatorType="legal-document"
                  originalPrice={PRICE}
                  onDiscountApplied={setAppliedDiscount}
                />
                {hasActiveSubscription ? (
                  <Button type="button" className="w-full bg-green-700 hover:bg-green-800 text-white h-12 text-base" disabled={isProcessing} onClick={handleSubscriptionDownload}>
                    {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : "Download with Subscription"}
                  </Button>
                ) : (
                  <Button type="button" className="w-full bg-green-700 hover:bg-green-800 text-white h-12 text-base" disabled={isProcessing} onClick={handleStripeCheckout}>
                    {isProcessing
                      ? <Loader2 className="w-5 h-5 animate-spin" />
                      : <><CreditCard className="w-5 h-5 mr-2" /> Pay ${appliedDiscount ? appliedDiscount.discountedPrice.toFixed(2) : PRICE.toFixed(2)} &amp; Download</>}
                  </Button>
                )}
                <p className="text-xs text-slate-500 flex items-center justify-center gap-1">
                  <Lock className="w-3 h-3" /> Secure payment via Stripe · Instant PDF download
                </p>
              </div>
            </form>
          </div>

          {/* ── RIGHT: PREVIEW ── */}
          <div className="lg:col-span-5">
            <div className="sticky top-6 bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
                <p className="font-semibold text-slate-800">Live Preview</p>
                {isGeneratingPreview && <Loader2 className="w-4 h-4 animate-spin text-green-700" />}
              </div>
              {pdfPreview ? (
                <iframe title="Document preview" src={pdfPreview} className="w-full" style={{ height: 640, border: "none" }} />
              ) : (
                <div className="flex flex-col items-center justify-center text-center px-8" style={{ height: 640 }}>
                  <Scale className="w-10 h-10 text-slate-300 mb-3" />
                  <p className="text-slate-500 text-sm">
                    {templates.length === 0 && !templatesLoading
                      ? "No templates are published yet."
                      : selectedTemplate
                        ? "Fill in the form — the preview updates as you type."
                        : "Choose a template to see the live preview."}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { createStripeCheckout } from "@/utils/stripePayment";
import CouponInput from "@/components/CouponInput";
import SignaturePad from "@/components/SignaturePad";
import { generateAndDownloadPowerOfAttorney, POA_POWERS } from "@/utils/powerOfAttorneyGenerator";
import { generatePowerOfAttorneyPreview } from "@/utils/powerOfAttorneyPreviewGenerator";
import { formatPhoneNumber, formatZipCode } from "@/utils/validation";
import { Upload, X, Scale, CreditCard, Lock, Loader2, PenTool, Type, CheckSquare, Square } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { trackDocumentGenerated, trackPaymentInitiated } from "@/utils/analyticsTracker";
import useAuthEnabled from "@/hooks/useAuthEnabled";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";
const PRICE = 9.99;

const US_STATES = [
  "Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut","Delaware",
  "District of Columbia","Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa",
  "Kansas","Kentucky","Louisiana","Maine","Maryland","Massachusetts","Michigan","Minnesota",
  "Mississippi","Missouri","Montana","Nebraska","Nevada","New Hampshire","New Jersey",
  "New Mexico","New York","North Carolina","North Dakota","Ohio","Oklahoma","Oregon",
  "Pennsylvania","Rhode Island","South Carolina","South Dakota","Tennessee","Texas","Utah",
  "Vermont","Virginia","Washington","West Virginia","Wisconsin","Wyoming",
];

const STATE_ABBR = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","DC","FL","GA","HI","ID","IL","IN","IA","KS","KY",
  "LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH",
  "OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY",
];

/**
 * Defined at module scope (not inside the form component) so its identity is
 * stable across renders. If it were declared inline, every keystroke would
 * create a new component type and React would remount SignaturePad, wiping
 * the canvas the moment a stroke updated form state.
 */
function SignatureBlock({
  which, mode, label, imageField, inputRef,
  formData, onModeChange, onUpdate, onUpload,
}) {
  return (
    <div className="space-y-3">
      <Label>{label}</Label>
      <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
        {[
          { value: "draw",   label: "Draw",   icon: PenTool },
          { value: "type",   label: "Type",   icon: Type },
          { value: "upload", label: "Upload", icon: Upload },
        ].map(({ value, label: l, icon: Icon }) => (
          <button
            key={value}
            type="button"
            onClick={() => onModeChange(which, value)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              mode === value ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Icon className="w-4 h-4" /> {l}
          </button>
        ))}
      </div>

      {mode === "draw" && (
        <SignaturePad height={170} onChange={(dataUrl) => onUpdate(imageField, dataUrl)} />
      )}

      {mode === "type" && (
        <div className="p-4 bg-white border border-slate-200 rounded-lg">
          <p className="text-xs text-slate-400 mb-1">Preview — the name below is rendered on the document</p>
          <span style={{ fontFamily: "Yellowtail, cursive", fontSize: "2rem", color: "#1a1a3a" }}>
            {which === "principal" ? (formData.principalName || "Principal Name") : (formData.agentName || "Agent Name")}
          </span>
        </div>
      )}

      {mode === "upload" && (
        <div>
          {formData[imageField] ? (
            <div className="flex items-center gap-3">
              <img src={formData[imageField]} alt="Signature" className="h-12 w-auto border border-slate-200 rounded p-1 bg-white" />
              <Button type="button" variant="outline" size="sm" onClick={() => { onUpdate(imageField, null); if (inputRef.current) inputRef.current.value = ""; }}>
                <X className="w-4 h-4 mr-1" /> Remove
              </Button>
            </div>
          ) : (
            <>
              <input ref={inputRef} type="file" accept="image/png,image/jpeg" className="hidden" onChange={e => onUpload(imageField, e.target.files?.[0])} />
              <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
                <Upload className="w-4 h-4 mr-1" /> Upload Signature
              </Button>
              <p className="text-xs text-slate-500 mt-2">PNG with a transparent background works best.</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function PowerOfAttorneyForm() {
  const navigate = useNavigate();
  const authEnabled = useAuthEnabled();
  const principalSigRef = useRef(null);
  const agentSigRef = useRef(null);

  const [user, setUser] = useState(null);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [pdfPreview, setPdfPreview] = useState(null);
  const [appliedDiscount, setAppliedDiscount] = useState(null);
  const [principalSigMode, setPrincipalSigMode] = useState("draw");
  const [agentSigMode, setAgentSigMode] = useState("draw");

  const [formData, setFormData] = useState({
    governingState: "",

    // Principal
    principalName: "", principalAddress: "", principalCity: "",
    principalState: "", principalZip: "", principalPhone: "",

    // Agent
    agentName: "", agentAddress: "", agentCity: "", agentState: "",
    agentZip: "", agentPhone: "", agentRelationship: "",

    // Successor agent
    successorName: "", successorAddress: "", successorCity: "",
    successorState: "", successorZip: "", successorPhone: "",

    // Powers
    grantAllPowers: true,
    powers: POA_POWERS.reduce((acc, p) => ({ ...acc, [p.id]: true }), {}),

    specialInstructions: "",
    effectiveType: "immediate",     // immediate | springing
    effectiveDate: new Date().toISOString().slice(0, 10),
    agentCompensation: "uncompensated",
    revokePrior: true,

    executionDate: new Date().toISOString().slice(0, 10),

    // Execution blocks
    includeWitnesses: true,
    witness1Name: "", witness2Name: "",
    includeNotary: true,
    notaryState: "", notaryCounty: "",
    includeAgentAcceptance: true,

    // Signatures
    principalSignatureImage: null,
    agentSignatureImage: null,
  });

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

  const togglePower = (id) => {
    setFormData(prev => ({
      ...prev,
      grantAllPowers: false,
      powers: { ...prev.powers, [id]: !prev.powers[id] },
    }));
  };

  const setAllPowers = (on) => {
    setFormData(prev => ({
      ...prev,
      grantAllPowers: on,
      powers: POA_POWERS.reduce((acc, p) => ({ ...acc, [p.id]: on }), {}),
    }));
  };

  const changeSigMode = (which, mode) => {
    if (which === "principal") {
      setPrincipalSigMode(mode);
      update("principalSignatureImage", null);
      if (principalSigRef.current) principalSigRef.current.value = "";
    } else {
      setAgentSigMode(mode);
      update("agentSignatureImage", null);
      if (agentSigRef.current) agentSigRef.current.value = "";
    }
  };

  const handleImageUpload = (field, file) => {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error("Image must be under 2MB"); return; }
    const reader = new FileReader();
    reader.onloadend = () => update(field, reader.result);
    reader.readAsDataURL(file);
  };

  // Live preview
  useEffect(() => {
    if (isProcessing) return;
    const timer = setTimeout(async () => {
      if (formData.principalName && formData.agentName && formData.governingState) {
        setIsGeneratingPreview(true);
        try {
          setPdfPreview(await generatePowerOfAttorneyPreview(formData));
        } catch (err) {
          console.error("Preview generation failed:", err);
        }
        setIsGeneratingPreview(false);
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [formData, isProcessing]);

  const validate = () => {
    if (!formData.principalName.trim())  { toast.error("Enter the Principal's full name"); return false; }
    if (!formData.agentName.trim())      { toast.error("Enter the Agent's full name"); return false; }
    if (!formData.governingState)        { toast.error("Select the governing state"); return false; }
    const anyPower = formData.grantAllPowers || Object.values(formData.powers).some(Boolean);
    if (!anyPower)                       { toast.error("Select at least one power to grant"); return false; }
    return true;
  };

  const handleSubscriptionDownload = async () => {
    if (!validate()) return;
    const token = localStorage.getItem("userToken");
    if (!token) { toast.error("Please log in"); return; }

    setIsProcessing(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/user/subscription-download`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ documentType: "power-of-attorney", template: "durable-general" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to process subscription download");

      const pdfBlob = await generateAndDownloadPowerOfAttorney(formData, true);

      if (pdfBlob instanceof Blob) {
        const reader = new FileReader();
        reader.onloadend = async () => {
          try {
            await fetch(`${BACKEND_URL}/api/user/saved-documents`, {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
              body: JSON.stringify({
                documentType: "power-of-attorney",
                fileName: `Durable_Power_of_Attorney_${formData.principalName.replace(/\s+/g, "_")}.pdf`,
                fileData: reader.result.split(",")[1],
                template: "durable-general",
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

      trackDocumentGenerated("power_of_attorney", "durable-general", 0, "subscription");
      toast.success("Power of Attorney downloaded!");
    } catch (err) {
      toast.error(err.message || "Download failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStripeCheckout = async () => {
    if (!validate()) return;
    setIsProcessing(true);
    try {
      localStorage.setItem("pendingPowerOfAttorneyData", JSON.stringify(formData));
      trackPaymentInitiated("power_of_attorney", appliedDiscount ? appliedDiscount.discountedPrice : PRICE);

      const { url } = await createStripeCheckout({
        amount: PRICE,
        documentType: "power-of-attorney",
        template: "durable-general",
        appliedDiscount,
        successPath: "/payment-success",
        cancelPath: "/power-of-attorney-generator",
      });
      window.location.href = url;
    } catch (err) {
      toast.error(err.message || "Payment failed. Please try again.");
      setIsProcessing(false);
    }
  };

  const selectedPowerCount = formData.grantAllPowers
    ? POA_POWERS.length
    : Object.values(formData.powers).filter(Boolean).length;

  const sigProps = { formData, onModeChange: changeSigMode, onUpdate: update, onUpload: handleImageUpload };

  return (
    <div className="min-h-screen bg-slate-50">
      <Helmet>
        <title>Durable General Power of Attorney Form | Create Yours for $9.99 | MintSlip</title>
        <meta name="description" content="Create a Durable General Power of Attorney in minutes. Appoint an agent to manage your finances and property, with notary and witness blocks included. Instant PDF for $9.99." />
        <link rel="canonical" href="https://mintslip.com/power-of-attorney-generator" />
      </Helmet>

      <Header />

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: "Outfit, sans-serif", color: "#1a4731" }}>
            Durable General Power of Attorney
          </h1>
          <p className="text-slate-600">
            Appoint someone you trust to manage your financial and property affairs — including if you become incapacitated.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* ── FORM ── */}
          <div className="lg:col-span-7">
            <form className="space-y-8 bg-white p-8 rounded-lg shadow-sm border border-slate-200" onSubmit={e => e.preventDefault()}>

              {/* Governing state */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold" style={{ fontFamily: "Outfit, sans-serif", color: "#1a4731" }}>
                  Governing State
                </h2>
                <div>
                  <Label>State whose laws govern this document *</Label>
                  <Select value={formData.governingState} onValueChange={v => update("governingState", v)}>
                    <SelectTrigger><SelectValue placeholder="Select a state" /></SelectTrigger>
                    <SelectContent className="max-h-60">
                      {US_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-500 mt-1">
                    Normally the state where you (the Principal) live.
                  </p>
                </div>
              </div>

              {/* Principal */}
              <div className="space-y-4 pt-6 border-t border-slate-200">
                <h2 className="text-2xl font-bold" style={{ fontFamily: "Outfit, sans-serif", color: "#1a4731" }}>
                  Principal (You)
                </h2>
                <p className="text-sm text-slate-500">The person granting authority.</p>
                <div>
                  <Label>Full Legal Name *</Label>
                  <Input value={formData.principalName} onChange={e => update("principalName", e.target.value)} placeholder="Jane Marie Doe" />
                </div>
                <div>
                  <Label>Street Address</Label>
                  <Input value={formData.principalAddress} onChange={e => update("principalAddress", e.target.value)} placeholder="123 Main St" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>City</Label>
                    <Input value={formData.principalCity} onChange={e => update("principalCity", e.target.value)} />
                  </div>
                  <div>
                    <Label>State</Label>
                    <Select value={formData.principalState} onValueChange={v => update("principalState", v)}>
                      <SelectTrigger><SelectValue placeholder="ST" /></SelectTrigger>
                      <SelectContent className="max-h-60">
                        {STATE_ABBR.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>ZIP</Label>
                    <Input value={formData.principalZip} onChange={e => update("principalZip", formatZipCode(e.target.value))} />
                  </div>
                </div>
              </div>

              {/* Agent */}
              <div className="space-y-4 pt-6 border-t border-slate-200">
                <h2 className="text-2xl font-bold" style={{ fontFamily: "Outfit, sans-serif", color: "#1a4731" }}>
                  Agent (Attorney-in-Fact)
                </h2>
                <p className="text-sm text-slate-500">The person you are authorizing to act for you.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Full Legal Name *</Label>
                    <Input value={formData.agentName} onChange={e => update("agentName", e.target.value)} placeholder="John Allen Smith" />
                  </div>
                  <div>
                    <Label>Relationship to You</Label>
                    <Input value={formData.agentRelationship} onChange={e => update("agentRelationship", e.target.value)} placeholder="Spouse, child, friend…" />
                  </div>
                </div>
                <div>
                  <Label>Street Address</Label>
                  <Input value={formData.agentAddress} onChange={e => update("agentAddress", e.target.value)} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>City</Label>
                    <Input value={formData.agentCity} onChange={e => update("agentCity", e.target.value)} />
                  </div>
                  <div>
                    <Label>State</Label>
                    <Select value={formData.agentState} onValueChange={v => update("agentState", v)}>
                      <SelectTrigger><SelectValue placeholder="ST" /></SelectTrigger>
                      <SelectContent className="max-h-60">
                        {STATE_ABBR.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>ZIP</Label>
                    <Input value={formData.agentZip} onChange={e => update("agentZip", formatZipCode(e.target.value))} />
                  </div>
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input value={formData.agentPhone} onChange={e => update("agentPhone", formatPhoneNumber(e.target.value))} placeholder="(555) 123-4567" />
                </div>
              </div>

              {/* Successor */}
              <div className="space-y-4 pt-6 border-t border-slate-200">
                <h2 className="text-2xl font-bold" style={{ fontFamily: "Outfit, sans-serif", color: "#1a4731" }}>
                  Successor Agent <span className="text-base font-normal text-slate-400">(optional)</span>
                </h2>
                <p className="text-sm text-slate-500">Serves if your first Agent cannot or will not act. Strongly recommended.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Full Legal Name</Label>
                    <Input value={formData.successorName} onChange={e => update("successorName", e.target.value)} />
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <Input value={formData.successorPhone} onChange={e => update("successorPhone", formatPhoneNumber(e.target.value))} />
                  </div>
                </div>
                <div>
                  <Label>Street Address</Label>
                  <Input value={formData.successorAddress} onChange={e => update("successorAddress", e.target.value)} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>City</Label>
                    <Input value={formData.successorCity} onChange={e => update("successorCity", e.target.value)} />
                  </div>
                  <div>
                    <Label>State</Label>
                    <Select value={formData.successorState} onValueChange={v => update("successorState", v)}>
                      <SelectTrigger><SelectValue placeholder="ST" /></SelectTrigger>
                      <SelectContent className="max-h-60">
                        {STATE_ABBR.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>ZIP</Label>
                    <Input value={formData.successorZip} onChange={e => update("successorZip", formatZipCode(e.target.value))} />
                  </div>
                </div>
              </div>

              {/* Powers */}
              <div className="space-y-4 pt-6 border-t border-slate-200">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <h2 className="text-2xl font-bold" style={{ fontFamily: "Outfit, sans-serif", color: "#1a4731" }}>
                    Powers Granted
                  </h2>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => setAllPowers(true)}>Select all</Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => setAllPowers(false)}>Clear all</Button>
                  </div>
                </div>
                <p className="text-sm text-slate-500">
                  {selectedPowerCount} of {POA_POWERS.length} powers selected. Only checked powers are granted.
                </p>

                <div className="space-y-2">
                  {POA_POWERS.map(p => {
                    const on = formData.grantAllPowers || formData.powers[p.id];
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => togglePower(p.id)}
                        className={`w-full flex items-start gap-3 text-left p-3 rounded-lg border-2 transition-colors ${
                          on ? "border-green-500 bg-green-50" : "border-slate-200 hover:border-slate-300 bg-white"
                        }`}
                      >
                        {on
                          ? <CheckSquare className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                          : <Square className="w-5 h-5 text-slate-300 flex-shrink-0 mt-0.5" />}
                        <div>
                          <div className={`text-sm font-semibold ${on ? "text-slate-900" : "text-slate-500"}`}>{p.label}</div>
                          <div className="text-xs text-slate-500 mt-0.5">{p.desc}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div>
                  <Label>Special Instructions or Limitations (optional)</Label>
                  <Textarea
                    rows={4}
                    value={formData.specialInstructions}
                    onChange={e => update("specialInstructions", e.target.value)}
                    placeholder="e.g. My Agent may not sell my primary residence without written consent from my children."
                  />
                </div>
              </div>

              {/* Terms */}
              <div className="space-y-5 pt-6 border-t border-slate-200">
                <h2 className="text-2xl font-bold" style={{ fontFamily: "Outfit, sans-serif", color: "#1a4731" }}>
                  Terms
                </h2>

                <div>
                  <Label>When does this take effect?</Label>
                  <RadioGroup value={formData.effectiveType} onValueChange={v => update("effectiveType", v)} className="mt-2 space-y-2">
                    <div className="flex items-start space-x-2">
                      <RadioGroupItem value="immediate" id="eff-immediate" className="mt-1" />
                      <Label htmlFor="eff-immediate" className="cursor-pointer font-normal">
                        <span className="font-medium">Immediately</span>
                        <span className="block text-xs text-slate-500">Effective as soon as it's signed, and stays effective if you become incapacitated.</span>
                      </Label>
                    </div>
                    <div className="flex items-start space-x-2">
                      <RadioGroupItem value="springing" id="eff-springing" className="mt-1" />
                      <Label htmlFor="eff-springing" className="cursor-pointer font-normal">
                        <span className="font-medium">Only upon incapacity ("springing")</span>
                        <span className="block text-xs text-slate-500">Takes effect only when a physician certifies you cannot manage your affairs.</span>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <div>
                  <Label>Agent compensation</Label>
                  <RadioGroup value={formData.agentCompensation} onValueChange={v => update("agentCompensation", v)} className="mt-2 flex gap-6">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="uncompensated" id="comp-none" />
                      <Label htmlFor="comp-none" className="cursor-pointer font-normal">Serves without pay</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="compensated" id="comp-yes" />
                      <Label htmlFor="comp-yes" className="cursor-pointer font-normal">Reasonable compensation</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Date of Execution</Label>
                    <Input type="date" value={formData.executionDate} onChange={e => update("executionDate", e.target.value)} />
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center gap-2 cursor-pointer pb-2">
                      <input type="checkbox" checked={formData.revokePrior} onChange={e => update("revokePrior", e.target.checked)} className="w-4 h-4" />
                      <span className="text-sm text-slate-700">Revoke prior powers of attorney</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Execution blocks */}
              <div className="space-y-4 pt-6 border-t border-slate-200">
                <h2 className="text-2xl font-bold" style={{ fontFamily: "Outfit, sans-serif", color: "#1a4731" }}>
                  Execution Blocks
                </h2>
                <p className="text-sm text-slate-500">
                  Most states require notarization; many also require two witnesses. Check your state's rules.
                </p>

                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 cursor-pointer">
                    <input type="checkbox" checked={formData.includeWitnesses} onChange={e => update("includeWitnesses", e.target.checked)} className="w-4 h-4" />
                    <span className="text-sm">Include witness attestation block (2 witnesses)</span>
                  </label>

                  {formData.includeWitnesses && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-8">
                      <div>
                        <Label>Witness 1 Name (optional)</Label>
                        <Input value={formData.witness1Name} onChange={e => update("witness1Name", e.target.value)} />
                      </div>
                      <div>
                        <Label>Witness 2 Name (optional)</Label>
                        <Input value={formData.witness2Name} onChange={e => update("witness2Name", e.target.value)} />
                      </div>
                    </div>
                  )}

                  <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 cursor-pointer">
                    <input type="checkbox" checked={formData.includeNotary} onChange={e => update("includeNotary", e.target.checked)} className="w-4 h-4" />
                    <span className="text-sm">Include notary acknowledgment block</span>
                  </label>

                  {formData.includeNotary && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-8">
                      <div>
                        <Label>Notary State</Label>
                        <Input value={formData.notaryState} onChange={e => update("notaryState", e.target.value)} placeholder={formData.governingState} />
                      </div>
                      <div>
                        <Label>County</Label>
                        <Input value={formData.notaryCounty} onChange={e => update("notaryCounty", e.target.value)} />
                      </div>
                    </div>
                  )}

                  <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 cursor-pointer">
                    <input type="checkbox" checked={formData.includeAgentAcceptance} onChange={e => update("includeAgentAcceptance", e.target.checked)} className="w-4 h-4" />
                    <span className="text-sm">Include agent acceptance page</span>
                  </label>
                </div>
              </div>

              {/* Signatures */}
              <div className="space-y-6 pt-6 border-t border-slate-200">
                <h2 className="text-2xl font-bold" style={{ fontFamily: "Outfit, sans-serif", color: "#1a4731" }}>
                  Signatures
                </h2>
                <p className="text-sm text-slate-500">
                  You can sign here, or leave blank and sign by hand in front of a notary.
                </p>

                <SignatureBlock
                  {...sigProps}
                  which="principal" mode={principalSigMode}
                  label="Principal Signature"
                  imageField="principalSignatureImage" inputRef={principalSigRef}
                />

                {formData.includeAgentAcceptance && (
                  <div className="pt-4 border-t border-slate-100">
                    <SignatureBlock
                      {...sigProps}
                      which="agent" mode={agentSigMode}
                      label="Agent Signature (acceptance page)"
                      imageField="agentSignatureImage" inputRef={agentSigRef}
                    />
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
                  <AccordionTrigger>What does "durable" mean?</AccordionTrigger>
                  <AccordionContent>
                    Durable means the document stays in effect if you later become incapacitated. A non-durable power of attorney
                    automatically ends the moment you lose capacity — which is usually the exact point you need it most. That's why
                    the durable version is what most people want for financial planning.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="q2">
                  <AccordionTrigger>Does this cover medical decisions?</AccordionTrigger>
                  <AccordionContent>
                    No. This is a financial and property power of attorney. Health care decisions require a separate document —
                    typically a health care power of attorney, medical proxy, or advance directive, depending on your state.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="q3">
                  <AccordionTrigger>Do I need it notarized?</AccordionTrigger>
                  <AccordionContent>
                    In most states, yes — and banks and title companies almost always insist on a notarized original before they'll
                    accept it. Many states also require two witnesses who are not the agent. This generator includes both the notary
                    acknowledgment and witness blocks so you're covered either way.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="q4">
                  <AccordionTrigger>Can I cancel it later?</AccordionTrigger>
                  <AccordionContent>
                    Yes. You can revoke a power of attorney at any time while you still have mental capacity. Put the revocation in
                    writing, deliver a copy to your agent, and notify any bank or institution that has the original on file — a third
                    party who hasn't received notice can still rely on the old document.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="q5">
                  <AccordionTrigger>Who should I choose as my agent?</AccordionTrigger>
                  <AccordionContent>
                    Someone you trust completely with money, who is organized and willing to serve. Your agent can access your accounts
                    and sign on your behalf, so this is a significant grant of authority. Naming a successor agent is strongly
                    recommended in case your first choice can't serve.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>

          {/* ── PREVIEW + PAYMENT ── */}
          <div className="lg:col-span-5">
            <div className="sticky top-24 space-y-6">
              <div className="p-6 bg-green-50 border-2 border-green-200 rounded-md">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ fontFamily: "Outfit, sans-serif", color: "#1a4731" }}>
                  <Scale className="w-5 h-5" /> Document Summary
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-slate-700">State:</span><span className="font-medium text-slate-900">{formData.governingState || "—"}</span></div>
                  <div className="border-t border-green-300 my-2" />
                  <div className="flex justify-between"><span className="text-slate-700">Principal:</span><span className="font-medium text-slate-900">{formData.principalName || "—"}</span></div>
                  <div className="flex justify-between"><span className="text-slate-700">Agent:</span><span className="font-medium text-slate-900">{formData.agentName || "—"}</span></div>
                  {formData.successorName && (
                    <div className="flex justify-between"><span className="text-slate-700">Successor:</span><span className="font-medium text-slate-900">{formData.successorName}</span></div>
                  )}
                  <div className="border-t border-green-300 my-2" />
                  <div className="flex justify-between"><span className="text-slate-700">Powers:</span><span className="font-medium text-slate-900">{selectedPowerCount} of {POA_POWERS.length}</span></div>
                  <div className="flex justify-between"><span className="text-slate-700">Effective:</span><span className="font-medium text-slate-900">{formData.effectiveType === "springing" ? "Upon incapacity" : "Immediately"}</span></div>
                  <div className="flex justify-between"><span className="text-slate-700">Notary block:</span><span className="font-medium text-slate-900">{formData.includeNotary ? "Yes" : "No"}</span></div>
                </div>
              </div>

              <div className="p-4 bg-white border-2 border-slate-200 rounded-md">
                <h3 className="text-lg font-bold mb-3" style={{ fontFamily: "Outfit, sans-serif", color: "#1a4731" }}>Live Preview</h3>
                {isGeneratingPreview ? (
                  <div className="flex items-center justify-center h-64 text-slate-400 gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" /> Generating preview…
                  </div>
                ) : pdfPreview ? (
                  <>
                    <img src={pdfPreview} alt="Power of attorney preview" className="w-full border border-slate-200 rounded" />
                    <p className="text-xs text-slate-400 mt-2 text-center">Page 1 shown — full document is multiple pages</p>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-64 text-slate-400 text-center px-4">
                    <Scale className="w-10 h-10 mb-2 opacity-40" />
                    <p className="text-sm">Enter the Principal, Agent, and state to see a live preview.</p>
                  </div>
                )}
              </div>

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
                      {isProcessing ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Generating…</> : "Download (Included in Plan)"}
                    </Button>
                  </div>
                ) : (
                  <>
                    <CouponInput generatorType="power-of-attorney" originalPrice={PRICE} onDiscountApplied={setAppliedDiscount} />
                    <p className="text-sm text-slate-600 mb-4">
                      Total: <strong>${appliedDiscount ? appliedDiscount.discountedPrice.toFixed(2) : PRICE.toFixed(2)}</strong>
                      {appliedDiscount && <span className="text-green-600 ml-1">({appliedDiscount.discountPercent}% off)</span>}
                    </p>
                    <Button onClick={handleStripeCheckout} disabled={isProcessing} className="w-full bg-green-600 hover:bg-green-700 text-white py-6 text-lg font-semibold rounded-xl gap-2">
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

              <div className="p-4 bg-amber-50 border border-amber-200 rounded-md">
                <p className="text-xs text-amber-800 leading-relaxed">
                  <strong>Not legal advice.</strong> MintSlip provides a document preparation service, not legal representation.
                  Power of attorney requirements vary by state. For large estates or complex circumstances, have an attorney review
                  your document before signing.
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

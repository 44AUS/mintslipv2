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
import { generateAndDownloadCommercialLease, LEASE_TYPES } from "@/utils/commercialLeaseGenerator";
import { generateCommercialLeasePreview } from "@/utils/commercialLeasePreviewGenerator";
import { formatPhoneNumber, formatZipCode } from "@/utils/validation";
import { Upload, X, Building2, CreditCard, Lock, Loader2, PenTool, Type } from "lucide-react";
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

const PROPERTY_TYPES = [
  "Office", "Retail", "Restaurant", "Warehouse", "Industrial",
  "Flex / Mixed Use", "Medical Office", "Salon / Studio", "Other",
];

const ENTITY_TYPES = ["Individual", "Sole Proprietorship", "LLC", "Corporation", "Partnership", "Non-Profit"];

const H2 = ({ children }) => (
  <h2 className="text-2xl font-bold" style={{ fontFamily: "Outfit, sans-serif", color: "#1a4731" }}>{children}</h2>
);

/**
 * Defined at module scope (not inside the form component) so its identity is
 * stable across renders. If it were declared inline, every keystroke would
 * create a new component type and React would remount SignaturePad, wiping
 * the canvas the moment a stroke updated form state.
 */
function SignatureBlock({
  which, mode, label, nameValue, imageField, inputRef,
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
            key={value} type="button"
            onClick={() => onModeChange(which, value)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              mode === value ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Icon className="w-4 h-4" /> {l}
          </button>
        ))}
      </div>

      {mode === "draw" && <SignaturePad height={170} onChange={(d) => onUpdate(imageField, d)} />}

      {mode === "type" && (
        <div className="p-4 bg-white border border-slate-200 rounded-lg">
          <p className="text-xs text-slate-400 mb-1">Preview — the name below is rendered on the lease</p>
          <span style={{ fontFamily: "Yellowtail, cursive", fontSize: "2rem", color: "#1a1a3a" }}>
            {nameValue || "Name"}
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
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function CommercialLeaseForm() {
  const navigate = useNavigate();
  const authEnabled = useAuthEnabled();
  const landlordSigRef = useRef(null);
  const tenantSigRef = useRef(null);
  const guarantorSigRef = useRef(null);

  const [user, setUser] = useState(null);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [pdfPreview, setPdfPreview] = useState(null);
  const [appliedDiscount, setAppliedDiscount] = useState(null);
  const [landlordSigMode, setLandlordSigMode] = useState("draw");
  const [tenantSigMode, setTenantSigMode] = useState("draw");
  const [guarantorSigMode, setGuarantorSigMode] = useState("draw");

  const [formData, setFormData] = useState({
    governingState: "",
    agreementDate: new Date().toISOString().slice(0, 10),

    // Landlord
    landlordName: "", landlordTitle: "", landlordAddress: "", landlordCity: "",
    landlordState: "", landlordZip: "", landlordPhone: "", landlordEmail: "",

    // Tenant
    tenantName: "", tenantTitle: "", tenantEntityType: "", tenantAddress: "",
    tenantCity: "", tenantState: "", tenantZip: "", tenantPhone: "", tenantEmail: "",

    // Premises
    premisesAddress: "", premisesCity: "", premisesState: "", premisesZip: "",
    premisesUnit: "", squareFootage: "", propertyType: "", parkingSpaces: "",
    premisesDescription: "", permittedUse: "",

    // Term
    leaseStartDate: "", leaseEndDate: "",
    renewalOption: false, renewalTerms: "one (1)", renewalLength: "", renewalNoticeDays: "90",

    // Rent
    monthlyRent: "", annualRent: "", rentDueDay: "1st", rentPaymentMethod: "",
    lateFee: "", lateFeeGraceDays: "5",
    rentIncreaseType: "none", rentIncreasePercent: "", rentIncreaseAmount: "",

    // Lease type
    leaseType: "triple-net", camCharges: "",
    percentageRate: "", percentageBreakpoint: "",

    // Deposit / utilities
    securityDeposit: "", depositReturnDays: "30",
    utilitiesPaidBy: "tenant", utilitiesDetail: "",
    hvacResponsibility: "",

    // Other terms
    tenantImprovementAllowance: "",
    liabilityInsuranceAmount: "1000000",
    allowSublease: false,
    defaultCureDays: "10", defaultCureDaysOther: "30",
    holdoverPercent: "150",
    additionalProvisions: "",

    // Execution
    includeGuarantor: false,
    guarantorName: "", guarantorAddress: "",
    includeNotary: false,
    notaryState: "", notaryCounty: "",

    landlordSignatureImage: null,
    tenantSignatureImage: null,
    guarantorSignatureImage: null,
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

  // Auto-compute annual rent from monthly
  useEffect(() => {
    const m = parseFloat(String(formData.monthlyRent).replace(/[^0-9.]/g, ""));
    if (!isNaN(m) && m > 0) {
      const annual = (m * 12).toFixed(2);
      setFormData(prev => prev.annualRent === annual ? prev : { ...prev, annualRent: annual });
    }
  }, [formData.monthlyRent]);

  const changeSigMode = (which, mode) => {
    if (which === "landlord")  { setLandlordSigMode(mode);  update("landlordSignatureImage", null);  if (landlordSigRef.current) landlordSigRef.current.value = ""; }
    if (which === "tenant")    { setTenantSigMode(mode);    update("tenantSignatureImage", null);    if (tenantSigRef.current) tenantSigRef.current.value = ""; }
    if (which === "guarantor") { setGuarantorSigMode(mode); update("guarantorSignatureImage", null); if (guarantorSigRef.current) guarantorSigRef.current.value = ""; }
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
      if (formData.landlordName && formData.tenantName && formData.premisesAddress) {
        setIsGeneratingPreview(true);
        try { setPdfPreview(await generateCommercialLeasePreview(formData)); }
        catch (err) { console.error("Preview generation failed:", err); }
        setIsGeneratingPreview(false);
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [formData, isProcessing]);

  const validate = () => {
    if (!formData.landlordName.trim())    { toast.error("Enter the Landlord's name"); return false; }
    if (!formData.tenantName.trim())      { toast.error("Enter the Tenant's name"); return false; }
    if (!formData.premisesAddress.trim()) { toast.error("Enter the property address"); return false; }
    if (!formData.governingState)         { toast.error("Select the governing state"); return false; }
    if (!formData.monthlyRent)            { toast.error("Enter the monthly base rent"); return false; }
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
        body: JSON.stringify({ documentType: "commercial-lease", template: formData.leaseType }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to process subscription download");

      const pdfBlob = await generateAndDownloadCommercialLease(formData, true);

      if (pdfBlob instanceof Blob) {
        const reader = new FileReader();
        reader.onloadend = async () => {
          try {
            await fetch(`${BACKEND_URL}/api/user/saved-documents`, {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
              body: JSON.stringify({
                documentType: "commercial-lease",
                fileName: `Commercial_Lease_${formData.tenantName.replace(/\s+/g, "_")}.pdf`,
                fileData: reader.result.split(",")[1],
                template: formData.leaseType,
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

      trackDocumentGenerated("commercial_lease", formData.leaseType, 0, "subscription");
      toast.success("Commercial lease downloaded!");
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
      localStorage.setItem("pendingCommercialLeaseData", JSON.stringify(formData));
      trackPaymentInitiated("commercial_lease", appliedDiscount ? appliedDiscount.discountedPrice : PRICE);

      const { url } = await createStripeCheckout({
        amount: PRICE,
        documentType: "commercial-lease",
        template: formData.leaseType,
        appliedDiscount,
        successPath: "/payment-success",
        cancelPath: "/commercial-lease-generator",
      });
      window.location.href = url;
    } catch (err) {
      toast.error(err.message || "Payment failed. Please try again.");
      setIsProcessing(false);
    }
  };

  const selectedLeaseType = LEASE_TYPES.find(t => t.value === formData.leaseType);

  const sigProps = { formData, onModeChange: changeSigMode, onUpdate: update, onUpload: handleImageUpload };

  return (
    <div className="min-h-screen bg-slate-50">
      <Helmet>
        <title>Commercial Lease Agreement Generator | Create Yours for $9.99 | MintSlip</title>
        <meta name="description" content="Create a commercial lease agreement in minutes. NNN, gross, modified gross, and percentage leases with CAM, escalation, guaranty, and notary blocks. Instant PDF for $9.99." />
        <link rel="canonical" href="https://mintslip.com/commercial-lease-generator" />
      </Helmet>

      <Header />

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: "Outfit, sans-serif", color: "#1a4731" }}>
            Commercial Lease Agreement
          </h1>
          <p className="text-slate-600">
            Create a landlord-ready commercial lease for office, retail, warehouse, or industrial space.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* ── FORM ── */}
          <div className="lg:col-span-7">
            <form className="space-y-8 bg-white p-8 rounded-lg shadow-sm border border-slate-200" onSubmit={e => e.preventDefault()}>

              {/* Basics */}
              <div className="space-y-4">
                <H2>Agreement Basics</H2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Governing State *</Label>
                    <Select value={formData.governingState} onValueChange={v => update("governingState", v)}>
                      <SelectTrigger><SelectValue placeholder="Select a state" /></SelectTrigger>
                      <SelectContent className="max-h-60">
                        {US_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Agreement Date</Label>
                    <Input type="date" value={formData.agreementDate} onChange={e => update("agreementDate", e.target.value)} />
                  </div>
                </div>
              </div>

              {/* Landlord */}
              <div className="space-y-4 pt-6 border-t border-slate-200">
                <H2>Landlord</H2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Landlord Name *</Label>
                    <Input value={formData.landlordName} onChange={e => update("landlordName", e.target.value)} placeholder="Acme Properties LLC" />
                  </div>
                  <div>
                    <Label>Signer Title (optional)</Label>
                    <Input value={formData.landlordTitle} onChange={e => update("landlordTitle", e.target.value)} placeholder="Managing Member" />
                  </div>
                </div>
                <div>
                  <Label>Address</Label>
                  <Input value={formData.landlordAddress} onChange={e => update("landlordAddress", e.target.value)} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div><Label>City</Label><Input value={formData.landlordCity} onChange={e => update("landlordCity", e.target.value)} /></div>
                  <div>
                    <Label>State</Label>
                    <Select value={formData.landlordState} onValueChange={v => update("landlordState", v)}>
                      <SelectTrigger><SelectValue placeholder="ST" /></SelectTrigger>
                      <SelectContent className="max-h-60">{STATE_ABBR.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>ZIP</Label><Input value={formData.landlordZip} onChange={e => update("landlordZip", formatZipCode(e.target.value))} /></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><Label>Phone</Label><Input value={formData.landlordPhone} onChange={e => update("landlordPhone", formatPhoneNumber(e.target.value))} /></div>
                  <div><Label>Email</Label><Input type="email" value={formData.landlordEmail} onChange={e => update("landlordEmail", e.target.value)} /></div>
                </div>
              </div>

              {/* Tenant */}
              <div className="space-y-4 pt-6 border-t border-slate-200">
                <H2>Tenant</H2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Tenant Name *</Label>
                    <Input value={formData.tenantName} onChange={e => update("tenantName", e.target.value)} placeholder="Bright Coffee Co." />
                  </div>
                  <div>
                    <Label>Entity Type</Label>
                    <Select value={formData.tenantEntityType} onValueChange={v => update("tenantEntityType", v)}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>{ENTITY_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><Label>Signer Title (optional)</Label><Input value={formData.tenantTitle} onChange={e => update("tenantTitle", e.target.value)} placeholder="Owner" /></div>
                  <div><Label>Phone</Label><Input value={formData.tenantPhone} onChange={e => update("tenantPhone", formatPhoneNumber(e.target.value))} /></div>
                </div>
                <div><Label>Address</Label><Input value={formData.tenantAddress} onChange={e => update("tenantAddress", e.target.value)} /></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div><Label>City</Label><Input value={formData.tenantCity} onChange={e => update("tenantCity", e.target.value)} /></div>
                  <div>
                    <Label>State</Label>
                    <Select value={formData.tenantState} onValueChange={v => update("tenantState", v)}>
                      <SelectTrigger><SelectValue placeholder="ST" /></SelectTrigger>
                      <SelectContent className="max-h-60">{STATE_ABBR.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>ZIP</Label><Input value={formData.tenantZip} onChange={e => update("tenantZip", formatZipCode(e.target.value))} /></div>
                </div>
                <div><Label>Email</Label><Input type="email" value={formData.tenantEmail} onChange={e => update("tenantEmail", e.target.value)} /></div>
              </div>

              {/* Premises */}
              <div className="space-y-4 pt-6 border-t border-slate-200">
                <H2>Premises</H2>
                <div><Label>Property Address *</Label><Input value={formData.premisesAddress} onChange={e => update("premisesAddress", e.target.value)} placeholder="500 Commerce Blvd" /></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div><Label>City</Label><Input value={formData.premisesCity} onChange={e => update("premisesCity", e.target.value)} /></div>
                  <div>
                    <Label>State</Label>
                    <Select value={formData.premisesState} onValueChange={v => update("premisesState", v)}>
                      <SelectTrigger><SelectValue placeholder="ST" /></SelectTrigger>
                      <SelectContent className="max-h-60">{STATE_ABBR.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>ZIP</Label><Input value={formData.premisesZip} onChange={e => update("premisesZip", formatZipCode(e.target.value))} /></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><Label>Suite / Unit</Label><Input value={formData.premisesUnit} onChange={e => update("premisesUnit", e.target.value)} placeholder="Suite 210" /></div>
                  <div><Label>Square Footage</Label><Input value={formData.squareFootage} onChange={e => update("squareFootage", e.target.value)} placeholder="2,400" /></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Property Type</Label>
                    <Select value={formData.propertyType} onValueChange={v => update("propertyType", v)}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>{PROPERTY_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>Parking Spaces</Label><Input value={formData.parkingSpaces} onChange={e => update("parkingSpaces", e.target.value)} placeholder="6" /></div>
                </div>
                <div>
                  <Label>Additional Description (optional)</Label>
                  <Textarea rows={2} value={formData.premisesDescription} onChange={e => update("premisesDescription", e.target.value)} placeholder="Ground floor corner unit with street frontage and rear loading dock." />
                </div>
                <div>
                  <Label>Permitted Use *</Label>
                  <Input value={formData.permittedUse} onChange={e => update("permittedUse", e.target.value)} placeholder="Operation of a retail coffee shop and bakery" />
                  <p className="text-xs text-slate-500 mt-1">Be specific — this limits what the tenant may do on the premises.</p>
                </div>
              </div>

              {/* Term */}
              <div className="space-y-4 pt-6 border-t border-slate-200">
                <H2>Lease Term</H2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><Label>Commencement Date</Label><Input type="date" value={formData.leaseStartDate} onChange={e => update("leaseStartDate", e.target.value)} /></div>
                  <div><Label>Expiration Date</Label><Input type="date" value={formData.leaseEndDate} onChange={e => update("leaseEndDate", e.target.value)} /></div>
                </div>
                <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 cursor-pointer">
                  <input type="checkbox" checked={formData.renewalOption} onChange={e => update("renewalOption", e.target.checked)} className="w-4 h-4" />
                  <span className="text-sm">Include a renewal option</span>
                </label>
                {formData.renewalOption && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pl-4">
                    <div><Label>Number of Terms</Label><Input value={formData.renewalTerms} onChange={e => update("renewalTerms", e.target.value)} placeholder="one (1)" /></div>
                    <div><Label>Length of Each</Label><Input value={formData.renewalLength} onChange={e => update("renewalLength", e.target.value)} placeholder="three (3) years" /></div>
                    <div><Label>Notice (days)</Label><Input value={formData.renewalNoticeDays} onChange={e => update("renewalNoticeDays", e.target.value)} /></div>
                  </div>
                )}
              </div>

              {/* Lease type */}
              <div className="space-y-4 pt-6 border-t border-slate-200">
                <H2>Lease Type</H2>
                <div className="space-y-2">
                  {LEASE_TYPES.map(t => (
                    <button
                      key={t.value} type="button"
                      onClick={() => update("leaseType", t.value)}
                      className={`w-full text-left p-3 rounded-lg border-2 transition-colors ${
                        formData.leaseType === t.value ? "border-green-500 bg-green-50" : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="font-semibold text-sm text-slate-900">{t.label}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{t.blurb}</div>
                    </button>
                  ))}
                </div>

                {formData.leaseType === "percentage" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-4">
                    <div><Label>Percentage of Gross Sales (%)</Label><Input value={formData.percentageRate} onChange={e => update("percentageRate", e.target.value)} placeholder="6" /></div>
                    <div><Label>Annual Breakpoint ($)</Label><Input value={formData.percentageBreakpoint} onChange={e => update("percentageBreakpoint", e.target.value)} placeholder="250000" /></div>
                  </div>
                )}

                {formData.leaseType !== "gross" && (
                  <div>
                    <Label>Estimated CAM / Additional Rent (per month)</Label>
                    <Input value={formData.camCharges} onChange={e => update("camCharges", e.target.value)} placeholder="450" />
                  </div>
                )}
              </div>

              {/* Rent */}
              <div className="space-y-4 pt-6 border-t border-slate-200">
                <H2>Rent</H2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Monthly Base Rent ($) *</Label>
                    <Input value={formData.monthlyRent} onChange={e => update("monthlyRent", e.target.value)} placeholder="4500" />
                  </div>
                  <div>
                    <Label>Annual Base Rent ($)</Label>
                    <Input value={formData.annualRent} onChange={e => update("annualRent", e.target.value)} />
                    <p className="text-xs text-slate-500 mt-1">Auto-calculated from monthly rent.</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><Label>Rent Due Day</Label><Input value={formData.rentDueDay} onChange={e => update("rentDueDay", e.target.value)} placeholder="1st" /></div>
                  <div><Label>Payment Method</Label><Input value={formData.rentPaymentMethod} onChange={e => update("rentPaymentMethod", e.target.value)} placeholder="ACH transfer" /></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><Label>Late Fee ($)</Label><Input value={formData.lateFee} onChange={e => update("lateFee", e.target.value)} placeholder="150" /></div>
                  <div><Label>Grace Period (days)</Label><Input value={formData.lateFeeGraceDays} onChange={e => update("lateFeeGraceDays", e.target.value)} /></div>
                </div>

                <div>
                  <Label>Annual Rent Escalation</Label>
                  <RadioGroup value={formData.rentIncreaseType} onValueChange={v => update("rentIncreaseType", v)} className="mt-2 flex flex-wrap gap-5">
                    {[["none","None"],["percentage","Percentage"],["fixed","Fixed amount"]].map(([v,l]) => (
                      <div key={v} className="flex items-center space-x-2">
                        <RadioGroupItem value={v} id={`esc-${v}`} />
                        <Label htmlFor={`esc-${v}`} className="cursor-pointer font-normal">{l}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                  {formData.rentIncreaseType === "percentage" && (
                    <Input className="mt-3" value={formData.rentIncreasePercent} onChange={e => update("rentIncreasePercent", e.target.value)} placeholder="3 (percent per year)" />
                  )}
                  {formData.rentIncreaseType === "fixed" && (
                    <Input className="mt-3" value={formData.rentIncreaseAmount} onChange={e => update("rentIncreaseAmount", e.target.value)} placeholder="150 (dollars per year)" />
                  )}
                </div>
              </div>

              {/* Deposit & utilities */}
              <div className="space-y-4 pt-6 border-t border-slate-200">
                <H2>Deposit, Utilities &amp; Maintenance</H2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><Label>Security Deposit ($)</Label><Input value={formData.securityDeposit} onChange={e => update("securityDeposit", e.target.value)} placeholder="9000" /></div>
                  <div><Label>Deposit Return (days)</Label><Input value={formData.depositReturnDays} onChange={e => update("depositReturnDays", e.target.value)} /></div>
                </div>

                <div>
                  <Label>Who pays utilities?</Label>
                  <RadioGroup value={formData.utilitiesPaidBy} onValueChange={v => update("utilitiesPaidBy", v)} className="mt-2 flex flex-wrap gap-5">
                    {[["tenant","Tenant"],["landlord","Landlord"],["shared","Shared"]].map(([v,l]) => (
                      <div key={v} className="flex items-center space-x-2">
                        <RadioGroupItem value={v} id={`util-${v}`} />
                        <Label htmlFor={`util-${v}`} className="cursor-pointer font-normal">{l}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                  {formData.utilitiesPaidBy === "shared" && (
                    <Textarea className="mt-3" rows={2} value={formData.utilitiesDetail} onChange={e => update("utilitiesDetail", e.target.value)} placeholder="Landlord pays water and trash; Tenant pays electricity, gas, and internet." />
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><Label>HVAC Responsibility</Label><Input value={formData.hvacResponsibility} onChange={e => update("hvacResponsibility", e.target.value)} placeholder="Tenant maintains; Landlord replaces" /></div>
                  <div><Label>Tenant Improvement Allowance ($)</Label><Input value={formData.tenantImprovementAllowance} onChange={e => update("tenantImprovementAllowance", e.target.value)} placeholder="15000" /></div>
                </div>
              </div>

              {/* Other terms */}
              <div className="space-y-4 pt-6 border-t border-slate-200">
                <H2>Other Terms</H2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><Label>Liability Insurance Minimum ($)</Label><Input value={formData.liabilityInsuranceAmount} onChange={e => update("liabilityInsuranceAmount", e.target.value)} /></div>
                  <div><Label>Holdover Rent (% of rent)</Label><Input value={formData.holdoverPercent} onChange={e => update("holdoverPercent", e.target.value)} /></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><Label>Rent Default Cure (days)</Label><Input value={formData.defaultCureDays} onChange={e => update("defaultCureDays", e.target.value)} /></div>
                  <div><Label>Other Default Cure (days)</Label><Input value={formData.defaultCureDaysOther} onChange={e => update("defaultCureDaysOther", e.target.value)} /></div>
                </div>
                <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 cursor-pointer">
                  <input type="checkbox" checked={formData.allowSublease} onChange={e => update("allowSublease", e.target.checked)} className="w-4 h-4" />
                  <span className="text-sm">Allow assignment / subletting with landlord consent</span>
                </label>
                <div>
                  <Label>Additional Provisions (optional)</Label>
                  <Textarea rows={4} value={formData.additionalProvisions} onChange={e => update("additionalProvisions", e.target.value)} placeholder="Exclusive use clause, signage rights, right of first refusal, etc." />
                </div>
              </div>

              {/* Execution */}
              <div className="space-y-4 pt-6 border-t border-slate-200">
                <H2>Execution Blocks</H2>
                <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 cursor-pointer">
                  <input type="checkbox" checked={formData.includeGuarantor} onChange={e => update("includeGuarantor", e.target.checked)} className="w-4 h-4" />
                  <span className="text-sm">Include a personal guaranty</span>
                </label>
                {formData.includeGuarantor && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-4">
                    <div><Label>Guarantor Name</Label><Input value={formData.guarantorName} onChange={e => update("guarantorName", e.target.value)} /></div>
                    <div><Label>Guarantor Address</Label><Input value={formData.guarantorAddress} onChange={e => update("guarantorAddress", e.target.value)} /></div>
                  </div>
                )}
                <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 cursor-pointer">
                  <input type="checkbox" checked={formData.includeNotary} onChange={e => update("includeNotary", e.target.checked)} className="w-4 h-4" />
                  <span className="text-sm">Include notary acknowledgment block</span>
                </label>
                {formData.includeNotary && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-4">
                    <div><Label>Notary State</Label><Input value={formData.notaryState} onChange={e => update("notaryState", e.target.value)} placeholder={formData.governingState} /></div>
                    <div><Label>County</Label><Input value={formData.notaryCounty} onChange={e => update("notaryCounty", e.target.value)} /></div>
                  </div>
                )}
              </div>

              {/* Signatures */}
              <div className="space-y-6 pt-6 border-t border-slate-200">
                <H2>Signatures</H2>
                <p className="text-sm text-slate-500">Sign here, or leave blank and sign by hand after printing.</p>

                <SignatureBlock {...sigProps} which="landlord" mode={landlordSigMode} label="Landlord Signature"
                  nameValue={formData.landlordName} imageField="landlordSignatureImage" inputRef={landlordSigRef} />

                <div className="pt-4 border-t border-slate-100">
                  <SignatureBlock {...sigProps} which="tenant" mode={tenantSigMode} label="Tenant Signature"
                    nameValue={formData.tenantName} imageField="tenantSignatureImage" inputRef={tenantSigRef} />
                </div>

                {formData.includeGuarantor && (
                  <div className="pt-4 border-t border-slate-100">
                    <SignatureBlock {...sigProps} which="guarantor" mode={guarantorSigMode} label="Guarantor Signature"
                      nameValue={formData.guarantorName} imageField="guarantorSignatureImage" inputRef={guarantorSigRef} />
                  </div>
                )}
              </div>
            </form>

            {/* FAQ */}
            <div className="mt-8 bg-white p-8 rounded-lg shadow-sm border border-slate-200">
              <H2>Frequently Asked Questions</H2>
              <div className="mt-4">
                <Accordion type="single" collapsible>
                  <AccordionItem value="q1">
                    <AccordionTrigger>What's the difference between NNN and gross rent?</AccordionTrigger>
                    <AccordionContent>
                      In a triple net (NNN) lease the tenant pays base rent plus their share of property taxes, building insurance, and
                      common area maintenance. In a gross (full service) lease the tenant pays one number and the landlord absorbs those
                      operating costs. A NNN base rent looks cheaper on paper but the tenant's true monthly cost is higher once the
                      "nets" are added.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="q2">
                    <AccordionTrigger>What is CAM?</AccordionTrigger>
                    <AccordionContent>
                      CAM stands for Common Area Maintenance — the cost of maintaining shared spaces like parking lots, lobbies,
                      landscaping, and exterior lighting. In net leases, tenants pay a proportionate share based on their square
                      footage relative to the building.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="q3">
                    <AccordionTrigger>Should I require a personal guaranty?</AccordionTrigger>
                    <AccordionContent>
                      If your tenant is an LLC or corporation, the entity alone may have few assets. A personal guaranty makes an
                      individual owner personally liable for the rent, which is standard for small business tenants and startups.
                      Established tenants with strong financials often negotiate it away or limit it to a set number of months.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="q4">
                    <AccordionTrigger>Do commercial leases have to be notarized?</AccordionTrigger>
                    <AccordionContent>
                      Usually not. A commercial lease is generally valid once both parties sign. Some states require notarization or
                      recording for long leases (often over one to three years), and lenders sometimes ask for it. The notary block is
                      optional in this generator so you can include it when you need it.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="q5">
                    <AccordionTrigger>Are commercial tenants protected like residential tenants?</AccordionTrigger>
                    <AccordionContent>
                      Much less so. Most residential tenant protections do not apply to commercial leases — courts generally assume
                      both parties are sophisticated and enforce the contract as written. That makes the specific terms in your lease
                      considerably more important than in a residential rental.
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            </div>
          </div>

          {/* ── PREVIEW + PAYMENT ── */}
          <div className="lg:col-span-5">
            <div className="sticky top-24 space-y-6">
              <div className="p-6 bg-green-50 border-2 border-green-200 rounded-md">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ fontFamily: "Outfit, sans-serif", color: "#1a4731" }}>
                  <Building2 className="w-5 h-5" /> Lease Summary
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-slate-700">Landlord:</span><span className="font-medium text-slate-900">{formData.landlordName || "—"}</span></div>
                  <div className="flex justify-between"><span className="text-slate-700">Tenant:</span><span className="font-medium text-slate-900">{formData.tenantName || "—"}</span></div>
                  <div className="border-t border-green-300 my-2" />
                  <div className="flex justify-between"><span className="text-slate-700">Property:</span><span className="font-medium text-slate-900 text-right">{formData.premisesAddress || "—"}</span></div>
                  {formData.squareFootage && <div className="flex justify-between"><span className="text-slate-700">Size:</span><span className="font-medium text-slate-900">{formData.squareFootage} sq ft</span></div>}
                  <div className="flex justify-between"><span className="text-slate-700">Lease type:</span><span className="font-medium text-slate-900 text-right">{selectedLeaseType?.label || "—"}</span></div>
                  <div className="border-t border-green-300 my-2" />
                  <div className="flex justify-between font-bold"><span className="text-green-800">Monthly rent:</span><span className="text-green-800">{formData.monthlyRent ? `$${Number(String(formData.monthlyRent).replace(/[^0-9.]/g,"")).toLocaleString()}` : "—"}</span></div>
                  {formData.securityDeposit && <div className="flex justify-between"><span className="text-slate-700">Deposit:</span><span className="font-medium text-slate-900">${Number(String(formData.securityDeposit).replace(/[^0-9.]/g,"")).toLocaleString()}</span></div>}
                </div>
              </div>

              <div className="p-4 bg-white border-2 border-slate-200 rounded-md">
                <h3 className="text-lg font-bold mb-3" style={{ fontFamily: "Outfit, sans-serif", color: "#1a4731" }}>Live Preview</h3>
                {isGeneratingPreview ? (
                  <div className="flex items-center justify-center h-64 text-slate-400 gap-2"><Loader2 className="w-5 h-5 animate-spin" /> Generating preview…</div>
                ) : pdfPreview ? (
                  <>
                    <img src={pdfPreview} alt="Commercial lease preview" className="w-full border border-slate-200 rounded" />
                    <p className="text-xs text-slate-400 mt-2 text-center">Page 1 shown — full lease is multiple pages</p>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-64 text-slate-400 text-center px-4">
                    <Building2 className="w-10 h-10 mb-2 opacity-40" />
                    <p className="text-sm">Enter the landlord, tenant, and property address to see a live preview.</p>
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
                      {isProcessing ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Generating…</> : "Download Lease (Included in Plan)"}
                    </Button>
                  </div>
                ) : (
                  <>
                    <CouponInput generatorType="commercial-lease" originalPrice={PRICE} onDiscountApplied={setAppliedDiscount} />
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
                  Commercial leases carry significant financial obligations and vary by state. For long-term or high-value leases,
                  have an attorney review the document before signing.
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

import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import AppLayout from "@/components/AppLayout";
import {
  IonAccordion, IonAccordionGroup, IonInput, IonSelect, IonSelectOption,
  IonList, IonItem, IonLabel, IonButton, IonIcon, IonGrid, IonRow, IonCol,
  IonNote, IonSpinner, IonSegment, IonSegmentButton, IonCheckbox, IonToggle,
  IonBadge, IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonContent,
} from "@ionic/react";
import { trashOutline, addOutline, cloudDownloadOutline, eyeOutline, closeOutline, chevronBackOutline, chevronForwardOutline, pricetagOutline } from "ionicons/icons";
import { generateAndDownloadCanadianPaystub } from "@/utils/canadianPaystubGenerator";
import { generateAllCanadianPreviewPDFs } from "@/utils/canadianPaystubPreviewGenerator";
import {
  CANADIAN_PROVINCES,
  formatSIN, validateSIN,
  formatPostalCode, validatePostalCode,
} from "@/utils/canadianTaxRates";
import {
  formatPhoneNumber, validatePhoneNumber,
  formatBankLast4, validateBankLast4,
} from "@/utils/validation";
import GustoLogo from "../../assests/gustoLogo.png";
import WorkdayLogo from "../../assests/workday-logo.png";
import OnPayLogo from "../../assests/onpayLogo.webp";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";

const isLocalhost = typeof window !== "undefined" &&
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

const PAYROLL_COMPANIES = [
  { id: "gusto",   name: "Gusto",   template: "template-a", logo: GustoLogo },
  { id: "workday", name: "Workday", template: "template-c", logo: WorkdayLogo },
  { id: "onpay",   name: "OnPay",   template: "template-h", logo: OnPayLogo },
];

const STORAGE_KEY = "canadianPaystubFormData";

const defaultFormData = {
  name: "", sin: "", bank: "", bankName: "",
  address: "", city: "", province: "ON", postalCode: "",
  company: "", companyAddress: "", companyCity: "", companyProvince: "ON",
  companyPostalCode: "", companyPhone: "",
  hireDate: "", startDate: "", endDate: "",
  rate: "", payFrequency: "biweekly", payDay: "Friday",
  hoursList: "", overtimeList: "", commissionList: "",
  startDateList: "", endDateList: "", payDateList: "",
  workerType: "employee", payType: "hourly", annualSalary: "",
  employeeId: "", companyCode: "", locDept: "", checkNumber: "",
  maritalStatus: "single", federalAllowances: "0", provincialAllowances: "0",
};

const deductionTypes = [
  { label: "Health Insurance",    value: "health_insurance",    preTax: true },
  { label: "Dental Insurance",    value: "dental_insurance",    preTax: true },
  { label: "Vision Insurance",    value: "vision_insurance",    preTax: true },
  { label: "Life Insurance",      value: "life_insurance",      preTax: false },
  { label: "Disability Insurance",value: "disability_insurance",preTax: false },
  { label: "Union Dues",          value: "union_dues",          preTax: false },
  { label: "Parking",             value: "parking",             preTax: false },
  { label: "Other",               value: "other",               preTax: false },
];

const contributionTypes = [
  { label: "RRSP (Pre-Tax)",   value: "rrsp",          preTax: true },
  { label: "TFSA (Post-Tax)",  value: "tfsa",          preTax: false },
  { label: "Group Benefits",   value: "group_benefits", preTax: true },
  { label: "Pension Plan",     value: "pension_plan",  preTax: true },
  { label: "Other",            value: "other",         preTax: false },
];

const employerBenefitTypes = [
  { label: "RRSP Employer Match",           value: "rrsp_match" },
  { label: "Employer Paid Life Insurance",  value: "life_insurance" },
  { label: "Employer Paid Health Insurance",value: "health_insurance" },
  { label: "Employer Paid Dental",          value: "dental" },
  { label: "Employer Paid Vision",          value: "vision" },
  { label: "Employer Disability Insurance", value: "disability" },
  { label: "Other Employer Benefit",        value: "other" },
];

export default function AppCanadianPaystub() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const templateFromUrl = searchParams.get("template");

  // ── Auth / subscription ──────────────────────────────────────────────────
  const [user,                  setUser]                  = useState(null);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [isProcessing,          setIsProcessing]          = useState(false);
  const [appliedDiscount,       setAppliedDiscount]       = useState(null); // eslint-disable-line

  // ── Template ─────────────────────────────────────────────────────────────
  const [selectedTemplate, setSelectedTemplate] = useState(() => {
    if (templateFromUrl && ["template-a","template-c","template-h"].includes(templateFromUrl)) return templateFromUrl;
    try {
      const saved = localStorage.getItem("canadianPaystubTemplate");
      if (saved && ["template-a","template-c","template-h"].includes(saved)) return saved;
    } catch {}
    return "template-a";
  });

  useEffect(() => {
    try { localStorage.setItem("canadianPaystubTemplate", selectedTemplate); } catch {}
  }, [selectedTemplate]);

  // ── Company logo ─────────────────────────────────────────────────────────
  const [companySearchQuery,    setCompanySearchQuery]    = useState("");
  const [selectedPayrollCompany,setSelectedPayrollCompany]= useState(null);
  const [showCompanyDropdown,   setShowCompanyDropdown]   = useState(false);
  const [companyLogo,           setCompanyLogo]           = useState(null);
  const [logoPreview,           setLogoPreview]           = useState(null);
  const [isDragging,            setIsDragging]            = useState(false);
  const [logoError,             setLogoError]             = useState("");
  const companySearchRef = useRef(null);
  const logoInputRef     = useRef(null);

  // ── Per-period state ──────────────────────────────────────────────────────
  const [hoursExpanded,   setHoursExpanded]   = useState(false);
  const [hoursPerPeriod,  setHoursPerPeriod]  = useState([]);
  const [deductions,      setDeductions]      = useState([]);
  const [contributions,   setContributions]   = useState([]);
  const [absencePlans,    setAbsencePlans]    = useState([]);
  const [employerBenefits,setEmployerBenefits]= useState([]);

  // ── Form data ────────────────────────────────────────────────────────────
  const [formData, setFormData] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return { ...defaultFormData, ...JSON.parse(saved) };
    } catch {}
    return defaultFormData;
  });

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(formData)); } catch {}
  }, [formData]);

  // ── Validation errors ────────────────────────────────────────────────────
  const [validationErrors, setValidationErrors] = useState({
    sin: "", bank: "", postalCode: "", companyPostalCode: "", companyPhone: "",
    companyCode: "", locDept: "", checkNumber: "",
  });

  const formatCurrency = (num) =>
    Number(num).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // ── Subscription check ────────────────────────────────────────────────────
  useEffect(() => { checkUserSubscription(); }, []);

  const checkUserSubscription = async () => {
    const token    = localStorage.getItem("userToken");
    const userInfo = localStorage.getItem("userInfo");
    if (token && userInfo) {
      try {
        const userData = JSON.parse(userInfo);
        setUser(userData);
        if (userData.subscription?.status === "active" &&
            (userData.subscription.downloads_remaining > 0 || userData.subscription.downloads_remaining === -1)) {
          setHasActiveSubscription(true);
        }
        const res = await fetch(`${BACKEND_URL}/api/user/me`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.user) {
            setUser(data.user);
            localStorage.setItem("userInfo", JSON.stringify(data.user));
            if (data.user.subscription?.status === "active" &&
                (data.user.subscription.downloads_remaining > 0 || data.user.subscription.downloads_remaining === -1)) {
              setHasActiveSubscription(true);
            } else {
              setHasActiveSubscription(false);
            }
          }
        }
      } catch (err) { console.error("Error checking subscription:", err); }
    }
  };

  // ── Subscription download ─────────────────────────────────────────────────
  const handleSubscriptionDownload = async () => {
    const token = localStorage.getItem("userToken");
    if (!token) { toast.error("Please log in to use your subscription"); navigate("/login"); return; }
    setIsProcessing(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/user/subscription-download`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ documentType: "canadian-paystub", template: selectedTemplate, count: calculateNumStubs }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to process subscription download");

      const fullFormData = {
        ...formData, deductions, contributions, absencePlans, employerBenefits,
        companyLogo, logoDataUrl: logoPreview,
      };
      const shouldSave = !!user;
      const pdfBlob = await generateAndDownloadCanadianPaystub(fullFormData, selectedTemplate, calculateNumStubs, shouldSave);

      if (shouldSave && pdfBlob) {
        try {
          const reader = new FileReader();
          reader.onloadend = async () => {
            const base64Data = reader.result.split(",")[1];
            const fileExt = calculateNumStubs > 1 ? ".zip" : ".pdf";
            const fileName = `canadian_paystub_${new Date().toISOString().split("T")[0]}${fileExt}`;
            await fetch(`${BACKEND_URL}/api/user/saved-documents`, {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
              body: JSON.stringify({ documentType: "canadian-paystub", fileName, fileData: base64Data, template: selectedTemplate }),
            });
            toast.success("Document saved to your account!");
          };
          reader.readAsDataURL(pdfBlob);
        } catch (saveError) { console.error("Failed to save document:", saveError); }
      }

      if (data.downloadsRemaining !== undefined) {
        const updatedUser = { ...user };
        if (updatedUser.subscription) updatedUser.subscription.downloads_remaining = data.downloadsRemaining;
        setUser(updatedUser);
        localStorage.setItem("userInfo", JSON.stringify(updatedUser));
        if (data.downloadsRemaining === 0) setHasActiveSubscription(false);
      }

      localStorage.removeItem("canadianPaystubCompanyLogo");
      setCompanyLogo(null); setLogoPreview(null);
      toast.success("Canadian pay stub(s) downloaded successfully!");
      navigate("/user/downloads");
    } catch (err) {
      console.error("Subscription download error:", err);
      toast.error(err.message || "Failed to download. Please try again.");
    } finally { setIsProcessing(false); }
  };

  // ── handleChange ──────────────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  // ── Validated handlers ────────────────────────────────────────────────────
  const handleSINChange = (val) => {
    const formatted = formatSIN(val);
    setFormData(prev => ({ ...prev, sin: formatted }));
    setValidationErrors(prev => ({ ...prev, sin: validateSIN(formatted).error || "" }));
  };
  const handleBankChange = (val) => {
    const formatted = formatBankLast4(val);
    setFormData(prev => ({ ...prev, bank: formatted }));
    setValidationErrors(prev => ({ ...prev, bank: validateBankLast4(formatted).error || "" }));
  };
  const handlePostalCodeChange = (val) => {
    const formatted = formatPostalCode(val);
    setFormData(prev => ({ ...prev, postalCode: formatted }));
    setValidationErrors(prev => ({ ...prev, postalCode: validatePostalCode(formatted).error || "" }));
  };
  const handleCompanyPostalCodeChange = (val) => {
    const formatted = formatPostalCode(val);
    setFormData(prev => ({ ...prev, companyPostalCode: formatted }));
    setValidationErrors(prev => ({ ...prev, companyPostalCode: validatePostalCode(formatted).error || "" }));
  };
  const handleCompanyPhoneChange = (val) => {
    const formatted = formatPhoneNumber(val);
    setFormData(prev => ({ ...prev, companyPhone: formatted }));
    setValidationErrors(prev => ({ ...prev, companyPhone: validatePhoneNumber(formatted).error || "" }));
  };
  const handleCompanyCodeChange = (val) => {
    const filtered = val.toUpperCase().replace(/[^A-Z0-9\s/]/g, "").slice(0, 20);
    setFormData(prev => ({ ...prev, companyCode: filtered }));
    setValidationErrors(prev => ({ ...prev, companyCode: filtered && filtered.length < 3 ? "Min 3 characters" : "" }));
  };
  const handleLocDeptChange = (val) => {
    const filtered = val.replace(/[^0-9]/g, "").slice(0, 3);
    setFormData(prev => ({ ...prev, locDept: filtered }));
    setValidationErrors(prev => ({ ...prev, locDept: filtered && filtered.length !== 3 ? "Must be 3 digits" : "" }));
  };
  const handleCheckNumberChange = (val) => {
    const filtered = val.replace(/[^0-9]/g, "").slice(0, 7);
    setFormData(prev => ({ ...prev, checkNumber: filtered }));
    setValidationErrors(prev => ({ ...prev, checkNumber: filtered && filtered.length < 6 ? "Must be 6-7 digits" : "" }));
  };

  // ── Worker / template changes ─────────────────────────────────────────────
  const canUseSalary = !(formData.workerType === "contractor" && selectedTemplate === "template-a");

  const handleWorkerTypeChange = (val) => {
    setFormData(prev => {
      const newData = { ...prev, workerType: val };
      if (val === "contractor" && selectedTemplate === "template-a") newData.payType = "hourly";
      return newData;
    });
    if (val === "contractor") setHoursPerPeriod(prev => prev.map(p => ({ ...p, overtime: 0 })));
  };

  const handleTemplateChange = (val) => {
    setSelectedTemplate(val);
    if ((val === "template-b" || val === "template-c") && formData.workerType === "contractor") {
      setFormData(prev => ({ ...prev, workerType: "employee" }));
    }
    if (formData.workerType === "contractor" && val === "template-a") {
      setFormData(prev => ({ ...prev, payType: "hourly" }));
    }
  };

  // ── Payroll company selection ──────────────────────────────────────────────
  const filteredCompanies = PAYROLL_COMPANIES.filter(c =>
    c.name.toLowerCase().includes(companySearchQuery.toLowerCase())
  );

  const handlePayrollCompanySelect = (company) => {
    setSelectedPayrollCompany(company);
    setCompanySearchQuery(company.name);
    setSelectedTemplate(company.template);
    setShowCompanyDropdown(false);
    if ((company.template === "template-b" || company.template === "template-c") && formData.workerType === "contractor") {
      setFormData(prev => ({ ...prev, workerType: "employee" }));
    }
  };

  useEffect(() => {
    const handler = (event) => {
      if (companySearchRef.current && !companySearchRef.current.contains(event.target)) {
        setShowCompanyDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Logo handling ─────────────────────────────────────────────────────────
  const resizeImageToFit = (base64Data, maxWidth, maxHeight) =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(maxWidth / img.width, maxHeight / img.height, 1);
        const canvas = document.createElement("canvas");
        canvas.width  = Math.round(img.width  * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = () => reject(new Error("Failed to load image for resizing"));
      img.src = base64Data;
    });

  const validateAndProcessLogo = async (file) => {
    setLogoError("");
    if (!file.type.includes("png") && !file.type.includes("jpeg") && !file.type.includes("jpg")) {
      setLogoError("Only PNG or JPG files are accepted"); return false;
    }
    if (file.size > 2 * 1024 * 1024) { setLogoError("File size must be under 2MB"); return false; }
    return new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const resizedBase64 = await resizeImageToFit(e.target.result, 360, 105);
          localStorage.setItem("canadianPaystubCompanyLogo", resizedBase64);
          setCompanyLogo(resizedBase64); setLogoPreview(resizedBase64);
          resolve(true);
        } catch { setLogoError("Error processing image"); resolve(false); }
      };
      reader.onerror = () => { setLogoError("Error reading file"); resolve(false); };
      reader.readAsDataURL(file);
    });
  };

  const handleLogoDrop  = async (e) => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files[0]) await validateAndProcessLogo(e.dataTransfer.files[0]); };
  const handleLogoSelect= async (e) => { if (e.target.files[0]) await validateAndProcessLogo(e.target.files[0]); };
  const removeLogo = () => {
    setCompanyLogo(null); setLogoPreview(null);
    localStorage.removeItem("canadianPaystubCompanyLogo");
    if (logoInputRef.current) logoInputRef.current.value = "";
  };

  useEffect(() => { localStorage.removeItem("canadianPaystubCompanyLogo"); setCompanyLogo(null); setLogoPreview(null); }, []);
  useEffect(() => () => { localStorage.removeItem("canadianPaystubCompanyLogo"); }, []);

  // ── calculateNumStubs ────────────────────────────────────────────────────
  const calculateNumStubs = useMemo(() => {
    if (!formData.startDate || !formData.endDate) return 0;
    const diffTime = Math.abs(new Date(formData.endDate) - new Date(formData.startDate));
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const periodLength = formData.payFrequency === "biweekly" ? 14 : 7;
    return Math.ceil(diffDays / periodLength);
  }, [formData.startDate, formData.endDate, formData.payFrequency]);

  // ── payPeriods ───────────────────────────────────────────────────────────
  const payPeriods = useMemo(() => {
    if (!formData.startDate || !formData.endDate || calculateNumStubs === 0) return [];
    const periods = [];
    const periodLength = formData.payFrequency === "biweekly" ? 14 : 7;
    let currentStart = new Date(formData.startDate);
    const fmt = (date) => {
      const d = new Date(date);
      return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
    };
    const getNextPayDay = (date, targetDay) => {
      const days = { Sunday:0,Monday:1,Tuesday:2,Wednesday:3,Thursday:4,Friday:5,Saturday:6 };
      const target = days[targetDay] ?? 5;
      const result = new Date(date);
      while (result.getDay() !== target) result.setDate(result.getDate() + 1);
      return result;
    };
    for (let i = 0; i < calculateNumStubs; i++) {
      const periodEnd = new Date(currentStart);
      periodEnd.setDate(currentStart.getDate() + periodLength - 1);
      const payDate = getNextPayDay(periodEnd, formData.payDay);
      periods.push({
        index: i,
        start: fmt(currentStart), end: fmt(periodEnd), pay: fmt(payDate),
        label: `${currentStart.toLocaleDateString("en-CA",{month:"short",day:"numeric"})} - ${periodEnd.toLocaleDateString("en-CA",{month:"short",day:"numeric",year:"numeric"})}`,
      });
      currentStart = new Date(periodEnd);
      currentStart.setDate(currentStart.getDate() + 1);
    }
    return periods;
  }, [formData.startDate, formData.endDate, formData.payFrequency, formData.payDay, calculateNumStubs]);

  // ── Initialize hoursPerPeriod ────────────────────────────────────────────
  useEffect(() => {
    const defaultHours = formData.payFrequency === "biweekly" ? 80 : 40;
    if (payPeriods.length > 0) {
      setHoursPerPeriod(prev =>
        payPeriods.map((period, i) => ({
          hours:      prev[i]?.hours      ?? defaultHours,
          overtime:   prev[i]?.overtime   ?? 0,
          commission: prev[i]?.commission ?? 0,
          startDate:  prev[i]?.startDate  ?? period.start,
          endDate:    prev[i]?.endDate    ?? period.end,
          payDate:    prev[i]?.payDate    ?? period.pay,
          checkNumber:prev[i]?.checkNumber?? "",
          memo:       prev[i]?.memo       ?? "",
        }))
      );
    } else {
      setHoursPerPeriod([]);
    }
  }, [payPeriods.length, formData.payFrequency]);

  // ── Sync hoursPerPeriod → formData ───────────────────────────────────────
  useEffect(() => {
    if (hoursPerPeriod.length > 0) {
      setFormData(prev => ({
        ...prev,
        hoursList:     hoursPerPeriod.map(p => p.hours).join(", "),
        overtimeList:  hoursPerPeriod.map(p => p.overtime).join(", "),
        commissionList:hoursPerPeriod.map(p => p.commission).join(", "),
        startDateList: hoursPerPeriod.map(p => p.startDate || "").join(", "),
        endDateList:   hoursPerPeriod.map(p => p.endDate || "").join(", "),
        payDateList:   hoursPerPeriod.map(p => p.payDate || "").join(", "),
      }));
    }
  }, [hoursPerPeriod]);

  const handlePeriodHoursChange = (index, field, value) => {
    setHoursPerPeriod(prev => {
      const updated = [...prev];
      const stringFields = ["startDate","endDate","payDate","checkNumber","memo"];
      updated[index] = { ...updated[index], [field]: stringFields.includes(field) ? value : (parseFloat(value) || 0) };
      return updated;
    });
  };

  // ── PDF preview state ─────────────────────────────────────────────────────
  const [pdfPreviews,         setPdfPreviews]         = useState([]);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [previewModalOpen,    setPreviewModalOpen]    = useState(false);
  const [previewPageIndex,    setPreviewPageIndex]    = useState(0);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (formData.startDate && formData.endDate && (formData.rate || formData.annualSalary)) {
        setIsGeneratingPreview(true);
        try {
          const previewData = {
            ...formData, deductions, contributions, absencePlans, employerBenefits,
            logoDataUrl: logoPreview,
          };
          const diffTime = Math.abs(new Date(formData.endDate) - new Date(formData.startDate));
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          const periodLength = formData.payFrequency === "biweekly" ? 14 : 7;
          const numStubs = Math.max(1, Math.ceil(diffDays / periodLength));
          const previews = await generateAllCanadianPreviewPDFs(previewData, selectedTemplate, numStubs);
          setPdfPreviews(previews);
          if (previewPageIndex >= previews.length) setPreviewPageIndex(0);
        } catch (err) { console.error("Preview generation failed:", err); }
        setIsGeneratingPreview(false);
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [formData, selectedTemplate, deductions, contributions, absencePlans, employerBenefits, logoPreview]);

  // ── Coupon state ──────────────────────────────────────────────────────────
  const [couponCode,         setCouponCode]         = useState("");
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [couponError,        setCouponError]        = useState("");

  const validateCoupon = async () => {
    if (!couponCode.trim()) { setCouponError("Please enter a coupon code"); return; }
    setIsValidatingCoupon(true); setCouponError("");
    try {
      const res = await fetch(`${BACKEND_URL}/api/validate-coupon`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode.trim(), generatorType: "canadian-paystub" }),
      });
      const data = await res.json();
      if (res.ok && data.valid) {
        const base = calculateNumStubs * 9.99;
        const discountAmount = base * data.discountPercent / 100;
        setAppliedDiscount({ code: data.code, discountPercent: data.discountPercent, originalPrice: base, discountedPrice: parseFloat((base - discountAmount).toFixed(2)) });
        toast.success(`Coupon applied: ${data.discountPercent}% off!`);
      } else {
        setCouponError(data.detail || "Invalid coupon code");
        setAppliedDiscount(null);
      }
    } catch { setCouponError("Error validating coupon"); setAppliedDiscount(null); }
    finally { setIsValidatingCoupon(false); }
  };

  const removeCoupon = () => { setCouponCode(""); setAppliedDiscount(null); setCouponError(""); };

  // ── Deductions helpers ────────────────────────────────────────────────────
  const addDeduction    = () => setDeductions(prev => [...prev, { id: Date.now(), type:"other", name:"", amount:"", isPercentage:false, preTax:false }]);
  const removeDeduction = (id) => setDeductions(prev => prev.filter(d => d.id !== id));
  const updateDeduction = (id, field, value) => setDeductions(prev => prev.map(d => {
    if (d.id !== id) return d;
    const updated = { ...d, [field]: value };
    if (field === "type") { const t = deductionTypes.find(x=>x.value===value); if (t) updated.preTax = t.preTax; }
    return updated;
  }));

  // ── Contributions helpers ─────────────────────────────────────────────────
  const addContribution    = () => setContributions(prev => [...prev, { id: Date.now(), type:"other", name:"", amount:"", isPercentage:false, preTax:false }]);
  const removeContribution = (id) => setContributions(prev => prev.filter(c => c.id !== id));
  const updateContribution = (id, field, value) => setContributions(prev => prev.map(c => {
    if (c.id !== id) return c;
    const updated = { ...c, [field]: value };
    if (field === "type") { const t = contributionTypes.find(x=>x.value===value); if (t) updated.preTax = t.preTax; }
    return updated;
  }));

  // ── Absence plans ─────────────────────────────────────────────────────────
  const addAbsencePlan    = () => setAbsencePlans(prev => [...prev, { id: Date.now(), description:"PTO Plan", accrued:"", reduced:"" }]);
  const removeAbsencePlan = (id) => setAbsencePlans(prev => prev.filter(p => p.id !== id));
  const updateAbsencePlan = (id, field, value) => setAbsencePlans(prev => prev.map(p => p.id===id ? {...p,[field]:value} : p));

  // ── Employer benefits ─────────────────────────────────────────────────────
  const addEmployerBenefit    = () => setEmployerBenefits(prev => [...prev, { id: Date.now(), type:"rrsp_match", name:"RRSP Employer Match", amount:"", isPercentage:false, matchPercent:50, matchUpTo:6 }]);
  const removeEmployerBenefit = (id) => setEmployerBenefits(prev => prev.filter(b => b.id !== id));
  const updateEmployerBenefit = (id, field, value) => setEmployerBenefits(prev => prev.map(b => {
    if (b.id !== id) return b;
    const updated = { ...b, [field]: value };
    if (field === "type") { const t = employerBenefitTypes.find(x=>x.value===value); if (t && value !== "other") updated.name = t.label; }
    return updated;
  }));

  // ── Clear form ────────────────────────────────────────────────────────────
  const clearForm = () => {
    if (!window.confirm("Clear the form? All entered data will be lost.")) return;
    setFormData(defaultFormData);
    setDeductions([]); setContributions([]); setAbsencePlans([]); setEmployerBenefits([]); setHoursPerPeriod([]);
    setCompanyLogo(null); setLogoPreview(null); setSelectedPayrollCompany(null); setCompanySearchQuery("");
    localStorage.removeItem(STORAGE_KEY); localStorage.removeItem("canadianPaystubTemplate"); localStorage.removeItem("canadianPaystubCompanyLogo");
    toast.success("Form cleared successfully");
  };

  // ── Generate / download ───────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (calculateNumStubs === 0) { toast.error("Please configure at least one pay period"); return; }
    if (hasActiveSubscription) { await handleSubscriptionDownload(); return; }

    setIsProcessing(true);
    try {
      const baseAmount = calculateNumStubs * 9.99;
      const finalAmount = appliedDiscount ? appliedDiscount.discountedPrice : baseAmount;
      const origin = window.location.origin;
      const fullFormData = { ...formData, deductions, contributions, absencePlans, employerBenefits, companyLogo, logoDataUrl: logoPreview };
      localStorage.setItem("pendingCanadianPaystubData", JSON.stringify(fullFormData));
      localStorage.setItem("pendingCanadianPaystubTemplate", selectedTemplate);
      localStorage.setItem("pendingCanadianPaystubCount", calculateNumStubs.toString());

      const res = await fetch(`${BACKEND_URL}/api/stripe/create-one-time-checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: finalAmount,
          documentType: "canadian-paystub",
          discountCode: appliedDiscount?.code || null,
          discountAmount: appliedDiscount ? baseAmount - finalAmount : 0,
          template: selectedTemplate,
          successUrl: `${origin}/payment-success?type=canadian-paystub&count=${calculateNumStubs}&session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${origin}/app/canadian-paystub`,
          quantity: calculateNumStubs,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to create checkout session");
      if (data.url) window.location.href = data.url;
      else throw new Error("No checkout URL received");
    } catch (err) {
      toast.error(err.message || "Payment failed. Please try again.");
    } finally { setIsProcessing(false); }
  };

  const ionInputStyle = { marginBottom: 8 };

  return (
    <AppLayout fillHeight>
      <div style={{ height: "100%", overflowY: "auto", padding: "16px" }}>

        {/* Header */}
        <div style={{ marginBottom: 16 }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--ion-color-primary)", margin: 0 }}>
            Canadian Pay Stub Generator
          </h1>
          <p style={{ color: "var(--ion-color-medium)", marginTop: 4, fontSize: "0.875rem" }}>
            Generate professional Canadian pay stubs with CPP, EI, and provincial tax calculations.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 16 }}>

          {/* ── LEFT: Form ── */}
          <div style={{ minWidth: 0 }}>
            <IonAccordionGroup multiple>

              {/* ── Template / Payroll Company ── */}
              <IonAccordion value="template">
                <IonItem slot="header" color="light">
                  <IonLabel><strong>Template &amp; Payroll Provider</strong></IonLabel>
                </IonItem>
                <div slot="content" style={{ padding: "12px 16px" }}>
                  <div style={{ position: "relative", marginBottom: 12 }} ref={companySearchRef}>
                    <IonInput
                      fill="outline"
                      labelPlacement="floating"
                      label="Search Payroll Provider"
                      value={companySearchQuery}
                      onIonInput={e => { setCompanySearchQuery(e.detail.value); setShowCompanyDropdown(true); }}
                      onIonFocus={() => setShowCompanyDropdown(true)}
                      placeholder="e.g. Gusto, Workday, OnPay"
                    />
                    {showCompanyDropdown && filteredCompanies.length > 0 && (
                      <div style={{ position: "absolute", zIndex: 999, left: 0, right: 0, background: "var(--ion-card-background)", border: "1px solid var(--ion-color-light)", borderRadius: 8, boxShadow: "0 4px 12px rgba(0,0,0,0.12)", overflow: "hidden" }}>
                        {filteredCompanies.map(company => (
                          <div
                            key={company.id}
                            onClick={() => handlePayrollCompanySelect(company)}
                            style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", cursor: "pointer", borderBottom: "1px solid var(--ion-color-light)", background: selectedPayrollCompany?.id === company.id ? "var(--ion-color-light)" : "transparent" }}
                          >
                            {company.logo && <img src={company.logo} alt={company.name} style={{ width: 36, height: 36, objectFit: "contain" }} />}
                            <div>
                              <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{company.name}</div>
                              <div style={{ fontSize: "0.75rem", color: "var(--ion-color-medium)" }}>
                                {company.template === "template-a" ? "Gusto Style" : company.template === "template-h" ? "OnPay Style" : "Workday Style"}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {selectedPayrollCompany && (
                    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: 10, background: "rgba(var(--ion-color-success-rgb),0.1)", borderRadius: 8, marginBottom: 12, border: "1px solid var(--ion-color-success)" }}>
                      {selectedPayrollCompany.logo && <img src={selectedPayrollCompany.logo} alt={selectedPayrollCompany.name} style={{ width: 48, height: 48, objectFit: "contain" }} />}
                      <div>
                        <div style={{ fontWeight: 700 }}>{selectedPayrollCompany.name}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--ion-color-medium)" }}>Template: {selectedPayrollCompany.template}</div>
                      </div>
                    </div>
                  )}

                  <IonSelect fill="outline" labelPlacement="floating" label="Template" value={selectedTemplate} onIonChange={e => handleTemplateChange(e.detail.value)} style={ionInputStyle}>
                    <IonSelectOption value="template-a">Gusto Style (Template A)</IonSelectOption>
                    <IonSelectOption value="template-c">Workday Style (Template C)</IonSelectOption>
                    <IonSelectOption value="template-h">OnPay Style (Template H)</IonSelectOption>
                    {isLocalhost && <IonSelectOption value="template-b">ADP Style (Template B)</IonSelectOption>}
                  </IonSelect>

                  {/* Logo upload */}
                  <div style={{ marginTop: 12 }}>
                    <p style={{ fontWeight: 600, marginBottom: 8 }}>Company Logo (optional)</p>
                    <div
                      onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                      onDragLeave={e => { e.preventDefault(); setIsDragging(false); }}
                      onDrop={handleLogoDrop}
                      style={{ border: `2px dashed ${isDragging ? "var(--ion-color-primary)" : logoError ? "var(--ion-color-danger)" : "var(--ion-color-medium)"}`, borderRadius: 8, padding: 16, textAlign: "center" }}
                    >
                      {logoPreview ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <img src={logoPreview} alt="logo" style={{ width: 60, height: 60, objectFit: "contain", borderRadius: 8 }} />
                          <div>
                            <div style={{ color: "var(--ion-color-success)", fontWeight: 600 }}>Logo uploaded!</div>
                            <IonButton fill="clear" color="danger" size="small" onClick={removeLogo}>Remove</IonButton>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p style={{ color: "var(--ion-color-medium)", fontSize: "0.875rem", marginBottom: 8 }}>Drag &amp; drop or click to select (PNG/JPG, max 2MB)</p>
                          <IonButton fill="outline" size="small" onClick={() => logoInputRef.current?.click()}>Select File</IonButton>
                          <input ref={logoInputRef} type="file" accept=".png,.jpg,.jpeg,image/png,image/jpeg" onChange={handleLogoSelect} style={{ display: "none" }} />
                        </>
                      )}
                    </div>
                    {logoError && <p style={{ color: "var(--ion-color-danger)", fontSize: "0.75rem", marginTop: 4 }}>{logoError}</p>}
                  </div>
                </div>
              </IonAccordion>

              {/* ── Worker Type ── */}
              <IonAccordion value="worker">
                <IonItem slot="header" color="light">
                  <IonLabel><strong>Worker Type</strong></IonLabel>
                </IonItem>
                <div slot="content" style={{ padding: "12px 16px" }}>
                  {(selectedTemplate === "template-a" || selectedTemplate === "template-h") ? (
                    <IonSegment value={formData.workerType} onIonChange={e => handleWorkerTypeChange(e.detail.value)}>
                      <IonSegmentButton value="employee"><IonLabel>Employee</IonLabel></IonSegmentButton>
                      <IonSegmentButton value="contractor"><IonLabel>Contractor</IonLabel></IonSegmentButton>
                    </IonSegment>
                  ) : (
                    <IonItem lines="none">
                      <IonLabel>Employee — only option for this template</IonLabel>
                    </IonItem>
                  )}
                </div>
              </IonAccordion>

              {/* ── Employee Info ── */}
              <IonAccordion value="employee">
                <IonItem slot="header" color="light">
                  <IonLabel><strong>{formData.workerType === "contractor" ? "Contractor" : "Employee"} Information</strong></IonLabel>
                </IonItem>
                <div slot="content" style={{ padding: "12px 16px" }}>
                  <IonGrid>
                    <IonRow>
                      <IonCol size="12" sizeMd="6">
                        <IonInput fill="outline" labelPlacement="floating" label={formData.workerType === "contractor" ? "Contractor Name *" : "Employee Name *"} name="name" value={formData.name} onIonInput={e => handleChange({ target: { name:"name", value: e.detail.value } })} style={ionInputStyle} />
                      </IonCol>
                      <IonCol size="12" sizeMd="6">
                        <IonInput fill="outline" labelPlacement="floating" label="SIN (Social Insurance Number)" value={formData.sin} onIonInput={e => handleSINChange(e.detail.value)} placeholder="123-456-789" style={ionInputStyle} />
                        {validationErrors.sin && <IonNote color="danger" style={{ fontSize: "0.75rem" }}>{validationErrors.sin}</IonNote>}
                      </IonCol>
                      {selectedTemplate === "template-c" && (
                        <IonCol size="12" sizeMd="6">
                          <IonInput fill="outline" labelPlacement="floating" label="Employee ID *" name="employeeId" value={formData.employeeId} onIonInput={e => handleChange({ target: { name:"employeeId", value: e.detail.value } })} placeholder="100012345" style={ionInputStyle} />
                        </IonCol>
                      )}
                      <IonCol size="12" sizeMd="6">
                        <IonInput fill="outline" labelPlacement="floating" label="Bank Name *" name="bankName" value={formData.bankName} onIonInput={e => handleChange({ target: { name:"bankName", value: e.detail.value } })} style={ionInputStyle} />
                      </IonCol>
                      <IonCol size="12" sizeMd="6">
                        <IonInput fill="outline" labelPlacement="floating" label="Last 4 of Bank Account *" value={formData.bank} onIonInput={e => handleBankChange(e.detail.value)} maxlength={4} placeholder="5678" style={ionInputStyle} />
                        {validationErrors.bank && <IonNote color="danger" style={{ fontSize: "0.75rem" }}>{validationErrors.bank}</IonNote>}
                      </IonCol>
                      <IonCol size="12">
                        <IonInput fill="outline" labelPlacement="floating" label="Address *" name="address" value={formData.address} onIonInput={e => handleChange({ target: { name:"address", value: e.detail.value } })} style={ionInputStyle} />
                      </IonCol>
                      <IonCol size="12" sizeMd="6">
                        <IonInput fill="outline" labelPlacement="floating" label="City *" name="city" value={formData.city} onIonInput={e => handleChange({ target: { name:"city", value: e.detail.value } })} style={ionInputStyle} />
                      </IonCol>
                      <IonCol size="12" sizeMd="6">
                        <IonSelect fill="outline" labelPlacement="floating" label="Province *" value={formData.province} onIonChange={e => setFormData(prev => ({ ...prev, province: e.detail.value }))} style={ionInputStyle}>
                          {CANADIAN_PROVINCES.map(p => <IonSelectOption key={p.code} value={p.code}>{p.name}</IonSelectOption>)}
                        </IonSelect>
                      </IonCol>
                      <IonCol size="12" sizeMd="6">
                        <IonInput fill="outline" labelPlacement="floating" label="Postal Code *" value={formData.postalCode} onIonInput={e => handlePostalCodeChange(e.detail.value)} placeholder="A1A 1A1" style={ionInputStyle} />
                        {validationErrors.postalCode && <IonNote color="danger" style={{ fontSize: "0.75rem" }}>{validationErrors.postalCode}</IonNote>}
                      </IonCol>
                    </IonRow>
                  </IonGrid>
                </div>
              </IonAccordion>

              {/* ── Company Info ── */}
              <IonAccordion value="company">
                <IonItem slot="header" color="light">
                  <IonLabel><strong>Company Information</strong></IonLabel>
                </IonItem>
                <div slot="content" style={{ padding: "12px 16px" }}>
                  <IonGrid>
                    <IonRow>
                      <IonCol size="12" sizeMd="6">
                        <IonInput fill="outline" labelPlacement="floating" label="Company Name *" name="company" value={formData.company} onIonInput={e => handleChange({ target: { name:"company", value: e.detail.value } })} style={ionInputStyle} />
                      </IonCol>
                      <IonCol size="12" sizeMd="6">
                        <IonInput fill="outline" labelPlacement="floating" label="Company Phone *" value={formData.companyPhone} onIonInput={e => handleCompanyPhoneChange(e.detail.value)} placeholder="(555) 123-4567" style={ionInputStyle} />
                        {validationErrors.companyPhone && <IonNote color="danger" style={{ fontSize: "0.75rem" }}>{validationErrors.companyPhone}</IonNote>}
                      </IonCol>
                      <IonCol size="12">
                        <IonInput fill="outline" labelPlacement="floating" label="Company Address *" name="companyAddress" value={formData.companyAddress} onIonInput={e => handleChange({ target: { name:"companyAddress", value: e.detail.value } })} style={ionInputStyle} />
                      </IonCol>
                      <IonCol size="12" sizeMd="6">
                        <IonInput fill="outline" labelPlacement="floating" label="Company City *" name="companyCity" value={formData.companyCity} onIonInput={e => handleChange({ target: { name:"companyCity", value: e.detail.value } })} style={ionInputStyle} />
                      </IonCol>
                      <IonCol size="12" sizeMd="6">
                        <IonSelect fill="outline" labelPlacement="floating" label="Company Province *" value={formData.companyProvince} onIonChange={e => setFormData(prev => ({ ...prev, companyProvince: e.detail.value }))} style={ionInputStyle}>
                          {CANADIAN_PROVINCES.map(p => <IonSelectOption key={p.code} value={p.code}>{p.name}</IonSelectOption>)}
                        </IonSelect>
                      </IonCol>
                      <IonCol size="12" sizeMd="6">
                        <IonInput fill="outline" labelPlacement="floating" label="Company Postal Code *" value={formData.companyPostalCode} onIonInput={e => handleCompanyPostalCodeChange(e.detail.value)} placeholder="A1A 1A1" style={ionInputStyle} />
                        {validationErrors.companyPostalCode && <IonNote color="danger" style={{ fontSize: "0.75rem" }}>{validationErrors.companyPostalCode}</IonNote>}
                      </IonCol>

                      {/* ADP-specific fields */}
                      {selectedTemplate === "template-b" && (
                        <>
                          <IonCol size="12"><p style={{ fontWeight: 600, margin: "8px 0" }}>ADP Document Info (Optional)</p></IonCol>
                          <IonCol size="12" sizeMd="6">
                            <IonInput fill="outline" labelPlacement="floating" label="Company Code" value={formData.companyCode} onIonInput={e => handleCompanyCodeChange(e.detail.value)} maxlength={20} placeholder="e.g., RJ/ABCH 12345678" style={ionInputStyle} />
                            {validationErrors.companyCode && <IonNote color="danger" style={{ fontSize: "0.75rem" }}>{validationErrors.companyCode}</IonNote>}
                          </IonCol>
                          <IonCol size="12" sizeMd="6">
                            <IonInput fill="outline" labelPlacement="floating" label="Loc/Dept (3 digits)" value={formData.locDept} onIonInput={e => handleLocDeptChange(e.detail.value)} maxlength={3} placeholder="017" style={ionInputStyle} />
                            {validationErrors.locDept && <IonNote color="danger" style={{ fontSize: "0.75rem" }}>{validationErrors.locDept}</IonNote>}
                          </IonCol>
                          <IonCol size="12" sizeMd="6">
                            <IonInput fill="outline" labelPlacement="floating" label="Check Number (6-7 digits)" value={formData.checkNumber} onIonInput={e => handleCheckNumberChange(e.detail.value)} maxlength={7} placeholder="1019908" style={ionInputStyle} />
                            {validationErrors.checkNumber && <IonNote color="danger" style={{ fontSize: "0.75rem" }}>{validationErrors.checkNumber}</IonNote>}
                          </IonCol>
                        </>
                      )}

                      {selectedTemplate === "template-h" && (
                        <>
                          <IonCol size="12"><p style={{ fontWeight: 600, margin: "8px 0" }}>OnPay Document Info</p></IonCol>
                          <IonCol size="12" sizeMd="6">
                            <IonInput fill="outline" labelPlacement="floating" label="Employee ID (EMP#)" name="employeeId" value={formData.employeeId} onIonInput={e => handleChange({ target: { name:"employeeId", value: e.detail.value } })} maxlength={10} placeholder="Auto-generated if empty" style={ionInputStyle} />
                          </IonCol>
                        </>
                      )}
                    </IonRow>
                  </IonGrid>
                </div>
              </IonAccordion>

              {/* ── Pay Details ── */}
              <IonAccordion value="pay">
                <IonItem slot="header" color="light">
                  <IonLabel><strong>Pay Details</strong></IonLabel>
                </IonItem>
                <div slot="content" style={{ padding: "12px 16px" }}>
                  <IonSegment value={formData.payType} onIonChange={e => setFormData(prev => ({ ...prev, payType: e.detail.value }))} style={{ marginBottom: 12 }}>
                    <IonSegmentButton value="hourly"><IonLabel>Hourly</IonLabel></IonSegmentButton>
                    <IonSegmentButton value="salary" disabled={!canUseSalary}><IonLabel>Salary</IonLabel></IonSegmentButton>
                  </IonSegment>
                  {!canUseSalary && <IonNote style={{ fontSize: "0.75rem", color: "var(--ion-color-warning)", display: "block", marginBottom: 8 }}>Salary not available for contractors on Gusto template</IonNote>}

                  <IonGrid>
                    <IonRow>
                      <IonCol size="12" sizeMd="6">
                        <IonInput fill="outline" labelPlacement="floating" label={formData.workerType === "contractor" ? "Start Date *" : "Hire Date *"} type="date" name="hireDate" value={formData.hireDate} onIonInput={e => handleChange({ target: { name:"hireDate", value: e.detail.value } })} style={ionInputStyle} />
                      </IonCol>
                      <IonCol size="12" sizeMd="6">
                        {formData.payType === "hourly" ? (
                          <IonInput fill="outline" labelPlacement="floating" label="Hourly Rate (CAD $) *" type="number" name="rate" value={formData.rate} onIonInput={e => handleChange({ target: { name:"rate", value: e.detail.value } })} style={ionInputStyle} />
                        ) : (
                          <IonInput fill="outline" labelPlacement="floating" label="Annual Salary (CAD $) *" type="number" name="annualSalary" value={formData.annualSalary} onIonInput={e => handleChange({ target: { name:"annualSalary", value: e.detail.value } })} style={ionInputStyle} />
                        )}
                      </IonCol>
                      <IonCol size="12" sizeMd="6">
                        <IonSelect fill="outline" labelPlacement="floating" label="Pay Frequency *" value={formData.payFrequency} onIonChange={e => setFormData(prev => ({ ...prev, payFrequency: e.detail.value }))} style={ionInputStyle}>
                          <IonSelectOption value="weekly">Weekly</IonSelectOption>
                          <IonSelectOption value="biweekly">Bi-Weekly</IonSelectOption>
                        </IonSelect>
                      </IonCol>
                      <IonCol size="12" sizeMd="6">
                        <IonSelect fill="outline" labelPlacement="floating" label="Pay Day *" value={formData.payDay} onIonChange={e => setFormData(prev => ({ ...prev, payDay: e.detail.value }))} style={ionInputStyle}>
                          {["Monday","Tuesday","Wednesday","Thursday","Friday"].map(d => <IonSelectOption key={d} value={d}>{d}</IonSelectOption>)}
                        </IonSelect>
                      </IonCol>
                      <IonCol size="12" sizeMd="6">
                        <IonInput fill="outline" labelPlacement="floating" label="Period Start Date *" type="date" name="startDate" value={formData.startDate} onIonInput={e => handleChange({ target: { name:"startDate", value: e.detail.value } })} style={ionInputStyle} />
                      </IonCol>
                      <IonCol size="12" sizeMd="6">
                        <IonInput fill="outline" labelPlacement="floating" label="Period End Date *" type="date" name="endDate" value={formData.endDate} onIonInput={e => handleChange({ target: { name:"endDate", value: e.detail.value } })} style={ionInputStyle} />
                      </IonCol>
                    </IonRow>
                  </IonGrid>
                  {calculateNumStubs > 0 && (
                    <IonNote style={{ display: "block", marginTop: 8 }}>
                      This will generate <strong>{calculateNumStubs}</strong> paystub{calculateNumStubs > 1 ? "s" : ""}
                    </IonNote>
                  )}

                  {/* Hours per pay period */}
                  {formData.payType === "hourly" && payPeriods.length > 0 && (
                    <div style={{ marginTop: 16 }}>
                      <IonItem button detail={false} onClick={() => setHoursExpanded(v => !v)} lines="none" style={{ "--background": "var(--ion-color-light)", borderRadius: 8, marginBottom: 8 }}>
                        <IonLabel><strong>Hours Per Pay Period</strong> <IonNote style={{ fontSize: "0.75rem" }}>click to {hoursExpanded ? "collapse" : "expand"}</IonNote></IonLabel>
                      </IonItem>
                      {hoursExpanded && (
                        <div>
                          {formData.workerType === "contractor" && (
                            <IonNote color="warning" style={{ display: "block", marginBottom: 8, fontSize: "0.75rem" }}>
                              Contractors are not legally entitled to overtime pay.
                            </IonNote>
                          )}
                          {payPeriods.map((period, index) => (
                            <div key={index} style={{ background: "var(--ion-color-light)", borderRadius: 8, padding: 12, marginBottom: 8 }}>
                              <p style={{ fontWeight: 600, marginBottom: 8 }}>Pay Period {index + 1} — {period.label}</p>
                              <IonGrid>
                                <IonRow>
                                  <IonCol size="6" sizeMd="3">
                                    <IonInput fill="outline" labelPlacement="floating" label="Period Start" type="date" value={hoursPerPeriod[index]?.startDate || period.start} onIonInput={e => handlePeriodHoursChange(index, "startDate", e.detail.value)} style={ionInputStyle} />
                                  </IonCol>
                                  <IonCol size="6" sizeMd="3">
                                    <IonInput fill="outline" labelPlacement="floating" label="Period End" type="date" value={hoursPerPeriod[index]?.endDate || period.end} onIonInput={e => handlePeriodHoursChange(index, "endDate", e.detail.value)} style={ionInputStyle} />
                                  </IonCol>
                                  <IonCol size="6" sizeMd="3">
                                    <IonInput fill="outline" labelPlacement="floating" label="Pay Date" type="date" value={hoursPerPeriod[index]?.payDate || period.pay} onIonInput={e => handlePeriodHoursChange(index, "payDate", e.detail.value)} style={ionInputStyle} />
                                  </IonCol>
                                  <IonCol size="6" sizeMd="3">
                                    <IonInput fill="outline" labelPlacement="floating" label="Regular Hours" type="number" value={hoursPerPeriod[index]?.hours ?? (formData.payFrequency === "biweekly" ? 80 : 40)} onIonInput={e => handlePeriodHoursChange(index, "hours", e.detail.value)} style={ionInputStyle} />
                                  </IonCol>
                                  {formData.workerType === "employee" && (
                                    <IonCol size="6" sizeMd="3">
                                      <IonInput fill="outline" labelPlacement="floating" label="Overtime Hours" type="number" value={hoursPerPeriod[index]?.overtime ?? 0} onIonInput={e => handlePeriodHoursChange(index, "overtime", e.detail.value)} style={ionInputStyle} />
                                    </IonCol>
                                  )}
                                  <IonCol size="6" sizeMd="3">
                                    <IonInput fill="outline" labelPlacement="floating" label="Commission (CAD $)" type="number" value={hoursPerPeriod[index]?.commission ?? 0} onIonInput={e => handlePeriodHoursChange(index, "commission", e.detail.value)} style={ionInputStyle} />
                                  </IonCol>
                                  {selectedTemplate === "template-h" && (
                                    <>
                                      <IonCol size="6" sizeMd="3">
                                        <IonInput fill="outline" labelPlacement="floating" label="Check Number" value={hoursPerPeriod[index]?.checkNumber ?? ""} onIonInput={e => handlePeriodHoursChange(index, "checkNumber", e.detail.value)} style={ionInputStyle} />
                                      </IonCol>
                                      <IonCol size="12" sizeMd="6">
                                        <IonInput fill="outline" labelPlacement="floating" label="Memo" value={hoursPerPeriod[index]?.memo ?? ""} onIonInput={e => handlePeriodHoursChange(index, "memo", e.detail.value)} style={ionInputStyle} />
                                      </IonCol>
                                    </>
                                  )}
                                </IonRow>
                              </IonGrid>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </IonAccordion>

              {/* ── Tax Settings ── */}
              <IonAccordion value="tax">
                <IonItem slot="header" color="light">
                  <IonLabel><strong>Tax Settings</strong></IonLabel>
                </IonItem>
                <div slot="content" style={{ padding: "12px 16px" }}>
                  <IonGrid>
                    <IonRow>
                      <IonCol size="12" sizeMd="6">
                        <IonSelect fill="outline" labelPlacement="floating" label="Marital Status" value={formData.maritalStatus} onIonChange={e => setFormData(prev => ({ ...prev, maritalStatus: e.detail.value }))} style={ionInputStyle}>
                          <IonSelectOption value="single">Single</IonSelectOption>
                          <IonSelectOption value="married">Married</IonSelectOption>
                          <IonSelectOption value="common_law">Common-Law</IonSelectOption>
                          <IonSelectOption value="separated">Separated</IonSelectOption>
                          <IonSelectOption value="divorced">Divorced</IonSelectOption>
                          <IonSelectOption value="widowed">Widowed</IonSelectOption>
                        </IonSelect>
                      </IonCol>
                      <IonCol size="12" sizeMd="6">
                        <IonInput fill="outline" labelPlacement="floating" label="Federal Allowances" type="number" name="federalAllowances" value={formData.federalAllowances} onIonInput={e => handleChange({ target: { name:"federalAllowances", value: e.detail.value } })} style={ionInputStyle} />
                      </IonCol>
                      <IonCol size="12" sizeMd="6">
                        <IonInput fill="outline" labelPlacement="floating" label="Provincial Allowances" type="number" name="provincialAllowances" value={formData.provincialAllowances} onIonInput={e => handleChange({ target: { name:"provincialAllowances", value: e.detail.value } })} style={ionInputStyle} />
                      </IonCol>
                    </IonRow>
                  </IonGrid>
                </div>
              </IonAccordion>

              {/* ── Deductions ── */}
              <IonAccordion value="deductions">
                <IonItem slot="header" color="light">
                  <IonLabel><strong>Deductions</strong></IonLabel>
                  {deductions.length > 0 && <IonBadge slot="end" color="primary">{deductions.length}</IonBadge>}
                </IonItem>
                <div slot="content" style={{ padding: "12px 16px" }}>
                  {deductions.map(d => (
                    <div key={d.id} style={{ background: "var(--ion-color-light)", borderRadius: 8, padding: 10, marginBottom: 8 }}>
                      <IonGrid>
                        <IonRow>
                          <IonCol size="12" sizeMd="4">
                            <IonSelect fill="outline" labelPlacement="floating" label="Type" value={d.type} onIonChange={e => updateDeduction(d.id, "type", e.detail.value)} style={ionInputStyle}>
                              {deductionTypes.map(t => <IonSelectOption key={t.value} value={t.value}>{t.label}</IonSelectOption>)}
                            </IonSelect>
                          </IonCol>
                          <IonCol size="12" sizeMd="4">
                            <IonInput fill="outline" labelPlacement="floating" label="Name / Description" value={d.name} onIonInput={e => updateDeduction(d.id, "name", e.detail.value)} style={ionInputStyle} />
                          </IonCol>
                          <IonCol size="8" sizeMd="3">
                            <IonInput fill="outline" labelPlacement="floating" label={d.isPercentage ? "Amount (%)" : "Amount (CAD $)"} type="number" value={d.amount} onIonInput={e => updateDeduction(d.id, "amount", e.detail.value)} style={ionInputStyle} />
                          </IonCol>
                          <IonCol size="4" sizeMd="1" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                            <IonCheckbox checked={d.isPercentage} onIonChange={e => updateDeduction(d.id, "isPercentage", e.detail.checked)} style={{ marginRight: 4 }} />
                            <span style={{ fontSize: "0.75rem" }}>%</span>
                            <IonButton fill="clear" color="danger" size="small" onClick={() => removeDeduction(d.id)}>
                              <IonIcon icon={trashOutline} />
                            </IonButton>
                          </IonCol>
                          <IonCol size="12">
                            <IonItem lines="none">
                              <IonLabel style={{ fontSize: "0.8rem" }}>Pre-Tax Deduction</IonLabel>
                              <IonToggle slot="end" checked={d.preTax} onIonChange={e => updateDeduction(d.id, "preTax", e.detail.checked)} />
                            </IonItem>
                          </IonCol>
                        </IonRow>
                      </IonGrid>
                    </div>
                  ))}
                  <IonButton fill="outline" size="small" onClick={addDeduction}>
                    <IonIcon slot="start" icon={addOutline} />
                    Add Deduction
                  </IonButton>
                </div>
              </IonAccordion>

              {/* ── Contributions ── */}
              <IonAccordion value="contributions">
                <IonItem slot="header" color="light">
                  <IonLabel><strong>Contributions (RRSP, TFSA, etc.)</strong></IonLabel>
                  {contributions.length > 0 && <IonBadge slot="end" color="secondary">{contributions.length}</IonBadge>}
                </IonItem>
                <div slot="content" style={{ padding: "12px 16px" }}>
                  {contributions.map(c => (
                    <div key={c.id} style={{ background: "var(--ion-color-light)", borderRadius: 8, padding: 10, marginBottom: 8 }}>
                      <IonGrid>
                        <IonRow>
                          <IonCol size="12" sizeMd="4">
                            <IonSelect fill="outline" labelPlacement="floating" label="Type" value={c.type} onIonChange={e => updateContribution(c.id, "type", e.detail.value)} style={ionInputStyle}>
                              {contributionTypes.map(t => <IonSelectOption key={t.value} value={t.value}>{t.label}</IonSelectOption>)}
                            </IonSelect>
                          </IonCol>
                          <IonCol size="12" sizeMd="4">
                            <IonInput fill="outline" labelPlacement="floating" label="Name / Description" value={c.name} onIonInput={e => updateContribution(c.id, "name", e.detail.value)} style={ionInputStyle} />
                          </IonCol>
                          <IonCol size="8" sizeMd="3">
                            <IonInput fill="outline" labelPlacement="floating" label={c.isPercentage ? "Amount (%)" : "Amount (CAD $)"} type="number" value={c.amount} onIonInput={e => updateContribution(c.id, "amount", e.detail.value)} style={ionInputStyle} />
                          </IonCol>
                          <IonCol size="4" sizeMd="1" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                            <IonCheckbox checked={c.isPercentage} onIonChange={e => updateContribution(c.id, "isPercentage", e.detail.checked)} style={{ marginRight: 4 }} />
                            <span style={{ fontSize: "0.75rem" }}>%</span>
                            <IonButton fill="clear" color="danger" size="small" onClick={() => removeContribution(c.id)}>
                              <IonIcon icon={trashOutline} />
                            </IonButton>
                          </IonCol>
                          <IonCol size="12">
                            <IonItem lines="none">
                              <IonLabel style={{ fontSize: "0.8rem" }}>Pre-Tax Contribution</IonLabel>
                              <IonToggle slot="end" checked={c.preTax} onIonChange={e => updateContribution(c.id, "preTax", e.detail.checked)} />
                            </IonItem>
                          </IonCol>
                        </IonRow>
                      </IonGrid>
                    </div>
                  ))}
                  <IonButton fill="outline" size="small" onClick={addContribution}>
                    <IonIcon slot="start" icon={addOutline} />
                    Add Contribution
                  </IonButton>
                </div>
              </IonAccordion>

              {/* ── Employer Benefits (Template C only) ── */}
              {selectedTemplate === "template-c" && formData.workerType === "employee" && (
                <IonAccordion value="employer-benefits">
                  <IonItem slot="header" color="light">
                    <IonLabel><strong>Employer Benefits</strong></IonLabel>
                    {employerBenefits.length > 0 && <IonBadge slot="end" color="tertiary">{employerBenefits.length}</IonBadge>}
                  </IonItem>
                  <div slot="content" style={{ padding: "12px 16px" }}>
                    {employerBenefits.map(b => (
                      <div key={b.id} style={{ background: "var(--ion-color-light)", borderRadius: 8, padding: 10, marginBottom: 8 }}>
                        <IonGrid>
                          <IonRow>
                            <IonCol size="12" sizeMd="5">
                              <IonSelect fill="outline" labelPlacement="floating" label="Benefit Type" value={b.type} onIonChange={e => updateEmployerBenefit(b.id, "type", e.detail.value)} style={ionInputStyle}>
                                {employerBenefitTypes.map(t => <IonSelectOption key={t.value} value={t.value}>{t.label}</IonSelectOption>)}
                              </IonSelect>
                            </IonCol>
                            {b.type !== "rrsp_match" && (
                              <IonCol size="12" sizeMd="4">
                                <IonInput fill="outline" labelPlacement="floating" label="Description" value={b.name} onIonInput={e => updateEmployerBenefit(b.id, "name", e.detail.value)} style={ionInputStyle} />
                              </IonCol>
                            )}
                            {b.type === "rrsp_match" ? (
                              <>
                                <IonCol size="6" sizeMd="3">
                                  <IonInput fill="outline" labelPlacement="floating" label="Match %" type="number" value={b.matchPercent || 50} onIonInput={e => updateEmployerBenefit(b.id, "matchPercent", e.detail.value)} style={ionInputStyle} />
                                </IonCol>
                                <IonCol size="6" sizeMd="3">
                                  <IonInput fill="outline" labelPlacement="floating" label="Up to % of Pay" type="number" value={b.matchUpTo || 6} onIonInput={e => updateEmployerBenefit(b.id, "matchUpTo", e.detail.value)} style={ionInputStyle} />
                                </IonCol>
                              </>
                            ) : (
                              <IonCol size="8" sizeMd="3">
                                <IonInput fill="outline" labelPlacement="floating" label={b.isPercentage ? "Amount (%)" : "Amount (CAD $)"} type="number" value={b.amount} onIonInput={e => updateEmployerBenefit(b.id, "amount", e.detail.value)} style={ionInputStyle} />
                              </IonCol>
                            )}
                            <IonCol size="4" sizeMd="1" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <IonButton fill="clear" color="danger" size="small" onClick={() => removeEmployerBenefit(b.id)}>
                                <IonIcon icon={trashOutline} />
                              </IonButton>
                            </IonCol>
                          </IonRow>
                        </IonGrid>
                      </div>
                    ))}
                    <IonButton fill="outline" size="small" onClick={addEmployerBenefit}>
                      <IonIcon slot="start" icon={addOutline} />
                      Add Employer Benefit
                    </IonButton>
                  </div>
                </IonAccordion>
              )}

              {/* ── Absence Plans (Template C / H) ── */}
              {(selectedTemplate === "template-c" || selectedTemplate === "template-h") && formData.workerType === "employee" && (
                <IonAccordion value="absence">
                  <IonItem slot="header" color="light">
                    <IonLabel><strong>Absence Plans (PTO, Vacation, Sick)</strong></IonLabel>
                    {absencePlans.length > 0 && <IonBadge slot="end" color="medium">{absencePlans.length}</IonBadge>}
                  </IonItem>
                  <div slot="content" style={{ padding: "12px 16px" }}>
                    {absencePlans.map(p => (
                      <div key={p.id} style={{ background: "var(--ion-color-light)", borderRadius: 8, padding: 10, marginBottom: 8 }}>
                        <IonGrid>
                          <IonRow>
                            <IonCol size="12" sizeMd="5">
                              <IonInput fill="outline" labelPlacement="floating" label="Plan Name" value={p.description} onIonInput={e => updateAbsencePlan(p.id, "description", e.detail.value)} placeholder="e.g., PTO Plan" style={ionInputStyle} />
                            </IonCol>
                            <IonCol size="5" sizeMd="3">
                              <IonInput fill="outline" labelPlacement="floating" label="Accrued (hrs)" type="number" value={p.accrued} onIonInput={e => updateAbsencePlan(p.id, "accrued", e.detail.value)} style={ionInputStyle} />
                            </IonCol>
                            <IonCol size="5" sizeMd="3">
                              <IonInput fill="outline" labelPlacement="floating" label="Reduced (hrs)" type="number" value={p.reduced} onIonInput={e => updateAbsencePlan(p.id, "reduced", e.detail.value)} style={ionInputStyle} />
                            </IonCol>
                            <IonCol size="2" sizeMd="1" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <IonButton fill="clear" color="danger" size="small" onClick={() => removeAbsencePlan(p.id)}>
                                <IonIcon icon={trashOutline} />
                              </IonButton>
                            </IonCol>
                          </IonRow>
                        </IonGrid>
                      </div>
                    ))}
                    <IonButton fill="outline" size="small" onClick={addAbsencePlan}>
                      <IonIcon slot="start" icon={addOutline} />
                      Add Absence Plan
                    </IonButton>
                  </div>
                </IonAccordion>
              )}

            </IonAccordionGroup>

            {/* Clear form button */}
            <div style={{ marginTop: 12, textAlign: "right" }}>
              <IonButton fill="outline" color="medium" size="small" onClick={clearForm}>Clear Form</IonButton>
            </div>
          </div>

          {/* ── RIGHT: Preview + Download ── */}
          <div style={{ minWidth: 0 }}>
            <div style={{ background: "rgba(var(--ion-color-success-rgb),0.08)", border: "2px solid var(--ion-color-success)", borderRadius: 12, padding: 20, position: "sticky", top: 16 }}>
              <h3 style={{ fontWeight: 700, fontSize: "1.1rem", color: "var(--ion-color-success-shade)", marginBottom: 12 }}>
                Pay Preview {formData.province === "QC" && <IonBadge color="tertiary">QPP/QPIP</IonBadge>}
              </h3>

              {calculateNumStubs > 0 && (
                <div style={{ marginBottom: 12, paddingBottom: 12, borderBottom: "1px solid rgba(var(--ion-color-success-rgb),0.3)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Paystubs to Generate:</span>
                    <strong>{calculateNumStubs}</strong>
                  </div>
                </div>
              )}

              {/* Inline PDF Preview */}
              <div style={{ marginBottom: 12 }}>
                <p style={{ fontSize: "0.72rem", color: "var(--ion-color-medium)", marginBottom: 6 }}>
                  Preview · Click to enlarge · Watermark removed after purchase
                </p>
                {isGeneratingPreview ? (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 320, background: "var(--ion-color-light)", borderRadius: 8 }}>
                    <IonSpinner name="crescent" style={{ marginBottom: 8 }} />
                    <span style={{ fontSize: "0.8rem", color: "var(--ion-color-medium)" }}>Generating preview…</span>
                  </div>
                ) : pdfPreviews.length > 0 && pdfPreviews[previewPageIndex] ? (
                  <>
                    <div
                      style={{ position: "relative", cursor: "pointer", borderRadius: 8, overflow: "hidden", border: "1px solid var(--ion-color-light-shade)", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}
                      onClick={() => setPreviewModalOpen(true)}
                    >
                      <img
                        src={pdfPreviews[previewPageIndex]}
                        alt={`Canadian pay stub preview ${previewPageIndex + 1}`}
                        style={{ width: "100%", display: "block", background: "#fff" }}
                      />
                      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
                        <span style={{ fontSize: "2rem", fontWeight: 700, color: "rgba(0,0,0,0.12)", transform: "rotate(-30deg)", userSelect: "none" }}>MintSlip</span>
                      </div>
                      <div style={{ position: "absolute", bottom: 8, right: 8, background: "rgba(255,255,255,0.9)", borderRadius: 4, padding: "2px 8px", fontSize: "0.72rem", color: "#555" }}>
                        <IonIcon icon={eyeOutline} style={{ marginRight: 3, fontSize: "0.7rem" }} />Click to enlarge
                      </div>
                    </div>
                    {pdfPreviews.length > 1 && (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 8 }}>
                        <IonButton fill="clear" size="small" disabled={previewPageIndex === 0} onClick={() => setPreviewPageIndex(i => Math.max(0, i - 1))}>
                          <IonIcon icon={chevronBackOutline} />
                        </IonButton>
                        {pdfPreviews.map((_, idx) => (
                          <button key={idx} onClick={() => setPreviewPageIndex(idx)} style={{ width: 28, height: 28, borderRadius: "50%", border: "none", cursor: "pointer", fontWeight: 600, fontSize: "0.75rem", background: idx === previewPageIndex ? "var(--ion-color-success)" : "var(--ion-color-light-shade)", color: idx === previewPageIndex ? "#fff" : "var(--ion-color-dark)" }}>
                            {idx + 1}
                          </button>
                        ))}
                        <IonButton fill="clear" size="small" disabled={previewPageIndex === pdfPreviews.length - 1} onClick={() => setPreviewPageIndex(i => Math.min(pdfPreviews.length - 1, i + 1))}>
                          <IonIcon icon={chevronForwardOutline} />
                        </IonButton>
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 320, background: "var(--ion-color-light)", borderRadius: 8, border: "2px dashed var(--ion-color-light-shade)" }}>
                    <IonIcon icon={eyeOutline} style={{ fontSize: "2.5rem", color: "var(--ion-color-medium)", marginBottom: 8 }} />
                    <p style={{ fontSize: "0.8rem", color: "var(--ion-color-medium)", textAlign: "center", margin: 0 }}>Fill in pay period dates<br />and rate to see a preview</p>
                  </div>
                )}
              </div>

              {/* Coupon input */}
              {!hasActiveSubscription && calculateNumStubs > 0 && (
                <div style={{ marginTop: 12, padding: 12, background: "var(--ion-color-light)", borderRadius: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                    <IonIcon icon={pricetagOutline} style={{ color: "var(--ion-color-medium)" }} />
                    <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>Have a coupon code?</span>
                  </div>
                  {!appliedDiscount ? (
                    <>
                      <div style={{ display: "flex", gap: 8 }}>
                        <IonInput
                          fill="outline"
                          placeholder="Enter code"
                          value={couponCode}
                          onIonInput={e => { setCouponCode(e.detail.value?.toUpperCase() || ""); setCouponError(""); }}
                          style={{ flex: 1, fontFamily: "monospace" }}
                        />
                        <IonButton fill="outline" onClick={validateCoupon} disabled={isValidatingCoupon || !couponCode.trim()} style={{ flexShrink: 0 }}>
                          {isValidatingCoupon ? <IonSpinner name="crescent" /> : "Apply"}
                        </IonButton>
                      </div>
                      {couponError && <IonNote color="danger" style={{ display: "block", marginTop: 4, fontSize: "0.75rem" }}>{couponError}</IonNote>}
                    </>
                  ) : (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 10px", background: "rgba(var(--ion-color-success-rgb),0.15)", borderRadius: 6 }}>
                      <span style={{ color: "var(--ion-color-success-shade)", fontWeight: 600, fontSize: "0.85rem" }}>
                        {appliedDiscount.code} — {appliedDiscount.discountPercent}% off
                      </span>
                      <IonButton fill="clear" color="danger" size="small" onClick={removeCoupon}>
                        <IonIcon icon={closeOutline} />
                      </IonButton>
                    </div>
                  )}
                </div>
              )}

              {/* Price */}
              {!hasActiveSubscription && calculateNumStubs > 0 && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid rgba(var(--ion-color-success-rgb),0.3)", textAlign: "center" }}>
                  {appliedDiscount ? (
                    <>
                      <p style={{ textDecoration: "line-through", color: "var(--ion-color-medium)", fontSize: "0.9rem" }}>${(calculateNumStubs * 9.99).toFixed(2)}</p>
                      <p style={{ fontWeight: 700, fontSize: "1.3rem", color: "var(--ion-color-success-shade)" }}>${appliedDiscount.discountedPrice.toFixed(2)}</p>
                      <p style={{ fontSize: "0.75rem", color: "var(--ion-color-success)" }}>{appliedDiscount.discountPercent}% discount applied</p>
                    </>
                  ) : (
                    <>
                      <p style={{ fontWeight: 700, fontSize: "1.2rem", color: "var(--ion-color-success-shade)" }}>${(calculateNumStubs * 9.99).toFixed(2)}</p>
                      <p style={{ fontSize: "0.75rem", color: "var(--ion-color-medium)" }}>$9.99 per stub</p>
                    </>
                  )}
                </div>
              )}

              {hasActiveSubscription && (
                <div style={{ marginTop: 12, padding: 8, background: "rgba(var(--ion-color-success-rgb),0.15)", borderRadius: 8, textAlign: "center" }}>
                  <p style={{ color: "var(--ion-color-success-shade)", fontWeight: 600, fontSize: "0.875rem" }}>Subscription Active — Free Download</p>
                  {user?.subscription?.downloads_remaining !== -1 && (
                    <p style={{ fontSize: "0.75rem", color: "var(--ion-color-medium)" }}>{user?.subscription?.downloads_remaining} downloads remaining</p>
                  )}
                </div>
              )}

              {/* Download / payment button */}
              <IonButton
                expand="block"
                color="success"
                style={{ marginTop: 16, "--border-radius": "8px" }}
                disabled={isProcessing || calculateNumStubs === 0}
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
                    ? `Download ${calculateNumStubs > 0 ? calculateNumStubs : ""} Stub${calculateNumStubs !== 1 ? "s" : ""}`
                    : calculateNumStubs > 0
                      ? `Pay & Download — $${appliedDiscount ? appliedDiscount.discountedPrice.toFixed(2) : (calculateNumStubs * 9.99).toFixed(2)}`
                      : "Configure Pay Period First"
                }
              </IonButton>
            </div>
          </div>

        </div>
      </div>

      {/* PDF Preview Modal */}
      <IonModal isOpen={previewModalOpen} onDidDismiss={() => setPreviewModalOpen(false)}>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Canadian Pay Stub Preview (Watermarked)</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={() => setPreviewModalOpen(false)}>
                <IonIcon icon={closeOutline} />
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <div style={{ padding: 16, display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            {pdfPreviews.length > 1 && (
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <IonButton fill="clear" disabled={previewPageIndex === 0} onClick={() => setPreviewPageIndex(i => Math.max(0, i-1))}>
                  <IonIcon icon={chevronBackOutline} />
                </IonButton>
                <span>Stub {previewPageIndex + 1} of {pdfPreviews.length}</span>
                <IonButton fill="clear" disabled={previewPageIndex === pdfPreviews.length - 1} onClick={() => setPreviewPageIndex(i => Math.min(pdfPreviews.length - 1, i+1))}>
                  <IonIcon icon={chevronForwardOutline} />
                </IonButton>
              </div>
            )}
            {pdfPreviews[previewPageIndex] && (
              <img
                src={pdfPreviews[previewPageIndex]}
                alt={`Canadian pay stub preview ${previewPageIndex + 1}`}
                style={{ width: "100%", maxWidth: 680, border: "1px solid var(--ion-color-light)", borderRadius: 8, boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}
              />
            )}
            <IonNote style={{ textAlign: "center", fontSize: "0.8rem" }}>
              This is a watermarked preview. Purchase to download the final document.
            </IonNote>
          </div>
        </IonContent>
      </IonModal>

    </AppLayout>
  );
}

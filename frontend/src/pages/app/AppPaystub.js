import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useSearchParams } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import {
  IonHeader, IonToolbar, IonTitle, IonButtons,
  IonInput, IonSelect, IonSelectOption,
  IonList, IonItem, IonLabel, IonButton, IonIcon, IonGrid, IonRow, IonCol,
  IonNote, IonSpinner, IonSegment, IonSegmentButton, IonCheckbox, IonToggle,
  IonText, IonBadge, IonToast,
} from "@ionic/react";
import { trashOutline, addOutline, cloudDownloadOutline, eyeOutline, closeOutline, checkmarkOutline, chevronBackOutline, chevronForwardOutline, pricetagOutline, arrowBackOutline, personOutline, briefcaseOutline } from "ionicons/icons";
import { generateAndDownloadPaystub } from "@/utils/paystubGenerator";
import { generateAllPreviewPDFs } from "@/utils/paystubPreviewGenerator";
import { isNative, nativePost, getStripeOrigin } from "@/utils/nativeHttp";
import { saveGuestDocument } from "@/utils/guestSave";
import { getLocalTaxRate, getSUTARate } from "@/utils/taxRates";
import { calculateFederalTax, calculateStateTax, getStateTaxRate } from "@/utils/federalTaxCalculator";
import {
  formatPhoneNumber, validatePhoneNumber,
  formatZipCode, validateZipCode,
  formatSSNLast4, validateSSNLast4,
  formatBankLast4, validateBankLast4,
} from "@/utils/validation";
import GustoLogo from "../../assests/gustoLogo.png";
import WorkdayLogo from "../../assests/workday-logo.png";
import OnPayLogo from "../../assests/onpayLogo.webp";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";
const cardStyle = { backgroundColor: "var(--ion-card-background)", borderRadius: 8, boxShadow: "rgba(0,0,0,0.18) 0px 4px 24px", padding: 16, display: "flex", flexDirection: "column", gap: 16 };
const sectionHeadingStyle = { fontWeight: 700, fontSize: "0.95rem", color: "var(--ion-text-color)" };

const isLocalhost = typeof window !== "undefined" &&
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

const PAYROLL_COMPANIES = [
  { id: "gusto",   name: "Gusto",   template: "template-a", logo: GustoLogo },
  { id: "workday", name: "Workday", template: "template-c", logo: WorkdayLogo },
  { id: "onpay",   name: "OnPay",   template: "template-h", logo: OnPayLogo },
];

const US_STATES = [
  ["AL","Alabama"],["AK","Alaska"],["AZ","Arizona"],["AR","Arkansas"],["CA","California"],
  ["CO","Colorado"],["CT","Connecticut"],["DE","Delaware"],["FL","Florida"],["GA","Georgia"],
  ["HI","Hawaii"],["ID","Idaho"],["IL","Illinois"],["IN","Indiana"],["IA","Iowa"],
  ["KS","Kansas"],["KY","Kentucky"],["LA","Louisiana"],["ME","Maine"],["MD","Maryland"],
  ["MA","Massachusetts"],["MI","Michigan"],["MN","Minnesota"],["MS","Mississippi"],["MO","Missouri"],
  ["MT","Montana"],["NE","Nebraska"],["NV","Nevada"],["NH","New Hampshire"],["NJ","New Jersey"],
  ["NM","New Mexico"],["NY","New York"],["NC","North Carolina"],["ND","North Dakota"],["OH","Ohio"],
  ["OK","Oklahoma"],["OR","Oregon"],["PA","Pennsylvania"],["RI","Rhode Island"],["SC","South Carolina"],
  ["SD","South Dakota"],["TN","Tennessee"],["TX","Texas"],["UT","Utah"],["VT","Vermont"],
  ["VA","Virginia"],["WA","Washington"],["WV","West Virginia"],["WI","Wisconsin"],["WY","Wyoming"],
];

const STORAGE_KEY = "usPaystubFormData";

const defaultFormData = {
  name: "", ssn: "", bank: "", bankName: "",
  address: "", city: "", state: "", zip: "",
  company: "", companyAddress: "", companyCity: "", companyState: "", companyZip: "", companyPhone: "",
  hireDate: "", startDate: "", endDate: "",
  rate: "", payFrequency: "biweekly", payDay: "Friday",
  hoursList: "", overtimeList: "", commissionList: "", tipsList: "", tipsCashList: "",
  startDateList: "", endDateList: "", payDateList: "",
  includeLocalTax: true,
  workerType: "employee", payType: "hourly", annualSalary: "",
  federalFilingStatus: "", stateAllowances: "0",
  employeeId: "", companyCode: "", locDept: "", checkNumber: "", memo: "",
};

const deductionTypes = [
  { label: "Health Insurance",    value: "health_insurance",    preTax: true },
  { label: "Dental Insurance",    value: "dental_insurance",    preTax: true },
  { label: "Vision Insurance",    value: "vision_insurance",    preTax: true },
  { label: "Life Insurance",      value: "life_insurance",      preTax: false },
  { label: "Disability Insurance",value: "disability_insurance",preTax: false },
  { label: "Union Dues",          value: "union_dues",          preTax: false },
  { label: "Garnishment",         value: "garnishment",         preTax: false },
  { label: "Other",               value: "other",               preTax: false },
];

const contributionTypes = [
  { label: "Traditional 401(k)", value: "401k",              preTax: true },
  { label: "Roth 401(k)",        value: "roth_401k",         preTax: false },
  { label: "HSA",                value: "hsa",               preTax: true },
  { label: "FSA",                value: "fsa",               preTax: true },
  { label: "Dependent Care FSA", value: "dependent_care_fsa",preTax: true },
  { label: "Commuter Benefits",  value: "commuter",          preTax: true },
  { label: "Other",              value: "other",             preTax: false },
];

const employerBenefitTypes = [
  { label: "401(k) Employer Match",        value: "401k_match" },
  { label: "Employer Paid Life Insurance", value: "life_insurance" },
  { label: "Employer Paid Health Insurance",value: "health_insurance" },
  { label: "Employer Paid Dental",         value: "dental" },
  { label: "Employer Paid Vision",         value: "vision" },
  { label: "Employer HSA Contribution",    value: "hsa_contribution" },
  { label: "Employer Disability Insurance",value: "disability" },
  { label: "Other Employer Benefit",       value: "other" },
];

export default function AppPaystub() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const templateFromUrl = searchParams.get("template");

  // ── Auth / subscription ──────────────────────────────────────────────────
  const [user,                  setUser]                  = useState(null);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [isProcessing,          setIsProcessing]          = useState(false);
  const [appliedDiscount,       setAppliedDiscount]       = useState(null);

  // ── Template ─────────────────────────────────────────────────────────────
  const [selectedTemplate, setSelectedTemplate] = useState(() => {
    if (templateFromUrl && ["template-a","template-b","template-c","template-h"].includes(templateFromUrl)) return templateFromUrl;
    try {
      const saved = localStorage.getItem("usPaystubTemplate");
      if (saved && ["template-a","template-b","template-c","template-h"].includes(saved)) return saved;
    } catch {}
    return "template-a";
  });

  useEffect(() => {
    try { localStorage.setItem("usPaystubTemplate", selectedTemplate); } catch {}
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
    ssn: "", bank: "", zip: "", companyZip: "", companyPhone: "",
    companyCode: "", locDept: "", checkNumber: "",
  });

  // ── Toast ─────────────────────────────────────────────────────────────────
  const [toastState, setToastState] = useState({ isOpen: false, message: "", color: "danger" });
  const showToast = (message, color = "danger") => setToastState({ isOpen: true, message, color });

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
    if (!token) { showToast("Please log in to use your subscription"); navigate("/login"); return; }
    setIsProcessing(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/user/subscription-download`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ documentType: "paystub", template: selectedTemplate, count: calculateNumStubs }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to process subscription download");

      const fullFormData = {
        ...formData, deductions, contributions, absencePlans, employerBenefits,
        companyLogo, logoDataUrl: logoPreview,
      };
      const shouldSave = !!user;
      const pdfBlob = await generateAndDownloadPaystub(fullFormData, selectedTemplate, calculateNumStubs, shouldSave);

      if (shouldSave && pdfBlob) {
        try {
          const reader = new FileReader();
          reader.onloadend = async () => {
            const base64Data = reader.result.split(",")[1];
            const fileExt = calculateNumStubs > 1 ? ".zip" : ".pdf";
            const fileName = `paystub_${new Date().toISOString().split("T")[0]}${fileExt}`;
            await fetch(`${BACKEND_URL}/api/user/saved-documents`, {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
              body: JSON.stringify({ documentType: "paystub", fileName, fileData: base64Data, template: selectedTemplate }),
            });
            showToast("Document saved to your account!", "success");
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

      localStorage.removeItem("paystubCompanyLogo");
      setCompanyLogo(null); setLogoPreview(null);
      setSelectedPayrollCompany(null); setCompanySearchQuery(""); setSelectedTemplate("template-a");
      showToast("Pay stub(s) downloaded successfully!", "success");
      navigate("/user/downloads");
    } catch (err) {
      console.error("Subscription download error:", err);
      showToast(err.message || "Failed to download. Please try again.");
    } finally { setIsProcessing(false); }
  };

  // ── handleChange ──────────────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  // ── Validated handlers ────────────────────────────────────────────────────
  const handleSSNChange = (val) => {
    const formatted = formatSSNLast4(val);
    setFormData(prev => ({ ...prev, ssn: formatted }));
    setValidationErrors(prev => ({ ...prev, ssn: validateSSNLast4(formatted).error }));
  };
  const handleBankChange = (val) => {
    const formatted = formatBankLast4(val);
    setFormData(prev => ({ ...prev, bank: formatted }));
    setValidationErrors(prev => ({ ...prev, bank: validateBankLast4(formatted).error }));
  };
  const handleZipChange = (val) => {
    const formatted = formatZipCode(val);
    setFormData(prev => ({ ...prev, zip: formatted }));
    setValidationErrors(prev => ({ ...prev, zip: validateZipCode(formatted).error }));
  };
  const handleCompanyZipChange = (val) => {
    const formatted = formatZipCode(val);
    setFormData(prev => ({ ...prev, companyZip: formatted }));
    setValidationErrors(prev => ({ ...prev, companyZip: validateZipCode(formatted).error }));
  };
  const handleCompanyPhoneChange = (val) => {
    const formatted = formatPhoneNumber(val);
    setFormData(prev => ({ ...prev, companyPhone: formatted }));
    setValidationErrors(prev => ({ ...prev, companyPhone: validatePhoneNumber(formatted).error }));
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
          localStorage.setItem("paystubCompanyLogo", resizedBase64);
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
    localStorage.removeItem("paystubCompanyLogo");
    if (logoInputRef.current) logoInputRef.current.value = "";
  };

  useEffect(() => { localStorage.removeItem("paystubCompanyLogo"); setCompanyLogo(null); setLogoPreview(null); }, []);
  useEffect(() => () => { localStorage.removeItem("paystubCompanyLogo"); }, []);

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
        label: `${currentStart.toLocaleDateString("en-US",{month:"short",day:"numeric"})} - ${periodEnd.toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}`,
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
          hours:       prev[i]?.hours       ?? defaultHours,
          overtime:    prev[i]?.overtime    ?? 0,
          commission:  prev[i]?.commission  ?? 0,
          tips:        prev[i]?.tips        ?? 0,
          tipsCash:    prev[i]?.tipsCash    ?? false,
          startDate:   prev[i]?.startDate   ?? period.start,
          endDate:     prev[i]?.endDate     ?? period.end,
          payDate:     prev[i]?.payDate     ?? period.pay,
          checkNumber: prev[i]?.checkNumber ?? "",
          memo:        prev[i]?.memo        ?? "",
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
        hoursList:       hoursPerPeriod.map(p => p.hours).join(", "),
        overtimeList:    hoursPerPeriod.map(p => p.overtime).join(", "),
        commissionList:  hoursPerPeriod.map(p => p.commission).join(", "),
        tipsList:        hoursPerPeriod.map(p => p.tips).join(", "),
        tipsCashList:    hoursPerPeriod.map(p => p.tipsCash ? "1" : "0").join(", "),
        startDateList:   hoursPerPeriod.map(p => p.startDate || "").join(", "),
        endDateList:     hoursPerPeriod.map(p => p.endDate || "").join(", "),
        payDateList:     hoursPerPeriod.map(p => p.payDate || "").join(", "),
        checkNumberList: hoursPerPeriod.map(p => p.checkNumber || "").join(", "),
        memoList:        hoursPerPeriod.map(p => p.memo || "").join("|||"),
      }));
    }
  }, [hoursPerPeriod]);

  const handlePeriodHoursChange = (index, field, value) => {
    setHoursPerPeriod(prev => {
      const updated = [...prev];
      const stringFields = ["startDate","endDate","payDate","checkNumber","memo"];
      const boolFields   = ["tipsCash"];
      let processedValue;
      if (boolFields.includes(field))   processedValue = value;
      else if (stringFields.includes(field)) processedValue = value;
      else processedValue = parseFloat(value) || 0;
      updated[index] = { ...updated[index], [field]: processedValue };
      return updated;
    });
  };

  // ── Template card preview images ──────────────────────────────────────────
  const [templatePreviews, setTemplatePreviews] = useState({});
  const [loadingPreviews,  setLoadingPreviews]  = useState(true);

  useEffect(() => {
    if (isNative) { setLoadingPreviews(false); return; }
    const sampleData = {
      name: "John Smith", ssn: "1234", bank: "5678", bankName: "Chase Bank",
      address: "123 Main Street", city: "New York", state: "NY", zip: "10001",
      company: "Acme Corporation", companyAddress: "456 Business Ave",
      companyCity: "New York", companyState: "NY", companyZip: "10002",
      companyPhone: "(555) 123-4567",
      hireDate: "2022-01-01", startDate: "2025-01-06", endDate: "2025-01-19",
      rate: "25", payFrequency: "biweekly", payDay: "Friday",
      payType: "hourly", workerType: "employee", annualSalary: "",
      employeeId: "EMP001", companyCode: "AC001", locDept: "001", checkNumber: "1234567", memo: "",
      includeLocalTax: true, federalFilingStatus: "single", stateAllowances: "0",
      hoursList: "80", overtimeList: "0", commissionList: "0", tipsList: "0", tipsCashList: "0",
      startDateList: "2025-01-06", endDateList: "2025-01-19", payDateList: "2025-01-24",
      checkNumberList: "", memoList: "",
    };
    Promise.all([
      generateAllPreviewPDFs(sampleData, "template-a", 1),
      generateAllPreviewPDFs(sampleData, "template-c", 1),
      generateAllPreviewPDFs(sampleData, "template-h", 1),
    ]).then(([a, c, h]) => {
      setTemplatePreviews({ "template-a": a[0], "template-c": c[0], "template-h": h[0] });
      setLoadingPreviews(false);
    }).catch(() => setLoadingPreviews(false));
  }, []);

  // ── PDF preview state ─────────────────────────────────────────────────────
  const [pdfPreviews,         setPdfPreviews]         = useState([]);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [formModalOpen,       setFormModalOpen]       = useState(false);
  const [previewModalOpen,    setPreviewModalOpen]    = useState(false);
  const [previewPageIndex,    setPreviewPageIndex]    = useState(0);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (formData.startDate && formData.endDate && (formData.rate || formData.annualSalary)) {
        setIsGeneratingPreview(true);
        try {
          const diffTime = Math.abs(new Date(formData.endDate) - new Date(formData.startDate));
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          const periodLength = formData.payFrequency === "biweekly" ? 14 : 7;
          const numStubs = Math.max(1, Math.ceil(diffDays / periodLength));
          const previewData = {
            ...formData, deductions, contributions, absencePlans, employerBenefits,
            logoDataUrl: logoPreview,
          };
          const previews = await generateAllPreviewPDFs(previewData, selectedTemplate, numStubs);
          setPdfPreviews(previews);
          setPreviewPageIndex(0);
        } catch (err) { console.error("Preview generation failed:", err); }
        setIsGeneratingPreview(false);
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [formData, selectedTemplate, deductions, contributions, absencePlans, employerBenefits, logoPreview]);

  // ── Coupon state ──────────────────────────────────────────────────────────
  const [couponCode,          setCouponCode]          = useState("");
  const [isValidatingCoupon,  setIsValidatingCoupon]  = useState(false);
  const [couponError,         setCouponError]         = useState("");

  const validateCoupon = async () => {
    if (!couponCode.trim()) { setCouponError("Please enter a coupon code"); return; }
    setIsValidatingCoupon(true); setCouponError("");
    try {
      const { ok, data } = await nativePost(`${BACKEND_URL}/api/validate-coupon`, { code: couponCode.trim(), generatorType: "paystub" });
      if (!data) { setCouponError("Server error. Please try again."); setAppliedDiscount(null); return; }
      if (ok && data.valid) {
        const base = calculateNumStubs * 9.99;
        const discountAmount = base * data.discountPercent / 100;
        setAppliedDiscount({ code: data.code, discountPercent: data.discountPercent, originalPrice: base, discountedPrice: parseFloat((base - discountAmount).toFixed(2)) });
        showToast(`Coupon applied: ${data.discountPercent}% off!`, "success");
      } else {
        setCouponError(data.detail || "Invalid coupon code");
        setAppliedDiscount(null);
      }
    } catch { setCouponError("Connection error. Please try again."); setAppliedDiscount(null); }
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
  const addEmployerBenefit    = () => setEmployerBenefits(prev => [...prev, { id: Date.now(), type:"401k_match", name:"401(k) Employer Match", amount:"", isPercentage:false, matchPercent:50, matchUpTo:6 }]);
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
    localStorage.removeItem(STORAGE_KEY); localStorage.removeItem("usPaystubTemplate"); localStorage.removeItem("paystubCompanyLogo");
    showToast("Form cleared successfully", "success");
  };

  // ── Next: open preview modal ──────────────────────────────────────────────
  const handleNext = async () => {
    if (calculateNumStubs === 0) { showToast("Please configure at least one pay period"); return; }
    if (pdfPreviews.length === 0) {
      setIsGeneratingPreview(true);
      try {
        const previewData = { ...formData, deductions, contributions, absencePlans, employerBenefits, logoDataUrl: logoPreview };
        const previews = await generateAllPreviewPDFs(previewData, selectedTemplate, calculateNumStubs);
        setPdfPreviews(previews);
        setPreviewPageIndex(0);
      } catch (err) { console.error("Preview generation failed:", err); }
      setIsGeneratingPreview(false);
    }
    setPreviewModalOpen(true);
  };

  // ── Generate / download ───────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (calculateNumStubs === 0) { showToast("Please configure at least one pay period"); return; }
    if (hasActiveSubscription) { await handleSubscriptionDownload(); return; }

    setIsProcessing(true);
    try {
      const baseAmount = calculateNumStubs * 9.99;
      const finalAmount = appliedDiscount ? appliedDiscount.discountedPrice : baseAmount;
      const origin = getStripeOrigin(BACKEND_URL);
      const fullFormData = { ...formData, deductions, contributions, absencePlans, employerBenefits, companyLogo, logoDataUrl: logoPreview };
      localStorage.setItem("pendingPaystubData", JSON.stringify(fullFormData));
      localStorage.setItem("pendingPaystubTemplate", selectedTemplate);
      localStorage.setItem("pendingPaystubCount", calculateNumStubs.toString());

      const { ok, data } = await nativePost(`${BACKEND_URL}/api/stripe/create-one-time-checkout`, {
        amount: finalAmount,
        documentType: "paystub",
        template: selectedTemplate,
        successUrl: `${origin}/payment-success?type=paystub&count=${calculateNumStubs}&session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${origin}/app/paystub`,
        quantity: calculateNumStubs,
        discountCode: appliedDiscount?.code || null,
        discountAmount: appliedDiscount ? baseAmount - finalAmount : 0,
      });
      if (!data) throw new Error("Server error. Please try again.");
      if (!ok) throw new Error(data.detail || "Failed to create checkout session");
      if (data.url) window.location.href = data.url;
      else throw new Error("No checkout URL received");
    } catch (err) {
      showToast(err.message || "Payment failed. Please try again.");
    } finally { setIsProcessing(false); }
  };

  // ── Shared input style ────────────────────────────────────────────────────
  const ionInputStyle = { marginBottom: 8 };

  return (
    <AppLayout fillHeight>
      <div style={{ padding: 10, height: "100%", boxSizing: "border-box" }}>
        <div style={{ background: "var(--ion-card-background)", borderRadius: 12, padding: "20px 20px 24px", height: "100%", overflowY: "auto", boxShadow: "0 2px 12px rgba(0,0,0,0.10)", boxSizing: "border-box" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
            {PAYROLL_COMPANIES.map(company => (
              <div key={company.id}
                onClick={() => { setSelectedTemplate(company.template); setFormModalOpen(true); }}
                style={{ cursor: "pointer", borderRadius: 10, border: "1.5px solid var(--app-divider, rgba(0,0,0,0.12))", background: "var(--ion-card-background)", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.08)", transition: "box-shadow 0.2s, transform 0.15s" }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.18)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)"; e.currentTarget.style.transform = "none"; }}
              >
                <div style={{ padding: "12px 16px 10px", borderBottom: "1px solid var(--app-divider, rgba(0,0,0,0.08))", display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: "0.8rem", color: "var(--ion-color-medium)", fontWeight: 500 }}>{company.name}</span>
                </div>
                <div style={{ background: "#fff", overflow: "hidden", minHeight: 160 }}>
                  {isNative ? (
                    <div style={{ height: 180, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, background: "#f9fafb" }}>
                      <span style={{ fontSize: "0.75rem", color: "#6b7280", fontWeight: 500 }}>Tap to select</span>
                    </div>
                  ) : loadingPreviews ? (
                    <div style={{ height: 180, display: "flex", alignItems: "center", justifyContent: "center", background: "#f9fafb" }}>
                      <IonSpinner name="crescent" />
                    </div>
                  ) : templatePreviews[company.template] ? (
                    <div style={{ position: "relative", paddingTop: "141.4%", overflow: "hidden", pointerEvents: "none" }}>
                      <iframe src={templatePreviews[company.template]} title={`${company.name} template`} scrolling="no" tabIndex="-1" style={{ position: "absolute", top: 0, left: 0, width: "300%", height: "300%", border: "none", display: "block", transformOrigin: "top left", transform: "scale(0.333)" }} />
                    </div>
                  ) : (
                    <div style={{ height: 180, display: "flex", alignItems: "center", justifyContent: "center", background: "#f9fafb" }}>
                      <span style={{ color: "#9ca3af", fontSize: "0.8rem" }}>Preview unavailable</span>
                    </div>
                  )}
                </div>
                <div style={{ padding: "8px 16px 12px", textAlign: "center", borderTop: "1px solid var(--app-divider, rgba(0,0,0,0.06))" }}>
                  <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--ion-color-primary)" }}>Select Template →</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Form Modal (portalled to ion-app) ── */}
      {formModalOpen && createPortal(
        <div style={{ position: "fixed", inset: 0, zIndex: 10000, background: window.innerWidth >= 768 ? "rgba(0,0,0,0.5)" : "var(--ion-background-color, #f2f2f7)", display: "flex", alignItems: window.innerWidth >= 768 ? "center" : "stretch", justifyContent: window.innerWidth >= 768 ? "center" : "stretch" }}>
          <div style={{ background: "var(--ion-background-color, #f2f2f7)", display: "flex", flexDirection: "column", width: "100%", maxWidth: window.innerWidth >= 768 ? 600 : "100%", height: window.innerWidth >= 768 ? "auto" : "100%", maxHeight: window.innerWidth >= 768 ? "90vh" : "100%", borderRadius: window.innerWidth >= 768 ? 12 : 0, overflow: "hidden" }}>
          <IonHeader>
            <IonToolbar style={{ "--background": "var(--ion-card-background)", "--color": "var(--ion-text-color)" }}>
              <IonButtons slot="start">
                <IonButton fill="clear" shape="round" onClick={() => setFormModalOpen(false)}>
                  <span slot="icon-only" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", lineHeight: 0, flexShrink: 0, fontSize: "1rem", color: "var(--ion-text-color)" }}>
                    <IonIcon icon={closeOutline} style={{ fontSize: "inherit", color: "inherit", pointerEvents: "none" }} />
                  </span>
                </IonButton>
              </IonButtons>
              <IonTitle style={{ fontWeight: 700 }}>Pay Stub Details</IonTitle>
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
          <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 40px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              {/* ── Worker Type ── */}
              <div style={cardStyle}>
                <span style={sectionHeadingStyle}>Worker Type</span>
                <div>
                  {(selectedTemplate === "template-a" || selectedTemplate === "template-h") ? (
                    <IonSegment mode="ios" value={formData.workerType} onIonChange={e => handleWorkerTypeChange(e.detail.value)}>
                      <IonSegmentButton value="employee" layout="icon-start">
                        <IonIcon icon={personOutline} />
                        <IonLabel>Employee (W-2)</IonLabel>
                      </IonSegmentButton>
                      <IonSegmentButton value="contractor" layout="icon-start">
                        <IonIcon icon={briefcaseOutline} />
                        <IonLabel>Contractor (1099)</IonLabel>
                      </IonSegmentButton>
                    </IonSegment>
                  ) : (
                    <IonItem lines="none">
                      <IonLabel>Employee (W-2) — only option for this template</IonLabel>
                    </IonItem>
                  )}
                </div>
              </div>

              {/* ── Template / Payroll Company ── */}
              <div style={cardStyle}>
                <span style={sectionHeadingStyle}>Template &amp; Payroll Provider</span>
                <div>
                  {/* Company search */}
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
                            style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", cursor: "pointer", borderBottom: "1px solid var(--ion-color-light)", background: selectedPayrollCompany?.id === company.id ? "var(--ion-color-step-100)" : "transparent" }}
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

                  <IonSelect
                    fill="outline"
                    labelPlacement="floating"
                    label="Template"
                    value={selectedTemplate}
                    onIonChange={e => handleTemplateChange(e.detail.value)}
                    style={ionInputStyle}
                  >
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
              </div>

              {/* ── Employee Info ── */}
              <div style={cardStyle}>
                <span style={sectionHeadingStyle}>{formData.workerType === "contractor" ? "Contractor" : "Employee"} Information</span>
                <div>
                  <IonGrid>
                    <IonRow>
                      <IonCol size="12" sizeMd="6">
                        <IonInput fill="outline" labelPlacement="floating" label={formData.workerType === "contractor" ? "Contractor Name *" : "Employee Name *"} name="name" value={formData.name} onIonInput={e => handleChange({ target: { name:"name", value: e.detail.value } })} style={ionInputStyle} />
                      </IonCol>
                      <IonCol size="12" sizeMd="6">
                        <IonInput fill="outline" labelPlacement="floating" label={formData.workerType === "contractor" ? "Last 4 SSN/EIN *" : "Last 4 of SSN *"} value={formData.ssn} onIonInput={e => handleSSNChange(e.detail.value)} maxlength={4} placeholder="1234" style={ionInputStyle} />
                        {validationErrors.ssn && <IonNote color="danger" style={{ fontSize: "0.75rem" }}>{validationErrors.ssn}</IonNote>}
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
                        <IonSelect fill="outline" labelPlacement="floating" label="State *" value={formData.state} onIonChange={e => setFormData(prev => ({ ...prev, state: e.detail.value }))} style={ionInputStyle}>
                          {US_STATES.map(([code, name]) => <IonSelectOption key={code} value={code}>{name}</IonSelectOption>)}
                        </IonSelect>
                      </IonCol>
                      <IonCol size="12" sizeMd="6">
                        <IonInput fill="outline" labelPlacement="floating" label="Zip Code *" value={formData.zip} onIonInput={e => handleZipChange(e.detail.value)} placeholder="12345" style={ionInputStyle} />
                        {validationErrors.zip && <IonNote color="danger" style={{ fontSize: "0.75rem" }}>{validationErrors.zip}</IonNote>}
                      </IonCol>
                    </IonRow>
                  </IonGrid>
                </div>
              </div>

              {/* ── Company Info ── */}
              <div style={cardStyle}>
                <span style={sectionHeadingStyle}>Company Information</span>
                <div>
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
                        <IonSelect fill="outline" labelPlacement="floating" label="Company State *" value={formData.companyState} onIonChange={e => setFormData(prev => ({ ...prev, companyState: e.detail.value }))} style={ionInputStyle}>
                          {US_STATES.map(([code, name]) => <IonSelectOption key={code} value={code}>{name}</IonSelectOption>)}
                        </IonSelect>
                      </IonCol>
                      <IonCol size="12" sizeMd="6">
                        <IonInput fill="outline" labelPlacement="floating" label="Company Zip *" value={formData.companyZip} onIonInput={e => handleCompanyZipChange(e.detail.value)} placeholder="12345" style={ionInputStyle} />
                        {validationErrors.companyZip && <IonNote color="danger" style={{ fontSize: "0.75rem" }}>{validationErrors.companyZip}</IonNote>}
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

                      {/* OnPay employee ID */}
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
              </div>

              {/* ── Pay Details ── */}
              <div style={cardStyle}>
                <span style={sectionHeadingStyle}>Pay Details</span>
                <div>
                  {/* Pay type toggle */}
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
                          <IonInput fill="outline" labelPlacement="floating" label="Hourly Rate ($) *" type="number" name="rate" value={formData.rate} onIonInput={e => handleChange({ target: { name:"rate", value: e.detail.value } })} style={ionInputStyle} />
                        ) : (
                          <IonInput fill="outline" labelPlacement="floating" label="Annual Salary ($) *" type="number" name="annualSalary" value={formData.annualSalary} onIonInput={e => handleChange({ target: { name:"annualSalary", value: e.detail.value } })} style={ionInputStyle} />
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
                      <IonItem button detail={false} onClick={() => setHoursExpanded(v => !v)} lines="none" style={{ "--background": "var(--ion-color-step-100)", borderRadius: 8, marginBottom: 8 }}>
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
                            <div key={index} style={{ background: "var(--ion-color-step-100)", borderRadius: 8, padding: 12, marginBottom: 8 }}>
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
                                    <IonInput fill="outline" labelPlacement="floating" label="Commission ($)" type="number" value={hoursPerPeriod[index]?.commission ?? 0} onIonInput={e => handlePeriodHoursChange(index, "commission", e.detail.value)} style={ionInputStyle} />
                                  </IonCol>
                                  <IonCol size="6" sizeMd="3">
                                    <IonInput fill="outline" labelPlacement="floating" label="Tips ($)" type="number" value={hoursPerPeriod[index]?.tips ?? 0} onIonInput={e => handlePeriodHoursChange(index, "tips", e.detail.value)} style={ionInputStyle} />
                                  </IonCol>
                                  {(selectedTemplate === "template-h") && (
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
              </div>

              {/* ── Tax Settings ── */}
              <div style={cardStyle}>
                <span style={sectionHeadingStyle}>Tax Settings</span>
                <div>
                  <IonGrid>
                    <IonRow>
                      <IonCol size="12" sizeMd="6">
                        <IonSelect fill="outline" labelPlacement="floating" label="Federal Filing Status" value={formData.federalFilingStatus} onIonChange={e => setFormData(prev => ({ ...prev, federalFilingStatus: e.detail.value }))} style={ionInputStyle}>
                          <IonSelectOption value="">Default (22%)</IonSelectOption>
                          <IonSelectOption value="single">Single</IonSelectOption>
                          <IonSelectOption value="married">Married Filing Jointly</IonSelectOption>
                          <IonSelectOption value="married_separately">Married Filing Separately</IonSelectOption>
                          <IonSelectOption value="head_of_household">Head of Household</IonSelectOption>
                        </IonSelect>
                      </IonCol>
                      <IonCol size="12" sizeMd="6">
                        <IonInput fill="outline" labelPlacement="floating" label="State Allowances" type="number" name="stateAllowances" value={formData.stateAllowances} onIonInput={e => handleChange({ target: { name:"stateAllowances", value: e.detail.value } })} style={ionInputStyle} />
                      </IonCol>
                      <IonCol size="12">
                        <IonItem lines="none">
                          <IonLabel>Include Local Tax</IonLabel>
                          <IonToggle slot="end" checked={formData.includeLocalTax} onIonChange={e => setFormData(prev => ({ ...prev, includeLocalTax: e.detail.checked }))} />
                        </IonItem>
                      </IonCol>
                    </IonRow>
                  </IonGrid>
                </div>
              </div>

              {/* ── Deductions ── */}
              <div style={cardStyle}>
                <span style={sectionHeadingStyle}>Deductions {deductions.length > 0 && <IonBadge color="primary">{deductions.length}</IonBadge>}</span>
                <div>
                  {deductions.map(d => (
                    <div key={d.id} style={{ background: "var(--ion-color-step-100)", borderRadius: 8, padding: 10, marginBottom: 8 }}>
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
                            <IonInput fill="outline" labelPlacement="floating" label={d.isPercentage ? "Amount (%)" : "Amount ($)"} type="number" value={d.amount} onIonInput={e => updateDeduction(d.id, "amount", e.detail.value)} style={ionInputStyle} />
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
              </div>

              {/* ── Contributions ── */}
              <div style={cardStyle}>
                <span style={sectionHeadingStyle}>Contributions (401k, HSA, etc.) {contributions.length > 0 && <IonBadge color="secondary">{contributions.length}</IonBadge>}</span>
                <div>
                  {contributions.map(c => (
                    <div key={c.id} style={{ background: "var(--ion-color-step-100)", borderRadius: 8, padding: 10, marginBottom: 8 }}>
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
                            <IonInput fill="outline" labelPlacement="floating" label={c.isPercentage ? "Amount (%)" : "Amount ($)"} type="number" value={c.amount} onIonInput={e => updateContribution(c.id, "amount", e.detail.value)} style={ionInputStyle} />
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
              </div>

              {/* ── Employer Benefits (Template C only) ── */}
              {selectedTemplate === "template-c" && formData.workerType === "employee" && (
                <div style={cardStyle}>
                  <span style={sectionHeadingStyle}>Employer Benefits {employerBenefits.length > 0 && <IonBadge color="tertiary">{employerBenefits.length}</IonBadge>}</span>
                  <div>
                    {employerBenefits.map(b => (
                      <div key={b.id} style={{ background: "var(--ion-color-step-100)", borderRadius: 8, padding: 10, marginBottom: 8 }}>
                        <IonGrid>
                          <IonRow>
                            <IonCol size="12" sizeMd="5">
                              <IonSelect fill="outline" labelPlacement="floating" label="Benefit Type" value={b.type} onIonChange={e => updateEmployerBenefit(b.id, "type", e.detail.value)} style={ionInputStyle}>
                                {employerBenefitTypes.map(t => <IonSelectOption key={t.value} value={t.value}>{t.label}</IonSelectOption>)}
                              </IonSelect>
                            </IonCol>
                            {b.type !== "401k_match" && (
                              <IonCol size="12" sizeMd="4">
                                <IonInput fill="outline" labelPlacement="floating" label="Description" value={b.name} onIonInput={e => updateEmployerBenefit(b.id, "name", e.detail.value)} style={ionInputStyle} />
                              </IonCol>
                            )}
                            {b.type === "401k_match" ? (
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
                                <IonInput fill="outline" labelPlacement="floating" label={b.isPercentage ? "Amount (%)" : "Amount ($)"} type="number" value={b.amount} onIonInput={e => updateEmployerBenefit(b.id, "amount", e.detail.value)} style={ionInputStyle} />
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
                </div>
              )}

              {/* ── Absence Plans (Template C / H) ── */}
              {(selectedTemplate === "template-c" || selectedTemplate === "template-h") && formData.workerType === "employee" && (
                <div style={cardStyle}>
                  <span style={sectionHeadingStyle}>Absence Plans (PTO, Vacation, Sick) {absencePlans.length > 0 && <IonBadge color="medium">{absencePlans.length}</IonBadge>}</span>
                  <div>
                    {absencePlans.map(p => (
                      <div key={p.id} style={{ background: "var(--ion-color-step-100)", borderRadius: 8, padding: 10, marginBottom: 8 }}>
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
                </div>
              )}

            </div>

            <div style={{ marginTop: 12, textAlign: "right" }}>
              <IonButton fill="outline" color="medium" size="small" onClick={clearForm}>Clear Form</IonButton>
            </div>
          </div>
          </div>
        </div>,
        document.querySelector("ion-app") || document.body
      )}

      {/* ── Preview Modal (portalled to ion-app) ── */}
      {previewModalOpen && createPortal(
        <div style={{ position: "fixed", inset: 0, zIndex: 10001, background: "var(--ion-background-color, #f2f2f7)", display: "flex", flexDirection: "column" }}>
          <div style={{ background: "var(--ion-color-primary, #16a34a)", display: "flex", alignItems: "center", padding: "0 4px", minHeight: 56, flexShrink: 0 }}>
            <button onClick={() => setPreviewModalOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", padding: 10, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 8 }}>
              <IonIcon icon={arrowBackOutline} style={{ fontSize: 22, color: "rgba(255,255,255,0.9)" }} />
            </button>
            <span style={{ flex: 1, textAlign: "center", color: "#fff", fontWeight: 700, fontSize: "1rem" }}>
              Preview {pdfPreviews.length > 1 ? `(${previewPageIndex + 1} of ${pdfPreviews.length})` : ""}
            </span>
            <div style={{ width: 46 }} />
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
              {isGeneratingPreview ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 320, background: "var(--ion-color-step-100)", borderRadius: 8 }}>
                  <IonSpinner name="crescent" style={{ marginBottom: 8 }} />
                  <span style={{ fontSize: "0.8rem", color: "var(--ion-color-medium)" }}>Generating preview…</span>
                </div>
              ) : pdfPreviews.length > 0 && pdfPreviews[previewPageIndex] ? (
                <>
                  {isNative ? (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: 32 }}>
                      <IonIcon icon={cloudDownloadOutline} style={{ fontSize: 56, color: "var(--ion-color-medium)" }} />
                      <p style={{ textAlign: "center", color: "var(--ion-color-medium)", margin: 0, fontSize: "0.9rem" }}>
                        PDF preview is not supported on mobile.
                      </p>
                      <IonButton onClick={() => { const a = document.createElement("a"); a.href = pdfPreviews[previewPageIndex]; a.download = "paystub_preview.pdf"; a.click(); }}>
                        <IonIcon slot="start" icon={cloudDownloadOutline} />
                        Download Preview
                      </IonButton>
                    </div>
                  ) : (
                    <div style={{ borderRadius: 8, overflow: "hidden", border: "1px solid var(--ion-color-light-shade)", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
                      <iframe
                        src={pdfPreviews[previewPageIndex]}
                        title={`Pay stub preview ${previewPageIndex + 1}`}
                        style={{ width: "100%", height: "65vh", border: "none", display: "block" }}
                      />
                    </div>
                  )}
                  {pdfPreviews.length > 1 && (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 12 }}>
                      <IonButton fill="clear" size="small" disabled={previewPageIndex === 0} onClick={() => setPreviewPageIndex(i => Math.max(0, i - 1))}>
                        <IonIcon icon={chevronBackOutline} />
                      </IonButton>
                      {pdfPreviews.map((_, idx) => (
                        <button key={idx} onClick={() => setPreviewPageIndex(idx)} style={{ width: 28, height: 28, borderRadius: "50%", border: "none", cursor: "pointer", fontWeight: 600, fontSize: "0.75rem", background: idx === previewPageIndex ? "var(--ion-color-success)" : "var(--ion-color-step-150)", color: idx === previewPageIndex ? "#fff" : "var(--ion-color-dark)" }}>
                          {idx + 1}
                        </button>
                      ))}
                      <IonButton fill="clear" size="small" disabled={previewPageIndex === pdfPreviews.length - 1} onClick={() => setPreviewPageIndex(i => Math.min(pdfPreviews.length - 1, i + 1))}>
                        <IonIcon icon={chevronForwardOutline} />
                      </IonButton>
                    </div>
                  )}
                  <p style={{ textAlign: "center", fontSize: "0.75rem", color: "var(--ion-color-medium)", marginTop: 8 }}>Watermark removed after payment</p>
                </>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 320, background: "var(--ion-color-step-100)", borderRadius: 8, border: "2px dashed var(--ion-color-light-shade)" }}>
                  <IonIcon icon={eyeOutline} style={{ fontSize: "2.5rem", color: "var(--ion-color-medium)", marginBottom: 8 }} />
                  <p style={{ fontSize: "0.8rem", color: "var(--ion-color-medium)", textAlign: "center", margin: 0 }}>No preview available yet</p>
                </div>
              )}

              {!hasActiveSubscription && calculateNumStubs > 0 && (
                <div style={{ marginTop: 20 }}>
                  {!appliedDiscount ? (
                    <>
                      <div style={{ display: "flex", gap: 8 }}>
                        <input
                          type="text"
                          placeholder="Coupon code"
                          value={couponCode}
                          onChange={e => { setCouponCode(e.target.value.toUpperCase()); setCouponError(""); }}
                          style={{ flex: 1, fontFamily: "monospace", height: 42, padding: "0 12px", borderRadius: 4, border: "1.5px solid var(--ion-color-step-300, rgba(0,0,0,0.2))", background: "transparent", color: "var(--ion-text-color)", fontSize: "0.9rem", outline: "none" }}
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

              {!hasActiveSubscription && calculateNumStubs > 0 && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--ion-color-light-shade)", textAlign: "center" }}>
                  {appliedDiscount ? (
                    <>
                      <p style={{ textDecoration: "line-through", color: "var(--ion-color-medium)", fontSize: "0.9rem", margin: "0 0 4px" }}>${(calculateNumStubs * 9.99).toFixed(2)}</p>
                      <p style={{ fontWeight: 700, fontSize: "1.3rem", color: "var(--ion-color-success-shade)", margin: "0 0 4px" }}>${appliedDiscount.discountedPrice.toFixed(2)}</p>
                      <p style={{ fontSize: "0.75rem", color: "var(--ion-color-success)", margin: 0 }}>{appliedDiscount.discountPercent}% discount applied</p>
                    </>
                  ) : (
                    <>
                      <p style={{ fontWeight: 700, fontSize: "1.2rem", color: "var(--ion-color-success-shade)", margin: "0 0 4px" }}>${(calculateNumStubs * 9.99).toFixed(2)}</p>
                      <p style={{ fontSize: "0.75rem", color: "var(--ion-color-medium)", margin: 0 }}>$9.99 per stub</p>
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
          </div>,
        document.querySelector("ion-app") || document.body
      )}

      <IonToast
        isOpen={toastState.isOpen}
        message={toastState.message}
        color={toastState.color}
        duration={3000}
        onDidDismiss={() => setToastState(s => ({ ...s, isOpen: false }))}
        position="bottom"
      />
    </AppLayout>
  );
}

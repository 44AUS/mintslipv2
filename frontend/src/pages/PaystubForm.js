import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";
import { generateAndDownloadPaystub } from "@/utils/paystubGenerator";
import { generatePreviewPDF, generateAllPreviewPDFs } from "@/utils/paystubPreviewGenerator";
import { getLocalTaxRate, getCitiesWithLocalTax, stateHasLocalTax, getSUTARate } from "@/utils/taxRates";
import { calculateFederalTax, calculateStateTax, stateUsesAllowances, stateHasNoIncomeTax, getStateTaxRate, getStateTaxInfo } from "@/utils/federalTaxCalculator";
import AddressAutocomplete from "@/components/AddressAutocomplete";
import CouponInput from "@/components/CouponInput";
import { Upload, X, Search, Building2, ChevronLeft, ChevronRight, CreditCard, Lock, Loader2 } from "lucide-react";
import { 
  formatPhoneNumber, validatePhoneNumber,
  formatZipCode, validateZipCode,
  formatSSNLast4, validateSSNLast4,
  formatBankLast4, validateBankLast4
} from "@/utils/validation";
import GustoLogo from '../assests/gustoLogo.png';
import ADPLogo from '../assests/adp-logo.png';
import WorkdayLogo from '../assests/workday-logo.png';
import OnPayLogo from '../assests/onpayLogo.webp';

// Canadian Flag SVG component
const CanadianFlagIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className="w-8 h-8 rounded-full">
    <circle cx="256" cy="256" r="256" fill="#f0f0f0"/>
    <path d="M512 256c0-101.5-59.1-189.2-144.7-230.5v461C452.9 445.2 512 357.5 512 256zM0 256c0 101.5 59.1 189.2 144.7 230.5v-461C59.1 66.8 0 154.5 0 256z" fill="#d80027"/>
    <path d="M303.5 294.9l47-15.7-15.7-10.4 15.7-26.2-31.3 5.2-5.2-36.5-26.2 31.3-31.3-20.9v26.2l-36.5-5.2 20.9 26.1-20.9 15.7 47 15.7-10.4 36.5h26.1V352h20.9v-20.9h26.1l-26.1-36.2z" fill="#d80027"/>
  </svg>
);

// Payroll company templates with logos
// Check if running on localhost
const isLocalhost = typeof window !== 'undefined' && (
  window.location.hostname === 'localhost' || 
  window.location.hostname === '127.0.0.1'
);

const PAYROLL_COMPANIES = [
  { id: 'gusto', name: 'Gusto', template: 'template-a', logo: GustoLogo },
  { id: 'workday', name: 'Workday', template: 'template-c', logo: WorkdayLogo },
  { id: 'onpay', name: 'OnPay', template: 'template-h', logo: OnPayLogo },
  // ADP template only visible on localhost
  ...(isLocalhost ? [
    { id: 'adp', name: 'ADP', template: 'template-b', logo: ADPLogo },
  ] : []),
];

export default function PaystubForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Get template from URL query parameter
  const templateFromUrl = searchParams.get('template');
  
  // User subscription state
  const [user, setUser] = useState(null);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  
  // Location detection state
  const [userCountry, setUserCountry] = useState(null);
  const [showLocationAlert, setShowLocationAlert] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [appliedDiscount, setAppliedDiscount] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(
    templateFromUrl && ['template-a', 'template-b', 'template-c', 'template-h'].includes(templateFromUrl) 
      ? templateFromUrl 
      : "template-a"
  );
  const [pdfPreviews, setPdfPreviews] = useState([]); // Array of preview images
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0); // Current page being viewed
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";
  
  // Check user subscription on mount
  useEffect(() => {
    checkUserSubscription();
  }, []);
  
  const checkUserSubscription = async () => {
    const token = localStorage.getItem("userToken");
    const userInfo = localStorage.getItem("userInfo");
    
    if (token && userInfo) {
      try {
        const userData = JSON.parse(userInfo);
        setUser(userData);
        
        // Check if user has active subscription with downloads remaining
        if (userData.subscription && 
            userData.subscription.status === "active" &&
            (userData.subscription.downloads_remaining > 0 || userData.subscription.downloads_remaining === -1)) {
          setHasActiveSubscription(true);
        }
        
        // Fetch fresh user data
        const response = await fetch(`${BACKEND_URL}/api/user/me`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.user) {
            setUser(data.user);
            localStorage.setItem("userInfo", JSON.stringify(data.user));
            
            // Update subscription status
            if (data.user.subscription && 
                data.user.subscription.status === "active" &&
                (data.user.subscription.downloads_remaining > 0 || data.user.subscription.downloads_remaining === -1)) {
              setHasActiveSubscription(true);
            } else {
              setHasActiveSubscription(false);
            }
          }
        }
      } catch (error) {
        console.error("Error checking subscription:", error);
      }
    }
  };
  
  // Handle subscription-based download
  const handleSubscriptionDownload = async () => {
    const token = localStorage.getItem("userToken");
    if (!token) {
      toast.error("Please log in to use your subscription");
      navigate("/login");
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // Call backend to validate and track the subscription download
      // Pass the count of paystubs being generated
      const response = await fetch(`${BACKEND_URL}/api/user/subscription-download`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          documentType: "paystub",
          template: selectedTemplate,
          count: calculateNumStubs  // Pass the number of paystubs being downloaded
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || "Failed to process subscription download");
      }
      
      // Prepare formData with deductions, contributions, absence plans, employer benefits, and company logo
      const fullFormData = {
        ...formData,
        deductions: deductions,
        contributions: contributions,
        absencePlans: absencePlans,
        employerBenefits: employerBenefits,
        companyLogo: companyLogo,
        logoDataUrl: logoPreview,
      };
      
      // Check if user wants documents saved
      const shouldSave = user?.preferences?.saveDocuments;
      
      // Generate and download PDF - request blob if saving is enabled
      const pdfBlob = await generateAndDownloadPaystub(fullFormData, selectedTemplate, calculateNumStubs, shouldSave);
      
      // Save document if user has preference enabled and blob was returned
      if (shouldSave && pdfBlob) {
        try {
          const reader = new FileReader();
          reader.onloadend = async () => {
            const base64Data = reader.result.split(',')[1];
            const fileExt = calculateNumStubs > 1 ? '.zip' : '.pdf';
            const fileName = `paystub_${new Date().toISOString().split('T')[0]}${fileExt}`;
            
            await fetch(`${BACKEND_URL}/api/user/saved-documents`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
              },
              body: JSON.stringify({
                documentType: "paystub",
                fileName: fileName,
                fileData: base64Data,
                template: selectedTemplate
              })
            });
            toast.success("Document saved to your account!");
          };
          reader.readAsDataURL(pdfBlob);
        } catch (saveError) {
          console.error("Failed to save document:", saveError);
          // Don't block the download if save fails
        }
      }
      
      // Update local user data with new downloads remaining
      if (data.downloadsRemaining !== undefined) {
        const updatedUser = { ...user };
        if (updatedUser.subscription) {
          updatedUser.subscription.downloads_remaining = data.downloadsRemaining;
        }
        setUser(updatedUser);
        localStorage.setItem("userInfo", JSON.stringify(updatedUser));
        
        // Check if no downloads remaining (and not unlimited)
        if (data.downloadsRemaining === 0) {
          setHasActiveSubscription(false);
        }
      }
      
      // Clear the uploaded logo from localStorage after successful download
      localStorage.removeItem('paystubCompanyLogo');
      setCompanyLogo(null);
      setLogoPreview(null);
      
      // Reset payroll company selection
      setSelectedPayrollCompany(null);
      setCompanySearchQuery("");
      setSelectedTemplate("template-a");
      
      toast.success("Pay stub(s) downloaded successfully!");
      
      // Redirect to user downloads page
      navigate("/user/downloads");
      
    } catch (error) {
      console.error("Subscription download error:", error);
      toast.error(error.message || "Failed to download. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };
  
  const [hoursExpanded, setHoursExpanded] = useState(false);
  const [hoursPerPeriod, setHoursPerPeriod] = useState([]);
  const [deductions, setDeductions] = useState([]);
  const [contributions, setContributions] = useState([]);
  const [absencePlans, setAbsencePlans] = useState([]);
  const [employerBenefits, setEmployerBenefits] = useState([]);
  
  // Company search and logo upload state
  const [companySearchQuery, setCompanySearchQuery] = useState("");
  const [selectedPayrollCompany, setSelectedPayrollCompany] = useState(null);
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const [companyLogo, setCompanyLogo] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [logoError, setLogoError] = useState("");
  const companySearchRef = useRef(null);
  const logoInputRef = useRef(null);
  
  // Helper to format currency with commas
  const formatCurrency = (num) => {
    return Number(num).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };
  
  const [formData, setFormData] = useState({
    name: "",
    ssn: "",
    bank: "",
    bankName: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    company: "",
    companyAddress: "",
    companyCity: "",
    companyState: "",
    companyZip: "",
    companyPhone: "",
    hireDate: "",
    startDate: "",
    endDate: "",
    rate: "",
    payFrequency: "biweekly",
    payDay: "Friday",
    hoursList: "",
    overtimeList: "",
    commissionList: "", // Commission amounts per pay period
    startDateList: "", // Pay period start dates per check
    endDateList: "", // Pay period end dates per check
    payDateList: "", // Pay dates per check
    includeLocalTax: true,
    workerType: "employee", // "employee" or "contractor"
    payType: "hourly", // "hourly" or "salary"
    annualSalary: "", // for salary pay type
    federalFilingStatus: "", // optional: single, married_jointly, head_of_household (no more allowances per 2020 W-4)
    stateAllowances: "0", // number of state allowances (only for states that use them)
    employeeId: "", // Employee ID for Workday template
    // ADP Template B specific fields
    companyCode: "", // Company Code for ADP template
    locDept: "", // Loc/Dept for ADP template
    checkNumber: "", // Check Number for ADP template
    // OnPay Template H specific fields
    memo: "", // Memo for OnPay template
  });

  // Validation errors state
  const [validationErrors, setValidationErrors] = useState({
    ssn: '',
    bank: '',
    zip: '',
    companyZip: '',
    companyPhone: '',
    companyCode: '',
    locDept: '',
    checkNumber: '',
  });

  // Common deduction types for quick selection
  const deductionTypes = [
    { label: "Health Insurance", value: "health_insurance", preTax: true },
    { label: "Dental Insurance", value: "dental_insurance", preTax: true },
    { label: "Vision Insurance", value: "vision_insurance", preTax: true },
    { label: "Life Insurance", value: "life_insurance", preTax: false },
    { label: "Disability Insurance", value: "disability_insurance", preTax: false },
    { label: "Union Dues", value: "union_dues", preTax: false },
    { label: "Garnishment", value: "garnishment", preTax: false },
    { label: "Other", value: "other", preTax: false },
  ];

  // Common contribution types for quick selection
  const contributionTypes = [
    { label: "Traditional 401(k)", value: "401k", preTax: true },
    { label: "Roth 401(k)", value: "roth_401k", preTax: false },
    { label: "HSA", value: "hsa", preTax: true },
    { label: "FSA", value: "fsa", preTax: true },
    { label: "Dependent Care FSA", value: "dependent_care_fsa", preTax: true },
    { label: "Commuter Benefits", value: "commuter", preTax: true },
    { label: "Other", value: "other", preTax: false },
  ];

  // Detect user's location on mount
  useEffect(() => {
    const detectLocation = async () => {
      try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        if (data.country_code === 'CA') {
          setUserCountry('CA');
          setShowLocationAlert(true);
        }
      } catch (error) {
        console.error('Location detection failed:', error);
      }
    };
    detectLocation();
  }, []);

  // Add a new deduction
  const addDeduction = () => {
    setDeductions([...deductions, { 
      id: Date.now(), 
      type: "other", 
      name: "", 
      amount: "", 
      isPercentage: false,
      preTax: false // Default to post-tax for "other"
    }]);
  };

  // Remove a deduction
  const removeDeduction = (id) => {
    setDeductions(deductions.filter(d => d.id !== id));
  };

  // Update a deduction - uses functional update to avoid stale closure issues
  const updateDeduction = (id, field, value) => {
    setDeductions(prev => prev.map(d => {
      if (d.id === id) {
        const updated = { ...d, [field]: value };
        // Auto-set preTax based on type
        if (field === 'type') {
          const dedType = deductionTypes.find(t => t.value === value);
          if (dedType) {
            updated.preTax = dedType.preTax;
          }
        }
        return updated;
      }
      return d;
    }));
  };

  // Add a new contribution
  const addContribution = () => {
    setContributions([...contributions, { 
      id: Date.now(), 
      type: "other", 
      name: "", 
      amount: "", 
      isPercentage: false,
      preTax: false // Default to post-tax for "other"
    }]);
  };

  // Remove a contribution
  const removeContribution = (id) => {
    setContributions(contributions.filter(c => c.id !== id));
  };

  // Update a contribution - uses functional update to avoid stale closure issues
  const updateContribution = (id, field, value) => {
    setContributions(prev => prev.map(c => {
      if (c.id === id) {
        const updated = { ...c, [field]: value };
        // Auto-set preTax based on type
        if (field === 'type') {
          const contribType = contributionTypes.find(t => t.value === value);
          if (contribType) {
            updated.preTax = contribType.preTax;
          }
        }
        return updated;
      }
      return c;
    }));
  };

  // Add a new absence plan (only for Template C)
  const addAbsencePlan = () => {
    setAbsencePlans([...absencePlans, { 
      id: Date.now(), 
      description: "PTO Plan", 
      accrued: "", 
      reduced: "" 
    }]);
  };

  // Remove an absence plan
  const removeAbsencePlan = (id) => {
    setAbsencePlans(absencePlans.filter(p => p.id !== id));
  };

  // Update an absence plan
  const updateAbsencePlan = (id, field, value) => {
    setAbsencePlans(absencePlans.map(p => 
      p.id === id ? { ...p, [field]: value } : p
    ));
  };

  // Employer Benefits types for Template C
  const employerBenefitTypes = [
    { label: "401(k) Employer Match", value: "401k_match" },
    { label: "Employer Paid Life Insurance", value: "life_insurance" },
    { label: "Employer Paid Health Insurance", value: "health_insurance" },
    { label: "Employer Paid Dental", value: "dental" },
    { label: "Employer Paid Vision", value: "vision" },
    { label: "Employer HSA Contribution", value: "hsa_contribution" },
    { label: "Employer Disability Insurance", value: "disability" },
    { label: "Other Employer Benefit", value: "other" },
  ];

  // Add a new employer benefit (only for Template C)
  const addEmployerBenefit = () => {
    setEmployerBenefits([...employerBenefits, { 
      id: Date.now(), 
      type: "401k_match",
      name: "401(k) Employer Match",
      amount: "", 
      isPercentage: false,
      matchPercent: 50, // Default 50% match
      matchUpTo: 6, // Default match up to 6% of salary
    }]);
  };

  // Remove an employer benefit
  const removeEmployerBenefit = (id) => {
    setEmployerBenefits(employerBenefits.filter(b => b.id !== id));
  };

  // Update an employer benefit
  const updateEmployerBenefit = (id, field, value) => {
    setEmployerBenefits(employerBenefits.map(b => {
      if (b.id === id) {
        const updated = { ...b, [field]: value };
        // Auto-set name based on type
        if (field === 'type') {
          const benefitType = employerBenefitTypes.find(t => t.value === value);
          if (benefitType && value !== 'other') {
            updated.name = benefitType.label;
          }
          // Reset match settings when switching to/from 401k_match
          if (value === '401k_match') {
            updated.matchPercent = updated.matchPercent || 50;
            updated.matchUpTo = updated.matchUpTo || 6;
          }
        }
        return updated;
      }
      return b;
    }));
  };

  // Calculate employer 401k match based on employee contribution
  const calculate401kMatch = (grossPay, benefit) => {
    if (benefit.type !== '401k_match') return 0;
    
    // Find employee's 401k contribution
    const employee401k = contributions.find(c => c.type === '401k' || c.type === 'roth_401k');
    if (!employee401k) return 0;
    
    // Calculate employee's contribution amount
    const employeeContribAmount = employee401k.isPercentage 
      ? (grossPay * parseFloat(employee401k.amount) / 100) 
      : parseFloat(employee401k.amount) || 0;
    
    // Calculate the employee's contribution as percentage of gross
    const employeeContribPercent = (employeeContribAmount / grossPay) * 100;
    
    // Employer matches up to X% of salary
    const matchUpTo = parseFloat(benefit.matchUpTo) || 6;
    const matchPercent = parseFloat(benefit.matchPercent) || 50;
    
    // The matchable amount is the lesser of: employee contribution or matchUpTo% of gross
    const maxMatchableAmount = grossPay * (matchUpTo / 100);
    const matchableAmount = Math.min(employeeContribAmount, maxMatchableAmount);
    
    // Employer matches at matchPercent rate
    return matchableAmount * (matchPercent / 100);
  };

  // Generate PDF previews for all paystubs when form data changes (debounced)
  useEffect(() => {
    const timer = setTimeout(async () => {
      // Only generate preview if we have minimum required data
      if (formData.startDate && formData.endDate && (formData.rate || formData.annualSalary)) {
        setIsGeneratingPreview(true);
        try {
          // Include deductions, contributions, absence plans, employer benefits, and logo in preview data
          const previewData = {
            ...formData,
            deductions: deductions,
            contributions: contributions,
            absencePlans: absencePlans, // Pass absence plans for Template C and H
            employerBenefits: employerBenefits, // Pass employer benefits for Template C
            logoDataUrl: logoPreview, // Pass logo for Workday template
          };
          // Calculate number of stubs directly
          const start = new Date(formData.startDate);
          const end = new Date(formData.endDate);
          const diffTime = Math.abs(end - start);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          const periodLength = formData.payFrequency === "biweekly" ? 14 : 7;
          const numStubs = Math.max(1, Math.ceil(diffDays / periodLength));
          
          // Generate all previews for all paystubs
          const previews = await generateAllPreviewPDFs(previewData, selectedTemplate, numStubs);
          setPdfPreviews(previews);
          // Reset to first page if current index is out of bounds
          if (currentPreviewIndex >= previews.length) {
            setCurrentPreviewIndex(0);
          }
        } catch (error) {
          console.error("Preview generation failed:", error);
        }
        setIsGeneratingPreview(false);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [formData, selectedTemplate, deductions, contributions, absencePlans, employerBenefits, logoPreview, currentPreviewIndex]);

  // Determine if salary option should be available
  // Contractors on Gusto (template-a) can only use hourly
  const canUseSalary = !(formData.workerType === "contractor" && selectedTemplate === "template-a");
  
  // Auto-switch to hourly if contractor selects Gusto template
  // Also clear overtime for contractors
  const handleWorkerTypeChange = (val) => {
    setFormData(prev => {
      const newData = { ...prev, workerType: val };
      // If contractor on Gusto, force hourly
      if (val === "contractor" && selectedTemplate === "template-a") {
        newData.payType = "hourly";
      }
      return newData;
    });
    
    // Clear overtime if switching to contractor
    if (val === "contractor") {
      setHoursPerPeriod(prev => prev.map(p => ({ ...p, overtime: 0 })));
    }
  };

  // Handle template change - reset to employee if template B or C is selected (no contractor option)
  const handleTemplateChange = (val) => {
    setSelectedTemplate(val);
    // Template B (ADP) and Template C (Workday) don't support contractor - force employee
    if ((val === "template-b" || val === "template-c") && formData.workerType === "contractor") {
      setFormData(prev => ({ ...prev, workerType: "employee" }));
    }
    if (formData.workerType === "contractor" && val === "template-a") {
      setFormData(prev => ({ ...prev, payType: "hourly" }));
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  // Validated input handlers
  const handleSSNChange = (e) => {
    const formatted = formatSSNLast4(e.target.value);
    setFormData(prev => ({ ...prev, ssn: formatted }));
    const validation = validateSSNLast4(formatted);
    setValidationErrors(prev => ({ ...prev, ssn: validation.error }));
  };

  const handleBankChange = (e) => {
    const formatted = formatBankLast4(e.target.value);
    setFormData(prev => ({ ...prev, bank: formatted }));
    const validation = validateBankLast4(formatted);
    setValidationErrors(prev => ({ ...prev, bank: validation.error }));
  };

  const handleZipChange = (e) => {
    const formatted = formatZipCode(e.target.value);
    setFormData(prev => ({ ...prev, zip: formatted }));
    const validation = validateZipCode(formatted);
    setValidationErrors(prev => ({ ...prev, zip: validation.error }));
  };

  const handleCompanyZipChange = (e) => {
    const formatted = formatZipCode(e.target.value);
    setFormData(prev => ({ ...prev, companyZip: formatted }));
    const validation = validateZipCode(formatted);
    setValidationErrors(prev => ({ ...prev, companyZip: validation.error }));
  };

  const handleCompanyPhoneChange = (e) => {
    const formatted = formatPhoneNumber(e.target.value);
    setFormData(prev => ({ ...prev, companyPhone: formatted }));
    const validation = validatePhoneNumber(formatted);
    setValidationErrors(prev => ({ ...prev, companyPhone: validation.error }));
  };

  // ADP field validation handlers
  const handleCompanyCodeChange = (e) => {
    const value = e.target.value.toUpperCase();
    // Allow alphanumeric, spaces, and slashes - max 20 characters
    const filtered = value.replace(/[^A-Z0-9\s\/]/g, '').slice(0, 20);
    setFormData(prev => ({ ...prev, companyCode: filtered }));
    
    let error = '';
    if (filtered && filtered.length < 3) {
      error = 'Min 3 characters';
    }
    setValidationErrors(prev => ({ ...prev, companyCode: error }));
  };

  const handleLocDeptChange = (e) => {
    const value = e.target.value;
    // Only allow numbers - max 3 digits
    const filtered = value.replace(/[^0-9]/g, '').slice(0, 3);
    setFormData(prev => ({ ...prev, locDept: filtered }));
    
    let error = '';
    if (filtered && filtered.length !== 3) {
      error = 'Must be 3 digits';
    }
    setValidationErrors(prev => ({ ...prev, locDept: error }));
  };

  const handleCheckNumberChange = (e) => {
    const value = e.target.value;
    // Only allow numbers - max 7 digits
    const filtered = value.replace(/[^0-9]/g, '').slice(0, 7);
    setFormData(prev => ({ ...prev, checkNumber: filtered }));
    
    let error = '';
    if (filtered && filtered.length < 6) {
      error = 'Must be 6-7 digits';
    }
    setValidationErrors(prev => ({ ...prev, checkNumber: error }));
  };

  // Filter payroll companies based on search
  const filteredCompanies = PAYROLL_COMPANIES.filter(company =>
    company.name.toLowerCase().includes(companySearchQuery.toLowerCase())
  );

  // Handle payroll company selection
  const handlePayrollCompanySelect = (company) => {
    setSelectedPayrollCompany(company);
    setCompanySearchQuery(company.name);
    setSelectedTemplate(company.template);
    setShowCompanyDropdown(false);
    
    // Reset worker type to employee if template B or C
    if ((company.template === "template-b" || company.template === "template-c") && formData.workerType === "contractor") {
      setFormData(prev => ({ ...prev, workerType: "employee" }));
    }
  };

  // Resize image to fit within target dimensions while maintaining aspect ratio
  const resizeImageToFit = (base64Data, maxWidth, maxHeight) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        // Calculate scaling factor to fit within bounds
        const scaleW = maxWidth / img.width;
        const scaleH = maxHeight / img.height;
        const scale = Math.min(scaleW, scaleH, 1); // Don't upscale if smaller
        
        const newWidth = Math.round(img.width * scale);
        const newHeight = Math.round(img.height * scale);
        
        // Create canvas and resize
        const canvas = document.createElement('canvas');
        canvas.width = newWidth;
        canvas.height = newHeight;
        const ctx = canvas.getContext('2d');
        
        // Enable smooth scaling
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // Draw resized image
        ctx.drawImage(img, 0, 0, newWidth, newHeight);
        
        // Convert to PNG base64
        const resizedBase64 = canvas.toDataURL('image/png');
        resolve(resizedBase64);
      };
      img.onerror = () => reject(new Error('Failed to load image for resizing'));
      img.src = base64Data;
    });
  };

  // Logo upload validation and processing
  const validateAndProcessLogo = async (file) => {
    setLogoError("");
    
    // Check file type - accept PNG and JPG
    if (!file.type.includes('png') && !file.type.includes('jpeg') && !file.type.includes('jpg')) {
      setLogoError("Only PNG or JPG files are accepted");
      return false;
    }
    
    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setLogoError("File size must be under 2MB");
      return false;
    }
    
    return new Promise((resolve) => {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const base64 = e.target.result;
          
          // Resize to fit Gusto logo dimensions (120x35 in PDF units ≈ 360x105 pixels for good quality)
          // Using 3x scale for crisp display
          const resizedBase64 = await resizeImageToFit(base64, 360, 105);
          
          localStorage.setItem('paystubCompanyLogo', resizedBase64);
          setCompanyLogo(resizedBase64);
          setLogoPreview(resizedBase64);
          resolve(true);
        } catch (err) {
          console.error('Error processing logo:', err);
          setLogoError("Error processing image");
          resolve(false);
        }
      };
      reader.onerror = () => {
        setLogoError("Error reading file");
        resolve(false);
      };
      reader.readAsDataURL(file);
    });
  };

  // Handle file drop
  const handleLogoDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await validateAndProcessLogo(files[0]);
    }
  };

  // Handle file select
  const handleLogoSelect = async (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      await validateAndProcessLogo(files[0]);
    }
  };

  // Remove uploaded logo
  const removeLogo = () => {
    setCompanyLogo(null);
    setLogoPreview(null);
    localStorage.removeItem('paystubCompanyLogo');
    if (logoInputRef.current) {
      logoInputRef.current.value = '';
    }
  };

  // Clear any previously saved logo on mount (fresh start each time)
  useEffect(() => {
    localStorage.removeItem('paystubCompanyLogo');
    setCompanyLogo(null);
    setLogoPreview(null);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (companySearchRef.current && !companySearchRef.current.contains(event.target)) {
        setShowCompanyDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle employee address selection from Google Places
  const handleEmployeeAddressSelect = useCallback((addressData) => {
    setFormData(prev => ({
      ...prev,
      address: addressData.address,
      city: addressData.city,
      state: addressData.state,
      zip: addressData.zip
    }));
  }, []);

  // Handle company address selection from Google Places
  const handleCompanyAddressSelect = useCallback((addressData) => {
    setFormData(prev => ({
      ...prev,
      companyAddress: addressData.address,
      companyCity: addressData.city,
      companyState: addressData.state,
      companyZip: addressData.zip
    }));
  }, []);

  const calculateNumStubs = useMemo(() => {
    if (!formData.startDate || !formData.endDate) return 0;
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const periodLength = formData.payFrequency === "biweekly" ? 14 : 7;
    return Math.ceil(diffDays / periodLength);
  }, [formData.startDate, formData.endDate, formData.payFrequency]);

  // Calculate pay periods with start/end dates for hours editing
  const payPeriods = useMemo(() => {
    if (!formData.startDate || !formData.endDate || calculateNumStubs === 0) return [];
    
    const periods = [];
    const periodLength = formData.payFrequency === "biweekly" ? 14 : 7;
    let currentStart = new Date(formData.startDate);
    
    // Helper to format date as YYYY-MM-DD for input fields
    const formatDateForInput = (date) => {
      const d = new Date(date);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    // Helper to get next weekday (pay day)
    const getNextPayDay = (date, targetDay) => {
      const days = { 'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6 };
      const target = days[targetDay] ?? 5; // Default to Friday
      const result = new Date(date);
      while (result.getDay() !== target) {
        result.setDate(result.getDate() + 1);
      }
      return result;
    };
    
    for (let i = 0; i < calculateNumStubs; i++) {
      const periodEnd = new Date(currentStart);
      periodEnd.setDate(currentStart.getDate() + periodLength - 1);
      const payDate = getNextPayDay(periodEnd, formData.payDay);
      
      periods.push({
        index: i,
        startDate: new Date(currentStart),
        endDate: periodEnd,
        payDate: payDate,
        start: formatDateForInput(currentStart),
        end: formatDateForInput(periodEnd),
        pay: formatDateForInput(payDate),
        label: `${currentStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${periodEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
      });
      
      currentStart = new Date(periodEnd);
      currentStart.setDate(currentStart.getDate() + 1);
    }
    
    return periods;
  }, [formData.startDate, formData.endDate, formData.payFrequency, formData.payDay, calculateNumStubs]);

  // Initialize hoursPerPeriod when pay periods change
  useEffect(() => {
    const defaultHours = formData.payFrequency === "biweekly" ? 80 : 40;
    
    if (payPeriods.length > 0) {
      setHoursPerPeriod(prev => {
        const newHours = payPeriods.map((period, i) => ({
          hours: prev[i]?.hours ?? defaultHours,
          overtime: prev[i]?.overtime ?? 0,
          commission: prev[i]?.commission ?? 0,
          startDate: prev[i]?.startDate ?? period.start,
          endDate: prev[i]?.endDate ?? period.end,
          payDate: prev[i]?.payDate ?? period.pay,
          checkNumber: prev[i]?.checkNumber ?? '',
          memo: prev[i]?.memo ?? ''
        }));
        return newHours;
      });
    } else {
      setHoursPerPeriod([]);
    }
  }, [payPeriods.length, formData.payFrequency]);

  // Update formData hoursList, overtimeList, commissionList, and date lists when hoursPerPeriod changes
  useEffect(() => {
    if (hoursPerPeriod.length > 0) {
      const hoursList = hoursPerPeriod.map(p => p.hours).join(', ');
      const overtimeList = hoursPerPeriod.map(p => p.overtime).join(', ');
      const commissionList = hoursPerPeriod.map(p => p.commission).join(', ');
      const startDateList = hoursPerPeriod.map(p => p.startDate || '').join(', ');
      const endDateList = hoursPerPeriod.map(p => p.endDate || '').join(', ');
      const payDateList = hoursPerPeriod.map(p => p.payDate || '').join(', ');
      const checkNumberList = hoursPerPeriod.map(p => p.checkNumber || '').join(', ');
      const memoList = hoursPerPeriod.map(p => p.memo || '').join('|||'); // Use ||| as delimiter for memos since they can contain commas
      
      setFormData(prev => ({
        ...prev,
        hoursList,
        overtimeList,
        commissionList,
        startDateList,
        endDateList,
        payDateList,
        checkNumberList,
        memoList
      }));
    }
  }, [hoursPerPeriod]);

  // Handler for updating individual period data (hours, overtime, commission, dates)
  const handlePeriodHoursChange = (index, field, value) => {
    setHoursPerPeriod(prev => {
      const updated = [...prev];
      // For date fields, keep the string value; for numeric fields, parse as float
      const processedValue = (field === 'startDate' || field === 'endDate' || field === 'payDate') ? value : (parseFloat(value) || 0);
      updated[index] = {
        ...updated[index],
        [field]: processedValue
      };
      return updated;
    });
  };

  const preview = useMemo(() => {
    const rate = parseFloat(formData.rate) || 0;
    const annualSalary = parseFloat(formData.annualSalary) || 0;
    const numStubs = calculateNumStubs;
    const defaultHours = formData.payFrequency === "weekly" ? 40 : 80;
    const periodsPerYear = formData.payFrequency === "weekly" ? 52 : 26;
    const hoursArray = formData.hoursList
      .split(",")
      .map((h) => parseFloat(h.trim()) || 0)
      .slice(0, numStubs) || [];
    const overtimeArray = formData.overtimeList
      .split(",")
      .map((h) => parseFloat(h.trim()) || 0)
      .slice(0, numStubs) || [];
    const commissionArray = formData.commissionList
      ? formData.commissionList.split(",").map((c) => parseFloat(c.trim()) || 0).slice(0, numStubs)
      : [];

    const isContractor = formData.workerType === "contractor";
    const stateRate = getStateTaxRate(formData.state);
    const actualLocalTaxRate = getLocalTaxRate(formData.state, formData.city);

    // Calculate individual paystub previews
    const stubPreviews = [];
    for (let i = 0; i < (numStubs || 1); i++) {
      let grossPay = 0;
      const hours = hoursArray[i] || defaultHours;
      const overtime = overtimeArray[i] || 0;
      const commission = commissionArray[i] || 0;
      
      if (formData.payType === "salary") {
        grossPay = (annualSalary / periodsPerYear) + commission;
      } else {
        grossPay = (rate * hours) + (rate * 1.5 * overtime) + commission;
      }

      const ssTax = isContractor ? 0 : grossPay * 0.062;
      const medTax = isContractor ? 0 : grossPay * 0.0145;
      
      let federalTax = 0;
      if (!isContractor) {
        if (formData.federalFilingStatus) {
          federalTax = calculateFederalTax(grossPay, formData.payFrequency, formData.federalFilingStatus);
        } else {
          federalTax = grossPay * 0.22;
        }
      }
      
      let stateTax = 0;
      if (!isContractor) {
        stateTax = calculateStateTax(grossPay, formData.state, formData.payFrequency, formData.stateAllowances || 0, stateRate);
      }
      
      const localTax = isContractor ? 0 : (formData.includeLocalTax && actualLocalTaxRate > 0 ? grossPay * actualLocalTaxRate : 0);
      const totalTaxes = ssTax + medTax + federalTax + stateTax + localTax;

      // Calculate deductions for this stub
      const stubDeductions = deductions.reduce((sum, d) => {
        const amount = parseFloat(d.amount) || 0;
        return sum + (d.isPercentage ? (grossPay * amount / 100) : amount);
      }, 0);

      // Calculate contributions for this stub
      const stubContributions = contributions.reduce((sum, c) => {
        const amount = parseFloat(c.amount) || 0;
        return sum + (c.isPercentage ? (grossPay * amount / 100) : amount);
      }, 0);

      const netPay = grossPay - totalTaxes - stubDeductions - stubContributions;

      stubPreviews.push({
        grossPay,
        hours,
        overtime,
        commission,
        ssTax,
        medTax,
        federalTax,
        stateTax,
        localTax,
        totalTaxes,
        totalDeductions: stubDeductions,
        totalContributions: stubContributions,
        netPay,
        stateRate,
        localTaxRate: actualLocalTaxRate
      });
    }

    // Calculate totals for all stubs
    const totalGross = stubPreviews.reduce((sum, s) => sum + s.grossPay, 0);
    const totalTaxes = stubPreviews.reduce((sum, s) => sum + s.totalTaxes, 0);
    const totalDeductions = stubPreviews.reduce((sum, s) => sum + s.totalDeductions, 0);
    const totalContributions = stubPreviews.reduce((sum, s) => sum + s.totalContributions, 0);
    const netPay = stubPreviews.reduce((sum, s) => sum + s.netPay, 0);

    return { 
      totalGross, 
      totalTaxes, 
      netPay, 
      ssTax: stubPreviews.reduce((sum, s) => sum + s.ssTax, 0),
      medTax: stubPreviews.reduce((sum, s) => sum + s.medTax, 0),
      federalTax: stubPreviews.reduce((sum, s) => sum + s.federalTax, 0),
      stateTax: stubPreviews.reduce((sum, s) => sum + s.stateTax, 0),
      localTax: stubPreviews.reduce((sum, s) => sum + s.localTax, 0),
      numStubs, 
      totalDeductions, 
      totalContributions, 
      stateRate, 
      localTaxRate: actualLocalTaxRate,
      stubPreviews // Array of individual stub previews
    };
  }, [formData, calculateNumStubs, deductions, contributions]);

  const createOrder = (data, actions) => {
    const baseAmount = calculateNumStubs * 9.99;
    const totalAmount = appliedDiscount 
      ? appliedDiscount.discountedPrice.toFixed(2)
      : baseAmount.toFixed(2);
    return actions.order.create({
      application_context: {
        shipping_preference: "NO_SHIPPING", // Digital product - no shipping required
      },
      purchase_units: [
        {
          amount: {
            value: totalAmount,
            currency_code: "USD"
          },
          description: `Pay Stub Generation (${calculateNumStubs} stub${calculateNumStubs > 1 ? 's' : ''})${appliedDiscount ? ` - ${appliedDiscount.discountPercent}% OFF` : ''}`
        },
      ],
    });
  };

  // Handle Stripe one-time payment checkout
  const handleStripeCheckout = async () => {
    if (calculateNumStubs === 0) {
      toast.error("Please configure at least one pay period");
      return;
    }

    setIsProcessing(true);
    
    try {
      const baseAmount = calculateNumStubs * 9.99;
      const finalAmount = appliedDiscount ? appliedDiscount.discountedPrice : baseAmount;
      
      // Get current URL for redirects
      const origin = window.location.origin;
      
      // Store form data for after payment completion - use localStorage for persistence across redirects
      const fullFormData = {
        ...formData,
        deductions: deductions,
        contributions: contributions,
        absencePlans: absencePlans,
        employerBenefits: employerBenefits,
        companyLogo: companyLogo,
        logoDataUrl: logoPreview,
      };
      localStorage.setItem("pendingPaystubData", JSON.stringify(fullFormData));
      localStorage.setItem("pendingPaystubTemplate", selectedTemplate);
      localStorage.setItem("pendingPaystubCount", calculateNumStubs.toString());
      
      // Create checkout session for one-time payment
      const response = await fetch(`${BACKEND_URL}/api/stripe/create-one-time-checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: finalAmount,
          documentType: "paystub",
          template: selectedTemplate,
          discountCode: appliedDiscount?.code || null,
          discountAmount: appliedDiscount ? baseAmount - finalAmount : 0,
          successUrl: `${origin}/payment-success?type=paystub&count=${calculateNumStubs}&session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${origin}/paystub-generator`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to create checkout session");
      }

      if (data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL received");
      }
    } catch (error) {
      console.error("Payment error:", error);
      toast.error(error.message || "Payment failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const onApprove = async (data, actions) => {
    setIsProcessing(true);
    try {
      const order = await actions.order.capture();
      const orderId = order?.id || `order_${Date.now()}`;
      const payerEmail = order?.payer?.email_address || "";
      toast.success("Payment successful! Generating your document...");
      
      // Track purchase
      const totalAmount = appliedDiscount 
        ? appliedDiscount.discountedPrice
        : (calculateNumStubs * 9.99);
      
      try {
        await fetch(`${BACKEND_URL}/api/purchases/track`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            documentType: "paystub",
            amount: totalAmount,
            paypalEmail: payerEmail,
            paypalTransactionId: orderId,
            discountCode: appliedDiscount?.code || null,
            discountAmount: appliedDiscount ? (calculateNumStubs * 9.99) - appliedDiscount.discountedPrice : 0,
            template: selectedTemplate
          })
        });
      } catch (trackError) {
        console.error("Failed to track purchase:", trackError);
      }
      
      // Prepare formData with deductions, contributions, absence plans, employer benefits, and company logo
      const fullFormData = {
        ...formData,
        deductions: deductions,
        contributions: contributions,
        absencePlans: absencePlans, // Include absence plans for Template C and H
        employerBenefits: employerBenefits, // Include employer benefits for Template C
        companyLogo: companyLogo, // Include uploaded logo for PDF
        logoDataUrl: logoPreview, // Pass logo data URL for Workday template
      };
      
      // Generate and download PDF
      await generateAndDownloadPaystub(fullFormData, selectedTemplate, calculateNumStubs);
      
      // Clear the uploaded logo from localStorage after successful download
      localStorage.removeItem('paystubCompanyLogo');
      setCompanyLogo(null);
      setLogoPreview(null);
      
      // Reset payroll company selection to empty (clean slate)
      setSelectedPayrollCompany(null);
      setCompanySearchQuery("");
      setSelectedTemplate("template-a");
      
      toast.success("Pay stub(s) downloaded successfully!");
      setIsProcessing(false);
      
      // Redirect to payment success page for Google Analytics conversion tracking
      navigate(`/payment-success?type=paystub&order_id=${orderId}&count=${calculateNumStubs}`);
    } catch (error) {
      toast.error("Failed to generate document");
      setIsProcessing(false);
    }
  };

  const onError = (err) => {
    toast.error("Payment failed. Please try again.");
    setIsProcessing(false);
  };
  
  // Clear logo and reset payroll company when leaving the page
  useEffect(() => {
    return () => {
      localStorage.removeItem('paystubCompanyLogo');
      // Note: State resets are not needed in cleanup since component unmounts,
      // but we ensure localStorage is cleared
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 relative">
      <Helmet>
        <title>Pay Stub Generator | MintSlip - Create Professional Paystubs Instantly</title>
        <meta name="description" content="Generate professional pay stubs with accurate tax calculations. Supports W-2 employees and 1099 contractors. Multiple templates. Instant PDF download." />
        <meta name="keywords" content="paystub generator, pay stub maker, employee paycheck, contractor payment, tax withholding calculator" />
        <meta property="og:title" content="Pay Stub Generator | MintSlip" />
        <meta property="og:description" content="Create accurate pay stubs with automatic tax calculations. Instant download, no sign-up required." />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Pay Stub Generator | MintSlip" />
        <meta name="twitter:description" content="Professional paystub generation with accurate tax calculations." />
      </Helmet>
      
      <div className="noise-overlay" />
      
      <Header title="Generate Pay Stub" />

      {/* Canada Location Alert Banner */}
      {showLocationAlert && userCountry === 'CA' && (
        <div className="bg-gradient-to-r from-red-50 via-white to-red-50 border-b border-red-100">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white rounded-xl shadow-sm border border-red-100 p-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg">
                    <CanadianFlagIcon />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center border-2 border-white">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-red-600 bg-red-100 px-2 py-0.5 rounded-full">Location Detected</span>
                  </div>
                  <p className="font-semibold text-slate-800 mt-1">You&apos;re visiting from Canada 🇨🇦</p>
                  <p className="text-slate-500 text-sm">Switch to our Canadian pay stub generator for accurate provincial tax calculations</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  onClick={() => setShowLocationAlert(false)}
                  className="text-slate-600 hover:text-slate-800 hover:bg-slate-100"
                >
                  Stay on US Version
                </Button>
                <Button
                  onClick={() => navigate('/canadian-paystub-generator')}
                  className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-md hover:shadow-lg transition-all duration-200 gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                  Switch to Canadian Version
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 py-12">

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
            Instant Paystub Generator
          </h1>
          <p className="text-slate-600">Generate professional pay stubs with accurate tax calculations, direct deposit information, and customizable pay periods.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: Form */}
          <div className="lg:col-span-7">
            <form className="space-y-8 bg-white p-8 rounded-lg shadow-sm border border-slate-200">
              {/* Payroll Company Selection */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
                  Select Payroll Company
                </h2>
                
                {/* Company Search Input */}
                <div className="relative" ref={companySearchRef}>
                  <Label htmlFor="companySearch">Payroll Provider *</Label>
                  <div className="relative mt-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      id="companySearch"
                      data-testid="company-search-input"
                      value={companySearchQuery}
                      onChange={(e) => {
                        setCompanySearchQuery(e.target.value);
                        setShowCompanyDropdown(true);
                      }}
                      onFocus={() => setShowCompanyDropdown(true)}
                      placeholder="Type to search payroll provider..."
                      className="pl-10 pr-10"
                    />
                    {selectedPayrollCompany && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="w-6 h-6 rounded bg-green-100 flex items-center justify-center">
                          <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Company Dropdown */}
                  {showCompanyDropdown && (
                    <div className="absolute z-50 w-full mt-1 bg-white border-2 border-slate-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                      {filteredCompanies.length > 0 ? (
                        filteredCompanies.map((company) => (
                          <div
                            key={company.id}
                            data-testid={`company-option-${company.id}`}
                            onClick={() => handlePayrollCompanySelect(company)}
                            className={`flex items-center gap-4 px-4 py-3 cursor-pointer hover:bg-green-50 transition-colors ${
                              selectedPayrollCompany?.id === company.id ? 'bg-green-100' : ''
                            }`}
                          >
                            <div className="w-10 h-10 rounded bg-white border border-slate-200 flex items-center justify-center overflow-hidden p-1">
                              {company.logo ? (
                                <img 
                                  src={company.logo} 
                                  alt={`${company.name} logo`} 
                                  className="w-full h-full object-contain"
                                />
                              ) : (
                                <Building2 className="w-5 h-5 text-slate-400" />
                              )}
                            </div>
                            <div>
                              <span className="font-medium text-slate-700 block">{company.name}</span>
                              <span className="text-xs text-slate-500">
                                {company.template === 'template-a' ? 'Gusto Style Inspired Template' : company.template === 'template-b' ? 'ADP Style Inspired Template' : company.template === 'template-h' ? 'OnPay Style Inspired Template' : 'Workday Style Inspired Template'}
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-3 text-slate-500 text-center">
                          No payroll providers found matching your search.
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Selected Company Confirmation */}
                {selectedPayrollCompany && (
                  <div className="p-4 bg-green-50 border-2 border-green-200 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-[100px] h-[100px] rounded-lg bg-white border border-slate-200 flex items-center justify-center overflow-hidden p-2">
                        {selectedPayrollCompany.logo ? (
                          <img 
                            src={selectedPayrollCompany.logo} 
                            alt={`${selectedPayrollCompany.name} logo`} 
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <Building2 className="w-10 h-10 text-slate-300" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-green-800 mb-1">✓ Payroll Provider Selected</p>
                        <p className="font-bold text-xl text-slate-800">{selectedPayrollCompany.name}</p>
                        <p className="text-sm text-slate-600 mt-1">
                          Template: <span className="font-semibold">{selectedPayrollCompany.template === 'template-a' ? 'Gusto Style Inspired Template' : selectedPayrollCompany.template === 'template-b' ? 'ADP Style Inspired Template' : selectedPayrollCompany.template === 'template-h' ? 'OnPay Style Inspired Template' : 'Workday Style Inspired Template'}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Company Logo Upload */}
              <div className="space-y-4">
                <div>
                  <h2 className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
                    Company Logo (optional)
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">
                    Upload company logo. PNG or JPG, max 2MB. Image will be resized automatically.
                  </p>
                </div>
                
                {/* Logo Upload Area */}
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                  onDrop={handleLogoDrop}
                  className={`relative border-2 border-dashed rounded-lg p-6 transition-all ${
                    isDragging 
                      ? 'border-green-500 bg-green-50' 
                      : logoError 
                        ? 'border-red-300 bg-red-50' 
                        : 'border-slate-300 hover:border-green-400'
                  }`}
                >
                  {logoPreview ? (
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <img 
                          src={logoPreview} 
                          alt="Company Logo Preview" 
                          className="w-20 h-20 object-contain rounded-lg border border-slate-200 bg-white p-2"
                        />
                        <button
                          type="button"
                          onClick={removeLogo}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-green-700">Logo uploaded successfully!</p>
                        <p className="text-xs text-slate-500 mt-1">
                          Click the X to remove and upload a different logo.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Upload className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                      <p className="text-sm text-slate-600 mb-2">
                        Drag and drop your logo here, or
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => logoInputRef.current?.click()}
                        className="gap-2"
                      >
                        <Upload className="w-4 h-4" />
                        Select File
                      </Button>
                      <input
                        ref={logoInputRef}
                        type="file"
                        accept=".png,.jpg,.jpeg,image/png,image/jpeg"
                        onChange={handleLogoSelect}
                        className="hidden"
                        data-testid="logo-file-input"
                      />
                      <p className="text-xs text-slate-400 mt-3">
                        PNG or JPG, max 2MB
                      </p>
                    </div>
                  )}
                </div>
                
                {logoError && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <X className="w-4 h-4" />
                    {logoError}
                  </p>
                )}
              </div>

              {/* Worker Type Selection - Only show contractor option for Template A (Gusto) and Template H (OnPay) */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
                  Worker Type
                </h2>
                {(selectedTemplate === 'template-a' || selectedTemplate === 'template-h') ? (
                  <RadioGroup value={formData.workerType} onValueChange={handleWorkerTypeChange}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className={`border-2 rounded-md p-4 cursor-pointer transition-all ${formData.workerType === 'employee' ? 'border-green-800 bg-green-50' : 'border-slate-200'}`}>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="employee" id="worker-employee" data-testid="worker-employee-radio" />
                          <Label htmlFor="worker-employee" className="cursor-pointer font-medium">Employee (W-2)</Label>
                        </div>
                        <p className="text-xs text-slate-600 mt-2">Standard employee with tax withholdings</p>
                      </div>
                      <div className={`border-2 rounded-md p-4 cursor-pointer transition-all ${formData.workerType === 'contractor' ? 'border-green-800 bg-green-50' : 'border-slate-200'}`}>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="contractor" id="worker-contractor" data-testid="worker-contractor-radio" />
                          <Label htmlFor="worker-contractor" className="cursor-pointer font-medium">Contractor (1099)</Label>
                        </div>
                        <p className="text-xs text-slate-600 mt-2">Independent contractor, no tax withholdings</p>
                      </div>
                    </div>
                  </RadioGroup>
                ) : (
                  <div className="p-4 bg-slate-50 border-2 border-slate-200 rounded-md">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-green-600 flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="font-medium text-slate-800">Employee (W-2)</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-2 ml-6">
                      {selectedTemplate === 'template-b' ? 'ADP' : selectedTemplate === 'template-h' ? 'OnPay' : 'Workday'} template only supports employee pay stubs with tax withholdings.
                    </p>
                  </div>
                )}
              </div>

              {/* Employee/Contractor Information */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
                  {formData.workerType === 'contractor' ? 'Contractor Information' : 'Employee Information'}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">{formData.workerType === 'contractor' ? 'Contractor Name *' : 'Employee Name *'}</Label>
                    <Input data-testid="employee-name-input" id="name" name="name" value={formData.name} onChange={handleChange} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ssn">{formData.workerType === 'contractor' ? 'Last 4 of SSN/EIN *' : 'Last 4 of SSN *'}</Label>
                    <Input 
                      data-testid="ssn-input" 
                      id="ssn" 
                      name="ssn" 
                      value={formData.ssn} 
                      onChange={handleSSNChange} 
                      maxLength="4" 
                      placeholder="1234"
                      className={validationErrors.ssn ? 'border-red-500' : ''}
                      required 
                    />
                    {validationErrors.ssn && (
                      <p className="text-xs text-red-500 mt-1">{validationErrors.ssn}</p>
                    )}
                  </div>
                  {/* Employee ID - Only for Workday template */}
                  {selectedTemplate === 'template-c' && (
                    <div className="space-y-2">
                      <Label htmlFor="employeeId">Employee ID *</Label>
                      <Input 
                        data-testid="employee-id-input" 
                        id="employeeId" 
                        name="employeeId" 
                        value={formData.employeeId} 
                        onChange={handleChange} 
                        placeholder="100012345"
                        required 
                      />
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="bankName">Bank Name *</Label>
                    <Input data-testid="bank-name-input" id="bankName" name="bankName" value={formData.bankName} onChange={handleChange} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bank">Last 4 of Bank Account *</Label>
                    <Input 
                      data-testid="bank-account-input" 
                      id="bank" 
                      name="bank" 
                      value={formData.bank} 
                      onChange={handleBankChange} 
                      maxLength="4" 
                      placeholder="5678"
                      className={validationErrors.bank ? 'border-red-500' : ''}
                      required 
                    />
                    {validationErrors.bank && (
                      <p className="text-xs text-red-500 mt-1">{validationErrors.bank}</p>
                    )}
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="address">Address *</Label>
                    <Input data-testid="address-input" id="address" name="address" value={formData.address} onChange={handleChange} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">City *</Label>
                    <Input data-testid="city-input" id="city" name="city" value={formData.city} onChange={handleChange} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State *</Label>
                    <Select value={formData.state} onValueChange={(val) => setFormData({...formData, state: val})}>
                      <SelectTrigger data-testid="pay-day-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AL">Alabama</SelectItem>
                        <SelectItem value="AK">Alaska</SelectItem>
                        <SelectItem value="AZ">Arizona</SelectItem>
                        <SelectItem value="AR">Arkansas</SelectItem>
                        <SelectItem value="CA">California</SelectItem>
                        <SelectItem value="CO">Colorado</SelectItem>
                        <SelectItem value="CT">Connecticut</SelectItem>
                        <SelectItem value="DE">Delaware</SelectItem>
                        <SelectItem value="FL">Florida</SelectItem>
                        <SelectItem value="GA">Georgia</SelectItem>
                        <SelectItem value="HI">Hawaii</SelectItem>
                        <SelectItem value="ID">Idaho</SelectItem>
                        <SelectItem value="IL">Illinois</SelectItem>
                        <SelectItem value="IN">Indiana</SelectItem>
                        <SelectItem value="IA">Iowa</SelectItem>
                        <SelectItem value="KS">Kansas</SelectItem>
                        <SelectItem value="KY">Kentucky</SelectItem>
                        <SelectItem value="LA">Louisiana</SelectItem>
                        <SelectItem value="ME">Maine</SelectItem>
                        <SelectItem value="MD">Maryland</SelectItem>
                        <SelectItem value="MA">Massachusetts</SelectItem>
                        <SelectItem value="MI">Michigan</SelectItem>
                        <SelectItem value="MN">Minnesota</SelectItem>
                        <SelectItem value="MS">Mississippi</SelectItem>
                        <SelectItem value="MO">Missouri</SelectItem>
                        <SelectItem value="MT">Montana</SelectItem>
                        <SelectItem value="NE">Nebraska</SelectItem>
                        <SelectItem value="NV">Nevada</SelectItem>
                        <SelectItem value="NH">New Hampshire</SelectItem>
                        <SelectItem value="NJ">New Jersey</SelectItem>
                        <SelectItem value="NM">New Mexico</SelectItem>
                        <SelectItem value="NY">New York</SelectItem>
                        <SelectItem value="NC">North Carolina</SelectItem>
                        <SelectItem value="ND">North Dakota</SelectItem>
                        <SelectItem value="OH">Ohio</SelectItem>
                        <SelectItem value="OK">Oklahoma</SelectItem>
                        <SelectItem value="OR">Oregon</SelectItem>
                        <SelectItem value="PA">Pennsylvania</SelectItem>
                        <SelectItem value="RI">Rhode Island</SelectItem>
                        <SelectItem value="SC">South Carolina</SelectItem>
                        <SelectItem value="SD">South Dakota</SelectItem>
                        <SelectItem value="TN">Tennessee</SelectItem>
                        <SelectItem value="TX">Texas</SelectItem>
                        <SelectItem value="UT">Utah</SelectItem>
                        <SelectItem value="VT">Vermont</SelectItem>
                        <SelectItem value="VA">Virginia</SelectItem>
                        <SelectItem value="WA">Washington</SelectItem>
                        <SelectItem value="WV">West Virginia</SelectItem>
                        <SelectItem value="WI">Wisconsin</SelectItem>
                        <SelectItem value="WY">Wyoming</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zip">Zip Code *</Label>
                    <Input 
                      data-testid="zip-input" 
                      id="zip" 
                      name="zip" 
                      value={formData.zip} 
                      onChange={handleZipChange} 
                      placeholder="12345"
                      className={validationErrors.zip ? 'border-red-500' : ''}
                      required 
                    />
                    {validationErrors.zip && (
                      <p className="text-xs text-red-500 mt-1">{validationErrors.zip}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Company Information */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
                  Company Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="company">Company Name *</Label>
                    <Input data-testid="company-name-input" id="company" name="company" value={formData.company} onChange={handleChange} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companyPhone">Company Phone *</Label>
                    <Input 
                      data-testid="company-phone-input" 
                      id="companyPhone" 
                      name="companyPhone" 
                      value={formData.companyPhone} 
                      onChange={handleCompanyPhoneChange} 
                      placeholder="(555) 123-4567"
                      className={validationErrors.companyPhone ? 'border-red-500' : ''}
                      required 
                    />
                    {validationErrors.companyPhone && (
                      <p className="text-xs text-red-500 mt-1">{validationErrors.companyPhone}</p>
                    )}
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="companyAddress">Company Address *</Label>
                    <Input data-testid="company-address-input" id="companyAddress" name="companyAddress" value={formData.companyAddress} onChange={handleChange} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companyCity">Company City *</Label>
                    <Input data-testid="company-city-input" id="companyCity" name="companyCity" value={formData.companyCity} onChange={handleChange} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companyState">Company State *</Label>
                      <Select value={formData.companyState} onValueChange={(val) => setFormData({...formData, companyState: val})}>
                      <SelectTrigger data-testid="pay-day-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AL">Alabama</SelectItem>
                        <SelectItem value="AK">Alaska</SelectItem>
                        <SelectItem value="AZ">Arizona</SelectItem>
                        <SelectItem value="AR">Arkansas</SelectItem>
                        <SelectItem value="CA">California</SelectItem>
                        <SelectItem value="CO">Colorado</SelectItem>
                        <SelectItem value="CT">Connecticut</SelectItem>
                        <SelectItem value="DE">Delaware</SelectItem>
                        <SelectItem value="FL">Florida</SelectItem>
                        <SelectItem value="GA">Georgia</SelectItem>
                        <SelectItem value="HI">Hawaii</SelectItem>
                        <SelectItem value="ID">Idaho</SelectItem>
                        <SelectItem value="IL">Illinois</SelectItem>
                        <SelectItem value="IN">Indiana</SelectItem>
                        <SelectItem value="IA">Iowa</SelectItem>
                        <SelectItem value="KS">Kansas</SelectItem>
                        <SelectItem value="KY">Kentucky</SelectItem>
                        <SelectItem value="LA">Louisiana</SelectItem>
                        <SelectItem value="ME">Maine</SelectItem>
                        <SelectItem value="MD">Maryland</SelectItem>
                        <SelectItem value="MA">Massachusetts</SelectItem>
                        <SelectItem value="MI">Michigan</SelectItem>
                        <SelectItem value="MN">Minnesota</SelectItem>
                        <SelectItem value="MS">Mississippi</SelectItem>
                        <SelectItem value="MO">Missouri</SelectItem>
                        <SelectItem value="MT">Montana</SelectItem>
                        <SelectItem value="NE">Nebraska</SelectItem>
                        <SelectItem value="NV">Nevada</SelectItem>
                        <SelectItem value="NH">New Hampshire</SelectItem>
                        <SelectItem value="NJ">New Jersey</SelectItem>
                        <SelectItem value="NM">New Mexico</SelectItem>
                        <SelectItem value="NY">New York</SelectItem>
                        <SelectItem value="NC">North Carolina</SelectItem>
                        <SelectItem value="ND">North Dakota</SelectItem>
                        <SelectItem value="OH">Ohio</SelectItem>
                        <SelectItem value="OK">Oklahoma</SelectItem>
                        <SelectItem value="OR">Oregon</SelectItem>
                        <SelectItem value="PA">Pennsylvania</SelectItem>
                        <SelectItem value="RI">Rhode Island</SelectItem>
                        <SelectItem value="SC">South Carolina</SelectItem>
                        <SelectItem value="SD">South Dakota</SelectItem>
                        <SelectItem value="TN">Tennessee</SelectItem>
                        <SelectItem value="TX">Texas</SelectItem>
                        <SelectItem value="UT">Utah</SelectItem>
                        <SelectItem value="VT">Vermont</SelectItem>
                        <SelectItem value="VA">Virginia</SelectItem>
                        <SelectItem value="WA">Washington</SelectItem>
                        <SelectItem value="WV">West Virginia</SelectItem>
                        <SelectItem value="WI">Wisconsin</SelectItem>
                        <SelectItem value="WY">Wyoming</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companyZip">Company Zip *</Label>
                    <Input 
                      data-testid="company-zip-input" 
                      id="companyZip" 
                      name="companyZip" 
                      value={formData.companyZip} 
                      onChange={handleCompanyZipChange} 
                      placeholder="12345"
                      className={validationErrors.companyZip ? 'border-red-500' : ''}
                      required 
                    />
                    {validationErrors.companyZip && (
                      <p className="text-xs text-red-500 mt-1">{validationErrors.companyZip}</p>
                    )}
                  </div>
                  
                  {/* ADP Template B Specific Fields */}
                  {selectedTemplate === 'template-b' && (
                    <>
                      <div className="md:col-span-2 pt-2 border-t">
                        <p className="text-sm text-slate-600 font-medium mb-3">ADP Document Info (Optional)</p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="companyCode">Company Code <span className="text-xs text-slate-400">(max 20 chars)</span></Label>
                        <Input 
                          id="companyCode" 
                          name="companyCode" 
                          value={formData.companyCode} 
                          onChange={handleCompanyCodeChange} 
                          placeholder="e.g., RJ/ABCH 12345678"
                          maxLength={20}
                          className={validationErrors.companyCode ? 'border-red-500' : ''}
                        />
                        {validationErrors.companyCode && (
                          <p className="text-xs text-red-500 mt-1">{validationErrors.companyCode}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="locDept">Loc/Dept <span className="text-xs text-slate-400">(3 digits)</span></Label>
                        <Input 
                          id="locDept" 
                          name="locDept" 
                          value={formData.locDept} 
                          onChange={handleLocDeptChange} 
                          placeholder="e.g., 017"
                          maxLength={3}
                          className={validationErrors.locDept ? 'border-red-500' : ''}
                        />
                        {validationErrors.locDept && (
                          <p className="text-xs text-red-500 mt-1">{validationErrors.locDept}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="checkNumber">Check/Document Number <span className="text-xs text-slate-400">(6-7 digits)</span></Label>
                        <Input 
                          id="checkNumber" 
                          name="checkNumber" 
                          value={formData.checkNumber} 
                          onChange={handleCheckNumberChange} 
                          placeholder="e.g., 1019908"
                          maxLength={7}
                          className={validationErrors.checkNumber ? 'border-red-500' : ''}
                        />
                        {validationErrors.checkNumber && (
                          <p className="text-xs text-red-500 mt-1">{validationErrors.checkNumber}</p>
                        )}
                      </div>
                    </>
                  )}
                  
                  {/* OnPay Template H Specific Fields - Employee ID only (Check # and Memo are per-period) */}
                  {selectedTemplate === 'template-h' && (
                    <>
                      <div className="md:col-span-2 pt-2 border-t">
                        <p className="text-sm text-slate-600 font-medium mb-3">OnPay Document Info</p>
                        <p className="text-xs text-slate-500 mb-2">Note: Check Number and Memo are set per pay period in the "Hours per Pay Period" section below.</p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="employeeId">Employee ID (EMP#)</Label>
                        <Input 
                          id="employeeId" 
                          name="employeeId" 
                          value={formData.employeeId} 
                          onChange={handleChange} 
                          placeholder="Auto-generated if empty"
                          maxLength={10}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Pay Information */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
                  Pay Information
                </h2>
                
                {/* Pay Type Selection */}
                <div className="space-y-2">
                  <Label className="text-base font-semibold">Pay Type *</Label>
                  <RadioGroup 
                    value={formData.payType} 
                    onValueChange={(val) => setFormData({...formData, payType: val})}
                    className="flex flex-row gap-4"
                  >
                    <div className={`border-2 rounded-md p-3 cursor-pointer transition-all flex-1 ${formData.payType === 'hourly' ? 'border-green-800 bg-green-50' : 'border-slate-200'}`}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="hourly" id="pay-hourly" data-testid="pay-hourly-radio" />
                        <Label htmlFor="pay-hourly" className="cursor-pointer font-medium">Hourly</Label>
                      </div>
                    </div>
                    <div className={`border-2 rounded-md p-3 cursor-pointer transition-all flex-1 ${formData.payType === 'salary' ? 'border-green-800 bg-green-50' : 'border-slate-200'} ${!canUseSalary ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem 
                          value="salary" 
                          id="pay-salary" 
                          data-testid="pay-salary-radio" 
                          disabled={!canUseSalary}
                        />
                        <Label htmlFor="pay-salary" className={`cursor-pointer font-medium ${!canUseSalary ? 'text-slate-400' : ''}`}>
                          Salary
                        </Label>
                      </div>
                    </div>
                  </RadioGroup>
                  {!canUseSalary && (
                    <p className="text-xs text-amber-600 mt-1">
                      * Salary option not available for contractors on Gusto template
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="hireDate">{formData.workerType === 'contractor' ? 'Start Date *' : 'Hire Date *'}</Label>
                    <Input data-testid="hire-date-input" id="hireDate" name="hireDate" type="date" value={formData.hireDate} onChange={handleChange} required />
                  </div>
                  
                  {formData.payType === 'hourly' ? (
                    <div className="space-y-2">
                      <Label htmlFor="rate">Hourly Rate ($) *</Label>
                      <Input data-testid="hourly-rate-input" id="rate" name="rate" type="number" step="0.01" value={formData.rate} onChange={handleChange} required />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="annualSalary">Annual Salary ($) *</Label>
                      <Input data-testid="annual-salary-input" id="annualSalary" name="annualSalary" type="number" step="0.01" value={formData.annualSalary} onChange={handleChange} required />
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="payFrequency">Pay Frequency *</Label>
                    <Select value={formData.payFrequency} onValueChange={(val) => setFormData({...formData, payFrequency: val})}>
                      <SelectTrigger data-testid="pay-frequency-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="biweekly">Bi-Weekly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="payDay">Pay Day *</Label>
                    <Select value={formData.payDay} onValueChange={(val) => setFormData({...formData, payDay: val})}>
                      <SelectTrigger data-testid="pay-day-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Monday">Monday</SelectItem>
                        <SelectItem value="Tuesday">Tuesday</SelectItem>
                        <SelectItem value="Wednesday">Wednesday</SelectItem>
                        <SelectItem value="Thursday">Thursday</SelectItem>
                        <SelectItem value="Friday">Friday</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Date Range */}
                <div className="space-y-2">
                  <Label className="text-base font-semibold">Paystub Generation Period *</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startDate">Start Date</Label>
                      <Input data-testid="start-date-input" id="startDate" name="startDate" type="date" value={formData.startDate} onChange={handleChange} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="endDate">End Date</Label>
                      <Input data-testid="end-date-input" id="endDate" name="endDate" type="date" value={formData.endDate} onChange={handleChange} required />
                    </div>
                  </div>
                  {calculateNumStubs > 0 && (
                    <p className="text-sm text-slate-600 mt-2">
                      This will generate <strong>{calculateNumStubs}</strong> paystub{calculateNumStubs > 1 ? 's' : ''}
                    </p>
                  )}
                </div>

                {/* Hours input per pay period - only for hourly pay type */}
                {formData.payType === 'hourly' && payPeriods.length > 0 && (
                  <Collapsible open={hoursExpanded} onOpenChange={setHoursExpanded}>
                    <div className="border rounded-lg overflow-hidden">
                      <CollapsibleTrigger asChild>
                        <button
                          type="button"
                          className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
                        >
                          <div>
                            <Label className="text-base font-semibold cursor-pointer">Hours Per Pay Period</Label>
                            <p className="text-xs text-slate-500 mt-1">
                              Click to {hoursExpanded ? 'collapse' : 'expand'} and edit hours for each pay date
                            </p>
                          </div>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className={`h-5 w-5 text-slate-500 transition-transform ${hoursExpanded ? 'rotate-180' : ''}`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="p-4 space-y-3 bg-white border-t">
                          {/* Only hourly employees can have overtime */}
                          {formData.workerType === 'contractor' && (
                            <div className="p-2 bg-amber-50 border border-amber-200 rounded-md mb-2">
                              <p className="text-xs text-amber-700">
                                <strong>Note:</strong> Contractors are not legally entitled to overtime pay.
                              </p>
                            </div>
                          )}
                          {payPeriods.map((period, index) => {
                            // Generate dynamic label based on actual dates from hoursPerPeriod
                            const actualStartDate = hoursPerPeriod[index]?.startDate || period.start;
                            const actualEndDate = hoursPerPeriod[index]?.endDate || period.end;
                            // Format the dates for display
                            const formatLabelDate = (dateStr) => {
                              if (!dateStr) return '';
                              const [year, month, day] = dateStr.split('-').map(Number);
                              const date = new Date(year, month - 1, day);
                              return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                            };
                            const dynamicLabel = actualStartDate && actualEndDate 
                              ? `${formatLabelDate(actualStartDate).replace(/, \d{4}$/, '')} - ${formatLabelDate(actualEndDate)}`
                              : period.label;
                            
                            return (
                            <div 
                              key={index} 
                              className="flex flex-col gap-3 p-3 bg-slate-50 rounded-lg"
                            >
                              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                                <div className="flex-shrink-0 sm:w-32">
                                  <span className="text-sm font-medium text-slate-700">
                                    Pay Period {index + 1}
                                  </span>
                                  <p className="text-xs text-slate-500">{dynamicLabel}</p>
                                </div>
                                {/* Date inputs for pay period */}
                                <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
                                  <div className="space-y-1">
                                    <Label className="text-xs text-slate-600">Period Start</Label>
                                    <Input
                                      type="date"
                                      value={hoursPerPeriod[index]?.startDate || period.start}
                                      onChange={(e) => handlePeriodHoursChange(index, 'startDate', e.target.value)}
                                      className="h-9"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs text-slate-600">Period End</Label>
                                    <Input
                                      type="date"
                                      value={hoursPerPeriod[index]?.endDate || period.end}
                                      onChange={(e) => handlePeriodHoursChange(index, 'endDate', e.target.value)}
                                      className="h-9"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs text-slate-600">Pay Date</Label>
                                    <Input
                                      type="date"
                                      value={hoursPerPeriod[index]?.payDate || period.pay}
                                      onChange={(e) => handlePeriodHoursChange(index, 'payDate', e.target.value)}
                                      className="h-9"
                                    />
                                  </div>
                                </div>
                              </div>
                              {/* Show only hours for contractors, hours + overtime + commission for hourly employees */}
                              {formData.workerType === 'contractor' ? (
                                <div className="grid grid-cols-2 gap-3 sm:ml-32">
                                  <div className="space-y-1">
                                    <Label className="text-xs text-slate-600">Hours Worked</Label>
                                    <Input
                                      type="number"
                                      value={hoursPerPeriod[index]?.hours ?? (formData.payFrequency === 'biweekly' ? 80 : 40)}
                                      onChange={(e) => handlePeriodHoursChange(index, 'hours', e.target.value)}
                                      className="h-9"
                                      min="0"
                                      step="0.5"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs text-slate-600">Commission ($)</Label>
                                    <Input
                                      type="number"
                                      value={hoursPerPeriod[index]?.commission ?? 0}
                                      onChange={(e) => handlePeriodHoursChange(index, 'commission', e.target.value)}
                                      className="h-9"
                                      min="0"
                                      step="0.01"
                                      placeholder="0.00"
                                    />
                                  </div>
                                </div>
                              ) : (
                                <div className="grid grid-cols-3 gap-3 sm:ml-32">
                                  <div className="space-y-1">
                                    <Label className="text-xs text-slate-600">Regular Hours</Label>
                                    <Input
                                      type="number"
                                      value={hoursPerPeriod[index]?.hours ?? (formData.payFrequency === 'biweekly' ? 80 : 40)}
                                      onChange={(e) => handlePeriodHoursChange(index, 'hours', e.target.value)}
                                      className="h-9"
                                      min="0"
                                      step="0.5"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs text-slate-600">Overtime Hours</Label>
                                    <Input
                                      type="number"
                                      value={hoursPerPeriod[index]?.overtime ?? 0}
                                      onChange={(e) => handlePeriodHoursChange(index, 'overtime', e.target.value)}
                                      className="h-9"
                                      min="0"
                                      step="0.5"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs text-slate-600">Commission ($)</Label>
                                    <Input
                                      type="number"
                                      value={hoursPerPeriod[index]?.commission ?? 0}
                                      onChange={(e) => handlePeriodHoursChange(index, 'commission', e.target.value)}
                                      className="h-9"
                                      min="0"
                                      step="0.01"
                                      placeholder="0.00"
                                    />
                                  </div>
                                </div>
                              )}
                              {/* OnPay Template: Check Number and Memo per pay period */}
                              {selectedTemplate === 'template-h' && (
                                <div className="grid grid-cols-2 gap-3 sm:ml-32 mt-2 pt-2 border-t border-slate-200">
                                  <div className="space-y-1">
                                    <Label className="text-xs text-slate-600">Check Number</Label>
                                    <Input
                                      type="text"
                                      value={hoursPerPeriod[index]?.checkNumber ?? ''}
                                      onChange={(e) => handlePeriodHoursChange(index, 'checkNumber', e.target.value)}
                                      className="h-9"
                                      placeholder="Auto-generated if empty"
                                      maxLength={10}
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs text-slate-600">Memo</Label>
                                    <Input
                                      type="text"
                                      value={hoursPerPeriod[index]?.memo ?? ''}
                                      onChange={(e) => handlePeriodHoursChange(index, 'memo', e.target.value)}
                                      className="h-9"
                                      placeholder="Thank you for your hard work"
                                      maxLength={50}
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                          })}
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                )}

                {/* Local Tax option - only for employees in states with local taxes */}
                {formData.workerType === 'employee' && (
                  <div className="space-y-3">
                    {stateHasLocalTax(formData.state) ? (
                      <>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            data-testid="local-tax-checkbox"
                            id="includeLocalTax"
                            checked={formData.includeLocalTax}
                            onCheckedChange={(checked) => setFormData({...formData, includeLocalTax: checked})}
                          />
                          <Label htmlFor="includeLocalTax" className="text-sm font-normal cursor-pointer">
                            Include local/city tax
                          </Label>
                        </div>
                        
                        {formData.includeLocalTax && (
                          <div className="ml-6 space-y-2">
                            <Label className="text-xs text-slate-600">Select City/Municipality for Local Tax</Label>
                            <Select 
                              value={formData.city || ""} 
                              onValueChange={(val) => setFormData({...formData, city: val})}
                            >
                              <SelectTrigger className="w-full max-w-xs">
                                <SelectValue placeholder="Select city..." />
                              </SelectTrigger>
                              <SelectContent>
                                {getCitiesWithLocalTax(formData.state).map(city => (
                                  <SelectItem key={city} value={city}>
                                    {city} ({(getLocalTaxRate(formData.state, city) * 100).toFixed(2)}%)
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {formData.city && getLocalTaxRate(formData.state, formData.city) > 0 && (
                              <p className="text-xs text-green-700">
                                Local tax rate for {formData.city}: <strong>{(getLocalTaxRate(formData.state, formData.city) * 100).toFixed(2)}%</strong>
                              </p>
                            )}
                            {formData.city && getLocalTaxRate(formData.state, formData.city) === 0 && (
                              <p className="text-xs text-slate-500">
                                No local income tax found for this city.
                              </p>
                            )}
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-xs text-slate-500">
                        {formData.state ? `${formData.state} does not have local income taxes.` : 'Select a state to see local tax options.'}
                      </p>
                    )}
                  </div>
                )}
                
                {formData.workerType === 'contractor' && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
                    <p className="text-sm text-amber-800">
                      <strong>Note:</strong> As a contractor (1099), no taxes will be withheld. You are responsible for paying your own self-employment taxes.
                    </p>
                  </div>
                )}

                {/* Filing Status Section - Only for employees */}
                {formData.workerType === 'employee' && (
                  <div className="space-y-4">
                    <h2 className="text-xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
                      Tax Withholding (Optional)
                    </h2>
                    <p className="text-xs text-slate-500 -mt-2">
                      Federal tax is calculated based on filing status per the 2020+ W-4 form. State allowances are available for applicable states.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Federal Filing Status - No more allowances per 2020 W-4 */}
                      <div className="space-y-2">
                        <Label htmlFor="federalFilingStatus">Federal Filing Status (W-4)</Label>
                        <Select 
                          value={formData.federalFilingStatus || ""} 
                          onValueChange={(val) => setFormData({...formData, federalFilingStatus: val})}
                        >
                          <SelectTrigger data-testid="federal-filing-status">
                            <SelectValue placeholder="Select federal status..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="single">Single or Married Filing Separately</SelectItem>
                            <SelectItem value="married_jointly">Married Filing Jointly</SelectItem>
                            <SelectItem value="head_of_household">Head of Household</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-slate-400">Per 2020+ W-4 (no more allowances)</p>
                      </div>

                      {/* State Allowances - Only for states that use them */}
                      <div className="space-y-2">
                        <Label htmlFor="stateAllowances">State Withholding Allowances</Label>
                        {stateUsesAllowances(formData.state) ? (
                          <>
                            <Select 
                              value={formData.stateAllowances || "0"} 
                              onValueChange={(val) => setFormData({...formData, stateAllowances: val})}
                            >
                              <SelectTrigger data-testid="state-allowances">
                                <SelectValue placeholder="Select allowances..." />
                              </SelectTrigger>
                              <SelectContent>
                                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                                  <SelectItem key={num} value={num.toString()}>
                                    {num} {num === 1 ? 'Allowance' : 'Allowances'}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <p className="text-xs text-slate-400">Each allowance reduces state tax withholding</p>
                          </>
                        ) : stateHasNoIncomeTax(formData.state) ? (
                          <div className="p-2 bg-slate-100 rounded-md">
                            <p className="text-xs text-slate-500">{formData.state} has no state income tax</p>
                          </div>
                        ) : formData.state ? (
                          <div className="p-2 bg-slate-100 rounded-md">
                            <p className="text-xs text-slate-500">{getStateTaxInfo(formData.state).message}</p>
                          </div>
                        ) : (
                          <div className="p-2 bg-slate-100 rounded-md">
                            <p className="text-xs text-slate-500">Select a state to see allowance options</p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Tax Calculation Info */}
                    {formData.federalFilingStatus && (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                        <p className="text-sm text-blue-800">
                          <strong>Federal Tax:</strong> Calculated using 2024 IRS tax brackets based on your filing status.
                          {parseInt(formData.stateAllowances) > 0 && ` State allowances reduce taxable income by ~$2,500/year each.`}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Employee Deductions Section - Only for employees */}
                {formData.workerType === 'employee' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
                          Employee Deductions
                        </h2>
                        <p className="text-xs text-slate-500 mt-1">
                          Pre-tax deductions like garnishment, health insurance, etc.
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addDeduction}
                        className="flex items-center gap-1"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add Deduction
                      </Button>
                    </div>

                    {deductions.length === 0 ? (
                      <div className="p-4 bg-slate-50 rounded-md border border-dashed border-slate-300 text-center">
                        <p className="text-sm text-slate-500">No deductions added. Click "Add Deduction" to add one.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {deductions.map((deduction) => (
                          <div key={deduction.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                            <div className="flex flex-col sm:flex-row gap-3">
                              <div className="flex-1 space-y-1">
                                <Label className="text-xs text-slate-600">Type</Label>
                                <Select 
                                  value={deduction.type} 
                                  onValueChange={(val) => {
                                    updateDeduction(deduction.id, 'type', val);
                                    if (val !== 'other') {
                                      const label = deductionTypes.find(t => t.value === val)?.label || '';
                                      updateDeduction(deduction.id, 'name', label);
                                    }
                                  }}
                                >
                                  <SelectTrigger className="h-9">
                                    <SelectValue placeholder="Select type" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {deductionTypes.map(type => (
                                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              {deduction.type === 'other' && (
                                <div className="flex-1 space-y-1">
                                  <Label className="text-xs text-slate-600">Description</Label>
                                  <Input
                                    type="text"
                                    value={deduction.name}
                                    onChange={(e) => updateDeduction(deduction.id, 'name', e.target.value)}
                                    placeholder="Enter description"
                                    className="h-9"
                                  />
                                </div>
                              )}
                              <div className="w-32 space-y-1">
                                <Label className="text-xs text-slate-600">Amount</Label>
                                <div className="flex items-center gap-1">
                                  {!deduction.isPercentage && <span className="text-slate-500">$</span>}
                                  <Input
                                    type="number"
                                    value={deduction.amount}
                                    onChange={(e) => updateDeduction(deduction.id, 'amount', e.target.value)}
                                    placeholder="0.00"
                                    className="h-9"
                                    min="0"
                                    step="0.01"
                                  />
                                  {deduction.isPercentage && <span className="text-slate-500">%</span>}
                                </div>
                              </div>
                              <div className="flex items-end gap-2">
                                <div className="flex items-center space-x-1">
                                  <Checkbox
                                    id={`ded-pct-${deduction.id}`}
                                    checked={deduction.isPercentage}
                                    onCheckedChange={(checked) => updateDeduction(deduction.id, 'isPercentage', checked)}
                                  />
                                  <Label htmlFor={`ded-pct-${deduction.id}`} className="text-xs cursor-pointer">%</Label>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeDeduction(deduction.id)}
                                  className="h-9 w-9 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Employee Contributions Section - Only for employees */}
                {formData.workerType === 'employee' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
                          Employee Contributions
                        </h2>
                        <p className="text-xs text-slate-500 mt-1">
                          Voluntary contributions like HSA, FSA, 401(k), Roth 401(k), etc.
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addContribution}
                        className="flex items-center gap-1"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add Contribution
                      </Button>
                    </div>

                    {contributions.length === 0 ? (
                      <div className="p-4 bg-slate-50 rounded-md border border-dashed border-slate-300 text-center">
                        <p className="text-sm text-slate-500">No contributions added. Click "Add Contribution" to add one.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {contributions.map((contribution) => (
                          <div key={contribution.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                            <div className="flex flex-col sm:flex-row gap-3">
                              <div className="flex-1 space-y-1">
                                <Label className="text-xs text-slate-600">Type</Label>
                                <Select 
                                  value={contribution.type} 
                                  onValueChange={(val) => {
                                    updateContribution(contribution.id, 'type', val);
                                    if (val !== 'other') {
                                      const label = contributionTypes.find(t => t.value === val)?.label || '';
                                      updateContribution(contribution.id, 'name', label);
                                    }
                                  }}
                                >
                                  <SelectTrigger className="h-9">
                                    <SelectValue placeholder="Select type" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {contributionTypes.map(type => (
                                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              {contribution.type === 'other' && (
                                <div className="flex-1 space-y-1">
                                  <Label className="text-xs text-slate-600">Description</Label>
                                  <Input
                                    type="text"
                                    value={contribution.name}
                                    onChange={(e) => updateContribution(contribution.id, 'name', e.target.value)}
                                    placeholder="Enter description"
                                    className="h-9"
                                  />
                                </div>
                              )}
                              <div className="w-32 space-y-1">
                                <Label className="text-xs text-slate-600">Amount</Label>
                                <div className="flex items-center gap-1">
                                  {!contribution.isPercentage && <span className="text-slate-500">$</span>}
                                  <Input
                                    type="number"
                                    value={contribution.amount}
                                    onChange={(e) => updateContribution(contribution.id, 'amount', e.target.value)}
                                    placeholder="0.00"
                                    className="h-9"
                                    min="0"
                                    step="0.01"
                                  />
                                  {contribution.isPercentage && <span className="text-slate-500">%</span>}
                                </div>
                              </div>
                              <div className="flex items-end gap-2">
                                <div className="flex items-center space-x-1">
                                  <Checkbox
                                    id={`cont-pct-${contribution.id}`}
                                    checked={contribution.isPercentage}
                                    onCheckedChange={(checked) => updateContribution(contribution.id, 'isPercentage', checked)}
                                  />
                                  <Label htmlFor={`cont-pct-${contribution.id}`} className="text-xs cursor-pointer">%</Label>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeContribution(contribution.id)}
                                  className="h-9 w-9 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Employer Paid Benefits Section - Only for Template C (Workday) */}
                {selectedTemplate === 'template-c' && formData.workerType === 'employee' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
                          Employer Paid Benefits
                        </h2>
                        <p className="text-xs text-slate-500 mt-1">
                          Add employer-provided benefits like 401(k) match, life insurance, health insurance (Workday template only)
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addEmployerBenefit}
                        className="flex items-center gap-1"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add Benefit
                      </Button>
                    </div>

                    {employerBenefits.length === 0 ? (
                      <div className="p-4 bg-slate-50 rounded-md border border-dashed border-slate-300 text-center">
                        <p className="text-sm text-slate-500">No employer benefits added. Click &quot;Add Benefit&quot; to add 401(k) match, life insurance, etc.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {employerBenefits.map((benefit) => (
                          <div key={benefit.id} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
                              <div className="flex-1 space-y-1">
                                <Label className="text-xs text-slate-600">Benefit Type</Label>
                                <Select
                                  value={benefit.type}
                                  onValueChange={(value) => updateEmployerBenefit(benefit.id, 'type', value)}
                                >
                                  <SelectTrigger className="h-9 bg-white">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {employerBenefitTypes.map(type => (
                                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              {benefit.type === 'other' && (
                                <div className="flex-1 space-y-1">
                                  <Label className="text-xs text-slate-600">Description</Label>
                                  <Input
                                    type="text"
                                    value={benefit.name}
                                    onChange={(e) => updateEmployerBenefit(benefit.id, 'name', e.target.value)}
                                    placeholder="Enter benefit description"
                                    className="h-9"
                                  />
                                </div>
                              )}
                              {/* 401k Match specific fields */}
                              {benefit.type === '401k_match' ? (
                                <>
                                  <div className="w-24 space-y-1">
                                    <Label className="text-xs text-slate-600">Match %</Label>
                                    <div className="flex items-center gap-1">
                                      <Input
                                        type="number"
                                        value={benefit.matchPercent || 50}
                                        onChange={(e) => updateEmployerBenefit(benefit.id, 'matchPercent', e.target.value)}
                                        placeholder="50"
                                        className="h-9"
                                        min="0"
                                        max="100"
                                        step="1"
                                      />
                                      <span className="text-slate-500 text-sm">%</span>
                                    </div>
                                  </div>
                                  <div className="w-28 space-y-1">
                                    <Label className="text-xs text-slate-600">Up to % of Pay</Label>
                                    <div className="flex items-center gap-1">
                                      <Input
                                        type="number"
                                        value={benefit.matchUpTo || 6}
                                        onChange={(e) => updateEmployerBenefit(benefit.id, 'matchUpTo', e.target.value)}
                                        placeholder="6"
                                        className="h-9"
                                        min="0"
                                        max="100"
                                        step="0.5"
                                      />
                                      <span className="text-slate-500 text-sm">%</span>
                                    </div>
                                  </div>
                                  <div className="text-xs text-slate-500 flex items-center">
                                    <span className="bg-blue-100 px-2 py-1 rounded">
                                      {contributions.some(c => c.type === '401k' || c.type === 'roth_401k') 
                                        ? `Based on employee 401(k)`
                                        : 'Add employee 401(k) first'}
                                    </span>
                                  </div>
                                </>
                              ) : (
                                <div className="w-32 space-y-1">
                                  <Label className="text-xs text-slate-600">Amount</Label>
                                  <div className="flex items-center gap-1">
                                    {!benefit.isPercentage && <span className="text-slate-500">$</span>}
                                    <Input
                                      type="number"
                                      value={benefit.amount}
                                      onChange={(e) => updateEmployerBenefit(benefit.id, 'amount', e.target.value)}
                                      placeholder="0.00"
                                      className="h-9"
                                      min="0"
                                      step="0.01"
                                    />
                                    {benefit.isPercentage && <span className="text-slate-500">%</span>}
                                  </div>
                                </div>
                              )}
                              <div className="flex items-end gap-2">
                                {benefit.type !== '401k_match' && (
                                  <div className="flex items-center space-x-1">
                                    <Checkbox
                                      id={`benefit-pct-${benefit.id}`}
                                      checked={benefit.isPercentage}
                                      onCheckedChange={(checked) => updateEmployerBenefit(benefit.id, 'isPercentage', checked)}
                                    />
                                    <Label htmlFor={`benefit-pct-${benefit.id}`} className="text-xs cursor-pointer">%</Label>
                                  </div>
                                )}
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeEmployerBenefit(benefit.id)}
                                  className="h-9 w-9 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Absence Plans Section - For Template C (Workday) and Template H (OnPay) */}
                {(selectedTemplate === 'template-c' || selectedTemplate === 'template-h') && formData.workerType === 'employee' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
                          Absence Plans
                        </h2>
                        <p className="text-xs text-slate-500 mt-1">
                          Track PTO, vacation, sick leave and other absence balances
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addAbsencePlan}
                        className="flex items-center gap-1"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add Plan
                      </Button>
                    </div>

                    {absencePlans.length === 0 ? (
                      <div className="p-4 bg-slate-50 rounded-md border border-dashed border-slate-300 text-center">
                        <p className="text-sm text-slate-500">No absence plans added. Click "Add Plan" to add PTO, vacation, or sick leave balances.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {absencePlans.map((plan) => (
                          <div key={plan.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                            <div className="flex flex-col sm:flex-row gap-3">
                              <div className="flex-1 space-y-1">
                                <Label className="text-xs text-slate-600">Plan Name</Label>
                                <Input
                                  type="text"
                                  value={plan.description}
                                  onChange={(e) => updateAbsencePlan(plan.id, 'description', e.target.value)}
                                  placeholder="e.g., PTO Plan, Vacation, Sick Leave"
                                  className="h-9"
                                />
                              </div>
                              <div className="w-28 space-y-1">
                                <Label className="text-xs text-slate-600">Accrued (hrs)</Label>
                                <Input
                                  type="number"
                                  value={plan.accrued}
                                  onChange={(e) => updateAbsencePlan(plan.id, 'accrued', e.target.value)}
                                  placeholder="0"
                                  className="h-9"
                                  min="0"
                                  step="1"
                                />
                              </div>
                              <div className="w-28 space-y-1">
                                <Label className="text-xs text-slate-600">Reduced (hrs)</Label>
                                <Input
                                  type="number"
                                  value={plan.reduced}
                                  onChange={(e) => updateAbsencePlan(plan.id, 'reduced', e.target.value)}
                                  placeholder="0"
                                  className="h-9"
                                  min="0"
                                  step="1"
                                />
                              </div>
                              <div className="w-28 space-y-1">
                                <Label className="text-xs text-slate-600">Available</Label>
                                <div className="h-9 flex items-center px-3 bg-green-50 border border-green-200 rounded-md text-green-700 font-semibold">
                                  {(parseFloat(plan.accrued) || 0) - (parseFloat(plan.reduced) || 0)}
                                </div>
                              </div>
                              <div className="flex items-end">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeAbsencePlan(plan.id)}
                                  className="h-9 w-9 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </form>
          </div>

          {/* Right: Preview and PayPal */}
          <div className="lg:col-span-5">
            <div className="sticky top-24 space-y-6">
              {/* Pay Preview */}
              <div className="p-6 bg-green-50 border-2 border-green-200 rounded-md">
                <h3 className="text-xl font-bold mb-4" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
                  Pay Preview {formData.workerType === 'contractor' && <span className="text-sm font-normal text-amber-700">(1099 Contractor)</span>}
                </h3>
                <div className="space-y-2 text-sm">
                  {preview.numStubs > 0 && (
                    <div className="flex justify-between mb-3 pb-3 border-b border-green-300">
                      <span className="text-slate-700 font-semibold">Paystubs to Generate:</span>
                      <span className="font-bold">{preview.numStubs}</span>
                    </div>
                  )}
                  
                  {/* Individual stub preview with pagination */}
                  {preview.stubPreviews && preview.stubPreviews.length > 0 && (
                    <>
                      <div className="bg-white rounded-lg p-3 border border-green-200 mb-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-green-800">
                            Paystub {currentPreviewIndex + 1} of {preview.stubPreviews.length}
                          </span>
                          {preview.stubPreviews.length > 1 && (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => setCurrentPreviewIndex(Math.max(0, currentPreviewIndex - 1))}
                                disabled={currentPreviewIndex === 0}
                                className="w-6 h-6 rounded-full flex items-center justify-center bg-green-100 text-green-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-green-200 transition-colors"
                              >
                                <ChevronLeft className="h-3 w-3" />
                              </button>
                              {preview.stubPreviews.map((_, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => setCurrentPreviewIndex(idx)}
                                  className={`w-5 h-5 rounded-full text-xs font-medium transition-all ${
                                    idx === currentPreviewIndex
                                      ? 'bg-green-700 text-white'
                                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                                  }`}
                                >
                                  {idx + 1}
                                </button>
                              ))}
                              <button
                                onClick={() => setCurrentPreviewIndex(Math.min(preview.stubPreviews.length - 1, currentPreviewIndex + 1))}
                                disabled={currentPreviewIndex === preview.stubPreviews.length - 1}
                                className="w-6 h-6 rounded-full flex items-center justify-center bg-green-100 text-green-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-green-200 transition-colors"
                              >
                                <ChevronRight className="h-3 w-3" />
                              </button>
                            </div>
                          )}
                        </div>
                        
                        {/* Individual stub amounts */}
                        {preview.stubPreviews[currentPreviewIndex] && (
                          <div className="space-y-1">
                            <div className="flex justify-between">
                              <span className="text-slate-700">Gross Pay:</span>
                              <span className="font-bold">${formatCurrency(preview.stubPreviews[currentPreviewIndex].grossPay)}</span>
                            </div>
                            
                            {formData.workerType === 'employee' ? (
                              <>
                                <div className="flex justify-between text-xs">
                                  <span className="text-slate-600">Federal Tax:</span>
                                  <span>${formatCurrency(preview.stubPreviews[currentPreviewIndex].federalTax)}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                  <span className="text-slate-600">Social Security:</span>
                                  <span>${formatCurrency(preview.stubPreviews[currentPreviewIndex].ssTax)}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                  <span className="text-slate-600">Medicare:</span>
                                  <span>${formatCurrency(preview.stubPreviews[currentPreviewIndex].medTax)}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                  <span className="text-slate-600">State Tax:</span>
                                  <span>${formatCurrency(preview.stubPreviews[currentPreviewIndex].stateTax)}</span>
                                </div>
                                {formData.includeLocalTax && preview.stubPreviews[currentPreviewIndex].localTax > 0 && (
                                  <div className="flex justify-between text-xs">
                                    <span className="text-slate-600">Local Tax:</span>
                                    <span>${formatCurrency(preview.stubPreviews[currentPreviewIndex].localTax)}</span>
                                  </div>
                                )}
                                <div className="flex justify-between text-red-700 pt-1 border-t border-green-200">
                                  <span className="font-medium">Total Taxes:</span>
                                  <span className="font-medium">${formatCurrency(preview.stubPreviews[currentPreviewIndex].totalTaxes)}</span>
                                </div>
                                {preview.stubPreviews[currentPreviewIndex].totalDeductions > 0 && (
                                  <div className="flex justify-between text-orange-700 text-xs">
                                    <span className="font-medium">Deductions:</span>
                                    <span className="font-medium">${formatCurrency(preview.stubPreviews[currentPreviewIndex].totalDeductions)}</span>
                                  </div>
                                )}
                                {preview.stubPreviews[currentPreviewIndex].totalContributions > 0 && (
                                  <div className="flex justify-between text-purple-700 text-xs">
                                    <span className="font-medium">Contributions:</span>
                                    <span className="font-medium">${formatCurrency(preview.stubPreviews[currentPreviewIndex].totalContributions)}</span>
                                  </div>
                                )}
                              </>
                            ) : (
                              <div className="flex justify-between text-amber-700 text-xs">
                                <span className="font-medium">No Taxes Withheld</span>
                                <span className="font-medium">$0.00</span>
                              </div>
                            )}
                            
                            <div className="flex justify-between text-green-700 pt-1 border-t border-green-200">
                              <span className="font-bold">{formData.workerType === 'contractor' ? 'Payment:' : 'Net Pay:'}</span>
                              <span className="font-bold">${formatCurrency(preview.stubPreviews[currentPreviewIndex].netPay)}</span>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Totals section */}
                      {preview.numStubs > 1 && (
                        <div className="pt-2 border-t border-green-300">
                          <div className="flex justify-between mb-1">
                            <span className="text-slate-700 font-semibold">All {preview.numStubs} Paystubs Total:</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-700">Total Gross Pay:</span>
                            <span className="font-bold">${formatCurrency(preview.totalGross)}</span>
                          </div>
                          {formData.workerType === 'employee' && (
                            <div className="flex justify-between text-red-700">
                              <span className="font-medium">Total Taxes:</span>
                              <span className="font-medium">${formatCurrency(preview.totalTaxes)}</span>
                            </div>
                          )}
                          {preview.totalDeductions > 0 && (
                            <div className="flex justify-between text-orange-700">
                              <span className="font-medium">Total Deductions:</span>
                              <span className="font-medium">${formatCurrency(preview.totalDeductions)}</span>
                            </div>
                          )}
                          {preview.totalContributions > 0 && (
                            <div className="flex justify-between text-purple-700">
                              <span className="font-medium">Total Contributions:</span>
                              <span className="font-medium">${formatCurrency(preview.totalContributions)}</span>
                            </div>
                          )}
                          <div className="flex justify-between text-green-700 text-lg pt-1">
                            <span className="font-bold">{formData.workerType === 'contractor' ? 'Total Payment:' : 'Total Net Pay:'}</span>
                            <span className="font-bold">${formatCurrency(preview.netPay)}</span>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                  
                  {/* Single stub view (when only 1 stub) */}
                  {(!preview.stubPreviews || preview.stubPreviews.length === 0) && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-slate-700">Total Gross Pay:</span>
                        <span className="font-bold">${formatCurrency(preview.totalGross)}</span>
                      </div>
                      
                      {formData.workerType === 'employee' ? (
                        <>
                          <div className="flex justify-between">
                            <span className="text-slate-700">Federal Income Tax:</span>
                            <span>${formatCurrency(preview.federalTax)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-700">Social Security (6.2%):</span>
                            <span>${formatCurrency(preview.ssTax)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-700">Medicare (1.45%):</span>
                            <span>${formatCurrency(preview.medTax)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-700">State Tax:</span>
                            <span>${formatCurrency(preview.stateTax)}</span>
                          </div>
                          <div className="border-t border-green-300 pt-2 mt-2">
                            <div className="flex justify-between text-red-700">
                              <span className="font-bold">Total Taxes:</span>
                              <span className="font-bold">${formatCurrency(preview.totalTaxes)}</span>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="border-t border-green-300 pt-2 mt-2">
                          <div className="flex justify-between text-amber-700">
                            <span className="font-bold">No Taxes Withheld</span>
                            <span className="font-bold">$0.00</span>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex justify-between text-green-700 text-lg">
                        <span className="font-bold">{formData.workerType === 'contractor' ? 'Total Payment:' : 'Net Pay:'}</span>
                        <span className="font-bold">${formatCurrency(preview.netPay)}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* PDF Preview Section - Now Above Payment */}
              <div className="p-4 bg-white border-2 border-slate-200 rounded-md">
                <h3 className="text-lg font-bold mb-3" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
                  Document Preview
                </h3>
                <p className="text-xs text-slate-500 mb-3">
                  Click to enlarge • Watermark removed after payment
                </p>
                
                {isGeneratingPreview ? (
                  <div className="flex items-center justify-center h-96 bg-slate-100 rounded-md">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-700 mx-auto mb-2"></div>
                      <p className="text-sm text-slate-500">Generating preview...</p>
                    </div>
                  </div>
                ) : pdfPreviews.length > 0 && pdfPreviews[currentPreviewIndex] ? (
                  <>
                    <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
                      <DialogTrigger asChild>
                        <div className="relative cursor-pointer group">
                          {/* PDF Preview Thumbnail */}
                          <div className="relative overflow-hidden rounded-md border border-slate-300 bg-white shadow-sm hover:shadow-md transition-shadow">
                            <img 
                              src={pdfPreviews[currentPreviewIndex]}
                              alt={`Paystub Preview ${currentPreviewIndex + 1}`}
                              className="w-full h-96 object-contain bg-white"
                            />
                            {/* Watermark Overlay */}
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                              <div 
                                className="text-4xl font-bold text-slate-300 opacity-60 rotate-[-30deg] select-none"
                                style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.1)' }}
                              >
                                MintSlip
                              </div>
                            </div>
                            {/* Click to enlarge overlay */}
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all flex items-center justify-center">
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white px-3 py-1 rounded-full shadow-md">
                                <span className="text-sm text-slate-700 flex items-center gap-1">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                  </svg>
                                  Click to enlarge
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl w-full h-[90vh] p-0">
                        <DialogHeader className="p-4 border-b">
                          <DialogTitle className="flex items-center justify-between">
                            <span>Document Preview {pdfPreviews.length > 1 ? `(${currentPreviewIndex + 1} of ${pdfPreviews.length})` : ''}</span>
                            <span className="text-sm font-normal text-amber-600 bg-amber-50 px-2 py-1 rounded">
                              Watermark removed after payment
                            </span>
                          </DialogTitle>
                        </DialogHeader>
                        <div className="relative flex-1 h-full overflow-auto p-4">
                          <img
                            src={pdfPreviews[currentPreviewIndex]}
                            alt={`Paystub Preview Full ${currentPreviewIndex + 1}`}
                            className="w-full h-auto"
                          />
                          {/* Large Watermark Overlay */}
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div 
                              className="text-8xl font-bold text-slate-300 opacity-40 rotate-[-30deg] select-none"
                              style={{ textShadow: '4px 4px 8px rgba(0,0,0,0.1)' }}
                            >
                              MintSlip
                            </div>
                          </div>
                        </div>
                        {/* Pagination controls in dialog */}
                        {pdfPreviews.length > 1 && (
                          <div className="p-3 border-t bg-slate-50 flex items-center justify-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCurrentPreviewIndex(Math.max(0, currentPreviewIndex - 1))}
                              disabled={currentPreviewIndex === 0}
                              className="flex items-center gap-1"
                            >
                              <ChevronLeft className="h-4 w-4" />
                              Previous
                            </Button>
                            <div className="flex items-center gap-1">
                              {pdfPreviews.map((_, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => setCurrentPreviewIndex(idx)}
                                  className={`w-8 h-8 rounded-full text-sm font-medium transition-all ${
                                    idx === currentPreviewIndex
                                      ? 'bg-green-700 text-white'
                                      : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                                  }`}
                                >
                                  {idx + 1}
                                </button>
                              ))}
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCurrentPreviewIndex(Math.min(pdfPreviews.length - 1, currentPreviewIndex + 1))}
                              disabled={currentPreviewIndex === pdfPreviews.length - 1}
                              className="flex items-center gap-1"
                            >
                              Next
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                    
                    {/* Pagination controls below preview */}
                    {pdfPreviews.length > 1 && (
                      <div className="mt-3 flex items-center justify-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPreviewIndex(Math.max(0, currentPreviewIndex - 1))}
                          disabled={currentPreviewIndex === 0}
                          className="h-8 px-2"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="flex items-center gap-1">
                          {pdfPreviews.map((_, idx) => (
                            <button
                              key={idx}
                              onClick={() => setCurrentPreviewIndex(idx)}
                              className={`w-7 h-7 rounded-full text-xs font-medium transition-all ${
                                idx === currentPreviewIndex
                                  ? 'bg-green-700 text-white shadow-sm'
                                  : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                              }`}
                            >
                              {idx + 1}
                            </button>
                          ))}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPreviewIndex(Math.min(pdfPreviews.length - 1, currentPreviewIndex + 1))}
                          disabled={currentPreviewIndex === pdfPreviews.length - 1}
                          className="h-8 px-2"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    {pdfPreviews.length > 1 && (
                      <p className="text-xs text-center text-slate-500 mt-2">
                        Viewing paystub {currentPreviewIndex + 1} of {pdfPreviews.length}
                      </p>
                    )}
                  </>
                ) : (
                  <div className="flex items-center justify-center h-96 bg-slate-50 rounded-md border-2 border-dashed border-slate-300">
                    <div className="text-center p-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-slate-300 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-sm text-slate-500">
                        Fill in pay period dates and rate<br />to see a preview
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* PayPal - Now Below Preview */}
              <div className="p-6 bg-slate-50 border-2 border-slate-200 rounded-md">
                <h3 className="text-lg font-bold mb-4" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
                  Complete Payment
                </h3>
                <p className="text-xs text-slate-500 mb-4 text-center">
                  For lawful payroll documentation and record-keeping only.
                </p>
                <p className="text-xs text-slate-500 mb-4 text-center">
                  MintSlip does not verify employment or guarantee acceptance by any third party.
                </p>
                
                {/* Show subscription download or PayPal based on user status */}
                {hasActiveSubscription ? (
                  <div className="space-y-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                      <div className="flex items-center gap-2 text-green-700 mb-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-semibold">Subscription Active</span>
                      </div>
                      <p className="text-sm text-green-600">
                        Downloads remaining: {user?.subscription?.downloads_remaining === -1 ? 'Unlimited' : user?.subscription?.downloads_remaining}
                      </p>
                    </div>
                    <Button
                      onClick={handleSubscriptionDownload}
                      disabled={isProcessing || calculateNumStubs === 0}
                      className="w-full bg-green-600 hover:bg-green-700 text-white py-6 text-lg font-semibold"
                    >
                      {isProcessing ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Generating...
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          Download {calculateNumStubs} Pay Stub{calculateNumStubs > 1 ? 's' : ''} (Included in Plan)
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <>
                    {calculateNumStubs > 0 && (
                      <>
                        <CouponInput
                          generatorType="paystub"
                          originalPrice={calculateNumStubs * 9.99}
                          onDiscountApplied={setAppliedDiscount}
                        />
                        <p className="text-sm text-slate-600 mb-4">
                          Total: <strong>${appliedDiscount ? appliedDiscount.discountedPrice.toFixed(2) : (calculateNumStubs * 9.99).toFixed(2)}</strong> 
                          {appliedDiscount && <span className="text-green-600 ml-1">({appliedDiscount.discountPercent}% off)</span>}
                          {!appliedDiscount && ` (${calculateNumStubs} stub${calculateNumStubs > 1 ? 's' : ''} × $9.99)`}
                        </p>
                      </>
                    )}
                    <div data-testid="stripe-button-container">
                      <Button
                        onClick={handleStripeCheckout}
                        disabled={isProcessing || calculateNumStubs === 0}
                        className="w-full bg-green-600 hover:bg-green-700 text-white py-6 text-lg font-semibold rounded-xl gap-2"
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <CreditCard className="w-5 h-5" />
                            Pay ${appliedDiscount ? appliedDiscount.discountedPrice.toFixed(2) : (calculateNumStubs * 9.99).toFixed(2)}
                          </>
                        )}
                      </Button>
                      <div className="flex items-center justify-center gap-2 text-xs text-slate-500 mt-2">
                        <Lock className="w-3 h-3" />
                        <span>Secured by Stripe - Cards, Apple Pay & Google Pay accepted</span>
                      </div>
                    </div>
                    
                    {/* Subscription upsell */}
                    <div className="mt-4 pt-4 border-t border-slate-200 text-center">
                      <p className="text-sm text-slate-500 mb-2">Save with a subscription plan</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate("/pricing")}
                        className="text-green-600 border-green-600 hover:bg-green-50"
                      >
                        View Subscription Plans
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

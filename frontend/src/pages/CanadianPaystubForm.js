import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";
import { PayPalButtons } from "@paypal/react-paypal-js";
import { generateAndDownloadCanadianPaystub } from "@/utils/canadianPaystubGenerator";
import { generateCanadianPreviewPDF } from "@/utils/canadianPaystubPreviewGenerator";
import { CANADIAN_PROVINCES, formatSIN, validateSIN, formatPostalCode, validatePostalCode } from "@/utils/canadianTaxRates";
import { Upload, X, Search, Building2, ChevronDown, ChevronUp, MapPin } from "lucide-react";
import { formatPhoneNumber, validatePhoneNumber, formatBankLast4, validateBankLast4 } from "@/utils/validation";
import GustoLogo from '../assests/gustoLogo.png';
import ADPLogo from '../assests/adp-logo.png';
import WorkdayLogo from '../assests/workday-logo.png';

// Payroll company templates with logos
const PAYROLL_COMPANIES = [
  { id: 'gusto', name: 'Gusto', template: 'template-a', logo: GustoLogo },
  { id: 'adp', name: 'ADP', template: 'template-b', logo: ADPLogo },
  { id: 'workday', name: 'Workday', template: 'template-c', logo: WorkdayLogo },
];

export default function CanadianPaystubForm() {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState("template-a");
  const [pdfPreview, setPdfPreview] = useState(null);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [hoursExpanded, setHoursExpanded] = useState(false);
  const [hoursPerPeriod, setHoursPerPeriod] = useState([]);
  const [deductions, setDeductions] = useState([]);
  const [contributions, setContributions] = useState([]);
  
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
  
  // Helper to format currency with commas (CAD)
  const formatCurrency = (num) => {
    return Number(num).toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };
  
  const [formData, setFormData] = useState({
    name: "",
    sin: "",
    bank: "",
    bankName: "",
    address: "",
    city: "",
    province: "ON",
    postalCode: "",
    company: "",
    companyAddress: "",
    companyCity: "",
    companyProvince: "ON",
    companyPostalCode: "",
    companyPhone: "",
    hireDate: "",
    startDate: "",
    endDate: "",
    rate: "",
    payFrequency: "biweekly",
    payDay: "Friday",
    hoursList: "",
    overtimeList: "",
    workerType: "employee",
    payType: "hourly",
    annualSalary: "",
    employeeId: "",
    companyCode: "",
    locDept: "",
    checkNumber: "",
  });

  // Validation errors state
  const [validationErrors, setValidationErrors] = useState({
    sin: '',
    bank: '',
    postalCode: '',
    companyPostalCode: '',
    companyPhone: '',
  });

  // Deduction types
  const deductionTypes = [
    { label: "RRSP", value: "rrsp" },
    { label: "Health Insurance", value: "health_insurance" },
    { label: "Dental Insurance", value: "dental_insurance" },
    { label: "Life Insurance", value: "life_insurance" },
    { label: "Union Dues", value: "union_dues" },
    { label: "Parking", value: "parking" },
    { label: "Other", value: "other" },
  ];

  // Contribution types
  const contributionTypes = [
    { label: "RRSP Match", value: "rrsp_match" },
    { label: "TFSA", value: "tfsa" },
    { label: "Group Benefits", value: "group_benefits" },
    { label: "Pension Plan", value: "pension_plan" },
    { label: "Other", value: "other" },
  ];

  // Deduction handlers
  const addDeduction = () => {
    setDeductions([...deductions, { id: Date.now(), type: "other", name: "", amount: "", isPercentage: false }]);
  };
  const removeDeduction = (id) => setDeductions(deductions.filter(d => d.id !== id));
  const updateDeduction = (id, field, value) => {
    setDeductions(deductions.map(d => d.id === id ? { ...d, [field]: value } : d));
  };

  // Contribution handlers
  const addContribution = () => {
    setContributions([...contributions, { id: Date.now(), type: "other", name: "", amount: "", isPercentage: false }]);
  };
  const removeContribution = (id) => setContributions(contributions.filter(c => c.id !== id));
  const updateContribution = (id, field, value) => {
    setContributions(contributions.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  // Generate PDF preview when form data changes
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (formData.startDate && formData.endDate && (formData.rate || formData.annualSalary)) {
        setIsGeneratingPreview(true);
        try {
          const previewData = {
            ...formData,
            deductions,
            contributions,
            logoDataUrl: logoPreview,
          };
          const previewUrl = await generateCanadianPreviewPDF(previewData, selectedTemplate);
          setPdfPreview(previewUrl);
        } catch (error) {
          console.error("Preview generation failed:", error);
        }
        setIsGeneratingPreview(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [formData, selectedTemplate, deductions, contributions, logoPreview]);

  // Contractor only available for Gusto template
  const canUseSalary = !(formData.workerType === "contractor" && selectedTemplate === "template-a");
  
  const handleWorkerTypeChange = (val) => {
    setFormData(prev => {
      const newData = { ...prev, workerType: val };
      if (val === "contractor" && selectedTemplate === "template-a") {
        newData.payType = "hourly";
      }
      return newData;
    });
    if (val === "contractor") {
      setHoursPerPeriod(prev => prev.map(p => ({ ...p, overtime: 0 })));
    }
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

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === "checkbox" ? checked : value });
  };

  // Validated input handlers
  const handleSINChange = (e) => {
    const formatted = formatSIN(e.target.value);
    setFormData(prev => ({ ...prev, sin: formatted }));
    const validation = validateSIN(formatted);
    setValidationErrors(prev => ({ ...prev, sin: validation.error }));
  };

  const handleBankChange = (e) => {
    const formatted = formatBankLast4(e.target.value);
    setFormData(prev => ({ ...prev, bank: formatted }));
    const validation = validateBankLast4(formatted);
    setValidationErrors(prev => ({ ...prev, bank: validation.error }));
  };

  const handlePostalCodeChange = (e) => {
    const formatted = formatPostalCode(e.target.value);
    setFormData(prev => ({ ...prev, postalCode: formatted }));
    const validation = validatePostalCode(formatted);
    setValidationErrors(prev => ({ ...prev, postalCode: validation.error }));
  };

  const handleCompanyPostalCodeChange = (e) => {
    const formatted = formatPostalCode(e.target.value);
    setFormData(prev => ({ ...prev, companyPostalCode: formatted }));
    const validation = validatePostalCode(formatted);
    setValidationErrors(prev => ({ ...prev, companyPostalCode: validation.error }));
  };

  const handleCompanyPhoneChange = (e) => {
    const formatted = formatPhoneNumber(e.target.value);
    setFormData(prev => ({ ...prev, companyPhone: formatted }));
    const validation = validatePhoneNumber(formatted);
    setValidationErrors(prev => ({ ...prev, companyPhone: validation.error }));
  };

  // Filter payroll companies
  const filteredCompanies = PAYROLL_COMPANIES.filter(company =>
    company.name.toLowerCase().includes(companySearchQuery.toLowerCase())
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

  // Logo upload handlers
  const resizeImageToFit = (base64Data, maxWidth, maxHeight) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const scaleW = maxWidth / img.width;
        const scaleH = maxHeight / img.height;
        const scale = Math.min(scaleW, scaleH, 1);
        const newWidth = Math.round(img.width * scale);
        const newHeight = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = newWidth;
        canvas.height = newHeight;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, newWidth, newHeight);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = base64Data;
    });
  };

  const validateAndProcessLogo = async (file) => {
    setLogoError("");
    if (!file.type.includes('png') && !file.type.includes('jpeg') && !file.type.includes('jpg')) {
      setLogoError("Only PNG or JPG files are accepted");
      return false;
    }
    if (file.size > 2 * 1024 * 1024) {
      setLogoError("File size must be under 2MB");
      return false;
    }
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const base64 = e.target.result;
          const resizedBase64 = await resizeImageToFit(base64, 360, 105);
          localStorage.setItem('canadianPaystubLogo', resizedBase64);
          setCompanyLogo(resizedBase64);
          setLogoPreview(resizedBase64);
          resolve(true);
        } catch (err) {
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

  const handleLogoDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      await validateAndProcessLogo(e.dataTransfer.files[0]);
    }
  };

  const handleLogoSelect = async (e) => {
    if (e.target.files.length > 0) {
      await validateAndProcessLogo(e.target.files[0]);
    }
  };

  const removeLogo = () => {
    setCompanyLogo(null);
    setLogoPreview(null);
    localStorage.removeItem('canadianPaystubLogo');
    if (logoInputRef.current) logoInputRef.current.value = '';
  };

  useEffect(() => {
    localStorage.removeItem('canadianPaystubLogo');
    setCompanyLogo(null);
    setLogoPreview(null);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (companySearchRef.current && !companySearchRef.current.contains(event.target)) {
        setShowCompanyDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Calculate number of stubs
  const calculateNumStubs = useMemo(() => {
    if (!formData.startDate || !formData.endDate) return 0;
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const periodLength = formData.payFrequency === "biweekly" ? 14 : 7;
    return Math.ceil(diffDays / periodLength);
  }, [formData.startDate, formData.endDate, formData.payFrequency]);

  // Pay periods
  const payPeriods = useMemo(() => {
    if (!formData.startDate || !formData.endDate || calculateNumStubs === 0) return [];
    const periods = [];
    const periodLength = formData.payFrequency === "biweekly" ? 14 : 7;
    let currentStart = new Date(formData.startDate);
    for (let i = 0; i < calculateNumStubs; i++) {
      const periodEnd = new Date(currentStart);
      periodEnd.setDate(currentStart.getDate() + periodLength - 1);
      periods.push({
        index: i,
        startDate: new Date(currentStart),
        endDate: periodEnd,
        label: `${currentStart.toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })} - ${periodEnd.toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })}`
      });
      currentStart = new Date(periodEnd);
      currentStart.setDate(currentStart.getDate() + 1);
    }
    return periods;
  }, [formData.startDate, formData.endDate, formData.payFrequency, calculateNumStubs]);

  useEffect(() => {
    const defaultHours = formData.payFrequency === "biweekly" ? 80 : 40;
    if (payPeriods.length > 0) {
      setHoursPerPeriod(prev => {
        return payPeriods.map((period, i) => ({
          hours: prev[i]?.hours ?? defaultHours,
          overtime: prev[i]?.overtime ?? 0
        }));
      });
    } else {
      setHoursPerPeriod([]);
    }
  }, [payPeriods.length, formData.payFrequency]);

  useEffect(() => {
    if (hoursPerPeriod.length > 0) {
      const hoursList = hoursPerPeriod.map(p => p.hours).join(', ');
      const overtimeList = hoursPerPeriod.map(p => p.overtime).join(', ');
      setFormData(prev => ({ ...prev, hoursList, overtimeList }));
    }
  }, [hoursPerPeriod]);

  const handlePeriodHoursChange = (index, field, value) => {
    setHoursPerPeriod(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: parseFloat(value) || 0 };
      return updated;
    });
  };

  // Preview calculations
  const preview = useMemo(() => {
    const rate = parseFloat(formData.rate) || 0;
    const annualSalary = parseFloat(formData.annualSalary) || 0;
    const numStubs = calculateNumStubs;
    const defaultHours = formData.payFrequency === "weekly" ? 40 : 80;
    const hoursArray = formData.hoursList.split(",").map((h) => parseFloat(h.trim()) || 0).slice(0, numStubs) || [];
    const overtimeArray = formData.overtimeList.split(",").map((h) => parseFloat(h.trim()) || 0).slice(0, numStubs) || [];

    let totalGross = 0;
    if (formData.payType === "salary") {
      const periodsPerYear = formData.payFrequency === "weekly" ? 52 : 26;
      const salaryPerPeriod = annualSalary / periodsPerYear;
      totalGross = salaryPerPeriod * (numStubs || 1);
    } else {
      const results = hoursArray.map((hrs, i) => {
        const baseHours = hrs || defaultHours;
        const overtime = overtimeArray[i] || 0;
        return rate * baseHours + rate * 1.5 * overtime;
      });
      totalGross = results.reduce((a, b) => a + b, 0);
    }

    const isContractor = formData.workerType === "contractor";
    const isQuebec = formData.province === "QC";
    
    // Canadian tax calculations (approximate for preview)
    const cppRate = isQuebec ? 0.064 : 0.0595;
    const eiRate = isQuebec ? 0.0132 : 0.0166;
    const qpipRate = isQuebec ? 0.00494 : 0;
    
    const cpp = isContractor ? 0 : totalGross * cppRate;
    const ei = isContractor ? 0 : totalGross * eiRate;
    const qpip = isContractor ? 0 : totalGross * qpipRate;
    const federalTax = isContractor ? 0 : totalGross * 0.15; // Approximate
    const provincialTax = isContractor ? 0 : totalGross * 0.05; // Approximate
    const totalTaxes = cpp + ei + qpip + federalTax + provincialTax;

    const totalDeductions = deductions.reduce((sum, d) => {
      const amount = parseFloat(d.amount) || 0;
      if (d.isPercentage) {
        return sum + (totalGross * amount / 100) * (numStubs || 1);
      }
      return sum + amount * (numStubs || 1);
    }, 0);

    return {
      gross: totalGross,
      cpp,
      ei,
      qpip,
      federalTax,
      provincialTax,
      totalTaxes,
      totalDeductions,
      net: totalGross - totalTaxes - totalDeductions,
      numStubs: numStubs || 0,
      isQuebec,
      cppLabel: isQuebec ? 'QPP' : 'CPP',
    };
  }, [formData, calculateNumStubs, deductions]);

  // PayPal handlers
  const createOrder = (data, actions) => {
    return actions.order.create({
      purchase_units: [{ amount: { value: "9.99", currency_code: "USD" } }],
    });
  };

  const onApprove = async (data, actions) => {
    setIsProcessing(true);
    try {
      await actions.order.capture();
      const downloadData = {
        ...formData,
        deductions,
        contributions,
        companyLogo,
        logoDataUrl: logoPreview,
      };
      await generateAndDownloadCanadianPaystub(downloadData, selectedTemplate);
      localStorage.removeItem('canadianPaystubLogo');
      toast.success("Payment successful! Your Canadian pay stub is downloading.");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Something went wrong. Please try again.");
    }
    setIsProcessing(false);
  };

  return (
    <>
      <Helmet>
        <title>Canadian Pay Stub Generator | MintSlip</title>
        <meta name="description" content="Generate professional Canadian pay stubs with accurate CPP, EI, and provincial tax calculations for all provinces and territories." />
      </Helmet>
      
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-green-50">
        <Header />
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Hero Section */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <MapleLeaf className="w-8 h-8 text-red-600" />
              <h1 className="text-4xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
                Canadian Pay Stub Generator
              </h1>
            </div>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Generate professional Canadian pay stubs with accurate CPP/QPP, EI, and provincial tax calculations.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form Section */}
            <div className="lg:col-span-2 space-y-6">
              {/* Payroll Company Selection */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <h2 className="text-2xl font-bold mb-4" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
                  Payroll Provider
                </h2>
                
                <div ref={companySearchRef} className="relative mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      type="text"
                      placeholder="Search payroll provider..."
                      value={companySearchQuery}
                      onChange={(e) => {
                        setCompanySearchQuery(e.target.value);
                        setShowCompanyDropdown(true);
                      }}
                      onFocus={() => setShowCompanyDropdown(true)}
                      className="pl-10"
                    />
                  </div>
                  
                  {showCompanyDropdown && filteredCompanies.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg">
                      {filteredCompanies.map((company) => (
                        <button
                          key={company.id}
                          onClick={() => handlePayrollCompanySelect(company)}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left"
                        >
                          {company.logo ? (
                            <img src={company.logo} alt={company.name} className="w-8 h-8 object-contain" />
                          ) : (
                            <Building2 className="w-8 h-8 text-slate-400" />
                          )}
                          <span className="font-medium">{company.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {selectedPayrollCompany && (
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                    {selectedPayrollCompany.logo ? (
                      <img src={selectedPayrollCompany.logo} alt={selectedPayrollCompany.name} className="w-10 h-10 object-contain" />
                    ) : (
                      <Building2 className="w-10 h-10 text-green-600" />
                    )}
                    <div>
                      <p className="font-medium text-green-800">{selectedPayrollCompany.name}</p>
                      <p className="text-sm text-green-600">Template selected</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Company Logo Upload */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
                  Company Logo (optional)
                </h2>
                <p className="text-sm text-slate-500 mb-4">
                  Upload company logo. PNG or JPG, max 2MB. Image will be resized automatically.
                </p>
                
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                  onDrop={handleLogoDrop}
                  className={`relative border-2 border-dashed rounded-lg p-6 transition-all ${
                    isDragging ? 'border-green-500 bg-green-50' : logoError ? 'border-red-300 bg-red-50' : 'border-slate-300 hover:border-green-400'
                  }`}
                >
                  {logoPreview ? (
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <img src={logoPreview} alt="Logo Preview" className="w-20 h-20 object-contain rounded-lg border border-slate-200 bg-white p-2" />
                        <button type="button" onClick={removeLogo} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-green-700">Logo uploaded!</p>
                        <p className="text-xs text-slate-500">Click X to remove</p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Upload className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                      <p className="text-sm text-slate-600 mb-2">Drag and drop your logo here, or</p>
                      <Button type="button" variant="outline" size="sm" onClick={() => logoInputRef.current?.click()}>
                        <Upload className="w-4 h-4 mr-2" /> Select File
                      </Button>
                      <input ref={logoInputRef} type="file" accept=".png,.jpg,.jpeg" onChange={handleLogoSelect} className="hidden" />
                      <p className="text-xs text-slate-400 mt-3">PNG or JPG, max 2MB</p>
                    </div>
                  )}
                </div>
                {logoError && <p className="text-sm text-red-500 mt-2"><X className="w-4 h-4 inline mr-1" />{logoError}</p>}
              </div>

              {/* Worker Type Selection */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <h2 className="text-2xl font-bold mb-4" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
                  Worker Type
                </h2>
                {selectedTemplate === 'template-a' ? (
                  <RadioGroup value={formData.workerType} onValueChange={handleWorkerTypeChange}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className={`border-2 rounded-lg p-4 cursor-pointer ${formData.workerType === 'employee' ? 'border-green-600 bg-green-50' : 'border-slate-200'}`}>
                        <RadioGroupItem value="employee" id="employee" className="sr-only" />
                        <Label htmlFor="employee" className="cursor-pointer">
                          <div className="font-semibold">Employee</div>
                          <div className="text-sm text-slate-500">T4 - CPP/QPP, EI deductions</div>
                        </Label>
                      </div>
                      <div className={`border-2 rounded-lg p-4 cursor-pointer ${formData.workerType === 'contractor' ? 'border-green-600 bg-green-50' : 'border-slate-200'}`}>
                        <RadioGroupItem value="contractor" id="contractor" className="sr-only" />
                        <Label htmlFor="contractor" className="cursor-pointer">
                          <div className="font-semibold">Contractor</div>
                          <div className="text-sm text-slate-500">Self-employed - No deductions</div>
                        </Label>
                      </div>
                    </div>
                  </RadioGroup>
                ) : (
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-sm text-slate-600">Employee (T4) - Contractor option only available with Gusto template</p>
                  </div>
                )}
              </div>

              {/* Pay Type Selection */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <h2 className="text-2xl font-bold mb-4" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
                  Pay Type
                </h2>
                <RadioGroup value={formData.payType} onValueChange={(val) => setFormData(prev => ({ ...prev, payType: val }))}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className={`border-2 rounded-lg p-4 cursor-pointer ${formData.payType === 'hourly' ? 'border-green-600 bg-green-50' : 'border-slate-200'}`}>
                      <RadioGroupItem value="hourly" id="hourly" className="sr-only" />
                      <Label htmlFor="hourly" className="cursor-pointer">
                        <div className="font-semibold">Hourly</div>
                        <div className="text-sm text-slate-500">Paid by the hour</div>
                      </Label>
                    </div>
                    <div className={`border-2 rounded-lg p-4 cursor-pointer ${formData.payType === 'salary' ? 'border-green-600 bg-green-50' : 'border-slate-200'} ${!canUseSalary ? 'opacity-50' : ''}`}>
                      <RadioGroupItem value="salary" id="salary" className="sr-only" disabled={!canUseSalary} />
                      <Label htmlFor="salary" className={`cursor-pointer ${!canUseSalary ? 'cursor-not-allowed' : ''}`}>
                        <div className="font-semibold">Salary</div>
                        <div className="text-sm text-slate-500">Fixed annual salary</div>
                      </Label>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              {/* Employee Information */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <h2 className="text-2xl font-bold mb-4" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
                  {formData.workerType === 'contractor' ? 'Contractor' : 'Employee'} Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" name="name" value={formData.name} onChange={handleChange} placeholder="John Smith" />
                  </div>
                  <div>
                    <Label htmlFor="sin">SIN (Last 3 digits shown)</Label>
                    <Input id="sin" name="sin" value={formData.sin} onChange={handleSINChange} placeholder="XXX-XXX-XXX" maxLength={11} />
                    {validationErrors.sin && <p className="text-xs text-red-500 mt-1">{validationErrors.sin}</p>}
                  </div>
                  <div>
                    <Label htmlFor="bank">Bank Account (Last 4)</Label>
                    <Input id="bank" name="bank" value={formData.bank} onChange={handleBankChange} placeholder="1234" maxLength={4} />
                  </div>
                  <div>
                    <Label htmlFor="bankName">Bank Name</Label>
                    <Input id="bankName" name="bankName" value={formData.bankName} onChange={handleChange} placeholder="TD Bank" />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="address">Street Address</Label>
                    <Input id="address" name="address" value={formData.address} onChange={handleChange} placeholder="123 Main Street" />
                  </div>
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input id="city" name="city" value={formData.city} onChange={handleChange} placeholder="Toronto" />
                  </div>
                  <div>
                    <Label htmlFor="province">Province/Territory</Label>
                    <Select value={formData.province} onValueChange={(val) => setFormData(prev => ({ ...prev, province: val }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CANADIAN_PROVINCES.map(p => (
                          <SelectItem key={p.code} value={p.code}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="postalCode">Postal Code</Label>
                    <Input id="postalCode" name="postalCode" value={formData.postalCode} onChange={handlePostalCodeChange} placeholder="A1A 1A1" maxLength={7} />
                    {validationErrors.postalCode && <p className="text-xs text-red-500 mt-1">{validationErrors.postalCode}</p>}
                  </div>
                  <div>
                    <Label htmlFor="hireDate">{formData.workerType === 'contractor' ? 'Start Date' : 'Hire Date'}</Label>
                    <Input id="hireDate" name="hireDate" type="date" value={formData.hireDate} onChange={handleChange} />
                  </div>
                </div>
              </div>

              {/* Company Information */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <h2 className="text-2xl font-bold mb-4" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
                  Company Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="company">Company Name</Label>
                    <Input id="company" name="company" value={formData.company} onChange={handleChange} placeholder="Acme Inc." />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="companyAddress">Street Address</Label>
                    <Input id="companyAddress" name="companyAddress" value={formData.companyAddress} onChange={handleChange} placeholder="456 Business Ave" />
                  </div>
                  <div>
                    <Label htmlFor="companyCity">City</Label>
                    <Input id="companyCity" name="companyCity" value={formData.companyCity} onChange={handleChange} placeholder="Vancouver" />
                  </div>
                  <div>
                    <Label htmlFor="companyProvince">Province/Territory</Label>
                    <Select value={formData.companyProvince} onValueChange={(val) => setFormData(prev => ({ ...prev, companyProvince: val }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CANADIAN_PROVINCES.map(p => (
                          <SelectItem key={p.code} value={p.code}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="companyPostalCode">Postal Code</Label>
                    <Input id="companyPostalCode" name="companyPostalCode" value={formData.companyPostalCode} onChange={handlePostalCodeChange} placeholder="V1V 1V1" maxLength={7} />
                  </div>
                  <div>
                    <Label htmlFor="companyPhone">Phone</Label>
                    <Input id="companyPhone" name="companyPhone" value={formData.companyPhone} onChange={handleCompanyPhoneChange} placeholder="(604) 555-1234" />
                  </div>
                </div>
              </div>

              {/* Pay Period Information */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <h2 className="text-2xl font-bold mb-4" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
                  Pay Period
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input id="startDate" name="startDate" type="date" value={formData.startDate} onChange={handleChange} />
                  </div>
                  <div>
                    <Label htmlFor="endDate">End Date</Label>
                    <Input id="endDate" name="endDate" type="date" value={formData.endDate} onChange={handleChange} />
                  </div>
                  <div>
                    <Label htmlFor="payFrequency">Pay Frequency</Label>
                    <Select value={formData.payFrequency} onValueChange={(val) => setFormData(prev => ({ ...prev, payFrequency: val }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="biweekly">Bi-weekly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="payDay">Pay Day</Label>
                    <Select value={formData.payDay} onValueChange={(val) => setFormData(prev => ({ ...prev, payDay: val }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(day => (
                          <SelectItem key={day} value={day}>{day}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {formData.payType === "hourly" ? (
                    <div>
                      <Label htmlFor="rate">Hourly Rate (CAD)</Label>
                      <Input id="rate" name="rate" type="number" step="0.01" value={formData.rate} onChange={handleChange} placeholder="25.00" />
                    </div>
                  ) : (
                    <div>
                      <Label htmlFor="annualSalary">Annual Salary (CAD)</Label>
                      <Input id="annualSalary" name="annualSalary" type="number" step="0.01" value={formData.annualSalary} onChange={handleChange} placeholder="75000" />
                    </div>
                  )}
                </div>

                {/* Hours per period */}
                {formData.payType === "hourly" && payPeriods.length > 0 && (
                  <Collapsible open={hoursExpanded} onOpenChange={setHoursExpanded} className="mt-6">
                    <CollapsibleTrigger asChild>
                      <Button variant="outline" className="w-full justify-between">
                        Edit Hours per Period ({payPeriods.length} periods)
                        {hoursExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-4 space-y-3">
                      {payPeriods.map((period, idx) => (
                        <div key={idx} className="grid grid-cols-3 gap-3 items-center p-3 bg-slate-50 rounded-lg">
                          <div className="text-sm font-medium">{period.label}</div>
                          <div>
                            <Label className="text-xs">Regular Hours</Label>
                            <Input
                              type="number"
                              value={hoursPerPeriod[idx]?.hours || 0}
                              onChange={(e) => handlePeriodHoursChange(idx, 'hours', e.target.value)}
                              className="h-8"
                            />
                          </div>
                          {!formData.workerType.includes('contractor') && (
                            <div>
                              <Label className="text-xs">Overtime</Label>
                              <Input
                                type="number"
                                value={hoursPerPeriod[idx]?.overtime || 0}
                                onChange={(e) => handlePeriodHoursChange(idx, 'overtime', e.target.value)}
                                className="h-8"
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </CollapsibleContent>
                  </Collapsible>
                )}
              </div>

              {/* Deductions Section */}
              {formData.workerType !== 'contractor' && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
                      Additional Deductions
                    </h2>
                    <Button variant="outline" size="sm" onClick={addDeduction}>+ Add Deduction</Button>
                  </div>
                  {deductions.length === 0 ? (
                    <p className="text-sm text-slate-500">No additional deductions. Click "Add Deduction" to add RRSP, insurance, etc.</p>
                  ) : (
                    <div className="space-y-3">
                      {deductions.map((d) => (
                        <div key={d.id} className="grid grid-cols-4 gap-3 items-end p-3 bg-slate-50 rounded-lg">
                          <div>
                            <Label className="text-xs">Type</Label>
                            <Select value={d.type} onValueChange={(val) => updateDeduction(d.id, 'type', val)}>
                              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {deductionTypes.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-xs">Name</Label>
                            <Input value={d.name} onChange={(e) => updateDeduction(d.id, 'name', e.target.value)} placeholder="Label" className="h-9" />
                          </div>
                          <div>
                            <Label className="text-xs">Amount</Label>
                            <Input type="number" value={d.amount} onChange={(e) => updateDeduction(d.id, 'amount', e.target.value)} placeholder="0.00" className="h-9" />
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => removeDeduction(d.id)} className="text-red-500 h-9">
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Summary & Payment Section */}
            <div className="lg:col-span-1">
              <div className="sticky top-4 space-y-6">
                {/* Summary Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
                    <MapleLeaf className="w-5 h-5 text-red-600" />
                    Pay Stub Summary
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Province:</span>
                      <span className="font-medium">{CANADIAN_PROVINCES.find(p => p.code === formData.province)?.name || formData.province}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Pay Stubs:</span>
                      <span className="font-medium">{preview.numStubs}</span>
                    </div>
                    <hr className="border-slate-200" />
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Gross Pay:</span>
                      <span className="font-medium">${formatCurrency(preview.gross)}</span>
                    </div>
                    {formData.workerType !== 'contractor' && (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600">{preview.cppLabel}:</span>
                          <span className="text-red-600">-${formatCurrency(preview.cpp)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600">EI:</span>
                          <span className="text-red-600">-${formatCurrency(preview.ei)}</span>
                        </div>
                        {preview.isQuebec && (
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-600">QPIP:</span>
                            <span className="text-red-600">-${formatCurrency(preview.qpip)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600">Federal Tax:</span>
                          <span className="text-red-600">-${formatCurrency(preview.federalTax)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600">Provincial Tax:</span>
                          <span className="text-red-600">-${formatCurrency(preview.provincialTax)}</span>
                        </div>
                        {preview.totalDeductions > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-600">Other Deductions:</span>
                            <span className="text-red-600">-${formatCurrency(preview.totalDeductions)}</span>
                          </div>
                        )}
                      </>
                    )}
                    <hr className="border-slate-200" />
                    <div className="flex justify-between text-lg font-bold">
                      <span className="text-slate-800">Net Pay:</span>
                      <span className="text-green-600">${formatCurrency(preview.net)}</span>
                    </div>
                  </div>
                </div>

                {/* Preview Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                  <h3 className="text-xl font-bold mb-4" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
                    Document Preview
                  </h3>
                  
                  {isGeneratingPreview ? (
                    <div className="aspect-[8.5/11] bg-slate-100 rounded-lg flex items-center justify-center">
                      <div className="animate-spin w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full" />
                    </div>
                  ) : pdfPreview ? (
                    <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
                      <DialogTrigger asChild>
                        <div className="cursor-pointer hover:opacity-90 transition-opacity">
                          <img src={pdfPreview} alt="Preview" className="w-full rounded-lg border border-slate-200" />
                          <p className="text-xs text-center text-slate-500 mt-2">Click to enlarge</p>
                        </div>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
                        <DialogHeader>
                          <DialogTitle>Pay Stub Preview</DialogTitle>
                        </DialogHeader>
                        <img src={pdfPreview} alt="Preview" className="w-full" />
                      </DialogContent>
                    </Dialog>
                  ) : (
                    <div className="aspect-[8.5/11] bg-slate-100 rounded-lg flex items-center justify-center">
                      <p className="text-sm text-slate-500 text-center px-4">Fill in the form to see a preview</p>
                    </div>
                  )}
                </div>

                {/* Payment Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                  <h3 className="text-xl font-bold mb-2" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
                    Complete Purchase
                  </h3>
                  <p className="text-sm text-slate-600 mb-4">
                    <span className="text-2xl font-bold text-green-600">$9.99 USD</span>
                    <span className="text-slate-400 ml-2">One-time payment</span>
                  </p>
                  
                  <div className="space-y-3">
                    <PayPalButtons
                      style={{ layout: "vertical", shape: "rect", label: "pay" }}
                      disabled={isProcessing || !formData.startDate || !formData.endDate || (!formData.rate && !formData.annualSalary)}
                      createOrder={createOrder}
                      onApprove={onApprove}
                      onError={(err) => {
                        console.error("PayPal error:", err);
                        toast.error("Payment failed. Please try again.");
                      }}
                    />
                  </div>
                  
                  <p className="text-xs text-slate-500 text-center mt-4">
                    Secure payment via PayPal. Watermark removed after payment.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
        
        <Footer />
      </div>
    </>
  );
}

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
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
import { PayPalButtons } from "@paypal/react-paypal-js";
import { generateAndDownloadPaystub } from "@/utils/paystubGenerator";
import { generatePreviewPDF } from "@/utils/paystubPreviewGenerator";
import { getLocalTaxRate, getCitiesWithLocalTax, stateHasLocalTax, getSUTARate } from "@/utils/taxRates";
import AddressAutocomplete from "@/components/AddressAutocomplete";
import { Upload, X, Search, Building2 } from "lucide-react";
import { 
  formatPhoneNumber, validatePhoneNumber,
  formatZipCode, validateZipCode,
  formatSSNLast4, validateSSNLast4,
  formatBankLast4, validateBankLast4
} from "@/utils/validation";

// Payroll company templates
const PAYROLL_COMPANIES = [
  { id: 'gusto', name: 'Gusto', template: 'template-a' },
  { id: 'adp', name: 'ADP', template: 'template-b' },
  { id: 'workday', name: 'Workday', template: 'template-c' },
];

export default function PaystubForm() {
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
  const [selectedPayrollCompany, setSelectedPayrollCompany] = useState(PAYROLL_COMPANIES[0]);
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const [companyLogo, setCompanyLogo] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [logoError, setLogoError] = useState("");
  const companySearchRef = useRef(null);
  const logoInputRef = useRef(null);
  
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
    includeLocalTax: true,
    workerType: "employee", // "employee" or "contractor"
    payType: "hourly", // "hourly" or "salary"
    annualSalary: "", // for salary pay type
  });

  // Validation errors state
  const [validationErrors, setValidationErrors] = useState({
    ssn: '',
    bank: '',
    zip: '',
    companyZip: '',
    companyPhone: '',
  });

  // Common deduction types for quick selection
  const deductionTypes = [
    { label: "401(k)", value: "401k" },
    { label: "Health Insurance", value: "health_insurance" },
    { label: "Dental Insurance", value: "dental_insurance" },
    { label: "Vision Insurance", value: "vision_insurance" },
    { label: "Life Insurance", value: "life_insurance" },
    { label: "Disability Insurance", value: "disability_insurance" },
    { label: "Union Dues", value: "union_dues" },
    { label: "Garnishment", value: "garnishment" },
    { label: "Other", value: "other" },
  ];

  // Common contribution types for quick selection
  const contributionTypes = [
    { label: "401(k) Match", value: "401k_match" },
    { label: "HSA", value: "hsa" },
    { label: "FSA", value: "fsa" },
    { label: "Dependent Care FSA", value: "dependent_care_fsa" },
    { label: "Commuter Benefits", value: "commuter" },
    { label: "Roth 401(k)", value: "roth_401k" },
    { label: "Other", value: "other" },
  ];

  // Add a new deduction
  const addDeduction = () => {
    setDeductions([...deductions, { 
      id: Date.now(), 
      type: "other", 
      name: "", 
      amount: "", 
      isPercentage: false 
    }]);
  };

  // Remove a deduction
  const removeDeduction = (id) => {
    setDeductions(deductions.filter(d => d.id !== id));
  };

  // Update a deduction
  const updateDeduction = (id, field, value) => {
    setDeductions(deductions.map(d => 
      d.id === id ? { ...d, [field]: value } : d
    ));
  };

  // Add a new contribution
  const addContribution = () => {
    setContributions([...contributions, { 
      id: Date.now(), 
      type: "other", 
      name: "", 
      amount: "", 
      isPercentage: false 
    }]);
  };

  // Remove a contribution
  const removeContribution = (id) => {
    setContributions(contributions.filter(c => c.id !== id));
  };

  // Update a contribution
  const updateContribution = (id, field, value) => {
    setContributions(contributions.map(c => 
      c.id === id ? { ...c, [field]: value } : c
    ));
  };

  // Generate PDF preview when form data changes (debounced)
  useEffect(() => {
    const timer = setTimeout(async () => {
      // Only generate preview if we have minimum required data
      if (formData.startDate && formData.endDate && (formData.rate || formData.annualSalary)) {
        setIsGeneratingPreview(true);
        try {
          const previewUrl = await generatePreviewPDF(formData, selectedTemplate);
          setPdfPreview(previewUrl);
        } catch (error) {
          console.error("Preview generation failed:", error);
        }
        setIsGeneratingPreview(false);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [formData, selectedTemplate]);

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

  // Logo upload validation and processing
  const validateAndProcessLogo = (file) => {
    setLogoError("");
    
    // Check file type
    if (!file.type.includes('png')) {
      setLogoError("Only PNG files are accepted");
      return false;
    }
    
    return new Promise((resolve) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const base64 = e.target.result;
        localStorage.setItem('paystubCompanyLogo', base64);
        setCompanyLogo(base64);
        setLogoPreview(base64);
        resolve(true);
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

  // Load logo from localStorage on mount
  useEffect(() => {
    const savedLogo = localStorage.getItem('paystubCompanyLogo');
    if (savedLogo) {
      setCompanyLogo(savedLogo);
      setLogoPreview(savedLogo);
    }
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
    
    for (let i = 0; i < calculateNumStubs; i++) {
      const periodEnd = new Date(currentStart);
      periodEnd.setDate(currentStart.getDate() + periodLength - 1);
      
      periods.push({
        index: i,
        startDate: new Date(currentStart),
        endDate: periodEnd,
        label: `${currentStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${periodEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
      });
      
      currentStart = new Date(periodEnd);
      currentStart.setDate(currentStart.getDate() + 1);
    }
    
    return periods;
  }, [formData.startDate, formData.endDate, formData.payFrequency, calculateNumStubs]);

  // Initialize hoursPerPeriod when pay periods change
  useEffect(() => {
    const defaultHours = formData.payFrequency === "biweekly" ? 80 : 40;
    
    if (payPeriods.length > 0) {
      setHoursPerPeriod(prev => {
        const newHours = payPeriods.map((period, i) => ({
          hours: prev[i]?.hours ?? defaultHours,
          overtime: prev[i]?.overtime ?? 0
        }));
        return newHours;
      });
    } else {
      setHoursPerPeriod([]);
    }
  }, [payPeriods.length, formData.payFrequency]);

  // Update formData hoursList and overtimeList when hoursPerPeriod changes
  useEffect(() => {
    if (hoursPerPeriod.length > 0) {
      const hoursList = hoursPerPeriod.map(p => p.hours).join(', ');
      const overtimeList = hoursPerPeriod.map(p => p.overtime).join(', ');
      
      setFormData(prev => ({
        ...prev,
        hoursList,
        overtimeList
      }));
    }
  }, [hoursPerPeriod]);

  // Handler for updating individual period hours
  const handlePeriodHoursChange = (index, field, value) => {
    setHoursPerPeriod(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: parseFloat(value) || 0
      };
      return updated;
    });
  };

  const preview = useMemo(() => {
    const rate = parseFloat(formData.rate) || 0;
    const annualSalary = parseFloat(formData.annualSalary) || 0;
    const numStubs = calculateNumStubs;
    const defaultHours = formData.payFrequency === "weekly" ? 40 : 80;
    const hoursArray = formData.hoursList
      .split(",")
      .map((h) => parseFloat(h.trim()) || 0)
      .slice(0, numStubs) || [];
    const overtimeArray = formData.overtimeList
      .split(",")
      .map((h) => parseFloat(h.trim()) || 0)
      .slice(0, numStubs) || [];

    let totalGross = 0;
    
    if (formData.payType === "salary") {
      // Calculate salary per pay period
      const periodsPerYear = formData.payFrequency === "weekly" ? 52 : 26;
      const salaryPerPeriod = annualSalary / periodsPerYear;
      totalGross = salaryPerPeriod * (numStubs || 1);
    } else {
      // Hourly calculation
      const results = hoursArray.map((hrs, i) => {
        const baseHours = hrs || defaultHours;
        const overtime = overtimeArray[i] || 0;
        return rate * baseHours + rate * 1.5 * overtime;
      });
      totalGross = results.reduce((a, b) => a + b, 0);
    }

    // Contractors don't have taxes withheld (they handle their own taxes)
    const isContractor = formData.workerType === "contractor";
    const ssTax = isContractor ? 0 : totalGross * 0.062;
    const medTax = isContractor ? 0 : totalGross * 0.0145;
    
    // Use actual state tax rate from stateRates lookup
    const stateRates = {
      AL: 0.05, AK: 0, AZ: 0.025, AR: 0.047, CA: 0.06, CO: 0.0455, CT: 0.05,
      DE: 0.052, FL: 0, GA: 0.0575, HI: 0.07, ID: 0.059, IL: 0.0495, IN: 0.0323,
      IA: 0.05, KS: 0.0525, KY: 0.045, LA: 0.045, ME: 0.0715, MD: 0.0575,
      MA: 0.05, MI: 0.0425, MN: 0.055, MS: 0.05, MO: 0.05, MT: 0.0675, NE: 0.05,
      NV: 0, NH: 0, NJ: 0.0637, NM: 0.049, NY: 0.064, NC: 0.0475, ND: 0.027,
      OH: 0.035, OK: 0.05, OR: 0.08, PA: 0.0307, RI: 0.0375, SC: 0.07, SD: 0,
      TN: 0, TX: 0, UT: 0.0485, VT: 0.065, VA: 0.0575, WA: 0, WV: 0.065,
      WI: 0.053, WY: 0,
    };
    const stateRate = stateRates[formData.state?.toUpperCase()] || 0.05;
    const stateTax = isContractor ? 0 : totalGross * stateRate;
    
    // Use actual local tax rate from taxRates lookup
    const actualLocalTaxRate = getLocalTaxRate(formData.state, formData.city);
    const localTax = isContractor ? 0 : (formData.includeLocalTax && actualLocalTaxRate > 0 ? totalGross * actualLocalTaxRate : 0);
    
    const totalTaxes = ssTax + medTax + stateTax + localTax;

    // Calculate deductions total
    const totalDeductions = deductions.reduce((sum, d) => {
      const amount = parseFloat(d.amount) || 0;
      if (d.isPercentage) {
        return sum + (totalGross * amount / 100) * (numStubs || 1);
      }
      return sum + amount * (numStubs || 1);
    }, 0);

    // Calculate contributions total
    const totalContributions = contributions.reduce((sum, c) => {
      const amount = parseFloat(c.amount) || 0;
      if (c.isPercentage) {
        return sum + (totalGross * amount / 100) * (numStubs || 1);
      }
      return sum + amount * (numStubs || 1);
    }, 0);

    const netPay = totalGross - totalTaxes - totalDeductions - totalContributions;

    return { totalGross, totalTaxes, netPay, ssTax, medTax, stateTax, localTax, numStubs, totalDeductions, totalContributions, stateRate, localTaxRate: actualLocalTaxRate };
  }, [formData, calculateNumStubs, deductions, contributions]);

  const createOrder = (data, actions) => {
    const totalAmount = (calculateNumStubs * 10).toFixed(2);
    return actions.order.create({
      purchase_units: [
        {
          amount: {
            value: totalAmount,
            currency_code: "USD"
          },
          application_context: {
            shipping_preference: "NO_SHIPPING", // 🚫 removes shipping address prompt // 
          },
          description: `Pay Stub Generation (${calculateNumStubs} stub${calculateNumStubs > 1 ? 's' : ''})`
        },
      ],
    });
  };

  const onApprove = async (data, actions) => {
    setIsProcessing(true);
    try {
      await actions.order.capture();
      toast.success("Payment successful! Generating your document...");
      
      // Prepare formData with deductions, contributions, and company logo
      const fullFormData = {
        ...formData,
        deductions: deductions,
        contributions: contributions,
        companyLogo: companyLogo, // Include uploaded logo for PDF
      };
      
      // Generate and download PDF
      await generateAndDownloadPaystub(fullFormData, selectedTemplate, calculateNumStubs);
      
      toast.success("Pay stub(s) downloaded successfully!");
      setIsProcessing(false);
    } catch (error) {
      toast.error("Failed to generate document");
      setIsProcessing(false);
    }
  };

  const onError = (err) => {
    toast.error("Payment failed. Please try again.");
    setIsProcessing(false);
  };

  return (
    <div className="min-h-screen bg-white relative">
      <div className="noise-overlay" />
      
      <Header title="Generate Pay Stub" />

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: Form */}
          <div className="lg:col-span-7 space-y-8">
            <form className="space-y-8">
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
                            <div className="w-10 h-10 rounded bg-slate-100 border border-slate-200 flex items-center justify-center">
                              <Building2 className="w-5 h-5 text-slate-400" />
                            </div>
                            <div>
                              <span className="font-medium text-slate-700 block">{company.name}</span>
                              <span className="text-xs text-slate-500">
                                {company.template === 'template-a' ? 'Style A' : company.template === 'template-b' ? 'Style B' : 'Style C'}
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
                      <div className="w-[100px] h-[100px] rounded-lg bg-white border border-slate-200 flex items-center justify-center">
                        <Building2 className="w-10 h-10 text-slate-300" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-green-800 mb-1">✓ Payroll Provider Selected</p>
                        <p className="font-bold text-xl text-slate-800">{selectedPayrollCompany.name}</p>
                        <p className="text-sm text-slate-600 mt-1">
                          Template: <span className="font-semibold">{selectedPayrollCompany.template === 'template-a' ? 'Style A (Gusto)' : selectedPayrollCompany.template === 'template-b' ? 'Style B (ADP)' : 'Style C (Workday)'}</span>
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
                    Company Logo *
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">
                    Upload your company or payroll provider logo. PNG format only.
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
                        accept=".png,image/png"
                        onChange={handleLogoSelect}
                        className="hidden"
                        data-testid="logo-file-input"
                      />
                      <p className="text-xs text-slate-400 mt-3">
                        PNG format only
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
                
                {!companyLogo && !logoError && (
                  <p className="text-sm text-amber-600 bg-amber-50 p-2 rounded">
                    * A company logo is required to generate your pay stub
                  </p>
                )}
              </div>

              {/* Worker Type Selection - Only show contractor option for Template A (Gusto) */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
                  Worker Type
                </h2>
                {selectedTemplate === 'template-a' ? (
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
                      {selectedTemplate === 'template-b' ? 'ADP' : 'Workday'} template only supports employee pay stubs with tax withholdings.
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
                          {payPeriods.map((period, index) => (
                            <div 
                              key={index} 
                              className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-slate-50 rounded-lg"
                            >
                              <div className="flex-shrink-0 sm:w-48">
                                <span className="text-sm font-medium text-slate-700">
                                  Pay Period {index + 1}
                                </span>
                                <p className="text-xs text-slate-500">{period.label}</p>
                              </div>
                              {/* Show only hours for contractors, hours + overtime for hourly employees */}
                              {formData.workerType === 'contractor' ? (
                                <div className="flex-1">
                                  <div className="space-y-1">
                                    <Label className="text-xs text-slate-600">Hours Worked</Label>
                                    <Input
                                      type="number"
                                      value={hoursPerPeriod[index]?.hours ?? (formData.payFrequency === 'biweekly' ? 80 : 40)}
                                      onChange={(e) => handlePeriodHoursChange(index, 'hours', e.target.value)}
                                      className="h-9 max-w-32"
                                      min="0"
                                      step="0.5"
                                    />
                                  </div>
                                </div>
                              ) : (
                                <div className="flex-1 grid grid-cols-2 gap-3">
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
                                </div>
                              )}
                            </div>
                          ))}
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

                {/* Employee Deductions Section - Only for employees */}
                {formData.workerType === 'employee' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
                          Employee Deductions
                        </h2>
                        <p className="text-xs text-slate-500 mt-1">
                          Pre-tax deductions like 401(k), health insurance, etc.
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
                                    <SelectValue />
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
                          Voluntary contributions like HSA, FSA, Roth 401(k), etc.
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
                                    <SelectValue />
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
                  <div className="flex justify-between">
                    <span className="text-slate-700">Total Gross Pay:</span>
                    <span className="font-bold">${preview.totalGross.toFixed(2)}</span>
                  </div>
                  
                  {formData.workerType === 'employee' ? (
                    <>
                      <div className="flex justify-between">
                        <span className="text-slate-700">Social Security (6.2%):</span>
                        <span>${preview.ssTax.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-700">Medicare (1.45%):</span>
                        <span>${preview.medTax.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-700">
                          {formData.state ? `${formData.state} State Tax (${(preview.stateRate * 100).toFixed(2)}%):` : 'State Tax:'}
                        </span>
                        <span>${preview.stateTax.toFixed(2)}</span>
                      </div>
                      {formData.includeLocalTax && preview.localTaxRate > 0 && (
                        <div className="flex justify-between">
                          <span className="text-slate-700">
                            {formData.city ? `${formData.city} Local Tax (${(preview.localTaxRate * 100).toFixed(2)}%):` : 'Local Tax:'}
                          </span>
                          <span>${preview.localTax.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="border-t border-green-300 pt-2 mt-2">
                        <div className="flex justify-between text-red-700">
                          <span className="font-bold">Total Taxes:</span>
                          <span className="font-bold">${preview.totalTaxes.toFixed(2)}</span>
                        </div>
                      </div>
                      {/* Deductions */}
                      {preview.totalDeductions > 0 && (
                        <div className="flex justify-between text-orange-700">
                          <span className="font-bold">Total Deductions:</span>
                          <span className="font-bold">${preview.totalDeductions.toFixed(2)}</span>
                        </div>
                      )}
                      {/* Contributions */}
                      {preview.totalContributions > 0 && (
                        <div className="flex justify-between text-purple-700">
                          <span className="font-bold">Total Contributions:</span>
                          <span className="font-bold">${preview.totalContributions.toFixed(2)}</span>
                        </div>
                      )}
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
                    <span className="font-bold">${preview.netPay.toFixed(2)}</span>
                  </div>
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
                  <div className="flex items-center justify-center h-64 bg-slate-100 rounded-md">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-700 mx-auto mb-2"></div>
                      <p className="text-sm text-slate-500">Generating preview...</p>
                    </div>
                  </div>
                ) : pdfPreview ? (
                  <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
                    <DialogTrigger asChild>
                      <div className="relative cursor-pointer group">
                        {/* PDF Preview Thumbnail */}
                        <div className="relative overflow-hidden rounded-md border border-slate-300 bg-white shadow-sm hover:shadow-md transition-shadow">
                          <iframe
                            src={pdfPreview}
                            className="w-full h-64 pointer-events-none"
                            title="Paystub Preview"
                            style={{ transform: 'scale(1)', transformOrigin: 'top left' }}
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
                          <span>Document Preview</span>
                          <span className="text-sm font-normal text-amber-600 bg-amber-50 px-2 py-1 rounded">
                            Watermark removed after payment
                          </span>
                        </DialogTitle>
                      </DialogHeader>
                      <div className="relative flex-1 h-full overflow-hidden">
                        <iframe
                          src={pdfPreview}
                          className="w-full h-[calc(90vh-80px)]"
                          title="Paystub Preview Full"
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
                    </DialogContent>
                  </Dialog>
                ) : (
                  <div className="flex items-center justify-center h-64 bg-slate-50 rounded-md border-2 border-dashed border-slate-300">
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
                {calculateNumStubs > 0 && (
                  <p className="text-sm text-slate-600 mb-4">
                    Total: <strong>${(calculateNumStubs * 10).toFixed(2)}</strong> ({calculateNumStubs} stub{calculateNumStubs > 1 ? 's' : ''} × $10)
                  </p>
                )}
                <div data-testid="paypal-button-container">
                  <PayPalButtons
                    createOrder={createOrder}
                    onApprove={onApprove}
                    onError={onError}
                    disabled={isProcessing || calculateNumStubs === 0}
                    style={{ layout: "vertical", color: "gold", shape: "rect", label: "pay" }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

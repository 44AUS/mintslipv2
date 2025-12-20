import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";
import { toast } from "sonner";
import { PayPalButtons } from "@paypal/react-paypal-js";
import { generateAndDownloadW2, BOX_12_CODES } from "@/utils/w2Generator";
import { generateW2Preview } from "@/utils/w2PreviewGenerator";
import { 
  formatEIN, validateEIN,
  formatZipCode, validateZipCode,
  formatFullSSN, validateFullSSN
} from "@/utils/validation";

// US States list
const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "DC", "FL", "GA", "HI", "ID", "IL", "IN",
  "IA", "KS", "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH",
  "NJ", "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT",
  "VT", "VA", "WA", "WV", "WI", "WY"
];

// Generate tax year options (current year and 5 years back)
const generateTaxYears = () => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let i = 0; i <= 5; i++) {
    years.push(currentYear - i);
  }
  return years;
};

export default function W2Form() {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [pdfPreview, setPdfPreview] = useState(null);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const taxYears = useMemo(() => generateTaxYears(), []);
  const [selectedTaxYear, setSelectedTaxYear] = useState(taxYears[0].toString());

  const [formData, setFormData] = useState({
    // Employer info
    employerEIN: "",
    employerName: "",
    employerAddress: "",
    employerCity: "",
    employerState: "",
    employerZip: "",
    controlNumber: "",
    
    // Employee info
    employeeSSN: "",
    employeeFirstName: "",
    employeeMiddleInitial: "",
    employeeLastName: "",
    employeeAddress: "",
    employeeCity: "",
    employeeState: "",
    employeeZip: "",
    
    // Wage boxes
    wagesTips: "",
    federalTaxWithheld: "",
    socialSecurityWages: "",
    socialSecurityTax: "",
    medicareWages: "",
    medicareTax: "",
    socialSecurityTips: "",
    allocatedTips: "",
    dependentCareBenefits: "",
    nonqualifiedPlans: "",
    
    // Box 12
    box12aCode: "",
    box12aAmount: "",
    box12bCode: "",
    box12bAmount: "",
    box12cCode: "",
    box12cAmount: "",
    box12dCode: "",
    box12dAmount: "",
    
    // Box 13 checkboxes
    statutoryEmployee: false,
    retirementPlan: false,
    thirdPartySickPay: false,
    
    // Box 14
    other: "",
    
    // State/Local
    state: "",
    employerStateId: "",
    stateWages: "",
    stateIncomeTax: "",
    localWages: "",
    localIncomeTax: "",
    localityName: "",
  });

  // Validation errors state
  const [validationErrors, setValidationErrors] = useState({
    employerEIN: '',
    employerZip: '',
    employeeSSN: '',
    employeeZip: '',
  });

  // Validated input handlers
  const handleEINChange = (e) => {
    const formatted = formatEIN(e.target.value);
    setFormData(prev => ({ ...prev, employerEIN: formatted }));
    const validation = validateEIN(formatted);
    setValidationErrors(prev => ({ ...prev, employerEIN: validation.error }));
  };

  const handleEmployerZipChange = (e) => {
    const formatted = formatZipCode(e.target.value);
    setFormData(prev => ({ ...prev, employerZip: formatted }));
    const validation = validateZipCode(formatted);
    setValidationErrors(prev => ({ ...prev, employerZip: validation.error }));
  };

  const handleSSNChange = (e) => {
    const formatted = formatFullSSN(e.target.value);
    setFormData(prev => ({ ...prev, employeeSSN: formatted }));
    const validation = validateFullSSN(formatted);
    setValidationErrors(prev => ({ ...prev, employeeSSN: validation.error }));
  };

  const handleEmployeeZipChange = (e) => {
    const formatted = formatZipCode(e.target.value);
    setFormData(prev => ({ ...prev, employeeZip: formatted }));
    const validation = validateZipCode(formatted);
    setValidationErrors(prev => ({ ...prev, employeeZip: validation.error }));
  };

  // Auto-calculate common values
  const autoCalculate = useCallback(() => {
    const wages = parseFloat(formData.wagesTips) || 0;
    
    // Auto-fill SS and Medicare wages if empty
    const updates = {};
    
    if (!formData.socialSecurityWages && wages > 0) {
      // SS wage base for 2024 is $168,600
      updates.socialSecurityWages = Math.min(wages, 168600).toFixed(2);
    }
    
    if (!formData.medicareWages && wages > 0) {
      updates.medicareWages = wages.toFixed(2);
    }
    
    // Auto-calculate taxes if wages are set but taxes aren't
    if (!formData.socialSecurityTax && formData.socialSecurityWages) {
      const ssWages = parseFloat(formData.socialSecurityWages) || 0;
      updates.socialSecurityTax = (ssWages * 0.062).toFixed(2);
    }
    
    if (!formData.medicareTax && formData.medicareWages) {
      const medWages = parseFloat(formData.medicareWages) || 0;
      updates.medicareTax = (medWages * 0.0145).toFixed(2);
    }
    
    // Auto-fill state wages
    if (!formData.stateWages && wages > 0 && formData.state) {
      updates.stateWages = wages.toFixed(2);
    }
    
    if (Object.keys(updates).length > 0) {
      setFormData(prev => ({ ...prev, ...updates }));
    }
  }, [formData]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle checkbox changes
  const handleCheckboxChange = (name, checked) => {
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  // Generate PDF preview when form data changes (debounced)
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (selectedTaxYear) {
        setIsGeneratingPreview(true);
        try {
          const previewUrl = await generateW2Preview(formData, selectedTaxYear);
          setPdfPreview(previewUrl);
        } catch (error) {
          console.error("Preview generation failed:", error);
        }
        setIsGeneratingPreview(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData, selectedTaxYear]);

  // PayPal handlers
  const createOrder = (data, actions) => {
    return actions.order.create({
      purchase_units: [
        {
          description: `W-2 Form - Tax Year ${selectedTaxYear}`,
          amount: {
            value: "15.00",
          },
        },
      ],
      application_context: {
        shipping_preference: "NO_SHIPPING",
      },
    });
  };

  const onApprove = async (data, actions) => {
    setIsProcessing(true);
    try {
      await actions.order.capture();
      toast.success("Payment successful! Generating your W-2...");
      
      await generateAndDownloadW2(formData, selectedTaxYear);
      
      toast.success("W-2 downloaded successfully!");
      setIsProcessing(false);
    } catch (error) {
      toast.error("Failed to generate W-2");
      setIsProcessing(false);
    }
  };

  const onError = (err) => {
    toast.error("Payment failed. Please try again.");
    console.error("PayPal error:", err);
  };

  // Calculate preview totals
  const preview = useMemo(() => {
    const wages = parseFloat(formData.wagesTips) || 0;
    const fedTax = parseFloat(formData.federalTaxWithheld) || 0;
    const ssTax = parseFloat(formData.socialSecurityTax) || 0;
    const medTax = parseFloat(formData.medicareTax) || 0;
    const stateTax = parseFloat(formData.stateIncomeTax) || 0;
    const localTax = parseFloat(formData.localIncomeTax) || 0;
    
    const totalTaxes = fedTax + ssTax + medTax + stateTax + localTax;
    
    return { wages, fedTax, ssTax, medTax, stateTax, localTax, totalTaxes };
  }, [formData]);

  return (
    <div className="min-h-screen bg-slate-50">
      <Helmet>
        <title>W-2 Generator | MintSlip - Create W-2 Wage and Tax Statements</title>
        <meta name="description" content="Generate professional W-2 forms with all IRS-required boxes. Auto-calculate Social Security and Medicare taxes. Multiple tax years supported. Instant PDF download." />
        <meta name="keywords" content="W-2 generator, wage tax statement, W2 form creator, tax form generator" />
        <meta property="og:title" content="W-2 Generator | MintSlip" />
        <meta property="og:description" content="Create IRS-compliant W-2 forms instantly with automatic tax calculations." />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="W-2 Form Generator | MintSlip" />
        <meta name="twitter:description" content="Generate professional W-2 wage and tax statements." />
      </Helmet>
      
      <Header />
      <div className="max-w-7xl mx-auto px-6 py-8">

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
            W-2 Generator
          </h1>
          <p className="text-slate-600">Generate professional W-2 Wage and Tax Statements</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: Form */}
          <div className="lg:col-span-7">
            <form className="space-y-8 bg-white p-8 rounded-lg shadow-sm border border-slate-200">
              
              {/* Tax Year Selection */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
                  Tax Year
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="taxYear">Select Tax Year *</Label>
                    <Select value={selectedTaxYear} onValueChange={setSelectedTaxYear}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {taxYears.map(year => (
                          <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Employer Information */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
                  Employer Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="employerEIN">Employer EIN (Box b) *</Label>
                    <Input 
                      id="employerEIN" 
                      name="employerEIN" 
                      placeholder="XX-XXXXXXX"
                      value={formData.employerEIN} 
                      onChange={handleEINChange}
                      className={validationErrors.employerEIN ? 'border-red-500' : ''}
                    />
                    {validationErrors.employerEIN && (
                      <p className="text-xs text-red-500 mt-1">{validationErrors.employerEIN}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="controlNumber">Control Number (Box d)</Label>
                    <Input 
                      id="controlNumber" 
                      name="controlNumber" 
                      value={formData.controlNumber} 
                      onChange={handleChange} 
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="employerName">Employer Name *</Label>
                    <Input 
                      id="employerName" 
                      name="employerName" 
                      value={formData.employerName} 
                      onChange={handleChange} 
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="employerAddress">Employer Address *</Label>
                    <Input 
                      id="employerAddress" 
                      name="employerAddress" 
                      value={formData.employerAddress} 
                      onChange={handleChange} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="employerCity">City *</Label>
                    <Input 
                      id="employerCity" 
                      name="employerCity" 
                      value={formData.employerCity} 
                      onChange={handleChange} 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="employerState">State *</Label>
                      <Select value={formData.employerState} onValueChange={(val) => setFormData({...formData, employerState: val})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {US_STATES.map(state => (
                            <SelectItem key={state} value={state}>{state}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="employerZip">ZIP *</Label>
                      <Input 
                        id="employerZip" 
                        name="employerZip" 
                        placeholder="12345"
                        value={formData.employerZip} 
                        onChange={handleEmployerZipChange}
                        className={validationErrors.employerZip ? 'border-red-500' : ''}
                      />
                      {validationErrors.employerZip && (
                        <p className="text-xs text-red-500 mt-1">{validationErrors.employerZip}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Employee Information */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
                  Employee Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="employeeSSN">Social Security Number (Box a) *</Label>
                    <Input 
                      id="employeeSSN" 
                      name="employeeSSN" 
                      placeholder="XXX-XX-XXXX"
                      value={formData.employeeSSN} 
                      onChange={handleSSNChange}
                      className={validationErrors.employeeSSN ? 'border-red-500' : ''}
                    />
                    {validationErrors.employeeSSN && (
                      <p className="text-xs text-red-500 mt-1">{validationErrors.employeeSSN}</p>
                    )}
                  </div>
                  <div></div>
                  <div className="space-y-2">
                    <Label htmlFor="employeeFirstName">First Name *</Label>
                    <Input 
                      id="employeeFirstName" 
                      name="employeeFirstName" 
                      value={formData.employeeFirstName} 
                      onChange={handleChange} 
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-2">
                      <Label htmlFor="employeeMiddleInitial">M.I.</Label>
                      <Input 
                        id="employeeMiddleInitial" 
                        name="employeeMiddleInitial" 
                        maxLength="1"
                        value={formData.employeeMiddleInitial} 
                        onChange={handleChange} 
                      />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="employeeLastName">Last Name *</Label>
                      <Input 
                        id="employeeLastName" 
                        name="employeeLastName" 
                        value={formData.employeeLastName} 
                        onChange={handleChange} 
                      />
                    </div>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="employeeAddress">Employee Address *</Label>
                    <Input 
                      id="employeeAddress" 
                      name="employeeAddress" 
                      value={formData.employeeAddress} 
                      onChange={handleChange} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="employeeCity">City *</Label>
                    <Input 
                      id="employeeCity" 
                      name="employeeCity" 
                      value={formData.employeeCity} 
                      onChange={handleChange} 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="employeeState">State *</Label>
                      <Select value={formData.employeeState} onValueChange={(val) => setFormData({...formData, employeeState: val, state: val})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {US_STATES.map(state => (
                            <SelectItem key={state} value={state}>{state}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="employeeZip">ZIP *</Label>
                      <Input 
                        id="employeeZip" 
                        name="employeeZip" 
                        placeholder="12345"
                        value={formData.employeeZip} 
                        onChange={handleEmployeeZipChange}
                        className={validationErrors.employeeZip ? 'border-red-500' : ''}
                      />
                      {validationErrors.employeeZip && (
                        <p className="text-xs text-red-500 mt-1">{validationErrors.employeeZip}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Wage and Tax Information */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
                    Wage and Tax Information
                  </h2>
                  <Button type="button" variant="outline" size="sm" onClick={autoCalculate}>
                    Auto-Calculate Taxes
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="wagesTips">1. Wages, tips, other compensation *</Label>
                    <Input 
                      id="wagesTips" 
                      name="wagesTips" 
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.wagesTips} 
                      onChange={handleChange} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="federalTaxWithheld">2. Federal income tax withheld *</Label>
                    <Input 
                      id="federalTaxWithheld" 
                      name="federalTaxWithheld" 
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.federalTaxWithheld} 
                      onChange={handleChange} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="socialSecurityWages">3. Social security wages</Label>
                    <Input 
                      id="socialSecurityWages" 
                      name="socialSecurityWages" 
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.socialSecurityWages} 
                      onChange={handleChange} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="socialSecurityTax">4. Social security tax withheld</Label>
                    <Input 
                      id="socialSecurityTax" 
                      name="socialSecurityTax" 
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.socialSecurityTax} 
                      onChange={handleChange} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="medicareWages">5. Medicare wages and tips</Label>
                    <Input 
                      id="medicareWages" 
                      name="medicareWages" 
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.medicareWages} 
                      onChange={handleChange} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="medicareTax">6. Medicare tax withheld</Label>
                    <Input 
                      id="medicareTax" 
                      name="medicareTax" 
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.medicareTax} 
                      onChange={handleChange} 
                    />
                  </div>
                </div>
              </div>

              {/* State and Local Tax */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
                  State and Local Tax
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="state">15. State</Label>
                    <Select value={formData.state} onValueChange={(val) => setFormData({...formData, state: val})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {US_STATES.map(state => (
                          <SelectItem key={state} value={state}>{state}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="employerStateId">Employer's state ID number</Label>
                    <Input 
                      id="employerStateId" 
                      name="employerStateId" 
                      value={formData.employerStateId} 
                      onChange={handleChange} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stateWages">16. State wages, tips, etc.</Label>
                    <Input 
                      id="stateWages" 
                      name="stateWages" 
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.stateWages} 
                      onChange={handleChange} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stateIncomeTax">17. State income tax</Label>
                    <Input 
                      id="stateIncomeTax" 
                      name="stateIncomeTax" 
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.stateIncomeTax} 
                      onChange={handleChange} 
                    />
                  </div>
                  <div></div>
                  <div className="space-y-2">
                    <Label htmlFor="localWages">18. Local wages, tips, etc.</Label>
                    <Input 
                      id="localWages" 
                      name="localWages" 
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.localWages} 
                      onChange={handleChange} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="localIncomeTax">19. Local income tax</Label>
                    <Input 
                      id="localIncomeTax" 
                      name="localIncomeTax" 
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.localIncomeTax} 
                      onChange={handleChange} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="localityName">20. Locality name</Label>
                    <Input 
                      id="localityName" 
                      name="localityName" 
                      value={formData.localityName} 
                      onChange={handleChange} 
                    />
                  </div>
                </div>
              </div>

              {/* Advanced Options */}
              <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
                <div className="border rounded-lg overflow-hidden">
                  <CollapsibleTrigger asChild>
                    <button
                      type="button"
                      className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
                    >
                      <div>
                        <Label className="text-base font-semibold cursor-pointer">Advanced Options</Label>
                        <p className="text-xs text-slate-500 mt-1">
                          Box 12 codes, Box 13 checkboxes, and other fields
                        </p>
                      </div>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className={`h-5 w-5 text-slate-500 transition-transform ${advancedOpen ? 'rotate-180' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="p-4 space-y-6 bg-white border-t">
                      
                      {/* Box 12 */}
                      <div className="space-y-4">
                        <h3 className="font-semibold text-slate-700">Box 12 - Codes</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {['a', 'b', 'c', 'd'].map((letter) => (
                            <div key={letter} className="flex gap-2">
                              <div className="flex-1 space-y-1">
                                <Label className="text-xs">12{letter} Code</Label>
                                <Select 
                                  value={formData[`box12${letter}Code`]} 
                                  onValueChange={(val) => setFormData({...formData, [`box12${letter}Code`]: val})}
                                >
                                  <SelectTrigger className="h-9">
                                    <SelectValue placeholder="Select code" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {BOX_12_CODES.map(item => (
                                      <SelectItem key={item.code} value={item.code}>{item.label}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="w-28 space-y-1">
                                <Label className="text-xs">Amount</Label>
                                <Input 
                                  type="number"
                                  step="0.01"
                                  placeholder="0.00"
                                  className="h-9"
                                  value={formData[`box12${letter}Amount`]} 
                                  onChange={(e) => setFormData({...formData, [`box12${letter}Amount`]: e.target.value})}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Box 13 Checkboxes */}
                      <div className="space-y-4">
                        <h3 className="font-semibold text-slate-700">Box 13</h3>
                        <div className="flex flex-wrap gap-6">
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="statutoryEmployee"
                              checked={formData.statutoryEmployee}
                              onCheckedChange={(checked) => handleCheckboxChange('statutoryEmployee', checked)}
                            />
                            <Label htmlFor="statutoryEmployee" className="text-sm cursor-pointer">Statutory employee</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="retirementPlan"
                              checked={formData.retirementPlan}
                              onCheckedChange={(checked) => handleCheckboxChange('retirementPlan', checked)}
                            />
                            <Label htmlFor="retirementPlan" className="text-sm cursor-pointer">Retirement plan</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="thirdPartySickPay"
                              checked={formData.thirdPartySickPay}
                              onCheckedChange={(checked) => handleCheckboxChange('thirdPartySickPay', checked)}
                            />
                            <Label htmlFor="thirdPartySickPay" className="text-sm cursor-pointer">Third-party sick pay</Label>
                          </div>
                        </div>
                      </div>

                      {/* Other boxes */}
                      <div className="space-y-4">
                        <h3 className="font-semibold text-slate-700">Other Boxes</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="socialSecurityTips">7. Social security tips</Label>
                            <Input 
                              id="socialSecurityTips" 
                              name="socialSecurityTips" 
                              type="number"
                              step="0.01"
                              value={formData.socialSecurityTips} 
                              onChange={handleChange} 
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="allocatedTips">8. Allocated tips</Label>
                            <Input 
                              id="allocatedTips" 
                              name="allocatedTips" 
                              type="number"
                              step="0.01"
                              value={formData.allocatedTips} 
                              onChange={handleChange} 
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="dependentCareBenefits">10. Dependent care benefits</Label>
                            <Input 
                              id="dependentCareBenefits" 
                              name="dependentCareBenefits" 
                              type="number"
                              step="0.01"
                              value={formData.dependentCareBenefits} 
                              onChange={handleChange} 
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="nonqualifiedPlans">11. Nonqualified plans</Label>
                            <Input 
                              id="nonqualifiedPlans" 
                              name="nonqualifiedPlans" 
                              type="number"
                              step="0.01"
                              value={formData.nonqualifiedPlans} 
                              onChange={handleChange} 
                            />
                          </div>
                          <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="other">14. Other</Label>
                            <Input 
                              id="other" 
                              name="other" 
                              value={formData.other} 
                              onChange={handleChange} 
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>

            </form>
          </div>

          {/* Right: Preview and PayPal */}
          <div className="lg:col-span-5">
            <div className="sticky top-24 space-y-6">
              
              {/* Summary Preview */}
              <div className="p-6 bg-green-50 border-2 border-green-200 rounded-md">
                <h3 className="text-xl font-bold mb-4" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
                  W-2 Summary - {selectedTaxYear}
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-700">Total Wages (Box 1):</span>
                    <span className="font-bold">${preview.wages.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-700">Federal Tax Withheld (Box 2):</span>
                    <span>${preview.fedTax.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-700">Social Security Tax (Box 4):</span>
                    <span>${preview.ssTax.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-700">Medicare Tax (Box 6):</span>
                    <span>${preview.medTax.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>
                  {preview.stateTax > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-700">State Tax (Box 17):</span>
                      <span>${preview.stateTax.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  {preview.localTax > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-700">Local Tax (Box 19):</span>
                      <span>${preview.localTax.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  <div className="border-t border-green-300 pt-2 mt-2">
                    <div className="flex justify-between text-red-700">
                      <span className="font-bold">Total Taxes Withheld:</span>
                      <span className="font-bold">${preview.totalTaxes.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* PDF Preview Section */}
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
                ) : pdfPreview ? (
                  <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
                    <DialogTrigger asChild>
                      <div className="relative cursor-pointer group">
                        <div className="relative overflow-hidden rounded-md border border-slate-300 bg-white shadow-sm hover:shadow-md transition-shadow">
                          <img
                            src={pdfPreview}
                            alt="W-2 Preview"
                            className="w-full h-96 object-contain bg-white"
                          />
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="text-4xl font-bold text-slate-300 opacity-60 rotate-[-30deg] select-none">
                              MintSlip
                            </div>
                          </div>
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all flex items-center justify-center">
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white px-3 py-1 rounded-full shadow-md">
                              <span className="text-sm text-slate-700">Click to enlarge</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl w-full h-[90vh] p-0">
                      <DialogHeader className="p-4 border-b">
                        <DialogTitle>W-2 Preview - Tax Year {selectedTaxYear}</DialogTitle>
                      </DialogHeader>
                      <div className="relative flex-1 h-full overflow-auto p-4">
                        <img src={pdfPreview} alt="W-2 Preview Full" className="w-full h-auto" />
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="text-8xl font-bold text-slate-300 opacity-40 rotate-[-30deg] select-none">
                            MintSlip
                          </div>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                ) : (
                  <div className="flex items-center justify-center h-96 bg-slate-50 rounded-md border-2 border-dashed border-slate-300">
                    <p className="text-sm text-slate-500">Select a tax year to see preview</p>
                  </div>
                )}
              </div>

              {/* PayPal */}
              <div className="p-6 bg-slate-50 border-2 border-slate-200 rounded-md">
                <h3 className="text-lg font-bold mb-4" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
                  Complete Payment
                </h3>
                <p className="text-sm text-slate-600 mb-4">
                  Total: <strong>$15.00</strong> for W-2 generation
                </p>
                <div>
                  <PayPalButtons
                    createOrder={createOrder}
                    onApprove={onApprove}
                    onError={onError}
                    disabled={isProcessing}
                    style={{ layout: "vertical", color: "gold", shape: "rect", label: "pay" }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <section className="bg-slate-50 border-t border-slate-200 py-16">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-4">
              <HelpCircle className="w-6 h-6 text-green-700" />
            </div>
            <h2 className="text-3xl font-black tracking-tight mb-2" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
              W-2 Form FAQ
            </h2>
            <p className="text-slate-600">Common questions about W-2 forms and our generator</p>
          </div>
          
          <Accordion type="single" collapsible className="space-y-3">
            <AccordionItem value="item-1" className="bg-white border border-slate-200 rounded-lg px-6">
              <AccordionTrigger className="text-left font-semibold text-slate-800 hover:text-green-700">
                What is a W-2 form?
              </AccordionTrigger>
              <AccordionContent className="text-slate-600 pb-4">
                A W-2 form (Wage and Tax Statement) is an IRS tax form that reports an employee's annual wages and the amount of taxes withheld from their paycheck. Employers must send W-2 forms to employees and the IRS by January 31 each year for the previous tax year.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2" className="bg-white border border-slate-200 rounded-lg px-6">
              <AccordionTrigger className="text-left font-semibold text-slate-800 hover:text-green-700">
                What are the boxes on a W-2 form?
              </AccordionTrigger>
              <AccordionContent className="text-slate-600 pb-4">
                Key boxes include: Box 1 (Wages, tips, other compensation), Box 2 (Federal income tax withheld), Box 3 (Social Security wages), Box 4 (Social Security tax withheld), Box 5 (Medicare wages), Box 6 (Medicare tax withheld), Box 12 (Various codes for benefits/deductions), Box 13 (Checkboxes for statutory employee, retirement plan, third-party sick pay), and Boxes 15-20 for state and local tax information.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3" className="bg-white border border-slate-200 rounded-lg px-6">
              <AccordionTrigger className="text-left font-semibold text-slate-800 hover:text-green-700">
                What is Box 12 on the W-2?
              </AccordionTrigger>
              <AccordionContent className="text-slate-600 pb-4">
                Box 12 uses letter codes to report various types of compensation or benefits. Common codes include: Code D (401k contributions), Code DD (Cost of employer-sponsored health coverage), Code E (403b contributions), Code W (Health Savings Account contributions). Our generator supports all standard Box 12 codes.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4" className="bg-white border border-slate-200 rounded-lg px-6">
              <AccordionTrigger className="text-left font-semibold text-slate-800 hover:text-green-700">
                How do I calculate Social Security and Medicare taxes?
              </AccordionTrigger>
              <AccordionContent className="text-slate-600 pb-4">
                Social Security tax is 6.2% of wages up to the annual wage base ($168,600 for 2024). Medicare tax is 1.45% of all wages, with an additional 0.9% for wages over $200,000. Our generator includes an auto-calculate feature that computes these taxes for you based on the wages you enter.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5" className="bg-white border border-slate-200 rounded-lg px-6">
              <AccordionTrigger className="text-left font-semibold text-slate-800 hover:text-green-700">
                Can I generate W-2 forms for previous years?
              </AccordionTrigger>
              <AccordionContent className="text-slate-600 pb-4">
                Yes! Our W-2 generator supports multiple tax years, allowing you to create W-2 forms for the current year and several previous years. Simply select the appropriate tax year from the dropdown menu before generating your form.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-6" className="bg-white border border-slate-200 rounded-lg px-6">
              <AccordionTrigger className="text-left font-semibold text-slate-800 hover:text-green-700">
                What's the difference between Box 1 and Box 3?
              </AccordionTrigger>
              <AccordionContent className="text-slate-600 pb-4">
                Box 1 shows wages subject to federal income tax, while Box 3 shows wages subject to Social Security tax. These amounts can differ because some pre-tax deductions (like 401k contributions) reduce Box 1 but not Box 3, and the Social Security wage base has an annual limit.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-7" className="bg-white border border-slate-200 rounded-lg px-6">
              <AccordionTrigger className="text-left font-semibold text-slate-800 hover:text-green-700">
                Is the W-2 form I generate official?
              </AccordionTrigger>
              <AccordionContent className="text-slate-600 pb-4">
                Our W-2 generator creates professionally formatted documents that match the official IRS W-2 layout. The forms are suitable for record-keeping, tax preparation, and documentation purposes. All information entered must be accurate and truthful.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-8" className="bg-white border border-slate-200 rounded-lg px-6">
              <AccordionTrigger className="text-left font-semibold text-slate-800 hover:text-green-700">
                How quickly will I receive my W-2?
              </AccordionTrigger>
              <AccordionContent className="text-slate-600 pb-4">
                Your W-2 form is generated and downloaded instantly after payment is confirmed. There's no waiting period - you'll have your professional PDF document within seconds of completing your purchase.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      <Footer />
    </div>
  );
}

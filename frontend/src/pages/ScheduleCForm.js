import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { PayPalButtons } from "@paypal/react-paypal-js";
import { generateAndDownloadScheduleC } from "@/utils/scheduleCGenerator";
import { generateScheduleCPreview } from "@/utils/scheduleCPreviewGenerator";
import { 
  formatFullSSN, validateFullSSN,
  formatEIN, validateEIN,
  formatZipCode, validateZipCode
} from "@/utils/validation";

// US States list
const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "DC", "FL", "GA", "HI", "ID", "IL", "IN",
  "IA", "KS", "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH",
  "NJ", "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT",
  "VT", "VA", "WA", "WV", "WI", "WY"
];

// Tax years available (2024, 2023, 2022)
const TAX_YEARS = ["2024", "2023", "2022"];

export default function ScheduleCForm() {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [pdfPreview, setPdfPreview] = useState(null);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [expensesOpen, setExpensesOpen] = useState(true);

  const [selectedTaxYear, setSelectedTaxYear] = useState("2024");

  const [formData, setFormData] = useState({
    // Header info
    proprietorName: "",
    ssn: "",
    
    // Business info (Lines A-F)
    principalBusiness: "",
    businessCode: "",
    businessName: "",
    ein: "",
    businessAddress: "",
    businessCity: "",
    businessState: "",
    businessZip: "",
    
    // Accounting method & questions
    accountingMethod: "cash",
    otherMethodText: "",
    materialParticipation: "yes",
    startedAcquired: false,
    payments1099: "no",
    filed1099: "no",
    
    // Part I - Income
    line1: "", // Gross receipts or sales
    line1Statutory: false,
    line2: "", // Returns and allowances
    line3: "", // Calculated: line1 - line2
    line4: "", // Cost of goods sold
    line5: "", // Calculated: line3 - line4 (Gross profit)
    line6: "", // Other income
    line7: "", // Calculated: line5 + line6 (Gross income)
    
    // Part II - Expenses (Left column)
    line8: "",  // Advertising
    line9: "",  // Car and truck expenses
    line10: "", // Commissions and fees
    line11: "", // Contract labor
    line12: "", // Depreciation
    line13: "", // Employee benefit programs
    line14: "", // Insurance (other than health)
    line15a: "", // Interest - Mortgage
    line15b: "", // Interest - Other
    line16a: "", // Legal and professional services
    line16b: "", // (continuation - using for consistency)
    line17: "", // Office expense
    
    // Part II - Expenses (Right column)
    line18: "", // Pension and profit-sharing
    line19a: "", // Rent - Vehicles/equipment
    line19b: "", // Rent - Other property
    line20: "", // Repairs and maintenance
    line21: "", // Supplies
    line22: "", // Taxes and licenses
    line23a: "", // Travel
    line23b: "", // Deductible meals
    line24: "", // Utilities
    line25: "", // Wages
    line26a: "", // Other expenses
    line26b: "", // Energy efficient buildings deduction
    
    // Totals (calculated)
    line27: "", // Total expenses
    line28: "", // Tentative profit/loss (line7 - line27)
    line29: "", // Expenses for business use of home
    line30: "", // Net profit/loss (line28 - line29)
    line31: "", // Net profit/loss final
    line32: "", // Loss checkbox: 'a' or 'b'
  });

  // Validation errors state
  const [validationErrors, setValidationErrors] = useState({
    ssn: '',
    ein: '',
    businessZip: '',
  });

  // Validated input handlers
  const handleSSNChange = (e) => {
    const formatted = formatFullSSN(e.target.value);
    setFormData(prev => ({ ...prev, ssn: formatted }));
    const validation = validateFullSSN(formatted);
    setValidationErrors(prev => ({ ...prev, ssn: validation.error }));
  };

  const handleEINChange = (e) => {
    const formatted = formatEIN(e.target.value);
    setFormData(prev => ({ ...prev, ein: formatted }));
    const validation = validateEIN(formatted);
    setValidationErrors(prev => ({ ...prev, ein: validation.error }));
  };

  const handleZipChange = (e) => {
    const formatted = formatZipCode(e.target.value);
    setFormData(prev => ({ ...prev, businessZip: formatted }));
    const validation = validateZipCode(formatted);
    setValidationErrors(prev => ({ ...prev, businessZip: validation.error }));
  };

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle checkbox changes
  const handleCheckboxChange = (name, checked) => {
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  // Auto-calculate totals
  const autoCalculate = useCallback(() => {
    const line1 = parseFloat(formData.line1) || 0;
    const line2 = parseFloat(formData.line2) || 0;
    const line4 = parseFloat(formData.line4) || 0;
    const line6 = parseFloat(formData.line6) || 0;
    const line29 = parseFloat(formData.line29) || 0;
    
    // Part I calculations
    const line3 = line1 - line2;
    const line5 = line3 - line4;
    const line7 = line5 + line6;
    
    // Part II - Sum all expenses
    const expenses = [
      formData.line8, formData.line9, formData.line10, formData.line11,
      formData.line12, formData.line13, formData.line14, formData.line15a,
      formData.line15b, formData.line16a, formData.line17, formData.line18,
      formData.line19a, formData.line19b, formData.line20, formData.line21,
      formData.line22, formData.line23a, formData.line23b, formData.line24,
      formData.line25, formData.line26a, formData.line26b
    ].reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
    
    const line27 = expenses;
    const line28 = line7 - line27;
    const line30 = line28 - line29;
    const line31 = line30;
    
    setFormData(prev => ({
      ...prev,
      line3: line3.toFixed(0),
      line5: line5.toFixed(0),
      line7: line7.toFixed(0),
      line27: line27.toFixed(0),
      line28: line28.toFixed(0),
      line30: line30.toFixed(0),
      line31: line31.toFixed(0),
    }));
  }, [formData]);

  // Generate PDF preview when form data changes (debounced)
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (selectedTaxYear) {
        setIsGeneratingPreview(true);
        try {
          const previewUrl = await generateScheduleCPreview(formData, selectedTaxYear);
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
          description: `Schedule C (Form 1040) - Tax Year ${selectedTaxYear}`,
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
      toast.success("Payment successful! Generating your Schedule C...");
      
      await generateAndDownloadScheduleC(formData, selectedTaxYear);
      
      toast.success("Schedule C downloaded successfully!");
      setIsProcessing(false);
    } catch (error) {
      toast.error("Failed to generate Schedule C");
      setIsProcessing(false);
    }
  };

  const onError = (err) => {
    toast.error("Payment failed. Please try again.");
    console.error("PayPal error:", err);
  };

  // Calculate summary preview
  const summary = useMemo(() => {
    const grossReceipts = parseFloat(formData.line1) || 0;
    const grossProfit = parseFloat(formData.line5) || 0;
    const grossIncome = parseFloat(formData.line7) || 0;
    const totalExpenses = parseFloat(formData.line27) || 0;
    const netProfitLoss = parseFloat(formData.line31) || 0;
    
    return { grossReceipts, grossProfit, grossIncome, totalExpenses, netProfitLoss };
  }, [formData]);

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <div className="max-w-7xl mx-auto px-6 py-8">

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
            Schedule C Generator
          </h1>
          <p className="text-slate-600">Generate Schedule C (Form 1040) - Profit or Loss From Business</p>
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
                        {TAX_YEARS.map(year => (
                          <SelectItem key={year} value={year}>{year}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Proprietor Information */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
                  Proprietor Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="proprietorName">Name of Proprietor *</Label>
                    <Input 
                      id="proprietorName" 
                      name="proprietorName" 
                      placeholder="John Smith"
                      value={formData.proprietorName} 
                      onChange={handleChange} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ssn">Social Security Number *</Label>
                    <Input 
                      id="ssn" 
                      name="ssn" 
                      placeholder="XXX-XX-XXXX"
                      value={formData.ssn} 
                      onChange={handleSSNChange}
                      className={validationErrors.ssn ? 'border-red-500' : ''}
                    />
                    {validationErrors.ssn && (
                      <p className="text-xs text-red-500 mt-1">{validationErrors.ssn}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Business Information */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
                  Business Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="principalBusiness">A. Principal business or profession *</Label>
                    <Input 
                      id="principalBusiness" 
                      name="principalBusiness" 
                      placeholder="e.g., Consulting, Freelance Writing"
                      value={formData.principalBusiness} 
                      onChange={handleChange} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="businessCode">B. Business Code (6 digits)</Label>
                    <Input 
                      id="businessCode" 
                      name="businessCode" 
                      placeholder="e.g., 541990"
                      maxLength="6"
                      value={formData.businessCode} 
                      onChange={handleChange} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="businessName">C. Business Name</Label>
                    <Input 
                      id="businessName" 
                      name="businessName" 
                      placeholder="Leave blank if none"
                      value={formData.businessName} 
                      onChange={handleChange} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ein">D. Employer ID Number (EIN)</Label>
                    <Input 
                      id="ein" 
                      name="ein" 
                      placeholder="XX-XXXXXXX"
                      value={formData.ein} 
                      onChange={handleEINChange}
                      className={validationErrors.ein ? 'border-red-500' : ''}
                    />
                    {validationErrors.ein && (
                      <p className="text-xs text-red-500 mt-1">{validationErrors.ein}</p>
                    )}
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="businessAddress">E. Business Address</Label>
                    <Input 
                      id="businessAddress" 
                      name="businessAddress" 
                      placeholder="Street address"
                      value={formData.businessAddress} 
                      onChange={handleChange} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="businessCity">F. City</Label>
                    <Input 
                      id="businessCity" 
                      name="businessCity" 
                      value={formData.businessCity} 
                      onChange={handleChange} 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="businessState">State</Label>
                      <Select value={formData.businessState} onValueChange={(val) => setFormData({...formData, businessState: val})}>
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
                      <Label htmlFor="businessZip">ZIP</Label>
                      <Input 
                        id="businessZip" 
                        name="businessZip" 
                        placeholder="12345"
                        value={formData.businessZip} 
                        onChange={handleZipChange}
                        className={validationErrors.businessZip ? 'border-red-500' : ''}
                      />
                      {validationErrors.businessZip && (
                        <p className="text-xs text-red-500 mt-1">{validationErrors.businessZip}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Accounting Method & Questions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                  <div className="space-y-3">
                    <Label>Accounting Method</Label>
                    <RadioGroup value={formData.accountingMethod} onValueChange={(val) => setFormData({...formData, accountingMethod: val})}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="cash" id="cash" />
                        <Label htmlFor="cash" className="font-normal cursor-pointer">Cash</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="accrual" id="accrual" />
                        <Label htmlFor="accrual" className="font-normal cursor-pointer">Accrual</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="other" id="other" />
                        <Label htmlFor="other" className="font-normal cursor-pointer">Other</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  <div className="space-y-3">
                    <Label>G. Did you materially participate? *</Label>
                    <RadioGroup value={formData.materialParticipation} onValueChange={(val) => setFormData({...formData, materialParticipation: val})}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="yes" id="mp-yes" />
                        <Label htmlFor="mp-yes" className="font-normal cursor-pointer">Yes</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no" id="mp-no" />
                        <Label htmlFor="mp-no" className="font-normal cursor-pointer">No</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>

                <div className="flex items-center space-x-2 pt-2">
                  <Checkbox 
                    id="startedAcquired"
                    checked={formData.startedAcquired}
                    onCheckedChange={(checked) => handleCheckboxChange('startedAcquired', checked)}
                  />
                  <Label htmlFor="startedAcquired" className="text-sm cursor-pointer">
                    H. Started or acquired this business during {selectedTaxYear}
                  </Label>
                </div>
              </div>

              {/* Part I - Income */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
                    Part I - Income
                  </h2>
                  <Button type="button" variant="outline" size="sm" onClick={autoCalculate}>
                    Calculate Totals
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="line1">1. Gross receipts or sales *</Label>
                    <Input 
                      id="line1" 
                      name="line1" 
                      type="number"
                      placeholder="0"
                      value={formData.line1} 
                      onChange={handleChange} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="line2">2. Returns and allowances</Label>
                    <Input 
                      id="line2" 
                      name="line2" 
                      type="number"
                      placeholder="0"
                      value={formData.line2} 
                      onChange={handleChange} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="line3">3. Subtract line 2 from line 1</Label>
                    <Input 
                      id="line3" 
                      name="line3" 
                      type="number"
                      placeholder="Auto-calculated"
                      value={formData.line3} 
                      onChange={handleChange}
                      className="bg-slate-50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="line4">4. Cost of goods sold</Label>
                    <Input 
                      id="line4" 
                      name="line4" 
                      type="number"
                      placeholder="0"
                      value={formData.line4} 
                      onChange={handleChange} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="line5">5. Gross profit (line 3 - line 4)</Label>
                    <Input 
                      id="line5" 
                      name="line5" 
                      type="number"
                      placeholder="Auto-calculated"
                      value={formData.line5} 
                      onChange={handleChange}
                      className="bg-slate-50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="line6">6. Other income</Label>
                    <Input 
                      id="line6" 
                      name="line6" 
                      type="number"
                      placeholder="0"
                      value={formData.line6} 
                      onChange={handleChange} 
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="line7" className="font-bold">7. Gross income (line 5 + line 6)</Label>
                    <Input 
                      id="line7" 
                      name="line7" 
                      type="number"
                      placeholder="Auto-calculated"
                      value={formData.line7} 
                      onChange={handleChange}
                      className="bg-green-50 border-green-300 font-semibold"
                    />
                  </div>
                </div>
              </div>

              {/* Part II - Expenses */}
              <Collapsible open={expensesOpen} onOpenChange={setExpensesOpen}>
                <div className="border rounded-lg overflow-hidden">
                  <CollapsibleTrigger asChild>
                    <button
                      type="button"
                      className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
                    >
                      <div>
                        <h2 className="text-xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
                          Part II - Expenses
                        </h2>
                        <p className="text-xs text-slate-500 mt-1">
                          Enter your business expenses (Lines 8-26)
                        </p>
                      </div>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className={`h-5 w-5 text-slate-500 transition-transform ${expensesOpen ? 'rotate-180' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="p-4 space-y-4 bg-white border-t">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Left column expenses */}
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <Label htmlFor="line8" className="text-sm">8. Advertising</Label>
                            <Input id="line8" name="line8" type="number" placeholder="0" value={formData.line8} onChange={handleChange} className="h-9" />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="line9" className="text-sm">9. Car and truck expenses</Label>
                            <Input id="line9" name="line9" type="number" placeholder="0" value={formData.line9} onChange={handleChange} className="h-9" />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="line10" className="text-sm">10. Commissions and fees</Label>
                            <Input id="line10" name="line10" type="number" placeholder="0" value={formData.line10} onChange={handleChange} className="h-9" />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="line11" className="text-sm">11. Contract labor</Label>
                            <Input id="line11" name="line11" type="number" placeholder="0" value={formData.line11} onChange={handleChange} className="h-9" />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="line12" className="text-sm">12. Depreciation and section 179</Label>
                            <Input id="line12" name="line12" type="number" placeholder="0" value={formData.line12} onChange={handleChange} className="h-9" />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="line13" className="text-sm">13. Employee benefit programs</Label>
                            <Input id="line13" name="line13" type="number" placeholder="0" value={formData.line13} onChange={handleChange} className="h-9" />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="line14" className="text-sm">14. Insurance (other than health)</Label>
                            <Input id="line14" name="line14" type="number" placeholder="0" value={formData.line14} onChange={handleChange} className="h-9" />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="line15a" className="text-sm">15a. Interest - Mortgage</Label>
                            <Input id="line15a" name="line15a" type="number" placeholder="0" value={formData.line15a} onChange={handleChange} className="h-9" />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="line15b" className="text-sm">15b. Interest - Other</Label>
                            <Input id="line15b" name="line15b" type="number" placeholder="0" value={formData.line15b} onChange={handleChange} className="h-9" />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="line16a" className="text-sm">16. Legal and professional services</Label>
                            <Input id="line16a" name="line16a" type="number" placeholder="0" value={formData.line16a} onChange={handleChange} className="h-9" />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="line17" className="text-sm">17. Office expense</Label>
                            <Input id="line17" name="line17" type="number" placeholder="0" value={formData.line17} onChange={handleChange} className="h-9" />
                          </div>
                        </div>
                        
                        {/* Right column expenses */}
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <Label htmlFor="line18" className="text-sm">18. Pension and profit-sharing</Label>
                            <Input id="line18" name="line18" type="number" placeholder="0" value={formData.line18} onChange={handleChange} className="h-9" />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="line19a" className="text-sm">19a. Rent - Vehicles/equipment</Label>
                            <Input id="line19a" name="line19a" type="number" placeholder="0" value={formData.line19a} onChange={handleChange} className="h-9" />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="line19b" className="text-sm">19b. Rent - Other property</Label>
                            <Input id="line19b" name="line19b" type="number" placeholder="0" value={formData.line19b} onChange={handleChange} className="h-9" />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="line20" className="text-sm">20. Repairs and maintenance</Label>
                            <Input id="line20" name="line20" type="number" placeholder="0" value={formData.line20} onChange={handleChange} className="h-9" />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="line21" className="text-sm">21. Supplies</Label>
                            <Input id="line21" name="line21" type="number" placeholder="0" value={formData.line21} onChange={handleChange} className="h-9" />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="line22" className="text-sm">22. Taxes and licenses</Label>
                            <Input id="line22" name="line22" type="number" placeholder="0" value={formData.line22} onChange={handleChange} className="h-9" />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="line23a" className="text-sm">23a. Travel</Label>
                            <Input id="line23a" name="line23a" type="number" placeholder="0" value={formData.line23a} onChange={handleChange} className="h-9" />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="line23b" className="text-sm">23b. Deductible meals</Label>
                            <Input id="line23b" name="line23b" type="number" placeholder="0" value={formData.line23b} onChange={handleChange} className="h-9" />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="line24" className="text-sm">24. Utilities</Label>
                            <Input id="line24" name="line24" type="number" placeholder="0" value={formData.line24} onChange={handleChange} className="h-9" />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="line25" className="text-sm">25. Wages</Label>
                            <Input id="line25" name="line25" type="number" placeholder="0" value={formData.line25} onChange={handleChange} className="h-9" />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="line26a" className="text-sm">26a. Other expenses</Label>
                            <Input id="line26a" name="line26a" type="number" placeholder="0" value={formData.line26a} onChange={handleChange} className="h-9" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>

              {/* Totals Section */}
              <div className="space-y-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="text-lg font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
                  Totals
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="line27">27. Total expenses</Label>
                    <Input 
                      id="line27" 
                      name="line27" 
                      type="number"
                      placeholder="Auto-calculated"
                      value={formData.line27} 
                      onChange={handleChange}
                      className="bg-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="line28">28. Tentative profit (loss)</Label>
                    <Input 
                      id="line28" 
                      name="line28" 
                      type="number"
                      placeholder="Auto-calculated"
                      value={formData.line28} 
                      onChange={handleChange}
                      className="bg-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="line29">29. Business use of home expenses</Label>
                    <Input 
                      id="line29" 
                      name="line29" 
                      type="number"
                      placeholder="0"
                      value={formData.line29} 
                      onChange={handleChange}
                      className="bg-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="line31" className="font-bold">31. Net profit or (loss)</Label>
                    <Input 
                      id="line31" 
                      name="line31" 
                      type="number"
                      placeholder="Auto-calculated"
                      value={formData.line31} 
                      onChange={handleChange}
                      className={`font-bold ${parseFloat(formData.line31) >= 0 ? 'bg-green-100 border-green-400' : 'bg-red-100 border-red-400'}`}
                    />
                  </div>
                </div>

                {/* Loss checkbox (only show if loss) */}
                {parseFloat(formData.line31) < 0 && (
                  <div className="pt-4 border-t border-green-300">
                    <Label className="text-sm font-semibold">32. If you have a loss, check the box that describes your investment:</Label>
                    <RadioGroup value={formData.line32} onValueChange={(val) => setFormData({...formData, line32: val})} className="mt-2">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="a" id="line32a" />
                        <Label htmlFor="line32a" className="font-normal cursor-pointer text-sm">
                          a. All investment is at risk
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="b" id="line32b" />
                        <Label htmlFor="line32b" className="font-normal cursor-pointer text-sm">
                          b. Some investment is not at risk
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                )}
              </div>

            </form>
          </div>

          {/* Right: Preview and PayPal */}
          <div className="lg:col-span-5">
            <div className="sticky top-24 space-y-6">
              
              {/* Summary Preview */}
              <div className="p-6 bg-green-50 border-2 border-green-200 rounded-md">
                <h3 className="text-xl font-bold mb-4" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
                  Schedule C Summary - {selectedTaxYear}
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-700">Gross Receipts (Line 1):</span>
                    <span className="font-bold">${summary.grossReceipts.toLocaleString('en-US')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-700">Gross Profit (Line 5):</span>
                    <span>${summary.grossProfit.toLocaleString('en-US')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-700">Gross Income (Line 7):</span>
                    <span>${summary.grossIncome.toLocaleString('en-US')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-700">Total Expenses (Line 27):</span>
                    <span className="text-red-600">-${summary.totalExpenses.toLocaleString('en-US')}</span>
                  </div>
                  <div className="border-t border-green-300 pt-2 mt-2">
                    <div className={`flex justify-between ${summary.netProfitLoss >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                      <span className="font-bold">Net Profit/Loss (Line 31):</span>
                      <span className="font-bold">
                        {summary.netProfitLoss >= 0 ? '' : '('}${Math.abs(summary.netProfitLoss).toLocaleString('en-US')}{summary.netProfitLoss < 0 ? ')' : ''}
                      </span>
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
                            alt="Schedule C Preview"
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
                        <DialogTitle>Schedule C Preview - Tax Year {selectedTaxYear}</DialogTitle>
                      </DialogHeader>
                      <div className="relative flex-1 h-full overflow-auto p-4">
                        <img src={pdfPreview} alt="Schedule C Preview Full" className="w-full h-auto" />
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
                  Total: <strong>$15.00</strong> for Schedule C generation
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
              Schedule C Form FAQ
            </h2>
            <p className="text-slate-600">Common questions about Schedule C forms and our generator</p>
          </div>
          
          <Accordion type="single" collapsible className="space-y-3">
            <AccordionItem value="item-1" className="bg-white border border-slate-200 rounded-lg px-6">
              <AccordionTrigger className="text-left font-semibold text-slate-800 hover:text-green-700">
                What is Schedule C?
              </AccordionTrigger>
              <AccordionContent className="text-slate-600 pb-4">
                Schedule C (Form 1040) is used to report profit or loss from a business you operated as a sole proprietor. It's filed with your personal tax return and calculates your net business income or loss, which is then reported on your Form 1040.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2" className="bg-white border border-slate-200 rounded-lg px-6">
              <AccordionTrigger className="text-left font-semibold text-slate-800 hover:text-green-700">
                Who needs to file Schedule C?
              </AccordionTrigger>
              <AccordionContent className="text-slate-600 pb-4">
                You need to file Schedule C if you operate a business as a sole proprietor, are a single-member LLC (not treated as a corporation), are an independent contractor who received 1099-NEC income, or have self-employment income from freelancing or gig work.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3" className="bg-white border border-slate-200 rounded-lg px-6">
              <AccordionTrigger className="text-left font-semibold text-slate-800 hover:text-green-700">
                What business expenses can I deduct?
              </AccordionTrigger>
              <AccordionContent className="text-slate-600 pb-4">
                Common deductible expenses include: advertising, car/truck expenses, contract labor, insurance, legal/professional services, office expenses, rent, repairs, supplies, travel, meals (50%), utilities, and wages. Our generator includes fields for all standard expense categories.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4" className="bg-white border border-slate-200 rounded-lg px-6">
              <AccordionTrigger className="text-left font-semibold text-slate-800 hover:text-green-700">
                What is gross receipts vs net profit?
              </AccordionTrigger>
              <AccordionContent className="text-slate-600 pb-4">
                Gross receipts is your total business income before any deductions. Net profit is what remains after subtracting all allowable business expenses from your gross receipts. Your net profit is subject to both income tax and self-employment tax.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5" className="bg-white border border-slate-200 rounded-lg px-6">
              <AccordionTrigger className="text-left font-semibold text-slate-800 hover:text-green-700">
                What is the home office deduction?
              </AccordionTrigger>
              <AccordionContent className="text-slate-600 pb-4">
                If you use part of your home exclusively and regularly for business, you may deduct home office expenses. You can use the simplified method ($5 per square foot, up to 300 sq ft) or the regular method (actual expenses based on percentage of home used).
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-6" className="bg-white border border-slate-200 rounded-lg px-6">
              <AccordionTrigger className="text-left font-semibold text-slate-800 hover:text-green-700">
                Do I need an EIN or can I use my SSN?
              </AccordionTrigger>
              <AccordionContent className="text-slate-600 pb-4">
                If you're a sole proprietor with no employees, you can use your Social Security Number. However, if you have employees, pay excise taxes, or have a Keogh plan, you need an EIN. Many sole proprietors get an EIN anyway to protect their SSN.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-7" className="bg-white border border-slate-200 rounded-lg px-6">
              <AccordionTrigger className="text-left font-semibold text-slate-800 hover:text-green-700">
                What accounting method should I use?
              </AccordionTrigger>
              <AccordionContent className="text-slate-600 pb-4">
                Most small businesses use cash basis accounting, where income is recorded when received and expenses when paid. Accrual accounting records income when earned and expenses when incurred. Once you choose a method, you generally must stick with it.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-8" className="bg-white border border-slate-200 rounded-lg px-6">
              <AccordionTrigger className="text-left font-semibold text-slate-800 hover:text-green-700">
                Can I generate Schedule C for previous years?
              </AccordionTrigger>
              <AccordionContent className="text-slate-600 pb-4">
                Yes! Our Schedule C generator supports multiple tax years. Select the appropriate tax year from the dropdown menu to generate forms for the current year or prior years as needed for your records.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      <Footer />
    </div>
  );
}

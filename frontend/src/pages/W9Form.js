import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";
import { toast } from "sonner";
import { PayPalButtons } from "@paypal/react-paypal-js";
import { generateAndDownloadW9 } from "@/utils/w9Generator";
import { generateW9Preview } from "@/utils/w9PreviewGenerator";
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

// Federal tax classification options
const TAX_CLASSIFICATIONS = [
  { value: "individual", label: "Individual/sole proprietor or single-member LLC" },
  { value: "ccorp", label: "C Corporation" },
  { value: "scorp", label: "S Corporation" },
  { value: "partnership", label: "Partnership" },
  { value: "trust", label: "Trust/estate" },
  { value: "llc", label: "Limited liability company" },
  { value: "other", label: "Other" }
];

// LLC tax classification options
const LLC_TAX_CODES = [
  { value: "C", label: "C - C corporation" },
  { value: "S", label: "S - S corporation" },
  { value: "P", label: "P - Partnership" }
];

// Available tax years
const TAX_YEARS = ["2024", "2023", "2022", "2021"];

export default function W9Form() {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [pdfPreview, setPdfPreview] = useState(null);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [selectedTaxYear, setSelectedTaxYear] = useState("2024");

  const [formData, setFormData] = useState({
    // Line 1 - Name
    name: "",
    
    // Line 2 - Business name
    businessName: "",
    
    // Line 3 - Federal tax classification
    taxClassification: "individual",
    llcTaxCode: "",
    otherClassification: "",
    
    // Exemptions
    exemptPayeeCode: "",
    fatcaCode: "",
    
    // Address
    address: "",
    city: "",
    state: "",
    zipCode: "",
    
    // Account numbers (optional)
    accountNumbers: "",
    
    // Part I - TIN
    tinType: "ssn", // ssn or ein
    ssn: "",
    ein: "",
    
    // Part II - Certification
    signatureDate: new Date().toISOString().split('T')[0]
  });

  // Validation errors state
  const [validationErrors, setValidationErrors] = useState({
    ssn: '',
    ein: '',
    zipCode: ''
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
    setFormData(prev => ({ ...prev, zipCode: formatted }));
    const validation = validateZipCode(formatted);
    setValidationErrors(prev => ({ ...prev, zipCode: validation.error }));
  };

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Generate PDF preview when form data changes (debounced)
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (selectedTaxYear) {
        setIsGeneratingPreview(true);
        try {
          const previewUrl = await generateW9Preview(formData, selectedTaxYear);
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
          description: `W-9 Form - ${selectedTaxYear}`,
          amount: {
            value: "9.99",
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
      const orderData = await actions.order.capture();
      const orderId = orderData.id || `W9-${Date.now()}`;
      toast.success("Payment successful! Generating your W-9...");
      
      await generateAndDownloadW9(formData, selectedTaxYear);
      
      toast.success("W-9 downloaded successfully!");
      setIsProcessing(false);
      
      // Redirect to payment success page
      navigate(`/payment-success?type=w9&order_id=${orderId}&count=1`);
    } catch (error) {
      toast.error("Failed to generate W-9");
      setIsProcessing(false);
    }
  };

  const onError = (err) => {
    toast.error("Payment failed. Please try again.");
    console.error("PayPal error:", err);
  };

  // Get TIN display value
  const tinDisplay = useMemo(() => {
    if (formData.tinType === "ssn") {
      return formData.ssn || "XXX-XX-XXXX";
    }
    return formData.ein || "XX-XXXXXXX";
  }, [formData.tinType, formData.ssn, formData.ein]);

  // Get tax classification label
  const taxClassificationLabel = useMemo(() => {
    const found = TAX_CLASSIFICATIONS.find(t => t.value === formData.taxClassification);
    if (formData.taxClassification === "llc" && formData.llcTaxCode) {
      return `${found?.label} (${formData.llcTaxCode})`;
    }
    if (formData.taxClassification === "other" && formData.otherClassification) {
      return `Other: ${formData.otherClassification}`;
    }
    return found?.label || "";
  }, [formData.taxClassification, formData.llcTaxCode, formData.otherClassification]);

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <div className="max-w-7xl mx-auto px-6 py-8">

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
            W-9 Generator
          </h1>
          <p className="text-slate-600">Generate Request for Taxpayer Identification Number and Certification</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: Form */}
          <div className="lg:col-span-7">
            <form className="space-y-8 bg-white p-8 rounded-lg shadow-sm border border-slate-200">
              
              {/* Tax Year Selection */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
                  Form Year
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="taxYear">Select Form Year *</Label>
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

              {/* Name Information */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
                  Name Information
                </h2>
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Line 1 - Name (as shown on your income tax return) *</Label>
                    <Input 
                      id="name" 
                      name="name" 
                      placeholder="Enter your name"
                      value={formData.name} 
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="businessName">Line 2 - Business name/disregarded entity name (if different)</Label>
                    <Input 
                      id="businessName" 
                      name="businessName" 
                      placeholder="Enter business name (optional)"
                      value={formData.businessName} 
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              {/* Federal Tax Classification */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
                  Line 3 - Federal Tax Classification
                </h2>
                <RadioGroup 
                  value={formData.taxClassification} 
                  onValueChange={(val) => setFormData({...formData, taxClassification: val, llcTaxCode: '', otherClassification: ''})}
                  className="grid grid-cols-1 gap-3"
                >
                  {TAX_CLASSIFICATIONS.map(item => (
                    <div key={item.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={item.value} id={item.value} />
                      <Label htmlFor={item.value} className="cursor-pointer">{item.label}</Label>
                    </div>
                  ))}
                </RadioGroup>
                
                {/* LLC Tax Code Selection */}
                {formData.taxClassification === "llc" && (
                  <div className="ml-6 space-y-2">
                    <Label>Enter the tax classification (C=C corporation, S=S corporation, P=Partnership)</Label>
                    <Select value={formData.llcTaxCode} onValueChange={(val) => setFormData({...formData, llcTaxCode: val})}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Select code" />
                      </SelectTrigger>
                      <SelectContent>
                        {LLC_TAX_CODES.map(item => (
                          <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                {/* Other Classification */}
                {formData.taxClassification === "other" && (
                  <div className="ml-6 space-y-2">
                    <Label htmlFor="otherClassification">Specify classification</Label>
                    <Input 
                      id="otherClassification" 
                      name="otherClassification" 
                      placeholder="Enter classification"
                      value={formData.otherClassification} 
                      onChange={handleChange}
                      className="w-64"
                    />
                  </div>
                )}
              </div>

              {/* Exemptions */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
                  Exemptions
                </h2>
                <p className="text-sm text-slate-500">(codes apply only to certain entities, not individuals)</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="exemptPayeeCode">Exempt payee code (if any)</Label>
                    <Input 
                      id="exemptPayeeCode" 
                      name="exemptPayeeCode" 
                      placeholder="Enter code"
                      value={formData.exemptPayeeCode} 
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fatcaCode">Exemption from FATCA reporting code (if any)</Label>
                    <Input 
                      id="fatcaCode" 
                      name="fatcaCode" 
                      placeholder="Enter code"
                      value={formData.fatcaCode} 
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              {/* Address Information */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
                  Address
                </h2>
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="address">Line 5 - Address (number, street, and apt. or suite no.) *</Label>
                    <Input 
                      id="address" 
                      name="address" 
                      placeholder="Enter street address"
                      value={formData.address} 
                      onChange={handleChange}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">Line 6 - City *</Label>
                      <Input 
                        id="city" 
                        name="city" 
                        placeholder="City"
                        value={formData.city} 
                        onChange={handleChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State *</Label>
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
                    <div className="space-y-2">
                      <Label htmlFor="zipCode">ZIP Code *</Label>
                      <Input 
                        id="zipCode" 
                        name="zipCode" 
                        placeholder="12345"
                        value={formData.zipCode} 
                        onChange={handleZipChange}
                        className={validationErrors.zipCode ? 'border-red-500' : ''}
                      />
                      {validationErrors.zipCode && (
                        <p className="text-xs text-red-500 mt-1">{validationErrors.zipCode}</p>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accountNumbers">Line 7 - Account number(s) (optional)</Label>
                    <Input 
                      id="accountNumbers" 
                      name="accountNumbers" 
                      placeholder="Enter account numbers if applicable"
                      value={formData.accountNumbers} 
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              {/* Part I - TIN */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
                  Part I - Taxpayer Identification Number (TIN)
                </h2>
                <div className="space-y-4">
                  <RadioGroup 
                    value={formData.tinType} 
                    onValueChange={(val) => setFormData({...formData, tinType: val})}
                    className="flex gap-6"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="ssn" id="tin-ssn" />
                      <Label htmlFor="tin-ssn" className="cursor-pointer">Social Security Number (SSN)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="ein" id="tin-ein" />
                      <Label htmlFor="tin-ein" className="cursor-pointer">Employer Identification Number (EIN)</Label>
                    </div>
                  </RadioGroup>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {formData.tinType === "ssn" ? (
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
                    ) : (
                      <div className="space-y-2">
                        <Label htmlFor="ein">Employer Identification Number *</Label>
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
                    )}
                  </div>
                </div>
              </div>

              {/* Part II - Certification */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
                  Part II - Certification
                </h2>
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <p className="text-sm text-slate-600 mb-4">
                    Under penalties of perjury, I certify that:
                  </p>
                  <ul className="text-sm text-slate-600 space-y-2 list-decimal ml-4">
                    <li>The number shown on this form is my correct taxpayer identification number, and</li>
                    <li>I am not subject to backup withholding because: (a) I am exempt from backup withholding, or (b) I have not been notified by the IRS that I am subject to backup withholding, or (c) I have been notified by the IRS that I am no longer subject to backup withholding, and</li>
                    <li>I am a U.S. citizen or other U.S. person, and</li>
                    <li>The FATCA code(s) entered on this form (if any) indicating that I am exempt from FATCA reporting is correct.</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signatureDate">Date</Label>
                  <Input 
                    id="signatureDate" 
                    name="signatureDate" 
                    type="date"
                    value={formData.signatureDate} 
                    onChange={handleChange}
                    className="w-48"
                  />
                </div>
              </div>

            </form>
          </div>

          {/* Right: Preview and PayPal */}
          <div className="lg:col-span-5">
            <div className="sticky top-24 space-y-6">
              
              {/* Summary Preview */}
              <div className="p-6 bg-green-50 border-2 border-green-200 rounded-md">
                <h3 className="text-xl font-bold mb-4" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
                  W-9 Summary - {selectedTaxYear}
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-700">Name:</span>
                    <span className="font-medium text-slate-900">{formData.name || "—"}</span>
                  </div>
                  {formData.businessName && (
                    <div className="flex justify-between">
                      <span className="text-slate-700">Business Name:</span>
                      <span className="font-medium text-slate-900">{formData.businessName}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-700">Tax Classification:</span>
                    <span className="font-medium text-slate-900 text-right max-w-[180px]">{taxClassificationLabel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-700">TIN ({formData.tinType.toUpperCase()}):</span>
                    <span className="font-medium text-slate-900">{tinDisplay}</span>
                  </div>
                  <div className="border-t border-green-300 my-2"></div>
                  <div className="flex justify-between">
                    <span className="text-slate-700">Address:</span>
                    <span className="font-medium text-slate-900 text-right max-w-[180px]">
                      {formData.address ? `${formData.address}, ${formData.city}, ${formData.state} ${formData.zipCode}` : "—"}
                    </span>
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
                            alt="W-9 Preview"
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
                        <DialogTitle>W-9 Preview - {selectedTaxYear}</DialogTitle>
                      </DialogHeader>
                      <div className="relative flex-1 h-full overflow-auto p-4">
                        <img src={pdfPreview} alt="W-9 Preview Full" className="w-full h-auto" />
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

              {/* Payment Section */}
              <div className="p-6 bg-white rounded-lg border border-slate-200">
                <div className="text-center mb-4">
                  <p className="text-3xl font-black" style={{ color: '#1a4731' }}>$9.99</p>
                  <p className="text-sm text-slate-500">One-time payment</p>
                </div>
                
                {isProcessing ? (
                  <div className="text-center py-4">
                    <svg className="animate-spin h-8 w-8 mx-auto text-green-700" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="mt-2 text-slate-600">Processing your document...</p>
                  </div>
                ) : (
                  <PayPalButtons
                    style={{ layout: "vertical", color: "gold", shape: "rect" }}
                    createOrder={createOrder}
                    onApprove={onApprove}
                    onError={onError}
                  />
                )}
                
                <p className="text-xs text-slate-500 text-center mt-4">
                  Secure payment via PayPal. Your W-9 will download immediately after payment.
                </p>
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
              W-9 Form FAQ
            </h2>
            <p className="text-slate-600">Common questions about W-9 forms and our generator</p>
          </div>
          
          <Accordion type="single" collapsible className="space-y-3">
            <AccordionItem value="item-1" className="bg-white border border-slate-200 rounded-lg px-6">
              <AccordionTrigger className="text-left font-semibold text-slate-800 hover:text-green-700">
                What is a W-9 form?
              </AccordionTrigger>
              <AccordionContent className="text-slate-600 pb-4">
                A W-9 form (Request for Taxpayer Identification Number and Certification) is an IRS form used to provide your correct taxpayer identification number (TIN) to a person or entity who is required to file information returns with the IRS. It's commonly used by independent contractors and freelancers.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2" className="bg-white border border-slate-200 rounded-lg px-6">
              <AccordionTrigger className="text-left font-semibold text-slate-800 hover:text-green-700">
                Who needs to fill out a W-9?
              </AccordionTrigger>
              <AccordionContent className="text-slate-600 pb-4">
                You typically need to fill out a W-9 if you're an independent contractor, freelancer, self-employed individual, or business receiving payments from another business. Clients use the information to report payments made to you to the IRS via Form 1099.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3" className="bg-white border border-slate-200 rounded-lg px-6">
              <AccordionTrigger className="text-left font-semibold text-slate-800 hover:text-green-700">
                Should I use my SSN or EIN on the W-9?
              </AccordionTrigger>
              <AccordionContent className="text-slate-600 pb-4">
                If you're a sole proprietor or single-member LLC, you can use either your SSN or EIN. If you have an EIN, it's generally recommended to use it for business purposes to protect your personal SSN. Corporations and partnerships must use their EIN.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4" className="bg-white border border-slate-200 rounded-lg px-6">
              <AccordionTrigger className="text-left font-semibold text-slate-800 hover:text-green-700">
                What are the federal tax classifications?
              </AccordionTrigger>
              <AccordionContent className="text-slate-600 pb-4">
                The W-9 includes several tax classifications: Individual/Sole Proprietor, C Corporation, S Corporation, Partnership, Trust/Estate, Limited Liability Company (LLC), and Exempt Payee. Your classification affects how your income is taxed and reported.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5" className="bg-white border border-slate-200 rounded-lg px-6">
              <AccordionTrigger className="text-left font-semibold text-slate-800 hover:text-green-700">
                What is backup withholding?
              </AccordionTrigger>
              <AccordionContent className="text-slate-600 pb-4">
                Backup withholding is when payers withhold 24% of your payments and send it to the IRS. This happens if you don't provide a valid TIN or if the IRS notifies the payer that you're subject to backup withholding. Properly completing your W-9 helps avoid this.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-6" className="bg-white border border-slate-200 rounded-lg px-6">
              <AccordionTrigger className="text-left font-semibold text-slate-800 hover:text-green-700">
                Do I need to sign the W-9?
              </AccordionTrigger>
              <AccordionContent className="text-slate-600 pb-4">
                Yes, the W-9 requires a signature certifying that the information provided is correct. Our generator creates a complete W-9 form ready for your signature. You can sign it electronically or print and sign manually.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-7" className="bg-white border border-slate-200 rounded-lg px-6">
              <AccordionTrigger className="text-left font-semibold text-slate-800 hover:text-green-700">
                How often do I need to submit a new W-9?
              </AccordionTrigger>
              <AccordionContent className="text-slate-600 pb-4">
                You generally only need to submit a new W-9 when your information changes (name, address, TIN, or tax classification). Unlike W-2s, W-9s don't need to be submitted annually. Requesters may ask for an updated W-9 periodically for their records.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-8" className="bg-white border border-slate-200 rounded-lg px-6">
              <AccordionTrigger className="text-left font-semibold text-slate-800 hover:text-green-700">
                Is my W-9 information secure?
              </AccordionTrigger>
              <AccordionContent className="text-slate-600 pb-4">
                Absolutely! Our W-9 generator processes all information directly in your browser. We do not store your SSN, EIN, or any personal information on our servers. Your data stays private and secure on your device.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      <Footer />
    </div>
  );
}

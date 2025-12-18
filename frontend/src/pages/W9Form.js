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
            value: "10.00",
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
      toast.success("Payment successful! Generating your W-9...");
      
      await generateAndDownloadW9(formData, selectedTaxYear);
      
      toast.success("W-9 downloaded successfully!");
      setIsProcessing(false);
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
        {/* Back button */}
        <Button 
          variant="ghost" 
          onClick={() => navigate("/")}
          className="mb-4 text-green-800 hover:text-green-900 hover:bg-green-50"
        >
          ← Back to Home
        </Button>

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

              {/* PDF Preview */}
              <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                  <h3 className="font-semibold text-slate-700">PDF Preview</h3>
                  <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" disabled={!pdfPreview}>
                        Expand Preview
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl h-[90vh]">
                      <DialogHeader>
                        <DialogTitle>W-9 Preview - {selectedTaxYear}</DialogTitle>
                      </DialogHeader>
                      <div className="flex-1 h-full">
                        {pdfPreview && (
                          <iframe
                            src={pdfPreview}
                            className="w-full h-[calc(90vh-80px)] border-0"
                            title="W-9 Preview Full"
                          />
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                <div className="h-80 bg-slate-100 flex items-center justify-center">
                  {isGeneratingPreview ? (
                    <div className="text-slate-500 flex items-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating preview...
                    </div>
                  ) : pdfPreview ? (
                    <iframe
                      src={pdfPreview}
                      className="w-full h-full border-0"
                      title="W-9 Preview"
                    />
                  ) : (
                    <p className="text-slate-500">Preview will appear here</p>
                  )}
                </div>
              </div>

              {/* Payment Section */}
              <div className="p-6 bg-white rounded-lg border border-slate-200">
                <div className="text-center mb-4">
                  <p className="text-3xl font-black" style={{ color: '#1a4731' }}>$10.00</p>
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
      <Footer />
    </div>
  );
}

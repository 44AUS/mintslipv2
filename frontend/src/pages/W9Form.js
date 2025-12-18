import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { PayPalButtons } from "@paypal/react-paypal-js";
import { generateAndDownloadW9, TAX_CLASSIFICATIONS, LLC_TAX_CLASSIFICATIONS } from "@/utils/w9Generator";
import { generateW9Preview } from "@/utils/w9PreviewGenerator";
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

// Tax years available (2021-2024)
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
    
    // Line 3 - Tax classification
    taxClassification: "individual",
    llcClassification: "",
    otherDescription: "",
    
    // Line 3b - Foreign partner
    isForeignPartner: false,
    
    // Line 4 - Exemptions
    exemptPayeeCode: "",
    fatcaCode: "",
    
    // Line 5 - Address
    address: "",
    apt: "",
    
    // Line 6 - City, state, ZIP
    city: "",
    state: "",
    zip: "",
    
    // Line 7 - Account numbers
    accountNumbers: "",
    
    // Requester info
    requesterName: "",
    
    // Part I - TIN
    tinType: "ssn",
    ssn: "",
    ein: "",
    
    // Part II - Certification
    signature: "",
    signatureDate: new Date().toLocaleDateString('en-US'),
  });

  // Validation errors state
  const [validationErrors, setValidationErrors] = useState({
    ssn: '',
    ein: '',
    zip: '',
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
    setFormData(prev => ({ ...prev, zip: formatted }));
    const validation = validateZipCode(formatted);
    setValidationErrors(prev => ({ ...prev, zip: validation.error }));
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

  // Form summary
  const summary = useMemo(() => {
    const classification = TAX_CLASSIFICATIONS.find(t => t.value === formData.taxClassification);
    return {
      name: formData.name || "Not provided",
      businessName: formData.businessName || "N/A",
      classification: classification ? classification.label : "Not selected",
      tin: formData.tinType === 'ssn' 
        ? (formData.ssn ? `SSN: ***-**-${formData.ssn.slice(-4)}` : "Not provided")
        : (formData.ein ? `EIN: ${formData.ein}` : "Not provided"),
    };
  }, [formData]);

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

              {/* Line 1 - Name */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
                  Taxpayer Information
                </h2>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Line 1: Name (as shown on your income tax return) *</Label>
                    <Input 
                      id="name" 
                      name="name" 
                      placeholder="Enter your full legal name"
                      value={formData.name} 
                      onChange={handleChange} 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="businessName">Line 2: Business name/disregarded entity name (if different from above)</Label>
                    <Input 
                      id="businessName" 
                      name="businessName" 
                      placeholder="Enter business name if applicable"
                      value={formData.businessName} 
                      onChange={handleChange} 
                    />
                  </div>
                </div>
              </div>

              {/* Line 3 - Tax Classification */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
                  Federal Tax Classification
                </h2>
                <div className="space-y-4">
                  <Label>Line 3: Check appropriate box for federal tax classification *</Label>
                  <RadioGroup 
                    value={formData.taxClassification} 
                    onValueChange={(value) => setFormData({...formData, taxClassification: value})}
                    className="grid grid-cols-1 md:grid-cols-2 gap-3"
                  >
                    {TAX_CLASSIFICATIONS.map((option) => (
                      <div key={option.value} className="flex items-center space-x-2">
                        <RadioGroupItem value={option.value} id={option.value} />
                        <Label htmlFor={option.value} className="text-sm cursor-pointer">{option.label}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                  
                  {/* LLC Classification */}
                  {formData.taxClassification === 'llc' && (
                    <div className="space-y-2 ml-6 p-4 bg-slate-50 rounded-md">
                      <Label htmlFor="llcClassification">LLC Tax Classification *</Label>
                      <Select 
                        value={formData.llcClassification} 
                        onValueChange={(val) => setFormData({...formData, llcClassification: val})}
                      >
                        <SelectTrigger className="w-full max-w-xs">
                          <SelectValue placeholder="Select classification" />
                        </SelectTrigger>
                        <SelectContent>
                          {LLC_TAX_CLASSIFICATIONS.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  
                  {/* Other Description */}
                  {formData.taxClassification === 'other' && (
                    <div className="space-y-2 ml-6">
                      <Label htmlFor="otherDescription">Specify *</Label>
                      <Input 
                        id="otherDescription" 
                        name="otherDescription" 
                        placeholder="Enter description"
                        value={formData.otherDescription} 
                        onChange={handleChange} 
                      />
                    </div>
                  )}
                </div>
                
                {/* Line 3b - Foreign partner */}
                <div className="flex items-center space-x-2 pt-2">
                  <Checkbox 
                    id="isForeignPartner"
                    checked={formData.isForeignPartner}
                    onCheckedChange={(checked) => handleCheckboxChange('isForeignPartner', checked)}
                  />
                  <Label htmlFor="isForeignPartner" className="text-sm cursor-pointer">
                    Line 3b: Check if you are a foreign partner, owner, or beneficiary (partnerships only)
                  </Label>
                </div>
              </div>

              {/* Line 4 - Exemptions */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
                  Exemptions
                </h2>
                <p className="text-sm text-slate-500">If applicable, enter exemption codes (see instructions)</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="exemptPayeeCode">Exempt payee code (if any)</Label>
                    <Input 
                      id="exemptPayeeCode" 
                      name="exemptPayeeCode" 
                      placeholder="e.g., 1, 2, 3..."
                      value={formData.exemptPayeeCode} 
                      onChange={handleChange} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fatcaCode">Exemption from FATCA reporting code (if any)</Label>
                    <Input 
                      id="fatcaCode" 
                      name="fatcaCode" 
                      placeholder="e.g., A, B, C..."
                      value={formData.fatcaCode} 
                      onChange={handleChange} 
                    />
                  </div>
                </div>
              </div>

              {/* Lines 5-6 - Address */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
                  Address
                </h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-2 md:col-span-3">
                      <Label htmlFor="address">Line 5: Address (number, street) *</Label>
                      <Input 
                        id="address" 
                        name="address" 
                        placeholder="123 Main Street"
                        value={formData.address} 
                        onChange={handleChange} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="apt">Apt/Suite</Label>
                      <Input 
                        id="apt" 
                        name="apt" 
                        placeholder="Apt 4B"
                        value={formData.apt} 
                        onChange={handleChange} 
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">Line 6: City *</Label>
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
                      <Label htmlFor="zip">ZIP Code *</Label>
                      <Input 
                        id="zip" 
                        name="zip" 
                        placeholder="12345"
                        value={formData.zip} 
                        onChange={handleZipChange}
                        className={validationErrors.zip ? 'border-red-500' : ''}
                      />
                      {validationErrors.zip && (
                        <p className="text-xs text-red-500 mt-1">{validationErrors.zip}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Line 7 - Account numbers */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="accountNumbers">Line 7: List account number(s) here (optional)</Label>
                  <Input 
                    id="accountNumbers" 
                    name="accountNumbers" 
                    placeholder="Account numbers"
                    value={formData.accountNumbers} 
                    onChange={handleChange} 
                  />
                </div>
              </div>

              {/* Requester's info */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="requesterName">Requester's name and address (optional)</Label>
                  <Input 
                    id="requesterName" 
                    name="requesterName" 
                    placeholder="Name of person/entity requesting this form"
                    value={formData.requesterName} 
                    onChange={handleChange} 
                  />
                </div>
              </div>

              {/* Part I - TIN */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
                  Part I - Taxpayer Identification Number (TIN)
                </h2>
                <p className="text-sm text-slate-500">Enter your TIN in the appropriate box. For individuals, this is your social security number (SSN). For other entities, it is your employer identification number (EIN).</p>
                
                <div className="space-y-4">
                  <RadioGroup 
                    value={formData.tinType} 
                    onValueChange={(value) => setFormData({...formData, tinType: value})}
                    className="flex gap-6"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="ssn" id="tin-ssn" />
                      <Label htmlFor="tin-ssn" className="cursor-pointer">Social Security Number</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="ein" id="tin-ein" />
                      <Label htmlFor="tin-ein" className="cursor-pointer">Employer Identification Number</Label>
                    </div>
                  </RadioGroup>
                  
                  {formData.tinType === 'ssn' ? (
                    <div className="space-y-2 max-w-xs">
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
                    <div className="space-y-2 max-w-xs">
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

              {/* Part II - Certification */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
                  Part II - Certification
                </h2>
                <div className="p-4 bg-slate-50 rounded-md text-sm text-slate-600">
                  <p className="mb-2">Under penalties of perjury, I certify that:</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>The number shown on this form is my correct taxpayer identification number, and</li>
                    <li>I am not subject to backup withholding, and</li>
                    <li>I am a U.S. citizen or other U.S. person, and</li>
                    <li>The FATCA code(s) entered on this form (if any) indicating that I am exempt from FATCA reporting is correct.</li>
                  </ol>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="signature">Signature (Type your name) *</Label>
                    <Input 
                      id="signature" 
                      name="signature" 
                      placeholder="Type your full legal name"
                      value={formData.signature} 
                      onChange={handleChange} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signatureDate">Date *</Label>
                    <Input 
                      id="signatureDate" 
                      name="signatureDate" 
                      placeholder="MM/DD/YYYY"
                      value={formData.signatureDate} 
                      onChange={handleChange} 
                    />
                  </div>
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
                    <span className="font-medium text-right max-w-[200px] truncate">{summary.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-700">Business Name:</span>
                    <span className="font-medium text-right max-w-[200px] truncate">{summary.businessName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-700">Classification:</span>
                    <span className="font-medium text-right max-w-[200px] truncate">{summary.classification}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-700">TIN:</span>
                    <span className="font-medium">{summary.tin}</span>
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
                          <iframe
                            src={pdfPreview}
                            className="w-full h-96 pointer-events-none"
                            title="W-9 Preview"
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
                      <div className="relative flex-1 h-full overflow-hidden">
                        <iframe src={pdfPreview} className="w-full h-[calc(90vh-80px)]" title="W-9 Preview Full" />
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
                    <p className="text-sm text-slate-500">Select a year to see preview</p>
                  </div>
                )}
              </div>

              {/* PayPal */}
              <div className="p-6 bg-slate-50 border-2 border-slate-200 rounded-md">
                <h3 className="text-lg font-bold mb-4" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
                  Complete Payment
                </h3>
                <p className="text-sm text-slate-600 mb-4">
                  Total: <strong>$15.00</strong> for W-9 generation
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
      <Footer />
    </div>
  );
}

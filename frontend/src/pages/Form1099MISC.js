import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { PayPalButtons } from "@paypal/react-paypal-js";
import { generateAndDownload1099MISC } from "@/utils/1099miscGenerator";
import { generate1099MISCPreview } from "@/utils/1099miscPreviewGenerator";
import { 
  formatFullSSN, validateFullSSN,
  formatEIN, validateEIN,
  formatZipCode, validateZipCode,
  formatPhoneNumber, validatePhoneNumber
} from "@/utils/validation";

// US States list
const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "DC", "FL", "GA", "HI", "ID", "IL", "IN",
  "IA", "KS", "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH",
  "NJ", "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT",
  "VT", "VA", "WA", "WV", "WI", "WY"
];

// Available tax years
const TAX_YEARS = ["2025", "2024", "2023", "2022", "2021"];

export default function Form1099MISC() {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [pdfPreview, setPdfPreview] = useState(null);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [selectedTaxYear, setSelectedTaxYear] = useState("2024");

  const [formData, setFormData] = useState({
    // Payer Information
    payerName: "",
    payerAddress: "",
    payerCity: "",
    payerState: "",
    payerZip: "",
    payerPhone: "",
    payerTIN: "",
    
    // Recipient Information
    recipientTIN: "",
    recipientName: "",
    recipientAddress: "",
    recipientCity: "",
    recipientState: "",
    recipientZip: "",
    accountNumber: "",
    
    // Checkboxes
    secondTINNotice: false,
    fatcaFiling: false,
    
    // Income Boxes
    box1: "",  // Rents
    box2: "",  // Royalties
    box3: "",  // Other income
    box4: "",  // Federal income tax withheld
    box5: "",  // Fishing boat proceeds
    box6: "",  // Medical and health care payments
    box7: false, // Direct sales checkbox
    box8: "",  // Substitute payments
    box9: "",  // Crop insurance proceeds
    box10: "", // Gross proceeds to attorney
    box11: "", // Fish purchased for resale
    box12: "", // Section 409A deferrals
    box15: "", // Nonqualified deferred compensation
    
    // State Information
    state1: "",
    payerStateNo1: "",
    stateIncome1: "",
    stateTaxWithheld1: "",
    state2: "",
    payerStateNo2: "",
    stateIncome2: "",
    stateTaxWithheld2: ""
  });

  // Validation errors state
  const [validationErrors, setValidationErrors] = useState({
    payerTIN: '',
    payerZip: '',
    payerPhone: '',
    recipientTIN: '',
    recipientZip: ''
  });

  // Validated input handlers
  const handlePayerTINChange = (e) => {
    const formatted = formatEIN(e.target.value);
    setFormData(prev => ({ ...prev, payerTIN: formatted }));
    const validation = validateEIN(formatted);
    setValidationErrors(prev => ({ ...prev, payerTIN: validation.error }));
  };

  const handlePayerZipChange = (e) => {
    const formatted = formatZipCode(e.target.value);
    setFormData(prev => ({ ...prev, payerZip: formatted }));
    const validation = validateZipCode(formatted);
    setValidationErrors(prev => ({ ...prev, payerZip: validation.error }));
  };

  const handlePayerPhoneChange = (e) => {
    const formatted = formatPhoneNumber(e.target.value);
    setFormData(prev => ({ ...prev, payerPhone: formatted }));
    const validation = validatePhoneNumber(formatted);
    setValidationErrors(prev => ({ ...prev, payerPhone: validation.error }));
  };

  const handleRecipientTINChange = (e) => {
    const formatted = formatFullSSN(e.target.value);
    setFormData(prev => ({ ...prev, recipientTIN: formatted }));
    const validation = validateFullSSN(formatted);
    setValidationErrors(prev => ({ ...prev, recipientTIN: validation.error }));
  };

  const handleRecipientZipChange = (e) => {
    const formatted = formatZipCode(e.target.value);
    setFormData(prev => ({ ...prev, recipientZip: formatted }));
    const validation = validateZipCode(formatted);
    setValidationErrors(prev => ({ ...prev, recipientZip: validation.error }));
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
          const previewUrl = await generate1099MISCPreview(formData, selectedTaxYear);
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
          description: `1099-MISC Form - Tax Year ${selectedTaxYear}`,
          amount: {
            value: "12.00",
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
      toast.success("Payment successful! Generating your 1099-MISC...");
      
      await generateAndDownload1099MISC(formData, selectedTaxYear);
      
      toast.success("1099-MISC downloaded successfully!");
      setIsProcessing(false);
    } catch (error) {
      toast.error("Failed to generate 1099-MISC");
      setIsProcessing(false);
    }
  };

  const onError = (err) => {
    toast.error("Payment failed. Please try again.");
    console.error("PayPal error:", err);
  };

  // Format currency for display
  const formatCurrency = (value) => {
    const num = parseFloat(value) || 0;
    return num.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  };

  // Calculate totals
  const totals = useMemo(() => {
    const rents = parseFloat(formData.box1) || 0;
    const royalties = parseFloat(formData.box2) || 0;
    const otherIncome = parseFloat(formData.box3) || 0;
    const federalWithheld = parseFloat(formData.box4) || 0;
    const medical = parseFloat(formData.box6) || 0;
    const attorney = parseFloat(formData.box10) || 0;
    const totalIncome = rents + royalties + otherIncome + medical + attorney;
    
    return { rents, royalties, otherIncome, federalWithheld, medical, attorney, totalIncome };
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
            1099-MISC Generator
          </h1>
          <p className="text-slate-600">Generate Miscellaneous Income forms for rents, royalties, prizes, and other payments</p>
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

              {/* Payer Information */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
                  Payer Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="payerName">Payer&apos;s Name *</Label>
                    <Input 
                      id="payerName" 
                      name="payerName" 
                      placeholder="Company or individual name"
                      value={formData.payerName} 
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="payerTIN">Payer&apos;s TIN (EIN) *</Label>
                    <Input 
                      id="payerTIN" 
                      name="payerTIN" 
                      placeholder="XX-XXXXXXX"
                      value={formData.payerTIN} 
                      onChange={handlePayerTINChange}
                      className={validationErrors.payerTIN ? 'border-red-500' : ''}
                    />
                    {validationErrors.payerTIN && (
                      <p className="text-xs text-red-500 mt-1">{validationErrors.payerTIN}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="payerPhone">Payer&apos;s Phone</Label>
                    <Input 
                      id="payerPhone" 
                      name="payerPhone" 
                      placeholder="(xxx) xxx-xxxx"
                      value={formData.payerPhone} 
                      onChange={handlePayerPhoneChange}
                      className={validationErrors.payerPhone ? 'border-red-500' : ''}
                    />
                    {validationErrors.payerPhone && (
                      <p className="text-xs text-red-500 mt-1">{validationErrors.payerPhone}</p>
                    )}
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="payerAddress">Payer&apos;s Address *</Label>
                    <Input 
                      id="payerAddress" 
                      name="payerAddress" 
                      placeholder="Street address"
                      value={formData.payerAddress} 
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="payerCity">City *</Label>
                    <Input 
                      id="payerCity" 
                      name="payerCity" 
                      placeholder="City"
                      value={formData.payerCity} 
                      onChange={handleChange}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="payerState">State *</Label>
                      <Select value={formData.payerState} onValueChange={(val) => setFormData({...formData, payerState: val})}>
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
                      <Label htmlFor="payerZip">ZIP *</Label>
                      <Input 
                        id="payerZip" 
                        name="payerZip" 
                        placeholder="12345"
                        value={formData.payerZip} 
                        onChange={handlePayerZipChange}
                        className={validationErrors.payerZip ? 'border-red-500' : ''}
                      />
                      {validationErrors.payerZip && (
                        <p className="text-xs text-red-500 mt-1">{validationErrors.payerZip}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Recipient Information */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
                  Recipient Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="recipientName">Recipient&apos;s Name *</Label>
                    <Input 
                      id="recipientName" 
                      name="recipientName" 
                      placeholder="Recipient name"
                      value={formData.recipientName} 
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="recipientTIN">Recipient&apos;s TIN (SSN) *</Label>
                    <Input 
                      id="recipientTIN" 
                      name="recipientTIN" 
                      placeholder="XXX-XX-XXXX"
                      value={formData.recipientTIN} 
                      onChange={handleRecipientTINChange}
                      className={validationErrors.recipientTIN ? 'border-red-500' : ''}
                    />
                    {validationErrors.recipientTIN && (
                      <p className="text-xs text-red-500 mt-1">{validationErrors.recipientTIN}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accountNumber">Account Number (optional)</Label>
                    <Input 
                      id="accountNumber" 
                      name="accountNumber" 
                      placeholder="Optional"
                      value={formData.accountNumber} 
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="recipientAddress">Recipient&apos;s Address *</Label>
                    <Input 
                      id="recipientAddress" 
                      name="recipientAddress" 
                      placeholder="Street address"
                      value={formData.recipientAddress} 
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="recipientCity">City *</Label>
                    <Input 
                      id="recipientCity" 
                      name="recipientCity" 
                      placeholder="City"
                      value={formData.recipientCity} 
                      onChange={handleChange}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="recipientState">State *</Label>
                      <Select value={formData.recipientState} onValueChange={(val) => setFormData({...formData, recipientState: val})}>
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
                      <Label htmlFor="recipientZip">ZIP *</Label>
                      <Input 
                        id="recipientZip" 
                        name="recipientZip" 
                        placeholder="12345"
                        value={formData.recipientZip} 
                        onChange={handleRecipientZipChange}
                        className={validationErrors.recipientZip ? 'border-red-500' : ''}
                      />
                      {validationErrors.recipientZip && (
                        <p className="text-xs text-red-500 mt-1">{validationErrors.recipientZip}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="secondTINNotice"
                      checked={formData.secondTINNotice}
                      onCheckedChange={(checked) => handleCheckboxChange('secondTINNotice', checked)}
                    />
                    <Label htmlFor="secondTINNotice" className="text-sm cursor-pointer">2nd TIN not.</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="fatcaFiling"
                      checked={formData.fatcaFiling}
                      onCheckedChange={(checked) => handleCheckboxChange('fatcaFiling', checked)}
                    />
                    <Label htmlFor="fatcaFiling" className="text-sm cursor-pointer">FATCA filing requirement</Label>
                  </div>
                </div>
              </div>

              {/* Income Boxes */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
                  Income &amp; Payments
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="box1">Box 1 - Rents</Label>
                    <Input 
                      id="box1" 
                      name="box1" 
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.box1} 
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="box2">Box 2 - Royalties</Label>
                    <Input 
                      id="box2" 
                      name="box2" 
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.box2} 
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="box3">Box 3 - Other income</Label>
                    <Input 
                      id="box3" 
                      name="box3" 
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.box3} 
                      onChange={handleChange}
                    />
                    <p className="text-xs text-slate-500">Prizes, awards, other payments</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="box4">Box 4 - Federal income tax withheld</Label>
                    <Input 
                      id="box4" 
                      name="box4" 
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.box4} 
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="box5">Box 5 - Fishing boat proceeds</Label>
                    <Input 
                      id="box5" 
                      name="box5" 
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.box5} 
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="box6">Box 6 - Medical and health care payments</Label>
                    <Input 
                      id="box6" 
                      name="box6" 
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.box6} 
                      onChange={handleChange}
                    />
                  </div>
                  <div className="flex items-center space-x-2 md:col-span-2">
                    <Checkbox 
                      id="box7"
                      checked={formData.box7}
                      onCheckedChange={(checked) => handleCheckboxChange('box7', checked)}
                    />
                    <Label htmlFor="box7" className="text-sm cursor-pointer">Box 7 - Payer made direct sales totaling $5,000+ of consumer products to recipient for resale</Label>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="box8">Box 8 - Substitute payments in lieu of dividends</Label>
                    <Input 
                      id="box8" 
                      name="box8" 
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.box8} 
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="box9">Box 9 - Crop insurance proceeds</Label>
                    <Input 
                      id="box9" 
                      name="box9" 
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.box9} 
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="box10">Box 10 - Gross proceeds paid to attorney</Label>
                    <Input 
                      id="box10" 
                      name="box10" 
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.box10} 
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="box11">Box 11 - Fish purchased for resale</Label>
                    <Input 
                      id="box11" 
                      name="box11" 
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.box11} 
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="box12">Box 12 - Section 409A deferrals</Label>
                    <Input 
                      id="box12" 
                      name="box12" 
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.box12} 
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="box15">Box 15 - Nonqualified deferred compensation</Label>
                    <Input 
                      id="box15" 
                      name="box15" 
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.box15} 
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              {/* State Tax Information */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
                  State Tax Information
                </h2>
                <p className="text-sm text-slate-500">Complete if state tax was withheld</p>
                
                {/* State 1 */}
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <h3 className="font-semibold text-slate-700 mb-3">State 1</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="state1">State</Label>
                      <Select value={formData.state1} onValueChange={(val) => setFormData({...formData, state1: val})}>
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
                      <Label htmlFor="payerStateNo1">Payer&apos;s State No.</Label>
                      <Input 
                        id="payerStateNo1" 
                        name="payerStateNo1" 
                        placeholder="State ID"
                        value={formData.payerStateNo1} 
                        onChange={handleChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="stateIncome1">State Income</Label>
                      <Input 
                        id="stateIncome1" 
                        name="stateIncome1" 
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.stateIncome1} 
                        onChange={handleChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="stateTaxWithheld1">State Tax Withheld</Label>
                      <Input 
                        id="stateTaxWithheld1" 
                        name="stateTaxWithheld1" 
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.stateTaxWithheld1} 
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </div>

                {/* State 2 */}
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <h3 className="font-semibold text-slate-700 mb-3">State 2 (if applicable)</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="state2">State</Label>
                      <Select value={formData.state2} onValueChange={(val) => setFormData({...formData, state2: val})}>
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
                      <Label htmlFor="payerStateNo2">Payer&apos;s State No.</Label>
                      <Input 
                        id="payerStateNo2" 
                        name="payerStateNo2" 
                        placeholder="State ID"
                        value={formData.payerStateNo2} 
                        onChange={handleChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="stateIncome2">State Income</Label>
                      <Input 
                        id="stateIncome2" 
                        name="stateIncome2" 
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.stateIncome2} 
                        onChange={handleChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="stateTaxWithheld2">State Tax Withheld</Label>
                      <Input 
                        id="stateTaxWithheld2" 
                        name="stateTaxWithheld2" 
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.stateTaxWithheld2} 
                        onChange={handleChange}
                      />
                    </div>
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
                  1099-MISC Summary - {selectedTaxYear}
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-700">Payer:</span>
                    <span className="font-medium text-slate-900">{formData.payerName || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-700">Recipient:</span>
                    <span className="font-medium text-slate-900">{formData.recipientName || "—"}</span>
                  </div>
                  <div className="border-t border-green-300 my-2"></div>
                  {totals.rents > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-700">Box 1 - Rents:</span>
                      <span className="font-medium text-slate-900">{formatCurrency(totals.rents)}</span>
                    </div>
                  )}
                  {totals.royalties > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-700">Box 2 - Royalties:</span>
                      <span className="font-medium text-slate-900">{formatCurrency(totals.royalties)}</span>
                    </div>
                  )}
                  {totals.otherIncome > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-700">Box 3 - Other Income:</span>
                      <span className="font-medium text-slate-900">{formatCurrency(totals.otherIncome)}</span>
                    </div>
                  )}
                  {totals.medical > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-700">Box 6 - Medical:</span>
                      <span className="font-medium text-slate-900">{formatCurrency(totals.medical)}</span>
                    </div>
                  )}
                  {totals.attorney > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-700">Box 10 - Attorney:</span>
                      <span className="font-medium text-slate-900">{formatCurrency(totals.attorney)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-700">Box 4 - Federal Withheld:</span>
                    <span className="font-medium text-slate-900">{formatCurrency(totals.federalWithheld)}</span>
                  </div>
                  <div className="border-t border-green-300 my-2"></div>
                  <div className="flex justify-between font-bold">
                    <span className="text-green-800">Total Income:</span>
                    <span className="text-green-800">{formatCurrency(totals.totalIncome)}</span>
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
                        <DialogTitle>1099-MISC Preview - {selectedTaxYear}</DialogTitle>
                      </DialogHeader>
                      <div className="flex-1 h-full">
                        {pdfPreview && (
                          <iframe
                            src={pdfPreview}
                            className="w-full h-[calc(90vh-80px)] border-0"
                            title="1099-MISC Preview Full"
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
                      title="1099-MISC Preview"
                    />
                  ) : (
                    <p className="text-slate-500">Preview will appear here</p>
                  )}
                </div>
              </div>

              {/* Payment Section */}
              <div className="p-6 bg-white rounded-lg border border-slate-200">
                <div className="text-center mb-4">
                  <p className="text-3xl font-black" style={{ color: '#1a4731' }}>$12.00</p>
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
                  Secure payment via PayPal. Your 1099-MISC will download immediately after payment.
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

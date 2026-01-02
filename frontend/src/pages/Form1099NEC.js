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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";
import { toast } from "sonner";
import { PayPalButtons } from "@paypal/react-paypal-js";
import CouponInput from "@/components/CouponInput";
import { generateAndDownload1099NEC } from "@/utils/1099necGenerator";
import { generate1099NECPreview } from "@/utils/1099necPreviewGenerator";
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

export default function Form1099NEC() {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [appliedDiscount, setAppliedDiscount] = useState(null);
  const [pdfPreview, setPdfPreview] = useState(null);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [selectedTaxYear, setSelectedTaxYear] = useState("2024");
  
  // User subscription state
  const [user, setUser] = useState(null);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  
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
        
        if (userData.subscription && 
            userData.subscription.status === "active" &&
            (userData.subscription.downloads_remaining > 0 || userData.subscription.downloads_remaining === -1)) {
          setHasActiveSubscription(true);
        }
        
        const response = await fetch(`${BACKEND_URL}/api/user/me`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.user) {
            setUser(data.user);
            localStorage.setItem("userInfo", JSON.stringify(data.user));
            
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
      const response = await fetch(`${BACKEND_URL}/api/user/subscription-download`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          documentType: "1099-nec",
          template: null
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || "Failed to process subscription download");
      }
      
      // Check if user wants documents saved
      const shouldSave = user?.preferences?.saveDocuments;
      
      const pdfBlob = await generateAndDownload1099NEC(formData, selectedTaxYear, shouldSave);
      
      // Save document if user has preference enabled and blob was returned
      if (shouldSave && pdfBlob && pdfBlob instanceof Blob) {
        try {
          const reader = new FileReader();
          reader.onloadend = async () => {
            const base64Data = reader.result.split(',')[1];
            const fileName = `1099NEC_${selectedTaxYear}_${formData.recipientName?.replace(/\s+/g, '_') || 'Form'}.pdf`;
            
            await fetch(`${BACKEND_URL}/api/user/saved-documents`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
              },
              body: JSON.stringify({
                documentType: "1099-nec",
                fileName: fileName,
                fileData: base64Data,
                template: null
              })
            });
            toast.success("Document saved to your account!");
          };
          reader.readAsDataURL(pdfBlob);
        } catch (saveError) {
          console.error("Failed to save document:", saveError);
        }
      }
      
      if (data.downloadsRemaining !== undefined) {
        const updatedUser = { ...user };
        if (updatedUser.subscription) {
          updatedUser.subscription.downloads_remaining = data.downloadsRemaining;
        }
        setUser(updatedUser);
        localStorage.setItem("userInfo", JSON.stringify(updatedUser));
        
        if (data.downloadsRemaining === 0) {
          setHasActiveSubscription(false);
        }
      }
      
      toast.success("1099-NEC form downloaded successfully!");
      navigate("/user/downloads");
      
    } catch (error) {
      console.error("Subscription download error:", error);
      toast.error(error.message || "Failed to download. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

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
    
    // Boxes
    box1: "", // Nonemployee compensation
    box2: false, // Direct sales checkbox
    box4: "", // Federal income tax withheld
    
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
          const previewUrl = await generate1099NECPreview(formData, selectedTaxYear);
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
    const basePrice = 9.99;
    const finalPrice = appliedDiscount ? appliedDiscount.discountedPrice : basePrice;
    return actions.order.create({
      purchase_units: [
        {
          description: `1099-NEC Form - Tax Year ${selectedTaxYear}${appliedDiscount ? ` (${appliedDiscount.discountPercent}% OFF)` : ''}`,
          amount: {
            value: finalPrice.toFixed(2),
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
      const orderId = orderData.id || `1099N-${Date.now()}`;
      toast.success("Payment successful! Generating your 1099-NEC...");
      
      await generateAndDownload1099NEC(formData, selectedTaxYear);
      
      toast.success("1099-NEC downloaded successfully!");
      setIsProcessing(false);
      
      // Redirect to payment success page
      navigate(`/payment-success?type=1099-nec&order_id=${orderId}&count=1`);
    } catch (error) {
      toast.error("Failed to generate 1099-NEC");
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
    const compensation = parseFloat(formData.box1) || 0;
    const federalWithheld = parseFloat(formData.box4) || 0;
    const stateWithheld1 = parseFloat(formData.stateTaxWithheld1) || 0;
    const stateWithheld2 = parseFloat(formData.stateTaxWithheld2) || 0;
    const totalWithheld = federalWithheld + stateWithheld1 + stateWithheld2;
    
    return { compensation, federalWithheld, stateWithheld1, stateWithheld2, totalWithheld };
  }, [formData]);

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <div className="max-w-7xl mx-auto px-6 py-8">

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
            1099-NEC Generator
          </h1>
          <p className="text-slate-600">Generate Nonemployee Compensation forms for contractors and freelancers</p>
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
                      placeholder="Contractor or freelancer name"
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
                  <div className="flex items-center space-x-2 md:col-span-2">
                    <Checkbox 
                      id="secondTINNotice"
                      checked={formData.secondTINNotice}
                      onCheckedChange={(checked) => handleCheckboxChange('secondTINNotice', checked)}
                    />
                    <Label htmlFor="secondTINNotice" className="text-sm cursor-pointer">2nd TIN not. (Check if second TIN notice sent)</Label>
                  </div>
                </div>
              </div>

              {/* Compensation Boxes */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
                  Compensation & Withholding
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="box1">Box 1 - Nonemployee Compensation *</Label>
                    <Input 
                      id="box1" 
                      name="box1" 
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.box1} 
                      onChange={handleChange}
                    />
                    <p className="text-xs text-slate-500">Amount paid to recipient ($600 or more)</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="box4">Box 4 - Federal Income Tax Withheld</Label>
                    <Input 
                      id="box4" 
                      name="box4" 
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.box4} 
                      onChange={handleChange}
                    />
                    <p className="text-xs text-slate-500">Backup withholding amount</p>
                  </div>
                  <div className="flex items-center space-x-2 md:col-span-2">
                    <Checkbox 
                      id="box2"
                      checked={formData.box2}
                      onCheckedChange={(checked) => handleCheckboxChange('box2', checked)}
                    />
                    <Label htmlFor="box2" className="text-sm cursor-pointer">Box 2 - Payer made direct sales totaling $5,000+ of consumer products to recipient for resale</Label>
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
                  1099-NEC Summary - {selectedTaxYear}
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
                  <div className="flex justify-between">
                    <span className="text-slate-700">Box 1 - Compensation:</span>
                    <span className="font-medium text-slate-900">{formatCurrency(totals.compensation)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-700">Box 4 - Federal Withheld:</span>
                    <span className="font-medium text-slate-900">{formatCurrency(totals.federalWithheld)}</span>
                  </div>
                  {totals.stateWithheld1 > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-700">State 1 Withheld:</span>
                      <span className="font-medium text-slate-900">{formatCurrency(totals.stateWithheld1)}</span>
                    </div>
                  )}
                  {totals.stateWithheld2 > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-700">State 2 Withheld:</span>
                      <span className="font-medium text-slate-900">{formatCurrency(totals.stateWithheld2)}</span>
                    </div>
                  )}
                  <div className="border-t border-green-300 my-2"></div>
                  <div className="flex justify-between font-bold">
                    <span className="text-green-800">Total Withheld:</span>
                    <span className="text-green-800">{formatCurrency(totals.totalWithheld)}</span>
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
                            alt="1099-NEC Preview"
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
                        <DialogTitle>1099-NEC Preview - {selectedTaxYear}</DialogTitle>
                      </DialogHeader>
                      <div className="relative flex-1 h-full overflow-auto p-4">
                        <img src={pdfPreview} alt="1099-NEC Preview Full" className="w-full h-auto" />
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
              <div className="p-6 bg-slate-50 border-2 border-slate-200 rounded-md">
                <h3 className="text-lg font-bold mb-4" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
                  {hasActiveSubscription ? 'Download Document' : 'Complete Payment'}
                </h3>
                
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
                      disabled={isProcessing}
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
                          Download 1099-NEC (Included in Plan)
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <>
                    <CouponInput
                      generatorType="1099-nec"
                      originalPrice={9.99}
                      onDiscountApplied={setAppliedDiscount}
                    />
                    <p className="text-sm text-slate-600 mb-4">
                      Total: <strong>${appliedDiscount ? appliedDiscount.discountedPrice.toFixed(2) : '9.99'}</strong>
                      {appliedDiscount && <span className="text-green-600 ml-1">({appliedDiscount.discountPercent}% off)</span>}
                      {!appliedDiscount && ' for 1099-NEC generation'}
                    </p>
                    
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
                        style={{ layout: "vertical", color: "gold", shape: "rect", label: "pay" }}
                        createOrder={createOrder}
                        onApprove={onApprove}
                        onError={onError}
                      />
                    )}
                    
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

      {/* FAQ Section */}
      <section className="bg-slate-50 border-t border-slate-200 py-16">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-4">
              <HelpCircle className="w-6 h-6 text-green-700" />
            </div>
            <h2 className="text-3xl font-black tracking-tight mb-2" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
              1099-NEC Form FAQ
            </h2>
            <p className="text-slate-600">Common questions about 1099-NEC forms and our generator</p>
          </div>
          
          <Accordion type="single" collapsible className="space-y-3">
            <AccordionItem value="item-1" className="bg-white border border-slate-200 rounded-lg px-6">
              <AccordionTrigger className="text-left font-semibold text-slate-800 hover:text-green-700">
                What is a 1099-NEC form?
              </AccordionTrigger>
              <AccordionContent className="text-slate-600 pb-4">
                Form 1099-NEC (Nonemployee Compensation) is used to report payments of $600 or more made to independent contractors, freelancers, and other self-employed individuals during the tax year. It replaced Box 7 of the 1099-MISC starting in 2020.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2" className="bg-white border border-slate-200 rounded-lg px-6">
              <AccordionTrigger className="text-left font-semibold text-slate-800 hover:text-green-700">
                Who receives a 1099-NEC?
              </AccordionTrigger>
              <AccordionContent className="text-slate-600 pb-4">
                Independent contractors, freelancers, consultants, and other self-employed individuals who earned $600 or more from a single client during the tax year receive a 1099-NEC. This includes gig workers, consultants, and anyone providing services as a non-employee.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3" className="bg-white border border-slate-200 rounded-lg px-6">
              <AccordionTrigger className="text-left font-semibold text-slate-800 hover:text-green-700">
                What's the difference between 1099-NEC and 1099-MISC?
              </AccordionTrigger>
              <AccordionContent className="text-slate-600 pb-4">
                The 1099-NEC is specifically for nonemployee compensation (payments to independent contractors), while 1099-MISC is used for other types of miscellaneous income like rent, royalties, prizes, and awards. Before 2020, nonemployee compensation was reported on 1099-MISC Box 7.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4" className="bg-white border border-slate-200 rounded-lg px-6">
              <AccordionTrigger className="text-left font-semibold text-slate-800 hover:text-green-700">
                What is Box 1 on the 1099-NEC?
              </AccordionTrigger>
              <AccordionContent className="text-slate-600 pb-4">
                Box 1 reports nonemployee compensation - the total amount paid to the recipient for services performed. This includes fees, commissions, prizes, awards, and other forms of compensation for services as a nonemployee.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5" className="bg-white border border-slate-200 rounded-lg px-6">
              <AccordionTrigger className="text-left font-semibold text-slate-800 hover:text-green-700">
                What is Box 4 (Federal tax withheld)?
              </AccordionTrigger>
              <AccordionContent className="text-slate-600 pb-4">
                Box 4 shows any federal income tax that was withheld from payments. This typically occurs due to backup withholding (24%) when a contractor hasn't provided a valid TIN or is subject to IRS notification for backup withholding.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-6" className="bg-white border border-slate-200 rounded-lg px-6">
              <AccordionTrigger className="text-left font-semibold text-slate-800 hover:text-green-700">
                When is the 1099-NEC due?
              </AccordionTrigger>
              <AccordionContent className="text-slate-600 pb-4">
                The 1099-NEC must be furnished to recipients by January 31st and filed with the IRS by January 31st (no automatic extension). This deadline is earlier than many other 1099 forms to help recipients file their taxes on time.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-7" className="bg-white border border-slate-200 rounded-lg px-6">
              <AccordionTrigger className="text-left font-semibold text-slate-800 hover:text-green-700">
                Do I need to report state information?
              </AccordionTrigger>
              <AccordionContent className="text-slate-600 pb-4">
                If you withheld state income tax, you should report the state, state ID number, and state income in Boxes 5-7. Some states require 1099-NEC filing even without withholding. Our generator supports state tax information.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-8" className="bg-white border border-slate-200 rounded-lg px-6">
              <AccordionTrigger className="text-left font-semibold text-slate-800 hover:text-green-700">
                Can I generate 1099-NEC forms for previous years?
              </AccordionTrigger>
              <AccordionContent className="text-slate-600 pb-4">
                Yes! Our 1099-NEC generator supports multiple tax years. Simply select the appropriate tax year from the dropdown menu. This is helpful for correcting records or creating forms for prior years.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      <Footer />
    </div>
  );
}

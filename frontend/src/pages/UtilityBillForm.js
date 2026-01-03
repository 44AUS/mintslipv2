import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";
import { createStripeCheckout } from "@/utils/stripePayment";
import CouponInput from "@/components/CouponInput";
import { generateAndDownloadUtilityBill } from "@/utils/utilityBillGenerator";
import { generateUtilityBillPreview } from "@/utils/utilityBillPreviewGenerator";
import { formatZipCode } from "@/utils/validation";
import { CheckCircle, Zap, Building2, Loader2, Maximize2, Upload, X, Search, ChevronDown, Droplets  } from "lucide-react";

// US States list
const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "DC", "FL", "GA", "HI", "ID", "IL", "IN",
  "IA", "KS", "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH",
  "NJ", "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT",
  "VT", "VA", "WA", "WV", "WI", "WY"
];

// Check if running on localhost
const isLocalhost = typeof window !== 'undefined' && (
  window.location.hostname === 'localhost' || 
  window.location.hostname === '127.0.0.1'
);

// Service Expense provider templates
const UTILITY_PROVIDERS = [
  { id: 'xfinity', name: 'Xfinity Style', template: 'template-a', description: 'Modern telecom with purple accents' },
  { id: 'traditional', name: 'Traditional (H20 Expense)', template: 'template-b', description: 'Classic H20 with YTD consumption chart' },
  ...(isLocalhost ? [
  { id: 'modern', name: 'Modern Minimal', template: 'template-c', description: 'Clean minimal design with green accents' },
  ] : []),
];

// Service types
const SERVICE_TYPES = [
  "Electric", "Gas", "Water", "Internet", "Cable TV", "Phone", "Bundled Services", "Other"
];

export default function UtilityBillForm() {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [appliedDiscount, setAppliedDiscount] = useState(null);
  const [pdfPreview, setPdfPreview] = useState(null);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [isWaterChargesOpen, setIsWaterChargesOpen] = useState(false);
  
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
          documentType: "utility-bill",
          template: selectedProvider?.id || "custom"
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || "Failed to process subscription download");
      }
      
      const fullFormData = {
        ...formData,
        companyLogo: uploadedLogo
      };
      
      // Check if user wants documents saved
      const shouldSave = user?.preferences?.saveDocuments;
      
      const pdfBlob = await generateAndDownloadUtilityBill(fullFormData, selectedProvider?.id || "custom", shouldSave);
      
      // Save document if user has preference enabled and blob was returned
      if (shouldSave && pdfBlob && pdfBlob instanceof Blob) {
        try {
          const reader = new FileReader();
          reader.onloadend = async () => {
            const base64Data = reader.result.split(',')[1];
            const fileName = `utility-bill-${formData.customerName?.replace(/\s+/g, '-') || 'statement'}.pdf`;
            
            await fetch(`${BACKEND_URL}/api/user/saved-documents`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
              },
              body: JSON.stringify({
                documentType: "utility-bill",
                fileName: fileName,
                fileData: base64Data,
                template: selectedProvider?.id || "custom"
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
      
      localStorage.removeItem('utilityBillLogo');
      setUploadedLogo(null);
      setLogoPreview(null);
      
      toast.success("Service expense document downloaded successfully!");
      navigate("/user/downloads");
      
    } catch (error) {
      console.error("Subscription download error:", error);
      toast.error(error.message || "Failed to download. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Provider search state
  const [providerSearchQuery, setProviderSearchQuery] = useState("");
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [showProviderDropdown, setShowProviderDropdown] = useState(false);
  const providerSearchRef = useRef(null);
  
  // Logo upload state
  const [uploadedLogo, setUploadedLogo] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [logoError, setLogoError] = useState("");
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    // Company Info
    companyName: "",
    companyAddress: "",
    companyCity: "",
    companyState: "",
    companyZip: "",
    companyPhone: "",
    companyFax: "",
    companyWebsite: "",
    companyMailingAddress: "",
    companyMailingCity: "",
    
    // Account Info
    accountNumber: "",
    customerName: "",
    serviceAddress: "",
    serviceCity: "",
    serviceState: "",
    serviceZip: "",
    accountStatus: "Current",
    
    // Billing Info
    billingDate: new Date().toISOString().split('T')[0],
    servicePeriodStart: "",
    servicePeriodEnd: "",
    dueDate: "",
    daysInPeriod: "",
    billCycle: "",
    
    // Service Details
    serviceType: "Water",
    
    // Previous Balance
    previousBalance: "0.00",
    paymentReceived: "0.00",
    paymentDate: "",
    
    // Current Charges (Generic)
    baseCharge: "0.00",
    usageCharge: "0.00",
    usageAmount: "",
    usageUnit: "gallons",
    taxes: "0.00",
    fees: "0.00",
    
    // Water-specific charges (for Traditional template)
    waterDepositApplication: "0.00",
    waterTier1Charge: "0.00",
    waterTier1Gallons: "",
    waterTier2Charge: "0.00",
    waterTier2Gallons: "",
    costOfBasicService: "0.00",
    sewerCharge: "0.00",
    sewerGallons: "",
    streetLightCharge: "0.00",
    
    // Additional Info
    meterNumber: "",
    previousReading: "",
    currentReading: "",
    
    // Discounts
    discountDescription: "",
    discountAmount: "0.00",
    
    // Notice content
    importantNotice: "",
    spanishNotice: "",
    
    // Notes
    notes: ""
  });

  // Filter providers based on search query
  const filteredProviders = UTILITY_PROVIDERS.filter(provider =>
    provider.name.toLowerCase().includes(providerSearchQuery.toLowerCase()) ||
    provider.description.toLowerCase().includes(providerSearchQuery.toLowerCase())
  );

  // Handle provider selection
  const handleProviderSelect = (provider) => {
    setSelectedProvider(provider);
    setProviderSearchQuery(provider.name);
    setShowProviderDropdown(false);
    
    // Auto-expand water charges section for traditional template
    if (provider.template === 'template-b') {
      setIsWaterChargesOpen(true);
    }
  };

  // Logo upload validation and processing
  const validateAndProcessLogo = (file) => {
    setLogoError("");
    
    if (!file.type.includes('png') && !file.type.includes('jpeg') && !file.type.includes('jpg')) {
      setLogoError("Only PNG or JPG files are accepted");
      return false;
    }
    
    if (file.size > 2 * 1024 * 1024) {
      setLogoError("File size must be less than 2MB");
      return false;
    }
    
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target.result;
        setUploadedLogo(file);
        setLogoPreview(base64);
        resolve(true);
      };
      reader.onerror = () => {
        setLogoError("Failed to read file");
        resolve(false);
      };
      reader.readAsDataURL(file);
    });
  };

  // Handle file drop
  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      await validateAndProcessLogo(file);
    }
  };

  // Handle file input change
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      await validateAndProcessLogo(file);
    }
  };

  // Remove uploaded logo
  const removeLogo = () => {
    setUploadedLogo(null);
    setLogoPreview(null);
    setLogoError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle select changes
  const handleSelectChange = (name) => (value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle zip formatting
  const handleZipChange = (field) => (e) => {
    const formatted = formatZipCode(e.target.value);
    setFormData(prev => ({ ...prev, [field]: formatted }));
  };

  // Calculate total amount due based on template
  const calculateTotalDue = () => {
    if (selectedProvider?.template === 'template-b') {
      // Water bill calculation
      const waterDeposit = parseFloat(formData.waterDepositApplication) || 0;
      const waterTier1 = parseFloat(formData.waterTier1Charge) || 0;
      const waterTier2 = parseFloat(formData.waterTier2Charge) || 0;
      const costOfBasicService = parseFloat(formData.costOfBasicService) || parseFloat(formData.baseCharge) || 0;
      const sewerCharge = parseFloat(formData.sewerCharge) || 0;
      const streetLightCharge = parseFloat(formData.streetLightCharge) || 0;
      const previousBalance = parseFloat(formData.previousBalance) || 0;
      const paymentReceived = parseFloat(formData.paymentReceived) || 0;
      
      const balanceForward = previousBalance - paymentReceived;
      const currentCharges = waterDeposit + waterTier1 + waterTier2 + costOfBasicService + sewerCharge + streetLightCharge;
      return (balanceForward + currentCharges).toFixed(2);
    } else {
      // Generic utility calculation
      const previous = parseFloat(formData.previousBalance) || 0;
      const payment = parseFloat(formData.paymentReceived) || 0;
      const base = parseFloat(formData.baseCharge) || 0;
      const usage = parseFloat(formData.usageCharge) || 0;
      const taxes = parseFloat(formData.taxes) || 0;
      const fees = parseFloat(formData.fees) || 0;
      const discount = parseFloat(formData.discountAmount) || 0;
      
      const balanceForward = previous - payment;
      const currentCharges = base + usage + taxes + fees - discount;
      return (balanceForward + currentCharges).toFixed(2);
    }
  };

  // Generate PDF preview when form data changes
  useEffect(() => {
    if (!selectedProvider) return;
    
    const timer = setTimeout(async () => {
      setIsGeneratingPreview(true);
      try {
        const previewData = {
          ...formData,
          logoDataUrl: logoPreview
        };
        const previewUrl = await generateUtilityBillPreview(previewData, selectedProvider.template);
        setPdfPreview(previewUrl);
      } catch (error) {
        console.error("Preview generation failed:", error);
      }
      setIsGeneratingPreview(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [formData, selectedProvider, logoPreview]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (providerSearchRef.current && !providerSearchRef.current.contains(event.target)) {
        setShowProviderDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // PayPal handlers
  const createOrder = (data, actions) => {
    const basePrice = 49.99;
    const finalPrice = appliedDiscount ? appliedDiscount.discountedPrice : basePrice;
    return actions.order.create({
      purchase_units: [
        {
          description: `Service Expense - ${formData.companyName || 'Statement'}${appliedDiscount ? ` (${appliedDiscount.discountPercent}% OFF)` : ''}`,
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
      const orderId = orderData.id || `UB-${Date.now()}`;
      toast.success("Payment successful! Generating your Service Expense...");
      
      const fullFormData = {
        ...formData,
        logoDataUrl: logoPreview
      };
      await generateAndDownloadUtilityBill(fullFormData, selectedProvider.template);
      
      toast.success("Service Expense downloaded successfully!");
      setIsProcessing(false);
      
      // Redirect to payment success page
      navigate(`/payment-success?type=utility-bill&order_id=${orderId}&count=1`);
    } catch (error) {
      toast.error("Failed to generate Service Expense");
      setIsProcessing(false);
    }
  };

  const onError = (err) => {
    toast.error("Payment failed. Please try again.");
    console.error("PayPal error:", err);
  };

  // Check if form is valid for payment
  const isFormValid = () => {
    return selectedProvider && uploadedLogo && formData.companyName && formData.customerName && formData.accountNumber;
  };

  // Check if traditional (water bill) template is selected
  const isWaterBillTemplate = selectedProvider?.template === 'template-b';

  return (
    <div className="min-h-screen bg-slate-50">
      <Helmet>
        <title>Service Expense Generator | MintSlip - Create Service Expenses for Budgeting</title>
        <meta name="description" content="Generate professional service expense statements for personal budgeting. Create with MintSlip's easy-to-use generator." />
        <meta name="keywords" content="service expense generator, service expense, budgeting tools" />
        <meta property="og:title" content="Service Expense Generator | MintSlip" />
        <meta property="og:description" content="Create professional service expenses for personal finance and budgeting purposes." />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Service Expense Generator | MintSlip" />
        <meta name="twitter:description" content="Generate service expenses for budgeting with our professional templates." />
      </Helmet>
      
      <Header />
      <div className="max-w-7xl mx-auto px-6 py-8">

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
            Service Expense Generator
          </h1>
          <p className="text-slate-600">Create professional service expense statements for home budgeting</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: Form */}
          <div className="lg:col-span-7">
            <form className="space-y-8 bg-white p-8 rounded-lg shadow-sm border border-slate-200">
              
              {/* Template Selection */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
                  Select Template Style *
                </h2>
                <p className="text-sm text-slate-500">
                  Choose a bill template style that matches your needs
                </p>
                
                <div ref={providerSearchRef} className="relative">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      id="providerSearch"
                      data-testid="provider-search-input"
                      value={providerSearchQuery}
                      onChange={(e) => {
                        setProviderSearchQuery(e.target.value);
                        setShowProviderDropdown(true);
                      }}
                      onFocus={() => setShowProviderDropdown(true)}
                      placeholder="Type to search template styles..."
                      className="pl-10 pr-10"
                    />
                    {selectedProvider && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="w-6 h-6 rounded bg-green-100 flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Provider Dropdown */}
                  {showProviderDropdown && (
                    <div className="absolute z-50 w-full mt-1 bg-white border-2 border-slate-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                      {filteredProviders.length > 0 ? (
                        filteredProviders.map((provider) => (
                          <div
                            key={provider.id}
                            data-testid={`provider-option-${provider.id}`}
                            onClick={() => handleProviderSelect(provider)}
                            className={`flex items-center gap-4 px-4 py-3 cursor-pointer hover:bg-green-50 transition-colors ${
                              selectedProvider?.id === provider.id ? 'bg-green-100' : ''
                            }`}
                          >
                            <div className={`w-10 h-10 rounded flex items-center justify-center ${
                              provider.template === 'template-a' ? 'bg-purple-100' :
                              provider.template === 'template-b' ? 'bg-blue-100' : 'bg-green-100'
                            }`}>
                              {provider.template === 'template-b' ? (
                                <Droplets className="w-5 h-5 text-blue-600" />
                              ) : (
                                <Zap className={`w-5 h-5 ${
                                  provider.template === 'template-a' ? 'text-purple-600' : 'text-green-600'
                                }`} />
                              )}
                            </div>
                            <div>
                              <span className="font-medium text-slate-700 block">{provider.name}</span>
                              <span className="text-xs text-slate-500">{provider.description}</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-3 text-slate-500 text-center">
                          No templates found matching your search.
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Selected Provider Confirmation */}
                {selectedProvider && (
                  <div className={`p-4 border-2 rounded-lg ${
                    selectedProvider.template === 'template-a' ? 'bg-purple-50 border-purple-200' :
                    selectedProvider.template === 'template-b' ? 'bg-blue-50 border-blue-200' : 'bg-green-50 border-green-200'
                  }`}>
                    <div className="flex items-center gap-4">
                      <div className={`w-16 h-16 rounded-lg flex items-center justify-center ${
                        selectedProvider.template === 'template-a' ? 'bg-purple-100' :
                        selectedProvider.template === 'template-b' ? 'bg-blue-100' : 'bg-green-100'
                      }`}>
                        {selectedProvider.template === 'template-b' ? (
                          <Droplets className="w-8 h-8 text-blue-600" />
                        ) : (
                          <Zap className={`w-8 h-8 ${
                            selectedProvider.template === 'template-a' ? 'text-purple-600' : 'text-green-600'
                          }`} />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm font-medium mb-1 ${
                          selectedProvider.template === 'template-a' ? 'text-purple-800' :
                          selectedProvider.template === 'template-b' ? 'text-blue-800' : 'text-green-800'
                        }`}>✓ Template Selected</p>
                        <p className="font-bold text-xl text-slate-800">{selectedProvider.name}</p>
                        <p className="text-sm text-slate-600 mt-1">{selectedProvider.description}</p>
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
                    Upload your utility company logo. PNG or JPG format, max 2MB.
                  </p>
                </div>
                
                {logoPreview ? (
                  <div className="p-4 bg-green-50 border-2 border-green-200 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-24 h-24 rounded-lg bg-white border border-slate-200 flex items-center justify-center overflow-hidden p-2">
                        <img 
                          src={logoPreview} 
                          alt="Company Logo Preview" 
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-green-800 mb-1">✓ Logo Uploaded</p>
                        <p className="font-medium text-slate-800">{uploadedLogo?.name}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          {(uploadedLogo?.size / 1024).toFixed(1)} KB
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={removeLogo}
                          className="mt-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="w-4 h-4 mr-1" /> Remove
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`p-8 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors ${
                      isDragging ? 'border-green-500 bg-green-50' : 'border-slate-300 hover:border-green-400 hover:bg-slate-50'
                    }`}
                  >
                    <Upload className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                    <p className="text-slate-600 mb-1">Drag and drop your logo here, or</p>
                    <Button type="button" variant="outline" size="sm">
                      Select File
                    </Button>
                    <p className="text-xs text-slate-500 mt-2">PNG or JPG, max 2MB</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".png,.jpg,.jpeg"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>
                )}
                {logoError && (
                  <p className="text-sm text-red-600">{logoError}</p>
                )}
              </div>

              {/* Company Information */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
                  Company Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="companyName">Company Name *</Label>
                    <Input 
                      id="companyName"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleChange}
                      placeholder="e.g., County Water System"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="companyAddress">Company Address</Label>
                    <Input 
                      id="companyAddress"
                      name="companyAddress"
                      value={formData.companyAddress}
                      onChange={handleChange}
                      placeholder="660 South Main St SE"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companyCity">City</Label>
                    <Input 
                      id="companyCity"
                      name="companyCity"
                      value={formData.companyCity}
                      onChange={handleChange}
                      placeholder="City"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="companyState">State</Label>
                      <Select value={formData.companyState} onValueChange={handleSelectChange('companyState')}>
                        <SelectTrigger>
                          <SelectValue placeholder="State" />
                        </SelectTrigger>
                        <SelectContent>
                          {US_STATES.map(st => (
                            <SelectItem key={st} value={st}>{st}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="companyZip">ZIP</Label>
                      <Input 
                        id="companyZip"
                        name="companyZip"
                        value={formData.companyZip}
                        onChange={handleZipChange('companyZip')}
                        placeholder="12345"
                        maxLength={10}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companyPhone">Phone Number</Label>
                    <Input 
                      id="companyPhone"
                      name="companyPhone"
                      value={formData.companyPhone}
                      onChange={handleChange}
                      placeholder="770-419-6200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companyFax">Fax Number</Label>
                    <Input 
                      id="companyFax"
                      name="companyFax"
                      value={formData.companyFax}
                      onChange={handleChange}
                      placeholder="770-419-6224"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="companyWebsite">Website</Label>
                    <Input 
                      id="companyWebsite"
                      name="companyWebsite"
                      value={formData.companyWebsite}
                      onChange={handleChange}
                      placeholder="www.watercompany.org/waterpay"
                    />
                  </div>
                  
                  {/* Mailing address for water bill template */}
                  {isWaterBillTemplate && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="companyMailingAddress">Mailing Address (Payment)</Label>
                        <Input 
                          id="companyMailingAddress"
                          name="companyMailingAddress"
                          value={formData.companyMailingAddress}
                          onChange={handleChange}
                          placeholder="PO BOX 580440"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="companyMailingCity">Mailing City, State ZIP</Label>
                        <Input 
                          id="companyMailingCity"
                          name="companyMailingCity"
                          value={formData.companyMailingCity}
                          onChange={handleChange}
                          placeholder="CHARLOTTE NC 28258-0440"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Account Information */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
                  Account Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="accountNumber">Account Number *</Label>
                    <Input 
                      id="accountNumber"
                      name="accountNumber"
                      value={formData.accountNumber}
                      onChange={handleChange}
                      placeholder="e.g., 1217855-189873"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accountStatus">Account Status</Label>
                    <Select value={formData.accountStatus} onValueChange={handleSelectChange('accountStatus')}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Current">Current</SelectItem>
                        <SelectItem value="Past Due">Past Due</SelectItem>
                        <SelectItem value="Pending">Pending</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="customerName">Customer Name *</Label>
                    <Input 
                      id="customerName"
                      name="customerName"
                      value={formData.customerName}
                      onChange={handleChange}
                      placeholder="JOHN DOE"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="serviceAddress">Service Address *</Label>
                    <Input 
                      id="serviceAddress"
                      name="serviceAddress"
                      value={formData.serviceAddress}
                      onChange={handleChange}
                      placeholder="3700 MAIN DR NW"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="serviceCity">City *</Label>
                    <Input 
                      id="serviceCity"
                      name="serviceCity"
                      value={formData.serviceCity}
                      onChange={handleChange}
                      placeholder="City"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="serviceState">State *</Label>
                      <Select value={formData.serviceState} onValueChange={handleSelectChange('serviceState')}>
                        <SelectTrigger>
                          <SelectValue placeholder="State" />
                        </SelectTrigger>
                        <SelectContent>
                          {US_STATES.map(st => (
                            <SelectItem key={st} value={st}>{st}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="serviceZip">ZIP *</Label>
                      <Input 
                        id="serviceZip"
                        name="serviceZip"
                        value={formData.serviceZip}
                        onChange={handleZipChange('serviceZip')}
                        placeholder="30064-1600"
                        maxLength={10}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Billing Period */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
                  Billing Period
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="billingDate">Statement Date</Label>
                    <Input 
                      type="date"
                      id="billingDate"
                      name="billingDate"
                      value={formData.billingDate}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dueDate">Due Date *</Label>
                    <Input 
                      type="date"
                      id="dueDate"
                      name="dueDate"
                      value={formData.dueDate}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="servicePeriodStart">Service Period Start</Label>
                    <Input 
                      type="date"
                      id="servicePeriodStart"
                      name="servicePeriodStart"
                      value={formData.servicePeriodStart}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="servicePeriodEnd">Service Period End</Label>
                    <Input 
                      type="date"
                      id="servicePeriodEnd"
                      name="servicePeriodEnd"
                      value={formData.servicePeriodEnd}
                      onChange={handleChange}
                    />
                  </div>
                  
                  {isWaterBillTemplate && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="daysInPeriod">Days in Period</Label>
                        <Input 
                          id="daysInPeriod"
                          name="daysInPeriod"
                          value={formData.daysInPeriod}
                          onChange={handleChange}
                          placeholder="34"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="billCycle">Bill Cycle</Label>
                        <Input 
                          id="billCycle"
                          name="billCycle"
                          value={formData.billCycle}
                          onChange={handleChange}
                          placeholder="16"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Previous Balance */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
                  Account Activity
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="previousBalance">Previous Balance</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                      <Input 
                        id="previousBalance"
                        name="previousBalance"
                        value={formData.previousBalance}
                        onChange={handleChange}
                        placeholder="58.01"
                        className="pl-8"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="paymentReceived">Payments</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                      <Input 
                        id="paymentReceived"
                        name="paymentReceived"
                        value={formData.paymentReceived}
                        onChange={handleChange}
                        placeholder="58.01"
                        className="pl-8"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="paymentDate">Payment Date</Label>
                    <Input 
                      type="date"
                      id="paymentDate"
                      name="paymentDate"
                      value={formData.paymentDate}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              {/* Water-specific charges (for Traditional template) */}
              {isWaterBillTemplate && (
                <Collapsible open={isWaterChargesOpen} onOpenChange={setIsWaterChargesOpen}>
                  <CollapsibleTrigger asChild>
                    <Button variant="outline" className="w-full justify-between bg-blue-50 border-blue-200 hover:bg-blue-100">
                      <span className="flex items-center gap-2">
                        <Droplets className="w-5 h-5 text-blue-600" />
                        <span className="font-bold text-blue-800">Water Bill Charges (Click to expand)</span>
                      </span>
                      <ChevronDown className={`w-5 h-5 text-blue-600 transition-transform ${isWaterChargesOpen ? 'rotate-180' : ''}`} />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-4 space-y-4 p-4 border border-blue-200 rounded-lg bg-blue-50/50">
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="waterDepositApplication">Water Deposit Application</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                          <Input 
                            id="waterDepositApplication"
                            name="waterDepositApplication"
                            value={formData.waterDepositApplication}
                            onChange={handleChange}
                            placeholder="-50.00"
                            className="pl-8"
                          />
                        </div>
                        <p className="text-xs text-slate-500">Use negative for credits</p>
                      </div>
                    </div>
                    
                    <div className="border-t border-blue-200 pt-4">
                      <h3 className="font-semibold text-blue-800 mb-3">Water Charges (Tiered)</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="waterTier1Gallons">Water Tier 1 (Gallons)</Label>
                          <Input 
                            id="waterTier1Gallons"
                            name="waterTier1Gallons"
                            value={formData.waterTier1Gallons}
                            onChange={handleChange}
                            placeholder="3,000"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="waterTier1Charge">Water Tier 1 Charge</Label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                            <Input 
                              id="waterTier1Charge"
                              name="waterTier1Charge"
                              value={formData.waterTier1Charge}
                              onChange={handleChange}
                              placeholder="11.31"
                              className="pl-8"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="waterTier2Gallons">Water Tier 2 (Gallons)</Label>
                          <Input 
                            id="waterTier2Gallons"
                            name="waterTier2Gallons"
                            value={formData.waterTier2Gallons}
                            onChange={handleChange}
                            placeholder="2,000"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="waterTier2Charge">Water Tier 2 Charge</Label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                            <Input 
                              id="waterTier2Charge"
                              name="waterTier2Charge"
                              value={formData.waterTier2Charge}
                              onChange={handleChange}
                              placeholder="11.64"
                              className="pl-8"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="border-t border-blue-200 pt-4">
                      <h3 className="font-semibold text-blue-800 mb-3">Other Charges</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="costOfBasicService">Cost Of Basic Service</Label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                            <Input 
                              id="costOfBasicService"
                              name="costOfBasicService"
                              value={formData.costOfBasicService}
                              onChange={handleChange}
                              placeholder="8.00"
                              className="pl-8"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="sewerGallons">Sewer (Gallons)</Label>
                          <Input 
                            id="sewerGallons"
                            name="sewerGallons"
                            value={formData.sewerGallons}
                            onChange={handleChange}
                            placeholder="5,000"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="sewerCharge">Sewer Charge</Label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                            <Input 
                              id="sewerCharge"
                              name="sewerCharge"
                              value={formData.sewerCharge}
                              onChange={handleChange}
                              placeholder="36.35"
                              className="pl-8"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="streetLightCharge">Street Light Charge</Label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                            <Input 
                              id="streetLightCharge"
                              name="streetLightCharge"
                              value={formData.streetLightCharge}
                              onChange={handleChange}
                              placeholder="3.80"
                              className="pl-8"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    
                  </CollapsibleContent>
                </Collapsible>
              )}

              {/* Generic Current Charges (for non-water templates) */}
              {!isWaterBillTemplate && (
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
                    Current Charges
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="baseCharge">Base/Service Charge</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                        <Input 
                          id="baseCharge"
                          name="baseCharge"
                          value={formData.baseCharge}
                          onChange={handleChange}
                          placeholder="0.00"
                          className="pl-8"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="usageCharge">Usage Charge</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                        <Input 
                          id="usageCharge"
                          name="usageCharge"
                          value={formData.usageCharge}
                          onChange={handleChange}
                          placeholder="0.00"
                          className="pl-8"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="usageAmount">Usage Amount</Label>
                      <Input 
                        id="usageAmount"
                        name="usageAmount"
                        value={formData.usageAmount}
                        onChange={handleChange}
                        placeholder="e.g., 1500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="usageUnit">Usage Unit</Label>
                      <Select value={formData.usageUnit} onValueChange={handleSelectChange('usageUnit')}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select unit" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="kWh">kWh (Electricity)</SelectItem>
                          <SelectItem value="therms">Therms (Gas)</SelectItem>
                          <SelectItem value="gallons">Gallons (Water)</SelectItem>
                          <SelectItem value="CCF">CCF (Gas)</SelectItem>
                          <SelectItem value="Mbps">Mbps (Internet)</SelectItem>
                          <SelectItem value="GB">GB (Data)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="taxes">Taxes</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                        <Input 
                          id="taxes"
                          name="taxes"
                          value={formData.taxes}
                          onChange={handleChange}
                          placeholder="0.00"
                          className="pl-8"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fees">Fees & Other Charges</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                        <Input 
                          id="fees"
                          name="fees"
                          value={formData.fees}
                          onChange={handleChange}
                          placeholder="0.00"
                          className="pl-8"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Meter Information */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
                  Meter Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="meterNumber">Meter Number</Label>
                    <Input 
                      id="meterNumber"
                      name="meterNumber"
                      value={formData.meterNumber}
                      onChange={handleChange}
                      placeholder="52164363"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="previousReading">Previous Reading</Label>
                    <Input 
                      id="previousReading"
                      name="previousReading"
                      value={formData.previousReading}
                      onChange={handleChange}
                      placeholder="776"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currentReading">Current Reading</Label>
                    <Input 
                      id="currentReading"
                      name="currentReading"
                      value={formData.currentReading}
                      onChange={handleChange}
                      placeholder="781 A"
                    />
                  </div>
                </div>
              </div>

              {/* Discounts (only for non-water templates) */}
              {!isWaterBillTemplate && (
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
                    Discounts (Optional)
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="discountDescription">Discount Description</Label>
                      <Input 
                        id="discountDescription"
                        name="discountDescription"
                        value={formData.discountDescription}
                        onChange={handleChange}
                        placeholder="e.g., Autopay Discount"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="discountAmount">Discount Amount</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                        <Input 
                          id="discountAmount"
                          name="discountAmount"
                          value={formData.discountAmount}
                          onChange={handleChange}
                          placeholder="0.00"
                          className="pl-8"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </form>
          </div>

          {/* Right: Preview and PayPal */}
          <div className="lg:col-span-5">
            <div className="sticky top-24 space-y-6">
              {/* Bill Preview Summary */}
              <div className="p-6 bg-green-50 border-2 border-green-200 rounded-md">
                <h3 className="text-xl font-bold mb-4" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
                  Bill Preview
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between pb-2 border-b border-green-300">
                    <span className="text-slate-700 font-semibold">Template:</span>
                    <span className="font-bold">{selectedProvider?.name || '—'}</span>
                  </div>
                  <div className="flex justify-between pb-2 border-b border-green-300">
                    <span className="text-slate-700 font-semibold">Company:</span>
                    <span className="font-bold">{formData.companyName || '—'}</span>
                  </div>
                  <div className="flex justify-between pb-2 border-b border-green-300">
                    <span className="text-slate-700">Customer:</span>
                    <span className="font-medium">{formData.customerName || '—'}</span>
                  </div>
                  <div className="flex justify-between pb-2 border-b border-green-300">
                    <span className="text-slate-700">Account #:</span>
                    <span className="font-medium">{formData.accountNumber || '—'}</span>
                  </div>
                  <div className="flex justify-between pb-2 border-b border-green-300">
                    <span className="text-slate-700">Service:</span>
                    <span className="font-medium">{isWaterBillTemplate ? 'Water/Sewer' : formData.serviceType}</span>
                  </div>
                  <div className="flex justify-between pb-2 border-b border-green-300">
                    <span className="text-slate-700">Due Date:</span>
                    <span className="font-medium">{formData.dueDate ? new Date(formData.dueDate).toLocaleDateString() : '—'}</span>
                  </div>
                  <div className="pt-2 mt-2">
                    <div className="flex justify-between text-green-700 text-lg">
                      <span className="font-bold">Amount Due:</span>
                      <span className="font-bold">${calculateTotalDue()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Document Preview Section */}
              <div className="p-4 bg-white border-2 border-slate-200 rounded-md">
                <h3 className="text-lg font-bold mb-3" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
                  Document Preview
                </h3>
                <p className="text-xs text-slate-500 mb-3">
                  Click to enlarge • Watermark removed after payment
                </p>
                
                {!selectedProvider ? (
                  <div className="flex items-center justify-center h-96 bg-slate-50 rounded-md border-2 border-dashed border-slate-300">
                    <div className="text-center p-4">
                      <Zap className="h-12 w-12 text-slate-300 mx-auto mb-2" />
                      <p className="text-sm text-slate-500">
                        Select a template<br />to see a preview
                      </p>
                    </div>
                  </div>
                ) : isGeneratingPreview ? (
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
                            alt="Service Expense Preview"
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
                                <Maximize2 className="h-4 w-4" />
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
                      <div className="relative flex-1 h-full overflow-auto p-4">
                        <img
                          src={pdfPreview}
                          alt="Service Expense Preview Full"
                          className="w-full h-auto"
                        />
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
                  <div className="flex items-center justify-center h-96 bg-slate-50 rounded-md border-2 border-dashed border-slate-300">
                    <div className="text-center p-4">
                      <Zap className="h-12 w-12 text-slate-300 mx-auto mb-2" />
                      <p className="text-sm text-slate-500">
                        Fill out the form<br />to see a preview
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* PayPal Payment Section */}
              <div className="p-6 bg-slate-50 border-2 border-slate-200 rounded-md">
                <h3 className="text-lg font-bold mb-4" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
                  Complete Payment
                </h3>
                <p className="text-xs text-slate-500 mb-4 text-center">
                  These service expense templates are provided for personal budgeting and household accounting only.
                </p>
                <p className="text-xs text-slate-500 mb-4 text-center">
                  MintSlip does not provide official records and does not guarantee acceptance for any third-party residency or identity verification.
                  Users are strictly prohibited from using these mockups for fraudulent or deceptive purposes.
                </p>
                
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
                    
                    {!isFormValid() && (
                      <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
                        <p className="text-sm text-amber-700">
                          Please complete the following before download:
                        </p>
                        <ul className="text-xs text-amber-600 mt-1 list-disc list-inside">
                          {!selectedProvider && <li>Select a template</li>}
                          {!uploadedLogo && <li>Upload a company logo</li>}
                          {!formData.companyName && <li>Enter company name</li>}
                          {!formData.customerName && <li>Enter customer name</li>}
                          {!formData.accountNumber && <li>Enter account number</li>}
                        </ul>
                      </div>
                    )}
                    
                    <Button
                      onClick={handleSubscriptionDownload}
                      disabled={isProcessing || !isFormValid()}
                      className="w-full bg-green-600 hover:bg-green-700 text-white py-6 text-lg font-semibold"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          Download Document (Included in Plan)
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <>
                    <CouponInput
                      generatorType="utility-bill"
                      originalPrice={49.99}
                      onDiscountApplied={setAppliedDiscount}
                    />
                    <p className="text-sm text-slate-600 mb-4">
                      Total: <strong>${appliedDiscount ? appliedDiscount.discountedPrice.toFixed(2) : '49.99'}</strong>
                      {appliedDiscount && <span className="text-green-600 ml-1">({appliedDiscount.discountPercent}% off)</span>}
                      {!appliedDiscount && ' for service expense generation'}
                    </p>
                    
                    {!isFormValid() && (
                      <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
                        <p className="text-sm text-amber-700">
                          Please complete the following before payment:
                        </p>
                        <ul className="text-xs text-amber-600 mt-1 list-disc list-inside">
                          {!selectedProvider && <li>Select a template</li>}
                          {!uploadedLogo && <li>Upload a company logo</li>}
                          {!formData.companyName && <li>Enter company name</li>}
                          {!formData.customerName && <li>Enter customer name</li>}
                          {!formData.accountNumber && <li>Enter account number</li>}
                        </ul>
                      </div>
                    )}
                    
                    {isProcessing ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
                        <span className="ml-2 text-slate-600">Processing...</span>
                      </div>
                    ) : (
                      <div className={!isFormValid() ? 'opacity-50 pointer-events-none' : ''}>
                        <Button
                        onClick={handleStripeCheckout}
                        disabled={isProcessing}
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
                            Pay ${appliedDiscount ? appliedDiscount.discountedPrice.toFixed(2) : '9.99'}
                          </>
                        )}
                      </Button>
                      <div className="flex items-center justify-center gap-2 text-xs text-slate-500 mt-2">
                        <Lock className="w-3 h-3" />
                        <span>Secured by Stripe</span>
                      </div>
                      </div>
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
                
                <p className="text-xs text-slate-500 mt-4 text-center">
                  Secure payment via PayPal
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

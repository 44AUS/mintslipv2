import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { PayPalButtons } from "@paypal/react-paypal-js";
import { generateAndDownloadVehicleBillOfSale } from "@/utils/vehicleBillOfSaleGenerator";
import { generateVehicleBillOfSalePreview } from "@/utils/vehicleBillOfSalePreviewGenerator";
import { formatZipCode } from "@/utils/validation";
import { CheckCircle, Car, Sparkles, FileText, Palette, Loader2, Maximize2 } from "lucide-react";

// US States list
const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "DC", "FL", "GA", "HI", "ID", "IL", "IN",
  "IA", "KS", "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH",
  "NJ", "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT",
  "VT", "VA", "WA", "WV", "WI", "WY"
];

// Vehicle body types
const BODY_TYPES = [
  "Sedan", "SUV", "Truck", "Van", "Coupe", "Convertible", "Wagon", "Hatchback", "Minivan", "Crossover", "Sports Car", "Other"
];

// Payment methods
const PAYMENT_METHODS = [
  "Cash", "Certified Check", "Cashier's Check", "Bank Transfer", "Money Order", "Personal Check", "Financing", "Other"
];

// Template options
const TEMPLATES = [
  { value: "classic", label: "Classic", description: "Traditional formal style with navy border", icon: FileText },
  { value: "modern", label: "Modern", description: "Contemporary design with green accents", icon: Sparkles },
  { value: "minimal", label: "Minimal", description: "Clean and simple black & white", icon: Car },
  { value: "custom", label: "Custom", description: "Choose your own colors", icon: Palette }
];

export default function VehicleBillOfSaleForm() {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [pdfPreview, setPdfPreview] = useState(null);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    // Template
    template: "classic",
    primaryColor: "#1a1a4d",
    accentColor: "#3333aa",
    
    // Sale Location
    state: "",
    county: "",
    saleDate: new Date().toISOString().split('T')[0],
    
    // Seller Information
    sellerName: "",
    sellerAddress: "",
    sellerCity: "",
    sellerState: "",
    sellerZip: "",
    sellerId: "",
    sellerIdState: "",
    
    // Buyer Information
    buyerName: "",
    buyerAddress: "",
    buyerCity: "",
    buyerState: "",
    buyerZip: "",
    buyerId: "",
    buyerIdState: "",
    
    // Vehicle Information
    vehicleYear: "",
    vehicleMake: "",
    vehicleModel: "",
    vehicleVin: "",
    vehicleColor: "",
    vehicleBodyType: "",
    odometerReading: "",
    
    // Sale Information
    salePrice: "",
    paymentMethod: "",
    
    // Odometer Disclosure
    odometerDisclosure: "actual",
    
    // Condition Disclosure
    conditionType: "as-is",
    warrantyDetails: "",
    
    // Notary Section
    includeNotary: false,
    notaryState: "",
    notaryCounty: ""
  });

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle select changes
  const handleSelectChange = (name) => (value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle checkbox changes
  const handleCheckboxChange = (name) => (checked) => {
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  // Handle zip formatting
  const handleZipChange = (field) => (e) => {
    const formatted = formatZipCode(e.target.value);
    setFormData(prev => ({ ...prev, [field]: formatted }));
  };

  // Format VIN (uppercase, max 17 chars)
  const handleVinChange = (e) => {
    const value = e.target.value.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, '').slice(0, 17);
    setFormData(prev => ({ ...prev, vehicleVin: value }));
  };

  // Format odometer (numbers only)
  const handleOdometerChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    setFormData(prev => ({ ...prev, odometerReading: value }));
  };

  // Format sale price
  const handlePriceChange = (e) => {
    const value = e.target.value.replace(/[^0-9.]/g, '');
    setFormData(prev => ({ ...prev, salePrice: value }));
  };

  // Generate PDF preview when form data changes (debounced) - always show preview
  useEffect(() => {
    const timer = setTimeout(async () => {
      setIsGeneratingPreview(true);
      try {
        const previewUrl = await generateVehicleBillOfSalePreview(formData);
        setPdfPreview(previewUrl);
      } catch (error) {
        console.error("Preview generation failed:", error);
      }
      setIsGeneratingPreview(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [formData]);

  // PayPal handlers
  const createOrder = (data, actions) => {
    return actions.order.create({
      purchase_units: [
        {
          description: `Vehicle Bill of Sale - ${formData.vehicleYear} ${formData.vehicleMake} ${formData.vehicleModel}`,
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
      toast.success("Payment successful! Generating your bill of sale...");
      
      await generateAndDownloadVehicleBillOfSale(formData);
      
      toast.success("Bill of sale downloaded successfully!");
      setIsProcessing(false);
    } catch (error) {
      toast.error("Failed to generate bill of sale");
      setIsProcessing(false);
    }
  };

  const onError = (err) => {
    toast.error("Payment failed. Please try again.");
    console.error("PayPal error:", err);
  };

  // Format sale price for display
  const formatSalePrice = () => {
    const amount = parseFloat(formData.salePrice) || 0;
    return amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  };

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
            Vehicle Bill of Sale Generator
          </h1>
          <p className="text-slate-600">Create a professional vehicle bill of sale document for private party sales</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: Form */}
          <div className="lg:col-span-7">
            <form className="space-y-8 bg-white p-8 rounded-lg shadow-sm border border-slate-200">
              
              {/* Template Selection */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
                  Template Style
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {TEMPLATES.map((tmpl) => (
                    <button
                      key={tmpl.value}
                      type="button"
                      onClick={() => setFormData({...formData, template: tmpl.value})}
                      className={`relative flex flex-col items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        formData.template === tmpl.value 
                          ? 'border-green-600 bg-green-50 ring-2 ring-green-200' 
                          : 'border-slate-200 hover:border-green-400 hover:bg-slate-50'
                      }`}
                    >
                      {formData.template === tmpl.value && (
                        <div className="absolute top-2 right-2 bg-green-600 text-white rounded-full p-1">
                          <CheckCircle className="w-3 h-3" />
                        </div>
                      )}
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                        formData.template === tmpl.value ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-600'
                      }`}>
                        <tmpl.icon className="w-5 h-5" />
                      </div>
                      <span className="font-semibold text-slate-800 text-sm">{tmpl.label}</span>
                      <span className="text-xs text-slate-500 mt-1 text-center">{tmpl.description}</span>
                    </button>
                  ))}
                </div>
                
                {/* Custom template colors */}
                {formData.template === "custom" && (
                  <div className="grid grid-cols-2 gap-4 mt-4 p-4 bg-slate-50 rounded-lg">
                    <div className="space-y-2">
                      <Label htmlFor="primaryColor">Primary Color</Label>
                      <div className="flex gap-2">
                        <Input 
                          type="color" 
                          id="primaryColor"
                          name="primaryColor"
                          value={formData.primaryColor}
                          onChange={handleChange}
                          className="w-12 h-10 p-1 cursor-pointer"
                        />
                        <Input 
                          type="text" 
                          value={formData.primaryColor}
                          onChange={handleChange}
                          name="primaryColor"
                          className="flex-1"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="accentColor">Accent Color</Label>
                      <div className="flex gap-2">
                        <Input 
                          type="color" 
                          id="accentColor"
                          name="accentColor"
                          value={formData.accentColor}
                          onChange={handleChange}
                          className="w-12 h-10 p-1 cursor-pointer"
                        />
                        <Input 
                          type="text" 
                          value={formData.accentColor}
                          onChange={handleChange}
                          name="accentColor"
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Sale Location & Date */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
                  Sale Location & Date
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="state">State *</Label>
                    <Select value={formData.state} onValueChange={handleSelectChange('state')}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent>
                        {US_STATES.map(st => (
                          <SelectItem key={st} value={st}>{st}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="county">County *</Label>
                    <Input 
                      id="county"
                      name="county"
                      value={formData.county}
                      onChange={handleChange}
                      placeholder="e.g., Los Angeles"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="saleDate">Sale Date *</Label>
                    <Input 
                      type="date"
                      id="saleDate"
                      name="saleDate"
                      value={formData.saleDate}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              {/* Seller Information */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
                  Seller Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="sellerName">Full Legal Name *</Label>
                    <Input 
                      id="sellerName"
                      name="sellerName"
                      value={formData.sellerName}
                      onChange={handleChange}
                      placeholder="John Doe"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="sellerAddress">Street Address *</Label>
                    <Input 
                      id="sellerAddress"
                      name="sellerAddress"
                      value={formData.sellerAddress}
                      onChange={handleChange}
                      placeholder="123 Main Street"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sellerCity">City *</Label>
                    <Input 
                      id="sellerCity"
                      name="sellerCity"
                      value={formData.sellerCity}
                      onChange={handleChange}
                      placeholder="Los Angeles"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="sellerState">State *</Label>
                      <Select value={formData.sellerState} onValueChange={handleSelectChange('sellerState')}>
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
                      <Label htmlFor="sellerZip">ZIP Code *</Label>
                      <Input 
                        id="sellerZip"
                        name="sellerZip"
                        value={formData.sellerZip}
                        onChange={handleZipChange('sellerZip')}
                        placeholder="90001"
                        maxLength={10}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sellerId">Driver&apos;s License / ID Number</Label>
                    <Input 
                      id="sellerId"
                      name="sellerId"
                      value={formData.sellerId}
                      onChange={handleChange}
                      placeholder="D1234567"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sellerIdState">ID State</Label>
                    <Select value={formData.sellerIdState} onValueChange={handleSelectChange('sellerIdState')}>
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
                </div>
              </div>

              {/* Buyer Information */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
                  Buyer Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="buyerName">Full Legal Name *</Label>
                    <Input 
                      id="buyerName"
                      name="buyerName"
                      value={formData.buyerName}
                      onChange={handleChange}
                      placeholder="Jane Smith"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="buyerAddress">Street Address *</Label>
                    <Input 
                      id="buyerAddress"
                      name="buyerAddress"
                      value={formData.buyerAddress}
                      onChange={handleChange}
                      placeholder="456 Oak Avenue"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="buyerCity">City *</Label>
                    <Input 
                      id="buyerCity"
                      name="buyerCity"
                      value={formData.buyerCity}
                      onChange={handleChange}
                      placeholder="San Francisco"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="buyerState">State *</Label>
                      <Select value={formData.buyerState} onValueChange={handleSelectChange('buyerState')}>
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
                      <Label htmlFor="buyerZip">ZIP Code *</Label>
                      <Input 
                        id="buyerZip"
                        name="buyerZip"
                        value={formData.buyerZip}
                        onChange={handleZipChange('buyerZip')}
                        placeholder="94102"
                        maxLength={10}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="buyerId">Driver&apos;s License / ID Number</Label>
                    <Input 
                      id="buyerId"
                      name="buyerId"
                      value={formData.buyerId}
                      onChange={handleChange}
                      placeholder="B7654321"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="buyerIdState">ID State</Label>
                    <Select value={formData.buyerIdState} onValueChange={handleSelectChange('buyerIdState')}>
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
                </div>
              </div>

              {/* Vehicle Information */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
                  Vehicle Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="vehicleYear">Year *</Label>
                    <Input 
                      id="vehicleYear"
                      name="vehicleYear"
                      value={formData.vehicleYear}
                      onChange={handleChange}
                      placeholder="2020"
                      maxLength={4}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vehicleMake">Make *</Label>
                    <Input 
                      id="vehicleMake"
                      name="vehicleMake"
                      value={formData.vehicleMake}
                      onChange={handleChange}
                      placeholder="Toyota"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vehicleModel">Model *</Label>
                    <Input 
                      id="vehicleModel"
                      name="vehicleModel"
                      value={formData.vehicleModel}
                      onChange={handleChange}
                      placeholder="Camry"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="vehicleVin">VIN (Vehicle Identification Number) *</Label>
                    <Input 
                      id="vehicleVin"
                      name="vehicleVin"
                      value={formData.vehicleVin}
                      onChange={handleVinChange}
                      placeholder="1HGBH41JXMN109186"
                      maxLength={17}
                      className="font-mono uppercase"
                    />
                    <p className="text-xs text-slate-500">17 characters - letters (except I, O, Q) and numbers</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vehicleColor">Color</Label>
                    <Input 
                      id="vehicleColor"
                      name="vehicleColor"
                      value={formData.vehicleColor}
                      onChange={handleChange}
                      placeholder="Silver"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vehicleBodyType">Body Type</Label>
                    <Select value={formData.vehicleBodyType} onValueChange={handleSelectChange('vehicleBodyType')}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {BODY_TYPES.map(type => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="odometerReading">Odometer Reading *</Label>
                    <div className="relative">
                      <Input 
                        id="odometerReading"
                        name="odometerReading"
                        value={formData.odometerReading}
                        onChange={handleOdometerChange}
                        placeholder="45000"
                        className="pr-16"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">miles</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sale Information */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
                  Sale Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="salePrice">Sale Price *</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                      <Input 
                        id="salePrice"
                        name="salePrice"
                        value={formData.salePrice}
                        onChange={handlePriceChange}
                        placeholder="15000.00"
                        className="pl-8"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="paymentMethod">Payment Method *</Label>
                    <Select value={formData.paymentMethod} onValueChange={handleSelectChange('paymentMethod')}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select method" />
                      </SelectTrigger>
                      <SelectContent>
                        {PAYMENT_METHODS.map(method => (
                          <SelectItem key={method} value={method}>{method}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Odometer Disclosure */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
                  Odometer Disclosure
                </h2>
                <p className="text-sm text-slate-600">Federal law requires the seller to disclose the odometer reading.</p>
                <RadioGroup 
                  value={formData.odometerDisclosure} 
                  onValueChange={(value) => setFormData({...formData, odometerDisclosure: value})}
                  className="space-y-3"
                >
                  <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-slate-50">
                    <RadioGroupItem value="actual" id="odometer-actual" />
                    <Label htmlFor="odometer-actual" className="cursor-pointer flex-1">
                      <span className="font-medium">Actual Mileage</span>
                      <p className="text-sm text-slate-500">The odometer reflects the actual mileage of the vehicle</p>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-slate-50">
                    <RadioGroupItem value="exceeds" id="odometer-exceeds" />
                    <Label htmlFor="odometer-exceeds" className="cursor-pointer flex-1">
                      <span className="font-medium">Exceeds Mechanical Limits</span>
                      <p className="text-sm text-slate-500">The odometer reading exceeds the odometer&apos;s mechanical limits</p>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-slate-50">
                    <RadioGroupItem value="discrepancy" id="odometer-discrepancy" />
                    <Label htmlFor="odometer-discrepancy" className="cursor-pointer flex-1">
                      <span className="font-medium">Discrepancy Exists</span>
                      <p className="text-sm text-slate-500">The odometer reading is NOT the actual mileage (discrepancy exists)</p>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Condition Disclosure */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
                  Condition Disclosure
                </h2>
                <RadioGroup 
                  value={formData.conditionType} 
                  onValueChange={(value) => setFormData({...formData, conditionType: value})}
                  className="space-y-3"
                >
                  <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-slate-50">
                    <RadioGroupItem value="as-is" id="condition-asis" />
                    <Label htmlFor="condition-asis" className="cursor-pointer flex-1">
                      <span className="font-medium">AS-IS (No Warranty)</span>
                      <p className="text-sm text-slate-500">The vehicle is sold &quot;as-is&quot; without any warranty, express or implied</p>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-slate-50">
                    <RadioGroupItem value="warranty" id="condition-warranty" />
                    <Label htmlFor="condition-warranty" className="cursor-pointer flex-1">
                      <span className="font-medium">With Warranty</span>
                      <p className="text-sm text-slate-500">The seller provides a warranty for the vehicle</p>
                    </Label>
                  </div>
                </RadioGroup>
                
                {formData.conditionType === "warranty" && (
                  <div className="space-y-2 mt-4">
                    <Label htmlFor="warrantyDetails">Warranty Details</Label>
                    <Textarea 
                      id="warrantyDetails"
                      name="warrantyDetails"
                      value={formData.warrantyDetails}
                      onChange={handleChange}
                      placeholder="Describe the warranty terms (e.g., 30-day powertrain warranty, 90-day bumper-to-bumper, etc.)"
                      rows={3}
                    />
                  </div>
                )}
              </div>

              {/* Notary Section (Optional) */}
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Checkbox 
                    id="includeNotary" 
                    checked={formData.includeNotary}
                    onCheckedChange={handleCheckboxChange('includeNotary')}
                  />
                  <Label htmlFor="includeNotary" className="cursor-pointer">
                    <span className="font-medium text-lg" style={{ color: '#1a4731' }}>Include Notary Section</span>
                    <p className="text-sm text-slate-500">Add an optional notary acknowledgment section to the document</p>
                  </Label>
                </div>
                
                {formData.includeNotary && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg">
                    <div className="space-y-2">
                      <Label htmlFor="notaryState">Notary State</Label>
                      <Select value={formData.notaryState} onValueChange={handleSelectChange('notaryState')}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select state" />
                        </SelectTrigger>
                        <SelectContent>
                          {US_STATES.map(st => (
                            <SelectItem key={st} value={st}>{st}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="notaryCounty">Notary County</Label>
                      <Input 
                        id="notaryCounty"
                        name="notaryCounty"
                        value={formData.notaryCounty}
                        onChange={handleChange}
                        placeholder="County name"
                      />
                    </div>
                  </div>
                )}
              </div>

            </form>
          </div>

          {/* Right: Summary & Preview */}
          <div className="lg:col-span-5">
            <div className="sticky top-6 space-y-6 max-h-[calc(100vh-3rem)] overflow-y-auto">
            {/* Summary Card */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
              <h3 className="text-xl font-bold mb-4" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
                Bill of Sale Summary
              </h3>
              
              <div className="space-y-4 text-sm">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-slate-600">Template:</span>
                  <span className="font-medium capitalize">{formData.template}</span>
                </div>
                
                <div className="py-2 border-b">
                  <span className="text-slate-600 block mb-1">Vehicle:</span>
                  <span className="font-medium">
                    {formData.vehicleYear && formData.vehicleMake && formData.vehicleModel 
                      ? `${formData.vehicleYear} ${formData.vehicleMake} ${formData.vehicleModel}`
                      : 'Not specified'}
                  </span>
                </div>
                
                {formData.vehicleVin && (
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-slate-600">VIN:</span>
                    <span className="font-mono text-xs">{formData.vehicleVin}</span>
                  </div>
                )}
                
                <div className="flex justify-between py-2 border-b">
                  <span className="text-slate-600">Seller:</span>
                  <span className="font-medium">{formData.sellerName || 'Not specified'}</span>
                </div>
                
                <div className="flex justify-between py-2 border-b">
                  <span className="text-slate-600">Buyer:</span>
                  <span className="font-medium">{formData.buyerName || 'Not specified'}</span>
                </div>
                
                <div className="flex justify-between py-2 border-b">
                  <span className="text-slate-600">Sale Price:</span>
                  <span className="font-bold text-green-700">{formData.salePrice ? formatSalePrice() : '$0.00'}</span>
                </div>
                
                <div className="flex justify-between py-2 border-b">
                  <span className="text-slate-600">Odometer:</span>
                  <span className="font-medium">{formData.odometerReading ? `${parseInt(formData.odometerReading).toLocaleString()} miles` : 'Not specified'}</span>
                </div>
                
                <div className="flex justify-between py-2 border-b">
                  <span className="text-slate-600">Condition:</span>
                  <span className="font-medium">{formData.conditionType === 'as-is' ? 'AS-IS' : 'With Warranty'}</span>
                </div>
                
                <div className="flex justify-between py-2">
                  <span className="text-slate-600">Notary Section:</span>
                  <span className="font-medium">{formData.includeNotary ? 'Included' : 'Not included'}</span>
                </div>
              </div>
            </div>

            {/* PDF Preview */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
                  Document Preview
                </h3>
                {pdfPreview && (
                  <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Maximize2 className="w-4 h-4" />
                        Expand Preview
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl h-[90vh]">
                      <DialogHeader>
                        <DialogTitle>Vehicle Bill of Sale Preview</DialogTitle>
                      </DialogHeader>
                      <iframe 
                        src={pdfPreview}
                        className="w-full h-full rounded-md border"
                        title="Bill of Sale Preview"
                      />
                    </DialogContent>
                  </Dialog>
                )}
              </div>
              
              <div className="relative bg-slate-100 rounded-md overflow-hidden" style={{ minHeight: '400px' }}>
                {isGeneratingPreview ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-green-600" />
                  </div>
                ) : pdfPreview ? (
                  <>
                    <iframe 
                      src={pdfPreview}
                      className="w-full h-96 rounded-md"
                      title="Bill of Sale Preview"
                    />
                    <div className="absolute bottom-2 left-2 right-2 bg-amber-100 text-amber-800 text-xs p-2 rounded text-center">
                      Watermark removed after payment
                    </div>
                  </>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-green-600" />
                  </div>
                )}
              </div>
            </div>

            {/* Payment Section */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
              <h3 className="text-xl font-bold mb-4" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
                Generate Your Document
              </h3>
              
              <div className="mb-4 p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex justify-between items-center">
                  <span className="text-green-800 font-medium">Vehicle Bill of Sale</span>
                  <span className="text-2xl font-bold text-green-800">$10.00</span>
                </div>
                <p className="text-sm text-green-700 mt-1">One-time payment • Instant PDF download</p>
              </div>
              
              {isProcessing ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-green-600" />
                  <span className="ml-2 text-slate-600">Processing...</span>
                </div>
              ) : (
                <PayPalButtons
                  style={{ layout: "vertical", shape: "rect" }}
                  createOrder={createOrder}
                  onApprove={onApprove}
                  onError={onError}
                />
              )}
              
              <p className="text-xs text-slate-500 mt-4 text-center">
                Secure payment via PayPal. Your document will be generated immediately after payment.
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

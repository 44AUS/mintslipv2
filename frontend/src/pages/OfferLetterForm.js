import { useState, useEffect, useRef } from "react";
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
import { toast } from "sonner";
import { PayPalButtons } from "@paypal/react-paypal-js";
import { generateAndDownloadOfferLetter } from "@/utils/offerLetterGenerator";
import { generateOfferLetterPreview } from "@/utils/offerLetterPreviewGenerator";
import { formatPhoneNumber, formatZipCode } from "@/utils/validation";
import { Upload, X, CheckCircle, Briefcase, Sparkles, Palette } from "lucide-react";

// US States list
const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "DC", "FL", "GA", "HI", "ID", "IL", "IN",
  "IA", "KS", "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH",
  "NJ", "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT",
  "VT", "VA", "WA", "WV", "WI", "WY"
];

// Template options
const TEMPLATES = [
  { value: "professional", label: "Professional/Corporate", description: "Traditional business style with formal tone" },
  { value: "modern", label: "Modern/Clean", description: "Contemporary design with clean lines" },
  { value: "custom", label: "Custom", description: "Customize colors and add your own content" }
];

// Employment types
const EMPLOYMENT_TYPES = [
  { value: "full-time", label: "Full-Time" },
  { value: "part-time", label: "Part-Time" },
  { value: "contract", label: "Contract" },
  { value: "temporary", label: "Temporary" },
  { value: "internship", label: "Internship" }
];

// Compensation types
const COMPENSATION_TYPES = [
  { value: "annual", label: "Annual Salary" },
  { value: "hourly", label: "Hourly Rate" },
  { value: "monthly", label: "Monthly Salary" }
];

// Work location types
const WORK_LOCATIONS = [
  { value: "on-site", label: "On-Site" },
  { value: "remote", label: "Remote" },
  { value: "hybrid", label: "Hybrid" }
];

export default function OfferLetterForm() {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [pdfPreview, setPdfPreview] = useState(null);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  
  // Drag state for file uploads
  const [isDraggingLogo, setIsDraggingLogo] = useState(false);
  const [isDraggingHrSig, setIsDraggingHrSig] = useState(false);
  const [isDraggingEmpSig, setIsDraggingEmpSig] = useState(false);
  
  // File input refs
  const logoInputRef = useRef(null);
  const hrSigInputRef = useRef(null);
  const empSigInputRef = useRef(null);

  const [formData, setFormData] = useState({
    // Template
    template: "professional",
    
    // Company Information
    companyName: "",
    companyLogo: null, // Base64 logo image
    companyLogoName: "",
    companyAddress: "",
    companyCity: "",
    companyState: "",
    companyZip: "",
    companyPhone: "",
    companyEmail: "",
    companyWebsite: "",
    
    // Candidate Information
    candidateName: "",
    candidateAddress: "",
    candidateCity: "",
    candidateState: "",
    candidateZip: "",
    
    // Position Details
    jobTitle: "",
    department: "",
    employmentType: "full-time",
    workLocation: "on-site",
    workAddress: "",
    startDate: "",
    reportingManager: "",
    reportingTitle: "",
    
    // Compensation
    compensationType: "annual",
    compensationAmount: "",
    payFrequency: "bi-weekly",
    
    // Benefits
    benefits: "• Health Insurance (Medical, Dental, Vision)\n• 401(k) Retirement Plan with company match\n• Paid Time Off (PTO)\n• Paid Holidays\n• Life Insurance\n• Professional Development",
    
    // Additional Terms
    additionalTerms: "",
    
    // Response deadline
    responseDeadline: "",
    
    // HR Signature
    signerName: "",
    signerTitle: "",
    hrSignatureType: "generated", // "generated" or "custom"
    hrSignatureImage: null, // Base64 signature image
    letterDate: new Date().toISOString().split('T')[0],
    
    // Employee Signature
    employeeSignatureType: "generated", // "generated" or "custom"
    employeeSignatureImage: null, // Base64 signature image
    employeeSignatureName: "", // Name for generated signature
    
    // Custom template options
    primaryColor: "#1a4731",
    accentColor: "#059669"
  });

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle phone formatting
  const handlePhoneChange = (e) => {
    const formatted = formatPhoneNumber(e.target.value);
    setFormData(prev => ({ ...prev, companyPhone: formatted }));
  };

  // Handle zip formatting
  const handleZipChange = (field) => (e) => {
    const formatted = formatZipCode(e.target.value);
    setFormData(prev => ({ ...prev, [field]: formatted }));
  };

  // Handle logo upload
  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    processLogoFile(file);
  };

  const processLogoFile = (file) => {
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Logo file size must be less than 2MB");
        return;
      }
      if (!file.type.includes('image')) {
        toast.error("Please upload an image file (PNG, JPG)");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ 
          ...prev, 
          companyLogo: reader.result,
          companyLogoName: file.name
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle logo drag and drop
  const handleLogoDrop = (e) => {
    e.preventDefault();
    setIsDraggingLogo(false);
    const file = e.dataTransfer.files[0];
    processLogoFile(file);
  };

  // Remove logo
  const removeLogo = () => {
    setFormData(prev => ({ ...prev, companyLogo: null, companyLogoName: "" }));
    if (logoInputRef.current) logoInputRef.current.value = '';
  };

  // Handle signature upload
  const handleSignatureUpload = (field) => (e) => {
    const file = e.target.files?.[0];
    processSignatureFile(file, field);
  };

  const processSignatureFile = (file, field) => {
    if (file) {
      if (file.size > 1 * 1024 * 1024) {
        toast.error("Signature file size must be less than 1MB");
        return;
      }
      if (!file.type.includes('image')) {
        toast.error("Please upload an image file (PNG, JPG)");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, [field]: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle signature drag and drop
  const handleSignatureDrop = (field, setDragging) => (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    processSignatureFile(file, field);
  };

  // Remove HR signature
  const removeHrSignature = () => {
    setFormData(prev => ({ ...prev, hrSignatureImage: null }));
    if (hrSigInputRef.current) hrSigInputRef.current.value = '';
  };

  // Remove Employee signature
  const removeEmpSignature = () => {
    setFormData(prev => ({ ...prev, employeeSignatureImage: null }));
    if (empSigInputRef.current) empSigInputRef.current.value = '';
  };

  // Generate PDF preview when form data changes (debounced)
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (formData.companyName && formData.candidateName) {
        setIsGeneratingPreview(true);
        try {
          const previewUrl = await generateOfferLetterPreview(formData);
          setPdfPreview(previewUrl);
        } catch (error) {
          console.error("Preview generation failed:", error);
        }
        setIsGeneratingPreview(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData]);

  // PayPal handlers
  const createOrder = (data, actions) => {
    return actions.order.create({
      purchase_units: [
        {
          description: `Offer Letter - ${formData.candidateName}`,
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
      toast.success("Payment successful! Generating your offer letter...");
      
      await generateAndDownloadOfferLetter(formData);
      
      toast.success("Offer letter downloaded successfully!");
      setIsProcessing(false);
    } catch (error) {
      toast.error("Failed to generate offer letter");
      setIsProcessing(false);
    }
  };

  const onError = (err) => {
    toast.error("Payment failed. Please try again.");
    console.error("PayPal error:", err);
  };

  // Format compensation for display
  const formatCompensation = () => {
    const amount = parseFloat(formData.compensationAmount) || 0;
    const formatted = amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
    switch (formData.compensationType) {
      case "annual": return `${formatted}/year`;
      case "hourly": return `${formatted}/hour`;
      case "monthly": return `${formatted}/month`;
      default: return formatted;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <div className="max-w-7xl mx-auto px-6 py-8">

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
            Offer Letter Generator
          </h1>
          <p className="text-slate-600">Create professional employment offer letters with customizable templates</p>
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Professional Template */}
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, template: 'professional'})}
                    className={`relative flex flex-col items-center p-6 border-2 rounded-lg cursor-pointer transition-all ${
                      formData.template === 'professional' 
                        ? 'border-green-600 bg-green-50 ring-2 ring-green-200' 
                        : 'border-slate-200 hover:border-green-400 hover:bg-slate-50'
                    }`}
                  >
                    {formData.template === 'professional' && (
                      <div className="absolute top-2 right-2 bg-green-600 text-white rounded-full p-1">
                        <CheckCircle className="w-4 h-4" />
                      </div>
                    )}
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${
                      formData.template === 'professional' ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}>
                      <Briefcase className="w-6 h-6" />
                    </div>
                    <span className="font-semibold text-slate-800">Professional</span>
                    <span className="text-xs text-slate-500 mt-1 text-center">Traditional business style</span>
                  </button>

                  {/* Modern Template */}
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, template: 'modern'})}
                    className={`relative flex flex-col items-center p-6 border-2 rounded-lg cursor-pointer transition-all ${
                      formData.template === 'modern' 
                        ? 'border-green-600 bg-green-50 ring-2 ring-green-200' 
                        : 'border-slate-200 hover:border-green-400 hover:bg-slate-50'
                    }`}
                  >
                    {formData.template === 'modern' && (
                      <div className="absolute top-2 right-2 bg-green-600 text-white rounded-full p-1">
                        <CheckCircle className="w-4 h-4" />
                      </div>
                    )}
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${
                      formData.template === 'modern' ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}>
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <span className="font-semibold text-slate-800">Modern</span>
                    <span className="text-xs text-slate-500 mt-1 text-center">Contemporary clean design</span>
                  </button>

                  {/* Custom Template */}
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, template: 'custom'})}
                    className={`relative flex flex-col items-center p-6 border-2 rounded-lg cursor-pointer transition-all ${
                      formData.template === 'custom' 
                        ? 'border-green-600 bg-green-50 ring-2 ring-green-200' 
                        : 'border-slate-200 hover:border-green-400 hover:bg-slate-50'
                    }`}
                  >
                    {formData.template === 'custom' && (
                      <div className="absolute top-2 right-2 bg-green-600 text-white rounded-full p-1">
                        <CheckCircle className="w-4 h-4" />
                      </div>
                    )}
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${
                      formData.template === 'custom' ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}>
                      <Palette className="w-6 h-6" />
                    </div>
                    <span className="font-semibold text-slate-800">Custom</span>
                    <span className="text-xs text-slate-500 mt-1 text-center">Choose your own colors</span>
                  </button>
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
                      placeholder="Acme Corporation"
                      value={formData.companyName} 
                      onChange={handleChange}
                    />
                  </div>
                  
                  {/* Company Logo Upload */}
                  <div className="space-y-2 md:col-span-2">
                    <Label>Company Logo (optional)</Label>
                    <p className="text-xs text-slate-500 mb-2">Upload a logo to replace the company name text in the header</p>
                    
                    <div
                      onDragOver={(e) => { e.preventDefault(); setIsDraggingLogo(true); }}
                      onDragLeave={(e) => { e.preventDefault(); setIsDraggingLogo(false); }}
                      onDrop={handleLogoDrop}
                      className={`relative border-2 border-dashed rounded-lg p-6 transition-all ${
                        isDraggingLogo 
                          ? 'border-green-500 bg-green-50' 
                          : 'border-slate-300 hover:border-green-400'
                      }`}
                    >
                      {formData.companyLogo ? (
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <img 
                              src={formData.companyLogo} 
                              alt="Company Logo" 
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
                            <p className="text-xs text-slate-500 mt-1">{formData.companyLogoName}</p>
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
                            accept="image/png,image/jpeg,image/jpg"
                            onChange={handleLogoUpload}
                            className="hidden"
                          />
                          <p className="text-xs text-slate-400 mt-3">
                            PNG or JPG, max 2MB
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="companyAddress">Company Address</Label>
                    <Input 
                      id="companyAddress" 
                      name="companyAddress" 
                      placeholder="123 Business Ave, Suite 100"
                      value={formData.companyAddress} 
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companyCity">City</Label>
                    <Input 
                      id="companyCity" 
                      name="companyCity" 
                      placeholder="New York"
                      value={formData.companyCity} 
                      onChange={handleChange}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="companyState">State</Label>
                      <Select value={formData.companyState} onValueChange={(val) => setFormData({...formData, companyState: val})}>
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
                      <Label htmlFor="companyZip">ZIP</Label>
                      <Input 
                        id="companyZip" 
                        name="companyZip" 
                        placeholder="10001"
                        value={formData.companyZip} 
                        onChange={handleZipChange('companyZip')}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companyPhone">Phone</Label>
                    <Input 
                      id="companyPhone" 
                      name="companyPhone" 
                      placeholder="(555) 123-4567"
                      value={formData.companyPhone} 
                      onChange={handlePhoneChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companyEmail">Email</Label>
                    <Input 
                      id="companyEmail" 
                      name="companyEmail" 
                      type="email"
                      placeholder="hr@company.com"
                      value={formData.companyEmail} 
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              {/* Candidate Information */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
                  Candidate Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="candidateName">Candidate Name *</Label>
                    <Input 
                      id="candidateName" 
                      name="candidateName" 
                      placeholder="John Smith"
                      value={formData.candidateName} 
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="candidateAddress">Address</Label>
                    <Input 
                      id="candidateAddress" 
                      name="candidateAddress" 
                      placeholder="456 Main Street, Apt 2B"
                      value={formData.candidateAddress} 
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="candidateCity">City</Label>
                    <Input 
                      id="candidateCity" 
                      name="candidateCity" 
                      placeholder="Brooklyn"
                      value={formData.candidateCity} 
                      onChange={handleChange}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="candidateState">State</Label>
                      <Select value={formData.candidateState} onValueChange={(val) => setFormData({...formData, candidateState: val})}>
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
                      <Label htmlFor="candidateZip">ZIP</Label>
                      <Input 
                        id="candidateZip" 
                        name="candidateZip" 
                        placeholder="11201"
                        value={formData.candidateZip} 
                        onChange={handleZipChange('candidateZip')}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Position Details */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
                  Position Details
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="jobTitle">Job Title *</Label>
                    <Input 
                      id="jobTitle" 
                      name="jobTitle" 
                      placeholder="Software Engineer"
                      value={formData.jobTitle} 
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Input 
                      id="department" 
                      name="department" 
                      placeholder="Engineering"
                      value={formData.department} 
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="employmentType">Employment Type *</Label>
                    <Select value={formData.employmentType} onValueChange={(val) => setFormData({...formData, employmentType: val})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {EMPLOYMENT_TYPES.map(type => (
                          <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="workLocation">Work Location *</Label>
                    <Select value={formData.workLocation} onValueChange={(val) => setFormData({...formData, workLocation: val})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {WORK_LOCATIONS.map(loc => (
                          <SelectItem key={loc.value} value={loc.value}>{loc.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date *</Label>
                    <Input 
                      id="startDate" 
                      name="startDate" 
                      type="date"
                      value={formData.startDate} 
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="responseDeadline">Response Deadline</Label>
                    <Input 
                      id="responseDeadline" 
                      name="responseDeadline" 
                      type="date"
                      value={formData.responseDeadline} 
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reportingManager">Reporting Manager</Label>
                    <Input 
                      id="reportingManager" 
                      name="reportingManager" 
                      placeholder="Jane Doe"
                      value={formData.reportingManager} 
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reportingTitle">Manager Title</Label>
                    <Input 
                      id="reportingTitle" 
                      name="reportingTitle" 
                      placeholder="Engineering Manager"
                      value={formData.reportingTitle} 
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              {/* Compensation */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
                  Compensation
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="compensationType">Compensation Type *</Label>
                    <Select value={formData.compensationType} onValueChange={(val) => setFormData({...formData, compensationType: val})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {COMPENSATION_TYPES.map(type => (
                          <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="compensationAmount">Amount *</Label>
                    <Input 
                      id="compensationAmount" 
                      name="compensationAmount" 
                      type="number"
                      step="0.01"
                      placeholder={formData.compensationType === "hourly" ? "35.00" : "75000"}
                      value={formData.compensationAmount} 
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="payFrequency">Pay Frequency</Label>
                    <Select value={formData.payFrequency} onValueChange={(val) => setFormData({...formData, payFrequency: val})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="bi-weekly">Bi-Weekly</SelectItem>
                        <SelectItem value="semi-monthly">Semi-Monthly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Benefits */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
                  Benefits
                </h2>
                <div className="space-y-2">
                  <Label htmlFor="benefits">Benefits Summary</Label>
                  <Textarea 
                    id="benefits" 
                    name="benefits" 
                    rows={6}
                    placeholder="List the benefits included with this position..."
                    value={formData.benefits} 
                    onChange={handleChange}
                  />
                  <p className="text-xs text-slate-500">Use bullet points (•) to format the list</p>
                </div>
              </div>

              {/* Additional Terms */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
                  Additional Terms
                </h2>
                <div className="space-y-2">
                  <Label htmlFor="additionalTerms">Additional Terms or Conditions (optional)</Label>
                  <Textarea 
                    id="additionalTerms" 
                    name="additionalTerms" 
                    rows={4}
                    placeholder="Any additional terms, conditions, or notes..."
                    value={formData.additionalTerms} 
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* HR Signature */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
                  HR Director Signature
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="signerName">Signer Name *</Label>
                    <Input 
                      id="signerName" 
                      name="signerName" 
                      placeholder="HR Director Name"
                      value={formData.signerName} 
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signerTitle">Signer Title *</Label>
                    <Input 
                      id="signerTitle" 
                      name="signerTitle" 
                      placeholder="Director of Human Resources"
                      value={formData.signerTitle} 
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="letterDate">Letter Date</Label>
                    <Input 
                      id="letterDate" 
                      name="letterDate" 
                      type="date"
                      value={formData.letterDate} 
                      onChange={handleChange}
                    />
                  </div>
                  
                  {/* HR Signature Type */}
                  <div className="space-y-2 md:col-span-2">
                    <Label>Signature Type</Label>
                    <RadioGroup 
                      value={formData.hrSignatureType} 
                      onValueChange={(val) => setFormData({...formData, hrSignatureType: val, hrSignatureImage: null})}
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="generated" id="hr-generated" />
                        <Label htmlFor="hr-generated" className="cursor-pointer">Computer Generated</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="custom" id="hr-custom" />
                        <Label htmlFor="hr-custom" className="cursor-pointer">Upload Custom Signature</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  
                  {formData.hrSignatureType === "generated" ? (
                    <div className="space-y-2 md:col-span-2">
                      <Label>Signature Preview</Label>
                      <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                        <p className="text-2xl italic text-slate-700" style={{ fontFamily: 'cursive' }}>
                          {formData.signerName || "Signer Name"}
                        </p>
                        <p className="text-xs text-slate-500 mt-2">This signature will be auto-generated from the signer name</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 md:col-span-2">
                      <Label>Upload Signature Image</Label>
                      <p className="text-xs text-slate-500 mb-2">PNG with transparent background recommended</p>
                      
                      <div
                        onDragOver={(e) => { e.preventDefault(); setIsDraggingHrSig(true); }}
                        onDragLeave={(e) => { e.preventDefault(); setIsDraggingHrSig(false); }}
                        onDrop={handleSignatureDrop('hrSignatureImage', setIsDraggingHrSig)}
                        className={`relative border-2 border-dashed rounded-lg p-6 transition-all ${
                          isDraggingHrSig 
                            ? 'border-green-500 bg-green-50' 
                            : 'border-slate-300 hover:border-green-400'
                        }`}
                      >
                        {formData.hrSignatureImage ? (
                          <div className="flex items-center gap-4">
                            <div className="relative">
                              <img 
                                src={formData.hrSignatureImage} 
                                alt="HR Signature" 
                                className="h-16 max-w-[200px] object-contain rounded-lg border border-slate-200 bg-white p-2"
                              />
                              <button
                                type="button"
                                onClick={removeHrSignature}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-green-700">Signature uploaded!</p>
                              <p className="text-xs text-slate-500 mt-1">Click the X to remove</p>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center">
                            <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                            <p className="text-sm text-slate-600 mb-2">
                              Drag and drop signature here, or
                            </p>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => hrSigInputRef.current?.click()}
                              className="gap-2"
                            >
                              <Upload className="w-4 h-4" />
                              Select File
                            </Button>
                            <input
                              ref={hrSigInputRef}
                              type="file"
                              accept="image/png,image/jpeg,image/jpg"
                              onChange={handleSignatureUpload('hrSignatureImage')}
                              className="hidden"
                            />
                            <p className="text-xs text-slate-400 mt-2">PNG or JPG, max 1MB</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Employee Signature */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
                  Employee Signature (Acceptance)
                </h2>
                <p className="text-sm text-slate-500">Configure the employee acceptance signature area</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Employee Signature Type */}
                  <div className="space-y-2 md:col-span-2">
                    <Label>Signature Type</Label>
                    <RadioGroup 
                      value={formData.employeeSignatureType} 
                      onValueChange={(val) => setFormData({...formData, employeeSignatureType: val, employeeSignatureImage: null})}
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="generated" id="emp-generated" />
                        <Label htmlFor="emp-generated" className="cursor-pointer">Computer Generated</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="custom" id="emp-custom" />
                        <Label htmlFor="emp-custom" className="cursor-pointer">Upload Custom Signature</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="blank" id="emp-blank" />
                        <Label htmlFor="emp-blank" className="cursor-pointer">Leave Blank (Sign Later)</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  
                  {formData.employeeSignatureType === "generated" && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="employeeSignatureName">Employee Signature Name</Label>
                        <Input 
                          id="employeeSignatureName" 
                          name="employeeSignatureName" 
                          placeholder="Employee full name for signature"
                          value={formData.employeeSignatureName} 
                          onChange={handleChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Signature Preview</Label>
                        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                          <p className="text-2xl italic text-slate-700" style={{ fontFamily: 'cursive' }}>
                            {formData.employeeSignatureName || formData.candidateName || "Employee Name"}
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                  
                  {formData.employeeSignatureType === "custom" && (
                    <div className="space-y-2 md:col-span-2">
                      <Label>Upload Employee Signature</Label>
                      <p className="text-xs text-slate-500 mb-2">PNG with transparent background recommended</p>
                      
                      <div
                        onDragOver={(e) => { e.preventDefault(); setIsDraggingEmpSig(true); }}
                        onDragLeave={(e) => { e.preventDefault(); setIsDraggingEmpSig(false); }}
                        onDrop={handleSignatureDrop('employeeSignatureImage', setIsDraggingEmpSig)}
                        className={`relative border-2 border-dashed rounded-lg p-6 transition-all ${
                          isDraggingEmpSig 
                            ? 'border-green-500 bg-green-50' 
                            : 'border-slate-300 hover:border-green-400'
                        }`}
                      >
                        {formData.employeeSignatureImage ? (
                          <div className="flex items-center gap-4">
                            <div className="relative">
                              <img 
                                src={formData.employeeSignatureImage} 
                                alt="Employee Signature" 
                                className="h-16 max-w-[200px] object-contain rounded-lg border border-slate-200 bg-white p-2"
                              />
                              <button
                                type="button"
                                onClick={removeEmpSignature}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-green-700">Signature uploaded!</p>
                              <p className="text-xs text-slate-500 mt-1">Click the X to remove</p>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center">
                            <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                            <p className="text-sm text-slate-600 mb-2">
                              Drag and drop signature here, or
                            </p>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => empSigInputRef.current?.click()}
                              className="gap-2"
                            >
                              <Upload className="w-4 h-4" />
                              Select File
                            </Button>
                            <input
                              ref={empSigInputRef}
                              type="file"
                              accept="image/png,image/jpeg,image/jpg"
                              onChange={handleSignatureUpload('employeeSignatureImage')}
                              className="hidden"
                            />
                            <p className="text-xs text-slate-400 mt-2">PNG or JPG, max 1MB</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {formData.employeeSignatureType === "blank" && (
                    <div className="space-y-2 md:col-span-2">
                      <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                        <p className="text-sm text-yellow-800">The employee signature area will be left blank with a signature line for the employee to sign manually.</p>
                      </div>
                    </div>
                  )}
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
                  Offer Letter Summary
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-700">Template:</span>
                    <span className="font-medium text-slate-900 capitalize">{formData.template}</span>
                  </div>
                  <div className="border-t border-green-300 my-2"></div>
                  <div className="flex justify-between">
                    <span className="text-slate-700">Company:</span>
                    <span className="font-medium text-slate-900">{formData.companyName || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-700">Candidate:</span>
                    <span className="font-medium text-slate-900">{formData.candidateName || "—"}</span>
                  </div>
                  <div className="border-t border-green-300 my-2"></div>
                  <div className="flex justify-between">
                    <span className="text-slate-700">Position:</span>
                    <span className="font-medium text-slate-900">{formData.jobTitle || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-700">Department:</span>
                    <span className="font-medium text-slate-900">{formData.department || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-700">Employment:</span>
                    <span className="font-medium text-slate-900 capitalize">{formData.employmentType.replace('-', ' ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-700">Work Location:</span>
                    <span className="font-medium text-slate-900 capitalize">{formData.workLocation}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-700">Start Date:</span>
                    <span className="font-medium text-slate-900">{formData.startDate || "—"}</span>
                  </div>
                  <div className="border-t border-green-300 my-2"></div>
                  <div className="flex justify-between font-bold">
                    <span className="text-green-800">Compensation:</span>
                    <span className="text-green-800">{formData.compensationAmount ? formatCompensation() : "—"}</span>
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
                        <DialogTitle>Offer Letter Preview</DialogTitle>
                      </DialogHeader>
                      <div className="flex-1 h-full">
                        {pdfPreview && (
                          <iframe
                            src={pdfPreview}
                            className="w-full h-[calc(90vh-80px)] border-0"
                            title="Offer Letter Preview Full"
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
                      title="Offer Letter Preview"
                    />
                  ) : (
                    <p className="text-slate-500">Fill in company and candidate name to see preview</p>
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
                  Secure payment via PayPal. Your offer letter will download immediately after payment.
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

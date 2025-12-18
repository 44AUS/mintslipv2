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
import { toast } from "sonner";
import { PayPalButtons } from "@paypal/react-paypal-js";
import { generateAndDownloadOfferLetter } from "@/utils/offerLetterGenerator";
import { generateOfferLetterPreview } from "@/utils/offerLetterPreviewGenerator";
import { formatPhoneNumber, formatZipCode } from "@/utils/validation";

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
                <RadioGroup 
                  value={formData.template} 
                  onValueChange={(val) => setFormData({...formData, template: val})}
                  className="grid grid-cols-1 md:grid-cols-3 gap-4"
                >
                  {TEMPLATES.map(template => (
                    <div key={template.value} className="relative">
                      <RadioGroupItem 
                        value={template.value} 
                        id={template.value} 
                        className="peer sr-only"
                      />
                      <Label 
                        htmlFor={template.value} 
                        className="flex flex-col p-4 border-2 rounded-lg cursor-pointer hover:border-green-600 peer-checked:border-green-700 peer-checked:bg-green-50 transition-all"
                      >
                        <span className="font-semibold text-slate-800">{template.label}</span>
                        <span className="text-xs text-slate-500 mt-1">{template.description}</span>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
                
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

              {/* Signature */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
                  Signature
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

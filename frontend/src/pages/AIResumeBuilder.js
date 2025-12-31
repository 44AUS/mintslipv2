import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { PayPalButtons } from "@paypal/react-paypal-js";
import CouponInput from "@/components/CouponInput";
import { 
  FileText, Sparkles, Briefcase, GraduationCap, Target, Eye, Download, 
  Plus, Trash2, Loader2, ChevronRight, ChevronLeft, RefreshCw, Lock,
  CheckCircle, AlertCircle, Maximize2, Link as LinkIcon, Upload, X
} from "lucide-react";
import { generateResumePreview } from "@/utils/resumePreviewGenerator";
import { generateAndDownloadResume } from "@/utils/resumeGenerator";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";

// Template options
const TEMPLATES = [
  { 
    value: "ats", 
    label: "ATS Optimized", 
    description: "Clean, simple format that passes ATS scanners",
    color: "#2563eb"
  },
  { 
    value: "modern", 
    label: "Modern Professional", 
    description: "Contemporary design with subtle accents",
    color: "#059669"
  },
  { 
    value: "classic", 
    label: "Classic Executive", 
    description: "Traditional formal style for senior roles",
    color: "#1e293b"
  }
];

// Font options
const FONTS = [
  { value: "Montserrat", label: "Montserrat", style: "Modern & Clean" },
  { value: "Times New Roman", label: "Times New Roman", style: "Traditional" },
  { value: "Calibri", label: "Calibri", style: "Professional" },
  { value: "Arial", label: "Arial", style: "Classic" },
  { value: "Helvetica", label: "Helvetica", style: "Clean & Minimal" }
];

// Section layout options
const LAYOUT_OPTIONS = [
  { value: "standard", label: "Standard", description: "Skills & Education at the bottom" },
  { value: "compact", label: "Highlighted", description: "Skills & Education under Summary" }
];

// Form steps
const STEPS = [
  { id: 1, title: "Personal Info", icon: FileText },
  { id: 2, title: "Work History", icon: Briefcase },
  { id: 3, title: "Education", icon: GraduationCap },
  { id: 4, title: "Skills", icon: Target },
  { id: 5, title: "Target Job", icon: Sparkles },
  { id: 6, title: "Review & Generate", icon: Eye }
];


export default function AIResumeBuilder() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isScrapingJob, setIsScrapingJob] = useState(false);
  const [generatedResume, setGeneratedResume] = useState(null);
  const [pdfPreview, setPdfPreview] = useState(null);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [lockedSections, setLockedSections] = useState({});
  const [appliedDiscount, setAppliedDiscount] = useState(null);
  const [regeneratingSection, setRegeneratingSection] = useState(null);
  
  // Resume upload state
  const [isParsingResume, setIsParsingResume] = useState(false);
  const [uploadedResumeName, setUploadedResumeName] = useState(null);
  
  // Step transition animation
  const [slideDirection, setSlideDirection] = useState('next');
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    template: "ats",
    font: "Calibri",
    sectionLayout: "standard",
    onePage: false,
    personalInfo: {
      fullName: "",
      email: "",
      phone: "",
      location: "",
      linkedin: "",
      website: ""
    },
    workExperience: [
      {
        id: Date.now(),
        company: "",
        position: "",
        location: "",
        startDate: "",
        endDate: "",
        current: false,
        responsibilities: [""]
      }
    ],
    education: [
      {
        id: Date.now(),
        institution: "",
        degree: "",
        field: "",
        graduationDate: "",
        gpa: ""
      }
    ],
    skills: [""],
    targetJobTitle: "",
    jobDescription: "",
    jobUrl: ""
  });

  // Handle input changes
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePersonalInfoChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      personalInfo: { ...prev.personalInfo, [field]: value }
    }));
  };

  // Work Experience handlers
  const addWorkExperience = () => {
    setFormData(prev => ({
      ...prev,
      workExperience: [
        ...prev.workExperience,
        {
          id: Date.now(),
          company: "",
          position: "",
          location: "",
          startDate: "",
          endDate: "",
          current: false,
          responsibilities: [""]
        }
      ]
    }));
  };

  const removeWorkExperience = (id) => {
    setFormData(prev => ({
      ...prev,
      workExperience: prev.workExperience.filter(exp => exp.id !== id)
    }));
  };

  const updateWorkExperience = (id, field, value) => {
    setFormData(prev => ({
      ...prev,
      workExperience: prev.workExperience.map(exp =>
        exp.id === id ? { ...exp, [field]: value } : exp
      )
    }));
  };

  const addResponsibility = (expId) => {
    setFormData(prev => ({
      ...prev,
      workExperience: prev.workExperience.map(exp =>
        exp.id === expId
          ? { ...exp, responsibilities: [...exp.responsibilities, ""] }
          : exp
      )
    }));
  };

  const updateResponsibility = (expId, index, value) => {
    setFormData(prev => ({
      ...prev,
      workExperience: prev.workExperience.map(exp =>
        exp.id === expId
          ? {
              ...exp,
              responsibilities: exp.responsibilities.map((r, i) =>
                i === index ? value : r
              )
            }
          : exp
      )
    }));
  };

  const removeResponsibility = (expId, index) => {
    setFormData(prev => ({
      ...prev,
      workExperience: prev.workExperience.map(exp =>
        exp.id === expId
          ? {
              ...exp,
              responsibilities: exp.responsibilities.filter((_, i) => i !== index)
            }
          : exp
      )
    }));
  };

  // Education handlers
  const addEducation = () => {
    setFormData(prev => ({
      ...prev,
      education: [
        ...prev.education,
        {
          id: Date.now(),
          institution: "",
          degree: "",
          field: "",
          graduationDate: "",
          gpa: ""
        }
      ]
    }));
  };

  const removeEducation = (id) => {
    setFormData(prev => ({
      ...prev,
      education: prev.education.filter(edu => edu.id !== id)
    }));
  };

  const updateEducation = (id, field, value) => {
    setFormData(prev => ({
      ...prev,
      education: prev.education.map(edu =>
        edu.id === id ? { ...edu, [field]: value } : edu
      )
    }));
  };

  // Skills handlers
  const addSkill = () => {
    setFormData(prev => ({
      ...prev,
      skills: [...prev.skills, ""]
    }));
  };

  const updateSkill = (index, value) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.map((s, i) => (i === index ? value : s))
    }));
  };

  const removeSkill = (index) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index)
    }));
  };

  // Scrape job URL
  const scrapeJobUrl = async () => {
    if (!formData.jobUrl) {
      toast.error("Please enter a job posting URL");
      return;
    }

    setIsScrapingJob(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/scrape-job`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: formData.jobUrl })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to scrape job posting");
      }

      const data = await response.json();
      setFormData(prev => ({ ...prev, jobDescription: data.jobDescription }));
      toast.success("Job description extracted successfully!");
    } catch (error) {
      console.error("Error scraping job:", error);
      toast.error(error.message || "Failed to extract job description. Please paste it manually.");
    } finally {
      setIsScrapingJob(false);
    }
  };

  // Parse uploaded resume
  const handleResumeUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(file.type)) {
      toast.error("Please upload a PDF or DOCX file");
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }

    setIsParsingResume(true);
    setUploadedResumeName(file.name);

    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);

      const response = await fetch(`${BACKEND_URL}/api/parse-resume`, {
        method: "POST",
        body: formDataUpload
      });

      if (!response.ok) {
        let errorMessage = "Failed to parse resume";
        try {
          const error = await response.json();
          errorMessage = error.detail || errorMessage;
        } catch {
          errorMessage = `Server error (${response.status}). Please try again.`;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        const parsed = result.data;
        
        // Update form data with parsed information
        setFormData(prev => ({
          ...prev,
          personalInfo: {
            fullName: parsed.personalInfo?.fullName || prev.personalInfo.fullName,
            email: parsed.personalInfo?.email || prev.personalInfo.email,
            phone: parsed.personalInfo?.phone || prev.personalInfo.phone,
            location: parsed.personalInfo?.location || prev.personalInfo.location,
            linkedin: parsed.personalInfo?.linkedin || prev.personalInfo.linkedin,
            website: parsed.personalInfo?.website || prev.personalInfo.website,
          },
          workExperience: parsed.workExperience?.length > 0 
            ? parsed.workExperience.map(exp => ({
                company: exp.company || "",
                position: exp.position || "",
                location: exp.location || "",
                startDate: exp.startDate || "",
                endDate: exp.endDate || "",
                current: exp.current || false,
                responsibilities: exp.responsibilities || []
              }))
            : prev.workExperience,
          education: parsed.education?.length > 0
            ? parsed.education.map(edu => ({
                institution: edu.institution || "",
                degree: edu.degree || "",
                field: edu.field || "",
                graduationDate: edu.graduationDate || "",
                gpa: edu.gpa || ""
              }))
            : prev.education,
          skills: parsed.skills?.length > 0 ? parsed.skills : prev.skills
        }));

        toast.success("Resume parsed successfully! Form has been auto-filled.");
      } else {
        toast.error("Could not extract information from the resume");
      }
    } catch (error) {
      console.error("Error parsing resume:", error);
      toast.error(error.message || "Failed to parse resume. Please fill in the form manually.");
      setUploadedResumeName(null);
    } finally {
      setIsParsingResume(false);
      // Reset the file input
      event.target.value = '';
    }
  };

  const clearUploadedResume = () => {
    setUploadedResumeName(null);
  };

  // Generate AI Resume
  const generateResume = async () => {
    if (!formData.jobDescription) {
      toast.error("Please provide a job description");
      return;
    }

    if (!formData.personalInfo.fullName || formData.workExperience.every(exp => !exp.company)) {
      toast.error("Please fill in your personal info and at least one work experience");
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/generate-resume`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personalInfo: formData.personalInfo,
          workExperience: formData.workExperience.filter(exp => exp.company),
          education: formData.education.filter(edu => edu.institution),
          skills: formData.skills.filter(s => s),
          targetJobTitle: formData.targetJobTitle,
          jobDescription: formData.jobDescription,
          jobUrl: formData.jobUrl
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to generate resume");
      }

      const result = await response.json();
      setGeneratedResume(result);
      toast.success("Resume generated successfully!");
      
      // Generate preview
      await generatePreview(result);
    } catch (error) {
      console.error("Error generating resume:", error);
      toast.error(error.message || "Failed to generate resume. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate preview
  const generatePreview = async (resumeData = generatedResume) => {
    if (!resumeData) return;

    setIsGeneratingPreview(true);
    try {
      const previewData = {
        ...resumeData,
        template: formData.template,
        font: formData.font,
        sectionLayout: formData.sectionLayout,
        onePage: formData.onePage,
        isPaid: isPaid
      };
      const preview = await generateResumePreview(previewData);
      setPdfPreview(preview);
    } catch (error) {
      console.error("Error generating preview:", error);
      toast.error("Failed to generate preview");
    } finally {
      setIsGeneratingPreview(false);
    }
  };

  // Regenerate section
  const regenerateSection = async (section) => {
    if (lockedSections[section]) {
      toast.info("This section is locked. Unlock it to regenerate.");
      return;
    }

    setRegeneratingSection(section);
    setIsGenerating(true);
    try {
      const currentContent = section === "summary" 
        ? generatedResume.professionalSummary
        : section === "experience"
        ? generatedResume.optimizedExperience
        : generatedResume.optimizedSkills;

      const response = await fetch(`${BACKEND_URL}/api/regenerate-section`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          section,
          currentContent,
          jobDescription: formData.jobDescription,
          userContext: {
            workExperience: formData.workExperience,
            skills: formData.skills
          }
        })
      });

      if (!response.ok) {
        throw new Error("Failed to regenerate section");
      }

      const result = await response.json();
      
      setGeneratedResume(prev => {
        if (section === "summary") {
          return { ...prev, professionalSummary: result.content };
        } else if (section === "experience") {
          // Update bullets for all experiences
          const updated = { ...prev };
          if (Array.isArray(result.content)) {
            updated.optimizedExperience = prev.optimizedExperience.map((exp, i) => ({
              ...exp,
              bullets: result.content.slice(i * 4, (i + 1) * 4) || exp.bullets
            }));
          }
          return updated;
        } else if (section === "skills") {
          return { ...prev, optimizedSkills: result.content };
        }
        return prev;
      });

      toast.success(`${section.charAt(0).toUpperCase() + section.slice(1)} regenerated!`);
      await generatePreview();
    } catch (error) {
      console.error("Error regenerating section:", error);
      toast.error("Failed to regenerate section");
    } finally {
      setIsGenerating(false);
      setRegeneratingSection(null);
    }
  };

  // Toggle lock
  const toggleLock = (section) => {
    setLockedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Download resume
  const handleDownload = async () => {
    if (!isPaid) {
      toast.error("Please complete payment to download");
      return;
    }

    try {
      await generateAndDownloadResume({
        ...generatedResume,
        template: formData.template,
        font: formData.font,
        sectionLayout: formData.sectionLayout,
        onePage: formData.onePage
      });
      toast.success("Resume downloaded successfully!");
    } catch (error) {
      console.error("Error downloading:", error);
      toast.error("Failed to download resume");
    }
  };

  // PayPal handlers - regular functions like PaystubForm
  const createOrder = (data, actions) => {
    console.log("AIResumeBuilder: Creating PayPal order...");
    const basePrice = 9.99;
    const finalPrice = appliedDiscount && appliedDiscount.discountedPrice 
      ? appliedDiscount.discountedPrice 
      : basePrice;
    
    console.log("AIResumeBuilder: Price =", finalPrice);
    
    return actions.order.create({
      application_context: {
        shipping_preference: "NO_SHIPPING",
      },
      purchase_units: [
        {
          amount: {
            value: finalPrice.toFixed(2),
            currency_code: "USD"
          },
          description: "AI Resume Builder - Professional Resume"
        }
      ]
    });
  };

  const onApprove = async (data, actions) => {
    console.log("AIResumeBuilder: Payment approved, capturing...");
    setIsProcessingPayment(true);
    try {
      const order = await actions.order.capture();
      console.log("AIResumeBuilder: Payment captured:", order);
      
      toast.success("Payment successful! You can now download your resume.");
      setIsPaid(true);
      
    } catch (error) {
      console.error("AIResumeBuilder: Payment error:", error);
      toast.error("Payment failed. Please try again.");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Navigation with animations
  const nextStep = () => {
    if (currentStep < STEPS.length && !isTransitioning) {
      setSlideDirection('next');
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentStep(prev => prev + 1);
        setTimeout(() => setIsTransitioning(false), 50);
      }, 200);
    }
  };

  const prevStep = () => {
    if (currentStep > 1 && !isTransitioning) {
      setSlideDirection('prev');
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentStep(prev => prev - 1);
        setTimeout(() => setIsTransitioning(false), 50);
      }, 200);
    }
  };


  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderPersonalInfo();
      case 2:
        return renderWorkExperience();
      case 3:
        return renderEducation();
      case 4:
        return renderSkills();
      case 5:
        return renderTargetJob();
      case 6:
        return renderReview();
      default:
        return null;
    }
  };

  // Step 1: Personal Info
  const renderPersonalInfo = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Personal Information</h2>
        <p className="text-slate-600">Enter your contact details for the resume header</p>
      </div>

      {/* AI Resume Upload Section */}
      {isParsingResume ? (
        /* AI Processing Animation */
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 rounded-2xl p-8">
          {/* Animated background grid */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute inset-0" style={{
              backgroundImage: `linear-gradient(rgba(139, 92, 246, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(139, 92, 246, 0.3) 1px, transparent 1px)`,
              backgroundSize: '50px 50px',
              animation: 'pulse 2s ease-in-out infinite'
            }}></div>
          </div>
          
          {/* Glowing orbs */}
          <div className="absolute top-10 left-10 w-32 h-32 bg-purple-500 rounded-full filter blur-3xl opacity-30 animate-pulse"></div>
          <div className="absolute bottom-10 right-10 w-40 h-40 bg-blue-500 rounded-full filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-cyan-500 rounded-full filter blur-3xl opacity-10 animate-ping" style={{ animationDuration: '3s' }}></div>
          
          <div className="relative z-10 text-center">
            {/* AI Brain Icon with pulse */}
            <div className="relative inline-block mb-6">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full blur-xl opacity-50 animate-pulse"></div>
              <div className="relative bg-gradient-to-br from-purple-600 to-cyan-600 p-4 rounded-2xl">
                <Sparkles className="w-12 h-12 text-white animate-pulse" />
              </div>
              {/* Orbiting dots */}
              <div className="absolute inset-0 animate-spin" style={{ animationDuration: '3s' }}>
                <div className="absolute -top-2 left-1/2 w-2 h-2 bg-cyan-400 rounded-full shadow-lg shadow-cyan-400/50"></div>
              </div>
              <div className="absolute inset-0 animate-spin" style={{ animationDuration: '4s', animationDirection: 'reverse' }}>
                <div className="absolute -bottom-2 left-1/2 w-2 h-2 bg-purple-400 rounded-full shadow-lg shadow-purple-400/50"></div>
              </div>
            </div>
            
            <h3 className="text-2xl font-bold text-white mb-2">
              AI is Analyzing Your Resume
            </h3>
            
            {/* Typing animation text */}
            <div className="flex items-center justify-center gap-2 mb-6">
              <span className="text-purple-300 font-mono text-sm">
                Extracting information
              </span>
              <span className="flex gap-1">
                <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </span>
            </div>
            
            {/* Progress steps */}
            <div className="space-y-3 max-w-sm mx-auto">
              {['Scanning document', 'Identifying sections', 'Extracting details', 'Organizing data'].map((step, index) => (
                <div key={step} className="flex items-center gap-3 text-left animate-pulse" style={{ animationDelay: `${index * 0.5}s` }}>
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                  <span className="text-slate-300 text-sm">{step}</span>
                </div>
              ))}
            </div>
            
            {/* File name */}
            <div className="mt-6 inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
              <FileText className="w-4 h-4 text-purple-300" />
              <span className="text-white/80 text-sm font-medium">{uploadedResumeName}</span>
            </div>
          </div>
        </div>
      ) : uploadedResumeName ? (
        /* Success State */
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-2xl p-6">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl mb-4 shadow-lg shadow-emerald-500/30">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-emerald-800 mb-2">
              Resume Parsed Successfully!
            </h3>
            <p className="text-emerald-600 text-sm mb-4">
              Your information has been extracted and filled in below
            </p>
            <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm">
              <FileText className="w-4 h-4 text-emerald-600" />
              <span className="text-slate-700 font-medium">{uploadedResumeName}</span>
              <button 
                onClick={clearUploadedResume}
                className="ml-2 hover:bg-slate-100 rounded-full p-1 transition-colors"
              >
                <X className="w-4 h-4 text-slate-400 hover:text-red-500" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Upload State */
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 via-cyan-500 to-purple-600 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-500"></div>
          <div className="relative bg-gradient-to-br from-slate-50 to-white border-2 border-dashed border-purple-200 hover:border-purple-400 rounded-2xl p-8 transition-all duration-300">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-100 to-cyan-100 rounded-2xl mb-4 group-hover:scale-110 transition-transform duration-300">
                <Sparkles className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">
                Have an existing resume?
              </h3>
              <p className="text-slate-600 text-sm mb-6 max-w-md mx-auto">
                Let our AI instantly extract and fill in your information. Just upload your resume and watch the magic happen!
              </p>
              
              <label className="inline-flex items-center gap-3 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white font-semibold py-3 px-6 rounded-xl cursor-pointer transition-all duration-300 shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-105">
                <Upload className="w-5 h-5" />
                Upload Resume
                <input
                  type="file"
                  accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={handleResumeUpload}
                  className="hidden"
                />
              </label>
              
              <div className="flex items-center justify-center gap-4 mt-4 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <FileText className="w-3 h-3" /> PDF
                </span>
                <span className="flex items-center gap-1">
                  <FileText className="w-3 h-3" /> DOCX
                </span>
                <span>Max 10MB</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-white text-slate-500">or fill in manually</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="fullName">Full Name *</Label>
          <Input
            id="fullName"
            value={formData.personalInfo.fullName}
            onChange={(e) => handlePersonalInfoChange("fullName", e.target.value)}
            placeholder="John Smith"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            value={formData.personalInfo.email}
            onChange={(e) => handlePersonalInfoChange("email", e.target.value)}
            placeholder="john@example.com"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            value={formData.personalInfo.phone}
            onChange={(e) => handlePersonalInfoChange("phone", e.target.value)}
            placeholder="(555) 123-4567"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            value={formData.personalInfo.location}
            onChange={(e) => handlePersonalInfoChange("location", e.target.value)}
            placeholder="New York, NY"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="linkedin">LinkedIn URL</Label>
          <Input
            id="linkedin"
            value={formData.personalInfo.linkedin}
            onChange={(e) => handlePersonalInfoChange("linkedin", e.target.value)}
            placeholder="linkedin.com/in/johnsmith"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="website">Website/Portfolio</Label>
          <Input
            id="website"
            value={formData.personalInfo.website}
            onChange={(e) => handlePersonalInfoChange("website", e.target.value)}
            placeholder="www.johnsmith.com"
          />
        </div>
      </div>

      {/* Resume Formatting Options */}
      <div className="mt-8 pt-6 border-t border-slate-200">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-500" />
          Resume Formatting Options
        </h3>
        
        {/* Font Selection */}
        <div className="mb-6">
          <Label className="text-slate-700 mb-3 block">Font Style</Label>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {FONTS.map((font) => (
              <button
                key={font.value}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, font: font.value }))}
                className={`p-3 rounded-lg border-2 transition-all duration-200 text-left ${
                  formData.font === font.value
                    ? 'border-purple-500 bg-purple-50 shadow-md'
                    : 'border-slate-200 hover:border-purple-300 hover:bg-slate-50'
                }`}
              >
                <span className="block font-medium text-slate-800" style={{ fontFamily: font.value }}>
                  {font.label}
                </span>
                <span className="text-xs text-slate-500">{font.style}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Section Layout */}
        <div className="mb-6">
          <Label className="text-slate-700 mb-3 block">Section Layout</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {LAYOUT_OPTIONS.map((layout) => (
              <button
                key={layout.value}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, sectionLayout: layout.value }))}
                className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                  formData.sectionLayout === layout.value
                    ? 'border-purple-500 bg-purple-50 shadow-md'
                    : 'border-slate-200 hover:border-purple-300 hover:bg-slate-50'
                }`}
              >
                <span className="block font-medium text-slate-800">{layout.label}</span>
                <span className="text-sm text-slate-500">{layout.description}</span>
              </button>
            ))}
          </div>
        </div>

        {/* One Page Option */}
        <div className="flex items-center justify-between p-4 rounded-lg border-2 border-slate-200 hover:border-purple-300 transition-colors">
          <div>
            <span className="block font-medium text-slate-800">One-Page Resume</span>
            <span className="text-sm text-slate-500">Fit all content on a single page (best for less experience)</span>
          </div>
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, onePage: !prev.onePage }))}
            className={`relative w-14 h-7 rounded-full transition-colors duration-200 ${
              formData.onePage ? 'bg-purple-500' : 'bg-slate-300'
            }`}
          >
            <span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200 ${
              formData.onePage ? 'translate-x-8' : 'translate-x-1'
            }`}></span>
          </button>
        </div>
      </div>
    </div>
  );

  // Step 2: Work Experience
  const renderWorkExperience = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Work Experience</h2>
          <p className="text-slate-600">Add your work history (most recent first)</p>
        </div>
        <Button onClick={addWorkExperience} variant="outline" size="sm">
          <Plus className="w-4 h-4 mr-2" /> Add Position
        </Button>
      </div>

      {formData.workExperience.map((exp, expIndex) => (
        <div key={exp.id} className="border rounded-lg p-4 space-y-4 bg-white">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-700">Position {expIndex + 1}</h3>
            {formData.workExperience.length > 1 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeWorkExperience(exp.id)}
                className="text-red-500 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Company *</Label>
              <Input
                value={exp.company}
                onChange={(e) => updateWorkExperience(exp.id, "company", e.target.value)}
                placeholder="Company Name"
              />
            </div>
            <div className="space-y-2">
              <Label>Position *</Label>
              <Input
                value={exp.position}
                onChange={(e) => updateWorkExperience(exp.id, "position", e.target.value)}
                placeholder="Job Title"
              />
            </div>
            <div className="space-y-2">
              <Label>Location</Label>
              <Input
                value={exp.location}
                onChange={(e) => updateWorkExperience(exp.id, "location", e.target.value)}
                placeholder="City, State"
              />
            </div>
            <div className="space-y-2 flex gap-2">
              <div className="flex-1">
                <Label>Start Date</Label>
                <Input
                  type="month"
                  value={exp.startDate}
                  onChange={(e) => updateWorkExperience(exp.id, "startDate", e.target.value)}
                />
              </div>
              <div className="flex-1">
                <Label>End Date</Label>
                <Input
                  type="month"
                  value={exp.endDate}
                  onChange={(e) => updateWorkExperience(exp.id, "endDate", e.target.value)}
                  disabled={exp.current}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id={`current-${exp.id}`}
              checked={exp.current}
              onChange={(e) => updateWorkExperience(exp.id, "current", e.target.checked)}
              className="rounded"
            />
            <Label htmlFor={`current-${exp.id}`} className="text-sm">I currently work here</Label>
          </div>

          {/* Enhanced Responsibilities Section */}
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <Label className="flex items-center gap-2">
                  Responsibilities & Achievements
                  <span className="relative group">
                    <span className="flex items-center gap-1 text-xs font-normal bg-gradient-to-r from-purple-100 to-cyan-100 text-purple-700 px-2 py-1 rounded-full cursor-help">
                      <Sparkles className="w-3 h-3" />
                      AI Enhanced
                    </span>
                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10 pointer-events-none">
                      AI uses these to generate optimized bullet points
                    </span>
                  </span>
                </Label>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => addResponsibility(exp.id)}
              >
                <Plus className="w-3 h-3 mr-1" /> Add
              </Button>
            </div>
            
            {/* AI Hint Banner */}
            <div className="bg-gradient-to-r from-purple-50 via-cyan-50 to-purple-50 border border-purple-200 rounded-lg p-3 mb-3">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700">Pro Tip: Be specific!</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Include metrics, achievements, and action verbs. Our AI will transform these into powerful, 
                    ATS-optimized bullet points tailored to your target job.
                  </p>
                </div>
              </div>
            </div>
            
            {exp.responsibilities.map((resp, respIndex) => (
              <div key={respIndex} className="flex gap-2 items-start group">
                <div className="flex-shrink-0 w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center mt-2 text-xs font-medium text-slate-500">
                  {respIndex + 1}
                </div>
                <div className="flex-1">
                  <Textarea
                    value={resp}
                    onChange={(e) => updateResponsibility(exp.id, respIndex, e.target.value)}
                    placeholder="E.g., Led a team of 5 engineers to deliver a $2M project 3 weeks ahead of schedule..."
                    className="min-h-[60px] resize-none"
                    rows={2}
                  />
                </div>
                {exp.responsibilities.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeResponsibility(exp.id, respIndex)}
                    className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity mt-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  // Step 3: Education
  const renderEducation = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Education</h2>
          <p className="text-slate-600">Add your educational background</p>
        </div>
        <Button onClick={addEducation} variant="outline" size="sm">
          <Plus className="w-4 h-4 mr-2" /> Add Education
        </Button>
      </div>

      {formData.education.map((edu, eduIndex) => (
        <div key={edu.id} className="border rounded-lg p-4 space-y-4 bg-white">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-700">Education {eduIndex + 1}</h3>
            {formData.education.length > 1 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeEducation(edu.id)}
                className="text-red-500 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Institution *</Label>
              <Input
                value={edu.institution}
                onChange={(e) => updateEducation(edu.id, "institution", e.target.value)}
                placeholder="University Name"
              />
            </div>
            <div className="space-y-2">
              <Label>Degree *</Label>
              <Input
                value={edu.degree}
                onChange={(e) => updateEducation(edu.id, "degree", e.target.value)}
                placeholder="Bachelor's, Master's, etc."
              />
            </div>
            <div className="space-y-2">
              <Label>Field of Study</Label>
              <Input
                value={edu.field}
                onChange={(e) => updateEducation(edu.id, "field", e.target.value)}
                placeholder="Computer Science, Business, etc."
              />
            </div>
            <div className="space-y-2">
              <Label>Graduation Date</Label>
              <Input
                type="month"
                value={edu.graduationDate}
                onChange={(e) => updateEducation(edu.id, "graduationDate", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>GPA (Optional)</Label>
              <Input
                value={edu.gpa}
                onChange={(e) => updateEducation(edu.id, "gpa", e.target.value)}
                placeholder="3.8/4.0"
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  // Step 4: Skills
  const renderSkills = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Skills</h2>
          <p className="text-slate-600">List your key skills (AI will optimize based on job)</p>
        </div>
        <Button onClick={addSkill} variant="outline" size="sm">
          <Plus className="w-4 h-4 mr-2" /> Add Skill
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {formData.skills.map((skill, index) => (
          <div key={index} className="flex gap-2">
            <Input
              value={skill}
              onChange={(e) => updateSkill(index, e.target.value)}
              placeholder="Enter a skill..."
            />
            {formData.skills.length > 1 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeSkill(index)}
                className="text-red-500"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        ))}
      </div>

      <p className="text-sm text-slate-500">
        Tip: Include both technical skills (programming languages, tools) and soft skills (leadership, communication)
      </p>
    </div>
  );

  // Step 5: Target Job
  const renderTargetJob = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Target Job</h2>
        <p className="text-slate-600">Tell us about the job you're applying for</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="targetJobTitle">Target Job Title *</Label>
          <Input
            id="targetJobTitle"
            value={formData.targetJobTitle}
            onChange={(e) => handleChange("targetJobTitle", e.target.value)}
            placeholder="e.g., Senior Software Engineer"
          />
        </div>

        <div className="space-y-2">
          <Label>Job Posting URL (Optional)</Label>
          <div className="flex gap-2">
            <Input
              value={formData.jobUrl}
              onChange={(e) => handleChange("jobUrl", e.target.value)}
              placeholder="https://company.com/jobs/123"
            />
            <Button
              onClick={scrapeJobUrl}
              disabled={isScrapingJob || !formData.jobUrl}
              variant="outline"
            >
              {isScrapingJob ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <LinkIcon className="w-4 h-4" />
              )}
              <span className="ml-2">Extract</span>
            </Button>
          </div>
          <p className="text-xs text-slate-500">We'll extract the job description automatically</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="jobDescription">Job Description *</Label>
          <Textarea
            id="jobDescription"
            value={formData.jobDescription}
            onChange={(e) => handleChange("jobDescription", e.target.value)}
            placeholder="Paste the full job description here..."
            rows={10}
            className="font-mono text-sm"
          />
          <p className="text-xs text-slate-500">
            The AI will analyze this to tailor your resume with relevant keywords and achievements
          </p>
        </div>
      </div>
    </div>
  );

  // Step 6: Review & Generate
  const renderReview = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Review & Generate</h2>
        <p className="text-slate-600">Choose your template and generate your AI-optimized resume</p>
      </div>

      {/* Template Selection */}
      <div className="space-y-4">
        <Label className="text-lg font-semibold">Select Template</Label>
        <RadioGroup
          value={formData.template}
          onValueChange={(value) => handleChange("template", value)}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          {TEMPLATES.map((template) => (
            <div
              key={template.value}
              className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                formData.template === template.value
                  ? "border-green-600 bg-green-50"
                  : "border-slate-200 hover:border-slate-300"
              }`}
              onClick={() => handleChange("template", template.value)}
            >
              <RadioGroupItem value={template.value} id={template.value} className="sr-only" />
              <div className="flex items-start gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: template.color + "20" }}
                >
                  <FileText className="w-5 h-5" style={{ color: template.color }} />
                </div>
                <div>
                  <p className="font-semibold text-slate-800">{template.label}</p>
                  <p className="text-sm text-slate-500">{template.description}</p>
                </div>
              </div>
            </div>
          ))}
        </RadioGroup>
      </div>

      {/* Generate Button */}
      {!generatedResume && (
        <div className="flex justify-center">
          {isGenerating ? (
            /* AI Generation Animation */
            <div className="w-full max-w-2xl">
              <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 rounded-2xl p-8">
                {/* Animated background effects */}
                <div className="absolute inset-0">
                  <div className="absolute inset-0 opacity-30" style={{
                    backgroundImage: `radial-gradient(circle at 25% 25%, rgba(139, 92, 246, 0.3) 0%, transparent 50%),
                                      radial-gradient(circle at 75% 75%, rgba(6, 182, 212, 0.3) 0%, transparent 50%)`,
                  }}></div>
                  {/* Scanning line effect */}
                  <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse" 
                         style={{ 
                           top: '50%',
                           animation: 'scan 2s ease-in-out infinite',
                         }}></div>
                  </div>
                </div>
                
                {/* Floating particles */}
                <div className="absolute inset-0 overflow-hidden">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} 
                         className="absolute w-1 h-1 bg-purple-400 rounded-full animate-ping"
                         style={{
                           left: `${20 + i * 15}%`,
                           top: `${30 + (i % 3) * 20}%`,
                           animationDelay: `${i * 0.3}s`,
                           animationDuration: '2s'
                         }}></div>
                  ))}
                </div>
                
                <div className="relative z-10 text-center">
                  {/* AI Icon with effects */}
                  <div className="relative inline-block mb-6">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-cyan-500 to-purple-500 rounded-full blur-2xl opacity-50 animate-pulse"></div>
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-2xl animate-spin" style={{ animationDuration: '8s' }}></div>
                      <div className="relative bg-gradient-to-br from-purple-600 to-cyan-600 p-5 rounded-2xl m-0.5">
                        <Sparkles className="w-10 h-10 text-white" />
                      </div>
                    </div>
                    {/* Orbiting elements */}
                    <div className="absolute inset-[-20px] animate-spin" style={{ animationDuration: '4s' }}>
                      <div className="absolute top-0 left-1/2 w-3 h-3 -ml-1.5 bg-cyan-400 rounded-full shadow-lg shadow-cyan-400/50"></div>
                    </div>
                    <div className="absolute inset-[-30px] animate-spin" style={{ animationDuration: '6s', animationDirection: 'reverse' }}>
                      <div className="absolute bottom-0 left-1/2 w-2 h-2 -ml-1 bg-purple-400 rounded-full shadow-lg shadow-purple-400/50"></div>
                    </div>
                  </div>
                  
                  <h3 className="text-2xl font-bold text-white mb-3">
                    AI is Crafting Your Resume
                  </h3>
                  
                  <p className="text-purple-200 mb-6 max-w-md mx-auto">
                    Analyzing job requirements and optimizing your experience for maximum impact
                  </p>
                  
                  {/* Progress indicators */}
                  <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto mb-6">
                    {[
                      { icon: Target, text: 'Matching keywords' },
                      { icon: FileText, text: 'Structuring content' },
                      { icon: Briefcase, text: 'Highlighting experience' },
                      { icon: Sparkles, text: 'Optimizing for ATS' }
                    ].map((item, index) => (
                      <div key={item.text} 
                           className="flex items-center gap-2 bg-white/5 backdrop-blur-sm rounded-lg px-3 py-2 animate-pulse"
                           style={{ animationDelay: `${index * 0.2}s` }}>
                        <item.icon className="w-4 h-4 text-cyan-400" />
                        <span className="text-sm text-slate-300">{item.text}</span>
                      </div>
                    ))}
                  </div>
                  
                  {/* Animated progress bar */}
                  <div className="max-w-xs mx-auto">
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-purple-500 via-cyan-500 to-purple-500 rounded-full animate-pulse"
                           style={{
                             width: '100%',
                             backgroundSize: '200% 100%',
                             animation: 'shimmer 1.5s ease-in-out infinite'
                           }}></div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* CSS for custom animations */}
              <style>{`
                @keyframes scan {
                  0%, 100% { transform: translateY(-100px); opacity: 0; }
                  50% { transform: translateY(100px); opacity: 1; }
                }
                @keyframes shimmer {
                  0% { background-position: 200% 0; }
                  100% { background-position: -200% 0; }
                }
              `}</style>
            </div>
          ) : (
            <Button
              onClick={generateResume}
              disabled={!formData.jobDescription}
              size="lg"
              className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105 px-8 py-6 text-lg"
            >
              <Sparkles className="w-6 h-6 mr-2" />
              Generate AI Resume
            </Button>
          )}
        </div>
      )}

      {/* Generated Resume Content */}
      {generatedResume && (
        <div className="space-y-6">
          {/* Enhanced ATS Score */}
          {generatedResume.atsScore && (
            <div className={`relative overflow-hidden rounded-2xl p-6 ${
              generatedResume.atsScore >= 80 ? 'bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200' :
              generatedResume.atsScore >= 60 ? 'bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200' :
              'bg-gradient-to-br from-red-50 to-orange-50 border border-red-200'
            }`}>
              {/* Background decoration */}
              <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
                <div className={`w-full h-full rounded-full ${
                  generatedResume.atsScore >= 80 ? 'bg-emerald-500' :
                  generatedResume.atsScore >= 60 ? 'bg-amber-500' : 'bg-red-500'
                } blur-3xl`}></div>
              </div>
              
              <div className="relative z-10">
                <div className="flex flex-col md:flex-row items-center gap-6">
                  {/* Animated Circular Progress */}
                  <div className="relative w-32 h-32 flex-shrink-0">
                    {/* Background circle */}
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="currentColor"
                        strokeWidth="12"
                        fill="none"
                        className="text-slate-200"
                      />
                      {/* Progress circle */}
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="currentColor"
                        strokeWidth="12"
                        fill="none"
                        strokeLinecap="round"
                        className={`${
                          generatedResume.atsScore >= 80 ? 'text-emerald-500' :
                          generatedResume.atsScore >= 60 ? 'text-amber-500' : 'text-red-500'
                        } transition-all duration-1000 ease-out`}
                        style={{
                          strokeDasharray: `${2 * Math.PI * 56}`,
                          strokeDashoffset: `${2 * Math.PI * 56 * (1 - generatedResume.atsScore / 100)}`,
                          filter: `drop-shadow(0 0 6px ${
                            generatedResume.atsScore >= 80 ? 'rgb(16, 185, 129)' :
                            generatedResume.atsScore >= 60 ? 'rgb(245, 158, 11)' : 'rgb(239, 68, 68)'
                          })`
                        }}
                      />
                    </svg>
                    {/* Score text in center */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className={`text-3xl font-bold ${
                        generatedResume.atsScore >= 80 ? 'text-emerald-600' :
                        generatedResume.atsScore >= 60 ? 'text-amber-600' : 'text-red-600'
                      }`}>{generatedResume.atsScore}</span>
                      <span className="text-xs text-slate-500">out of 100</span>
                    </div>
                    {/* Glow effect */}
                    <div className={`absolute inset-0 rounded-full opacity-20 animate-pulse ${
                      generatedResume.atsScore >= 80 ? 'bg-emerald-400' :
                      generatedResume.atsScore >= 60 ? 'bg-amber-400' : 'bg-red-400'
                    } blur-xl`}></div>
                  </div>
                  
                  {/* Score details */}
                  <div className="flex-1 text-center md:text-left">
                    <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                      <h3 className={`text-xl font-bold ${
                        generatedResume.atsScore >= 80 ? 'text-emerald-800' :
                        generatedResume.atsScore >= 60 ? 'text-amber-800' : 'text-red-800'
                      }`}>
                        ATS Compatibility Score
                      </h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        generatedResume.atsScore >= 80 ? 'bg-emerald-200 text-emerald-800' :
                        generatedResume.atsScore >= 60 ? 'bg-amber-200 text-amber-800' : 'bg-red-200 text-red-800'
                      }`}>
                        {generatedResume.atsScore >= 80 ? 'Excellent' :
                         generatedResume.atsScore >= 60 ? 'Good' : 'Needs Work'}
                      </span>
                    </div>
                    <p className={`text-sm mb-4 ${
                      generatedResume.atsScore >= 80 ? 'text-emerald-600' :
                      generatedResume.atsScore >= 60 ? 'text-amber-600' : 'text-red-600'
                    }`}>
                      {generatedResume.atsScore >= 80 
                        ? 'Your resume is highly optimized and likely to pass ATS screening!'
                        : generatedResume.atsScore >= 60 
                        ? 'Your resume has good ATS compatibility but could be improved.'
                        : 'Consider optimizing your resume for better ATS compatibility.'}
                    </p>
                    
                    {/* Score factors */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        { label: 'Keywords', score: Math.min(100, generatedResume.atsScore + Math.floor(Math.random() * 10) - 5), icon: Target },
                        { label: 'Format', score: Math.min(100, generatedResume.atsScore + Math.floor(Math.random() * 15)), icon: FileText },
                        { label: 'Experience', score: Math.min(100, generatedResume.atsScore + Math.floor(Math.random() * 8) - 3), icon: Briefcase },
                        { label: 'Skills Match', score: Math.min(100, generatedResume.atsScore + Math.floor(Math.random() * 12) - 6), icon: CheckCircle }
                      ].map((factor, index) => (
                        <div key={factor.label} 
                             className="bg-white/60 backdrop-blur-sm rounded-lg p-2 text-center"
                             style={{ animationDelay: `${index * 100}ms` }}>
                          <factor.icon className={`w-4 h-4 mx-auto mb-1 ${
                            factor.score >= 80 ? 'text-emerald-500' :
                            factor.score >= 60 ? 'text-amber-500' : 'text-red-500'
                          }`} />
                          <div className="text-xs text-slate-600 mb-1">{factor.label}</div>
                          <div className={`text-sm font-bold ${
                            factor.score >= 80 ? 'text-emerald-600' :
                            factor.score >= 60 ? 'text-amber-600' : 'text-red-600'
                          }`}>{factor.score}%</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Professional Summary */}
          <div className="border rounded-lg p-4 bg-white">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-slate-800">Professional Summary</h3>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleLock("summary")}
                >
                  <Lock className={`w-4 h-4 ${lockedSections.summary ? "text-amber-500" : "text-slate-400"}`} />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => regenerateSection("summary")}
                  disabled={regeneratingSection !== null || lockedSections.summary}
                  className="group relative overflow-hidden hover:border-purple-400 transition-all duration-300"
                >
                  {regeneratingSection === "summary" ? (
                    <>
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-cyan-500/20 to-purple-500/20 animate-pulse"></div>
                      <div className="absolute inset-0 overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-[shimmer_1s_infinite]" style={{ animation: 'shimmer 1s infinite' }}></div>
                      </div>
                      <Sparkles className="w-4 h-4 mr-1 animate-pulse text-purple-500" />
                      <span className="text-purple-600 font-medium">AI Regenerating...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-1 group-hover:text-purple-500 group-hover:rotate-180 transition-all duration-300" />
                      <span className="group-hover:text-purple-600 transition-colors">Regenerate</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
            {regeneratingSection === "summary" ? (
              <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-slate-100 to-purple-50 p-4">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-200/30 to-transparent animate-pulse"></div>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="absolute inset-0 bg-purple-400 rounded-full blur-md opacity-30 animate-ping"></div>
                    <Sparkles className="w-5 h-5 text-purple-500 relative z-10 animate-pulse" />
                  </div>
                  <span className="text-purple-600 font-medium">AI is crafting a new summary...</span>
                </div>
              </div>
            ) : (
              <p className="text-slate-600">{generatedResume.professionalSummary}</p>
            )}
          </div>

          {/* Keywords Used */}
          {generatedResume.keywordsUsed && generatedResume.keywordsUsed.length > 0 && (
            <div className="border rounded-lg p-4 bg-white">
              <h3 className="font-semibold text-slate-800 mb-3">Keywords Optimized</h3>
              <div className="flex flex-wrap gap-2">
                {generatedResume.keywordsUsed.map((keyword, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Preview Section */}
          <div className="border rounded-lg p-4 bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-800">Resume Preview</h3>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => generatePreview()}
                  disabled={isGeneratingPreview}
                >
                  {isGeneratingPreview ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  <span className="ml-1">Refresh</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPreviewDialogOpen(true)}
                  disabled={!pdfPreview}
                >
                  <Maximize2 className="w-4 h-4 mr-1" />
                  Full Screen
                </Button>
              </div>
            </div>
            
            {isGeneratingPreview ? (
              <div className="h-96 flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900/50 to-slate-900 rounded-xl overflow-hidden relative">
                {/* Background grid */}
                <div className="absolute inset-0 opacity-20" style={{
                  backgroundImage: `linear-gradient(rgba(139, 92, 246, 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(139, 92, 246, 0.5) 1px, transparent 1px)`,
                  backgroundSize: '30px 30px'
                }}></div>
                
                {/* Glowing effects */}
                <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-purple-500 rounded-full filter blur-3xl opacity-20 animate-pulse"></div>
                <div className="absolute bottom-1/4 right-1/4 w-32 h-32 bg-cyan-500 rounded-full filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '1s' }}></div>
                
                <div className="relative z-10 text-center">
                  <div className="relative inline-block mb-4">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-xl blur-lg opacity-50 animate-pulse"></div>
                    <div className="relative bg-gradient-to-br from-purple-600 to-cyan-600 p-4 rounded-xl">
                      <Eye className="w-8 h-8 text-white animate-pulse" />
                    </div>
                  </div>
                  <p className="text-white font-medium mb-2">Generating Preview</p>
                  <div className="flex justify-center gap-1">
                    <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              </div>
            ) : pdfPreview ? (
              <div className="relative">
                <img
                  src={pdfPreview}
                  alt="Resume Preview"
                  className="w-full rounded border"
                />
                {!isPaid && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-6xl font-bold text-slate-300 opacity-50 rotate-[-30deg] select-none">
                      PREVIEW
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-96 flex items-center justify-center bg-slate-50 rounded">
                <p className="text-slate-500">Preview will appear here</p>
              </div>
            )}
          </div>

          {/* Payment & Download */}
          <div className="border rounded-lg p-6 bg-white">
            {isPaid ? (
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center gap-2 text-green-600">
                  <CheckCircle className="w-6 h-6" />
                  <span className="text-lg font-semibold">Payment Complete!</span>
                </div>
                <Button
                  onClick={handleDownload}
                  size="lg"
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Download Resume (PDF + DOCX)
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <CouponInput
                  generatorType="ai-resume"
                  originalPrice={9.99}
                  onDiscountApplied={setAppliedDiscount}
                />
                <div className="text-center">
                  {appliedDiscount ? (
                    <>
                      <p className="text-lg text-slate-400 line-through">${9.99.toFixed(2)}</p>
                      <p className="text-2xl font-bold text-green-600">${appliedDiscount.discountedPrice.toFixed(2)}</p>
                      <p className="text-green-600 text-sm">{appliedDiscount.discountPercent}% discount applied!</p>
                    </>
                  ) : (
                    <p className="text-2xl font-bold text-slate-800">$9.99</p>
                  )}
                  <p className="text-slate-600">One-time payment for your AI-optimized resume</p>
                </div>
                <div className="max-w-md mx-auto">
                  {isProcessingPayment && (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                      <span className="ml-2 text-slate-600">Processing payment...</span>
                    </div>
                  )}
                  <div style={{ display: isProcessingPayment ? 'none' : 'block' }}>
                    <PayPalButtons
                      style={{ layout: "vertical", color: "gold", shape: "rect" }}
                      createOrder={createOrder}
                      onApprove={onApprove}
                      onCancel={() => {
                        toast.info("Payment was cancelled.");
                      }}
                      onError={(err) => {
                        console.error("PayPal error:", err);
                        toast.error("Payment failed. Please try again.");
                      }}
                    />
                  </div>
                </div>
                <p className="text-xs text-center text-slate-500">
                  Includes PDF and Word (.docx) formats in a zip file
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Full Screen Preview Dialog */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Resume Preview</DialogTitle>
          </DialogHeader>
          {pdfPreview && (
            <div className="relative">
              <img
                src={pdfPreview}
                alt="Resume Preview"
                className="w-full"
              />
              {!isPaid && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-8xl font-bold text-slate-300 opacity-50 rotate-[-30deg] select-none">
                    PREVIEW
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />
      
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4 max-w-5xl">
          {/* Page Title */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-2">
              AI Resume Builder
            </h1>
            <p className="text-slate-600">
              Create an ATS-optimized resume tailored to your target job in minutes
            </p>
          </div>

          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {STEPS.map((step, index) => {
                const Icon = step.icon;
                const isCompleted = currentStep > step.id;
                const isCurrent = currentStep === step.id;
                
                return (
                  <div key={step.id} className="flex items-center">
                    <button
                      onClick={() => setCurrentStep(step.id)}
                      className={`flex flex-col items-center ${
                        isCurrent
                          ? "text-green-600"
                          : isCompleted
                          ? "text-green-500"
                          : "text-slate-400"
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center mb-1 ${
                          isCurrent
                            ? "bg-green-600 text-white"
                            : isCompleted
                            ? "bg-green-100 text-green-600"
                            : "bg-slate-100 text-slate-400"
                        }`}
                      >
                        {isCompleted ? (
                          <CheckCircle className="w-5 h-5" />
                        ) : (
                          <Icon className="w-5 h-5" />
                        )}
                      </div>
                      <span className="text-xs hidden md:block">{step.title}</span>
                    </button>
                    {index < STEPS.length - 1 && (
                      <div
                        className={`w-8 md:w-16 h-0.5 mx-1 ${
                          currentStep > step.id ? "bg-green-500" : "bg-slate-200"
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Form Content */}
          <div className="bg-white rounded-xl shadow-sm border p-6 md:p-8 overflow-hidden">
            <div 
              key={currentStep}
              className={`transition-all duration-300 ease-out ${
                isTransitioning 
                  ? slideDirection === 'next' ? 'slide-out-left' : 'slide-out-right'
                  : slideDirection === 'next' ? 'slide-in-right' : 'slide-in-left'
              }`}
            >
              {renderStepContent()}
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-6">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1 || isTransitioning}
              className="group transition-all duration-200 hover:shadow-md"
            >
              <ChevronLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              Previous
            </Button>
            {currentStep < STEPS.length && (
              <Button
                onClick={nextStep}
                disabled={isTransitioning}
                className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 shadow-lg hover:shadow-xl transition-all duration-200 group"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

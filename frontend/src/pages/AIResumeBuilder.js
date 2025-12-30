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
import { 
  FileText, Sparkles, Briefcase, GraduationCap, Target, Eye, Download, 
  Plus, Trash2, Loader2, ChevronRight, ChevronLeft, RefreshCw, Lock,
  CheckCircle, AlertCircle, Maximize2, Link as LinkIcon
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

  // Form data
  const [formData, setFormData] = useState({
    template: "ats",
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
        template: formData.template
      });
      toast.success("Resume downloaded successfully!");
    } catch (error) {
      console.error("Error downloading:", error);
      toast.error("Failed to download resume");
    }
  };

  // PayPal handlers
  const createOrder = (data, actions) => {
    return actions.order.create({
      application_context: {
        shipping_preference: "NO_SHIPPING", // Digital product - no shipping required
      },
      purchase_units: [
        {
          amount: {
            value: "9.99",
            currency_code: "USD"
          },
          description: "AI Resume Builder - Professional Resume"
        }
      ]
    });
  };

  const onApprove = async (data, actions) => {
    setIsProcessingPayment(true);
    try {
      await actions.order.capture();
      setIsPaid(true);
      toast.success("Payment successful! You can now download your resume.");
      await generatePreview();
    } catch (error) {
      console.error("Payment error:", error);
      toast.error("Payment failed. Please try again.");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Navigation
  const nextStep = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
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

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Responsibilities & Achievements</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => addResponsibility(exp.id)}
              >
                <Plus className="w-3 h-3 mr-1" /> Add
              </Button>
            </div>
            {exp.responsibilities.map((resp, respIndex) => (
              <div key={respIndex} className="flex gap-2">
                <Input
                  value={resp}
                  onChange={(e) => updateResponsibility(exp.id, respIndex, e.target.value)}
                  placeholder="Describe your responsibility or achievement..."
                />
                {exp.responsibilities.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeResponsibility(exp.id, respIndex)}
                    className="text-red-500"
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
          <Button
            onClick={generateResume}
            disabled={isGenerating || !formData.jobDescription}
            size="lg"
            className="bg-green-600 hover:bg-green-700"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Generating AI Resume...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Generate AI Resume
              </>
            )}
          </Button>
        </div>
      )}

      {/* Generated Resume Content */}
      {generatedResume && (
        <div className="space-y-6">
          {/* ATS Score */}
          {generatedResume.atsScore && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-full bg-green-600 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">{generatedResume.atsScore}</span>
                </div>
                <div>
                  <p className="font-semibold text-green-800">ATS Compatibility Score</p>
                  <p className="text-sm text-green-600">Your resume is optimized for applicant tracking systems</p>
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
                  disabled={isGenerating || lockedSections.summary}
                >
                  <RefreshCw className="w-4 h-4 mr-1" />
                  Regenerate
                </Button>
              </div>
            </div>
            <p className="text-slate-600">{generatedResume.professionalSummary}</p>
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
              <div className="h-96 flex items-center justify-center bg-slate-50 rounded">
                <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
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
                <div className="text-center">
                  <p className="text-2xl font-bold text-slate-800">$9.99</p>
                  <p className="text-slate-600">One-time payment for your AI-optimized resume</p>
                </div>
                <div className="max-w-md mx-auto">
                  {isProcessingPayment ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                      <span className="ml-2 text-slate-600">Processing payment...</span>
                    </div>
                  ) : (
                    <PayPalButtons
                      style={{ layout: "vertical", color: "gold", shape: "rect" }}
                      createOrder={createOrder}
                      onApprove={onApprove}
                      onError={(err) => {
                        console.error("PayPal error:", err);
                        toast.error("Payment failed. Please try again.");
                      }}
                    />
                  )}
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
          <div className="bg-white rounded-xl shadow-sm border p-6 md:p-8">
            {renderStepContent()}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-6">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>
            {currentStep < STEPS.length && (
              <Button
                onClick={nextStep}
                className="bg-green-600 hover:bg-green-700"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

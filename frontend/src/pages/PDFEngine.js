import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import UserNavTabs from "@/components/UserNavTabs";
import {
  FileSearch,
  Upload,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  Download,
  FileText,
  Lock,
  Loader2,
  ChevronDown,
  ChevronUp,
  Zap,
  RefreshCw,
  Crown,
  AlertCircle,
  Clock,
  File,
  Building2,
  Landmark,
  Receipt,
  FileQuestion,
  BadgeCheck,
  TrendingDown,
  TrendingUp,
  Brain,
  Calculator,
  CalendarCheck,
  Sparkles,
  Edit3,
  Settings2,
  Wand2
} from "lucide-react";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";

// Document type configurations with icons
const DOCUMENT_TYPES = {
  paystub: {
    name: "Pay Stub",
    description: "Paycheck stub or earnings statement",
    icon: Receipt,
    color: "bg-blue-500",
    bgLight: "bg-blue-50",
    borderColor: "border-blue-200",
    textColor: "text-blue-700"
  },
  bank_statement: {
    name: "Bank Statement",
    description: "Bank account statement",
    icon: Landmark,
    color: "bg-emerald-500",
    bgLight: "bg-emerald-50",
    borderColor: "border-emerald-200",
    textColor: "text-emerald-700"
  },
  other: {
    name: "Other Document",
    description: "General PDF document",
    icon: FileQuestion,
    color: "bg-slate-500",
    bgLight: "bg-slate-50",
    borderColor: "border-slate-200",
    textColor: "text-slate-700"
  }
};

// Risk level colors and labels
const RISK_LEVELS = {
  low: { color: "bg-green-500", textColor: "text-green-700", bgLight: "bg-green-50", label: "Low Risk", icon: CheckCircle },
  moderate: { color: "bg-yellow-500", textColor: "text-yellow-700", bgLight: "bg-yellow-50", label: "Moderate Risk", icon: AlertTriangle },
  high: { color: "bg-orange-500", textColor: "text-orange-700", bgLight: "bg-orange-50", label: "High Risk", icon: AlertTriangle },
  very_high: { color: "bg-red-500", textColor: "text-red-700", bgLight: "bg-red-50", label: "Very High Risk", icon: XCircle }
};

// Collapsible Section Component
function CollapsibleSection({ title, icon: Icon, children, defaultOpen = false, badge = null }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-5 h-5 text-slate-600" />}
          <span className="font-medium text-slate-800">{title}</span>
          {badge && (
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${badge.className}`}>
              {badge.text}
            </span>
          )}
        </div>
        {isOpen ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
      </button>
      {isOpen && (
        <div className="p-4 bg-white">
          {children}
        </div>
      )}
    </div>
  );
}

// Risk Score Display Component
function RiskScoreDisplay({ score, level, producerMatch, documentType }) {
  const riskInfo = RISK_LEVELS[level] || RISK_LEVELS.moderate;
  const RiskIcon = riskInfo.icon;
  const docTypeInfo = DOCUMENT_TYPES[documentType] || DOCUMENT_TYPES.other;
  
  return (
    <div className={`rounded-xl p-6 ${riskInfo.bgLight} border border-slate-200`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-800">Verification Risk Score</h3>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded-lg text-xs font-medium ${docTypeInfo.bgLight} ${docTypeInfo.textColor}`}>
            {docTypeInfo.name}
          </span>
          <RiskIcon className={`w-6 h-6 ${riskInfo.textColor}`} />
        </div>
      </div>
      
      <div className="flex items-end gap-4 mb-4">
        <span className={`text-5xl font-bold ${riskInfo.textColor}`}>{score}</span>
        <span className="text-slate-500 text-lg mb-1">/100</span>
        {score <= 25 && <TrendingDown className="w-8 h-8 text-green-500 mb-1" />}
        {score > 50 && <TrendingUp className="w-8 h-8 text-red-500 mb-1" />}
      </div>
      
      {/* Progress bar */}
      <div className="w-full bg-slate-200 rounded-full h-3 mb-3">
        <div 
          className={`h-3 rounded-full ${riskInfo.color} transition-all duration-500`}
          style={{ width: `${score}%` }}
        />
      </div>
      
      <div className="flex flex-wrap items-center gap-2">
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${riskInfo.color} text-white`}>
          {riskInfo.label}
        </span>
        <span className="text-sm text-slate-500">
          {score <= 25 ? "Document appears legitimate" : 
           score <= 50 ? "Some issues detected - review findings" :
           score <= 75 ? "Multiple red flags found" : 
           "Critical issues - likely to fail verification"}
        </span>
      </div>
      
      {/* Producer Match Badge */}
      {producerMatch && (
        <div className="mt-4 p-3 bg-white rounded-lg border border-green-200">
          <div className="flex items-center gap-2">
            <BadgeCheck className="w-5 h-5 text-green-600" />
            <span className="font-medium text-green-800">Recognized Source: {producerMatch.name}</span>
          </div>
          {producerMatch.notes && (
            <p className="text-sm text-green-600 mt-1">{producerMatch.notes}</p>
          )}
        </div>
      )}
    </div>
  );
}

// Document Type Selector Component
function DocumentTypeSelector({ value, onChange, disabled }) {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-slate-700">
        Document Type
      </label>
      <div className="grid grid-cols-2 gap-2">
        {Object.entries(DOCUMENT_TYPES).map(([key, config]) => {
          const Icon = config.icon;
          const isSelected = value === key;
          
          return (
            <button
              key={key}
              type="button"
              disabled={disabled}
              onClick={() => onChange(key)}
              className={`
                p-3 rounded-lg border-2 transition-all text-left
                ${isSelected 
                  ? `${config.borderColor} ${config.bgLight} ring-2 ring-offset-1 ring-${config.color.replace('bg-', '')}`
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              <div className="flex items-center gap-2 mb-1">
                <div className={`w-8 h-8 rounded-lg ${isSelected ? config.color : 'bg-slate-100'} flex items-center justify-center`}>
                  <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-slate-500'}`} />
                </div>
                <span className={`font-medium text-sm ${isSelected ? config.textColor : 'text-slate-700'}`}>
                  {config.name}
                </span>
              </div>
              <p className="text-xs text-slate-500 ml-10">{config.description}</p>
            </button>
          );
        })}
      </div>
      <p className="text-xs text-slate-500">
        Selecting the correct document type enables specialized verification patterns and risk scoring.
      </p>
    </div>
  );
}

// Locked State Component for non-Business users
function LockedState({ onUpgrade }) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center max-w-md mx-auto p-8">
        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Lock className="w-10 h-10 text-slate-400" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-3">
          Business Feature
        </h2>
        <p className="text-slate-600 mb-6">
          The Metadata & Consistency Engine is exclusively available to Business Plan subscribers. 
          Upgrade now to access powerful PDF analysis and optimization tools.
        </p>
        <div className="space-y-3">
          <Button
            onClick={onUpgrade}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-6 text-lg font-semibold"
          >
            <Crown className="w-5 h-5 mr-2" />
            Upgrade to Business
          </Button>
          <p className="text-sm text-slate-500">
            Includes unlimited downloads, priority support, and exclusive tools
          </p>
        </div>
      </div>
    </div>
  );
}

export default function PDFEngine() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  // State
  const [hasAccess, setHasAccess] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [aiEnabled, setAiEnabled] = useState(true);
  const [documentType, setDocumentType] = useState("paystub");
  const [user, setUser] = useState(null);
  
  // Metadata editor state
  const [showMetadataEditor, setShowMetadataEditor] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [metadataFields, setMetadataFields] = useState({
    producer: '',
    creator: '',
    author: '',
    title: '',
    subject: '',
    creationDate: '',
    modificationDate: ''
  });
  const [selectedPreset, setSelectedPreset] = useState('');
  const [regeneratedPdf, setRegeneratedPdf] = useState(null);
  
  // Metadata presets
  const PRESETS = {
    gusto: { name: "Gusto", producer: "Qt 4.8.7", creator: "wkhtmltopdf 0.12.6.1", title: "Gusto" },
  };
  
  // Check access on mount
  useEffect(() => {
    checkAccess();
  }, []);
  
  const checkAccess = async () => {
    const token = localStorage.getItem("userToken");
    if (!token) {
      navigate("/login");
      return;
    }
    
    try {
      const userResponse = await fetch(`${BACKEND_URL}/api/user/me`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (userResponse.ok) {
        const userData = await userResponse.json();
        setUser(userData.user);
      }
      
      const response = await fetch(`${BACKEND_URL}/api/pdf-engine/check-access`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setHasAccess(data.hasAccess);
      } else {
        setHasAccess(false);
      }
    } catch (error) {
      console.error("Error checking access:", error);
      setHasAccess(false);
    }
  };
  
  // Handle file selection
  const handleFileSelect = useCallback((file) => {
    if (!file) return;
    
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      toast.error("Only PDF files are supported");
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File too large. Maximum size is 10MB");
      return;
    }
    
    setSelectedFile(file);
    setAnalysisResult(null);
  }, []);
  
  // Handle drag and drop
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    handleFileSelect(file);
  }, [handleFileSelect]);
  
  // Analyze PDF
  const analyzePDF = async () => {
    if (!selectedFile) return;
    
    const token = localStorage.getItem("userToken");
    if (!token) {
      navigate("/login");
      return;
    }
    
    setIsAnalyzing(true);
    
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      
      const response = await fetch(
        `${BACKEND_URL}/api/pdf-engine/analyze?document_type=${documentType}&enable_ai=${aiEnabled}`, 
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`
          },
          body: formData
        }
      );
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Analysis failed");
      }
      
      const result = await response.json();
      setAnalysisResult(result);
      toast.success("Analysis complete!");
      
    } catch (error) {
      console.error("Analysis error:", error);
      toast.error(error.message || "Failed to analyze PDF");
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  // Download normalized PDF
  const downloadNormalizedPDF = () => {
    if (!analysisResult?.normalizedPdfBase64) return;
    
    const byteCharacters = atob(analysisResult.normalizedPdfBase64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'application/pdf' });
    
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `normalized_${selectedFile?.name || 'document.pdf'}`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast.success("Normalized PDF downloaded!");
  };
  
  // Download analysis report
  const downloadReport = async (format = 'pdf') => {
    if (!selectedFile) return;
    
    const token = localStorage.getItem("userToken");
    
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      
      const response = await fetch(`${BACKEND_URL}/api/pdf-engine/generate-report?format=${format}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData
      });
      
      if (!response.ok) throw new Error("Failed to generate report");
      
      if (format === 'json') {
        const data = await response.json();
        const blob = new Blob([JSON.stringify(data.report, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analysis_report_${selectedFile.name}.json`;
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analysis_report_${selectedFile.name}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
      
      toast.success(`Report downloaded as ${format.toUpperCase()}!`);
      
    } catch (error) {
      toast.error("Failed to download report");
    }
  };
  
  // Apply preset to metadata fields
  const applyPreset = (presetKey) => {
    setSelectedPreset(presetKey);
    if (presetKey && PRESETS[presetKey]) {
      const preset = PRESETS[presetKey];
      setMetadataFields(prev => ({
        ...prev,
        producer: preset.producer || '',
        creator: preset.creator || ''
      }));
    }
  };
  
  // Prefill metadata from analysis result
  const prefillFromAnalysis = () => {
    if (analysisResult?.analysis?.metadata) {
      const meta = analysisResult.analysis.metadata;
      setMetadataFields({
        producer: meta.producer || '',
        creator: meta.creator || '',
        author: meta.author || '',
        title: meta.title || '',
        subject: meta.subject || '',
        creationDate: meta.creationDateParsed ? meta.creationDateParsed.split('T')[0] : '',
        modificationDate: meta.modificationDateParsed ? meta.modificationDateParsed.split('T')[0] : ''
      });
    }
  };
  
  // Regenerate PDF with new metadata
  const regeneratePDF = async () => {
    if (!selectedFile) return;
    
    const token = localStorage.getItem("userToken");
    if (!token) {
      navigate("/login");
      return;
    }
    
    setIsRegenerating(true);
    
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      
      // Build query params
      const params = new URLSearchParams();
      if (metadataFields.producer) params.append('producer', metadataFields.producer);
      if (metadataFields.creator) params.append('creator', metadataFields.creator);
      if (metadataFields.author) params.append('author', metadataFields.author);
      if (metadataFields.title) params.append('title', metadataFields.title);
      if (metadataFields.subject) params.append('subject', metadataFields.subject);
      if (metadataFields.creationDate) params.append('creation_date', metadataFields.creationDate);
      if (metadataFields.modificationDate) params.append('modification_date', metadataFields.modificationDate);
      if (selectedPreset) params.append('preset', selectedPreset);
      
      const response = await fetch(
        `${BACKEND_URL}/api/pdf-engine/edit-metadata?${params.toString()}`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`
          },
          body: formData
        }
      );
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Regeneration failed");
      }
      
      const result = await response.json();
      setRegeneratedPdf(result);
      toast.success("PDF regenerated successfully!");
      
    } catch (error) {
      console.error("Regeneration error:", error);
      toast.error(error.message || "Failed to regenerate PDF");
    } finally {
      setIsRegenerating(false);
    }
  };
  
  // Download regenerated PDF
  const downloadRegeneratedPDF = () => {
    if (!regeneratedPdf?.regeneratedPdfBase64) return;
    
    const byteCharacters = atob(regeneratedPdf.regeneratedPdfBase64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'application/pdf' });
    
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `regenerated_${selectedFile?.name || 'document.pdf'}`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast.success("Regenerated PDF downloaded!");
  };
  
  // Loading state
  if (hasAccess === null) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Header title="MintSlip" />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-green-600" />
        </div>
        <Footer />
      </div>
    );
  }
  
  const docTypeInfo = DOCUMENT_TYPES[analysisResult?.analysis?.documentType] || DOCUMENT_TYPES.other;
  
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header title="MintSlip" />
      
      <main className="flex-1 max-w-6xl mx-auto px-4 py-8 w-full">
        {/* Page Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <FileSearch className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">
                Metadata & Consistency Engine
              </h1>
              <p className="text-slate-500 text-sm">
                Analyze, validate, and optimize PDF documents with document-type-specific risk scoring
              </p>
            </div>
            {hasAccess && (
              <span className="ml-auto px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium flex items-center gap-1">
                <Crown className="w-4 h-4" />
                Business Feature
              </span>
            )}
          </div>
        </div>
        
        {/* Navigation Tabs */}
        <UserNavTabs />
        
        {/* Locked State for non-Business users */}
        {!hasAccess ? (
          <LockedState onUpgrade={() => navigate("/pricing")} />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Upload & Controls */}
            <div className="lg:col-span-1 space-y-4">
              {/* Document Type Selection */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <DocumentTypeSelector 
                  value={documentType}
                  onChange={setDocumentType}
                  disabled={isAnalyzing}
                />
              </div>
              
              {/* Upload Area */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <Upload className="w-5 h-5 text-slate-600" />
                  Upload PDF
                </h3>
                
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`
                    border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all
                    ${isDragging ? 'border-purple-500 bg-purple-50' : 'border-slate-300 hover:border-purple-400 hover:bg-slate-50'}
                    ${selectedFile ? 'bg-green-50 border-green-300' : ''}
                  `}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    onChange={(e) => handleFileSelect(e.target.files[0])}
                    className="hidden"
                  />
                  
                  {selectedFile ? (
                    <div className="flex flex-col items-center gap-2">
                      <File className="w-12 h-12 text-green-600" />
                      <p className="font-medium text-slate-800 truncate max-w-full">{selectedFile.name}</p>
                      <p className="text-sm text-slate-500">
                        {(selectedFile.size / 1024).toFixed(1)} KB
                      </p>
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedFile(null); setAnalysisResult(null); }}
                        className="text-sm text-red-600 hover:text-red-700 mt-2"
                      >
                        Remove file
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="w-12 h-12 text-slate-400" />
                      <p className="font-medium text-slate-700">Drop PDF here or click to browse</p>
                      <p className="text-sm text-slate-500">Maximum file size: 10MB</p>
                    </div>
                  )}
                </div>
                
                {/* Options */}
                <div className="mt-4 space-y-3">
                  <label className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg cursor-pointer hover:bg-purple-100 border border-purple-200">
                    <input
                      type="checkbox"
                      checked={aiEnabled}
                      onChange={(e) => setAiEnabled(e.target.checked)}
                      className="w-4 h-4 text-purple-600 border-slate-300 rounded focus:ring-purple-500"
                    />
                    <div>
                      <p className="font-medium text-purple-800 text-sm flex items-center gap-1">
                        <Zap className="w-4 h-4" />
                        AI-Powered Analysis
                      </p>
                      <p className="text-xs text-purple-600">Verify calculations, detect anomalies, assess legitimacy</p>
                    </div>
                  </label>
                </div>
                
                {/* Analyze Button */}
                <Button
                  onClick={analyzePDF}
                  disabled={!selectedFile || isAnalyzing}
                  className="w-full mt-4 bg-purple-600 hover:bg-purple-700 text-white py-6 text-lg font-semibold"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      {aiEnabled ? "AI Analyzing" : "Analyzing"} {DOCUMENT_TYPES[documentType]?.name}...
                    </>
                  ) : (
                    <>
                      <FileSearch className="w-5 h-5 mr-2" />
                      {aiEnabled ? "AI Analyze" : "Analyze"} {DOCUMENT_TYPES[documentType]?.name}
                    </>
                  )}
                </Button>
              </div>
              
              {/* Info Card */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <h4 className="font-medium text-slate-800 mb-2 flex items-center gap-2">
                  <Info className="w-4 h-4 text-slate-500" />
                  Document-Specific Analysis
                </h4>
                <ul className="text-sm text-slate-600 space-y-1">
                  <li><strong>Pay Stub:</strong> ADP, Paychex, Gusto, QuickBooks, Workday...</li>
                  <li><strong>Bank Statement:</strong> Chase, BofA, Wells Fargo, Citi...</li>
                  <li>• Matches against 50+ legitimate producer patterns</li>
                  <li>• Detects known fake document generators</li>
                  {aiEnabled && <li className="text-purple-600">• <strong>AI:</strong> Math verification, anomaly detection, legitimacy assessment</li>}
                </ul>
              </div>
              
              {/* Disclaimer */}
              <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                <p className="text-xs text-amber-700">
                  <strong>Disclaimer:</strong> This tool improves document consistency but does not guarantee acceptance by third-party verifiers.
                </p>
              </div>
            </div>
            
            {/* Right Column - Results */}
            <div className="lg:col-span-2 space-y-4">
              {!analysisResult ? (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
                  <FileSearch className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-700 mb-2">No Analysis Yet</h3>
                  <p className="text-slate-500">Select document type, upload a PDF, and click Analyze to see results</p>
                </div>
              ) : (
                <>
                  {/* Risk Score */}
                  <RiskScoreDisplay 
                    score={analysisResult.analysis.riskScore} 
                    level={analysisResult.analysis.riskLevel}
                    producerMatch={analysisResult.analysis.producerMatch}
                    documentType={analysisResult.analysis.documentType}
                  />
                  
                  {/* Results Sections */}
                  <div className="space-y-3">
                    {/* Metadata Summary */}
                    <CollapsibleSection
                      title="Metadata Summary"
                      icon={FileText}
                      defaultOpen={true}
                    >
                      <div className="grid grid-cols-2 gap-4">
                        {Object.entries(analysisResult.analysis.metadata || {}).map(([key, value]) => {
                          if (typeof value === 'object' || key === 'fontsUsed') return null;
                          return (
                            <div key={key} className="bg-slate-50 p-3 rounded-lg">
                              <p className="text-xs text-slate-500 uppercase tracking-wide">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                              <p className="font-medium text-slate-800 truncate" title={String(value)}>
                                {String(value) || <span className="text-slate-400 italic">Not set</span>}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </CollapsibleSection>
                    
                    {/* Risk Factors */}
                    {analysisResult.analysis.riskFactors?.length > 0 && (
                      <CollapsibleSection
                        title="Risk Factors"
                        icon={AlertTriangle}
                        badge={{ 
                          text: `${analysisResult.analysis.riskFactors.filter(f => f.points > 0).length} issues`, 
                          className: analysisResult.analysis.riskFactors.some(f => f.points > 0) ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                        }}
                        defaultOpen={true}
                      >
                        <div className="space-y-3">
                          {analysisResult.analysis.riskFactors.map((factor, idx) => {
                            const isPositive = factor.points < 0;
                            return (
                              <div 
                                key={idx} 
                                className={`flex items-start gap-3 p-3 rounded-lg border ${
                                  isPositive 
                                    ? 'bg-green-50 border-green-100' 
                                    : 'bg-red-50 border-red-100'
                                }`}
                              >
                                {isPositive 
                                  ? <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                  : <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                }
                                <div className="flex-1">
                                  <p className={`font-medium ${isPositive ? 'text-green-800' : 'text-red-800'}`}>
                                    {factor.factor.replace(/_/g, ' ')}
                                  </p>
                                  <p className={`text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                                    {factor.description}
                                  </p>
                                </div>
                                <span className={`px-2 py-1 rounded text-sm font-medium ${
                                  isPositive 
                                    ? 'bg-green-200 text-green-800' 
                                    : 'bg-red-200 text-red-800'
                                }`}>
                                  {factor.points > 0 ? '+' : ''}{factor.points}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </CollapsibleSection>
                    )}
                    
                    {/* Content Matches */}
                    {analysisResult.analysis.contentMatches?.length > 0 && (
                      <CollapsibleSection
                        title="Content Verification"
                        icon={Shield}
                        badge={{ 
                          text: `${analysisResult.analysis.contentMatches.length} patterns found`, 
                          className: "bg-blue-100 text-blue-700" 
                        }}
                      >
                        <div className="flex flex-wrap gap-2">
                          {analysisResult.analysis.contentMatches.map((pattern, idx) => (
                            <span 
                              key={idx}
                              className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm border border-blue-200"
                            >
                              {pattern.replace(/\\s\*/g, ' ').replace(/\|/g, ' or ')}
                            </span>
                          ))}
                        </div>
                        <p className="text-sm text-slate-500 mt-3">
                          These patterns are typically found in legitimate {DOCUMENT_TYPES[analysisResult.analysis.documentType]?.name || 'documents'}.
                        </p>
                      </CollapsibleSection>
                    )}
                    
                    {/* AI Analysis Results */}
                    {analysisResult.analysis.aiAnalysis && (
                      <CollapsibleSection
                        title="AI Analysis"
                        icon={Brain}
                        badge={{ 
                          text: analysisResult.analysis.aiAnalysis.overallAssessment?.replace(/_/g, ' ') || 'Complete',
                          className: analysisResult.analysis.aiAnalysis.overallAssessment === 'LIKELY_LEGITIMATE' 
                            ? "bg-green-100 text-green-700"
                            : analysisResult.analysis.aiAnalysis.overallAssessment === 'SUSPICIOUS'
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"
                        }}
                        defaultOpen={true}
                      >
                        <div className="space-y-4">
                          {/* AI Assessment Header */}
                          <div className={`p-4 rounded-lg border ${
                            analysisResult.analysis.aiAnalysis.overallAssessment === 'LIKELY_LEGITIMATE'
                              ? 'bg-green-50 border-green-200'
                              : analysisResult.analysis.aiAnalysis.overallAssessment === 'SUSPICIOUS'
                              ? 'bg-yellow-50 border-yellow-200'
                              : 'bg-red-50 border-red-200'
                          }`}>
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Sparkles className={`w-5 h-5 ${
                                  analysisResult.analysis.aiAnalysis.overallAssessment === 'LIKELY_LEGITIMATE'
                                    ? 'text-green-600'
                                    : analysisResult.analysis.aiAnalysis.overallAssessment === 'SUSPICIOUS'
                                    ? 'text-yellow-600'
                                    : 'text-red-600'
                                }`} />
                                <span className="font-semibold">
                                  {analysisResult.analysis.aiAnalysis.overallAssessment?.replace(/_/g, ' ')}
                                </span>
                              </div>
                              <span className="text-sm font-medium">
                                Confidence: {analysisResult.analysis.aiAnalysis.confidenceScore}%
                              </span>
                            </div>
                            <p className="text-sm text-slate-700">{analysisResult.analysis.aiAnalysis.summary}</p>
                          </div>
                          
                          {/* Math Verification */}
                          {analysisResult.analysis.aiAnalysis.mathVerification && (
                            <div className={`p-3 rounded-lg border ${
                              analysisResult.analysis.aiAnalysis.mathVerification.passed 
                                ? 'bg-green-50 border-green-200' 
                                : 'bg-red-50 border-red-200'
                            }`}>
                              <div className="flex items-center gap-2 mb-2">
                                <Calculator className={`w-4 h-4 ${
                                  analysisResult.analysis.aiAnalysis.mathVerification.passed ? 'text-green-600' : 'text-red-600'
                                }`} />
                                <span className="font-medium text-sm">Math Verification</span>
                                {analysisResult.analysis.aiAnalysis.mathVerification.passed 
                                  ? <CheckCircle className="w-4 h-4 text-green-600" />
                                  : <XCircle className="w-4 h-4 text-red-600" />
                                }
                              </div>
                              <p className="text-sm text-slate-600">{analysisResult.analysis.aiAnalysis.mathVerification.details}</p>
                              {analysisResult.analysis.aiAnalysis.mathVerification.issues?.length > 0 && (
                                <ul className="mt-2 text-sm text-red-600 list-disc list-inside">
                                  {analysisResult.analysis.aiAnalysis.mathVerification.issues.map((issue, i) => (
                                    <li key={i}>{issue}</li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          )}
                          
                          {/* Balance Verification (for bank statements) */}
                          {analysisResult.analysis.aiAnalysis.balanceVerification && (
                            <div className={`p-3 rounded-lg border ${
                              analysisResult.analysis.aiAnalysis.balanceVerification.passed 
                                ? 'bg-green-50 border-green-200' 
                                : 'bg-red-50 border-red-200'
                            }`}>
                              <div className="flex items-center gap-2 mb-2">
                                <Calculator className={`w-4 h-4 ${
                                  analysisResult.analysis.aiAnalysis.balanceVerification.passed ? 'text-green-600' : 'text-red-600'
                                }`} />
                                <span className="font-medium text-sm">Balance Verification</span>
                                {analysisResult.analysis.aiAnalysis.balanceVerification.passed 
                                  ? <CheckCircle className="w-4 h-4 text-green-600" />
                                  : <XCircle className="w-4 h-4 text-red-600" />
                                }
                              </div>
                              <p className="text-sm text-slate-600">{analysisResult.analysis.aiAnalysis.balanceVerification.details}</p>
                            </div>
                          )}
                          
                          {/* Date Consistency */}
                          {analysisResult.analysis.aiAnalysis.dateConsistency && (
                            <div className={`p-3 rounded-lg border ${
                              analysisResult.analysis.aiAnalysis.dateConsistency.passed 
                                ? 'bg-green-50 border-green-200' 
                                : 'bg-yellow-50 border-yellow-200'
                            }`}>
                              <div className="flex items-center gap-2 mb-2">
                                <CalendarCheck className={`w-4 h-4 ${
                                  analysisResult.analysis.aiAnalysis.dateConsistency.passed ? 'text-green-600' : 'text-yellow-600'
                                }`} />
                                <span className="font-medium text-sm">Date Consistency</span>
                                {analysisResult.analysis.aiAnalysis.dateConsistency.passed 
                                  ? <CheckCircle className="w-4 h-4 text-green-600" />
                                  : <AlertTriangle className="w-4 h-4 text-yellow-600" />
                                }
                              </div>
                              <p className="text-sm text-slate-600">{analysisResult.analysis.aiAnalysis.dateConsistency.details}</p>
                            </div>
                          )}
                          
                          {/* Red Flags */}
                          {analysisResult.analysis.aiAnalysis.redFlags?.length > 0 && (
                            <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                              <p className="font-medium text-sm text-red-800 mb-2 flex items-center gap-1">
                                <AlertCircle className="w-4 h-4" />
                                AI-Detected Red Flags
                              </p>
                              <ul className="space-y-1">
                                {analysisResult.analysis.aiAnalysis.redFlags.map((flag, i) => (
                                  <li key={i} className="text-sm text-red-700 flex items-start gap-2">
                                    <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                    {flag}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {/* Green Flags */}
                          {analysisResult.analysis.aiAnalysis.greenFlags?.length > 0 && (
                            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                              <p className="font-medium text-sm text-green-800 mb-2 flex items-center gap-1">
                                <BadgeCheck className="w-4 h-4" />
                                AI-Verified Positive Indicators
                              </p>
                              <ul className="space-y-1">
                                {analysisResult.analysis.aiAnalysis.greenFlags.map((flag, i) => (
                                  <li key={i} className="text-sm text-green-700 flex items-start gap-2">
                                    <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                    {flag}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </CollapsibleSection>
                    )}
                    
                    {/* Consistency Findings */}
                    {analysisResult.analysis.consistencyFindings?.length > 0 && (
                      <CollapsibleSection
                        title="Consistency Findings"
                        icon={Shield}
                        badge={{ 
                          text: `${analysisResult.analysis.consistencyFindings.length} items`, 
                          className: "bg-slate-100 text-slate-700" 
                        }}
                      >
                        <div className="space-y-2">
                          {analysisResult.analysis.consistencyFindings.map((finding, idx) => {
                            const severityConfig = {
                              info: { icon: Info, color: "text-blue-500", bg: "bg-blue-50", border: "border-blue-100" },
                              warning: { icon: AlertTriangle, color: "text-yellow-500", bg: "bg-yellow-50", border: "border-yellow-100" },
                              error: { icon: XCircle, color: "text-red-500", bg: "bg-red-50", border: "border-red-100" }
                            };
                            const config = severityConfig[finding.severity] || severityConfig.info;
                            const Icon = config.icon;
                            
                            return (
                              <div key={idx} className={`flex items-start gap-3 p-3 rounded-lg border ${config.bg} ${config.border}`}>
                                <Icon className={`w-5 h-5 ${config.color} flex-shrink-0 mt-0.5`} />
                                <div>
                                  <p className="font-medium text-slate-800">{finding.message}</p>
                                  {finding.details && (
                                    <p className="text-sm text-slate-600 mt-1">{finding.details}</p>
                                  )}
                                  <span className="text-xs text-slate-500 uppercase mt-1 inline-block">{finding.category}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </CollapsibleSection>
                    )}
                    
                    {/* Recommendations */}
                    {analysisResult.analysis.recommendations?.length > 0 && (
                      <CollapsibleSection
                        title="Recommendations"
                        icon={Zap}
                      >
                        <div className="space-y-3">
                          {analysisResult.analysis.recommendations.map((rec, idx) => (
                            <div key={idx} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-100">
                              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                              <div>
                                <p className="font-medium text-green-800">{rec.title}</p>
                                <p className="text-sm text-green-600">{rec.description}</p>
                                <span className={`text-xs px-2 py-0.5 rounded mt-2 inline-block ${
                                  rec.priority === 'high' ? 'bg-red-100 text-red-700' :
                                  rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-green-100 text-green-700'
                                }`}>
                                  {rec.priority} priority
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CollapsibleSection>
                    )}
                    
                    {/* Normalization Changes */}
                    {analysisResult.normalization?.changes?.length > 0 && (
                      <CollapsibleSection
                        title="Normalization Changes"
                        icon={RefreshCw}
                        badge={{ text: `${analysisResult.normalization.changes.length} changes`, className: "bg-purple-100 text-purple-700" }}
                      >
                        <div className="space-y-2">
                          {analysisResult.normalization.changes.map((change, idx) => (
                            <div key={idx} className="p-3 bg-purple-50 rounded-lg border border-purple-100">
                              <p className="font-medium text-purple-800">{change.field}</p>
                              <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                                <div>
                                  <span className="text-slate-500">Original:</span>
                                  <p className="text-slate-700 truncate">{change.original || 'N/A'}</p>
                                </div>
                                <div>
                                  <span className="text-slate-500">New:</span>
                                  <p className="text-purple-700 truncate">{change.new || 'N/A'}</p>
                                </div>
                              </div>
                              <p className="text-xs text-purple-600 mt-2">{change.reason}</p>
                            </div>
                          ))}
                        </div>
                      </CollapsibleSection>
                    )}
                  </div>
                  
                  {/* Download Options */}
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                      <Download className="w-5 h-5 text-slate-600" />
                      Download Options
                    </h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <Button
                        variant="outline"
                        onClick={() => downloadReport('pdf')}
                        className="flex items-center gap-2"
                      >
                        <FileText className="w-4 h-4" />
                        Report (PDF)
                      </Button>
                      
                      <Button
                        variant="outline"
                        onClick={() => downloadReport('json')}
                        className="flex items-center gap-2"
                      >
                        <File className="w-4 h-4" />
                        Report (JSON)
                      </Button>
                      
                      {analysisResult.normalizedPdfBase64 && (
                        <Button
                          onClick={downloadNormalizedPDF}
                          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white"
                        >
                          <Download className="w-4 h-4" />
                          Normalized PDF
                        </Button>
                      )}
                    </div>
                    
                    <p className="text-xs text-slate-500 mt-4 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Analyzed at: {new Date(analysisResult.analyzedAt).toLocaleString()}
                    </p>
                  </div>
                  
                  {/* Metadata Editor */}
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <div 
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() => setShowMetadataEditor(!showMetadataEditor)}
                    >
                      <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                        <Edit3 className="w-5 h-5 text-purple-600" />
                        Metadata Editor
                        <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">Advanced</span>
                      </h3>
                      {showMetadataEditor ? (
                        <ChevronUp className="w-5 h-5 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                    
                    {showMetadataEditor && (
                      <div className="mt-4 space-y-4">
                        <p className="text-sm text-slate-600">
                          Edit metadata and regenerate as a clean PDF without edit traces.
                        </p>
                        
                        {/* Presets */}
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Quick Presets
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(PRESETS).map(([key, preset]) => (
                              <button
                                key={key}
                                onClick={() => applyPreset(key)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                                  selectedPreset === key
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                }`}
                              >
                                {preset.name}
                              </button>
                            ))}
                          </div>
                        </div>
                        
                        {/* Prefill Button */}
                        <button
                          onClick={prefillFromAnalysis}
                          className="text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1"
                        >
                          <RefreshCw className="w-3 h-3" />
                          Prefill from current metadata
                        </button>
                        
                        {/* Metadata Fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Producer</label>
                            <input
                              type="text"
                              value={metadataFields.producer}
                              onChange={(e) => setMetadataFields(prev => ({ ...prev, producer: e.target.value }))}
                              placeholder="e.g., ADP, Inc."
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Creator</label>
                            <input
                              type="text"
                              value={metadataFields.creator}
                              onChange={(e) => setMetadataFields(prev => ({ ...prev, creator: e.target.value }))}
                              placeholder="e.g., ADP Workforce Now"
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Author</label>
                            <input
                              type="text"
                              value={metadataFields.author}
                              onChange={(e) => setMetadataFields(prev => ({ ...prev, author: e.target.value }))}
                              placeholder="Optional"
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                            <input
                              type="text"
                              value={metadataFields.title}
                              onChange={(e) => setMetadataFields(prev => ({ ...prev, title: e.target.value }))}
                              placeholder="Optional"
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Creation Date</label>
                            <input
                              type="date"
                              value={metadataFields.creationDate}
                              onChange={(e) => setMetadataFields(prev => ({ ...prev, creationDate: e.target.value }))}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Modification Date</label>
                            <input
                              type="date"
                              value={metadataFields.modificationDate}
                              onChange={(e) => setMetadataFields(prev => ({ ...prev, modificationDate: e.target.value }))}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            />
                          </div>
                        </div>
                        
                        {/* Regenerate Button */}
                        <Button
                          onClick={regeneratePDF}
                          disabled={isRegenerating || (!metadataFields.producer && !metadataFields.creator && !selectedPreset)}
                          className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                        >
                          {isRegenerating ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Regenerating...
                            </>
                          ) : (
                            <>
                              <Wand2 className="w-4 h-4 mr-2" />
                              Regenerate Clean PDF
                            </>
                          )}
                        </Button>
                        
                        {/* Regeneration Result */}
                        {regeneratedPdf && (
                          <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                            <div className="flex items-center gap-2 mb-3">
                              <CheckCircle className="w-5 h-5 text-green-600" />
                              <span className="font-medium text-green-800">PDF Regenerated Successfully</span>
                            </div>
                            
                            {/* Changes made */}
                            {regeneratedPdf.changes?.length > 0 && (
                              <div className="mb-3">
                                <p className="text-sm font-medium text-slate-700 mb-2">Changes Applied:</p>
                                <div className="space-y-1">
                                  {regeneratedPdf.changes.map((change, idx) => (
                                    <div key={idx} className="text-xs bg-white p-2 rounded border border-green-100">
                                      <span className="font-medium">{change.field}:</span>
                                      <span className="text-slate-500"> {change.original || 'N/A'}</span>
                                      <span className="text-green-600"> → {change.new}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            <Button
                              onClick={downloadRegeneratedPDF}
                              className="w-full bg-green-600 hover:bg-green-700 text-white"
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Download Regenerated PDF
                            </Button>
                            
                            <p className="text-xs text-green-700 mt-2">
                              Edit history removed. PDF appears freshly generated.
                            </p>
                          </div>
                        )}
                        
                        {/* Warning */}
                        <p className="text-xs text-amber-600 flex items-start gap-1">
                          <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                          Editing metadata does not modify document content. Use responsibly.
                        </p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
}

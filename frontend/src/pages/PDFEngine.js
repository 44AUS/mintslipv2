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
  File
} from "lucide-react";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";

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
function RiskScoreDisplay({ score, level }) {
  const riskInfo = RISK_LEVELS[level] || RISK_LEVELS.moderate;
  const RiskIcon = riskInfo.icon;
  
  return (
    <div className={`rounded-xl p-6 ${riskInfo.bgLight} border border-slate-200`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-800">Verification Risk Score</h3>
        <RiskIcon className={`w-6 h-6 ${riskInfo.textColor}`} />
      </div>
      
      <div className="flex items-end gap-4 mb-4">
        <span className={`text-5xl font-bold ${riskInfo.textColor}`}>{score}</span>
        <span className="text-slate-500 text-lg mb-1">/100</span>
      </div>
      
      {/* Progress bar */}
      <div className="w-full bg-slate-200 rounded-full h-3 mb-3">
        <div 
          className={`h-3 rounded-full ${riskInfo.color} transition-all duration-500`}
          style={{ width: `${score}%` }}
        />
      </div>
      
      <div className="flex items-center gap-2">
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${riskInfo.color} text-white`}>
          {riskInfo.label}
        </span>
        <span className="text-sm text-slate-500">
          {score <= 25 ? "Document appears well-formed" : 
           score <= 50 ? "Some issues detected" :
           score <= 75 ? "Multiple issues found" : 
           "Critical issues detected"}
        </span>
      </div>
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
  const [hasAccess, setHasAccess] = useState(null); // null = loading
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [normalizeEnabled, setNormalizeEnabled] = useState(false);
  const [user, setUser] = useState(null);
  
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
      // Get user info
      const userResponse = await fetch(`${BACKEND_URL}/api/user/me`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (userResponse.ok) {
        const userData = await userResponse.json();
        setUser(userData.user);
      }
      
      // Check PDF engine access
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
    
    // Validate file type
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      toast.error("Only PDF files are supported");
      return;
    }
    
    // Validate file size (10MB max)
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
      formData.append("normalize", normalizeEnabled.toString());
      
      const response = await fetch(`${BACKEND_URL}/api/pdf-engine/analyze?normalize=${normalizeEnabled}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData
      });
      
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
                Analyze, validate, and optimize PDF documents
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
                  <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100">
                    <input
                      type="checkbox"
                      checked={normalizeEnabled}
                      onChange={(e) => setNormalizeEnabled(e.target.checked)}
                      className="w-4 h-4 text-purple-600 border-slate-300 rounded focus:ring-purple-500"
                    />
                    <div>
                      <p className="font-medium text-slate-800 text-sm">Enable Normalization</p>
                      <p className="text-xs text-slate-500">Also optimize metadata after analysis</p>
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
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <FileSearch className="w-5 h-5 mr-2" />
                      Analyze PDF
                    </>
                  )}
                </Button>
              </div>
              
              {/* Info Card */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <h4 className="font-medium text-slate-800 mb-2 flex items-center gap-2">
                  <Info className="w-4 h-4 text-slate-500" />
                  What We Analyze
                </h4>
                <ul className="text-sm text-slate-600 space-y-1">
                  <li>• PDF metadata (producer, creator, dates)</li>
                  <li>• Timestamp consistency</li>
                  <li>• Font usage patterns</li>
                  <li>• Document structure</li>
                  <li>• Edit history traces</li>
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
                  <p className="text-slate-500">Upload a PDF and click Analyze to see results</p>
                </div>
              ) : (
                <>
                  {/* Risk Score */}
                  <RiskScoreDisplay 
                    score={analysisResult.analysis.riskScore} 
                    level={analysisResult.analysis.riskLevel}
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
                          if (typeof value === 'object') return null;
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
                        badge={{ text: `${analysisResult.analysis.riskFactors.length} found`, className: "bg-red-100 text-red-700" }}
                        defaultOpen={true}
                      >
                        <div className="space-y-3">
                          {analysisResult.analysis.riskFactors.map((factor, idx) => (
                            <div key={idx} className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-100">
                              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                              <div className="flex-1">
                                <p className="font-medium text-red-800">{factor.factor.replace(/_/g, ' ')}</p>
                                <p className="text-sm text-red-600">{factor.description}</p>
                              </div>
                              <span className="px-2 py-1 bg-red-200 text-red-800 rounded text-sm font-medium">
                                +{factor.points}
                              </span>
                            </div>
                          ))}
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

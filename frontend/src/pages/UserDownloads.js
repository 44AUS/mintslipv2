import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import UserNavTabs from "@/components/UserNavTabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  Download,
  Clock,
  Loader2,
  Calendar,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Trash2,
  FolderArchive,
  AlertTriangle,
  Settings,
  Filter,
  CalendarDays
} from "lucide-react";
import { Input } from "@/components/ui/input";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";

// Template name mapping
const TEMPLATE_NAMES = {
  // Paystub templates
  "template-a": "Gusto",
  "template-b": "ADP",
  "template-c": "Workday",
  "template-h": "OnPay",
  // Bank statement templates
  "chime": "Chime",
  "bank-of-america": "Bank of America",
  "chase": "Chase",
  // Vehicle bill of sale templates
  "standard": "Standard",
  "detailed": "Detailed",
  // Resume templates
  "modern": "Modern",
  "classic": "Classic",
  "minimal": "Minimal"
};

// Helper function to get template display name
const getTemplateName = (templateId) => {
  if (!templateId) return "-";
  return TEMPLATE_NAMES[templateId] || templateId;
};

// Document type labels (excluding bank-statement and utility-bill)
const DOCUMENT_TYPES = {
  "paystub": "Pay Stub",
  "canadian-paystub": "Canadian Pay Stub",
  "resume": "AI Resume",
  "w2": "W-2 Form",
  "w9": "W-9 Form",
  "1099-nec": "1099-NEC",
  "1099-misc": "1099-MISC",
  "offer-letter": "Offer Letter",
  "vehicle-bill-of-sale": "Vehicle Bill of Sale",
  "schedule-c": "Schedule C"
};

// All document types for display purposes (includes all)
const ALL_DOCUMENT_TYPES = {
  ...DOCUMENT_TYPES,
  "bank-statement": "Bank Statement",
  "utility-bill": "Utility Bill"
};

export default function UserDownloads() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [downloads, setDownloads] = useState([]);
  const [savedDocuments, setSavedDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavedLoading, setIsSavedLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [savedTotal, setSavedTotal] = useState(0);
  const [maxSavedDocuments, setMaxSavedDocuments] = useState(15);
  const [activeTab, setActiveTab] = useState("history");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [documentTypeFilter, setDocumentTypeFilter] = useState("all");
  const [savedDocumentTypeFilter, setSavedDocumentTypeFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [savedStartDate, setSavedStartDate] = useState("");
  const [savedEndDate, setSavedEndDate] = useState("");
  const pageSize = 10;

  useEffect(() => {
    const token = localStorage.getItem("userToken");
    const userInfo = localStorage.getItem("userInfo");
    
    if (!token || !userInfo) {
      navigate("/login");
      return;
    }

    try {
      setUser(JSON.parse(userInfo));
      fetchDownloads(token);
      fetchSavedDocuments(token);
    } catch (e) {
      navigate("/login");
    }
  }, [navigate, page, documentTypeFilter, startDate, endDate]);

  // Reset page when filter changes
  const handleFilterChange = (value) => {
    setPage(0);
    setDocumentTypeFilter(value);
  };

  // Reset page when date filters change
  const handleDateChange = (type, value) => {
    setPage(0);
    if (type === "start") {
      setStartDate(value);
    } else {
      setEndDate(value);
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setPage(0);
    setDocumentTypeFilter("all");
    setStartDate("");
    setEndDate("");
  };

  // Clear saved documents filters
  const clearSavedFilters = () => {
    setSavedDocumentTypeFilter("all");
    setSavedStartDate("");
    setSavedEndDate("");
  };

  // Filter saved documents by type and date
  const getFilteredSavedDocuments = () => {
    return savedDocuments.filter(doc => {
      // Type filter
      if (savedDocumentTypeFilter !== "all" && doc.documentType !== savedDocumentTypeFilter) {
        return false;
      }
      
      // Date filter
      if (savedStartDate || savedEndDate) {
        const docDate = new Date(doc.createdAt).toISOString().split('T')[0];
        if (savedStartDate && docDate < savedStartDate) {
          return false;
        }
        if (savedEndDate && docDate > savedEndDate) {
          return false;
        }
      }
      
      return true;
    });
  };

  const fetchDownloads = async (token) => {
    setIsLoading(true);
    try {
      let params = `skip=${page * pageSize}&limit=${pageSize}`;
      if (documentTypeFilter !== "all") {
        params += `&document_type=${documentTypeFilter}`;
      }
      if (startDate) {
        params += `&start_date=${startDate}`;
      }
      if (endDate) {
        params += `&end_date=${endDate}`;
      }
      
      const response = await fetch(
        `${BACKEND_URL}/api/user/downloads?${params}`,
        { headers: { "Authorization": `Bearer ${token}` } }
      );
      
      if (response.ok) {
        const data = await response.json();
        setDownloads(data.downloads || []);
        setTotal(data.total || 0);
      } else {
        setDownloads([]);
        setTotal(0);
      }
    } catch (error) {
      console.error("Error fetching downloads:", error);
      setDownloads([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSavedDocuments = async (token) => {
    setIsSavedLoading(true);
    try {
      const response = await fetch(
        `${BACKEND_URL}/api/user/saved-documents`,
        { headers: { "Authorization": `Bearer ${token}` } }
      );
      
      if (response.ok) {
        const data = await response.json();
        setSavedDocuments(data.documents || []);
        setSavedTotal(data.total || 0);
        setMaxSavedDocuments(data.maxDocuments || 15);
      } else {
        setSavedDocuments([]);
        setSavedTotal(0);
      }
    } catch (error) {
      console.error("Error fetching saved documents:", error);
      setSavedDocuments([]);
    } finally {
      setIsSavedLoading(false);
    }
  };

  const handleDownloadSaved = async (docId, fileName) => {
    const token = localStorage.getItem("userToken");
    try {
      const response = await fetch(
        `${BACKEND_URL}/api/user/saved-documents/${docId}/download`,
        { headers: { "Authorization": `Bearer ${token}` } }
      );
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to download");
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success("Document downloaded!");
    } catch (error) {
      toast.error(error.message || "Failed to download document");
    }
  };

  const handleDeleteSaved = async () => {
    if (!documentToDelete) return;
    
    const token = localStorage.getItem("userToken");
    setIsDeleting(true);
    
    try {
      const response = await fetch(
        `${BACKEND_URL}/api/user/saved-documents/${documentToDelete.id}`,
        { 
          method: "DELETE",
          headers: { "Authorization": `Bearer ${token}` } 
        }
      );
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to delete");
      }
      
      toast.success("Document deleted");
      setDeleteDialogOpen(false);
      setDocumentToDelete(null);
      fetchSavedDocuments(token);
    } catch (error) {
      toast.error(error.message || "Failed to delete document");
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "-";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  if (isLoading && !user) {
    return (
      <>
        <Header title="MintSlip" />
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-green-600" />
        </div>
        <Footer />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header title="MintSlip" />

      <main className="flex-1 max-w-6xl mx-auto px-4 py-8 w-full">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Downloads</h1>
          <p className="text-slate-600">View your download history and saved documents</p>
        </div>

        {/* Navigation Tabs */}
        <UserNavTabs />

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <Download className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Total Downloads</p>
                <p className="text-2xl font-bold text-slate-800">{total}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <FolderArchive className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Saved Documents</p>
                <p className="text-2xl font-bold text-slate-800">
                  {savedTotal} {maxSavedDocuments === -1 ? (
                    <span className="text-sm font-normal text-slate-400">/ ∞</span>
                  ) : (
                    <span className="text-sm font-normal text-slate-400">/ {maxSavedDocuments}</span>
                  )}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Subscription</p>
                <p className="text-lg font-bold text-slate-800">
                  {user?.subscription?.tier ? 
                    user.subscription.tier.charAt(0).toUpperCase() + user.subscription.tier.slice(1) : 
                    "None"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="history" className="gap-2">
              <Clock className="w-4 h-4" />
              Download History
            </TabsTrigger>
            <TabsTrigger value="saved" className="gap-2">
              <FolderArchive className="w-4 h-4" />
              Saved Documents
            </TabsTrigger>
          </TabsList>

          {/* Download History Tab */}
          <TabsContent value="history">
            <div className="bg-white rounded-xl shadow-sm border border-slate-100">
              <div className="p-6 border-b border-slate-100">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <h2 className="text-lg font-semibold text-slate-800">All Downloads</h2>
                  
                  {/* Filters */}
                  <div className="flex flex-wrap items-center gap-3">
                    {/* Document Type Filter */}
                    <div className="flex items-center gap-2">
                      <Filter className="w-4 h-4 text-slate-400" />
                      <Select value={documentTypeFilter} onValueChange={handleFilterChange}>
                        <SelectTrigger className="w-[160px]">
                          <SelectValue placeholder="Filter by type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Documents</SelectItem>
                          {Object.entries(DOCUMENT_TYPES).map(([key, label]) => (
                            <SelectItem key={key} value={key}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Date Range Filter */}
                    <div className="flex items-center gap-2">
                      <CalendarDays className="w-4 h-4 text-slate-400" />
                      <Input
                        type="date"
                        value={startDate}
                        onChange={(e) => handleDateChange("start", e.target.value)}
                        className="w-[140px]"
                        placeholder="Start date"
                      />
                      <span className="text-slate-400">to</span>
                      <Input
                        type="date"
                        value={endDate}
                        onChange={(e) => handleDateChange("end", e.target.value)}
                        className="w-[140px]"
                        placeholder="End date"
                      />
                    </div>
                    
                    {/* Clear Filters Button */}
                    {(documentTypeFilter !== "all" || startDate || endDate) && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={clearFilters}
                        className="text-slate-500 hover:text-slate-700"
                      >
                        Clear filters
                      </Button>
                    )}
                  </div>
                </div>
              </div>
              
              {isLoading ? (
                <div className="p-12 text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-green-600 mx-auto mb-3" />
                  <p className="text-slate-500">Loading downloads...</p>
                </div>
              ) : downloads.length === 0 ? (
                <div className="p-12 text-center">
                  <Download className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  {(documentTypeFilter !== "all" || startDate || endDate) ? (
                    <>
                      <p className="text-slate-500 mb-2">No downloads found matching your filters</p>
                      <Button 
                        variant="outline"
                        onClick={clearFilters} 
                        className="mt-4"
                      >
                        Clear Filters
                      </Button>
                    </>
                  ) : (
                    <>
                      <p className="text-slate-500 mb-2">No downloads yet</p>
                      <p className="text-sm text-slate-400">Your download history will appear here</p>
                      <Button 
                        onClick={() => navigate("/")} 
                        className="mt-4 bg-green-600 hover:bg-green-700"
                      >
                        Start Creating Documents
                      </Button>
                    </>
                  )}
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Document Type</TableHead>
                        <TableHead>Template</TableHead>
                        <TableHead>Downloaded</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {downloads.map((download, idx) => (
                        <TableRow key={download.id || idx}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                                <FileText className="w-5 h-5 text-slate-600" />
                              </div>
                              <span className="font-medium">
                                {ALL_DOCUMENT_TYPES[download.documentType] || download.documentType}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {download.template ? (
                              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-medium">
                                {getTemplateName(download.template)}
                              </span>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 text-slate-600">
                              <Clock className="w-4 h-4" />
                              {formatDate(download.downloadedAt || download.createdAt)}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {/* Pagination */}
                  {total > pageSize && (
                    <div className="p-4 border-t border-slate-100 flex items-center justify-between">
                      <p className="text-sm text-slate-600">
                        Showing {page * pageSize + 1} - {Math.min((page + 1) * pageSize, total)} of {total}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={page === 0}
                          onClick={() => setPage(p => p - 1)}
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={(page + 1) * pageSize >= total}
                          onClick={() => setPage(p => p + 1)}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </TabsContent>

          {/* Saved Documents Tab */}
          <TabsContent value="saved">
            <div className="bg-white rounded-xl shadow-sm border border-slate-100">
              <div className="p-6 border-b border-slate-100">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-800">Saved Documents</h2>
                    <p className="text-sm text-slate-500">Documents are kept for 30 days</p>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-3">
                    {/* Filter for saved documents */}
                    <div className="flex items-center gap-2">
                      <Filter className="w-4 h-4 text-slate-400" />
                      <Select value={savedDocumentTypeFilter} onValueChange={setSavedDocumentTypeFilter}>
                        <SelectTrigger className="w-[160px]">
                          <SelectValue placeholder="Filter by type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Documents</SelectItem>
                          {Object.entries(DOCUMENT_TYPES).map(([key, label]) => (
                            <SelectItem key={key} value={key}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Date Range Filter for Saved Documents */}
                    <div className="flex items-center gap-2">
                      <CalendarDays className="w-4 h-4 text-slate-400" />
                      <Input
                        type="date"
                        value={savedStartDate}
                        onChange={(e) => setSavedStartDate(e.target.value)}
                        className="w-[140px]"
                        placeholder="Start date"
                      />
                      <span className="text-slate-400">to</span>
                      <Input
                        type="date"
                        value={savedEndDate}
                        onChange={(e) => setSavedEndDate(e.target.value)}
                        className="w-[140px]"
                        placeholder="End date"
                      />
                    </div>
                    
                    {/* Clear Filters Button */}
                    {(savedDocumentTypeFilter !== "all" || savedStartDate || savedEndDate) && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={clearSavedFilters}
                        className="text-slate-500 hover:text-slate-700"
                      >
                        Clear filters
                      </Button>
                    )}
                    
                    {!user?.preferences?.saveDocuments && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => navigate("/user/settings")}
                        className="gap-2"
                      >
                        <Settings className="w-4 h-4" />
                        Enable Saving
                      </Button>
                    )}
                  </div>
                </div>
              </div>
              
              {isSavedLoading ? (
                <div className="p-12 text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-green-600 mx-auto mb-3" />
                  <p className="text-slate-500">Loading saved documents...</p>
                </div>
              ) : getFilteredSavedDocuments().length === 0 ? (
                <div className="p-12 text-center">
                  <FolderArchive className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  {(savedDocumentTypeFilter !== "all" || savedStartDate || savedEndDate) ? (
                    <>
                      <p className="text-slate-500 mb-2">No saved documents matching your filters</p>
                      <Button 
                        variant="outline"
                        onClick={clearSavedFilters} 
                        className="mt-4"
                      >
                        Clear Filters
                      </Button>
                    </>
                  ) : user?.preferences?.saveDocuments ? (
                    <p className="text-sm text-slate-400">
                      Documents you download will be saved here automatically
                    </p>
                  ) : (
                    <>
                      <p className="text-sm text-slate-400 mb-4">
                        Enable document saving in settings to keep copies of your downloads
                      </p>
                      <Button 
                        onClick={() => navigate("/user/settings")}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Enable in Settings
                      </Button>
                    </>
                  )}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Document</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Expires In</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getFilteredSavedDocuments().map((doc) => (
                      <TableRow key={doc.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                              <FileText className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                              <p className="font-medium text-slate-800">
                                {ALL_DOCUMENT_TYPES[doc.documentType] || doc.documentType}
                              </p>
                              <p className="text-xs text-slate-500 truncate max-w-[200px]">
                                {doc.fileName}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-slate-600">{formatFileSize(doc.fileSize)}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            <span className={`${doc.daysRemaining <= 7 ? 'text-orange-600 font-medium' : 'text-slate-600'}`}>
                              {doc.daysRemaining} days
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownloadSaved(doc.id, doc.fileName)}
                              className="gap-1"
                            >
                              <Download className="w-4 h-4" />
                              Download
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setDocumentToDelete(doc);
                                setDeleteDialogOpen(true);
                              }}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Delete Document
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{documentToDelete?.fileName}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteSaved}
              disabled={isDeleting}
            >
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}

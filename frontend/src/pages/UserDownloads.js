import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FileText,
  Download,
  Clock,
  LogOut,
  Settings,
  User,
  Loader2,
  Calendar,
  Sparkles,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";

// Document type labels
const DOCUMENT_TYPES = {
  "paystub": "Pay Stub",
  "canadian-paystub": "Canadian Pay Stub",
  "resume": "AI Resume",
  "w2": "W-2 Form",
  "w9": "W-9 Form",
  "1099-nec": "1099-NEC",
  "1099-misc": "1099-MISC",
  "bank-statement": "Bank Statement",
  "offer-letter": "Offer Letter",
  "vehicle-bill-of-sale": "Vehicle Bill of Sale",
  "schedule-c": "Schedule C",
  "utility-bill": "Utility Bill"
};

export default function UserDownloads() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [downloads, setDownloads] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
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
    } catch (e) {
      navigate("/login");
    }
  }, [navigate, page]);

  const fetchDownloads = async (token) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${BACKEND_URL}/api/user/downloads?skip=${page * pageSize}&limit=${pageSize}`,
        { headers: { "Authorization": `Bearer ${token}` } }
      );
      
      if (response.ok) {
        const data = await response.json();
        setDownloads(data.downloads || []);
        setTotal(data.total || 0);
      } else {
        // For demo, show empty state
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

  const handleLogout = () => {
    localStorage.removeItem("userToken");
    localStorage.removeItem("userInfo");
    navigate("/login");
  };

  if (isLoading && !user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-800">MintSlip</span>
            </Link>
          </div>
          
          <nav className="flex items-center gap-6">
            <Link to="/user/dashboard" className="text-slate-600 hover:text-slate-800 text-sm font-medium">
              Dashboard
            </Link>
            <Link to="/user/downloads" className="text-green-600 font-medium text-sm">
              Downloads
            </Link>
            <Link to="/user/settings" className="text-slate-600 hover:text-slate-800 text-sm font-medium">
              Settings
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="gap-2 text-slate-600 hover:text-slate-800"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Download History</h1>
          <p className="text-slate-600">View your recent document downloads</p>
        </div>

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
                <Sparkles className="w-6 h-6 text-blue-600" />
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
          
          <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">This Month</p>
                <p className="text-2xl font-bold text-slate-800">
                  {downloads.filter(d => {
                    const date = new Date(d.downloadedAt || d.createdAt);
                    const now = new Date();
                    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
                  }).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Downloads Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-lg font-semibold text-slate-800">Recent Downloads</h2>
          </div>
          
          {isLoading ? (
            <div className="p-12 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-green-600 mx-auto mb-3" />
              <p className="text-slate-500">Loading downloads...</p>
            </div>
          ) : downloads.length === 0 ? (
            <div className="p-12 text-center">
              <Download className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 mb-2">No downloads yet</p>
              <p className="text-sm text-slate-400">Your download history will appear here</p>
              <Button 
                onClick={() => navigate("/")} 
                className="mt-4 bg-green-600 hover:bg-green-700"
              >
                Start Creating Documents
              </Button>
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
                            {DOCUMENT_TYPES[download.documentType] || download.documentType}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {download.template ? (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-mono">
                            {download.template}
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
      </main>
    </div>
  );
}

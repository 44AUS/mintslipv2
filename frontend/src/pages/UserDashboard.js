import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import UserNavTabs from "@/components/UserNavTabs";
import {
  FileText,
  Download,
  LogOut,
  Settings,
  Zap,
  Sparkles,
  Crown,
  ArrowRight,
  Loader2,
  Plus,
  FolderArchive,
  Trash2,
  Calendar,
  AlertTriangle,
  Mail
} from "lucide-react";

// Document type labels for proper display
const ALL_DOCUMENT_TYPES = {
  "paystub": "Pay Stub",
  "canadian-paystub": "Canadian Pay Stub",
  "resume": "AI Resume",
  "w2": "W-2 Form",
  "w9": "W-9 Form",
  "1099-nec": "1099-NEC",
  "1099-misc": "1099-MISC",
  "offer-letter": "Offer Letter",
  "vehicle-bill-of-sale": "Vehicle Bill of Sale",
  "schedule-c": "Schedule C",
  "bank-statement": "Bank Statement",
  "utility-bill": "Utility Bill"
};

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";

// Subscription tiers
const SUBSCRIPTION_TIERS = {
  starter: { name: "Starter", price: 19.99, downloads: 10, icon: Zap, color: "green" },
  professional: { name: "Professional", price: 29.99, downloads: 30, icon: Sparkles, color: "blue" },
  business: { name: "Business", price: 49.99, downloads: -1, icon: Crown, color: "purple" }
};

// Document types for quick actions
const QUICK_ACTIONS = [
  { name: "Pay Stub", path: "/paystub-generator", icon: "💰" },
  { name: "Canada Pay Stub", path: "/canadian-paystub-generator", icon: "🍁" },
  { name: "W-2 Form", path: "/w2-generator", icon: "📋" },
  { name: "AI Resume", path: "/ai-resume-builder", icon: "📄" },
];

export default function UserDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [recentDownloads, setRecentDownloads] = useState([]);
  const [savedDocuments, setSavedDocuments] = useState([]);
  const [savedDocsCount, setSavedDocsCount] = useState({ count: 0, maxDocuments: 15 });

  useEffect(() => {
    const token = localStorage.getItem("userToken");
    const userInfo = localStorage.getItem("userInfo");
    
    if (!token || !userInfo) {
      navigate("/login");
      return;
    }

    try {
      // Set initial user from localStorage
      setUser(JSON.parse(userInfo));
      // Fetch fresh user data from backend
      fetchUserProfile(token);
      fetchRecentDownloads(token);
      fetchSavedDocuments(token);
    } catch (e) {
      navigate("/login");
    }
    setIsLoading(false);
  }, [navigate]);

  const fetchUserProfile = async (token) => {
    try {
      const response = await fetch(
        `${BACKEND_URL}/api/user/me`,
        { headers: { "Authorization": `Bearer ${token}` } }
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user) {
          setUser(data.user);
          // Update localStorage with fresh data
          localStorage.setItem("userInfo", JSON.stringify(data.user));
        }
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  };

  const fetchRecentDownloads = async (token) => {
    try {
      const response = await fetch(
        `${BACKEND_URL}/api/user/downloads?limit=5`,
        { headers: { "Authorization": `Bearer ${token}` } }
      );
      
      if (response.ok) {
        const data = await response.json();
        setRecentDownloads(data.downloads || []);
      }
    } catch (error) {
      console.error("Error fetching downloads:", error);
    }
  };

  const fetchSavedDocuments = async (token) => {
    try {
      const response = await fetch(
        `${BACKEND_URL}/api/user/saved-documents?limit=3`,
        { headers: { "Authorization": `Bearer ${token}` } }
      );
      
      if (response.ok) {
        const data = await response.json();
        setSavedDocuments(data.documents || []);
        setSavedDocsCount({ count: data.total || 0, maxDocuments: data.maxDocuments || 15 });
      }
    } catch (error) {
      console.error("Error fetching saved documents:", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("userToken");
    localStorage.removeItem("userInfo");
    navigate("/login");
  };

  const currentTier = user?.subscription?.tier ? SUBSCRIPTION_TIERS[user.subscription.tier] : null;
  const CurrentTierIcon = currentTier?.icon || Zap;
  
  // Get downloads remaining from subscription data
  const subscriptionDownloadsRemaining = user?.subscription?.downloads_remaining;
  const subscriptionDownloadsTotal = user?.subscription?.downloads_total || currentTier?.downloads || 0;
  
  // Display downloads remaining
  const downloadsRemaining = subscriptionDownloadsRemaining === -1 
    ? "∞" 
    : (subscriptionDownloadsRemaining ?? 0);
  
  // Calculate downloads used for progress bar
  const downloadsUsed = subscriptionDownloadsTotal === -1 
    ? 0 
    : Math.max(0, subscriptionDownloadsTotal - (subscriptionDownloadsRemaining ?? 0));

  if (isLoading) {
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
        {/* Email Verification Warning */}
        {user && user.emailVerified === false && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-amber-800">Email Not Verified</h3>
              <p className="text-sm text-amber-700 mt-1">
                Your email address ({user.email}) has not been verified. Please check your inbox for the verification email.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3 border-amber-300 text-amber-700 hover:bg-amber-100"
                onClick={async () => {
                  try {
                    const token = localStorage.getItem("userToken");
                    const response = await fetch(`${BACKEND_URL}/api/user/resend-verification`, {
                      method: "POST",
                      headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json"
                      }
                    });
                    const data = await response.json();
                    if (response.ok) {
                      alert("Verification email sent! Please check your inbox.");
                    } else {
                      alert(data.detail || "Failed to send verification email");
                    }
                  } catch (error) {
                    alert("Failed to send verification email. Please try again.");
                  }
                }}
              >
                <Mail className="w-4 h-4 mr-2" />
                Resend Verification Email
              </Button>
            </div>
          </div>
        )}

        {/* Welcome Section */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800 mb-2">
            Welcome back, {user?.name?.split(' ')[0] || "User"}! 👋
          </h1>
          <p className="text-slate-600">Here's your account overview</p>
        </div>

        {/* Navigation Tabs */}
        <UserNavTabs />

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Subscription Card */}
          <div className={`rounded-xl p-6 ${
            currentTier?.color === "green" ? "bg-gradient-to-br from-green-500 to-green-600" :
            currentTier?.color === "blue" ? "bg-gradient-to-br from-blue-500 to-blue-600" :
            currentTier?.color === "purple" ? "bg-gradient-to-br from-purple-500 to-purple-600" :
            "bg-gradient-to-br from-slate-400 to-slate-500"
          } text-white`}>
            <div className="flex items-center justify-between mb-4">
              <CurrentTierIcon className="w-8 h-8" />
              <span className="px-2 py-1 bg-white/20 rounded-full text-xs font-medium">
                {currentTier ? "Active" : "No Plan"}
              </span>
            </div>
            <h3 className="text-lg font-semibold mb-1">
              {currentTier?.name || "Free"} Plan
            </h3>
            <p className="text-white/80 text-sm">
              {currentTier ? `$${currentTier.price}/month` : "Upgrade for more features"}
            </p>
            {!currentTier && (
              <Button 
                onClick={() => navigate("/subscription/choose")}
                className="mt-4 bg-white text-slate-800 hover:bg-white/90"
                size="sm"
              >
                Choose a Plan
              </Button>
            )}
          </div>

          {/* Downloads Remaining */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <Download className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Downloads Remaining</p>
                <p className="text-2xl font-bold text-slate-800">{downloadsRemaining}</p>
              </div>
            </div>
            {subscriptionDownloadsTotal !== -1 && subscriptionDownloadsTotal > 0 && (
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div 
                  className="h-2 rounded-full bg-green-600"
                  style={{ 
                    width: `${Math.max(0, ((subscriptionDownloadsRemaining ?? 0) / subscriptionDownloadsTotal) * 100)}%` 
                  }}
                />
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Downloads Used This Month</p>
                <p className="text-2xl font-bold text-slate-800">{downloadsUsed}</p>
              </div>
            </div>
            <Link 
              to="/user/downloads" 
              className="text-sm text-green-600 hover:text-green-700 font-medium flex items-center gap-1"
            >
              View History <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {QUICK_ACTIONS.map((action) => (
              <Link
                key={action.path}
                to={action.path}
                className="bg-white rounded-xl shadow-sm p-4 border border-slate-100 hover:border-green-200 hover:shadow-md transition-all group"
              >
                <span className="text-2xl mb-2 block">{action.icon}</span>
                <h3 className="font-medium text-slate-800 group-hover:text-green-600">
                  {action.name}
                </h3>
                <p className="text-xs text-slate-500">Create new</p>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-800">Recent Downloads</h2>
            <Link 
              to="/user/downloads" 
              className="text-sm text-green-600 hover:text-green-700 font-medium"
            >
              View All
            </Link>
          </div>
          
          {recentDownloads.length === 0 ? (
            <div className="p-12 text-center">
              <Download className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 mb-2">No downloads yet</p>
              <p className="text-sm text-slate-400 mb-4">Create your first document to get started</p>
              <Button 
                onClick={() => navigate("/paystub-generator")}
                className="bg-green-600 hover:bg-green-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Document
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentDownloads.map((download, idx) => (
                <div key={download.id || idx} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-slate-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-800">
                        {ALL_DOCUMENT_TYPES[download.documentType] || download.documentType}
                      </p>
                      {download.fileName && (
                        <p className="text-xs text-slate-500 truncate max-w-[200px]">
                          {download.fileName}
                        </p>
                      )}
                      <p className="text-sm text-slate-500">
                        {new Date(download.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Saved Documents Section */}
        {user?.preferences?.saveDocuments && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 mt-6">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderArchive className="w-5 h-5 text-green-600" />
                <h2 className="text-lg font-semibold text-slate-800">Saved Documents</h2>
                <span className="text-sm text-slate-500">
                  ({savedDocsCount.count}/{savedDocsCount.maxDocuments})
                </span>
              </div>
              <Link 
                to="/user/downloads" 
                className="text-sm text-green-600 hover:text-green-700 font-medium"
              >
                View All
              </Link>
            </div>
            
            {savedDocuments.length === 0 ? (
              <div className="p-8 text-center">
                <FolderArchive className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-500 text-sm">No saved documents yet</p>
                <p className="text-xs text-slate-400">Documents will be saved when you download</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {savedDocuments.map((doc) => (
                  <div key={doc.id} className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">
                          {ALL_DOCUMENT_TYPES[doc.documentType] || doc.documentType}
                        </p>
                        {doc.fileName && (
                          <p className="text-xs text-slate-500 truncate max-w-[200px]">
                            {doc.fileName}
                          </p>
                        )}
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Expires in {doc.daysRemaining} days
                        </p>
                      </div>
                    </div>
                    <Link 
                      to="/user/downloads"
                      className="text-green-600 hover:text-green-700"
                    >
                      <Download className="w-5 h-5" />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

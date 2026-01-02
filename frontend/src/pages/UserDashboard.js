import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
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
  Plus
} from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";

// Subscription tiers
const SUBSCRIPTION_TIERS = {
  starter: { name: "Starter", price: 9.99, downloads: 10, icon: Zap, color: "green" },
  professional: { name: "Professional", price: 19.99, downloads: 30, icon: Sparkles, color: "blue" },
  business: { name: "Business", price: 49.99, downloads: -1, icon: Crown, color: "purple" }
};

// Document types for quick actions
const QUICK_ACTIONS = [
  { name: "Pay Stub", path: "/paystub-generator", icon: "💰" },
  { name: "Bank Statement", path: "/bank-statement-generator", icon: "🏦" },
  { name: "W-2 Form", path: "/w2-generator", icon: "📋" },
  { name: "AI Resume", path: "/ai-resume-builder", icon: "📄" },
];

export default function UserDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [recentDownloads, setRecentDownloads] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("userToken");
    const userInfo = localStorage.getItem("userInfo");
    
    if (!token || !userInfo) {
      navigate("/login");
      return;
    }

    try {
      setUser(JSON.parse(userInfo));
      fetchRecentDownloads(token);
    } catch (e) {
      navigate("/login");
    }
    setIsLoading(false);
  }, [navigate]);

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

  const handleLogout = () => {
    localStorage.removeItem("userToken");
    localStorage.removeItem("userInfo");
    navigate("/login");
  };

  const currentTier = user?.subscription?.tier ? SUBSCRIPTION_TIERS[user.subscription.tier] : null;
  const CurrentTierIcon = currentTier?.icon || Zap;
  const downloadsRemaining = currentTier 
    ? (currentTier.downloads === -1 ? "∞" : Math.max(0, currentTier.downloads - (user?.downloadsUsed || 0)))
    : 0;

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
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-800 mb-2">
            Welcome back, {user?.name?.split(' ')[0] || "User"}! 👋
          </h1>
          <p className="text-slate-600">Here's your account overview</p>
        </div>

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
            {currentTier && currentTier.downloads !== -1 && (
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div 
                  className="h-2 rounded-full bg-green-600"
                  style={{ 
                    width: `${Math.max(0, 100 - ((user?.downloadsUsed || 0) / currentTier.downloads) * 100)}%` 
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
                <p className="text-sm text-slate-500">Total Downloads</p>
                <p className="text-2xl font-bold text-slate-800">{user?.downloadsUsed || 0}</p>
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
                      <p className="font-medium text-slate-800">{download.documentType}</p>
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
      </main>

      <Footer />
    </div>
  );
}

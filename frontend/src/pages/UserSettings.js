import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import UserNavTabs from "@/components/UserNavTabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  LogOut,
  Settings,
  User,
  Loader2,
  CreditCard,
  Bell,
  Shield,
  Zap,
  Sparkles,
  Crown,
  AlertTriangle,
  Check,
  ArrowUp,
  ArrowDown,
  FolderArchive,
  Mail,
  Eye,
  EyeOff
} from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";

// Subscription tiers (matching PayPal plan tiers)
const SUBSCRIPTION_TIERS = {
  starter: { name: "Starter", price: 19.99, downloads: 10, icon: Zap, color: "green" },
  professional: { name: "Professional", price: 29.99, downloads: 30, icon: Sparkles, color: "blue" },
  business: { name: "Business", price: 49.99, downloads: -1, icon: Crown, color: "purple" }
};

export default function UserSettings() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [selectedNewTier, setSelectedNewTier] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSavingPreference, setIsSavingPreference] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [passwordError, setPasswordError] = useState("");
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [emailData, setEmailData] = useState({
    newEmail: "",
    password: "",
    showPassword: false
  });
  const [emailError, setEmailError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("userToken");
    const userInfo = localStorage.getItem("userInfo");
    
    if (!token || !userInfo) {
      navigate("/login");
      return;
    }

    try {
      setUser(JSON.parse(userInfo));
      // Fetch fresh user data from backend
      fetchUserProfile(token);
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

  const handleLogout = () => {
    localStorage.removeItem("userToken");
    localStorage.removeItem("userInfo");
    navigate("/login");
  };

  const handleChangePassword = async () => {
    setPasswordError("");
    
    // Validate
    if (!passwordData.currentPassword) {
      setPasswordError("Please enter your current password");
      return;
    }
    if (!passwordData.newPassword) {
      setPasswordError("Please enter a new password");
      return;
    }
    if (passwordData.newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters");
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }
    
    setIsProcessing(true);
    try {
      const token = localStorage.getItem("userToken");
      const response = await fetch(`${BACKEND_URL}/api/user/change-password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || "Failed to change password");
      }
      
      toast.success("Password changed successfully!");
      setShowPasswordDialog(false);
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error) {
      setPasswordError(error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleChangeEmail = async () => {
    setEmailError("");
    
    // Validate
    if (!emailData.newEmail) {
      setEmailError("Please enter a new email address");
      return;
    }
    if (!emailData.newEmail.includes("@")) {
      setEmailError("Please enter a valid email address");
      return;
    }
    if (!emailData.password) {
      setEmailError("Please enter your password to confirm");
      return;
    }
    if (emailData.newEmail.toLowerCase() === user?.email?.toLowerCase()) {
      setEmailError("New email is the same as your current email");
      return;
    }
    
    setIsProcessing(true);
    try {
      const token = localStorage.getItem("userToken");
      const response = await fetch(`${BACKEND_URL}/api/user/change-email`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          newEmail: emailData.newEmail,
          password: emailData.password
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || "Failed to change email");
      }
      
      // Update local storage with new user info
      if (data.user) {
        localStorage.setItem("userInfo", JSON.stringify(data.user));
        setUser(data.user);
      }
      
      toast.success("Email updated! Please check your inbox to verify your new email.");
      setShowEmailDialog(false);
      setEmailData({ newEmail: "", password: "", showPassword: false });
      
      // Redirect to verify email page
      navigate("/verify-email");
    } catch (error) {
      setEmailError(error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelSubscription = async () => {
    setIsProcessing(true);
    try {
      const token = localStorage.getItem("userToken");
      
      // Call the backend API to cancel subscription
      const response = await fetch(`${BACKEND_URL}/api/stripe/cancel-subscription`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || "Failed to cancel subscription");
      }
      
      toast.success("Subscription cancellation scheduled. Your access will continue until the end of your billing period.");
      setShowCancelDialog(false);
      
      // Update local user state with cancelling status
      const updatedUser = { 
        ...user, 
        subscription: { 
          ...user.subscription, 
          status: 'cancelling' 
        } 
      };
      localStorage.setItem("userInfo", JSON.stringify(updatedUser));
      setUser(updatedUser);
      
      // Refresh user data from backend to ensure sync
      const userResponse = await fetch(`${BACKEND_URL}/api/user/me`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (userResponse.ok) {
        const userData = await userResponse.json();
        if (userData.user) {
          localStorage.setItem("userInfo", JSON.stringify(userData.user));
          setUser(userData.user);
        }
      }
    } catch (error) {
      console.error("Cancel subscription error:", error);
      toast.error(error.message || "Failed to cancel subscription. Please contact support.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReactivateSubscription = async () => {
    setIsProcessing(true);
    try {
      const token = localStorage.getItem("userToken");
      
      const response = await fetch(`${BACKEND_URL}/api/stripe/reactivate-subscription`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || "Failed to reactivate subscription");
      }
      
      toast.success("Subscription reactivated successfully!");
      
      // Refresh user data from backend
      const userResponse = await fetch(`${BACKEND_URL}/api/user/me`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (userResponse.ok) {
        const userData = await userResponse.json();
        if (userData.user) {
          localStorage.setItem("userInfo", JSON.stringify(userData.user));
          setUser(userData.user);
        }
      }
    } catch (error) {
      console.error("Reactivate subscription error:", error);
      toast.error(error.message || "Failed to reactivate subscription. Please contact support.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleChangePlan = async () => {
    if (!selectedNewTier) {
      toast.error("Please select a plan");
      return;
    }

    setIsProcessing(true);
    try {
      const token = localStorage.getItem("userToken");
      
      // First preview the proration
      const previewResponse = await fetch(`${BACKEND_URL}/api/stripe/preview-proration`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ tier: selectedNewTier })
      });
      
      const previewData = await previewResponse.json();
      
      if (!previewResponse.ok) {
        throw new Error(previewData.detail || "Failed to preview plan change");
      }
      
      // Show confirmation with prorated amount
      const confirmMessage = previewData.preview.immediateCharge 
        ? `You will be charged $${previewData.preview.netAmountDue.toFixed(2)} now for the prorated difference. Continue?`
        : `Your plan will be changed to ${SUBSCRIPTION_TIERS[selectedNewTier].name}. Continue?`;
      
      if (!window.confirm(confirmMessage)) {
        setIsProcessing(false);
        return;
      }
      
      // Process the actual change
      const changeResponse = await fetch(`${BACKEND_URL}/api/stripe/change-subscription`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ tier: selectedNewTier })
      });
      
      const changeData = await changeResponse.json();
      
      if (!changeResponse.ok) {
        throw new Error(changeData.detail || "Failed to change plan");
      }
      
      // Refresh user data from server
      const userResponse = await fetch(`${BACKEND_URL}/api/user/me`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const userData = await userResponse.json();
      
      if (userData.success && userData.user) {
        localStorage.setItem("userInfo", JSON.stringify(userData.user));
        setUser(userData.user);
      }
      
      toast.success(`Successfully changed to ${SUBSCRIPTION_TIERS[selectedNewTier].name} plan!`);
      setShowUpgradeDialog(false);
      setSelectedNewTier(null);
    } catch (error) {
      console.error("Error changing plan:", error);
      toast.error(error.message || "Failed to change plan. Please contact support.");
    } finally {
      setIsProcessing(false);
    }
  };

  const currentTier = user?.subscription?.tier ? SUBSCRIPTION_TIERS[user.subscription.tier] : null;
  const CurrentTierIcon = currentTier?.icon || Zap;

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
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Account Settings</h1>
          <p className="text-slate-600">Manage your account and subscription</p>
        </div>

        {/* Navigation Tabs */}
        <UserNavTabs />

        {/* Profile Section */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 mb-6">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <User className="w-5 h-5" />
              Profile
            </h2>
          </div>
          <div className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-white">
                  {user?.name?.charAt(0)?.toUpperCase() || "U"}
                </span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-800">{user?.name || "User"}</h3>
                <p className="text-slate-500">{user?.email || "No email"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Subscription Section */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 mb-6">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Subscription
            </h2>
          </div>
          <div className="p-6">
            {user?.subscription ? (
              <div className="space-y-6">
                {/* Current Plan */}
                <div className={`p-4 rounded-xl border-2 ${
                  currentTier?.color === "green" ? "border-green-200 bg-green-50" :
                  currentTier?.color === "blue" ? "border-blue-200 bg-blue-50" :
                  "border-purple-200 bg-purple-50"
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        currentTier?.color === "green" ? "bg-green-100" :
                        currentTier?.color === "blue" ? "bg-blue-100" :
                        "bg-purple-100"
                      }`}>
                        <CurrentTierIcon className={`w-6 h-6 ${
                          currentTier?.color === "green" ? "text-green-600" :
                          currentTier?.color === "blue" ? "text-blue-600" :
                          "text-purple-600"
                        }`} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-800">{currentTier?.name} Plan</h3>
                        <p className="text-sm text-slate-600">
                          ${currentTier?.price}/month • {currentTier?.downloads === -1 ? "Unlimited" : currentTier?.downloads} downloads
                        </p>
                      </div>
                    </div>
                    {user?.subscription?.status === 'cancelling' ? (
                      <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">
                        Cancelling
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                        Active
                      </span>
                    )}
                  </div>
                </div>

                {/* Cancellation Notice */}
                {user?.subscription?.status === 'cancelling' && (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-amber-800">Subscription Cancelling</h4>
                        <p className="text-sm text-amber-700 mt-1">
                          Your subscription will end at the end of your current billing period. You'll retain access until then.
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleReactivateSubscription}
                          disabled={isProcessing}
                          className="mt-3 text-amber-700 border-amber-300 hover:bg-amber-100"
                        >
                          {isProcessing ? "Processing..." : "Reactivate Subscription"}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Usage */}
                <div className="p-4 bg-slate-50 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-600">Downloads remaining</span>
                    <span className="font-semibold text-slate-800">
                      {user?.subscription?.downloads_remaining === -1 ? "∞" : (user?.subscription?.downloads_remaining ?? 0)} / {user?.subscription?.downloads_total === -1 ? "∞" : (user?.subscription?.downloads_total ?? currentTier?.downloads ?? 0)}
                    </span>
                  </div>
                  {user?.subscription?.downloads_total !== -1 && user?.subscription?.downloads_total > 0 && (
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          currentTier?.color === "green" ? "bg-green-600" :
                          currentTier?.color === "blue" ? "bg-blue-600" :
                          "bg-purple-600"
                        }`}
                        style={{ width: `${Math.min(((user?.subscription?.downloads_remaining ?? 0) / (user?.subscription?.downloads_total ?? 1)) * 100, 100)}%` }}
                      />
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowUpgradeDialog(true)}
                    className="gap-2"
                  >
                    <ArrowUp className="w-4 h-4" />
                    Change Plan
                  </Button>
                  {user?.subscription?.status !== 'cancelling' && (
                    <Button
                      variant="outline"
                      onClick={() => setShowCancelDialog(true)}
                      className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                    >
                      <AlertTriangle className="w-4 h-4" />
                      Cancel Subscription
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <CreditCard className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 mb-4">You don't have an active subscription</p>
                <Button 
                  onClick={() => navigate("/subscription/choose")}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Choose a Plan
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Preferences Section */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 mb-6">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <FolderArchive className="w-5 h-5" />
              Document Storage
            </h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
              <div className="flex-1 mr-4">
                <h4 className="font-medium text-slate-800">Save Documents for Later</h4>
                <p className="text-sm text-slate-500">
                  Keep copies of your generated PDFs/ZIPs for up to 30 days. Storage limits vary by plan.
                </p>
              </div>
              <Switch
                checked={user?.preferences?.saveDocuments || false}
                disabled={isSavingPreference}
                onCheckedChange={async (checked) => {
                  setIsSavingPreference(true);
                  try {
                    const token = localStorage.getItem("userToken");
                    const response = await fetch(`${BACKEND_URL}/api/user/preferences`, {
                      method: "PUT",
                      headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                      },
                      body: JSON.stringify({ saveDocuments: checked })
                    });
                    
                    if (!response.ok) {
                      throw new Error("Failed to update preference");
                    }
                    
                    const data = await response.json();
                    setUser(data.user);
                    localStorage.setItem("userInfo", JSON.stringify(data.user));
                    toast.success(checked ? "Document saving enabled" : "Document saving disabled");
                  } catch (error) {
                    toast.error("Failed to update preference");
                  } finally {
                    setIsSavingPreference(false);
                  }
                }}
              />
            </div>
            {user?.preferences?.saveDocuments && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-700">
                  ✓ Your documents will be saved automatically when you download. View them in your{" "}
                  <Link to="/user/downloads" className="font-medium underline hover:no-underline">
                    Downloads page
                  </Link>.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Security Section */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Security
            </h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
              <div>
                <h4 className="font-medium text-slate-800 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-slate-500" />
                  Email Address
                </h4>
                <p className="text-sm text-slate-500">{user?.email}</p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowEmailDialog(true)}
              >
                Change Email
              </Button>
            </div>
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
              <div>
                <h4 className="font-medium text-slate-800">Password</h4>
                <p className="text-sm text-slate-500">Keep your account secure</p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowPasswordDialog(true)}
              >
                Change Password
              </Button>
            </div>
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
              <div>
                <h4 className="font-medium text-slate-800">Two-Factor Authentication</h4>
                <p className="text-sm text-slate-500">Add an extra layer of security</p>
              </div>
              <Button variant="outline" size="sm" disabled>
                Coming Soon
              </Button>
            </div>
          </div>
        </div>
      </main>

      {/* Change Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={(open) => {
        setShowPasswordDialog(open);
        if (!open) {
          setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
          setPasswordError("");
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-600" />
              Change Password
            </DialogTitle>
            <DialogDescription>
              Enter your current password and choose a new one.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {passwordError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                {passwordError}
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                placeholder="Enter your current password"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                placeholder="At least 8 characters"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                placeholder="Confirm your new password"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPasswordDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleChangePassword}
              disabled={isProcessing}
              className="bg-green-600 hover:bg-green-700"
            >
              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Change Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Email Dialog */}
      <Dialog open={showEmailDialog} onOpenChange={(open) => {
        setShowEmailDialog(open);
        if (!open) {
          setEmailData({ newEmail: "", password: "", showPassword: false });
          setEmailError("");
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-green-600" />
              Change Email Address
            </DialogTitle>
            <DialogDescription>
              Enter your new email address. You'll need to verify it before you can continue using your account.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {emailError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                {emailError}
              </div>
            )}
            
            <div className="p-3 bg-slate-50 rounded-lg">
              <p className="text-sm text-slate-600">
                <span className="font-medium">Current email:</span> {user?.email}
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="newEmail">New Email Address</Label>
              <Input
                id="newEmail"
                type="email"
                value={emailData.newEmail}
                onChange={(e) => setEmailData(prev => ({ ...prev, newEmail: e.target.value }))}
                placeholder="Enter your new email"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="emailPassword">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="emailPassword"
                  type={emailData.showPassword ? "text" : "password"}
                  value={emailData.password}
                  onChange={(e) => setEmailData(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Enter your password to confirm"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setEmailData(prev => ({ ...prev, showPassword: !prev.showPassword }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {emailData.showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-700">
                <AlertTriangle className="w-4 h-4 inline mr-1" />
                After changing your email, you'll need to verify the new address before you can access protected features.
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEmailDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleChangeEmail}
              disabled={isProcessing}
              className="bg-green-600 hover:bg-green-700"
            >
              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Update Email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Subscription Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Cancel Subscription
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel your subscription? You'll lose access to:
            </DialogDescription>
          </DialogHeader>
          <ul className="space-y-2 my-4">
            <li className="flex items-center gap-2 text-slate-600">
              <Check className="w-4 h-4 text-red-500" />
              {user?.subscription?.downloads_total === -1 ? "Unlimited" : (user?.subscription?.downloads_total ?? currentTier?.downloads)} monthly downloads
            </li>
            <li className="flex items-center gap-2 text-slate-600">
              <Check className="w-4 h-4 text-red-500" />
              Priority support
            </li>
            <li className="flex items-center gap-2 text-slate-600">
              <Check className="w-4 h-4 text-red-500" />
              All premium templates
            </li>
          </ul>
          <p className="text-sm text-slate-500">
            Your subscription will remain active until the end of your current billing period.
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
              Keep Subscription
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleCancelSubscription}
              disabled={isProcessing}
            >
              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Yes, Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Plan Dialog */}
      <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Subscription Plan</DialogTitle>
            <DialogDescription>
              Select a new plan. You'll be charged the prorated difference immediately.
            </DialogDescription>
          </DialogHeader>
          <div className="my-4">
            <Select value={selectedNewTier} onValueChange={setSelectedNewTier}>
              <SelectTrigger>
                <SelectValue placeholder="Select a plan" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(SUBSCRIPTION_TIERS).map(([key, tier]) => (
                  <SelectItem 
                    key={key} 
                    value={key}
                    disabled={key === user?.subscription?.tier}
                  >
                    <div className="flex items-center gap-2">
                      <tier.icon className="w-4 h-4" />
                      {tier.name} - ${tier.price}/mo ({tier.downloads === -1 ? "Unlimited" : tier.downloads} downloads)
                      {key === user?.subscription?.tier && " (Current)"}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {selectedNewTier && selectedNewTier !== user?.subscription?.tier && (
            <div className={`p-3 rounded-lg ${
              SUBSCRIPTION_TIERS[selectedNewTier].price > (currentTier?.price || 0) 
                ? "bg-blue-50 text-blue-700" 
                : "bg-orange-50 text-orange-700"
            }`}>
              <div className="flex items-center gap-2">
                {SUBSCRIPTION_TIERS[selectedNewTier].price > (currentTier?.price || 0) ? (
                  <>
                    <ArrowUp className="w-4 h-4" />
                    Upgrading to {SUBSCRIPTION_TIERS[selectedNewTier].name}
                  </>
                ) : (
                  <>
                    <ArrowDown className="w-4 h-4" />
                    Downgrading to {SUBSCRIPTION_TIERS[selectedNewTier].name}
                  </>
                )}
              </div>
              <p className="text-xs mt-1">Changes take effect immediately with prorated billing.</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUpgradeDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleChangePlan}
              disabled={isProcessing || !selectedNewTier || selectedNewTier === user?.subscription?.tier}
              className="bg-green-600 hover:bg-green-700"
            >
              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Confirm Change
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}

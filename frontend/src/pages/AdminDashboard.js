import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  DollarSign,
  TrendingUp,
  FileText,
  LogOut,
  RefreshCw,
  Tag,
  Calendar,
  Filter,
  Download,
  CreditCard,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Ban,
  UserX,
  MoreVertical,
  CalendarDays,
  Lock,
  Eye,
  EyeOff,
  FileDown,
  Search
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";

// Document type labels
const DOCUMENT_TYPES = {
  "paystub": "Pay Stub",
  "resume": "AI Resume",
  "w2": "W-2 Form",
  "w9": "W-9 Form",
  "1099-nec": "1099-NEC",
  "1099-misc": "1099-MISC",
  "bank-statement": "Bank Statement",
  "offer-letter": "Offer Letter",
  "vehicle-bill-of-sale": "Vehicle Bill of Sale",
  "schedule-c": "Schedule C",
  "utility-bill": "Utility Bill",
  "canadian-paystub": "Canadian Pay Stub"
};

// Subscription tiers
const SUBSCRIPTION_TIERS = {
  "basic": { name: "Basic", price: 19.99, downloads: 5 },
  "pro": { name: "Pro", price: 29.99, downloads: 10 },
  "unlimited": { name: "Unlimited", price: 49.99, downloads: -1 }
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [isLoading, setIsLoading] = useState(true);
  const [adminInfo, setAdminInfo] = useState(null);
  
  // Dashboard data
  const [dashboardStats, setDashboardStats] = useState(null);
  const [purchases, setPurchases] = useState([]);
  const [purchasesTotal, setPurchasesTotal] = useState(0);
  const [users, setUsers] = useState([]);
  const [usersTotal, setUsersTotal] = useState(0);
  
  // Filters
  const [documentTypeFilter, setDocumentTypeFilter] = useState("all");
  const [purchasesPage, setPurchasesPage] = useState(0);
  const [usersPage, setUsersPage] = useState(0);
  const [revenuePeriod, setRevenuePeriod] = useState("month");
  const [periodRevenue, setPeriodRevenue] = useState(0);
  const [purchasesPeriod, setPurchasesPeriod] = useState("month");
  const [periodPurchases, setPeriodPurchases] = useState(0);
  const pageSize = 20;
  
  // Subscription change modal state
  const [subscriptionModalOpen, setSubscriptionModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedTier, setSelectedTier] = useState("");
  
  // Password change modal state
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Check auth and get admin info
  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    const info = localStorage.getItem("adminInfo");
    
    if (!token) {
      navigate("/admin/login");
      return;
    }
    
    if (info) {
      setAdminInfo(JSON.parse(info));
    }
    
    verifySession(token);
  }, [navigate]);

  const verifySession = async (token) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/admin/verify`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (!response.ok) {
        throw new Error("Session expired");
      }
      
      loadDashboardData();
    } catch (error) {
      localStorage.removeItem("adminToken");
      localStorage.removeItem("adminInfo");
      navigate("/admin/login");
    }
  };

  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    const token = localStorage.getItem("adminToken");
    
    try {
      // Load dashboard stats
      const statsResponse = await fetch(`${BACKEND_URL}/api/admin/dashboard`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setDashboardStats(statsData);
      }
      
      // Load purchases
      await loadPurchases();
      
      // Load users
      await loadUsers();
      
    } catch (error) {
      console.error("Error loading dashboard:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadPurchases = async () => {
    const token = localStorage.getItem("adminToken");
    const typeParam = documentTypeFilter !== "all" ? `&documentType=${documentTypeFilter}` : "";
    
    try {
      const response = await fetch(
        `${BACKEND_URL}/api/admin/purchases?skip=${purchasesPage * pageSize}&limit=${pageSize}${typeParam}`,
        { headers: { "Authorization": `Bearer ${token}` } }
      );
      
      if (response.ok) {
        const data = await response.json();
        setPurchases(data.purchases);
        setPurchasesTotal(data.total);
      }
    } catch (error) {
      console.error("Error loading purchases:", error);
    }
  };

  const loadUsers = async () => {
    const token = localStorage.getItem("adminToken");
    
    try {
      const response = await fetch(
        `${BACKEND_URL}/api/admin/users?skip=${usersPage * pageSize}&limit=${pageSize}`,
        { headers: { "Authorization": `Bearer ${token}` } }
      );
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
        setUsersTotal(data.total);
      }
    } catch (error) {
      console.error("Error loading users:", error);
    }
  };

  const deletePurchase = async (purchaseId) => {
    if (!window.confirm("Are you sure you want to delete this purchase record?")) return;
    
    const token = localStorage.getItem("adminToken");
    try {
      const response = await fetch(`${BACKEND_URL}/api/admin/purchases/${purchaseId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (response.ok) {
        toast.success("Purchase deleted");
        loadPurchases();
        loadDashboardData();
      } else {
        toast.error("Failed to delete purchase");
      }
    } catch (error) {
      toast.error("Error deleting purchase");
    }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user? This will also remove their subscription and session data.")) return;
    
    const token = localStorage.getItem("adminToken");
    try {
      const response = await fetch(`${BACKEND_URL}/api/admin/users/${userId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (response.ok) {
        toast.success("User deleted");
        loadUsers();
        loadDashboardData();
      } else {
        toast.error("Failed to delete user");
      }
    } catch (error) {
      toast.error("Error deleting user");
    }
  };

  const toggleBanUser = async (userId, currentlyBanned) => {
    const action = currentlyBanned ? "unban" : "ban";
    if (!window.confirm(`Are you sure you want to ${action} this user?`)) return;
    
    const token = localStorage.getItem("adminToken");
    try {
      const response = await fetch(`${BACKEND_URL}/api/admin/users/${userId}/ban`, {
        method: "PUT",
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        toast.success(data.isBanned ? "User banned" : "User unbanned");
        loadUsers();
      } else {
        toast.error(`Failed to ${action} user`);
      }
    } catch (error) {
      toast.error(`Error ${action}ning user`);
    }
  };

  const openSubscriptionModal = (user) => {
    setSelectedUser(user);
    setSelectedTier(user.subscription?.tier || "");
    setSubscriptionModalOpen(true);
  };

  const updateUserSubscription = async () => {
    if (!selectedUser) return;
    
    const token = localStorage.getItem("adminToken");
    try {
      const tierToSend = selectedTier === "none" ? null : selectedTier;
      const response = await fetch(`${BACKEND_URL}/api/admin/users/${selectedUser.id}/subscription`, {
        method: "PUT",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ tier: tierToSend })
      });
      
      if (response.ok) {
        toast.success(tierToSend ? `User subscription updated to ${SUBSCRIPTION_TIERS[tierToSend]?.name}` : "User subscription removed");
        setSubscriptionModalOpen(false);
        setSelectedUser(null);
        loadUsers();
        loadDashboardData();
      } else {
        toast.error("Failed to update user subscription");
      }
    } catch (error) {
      toast.error("Error updating subscription");
    }
  };

  useEffect(() => {
    if (!isLoading) {
      loadPurchases();
    }
  }, [purchasesPage, documentTypeFilter]);

  useEffect(() => {
    if (!isLoading) {
      loadUsers();
    }
  }, [usersPage]);

  // Calculate period-based revenue
  useEffect(() => {
    if (dashboardStats?.recentPurchases) {
      calculatePeriodRevenue();
    }
  }, [revenuePeriod, dashboardStats]);

  const calculatePeriodRevenue = async () => {
    const token = localStorage.getItem("adminToken");
    const now = new Date();
    let startDate;
    
    switch (revenuePeriod) {
      case "week":
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case "month":
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case "quarter":
        startDate = new Date(now.setMonth(now.getMonth() - 3));
        break;
      case "year":
        startDate = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
      default:
        startDate = new Date(now.setMonth(now.getMonth() - 1));
    }

    try {
      const response = await fetch(
        `${BACKEND_URL}/api/admin/revenue?startDate=${startDate.toISOString()}`,
        { headers: { "Authorization": `Bearer ${token}` } }
      );
      
      if (response.ok) {
        const data = await response.json();
        setPeriodRevenue(data.revenue || 0);
      }
    } catch (error) {
      console.error("Error calculating period revenue:", error);
      // Fallback: calculate from recent purchases if API fails
      if (dashboardStats?.recentPurchases) {
        const filtered = dashboardStats.recentPurchases.filter(p => {
          const purchaseDate = new Date(p.createdAt);
          return purchaseDate >= startDate;
        });
        const total = filtered.reduce((sum, p) => sum + (p.amount || 0), 0);
        setPeriodRevenue(total);
      }
    }
  };

  // Calculate period-based purchases count
  useEffect(() => {
    if (dashboardStats?.recentPurchases) {
      calculatePeriodPurchases();
    }
  }, [purchasesPeriod, dashboardStats]);

  const calculatePeriodPurchases = async () => {
    const token = localStorage.getItem("adminToken");
    const now = new Date();
    let startDate;
    
    switch (purchasesPeriod) {
      case "week":
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case "month":
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case "quarter":
        startDate = new Date(now.setMonth(now.getMonth() - 3));
        break;
      case "year":
        startDate = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
      default:
        startDate = new Date(now.setMonth(now.getMonth() - 1));
    }

    try {
      const response = await fetch(
        `${BACKEND_URL}/api/admin/revenue?startDate=${startDate.toISOString()}`,
        { headers: { "Authorization": `Bearer ${token}` } }
      );
      
      if (response.ok) {
        const data = await response.json();
        setPeriodPurchases(data.purchaseCount || 0);
      }
    } catch (error) {
      console.error("Error calculating period purchases:", error);
      // Fallback: calculate from recent purchases if API fails
      if (dashboardStats?.recentPurchases) {
        const filtered = dashboardStats.recentPurchases.filter(p => {
          const purchaseDate = new Date(p.createdAt);
          return purchaseDate >= startDate;
        });
        setPeriodPurchases(filtered.length);
      }
    }
  };

  const changePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Please fill in all fields");
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast.error("New passwords don't match");
      return;
    }
    
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    
    setIsChangingPassword(true);
    const token = localStorage.getItem("adminToken");
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/admin/change-password`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          currentPassword,
          newPassword
        })
      });
      
      if (response.ok) {
        toast.success("Password changed successfully!");
        setPasswordModalOpen(false);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        const data = await response.json();
        toast.error(data.detail || "Failed to change password");
      }
    } catch (error) {
      toast.error("Error changing password");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleLogout = async () => {
    const token = localStorage.getItem("adminToken");
    
    try {
      await fetch(`${BACKEND_URL}/api/admin/logout`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
    } catch (error) {
      console.error("Logout error:", error);
    }
    
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminInfo");
    navigate("/admin/login");
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-green-600" />
          <span className="text-lg text-slate-600">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
              <LayoutDashboard className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">MintSlip Admin</h1>
              <p className="text-sm text-slate-500">{adminInfo?.email}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={loadDashboardData}
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPasswordModalOpen(true)}
              className="gap-2"
            >
              <Lock className="w-4 h-4" />
              <span className="hidden sm:inline">Change Password</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Navigation Tabs */}
        <div className="flex gap-2 mb-6 bg-white rounded-xl p-2 shadow-sm">
          {[
            { id: "overview", label: "Overview", icon: LayoutDashboard },
            { id: "purchases", label: "Purchases", icon: ShoppingCart },
            { id: "users", label: "Users", icon: Users },
            { id: "discounts", label: "Discount Codes", icon: Tag }
          ].map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? "default" : "ghost"}
              onClick={() => setActiveTab(tab.id)}
              className={`gap-2 ${activeTab === tab.id ? "bg-green-600 hover:bg-green-700" : ""}`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </Button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && dashboardStats && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="All Time Revenue"
                value={formatCurrency(dashboardStats.stats.totalRevenue)}
                icon={DollarSign}
                color="green"
              />
              
              {/* Period-based Purchases Card with Dropdown */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-100 text-blue-600">
                      <ShoppingCart className="w-6 h-6" />
                    </div>
                  </div>
                  <Select value={purchasesPeriod} onValueChange={setPurchasesPeriod}>
                    <SelectTrigger className="w-[110px] h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="week">This Week</SelectItem>
                      <SelectItem value="month">This Month</SelectItem>
                      <SelectItem value="quarter">This Quarter</SelectItem>
                      <SelectItem value="year">This Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="mt-2">
                  <p className="text-sm text-slate-500">
                    {purchasesPeriod === "week" ? "Weekly" : 
                     purchasesPeriod === "month" ? "Monthly" : 
                     purchasesPeriod === "quarter" ? "Quarterly" : "Yearly"} Purchases
                  </p>
                  <p className="text-2xl font-bold text-slate-800 mt-1">{periodPurchases}</p>
                </div>
              </div>
              
              {/* Period-based Revenue Card with Dropdown */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-purple-100 text-purple-600">
                      <CalendarDays className="w-6 h-6" />
                    </div>
                  </div>
                  <Select value={revenuePeriod} onValueChange={setRevenuePeriod}>
                    <SelectTrigger className="w-[110px] h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="week">This Week</SelectItem>
                      <SelectItem value="month">This Month</SelectItem>
                      <SelectItem value="quarter">This Quarter</SelectItem>
                      <SelectItem value="year">This Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="mt-2">
                  <p className="text-sm text-slate-500">
                    {revenuePeriod === "week" ? "Weekly" : 
                     revenuePeriod === "month" ? "Monthly" : 
                     revenuePeriod === "quarter" ? "Quarterly" : "Yearly"} Revenue
                  </p>
                  <p className="text-2xl font-bold text-slate-800 mt-1">{formatCurrency(periodRevenue)}</p>
                </div>
              </div>

              <StatCard
                title="Today's Revenue"
                value={formatCurrency(dashboardStats.stats.todayRevenue)}
                icon={TrendingUp}
                color="orange"
              />
            </div>

            {/* Purchases by Type */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">Revenue by Document Type</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {dashboardStats.purchasesByType.map((item) => (
                  <div key={item._id} className="bg-slate-50 rounded-lg p-4">
                    <p className="text-sm text-slate-600">{DOCUMENT_TYPES[item._id] || item._id}</p>
                    <p className="text-xl font-bold text-slate-800">{formatCurrency(item.revenue)}</p>
                    <p className="text-xs text-slate-500">{item.count} purchases</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Purchases */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">Recent Purchases</h2>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Document Type</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Discount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dashboardStats.recentPurchases.map((purchase) => (
                      <TableRow key={purchase.id}>
                        <TableCell className="text-sm">{formatDate(purchase.createdAt)}</TableCell>
                        <TableCell>
                          <span className="px-2 py-1 bg-slate-100 rounded-md text-sm">
                            {DOCUMENT_TYPES[purchase.documentType] || purchase.documentType}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-sm">{purchase.paypalEmail}</span>
                            {purchase.userId ? (
                              <span className="text-xs px-1.5 py-0.5 bg-green-100 text-green-700 rounded w-fit">Registered</span>
                            ) : (
                              <span className="text-xs px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded w-fit">Guest</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{formatCurrency(purchase.amount)}</TableCell>
                        <TableCell>
                          {purchase.discountCode ? (
                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded-md text-sm">
                              {purchase.discountCode} (-{formatCurrency(purchase.discountAmount)})
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        )}

        {/* Purchases Tab */}
        {activeTab === "purchases" && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-slate-800">All Purchases</h2>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-slate-500" />
                  <Select value={documentTypeFilter} onValueChange={setDocumentTypeFilter}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Filter by type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {Object.entries(DOCUMENT_TYPES).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Document Type</TableHead>
                    <TableHead>Template</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Discount</TableHead>
                    <TableHead className="w-[80px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchases.map((purchase) => (
                    <TableRow key={purchase.id}>
                      <TableCell className="text-sm">{formatDate(purchase.createdAt)}</TableCell>
                      <TableCell>
                        <span className="px-2 py-1 bg-slate-100 rounded-md text-sm">
                          {DOCUMENT_TYPES[purchase.documentType] || purchase.documentType}
                        </span>
                      </TableCell>
                      <TableCell>
                        {purchase.template ? (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-mono">
                            {purchase.template}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm">{purchase.paypalEmail}</span>
                          {purchase.userId ? (
                            <span className="text-xs px-1.5 py-0.5 bg-green-100 text-green-700 rounded w-fit">Registered</span>
                          ) : (
                            <span className="text-xs px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded w-fit">Guest</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{formatCurrency(purchase.amount)}</TableCell>
                      <TableCell>
                        {purchase.discountCode ? (
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded-md text-sm">
                            {purchase.discountCode}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deletePurchase(purchase.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <p className="text-sm text-slate-600">
                Showing {purchasesPage * pageSize + 1} - {Math.min((purchasesPage + 1) * pageSize, purchasesTotal)} of {purchasesTotal}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={purchasesPage === 0}
                  onClick={() => setPurchasesPage(p => p - 1)}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={(purchasesPage + 1) * pageSize >= purchasesTotal}
                  onClick={() => setPurchasesPage(p => p + 1)}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === "users" && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-slate-800">Registered Users</h2>
              <p className="text-sm text-slate-500">{usersTotal} total users</p>
            </div>

            {users.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">No registered users yet</p>
                <p className="text-sm text-slate-400">Users will appear here when they sign up for subscriptions</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Subscription</TableHead>
                        <TableHead>Downloads</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead className="w-[80px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => {
                        const tier = user.subscription ? SUBSCRIPTION_TIERS[user.subscription.tier] : null;
                        const downloadsLimit = tier ? (tier.downloads === -1 ? "∞" : tier.downloads) : "-";
                        return (
                          <TableRow key={user.id} className={user.isBanned ? "bg-red-50" : ""}>
                            <TableCell className="font-medium">{user.name}</TableCell>
                            <TableCell className="text-sm">{user.email}</TableCell>
                            <TableCell>
                              {user.isBanned ? (
                                <span className="px-2 py-1 bg-red-100 text-red-700 rounded-md text-sm">Banned</span>
                              ) : (
                                <span className="px-2 py-1 bg-green-100 text-green-700 rounded-md text-sm">Active</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {user.subscription ? (
                                <span className={`px-2 py-1 rounded-md text-sm ${
                                  user.subscription.tier === "unlimited" ? "bg-purple-100 text-purple-700" :
                                  user.subscription.tier === "pro" ? "bg-blue-100 text-blue-700" :
                                  "bg-green-100 text-green-700"
                                }`}>
                                  {user.subscription.tier.charAt(0).toUpperCase() + user.subscription.tier.slice(1)}
                                </span>
                              ) : (
                                <span className="text-slate-400">None</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <span className="font-medium">{user.downloadsUsed || 0}</span>
                              <span className="text-slate-400"> / {downloadsLimit}</span>
                            </TableCell>
                            <TableCell className="text-sm">{formatDate(user.createdAt)}</TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem 
                                    onClick={() => openSubscriptionModal(user)}
                                    className="text-blue-600"
                                  >
                                    <CreditCard className="w-4 h-4 mr-2" />
                                    Change Subscription
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    onClick={() => toggleBanUser(user.id, user.isBanned)}
                                    className={user.isBanned ? "text-green-600" : "text-orange-600"}
                                  >
                                    <Ban className="w-4 h-4 mr-2" />
                                    {user.isBanned ? "Unban User" : "Ban User"}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => deleteUser(user.id)}
                                    className="text-red-600"
                                  >
                                    <UserX className="w-4 h-4 mr-2" />
                                    Delete User
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <p className="text-sm text-slate-600">
                    Showing {usersPage * pageSize + 1} - {Math.min((usersPage + 1) * pageSize, usersTotal)} of {usersTotal}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={usersPage === 0}
                      onClick={() => setUsersPage(p => p - 1)}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={(usersPage + 1) * pageSize >= usersTotal}
                      onClick={() => setUsersPage(p => p + 1)}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Discounts Tab - Link to existing page */}
        {activeTab === "discounts" && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-slate-800">Discount Codes</h2>
              <Button
                onClick={() => navigate("/admin/discounts")}
                className="bg-green-600 hover:bg-green-700 gap-2"
              >
                <Tag className="w-4 h-4" />
                Manage Discount Codes
              </Button>
            </div>
            <p className="text-slate-600">
              Click the button above to manage discount codes using the existing discount management interface.
            </p>
          </div>
        )}
      </div>

      {/* Subscription Change Modal */}
      <Dialog open={subscriptionModalOpen} onOpenChange={setSubscriptionModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change User Subscription</DialogTitle>
            <DialogDescription>
              Update subscription plan for {selectedUser?.name} ({selectedUser?.email})
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div className="text-sm text-slate-600 mb-4">
              Current plan: <span className="font-medium">{selectedUser?.subscription?.tier ? SUBSCRIPTION_TIERS[selectedUser.subscription.tier]?.name : "None"}</span>
            </div>
            
            <Select value={selectedTier} onValueChange={setSelectedTier}>
              <SelectTrigger>
                <SelectValue placeholder="Select a plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Subscription</SelectItem>
                {Object.entries(SUBSCRIPTION_TIERS).map(([key, tier]) => (
                  <SelectItem key={key} value={key}>
                    {tier.name} - ${tier.price}/mo ({tier.downloads === -1 ? "Unlimited" : tier.downloads} downloads)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {selectedTier && selectedTier !== "none" && (
              <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
                <p><strong>{SUBSCRIPTION_TIERS[selectedTier]?.name}</strong></p>
                <p>${SUBSCRIPTION_TIERS[selectedTier]?.price}/month</p>
                <p>{SUBSCRIPTION_TIERS[selectedTier]?.downloads === -1 ? "Unlimited" : SUBSCRIPTION_TIERS[selectedTier]?.downloads} downloads per month</p>
              </div>
            )}
            
            {selectedTier === "none" && (
              <div className="p-3 bg-orange-50 rounded-lg text-sm text-orange-700">
                <p><strong>Remove Subscription</strong></p>
                <p>User will no longer have access to subscription features</p>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setSubscriptionModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={updateUserSubscription} className="bg-green-600 hover:bg-green-700">
              Update Subscription
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Password Modal */}
      <Dialog open={passwordModalOpen} onOpenChange={setPasswordModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Admin Password</DialogTitle>
            <DialogDescription>
              Enter your current password and choose a new secure password.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Current Password</label>
              <Input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">New Password</label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min 8 characters)"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Confirm New Password</label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />
            </div>
            
            {newPassword && confirmPassword && newPassword !== confirmPassword && (
              <p className="text-sm text-red-500">Passwords don't match</p>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setPasswordModalOpen(false);
              setCurrentPassword("");
              setNewPassword("");
              setConfirmPassword("");
            }}>
              Cancel
            </Button>
            <Button 
              onClick={changePassword} 
              disabled={isChangingPassword || !currentPassword || !newPassword || newPassword !== confirmPassword}
              className="bg-green-600 hover:bg-green-700"
            >
              {isChangingPassword ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Changing...
                </>
              ) : (
                "Change Password"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Stat Card Component
function StatCard({ title, value, icon: Icon, color }) {
  const colors = {
    green: "bg-green-100 text-green-600",
    blue: "bg-blue-100 text-blue-600",
    purple: "bg-purple-100 text-purple-600",
    orange: "bg-orange-100 text-orange-600"
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">{title}</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{value}</p>
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colors[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}

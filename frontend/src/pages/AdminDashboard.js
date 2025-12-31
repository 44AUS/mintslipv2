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
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
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
  const [dateRangeFilter, setDateRangeFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [revenueChartData, setRevenueChartData] = useState([]);
  const [chartPeriod, setChartPeriod] = useState("30days");
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
  
  // Add purchase modal state
  const [addPurchaseModalOpen, setAddPurchaseModalOpen] = useState(false);
  const [newPurchase, setNewPurchase] = useState({
    documentType: "paystub",
    amount: "",
    paypalEmail: "",
    purchaseDate: new Date().toISOString().split('T')[0],
    template: "",
    discountCode: "",
    discountAmount: "",
    notes: ""
  });
  const [isAddingPurchase, setIsAddingPurchase] = useState(false);

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
        
        // Process data for charts
        processChartData(statsData.recentPurchases);
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

  // Process purchases data for charts
  const processChartData = (purchases, period = chartPeriod) => {
    if (!purchases || purchases.length === 0) {
      setRevenueChartData([]);
      return;
    }
    
    const now = new Date();
    let startDate;
    let groupBy;
    
    switch (period) {
      case "7days":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        groupBy = "day";
        break;
      case "30days":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        groupBy = "day";
        break;
      case "90days":
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        groupBy = "week";
        break;
      case "year":
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        groupBy = "month";
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        groupBy = "day";
    }
    
    // Filter purchases within the period
    const filteredPurchases = purchases.filter(p => new Date(p.createdAt) >= startDate);
    
    // Group by time period
    const grouped = {};
    
    filteredPurchases.forEach(purchase => {
      const date = new Date(purchase.createdAt);
      let key;
      
      if (groupBy === "day") {
        key = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      } else if (groupBy === "week") {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      } else {
        key = date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
      }
      
      if (!grouped[key]) {
        grouped[key] = { name: key, revenue: 0, purchases: 0 };
      }
      grouped[key].revenue += purchase.amount || 0;
      grouped[key].purchases += 1;
    });
    
    // Convert to array and sort by date
    const chartData = Object.values(grouped).sort((a, b) => {
      const dateA = new Date(a.name + ", 2024");
      const dateB = new Date(b.name + ", 2024");
      return dateA - dateB;
    });
    
    setRevenueChartData(chartData);
  };
  
  // Update chart when period changes
  useEffect(() => {
    if (dashboardStats?.recentPurchases) {
      processChartData(dashboardStats.recentPurchases, chartPeriod);
    }
  }, [chartPeriod, dashboardStats]);

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

  // Export purchases to CSV
  const exportPurchasesToCSV = async () => {
    const token = localStorage.getItem("adminToken");
    
    try {
      // Fetch all purchases for export (no pagination)
      const typeParam = documentTypeFilter !== "all" ? `&documentType=${documentTypeFilter}` : "";
      const response = await fetch(
        `${BACKEND_URL}/api/admin/purchases?skip=0&limit=10000${typeParam}`,
        { headers: { "Authorization": `Bearer ${token}` } }
      );
      
      if (!response.ok) {
        toast.error("Failed to fetch data for export");
        return;
      }
      
      const data = await response.json();
      let purchasesToExport = data.purchases;
      
      // Apply date filter
      if (dateRangeFilter !== "all") {
        const now = new Date();
        let startDate;
        
        switch (dateRangeFilter) {
          case "today":
            startDate = new Date(now.setHours(0, 0, 0, 0));
            break;
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
            startDate = null;
        }
        
        if (startDate) {
          purchasesToExport = purchasesToExport.filter(p => new Date(p.createdAt) >= startDate);
        }
      }
      
      // Apply search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        purchasesToExport = purchasesToExport.filter(p => 
          p.paypalEmail?.toLowerCase().includes(query) ||
          p.documentType?.toLowerCase().includes(query) ||
          p.template?.toLowerCase().includes(query)
        );
      }
      
      // Generate CSV content
      const headers = ["Date", "Document Type", "Template", "Customer Email", "Customer Type", "Amount", "Discount Code", "Discount Amount"];
      const csvRows = [headers.join(",")];
      
      purchasesToExport.forEach(purchase => {
        const row = [
          new Date(purchase.createdAt).toLocaleDateString(),
          DOCUMENT_TYPES[purchase.documentType] || purchase.documentType,
          purchase.template || "-",
          purchase.paypalEmail,
          purchase.userId ? "Registered" : "Guest",
          purchase.amount?.toFixed(2) || "0.00",
          purchase.discountCode || "-",
          purchase.discountAmount?.toFixed(2) || "0.00"
        ];
        csvRows.push(row.map(field => `"${field}"`).join(","));
      });
      
      const csvContent = csvRows.join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `mintslip_purchases_${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success(`Exported ${purchasesToExport.length} purchases to CSV`);
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Error exporting data");
    }
  };

  // Filter purchases by date and search
  const getFilteredPurchases = () => {
    let filtered = [...purchases];
    
    // Apply date filter
    if (dateRangeFilter !== "all") {
      const now = new Date();
      let startDate;
      
      switch (dateRangeFilter) {
        case "today":
          startDate = new Date();
          startDate.setHours(0, 0, 0, 0);
          break;
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
          startDate = null;
      }
      
      if (startDate) {
        filtered = filtered.filter(p => new Date(p.createdAt) >= startDate);
      }
    }
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.paypalEmail?.toLowerCase().includes(query) ||
        p.documentType?.toLowerCase().includes(query) ||
        p.template?.toLowerCase().includes(query)
      );
    }
    
    return filtered;
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

  const addManualPurchase = async () => {
    if (!newPurchase.documentType || !newPurchase.amount || !newPurchase.paypalEmail) {
      toast.error("Please fill in required fields (Document Type, Amount, Email)");
      return;
    }
    
    setIsAddingPurchase(true);
    const token = localStorage.getItem("adminToken");
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/admin/purchases`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          documentType: newPurchase.documentType,
          amount: parseFloat(newPurchase.amount),
          paypalEmail: newPurchase.paypalEmail,
          purchaseDate: newPurchase.purchaseDate ? new Date(newPurchase.purchaseDate).toISOString() : null,
          template: newPurchase.template || null,
          discountCode: newPurchase.discountCode || null,
          discountAmount: newPurchase.discountAmount ? parseFloat(newPurchase.discountAmount) : 0,
          notes: newPurchase.notes || null
        })
      });
      
      if (response.ok) {
        toast.success("Purchase added successfully!");
        setAddPurchaseModalOpen(false);
        setNewPurchase({
          documentType: "paystub",
          amount: "",
          paypalEmail: "",
          purchaseDate: new Date().toISOString().split('T')[0],
          template: "",
          discountCode: "",
          discountAmount: "",
          notes: ""
        });
        loadPurchases();
        loadDashboardData();
      } else {
        const data = await response.json();
        toast.error(data.detail || "Failed to add purchase");
      }
    } catch (error) {
      toast.error("Error adding purchase");
    } finally {
      setIsAddingPurchase(false);
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

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue Over Time Chart */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-slate-800">Revenue Over Time</h2>
                  <Select value={chartPeriod} onValueChange={setChartPeriod}>
                    <SelectTrigger className="w-[130px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7days">Last 7 Days</SelectItem>
                      <SelectItem value="30days">Last 30 Days</SelectItem>
                      <SelectItem value="90days">Last 90 Days</SelectItem>
                      <SelectItem value="year">Last Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="h-[300px]">
                  {revenueChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={revenueChartData}>
                        <defs>
                          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#16a34a" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#16a34a" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis 
                          dataKey="name" 
                          tick={{ fontSize: 12, fill: '#64748b' }}
                          tickLine={false}
                        />
                        <YAxis 
                          tick={{ fontSize: 12, fill: '#64748b' }}
                          tickLine={false}
                          tickFormatter={(value) => `$${value}`}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#fff', 
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                          }}
                          formatter={(value, name) => [
                            name === 'revenue' ? `$${value.toFixed(2)}` : value,
                            name === 'revenue' ? 'Revenue' : 'Purchases'
                          ]}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="revenue" 
                          stroke="#16a34a" 
                          strokeWidth={2}
                          fillOpacity={1} 
                          fill="url(#colorRevenue)" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400">
                      No data available for selected period
                    </div>
                  )}
                </div>
              </div>

              {/* Purchases Over Time Chart */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-slate-800">Purchases Over Time</h2>
                </div>
                <div className="h-[300px]">
                  {revenueChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={revenueChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis 
                          dataKey="name" 
                          tick={{ fontSize: 12, fill: '#64748b' }}
                          tickLine={false}
                        />
                        <YAxis 
                          tick={{ fontSize: 12, fill: '#64748b' }}
                          tickLine={false}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#fff', 
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                          }}
                          formatter={(value) => [value, 'Purchases']}
                        />
                        <Bar 
                          dataKey="purchases" 
                          fill="#3b82f6" 
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400">
                      No data available for selected period
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Document Type Distribution Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-semibold text-slate-800 mb-4">Revenue by Document Type</h2>
                <div className="h-[300px]">
                  {dashboardStats.purchasesByType && dashboardStats.purchasesByType.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={dashboardStats.purchasesByType.map((item, index) => ({
                            name: DOCUMENT_TYPES[item._id] || item._id,
                            value: item.revenue,
                            fill: [
                              '#16a34a', '#3b82f6', '#f59e0b', '#ef4444', 
                              '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16',
                              '#f97316', '#6366f1', '#14b8a6', '#a855f7'
                            ][index % 12]
                          }))}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {dashboardStats.purchasesByType.map((_, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={[
                                '#16a34a', '#3b82f6', '#f59e0b', '#ef4444', 
                                '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16',
                                '#f97316', '#6366f1', '#14b8a6', '#a855f7'
                              ][index % 12]} 
                            />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#fff', 
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                          }}
                          formatter={(value) => [`$${value.toFixed(2)}`, 'Revenue']}
                        />
                        <Legend 
                          layout="vertical" 
                          align="right" 
                          verticalAlign="middle"
                          wrapperStyle={{ fontSize: '12px' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400">
                      No data available
                    </div>
                  )}
                </div>
              </div>

              {/* Purchases Count by Type */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-semibold text-slate-800 mb-4">Purchases by Document Type</h2>
                <div className="h-[300px]">
                  {dashboardStats.purchasesByType && dashboardStats.purchasesByType.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={dashboardStats.purchasesByType.map(item => ({
                          name: DOCUMENT_TYPES[item._id]?.split(' ')[0] || item._id,
                          count: item.count
                        }))}
                        layout="vertical"
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis type="number" tick={{ fontSize: 12, fill: '#64748b' }} />
                        <YAxis 
                          type="category" 
                          dataKey="name" 
                          tick={{ fontSize: 11, fill: '#64748b' }}
                          width={80}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#fff', 
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px'
                          }}
                          formatter={(value) => [value, 'Purchases']}
                        />
                        <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400">
                      No data available
                    </div>
                  )}
                </div>
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
            <div className="flex flex-col gap-4 mb-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-800">All Purchases</h2>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => setAddPurchaseModalOpen(true)}
                    className="gap-2 bg-green-600 hover:bg-green-700"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    Add Purchase
                  </Button>
                  <Button
                    onClick={exportPurchasesToCSV}
                    variant="outline"
                    className="gap-2"
                  >
                    <FileDown className="w-4 h-4" />
                    Export CSV
                  </Button>
                </div>
              </div>
              
              {/* Filters Row */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Search */}
                <div className="relative flex-1 min-w-[200px] max-w-[300px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Search by email, type..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                
                {/* Document Type Filter */}
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-slate-500" />
                  <Select value={documentTypeFilter} onValueChange={(v) => { setDocumentTypeFilter(v); setPurchasesPage(0); }}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Document Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {Object.entries(DOCUMENT_TYPES).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Date Range Filter */}
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-500" />
                  <Select value={dateRangeFilter} onValueChange={setDateRangeFilter}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Date Range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="week">This Week</SelectItem>
                      <SelectItem value="month">This Month</SelectItem>
                      <SelectItem value="quarter">This Quarter</SelectItem>
                      <SelectItem value="year">This Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Clear Filters */}
                {(documentTypeFilter !== "all" || dateRangeFilter !== "all" || searchQuery) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setDocumentTypeFilter("all");
                      setDateRangeFilter("all");
                      setSearchQuery("");
                      setPurchasesPage(0);
                    }}
                    className="text-slate-500 hover:text-slate-700"
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
              
              {/* Results Summary */}
              <div className="text-sm text-slate-500">
                Showing {getFilteredPurchases().length} of {purchases.length} purchases
                {(documentTypeFilter !== "all" || dateRangeFilter !== "all" || searchQuery) && " (filtered)"}
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
                  {getFilteredPurchases().map((purchase) => (
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

      {/* Add Purchase Modal */}
      <Dialog open={addPurchaseModalOpen} onOpenChange={setAddPurchaseModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Manual Purchase</DialogTitle>
            <DialogDescription>
              Add a historical purchase record. This is useful for tracking purchases made before the system was implemented.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto">
            {/* Document Type */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Document Type *</label>
              <Select 
                value={newPurchase.documentType} 
                onValueChange={(v) => setNewPurchase(prev => ({ ...prev, documentType: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(DOCUMENT_TYPES).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Amount */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Amount ($) *</label>
              <Input
                type="number"
                step="0.01"
                placeholder="9.99"
                value={newPurchase.amount}
                onChange={(e) => setNewPurchase(prev => ({ ...prev, amount: e.target.value }))}
              />
            </div>
            
            {/* PayPal Email */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Customer Email *</label>
              <Input
                type="email"
                placeholder="customer@example.com"
                value={newPurchase.paypalEmail}
                onChange={(e) => setNewPurchase(prev => ({ ...prev, paypalEmail: e.target.value }))}
              />
            </div>
            
            {/* Purchase Date */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Purchase Date</label>
              <Input
                type="date"
                value={newPurchase.purchaseDate}
                onChange={(e) => setNewPurchase(prev => ({ ...prev, purchaseDate: e.target.value }))}
              />
            </div>
            
            {/* Template (Optional) */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Template (Optional)</label>
              <Input
                placeholder="e.g., modern, classic, template-1"
                value={newPurchase.template}
                onChange={(e) => setNewPurchase(prev => ({ ...prev, template: e.target.value }))}
              />
            </div>
            
            {/* Discount Code (Optional) */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Discount Code</label>
                <Input
                  placeholder="CODE123"
                  value={newPurchase.discountCode}
                  onChange={(e) => setNewPurchase(prev => ({ ...prev, discountCode: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Discount Amount ($)</label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={newPurchase.discountAmount}
                  onChange={(e) => setNewPurchase(prev => ({ ...prev, discountAmount: e.target.value }))}
                />
              </div>
            </div>
            
            {/* Notes (Optional) */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Notes (Optional)</label>
              <Input
                placeholder="Any additional notes about this purchase"
                value={newPurchase.notes}
                onChange={(e) => setNewPurchase(prev => ({ ...prev, notes: e.target.value }))}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddPurchaseModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={addManualPurchase} 
              disabled={isAddingPurchase || !newPurchase.documentType || !newPurchase.amount || !newPurchase.paypalEmail}
              className="bg-green-600 hover:bg-green-700"
            >
              {isAddingPurchase ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Purchase"
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

import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
  Search,
  Pencil,
  UserPlus,
  UserCheck,
  Clock,
  AlertCircle,
  Shield,
  Globe
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

// Template name mappings
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

// Subscription tiers - aligned with frontend subscription plans
const SUBSCRIPTION_TIERS = {
  "starter": { name: "Starter", price: 19.99, downloads: 10 },
  "professional": { name: "Professional", price: 29.99, downloads: 30 },
  "business": { name: "Business", price: 49.99, downloads: -1 }
};

// Admin-assignable tiers (same as SUBSCRIPTION_TIERS)
const ADMIN_ASSIGNABLE_TIERS = SUBSCRIPTION_TIERS;

export default function AdminDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Determine active tab from URL path
  const getTabFromPath = (pathname) => {
    if (pathname.includes("/admin/users")) return "users";
    if (pathname.includes("/admin/purchases")) return "purchases";
    return "overview";
  };
  
  const [activeTab, setActiveTab] = useState(() => getTabFromPath(location.pathname));
  const [isLoading, setIsLoading] = useState(true);
  const [adminInfo, setAdminInfo] = useState(null);
  
  // Sync activeTab with URL changes
  useEffect(() => {
    const tabFromPath = getTabFromPath(location.pathname);
    if (tabFromPath !== activeTab) {
      setActiveTab(tabFromPath);
    }
  }, [location.pathname]);
  
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
  
  // Downloads edit modal state
  const [downloadsModalOpen, setDownloadsModalOpen] = useState(false);
  const [editDownloadsCount, setEditDownloadsCount] = useState("");
  
  // Edit user modal state
  const [editUserModalOpen, setEditUserModalOpen] = useState(false);
  const [editUserData, setEditUserData] = useState({ name: "", email: "" });
  const [isUpdatingUser, setIsUpdatingUser] = useState(false);
  
  // Password change modal state
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  // Add purchase modal state
  const [addPurchaseModalOpen, setAddPurchaseModalOpen] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState(null);
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
  
  // Users filter state
  const [usersSearchQuery, setUsersSearchQuery] = useState("");
  const [usersSearchDebounced, setUsersSearchDebounced] = useState("");
  const [usersSubscriptionFilter, setUsersSubscriptionFilter] = useState("all");
  const [usersDateFilter, setUsersDateFilter] = useState("all");
  const [mrrPeriod, setMrrPeriod] = useState("monthly"); // monthly or yearly
  const usersSearchTimeoutRef = useRef(null);

  // Debounce users search
  useEffect(() => {
    if (usersSearchTimeoutRef.current) {
      clearTimeout(usersSearchTimeoutRef.current);
    }
    usersSearchTimeoutRef.current = setTimeout(() => {
      setUsersSearchDebounced(usersSearchQuery);
      setUsersPage(0);
    }, 400);
    
    return () => {
      if (usersSearchTimeoutRef.current) {
        clearTimeout(usersSearchTimeoutRef.current);
      }
    };
  }, [usersSearchQuery]);

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
      // Build query params with filters
      const params = new URLSearchParams({
        skip: (usersPage * pageSize).toString(),
        limit: pageSize.toString()
      });
      
      // Add search query (use debounced value)
      if (usersSearchDebounced.trim()) {
        params.append("search", usersSearchDebounced.trim());
      }
      
      // Add subscription type filter
      if (usersSubscriptionFilter !== "all") {
        params.append("subscription_type", usersSubscriptionFilter);
      }
      
      // Add date filter
      if (usersDateFilter !== "all") {
        const now = new Date();
        let startDate;
        
        switch (usersDateFilter) {
          case "today":
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            break;
          case "week":
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case "month":
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
          case "quarter":
            startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
            break;
          case "year":
            startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
            break;
          default:
            startDate = null;
        }
        
        if (startDate) {
          params.append("date_from", startDate.toISOString());
        }
      }
      
      const response = await fetch(
        `${BACKEND_URL}/api/admin/users?${params.toString()}`,
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
          p.email?.toLowerCase().includes(query) ||
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
          getTemplateName(purchase.template),
          purchase.email || purchase.paypalEmail || "N/A",
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
        p.email?.toLowerCase().includes(query) ||
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

  const banUserIP = async (user) => {
    if (!user.ipAddress || user.ipAddress === "unknown") {
      toast.error("User IP address not available");
      return;
    }
    
    if (!window.confirm(`Are you sure you want to ban IP ${user.ipAddress}? This will block all access from this IP address.`)) return;
    
    const token = localStorage.getItem("adminToken");
    try {
      const response = await fetch(`${BACKEND_URL}/api/admin/ban-user-ip/${user.id}`, {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ reason: `Banned via user ${user.email}` })
      });
      
      if (response.ok) {
        const data = await response.json();
        toast.success(`IP ${data.ip} has been banned`);
      } else {
        const data = await response.json();
        toast.error(data.detail || "Failed to ban IP");
      }
    } catch (error) {
      toast.error("Error banning IP");
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

  const openDownloadsModal = (user) => {
    setSelectedUser(user);
    setEditDownloadsCount("");  // Start empty for adding bonus
    setDownloadsModalOpen(true);
  };

  const updateUserDownloads = async () => {
    if (!selectedUser) return;
    
    const token = localStorage.getItem("adminToken");
    try {
      const downloadsToAdd = parseInt(editDownloadsCount, 10);
      
      if (isNaN(downloadsToAdd) || downloadsToAdd < 1) {
        toast.error("Please enter a valid positive number");
        return;
      }
      
      const response = await fetch(`${BACKEND_URL}/api/admin/users/${selectedUser.id}/downloads`, {
        method: "PUT",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ downloads_to_add: downloadsToAdd })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast.success(data.message || `Added ${downloadsToAdd} bonus downloads`);
        setDownloadsModalOpen(false);
        setSelectedUser(null);
        setEditDownloadsCount("");
        loadUsers();
      } else {
        toast.error(data.detail || "Failed to add bonus downloads");
      }
    } catch (error) {
      toast.error("Error adding bonus downloads");
    }
  };

  // Edit user functions
  const openEditUserModal = (user) => {
    setSelectedUser(user);
    setEditUserData({ name: user.name || "", email: user.email || "" });
    setEditUserModalOpen(true);
  };

  const updateUser = async () => {
    if (!selectedUser) return;
    
    if (!editUserData.name.trim() || !editUserData.email.trim()) {
      toast.error("Name and email are required");
      return;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(editUserData.email)) {
      toast.error("Please enter a valid email address");
      return;
    }
    
    setIsUpdatingUser(true);
    const token = localStorage.getItem("adminToken");
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/admin/users/${selectedUser.id}`, {
        method: "PUT",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: editUserData.name.trim(),
          email: editUserData.email.trim()
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast.success("User updated successfully");
        setEditUserModalOpen(false);
        setSelectedUser(null);
        setEditUserData({ name: "", email: "" });
        loadUsers();
      } else {
        toast.error(data.detail || "Failed to update user");
      }
    } catch (error) {
      toast.error("Error updating user");
    } finally {
      setIsUpdatingUser(false);
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
  }, [usersPage, usersSearchDebounced, usersSubscriptionFilter, usersDateFilter]);

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
      // Fix timezone issue: parse date and set to noon local time to avoid day shift
      let purchaseDate = null;
      if (newPurchase.purchaseDate) {
        const [year, month, day] = newPurchase.purchaseDate.split('-');
        const date = new Date(year, month - 1, day, 12, 0, 0);
        purchaseDate = date.toISOString();
      }
      
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
          purchaseDate: purchaseDate,
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

  const openEditPurchase = (purchase) => {
    setEditingPurchase(purchase);
    setNewPurchase({
      documentType: purchase.documentType || "paystub",
      amount: purchase.amount?.toString() || "",
      paypalEmail: purchase.paypalEmail || "",
      purchaseDate: purchase.createdAt ? new Date(purchase.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      template: purchase.template || "",
      discountCode: purchase.discountCode || "",
      discountAmount: purchase.discountAmount?.toString() || "",
      notes: purchase.notes || ""
    });
    setAddPurchaseModalOpen(true);
  };

  const updatePurchase = async () => {
    if (!editingPurchase) return;
    if (!newPurchase.documentType || !newPurchase.amount || !newPurchase.paypalEmail) {
      toast.error("Please fill in required fields");
      return;
    }
    
    setIsAddingPurchase(true);
    const token = localStorage.getItem("adminToken");
    
    try {
      // Fix timezone issue
      let purchaseDate = null;
      if (newPurchase.purchaseDate) {
        const [year, month, day] = newPurchase.purchaseDate.split('-');
        const date = new Date(year, month - 1, day, 12, 0, 0);
        purchaseDate = date.toISOString();
      }
      
      const response = await fetch(`${BACKEND_URL}/api/admin/purchases/${editingPurchase.id}`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          documentType: newPurchase.documentType,
          amount: parseFloat(newPurchase.amount),
          paypalEmail: newPurchase.paypalEmail,
          purchaseDate: purchaseDate,
          template: newPurchase.template || null,
          discountCode: newPurchase.discountCode || null,
          discountAmount: newPurchase.discountAmount ? parseFloat(newPurchase.discountAmount) : 0,
          notes: newPurchase.notes || null
        })
      });
      
      if (response.ok) {
        toast.success("Purchase updated successfully!");
        closeModal();
        loadPurchases();
        loadDashboardData();
      } else {
        const data = await response.json();
        toast.error(data.detail || "Failed to update purchase");
      }
    } catch (error) {
      toast.error("Error updating purchase");
    } finally {
      setIsAddingPurchase(false);
    }
  };

  const closeModal = () => {
    setAddPurchaseModalOpen(false);
    setEditingPurchase(null);
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
        <div className="flex gap-2 mb-6 bg-white rounded-xl p-2 shadow-sm flex-wrap">
          {[
            { id: "overview", label: "Overview", icon: LayoutDashboard },
            { id: "purchases", label: "Purchases", icon: ShoppingCart },
            { id: "users", label: "Users", icon: Users },
            { id: "discounts", label: "Discounts", icon: Tag },
            { id: "banned-ips", label: "Banned IPs", icon: Shield },
            { id: "blog", label: "Blog", icon: FileText }
          ].map((tab) => {
            // Define the route for each tab
            const getTabRoute = (tabId) => {
              switch (tabId) {
                case "overview": return "/admin/overview";
                case "purchases": return "/admin/purchases";
                case "users": return "/admin/users";
                case "discounts": return "/admin/discounts";
                case "banned-ips": return "/admin/banned-ips";
                case "blog": return "/admin/blog";
                default: return "/admin/dashboard";
              }
            };
            
            return (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? "default" : "ghost"}
                onClick={() => navigate(getTabRoute(tab.id))}
                className={`gap-2 ${activeTab === tab.id ? "bg-green-600 hover:bg-green-700" : ""}`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </Button>
            );
          })}
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
                      <TableHead>Template</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>IP Address</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Discount</TableHead>
                      <TableHead className="w-[80px]">Actions</TableHead>
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
                          {purchase.template ? (
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs">
                              {getTemplateName(purchase.template)}
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-sm">{purchase.email || purchase.paypalEmail || "N/A"}</span>
                            {purchase.userId ? (
                              <span className="text-xs px-1.5 py-0.5 bg-green-100 text-green-700 rounded w-fit">Registered</span>
                            ) : (
                              <span className="text-xs px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded w-fit">Guest</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs font-mono text-slate-500">
                            {purchase.ipAddress || "-"}
                          </span>
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
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditPurchase(purchase)}
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deletePurchase(purchase.id)}
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
                    <TableHead>IP Address</TableHead>
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
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs">
                            {getTemplateName(purchase.template)}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm">{purchase.email || purchase.paypalEmail || "N/A"}</span>
                          {purchase.userId ? (
                            <span className="text-xs px-1.5 py-0.5 bg-green-100 text-green-700 rounded w-fit">Registered</span>
                          ) : (
                            <span className="text-xs px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded w-fit">Guest</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs font-mono text-slate-500">
                          {purchase.ipAddress || "-"}
                        </span>
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
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditPurchase(purchase)}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deletePurchase(purchase.id)}
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
          <div className="space-y-6">
            {/* User Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Total Registered Users"
                value={dashboardStats?.stats?.totalUsers || 0}
                icon={Users}
                color="blue"
              />
              <StatCard
                title="Active Subscribers"
                value={dashboardStats?.stats?.totalSubscribers || 0}
                icon={UserCheck}
                color="green"
              />
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-orange-100 text-orange-600">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Cancelling</p>
                    <p className="text-2xl font-bold text-slate-800">{dashboardStats?.stats?.cancellingSubscribers || 0}</p>
                    <p className="text-xs text-orange-600">Pending cancellation</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-purple-100 text-purple-600">
                    <DollarSign className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Monthly Recurring Revenue</p>
                    <p className="text-2xl font-bold text-slate-800">{formatCurrency(dashboardStats?.stats?.monthlySubscriptionRevenue || 0)}</p>
                    <p className="text-xs text-purple-600">From active subscriptions</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Subscription Tier Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-green-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">Starter Plan</p>
                    <p className="text-2xl font-bold text-green-600">{dashboardStats?.subscriptionStats?.byTier?.starter || 0}</p>
                    <p className="text-xs text-slate-400">$19.99/mo</p>
                  </div>
                  {dashboardStats?.subscriptionStats?.cancellingByTier?.starter > 0 && (
                    <div className="text-right">
                      <p className="text-xs text-orange-500">{dashboardStats?.subscriptionStats?.cancellingByTier?.starter} cancelling</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">Professional Plan</p>
                    <p className="text-2xl font-bold text-blue-600">{dashboardStats?.subscriptionStats?.byTier?.professional || 0}</p>
                    <p className="text-xs text-slate-400">$29.99/mo</p>
                  </div>
                  {dashboardStats?.subscriptionStats?.cancellingByTier?.professional > 0 && (
                    <div className="text-right">
                      <p className="text-xs text-orange-500">{dashboardStats?.subscriptionStats?.cancellingByTier?.professional} cancelling</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-purple-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">Business Plan</p>
                    <p className="text-2xl font-bold text-purple-600">{dashboardStats?.subscriptionStats?.byTier?.business || 0}</p>
                    <p className="text-xs text-slate-400">$49.99/mo</p>
                  </div>
                  {dashboardStats?.subscriptionStats?.cancellingByTier?.business > 0 && (
                    <div className="text-right">
                      <p className="text-xs text-orange-500">{dashboardStats?.subscriptionStats?.cancellingByTier?.business} cancelling</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Subscription Tier Distribution Pie Chart */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-semibold text-slate-800 mb-4">Subscription Distribution</h2>
                <div className="h-[300px]">
                  {dashboardStats?.subscriptionStats && (dashboardStats.subscriptionStats.byTier?.starter > 0 || dashboardStats.subscriptionStats.byTier?.professional > 0 || dashboardStats.subscriptionStats.byTier?.business > 0) ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Starter', value: dashboardStats.subscriptionStats.byTier?.starter || 0, fill: '#16a34a' },
                            { name: 'Professional', value: dashboardStats.subscriptionStats.byTier?.professional || 0, fill: '#3b82f6' },
                            { name: 'Business', value: dashboardStats.subscriptionStats.byTier?.business || 0, fill: '#8b5cf6' }
                          ].filter(item => item.value > 0)}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {[
                            { name: 'Starter', value: dashboardStats.subscriptionStats.byTier?.starter || 0, fill: '#16a34a' },
                            { name: 'Professional', value: dashboardStats.subscriptionStats.byTier?.professional || 0, fill: '#3b82f6' },
                            { name: 'Business', value: dashboardStats.subscriptionStats.byTier?.business || 0, fill: '#8b5cf6' }
                          ].filter(item => item.value > 0).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#fff', 
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                          }}
                          formatter={(value) => [value, 'Subscribers']}
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
                      <div className="text-center">
                        <UserCheck className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>No active subscribers yet</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* User Registration Trend Chart */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-semibold text-slate-800 mb-4">User Registrations (Last 30 Days)</h2>
                <div className="h-[300px]">
                  {dashboardStats?.userRegistrations && dashboardStats.userRegistrations.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={dashboardStats.userRegistrations.map(item => ({
                        name: new Date(item._id).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                        users: item.count
                      }))}>
                        <defs>
                          <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
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
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#fff', 
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                          }}
                          formatter={(value) => [value, 'New Users']}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="users" 
                          stroke="#3b82f6" 
                          strokeWidth={2}
                          fillOpacity={1} 
                          fill="url(#colorUsers)" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400">
                      <div className="text-center">
                        <UserPlus className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>No registration data available</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Subscriber Growth Bar Chart */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">Active vs Cancelling Subscribers by Tier</h2>
              <div className="h-[250px]">
                {dashboardStats?.subscriptionStats ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
                      { 
                        name: 'Starter', 
                        active: dashboardStats.subscriptionStats.byTier?.starter || 0,
                        cancelling: dashboardStats.subscriptionStats.cancellingByTier?.starter || 0
                      },
                      { 
                        name: 'Professional', 
                        active: dashboardStats.subscriptionStats.byTier?.professional || 0,
                        cancelling: dashboardStats.subscriptionStats.cancellingByTier?.professional || 0
                      },
                      { 
                        name: 'Business', 
                        active: dashboardStats.subscriptionStats.byTier?.business || 0,
                        cancelling: dashboardStats.subscriptionStats.cancellingByTier?.business || 0
                      }
                    ]}>
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
                      />
                      <Legend />
                      <Bar dataKey="active" name="Active" fill="#16a34a" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="cancelling" name="Cancelling" fill="#f97316" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400">
                    No data available
                  </div>
                )}
              </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex flex-col gap-4 mb-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-slate-800">Registered Users</h2>
                  <p className="text-sm text-slate-500">{usersTotal} total users</p>
                </div>
                
                {/* Filters Row */}
                <div className="flex flex-wrap items-center gap-3">
                  {/* Search */}
                  <div className="relative flex-1 min-w-[200px] max-w-[300px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      placeholder="Search by name or email..."
                      value={usersSearchQuery}
                      onChange={(e) => setUsersSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  
                  {/* Subscription Type Filter */}
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-slate-500" />
                    <Select 
                      value={usersSubscriptionFilter} 
                      onValueChange={(v) => { 
                        setUsersSubscriptionFilter(v); 
                        setUsersPage(0); 
                      }}
                    >
                      <SelectTrigger className="w-[160px]">
                        <SelectValue placeholder="Subscription" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Subscriptions</SelectItem>
                        <SelectItem value="none">No Subscription</SelectItem>
                        <SelectItem value="starter">Starter</SelectItem>
                        <SelectItem value="professional">Professional</SelectItem>
                        <SelectItem value="business">Business</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Join Date Filter */}
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-500" />
                    <Select 
                      value={usersDateFilter} 
                      onValueChange={(v) => { 
                        setUsersDateFilter(v); 
                        setUsersPage(0); 
                      }}
                    >
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Join Date" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Time</SelectItem>
                        <SelectItem value="today">Joined Today</SelectItem>
                        <SelectItem value="week">This Week</SelectItem>
                        <SelectItem value="month">This Month</SelectItem>
                        <SelectItem value="quarter">This Quarter</SelectItem>
                        <SelectItem value="year">This Year</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Clear Filters */}
                  {(usersSubscriptionFilter !== "all" || usersDateFilter !== "all" || usersSearchQuery) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setUsersSubscriptionFilter("all");
                        setUsersDateFilter("all");
                        setUsersSearchQuery("");
                        setUsersPage(0);
                      }}
                      className="text-slate-500 hover:text-slate-700"
                    >
                      Clear Filters
                    </Button>
                  )}
                </div>
                
                {/* Results Summary */}
                <div className="text-sm text-slate-500">
                  Showing {users.length} of {usersTotal} users
                  {(usersSubscriptionFilter !== "all" || usersDateFilter !== "all" || usersSearchQuery) && " (filtered)"}
                </div>
              </div>

            {users.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">
                  {(usersSubscriptionFilter !== "all" || usersDateFilter !== "all" || usersSearchQuery) 
                    ? "No users match your filters" 
                    : "No registered users yet"}
                </p>
                <p className="text-sm text-slate-400">
                  {(usersSubscriptionFilter !== "all" || usersDateFilter !== "all" || usersSearchQuery) 
                    ? "Try adjusting your search or filters" 
                    : "Users will appear here when they sign up for subscriptions"}
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>IP Address</TableHead>
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
                        // Use downloads_remaining from subscription object if available, otherwise fall back to tier config
                        const isUnlimited = user.subscription?.downloads_remaining === -1 || tier?.downloads === -1;
                        const downloadsTotal = user.subscription?.downloads_total || tier?.downloads || 0;
                        const downloadsRemaining = user.subscription?.downloads_remaining ?? 0;
                        const downloadsUsed = isUnlimited ? 0 : Math.max(0, downloadsTotal - downloadsRemaining);
                        const downloadsLimit = isUnlimited ? "∞" : downloadsTotal;
                        return (
                          <TableRow key={user.id} className={user.isBanned ? "bg-red-50" : ""}>
                            <TableCell className="font-medium">{user.name}</TableCell>
                            <TableCell className="text-sm">{user.email}</TableCell>
                            <TableCell>
                              <span className="text-xs font-mono text-slate-500">
                                {user.ipAddress || "-"}
                              </span>
                            </TableCell>
                            <TableCell>
                              {user.isBanned ? (
                                <span className="px-2 py-1 bg-red-100 text-red-700 rounded-md text-sm">Banned</span>
                              ) : (
                                <span className="px-2 py-1 bg-green-100 text-green-700 rounded-md text-sm">Active</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {user.subscription ? (
                                <div className="flex flex-col gap-1">
                                  <span className={`px-2 py-1 rounded-md text-sm w-fit ${
                                    user.subscription.tier === "unlimited" || user.subscription.tier === "business" ? "bg-purple-100 text-purple-700" :
                                    user.subscription.tier === "pro" || user.subscription.tier === "professional" ? "bg-blue-100 text-blue-700" :
                                    "bg-green-100 text-green-700"
                                  }`}>
                                    {tier?.name || user.subscription.tier.charAt(0).toUpperCase() + user.subscription.tier.slice(1)}
                                  </span>
                                  {user.subscription.status === "cancelling" && (
                                    <span className="px-2 py-0.5 bg-orange-100 text-orange-600 rounded text-xs w-fit flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      Cancelling
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-slate-400">None</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {user.subscription ? (
                                isUnlimited ? (
                                  <span className="font-medium text-purple-600">Unlimited</span>
                                ) : (
                                  <>
                                    <span className="font-medium">{downloadsRemaining}</span>
                                    <span className="text-slate-400"> / {downloadsLimit}</span>
                                  </>
                                )
                              ) : (
                                <span className="text-slate-400">-</span>
                              )}
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
                                    onClick={() => openEditUserModal(user)}
                                    className="text-slate-600"
                                  >
                                    <Pencil className="w-4 h-4 mr-2" />
                                    Edit User
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => openSubscriptionModal(user)}
                                    className="text-blue-600"
                                  >
                                    <CreditCard className="w-4 h-4 mr-2" />
                                    Change Subscription
                                  </DropdownMenuItem>
                                  {user.subscription && (
                                    <DropdownMenuItem 
                                      onClick={() => openDownloadsModal(user)}
                                      className="text-green-600"
                                    >
                                      <Download className="w-4 h-4 mr-2" />
                                      Add Bonus Downloads
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    onClick={() => toggleBanUser(user.id, user.isBanned)}
                                    className={user.isBanned ? "text-green-600" : "text-orange-600"}
                                  >
                                    <Ban className="w-4 h-4 mr-2" />
                                    {user.isBanned ? "Unban User" : "Ban User"}
                                  </DropdownMenuItem>
                                  {user.ipAddress && user.ipAddress !== "unknown" && (
                                    <DropdownMenuItem 
                                      onClick={() => banUserIP(user)}
                                      className="text-red-600"
                                    >
                                      <Shield className="w-4 h-4 mr-2" />
                                      Ban IP Address
                                    </DropdownMenuItem>
                                  )}
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
              Current plan: <span className="font-medium">{selectedUser?.subscription?.tier ? (SUBSCRIPTION_TIERS[selectedUser.subscription.tier]?.name || selectedUser.subscription.tier) : "None"}</span>
              {selectedUser?.subscription?.downloads_remaining !== undefined && (
                <span className="ml-2 text-slate-500">
                  ({selectedUser.subscription.downloads_remaining === -1 ? "Unlimited" : `${selectedUser.subscription.downloads_remaining} downloads remaining`})
                </span>
              )}
            </div>
            
            <Select value={selectedTier} onValueChange={setSelectedTier}>
              <SelectTrigger>
                <SelectValue placeholder="Select a plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Subscription</SelectItem>
                {Object.entries(ADMIN_ASSIGNABLE_TIERS).map(([key, tier]) => (
                  <SelectItem key={key} value={key}>
                    {tier.name} - ${tier.price}/mo ({tier.downloads === -1 ? "Unlimited" : tier.downloads} downloads)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {selectedTier && selectedTier !== "none" && (
              <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
                <p><strong>{ADMIN_ASSIGNABLE_TIERS[selectedTier]?.name || SUBSCRIPTION_TIERS[selectedTier]?.name}</strong></p>
                <p>${ADMIN_ASSIGNABLE_TIERS[selectedTier]?.price || SUBSCRIPTION_TIERS[selectedTier]?.price}/month</p>
                <p>{(ADMIN_ASSIGNABLE_TIERS[selectedTier]?.downloads ?? SUBSCRIPTION_TIERS[selectedTier]?.downloads) === -1 ? "Unlimited" : (ADMIN_ASSIGNABLE_TIERS[selectedTier]?.downloads || SUBSCRIPTION_TIERS[selectedTier]?.downloads)} downloads per month</p>
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

      {/* Add Bonus Downloads Modal */}
      <Dialog open={downloadsModalOpen} onOpenChange={setDownloadsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="w-5 h-5 text-green-600" />
              Add Bonus Downloads
            </DialogTitle>
            <DialogDescription>
              Add extra downloads for {selectedUser?.name} ({selectedUser?.email})
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="p-3 bg-slate-50 rounded-lg text-sm">
              <div className="flex justify-between mb-1">
                <span className="text-slate-600">Current Plan:</span>
                <span className="font-medium">{selectedUser?.subscription?.tier ? (SUBSCRIPTION_TIERS[selectedUser.subscription.tier]?.name || selectedUser.subscription.tier) : "None"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Downloads Remaining:</span>
                <span className="font-medium">
                  {selectedUser?.subscription?.downloads_remaining === -1 
                    ? "∞ Unlimited" 
                    : selectedUser?.subscription?.downloads_remaining || 0}
                </span>
              </div>
            </div>
            
            {selectedUser?.subscription?.downloads_remaining === -1 ? (
              <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
                <p>This user already has unlimited downloads.</p>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Bonus Downloads to Add</label>
                  <Input
                    type="number"
                    min="1"
                    value={editDownloadsCount}
                    onChange={(e) => setEditDownloadsCount(e.target.value)}
                    placeholder="Enter number of downloads to add"
                    className="w-full"
                  />
                  <p className="text-xs text-slate-500">
                    These bonus downloads will be added to the current count and reset on the next billing cycle.
                  </p>
                </div>
                
                {editDownloadsCount && parseInt(editDownloadsCount) > 0 && (
                  <div className="p-3 bg-green-50 rounded-lg text-sm text-green-700">
                    <p><strong>After adding:</strong> {(selectedUser?.subscription?.downloads_remaining || 0) + parseInt(editDownloadsCount)} downloads</p>
                  </div>
                )}
              </>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDownloadsModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={updateUserDownloads} 
              className="bg-green-600 hover:bg-green-700"
              disabled={selectedUser?.subscription?.downloads_remaining === -1 || !editDownloadsCount || parseInt(editDownloadsCount) < 1}
            >
              Add Downloads
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Modal */}
      <Dialog open={editUserModalOpen} onOpenChange={setEditUserModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="w-5 h-5 text-slate-600" />
              Edit User
            </DialogTitle>
            <DialogDescription>
              Update user information for {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Name</label>
              <Input
                type="text"
                value={editUserData.name}
                onChange={(e) => setEditUserData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter user's name"
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Email</label>
              <Input
                type="email"
                value={editUserData.email}
                onChange={(e) => setEditUserData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Enter user's email"
                className="w-full"
              />
            </div>
            
            <div className="p-3 bg-slate-50 rounded-lg text-sm">
              <div className="flex justify-between mb-1">
                <span className="text-slate-600">User ID:</span>
                <span className="font-mono text-xs">{selectedUser?.id}</span>
              </div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-600">Joined:</span>
                <span>{selectedUser?.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString() : "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Status:</span>
                <span className={selectedUser?.isBanned ? "text-red-600" : "text-green-600"}>
                  {selectedUser?.isBanned ? "Banned" : "Active"}
                </span>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUserModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={updateUser} 
              className="bg-green-600 hover:bg-green-700"
              disabled={isUpdatingUser || !editUserData.name.trim() || !editUserData.email.trim()}
            >
              {isUpdatingUser ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
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

      {/* Add/Edit Purchase Modal */}
      <Dialog open={addPurchaseModalOpen} onOpenChange={closeModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingPurchase ? "Edit Purchase" : "Add Manual Purchase"}</DialogTitle>
            <DialogDescription>
              {editingPurchase 
                ? "Update the purchase record details below."
                : "Add a historical purchase record. This is useful for tracking purchases made before the system was implemented."
              }
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
            <Button variant="outline" onClick={closeModal}>
              Cancel
            </Button>
            <Button 
              onClick={editingPurchase ? updatePurchase : addManualPurchase} 
              disabled={isAddingPurchase || !newPurchase.documentType || !newPurchase.amount || !newPurchase.paypalEmail}
              className="bg-green-600 hover:bg-green-700"
            >
              {isAddingPurchase ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {editingPurchase ? "Updating..." : "Adding..."}
                </>
              ) : (
                editingPurchase ? "Update Purchase" : "Add Purchase"
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

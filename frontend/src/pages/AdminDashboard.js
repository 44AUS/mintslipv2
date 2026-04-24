import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  IonModal, IonHeader, IonToolbar, IonTitle, IonContent as IonModalContent,
  IonFooter, IonButton, IonButtons, IonSpinner,
} from "@ionic/react";
import { toast } from "sonner";
import {
  LayoutDashboard, ShoppingCart, Users, DollarSign, TrendingUp, FileText,
  RefreshCw, Tag, Calendar, Filter, Download, CreditCard, ChevronLeft,
  ChevronRight, Trash2, Ban, UserX, MoreVertical, CalendarDays, Eye,
  FileDown, Search, Pencil, UserPlus, UserCheck, Clock, Shield, X,
  FolderArchive, MailCheck,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend,
} from "recharts";
import AdminLayout from "@/components/AdminLayout";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";

// Document type labels
const DOCUMENT_TYPES = {
  "paystub": "Pay Stub",
  "resume": "AI Resume",
  "w2": "W-2 Form",
  "w9": "W-9 Form",
  "phone_lookup": "Reverse Phone Lookup",
  "name_lookup": "Name Lookup",
  "address_lookup": "Address Lookup",
  "carrier_lookup": "Carrier Lookup",
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

// Helper function to format document type with quantity
const formatDocumentType = (purchase) => {
  const baseType = DOCUMENT_TYPES[purchase.documentType] || purchase.documentType;
  const quantity = purchase.quantity || 1;
  
  // Only show quantity for paystubs and similar documents where quantity > 1 matters
  if (purchase.documentType === "paystub" || purchase.documentType === "canadian-paystub") {
    return `${baseType} x${quantity}`;
  }
  
  return baseType;
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
    if (pathname.includes("/admin/saved-docs")) return "saved-docs";
    if (pathname.includes("/admin/discounts")) return "discounts";
    if (pathname.includes("/admin/banned-ips")) return "banned-ips";
    if (pathname.includes("/admin/blog")) return "blog";
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
  const [purchaseTypeFilter, setPurchaseTypeFilter] = useState("guests"); // "guests" or "users"
  const [revenueTypeFilter, setRevenueTypeFilter] = useState("all"); // "all", "guest", "subscription"
  const [dateRangeFilter, setDateRangeFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [revenueChartData, setRevenueChartData] = useState([]);
  const [chartPeriod, setChartPeriod] = useState("30days");
  const [chartTypeFilter, setChartTypeFilter] = useState("all"); // "all", "subscription", "guest"
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
  const [editUserData, setEditUserData] = useState({ name: "", email: "", ipAddress: "" });
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
    notes: "",
    quantity: "1",
    ipAddress: ""
  });
  const [isAddingPurchase, setIsAddingPurchase] = useState(false);
  
  // Refund modal state
  const [refundModal, setRefundModal] = useState(null); // purchase object
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("requested_by_customer");
  const [refundLoading, setRefundLoading] = useState(false);

  // Users filter state
  const [usersSearchQuery, setUsersSearchQuery] = useState("");
  const [usersSearchDebounced, setUsersSearchDebounced] = useState("");
  const [usersSubscriptionFilter, setUsersSubscriptionFilter] = useState("all");
  const [usersDateFilter, setUsersDateFilter] = useState("all");
  const [mrrPeriod, setMrrPeriod] = useState("monthly"); // monthly or yearly
  const usersSearchTimeoutRef = useRef(null);
  
  // Historical import state
  const [isImportingHistory, setIsImportingHistory] = useState(false);
  const [importResult, setImportResult] = useState(null);

  // User action dropdown
  const [openUserMenuId, setOpenUserMenuId] = useState(null);

  // Saved documents state
  const [savedDocuments, setSavedDocuments] = useState([]);
  const [savedDocumentsTotal, setSavedDocumentsTotal] = useState(0);
  const [savedDocumentsPage, setSavedDocumentsPage] = useState(0);
  const [savedDocumentsTypeFilter, setSavedDocumentsTypeFilter] = useState("all");
  const [savedDocumentsUserFilter, setSavedDocumentsUserFilter] = useState("");
  const [isSavedDocumentsLoading, setIsSavedDocumentsLoading] = useState(false);

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
        
        // Process data for charts (include subscription payments)
        processChartData(statsData.recentPurchases || [], statsData.recentSubscriptionPayments || []);
      }
      
      // Load purchases
      await loadPurchases();
      
      // Load users
      await loadUsers();
      
      // Load saved documents
      await loadSavedDocuments();
      
    } catch (error) {
      console.error("Error loading dashboard:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Process purchases data for charts
  const processChartData = (purchases, subscriptionPayments = [], period = chartPeriod, typeFilter = chartTypeFilter) => {
    // Combine purchases and subscription payments if no specific filter
    let allTransactions = [];
    
    if (typeFilter === "subscription") {
      // Only include subscription payments
      allTransactions = (subscriptionPayments || []).map(p => ({
        ...p,
        type: "subscription"
      }));
    } else if (typeFilter === "guest") {
      // Only include guest purchases (one-time payments)
      allTransactions = (purchases || []).filter(p => 
        p.type === "guest" || 
        p.isGuest === true || 
        !p.userId
      );
    } else {
      // Include all - both purchases and subscription payments
      const guestPurchases = (purchases || []).map(p => ({
        ...p,
        type: p.type || "guest"
      }));
      const subPayments = (subscriptionPayments || []).map(p => ({
        ...p,
        type: "subscription"
      }));
      allTransactions = [...guestPurchases, ...subPayments];
    }
    
    if (allTransactions.length === 0) {
      setRevenueChartData([]);
      return;
    }
    
    const now = new Date();
    let startDate;
    let groupBy;
    let dateFormat;
    
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
    
    // Filter transactions within the period
    let filteredTransactions = allTransactions.filter(p => new Date(p.createdAt) >= startDate);
    
    // Generate all date keys for the period (to show empty dates too)
    const allDates = {};
    const tempDate = new Date(startDate);
    
    while (tempDate <= now) {
      let key;
      if (groupBy === "day") {
        key = tempDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        tempDate.setDate(tempDate.getDate() + 1);
      } else if (groupBy === "week") {
        const weekStart = new Date(tempDate);
        weekStart.setDate(tempDate.getDate() - tempDate.getDay());
        key = weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        tempDate.setDate(tempDate.getDate() + 7);
      } else {
        key = tempDate.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
        tempDate.setMonth(tempDate.getMonth() + 1);
      }
      allDates[key] = { name: key, revenue: 0, purchases: 0, subscriptions: 0, guestRevenue: 0, subscriptionRevenue: 0, date: new Date(tempDate) };
    }
    
    // Group transactions by time period
    filteredTransactions.forEach(transaction => {
      const date = new Date(transaction.createdAt);
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
      
      if (allDates[key]) {
        const amount = transaction.amount || 0;
        allDates[key].revenue += amount;
        
        if (transaction.type === "subscription") {
          allDates[key].subscriptions += 1;
          allDates[key].subscriptionRevenue += amount;
        } else {
          allDates[key].purchases += 1;
          allDates[key].guestRevenue += amount;
        }
      }
    });
    
    // Convert to array and sort by date
    const chartData = Object.values(allDates).sort((a, b) => {
      // Parse dates more reliably
      const parseDate = (name) => {
        const parts = name.split(" ");
        const monthMap = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
        const month = monthMap[parts[0]] || 0;
        const day = parseInt(parts[1]) || 1;
        const year = parts[2] ? 2000 + parseInt(parts[2]) : new Date().getFullYear();
        return new Date(year, month, day);
      };
      return parseDate(a.name) - parseDate(b.name);
    });
    
    // Limit to reasonable number of data points
    const maxPoints = groupBy === "day" ? 30 : groupBy === "week" ? 13 : 12;
    const limitedData = chartData.slice(-maxPoints);
    
    setRevenueChartData(limitedData);
  };
  
  // Update chart when period or type filter changes
  useEffect(() => {
    if (dashboardStats?.recentPurchases || dashboardStats?.recentSubscriptionPayments) {
      processChartData(
        dashboardStats.recentPurchases || [], 
        dashboardStats.recentSubscriptionPayments || [],
        chartPeriod, 
        chartTypeFilter
      );
    }
  }, [chartPeriod, chartTypeFilter, dashboardStats]);

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

  const loadSavedDocuments = async () => {
    const token = localStorage.getItem("adminToken");
    setIsSavedDocumentsLoading(true);
    
    try {
      const params = new URLSearchParams({
        skip: (savedDocumentsPage * pageSize).toString(),
        limit: pageSize.toString()
      });
      
      if (savedDocumentsTypeFilter !== "all") {
        params.append("documentType", savedDocumentsTypeFilter);
      }
      
      if (savedDocumentsUserFilter.trim()) {
        params.append("userId", savedDocumentsUserFilter.trim());
      }
      
      const response = await fetch(
        `${BACKEND_URL}/api/admin/saved-documents?${params.toString()}`,
        { headers: { "Authorization": `Bearer ${token}` } }
      );
      
      if (response.ok) {
        const data = await response.json();
        setSavedDocuments(data.documents);
        setSavedDocumentsTotal(data.total);
      }
    } catch (error) {
      console.error("Error loading saved documents:", error);
    } finally {
      setIsSavedDocumentsLoading(false);
    }
  };

  const deleteSavedDocument = async (docId) => {
    if (!window.confirm("Are you sure you want to delete this saved document? This action cannot be undone.")) return;
    
    const token = localStorage.getItem("adminToken");
    try {
      const response = await fetch(`${BACKEND_URL}/api/admin/saved-documents/${docId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (response.ok) {
        toast.success("Document deleted");
        loadSavedDocuments();
      } else {
        toast.error("Failed to delete document");
      }
    } catch (error) {
      toast.error("Error deleting document");
    }
  };

  const deleteAllUserSavedDocuments = async (userId, userEmail) => {
    if (!window.confirm(`Are you sure you want to delete ALL saved documents for ${userEmail}? This action cannot be undone.`)) return;
    
    const token = localStorage.getItem("adminToken");
    try {
      const response = await fetch(`${BACKEND_URL}/api/admin/users/${userId}/saved-documents`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        toast.success(data.message);
        loadSavedDocuments();
      } else {
        toast.error("Failed to delete documents");
      }
    } catch (error) {
      toast.error("Error deleting documents");
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

  const confirmUserEmail = async (userId) => {
    if (!window.confirm("Are you sure you want to confirm this user's email address?")) return;
    
    const token = localStorage.getItem("adminToken");
    try {
      const response = await fetch(`${BACKEND_URL}/api/admin/users/${userId}/verify`, {
        method: "PUT",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      
      if (response.ok) {
        toast.success("User email confirmed successfully");
        fetchUsers();
      } else {
        const data = await response.json();
        toast.error(data.detail || "Failed to confirm user email");
      }
    } catch (error) {
      toast.error("Error confirming user email");
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
    setEditUserData({ name: user.name || "", email: user.email || "", ipAddress: user.ipAddress || "" });
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
          email: editUserData.email.trim(),
          ipAddress: editUserData.ipAddress.trim() || null
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast.success("User updated successfully");
        setEditUserModalOpen(false);
        setSelectedUser(null);
        setEditUserData({ name: "", email: "", ipAddress: "" });
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

  // Load saved documents when filters change
  useEffect(() => {
    if (!isLoading) {
      loadSavedDocuments();
    }
  }, [savedDocumentsPage, savedDocumentsTypeFilter, savedDocumentsUserFilter]);

  // Calculate period-based revenue
  useEffect(() => {
    if (dashboardStats?.recentPurchases) {
      calculatePeriodRevenue();
    }
  }, [revenuePeriod, revenueTypeFilter, dashboardStats]);

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
      const revenueTypeParam = revenueTypeFilter !== "all" ? `&revenueType=${revenueTypeFilter}` : "";
      const response = await fetch(
        `${BACKEND_URL}/api/admin/revenue?startDate=${startDate.toISOString()}${revenueTypeParam}`,
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
  const calculatePeriodPurchases = useCallback(async () => {
    const token = localStorage.getItem("adminToken");
    const now = new Date();
    let startDate;
    
    switch (purchasesPeriod) {
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
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    try {
      // Build URL with userType filter
      const userTypeParam = purchaseTypeFilter === "guests" ? "&userType=guest" : "&userType=registered";
      const response = await fetch(
        `${BACKEND_URL}/api/admin/revenue?startDate=${startDate.toISOString()}${userTypeParam}`,
        { headers: { "Authorization": `Bearer ${token}` } }
      );
      
      if (response.ok) {
        const data = await response.json();
        // Use downloadCount which sums quantities (e.g., 3 paystubs = 3 downloads)
        setPeriodPurchases(data.downloadCount || data.purchaseCount || 0);
      }
    } catch (error) {
      console.error("Error calculating period purchases:", error);
      // Fallback: calculate from recent purchases if API fails
      if (dashboardStats?.recentPurchases) {
        const filtered = dashboardStats.recentPurchases.filter(p => {
          const purchaseDate = new Date(p.createdAt);
          const isInPeriod = purchaseDate >= startDate;
          // Filter by user type
          if (purchaseTypeFilter === "guests") {
            return isInPeriod && !p.userId;
          } else {
            return isInPeriod && p.userId;
          }
        });
        // Sum quantities for accurate download count
        const totalDownloads = filtered.reduce((sum, p) => sum + (p.quantity || 1), 0);
        setPeriodPurchases(totalDownloads);
      }
    }
  }, [purchasesPeriod, purchaseTypeFilter, dashboardStats?.recentPurchases]);

  useEffect(() => {
    if (dashboardStats?.recentPurchases) {
      calculatePeriodPurchases();
    }
  }, [calculatePeriodPurchases, dashboardStats?.recentPurchases]);

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

  // Import historical subscription payments from Stripe
  const importHistoricalSubscriptions = async () => {
    setIsImportingHistory(true);
    setImportResult(null);
    const token = localStorage.getItem("adminToken");
    
    if (!token) {
      toast.error("No admin token found. Please log in again.");
      setIsImportingHistory(false);
      return;
    }
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/admin/import-historical-subscriptions?limit=1000`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setImportResult(data.stats);
        toast.success(`Imported ${data.stats.imported} subscription payments! Total revenue: $${data.stats.totalImportedRevenue}`);
        // Refresh dashboard stats
        loadDashboardData();
      } else {
        console.error("Import failed:", data);
        toast.error(data.detail || data.message || "Failed to import historical data");
      }
    } catch (error) {
      console.error("Import error:", error);
      toast.error(`Error: ${error.message || "Failed to connect to server"}`);
    } finally {
      setIsImportingHistory(false);
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

  const handleRefund = async () => {
    if (!refundModal) return;
    const amount = parseFloat(refundAmount);
    if (!amount || amount <= 0) { toast.error("Enter a valid refund amount"); return; }
    if (amount > refundModal.amount) { toast.error("Amount exceeds original purchase"); return; }
    setRefundLoading(true);
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`${BACKEND_URL}/api/admin/purchases/${refundModal.id}/refund`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ amount_dollars: amount, reason: refundReason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Refund failed");
      toast.success(`Refund of $${amount.toFixed(2)} issued`);
      setPurchases(prev => prev.map(p => p.id === refundModal.id ? { ...p, refunded: true, refundedAmount: amount } : p));
      setRefundModal(null);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setRefundLoading(false);
    }
  };

  const openEditPurchase = (purchase) => {
    setEditingPurchase(purchase);
    setNewPurchase({
      documentType: purchase.documentType || "paystub",
      amount: purchase.amount?.toString() || "",
      paypalEmail: purchase.paypalEmail || purchase.email || "",
      purchaseDate: purchase.createdAt ? new Date(purchase.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      template: purchase.template || "",
      discountCode: purchase.discountCode || "",
      discountAmount: purchase.discountAmount?.toString() || "",
      notes: purchase.notes || "",
      quantity: purchase.quantity?.toString() || "1",
      ipAddress: purchase.ipAddress || ""
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
          notes: newPurchase.notes || null,
          quantity: newPurchase.quantity ? parseInt(newPurchase.quantity) : 1,
          ipAddress: newPurchase.ipAddress || null
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
      notes: "",
      quantity: "1",
      ipAddress: ""
    });
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
      <AdminLayout adminInfo={adminInfo}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 256, gap: 12 }}>
          <IonSpinner name="crescent" color="primary" style={{ width: 32, height: 32 }} />
          <span style={{ fontSize: "1.125rem", color: "var(--admin-text-muted)" }}>Loading dashboard…</span>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout adminInfo={adminInfo} onRefresh={loadDashboardData} showPasswordModal={() => setPasswordModalOpen(true)}>

      <div className="max-w-7xl mx-auto px-4 py-6">

        {/* Overview Tab */}
        {activeTab === "overview" && dashboardStats && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* All Time Revenue Card with Filter */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-green-100 text-green-600">
                      <DollarSign className="w-6 h-6" />
                    </div>
                  </div>
                  <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5">
                    <button
                      onClick={() => setRevenueTypeFilter("all")}
                      className={`px-2 py-1 text-xs rounded-md transition-colors ${
                        revenueTypeFilter === "all" 
                          ? "bg-white text-green-600 shadow-sm font-medium" 
                          : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setRevenueTypeFilter("guest")}
                      className={`px-2 py-1 text-xs rounded-md transition-colors ${
                        revenueTypeFilter === "guest" 
                          ? "bg-white text-green-600 shadow-sm font-medium" 
                          : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      Guests
                    </button>
                    <button
                      onClick={() => setRevenueTypeFilter("subscription")}
                      className={`px-2 py-1 text-xs rounded-md transition-colors ${
                        revenueTypeFilter === "subscription" 
                          ? "bg-white text-green-600 shadow-sm font-medium" 
                          : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      Subs
                    </button>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-slate-500">All Time Revenue</p>
                  <p className="text-2xl font-bold text-slate-800 mt-1">
                    {formatCurrency(
                      revenueTypeFilter === "all" 
                        ? (dashboardStats.stats.combinedTotalRevenue || dashboardStats.stats.totalRevenue)
                        : revenueTypeFilter === "guest"
                          ? dashboardStats.stats.totalRevenue
                          : (dashboardStats.stats.totalSubscriptionRevenue || 0)
                    )}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {revenueTypeFilter === "all" 
                      ? "Guest purchases + Subscriptions" 
                      : revenueTypeFilter === "guest"
                        ? "One-time guest purchases only"
                        : "Subscription payments only"}
                  </p>
                </div>
              </div>
              
              {/* Period-based Purchases Card with Dropdown */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-100 text-blue-600">
                      <ShoppingCart className="w-6 h-6" />
                    </div>
                  </div>
                  <select className="admin-select" style={{ width: 120, fontSize: "0.75rem", padding: "5px 28px 5px 8px" }} value={purchasesPeriod} onChange={(e) => setPurchasesPeriod(e.target.value)}>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                    <option value="quarter">This Quarter</option>
                    <option value="year">This Year</option>
                  </select>
                </div>
                <div className="mt-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-500">
                      {purchasesPeriod === "week" ? "Weekly" : 
                       purchasesPeriod === "month" ? "Monthly" : 
                       purchasesPeriod === "quarter" ? "Quarterly" : "Yearly"} {purchaseTypeFilter === "guests" ? "Purchases" : "Downloads"}
                    </p>
                    <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5">
                      <button
                        onClick={() => setPurchaseTypeFilter("guests")}
                        className={`px-2 py-1 text-xs rounded-md transition-colors ${
                          purchaseTypeFilter === "guests" 
                            ? "bg-white text-blue-600 shadow-sm font-medium" 
                            : "text-slate-500 hover:text-slate-700"
                        }`}
                      >
                        Guests
                      </button>
                      <button
                        onClick={() => setPurchaseTypeFilter("users")}
                        className={`px-2 py-1 text-xs rounded-md transition-colors ${
                          purchaseTypeFilter === "users" 
                            ? "bg-white text-blue-600 shadow-sm font-medium" 
                            : "text-slate-500 hover:text-slate-700"
                        }`}
                      >
                        Users
                      </button>
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-slate-800 mt-1">{periodPurchases}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {purchaseTypeFilter === "guests" ? "One-time guest purchases" : "Registered user downloads"}
                  </p>
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
                  <select className="admin-select" style={{ width: 120, fontSize: "0.75rem", padding: "5px 28px 5px 8px" }} value={revenuePeriod} onChange={(e) => setRevenuePeriod(e.target.value)}>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                    <option value="quarter">This Quarter</option>
                    <option value="year">This Year</option>
                  </select>
                </div>
                <div className="mt-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-500">
                      {revenuePeriod === "week" ? "Weekly" : 
                       revenuePeriod === "month" ? "Monthly" : 
                       revenuePeriod === "quarter" ? "Quarterly" : "Yearly"} Revenue
                    </p>
                    <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5">
                      <button
                        onClick={() => setRevenueTypeFilter("all")}
                        className={`px-2 py-1 text-xs rounded-md transition-colors ${
                          revenueTypeFilter === "all" 
                            ? "bg-white text-purple-600 shadow-sm font-medium" 
                            : "text-slate-500 hover:text-slate-700"
                        }`}
                      >
                        All
                      </button>
                      <button
                        onClick={() => setRevenueTypeFilter("guest")}
                        className={`px-2 py-1 text-xs rounded-md transition-colors ${
                          revenueTypeFilter === "guest" 
                            ? "bg-white text-purple-600 shadow-sm font-medium" 
                            : "text-slate-500 hover:text-slate-700"
                        }`}
                      >
                        Guests
                      </button>
                      <button
                        onClick={() => setRevenueTypeFilter("subscription")}
                        className={`px-2 py-1 text-xs rounded-md transition-colors ${
                          revenueTypeFilter === "subscription" 
                            ? "bg-white text-purple-600 shadow-sm font-medium" 
                            : "text-slate-500 hover:text-slate-700"
                        }`}
                      >
                        Subs
                      </button>
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-slate-800 mt-1">{formatCurrency(periodRevenue)}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {revenueTypeFilter === "all" 
                      ? "Guest purchases + Subscriptions" 
                      : revenueTypeFilter === "guest"
                        ? "One-time guest purchases only"
                        : "Subscription payments only"}
                  </p>
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
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <h2 className="text-lg font-semibold text-slate-800">Revenue Over Time</h2>
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Type Filter */}
                    <div className="flex items-center bg-slate-100 rounded-lg p-1">
                      <button
                        onClick={() => setChartTypeFilter("all")}
                        className={`px-3 py-1 text-xs rounded-md transition-colors ${
                          chartTypeFilter === "all" 
                            ? "bg-white text-green-600 shadow-sm font-medium" 
                            : "text-slate-500 hover:text-slate-700"
                        }`}
                      >
                        All
                      </button>
                      <button
                        onClick={() => setChartTypeFilter("subscription")}
                        className={`px-3 py-1 text-xs rounded-md transition-colors ${
                          chartTypeFilter === "subscription" 
                            ? "bg-white text-green-600 shadow-sm font-medium" 
                            : "text-slate-500 hover:text-slate-700"
                        }`}
                      >
                        Subscriptions
                      </button>
                      <button
                        onClick={() => setChartTypeFilter("guest")}
                        className={`px-3 py-1 text-xs rounded-md transition-colors ${
                          chartTypeFilter === "guest" 
                            ? "bg-white text-green-600 shadow-sm font-medium" 
                            : "text-slate-500 hover:text-slate-700"
                        }`}
                      >
                        Guest
                      </button>
                    </div>
                    {/* Period Filter */}
                    <select className="admin-select" style={{ width: 140 }} value={chartPeriod} onChange={(e) => setChartPeriod(e.target.value)}>
                      <option value="7days">Last 7 Days</option>
                      <option value="30days">Last 30 Days</option>
                      <option value="90days">Last 90 Days</option>
                      <option value="year">Last Year</option>
                    </select>
                  </div>
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
                  <p className="text-sm text-slate-500">
                    {chartTypeFilter === "all" ? "All purchases" : chartTypeFilter === "subscription" ? "Subscriptions only" : "Guest purchases only"}
                  </p>
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
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Document Type</th>
                      <th>Template</th>
                      <th>Customer</th>
                      <th>IP Address</th>
                      <th>Amount</th>
                      <th>Discount</th>
                      <th style={{ width: 80 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboardStats.recentPurchases.slice(0, 10).map((purchase) => (
                      <tr key={purchase.id}>
                        <td style={{ fontSize: "0.8125rem" }}>{formatDate(purchase.createdAt)}</td>
                        <td><span className="admin-badge admin-badge-slate">{formatDocumentType(purchase)}</span></td>
                        <td>
                          {purchase.template
                            ? <span className="admin-badge admin-badge-blue">{getTemplateName(purchase.template)}</span>
                            : <span style={{ color: "var(--admin-text-muted)" }}>-</span>}
                        </td>
                        <td>
                          <div style={{ fontSize: "0.875rem" }}>{purchase.email || purchase.paypalEmail || "N/A"}</div>
                          {purchase.userId
                            ? <span className="admin-badge admin-badge-green" style={{ marginTop: 2 }}>Registered</span>
                            : <span className="admin-badge admin-badge-slate" style={{ marginTop: 2 }}>Guest</span>}
                        </td>
                        <td><span style={{ fontSize: "0.75rem", fontFamily: "monospace", color: "var(--admin-text-muted)" }}>{purchase.ipAddress || "-"}</span></td>
                        <td style={{ fontWeight: 600 }}>{formatCurrency(purchase.amount)}</td>
                        <td>
                          {purchase.discountCode
                            ? <span className="admin-badge admin-badge-green">{purchase.discountCode} (-{formatCurrency(purchase.discountAmount)})</span>
                            : <span style={{ color: "var(--admin-text-muted)" }}>-</span>}
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: 4 }}>
                            <button className="admin-action-btn primary" onClick={() => openEditPurchase(purchase)} title="Edit"><Pencil size={14} /></button>
                            <button className="admin-action-btn danger" onClick={() => deletePurchase(purchase.id)} title="Delete"><Trash2 size={14} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
                  <IonButton color="primary" onClick={() => setAddPurchaseModalOpen(true)}>
                    <ShoppingCart size={16} style={{ marginRight: 6 }} />
                    Add Purchase
                  </IonButton>
                  <IonButton fill="outline" color="medium" onClick={exportPurchasesToCSV}>
                    <FileDown size={16} style={{ marginRight: 6 }} />
                    Export CSV
                  </IonButton>
                </div>
              </div>

              {/* Filters Row */}
              <div className="flex flex-wrap items-center gap-3">
                <div style={{ position: "relative", flex: 1, minWidth: 200, maxWidth: 300 }}>
                  <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--admin-text-muted)", pointerEvents: "none" }} />
                  <input
                    className="admin-input"
                    style={{ paddingLeft: 32 }}
                    placeholder="Search by email, type..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Filter size={14} style={{ color: "var(--admin-text-muted)" }} />
                  <select className="admin-select" style={{ width: 180 }} value={documentTypeFilter} onChange={(e) => { setDocumentTypeFilter(e.target.value); setPurchasesPage(0); }}>
                    <option value="all">All Types</option>
                    {Object.entries(DOCUMENT_TYPES).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar size={14} style={{ color: "var(--admin-text-muted)" }} />
                  <select className="admin-select" style={{ width: 150 }} value={dateRangeFilter} onChange={(e) => setDateRangeFilter(e.target.value)}>
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                    <option value="quarter">This Quarter</option>
                    <option value="year">This Year</option>
                  </select>
                </div>
                {(documentTypeFilter !== "all" || dateRangeFilter !== "all" || searchQuery) && (
                  <IonButton fill="clear" size="small" color="medium" onClick={() => { setDocumentTypeFilter("all"); setDateRangeFilter("all"); setSearchQuery(""); setPurchasesPage(0); }}>
                    Clear Filters
                  </IonButton>
                )}
              </div>

              <div className="text-sm text-slate-500">
                Showing {getFilteredPurchases().length} of {purchases.length} purchases
                {(documentTypeFilter !== "all" || dateRangeFilter !== "all" || searchQuery) && " (filtered)"}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Document Type</th>
                    <th>Template</th>
                    <th>Customer</th>
                    <th>IP Address</th>
                    <th>Amount</th>
                    <th>Discount</th>
                    <th style={{ width: 80 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {getFilteredPurchases().map((purchase) => (
                    <tr key={purchase.id}>
                      <td style={{ fontSize: "0.8125rem" }}>{formatDate(purchase.createdAt)}</td>
                      <td><span className="admin-badge admin-badge-slate">{formatDocumentType(purchase)}</span></td>
                      <td>
                        {purchase.template
                          ? <span className="admin-badge admin-badge-blue">{getTemplateName(purchase.template)}</span>
                          : <span style={{ color: "var(--admin-text-muted)" }}>-</span>}
                      </td>
                      <td>
                        <div style={{ fontSize: "0.875rem" }}>{purchase.email || purchase.paypalEmail || "N/A"}</div>
                        {purchase.userId
                          ? <span className="admin-badge admin-badge-green" style={{ marginTop: 2 }}>Registered</span>
                          : <span className="admin-badge admin-badge-slate" style={{ marginTop: 2 }}>Guest</span>}
                      </td>
                      <td><span style={{ fontSize: "0.75rem", fontFamily: "monospace", color: "var(--admin-text-muted)" }}>{purchase.ipAddress || "-"}</span></td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{formatCurrency(purchase.amount)}</div>
                        {purchase.refunded && (
                          <span className="admin-badge admin-badge-amber" style={{ marginTop: 2 }}>
                            Refunded {purchase.refundedAmount ? `$${Number(purchase.refundedAmount).toFixed(2)}` : ""}
                          </span>
                        )}
                      </td>
                      <td>
                        {purchase.discountCode
                          ? <span className="admin-badge admin-badge-green">{purchase.discountCode}</span>
                          : <span style={{ color: "var(--admin-text-muted)" }}>-</span>}
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 2 }}>
                          <button
                            className="admin-action-btn warning"
                            disabled={purchase.refunded || !purchase.stripePaymentIntentId}
                            title={purchase.refunded ? "Already refunded" : !purchase.stripePaymentIntentId ? "No payment record" : "Issue refund"}
                            onClick={() => { setRefundModal(purchase); setRefundAmount(purchase.amount?.toString() || ""); setRefundReason("requested_by_customer"); }}
                            style={{ opacity: (purchase.refunded || !purchase.stripePaymentIntentId) ? 0.4 : 1 }}
                          >
                            <CreditCard size={14} />
                          </button>
                          <button className="admin-action-btn primary" onClick={() => openEditPurchase(purchase)} title="Edit"><Pencil size={14} /></button>
                          <button className="admin-action-btn danger" onClick={() => deletePurchase(purchase.id)} title="Delete"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="admin-pagination" style={{ marginTop: 16 }}>
              <span>Showing {purchasesPage * pageSize + 1} – {Math.min((purchasesPage + 1) * pageSize, purchasesTotal)} of {purchasesTotal}</span>
              <div className="admin-pagination-btns">
                <IonButton fill="outline" size="small" color="medium" disabled={purchasesPage === 0} onClick={() => setPurchasesPage(p => p - 1)}><ChevronLeft size={16} /></IonButton>
                <IonButton fill="outline" size="small" color="medium" disabled={(purchasesPage + 1) * pageSize >= purchasesTotal} onClick={() => setPurchasesPage(p => p + 1)}><ChevronRight size={16} /></IonButton>
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
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-slate-500">
                        {mrrPeriod === "monthly" ? "Monthly" : "Annual"} Recurring Revenue
                      </p>
                      <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5">
                        <button
                          onClick={() => setMrrPeriod("monthly")}
                          className={`px-2 py-1 text-xs rounded-md transition-colors ${
                            mrrPeriod === "monthly" 
                              ? "bg-white text-purple-600 shadow-sm font-medium" 
                              : "text-slate-500 hover:text-slate-700"
                          }`}
                        >
                          Monthly
                        </button>
                        <button
                          onClick={() => setMrrPeriod("yearly")}
                          className={`px-2 py-1 text-xs rounded-md transition-colors ${
                            mrrPeriod === "yearly" 
                              ? "bg-white text-purple-600 shadow-sm font-medium" 
                              : "text-slate-500 hover:text-slate-700"
                          }`}
                        >
                          Yearly
                        </button>
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-slate-800">
                      {formatCurrency(
                        mrrPeriod === "monthly" 
                          ? (dashboardStats?.stats?.monthlySubscriptionRevenue || 0)
                          : (dashboardStats?.stats?.monthlySubscriptionRevenue || 0) * 12
                      )}
                    </p>
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

            {/* Admin Tools Section */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">Admin Tools</h2>
              <div className="flex flex-wrap gap-4">
                {/* Import Historical Subscriptions */}
                <div className="flex-1 min-w-[300px] p-4 border border-slate-200 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-slate-800">Import Historical Subscription Payments</h3>
                      <p className="text-sm text-slate-500 mt-1">
                        Fetch all paid subscription invoices from Stripe and add them to your revenue tracking.
                      </p>
                      {importResult && (
                        <div className={`mt-3 p-3 ${importResult.imported > 0 ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'} border rounded-lg text-sm`}>
                          <p className={`font-medium ${importResult.imported > 0 ? 'text-green-800' : 'text-yellow-800'}`}>Last Import Results:</p>
                          <ul className={`mt-1 ${importResult.imported > 0 ? 'text-green-700' : 'text-yellow-700'} space-y-1`}>
                            <li>• Processed: {importResult.totalProcessed} invoices</li>
                            <li>• Imported: {importResult.imported} new payments</li>
                            <li>• Skipped (non-subscription): {importResult.skipped || 0}</li>
                            <li>• Already existed: {importResult.alreadyExists}</li>
                            <li>• Errors: {importResult.errors || 0}</li>
                            <li>• Total imported revenue: ${importResult.totalImportedRevenue?.toFixed(2)}</li>
                          </ul>
                          {importResult.imported === 0 && importResult.skipped > 0 && (
                            <p className="mt-2 text-xs text-yellow-600">
                              Note: Skipped invoices are one-time purchases, not subscription payments.
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                    <IonButton onClick={importHistoricalSubscriptions} disabled={isImportingHistory} style={{ "--background": "#9333ea", "--color": "#fff", marginLeft: 16 }}>
                      {isImportingHistory
                        ? <><IonSpinner name="crescent" style={{ width: 16, height: 16, marginRight: 6 }} />Importing...</>
                        : <><Download size={16} style={{ marginRight: 6 }} />Import from Stripe</>}
                    </IonButton>
                  </div>
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
                  <div style={{ position: "relative", flex: 1, minWidth: 200, maxWidth: 300 }}>
                    <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--admin-text-muted)", pointerEvents: "none" }} />
                    <input
                      className="admin-input"
                      style={{ paddingLeft: 32 }}
                      placeholder="Search by name or email..."
                      value={usersSearchQuery}
                      onChange={(e) => setUsersSearchQuery(e.target.value)}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <CreditCard size={14} style={{ color: "var(--admin-text-muted)" }} />
                    <select className="admin-select" style={{ width: 165 }} value={usersSubscriptionFilter} onChange={(e) => { setUsersSubscriptionFilter(e.target.value); setUsersPage(0); }}>
                      <option value="all">All Subscriptions</option>
                      <option value="none">No Subscription</option>
                      <option value="starter">Starter</option>
                      <option value="professional">Professional</option>
                      <option value="business">Business</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar size={14} style={{ color: "var(--admin-text-muted)" }} />
                    <select className="admin-select" style={{ width: 150 }} value={usersDateFilter} onChange={(e) => { setUsersDateFilter(e.target.value); setUsersPage(0); }}>
                      <option value="all">All Time</option>
                      <option value="today">Joined Today</option>
                      <option value="week">This Week</option>
                      <option value="month">This Month</option>
                      <option value="quarter">This Quarter</option>
                      <option value="year">This Year</option>
                    </select>
                  </div>

                  {(usersSubscriptionFilter !== "all" || usersDateFilter !== "all" || usersSearchQuery) && (
                    <IonButton fill="clear" size="small" color="medium" onClick={() => { setUsersSubscriptionFilter("all"); setUsersDateFilter("all"); setUsersSearchQuery(""); setUsersPage(0); }}>
                      Clear Filters
                    </IonButton>
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
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>IP Address</th>
                        <th>Status</th>
                        <th>Subscription</th>
                        <th>Downloads</th>
                        <th>Joined</th>
                        <th style={{ width: 80 }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => {
                        const tier = user.subscription ? SUBSCRIPTION_TIERS[user.subscription.tier] : null;
                        const isUnlimited = user.subscription?.downloads_remaining === -1 || tier?.downloads === -1;
                        const downloadsTotal = user.subscription?.downloads_total || tier?.downloads || 0;
                        const downloadsRemaining = user.subscription?.downloads_remaining ?? 0;
                        const downloadsLimit = isUnlimited ? "∞" : downloadsTotal;
                        return (
                          <tr key={user.id} style={user.isBanned ? { background: "rgba(220,38,38,0.04)" } : {}}>
                            <td style={{ fontWeight: 600 }}>{user.name}</td>
                            <td style={{ fontSize: "0.875rem" }}>{user.email}</td>
                            <td><span style={{ fontSize: "0.75rem", fontFamily: "monospace", color: "var(--admin-text-muted)" }}>{user.ipAddress || "-"}</span></td>
                            <td>
                              {user.isBanned
                                ? <span className="admin-badge admin-badge-red">Banned</span>
                                : user.emailVerified === false
                                  ? <span className="admin-badge admin-badge-amber">Unverified</span>
                                  : <span className="admin-badge admin-badge-green">Active</span>}
                            </td>
                            <td>
                              {user.subscription ? (
                                <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                                  <span className={`admin-badge ${
                                    user.subscription.tier === "unlimited" || user.subscription.tier === "business" ? "admin-badge-purple" :
                                    user.subscription.tier === "pro" || user.subscription.tier === "professional" ? "admin-badge-blue" :
                                    "admin-badge-green"
                                  }`}>
                                    {tier?.name || user.subscription.tier.charAt(0).toUpperCase() + user.subscription.tier.slice(1)}
                                  </span>
                                  {user.subscription.status === "cancelling" && (
                                    <span className="admin-badge admin-badge-amber" style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                                      <Clock size={10} /> Cancelling
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span style={{ color: "var(--admin-text-muted)" }}>None</span>
                              )}
                            </td>
                            <td>
                              {user.subscription ? (
                                isUnlimited
                                  ? <span style={{ fontWeight: 600, color: "#8b5cf6" }}>Unlimited</span>
                                  : <span><span style={{ fontWeight: 600 }}>{downloadsRemaining}</span><span style={{ color: "var(--admin-text-muted)" }}> / {downloadsLimit}</span></span>
                              ) : (
                                <span style={{ color: "var(--admin-text-muted)" }}>-</span>
                              )}
                            </td>
                            <td style={{ fontSize: "0.8125rem" }}>{formatDate(user.createdAt)}</td>
                            <td>
                              <div style={{ position: "relative" }}>
                                <button
                                  className="admin-action-btn"
                                  onClick={() => setOpenUserMenuId(openUserMenuId === user.id ? null : user.id)}
                                >
                                  <MoreVertical size={16} />
                                </button>
                                {openUserMenuId === user.id && (
                                  <div className="user-action-menu">
                                    <button className="profile-menu-item" onClick={() => { openEditUserModal(user); setOpenUserMenuId(null); }}>
                                      <Pencil size={13} /> Edit User
                                    </button>
                                    <button className="profile-menu-item" style={{ color: "#3b82f6" }} onClick={() => { openSubscriptionModal(user); setOpenUserMenuId(null); }}>
                                      <CreditCard size={13} /> Change Subscription
                                    </button>
                                    {user.subscription && (
                                      <button className="profile-menu-item" style={{ color: "var(--ion-color-primary)" }} onClick={() => { openDownloadsModal(user); setOpenUserMenuId(null); }}>
                                        <Download size={13} /> Add Bonus Downloads
                                      </button>
                                    )}
                                    {user.emailVerified === false && (
                                      <button className="profile-menu-item" style={{ color: "#10b981" }} onClick={() => { confirmUserEmail(user.id); setOpenUserMenuId(null); }}>
                                        <MailCheck size={13} /> Confirm Email
                                      </button>
                                    )}
                                    <div className="profile-menu-divider" />
                                    <button className="profile-menu-item" style={{ color: user.isBanned ? "var(--ion-color-primary)" : "#f97316" }} onClick={() => { toggleBanUser(user.id, user.isBanned); setOpenUserMenuId(null); }}>
                                      <Ban size={13} /> {user.isBanned ? "Unban User" : "Ban User"}
                                    </button>
                                    {user.ipAddress && user.ipAddress !== "unknown" && (
                                      <button className="profile-menu-item danger" onClick={() => { banUserIP(user); setOpenUserMenuId(null); }}>
                                        <Shield size={13} /> Ban IP Address
                                      </button>
                                    )}
                                    <button className="profile-menu-item danger" onClick={() => { deleteUser(user.id); setOpenUserMenuId(null); }}>
                                      <UserX size={13} /> Delete User
                                    </button>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="admin-pagination" style={{ marginTop: 16 }}>
                  <span>Showing {usersPage * pageSize + 1} – {Math.min((usersPage + 1) * pageSize, usersTotal)} of {usersTotal}</span>
                  <div className="admin-pagination-btns">
                    <IonButton fill="outline" size="small" color="medium" disabled={usersPage === 0} onClick={() => setUsersPage(p => p - 1)}><ChevronLeft size={16} /></IonButton>
                    <IonButton fill="outline" size="small" color="medium" disabled={(usersPage + 1) * pageSize >= usersTotal} onClick={() => setUsersPage(p => p + 1)}><ChevronRight size={16} /></IonButton>
                  </div>
                </div>
              </>
            )}
            </div>
          </div>
        )}

        {/* Saved Documents Tab */}
        {activeTab === "saved-docs" && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <FolderArchive className="w-5 h-5" />
                Saved Documents ({savedDocumentsTotal})
              </h2>
              <div className="flex flex-wrap gap-2">
                <select
                  className="admin-select"
                  value={savedDocumentsTypeFilter}
                  onChange={(e) => { setSavedDocumentsTypeFilter(e.target.value); setSavedDocumentsPage(0); }}
                >
                  <option value="all">All Types</option>
                  {Object.entries(DOCUMENT_TYPES).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
                <input
                  className="admin-input"
                  placeholder="Filter by User ID..."
                  value={savedDocumentsUserFilter}
                  onChange={(e) => { setSavedDocumentsUserFilter(e.target.value); setSavedDocumentsPage(0); }}
                  style={{ width: 200 }}
                />
                <IonButton fill="outline" size="small" color="medium" onClick={loadSavedDocuments}>
                  <RefreshCw size={16} />
                </IonButton>
              </div>
            </div>

            {isSavedDocumentsLoading ? (
              <div className="flex justify-center py-12">
                <IonSpinner name="crescent" color="primary" style={{ width: 32, height: 32 }} />
              </div>
            ) : savedDocuments.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <FolderArchive className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No saved documents found</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>User</th>
                        <th>Document Type</th>
                        <th>File Name</th>
                        <th>Size</th>
                        <th>Created</th>
                        <th style={{ textAlign: "right" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {savedDocuments.map((doc) => (
                        <tr key={doc.id}>
                          <td>
                            <div>
                              <p className="font-medium text-slate-800">{doc.userEmail}</p>
                              {doc.userName && <p className="text-xs text-slate-500">{doc.userName}</p>}
                            </div>
                          </td>
                          <td>
                            <span className="admin-badge admin-badge-slate">
                              {DOCUMENT_TYPES[doc.documentType] || doc.documentType}
                            </span>
                          </td>
                          <td>
                            {doc.fileExists === false ? (
                              <span style={{ color: "#ef4444", fontSize: "0.875rem", display: "flex", alignItems: "center", gap: 4 }} title="File missing from server">
                                <X size={12} style={{ flexShrink: 0 }} />
                                {doc.fileName}
                                <span style={{ fontSize: "0.75rem", color: "#f87171" }}>(missing)</span>
                              </span>
                            ) : (
                              <button
                                onClick={async () => {
                                  const token = localStorage.getItem("adminToken");
                                  const downloadUrl = `${BACKEND_URL}/api/admin/saved-documents/${doc.id}/download`;
                                  try {
                                    const response = await fetch(downloadUrl, {
                                      headers: { "Authorization": `Bearer ${token}` }
                                    });
                                    if (!response.ok) {
                                      const errorData = await response.json().catch(() => ({}));
                                      throw new Error(errorData.detail || `HTTP ${response.status}`);
                                    }
                                    const blob = await response.blob();
                                    const url = window.URL.createObjectURL(blob);
                                    window.open(url, '_blank');
                                  } catch (err) {
                                    console.error("Error viewing document:", err);
                                    toast.error(`Failed to open document: ${err.message}`);
                                  }
                                }}
                                style={{ color: "#3b82f6", fontSize: "0.875rem", display: "flex", alignItems: "center", gap: 4, cursor: "pointer", background: "none", border: "none", padding: 0 }}
                                title="Click to view PDF"
                              >
                                <Eye size={12} style={{ flexShrink: 0 }} />
                                {doc.fileName}
                              </button>
                            )}
                          </td>
                          <td>
                            <span className="text-sm text-slate-500">
                              {doc.fileSize ? `${(doc.fileSize / 1024).toFixed(1)} KB` : '-'}
                            </span>
                          </td>
                          <td>
                            <span className="text-sm text-slate-500">
                              {new Date(doc.createdAt).toLocaleDateString()}
                            </span>
                          </td>
                          <td style={{ textAlign: "right" }}>
                            <button className="admin-action-btn danger" onClick={() => deleteSavedDocument(doc.id)}>
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="admin-pagination" style={{ marginTop: 16 }}>
                  <span>Showing {savedDocumentsPage * pageSize + 1} – {Math.min((savedDocumentsPage + 1) * pageSize, savedDocumentsTotal)} of {savedDocumentsTotal}</span>
                  <div className="admin-pagination-btns">
                    <IonButton fill="outline" size="small" color="medium" disabled={savedDocumentsPage === 0} onClick={() => setSavedDocumentsPage(p => p - 1)}><ChevronLeft size={16} /></IonButton>
                    <IonButton fill="outline" size="small" color="medium" disabled={(savedDocumentsPage + 1) * pageSize >= savedDocumentsTotal} onClick={() => setSavedDocumentsPage(p => p + 1)}><ChevronRight size={16} /></IonButton>
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
              <IonButton color="primary" onClick={() => navigate("/admin/discounts")}>
                <Tag size={16} style={{ marginRight: 6 }} />
                Manage Discount Codes
              </IonButton>
            </div>
            <p className="text-slate-600">
              Click the button above to manage discount codes using the existing discount management interface.
            </p>
          </div>
        )}
      </div>

      {/* Subscription Change Modal */}
      <IonModal isOpen={subscriptionModalOpen} onDidDismiss={() => setSubscriptionModalOpen(false)} style={{ "--width": "540px", "--max-width": "95vw", "--height": "auto" }}>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Change User Subscription</IonTitle>
            <IonButtons slot="end">
              <IonButton fill="clear" color="medium" onClick={() => setSubscriptionModalOpen(false)}><X size={20} /></IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonModalContent className="ion-padding">
          <p style={{ color: "#64748b", fontSize: "0.875rem", marginBottom: 16 }}>
            Update subscription plan for {selectedUser?.name} ({selectedUser?.email})
          </p>
          <div style={{ marginBottom: 12, fontSize: "0.875rem", color: "#475569" }}>
            Current plan: <strong>{selectedUser?.subscription?.tier ? (SUBSCRIPTION_TIERS[selectedUser.subscription.tier]?.name || selectedUser.subscription.tier) : "None"}</strong>
            {selectedUser?.subscription?.downloads_remaining !== undefined && (
              <span style={{ marginLeft: 8, color: "#64748b" }}>
                ({selectedUser.subscription.downloads_remaining === -1 ? "Unlimited" : `${selectedUser.subscription.downloads_remaining} downloads remaining`})
              </span>
            )}
          </div>
          <div className="admin-form-group">
            <select className="admin-select" value={selectedTier} onChange={(e) => setSelectedTier(e.target.value)}>
              <option value="">Select a plan</option>
              <option value="none">No Subscription</option>
              {Object.entries(ADMIN_ASSIGNABLE_TIERS).map(([key, tier]) => (
                <option key={key} value={key}>
                  {tier.name} - ${tier.price}/mo ({tier.downloads === -1 ? "Unlimited" : tier.downloads} downloads)
                </option>
              ))}
            </select>
          </div>
          {selectedTier && selectedTier !== "none" && (
            <div style={{ padding: 12, background: "rgba(59,130,246,0.08)", borderRadius: 8, fontSize: "0.875rem", color: "#3b82f6", marginTop: 12 }}>
              <p><strong>{ADMIN_ASSIGNABLE_TIERS[selectedTier]?.name || SUBSCRIPTION_TIERS[selectedTier]?.name}</strong></p>
              <p>${ADMIN_ASSIGNABLE_TIERS[selectedTier]?.price || SUBSCRIPTION_TIERS[selectedTier]?.price}/month</p>
              <p>{(ADMIN_ASSIGNABLE_TIERS[selectedTier]?.downloads ?? SUBSCRIPTION_TIERS[selectedTier]?.downloads) === -1 ? "Unlimited" : (ADMIN_ASSIGNABLE_TIERS[selectedTier]?.downloads || SUBSCRIPTION_TIERS[selectedTier]?.downloads)} downloads per month</p>
            </div>
          )}
          {selectedTier === "none" && (
            <div style={{ padding: 12, background: "rgba(249,115,22,0.08)", borderRadius: 8, fontSize: "0.875rem", color: "#f97316", marginTop: 12 }}>
              <p><strong>Remove Subscription</strong></p>
              <p>User will no longer have access to subscription features</p>
            </div>
          )}
        </IonModalContent>
        <IonFooter>
          <IonToolbar style={{ padding: "8px 16px" }}>
            <IonButtons slot="end">
              <IonButton fill="outline" color="medium" onClick={() => setSubscriptionModalOpen(false)}>Cancel</IonButton>
              <IonButton color="primary" onClick={updateUserSubscription}>Update Subscription</IonButton>
            </IonButtons>
          </IonToolbar>
        </IonFooter>
      </IonModal>

      {/* Add Bonus Downloads Modal */}
      <IonModal isOpen={downloadsModalOpen} onDidDismiss={() => setDownloadsModalOpen(false)} style={{ "--width": "540px", "--max-width": "95vw", "--height": "auto" }}>
        <IonHeader>
          <IonToolbar>
            <IonTitle style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Download size={18} style={{ color: "#16a34a" }} /> Add Bonus Downloads
            </IonTitle>
            <IonButtons slot="end">
              <IonButton fill="clear" color="medium" onClick={() => setDownloadsModalOpen(false)}><X size={20} /></IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonModalContent className="ion-padding">
          <p style={{ color: "#64748b", fontSize: "0.875rem", marginBottom: 16 }}>
            Add extra downloads for {selectedUser?.name} ({selectedUser?.email})
          </p>
          <div style={{ padding: 12, background: "rgba(241,245,249,0.6)", borderRadius: 8, fontSize: "0.875rem", marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ color: "#64748b" }}>Current Plan:</span>
              <strong>{selectedUser?.subscription?.tier ? (SUBSCRIPTION_TIERS[selectedUser.subscription.tier]?.name || selectedUser.subscription.tier) : "None"}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#64748b" }}>Downloads Remaining:</span>
              <strong>
                {selectedUser?.subscription?.downloads_remaining === -1
                  ? "∞ Unlimited"
                  : selectedUser?.subscription?.downloads_remaining || 0}
              </strong>
            </div>
          </div>
          {selectedUser?.subscription?.downloads_remaining === -1 ? (
            <div style={{ padding: 12, background: "rgba(59,130,246,0.08)", borderRadius: 8, fontSize: "0.875rem", color: "#3b82f6" }}>
              <p>This user already has unlimited downloads.</p>
            </div>
          ) : (
            <>
              <div className="admin-form-group">
                <label className="admin-form-label">Bonus Downloads to Add</label>
                <input
                  className="admin-input"
                  type="number"
                  min="1"
                  value={editDownloadsCount}
                  onChange={(e) => setEditDownloadsCount(e.target.value)}
                  placeholder="Enter number of downloads to add"
                />
                <p style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: 4 }}>
                  These bonus downloads will be added to the current count and reset on the next billing cycle.
                </p>
              </div>
              {editDownloadsCount && parseInt(editDownloadsCount) > 0 && (
                <div style={{ padding: 12, background: "rgba(22,163,74,0.08)", borderRadius: 8, fontSize: "0.875rem", color: "#16a34a", marginTop: 12 }}>
                  <p><strong>After adding:</strong> {(selectedUser?.subscription?.downloads_remaining || 0) + parseInt(editDownloadsCount)} downloads</p>
                </div>
              )}
            </>
          )}
        </IonModalContent>
        <IonFooter>
          <IonToolbar style={{ padding: "8px 16px" }}>
            <IonButtons slot="end">
              <IonButton fill="outline" color="medium" onClick={() => setDownloadsModalOpen(false)}>Cancel</IonButton>
              <IonButton color="primary" onClick={updateUserDownloads} disabled={selectedUser?.subscription?.downloads_remaining === -1 || !editDownloadsCount || parseInt(editDownloadsCount) < 1}>
                Add Downloads
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonFooter>
      </IonModal>

      {/* Edit User Modal */}
      <IonModal isOpen={editUserModalOpen} onDidDismiss={() => setEditUserModalOpen(false)} style={{ "--width": "540px", "--max-width": "95vw", "--height": "auto" }}>
        <IonHeader>
          <IonToolbar>
            <IonTitle style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Pencil size={16} /> Edit User
            </IonTitle>
            <IonButtons slot="end">
              <IonButton fill="clear" color="medium" onClick={() => setEditUserModalOpen(false)}><X size={20} /></IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonModalContent className="ion-padding">
          <p style={{ color: "#64748b", fontSize: "0.875rem", marginBottom: 16 }}>
            Update user information for {selectedUser?.email}
          </p>
          <div className="admin-form-group">
            <label className="admin-form-label">Name</label>
            <input
              className="admin-input"
              type="text"
              value={editUserData.name}
              onChange={(e) => setEditUserData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter user's name"
            />
          </div>
          <div className="admin-form-group">
            <label className="admin-form-label">Email</label>
            <input
              className="admin-input"
              type="email"
              value={editUserData.email}
              onChange={(e) => setEditUserData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="Enter user's email"
            />
          </div>
          <div className="admin-form-group">
            <label className="admin-form-label">IP Address</label>
            <input
              className="admin-input"
              type="text"
              value={editUserData.ipAddress}
              onChange={(e) => setEditUserData(prev => ({ ...prev, ipAddress: e.target.value }))}
              placeholder="e.g., 192.168.1.1"
              style={{ fontFamily: "monospace" }}
            />
            <p style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: 4 }}>The IP address associated with this user</p>
          </div>
          <div style={{ padding: 12, background: "rgba(241,245,249,0.6)", borderRadius: 8, fontSize: "0.875rem", marginTop: 4 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ color: "#64748b" }}>User ID:</span>
              <span style={{ fontFamily: "monospace", fontSize: "0.75rem" }}>{selectedUser?.id}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ color: "#64748b" }}>Joined:</span>
              <span>{selectedUser?.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString() : "N/A"}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#64748b" }}>Status:</span>
              <span style={{ color: selectedUser?.isBanned ? "#ef4444" : "#16a34a" }}>
                {selectedUser?.isBanned ? "Banned" : "Active"}
              </span>
            </div>
          </div>
        </IonModalContent>
        <IonFooter>
          <IonToolbar style={{ padding: "8px 16px" }}>
            <IonButtons slot="end">
              <IonButton fill="outline" color="medium" onClick={() => setEditUserModalOpen(false)}>Cancel</IonButton>
              <IonButton color="primary" onClick={updateUser} disabled={isUpdatingUser || !editUserData.name.trim() || !editUserData.email.trim()}>
                {isUpdatingUser ? <><IonSpinner name="crescent" style={{ width: 16, height: 16, marginRight: 6 }} />Saving...</> : "Save Changes"}
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonFooter>
      </IonModal>

      {/* Change Password Modal */}
      <IonModal isOpen={passwordModalOpen} onDidDismiss={() => { setPasswordModalOpen(false); setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); }} style={{ "--width": "540px", "--max-width": "95vw", "--height": "auto" }}>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Change Admin Password</IonTitle>
            <IonButtons slot="end">
              <IonButton fill="clear" color="medium" onClick={() => { setPasswordModalOpen(false); setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); }}><X size={20} /></IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonModalContent className="ion-padding">
          <p style={{ color: "#64748b", fontSize: "0.875rem", marginBottom: 16 }}>
            Enter your current password and choose a new secure password.
          </p>
          <div className="admin-form-group">
            <label className="admin-form-label">Current Password</label>
            <input className="admin-input" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Enter current password" />
          </div>
          <div className="admin-form-group">
            <label className="admin-form-label">New Password</label>
            <input className="admin-input" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Enter new password (min 8 characters)" />
          </div>
          <div className="admin-form-group">
            <label className="admin-form-label">Confirm New Password</label>
            <input className="admin-input" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm new password" />
          </div>
          {newPassword && confirmPassword && newPassword !== confirmPassword && (
            <p style={{ fontSize: "0.875rem", color: "#ef4444", marginTop: 4 }}>Passwords don't match</p>
          )}
        </IonModalContent>
        <IonFooter>
          <IonToolbar style={{ padding: "8px 16px" }}>
            <IonButtons slot="end">
              <IonButton fill="outline" color="medium" onClick={() => { setPasswordModalOpen(false); setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); }}>Cancel</IonButton>
              <IonButton color="primary" onClick={changePassword} disabled={isChangingPassword || !currentPassword || !newPassword || newPassword !== confirmPassword}>
                {isChangingPassword ? <><IonSpinner name="crescent" style={{ width: 16, height: 16, marginRight: 6 }} />Changing...</> : "Change Password"}
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonFooter>
      </IonModal>

      {/* Add/Edit Purchase Modal */}
      <IonModal isOpen={addPurchaseModalOpen} onDidDismiss={closeModal} style={{ "--width": "560px", "--max-width": "95vw", "--height": "auto", "--max-height": "90vh" }}>
        <IonHeader>
          <IonToolbar>
            <IonTitle>{editingPurchase ? "Edit Purchase" : "Add Manual Purchase"}</IonTitle>
            <IonButtons slot="end">
              <IonButton fill="clear" color="medium" onClick={closeModal}><X size={20} /></IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonModalContent className="ion-padding" style={{ overflowY: "auto" }}>
          <p style={{ color: "#64748b", fontSize: "0.875rem", marginBottom: 16 }}>
            {editingPurchase
              ? "Update the purchase record details below."
              : "Add a historical purchase record. This is useful for tracking purchases made before the system was implemented."}
          </p>
          <div className="admin-form-group">
            <label className="admin-form-label">Document Type *</label>
            <select
              className="admin-select"
              value={newPurchase.documentType}
              onChange={(e) => setNewPurchase(prev => ({ ...prev, documentType: e.target.value }))}
            >
              {Object.entries(DOCUMENT_TYPES).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
          <div className="admin-form-group">
            <label className="admin-form-label">Amount ($) *</label>
            <input className="admin-input" type="number" step="0.01" placeholder="9.99" value={newPurchase.amount} onChange={(e) => setNewPurchase(prev => ({ ...prev, amount: e.target.value }))} />
          </div>
          <div className="admin-form-group">
            <label className="admin-form-label">Customer Email *</label>
            <input className="admin-input" type="email" placeholder="customer@example.com" value={newPurchase.paypalEmail} onChange={(e) => setNewPurchase(prev => ({ ...prev, paypalEmail: e.target.value }))} />
          </div>
          <div className="admin-form-group">
            <label className="admin-form-label">Purchase Date</label>
            <input className="admin-input" type="date" value={newPurchase.purchaseDate} onChange={(e) => setNewPurchase(prev => ({ ...prev, purchaseDate: e.target.value }))} />
          </div>
          <div className="admin-form-group">
            <label className="admin-form-label">Template (Optional)</label>
            <input className="admin-input" placeholder="e.g., modern, classic, template-1" value={newPurchase.template} onChange={(e) => setNewPurchase(prev => ({ ...prev, template: e.target.value }))} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="admin-form-group">
              <label className="admin-form-label">Discount Code</label>
              <input className="admin-input" placeholder="CODE123" value={newPurchase.discountCode} onChange={(e) => setNewPurchase(prev => ({ ...prev, discountCode: e.target.value }))} />
            </div>
            <div className="admin-form-group">
              <label className="admin-form-label">Discount Amount ($)</label>
              <input className="admin-input" type="number" step="0.01" placeholder="0.00" value={newPurchase.discountAmount} onChange={(e) => setNewPurchase(prev => ({ ...prev, discountAmount: e.target.value }))} />
            </div>
          </div>
          <div className="admin-form-group">
            <label className="admin-form-label">Notes (Optional)</label>
            <input className="admin-input" placeholder="Any additional notes about this purchase" value={newPurchase.notes} onChange={(e) => setNewPurchase(prev => ({ ...prev, notes: e.target.value }))} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="admin-form-group">
              <label className="admin-form-label">Quantity</label>
              <input className="admin-input" type="number" min="1" placeholder="1" value={newPurchase.quantity} onChange={(e) => setNewPurchase(prev => ({ ...prev, quantity: e.target.value }))} />
              <p style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: 4 }}>Number of documents (e.g., paystubs)</p>
            </div>
            <div className="admin-form-group">
              <label className="admin-form-label">IP Address</label>
              <input className="admin-input" placeholder="192.168.1.1" value={newPurchase.ipAddress} onChange={(e) => setNewPurchase(prev => ({ ...prev, ipAddress: e.target.value }))} />
              <p style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: 4 }}>Customer's IP address</p>
            </div>
          </div>
        </IonModalContent>
        <IonFooter>
          <IonToolbar style={{ padding: "8px 16px" }}>
            <IonButtons slot="end">
              <IonButton fill="outline" color="medium" onClick={closeModal}>Cancel</IonButton>
              <IonButton color="primary" onClick={editingPurchase ? updatePurchase : addManualPurchase} disabled={isAddingPurchase || !newPurchase.documentType || !newPurchase.amount || !newPurchase.paypalEmail}>
                {isAddingPurchase
                  ? <><IonSpinner name="crescent" style={{ width: 16, height: 16, marginRight: 6 }} />{editingPurchase ? "Updating..." : "Adding..."}</>
                  : editingPurchase ? "Update Purchase" : "Add Purchase"}
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonFooter>
      </IonModal>
      {/* Refund Modal */}
      <IonModal isOpen={!!refundModal} onDidDismiss={() => setRefundModal(null)} style={{ "--width": "480px", "--max-width": "95vw", "--height": "auto" }}>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Issue Refund</IonTitle>
            <IonButtons slot="end">
              <IonButton fill="clear" color="medium" onClick={() => setRefundModal(null)}><X size={20} /></IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonModalContent className="ion-padding">
          <p style={{ color: "#64748b", fontSize: "0.875rem", marginBottom: 16 }}>
            Issue a full or partial Stripe refund for this purchase.
          </p>
          {refundModal && (
            <>
              <div style={{ padding: 12, background: "rgba(241,245,249,0.6)", borderRadius: 8, fontSize: "0.875rem", marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}><span style={{ color: "#64748b" }}>Document</span><strong>{DOCUMENT_TYPES[refundModal.documentType] || refundModal.documentType}</strong></div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}><span style={{ color: "#64748b" }}>Customer</span><span>{refundModal.email || refundModal.paypalEmail || "N/A"}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#64748b" }}>Original Amount</span><strong>{formatCurrency(refundModal.amount)}</strong></div>
              </div>
              <div className="admin-form-group">
                <label className="admin-form-label">Refund Amount ($)</label>
                <input className="admin-input" type="number" min="0.01" max={refundModal.amount} step="0.01" value={refundAmount} onChange={(e) => setRefundAmount(e.target.value)} />
              </div>
              <div className="admin-form-group">
                <label className="admin-form-label">Reason</label>
                <select className="admin-select" value={refundReason} onChange={(e) => setRefundReason(e.target.value)}>
                  <option value="requested_by_customer">Customer Request</option>
                  <option value="duplicate">Duplicate</option>
                  <option value="fraudulent">Fraudulent</option>
                </select>
              </div>
            </>
          )}
        </IonModalContent>
        <IonFooter>
          <IonToolbar style={{ padding: "8px 16px" }}>
            <IonButtons slot="end">
              <IonButton fill="outline" color="medium" onClick={() => setRefundModal(null)} disabled={refundLoading}>Cancel</IonButton>
              <IonButton color="warning" onClick={handleRefund} disabled={refundLoading}>
                {refundLoading ? <><IonSpinner name="crescent" style={{ width: 16, height: 16, marginRight: 6 }} />Processing...</> : "Issue Refund"}
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonFooter>
      </IonModal>

    </AdminLayout>
  );
}

// Stat Card Component
function StatCard({ title, value, icon: Icon, color }) {
  const iconColors = {
    green: { bg: "rgba(22,163,74,0.12)", color: "#16a34a" },
    blue: { bg: "rgba(59,130,246,0.12)", color: "#3b82f6" },
    purple: { bg: "rgba(139,92,246,0.12)", color: "#8b5cf6" },
    orange: { bg: "rgba(249,115,22,0.12)", color: "#f97316" },
  };
  const c = iconColors[color] || iconColors.green;

  return (
    <div className="admin-stat-card">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <p className="admin-stat-label">{title}</p>
          <p className="admin-stat-value">{value}</p>
        </div>
        <div style={{ width: 48, height: 48, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", background: c.bg }}>
          <Icon size={24} style={{ color: c.color }} />
        </div>
      </div>
    </div>
  );
}

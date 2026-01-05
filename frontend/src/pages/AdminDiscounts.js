import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Plus,
  Trash2,
  Edit2,
  Tag,
  Loader2,
  Percent,
  Check,
  Megaphone,
  Sparkles,
  Eye,
  EyeOff,
  Palette
} from "lucide-react";
import AdminLayout from "@/components/AdminLayout";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";

// Available generators for restriction
const GENERATORS = [
  { id: "paystub", name: "Pay Stub Generator" },
  { id: "canadian-paystub", name: "Canadian Pay Stub Generator" },
  { id: "bank-statement", name: "Bank Statement Generator" },
  { id: "w2", name: "W-2 Generator" },
  { id: "w9", name: "W-9 Generator" },
  { id: "1099-nec", name: "1099-NEC Generator" },
  { id: "1099-misc", name: "1099-MISC Generator" },
  { id: "schedule-c", name: "Schedule C Generator" },
  { id: "offer-letter", name: "Offer Letter Generator" },
  { id: "vehicle-bill-of-sale", name: "Vehicle Bill of Sale" },
  { id: "utility-bill", name: "Utility Bill Generator" },
  { id: "ai-resume", name: "AI Resume Builder" },
];

export default function AdminDiscounts() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminToken, setAdminToken] = useState(null);
  const [adminInfo, setAdminInfo] = useState(null);
  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState(null);
  
  // Banner state
  const [bannerSettings, setBannerSettings] = useState({
    isActive: false,
    message: "",
    discountId: null,
    discountCode: "",
    discountPercent: 0,
    backgroundColor: "#10b981",
    textColor: "#ffffff"
  });
  const [savingBanner, setSavingBanner] = useState(false);
  
  // Preset banner colors
  const bannerColorPresets = [
    { name: "Green", bg: "#10b981", text: "#ffffff" },
    { name: "Blue", bg: "#3b82f6", text: "#ffffff" },
    { name: "Purple", bg: "#8b5cf6", text: "#ffffff" },
    { name: "Red", bg: "#ef4444", text: "#ffffff" },
    { name: "Orange", bg: "#f97316", text: "#ffffff" },
    { name: "Pink", bg: "#ec4899", text: "#ffffff" },
    { name: "Dark", bg: "#1f2937", text: "#ffffff" },
    { name: "Gold", bg: "#eab308", text: "#1f2937" }
  ];
  
  // Form state
  const [formData, setFormData] = useState({
    code: "",
    discountPercent: 10,
    startDate: new Date().toISOString().split("T")[0],
    expiryDate: "",
    usageType: "unlimited",
    usageLimit: 100,
    applicableTo: "all",
    specificGenerators: [],
    isActive: true
  });

  // Check for admin session on mount
  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    const info = localStorage.getItem("adminInfo");
    if (token) {
      if (info) setAdminInfo(JSON.parse(info));
      verifyAdminSession(token);
    } else {
      navigate("/admin/login");
    }
  }, [navigate]);

  const verifyAdminSession = async (token) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/admin/verify`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (response.ok) {
        setAdminToken(token);
        setIsAuthenticated(true);
        fetchDiscounts(token);
        fetchBannerSettings(token);
      } else {
        localStorage.removeItem("adminToken");
        navigate("/admin/login");
      }
    } catch (error) {
      localStorage.removeItem("adminToken");
      navigate("/admin/login");
    }
  };

  const resetForm = () => {
    setFormData({
      code: "",
      discountPercent: 10,
      startDate: new Date().toISOString().split("T")[0],
      expiryDate: "",
      usageType: "unlimited",
      usageLimit: 100,
      applicableTo: "all",
      specificGenerators: [],
      isActive: true
    });
    setEditingDiscount(null);
  };

  const fetchDiscounts = async (token) => {
    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/admin/discounts`, {
        headers: { "Authorization": `Bearer ${token || adminToken}` }
      });
      if (response.ok) {
        const data = await response.json();
        setDiscounts(data);
      } else {
        toast.error("Failed to fetch discount codes");
      }
    } catch (error) {
      toast.error("Error fetching discount codes");
    } finally {
      setLoading(false);
    }
  };

  const fetchBannerSettings = async (token) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/admin/banner`, {
        headers: { "Authorization": `Bearer ${token || adminToken}` }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.banner) {
          setBannerSettings(data.banner);
        }
      }
    } catch (error) {
      console.error("Error fetching banner settings:", error);
    }
  };

  const saveBannerSettings = async () => {
    setSavingBanner(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/admin/banner`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${adminToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(bannerSettings)
      });
      
      if (response.ok) {
        const data = await response.json();
        setBannerSettings(data.banner);
        toast.success(bannerSettings.isActive ? "Banner is now live!" : "Banner has been disabled");
      } else {
        toast.error("Failed to save banner settings");
      }
    } catch (error) {
      toast.error("Error saving banner settings");
    } finally {
      setSavingBanner(false);
    }
  };

  const handleBannerDiscountChange = (discountId) => {
    if (discountId === "none") {
      setBannerSettings(prev => ({
        ...prev,
        discountId: null,
        discountCode: "",
        discountPercent: 0
      }));
    } else {
      const discount = discounts.find(d => d.id === discountId);
      if (discount) {
        setBannerSettings(prev => ({
          ...prev,
          discountId: discount.id,
          discountCode: discount.code,
          discountPercent: discount.discountPercent
        }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.code || !formData.expiryDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const payload = {
        ...formData,
        startDate: new Date(formData.startDate).toISOString(),
        expiryDate: new Date(formData.expiryDate).toISOString(),
      };

      let response;
      if (editingDiscount) {
        response = await fetch(`${BACKEND_URL}/api/admin/discounts/${editingDiscount.id}`, {
          method: "PUT",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${adminToken}`
          },
          body: JSON.stringify(payload)
        });
      } else {
        response = await fetch(`${BACKEND_URL}/api/admin/discounts`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${adminToken}`
          },
          body: JSON.stringify(payload)
        });
      }

      if (response.ok) {
        toast.success(editingDiscount ? "Discount code updated!" : "Discount code created!");
        setIsDialogOpen(false);
        resetForm();
        fetchDiscounts();
      } else {
        const error = await response.json();
        toast.error(error.detail || "Failed to save discount code");
      }
    } catch (error) {
      toast.error("Error saving discount code");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this discount code?")) return;
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/admin/discounts/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${adminToken}` }
      });
      
      if (response.ok) {
        toast.success("Discount code deleted!");
        fetchDiscounts();
      } else {
        toast.error("Failed to delete discount code");
      }
    } catch (error) {
      toast.error("Error deleting discount code");
    }
  };

  const handleEdit = (discount) => {
    setEditingDiscount(discount);
    setFormData({
      code: discount.code,
      discountPercent: discount.discountPercent,
      startDate: discount.startDate?.split("T")[0] || "",
      expiryDate: discount.expiryDate?.split("T")[0] || "",
      usageType: discount.usageType || "unlimited",
      usageLimit: discount.usageLimit || 100,
      applicableTo: discount.applicableTo || "all",
      specificGenerators: discount.specificGenerators || [],
      isActive: discount.isActive !== false
    });
    setIsDialogOpen(true);
  };

  const toggleGenerator = (generatorId) => {
    setFormData(prev => ({
      ...prev,
      specificGenerators: prev.specificGenerators.includes(generatorId)
        ? prev.specificGenerators.filter(g => g !== generatorId)
        : [...prev.specificGenerators, generatorId]
    }));
  };

  const isExpired = (expiryDate) => new Date(expiryDate) < new Date();
  const isNotStarted = (startDate) => new Date(startDate) > new Date();

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  const handleLogout = async () => {
    try {
      await fetch(`${BACKEND_URL}/api/admin/logout`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${adminToken}` }
      });
    } catch (error) {
      console.error("Logout error:", error);
    }
    
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminInfo");
    navigate("/admin/login");
  };

  // Loading state
  if (loading && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-green-600" />
          <span className="text-lg text-slate-600">Loading...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <AdminLayout 
      adminInfo={adminInfo} 
      onRefresh={() => fetchDiscounts()}
    >
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Codes</p>
                <p className="text-2xl font-bold text-slate-800">{discounts.length}</p>
              </div>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-100 text-blue-600">
                <Tag className="w-6 h-6" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Active Codes</p>
                <p className="text-2xl font-bold text-slate-800">
                  {discounts.filter(d => d.isActive && !isExpired(d.expiryDate)).length}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-green-100 text-green-600">
                <Check className="w-6 h-6" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Usage</p>
                <p className="text-2xl font-bold text-slate-800">
                  {discounts.reduce((sum, d) => sum + (d.usageCount || 0), 0)}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-purple-100 text-purple-600">
                <Percent className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>

        {/* Promotional Banner Management */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                <Megaphone className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-800">Promotional Banner</h2>
                <p className="text-sm text-slate-500">Display a discount banner across your website</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600">Banner Active</span>
                <Switch
                  checked={bannerSettings.isActive}
                  onCheckedChange={(checked) => setBannerSettings(prev => ({ ...prev, isActive: checked }))}
                />
              </div>
              <Button 
                onClick={saveBannerSettings}
                disabled={savingBanner}
                className="bg-purple-600 hover:bg-purple-700 gap-2"
              >
                {savingBanner ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {bannerSettings.isActive ? "Update Banner" : "Save Settings"}
              </Button>
            </div>
          </div>

          {/* Banner Preview */}
          <div className="mb-6">
            <Label className="text-sm font-medium text-slate-700 mb-2 block">Preview</Label>
            <div
              className="relative py-3 px-4 rounded-lg text-center"
              style={{
                backgroundColor: bannerSettings.backgroundColor,
                color: bannerSettings.textColor
              }}
            >
              <div className="flex items-center justify-center gap-3 flex-wrap">
                <Sparkles className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {bannerSettings.message || "Your promotional message here..."}
                </span>
                {bannerSettings.discountCode && (
                  <span 
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold"
                    style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
                  >
                    <Tag className="w-3.5 h-3.5" />
                    {bannerSettings.discountCode}
                  </span>
                )}
                {bannerSettings.discountPercent > 0 && (
                  <span 
                    className="text-sm font-bold px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
                  >
                    {bannerSettings.discountPercent}% OFF
                  </span>
                )}
              </div>
              {!bannerSettings.isActive && (
                <div className="absolute inset-0 bg-slate-900/50 rounded-lg flex items-center justify-center">
                  <span className="flex items-center gap-2 text-white text-sm font-medium bg-slate-800 px-3 py-1 rounded-full">
                    <EyeOff className="w-4 h-4" />
                    Banner Disabled
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Banner Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Message */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">Banner Message</Label>
              <Input
                value={bannerSettings.message}
                onChange={(e) => setBannerSettings(prev => ({ ...prev, message: e.target.value }))}
                placeholder="e.g., Limited Time Offer! Use code for special discount"
                className="w-full"
              />
            </div>

            {/* Select Discount Code */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">Linked Discount Code</Label>
              <Select 
                value={bannerSettings.discountId || "none"} 
                onValueChange={handleBannerDiscountChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a discount code" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No discount code</SelectItem>
                  {discounts
                    .filter(d => d.isActive && !isExpired(d.expiryDate))
                    .map(discount => (
                      <SelectItem key={discount.id} value={discount.id}>
                        {discount.code} ({discount.discountPercent}% OFF)
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Color Presets */}
            <div className="space-y-2 md:col-span-2">
              <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <Palette className="w-4 h-4" />
                Banner Color
              </Label>
              <div className="flex flex-wrap gap-2">
                {bannerColorPresets.map(preset => (
                  <button
                    key={preset.name}
                    onClick={() => setBannerSettings(prev => ({ 
                      ...prev, 
                      backgroundColor: preset.bg, 
                      textColor: preset.text 
                    }))}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all hover:scale-105 ${
                      bannerSettings.backgroundColor === preset.bg 
                        ? "ring-2 ring-offset-2 ring-slate-400" 
                        : ""
                    }`}
                    style={{ backgroundColor: preset.bg, color: preset.text }}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
              
              {/* Custom Color Inputs */}
              <div className="flex gap-4 mt-3">
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-slate-500">Background:</Label>
                  <input
                    type="color"
                    value={bannerSettings.backgroundColor}
                    onChange={(e) => setBannerSettings(prev => ({ ...prev, backgroundColor: e.target.value }))}
                    className="w-8 h-8 rounded cursor-pointer"
                  />
                  <span className="text-xs font-mono text-slate-500">{bannerSettings.backgroundColor}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-slate-500">Text:</Label>
                  <input
                    type="color"
                    value={bannerSettings.textColor}
                    onChange={(e) => setBannerSettings(prev => ({ ...prev, textColor: e.target.value }))}
                    className="w-8 h-8 rounded cursor-pointer"
                  />
                  <span className="text-xs font-mono text-slate-500">{bannerSettings.textColor}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-slate-800">All Discount Codes</h2>
            <Button 
              onClick={() => { resetForm(); setIsDialogOpen(true); }}
              className="bg-green-600 hover:bg-green-700 gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Discount Code
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-green-600 mx-auto mb-3" />
              <p className="text-slate-500">Loading discount codes...</p>
            </div>
          ) : discounts.length === 0 ? (
            <div className="text-center py-12">
              <Tag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No discount codes yet</p>
              <p className="text-sm text-slate-400">Create your first discount code to get started</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Discount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Valid Period</TableHead>
                    <TableHead>Usage</TableHead>
                    <TableHead>Applies To</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {discounts.map((discount) => (
                    <TableRow key={discount.id} className={!discount.isActive || isExpired(discount.expiryDate) ? "opacity-60" : ""}>
                      <TableCell>
                        <span className="font-mono font-bold bg-slate-100 px-3 py-1 rounded">
                          {discount.code}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-green-600 font-semibold">{discount.discountPercent}% OFF</span>
                      </TableCell>
                      <TableCell>
                        {!discount.isActive ? (
                          <span className="px-2 py-1 bg-red-100 text-red-700 rounded-md text-sm">Inactive</span>
                        ) : isExpired(discount.expiryDate) ? (
                          <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-md text-sm">Expired</span>
                        ) : isNotStarted(discount.startDate) ? (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-sm">Scheduled</span>
                        ) : (
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded-md text-sm">Active</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDate(discount.startDate)} - {formatDate(discount.expiryDate)}
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{discount.usageCount || 0}</span>
                        {discount.usageType === "limited" && <span className="text-slate-400"> / {discount.usageLimit}</span>}
                        {discount.usageType === "unlimited" && <span className="text-slate-400"> (∞)</span>}
                      </TableCell>
                      <TableCell className="text-sm">
                        {discount.applicableTo === "all" ? (
                          <span className="text-slate-500">All Generators</span>
                        ) : (
                          <span className="text-slate-500">{discount.specificGenerators?.length || 0} generators</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(discount)}
                            className="text-slate-600 hover:text-slate-800"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(discount.id)}
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
          )}
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingDiscount ? "Edit Discount Code" : "Create Discount Code"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="code">Code *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="SAVE20"
                  className="font-mono"
                />
              </div>
              <div>
                <Label htmlFor="discountPercent">Discount %</Label>
                <Input
                  id="discountPercent"
                  type="number"
                  min="1"
                  max="100"
                  value={formData.discountPercent}
                  onChange={(e) => setFormData({ ...formData, discountPercent: parseInt(e.target.value) })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="expiryDate">Expiry Date *</Label>
                <Input
                  id="expiryDate"
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label>Usage Type</Label>
              <Select value={formData.usageType} onValueChange={(v) => setFormData({ ...formData, usageType: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unlimited">Unlimited</SelectItem>
                  <SelectItem value="limited">Limited Uses</SelectItem>
                  <SelectItem value="one_per_customer">One Per Customer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.usageType === "limited" && (
              <div>
                <Label htmlFor="usageLimit">Usage Limit</Label>
                <Input
                  id="usageLimit"
                  type="number"
                  min="1"
                  value={formData.usageLimit}
                  onChange={(e) => setFormData({ ...formData, usageLimit: parseInt(e.target.value) })}
                />
              </div>
            )}

            <div>
              <Label>Applies To</Label>
              <Select value={formData.applicableTo} onValueChange={(v) => setFormData({ ...formData, applicableTo: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Generators</SelectItem>
                  <SelectItem value="specific">Specific Generators</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.applicableTo === "specific" && (
              <div className="border rounded-lg p-3 max-h-40 overflow-y-auto">
                <Label className="mb-2 block">Select Generators</Label>
                <div className="space-y-2">
                  {GENERATORS.map((gen) => (
                    <div key={gen.id} className="flex items-center gap-2">
                      <Checkbox
                        id={gen.id}
                        checked={formData.specificGenerators.includes(gen.id)}
                        onCheckedChange={() => toggleGenerator(gen.id)}
                      />
                      <label htmlFor={gen.id} className="text-sm cursor-pointer">{gen.name}</label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Checkbox
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
              <label htmlFor="isActive" className="text-sm cursor-pointer">Active</label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-green-600 hover:bg-green-700">
                {editingDiscount ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

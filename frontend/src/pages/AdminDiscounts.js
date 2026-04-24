import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  IonModal, IonHeader, IonToolbar, IonTitle, IonContent as IonModalContent,
  IonFooter, IonButton, IonButtons, IonSpinner,
} from "@ionic/react";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  Edit2,
  Tag,
  Percent,
  Check,
  Megaphone,
  Sparkles,
  Eye,
  EyeOff,
  Palette,
  X,
} from "lucide-react";
import AdminLayout from "@/components/AdminLayout";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";

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
  { id: "people_search", name: "People Search (All Lookups)" },
  { id: "phone_lookup", name: "People Search – Reverse Phone" },
  { id: "name_lookup", name: "People Search – Name Lookup" },
  { id: "address_lookup", name: "People Search – Address Lookup" },
  { id: "carrier_lookup", name: "People Search – Carrier Lookup" },
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
    } catch (_) {
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
    } catch (_) {
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
        if (data.banner) setBannerSettings(data.banner);
      }
    } catch (_) {}
  };

  const saveBannerSettings = async () => {
    setSavingBanner(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/admin/banner`, {
        method: "PUT",
        headers: { "Authorization": `Bearer ${adminToken}`, "Content-Type": "application/json" },
        body: JSON.stringify(bannerSettings)
      });
      if (response.ok) {
        const data = await response.json();
        setBannerSettings(data.banner);
        toast.success(bannerSettings.isActive ? "Banner is now live!" : "Banner has been disabled");
      } else {
        toast.error("Failed to save banner settings");
      }
    } catch (_) {
      toast.error("Error saving banner settings");
    } finally {
      setSavingBanner(false);
    }
  };

  const handleBannerDiscountChange = (discountId) => {
    if (discountId === "") {
      setBannerSettings(prev => ({ ...prev, discountId: null, discountCode: "", discountPercent: 0 }));
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
      const endpoint = editingDiscount
        ? `${BACKEND_URL}/api/admin/discounts/${editingDiscount.id}`
        : `${BACKEND_URL}/api/admin/discounts`;
      const response = await fetch(endpoint, {
        method: editingDiscount ? "PUT" : "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${adminToken}` },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        toast.success(editingDiscount ? "Discount code updated!" : "Discount code created!");
        setIsDialogOpen(false);
        resetForm();
        fetchDiscounts();
      } else {
        const error = await response.json();
        toast.error(error.detail || "Failed to save discount code");
      }
    } catch (_) {
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
    } catch (_) {
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

  if (loading && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <IonSpinner name="crescent" color="primary" style={{ width: 32, height: 32 }} />
          <span className="text-lg text-slate-600">Loading...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <AdminLayout adminInfo={adminInfo} onRefresh={() => fetchDiscounts()}>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Total Codes</p>
              <p className="text-2xl font-bold text-slate-800">{discounts.length}</p>
            </div>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-100 text-blue-600">
              <Tag size={24} />
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
              <Check size={24} />
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
              <Percent size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Promotional Banner Management */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500 text-white">
              <Megaphone size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-800">Promotional Banner</h2>
              <p className="text-sm text-slate-500">Display a discount banner across your website</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
              <span className="text-sm text-slate-600">Banner Active</span>
              <input
                type="checkbox"
                checked={bannerSettings.isActive}
                onChange={(e) => setBannerSettings(prev => ({ ...prev, isActive: e.target.checked }))}
                style={{ width: 18, height: 18, cursor: "pointer" }}
              />
            </label>
            <IonButton
              onClick={saveBannerSettings}
              disabled={savingBanner}
              style={{ "--background": "#9333ea", "--background-activated": "#7e22ce" }}
            >
              {savingBanner
                ? <IonSpinner name="crescent" style={{ width: 14, height: 14, marginRight: 6 }} />
                : <Sparkles size={14} style={{ marginRight: 6 }} />}
              {bannerSettings.isActive ? "Update Banner" : "Save Settings"}
            </IonButton>
          </div>
        </div>

        {/* Banner Preview */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">Preview</label>
          <div
            className="relative py-3 px-4 rounded-lg text-center"
            style={{ backgroundColor: bannerSettings.backgroundColor, color: bannerSettings.textColor }}
          >
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Sparkles size={16} />
              <span className="text-sm font-medium">
                {bannerSettings.message || "Your promotional message here..."}
              </span>
              {bannerSettings.discountCode && (
                <span
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold"
                  style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
                >
                  <Tag size={14} />{bannerSettings.discountCode}
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
                  <EyeOff size={16} />Banner Disabled
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Banner Settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Banner Message</label>
            <input
              className="admin-input"
              value={bannerSettings.message}
              onChange={(e) => setBannerSettings(prev => ({ ...prev, message: e.target.value }))}
              placeholder="e.g., Limited Time Offer! Use code for special discount"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Linked Discount Code</label>
            <select
              className="admin-select"
              value={bannerSettings.discountId || ""}
              onChange={(e) => handleBannerDiscountChange(e.target.value)}
            >
              <option value="">No discount code</option>
              {discounts
                .filter(d => d.isActive && !isExpired(d.expiryDate))
                .map(discount => (
                  <option key={discount.id} value={discount.id}>
                    {discount.code} ({discount.discountPercent}% OFF)
                  </option>
                ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-2" style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Palette size={16} />Banner Color
            </label>
            <div className="flex flex-wrap gap-2">
              {bannerColorPresets.map(preset => (
                <button
                  key={preset.name}
                  onClick={() => setBannerSettings(prev => ({ ...prev, backgroundColor: preset.bg, textColor: preset.text }))}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all hover:scale-105 ${bannerSettings.backgroundColor === preset.bg ? "ring-2 ring-offset-2 ring-slate-400" : ""}`}
                  style={{ backgroundColor: preset.bg, color: preset.text }}
                >
                  {preset.name}
                </button>
              ))}
            </div>
            <div className="flex gap-4 mt-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Background:</span>
                <input
                  type="color"
                  value={bannerSettings.backgroundColor}
                  onChange={(e) => setBannerSettings(prev => ({ ...prev, backgroundColor: e.target.value }))}
                  className="w-8 h-8 rounded cursor-pointer"
                />
                <span className="text-xs font-mono text-slate-500">{bannerSettings.backgroundColor}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Text:</span>
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

      {/* Discount Codes Table */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-slate-800">All Discount Codes</h2>
          <IonButton color="primary" onClick={() => { resetForm(); setIsDialogOpen(true); }}>
            <Plus size={16} style={{ marginRight: 6 }} />Add Discount Code
          </IonButton>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "48px 0" }}>
            <IonSpinner name="crescent" color="primary" style={{ width: 32, height: 32 }} />
            <p className="text-slate-500 mt-3">Loading discount codes...</p>
          </div>
        ) : discounts.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 0" }}>
            <Tag size={48} style={{ color: "#cbd5e1", margin: "0 auto 12px" }} />
            <p className="text-slate-500">No discount codes yet</p>
            <p className="text-sm text-slate-400">Create your first discount code to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Discount</th>
                  <th>Status</th>
                  <th>Valid Period</th>
                  <th>Usage</th>
                  <th>Applies To</th>
                  <th style={{ width: 100 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {discounts.map((discount) => (
                  <tr key={discount.id} style={{ opacity: (!discount.isActive || isExpired(discount.expiryDate)) ? 0.6 : 1 }}>
                    <td>
                      <span style={{ fontFamily: "monospace", fontWeight: 700, background: "#f1f5f9", padding: "2px 10px", borderRadius: 4 }}>
                        {discount.code}
                      </span>
                    </td>
                    <td>
                      <span style={{ color: "#16a34a", fontWeight: 600 }}>{discount.discountPercent}% OFF</span>
                    </td>
                    <td>
                      {!discount.isActive ? (
                        <span className="admin-badge admin-badge-red">Inactive</span>
                      ) : isExpired(discount.expiryDate) ? (
                        <span className="admin-badge admin-badge-amber">Expired</span>
                      ) : isNotStarted(discount.startDate) ? (
                        <span className="admin-badge admin-badge-blue">Scheduled</span>
                      ) : (
                        <span className="admin-badge admin-badge-green">Active</span>
                      )}
                    </td>
                    <td style={{ fontSize: "0.875rem" }}>
                      {formatDate(discount.startDate)} – {formatDate(discount.expiryDate)}
                    </td>
                    <td>
                      <span style={{ fontWeight: 500 }}>{discount.usageCount || 0}</span>
                      {discount.usageType === "limited" && <span style={{ color: "#94a3b8" }}> / {discount.usageLimit}</span>}
                      {discount.usageType === "unlimited" && <span style={{ color: "#94a3b8" }}> (∞)</span>}
                    </td>
                    <td style={{ fontSize: "0.875rem", color: "#64748b" }}>
                      {discount.applicableTo === "all"
                        ? "All Generators"
                        : `${discount.specificGenerators?.length || 0} generators`}
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <button
                          onClick={() => handleEdit(discount)}
                          className="admin-action-btn"
                          title="Edit"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(discount.id)}
                          className="admin-action-btn danger"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <IonModal isOpen={isDialogOpen} onDidDismiss={() => { setIsDialogOpen(false); resetForm(); }} style={{ "--width": "520px", "--max-width": "95vw", "--height": "auto" }}>
        <IonHeader>
          <IonToolbar>
            <IonTitle>{editingDiscount ? "Edit Discount Code" : "Create Discount Code"}</IonTitle>
            <IonButtons slot="end">
              <IonButton fill="clear" color="medium" onClick={() => { setIsDialogOpen(false); resetForm(); }}><X size={20} /></IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonModalContent className="ion-padding" style={{ maxHeight: "70vh", overflowY: "auto" }}>
          <form id="discount-form" onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Code *</label>
                <input
                  className="admin-input"
                  style={{ fontFamily: "monospace" }}
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="SAVE20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Discount %</label>
                <input
                  className="admin-input"
                  type="number"
                  min="1"
                  max="100"
                  value={formData.discountPercent}
                  onChange={(e) => setFormData({ ...formData, discountPercent: parseInt(e.target.value) })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
                <input
                  className="admin-input"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Expiry Date *</label>
                <input
                  className="admin-input"
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">Usage Type</label>
              <select
                className="admin-select"
                value={formData.usageType}
                onChange={(e) => setFormData({ ...formData, usageType: e.target.value })}
              >
                <option value="unlimited">Unlimited</option>
                <option value="limited">Limited Uses</option>
                <option value="one_per_customer">One Per Customer</option>
              </select>
            </div>

            {formData.usageType === "limited" && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">Usage Limit</label>
                <input
                  className="admin-input"
                  type="number"
                  min="1"
                  value={formData.usageLimit}
                  onChange={(e) => setFormData({ ...formData, usageLimit: parseInt(e.target.value) })}
                />
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">Applies To</label>
              <select
                className="admin-select"
                value={formData.applicableTo}
                onChange={(e) => setFormData({ ...formData, applicableTo: e.target.value })}
              >
                <option value="all">All Generators</option>
                <option value="specific">Specific Generators</option>
              </select>
            </div>

            {formData.applicableTo === "specific" && (
              <div className="border rounded-lg p-3 max-h-40 overflow-y-auto mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">Select Generators</label>
                <div className="space-y-2">
                  {GENERATORS.map((gen) => (
                    <div key={gen.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={gen.id}
                        checked={formData.specificGenerators.includes(gen.id)}
                        onChange={() => toggleGenerator(gen.id)}
                        style={{ width: 16, height: 16, cursor: "pointer" }}
                      />
                      <label htmlFor={gen.id} className="text-sm cursor-pointer">{gen.name}</label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 mb-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                style={{ width: 16, height: 16, cursor: "pointer" }}
              />
              <label htmlFor="isActive" className="text-sm cursor-pointer">Active</label>
            </div>
          </form>
        </IonModalContent>
        <IonFooter>
          <IonToolbar style={{ padding: "8px 16px" }}>
            <IonButtons slot="end">
              <IonButton fill="outline" color="medium" onClick={() => { setIsDialogOpen(false); resetForm(); }}>Cancel</IonButton>
              <IonButton color="primary" onClick={handleSubmit}>
                {editingDiscount ? "Update" : "Create"}
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonFooter>
      </IonModal>
    </AdminLayout>
  );
}

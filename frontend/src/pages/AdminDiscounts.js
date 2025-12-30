import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Lock, Plus, Trash2, Edit2, Tag, Calendar, Percent, Check, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

const ADMIN_PASSWORD = "MintSlip2025!";
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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState(null);
  
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

  const fetchDiscounts = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/admin/discounts?password=${ADMIN_PASSWORD}`);
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

  useEffect(() => {
    if (isAuthenticated) {
      fetchDiscounts();
    }
  }, [isAuthenticated]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      toast.success("Welcome to Discount Management!");
    } else {
      toast.error("Incorrect password");
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
        response = await fetch(`${BACKEND_URL}/api/admin/discounts/${editingDiscount.id}?password=${ADMIN_PASSWORD}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      } else {
        response = await fetch(`${BACKEND_URL}/api/admin/discounts?password=${ADMIN_PASSWORD}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
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
      const response = await fetch(`${BACKEND_URL}/api/admin/discounts/${id}?password=${ADMIN_PASSWORD}`, {
        method: "DELETE"
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
      startDate: discount.startDate.split("T")[0],
      expiryDate: discount.expiryDate.split("T")[0],
      usageType: discount.usageType,
      usageLimit: discount.usageLimit || 100,
      applicableTo: discount.applicableTo,
      specificGenerators: discount.specificGenerators || [],
      isActive: discount.isActive
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

  // Login Form
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Lock className="w-6 h-6 text-green-600" />
              </div>
              <CardTitle>Admin Access Required</CardTitle>
              <CardDescription>Enter password to manage discount codes</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter admin password"
                  />
                </div>
                <Button type="submit" className="w-full bg-green-600 hover:bg-green-700">
                  Access Discount Management
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Discount Codes</h1>
            <p className="text-gray-600">Manage coupon codes and discounts</p>
          </div>
          <Button 
            onClick={() => { resetForm(); setIsDialogOpen(true); }}
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Discount Code
          </Button>
        </div>

        {/* Discount Codes List */}
        <div className="grid gap-4">
          {loading ? (
            <Card className="p-8 text-center text-gray-500">Loading...</Card>
          ) : discounts.length === 0 ? (
            <Card className="p-8 text-center text-gray-500">
              No discount codes yet. Create your first one!
            </Card>
          ) : (
            discounts.map((discount) => (
              <Card key={discount.id} className={`${!discount.isActive || isExpired(discount.expiryDate) ? 'opacity-60' : ''}`}>
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-xl font-bold font-mono bg-gray-100 px-3 py-1 rounded">
                          {discount.code}
                        </span>
                        <span className="text-green-600 font-semibold flex items-center">
                          <Percent className="w-4 h-4 mr-1" />
                          {discount.discountPercent}% OFF
                        </span>
                        {!discount.isActive && (
                          <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded">Inactive</span>
                        )}
                        {discount.isActive && isExpired(discount.expiryDate) && (
                          <span className="bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded">Expired</span>
                        )}
                        {discount.isActive && isNotStarted(discount.startDate) && (
                          <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded">Scheduled</span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                        <span className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {new Date(discount.startDate).toLocaleDateString()} - {new Date(discount.expiryDate).toLocaleDateString()}
                        </span>
                        <span>
                          Usage: {discount.usageCount || 0}
                          {discount.usageType === "limited" && ` / ${discount.usageLimit}`}
                          {discount.usageType === "unlimited" && " (unlimited)"}
                          {discount.usageType === "one_per_customer" && " (1 per customer)"}
                        </span>
                        <span>
                          Applies to: {discount.applicableTo === "all" ? "All Generators" : discount.specificGenerators?.join(", ")}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(discount)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700" onClick={() => handleDelete(discount.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Create/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Tag className="w-5 h-5" />
                {editingDiscount ? "Edit Discount Code" : "Create Discount Code"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="code">Coupon Code *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="SAVE20"
                  className="font-mono"
                />
              </div>

              <div>
                <Label htmlFor="discountPercent">Discount Percentage *</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="discountPercent"
                    type="number"
                    min="1"
                    max="100"
                    value={formData.discountPercent}
                    onChange={(e) => setFormData({ ...formData, discountPercent: parseFloat(e.target.value) })}
                  />
                  <span className="text-gray-500">%</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">Start Date *</Label>
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
                <Label>Usage Limit</Label>
                <Select value={formData.usageType} onValueChange={(v) => setFormData({ ...formData, usageType: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unlimited">Unlimited Uses</SelectItem>
                    <SelectItem value="limited">Limited Number of Uses</SelectItem>
                    <SelectItem value="one_per_customer">One Use Per Customer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.usageType === "limited" && (
                <div>
                  <Label htmlFor="usageLimit">Maximum Uses</Label>
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
                <Label>Applicable To</Label>
                <Select value={formData.applicableTo} onValueChange={(v) => setFormData({ ...formData, applicableTo: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Generators</SelectItem>
                    <SelectItem value="specific">Specific Generators Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.applicableTo === "specific" && (
                <div>
                  <Label className="mb-2 block">Select Generators</Label>
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded p-3">
                    {GENERATORS.map((gen) => (
                      <label key={gen.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded">
                        <Checkbox
                          checked={formData.specificGenerators.includes(gen.id)}
                          onCheckedChange={() => toggleGenerator(gen.id)}
                        />
                        {gen.name}
                      </label>
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
                <Label htmlFor="isActive" className="cursor-pointer">Active (code can be used)</Label>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-green-600 hover:bg-green-700">
                  {editingDiscount ? "Update" : "Create"} Code
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </main>
      <Footer />
    </div>
  );
}

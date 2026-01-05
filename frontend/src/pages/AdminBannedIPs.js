import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Shield,
  Plus,
  Trash2,
  Loader2,
  Globe,
  AlertTriangle,
  CheckCircle
} from "lucide-react";
import AdminLayout from "@/components/AdminLayout";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";

export default function AdminBannedIPs() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminToken, setAdminToken] = useState(null);
  const [adminInfo, setAdminInfo] = useState(null);
  const [bannedIps, setBannedIps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newIp, setNewIp] = useState("");
  const [newReason, setNewReason] = useState("");
  const [isAdding, setIsAdding] = useState(false);

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
        fetchBannedIps(token);
      } else {
        localStorage.removeItem("adminToken");
        navigate("/admin/login");
      }
    } catch (error) {
      localStorage.removeItem("adminToken");
      navigate("/admin/login");
    }
  };

  const fetchBannedIps = async (token) => {
    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/admin/banned-ips`, {
        headers: { "Authorization": `Bearer ${token || adminToken}` }
      });
      if (response.ok) {
        const data = await response.json();
        setBannedIps(data.bannedIps || []);
      } else {
        toast.error("Failed to fetch banned IPs");
      }
    } catch (error) {
      toast.error("Error fetching banned IPs");
    } finally {
      setLoading(false);
    }
  };

  const banIp = async () => {
    if (!newIp.trim()) {
      toast.error("Please enter an IP address");
      return;
    }
    
    // Basic IP validation
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(newIp.trim())) {
      toast.error("Please enter a valid IP address (e.g., 192.168.1.1)");
      return;
    }
    
    setIsAdding(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/admin/banned-ips`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${adminToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ip: newIp.trim(),
          reason: newReason.trim() || null
        })
      });
      
      if (response.ok) {
        toast.success(`IP ${newIp} has been banned`);
        setIsDialogOpen(false);
        setNewIp("");
        setNewReason("");
        fetchBannedIps();
      } else {
        const data = await response.json();
        toast.error(data.detail || "Failed to ban IP");
      }
    } catch (error) {
      toast.error("Error banning IP");
    } finally {
      setIsAdding(false);
    }
  };

  const unbanIp = async (ip) => {
    if (!window.confirm(`Are you sure you want to unban IP ${ip}?`)) return;
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/admin/banned-ips/${encodeURIComponent(ip)}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${adminToken}` }
      });
      
      if (response.ok) {
        toast.success(`IP ${ip} has been unbanned`);
        fetchBannedIps();
      } else {
        toast.error("Failed to unban IP");
      }
    } catch (error) {
      toast.error("Error unbanning IP");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString();
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

  const activeIps = bannedIps.filter(ip => ip.isActive);
  const inactiveIps = bannedIps.filter(ip => !ip.isActive);

  return (
    <AdminLayout 
      adminInfo={adminInfo} 
      onRefresh={() => fetchBannedIps()}
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Total Banned IPs</p>
              <p className="text-2xl font-bold text-slate-800">{activeIps.length}</p>
            </div>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-red-100 text-red-600">
              <Shield className="w-6 h-6" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Previously Unbanned</p>
              <p className="text-2xl font-bold text-slate-800">{inactiveIps.length}</p>
            </div>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-green-100 text-green-600">
              <CheckCircle className="w-6 h-6" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Total Records</p>
              <p className="text-2xl font-bold text-slate-800">{bannedIps.length}</p>
            </div>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-100 text-blue-600">
              <Globe className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Banned IPs Table */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-red-500 to-red-600 text-white">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-800">Banned IP Addresses</h2>
              <p className="text-sm text-slate-500">Manage IP addresses blocked from accessing the website</p>
            </div>
          </div>
          <Button 
            onClick={() => setIsDialogOpen(true)}
            className="gap-2 bg-red-600 hover:bg-red-700"
          >
            <Plus className="w-4 h-4" />
            Ban IP Address
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-green-600" />
          </div>
        ) : activeIps.length === 0 ? (
          <div className="text-center py-12">
            <Shield className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No IP addresses are currently banned</p>
            <p className="text-sm text-slate-400">Click "Ban IP Address" to add one</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Banned At</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeIps.map((banned) => (
                  <TableRow key={banned.id} className="bg-red-50/50">
                    <TableCell>
                      <span className="font-mono text-sm font-medium">{banned.ip}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-slate-600">{banned.reason || "-"}</span>
                    </TableCell>
                    <TableCell>
                      <span className="px-2 py-1 bg-red-100 text-red-700 rounded-md text-xs font-medium">
                        Active Ban
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-slate-500">
                      {formatDate(banned.bannedAt)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => unbanIp(banned.ip)}
                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Unban
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Previously Unbanned Section */}
        {inactiveIps.length > 0 && (
          <div className="mt-8 pt-6 border-t">
            <h3 className="text-md font-semibold text-slate-700 mb-4">Previously Unbanned IPs</h3>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Unbanned At</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inactiveIps.map((banned) => (
                    <TableRow key={banned.id}>
                      <TableCell>
                        <span className="font-mono text-sm">{banned.ip}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-slate-500">{banned.reason || "-"}</span>
                      </TableCell>
                      <TableCell className="text-sm text-slate-500">
                        {formatDate(banned.unbannedAt)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setNewIp(banned.ip);
                            setNewReason(banned.reason || "");
                            setIsDialogOpen(true);
                          }}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Shield className="w-4 h-4 mr-1" />
                          Re-ban
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>

      {/* Ban IP Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Ban IP Address
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-slate-700">IP Address *</label>
              <Input
                value={newIp}
                onChange={(e) => setNewIp(e.target.value)}
                placeholder="e.g., 192.168.1.1"
                className="mt-1 font-mono"
              />
              <p className="text-xs text-slate-500 mt-1">
                Enter the IPv4 address to ban
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Reason (optional)</label>
              <Input
                value={newReason}
                onChange={(e) => setNewReason(e.target.value)}
                placeholder="e.g., Spam, Abuse, Fraud"
                className="mt-1"
              />
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-sm text-amber-800">
                <strong>Warning:</strong> Banning an IP will prevent all users from that address from accessing the website. They will see a "You are banned" page.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsDialogOpen(false);
              setNewIp("");
              setNewReason("");
            }}>
              Cancel
            </Button>
            <Button 
              onClick={banIp} 
              disabled={isAdding}
              className="bg-red-600 hover:bg-red-700"
            >
              {isAdding ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Banning...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4 mr-2" />
                  Ban IP
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  IonModal, IonHeader, IonToolbar, IonTitle, IonContent as IonModalContent,
  IonFooter, IonButton, IonButtons, IonSpinner,
} from "@ionic/react";
import { toast } from "sonner";
import { Shield, Plus, Globe, AlertTriangle, CheckCircle, X } from "lucide-react";
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
          <IonButton color="danger" onClick={() => setIsDialogOpen(true)}>
            <Plus size={16} style={{ marginRight: 6 }} />Ban IP Address
          </IonButton>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <IonSpinner name="crescent" color="primary" style={{ width: 32, height: 32 }} />
          </div>
        ) : activeIps.length === 0 ? (
          <div className="text-center py-12">
            <Shield className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No IP addresses are currently banned</p>
            <p className="text-sm text-slate-400">Click "Ban IP Address" to add one</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>IP Address</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Banned At</th>
                  <th style={{ width: 100 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {activeIps.map((banned) => (
                  <tr key={banned.id} style={{ background: "rgba(239,68,68,0.04)" }}>
                    <td><span style={{ fontFamily: "monospace", fontWeight: 600 }}>{banned.ip}</span></td>
                    <td>{banned.reason || "-"}</td>
                    <td><span className="admin-badge admin-badge-red">Active Ban</span></td>
                    <td style={{ color: "var(--admin-text-muted)", fontSize: "0.875rem" }}>{formatDate(banned.bannedAt)}</td>
                    <td>
                      <IonButton fill="clear" size="small" color="primary" onClick={() => unbanIp(banned.ip)}>
                        <CheckCircle size={14} style={{ marginRight: 4 }} />Unban
                      </IonButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Previously Unbanned Section */}
        {inactiveIps.length > 0 && (
          <div className="mt-8 pt-6 border-t">
            <h3 className="text-md font-semibold text-slate-700 mb-4">Previously Unbanned IPs</h3>
            <div className="overflow-x-auto">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>IP Address</th>
                    <th>Reason</th>
                    <th>Unbanned At</th>
                    <th style={{ width: 100 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {inactiveIps.map((banned) => (
                    <tr key={banned.id}>
                      <td><span style={{ fontFamily: "monospace" }}>{banned.ip}</span></td>
                      <td style={{ color: "var(--admin-text-muted)" }}>{banned.reason || "-"}</td>
                      <td style={{ color: "var(--admin-text-muted)", fontSize: "0.875rem" }}>{formatDate(banned.unbannedAt)}</td>
                      <td>
                        <IonButton fill="clear" size="small" color="danger" onClick={() => { setNewIp(banned.ip); setNewReason(banned.reason || ""); setIsDialogOpen(true); }}>
                          <Shield size={14} style={{ marginRight: 4 }} />Re-ban
                        </IonButton>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Ban IP Modal */}
      <IonModal isOpen={isDialogOpen} onDidDismiss={() => { setIsDialogOpen(false); setNewIp(""); setNewReason(""); }} style={{ "--width": "480px", "--max-width": "95vw", "--height": "auto" }}>
        <IonHeader>
          <IonToolbar>
            <IonTitle style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <AlertTriangle size={16} style={{ color: "#ef4444" }} /> Ban IP Address
            </IonTitle>
            <IonButtons slot="end">
              <IonButton fill="clear" color="medium" onClick={() => { setIsDialogOpen(false); setNewIp(""); setNewReason(""); }}><X size={20} /></IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonModalContent className="ion-padding">
          <div className="admin-form-group">
            <label className="admin-form-label">IP Address *</label>
            <input className="admin-input" value={newIp} onChange={(e) => setNewIp(e.target.value)} placeholder="e.g., 192.168.1.1" style={{ fontFamily: "monospace" }} />
            <p style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: 4 }}>Enter the IPv4 address to ban</p>
          </div>
          <div className="admin-form-group">
            <label className="admin-form-label">Reason (optional)</label>
            <input className="admin-input" value={newReason} onChange={(e) => setNewReason(e.target.value)} placeholder="e.g., Spam, Abuse, Fraud" />
          </div>
          <div style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 8, padding: 12, fontSize: "0.875rem", color: "#92400e", marginTop: 4 }}>
            <strong>Warning:</strong> Banning an IP will prevent all users from that address from accessing the website. They will see a "You are banned" page.
          </div>
        </IonModalContent>
        <IonFooter>
          <IonToolbar style={{ padding: "8px 16px" }}>
            <IonButtons slot="end">
              <IonButton fill="outline" color="medium" onClick={() => { setIsDialogOpen(false); setNewIp(""); setNewReason(""); }}>Cancel</IonButton>
              <IonButton color="danger" onClick={banIp} disabled={isAdding}>
                {isAdding ? <><IonSpinner name="crescent" style={{ width: 16, height: 16, marginRight: 6 }} />Banning...</> : <><Shield size={14} style={{ marginRight: 6 }} />Ban IP</>}
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonFooter>
      </IonModal>
    </AdminLayout>
  );
}

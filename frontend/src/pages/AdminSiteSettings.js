import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Wrench, UserX, Save, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import AdminLayout from "@/components/AdminLayout";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";

function Msg({ msg }) {
  if (!msg) return null;
  return (
    <div className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm ${msg.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
      {msg.type === "success" ? <CheckCircle className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
      {msg.text}
    </div>
  );
}

function Toggle({ on, onClick, disabled, onColor = "bg-green-500", offColor = "bg-slate-300" }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none ${on ? onColor : offColor} ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${on ? "translate-x-6" : "translate-x-0"}`} />
    </button>
  );
}

export default function AdminSiteSettings() {
  const navigate = useNavigate();

  // Maintenance mode
  const [maintenance, setMaintenance] = useState({ isActive: false, message: "", estimatedTime: "" });
  const [maintenanceLoading, setMaintenanceLoading] = useState(false);
  const [maintenanceMsg, setMaintenanceMsg] = useState(null);

  // Auth settings
  const [authEnabled, setAuthEnabled] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [authMsg, setAuthMsg] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) { navigate("/admin/login"); return; }
    fetchMaintenance();
    fetchAuth();
  }, []);

  const fetchMaintenance = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`${BACKEND_URL}/api/admin/maintenance`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setMaintenance({
          isActive: data.maintenance?.isActive || false,
          message: data.maintenance?.message || "We're currently performing scheduled maintenance. We'll be back shortly!",
          estimatedTime: data.maintenance?.estimatedTime || ""
        });
      }
    } catch (e) {}
  };

  const fetchAuth = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`${BACKEND_URL}/api/admin/auth-settings`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setAuthEnabled(data.authEnabled !== false);
    } catch (e) {}
  };

  const saveMaintenance = async () => {
    setMaintenanceLoading(true);
    setMaintenanceMsg(null);
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`${BACKEND_URL}/api/admin/maintenance`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify(maintenance)
      });
      const data = await res.json();
      if (data.success) {
        setMaintenanceMsg({ type: "success", text: `Maintenance mode ${maintenance.isActive ? "enabled" : "disabled"} and settings saved.` });
        setTimeout(() => setMaintenanceMsg(null), 3000);
      } else {
        setMaintenanceMsg({ type: "error", text: "Failed to save maintenance settings." });
      }
    } catch (e) {
      setMaintenanceMsg({ type: "error", text: "An error occurred." });
    } finally {
      setMaintenanceLoading(false);
    }
  };

  const saveAuth = async () => {
    setAuthLoading(true);
    setAuthMsg(null);
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`${BACKEND_URL}/api/admin/auth-settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ isEnabled: authEnabled })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAuthMsg({ type: "success", text: `User signup/login ${authEnabled ? "enabled" : "disabled"}.` });
        setTimeout(() => setAuthMsg(null), 3000);
      } else {
        setAuthMsg({ type: "error", text: "Failed to save auth settings." });
      }
    } catch (e) {
      setAuthMsg({ type: "error", text: "An error occurred." });
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-slate-800">Site Settings</h1>
          <p className="text-sm text-slate-500 mt-1">Control site-wide features and availability.</p>
        </div>

        <div className="space-y-5">

          {/* Maintenance Mode */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${maintenance.isActive ? "bg-orange-100" : "bg-slate-100"}`}>
                  <Wrench className={`w-5 h-5 ${maintenance.isActive ? "text-orange-500" : "text-slate-400"}`} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">Maintenance Mode</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    When enabled, visitors see a maintenance page instead of the site. Admin routes remain accessible.
                  </p>
                </div>
              </div>
              <Toggle
                on={maintenance.isActive}
                onClick={() => setMaintenance(prev => ({ ...prev, isActive: !prev.isActive }))}
                onColor="bg-orange-500"
                offColor="bg-slate-300"
              />
            </div>

            <div className="space-y-3 pt-1 border-t border-slate-100">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Maintenance Message</label>
                <textarea
                  value={maintenance.message}
                  onChange={e => setMaintenance(prev => ({ ...prev, message: e.target.value }))}
                  rows={3}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                  placeholder="We're currently performing scheduled maintenance. We'll be back shortly!"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Estimated Time <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <input
                  value={maintenance.estimatedTime}
                  onChange={e => setMaintenance(prev => ({ ...prev, estimatedTime: e.target.value }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="e.g. Back in ~30 minutes"
                />
              </div>
            </div>

            <Msg msg={maintenanceMsg} />

            <button
              onClick={saveMaintenance}
              disabled={maintenanceLoading}
              className="flex items-center gap-2 px-5 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {maintenanceLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Maintenance Settings
            </button>
          </div>

          {/* User Auth */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${!authEnabled ? "bg-red-100" : "bg-slate-100"}`}>
                  <UserX className={`w-5 h-5 ${!authEnabled ? "text-red-500" : "text-slate-400"}`} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">User Signup / Login</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    When disabled, users cannot create accounts or sign in. Existing sessions remain active.
                  </p>
                </div>
              </div>
              <Toggle
                on={authEnabled}
                onClick={() => setAuthEnabled(v => !v)}
                onColor="bg-green-500"
                offColor="bg-red-400"
              />
            </div>

            <Msg msg={authMsg} />

            <button
              onClick={saveAuth}
              disabled={authLoading}
              className="flex items-center gap-2 px-5 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {authLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Auth Settings
            </button>
          </div>

        </div>
      </div>
    </AdminLayout>
  );
}

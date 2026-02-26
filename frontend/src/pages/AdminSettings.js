import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Camera, Save, Lock, User, Mail, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import AdminLayout from "@/components/AdminLayout";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";

export default function AdminSettings() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fileInputRef = useRef(null);

  const [tab, setTab] = useState(searchParams.get("tab") === "password" ? "password" : "profile");

  const [profile, setProfile] = useState({ name: "", email: "", photo: "" });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMsg, setProfileMsg] = useState(null);

  const [passwords, setPasswords] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMsg, setPwMsg] = useState(null);

  const [photoPreview, setPhotoPreview] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) { navigate("/admin/login"); return; }
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`${BACKEND_URL}/api/admin/profile`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setProfile({ name: data.profile.name || "", email: data.profile.email || "", photo: data.profile.photo || "" });
        if (data.profile.photo) setPhotoPreview(data.profile.photo);
      }
    } catch (e) {}
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setProfileMsg({ type: "error", text: "Photo must be under 2 MB." });
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPhotoPreview(ev.target.result);
      setProfile(prev => ({ ...prev, photo: ev.target.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async () => {
    if (!profile.email.trim()) {
      setProfileMsg({ type: "error", text: "Email is required." });
      return;
    }
    setProfileLoading(true);
    setProfileMsg(null);
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`${BACKEND_URL}/api/admin/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ name: profile.name, email: profile.email, photo: profile.photo || null })
      });
      const data = await res.json();
      if (data.success) {
        setProfileMsg({ type: "success", text: "Profile updated successfully." });
        // Update localStorage adminInfo email if changed
        const info = localStorage.getItem("adminInfo");
        if (info) {
          try {
            const parsed = JSON.parse(info);
            localStorage.setItem("adminInfo", JSON.stringify({ ...parsed, email: profile.email }));
          } catch (_) {}
        }
      } else {
        setProfileMsg({ type: "error", text: data.detail || "Failed to update profile." });
      }
    } catch (e) {
      setProfileMsg({ type: "error", text: "An error occurred." });
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwords.currentPassword || !passwords.newPassword || !passwords.confirmPassword) {
      setPwMsg({ type: "error", text: "All fields are required." });
      return;
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      setPwMsg({ type: "error", text: "New passwords do not match." });
      return;
    }
    if (passwords.newPassword.length < 8) {
      setPwMsg({ type: "error", text: "New password must be at least 8 characters." });
      return;
    }
    setPwLoading(true);
    setPwMsg(null);
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`${BACKEND_URL}/api/admin/change-password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ currentPassword: passwords.currentPassword, newPassword: passwords.newPassword })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPwMsg({ type: "success", text: "Password changed successfully." });
        setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        setPwMsg({ type: "error", text: data.detail || "Failed to change password." });
      }
    } catch (e) {
      setPwMsg({ type: "error", text: "An error occurred." });
    } finally {
      setPwLoading(false);
    }
  };

  const Msg = ({ msg }) => {
    if (!msg) return null;
    return (
      <div className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm ${msg.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
        {msg.type === "success" ? <CheckCircle className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
        {msg.text}
      </div>
    );
  };

  return (
    <AdminLayout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-slate-800">Account Settings</h1>
          <p className="text-sm text-slate-500 mt-1">Manage your admin profile and security settings.</p>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-white rounded-xl border border-slate-200 p-1 gap-1 mb-6 w-fit">
          {[
            { id: "profile", label: "Profile", icon: User },
            { id: "password", label: "Security", icon: Lock },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors ${tab === t.id ? "bg-green-600 text-white font-medium" : "text-slate-600 hover:bg-slate-50"}`}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
            </button>
          ))}
        </div>

        {/* Profile tab */}
        {tab === "profile" && (
          <div className="space-y-5">
            {/* Photo */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                <Camera className="w-4 h-4 text-slate-400" /> Profile Photo
              </h2>
              <div className="flex items-center gap-5">
                <div className="relative">
                  {photoPreview ? (
                    <img src={photoPreview} alt="avatar" className="w-20 h-20 rounded-full object-cover border-2 border-slate-200" />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-green-600 flex items-center justify-center text-white text-2xl font-bold border-2 border-slate-200">
                      {profile.name ? profile.name[0].toUpperCase() : profile.email ? profile.email[0].toUpperCase() : "A"}
                    </div>
                  )}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-1 -right-1 w-7 h-7 bg-white border border-slate-200 rounded-full flex items-center justify-center shadow-sm hover:bg-slate-50 transition-colors"
                  >
                    <Camera className="w-3.5 h-3.5 text-slate-500" />
                  </button>
                </div>
                <div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-slate-700"
                  >
                    Upload Photo
                  </button>
                  <p className="text-xs text-slate-400 mt-1.5">JPG, PNG or GIF · max 2 MB</p>
                  {photoPreview && profile.photo && (
                    <button
                      onClick={() => { setPhotoPreview(null); setProfile(prev => ({ ...prev, photo: "" })); }}
                      className="text-xs text-red-500 hover:text-red-600 mt-1 block"
                    >
                      Remove photo
                    </button>
                  )}
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
              </div>
            </div>

            {/* Info */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
              <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <User className="w-4 h-4 text-slate-400" /> Account Info
              </h2>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Display Name</label>
                <input
                  value={profile.name}
                  onChange={e => setProfile(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Alex"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> Email Address</span>
                </label>
                <input
                  value={profile.email}
                  onChange={e => setProfile(prev => ({ ...prev, email: e.target.value }))}
                  type="email"
                  placeholder="admin@mintslip.com"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <Msg msg={profileMsg} />
              <button
                onClick={handleSaveProfile}
                disabled={profileLoading}
                className="flex items-center gap-2 px-5 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                {profileLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Changes
              </button>
            </div>
          </div>
        )}

        {/* Security tab */}
        {tab === "password" && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
            <h2 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
              <Lock className="w-4 h-4 text-slate-400" /> Change Password
            </h2>
            {[
              { key: "currentPassword", label: "Current Password" },
              { key: "newPassword", label: "New Password" },
              { key: "confirmPassword", label: "Confirm New Password" },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
                <input
                  type="password"
                  value={passwords[key]}
                  onChange={e => setPasswords(prev => ({ ...prev, [key]: e.target.value }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  autoComplete="new-password"
                />
              </div>
            ))}
            <Msg msg={pwMsg} />
            <button
              onClick={handleChangePassword}
              disabled={pwLoading}
              className="flex items-center gap-2 px-5 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {pwLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
              Update Password
            </button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

import { useState, useEffect, Fragment } from "react";
import { IonSpinner, IonToggle } from "@ionic/react";
import {
  UserPlus, Edit2, Trash2, Shield, X, Eye, EyeOff, AlertCircle,
} from "lucide-react";
import AdminLayout from "@/components/AdminLayout";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";

const LEVEL_LABELS = { 1: "Level 1", 2: "Level 2", 3: "Level 3" };
const LEVEL_COLORS = {
  1: "bg-slate-100 text-slate-600",
  2: "bg-blue-100 text-blue-700",
  3: "bg-purple-100 text-purple-700",
};

const PERMISSION_GROUPS = [
  {
    label: "Purchases",
    perms: [{ key: "view_purchases", label: "View Purchases" }],
  },
  {
    label: "Users",
    perms: [
      { key: "view_users", label: "View Users" },
      { key: "edit_users", label: "Edit / Ban Users" },
    ],
  },
  {
    label: "Saved Docs",
    perms: [{ key: "view_saved_docs", label: "View Saved Documents" }],
  },
  {
    label: "Discounts",
    perms: [
      { key: "view_discounts", label: "View Discounts" },
      { key: "manage_discounts", label: "Manage Discounts" },
    ],
  },
  {
    label: "Banned IPs",
    perms: [
      { key: "view_banned_ips", label: "View Banned IPs" },
      { key: "manage_banned_ips", label: "Manage Banned IPs" },
    ],
  },
  {
    label: "Blog",
    perms: [
      { key: "view_blog", label: "View Blog Posts" },
      { key: "manage_blog", label: "Manage Blog Posts" },
    ],
  },
  {
    label: "Emails",
    perms: [
      { key: "view_email_templates", label: "View Email Templates" },
      { key: "manage_email_templates", label: "Manage Email Templates" },
      { key: "send_mass_email", label: "Send Mass Email" },
    ],
  },
  {
    label: "Site Settings",
    perms: [
      { key: "view_site_settings", label: "View Site Settings" },
      { key: "manage_site_settings", label: "Manage Site Settings" },
    ],
  },
];

function Toggle({ on, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors flex-shrink-0 ${on ? "bg-green-500" : "bg-slate-200"}`}
    >
      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${on ? "translate-x-4.5" : "translate-x-0.5"}`} />
    </button>
  );
}

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function AdminModerators() {
  const [moderators, setModerators] = useState([]);
  const [loadingMods, setLoadingMods] = useState(true);

  // Permissions state per level
  const [permissions, setPermissions] = useState({ 1: {}, 2: {}, 3: {} });
  const [loadingPerms, setLoadingPerms] = useState(true);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMod, setEditingMod] = useState(null);
  const [form, setForm] = useState({ name: "", email: "", password: "", level: "1", isActive: true });
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const token = () => localStorage.getItem("adminToken");

  useEffect(() => {
    fetchModerators();
    fetchPermissions();
  }, []);

  const fetchModerators = async () => {
    setLoadingMods(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/moderators`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      if (res.ok) {
        const data = await res.json();
        setModerators(data.moderators || []);
      }
    } catch (e) {}
    setLoadingMods(false);
  };

  const fetchPermissions = async () => {
    setLoadingPerms(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/moderator-permissions`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      if (res.ok) {
        const data = await res.json();
        setPermissions({
          1: data.permissions["1"] || {},
          2: data.permissions["2"] || {},
          3: data.permissions["3"] || {},
        });
      }
    } catch (e) {}
    setLoadingPerms(false);
  };

  const openCreate = () => {
    setEditingMod(null);
    setForm({ name: "", email: "", password: "", level: "1", isActive: true });
    setFormError("");
    setShowPassword(false);
    setModalOpen(true);
  };

  const openEdit = (mod) => {
    setEditingMod(mod);
    setForm({ name: mod.name, email: mod.email, password: "", level: String(mod.level), isActive: mod.isActive });
    setFormError("");
    setShowPassword(false);
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setSaving(true);
    try {
      const body = { name: form.name, email: form.email, level: Number(form.level), isActive: form.isActive };
      if (form.password) body.password = form.password;
      if (!editingMod) body.password = form.password; // required on create

      const url = editingMod
        ? `${BACKEND_URL}/api/admin/moderators/${editingMod.id}`
        : `${BACKEND_URL}/api/admin/moderators`;
      const method = editingMod ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token()}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.detail || "Failed to save moderator.");
      } else {
        setModalOpen(false);
        fetchModerators();
      }
    } catch (e) {
      setFormError("Network error.");
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await fetch(`${BACKEND_URL}/api/admin/moderators/${deleteTarget.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token()}` },
      });
      setDeleteTarget(null);
      fetchModerators();
    } catch (e) {}
    setDeleting(false);
  };

  // Matrix cell toggle — flips optimistically and saves that level immediately,
  // reverting on failure (like the whodat permissions matrix).
  const togglePerm = async (level, key, on) => {
    const prev = permissions;
    const nextLevel = { ...prev[level], [key]: on };
    setPermissions({ ...prev, [level]: nextLevel });
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/moderator-permissions/${level}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token()}`, "Content-Type": "application/json" },
        body: JSON.stringify({ permissions: nextLevel }),
      });
      if (!res.ok) throw new Error();
    } catch (e) {
      setPermissions(prev); // revert
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Moderators</h1>
            <p className="text-sm text-slate-500 mt-0.5">Manage moderator accounts and configure permissions per level.</p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Add Moderator
          </button>
        </div>

        {/* ── Moderators Table ── */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-2">
            <Shield className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-semibold text-slate-700">Moderator Accounts</span>
            <span className="ml-auto text-xs text-slate-400">{moderators.length} total</span>
          </div>

          {loadingMods ? (
            <div className="flex items-center justify-center py-12">
              <IonSpinner name="crescent" style={{ width: 20, height: 20, color: "#94a3b8" }} />
            </div>
          ) : moderators.length === 0 ? (
            <div className="py-12 text-center">
              <Shield className="w-10 h-10 text-slate-200 mx-auto mb-3" />
              <p className="text-sm text-slate-400">No moderators yet. Add one to get started.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {moderators.map((mod) => (
                <div key={mod.id} className="flex items-center gap-4 px-5 py-3.5">
                  <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-semibold text-sm flex-shrink-0">
                    {mod.name?.[0]?.toUpperCase() || "M"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{mod.name}</p>
                    <p className="text-xs text-slate-400 truncate">{mod.email}</p>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${LEVEL_COLORS[mod.level]}`}>
                    {LEVEL_LABELS[mod.level]}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${mod.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                    {mod.isActive ? "Active" : "Inactive"}
                  </span>
                  <span className="text-xs text-slate-400 hidden sm:block">{formatDate(mod.createdAt)}</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEdit(mod)}
                      className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-700"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(mod)}
                      className="p-1.5 rounded-lg hover:bg-red-50 transition-colors text-slate-400 hover:text-red-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Permission matrix (whodat permissions layout) ── */}
        <div>
          <div style={{ marginBottom: 12 }}>
            <p className="text-sm font-semibold text-slate-700">Permissions</p>
            <p className="text-xs text-slate-400 mt-0.5">Choose what each moderator level can do. Every toggle saves immediately and applies to all moderators of that level.</p>
          </div>

          {loadingPerms ? (
            <div className="flex items-center justify-center py-10">
              <IonSpinner name="crescent" style={{ width: 20, height: 20, color: "#94a3b8" }} />
            </div>
          ) : (
            <div className="perm-card">
              <table className="perm-table">
                <thead>
                  <tr>
                    <th className="perm-head-name">Permissions</th>
                    {[1, 2, 3].map((lvl) => (
                      <th key={lvl} className="perm-head-role">{LEVEL_LABELS[lvl]}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {PERMISSION_GROUPS.map((group) => (
                    <Fragment key={group.label}>
                      <tr className="perm-group"><td colSpan={4}>{group.label}</td></tr>
                      {group.perms.map((perm) => (
                        <tr key={perm.key} className="perm-row">
                          <td className="perm-name">{perm.label}</td>
                          {[1, 2, 3].map((lvl) => (
                            <td key={lvl} className="perm-cell">
                              <IonToggle
                                mode="md"
                                className="perm-toggle"
                                checked={!!permissions[lvl]?.[perm.key]}
                                onIonChange={(e) => togglePerm(lvl, perm.key, e.detail.checked)}
                                aria-label={`${LEVEL_LABELS[lvl]} — ${perm.label}`}
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── Create / Edit Modal ── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h2 className="text-base font-semibold text-slate-900">
                {editingMod ? "Edit Moderator" : "Add Moderator"}
              </h2>
              <button onClick={() => setModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-100 transition-colors">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Name *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Full name"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="moderator@example.com"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Password {editingMod && <span className="text-slate-400 font-normal">(leave blank to keep current)</span>}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required={!editingMod}
                    value={form.password}
                    onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                    className="w-full px-3 py-2 pr-10 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder={editingMod ? "Leave blank to keep" : "Enter password"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Level *</label>
                <select
                  value={form.level}
                  onChange={(e) => setForm((f) => ({ ...f, level: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                >
                  <option value="1">Level 1 (Limited)</option>
                  <option value="2">Level 2 (Moderate)</option>
                  <option value="3">Level 3 (Advanced)</option>
                </select>
              </div>
              {editingMod && (
                <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-slate-50">
                  <span className="text-sm text-slate-700">Active</span>
                  <Toggle on={form.isActive} onClick={() => setForm((f) => ({ ...f, isActive: !f.isActive }))} />
                </div>
              )}
              {formError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg text-sm text-red-700">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {formError}
                </div>
              )}
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {saving && <IonSpinner name="crescent" style={{ width: 16, height: 16 }} />}
                  {editingMod ? "Save Changes" : "Create Moderator"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5 text-red-500" />
              </div>
              <h2 className="text-base font-semibold text-slate-900">Delete Moderator</h2>
            </div>
            <p className="text-sm text-slate-600 mb-4">
              Delete <span className="font-semibold">{deleteTarget.name}</span>? Their active sessions will be invalidated immediately.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors disabled:opacity-50"
              >
                {deleting && <IonSpinner name="crescent" style={{ width: 16, height: 16 }} />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

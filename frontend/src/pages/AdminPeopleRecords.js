import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "@/components/AdminLayout";
import {
  Search, Trash2, Loader2, ChevronLeft, ChevronRight, Database,
  Plus, Edit2, X, Check, Phone, Mail, MapPin, Users, Briefcase, UserPlus,
} from "lucide-react";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";

const SOURCE_COLORS = {
  fec:         "bg-green-50 text-green-700 border-green-200",
  nsopw:       "bg-red-50 text-red-700 border-red-200",
  nppes:       "bg-blue-50 text-blue-700 border-blue-200",
  faa:         "bg-sky-50 text-sky-700 border-sky-200",
  voter_rolls: "bg-purple-50 text-purple-700 border-purple-200",
  whitepages:  "bg-amber-50 text-amber-700 border-amber-200",
  internal:    "bg-slate-100 text-slate-600 border-slate-200",
};

const SOURCES = ["", "fec", "nsopw", "nppes", "faa", "voter_rolls", "whitepages", "internal"];
const PHONE_TYPES = ["cell", "landline", "voip", "other"];
const US_STATES = ["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY","DC"];

function fmt(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ── Phone display helper ──────────────────────────────────────────────────────
function phoneStr(p) {
  if (typeof p === "string") return p;
  return p?.number || "";
}
function phoneType(p) {
  if (typeof p === "string") return null;
  return p?.type || null;
}
function phoneCurrent(p) {
  if (typeof p === "string") return true;
  return p?.current !== false;
}

// ── Email display helper ──────────────────────────────────────────────────────
function emailStr(e) {
  if (typeof e === "string") return e;
  return e?.address || "";
}

// ── Empty form state ──────────────────────────────────────────────────────────
function emptyForm() {
  return {
    firstName: "", lastName: "", middleName: "",
    aliases: [],
    dateOfBirth: "", gender: "",
    state: "",
    addresses: [],
    phones: [],
    emails: [],
    relatives: [],
    associates: [],
    occupation: "", employer: "",
  };
}

// ── Address sub-form ──────────────────────────────────────────────────────────
function AddressForm({ addresses, onChange }) {
  const add = () => onChange([...addresses, { street: "", city: "", state: "", zip: "", current: true }]);
  const update = (i, field, val) => {
    const next = addresses.map((a, idx) => idx === i ? { ...a, [field]: val } : a);
    onChange(next);
  };
  const remove = (i) => onChange(addresses.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-3">
      {addresses.map((addr, i) => (
        <div key={i} className="border border-slate-200 rounded-lg p-3 space-y-2 bg-slate-50/50">
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              {addr.current ? "Current Address" : "Past Address"}
            </label>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 text-xs text-slate-500 cursor-pointer">
                <input type="checkbox" checked={addr.current} onChange={e => update(i, "current", e.target.checked)} className="rounded" />
                Current
              </label>
              <button type="button" onClick={() => remove(i)} className="text-slate-400 hover:text-red-500 transition-colors"><X className="w-3.5 h-3.5" /></button>
            </div>
          </div>
          <input value={addr.street} onChange={e => update(i, "street", e.target.value)} placeholder="Street address"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          <div className="grid grid-cols-3 gap-2">
            <input value={addr.city} onChange={e => update(i, "city", e.target.value)} placeholder="City"
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            <select value={addr.state} onChange={e => update(i, "state", e.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white">
              <option value="">State</option>
              {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <input value={addr.zip} onChange={e => update(i, "zip", e.target.value)} placeholder="ZIP"
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
        </div>
      ))}
      <button type="button" onClick={add}
        className="flex items-center gap-1.5 text-sm text-green-600 hover:text-green-700 font-medium">
        <Plus className="w-3.5 h-3.5" /> Add Address
      </button>
    </div>
  );
}

// ── Phone sub-form ────────────────────────────────────────────────────────────
function PhoneForm({ phones, onChange }) {
  const add = () => onChange([...phones, { number: "", type: "cell", current: true }]);
  const update = (i, field, val) => onChange(phones.map((p, idx) => idx === i ? { ...p, [field]: val } : p));
  const remove = (i) => onChange(phones.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-2">
      {phones.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <input value={typeof p === "string" ? p : p.number} onChange={e => update(i, "number", e.target.value)}
            placeholder="(555) 123-4567"
            className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          <select value={typeof p === "string" ? "cell" : (p.type || "cell")} onChange={e => update(i, "type", e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white">
            {PHONE_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
          </select>
          <label className="flex items-center gap-1 text-xs text-slate-500 cursor-pointer whitespace-nowrap">
            <input type="checkbox" checked={typeof p === "string" ? true : p.current !== false}
              onChange={e => update(i, "current", e.target.checked)} className="rounded" />
            Current
          </label>
          <button type="button" onClick={() => remove(i)} className="text-slate-400 hover:text-red-500 transition-colors"><X className="w-3.5 h-3.5" /></button>
        </div>
      ))}
      <button type="button" onClick={add}
        className="flex items-center gap-1.5 text-sm text-green-600 hover:text-green-700 font-medium">
        <Plus className="w-3.5 h-3.5" /> Add Phone
      </button>
    </div>
  );
}

// ── Email sub-form ────────────────────────────────────────────────────────────
function EmailForm({ emails, onChange }) {
  const add = () => onChange([...emails, { address: "", primary: emails.length === 0 }]);
  const update = (i, field, val) => onChange(emails.map((e, idx) => idx === i ? { ...e, [field]: val } : e));
  const setPrimary = (i) => onChange(emails.map((e, idx) => ({ ...e, primary: idx === i })));
  const remove = (i) => onChange(emails.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-2">
      {emails.map((e, i) => (
        <div key={i} className="flex items-center gap-2">
          <input value={typeof e === "string" ? e : e.address} onChange={ev => update(i, "address", ev.target.value)}
            placeholder="email@example.com" type="email"
            className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          <label className="flex items-center gap-1 text-xs text-slate-500 cursor-pointer whitespace-nowrap">
            <input type="radio" name="primary-email" checked={typeof e === "string" ? i === 0 : e.primary}
              onChange={() => setPrimary(i)} />
            Primary
          </label>
          <button type="button" onClick={() => remove(i)} className="text-slate-400 hover:text-red-500 transition-colors"><X className="w-3.5 h-3.5" /></button>
        </div>
      ))}
      <button type="button" onClick={add}
        className="flex items-center gap-1.5 text-sm text-green-600 hover:text-green-700 font-medium">
        <Plus className="w-3.5 h-3.5" /> Add Email
      </button>
    </div>
  );
}

// ── Tag list sub-form (relatives, associates) ─────────────────────────────────
function TagListForm({ items, onChange, placeholder }) {
  const [input, setInput] = useState("");
  const add = () => {
    const v = input.trim();
    if (!v || items.includes(v)) return;
    onChange([...items, v]);
    setInput("");
  };
  const remove = (i) => onChange(items.filter((_, idx) => idx !== i));
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && (e.preventDefault(), add())}
          placeholder={placeholder}
          className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
        <button type="button" onClick={add}
          className="flex items-center gap-1 text-sm font-semibold bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-lg transition-colors">
          <Plus className="w-3.5 h-3.5" /> Add
        </button>
      </div>
      {items.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {items.map((item, i) => (
            <span key={i} className="flex items-center gap-1.5 bg-slate-100 text-slate-700 text-sm px-2.5 py-1 rounded-full">
              {item}
              <button type="button" onClick={() => remove(i)} className="text-slate-400 hover:text-red-500"><X className="w-3 h-3" /></button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Person link form (relatives/associates with live DB search) ───────────────
// items: [{ name, recordId }] or legacy strings
function PersonLinkForm({ items, onChange, placeholder }) {
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [sugLoading, setSugLoading] = useState(false);
  const debounceRef = useState(null);

  // Normalize legacy string items to objects
  const normalized = items.map(i =>
    typeof i === "string" ? { name: i, recordId: null } : i
  );

  const search = (val) => {
    clearTimeout(debounceRef[0]);
    if (val.length < 2) { setSuggestions([]); return; }
    debounceRef[0] = setTimeout(async () => {
      setSugLoading(true);
      try {
        const token = localStorage.getItem("adminToken");
        const res = await fetch(
          `${BACKEND_URL}/api/admin/people-records/search-suggest?q=${encodeURIComponent(val)}&limit=8`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await res.json();
        setSuggestions(data.results || []);
      } catch { setSuggestions([]); }
      finally { setSugLoading(false); }
    }, 250);
  };

  const addSuggestion = (sug) => {
    if (normalized.some(x => x.recordId === sug.recordId)) return;
    onChange([...normalized, { name: sug.name, recordId: sug.recordId }]);
    setInput("");
    setSuggestions([]);
  };

  const addManual = () => {
    const v = input.trim();
    if (!v) return;
    if (normalized.some(x => x.name.toLowerCase() === v.toLowerCase())) return;
    onChange([...normalized, { name: v, recordId: null }]);
    setInput("");
    setSuggestions([]);
  };

  const remove = (i) => onChange(normalized.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-2">
      <div className="relative">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={e => { setInput(e.target.value); search(e.target.value); }}
            onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addManual())}
            placeholder={placeholder}
            className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <button type="button" onClick={addManual}
            className="flex items-center gap-1 text-sm font-semibold bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-lg transition-colors">
            <Plus className="w-3.5 h-3.5" /> Add
          </button>
        </div>
        {(suggestions.length > 0 || sugLoading) && (
          <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden">
            {sugLoading && (
              <div className="flex items-center gap-2 px-3 py-2 text-sm text-slate-400">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Searching…
              </div>
            )}
            {suggestions.map(sug => (
              <button
                key={sug.recordId}
                type="button"
                onClick={() => addSuggestion(sug)}
                className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-green-50 text-left transition-colors"
              >
                <span className="font-medium text-slate-800">{sug.name}</span>
                <span className="text-xs text-slate-400">{sug.state}{sug.age ? ` · Age ${sug.age}` : ""}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      {normalized.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {normalized.map((item, i) => (
            <span key={i} className={`flex items-center gap-1.5 text-sm px-2.5 py-1 rounded-full ${
              item.recordId
                ? "bg-green-50 text-green-800 border border-green-200"
                : "bg-slate-100 text-slate-700"
            }`}>
              {item.recordId && <Check className="w-3 h-3 text-green-600 flex-shrink-0" />}
              {item.name}
              <button type="button" onClick={() => remove(i)} className="text-slate-400 hover:text-red-500"><X className="w-3 h-3" /></button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Person Modal ──────────────────────────────────────────────────────────────
function PersonModal({ record, onClose, onSave }) {
  const isEdit = !!record?.recordId;
  const [form, setForm] = useState(() => {
    if (!record) return emptyForm();
    return {
      firstName:   record.firstName || "",
      lastName:    record.lastName  || "",
      middleName:  record.middleName || "",
      aliases:     record.aliases   || [],
      dateOfBirth: record.dateOfBirth || "",
      gender:      record.gender || "",
      state:       record.state  || "",
      addresses:   record.addresses  || [],
      phones:      (record.phones || []).map(p => typeof p === "string" ? { number: p, type: "cell", current: true } : p),
      emails:      (record.emails || []).map(e => typeof e === "string" ? { address: e, primary: false } : e),
      relatives:   (record.relatives  || []).map(r => typeof r === "string" ? { name: r, recordId: null } : r),
      associates:  (record.associates || []).map(r => typeof r === "string" ? { name: r, recordId: null } : r),
      occupation:  record.occupation || "",
      employer:    record.employer   || "",
    };
  });
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState("basic");

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }));

  const handleSave = async () => {
    if (!form.firstName.trim() || !form.lastName.trim()) {
      toast.error("First and last name are required");
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form };
      const url = isEdit
        ? `${BACKEND_URL}/api/admin/people-records/record/${record.recordId}`
        : `${BACKEND_URL}/api/admin/people-records/create`;
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${localStorage.getItem("adminToken")}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.detail || "Save failed"); return; }
      toast.success(isEdit ? "Record updated" : "Record created");
      onSave();
    } catch {
      toast.error("Save failed");
    } finally {
      setSaving(false);
    }
  };

  const TABS = [
    { id: "basic",      label: "Basic Info",   icon: UserPlus },
    { id: "addresses",  label: "Addresses",    icon: MapPin },
    { id: "phones",     label: "Phones",       icon: Phone },
    { id: "emails",     label: "Emails",       icon: Mail },
    { id: "relations",  label: "Relations",    icon: Users },
    { id: "employment", label: "Employment",   icon: Briefcase },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">{isEdit ? "Edit Person" : "Add Person"}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors"><X className="w-5 h-5" /></button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 pt-3 border-b border-slate-100 overflow-x-auto">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-t-lg whitespace-nowrap transition-colors ${
                tab === t.id ? "bg-green-50 text-green-700 border-b-2 border-green-600" : "text-slate-500 hover:text-slate-700"
              }`}>
              <t.icon className="w-3.5 h-3.5" />{t.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {tab === "basic" && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">First Name <span className="text-red-500">*</span></label>
                  <input value={form.firstName} onChange={e => set("firstName", e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Middle Name</label>
                  <input value={form.middleName} onChange={e => set("middleName", e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Last Name <span className="text-red-500">*</span></label>
                  <input value={form.lastName} onChange={e => set("lastName", e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Aliases / Also Known As</label>
                <TagListForm items={form.aliases} onChange={v => set("aliases", v)} placeholder="Nickname or alternate name" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Date of Birth <span className="text-slate-400 font-normal">(age auto-calculated)</span></label>
                  <input type="date" value={form.dateOfBirth} onChange={e => set("dateOfBirth", e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Gender</label>
                  <select value={form.gender} onChange={e => set("gender", e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white">
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">State</label>
                <select value={form.state} onChange={e => set("state", e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white">
                  <option value="">Select state</option>
                  {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          )}

          {tab === "addresses" && (
            <AddressForm addresses={form.addresses} onChange={v => set("addresses", v)} />
          )}
          {tab === "phones" && (
            <PhoneForm phones={form.phones} onChange={v => set("phones", v)} />
          )}
          {tab === "emails" && (
            <EmailForm emails={form.emails} onChange={v => set("emails", v)} />
          )}
          {tab === "relations" && (
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-3 uppercase tracking-wide">Relatives</label>
                <PersonLinkForm items={form.relatives} onChange={v => set("relatives", v)} placeholder="Search by name or type manually" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-3 uppercase tracking-wide">Associates</label>
                <PersonLinkForm items={form.associates} onChange={v => set("associates", v)} placeholder="Search by name or type manually" />
              </div>
            </div>
          )}
          {tab === "employment" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Occupation</label>
                <input value={form.occupation} onChange={e => set("occupation", e.target.value)}
                  placeholder="e.g. Software Engineer"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Employer</label>
                <input value={form.employer} onChange={e => set("employer", e.target.value)}
                  placeholder="Company name"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 border border-slate-200 rounded-lg transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 px-5 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {isEdit ? "Save Changes" : "Create Record"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AdminPeopleRecords() {
  const navigate = useNavigate();
  const token = localStorage.getItem("adminToken");

  const [records, setRecords]       = useState([]);
  const [total, setTotal]           = useState(0);
  const [page, setPage]             = useState(1);
  const [pages, setPages]           = useState(1);
  const [loading, setLoading]       = useState(false);
  const [q, setQ]                   = useState("");
  const [source, setSource]         = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [confirmId, setConfirmId]   = useState(null);
  const [selected, setSelected]     = useState(new Set());
  const [massDeleting, setMassDeleting] = useState(false);
  const [modalRecord, setModalRecord]  = useState(undefined); // undefined=closed, null=new, obj=edit

  useEffect(() => {
    if (!token) { navigate("/admin/login"); return; }
    fetchRecords(1);
  }, []); // eslint-disable-line

  const fetchRecords = useCallback(async (p, overrideQ, overrideSrc) => {
    setLoading(true);
    const qVal   = overrideQ   !== undefined ? overrideQ   : q;
    const srcVal = overrideSrc !== undefined ? overrideSrc : source;
    try {
      const params = new URLSearchParams({ page: p, q: qVal, source: srcVal });
      const res = await fetch(`${BACKEND_URL}/api/admin/people-records/browse?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) { navigate("/admin/login"); return; }
      const data = await res.json();
      setRecords(data.records || []);
      setTotal(data.total || 0);
      setPage(data.page || 1);
      setPages(data.pages || 1);
      setSelected(new Set());
    } catch {
      toast.error("Failed to load records");
    } finally {
      setLoading(false);
    }
  }, [q, source, token, navigate]);

  const handleSearch = () => fetchRecords(1);

  const handleDelete = async (recordId) => {
    setDeletingId(recordId);
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/people-records/record/${recordId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) { toast.error("Failed to delete record"); return; }
      toast.success("Record deleted");
      setConfirmId(null);
      fetchRecords(page);
    } catch {
      toast.error("Delete failed");
    } finally {
      setDeletingId(null);
    }
  };

  const handleMassDelete = async () => {
    if (!selected.size) return;
    setMassDeleting(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/people-records/mass-delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ids: [...selected] }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error("Mass delete failed"); return; }
      toast.success(`Deleted ${data.deleted} records`);
      fetchRecords(page);
    } catch {
      toast.error("Mass delete failed");
    } finally {
      setMassDeleting(false);
    }
  };

  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === records.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(records.map(r => r.recordId)));
    }
  };

  return (
    <AdminLayout>
      {modalRecord !== undefined && (
        <PersonModal
          record={modalRecord}
          onClose={() => setModalRecord(undefined)}
          onSave={() => { setModalRecord(undefined); fetchRecords(page); }}
        />
      )}

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">People Records</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {total.toLocaleString()} total records across all sources
            </p>
          </div>
          <div className="flex items-center gap-3">
            {selected.size > 0 && (
              <button
                onClick={handleMassDelete}
                disabled={massDeleting}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                {massDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Delete {selected.size} selected
              </button>
            )}
            <button
              onClick={() => setModalRecord(null)}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Person
            </button>
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg">
              <Database className="w-4 h-4 text-slate-500" />
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{total.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Search bar */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex gap-3 flex-wrap">
            <div className="flex-1 min-w-[220px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                value={q}
                onChange={e => setQ(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSearch()}
                placeholder="Search by name or phone…"
                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-slate-800 dark:border-slate-600 dark:text-white"
              />
            </div>
            <select
              value={source}
              onChange={e => { setSource(e.target.value); fetchRecords(1, q, e.target.value); }}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-slate-800 dark:border-slate-600 dark:text-white"
            >
              {SOURCES.map(s => (
                <option key={s} value={s}>{s ? s.toUpperCase() : "All Sources"}</option>
              ))}
            </select>
            <button
              onClick={handleSearch}
              disabled={loading}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Search
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-green-600" />
            </div>
          ) : records.length === 0 ? (
            <div className="text-center py-16">
              <Database className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">No records found</p>
              <p className="text-slate-400 text-sm mt-1">Add a person manually or run a scraper from the Data Sources page</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-4 py-3">
                      <input type="checkbox" checked={selected.size === records.length && records.length > 0}
                        onChange={toggleAll} className="rounded" />
                    </th>
                    {["Name", "Source", "State", "Address", "Phone", "Added", ""].map(h => (
                      <th key={h} className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {records.map(rec => {
                    const addr = rec.addresses?.[0];
                    const addrStr = addr ? [addr.city, addr.state].filter(Boolean).join(", ") : "—";
                    const rawPhone = rec.phones?.[0];
                    const phone = rawPhone ? phoneStr(rawPhone) : "—";
                    const phoneTypeLabel = rawPhone ? phoneType(rawPhone) : null;
                    return (
                      <tr key={rec.recordId} className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${selected.has(rec.recordId) ? "bg-green-50/50" : ""}`}>
                        <td className="px-4 py-3">
                          <input type="checkbox" checked={selected.has(rec.recordId)}
                            onChange={() => toggleSelect(rec.recordId)} className="rounded" />
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-900 dark:text-white whitespace-nowrap">
                          {rec.firstName} {rec.lastName}
                          {rec.age && <span className="ml-1.5 text-xs text-slate-400">Age {rec.age}</span>}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${SOURCE_COLORS[rec.source] || SOURCE_COLORS.internal}`}>
                            {rec.source}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{rec.state || "—"}</td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-400 max-w-[160px] truncate">{addrStr}</td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                          {phone}
                          {phoneTypeLabel && <span className="ml-1 text-[10px] text-slate-400 capitalize">({phoneTypeLabel})</span>}
                        </td>
                        <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{fmt(rec.createdAt)}</td>
                        <td className="px-4 py-3 text-right">
                          {confirmId === rec.recordId ? (
                            <div className="flex items-center gap-2 justify-end">
                              <button
                                onClick={() => handleDelete(rec.recordId)}
                                disabled={deletingId === rec.recordId}
                                className="text-xs bg-red-600 hover:bg-red-700 text-white px-2.5 py-1 rounded-lg font-semibold disabled:opacity-50"
                              >
                                {deletingId === rec.recordId ? "Deleting…" : "Confirm"}
                              </button>
                              <button onClick={() => setConfirmId(null)} className="text-xs text-slate-500 hover:text-slate-700 px-2 py-1">Cancel</button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 justify-end">
                              <button
                                onClick={() => setModalRecord(rec)}
                                className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Edit record"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setConfirmId(rec.recordId)}
                                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete record"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Page {page} of {pages} · {total.toLocaleString()} records
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { const p = page - 1; setPage(p); fetchRecords(p); }}
                disabled={page <= 1}
                className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-slate-600" />
              </button>
              <button
                onClick={() => { const p = page + 1; setPage(p); fetchRecords(p); }}
                disabled={page >= pages}
                className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-slate-600" />
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

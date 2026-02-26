import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Save, RotateCcw, Eye, Code2, ChevronRight } from "lucide-react";
import AdminLayout from "@/components/AdminLayout";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";

const TEMPLATE_META = {
  welcome:               { variables: ["user_name", "user_email", "SITE_URL"] },
  email_verification:    { variables: ["user_name", "verification_code", "verification_link"] },
  getting_started:       { variables: ["user_name", "SITE_URL"] },
  subscription_thank_you:{ variables: ["user_name", "plan_name", "plan_price", "downloads_per_month", "SITE_URL"] },
  download_confirmation: { variables: ["user_name", "doc_name", "SITE_URL"] },
  signup_no_purchase:    { variables: ["user_name", "SITE_URL"] },
  abandoned_checkout:    { variables: ["user_name", "doc_name", "SITE_URL"] },
  review_request:        { variables: ["user_name", "doc_name", "TRUSTPILOT_URL"] },
  password_changed:      { variables: ["user_name", "SITE_URL"] },
  password_reset:        { variables: ["user_name", "reset_link", "reset_code"] },
};

const BASE_PREVIEW_STYLES = `
  body{margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;}
  .container{max-width:600px;margin:0 auto;padding:20px;}
  .header{text-align:center;padding:20px 0;border-bottom:1px solid #e5e7eb;}
  .logo{font-size:24px;font-weight:bold;color:#10b981;}
  .content{padding:30px 20px;}
  .button{display:inline-block;padding:12px 24px;background-color:#10b981;color:white;text-decoration:none;border-radius:6px;font-weight:500;}
  .footer{padding:20px;text-align:center;color:#6b7280;font-size:12px;border-top:1px solid #e5e7eb;}
  .highlight{background-color:#f0fdf4;padding:15px;border-radius:8px;border-left:4px solid #10b981;}
  h1{color:#111827;margin-bottom:10px;}
  p{color:#374151;line-height:1.6;}
  .text-muted{color:#6b7280;}
`;

function buildPreviewHtml(htmlBody) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${BASE_PREVIEW_STYLES}</style></head><body style="background-color:#f9fafb;"><div class="container"><div class="header"><div class="logo">🍃 MintSlip</div></div><div class="content">${htmlBody}</div><div class="footer"><p>© ${new Date().getFullYear()} MintSlip. All rights reserved.</p></div></div></body></html>`;
}

export default function AdminEmailTemplates() {
  const navigate = useNavigate();
  const [adminInfo, setAdminInfo] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [selected, setSelected] = useState(null);
  const [subject, setSubject] = useState("");
  const [htmlBody, setHtmlBody] = useState("");
  const [previewText, setPreviewText] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [tab, setTab] = useState("edit");

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    const info = localStorage.getItem("adminInfo");
    if (!token) { navigate("/admin/login"); return; }
    if (info) { try { setAdminInfo(JSON.parse(info)); } catch (e) {} }
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`${BACKEND_URL}/api/admin/email-templates`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setTemplates(data.templates);
    } catch (e) {
      console.error("Failed to fetch templates:", e);
    }
  };

  const selectTemplate = (tmpl) => {
    setSelected(tmpl);
    setSubject(tmpl.subject || "");
    setHtmlBody(tmpl.html_body || "");
    setPreviewText(tmpl.preview_text || "");
    setTab("edit");
    setSaved(false);
  };

  const handleSave = async () => {
    if (!selected || !subject.trim() || !htmlBody.trim()) return;
    setSaving(true);
    try {
      const token = localStorage.getItem("adminToken");
      await fetch(`${BACKEND_URL}/api/admin/email-templates/${selected.name}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ subject, html_body: htmlBody, preview_text: previewText })
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      await fetchTemplates();
    } catch (e) {
      console.error("Failed to save template:", e);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!selected || !window.confirm(`Reset "${selected.display_name}" to the default template?`)) return;
    try {
      const token = localStorage.getItem("adminToken");
      await fetch(`${BACKEND_URL}/api/admin/email-templates/${selected.name}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      await fetchTemplates();
      setSelected(prev => ({ ...prev, is_custom: false }));
      setSubject("");
      setHtmlBody("");
      setPreviewText("");
    } catch (e) {
      console.error("Failed to reset template:", e);
    }
  };

  const meta = selected ? TEMPLATE_META[selected.name] : null;

  return (
    <AdminLayout adminInfo={adminInfo}>
      <div className="flex gap-5 h-full" style={{ minHeight: "calc(100vh - 120px)" }}>

        {/* Template list */}
        <div className="w-60 flex-shrink-0">
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-slate-200">
            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
              <p className="text-sm font-semibold text-slate-700">Email Templates</p>
              <p className="text-xs text-slate-400 mt-0.5">{templates.filter(t => t.is_custom).length} customized</p>
            </div>
            <div className="divide-y divide-slate-100">
              {templates.map(tmpl => (
                <button
                  key={tmpl.name}
                  onClick={() => selectTemplate(tmpl)}
                  className={`w-full px-4 py-3 text-left transition-colors flex items-center justify-between group ${
                    selected?.name === tmpl.name
                      ? "bg-green-50 border-l-2 border-green-500"
                      : "hover:bg-slate-50 border-l-2 border-transparent"
                  }`}
                >
                  <div className="min-w-0">
                    <p className={`text-sm font-medium truncate ${selected?.name === tmpl.name ? "text-green-800" : "text-slate-700"}`}>
                      {tmpl.display_name}
                    </p>
                    <p className={`text-xs mt-0.5 ${tmpl.is_custom ? "text-green-600" : "text-slate-400"}`}>
                      {tmpl.is_custom ? "● Custom" : "○ Default"}
                    </p>
                  </div>
                  <ChevronRight className={`w-3.5 h-3.5 flex-shrink-0 transition-opacity ${selected?.name === tmpl.name ? "opacity-60 text-green-600" : "opacity-0 group-hover:opacity-40"}`} />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Editor panel */}
        {selected ? (
          <div className="flex-1 flex flex-col gap-4 min-w-0">

            {/* Toolbar */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 px-5 py-3 flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-slate-800">{selected.display_name}</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {selected.is_custom ? "Using custom template" : "Using default template — edit to override"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {selected.is_custom && (
                  <button
                    onClick={handleReset}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-slate-200 text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 rounded-lg transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Reset to Default
                  </button>
                )}
                <button
                  onClick={handleSave}
                  disabled={saving || !subject.trim() || !htmlBody.trim()}
                  className={`flex items-center gap-1.5 px-4 py-1.5 text-sm rounded-lg transition-colors disabled:opacity-50 ${
                    saved ? "bg-green-100 text-green-700" : "bg-green-600 hover:bg-green-700 text-white"
                  }`}
                >
                  <Save className="w-3.5 h-3.5" />
                  {saved ? "Saved!" : saving ? "Saving…" : "Save Template"}
                </button>
              </div>
            </div>

            {/* Variables hint */}
            {meta && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
                <p className="text-xs font-semibold text-blue-700 mb-2">Available variables — use these in your subject and body:</p>
                <div className="flex flex-wrap gap-1.5">
                  {meta.variables.map(v => (
                    <code key={v} className="text-xs bg-white border border-blue-200 text-blue-700 px-2 py-0.5 rounded font-mono">
                      {`{${v}}`}
                    </code>
                  ))}
                </div>
              </div>
            )}

            {/* Subject */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 px-5 py-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">Subject Line</label>
              <input
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="e.g. Welcome to MintSlip! 🎉"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            {/* HTML body + preview */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 px-5 py-4 flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-slate-700">Email Body <span className="text-slate-400 font-normal">(HTML — goes inside the base template)</span></label>
                <div className="flex bg-slate-100 rounded-lg p-0.5 gap-0.5">
                  <button
                    onClick={() => setTab("edit")}
                    className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded-md transition-colors ${tab === "edit" ? "bg-white shadow-sm text-slate-800 font-medium" : "text-slate-500 hover:text-slate-700"}`}
                  >
                    <Code2 className="w-3 h-3" /> Edit
                  </button>
                  <button
                    onClick={() => setTab("preview")}
                    className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded-md transition-colors ${tab === "preview" ? "bg-white shadow-sm text-slate-800 font-medium" : "text-slate-500 hover:text-slate-700"}`}
                  >
                    <Eye className="w-3 h-3" /> Preview
                  </button>
                </div>
              </div>
              {tab === "edit" ? (
                <textarea
                  value={htmlBody}
                  onChange={e => setHtmlBody(e.target.value)}
                  placeholder={`<h1>Hello {user_name}!</h1>\n<p>Your email content here...</p>`}
                  className="flex-1 min-h-80 font-mono text-sm border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                  spellCheck={false}
                />
              ) : (
                <iframe
                  srcDoc={buildPreviewHtml(htmlBody || "<p style='color:#9ca3af;text-align:center;padding:40px 0;'>Nothing to preview yet — write some HTML in the Edit tab.</p>")}
                  className="flex-1 min-h-80 border border-slate-200 rounded-lg w-full bg-white"
                  title="Email preview"
                  sandbox="allow-same-origin"
                />
              )}
            </div>

            {/* Preview text */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 px-5 py-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Preview Text <span className="text-slate-400 font-normal text-xs">(optional — shown as the snippet in email clients)</span>
              </label>
              <input
                value={previewText}
                onChange={e => setPreviewText(e.target.value)}
                placeholder="e.g. Welcome to MintSlip – your account is ready"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-slate-400 max-w-xs">
              <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="font-medium text-slate-600">Select a template</p>
              <p className="text-sm mt-1">Choose an email template from the list to edit its subject and body.</p>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

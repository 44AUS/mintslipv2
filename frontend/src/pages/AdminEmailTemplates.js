import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Save, RotateCcw, Eye, Code2, ChevronRight, Lock, Clock } from "lucide-react";
import AdminLayout from "@/components/AdminLayout";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";

const DEFAULT_BODIES = {
  welcome:
`<h1>Welcome to MintSlip! 🎉</h1>
<p>Hi {user_name},</p>
<p>Thank you for creating an account with MintSlip. We're excited to have you on board!</p>
<p>With MintSlip, you can generate professional documents in seconds:</p>
<ul style="color: #374151; line-height: 2;">
    <li>✅ Pay Stubs &amp; Canadian Pay Stubs</li>
    <li>✅ W-2 Forms &amp; 1099 Forms</li>
    <li>✅ AI-Powered Resumes</li>
    <li>✅ And much more!</li>
</ul>
<p style="text-align: center; margin: 30px 0;">
    <a href="{SITE_URL}/user/dashboard" class="button">Go to Dashboard</a>
</p>
<p class="text-muted">If you have any questions, just reply to this email. We're here to help!</p>`,

  email_verification:
`<h1>Verify Your Email Address</h1>
<p>Hi {user_name},</p>
<p>Please verify your email address to complete your registration and unlock all features.</p>
<div class="highlight" style="text-align: center;">
    <p style="margin: 0; font-size: 14px; color: #6b7280;">Your verification code:</p>
    <p style="font-size: 32px; font-weight: bold; color: #10b981; letter-spacing: 4px; margin: 10px 0;">{verification_code}</p>
</div>
<p style="text-align: center; margin: 20px 0;">Or click the button below:</p>
<p style="text-align: center;">
    <a href="{verification_link}" class="button">Verify Email</a>
</p>
<p class="text-muted" style="font-size: 12px;">This code expires in 24 hours. If you didn't create an account, please ignore this email.</p>`,

  getting_started:
`<h1>Getting Started with MintSlip 🚀</h1>
<p>Hi {user_name},</p>
<p>Now that you've created your account, here's how to make the most of MintSlip:</p>
<div class="highlight" style="margin: 20px 0;">
    <h3 style="margin-top: 0; color: #059669;">Step 1: Choose Your Document</h3>
    <p style="margin-bottom: 0;">Browse our collection of professional document generators - from pay stubs to tax forms.</p>
</div>
<div class="highlight" style="margin: 20px 0;">
    <h3 style="margin-top: 0; color: #059669;">Step 2: Fill in the Details</h3>
    <p style="margin-bottom: 0;">Enter your information using our easy-to-use forms. Preview before you download!</p>
</div>
<div class="highlight" style="margin: 20px 0;">
    <h3 style="margin-top: 0; color: #059669;">Step 3: Download Instantly</h3>
    <p style="margin-bottom: 0;">Get your professional PDF document immediately. It's that simple!</p>
</div>
<h3>💡 Pro Tips:</h3>
<ul style="color: #374151; line-height: 2;">
    <li><strong>Subscribe &amp; Save:</strong> Get unlimited downloads with our business subscription plan</li>
    <li><strong>Save Your Documents:</strong> Registered users can save documents for 30 days</li>
</ul>
<p style="text-align: center; margin: 30px 0;">
    <a href="{SITE_URL}/generators" class="button">Start Creating Documents</a>
</p>`,

  subscription_thank_you:
`<h1>Thank You for Subscribing! 🎉</h1>
<p>Hi {user_name},</p>
<p>Welcome to the <strong>{plan_name}</strong> plan! Your subscription is now active.</p>
<div class="highlight">
    <h3 style="margin-top: 0;">Your Plan Details:</h3>
    <table style="width: 100%; color: #374151;">
        <tr>
            <td style="padding: 8px 0;"><strong>Plan:</strong></td>
            <td style="padding: 8px 0;">{plan_name}</td>
        </tr>
        <tr>
            <td style="padding: 8px 0;"><strong>Price:</strong></td>
            <td style="padding: 8px 0;">\${plan_price}/month</td>
        </tr>
        <tr>
            <td style="padding: 8px 0;"><strong>Downloads:</strong></td>
            <td style="padding: 8px 0;">{downloads_per_month} per month</td>
        </tr>
    </table>
</div>
<h3>What's Included:</h3>
<ul style="color: #374151; line-height: 2;">
    <li>✅ {downloads_per_month} document downloads per month</li>
    <li>✅ All document types included</li>
    <li>✅ Priority support</li>
    <li>✅ Save documents for 30 days</li>
</ul>
<p style="text-align: center; margin: 30px 0;">
    <a href="{SITE_URL}/user/dashboard" class="button">Go to Dashboard</a>
</p>
<p class="text-muted">Need help? Reply to this email and we'll get back to you within 24 hours.</p>`,

  download_confirmation:
`<h1>Your Document is Ready! 📄</h1>
<p>Hi {user_name},</p>
<p>Great news! Your <strong>{doc_name}</strong> has been successfully generated and is ready for download.</p>
<div class="highlight">
    <p style="margin: 0;"><strong>Document:</strong> {doc_name}</p>
</div>
<p>Your document should have downloaded automatically. If not, you can access it from your <a href="{SITE_URL}/user/downloads" style="color: #10b981;">Downloads page</a>.</p>
<p class="text-muted">Need to make changes? You can generate a new document anytime from your dashboard.</p>`,

  signup_no_purchase:
`<h1>Still Thinking It Over? 🤔</h1>
<p>Hi {user_name},</p>
<p>We noticed you created a MintSlip account but haven't generated any documents yet.</p>
<p>Need professional documents? We've got you covered:</p>
<div class="highlight">
    <h3 style="margin-top: 0;">Why Choose MintSlip?</h3>
    <ul style="margin-bottom: 0; color: #374151; line-height: 2;">
        <li>⚡ Generate documents in under 2 minutes</li>
        <li>📄 Professional, print-ready PDFs</li>
        <li>🔒 Secure and confidential</li>
        <li>💰 Affordable pricing starting at $9.99</li>
    </ul>
</div>
<h3>Popular Documents:</h3>
<ul style="color: #374151; line-height: 2;">
    <li>💼 Pay Stubs - Perfect for proof of income</li>
    <li>📋 W-2 &amp; 1099 Forms - Tax season essentials</li>
    <li>📝 AI Resumes - Stand out from the crowd</li>
</ul>
<p style="text-align: center; margin: 30px 0;">
    <a href="{SITE_URL}/generators" class="button">Browse Documents</a>
</p>
<p class="text-muted">Have questions? Just reply to this email - we're happy to help!</p>`,

  abandoned_checkout:
`<h1>Did Something Go Wrong? 🛒</h1>
<p>Hi {user_name},</p>
<p>We noticed you started creating a <strong>{doc_name}</strong> but didn't complete your purchase.</p>
<p>No worries - your progress might still be saved! You can pick up right where you left off.</p>
<div class="highlight">
    <p style="margin: 0;"><strong>Your document:</strong> {doc_name}</p>
</div>
<p style="text-align: center; margin: 30px 0;">
    <a href="{SITE_URL}" class="button">Complete Your Purchase</a>
</p>
<h3>Need Help?</h3>
<p>If you encountered any issues during checkout, please let us know. Common solutions:</p>
<ul style="color: #374151; line-height: 2;">
    <li>Try a different payment method</li>
    <li>Clear your browser cache and try again</li>
    <li>Contact us for assistance</li>
</ul>
<p class="text-muted">Just reply to this email if you need any help!</p>`,

  review_request:
`<h1>How Did We Do? ⭐</h1>
<p>Hi {user_name},</p>
<p>Thank you for using MintSlip to create your <strong>{doc_name}</strong>!</p>
<p>We'd love to hear about your experience. Your feedback helps us improve and helps others discover MintSlip.</p>
<div class="highlight" style="text-align: center;">
    <p style="margin: 0 0 15px 0;">Would you take 30 seconds to leave us a review?</p>
    <a href="{TRUSTPILOT_URL}" class="button" style="background-color: #00b67a;">Leave a Review on Trustpilot ⭐</a>
</div>
<p style="margin-top: 30px;">Your review makes a real difference:</p>
<ul style="color: #374151; line-height: 2;">
    <li>⭐ Helps other customers find us</li>
    <li>💡 Gives us feedback to improve</li>
    <li>🙏 Shows your support for small businesses</li>
</ul>
<p class="text-muted">Thank you for being a valued customer!</p>`,

  password_changed:
`<h1>Password Changed Successfully 🔐</h1>
<p>Hi {user_name},</p>
<p>Your MintSlip password has been successfully changed.</p>
<p><strong>Didn't make this change?</strong></p>
<p>If you didn't change your password, please take these steps immediately:</p>
<ol style="color: #374151; line-height: 2;">
    <li>Reset your password using the "Forgot Password" link</li>
    <li>Contact us at support@mintslip.com</li>
</ol>
<p style="text-align: center; margin: 30px 0;">
    <a href="{SITE_URL}/login" class="button">Go to Login</a>
</p>
<p class="text-muted">This is an automated security notification.</p>`,

  password_reset:
`<h1>Reset Your Password 🔐</h1>
<p>Hi {user_name},</p>
<p>We received a request to reset your MintSlip password. Click the button below to create a new password:</p>
<p style="text-align: center; margin: 30px 0;">
    <a href="{reset_link}" class="button">Reset Password</a>
</p>
<p>Or use this code on the reset page:</p>
<div class="highlight" style="text-align: center;">
    <p style="font-size: 32px; font-weight: bold; color: #10b981; letter-spacing: 4px; margin: 10px 0;">{reset_code}</p>
</div>
<p class="text-muted" style="margin-top: 30px;"><strong>Didn't request this?</strong></p>
<p class="text-muted">If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
<p class="text-muted" style="font-size: 12px;">This link expires in 1 hour for security reasons.</p>`,
};

const TEMPLATE_META = {
  welcome:               { variables: ["user_name", "user_email", "SITE_URL"],                                     defaultSubject: "Welcome to MintSlip! 🎉",                                            defaultHtmlBody: DEFAULT_BODIES.welcome,               defaultDelayMinutes: null },
  email_verification:    { variables: ["user_name", "verification_code", "verification_link"],                     defaultSubject: "Verify your email address - MintSlip",                               defaultHtmlBody: DEFAULT_BODIES.email_verification,    defaultDelayMinutes: null },
  getting_started:       { variables: ["user_name", "SITE_URL"],                                                   defaultSubject: "Getting Started with MintSlip - Quick Guide",                        defaultHtmlBody: DEFAULT_BODIES.getting_started,       defaultDelayMinutes: 15 },
  subscription_thank_you:{ variables: ["user_name", "plan_name", "plan_price", "downloads_per_month", "SITE_URL"], defaultSubject: "Welcome to {plan_name}! Your MintSlip subscription is active",        defaultHtmlBody: DEFAULT_BODIES.subscription_thank_you,defaultDelayMinutes: 15 },
  download_confirmation: { variables: ["user_name", "doc_name", "SITE_URL"],                                      defaultSubject: "Your {doc_name} is Ready - MintSlip",                                defaultHtmlBody: DEFAULT_BODIES.download_confirmation, defaultDelayMinutes: null },
  signup_no_purchase:    { variables: ["user_name", "SITE_URL"],                                                   defaultSubject: "Your MintSlip documents are waiting for you",                        defaultHtmlBody: DEFAULT_BODIES.signup_no_purchase,    defaultDelayMinutes: 1440 },
  abandoned_checkout:    { variables: ["user_name", "doc_name", "SITE_URL"],                                      defaultSubject: "Complete your {doc_name} purchase - MintSlip",                       defaultHtmlBody: DEFAULT_BODIES.abandoned_checkout,    defaultDelayMinutes: 120 },
  review_request:        { variables: ["user_name", "doc_name", "TRUSTPILOT_URL"],                                defaultSubject: "How was your MintSlip experience? ⭐",                                defaultHtmlBody: DEFAULT_BODIES.review_request,        defaultDelayMinutes: null },
  password_changed:      { variables: ["user_name", "SITE_URL"],                                                   defaultSubject: "Your password has been changed - MintSlip",                          defaultHtmlBody: DEFAULT_BODIES.password_changed,      defaultDelayMinutes: null },
  password_reset:        { variables: ["user_name", "reset_link", "reset_code"],                                   defaultSubject: "Reset your password - MintSlip",                                     defaultHtmlBody: DEFAULT_BODIES.password_reset,        defaultDelayMinutes: null },
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

function formatDelay(minutes) {
  if (!minutes || minutes <= 0) return "immediately";
  if (minutes < 60) return `${minutes} min`;
  if (minutes < 1440) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}m` : `${h} hour${h === 1 ? "" : "s"}`;
  }
  const d = Math.floor(minutes / 1440);
  const h = Math.floor((minutes % 1440) / 60);
  return h > 0 ? `${d}d ${h}h` : `${d} day${d === 1 ? "" : "s"}`;
}

export default function AdminEmailTemplates() {
  const navigate = useNavigate();
  const [adminInfo, setAdminInfo] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [selected, setSelected] = useState(null);
  const [subject, setSubject] = useState("");
  const [htmlBody, setHtmlBody] = useState("");
  const [previewText, setPreviewText] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [delayMinutes, setDelayMinutes] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
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
    const m = TEMPLATE_META[tmpl.name];
    setSelected(tmpl);
    setSubject(tmpl.subject || m?.defaultSubject || "");
    setHtmlBody(tmpl.html_body || m?.defaultHtmlBody || "");
    setPreviewText(tmpl.preview_text || "");
    setEnabled(tmpl.enabled !== false);
    setDelayMinutes(
      tmpl.delay_minutes != null ? String(tmpl.delay_minutes)
        : m?.defaultDelayMinutes != null ? String(m.defaultDelayMinutes)
        : ""
    );
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
      // Also save delay if this is a scheduled template
      if (selected.is_scheduled && delayMinutes !== "") {
        await fetch(`${BACKEND_URL}/api/admin/email-settings/${selected.name}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
          body: JSON.stringify({ delay_minutes: parseInt(delayMinutes) || null })
        });
      }
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
      const m = TEMPLATE_META[selected.name];
      setSelected(prev => ({ ...prev, is_custom: false, subject: undefined, html_body: undefined }));
      setSubject(m?.defaultSubject || "");
      setHtmlBody(m?.defaultHtmlBody || "");
      setPreviewText("");
      if (m?.defaultDelayMinutes != null) setDelayMinutes(String(m.defaultDelayMinutes));
    } catch (e) {
      console.error("Failed to reset template:", e);
    }
  };

  const handleToggleEnabled = async (newVal) => {
    if (!selected || selected.is_system) return;
    setEnabled(newVal);
    setSettingsSaving(true);
    try {
      const token = localStorage.getItem("adminToken");
      await fetch(`${BACKEND_URL}/api/admin/email-settings/${selected.name}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ enabled: newVal })
      });
      setSelected(prev => ({ ...prev, enabled: newVal }));
      setTemplates(prev => prev.map(t => t.name === selected.name ? { ...t, enabled: newVal } : t));
    } catch (e) {
      setEnabled(!newVal); // revert on error
    } finally {
      setSettingsSaving(false);
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
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className={`text-sm font-medium truncate ${selected?.name === tmpl.name ? "text-green-800" : tmpl.enabled === false ? "text-slate-400" : "text-slate-700"}`}>
                        {tmpl.display_name}
                      </p>
                      {tmpl.is_system && <Lock className="w-2.5 h-2.5 text-slate-300 flex-shrink-0" />}
                    </div>
                    <p className={`text-xs mt-0.5 ${tmpl.enabled === false ? "text-orange-400" : tmpl.is_custom ? "text-green-600" : "text-slate-400"}`}>
                      {tmpl.enabled === false ? "● Disabled" : tmpl.is_custom ? "● Custom" : "○ Default"}
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
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 px-5 py-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h2 className="font-semibold text-slate-800">{selected.display_name}</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {selected.is_custom ? "Using custom template" : "Using default template — edit to override"}
                </p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                {/* Enabled toggle */}
                {selected.is_system ? (
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 border border-slate-200 rounded-lg px-3 py-1.5">
                    <Lock className="w-3 h-3" />
                    System — always on
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium ${enabled ? "text-green-600" : "text-slate-400"}`}>
                      {enabled ? "Enabled" : "Disabled"}
                    </span>
                    <button
                      onClick={() => handleToggleEnabled(!enabled)}
                      disabled={settingsSaving}
                      className={`relative w-10 h-5 rounded-full transition-colors focus:outline-none ${enabled ? "bg-green-500" : "bg-slate-300"} ${settingsSaving ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${enabled ? "translate-x-5" : "translate-x-0"}`} />
                    </button>
                  </div>
                )}

                <div className="w-px h-5 bg-slate-200" />

                {selected.is_custom && (
                  <button
                    onClick={handleReset}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-slate-200 text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 rounded-lg transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Reset
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

            {/* Send Timing (scheduled emails only) */}
            {selected.is_scheduled && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 px-5 py-4">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <label className="text-sm font-medium text-slate-700">Send Delay</label>
                  <span className="text-xs text-slate-400">— time after the trigger event</span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="1"
                    value={delayMinutes}
                    onChange={e => setDelayMinutes(e.target.value)}
                    className="w-28 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="minutes"
                  />
                  <span className="text-sm text-slate-500">minutes</span>
                  {delayMinutes && parseInt(delayMinutes) > 0 && (
                    <span className="text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded-md border border-slate-200">
                      = {formatDelay(parseInt(delayMinutes))}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  Default: {formatDelay(selected.default_delay_minutes)} · Saved with "Save Template"
                </p>
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
              <p className="text-sm mt-1">Choose an email template from the list to edit its subject, body, and settings.</p>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

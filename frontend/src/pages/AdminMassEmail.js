import { useState, useEffect, useRef } from "react";
import { IonSpinner } from "@ionic/react";
import { Send, Search, Users, Eye, Code2, CheckSquare, Square, AlertCircle, CheckCircle, X } from "lucide-react";
import AdminLayout from "@/components/AdminLayout";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";

const BASE_PREVIEW_STYLES = `
  body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: #f9fafb; }
  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
  .header { text-align: center; padding: 20px 0; border-bottom: 1px solid #e5e7eb; }
  .content { padding: 30px 20px; }
  .button { display: inline-block; padding: 12px 24px; background-color: #10b981; color: white; text-decoration: none; border-radius: 6px; font-weight: 500; }
  .footer { padding: 20px; text-align: center; color: #6b7280; font-size: 12px; border-top: 1px solid #e5e7eb; }
  .highlight { background-color: #f0fdf4; padding: 15px; border-radius: 8px; border-left: 4px solid #10b981; }
  h1 { color: #111827; margin-bottom: 10px; }
  p { color: #374151; line-height: 1.6; }
  .text-muted { color: #6b7280; }
`;

function buildPreviewHtml(htmlBody, previewText) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>${BASE_PREVIEW_STYLES}</style>
</head>
<body>
  ${previewText ? `<span style="display:none;max-height:0;overflow:hidden;">${previewText}</span>` : ""}
  <div class="container">
    <div class="header">
      <img src="/mintslip-logo.png" alt="MintSlip" style="height:40px;width:auto;" />
    </div>
    <div class="content">${htmlBody}</div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} MintSlip. All rights reserved.</p>
      <p><a href="#" style="color:#6b7280;">Unsubscribe</a></p>
    </div>
  </div>
</body>
</html>`;
}

export default function AdminMassEmail() {
  const [recipients, setRecipients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [excluded, setExcluded] = useState(new Set());

  const [subject, setSubject] = useState("");
  const [previewText, setPreviewText] = useState("");
  const [htmlBody, setHtmlBody] = useState("");
  const [editorTab, setEditorTab] = useState("edit"); // "edit" | "preview"

  const [sending, setSending] = useState(false);
  const [jobId, setJobId] = useState(null);
  const [jobStatus, setJobStatus] = useState(null); // { status, total, sent, failed, errors }
  const [sendError, setSendError] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  const pollRef = useRef(null);

  useEffect(() => {
    fetchRecipients();
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  const fetchRecipients = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`${BACKEND_URL}/api/admin/mass-email/recipients`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) setRecipients(data.recipients);
      }
    } catch (e) {}
    setLoading(false);
  };

  const filteredRecipients = recipients.filter((r) => {
    const q = search.toLowerCase();
    return r.email.includes(q) || (r.name || "").toLowerCase().includes(q);
  });

  const allFilteredSelected = filteredRecipients.length > 0 && filteredRecipients.every((r) => !excluded.has(r.email));

  const toggleExclude = (email) => {
    setExcluded((prev) => {
      const next = new Set(prev);
      if (next.has(email)) next.delete(email);
      else next.add(email);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      // Exclude all filtered
      setExcluded((prev) => {
        const next = new Set(prev);
        filteredRecipients.forEach((r) => next.add(r.email));
        return next;
      });
    } else {
      // Include all filtered
      setExcluded((prev) => {
        const next = new Set(prev);
        filteredRecipients.forEach((r) => next.delete(r.email));
        return next;
      });
    }
  };

  const includedCount = recipients.filter((r) => !excluded.has(r.email)).length;

  const pollStatus = (id) => {
    pollRef.current = setInterval(async () => {
      try {
        const token = localStorage.getItem("adminToken");
        const res = await fetch(`${BACKEND_URL}/api/admin/mass-email/status/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setJobStatus(data);
          if (data.status === "done") {
            clearInterval(pollRef.current);
            setSending(false);
          }
        }
      } catch (e) {}
    }, 1500);
  };

  const handleSend = async () => {
    setConfirmOpen(false);
    setSending(true);
    setSendError("");
    setJobStatus(null);
    setJobId(null);
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`${BACKEND_URL}/api/admin/mass-email/send`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          html_body: htmlBody,
          preview_text: previewText,
          excluded_emails: Array.from(excluded),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setJobId(data.job_id);
        setJobStatus({ status: "running", total: data.total, sent: 0, failed: 0, errors: [] });
        pollStatus(data.job_id);
      } else {
        setSendError(data.detail || "Failed to start send job.");
        setSending(false);
      }
    } catch (e) {
      setSendError("Network error. Please try again.");
      setSending(false);
    }
  };

  const canSend = subject.trim() && htmlBody.trim() && includedCount > 0 && !sending;

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Mass Email</h1>
          <p className="text-sm text-slate-500 mt-1">
            Send a custom email to all purchasers. Uncheck recipients to exclude them.
          </p>
        </div>

        <div className="flex gap-5" style={{ minHeight: "calc(100vh - 200px)" }}>
          {/* ── Left panel: Recipients ── */}
          <div className="w-72 flex-shrink-0 flex flex-col bg-white rounded-xl border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 border-b border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-slate-400" />
                  <span className="text-sm font-semibold text-slate-700">Recipients</span>
                </div>
                <span className="text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                  {loading ? "…" : `${includedCount} / ${recipients.length}`}
                </span>
              </div>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search email or name…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-500 bg-slate-50"
                />
              </div>
            </div>

            {/* Select-all row */}
            {!loading && filteredRecipients.length > 0 && (
              <div
                className="flex items-center gap-2 px-4 py-2 border-b border-slate-100 cursor-pointer hover:bg-slate-50 select-none"
                onClick={toggleSelectAll}
              >
                {allFilteredSelected ? (
                  <CheckSquare className="w-4 h-4 text-green-600 flex-shrink-0" />
                ) : (
                  <Square className="w-4 h-4 text-slate-300 flex-shrink-0" />
                )}
                <span className="text-xs font-medium text-slate-600">
                  {allFilteredSelected ? "Deselect all" : "Select all"}
                  {search ? " matching" : ""}
                </span>
              </div>
            )}

            {/* List */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-12 text-slate-400">
                  <IonSpinner name="crescent" style={{ width: 20, height: 20 }} />
                </div>
              ) : filteredRecipients.length === 0 ? (
                <p className="px-4 py-6 text-xs text-slate-400 text-center">No recipients found.</p>
              ) : (
                filteredRecipients.map((r) => {
                  const isExcluded = excluded.has(r.email);
                  return (
                    <div
                      key={r.email}
                      onClick={() => toggleExclude(r.email)}
                      className={`flex items-center gap-2.5 px-4 py-2.5 cursor-pointer border-b border-slate-50 select-none transition-colors ${
                        isExcluded ? "opacity-40 hover:bg-slate-50" : "hover:bg-green-50"
                      }`}
                    >
                      {isExcluded ? (
                        <Square className="w-4 h-4 text-slate-300 flex-shrink-0" />
                      ) : (
                        <CheckSquare className="w-4 h-4 text-green-600 flex-shrink-0" />
                      )}
                      <div className="min-w-0">
                        {r.name && (
                          <p className="text-xs font-medium text-slate-700 truncate">{r.name}</p>
                        )}
                        <p className={`text-xs truncate ${r.name ? "text-slate-400" : "text-slate-600 font-medium"}`}>
                          {r.email}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Excluded count footer */}
            {excluded.size > 0 && (
              <div className="px-4 py-2.5 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500">{excluded.size} excluded</span>
                <button
                  onClick={() => setExcluded(new Set())}
                  className="text-xs text-green-600 hover:text-green-700 font-medium flex items-center gap-1"
                >
                  <X className="w-3 h-3" /> Clear
                </button>
              </div>
            )}
          </div>

          {/* ── Right panel: Compose ── */}
          <div className="flex-1 flex flex-col bg-white rounded-xl border border-slate-200 overflow-hidden min-w-0">
            {/* Toolbar */}
            <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
              <div className="flex gap-1 bg-slate-100 rounded-lg p-0.5">
                <button
                  onClick={() => setEditorTab("edit")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    editorTab === "edit"
                      ? "bg-white text-slate-800 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <Code2 className="w-3.5 h-3.5" /> Edit
                </button>
                <button
                  onClick={() => setEditorTab("preview")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    editorTab === "preview"
                      ? "bg-white text-slate-800 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" /> Preview
                </button>
              </div>

              <button
                disabled={!canSend}
                onClick={() => setConfirmOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-green-600 hover:bg-green-700 text-white"
              >
                {sending ? <IonSpinner name="crescent" style={{ width: 16, height: 16 }} /> : <Send className="w-4 h-4" />}
                {sending ? "Sending…" : `Send to ${includedCount} recipient${includedCount !== 1 ? "s" : ""}`}
              </button>
            </div>

            {/* Compose fields */}
            {editorTab === "edit" && (
              <div className="flex-1 flex flex-col p-5 gap-4 overflow-auto">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Subject *</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Your email subject…"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Preview Text{" "}
                    <span className="text-slate-400 font-normal">(shows in inbox below subject)</span>
                  </label>
                  <input
                    type="text"
                    value={previewText}
                    onChange={(e) => setPreviewText(e.target.value)}
                    placeholder="Optional short preview…"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div className="flex-1 flex flex-col">
                  <label className="block text-xs font-medium text-slate-600 mb-1">HTML Body *</label>
                  <textarea
                    value={htmlBody}
                    onChange={(e) => setHtmlBody(e.target.value)}
                    placeholder="<h1>Hello!</h1><p>Your message here...</p>"
                    className="flex-1 w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                    style={{ minHeight: "320px" }}
                  />
                  <p className="mt-1.5 text-xs text-slate-400">
                    The MintSlip logo header and footer are added automatically.
                  </p>
                </div>
              </div>
            )}

            {editorTab === "preview" && (
              <div className="flex-1 overflow-hidden">
                {htmlBody ? (
                  <iframe
                    srcDoc={buildPreviewHtml(htmlBody, previewText)}
                    title="Email Preview"
                    className="w-full h-full border-0"
                    sandbox="allow-same-origin"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                    Enter HTML body to see preview
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Send status banner ── */}
        {jobStatus && (
          <div className={`mt-4 px-5 py-4 rounded-xl border flex items-start gap-3 ${
            jobStatus.status === "done" && jobStatus.failed === 0
              ? "bg-green-50 border-green-200"
              : jobStatus.status === "done"
              ? "bg-amber-50 border-amber-200"
              : "bg-blue-50 border-blue-200"
          }`}>
            {jobStatus.status === "running" ? (
              <IonSpinner name="crescent" style={{ width: 20, height: 20, color: "#3b82f6", flexShrink: 0, marginTop: 2 }} />
            ) : jobStatus.failed === 0 ? (
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-800">
                {jobStatus.status === "running"
                  ? `Sending… ${jobStatus.sent} / ${jobStatus.total}`
                  : `Done — ${jobStatus.sent} sent${jobStatus.failed > 0 ? `, ${jobStatus.failed} failed` : ""}`}
              </p>
              {jobStatus.status === "running" && (
                <div className="mt-2 h-1.5 bg-blue-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all"
                    style={{ width: `${jobStatus.total > 0 ? Math.round((jobStatus.sent / jobStatus.total) * 100) : 0}%` }}
                  />
                </div>
              )}
              {jobStatus.errors && jobStatus.errors.length > 0 && (
                <details className="mt-2">
                  <summary className="text-xs text-amber-700 cursor-pointer font-medium">
                    {jobStatus.errors.length} error{jobStatus.errors.length !== 1 ? "s" : ""}
                  </summary>
                  <ul className="mt-1 space-y-0.5 max-h-28 overflow-y-auto">
                    {jobStatus.errors.map((e, i) => (
                      <li key={i} className="text-xs text-slate-600">
                        <span className="font-medium">{e.email}</span>: {e.error}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          </div>
        )}

        {sendError && (
          <div className="mt-4 px-5 py-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700">{sendError}</p>
          </div>
        )}
      </div>

      {/* ── Confirm modal ── */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-sm mx-4 p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                <Send className="w-5 h-5 text-amber-600" />
              </div>
              <h2 className="text-base font-semibold text-slate-900">Confirm Mass Send</h2>
            </div>
            <p className="text-sm text-slate-600 mb-1">
              You are about to send{" "}
              <span className="font-semibold text-slate-900">"{subject}"</span> to{" "}
              <span className="font-semibold text-slate-900">
                {includedCount} recipient{includedCount !== 1 ? "s" : ""}
              </span>
              .
            </p>
            {excluded.size > 0 && (
              <p className="text-xs text-slate-400 mb-4">{excluded.size} recipient{excluded.size !== 1 ? "s" : ""} excluded.</p>
            )}
            {excluded.size === 0 && <div className="mb-4" />}
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmOpen(false)}
                className="flex-1 px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSend}
                className="flex-1 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium transition-colors"
              >
                Send Now
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

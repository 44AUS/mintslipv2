import { useState, useEffect, useCallback } from "react";
import AdminLayout from "@/components/AdminLayout";
import BroadcastUserPicker from "@/components/BroadcastUserPicker";
import EmailTemplateModal from "@/components/EmailTemplateModal";
import { IonButton, IonIcon } from "@ionic/react";
import { mailOutline, peopleOutline, eyeOutline, sendOutline, closeOutline, chevronForwardOutline } from "ionicons/icons";
import { toast } from "@/utils/toast";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";

const AUDIENCE_OPTIONS = [
  { value: "all", label: "All recipients" },
  { value: "registered", label: "Registered users" },
  { value: "guests", label: "Guest purchasers" },
];

const fieldLabel = { display: "block", fontSize: "0.72rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--admin-text-muted)", marginBottom: 6 };
const inputStyle = {
  width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: 8,
  border: "1px solid var(--ion-border-color)", background: "var(--ion-background-color)",
  color: "var(--ion-text-color)", fontSize: "0.9rem", outline: "none",
};

export default function AdminBroadcast() {
  const [counts, setCounts] = useState({ all: 0, registered: 0, guests: 0 });

  const [audience, setAudience] = useState("all");
  const [picked, setPicked] = useState([]); // hand-picked recipients
  const [pickerOpen, setPickerOpen] = useState(false);

  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [btnText, setBtnText] = useState("");
  const [btnUrl, setBtnUrl] = useState("");

  const [sending, setSending] = useState(false);
  const [previewHtml, setPreviewHtml] = useState(null);
  const [previewBusy, setPreviewBusy] = useState(false);
  const [result, setResult] = useState(null);

  const [templates, setTemplates] = useState([]);
  const [editingTemplate, setEditingTemplate] = useState(null);

  const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem("adminToken")}` });

  const fetchTemplates = useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/email-templates`, { headers: authHeaders() });
      const data = await res.json();
      if (data.success) setTemplates(data.templates || []);
    } catch { /* ignore */ }
  }, []);
  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

  const formatDelay = (m) => {
    if (m == null || m <= 0) return "Sent immediately";
    if (m < 60) return `Sent ${m} min after trigger`;
    if (m < 1440) return `Sent ${Math.round(m / 60)}h after trigger`;
    return `Sent ${Math.round(m / 1440)}d after trigger`;
  };

  const fetchCounts = useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/broadcast/recipients`, { headers: authHeaders() });
      const data = await res.json();
      if (data.success) setCounts(data.counts || { all: 0, registered: 0, guests: 0 });
    } catch { /* ignore */ }
  }, []);
  useEffect(() => { fetchCounts(); }, [fetchCounts]);

  const audienceCount = picked.length || counts[audience] || 0;
  const targetLabel = picked.length
    ? `${picked.length} selected recipient${picked.length === 1 ? "" : "s"}`
    : `${AUDIENCE_OPTIONS.find((o) => o.value === audience)?.label} (${counts[audience] || 0})`;

  const previewEmail = async () => {
    setPreviewBusy(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/broadcast/preview`, {
        method: "POST",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ message, button_text: btnText, button_url: btnUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Preview failed");
      setPreviewHtml(data.html);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setPreviewBusy(false);
    }
  };

  const sendEmail = async () => {
    if (!subject.trim()) { toast.error("Enter a subject line."); return; }
    if (!message.trim()) { toast.error("Enter a message."); return; }
    if (!window.confirm(`Send this email to ${targetLabel}?`)) return;
    setSending(true);
    setResult(null);
    try {
      const payload = { subject, message, button_text: btnText, button_url: btnUrl };
      if (picked.length) payload.emails = picked.map((u) => u.email);
      else payload.audience = audience;
      const res = await fetch(`${BACKEND_URL}/api/admin/broadcast/email`, {
        method: "POST",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Send failed");
      setResult(`Queued to ${data.total} recipient${data.total === 1 ? "" : "s"}.`);
      toast.success(`Broadcast queued to ${data.total} recipient${data.total === 1 ? "" : "s"}`);
      setSubject(""); setMessage(""); setBtnText(""); setBtnUrl("");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <AdminLayout>
      <div>
        <div style={{ marginBottom: 24 }}>
          <h1 className="text-2xl font-bold text-gray-900">Broadcast</h1>
          <p className="text-sm text-gray-500 mt-1">
            Send an email to an audience or hand-picked recipients ·
            {" "}{counts.all} total · {counts.registered} registered · {counts.guests} guests
          </p>
        </div>

        <div>
          <div className="chart-card">
            <h2 className="chart-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <IonIcon icon={mailOutline} style={{ color: "var(--ion-color-primary)" }} /> Send email
            </h2>
            <p className="chart-sub">Promotions, announcements, or updates.</p>

            {result && (
              <div className="admin-badge admin-badge-green" style={{ display: "block", padding: "8px 12px", marginBottom: 14, fontSize: "0.85rem" }}>
                {result}
              </div>
            )}

            {/* Audience */}
            <div style={{ marginBottom: 16 }}>
              <span style={fieldLabel}>Audience</span>
              {picked.length ? (
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 8, border: "1px solid var(--ion-border-color)", background: "var(--ion-background-color)" }}>
                  <IonIcon icon={peopleOutline} style={{ color: "var(--ion-color-primary)" }} />
                  <span style={{ flex: 1, fontSize: "0.88rem", color: "var(--ion-text-color)" }}>{picked.length} recipient{picked.length === 1 ? "" : "s"} selected</span>
                  <button type="button" onClick={() => setPickerOpen(true)} style={{ background: "none", border: "none", padding: 0, color: "var(--ion-color-primary)", fontWeight: 600, fontSize: "0.82rem", cursor: "pointer" }}>Edit</button>
                  <button type="button" onClick={() => setPicked([])} style={{ background: "none", border: "none", padding: 0, color: "var(--admin-text-muted)", fontWeight: 600, fontSize: "0.82rem", cursor: "pointer" }}>Clear</button>
                </div>
              ) : (
                <>
                  <select style={inputStyle} value={audience} onChange={(e) => setAudience(e.target.value)}>
                    {AUDIENCE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label} ({counts[o.value] || 0})</option>)}
                  </select>
                  <button type="button" onClick={() => setPickerOpen(true)}
                    style={{ background: "none", border: "none", padding: 0, marginTop: 8, color: "var(--ion-color-primary)", fontWeight: 600, fontSize: "0.82rem", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 5 }}>
                    <IonIcon icon={peopleOutline} /> Pick specific users…
                  </button>
                </>
              )}
            </div>

            <div style={{ marginBottom: 16 }}>
              <span style={fieldLabel}>Subject</span>
              <input style={inputStyle} value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject line" />
            </div>

            <div style={{ marginBottom: 16 }}>
              <span style={fieldLabel}>Message</span>
              <textarea style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit", minHeight: 140 }} rows={6} value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write your message… (leave a blank line to start a new paragraph)" />
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 18 }}>
              <div style={{ flex: "1 1 160px" }}>
                <span style={fieldLabel}>Button text (optional)</span>
                <input style={inputStyle} value={btnText} onChange={(e) => setBtnText(e.target.value)} placeholder="Create a document" />
              </div>
              <div style={{ flex: "1 1 200px" }}>
                <span style={fieldLabel}>Button link (optional)</span>
                <input style={inputStyle} value={btnUrl} onChange={(e) => setBtnUrl(e.target.value)} placeholder="https://mintslip.com/…" />
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <IonButton expand="block" fill="outline" color="medium" disabled={previewBusy || !message.trim()} onClick={previewEmail}>
                <IonIcon icon={eyeOutline} slot="start" /> {previewBusy ? "Building preview…" : "Preview email"}
              </IonButton>
              <IonButton expand="block" color="primary" disabled={sending} onClick={sendEmail}>
                <IonIcon icon={sendOutline} slot="start" /> {sending ? "Sending…" : `Send to ${audienceCount} recipient${audienceCount === 1 ? "" : "s"}`}
              </IonButton>
            </div>
          </div>

          {/* Automatic emails — editable transactional templates (whodat's
              "Automatic notifications" list below the send form) */}
          <div className="table-card" style={{ marginTop: 24 }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--ion-border-color)" }}>
              <h2 style={{ margin: 0, fontWeight: 700, fontSize: "1rem", color: "var(--admin-text)" }}>Automatic emails</h2>
              <p style={{ margin: "2px 0 0", fontSize: "0.8rem", color: "var(--admin-text-muted)" }}>
                Transactional emails MintSlip sends on its own. Click one to edit its subject, body, timing, and on/off.
              </p>
            </div>
            <div>
              {templates.map((t) => (
                <button
                  key={t.name}
                  onClick={() => setEditingTemplate(t)}
                  style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", textAlign: "left", padding: "12px 20px", background: "none", border: "none", borderBottom: "1px solid var(--ion-border-color)", cursor: "pointer" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--ion-color-step-50)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--admin-text)" }}>{t.display_name || t.name}</span>
                      {t.is_custom && <span className="admin-badge admin-badge-green">Custom</span>}
                      {t.enabled === false && <span className="admin-badge admin-badge-amber">Disabled</span>}
                      {t.is_system && <span className="admin-badge admin-badge-slate">System</span>}
                    </div>
                    <span style={{ fontSize: "0.78rem", color: "var(--admin-text-muted)" }}>
                      {t.is_scheduled ? formatDelay(t.delay_minutes) : "Sent on trigger"}
                    </span>
                  </div>
                  <IonIcon icon={chevronForwardOutline} style={{ fontSize: 18, color: "var(--admin-text-muted)", flexShrink: 0 }} />
                </button>
              ))}
              {templates.length === 0 && (
                <div style={{ padding: "32px 20px", textAlign: "center", color: "var(--admin-text-muted)", fontSize: "0.875rem" }}>No email templates found</div>
              )}
            </div>
          </div>
        </div>
      </div>

      <EmailTemplateModal
        template={editingTemplate}
        isOpen={!!editingTemplate}
        onClose={() => setEditingTemplate(null)}
        onSaved={fetchTemplates}
      />

      <BroadcastUserPicker
        isOpen={pickerOpen}
        initialSelected={picked}
        onClose={() => setPickerOpen(false)}
        onConfirm={setPicked}
      />

      {/* Email preview overlay */}
      {previewHtml && (
        <div onClick={() => setPreviewHtml(null)} style={{ position: "fixed", inset: 0, zIndex: 3000, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "var(--ion-card-background)", borderRadius: 8, width: "min(680px, 95vw)", height: "88vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", borderBottom: "1px solid var(--ion-border-color)" }}>
              <span style={{ fontWeight: 700, color: "var(--admin-text)" }}>Email preview</span>
              <button onClick={() => setPreviewHtml(null)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", color: "var(--admin-text-muted)" }}><IonIcon icon={closeOutline} style={{ fontSize: 20 }} /></button>
            </div>
            <iframe title="Email preview" srcDoc={previewHtml} style={{ flex: 1, border: "none", width: "100%", background: "#fff" }} />
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

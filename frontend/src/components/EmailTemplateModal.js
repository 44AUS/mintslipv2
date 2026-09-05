import { useEffect, useState } from "react";
import {
  IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, IonIcon,
} from "@ionic/react";
import { closeOutline } from "ionicons/icons";
import { toast } from "@/utils/toast";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";

// Placeholders available per transactional template (shown as a hint).
const TEMPLATE_VARS = {
  welcome: ["user_name", "user_email", "SITE_URL"],
  email_verification: ["user_name", "verification_code", "verification_link"],
  getting_started: ["user_name", "SITE_URL"],
  subscription_thank_you: ["user_name", "plan_name", "plan_price", "downloads_per_month", "SITE_URL"],
  download_confirmation: ["user_name", "doc_name", "SITE_URL"],
  signup_no_purchase: ["user_name", "SITE_URL"],
  abandoned_checkout: ["user_name", "doc_name", "SITE_URL"],
  review_request: ["user_name", "doc_name", "TRUSTPILOT_URL"],
  password_changed: ["user_name", "SITE_URL"],
  password_reset: ["user_name", "reset_link", "reset_code"],
};

const label = { display: "block", fontSize: "0.72rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--admin-text-muted)", marginBottom: 6 };
const input = {
  width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: 8,
  border: "1px solid var(--ion-border-color)", background: "var(--ion-background-color)",
  color: "var(--ion-text-color)", fontSize: "0.9rem", outline: "none",
};

// Edit one transactional email template — mintslip's counterpart to whodat's
// NotifTemplateModal. Save writes the template (and delay/enabled); Reset
// restores the built-in default.
export default function EmailTemplateModal({ template, isOpen, onClose, onSaved }) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [previewText, setPreviewText] = useState("");
  const [delay, setDelay] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!template) return;
    setSubject(template.subject || "");
    setBody(template.html_body || "");
    setPreviewText(template.preview_text || "");
    setDelay(template.delay_minutes != null ? String(template.delay_minutes) : "");
    setEnabled(template.enabled !== false);
  }, [template]);

  if (!template) return null;
  const vars = TEMPLATE_VARS[template.name] || [];
  const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem("adminToken")}`, "Content-Type": "application/json" });

  const save = async () => {
    if (!subject.trim() || !body.trim()) { toast.error("Subject and body are required."); return; }
    setBusy(true);
    try {
      const r1 = await fetch(`${BACKEND_URL}/api/admin/email-templates/${template.name}`, {
        method: "PUT", headers: authHeaders(),
        body: JSON.stringify({ subject, html_body: body, preview_text: previewText }),
      });
      if (!r1.ok) throw new Error("Failed to save template");
      const settings = {};
      if (!template.is_system) settings.enabled = enabled;
      if (template.is_scheduled && delay !== "") settings.delay_minutes = parseInt(delay, 10) || null;
      if (Object.keys(settings).length) {
        await fetch(`${BACKEND_URL}/api/admin/email-settings/${template.name}`, {
          method: "PUT", headers: authHeaders(), body: JSON.stringify(settings),
        });
      }
      toast.success("Template saved");
      onSaved?.();
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const reset = async () => {
    if (!window.confirm("Reset this email to the built-in default text?")) return;
    setBusy(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/email-templates/${template.name}`, {
        method: "DELETE", headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}` },
      });
      if (!res.ok) throw new Error("Failed to reset template");
      toast.success("Template reset to default");
      onSaved?.();
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <IonModal isOpen={isOpen && !!template} onDidDismiss={onClose} className="admin-detail-modal">
      <IonHeader>
        <IonToolbar>
          <IonTitle>{template.display_name || template.name}</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={onClose} aria-label="Close"><IonIcon icon={closeOutline} slot="icon-only" /></IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <div style={{ padding: "18px 20px 24px" }}>
          <p style={{ margin: "0 0 6px", fontSize: "0.8rem", color: "var(--admin-text-muted)" }}>
            {template.is_custom ? "Using a custom template." : "Using the default — edits override it."}
            {template.is_scheduled ? " Sent on a delay." : ""}
          </p>
          {vars.length > 0 && (
            <p style={{ margin: "0 0 16px", fontSize: "0.75rem", color: "var(--admin-text-muted)" }}>
              Placeholders: {vars.map((v) => `{${v}}`).join(", ")}
            </p>
          )}

          {!template.is_system && (
            <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, fontSize: "0.85rem", color: "var(--admin-text)" }}>
              <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
              Email enabled
            </label>
          )}

          {template.is_scheduled && (
            <div style={{ marginBottom: 16 }}>
              <span style={label}>Send delay (minutes after trigger)</span>
              <input type="number" min="0" style={{ ...input, width: 160 }} value={delay} onChange={(e) => setDelay(e.target.value)} placeholder="e.g. 15" />
            </div>
          )}

          <div style={{ marginBottom: 16 }}>
            <span style={label}>Subject</span>
            <input style={input} value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject line" />
          </div>
          <div style={{ marginBottom: 16 }}>
            <span style={label}>Email body (HTML — goes inside the base template)</span>
            <textarea style={{ ...input, resize: "vertical", fontFamily: "monospace", fontSize: "0.82rem", minHeight: 200 }} rows={10} value={body} onChange={(e) => setBody(e.target.value)} />
          </div>
          <div style={{ marginBottom: 18 }}>
            <span style={label}>Preview text (inbox snippet, optional)</span>
            <input style={input} value={previewText} onChange={(e) => setPreviewText(e.target.value)} placeholder="Shown after the subject in the inbox" />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <IonButton expand="block" color="primary" disabled={busy} onClick={save}>{busy ? "Saving…" : "Save"}</IonButton>
            {template.is_custom && (
              <IonButton expand="block" fill="outline" color="medium" disabled={busy} onClick={reset}>Reset to default</IonButton>
            )}
          </div>
        </div>
      </IonContent>
    </IonModal>
  );
}

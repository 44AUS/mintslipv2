import { useState, useEffect, useRef } from "react";
import {
  IonButton, IonIcon, IonSpinner, IonSegment, IonSegmentButton, IonLabel,
  IonModal, IonHeader, IonToolbar, IonTitle, IonButtons,
  IonContent as IonModalContent,
} from "@ionic/react";
import {
  mailOutline, searchOutline, peopleOutline, sendOutline, eyeOutline,
  codeSlashOutline, checkmarkCircleOutline, alertCircleOutline,
  closeOutline, checkboxOutline, squareOutline, refreshOutline,
} from "ionicons/icons";
import AdminLayout from "@/components/AdminLayout";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";

// Mirror of backend email_service.get_base_template — whodat-style frame in
// MintSlip green, so the preview matches what recipients receive.
const BASE_PREVIEW_STYLES = `
  body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
  .button{display:inline-block;box-sizing:border-box;padding:14px 30px;background-color:#16a34a;background-image:linear-gradient(135deg,#22c55e,#16a34a 60%,#15803d);color:#fff;text-decoration:none;border-radius:10px;font-weight:700;font-size:15px;box-shadow:0 4px 14px rgba(22,163,74,0.32);}
  .highlight{background-color:#f0fdf4;padding:16px;border-radius:10px;border-left:4px solid #16a34a;}
  h1 { color: #0f172a; margin: 0 0 12px; font-size:22px; font-weight:800; letter-spacing:-0.01em; }
  h2 { color: #0f172a; margin: 0 0 12px; font-size:19px; font-weight:700; }
  p { color: #334155; line-height: 1.65; font-size:15px; }
  ul { color:#334155; line-height:1.8; font-size:15px; }
  a { color:#16a34a; }
  .text-muted{color:#64748b;}
`;

function buildPreviewHtml(htmlBody, previewText) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${BASE_PREVIEW_STYLES}</style></head><body style="margin:0;padding:0;background:#f0fdf4;">
    ${previewText ? `<span style="display:none;max-height:0;overflow:hidden;">${previewText}</span>` : ""}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;"><tr><td align="center" style="padding:36px 16px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(15,23,42,0.08);">
        <tr><td style="background-color:#16a34a;background-image:linear-gradient(135deg,#22c55e 0%,#16a34a 55%,#15803d 100%);padding:28px 32px;text-align:center;">
          <span style="display:inline-block;background:#fff;border-radius:12px;padding:10px 18px;"><img src="/mintslip-logo.png" alt="MintSlip" style="height:30px;width:auto;display:block;" /></span>
        </td></tr>
        <tr><td style="padding:36px 32px 34px;color:#0f172a;">${htmlBody}</td></tr>
      </table>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;"><tr><td style="padding:20px 12px 0;text-align:center;color:#94a3b8;font-size:12px;line-height:1.6;">
        © ${new Date().getFullYear()} MintSlip · You're receiving this because you have a MintSlip account.<br><a href="#" style="color:#94a3b8;text-decoration:underline;">mintslip.com</a>
      </td></tr></table>
    </td></tr></table></body></html>`;
}

const segBtnStyle = { "--border-radius": "0", "--padding-top": "0", "--padding-bottom": "0" };

const fieldLabel = {
  display: "block", fontSize: "0.72rem", fontWeight: 600,
  color: "var(--ion-color-medium)", marginBottom: 6,
  textTransform: "uppercase", letterSpacing: "0.05em",
};

const inputStyle = {
  width: "100%", boxSizing: "border-box",
  padding: "9px 12px", borderRadius: 8,
  border: "1px solid var(--ion-border-color)",
  background: "var(--ion-background-color)",
  color: "var(--ion-text-color)", fontSize: "0.875rem",
  outline: "none",
};

export default function AdminMassEmail() {
  const [recipients,   setRecipients]   = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState("");
  const [excluded,     setExcluded]     = useState(new Set());

  const [subject,      setSubject]      = useState("");
  const [previewText,  setPreviewText]  = useState("");
  const [htmlBody,     setHtmlBody]     = useState("");
  const [editorTab,    setEditorTab]    = useState("edit");   // "edit" | "preview"

  const [sending,      setSending]      = useState(false);
  const [jobId,        setJobId]        = useState(null);
  const [jobStatus,    setJobStatus]    = useState(null);
  const [sendError,    setSendError]    = useState("");
  const [confirmOpen,  setConfirmOpen]  = useState(false);

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
    } catch {}
    setLoading(false);
  };

  const filteredRecipients = recipients.filter(r => {
    const q = search.toLowerCase();
    return r.email.includes(q) || (r.name || "").toLowerCase().includes(q);
  });

  const allFilteredSelected = filteredRecipients.length > 0 && filteredRecipients.every(r => !excluded.has(r.email));
  const includedCount = recipients.filter(r => !excluded.has(r.email)).length;

  const toggleExclude = email => {
    setExcluded(prev => { const n = new Set(prev); n.has(email) ? n.delete(email) : n.add(email); return n; });
  };

  const toggleSelectAll = () => {
    setExcluded(prev => {
      const n = new Set(prev);
      if (allFilteredSelected) filteredRecipients.forEach(r => n.add(r.email));
      else filteredRecipients.forEach(r => n.delete(r.email));
      return n;
    });
  };

  const pollStatus = id => {
    pollRef.current = setInterval(async () => {
      try {
        const token = localStorage.getItem("adminToken");
        const res = await fetch(`${BACKEND_URL}/api/admin/mass-email/status/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setJobStatus(data);
          if (data.status === "done") { clearInterval(pollRef.current); setSending(false); }
        }
      } catch {}
    }, 1500);
  };

  const handleSend = async () => {
    setConfirmOpen(false); setSending(true); setSendError(""); setJobStatus(null); setJobId(null);
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`${BACKEND_URL}/api/admin/mass-email/send`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ subject, html_body: htmlBody, preview_text: previewText, excluded_emails: Array.from(excluded) }),
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
    } catch {
      setSendError("Network error. Please try again.");
      setSending(false);
    }
  };

  const canSend = subject.trim() && htmlBody.trim() && includedCount > 0 && !sending;
  const progress = jobStatus?.total > 0 ? Math.round((jobStatus.sent / jobStatus.total) * 100) : 0;

  return (
    <AdminLayout fillHeight>
      <div style={{ padding: 10, height: "100%", boxSizing: "border-box", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: "4px 6px" }}>
          <div style={{
            display: "flex", flex: "1 1 0%", overflow: "hidden",
            background: "var(--ion-card-background)",
            borderRadius: 6, boxShadow: "0 4px 24px rgba(0,0,0,0.18)",
          }}>

            {/* ── LEFT PANEL — Recipients ── */}
            <div style={{
              width: 280, flexShrink: 0,
              borderRight: "1px solid var(--ion-border-color)",
              display: "flex", flexDirection: "column", height: "100%",
            }}>

              {/* header */}
              <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--ion-border-color)", flexShrink: 0 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <IonIcon icon={peopleOutline} style={{ fontSize: 18, color: "var(--ion-color-primary)" }} />
                    <span style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--ion-text-color)" }}>Recipients</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{
                      fontSize: "0.7rem", fontWeight: 700, padding: "2px 8px", borderRadius: 20,
                      background: "rgba(var(--ion-color-primary-rgb),0.12)", color: "var(--ion-color-primary)",
                    }}>
                      {loading ? "…" : `${includedCount} / ${recipients.length}`}
                    </span>
                    <IonButton fill="clear" size="small" color="medium" onClick={fetchRecipients} style={{ "--border-radius": "50%", "--padding-start": "4px", "--padding-end": "4px" }}>
                      <IonIcon slot="icon-only" icon={refreshOutline} style={{ fontSize: 16 }} />
                    </IonButton>
                  </div>
                </div>

                {/* search */}
                <div style={{ position: "relative" }}>
                  <IonIcon icon={searchOutline} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: "var(--ion-color-medium)", pointerEvents: "none" }} />
                  <input
                    type="text"
                    placeholder="Search name or email…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    style={{ ...inputStyle, paddingLeft: 30, fontSize: "0.8rem" }}
                  />
                </div>
              </div>

              {/* select-all row */}
              {!loading && filteredRecipients.length > 0 && (
                <div
                  onClick={toggleSelectAll}
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "8px 16px", cursor: "pointer",
                    borderBottom: "1px solid var(--ion-border-color)",
                    background: "var(--ion-background-color)",
                  }}
                >
                  <IonIcon
                    icon={allFilteredSelected ? checkboxOutline : squareOutline}
                    style={{ fontSize: 18, color: allFilteredSelected ? "var(--ion-color-primary)" : "var(--ion-color-medium)", flexShrink: 0 }}
                  />
                  <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--ion-color-medium)" }}>
                    {allFilteredSelected ? "Deselect all" : "Select all"}{search ? " matching" : ""}
                  </span>
                </div>
              )}

              {/* list */}
              <div style={{ flex: "1 1 0%", overflowY: "auto" }}>
                {loading ? (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
                    <IonSpinner name="crescent" color="primary" style={{ width: 24, height: 24 }} />
                  </div>
                ) : filteredRecipients.length === 0 ? (
                  <p style={{ textAlign: "center", padding: "24px 16px", fontSize: "0.8rem", color: "var(--ion-color-medium)" }}>
                    No recipients found.
                  </p>
                ) : (
                  filteredRecipients.map(r => {
                    const isExcluded = excluded.has(r.email);
                    return (
                      <div
                        key={r.email}
                        onClick={() => toggleExclude(r.email)}
                        style={{
                          display: "flex", alignItems: "center", gap: 10,
                          padding: "9px 16px", cursor: "pointer",
                          borderBottom: "1px solid var(--ion-border-color)",
                          opacity: isExcluded ? 0.4 : 1,
                          background: "transparent",
                          transition: "background 0.1s",
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = isExcluded ? "rgba(0,0,0,0.03)" : "rgba(var(--ion-color-primary-rgb),0.05)"}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                      >
                        <IonIcon
                          icon={isExcluded ? squareOutline : checkboxOutline}
                          style={{ fontSize: 18, flexShrink: 0, color: isExcluded ? "var(--ion-color-medium)" : "var(--ion-color-primary)" }}
                        />
                        <div style={{ minWidth: 0 }}>
                          {r.name && (
                            <p style={{ margin: 0, fontSize: "0.78rem", fontWeight: 600, color: "var(--ion-text-color)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {r.name}
                            </p>
                          )}
                          <p style={{ margin: 0, fontSize: "0.72rem", color: "var(--ion-color-medium)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {r.email}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* excluded footer */}
              {excluded.size > 0 && (
                <div style={{ padding: "8px 16px", borderTop: "1px solid var(--ion-border-color)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
                  <span style={{ fontSize: "0.75rem", color: "var(--ion-color-medium)" }}>{excluded.size} excluded</span>
                  <IonButton fill="clear" size="small" color="primary" onClick={() => setExcluded(new Set())} style={{ "--padding-start": "4px", "--padding-end": "4px" }}>
                    <IonIcon slot="start" icon={closeOutline} style={{ fontSize: 12 }} />
                    <span style={{ fontSize: "0.72rem" }}>Clear</span>
                  </IonButton>
                </div>
              )}
            </div>

            {/* ── RIGHT PANEL — Compose ── */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>

              {/* toolbar */}
              <div style={{
                display: "flex", alignItems: "stretch",
                borderBottom: "1px solid var(--ion-border-color)", flexShrink: 0,
              }}>
                <IonSegment
                  value={editorTab}
                  onIonChange={e => setEditorTab(e.detail.value)}
                  style={{ "--background": "transparent", flex: "1 1 0%" }}
                >
                  {[
                    { value: "edit",    label: "HTML Editor", icon: codeSlashOutline },
                    { value: "preview", label: "Preview",     icon: eyeOutline },
                  ].map(tab => (
                    <IonSegmentButton key={tab.value} value={tab.value} layout="label-only" style={segBtnStyle}>
                      <IonLabel style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700, letterSpacing: "0.06em", whiteSpace: "nowrap" }}>
                        <IonIcon icon={tab.icon} style={{ fontSize: 15 }} />
                        {tab.label}
                      </IonLabel>
                    </IonSegmentButton>
                  ))}
                </IonSegment>

                {/* send button */}
                <div style={{ display: "flex", alignItems: "center", padding: "0 12px", flexShrink: 0, borderLeft: "1px solid var(--ion-border-color)" }}>
                  <IonButton
                    disabled={!canSend}
                    onClick={() => setConfirmOpen(true)}
                    style={{ "--background": "#2dd36f", "--background-activated": "#28ba62", "--border-radius": "8px", "--color": "#fff", fontWeight: 700 }}
                    size="small"
                  >
                    {sending
                      ? <IonSpinner name="crescent" style={{ width: 16, height: 16, marginRight: 6 }} />
                      : <IonIcon slot="start" icon={sendOutline} style={{ fontSize: 15 }} />}
                    {sending ? "Sending…" : `Send to ${includedCount}`}
                  </IonButton>
                </div>
              </div>

              {/* compose / preview */}
              {editorTab === "edit" ? (
                <div style={{ flex: "1 1 0%", overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
                  <div>
                    <label style={fieldLabel}>Subject *</label>
                    <input type="text" value={subject} onChange={e => setSubject(e.target.value)} placeholder="Your email subject…" style={inputStyle} />
                  </div>
                  <div>
                    <label style={fieldLabel}>
                      Preview Text{" "}
                      <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(shows in inbox below subject)</span>
                    </label>
                    <input type="text" value={previewText} onChange={e => setPreviewText(e.target.value)} placeholder="Optional short preview…" style={inputStyle} />
                  </div>
                  <div style={{ flex: "1 1 0%", display: "flex", flexDirection: "column" }}>
                    <label style={fieldLabel}>HTML Body *</label>
                    <textarea
                      value={htmlBody}
                      onChange={e => setHtmlBody(e.target.value)}
                      placeholder="<h1>Hello!</h1>&#10;<p>Your message here...</p>"
                      style={{
                        ...inputStyle, flex: "1 1 0%", resize: "none",
                        fontFamily: "monospace", fontSize: "0.8rem", lineHeight: 1.6,
                        minHeight: 280,
                      }}
                    />
                    <p style={{ margin: "6px 0 0", fontSize: "0.72rem", color: "var(--ion-color-medium)" }}>
                      MintSlip logo header and unsubscribe footer are added automatically.
                    </p>
                  </div>

                  {/* status banner inside compose panel */}
                  {(jobStatus || sendError) && (
                    <div style={{
                      padding: "12px 16px", borderRadius: 8,
                      border: `1px solid ${sendError ? "var(--ion-color-danger)" : jobStatus?.status === "done" && jobStatus?.failed === 0 ? "var(--ion-color-success)" : "var(--ion-color-primary)"}`,
                      background: sendError ? "rgba(235,68,90,0.07)" : jobStatus?.status === "done" && jobStatus?.failed === 0 ? "rgba(45,211,111,0.07)" : "rgba(var(--ion-color-primary-rgb),0.06)",
                      display: "flex", alignItems: "flex-start", gap: 10,
                    }}>
                      {sendError ? (
                        <IonIcon icon={alertCircleOutline} style={{ color: "var(--ion-color-danger)", fontSize: 20, flexShrink: 0 }} />
                      ) : jobStatus?.status === "running" ? (
                        <IonSpinner name="crescent" style={{ width: 20, height: 20, flexShrink: 0 }} />
                      ) : (
                        <IonIcon icon={checkmarkCircleOutline} style={{ color: "var(--ion-color-success)", fontSize: 20, flexShrink: 0 }} />
                      )}
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontSize: "0.85rem", fontWeight: 600, color: "var(--ion-text-color)" }}>
                          {sendError ||
                            (jobStatus?.status === "running"
                              ? `Sending… ${jobStatus.sent} / ${jobStatus.total}`
                              : `Done — ${jobStatus?.sent} sent${jobStatus?.failed > 0 ? `, ${jobStatus.failed} failed` : ""}`)}
                        </p>
                        {jobStatus?.status === "running" && (
                          <div style={{ marginTop: 8, height: 4, borderRadius: 2, background: "var(--ion-border-color)", overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${progress}%`, background: "var(--ion-color-primary)", borderRadius: 2, transition: "width 0.4s" }} />
                          </div>
                        )}
                        {jobStatus?.errors?.length > 0 && (
                          <details style={{ marginTop: 6 }}>
                            <summary style={{ fontSize: "0.75rem", color: "var(--ion-color-warning)", cursor: "pointer", fontWeight: 600 }}>
                              {jobStatus.errors.length} error{jobStatus.errors.length !== 1 ? "s" : ""}
                            </summary>
                            <ul style={{ margin: "4px 0 0", paddingLeft: 16, maxHeight: 100, overflowY: "auto" }}>
                              {jobStatus.errors.map((e, i) => (
                                <li key={i} style={{ fontSize: "0.72rem", color: "var(--ion-color-medium)" }}>
                                  <b>{e.email}</b>: {e.error}
                                </li>
                              ))}
                            </ul>
                          </details>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ flex: "1 1 0%", overflow: "hidden" }}>
                  {htmlBody ? (
                    <iframe
                      srcDoc={buildPreviewHtml(htmlBody, previewText)}
                      title="Email Preview"
                      style={{ width: "100%", height: "100%", border: "none" }}
                      sandbox="allow-same-origin"
                    />
                  ) : (
                    <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ion-color-medium)", fontSize: "0.875rem" }}>
                      Enter HTML body to see preview
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Confirm modal ── */}
      <IonModal isOpen={confirmOpen} onDidDismiss={() => setConfirmOpen(false)} style={{ "--width": "420px", "--max-width": "92vw", "--height": "auto" }}>
        <IonHeader>
          <IonToolbar style={{ "--background": "var(--ion-card-background)" }}>
            <IonTitle style={{ fontWeight: 700 }}>Confirm Mass Send</IonTitle>
            <IonButtons slot="end">
              <IonButton fill="clear" color="medium" onClick={() => setConfirmOpen(false)}>
                <IonIcon slot="icon-only" icon={closeOutline} />
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonModalContent style={{ "--background": "var(--ion-card-background)" }}>
          <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(45,211,111,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <IonIcon icon={sendOutline} style={{ fontSize: 22, color: "#2dd36f" }} />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--ion-text-color)", lineHeight: 1.5 }}>
                  You're about to send <strong>"{subject}"</strong> to{" "}
                  <strong>{includedCount} recipient{includedCount !== 1 ? "s" : ""}</strong>.
                </p>
                {excluded.size > 0 && (
                  <p style={{ margin: "4px 0 0", fontSize: "0.75rem", color: "var(--ion-color-medium)" }}>
                    {excluded.size} recipient{excluded.size !== 1 ? "s" : ""} excluded.
                  </p>
                )}
              </div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <IonButton fill="outline" color="medium" expand="block" onClick={() => setConfirmOpen(false)} style={{ flex: 1 }}>
                Cancel
              </IonButton>
              <IonButton expand="block" onClick={handleSend} style={{ flex: 1, "--background": "#2dd36f", "--color": "#fff", fontWeight: 700 }}>
                <IonIcon slot="start" icon={sendOutline} />
                Send Now
              </IonButton>
            </div>
          </div>
        </IonModalContent>
      </IonModal>
    </AdminLayout>
  );
}

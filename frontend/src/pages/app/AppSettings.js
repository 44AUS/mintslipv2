import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import {
  IonPage, IonContent, IonIcon, IonBadge, IonToggle,
  IonSegment, IonSegmentButton, IonLabel,
} from "@ionic/react";
import {
  globeOutline, moonOutline, helpCircleOutline,
  playCircleOutline, calendarOutline, sendOutline, bugOutline,
  codeSlashOutline, keyOutline,
  documentTextOutline, shieldOutline, chevronForwardOutline,
} from "ionicons/icons";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";

const cardStyle = {
  backgroundColor: "var(--ion-card-background)",
  borderRadius: 12,
  overflow: "hidden",
  boxShadow: "rgba(0,0,0,0.18) 0 4px 24px",
};

const cardTitle = {
  fontSize: "1rem", fontWeight: 700,
  color: "var(--ion-text-color)",
  padding: "14px 20px 12px",
};

function Chevron() {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", lineHeight: 0, flexShrink: 0, fontSize: 18, color: "var(--ion-color-medium)" }}>
      <IonIcon icon={chevronForwardOutline} style={{ fontSize: "inherit", color: "inherit", pointerEvents: "none" }} />
    </span>
  );
}

function IconWrap({ icon }) {
  return (
    <div style={{ width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginBottom: 14 }}>
      <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", lineHeight: 0, flexShrink: 0, fontSize: 17, color: "var(--ion-color-medium)" }}>
        <IonIcon icon={icon} style={{ fontSize: "inherit", color: "inherit", pointerEvents: "none" }} />
      </span>
    </div>
  );
}

function Row({ icon, label, right, last, clickable, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 0 0 20px", cursor: clickable ? "pointer" : "default" }}
    >
      {icon && <IconWrap icon={icon} />}
      <div style={{
        flex: "1 1 0%", display: "flex", alignItems: "center",
        paddingBottom: 14, paddingRight: 20,
        borderBottom: last ? "none" : "1px solid var(--ion-border-color)",
        minWidth: 0,
      }}>
        <span style={{ flex: "1 1 0%", fontSize: "0.9rem", fontWeight: 500, color: "var(--ion-text-color)" }}>{label}</span>
        {right}
      </div>
    </div>
  );
}

export default function AppSettings() {
  const navigate = useNavigate();

  const [settings, setSettings] = useState({
    version: "1.0.0", status: "normal", videoUrl: "", whatsNew: [], knownIssues: ["None :)"],
  });

  const [darkMode,  setDarkMode]  = useState(() => localStorage.getItem("appDarkMode") === "true");
  const [language,  setLanguage]  = useState(() => localStorage.getItem("appLanguage") || "en");
  const [showHelp,  setShowHelp]  = useState(() => localStorage.getItem("appShowHelp") === "true");
  const [showToken, setShowToken] = useState(false);

  const userToken = (() => {
    try {
      const info = JSON.parse(localStorage.getItem("userInfo") || "{}");
      return info.token || localStorage.getItem("userToken") || null;
    } catch { return null; }
  })();

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/app-settings`)
      .then(r => r.json())
      .then(d => { if (d.success && d.settings) setSettings(d.settings); })
      .catch(() => {});
  }, []);

  const handleDark = () => {
    const next = !darkMode;
    setDarkMode(next);
    localStorage.setItem("appDarkMode", String(next));
    document.body.classList.toggle("dark", next);
  };

  const handleLanguage = (val) => {
    setLanguage(val);
    localStorage.setItem("appLanguage", val);
  };

  const handleHelp = () => {
    const next = !showHelp;
    setShowHelp(next);
    localStorage.setItem("appShowHelp", String(next));
  };

  const statusColor = { normal: "success", degraded: "warning", down: "danger" }[settings.status] || "success";
  const statusLabel = { normal: "Normal", degraded: "Degraded", down: "Down" }[settings.status] || "Normal";

  const segStyle = {
    "--background": "rgba(255,255,255,0.08)",
    minHeight: 30, width: "auto", marginLeft: "auto",
  };
  const segBtnStyle = {
    "--indicator-color": "var(--ion-card-background)",
    "--color": "var(--ion-color-medium)",
    "--color-checked": "var(--ion-text-color)",
    "--border-radius": "6px",
    "--indicator-box-shadow": "0 1px 4px rgba(0,0,0,0.15)",
    minHeight: 26, minWidth: 0,
  };

  return (
    <AppLayout>
      <IonPage>
        <IonContent>
          <div style={{ maxWidth: 1200, margin: "0 auto", padding: "8px 0 48px" }}>

            {/* Status */}
            <div style={{ marginBottom: 28 }}>
              <div style={cardStyle}>
                <div style={cardTitle}>Status</div>

                <Row label="App Status" right={<IonBadge color={statusColor}>{statusLabel}</IonBadge>} />
                <Row
                  label={`Current version: ${settings.version}`}
                  right={<span style={{ fontSize: "0.8rem", color: "var(--ion-color-medium)" }}>Latest: {settings.version}</span>}
                />

                {settings.videoUrl && (
                  <div style={{ padding: "16px 20px" }}>
                    <div style={{ maxWidth: 600, width: "100%" }}>
                      <div style={{ position: "relative", paddingBottom: "56.25%", height: 0, borderRadius: 8, overflow: "hidden" }}>
                        <iframe
                          src={settings.videoUrl}
                          title="What's New"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none" }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {settings.whatsNew && settings.whatsNew.length > 0 && (
                  <div style={{ paddingLeft: 20 }}>
                    <div style={{ paddingBottom: 14, paddingRight: 20, borderBottom: "1px solid var(--ion-border-color)" }}>
                      <div style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--ion-color-medium)", marginBottom: 8 }}>What's New</div>
                      <ul style={{ margin: 0, padding: "0 0 0 20px", display: "flex", flexDirection: "column", gap: 5, listStyleType: "disc" }}>
                        {settings.whatsNew.map((item, i) => (
                          <li key={i} style={{ fontSize: "0.875rem", color: "var(--ion-text-color)", lineHeight: 1.6 }}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                <div style={{ padding: "14px 20px" }}>
                  <div style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--ion-color-medium)", marginBottom: 8 }}>Known Issues</div>
                  <ul style={{ margin: 0, padding: "0 0 0 16px", display: "flex", flexDirection: "column", gap: 5 }}>
                    {(settings.knownIssues?.length ? settings.knownIssues : ["None :)"]).map((item, i) => (
                      <li key={i} style={{ fontSize: "0.875rem", color: "var(--ion-color-medium)", lineHeight: 1.6 }}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Appearance */}
            <div style={{ marginBottom: 28 }}>
              <div style={cardStyle}>
                <div style={cardTitle}>Appearance</div>
                <Row
                  icon={globeOutline}
                  label="Language"
                  right={
                    <IonSegment mode="ios" value={language} onIonChange={e => handleLanguage(e.detail.value)} style={segStyle}>
                      {[["en","English"],["es","Español"],["fr","Français"]].map(([v, l]) => (
                        <IonSegmentButton key={v} value={v} style={segBtnStyle}>
                          <IonLabel style={{ fontSize: "0.72rem", fontWeight: 600, margin: "3px 0" }}>{l}</IonLabel>
                        </IonSegmentButton>
                      ))}
                    </IonSegment>
                  }
                />
                <Row
                  icon={moonOutline}
                  label="Dark theme"
                  right={
                    <IonToggle
                      checked={darkMode}
                      onIonChange={handleDark}
                      style={{ "--handle-width": "20px", "--handle-height": "20px" }}
                    />
                  }
                />
                <Row
                  icon={helpCircleOutline}
                  label="Show help button"
                  last
                  right={
                    <IonToggle
                      checked={showHelp}
                      onIonChange={handleHelp}
                      style={{ "--handle-width": "20px", "--handle-height": "20px" }}
                    />
                  }
                />
              </div>
            </div>

            {/* Support */}
            <div style={{ marginBottom: 28 }}>
              <div style={cardStyle}>
                <div style={cardTitle}>Support</div>
                <Row icon={playCircleOutline} label="Tutorials" clickable right={<Chevron />} onClick={() => navigate("/faq")} />
                <Row icon={calendarOutline}    label="Book a Q&A" clickable right={<Chevron />} onClick={() => window.open("mailto:support@mintslip.com?subject=Q%26A%20Session")} />
                <Row icon={calendarOutline}    label="Book a Demo" clickable right={<Chevron />} onClick={() => window.open("mailto:support@mintslip.com?subject=Demo%20Request")} />
                <Row icon={sendOutline}        label="Feature Request" clickable right={<Chevron />} onClick={() => window.open("mailto:support@mintslip.com?subject=Feature%20Request")} />
                <Row icon={bugOutline}         label="Report a Problem" clickable last right={<Chevron />} onClick={() => window.open("mailto:support@mintslip.com?subject=Bug%20Report")} />
              </div>
            </div>

            {/* Developer */}
            <div style={{ marginBottom: 28 }}>
              <div style={cardStyle}>
                <div style={cardTitle}>Developer</div>
                <Row icon={codeSlashOutline} label="API Reference" clickable right={<Chevron />} onClick={() => window.open("https://mintslip.com/api-docs")} />
                <Row
                  icon={keyOutline}
                  label="Access Token"
                  last
                  right={
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: "0.78rem", color: "var(--ion-color-medium)", fontFamily: "monospace", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {userToken ? (showToken ? userToken : "••••••••••••••••••••••••••••••••••••") : "Not available"}
                      </span>
                      {userToken && (
                        <button
                          onClick={() => setShowToken(v => !v)}
                          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ion-color-primary)", fontWeight: 700, fontSize: "0.75rem", letterSpacing: "0.05em", fontFamily: "inherit", padding: "4px 8px" }}
                        >
                          {showToken ? "HIDE" : "SHOW"}
                        </button>
                      )}
                    </div>
                  }
                />
              </div>
            </div>

            {/* About */}
            <div style={{ marginBottom: 28 }}>
              <div style={cardStyle}>
                <div style={cardTitle}>About</div>
                <Row icon={documentTextOutline} label="Terms of Service" clickable right={<Chevron />} onClick={() => navigate("/app/terms")} />
                <Row icon={shieldOutline}       label="Privacy Policy"   clickable last right={<Chevron />} onClick={() => navigate("/app/privacy")} />
              </div>
            </div>

            <div style={{ textAlign: "center", color: "var(--ion-color-step-400)", fontSize: "0.78rem", marginTop: 8 }}>
              v{settings.version}
            </div>

          </div>
        </IonContent>
      </IonPage>
    </AppLayout>
  );
}

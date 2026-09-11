import { useState, useEffect, useRef } from "react";
import { IonButton, IonIcon } from "@ionic/react";
import { closeOutline } from "ionicons/icons";
import { Capacitor } from "@capacitor/core";

// Whodat's update banner, ported. Polls the app's own root URL every
// 5 minutes; if its ETag/Last-Modified changes (a new Vercel deploy went
// out), shows a toast-style banner asking the user to refresh. No service
// worker needed. Skipped in the native app, which updates through the app
// store, not a redeploy.
const POLL_INTERVAL = 5 * 60 * 1000;

async function fetchVersion() {
  try {
    const r = await fetch("/", {
      method: "HEAD",
      cache: "no-store",
      headers: { pragma: "no-cache", "cache-control": "no-cache" },
    });
    if (!r.ok) return null;
    return r.headers.get("etag") || r.headers.get("last-modified") || null;
  } catch {
    return null;
  }
}

export default function UpdateNotifier() {
  const [visible, setVisible] = useState(false);
  const versionRef = useRef(null);

  useEffect(() => {
    if (Capacitor.isNativePlatform()) return undefined;
    let alive = true;
    const check = async () => {
      const version = await fetchVersion();
      if (!alive || !version) return;
      if (versionRef.current === null) versionRef.current = version;
      else if (version !== versionRef.current) setVisible(true);
    };
    check();
    const id = setInterval(check, POLL_INTERVAL);
    return () => { alive = false; clearInterval(id); };
  }, []);

  if (!visible) return null;

  return (
    <div style={{
      position: "fixed",
      top: "calc(12px + env(safe-area-inset-top, 0px))",
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: 20000,
      width: "min(calc(100% - 32px), 560px)",
      borderRadius: 12,
      background: "var(--ion-card-background, #ffffff)",
      color: "var(--ion-text-color, #0f172a)",
      border: "1px solid var(--app-divider, rgba(15, 23, 42, 0.12))",
      boxShadow: "0 6px 28px rgba(0, 0, 0, 0.22)",
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "6px 6px 6px 14px",
    }}>
      <button
        onClick={() => setVisible(false)}
        aria-label="Dismiss"
        style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ion-color-medium, #64748b)", display: "flex", alignItems: "center", padding: 4, flexShrink: 0 }}
      >
        <IonIcon icon={closeOutline} style={{ fontSize: 18 }} />
      </button>
      <span style={{ flex: 1, fontWeight: 600, fontSize: "0.9rem", lineHeight: 1.3 }}>
        A new version of MintSlip is available
      </span>
      <IonButton size="small" onClick={() => window.location.reload()} style={{ flexShrink: 0 }}>
        Refresh
      </IonButton>
    </div>
  );
}

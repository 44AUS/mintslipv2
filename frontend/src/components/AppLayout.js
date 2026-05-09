import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useLocation } from "react-router-dom";
import {
  IonApp, IonSplitPane, IonMenu, IonHeader, IonToolbar, IonTitle,
  IonContent, IonButtons, IonButton, IonIcon,
  IonPage, IonSegment, IonSegmentButton, IonLabel,
  IonList, IonItem, IonPopover,
} from "@ionic/react";
import {
  menuOutline, closeOutline, moonOutline, sunnyOutline,
  chevronDownOutline, documentTextOutline, leafOutline, shieldOutline,
  arrowBackOutline, settingsOutline, addOutline,
} from "ionicons/icons";
import MintSlipLogo from "../assests/mintslip-logo.png";
import "../admin-theme.css";

const tabs = [
  { id: "paystub",          label: "Pay Stubs",       icon: documentTextOutline, path: "/app/paystub" },
  { id: "canadian-paystub", label: "Canadian Stubs",  icon: leafOutline,         path: "/app/canadian-paystub" },
];

// Persists sidebar state across route-driven remounts
let _appSidebarOpen = true;

export default function AppLayout({ children, fillHeight = false }) {
  const navigate  = useNavigate();
  const location  = useLocation();

  const [isMobile,          setIsMobile]          = useState(window.innerWidth < 768);
  const [darkMode,          setDarkMode]           = useState(() => localStorage.getItem("appDarkMode") === "true");
  const [sidebarOpen,       _setSidebarOpen]        = useState(_appSidebarOpen);
  const setSidebarOpen = (valOrFn) => {
    _setSidebarOpen(prev => {
      const next = typeof valOrFn === "function" ? valOrFn(prev) : valOrFn;
      _appSidebarOpen = next;
      return next;
    });
  };
  const [mobileSidebarOpen, setMobileSidebarOpen]  = useState(false);
  const [createOpen,        setCreateOpen]          = useState(false);

  const handleMenuToggle = () => {
    if (window.innerWidth < 768) {
      setMobileSidebarOpen(v => !v);
    } else {
      setSidebarOpen(prev => !prev);
    }
  };

  const handleCloseSidebar = () => {
    if (window.innerWidth < 768) {
      setMobileSidebarOpen(false);
    } else {
      setSidebarOpen(false);
    }
  };

  useEffect(() => {
    document.body.classList.toggle("dark", darkMode);
    localStorage.setItem("appDarkMode", darkMode);
  }, [darkMode]);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    document.documentElement.classList.add("ionic-active");
    document.body.classList.add("ionic-active");
    return () => {
      document.documentElement.classList.remove("ionic-active");
      document.body.classList.remove("ionic-active");
    };
  }, []);

  const toggleDark = () => setDarkMode(prev => !prev);

  const getActiveTab = () => {
    const path = location.pathname;
    if (path.includes("/app/canadian-paystub")) return "canadian-paystub";
    if (path.includes("/app/paystub"))          return "paystub";
    return "paystub";
  };

  const activeTab = getActiveTab();

  const isSecondaryPage = ["/app/terms", "/app/privacy", "/app/settings"].includes(location.pathname);
  const pageTitle = {
    "/app/terms":    "Terms of Service",
    "/app/privacy":  "Privacy Policy",
    "/app/settings": "Settings",
  }[location.pathname] || "";

  // Read user info from localStorage
  const userInfo = (() => {
    try { return JSON.parse(localStorage.getItem("userInfo")); }
    catch { return null; }
  })();

  const userInitials = userInfo?.name
    ? userInfo.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)
    : userInfo?.email
      ? userInfo.email[0].toUpperCase()
      : "U";

  const segmentBtnStyle = {
    "--color":              "rgba(255,255,255,0.7)",
    "--color-checked":      "#ffffff",
    "--indicator-color":    "#ffffff",
    "--background-checked": "rgba(255,255,255,0.12)",
    "--border-radius":      "0",
    "--padding-top":        "0",
    "--padding-bottom":     "0",
    minHeight: 60,
    flexShrink: 0,
  };

  return (
    <IonApp className="admin-app">
      <IonSplitPane
        contentId="app-main"
        when={sidebarOpen ? "md" : "(max-width: -1px)"}
        style={{ "--side-width": "300px", "--side-max-width": "300px", "--side-min-width": "300px" }}
      >

        {/* ── Sidebar ── */}
        <IonMenu contentId="app-main" type="overlay" menuId="appSidebar" disabled={isMobile}>
          <IonHeader>
            <IonToolbar>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 12px", width: "100%" }}>
                {/* Close sidebar */}
                <IonButton fill="clear" onClick={handleCloseSidebar} style={{ "--border-radius": "50%" }}>
                  <span slot="icon-only" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", lineHeight: 0, flexShrink: 0, fontSize: "20px", color: "var(--ion-text-color)" }}>
                    <IonIcon icon={closeOutline} style={{ fontSize: "inherit", color: "inherit", pointerEvents: "none" }} />
                  </span>
                </IonButton>

                {/* Logo */}
                <button onClick={() => navigate("/app/paystub")} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                  <img src={MintSlipLogo} alt="MintSlip" style={{ height: 30, width: "auto" }} />
                </button>

                {/* Dark mode toggle */}
                <IonButton fill="clear" onClick={toggleDark} title={darkMode ? "Light mode" : "Dark mode"} style={{ "--border-radius": "50%" }}>
                  <span slot="icon-only" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", lineHeight: 0, flexShrink: 0, fontSize: "20px", color: "var(--ion-text-color)" }}>
                    <IonIcon icon={darkMode ? sunnyOutline : moonOutline} style={{ fontSize: "inherit", color: "inherit", pointerEvents: "none" }} />
                  </span>
                </IonButton>
              </div>
            </IonToolbar>
          </IonHeader>

          <IonContent>
            {/* Profile card — with top padding to clear header shadow */}
            <div style={{ padding: "20px 8px 12px", flexShrink: 0 }}>
              <div style={{ borderRadius: 10, overflow: "hidden", background: "var(--ion-card-background)", border: "1px solid var(--app-divider)" }}>
                {/* Business row */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 20px", borderBottom: "1px solid var(--app-divider)" }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--ion-color-step-100)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <img src={MintSlipLogo} alt="MintSlip" style={{ width: 30, height: 30, objectFit: "contain" }} />
                  </div>
                  <div style={{ minWidth: 0, flex: "1 1 0%" }}>
                    <div style={{ fontSize: "0.68rem", color: "var(--ion-color-medium)", lineHeight: 1.2, marginBottom: 1 }}>Business</div>
                    <div style={{ fontSize: "0.9rem", color: "var(--ion-text-color)", lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>MintSlip</div>
                  </div>
                </div>

                {/* User row */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 20px" }}>
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--ion-color-primary)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem", fontWeight: 700 }}>
                      {userInfo?.photo
                        ? <img src={userInfo.photo} alt={userInfo?.name || "User"} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
                        : userInitials
                      }
                    </div>
                  </div>
                  <div style={{ minWidth: 0, flex: "1 1 0%" }}>
                    <div style={{ fontSize: "0.9rem", color: "var(--ion-text-color)", lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 500 }}>
                      {userInfo?.name || userInfo?.email || "User"}
                    </div>
                    <div style={{ fontSize: "0.72rem", color: "var(--ion-color-medium)", lineHeight: 1.2 }}>
                      {userInfo?.subscription?.status === "active" ? "Subscriber" : "Free"}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom nav links — pinned via slot="fixed" */}
            <div slot="fixed" style={{ bottom: 0, left: 0, right: 0, background: "var(--app-sidebar-bg)", borderTop: "1px solid var(--app-divider)", zIndex: 10 }}>
              {[
                { label: "Settings",         icon: settingsOutline,     path: "/app/settings" },
                { label: "Terms of Service", icon: documentTextOutline, path: "/app/terms" },
                { label: "Privacy Policy",   icon: shieldOutline,       path: "/app/privacy" },
              ].map(({ label, icon, path }) => (
                <button
                  key={label}
                  onClick={() => { navigate(path); setSidebarOpen(false); }}
                  className="sidebar-nav-btn"
                  style={{
                    width: "100%",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    padding: "0 20px",
                    minHeight: 48,
                    textAlign: "left",
                    color: "var(--ion-text-color)",
                    fontFamily: "var(--ion-font-family, system-ui)",
                    fontSize: "0.9375rem",
                  }}
                >
                  <IonIcon icon={icon} style={{ fontSize: 20, flexShrink: 0, color: "inherit" }} />
                  {label}
                </button>
              ))}
            </div>
          </IonContent>
        </IonMenu>

        {/* ── Main area ── */}
        <IonPage id="app-main">
          <IonHeader>
            <IonToolbar>
              <IonButtons slot="start">
                {isSecondaryPage ? (
                  <IonButton fill="clear" onClick={() => { _appSidebarOpen = true; navigate(-1); }} style={{ "--color": "rgba(255,255,255,0.85)", "--border-radius": "50%" }}>
                    <span slot="icon-only" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", lineHeight: 0, flexShrink: 0, fontSize: "20px" }}>
                      <IonIcon icon={arrowBackOutline} style={{ fontSize: "inherit", color: "inherit", pointerEvents: "none" }} />
                    </span>
                  </IonButton>
                ) : (
                  <IonButton fill="clear" onClick={handleMenuToggle} style={{ "--color": "rgba(255,255,255,0.85)", "--border-radius": "50%" }}>
                    <span slot="icon-only" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", lineHeight: 0, flexShrink: 0, fontSize: "20px" }}>
                      <IonIcon icon={menuOutline} style={{ fontSize: "inherit", color: "inherit", pointerEvents: "none" }} />
                    </span>
                  </IonButton>
                )}
              </IonButtons>

              {isSecondaryPage ? (
                <IonTitle style={{ color: "#fff", fontSize: "1rem", fontWeight: 700 }}>{pageTitle}</IonTitle>
              ) : isMobile ? (
                <>
                  {/* Mobile: current tab label button → popover */}
                  <IonButton id="app-mobile-nav-trigger" fill="clear" style={{ "--color": "#fff", flex: 1, maxWidth: "none", textTransform: "none" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.88rem", fontWeight: 700, letterSpacing: "0.03em" }}>
                      {tabs.find(t => t.id === activeTab)?.label || "Navigate"}
                      <IonIcon icon={chevronDownOutline} style={{ fontSize: 14, pointerEvents: "none" }} />
                    </span>
                  </IonButton>
                  <IonPopover trigger="app-mobile-nav-trigger" triggerAction="click" side="bottom" alignment="start" style={{ "--width": "240px" }}>
                    <IonContent>
                      <IonList lines="none" style={{ padding: "4px 0" }}>
                        {tabs.map(tab => (
                          <IonItem
                            key={tab.id}
                            button
                            detail={false}
                            onClick={() => { navigate(tab.path); document.querySelectorAll("ion-popover").forEach(p => p.dismiss()); }}
                            style={{
                              "--min-height": "48px",
                              "--padding-start": "14px",
                              "--inner-padding-end": "14px",
                              "--background": activeTab === tab.id ? "var(--ion-color-step-100)" : "transparent",
                              "--color": activeTab === tab.id ? "var(--ion-color-primary)" : "var(--ion-text-color)",
                              fontWeight: activeTab === tab.id ? 600 : 400,
                            }}
                          >
                            <div slot="start" style={{ display: "inline-flex", alignItems: "center", marginRight: 10 }}>
                              <IonIcon icon={tab.icon} style={{ fontSize: 18 }} />
                            </div>
                            <IonLabel>{tab.label}</IonLabel>
                          </IonItem>
                        ))}
                      </IonList>
                    </IonContent>
                  </IonPopover>
                </>
              ) : (
                /* Desktop: scrollable segment */
                <IonSegment
                  scrollable
                  value={activeTab}
                  onIonChange={e => {
                    const tab = tabs.find(t => t.id === e.detail.value);
                    if (tab) navigate(tab.path);
                  }}
                  style={{ "--background": "transparent", "--color": "rgba(255,255,255,0.65)", "--color-checked": "#ffffff", "--indicator-color": "#ffffff" }}
                >
                  {tabs.map(tab => (
                    <IonSegmentButton key={tab.id} value={tab.id} layout="icon-start" style={segmentBtnStyle}>
                      <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", lineHeight: 0, flexShrink: 0, fontSize: "1rem" }}>
                        <IonIcon icon={tab.icon} style={{ fontSize: "inherit", color: "inherit", pointerEvents: "none" }} />
                      </span>
                      <IonLabel style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                        {tab.label}
                      </IonLabel>
                    </IonSegmentButton>
                  ))}
                </IonSegment>
              )}
            </IonToolbar>
          </IonHeader>

          <IonContent style={{ "--background": "var(--ion-background-color)" }}>
            {fillHeight ? (
              <div style={{ height: "100%", overflow: "hidden" }}>{children}</div>
            ) : (
              <div className="admin-page-content">{children}</div>
            )}
          </IonContent>

        </IonPage>

      </IonSplitPane>

      {/* ── Floating Create button + custom action sheet (both portalled to body) ── */}
      {createPortal(
        <>
          {/* Button — only on main pages */}
          {!isSecondaryPage && (
            <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", zIndex: 200 }}>
              <IonButton
                onClick={() => setCreateOpen(true)}
                style={{ "--background": "#16a34a", "--background-activated": "#15803d", "--background-hover": "#15803d", "--box-shadow": "0 6px 20px rgba(0,0,0,0.25)" }}
              >
                <span slot="start" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", lineHeight: 0, flexShrink: 0, fontSize: "1rem" }}>
                  <IonIcon icon={addOutline} style={{ fontSize: "inherit", color: "inherit", pointerEvents: "none" }} />
                </span>
                CREATE
              </IonButton>
            </div>
          )}

          {/* Custom iOS-style action sheet */}
          {createOpen && (
            <>
              <div
                onClick={() => setCreateOpen(false)}
                style={{ position: "fixed", inset: 0, zIndex: 9990, background: "rgba(0,0,0,0.45)" }}
              />
              <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 9991, padding: "0 8px 34px" }}>
                <div style={{ borderRadius: 14, overflow: "hidden", marginBottom: 8 }}>
                  {[
                    { label: "Create Pay Stub",         path: "/app/paystub" },
                    { label: "Create Canadian Paystub", path: "/app/canadian-paystub" },
                  ].map(({ label, path }, i, arr) => (
                    <button
                      key={label}
                      onClick={() => { setCreateOpen(false); navigate(path); }}
                      style={{
                        width: "100%", display: "block", padding: "17px 16px",
                        border: "none", borderBottom: i < arr.length - 1 ? "1px solid rgba(0,0,0,0.12)" : "none",
                        background: "var(--ion-card-background)",
                        cursor: "pointer", fontSize: "1rem",
                        color: "var(--ion-text-color)",
                        fontFamily: "var(--ion-font-family, system-ui)",
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <div style={{ borderRadius: 14, overflow: "hidden" }}>
                  <button
                    onClick={() => setCreateOpen(false)}
                    style={{
                      width: "100%", display: "block", padding: "17px 16px",
                      border: "none", background: "var(--ion-card-background)",
                      cursor: "pointer", fontSize: "1rem", fontWeight: 700,
                      color: "var(--ion-text-color)",
                      fontFamily: "var(--ion-font-family, system-ui)",
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </>
          )}
        </>,
        document.body
      )}

      {/* ── Mobile sidebar overlay ── */}
      {mobileSidebarOpen && createPortal(<>
        <div
          className="mob-sidebar-backdrop"
          onClick={() => setMobileSidebarOpen(false)}
          style={{ position: "fixed", inset: 0, zIndex: 9996, background: "rgba(0,0,0,0.5)" }}
        />
        <div
          className="mob-sidebar-panel"
          style={{
            position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 9997,
            width: 300, maxWidth: "85vw",
            background: "var(--app-sidebar-bg, #ffffff)",
            boxShadow: "4px 0 24px rgba(0,0,0,0.25)",
            display: "flex", flexDirection: "column",
            overflowY: "auto",
          }}
        >
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 12px", minHeight: 60, flexShrink: 0, borderBottom: "1px solid var(--app-divider)" }}>
            <button onClick={() => setMobileSidebarOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", padding: 8, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <IonIcon icon={closeOutline} style={{ fontSize: 22, color: "var(--ion-text-color)" }} />
            </button>
            <button onClick={() => { navigate("/app/paystub"); setMobileSidebarOpen(false); }} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
              <img src={MintSlipLogo} alt="MintSlip" style={{ height: 30, width: "auto" }} />
            </button>
            <button onClick={toggleDark} style={{ background: "none", border: "none", cursor: "pointer", padding: 8, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <IonIcon icon={darkMode ? sunnyOutline : moonOutline} style={{ fontSize: 22, color: "var(--ion-text-color)" }} />
            </button>
          </div>

          {/* Profile card */}
          <div style={{ padding: "12px 8px", flexShrink: 0 }}>
            <div style={{ borderRadius: 10, overflow: "hidden", background: "var(--ion-card-background)", border: "1px solid var(--app-divider)" }}>
              {/* Business row */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 20px", borderBottom: "1px solid var(--app-divider)" }}>
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--ion-color-step-100)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <img src={MintSlipLogo} alt="MintSlip" style={{ width: 30, height: 30, objectFit: "contain" }} />
                </div>
                <div style={{ minWidth: 0, flex: "1 1 0%" }}>
                  <div style={{ fontSize: "0.68rem", color: "var(--ion-color-medium)", lineHeight: 1.2, marginBottom: 1 }}>Business</div>
                  <div style={{ fontSize: "0.9rem", color: "var(--ion-text-color)", lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>MintSlip</div>
                </div>
              </div>
              {/* User row */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 20px" }}>
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--ion-color-primary)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                  {userInfo?.photo
                    ? <img src={userInfo.photo} alt="user" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <span style={{ color: "#fff", fontSize: "1rem", fontWeight: 700 }}>{userInitials}</span>
                  }
                </div>
                <div style={{ minWidth: 0, flex: "1 1 0%" }}>
                  <div style={{ fontSize: "0.9rem", color: "var(--ion-text-color)", lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 500 }}>
                    {userInfo?.name || userInfo?.email || "User"}
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "var(--ion-color-medium)", lineHeight: 1.2 }}>
                    {userInfo?.subscription?.status === "active" ? "Subscriber" : "Free"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Spacer */}
          <div style={{ flex: 1 }} />

          {/* Bottom nav links — pinned */}
          <div style={{ flexShrink: 0, borderTop: "1px solid var(--app-divider)" }}>
            {[
              { label: "Settings",         icon: settingsOutline,     path: "/app/settings" },
              { label: "Terms of Service", icon: documentTextOutline, path: "/app/terms" },
              { label: "Privacy Policy",   icon: shieldOutline,       path: "/app/privacy" },
            ].map(({ label, icon, path }) => (
              <button
                key={label}
                onClick={() => { navigate(path); setMobileSidebarOpen(false); }}
                style={{
                  width: "100%", background: "none", border: "none", cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 16,
                  padding: "0 20px", minHeight: 48, textAlign: "left",
                  color: "var(--ion-text-color)",
                  fontFamily: "var(--ion-font-family)", fontSize: "0.9375rem",
                }}
              >
                <IonIcon icon={icon} style={{ fontSize: 20, flexShrink: 0, color: "inherit" }} />
                {label}
              </button>
            ))}
          </div>
        </div>
      </>, document.body)}

    </IonApp>
  );
}

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import {
  IonPage, IonContent, IonIcon, IonBadge, IonToggle,
  IonSegment, IonSegmentButton, IonLabel,
  IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonSearchbar,
  IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle,
} from "@ionic/react";
import {
  globeOutline, moonOutline, helpCircleOutline,
  playCircleOutline, sendOutline, bugOutline,
  documentTextOutline, shieldOutline, chevronForwardOutline,
  arrowBackOutline, closeOutline, searchOutline,
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

function getYouTubeThumb(url) {
  if (!url) return null;
  const match = url.match(/embed\/([a-zA-Z0-9_-]+)/);
  return match ? `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg` : null;
}

function VideoListItem({ video, onClick }) {
  const thumb = getYouTubeThumb(video.youtubeUrl);
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%", background: "none", border: "none", cursor: "pointer",
        display: "flex", alignItems: "center", gap: 12,
        padding: "12px 16px", textAlign: "left",
        borderBottom: "1px solid var(--ion-border-color)",
      }}
    >
      {thumb ? (
        <img src={thumb} alt={video.title} style={{ width: 80, height: 52, borderRadius: 6, objectFit: "cover", flexShrink: 0 }} />
      ) : (
        <div style={{ width: 80, height: 52, borderRadius: 6, background: "var(--ion-color-step-100)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <IonIcon icon={playCircleOutline} style={{ fontSize: 24, color: "var(--ion-color-medium)" }} />
        </div>
      )}
      <div style={{ flex: "1 1 0%", minWidth: 0 }}>
        <div style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--ion-text-color)", lineHeight: 1.3 }}>{video.title}</div>
        {video.description && (
          <div style={{
            fontSize: "0.78rem", color: "var(--ion-color-medium)", marginTop: 3, lineHeight: 1.4,
            overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
          }}>{video.description}</div>
        )}
      </div>
      <IonIcon icon={playCircleOutline} style={{ fontSize: 22, color: "var(--ion-color-primary)", flexShrink: 0 }} />
    </button>
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

  const [tutorialOpen,       setTutorialOpen]       = useState(false);
  const [tutorialSearch,     setTutorialSearch]     = useState("");
  const [tutorialCategories, setTutorialCategories] = useState([]);
  const [selectedCategory,   setSelectedCategory]   = useState(null);
  const [tutorialVideo,      setTutorialVideo]      = useState(null);

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/app-settings`)
      .then(r => r.json())
      .then(d => { if (d.success && d.settings) setSettings(d.settings); })
      .catch(() => {});
    fetch(`${BACKEND_URL}/api/tutorial-categories`)
      .then(r => r.json())
      .then(d => { if (d.success) setTutorialCategories(d.categories || []); })
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

  const closeTutorialModal = () => {
    setTutorialOpen(false);
    setTutorialSearch("");
    setSelectedCategory(null);
    setTutorialVideo(null);
  };

  const handleTutorialBack = () => {
    if (tutorialVideo) { setTutorialVideo(null); }
    else if (selectedCategory) { setSelectedCategory(null); setTutorialSearch(""); }
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

  const searchQuery = tutorialSearch.toLowerCase().trim();
  const searchResults = searchQuery
    ? tutorialCategories.flatMap(c => (c.videos || []).map(v => ({ ...v, _catName: c.name }))).filter(v =>
        (v.title || "").toLowerCase().includes(searchQuery) ||
        (v.description || "").toLowerCase().includes(searchQuery)
      )
    : null;

  const showBack = tutorialVideo || selectedCategory;
  const modalTitle = tutorialVideo
    ? tutorialVideo.title
    : selectedCategory
      ? selectedCategory.name
      : "Tutorials";

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
                <Row icon={playCircleOutline} label="Tutorials" clickable right={<Chevron />} onClick={() => setTutorialOpen(true)} />
                <Row icon={sendOutline}        label="Feature Request" clickable right={<Chevron />} onClick={() => window.open("mailto:support@mintslip.com?subject=Feature%20Request")} />
                <Row icon={bugOutline}         label="Report a Problem" clickable last right={<Chevron />} onClick={() => window.open("mailto:support@mintslip.com?subject=Bug%20Report")} />
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

      {/* ── Tutorials Modal ── */}
      <IonModal isOpen={tutorialOpen} onDidDismiss={closeTutorialModal}>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              {showBack ? (
                <IonButton color="dark" onClick={handleTutorialBack}>
                  <IonIcon slot="icon-only" icon={arrowBackOutline} />
                </IonButton>
              ) : (
                <IonButton color="dark" onClick={closeTutorialModal}>
                  <IonIcon slot="icon-only" icon={closeOutline} />
                </IonButton>
              )}
            </IonButtons>

            <IonTitle>{modalTitle}</IonTitle>

            {/* Searchbar only on category grid and search results views */}
            {!tutorialVideo && (
              <IonSearchbar
                slot="end"
                debounce={250}
                value={tutorialSearch}
                onIonInput={e => { setTutorialSearch(e.detail.value || ""); setSelectedCategory(null); setTutorialVideo(null); }}
                placeholder="Search"
                clearIcon={closeOutline}
                style={{ maxWidth: 220, "--background": "var(--ion-color-step-100)", "--border-radius": "8px", paddingRight: 8 }}
              />
            )}
          </IonToolbar>
        </IonHeader>

        <IonContent>
          {/* ── Video player ── */}
          {tutorialVideo && (
            <div style={{ padding: 16 }}>
              <div style={{ position: "relative", paddingBottom: "56.25%", height: 0, borderRadius: 10, overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }}>
                <iframe
                  src={tutorialVideo.youtubeUrl}
                  title={tutorialVideo.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none" }}
                />
              </div>
              {tutorialVideo.description && (
                <p style={{ marginTop: 14, fontSize: "0.9rem", color: "var(--ion-color-medium)", lineHeight: 1.6 }}>
                  {tutorialVideo.description}
                </p>
              )}
            </div>
          )}

          {/* ── Category video list ── */}
          {!tutorialVideo && selectedCategory && !searchQuery && (
            <div>
              {(selectedCategory.videos || []).length === 0 ? (
                <div style={{ textAlign: "center", padding: "48px 0", color: "var(--ion-color-medium)" }}>
                  <IonIcon icon={playCircleOutline} style={{ fontSize: 40, display: "block", margin: "0 auto 10px" }} />
                  <div style={{ fontSize: "0.9rem" }}>No videos in this category.</div>
                </div>
              ) : (
                <div style={{ background: "var(--ion-card-background)" }}>
                  {selectedCategory.videos.map((v, i) => (
                    <VideoListItem key={v.id || i} video={v} onClick={() => setTutorialVideo(v)} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Search results ── */}
          {!tutorialVideo && searchResults && (
            <div>
              {searchResults.length === 0 ? (
                <div style={{ textAlign: "center", padding: "48px 16px", color: "var(--ion-color-medium)" }}>
                  <IonIcon icon={searchOutline} style={{ fontSize: 48, display: "block", margin: "0 auto 10px" }} />
                  <div style={{ fontSize: "1rem", fontWeight: 600, color: "var(--ion-text-color)" }}>No results found</div>
                </div>
              ) : (
                <div style={{ background: "var(--ion-card-background)" }}>
                  {searchResults.map((v, i) => (
                    <VideoListItem key={v.id || i} video={v} onClick={() => setTutorialVideo(v)} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Category grid (Playlists) ── */}
          {!tutorialVideo && !selectedCategory && !searchResults && (
            <div>
              {tutorialCategories.length === 0 ? (
                <div style={{ textAlign: "center", padding: "48px 0", color: "var(--ion-color-medium)" }}>
                  <IonIcon icon={playCircleOutline} style={{ fontSize: 40, display: "block", margin: "0 auto 10px" }} />
                  <div style={{ fontSize: "0.9rem" }}>No tutorials available yet.</div>
                </div>
              ) : (
                <>
                  <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--ion-text-color)", padding: "16px 16px 8px" }}>
                    Playlists
                  </div>
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                    gap: 16,
                    padding: "0 16px 24px",
                  }}>
                    {tutorialCategories.map((cat, ci) => {
                      const firstThumb = getYouTubeThumb((cat.videos || [])[0]?.youtubeUrl);
                      return (
                        <IonCard
                          key={cat.id || ci}
                          button
                          onClick={() => setSelectedCategory(cat)}
                          style={{ margin: 0, borderRadius: 10, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.10)", cursor: "pointer" }}
                        >
                          {firstThumb ? (
                            <img src={firstThumb} alt={cat.name} style={{ width: "100%", aspectRatio: "16/9", objectFit: "cover", display: "block" }} />
                          ) : (
                            <div style={{ width: "100%", aspectRatio: "16/9", background: "var(--ion-color-step-100)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <IonIcon icon={playCircleOutline} style={{ fontSize: 40, color: "var(--ion-color-medium)" }} />
                            </div>
                          )}
                          <IonCardHeader style={{ borderTop: "1px solid var(--ion-border-color)", padding: "10px 14px 12px" }}>
                            <IonCardTitle style={{ fontSize: "0.95rem", fontWeight: 700, lineHeight: 1.3 }}>{cat.name}</IonCardTitle>
                            <IonCardSubtitle style={{ fontSize: "0.78rem", marginTop: 3 }}>{(cat.videos || []).length} video{(cat.videos || []).length !== 1 ? "s" : ""}</IonCardSubtitle>
                          </IonCardHeader>
                        </IonCard>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}
        </IonContent>
      </IonModal>
    </AppLayout>
  );
}

import { useEffect, useMemo, useState } from "react";
import {
  IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton,
  IonContent, IonFooter, IonList, IonItem, IonLabel, IonCheckbox,
  IonSearchbar, IonIcon, IonSpinner, IonSegment, IonSegmentButton,
} from "@ionic/react";
import { closeOutline } from "ionicons/icons";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";

function initials(name, email) {
  const src = name || email || "?";
  const parts = src.split(/[\s._@-]/).filter(Boolean);
  return (parts.length >= 2 ? parts[0][0] + parts[1][0] : src[0]).toUpperCase();
}

// Search all recipients (registered users + guest purchasers) and hand-pick a
// set. A whodat-style themed admin modal. `onConfirm` gets the selected
// recipient objects ({ email, name, type }).
export default function BroadcastUserPicker({ isOpen, onClose, onConfirm, initialSelected = [] }) {
  const [all, setAll] = useState(null); // null = not loaded
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("all"); // all | registered | guests
  const [sel, setSel] = useState(() => new Map()); // email -> recipient

  useEffect(() => {
    if (isOpen && all === null) {
      const token = localStorage.getItem("adminToken");
      fetch(`${BACKEND_URL}/api/admin/broadcast/recipients`, { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.json())
        .then((d) => setAll(d.recipients || []))
        .catch(() => setAll([]));
    }
  }, [isOpen, all]);

  const seedKey = isOpen ? initialSelected.map((u) => u.email).join(",") : "";
  useEffect(() => {
    if (isOpen) setSel(new Map(initialSelected.map((u) => [u.email, u])));
  }, [isOpen, seedKey]);

  const filtered = useMemo(() => {
    let list = all || [];
    if (tab !== "all") list = list.filter((u) => (tab === "registered" ? u.type === "registered" : u.type === "guest"));
    const q = query.trim().toLowerCase();
    if (q) list = list.filter((u) => (u.name || "").toLowerCase().includes(q) || (u.email || "").toLowerCase().includes(q));
    return list;
  }, [all, tab, query]);

  const toggle = (u) => setSel((prev) => {
    const next = new Map(prev);
    next.has(u.email) ? next.delete(u.email) : next.set(u.email, u);
    return next;
  });

  const allFilteredSelected = filtered.length > 0 && filtered.every((u) => sel.has(u.email));
  const toggleAllFiltered = () => setSel((prev) => {
    const next = new Map(prev);
    if (allFilteredSelected) filtered.forEach((u) => next.delete(u.email));
    else filtered.forEach((u) => next.set(u.email, u));
    return next;
  });

  const confirm = () => { onConfirm(Array.from(sel.values())); onClose(); };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose} className="admin-detail-modal">
      <IonHeader>
        <IonToolbar>
          <IonTitle>Select recipients</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={onClose} aria-label="Close"><IonIcon icon={closeOutline} slot="icon-only" /></IonButton>
          </IonButtons>
        </IonToolbar>
        <IonToolbar>
          <IonSegment value={tab} onIonChange={(e) => setTab(e.detail.value)} style={{ padding: "0 8px" }}>
            <IonSegmentButton value="all"><IonLabel>All</IonLabel></IonSegmentButton>
            <IonSegmentButton value="registered"><IonLabel>Registered</IonLabel></IonSegmentButton>
            <IonSegmentButton value="guests"><IonLabel>Guests</IonLabel></IonSegmentButton>
          </IonSegment>
        </IonToolbar>
        <IonToolbar>
          <IonSearchbar value={query} onIonInput={(e) => setQuery(e.detail.value || "")} placeholder="Search by name or email" debounce={120} />
        </IonToolbar>
      </IonHeader>
      <IonContent>
        {all === null ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 40 }}><IonSpinner name="crescent" /></div>
        ) : (
          <IonList lines="full">
            {filtered.length > 0 && (
              <IonItem button detail={false} onClick={toggleAllFiltered}>
                <IonCheckbox slot="start" checked={allFilteredSelected} onClick={(e) => e.stopPropagation()} onIonChange={toggleAllFiltered} aria-label="Select all" />
                <IonLabel><h3 style={{ fontWeight: 600 }}>Select all{query || tab !== "all" ? " shown" : ""} ({filtered.length})</h3></IonLabel>
              </IonItem>
            )}
            {filtered.map((u) => (
              <IonItem key={u.email} button detail={false} onClick={() => toggle(u)}>
                <IonCheckbox slot="start" checked={sel.has(u.email)} onClick={(e) => e.stopPropagation()} onIonChange={() => toggle(u)} aria-label={`Select ${u.email}`} />
                <div slot="start" style={{ width: 30, height: 30, borderRadius: "50%", background: u.type === "guest" ? "#94a3b8" : "var(--ion-color-primary)", display: "flex", alignItems: "center", justifyContent: "center", marginRight: 8 }}>
                  <span style={{ fontSize: "0.6rem", color: "#fff", fontWeight: 700 }}>{initials(u.name, u.email)}</span>
                </div>
                <IonLabel>
                  <h3 style={{ fontWeight: 600 }}>{u.name || u.email}</h3>
                  <p>{u.name ? u.email : ""}<span className={`admin-badge ${u.type === "guest" ? "admin-badge-slate" : "admin-badge-green"}`} style={{ marginLeft: u.name ? 8 : 0, fontSize: "0.62rem" }}>{u.type === "guest" ? "Guest" : "Registered"}</span></p>
                </IonLabel>
              </IonItem>
            ))}
            {!filtered.length && (
              <div style={{ textAlign: "center", padding: 40, color: "var(--ion-color-medium)" }}>No recipients match.</div>
            )}
          </IonList>
        )}
      </IonContent>
      <IonFooter>
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton onClick={() => setSel(new Map())} disabled={!sel.size}>Clear</IonButton>
          </IonButtons>
          <IonButtons slot="end">
            <IonButton strong onClick={confirm}>Select {sel.size || ""}</IonButton>
          </IonButtons>
        </IonToolbar>
      </IonFooter>
    </IonModal>
  );
}

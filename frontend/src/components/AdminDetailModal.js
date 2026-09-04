import {
  IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton,
  IonContent, IonIcon,
} from "@ionic/react";
import { closeOutline } from "ionicons/icons";

// Reusable admin detail modal, modeled on the whodat admin payments modal:
// a header with title + close, stacked label/value rows (value may be a node,
// e.g. a status badge), and optional action buttons rendered below via
// `children`. `rows` is an array of [label, value]; falsy rows are skipped.
export default function AdminDetailModal({ isOpen, onClose, title, rows = [], children }) {
  return (
    <IonModal
      isOpen={isOpen}
      onDidDismiss={onClose}
      style={{ "--width": "440px", "--max-width": "95vw", "--height": "auto" }}
    >
      <IonHeader>
        <IonToolbar style={{ "--background": "var(--ion-card-background)" }}>
          <IonTitle style={{ fontWeight: 700, fontSize: "1rem" }}>{title}</IonTitle>
          <IonButtons slot="end">
            <IonButton fill="clear" color="medium" onClick={onClose} aria-label="Close">
              <IonIcon icon={closeOutline} slot="icon-only" />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent style={{ "--background": "var(--ion-card-background)" }}>
        <div>
          {rows.filter(Boolean).map(([label, value], i) => (
            <div key={`${label}-${i}`} style={{ padding: "10px 20px", borderBottom: "1px solid var(--ion-border-color)" }}>
              <p style={{ margin: 0, fontSize: "0.7rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--ion-color-medium)" }}>
                {label}
              </p>
              <div style={{ marginTop: 3, fontSize: "0.9rem", color: "var(--ion-text-color)", wordBreak: "break-word", lineHeight: 1.4 }}>
                {value ?? "—"}
              </div>
            </div>
          ))}
          {children && (
            <div style={{ padding: "14px 16px 22px", display: "flex", flexDirection: "column", gap: 10 }}>
              {children}
            </div>
          )}
        </div>
      </IonContent>
    </IonModal>
  );
}

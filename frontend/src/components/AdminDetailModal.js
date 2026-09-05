import {
  IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton,
  IonContent, IonList, IonItem, IonLabel, IonIcon,
} from "@ionic/react";
import { closeOutline } from "ionicons/icons";

// Reusable admin detail modal — a direct port of the whodat admin
// AdminDetailModal: a standard Ionic (MD) inline modal at Ionic's default
// 600x500 size, an IonList of label/value items (value may be a node, e.g. a
// status badge), and optional `children` rendered below the list as action
// buttons. `rows` is an array of [label, value]; falsy rows are skipped.
const AdminDetailModal = ({ isOpen, onClose, title, rows = [], children }) => (
  <IonModal isOpen={isOpen} onDidDismiss={onClose} className="admin-detail-modal">
    <IonHeader>
      <IonToolbar>
        <IonTitle>{title}</IonTitle>
        <IonButtons slot="end">
          <IonButton onClick={onClose} aria-label="Close">
            <IonIcon icon={closeOutline} slot="icon-only" />
          </IonButton>
        </IonButtons>
      </IonToolbar>
    </IonHeader>
    <IonContent>
      <IonList lines="full">
        {rows.filter(Boolean).map(([label, value], i) => (
          <IonItem key={`${label}-${i}`}>
            <IonLabel>
              <p>{label}</p>
              <h3 style={{ whiteSpace: "normal", wordBreak: "break-word" }}>{value ?? "—"}</h3>
            </IonLabel>
          </IonItem>
        ))}
      </IonList>
      {children && (
        <div style={{ padding: "14px 16px 22px", display: "flex", flexDirection: "column", gap: 10 }}>
          {children}
        </div>
      )}
    </IonContent>
  </IonModal>
);

export default AdminDetailModal;

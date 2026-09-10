import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { IonSpinner, IonIcon, IonInput, IonButton, IonNote } from "@ionic/react";
import {
  cameraOutline, personOutline, mailOutline, lockClosedOutline,
  saveOutline, closeOutline, checkmarkCircle, alertCircleOutline,
} from "ionicons/icons";
import AdminLayout from "@/components/AdminLayout";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";

// Card + section styling ported from the /app Settings page so the admin
// settings share the same themed-card look (respects admin dark mode via
// the CSS variables) instead of the old Tailwind slate design.
const cardStyle = {
  backgroundColor: "var(--ion-card-background)",
  borderRadius: 12,
  boxShadow: "rgba(0,0,0,0.18) 0 4px 24px",
  padding: "20px",
  display: "flex",
  flexDirection: "column",
  gap: 16,
};
const cardTitle = {
  fontSize: "1rem", fontWeight: 700, color: "var(--ion-text-color)",
  display: "flex", alignItems: "center", gap: 8,
};

// Inline status note (success / error), themed
function StatusNote({ msg }) {
  if (!msg) return null;
  const ok = msg.type === "success";
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderRadius: 8,
      fontSize: "0.82rem",
      background: ok ? "rgba(var(--ion-color-success-rgb),0.14)" : "rgba(var(--ion-color-danger-rgb),0.12)",
      color: ok ? "var(--ion-color-success-shade)" : "var(--ion-color-danger)",
    }}>
      <IonIcon icon={ok ? checkmarkCircle : alertCircleOutline} style={{ fontSize: 18, flexShrink: 0 }} />
      {msg.text}
    </div>
  );
}

export default function AdminSettings() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [profile, setProfile] = useState({ name: "", email: "", photo: "" });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMsg, setProfileMsg] = useState(null);

  const [passwords, setPasswords] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMsg, setPwMsg] = useState(null);

  const [photoPreview, setPhotoPreview] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) { navigate("/admin/login"); return; }
    fetchProfile();
  }, []); // eslint-disable-line

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`${BACKEND_URL}/api/admin/profile`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) {
        setProfile({ name: data.profile.name || "", email: data.profile.email || "", photo: data.profile.photo || "" });
        if (data.profile.photo) setPhotoPreview(data.profile.photo);
      }
    } catch (e) {}
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { setProfileMsg({ type: "error", text: "Photo must be under 2 MB." }); return; }
    const reader = new FileReader();
    reader.onload = (ev) => { setPhotoPreview(ev.target.result); setProfile(prev => ({ ...prev, photo: ev.target.result })); };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async () => {
    if (!profile.email.trim()) { setProfileMsg({ type: "error", text: "Email is required." }); return; }
    setProfileLoading(true);
    setProfileMsg(null);
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`${BACKEND_URL}/api/admin/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: profile.name, email: profile.email, photo: profile.photo || null }),
      });
      const data = await res.json();
      if (data.success) {
        setProfileMsg({ type: "success", text: "Profile updated successfully." });
        const info = localStorage.getItem("adminInfo");
        if (info) {
          try { const parsed = JSON.parse(info); localStorage.setItem("adminInfo", JSON.stringify({ ...parsed, email: profile.email })); } catch (_) {}
        }
      } else {
        setProfileMsg({ type: "error", text: data.detail || "Failed to update profile." });
      }
    } catch (e) {
      setProfileMsg({ type: "error", text: "An error occurred." });
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwords.currentPassword || !passwords.newPassword || !passwords.confirmPassword) { setPwMsg({ type: "error", text: "All fields are required." }); return; }
    if (passwords.newPassword !== passwords.confirmPassword) { setPwMsg({ type: "error", text: "New passwords do not match." }); return; }
    if (passwords.newPassword.length < 8) { setPwMsg({ type: "error", text: "New password must be at least 8 characters." }); return; }
    setPwLoading(true);
    setPwMsg(null);
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`${BACKEND_URL}/api/admin/change-password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword: passwords.currentPassword, newPassword: passwords.newPassword }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPwMsg({ type: "success", text: "Password changed successfully." });
        setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        setPwMsg({ type: "error", text: data.detail || "Failed to change password." });
      }
    } catch (e) {
      setPwMsg({ type: "error", text: "An error occurred." });
    } finally {
      setPwLoading(false);
    }
  };

  const initial = profile.name ? profile.name[0].toUpperCase() : profile.email ? profile.email[0].toUpperCase() : "A";

  return (
    <AdminLayout>
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "16px 16px 40px", display: "flex", flexDirection: "column", gap: 20 }}>
        <div>
          <h1 style={{ fontSize: "1.4rem", fontWeight: 700, color: "var(--ion-text-color)", margin: 0 }}>Account Settings</h1>
          <p style={{ fontSize: "0.85rem", color: "var(--ion-color-medium)", margin: "4px 0 0" }}>
            Manage your admin profile and security.
          </p>
        </div>

        {/* Profile Photo */}
        <div style={cardStyle}>
          <div style={cardTitle}><IonIcon icon={cameraOutline} style={{ color: "var(--ion-color-medium)" }} />Profile Photo</div>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <div style={{ position: "relative", flexShrink: 0 }}>
              {photoPreview ? (
                <img src={photoPreview} alt="avatar" style={{ width: 78, height: 78, borderRadius: "50%", objectFit: "cover", border: "2px solid var(--ion-border-color)" }} />
              ) : (
                <div style={{ width: 78, height: 78, borderRadius: "50%", background: "var(--ion-color-primary)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "1.8rem", fontWeight: 800 }}>
                  {initial}
                </div>
              )}
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 6 }}>
              <IonButton size="small" color="primary" onClick={() => fileInputRef.current?.click()}>
                <IonIcon icon={cameraOutline} slot="start" />Upload Photo
              </IonButton>
              <span style={{ fontSize: "0.72rem", color: "var(--ion-color-medium)" }}>JPG, PNG or GIF · max 2 MB</span>
              {photoPreview && profile.photo && (
                <IonButton size="small" fill="clear" color="danger" onClick={() => { setPhotoPreview(null); setProfile(prev => ({ ...prev, photo: "" })); }}>
                  <IonIcon icon={closeOutline} slot="start" />Remove photo
                </IonButton>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handlePhotoChange} />
          </div>
        </div>

        {/* Account Info */}
        <div style={cardStyle}>
          <div style={cardTitle}><IonIcon icon={personOutline} style={{ color: "var(--ion-color-medium)" }} />Account Info</div>
          <IonInput fill="outline" labelPlacement="floating" label="Display Name" value={profile.name}
            placeholder="e.g. Alex" onIonInput={e => setProfile(prev => ({ ...prev, name: e.detail.value }))} />
          <IonInput fill="outline" labelPlacement="floating" label="Email Address" type="email" value={profile.email}
            placeholder="admin@mintslip.com" onIonInput={e => setProfile(prev => ({ ...prev, email: e.detail.value }))}>
            <IonIcon icon={mailOutline} slot="start" style={{ color: "var(--ion-color-medium)" }} />
          </IonInput>
          <StatusNote msg={profileMsg} />
          <IonButton color="primary" onClick={handleSaveProfile} disabled={profileLoading} style={{ alignSelf: "flex-start" }}>
            {profileLoading ? <IonSpinner name="crescent" style={{ width: 16, height: 16 }} /> : <><IonIcon icon={saveOutline} slot="start" />Save Changes</>}
          </IonButton>
        </div>

        {/* Security */}
        <div style={cardStyle}>
          <div style={cardTitle}><IonIcon icon={lockClosedOutline} style={{ color: "var(--ion-color-medium)" }} />Change Password</div>
          {[
            { key: "currentPassword", label: "Current Password" },
            { key: "newPassword", label: "New Password" },
            { key: "confirmPassword", label: "Confirm New Password" },
          ].map(({ key, label }) => (
            <IonInput key={key} fill="outline" labelPlacement="floating" label={label} type="password"
              value={passwords[key]} autocomplete="new-password"
              onIonInput={e => setPasswords(prev => ({ ...prev, [key]: e.detail.value }))} />
          ))}
          <StatusNote msg={pwMsg} />
          <IonButton color="primary" onClick={handleChangePassword} disabled={pwLoading} style={{ alignSelf: "flex-start" }}>
            {pwLoading ? <IonSpinner name="crescent" style={{ width: 16, height: 16 }} /> : <><IonIcon icon={lockClosedOutline} slot="start" />Update Password</>}
          </IonButton>
        </div>
      </div>
    </AdminLayout>
  );
}

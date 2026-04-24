import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  IonApp, IonPage, IonContent, IonButton, IonInput,
  IonSpinner, IonCard, IonCardContent, setupIonicReact,
} from "@ionic/react";
import { toast } from "sonner";
import { Lock, Mail, ShieldCheck } from "lucide-react";
import "../admin-theme.css";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";

const loginStyles = {
  page: {
    background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    "--background": "transparent",
  },
  wrap: {
    width: "100%",
    maxWidth: 420,
  },
  brand: {
    textAlign: "center",
    marginBottom: 32,
  },
  iconWrap: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 64,
    height: 64,
    background: "linear-gradient(135deg, #16a34a, #15803d)",
    borderRadius: 18,
    boxShadow: "0 8px 24px rgba(22,163,74,0.35)",
    marginBottom: 16,
  },
  heading: {
    color: "#fff",
    fontSize: "1.5rem",
    fontWeight: 700,
    margin: "0 0 4px",
  },
  sub: {
    color: "#94a3b8",
    fontSize: "0.875rem",
    margin: 0,
  },
  card: {
    "--background": "rgba(255,255,255,0.07)",
    backdropFilter: "blur(12px)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 18,
    boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
    margin: 0,
  },
  inputWrap: {
    position: "relative",
    marginBottom: 16,
  },
  inputIcon: {
    position: "absolute",
    left: 12,
    top: "50%",
    transform: "translateY(-50%)",
    color: "#64748b",
    zIndex: 2,
    pointerEvents: "none",
  },
  footer: {
    textAlign: "center",
    color: "#475569",
    fontSize: "0.8125rem",
    marginTop: 20,
  },
};

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("adminToken");
      if (token) {
        try {
          const response = await fetch(`${BACKEND_URL}/api/admin/verify`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (response.ok) {
            navigate("/admin/dashboard", { replace: true });
            return;
          }
        } catch (_) {
          localStorage.removeItem("adminToken");
          localStorage.removeItem("adminInfo");
        }
      }
      setIsCheckingAuth(false);
    };
    checkAuth();
  }, [navigate]);

  const handleLogin = async (e) => {
    e?.preventDefault();
    if (!email || !password) {
      toast.error("Please enter email and password");
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Login failed");

      localStorage.setItem("adminToken", data.token);
      localStorage.setItem("adminInfo", JSON.stringify(data.admin));
      localStorage.setItem("adminRole", data.role || "admin");
      localStorage.setItem("adminPermissions", JSON.stringify(data.permissions || null));

      toast.success("Login successful!");
      navigate("/admin/dashboard");
    } catch (error) {
      toast.error(error.message || "Login failed. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingAuth) {
    return (
      <div style={{ ...loginStyles.page, flexDirection: "column", gap: 12 }}>
        <IonSpinner name="crescent" style={{ color: "#22c55e", width: 36, height: 36 }} />
      </div>
    );
  }

  return (
    <div style={loginStyles.page}>
      <div style={loginStyles.wrap}>
        {/* Brand */}
        <div style={loginStyles.brand}>
          <div style={loginStyles.iconWrap}>
            <ShieldCheck size={30} color="#fff" />
          </div>
          <h1 style={loginStyles.heading}>MintSlip Admin</h1>
          <p style={loginStyles.sub}>Sign in to access the dashboard</p>
        </div>

        {/* Login card */}
        <IonCard style={loginStyles.card}>
          <IonCardContent style={{ padding: 28 }}>
            <form
              onSubmit={handleLogin}
              onKeyDown={e => e.key === "Enter" && handleLogin(e)}
            >
              {/* Email */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", color: "#cbd5e1", fontSize: "0.8125rem", fontWeight: 600, marginBottom: 6 }}>
                  Email
                </label>
                <div style={loginStyles.inputWrap}>
                  <span style={loginStyles.inputIcon}><Mail size={16} /></span>
                  <input
                    type="email"
                    placeholder="admin@mintslip.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      padding: "10px 12px 10px 38px",
                      background: "rgba(255,255,255,0.07)",
                      border: "1px solid rgba(255,255,255,0.15)",
                      borderRadius: 8,
                      color: "#f1f5f9",
                      fontSize: "0.9375rem",
                      outline: "none",
                    }}
                    onFocus={e => { e.target.style.borderColor = "#22c55e"; e.target.style.boxShadow = "0 0 0 3px rgba(34,197,94,0.15)"; }}
                    onBlur={e =>  { e.target.style.borderColor = "rgba(255,255,255,0.15)"; e.target.style.boxShadow = "none"; }}
                  />
                </div>
              </div>

              {/* Password */}
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: "block", color: "#cbd5e1", fontSize: "0.8125rem", fontWeight: 600, marginBottom: 6 }}>
                  Password
                </label>
                <div style={loginStyles.inputWrap}>
                  <span style={loginStyles.inputIcon}><Lock size={16} /></span>
                  <input
                    type="password"
                    placeholder="••••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      padding: "10px 12px 10px 38px",
                      background: "rgba(255,255,255,0.07)",
                      border: "1px solid rgba(255,255,255,0.15)",
                      borderRadius: 8,
                      color: "#f1f5f9",
                      fontSize: "0.9375rem",
                      outline: "none",
                    }}
                    onFocus={e => { e.target.style.borderColor = "#22c55e"; e.target.style.boxShadow = "0 0 0 3px rgba(34,197,94,0.15)"; }}
                    onBlur={e =>  { e.target.style.borderColor = "rgba(255,255,255,0.15)"; e.target.style.boxShadow = "none"; }}
                  />
                </div>
              </div>

              <IonButton
                type="submit"
                expand="block"
                color="primary"
                disabled={isLoading}
                style={{
                  "--border-radius": "10px",
                  "--box-shadow": "0 4px 16px rgba(22,163,74,0.35)",
                  height: 48,
                  fontWeight: 700,
                  fontSize: "1rem",
                  letterSpacing: 0,
                  textTransform: "none",
                }}
                onClick={handleLogin}
              >
                {isLoading ? (
                  <>
                    <IonSpinner name="crescent" style={{ width: 18, height: 18, marginRight: 8 }} />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </IonButton>
            </form>
          </IonCardContent>
        </IonCard>

        <p style={loginStyles.footer}>Secure admin access only</p>
      </div>
    </div>
  );
}

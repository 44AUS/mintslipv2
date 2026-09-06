import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/utils/toast";
import MintSlipLogo from "../assests/mintslip-logo.png";
import "../login.css";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";

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
            navigate("/admin/calendar", { replace: true });
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
      navigate("/admin/calendar");
    } catch (error) {
      toast.error(error.message || "Login failed. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="ms-login-page">
        <span className="ms-spin" style={{ width: 34, height: 34, borderColor: "rgba(22,163,74,0.25)", borderTopColor: "#16a34a" }} />
      </div>
    );
  }

  return (
    <div className="ms-login-page">
      <div className="ms-login-wrap">
        <div className="ms-login-card">
          <img src={MintSlipLogo} alt="MintSlip" className="ms-login-logo" />
          <h1 className="ms-login-title">Admin sign in</h1>
          <p className="ms-login-sub">Sign in to access the MintSlip dashboard.</p>

          <form onSubmit={handleLogin}>
            <div className="ms-login-field">
              <label className="ms-login-label" htmlFor="admin-email">Email</label>
              <input
                id="admin-email"
                className="ms-login-input"
                type="email"
                inputMode="email"
                autoComplete="username"
                placeholder="admin@mintslip.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="ms-login-field">
              <label className="ms-login-label" htmlFor="admin-password">Password</label>
              <input
                id="admin-password"
                className="ms-login-input"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button type="submit" className="ms-login-btn" disabled={isLoading}>
              {isLoading ? (<><span className="ms-spin" /> Signing in…</>) : "Sign In"}
            </button>
          </form>

          <p className="ms-login-foot">Secure admin access only</p>
        </div>
      </div>
    </div>
  );
}

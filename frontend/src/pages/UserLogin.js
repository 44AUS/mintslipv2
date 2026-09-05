import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "@/utils/toast";
import MintSlipLogo from "../assests/mintslip-logo.png";
import "../login.css";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";

export default function UserLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    const token = localStorage.getItem("userToken");
    if (token) {
      navigate("/user/dashboard");
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Please enter email and password");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/user/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Login failed");
      }

      // Store token and user info
      localStorage.setItem("userToken", data.token);
      localStorage.setItem("userInfo", JSON.stringify(data.user));

      toast.success("Welcome back!");

      // Check if email needs verification (new users only)
      if (data.user.emailVerified === false) {
        navigate("/verify-email");
        return;
      }

      // Redirect based on subscription status
      if (data.user.subscription) {
        navigate("/user/dashboard");
      } else {
        navigate("/subscription/choose");
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error(error.message || "Login failed. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="ms-login-page">
      <div className="ms-login-wrap">
        <div className="ms-login-card">
          <Link to="/"><img src={MintSlipLogo} alt="MintSlip" className="ms-login-logo" /></Link>
          <h1 className="ms-login-title">Sign in</h1>
          <p className="ms-login-sub">Welcome back — sign in to your MintSlip account.</p>

          <form onSubmit={handleLogin}>
            <div className="ms-login-field">
              <label className="ms-login-label" htmlFor="email">Email</label>
              <input
                id="email"
                className="ms-login-input"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="ms-login-field">
              <label className="ms-login-label" htmlFor="password">
                Password
                <Link to="/forgot-password" className="ms-login-link">Forgot password?</Link>
              </label>
              <input
                id="password"
                className="ms-login-input"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button type="submit" className="ms-login-btn" disabled={isLoading}>
              {isLoading ? (<><span className="ms-spin" /> Signing in…</>) : "Sign In"}
            </button>
          </form>

          <p className="ms-login-alt">
            Don&apos;t have an account? <Link to="/signup">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

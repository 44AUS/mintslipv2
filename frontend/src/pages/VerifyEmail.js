import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Mail, Loader2, CheckCircle, RefreshCw, ShieldCheck, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function VerifyEmail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [email, setEmail] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  
  const inputRefs = useRef([]);

  // Get email from URL params or user info
  useEffect(() => {
    const urlEmail = searchParams.get("email");
    const urlCode = searchParams.get("code");
    
    if (urlEmail) {
      setEmail(urlEmail);
    } else {
      // Try to get from stored user info
      const userInfo = localStorage.getItem("userInfo");
      if (userInfo) {
        const user = JSON.parse(userInfo);
        setEmail(user.email || "");
        
        // If already verified, redirect
        if (user.emailVerified) {
          navigate("/subscription/choose");
        }
      }
    }
    
    // Auto-verify if code is in URL
    if (urlCode && urlEmail) {
      setCode(urlCode);
      handleVerify(urlCode, urlEmail);
    }
  }, [searchParams, navigate]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleVerify = async (verificationCode = code, verificationEmail = email) => {
    if (!verificationCode || verificationCode.length < 6) {
      toast.error("Please enter the 6-digit verification code");
      return;
    }

    if (!verificationEmail) {
      toast.error("Email address not found. Please try logging in again.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${BACKEND_URL}/api/user/verify-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: verificationEmail.toLowerCase(),
          code: verificationCode.toUpperCase(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsVerified(true);
        toast.success("Email verified successfully!");
        
        // Update stored user info
        const userInfo = localStorage.getItem("userInfo");
        if (userInfo) {
          const user = JSON.parse(userInfo);
          user.emailVerified = true;
          localStorage.setItem("userInfo", JSON.stringify(user));
        }
      } else {
        toast.error(data.detail || "Invalid verification code");
      }
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    const token = localStorage.getItem("userToken");
    
    if (!token) {
      toast.error("Please log in to resend verification email");
      navigate("/login");
      return;
    }

    setIsResending(true);

    try {
      const response = await fetch(`${BACKEND_URL}/api/user/resend-verification`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Verification email sent! Check your inbox.");
        setResendCooldown(60); // 60 second cooldown
      } else {
        toast.error(data.detail || "Failed to resend verification email");
      }
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  const handleCodeChange = (index, value) => {
    // Only allow numbers and letters
    const cleanValue = value.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
    
    if (cleanValue.length <= 1) {
      const newCode = code.split("");
      newCode[index] = cleanValue;
      setCode(newCode.join(""));
      
      // Auto-focus next input
      if (cleanValue && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    } else if (cleanValue.length === 6) {
      // Handle paste of full code
      setCode(cleanValue);
      inputRefs.current[5]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 6);
    setCode(pastedData);
    if (pastedData.length === 6) {
      inputRefs.current[5]?.focus();
    }
  };

  // Success state
  if (isVerified) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo/Brand */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg mb-4">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800">Email Verified!</h1>
            <p className="text-slate-500 mt-1">Your account is now fully activated</p>
          </div>

          {/* Success Card */}
          <div className="bg-white rounded-2xl p-8 shadow-xl border border-slate-100 text-center">
            <div className="bg-green-50 rounded-xl p-4 mb-6">
              <p className="text-slate-700">
                Your email <strong className="text-green-700">{email}</strong> has been verified successfully.
              </p>
            </div>
            
            <p className="text-slate-500 mb-6">
              You can now access all features and choose your subscription plan.
            </p>
            
            <Button
              onClick={() => navigate("/subscription/choose")}
              className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-6 text-lg font-semibold shadow-lg gap-2"
            >
              Choose Your Plan
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg mb-4">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Verify Your Email</h1>
          <p className="text-slate-500 mt-1">Enter the code we sent to your email</p>
        </div>

        {/* Verification Form */}
        <div className="bg-white rounded-2xl p-8 shadow-xl border border-slate-100">
          {email && (
            <div className="bg-green-50 rounded-xl p-4 mb-6 text-center">
              <p className="text-sm text-slate-600">We sent a verification code to:</p>
              <p className="font-semibold text-green-700">{email}</p>
            </div>
          )}

          <form onSubmit={(e) => { e.preventDefault(); handleVerify(); }} className="space-y-6">
            {/* 6-digit code input */}
            <div className="space-y-2">
              <Label className="text-center block">Verification Code</Label>
              <div className="flex justify-center gap-2" onPaste={handlePaste}>
                {[0, 1, 2, 3, 4, 5].map((index) => (
                  <Input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    maxLength={1}
                    value={code[index] || ""}
                    onChange={(e) => handleCodeChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="w-12 h-14 text-center text-xl font-bold uppercase"
                    autoFocus={index === 0}
                  />
                ))}
              </div>
              <p className="text-xs text-slate-500 text-center mt-2">
                Enter the 6-character code from your email
              </p>
            </div>

            <Button
              type="submit"
              disabled={isLoading || code.length < 6}
              className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-6 text-lg font-semibold shadow-lg gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Verify Email
                </>
              )}
            </Button>
          </form>

          {/* Resend option */}
          <div className="mt-6 text-center">
            <p className="text-sm text-slate-500 mb-2">Didn't receive the code?</p>
            <Button
              type="button"
              variant="outline"
              onClick={handleResend}
              disabled={isResending || resendCooldown > 0}
              className="gap-2"
            >
              {isResending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending...
                </>
              ) : resendCooldown > 0 ? (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Resend in {resendCooldown}s
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Resend Code
                </>
              )}
            </Button>
          </div>

          {/* Logout option */}
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => {
                localStorage.removeItem("userToken");
                localStorage.removeItem("userInfo");
                navigate("/login");
              }}
              className="text-sm text-slate-500 hover:text-slate-700"
            >
              Use a different account
            </button>
          </div>
        </div>

        {/* Help Note */}
        <div className="mt-6 bg-white rounded-xl p-4 border border-slate-100">
          <h3 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
            <Mail className="w-4 h-4 text-green-600" />
            Can't Find the Email?
          </h3>
          <ul className="text-sm text-slate-600 space-y-1">
            <li>• Check your spam or junk folder</li>
            <li>• Make sure you entered the correct email</li>
            <li>• Wait a few minutes and try resending</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

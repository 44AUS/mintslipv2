import { useEffect, useState } from "react";
import { Shield, AlertTriangle } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";

export default function Banned() {
  const [banInfo, setBanInfo] = useState(null);

  useEffect(() => {
    // Try to get ban info from the API
    const checkBan = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/check-ip-ban`);
        if (response.ok) {
          const data = await response.json();
          if (data.banned) {
            setBanInfo(data);
          }
        }
      } catch (error) {
        console.error("Error checking ban status:", error);
      }
    };
    
    checkBan();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Shield className="w-10 h-10 text-red-600" />
          </div>
          
          <h1 className="text-2xl font-bold text-slate-800 mb-2">
            Access Denied
          </h1>
          
          <div className="flex items-center justify-center gap-2 text-red-600 mb-4">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-medium">Your access has been restricted</span>
          </div>
          
          <p className="text-slate-600 mb-6">
            {banInfo?.reason || "Your IP address has been blocked from accessing this website due to a violation of our terms of service."}
          </p>
          
          <div className="bg-slate-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-slate-500">
              If you believe this is an error, please contact our support team with the following information:
            </p>
            <div className="mt-3 text-left">
              <p className="text-xs text-slate-400">
                Time: {new Date().toLocaleString()}
              </p>
              {banInfo?.bannedAt && (
                <p className="text-xs text-slate-400">
                  Banned: {new Date(banInfo.bannedAt).toLocaleString()}
                </p>
              )}
            </div>
          </div>
          
          <a 
            href="mailto:support@example.com"
            className="inline-flex items-center justify-center px-6 py-3 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors"
          >
            Contact Support
          </a>
        </div>
        
        <p className="text-center text-sm text-slate-500 mt-6">
          © {new Date().getFullYear()} MintSlip. All rights reserved.
        </p>
      </div>
    </div>
  );
}

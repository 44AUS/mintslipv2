import { useEffect, useState } from "react";
import { Wrench, Clock, Mail } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";

export default function MaintenancePage() {
  const [maintenanceInfo, setMaintenanceInfo] = useState({
    message: "We're currently performing scheduled maintenance. We'll be back shortly!",
    estimatedTime: ""
  });

  useEffect(() => {
    const fetchMaintenanceInfo = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/maintenance-status`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.maintenance) {
            setMaintenanceInfo({
              message: data.maintenance.message || "We're currently performing scheduled maintenance. We'll be back shortly!",
              estimatedTime: data.maintenance.estimatedTime || ""
            });
          }
        }
      } catch (error) {
        console.error("Error fetching maintenance info:", error);
      }
    };
    fetchMaintenanceInfo();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-green-50 flex flex-col items-center justify-center px-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-100 rounded-full opacity-50 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-100 rounded-full opacity-50 blur-3xl"></div>
      </div>

      <div className="relative z-10 text-center max-w-lg mx-auto">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <div className="flex items-center gap-3">
            <img 
              src="/favicon.ico" 
              alt="MintSlip" 
              className="w-16 h-16 rounded-2xl shadow-lg"
            />
            <span 
              className="text-4xl font-black text-slate-800"
              style={{ fontFamily: 'Outfit, sans-serif' }}
            >
              MintSlip
            </span>
          </div>
        </div>

        {/* Maintenance Icon */}
        <div className="mb-6 flex justify-center">
          <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-xl">
            <Wrench className="w-12 h-12 text-white animate-pulse" />
          </div>
        </div>

        {/* Title */}
        <h1 
          className="text-3xl md:text-4xl font-black text-slate-800 mb-4"
          style={{ fontFamily: 'Outfit, sans-serif' }}
        >
          Under Maintenance
        </h1>

        {/* Message */}
        <p className="text-lg text-slate-600 mb-6 leading-relaxed">
          {maintenanceInfo.message}
        </p>

        {/* Estimated Time */}
        {maintenanceInfo.estimatedTime && (
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-full mb-8">
            <Clock className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-800">
              Estimated time: {maintenanceInfo.estimatedTime}
            </span>
          </div>
        )}

        {/* Divider */}
        <div className="w-16 h-1 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full mx-auto mb-8"></div>

        {/* Contact Info */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <p className="text-sm text-slate-500 mb-3">
            Need urgent assistance?
          </p>
          <a 
            href="mailto:support@mintslip.com"
            className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 font-medium transition-colors"
          >
            <Mail className="w-4 h-4" />
            support@mintslip.com
          </a>
        </div>

        {/* Footer */}
        <p className="mt-8 text-sm text-slate-400">
          Thank you for your patience. We'll be back soon!
        </p>
      </div>
    </div>
  );
}

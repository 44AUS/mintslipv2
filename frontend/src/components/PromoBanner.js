import { useState, useEffect } from "react";
import { X, Tag, Sparkles, Copy, Check } from "lucide-react";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";

export default function PromoBanner() {
  const [banner, setBanner] = useState(null);
  const [isVisible, setIsVisible] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchBanner();
  }, []);

  const fetchBanner = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/banner`);
      if (response.ok) {
        const data = await response.json();
        if (data.banner && data.banner.isActive) {
          setBanner(data.banner);
          // Check if user has dismissed this banner before
          const dismissedBanner = sessionStorage.getItem("dismissedBanner");
          if (dismissedBanner === data.banner.discountCode) {
            setIsVisible(false);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching banner:", error);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    if (banner?.discountCode) {
      sessionStorage.setItem("dismissedBanner", banner.discountCode);
    }
  };

  const handleCopyCode = () => {
    if (banner?.discountCode) {
      navigator.clipboard.writeText(banner.discountCode);
      setCopied(true);
      toast.success("Discount code copied!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!banner || !isVisible) {
    return null;
  }

  return (
    <div
      className="relative py-2.5 px-4 text-center"
      style={{
        backgroundColor: banner.backgroundColor || "#10b981",
        color: banner.textColor || "#ffffff"
      }}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-3 flex-wrap">
        <Sparkles className="w-4 h-4 animate-pulse" />
        
        <span className="text-sm font-medium">
          {banner.message}
        </span>
        
        {banner.discountCode && (
          <button
            onClick={handleCopyCode}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold transition-all hover:scale-105"
            style={{
              backgroundColor: "rgba(255,255,255,0.2)",
              backdropFilter: "blur(4px)"
            }}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>{banner.discountCode}</span>
            {copied ? (
              <Check className="w-3.5 h-3.5" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
        )}
        
        {banner.discountPercent > 0 && (
          <span className="text-sm font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.2)" }}>
            {banner.discountPercent}% OFF
          </span>
        )}
      </div>
      
      <button
        onClick={handleDismiss}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full transition-all hover:bg-white/20"
        aria-label="Dismiss banner"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

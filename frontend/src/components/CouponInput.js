import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tag, Check, X, Loader2 } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";

export default function CouponInput({ 
  generatorType, 
  originalPrice, 
  onDiscountApplied,
  customerIdentifier = null 
}) {
  const [couponCode, setCouponCode] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [appliedDiscount, setAppliedDiscount] = useState(null);
  const [error, setError] = useState("");

  const validateCoupon = async () => {
    if (!couponCode.trim()) {
      setError("Please enter a coupon code");
      return;
    }

    setIsValidating(true);
    setError("");

    try {
      const response = await fetch(`${BACKEND_URL}/api/validate-coupon`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: couponCode.trim(),
          generatorType,
          customerIdentifier
        })
      });

      const data = await response.json();

      if (response.ok && data.valid) {
        const discountAmount = (originalPrice * data.discountPercent) / 100;
        const newPrice = originalPrice - discountAmount;
        
        setAppliedDiscount({
          code: data.code,
          percent: data.discountPercent,
          discountAmount: discountAmount.toFixed(2),
          newPrice: newPrice.toFixed(2)
        });
        
        onDiscountApplied({
          code: data.code,
          discountPercent: data.discountPercent,
          originalPrice,
          discountedPrice: parseFloat(newPrice.toFixed(2))
        });
      } else {
        setError(data.detail || "Invalid coupon code");
        setAppliedDiscount(null);
        onDiscountApplied(null);
      }
    } catch (err) {
      setError("Error validating coupon");
      setAppliedDiscount(null);
      onDiscountApplied(null);
    } finally {
      setIsValidating(false);
    }
  };

  const removeCoupon = () => {
    setCouponCode("");
    setAppliedDiscount(null);
    setError("");
    onDiscountApplied(null);
  };

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <Tag className="w-4 h-4 text-gray-600" />
        <span className="text-sm font-medium text-gray-700">Have a coupon code?</span>
      </div>

      {!appliedDiscount ? (
        <>
          <div className="flex gap-2">
            <Input
              value={couponCode}
              onChange={(e) => {
                setCouponCode(e.target.value.toUpperCase());
                setError("");
              }}
              placeholder="Enter code"
              className="font-mono uppercase"
              disabled={isValidating}
            />
            <Button
              type="button"
              onClick={validateCoupon}
              disabled={isValidating || !couponCode.trim()}
              variant="outline"
              className="shrink-0"
            >
              {isValidating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Apply"
              )}
            </Button>
          </div>
          {error && (
            <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
              <X className="w-3 h-3" />
              {error}
            </p>
          )}
        </>
      ) : (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-600" />
              <div>
                <span className="font-mono font-semibold text-green-700">{appliedDiscount.code}</span>
                <span className="text-green-600 ml-2">- {appliedDiscount.percent}% off</span>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={removeCoupon}
              className="text-gray-500 hover:text-red-500"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="mt-2 text-sm">
            <span className="text-gray-500 line-through">${originalPrice.toFixed(2)}</span>
            <span className="text-green-700 font-semibold ml-2">${appliedDiscount.newPrice}</span>
            <span className="text-green-600 ml-1">(Save ${appliedDiscount.discountAmount})</span>
          </div>
        </div>
      )}
    </div>
  );
}

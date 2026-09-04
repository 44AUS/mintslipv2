import { useState } from "react";
import { IonButton } from "@ionic/react";
import { toast } from "sonner";
import AdminDetailModal from "@/components/AdminDetailModal";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";

const DOC_LABELS = {
  "paystub": "Pay Stub",
  "canadian-paystub": "Canadian Pay Stub",
  "resume": "AI Resume",
  "w2": "W-2 Form",
  "w9": "W-9 Form",
  "1099-nec": "1099-NEC",
  "1099-misc": "1099-MISC",
  "bank-statement": "Bank Statement",
  "offer-letter": "Offer Letter",
  "cease-and-desist": "Cease and Desist",
  "power-of-attorney": "Power of Attorney",
  "commercial-lease": "Commercial Lease",
  "vehicle-bill-of-sale": "Vehicle Bill of Sale",
  "schedule-c": "Schedule C",
  "utility-bill": "Utility Bill",
};

const DOC_COLORS = {
  "paystub": "#16a34a", "canadian-paystub": "#16a34a", "resume": "#2563eb",
  "w2": "#7c3aed", "w9": "#7c3aed", "1099-nec": "#d97706", "1099-misc": "#d97706",
  "bank-statement": "#0891b2", "offer-letter": "#059669", "cease-and-desist": "#b91c1c",
  "power-of-attorney": "#7c3aed", "commercial-lease": "#0891b2",
  "vehicle-bill-of-sale": "#dc2626", "schedule-c": "#92400e", "utility-bill": "#64748b",
};

const TEMPLATE_NAMES = {
  "template-a": "Gusto", "template-b": "ADP", "template-c": "Workday",
  "template-h": "OnPay", "chime": "Chime", "bank-of-america": "Bank of America",
  "chase": "Chase", "standard": "Standard", "detailed": "Detailed",
  "modern": "Modern", "classic": "Classic", "minimal": "Minimal",
};

function templateLabel(t) {
  if (!t) return null;
  if (String(t).startsWith("custom:")) return "Custom template";
  return TEMPLATE_NAMES[t] || t;
}

// Payment detail modal in the whodat admin payments style, shared by the
// Calendar and Purchases pages. `onRefunded(purchase, amount)` is called after
// a successful refund so the page can update its own state; `onDelete` and
// `onViewAll` add their buttons only when provided.
export default function PurchaseDetailModal({ purchase, onClose, onRefunded, onDelete, onViewAll }) {
  const [refunding, setRefunding] = useState(false);
  const p = purchase;

  const refund = async () => {
    if (!p || p.refunded || !p.stripePaymentIntentId) return;
    const amount = Number(p.amount) || 0;
    if (!window.confirm(`Refund $${amount.toFixed(2)} to ${p.email || p.paypalEmail || "this customer"}?`)) return;
    setRefunding(true);
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`${BACKEND_URL}/api/admin/purchases/${p.id}/refund`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ amount_dollars: amount, reason: "requested_by_customer" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || "Refund failed");
      toast.success(`Refund of $${amount.toFixed(2)} issued`);
      onRefunded?.(p, amount);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setRefunding(false);
    }
  };

  return (
    <AdminDetailModal
      isOpen={!!p}
      onClose={onClose}
      title={p ? (p.email || p.paypalEmail || "Payment") : "Payment"}
      rows={p ? [
        ["Purchase ID", <span style={{ fontFamily: "monospace", fontSize: "0.8rem" }}>{p.id || p.stripePaymentIntentId || "—"}</span>],
        ["Customer", p.email || p.paypalEmail || "—"],
        ["Type", p.userId
          ? <span className="admin-badge admin-badge-green">Registered</span>
          : <span className="admin-badge admin-badge-slate">Guest</span>],
        ["Document", (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: DOC_COLORS[p.documentType] || "#64748b", display: "inline-block" }} />
            {DOC_LABELS[p.documentType] || p.documentType || "—"}
            {p.quantity > 1 ? ` ×${p.quantity}` : ""}
          </span>
        )],
        templateLabel(p.template) && ["Template", templateLabel(p.template)],
        ["Amount", <span style={{ fontWeight: 700 }}>{`$${(p.amount || 0).toFixed(2)}`}</span>],
        p.discountCode && ["Discount", `${p.discountCode}${p.discountAmount ? ` (−$${Number(p.discountAmount).toFixed(2)})` : ""}`],
        ["Status", p.refunded
          ? <span className="admin-badge admin-badge-amber">Refunded{p.refundedAmount ? ` $${Number(p.refundedAmount).toFixed(2)}` : ""}</span>
          : <span className="admin-badge admin-badge-green">Paid</span>],
        p.ipAddress && ["IP Address", <span style={{ fontFamily: "monospace", fontSize: "0.8rem" }}>{p.ipAddress}</span>],
        ["Date", p.createdAt ? new Date(p.createdAt).toLocaleString() : "—"],
      ] : []}
    >
      {p && (
        <>
          <IonButton
            expand="block"
            color="danger"
            onClick={refund}
            disabled={refunding || p.refunded || !p.stripePaymentIntentId}
            title={p.refunded ? "Already refunded" : !p.stripePaymentIntentId ? "No payment record to refund" : "Issue a full refund"}
          >
            {refunding ? "Refunding…" : p.refunded ? "Already Refunded" : "Issue Refund"}
          </IonButton>
          {(p.email || p.paypalEmail) && (
            <IonButton expand="block" fill="outline" color="medium" href={`mailto:${p.email || p.paypalEmail}`}>
              Email Customer
            </IonButton>
          )}
          {onViewAll && (
            <IonButton expand="block" fill="outline" color="medium" onClick={onViewAll}>
              View All Purchases
            </IonButton>
          )}
          {onDelete && (
            <IonButton expand="block" fill="outline" color="danger" onClick={() => onDelete(p)}>
              Delete Purchase
            </IonButton>
          )}
        </>
      )}
    </AdminDetailModal>
  );
}

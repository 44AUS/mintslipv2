import { useState, useEffect, useCallback } from "react";
import AdminLayout from "@/components/AdminLayout";
import { IonButton, IonSpinner } from "@ionic/react";
import { toast } from "sonner";
import { RefreshCw, AlertTriangle, CheckCircle, XCircle, Clock, CreditCard } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";

const TIER_COLORS = {
  starter: "bg-blue-100 text-blue-700",
  professional: "bg-purple-100 text-purple-700",
  business: "bg-amber-100 text-amber-700",
};

const TIER_PRICES = { starter: "$19.99/mo", professional: "$29.99/mo", business: "$49.99/mo" };

function StripeBadge({ status }) {
  if (!status || status === "unknown") return <span className="text-xs text-gray-400">—</span>;
  const map = {
    active: { color: "bg-emerald-100 text-emerald-700", icon: CheckCircle },
    past_due: { color: "bg-red-100 text-red-700", icon: AlertTriangle },
    unpaid: { color: "bg-red-100 text-red-700", icon: AlertTriangle },
    canceled: { color: "bg-gray-100 text-gray-600", icon: XCircle },
    canceling: { color: "bg-orange-100 text-orange-700", icon: Clock },
    trialing: { color: "bg-blue-100 text-blue-700", icon: CheckCircle },
  };
  const cfg = map[status] || { color: "bg-gray-100 text-gray-600", icon: Clock };
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>
      <Icon className="w-3 h-3" />
      {status.replace(/_/g, " ")}
    </span>
  );
}

const FILTERS = ["all", "active", "past_due", "cancelling", "cancelled"];

export default function AdminSubscriptions() {
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null); // userId string
  const [filter, setFilter] = useState("all");

  const fetchSubs = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`${BACKEND_URL}/api/admin/subscriptions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load subscriptions");
      const data = await res.json();
      setSubs(data.subscriptions || []);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSubs(); }, [fetchSubs]);

  const doAction = async (userId, endpoint, body = {}) => {
    setActionLoading(userId);
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`${BACKEND_URL}/api/admin/subscriptions/${userId}/${endpoint}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Action failed");
      toast.success("Subscription updated");
      fetchSubs();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = (userId, email) => {
    if (!window.confirm(`Cancel ${email}'s subscription at period end?`)) return;
    doAction(userId, "cancel", { immediate: false });
  };
  const handleCancelNow = (userId, email) => {
    if (!window.confirm(`Immediately cancel ${email}'s subscription? This cannot be undone.`)) return;
    doAction(userId, "cancel", { immediate: true });
  };
  const handleReactivate = (userId) => {
    doAction(userId, "reactivate");
  };

  const filtered = filter === "all"
    ? subs
    : filter === "past_due"
    ? subs.filter(s => s.isPastDue)
    : subs.filter(s => s.dbStatus === filter);

  const pastDueCount = subs.filter(s => s.isPastDue).length;

  const isExpired = (dateStr) => dateStr && new Date(dateStr) < new Date();

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Subscriptions</h1>
            <p className="text-sm text-gray-500 mt-1">
              {subs.length} total
              {pastDueCount > 0 && (
                <span className="ml-2 inline-flex items-center gap-1 text-red-600 font-medium">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {pastDueCount} past due
                </span>
              )}
            </p>
          </div>
          <IonButton fill="outline" color="medium" size="small" onClick={fetchSubs} disabled={loading}>
            <RefreshCw size={14} style={{ marginRight: 6 }} />Refresh
          </IonButton>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 flex-wrap">
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg capitalize transition-colors ${
                filter === f
                  ? "bg-gray-900 text-white"
                  : "bg-white border border-gray-200 text-gray-600 hover:border-gray-300"
              }`}
            >
              {f === "past_due" ? "Past Due" : f}
              {f === "past_due" && pastDueCount > 0 && (
                <span className="ml-1.5 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">{pastDueCount}</span>
              )}
            </button>
          ))}
        </div>

        {/* Table */}
        {loading && subs.length === 0 ? (
          <div className="text-center py-12 text-gray-400">Loading subscriptions from Stripe…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400 bg-white rounded-xl border border-gray-200">
            No subscriptions found
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">User</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Plan</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">DB Status</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Stripe Status</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Period End</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((sub) => (
                    <tr
                      key={sub.userId}
                      className={sub.isPastDue ? "border-l-4 border-red-400 bg-red-50/30" : "hover:bg-gray-50"}
                    >
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-gray-900">{sub.name || "—"}</p>
                          <p className="text-xs text-gray-500">{sub.email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium capitalize ${TIER_COLORS[sub.tier] || "bg-gray-100 text-gray-600"}`}>
                          {sub.tier || "—"}
                        </span>
                        {sub.tier && <p className="text-xs text-gray-400 mt-0.5">{TIER_PRICES[sub.tier]}</p>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`admin-badge ${sub.dbStatus === "active" ? "admin-badge-green" : sub.dbStatus === "cancelling" ? "admin-badge-amber" : "admin-badge-slate"}`} style={{ textTransform: "capitalize" }}>
                          {sub.dbStatus || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <StripeBadge status={sub.stripeStatus} />
                        {sub.cancelAtPeriodEnd && (
                          <p className="text-xs text-orange-600 mt-0.5">Cancels at period end</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {sub.currentPeriodEnd ? (
                          <span className={`text-sm ${isExpired(sub.currentPeriodEnd) ? "text-red-600 font-medium" : "text-gray-700"}`}>
                            {new Date(sub.currentPeriodEnd).toLocaleDateString()}
                            {isExpired(sub.currentPeriodEnd) && <span className="ml-1 text-xs">(expired)</span>}
                          </span>
                        ) : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 flex-wrap">
                          {sub.dbStatus === "cancelling" ? (
                            <IonButton size="small" fill="outline" color="primary" disabled={actionLoading === sub.userId} onClick={() => handleReactivate(sub.userId)}>
                              {actionLoading === sub.userId ? <IonSpinner name="crescent" style={{ width: 14, height: 14 }} /> : "Reactivate"}
                            </IonButton>
                          ) : sub.dbStatus === "active" || sub.isPastDue ? (
                            <>
                              <IonButton size="small" fill="outline" color="warning" disabled={actionLoading === sub.userId} onClick={() => handleCancel(sub.userId, sub.email)}>
                                Cancel
                              </IonButton>
                              <IonButton size="small" color="danger" disabled={actionLoading === sub.userId} onClick={() => handleCancelNow(sub.userId, sub.email)}>
                                Cancel Now
                              </IonButton>
                            </>
                          ) : (
                            <span className="text-xs text-gray-400">No actions</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
          <div className="flex items-start gap-2">
            <CreditCard className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Stripe Status is fetched live</p>
              <p className="text-blue-700 mt-0.5">
                <strong>Past Due</strong> = payment failed. <strong>Cancel</strong> = cancel at period end (user retains access until then). <strong>Cancel Now</strong> = immediately terminates.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

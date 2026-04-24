import { useState, useEffect, useCallback } from "react";
import AdminLayout from "@/components/AdminLayout";
import { IonButton, IonSpinner } from "@ionic/react";
import { toast } from "sonner";
import { RefreshCw, Trash2, ChevronDown, ChevronUp, Mail, Clock } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";

const STATUS_BADGE = {
  open: "admin-badge-red",
  "in-progress": "admin-badge-blue",
  closed: "admin-badge-slate",
};

const REASON_LABELS = {
  billing: "Billing",
  technical: "Technical Issue",
  general: "General Question",
  refund: "Refund Request",
  other: "Other",
};

export default function AdminSupport() {
  const [tickets, setTickets] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [notes, setNotes] = useState({});

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("adminToken");
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      const res = await fetch(`${BACKEND_URL}/api/admin/support-tickets?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load tickets");
      const data = await res.json();
      setTickets(data.tickets || []);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  const updateTicket = async (id, updates) => {
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`${BACKEND_URL}/api/admin/support-tickets/${id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("Failed to update ticket");
      toast.success("Ticket updated");
      fetchTickets();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const deleteTicket = async (id) => {
    if (!window.confirm("Delete this ticket? This cannot be undone.")) return;
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`${BACKEND_URL}/api/admin/support-tickets/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to delete ticket");
      toast.success("Ticket deleted");
      setExpanded(null);
      fetchTickets();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const openCount = tickets.filter(t => t.status === "open").length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Support Inbox</h1>
            <p className="text-sm text-gray-500 mt-1">
              {tickets.length} tickets{openCount > 0 ? ` · ${openCount} open` : ""}
            </p>
          </div>
          <div className="flex gap-3 items-center">
            <select className="admin-select" style={{ width: 160 }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All Tickets</option>
              <option value="open">Open</option>
              <option value="in-progress">In Progress</option>
              <option value="closed">Closed</option>
            </select>
            <IonButton fill="outline" color="medium" size="small" onClick={fetchTickets} disabled={loading}>
              <RefreshCw size={14} style={{ marginRight: 6 }} />Refresh
            </IonButton>
          </div>
        </div>

        {loading && tickets.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 0" }}>
            <IonSpinner name="crescent" color="primary" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm" style={{ textAlign: "center", padding: "48px 0", color: "#94a3b8" }}>
            No tickets found
          </div>
        ) : (
          <div className="space-y-3">
            {tickets.map((ticket) => (
              <div key={ticket.id} className="bg-white rounded-xl shadow-sm" style={{ overflow: "hidden" }}>
                <button
                  style={{ width: "100%", padding: "16px 20px", display: "flex", alignItems: "center", gap: 16, textAlign: "left", background: "none", border: "none", cursor: "pointer" }}
                  onClick={() => setExpanded(expanded === ticket.id ? null : ticket.id)}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                      <span style={{ fontWeight: 600, color: "var(--admin-text)" }}>{ticket.name}</span>
                      <span style={{ fontSize: "0.875rem", color: "var(--admin-text-muted)" }}>{ticket.email}</span>
                      {ticket.reason && (
                        <span className="admin-badge admin-badge-slate">{REASON_LABELS[ticket.reason] || ticket.reason}</span>
                      )}
                      <span className={`admin-badge ${STATUS_BADGE[ticket.status] || "admin-badge-slate"}`} style={{ textTransform: "capitalize" }}>
                        {ticket.status}
                      </span>
                    </div>
                    <p style={{ fontSize: "0.875rem", color: "var(--admin-text-muted)", marginTop: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {ticket.message}
                    </p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.75rem", color: "#94a3b8" }}>
                      <Clock size={12} />{new Date(ticket.createdAt).toLocaleDateString()}
                    </span>
                    {expanded === ticket.id ? <ChevronUp size={16} style={{ color: "#94a3b8" }} /> : <ChevronDown size={16} style={{ color: "#94a3b8" }} />}
                  </div>
                </button>

                {expanded === ticket.id && (
                  <div style={{ padding: "0 20px 20px", borderTop: "1px solid var(--admin-border)" }}>
                    <div style={{ marginTop: 16, background: "rgba(241,245,249,0.6)", borderRadius: 8, padding: 16, fontSize: "0.875rem", color: "var(--admin-text)", whiteSpace: "pre-wrap" }}>
                      {ticket.message}
                    </div>

                    {ticket.notes && (
                      <div style={{ background: "rgba(59,130,246,0.07)", border: "1px solid rgba(59,130,246,0.15)", borderRadius: 8, padding: 12, fontSize: "0.875rem", color: "#3b82f6", marginTop: 12 }}>
                        <strong>Internal note:</strong> {ticket.notes}
                      </div>
                    )}

                    <div className="admin-form-group" style={{ marginTop: 16 }}>
                      <label className="admin-form-label">Internal Note</label>
                      <textarea
                        className="admin-textarea"
                        placeholder="Add an internal note (not visible to user)..."
                        value={notes[ticket.id] ?? (ticket.notes || "")}
                        onChange={(e) => setNotes(n => ({ ...n, [ticket.id]: e.target.value }))}
                        rows={3}
                      />
                    </div>

                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginTop: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--admin-text)" }}>Status:</span>
                        <select
                          className="admin-select"
                          style={{ width: 144 }}
                          value={ticket.status}
                          onChange={(e) => updateTicket(ticket.id, { status: e.target.value })}
                        >
                          <option value="open">Open</option>
                          <option value="in-progress">In Progress</option>
                          <option value="closed">Closed</option>
                        </select>
                      </div>

                      <div style={{ display: "flex", gap: 8 }}>
                        <IonButton fill="outline" color="medium" size="small" onClick={() => {
                          const note = notes[ticket.id] ?? ticket.notes ?? "";
                          updateTicket(ticket.id, { notes: note });
                        }}>
                          Save Note
                        </IonButton>
                        <a href={`mailto:${ticket.email}`} style={{ textDecoration: "none" }}>
                          <IonButton fill="outline" color="medium" size="small">
                            <Mail size={14} style={{ marginRight: 4 }} />Reply via Email
                          </IonButton>
                        </a>
                        <IonButton color="danger" size="small" fill="outline" onClick={() => deleteTicket(ticket.id)}>
                          <Trash2 size={14} />
                        </IonButton>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

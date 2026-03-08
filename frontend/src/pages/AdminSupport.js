import { useState, useEffect, useCallback } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { RefreshCw, Trash2, ChevronDown, ChevronUp, Mail, Clock } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";

const STATUS_COLORS = {
  open: "destructive",
  "in-progress": "default",
  closed: "secondary",
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
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); }}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tickets</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={fetchTickets} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        {loading && tickets.length === 0 ? (
          <div className="text-center py-12 text-gray-400">Loading...</div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-12 text-gray-400 bg-white rounded-xl border border-gray-200">
            No tickets found
          </div>
        ) : (
          <div className="space-y-3">
            {tickets.map((ticket) => (
              <div key={ticket.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {/* Header row */}
                <button
                  className="w-full px-5 py-4 flex items-center gap-4 text-left hover:bg-gray-50 transition-colors"
                  onClick={() => setExpanded(expanded === ticket.id ? null : ticket.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-semibold text-gray-900">{ticket.name}</span>
                      <span className="text-sm text-gray-500">{ticket.email}</span>
                      {ticket.reason && (
                        <Badge variant="outline" className="text-xs">
                          {REASON_LABELS[ticket.reason] || ticket.reason}
                        </Badge>
                      )}
                      <Badge variant={STATUS_COLORS[ticket.status] || "outline"}>
                        {ticket.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500 mt-1 truncate">{ticket.message}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <Clock className="w-3 h-3" />
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </div>
                    {expanded === ticket.id ? (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </button>

                {/* Expanded detail */}
                {expanded === ticket.id && (
                  <div className="px-5 pb-5 border-t border-gray-100 space-y-4">
                    <div className="mt-4 bg-gray-50 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-wrap">
                      {ticket.message}
                    </div>

                    {ticket.notes && (
                      <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm text-blue-800">
                        <span className="font-medium">Internal note:</span> {ticket.notes}
                      </div>
                    )}

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Internal Note</label>
                      <Textarea
                        placeholder="Add an internal note (not visible to user)..."
                        value={notes[ticket.id] ?? (ticket.notes || "")}
                        onChange={(e) => setNotes(n => ({ ...n, [ticket.id]: e.target.value }))}
                        rows={3}
                      />
                    </div>

                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700">Status:</span>
                        <Select
                          value={ticket.status}
                          onValueChange={(v) => updateTicket(ticket.id, { status: v })}
                        >
                          <SelectTrigger className="w-36 h-8 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="open">Open</SelectItem>
                            <SelectItem value="in-progress">In Progress</SelectItem>
                            <SelectItem value="closed">Closed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const note = notes[ticket.id] ?? ticket.notes ?? "";
                            updateTicket(ticket.id, { notes: note });
                          }}
                        >
                          Save Note
                        </Button>
                        <a href={`mailto:${ticket.email}`} className="inline-flex">
                          <Button size="sm" variant="outline">
                            <Mail className="w-4 h-4 mr-1" />
                            Reply via Email
                          </Button>
                        </a>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteTicket(ticket.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
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

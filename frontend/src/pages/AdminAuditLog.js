import { useState, useEffect, useCallback } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Search, Trash2, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";
const PAGE_SIZE = 50;

const ACTION_COLORS = {
  delete_user: "destructive",
  ban_user: "destructive",
  unban_user: "secondary",
  ban_ip: "destructive",
  unban_ip: "secondary",
  delete_discount: "destructive",
  create_discount: "default",
  delete_blog_post: "destructive",
  create_blog_post: "default",
  update_blog_post: "outline",
  update_email_template: "outline",
  reset_email_template: "secondary",
  send_mass_email: "default",
  create_moderator: "default",
  delete_moderator: "destructive",
  export_csv: "outline",
  update_banner: "outline",
  maintenance_enabled: "destructive",
  maintenance_disabled: "secondary",
  auth_enabled: "secondary",
  auth_disabled: "destructive",
  update_ticket: "outline",
  delete_ticket: "destructive",
};

function actionColor(action) {
  return ACTION_COLORS[action] || "outline";
}

export default function AdminAuditLog() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [resourceFilter, setResourceFilter] = useState("all");
  const [clearing, setClearing] = useState(false);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("adminToken");
      const params = new URLSearchParams({
        skip: page * PAGE_SIZE,
        limit: PAGE_SIZE,
      });
      if (search) params.set("actor", search);
      if (actionFilter !== "all") params.set("action", actionFilter);
      if (resourceFilter !== "all") params.set("resource_type", resourceFilter);

      const res = await fetch(`${BACKEND_URL}/api/admin/audit-log?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load audit log");
      const data = await res.json();
      setLogs(data.logs || []);
      setTotal(data.total || 0);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, search, actionFilter, resourceFilter]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const handleClear = async () => {
    if (!window.confirm("Clear the entire audit log? This cannot be undone.")) return;
    setClearing(true);
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`${BACKEND_URL}/api/admin/audit-log`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to clear log");
      toast.success("Audit log cleared");
      setLogs([]);
      setTotal(0);
      setPage(0);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setClearing(false);
    }
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>
            <p className="text-sm text-gray-500 mt-1">{total} total entries</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchLogs} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button variant="destructive" size="sm" onClick={handleClear} disabled={clearing || loading}>
              <Trash2 className="w-4 h-4 mr-2" />
              Clear Log
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by actor email..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              className="pl-9"
            />
          </div>
          <Select value={actionFilter} onValueChange={(v) => { setActionFilter(v); setPage(0); }}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All actions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              <SelectItem value="delete_user">Delete User</SelectItem>
              <SelectItem value="ban_user">Ban User</SelectItem>
              <SelectItem value="unban_user">Unban User</SelectItem>
              <SelectItem value="ban_ip">Ban IP</SelectItem>
              <SelectItem value="unban_ip">Unban IP</SelectItem>
              <SelectItem value="create_discount">Create Discount</SelectItem>
              <SelectItem value="delete_discount">Delete Discount</SelectItem>
              <SelectItem value="create_blog_post">Create Blog Post</SelectItem>
              <SelectItem value="update_blog_post">Update Blog Post</SelectItem>
              <SelectItem value="delete_blog_post">Delete Blog Post</SelectItem>
              <SelectItem value="update_email_template">Update Template</SelectItem>
              <SelectItem value="send_mass_email">Mass Email</SelectItem>
              <SelectItem value="create_moderator">Create Moderator</SelectItem>
              <SelectItem value="delete_moderator">Delete Moderator</SelectItem>
              <SelectItem value="export_csv">CSV Export</SelectItem>
            </SelectContent>
          </Select>
          <Select value={resourceFilter} onValueChange={(v) => { setResourceFilter(v); setPage(0); }}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="All resources" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Resources</SelectItem>
              <SelectItem value="user">User</SelectItem>
              <SelectItem value="banned_ip">Banned IP</SelectItem>
              <SelectItem value="discount">Discount</SelectItem>
              <SelectItem value="blog_post">Blog Post</SelectItem>
              <SelectItem value="email_template">Email Template</SelectItem>
              <SelectItem value="mass_email">Mass Email</SelectItem>
              <SelectItem value="moderator">Moderator</SelectItem>
              <SelectItem value="site_settings">Site Settings</SelectItem>
              <SelectItem value="support_ticket">Support Ticket</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Timestamp</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Actor</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Role</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Action</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Resource</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-400">Loading...</td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-400">No log entries found</td>
                  </tr>
                ) : logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">
                      {log.actorEmail || log.actorId}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={log.role === "admin" ? "default" : "secondary"} className="capitalize">
                        {log.role}{log.level ? ` L${log.level}` : ""}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={actionColor(log.action)}>
                        {log.action.replace(/_/g, " ")}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {log.resourceType && (
                        <span className="capitalize">{log.resourceType.replace(/_/g, " ")}</span>
                      )}
                      {log.resourceId && (
                        <span className="ml-1 text-gray-400 text-xs font-mono truncate max-w-[120px] inline-block align-middle">
                          ({log.resourceId.length > 20 ? log.resourceId.slice(0, 20) + "…" : log.resourceId})
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500 max-w-[200px] truncate">
                      {log.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Page {page + 1} of {totalPages} ({total} entries)
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={page === 0}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

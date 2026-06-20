import { useState, useEffect, useCallback } from "react";
import AdminLayout from "@/components/AdminLayout";
import {
  IonButton, IonIcon, IonSpinner, IonSegment, IonSegmentButton, IonLabel,
} from "@ionic/react";
import {
  clipboardOutline, refreshOutline, trashOutline, searchOutline,
  chevronBackOutline, chevronForwardOutline, filterOutline,
} from "ionicons/icons";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";
const PAGE_SIZE = 50;

// Action → colour mapping (all inline, no CSS classes)
function getActionStyle(action = "") {
  const a = action.toLowerCase();
  if (/(delete|ban|disable|remove|clear|maintenance_enabled|auth_disabled)/.test(a))
    return { color: "var(--ion-color-danger)",  bg: "rgba(235,68,90,0.10)"  };
  if (/(create|unban|enable|add|auth_enabled|maintenance_disabled)/.test(a))
    return { color: "var(--ion-color-success)", bg: "rgba(45,211,111,0.10)" };
  if (/(send|export|mass|email)/.test(a))
    return { color: "var(--ion-color-primary)", bg: "rgba(var(--ion-color-primary-rgb),0.10)" };
  return { color: "var(--ion-color-medium)", bg: "rgba(0,0,0,0.06)" };
}

const thStyle = {
  padding: "10px 14px",
  textAlign: "left",
  fontSize: "0.72rem",
  fontWeight: 500,
  color: "var(--ion-color-medium)",
  background: "var(--ion-background-color)",
  whiteSpace: "nowrap",
  borderBottom: "1px solid var(--ion-border-color)",
  position: "sticky",
  top: 0,
  zIndex: 1,
};

const tdStyle = {
  padding: "0 14px",
  fontSize: "0.8rem",
  color: "var(--ion-text-color)",
  borderBottom: "1px solid var(--ion-border-color)",
};

const segBtnStyle = {
  "--border-radius":  "0",
  "--padding-top":    "0",
  "--padding-bottom": "0",
};

const ACTION_OPTIONS = [
  { value: "all",                  label: "All Actions"        },
  { value: "delete_user",          label: "Delete User"        },
  { value: "ban_user",             label: "Ban User"           },
  { value: "unban_user",           label: "Unban User"         },
  { value: "ban_ip",               label: "Ban IP"             },
  { value: "unban_ip",             label: "Unban IP"           },
  { value: "create_discount",      label: "Create Discount"    },
  { value: "delete_discount",      label: "Delete Discount"    },
  { value: "create_blog_post",     label: "Create Blog Post"   },
  { value: "update_blog_post",     label: "Update Blog Post"   },
  { value: "delete_blog_post",     label: "Delete Blog Post"   },
  { value: "update_email_template",label: "Update Template"    },
  { value: "send_mass_email",      label: "Mass Email"         },
  { value: "create_moderator",     label: "Create Moderator"   },
  { value: "delete_moderator",     label: "Delete Moderator"   },
  { value: "export_csv",           label: "CSV Export"         },
];

const RESOURCE_OPTIONS = [
  { value: "all",            label: "All Resources"  },
  { value: "user",           label: "User"           },
  { value: "banned_ip",      label: "Banned IP"      },
  { value: "discount",       label: "Discount"       },
  { value: "blog_post",      label: "Blog Post"      },
  { value: "email_template", label: "Email Template" },
  { value: "mass_email",     label: "Mass Email"     },
  { value: "moderator",      label: "Moderator"      },
  { value: "site_settings",  label: "Site Settings"  },
  { value: "support_ticket", label: "Support Ticket" },
];

const selectStyle = {
  padding: "7px 12px",
  borderRadius: 8,
  border: "1px solid var(--ion-border-color)",
  background: "var(--ion-background-color)",
  color: "var(--ion-text-color)",
  fontSize: "0.82rem",
  outline: "none",
};

export default function AdminAuditLog() {
  const [logs,           setLogs]           = useState([]);
  const [total,          setTotal]          = useState(0);
  const [page,           setPage]           = useState(0);
  const [loading,        setLoading]        = useState(false);
  const [search,         setSearch]         = useState("");
  const [actionFilter,   setActionFilter]   = useState("all");
  const [resourceFilter, setResourceFilter] = useState("all");
  const [clearing,       setClearing]       = useState(false);
  // Segment: "all" | "destructive" | "positive" | "neutral"
  const [segment,        setSegment]        = useState("all");

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("adminToken");
      const params = new URLSearchParams({ skip: page * PAGE_SIZE, limit: PAGE_SIZE });
      if (search)                      params.set("actor",         search);
      if (actionFilter   !== "all")    params.set("action",        actionFilter);
      if (resourceFilter !== "all")    params.set("resource_type", resourceFilter);

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
      setLogs([]); setTotal(0); setPage(0);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setClearing(false);
    }
  };

  // Apply segment filter on top of server results
  const visibleLogs = logs.filter(log => {
    if (segment === "all") return true;
    const { color } = getActionStyle(log.action);
    if (segment === "destructive") return color === "var(--ion-color-danger)";
    if (segment === "positive")    return color === "var(--ion-color-success)";
    return color === "var(--ion-color-medium)" || color === "var(--ion-color-primary)";
  });

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <AdminLayout fillHeight>
      <div style={{ padding: 10, height: "100%", boxSizing: "border-box", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: "4px 6px" }}>
          <div style={{ display: "flex", flexDirection: "column", flex: "1 1 0%", overflow: "hidden", background: "var(--ion-card-background)", borderRadius: 6, boxShadow: "0 4px 24px rgba(0,0,0,0.18)" }}>

            {/* ── header ── */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 24px", flexShrink: 0, borderBottom: "1px solid var(--ion-border-color)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(var(--ion-color-primary-rgb),0.10)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <IonIcon icon={clipboardOutline} style={{ color: "var(--ion-color-primary)", fontSize: 18 }} />
                </div>
                <div>
                  <h2 style={{ margin: "0 0 2px", fontWeight: 700, fontSize: "1.05rem", color: "var(--ion-text-color)", letterSpacing: "-0.01em" }}>
                    Audit Log
                  </h2>
                  <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--ion-color-medium)" }}>
                    {total} total entries
                  </p>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <IonButton fill="clear" color="medium" size="small" onClick={fetchLogs} disabled={loading} style={{ "--border-radius": "50%" }}>
                  <IonIcon slot="icon-only" icon={refreshOutline} style={{ fontSize: 18 }} />
                </IonButton>
                <IonButton color="danger" size="small" onClick={handleClear} disabled={clearing || loading} style={{ "--border-radius": "8px" }}>
                  {clearing
                    ? <IonSpinner name="crescent" style={{ width: 14, height: 14, marginRight: 6 }} />
                    : <IonIcon slot="start" icon={trashOutline} style={{ fontSize: 15 }} />}
                  Clear Log
                </IonButton>
              </div>
            </div>

            {/* ── segment tabs ── */}
            <div style={{ display: "flex", alignItems: "stretch", background: "var(--ion-card-background)", borderBottom: "1px solid var(--ion-border-color)", flexShrink: 0 }}>
              <IonSegment
                scrollable
                value={segment}
                onIonChange={e => setSegment(e.detail.value)}
                style={{ "--background": "transparent", flex: "1 1 0%" }}
              >
                {[
                  { value: "all",         label: "All" },
                  { value: "destructive", label: "Destructive" },
                  { value: "positive",    label: "Positive"    },
                  { value: "neutral",     label: "Neutral"     },
                ].map(tab => (
                  <IonSegmentButton key={tab.value} value={tab.value} layout="label-only" style={segBtnStyle}>
                    <IonLabel style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700, letterSpacing: "0.06em", whiteSpace: "nowrap" }}>
                      {tab.label}
                    </IonLabel>
                  </IonSegmentButton>
                ))}
              </IonSegment>
            </div>

            {/* ── filter bar ── */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", borderBottom: "1px solid var(--ion-border-color)", flexShrink: 0, flexWrap: "wrap" }}>
              <IonIcon icon={filterOutline} style={{ fontSize: 16, color: "var(--ion-color-medium)", flexShrink: 0 }} />

              {/* search */}
              <div style={{ position: "relative", flex: "1 1 160px", minWidth: 160 }}>
                <IonIcon icon={searchOutline} style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: "var(--ion-color-medium)", pointerEvents: "none" }} />
                <input
                  type="text"
                  placeholder="Search by actor email…"
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(0); }}
                  style={{ ...selectStyle, paddingLeft: 28, width: "100%", boxSizing: "border-box" }}
                />
              </div>

              {/* action filter */}
              <select
                value={actionFilter}
                onChange={e => { setActionFilter(e.target.value); setPage(0); }}
                style={{ ...selectStyle, flex: "0 0 auto" }}
              >
                {ACTION_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>

              {/* resource filter */}
              <select
                value={resourceFilter}
                onChange={e => { setResourceFilter(e.target.value); setPage(0); }}
                style={{ ...selectStyle, flex: "0 0 auto" }}
              >
                {RESOURCE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            {/* ── table ── */}
            <div style={{ flex: "1 1 0%", overflow: "auto" }}>
              {loading ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
                  <IonSpinner name="crescent" color="primary" style={{ width: 32, height: 32 }} />
                </div>
              ) : visibleLogs.length === 0 ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 10, color: "var(--ion-color-medium)" }}>
                  <IonIcon icon={clipboardOutline} style={{ fontSize: 40 }} />
                  <span style={{ fontSize: "0.875rem" }}>No log entries found</span>
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 800 }}>
                    <thead>
                      <tr>
                        <th style={{ ...thStyle, width: 160 }}>Timestamp</th>
                        <th style={thStyle}>Actor</th>
                        <th style={{ ...thStyle, width: 100 }}>Role</th>
                        <th style={{ ...thStyle, width: 180 }}>Action</th>
                        <th style={{ ...thStyle, width: 180 }}>Resource</th>
                        <th style={thStyle}>Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleLogs.map(log => {
                        const { color, bg } = getActionStyle(log.action);
                        const isAdmin = log.role === "admin";
                        return (
                          <tr key={log.id} style={{ height: 52 }}>
                            <td style={{ ...tdStyle, fontSize: "0.75rem", color: "var(--ion-color-medium)", whiteSpace: "nowrap" }}>
                              {new Date(log.timestamp).toLocaleString()}
                            </td>
                            <td style={{ ...tdStyle, fontWeight: 500, whiteSpace: "nowrap" }}>
                              {log.actorEmail || log.actorId || "—"}
                            </td>
                            <td style={tdStyle}>
                              <span style={{
                                display: "inline-block", padding: "2px 8px", borderRadius: 20,
                                fontSize: "0.7rem", fontWeight: 700, textTransform: "capitalize",
                                background: isAdmin ? "rgba(var(--ion-color-primary-rgb),0.10)" : "rgba(0,0,0,0.06)",
                                color: isAdmin ? "var(--ion-color-primary)" : "var(--ion-color-medium)",
                              }}>
                                {log.role}{log.level ? ` L${log.level}` : ""}
                              </span>
                            </td>
                            <td style={tdStyle}>
                              <span style={{ display: "inline-block", padding: "2px 9px", borderRadius: 20, fontSize: "0.7rem", fontWeight: 700, background: bg, color }}>
                                {log.action.replace(/_/g, " ")}
                              </span>
                            </td>
                            <td style={{ ...tdStyle, fontSize: "0.78rem" }}>
                              {log.resourceType && (
                                <span style={{ textTransform: "capitalize", color: "var(--ion-text-color)" }}>
                                  {log.resourceType.replace(/_/g, " ")}
                                </span>
                              )}
                              {log.resourceId && (
                                <span style={{ marginLeft: 5, color: "var(--ion-color-medium)", fontSize: "0.68rem", fontFamily: "monospace" }}>
                                  ({log.resourceId.length > 16 ? log.resourceId.slice(0, 16) + "…" : log.resourceId})
                                </span>
                              )}
                            </td>
                            <td style={{ ...tdStyle, maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--ion-color-medium)", fontSize: "0.78rem" }}>
                              {log.details || "—"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* ── pagination ── */}
            {totalPages > 1 && (
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "8px 20px", borderTop: "1px solid var(--ion-border-color)", flexShrink: 0,
                background: "var(--ion-background-color)",
              }}>
                <span style={{ fontSize: "0.78rem", color: "var(--ion-color-medium)" }}>
                  Page {page + 1} of {totalPages} · {total} entries
                </span>
                <div style={{ display: "flex", gap: 6 }}>
                  <IonButton fill="outline" size="small" color="medium" onClick={() => setPage(p => p - 1)} disabled={page === 0} style={{ "--border-radius": "8px" }}>
                    <IonIcon slot="icon-only" icon={chevronBackOutline} style={{ fontSize: 16 }} />
                  </IonButton>
                  <IonButton fill="outline" size="small" color="medium" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1} style={{ "--border-radius": "8px" }}>
                    <IonIcon slot="icon-only" icon={chevronForwardOutline} style={{ fontSize: 16 }} />
                  </IonButton>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

import { useState, useCallback, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton,
  IonContent, IonList, IonItem, IonLabel, IonIcon, IonSpinner,
} from "@ionic/react";
import { closeOutline, folderOpenOutline } from "ionicons/icons";
import AdminLayout from "@/components/AdminLayout";
import SupportCenter from "@/components/SupportCenter";
import PurchaseDetailModal from "@/components/PurchaseDetailModal";
import { useMinimizedChats } from "@/contexts/MinimizedChatsContext";
import { toast } from "@/utils/toast";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";
const POLL_MS = 8000;

const REASON_LABELS = {
  general: "General Question",
  technical: "Technical Issue",
  billing: "Billing",
  refund: "Refund Request",
  other: "Other",
};

// Same labels/colors the Purchases page uses for its rows
const DOC_LABELS = {
  "paystub": "Pay Stub", "canadian-paystub": "Canadian Pay Stub", "resume": "AI Resume",
  "w2": "W-2 Form", "w9": "W-9 Form", "1099-nec": "1099-NEC", "1099-misc": "1099-MISC",
  "bank-statement": "Accounting Mockup", "offer-letter": "Offer Letter",
  "cease-and-desist": "Cease and Desist", "legal-document": "Legal Document",
  "power-of-attorney": "Power of Attorney", "commercial-lease": "Commercial Lease",
  "vehicle-bill-of-sale": "Vehicle Bill of Sale", "schedule-c": "Schedule C",
  "utility-bill": "Utility Bill",
};
const DOC_COLORS = {
  "paystub": "#059669", "canadian-paystub": "#059669", "resume": "#2563eb",
  "w2": "#7c3aed", "w9": "#7c3aed", "1099-nec": "#d97706", "1099-misc": "#d97706",
  "bank-statement": "#0891b2", "offer-letter": "#059669", "cease-and-desist": "#b91c1c",
  "legal-document": "#064e3b", "power-of-attorney": "#7c3aed", "commercial-lease": "#0891b2",
  "vehicle-bill-of-sale": "#dc2626", "schedule-c": "#92400e", "utility-bill": "#64748b",
};

function formatPurchaseDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" }) +
    " · " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

const ADMIN_USER = (() => {
  try { return JSON.parse(localStorage.getItem("adminInfo") || "{}"); } catch { return {}; }
})();

// Read a File into a data URL so it can travel in the JSON message body
const fileToDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = () => reject(new Error("Failed to read image"));
  reader.readAsDataURL(file);
});

// Convert a support-chat DB record to SupportCenter's conversation shape
function chatToConv(chat) {
  const last = chat.messages?.slice(-1)[0];
  return {
    id: chat.id,
    name: chat.guestName || "Guest",
    avatar: null,
    type: "direct",
    lastMessage: last?.text || (last?.images?.length ? "📷 Photo" : ""),
    lastMessageTime: chat.updatedAt,
    // Presence comes ONLY from user-side activity (widget polls/messages/
    // typing bump userLastSeen on the backend). updatedAt would light the
    // "Online now" dot whenever the ADMIN replies or closes the ticket.
    lastActive: chat.userLastSeen || null,
    unread: chat.unreadByAdmin || 0,
    pinned: chat.pinned || false,
    isBlocked: chat.isBlocked || false,
    archived: chat.status === "closed",
    reason: chat.reason,
    guestEmail: chat.guestEmail,
    // raw reference for sends
    _raw: chat,
  };
}

// Convert DB messages to SupportCenter's message shape
function dbMsgToMsg(msg, adminUser) {
  return {
    id: msg.id,
    senderId: msg.fromAdmin ? (adminUser?.id || "admin") : "guest",
    senderName: msg.senderName || (msg.fromAdmin ? "Support" : "Guest"),
    senderAvatar: null,
    text: msg.text,
    images: (msg.images || []).map(u => (u.startsWith("data:") ? u : BACKEND_URL + u)),
    timestamp: msg.timestamp,
    read: msg.read || false,
    isOwn: msg.fromAdmin,
  };
}

const TYPING_TTL = 6000;
function isTypingFresh(ts) {
  if (!ts) return false;
  return Date.now() - new Date(ts).getTime() < TYPING_TTL;
}

export default function AdminLiveChat() {
  const location = useLocation();
  const navigate = useNavigate();
  const [chats,     setChats]     = useState([]);
  const [activeId,  setActiveId]  = useState(null);
  const [messages,  setMessages]  = useState([]);
  const [isSending, setIsSending] = useState(false);
  const [isTyping,  setIsTyping]  = useState(false);  // user is typing
  const pollRef      = useRef(null);
  const typingTimer  = useRef(null);
  const activeIdRef  = useRef(activeId);
  useEffect(() => { activeIdRef.current = activeId; }, [activeId]);

  // ── fetch all chats ──────────────────────────────────────────────────────────
  const fetchChats = useCallback(async () => {
    const token = localStorage.getItem("adminToken");
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/support-chats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      setChats(data.chats || []);
    } catch {}
  }, []);

  // ── fetch messages + typing state for active chat ───────────────────────────
  const fetchMessages = useCallback(async (id) => {
    if (!id) return;
    const token = localStorage.getItem("adminToken");
    try {
      const res = await fetch(`${BACKEND_URL}/api/support/chat/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      const chat = data.chat || {};
      const msgs = (chat.messages || []).map(m => dbMsgToMsg(m, ADMIN_USER));
      setMessages(msgs);
      setIsTyping(isTypingFresh(chat.userTyping));
      setChats(prev => prev.map(c => c.id === id ? { ...c, unreadByAdmin: 0 } : c));
    } catch {}
  }, []);

  // ── send admin typing signal ─────────────────────────────────────────────────
  const sendAdminTyping = useCallback((isT) => {
    const id = activeIdRef.current;
    if (!id) return;
    const token = localStorage.getItem("adminToken");
    fetch(`${BACKEND_URL}/api/admin/support-chats/${id}/typing`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ isTyping: isT }),
    }).catch(() => {});
  }, []);

  // SupportCenter calls this when the admin's input changes
  const handleAdminTyping = useCallback((hasText) => {
    if (hasText) {
      sendAdminTyping(true);
      clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => sendAdminTyping(false), 1500);
    } else {
      clearTimeout(typingTimer.current);
      sendAdminTyping(false);
    }
  }, [sendAdminTyping]);

  // initial load + polling
  useEffect(() => {
    fetchChats();
    pollRef.current = setInterval(() => {
      fetchChats();
      if (activeIdRef.current) fetchMessages(activeIdRef.current);
    }, POLL_MS);
    return () => clearInterval(pollRef.current);
  }, [fetchChats, fetchMessages]);

  // reload messages when active chat changes
  useEffect(() => {
    if (activeId) fetchMessages(activeId);
    else setMessages([]);
  }, [activeId, fetchMessages]);

  // Deep link from the topbar search: /admin/support?chat=<id> opens that
  // conversation once the list has loaded, then cleans the URL.
  useEffect(() => {
    const id = new URLSearchParams(location.search).get("chat");
    if (!id || !chats.length) return;
    if (chats.some((c) => c.id === id)) setActiveId(id);
    navigate(location.pathname, { replace: true });
  }, [chats, location.search]); // eslint-disable-line

  // ── actions ──────────────────────────────────────────────────────────────────
  const handleSelect = useCallback((id) => setActiveId(id), []);

  const handleSend = useCallback(async (text, imageFiles = []) => {
    const trimmed = (text || "").trim();
    if ((!trimmed && imageFiles.length === 0) || !activeId) return;
    setIsSending(true);
    const token = localStorage.getItem("adminToken");
    try {
      const images = await Promise.all(imageFiles.map(fileToDataUrl));
      const res = await fetch(`${BACKEND_URL}/api/admin/support-chats/${activeId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ text: trimmed, images }),
      });
      if (!res.ok) { toast.error("Failed to send"); return; }
      const data = await res.json();
      setMessages(prev => [...prev, dbMsgToMsg(data.message, ADMIN_USER)]);
      setChats(prev => prev.map(c => c.id === activeId
        ? { ...c, messages: [...(c.messages || []), data.message], updatedAt: data.message.timestamp }
        : c));
    } catch { toast.error("Network error"); }
    finally { setIsSending(false); }
  }, [activeId]);

  const handlePin = useCallback((id, pinned) => {
    setChats(prev => prev.map(c => c.id === id ? { ...c, pinned } : c));
  }, []);

  const handleClose = useCallback(async (id) => {
    const token = localStorage.getItem("adminToken");
    await fetch(`${BACKEND_URL}/api/admin/support-chats/${id}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status: "closed" }),
    });
    setChats(prev => prev.map(c => c.id === id ? { ...c, status: "closed", archived: true, unreadByAdmin: 0 } : c));
    if (activeId === id) setActiveId(null);
  }, [activeId]);

  // ── customer documents (folder icon) ─────────────────────────────────────────
  // { conv, email, loading, purchases } — mounted fresh per open, like the
  // other admin detail modals.
  const [docsModal,  setDocsModal]  = useState(null);
  const [docDetail,  setDocDetail]  = useState(null);

  const handleViewDocuments = useCallback(async (conv) => {
    const email = (conv?.guestEmail || "").trim();
    setDocsModal({ conv, email, loading: !!email, purchases: [] });
    if (!email) return;
    const token = localStorage.getItem("adminToken");
    try {
      const res = await fetch(
        `${BACKEND_URL}/api/admin/purchases?limit=200&email=${encodeURIComponent(email)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = res.ok ? await res.json() : {};
      setDocsModal(cur => (cur && cur.conv?.id === conv.id
        ? { ...cur, loading: false, purchases: data.purchases || [] }
        : cur));
    } catch {
      setDocsModal(cur => (cur && cur.conv?.id === conv.id ? { ...cur, loading: false } : cur));
    }
  }, []);

  const handleReopen = useCallback(async (id) => {
    const token = localStorage.getItem("adminToken");
    const res = await fetch(`${BACKEND_URL}/api/admin/support-chats/${id}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status: "open" }),
    }).catch(() => null);
    if (!res || !res.ok) { toast.error("Failed to reopen ticket"); return; }
    setChats(prev => prev.map(c => c.id === id ? { ...c, status: "open" } : c));
    toast.success("Ticket reopened — the customer has been emailed");
  }, []);

  const handleDelete = useCallback(async (id) => {
    if (!window.confirm("Permanently delete this conversation? This cannot be undone.")) return;
    const token = localStorage.getItem("adminToken");
    await fetch(`${BACKEND_URL}/api/admin/support-chats/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    setChats(prev => prev.filter(c => c.id !== id));
    if (activeId === id) setActiveId(null);
  }, [activeId]);

  const handleBlock = useCallback((id, blocked) => {
    setChats(prev => prev.map(c => c.id === id ? { ...c, isBlocked: blocked } : c));
  }, []);

  // ── minimize ─────────────────────────────────────────────────────────────────
  const { minimize } = useMinimizedChats();
  const handleMinimize = useCallback((convo, msgs) => {
    minimize(convo, msgs);
    setActiveId(null);
  }, [minimize]);

  // ── restore from bubble ───────────────────────────────────────────────────────
  useEffect(() => {
    const onRestore = (e) => {
      const found = e.detail;
      if (!found) return;
      setActiveId(found.id);
      if (found.messages?.length) setMessages(found.messages);
    };
    window.addEventListener("your-app-restore-mini", onRestore);
    return () => window.removeEventListener("your-app-restore-mini", onRestore);
  }, []);

  // ── derived ───────────────────────────────────────────────────────────────────
  const conversations = chats.map(chatToConv);
  const activeConv    = conversations.find(c => c.id === activeId) || null;

  // The list shows just the name; the chat header shows guestEmail on its own
  // line (SupportCenter reads it straight off the conversation).
  const enrichedConvs = conversations.map(c => ({
    ...c,
    lastMessage: c.reason ? `[${REASON_LABELS[c.reason] || c.reason}] ${c.lastMessage}` : c.lastMessage,
  }));

  return (
    <AdminLayout fillHeight>
      <SupportCenter
        conversations={enrichedConvs}
        activeConversationId={activeId}
        messages={messages}
        currentUser={{ id: ADMIN_USER.id || "admin", name: ADMIN_USER.name || "Support" }}
        isTyping={isTyping}
        isSending={isSending}
        contacts={[]}
        onSelectConversation={handleSelect}
        onSendMessage={handleSend}
        onPinConversation={handlePin}
        onDeleteConversation={handleDelete}
        onBlockUser={handleBlock}
        onNewConversation={() => {}}
        onMinimize={handleMinimize}
        onTyping={handleAdminTyping}
        onCloseConversation={handleClose}
        onReopenConversation={handleReopen}
        onViewDocuments={handleViewDocuments}
      />

      {/* ── Customer documents modal (purchases-style) — every document the
          conversation's email has ever made; a row opens the same
          payment-detail modal the Purchases page uses. ── */}
      {docsModal && (
        <IonModal
          isOpen
          onDidDismiss={() => setDocsModal(null)}
          className="admin-detail-modal"
        >
          <IonHeader>
            <IonToolbar>
              <IonTitle>{docsModal.conv?.name || "Customer"}&rsquo;s Documents</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setDocsModal(null)} aria-label="Close">
                  <IonIcon icon={closeOutline} slot="icon-only" />
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            <div style={{ padding: "10px 16px", borderBottom: "1px solid var(--ion-border-color)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
              <span style={{ fontSize: "0.8rem", color: "var(--ion-color-medium)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {docsModal.email || "No email on this conversation"}
              </span>
              {!docsModal.loading && (
                <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--ion-color-primary)", flexShrink: 0 }}>
                  {docsModal.purchases.length} document{docsModal.purchases.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>
            {docsModal.loading ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "40px 16px", color: "var(--ion-color-medium)" }}>
                <IonSpinner name="crescent" style={{ width: 20, height: 20 }} /> Loading…
              </div>
            ) : docsModal.purchases.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "40px 16px", color: "var(--ion-color-medium)" }}>
                <IonIcon icon={folderOpenOutline} style={{ fontSize: 36 }} />
                <span style={{ fontSize: "0.88rem" }}>No documents found for this email</span>
              </div>
            ) : (
              <IonList lines="full" style={{ padding: 0 }}>
                {docsModal.purchases.map(p => (
                  <IonItem
                    key={p.id}
                    button
                    detail={false}
                    onClick={() => setDocDetail(p)}
                    style={{ "--min-height": "58px", "--padding-start": "16px", "--inner-padding-end": "16px" }}
                  >
                    <IonLabel>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: DOC_COLORS[p.documentType] || "#64748b", flexShrink: 0 }} />
                        <span style={{ fontSize: "0.88rem", fontWeight: 600 }}>
                          {DOC_LABELS[p.documentType] || p.documentType || "Document"}
                          {p.quantity > 1 ? ` ×${p.quantity}` : ""}
                        </span>
                        {p.refunded && (
                          <span className="admin-badge admin-badge-amber" style={{ flexShrink: 0 }}>Refunded</span>
                        )}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "var(--ion-color-medium)", marginTop: 2 }}>
                        {formatPurchaseDate(p.createdAt)}
                      </div>
                    </IonLabel>
                    <span slot="end" style={{ fontSize: "0.88rem", fontWeight: 700, color: "var(--ion-color-primary)" }}>
                      ${Number(p.amount || 0).toFixed(2)}
                    </span>
                  </IonItem>
                ))}
              </IonList>
            )}
          </IonContent>
        </IonModal>
      )}

      {/* Same payment-detail modal the Purchases page uses, opened from a
          document row above. */}
      <PurchaseDetailModal
        purchase={docDetail}
        onClose={() => setDocDetail(null)}
        onRefunded={(p, amount) => {
          setDocDetail(d => (d ? { ...d, refunded: true, refundedAmount: amount } : d));
          setDocsModal(cur => (cur
            ? { ...cur, purchases: cur.purchases.map(x => x.id === p.id ? { ...x, refunded: true, refundedAmount: amount } : x) }
            : cur));
        }}
      />
    </AdminLayout>
  );
}

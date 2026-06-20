import { useState, useCallback, useEffect, useRef } from "react";
import AdminLayout from "@/components/AdminLayout";
import SupportCenter from "@/components/SupportCenter";
import { useMinimizedChats } from "@/contexts/MinimizedChatsContext";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";
const POLL_MS = 8000;

const REASON_LABELS = {
  general: "General Question",
  technical: "Technical Issue",
  billing: "Billing",
  refund: "Refund Request",
  other: "Other",
};

const ADMIN_USER = (() => {
  try { return JSON.parse(localStorage.getItem("adminInfo") || "{}"); } catch { return {}; }
})();

// Convert a support-chat DB record to SupportCenter's conversation shape
function chatToConv(chat) {
  return {
    id: chat.id,
    name: chat.guestName || "Guest",
    avatar: null,
    type: "direct",
    lastMessage: chat.messages?.slice(-1)[0]?.text || "",
    lastMessageTime: chat.updatedAt,
    lastActive: chat.updatedAt,
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

  // ── actions ──────────────────────────────────────────────────────────────────
  const handleSelect = useCallback((id) => setActiveId(id), []);

  const handleSend = useCallback(async (text) => {
    if (!text?.trim() || !activeId) return;
    setIsSending(true);
    const token = localStorage.getItem("adminToken");
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/support-chats/${activeId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ text: text.trim() }),
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
    setChats(prev => prev.map(c => c.id === id ? { ...c, status: "closed", archived: true } : c));
    if (activeId === id) setActiveId(null);
  }, [activeId]);

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

  // Inject guest email as a subtitle hint in the chat header
  const enrichedConvs = conversations.map(c => ({
    ...c,
    name: c.name + (c.guestEmail ? ` (${c.guestEmail})` : ""),
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
      />
    </AdminLayout>
  );
}

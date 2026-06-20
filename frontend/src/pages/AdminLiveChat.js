import { useState, useCallback } from "react";
import AdminLayout from "@/components/AdminLayout";
import SupportCenter from "@/components/SupportCenter";

// ── stub data ──────────────────────────────────────────────────────────────────

const NOW = Date.now();
const mins = (n) => new Date(NOW - n * 60000).toISOString();

const STUB_CONVS = [
  { id: "c1", name: "James Porter", type: "direct", lastActive: mins(2), lastMessageTime: mins(2), lastMessage: "Got it, thanks!", unread: 2, pinned: true },
  { id: "c2", name: "Sarah Kim", type: "load", loadNumber: "TX-4821", lastActive: mins(18), lastMessageTime: mins(18), lastMessage: "Where is my pickup?", unread: 0, pinned: false },
  { id: "c3", name: "Marcus Bell", type: "load", loadNumber: "FL-9034", lastActive: mins(47), lastMessageTime: mins(47), lastMessage: "Documents ready", unread: 1 },
  { id: "c4", name: "Priya Nair", type: "direct", lastActive: mins(200), lastMessageTime: mins(200), lastMessage: "Please review the update.", unread: 0 },
  { id: "c5", name: "Truck World LLC", type: "direct", lastActive: mins(800), lastMessageTime: mins(800), lastMessage: "Awaiting confirmation.", unread: 0, archived: true },
];

const STUB_MESSAGES = {
  c1: [
    { id: "m1", senderId: "u1", senderName: "James Porter", text: "Hey, I need help with my last delivery.", timestamp: mins(12) },
    { id: "m2", senderId: "me", senderName: "Support", text: "Of course! What seems to be the issue?", timestamp: mins(11), read: true },
    { id: "m3", senderId: "u1", senderName: "James Porter", text: "The pickup address was wrong.\nCan you fix it for load TX-4821?", timestamp: mins(10) },
    { id: "m4", senderId: "me", senderName: "Support", text: "Let me look that up for you right now.", timestamp: mins(9), read: true },
    { id: "m5", senderId: "me", senderName: "Support", text: "I've updated the address. You should see it reflected in the app.", timestamp: mins(8, 45), read: true },
    { id: "m6", senderId: "u1", senderName: "James Porter", text: "Got it, thanks!", timestamp: mins(2) },
  ],
  c2: [
    { id: "m10", senderId: "u2", senderName: "Sarah Kim", text: "Where is my pickup?", timestamp: mins(18) },
  ],
  c3: [
    { id: "m20", senderId: "u3", senderName: "Marcus Bell", text: "Documents ready", timestamp: mins(47) },
  ],
};

const STUB_CONTACTS = [
  { id: "u1", name: "James Porter", company: "Porter Freight", role: "Driver" },
  { id: "u2", name: "Sarah Kim", company: "Kim Logistics", role: "Dispatcher" },
  { id: "u3", name: "Marcus Bell", role: "Owner-Operator" },
  { id: "u4", name: "Priya Nair", company: "Nair Transport", role: "Fleet Manager" },
  { id: "u5", name: "Truck World LLC", role: "Carrier" },
];

const STUB_USER = { id: "me", name: "Support" };

// ── page ───────────────────────────────────────────────────────────────────────

export default function AdminLiveChat() {
  const [conversations, setConversations] = useState(STUB_CONVS);
  const [activeId, setActiveId] = useState(null);
  const [allMessages, setAllMessages] = useState(STUB_MESSAGES);
  const [isTyping] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const messages = activeId ? (allMessages[activeId] || []) : [];

  const handleSelect = useCallback((id) => setActiveId(id), []);

  const handleSend = useCallback((text, images) => {
    if (!activeId) return;
    setIsSending(true);
    const msg = {
      id: `m_${Date.now()}`,
      senderId: STUB_USER.id,
      senderName: STUB_USER.name,
      text,
      timestamp: new Date().toISOString(),
      read: false,
      images: images?.map(f => URL.createObjectURL(f)) || [],
    };
    setAllMessages(prev => ({ ...prev, [activeId]: [...(prev[activeId] || []), msg] }));
    setConversations(prev => prev.map(c => c.id === activeId ? { ...c, lastMessage: text, lastMessageTime: msg.timestamp } : c));
    setTimeout(() => setIsSending(false), 600);
  }, [activeId]);

  const handlePin = useCallback((id, pinned) => {
    setConversations(prev => prev.map(c => c.id === id ? { ...c, pinned } : c));
  }, []);

  const handleDelete = useCallback((id) => {
    setConversations(prev => prev.filter(c => c.id !== id));
    if (activeId === id) setActiveId(null);
  }, [activeId]);

  const handleBlock = useCallback((id, blocked) => {
    setConversations(prev => prev.map(c => c.id === id ? { ...c, isBlocked: blocked } : c));
  }, []);

  const handleNewConversation = useCallback((contactId) => {
    const contact = STUB_CONTACTS.find(c => c.id === contactId);
    if (!contact) return;
    const existing = conversations.find(c => c.id === contactId);
    if (existing) { setActiveId(contactId); return; }
    const newConv = {
      id: contactId, name: contact.name, type: 'direct',
      lastActive: new Date().toISOString(), lastMessageTime: null,
      lastMessage: '', unread: 0,
    };
    setConversations(prev => [newConv, ...prev]);
    setActiveId(contactId);
  }, [conversations]);

  return (
    <AdminLayout fillHeight>
      <SupportCenter
        conversations={conversations}
        activeConversationId={activeId}
        messages={messages}
        currentUser={STUB_USER}
        isTyping={isTyping}
        isSending={isSending}
        contacts={STUB_CONTACTS}
        onSelectConversation={handleSelect}
        onSendMessage={handleSend}
        onPinConversation={handlePin}
        onDeleteConversation={handleDelete}
        onBlockUser={handleBlock}
        onNewConversation={handleNewConversation}
      />
    </AdminLayout>
  );
}

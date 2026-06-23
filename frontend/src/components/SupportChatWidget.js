/**
 * SupportChatWidget
 * Floating live-chat bubble rendered via React portal.
 * Works on both the web site and the mobile Ionic app.
 *
 * Props:
 *   currentUser  – { id?, name?, email? } or null for guests
 *   bottomOffset – extra px above the default 24 (use when a tab bar is present)
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { IonButton, IonIcon, IonSpinner } from '@ionic/react';
import {
  chatbubblesOutline, closeOutline, sendOutline,
  chevronDownOutline, checkmarkCircleOutline, reloadOutline, timeOutline,
} from 'ionicons/icons';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
const LS_KEY      = 'support-chat-state';
const POLL_OPEN   = 5000;
const POLL_BG     = 20000;

const REASONS = [
  { id: 'general',   label: 'General Question' },
  { id: 'technical', label: 'Technical Issue'  },
  { id: 'billing',   label: 'Billing'          },
  { id: 'refund',    label: 'Refund Request'   },
  { id: 'other',     label: 'Other'            },
];

// ── localStorage helpers ───────────────────────────────────────────────────────
function loadPersistedState() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || 'null') || {}; }
  catch { return {}; }
}
function persist(patch) {
  try {
    const prev = loadPersistedState();
    localStorage.setItem(LS_KEY, JSON.stringify({ ...prev, ...patch }));
  } catch {}
}

// ── tiny sub-components ────────────────────────────────────────────────────────
function BotAvatar({ size = 28 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: 'linear-gradient(135deg,#2dd36f,#10b14a)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <IonIcon icon={chatbubblesOutline} style={{ color: '#fff', fontSize: size * 0.52 }} />
    </div>
  );
}

function UserAvatar({ name = '?', size = 28 }) {
  const initials = name.split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || '?';
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: 'var(--ion-color-primary)',
      color: '#fff', fontSize: size * 0.42, fontWeight: 700,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {initials}
    </div>
  );
}

// typing expired if timestamp older than 6 seconds
const TYPING_TTL = 6000;
function isTypingFresh(ts) {
  if (!ts) return false;
  return Date.now() - new Date(ts).getTime() < TYPING_TTL;
}

// ── main widget ────────────────────────────────────────────────────────────────
export default function SupportChatWidget({ currentUser = null, bottomOffset = 0 }) {
  const stored = loadPersistedState();

  const [isOpen,        setIsOpen]        = useState(false);
  const [view,          setView]          = useState(stored.chatId ? 'chat' : 'form');
  const [chatId,        setChatId]        = useState(stored.chatId || null);
  const [chatClosed,    setChatClosed]    = useState(stored.closed || false);
  const [messages,      setMessages]      = useState([]);
  const [unread,        setUnread]        = useState(0);
  const [adminTyping,   setAdminTyping]   = useState(false);  // support is typing
  const [adminOnline,   setAdminOnline]   = useState(true);   // any admin/mod online

  // form fields
  const [reason,    setReason]    = useState(stored.reason || '');
  const [name,      setName]      = useState(stored.name   || currentUser?.name  || '');
  const [email,     setEmail]     = useState(stored.email  || currentUser?.email || '');
  const [firstMsg,  setFirstMsg]  = useState('');
  const [chatInput, setChatInput] = useState('');

  // loading
  const [starting, setStarting] = useState(false);
  const [sending,  setSending]  = useState(false);
  const [loading,  setLoading]  = useState(false);

  const msgEndRef    = useRef(null);
  const pollRef      = useRef(null);
  const chatInputRef = useRef(null);
  const isOpenRef    = useRef(isOpen);
  const typingTimer  = useRef(null);    // debounce for user typing signal
  useEffect(() => { isOpenRef.current = isOpen; }, [isOpen]);

  // ── fetch messages + typing state ────────────────────────────────────────────
  const fetchMessages = useCallback(async (id, markRead = false) => {
    if (!id) return;
    try {
      const url = `${BACKEND_URL}/api/support/chat/${id}${markRead ? '?mark_read=true' : ''}`;
      const res = await fetch(url);
      if (res.status === 404) {
        // Chat was permanently deleted by admin — reset widget completely
        setChatId(null); setMessages([]); setView('form');
        setReason(''); setChatClosed(false); setUnread(0);
        try { localStorage.removeItem(LS_KEY); } catch {}
        return;
      }
      if (!res.ok) return;
      const data = await res.json();
      const chat = data.chat || {};
      const msgs = chat.messages || [];
      setMessages(msgs);
      setChatClosed(chat.status === 'closed');
      setAdminOnline(data.adminOnline !== false);
      // admin typing indicator
      setAdminTyping(isTypingFresh(chat.adminTyping));
      // unread: use server-side counter, zero it when open
      if (!isOpenRef.current) {
        setUnread(chat.unreadByUser || 0);
      } else {
        setUnread(0);
      }
    } catch {}
  }, []);

  // ── polling ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!chatId) return;
    clearInterval(pollRef.current);
    const delay = isOpen ? POLL_OPEN : POLL_BG;
    pollRef.current = setInterval(() => fetchMessages(chatId, false), delay);
    return () => clearInterval(pollRef.current);
  }, [chatId, isOpen, fetchMessages]);

  // initial load
  useEffect(() => {
    if (chatId) {
      setLoading(true);
      fetchMessages(chatId, false).finally(() => setLoading(false));
    }
  }, []); // eslint-disable-line

  // scroll to bottom when messages arrive or popup opens
  useEffect(() => {
    if (isOpen) msgEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, adminTyping, isOpen]);

  // focus input when popup opens
  useEffect(() => {
    if (isOpen && view === 'chat') setTimeout(() => chatInputRef.current?.focus(), 120);
  }, [isOpen, view]);

  // ── send user typing signal (debounced 1.5s) ─────────────────────────────────
  const sendTyping = useCallback((isTyping) => {
    if (!chatId) return;
    fetch(`${BACKEND_URL}/api/support/chat/${chatId}/typing`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isTyping }),
    }).catch(() => {});
  }, [chatId]);

  const handleChatInputChange = (e) => {
    setChatInput(e.target.value);
    if (!chatId) return;
    // send isTyping=true immediately, then debounce isTyping=false
    sendTyping(true);
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => sendTyping(false), 1500);
  };

  // ── open/close popup ─────────────────────────────────────────────────────────
  const openChat = useCallback(() => {
    setIsOpen(true);
    setUnread(0);
    if (chatId) fetchMessages(chatId, true);
  }, [chatId, fetchMessages]);
  const closeChat = () => {
    setIsOpen(false);
    sendTyping(false); // clear typing on close
  };

  // global trigger (from other pages)
  useEffect(() => {
    window.addEventListener('mintslip-open-support', openChat);
    return () => window.removeEventListener('mintslip-open-support', openChat);
  }, [openChat]);

  // ── start conversation ───────────────────────────────────────────────────────
  const handleStart = async () => {
    if (!name.trim() || !email.trim() || !firstMsg.trim() || !reason) return;
    setStarting(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/support/chat/start`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(), email: email.trim(),
          reason, message: firstMsg.trim(),
          userId: currentUser?.id || currentUser?._id || null,
        }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      const id = data.chatId;
      setChatId(id);
      setMessages([data.message]);
      setAdminOnline(data.adminOnline !== false);
      setView('chat');
      persist({ chatId: id, reason, name: name.trim(), email: email.trim() });
    } catch {
      // keep form open
    } finally {
      setStarting(false);
    }
  };

  // ── send message ─────────────────────────────────────────────────────────────
  const handleSend = async () => {
    const text = chatInput.trim();
    if (!text || sending || !chatId) return;
    setSending(true);
    setChatInput('');
    sendTyping(false); // clear typing
    clearTimeout(typingTimer.current);
    try {
      const res = await fetch(`${BACKEND_URL}/api/support/chat/${chatId}/message`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setMessages(prev => [...prev, data.message]);
      setAdminOnline(data.adminOnline !== false);
    } catch {
      setChatInput(text); // restore on failure
    } finally {
      setSending(false);
    }
  };

  // ── reset (start new chat) ───────────────────────────────────────────────────
  const handleReset = () => {
    setChatId(null); setMessages([]); setView('form');
    setReason(''); setFirstMsg(''); setChatClosed(false); setUnread(0);
    try { localStorage.removeItem(LS_KEY); } catch {}
  };

  // ── keyboard ─────────────────────────────────────────────────────────────────
  const onFormKey  = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleStart(); } };
  const onChatKey  = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } };

  // ── hide on admin pages ───────────────────────────────────────────────────────
  if (window.location.pathname.startsWith('/admin')) return null;

  // ── layout helpers ────────────────────────────────────────────────────────────
  const isMobile  = window.innerWidth < 600;
  const btnBottom = 24 + bottomOffset;
  const btnRight  = isMobile ? 16 : 24;
  const popW      = isMobile ? window.innerWidth - 32 : 360;
  const popBottom = btnBottom + 64 + 8;
  const popRight  = btnRight;

  // ─────────────────────────────────────────────────────────────────────────────

  const widget = (
    <>
      <style>{`
        @keyframes scw-bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
      `}</style>
      {/* floating button */}
      <div
        onClick={isOpen ? closeChat : openChat}
        style={{
          position: 'fixed', bottom: btnBottom, right: btnRight,
          zIndex: 99990,
          width: 56, height: 56, borderRadius: '50%',
          background: 'linear-gradient(135deg,#2dd36f,#10b14a)',
          boxShadow: '0 4px 20px rgba(45,211,111,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', transition: 'transform 0.18s ease',
          transform: isOpen ? 'rotate(0deg) scale(0.92)' : 'scale(1)',
          userSelect: 'none',
        }}
      >
        <IonIcon
          icon={isOpen ? chevronDownOutline : chatbubblesOutline}
          style={{ color: '#fff', fontSize: 26, transition: 'all 0.18s' }}
        />
        {!isOpen && unread > 0 && (
          <div style={{
            position: 'absolute', top: -3, right: -3,
            background: 'var(--ion-color-danger)', color: '#fff',
            borderRadius: '50%', minWidth: 20, height: 20, padding: '0 4px',
            fontSize: 11, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid #fff',
          }}>
            {unread > 9 ? '9+' : unread}
          </div>
        )}
      </div>

      {/* popup */}
      {isOpen && (
        <div style={{
          position: 'fixed', bottom: popBottom, right: popRight,
          width: popW, height: 520,
          zIndex: 99991,
          borderRadius: 16, overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 8px 40px rgba(0,0,0,0.25)',
          border: '1px solid var(--ion-border-color)',
          background: 'var(--ion-card-background)',
        }}>

          {/* ── header ── */}
          <div style={{
            background: 'linear-gradient(135deg,#2dd36f,#10b14a)',
            padding: '14px 16px 12px',
            flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <BotAvatar size={36} />
                <div>
                  <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.95rem', lineHeight: 1.2 }}>MintSlip Support</div>
                  <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.72rem' }}>
                    {chatClosed
                      ? 'Conversation closed'
                      : adminOnline
                        ? 'Typically replies in minutes'
                        : 'Currently offline'}
                  </div>
                </div>
              </div>
              <button onClick={closeChat} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                <IonIcon icon={closeOutline} style={{ color: 'rgba(255,255,255,0.85)', fontSize: 22 }} />
              </button>
            </div>
          </div>

          {/* ── body ── */}
          {loading ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IonSpinner name="crescent" color="primary" />
            </div>
          ) : view === 'form' ? (
            /* ── FORM VIEW ── */
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 0' }}>
              {/* greeting */}
              <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
                <BotAvatar size={30} />
                <div style={{
                  background: 'var(--ion-background-color)', borderRadius: '4px 16px 16px 16px',
                  padding: '10px 14px', fontSize: '0.85rem', lineHeight: 1.5,
                  color: 'var(--ion-text-color)', maxWidth: '85%',
                }}>
                  Hi there 👋 How can we help you today? Fill in your details and we'll get back to you as soon as possible.
                </div>
              </div>

              {/* reason chips */}
              <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--ion-color-medium)', marginBottom: 8, marginTop: 0 }}>
                REASON FOR CONTACT
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                {REASONS.map(r => (
                  <button key={r.id} onClick={() => setReason(r.id)} style={{
                    padding: '5px 12px', borderRadius: 20, cursor: 'pointer',
                    border: reason === r.id ? '2px solid #2dd36f' : '2px solid var(--ion-border-color)',
                    background: reason === r.id ? 'rgba(45,211,111,0.12)' : 'transparent',
                    color: reason === r.id ? '#2dd36f' : 'var(--ion-text-color)',
                    fontSize: '0.78rem', fontWeight: 600, transition: 'all 0.15s',
                  }}>
                    {r.label}
                  </button>
                ))}
              </div>

              {/* name + email */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                <input
                  value={name} onChange={e => setName(e.target.value)}
                  placeholder="Your name *"
                  style={inputStyle}
                />
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="Email address *"
                  style={inputStyle}
                />
              </div>

              {/* first message */}
              <textarea
                value={firstMsg} onChange={e => setFirstMsg(e.target.value)}
                onKeyDown={onFormKey}
                placeholder="How can we help you? *"
                rows={3}
                style={{ ...inputStyle, width: '100%', resize: 'none', lineHeight: 1.5, fontFamily: 'inherit' }}
              />
            </div>
          ) : (
            /* ── CHAT VIEW ── */
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
              {chatClosed && (
                <div style={{
                  margin: '8px 16px', padding: '8px 12px', borderRadius: 8,
                  background: 'rgba(var(--ion-color-success-rgb),0.08)',
                  border: '1px solid var(--ion-color-success)',
                  fontSize: '0.78rem', color: 'var(--ion-color-success)',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <IonIcon icon={checkmarkCircleOutline} style={{ fontSize: 16 }} />
                  This conversation has been closed. Start a new one if you need further help.
                </div>
              )}

              {!chatClosed && !adminOnline && (
                <div style={{
                  margin: '8px 16px', padding: '8px 12px', borderRadius: 8,
                  background: 'rgba(237,108,2,0.10)',
                  border: '1px solid rgba(237,108,2,0.4)',
                  fontSize: '0.78rem', color: '#b45309',
                  display: 'flex', alignItems: 'flex-start', gap: 8, lineHeight: 1.45,
                }}>
                  <IonIcon icon={timeOutline} style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }} />
                  <span>Our team is offline right now. We've saved your message and will reply as soon as we're back — please check back here later.</span>
                </div>
              )}

              {messages.map((msg, i) => {
                const prev = messages[i - 1];
                const grouped = i > 0 && prev.fromAdmin === msg.fromAdmin &&
                  new Date(msg.timestamp) - new Date(prev.timestamp) < 120000;
                return (
                  <div key={msg.id || i} style={{
                    display: 'flex', alignItems: 'flex-end', gap: 8,
                    padding: grouped ? '1px 16px' : '6px 16px 1px',
                    flexDirection: msg.fromAdmin ? 'row' : 'row-reverse',
                  }}>
                    {/* avatar */}
                    <div style={{ width: 28, flexShrink: 0, visibility: grouped ? 'hidden' : 'visible' }}>
                      {msg.fromAdmin ? <BotAvatar size={28} /> : <UserAvatar name={msg.senderName} size={28} />}
                    </div>
                    {/* bubble */}
                    <div style={{
                      maxWidth: '72%',
                      background: msg.fromAdmin ? 'var(--ion-background-color)' : '#2dd36f',
                      color: msg.fromAdmin ? 'var(--ion-text-color)' : '#fff',
                      borderRadius: msg.fromAdmin
                        ? (grouped ? '4px 16px 16px 4px' : '4px 16px 16px 16px')
                        : (grouped ? '16px 4px 4px 16px' : '16px 16px 4px 16px'),
                      padding: '8px 12px',
                      fontSize: '0.85rem', lineHeight: 1.5,
                      whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                    }}>
                      {!grouped && (
                        <div style={{ fontSize: '0.65rem', opacity: 0.65, marginBottom: 2 }}>
                          {msg.fromAdmin ? msg.senderName : 'You'} · {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      )}
                      {msg.text}
                    </div>
                  </div>
                );
              })}
              {/* admin typing indicator */}
              {adminTyping && (
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, padding: '6px 16px 2px' }}>
                  <BotAvatar size={28} />
                  <div style={{
                    background: 'var(--ion-background-color)',
                    borderRadius: '4px 16px 16px 16px',
                    padding: '10px 14px',
                    display: 'flex', alignItems: 'center', gap: 4,
                  }}>
                    {[0,1,2].map(i => (
                      <div key={i} style={{
                        width: 6, height: 6, borderRadius: '50%',
                        background: 'var(--ion-color-medium)',
                        animation: 'scw-bounce 0.6s infinite',
                        animationDelay: `${i * 0.2}s`,
                      }} />
                    ))}
                  </div>
                </div>
              )}
              <div ref={msgEndRef} />
            </div>
          )}

          {/* ── footer ── */}
          {view === 'form' ? (
            <div style={{ padding: '12px 16px 16px', flexShrink: 0 }}>
              <IonButton
                expand="block"
                disabled={starting || !name.trim() || !email.trim() || !firstMsg.trim() || !reason}
                onClick={handleStart}
                style={{ '--background': '#2dd36f', '--background-activated': '#28ba62', '--border-radius': '10px', fontWeight: 700 }}
              >
                {starting ? <IonSpinner name="crescent" style={{ width: 18, height: 18 }} /> : <>
                  <IonIcon slot="start" icon={sendOutline} />
                  Send Message
                </>}
              </IonButton>
              <p style={{ textAlign: 'center', fontSize: '0.68rem', color: 'var(--ion-color-medium)', margin: '8px 0 0' }}>
                We store your info to respond to you. See our <a href="/privacy" style={{ color: 'var(--ion-color-primary)' }}>Privacy Policy</a>.
              </p>
            </div>
          ) : (
            <div style={{
              borderTop: '1px solid var(--ion-border-color)',
              flexShrink: 0, padding: '6px 8px 8px',
            }}>
              {chatClosed ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '4px 0' }}>
                  <IonButton fill="outline" size="small" color="primary" onClick={handleReset} style={{ '--border-radius': '8px' }}>
                    <IonIcon slot="start" icon={reloadOutline} style={{ fontSize: 14 }} />
                    Start New Conversation
                  </IonButton>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input
                    ref={chatInputRef}
                    type="text"
                    value={chatInput}
                    onChange={handleChatInputChange}
                    onKeyDown={onChatKey}
                    placeholder="Type a message…"
                    style={{
                      flex: 1, background: 'var(--ion-background-color)',
                      border: '1px solid var(--ion-border-color)',
                      borderRadius: 20, padding: '8px 14px',
                      fontSize: '0.875rem', color: 'var(--ion-text-color)',
                      outline: 'none', caretColor: '#2dd36f',
                    }}
                  />
                  <IonButton
                    fill="clear" size="small"
                    disabled={sending || !chatInput.trim()}
                    onClick={handleSend}
                    style={{ '--color': '#2dd36f', '--border-radius': '50%' }}
                  >
                    {sending
                      ? <IonSpinner name="crescent" style={{ width: 18, height: 18 }} />
                      : <IonIcon slot="icon-only" icon={sendOutline} style={{ fontSize: 20 }} />}
                  </IonButton>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );

  return createPortal(widget, document.body);
}

// shared input style
const inputStyle = {
  flex: 1,
  padding: '8px 12px',
  borderRadius: 10,
  border: '1px solid var(--ion-border-color)',
  background: 'var(--ion-background-color)',
  color: 'var(--ion-text-color)',
  fontSize: '0.85rem',
  outline: 'none',
  caretColor: '#2dd36f',
  width: '100%',
  boxSizing: 'border-box',
};

import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { IonButton, IonIcon, IonSpinner } from '@ionic/react';
import { expandOutline, removeOutline, closeOutline, sendOutline } from 'ionicons/icons';
import { useMinimizedChats } from '@/contexts/MinimizedChatsContext';

// ── constants ──────────────────────────────────────────────────────────────────
const AVATAR_SIZE = 56;
const STACK_THRESHOLD = 48;
const DRAG_THRESHOLD = 4;
const LS_POS = 'mini-chat-positions';
const POPUP_W = 320;
const POPUP_H = 420;

// ── helpers ────────────────────────────────────────────────────────────────────
function getInitials(name = '') {
  return name.split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || '?';
}

function formatTime(ts) {
  if (!ts) return '';
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function isGrouped(msgs, idx) {
  if (idx === 0) return false;
  const cur = msgs[idx], prev = msgs[idx - 1];
  if (cur.senderId !== prev.senderId) return false;
  return new Date(cur.timestamp) - new Date(prev.timestamp) < 2 * 60000;
}

function getOtherParty(convo, currentUser) {
  if (!convo) return { name: '?', avatar: null };
  const uid = currentUser?.id || currentUser?._id;
  if (uid && convo.carrier_id === uid) {
    return { name: convo.broker_name || 'Broker', avatar: convo.broker_avatar || null };
  }
  if (uid && convo.broker_id === uid) {
    return { name: convo.carrier_name || 'Carrier', avatar: convo.carrier_avatar || null };
  }
  return {
    name: convo.name || convo.other_name || convo.recipientName || '?',
    avatar: convo.avatar || convo.other_avatar || null,
  };
}

function SmallAvatar({ name, src, size }) {
  const [err, setErr] = useState(false);
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
      {src && !err
        ? <img src={src} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setErr(true)} />
        : (
          <div style={{
            width: '100%', height: '100%', borderRadius: '50%',
            background: 'var(--ion-color-primary)', color: '#fff',
            fontSize: size > 36 ? 13 : 11, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {getInitials(name)}
          </div>
        )}
    </div>
  );
}

// ── single bubble + popup ──────────────────────────────────────────────────────
function MiniChatBubble({ mc, idx, allMcs, positions, setPositions, currentUser, navigate }) {
  const { openMiniId, openMini, restore, close, miniInputs, setMiniInput, miniSending, sendMini } = useMinimizedChats();
  const isOpen = openMiniId === mc.id;
  const otherParty = getOtherParty(mc.convo, currentUser);

  // ── position ─────────────────────────────────────────────────────────────────
  const defaultPos = useCallback(() => ({
    x: window.innerWidth - AVATAR_SIZE - 24,
    y: window.innerHeight - AVATAR_SIZE - 32 - idx * (AVATAR_SIZE + 8),
  }), [idx]);

  const pos = positions[mc.id] || defaultPos();

  // stack offset: count earlier bubbles within threshold distance
  const stackRank = allMcs.slice(0, idx).filter((earlier, ei) => {
    const ep = positions[earlier.id] || {
      x: window.innerWidth - AVATAR_SIZE - 24,
      y: window.innerHeight - AVATAR_SIZE - 32 - ei * (AVATAR_SIZE + 8),
    };
    const dx = ep.x - pos.x, dy = ep.y - pos.y;
    return Math.sqrt(dx * dx + dy * dy) < STACK_THRESHOLD;
  }).length;

  const offsetX = stackRank * 5;
  const offsetY = stackRank * -5;
  const finalX = pos.x + offsetX;
  const finalY = pos.y + offsetY;

  // popup position (clamped to viewport)
  const vw = window.innerWidth, vh = window.innerHeight;
  const popupLeft = Math.max(8, Math.min(vw - POPUP_W - 8, finalX - POPUP_W + AVATAR_SIZE));
  const popupTop  = Math.max(8, Math.min(vh - POPUP_H - 8, finalY - POPUP_H - 12));

  // ── drag ──────────────────────────────────────────────────────────────────────
  const handlePointerDown = (e) => {
    e.preventDefault();
    const startCX = e.clientX, startCY = e.clientY;
    const startPX = pos.x, startPY = pos.y;
    let dragging = false;

    const onMove = (me) => {
      const dx = me.clientX - startCX, dy = me.clientY - startCY;
      if (!dragging && Math.sqrt(dx * dx + dy * dy) > DRAG_THRESHOLD) dragging = true;
      if (!dragging) return;
      const vwNow = window.innerWidth, vhNow = window.innerHeight;
      const nx = Math.max(0, Math.min(vwNow - AVATAR_SIZE, startPX + dx));
      const ny = Math.max(0, Math.min(vhNow - AVATAR_SIZE, startPY + dy));
      setPositions(prev => ({ ...prev, [mc.id]: { x: nx, y: ny } }));
    };

    const onUp = () => {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
      if (!dragging) {
        openMini(mc.id);
      } else {
        setPositions(prev => {
          const next = { ...prev };
          try { localStorage.setItem(LS_POS, JSON.stringify(next)); } catch {}
          return next;
        });
      }
    };

    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
  };

  // ── auto-scroll messages ──────────────────────────────────────────────────────
  const msgListRef = useRef(null);
  useEffect(() => {
    if (isOpen && msgListRef.current) {
      msgListRef.current.scrollTop = msgListRef.current.scrollHeight;
    }
  }, [isOpen, mc.messages.length]);

  // ── restore to full message center ────────────────────────────────────────────
  const handleRestore = () => {
    restore(mc.id, (found) => {
      window.dispatchEvent(new CustomEvent('your-app-restore-mini', { detail: found }));
      navigate(`/admin/support?conversation=${mc.id}`);
    });
  };

  const inputValue = miniInputs[mc.id] || '';
  const isSending = !!miniSending[mc.id];

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (inputValue.trim() && !isSending) sendMini(mc);
    }
  };

  return (
    <>
      {/* ── avatar bubble ── */}
      <div
        onPointerDown={handlePointerDown}
        style={{
          position: 'fixed',
          left: finalX,
          top: finalY,
          width: AVATAR_SIZE,
          height: AVATAR_SIZE,
          zIndex: 99998 + idx,
          cursor: 'grab',
          userSelect: 'none',
          touchAction: 'none',
        }}
      >
        {/* avatar circle */}
        <div style={{
          width: '100%', height: '100%',
          borderRadius: '50%', overflow: 'hidden',
          border: '2px solid #fff',
          boxShadow: '0 4px 24px rgba(0,0,0,0.35)',
        }}>
          {otherParty.avatar
            ? <img src={otherParty.avatar} alt={otherParty.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : (
              <div style={{
                width: '100%', height: '100%',
                background: 'var(--ion-color-primary)', color: '#fff',
                fontSize: 13, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {getInitials(otherParty.name)}
              </div>
            )}
        </div>

        {/* unread badge */}
        {mc.unreadCount > 0 && (
          <div style={{
            position: 'absolute', top: -2, right: -2,
            background: 'var(--ion-color-danger)', color: '#fff',
            borderRadius: '50%', minWidth: 18, height: 18,
            fontSize: 11, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid #fff', padding: '0 3px',
            pointerEvents: 'none',
          }}>
            {mc.unreadCount > 9 ? '9+' : mc.unreadCount}
          </div>
        )}
      </div>

      {/* ── popup panel ── */}
      {isOpen && (
        <div style={{
          position: 'fixed',
          left: popupLeft,
          top: popupTop,
          width: POPUP_W,
          height: POPUP_H,
          zIndex: 99999 + idx,
          borderRadius: 12,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
          border: '1px solid var(--ion-border-color)',
          background: 'var(--ion-card-background)',
        }}>

          {/* header */}
          <div style={{
            height: 48, flexShrink: 0,
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '0 8px 0 12px',
            background: 'var(--ion-background-color)',
            borderBottom: '1px solid var(--ion-border-color)',
          }}>
            <SmallAvatar name={otherParty.name} src={otherParty.avatar} size={28} />

            <div style={{ flex: 1, minWidth: 0, overflow: 'hidden', display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <span style={{
                fontWeight: 700, fontSize: '0.85rem',
                color: 'var(--ion-text-color)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {otherParty.name}
              </span>
              {(mc.convo.isLoad || mc.convo.loadNumber) && (
                <span style={{ fontWeight: 400, fontSize: '0.72rem', color: 'var(--ion-color-medium)', whiteSpace: 'nowrap' }}>
                  Load #{mc.convo.loadNumber || mc.convo.load_id}
                </span>
              )}
            </div>

            {/* collapse popup */}
            <IonButton fill="clear" color="medium" size="small"
              style={{ '--border-radius': '50%' }}
              onClick={() => openMini(mc.id)}
            >
              <IonIcon slot="icon-only" icon={removeOutline} style={{ fontSize: 16 }} />
            </IonButton>

            {/* expand to full message center */}
            <IonButton fill="clear" color="medium" size="small"
              style={{ '--border-radius': '50%' }}
              onClick={handleRestore}
            >
              <IonIcon slot="icon-only" icon={expandOutline} style={{ fontSize: 16 }} />
            </IonButton>

            {/* close / remove bubble */}
            <IonButton fill="clear" color="medium" size="small"
              style={{ '--border-radius': '50%' }}
              onClick={() => close(mc.id)}
            >
              <IonIcon slot="icon-only" icon={closeOutline} style={{ fontSize: 16 }} />
            </IonButton>
          </div>

          {/* messages */}
          <div ref={msgListRef} style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
            {mc.messages.length === 0 ? (
              <div style={{
                height: '100%', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                color: 'var(--ion-color-medium)', fontSize: '0.82rem',
              }}>
                No messages yet
              </div>
            ) : (
              mc.messages.map((msg, mi) => {
                const grouped = isGrouped(mc.messages, mi);
                const isMe = msg.senderId === (currentUser?.id || currentUser?._id);
                return (
                  <div key={msg.id || mi} style={{
                    display: 'flex', alignItems: 'flex-start', gap: 8,
                    padding: grouped ? '2px 12px' : '8px 12px 2px',
                    background: isMe ? 'rgba(var(--ion-color-primary-rgb),0.04)' : 'transparent',
                  }}>
                    {/* left column: avatar or hover-timestamp */}
                    <div style={{ width: 28, flexShrink: 0, display: 'flex', justifyContent: 'center', paddingTop: grouped ? 2 : 0 }}>
                      {grouped ? (
                        <span style={{ fontSize: '0.55rem', color: 'var(--ion-color-medium)', whiteSpace: 'nowrap' }}>
                          {formatTime(msg.timestamp)}
                        </span>
                      ) : (
                        <SmallAvatar name={msg.senderName} src={msg.senderAvatar} size={28} />
                      )}
                    </div>

                    {/* content column */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {!grouped && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                          <span style={{
                            fontWeight: 700, fontSize: '0.78rem',
                            color: isMe ? 'var(--ion-color-primary)' : 'var(--ion-text-color)',
                          }}>
                            {msg.senderName}
                          </span>
                          <span style={{ fontSize: '0.62rem', color: 'var(--ion-color-medium)' }}>
                            {formatTime(msg.timestamp)}
                          </span>
                        </div>
                      )}
                      <p style={{
                        margin: 0,
                        fontSize: '0.82rem', lineHeight: 1.45,
                        whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                        color: 'var(--ion-text-color)',
                      }}>
                        {msg.text}
                      </p>
                      {msg.images?.length > 0 && (
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
                          {msg.images.map((url, ii) => (
                            <a key={ii} href={url} target="_blank" rel="noopener noreferrer">
                              <img src={url} alt="" style={{
                                maxWidth: 120, maxHeight: 100,
                                borderRadius: 6, objectFit: 'cover', cursor: 'pointer',
                                border: '1px solid var(--ion-border-color)',
                              }} />
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* input bar */}
          <div style={{
            borderTop: '1px solid var(--ion-border-color)',
            display: 'flex', alignItems: 'center',
            padding: '6px 8px', gap: 6, flexShrink: 0,
          }}>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setMiniInput(mc.id, e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message…"
              style={{
                flex: 1, background: 'transparent',
                border: 'none', outline: 'none',
                color: 'var(--ion-text-color)',
                fontSize: '0.85rem',
                caretColor: 'var(--ion-color-success)',
              }}
            />
            <IonButton
              fill="clear" color="success" size="small"
              style={{ '--border-radius': '50%' }}
              disabled={isSending || !inputValue.trim()}
              onClick={() => { if (!isSending && inputValue.trim()) sendMini(mc); }}
            >
              {isSending
                ? <IonSpinner name="crescent" style={{ width: 14, height: 14 }} />
                : <IonIcon slot="icon-only" icon={sendOutline} style={{ fontSize: 16 }} />}
            </IonButton>
          </div>
        </div>
      )}
    </>
  );
}

// ── main FAB ───────────────────────────────────────────────────────────────────
export default function MinimizedChatsFAB({ currentUser }) {
  const { minimizedConvos } = useMinimizedChats();
  const navigate = useNavigate();

  const [positions, setPositions] = useState(() => {
    try { return JSON.parse(localStorage.getItem(LS_POS) || '{}'); }
    catch { return {}; }
  });

  if (!minimizedConvos.length) return null;

  return createPortal(
    <>
      {minimizedConvos.map((mc, idx) => (
        <MiniChatBubble
          key={mc.id}
          mc={mc}
          idx={idx}
          allMcs={minimizedConvos}
          positions={positions}
          setPositions={setPositions}
          currentUser={currentUser}
          navigate={navigate}
        />
      ))}
    </>,
    document.body
  );
}

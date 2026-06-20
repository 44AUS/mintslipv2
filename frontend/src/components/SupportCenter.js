import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  IonList, IonItem, IonLabel, IonAvatar, IonButton, IonIcon,
  IonSegment, IonSegmentButton, IonReorderGroup, IonReorder,
  IonTextarea, IonModal, IonHeader, IonToolbar, IonTitle,
  IonContent, IonSearchbar, IonButtons, IonProgressBar,
} from '@ionic/react';
import {
  chatbubbleOutline, chatbubblesOutline, star, starOutline,
  sendOutline, imageOutline, copyOutline, trashOutline,
  closeOutline, banOutline, shieldOutline, folderOutline,
  linkOutline, removeOutline, chevronForwardOutline,
  menuOutline, closeCircleOutline, checkmarkDoneOutline,
  checkmarkOutline, addOutline,
} from 'ionicons/icons';

// ─── helpers ──────────────────────────────────────────────────────────────────

function getInitials(name = '') {
  return name.split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || '?';
}

function getPresenceColor(lastActive) {
  if (!lastActive) return null;
  const mins = (Date.now() - new Date(lastActive).getTime()) / 60000;
  if (mins < 5) return '#2dd36f';
  if (mins < 60) return '#ffce00';
  if (mins < 1440) return '#eb445a';
  return null;
}

function getPresenceLabel(lastActive) {
  if (!lastActive) return 'Offline';
  const mins = (Date.now() - new Date(lastActive).getTime()) / 60000;
  if (mins < 1) return 'Online now';
  if (mins < 60) return `Active ${Math.floor(mins)}m ago`;
  const hrs = mins / 60;
  if (hrs < 24) return `Active ${Math.floor(hrs)}h ago`;
  return 'Offline';
}

function formatTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatListTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  const now = new Date();
  const diffDays = Math.floor((now - d) / 86400000);
  if (diffDays === 0) return formatTime(ts);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: 'short' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function isGrouped(msgs, idx) {
  if (idx === 0) return false;
  const cur = msgs[idx], prev = msgs[idx - 1];
  if (cur.senderId !== prev.senderId) return false;
  return new Date(cur.timestamp) - new Date(prev.timestamp) < 2 * 60000;
}

// ─── sub-components ───────────────────────────────────────────────────────────

function Avatar({ name, src, size = 42 }) {
  const [err, setErr] = useState(false);
  return (
    <IonAvatar style={{ width: size, height: size, minWidth: size, minHeight: size, flexShrink: 0 }}>
      {src && !err
        ? <img src={src} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setErr(true)} />
        : (
          <div style={{
            width: '100%', height: '100%', borderRadius: '50%',
            background: 'var(--ion-color-primary)', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: size > 36 ? 13 : 11, fontWeight: 700,
          }}>
            {getInitials(name)}
          </div>
        )}
    </IonAvatar>
  );
}

function AvatarWithPresence({ name, src, size = 42, lastActive, bg = 'var(--ion-card-background)' }) {
  const color = getPresenceColor(lastActive);
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <Avatar name={name} src={src} size={size} />
      {color && (
        <div style={{
          position: 'absolute', bottom: 1, right: 1,
          width: 10, height: 10, borderRadius: '50%',
          background: color, border: `2px solid ${bg}`, zIndex: 1,
        }} />
      )}
    </div>
  );
}

function TypingIndicator() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '8px 12px', borderRadius: '16px 16px 16px 4px', background: 'rgba(0,0,0,0.07)', width: 'fit-content' }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          width: 7, height: 7, borderRadius: '50%',
          background: 'var(--ion-color-medium)',
          animation: 'sc-bounce 0.6s infinite',
          animationDelay: `${i * 0.2}s`,
        }} />
      ))}
    </div>
  );
}

// ─── section header ───────────────────────────────────────────────────────────

function SectionHeader({ title, borderTop }) {
  return (
    <div style={{
      padding: '5px 16px',
      background: 'var(--ion-background-color)',
      borderBottom: '1px solid var(--ion-border-color)',
      ...(borderTop ? { borderTop: '1px solid var(--ion-border-color)' } : {}),
    }}>
      <span style={{ fontSize: '0.68rem', color: 'var(--ion-color-medium)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {title}
      </span>
    </div>
  );
}

// ─── main component ────────────────────────────────────────────────────────────

export default function SupportCenter({
  conversations = [],
  activeConversationId = null,
  messages = [],
  currentUser = {},
  isTyping = false,
  isSending = false,
  contacts = [],
  onSelectConversation,
  onSendMessage,
  onPinConversation,
  onDeleteConversation,
  onBlockUser,
  onNewConversation,
  onReorderConversations,
}) {
  const [activeTab, setActiveTab] = useState('open');
  const [showList, setShowList] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [inputText, setInputText] = useState('');
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [showNewModal, setShowNewModal] = useState(false);
  const [modalSearch, setModalSearch] = useState('');
  const [hoveredConvId, setHoveredConvId] = useState(null);
  const [hoveredMsgId, setHoveredMsgId] = useState(null);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  // responsive
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // when selecting on mobile, switch to chat view
  const handleSelectConversation = useCallback((id) => {
    onSelectConversation?.(id);
    if (isMobile) setShowList(false);
  }, [isMobile, onSelectConversation]);

  // derived
  const activeConv = conversations.find(c => c.id === activeConversationId) || null;

  const openConvs = conversations.filter(c => !c.archived);
  const closedConvs = conversations.filter(c => c.archived);

  const pinnedConvs = openConvs.filter(c => c.pinned);
  const loadConvs = openConvs.filter(c => !c.pinned && c.type === 'load');
  const directConvs = openConvs.filter(c => !c.pinned && c.type !== 'load');

  // send
  const handleSend = useCallback(() => {
    const text = inputText.trim();
    if (!text && imageFiles.length === 0) return;
    onSendMessage?.(text, imageFiles);
    setInputText('');
    setImageFiles([]);
    setImagePreviews([]);
  }, [inputText, imageFiles, onSendMessage]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const handleImageAdd = (e) => {
    const files = Array.from(e.target.files || []);
    setImageFiles(prev => [...prev, ...files]);
    files.forEach(f => {
      const url = URL.createObjectURL(f);
      setImagePreviews(prev => [...prev, url]);
    });
    e.target.value = '';
  };

  const handleImageRemove = (idx) => {
    setImageFiles(prev => prev.filter((_, i) => i !== idx));
    setImagePreviews(prev => {
      URL.revokeObjectURL(prev[idx]);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const filteredContacts = contacts.filter(c =>
    !modalSearch || c.name?.toLowerCase().includes(modalSearch.toLowerCase())
  );

  // ── conversation row ─────────────────────────────────────────────────────────

  const ConvRow = ({ conv }) => {
    const isActive = conv.id === activeConversationId;
    const hovered = hoveredConvId === conv.id;
    return (
      <IonItem
        button
        detail={false}
        onClick={() => handleSelectConversation(conv.id)}
        onMouseEnter={() => setHoveredConvId(conv.id)}
        onMouseLeave={() => setHoveredConvId(null)}
        style={{
          '--min-height': '60px',
          '--padding-start': '16px',
          '--padding-end': '4px',
          '--background': isActive ? 'rgba(var(--ion-color-primary-rgb),0.08)' : 'transparent',
          '--background-hover': 'rgba(var(--ion-color-primary-rgb),0.05)',
        }}
      >
        {/* avatar slot */}
        <div slot="start" style={{ position: 'relative', marginRight: 12 }}>
          <AvatarWithPresence name={conv.name} src={conv.avatar} size={42} lastActive={conv.lastActive} />
        </div>

        {/* label */}
        <IonLabel style={{ overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {conv.unread > 0 && (
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--ion-color-primary)', flexShrink: 0 }} />
            )}
            <span style={{
              fontSize: '0.95rem',
              fontWeight: conv.unread > 0 ? 700 : 500,
              color: isActive ? 'var(--ion-color-primary)' : 'var(--ion-text-color)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {conv.name}
            </span>
            <span style={{ fontSize: '0.68rem', color: 'var(--ion-color-medium)', marginLeft: 'auto', flexShrink: 0 }}>
              {formatListTime(conv.lastMessageTime)}
            </span>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--ion-color-medium)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>
            {conv.isLoad ? `Load #${conv.loadNumber}` : conv.lastMessage || ''}
          </div>
        </IonLabel>

        {/* end: star + reorder */}
        <div slot="end" style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
          <IonButton
            fill="clear"
            size="small"
            color={conv.pinned ? 'warning' : 'medium'}
            style={{ opacity: hovered || conv.pinned ? 1 : 0, transition: 'opacity 0.15s', '--padding-start': '4px', '--padding-end': '4px' }}
            onClick={(e) => { e.stopPropagation(); onPinConversation?.(conv.id, !conv.pinned); }}
          >
            <IonIcon slot="icon-only" icon={conv.pinned ? star : starOutline} style={{ fontSize: 16 }} />
          </IonButton>
          <IonReorder style={{ fontSize: 20, color: 'var(--ion-color-medium)' }} />
        </div>
      </IonItem>
    );
  };

  // ── message row ──────────────────────────────────────────────────────────────

  const MessageRow = ({ msg, idx }) => {
    const grouped = isGrouped(messages, idx);
    const isOwn = msg.senderId === (currentUser.id || currentUser._id);
    const hovered = hoveredMsgId === msg.id;

    return (
      <IonItem
        lines="none"
        onMouseEnter={() => setHoveredMsgId(msg.id)}
        onMouseLeave={() => setHoveredMsgId(null)}
        style={{
          '--padding-start': '16px',
          '--padding-end': '16px',
          '--min-height': '0',
          '--background': isOwn ? 'rgba(var(--ion-color-primary-rgb),0.04)' : 'transparent',
          marginTop: grouped ? 0 : 4,
        }}
      >
        {/* left slot: 36px — avatar or timestamp */}
        <div slot="start" style={{ width: 36, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: grouped ? 4 : 6 }}>
          {grouped ? (
            <span style={{
              fontSize: '0.6rem', color: 'var(--ion-color-medium)',
              opacity: hovered ? 1 : 0, transition: 'opacity 0.15s',
              whiteSpace: 'nowrap',
            }}>
              {formatTime(msg.timestamp)}
            </span>
          ) : (
            <Avatar name={msg.senderName} src={msg.senderAvatar} size={36} />
          )}
        </div>

        {/* message body */}
        <IonLabel style={{ overflow: 'visible', whiteSpace: 'normal' }}>
          {!grouped && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
              <span style={{
                fontWeight: 700, fontSize: '0.875rem',
                color: isOwn ? 'var(--ion-color-primary)' : 'var(--ion-text-color)',
              }}>
                {msg.senderName}
              </span>
              <span style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)' }}>
                {formatTime(msg.timestamp)}
              </span>
              {isOwn && (
                <IonIcon
                  icon={msg.read ? checkmarkDoneOutline : checkmarkOutline}
                  style={{ fontSize: 11, color: msg.read ? 'var(--ion-color-primary)' : 'var(--ion-color-medium)' }}
                />
              )}
            </div>
          )}
          <p style={{ fontSize: '0.875rem', lineHeight: 1.5, whiteSpace: 'pre-wrap', margin: 0, color: 'var(--ion-text-color)' }}>
            {msg.text}
          </p>
          {msg.images?.length > 0 && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
              {msg.images.map((url, i) => (
                <img key={i} src={url} alt="" style={{ width: 120, height: 90, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--ion-border-color)' }} />
              ))}
            </div>
          )}
        </IonLabel>

        {/* copy button on hover */}
        <IonButton
          slot="end"
          fill="clear"
          size="small"
          color="medium"
          style={{ opacity: hovered ? 1 : 0, transition: 'opacity 0.15s', '--border-radius': '50%', alignSelf: 'flex-start', marginTop: 4 }}
          onClick={() => navigator.clipboard?.writeText(msg.text)}
        >
          <IonIcon slot="icon-only" icon={copyOutline} style={{ fontSize: 16 }} />
        </IonButton>
      </IonItem>
    );
  };

  // ── render ───────────────────────────────────────────────────────────────────

  const showLeftPanel = !isMobile || showList;
  const showRightPanel = !isMobile || !showList;

  return (
    <>
      {/* keyframe animations */}
      <style>{`
        @keyframes sc-bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        .msg-input textarea { caret-color: var(--ion-color-success) !important; }
        .sc-conv-row:hover .sc-star-btn { opacity: 1 !important; }
      `}</style>

      <div style={{
        height: '100%', display: 'flex', overflow: 'hidden',
        background: 'var(--ion-card-background)',
      }}>

        {/* ── LEFT PANEL ── */}
        {showLeftPanel && (
          <div style={{
            width: isMobile ? '100%' : 300, flexShrink: 0,
            borderRight: '1px solid var(--ion-border-color)',
            display: 'flex', flexDirection: 'column', height: '100%',
          }}>

            {/* header + segment */}
            <div style={{
              height: 60, display: 'flex', alignItems: 'center',
              padding: '0 10px', gap: 8,
              borderBottom: '1px solid var(--ion-border-color)',
              flexShrink: 0,
            }}>
              <IonSegment
                mode="ios"
                value={activeTab}
                onIonChange={(e) => setActiveTab(e.detail.value)}
                style={{ '--background': 'rgba(0,0,0,0.08)', minHeight: 36, flex: 1 }}
              >
                <IonSegmentButton
                  value="open"
                  style={{
                    '--indicator-color': 'var(--ion-card-background)',
                    '--color': 'var(--ion-color-medium)',
                    '--color-checked': 'var(--ion-text-color)',
                    '--border-radius': '8px',
                    '--indicator-box-shadow': '0 1px 4px rgba(0,0,0,0.15)',
                    minHeight: 30,
                  }}
                >
                  <IonLabel style={{ fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <IonIcon icon={chatbubbleOutline} style={{ fontSize: 14 }} />
                    Open
                  </IonLabel>
                </IonSegmentButton>
                <IonSegmentButton
                  value="closed"
                  style={{
                    '--indicator-color': 'var(--ion-card-background)',
                    '--color': 'var(--ion-color-medium)',
                    '--color-checked': 'var(--ion-text-color)',
                    '--border-radius': '8px',
                    '--indicator-box-shadow': '0 1px 4px rgba(0,0,0,0.15)',
                    minHeight: 30,
                  }}
                >
                  <IonLabel style={{ fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <IonIcon icon={chatbubblesOutline} style={{ fontSize: 14 }} />
                    Closed
                  </IonLabel>
                </IonSegmentButton>
              </IonSegment>

              <IonButton
                fill="clear"
                size="small"
                color="medium"
                onClick={() => setShowNewModal(true)}
                style={{ '--border-radius': '50%', flexShrink: 0 }}
              >
                <IonIcon slot="icon-only" icon={addOutline} style={{ fontSize: 20 }} />
              </IonButton>
            </div>

            {/* conversation list */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {activeTab === 'open' ? (
                <>
                  {/* Pinned */}
                  {pinnedConvs.length > 0 && (
                    <>
                      <SectionHeader title="Pinned" />
                      <IonList lines="full" style={{ padding: 0 }}>
                        <IonReorderGroup
                          disabled={false}
                          onIonItemReorder={(e) => { e.detail.complete(); onReorderConversations?.(e); }}
                        >
                          {pinnedConvs.map(c => <ConvRow key={c.id} conv={c} />)}
                        </IonReorderGroup>
                      </IonList>
                    </>
                  )}

                  {/* Load Conversations */}
                  {loadConvs.length > 0 && (
                    <>
                      <SectionHeader title="Load Conversations" borderTop={pinnedConvs.length > 0} />
                      <IonList lines="full" style={{ padding: 0 }}>
                        <IonReorderGroup
                          disabled={false}
                          onIonItemReorder={(e) => { e.detail.complete(); onReorderConversations?.(e); }}
                        >
                          {loadConvs.map(c => <ConvRow key={c.id} conv={c} />)}
                        </IonReorderGroup>
                      </IonList>
                    </>
                  )}

                  {/* Direct Messages */}
                  {directConvs.length > 0 && (
                    <>
                      <SectionHeader title="Direct Messages" borderTop={pinnedConvs.length > 0 || loadConvs.length > 0} />
                      <IonList lines="full" style={{ padding: 0 }}>
                        <IonReorderGroup
                          disabled={false}
                          onIonItemReorder={(e) => { e.detail.complete(); onReorderConversations?.(e); }}
                        >
                          {directConvs.map(c => <ConvRow key={c.id} conv={c} />)}
                        </IonReorderGroup>
                      </IonList>
                    </>
                  )}

                  {/* empty state */}
                  {openConvs.length === 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 16px', gap: 12 }}>
                      <IonIcon icon={chatbubbleOutline} style={{ fontSize: 36, color: 'var(--ion-color-medium)' }} />
                      <span style={{ fontSize: '0.875rem', color: 'var(--ion-color-medium)', textAlign: 'center' }}>No open conversations</span>
                      <IonButton fill="outline" size="small" onClick={() => setShowNewModal(true)}>
                        New Message
                      </IonButton>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {closedConvs.length > 0 ? (
                    <IonList lines="full" style={{ padding: 0 }}>
                      {closedConvs.map(c => <ConvRow key={c.id} conv={c} />)}
                    </IonList>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 16px', gap: 12 }}>
                      <IonIcon icon={chatbubblesOutline} style={{ fontSize: 36, color: 'var(--ion-color-medium)' }} />
                      <span style={{ fontSize: '0.875rem', color: 'var(--ion-color-medium)' }}>No archived conversations</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* ── RIGHT PANEL ── */}
        {showRightPanel && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', minWidth: 0 }}>

            {activeConv ? (
              <>
                {/* chat header */}
                <div style={{
                  height: 60, flexShrink: 0,
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '0 12px',
                  borderBottom: '1px solid var(--ion-border-color)',
                  background: 'var(--ion-background-color)',
                }}>
                  {/* back/hamburger */}
                  <IonButton
                    fill="clear" color="medium" size="small"
                    style={{ '--border-radius': '50%', flexShrink: 0 }}
                    onClick={() => isMobile ? setShowList(true) : undefined}
                  >
                    <IonIcon slot="icon-only" icon={menuOutline} style={{ fontSize: 20 }} />
                  </IonButton>

                  {/* avatar + info */}
                  <AvatarWithPresence
                    name={activeConv.name}
                    src={activeConv.avatar}
                    size={38}
                    lastActive={activeConv.lastActive}
                    bg="var(--ion-background-color)"
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--ion-text-color)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {activeConv.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--ion-color-medium)' }}>
                      {activeConv.isLoad ? `Load #${activeConv.loadNumber}` : getPresenceLabel(activeConv.lastActive)}
                    </div>
                  </div>

                  {/* action buttons */}
                  {activeConv.isLoad && (
                    <IonButton fill="clear" color="medium" size="small" style={{ '--border-radius': '50%' }}>
                      <IonIcon slot="icon-only" icon={linkOutline} style={{ fontSize: 18 }} />
                    </IonButton>
                  )}
                  <IonButton fill="clear" color="medium" size="small" style={{ '--border-radius': '50%' }}>
                    <IonIcon slot="icon-only" icon={folderOutline} style={{ fontSize: 18 }} />
                  </IonButton>
                  <IonButton
                    fill="clear" color={activeConv.isBlocked ? 'danger' : 'medium'} size="small"
                    style={{ '--border-radius': '50%' }}
                    onClick={() => onBlockUser?.(activeConv.id, !activeConv.isBlocked)}
                  >
                    <IonIcon slot="icon-only" icon={activeConv.isBlocked ? shieldOutline : banOutline} style={{ fontSize: 18 }} />
                  </IonButton>
                  <IonButton
                    fill="clear" color="danger" size="small"
                    style={{ '--border-radius': '50%' }}
                    onClick={() => onDeleteConversation?.(activeConv.id)}
                  >
                    <IonIcon slot="icon-only" icon={trashOutline} style={{ fontSize: 18 }} />
                  </IonButton>
                  <IonButton fill="clear" color="medium" size="small" style={{ '--border-radius': '50%' }}>
                    <IonIcon slot="icon-only" icon={removeOutline} style={{ fontSize: 18 }} />
                  </IonButton>
                  <IonButton fill="clear" color="medium" size="small" style={{ '--border-radius': '50%' }}>
                    <IonIcon slot="icon-only" icon={closeOutline} style={{ fontSize: 18 }} />
                  </IonButton>
                </div>

                {/* blocked banner */}
                {activeConv.isBlocked && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '6px 16px', margin: '8px 12px',
                    background: 'rgba(235,68,90,0.15)',
                    border: '1px solid var(--ion-color-danger)',
                    borderRadius: 8,
                  }}>
                    <IonIcon icon={banOutline} style={{ color: 'var(--ion-color-danger)', fontSize: 16, flexShrink: 0 }} />
                    <span style={{ fontSize: '0.75rem', color: 'var(--ion-color-danger)' }}>
                      This user is blocked. They cannot send or receive messages.
                    </span>
                  </div>
                )}

                {/* messages */}
                <div style={{ flex: 1, overflowY: 'auto' }}>
                  <IonList lines="none" style={{ padding: '8px 0' }}>
                    {messages.map((msg, idx) => (
                      <MessageRow key={msg.id} msg={msg} idx={idx} />
                    ))}
                    {isTyping && (
                      <IonItem lines="none" style={{ '--padding-start': '16px', '--min-height': '0', '--background': 'transparent' }}>
                        <div slot="start" style={{ width: 36, marginRight: 0 }} />
                        <IonLabel style={{ overflow: 'visible', padding: '4px 0' }}>
                          <TypingIndicator />
                        </IonLabel>
                      </IonItem>
                    )}
                    <div ref={messagesEndRef} />
                  </IonList>
                </div>

                {/* input area */}
                <div style={{ borderTop: isSending ? 'none' : '1px solid var(--ion-border-color)', flexShrink: 0 }}>
                  {isSending && <IonProgressBar type="indeterminate" color="success" style={{ height: 2 }} />}

                  {/* image previews */}
                  {imagePreviews.length > 0 && (
                    <div style={{ display: 'flex', gap: 8, padding: '8px 16px 0', flexWrap: 'wrap' }}>
                      {imagePreviews.map((url, i) => (
                        <div key={i} style={{ position: 'relative', width: 72, height: 72 }}>
                          <img src={url} alt="" style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--ion-border-color)' }} />
                          <IonButton
                            fill="clear" size="small" color="danger"
                            style={{ position: 'absolute', top: -6, right: -6, '--padding-start': '2px', '--padding-end': '2px', '--padding-top': '2px', '--padding-bottom': '2px' }}
                            onClick={() => handleImageRemove(i)}
                          >
                            <IonIcon slot="icon-only" icon={closeCircleOutline} style={{ fontSize: 18 }} />
                          </IonButton>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* textarea */}
                  <div className="msg-input" onKeyDown={handleKeyDown} style={{ padding: '4px 8px 0' }}>
                    <IonTextarea
                      ref={textareaRef}
                      autoGrow
                      rows={3}
                      placeholder="Write your message here"
                      value={inputText}
                      onIonInput={(e) => setInputText(e.detail.value || '')}
                      style={{
                        '--background': 'transparent',
                        '--padding-start': '16px',
                        '--highlight-height': '0px',
                      }}
                    />
                  </div>

                  {/* bottom row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 8px 8px' }}>
                    <div>
                      <input ref={fileInputRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handleImageAdd} />
                      <IonButton fill="clear" color="medium" size="small" style={{ '--border-radius': '50%' }} onClick={() => fileInputRef.current?.click()}>
                        <IonIcon slot="icon-only" icon={imageOutline} style={{ fontSize: 20 }} />
                      </IonButton>
                    </div>
                    <IonButton
                      size="small"
                      disabled={isSending || (!inputText.trim() && imageFiles.length === 0)}
                      onClick={handleSend}
                      style={{
                        '--background': '#2dd36f',
                        '--background-activated': '#28ba62',
                        '--color': '#fff',
                        '--border-radius': '8px',
                      }}
                    >
                      <IonIcon slot="start" icon={sendOutline} style={{ fontSize: 14 }} />
                      <span style={{ fontWeight: 700, letterSpacing: '0.05em', fontSize: '0.8rem' }}>SEND</span>
                    </IonButton>
                  </div>
                </div>
              </>
            ) : (
              /* no conversation selected */
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
                <IonIcon icon={chatbubblesOutline} style={{ fontSize: 48, color: 'var(--ion-color-medium)' }} />
                <span style={{ fontSize: '1rem', color: 'var(--ion-color-medium)' }}>Select a conversation to start chatting</span>
                <IonButton fill="outline" onClick={() => setShowNewModal(true)}>
                  <IonIcon slot="start" icon={addOutline} />
                  Create a Message
                </IonButton>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── NEW MESSAGE MODAL ── */}
      <IonModal
        isOpen={showNewModal}
        onDidDismiss={() => { setShowNewModal(false); setModalSearch(''); }}
        style={{ '--width': '580px', '--max-height': '85vh', '--border-radius': '12px' }}
        breakpoints={isMobile ? [0, 1] : undefined}
        initialBreakpoint={isMobile ? 1 : undefined}
      >
        <IonHeader>
          <IonToolbar style={{ '--background': 'var(--ion-card-background)' }}>
            <IonButtons slot="start">
              <IonButton fill="clear" color="medium" onClick={() => setShowNewModal(false)}>
                <IonIcon slot="icon-only" icon={closeOutline} />
              </IonButton>
            </IonButtons>
            <IonTitle style={{ fontWeight: 700 }}>New Message</IonTitle>
          </IonToolbar>
          <IonToolbar style={{ '--background': 'var(--ion-card-background)' }}>
            <IonSearchbar
              mode="md"
              value={modalSearch}
              onIonInput={(e) => setModalSearch(e.detail.value || '')}
              placeholder="Search contacts..."
              style={{ '--box-shadow': 'none', '--background': 'rgba(0,0,0,0.05)' }}
            />
          </IonToolbar>
        </IonHeader>

        <IonContent style={{ '--background': 'var(--ion-card-background)' }}>
          {filteredContacts.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 24px', gap: 12 }}>
              <IonIcon icon={chatbubbleOutline} style={{ fontSize: 36, color: 'var(--ion-color-medium)' }} />
              <span style={{ fontSize: '0.875rem', color: 'var(--ion-color-medium)' }}>No contacts found</span>
            </div>
          ) : (
            filteredContacts.map(contact => (
              <div
                key={contact.id}
                onClick={() => { onNewConversation?.(contact.id); setShowNewModal(false); setModalSearch(''); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 24px',
                  borderBottom: '1px solid var(--ion-border-color)',
                  cursor: 'pointer',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(var(--ion-color-primary-rgb),0.05)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <Avatar name={contact.name} src={contact.avatar} size={40} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--ion-text-color)' }}>{contact.name}</div>
                  {(contact.company || contact.role) && (
                    <div style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {[contact.role, contact.company].filter(Boolean).join(' · ')}
                    </div>
                  )}
                </div>
                <IonIcon icon={chevronForwardOutline} style={{ fontSize: 18, color: 'var(--ion-color-medium)', flexShrink: 0 }} />
              </div>
            ))
          )}
        </IonContent>
      </IonModal>
    </>
  );
}

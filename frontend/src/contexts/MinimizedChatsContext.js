import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';

const Ctx = createContext(null);
const LS_KEY = 'minimized-convos';
const POLL_MS = 3000;

// ── helper ─────────────────────────────────────────────────────────────────────
function getOtherPartyId(convo, currentUser) {
  if (!convo || !currentUser) return null;
  const uid = currentUser.id || currentUser._id;
  if (convo.carrier_id && convo.carrier_id !== uid) return convo.carrier_id;
  if (convo.broker_id && convo.broker_id !== uid) return convo.broker_id;
  if (convo.recipientId && convo.recipientId !== uid) return convo.recipientId;
  return null;
}

// ── provider ───────────────────────────────────────────────────────────────────
export function MinimizedChatsProvider({ children, currentUser, messagesApi }) {
  const [minimizedConvos, setMinimizedConvos] = useState([]);
  const [openMiniId, setOpenMiniId] = useState(null);
  const [miniInputs, setMiniInputs] = useState({});
  const [miniSending, setMiniSending] = useState({});

  // refs so async callbacks always see latest state
  const mcRef = useRef(minimizedConvos);
  const openRef = useRef(openMiniId);
  useEffect(() => { mcRef.current = minimizedConvos; }, [minimizedConvos]);
  useEffect(() => { openRef.current = openMiniId; }, [openMiniId]);

  // ── clear on logout ──────────────────────────────────────────────────────────
  const prevUidRef = useRef(null);
  useEffect(() => {
    const uid = currentUser?.id || currentUser?._id || null;
    if (prevUidRef.current && !uid) {
      setMinimizedConvos([]);
      setOpenMiniId(null);
      setMiniInputs({});
      setMiniSending({});
      localStorage.removeItem(LS_KEY);
    }
    prevUidRef.current = uid;
  }, [currentUser]);

  // ── init from localStorage ───────────────────────────────────────────────────
  const initializedRef = useRef(false);
  useEffect(() => {
    const uid = currentUser?.id || currentUser?._id;
    if (!uid || !messagesApi || initializedRef.current) return;
    initializedRef.current = true;

    const stored = (() => {
      try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); }
      catch { return []; }
    })();
    if (!stored.length) return;

    stored.forEach(async ({ id, convo }) => {
      try {
        const { messages } = await messagesApi.conversation(id);
        setMinimizedConvos(prev => {
          if (prev.find(m => m.id === id)) return prev;
          return [...prev, { id, convo, messages: messages || [], unreadCount: 0 }];
        });
      } catch {
        setMinimizedConvos(prev => {
          if (prev.find(m => m.id === id)) return prev;
          return [...prev, { id, convo, messages: [], unreadCount: 0 }];
        });
      }
    });
  }, [currentUser, messagesApi]);

  // ── persist on change ────────────────────────────────────────────────────────
  useEffect(() => {
    const uid = currentUser?.id || currentUser?._id;
    if (!uid) return;
    localStorage.setItem(
      LS_KEY,
      JSON.stringify(minimizedConvos.map(({ id, convo }) => ({ id, convo })))
    );
  }, [minimizedConvos, currentUser]);

  // ── polling ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const uid = currentUser?.id || currentUser?._id;
    if (!messagesApi || !uid) return;

    const poll = setInterval(async () => {
      const items = mcRef.current;
      if (!items.length) return;

      for (const mc of items) {
        try {
          const { messages: fresh } = await messagesApi.conversation(mc.id);
          const freshMsgs = fresh || [];
          const newCount = Math.max(0, freshMsgs.length - mc.messages.length);
          const isOpen = openRef.current === mc.id;

          setMinimizedConvos(prev => prev.map(item => {
            if (item.id !== mc.id) return item;
            return {
              ...item,
              messages: freshMsgs,
              unreadCount: isOpen ? 0 : item.unreadCount + newCount,
            };
          }));
        } catch { /* network hiccup – skip */ }
      }
    }, POLL_MS);

    return () => clearInterval(poll);
  }, [currentUser, messagesApi]);

  // ── actions ───────────────────────────────────────────────────────────────────

  const minimize = useCallback((convo, messages) => {
    const id = convo.id;
    setMinimizedConvos(prev => {
      if (prev.find(m => m.id === id)) return prev;
      return [...prev, { id, convo, messages: messages || [], unreadCount: 0 }];
    });
  }, []);

  const restore = useCallback((id, onRestore) => {
    setMinimizedConvos(prev => {
      const found = prev.find(m => m.id === id);
      if (found && onRestore) onRestore(found);
      return prev.filter(m => m.id !== id);
    });
    setOpenMiniId(prev => (prev === id ? null : prev));
  }, []);

  const closeMini = useCallback((id) => {
    setMinimizedConvos(prev => prev.filter(m => m.id !== id));
    setOpenMiniId(prev => (prev === id ? null : prev));
  }, []);

  const openMini = useCallback((id) => {
    setOpenMiniId(prev => {
      const next = prev === id ? null : id;
      if (next === id) {
        setMinimizedConvos(mc => mc.map(m => m.id === id ? { ...m, unreadCount: 0 } : m));
      }
      return next;
    });
  }, []);

  const setMiniInput = useCallback((id, value) => {
    setMiniInputs(prev => ({ ...prev, [id]: value }));
  }, []);

  const sendMini = useCallback(async (mc) => {
    const text = (miniInputs[mc.id] || '').trim();
    if (!text || miniSending[mc.id] || !messagesApi) return;

    setMiniSending(prev => ({ ...prev, [mc.id]: true }));
    setMiniInputs(prev => ({ ...prev, [mc.id]: '' }));

    try {
      const recipientId = getOtherPartyId(mc.convo, currentUser);
      const sent = await messagesApi.send(mc.convo.load_id || mc.convo.loadId || null, recipientId, text);
      setMinimizedConvos(prev => prev.map(item =>
        item.id !== mc.id ? item : { ...item, messages: [...item.messages, sent] }
      ));
    } catch {
      // restore text so the user can retry
      setMiniInputs(prev => ({ ...prev, [mc.id]: text }));
    } finally {
      setMiniSending(prev => ({ ...prev, [mc.id]: false }));
    }
  }, [miniInputs, miniSending, messagesApi, currentUser]);

  return (
    <Ctx.Provider value={{
      minimizedConvos, openMiniId,
      miniInputs, miniSending,
      minimize, restore, close: closeMini, openMini,
      setMiniInput, sendMini,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export function useMinimizedChats() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useMinimizedChats must be inside MinimizedChatsProvider');
  return ctx;
}

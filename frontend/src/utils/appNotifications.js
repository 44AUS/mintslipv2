const KEY = 'appNotifications';

export function getNotifications() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); }
  catch { return []; }
}

function save(list) {
  try { localStorage.setItem(KEY, JSON.stringify(list)); } catch { /* quota exceeded */ }
}

export function addGeneratingNotification({ id, type, fileName, fileType }) {
  const list = getNotifications();
  list.unshift({ id, type, fileName, fileType, status: 'generating', timestamp: Date.now(), read: false, toastShown: false });
  save(list);
}

export function markNotificationReady(id) {
  const list = getNotifications();
  const n = list.find(n => n.id === id);
  if (n) { n.status = 'ready'; n.read = false; n.toastShown = false; }
  save(list);
}

export function markNotificationError(id) {
  const list = getNotifications();
  const n = list.find(n => n.id === id);
  if (n) n.status = 'error';
  save(list);
}

export function markToastShown(id) {
  const list = getNotifications();
  const n = list.find(n => n.id === id);
  if (n) n.toastShown = true;
  save(list);
}

export function markAllRead() {
  const list = getNotifications();
  list.forEach(n => { n.read = true; });
  save(list);
}

export function removeNotification(id) {
  save(getNotifications().filter(n => n.id !== id));
}

export function clearAllNotifications() {
  save([]);
}

export function countUnread() {
  return getNotifications().filter(n => !n.read).length;
}

export function getPendingToasts() {
  return getNotifications().filter(n => n.status === 'ready' && !n.toastShown);
}

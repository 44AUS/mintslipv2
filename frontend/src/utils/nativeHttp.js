// HTTP helper: uses Capacitor's native HTTP (bypasses CORS) on native platforms,
// falls back to fetch on web. Also provides a helper for building Stripe-safe origin URLs.
import { CapacitorHttp } from '@capacitor/core';

export const isNative = (() => {
  try { return !!(window.Capacitor?.isNativePlatform?.()); }
  catch { return false; }
})();

// POST JSON, returns { ok, status, data }
// data is already parsed (or null if the body wasn't valid JSON)
// extraHeaders lets callers attach e.g. Authorization for authed POSTs.
export async function nativePost(url, body, extraHeaders = {}) {
  const headers = { 'Content-Type': 'application/json', ...extraHeaders };
  if (isNative) {
    const response = await CapacitorHttp.post({
      url,
      headers,
      data: body,
    });
    const data = (() => {
      if (response.data !== null && typeof response.data === 'object') return response.data;
      try { return JSON.parse(response.data); } catch { return null; }
    })();
    return { ok: response.status >= 200 && response.status < 300, status: response.status, data };
  }

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let data = null;
  try { data = JSON.parse(text); } catch { /* leave null */ }
  return { ok: res.ok, status: res.status, data };
}

// Returns an origin string safe for Stripe redirect URLs (must be https://).
// On iOS Capacitor the origin is capacitor://localhost which Stripe rejects,
// so we fall back to backendUrl (always https).
export function getStripeOrigin(backendUrl) {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  if (isNative && !origin.startsWith('https://')) {
    return backendUrl || origin;
  }
  return origin;
}

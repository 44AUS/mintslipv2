// A tiny global toast bridge so any code (components, contexts, utilities)
// can fire an Ionic toast without threading a hook through props — same
// system as the whodat app. <IonToaster/> registers the presenter once it's
// mounted (see components/IonToaster.js).
let presenter = null;
const queue = [];

export function registerToast(fn) {
  presenter = fn;
  // Flush anything fired before the host mounted
  while (queue.length) fn(queue.shift());
  return () => { if (presenter === fn) presenter = null; };
}

export function showToast(message, opts = {}) {
  const cfg = {
    message,
    duration: opts.duration ?? 2800,
    position: opts.position ?? "top",
    cssClass: "wd-toast",
    ...opts,
  };
  if (presenter) presenter(cfg);
  else queue.push(cfg);
}

// Red error variant
export function showErrorToast(message, opts = {}) {
  showToast(message, { ...opts, cssClass: "wd-toast wd-toast-error" });
}

// Green success variant
export function showSuccessToast(message, opts = {}) {
  showToast(message, { ...opts, cssClass: "wd-toast wd-toast-success" });
}

// Drop-in replacement for sonner's `toast` API so existing call sites
// (toast.success / toast.error / toast.info) work unchanged.
export const toast = {
  success: (message, opts) => showSuccessToast(String(message), opts),
  error: (message, opts) => showErrorToast(String(message), opts),
  info: (message, opts) => showToast(String(message), opts),
  message: (message, opts) => showToast(String(message), opts),
};

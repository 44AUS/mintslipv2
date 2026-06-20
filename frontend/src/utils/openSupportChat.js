/** Call this anywhere to pop open the live support chat widget. */
export function openSupportChat() {
  window.dispatchEvent(new CustomEvent('mintslip-open-support'));
}

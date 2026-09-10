// Fire-and-forget confetti attached to <body>, driven by the Web Animations
// API — it keeps falling even after the paywall closes. MintSlip-tinted.
const COLORS = ["#059669", "#10b981", "#34d399", "#a7f3d0", "#6ee7b7", "#fbbf24", "#f59e0b", "#ffffff"];

export function launchConfetti(count = 90) {
  if (typeof document === "undefined") return;
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const layer = document.createElement("div");
  Object.assign(layer.style, {
    position: "fixed", inset: "0", zIndex: "10060", pointerEvents: "none", overflow: "hidden",
  });
  document.body.appendChild(layer);

  let maxEnd = 0;
  for (let i = 0; i < count; i += 1) {
    const size = 6 + Math.random() * 7;
    const piece = document.createElement("span");
    Object.assign(piece.style, {
      position: "absolute",
      top: "-12vh",
      left: `${Math.random() * 100}%`,
      width: `${size}px`,
      height: `${size * 0.62}px`,
      background: COLORS[i % COLORS.length],
      borderRadius: "2px",
      opacity: "0.95",
      willChange: "transform",
    });
    layer.appendChild(piece);

    const delay = Math.random() * 1000;
    const duration = 2600 + Math.random() * 2400;
    const rot = 180 + Math.random() * 540;
    const drift = (Math.random() * 2 - 1) * 40;
    if (piece.animate) {
      piece.animate(
        [
          { transform: "translate(0, -12vh) rotate(0deg)" },
          { transform: `translate(${drift}px, 112vh) rotate(${rot}deg)` },
        ],
        { duration, delay, easing: "linear", fill: "forwards" },
      );
    }
    maxEnd = Math.max(maxEnd, delay + duration);
  }

  setTimeout(() => layer.remove(), maxEnd + 300);
}

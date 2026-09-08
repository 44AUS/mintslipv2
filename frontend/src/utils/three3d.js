// Lazily load Three.js from a CDN, only when a screen needs the 3D leaf —
// the same on-demand pattern whodat uses for its magnifying glass. Classic
// UMD script that attaches to window.THREE, no bundler involvement, so it
// stays robust in the CRA build. Callers fall back to a static leaf if this
// fails or WebGL is unavailable.

const VER = "0.137.0";
const THREE_SRC = `https://cdn.jsdelivr.net/npm/three@${VER}/build/three.min.js`;

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const prev = document.querySelector(`script[data-three3d="${src}"]`);
    if (prev) {
      if (prev.dataset.loaded) resolve();
      else {
        prev.addEventListener("load", () => resolve());
        prev.addEventListener("error", () => reject(new Error(`failed ${src}`)));
      }
      return;
    }
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.dataset.three3d = src;
    s.onload = () => { s.dataset.loaded = "1"; resolve(); };
    s.onerror = () => reject(new Error(`failed ${src}`));
    document.head.appendChild(s);
  });
}

let promise = null;
export function loadThree() {
  if (promise) return promise;
  promise = (async () => {
    await loadScript(THREE_SRC);
    if (!window.THREE) throw new Error("THREE missing");
    return { THREE: window.THREE };
  })();
  return promise;
}

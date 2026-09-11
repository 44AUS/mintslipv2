import { useEffect, useRef, useState } from "react";
import { loadThree } from "../utils/three3d";

// A glossy 3D red X — two beveled bars crossed at 90° — floating and slowly
// spinning over a pulsing red glow. Structural port of Leaf3D (the payment
// success screen's leaf): Three.js loads lazily from a CDN; if anything fails
// we fall back to a static SVG X with a CSS float. Drag or move a cursor or
// finger over it to spin with inertia.
export default function RedX3D({ height = 210, spinSpeed = 0.005 }) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const [failed, setFailed] = useState(false);
  const spinSpeedRef = useRef(spinSpeed);
  useEffect(() => { spinSpeedRef.current = spinSpeed; }, [spinSpeed]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let disposed = false;
    let raf = 0;
    let running = false;
    const cleanups = [];
    const fail = () => { if (!disposed) setFailed(true); };

    (async () => {
      let THREE;
      try {
        ({ THREE } = await loadThree());
      } catch (e) { return fail(); }
      if (disposed) return;

      let renderer;
      try {
        renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
      } catch (e) { return fail(); }
      if (!renderer || !renderer.getContext()) return fail();
      renderer.setClearColor(0x000000, 0);

      const red = new THREE.Color("#ef4444");
      const deep = new THREE.Color("#7f1d1d");

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
      camera.position.set(0, 0, 5.2);

      // group = spin container; mark = the X (centred + scaled)
      const group = new THREE.Group();
      scene.add(group);
      const mark = new THREE.Group();
      mark.scale.setScalar(1.08);
      group.add(mark);

      // One beveled bar: a rounded-rectangle outline extruded with a soft
      // bevel — two of them crossed at ±45° make the X. Vertex-tinted from a
      // light red at the top to deep at the base so the gradient lives in
      // actual geometry, exactly like the leaf's blade.
      const tipColor = new THREE.Color("#f87171");
      const baseColor = new THREE.Color("#b91c1c");
      const makeBar = (angle) => {
        const w = 0.42, l = 2.0, r = 0.16;
        const shape = new THREE.Shape();
        const x0 = -w / 2, y0 = -l / 2, x1 = w / 2, y1 = l / 2;
        shape.moveTo(x0 + r, y0);
        shape.lineTo(x1 - r, y0);
        shape.quadraticCurveTo(x1, y0, x1, y0 + r);
        shape.lineTo(x1, y1 - r);
        shape.quadraticCurveTo(x1, y1, x1 - r, y1);
        shape.lineTo(x0 + r, y1);
        shape.quadraticCurveTo(x0, y1, x0, y1 - r);
        shape.lineTo(x0, y0 + r);
        shape.quadraticCurveTo(x0, y0, x0 + r, y0);
        const geo = new THREE.ExtrudeGeometry(shape, {
          depth: 0.16, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.06,
          bevelSegments: 4, curveSegments: 18,
        });
        geo.translate(0, 0, -0.14); // centre the thickness on z=0
        geo.rotateZ(angle);
        {
          const pos = geo.attributes.position;
          const cols = new Float32Array(pos.count * 3);
          const c = new THREE.Color();
          for (let i = 0; i < pos.count; i++) {
            const tRaw = (pos.getY(i) + 1.05) / 2.1; // 0 base → 1 top
            const tEase = Math.min(1, Math.max(0, tRaw));
            c.copy(baseColor).lerp(tipColor, tEase * tEase);
            cols[i * 3] = c.r; cols[i * 3 + 1] = c.g; cols[i * 3 + 2] = c.b;
          }
          geo.setAttribute("color", new THREE.BufferAttribute(cols, 3));
        }
        return new THREE.Mesh(geo, new THREE.MeshPhysicalMaterial({
          vertexColors: true, color: 0xffffff,
          metalness: 0.05, roughness: 0.32,
          clearcoat: 0.65, clearcoatRoughness: 0.3,
          emissive: deep, emissiveIntensity: 0.14,
        }));
      };
      mark.add(makeBar(Math.PI / 4));
      mark.add(makeBar(-Math.PI / 4));

      // Lights: the leaf's rig with the coloured lights swapped to red so the
      // beveled edges catch a glowing red outline as it spins.
      scene.add(new THREE.AmbientLight(0xffffff, 0.5));
      const dir = new THREE.DirectionalLight(0xffffff, 0.9);
      dir.position.set(2.5, 3, 4);
      scene.add(dir);
      const pA = new THREE.PointLight(red, 1.1, 22);
      pA.position.set(-3.5, 1.5, 3);
      scene.add(pA);
      const pB = new THREE.PointLight(0xffffff, 0.65, 22);
      pB.position.set(3, -2.5, 4);
      scene.add(pB);
      const rim = new THREE.DirectionalLight(new THREE.Color("#f87171"), 0.9);
      rim.position.set(0, 1.2, -4);
      scene.add(rim);

      const sizeToBox = () => {
        const r = canvas.getBoundingClientRect();
        const w = r.width || 300, h = r.height || 300;
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        ensureRunning();
      };
      const ro = new ResizeObserver(sizeToBox);
      ro.observe(canvas);
      cleanups.push(() => ro.disconnect());
      cleanups.push(() => renderer.dispose());
      sizeToBox();

      // Interaction: drag/hover spin with inertia, easing back to an idle spin
      let yaw = 0.45, pitch = -0.1, velYaw = 0, velPitch = 0;
      let dragging = false, last = { x: 0, y: 0 }, lastInteract = 0;
      const t0 = performance.now();

      const local = (e) => {
        const r = canvas.getBoundingClientRect();
        return { x: e.clientX - r.left, y: e.clientY - r.top };
      };
      const onDown = (e) => {
        dragging = true; last = local(e); velYaw = 0; velPitch = 0;
        lastInteract = performance.now();
        canvas.setPointerCapture && canvas.setPointerCapture(e.pointerId);
        ensureRunning();
      };
      const onMove = (e) => {
        const p = local(e); const dx = p.x - last.x, dy = p.y - last.y; last = p;
        lastInteract = performance.now();
        if (dragging) { yaw += dx * 0.01; pitch += dy * 0.01; velYaw = dx * 0.01; velPitch = dy * 0.01; }
        else { yaw += dx * 0.004; velYaw = dx * 0.006; pitch += dy * 0.002; velPitch = dy * 0.003; }
        ensureRunning();
      };
      const onUp = () => { dragging = false; lastInteract = performance.now(); ensureRunning(); };
      canvas.addEventListener("pointerdown", onDown);
      canvas.addEventListener("pointermove", onMove);
      canvas.addEventListener("pointerup", onUp);
      canvas.addEventListener("pointerleave", onUp);
      canvas.addEventListener("pointercancel", onUp);
      cleanups.push(() => {
        canvas.removeEventListener("pointerdown", onDown);
        canvas.removeEventListener("pointermove", onMove);
        canvas.removeEventListener("pointerup", onUp);
        canvas.removeEventListener("pointerleave", onUp);
        canvas.removeEventListener("pointercancel", onUp);
      });

      function tick() {
        const t = (performance.now() - t0) / 1000;
        if (!dragging) {
          yaw += velYaw; pitch += velPitch;
          velYaw *= 0.94; velPitch *= 0.9;
          velPitch += (-0.1 - pitch) * 0.01; // spring the tilt back
          if (!reduce && performance.now() - lastInteract > 1400 && Math.abs(velYaw) < spinSpeedRef.current + 0.001) {
            velYaw += (spinSpeedRef.current - velYaw) * 0.05; // gentle idle spin
          }
        }
        if (pitch > 0.5) { pitch = 0.5; velPitch = 0; }
        if (pitch < -0.6) { pitch = -0.6; velPitch = 0; }
        group.rotation.set(pitch, yaw, 0);

        if (!reduce) {
          mark.position.y = Math.sin(t * 1.3) * 0.06; // float
        }
        renderer.render(scene, camera);

        const settled = !dragging && Math.abs(velYaw) < 0.0004 && Math.abs(velPitch) < 0.0004;
        if (reduce && settled) { running = false; return; }
        raf = requestAnimationFrame(tick);
      }
      function ensureRunning() {
        if (!running && !disposed) { running = true; raf = requestAnimationFrame(tick); }
      }
      ensureRunning();
    })();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      cleanups.forEach((fn) => { try { fn(); } catch (e) { /* noop */ } });
    };
  }, []);

  const fallbackX = (
    <svg viewBox="0 0 64 64" width={Math.round(height * 0.56)} height={Math.round(height * 0.56)} aria-hidden="true">
      <defs>
        <linearGradient id="redx3dFallbackG" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f87171" />
          <stop offset="1" stopColor="#b91c1c" />
        </linearGradient>
      </defs>
      <path d="M18 10 L32 24 L46 10 L54 18 L40 32 L54 46 L46 54 L32 40 L18 54 L10 46 L24 32 L10 18 Z"
        fill="url(#redx3dFallbackG)" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );

  return (
    <div ref={wrapRef} role="img" aria-label="3D red X" style={{ position: "relative", height, touchAction: "none" }}>
      <style>{`
        @keyframes redx3dGlowPulse { 0%, 100% { opacity: 0.5; transform: translateX(-50%) scale(1); } 50% { opacity: 0.9; transform: translateX(-50%) scale(1.18); } }
        @keyframes redx3dFallbackFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        @media (prefers-reduced-motion: reduce) {
          .redx3d-glow, .redx3d-fallback { animation: none !important; }
        }
      `}</style>
      <span className="redx3d-glow" aria-hidden="true" style={{
        position: "absolute", left: "50%", bottom: 4, transform: "translateX(-50%)",
        width: height, height: Math.round(height * 0.32),
        background: "radial-gradient(ellipse at center, rgba(239,68,68,0.35) 0%, transparent 70%)",
        filter: "blur(16px)", animation: "redx3dGlowPulse 2.8s ease-in-out infinite",
        pointerEvents: "none",
      }} />
      {!failed && (
        <canvas ref={canvasRef} aria-hidden="true" style={{
          position: "absolute", inset: 0, width: "100%", height: "100%",
          display: "block", cursor: "grab",
        }} />
      )}
      {failed && (
        <div className="redx3d-fallback" aria-hidden="true" style={{
          position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
          animation: "redx3dFallbackFloat 3.4s ease-in-out infinite",
          filter: "drop-shadow(0 12px 28px rgba(185,28,28,0.35))",
        }}>
          {fallbackX}
        </div>
      )}
    </div>
  );
}

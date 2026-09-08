import { useEffect, useRef, useState } from "react";
import { loadThree } from "../utils/three3d";

// A glossy 3D mint leaf — extruded from the brand leaf outline — floating and
// slowly spinning over a pulsing glow. Drag or move a cursor/finger over it to
// spin with inertia. This is a direct port of whodat's FaceScanHero: Three.js
// loads lazily from a CDN; if anything fails we fall back to the static SVG
// leaf with a CSS float.
export default function Leaf3D({ height = 210, spinSpeed = 0.005 }) {
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

      const green = new THREE.Color("#22c55e");
      const deep = new THREE.Color("#15803d");

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
      camera.position.set(0, 0, 5.2);

      // group = spin container; leaf = the extruded leaf (centred + scaled)
      const group = new THREE.Group();
      scene.add(group);
      const leaf = new THREE.Group();
      leaf.position.y = 0.18;
      leaf.scale.setScalar(1.12);
      leaf.rotation.z = -0.06; // a slight natural lean
      group.add(leaf);

      // Blade: the brand leaf outline (SVG path, mapped y-up) extruded
      const shape = new THREE.Shape();
      shape.moveTo(0, 0.9375);
      shape.bezierCurveTo(-0.625, 0.5625, -0.8125, 0, -0.625, -0.4375);
      shape.bezierCurveTo(-0.46875, -0.78125, -0.15625, -0.90625, 0, -0.9375);
      shape.bezierCurveTo(0.15625, -0.90625, 0.46875, -0.78125, 0.625, -0.4375);
      shape.bezierCurveTo(0.8125, 0, 0.625, 0.5625, 0, 0.9375);
      const geo = new THREE.ExtrudeGeometry(shape, {
        depth: 0.14, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05,
        bevelSegments: 3, curveSegments: 28,
      });
      geo.translate(0, 0, -0.12); // centre the thickness on z=0
      const blade = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
        color: green, metalness: 0.18, roughness: 0.4,
        emissive: deep, emissiveIntensity: 0.24,
      }));
      leaf.add(blade);

      // Veins on both faces: a central rib + four angled side veins
      const veinMat = new THREE.MeshBasicMaterial({ color: 0xd1fae5, transparent: true, opacity: 0.55 });
      const addVeins = (z, mirror) => {
        const rib = new THREE.Mesh(new THREE.BoxGeometry(0.035, 1.62, 0.02), veinMat);
        rib.position.set(0, -0.05, z);
        leaf.add(rib);
        [[0.32, -0.62], [0.05, -0.7], [-0.22, -0.78], [-0.45, -0.86]].forEach(([y, rot]) => {
          const l = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.5, 0.02), veinMat);
          l.position.set(-0.2, y - 0.14, z);
          l.rotation.z = rot * mirror;
          leaf.add(l);
          const r = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.5, 0.02), veinMat);
          r.position.set(0.2, y - 0.14, z);
          r.rotation.z = -rot * mirror;
          leaf.add(r);
        });
      };
      addVeins(0.13, 1);
      addVeins(-0.13, 1);

      // Stem off the blade's base
      const stem = new THREE.Mesh(
        new THREE.CylinderGeometry(0.035, 0.05, 0.42, 18),
        new THREE.MeshStandardMaterial({ color: deep, metalness: 0.2, roughness: 0.5, emissive: deep, emissiveIntensity: 0.15 }),
      );
      stem.position.set(0.045, -1.1, 0);
      stem.rotation.z = 0.16;
      leaf.add(stem);

      // Lights (same rig as the whodat hero, greened)
      scene.add(new THREE.AmbientLight(0xffffff, 0.55));
      const dir = new THREE.DirectionalLight(0xffffff, 0.85);
      dir.position.set(2.5, 3, 4);
      scene.add(dir);
      const pA = new THREE.PointLight(green, 1.4, 22);
      pA.position.set(-3.5, 1.5, 3);
      scene.add(pA);
      const pB = new THREE.PointLight(0xffffff, 0.7, 22);
      pB.position.set(3, -2.5, 4);
      scene.add(pB);

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
          leaf.position.y = 0.18 + Math.sin(t * 1.3) * 0.06; // float
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

  const fallbackLeaf = (
    <svg viewBox="0 0 64 74" width={Math.round(height * 0.56)} height={Math.round(height * 0.65)} aria-hidden="true">
      <defs>
        <linearGradient id="leaf3dFallbackG" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#4ade80" />
          <stop offset="1" stopColor="#15803d" />
        </linearGradient>
      </defs>
      <path d="M32 4 C 12 16 6 34 12 48 C 17 59 27 63 32 64 C 37 63 47 59 52 48 C 58 34 52 16 32 4 Z" fill="url(#leaf3dFallbackG)" />
      <path d="M32 10 L 32 62" stroke="rgba(255,255,255,0.55)" strokeWidth="2" fill="none" />
      <path d="M32 24 C 26 26 21 30 18 35 M32 36 C 27 38 23 42 21 46 M32 24 C 38 26 43 30 46 35 M32 36 C 37 38 41 42 43 46"
        stroke="rgba(255,255,255,0.4)" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      <path d="M32 62 C 32 66 33 70 35 73" stroke="#15803d" strokeWidth="3.5" fill="none" strokeLinecap="round" />
    </svg>
  );

  return (
    <div ref={wrapRef} role="img" aria-label="3D mint leaf" style={{ position: "relative", height, touchAction: "none" }}>
      <style>{`
        @keyframes leaf3dGlowPulse { 0%, 100% { opacity: 0.5; transform: translateX(-50%) scale(1); } 50% { opacity: 0.9; transform: translateX(-50%) scale(1.18); } }
        @keyframes leaf3dFallbackFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        @media (prefers-reduced-motion: reduce) {
          .leaf3d-glow, .leaf3d-fallback { animation: none !important; }
        }
      `}</style>
      <span className="leaf3d-glow" aria-hidden="true" style={{
        position: "absolute", left: "50%", bottom: 4, transform: "translateX(-50%)",
        width: height, height: Math.round(height * 0.32),
        background: "radial-gradient(ellipse at center, rgba(34,197,94,0.35) 0%, transparent 70%)",
        filter: "blur(16px)", animation: "leaf3dGlowPulse 2.8s ease-in-out infinite",
        pointerEvents: "none",
      }} />
      {!failed && (
        <canvas ref={canvasRef} aria-hidden="true" style={{
          position: "absolute", inset: 0, width: "100%", height: "100%",
          display: "block", cursor: "grab",
        }} />
      )}
      {failed && (
        <div className="leaf3d-fallback" aria-hidden="true" style={{
          position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
          animation: "leaf3dFallbackFloat 3.4s ease-in-out infinite",
          filter: "drop-shadow(0 12px 28px rgba(21,128,61,0.35))",
        }}>
          {fallbackLeaf}
        </div>
      )}
    </div>
  );
}

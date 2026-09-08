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

      // Anchor the blade to the actual logo green — a lighter emerald under
      // the coloured point light drifts visibly teal.
      const green = new THREE.Color("#059669");
      const deep = new THREE.Color("#065f46");

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

      // Organic curl shared by every part: the blade's edges roll toward the
      // viewer and the tip/base arch gently back, so nothing reads as a flat
      // extrusion. Applied to raw vertices so the veins hug the curved surface.
      const curl = (geometry) => {
        const pos = geometry.attributes.position;
        for (let i = 0; i < pos.count; i++) {
          const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
          pos.setZ(i, z + Math.pow(Math.abs(x), 1.7) * 0.34 - y * y * 0.07);
        }
        pos.needsUpdate = true;
        geometry.computeVertexNormals();
        return geometry;
      };

      // Blade: the brand leaf outline (SVG path, mapped y-up), extruded with a
      // soft bevel, curled, and vertex-tinted light at the tip to deep at the
      // base — the logo gradient in actual geometry.
      const shape = new THREE.Shape();
      shape.moveTo(0, 0.9375);
      shape.bezierCurveTo(-0.625, 0.5625, -0.8125, 0, -0.625, -0.4375);
      shape.bezierCurveTo(-0.46875, -0.78125, -0.15625, -0.90625, 0, -0.9375);
      shape.bezierCurveTo(0.15625, -0.90625, 0.46875, -0.78125, 0.625, -0.4375);
      shape.bezierCurveTo(0.8125, 0, 0.625, 0.5625, 0, 0.9375);
      const geo = new THREE.ExtrudeGeometry(shape, {
        depth: 0.1, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.07,
        bevelSegments: 4, curveSegments: 40,
      });
      geo.translate(0, 0, -0.11); // centre the thickness on z=0
      curl(geo);
      const tipColor = new THREE.Color("#34d399");
      const baseColor = new THREE.Color("#047857");
      {
        const pos = geo.attributes.position;
        const cols = new Float32Array(pos.count * 3);
        const c = new THREE.Color();
        for (let i = 0; i < pos.count; i++) {
          const tRaw = (pos.getY(i) + 0.95) / 1.9; // 0 base → 1 tip
          const tEase = Math.min(1, Math.max(0, tRaw));
          c.copy(baseColor).lerp(tipColor, tEase * tEase);
          cols[i * 3] = c.r; cols[i * 3 + 1] = c.g; cols[i * 3 + 2] = c.b;
        }
        geo.setAttribute("color", new THREE.BufferAttribute(cols, 3));
      }
      const blade = new THREE.Mesh(geo, new THREE.MeshPhysicalMaterial({
        vertexColors: true, color: 0xffffff,
        metalness: 0.05, roughness: 0.32,
        clearcoat: 0.65, clearcoatRoughness: 0.3,
        emissive: deep, emissiveIntensity: 0.12,
      }));
      leaf.add(blade);

      // Veins on both faces, curled with the blade so they follow the surface:
      // a tapering central rib + three pairs of angled side veins per face.
      const veinMat = new THREE.MeshStandardMaterial({
        color: 0xa7f3d0, transparent: true, opacity: 0.5,
        roughness: 0.5, metalness: 0, emissive: 0x6ee7b7, emissiveIntensity: 0.25,
      });
      const addVeins = (z) => {
        const rib = new THREE.Mesh(curl(new THREE.BoxGeometry(0.032, 1.6, 0.018, 1, 24).translate(0, -0.06, z)), veinMat);
        leaf.add(rib);
        [[0.34, -0.6], [0.02, -0.72], [-0.32, -0.84]].forEach(([y, rot]) => {
          for (const side of [-1, 1]) {
            const g = new THREE.BoxGeometry(0.018, 0.46, 0.016, 1, 12);
            g.translate(0, 0.23, 0); // pivot at the rib end
            g.rotateZ(side * rot);
            g.translate(side * 0.02, y - 0.05, z);
            const v = new THREE.Mesh(curl(g), veinMat);
            leaf.add(v);
          }
        });
      };
      addVeins(0.075);
      addVeins(-0.075);

      // Stem: a gently curved tube flowing out of the blade's base
      const stemCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, -0.86, 0),
        new THREE.Vector3(0.02, -1.06, 0.02),
        new THREE.Vector3(0.09, -1.24, 0.03),
        new THREE.Vector3(0.2, -1.36, 0.02),
      ]);
      const stem = new THREE.Mesh(
        new THREE.TubeGeometry(stemCurve, 20, 0.042, 10, false),
        new THREE.MeshPhysicalMaterial({
          color: baseColor, metalness: 0.05, roughness: 0.45,
          clearcoat: 0.4, clearcoatRoughness: 0.4,
          emissive: deep, emissiveIntensity: 0.12,
        }),
      );
      leaf.add(stem);

      // Lights: the whodat rig plus an emerald rim light from behind so the
      // curled edges catch a glowing outline as it spins.
      scene.add(new THREE.AmbientLight(0xffffff, 0.5));
      const dir = new THREE.DirectionalLight(0xffffff, 0.9);
      dir.position.set(2.5, 3, 4);
      scene.add(dir);
      const pA = new THREE.PointLight(green, 1.1, 22);
      pA.position.set(-3.5, 1.5, 3);
      scene.add(pA);
      const pB = new THREE.PointLight(0xffffff, 0.65, 22);
      pB.position.set(3, -2.5, 4);
      scene.add(pB);
      const rim = new THREE.DirectionalLight(new THREE.Color("#10b981"), 0.9);
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
          <stop offset="0" stopColor="#34d399" />
          <stop offset="1" stopColor="#047857" />
        </linearGradient>
      </defs>
      <path d="M32 4 C 12 16 6 34 12 48 C 17 59 27 63 32 64 C 37 63 47 59 52 48 C 58 34 52 16 32 4 Z" fill="url(#leaf3dFallbackG)" />
      <path d="M32 10 L 32 62" stroke="rgba(255,255,255,0.55)" strokeWidth="2" fill="none" />
      <path d="M32 24 C 26 26 21 30 18 35 M32 36 C 27 38 23 42 21 46 M32 24 C 38 26 43 30 46 35 M32 36 C 37 38 41 42 43 46"
        stroke="rgba(255,255,255,0.4)" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      <path d="M32 62 C 32 66 33 70 35 73" stroke="#047857" strokeWidth="3.5" fill="none" strokeLinecap="round" />
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
        background: "radial-gradient(ellipse at center, rgba(16,185,129,0.35) 0%, transparent 70%)",
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
          filter: "drop-shadow(0 12px 28px rgba(4,120,87,0.35))",
        }}>
          {fallbackLeaf}
        </div>
      )}
    </div>
  );
}

import { useRef, useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Undo2, Trash2, Check } from "lucide-react";

const PEN_COLORS = [
  { label: "Black", value: "#111827" },
  { label: "Blue",  value: "#1d4ed8" },
  { label: "Red",   value: "#b91c1c" },
];

const PEN_SIZES = [
  { label: "Thin",   value: 2 },
  { label: "Medium", value: 3.2 },
  { label: "Thick",  value: 5 },
];

/**
 * Canvas signature pad. Draw with mouse, touch, or stylus.
 * Calls onChange(dataUrl | null) with a trimmed, transparent-background PNG.
 */
export default function SignaturePad({ onChange, height = 200 }) {
  const canvasRef  = useRef(null);
  const wrapRef    = useRef(null);
  const drawingRef = useRef(false);
  const pointsRef  = useRef([]);     // current stroke
  const strokesRef = useRef([]);     // completed strokes (for undo)

  const [color, setColor]   = useState(PEN_COLORS[0].value);
  const [size, setSize]     = useState(PEN_SIZES[1].value);
  const [isEmpty, setEmpty] = useState(true);

  // ── set up / resize canvas for HiDPI ───────────────────────────────────────
  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const dpr = window.devicePixelRatio || 1;
    const cssW = wrap.clientWidth;
    const cssH = height;

    canvas.width  = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    canvas.style.width  = cssW + "px";
    canvas.style.height = cssH + "px";

    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    return ctx;
  }, [height]);

  // Redraw every stored stroke (after resize / undo)
  const redraw = useCallback(() => {
    const ctx = setupCanvas();
    if (!ctx) return;
    const canvas = canvasRef.current;
    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);

    for (const stroke of strokesRef.current) {
      drawStroke(ctx, stroke.points, stroke.color, stroke.size);
    }
  }, [setupCanvas]);

  useEffect(() => {
    redraw();
    const onResize = () => redraw();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [redraw]);

  // ── stroke rendering with midpoint smoothing ───────────────────────────────
  function drawStroke(ctx, points, strokeColor, strokeSize) {
    if (!points.length) return;
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeSize;
    ctx.beginPath();

    if (points.length < 3) {
      const p = points[0];
      ctx.arc(p.x, p.y, strokeSize / 2, 0, Math.PI * 2);
      ctx.fillStyle = strokeColor;
      ctx.fill();
      return;
    }

    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length - 1; i++) {
      const midX = (points[i].x + points[i + 1].x) / 2;
      const midY = (points[i].y + points[i + 1].y) / 2;
      ctx.quadraticCurveTo(points[i].x, points[i].y, midX, midY);
    }
    const last = points[points.length - 1];
    ctx.lineTo(last.x, last.y);
    ctx.stroke();
  }

  const getPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  // ── export trimmed PNG ─────────────────────────────────────────────────────
  const exportSignature = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || strokesRef.current.length === 0) {
      onChange?.(null);
      return;
    }

    const ctx = canvas.getContext("2d");
    const { width, height: h } = canvas;
    const data = ctx.getImageData(0, 0, width, h).data;

    // Bounding box of non-transparent pixels
    let minX = width, minY = h, maxX = 0, maxY = 0, found = false;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < width; x++) {
        if (data[(y * width + x) * 4 + 3] > 8) {
          found = true;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
    if (!found) { onChange?.(null); return; }

    const pad = Math.round(8 * (window.devicePixelRatio || 1));
    minX = Math.max(0, minX - pad);
    minY = Math.max(0, minY - pad);
    maxX = Math.min(width - 1, maxX + pad);
    maxY = Math.min(h - 1, maxY + pad);

    const outW = maxX - minX + 1;
    const outH = maxY - minY + 1;

    const out = document.createElement("canvas");
    out.width = outW;
    out.height = outH;
    out.getContext("2d").drawImage(canvas, minX, minY, outW, outH, 0, 0, outW, outH);

    onChange?.(out.toDataURL("image/png"));
  }, [onChange]);

  // ── pointer handlers ───────────────────────────────────────────────────────
  const handleDown = (e) => {
    e.preventDefault();
    canvasRef.current.setPointerCapture?.(e.pointerId);
    drawingRef.current = true;
    pointsRef.current = [getPos(e)];
  };

  const handleMove = (e) => {
    if (!drawingRef.current) return;
    e.preventDefault();
    pointsRef.current.push(getPos(e));

    // Live render: redraw committed strokes + the in-progress one
    const ctx = canvasRef.current.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvasRef.current.width / dpr, canvasRef.current.height / dpr);
    for (const s of strokesRef.current) drawStroke(ctx, s.points, s.color, s.size);
    drawStroke(ctx, pointsRef.current, color, size);
  };

  const handleUp = (e) => {
    if (!drawingRef.current) return;
    e.preventDefault();
    drawingRef.current = false;
    if (pointsRef.current.length) {
      strokesRef.current.push({ points: pointsRef.current, color, size });
      pointsRef.current = [];
      setEmpty(false);
      exportSignature();
    }
  };

  const handleUndo = () => {
    strokesRef.current.pop();
    redraw();
    const empty = strokesRef.current.length === 0;
    setEmpty(empty);
    empty ? onChange?.(null) : exportSignature();
  };

  const handleClear = () => {
    strokesRef.current = [];
    pointsRef.current = [];
    redraw();
    setEmpty(true);
    onChange?.(null);
  };

  return (
    <div className="space-y-3">
      {/* Pen controls */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Color</span>
          {PEN_COLORS.map(c => (
            <button
              key={c.value}
              type="button"
              title={c.label}
              onClick={() => setColor(c.value)}
              className={`w-6 h-6 rounded-full border-2 transition-transform ${
                color === c.value ? "border-slate-900 scale-110" : "border-slate-200"
              }`}
              style={{ backgroundColor: c.value }}
            />
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Size</span>
          {PEN_SIZES.map(s => (
            <button
              key={s.value}
              type="button"
              onClick={() => setSize(s.value)}
              className={`px-2 py-1 text-xs rounded-md border transition-colors ${
                size === s.value
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Canvas */}
      <div
        ref={wrapRef}
        className="relative rounded-lg border-2 border-dashed border-slate-300 bg-white overflow-hidden"
        style={{ height }}
      >
        <canvas
          ref={canvasRef}
          onPointerDown={handleDown}
          onPointerMove={handleMove}
          onPointerUp={handleUp}
          onPointerLeave={handleUp}
          onPointerCancel={handleUp}
          className="block cursor-crosshair touch-none"
        />
        {isEmpty && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <p className="text-slate-400 text-sm">Draw your signature here</p>
            <p className="text-slate-300 text-xs mt-1">Use your mouse, finger, or stylus</p>
          </div>
        )}
        {/* Signature baseline guide */}
        <div className="absolute left-6 right-6 pointer-events-none border-b border-slate-200" style={{ bottom: Math.round(height * 0.28) }} />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500 flex items-center gap-1">
          {!isEmpty && <><Check className="w-3 h-3 text-green-600" /> Signature captured</>}
        </p>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={handleUndo} disabled={isEmpty}>
            <Undo2 className="w-4 h-4 mr-1" /> Undo
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={handleClear} disabled={isEmpty}>
            <Trash2 className="w-4 h-4 mr-1" /> Clear
          </Button>
        </div>
      </div>
    </div>
  );
}

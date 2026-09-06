import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { jsPDF } from "jspdf";
import AdminLayout from "@/components/AdminLayout";
import { IonButton, IonSpinner } from "@ionic/react";
import {
  ArrowLeft, Type, Square, Minus, Table, Image as ImageIcon, Trash2, Copy,
  Undo2, Eye, Save, Upload, ChevronUp, ChevronDown, X, Sparkles, Send, PenTool,
} from "lucide-react";
import { toast } from "@/utils/toast";
import {
  buildContext, resolveTokens, renderLayout, evalShowIf,
  getSampleVariants, getTokenGroups, getTableBindings, getShowIfPresets,
} from "@/utils/layoutEngine";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";
const PAGE_W = 612;
const PAGE_H = 792;

let idCounter = 0;
const newId = (prefix) => `${prefix}-${Date.now().toString(36)}-${idCounter++}`;

const NEW_ELEMENTS = {
  text: () => ({ id: newId("text"), type: "text", x: 60, y: 60, w: 200, content: "New text", fontSize: 10, bold: false, italic: false, color: "#1a1a1a", align: "left" }),
  rect: () => ({ id: newId("rect"), type: "rect", x: 60, y: 60, w: 200, h: 60, fill: "#f1f5f9", stroke: "#cbd5e1", lineWidth: 0.75, radius: 4 }),
  line: () => ({ id: newId("line"), type: "line", x: 60, y: 60, w: 200, h: 0, color: "#cbd5e1", lineWidth: 0.75 }),
  image: () => ({ id: newId("img"), type: "image", x: 60, y: 60, w: 90, h: 40, src: "{logoDataUrl}" }),
  table: () => ({
    id: newId("table"), type: "table", x: 40, y: 60, w: 532, binding: "earnings",
    rowHeight: 18, fontSize: 8, headerFill: "#f1f5f9", headerColor: "#334155", color: "#1a1a1a", zebra: false, rowLines: true,
    columns: [
      { header: "Description", token: "{name}", width: 0.5, align: "left" },
      { header: "Current", token: "{current}", width: 0.25, align: "right" },
      { header: "YTD", token: "{ytd}", width: 0.25, align: "right" },
    ],
  }),
};

// ── small form controls ──────────────────────────────────────────────────────

function Field({ label, children }) {
  return (
    <label style={{ display: "block", marginBottom: 10 }}>
      <span style={{ display: "block", fontSize: "0.68rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--admin-text-muted)", marginBottom: 4 }}>{label}</span>
      {children}
    </label>
  );
}

const inputStyle = {
  width: "100%", boxSizing: "border-box", padding: "6px 8px", borderRadius: 6,
  border: "1px solid var(--ion-border-color)", background: "var(--ion-background-color)",
  color: "var(--ion-text-color)", fontSize: "0.8rem", outline: "none",
};

function NumInput({ value, onChange, step = 1, min, max }) {
  return (
    <input type="number" style={inputStyle} value={value ?? 0} step={step} min={min} max={max}
      onChange={(e) => onChange(Number(e.target.value))} />
  );
}

function ColorInput({ value, onChange, allowNone }) {
  const isNone = !value || value === "none";
  return (
    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
      <input type="color" value={isNone ? "#ffffff" : value} style={{ width: 34, height: 28, padding: 0, border: "1px solid var(--ion-border-color)", borderRadius: 6, background: "none", cursor: "pointer" }}
        onChange={(e) => onChange(e.target.value)} />
      <input type="text" style={{ ...inputStyle, flex: 1 }} value={value || ""} placeholder="#000000"
        onChange={(e) => onChange(e.target.value)} />
      {allowNone && (
        <button type="button" onClick={() => onChange("none")}
          style={{ fontSize: "0.68rem", padding: "4px 7px", borderRadius: 6, border: "1px solid var(--ion-border-color)", background: isNone ? "var(--ion-color-step-100)" : "transparent", color: "var(--admin-text-muted)", cursor: "pointer" }}>
          none
        </button>
      )}
    </div>
  );
}

// ── canvas element previews ──────────────────────────────────────────────────

function CanvasElement({ el, ctx, selected, dimmed, onMouseDown, onResizeStart }) {
  const base = {
    position: "absolute", left: el.x, top: el.y, cursor: "move", userSelect: "none",
    outline: selected ? "1.5px solid #2563eb" : dimmed ? "1px dashed #cbd5e1" : "1px dashed transparent",
    outlineOffset: 1,
    opacity: dimmed ? 0.35 : 1,
  };
  const handle = selected && (
    <div onMouseDown={onResizeStart}
      style={{ position: "absolute", right: -5, bottom: -5, width: 9, height: 9, background: "#2563eb", borderRadius: 2, cursor: "nwse-resize", zIndex: 5 }} />
  );

  if (el.type === "rect") {
    return (
      <div onMouseDown={onMouseDown} style={{ ...base, width: el.w, height: el.h, background: el.fill === "none" ? "transparent" : el.fill, border: el.stroke && el.stroke !== "none" ? `${Math.max(el.lineWidth || 0.5, 0.5)}px solid ${el.stroke}` : "none", borderRadius: el.radius || 0 }}>
        {handle}
      </div>
    );
  }
  if (el.type === "line") {
    return (
      <div onMouseDown={onMouseDown} style={{ ...base, width: Math.max(el.w, 4), height: Math.max(el.lineWidth || 1, 3), display: "flex", alignItems: "center" }}>
        <div style={{ width: "100%", height: Math.max(el.lineWidth || 0.5, 1), background: el.color || "#cbd5e1" }} />
        {handle}
      </div>
    );
  }
  if (el.type === "image") {
    const src = resolveTokens(el.src, ctx);
    return (
      <div onMouseDown={onMouseDown} style={{ ...base, width: el.w, height: el.h, background: "#f8fafc", border: "1px dashed #cbd5e1", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
        {src && src.startsWith("data:")
          ? <img src={src} alt="" style={{ maxWidth: "100%", maxHeight: "100%", pointerEvents: "none" }} />
          : <ImageIcon size={16} style={{ color: "#94a3b8" }} />}
        {handle}
      </div>
    );
  }
  if (el.type === "table") {
    const rows = Array.isArray(ctx[el.binding]) ? ctx[el.binding] : [];
    const rowH = el.rowHeight || 16;
    return (
      <div onMouseDown={onMouseDown} style={{ ...base, width: el.w }}>
        <div style={{ display: "flex", height: rowH, background: el.headerFill === "none" ? "transparent" : el.headerFill, alignItems: "center" }}>
          {(el.columns || []).map((c, i) => (
            <div key={i} style={{ width: `${(c.width || 0) * 100}%`, padding: "0 6px", boxSizing: "border-box", fontSize: el.fontSize || 8, fontWeight: 700, color: el.headerColor || "#334155", textAlign: c.align || "left", overflow: "hidden", whiteSpace: "nowrap", borderLeft: el.colLines && i > 0 ? "0.5px solid #c8c8c8" : "none" }}>
              {c.header}
            </div>
          ))}
        </div>
        {rows.map((row, ri) => (
          <div key={ri} style={{ display: "flex", height: rowH, alignItems: "center", background: el.zebra && ri % 2 === 1 ? (el.zebraFill || "#f8fafc") : "transparent", borderBottom: el.rowLines !== false ? "0.5px solid #e2e8f0" : "none" }}>
            {(el.columns || []).map((c, i) => (
              <div key={i} style={{ width: `${(c.width || 0) * 100}%`, padding: "0 6px", boxSizing: "border-box", fontSize: el.fontSize || 8, color: el.color || "#1a1a1a", textAlign: c.align || "left", overflow: "hidden", whiteSpace: "nowrap", borderLeft: el.colLines && i > 0 ? "0.5px solid #c8c8c8" : "none" }}>
                {resolveTokens(c.token, row)}
              </div>
            ))}
          </div>
        ))}
        {handle}
      </div>
    );
  }
  // text
  return (
    <div onMouseDown={onMouseDown} style={{
      ...base, width: el.w || "auto", minHeight: (el.fontSize || 9) + 4,
      fontSize: el.fontSize || 9, fontWeight: el.bold ? 700 : 400, fontStyle: el.italic ? "italic" : "normal",
      color: el.color || "#1a1a1a", textAlign: el.align || "left", fontFamily: "Helvetica, Arial, sans-serif",
      lineHeight: 1.25, whiteSpace: el.wrap ? "normal" : "nowrap", overflow: "visible",
    }}>
      {resolveTokens(el.content, ctx) || " "}
      {handle}
    </div>
  );
}

// ── main editor ──────────────────────────────────────────────────────────────

export default function AdminTemplateEditor() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [meta, setMeta] = useState(null);
  const [layout, setLayout] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [history, setHistory] = useState([]);
  const [variantKey, setVariantKey] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const canvasRef = useRef(null);
  const dragRef = useRef(null);

  const docType = meta?.documentType || "paystub";
  const variants = useMemo(() => getSampleVariants(docType), [docType]);
  const activeVariant = variants.find((v) => v.key === variantKey) || variants[0];
  const sampleData = activeVariant.data;
  const sampleCtx = useMemo(() => buildContext(sampleData, docType), [sampleData, docType]);
  const tokenGroups = useMemo(() => getTokenGroups(docType), [docType]);
  const tableBindings = useMemo(() => getTableBindings(docType), [docType]);
  const showIfPresets = useMemo(() => getShowIfPresets(docType), [docType]);
  const pageCount = Math.max(1, ...(layout?.elements || []).map((e) => e.page || 1));
  const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem("adminToken")}` });

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/admin/doc-templates/${id}`, { headers: authHeaders() });
        if (!res.ok) throw new Error("Template not found");
        const data = await res.json();
        setMeta({ id: data.template.id, name: data.template.name, description: data.template.description || "", badgeColor: data.template.badgeColor || "#16a34a", status: data.template.status, version: data.template.version, documentType: data.template.documentType });
        setLayout(data.template.layout && data.template.layout.elements ? data.template.layout : { page: { width: PAGE_W, height: PAGE_H }, elements: [] });
      } catch (err) {
        toast.error(err.message);
        navigate("/admin/templates");
      }
    })();
  }, [id]);

  const selected = layout?.elements.find((e) => e.id === selectedId) || null;

  // Layout mutation with undo history (snapshot BEFORE the change).
  const commit = useCallback((updater, snapshot = true) => {
    setLayout((prev) => {
      if (!prev) return prev;
      if (snapshot) setHistory((h) => [...h.slice(-49), prev]);
      const next = typeof updater === "function" ? updater(prev) : updater;
      return next;
    });
    setDirty(true);
  }, []);

  const undo = useCallback(() => {
    setHistory((h) => {
      if (!h.length) return h;
      setLayout(h[h.length - 1]);
      setDirty(true);
      return h.slice(0, -1);
    });
  }, []);

  // ── AI design assistant ────────────────────────────────────────────────────
  const [aiOpen, setAiOpen] = useState(false);
  const [aiMessages, setAiMessages] = useState([]);
  const [aiInput, setAiInput] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const aiEndRef = useRef(null);

  useEffect(() => {
    if (aiOpen) aiEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [aiMessages, aiBusy, aiOpen]);

  const sendAi = async () => {
    const text = aiInput.trim();
    if (!text || aiBusy || !layout) return;
    const nextMsgs = [...aiMessages, { role: "user", content: text }];
    setAiMessages(nextMsgs);
    setAiInput("");
    setAiBusy(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/doc-templates/assistant`, {
        method: "POST",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMsgs, layout, documentType: docType }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || "Assistant request failed");
      if (data.layout) {
        commit(() => data.layout); // snapshots first, so Undo reverts the AI change
        setSelectedId(null);
      }
      setAiMessages((m) => [...m, {
        role: "assistant",
        content: (data.reply || "Done.") + (data.layout ? "\n\n✓ Applied to the canvas — Undo reverts it." : ""),
      }]);
    } catch (err) {
      setAiMessages((m) => [...m, { role: "assistant", content: `Something went wrong: ${err.message}` }]);
    } finally {
      setAiBusy(false);
    }
  };

  const onAiKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendAi(); }
  };

  const updateEl = (patch, snapshot = true) => {
    if (!selectedId) return;
    commit((prev) => ({
      ...prev,
      elements: prev.elements.map((e) => (e.id === selectedId ? { ...e, ...patch } : e)),
    }), snapshot);
  };

  const addElement = (type) => {
    const el = { ...NEW_ELEMENTS[type](), ...(currentPage > 1 ? { page: currentPage } : {}) };
    if (type === "table") el.binding = tableBindings[0]?.binding || "earnings";
    commit((prev) => ({ ...prev, elements: [...prev.elements, el] }));
    setSelectedId(el.id);
  };

  // Legal documents: drop in a complete signature area for a party — drawn/
  // uploaded signature image with a typed-name fallback, rule, name, and date.
  const addSignatureBlock = (party) => {
    const px = party === "A" ? 40 : 332;
    const base = currentPage > 1 ? { page: currentPage } : {};
    const y = 620;
    const els = [
      { id: newId("sig-img"), type: "image", x: px, y, w: 150, h: 34, src: `{party${party}Signature}`, showIf: `hasParty${party}SignatureImage`, ...base },
      { id: newId("sig-typed"), type: "text", x: px, y: y + 12, w: 220, content: `{party${party}SignatureName}`, fontSize: 16, italic: true, color: "#1a1a1a", showIf: `!hasParty${party}SignatureImage`, ...base },
      { id: newId("sig-line"), type: "line", x: px, y: y + 38, w: 220, h: 0, color: "#1a1a1a", lineWidth: 0.8, ...base },
      { id: newId("sig-name"), type: "text", x: px, y: y + 44, w: 220, content: `{party${party}Name} — Party ${party}`, fontSize: 8.5, bold: true, color: "#1a1a1a", ...base },
      { id: newId("sig-date"), type: "text", x: px, y: y + 57, w: 220, content: `Date: {party${party}SignDate}`, fontSize: 8, color: "#475569", ...base },
    ];
    commit((prev) => ({ ...prev, elements: [...prev.elements, ...els] }));
    setSelectedId(els[0].id);
  };

  const deleteSelected = useCallback(() => {
    if (!selectedId) return;
    commit((prev) => ({ ...prev, elements: prev.elements.filter((e) => e.id !== selectedId) }));
    setSelectedId(null);
  }, [selectedId, commit]);

  const duplicateSelected = () => {
    if (!selected) return;
    const copy = { ...JSON.parse(JSON.stringify(selected)), id: newId(selected.type), x: selected.x + 12, y: selected.y + 12 };
    commit((prev) => ({ ...prev, elements: [...prev.elements, copy] }));
    setSelectedId(copy.id);
  };

  const reorderSelected = (dir) => {
    if (!selectedId) return;
    commit((prev) => {
      const els = [...prev.elements];
      const i = els.findIndex((e) => e.id === selectedId);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= els.length) return prev;
      [els[i], els[j]] = [els[j], els[i]];
      return { ...prev, elements: els };
    });
  };

  // ── drag & resize ──
  const startDrag = (e, el, mode) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedId(el.id);
    dragRef.current = { mode, elId: el.id, startX: e.clientX, startY: e.clientY, orig: { x: el.x, y: el.y, w: el.w || 0, h: el.h || 0 }, moved: false };

    const onMove = (ev) => {
      const d = dragRef.current;
      if (!d) return;
      const dx = ev.clientX - d.startX;
      const dy = ev.clientY - d.startY;
      if (!d.moved && Math.abs(dx) < 2 && Math.abs(dy) < 2) return;
      if (!d.moved) {
        d.moved = true;
        // snapshot once at drag start
        setLayout((prev) => { setHistory((h) => [...h.slice(-49), prev]); return prev; });
      }
      setLayout((prev) => ({
        ...prev,
        elements: prev.elements.map((elem) => {
          if (elem.id !== d.elId) return elem;
          if (d.mode === "resize") {
            const next = { ...elem, w: Math.max(10, Math.round(d.orig.w + dx)) };
            if (elem.type === "rect" || elem.type === "image") next.h = Math.max(6, Math.round(d.orig.h + dy));
            if (elem.type === "line") next.h = Math.round(d.orig.h + dy);
            return next;
          }
          return {
            ...elem,
            x: Math.min(Math.max(0, Math.round(d.orig.x + dx)), PAGE_W - 10),
            y: Math.min(Math.max(0, Math.round(d.orig.y + dy)), PAGE_H - 10),
          };
        }),
      }));
      setDirty(true);
    };
    const onUp = () => {
      dragRef.current = null;
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  };

  // ── keyboard: nudge, delete, undo ──
  useEffect(() => {
    const onKey = (e) => {
      const tag = document.activeElement?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") { e.preventDefault(); undo(); return; }
      if (!selectedId) return;
      const step = e.shiftKey ? 10 : 1;
      const nudge = { ArrowUp: [0, -step], ArrowDown: [0, step], ArrowLeft: [-step, 0], ArrowRight: [step, 0] }[e.key];
      if (nudge) {
        e.preventDefault();
        commit((prev) => ({
          ...prev,
          elements: prev.elements.map((el) => (el.id === selectedId ? { ...el, x: Math.max(0, el.x + nudge[0]), y: Math.max(0, el.y + nudge[1]) } : el)),
        }));
      } else if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        deleteSelected();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [selectedId, commit, deleteSelected, undo]);

  // ── save / publish / preview ──
  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/doc-templates/${id}`, {
        method: "PUT",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ name: meta.name, description: meta.description || "", badgeColor: meta.badgeColor || "#16a34a", layout }),
      });
      if (!res.ok) throw new Error("Failed to save");
      setDirty(false);
      toast.success("Draft saved");
      return true;
    } catch (err) {
      toast.error(err.message);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const publish = async () => {
    if (!(await save())) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/doc-templates/${id}/publish`, { method: "POST", headers: authHeaders() });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || "Failed to publish");
      setMeta((m) => ({ ...m, status: "published", version: (m.version || 0) + 1 }));
      toast.success("Template published — live on the generator");
    } catch (err) {
      toast.error(err.message);
    }
  };

  const previewPdf = () => {
    try {
      const doc = new jsPDF({ unit: "pt", format: "letter" });
      renderLayout(doc, layout, sampleData, docType);
      setPreviewUrl(doc.output("bloburl"));
    } catch (err) {
      toast.error("Preview failed: " + err.message);
    }
  };

  const insertToken = (token) => {
    if (selected && (selected.type === "text")) {
      updateEl({ content: (selected.content || "") + token });
    } else {
      const el = { ...NEW_ELEMENTS.text(), content: token };
      commit((prev) => ({ ...prev, elements: [...prev.elements, el] }));
      setSelectedId(el.id);
    }
  };

  if (!meta || !layout) {
    return (
      <AdminLayout>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "120px 0" }}>
          <IonSpinner name="crescent" color="primary" style={{ width: 32, height: 32 }} />
        </div>
      </AdminLayout>
    );
  }

  const panelCard = { background: "var(--ion-card-background)", borderRadius: 6, boxShadow: "0 1px 2px rgba(0,0,0,0.05), 0 6px 20px rgba(0,0,0,0.07)", padding: 14 };

  return (
    <AdminLayout>
      <div>
        {/* Toolbar */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
          <button className="admin-action-btn" title="Back to templates" onClick={() => {
            if (dirty && !window.confirm("You have unsaved changes. Leave anyway?")) return;
            navigate("/admin/templates");
          }}>
            <ArrowLeft size={16} />
          </button>
          <input
            style={{ ...inputStyle, width: 260, fontWeight: 600, fontSize: "0.95rem" }}
            value={meta.name}
            onChange={(e) => { setMeta((m) => ({ ...m, name: e.target.value })); setDirty(true); }}
          />
          {meta.status === "published"
            ? <span className="admin-badge admin-badge-green">Published{meta.version ? ` v${meta.version}` : ""}</span>
            : <span className="admin-badge admin-badge-amber">Draft</span>}
          {dirty && <span className="admin-badge admin-badge-slate">Unsaved changes</span>}
          <div style={{ flex: 1 }} />
          {variants.length > 1 && (
            <select
              style={{ ...inputStyle, width: 170 }}
              value={activeVariant.key}
              onChange={(e) => setVariantKey(e.target.value)}
              title="Preview the layout against different sample data"
            >
              {variants.map((v) => <option key={v.key} value={v.key}>Preview: {v.label}</option>)}
            </select>
          )}
          <IonButton fill={aiOpen ? "solid" : "outline"} color="tertiary" size="small" onClick={() => setAiOpen((o) => !o)}>
            <Sparkles size={14} style={{ marginRight: 5 }} />AI Assistant
          </IonButton>
          <IonButton fill="outline" color="medium" size="small" onClick={undo} disabled={!history.length}>
            <Undo2 size={14} style={{ marginRight: 5 }} />Undo
          </IonButton>
          <IonButton fill="outline" color="medium" size="small" onClick={previewPdf}>
            <Eye size={14} style={{ marginRight: 5 }} />Preview PDF
          </IonButton>
          <IonButton fill="outline" color="primary" size="small" onClick={save} disabled={saving}>
            <Save size={14} style={{ marginRight: 5 }} />Save Draft
          </IonButton>
          <IonButton color="primary" size="small" onClick={publish} disabled={saving}>
            <Upload size={14} style={{ marginRight: 5 }} />Publish
          </IonButton>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "190px 1fr 280px", gap: 16, alignItems: "start" }}>
          {/* Left: palette */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={panelCard}>
              <p style={{ margin: "0 0 8px", fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--admin-text-muted)" }}>Add element</p>
              {[["text", "Text", Type], ["rect", "Box", Square], ["line", "Line", Minus], ["table", "Table", Table], ["image", "Logo / Image", ImageIcon]].map(([type, label, Icon]) => (
                <button key={type} onClick={() => addElement(type)}
                  style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "7px 9px", marginBottom: 4, borderRadius: 6, border: "1px solid var(--ion-border-color)", background: "transparent", color: "var(--admin-text)", fontSize: "0.8rem", cursor: "pointer", textAlign: "left" }}>
                  <Icon size={14} style={{ color: "var(--ion-color-primary)" }} />{label}
                </button>
              ))}
              {docType === "legal-document" && ["A", "B"].map((party) => (
                <button key={party} onClick={() => addSignatureBlock(party)}
                  title="Adds a signature area: drawn/uploaded signature with typed-name fallback, line, name, and date"
                  style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "7px 9px", marginBottom: 4, borderRadius: 6, border: "1px solid var(--ion-border-color)", background: "transparent", color: "var(--admin-text)", fontSize: "0.8rem", cursor: "pointer", textAlign: "left" }}>
                  <PenTool size={14} style={{ color: "var(--ion-color-primary)" }} />Party {party} Signature
                </button>
              ))}
            </div>
            <div style={{ ...panelCard, maxHeight: 380, overflowY: "auto" }}>
              <p style={{ margin: "0 0 8px", fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--admin-text-muted)" }}>Data fields</p>
              {tokenGroups.map((g) => (
                <div key={g.group} style={{ marginBottom: 10 }}>
                  <p style={{ margin: "0 0 4px", fontSize: "0.7rem", fontWeight: 600, color: "var(--admin-text)" }}>{g.group}</p>
                  {g.tokens.map(([token, label]) => (
                    <button key={token} onClick={() => insertToken(token)} title={`Insert ${token}`}
                      style={{ display: "block", width: "100%", textAlign: "left", padding: "3px 6px", borderRadius: 4, border: "none", background: "transparent", color: "var(--admin-text-muted)", fontSize: "0.72rem", cursor: "pointer" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--ion-color-step-50)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                      {label}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Center: canvas */}
          <div style={{ overflow: "auto", paddingBottom: 24 }}>
            {/* Page switcher */}
            <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 10 }}>
              {Array.from({ length: pageCount }, (_, i) => i + 1).map((p) => (
                <button key={p} onClick={() => setCurrentPage(p)}
                  style={{ padding: "4px 12px", borderRadius: 6, fontSize: "0.75rem", fontWeight: 600, cursor: "pointer", border: "1px solid var(--ion-border-color)", background: currentPage === p ? "var(--ion-color-primary)" : "transparent", color: currentPage === p ? "#fff" : "var(--admin-text-muted)" }}>
                  Page {p}
                </button>
              ))}
              <button onClick={() => setCurrentPage(pageCount + 1)} title="Elements you add will start a new page"
                style={{ padding: "4px 10px", borderRadius: 6, fontSize: "0.75rem", cursor: "pointer", border: "1px dashed var(--ion-border-color)", background: "transparent", color: "var(--admin-text-muted)" }}>
                + Page
              </button>
            </div>
            <div
              ref={canvasRef}
              onMouseDown={() => setSelectedId(null)}
              style={{ position: "relative", width: PAGE_W, height: PAGE_H, margin: "0 auto", background: "#ffffff", boxShadow: "0 1px 2px rgba(0,0,0,0.05), 0 12px 32px rgba(0,0,0,0.12)", borderRadius: 2 }}
            >
              {layout.elements.filter((el) => (el.page || 1) === currentPage).map((el) => (
                <CanvasElement
                  key={el.id}
                  el={el}
                  ctx={sampleCtx}
                  selected={el.id === selectedId}
                  dimmed={!evalShowIf(el.showIf, sampleCtx)}
                  onMouseDown={(e) => startDrag(e, el, "move")}
                  onResizeStart={(e) => startDrag(e, el, "resize")}
                />
              ))}
            </div>
            <p style={{ textAlign: "center", fontSize: "0.72rem", color: "var(--admin-text-muted)", marginTop: 10 }}>
              US Letter (612 × 792 pt) · drag to move · corner handle resizes · arrow keys nudge (Shift = 10) · Delete removes · Ctrl+Z undo
              · faded elements are hidden for the current preview variant
            </p>
          </div>

          {/* Right: properties */}
          <div style={{ ...panelCard, maxHeight: "calc(100vh - 220px)", overflowY: "auto" }}>
            {!selected ? (
              <>
                <p style={{ fontSize: "0.78rem", color: "var(--admin-text-muted)", margin: "0 0 14px" }}>
                  Select an element on the page to edit it — or add one from the left. Preview shows sample employee data; customer data fills in at purchase.
                </p>
                <p style={{ margin: "0 0 10px", fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--admin-text-muted)" }}>
                  Template settings
                </p>
                <Field label="Description (shown in the template picker)">
                  <textarea
                    rows={2}
                    style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }}
                    placeholder='e.g. "Workday Style Inspired Template"'
                    value={meta.description || ""}
                    onChange={(e) => { setMeta((m) => ({ ...m, description: e.target.value })); setDirty(true); }}
                  />
                </Field>
                <Field label="Badge color (shown on the template card in the app)">
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <input
                      type="color"
                      value={/^#[0-9a-fA-F]{6}$/.test(meta.badgeColor || "") ? meta.badgeColor : "#16a34a"}
                      onChange={(e) => { setMeta((m) => ({ ...m, badgeColor: e.target.value })); setDirty(true); }}
                      style={{ width: 40, height: 30, padding: 2, border: "1px solid var(--admin-border)", borderRadius: 6, background: "transparent", cursor: "pointer", flexShrink: 0 }}
                    />
                    <input
                      style={{ ...inputStyle, flex: 1 }}
                      value={meta.badgeColor || "#16a34a"}
                      placeholder="#16a34a"
                      onChange={(e) => { setMeta((m) => ({ ...m, badgeColor: e.target.value })); setDirty(true); }}
                    />
                    <span style={{ background: /^#[0-9a-fA-F]{3,6}$/.test(meta.badgeColor || "") ? meta.badgeColor : "#16a34a", color: "#fff", padding: "4px 12px", borderRadius: 999, fontSize: "0.72rem", fontWeight: 700, whiteSpace: "nowrap", maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis" }}>
                      {meta.name || "Template"}
                    </span>
                  </div>
                </Field>
                <p style={{ margin: "14px 0 8px", fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--admin-text-muted)" }}>
                  PDF metadata
                </p>
                <p style={{ fontSize: "0.72rem", color: "var(--admin-text-muted)", margin: "0 0 10px" }}>
                  Embedded in the generated file's document properties.
                </p>
                {[["title", "Title"], ["author", "Author"], ["subject", "Subject"], ["keywords", "Keywords"], ["creator", "Creator"], ["producer", "Producer"]].map(([key, label]) => (
                  <Field key={key} label={label}>
                    <input
                      style={inputStyle}
                      value={(layout.metadata && layout.metadata[key]) || ""}
                      placeholder={key === "creator" ? "e.g. wkhtmltopdf 0.12.6.1" : ""}
                      onChange={(e) => commit((prev) => ({ ...prev, metadata: { ...(prev.metadata || {}), [key]: e.target.value } }), false)}
                    />
                  </Field>
                ))}
              </>
            ) : (
              <>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <span className="admin-badge admin-badge-blue" style={{ textTransform: "capitalize" }}>{selected.type}</span>
                  <div style={{ display: "flex", gap: 2 }}>
                    <button className="admin-action-btn" title="Bring forward" onClick={() => reorderSelected(1)}><ChevronUp size={14} /></button>
                    <button className="admin-action-btn" title="Send backward" onClick={() => reorderSelected(-1)}><ChevronDown size={14} /></button>
                    <button className="admin-action-btn" title="Duplicate" onClick={duplicateSelected}><Copy size={14} /></button>
                    <button className="admin-action-btn danger" title="Delete" onClick={deleteSelected}><Trash2 size={14} /></button>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <Field label="X"><NumInput value={selected.x} onChange={(v) => updateEl({ x: v })} /></Field>
                  <Field label="Y"><NumInput value={selected.y} onChange={(v) => updateEl({ y: v })} /></Field>
                  <Field label="Width"><NumInput value={selected.w} onChange={(v) => updateEl({ w: v })} /></Field>
                  {(selected.type === "rect" || selected.type === "image" || selected.type === "line") && (
                    <Field label="Height"><NumInput value={selected.h} onChange={(v) => updateEl({ h: v })} /></Field>
                  )}
                  <Field label="Page"><NumInput value={selected.page || 1} min={1} max={9} onChange={(v) => updateEl({ page: Math.max(1, Math.round(v)) })} /></Field>
                </div>

                <Field label="Show when">
                  <select
                    style={{ ...inputStyle, marginBottom: 4 }}
                    value={showIfPresets.some(([v]) => v === (selected.showIf || "")) ? (selected.showIf || "") : "__custom"}
                    onChange={(e) => { if (e.target.value !== "__custom") updateEl({ showIf: e.target.value || undefined }); }}
                  >
                    {showIfPresets.map(([v, label]) => <option key={v} value={v}>{label}</option>)}
                    <option value="__custom">Custom condition…</option>
                  </select>
                  <input
                    style={inputStyle}
                    placeholder='e.g. payType=salary or !hasLogo'
                    value={selected.showIf || ""}
                    onChange={(e) => updateEl({ showIf: e.target.value || undefined })}
                  />
                </Field>

                {selected.type === "text" && (
                  <>
                    <Field label="Content">
                      <textarea rows={3} style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }} value={selected.content || ""}
                        onChange={(e) => updateEl({ content: e.target.value })} />
                    </Field>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      <Field label="Font size"><NumInput value={selected.fontSize} min={5} max={64} onChange={(v) => updateEl({ fontSize: v })} /></Field>
                      <Field label="Align">
                        <select style={inputStyle} value={selected.align || "left"} onChange={(e) => updateEl({ align: e.target.value })}>
                          <option value="left">Left</option><option value="center">Center</option><option value="right">Right</option>
                        </select>
                      </Field>
                    </div>
                    <Field label="Color"><ColorInput value={selected.color} onChange={(v) => updateEl({ color: v })} /></Field>
                    <div style={{ display: "flex", gap: 14, marginBottom: 10 }}>
                      <label style={{ fontSize: "0.78rem", color: "var(--admin-text)", display: "flex", gap: 6, alignItems: "center" }}>
                        <input type="checkbox" checked={!!selected.bold} onChange={(e) => updateEl({ bold: e.target.checked })} />Bold
                      </label>
                      <label style={{ fontSize: "0.78rem", color: "var(--admin-text)", display: "flex", gap: 6, alignItems: "center" }}>
                        <input type="checkbox" checked={!!selected.italic} onChange={(e) => updateEl({ italic: e.target.checked })} />Italic
                      </label>
                      <label style={{ fontSize: "0.78rem", color: "var(--admin-text)", display: "flex", gap: 6, alignItems: "center" }}>
                        <input type="checkbox" checked={!!selected.wrap} onChange={(e) => updateEl({ wrap: e.target.checked })} />Wrap
                      </label>
                    </div>
                  </>
                )}

                {selected.type === "rect" && (
                  <>
                    <Field label="Fill"><ColorInput value={selected.fill} allowNone onChange={(v) => updateEl({ fill: v })} /></Field>
                    <Field label="Border"><ColorInput value={selected.stroke} allowNone onChange={(v) => updateEl({ stroke: v })} /></Field>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      <Field label="Border width"><NumInput value={selected.lineWidth} step={0.25} min={0} onChange={(v) => updateEl({ lineWidth: v })} /></Field>
                      <Field label="Corner radius"><NumInput value={selected.radius} min={0} onChange={(v) => updateEl({ radius: v })} /></Field>
                    </div>
                  </>
                )}

                {selected.type === "line" && (
                  <>
                    <Field label="Color"><ColorInput value={selected.color} onChange={(v) => updateEl({ color: v })} /></Field>
                    <Field label="Thickness"><NumInput value={selected.lineWidth} step={0.25} min={0.25} onChange={(v) => updateEl({ lineWidth: v })} /></Field>
                  </>
                )}

                {selected.type === "image" && (
                  <Field label="Source (token or data URL)">
                    <input style={inputStyle} value={selected.src || ""} onChange={(e) => updateEl({ src: e.target.value })} />
                  </Field>
                )}

                {selected.type === "table" && (
                  <>
                    <Field label="Rows from">
                      <select style={inputStyle} value={selected.binding} onChange={(e) => updateEl({ binding: e.target.value })}>
                        {tableBindings.map((b) => <option key={b.binding} value={b.binding}>{b.label}</option>)}
                      </select>
                    </Field>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      <Field label="Row height"><NumInput value={selected.rowHeight} min={10} onChange={(v) => updateEl({ rowHeight: v })} /></Field>
                      <Field label="Font size"><NumInput value={selected.fontSize} min={5} max={20} onChange={(v) => updateEl({ fontSize: v })} /></Field>
                    </div>
                    <Field label="Header fill"><ColorInput value={selected.headerFill} allowNone onChange={(v) => updateEl({ headerFill: v })} /></Field>
                    <div style={{ display: "flex", gap: 14, marginBottom: 10 }}>
                      <label style={{ fontSize: "0.78rem", color: "var(--admin-text)", display: "flex", gap: 6, alignItems: "center" }}>
                        <input type="checkbox" checked={!!selected.zebra} onChange={(e) => updateEl({ zebra: e.target.checked })} />Zebra rows
                      </label>
                      <label style={{ fontSize: "0.78rem", color: "var(--admin-text)", display: "flex", gap: 6, alignItems: "center" }}>
                        <input type="checkbox" checked={selected.rowLines !== false} onChange={(e) => updateEl({ rowLines: e.target.checked })} />Row lines
                      </label>
                      <label style={{ fontSize: "0.78rem", color: "var(--admin-text)", display: "flex", gap: 6, alignItems: "center" }}>
                        <input type="checkbox" checked={!!selected.colLines} onChange={(e) => updateEl({ colLines: e.target.checked })} />Column lines
                      </label>
                    </div>
                    <p style={{ fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--admin-text-muted)", margin: "12px 0 6px" }}>
                      Columns <span style={{ fontWeight: 400, textTransform: "none" }}>(row tokens: {(tableBindings.find((b) => b.binding === selected.binding)?.rowTokens || []).join(" ")})</span>
                    </p>
                    {(selected.columns || []).map((col, ci) => (
                      <div key={ci} style={{ border: "1px solid var(--ion-border-color)", borderRadius: 6, padding: 8, marginBottom: 8 }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 6 }}>
                          <input style={inputStyle} value={col.header} placeholder="Header"
                            onChange={(e) => updateEl({ columns: selected.columns.map((c, i) => (i === ci ? { ...c, header: e.target.value } : c)) })} />
                          <input style={inputStyle} value={col.token} placeholder="{token}"
                            onChange={(e) => updateEl({ columns: selected.columns.map((c, i) => (i === ci ? { ...c, token: e.target.value } : c)) })} />
                        </div>
                        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                          <input type="number" style={{ ...inputStyle, width: 70 }} value={Math.round((col.width || 0) * 100)} min={5} max={95} title="Width %"
                            onChange={(e) => updateEl({ columns: selected.columns.map((c, i) => (i === ci ? { ...c, width: Number(e.target.value) / 100 } : c)) })} />
                          <span style={{ fontSize: "0.72rem", color: "var(--admin-text-muted)" }}>%</span>
                          <select style={{ ...inputStyle, flex: 1 }} value={col.align || "left"}
                            onChange={(e) => updateEl({ columns: selected.columns.map((c, i) => (i === ci ? { ...c, align: e.target.value } : c)) })}>
                            <option value="left">Left</option><option value="center">Center</option><option value="right">Right</option>
                          </select>
                          <button className="admin-action-btn danger" title="Remove column"
                            onClick={() => updateEl({ columns: selected.columns.filter((_, i) => i !== ci) })}>
                            <X size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                    <button
                      onClick={() => updateEl({ columns: [...(selected.columns || []), { header: "Column", token: "{name}", width: 0.2, align: "left" }] })}
                      style={{ width: "100%", padding: "6px 0", borderRadius: 6, border: "1px dashed var(--ion-border-color)", background: "transparent", color: "var(--admin-text-muted)", fontSize: "0.78rem", cursor: "pointer" }}>
                      + Add column
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* PDF preview overlay */}
      {previewUrl && (
        <div onClick={() => setPreviewUrl(null)}
          style={{ position: "fixed", inset: 0, zIndex: 3000, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "var(--ion-card-background)", borderRadius: 8, width: "min(760px, 95vw)", height: "90vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", borderBottom: "1px solid var(--ion-border-color)" }}>
              <span style={{ fontWeight: 700, color: "var(--admin-text)" }}>PDF Preview — sample data</span>
              <button className="admin-action-btn" onClick={() => setPreviewUrl(null)}><X size={16} /></button>
            </div>
            <iframe title="Template preview" src={previewUrl} style={{ flex: 1, border: "none", width: "100%" }} />
          </div>
        </div>
      )}

      {/* AI design assistant panel */}
      {aiOpen && (
        <div style={{
          position: "fixed", right: 24, bottom: 24, width: 390, height: 540, zIndex: 2500,
          display: "flex", flexDirection: "column", overflow: "hidden",
          background: "var(--ion-card-background)", borderRadius: 14,
          border: "1px solid var(--ion-border-color)", boxShadow: "0 14px 44px rgba(0,0,0,0.30)",
        }}>
          {/* header */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", background: "linear-gradient(135deg,#22c55e,#15803d)", flexShrink: 0 }}>
            <Sparkles size={18} style={{ color: "#fff", flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: "#fff", fontWeight: 700, fontSize: "0.9rem", lineHeight: 1.2 }}>AI Design Assistant</div>
              <div style={{ color: "rgba(255,255,255,0.8)", fontSize: "0.7rem" }}>Designs straight onto the canvas</div>
            </div>
            <button onClick={() => setAiOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, lineHeight: 0 }}>
              <X size={18} style={{ color: "rgba(255,255,255,0.85)" }} />
            </button>
          </div>

          {/* messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "12px 12px 4px", display: "flex", flexDirection: "column", gap: 8 }}>
            {aiMessages.length === 0 && (
              <div style={{ background: "var(--ion-color-step-50, rgba(0,0,0,0.04))", borderRadius: "4px 12px 12px 12px", padding: "10px 12px", fontSize: "0.82rem", lineHeight: 1.55, color: "var(--admin-text)", whiteSpace: "pre-wrap" }}>
                Tell me what to design and I'll build it on the canvas. Try:
                {"\n"}• "Create a clean, modern pay stub with a navy header"
                {"\n"}• "Add a YTD summary table at the bottom"
                {"\n"}• "Make all section headings dark green and add zebra striping to the tables"
                {"\n\n"}Every change applies instantly — Undo reverts it, and nothing is permanent until you Save.
              </div>
            )}
            {aiMessages.map((m, i) => (
              <div key={i} style={{
                alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                maxWidth: "85%",
                background: m.role === "user" ? "#16a34a" : "var(--ion-color-step-50, rgba(0,0,0,0.04))",
                color: m.role === "user" ? "#fff" : "var(--admin-text)",
                borderRadius: m.role === "user" ? "12px 12px 4px 12px" : "4px 12px 12px 12px",
                padding: "8px 12px", fontSize: "0.82rem", lineHeight: 1.55,
                whiteSpace: "pre-wrap", wordBreak: "break-word",
              }}>
                {m.content}
              </div>
            ))}
            {aiBusy && (
              <div style={{ alignSelf: "flex-start", display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "var(--ion-color-step-50, rgba(0,0,0,0.04))", borderRadius: "4px 12px 12px 12px" }}>
                <IonSpinner name="dots" style={{ width: 26, height: 16, color: "var(--ion-color-primary)" }} />
                <span style={{ fontSize: "0.78rem", color: "var(--admin-text-muted)" }}>Designing…</span>
              </div>
            )}
            <div ref={aiEndRef} />
          </div>

          {/* composer */}
          <div style={{ display: "flex", alignItems: "flex-end", gap: 6, padding: "8px 10px 10px", borderTop: "1px solid var(--ion-border-color)", flexShrink: 0 }}>
            <textarea
              rows={2}
              value={aiInput}
              onChange={(e) => setAiInput(e.target.value)}
              onKeyDown={onAiKey}
              placeholder='e.g. "Design a minimalist pay stub with a charcoal header"'
              style={{ ...inputStyle, flex: 1, resize: "none", fontFamily: "inherit", lineHeight: 1.45 }}
            />
            <IonButton size="small" onClick={sendAi} disabled={aiBusy || !aiInput.trim()}
              style={{ "--background": "#16a34a", "--background-activated": "#15803d", "--color": "#fff", "--border-radius": "8px", margin: 0 }}>
              <Send size={14} />
            </IonButton>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

import { useEffect, useRef } from "react";
import { IonRange, createGesture } from "@ionic/react";
import { Haptics, ImpactStyle } from "@capacitor/haptics";

// Shared multi-page preview: pages sit side by side in a sliding track,
// driven by the brand-color snapped range slider AND by swiping the preview
// itself (Ionic gesture, horizontal only) — both stay in sync because they
// share the same page index. Single-page documents render without the slider.
export default function PreviewPager({ pages, index, onIndexChange, altPrefix = "Preview" }) {
  const swipeRef = useRef(null);
  // The gesture callback lives for the component's life; read fresh values
  // through a ref so swipes always see the current page and count.
  const stateRef = useRef({});
  stateRef.current = { index: Math.min(index, Math.max(0, pages.length - 1)), count: pages.length, onIndexChange };

  useEffect(() => {
    const el = swipeRef.current;
    if (!el) return;
    const gesture = createGesture({
      el,
      gestureName: "preview-swipe",
      direction: "x",
      threshold: 15,
      onEnd: (detail) => {
        const { index: cur, count, onIndexChange: change } = stateRef.current;
        if (count < 2 || Math.abs(detail.deltaX) < 40) return;
        const next = detail.deltaX < 0 ? Math.min(count - 1, cur + 1) : Math.max(0, cur - 1);
        if (next !== cur) {
          Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
          change(next);
        }
      },
    });
    gesture.enable();
    return () => gesture.destroy();
  }, []);

  const idx = Math.min(index, Math.max(0, pages.length - 1));

  return (
    <>
      <div ref={swipeRef} style={{ borderRadius: 8, overflow: "hidden", border: "1px solid var(--ion-color-light-shade)", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", touchAction: pages.length > 1 ? "pan-y" : undefined }}>
        {/* All pages sit side by side; the track slides with the range */}
        <div className="msh-preview-track" style={{ display: "flex", transform: `translateX(-${idx * 100}%)` }}>
          {pages.map((src, i) => (
            <img key={i} src={src} alt={`${altPrefix} ${i + 1}`} draggable={false}
              style={{ width: "100%", flexShrink: 0, display: "block" }} />
          ))}
        </div>
      </div>
      {pages.length > 1 && (
        <div style={{ display: "flex", flexDirection: "column", marginTop: 8, padding: "0 16px" }}>
          <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--ion-color-medium)", textAlign: "center", whiteSpace: "nowrap" }}>
            Page {idx + 1} of {pages.length}
          </span>
          <IonRange
            color="primary"
            min={1}
            max={pages.length}
            step={1}
            snaps={true}
            ticks={true}
            pin={true}
            pinFormatter={(v) => `${v}`}
            value={idx + 1}
            onIonKnobMoveStart={() => Haptics.selectionStart().catch(() => {})}
            onIonKnobMoveEnd={() => Haptics.selectionEnd().catch(() => {})}
            onIonInput={(e) => {
              const next = Number(e.detail.value) - 1;
              if (next !== idx) Haptics.selectionChanged().catch(() => {});
              onIndexChange(next);
            }}
            style={{ width: "100%", paddingTop: 4, paddingBottom: 4 }}
          />
        </div>
      )}
    </>
  );
}

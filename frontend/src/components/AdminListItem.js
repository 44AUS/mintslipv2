import { IonItem, IonLabel } from "@ionic/react";

// Condensed admin "row" as a genuine Ionic IonItem — the whodat admin mobile
// pattern. Being a real Ionic button it gets the native ripple and correct
// per-row taps (no custom absolutely-positioned overlay, which iOS Safari
// mis-anchors on table rows), and the content wraps into stacked lines on
// narrow screens instead of overflowing sideways.
//
// Props:
//   onClick  – row tap (usually opens the detail modal); makes it `button`
//   start    – leading node (avatar/initials circle)
//   title    – main line (node)
//   badges   – inline nodes shown right after the title
//   subtitle – secondary muted line (node)
//   meta     – smaller muted line summarising the table columns (node)
//   status   – badge cluster on the row's end; wraps below the text when tight
export default function AdminListItem({ onClick, start, title, badges, subtitle, meta, status }) {
  return (
    <IonItem className="adm-item" button={!!onClick} detail={false} onClick={onClick}>
      {start && <div slot="start" style={{ marginInlineEnd: 12, display: "flex", alignItems: "center" }}>{start}</div>}
      <IonLabel className="adm-label">
        <div className="adm-row">
          <div className="adm-main">
            <h2 className="adm-title">{title}{badges}</h2>
            {subtitle && <p className="adm-sub">{subtitle}</p>}
            {meta && <p className="adm-meta">{meta}</p>}
          </div>
          {status && <div className="adm-end"><div className="adm-status">{status}</div></div>}
        </div>
      </IonLabel>
    </IonItem>
  );
}

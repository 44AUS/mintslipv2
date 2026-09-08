import { useEffect, useState } from "react";
import { IonInput, IonPopover, IonDatetime } from "@ionic/react";

// Date fields for /app and the admin dashboard: a read-only input that opens
// an IonDatetime calendar in a popover anchored to the click. Values stay in
// the same YYYY-MM-DD strings the previous native date inputs produced.
//
// The popover mounts fresh per open (the codebase-wide overlay pattern —
// long-lived controlled overlays desync under polling re-renders).
function FreshPopover({ open, event, onClose, children, ...rest }) {
  const [render, setRender] = useState(open);
  useEffect(() => { if (open) setRender(true); }, [open]);
  if (!render) return null;
  return (
    <IonPopover
      isOpen={open}
      event={event}
      onDidDismiss={() => { onClose?.(); setRender(false); }}
      {...rest}
    >
      {children}
    </IonPopover>
  );
}

function formatDisplay(value) {
  if (!value) return "";
  const [y, m, d] = String(value).split("-").map(Number);
  if (!y || !m || !d) return String(value);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function DatePopover({ menu, onClose, value, onSelect }) {
  return (
    <FreshPopover
      open={menu.open}
      event={menu.event}
      onClose={onClose}
      side="bottom"
      alignment="start"
      style={{ "--width": "auto" }}
    >
      <IonDatetime
        presentation="date"
        value={/^\d{4}-\d{2}-\d{2}/.test(String(value || "")) ? value : undefined}
        onIonChange={(e) => {
          const v = e.detail.value;
          if (typeof v === "string" && v) onSelect(v.split("T")[0]);
          onClose();
        }}
      />
    </FreshPopover>
  );
}

// /app flavor: outline + floating label, like every other form input there.
export function IonDateInput({ label, value, onChange, style, placeholder }) {
  const [menu, setMenu] = useState({ open: false, event: undefined });
  const close = () => setMenu({ open: false, event: undefined });
  return (
    <>
      <IonInput
        fill="outline"
        labelPlacement="floating"
        label={label}
        readonly
        value={formatDisplay(value)}
        placeholder={placeholder}
        onClick={(e) => setMenu({ open: true, event: e.nativeEvent })}
        style={{ cursor: "pointer", ...style }}
      />
      <DatePopover menu={menu} onClose={close} value={value} onSelect={onChange} />
    </>
  );
}

// Admin flavor: the plain .admin-input text box the dashboard forms use.
export function AdminDateInput({ value, onChange, style, placeholder = "Select date…" }) {
  const [menu, setMenu] = useState({ open: false, event: undefined });
  const close = () => setMenu({ open: false, event: undefined });
  return (
    <>
      <input
        className="admin-input"
        readOnly
        value={formatDisplay(value)}
        placeholder={placeholder}
        onClick={(e) => setMenu({ open: true, event: e.nativeEvent })}
        style={{ cursor: "pointer", ...style }}
      />
      <DatePopover menu={menu} onClose={close} value={value} onSelect={onChange} />
    </>
  );
}

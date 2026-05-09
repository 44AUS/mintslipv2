import { useState, useEffect, useRef } from "react";
import {
  IonModal, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButtons, IonButton, IonIcon, IonSelect, IonSelectOption,
  IonInput, IonTextarea, IonDatetime,
} from "@ionic/react";
import { closeOutline, checkmarkOutline, calendarOutline } from "ionicons/icons";

const EQUIPMENT_CLASSES = [
  "Conestoga", "Containers", "Decks Specialized", "Decks Standard",
  "DryBulk", "Flatbeds", "Hazardous Materials", "Other Equipment",
  "Reefers", "Tankers", "Vans Specialized", "Vans Standard",
];

const EQUIPMENT_TYPES = {
  "Conestoga":           ["Standard Conestoga", "Mega Conestoga"],
  "Containers":          ["20ft ISO", "40ft ISO", "45ft ISO", "53ft ISO"],
  "Decks Specialized":   ["RGN (Removable Gooseneck)", "Lowboy", "Stretch RGN", "Double Drop"],
  "Decks Standard":      ["Step Deck", "Flatbed Step Deck"],
  "DryBulk":             ["Pneumatic Tanker", "Hopper Bottom", "Walking Floor"],
  "Flatbeds":            ["Standard Flatbed", "Beam Truck", "Maxi Flatbed"],
  "Hazardous Materials": ["Hazmat Van", "Hazmat Tanker", "Explosive Carrier"],
  "Other Equipment":     ["Auto Carrier", "Livestock", "Boat Hauler"],
  "Reefers":             ["Standard Reefer", "Multi-Temp Reefer", "Straight Truck Reefer"],
  "Tankers":             ["Liquid Tanker", "Gas Tanker", "Chemical Tanker"],
  "Vans Specialized":    ["Box Truck", "Curtainside", "Double Deck", "Roller Bed"],
  "Vans Standard":       ["Dry Van", "Air Ride Van", "Team Van"],
};

const inputStyle = { "--highlight-color-focused": "var(--ion-color-success)" };

const cardStyle = {
  backgroundColor: "var(--ion-card-background)",
  borderRadius: 8,
  boxShadow: "rgba(0,0,0,0.18) 0px 4px 24px",
  padding: 16,
  display: "flex",
  flexDirection: "column",
  gap: 16,
};

const sectionHeadingStyle = {
  fontWeight: 700,
  fontSize: "0.95rem",
  color: "var(--ion-text-color)",
};

function CityInput({ label, required, placeholder, value, onChange }) {
  const inputRef = useRef(null);
  const acRef = useRef(null);

  useEffect(() => {
    const tryInit = () => {
      if (!window.google?.maps?.places || !inputRef.current || acRef.current) return false;
      const ac = new window.google.maps.places.Autocomplete(inputRef.current, {
        types: ["(cities)"],
        fields: ["formatted_address"],
      });
      ac.addListener("place_changed", () => {
        const place = ac.getPlace();
        if (place.formatted_address) onChange(place.formatted_address);
      });
      acRef.current = ac;
      return true;
    };
    if (!tryInit()) {
      const id = setInterval(() => { if (tryInit()) clearInterval(id); }, 200);
      return () => clearInterval(id);
    }
  }, []); // eslint-disable-line

  return (
    <div className="eq-address-wrapper">
      <span style={{ fontSize: "0.75rem", color: "var(--ion-color-medium)", fontWeight: 500, display: "block", marginBottom: 6 }}>
        {label}{required ? " *" : ""}
      </span>
      <div>
        <input
          ref={inputRef}
          placeholder={placeholder}
          autoComplete="off"
          value={value}
          onChange={e => onChange(e.target.value)}
          style={{
            width: "100%",
            boxSizing: "border-box",
            backgroundColor: "var(--ion-input-background, rgba(0,0,0,0.04))",
            border: "1px solid var(--ion-border-color)",
            borderRadius: 6,
            color: "var(--ion-text-color)",
            fontSize: "0.875rem",
            padding: "9px 12px",
            outline: "none",
            fontFamily: "inherit",
          }}
          className="pac-target-input"
        />
      </div>
    </div>
  );
}

function DateTrigger({ label, required, value, onClick }) {
  const displayVal = value
    ? new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : null;

  return (
    <div
      onClick={onClick}
      style={{ cursor: "pointer", border: "1px solid var(--ion-border-color)", borderRadius: 4, padding: "10px 16px" }}
    >
      <span style={{ fontSize: "0.75rem", color: "var(--ion-color-medium)", fontWeight: 500, display: "block", marginBottom: 4 }}>
        {label}{required ? " *" : ""}
      </span>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: "1rem", color: displayVal ? "var(--ion-text-color)" : "var(--ion-color-medium)" }}>
          {displayVal || "Tap to select…"}
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", lineHeight: 0, flexShrink: 0, fontSize: 18, color: "var(--ion-color-medium)" }}>
          <IonIcon icon={calendarOutline} style={{ fontSize: "inherit", color: "inherit", pointerEvents: "none" }} />
        </span>
      </div>
    </div>
  );
}

export default function PostTruckModal({ isOpen, onDismiss, onSubmit }) {
  const [equipClass,    setEquipClass]    = useState("");
  const [equipType,     setEquipType]     = useState("");
  const [trailerLen,    setTrailerLen]    = useState("");
  const [weightCap,     setWeightCap]     = useState("");
  const [location,      setLocation]      = useState("");
  const [origin,        setOrigin]        = useState("");
  const [destination,   setDestination]   = useState("");
  const [availFrom,     setAvailFrom]     = useState("");
  const [availTo,       setAvailTo]       = useState("");
  const [rate,          setRate]          = useState("");
  const [notes,         setNotes]         = useState("");
  const [dateTarget,    setDateTarget]    = useState(null);
  const [dateModalOpen, setDateModalOpen] = useState(false);
  const [tempDate,      setTempDate]      = useState("");

  const canSubmit = !!(equipClass && location && availFrom && availTo);

  const openDatePicker = (target) => {
    setDateTarget(target);
    const existing = target === "from" ? availFrom : availTo;
    setTempDate(existing || new Date().toISOString().split("T")[0]);
    setDateModalOpen(true);
  };

  const confirmDate = () => {
    const dateStr = Array.isArray(tempDate) ? tempDate[0] : tempDate;
    if (dateTarget === "from") setAvailFrom(dateStr);
    else setAvailTo(dateStr);
    setDateModalOpen(false);
  };

  const resetForm = () => {
    setEquipClass(""); setEquipType(""); setTrailerLen(""); setWeightCap("");
    setLocation(""); setOrigin(""); setDestination("");
    setAvailFrom(""); setAvailTo(""); setRate(""); setNotes("");
  };

  const handleClose = () => { resetForm(); onDismiss(); };

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit?.({ equipClass, equipType, trailerLen, weightCap, location, origin, destination, availFrom, availTo, rate, notes });
    resetForm();
    onDismiss();
  };

  return (
    <>
      <IonModal isOpen={isOpen} onDidDismiss={handleClose} className="equipment-post-modal">
        <IonHeader>
          <IonToolbar style={{ "--background": "var(--ion-card-background)", "--color": "var(--ion-text-color)" }}>
            <IonButtons slot="start">
              <IonButton fill="clear" shape="round" onClick={handleClose}>
                <span slot="icon-only" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", lineHeight: 0, flexShrink: 0, fontSize: "1rem", color: "var(--ion-text-color)" }}>
                  <IonIcon icon={closeOutline} style={{ fontSize: "inherit", color: "inherit", pointerEvents: "none" }} />
                </span>
              </IonButton>
            </IonButtons>
            <IonTitle style={{ fontWeight: 700 }}>Post a Truck</IonTitle>
            <IonButtons slot="end">
              <IonButton fill="clear" shape="round" onClick={handleSubmit} style={{ opacity: canSubmit ? 1 : 0.4 }}>
                <span slot="icon-only" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", lineHeight: 0, flexShrink: 0, fontSize: "1rem", color: "var(--ion-color-success)" }}>
                  <IonIcon icon={checkmarkOutline} style={{ fontSize: "inherit", color: "inherit", pointerEvents: "none" }} />
                </span>
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>

        <IonContent>
          <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: 16 }}>

            {/* ── Truck Info ── */}
            <div style={cardStyle}>
              <span style={sectionHeadingStyle}>Truck Info</span>
              <IonSelect
                label="Equipment Class *"
                labelPlacement="stacked"
                fill="outline"
                placeholder="Select class"
                value={equipClass}
                onIonChange={e => { setEquipClass(e.detail.value); setEquipType(""); }}
                style={inputStyle}
              >
                {EQUIPMENT_CLASSES.map(c => (
                  <IonSelectOption key={c} value={c}>{c}</IonSelectOption>
                ))}
              </IonSelect>

              <div style={{ opacity: equipClass ? 1 : 0.4, pointerEvents: equipClass ? "auto" : "none" }}>
                <IonSelect
                  label="Equipment Type *"
                  labelPlacement="stacked"
                  fill="outline"
                  placeholder={equipClass ? "Select type" : "Select a class first"}
                  value={equipType}
                  onIonChange={e => setEquipType(e.detail.value)}
                  disabled={!equipClass}
                  style={inputStyle}
                >
                  {(EQUIPMENT_TYPES[equipClass] || []).map(t => (
                    <IonSelectOption key={t} value={t}>{t}</IonSelectOption>
                  ))}
                </IonSelect>
              </div>

              <IonInput
                label="Trailer Length (ft)"
                labelPlacement="stacked"
                fill="outline"
                type="number"
                min={0}
                placeholder="e.g. 53"
                value={trailerLen}
                onIonInput={e => setTrailerLen(e.detail.value)}
                style={inputStyle}
              />

              <IonInput
                label="Weight Capacity (lbs)"
                labelPlacement="stacked"
                fill="outline"
                type="number"
                min={0}
                placeholder="e.g. 45000"
                value={weightCap}
                onIonInput={e => setWeightCap(e.detail.value)}
                style={inputStyle}
              />
            </div>

            {/* ── Location ── */}
            <div style={cardStyle}>
              <span style={sectionHeadingStyle}>Location</span>
              <CityInput label="Current Location" required placeholder="e.g. Dallas, TX" value={location} onChange={setLocation} />
              <CityInput label="Preferred Origin" placeholder="e.g. Chicago, IL" value={origin} onChange={setOrigin} />
              <CityInput label="Preferred Destination" placeholder="e.g. Atlanta, GA" value={destination} onChange={setDestination} />
            </div>

            {/* ── Schedule ── */}
            <div style={cardStyle}>
              <span style={sectionHeadingStyle}>Schedule</span>
              <DateTrigger label="Available From" required value={availFrom} onClick={() => openDatePicker("from")} />
              <DateTrigger label="Available To"   required value={availTo}   onClick={() => openDatePicker("to")} />
            </div>

            {/* ── Details ── */}
            <div style={cardStyle}>
              <span style={sectionHeadingStyle}>Details</span>
              <IonInput
                label="Rate Expectation ($/mile)"
                labelPlacement="stacked"
                fill="outline"
                type="number"
                min={0}
                step={0.01}
                placeholder="Optional — leave blank if negotiable"
                helperText="Leave blank to show as negotiable to brokers"
                value={rate}
                onIonInput={e => setRate(e.detail.value)}
                style={inputStyle}
              />
              <IonTextarea
                label="Notes"
                labelPlacement="stacked"
                fill="outline"
                autoGrow
                placeholder="Any additional details…"
                value={notes}
                onIonInput={e => setNotes(e.detail.value)}
                rows={3}
                style={inputStyle}
              />
            </div>

          </div>
        </IonContent>
      </IonModal>

      {/* ── Date picker bottom sheet ── */}
      <IonModal
        isOpen={dateModalOpen}
        onDidDismiss={() => setDateModalOpen(false)}
        initialBreakpoint={0.6}
        breakpoints={[0, 0.6, 1]}
      >
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonButton fill="clear" onClick={() => setDateModalOpen(false)}>Cancel</IonButton>
            </IonButtons>
            <IonTitle>{dateTarget === "from" ? "Available From" : "Available To"}</IonTitle>
            <IonButtons slot="end">
              <IonButton fill="clear" color="success" strong onClick={confirmDate}>Done</IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <IonDatetime
            presentation="date"
            value={tempDate}
            onIonChange={e => setTempDate(e.detail.value)}
            preferWheel={false}
            style={{ margin: "0 auto", display: "block" }}
          />
        </IonContent>
      </IonModal>
    </>
  );
}

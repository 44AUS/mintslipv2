import { useState } from "react";
import {
  IonInput, IonSelect, IonSelectOption, IonButton, IonIcon, IonSpinner,
  IonSegment, IonSegmentButton, IonLabel,
} from "@ionic/react";
import { sparklesOutline } from "ionicons/icons";
import { nativePost } from "@/utils/nativeHttp";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";

// Same data the web bank-statement form uses for its AI generator
const US_STATES = {
  "AL": "Alabama", "AK": "Alaska", "AZ": "Arizona", "AR": "Arkansas", "CA": "California",
  "CO": "Colorado", "CT": "Connecticut", "DE": "Delaware", "FL": "Florida", "GA": "Georgia",
  "HI": "Hawaii", "ID": "Idaho", "IL": "Illinois", "IN": "Indiana", "IA": "Iowa",
  "KS": "Kansas", "KY": "Kentucky", "LA": "Louisiana", "ME": "Maine", "MD": "Maryland",
  "MA": "Massachusetts", "MI": "Michigan", "MN": "Minnesota", "MS": "Mississippi", "MO": "Missouri",
  "MT": "Montana", "NE": "Nebraska", "NV": "Nevada", "NH": "New Hampshire", "NJ": "New Jersey",
  "NM": "New Mexico", "NY": "New York", "NC": "North Carolina", "ND": "North Dakota", "OH": "Ohio",
  "OK": "Oklahoma", "OR": "Oregon", "PA": "Pennsylvania", "RI": "Rhode Island", "SC": "South Carolina",
  "SD": "South Dakota", "TN": "Tennessee", "TX": "Texas", "UT": "Utah", "VT": "Vermont",
  "VA": "Virginia", "WA": "Washington", "WV": "West Virginia", "WI": "Wisconsin", "WY": "Wyoming",
  "DC": "District of Columbia",
};

const US_CITIES_BY_STATE = {
  "AL": ["Birmingham", "Montgomery", "Huntsville", "Mobile", "Tuscaloosa"],
  "AK": ["Anchorage", "Fairbanks", "Juneau", "Sitka"],
  "AZ": ["Phoenix", "Tucson", "Mesa", "Chandler", "Scottsdale", "Gilbert", "Glendale", "Tempe"],
  "AR": ["Little Rock", "Fort Smith", "Fayetteville", "Springdale"],
  "CA": ["Los Angeles", "San Francisco", "San Diego", "San Jose", "Sacramento", "Fresno", "Oakland", "Long Beach"],
  "CO": ["Denver", "Colorado Springs", "Aurora", "Fort Collins", "Boulder"],
  "CT": ["Bridgeport", "New Haven", "Hartford", "Stamford"],
  "DE": ["Wilmington", "Dover", "Newark", "Middletown"],
  "FL": ["Miami", "Orlando", "Tampa", "Jacksonville", "Fort Lauderdale", "St Petersburg", "Tallahassee"],
  "GA": ["Atlanta", "Augusta", "Columbus", "Macon", "Savannah", "Athens", "Marietta", "Roswell"],
  "HI": ["Honolulu", "Pearl City", "Hilo", "Kailua"],
  "ID": ["Boise", "Meridian", "Nampa", "Idaho Falls"],
  "IL": ["Chicago", "Aurora", "Naperville", "Joliet", "Rockford", "Springfield"],
  "IN": ["Indianapolis", "Fort Wayne", "Evansville", "South Bend"],
  "IA": ["Des Moines", "Cedar Rapids", "Davenport", "Sioux City"],
  "KS": ["Wichita", "Overland Park", "Kansas City", "Olathe", "Topeka"],
  "KY": ["Louisville", "Lexington", "Bowling Green", "Owensboro"],
  "LA": ["New Orleans", "Baton Rouge", "Shreveport", "Lafayette"],
  "ME": ["Portland", "Lewiston", "Bangor", "Auburn"],
  "MD": ["Baltimore", "Frederick", "Rockville", "Gaithersburg"],
  "MA": ["Boston", "Worcester", "Springfield", "Cambridge"],
  "MI": ["Detroit", "Grand Rapids", "Warren", "Ann Arbor", "Lansing"],
  "MN": ["Minneapolis", "Saint Paul", "Rochester", "Duluth"],
  "MS": ["Jackson", "Gulfport", "Southaven", "Hattiesburg"],
  "MO": ["Kansas City", "Saint Louis", "Springfield", "Columbia"],
  "MT": ["Billings", "Missoula", "Great Falls", "Bozeman"],
  "NE": ["Omaha", "Lincoln", "Bellevue", "Grand Island"],
  "NV": ["Las Vegas", "Henderson", "Reno", "North Las Vegas"],
  "NH": ["Manchester", "Nashua", "Concord", "Dover"],
  "NJ": ["Newark", "Jersey City", "Paterson", "Elizabeth", "Trenton"],
  "NM": ["Albuquerque", "Las Cruces", "Rio Rancho", "Santa Fe"],
  "NY": ["New York", "Buffalo", "Rochester", "Yonkers", "Syracuse", "Albany"],
  "NC": ["Charlotte", "Raleigh", "Greensboro", "Durham", "Fayetteville"],
  "ND": ["Fargo", "Bismarck", "Grand Forks", "Minot"],
  "OH": ["Columbus", "Cleveland", "Cincinnati", "Toledo", "Akron", "Dayton"],
  "OK": ["Oklahoma City", "Tulsa", "Norman", "Broken Arrow"],
  "OR": ["Portland", "Salem", "Eugene", "Gresham", "Hillsboro"],
  "PA": ["Philadelphia", "Pittsburgh", "Allentown", "Reading", "Erie"],
  "RI": ["Providence", "Warwick", "Cranston", "Pawtucket"],
  "SC": ["Charleston", "Columbia", "North Charleston", "Greenville"],
  "SD": ["Sioux Falls", "Rapid City", "Aberdeen", "Brookings"],
  "TN": ["Nashville", "Memphis", "Knoxville", "Chattanooga", "Murfreesboro"],
  "TX": ["Houston", "San Antonio", "Dallas", "Austin", "Fort Worth", "El Paso", "Arlington", "Plano"],
  "UT": ["Salt Lake City", "West Valley City", "Provo", "West Jordan"],
  "VT": ["Burlington", "South Burlington", "Rutland", "Montpelier"],
  "VA": ["Virginia Beach", "Norfolk", "Chesapeake", "Richmond", "Arlington"],
  "WA": ["Seattle", "Spokane", "Tacoma", "Vancouver", "Bellevue"],
  "WV": ["Charleston", "Huntington", "Morgantown", "Parkersburg"],
  "WI": ["Milwaukee", "Madison", "Green Bay", "Kenosha"],
  "WY": ["Cheyenne", "Casper", "Laramie", "Gillette"],
  "DC": ["Washington"],
};

const TRANSACTION_CATEGORIES = [
  { id: "groceries", label: "🛒 Groceries" },
  { id: "gas_auto", label: "⛽ Gas & Auto" },
  { id: "dining", label: "🍔 Dining" },
  { id: "retail", label: "🛍️ Retail" },
  { id: "utilities", label: "💡 Utilities" },
  { id: "subscriptions", label: "📺 Subscriptions" },
  { id: "atm_withdrawal", label: "🏧 ATM Withdrawal" },
  { id: "fees", label: "💳 Fees" },
  { id: "misc", label: "📦 Misc" },
  { id: "credits_deposit", label: "💰 Direct Deposit" },
  { id: "credits_p2p", label: "📲 P2P Credits" },
  { id: "credits_refunds", label: "↩️ Refunds" },
];

const PAY_FREQUENCIES = [
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Bi-Weekly" },
  { value: "semimonthly", label: "Semi-Monthly" },
  { value: "monthly", label: "Monthly" },
];

const STATE_OPTIONS = Object.entries(US_STATES).sort((a, b) => a[1].localeCompare(b[1]));

// AI transaction generator for the Accounting Mockup modal — same endpoint
// and options as the web form, appending generated rows to the transactions
// list (or replacing a single still-empty starter row).
export default function AiTransactionsGenerator({ formData, setField, showToast }) {
  const [state, setState] = useState("");
  const [cities, setCities] = useState([]);
  const [volume, setVolume] = useState("moderate");
  const [categories, setCategories] = useState(["groceries", "gas_auto", "dining", "retail"]);
  const [employerName, setEmployerName] = useState("");
  const [payFrequency, setPayFrequency] = useState("biweekly");
  const [depositAmount, setDepositAmount] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const generate = async () => {
    if (!state) { showToast("Please select a state"); return; }
    if (cities.length === 0) { showToast("Please select at least one city"); return; }
    if (categories.length === 0) { showToast("Please select at least one category"); return; }
    if (!formData.selectedMonth) { showToast("Please choose the statement month first"); return; }
    setIsGenerating(true);
    try {
      const { ok, data } = await nativePost(`${BACKEND_URL}/api/generate-bank-transactions`, {
        state,
        cities,
        volume,
        categories,
        statementMonth: formData.selectedMonth,
        employerName: employerName || null,
        payFrequency,
        depositAmount: depositAmount ? parseFloat(depositAmount) : null,
        includeLocation: true,
      });
      if (!ok || !data?.success || !data.transactions) throw new Error(data?.detail || "Failed to generate transactions");
      const existing = Array.isArray(formData.transactions) ? formData.transactions : [];
      const onlyEmptyStarter = existing.length === 1 && !existing[0].date && !existing[0].description && !existing[0].amount;
      setField("transactions", onlyEmptyStarter ? data.transactions : [...existing, ...data.transactions]);
      showToast(`Generated ${data.count ?? data.transactions.length} transactions!`, "success");
    } catch (err) {
      showToast(err.message || "Failed to generate transactions");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div style={{ background: "var(--ion-color-step-50)", borderRadius: 8, padding: 12, display: "flex", flexDirection: "column", gap: 10 }}>
      <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--ion-text-color)" }}>AI Transaction Generator</span>
      <span style={{ fontSize: "0.72rem", color: "var(--ion-color-medium)" }}>
        Pick where the spending happens and we'll fill the month with realistic transactions.
      </span>
      <IonSelect fill="outline" labelPlacement="floating" label="State" value={state}
        onIonChange={e => { setState(e.detail.value); setCities([]); }}>
        {STATE_OPTIONS.map(([code, name]) => (
          <IonSelectOption key={code} value={code}>{name}</IonSelectOption>
        ))}
      </IonSelect>
      <IonSelect fill="outline" labelPlacement="floating" label="Cities" multiple={true} value={cities}
        disabled={!state} onIonChange={e => setCities(e.detail.value || [])}>
        {(US_CITIES_BY_STATE[state] || []).map(city => (
          <IonSelectOption key={city} value={city}>{city}</IonSelectOption>
        ))}
      </IonSelect>
      <div>
        <span style={{ fontSize: "0.75rem", color: "var(--ion-color-medium)", marginBottom: 4, display: "block" }}>Transaction volume</span>
        <IonSegment mode="ios" value={volume} style={{ width: "100%" }} onIonChange={e => setVolume(e.detail.value)}>
          <IonSegmentButton value="light"><IonLabel>Light</IonLabel></IonSegmentButton>
          <IonSegmentButton value="moderate"><IonLabel>Moderate</IonLabel></IonSegmentButton>
          <IonSegmentButton value="heavy"><IonLabel>Heavy</IonLabel></IonSegmentButton>
        </IonSegment>
      </div>
      <IonSelect fill="outline" labelPlacement="floating" label="Categories" multiple={true} value={categories}
        onIonChange={e => setCategories(e.detail.value || [])}>
        {TRANSACTION_CATEGORIES.map(cat => (
          <IonSelectOption key={cat.id} value={cat.id}>{cat.label}</IonSelectOption>
        ))}
      </IonSelect>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <IonInput fill="outline" labelPlacement="floating" label="Employer (optional)" value={employerName}
          onIonInput={e => setEmployerName(e.detail.value || "")} />
        <IonInput fill="outline" labelPlacement="floating" label="Deposit amount ($)" type="number" value={depositAmount}
          onIonInput={e => setDepositAmount(e.detail.value || "")} />
      </div>
      <IonSelect fill="outline" labelPlacement="floating" label="Pay frequency" value={payFrequency}
        onIonChange={e => setPayFrequency(e.detail.value)}>
        {PAY_FREQUENCIES.map(f => (
          <IonSelectOption key={f.value} value={f.value}>{f.label}</IonSelectOption>
        ))}
      </IonSelect>
      <IonButton expand="block" color="tertiary" onClick={generate} disabled={isGenerating}>
        {isGenerating
          ? <IonSpinner name="crescent" slot="start" style={{ width: 16, height: 16 }} />
          : <IonIcon icon={sparklesOutline} slot="start" />}
        AI Generate Transactions
      </IonButton>
    </div>
  );
}

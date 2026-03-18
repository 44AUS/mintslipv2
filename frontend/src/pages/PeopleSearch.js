import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  Phone, User, MapPin, FileSearch, Lock, Search,
  Shield, Loader2, ChevronRight, CheckCircle,
} from "lucide-react";
// Note: User kept for TAB_CONFIG icon only
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY",
];

const TAB_CONFIG = {
  phone:   { id: "phone_lookup",   label: "Reverse Phone Lookup", icon: Phone },
  name:    { id: "name_lookup",    label: "Name Lookup",          icon: User },
  address: { id: "address_lookup", label: "Address Lookup",       icon: MapPin },
  carrier: { id: "carrier_lookup", label: "Carrier Lookup",       icon: Shield },
};

const AGE_RANGES = [
  { value: "",      label: "All Ages", min: null, max: null },
  { value: "18-29", label: "18-29",   min: 18,   max: 29   },
  { value: "30-39", label: "30-39",   min: 30,   max: 39   },
  { value: "40-49", label: "40-49",   min: 40,   max: 49   },
  { value: "50-59", label: "50-59",   min: 50,   max: 59   },
  { value: "60-69", label: "60-69",   min: 60,   max: 69   },
  { value: "70-79", label: "70-79",   min: 70,   max: 79   },
  { value: "80+",   label: "80+",     min: 80,   max: null },
];

// ── Result card rows ──────────────────────────────────────────────────────────
function InfoRow({ label, value, blurred }) {
  if (!value || (Array.isArray(value) && value.length === 0)) return null;
  const display = Array.isArray(value) ? value.join(", ") : value;
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 py-2 border-b border-slate-100 last:border-0">
      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide sm:w-40 flex-shrink-0">{label}</span>
      <span className={`text-sm flex-1 ${blurred ? "blur-[4px] select-none text-slate-400" : "text-slate-800"}`}>
        {display}
      </span>
    </div>
  );
}

// Parses DOB string, returns { month, day, year, age }
function parseDob(dob) {
  if (!dob) return null;
  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  let month = "", day = "", year = "";
  // Try YYYY-MM-DD
  const iso = String(dob).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) { year = iso[1]; month = months[parseInt(iso[2]) - 1] || ""; day = iso[3]; }
  // Try MM/DD/YYYY
  const mdy = String(dob).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (mdy) { year = mdy[3]; month = months[parseInt(mdy[1]) - 1] || ""; day = mdy[2]; }
  // Try just a year
  if (!year && /^\d{4}$/.test(String(dob))) { year = String(dob); }
  const age = year ? Math.floor((Date.now() - new Date(`${year}-${month ? (months.indexOf(month)+1).toString().padStart(2,"0") : "01"}-${day || "01"}`)) / (365.25*24*60*60*1000)) : null;
  return { month, day, year, age };
}

// Shows month + year unblurred, blurs the day
function DobRow({ label, value, blurred }) {
  if (!value) return null;
  const parsed = parseDob(value);
  if (!parsed) return <InfoRow label={label} value={value} blurred={blurred} />;
  const { month, day, year, age } = parsed;
  const ageStr = age && age > 0 && age < 130 ? ` (Age ${age})` : "";
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 py-2 border-b border-slate-100 last:border-0">
      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide sm:w-40 flex-shrink-0">{label}</span>
      <span className="text-sm flex-1">
        {blurred && day ? (
          <>
            <span className="text-slate-800">{month} </span>
            <span className="blur-[4px] select-none text-slate-400">{day}</span>
            <span className="text-slate-800">, {year}{ageStr}</span>
          </>
        ) : (
          <span className="text-slate-800">{[month, day, year].filter(Boolean).join(" ")}{ageStr}</span>
        )}
      </span>
    </div>
  );
}

// Shows street number unblurred, rest of address blurred
function AddressRow({ label, value, blurred }) {
  if (!value || (Array.isArray(value) && value.length === 0)) return null;
  const addresses = Array.isArray(value) ? value : [value];
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 py-2 border-b border-slate-100 last:border-0">
      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide sm:w-40 flex-shrink-0">{label}</span>
      <div className="flex-1 space-y-0.5">
        {addresses.map((addr, i) => {
          const match = String(addr).match(/^(\d+)\s(.+)$/);
          return (
            <span key={i} className="text-sm block">
              {blurred && match
                ? <><span className="text-slate-800">{match[1]} </span><span className="blur-[4px] select-none text-slate-400">{match[2]}</span></>
                : <span className={blurred ? "blur-[4px] select-none text-slate-400" : "text-slate-800"}>{addr}</span>
              }
            </span>
          );
        })}
      </div>
    </div>
  );
}

// Shows area code unblurred, blurs last 7 digits
function PhoneRow({ label, value, blurred }) {
  if (!value || (Array.isArray(value) && value.length === 0)) return null;
  const phones = Array.isArray(value) ? value : [value];
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 py-2 border-b border-slate-100 last:border-0">
      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide sm:w-40 flex-shrink-0">{label}</span>
      <div className="flex-1 space-y-0.5">
        {phones.map((ph, i) => {
          const digits = String(ph).replace(/\D/g, "");
          const areaCode = digits.length >= 10 ? `(${digits.slice(0,3)}) ` : "";
          const rest = digits.length >= 10 ? `${digits.slice(3,6)}-${digits.slice(6,10)}` : ph;
          return (
            <span key={i} className="text-sm block">
              {blurred && areaCode
                ? <><span className="text-slate-800">{areaCode}</span><span className="blur-[4px] select-none text-slate-400">{rest}</span></>
                : <span className={blurred ? "blur-[4px] select-none text-slate-400" : "text-slate-800"}>{ph}</span>
              }
            </span>
          );
        })}
      </div>
    </div>
  );
}

function ResultRows({ data, lookupType, blurred }) {
  if (!data) return null;
  const b = blurred;
  if (lookupType === "phone_lookup") return (
    <>
      <InfoRow label="Name"              value={data.name}              blurred={b} />
      <InfoRow label="Carrier"           value={data.carrier}           blurred={false} />
      <InfoRow label="Line Type"         value={data.lineType}          blurred={false} />
      <InfoRow label="Location"          value={data.location}          blurred={false} />
      <InfoRow label="Spam Risk"         value={data.spamRisk}          blurred={false} />
      <InfoRow label="Caller Type"       value={data.callerType}        blurred={false} />
      <AddressRow label="Possible Address" value={data.possibleAddress}   blurred={b} />
      <InfoRow label="Relatives"          value={data.possibleRelatives} blurred={b} />
    </>
  );
  if (lookupType === "name_lookup") return (
    <>
      <InfoRow label="Full Name"    value={data.fullName}          blurred={false} />
      <DobRow  label="Date of Birth" value={data.dateOfBirth}      blurred={b} />
      <InfoRow label="State"        value={data.state}             blurred={false} />
      <AddressRow label="Addresses" value={data.possibleAddresses} blurred={b} />
      <PhoneRow label="Phone Numbers" value={data.possiblePhones}  blurred={b} />
      <InfoRow label="Emails"       value={data.emails}            blurred={b} />
      <InfoRow label="Relatives"    value={data.possibleRelatives} blurred={b} />
    </>
  );
  if (lookupType === "address_lookup") return (
    <>
      <InfoRow label="Address"        value={data.address}          blurred={false} />
      <InfoRow label="Property Owner" value={data.propertyOwner}    blurred={b} />
      <InfoRow label="Residents"      value={data.residents}        blurred={b} />
      <InfoRow label="Est. Value"     value={data.estimatedValue}   blurred={b} />
      <InfoRow label="Property Type"  value={data.propertyType}     blurred={false} />
      <InfoRow label="Year Built"     value={data.yearBuilt}        blurred={false} />
      <InfoRow label="Sq. Feet"       value={data.squareFeet}       blurred={false} />
      <PhoneRow label="Phone Numbers" value={data.associatedPhones} blurred={b} />
    </>
  );
  // carrier_lookup
  return (
    <>
      <InfoRow label="Carrier"     value={data.carrier}     blurred={false} />
      <InfoRow label="Line Type"   value={data.lineType}    blurred={false} />
      <InfoRow label="Region"      value={data.region}      blurred={false} />
      <InfoRow label="Valid"       value={data.valid === false ? "Invalid" : data.valid ? "Valid" : null} blurred={false} />
      <InfoRow label="Name"        value={data.name}        blurred={b} />
      <AddressRow label="Address"  value={data.possibleAddress} blurred={b} />
    </>
  );
}

// ── Email: show first 2 chars + domain, blur middle ──────────────────────────
function EmailPreview({ email }) {
  const str = String(email);
  const atIdx = str.indexOf("@");
  if (atIdx < 2) return <span className="text-sm blur-[4px] select-none text-slate-400">{str}</span>;
  const visible  = str.slice(0, 2);
  const blurPart = str.slice(2, atIdx);
  const domain   = str.slice(atIdx);
  return (
    <span className="text-sm">
      <span className="text-slate-700">{visible}</span>
      <span className="blur-[4px] select-none text-slate-400">{blurPart}</span>
      <span className="text-slate-700">{domain}</span>
    </span>
  );
}

// ── Address: show city/state (no zip) ────────────────────────────────────────
function AddressPreview({ addr }) {
  return <span className="text-sm text-slate-700">{addr}</span>;
}

// ── Relative: show first name, blur last name ─────────────────────────────────
function RelativePreview({ name }) {
  const parts = String(name).trim().split(/\s+/);
  if (parts.length < 2) return <span className="text-sm text-slate-700">{name}</span>;
  const first = parts[0];
  const rest  = parts.slice(1).join(" ");
  return (
    <span className="text-sm">
      <span className="text-slate-700">{first} {rest}</span>
    </span>
  );
}

// Extract "City, ST" from a full address string
function cityState(addr) {
  if (!addr) return "";
  const parts = String(addr).split(",").map(s => s.trim());
  // Find the 2-letter state abbreviation and return "City, ST"
  for (let i = 1; i < parts.length; i++) {
    if (/^[A-Z]{2}\b/.test(parts[i])) {
      return `${parts[i - 1]}, ${parts[i].slice(0, 2)}`;
    }
  }
  // Fallback: strip leading street number
  return String(addr).replace(/^\d+\s+/, "");
}

// ── Carrier lookup result card ────────────────────────────────────────────────
function CarrierResultCard({ entry, query }) {
  const navigate = useNavigate();
  const preview  = entry.preview || {};
  const isValid  = preview.valid !== false;

  const handleClick = () => {
    navigate(`/people-search/result/${entry.searchId}`, {
      state: { preview, lookupType: "carrier_lookup", price: entry.price, query },
    });
  };

  return (
    <div className="bg-white border border-slate-200 hover:border-green-300 hover:shadow-md transition-all duration-200 rounded-xl overflow-hidden">
      <div className="flex items-stretch">

        {/* Valid column */}
        <div className="flex flex-col items-center justify-center px-5 py-5 border-r border-slate-100 min-w-[72px] bg-slate-50/50">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">STATUS</span>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isValid ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
            {isValid ? "Valid" : "Invalid"}
          </span>
        </div>

        {/* Main info */}
        <div className="flex-1 px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-slate-400" />
                <h3 className="text-lg font-bold text-slate-900">{preview.phone || "Unknown Number"}</h3>
              </div>
              {preview.region && <p className="text-sm text-slate-500 mt-0.5">{preview.region}</p>}
            </div>
            <button
              onClick={handleClick}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors whitespace-nowrap flex-shrink-0"
            >
              <Lock className="w-3.5 h-3.5" /> Unlock Report
            </button>
          </div>

          {/* Blurred fields */}
          <div className="mt-3 flex gap-6">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Carrier</span>
              <span className="text-sm font-medium text-slate-800 blur-[5px] select-none">{preview.carrier || "●●●●●"}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Line Type</span>
              <span className="text-sm font-medium text-slate-800 blur-[5px] select-none">{preview.lineType || "●●●●●"}</span>
            </div>
            {preview.countryCode && (
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Country</span>
                <span className="text-sm font-medium text-slate-800">{preview.countryCode}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Single result card — Whitepages-style layout ──────────────────────────────
function ResultCard({ entry, lookupType, query }) {
  const navigate  = useNavigate();
  const preview   = entry.preview || {};

  // Age from DOB
  const dobParsed = parseDob(preview.dateOfBirth);
  const age       = dobParsed?.age && dobParsed.age > 0 && dobParsed.age < 130 ? dobParsed.age : null;

  // Name / title
  const name = preview.fullName || preview.name || preview.address || "Unknown";

  // Location line (city, state)
  const locationLine = (() => {
    const addrs = preview.possibleAddresses || [];
    if (addrs.length) {
      const cs = cityState(addrs[0]);
      if (cs) return cs;
    }
    if (preview.currentAddress) {
      const cs = cityState(preview.currentAddress);
      if (cs) return cs;
    }
    if (preview.possibleAddress) {
      const cs = cityState(preview.possibleAddress);
      if (cs) return cs;
    }
    if (preview.location) return cityState(preview.location) || preview.location;
    if (preview.state) return preview.state;
    return null;
  })();

  // Full addresses (up to 3)
  const addrList = (() => {
    const addrs = [
      ...(preview.possibleAddresses || []),
      ...(preview.currentAddress ? [preview.currentAddress] : []),
      ...(preview.pastAddresses   || []),
      ...(preview.possibleAddress ? [preview.possibleAddress] : []),
    ].filter(Boolean);
    return [...new Set(addrs)].slice(0, 3);
  })();

  // Relatives — show first 2
  const relativesList = (() => {
    const r = preview.possibleRelatives;
    if (!r) return [];
    return (Array.isArray(r) ? r : [r])
      .map(item => typeof item === "string" ? item : item?.name || "")
      .filter(Boolean)
      .slice(0, 2);
  })();

  // Aliases — "May Go By"
  const aliasesList = (() => {
    const a = preview.aliases;
    if (!a) return [];
    return (Array.isArray(a) ? a : [a]).slice(0, 3);
  })();

  // Email — first one, normalize object format
  const emailRaw = (() => {
    const raw = Array.isArray(preview.emails) ? preview.emails[0] : preview.emails || null;
    if (!raw) return null;
    return typeof raw === "string" ? raw : raw?.address || null;
  })();

  const handleClick = () => {
    navigate(`/people-search/result/${entry.searchId}`, {
      state: { preview, lookupType, price: entry.price, query },
    });
  };

  return (
    <div className="bg-white border border-slate-200 hover:border-green-300 hover:shadow-md transition-all duration-200 rounded-xl overflow-hidden">
      <div className="flex items-stretch">

        {/* Age column */}
        <div className="flex flex-col items-center justify-center px-5 py-5 border-r border-slate-100 min-w-[72px] bg-slate-50/50">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">AGE</span>
          <span className="text-3xl font-extrabold text-slate-900 leading-none">{age ?? "–"}</span>
        </div>

        {/* Main info */}
        <div className="flex-1 px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 leading-tight">{name}</h3>
              {locationLine && <p className="text-sm text-slate-500 mt-0.5">{locationLine}</p>}
            </div>
            <button
              onClick={handleClick}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors whitespace-nowrap flex-shrink-0"
            >
              <Lock className="w-3.5 h-3.5" /> View Full Report
            </button>
          </div>

          {/* Detail rows */}
          {(addrList.length > 0 || aliasesList.length > 0 || relativesList.length > 0 || emailRaw) && (
            <div className="mt-3 space-y-1.5">
              {addrList.length > 0 && (
                <div className="flex items-baseline gap-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider w-24 flex-shrink-0">Addresses</span>
                  <span className="flex flex-wrap items-center gap-y-0.5">
                    {addrList.map((a, i) => (
                      <span key={i} className="flex items-center">
                        {i > 0 && <span className="mx-1.5 text-slate-300">·</span>}
                        <AddressPreview addr={cityState(a)} />
                      </span>
                    ))}
                  </span>
                </div>
              )}
              {aliasesList.length > 0 && (
                <div className="flex items-baseline gap-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider w-24 flex-shrink-0">May Go By</span>
                  <span className="flex flex-wrap items-center gap-y-0.5">
                    {aliasesList.map((a, i) => (
                      <span key={i} className="flex items-center">
                        {i > 0 && <span className="mx-1.5 text-slate-300">·</span>}
                        <span className="text-sm text-slate-700">{a}</span>
                      </span>
                    ))}
                  </span>
                </div>
              )}
              {relativesList.length > 0 && (
                <div className="flex items-baseline gap-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider w-24 flex-shrink-0">Related To</span>
                  <span className="flex flex-wrap items-center gap-y-0.5">
                    {relativesList.map((r, i) => (
                      <span key={i} className="flex items-center">
                        {i > 0 && <span className="mx-1.5 text-slate-300">·</span>}
                        <RelativePreview name={r} />
                      </span>
                    ))}
                  </span>
                </div>
              )}
              {emailRaw && (
                <div className="flex items-baseline gap-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider w-24 flex-shrink-0">Email</span>
                  <EmailPreview email={emailRaw} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const INVESTIGATION_STEPS = {
  phone_lookup:   ["Searching phone carrier…", "Checking public records…", "Matching address history…", "Analyzing spam reports…"],
  name_lookup:    ["Searching public records…", "Matching address history…", "Checking relatives & associates…", "Compiling report…"],
  address_lookup: ["Looking up address…", "Checking property records…", "Finding current residents…", "Matching phone numbers…"],
  carrier_lookup: ["Querying carrier database…", "Verifying number status…", "Checking line type…"],
};

// Parse "Louisville, KY" or "KY" or "Louisville" into { city, state }
function parseLocationStr(str) {
  if (!str) return { city: "", state: "" };
  const parts = str.split(",").map(s => s.trim());
  if (parts.length >= 2) {
    const stateCandidate = parts[1].split(" ")[0].toUpperCase();
    return { city: parts[0], state: US_STATES.includes(stateCandidate) ? stateCandidate : parts[1] };
  }
  const upper = str.trim().toUpperCase();
  if (US_STATES.includes(upper)) return { city: "", state: upper };
  return { city: str.trim(), state: "" };
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function PeopleSearch() {
  const navigate = useNavigate();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState("phone");
  const [prices, setPrices] = useState({ phone_lookup: 0.99, name_lookup: 1.49, address_lookup: 1.49, carrier_lookup: 0.49 });
  const [searching, setSearching] = useState(false);

  const [results, setResults] = useState([]);
  const [lookupType, setLookupType] = useState(null);
  const [query, setQuery] = useState("");

  // Investigation animation state
  const [investSteps, setInvestSteps]   = useState([]);  // "pending"|"active"|"done" per step
  const [investTab, setInvestTab]       = useState(null);
  const searchDoneRef   = useRef(false);
  const stepTimersRef   = useRef([]);

  // Search bar fields
  const [phone, setPhone] = useState("");
  const [fullName, setFullName] = useState("");
  const [locationStr, setLocationStr] = useState(""); // "City, ST" combined field
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");       // address tab city
  const [state, setState] = useState("");     // address tab state

  // Autocomplete
  const [acSuggestions, setAcSuggestions] = useState([]);
  const [acOpen, setAcOpen] = useState(false);
  const acDebounce = useRef(null);
  const acRef = useRef(null);

  // Sidebar filters (name lookup only)
  const [filterState, setFilterState] = useState("");
  const [ageRange, setAgeRange] = useState("");

  const userToken = localStorage.getItem("userToken");
  const authHeaders = userToken
    ? { "Content-Type": "application/json", "Authorization": `Bearer ${userToken}` }
    : { "Content-Type": "application/json" };

  useEffect(() => {
    const prefill = location.state?.prefill;
    const auto = location.state?.autoSearch;
    if (prefill?.firstName || auto) {
      setActiveTab(location.state?.tab || "name");
      if (prefill?.firstName) setFullName([prefill.firstName, prefill.lastName].filter(Boolean).join(" "));
      if (auto && location.state?.values) {
        const v = location.state.values;
        if (v.phone)     setPhone(v.phone);
        if (v.fullName)  setFullName(v.fullName);
        if (v.locationStr) setLocationStr(v.locationStr);
        if (v.street)    setStreet(v.street);
        if (v.city)      setCity(v.city);
        if (v.state)     setState(v.state);
      }
      window.history.replaceState({}, "");
      setTimeout(() => { document.getElementById("ps-search-btn")?.click(); }, 120);
    } else {
      const saved = sessionStorage.getItem("ps_results");
      const savedType = sessionStorage.getItem("ps_lookupType");
      const savedQuery = sessionStorage.getItem("ps_query");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed?.length) {
            setResults(parsed);
            if (savedType) setLookupType(savedType);
            if (savedQuery) setQuery(savedQuery);
            const matchingTab = Object.entries(TAB_CONFIG).find(([, v]) => v.id === savedType);
            if (matchingTab) setActiveTab(matchingTab[0]);
          }
        } catch { /* ignore */ }
      }
    }
    fetch(`${BACKEND_URL}/api/people-search/prices`)
      .then(r => r.json())
      .then(data => { if (data) setPrices(prev => ({ ...prev, ...data })); })
      .catch(() => {});
  }, []); // eslint-disable-line

  const fetchAcSuggestions = useCallback((val) => {
    clearTimeout(acDebounce.current);
    if (val.trim().length < 2) { setAcSuggestions([]); setAcOpen(false); return; }
    acDebounce.current = setTimeout(async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/people-search/autocomplete?q=${encodeURIComponent(val.trim())}`);
        const data = await res.json();
        setAcSuggestions(data.suggestions || []);
        setAcOpen((data.suggestions || []).length > 0);
      } catch { setAcSuggestions([]); setAcOpen(false); }
    }, 280);
  }, []);

  // Close autocomplete on outside click
  useEffect(() => {
    const handler = (e) => { if (acRef.current && !acRef.current.contains(e.target)) setAcOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSearch = async () => {
    const tab = TAB_CONFIG[activeTab];

    // Clear old timers
    stepTimersRef.current.forEach(t => clearTimeout(t));
    stepTimersRef.current = [];
    searchDoneRef.current = false;

    // Kick off investigation animation
    const steps = INVESTIGATION_STEPS[tab.id] || [];
    setInvestTab(tab.id);
    setInvestSteps(steps.map((_, i) => i === 0 ? "active" : "pending"));

    // Advance one step every 800ms; hold last step until search resolves
    steps.forEach((_, i) => {
      if (i === 0) return; // already active
      const t = setTimeout(() => {
        setInvestSteps(prev => prev.map((s, idx) => {
          if (idx < i)  return "done";
          if (idx === i) return "active";
          return s;
        }));
      }, i * 800);
      stepTimersRef.current.push(t);
    });

    setSearching(true);
    setResults([]);
    sessionStorage.removeItem("ps_results");
    sessionStorage.removeItem("ps_lookupType");
    sessionStorage.removeItem("ps_query");

    let fetchedResults = [];
    let fetchedType = tab.id;
    let fetchedQuery = "";
    let fetchError = false;

    try {
      const loc = parseLocationStr(locationStr);
      const body = { lookupType: tab.id };
      if (tab.id === "phone_lookup" || tab.id === "carrier_lookup") {
        body.phone = phone;
      } else if (tab.id === "name_lookup") {
        body.fullName = fullName;
        body.city  = filterState ? "" : loc.city;
        body.state = filterState || loc.state;
        const ageRangeObj = AGE_RANGES.find(r => r.value === ageRange);
        if (ageRangeObj?.min != null) body.minAge = ageRangeObj.min;
        if (ageRangeObj?.max != null) body.maxAge = ageRangeObj.max;
      } else if (tab.id === "address_lookup") {
        body.street = street;
        body.city   = city;
        body.state  = state;
      }
      const res = await fetch(`${BACKEND_URL}/api/people-search/search`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.detail || "Search failed. Please try again."); fetchError = true; return; }
      fetchedResults = data.results || [];
      fetchedType    = data.lookupType;
      fetchedQuery   = data.query;
      if (fetchedResults.length === 0 && data._debug) {
        const d = data._debug;
        console.warn("Search debug:", d);
        toast.info(`No results. DB records: ${d.internal_count}, internal: ${d.use_internal}, parsed: "${d.parsed_first} ${d.parsed_last}"`);
      }
    } catch {
      toast.error("Search failed. Please check your connection.");
      fetchError = true;
    }

    // Mark all steps done, then reveal results after a short pause
    const minElapsed = steps.length * 800;
    const elapsed = Date.now() - (Date.now()); // approximation — just wait for last timer
    const revealDelay = fetchError ? 0 : 400;

    setInvestSteps(steps.map(() => "done"));

    setTimeout(() => {
      setSearching(false);
      setInvestSteps([]);
      if (!fetchError) {
        setResults(fetchedResults);
        setLookupType(fetchedType);
        setQuery(fetchedQuery);
        sessionStorage.setItem("ps_results",    JSON.stringify(fetchedResults));
        sessionStorage.setItem("ps_lookupType", fetchedType);
        sessionStorage.setItem("ps_query",      fetchedQuery);
      }
    }, revealDelay);
  };

  const clearResults = () => {
    setResults([]);
    sessionStorage.removeItem("ps_results");
    sessionStorage.removeItem("ps_lookupType");
    sessionStorage.removeItem("ps_query");
  };

  const hasResults = results.length > 0;
  const tabLabel = lookupType ? Object.values(TAB_CONFIG).find(t => t.id === lookupType)?.label : "";

  // Tab labels for the compact bar
  const BAR_TABS = [
    { key: "name",    label: "People Search" },
    { key: "phone",   label: "Phone" },
    { key: "address", label: "Address" },
    { key: "carrier", label: "Carrier" },
  ];

  return (
    <>
      <Helmet>
        <title>People Search – Reverse Phone, Name & Address Lookup | MintSlip</title>
        <meta name="description" content="Pay-per-lookup people search. Reverse phone lookup, name search, address lookup, and carrier lookup. No subscription needed." />
      </Helmet>
      <Header />

      {/* ── Sticky search bar ── */}
      <div className="sticky top-[72px] z-40 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4">

          {/* Tab strip */}
          <div className="flex gap-0 overflow-x-auto">
            {BAR_TABS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => { setActiveTab(key); clearResults(); }}
                className={`px-5 py-3 text-xs font-bold uppercase tracking-widest border-b-2 whitespace-nowrap transition-colors ${
                  activeTab === key
                    ? "border-slate-900 text-slate-900"
                    : "border-transparent text-slate-400 hover:text-slate-600"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Input row — wrapped in relative container so autocomplete dropdown escapes overflow-hidden */}
          <div ref={acRef} className="relative mb-3">
            <div className="flex items-stretch border border-slate-200 rounded-lg overflow-hidden bg-white">
            {(activeTab === "name") && (
              <>
                <input
                  value={fullName}
                  onChange={e => { setFullName(e.target.value); fetchAcSuggestions(e.target.value); }}
                  onKeyDown={e => {
                    if (e.key === "Enter") { setAcOpen(false); handleSearch(); }
                    if (e.key === "Escape") setAcOpen(false);
                  }}
                  onFocus={() => { if (acSuggestions.length > 0) setAcOpen(true); }}
                  placeholder="e.g. Jon Snow"
                  className="flex-1 px-4 py-3 text-sm focus:outline-none min-w-0"
                  autoComplete="off"
                />
                <div className="w-px bg-slate-200 self-stretch" />
                <input
                  value={locationStr}
                  onChange={e => setLocationStr(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSearch()}
                  placeholder="City, State, or ZIP"
                  className="flex-1 px-4 py-3 text-sm focus:outline-none min-w-0"
                />
              </>
            )}
            {(activeTab === "phone" || activeTab === "carrier") && (
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSearch()}
                placeholder="(555) 123-4567"
                className="flex-1 px-4 py-3 text-sm focus:outline-none min-w-0"
              />
            )}
            {activeTab === "address" && (
              <>
                <input
                  value={street}
                  onChange={e => setStreet(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSearch()}
                  placeholder="Street address"
                  className="flex-1 px-4 py-3 text-sm focus:outline-none min-w-0"
                />
                <div className="w-px bg-slate-200 self-stretch" />
                <input
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSearch()}
                  placeholder="City, State"
                  className="flex-1 px-4 py-3 text-sm focus:outline-none min-w-0"
                />
              </>
            )}
            <button
              id="ps-search-btn"
              onClick={handleSearch}
              disabled={searching}
              className="px-5 bg-white hover:bg-slate-50 border-l border-slate-200 text-blue-600 hover:text-blue-700 transition-colors disabled:opacity-50 flex items-center"
            >
              {searching ? <Loader2 className="w-5 h-5 animate-spin text-slate-400" /> : <Search className="w-5 h-5" />}
            </button>
          </div>

          {/* Autocomplete dropdown — outside overflow-hidden */}
          {acOpen && acSuggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 z-50 bg-white border border-slate-200 rounded-b-xl shadow-lg overflow-hidden">
              {acSuggestions.map((s, i) => (
                <button
                  key={i}
                  type="button"
                  onMouseDown={e => e.preventDefault()}
                  onClick={() => { setFullName(s.fullName); setAcOpen(false); setAcSuggestions([]); }}
                  className="w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-slate-50 text-left border-b border-slate-100 last:border-0"
                >
                  <span className="font-medium text-slate-800">{s.fullName}</span>
                  <span className="text-xs text-slate-400 flex-shrink-0 ml-3">
                    {[s.age ? `Age ${s.age}` : null, s.state].filter(Boolean).join(" · ")}
                  </span>
                </button>
              ))}
            </div>
          )}
          </div>{/* end relative autocomplete wrapper */}

        </div>
      </div>

      <main className="min-h-screen bg-slate-50">

        {/* No-results state: hero + trust badges */}
        {!hasResults && !searching && (
          <div className="max-w-4xl mx-auto px-4 py-12">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
                <Shield className="w-3.5 h-3.5" /> Pay Only For What You Need
              </div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">People Search</h1>
              <p className="text-slate-500 text-base max-w-md mx-auto">
                Search public records. No subscription — pay per lookup.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-10">
              {[
                { icon: Shield,      title: "Secure & Private", desc: "Your searches are never shared" },
                { icon: Lock,        title: "Pay Per Result",    desc: "Unlock only what you need" },
                { icon: CheckCircle, title: "Instant Results",   desc: "Reports delivered in seconds" },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="bg-white rounded-xl border border-slate-200 p-4 text-center">
                  <Icon className="w-5 h-5 text-green-600 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-700">{title}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Search Types</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { to: "/reverse-phone-lookup", label: "Reverse Phone Lookup" },
                  { to: "/find-person-by-name",  label: "Find Person by Name" },
                  { to: "/address-lookup",        label: "Address Lookup" },
                  { to: "/who-called-me",         label: "Who Called Me?" },
                ].map(({ to, label }) => (
                  <button key={to} onClick={() => navigate(to)}
                    className="flex items-center gap-1.5 text-xs text-green-700 hover:text-green-800 hover:underline text-left">
                    <ChevronRight className="w-3 h-3 flex-shrink-0" /> {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Investigation animation */}
        {searching && investSteps.length > 0 && (
          <div className="flex items-center justify-center py-16 px-4">
            <div className="w-full max-w-md">

              {/* Header */}
              <div className="flex items-center gap-3 mb-6">
                <div className="relative w-10 h-10 flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <FileSearch className="w-5 h-5 text-green-600" />
                  </div>
                  <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-white animate-pulse" />
                </div>
                <div>
                  <p className="text-base font-bold text-slate-900">Investigating…</p>
                  <p className="text-xs text-slate-400">Running live checks across public records</p>
                </div>
              </div>

              {/* Steps */}
              <div className="space-y-3">
                {(INVESTIGATION_STEPS[investTab] || []).map((label, i) => {
                  const status = investSteps[i] || "pending";
                  return (
                    <div
                      key={i}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-500 ${
                        status === "done"   ? "bg-green-50 border-green-200"
                      : status === "active" ? "bg-white border-slate-200 shadow-sm"
                      :                       "bg-slate-50/60 border-slate-100 opacity-40"
                      }`}
                    >
                      {/* Status icon */}
                      <div className="w-6 h-6 flex-shrink-0 flex items-center justify-center">
                        {status === "done" && (
                          <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                        {status === "active" && (
                          <Loader2 className="w-4 h-4 text-green-600 animate-spin" />
                        )}
                        {status === "pending" && (
                          <div className="w-4 h-4 rounded-full border-2 border-slate-300" />
                        )}
                      </div>

                      {/* Label */}
                      <span className={`text-sm font-medium transition-colors ${
                        status === "done"   ? "text-green-700"
                      : status === "active" ? "text-slate-800"
                      :                       "text-slate-400"
                      }`}>
                        {label}
                      </span>

                      {/* Active pulse dots */}
                      {status === "active" && (
                        <span className="ml-auto flex gap-0.5">
                          {[0, 1, 2].map(d => (
                            <span
                              key={d}
                              className="w-1.5 h-1.5 rounded-full bg-green-400 animate-bounce"
                              style={{ animationDelay: `${d * 150}ms` }}
                            />
                          ))}
                        </span>
                      )}
                      {status === "done" && (
                        <span className="ml-auto text-[10px] font-bold text-green-500 uppercase tracking-wide">Done</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Results: sidebar + cards */}
        {hasResults && (
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex gap-6 items-start">

              {/* Left sidebar — filters (name lookup only) */}
              {lookupType === "name_lookup" && (
                <aside className="w-52 flex-shrink-0 bg-white border border-slate-200 rounded-xl p-4 sticky top-[130px] space-y-4">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Filters</p>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">State</label>
                    <select value={filterState} onChange={e => setFilterState(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white">
                      <option value="">Any State</option>
                      {[...new Set(results.map(r => r.preview?.state).filter(Boolean))].sort()
                        .map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Age Range</label>
                    <select value={ageRange} onChange={e => setAgeRange(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white">
                      {AGE_RANGES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                  </div>

                  <button onClick={handleSearch} disabled={searching}
                    className="w-full bg-green-600 hover:bg-green-700 text-white text-sm font-semibold py-2 rounded-lg transition-colors disabled:opacity-50">
                    {searching ? "…" : "Refine"}
                  </button>

                  <button onClick={clearResults}
                    className="w-full text-xs text-slate-400 hover:text-slate-600 underline pt-1">
                    Clear results
                  </button>
                </aside>
              )}

              {/* Results column */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      {tabLabel} — {results.length} result{results.length !== 1 ? "s" : ""} found
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">{query}</p>
                  </div>
                  {lookupType !== "name_lookup" && (
                    <button onClick={clearResults} className="text-xs text-slate-400 hover:text-slate-600 underline">
                      Clear
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  {results.map((entry) => (
                    lookupType === "carrier_lookup"
                      ? <CarrierResultCard key={entry.searchId} entry={entry} query={query} />
                      : <ResultCard key={entry.searchId} entry={entry} lookupType={lookupType} query={query} />
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

      </main>

      <Footer />
    </>
  );
}

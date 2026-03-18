import { useState, useEffect } from "react";
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
  const m = String(addr).match(/,\s*([^,]+,\s*[A-Z]{2})/);
  return m ? m[1].trim() : String(addr).replace(/^\d+\s+/, "");
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
    if (preview.location) return preview.location;
    if (preview.state) return preview.state;
    return null;
  })();

  // Full addresses (up to 3)
  const addrList = (() => {
    const addrs = [
      ...(preview.possibleAddresses || []),
      ...(preview.currentAddress ? [preview.currentAddress] : []),
      ...(preview.pastAddresses   || []),
    ].filter(Boolean);
    return [...new Set(addrs)].slice(0, 3);
  })();

  // Relatives — show first 2
  const relativesList = (() => {
    const r = preview.possibleRelatives;
    if (!r) return [];
    return (Array.isArray(r) ? r : [r]).slice(0, 2);
  })();

  // Email — first one only
  const emailRaw = Array.isArray(preview.emails) ? preview.emails[0] : preview.emails || null;

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
          <span className="text-3xl font-extrabold text-slate-900 leading-none">{age ?? "?"}</span>
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
          {(addrList.length > 0 || relativesList.length > 0 || emailRaw) && (
            <div className="mt-3 space-y-1.5">
              {addrList.length > 0 && (
                <div className="flex items-baseline gap-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider w-24 flex-shrink-0">Addresses</span>
                  <span className="flex flex-wrap gap-x-3 gap-y-0.5">
                    {addrList.map((a, i) => <AddressPreview key={i} addr={a} />)}
                  </span>
                </div>
              )}
              {relativesList.length > 0 && (
                <div className="flex items-baseline gap-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider w-24 flex-shrink-0">Related To</span>
                  <span className="flex flex-wrap gap-x-3 gap-y-0.5">
                    {relativesList.map((r, i) => <RelativePreview key={i} name={r} />)}
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

// ── Main page ─────────────────────────────────────────────────────────────────
export default function PeopleSearch() {
  const navigate = useNavigate();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState("phone");
  const [prices, setPrices] = useState({ phone_lookup: 0.99, name_lookup: 1.49, address_lookup: 1.49, carrier_lookup: 0.49 });

  const [searching, setSearching] = useState(false);

  // results: [{ searchId, preview, price, fullResult?, paid? }]
  const [results, setResults] = useState([]);
  const [lookupType, setLookupType] = useState(null);
  const [query, setQuery] = useState("");

  // Form fields
  const [phone, setPhone] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [state, setState] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [nameCity, setNameCity] = useState("");
  const [minAge, setMinAge] = useState("");
  const [maxAge, setMaxAge] = useState("");

  const userToken = localStorage.getItem("userToken");
  const authHeaders = userToken
    ? { "Content-Type": "application/json", "Authorization": `Bearer ${userToken}` }
    : { "Content-Type": "application/json" };

  // Restore previous results + fetch prices on mount, handle relative prefill
  useEffect(() => {
    const prefill = location.state?.prefill;
    if (prefill?.firstName) {
      // Came from a relative click — pre-fill name tab and auto-search
      setActiveTab("name");
      setFirstName(prefill.firstName);
      setLastName(prefill.lastName || "");
      // Clear nav state so back-navigation doesn't re-trigger
      window.history.replaceState({}, "");
      // Auto-search after state settles
      setTimeout(() => {
        document.getElementById("ps-search-btn")?.click();
      }, 100);
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
  }, []);

  const handleSearch = async () => {
    const tab = TAB_CONFIG[activeTab];
    setSearching(true);
    setResults([]);
    sessionStorage.removeItem("ps_results");
    sessionStorage.removeItem("ps_lookupType");
    sessionStorage.removeItem("ps_query");
    try {
      const res = await fetch(`${BACKEND_URL}/api/people-search/search`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          lookupType: tab.id, phone, firstName, lastName, state, street,
          city: tab.id === "name_lookup" ? nameCity : city,
          ...(tab.id === "name_lookup" && minAge ? { minAge: parseInt(minAge) } : {}),
          ...(tab.id === "name_lookup" && maxAge ? { maxAge: parseInt(maxAge) } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.detail || "Search failed. Please try again.");
        return;
      }
      const newResults = data.results || [];
      setResults(newResults);
      setLookupType(data.lookupType);
      setQuery(data.query);
      // Save to sessionStorage so we can restore after Stripe redirect
      sessionStorage.setItem("ps_results",    JSON.stringify(newResults));
      sessionStorage.setItem("ps_lookupType", data.lookupType);
      sessionStorage.setItem("ps_query",      data.query);
    } catch {
      toast.error("Search failed. Please check your connection.");
    } finally {
      setSearching(false);
    }
  };

  const hasResults = results.length > 0;
  const tabLabel = lookupType ? Object.values(TAB_CONFIG).find(t => t.id === lookupType)?.label : "";

  return (
    <>
      <Helmet>
        <title>People Search – Reverse Phone, Name & Address Lookup | MintSlip</title>
        <meta name="description" content="Pay-per-lookup people search. Reverse phone lookup, name search, address lookup, and carrier lookup. No subscription needed." />
      </Helmet>
      <Header />

      <main className="min-h-screen bg-slate-50 py-10 px-4">
        <div className="max-w-4xl mx-auto">

          {/* Hero */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
              <Shield className="w-3.5 h-3.5" /> Pay Only For What You Need
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">People Search</h1>
            <p className="text-slate-500 text-base max-w-md mx-auto">
              Search public records. No subscription — pay per lookup.
            </p>
          </div>

          {/* Search panel */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-6">

              {/* Tabs */}
              <div className="flex border-b border-slate-200 overflow-x-auto">
                {Object.entries(TAB_CONFIG).map(([key, cfg]) => {
                  const Icon = cfg.icon;
                  return (
                    <button
                      key={key}
                      onClick={() => { setActiveTab(key); setResults([]); }}
                      className={`flex-1 min-w-[110px] flex flex-col items-center gap-1.5 px-3 py-3.5 text-xs font-medium transition-colors border-b-2 ${
                        activeTab === key
                          ? "border-green-600 text-green-700 bg-green-50"
                          : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-center leading-tight">{cfg.label.split(" ").slice(0, 2).join(" ")}</span>
                    </button>
                  );
                })}
              </div>

              {/* Form */}
              <div className="p-6 space-y-4">
                {activeTab === "phone" && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Phone Number</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="(555) 123-4567"
                      className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      onKeyDown={e => e.key === "Enter" && handleSearch()}
                    />
                  </div>
                )}

                {activeTab === "carrier" && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Phone Number</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="(555) 123-4567"
                      className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      onKeyDown={e => e.key === "Enter" && handleSearch()}
                    />
                    <p className="text-xs text-slate-400 mt-2">Returns carrier name, line type (mobile/landline/VoIP), and region for any US number.</p>
                  </div>
                )}

                {activeTab === "name" && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">First Name</label>
                        <input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="John"
                          className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Last Name</label>
                        <input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Smith"
                          className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                          City <span className="text-slate-400 font-normal">(optional)</span>
                        </label>
                        <input value={nameCity} onChange={e => setNameCity(e.target.value)} placeholder="Louisville"
                          className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                          State <span className="text-slate-400 font-normal">(optional)</span>
                        </label>
                        <select value={state} onChange={e => setState(e.target.value)}
                          className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white">
                          <option value="">Any State</option>
                          {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                          Min Age <span className="text-slate-400 font-normal">(optional, 18–65)</span>
                        </label>
                        <input type="number" min="18" max="65" value={minAge} onChange={e => setMinAge(e.target.value)} placeholder="18"
                          className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                          Max Age <span className="text-slate-400 font-normal">(optional, 18–65)</span>
                        </label>
                        <input type="number" min="18" max="65" value={maxAge} onChange={e => setMaxAge(e.target.value)} placeholder="65"
                          className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent" />
                      </div>
                    </div>
                  </>
                )}

                {activeTab === "address" && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Street Address</label>
                      <input value={street} onChange={e => setStreet(e.target.value)} placeholder="123 Main St"
                        className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">City</label>
                        <input value={city} onChange={e => setCity(e.target.value)} placeholder="Springfield"
                          className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">State</label>
                        <select value={state} onChange={e => setState(e.target.value)}
                          className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white">
                          <option value="">Select</option>
                          {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                    </div>
                  </>
                )}

                <button
                  id="ps-search-btn"
                  onClick={handleSearch}
                  disabled={searching}
                  className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 text-sm"
                >
                  {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  {searching ? "Searching…" : `Search – $${prices[TAB_CONFIG[activeTab].id].toFixed(2)} per result`}
                </button>
                <p className="text-center text-xs text-slate-400">
                  You only pay when you choose to unlock a specific result.
                </p>
              </div>
            </div>

          {/* Results */}
          {hasResults && (
            <div className="space-y-4 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    {tabLabel} — {results.length} result{results.length !== 1 ? "s" : ""} found
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">{query}</p>
                </div>
                <button
                  onClick={() => { setResults([]); sessionStorage.removeItem("ps_results"); sessionStorage.removeItem("ps_lookupType"); sessionStorage.removeItem("ps_query"); }}
                  className="text-xs text-slate-400 hover:text-slate-600 underline"
                >
                  Clear
                </button>
              </div>

              {results.map((entry) => (
                lookupType === "carrier_lookup"
                  ? <CarrierResultCard key={entry.searchId} entry={entry} query={query} />
                  : <ResultCard key={entry.searchId} entry={entry} lookupType={lookupType} query={query} />
              ))}
            </div>
          )}

          {/* Trust badges */}
          {!hasResults && (
            <div className="mt-2 grid grid-cols-3 gap-4">
              {[
                { icon: Shield,       title: "Secure & Private",  desc: "Your searches are never shared" },
                { icon: Lock,         title: "Pay Per Result",     desc: "Unlock only what you need" },
                { icon: CheckCircle,  title: "Instant Results",    desc: "Reports delivered in seconds" },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="bg-white rounded-xl border border-slate-200 p-4 text-center">
                  <Icon className="w-5 h-5 text-green-600 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-700">{title}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
                </div>
              ))}
            </div>
          )}

          {/* SEO links */}
          <div className="mt-8 bg-white rounded-xl border border-slate-200 p-5">
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
      </main>

      <Footer />
    </>
  );
}

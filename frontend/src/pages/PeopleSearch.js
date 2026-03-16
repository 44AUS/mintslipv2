import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  Phone, User, MapPin, FileSearch, Lock, Search,
  Shield, Loader2, ChevronRight, CheckCircle,
} from "lucide-react";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY",
];

const TAB_CONFIG = {
  phone:      { id: "phone_lookup",      label: "Reverse Phone Lookup",   icon: Phone },
  name:       { id: "name_lookup",       label: "Name Lookup",            icon: User },
  address:    { id: "address_lookup",    label: "Address Lookup",         icon: MapPin },
  background: { id: "background_report", label: "Full Background Report", icon: FileSearch },
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
  // background_report
  return (
    <>
      <InfoRow label="Full Name"      value={data.fullName}    blurred={false} />
      <DobRow  label="Date of Birth"  value={data.dateOfBirth} blurred={b} />
      <AddressRow label="Current Address" value={data.currentAddress}  blurred={b} />
      <AddressRow label="Past Addresses" value={data.pastAddresses}    blurred={b} />
      <PhoneRow   label="Phone Numbers"  value={data.phones}           blurred={b} />
      <InfoRow    label="Emails"         value={data.emails}           blurred={b} />
      <InfoRow    label="Relatives"      value={data.possibleRelatives} blurred={b} />
      <InfoRow    label="Public Records" value={data.publicRecords}    blurred={b} />
      <InfoRow    label="Education"      value={data.education}        blurred={false} />
    </>
  );
}

// ── Single result card — clickable, navigates to detail page ─────────────────
function ResultCard({ entry, lookupType, query }) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/people-search/result/${entry.searchId}`, {
      state: { preview: entry.preview, lookupType, price: entry.price, query },
    });
  };

  const name = entry.preview?.fullName || entry.preview?.name || entry.preview?.address || "View Report";
  const location = entry.preview?.state || entry.preview?.location || "";

  return (
    <button
      onClick={handleClick}
      className="w-full text-left bg-white rounded-xl border border-slate-200 shadow-sm hover:border-green-400 hover:shadow-md transition-all duration-200 overflow-hidden group"
    >
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
            <User className="w-5 h-5 text-green-700" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-800 truncate">{name}</p>
            {location && <p className="text-xs text-slate-500 truncate">{location}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="flex items-center gap-1 text-amber-600 text-xs font-semibold bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
            <Lock className="w-3 h-3" /> Locked
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-green-600 transition-colors" />
        </div>
      </div>
    </button>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function PeopleSearch() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("phone");
  const [prices, setPrices] = useState({ phone_lookup: 0.99, name_lookup: 1.49, address_lookup: 1.49, background_report: 4.99 });

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

  const userToken = localStorage.getItem("userToken");
  const authHeaders = userToken
    ? { "Content-Type": "application/json", "Authorization": `Bearer ${userToken}` }
    : { "Content-Type": "application/json" };

  // Fetch prices on mount
  useEffect(() => {
    fetch(`${BACKEND_URL}/api/people-search/prices`)
      .then(r => r.json())
      .then(data => { if (data) setPrices(prev => ({ ...prev, ...data })); })
      .catch(() => {});
  }, []);

  const handleSearch = async () => {
    const tab = TAB_CONFIG[activeTab];
    setSearching(true);
    setResults([]);
    try {
      const res = await fetch(`${BACKEND_URL}/api/people-search/search`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ lookupType: tab.id, phone, firstName, lastName, state, street, city }),
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
        <meta name="description" content="Pay-per-lookup people search. Reverse phone lookup, name search, address lookup, and full background reports. No subscription needed." />
      </Helmet>
      <Header />

      <main className="min-h-screen bg-slate-50 py-10 px-4">
        <div className="max-w-2xl mx-auto">

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

                {(activeTab === "name" || activeTab === "background") && (
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
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        State <span className="text-slate-400 font-normal">(optional — narrows results)</span>
                      </label>
                      <select value={state} onChange={e => setState(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white">
                        <option value="">Any State</option>
                        {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
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
                  onClick={() => setResults([])}
                  className="text-xs text-slate-400 hover:text-slate-600 underline"
                >
                  Clear
                </button>
              </div>

              {results.map((entry) => (
                <ResultCard
                  key={entry.searchId}
                  entry={entry}
                  lookupType={lookupType}
                  query={query}
                />
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

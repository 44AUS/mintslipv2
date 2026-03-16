import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  Phone, User, MapPin, FileSearch, Lock, CheckCircle, Search,
  Shield, Download, Loader2, ChevronRight, Unlock,
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
  phone:      { id: "phone_lookup",      label: "Reverse Phone Lookup",   icon: Phone,       price_key: "phone_lookup" },
  name:       { id: "name_lookup",       label: "Name Lookup",            icon: User,        price_key: "name_lookup" },
  address:    { id: "address_lookup",    label: "Address Lookup",         icon: MapPin,      price_key: "address_lookup" },
  background: { id: "background_report", label: "Full Background Report", icon: FileSearch,  price_key: "background_report" },
};

function InfoRow({ label, value, blurred }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 py-2 border-b border-slate-100 last:border-0">
      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide sm:w-40 flex-shrink-0">{label}</span>
      <span className={`text-sm text-slate-800 flex-1 ${blurred ? "blur-[4px] select-none text-slate-400" : ""}`}>
        {Array.isArray(value) ? value.join(", ") : value}
      </span>
    </div>
  );
}

function ResultCard({ data, lookupType, blurred }) {
  if (!data) return null;
  const rows = [];

  if (lookupType === "phone_lookup") {
    rows.push(
      { label: "Name",              value: data.name,               blurred },
      { label: "Carrier",           value: data.carrier,            blurred: false },
      { label: "Line Type",         value: data.lineType,           blurred: false },
      { label: "Location",          value: data.location,           blurred: false },
      { label: "Spam Risk",         value: data.spamRisk,           blurred: false },
      { label: "Caller Type",       value: data.callerType,         blurred: false },
      { label: "Possible Address",  value: data.possibleAddress,    blurred },
      { label: "Possible Relatives",value: data.possibleRelatives,  blurred },
    );
  } else if (lookupType === "name_lookup") {
    rows.push(
      { label: "Full Name",         value: data.fullName,           blurred: false },
      { label: "Age Range",         value: data.ageRange,           blurred: false },
      { label: "State",             value: data.state,              blurred: false },
      { label: "Addresses",         value: data.possibleAddresses,  blurred },
      { label: "Phone Numbers",     value: data.possiblePhones,     blurred },
      { label: "Relatives",         value: data.possibleRelatives,  blurred },
    );
  } else if (lookupType === "address_lookup") {
    rows.push(
      { label: "Address",           value: data.address,            blurred: false },
      { label: "Property Owner",    value: data.propertyOwner,      blurred },
      { label: "Residents",         value: data.residents,          blurred },
      { label: "Est. Value",        value: data.estimatedValue,     blurred },
      { label: "Property Type",     value: data.propertyType,       blurred: false },
      { label: "Year Built",        value: data.yearBuilt,          blurred: false },
      { label: "Square Feet",       value: data.squareFeet,         blurred: false },
      { label: "Phone Numbers",     value: data.associatedPhones,   blurred },
    );
  } else if (lookupType === "background_report") {
    rows.push(
      { label: "Full Name",         value: data.fullName,           blurred: false },
      { label: "Age Range",         value: data.ageRange,           blurred: false },
      { label: "Current Address",   value: data.currentAddress,     blurred },
      { label: "Past Addresses",    value: data.pastAddresses,      blurred },
      { label: "Phone Numbers",     value: data.phones,             blurred },
      { label: "Relatives",         value: data.possibleRelatives,  blurred },
      { label: "Public Records",    value: data.publicRecords,      blurred },
      { label: "Education",         value: data.education,          blurred: false },
    );
  }

  return (
    <div className="divide-y divide-slate-50">
      {rows.map((r, i) => <InfoRow key={i} label={r.label} value={r.value} blurred={r.blurred} />)}
    </div>
  );
}

export default function PeopleSearch() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("phone");
  const [prices, setPrices] = useState({ phone_lookup: 0.99, name_lookup: 1.49, address_lookup: 1.49, background_report: 4.99 });

  const [searching, setSearching] = useState(false);
  const [checkingPayment, setCheckingPayment] = useState(false);

  const [preview, setPreview] = useState(null);
  const [fullResult, setFullResult] = useState(null);
  const [paid, setPaid] = useState(false);
  const [searchId, setSearchId] = useState(null);
  const [lookupType, setLookupType] = useState(null);
  const [price, setPrice] = useState(null);
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

  // Check payment redirect on mount
  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    const sid = searchParams.get("search_id");
    if (sessionId && sid) {
      setCheckingPayment(true);
      setSearchId(sid);
      fetch(`${BACKEND_URL}/api/people-search/result/${sid}?session_id=${sessionId}`, {
        headers: authHeaders,
      })
        .then(r => r.json())
        .then(data => {
          if (data.paid && data.result) {
            setFullResult(data.result);
            setLookupType(data.lookupType);
            setPaid(true);
            toast.success("Payment confirmed – full report unlocked!");
          }
        })
        .catch(() => {})
        .finally(() => setCheckingPayment(false));
    }
  }, []);

  const handleSearch = async () => {
    const tab = TAB_CONFIG[activeTab];
    setSearching(true);
    setPreview(null);
    setFullResult(null);
    setPaid(false);
    try {
      const res = await fetch(`${BACKEND_URL}/api/people-search/search`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          lookupType: tab.id,
          phone, firstName, lastName, state, street, city,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.detail || "Search failed. Please try again.");
        return;
      }
      setPreview(data.preview);
      setSearchId(data.searchId);
      setLookupType(data.lookupType);
      setPrice(data.price);
      setQuery(data.query);
    } catch {
      toast.error("Search failed. Please check your connection.");
    } finally {
      setSearching(false);
    }
  };

  const handleUnlock = async () => {
    if (!searchId) return;
    setSearching(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/people-search/checkout`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ searchId }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.detail || "Checkout failed.");
        return;
      }
      if (data.alreadyPaid && data.result) {
        setFullResult(data.result);
        setPaid(true);
        return;
      }
      if (data.url) window.location.href = data.url;
    } catch {
      toast.error("Checkout failed. Please try again.");
    } finally {
      setSearching(false);
    }
  };

  const handlePrint = () => window.print();

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
              Search public records. No subscription required — pay per lookup.
            </p>
          </div>

          {/* Checking payment overlay */}
          {checkingPayment && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center mb-6">
              <Loader2 className="w-8 h-8 animate-spin text-green-600 mx-auto mb-3" />
              <p className="text-slate-600 font-medium">Verifying your payment…</p>
            </div>
          )}

          {/* Full result after payment */}
          {paid && fullResult && !checkingPayment && (
            <div className="bg-white rounded-xl border border-green-200 shadow-sm p-6 mb-6 print:shadow-none">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="font-semibold text-green-700">Report Unlocked</span>
                </div>
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 border border-slate-200 rounded-lg px-3 py-1.5 transition-colors print:hidden"
                >
                  <Download className="w-3.5 h-3.5" /> Download / Print
                </button>
              </div>
              <div className="mb-3">
                <p className="text-sm font-semibold text-slate-700">{tabLabel}</p>
                <p className="text-xs text-slate-400">{query}</p>
              </div>
              <ResultCard data={fullResult} lookupType={lookupType} blurred={false} />
            </div>
          )}

          {/* Search panel (hide if paid result shown) */}
          {!paid && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-6">

              {/* Tabs */}
              <div className="flex border-b border-slate-200 overflow-x-auto">
                {Object.entries(TAB_CONFIG).map(([key, cfg]) => {
                  const Icon = cfg.icon;
                  return (
                    <button
                      key={key}
                      onClick={() => { setActiveTab(key); setPreview(null); }}
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
                        <input
                          value={firstName} onChange={e => setFirstName(e.target.value)}
                          placeholder="John"
                          className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Last Name</label>
                        <input
                          value={lastName} onChange={e => setLastName(e.target.value)}
                          placeholder="Smith"
                          className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        State <span className="text-slate-400 font-normal">(optional)</span>
                      </label>
                      <select
                        value={state} onChange={e => setState(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                      >
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
                      <input
                        value={street} onChange={e => setStreet(e.target.value)}
                        placeholder="123 Main St"
                        className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">City</label>
                        <input
                          value={city} onChange={e => setCity(e.target.value)}
                          placeholder="Springfield"
                          className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">State</label>
                        <select
                          value={state} onChange={e => setState(e.target.value)}
                          className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                        >
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
                  {searching ? "Searching…" : `Search – $${prices[TAB_CONFIG[activeTab].price_key].toFixed(2)}`}
                </button>

                <p className="text-center text-xs text-slate-400">
                  You will only be charged after previewing results and choosing to unlock.
                </p>
              </div>

              {/* Preview result */}
              {preview && !paid && (
                <div className="border-t border-slate-200 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        {Object.values(TAB_CONFIG).find(t => t.id === lookupType)?.label} Preview
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">{query}</p>
                    </div>
                    <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2 py-1 rounded-full">
                      <Lock className="w-3 h-3" /> Partial
                    </span>
                  </div>

                  <ResultCard data={preview} lookupType={lookupType} blurred={true} />

                  <div className="mt-5 pt-5 border-t border-slate-100 space-y-3">
                    <p className="text-xs text-slate-400 text-center">
                      Sensitive information is hidden. Unlock the full report to see complete data.
                    </p>
                    <button
                      onClick={handleUnlock}
                      disabled={searching}
                      className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-4 rounded-xl transition-colors disabled:opacity-50 text-base"
                    >
                      {searching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Unlock className="w-5 h-5" />}
                      {searching ? "Redirecting…" : `Unlock Full Report – $${price?.toFixed(2)}`}
                    </button>
                    <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400">
                      <Lock className="w-3 h-3" /> Secured by Stripe · Cards, Apple Pay & Google Pay accepted
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* New search button when paid */}
          {paid && (
            <button
              onClick={() => { setPaid(false); setFullResult(null); setPreview(null); setSearchId(null); }}
              className="w-full flex items-center justify-center gap-2 border border-slate-200 text-slate-600 hover:bg-slate-100 font-medium py-3 rounded-lg transition-colors text-sm"
            >
              <Search className="w-4 h-4" /> Run Another Search
            </button>
          )}

          {/* Trust badges */}
          <div className="mt-8 grid grid-cols-3 gap-4">
            {[
              { icon: Shield, title: "Secure & Private", desc: "Your searches are never shared" },
              { icon: Lock,   title: "Pay Per Lookup",   desc: "No subscriptions or hidden fees" },
              { icon: CheckCircle, title: "Instant Results", desc: "Reports delivered in seconds" },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white rounded-xl border border-slate-200 p-4 text-center">
                <Icon className="w-5 h-5 text-green-600 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-700">{title}</p>
                <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
              </div>
            ))}
          </div>

          {/* SEO links */}
          <div className="mt-8 bg-white rounded-xl border border-slate-200 p-5">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Search Types</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { to: "/reverse-phone-lookup", label: "Reverse Phone Lookup" },
                { to: "/find-person-by-name",  label: "Find Person by Name" },
                { to: "/address-lookup",       label: "Address Lookup" },
                { to: "/who-called-me",        label: "Who Called Me?" },
              ].map(({ to, label }) => (
                <button
                  key={to}
                  onClick={() => navigate(to)}
                  className="flex items-center gap-1.5 text-xs text-green-700 hover:text-green-800 hover:underline text-left"
                >
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

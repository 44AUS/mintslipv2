import { useState, useEffect } from "react";
import { useParams, useSearchParams, useLocation, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  Lock, CheckCircle, Download, Loader2, Unlock, ArrowLeft,
  MapPin, Phone, Mail, Users, Home, FileSearch, ChevronDown, ChevronUp,
} from "lucide-react";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";

// ── Helpers ───────────────────────────────────────────────────────────────────
function parseDob(dob) {
  if (!dob) return null;
  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  let month = "", day = "", year = "";
  const iso = String(dob).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) { year = iso[1]; month = months[parseInt(iso[2]) - 1] || ""; day = iso[3]; }
  const mdy = String(dob).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (mdy) { year = mdy[3]; month = months[parseInt(mdy[1]) - 1] || ""; day = mdy[2]; }
  if (!year && /^\d{4}$/.test(String(dob))) { year = String(dob); }
  const age = year ? Math.floor((Date.now() - new Date(`${year}-${month ? (months.indexOf(month)+1).toString().padStart(2,"0") : "01"}-${day || "01"}`)) / (365.25*24*60*60*1000)) : null;
  return { month, day, year, age };
}

// Overlay that blurs its children and shows a lock badge
function Locked({ children, blurred }) {
  if (!blurred) return <>{children}</>;
  return (
    <div className="relative inline-block w-full">
      <div className="blur-[5px] select-none pointer-events-none">{children}</div>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-white/95 border border-slate-200 px-2 py-1 rounded-full shadow-sm">
          <Lock className="w-2.5 h-2.5" /> Locked
        </span>
      </div>
    </div>
  );
}

// Section wrapper with icon header
function Section({ icon: Icon, title, description, children, iconBg = "bg-slate-800" }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 mb-4 overflow-hidden">
      <div className="flex items-center gap-4 px-6 py-4 border-b border-slate-100">
        <div className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center flex-shrink-0`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="font-bold text-slate-900 text-base leading-tight">{title}</h2>
          {description && <p className="text-sm text-slate-500 mt-0.5">{description}</p>}
        </div>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

// FAQ accordion item
function FaqItem({ question, answer }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors text-left gap-3"
      >
        <span>{question}</span>
        {open
          ? <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" />
          : <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />}
      </button>
      {open && (
        <div className="px-4 pb-4 pt-3 text-sm text-slate-600 border-t border-slate-100 leading-relaxed">
          {answer}
        </div>
      )}
    </div>
  );
}

// Simple phone/address lookup fallback layout
function SimpleLookupResult({ data, lookupType, blurred, query }) {
  const b = blurred;
  const rows = [];
  if (lookupType === "carrier_lookup") {
    rows.push(
      { label: "Phone",     value: data?.phone,                                 blur: false },
      { label: "Carrier",   value: data?.carrier,                               blur: b },
      { label: "Line Type", value: data?.lineType,                              blur: b },
      { label: "Region",    value: data?.region,                                blur: false },
      { label: "Status",    value: data?.valid === false ? "Invalid" : "Valid", blur: false },
      { label: "Country",   value: data?.countryCode,                           blur: false },
    );
  } else if (lookupType === "phone_lookup") {
    rows.push(
      { label: "Name",             value: data?.name,              blur: b  },
      { label: "Carrier",          value: data?.carrier,           blur: false },
      { label: "Line Type",        value: data?.lineType,          blur: false },
      { label: "Location",         value: data?.location,          blur: false },
      { label: "Spam Risk",        value: data?.spamRisk,          blur: false },
      { label: "Caller Type",      value: data?.callerType,        blur: false },
      { label: "Possible Address", value: Array.isArray(data?.possibleAddress) ? data.possibleAddress.join(", ") : data?.possibleAddress, blur: b },
      { label: "Relatives",        value: Array.isArray(data?.possibleRelatives) ? data.possibleRelatives.join(", ") : data?.possibleRelatives, blur: false },
    );
  } else {
    rows.push(
      { label: "Address",        value: data?.address,         blur: false },
      { label: "Property Owner", value: data?.propertyOwner,   blur: b },
      { label: "Residents",      value: Array.isArray(data?.residents) ? data.residents.join(", ") : data?.residents, blur: b },
      { label: "Est. Value",     value: data?.estimatedValue,  blur: b },
      { label: "Property Type",  value: data?.propertyType,    blur: false },
      { label: "Year Built",     value: data?.yearBuilt,       blur: false },
      { label: "Sq. Feet",       value: data?.squareFeet,      blur: false },
      { label: "Phone Numbers",  value: Array.isArray(data?.associatedPhones) ? data.associatedPhones.join(", ") : data?.associatedPhones, blur: b },
    );
  }
  return (
    <div className="space-y-0">
      {rows.filter(r => r.value).map(r => (
        <div key={r.label} className="flex flex-col sm:flex-row sm:items-start gap-1 py-2.5 border-b border-slate-100 last:border-0">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide sm:w-44 flex-shrink-0">{r.label}</span>
          <span className={`text-sm flex-1 ${r.blur ? "blur-[4px] select-none text-slate-400" : "text-slate-800"}`}>{r.value}</span>
        </div>
      ))}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function PeopleSearchResult() {
  const { searchId } = useParams();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  const userToken = localStorage.getItem("userToken");
  const authHeaders = userToken
    ? { "Content-Type": "application/json", "Authorization": `Bearer ${userToken}` }
    : { "Content-Type": "application/json" };

  const passed = location.state || {};
  const [preview] = useState(passed.preview || null);
  const [lookupType, setLookupType] = useState(passed.lookupType || null);
  const [price] = useState(passed.price || null);
  const [query] = useState(passed.query || "");

  const [fullResult, setFullResult] = useState(null);
  const [isPaid, setIsPaid] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    if (sessionId || !preview) {
      setLoading(true);
      fetch(`${BACKEND_URL}/api/people-search/result/${searchId}${sessionId ? `?session_id=${sessionId}` : ""}`, {
        headers: authHeaders,
      })
        .then(r => r.json())
        .then(data => {
          if (data.paid && data.result) {
            setFullResult(data.result);
            setLookupType(lt => lt || data.lookupType);
            setIsPaid(true);
            if (sessionId) toast.success("Payment confirmed – full report unlocked!");
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, []); // eslint-disable-line

  const handleUnlock = async () => {
    setUnlocking(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/people-search/checkout`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          searchId,
          successUrl: `${window.location.origin}/people-search/result/${searchId}?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl:  `${window.location.origin}/people-search/result/${searchId}`,
        }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.detail || "Checkout failed."); return; }
      if (data.alreadyPaid && data.result) { setFullResult(data.result); setIsPaid(true); return; }
      if (data.url) window.location.href = data.url;
    } catch {
      toast.error("Checkout failed. Please try again.");
    } finally {
      setUnlocking(false);
    }
  };

  const d = isPaid ? fullResult : preview;

  // ── Derived data ─────────────────────────────────────────────────────────
  const dob         = parseDob(d?.dateOfBirth);
  const age         = dob?.age && dob.age > 0 && dob.age < 130 ? dob.age : null;
  const name        = d?.fullName || d?.name || query || "Unknown";
  const firstName   = name.split(" ")[0];

  const currentAddr = (() => {
    if (d?.currentAddress) return Array.isArray(d.currentAddress) ? d.currentAddress[0] : d.currentAddress;
    if (d?.possibleAddresses?.length) return d.possibleAddresses[0];
    return null;
  })();

  const pastAddrs = (() => {
    if (d?.pastAddresses?.length) return d.pastAddresses;
    if (d?.possibleAddresses?.length > 1) return d.possibleAddresses.slice(1);
    return [];
  })();

  const phoneList = (() => {
    const p = d?.possiblePhones || d?.phones;
    if (!p) return [];
    return Array.isArray(p) ? p : [p];
  })();

  const emailList = (() => {
    const e = d?.emails;
    if (!e) return [];
    return Array.isArray(e) ? e : [e];
  })();

  const relativesList = (() => {
    const r = d?.possibleRelatives;
    if (!r) return [];
    return Array.isArray(r) ? r : [r];
  })();

  const locationSummary = (() => {
    if (currentAddr) {
      // Try "City, ST" from full address e.g. "123 Main St, Louisville, KY 40201"
      const m = String(currentAddr).match(/,\s*([^,]+),\s*([A-Z]{2})\b/);
      if (m) return `${m[1].trim()}, ${m[2]}`;
      // Already "City, ST" format from preview
      const m2 = String(currentAddr).match(/^([^,]+),\s*([A-Z]{2})\b/);
      if (m2) return `${m2[1].trim()}, ${m2[2]}`;
    }
    if (d?.state) return d.state;
    return null;
  })();

  const pageTitle = { phone_lookup: "Reverse Phone Lookup", name_lookup: "Name Lookup", address_lookup: "Address Lookup", carrier_lookup: "Carrier Lookup" }[lookupType] || "People Search";

  // FAQ
  const faqs = [
    { q: `Where does ${name} live?`, a: isPaid && currentAddr ? currentAddr : `Unlock the full report to see ${firstName}'s current address.` },
    { q: `How old is ${name}?`, a: age ? `${name} is ${age} years old.` : `Unlock the full report to see ${firstName}'s age and date of birth.` },
    { q: `What is ${firstName}'s phone number?`, a: isPaid && phoneList.length ? phoneList.slice(0,2).join(", ") : `Unlock the full report to see ${firstName}'s phone numbers.` },
    { q: `Who are ${firstName}'s relatives?`, a: isPaid && relativesList.length ? relativesList.join(", ") : `Unlock the full report to see ${firstName}'s possible relatives.` },
    { q: `Where has ${firstName} lived previously?`, a: isPaid && pastAddrs.length ? pastAddrs.join("; ") : `Unlock the full report to see all previous addresses.` },
    { q: `What email addresses does ${firstName} use?`, a: isPaid && emailList.length ? emailList.slice(0,2).join(", ") + (emailList.length > 2 ? ` + ${emailList.length - 2} more` : "") : `Unlock the full report to see known email addresses.` },
  ];

  // Narrative
  const narrative = (() => {
    const parts = [];
    if (dob?.month && dob?.year) parts.push(`Born in ${dob.month} ${dob.year}, ${name} is${age ? ` ${age} years old` : ""}.`);
    if (locationSummary) parts.push(`${firstName} currently lives in ${locationSummary}.`);
    if (isPaid) {
      if (currentAddr) parts.push(`${firstName}'s current address is ${currentAddr}.`);
      if (phoneList.length) parts.push(`Phone number${phoneList.length > 1 ? "s" : ""} on file: ${phoneList.slice(0,2).join(", ")}${phoneList.length > 2 ? ` and ${phoneList.length - 2} others` : ""}.`);
      if (emailList.length) parts.push(`Known email address${emailList.length > 1 ? "es" : ""} include ${emailList.slice(0,2).join(" and ")}${emailList.length > 2 ? ` plus ${emailList.length - 2} others` : ""}.`);
      if (relativesList.length) parts.push(`Relatives include ${relativesList.slice(0,3).join(", ")}.`);
    } else {
      parts.push(`Unlock the full report to view ${firstName}'s complete contact information, phone numbers, email addresses, and relatives.`);
    }
    return parts.join(" ");
  })();

  const isSimpleLookup = lookupType === "phone_lookup" || lookupType === "address_lookup" || lookupType === "carrier_lookup";

  if (loading) return (
    <>
      <Header />
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-green-600 mx-auto mb-3" />
          <p className="text-slate-600 font-medium">Loading report…</p>
        </div>
      </main>
      <Footer />
    </>
  );

  return (
    <>
      <Helmet>
        <title>{name} – {pageTitle} | MintSlip</title>
      </Helmet>
      <Header />

      <main className="min-h-screen bg-slate-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">

          {/* Back */}
          <button
            onClick={() => navigate("/people-search")}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-5 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Search
          </button>

          {/* ── Hero ── */}
          <div className="bg-white rounded-xl border border-slate-200 mb-4 px-6 py-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                {lookupType === "carrier_lookup" ? (
                  <>
                    <div className="flex items-center gap-2 mb-1">
                      <Phone className="w-5 h-5 text-slate-400" />
                      <h1 className="text-2xl font-extrabold text-slate-900 leading-tight">{d?.phone || query}</h1>
                    </div>
                    {d?.region && <p className="text-sm text-slate-600 mt-0.5">{d.region}</p>}
                    <p className="text-sm text-slate-500 mt-0.5">
                      {d?.valid === false ? "Invalid number" : "Valid number"}{d?.countryCode ? ` · ${d.countryCode}` : ""}
                    </p>
                  </>
                ) : (
                  <>
                    <h1 className="text-2xl font-extrabold text-slate-900 leading-tight">{name}</h1>
                    <div className="mt-1.5 space-y-0.5">
                      {(age || dob?.month) && (
                        <p className="text-sm text-slate-600">
                          Age {age ?? "Unknown"}{dob?.month && dob?.year ? `, Born ${dob.month} ${dob.year}` : ""}
                        </p>
                      )}
                      {locationSummary && <p className="text-sm text-slate-600">Lives in {locationSummary}</p>}
                      {phoneList.length > 0 && (
                        <p className="text-sm">
                          {isPaid
                            ? <span className="text-slate-600">{phoneList[0]}</span>
                            : <span className="blur-[5px] select-none text-slate-400">{phoneList[0]}</span>
                          }
                        </p>
                      )}
                    </div>
                  </>
                )}
              </div>
              {isPaid ? (
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="flex items-center gap-2 text-green-700 text-sm font-semibold bg-green-50 border border-green-200 px-3 py-1.5 rounded-full">
                    <CheckCircle className="w-4 h-4" /> Unlocked
                  </div>
                  <button
                    onClick={() => window.print()}
                    className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 border border-slate-200 rounded-lg px-3 py-1.5 transition-colors print:hidden"
                  >
                    <Download className="w-3.5 h-3.5" /> Print
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-amber-600 text-xs font-semibold bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full flex-shrink-0">
                  <Lock className="w-3 h-3" /> Preview Only
                </div>
              )}
            </div>
          </div>

          {/* ── Simple lookup (phone / address) ── */}
          {isSimpleLookup && (
            <div className="bg-white rounded-xl border border-slate-200 mb-4 overflow-hidden">
              <div className="px-6 py-3">
                <SimpleLookupResult data={d} lookupType={lookupType} blurred={!isPaid} query={query} />
                {!d && <p className="text-sm text-slate-400 py-6 text-center">No preview data available.</p>}
              </div>
              {!isPaid && (
                <div className="px-6 pb-6 pt-3 border-t border-slate-100 space-y-3">
                  <button onClick={handleUnlock} disabled={unlocking}
                    className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50">
                    {unlocking ? <><Loader2 className="w-5 h-5 animate-spin" /> Redirecting…</> : <><Unlock className="w-5 h-5" /> Unlock Full Report{price ? ` – $${price.toFixed(2)}` : ""}</>}
                  </button>
                  <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400">
                    <Lock className="w-3 h-3" /> Secured by Stripe
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Name / Background report layout ── */}
          {!isSimpleLookup && (
            <>
              {/* Current Address */}
              {currentAddr && (
                <Section icon={Home} title="Current Address" description={`The most recently reported address for ${firstName}.`}>
                  <Locked blurred={!isPaid}>
                    <p className="font-semibold text-slate-800 text-base">{currentAddr}</p>
                  </Locked>
                  {isPaid && (
                    <div className="mt-4 rounded-xl overflow-hidden border border-slate-200">
                      <iframe
                        title="map"
                        src={`https://maps.google.com/maps?q=${encodeURIComponent(currentAddr)}&output=embed`}
                        width="100%"
                        height="280"
                        style={{ border: 0, display: "block" }}
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                      />
                    </div>
                  )}
                </Section>
              )}

              {/* Phone Numbers */}
              {phoneList.length > 0 && (
                <Section icon={Phone} title="Phone Numbers" description={`Current and past phone numbers for ${firstName}.`}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {phoneList.map((ph, i) => (
                      <div key={i} className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                        <Locked blurred={!isPaid}>
                          <p className="font-semibold text-slate-800 text-sm">{ph}</p>
                        </Locked>
                        {i === 0 && isPaid && (
                          <p className="text-xs text-green-700 font-semibold mt-1">Possible Primary Phone</p>
                        )}
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {/* Email Addresses */}
              {emailList.length > 0 && (
                <Section icon={Mail} title="Email Addresses" description={`Known email addresses for ${firstName}.`}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {emailList.map((em, i) => (
                      <div key={i} className="py-1.5 px-3 bg-slate-50 rounded-lg border border-slate-100">
                        <Locked blurred={!isPaid}>
                          <p className="text-sm text-slate-700">{em}</p>
                        </Locked>
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {/* Previous Addresses */}
              {pastAddrs.length > 0 && (
                <Section icon={MapPin} title="Previous Addresses" description={`All previously reported addresses for ${firstName}.`}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {pastAddrs.map((addr, i) => (
                      <div key={i} className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                        <Locked blurred={!isPaid}>
                          <p className="text-sm font-medium text-slate-700">{addr}</p>
                        </Locked>
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {/* Possible Relatives */}
              {relativesList.length > 0 && (
                <Section icon={Users} title="Possible Relatives" description={`May include parents, spouse, siblings, and children of ${firstName}.`}>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {relativesList.map((rel, i) => (
                      <div key={i} className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                        <p className="text-sm font-semibold text-slate-800">{rel}</p>
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {/* FAQ */}
              <div className="bg-white rounded-xl border border-slate-200 mb-4 px-6 py-5">
                <h2 className="text-xl font-bold text-slate-900 mb-4">Frequently Asked Questions</h2>
                <div className="space-y-2">
                  {faqs.map((faq, i) => <FaqItem key={i} question={faq.q} answer={faq.a} />)}
                </div>
              </div>

              {/* Background Profile narrative */}
              <div className="bg-white rounded-xl border border-slate-200 mb-4 px-6 py-5">
                <h2 className="text-xl font-bold text-slate-900 mb-3">Background Profile on {name}</h2>
                <p className="text-sm text-slate-600 leading-relaxed">{narrative}</p>
              </div>
            </>
          )}

        </div>
      </main>

      <Footer />
    </>
  );
}

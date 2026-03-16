import { useState, useEffect } from "react";
import { useParams, useSearchParams, useLocation, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  Lock, CheckCircle, Download, Loader2, Unlock, ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";

function InfoRow({ label, value, blurred }) {
  if (!value || (Array.isArray(value) && value.length === 0)) return null;
  const display = Array.isArray(value) ? value.join(", ") : value;
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 py-2.5 border-b border-slate-100 last:border-0">
      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide sm:w-44 flex-shrink-0">{label}</span>
      <span className={`text-sm flex-1 ${blurred ? "blur-[4px] select-none text-slate-400" : "text-slate-800"}`}>{display}</span>
    </div>
  );
}

function AddressRow({ label, value, blurred }) {
  if (!value || (Array.isArray(value) && value.length === 0)) return null;
  const addresses = Array.isArray(value) ? value : [value];
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 py-2.5 border-b border-slate-100 last:border-0">
      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide sm:w-44 flex-shrink-0">{label}</span>
      <div className="flex-1 space-y-1">
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

function PhoneRow({ label, value, blurred }) {
  if (!value || (Array.isArray(value) && value.length === 0)) return null;
  const phones = Array.isArray(value) ? value : [value];
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 py-2.5 border-b border-slate-100 last:border-0">
      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide sm:w-44 flex-shrink-0">{label}</span>
      <div className="flex-1 space-y-1">
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

function DobRow({ label, value, blurred }) {
  if (!value) return null;
  const parsed = parseDob(value);
  if (!parsed) return <InfoRow label={label} value={value} blurred={blurred} />;
  const { month, day, year, age } = parsed;
  const ageStr = age && age > 0 && age < 130 ? ` (Age ${age})` : "";
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 py-2.5 border-b border-slate-100 last:border-0">
      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide sm:w-44 flex-shrink-0">{label}</span>
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

function ResultFields({ data, lookupType, blurred }) {
  if (!data) return null;
  const b = blurred;
  if (lookupType === "phone_lookup") return (
    <>
      <InfoRow    label="Name"             value={data.name}              blurred={b} />
      <InfoRow    label="Carrier"          value={data.carrier}           blurred={false} />
      <InfoRow    label="Line Type"        value={data.lineType}          blurred={false} />
      <InfoRow    label="Location"         value={data.location}          blurred={false} />
      <InfoRow    label="Spam Risk"        value={data.spamRisk}          blurred={false} />
      <InfoRow    label="Caller Type"      value={data.callerType}        blurred={false} />
      <AddressRow label="Possible Address" value={data.possibleAddress}   blurred={b} />
      <InfoRow    label="Relatives"        value={data.possibleRelatives} blurred={b} />
    </>
  );
  if (lookupType === "name_lookup") return (
    <>
      <InfoRow    label="Full Name"      value={data.fullName}          blurred={false} />
      <DobRow     label="Date of Birth"  value={data.dateOfBirth}       blurred={b} />
      <InfoRow    label="State"          value={data.state}             blurred={false} />
      <AddressRow label="Addresses"      value={data.possibleAddresses} blurred={b} />
      <PhoneRow   label="Phone Numbers"  value={data.possiblePhones}    blurred={b} />
      <InfoRow    label="Emails"         value={data.emails}            blurred={b} />
      <InfoRow    label="Relatives"      value={data.possibleRelatives} blurred={b} />
    </>
  );
  if (lookupType === "address_lookup") return (
    <>
      <InfoRow    label="Address"        value={data.address}          blurred={false} />
      <InfoRow    label="Property Owner" value={data.propertyOwner}    blurred={b} />
      <InfoRow    label="Residents"      value={data.residents}        blurred={b} />
      <InfoRow    label="Est. Value"     value={data.estimatedValue}   blurred={b} />
      <InfoRow    label="Property Type"  value={data.propertyType}     blurred={false} />
      <InfoRow    label="Year Built"     value={data.yearBuilt}        blurred={false} />
      <InfoRow    label="Sq. Feet"       value={data.squareFeet}       blurred={false} />
      <PhoneRow   label="Phone Numbers"  value={data.associatedPhones} blurred={b} />
    </>
  );
  return (
    <>
      <InfoRow    label="Full Name"       value={data.fullName}          blurred={false} />
      <DobRow     label="Date of Birth"   value={data.dateOfBirth}       blurred={b} />
      <AddressRow label="Current Address" value={data.currentAddress}    blurred={b} />
      <AddressRow label="Past Addresses"  value={data.pastAddresses}     blurred={b} />
      <PhoneRow   label="Phone Numbers"   value={data.phones}            blurred={b} />
      <InfoRow    label="Emails"          value={data.emails}            blurred={b} />
      <InfoRow    label="Relatives"       value={data.possibleRelatives} blurred={b} />
      <InfoRow    label="Public Records"  value={data.publicRecords}     blurred={b} />
      <InfoRow    label="Education"       value={data.education}         blurred={false} />
    </>
  );
}

export default function PeopleSearchResult() {
  const { searchId } = useParams();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  const userToken = localStorage.getItem("userToken");
  const authHeaders = userToken
    ? { "Content-Type": "application/json", "Authorization": `Bearer ${userToken}` }
    : { "Content-Type": "application/json" };

  // State passed from search results page
  const passed = location.state || {};
  const [preview] = useState(passed.preview || null);
  const [lookupType, setLookupType] = useState(passed.lookupType || null);
  const [price] = useState(passed.price || null);
  const [query] = useState(passed.query || "");

  const [fullResult, setFullResult] = useState(null);
  const [isPaid, setIsPaid] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [loading, setLoading] = useState(false);

  // On mount: check for Stripe redirect or already-paid
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
      if (data.alreadyPaid && data.result) {
        setFullResult(data.result);
        setIsPaid(true);
        return;
      }
      if (data.url) window.location.href = data.url;
    } catch {
      toast.error("Checkout failed. Please try again.");
    } finally {
      setUnlocking(false);
    }
  };

  const displayData = isPaid ? fullResult : preview;
  const tabLabels = { phone_lookup: "Reverse Phone Lookup", name_lookup: "Name Lookup", address_lookup: "Address Lookup", background_report: "Full Background Report" };
  const pageTitle = lookupType ? tabLabels[lookupType] || "People Search" : "People Search";

  return (
    <>
      <Helmet>
        <title>{pageTitle} Result | MintSlip</title>
      </Helmet>
      <Header />

      <main className="min-h-screen bg-slate-50 py-10 px-4">
        <div className="max-w-2xl mx-auto">

          {/* Back button */}
          <button
            onClick={() => navigate("/people-search")}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Search
          </button>

          {loading ? (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-green-600 mx-auto mb-3" />
              <p className="text-slate-600 font-medium">Loading report…</p>
            </div>
          ) : (
            <div className={`bg-white rounded-xl border shadow-sm overflow-hidden ${isPaid ? "border-green-200" : "border-slate-200"}`}>

              {/* Header */}
              <div className={`flex items-center justify-between px-6 py-4 border-b ${isPaid ? "bg-green-50 border-green-100" : "bg-slate-50 border-slate-100"}`}>
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">{pageTitle}</p>
                  {query && <p className="text-sm font-semibold text-slate-800">{query}</p>}
                </div>
                {isPaid ? (
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-green-700 text-sm font-semibold">
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
                  <div className="flex items-center gap-1.5 text-amber-600 text-xs font-semibold bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                    <Lock className="w-3 h-3" /> Preview Only
                  </div>
                )}
              </div>

              {/* Data rows */}
              <div className="px-6 py-2">
                <ResultFields data={displayData} lookupType={lookupType} blurred={!isPaid} />
                {!displayData && (
                  <p className="text-sm text-slate-400 py-6 text-center">No preview data available.</p>
                )}
              </div>

              {/* Unlock section */}
              {!isPaid && (
                <div className="px-6 pb-6 pt-3 border-t border-slate-100 space-y-3">
                  <p className="text-xs text-slate-400 text-center">
                    Blurred fields (addresses, phone numbers, email, exact birth date) are fully revealed after purchase.
                  </p>
                  <button
                    onClick={handleUnlock}
                    disabled={unlocking}
                    className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-3.5 rounded-xl transition-colors disabled:opacity-50 text-base"
                  >
                    {unlocking
                      ? <><Loader2 className="w-5 h-5 animate-spin" /> Redirecting…</>
                      : <><Unlock className="w-5 h-5" /> Unlock Full Report{price ? ` – $${price.toFixed(2)}` : ""}</>
                    }
                  </button>
                  <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400">
                    <Lock className="w-3 h-3" /> Secured by Stripe · Cards, Apple Pay & Google Pay
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}

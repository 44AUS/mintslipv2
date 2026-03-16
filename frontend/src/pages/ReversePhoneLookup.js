import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Phone, Search, CheckCircle, Shield, Lock, ArrowRight, ChevronDown } from "lucide-react";
import { useState } from "react";

function FAQ({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50 transition-colors"
      >
        <span className="text-sm font-medium text-slate-800">{q}</span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="px-5 pb-4 text-sm text-slate-500 leading-relaxed border-t border-slate-100">{a}</div>}
    </div>
  );
}

export default function ReversePhoneLookup() {
  const navigate = useNavigate();
  return (
    <>
      <Helmet>
        <title>Reverse Phone Lookup – Find Who's Calling | MintSlip</title>
        <meta name="description" content="Instantly identify unknown callers. Enter any phone number to get the name, carrier, location, spam risk, and possible address. Pay only $0.99 per lookup." />
      </Helmet>
      <Header />

      <main>
        {/* Hero */}
        <section className="bg-gradient-to-b from-green-50 to-white py-16 px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-white border border-green-200 text-green-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-5">
              <Shield className="w-3.5 h-3.5" /> Only $0.99 Per Lookup
            </div>
            <h1 className="text-4xl font-bold text-slate-900 mb-4">Reverse Phone Lookup</h1>
            <p className="text-lg text-slate-500 mb-8 max-w-lg mx-auto">
              Find out who's calling. Get the name, carrier, and location behind any phone number — instantly.
            </p>
            <button
              onClick={() => navigate("/people-search")}
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-8 py-3.5 rounded-xl transition-colors text-base"
            >
              <Search className="w-4 h-4" /> Search a Phone Number
            </button>
            <p className="text-xs text-slate-400 mt-3">No subscription · Pay per lookup · Instant results</p>
          </div>
        </section>

        {/* How it works */}
        <section className="py-14 px-4 bg-white">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-900 text-center mb-10">How It Works</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { num: "1", icon: Phone,        title: "Enter the Phone Number",    desc: "Type in the 10-digit phone number you want to look up." },
                { num: "2", icon: Search,        title: "We Search Public Records",  desc: "Our system queries public databases for information linked to that number." },
                { num: "3", icon: CheckCircle,   title: "Unlock Your Report",        desc: "Pay just $0.99 and instantly access the full caller report." },
              ].map(s => (
                <div key={s.num} className="text-center">
                  <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <s.icon className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="text-xs font-bold text-green-600 mb-1">STEP {s.num}</div>
                  <h3 className="text-base font-semibold text-slate-800 mb-2">{s.title}</h3>
                  <p className="text-sm text-slate-500">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* What you get */}
        <section className="py-14 px-4 bg-slate-50">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-900 text-center mb-8">What Your Report Includes</h2>
            <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
              {[
                { label: "Full Name",          desc: "The name associated with the phone number" },
                { label: "Carrier",            desc: "The wireless or landline carrier" },
                { label: "Line Type",          desc: "Mobile, landline, or VoIP" },
                { label: "Location",           desc: "City and state the number is registered to" },
                { label: "Spam Risk",          desc: "Low, medium, or high spam risk rating" },
                { label: "Possible Address",   desc: "Potential physical address on file" },
                { label: "Possible Relatives", desc: "Other people associated with this number" },
              ].map(({ label, desc }) => (
                <div key={label} className="flex items-start gap-3 px-5 py-3.5">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-sm font-medium text-slate-800">{label}</span>
                    <span className="text-sm text-slate-400"> — {desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-14 px-4 bg-white">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-900 text-center mb-8">Frequently Asked Questions</h2>
            <div className="space-y-3">
              <FAQ q="Is reverse phone lookup legal?" a="Yes. Reverse phone lookup using publicly available information is legal in the United States. We only surface data that is publicly accessible from open records." />
              <FAQ q="How accurate are the results?" a="Results are sourced from public records and may not always be complete or up-to-date. We display the most relevant matches found in our database." />
              <FAQ q="How much does it cost?" a="Each reverse phone lookup costs just $0.99. There are no subscriptions or recurring charges — you only pay for the lookups you perform." />
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-14 px-4 bg-green-600 text-white text-center">
          <div className="max-w-xl mx-auto">
            <h2 className="text-2xl font-bold mb-3">Ready to identify who's calling?</h2>
            <p className="text-green-100 mb-6">Enter any phone number and get instant results for just $0.99.</p>
            <button
              onClick={() => navigate("/people-search")}
              className="inline-flex items-center gap-2 bg-white text-green-700 font-semibold px-8 py-3.5 rounded-xl hover:bg-green-50 transition-colors"
            >
              Search Now <ArrowRight className="w-4 h-4" />
            </button>
            <div className="flex items-center justify-center gap-1.5 text-green-200 text-xs mt-4">
              <Lock className="w-3 h-3" /> Secured by Stripe
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { User, Search, CheckCircle, Shield, Lock, ArrowRight, ChevronDown } from "lucide-react";
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

export default function FindPersonByName() {
  const navigate = useNavigate();
  return (
    <>
      <Helmet>
        <title>Find a Person by Name – People Search | MintSlip</title>
        <meta name="description" content="Search public records by full name. Find addresses, phone numbers, relatives, and age range for any person. Pay only $1.49 per lookup — no subscription needed." />
      </Helmet>
      <Header />

      <main>
        {/* Hero */}
        <section className="bg-gradient-to-b from-green-50 to-white py-16 px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-white border border-green-200 text-green-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-5">
              <Shield className="w-3.5 h-3.5" /> Only $1.49 Per Lookup
            </div>
            <h1 className="text-4xl font-bold text-slate-900 mb-4">Find a Person by Name</h1>
            <p className="text-lg text-slate-500 mb-8 max-w-lg mx-auto">
              Search public records by name. Discover addresses, phone numbers, relatives, and more.
            </p>
            <button
              onClick={() => navigate("/people-search")}
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-8 py-3.5 rounded-xl transition-colors text-base"
            >
              <Search className="w-4 h-4" /> Search a Name
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
                { num: "1", icon: User,        title: "Enter First & Last Name",   desc: "Type the person's first and last name. Optionally filter by state." },
                { num: "2", icon: Search,       title: "We Search Public Records",  desc: "We scan public databases for matching individuals and their associated data." },
                { num: "3", icon: CheckCircle,  title: "Unlock Your Report",        desc: "Pay just $1.49 and instantly access all addresses, phones, and relatives." },
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
                { label: "Possible Addresses", desc: "Current and past addresses on file" },
                { label: "Age Range",           desc: "Estimated age range of the individual" },
                { label: "Phone Numbers",       desc: "Phone numbers associated with this person" },
                { label: "Possible Relatives",  desc: "Family members and associated individuals" },
                { label: "State",               desc: "State where this person is most recently located" },
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
              <FAQ q="What if there are multiple people with the same name?" a="Our search returns the most likely matches based on the name and state you provide. We surface the top results from public records." />
              <FAQ q="What information do I need to search?" a="You only need a first and last name to run a search. Adding a state narrows the results and improves accuracy." />
              <FAQ q="How much does it cost?" a="Each name lookup costs $1.49. You only pay when you choose to unlock a result — no subscriptions or hidden fees." />
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-14 px-4 bg-green-600 text-white text-center">
          <div className="max-w-xl mx-auto">
            <h2 className="text-2xl font-bold mb-3">Ready to find someone?</h2>
            <p className="text-green-100 mb-6">Enter a name and get instant public record results for just $1.49.</p>
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

import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Phone, Search, CheckCircle, Shield, Lock, ArrowRight, ChevronDown, AlertCircle, PhoneOff, Bot, HelpCircle } from "lucide-react";
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

const CALLER_TYPES = [
  { icon: AlertCircle, label: "Spam Callers",    desc: "Numbers flagged as spam by our database.", color: "text-red-500",    bg: "bg-red-50" },
  { icon: PhoneOff,    label: "Telemarketers",   desc: "Sales and marketing calls you didn't ask for.", color: "text-orange-500", bg: "bg-orange-50" },
  { icon: HelpCircle,  label: "Unknown Numbers", desc: "Numbers with no public record — find out who they are.", color: "text-slate-500",  bg: "bg-slate-100" },
  { icon: Bot,         label: "Robocalls",        desc: "Automated calls — identify the source instantly.", color: "text-blue-500",   bg: "bg-blue-50" },
];

export default function WhoCalledMe() {
  const navigate = useNavigate();
  return (
    <>
      <Helmet>
        <title>Who Called Me? Reverse Phone Lookup | MintSlip</title>
        <meta name="description" content="Identify unknown callers instantly. Enter any phone number to discover the name, carrier, location, and spam risk. Pay only $0.99 — no subscription needed." />
      </Helmet>
      <Header />

      <main>
        {/* Hero */}
        <section className="bg-gradient-to-b from-green-50 to-white py-16 px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-white border border-green-200 text-green-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-5">
              <Shield className="w-3.5 h-3.5" /> Only $0.99 Per Lookup
            </div>
            <h1 className="text-4xl font-bold text-slate-900 mb-4">Who Called Me?</h1>
            <p className="text-lg text-slate-500 mb-8 max-w-lg mx-auto">
              Identify unknown callers instantly. Enter any phone number to discover the name and details behind the call.
            </p>
            <button
              onClick={() => navigate("/people-search")}
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-8 py-3.5 rounded-xl transition-colors text-base"
            >
              <Search className="w-4 h-4" /> Identify the Caller
            </button>
            <p className="text-xs text-slate-400 mt-3">No subscription · Pay per lookup · Instant results</p>
          </div>
        </section>

        {/* Common caller types */}
        <section className="py-14 px-4 bg-white">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-900 text-center mb-4">Identify Any Caller Type</h2>
            <p className="text-center text-slate-500 text-sm mb-10 max-w-lg mx-auto">
              Whether it's a blocked number, an unknown caller, or a suspicious robocall, we can help you find out who it is.
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              {CALLER_TYPES.map(({ icon: Icon, label, desc, color, bg }) => (
                <div key={label} className="flex items-start gap-4 bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${bg}`}>
                    <Icon className={`w-5 h-5 ${color}`} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{label}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-14 px-4 bg-slate-50">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-900 text-center mb-10">How It Works</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { num: "1", icon: Phone,       title: "Enter the Phone Number",    desc: "Type in the 10-digit number that called you." },
                { num: "2", icon: Search,       title: "We Search Public Records",  desc: "Our system looks up the number in public databases and carrier records." },
                { num: "3", icon: CheckCircle,  title: "Unlock the Caller's Info",  desc: "Pay just $0.99 to see the caller's name, location, and spam risk score." },
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

        {/* FAQ */}
        <section className="py-14 px-4 bg-white">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-900 text-center mb-8">Frequently Asked Questions</h2>
            <div className="space-y-3">
              <FAQ q="Can I look up a number that called me from a blocked ID?" a="If you have the number (even if it showed as spam or unknown), you can enter it here for a full report. Completely blocked caller IDs with no number cannot be looked up." />
              <FAQ q="How do I know if a call was spam?" a="Our report includes a spam risk rating (Low, Medium, or High) based on community reports and carrier data associated with that number." />
              <FAQ q="How much does it cost to find out who called me?" a="Each reverse phone lookup costs just $0.99. No monthly fees, no subscriptions — you only pay for the lookups you use." />
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-14 px-4 bg-green-600 text-white text-center">
          <div className="max-w-xl mx-auto">
            <h2 className="text-2xl font-bold mb-3">Stop wondering who called you.</h2>
            <p className="text-green-100 mb-6">Get the caller's name and details instantly for just $0.99.</p>
            <button
              onClick={() => navigate("/people-search")}
              className="inline-flex items-center gap-2 bg-white text-green-700 font-semibold px-8 py-3.5 rounded-xl hover:bg-green-50 transition-colors"
            >
              Identify Now <ArrowRight className="w-4 h-4" />
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

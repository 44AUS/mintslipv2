import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import {
  Scale, ShieldCheck, FileText, Download, CheckCircle, Clock, Users,
  ArrowRight, ChevronDown, ChevronUp, Landmark, Home, Briefcase,
  HeartPulse, Stamp, PenTool, Lock, AlertTriangle,
} from "lucide-react";

const PRICE = "9.99";

const COVERS = [
  { icon: Landmark, title: "Banking & finances",     desc: "Deposit, withdraw, write checks, and manage accounts and investments on your behalf." },
  { icon: Home,     title: "Real estate",            desc: "Buy, sell, lease, refinance, and manage property in your name." },
  { icon: Briefcase,title: "Business interests",     desc: "Operate and make decisions for a business you own while you're unavailable." },
  { icon: FileText, title: "Taxes & government",     desc: "File returns, deal with the IRS, and manage Social Security and Medicare benefits." },
  { icon: ShieldCheck, title: "Insurance & claims",  desc: "File claims, manage policies, and handle legal claims and settlements." },
  { icon: Users,    title: "Family maintenance",     desc: "Pay household bills and support dependents from your funds." },
];

const STEPS = [
  { n: "1", title: "Name your agent",     desc: "Choose the person you trust to act for you, plus a successor in case they can't serve." },
  { n: "2", title: "Choose the powers",   desc: "Grant all fifteen standard powers, or check only the ones you want your agent to have." },
  { n: "3", title: "Set the terms",       desc: "Decide whether it takes effect immediately or only if you become incapacitated." },
  { n: "4", title: "Sign & notarize",     desc: "Download the PDF, sign it in front of a notary and witnesses, and give copies to your agent." },
];

const FEATURES = [
  { icon: ShieldCheck, title: "Durability clause included", desc: "Stays valid if you become incapacitated — the whole point of a durable POA." },
  { icon: Stamp,       title: "Notary block built in",      desc: "Notary acknowledgment page ready for your commissioned notary to complete." },
  { icon: Users,       title: "Witness attestation",        desc: "Two-witness block for states that require witnessed signatures." },
  { icon: PenTool,     title: "Draw your signature",        desc: "Sign on screen with your mouse, finger, or stylus — or sign by hand later." },
  { icon: Clock,       title: "Ready in minutes",           desc: "No appointments or hourly fees. Fill out a form and download instantly." },
  { icon: Download,    title: "Instant PDF",                desc: "Multi-page, print-ready letter-size document. Re-download any time." },
];

const FAQS = [
  {
    q: "What is a durable general power of attorney?",
    a: "A durable general power of attorney is a legal document in which you (the Principal) authorize another person (your Agent, or attorney-in-fact) to manage your financial and property affairs. 'General' means the authority is broad rather than limited to a single transaction. 'Durable' means it remains valid even if you later become incapacitated, which is when most people need it most.",
  },
  {
    q: "What does 'durable' actually change?",
    a: "A standard power of attorney automatically terminates the moment you lose mental capacity. A durable one expressly survives your incapacity, so your agent can keep paying your bills, managing your accounts, and handling your property without a court getting involved. Without a durable POA, your family may have to petition a court for guardianship or conservatorship — an expensive, slow, and public process.",
  },
  {
    q: "Does a power of attorney cover medical decisions?",
    a: "No. This document covers financial and property matters only. Health care decisions require a separate instrument — usually called a health care power of attorney, medical power of attorney, health care proxy, or advance directive depending on your state. Most people put both in place at the same time.",
  },
  {
    q: "Does it need to be notarized or witnessed?",
    a: "In the large majority of states a power of attorney must be notarized to be effective, and many states additionally require two witnesses who are not the agent. Even where witnesses aren't strictly required, banks, brokerages, and title companies routinely refuse to honor a POA that isn't notarized. This generator includes both the notary acknowledgment and a two-witness attestation block.",
  },
  {
    q: "When does it take effect?",
    a: "You choose. An immediate power of attorney is effective as soon as it's signed and continues through any later incapacity. A 'springing' power of attorney takes effect only once a physician certifies you can no longer manage your own affairs. Immediate is more practical — springing POAs often stall because institutions demand proof of incapacity before they'll act.",
  },
  {
    q: "Can I limit what my agent can do?",
    a: "Yes. You can grant all fifteen standard categories of authority or check only the ones you want, and you can add written limitations in the special instructions section — for example, prohibiting the sale of your home without your children's written consent.",
  },
  {
    q: "How do I revoke it?",
    a: "While you still have capacity, you can revoke a power of attorney at any time. Sign a written revocation, deliver it to your agent, and — critically — notify every bank or institution holding a copy. A third party that hasn't received notice of the revocation can still legally rely on the original document.",
  },
  {
    q: "How much does it cost?",
    a: `A durable general power of attorney from MintSlip costs $${PRICE} as a one-time purchase, with no subscription required. An attorney typically charges several hundred dollars for the same document. You get a live preview while you build it and an instant, print-ready multi-page PDF.`,
  },
];

export default function PowerOfAttorneyLanding() {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState(null);
  const go = () => navigate("/power-of-attorney-generator");

  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>Durable General Power of Attorney Form | Create Yours for ${PRICE} | MintSlip</title>
        <meta name="description" content={`Create a Durable General Power of Attorney online in minutes. Appoint an agent to manage your finances and property, with notary and witness blocks included. Instant PDF for $${PRICE}.`} />
        <meta name="keywords" content="durable power of attorney, general power of attorney, power of attorney form, POA form, financial power of attorney, attorney-in-fact, durable POA template, power of attorney generator" />
        <meta property="og:title" content={`Durable General Power of Attorney Form | $${PRICE}`} />
        <meta property="og:description" content="Appoint a trusted agent to manage your finances and property. Durable, notary-ready, instant PDF download." />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Durable General Power of Attorney Form | MintSlip" />
        <meta name="twitter:description" content="Create a durable POA in minutes. Notary and witness blocks included." />
        <link rel="canonical" href="https://mintslip.com/durable-power-of-attorney" />

        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          "name": "MintSlip Durable General Power of Attorney Generator",
          "applicationCategory": "BusinessApplication",
          "operatingSystem": "Web",
          "offers": { "@type": "Offer", "price": PRICE, "priceCurrency": "USD" },
          "description": "Create a durable general power of attorney online, appointing an agent to manage your financial and property affairs.",
        })}</script>

        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": FAQS.map(f => ({
            "@type": "Question", "name": f.q,
            "acceptedAnswer": { "@type": "Answer", "text": f.a },
          })),
        })}</script>
      </Helmet>

      <Header />

      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-green-900 to-slate-900 text-white">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-green-500/20 rounded-full filter blur-3xl animate-pulse" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-emerald-400/10 rounded-full filter blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        </div>

        <div className="relative max-w-6xl mx-auto px-6 py-20 md:py-28 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-sm mb-6">
            <Scale className="w-4 h-4" /> Durable · Notary-ready
          </div>

          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight" style={{ fontFamily: "Outfit, sans-serif" }}>
            Durable General Power of Attorney
          </h1>

          <p className="text-lg md:text-xl text-green-100/90 max-w-3xl mx-auto mb-10">
            Appoint someone you trust to manage your money and property — and keep that authority in place
            even if you become unable to act for yourself.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button onClick={go} className="bg-green-500 hover:bg-green-600 text-white px-8 py-6 text-lg font-semibold rounded-xl gap-2">
              Create Your POA <ArrowRight className="w-5 h-5" />
            </Button>
            <div className="text-green-100/80 text-sm">
              One-time <span className="font-bold text-white">${PRICE}</span> · Instant PDF download
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 mt-12 text-sm text-green-100/80">
            <span className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400" /> Survives incapacity</span>
            <span className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400" /> Notary &amp; witness blocks</span>
            <span className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400" /> All 50 states</span>
          </div>
        </div>
      </section>

      {/* WHAT IT IS */}
      <section className="py-20 px-6 max-w-4xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold mb-6 text-center" style={{ fontFamily: "Outfit, sans-serif", color: "#1a4731" }}>
          What is a durable power of attorney?
        </h2>
        <div className="text-slate-600 text-lg leading-relaxed space-y-4">
          <p>
            A <strong>durable general power of attorney</strong> lets you name someone — your <em>Agent</em>, sometimes called an
            attorney-in-fact — to handle your financial and property matters. "General" means broad authority across your affairs
            rather than a single transaction. <strong>"Durable" means it survives your incapacity.</strong>
          </p>
          <p>
            That last word carries the weight. An ordinary power of attorney terminates automatically the instant you lose mental
            capacity. A durable one keeps working, so your agent can pay your mortgage, manage your accounts, and deal with
            insurers without interruption.
          </p>
          <p>
            Without one, your family's only option is usually to ask a court to appoint a guardian or conservator — a process that is
            slow, costly, public, and entirely avoidable with a document you can put in place today.
          </p>
        </div>

        <div className="mt-10 p-5 bg-amber-50 border border-amber-200 rounded-xl flex gap-3">
          <HeartPulse className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-900 leading-relaxed">
            <strong>This covers money, not medicine.</strong> A financial POA does not authorize health care decisions. For those you
            need a separate health care power of attorney or advance directive. Most people put both in place together.
          </p>
        </div>
      </section>

      {/* WHAT IT COVERS */}
      <section className="py-20 px-6 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center" style={{ fontFamily: "Outfit, sans-serif", color: "#1a4731" }}>
            What your agent can handle
          </h2>
          <p className="text-slate-600 text-center max-w-2xl mx-auto mb-14">
            Grant all fifteen standard powers, or check only the ones you're comfortable with.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {COVERS.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white p-6 rounded-xl border border-slate-200 hover:border-green-300 hover:shadow-md transition-all">
                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-green-700" />
                </div>
                <h3 className="font-bold text-lg text-slate-900 mb-2">{title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-20 px-6 max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold mb-14 text-center" style={{ fontFamily: "Outfit, sans-serif", color: "#1a4731" }}>
          How it works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {STEPS.map(s => (
            <div key={s.n} className="text-center">
              <div className="w-14 h-14 rounded-full bg-green-600 text-white text-xl font-bold flex items-center justify-center mx-auto mb-4">{s.n}</div>
              <h3 className="font-bold text-lg text-slate-900 mb-2">{s.title}</h3>
              <p className="text-slate-600 text-sm leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
        <div className="text-center mt-14">
          <Button onClick={go} className="bg-green-600 hover:bg-green-700 text-white px-8 py-6 text-lg font-semibold rounded-xl gap-2">
            Start Your Document <ArrowRight className="w-5 h-5" />
          </Button>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-20 px-6 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-14 text-center" style={{ fontFamily: "Outfit, sans-serif", color: "#1a4731" }}>
            What's included
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex gap-4">
                <div className="w-11 h-11 rounded-lg bg-white border border-slate-200 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-green-700" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1">{title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="py-20 px-6">
        <div className="max-w-md mx-auto bg-white border-2 border-green-200 rounded-2xl p-8 text-center shadow-sm">
          <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: "Outfit, sans-serif", color: "#1a4731" }}>Simple pricing</h2>
          <div className="my-6">
            <span className="text-5xl font-bold text-slate-900">${PRICE}</span>
            <span className="text-slate-500 ml-2">one-time</span>
          </div>
          <ul className="text-left space-y-3 mb-8">
            {[
              "Full multi-page durable POA document",
              "All 15 standard powers, individually selectable",
              "Notary acknowledgment + witness blocks",
              "Successor agent and agent acceptance pages",
              "Live preview and instant PDF download",
            ].map(t => (
              <li key={t} className="flex items-start gap-3 text-slate-700">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm">{t}</span>
              </li>
            ))}
          </ul>
          <Button onClick={go} className="w-full bg-green-600 hover:bg-green-700 text-white py-6 text-lg font-semibold rounded-xl">
            Create Your POA
          </Button>
          <p className="text-xs text-slate-400 mt-4">No subscription required. Secured by Stripe.</p>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-6 bg-slate-50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-14 text-center" style={{ fontFamily: "Outfit, sans-serif", color: "#1a4731" }}>
            Frequently asked questions
          </h2>
          <div className="space-y-3">
            {FAQS.map((f, i) => (
              <div key={f.q} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between gap-4 p-5 text-left hover:bg-slate-50 transition-colors"
                >
                  <span className="font-semibold text-slate-900">{f.q}</span>
                  {openFaq === i ? <ChevronUp className="w-5 h-5 text-slate-400 flex-shrink-0" /> : <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0" />}
                </button>
                {openFaq === i && <div className="px-5 pb-5 text-slate-600 leading-relaxed text-sm">{f.a}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-20 px-6 bg-gradient-to-br from-green-900 to-slate-900 text-white text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ fontFamily: "Outfit, sans-serif" }}>
            Put it in place before you need it
          </h2>
          <p className="text-green-100/90 mb-8 text-lg">
            A power of attorney only works if it's signed while you still have capacity. Ten minutes today can spare your family a
            guardianship case later.
          </p>
          <Button onClick={go} className="bg-green-500 hover:bg-green-600 text-white px-8 py-6 text-lg font-semibold rounded-xl gap-2">
            Create Your Power of Attorney <ArrowRight className="w-5 h-5" />
          </Button>
        </div>
      </section>

      {/* DISCLAIMER */}
      <section className="py-10 px-6 bg-white">
        <div className="max-w-3xl mx-auto p-5 bg-amber-50 border border-amber-200 rounded-xl flex gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800 leading-relaxed">
            <strong>Disclaimer:</strong> MintSlip provides a self-service document preparation tool and is not a law firm. Nothing on
            this page is legal advice, and using this generator does not create an attorney–client relationship. Power of attorney
            requirements — including witness and notarization rules — vary by state. For large estates, blended families, or complex
            circumstances, have a licensed attorney in your state review the document before you sign.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import {
  ShieldAlert, FileText, Download, CheckCircle, Clock, Scale, Mail,
  ArrowRight, ChevronDown, ChevronUp, Ban, Copyright, MessageSquareWarning,
  PhoneOff, FileWarning, Lock, PenTool,
} from "lucide-react";

const PRICE = "9.99";

const USE_CASES = [
  { icon: Ban,                   title: "Harassment & Stalking",       desc: "Formally demand that someone stop contacting, following, or intimidating you — and create a paper trail if it escalates." },
  { icon: MessageSquareWarning,  title: "Defamation & Slander",        desc: "Demand a retraction of false statements damaging your reputation, and removal of defamatory posts or reviews." },
  { icon: Copyright,             title: "Copyright & Trademark",       desc: "Stop unauthorized use of your photos, writing, logo, or brand name by another person or business." },
  { icon: PhoneOff,              title: "Debt Collector Calls",        desc: "Invoke your FDCPA right to require a collection agency to stop contacting you in writing." },
  { icon: FileWarning,           title: "Breach of Contract",          desc: "Put a party on formal notice that they are violating your agreement and must cure the breach." },
  { icon: Scale,                 title: "Other Unlawful Conduct",      desc: "Describe any other conduct in your own words and generate a properly structured demand letter." },
];

const STEPS = [
  { n: "1", title: "Choose your situation", desc: "Pick the type of violation — harassment, defamation, infringement, debt collection, breach of contract, or other." },
  { n: "2", title: "Fill in the details",   desc: "Enter your information, the recipient's information, and a factual description of the conduct you want stopped." },
  { n: "3", title: "Set your deadline",     desc: "Choose how many days the recipient has to comply and how the letter will be delivered." },
  { n: "4", title: "Download instantly",    desc: "Preview the letter live, pay $9.99, and download a print-ready PDF you can sign and send." },
];

const FEATURES = [
  { icon: FileText, title: "Attorney-style formatting", desc: "Proper letterhead, subject line, demand paragraphs, and reservation-of-rights language." },
  { icon: Clock,    title: "Ready in minutes",          desc: "No appointments or consultation fees. Fill out a form and download immediately." },
  { icon: PenTool,  title: "Signature included",        desc: "Add a handwriting-style signature or upload an image of your own." },
  { icon: Mail,     title: "Delivery language built in",desc: "Certified mail, email, or hand delivery notations are added automatically." },
  { icon: Download, title: "Instant PDF download",      desc: "Print-ready letter-size PDF. Re-download any time from your account." },
  { icon: Lock,     title: "Private & secure",          desc: "Your details are used to build your document and are never sold or shared." },
];

const FAQS = [
  {
    q: "What is a cease and desist letter?",
    a: "A cease and desist letter is a formal written demand asking someone to stop a specific activity that harms you or violates your legal rights. It states what the conduct is, demands that it stop by a certain date, and warns of legal consequences if it continues. It is commonly used for harassment, defamation, copyright and trademark infringement, debt collection, and contract breaches.",
  },
  {
    q: "Is a cease and desist letter legally binding?",
    a: "A cease and desist letter is not a court order, so it cannot by itself force someone to act. What it does is put the recipient on formal notice, document your objection with a date, and demonstrate that you attempted to resolve the matter before litigating. Many recipients comply once they receive one, and courts often look favorably on a party that gave notice first.",
  },
  {
    q: "Do I need a lawyer to send a cease and desist letter?",
    a: "No. Individuals and businesses can and regularly do send cease and desist letters on their own behalf. A letter on an attorney's letterhead may carry more weight, but a clear, factual, properly structured letter you send yourself still creates legal notice and a documented record. For high-value or complex disputes, consult a licensed attorney in your state.",
  },
  {
    q: "How do I send a cease and desist letter?",
    a: "Certified mail with return receipt requested is the standard method, because it produces proof that the recipient received it. Many people send by certified mail and email at the same time. Always keep a copy of the signed letter along with the delivery receipt or tracking record.",
  },
  {
    q: "Can I use a cease and desist letter to stop debt collectors?",
    a: "Yes. Under the Fair Debt Collection Practices Act (15 U.S.C. § 1692c(c)), a debt collector must stop contacting you once it receives a written request to cease communication. After that, it may only contact you to confirm it is stopping or to tell you it intends to pursue a specific legal remedy. Choose the debt collection option and the letter cites that statute for you.",
  },
  {
    q: "What happens if the person ignores my letter?",
    a: "If the conduct continues past your deadline, your letter becomes valuable evidence. Depending on the situation, next steps can include filing a civil lawsuit for injunctive relief and damages, submitting a DMCA takedown notice, filing a police report for harassment, or filing a complaint with a regulator such as the CFPB for debt collection violations.",
  },
  {
    q: "How much does it cost?",
    a: `A cease and desist letter from MintSlip costs $${PRICE} as a one-time purchase, with no subscription required. That includes a live preview while you build it and an instant, print-ready PDF download. Subscribers can generate it as part of their plan.`,
  },
  {
    q: "Is this legal advice?",
    a: "No. MintSlip provides a document preparation service, not legal representation, and using our generator does not create an attorney–client relationship. If your situation involves significant money, ongoing threats to your safety, or complex legal questions, you should speak with a licensed attorney in your jurisdiction.",
  },
];

export default function CeaseAndDesistLanding() {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState(null);

  const go = () => navigate("/cease-and-desist-generator");

  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>Cease and Desist Letter Generator | Create One Online for ${PRICE} | MintSlip</title>
        <meta name="description" content={`Create a professional cease and desist letter online in minutes. Stop harassment, defamation, copyright infringement, or debt collector calls. Instant PDF download for $${PRICE}.`} />
        <meta name="keywords" content="cease and desist letter, cease and desist template, cease and desist generator, stop harassment letter, defamation letter, copyright infringement letter, debt collector cease and desist, FDCPA letter, demand letter" />
        <meta property="og:title" content={`Cease and Desist Letter Generator | Create One Online for $${PRICE}`} />
        <meta property="og:description" content="Create a professional cease and desist letter in minutes. Harassment, defamation, copyright, debt collection and more. Instant PDF." />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`Cease and Desist Letter Generator | MintSlip`} />
        <meta name="twitter:description" content="Stop harassment, defamation, or infringement with a formal demand letter. Instant PDF download." />
        <link rel="canonical" href="https://mintslip.com/cease-and-desist-letter" />

        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          "name": "MintSlip Cease and Desist Letter Generator",
          "applicationCategory": "BusinessApplication",
          "operatingSystem": "Web",
          "offers": { "@type": "Offer", "price": PRICE, "priceCurrency": "USD" },
          "description": "Create a professional cease and desist letter online for harassment, defamation, copyright infringement, debt collection, and breach of contract.",
        })}</script>

        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": FAQS.map(f => ({
            "@type": "Question",
            "name": f.q,
            "acceptedAnswer": { "@type": "Answer", "text": f.a },
          })),
        })}</script>
      </Helmet>

      <Header />

      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-green-900 to-slate-900 text-white">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-green-500/20 rounded-full filter blur-3xl animate-pulse" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-red-500/10 rounded-full filter blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        </div>

        <div className="relative max-w-6xl mx-auto px-6 py-20 md:py-28 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-sm mb-6">
            <ShieldAlert className="w-4 h-4" />
            Formal legal demand letter
          </div>

          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight" style={{ fontFamily: "Outfit, sans-serif" }}>
            Cease and Desist Letter Generator
          </h1>

          <p className="text-lg md:text-xl text-green-100/90 max-w-3xl mx-auto mb-10">
            Make it stop — in writing. Create a professional, attorney-style cease and desist letter in minutes
            to demand an end to harassment, defamation, copyright infringement, or unwanted debt collection calls.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button onClick={go} className="bg-green-500 hover:bg-green-600 text-white px-8 py-6 text-lg font-semibold rounded-xl gap-2">
              Create Your Letter <ArrowRight className="w-5 h-5" />
            </Button>
            <div className="text-green-100/80 text-sm">
              One-time <span className="font-bold text-white">${PRICE}</span> · Instant PDF download
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 mt-12 text-sm text-green-100/80">
            <span className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400" /> No lawyer required</span>
            <span className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400" /> Ready in under 5 minutes</span>
            <span className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400" /> Print-ready PDF</span>
          </div>
        </div>
      </section>

      {/* ── WHAT IT IS ── */}
      <section className="py-20 px-6 max-w-4xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold mb-6 text-center" style={{ fontFamily: "Outfit, sans-serif", color: "#1a4731" }}>
          What is a cease and desist letter?
        </h2>
        <div className="prose prose-slate max-w-none text-slate-600 text-lg leading-relaxed space-y-4">
          <p>
            A <strong>cease and desist letter</strong> is a formal written demand that someone immediately stop a specific
            activity that is harming you or violating your legal rights. It identifies the conduct, states why it is unlawful,
            sets a deadline for compliance, and warns that you are prepared to pursue legal remedies if it continues.
          </p>
          <p>
            It is not a court order — but it is often the most important first step. A well-written letter puts the recipient
            on formal notice, establishes a dated record of your objection, and frequently resolves the problem without the
            time and expense of a lawsuit. If the matter does end up in court, that documented notice works in your favor.
          </p>
          <p>
            MintSlip's generator builds the letter for you using the structure attorneys use: proper letterhead, a subject
            line, factual demand paragraphs tailored to your situation, a compliance deadline, consequences of non-compliance,
            and reservation-of-rights language.
          </p>
        </div>
      </section>

      {/* ── USE CASES ── */}
      <section className="py-20 px-6 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center" style={{ fontFamily: "Outfit, sans-serif", color: "#1a4731" }}>
            When to send a cease and desist letter
          </h2>
          <p className="text-slate-600 text-center max-w-2xl mx-auto mb-14">
            Choose your situation and the letter language is tailored automatically — including the relevant statutes.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {USE_CASES.map(({ icon: Icon, title, desc }) => (
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

      {/* ── HOW IT WORKS ── */}
      <section className="py-20 px-6 max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold mb-14 text-center" style={{ fontFamily: "Outfit, sans-serif", color: "#1a4731" }}>
          How it works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {STEPS.map(s => (
            <div key={s.n} className="text-center">
              <div className="w-14 h-14 rounded-full bg-green-600 text-white text-xl font-bold flex items-center justify-center mx-auto mb-4">
                {s.n}
              </div>
              <h3 className="font-bold text-lg text-slate-900 mb-2">{s.title}</h3>
              <p className="text-slate-600 text-sm leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
        <div className="text-center mt-14">
          <Button onClick={go} className="bg-green-600 hover:bg-green-700 text-white px-8 py-6 text-lg font-semibold rounded-xl gap-2">
            Start Your Letter <ArrowRight className="w-5 h-5" />
          </Button>
        </div>
      </section>

      {/* ── FEATURES ── */}
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

      {/* ── PRICING ── */}
      <section className="py-20 px-6">
        <div className="max-w-md mx-auto bg-white border-2 border-green-200 rounded-2xl p-8 text-center shadow-sm">
          <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: "Outfit, sans-serif", color: "#1a4731" }}>
            Simple pricing
          </h2>
          <div className="my-6">
            <span className="text-5xl font-bold text-slate-900">${PRICE}</span>
            <span className="text-slate-500 ml-2">one-time</span>
          </div>
          <ul className="text-left space-y-3 mb-8">
            {[
              "Professionally formatted PDF letter",
              "Tailored language for your situation",
              "Live preview while you build it",
              "Signature and letterhead included",
              "Instant download — no waiting",
            ].map(t => (
              <li key={t} className="flex items-start gap-3 text-slate-700">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm">{t}</span>
              </li>
            ))}
          </ul>
          <Button onClick={go} className="w-full bg-green-600 hover:bg-green-700 text-white py-6 text-lg font-semibold rounded-xl">
            Create Your Letter
          </Button>
          <p className="text-xs text-slate-400 mt-4">No subscription required. Secured by Stripe.</p>
        </div>
      </section>

      {/* ── FAQ ── */}
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
                  {openFaq === i
                    ? <ChevronUp className="w-5 h-5 text-slate-400 flex-shrink-0" />
                    : <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0" />}
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5 text-slate-600 leading-relaxed text-sm">{f.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="py-20 px-6 bg-gradient-to-br from-green-900 to-slate-900 text-white text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ fontFamily: "Outfit, sans-serif" }}>
            Put it in writing today
          </h2>
          <p className="text-green-100/90 mb-8 text-lg">
            Take the first formal step toward making it stop. Your letter is ready to download in minutes.
          </p>
          <Button onClick={go} className="bg-green-500 hover:bg-green-600 text-white px-8 py-6 text-lg font-semibold rounded-xl gap-2">
            Create Your Cease and Desist Letter <ArrowRight className="w-5 h-5" />
          </Button>
        </div>
      </section>

      {/* ── DISCLAIMER ── */}
      <section className="py-10 px-6 bg-white">
        <div className="max-w-3xl mx-auto p-5 bg-amber-50 border border-amber-200 rounded-xl">
          <p className="text-xs text-amber-800 leading-relaxed">
            <strong>Disclaimer:</strong> MintSlip provides a self-service document preparation tool and is not a law firm.
            Nothing on this page is legal advice, and using this generator does not create an attorney–client relationship.
            Laws vary by state and situation. If your matter involves significant sums, threats to your safety, or complex
            legal questions, consult a licensed attorney in your jurisdiction.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}

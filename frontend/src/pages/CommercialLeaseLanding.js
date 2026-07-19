import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import {
  Building2, Store, Warehouse, Briefcase, UtensilsCrossed, Factory,
  CheckCircle, Clock, Download, FileText, ShieldCheck, PenTool,
  ArrowRight, ChevronDown, ChevronUp, Calculator, ScrollText, AlertTriangle,
} from "lucide-react";

const PRICE = "9.99";

const PROPERTY_TYPES = [
  { icon: Briefcase,        title: "Office space",       desc: "Single suites, floors, or whole buildings — professional, medical, or creative." },
  { icon: Store,            title: "Retail storefronts", desc: "Shops, boutiques, and service businesses, including percentage-rent arrangements." },
  { icon: UtensilsCrossed,  title: "Restaurants & cafés",desc: "Food service space with specific use clauses and equipment provisions." },
  { icon: Warehouse,        title: "Warehouse & storage",desc: "Distribution, storage, and logistics space with loading and access terms." },
  { icon: Factory,          title: "Industrial & flex",  desc: "Light manufacturing, workshops, and mixed-use flex space." },
  { icon: Building2,        title: "Salons & studios",   desc: "Salons, gyms, studios, and other specialty commercial uses." },
];

const LEASE_TYPES = [
  { name: "Triple Net (NNN)",       who: "Tenant pays taxes, insurance, and CAM on top of base rent.",       note: "Most common for retail and standalone buildings." },
  { name: "Double Net (NN)",        who: "Tenant pays taxes and insurance; landlord handles structure.",     note: "A middle ground on expense sharing." },
  { name: "Single Net (N)",         who: "Tenant pays property taxes only.",                                  note: "Less common; landlord keeps most expenses." },
  { name: "Gross / Full Service",   who: "Tenant pays one flat rent; landlord covers operating costs.",       note: "Typical for multi-tenant office buildings." },
  { name: "Modified Gross",         who: "Rent includes some expenses; the rest are split.",                  note: "Negotiated case by case." },
  { name: "Percentage Lease",       who: "Base rent plus a percentage of gross sales above a breakpoint.",   note: "Standard in malls and high-traffic retail." },
];

const INCLUDES = [
  { icon: ScrollText,  title: "18 standard lease sections", desc: "Parties, premises, permitted use, term, rent, expenses, deposit, utilities, maintenance, alterations, insurance, indemnity, assignment, default, holdover, notices, and general provisions." },
  { icon: Calculator,  title: "Rent escalation built in",   desc: "Fixed-dollar or percentage annual increases, late fees, and grace periods." },
  { icon: ShieldCheck, title: "Personal guaranty option",   desc: "Add a guaranty page to hold an individual owner liable behind an LLC tenant." },
  { icon: FileText,    title: "Notary block",               desc: "Optional acknowledgment page with seal area for leases that need recording." },
  { icon: PenTool,     title: "Draw your signature",        desc: "Sign on screen with mouse, finger, or stylus — landlord, tenant, and guarantor." },
  { icon: Download,    title: "Instant PDF",                desc: "Multi-page, print-ready letter-size lease with page numbering." },
];

const STEPS = [
  { n: "1", title: "Enter the parties",   desc: "Landlord and tenant details, including entity type for business tenants." },
  { n: "2", title: "Describe the space",  desc: "Address, suite, square footage, parking, and exactly what the tenant may use it for." },
  { n: "3", title: "Set rent and terms",  desc: "Choose your lease type, base rent, escalation, deposit, and expense responsibilities." },
  { n: "4", title: "Sign and download",   desc: "Add signatures, download the PDF, and give each party an executed copy." },
];

const FAQS = [
  {
    q: "What is a commercial lease agreement?",
    a: "A commercial lease agreement is a legally binding contract between a landlord and a business tenant for the rental of property used for business purposes — office, retail, warehouse, restaurant, or industrial space. It sets out the rent, the length of the term, who pays which operating expenses, what the tenant may use the space for, and what happens if either side breaches.",
  },
  {
    q: "What's the difference between a triple net (NNN) and a gross lease?",
    a: "In a triple net lease, the tenant pays base rent plus their proportionate share of the three 'nets' — property taxes, building insurance, and common area maintenance. In a gross or full-service lease, the tenant pays a single rent figure and the landlord absorbs those costs. NNN base rents look lower, but the tenant's total occupancy cost is often similar or higher once the nets are added, so always compare the fully loaded number.",
  },
  {
    q: "What does CAM mean?",
    a: "CAM stands for Common Area Maintenance — the cost of maintaining shared areas such as parking lots, lobbies, hallways, landscaping, snow removal, and exterior lighting. In net leases, each tenant pays a proportionate share, usually calculated from their square footage as a percentage of the building's leasable area.",
  },
  {
    q: "How long is a typical commercial lease?",
    a: "Commercial leases usually run three to ten years, considerably longer than residential leases. Retail and restaurant leases often run five to ten years because the tenant invests heavily in build-out. Shorter one to three year terms are common for small office suites. Renewal options let a tenant extend without renegotiating the whole lease.",
  },
  {
    q: "Should the lease include a personal guaranty?",
    a: "If your tenant is an LLC or corporation, the business entity may hold few assets, leaving the landlord with little recourse if it defaults. A personal guaranty makes an individual — usually the owner — personally responsible for the rent. It's standard for small businesses and startups. Well-capitalized tenants often negotiate it out or cap it at a set number of months' rent.",
  },
  {
    q: "Does a commercial lease need to be notarized?",
    a: "In most cases no — a commercial lease is binding once both parties sign. Some states require notarization or recording for leases longer than a certain term (often one to three years), and lenders or title companies may ask for it during a financing or sale. The notary acknowledgment block in this generator is optional so you can add it when circumstances call for it.",
  },
  {
    q: "Do commercial tenants get the same protections as residential tenants?",
    a: "No, and this surprises many first-time business tenants. Most consumer and residential tenant protections simply don't apply to commercial leases. Courts generally treat both parties as sophisticated and enforce the written terms as agreed. That makes the precise wording of your lease far more consequential than in a residential rental.",
  },
  {
    q: "How much does this cost?",
    a: `A commercial lease agreement from MintSlip costs $${PRICE} as a one-time purchase, with no subscription required. You get a live preview while you build it and an instant, print-ready multi-page PDF. Attorneys typically charge several hundred to a few thousand dollars to draft a commercial lease from scratch.`,
  },
];

export default function CommercialLeaseLanding() {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState(null);
  const go = () => navigate("/commercial-lease-generator");

  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>Commercial Lease Agreement Template | Create One Online for ${PRICE} | MintSlip</title>
        <meta name="description" content={`Create a commercial lease agreement online in minutes. NNN, gross, modified gross, and percentage leases for office, retail, warehouse, and restaurant space. Instant PDF for $${PRICE}.`} />
        <meta name="keywords" content="commercial lease agreement, commercial lease template, commercial rental agreement, NNN lease, triple net lease, gross lease, office lease, retail lease, warehouse lease, commercial lease form" />
        <meta property="og:title" content={`Commercial Lease Agreement Template | $${PRICE}`} />
        <meta property="og:description" content="Create a landlord-ready commercial lease in minutes. NNN, gross, and percentage lease types with CAM, guaranty, and notary blocks." />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Commercial Lease Agreement Template | MintSlip" />
        <meta name="twitter:description" content="Office, retail, warehouse, and restaurant leases. Instant PDF download." />
        <link rel="canonical" href="https://mintslip.com/commercial-lease-agreement" />

        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          "name": "MintSlip Commercial Lease Agreement Generator",
          "applicationCategory": "BusinessApplication",
          "operatingSystem": "Web",
          "offers": { "@type": "Offer", "price": PRICE, "priceCurrency": "USD" },
          "description": "Create a commercial lease agreement online for office, retail, warehouse, restaurant, and industrial property.",
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
            <Building2 className="w-4 h-4" /> Office · Retail · Warehouse · Restaurant
          </div>

          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight" style={{ fontFamily: "Outfit, sans-serif" }}>
            Commercial Lease Agreement
          </h1>

          <p className="text-lg md:text-xl text-green-100/90 max-w-3xl mx-auto mb-10">
            Put your commercial tenancy in writing. Build a landlord-ready lease with the right rent structure,
            expense allocation, and protections — in minutes, not billable hours.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button onClick={go} className="bg-green-500 hover:bg-green-600 text-white px-8 py-6 text-lg font-semibold rounded-xl gap-2">
              Create Your Lease <ArrowRight className="w-5 h-5" />
            </Button>
            <div className="text-green-100/80 text-sm">
              One-time <span className="font-bold text-white">${PRICE}</span> · Instant PDF download
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 mt-12 text-sm text-green-100/80">
            <span className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400" /> NNN, gross &amp; percentage</span>
            <span className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400" /> Guaranty &amp; notary blocks</span>
            <span className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400" /> All 50 states</span>
          </div>
        </div>
      </section>

      {/* WHAT IT IS */}
      <section className="py-20 px-6 max-w-4xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold mb-6 text-center" style={{ fontFamily: "Outfit, sans-serif", color: "#1a4731" }}>
          What is a commercial lease agreement?
        </h2>
        <div className="text-slate-600 text-lg leading-relaxed space-y-4">
          <p>
            A <strong>commercial lease agreement</strong> is a binding contract between a property owner and a business tenant for
            space used to run a business — an office suite, a storefront, a warehouse, a restaurant, or a workshop.
          </p>
          <p>
            It's a very different animal from a residential lease. Terms run longer, the money is larger, and the parties negotiate
            things residential renters never see: who pays the property taxes, how common area costs get allocated, whether rent
            escalates each year, what happens to the tenant's build-out at the end of the term.
          </p>
          <p>
            Most importantly, <strong>commercial tenants don't get residential tenant protections.</strong> Courts assume both sides
            are sophisticated businesses and enforce the lease as written. That puts real weight on getting the document right.
          </p>
        </div>
      </section>

      {/* PROPERTY TYPES */}
      <section className="py-20 px-6 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center" style={{ fontFamily: "Outfit, sans-serif", color: "#1a4731" }}>
            Works for any commercial space
          </h2>
          <p className="text-slate-600 text-center max-w-2xl mx-auto mb-14">
            One generator, configured for the property type and rent structure you're actually using.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {PROPERTY_TYPES.map(({ icon: Icon, title, desc }) => (
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

      {/* LEASE TYPES TABLE */}
      <section className="py-20 px-6 max-w-5xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center" style={{ fontFamily: "Outfit, sans-serif", color: "#1a4731" }}>
          Which lease type do you need?
        </h2>
        <p className="text-slate-600 text-center max-w-2xl mx-auto mb-12">
          The lease type decides who pays operating expenses. Pick one and the generator writes the matching clause.
        </p>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left" style={{ minWidth: 620 }}>
            <thead>
              <tr className="bg-slate-50">
                <th className="p-4 text-sm font-semibold text-slate-700">Lease type</th>
                <th className="p-4 text-sm font-semibold text-slate-700">Who pays what</th>
                <th className="p-4 text-sm font-semibold text-slate-700">Typically used for</th>
              </tr>
            </thead>
            <tbody>
              {LEASE_TYPES.map((t, i) => (
                <tr key={t.name} className={i % 2 ? "bg-slate-50/50" : "bg-white"}>
                  <td className="p-4 text-sm font-semibold text-slate-900 whitespace-nowrap">{t.name}</td>
                  <td className="p-4 text-sm text-slate-600">{t.who}</td>
                  <td className="p-4 text-sm text-slate-500">{t.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-20 px-6 bg-slate-50">
        <div className="max-w-6xl mx-auto">
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
              Start Your Lease <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* INCLUDES */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-14 text-center" style={{ fontFamily: "Outfit, sans-serif", color: "#1a4731" }}>
            What's included
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {INCLUDES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex gap-4">
                <div className="w-11 h-11 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center flex-shrink-0">
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
      <section className="py-20 px-6 bg-slate-50">
        <div className="max-w-md mx-auto bg-white border-2 border-green-200 rounded-2xl p-8 text-center shadow-sm">
          <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: "Outfit, sans-serif", color: "#1a4731" }}>Simple pricing</h2>
          <div className="my-6">
            <span className="text-5xl font-bold text-slate-900">${PRICE}</span>
            <span className="text-slate-500 ml-2">one-time</span>
          </div>
          <ul className="text-left space-y-3 mb-8">
            {[
              "Full multi-page commercial lease",
              "Six lease types including NNN and percentage",
              "Rent escalation, CAM, and late fee terms",
              "Optional personal guaranty and notary blocks",
              "Live preview and instant PDF download",
            ].map(t => (
              <li key={t} className="flex items-start gap-3 text-slate-700">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm">{t}</span>
              </li>
            ))}
          </ul>
          <Button onClick={go} className="w-full bg-green-600 hover:bg-green-700 text-white py-6 text-lg font-semibold rounded-xl">
            Create Your Lease
          </Button>
          <p className="text-xs text-slate-400 mt-4">No subscription required. Secured by Stripe.</p>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-6">
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
            Get it in writing before the keys change hands
          </h2>
          <p className="text-green-100/90 mb-8 text-lg">
            A clear lease prevents the disputes that cost landlords and tenants far more than the document ever will.
          </p>
          <Button onClick={go} className="bg-green-500 hover:bg-green-600 text-white px-8 py-6 text-lg font-semibold rounded-xl gap-2">
            Create Your Commercial Lease <ArrowRight className="w-5 h-5" />
          </Button>
        </div>
      </section>

      {/* DISCLAIMER */}
      <section className="py-10 px-6 bg-white">
        <div className="max-w-3xl mx-auto p-5 bg-amber-50 border border-amber-200 rounded-xl flex gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800 leading-relaxed">
            <strong>Disclaimer:</strong> MintSlip provides a self-service document preparation tool and is not a law firm. Nothing on
            this page is legal advice, and using this generator does not create an attorney–client relationship. Commercial leases
            create substantial long-term financial obligations and are governed by state-specific law. For high-value, long-term, or
            complex leases, have a licensed attorney in your state review the document before signing.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}

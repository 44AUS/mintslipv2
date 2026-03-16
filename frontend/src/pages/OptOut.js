import { useState } from "react";
import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Shield, CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";

export default function OptOut() {
  const [name, setName]           = useState("");
  const [email, setEmail]         = useState("");
  const [phone, setPhone]         = useState("");
  const [reason, setReason]       = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      toast.error("Name and email are required");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/opt-out`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, reason }),
      });
      if (!res.ok) {
        const d = await res.json();
        toast.error(d.detail || "Submission failed. Please try again.");
        return;
      }
      setSubmitted(true);
    } catch {
      toast.error("Submission failed. Please check your connection.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Data Removal Request | MintSlip</title>
        <meta name="description" content="Request removal of your personal information from MintSlip's people search database." />
      </Helmet>
      <Header />
      <main className="min-h-screen bg-slate-50 py-12 px-4">
        <div className="max-w-lg mx-auto">

          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-4">
              <Shield className="w-6 h-6 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Data Removal Request</h1>
            <p className="text-slate-500 mt-2 text-sm leading-relaxed">
              You have the right to request removal of your personal information from our people search database.
              We will review your request and process it within 5 business days.
            </p>
          </div>

          {submitted ? (
            <div className="bg-white rounded-xl border border-green-200 p-8 text-center">
              <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h2 className="text-lg font-bold text-slate-900 mb-2">Request Received</h2>
              <p className="text-slate-500 text-sm leading-relaxed">
                We've received your removal request for <strong>{name}</strong>. Our team will
                review it and process the removal within 5 business days. You'll receive a
                confirmation at <strong>{email}</strong> once complete.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <form onSubmit={handleSubmit} className="space-y-5">

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="John Smith"
                    required
                    className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <p className="text-xs text-slate-400 mt-1">Enter the name as it appears in our database</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Phone Number <span className="text-slate-400 font-normal">(optional — helps us find your record)</span>
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="(555) 123-4567"
                    className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Reason for Removal <span className="text-slate-400 font-normal">(optional)</span>
                  </label>
                  <textarea
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    placeholder="e.g. Privacy concerns, incorrect information, safety reasons…"
                    rows={3}
                    className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 text-sm"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                  {submitting ? "Submitting…" : "Submit Removal Request"}
                </button>
              </form>

              <p className="text-xs text-slate-400 text-center mt-4 leading-relaxed">
                Your request will be reviewed within 5 business days. Once approved, your records
                will be permanently removed and suppressed from future data collection.
              </p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

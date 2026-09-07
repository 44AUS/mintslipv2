// Server-driven availability for templates/generators. The admin toggles
// live in Site Settings; the app reads them at runtime (short TTL) so a
// change takes effect on web + iOS/Android without shipping an update.
import { useEffect, useState } from "react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";
const CACHE_TTL_MS = 60 * 1000;

let cachedSet = null;
let cachedAt = 0;
let inflight = null;

export async function fetchDisabledGenerators(force = false) {
  const now = Date.now();
  if (!force && cachedSet && now - cachedAt < CACHE_TTL_MS) return cachedSet;
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/generators/availability?_=${Date.now()}`);
      const data = await res.json();
      if (data && data.success) {
        cachedSet = new Set(data.disabled || []);
        cachedAt = Date.now();
      }
    } catch (e) {
      // network failure: keep whatever we had (fail open — nothing hidden)
    }
    inflight = null;
    return cachedSet || new Set();
  })();
  return inflight;
}

export function clearGeneratorAvailabilityCache() {
  cachedSet = null;
  cachedAt = 0;
}

// Returns a Set of disabled generator ids; starts from the module cache so
// repeat mounts don't flash, then refreshes from the server.
export function useDisabledGenerators() {
  const [disabled, setDisabled] = useState(() => cachedSet || new Set());
  useEffect(() => {
    let alive = true;
    fetchDisabledGenerators().then((s) => { if (alive) setDisabled(new Set(s)); });
    return () => { alive = false; };
  }, []);
  return disabled;
}

// Registry shown in the admin Site Settings card. Ids are what the app
// filters on — keep them stable.
export const GENERATOR_GROUPS = [
  {
    title: "Pay Stub Templates",
    items: [
      { id: "paystub-gusto", label: "Gusto Style" },
      { id: "paystub-workday", label: "Workday Style" },
      { id: "paystub-onpay", label: "OnPay Style" },
    ],
  },
  {
    title: "Resume Templates",
    items: [
      { id: "resume-ats", label: "ATS Optimized" },
      { id: "resume-modern", label: "Modern Professional" },
      { id: "resume-classic", label: "Classic Executive" },
    ],
  },
  {
    title: "Generators",
    items: [
      { id: "paystub", label: "US Pay Stub" },
      { id: "canadian-paystub", label: "Canadian Paystub" },
      { id: "ai-resume", label: "AI Resume Builder" },
      { id: "offer-letter", label: "Offer Letter" },
      { id: "w2", label: "W-2" },
      { id: "w9", label: "W-9" },
      { id: "1099-nec", label: "1099-NEC" },
      { id: "1099-misc", label: "1099-MISC" },
      { id: "schedule-c", label: "Schedule C" },
      { id: "cease-and-desist", label: "Cease & Desist" },
      { id: "power-of-attorney", label: "Power of Attorney" },
      { id: "vehicle-bill-of-sale", label: "Vehicle Bill of Sale" },
      { id: "commercial-lease", label: "Commercial Lease" },
      { id: "utility-bill", label: "Utility Bill" },
      { id: "bank-statement", label: "Bank Statement" },
    ],
  },
];

export const TAX_GENERATOR_IDS = ["w2", "w9", "1099-nec", "1099-misc", "schedule-c"];
export const LEGAL_GENERATOR_IDS = ["cease-and-desist", "power-of-attorney", "vehicle-bill-of-sale"];
export const BUSINESS_GENERATOR_IDS = ["commercial-lease", "utility-bill", "bank-statement"];

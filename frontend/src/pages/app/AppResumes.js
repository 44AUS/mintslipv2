import { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import { IonSpinner } from "@ionic/react";
import { generateResumePreview } from "@/utils/resumePreviewGenerator";
import AppResumeBuilder from "./AppResumeBuilder";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";
const RESUME_STORAGE_KEY = "resumeBuilderFormData";

// Built-in AI Resume Builder templates (same set as the builder's picker)
const BUILT_IN_TEMPLATES = [
  { value: "ats",     name: "ATS Optimized",       color: "#2563eb" },
  { value: "modern",  name: "Modern Professional", color: "#059669" },
  { value: "classic", name: "Classic Executive",   color: "#1e293b" },
];

// Sample resume data used to render the card previews
const RESUME_SAMPLE = {
  personalInfo: {
    fullName: "John Smith",
    email: "john.smith@example.com", phone: "(555) 123-4567",
    location: "New York, NY", linkedin: "linkedin.com/in/johnsmith", website: "",
  },
  professionalSummary: "Operations analyst with 7+ years of experience turning messy data into clear decisions. Led cross-functional projects that cut fulfillment costs 18% while improving on-time delivery.",
  optimizedSkills: {
    technical: ["SQL", "Excel / Power Query", "Tableau", "Python"],
    soft: ["Stakeholder communication", "Process design"],
    other: [],
  },
  optimizedExperience: [
    {
      position: "Senior Operations Analyst", company: "Acme Corporation", location: "New York, NY",
      startDate: "2022-03", endDate: "", current: true,
      bullets: [
        "Built the weekly S&OP dashboard used by 40+ managers, replacing three manual reports",
        "Cut fulfillment costs 18% by redesigning the carrier selection process",
        "Mentored two junior analysts through their first automation projects",
      ],
    },
    {
      position: "Operations Analyst", company: "Hudson Logistics", location: "Brooklyn, NY",
      startDate: "2019-01", endDate: "2022-02", current: false,
      bullets: [
        "Automated daily volume forecasting, saving 10 hours per week",
        "Ran root-cause analysis that reduced mis-ships by 32%",
      ],
    },
  ],
  education: [
    { degree: "B.B.A.", field: "Business Administration", institution: "New York University", gpa: "3.7", graduationDate: "2018-05" },
  ],
  font: "Calibri", sectionLayout: "standard", onePage: false, isPaid: true,
};

export default function AppResumes() {
  const [previews, setPreviews] = useState({});
  const [loadingPreviews, setLoadingPreviews] = useState(true);
  const [customTemplates, setCustomTemplates] = useState([]);
  const [builderOpen, setBuilderOpen] = useState(false);

  // Admin-published custom resume templates join the grid
  useEffect(() => {
    fetch(`${BACKEND_URL}/api/doc-templates?documentType=resume`)
      .then((r) => r.json())
      .then((d) => { if (d.success) setCustomTemplates(d.templates || []); })
      .catch(() => {});
  }, []);

  const templateCards = [
    ...BUILT_IN_TEMPLATES,
    ...customTemplates.map((t) => ({ value: `custom:${t.id}`, name: t.name, color: t.badgeColor || "#16a34a" })),
  ];

  // Render each template's sample preview as its card image
  useEffect(() => {
    let cancelled = false;
    (async () => {
      for (const tpl of templateCards) {
        if (previews[tpl.value]) continue;
        try {
          const img = await generateResumePreview({ ...RESUME_SAMPLE, template: tpl.value });
          if (cancelled) return;
          if (img) setPreviews(prev => ({ ...prev, [tpl.value]: img }));
        } catch (err) {
          console.error(`Resume preview failed for ${tpl.value}:`, err);
        }
      }
      if (!cancelled) setLoadingPreviews(false);
    })();
    return () => { cancelled = true; };
  }, [customTemplates]); // eslint-disable-line

  // Preselect the tapped template, then mount a fresh builder so it picks it up
  const openBuilder = (templateValue) => {
    try {
      const stored = JSON.parse(localStorage.getItem(RESUME_STORAGE_KEY) || "{}");
      localStorage.setItem(RESUME_STORAGE_KEY, JSON.stringify({ ...stored, template: templateValue }));
    } catch {}
    setBuilderOpen(true);
  };

  return (
    <AppLayout fillHeight>
      <div style={{ padding: 10, height: "100%", boxSizing: "border-box" }}>
        <div style={{ background: "var(--ion-card-background)", borderRadius: 12, padding: "20px 20px 24px", height: "100%", overflowY: "auto", boxShadow: "0 2px 12px rgba(0,0,0,0.10)", boxSizing: "border-box" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
            {templateCards.map(tpl => (
              <div key={tpl.value}
                onClick={() => openBuilder(tpl.value)}
                style={{ cursor: "pointer", borderRadius: 10, border: "1.5px solid var(--app-divider, rgba(0,0,0,0.12))", background: "var(--ion-card-background)", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.08)", transition: "box-shadow 0.2s, transform 0.15s" }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.18)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)"; e.currentTarget.style.transform = "none"; }}
              >
                <div style={{ position: "relative", background: "#fff", overflow: "hidden", minHeight: 160 }}>
                  <div style={{ position: "absolute", top: 10, left: 10, zIndex: 2, background: tpl.color, color: "#fff", padding: "4px 12px", borderRadius: 999, fontSize: "0.72rem", fontWeight: 700, boxShadow: "0 2px 8px rgba(0,0,0,0.28)" }}>
                    {tpl.name}
                  </div>
                  {previews[tpl.value] ? (
                    <div style={{ position: "relative", paddingTop: "141.4%", overflow: "hidden", pointerEvents: "none" }}>
                      <img src={previews[tpl.value]} alt={`${tpl.name} sample`} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "top", display: "block" }} />
                      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 56, background: "linear-gradient(to top, rgba(0,0,0,0.28), transparent)" }} />
                    </div>
                  ) : loadingPreviews ? (
                    <div style={{ height: 180, display: "flex", alignItems: "center", justifyContent: "center", background: "#f9fafb" }}>
                      <IonSpinner name="crescent" />
                    </div>
                  ) : (
                    <div style={{ height: 180, display: "flex", alignItems: "center", justifyContent: "center", background: "#f9fafb" }}>
                      <span style={{ color: "#9ca3af", fontSize: "0.8rem" }}>Preview unavailable</span>
                    </div>
                  )}
                </div>
                <div style={{ padding: "8px 16px 12px", textAlign: "center", borderTop: "1px solid var(--app-divider, rgba(0,0,0,0.06))" }}>
                  <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--ion-color-primary)" }}>Build with {tpl.name} →</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mounted fresh per open so it reads the preselected template */}
      {builderOpen && <AppResumeBuilder isOpen onClose={() => setBuilderOpen(false)} />}
    </AppLayout>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Layout engine: renders admin-designed document templates.
//
// A template layout is pure data: { page: {width, height}, elements: [...] }.
// Element types:
//   text  — { type, x, y, w, content, fontSize, bold, italic, color, align, wrap }
//           content may mix static text with {tokens}, e.g. "Net Pay: ${netPay}"
//   rect  — { type, x, y, w, h, fill, stroke, lineWidth, radius }
//   line  — { type, x, y, w, h, color, lineWidth }  (drawn from (x,y) to (x+w,y+h))
//   image — { type, x, y, w, h, src }  (src is a {token} resolving to a data URL)
//   table — { type, x, y, w, binding, columns, fontSize, rowHeight, headerFill,
//             headerColor, color, zebra, rowLines }
//
// Every element supports:
//   page   — 1-based page number (default 1); pages are added as needed
//   showIf — conditional visibility: "flag", "!flag", "key=value", "key!=value"
//            evaluated against the data context (e.g. "isContractor",
//            "payType=salary", "!hasLogo"). Empty/absent = always shown.
//
// Tables that overflow the page bottom continue on the next page with their
// header repeated.
//
// The same context builders feed the editor's on-canvas preview and the real
// jsPDF output, so what the admin sees is what customers get.
// ─────────────────────────────────────────────────────────────────────────────

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";

// ── formatting helpers ───────────────────────────────────────────────────────

function money(n) {
  return Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(date) {
  if (!date) return "";
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  if (typeof date === "string" && date.match(/^\d{4}-\d{2}-\d{2}/)) {
    const [y, m, d] = date.slice(0, 10).split("-").map(Number);
    return `${months[m - 1]} ${d}, ${y}`;
  }
  const d = new Date(date);
  if (isNaN(d)) return String(date);
  if (date instanceof Date) return `${months[date.getUTCMonth()]} ${date.getUTCDate()}, ${date.getUTCFullYear()}`;
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function fmtLongDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d)) return String(dateStr);
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function fmtMonthYear(s) {
  if (!s) return "";
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const m = String(s).match(/^(\d{4})-(\d{2})/);
  if (m) return `${months[Number(m[2]) - 1]} ${m[1]}`;
  const d = new Date(s);
  return isNaN(d) ? String(s) : `${months[d.getMonth()]} ${d.getFullYear()}`;
}

function maskSSN(ssn) {
  const digits = String(ssn || "").replace(/\D/g, "");
  return digits.length >= 4 ? `XXX-XX-${digits.slice(-4)}` : "";
}

function titleCase(s) {
  return String(s || "").replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

// Deterministic hash so generated check/employee numbers are stable per person
// (mirrors the behaviour of the built-in OnPay template).
function stableHash(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) & 0xffffffff;
  return Math.abs(h);
}

function hexToRgb(hex) {
  const h = String(hex || "#000000").replace("#", "");
  const v = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  return [parseInt(v.slice(0, 2), 16) || 0, parseInt(v.slice(2, 4), 16) || 0, parseInt(v.slice(4, 6), 16) || 0];
}

// ── data contexts ────────────────────────────────────────────────────────────

function buildPaystubContext(td) {
  const f = td.formData || {};
  const ctx = {
    company: f.company || "",
    companyAddress: f.companyAddress || "",
    companyCityStateZip: [f.companyCity, f.companyState, f.companyZip].filter(Boolean).join(", "),
    companyPhone: f.companyPhone || "",
    employeeName: f.name || "",
    employeeAddress: f.address || "",
    employeeCityStateZip: [f.city, f.state, f.zip].filter(Boolean).join(", "),
    ssn: maskSSN(f.ssn),
    employeeId: f.employeeId || f.fileNum || "",
    filingStatus: f.federalFilingStatus || "",
    startDate: fmtDate(td.startDate),
    endDate: fmtDate(td.endDate),
    payDate: fmtDate(td.payDate),
    payPeriod: `${fmtDate(td.startDate)} - ${fmtDate(td.endDate)}`,
    payFrequency: td.payFrequency || "",
    stubLabel: td.totalStubs > 1 ? `${td.stubNum} of ${td.totalStubs}` : "",
    rate: money(td.rate),
    hours: String(td.hours ?? ""),
    overtime: String(td.overtime ?? ""),
    regularPay: money(td.regularPay),
    overtimePay: money(td.overtimePay),
    grossPay: money(td.grossPay),
    netPay: money(td.netPay),
    federalTax: money(td.federalTax),
    stateTax: money(td.stateTax),
    localTax: money(td.localTax),
    ssTax: money(td.ssTax),
    medTax: money(td.medTax),
    totalTax: money(td.totalTax),
    totalDeductions: money((td.totalTax || 0) + (td.totalDeductions || 0) + (td.totalContributions || 0)),
    ytdGrossPay: money(td.ytdGrossPay),
    ytdNetPay: money(td.ytdNetPay),
    ytdTotalTax: money(td.ytdTotalTax),
    ytdFederalTax: money(td.ytdFederalTax),
    ytdStateTax: money(td.ytdStateTax),
    ytdSsTax: money(td.ytdSsTax),
    ytdMedTax: money(td.ytdMedTax),
    ytdHours: String(td.ytdHours ?? ""),
    logoDataUrl: td.logoDataUrl || "",
    // condition flags
    payType: td.payType || "hourly",
    workerType: td.workerType || "employee",
    isContractor: td.isContractor ? "true" : "",
    hasLogo: td.logoDataUrl ? "true" : "",
    hasOvertime: Number(td.overtime) > 0 ? "true" : "",
    hasCommission: Number(td.commission) > 0 ? "true" : "",
    workerLabel: td.isContractor ? "CONTRACTOR" : "EMPLOYEE",
    workerLabelTitle: td.isContractor ? "Contractor" : "Employee",
    statementTitle: td.isContractor ? "Contractor Payment Statement" : "Earnings Statement",
    earningsTitle: td.isContractor ? "Contractor Gross Earnings" : "Employee Gross Earnings",
    bankLast4: String(f.bank || "").slice(-4) || "0000",
    checkNumber: td.periodCheckNumber || String(1 + (stableHash((f.name || "emp") + (td.stubNum || 1)) % 999)),
    employeeNumber: f.employeeId || String(1000000 + (stableHash(f.name || "emp") % 9000000)),
    memo: td.periodMemo || "Thank you for your hard work.",
  };

  const ytdPeriods = td.ytdPayPeriods || 1;
  const isSalary = td.payType === "salary";

  const earnings = [];
  if (isSalary) {
    earnings.push({
      name: "Salary", nameDetailed: "Salary | Per Period",
      rate: "—", rateDetailed: `$${money(td.annualSalary)}/yr`,
      hours: "—", current: money(td.regularPay), ytd: money(td.ytdRegularPay),
    });
  } else {
    earnings.push({
      name: "Regular", nameDetailed: "Regular Hours | Hourly",
      rate: money(td.rate), rateDetailed: `$${money(td.rate)}`,
      hours: String(td.hours ?? ""), current: money(td.regularPay), ytd: money(td.ytdRegularPay),
    });
  }
  if (Number(td.overtime) > 0) {
    earnings.push({
      name: "Overtime", nameDetailed: "Overtime Hours | 1.5x",
      rate: money(td.rate * 1.5), rateDetailed: `$${money(td.rate * 1.5)}`,
      hours: String(td.overtime), current: money(td.overtimePay), ytd: money(td.ytdOvertimePay),
    });
  }
  if (Number(td.commission) > 0) {
    earnings.push({ name: "Commission", nameDetailed: "Commission", rate: "—", rateDetailed: "—", hours: "—", current: money(td.commission), ytd: money(td.ytdCommission) });
  }
  if (Number(td.tips) > 0) {
    const tl = td.tipsCash ? "Cash Tips" : "Tips";
    earnings.push({ name: tl, nameDetailed: tl, rate: "—", rateDetailed: "—", hours: "—", current: money(td.tips), ytd: money(td.ytdTips) });
  }
  ctx.earnings = earnings;

  // ── Gusto-style row groups (employee vs employer taxes, itemized
  //    deductions/contributions with tax-type labels, and a summary table) ──
  const fedStatus = f.federalFilingStatus === "married_jointly" ? " (MFJ)" : f.federalFilingStatus === "head_of_household" ? " (HOH)" : f.federalFilingStatus ? " (S)" : "";
  const employeeTaxes = [
    { name: `Federal Income Tax${fedStatus}`, current: money(td.federalTax), ytd: money(td.ytdFederalTax) },
    { name: "Social Security (6.2%)", current: money(td.ssTax), ytd: money(td.ytdSsTax) },
    { name: "Medicare (1.45%)", current: money(td.medTax), ytd: money(td.ytdMedTax) },
  ];
  if (Number(td.stateTax) > 0 || td.stateRate !== undefined) {
    const allow = parseInt(f.stateAllowances) > 0 ? ` (${f.stateAllowances} allow.)` : "";
    employeeTaxes.push({ name: `${(f.state || "State").toUpperCase()} Tax${allow}`, current: money(td.stateTax), ytd: money(td.ytdStateTax) });
  }
  if (f.includeLocalTax && Number(td.localTax) > 0) {
    employeeTaxes.push({ name: `${f.city || "Local"} Tax`, current: money(td.localTax), ytd: money(td.ytdLocalTax) });
  }
  ctx.employeeTaxes = employeeTaxes;

  const gp = Number(td.grossPay) || 0;
  const ygp = Number(td.ytdGrossPay) || 0;
  const suta = td.sutaRate || 0.027;
  ctx.employerTaxes = [
    { name: "Social Security (6.2%)", current: money(gp * 0.062), ytd: money(ygp * 0.062) },
    { name: "Medicare (1.45%)", current: money(gp * 0.0145), ytd: money(ygp * 0.0145) },
    { name: "FUTA (0.6%)", current: money(gp * 0.006), ytd: money(ygp * 0.006) },
    { name: `${(f.state || "State").toUpperCase()} Unemp. (${(suta * 100).toFixed(2)}%)`, current: money(gp * suta), ytd: money(ygp * suta) },
  ];

  const itemize = (items, fallbackLabel) => {
    const rows = (items || []).map((d) => ({
      name: d.name || fallbackLabel,
      taxType: d.preTax ? "Pre-Tax" : "Post-Tax",
      current: money(d.currentAmount),
      ytd: money((d.currentAmount || 0) * ytdPeriods),
    }));
    return rows.length ? rows : [{ name: "None", taxType: "–", current: "0.00", ytd: "0.00" }];
  };
  ctx.deductionItems = itemize(td.deductionsData, "Deduction");
  ctx.contributionItems = itemize(td.contributionsData, "Contribution");

  const summary = [{ name: "Gross Earnings", current: money(td.grossPay), ytd: money(td.ytdGrossPay) }];
  if (td.isContractor) {
    summary.push({ name: "Taxes Withheld", current: "0.00", ytd: "0.00" });
    summary.push({ name: "Total Payment", current: money(td.grossPay), ytd: money(td.ytdGrossPay) });
  } else {
    summary.push({ name: "Pre-Tax Deductions/Contributions", current: money(td.totalPreTax), ytd: money(td.ytdPreTax) });
    summary.push({ name: "Taxes", current: money(td.totalTax), ytd: money(td.ytdTotalTax) });
    summary.push({ name: "Post-Tax Deductions/Contributions", current: money(td.totalPostTax), ytd: money(td.ytdPostTax) });
    summary.push({ name: "Net Pay", current: money(td.netPay), ytd: money(td.ytdNetPay) });
    summary.push({ name: "Check Amount", current: money(td.netPay), ytd: money(td.ytdNetPay) });
  }
  if (!isSalary) {
    summary.push({ name: "Hours Worked", current: String((Number(td.hours) || 0) + (Number(td.overtime) || 0)), ytd: String(td.ytdHours ?? "") });
  }
  ctx.summary = summary;

  const isCanadian = td.cpp !== undefined || td.ei !== undefined;
  const deductions = [];
  if (isCanadian) {
    deductions.push({ name: "Federal Tax", current: money(td.federalTax), ytd: money(td.ytdFederalTax) });
    if (Number(td.provincialTax) > 0) deductions.push({ name: "Provincial Tax", current: money(td.provincialTax), ytd: money(td.ytdProvincialTax) });
    deductions.push({ name: td.cppLabel || "CPP", current: money(td.cpp), ytd: money(td.ytdCpp) });
    deductions.push({ name: "EI", current: money(td.ei), ytd: money(td.ytdEi) });
    if (Number(td.qpip) > 0) deductions.push({ name: "QPIP", current: money(td.qpip), ytd: money(td.ytdQpip) });
    ctx.cpp = money(td.cpp); ctx.ei = money(td.ei); ctx.qpip = money(td.qpip);
    ctx.provincialTax = money(td.provincialTax);
    ctx.cppLabel = td.cppLabel || "CPP";
    ctx.ytdCpp = money(td.ytdCpp); ctx.ytdEi = money(td.ytdEi);
    ctx.ytdProvincialTax = money(td.ytdProvincialTax);
  } else {
    deductions.push({ name: "Federal Income Tax", current: money(td.federalTax), ytd: money(td.ytdFederalTax) });
    deductions.push({ name: "Social Security", current: money(td.ssTax), ytd: money(td.ytdSsTax) });
    deductions.push({ name: "Medicare", current: money(td.medTax), ytd: money(td.ytdMedTax) });
    if (Number(td.stateTax) > 0) deductions.push({ name: "State Income Tax", current: money(td.stateTax), ytd: money(td.ytdStateTax) });
    if (Number(td.localTax) > 0) deductions.push({ name: "Local Tax", current: money(td.localTax), ytd: money(td.ytdLocalTax) });
  }
  (td.deductionsData || []).forEach((d) => {
    deductions.push({ name: d.name || "Deduction", current: money(d.currentAmount), ytd: money((d.currentAmount || 0) * ytdPeriods) });
  });
  (td.contributionsData || []).forEach((c) => {
    deductions.push({ name: c.name || "Contribution", current: money(c.currentAmount), ytd: money((c.currentAmount || 0) * ytdPeriods) });
  });
  ctx.deductions = deductions;

  return ctx;
}

function buildOfferLetterContext(td) {
  const f = td.formData || {};
  const compUnit = f.compensationType === "hourly" ? "per hour" : f.compensationType === "monthly" ? "per month" : "per year";
  const compAmount = f.compensationAmount
    ? `$${Number(f.compensationAmount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : "";
  const offerDetails = [
    { label: "Position", value: f.jobTitle },
    { label: "Department", value: f.department },
    { label: "Employment Type", value: titleCase(f.employmentType) },
    { label: "Work Location", value: titleCase(f.workLocation) },
    { label: "Start Date", value: fmtLongDate(f.startDate) },
    { label: "Reporting To", value: f.reportingManager ? `${f.reportingManager}${f.reportingTitle ? `, ${f.reportingTitle}` : ""}` : "" },
  ].filter((r) => r.value);

  return {
    companyName: f.companyName || "",
    companyAddress: f.companyAddress || "",
    companyCityStateZip: [f.companyCity, f.companyState, f.companyZip].filter(Boolean).join(", "),
    companyPhone: f.companyPhone || "",
    companyEmail: f.companyEmail || "",
    letterDate: fmtLongDate(f.letterDate) || fmtLongDate(new Date().toISOString()),
    candidateName: f.candidateName || "",
    candidateAddress: f.candidateAddress || "",
    candidateCityStateZip: [f.candidateCity, f.candidateState, f.candidateZip].filter(Boolean).join(", "),
    jobTitle: f.jobTitle || "",
    department: f.department || "",
    employmentType: titleCase(f.employmentType),
    workLocation: titleCase(f.workLocation),
    startDate: fmtLongDate(f.startDate),
    compensation: compAmount ? `${compAmount} ${compUnit}` : "",
    payFrequency: titleCase(f.payFrequency),
    benefits: f.benefits || "",
    additionalTerms: f.additionalTerms || "",
    responseDeadline: fmtLongDate(f.responseDeadline),
    signerName: f.signerName || "",
    signerTitle: f.signerTitle || "",
    logoDataUrl: f.companyLogo || "",
    hasLogo: f.companyLogo ? "true" : "",
    hasBenefits: f.benefits ? "true" : "",
    hasDeadline: f.responseDeadline ? "true" : "",
    offerDetails,
  };
}

function buildLegalDocumentContext(td) {
  const f = td.formData || {};
  const csz = (c, s, z) => [c, s, z].filter(Boolean).join(", ");
  return {
    documentTitle: f.documentTitle || "Agreement",
    effectiveDate: fmtLongDate(f.effectiveDate) || fmtLongDate(new Date().toISOString()),
    governingState: f.governingState || "",
    todayDate: fmtLongDate(new Date().toISOString()),
    partyAName: f.partyAName || "",
    partyATitle: f.partyATitle || "",
    partyAAddress: f.partyAAddress || "",
    partyACityStateZip: csz(f.partyACity, f.partyAState, f.partyAZip),
    partyAEmail: f.partyAEmail || "",
    partyAPhone: f.partyAPhone || "",
    partyBName: f.partyBName || "",
    partyBTitle: f.partyBTitle || "",
    partyBAddress: f.partyBAddress || "",
    partyBCityStateZip: csz(f.partyBCity, f.partyBState, f.partyBZip),
    partyBEmail: f.partyBEmail || "",
    partyBPhone: f.partyBPhone || "",
    recitals: f.recitals || "",
    terms: f.terms || "",
    additionalTerms: f.additionalTerms || "",
    // signatures — image (drawn/uploaded) or typed name in script style
    partyASignature: f.partyASignatureImage || "",
    partyASignatureName: f.partyASignatureName || f.partyAName || "",
    partyASignDate: fmtLongDate(f.partyASignDate) || "",
    partyBSignature: f.partyBSignatureImage || "",
    partyBSignatureName: f.partyBSignatureName || f.partyBName || "",
    partyBSignDate: fmtLongDate(f.partyBSignDate) || "",
    notaryState: f.notaryState || f.governingState || "",
    notaryCounty: f.notaryCounty || "",
    // condition flags
    hasPartyASignatureImage: f.partyASignatureImage ? "true" : "",
    hasPartyBSignatureImage: f.partyBSignatureImage ? "true" : "",
    hasRecitals: f.recitals ? "true" : "",
    hasAdditionalTerms: f.additionalTerms ? "true" : "",
    hasGoverningState: f.governingState ? "true" : "",
    parties: [
      { role: "Party A", name: f.partyAName || "", address: f.partyAAddress || "", cityStateZip: csz(f.partyACity, f.partyAState, f.partyAZip) },
      { role: "Party B", name: f.partyBName || "", address: f.partyBAddress || "", cityStateZip: csz(f.partyBCity, f.partyBState, f.partyBZip) },
    ],
  };
}

function buildResumeContext(td) {
  const r = td.formData || {};
  const p = r.personalInfo || {};
  const skills = [
    ...((r.optimizedSkills && r.optimizedSkills.technical) || []),
    ...((r.optimizedSkills && r.optimizedSkills.soft) || []),
    ...((r.optimizedSkills && r.optimizedSkills.other) || []),
  ].filter(Boolean);
  const experience = (r.optimizedExperience || []).map((e) => ({
    position: e.position || "",
    company: e.company || "",
    location: e.location || "",
    companyLine: [e.company, e.location].filter(Boolean).join(" | "),
    dates: `${fmtMonthYear(e.startDate)} - ${e.current ? "Present" : fmtMonthYear(e.endDate)}`,
    bulletsText: (e.bullets || []).filter(Boolean).map((b) => `• ${b}`).join("\n"),
  }));
  const education = (r.education || []).map((e) => ({
    degree: [e.degree, e.field].filter(Boolean).join(" in "),
    institution: e.institution || "",
    gpa: e.gpa || "",
    institutionLine: e.gpa ? `${e.institution} | GPA: ${e.gpa}` : (e.institution || ""),
    date: fmtMonthYear(e.graduationDate),
  }));
  return {
    fullName: p.fullName || "",
    email: p.email || "", phone: p.phone || "", location: p.location || "",
    linkedin: p.linkedin || "", website: p.website || "",
    contactLine: [p.email, p.phone, p.location, p.linkedin, p.website].filter(Boolean).join("  •  "),
    summary: r.professionalSummary || "",
    skillsLine: skills.join("  •  "),
    experienceText: experience
      .map((e) => [`${e.position}${e.dates.trim() !== "-" ? `  (${e.dates})` : ""}`, e.companyLine, e.bulletsText].filter(Boolean).join("\n"))
      .join("\n\n"),
    educationText: education
      .map((e) => [`${e.degree}${e.date ? `  (${e.date})` : ""}`, e.institutionLine].filter(Boolean).join("\n"))
      .join("\n\n"),
    hasSummary: r.professionalSummary ? "true" : "",
    hasSkills: skills.length ? "true" : "",
    hasLinkedin: p.linkedin ? "true" : "",
    hasWebsite: p.website ? "true" : "",
    experience,
    education,
    skillRows: skills.map((s) => ({ name: s })),
  };
}

const CONTEXT_BUILDERS = {
  paystub: buildPaystubContext,
  "canadian-paystub": buildPaystubContext,
  "offer-letter": buildOfferLetterContext,
  "legal-document": buildLegalDocumentContext,
  resume: buildResumeContext,
};

export function buildContext(templateData, documentType = "paystub") {
  return (CONTEXT_BUILDERS[documentType] || buildPaystubContext)(templateData);
}

export function resolveTokens(str, ctx) {
  return String(str ?? "").replace(/\{([\w.]+)\}/g, (m, key) => {
    const v = ctx[key];
    return v === undefined || v === null ? "" : String(v);
  });
}

// ── conditional visibility ───────────────────────────────────────────────────
// Syntax: "flag" (truthy), "!flag", "key=value", "key!=value".
export function evalShowIf(showIf, ctx) {
  const expr = String(showIf || "").trim();
  if (!expr) return true;
  const neq = expr.match(/^([\w.]+)\s*!=\s*(.+)$/);
  if (neq) return String(ctx[neq[1]] ?? "") !== neq[2].trim();
  const eq = expr.match(/^([\w.]+)\s*=\s*(.+)$/);
  if (eq) return String(ctx[eq[1]] ?? "") === eq[2].trim();
  if (expr.startsWith("!")) return !ctx[expr.slice(1)];
  return !!ctx[expr];
}

// ── renderer ─────────────────────────────────────────────────────────────────

function setTextStyle(doc, el) {
  const style = el.bold && el.italic ? "bolditalic" : el.bold ? "bold" : el.italic ? "italic" : "normal";
  doc.setFont("helvetica", style);
  doc.setFontSize(el.fontSize || 9);
  const [r, g, b] = hexToRgb(el.color || "#1a1a1a");
  doc.setTextColor(r, g, b);
}

function drawText(doc, el, ctx) {
  setTextStyle(doc, el);
  const content = resolveTokens(el.content, ctx);
  if (!content) return;
  const size = el.fontSize || 9;
  const baseY = el.y + size * 0.85;
  const opts = {};
  if (el.wrap && el.w) opts.maxWidth = el.w;
  if (el.align === "center") {
    doc.text(content, el.x + (el.w || 0) / 2, baseY, { ...opts, align: "center" });
  } else if (el.align === "right") {
    doc.text(content, el.x + (el.w || 0), baseY, { ...opts, align: "right" });
  } else {
    doc.text(content, el.x, baseY, opts);
  }
}

function drawRect(doc, el) {
  const hasFill = el.fill && el.fill !== "none";
  const hasStroke = el.stroke && el.stroke !== "none";
  if (hasFill) { const [r, g, b] = hexToRgb(el.fill); doc.setFillColor(r, g, b); }
  if (hasStroke) { const [r, g, b] = hexToRgb(el.stroke); doc.setDrawColor(r, g, b); doc.setLineWidth(el.lineWidth || 0.5); }
  const mode = hasFill && hasStroke ? "FD" : hasFill ? "F" : "S";
  if (el.radius) doc.roundedRect(el.x, el.y, el.w, el.h, el.radius, el.radius, mode);
  else doc.rect(el.x, el.y, el.w, el.h, mode);
}

function drawLine(doc, el) {
  const [r, g, b] = hexToRgb(el.color || "#cbd5e1");
  doc.setDrawColor(r, g, b);
  doc.setLineWidth(el.lineWidth || 0.5);
  doc.line(el.x, el.y, el.x + (el.w || 0), el.y + (el.h || 0));
}

function drawImage(doc, el, ctx) {
  const src = resolveTokens(el.src, ctx);
  if (!src || !src.startsWith("data:")) return;
  try {
    doc.addImage(src, "PNG", el.x, el.y, el.w, el.h);
  } catch (e) { /* bad image data — skip rather than break the document */ }
}

// Draws the table; overflowing rows continue on additional pages with the
// header repeated. `pager` manages page switching for the whole render.
function drawTable(doc, el, ctx, pager) {
  const rows = Array.isArray(ctx[el.binding]) ? ctx[el.binding] : [];
  const cols = el.columns || [];
  if (!cols.length) return;
  const rowH = el.rowHeight || 16;
  const fontSize = el.fontSize || 8;
  const padX = 6;
  const bottomLimit = pager.pageHeight - 40;
  let y = el.y;

  const colX = [];
  let acc = el.x;
  cols.forEach((c) => { colX.push(acc); acc += (c.width || 1 / cols.length) * el.w; });

  const cellText = (text, colIdx, col, bold, color) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(fontSize);
    const [r, g, b] = hexToRgb(color);
    doc.setTextColor(r, g, b);
    const cw = (col.width || 1 / cols.length) * el.w;
    const baseY = y + rowH / 2 + fontSize * 0.35;
    if (col.align === "right") doc.text(String(text), colX[colIdx] + cw - padX, baseY, { align: "right" });
    else if (col.align === "center") doc.text(String(text), colX[colIdx] + cw / 2, baseY, { align: "center" });
    else doc.text(String(text), colX[colIdx] + padX, baseY);
  };

  const drawColLines = () => {
    if (!el.colLines) return;
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    for (let i = 1; i < colX.length; i++) doc.line(colX[i], y, colX[i], y + rowH);
  };

  const drawHeader = () => {
    if (el.headerFill && el.headerFill !== "none") {
      const [r, g, b] = hexToRgb(el.headerFill);
      doc.setFillColor(r, g, b);
      doc.rect(el.x, y, el.w, rowH, "F");
    }
    cols.forEach((c, i) => cellText(c.header || "", i, c, true, el.headerColor || "#334155"));
    drawColLines();
    y += rowH;
  };

  drawHeader();
  rows.forEach((row, ri) => {
    if (y + rowH > bottomLimit) {
      pager.nextOverflowPage();
      y = 40;
      drawHeader();
    }
    if (el.zebra && ri % 2 === 1) {
      const [zr, zg, zb] = hexToRgb(el.zebraFill || "#f8fafc");
      doc.setFillColor(zr, zg, zb);
      doc.rect(el.x, y, el.w, rowH, "F");
    }
    cols.forEach((c, i) => cellText(resolveTokens(c.token, row), i, c, false, el.color || "#1a1a1a"));
    drawColLines();
    if (el.rowLines !== false) {
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.4);
      doc.line(el.x, y + rowH, el.x + el.w, y + rowH);
    }
    y += rowH;
  });
}

// ── customer accent color ────────────────────────────────────────────────────
// A layout may declare `accentOption: { enabled, baseColor, swatches: [] }`.
// When enabled and the customer picked a color (formData.accentColor), every
// element field that uses baseColor is swapped to the chosen color at render
// time — the designed layout itself is never mutated.
const ACCENT_FIELDS = ["color", "fill", "stroke", "headerFill", "headerColor", "zebraFill"];

function applyAccentColor(layout, chosen) {
  const opt = layout.accentOption;
  if (!opt || !opt.enabled || !chosen) return layout;
  if (!/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(String(chosen))) return layout;
  const base = String(opt.baseColor || "").toLowerCase();
  if (!base) return layout;
  return {
    ...layout,
    elements: (layout.elements || []).map((el) => {
      let swapped = null;
      for (const f of ACCENT_FIELDS) {
        if (String(el[f] || "").toLowerCase() === base) {
          swapped = swapped || { ...el };
          swapped[f] = chosen;
        }
      }
      return swapped || el;
    }),
  };
}

// Renders a full layout onto a jsPDF document. Elements are grouped by their
// `page` number; pages are appended as needed (including table overflow).
export function renderLayout(doc, rawLayout, templateData, documentType = "paystub") {
  const chosenAccent = (templateData && (templateData.formData?.accentColor || templateData.accentColor)) || "";
  const layout = applyAccentColor(rawLayout, chosenAccent);
  // Apply the template's own PDF metadata (title/author/creator/producer…);
  // generators skip their built-in metadata for custom templates.
  if (layout.metadata) {
    const props = {};
    ["title", "subject", "author", "keywords", "creator", "producer"].forEach((k) => {
      if (layout.metadata[k]) props[k] = layout.metadata[k];
    });
    if (Object.keys(props).length) {
      try { doc.setProperties(props); } catch (e) { /* metadata must never break rendering */ }
    }
  }
  const ctx = buildContext(templateData, documentType);
  const pageHeight = (layout.page && layout.page.height) || 792;
  const elements = (layout.elements || []).filter((el) => evalShowIf(el.showIf, ctx));

  const maxPage = elements.reduce((m, el) => Math.max(m, el.page || 1), 1);
  const startPage = doc.getNumberOfPages();
  let pagesAdded = 0;

  const pager = {
    pageHeight,
    nextOverflowPage() {
      doc.addPage();
      pagesAdded++;
    },
  };

  for (let p = 1; p <= maxPage; p++) {
    if (p > 1) {
      doc.addPage();
      pagesAdded++;
    }
    // eslint-disable-next-line no-loop-func
    elements.filter((el) => (el.page || 1) === p).forEach((el) => {
      try {
        if (el.type === "rect") drawRect(doc, el);
        else if (el.type === "line") drawLine(doc, el);
        else if (el.type === "image") drawImage(doc, el, ctx);
        else if (el.type === "table") drawTable(doc, el, ctx, pager);
        else drawText(doc, el, ctx);
      } catch (e) {
        // One bad element must never take down the whole document.
        console.error("layoutEngine: element failed to render", el, e);
      }
    });
  }
  return { startPage, pagesAdded };
}

// ── published-layout fetching (used by the public generators) ────────────────

// Cached with a short TTL: the cache exists so debounced previews don't
// refetch on every keystroke, but a republished design must reach long-lived
// SPA sessions (including the admin's own tab navigating from the editor to
// the user-facing pages) without a hard reload. Pinned-version fetches are
// immutable and cached forever.
const layoutCache = new Map();
const LAYOUT_CACHE_TTL = 60 * 1000;

export async function fetchPublishedLayout(templateId, version) {
  const key = version ? `${templateId}@${version}` : templateId;
  const hit = layoutCache.get(key);
  if (hit && (version || Date.now() - hit.at < LAYOUT_CACHE_TTL)) return hit.layout;
  try {
    // The timestamp busts any intermediary HTTP cache; the Map above already
    // limits this to one network request per template per TTL window.
    const q = version ? `?version=${version}` : `?_=${Date.now()}`;
    const res = await fetch(`${BACKEND_URL}/api/doc-templates/${templateId}/layout${q}`);
    if (!res.ok) return hit ? hit.layout : null;
    const data = await res.json();
    const layout = data.layout || null;
    layoutCache.set(key, { layout, at: Date.now() });
    return layout;
  } catch {
    return hit ? hit.layout : null;
  }
}

export function clearLayoutCache() {
  layoutCache.clear();
}

// ── token catalogs (drive the editor's insert menus) ─────────────────────────

const PAYSTUB_TOKEN_GROUPS = [
  {
    group: "Company",
    tokens: [
      ["{company}", "Company name"], ["{companyAddress}", "Company address"],
      ["{companyCityStateZip}", "Company city/state/zip"], ["{companyPhone}", "Company phone"],
    ],
  },
  {
    group: "Employee",
    tokens: [
      ["{employeeName}", "Employee name"], ["{employeeAddress}", "Employee address"],
      ["{employeeCityStateZip}", "Employee city/state/zip"], ["{ssn}", "SSN (masked)"],
      ["{employeeId}", "Employee ID"], ["{filingStatus}", "Filing status"],
      ["{workerLabel}", "EMPLOYEE / CONTRACTOR"],
    ],
  },
  {
    group: "Pay period",
    tokens: [
      ["{payPeriod}", "Pay period range"], ["{startDate}", "Period start"], ["{endDate}", "Period end"],
      ["{payDate}", "Pay date"], ["{payFrequency}", "Pay frequency"], ["{stubLabel}", "Stub # of #"],
    ],
  },
  {
    group: "Amounts",
    tokens: [
      ["{grossPay}", "Gross pay"], ["{netPay}", "Net pay"], ["{regularPay}", "Regular pay"],
      ["{overtimePay}", "Overtime pay"], ["{rate}", "Hourly rate"], ["{hours}", "Hours"],
      ["{totalTax}", "Total taxes"], ["{totalDeductions}", "Total deductions"],
      ["{federalTax}", "Federal tax"], ["{stateTax}", "State tax"], ["{ssTax}", "Social Security"],
      ["{medTax}", "Medicare"],
    ],
  },
  {
    group: "Year to date",
    tokens: [
      ["{ytdGrossPay}", "YTD gross"], ["{ytdNetPay}", "YTD net"], ["{ytdTotalTax}", "YTD taxes"],
      ["{ytdHours}", "YTD hours"],
    ],
  },
];

const CANADIAN_EXTRA_GROUP = {
  group: "Canadian",
  tokens: [
    ["{cpp}", "CPP/QPP amount"], ["{ei}", "EI amount"], ["{qpip}", "QPIP amount"],
    ["{provincialTax}", "Provincial tax"], ["{cppLabel}", "CPP/QPP label"],
    ["{ytdCpp}", "YTD CPP/QPP"], ["{ytdEi}", "YTD EI"], ["{ytdProvincialTax}", "YTD provincial tax"],
  ],
};

const OFFER_LETTER_TOKEN_GROUPS = [
  {
    group: "Company",
    tokens: [
      ["{companyName}", "Company name"], ["{companyAddress}", "Company address"],
      ["{companyCityStateZip}", "Company city/state/zip"], ["{companyPhone}", "Company phone"],
      ["{companyEmail}", "Company email"],
    ],
  },
  {
    group: "Candidate",
    tokens: [
      ["{candidateName}", "Candidate name"], ["{candidateAddress}", "Candidate address"],
      ["{candidateCityStateZip}", "Candidate city/state/zip"],
    ],
  },
  {
    group: "Offer",
    tokens: [
      ["{jobTitle}", "Job title"], ["{department}", "Department"], ["{employmentType}", "Employment type"],
      ["{workLocation}", "Work location"], ["{startDate}", "Start date"], ["{compensation}", "Compensation"],
      ["{payFrequency}", "Pay frequency"], ["{benefits}", "Benefits (multiline)"],
      ["{additionalTerms}", "Additional terms"], ["{responseDeadline}", "Response deadline"],
    ],
  },
  {
    group: "Letter",
    tokens: [
      ["{letterDate}", "Letter date"], ["{signerName}", "Signer name"], ["{signerTitle}", "Signer title"],
    ],
  },
];

const LEGAL_DOCUMENT_TOKEN_GROUPS = [
  {
    group: "Document",
    tokens: [
      ["{documentTitle}", "Document title"], ["{effectiveDate}", "Effective date"],
      ["{governingState}", "Governing state"], ["{todayDate}", "Today's date"],
    ],
  },
  {
    group: "Party A",
    tokens: [
      ["{partyAName}", "Party A name"], ["{partyATitle}", "Party A title"],
      ["{partyAAddress}", "Party A address"], ["{partyACityStateZip}", "Party A city/state/zip"],
      ["{partyAEmail}", "Party A email"], ["{partyAPhone}", "Party A phone"],
    ],
  },
  {
    group: "Party B",
    tokens: [
      ["{partyBName}", "Party B name"], ["{partyBTitle}", "Party B title"],
      ["{partyBAddress}", "Party B address"], ["{partyBCityStateZip}", "Party B city/state/zip"],
      ["{partyBEmail}", "Party B email"], ["{partyBPhone}", "Party B phone"],
    ],
  },
  {
    group: "Content",
    tokens: [
      ["{recitals}", "Recitals (multiline)"], ["{terms}", "Terms (multiline)"],
      ["{additionalTerms}", "Additional terms"],
    ],
  },
  {
    group: "Signatures",
    tokens: [
      ["{partyASignature}", "Party A drawn signature (image src)"], ["{partyASignatureName}", "Party A typed signature"],
      ["{partyASignDate}", "Party A sign date"],
      ["{partyBSignature}", "Party B drawn signature (image src)"], ["{partyBSignatureName}", "Party B typed signature"],
      ["{partyBSignDate}", "Party B sign date"],
      ["{notaryState}", "Notary state"], ["{notaryCounty}", "Notary county"],
    ],
  },
];

const RESUME_TOKEN_GROUPS = [
  {
    group: "Contact",
    tokens: [
      ["{fullName}", "Full name"], ["{contactLine}", "Contact line (joined)"],
      ["{email}", "Email"], ["{phone}", "Phone"], ["{location}", "Location"],
      ["{linkedin}", "LinkedIn"], ["{website}", "Website"],
    ],
  },
  {
    group: "Sections",
    tokens: [
      ["{summary}", "Professional summary"], ["{skillsLine}", "Skills (joined)"],
      ["{experienceText}", "Experience (full text block)"], ["{educationText}", "Education (full text block)"],
    ],
  },
];

const PAYSTUB_TABLE_BINDINGS = [
  { binding: "earnings", label: "Earnings rows", rowTokens: ["{name}", "{nameDetailed}", "{rate}", "{rateDetailed}", "{hours}", "{current}", "{ytd}"] },
  { binding: "deductions", label: "Deduction rows (taxes + items)", rowTokens: ["{name}", "{current}", "{ytd}"] },
  { binding: "employeeTaxes", label: "Employee taxes", rowTokens: ["{name}", "{current}", "{ytd}"] },
  { binding: "employerTaxes", label: "Employer taxes", rowTokens: ["{name}", "{current}", "{ytd}"] },
  { binding: "deductionItems", label: "Deduction items (with tax type)", rowTokens: ["{name}", "{taxType}", "{current}", "{ytd}"] },
  { binding: "contributionItems", label: "Contribution items (with tax type)", rowTokens: ["{name}", "{taxType}", "{current}", "{ytd}"] },
  { binding: "summary", label: "Summary rows", rowTokens: ["{name}", "{current}", "{ytd}"] },
];

const OFFER_LETTER_TABLE_BINDINGS = [
  { binding: "offerDetails", label: "Offer detail rows", rowTokens: ["{label}", "{value}"] },
];

const LEGAL_DOCUMENT_TABLE_BINDINGS = [
  { binding: "parties", label: "Party rows", rowTokens: ["{role}", "{name}", "{address}", "{cityStateZip}"] },
];

const RESUME_TABLE_BINDINGS = [
  { binding: "experience", label: "Experience rows", rowTokens: ["{position}", "{company}", "{location}", "{companyLine}", "{dates}"] },
  { binding: "education", label: "Education rows", rowTokens: ["{degree}", "{institution}", "{institutionLine}", "{gpa}", "{date}"] },
  { binding: "skillRows", label: "Skill rows", rowTokens: ["{name}"] },
];

export function getTokenGroups(documentType) {
  if (documentType === "offer-letter") return OFFER_LETTER_TOKEN_GROUPS;
  if (documentType === "legal-document") return LEGAL_DOCUMENT_TOKEN_GROUPS;
  if (documentType === "resume") return RESUME_TOKEN_GROUPS;
  if (documentType === "canadian-paystub") return [...PAYSTUB_TOKEN_GROUPS, CANADIAN_EXTRA_GROUP];
  return PAYSTUB_TOKEN_GROUPS;
}

export function getTableBindings(documentType) {
  if (documentType === "offer-letter") return OFFER_LETTER_TABLE_BINDINGS;
  if (documentType === "legal-document") return LEGAL_DOCUMENT_TABLE_BINDINGS;
  if (documentType === "resume") return RESUME_TABLE_BINDINGS;
  return PAYSTUB_TABLE_BINDINGS;
}

// "Show when" presets offered in the editor per document type.
export function getShowIfPresets(documentType) {
  if (documentType === "offer-letter") {
    return [
      ["", "Always"],
      ["hasLogo", "Has company logo"],
      ["hasBenefits", "Has benefits text"],
      ["hasDeadline", "Has response deadline"],
    ];
  }
  if (documentType === "legal-document") {
    return [
      ["", "Always"],
      ["hasRecitals", "Has recitals"],
      ["hasAdditionalTerms", "Has additional terms"],
      ["hasGoverningState", "Has governing state"],
      ["hasPartyASignatureImage", "Party A drew/uploaded signature"],
      ["!hasPartyASignatureImage", "Party A typed signature"],
      ["hasPartyBSignatureImage", "Party B drew/uploaded signature"],
      ["!hasPartyBSignatureImage", "Party B typed signature"],
    ];
  }
  if (documentType === "resume") {
    return [
      ["", "Always"],
      ["hasSummary", "Has summary"],
      ["hasSkills", "Has skills"],
      ["hasLinkedin", "Has LinkedIn"],
      ["hasWebsite", "Has website"],
    ];
  }
  return [
    ["", "Always"],
    ["!isContractor", "Employees only"],
    ["isContractor", "Contractors only"],
    ["payType=salary", "Salaried only"],
    ["payType=hourly", "Hourly only"],
    ["hasLogo", "Has company logo"],
    ["hasOvertime", "Has overtime"],
  ];
}

// ── sample data (editor preview + test renders) ──────────────────────────────

const BASE_SAMPLE = {
  formData: {
    company: "Acme Industries LLC",
    companyAddress: "1200 Commerce Street, Suite 400",
    companyCity: "Dallas", companyState: "TX", companyZip: "75201",
    companyPhone: "(214) 555-0182",
    name: "Jordan Michaels",
    address: "48 Maplewood Drive",
    city: "Dallas", state: "TX", zip: "75218",
    ssn: "123-45-6789",
    federalFilingStatus: "Single",
  },
  payType: "hourly", workerType: "employee", isContractor: false,
  rate: 28.5, hours: 80, overtime: 6,
  regularPay: 2280, overtimePay: 256.5, commission: 0, tips: 0,
  grossPay: 2536.5,
  federalTax: 304.38, stateTax: 0, localTax: 0, ssTax: 157.26, medTax: 36.78,
  totalTax: 498.42, totalDeductions: 75, totalContributions: 0,
  netPay: 1963.08,
  deductionsData: [{ name: "Health Insurance", currentAmount: 75 }],
  contributionsData: [],
  startDate: "2026-08-16", endDate: "2026-08-31", payDate: "2026-09-05",
  payFrequency: "Bi-Weekly", stubNum: 1, totalStubs: 1, ytdPayPeriods: 17,
  ytdRegularPay: 38760, ytdOvertimePay: 4360.5, ytdCommission: 0, ytdTips: 0,
  ytdGrossPay: 43120.5, ytdFederalTax: 5174.46, ytdStateTax: 0, ytdLocalTax: 0,
  ytdSsTax: 2673.47, ytdMedTax: 625.25, ytdTotalTax: 8473.18, ytdNetPay: 33372.32,
  ytdHours: 1462, logoDataUrl: "",
};

export const SAMPLE_TEMPLATE_DATA = BASE_SAMPLE;

const OFFER_LETTER_SAMPLE = {
  formData: {
    companyName: "Acme Industries LLC",
    companyAddress: "1200 Commerce Street, Suite 400",
    companyCity: "Dallas", companyState: "TX", companyZip: "75201",
    companyPhone: "(214) 555-0182", companyEmail: "hr@acmeindustries.com",
    letterDate: "2026-09-03",
    candidateName: "Jordan Michaels",
    candidateAddress: "48 Maplewood Drive",
    candidateCity: "Dallas", candidateState: "TX", candidateZip: "75218",
    jobTitle: "Senior Operations Analyst",
    department: "Operations",
    employmentType: "full-time",
    workLocation: "hybrid",
    startDate: "2026-10-01",
    reportingManager: "Casey Nguyen", reportingTitle: "Director of Operations",
    compensationType: "annual", compensationAmount: 92500, payFrequency: "bi-weekly",
    benefits: "Medical, dental, and vision coverage\n401(k) with 4% company match\n15 days paid time off",
    additionalTerms: "This offer is contingent on successful completion of a background check.",
    responseDeadline: "2026-09-17",
    signerName: "Alex Rivera", signerTitle: "Head of People",
    companyLogo: "",
  },
};

const LEGAL_DOCUMENT_SAMPLE = {
  formData: {
    documentTitle: "Mutual Non-Disclosure Agreement",
    effectiveDate: "2026-09-06",
    governingState: "Texas",
    partyAName: "Jordan Michaels", partyATitle: "Founder",
    partyAAddress: "48 Maplewood Drive", partyACity: "Dallas", partyAState: "TX", partyAZip: "75218",
    partyAEmail: "jordan@example.com", partyAPhone: "(214) 555-0148",
    partyBName: "Casey Nguyen", partyBTitle: "Consultant",
    partyBAddress: "1200 Commerce Street, Suite 400", partyBCity: "Dallas", partyBState: "TX", partyBZip: "75201",
    partyBEmail: "casey@example.com", partyBPhone: "(214) 555-0182",
    recitals: "WHEREAS, the parties wish to explore a potential business relationship; and\nWHEREAS, in connection with that relationship each party may disclose confidential information to the other;",
    terms: "1. Confidential Information. Each party agrees to hold the other party's confidential information in strict confidence and not to disclose it to any third party.\n\n2. Term. The obligations under this Agreement shall remain in effect for a period of three (3) years from the Effective Date.\n\n3. Return of Materials. Upon written request, each party shall promptly return or destroy all confidential materials received from the other party.",
    additionalTerms: "This Agreement may be executed in counterparts, each of which shall be deemed an original.",
    partyASignatureName: "Jordan Michaels", partyASignDate: "2026-09-06",
    partyBSignatureName: "Casey Nguyen", partyBSignDate: "2026-09-06",
  },
};

const RESUME_SAMPLE = {
  formData: {
    personalInfo: {
      fullName: "Jordan Michaels",
      email: "jordan.michaels@example.com", phone: "(214) 555-0148",
      location: "Dallas, TX", linkedin: "linkedin.com/in/jordanmichaels", website: "",
    },
    professionalSummary: "Operations analyst with 7+ years of experience turning messy data into clear decisions. Led cross-functional projects that cut fulfillment costs 18% while improving on-time delivery.",
    optimizedSkills: {
      technical: ["SQL", "Excel / Power Query", "Tableau", "Python"],
      soft: ["Stakeholder communication", "Process design"],
      other: [],
    },
    optimizedExperience: [
      {
        position: "Senior Operations Analyst", company: "Acme Industries LLC", location: "Dallas, TX",
        startDate: "2022-03", endDate: "", current: true,
        bullets: [
          "Built the weekly S&OP dashboard used by 40+ managers, replacing three manual reports",
          "Cut fulfillment costs 18% by redesigning the carrier selection process",
          "Mentored two junior analysts through their first automation projects",
        ],
      },
      {
        position: "Operations Analyst", company: "Lonestar Logistics", location: "Fort Worth, TX",
        startDate: "2019-01", endDate: "2022-02", current: false,
        bullets: [
          "Automated daily volume forecasting, saving 10 hours per week",
          "Ran root-cause analysis that reduced mis-ships by 32%",
        ],
      },
    ],
    education: [
      { degree: "B.B.A.", field: "Supply Chain Management", institution: "University of North Texas", gpa: "3.7", graduationDate: "2018-12" },
    ],
  },
};

// Variant samples the editor can switch between to test conditionals.
export function getSampleVariants(documentType) {
  if (documentType === "offer-letter") {
    return [{ key: "default", label: "Sample offer", data: OFFER_LETTER_SAMPLE }];
  }
  if (documentType === "legal-document") {
    const unsigned = {
      formData: {
        ...LEGAL_DOCUMENT_SAMPLE.formData,
        partyASignatureName: "", partyASignDate: "", partyBSignatureName: "", partyBSignDate: "",
        partyAName: LEGAL_DOCUMENT_SAMPLE.formData.partyAName,
      },
    };
    return [
      { key: "signed", label: "Typed signatures", data: LEGAL_DOCUMENT_SAMPLE },
      { key: "unsigned", label: "Before signing", data: unsigned },
    ];
  }
  if (documentType === "resume") {
    return [{ key: "default", label: "Sample resume", data: RESUME_SAMPLE }];
  }
  const salary = {
    ...BASE_SAMPLE,
    payType: "salary", annualSalary: 88000,
    rate: 0, hours: 0, overtime: 0,
    regularPay: 3384.62, overtimePay: 0, grossPay: 3384.62,
    federalTax: 406.15, ssTax: 209.85, medTax: 49.08, totalTax: 665.08,
    netPay: 2644.54,
  };
  const contractor = {
    ...BASE_SAMPLE,
    workerType: "contractor", isContractor: true,
    federalTax: 0, ssTax: 0, medTax: 0, stateTax: 0, totalTax: 0,
    totalDeductions: 0, deductionsData: [],
    netPay: 2536.5,
  };
  const variants = [
    { key: "hourly", label: "Hourly employee", data: BASE_SAMPLE },
    { key: "salary", label: "Salaried employee", data: salary },
    { key: "contractor", label: "Contractor", data: contractor },
  ];
  if (documentType === "canadian-paystub") {
    return variants.map((v) => ({
      ...v,
      data: {
        ...v.data,
        cpp: 145.32, ei: 41.35, qpip: 0, provincialTax: 128.4, cppLabel: "CPP",
        ytdCpp: 2470.44, ytdEi: 702.95, ytdQpip: 0, ytdProvincialTax: 2182.8,
        formData: { ...v.data.formData, companyCity: "Toronto", companyState: "ON", city: "Toronto", state: "ON" },
      },
    }));
  }
  return variants;
}

// ── starter layouts (seeds for new templates) ────────────────────────────────

export const DEFAULT_PAYSTUB_LAYOUT = {
  page: { width: 612, height: 792 },
  elements: [
    // Header band
    { id: "hdr-bg", type: "rect", x: 40, y: 40, w: 532, h: 64, fill: "#14532d", stroke: "none", radius: 4 },
    { id: "hdr-logo", type: "image", x: 56, y: 50, w: 44, h: 44, src: "{logoDataUrl}", showIf: "hasLogo" },
    { id: "hdr-company", type: "text", x: 56, y: 52, w: 300, content: "{company}", fontSize: 15, bold: true, color: "#ffffff" },
    { id: "hdr-addr", type: "text", x: 56, y: 72, w: 300, content: "{companyAddress}", fontSize: 8, color: "#bbf7d0" },
    { id: "hdr-csz", type: "text", x: 56, y: 84, w: 300, content: "{companyCityStateZip}", fontSize: 8, color: "#bbf7d0" },
    { id: "hdr-title", type: "text", x: 372, y: 52, w: 184, content: "EARNINGS STATEMENT", fontSize: 10, bold: true, color: "#ffffff", align: "right" },
    { id: "hdr-period", type: "text", x: 372, y: 70, w: 184, content: "Pay Period: {payPeriod}", fontSize: 8, color: "#bbf7d0", align: "right" },
    { id: "hdr-paydate", type: "text", x: 372, y: 82, w: 184, content: "Pay Date: {payDate}", fontSize: 8, color: "#bbf7d0", align: "right" },

    // Employee block
    { id: "emp-label", type: "text", x: 40, y: 122, w: 200, content: "{workerLabel}", fontSize: 7, bold: true, color: "#64748b" },
    { id: "emp-name", type: "text", x: 40, y: 134, w: 240, content: "{employeeName}", fontSize: 10, bold: true, color: "#1a1a1a" },
    { id: "emp-addr", type: "text", x: 40, y: 148, w: 240, content: "{employeeAddress}", fontSize: 8, color: "#475569" },
    { id: "emp-csz", type: "text", x: 40, y: 160, w: 240, content: "{employeeCityStateZip}", fontSize: 8, color: "#475569" },
    { id: "emp-ssn", type: "text", x: 320, y: 134, w: 252, content: "SSN: {ssn}", fontSize: 8, color: "#475569", align: "right" },
    { id: "emp-freq", type: "text", x: 320, y: 146, w: 252, content: "Pay Frequency: {payFrequency}", fontSize: 8, color: "#475569", align: "right" },
    { id: "emp-filing", type: "text", x: 320, y: 158, w: 252, content: "Filing Status: {filingStatus}", fontSize: 8, color: "#475569", align: "right", showIf: "!isContractor" },
    { id: "div-1", type: "line", x: 40, y: 176, w: 532, h: 0, color: "#e2e8f0", lineWidth: 0.75 },

    // Earnings table
    { id: "earn-label", type: "text", x: 40, y: 190, w: 200, content: "EARNINGS", fontSize: 8, bold: true, color: "#14532d" },
    {
      id: "earn-table", type: "table", x: 40, y: 204, w: 532, binding: "earnings",
      rowHeight: 18, fontSize: 8, headerFill: "#f1f5f9", headerColor: "#334155", color: "#1a1a1a", zebra: false, rowLines: true,
      columns: [
        { header: "Description", token: "{name}", width: 0.34, align: "left" },
        { header: "Rate", token: "{rate}", width: 0.15, align: "right" },
        { header: "Hours", token: "{hours}", width: 0.13, align: "right" },
        { header: "Current", token: "{current}", width: 0.19, align: "right" },
        { header: "YTD", token: "{ytd}", width: 0.19, align: "right" },
      ],
    },

    // Deductions table (hidden for contractors, who have none withheld)
    { id: "ded-label", type: "text", x: 40, y: 330, w: 200, content: "TAXES & DEDUCTIONS", fontSize: 8, bold: true, color: "#14532d", showIf: "!isContractor" },
    {
      id: "ded-table", type: "table", x: 40, y: 344, w: 532, binding: "deductions", showIf: "!isContractor",
      rowHeight: 16, fontSize: 8, headerFill: "#f1f5f9", headerColor: "#334155", color: "#1a1a1a", zebra: false, rowLines: true,
      columns: [
        { header: "Description", token: "{name}", width: 0.55, align: "left" },
        { header: "Current", token: "{current}", width: 0.225, align: "right" },
        { header: "YTD", token: "{ytd}", width: 0.225, align: "right" },
      ],
    },

    // Summary
    { id: "sum-gross-l", type: "text", x: 312, y: 560, w: 130, content: "Gross Pay", fontSize: 9, color: "#475569" },
    { id: "sum-gross-v", type: "text", x: 442, y: 560, w: 130, content: "${grossPay}", fontSize: 9, color: "#1a1a1a", align: "right" },
    { id: "sum-ded-l", type: "text", x: 312, y: 576, w: 130, content: "Total Deductions", fontSize: 9, color: "#475569", showIf: "!isContractor" },
    { id: "sum-ded-v", type: "text", x: 442, y: 576, w: 130, content: "-${totalDeductions}", fontSize: 9, color: "#1a1a1a", align: "right", showIf: "!isContractor" },
    { id: "net-bg", type: "rect", x: 302, y: 594, w: 270, h: 30, fill: "#f0fdf4", stroke: "#bbf7d0", lineWidth: 0.75, radius: 4 },
    { id: "net-label", type: "text", x: 312, y: 602, w: 120, content: "NET PAY", fontSize: 10, bold: true, color: "#14532d" },
    { id: "net-value", type: "text", x: 432, y: 600, w: 130, content: "${netPay}", fontSize: 13, bold: true, color: "#14532d", align: "right" },

    // YTD footer strip
    { id: "ytd-line", type: "line", x: 40, y: 700, w: 532, h: 0, color: "#e2e8f0", lineWidth: 0.75 },
    { id: "ytd-gross", type: "text", x: 40, y: 710, w: 170, content: "YTD Gross: ${ytdGrossPay}", fontSize: 8, color: "#64748b" },
    { id: "ytd-tax", type: "text", x: 221, y: 710, w: 170, content: "YTD Taxes: ${ytdTotalTax}", fontSize: 8, color: "#64748b", align: "center" },
    { id: "ytd-net", type: "text", x: 402, y: 710, w: 170, content: "YTD Net Pay: ${ytdNetPay}", fontSize: 8, color: "#64748b", align: "right" },
  ],
};

// A second, lighter paystub look: no header band, ruled sections, mono-ish grid.
export const MINIMAL_PAYSTUB_LAYOUT = {
  page: { width: 612, height: 792 },
  elements: [
    { id: "m-company", type: "text", x: 40, y: 44, w: 320, content: "{company}", fontSize: 14, bold: true, color: "#111827" },
    { id: "m-addr", type: "text", x: 40, y: 62, w: 320, content: "{companyAddress} · {companyCityStateZip}", fontSize: 8, color: "#6b7280" },
    { id: "m-title", type: "text", x: 372, y: 44, w: 200, content: "PAY STATEMENT", fontSize: 11, bold: true, color: "#111827", align: "right" },
    { id: "m-period", type: "text", x: 372, y: 62, w: 200, content: "{payPeriod}", fontSize: 8, color: "#6b7280", align: "right" },
    { id: "m-rule1", type: "line", x: 40, y: 80, w: 532, h: 0, color: "#111827", lineWidth: 1.2 },

    { id: "m-emp", type: "text", x: 40, y: 92, w: 260, content: "{employeeName}", fontSize: 10, bold: true, color: "#111827" },
    { id: "m-empaddr", type: "text", x: 40, y: 106, w: 260, content: "{employeeAddress}, {employeeCityStateZip}", fontSize: 8, color: "#6b7280" },
    { id: "m-ssn", type: "text", x: 372, y: 92, w: 200, content: "SSN {ssn}", fontSize: 8, color: "#6b7280", align: "right" },
    { id: "m-paydate", type: "text", x: 372, y: 104, w: 200, content: "Paid {payDate} · {payFrequency}", fontSize: 8, color: "#6b7280", align: "right" },

    {
      id: "m-earn", type: "table", x: 40, y: 132, w: 532, binding: "earnings",
      rowHeight: 17, fontSize: 8, headerFill: "none", headerColor: "#111827", color: "#1f2937", zebra: false, rowLines: true,
      columns: [
        { header: "EARNINGS", token: "{name}", width: 0.4, align: "left" },
        { header: "RATE", token: "{rate}", width: 0.15, align: "right" },
        { header: "HOURS", token: "{hours}", width: 0.13, align: "right" },
        { header: "CURRENT", token: "{current}", width: 0.16, align: "right" },
        { header: "YTD", token: "{ytd}", width: 0.16, align: "right" },
      ],
    },
    {
      id: "m-ded", type: "table", x: 40, y: 268, w: 532, binding: "deductions", showIf: "!isContractor",
      rowHeight: 16, fontSize: 8, headerFill: "none", headerColor: "#111827", color: "#1f2937", zebra: false, rowLines: true,
      columns: [
        { header: "DEDUCTIONS", token: "{name}", width: 0.6, align: "left" },
        { header: "CURRENT", token: "{current}", width: 0.2, align: "right" },
        { header: "YTD", token: "{ytd}", width: 0.2, align: "right" },
      ],
    },

    { id: "m-rule2", type: "line", x: 40, y: 560, w: 532, h: 0, color: "#111827", lineWidth: 1.2 },
    { id: "m-gross-l", type: "text", x: 40, y: 572, w: 150, content: "Gross {grossPay}", fontSize: 9, color: "#6b7280" },
    { id: "m-ded-l", type: "text", x: 200, y: 572, w: 180, content: "Deductions {totalDeductions}", fontSize: 9, color: "#6b7280", align: "center", showIf: "!isContractor" },
    { id: "m-net", type: "text", x: 392, y: 566, w: 180, content: "NET ${netPay}", fontSize: 14, bold: true, color: "#111827", align: "right" },
    { id: "m-ytd", type: "text", x: 40, y: 700, w: 532, content: "Year to date — Gross ${ytdGrossPay} · Taxes ${ytdTotalTax} · Net ${ytdNetPay}", fontSize: 8, color: "#9ca3af", align: "center" },
  ],
};

export const DEFAULT_CANADIAN_PAYSTUB_LAYOUT = {
  page: { width: 612, height: 792 },
  elements: DEFAULT_PAYSTUB_LAYOUT.elements.map((el) => {
    if (el.id === "hdr-title") return { ...el, content: "STATEMENT OF EARNINGS" };
    if (el.id === "emp-ssn") return { ...el, content: "" };
    if (el.id === "emp-filing") return { ...el, content: "" };
    return { ...el };
  }),
};

export const DEFAULT_OFFER_LETTER_LAYOUT = {
  page: { width: 612, height: 792 },
  elements: [
    { id: "o-logo", type: "image", x: 40, y: 40, w: 90, h: 36, src: "{logoDataUrl}", showIf: "hasLogo" },
    { id: "o-company", type: "text", x: 40, y: 44, w: 340, content: "{companyName}", fontSize: 16, bold: true, color: "#14532d" },
    { id: "o-caddr", type: "text", x: 372, y: 44, w: 200, content: "{companyAddress}", fontSize: 8, color: "#64748b", align: "right" },
    { id: "o-ccsz", type: "text", x: 372, y: 56, w: 200, content: "{companyCityStateZip}", fontSize: 8, color: "#64748b", align: "right" },
    { id: "o-ccontact", type: "text", x: 372, y: 68, w: 200, content: "{companyPhone}  {companyEmail}", fontSize: 8, color: "#64748b", align: "right" },
    { id: "o-rule", type: "line", x: 40, y: 86, w: 532, h: 0, color: "#14532d", lineWidth: 1.5 },

    { id: "o-date", type: "text", x: 40, y: 104, w: 200, content: "{letterDate}", fontSize: 9, color: "#475569" },
    { id: "o-cand", type: "text", x: 40, y: 126, w: 300, content: "{candidateName}", fontSize: 10, bold: true, color: "#1a1a1a" },
    { id: "o-candaddr", type: "text", x: 40, y: 140, w: 300, content: "{candidateAddress}", fontSize: 9, color: "#475569" },
    { id: "o-candcsz", type: "text", x: 40, y: 152, w: 300, content: "{candidateCityStateZip}", fontSize: 9, color: "#475569" },

    { id: "o-re", type: "text", x: 40, y: 178, w: 532, content: "RE: Offer of Employment — {jobTitle}", fontSize: 11, bold: true, color: "#14532d" },
    { id: "o-dear", type: "text", x: 40, y: 202, w: 532, content: "Dear {candidateName},", fontSize: 10, color: "#1a1a1a" },
    {
      id: "o-open", type: "text", x: 40, y: 222, w: 532, wrap: true, fontSize: 10, color: "#334155",
      content: "We are pleased to extend this offer of employment to you for the position of {jobTitle} at {companyName}. We were impressed with your qualifications and believe you will be a valuable addition to our team.",
    },

    { id: "o-details-label", type: "text", x: 40, y: 288, w: 300, content: "POSITION DETAILS", fontSize: 8, bold: true, color: "#14532d" },
    {
      id: "o-details", type: "table", x: 40, y: 302, w: 532, binding: "offerDetails",
      rowHeight: 18, fontSize: 9, headerFill: "none", headerColor: "#334155", color: "#1f2937", zebra: true, rowLines: false,
      columns: [
        { header: "", token: "{label}", width: 0.35, align: "left" },
        { header: "", token: "{value}", width: 0.65, align: "left" },
      ],
    },

    {
      id: "o-comp", type: "text", x: 40, y: 448, w: 532, wrap: true, fontSize: 10, color: "#334155",
      content: "Your compensation will be {compensation}, paid {payFrequency}.",
    },
    { id: "o-benefits-label", type: "text", x: 40, y: 482, w: 300, content: "BENEFITS", fontSize: 8, bold: true, color: "#14532d", showIf: "hasBenefits" },
    { id: "o-benefits", type: "text", x: 40, y: 496, w: 532, wrap: true, fontSize: 9, color: "#334155", content: "{benefits}", showIf: "hasBenefits" },
    { id: "o-terms", type: "text", x: 40, y: 560, w: 532, wrap: true, fontSize: 9, color: "#334155", content: "{additionalTerms}" },
    {
      id: "o-deadline", type: "text", x: 40, y: 600, w: 532, wrap: true, fontSize: 10, color: "#334155", showIf: "hasDeadline",
      content: "Please confirm your acceptance of this offer by {responseDeadline}.",
    },

    { id: "o-closing", type: "text", x: 40, y: 648, w: 300, content: "Sincerely,", fontSize: 10, color: "#1a1a1a" },
    { id: "o-sigline", type: "line", x: 40, y: 700, w: 180, h: 0, color: "#94a3b8", lineWidth: 0.75 },
    { id: "o-signer", type: "text", x: 40, y: 708, w: 250, content: "{signerName}", fontSize: 10, bold: true, color: "#1a1a1a" },
    { id: "o-signertitle", type: "text", x: 40, y: 722, w: 250, content: "{signerTitle}", fontSize: 9, color: "#64748b" },
  ],
};

// Port of the built-in Gusto template (generateTemplateA): teal section bars,
// gray company/worker boxes, split employee/employer tax tables, itemized
// deduction/contribution tables and the summary block.
const GUSTO_TEAL = "#00a8a1";
const GUSTO_HDR = "#6a6a6a";
export const GUSTO_PAYSTUB_LAYOUT = {
  page: { width: 612, height: 792 },
  metadata: { title: "Gusto", creator: "wkhtmltopdf 0.12.6.1", producer: "Qt 4.8.7" },
  elements: [
    // Header: logo (or teal wordmark), statement title, period line, name+bank
    { id: "g-logo", type: "image", x: 40, y: 40, w: 110, h: 33, src: "{logoDataUrl}", showIf: "hasLogo" },
    { id: "g-wordmark", type: "text", x: 40, y: 44, w: 200, content: "{company}", fontSize: 18, bold: true, color: GUSTO_TEAL, showIf: "!hasLogo" },
    { id: "g-title", type: "text", x: 40, y: 85, w: 300, content: "{statementTitle}", fontSize: 18, bold: true, color: "#000000" },
    { id: "g-period", type: "text", x: 40, y: 122, w: 320, content: "Pay period: {startDate} – {endDate}   Pay Day: {payDate}", fontSize: 9, color: "#000000" },
    { id: "g-namebank", type: "text", x: 40, y: 134, w: 320, content: "{employeeName} (...******{bankLast4})", fontSize: 9, color: "#000000" },

    // Company / worker boxes
    { id: "g-box1", type: "rect", x: 310, y: 70, w: 130, h: 70, fill: "#f8f8f8", stroke: "none" },
    { id: "g-box2", type: "rect", x: 450, y: 70, w: 130, h: 70, fill: "#f8f8f8", stroke: "none" },
    { id: "g-box1-h", type: "text", x: 318, y: 77, w: 114, content: "Company", fontSize: 8, bold: true, color: "#000000" },
    { id: "g-box2-h", type: "text", x: 458, y: 77, w: 114, content: "{workerLabelTitle}", fontSize: 8, bold: true, color: "#000000" },
    { id: "g-box1-l1", type: "text", x: 318, y: 92, w: 114, content: "{company}", fontSize: 7, color: "#000000" },
    { id: "g-box1-l2", type: "text", x: 318, y: 104, w: 114, content: "{companyAddress}", fontSize: 7, color: "#000000" },
    { id: "g-box1-l3", type: "text", x: 318, y: 116, w: 114, content: "{companyCityStateZip}", fontSize: 7, color: "#000000" },
    { id: "g-box1-l4", type: "text", x: 318, y: 128, w: 114, content: "{companyPhone}", fontSize: 7, color: "#000000" },
    { id: "g-box2-l1", type: "text", x: 458, y: 92, w: 114, content: "{employeeName}", fontSize: 7, color: "#000000" },
    { id: "g-box2-l2", type: "text", x: 458, y: 104, w: 114, content: "{ssn}", fontSize: 7, color: "#000000" },
    { id: "g-box2-l3", type: "text", x: 458, y: 116, w: 114, content: "{employeeAddress}", fontSize: 7, color: "#000000" },
    { id: "g-box2-l4", type: "text", x: 458, y: 128, w: 114, content: "{employeeCityStateZip}", fontSize: 7, color: "#000000" },

    // Earnings
    { id: "g-earn-h", type: "text", x: 40, y: 164, w: 300, content: "{earningsTitle}", fontSize: 10, bold: true, color: GUSTO_HDR },
    { id: "g-earn-bar", type: "rect", x: 40, y: 176, w: 532, h: 1, fill: GUSTO_TEAL, stroke: "none" },
    {
      id: "g-earn-table", type: "table", x: 40, y: 184, w: 532, binding: "earnings",
      rowHeight: 16, fontSize: 9, headerFill: "none", headerColor: "#000000", color: "#000000",
      zebra: true, zebraFill: "#f5f5f5", rowLines: false, colLines: true,
      columns: [
        { header: "Description", token: "{nameDetailed}", width: 0.45, align: "left" },
        { header: "Rate", token: "{rateDetailed}", width: 0.13, align: "right" },
        { header: "Hours", token: "{hours}", width: 0.1, align: "right" },
        { header: "Current", token: "${current}", width: 0.14, align: "right" },
        { header: "Year-To-Date", token: "${ytd}", width: 0.18, align: "right" },
      ],
    },

    // Employee / employer taxes (two columns) — employees only
    { id: "g-emptax-h", type: "text", x: 40, y: 292, w: 240, content: "Employee Taxes Withheld", fontSize: 10, bold: true, color: GUSTO_HDR, showIf: "!isContractor" },
    { id: "g-emptax-bar", type: "rect", x: 40, y: 304, w: 261, h: 1, fill: GUSTO_TEAL, stroke: "none", showIf: "!isContractor" },
    { id: "g-ertax-h", type: "text", x: 311, y: 292, w: 240, content: "Employer Tax", fontSize: 10, bold: true, color: GUSTO_HDR, showIf: "!isContractor" },
    { id: "g-ertax-bar", type: "rect", x: 311, y: 304, w: 261, h: 1, fill: GUSTO_TEAL, stroke: "none", showIf: "!isContractor" },
    {
      id: "g-emptax-table", type: "table", x: 40, y: 312, w: 261, binding: "employeeTaxes", showIf: "!isContractor",
      rowHeight: 16, fontSize: 8, headerFill: "none", headerColor: "#000000", color: "#000000",
      zebra: true, zebraFill: "#f5f5f5", rowLines: false, colLines: true,
      columns: [
        { header: "Description", token: "{name}", width: 0.6, align: "left" },
        { header: "Current", token: "${current}", width: 0.2, align: "right" },
        { header: "YTD", token: "${ytd}", width: 0.2, align: "right" },
      ],
    },
    {
      id: "g-ertax-table", type: "table", x: 311, y: 312, w: 261, binding: "employerTaxes", showIf: "!isContractor",
      rowHeight: 16, fontSize: 8, headerFill: "none", headerColor: "#000000", color: "#000000",
      zebra: true, zebraFill: "#f5f5f5", rowLines: false, colLines: true,
      columns: [
        { header: "Company Tax", token: "{name}", width: 0.6, align: "left" },
        { header: "Current", token: "${current}", width: 0.2, align: "right" },
        { header: "YTD", token: "${ytd}", width: 0.2, align: "right" },
      ],
    },

    // Contractor notice (replaces tax section)
    { id: "g-notax-h", type: "text", x: 40, y: 292, w: 300, content: "Tax Information", fontSize: 10, bold: true, color: GUSTO_HDR, showIf: "isContractor" },
    { id: "g-notax-bar", type: "rect", x: 40, y: 304, w: 532, h: 1, fill: GUSTO_TEAL, stroke: "none", showIf: "isContractor" },
    {
      id: "g-notax-text", type: "text", x: 40, y: 314, w: 532, wrap: true, fontSize: 9, color: "#666666", showIf: "isContractor",
      content: "No taxes withheld. As an independent contractor (1099), you are responsible for paying self-employment taxes and any applicable federal/state income taxes.",
    },

    // Deductions / contributions — employees only
    { id: "g-ded-h", type: "text", x: 40, y: 418, w: 300, content: "Employee Deductions", fontSize: 10, bold: true, color: GUSTO_HDR, showIf: "!isContractor" },
    { id: "g-ded-bar", type: "rect", x: 40, y: 430, w: 532, h: 1, fill: GUSTO_TEAL, stroke: "none", showIf: "!isContractor" },
    {
      id: "g-ded-table", type: "table", x: 40, y: 438, w: 532, binding: "deductionItems", showIf: "!isContractor",
      rowHeight: 16, fontSize: 9, headerFill: "none", headerColor: "#000000", color: "#000000",
      zebra: true, zebraFill: "#f5f5f5", rowLines: false, colLines: true,
      columns: [
        { header: "Description", token: "{name}", width: 0.55, align: "left" },
        { header: "Tax Type", token: "{taxType}", width: 0.15, align: "right" },
        { header: "Current", token: "${current}", width: 0.15, align: "right" },
        { header: "Year-To-Date", token: "${ytd}", width: 0.15, align: "right" },
      ],
    },
    { id: "g-con-h", type: "text", x: 40, y: 494, w: 300, content: "Employee Contributions", fontSize: 10, bold: true, color: GUSTO_HDR, showIf: "!isContractor" },
    { id: "g-con-bar", type: "rect", x: 40, y: 506, w: 532, h: 1, fill: GUSTO_TEAL, stroke: "none", showIf: "!isContractor" },
    {
      id: "g-con-table", type: "table", x: 40, y: 514, w: 532, binding: "contributionItems", showIf: "!isContractor",
      rowHeight: 16, fontSize: 9, headerFill: "none", headerColor: "#000000", color: "#000000",
      zebra: true, zebraFill: "#f5f5f5", rowLines: false, colLines: true,
      columns: [
        { header: "Description", token: "{name}", width: 0.55, align: "left" },
        { header: "Tax Type", token: "{taxType}", width: 0.15, align: "right" },
        { header: "Current", token: "${current}", width: 0.15, align: "right" },
        { header: "Year-To-Date", token: "${ytd}", width: 0.15, align: "right" },
      ],
    },

    // Summary
    { id: "g-sum-h", type: "text", x: 40, y: 572, w: 300, content: "Summary", fontSize: 10, bold: true, color: GUSTO_HDR },
    { id: "g-sum-bar", type: "rect", x: 40, y: 584, w: 532, h: 1, fill: GUSTO_TEAL, stroke: "none" },
    {
      id: "g-sum-table", type: "table", x: 40, y: 592, w: 532, binding: "summary",
      rowHeight: 16, fontSize: 9, headerFill: "none", headerColor: "#000000", color: "#000000",
      zebra: true, zebraFill: "#f5f5f5", rowLines: false, colLines: true,
      columns: [
        { header: "Description", token: "{name}", width: 0.55, align: "left" },
        { header: "Current", token: "{current}", width: 0.225, align: "right" },
        { header: "Year-To-Date", token: "{ytd}", width: 0.225, align: "right" },
      ],
    },
  ],
};

// Port of the built-in OnPay check-stub template (generateTemplateH): blue
// banner, check-info bar, three side-by-side tables. Structural port — the
// original's fixed ruled grid is approximated with bordered boxes.
const ONPAY_BLUE = "#2580d8";
export const ONPAY_PAYSTUB_LAYOUT = {
  page: { width: 612, height: 792 },
  metadata: { creator: "wkhtmltopdf 0.12.6.1", producer: "Qt 4.8.7" },
  elements: [
    { id: "h-name-top", type: "text", x: 65, y: 14, w: 260, content: "{employeeName}", fontSize: 12, bold: true, color: "#000000" },
    { id: "h-dd-badge", type: "rect", x: 562, y: 10, w: 40, h: 12, fill: ONPAY_BLUE, stroke: "none" },
    { id: "h-dd-badge-t", type: "text", x: 562, y: 12, w: 40, content: "***DD***", fontSize: 7, bold: true, color: "#ffffff", align: "center" },
    { id: "h-banner", type: "rect", x: 15, y: 27, w: 582, h: 20, fill: ONPAY_BLUE, stroke: "none" },
    { id: "h-banner-t", type: "text", x: 25, y: 32, w: 560, content: "DIRECT DEPOSIT *** DIRECT DEPOSIT **************************************************************", fontSize: 11, color: "#ffffff" },

    { id: "h-addr1", type: "text", x: 20, y: 60, w: 260, content: "{employeeName}", fontSize: 9, color: "#000000" },
    { id: "h-addr2", type: "text", x: 20, y: 72, w: 260, content: "{employeeAddress}", fontSize: 9, color: "#000000" },
    { id: "h-addr3", type: "text", x: 20, y: 84, w: 260, content: "{employeeCityStateZip}", fontSize: 9, color: "#000000" },
    { id: "h-thanks", type: "text", x: 20, y: 104, w: 260, content: "{memo}", fontSize: 8, color: "#000000" },
    { id: "h-void", type: "text", x: 420, y: 92, w: 170, content: "*** VOID ***", fontSize: 18, bold: true, color: "#000000", align: "right" },

    // Check-info bar
    { id: "h-nameband", type: "rect", x: 17, y: 128, w: 155, h: 12, fill: ONPAY_BLUE, stroke: "none" },
    { id: "h-nameband-t", type: "text", x: 21, y: 130, w: 150, content: "{employeeName}", fontSize: 9, bold: true, color: "#ffffff" },
    { id: "h-check-l", type: "text", x: 20, y: 146, w: 60, content: "Check #:", fontSize: 7, bold: true, color: "#000000" },
    { id: "h-check-v", type: "text", x: 50, y: 146, w: 60, content: "{checkNumber}", fontSize: 7, color: "#000000" },
    { id: "h-cdate-l", type: "text", x: 105, y: 146, w: 60, content: "Check Date:", fontSize: 7, bold: true, color: "#000000" },
    { id: "h-cdate-v", type: "text", x: 160, y: 146, w: 70, content: "{payDate}", fontSize: 7, color: "#000000" },
    { id: "h-pstart-l", type: "text", x: 20, y: 158, w: 60, content: "Period Start:", fontSize: 7, bold: true, color: "#000000" },
    { id: "h-pstart-v", type: "text", x: 65, y: 158, w: 70, content: "{startDate}", fontSize: 7, color: "#000000" },
    { id: "h-pend-l", type: "text", x: 105, y: 158, w: 60, content: "Period Ending:", fontSize: 7, bold: true, color: "#000000" },
    { id: "h-pend-v", type: "text", x: 160, y: 158, w: 70, content: "{endDate}", fontSize: 7, color: "#000000" },
    { id: "h-memo-l", type: "text", x: 272, y: 137, w: 40, content: "MEMO:", fontSize: 7, bold: true, color: "#000000" },
    { id: "h-memo-v", type: "text", x: 302, y: 137, w: 200, content: "{memo}", fontSize: 7, color: "#000000" },
    { id: "h-emp-l", type: "text", x: 272, y: 148, w: 40, content: "EMP#:", fontSize: 7, bold: true, color: "#000000" },
    { id: "h-emp-v", type: "text", x: 302, y: 148, w: 200, content: "{employeeNumber}", fontSize: 7, color: "#000000" },

    // Three side-by-side tables
    { id: "h-t1-hdr", type: "rect", x: 15, y: 176, w: 233, h: 12, fill: ONPAY_BLUE, stroke: "none" },
    { id: "h-t1-hdr-t", type: "text", x: 15, y: 178, w: 233, content: "Gross Wages", fontSize: 8, bold: true, color: "#ffffff", align: "center" },
    { id: "h-t1-box", type: "rect", x: 15, y: 188, w: 233, h: 210, fill: "none", stroke: "#c8c8c8", lineWidth: 0.5 },
    {
      id: "h-t1", type: "table", x: 15, y: 188, w: 233, binding: "earnings",
      rowHeight: 12, fontSize: 7, headerFill: "#d7d7d7", headerColor: "#000000", color: "#000000",
      zebra: false, rowLines: true, colLines: true,
      columns: [
        { header: "Description", token: "{name}", width: 0.34, align: "left" },
        { header: "Rate", token: "{rate}", width: 0.22, align: "right" },
        { header: "Hours", token: "{hours}", width: 0.18, align: "right" },
        { header: "Current", token: "{current}", width: 0.26, align: "right" },
      ],
    },
    { id: "h-t2-hdr", type: "rect", x: 248, y: 176, w: 163, h: 12, fill: ONPAY_BLUE, stroke: "none" },
    { id: "h-t2-hdr-t", type: "text", x: 248, y: 178, w: 163, content: "Withholding Taxes", fontSize: 8, bold: true, color: "#ffffff", align: "center" },
    { id: "h-t2-box", type: "rect", x: 248, y: 188, w: 163, h: 210, fill: "none", stroke: "#c8c8c8", lineWidth: 0.5 },
    {
      id: "h-t2", type: "table", x: 248, y: 188, w: 163, binding: "employeeTaxes", showIf: "!isContractor",
      rowHeight: 12, fontSize: 7, headerFill: "#d7d7d7", headerColor: "#000000", color: "#000000",
      zebra: false, rowLines: true, colLines: true,
      columns: [
        { header: "Tax", token: "{name}", width: 0.56, align: "left" },
        { header: "Current", token: "{current}", width: 0.22, align: "right" },
        { header: "YTD", token: "{ytd}", width: 0.22, align: "right" },
      ],
    },
    { id: "h-t3-hdr", type: "rect", x: 411, y: 176, w: 186, h: 12, fill: ONPAY_BLUE, stroke: "none" },
    { id: "h-t3-hdr-t", type: "text", x: 411, y: 178, w: 186, content: "Deductions / Benefits", fontSize: 8, bold: true, color: "#ffffff", align: "center" },
    { id: "h-t3-box", type: "rect", x: 411, y: 188, w: 186, h: 210, fill: "none", stroke: "#c8c8c8", lineWidth: 0.5 },
    {
      id: "h-t3", type: "table", x: 411, y: 188, w: 186, binding: "deductionItems", showIf: "!isContractor",
      rowHeight: 12, fontSize: 7, headerFill: "#d7d7d7", headerColor: "#000000", color: "#000000",
      zebra: false, rowLines: true, colLines: true,
      columns: [
        { header: "Description", token: "{name}", width: 0.56, align: "left" },
        { header: "Current", token: "{current}", width: 0.22, align: "right" },
        { header: "YTD", token: "{ytd}", width: 0.22, align: "right" },
      ],
    },

    // Totals strip
    { id: "h-totals-bg", type: "rect", x: 15, y: 412, w: 582, h: 34, fill: "#f0f0f0", stroke: "#c8c8c8", lineWidth: 0.5 },
    { id: "h-tot-gross-l", type: "text", x: 25, y: 418, w: 100, content: "GROSS WAGES", fontSize: 7, bold: true, color: "#000000" },
    { id: "h-tot-gross-v", type: "text", x: 25, y: 428, w: 100, content: "${grossPay}", fontSize: 9, bold: true, color: "#000000" },
    { id: "h-tot-tax-l", type: "text", x: 165, y: 418, w: 100, content: "TAXES", fontSize: 7, bold: true, color: "#000000" },
    { id: "h-tot-tax-v", type: "text", x: 165, y: 428, w: 100, content: "${totalTax}", fontSize: 9, bold: true, color: "#000000" },
    { id: "h-tot-ded-l", type: "text", x: 295, y: 418, w: 110, content: "DEDUCTIONS", fontSize: 7, bold: true, color: "#000000" },
    { id: "h-tot-ded-v", type: "text", x: 295, y: 428, w: 110, content: "${totalDeductions}", fontSize: 9, bold: true, color: "#000000" },
    { id: "h-tot-net-bg", type: "rect", x: 440, y: 415, w: 150, h: 28, fill: ONPAY_BLUE, stroke: "none" },
    { id: "h-tot-net-l", type: "text", x: 448, y: 419, w: 80, content: "NET PAY", fontSize: 7, bold: true, color: "#ffffff" },
    { id: "h-tot-net-v", type: "text", x: 448, y: 427, w: 134, content: "${netPay}", fontSize: 11, bold: true, color: "#ffffff" },

    { id: "h-ytd-strip", type: "text", x: 15, y: 460, w: 582, content: "YTD — Gross: ${ytdGrossPay}   Taxes: ${ytdTotalTax}   Net: ${ytdNetPay}   Hours: {ytdHours}", fontSize: 8, color: "#555555" },
  ],
};

// Starter library shown when creating a new template.
export const DEFAULT_LEGAL_DOCUMENT_LAYOUT = {
  page: { width: 612, height: 792 },
  elements: [
    { id: "l-title", type: "text", x: 40, y: 48, w: 532, content: "{documentTitle}", fontSize: 17, bold: true, color: "#1a1a1a", align: "center" },
    { id: "l-eff", type: "text", x: 40, y: 74, w: 532, content: "Effective as of {effectiveDate}", fontSize: 9, color: "#475569", align: "center" },
    { id: "l-rule", type: "rect", x: 226, y: 92, w: 160, h: 2, fill: "#14532d", stroke: "none" },
    {
      id: "l-intro", type: "text", x: 40, y: 112, w: 532, wrap: true, fontSize: 9.5, color: "#1f2937",
      content: 'This agreement ("Agreement") is entered into as of {effectiveDate}, by and between {partyAName}, of {partyAAddress}, {partyACityStateZip} ("Party A"), and {partyBName}, of {partyBAddress}, {partyBCityStateZip} ("Party B").',
    },
    { id: "l-rec-h", type: "text", x: 40, y: 168, w: 300, content: "RECITALS", fontSize: 10, bold: true, color: "#14532d", showIf: "hasRecitals" },
    { id: "l-rec-bar", type: "rect", x: 40, y: 181, w: 532, h: 1, fill: "#d1d5db", stroke: "none", showIf: "hasRecitals" },
    { id: "l-rec", type: "text", x: 40, y: 190, w: 532, wrap: true, fontSize: 9, color: "#334155", content: "{recitals}", showIf: "hasRecitals" },
    { id: "l-terms-h", type: "text", x: 40, y: 258, w: 300, content: "TERMS AND CONDITIONS", fontSize: 10, bold: true, color: "#14532d" },
    { id: "l-terms-bar", type: "rect", x: 40, y: 271, w: 532, h: 1, fill: "#d1d5db", stroke: "none" },
    { id: "l-terms", type: "text", x: 40, y: 280, w: 532, wrap: true, fontSize: 9, color: "#1f2937", content: "{terms}" },
    { id: "l-add-h", type: "text", x: 40, y: 470, w: 300, content: "ADDITIONAL TERMS", fontSize: 10, bold: true, color: "#14532d", showIf: "hasAdditionalTerms" },
    { id: "l-add-bar", type: "rect", x: 40, y: 483, w: 532, h: 1, fill: "#d1d5db", stroke: "none", showIf: "hasAdditionalTerms" },
    { id: "l-add", type: "text", x: 40, y: 492, w: 532, wrap: true, fontSize: 9, color: "#334155", content: "{additionalTerms}", showIf: "hasAdditionalTerms" },
    {
      id: "l-law", type: "text", x: 40, y: 546, w: 532, wrap: true, fontSize: 9, color: "#334155", showIf: "hasGoverningState",
      content: "This Agreement shall be governed by and construed in accordance with the laws of the State of {governingState}.",
    },
    {
      id: "l-witness", type: "text", x: 40, y: 584, w: 532, wrap: true, fontSize: 9, bold: true, color: "#1f2937",
      content: "IN WITNESS WHEREOF, the parties have executed this Agreement as of the date first written above.",
    },
    // Party A signature block
    { id: "l-siga-img", type: "image", x: 40, y: 622, w: 150, h: 34, src: "{partyASignature}", showIf: "hasPartyASignatureImage" },
    { id: "l-siga-typed", type: "text", x: 40, y: 634, w: 220, content: "{partyASignatureName}", fontSize: 16, italic: true, color: "#1a1a1a", showIf: "!hasPartyASignatureImage" },
    { id: "l-siga-line", type: "line", x: 40, y: 660, w: 220, h: 0, color: "#1a1a1a", lineWidth: 0.8 },
    { id: "l-siga-name", type: "text", x: 40, y: 666, w: 220, content: "{partyAName} — Party A", fontSize: 8.5, bold: true, color: "#1a1a1a" },
    { id: "l-siga-date", type: "text", x: 40, y: 679, w: 220, content: "Date: {partyASignDate}", fontSize: 8, color: "#475569" },
    // Party B signature block
    { id: "l-sigb-img", type: "image", x: 332, y: 622, w: 150, h: 34, src: "{partyBSignature}", showIf: "hasPartyBSignatureImage" },
    { id: "l-sigb-typed", type: "text", x: 332, y: 634, w: 220, content: "{partyBSignatureName}", fontSize: 16, italic: true, color: "#1a1a1a", showIf: "!hasPartyBSignatureImage" },
    { id: "l-sigb-line", type: "line", x: 332, y: 660, w: 220, h: 0, color: "#1a1a1a", lineWidth: 0.8 },
    { id: "l-sigb-name", type: "text", x: 332, y: 666, w: 220, content: "{partyBName} — Party B", fontSize: 8.5, bold: true, color: "#1a1a1a" },
    { id: "l-sigb-date", type: "text", x: 332, y: 679, w: 220, content: "Date: {partyBSignDate}", fontSize: 8, color: "#475569" },
  ],
};

export const DEFAULT_RESUME_LAYOUT = {
  page: { width: 612, height: 792 },
  elements: [
    { id: "r-name", type: "text", x: 50, y: 46, w: 512, content: "{fullName}", fontSize: 22, bold: true, color: "#14532d" },
    { id: "r-contact", type: "text", x: 50, y: 76, w: 512, content: "{contactLine}", fontSize: 8.5, color: "#64748b" },
    { id: "r-rule", type: "rect", x: 50, y: 92, w: 512, h: 2, fill: "#14532d", stroke: "none" },
    { id: "r-sum-h", type: "text", x: 50, y: 106, w: 300, content: "PROFESSIONAL SUMMARY", fontSize: 10, bold: true, color: "#14532d", showIf: "hasSummary" },
    { id: "r-sum", type: "text", x: 50, y: 122, w: 512, wrap: true, fontSize: 9, color: "#334155", content: "{summary}", showIf: "hasSummary" },
    { id: "r-exp-h", type: "text", x: 50, y: 176, w: 300, content: "PROFESSIONAL EXPERIENCE", fontSize: 10, bold: true, color: "#14532d" },
    { id: "r-exp-bar", type: "rect", x: 50, y: 189, w: 512, h: 1, fill: "#d1d5db", stroke: "none" },
    { id: "r-exp", type: "text", x: 50, y: 198, w: 512, wrap: true, fontSize: 9, color: "#1f2937", content: "{experienceText}" },
    { id: "r-edu-h", type: "text", x: 50, y: 520, w: 300, content: "EDUCATION", fontSize: 10, bold: true, color: "#14532d" },
    { id: "r-edu-bar", type: "rect", x: 50, y: 533, w: 512, h: 1, fill: "#d1d5db", stroke: "none" },
    { id: "r-edu", type: "text", x: 50, y: 542, w: 512, wrap: true, fontSize: 9, color: "#1f2937", content: "{educationText}" },
    { id: "r-skills-h", type: "text", x: 50, y: 600, w: 300, content: "SKILLS", fontSize: 10, bold: true, color: "#14532d", showIf: "hasSkills" },
    { id: "r-skills-bar", type: "rect", x: 50, y: 613, w: 512, h: 1, fill: "#d1d5db", stroke: "none", showIf: "hasSkills" },
    { id: "r-skills", type: "text", x: 50, y: 622, w: 512, wrap: true, fontSize: 9, color: "#334155", content: "{skillsLine}", showIf: "hasSkills" },
  ],
};

export const STARTER_LAYOUTS = [
  { key: "paystub-gusto", name: "Gusto-Style Paystub (ported)", description: "Gusto Style Inspired Template", documentType: "paystub", layout: GUSTO_PAYSTUB_LAYOUT },
  { key: "paystub-onpay", name: "OnPay-Style Paystub (ported)", description: "OnPay Style Inspired Template", documentType: "paystub", layout: ONPAY_PAYSTUB_LAYOUT },
  { key: "paystub-classic", name: "Classic Green Paystub", description: "Clean MintSlip paystub with header band", documentType: "paystub", layout: DEFAULT_PAYSTUB_LAYOUT },
  { key: "paystub-minimal", name: "Minimal Ruled Paystub", description: "Minimal ruled pay statement", documentType: "paystub", layout: MINIMAL_PAYSTUB_LAYOUT },
  { key: "canadian-classic", name: "Canadian Paystub", description: "Canadian statement of earnings", documentType: "canadian-paystub", layout: DEFAULT_CANADIAN_PAYSTUB_LAYOUT },
  { key: "offer-letter", name: "Offer Letter", description: "Professional offer of employment", documentType: "offer-letter", layout: DEFAULT_OFFER_LETTER_LAYOUT },
  { key: "legal-document", name: "Legal Document", description: "Two-party agreement with signature blocks", documentType: "legal-document", layout: DEFAULT_LEGAL_DOCUMENT_LAYOUT },
  { key: "resume", name: "Resume", description: "Custom AI resume design", documentType: "resume", layout: DEFAULT_RESUME_LAYOUT },
];

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

function maskSSN(ssn) {
  const digits = String(ssn || "").replace(/\D/g, "");
  return digits.length >= 4 ? `XXX-XX-${digits.slice(-4)}` : "";
}

function titleCase(s) {
  return String(s || "").replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
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
  };

  const ytdPeriods = td.ytdPayPeriods || 1;
  const isSalary = td.payType === "salary";

  const earnings = [];
  if (isSalary) {
    earnings.push({ name: "Salary", rate: "—", hours: "—", current: money(td.regularPay), ytd: money(td.ytdRegularPay) });
  } else {
    earnings.push({ name: "Regular", rate: money(td.rate), hours: String(td.hours ?? ""), current: money(td.regularPay), ytd: money(td.ytdRegularPay) });
  }
  if (Number(td.overtime) > 0) {
    earnings.push({ name: "Overtime", rate: money(td.rate * 1.5), hours: String(td.overtime), current: money(td.overtimePay), ytd: money(td.ytdOvertimePay) });
  }
  if (Number(td.commission) > 0) {
    earnings.push({ name: "Commission", rate: "—", hours: "—", current: money(td.commission), ytd: money(td.ytdCommission) });
  }
  if (Number(td.tips) > 0) {
    earnings.push({ name: td.tipsCash ? "Tips (cash)" : "Tips", rate: "—", hours: "—", current: money(td.tips), ytd: money(td.ytdTips) });
  }
  ctx.earnings = earnings;

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

const CONTEXT_BUILDERS = {
  paystub: buildPaystubContext,
  "canadian-paystub": buildPaystubContext,
  "offer-letter": buildOfferLetterContext,
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

  const drawHeader = () => {
    if (el.headerFill && el.headerFill !== "none") {
      const [r, g, b] = hexToRgb(el.headerFill);
      doc.setFillColor(r, g, b);
      doc.rect(el.x, y, el.w, rowH, "F");
    }
    cols.forEach((c, i) => cellText(c.header || "", i, c, true, el.headerColor || "#334155"));
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
      doc.setFillColor(248, 250, 252);
      doc.rect(el.x, y, el.w, rowH, "F");
    }
    cols.forEach((c, i) => cellText(resolveTokens(c.token, row), i, c, false, el.color || "#1a1a1a"));
    if (el.rowLines !== false) {
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.4);
      doc.line(el.x, y + rowH, el.x + el.w, y + rowH);
    }
    y += rowH;
  });
}

// Renders a full layout onto a jsPDF document. Elements are grouped by their
// `page` number; pages are appended as needed (including table overflow).
export function renderLayout(doc, layout, templateData, documentType = "paystub") {
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

const layoutCache = new Map();

export async function fetchPublishedLayout(templateId, version) {
  const key = version ? `${templateId}@${version}` : templateId;
  if (layoutCache.has(key)) return layoutCache.get(key);
  try {
    const q = version ? `?version=${version}` : "";
    const res = await fetch(`${BACKEND_URL}/api/doc-templates/${templateId}/layout${q}`);
    if (!res.ok) return null;
    const data = await res.json();
    const layout = data.layout || null;
    layoutCache.set(key, layout);
    return layout;
  } catch {
    return null;
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

const PAYSTUB_TABLE_BINDINGS = [
  { binding: "earnings", label: "Earnings rows", rowTokens: ["{name}", "{rate}", "{hours}", "{current}", "{ytd}"] },
  { binding: "deductions", label: "Deduction rows", rowTokens: ["{name}", "{current}", "{ytd}"] },
];

const OFFER_LETTER_TABLE_BINDINGS = [
  { binding: "offerDetails", label: "Offer detail rows", rowTokens: ["{label}", "{value}"] },
];

export function getTokenGroups(documentType) {
  if (documentType === "offer-letter") return OFFER_LETTER_TOKEN_GROUPS;
  if (documentType === "canadian-paystub") return [...PAYSTUB_TOKEN_GROUPS, CANADIAN_EXTRA_GROUP];
  return PAYSTUB_TOKEN_GROUPS;
}

export function getTableBindings(documentType) {
  return documentType === "offer-letter" ? OFFER_LETTER_TABLE_BINDINGS : PAYSTUB_TABLE_BINDINGS;
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

// Variant samples the editor can switch between to test conditionals.
export function getSampleVariants(documentType) {
  if (documentType === "offer-letter") {
    return [{ key: "default", label: "Sample offer", data: OFFER_LETTER_SAMPLE }];
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

// Starter library shown when creating a new template.
export const STARTER_LAYOUTS = [
  { key: "paystub-classic", name: "Classic Green Paystub", documentType: "paystub", layout: DEFAULT_PAYSTUB_LAYOUT },
  { key: "paystub-minimal", name: "Minimal Ruled Paystub", documentType: "paystub", layout: MINIMAL_PAYSTUB_LAYOUT },
  { key: "canadian-classic", name: "Canadian Paystub", documentType: "canadian-paystub", layout: DEFAULT_CANADIAN_PAYSTUB_LAYOUT },
  { key: "offer-letter", name: "Offer Letter", documentType: "offer-letter", layout: DEFAULT_OFFER_LETTER_LAYOUT },
];

// ─────────────────────────────────────────────────────────────────────────────
// Layout engine: renders admin-designed document templates.
//
// A template layout is pure data: { page: {width, height}, elements: [...] }.
// Element types:
//   text  — { type, x, y, w, content, fontSize, bold, italic, color, align, wrap }
//           content may mix static text with {tokens}, e.g. "Net Pay: ${netPay}"
//   rect  — { type, x, y, w, h, fill, stroke, lineWidth, radius }
//   line  — { type, x, y, w, h, color, lineWidth }  (drawn from (x,y) to (x+w,y+h))
//   image — { type, x, y, w, h, src }  (src is a {token} resolving to a data URL,
//           e.g. {logoDataUrl}, or a literal data URL)
//   table — { type, x, y, w, binding, columns, fontSize, rowHeight, headerFill,
//             headerColor, color, zebra, rowLines }
//           binding names a row array from the data context ("earnings",
//           "deductions"); column tokens resolve against each row object.
//
// The same context builder feeds the on-canvas editor preview and the real
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

function maskSSN(ssn) {
  const digits = String(ssn || "").replace(/\D/g, "");
  return digits.length >= 4 ? `XXX-XX-${digits.slice(-4)}` : "";
}

function hexToRgb(hex) {
  const h = String(hex || "#000000").replace("#", "");
  const v = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  return [parseInt(v.slice(0, 2), 16) || 0, parseInt(v.slice(2, 4), 16) || 0, parseInt(v.slice(4, 6), 16) || 0];
}

// ── data context ─────────────────────────────────────────────────────────────

// Flattens the generator's templateData into token → display-string pairs plus
// the row arrays tables can bind to. Everything is pre-formatted for display.
export function buildContext(td) {
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

  const deductions = [
    { name: "Federal Income Tax", current: money(td.federalTax), ytd: money(td.ytdFederalTax) },
    { name: "Social Security", current: money(td.ssTax), ytd: money(td.ytdSsTax) },
    { name: "Medicare", current: money(td.medTax), ytd: money(td.ytdMedTax) },
  ];
  if (Number(td.stateTax) > 0) deductions.push({ name: "State Income Tax", current: money(td.stateTax), ytd: money(td.ytdStateTax) });
  if (Number(td.localTax) > 0) deductions.push({ name: "Local Tax", current: money(td.localTax), ytd: money(td.ytdLocalTax) });
  (td.deductionsData || []).forEach((d) => {
    deductions.push({ name: d.name || "Deduction", current: money(d.currentAmount), ytd: money((d.currentAmount || 0) * ytdPeriods) });
  });
  (td.contributionsData || []).forEach((c) => {
    deductions.push({ name: c.name || "Contribution", current: money(c.currentAmount), ytd: money((c.currentAmount || 0) * ytdPeriods) });
  });
  ctx.deductions = deductions;

  return ctx;
}

export function resolveTokens(str, ctx) {
  return String(str ?? "").replace(/\{([\w.]+)\}/g, (m, key) => {
    const v = ctx[key];
    return v === undefined || v === null ? "" : String(v);
  });
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

function drawTable(doc, el, ctx) {
  const rows = Array.isArray(ctx[el.binding]) ? ctx[el.binding] : [];
  const cols = el.columns || [];
  if (!cols.length) return;
  const rowH = el.rowHeight || 16;
  const fontSize = el.fontSize || 8;
  const padX = 6;
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

  // header row
  if (el.headerFill && el.headerFill !== "none") {
    const [r, g, b] = hexToRgb(el.headerFill);
    doc.setFillColor(r, g, b);
    doc.rect(el.x, y, el.w, rowH, "F");
  }
  cols.forEach((c, i) => cellText(c.header || "", i, c, true, el.headerColor || "#334155"));
  y += rowH;

  // body rows
  rows.forEach((row, ri) => {
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

// Renders a full layout onto an existing jsPDF document page.
export function renderLayout(doc, layout, templateData) {
  const ctx = buildContext(templateData);
  (layout.elements || []).forEach((el) => {
    try {
      if (el.type === "rect") drawRect(doc, el);
      else if (el.type === "line") drawLine(doc, el);
      else if (el.type === "image") drawImage(doc, el, ctx);
      else if (el.type === "table") drawTable(doc, el, ctx);
      else drawText(doc, el, ctx);
    } catch (e) {
      // One bad element must never take down the whole document.
      console.error("layoutEngine: element failed to render", el, e);
    }
  });
}

// ── published-layout fetching (used by the public generators) ────────────────

const layoutCache = new Map();

export async function fetchPublishedLayout(templateId) {
  if (layoutCache.has(templateId)) return layoutCache.get(templateId);
  try {
    const res = await fetch(`${BACKEND_URL}/api/doc-templates/${templateId}/layout`);
    if (!res.ok) return null;
    const data = await res.json();
    const layout = data.layout || null;
    layoutCache.set(templateId, layout);
    return layout;
  } catch {
    return null;
  }
}

export function clearLayoutCache() {
  layoutCache.clear();
}

// ── token catalog (drives the editor's insert menus) ─────────────────────────

export const TOKEN_GROUPS = [
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

export const TABLE_BINDINGS = [
  { binding: "earnings", label: "Earnings rows", rowTokens: ["{name}", "{rate}", "{hours}", "{current}", "{ytd}"] },
  { binding: "deductions", label: "Deduction rows", rowTokens: ["{name}", "{current}", "{ytd}"] },
];

// ── sample data (editor preview + test renders) ──────────────────────────────

export const SAMPLE_TEMPLATE_DATA = {
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
  payType: "hourly", workerType: "employee",
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

// ── starter layout (seed for new templates) ──────────────────────────────────

export const DEFAULT_PAYSTUB_LAYOUT = {
  page: { width: 612, height: 792 },
  elements: [
    // Header band
    { id: "hdr-bg", type: "rect", x: 40, y: 40, w: 532, h: 64, fill: "#14532d", stroke: "none", radius: 4 },
    { id: "hdr-company", type: "text", x: 56, y: 52, w: 300, content: "{company}", fontSize: 15, bold: true, color: "#ffffff" },
    { id: "hdr-addr", type: "text", x: 56, y: 72, w: 300, content: "{companyAddress}", fontSize: 8, color: "#bbf7d0" },
    { id: "hdr-csz", type: "text", x: 56, y: 84, w: 300, content: "{companyCityStateZip}", fontSize: 8, color: "#bbf7d0" },
    { id: "hdr-title", type: "text", x: 372, y: 52, w: 184, content: "EARNINGS STATEMENT", fontSize: 10, bold: true, color: "#ffffff", align: "right" },
    { id: "hdr-period", type: "text", x: 372, y: 70, w: 184, content: "Pay Period: {payPeriod}", fontSize: 8, color: "#bbf7d0", align: "right" },
    { id: "hdr-paydate", type: "text", x: 372, y: 82, w: 184, content: "Pay Date: {payDate}", fontSize: 8, color: "#bbf7d0", align: "right" },

    // Employee block
    { id: "emp-label", type: "text", x: 40, y: 122, w: 200, content: "EMPLOYEE", fontSize: 7, bold: true, color: "#64748b" },
    { id: "emp-name", type: "text", x: 40, y: 134, w: 240, content: "{employeeName}", fontSize: 10, bold: true, color: "#1a1a1a" },
    { id: "emp-addr", type: "text", x: 40, y: 148, w: 240, content: "{employeeAddress}", fontSize: 8, color: "#475569" },
    { id: "emp-csz", type: "text", x: 40, y: 160, w: 240, content: "{employeeCityStateZip}", fontSize: 8, color: "#475569" },
    { id: "emp-ssn", type: "text", x: 320, y: 134, w: 252, content: "SSN: {ssn}", fontSize: 8, color: "#475569", align: "right" },
    { id: "emp-freq", type: "text", x: 320, y: 146, w: 252, content: "Pay Frequency: {payFrequency}", fontSize: 8, color: "#475569", align: "right" },
    { id: "emp-filing", type: "text", x: 320, y: 158, w: 252, content: "Filing Status: {filingStatus}", fontSize: 8, color: "#475569", align: "right" },
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

    // Deductions table
    { id: "ded-label", type: "text", x: 40, y: 330, w: 200, content: "TAXES & DEDUCTIONS", fontSize: 8, bold: true, color: "#14532d" },
    {
      id: "ded-table", type: "table", x: 40, y: 344, w: 532, binding: "deductions",
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
    { id: "sum-ded-l", type: "text", x: 312, y: 576, w: 130, content: "Total Deductions", fontSize: 9, color: "#475569" },
    { id: "sum-ded-v", type: "text", x: 442, y: 576, w: 130, content: "-${totalDeductions}", fontSize: 9, color: "#1a1a1a", align: "right" },
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

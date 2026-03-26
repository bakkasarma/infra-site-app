import React, { useState, useEffect } from "react";

// ─── Storage ──────────────────────────────────────────────────────────────────
const SK = "infra_v4";
const loadData = async () => {
  try {
    const raw = localStorage.getItem(SK);
    return raw ? JSON.parse(raw) : makeEmpty();
  } catch { return makeEmpty(); }
};
const saveData = async (d) => {
  try { localStorage.setItem(SK, JSON.stringify(d)); } catch {}
};
const makeEmpty = () => ({
  projectName: "", projectCode: "", role: "",
  deviationThreshold: 10,
  dsrs: [], mrns: [], mirs: [], workers: [], boq: []
});

// ─── Utilities ────────────────────────────────────────────────────────────────
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
const today = () => new Date().toISOString().slice(0, 10);
const fmtDate = (d) => {
  if (!d) return "—";
  const dt = new Date(d + "T00:00:00");
  return dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};
const deepCopy = (x) => JSON.parse(JSON.stringify(x));
const sum = (arr, key) => arr.reduce((a, b) => a + Number(b[key] || 0), 0);

// ─── Constants ────────────────────────────────────────────────────────────────
const WEATHER_OPTS = ["Clear", "Partly Cloudy", "Overcast", "Light Rain", "Heavy Rain", "Extreme Heat", "Fog"];
const SHIFT_OPTS = ["Day", "Night", "Both"];
const TRADE_OPTS = ["Mason", "Carpenter / Shuttering", "Bar Bender / Rod Man", "Helper / Unskilled",
  "Equipment Operator", "Welder", "Electrician / Plumber", "Site Engineer", "Supervisor", "Others"];
const ISSUE_CATS = ["Material", "Labour", "Design / Drawing", "Equipment", "Client", "Weather / External", "Safety", "Finance"];
const DEF_MAT_NAMES = ["Cement (OPC 53)", "TMT Steel", "Coarse Aggregate (20mm)", "Fine Aggregate / Sand",
  "Bricks / Blocks", "Shuttering Ply", "Binding Wire", "Concrete (RMC)", "Water", "Others"];
const DEF_LABOUR_CATS = ["Site Engineer / Supervisor", "Mason / Carpenter", "Bar Bender",
  "Helper / Unskilled", "Equipment Operator", "Welder", "Electrician"];
const ROLES = [
  { v: "pm",     l: "Project Manager",     icon: "👔" },
  { v: "se",     l: "Site Engineer",       icon: "🪖" },
  { v: "store",  l: "Store Keeper",        icon: "📦" },
  { v: "coord",  l: "Project Coordinator", icon: "🗂️" },
  { v: "safety", l: "Safety Officer",      icon: "🦺" },
];
const NAV = [
  { k: "dashboard", l: "Dashboard",        icon: "🏠" },
  { k: "dsr",       l: "Daily Reports",    icon: "📋" },
  { k: "mrn",       l: "Receive Material", icon: "📦" },
  { k: "mir",       l: "Material Indent",  icon: "🛒" },
  { k: "muster",    l: "Labour Register",  icon: "👷" },
  { k: "wpr",       l: "Weekly Report",    icon: "📊" },
  { k: "boq",       l: "BOQ Tracker",      icon: "📐" },
  { k: "settings",  l: "Settings",         icon: "⚙️" },
];

// ─── Colors ───────────────────────────────────────────────────────────────────
const C = {
  navy: "#1B3A6B", navyDark: "#122850", navyLight: "#EEF3FB",
  orange: "#E07B00",
  green: "#15803D", greenLight: "#DCFCE7",
  red: "#B91C1C", redLight: "#FEE2E2",
  amber: "#B45309", amberLight: "#FEF3C7",
  blue: "#1D4ED8", blueLight: "#DBEAFE",
  bg: "#F1F5FB", card: "#FFFFFF", border: "#DDE5F0",
  text: "#1A2740", muted: "#64748B",
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const FF = { fontFamily: "'Segoe UI', system-ui, sans-serif" };
const baseInput = { ...FF, padding: "7px 10px", border: `1.5px solid ${C.border}`, borderRadius: 7, fontSize: 13, color: C.text, background: "#fff", outline: "none", width: "100%", boxSizing: "border-box" };
const tblInput = { ...FF, width: "100%", padding: "5px 6px", fontSize: 11, border: `1px solid ${C.border}`, borderRadius: 5, background: "#fff", outline: "none", minWidth: 55 };

// ─── Atoms ────────────────────────────────────────────────────────────────────
const Lbl = ({ t, req }) => (
  <div style={{ ...FF, fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 3 }}>
    {t}{req && <span style={{ color: C.red }}> *</span>}
  </div>
);

function Inp({ label, value, onChange, type = "text", placeholder = "", req }) {
  return (
    <div>
      {label && <Lbl t={label} req={req} />}
      <input type={type} value={value || ""} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={baseInput}
        onFocus={e => e.target.style.borderColor = C.navy}
        onBlur={e => e.target.style.borderColor = C.border} />
    </div>
  );
}

function Sel({ label, value, onChange, options }) {
  return (
    <div>
      {label && <Lbl t={label} />}
      <select value={value || ""} onChange={e => onChange(e.target.value)} style={{ ...baseInput, cursor: "pointer" }}>
        {options.map(o => {
          const v = typeof o === "object" ? o.v : o;
          const l = typeof o === "object" ? o.l : o;
          return <option key={v} value={v}>{l}</option>;
        })}
      </select>
    </div>
  );
}

function Btn({ children, onClick, color = C.navy, outline, small, danger, disabled }) {
  const bg = danger ? C.red : outline ? "transparent" : color;
  const fc = outline ? (danger ? C.red : color) : "#fff";
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ ...FF, padding: small ? "5px 12px" : "9px 20px", background: bg, color: fc, border: `2px solid ${danger ? C.red : color}`, borderRadius: 8, fontWeight: 700, fontSize: small ? 11 : 13, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1, whiteSpace: "nowrap", transition: "all .15s" }}>
      {children}
    </button>
  );
}

const Bdg = ({ t, col = C.navy }) => (
  <span style={{ background: col + "20", color: col, border: `1px solid ${col}40`, borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 700 }}>{t}</span>
);

const Card = ({ children, style = {} }) => (
  <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20, boxShadow: "0 2px 8px rgba(27,58,107,0.06)", ...style }}>
    {children}
  </div>
);

const Sec = ({ title, sub }) => (
  <div style={{ borderBottom: `3px solid ${C.orange}`, paddingBottom: 7, marginBottom: 16 }}>
    <div style={{ ...FF, fontSize: 14, fontWeight: 800, color: C.navy }}>{title}</div>
    {sub && <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{sub}</div>}
  </div>
);

const THead = ({ cols }) => (
  <thead>
    <tr>
      {cols.map((c, i) => (
        <th key={i} style={{ background: C.navy, color: "#fff", padding: "7px 9px", fontSize: 10, fontWeight: 700, textAlign: "left", whiteSpace: "nowrap", letterSpacing: "0.04em" }}>
          {c}
        </th>
      ))}
    </tr>
  </thead>
);

const TI = ({ value, onChange, type = "text", bg }) => (
  <td style={{ padding: "3px 3px" }}>
    <input type={type} value={value || ""} onChange={e => onChange(e.target.value)}
      style={{ ...tblInput, background: bg || "#fff" }} />
  </td>
);

const Empty = ({ icon, msg }) => (
  <div style={{ textAlign: "center", padding: "36px 20px", color: C.muted }}>
    <div style={{ fontSize: 36, marginBottom: 8 }}>{icon}</div>
    <div style={{ fontSize: 13 }}>{msg}</div>
  </div>
);

const Warn = ({ children }) => (
  <div style={{ background: C.amberLight, border: `1px solid ${C.amber}`, borderRadius: 8, padding: "11px 14px", fontSize: 12, color: "#92400E" }}>
    {children}
  </div>
);

const wa = (text) => window.open("https://wa.me/?text=" + encodeURIComponent(text), "_blank");

function doPrint(id, title) {
  const el = document.getElementById(id);
  if (!el) return;
  const w = window.open("", "_blank");
  w.document.write(`<!DOCTYPE html><html><head><title>${title}</title><style>
    *{box-sizing:border-box} body{font-family:'Segoe UI',sans-serif;font-size:11px;color:#1A2740;margin:24px;line-height:1.4}
    h1{font-size:16px;color:#1B3A6B;border-bottom:3px solid #E07B00;padding-bottom:6px;margin-bottom:16px}
    table{width:100%;border-collapse:collapse;margin-bottom:14px} th{background:#1B3A6B;color:#fff;padding:6px 8px;text-align:left;font-size:10px}
    td{padding:5px 8px;border-bottom:1px solid #DDE5F0} tr:nth-child(even) td{background:#F8FAFD}
    .g{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:14px}
    .c{border:1px solid #DDE5F0;border-radius:6px;padding:7px 10px}
    .l{font-size:9px;font-weight:700;color:#64748B;text-transform:uppercase} .v{font-size:12px;margin-top:2px;font-weight:600}
    @media print{button{display:none}}
  </style></head><body><h1>${title}</h1>`);
  w.document.write(el.innerHTML);
  w.document.write(`<br/><button onclick="window.print()" style="padding:8px 18px;background:#1B3A6B;color:#fff;border:none;border-radius:6px;cursor:pointer">🖨️ Print / Save PDF</button></body></html>`);
  w.document.close();
  setTimeout(() => w.print(), 800);
}

// ══════════════════════════════════════════════════════════════════════════════
// BOQ HELPERS  (appended — used by BOQPage, MIRForm-extended, Dashboard)
// ══════════════════════════════════════════════════════════════════════════════

// Compute how much has been ordered (from MIRs) and received (from MRNs)
// keyed by boqId
function computeBoqActuals(data) {
  const actuals = {};
  (data.boq || []).forEach(b => { actuals[b.id] = { ordered: 0, received: 0 }; });

  (data.mirs || []).forEach(mir => {
    (mir.materials || []).forEach(m => {
      if (m.boqId && actuals[m.boqId] !== undefined) {
        actuals[m.boqId].ordered += Number(m.required || 0);
      }
    });
  });

  (data.mrns || []).forEach(mrn => {
    (mrn.materials || []).forEach(m => {
      if (m.boqId && actuals[m.boqId] !== undefined) {
        actuals[m.boqId].received += Number(m.received || 0);
      }
    });
  });

  return actuals;
}

function deviationColor(pct, threshold) {
  if (pct > threshold + 10) return C.red;
  if (pct > threshold) return C.amber;
  if (pct > 90) return C.green;
  return C.muted;
}

function DeviationBadge({ orderedQty, tenderQty, threshold }) {
  if (!tenderQty) return <span style={{ color: C.muted, fontSize: 11 }}>—</span>;
  const pct = Math.round((orderedQty / tenderQty) * 100);
  const over = orderedQty > tenderQty;
  const col = over ? C.red : pct > 85 ? C.amber : C.green;
  return (
    <span style={{ background: col + "18", color: col, border: `1px solid ${col}40`, borderRadius: 20, padding: "2px 9px", fontSize: 11, fontWeight: 700 }}>
      {pct}% {over ? "⚠️ OVER" : ""}
    </span>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// BOQ PAGE
// ══════════════════════════════════════════════════════════════════════════════
function BOQPage({ data, setData, role }) {
  const [tab, setTab] = useState("tracker");
  const [csvText, setCsvText] = useState("");
  const [csvError, setCsvError] = useState("");
  const [newItem, setNewItem] = useState({ sno: "", description: "", unit: "", tenderQty: "", rate: "", amount: "" });
  const [threshold, setThreshold] = useState(String(data.deviationThreshold ?? 10));
  const [filterStatus, setFilterStatus] = useState("all");

  const actuals = computeBoqActuals(data);
  const boq = data.boq || [];
  const canEdit = role === "pm" || role === "coord";

  // Add single item
  const addItem = () => {
    if (!newItem.description || !newItem.tenderQty) return;
    const item = { ...newItem, id: uid(), orderedQty: 0, receivedQty: 0 };
    const nd = { ...data, boq: [...boq, item] };
    setData(nd); saveData(nd);
    setNewItem({ sno: "", description: "", unit: "", tenderQty: "", rate: "", amount: "" });
  };

  const delItem = (id) => {
    if (!confirm("Remove this BOQ item?")) return;
    const nd = { ...data, boq: boq.filter(b => b.id !== id) };
    setData(nd); saveData(nd);
  };

  const saveThreshold = () => {
    const val = Number(threshold);
    if (isNaN(val) || val < 0) return;
    const nd = { ...data, deviationThreshold: val };
    setData(nd); saveData(nd);
    alert(`Deviation threshold set to ${val}%`);
  };

  // Parse CSV / Excel paste
  const parseCSV = () => {
    setCsvError("");
    const lines = csvText.trim().split("\n").filter(l => l.trim());
    if (lines.length === 0) { setCsvError("No data found."); return; }

    // Auto-detect separator
    const sep = lines[0].includes("\t") ? "\t" : ",";
    const parsed = [];

    for (let i = 0; i < lines.length; i++) {
      const cols = lines[i].split(sep).map(c => c.replace(/^"|"$/g, "").trim());
      // Skip header rows (non-numeric first column or contains "S.No" / "Item")
      if (i === 0 && (isNaN(cols[0]) || cols[0].toLowerCase().includes("s") || cols[0].toLowerCase().includes("item"))) continue;
      if (cols.length < 3) continue;
      const [sno, description, unit, tenderQty, rate, amount] = cols;
      if (!description || !tenderQty) continue;
      parsed.push({ id: uid(), sno: sno || String(parsed.length + 1), description, unit: unit || "", tenderQty: tenderQty || "0", rate: rate || "", amount: amount || "", orderedQty: 0, receivedQty: 0 });
    }

    if (parsed.length === 0) { setCsvError("Could not parse any items. Check format: S.No | Description | Unit | Qty | Rate | Amount"); return; }

    const nd = { ...data, boq: [...boq, ...parsed] };
    setData(nd); saveData(nd);
    setCsvText("");
    alert(`✅ ${parsed.length} BOQ items imported!`);
    setTab("tracker");
  };

  const clearBOQ = () => {
    if (!confirm("Clear all BOQ items? This cannot be undone.")) return;
    const nd = { ...data, boq: [] };
    setData(nd); saveData(nd);
  };

  // Filter
  const filteredBoq = boq.filter(b => {
    const a = actuals[b.id] || { ordered: 0, received: 0 };
    const pct = Number(b.tenderQty) > 0 ? (a.ordered / Number(b.tenderQty)) * 100 : 0;
    if (filterStatus === "over") return a.ordered > Number(b.tenderQty);
    if (filterStatus === "warn") return pct > 85 && a.ordered <= Number(b.tenderQty);
    if (filterStatus === "ok") return pct <= 85;
    return true;
  });

  // Summary stats
  const totalItems = boq.length;
  const overItems = boq.filter(b => (actuals[b.id]?.ordered || 0) > Number(b.tenderQty || 0)).length;
  const warnItems = boq.filter(b => {
    const a = actuals[b.id]; if (!a) return false;
    const pct = Number(b.tenderQty) > 0 ? (a.ordered / Number(b.tenderQty)) * 100 : 0;
    return pct > 85 && a.ordered <= Number(b.tenderQty);
  }).length;
  const totalTenderValue = boq.reduce((s, b) => s + Number(b.amount || 0), 0);

  const waText = `*BOQ Status — ${data.projectName}*\n📅 ${fmtDate(today())}\nTotal items: ${totalItems}\n⚠️ Over BOQ: ${overItems}\n🔶 Near limit (>85%): ${warnItems}\n\nDeviation threshold: ${data.deviationThreshold ?? 10}%\n_Infra Site App_`;

  const TABS = [
    { k: "tracker", l: "📊 BOQ Tracker" },
    { k: "add", l: "➕ Add Items" },
    { k: "csv", l: "📋 Import CSV" },
    { k: "settings", l: "⚙️ Settings" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
        <div>
          <div style={{ ...FF, fontSize: 19, fontWeight: 900, color: C.navy }}>BOQ / QES Tracker</div>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
            Tender quantities vs ordered vs received · Deviation threshold: <strong>{data.deviationThreshold ?? 10}%</strong>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Btn color="#25D366" small onClick={() => wa(waText)}>💬 Share</Btn>
          <Btn color={C.muted} small outline onClick={() => doPrint("boq-print", "BOQ Tracker")}>🖨️ Print</Btn>
        </div>
      </div>

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12 }}>
        {[
          { l: "BOQ Items", v: totalItems, col: C.navy },
          { l: "⚠️ Over Tender Qty", v: overItems, col: overItems > 0 ? C.red : C.green },
          { l: "🔶 Near Limit (>85%)", v: warnItems, col: warnItems > 0 ? C.amber : C.green },
          { l: "Tender Value (₹)", v: totalTenderValue > 0 ? "₹" + (totalTenderValue / 100000).toFixed(1) + "L" : "—", col: C.blue },
        ].map(s => (
          <Card key={s.l} style={{ textAlign: "center" }}>
            <div style={{ fontSize: 24, fontWeight: 900, color: s.col }}>{s.v}</div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>{s.l}</div>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: `2px solid ${C.border}`, overflowX: "auto" }}>
        {TABS.map(t => (
          <button key={t.k} onClick={() => setTab(t.k)}
            style={{ ...FF, padding: "8px 16px", background: "none", border: "none", borderBottom: tab === t.k ? `3px solid ${C.orange}` : "3px solid transparent", color: tab === t.k ? C.navy : C.muted, fontWeight: tab === t.k ? 800 : 500, cursor: "pointer", fontSize: 12, whiteSpace: "nowrap" }}>
            {t.l}
          </button>
        ))}
      </div>

      {/* ── TRACKER TAB ─────────────────────────────────────────── */}
      {tab === "tracker" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {boq.length === 0 ? (
            <Card>
              <Empty icon="📋" msg="No BOQ items yet. Add items manually or import from CSV/Excel." />
              <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 12 }}>
                <Btn onClick={() => setTab("add")}>➕ Add Items</Btn>
                <Btn color={C.green} onClick={() => setTab("csv")}>📋 Import CSV</Btn>
              </div>
            </Card>
          ) : (
            <>
              {/* Filter bar */}
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <span style={{ fontSize: 12, color: C.muted, fontWeight: 700 }}>Filter:</span>
                {[["all", "All Items"], ["over", "⚠️ Over BOQ"], ["warn", "🔶 Near Limit"], ["ok", "✅ Within Limit"]].map(([v, l]) => (
                  <button key={v} onClick={() => setFilterStatus(v)}
                    style={{ ...FF, padding: "5px 12px", background: filterStatus === v ? C.navy : "transparent", color: filterStatus === v ? "#fff" : C.muted, border: `1.5px solid ${filterStatus === v ? C.navy : C.border}`, borderRadius: 20, cursor: "pointer", fontSize: 11, fontWeight: 600 }}>
                    {l}
                  </button>
                ))}
                <span style={{ fontSize: 11, color: C.muted, marginLeft: "auto" }}>{filteredBoq.length} of {totalItems} items</span>
              </div>

              <div id="boq-print">
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                    <THead cols={["S.No", "Description", "Unit", "Tender Qty", "Rate (₹)", "Tender Value (₹)", "Ordered Qty", "Received Qty", "% Used", "Deviation", canEdit ? "Del" : ""]} />
                    <tbody>
                      {filteredBoq.map((b, i) => {
                        const a = actuals[b.id] || { ordered: 0, received: 0 };
                        const tender = Number(b.tenderQty || 0);
                        const pctOrdered = tender > 0 ? (a.ordered / tender) * 100 : 0;
                        const isOver = a.ordered > tender;
                        const isWarn = !isOver && pctOrdered > 85;
                        const rowBg = isOver ? "#FFF5F5" : isWarn ? "#FFFBEB" : i % 2 ? C.navyLight : "#fff";
                        return (
                          <tr key={b.id} style={{ background: rowBg }}>
                            <td style={{ padding: "7px 9px", textAlign: "center", fontWeight: 700, color: C.muted, fontSize: 11 }}>{b.sno || i + 1}</td>
                            <td style={{ padding: "7px 9px", fontWeight: 600 }}>{b.description}</td>
                            <td style={{ padding: "7px 9px", textAlign: "center" }}>{b.unit}</td>
                            <td style={{ padding: "7px 9px", textAlign: "right", fontWeight: 700 }}>{Number(b.tenderQty).toLocaleString("en-IN")}</td>
                            <td style={{ padding: "7px 9px", textAlign: "right" }}>{b.rate ? Number(b.rate).toLocaleString("en-IN") : "—"}</td>
                            <td style={{ padding: "7px 9px", textAlign: "right" }}>{b.amount ? "₹" + Number(b.amount).toLocaleString("en-IN") : "—"}</td>
                            <td style={{ padding: "7px 9px", textAlign: "right", fontWeight: 700, color: isOver ? C.red : C.text }}>
                              {a.ordered.toLocaleString("en-IN")}
                              {isOver && <span style={{ fontSize: 10, marginLeft: 4, color: C.red }}>+{(a.ordered - tender).toLocaleString("en-IN")}</span>}
                            </td>
                            <td style={{ padding: "7px 9px", textAlign: "right" }}>{a.received.toLocaleString("en-IN")}</td>
                            <td style={{ padding: "7px 9px", textAlign: "center" }}>
                              <div style={{ background: C.border, borderRadius: 6, height: 8, width: 80, overflow: "hidden", display: "inline-block", verticalAlign: "middle" }}>
                                <div style={{ width: `${Math.min(pctOrdered, 100)}%`, height: "100%", background: isOver ? C.red : pctOrdered > 85 ? C.amber : C.green, transition: "width .3s" }} />
                              </div>
                              <span style={{ fontSize: 10, color: isOver ? C.red : C.muted, marginLeft: 5, fontWeight: 700 }}>{Math.round(pctOrdered)}%</span>
                            </td>
                            <td style={{ padding: "7px 9px", textAlign: "center" }}>
                              <DeviationBadge orderedQty={a.ordered} tenderQty={tender} threshold={data.deviationThreshold ?? 10} />
                            </td>
                            {canEdit && <td style={{ padding: "7px 9px" }}><Btn small danger onClick={() => delItem(b.id)}>✕</Btn></td>}
                            {!canEdit && <td></td>}
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr style={{ background: C.navyLight }}>
                        <td colSpan={5} style={{ padding: "8px 10px", fontWeight: 800, color: C.navy, fontSize: 12 }}>TOTAL</td>
                        <td style={{ padding: "8px 9px", textAlign: "right", fontWeight: 800, color: C.navy }}>
                          ₹{boq.reduce((s, b) => s + Number(b.amount || 0), 0).toLocaleString("en-IN")}
                        </td>
                        <td style={{ padding: "8px 9px", textAlign: "right", fontWeight: 800, color: C.navy }}>
                          {boq.reduce((s, b) => s + (actuals[b.id]?.ordered || 0), 0).toLocaleString("en-IN")}
                        </td>
                        <td style={{ padding: "8px 9px", textAlign: "right", fontWeight: 800, color: C.navy }}>
                          {boq.reduce((s, b) => s + (actuals[b.id]?.received || 0), 0).toLocaleString("en-IN")}
                        </td>
                        <td colSpan={3}></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {overItems > 0 && (
                <div style={{ background: C.redLight, border: `1.5px solid ${C.red}`, borderRadius: 10, padding: 14, fontSize: 13 }}>
                  <strong style={{ color: C.red }}>⚠️ {overItems} item(s) have been ordered beyond the tendered quantity.</strong>
                  <div style={{ color: "#7F1D1D", marginTop: 4, fontSize: 12 }}>
                    A Variation Order (VO) or owner approval is required before procurement proceeds. These items are highlighted in red above.
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── ADD ITEMS TAB ────────────────────────────────────────── */}
      {tab === "add" && canEdit && (
        <Card>
          <Sec title="Add BOQ Item Manually" sub="Enter one item at a time as per QES / tender document" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12 }}>
            <Inp label="S.No / Item Code" value={newItem.sno} onChange={v => setNewItem(n => ({ ...n, sno: v }))} />
            <Inp label="Description of Work / Material" value={newItem.description} onChange={v => setNewItem(n => ({ ...n, description: v }))} req />
            <Inp label="Unit (cum, MT, nos, sqm…)" value={newItem.unit} onChange={v => setNewItem(n => ({ ...n, unit: v }))} />
            <Inp label="Tendered Quantity" value={newItem.tenderQty} onChange={v => setNewItem(n => ({ ...n, tenderQty: v }))} type="number" req />
            <Inp label="Rate (₹)" value={newItem.rate} onChange={v => setNewItem(n => ({ ...n, rate: v }))} type="number" />
            <Inp label="Amount (₹)" value={newItem.amount} onChange={v => setNewItem(n => ({ ...n, amount: v }))} type="number" />
          </div>
          <div style={{ marginTop: 14, display: "flex", gap: 10 }}>
            <Btn onClick={addItem}>+ Add Item</Btn>
            {boq.length > 0 && <Btn outline onClick={() => setTab("tracker")}>View Tracker ({boq.length} items)</Btn>}
          </div>
          {boq.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <Sec title={`Items Added (${boq.length})`} />
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <THead cols={["S.No", "Description", "Unit", "Tender Qty", "Rate", "Amount", "Del"]} />
                  <tbody>
                    {boq.map((b, i) => (
                      <tr key={b.id} style={{ background: i % 2 ? C.navyLight : "#fff" }}>
                        <td style={{ padding: "6px 9px" }}>{b.sno || i + 1}</td>
                        <td style={{ padding: "6px 9px", fontWeight: 600 }}>{b.description}</td>
                        <td style={{ padding: "6px 9px" }}>{b.unit}</td>
                        <td style={{ padding: "6px 9px", textAlign: "right", fontWeight: 700 }}>{Number(b.tenderQty).toLocaleString("en-IN")}</td>
                        <td style={{ padding: "6px 9px", textAlign: "right" }}>{b.rate || "—"}</td>
                        <td style={{ padding: "6px 9px", textAlign: "right" }}>{b.amount ? "₹" + Number(b.amount).toLocaleString("en-IN") : "—"}</td>
                        <td style={{ padding: "6px 9px" }}><Btn small danger onClick={() => delItem(b.id)}>✕</Btn></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </Card>
      )}
      {tab === "add" && !canEdit && (
        <Card><div style={{ fontSize: 13, color: C.muted, textAlign: "center", padding: 30 }}>Only Project Manager or Coordinator can add BOQ items.</div></Card>
      )}

      {/* ── CSV IMPORT TAB ───────────────────────────────────────── */}
      {tab === "csv" && canEdit && (
        <Card>
          <Sec title="Import from Excel / CSV" sub="Copy from Excel and paste below — handles both comma and tab-separated data" />

          <div style={{ background: C.navyLight, border: `1px solid ${C.border}`, borderRadius: 8, padding: 14, marginBottom: 16, fontSize: 12, color: C.muted }}>
            <strong style={{ color: C.navy }}>Expected column order in your Excel / CSV:</strong>
            <div style={{ marginTop: 6, fontFamily: "monospace", background: "#fff", padding: "8px 12px", borderRadius: 6, border: `1px solid ${C.border}` }}>
              S.No | Description | Unit | Quantity | Rate | Amount
            </div>
            <div style={{ marginTop: 8 }}>
              <strong>How to paste from Excel:</strong> Select the cells in Excel → Copy (Ctrl+C) → Click in the box below → Paste (Ctrl+V).<br />
              Header row will be auto-detected and skipped. Works with both Excel copy-paste (tab-separated) and CSV files.
            </div>
          </div>

          <textarea value={csvText} onChange={e => setCsvText(e.target.value)}
            placeholder={"Paste Excel data or CSV here...\n\nExample:\n1\tConcrete M25\tcum\t1200\t4500\t5400000\n2\tTMT Steel Fe500\tMT\t85\t52000\t4420000"}
            style={{ ...FF, width: "100%", height: 200, padding: "10px 12px", border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 12, color: C.text, resize: "vertical", outline: "none", boxSizing: "border-box" }}
            onFocus={e => e.target.style.borderColor = C.navy}
            onBlur={e => e.target.style.borderColor = C.border}
          />

          {csvError && (
            <div style={{ background: C.redLight, border: `1px solid ${C.red}`, borderRadius: 7, padding: "8px 12px", fontSize: 12, color: C.red, marginTop: 8 }}>
              ❌ {csvError}
            </div>
          )}

          <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
            <Btn color={C.green} onClick={parseCSV} disabled={!csvText.trim()}>📥 Import Data</Btn>
            <Btn outline onClick={() => { setCsvText(""); setCsvError(""); }}>Clear</Btn>
            {boq.length > 0 && <Btn outline onClick={() => setTab("tracker")}>View Tracker ({boq.length} items)</Btn>}
          </div>
        </Card>
      )}
      {tab === "csv" && !canEdit && (
        <Card><div style={{ fontSize: 13, color: C.muted, textAlign: "center", padding: 30 }}>Only Project Manager or Coordinator can import BOQ data.</div></Card>
      )}

      {/* ── SETTINGS TAB ─────────────────────────────────────────── */}
      {tab === "settings" && (
        <Card>
          <Sec title="BOQ Settings" />
          <div style={{ maxWidth: 400 }}>
            <Lbl t="Deviation Threshold (%)" />
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 8 }}>
              Items ordered beyond this % of tender quantity will trigger a warning. Set 0 for zero tolerance.
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <input type="number" value={threshold} onChange={e => setThreshold(e.target.value)} min="0" max="100"
                style={{ ...baseInput, width: 100 }} />
              <span style={{ fontSize: 13, color: C.muted }}>%</span>
              <Btn onClick={saveThreshold}>Save</Btn>
            </div>
            <div style={{ marginTop: 16, display: "flex", gap: 6, flexWrap: "wrap" }}>
              {[0, 5, 10, 15, 20].map(v => (
                <button key={v} onClick={() => setThreshold(String(v))}
                  style={{ ...FF, padding: "5px 12px", background: Number(threshold) === v ? C.navy : "transparent", color: Number(threshold) === v ? "#fff" : C.muted, border: `1.5px solid ${Number(threshold) === v ? C.navy : C.border}`, borderRadius: 20, cursor: "pointer", fontSize: 11, fontWeight: 600 }}>
                  {v}%
                </button>
              ))}
            </div>
          </div>
          {boq.length > 0 && canEdit && (
            <div style={{ marginTop: 24 }}>
              <Btn danger onClick={clearBOQ}>🗑️ Clear All BOQ Items</Btn>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// BOQ DEVIATION BANNER — used inside MIR and MRN forms
// ══════════════════════════════════════════════════════════════════════════════
function BOQDeviationAlert({ boqId, additionalQty, data }) {
  if (!boqId || !additionalQty || !data.boq?.length) return null;
  const item = data.boq.find(b => b.id === boqId);
  if (!item) return null;
  const actuals = computeBoqActuals(data);
  const a = actuals[boqId] || { ordered: 0 };
  const projectedOrdered = a.ordered + Number(additionalQty || 0);
  const tender = Number(item.tenderQty || 0);
  if (tender === 0) return null;
  const pct = Math.round((projectedOrdered / tender) * 100);
  const isOver = projectedOrdered > tender;
  const threshold = data.deviationThreshold ?? 10;
  if (!isOver && pct <= 85) return null;

  return (
    <div style={{ background: isOver ? C.redLight : C.amberLight, border: `1.5px solid ${isOver ? C.red : C.amber}`, borderRadius: 7, padding: "8px 12px", fontSize: 12, marginTop: 6 }}>
      {isOver
        ? <><strong style={{ color: C.red }}>⚠️ OVER TENDER QTY:</strong> <span style={{ color: "#7F1D1D" }}>This indent will take total ordered quantity to {projectedOrdered.toLocaleString("en-IN")} {item.unit} against tender qty of {tender.toLocaleString("en-IN")} {item.unit} ({pct}%). Requires Variation Order / PM approval.</span></>
        : <><strong style={{ color: C.amber }}>🔶 Near Limit:</strong> <span style={{ color: "#78350F" }}>Projected at {pct}% of tender qty. Monitor closely before approving further indents.</span></>
      }
    </div>
  );
}



// ══════════════════════════════════════════════════════════════════════════════
// ROLE SELECT
// ══════════════════════════════════════════════════════════════════════════════
function RoleSelect({ data, setData }) {
  const [pName, setPName] = useState(data.projectName || "");
  const [pCode, setPCode] = useState(data.projectCode || "");

  const pick = (v) => {
    const nd = { ...data, role: v, projectName: pName, projectCode: pCode };
    setData(nd); saveData(nd);
  };

  return (
    <div style={{ minHeight: "100vh", background: `linear-gradient(135deg,${C.navyDark},${C.navy} 60%,#2A5298)`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ ...FF, fontSize: 26, fontWeight: 900, color: "#fff", marginBottom: 4 }}>INFRA SITE APP</div>
      <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 28 }}>Project Management System</div>

      <div style={{ width: "100%", maxWidth: 420, background: "rgba(255,255,255,0.08)", borderRadius: 14, padding: 20, marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>Project Setup</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>Project Name</div>
            <input value={pName} onChange={e => setPName(e.target.value)} placeholder="e.g. NH-44 Bypass Package 3"
              style={{ ...baseInput, background: "rgba(255,255,255,0.12)", color: "#fff", border: "1.5px solid rgba(255,255,255,0.2)" }} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>Project Code (for document numbers)</div>
            <input value={pCode} onChange={e => setPCode(e.target.value)} placeholder="e.g. NH44"
              style={{ ...baseInput, background: "rgba(255,255,255,0.12)", color: "#fff", border: "1.5px solid rgba(255,255,255,0.2)" }} />
          </div>
        </div>
      </div>

      <div style={{ width: "100%", maxWidth: 420 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12, textAlign: "center" }}>Select Your Role</div>
        {ROLES.map(r => (
          <div key={r.v} onClick={() => pick(r.v)}
            style={{ background: "rgba(255,255,255,0.08)", border: "1.5px solid rgba(255,255,255,0.15)", borderRadius: 12, padding: "13px 18px", marginBottom: 9, cursor: "pointer", display: "flex", alignItems: "center", gap: 14, transition: "all .2s" }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.18)"}
            onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}>
            <span style={{ fontSize: 24 }}>{r.icon}</span>
            <div style={{ ...FF, fontWeight: 700, color: "#fff", fontSize: 14 }}>{r.l}</div>
            <span style={{ marginLeft: "auto", color: "rgba(255,255,255,0.35)", fontSize: 20 }}>›</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// DASHBOARD
// ══════════════════════════════════════════════════════════════════════════════
function Dashboard({ data, setPage, role }) {
  const todayDSR = data.dsrs.filter(d => d.date === today()).length;
  const pendMIR = data.mirs.filter(m => m.status === "Pending").length;
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
  const weekMRN = data.mrns.filter(m => m.date >= weekAgo).length;
  const allIssues = data.dsrs.flatMap(d => (d.issues || []).filter(i => i.desc));

  const stats = [
    { l: "DSRs Filed", v: data.dsrs.length, sub: todayDSR ? "✅ Filed today" : "⚠️ Not yet today", col: C.navy, pg: "dsr" },
    { l: "Pending Indents", v: pendMIR, sub: pendMIR ? "Need approval" : "All approved", col: pendMIR ? C.orange : C.green, pg: "mir" },
    { l: "MRNs (7 days)", v: weekMRN, sub: "Materials received", col: C.blue, pg: "mrn" },
    { l: "Workers on Roll", v: data.workers.length, sub: "Registered", col: "#6D28D9", pg: "muster" },
  ];

  const recentDSRs = [...data.dsrs].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  const matTotals = {};
  data.dsrs.forEach(d => {
    (d.materials || []).forEach(m => {
      if (m.name && Number(m.consumed) > 0) matTotals[m.name] = (matTotals[m.name] || 0) + Number(m.consumed);
    });
  });

  const waText = `*${data.projectName || "Project"} Update*\n📅 ${fmtDate(today())}\nDSRs: ${data.dsrs.length} | Workers: ${data.workers.length}\nPending indents: ${pendMIR} | Issues: ${allIssues.length}\n_Infra Site App_`;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
        <div>
          <div style={{ ...FF, fontSize: 21, fontWeight: 900, color: C.navy }}>{data.projectName || "Project Dashboard"}</div>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
            {ROLES.find(r => r.v === role)?.icon} {ROLES.find(r => r.v === role)?.l} · {fmtDate(today())}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Btn color="#25D366" onClick={() => wa(waText)}>💬 Share Summary</Btn>
          {(role === "se" || role === "pm") && <Btn onClick={() => setPage("dsr-new")}>+ New DSR</Btn>}
        </div>
      </div>


      {(data.boq || []).length > 0 && (() => {
        const actuals = computeBoqActuals(data);
        const overItems = (data.boq || []).filter(b => (actuals[b.id]?.ordered || 0) > Number(b.tenderQty || 0));
        if (overItems.length === 0) return null;
        return (
          <div style={{ background: C.redLight, border: `1.5px solid ${C.red}`, borderRadius: 10, padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
            <div>
              <strong style={{ color: C.red }}>⚠️ BOQ Deviation Alert:</strong>
              <span style={{ fontSize: 13, color: "#7F1D1D", marginLeft: 8 }}>{overItems.length} BOQ item(s) ordered beyond tendered quantity. Variation Order required.</span>
            </div>
            <Btn small color={C.red} onClick={() => setPage("boq")}>View BOQ Tracker</Btn>
          </div>
        );
      })()}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 12 }}>
        {stats.map(s => (
          <div key={s.l} onClick={() => setPage(s.pg)}
            style={{ background: s.col, borderRadius: 12, padding: "16px 18px", color: "#fff", cursor: "pointer", boxShadow: "0 4px 12px rgba(0,0,0,0.13)", transition: "transform .15s" }}
            onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
            onMouseLeave={e => e.currentTarget.style.transform = ""}>
            <div style={{ fontSize: 30, fontWeight: 900, lineHeight: 1 }}>{s.v}</div>
            <div style={{ fontSize: 12, fontWeight: 700, marginTop: 3 }}>{s.l}</div>
            <div style={{ fontSize: 10, opacity: 0.8, marginTop: 2 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Card>
          <Sec title="Recent DSRs" />
          {recentDSRs.length === 0 ? <Empty icon="📋" msg="No DSRs filed yet" /> : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <THead cols={["Date", "By", "Labour", "Issues"]} />
              <tbody>
                {recentDSRs.map((d, i) => (
                  <tr key={d.id} style={{ background: i % 2 ? C.navyLight : "#fff" }}>
                    <td style={{ padding: "6px 8px" }}>{fmtDate(d.date)}</td>
                    <td style={{ padding: "6px 8px" }}>{d.prepBy || "—"}</td>
                    <td style={{ padding: "6px 8px", textAlign: "center" }}><Bdg t={sum(d.labour || [], "present")} col={C.blue} /></td>
                    <td style={{ padding: "6px 8px", textAlign: "center" }}>
                      {(d.issues || []).filter(x => x.desc).length > 0
                        ? <Bdg t={(d.issues || []).filter(x => x.desc).length} col={C.red} />
                        : <Bdg t="✓" col={C.green} />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <Card>
          <Sec title="Total Material Consumed" />
          {Object.keys(matTotals).length === 0 ? <Empty icon="🧱" msg="No material data yet" /> : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {Object.entries(matTotals).slice(0, 7).map(([name, qty]) => (
                <div key={name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0", borderBottom: `1px solid ${C.border}`, fontSize: 12 }}>
                  <span>{name}</span>
                  <Bdg t={qty % 1 === 0 ? qty : qty.toFixed(1)} col={C.navy} />
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card>
        <Sec title="Quick Actions" />
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          {(role === "se" || role === "pm") && <Btn onClick={() => setPage("dsr-new")}>📋 New DSR</Btn>}
          {(role === "store" || role === "pm" || role === "se") && <Btn color={C.green} onClick={() => setPage("mrn-new")}>📦 Receive Material</Btn>}
          {(role === "se" || role === "pm" || role === "store") && <Btn color={C.orange} onClick={() => setPage("mir-new")}>🛒 Raise Indent</Btn>}
          {(role === "se" || role === "pm") && <Btn color="#6D28D9" onClick={() => setPage("muster")}>👷 Mark Attendance</Btn>}
          <Btn color={C.blue} onClick={() => setPage("wpr")}>📊 Weekly Report</Btn>
          <Btn color="#0F766E" onClick={() => setPage("boq")}>📐 BOQ Tracker</Btn>
        </div>
      </Card>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// DSR FORM
// ══════════════════════════════════════════════════════════════════════════════
function DSRForm({ data, setData, editId, setPage }) {
  const existing = editId ? data.dsrs.find(d => d.id === editId) : null;
  const nextNum = String(data.dsrs.length + (existing ? 0 : 1)).padStart(3, "0");
  const [tab, setTab] = useState("header");
  const [form, setForm] = useState(() => existing ? deepCopy(existing) : {
    id: uid(),
    dsrNo: `DSR-${data.projectCode || "PROJ"}-${new Date().getFullYear()}-${nextNum}`,
    date: today(), location: "", weather: "Clear", shift: "Day", prepBy: "", revBy: "", contractor: "",
    works: [{ activity: "", loc: "", unit: "", todayQty: "", cumulQty: "", remarks: "" }],
    labour: DEF_LABOUR_CATS.map(cat => ({ cat, contractor: "", deployed: "", present: "", absent: "", ot: "" })),
    materials: DEF_MAT_NAMES.map(name => ({ name, unit: "", opening: "", received: "", consumed: "", mrn: "" })),
    equipment: [{ name: "", reg: "", workHrs: "", idleHrs: "", breakdown: "No", fuel: "", remarks: "" }],
    issues: [{ desc: "", cat: "Material", impact: "", action: "", responsible: "", targetDate: "" }],
    toolbox: { conducted: "No", topic: "", attendees: "", by: "" },
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setA = (k, i, f2, v) => setForm(f => { const a = deepCopy(f[k]); a[i][f2] = v; return { ...f, [k]: a }; });
  const addR = (k, t) => setForm(f => ({ ...f, [k]: [...f[k], { ...t }] }));
  const delR = (k, i) => setForm(f => ({ ...f, [k]: f[k].filter((_, j) => j !== i) }));

  const handleSave = () => {
    const newDsrs = existing ? data.dsrs.map(d => d.id === editId ? form : d) : [...data.dsrs, form];
    const nd = { ...data, dsrs: newDsrs };
    setData(nd); saveData(nd); setPage("dsr");
  };

  const waText = `*DSR ${form.dsrNo}*\n📅 ${fmtDate(form.date)} | ${form.weather} | ${form.shift}\n📍 ${form.location || "—"}\n\n*Work Done*\n${form.works.filter(w => w.activity).map(w => `• ${w.activity}: ${w.todayQty} ${w.unit}`).join("\n") || "—"}\n\n*Labour* Total: ${sum(form.labour, "present")}\n*Issues*: ${form.issues.filter(i => i.desc).map(i => i.desc).join(", ") || "None"}\n\nBy: ${form.prepBy}`;

  const TABS = [
    { k: "header", l: "Header" }, { k: "work", l: "A. Work" },
    { k: "labour", l: "B. Labour" }, { k: "material", l: "C. Material" },
    { k: "equipment", l: "D. Equipment" }, { k: "issues", l: "E. Issues" },
    { k: "safety", l: "F. Safety" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
        <div>
          <div style={{ ...FF, fontSize: 18, fontWeight: 900, color: C.navy }}>Daily Site Report (DSR)</div>
          <div style={{ fontSize: 11, color: C.muted }}>Fill all sections and save</div>
        </div>
        <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
          <Btn color="#25D366" small onClick={() => wa(waText)}>💬 WhatsApp</Btn>
          <Btn color={C.muted} small outline onClick={() => doPrint("dsr-print", `DSR — ${form.dsrNo}`)}>🖨️ Print/PDF</Btn>
          <Btn outline small onClick={() => setPage("dsr")}>Cancel</Btn>
          <Btn onClick={handleSave}>💾 Save DSR</Btn>
        </div>
      </div>

      <div style={{ display: "flex", borderBottom: `2px solid ${C.border}`, overflowX: "auto" }}>
        {TABS.map(t => (
          <button key={t.k} onClick={() => setTab(t.k)}
            style={{ ...FF, padding: "8px 14px", background: "none", border: "none", borderBottom: tab === t.k ? `3px solid ${C.orange}` : "3px solid transparent", color: tab === t.k ? C.navy : C.muted, fontWeight: tab === t.k ? 800 : 500, cursor: "pointer", fontSize: 12, whiteSpace: "nowrap" }}>
            {t.l}
          </button>
        ))}
      </div>

      <div id="dsr-print">
        {tab === "header" && (
          <Card>
            <Sec title="Report Header" />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 12 }}>
              <Inp label="DSR No." value={form.dsrNo} onChange={v => set("dsrNo", v)} />
              <Inp label="Date" value={form.date} onChange={v => set("date", v)} type="date" req />
              <Inp label="Location / Package" value={form.location} onChange={v => set("location", v)} />
              <Sel label="Weather" value={form.weather} onChange={v => set("weather", v)} options={WEATHER_OPTS} />
              <Sel label="Shift" value={form.shift} onChange={v => set("shift", v)} options={SHIFT_OPTS} />
              <Inp label="Prepared By" value={form.prepBy} onChange={v => set("prepBy", v)} req />
              <Inp label="Reviewed By" value={form.revBy} onChange={v => set("revBy", v)} />
              <Inp label="Main Contractor" value={form.contractor} onChange={v => set("contractor", v)} />
            </div>
          </Card>
        )}

        {tab === "work" && (
          <Card>
            <Sec title="A. Work Executed Today" sub="Record each activity with quantities" />
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <THead cols={["#", "Activity / Item of Work", "Location / RD", "Unit", "Today Qty", "Cumul. Qty", "Remarks", ""]} />
                <tbody>
                  {form.works.map((w, i) => (
                    <tr key={i} style={{ background: i % 2 ? C.navyLight : "#fff" }}>
                      <td style={{ padding: "4px 8px", textAlign: "center", fontWeight: 700 }}>{i + 1}</td>
                      <TI value={w.activity} onChange={v => setA("works", i, "activity", v)} />
                      <TI value={w.loc} onChange={v => setA("works", i, "loc", v)} />
                      <TI value={w.unit} onChange={v => setA("works", i, "unit", v)} />
                      <TI value={w.todayQty} onChange={v => setA("works", i, "todayQty", v)} type="number" />
                      <TI value={w.cumulQty} onChange={v => setA("works", i, "cumulQty", v)} type="number" />
                      <TI value={w.remarks} onChange={v => setA("works", i, "remarks", v)} />
                      <td style={{ padding: "3px 4px" }}><Btn small danger onClick={() => delR("works", i)}>✕</Btn></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: 10 }}>
              <Btn small outline onClick={() => addR("works", { activity: "", loc: "", unit: "", todayQty: "", cumulQty: "", remarks: "" })}>+ Add Row</Btn>
            </div>
          </Card>
        )}

        {tab === "labour" && (
          <Card>
            <Sec title="B. Labour Attendance" />
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <THead cols={["Category", "Contractor", "Deployed", "Present", "Absent", "OT Hrs"]} />
                <tbody>
                  {form.labour.map((l, i) => (
                    <tr key={i} style={{ background: i % 2 ? C.navyLight : "#fff" }}>
                      <td style={{ padding: "7px 10px", fontWeight: 600 }}>{l.cat}</td>
                      <TI value={l.contractor} onChange={v => setA("labour", i, "contractor", v)} />
                      <TI value={l.deployed} onChange={v => setA("labour", i, "deployed", v)} type="number" />
                      <TI value={l.present} onChange={v => setA("labour", i, "present", v)} type="number" />
                      <TI value={l.absent} onChange={v => setA("labour", i, "absent", v)} type="number" />
                      <TI value={l.ot} onChange={v => setA("labour", i, "ot", v)} type="number" />
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ background: C.navyLight }}>
                    <td style={{ padding: "7px 10px", fontWeight: 800, color: C.navy }} colSpan={2}>TOTAL</td>
                    {["deployed", "present", "absent", "ot"].map(f => (
                      <td key={f} style={{ padding: "7px 10px", fontWeight: 800, color: C.navy, textAlign: "center" }}>{sum(form.labour, f)}</td>
                    ))}
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>
        )}

        {tab === "material" && (
          <Card>
            <Sec title="C. Material Consumed Today" sub="Opening + Received − Consumed = Closing (auto)" />
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <THead cols={["Material", "Unit", "Opening", "Received", "Consumed", "Closing", "MRN No.", ""]} />
                <tbody>
                  {form.materials.map((m, i) => {
                    const closing = Number(m.opening || 0) + Number(m.received || 0) - Number(m.consumed || 0);
                    return (
                      <tr key={i} style={{ background: i % 2 ? C.navyLight : "#fff" }}>
                        <TI value={m.name} onChange={v => setA("materials", i, "name", v)} />
                        <TI value={m.unit} onChange={v => setA("materials", i, "unit", v)} />
                        <TI value={m.opening} onChange={v => setA("materials", i, "opening", v)} type="number" />
                        <TI value={m.received} onChange={v => setA("materials", i, "received", v)} type="number" />
                        <TI value={m.consumed} onChange={v => setA("materials", i, "consumed", v)} type="number" />
                        <td style={{ padding: "3px 3px" }}>
                          <input value={closing || 0} readOnly style={{ ...tblInput, background: closing < 0 ? C.redLight : C.greenLight, fontWeight: 700 }} />
                        </td>
                        <TI value={m.mrn} onChange={v => setA("materials", i, "mrn", v)} />
                        <td style={{ padding: "3px 4px" }}><Btn small danger onClick={() => delR("materials", i)}>✕</Btn></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: 10 }}>
              <Btn small outline onClick={() => addR("materials", { name: "", unit: "", opening: "", received: "", consumed: "", mrn: "" })}>+ Add Material</Btn>
            </div>
          </Card>
        )}

        {tab === "equipment" && (
          <Card>
            <Sec title="D. Equipment on Site" />
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <THead cols={["Equipment Name", "Reg / ID", "Working Hrs", "Idle Hrs", "Breakdown?", "Fuel (L)", "Remarks", ""]} />
                <tbody>
                  {form.equipment.map((e, i) => (
                    <tr key={i} style={{ background: i % 2 ? C.navyLight : "#fff" }}>
                      <TI value={e.name} onChange={v => setA("equipment", i, "name", v)} />
                      <TI value={e.reg} onChange={v => setA("equipment", i, "reg", v)} />
                      <TI value={e.workHrs} onChange={v => setA("equipment", i, "workHrs", v)} type="number" />
                      <TI value={e.idleHrs} onChange={v => setA("equipment", i, "idleHrs", v)} type="number" />
                      <td style={{ padding: "3px 3px" }}>
                        <select value={e.breakdown} onChange={ev => setA("equipment", i, "breakdown", ev.target.value)}
                          style={{ ...tblInput, background: e.breakdown === "Yes" ? C.redLight : "#fff" }}>
                          <option>No</option><option>Yes</option>
                        </select>
                      </td>
                      <TI value={e.fuel} onChange={v => setA("equipment", i, "fuel", v)} type="number" />
                      <TI value={e.remarks} onChange={v => setA("equipment", i, "remarks", v)} />
                      <td style={{ padding: "3px 4px" }}><Btn small danger onClick={() => delR("equipment", i)}>✕</Btn></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: 10 }}>
              <Btn small outline onClick={() => addR("equipment", { name: "", reg: "", workHrs: "", idleHrs: "", breakdown: "No", fuel: "", remarks: "" })}>+ Add Equipment</Btn>
            </div>
          </Card>
        )}

        {tab === "issues" && (
          <Card>
            <Sec title="E. Issues / Hindrance / NCR" sub="Record any problem blocking progress" />
            {form.issues.map((iss, i) => (
              <div key={i} style={{ background: C.navyLight, border: `1px solid ${C.border}`, borderRadius: 10, padding: 14, marginBottom: 12, position: "relative" }}>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
                  <Inp label="Issue Description" value={iss.desc} onChange={v => setA("issues", i, "desc", v)} />
                  <Sel label="Category" value={iss.cat} onChange={v => setA("issues", i, "cat", v)} options={ISSUE_CATS} />
                  <Inp label="Impact on Schedule" value={iss.impact} onChange={v => setA("issues", i, "impact", v)} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 10 }}>
                  <Inp label="Action Required" value={iss.action} onChange={v => setA("issues", i, "action", v)} />
                  <Inp label="Responsible Person" value={iss.responsible} onChange={v => setA("issues", i, "responsible", v)} />
                  <Inp label="Target Date" value={iss.targetDate} onChange={v => setA("issues", i, "targetDate", v)} type="date" />
                </div>
                <button onClick={() => delR("issues", i)} style={{ position: "absolute", top: 10, right: 10, background: "none", border: "none", cursor: "pointer", color: C.red, fontWeight: 700, fontSize: 16 }}>✕</button>
              </div>
            ))}
            <Btn small outline onClick={() => addR("issues", { desc: "", cat: "Material", impact: "", action: "", responsible: "", targetDate: "" })}>+ Add Issue</Btn>
          </Card>
        )}

        {tab === "safety" && (
          <Card>
            <Sec title="F. Safety — Toolbox Talk" />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 12 }}>
              <Sel label="Toolbox Talk Conducted?" value={form.toolbox.conducted}
                onChange={v => set("toolbox", { ...form.toolbox, conducted: v })} options={["Yes", "No"]} />
              <Inp label="Topic Covered" value={form.toolbox.topic} onChange={v => set("toolbox", { ...form.toolbox, topic: v })} />
              <Inp label="No. of Attendees" value={form.toolbox.attendees} onChange={v => set("toolbox", { ...form.toolbox, attendees: v })} type="number" />
              <Inp label="Conducted By" value={form.toolbox.by} onChange={v => set("toolbox", { ...form.toolbox, by: v })} />
            </div>
            {form.toolbox.conducted === "No" && (
              <div style={{ marginTop: 14 }}>
                <Warn>⚠️ <strong>Reminder:</strong> Toolbox Talk is mandatory every morning before work starts.</Warn>
              </div>
            )}
          </Card>
        )}
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
        <Btn outline onClick={() => setPage("dsr")}>Cancel</Btn>
        <Btn onClick={handleSave}>💾 Save DSR</Btn>
      </div>
    </div>
  );
}

function DSRList({ data, setData, setPage, setEditId }) {
  const sorted = [...data.dsrs].sort((a, b) => b.date.localeCompare(a.date));
  const del = (id) => {
    if (!confirm("Delete this DSR?")) return;
    const nd = { ...data, dsrs: data.dsrs.filter(d => d.id !== id) };
    setData(nd); saveData(nd);
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ ...FF, fontSize: 18, fontWeight: 900, color: C.navy }}>Daily Site Reports</div>
        <Btn onClick={() => setPage("dsr-new")}>+ New DSR</Btn>
      </div>
      <Card>
        {sorted.length === 0 ? <Empty icon="📋" msg="No DSRs filed yet. Click '+ New DSR' to start." /> : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <THead cols={["DSR No.", "Date", "Location", "Weather", "Prepared By", "Labour", "Issues", "Toolbox", "Actions"]} />
              <tbody>
                {sorted.map((d, i) => (
                  <tr key={d.id} style={{ background: i % 2 ? C.navyLight : "#fff" }}>
                    <td style={{ padding: "8px 10px", fontWeight: 700, color: C.navy }}>{d.dsrNo}</td>
                    <td style={{ padding: "8px 10px" }}>{fmtDate(d.date)}</td>
                    <td style={{ padding: "8px 10px" }}>{d.location || "—"}</td>
                    <td style={{ padding: "8px 10px" }}>{d.weather}</td>
                    <td style={{ padding: "8px 10px" }}>{d.prepBy || "—"}</td>
                    <td style={{ padding: "8px 10px", textAlign: "center" }}><Bdg t={sum(d.labour || [], "present")} col={C.blue} /></td>
                    <td style={{ padding: "8px 10px", textAlign: "center" }}>
                      {(d.issues || []).filter(x => x.desc).length > 0 ? <Bdg t={(d.issues || []).filter(x => x.desc).length} col={C.red} /> : <Bdg t="✓" col={C.green} />}
                    </td>
                    <td style={{ padding: "8px 10px", textAlign: "center" }}>
                      {d.toolbox?.conducted === "Yes" ? <Bdg t="✓" col={C.green} /> : <Bdg t="✗" col={C.red} />}
                    </td>
                    <td style={{ padding: "8px 10px" }}>
                      <div style={{ display: "flex", gap: 6 }}>
                        <Btn small outline onClick={() => { setEditId(d.id); setPage("dsr-edit"); }}>Edit</Btn>
                        <Btn small danger onClick={() => del(d.id)}>Del</Btn>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MRN
// ══════════════════════════════════════════════════════════════════════════════
function MRNForm({ data, setData, setPage }) {
  const [form, setForm] = useState({
    id: uid(),
    mrnNo: `MRN-${data.projectCode || "PROJ"}-${new Date().getFullYear()}-${String(data.mrns.length + 1).padStart(3, "0")}`,
    date: today(), supplier: "", challan: "", vehicle: "", poNo: "", receivedBy: "", time: "",
    materials: [{ boqId: "", name: "", unit: "", poQty: "", challanQty: "", received: "", shortExcess: "" }],
    checks: [
      { pt: "Material matches specification / grade as per PO", s: "" },
      { pt: "Test Certificate / Mill Certificate received", s: "" },
      { pt: "Physical condition — no damage, moisture, contamination", s: "" },
      { pt: "Quantity physically counted / weighed", s: "" },
      { pt: "Proper stacking / storage arranged at site", s: "" },
      { pt: "BIS marking / batch number visible on material", s: "" },
    ],
    decision: "Accepted", rejReason: "",
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setA = (k, i, f2, v) => setForm(f => { const a = deepCopy(f[k]); a[i][f2] = v; return { ...f, [k]: a }; });
  const handleSave = () => {
    const nd = { ...data, mrns: [...data.mrns, form] };
    setData(nd); saveData(nd); setPage("mrn");
  };

  const waText = `*MRN ${form.mrnNo}*\n📅 ${fmtDate(form.date)}\n🏭 ${form.supplier} | Challan: ${form.challan}\n${form.materials.filter(m => m.name).map(m => `• ${m.name}: ${m.received} ${m.unit}`).join("\n")}\n✅ ${form.decision} | By: ${form.receivedBy}`;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
        <div style={{ ...FF, fontSize: 18, fontWeight: 900, color: C.navy }}>Material Receipt Note (MRN)</div>
        <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
          <Btn color="#25D366" small onClick={() => wa(waText)}>💬 WhatsApp</Btn>
          <Btn color={C.muted} small outline onClick={() => doPrint("mrn-print", `MRN — ${form.mrnNo}`)}>🖨️ Print/PDF</Btn>
          <Btn outline small onClick={() => setPage("mrn")}>Cancel</Btn>
          <Btn color={C.green} onClick={handleSave}>💾 Save MRN</Btn>
        </div>
      </div>

      <div id="mrn-print" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <Card>
          <Sec title="Receipt Details" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 12 }}>
            <Inp label="MRN No." value={form.mrnNo} onChange={v => set("mrnNo", v)} />
            <Inp label="Date" value={form.date} onChange={v => set("date", v)} type="date" />
            <Inp label="Supplier / Vendor" value={form.supplier} onChange={v => set("supplier", v)} req />
            <Inp label="Delivery Challan No." value={form.challan} onChange={v => set("challan", v)} />
            <Inp label="Vehicle No." value={form.vehicle} onChange={v => set("vehicle", v)} />
            <Inp label="PO / Indent No." value={form.poNo} onChange={v => set("poNo", v)} />
            <Inp label="Received By" value={form.receivedBy} onChange={v => set("receivedBy", v)} />
            <Inp label="Time of Receipt" value={form.time} onChange={v => set("time", v)} type="time" />
          </div>
        </Card>

        <Card>
          <Sec title="Materials Received" />
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <THead cols={["BOQ Item", "Material / Grade", "Unit", "PO Qty", "Challan Qty", "Actual Rcvd", "Short/Excess", ""]} />
              <tbody>
                {form.materials.map((m, i) => (
                  <tr key={i} style={{ background: i % 2 ? C.navyLight : "#fff" }}>
                    <td style={{ padding: "3px 3px" }}>
                      <select value={m.boqId || ""} onChange={e => { const b=(data.boq||[]).find(x=>x.id===e.target.value); setA("materials",i,"boqId",e.target.value); if(b){setA("materials",i,"name",b.description);setA("materials",i,"unit",b.unit);}}}
                        style={{ ...tblInput, minWidth: 140 }}>
                        <option value="">— Select BOQ Item —</option>
                        {(data.boq||[]).map(b => <option key={b.id} value={b.id}>{b.sno ? b.sno+". ":""}{b.description}</option>)}
                      </select>
                    </td>
                    {["name", "unit", "poQty", "challanQty", "received", "shortExcess"].map(f => (
                      <TI key={f} value={m[f]} onChange={v => setA("materials", i, f, v)} />
                    ))}
                    <td style={{ padding: "3px 4px" }}><Btn small danger onClick={() => setForm(f => ({ ...f, materials: f.materials.filter((_, j) => j !== i) }))}>✕</Btn></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: 10 }}>
            <Btn small outline onClick={() => setForm(f => ({ ...f, materials: [...f.materials, { boqId: "", name: "", unit: "", poQty: "", challanQty: "", received: "", shortExcess: "" }] }))}>+ Add Row</Btn>
          </div>
        </Card>

        <Card>
          <Sec title="Quality Inspection Checklist" />
          {form.checks.map((c, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 0", borderBottom: `1px solid ${C.border}`, fontSize: 13 }}>
              <span style={{ flex: 1 }}>{c.pt}</span>
              {["OK", "Not OK", "N/A"].map(opt => (
                <label key={opt} style={{ display: "flex", alignItems: "center", gap: 4, cursor: "pointer", fontWeight: 700, fontSize: 12, whiteSpace: "nowrap", color: c.s === opt ? (opt === "OK" ? C.green : opt === "Not OK" ? C.red : C.muted) : C.muted }}>
                  <input type="radio" name={`chk${i}`} checked={c.s === opt} onChange={() => setA("checks", i, "s", opt)} /> {opt}
                </label>
              ))}
            </div>
          ))}
        </Card>

        <Card>
          <Sec title="Acceptance Decision" />
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginBottom: 14 }}>
            {["Accepted", "Accepted with conditions", "Rejected"].map(opt => (
              <label key={opt} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontWeight: 700, fontSize: 14, color: form.decision === opt ? (opt === "Accepted" ? C.green : opt === "Rejected" ? C.red : C.amber) : C.muted }}>
                <input type="radio" name="dec" checked={form.decision === opt} onChange={() => set("decision", opt)} /> {opt}
              </label>
            ))}
          </div>
          {form.decision !== "Accepted" && <Inp label="Reason / Remarks" value={form.rejReason} onChange={v => set("rejReason", v)} />}
        </Card>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
        <Btn outline onClick={() => setPage("mrn")}>Cancel</Btn>
        <Btn color={C.green} onClick={handleSave}>💾 Save MRN</Btn>
      </div>
    </div>
  );
}

function MRNList({ data, setData, setPage }) {
  const sorted = [...data.mrns].sort((a, b) => b.date.localeCompare(a.date));
  const del = (id) => {
    if (!confirm("Delete?")) return;
    const nd = { ...data, mrns: data.mrns.filter(m => m.id !== id) };
    setData(nd); saveData(nd);
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ ...FF, fontSize: 18, fontWeight: 900, color: C.navy }}>Material Receipt Notes</div>
        <Btn color={C.green} onClick={() => setPage("mrn-new")}>+ New MRN</Btn>
      </div>
      <Card>
        {sorted.length === 0 ? <Empty icon="📦" msg="No MRNs yet." /> : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <THead cols={["MRN No.", "Date", "Supplier", "Challan No.", "Decision", "Received By", "Action"]} />
              <tbody>
                {sorted.map((m, i) => (
                  <tr key={m.id} style={{ background: i % 2 ? C.navyLight : "#fff" }}>
                    <td style={{ padding: "8px 10px", fontWeight: 700, color: C.navy }}>{m.mrnNo}</td>
                    <td style={{ padding: "8px 10px" }}>{fmtDate(m.date)}</td>
                    <td style={{ padding: "8px 10px" }}>{m.supplier}</td>
                    <td style={{ padding: "8px 10px" }}>{m.challan}</td>
                    <td style={{ padding: "8px 10px" }}><Bdg t={m.decision} col={m.decision === "Accepted" ? C.green : m.decision === "Rejected" ? C.red : C.amber} /></td>
                    <td style={{ padding: "8px 10px" }}>{m.receivedBy}</td>
                    <td style={{ padding: "8px 10px" }}><Btn small danger onClick={() => del(m.id)}>Del</Btn></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MIR
// ══════════════════════════════════════════════════════════════════════════════
function MIRForm({ data, setData, setPage }) {
  const [form, setForm] = useState({
    id: uid(),
    mirNo: `MIR-${data.projectCode || "PROJ"}-${new Date().getFullYear()}-${String(data.mirs.length + 1).padStart(3, "0")}`,
    date: today(), requestedBy: "", requiredBy: "", priority: "Normal", status: "Pending", forActivity: "",
    materials: [{ boqId: "", name: "", unit: "", stock: "", required: "", forAct: "", expectedDate: "", supplier: "" }],
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setA = (k, i, f2, v) => setForm(f => { const a = deepCopy(f[k]); a[i][f2] = v; return { ...f, [k]: a }; });
  const handleSave = () => {
    const nd = { ...data, mirs: [...data.mirs, form] };
    setData(nd); saveData(nd); setPage("mir");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
        <div style={{ ...FF, fontSize: 18, fontWeight: 900, color: C.navy }}>Material Indent / Requisition (MIR)</div>
        <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
          <Btn color={C.muted} small outline onClick={() => doPrint("mir-print", `MIR — ${form.mirNo}`)}>🖨️ Print/PDF</Btn>
          <Btn outline small onClick={() => setPage("mir")}>Cancel</Btn>
          <Btn color={C.orange} onClick={handleSave}>💾 Submit MIR</Btn>
        </div>
      </div>

      <div id="mir-print" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <Card>
          <Sec title="Indent Details" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 12 }}>
            <Inp label="MIR No." value={form.mirNo} onChange={v => set("mirNo", v)} />
            <Inp label="Date" value={form.date} onChange={v => set("date", v)} type="date" />
            <Inp label="Requested By" value={form.requestedBy} onChange={v => set("requestedBy", v)} req />
            <Inp label="Required By Date" value={form.requiredBy} onChange={v => set("requiredBy", v)} type="date" />
            <Sel label="Priority" value={form.priority} onChange={v => set("priority", v)} options={["Normal", "Urgent", "Critical"]} />
            <Inp label="For Activity / Purpose" value={form.forActivity} onChange={v => set("forActivity", v)} />
          </div>
        </Card>

        <Card>
          <Sec title="Materials Required" />
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <THead cols={["BOQ Item", "Material / Spec", "Unit", "Stock", "Qty Required", "For Activity", "Required By", ""]} />
              <tbody>
                {form.materials.map((m, i) => {
                  const selBoq = (data.boq || []).find(b => b.id === m.boqId);
                  return (
                  <tr key={i} style={{ background: i % 2 ? C.navyLight : "#fff" }}>
                    <td style={{ padding: "3px 3px" }}>
                      <select value={m.boqId || ""} onChange={e => { const b = (data.boq||[]).find(x=>x.id===e.target.value); setA("materials",i,"boqId",e.target.value); if(b){ setA("materials",i,"name",b.description); setA("materials",i,"unit",b.unit); }}}
                        style={{ ...tblInput, minWidth: 140, background: m.boqId ? "#fff" : "#FFFBEB" }}>
                        <option value="">— Select BOQ Item —</option>
                        {(data.boq||[]).map(b => { const a=computeBoqActuals(data); const ord=(a[b.id]?.ordered||0); const over=ord>Number(b.tenderQty||0); return <option key={b.id} value={b.id}>{over?"⚠️ ":""}{b.sno ? b.sno+". ":""}{b.description} ({b.unit})</option>; })}
                      </select>
                    </td>
                    <TI value={m.name} onChange={v => setA("materials", i, "name", v)} />
                    <TI value={m.unit} onChange={v => setA("materials", i, "unit", v)} />
                    <TI value={m.stock} onChange={v => setA("materials", i, "stock", v)} />
                    <TI value={m.required} onChange={v => setA("materials", i, "required", v)} type="number" />
                    <TI value={m.forAct} onChange={v => setA("materials", i, "forAct", v)} />
                    <TI value={m.expectedDate} onChange={v => setA("materials", i, "expectedDate", v)} type="date" />
                    <td style={{ padding: "3px 4px" }}><Btn small danger onClick={() => setForm(f => ({ ...f, materials: f.materials.filter((_, j) => j !== i) }))}>✕</Btn></td>
                  </tr>
                  );
                })}
                {/* BOQ deviation alerts below table */}
                {form.materials.filter(m => m.boqId).map((m, i) => (
                  <tr key={"alert-"+i}><td colSpan={8} style={{ padding: "0 3px 6px" }}>
                    <BOQDeviationAlert boqId={m.boqId} additionalQty={m.required} data={data} />
                  </td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: 10 }}>
            <Btn small outline onClick={() => setForm(f => ({ ...f, materials: [...f.materials, { boqId: "", name: "", unit: "", stock: "", required: "", forAct: "", expectedDate: "", supplier: "" }] }))}>+ Add Row</Btn>
          </div>
        </Card>

        <Warn>⚠️ <strong>Protocol:</strong> No material shall be purchased without PM approval. Status will be updated by PM / Coordinator. Verbal approvals are NOT accepted.</Warn>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
        <Btn outline onClick={() => setPage("mir")}>Cancel</Btn>
        <Btn color={C.orange} onClick={handleSave}>💾 Submit MIR</Btn>
      </div>
    </div>
  );
}

function MIRList({ data, setData, setPage, role }) {
  const sorted = [...data.mirs].sort((a, b) => b.date.localeCompare(a.date));
  const del = (id) => {
    if (!confirm("Delete?")) return;
    const nd = { ...data, mirs: data.mirs.filter(m => m.id !== id) };
    setData(nd); saveData(nd);
  };
  const upd = (id, status) => {
    const nd = { ...data, mirs: data.mirs.map(m => m.id === id ? { ...m, status } : m) };
    setData(nd); saveData(nd);
  };
  const canApprove = role === "pm" || role === "coord";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ ...FF, fontSize: 18, fontWeight: 900, color: C.navy }}>Material Indents (MIR)</div>
        <Btn color={C.orange} onClick={() => setPage("mir-new")}>+ New Indent</Btn>
      </div>
      <Card>
        {sorted.length === 0 ? <Empty icon="🛒" msg="No indents raised yet." /> : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <THead cols={["MIR No.", "Date", "Requested By", "Priority", "Required By", "Status", canApprove ? "Update Status" : "Note", "Action"]} />
              <tbody>
                {sorted.map((m, i) => (
                  <tr key={m.id} style={{ background: i % 2 ? C.navyLight : "#fff" }}>
                    <td style={{ padding: "8px 10px", fontWeight: 700, color: C.navy }}>{m.mirNo}</td>
                    <td style={{ padding: "8px 10px" }}>{fmtDate(m.date)}</td>
                    <td style={{ padding: "8px 10px" }}>{m.requestedBy}</td>
                    <td style={{ padding: "8px 10px" }}><Bdg t={m.priority} col={m.priority === "Critical" ? C.red : m.priority === "Urgent" ? C.amber : C.muted} /></td>
                    <td style={{ padding: "8px 10px" }}>{fmtDate(m.requiredBy)}</td>
                    <td style={{ padding: "8px 10px" }}><Bdg t={m.status} col={m.status === "Approved" ? C.green : m.status === "Pending" ? C.amber : m.status === "Rejected" ? C.red : C.muted} /></td>
                    <td style={{ padding: "8px 10px" }}>
                      {canApprove
                        ? <select value={m.status} onChange={e => upd(m.id, e.target.value)} style={{ ...FF, padding: "4px 7px", border: `1px solid ${C.border}`, borderRadius: 5, fontSize: 11 }}>
                          {["Pending", "Approved", "Hold", "Rejected"].map(s => <option key={s}>{s}</option>)}
                        </select>
                        : <span style={{ fontSize: 11, color: C.muted }}>PM to approve</span>}
                    </td>
                    <td style={{ padding: "8px 10px" }}><Btn small danger onClick={() => del(m.id)}>Del</Btn></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MUSTER ROLL
// ══════════════════════════════════════════════════════════════════════════════
function MusterPage({ data, setData }) {
  const [newW, setNewW] = useState({ name: "", trade: "Mason", contractor: "", phone: "", aadhaar: "" });
  const [attDate, setAttDate] = useState(today());
  const [musterMonth, setMusterMonth] = useState(today().slice(0, 7));

  const addWorker = () => {
    if (!newW.name.trim()) return;
    const nd = { ...data, workers: [...data.workers, { ...newW, id: uid(), attendance: {} }] };
    setData(nd); saveData(nd);
    setNewW({ name: "", trade: "Mason", contractor: "", phone: "", aadhaar: "" });
  };

  const mark = (id, status) => {
    const nd = { ...data, workers: data.workers.map(w => w.id === id ? { ...w, attendance: { ...w.attendance, [attDate]: status } } : w) };
    setData(nd); saveData(nd);
  };

  const delWorker = (id) => {
    if (!confirm("Remove worker?")) return;
    const nd = { ...data, workers: data.workers.filter(w => w.id !== id) };
    setData(nd); saveData(nd);
  };

  const present = data.workers.filter(w => w.attendance?.[attDate] === "P").length;
  const absent = data.workers.filter(w => w.attendance?.[attDate] === "A").length;
  const [yr, mo] = musterMonth.split("-").map(Number);
  const daysInMonth = new Date(yr, mo, 0).getDate();
  const monthDays = Array.from({ length: daysInMonth }, (_, i) => new Date(yr, mo - 1, i + 1).toISOString().slice(0, 10));

  const attCol = { P: C.green, A: C.red, OT: C.blue, HD: C.amber, H: C.muted };
  const attBg = { P: C.greenLight, A: C.redLight, OT: C.blueLight, HD: C.amberLight, H: "#F3F4F6" };

  const waText = `*Attendance — ${fmtDate(attDate)}*\n✅ Present: ${present} ❌ Absent: ${absent} Total: ${data.workers.length}\n\n${data.workers.filter(w => w.attendance?.[attDate]).map(w => `${w.attendance[attDate] === "P" ? "✅" : "❌"} ${w.name} (${w.trade})`).join("\n")}\n_Infra Site App_`;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ ...FF, fontSize: 18, fontWeight: 900, color: C.navy }}>Labour Register & Muster Roll</div>

      <Card>
        <Sec title="Register New Worker" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12 }}>
          <Inp label="Worker Name" value={newW.name} onChange={v => setNewW(n => ({ ...n, name: v }))} req />
          <Sel label="Trade" value={newW.trade} onChange={v => setNewW(n => ({ ...n, trade: v }))} options={TRADE_OPTS} />
          <Inp label="Contractor" value={newW.contractor} onChange={v => setNewW(n => ({ ...n, contractor: v }))} />
          <Inp label="Phone No." value={newW.phone} onChange={v => setNewW(n => ({ ...n, phone: v }))} />
          <Inp label="Aadhaar No." value={newW.aadhaar} onChange={v => setNewW(n => ({ ...n, aadhaar: v }))} />
        </div>
        <div style={{ marginTop: 14 }}><Btn color={C.blue} onClick={addWorker}>+ Register Worker</Btn></div>
      </Card>

      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 14 }}>
          <div>
            <div style={{ ...FF, fontSize: 14, fontWeight: 800, color: C.navy }}>Daily Attendance — {fmtDate(attDate)}</div>
            <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
              <Bdg t={`✅ Present: ${present}`} col={C.green} />
              <Bdg t={`❌ Absent: ${absent}`} col={C.red} />
              <Bdg t={`Total: ${data.workers.length}`} col={C.navy} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input type="date" value={attDate} onChange={e => setAttDate(e.target.value)} style={{ ...baseInput, width: "auto" }} />
            <Btn color="#25D366" small onClick={() => wa(waText)}>💬 Share</Btn>
          </div>
        </div>
        {data.workers.length === 0 ? <Empty icon="👷" msg="Register workers above to mark attendance." /> : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <THead cols={["#", "Worker Name", "Trade", "Contractor", "Mark Attendance", "Status", "Remove"]} />
              <tbody>
                {data.workers.map((w, i) => {
                  const s = w.attendance?.[attDate] || "";
                  return (
                    <tr key={w.id} style={{ background: i % 2 ? C.navyLight : "#fff" }}>
                      <td style={{ padding: "7px 10px", textAlign: "center" }}>{i + 1}</td>
                      <td style={{ padding: "7px 10px", fontWeight: 600 }}>{w.name}</td>
                      <td style={{ padding: "7px 10px" }}>{w.trade}</td>
                      <td style={{ padding: "7px 10px" }}>{w.contractor || "—"}</td>
                      <td style={{ padding: "7px 8px" }}>
                        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                          {["P", "A", "HD", "OT", "H"].map(code => (
                            <button key={code} onClick={() => mark(w.id, code)}
                              style={{ ...FF, padding: "4px 9px", background: s === code ? attCol[code] : "transparent", color: s === code ? "#fff" : attCol[code], border: `1.5px solid ${attCol[code]}`, borderRadius: 6, cursor: "pointer", fontWeight: 700, fontSize: 10 }}>
                              {code}
                            </button>
                          ))}
                        </div>
                      </td>
                      <td style={{ padding: "7px 10px" }}>
                        {s ? <Bdg t={s} col={attCol[s] || C.muted} /> : <span style={{ color: C.muted, fontSize: 11 }}>—</span>}
                      </td>
                      <td style={{ padding: "7px 10px" }}><Btn small danger onClick={() => delWorker(w.id)}>✕</Btn></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {data.workers.length > 0 && (
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 14 }}>
            <Sec title="Monthly Muster Roll" />
            <input type="month" value={musterMonth} onChange={e => setMusterMonth(e.target.value)} style={{ ...baseInput, width: "auto" }} />
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10 }}>
              <thead>
                <tr>
                  <th style={{ background: C.navy, color: "#fff", padding: "6px 8px", textAlign: "left", minWidth: 110 }}>Worker</th>
                  <th style={{ background: C.navy, color: "#fff", padding: "6px 8px", textAlign: "left", minWidth: 80 }}>Trade</th>
                  {monthDays.map(d => (
                    <th key={d} style={{ background: C.navy, color: "#fff", padding: "5px 3px", textAlign: "center", minWidth: 22, fontSize: 9 }}>
                      {new Date(d + "T00:00:00").getDate()}
                    </th>
                  ))}
                  <th style={{ background: C.orange, color: "#fff", padding: "6px 6px", textAlign: "center" }}>P</th>
                  <th style={{ background: C.red, color: "#fff", padding: "6px 6px", textAlign: "center" }}>A</th>
                </tr>
              </thead>
              <tbody>
                {data.workers.map((w, i) => {
                  const P = monthDays.filter(d => ["P", "OT"].includes(w.attendance?.[d] || "")).length;
                  const A = monthDays.filter(d => w.attendance?.[d] === "A").length;
                  return (
                    <tr key={w.id} style={{ background: i % 2 ? C.navyLight : "#fff" }}>
                      <td style={{ padding: "5px 8px", fontWeight: 600 }}>{w.name}</td>
                      <td style={{ padding: "5px 8px" }}>{w.trade}</td>
                      {monthDays.map(d => {
                        const s = w.attendance?.[d] || "";
                        return <td key={d} style={{ padding: "3px 2px", textAlign: "center", background: attBg[s] || "", fontSize: 9, fontWeight: 700 }}>{s}</td>;
                      })}
                      <td style={{ padding: "5px 6px", textAlign: "center", fontWeight: 800, color: C.green }}>{P}</td>
                      <td style={{ padding: "5px 6px", textAlign: "center", fontWeight: 800, color: C.red }}>{A}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// WEEKLY PROGRESS REPORT
// ══════════════════════════════════════════════════════════════════════════════
function WPRPage({ data }) {
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
  const wDSRs = data.dsrs.filter(d => d.date >= weekAgo);
  const totalPresent = wDSRs.reduce((s, d) => s + sum(d.labour || [], "present"), 0);
  const toolboxDays = wDSRs.filter(d => d.toolbox?.conducted === "Yes").length;
  const allIssues = wDSRs.flatMap(d => (d.issues || []).filter(i => i.desc).map(i => ({ ...i, date: d.date, dsrNo: d.dsrNo })));
  const weekMRNs = data.mrns.filter(m => m.date >= weekAgo);

  const matMap = {};
  wDSRs.forEach(d => {
    (d.materials || []).forEach(m => {
      if (m.name && (Number(m.consumed) > 0 || Number(m.received) > 0)) {
        if (!matMap[m.name]) matMap[m.name] = { received: 0, consumed: 0 };
        matMap[m.name].consumed += Number(m.consumed || 0);
        matMap[m.name].received += Number(m.received || 0);
      }
    });
  });

  const labMap = {};
  wDSRs.forEach(d => {
    (d.labour || []).forEach(l => {
      if (!labMap[l.cat]) labMap[l.cat] = { present: 0, absent: 0, ot: 0 };
      labMap[l.cat].present += Number(l.present || 0);
      labMap[l.cat].absent += Number(l.absent || 0);
      labMap[l.cat].ot += Number(l.ot || 0);
    });
  });

  const waText = `*Weekly Report — ${data.projectName || "Project"}*\n📅 ${fmtDate(weekAgo)} to ${fmtDate(today())}\nDSRs: ${wDSRs.length}/7 | Labour: ${totalPresent}\nToolbox: ${toolboxDays}/7 | Issues: ${allIssues.length}\n\n*Material Consumed*\n${Object.entries(matMap).slice(0, 5).map(([n, v]) => `• ${n}: ${v.consumed.toFixed(1)}`).join("\n")}\n\n_Infra Site App_`;

  const cards = [
    { l: "DSRs Filed", v: `${wDSRs.length}/7`, col: wDSRs.length >= 5 ? C.green : wDSRs.length >= 3 ? C.amber : C.red },
    { l: "Total Labour", v: totalPresent, col: C.blue },
    { l: "Toolbox Talks", v: `${toolboxDays}/7`, col: toolboxDays >= 5 ? C.green : C.red },
    { l: "Open Issues", v: allIssues.length, col: allIssues.length === 0 ? C.green : allIssues.length < 3 ? C.amber : C.red },
    { l: "MRNs Received", v: weekMRNs.length, col: C.navy },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        <div>
          <div style={{ ...FF, fontSize: 18, fontWeight: 900, color: C.navy }}>Weekly Progress Report</div>
          <div style={{ fontSize: 12, color: C.muted }}>Auto-generated · Last 7 days · {wDSRs.length} DSRs</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn color="#25D366" small onClick={() => wa(waText)}>💬 Share on WhatsApp</Btn>
          <Btn color={C.muted} small outline onClick={() => doPrint("wpr-print", "Weekly Progress Report")}>🖨️ Print/PDF</Btn>
        </div>
      </div>

      <div id="wpr-print" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 12 }}>
          {cards.map(s => (
            <Card key={s.l} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 26, fontWeight: 900, color: s.col }}>{s.v}</div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>{s.l}</div>
            </Card>
          ))}
        </div>

        <Card>
          <Sec title="Material Consumption This Week" />
          {Object.keys(matMap).length === 0 ? <Empty icon="🧱" msg="No material entries this week" /> : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <THead cols={["Material", "Received (week)", "Consumed (week)"]} />
              <tbody>
                {Object.entries(matMap).map(([name, v], i) => (
                  <tr key={name} style={{ background: i % 2 ? C.navyLight : "#fff" }}>
                    <td style={{ padding: "8px 10px" }}>{name}</td>
                    <td style={{ padding: "8px 10px", textAlign: "center" }}><Bdg t={v.received.toFixed(1)} col={C.green} /></td>
                    <td style={{ padding: "8px 10px", textAlign: "center" }}><Bdg t={v.consumed.toFixed(1)} col={C.navy} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <Card>
          <Sec title="Labour Summary This Week" />
          {Object.keys(labMap).length === 0 ? <Empty icon="👷" msg="No labour data this week" /> : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <THead cols={["Category", "Total Present", "Total Absent", "OT Hours"]} />
              <tbody>
                {Object.entries(labMap).map(([cat, v], i) => (
                  <tr key={cat} style={{ background: i % 2 ? C.navyLight : "#fff" }}>
                    <td style={{ padding: "8px 10px" }}>{cat}</td>
                    <td style={{ padding: "8px 10px", textAlign: "center" }}><Bdg t={v.present} col={C.green} /></td>
                    <td style={{ padding: "8px 10px", textAlign: "center" }}><Bdg t={v.absent} col={C.red} /></td>
                    <td style={{ padding: "8px 10px", textAlign: "center" }}><Bdg t={v.ot} col={C.blue} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <Card>
          <Sec title="Issues This Week" />
          {allIssues.length === 0 ? <Empty icon="✅" msg="No issues this week — great work!" /> : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <THead cols={["Date", "DSR No.", "Issue", "Category", "Action", "Responsible", "Target Date"]} />
              <tbody>
                {allIssues.map((iss, i) => (
                  <tr key={i} style={{ background: i % 2 ? C.navyLight : "#fff" }}>
                    <td style={{ padding: "7px 10px" }}>{fmtDate(iss.date)}</td>
                    <td style={{ padding: "7px 10px", fontSize: 11, color: C.muted }}>{iss.dsrNo}</td>
                    <td style={{ padding: "7px 10px" }}>{iss.desc}</td>
                    <td style={{ padding: "7px 10px" }}><Bdg t={iss.cat} col={C.amber} /></td>
                    <td style={{ padding: "7px 10px" }}>{iss.action || "—"}</td>
                    <td style={{ padding: "7px 10px" }}>{iss.responsible || "—"}</td>
                    <td style={{ padding: "7px 10px" }}>{fmtDate(iss.targetDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SETTINGS
// ══════════════════════════════════════════════════════════════════════════════
function SettingsPage({ data, setData }) {
  const [pName, setPName] = useState(data.projectName || "");
  const [pCode, setPCode] = useState(data.projectCode || "");

  const handleSave = () => {
    const nd = { ...data, projectName: pName, projectCode: pCode };
    setData(nd); saveData(nd); alert("Settings saved!");
  };
  const switchRole = () => { const nd = { ...data, role: "" }; setData(nd); saveData(nd); };
  const clearAll = () => {
    if (!confirm("Permanently delete ALL project data?")) return;
    const nd = makeEmpty(); setData(nd); saveData(nd);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ ...FF, fontSize: 18, fontWeight: 900, color: C.navy }}>Settings</div>
      <Card>
        <Sec title="Project Information" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Inp label="Project Name" value={pName} onChange={setPName} placeholder="e.g. NH-44 Bypass Package 3" />
          <Inp label="Project Code" value={pCode} onChange={setPCode} placeholder="e.g. NH44" />
        </div>
        <div style={{ marginTop: 14 }}><Btn onClick={handleSave}>Save Settings</Btn></div>
      </Card>
      <Card>
        <Sec title="Current Role" />
        <div style={{ fontSize: 13, color: C.text, marginBottom: 12 }}>
          Logged in as: <strong>{ROLES.find(r => r.v === data.role)?.icon} {ROLES.find(r => r.v === data.role)?.l}</strong>
        </div>
        <Btn outline onClick={switchRole}>Switch Role</Btn>
      </Card>
      <Card>
        <Sec title="Data Summary" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(110px,1fr))", gap: 10, marginBottom: 16 }}>
          {[["DSRs", data.dsrs.length], ["MRNs", data.mrns.length], ["MIRs", data.mirs.length], ["Workers", data.workers.length]].map(([l, v]) => (
            <div key={l} style={{ background: C.navyLight, borderRadius: 8, padding: "10px 14px", textAlign: "center" }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: C.navy }}>{v}</div>
              <div style={{ fontSize: 11, color: C.muted }}>{l}</div>
            </div>
          ))}
        </div>
        <Btn danger onClick={clearAll}>🗑️ Clear All Data</Btn>
      </Card>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ROOT
// ══════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [data, setData] = useState(null);
  const [page, setPage] = useState("dashboard");
  const [editId, setEditId] = useState(null);

  useEffect(() => { loadData().then(setData); }, []);

  if (!data) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", fontFamily: "sans-serif", color: C.navy, fontSize: 15 }}>
      Loading…
    </div>
  );

  if (!data.role) return <RoleSelect data={data} setData={setData} />;

  const role = data.role;

  const renderPage = () => {
    switch (page) {
      case "dsr-new":  return <DSRForm data={data} setData={setData} editId={null} setPage={setPage} />;
      case "dsr-edit": return <DSRForm data={data} setData={setData} editId={editId} setPage={setPage} />;
      case "dsr":      return <DSRList data={data} setData={setData} setPage={setPage} setEditId={setEditId} />;
      case "mrn-new":  return <MRNForm data={data} setData={setData} setPage={setPage} />;
      case "mrn":      return <MRNList data={data} setData={setData} setPage={setPage} />;
      case "mir-new":  return <MIRForm data={data} setData={setData} setPage={setPage} />;
      case "mir":      return <MIRList data={data} setData={setData} setPage={setPage} role={role} />;
      case "muster":   return <MusterPage data={data} setData={setData} />;
      case "wpr":      return <WPRPage data={data} />;
      case "boq":      return <BOQPage data={data} setData={setData} role={role} />;
      case "settings": return <SettingsPage data={data} setData={setData} />;
      default:         return <Dashboard data={data} setPage={setPage} role={role} />;
    }
  };

  // Detect mobile (screen width < 768px)
  const isMobile = window.innerWidth < 768;

  // Bottom nav items (most used — fits on mobile bar)
  const BOTTOM_NAV = [
    { k: "dashboard", icon: "🏠", l: "Home" },
    { k: "dsr",       icon: "📋", l: "DSR" },
    { k: "mrn",       icon: "📦", l: "MRN" },
    { k: "muster",    icon: "👷", l: "Labour" },
    { k: "boq",       icon: "📐", l: "BOQ" },
  ];

  // iOS install tip (shown once)
  const [showInstallTip, setShowInstallTip] = React.useState(() => {
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isStandalone = window.navigator.standalone === true;
    const dismissed = localStorage.getItem("install_tip_dismissed");
    return isIOS && !isStandalone && !dismissed;
  });

  const dismissInstallTip = () => {
    localStorage.setItem("install_tip_dismissed", "1");
    setShowInstallTip(false);
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "'Segoe UI',system-ui,sans-serif", background: C.bg }}>

      {/* iOS Install Banner */}
      {showInstallTip && (
        <div style={{ position: "fixed", bottom: isMobile ? 70 : 20, left: 16, right: 16, zIndex: 9999, background: C.navyDark, color: "#fff", borderRadius: 12, padding: "12px 16px", boxShadow: "0 4px 20px rgba(0,0,0,0.4)", display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 22 }}>📱</span>
          <div style={{ flex: 1, fontSize: 12, lineHeight: 1.5 }}>
            <strong>Install this app on your iPhone:</strong><br />
            Tap <strong>Share</strong> (□↑) at the bottom → <strong>"Add to Home Screen"</strong>
          </div>
          <button onClick={dismissInstallTip} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.6)", fontSize: 20, cursor: "pointer", padding: "4px 8px" }}>✕</button>
        </div>
      )}

      {/* ── DESKTOP LAYOUT: sidebar on left ── */}
      {!isMobile && (
        <div style={{ width: 200, background: C.navyDark, display: "flex", flexDirection: "column", flexShrink: 0, position: "sticky", top: 0, height: "100vh", overflowY: "auto" }}>
          <div style={{ padding: "18px 16px 12px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ ...FF, fontSize: 11, fontWeight: 900, color: C.orange, letterSpacing: "0.1em" }}>INFRA SITE APP</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>{data.projectName || "Set project name"}</div>
            <div style={{ marginTop: 6, fontSize: 10, color: "rgba(255,255,255,0.35)", background: "rgba(255,255,255,0.07)", borderRadius: 5, padding: "3px 7px", display: "inline-block" }}>
              {ROLES.find(r => r.v === role)?.icon} {ROLES.find(r => r.v === role)?.l}
            </div>
          </div>
          <nav style={{ flex: 1, padding: "8px 6px" }}>
            {NAV.map(n => {
              const active = page === n.k || page.startsWith(n.k + "-");
              return (
                <button key={n.k} onClick={() => setPage(n.k)}
                  style={{ ...FF, display: "flex", alignItems: "center", gap: 9, width: "100%", textAlign: "left", padding: "8px 12px", background: active ? "rgba(255,255,255,0.12)" : "transparent", color: active ? "#fff" : "rgba(255,255,255,0.55)", border: "none", borderLeft: active ? `3px solid ${C.orange}` : "3px solid transparent", borderRadius: 7, cursor: "pointer", fontSize: 12, fontWeight: active ? 700 : 400, marginBottom: 2, transition: "all .12s" }}>
                  <span style={{ fontSize: 15 }}>{n.icon}</span>{n.l}
                </button>
              );
            })}
          </nav>
          <div style={{ padding: "10px 14px", borderTop: "1px solid rgba(255,255,255,0.07)", fontSize: 9, color: "rgba(255,255,255,0.25)" }}>v4.0 — BOQ</div>
        </div>
      )}

      {/* ── MAIN CONTENT ── */}
      <div style={{ flex: 1, overflowX: "hidden", minWidth: 0, display: "flex", flexDirection: "column" }}>

        {/* Mobile top bar */}
        {isMobile && (
          <div style={{ background: C.navyDark, padding: "12px 16px 10px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100 }}>
            <div>
              <div style={{ ...FF, fontSize: 12, fontWeight: 900, color: C.orange, letterSpacing: "0.08em" }}>INFRA SITE APP</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", marginTop: 1 }}>{data.projectName || "Set project name"}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", background: "rgba(255,255,255,0.08)", borderRadius: 5, padding: "3px 8px" }}>
                {ROLES.find(r => r.v === role)?.icon} {ROLES.find(r => r.v === role)?.l}
              </div>
              {/* Hamburger for full nav on mobile */}
              <button onClick={() => setPage("settings")} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.6)", fontSize: 18, cursor: "pointer", padding: 4 }}>⚙️</button>
            </div>
          </div>
        )}

        {/* Page content */}
        <div style={{ flex: 1, padding: isMobile ? "16px 14px 80px" : "22px 24px", overflowX: "hidden" }}>
          {renderPage()}
        </div>
      </div>

      {/* ── MOBILE BOTTOM NAV BAR ── */}
      {isMobile && (
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: C.navyDark, borderTop: "1px solid rgba(255,255,255,0.1)", display: "flex", zIndex: 200, paddingBottom: "env(safe-area-inset-bottom)" }}>
          {BOTTOM_NAV.map(n => {
            const active = page === n.k || page.startsWith(n.k + "-");
            return (
              <button key={n.k} onClick={() => setPage(n.k)}
                style={{ ...FF, flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "8px 4px 10px", background: "none", border: "none", cursor: "pointer", borderTop: active ? `2px solid ${C.orange}` : "2px solid transparent" }}>
                <span style={{ fontSize: 20 }}>{n.icon}</span>
                <span style={{ fontSize: 9, color: active ? C.orange : "rgba(255,255,255,0.5)", fontWeight: active ? 700 : 400, marginTop: 2 }}>{n.l}</span>
              </button>
            );
          })}
          {/* More button */}
          <button onClick={() => setPage("mir")}
            style={{ ...FF, flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "8px 4px 10px", background: "none", border: "none", cursor: "pointer", borderTop: ["mir","wpr"].includes(page) ? `2px solid ${C.orange}` : "2px solid transparent" }}>
            <span style={{ fontSize: 20 }}>🛒</span>
            <span style={{ fontSize: 9, color: ["mir","wpr"].includes(page) ? C.orange : "rgba(255,255,255,0.5)", fontWeight: ["mir","wpr"].includes(page) ? 700 : 400, marginTop: 2 }}>Indent</span>
          </button>
        </div>
      )}
    </div>
  );
}


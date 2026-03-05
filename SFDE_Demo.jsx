import { useState, useEffect, useRef } from "react";

// ─── MOCK DATA ────────────────────────────────────────────────────────────────
const MOCK_USERS = {
  "EMP001": { name: "John Martinez", role: "R002", dept: "Injection Molding", branch: "TGNA-OH" },
  "EMP002": { name: "Sarah Chen", role: "BRANCH_ADMIN", dept: "Quality", branch: "TGNA-OH" },
  "EMP003": { name: "Mike Thompson", role: "QC_USER", dept: "Quality", branch: "TGNA-GA" },
  "EMP004": { name: "Lisa Park", role: "APP_CONTROLLER", dept: "Production Admin", branch: "TGNA-OH" },
  "ADMIN01": { name: "Robert Singh", role: "MOLD_ADMIN", dept: "Maintenance", branch: "TGNA-OH" },
};

const MOCK_PARTS = {
  "TG-10245": { desc: "Door Seal Gasket A", type: "Manufactured", dept: "Injection Molding", std_per_hr: 120, bom: [{ part: "RAW-NBR-002", qty: 0.35, uom: "KG" }, { part: "RAW-CB-011", qty: 0.08, uom: "KG" }] },
  "TG-10388": { desc: "Window Run Channel", type: "Manufactured", dept: "Injection Molding", std_per_hr: 85, bom: [{ part: "RAW-EPDM-001", qty: 0.52, uom: "KG" }] },
  "TG-20110": { desc: "Hood Weatherstrip", type: "Manufactured", dept: "Extrusion", std_per_hr: 200, bom: [{ part: "RAW-NBR-002", qty: 0.18, uom: "KG" }, { part: "RAW-STEEL-04", qty: 0.05, uom: "KG" }] },
  "TG-30045": { desc: "Trunk Seal Ring", type: "Stock", dept: "Assembly", std_per_hr: 60, bom: [{ part: "TG-10245", qty: 1, uom: "EA" }] },
  "TG-PARC-99": { desc: "New Door Seal (PARC)", type: "PARC", dept: "Injection Molding", std_per_hr: 100, bom: [] },
};

const MACHINES = ["IMM-001", "IMM-002", "IMM-003", "IMM-004", "EXT-001", "EXT-002"];
const MOLDS_DATA = [
  { id: "MLD-A101", part: "TG-10245", status: "Active", last_clean: "2026-02-28", clean_by: "Mike R." },
  { id: "MLD-A102", part: "TG-10245", status: "Active", last_clean: "2026-03-01", clean_by: "Tom K." },
  { id: "MLD-B201", part: "TG-10388", status: "Active", last_clean: "2026-02-25", clean_by: "Mike R." },
  { id: "MLD-C301", part: "TG-20110", status: "Retired", last_clean: "2026-01-10", clean_by: "Anna S." },
  { id: "MLD-D401", part: "TG-30045", status: "Active", last_clean: "2026-03-03", clean_by: "Tom K." },
];

const DT_REASONS = { scheduled: ["Planned Maintenance", "Tool Change", "Shift Changeover", "Scheduled Cleaning"], unscheduled: ["Machine Breakdown", "Material Shortage", "Power Failure", "Tooling Failure", "Quality Hold"] };
const DEFECT_REASONS = ["Flash / Overflow", "Short Shot", "Surface Blemish", "Dimensional OOT", "Contamination", "Weld Line", "Sink Mark"];

const SESSION_ENTRIES = [
  { time: "06:12", part: "TG-10245", good: 240, defects: 12, machine: "IMM-001", mold: "MLD-A101", shift: "Day" },
  { time: "07:45", part: "TG-10388", good: 180, defects: 5, machine: "IMM-002", mold: "MLD-B201", shift: "Day" },
  { time: "09:30", part: "TG-10245", good: 310, defects: 8, machine: "IMM-003", mold: "MLD-A102", shift: "Day" },
];

const SFM_DATA = {
  daily: [
    { branch: "TGNA-OH", part: "TG-10245", planned: 800, good: 750, defects: 20, setup: 10, efficiency: "93.8%" },
    { branch: "TGNA-OH", part: "TG-10388", planned: 600, good: 560, defects: 8, setup: 5, efficiency: "93.3%" },
    { branch: "TGNA-OH", part: "TG-20110", planned: 1200, good: 1150, defects: 15, setup: 12, efficiency: "95.8%" },
    { branch: "TGNA-GA", part: "TG-30045", planned: 400, good: 385, defects: 6, setup: 4, efficiency: "96.3%" },
  ],
  weekTrend: [
    { day: "Mon", good: 2650, defects: 65 }, { day: "Tue", good: 2820, defects: 48 },
    { day: "Wed", good: 2700, defects: 71 }, { day: "Thu", good: 2900, defects: 55 },
    { day: "Fri", good: 2845, defects: 49 }, { day: "Sat", good: 1200, defects: 22 },
  ]
};

// ─── STYLES ───────────────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@300;400;500;600;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #0f1117;
    --bg2: #161b27;
    --bg3: #1e2535;
    --bg4: #252d3d;
    --border: #2a3348;
    --border2: #3a4560;
    --amber: #f59e0b;
    --amber-dim: #d97706;
    --amber-glow: rgba(245,158,11,0.15);
    --green: #10b981;
    --green-dim: rgba(16,185,129,0.12);
    --red: #ef4444;
    --red-dim: rgba(239,68,68,0.12);
    --blue: #3b82f6;
    --blue-dim: rgba(59,130,246,0.12);
    --yellow: #eab308;
    --text: #e2e8f0;
    --text2: #94a3b8;
    --text3: #64748b;
    --mono: 'IBM Plex Mono', monospace;
    --sans: 'IBM Plex Sans', sans-serif;
    --radius: 6px;
    --shadow: 0 4px 24px rgba(0,0,0,0.4);
  }

  body { background: var(--bg); color: var(--text); font-family: var(--sans); min-height: 100vh; }

  /* SCROLLBAR */
  ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: var(--bg2); }
  ::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 3px; }

  /* LAYOUT */
  .app { display: flex; flex-direction: column; min-height: 100vh; }
  .topbar { background: var(--bg2); border-bottom: 1px solid var(--border); padding: 0 24px; height: 52px; display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; z-index: 100; }
  .topbar-left { display: flex; align-items: center; gap: 16px; }
  .logo { font-family: var(--mono); font-weight: 600; font-size: 15px; color: var(--amber); letter-spacing: 2px; }
  .logo-sub { font-size: 11px; color: var(--text3); font-family: var(--mono); }
  .topbar-right { display: flex; align-items: center; gap: 12px; }
  .status-bar { background: var(--bg3); border-top: 1px solid var(--border); padding: 6px 24px; display: flex; gap: 24px; font-family: var(--mono); font-size: 11px; color: var(--text3); }
  .status-item { display: flex; align-items: center; gap: 6px; }
  .status-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--green); animation: pulse 2s infinite; }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }

  /* SIDEBAR NAV */
  .main-layout { display: flex; flex: 1; }
  .sidebar { width: 220px; background: var(--bg2); border-right: 1px solid var(--border); padding: 16px 0; display: flex; flex-direction: column; gap: 4px; flex-shrink: 0; }
  .nav-section { padding: 4px 16px 8px; font-size: 10px; font-family: var(--mono); color: var(--text3); letter-spacing: 1.5px; text-transform: uppercase; margin-top: 8px; }
  .nav-item { display: flex; align-items: center; gap: 10px; padding: 9px 16px; cursor: pointer; border-left: 3px solid transparent; transition: all 0.15s; font-size: 13px; color: var(--text2); }
  .nav-item:hover { background: var(--bg3); color: var(--text); }
  .nav-item.active { background: var(--amber-glow); border-left-color: var(--amber); color: var(--amber); }
  .nav-icon { width: 16px; text-align: center; font-size: 14px; }
  .content { flex: 1; overflow-y: auto; padding: 24px; }

  /* CARDS & PANELS */
  .card { background: var(--bg2); border: 1px solid var(--border); border-radius: var(--radius); padding: 20px; margin-bottom: 16px; }
  .card-header { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid var(--border); }
  .card-title { font-size: 13px; font-weight: 600; letter-spacing: 0.5px; color: var(--text); }
  .card-subtitle { font-size: 11px; color: var(--text3); font-family: var(--mono); }
  .section-label { display: inline-flex; align-items: center; gap: 6px; background: var(--amber); color: #000; font-family: var(--mono); font-weight: 600; font-size: 10px; padding: 3px 8px; border-radius: 3px; letter-spacing: 1px; }

  /* FORM ELEMENTS */
  .form-grid { display: grid; gap: 12px; }
  .form-grid-2 { grid-template-columns: 1fr 1fr; }
  .form-grid-3 { grid-template-columns: 1fr 1fr 1fr; }
  .form-grid-4 { grid-template-columns: 1fr 1fr 1fr 1fr; }
  .field { display: flex; flex-direction: column; gap: 5px; }
  .field-label { font-size: 10px; font-family: var(--mono); color: var(--text3); text-transform: uppercase; letter-spacing: 0.8px; }
  .field-label.required::after { content: " *"; color: var(--amber); }
  input, select, textarea { background: var(--bg3); border: 1px solid var(--border); border-radius: var(--radius); color: var(--text); font-family: var(--sans); font-size: 13px; padding: 8px 10px; width: 100%; transition: border-color 0.15s; outline: none; }
  input:focus, select:focus { border-color: var(--amber); box-shadow: 0 0 0 3px var(--amber-glow); }
  input[readonly], input:disabled { background: var(--bg4); color: var(--text3); cursor: not-allowed; }
  select option { background: var(--bg3); }

  /* BUTTONS */
  .btn { display: inline-flex; align-items: center; gap: 7px; padding: 9px 16px; border-radius: var(--radius); font-size: 13px; font-weight: 500; cursor: pointer; border: none; transition: all 0.15s; font-family: var(--sans); }
  .btn-primary { background: var(--amber); color: #000; }
  .btn-primary:hover { background: var(--amber-dim); }
  .btn-secondary { background: var(--bg3); color: var(--text); border: 1px solid var(--border2); }
  .btn-secondary:hover { background: var(--bg4); border-color: var(--text3); }
  .btn-danger { background: var(--red-dim); color: var(--red); border: 1px solid var(--red); }
  .btn-danger:hover { background: var(--red); color: #fff; }
  .btn-success { background: var(--green-dim); color: var(--green); border: 1px solid var(--green); }
  .btn-success:hover { background: var(--green); color: #fff; }
  .btn-sm { padding: 5px 10px; font-size: 11px; }
  .btn-icon { padding: 7px; }
  .btn:disabled { opacity: 0.4; cursor: not-allowed; }

  /* BADGES / CHIPS */
  .badge { display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; border-radius: 20px; font-size: 10px; font-family: var(--mono); font-weight: 600; letter-spacing: 0.5px; }
  .badge-green { background: var(--green-dim); color: var(--green); border: 1px solid rgba(16,185,129,0.3); }
  .badge-red { background: var(--red-dim); color: var(--red); border: 1px solid rgba(239,68,68,0.3); }
  .badge-amber { background: var(--amber-glow); color: var(--amber); border: 1px solid rgba(245,158,11,0.3); }
  .badge-blue { background: var(--blue-dim); color: var(--blue); border: 1px solid rgba(59,130,246,0.3); }
  .badge-gray { background: var(--bg4); color: var(--text3); border: 1px solid var(--border); }

  /* TABLE */
  .table-wrap { overflow-x: auto; border-radius: var(--radius); border: 1px solid var(--border); }
  table { width: 100%; border-collapse: collapse; }
  th { background: var(--bg3); font-size: 10px; font-family: var(--mono); text-transform: uppercase; letter-spacing: 1px; color: var(--text3); padding: 10px 12px; text-align: left; border-bottom: 1px solid var(--border); }
  td { padding: 10px 12px; font-size: 12px; border-bottom: 1px solid var(--border); color: var(--text2); }
  tr:last-child td { border-bottom: none; }
  tr:hover td { background: var(--bg3); }

  /* STATS */
  .stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 16px; }
  .stat-card { background: var(--bg3); border: 1px solid var(--border); border-radius: var(--radius); padding: 16px; }
  .stat-value { font-family: var(--mono); font-size: 28px; font-weight: 600; color: var(--text); line-height: 1; }
  .stat-label { font-size: 11px; color: var(--text3); margin-top: 6px; }
  .stat-change { font-size: 10px; margin-top: 4px; font-family: var(--mono); }
  .stat-up { color: var(--green); } .stat-down { color: var(--red); }

  /* LOGIN */
  .login-wrap { min-height: 100vh; background: var(--bg); display: flex; align-items: center; justify-content: center; padding: 24px; }
  .login-box { width: 100%; max-width: 880px; background: var(--bg2); border: 1px solid var(--border); border-radius: 8px; overflow: hidden; display: grid; grid-template-columns: 1fr 1fr; }
  .login-left { background: linear-gradient(135deg, #0f1117 0%, #1a2236 100%); padding: 48px 40px; display: flex; flex-direction: column; justify-content: space-between; border-right: 1px solid var(--border); }
  .login-nav { display: flex; flex-direction: column; gap: 6px; }
  .login-nav-item { padding: 8px 12px; border-radius: var(--radius); font-size: 12px; color: var(--text3); cursor: pointer; display: flex; align-items: center; gap: 8px; transition: all 0.15s; border: 1px solid transparent; }
  .login-nav-item:hover { background: var(--bg3); color: var(--text); }
  .login-nav-item.locked { opacity: 0.4; cursor: not-allowed; }
  .login-right { padding: 48px 40px; }
  .login-logo { font-family: var(--mono); font-size: 32px; font-weight: 600; color: var(--amber); letter-spacing: 4px; }
  .login-tagline { font-size: 13px; color: var(--text3); margin-top: 8px; }

  /* PROGRESS BAR */
  .progress-bar { background: var(--bg3); border-radius: 20px; height: 6px; overflow: hidden; }
  .progress-fill { height: 100%; border-radius: 20px; transition: width 0.5s ease; }

  /* TOAST */
  .toast-container { position: fixed; top: 70px; right: 20px; z-index: 9999; display: flex; flex-direction: column; gap: 8px; }
  .toast { padding: 12px 16px; border-radius: var(--radius); font-size: 12px; font-family: var(--mono); max-width: 320px; animation: slideIn 0.2s ease; border-left: 3px solid; }
  .toast-success { background: var(--bg2); border-color: var(--green); color: var(--green); box-shadow: var(--shadow); }
  .toast-error { background: var(--bg2); border-color: var(--red); color: var(--red); box-shadow: var(--shadow); }
  .toast-warning { background: var(--bg2); border-color: var(--amber); color: var(--amber); box-shadow: var(--shadow); }
  @keyframes slideIn { from { transform: translateX(40px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }

  /* MODAL */
  .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 24px; backdrop-filter: blur(2px); }
  .modal { background: var(--bg2); border: 1px solid var(--border2); border-radius: 8px; width: 100%; max-width: 520px; padding: 24px; animation: popIn 0.2s ease; }
  @keyframes popIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
  .modal-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
  .modal-title { font-size: 14px; font-weight: 600; color: var(--text); }
  .modal-close { background: none; border: none; color: var(--text3); cursor: pointer; font-size: 18px; line-height: 1; }

  /* CHART BAR */
  .bar-chart { display: flex; align-items: flex-end; gap: 8px; height: 100px; padding: 8px 0; }
  .bar-col { display: flex; flex-direction: column; align-items: center; gap: 4px; flex: 1; }
  .bar { width: 100%; border-radius: 3px 3px 0 0; transition: height 0.5s ease; min-height: 4px; }
  .bar-label { font-size: 9px; font-family: var(--mono); color: var(--text3); }

  /* MISC */
  .page-header { margin-bottom: 20px; }
  .page-title { font-size: 18px; font-weight: 600; color: var(--text); }
  .page-desc { font-size: 12px; color: var(--text3); margin-top: 4px; }
  .divider { border: none; border-top: 1px solid var(--border); margin: 16px 0; }
  .flex { display: flex; } .flex-col { flex-direction: column; }
  .items-center { align-items: center; } .justify-between { justify-content: space-between; }
  .gap-2 { gap: 8px; } .gap-3 { gap: 12px; } .gap-4 { gap: 16px; }
  .mt-2 { margin-top: 8px; } .mt-3 { margin-top: 12px; } .mt-4 { margin-top: 16px; }
  .text-xs { font-size: 11px; } .text-sm { font-size: 12px; } .mono { font-family: var(--mono); }
  .text-amber { color: var(--amber); } .text-green { color: var(--green); }
  .text-red { color: var(--red); } .text-muted { color: var(--text3); }
  .bom-box { background: var(--bg4); border: 1px solid var(--border); border-radius: var(--radius); padding: 12px; margin-top: 8px; }
  .bom-row { display: flex; justify-content: space-between; font-size: 11px; font-family: var(--mono); padding: 3px 0; border-bottom: 1px solid var(--border); }
  .bom-row:last-child { border-bottom: none; }
  .controller-banner { background: var(--red-dim); border: 1px solid var(--red); border-radius: var(--radius); padding: 12px 16px; display: flex; align-items: center; gap: 10px; margin-bottom: 16px; font-size: 12px; color: var(--red); }
  .enabled-banner { background: var(--green-dim); border: 1px solid var(--green); border-radius: var(--radius); padding: 12px 16px; display: flex; align-items: center; gap: 10px; margin-bottom: 16px; font-size: 12px; color: var(--green); }
  @media (max-width: 768px) {
    .login-box { grid-template-columns: 1fr; } .login-left { display: none; }
    .stat-grid { grid-template-columns: 1fr 1fr; } .form-grid-4 { grid-template-columns: 1fr 1fr; }
    .sidebar { display: none; }
  }
`;

// ─── TOAST COMPONENT ─────────────────────────────────────────────────────────
function useToast() {
  const [toasts, setToasts] = useState([]);
  const add = (msg, type = "success") => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  };
  return { toasts, success: m => add(m, "success"), error: m => add(m, "error"), warn: m => add(m, "warning") };
}

function Toasts({ toasts }) {
  return <div className="toast-container">{toasts.map(t => <div key={t.id} className={`toast toast-${t.type}`}>{t.type === "success" ? "✓" : t.type === "error" ? "✗" : "⚠"} {t.msg}</div>)}</div>;
}

// ─── CLOCK ────────────────────────────────────────────────────────────────────
function Clock() {
  const [t, setT] = useState(new Date());
  useEffect(() => { const i = setInterval(() => setT(new Date()), 1000); return () => clearInterval(i); }, []);
  return <span className="mono" style={{ fontSize: 11 }}>{t.toLocaleTimeString()}</span>;
}

// ─── LOGIN SCREEN ─────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [empId, setEmpId] = useState("");
  const [dept, setDept] = useState("Injection Molding");
  const [branch, setBranch] = useState("TGNA-OH");
  const [lang, setLang] = useState("EN");
  const [error, setError] = useState("");
  const [validating, setValidating] = useState(false);

  const tryLogin = () => {
    if (!empId) { setError("Employee ID is required."); return; }
    setValidating(true); setError("");
    setTimeout(() => {
      const user = MOCK_USERS[empId];
      if (!user) { setError("Employee ID not found in JDE Address Book. Please verify your ID."); setValidating(false); return; }
      if (user.dept !== dept && user.role === "R002") { setError(`You do not have R002 access for department: ${dept}. Logging out.`); setValidating(false); return; }
      onLogin({ ...user, empId });
      setValidating(false);
    }, 900);
  };

  return (
    <div className="login-wrap">
      <div style={{ width: "100%", maxWidth: 880 }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div className="login-logo">SFDE</div>
          <div style={{ fontSize: 11, color: "var(--text3)", fontFamily: "var(--mono)", marginTop: 4 }}>SHOP FLOOR DATA ENTRY  |  TOYODA GOSEI NORTH AMERICA</div>
        </div>
        <div className="login-box">
          {/* LEFT — Row Exit Nav */}
          <div className="login-left">
            <div>
              <div style={{ fontSize: 10, fontFamily: "var(--mono)", color: "var(--text3)", letterSpacing: 2, marginBottom: 16 }}>ROW EXIT NAVIGATION</div>
              <div className="login-nav">
                {[
                  { icon: "⌨", label: "Data Entry", locked: false },
                  { icon: "🔬", label: "Quality Entry", locked: false },
                  { icon: "📊", label: "Shop Floor Monitor", locked: false },
                  { icon: "🔧", label: "Change Settings", locked: true },
                  { icon: "🔩", label: "Machine / Reason Admin", locked: true },
                  { icon: "📋", label: "Mold Maintenance", locked: false },
                  { icon: "🔍", label: "Part # Lookup", locked: false },
                  { icon: "📁", label: "Session Entries", locked: false },
                ].map(item => (
                  <div key={item.label} className={`login-nav-item ${item.locked ? "locked" : ""}`}>
                    <span>{item.icon}</span><span>{item.label}</span>
                    {item.locked && <span style={{ marginLeft: "auto", fontSize: 10 }}>🔒</span>}
                  </div>
                ))}
              </div>
            </div>
            <div style={{ fontSize: 10, color: "var(--text3)", fontFamily: "var(--mono)" }}>
              <div>JDE Validation: ● CONNECTED</div>
              <div style={{ marginTop: 4 }}>SQL DB: ● CONNECTED</div>
              <div style={{ marginTop: 4 }}>App Status: <span style={{ color: "var(--green)" }}>ENABLED</span></div>
            </div>
          </div>
          {/* RIGHT — Login Form */}
          <div className="login-right">
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 18, fontWeight: 600, color: "var(--text)" }}>Sign In</div>
              <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 4 }}>Use your JDE Employee / Address Book Number</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div className="field">
                <label className="field-label required">JDE Supervisor ID</label>
                <input placeholder="e.g. EMP001" value={empId} onChange={e => setEmpId(e.target.value.toUpperCase())} onKeyDown={e => e.key === "Enter" && tryLogin()} style={{ fontFamily: "var(--mono)", letterSpacing: 2 }} />
                <div style={{ fontSize: 10, color: "var(--text3)", fontFamily: "var(--mono)" }}>Try: EMP001 · EMP002 · EMP003 · EMP004 · ADMIN01</div>
              </div>
              <div className="field">
                <label className="field-label required">Department</label>
                <select value={dept} onChange={e => setDept(e.target.value)}>
                  {["Injection Molding", "Extrusion", "Assembly", "Quality", "Production Admin", "Maintenance"].map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div className="form-grid form-grid-2" style={{ gap: 12 }}>
                <div className="field">
                  <label className="field-label required">Branch</label>
                  <select value={branch} onChange={e => setBranch(e.target.value)}>
                    <option>TGNA-OH</option><option>TGNA-GA</option><option>TGNA-TN</option>
                  </select>
                </div>
                <div className="field">
                  <label className="field-label">Language</label>
                  <select value={lang} onChange={e => setLang(e.target.value)}>
                    <option value="EN">English</option><option value="ES">Español</option><option value="FR">Français</option>
                  </select>
                </div>
              </div>
              {error && <div style={{ background: "var(--red-dim)", border: "1px solid var(--red)", borderRadius: "var(--radius)", padding: "10px 12px", fontSize: 12, color: "var(--red)" }}>⚠ {error}</div>}
              <button className="btn btn-primary" onClick={tryLogin} disabled={validating} style={{ width: "100%", justifyContent: "center", marginTop: 4, padding: "11px" }}>
                {validating ? "⟳  Validating with JDE..." : "Login  →"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── DATA ENTRY SCREEN ────────────────────────────────────────────────────────
function DataEntryScreen({ user, appEnabled, toast }) {
  const [form, setForm] = useState({
    prodDate: new Date().toISOString().split("T")[0], branch: user.branch, supervisorId: user.empId,
    userId: user.empId, machineId: "", moldId: "", shift: "Day",
    partGood: "", partDefect: "", planned: "", good: "", setup: "0", qc: "0",
    dtScheduled: "0", dtSchReason: "", dtUnscheduled: "0", dtUnschReason: "",
    defectQty: "0", defectReason: "",
    manHours: "", machineHours: "", crewSize: "1", stdPerHr: "",
  });
  const [partInfo, setPartInfo] = useState(null);
  const [partError, setPartError] = useState("");
  const [saved, setSaved] = useState(false);
  const [showBOM, setShowBOM] = useState(false);
  const [backout, setBackout] = useState(false);

  const totalDefects = (parseInt(form.defectQty) || 0);
  const total = (parseInt(form.good) || 0) + (parseInt(form.setup) || 0) + (parseInt(form.qc) || 0) + totalDefects;
  const plannedMachHrs = form.stdPerHr && form.planned ? (parseInt(form.planned) / parseInt(form.stdPerHr)).toFixed(2) : "—";
  const manHrsCalc = form.crewSize && form.machineHours ? (parseInt(form.crewSize) * parseFloat(form.machineHours)).toFixed(2) : "—";

  const validatePart = (partNo) => {
    const p = MOCK_PARTS[partNo];
    if (!p) { setPartInfo(null); setPartError("Part # not found in JDE Item Master."); return; }
    if (p.type === "PARC" && user.role !== "APP_CONTROLLER") { setPartInfo(null); setPartError("PARC part — Override PARC role (R016) required."); return; }
    if (p.dept !== user.dept && user.role === "R002") { setPartInfo(null); setPartError(`Part # belongs to department '${p.dept}', not your assigned department.`); return; }
    setPartError(""); setPartInfo(p);
    setForm(f => ({ ...f, stdPerHr: String(p.std_per_hr) }));
  };

  const handleSave = () => {
    if (!appEnabled) { toast.error("Application is DISABLED by Application Controller."); return; }
    if (!form.machineId || !form.moldId) { toast.error("Machine ID and Mold are required."); return; }
    if (!form.partGood || !partInfo) { toast.error("Valid Part # for Good is required."); return; }
    const numericFields = ["planned", "good", "setup", "qc", "dtScheduled", "dtUnscheduled", "defectQty", "manHours", "machineHours", "crewSize"];
    for (let f of numericFields) { if (form[f] === "" || form[f] === null) { toast.error(`All numeric fields must have a value (enter 0 if unused). Check: ${f}`); return; } }
    toast.success(backout ? "⟲ Back-out entry submitted. JDE transactions reversed." : "✓ Entry saved. JDE IC/IM/IS transactions written.");
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));

  if (!appEnabled) return (
    <div>
      <div className="controller-banner">
        <span style={{ fontSize: 20 }}>🔴</span>
        <div><strong>APPLICATION DISABLED</strong><br /><span style={{ fontSize: 11 }}>An Application Controller has globally disabled data entry. No entries can be saved until re-enabled.</span></div>
      </div>
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <div className="page-title">Data Entry</div>
            <div className="page-desc">Enter production data for your current shift. All sections A–E must be completed.</div>
          </div>
          <div className="flex gap-2">
            <button className={`btn btn-sm ${backout ? "btn-danger" : "btn-secondary"}`} onClick={() => setBackout(!backout)}>
              {backout ? "⟲ BACK-OUT MODE" : "⟲ Back-Out Mode"}
            </button>
            <button className="btn btn-primary" onClick={handleSave}>💾 Save Entry</button>
          </div>
        </div>
        {backout && <div style={{ background: "var(--red-dim)", border: "1px solid var(--red)", borderRadius: "var(--radius)", padding: "10px 14px", marginTop: 12, fontSize: 12, color: "var(--red)" }}>
          ⚠ <strong>Back-Out Mode:</strong> Enter the SAME Section A & B values as the original entry. All quantities will be negated to reverse JDE transactions.
        </div>}
      </div>

      {/* SECTION A */}
      <div className="card">
        <div className="card-header"><span className="section-label">SECTION A</span><span className="card-title">User / Machine Information</span></div>
        <div className="form-grid form-grid-4">
          <div className="field"><label className="field-label required">Supervisor ID</label><input value={form.supervisorId} readOnly style={{ fontFamily: "var(--mono)" }} /></div>
          <div className="field"><label className="field-label required">Production Date</label><input type="date" value={form.prodDate} onChange={e => upd("prodDate", e.target.value)} /></div>
          <div className="field"><label className="field-label required">User ID</label><input value={form.userId} readOnly style={{ fontFamily: "var(--mono)" }} /></div>
          <div className="field"><label className="field-label required">Branch</label><input value={form.branch} readOnly style={{ fontFamily: "var(--mono)" }} /></div>
          <div className="field"><label className="field-label required">Machine ID</label>
            <select value={form.machineId} onChange={e => upd("machineId", e.target.value)}>
              <option value="">— Select —</option>{MACHINES.map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div className="field"><label className="field-label required">Mold</label>
            <select value={form.moldId} onChange={e => upd("moldId", e.target.value)}>
              <option value="">— Select —</option>{MOLDS_DATA.filter(m => m.status === "Active").map(m => <option key={m.id}>{m.id}</option>)}
            </select>
          </div>
          <div className="field"><label className="field-label required">Shift</label>
            <select value={form.shift} onChange={e => upd("shift", e.target.value)}>
              <option>Day</option><option>Afternoon</option><option>Night</option>
            </select>
          </div>
          <div className="field"><label className="field-label">Dept.</label><input value={user.dept} readOnly /></div>
        </div>
      </div>

      {/* SECTION B */}
      <div className="card">
        <div className="card-header"><span className="section-label">SECTION B</span><span className="card-title">Part Information</span></div>
        <div className="form-grid form-grid-2">
          <div className="field">
            <label className="field-label required">Part # for Good</label>
            <div className="flex gap-2">
              <input placeholder="e.g. TG-10245" value={form.partGood} onChange={e => { upd("partGood", e.target.value.toUpperCase()); setPartInfo(null); setPartError(""); }} style={{ fontFamily: "var(--mono)" }} />
              <button className="btn btn-secondary btn-sm" onClick={() => validatePart(form.partGood)} style={{ whiteSpace: "nowrap" }}>Validate ↗</button>
            </div>
            {partError && <div style={{ fontSize: 11, color: "var(--red)", marginTop: 4 }}>✗ {partError}</div>}
            {partInfo && <div style={{ fontSize: 11, color: "var(--green)", marginTop: 4 }}>✓ {partInfo.desc} · {partInfo.type} · {partInfo.dept}</div>}
            {partInfo && <div className="flex gap-2 mt-2">
              <span className="badge badge-green">{partInfo.type}</span>
              <button className="btn btn-sm btn-secondary" onClick={() => setShowBOM(!showBOM)}>📋 View BOM</button>
            </div>}
            {showBOM && partInfo && <div className="bom-box">
              <div style={{ fontSize: 10, fontFamily: "var(--mono)", color: "var(--text3)", marginBottom: 8 }}>BOM EXPLOSION — CHILD PARTS CONSUMED PER UNIT</div>
              {partInfo.bom.map((b, i) => <div className="bom-row" key={i}><span className="text-amber">{b.part}</span><span>{b.qty} {b.uom}</span><span className="text-muted">× {form.good || "?"} = <strong>{((parseFloat(b.qty)) * (parseInt(form.good) || 0)).toFixed(2)} {b.uom}</strong></span></div>)}
              <div style={{ fontSize: 10, color: "var(--text3)", marginTop: 6 }}>→ IM transaction will relieve above child parts from JDE inventory</div>
            </div>}
          </div>
          <div className="field">
            <label className="field-label">Part # for Defects</label>
            <input placeholder="Usually same as Part # for Good" value={form.partDefect} onChange={e => upd("partDefect", e.target.value.toUpperCase())} style={{ fontFamily: "var(--mono)" }} />
            <div style={{ fontSize: 10, color: "var(--text3)", marginTop: 4 }}>Note: Leather wrap parts cannot be entered in Part # for Good field</div>
          </div>
        </div>
      </div>

      {/* SECTION C */}
      <div className="card">
        <div className="card-header"><span className="section-label">SECTION C</span><span className="card-title">Production Numbers</span></div>
        <div className="form-grid form-grid-4" style={{ gap: 12 }}>
          <div className="field"><label className="field-label required">Planned Parts</label><input type="number" min="0" value={form.planned} onChange={e => upd("planned", e.target.value)} /></div>
          <div className="field"><label className="field-label required">Total Good {backout && <span style={{ color: "var(--red)", fontSize: 9 }}>(enter negative)</span>}</label><input type="number" value={form.good} onChange={e => upd("good", e.target.value)} /></div>
          <div className="field"><label className="field-label required">Setup Parts</label><input type="number" min="0" value={form.setup} onChange={e => upd("setup", e.target.value)} /></div>
          <div className="field"><label className="field-label required">QC Parts</label><input type="number" min="0" value={form.qc} onChange={e => upd("qc", e.target.value)} /></div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
          <div className="field"><label className="field-label">Total Defects (auto)</label><input value={totalDefects} readOnly style={{ fontFamily: "var(--mono)", color: totalDefects > 0 ? "var(--red)" : "var(--text3)" }} /></div>
          <div className="field"><label className="field-label">Total (auto)</label><input value={total || ""} readOnly style={{ fontFamily: "var(--mono)", fontWeight: 600, color: "var(--amber)" }} /></div>
        </div>
        <div style={{ fontSize: 10, color: "var(--text3)", marginTop: 8, fontFamily: "var(--mono)" }}>Total = Good + Defects + Setup + QC  |  → IC transaction for Good parts  |  → IS transaction for Setup + QC + Defects</div>
      </div>

      {/* SECTION D */}
      <div className="card">
        <div className="card-header"><span className="section-label">SECTION D</span><span className="card-title">Downtime / Defect Information</span></div>
        <div className="form-grid form-grid-2" style={{ gap: 16 }}>
          <div>
            <div style={{ fontSize: 11, fontFamily: "var(--mono)", color: "var(--text3)", marginBottom: 10 }}>SCHEDULED DOWNTIME</div>
            <div className="form-grid form-grid-2">
              <div className="field"><label className="field-label required">Minutes</label><input type="number" min="0" value={form.dtScheduled} onChange={e => upd("dtScheduled", e.target.value)} /></div>
              <div className="field"><label className="field-label required">Reason Code</label>
                <select value={form.dtSchReason} onChange={e => upd("dtSchReason", e.target.value)}>
                  <option value="">— Select —</option>{DT_REASONS.scheduled.map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontFamily: "var(--mono)", color: "var(--text3)", marginBottom: 10 }}>UNSCHEDULED DOWNTIME</div>
            <div className="form-grid form-grid-2">
              <div className="field"><label className="field-label required">Minutes</label><input type="number" min="0" value={form.dtUnscheduled} onChange={e => upd("dtUnscheduled", e.target.value)} /></div>
              <div className="field"><label className="field-label required">Reason Code</label>
                <select value={form.dtUnschReason} onChange={e => upd("dtUnschReason", e.target.value)}>
                  <option value="">— Select —</option>{DT_REASONS.unscheduled.map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>
        <hr className="divider" />
        <div style={{ fontSize: 11, fontFamily: "var(--mono)", color: "var(--text3)", marginBottom: 10 }}>DEFECT DETAIL</div>
        <div className="form-grid form-grid-2">
          <div className="field"><label className="field-label required">Defect Qty</label><input type="number" min="0" value={form.defectQty} onChange={e => upd("defectQty", e.target.value)} /></div>
          <div className="field"><label className="field-label required">Defect Reason</label>
            <select value={form.defectReason} onChange={e => upd("defectReason", e.target.value)}>
              <option value="">— Select —</option>{DEFECT_REASONS.map(r => <option key={r}>{r}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* SECTION E */}
      <div className="card">
        <div className="card-header"><span className="section-label">SECTION E</span><span className="card-title">Machine / Crew Information</span></div>
        <div className="form-grid form-grid-4">
          <div className="field"><label className="field-label required">Man Hours</label><input type="number" step="0.5" min="0" value={form.manHours} onChange={e => upd("manHours", e.target.value)} /></div>
          <div className="field"><label className="field-label required">Actual Machine Hrs</label><input type="number" step="0.5" min="0" value={form.machineHours} onChange={e => upd("machineHours", e.target.value)} /></div>
          <div className="field"><label className="field-label required">Crew Size</label><input type="number" min="1" value={form.crewSize} onChange={e => upd("crewSize", e.target.value)} /></div>
          <div className="field"><label className="field-label required">Standard Parts/Hr</label><input type="number" min="0" value={form.stdPerHr} onChange={e => upd("stdPerHr", e.target.value)} /></div>
          <div className="field"><label className="field-label">Planned Machine Hrs (auto)</label><input value={plannedMachHrs} readOnly style={{ fontFamily: "var(--mono)", color: "var(--amber)" }} /></div>
          <div className="field"><label className="field-label">Man Hrs Check (Crew×Mach)</label><input value={manHrsCalc} readOnly style={{ fontFamily: "var(--mono)", color: "var(--blue)" }} /></div>
        </div>
        <div style={{ fontSize: 10, color: "var(--text3)", marginTop: 8, fontFamily: "var(--mono)" }}>Planned Machine Hrs = Planned ÷ Std Parts/Hr  |  Man Hours should = Crew × Actual Machine Hrs</div>
      </div>

      <div className="flex justify-between items-center">
        <div style={{ fontSize: 11, color: "var(--text3)", fontFamily: "var(--mono)" }}>⚠ SLA: Data entry must be completed by end of each shift</div>
        <div className="flex gap-2">
          <button className="btn btn-secondary" onClick={() => { setForm(f => ({ ...f, good: "", setup: "0", qc: "0", planned: "", manHours: "", machineHours: "", crewSize: "1", dtScheduled: "0", dtUnscheduled: "0", defectQty: "0", defectReason: "", dtSchReason: "", dtUnschReason: "" })); toast.warn("Form cleared."); }}>Clear</button>
          <button className="btn btn-primary" onClick={handleSave}>💾 Save Entry to JDE & SQL</button>
        </div>
      </div>
    </div>
  );
}

// ─── QC ENTRY SCREEN ──────────────────────────────────────────────────────────
function QCEntryScreen({ user, toast }) {
  const [partNo, setPartNo] = useState("");
  const [partValid, setPartValid] = useState(null);
  const [rateSchedule, setRateSchedule] = useState(null);
  const [defectQty, setDefectQty] = useState("");
  const [defectReason, setDefectReason] = useState("");
  const [checking, setChecking] = useState(false);

  const OPEN_SCHEDULES = { "TG-10245": { id: "RS-2026-012", good_recorded: 750, status: "Open" }, "TG-10388": { id: "RS-2026-009", good_recorded: 560, status: "Open" }, "TG-30045": { id: "RS-2026-015", good_recorded: 385, status: "Closed" } };

  const checkPart = () => {
    setChecking(true); setPartValid(null); setRateSchedule(null);
    setTimeout(() => {
      const p = MOCK_PARTS[partNo];
      if (!p) { setPartValid({ ok: false, msg: "Part # not found in JDE Item Master." }); setChecking(false); return; }
      const rs = OPEN_SCHEDULES[partNo];
      if (!rs) { setPartValid({ ok: false, msg: "No Rate Schedule found for this part." }); setChecking(false); return; }
      if (rs.status !== "Open") { setPartValid({ ok: false, msg: `Rate Schedule ${rs.id} is CLOSED. QC Entry cannot proceed.` }); setChecking(false); return; }
      setPartValid({ ok: true, desc: p.desc }); setRateSchedule(rs); setChecking(false);
    }, 800);
  };

  const handleSave = () => {
    if (!partValid?.ok || !rateSchedule) { toast.error("Part and Rate Schedule must be validated first."); return; }
    if (!defectQty || parseInt(defectQty) <= 0) { toast.error("Defect quantity must be greater than 0."); return; }
    if (parseInt(defectQty) > rateSchedule.good_recorded) { toast.error(`Defect qty (${defectQty}) exceeds good completions recorded (${rateSchedule.good_recorded}). QC Entry blocked.`); return; }
    if (!defectReason) { toast.error("Defect reason code is required."); return; }
    toast.success(`QC Entry saved. IS/IO transaction written to JDE. Rate Schedule: ${rateSchedule.id}`);
    setPartNo(""); setPartValid(null); setRateSchedule(null); setDefectQty(""); setDefectReason("");
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Quality Entry (QC Screen)</div>
        <div className="page-desc">Record post-production non-conformance defects. Requires an open JDE Rate Schedule and sufficient good completions.</div>
      </div>
      <div className="card">
        <div className="card-header"><div className="card-title">Step 1 — Validate Part & Rate Schedule</div></div>
        <div className="flex gap-3 items-center">
          <div className="field" style={{ flex: 1 }}>
            <label className="field-label required">Part Number</label>
            <input placeholder="e.g. TG-10245" value={partNo} onChange={e => { setPartNo(e.target.value.toUpperCase()); setPartValid(null); setRateSchedule(null); }} style={{ fontFamily: "var(--mono)" }} />
          </div>
          <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={checkPart} disabled={checking || !partNo}>{checking ? "Checking JDE..." : "Check JDE ↗"}</button>
        </div>
        {partValid && !partValid.ok && <div style={{ marginTop: 10, background: "var(--red-dim)", border: "1px solid var(--red)", borderRadius: "var(--radius)", padding: "10px 14px", fontSize: 12, color: "var(--red)" }}>✗ {partValid.msg}</div>}
        {rateSchedule && <div style={{ marginTop: 12, background: "var(--green-dim)", border: "1px solid var(--green)", borderRadius: "var(--radius)", padding: "14px", fontSize: 12 }}>
          <div className="flex justify-between" style={{ marginBottom: 8 }}>
            <span style={{ color: "var(--green)", fontWeight: 600 }}>✓ {partValid.desc}</span>
            <span className="badge badge-green">{rateSchedule.status}</span>
          </div>
          <div className="flex gap-4" style={{ fontFamily: "var(--mono)", fontSize: 11 }}>
            <span>Rate Schedule: <strong>{rateSchedule.id}</strong></span>
            <span>Good Recorded: <strong style={{ color: "var(--amber)" }}>{rateSchedule.good_recorded.toLocaleString()}</strong></span>
          </div>
        </div>}
      </div>

      {rateSchedule && <div className="card">
        <div className="card-header"><div className="card-title">Step 2 — Enter Defect Details</div></div>
        <div className="form-grid form-grid-2">
          <div className="field">
            <label className="field-label required">Defect Quantity</label>
            <input type="number" min="1" max={rateSchedule.good_recorded} value={defectQty} onChange={e => setDefectQty(e.target.value)} />
            <div style={{ fontSize: 10, color: "var(--text3)", marginTop: 4 }}>Max allowed: {rateSchedule.good_recorded} (good completions recorded)</div>
            {defectQty && parseInt(defectQty) > rateSchedule.good_recorded && <div style={{ fontSize: 11, color: "var(--red)" }}>⚠ Exceeds good completions — entry will be blocked</div>}
          </div>
          <div className="field">
            <label className="field-label required">Defect Reason Code</label>
            <select value={defectReason} onChange={e => setDefectReason(e.target.value)}>
              <option value="">— Select Reason —</option>{DEFECT_REASONS.map(r => <option key={r}>{r}</option>)}
            </select>
          </div>
        </div>
        <div style={{ marginTop: 14, background: "var(--bg3)", borderRadius: "var(--radius)", padding: 12, fontSize: 11, fontFamily: "var(--mono)", color: "var(--text3)" }}>
          Transactions: → IS (Inventory Scrap) written to JDE  |  IO (Scrap from Inventory) for manual adjustment
        </div>
        <div className="flex justify-end mt-3">
          <button className="btn btn-primary" onClick={handleSave}>💾 Save QC Entry</button>
        </div>
      </div>}

      {!rateSchedule && <div className="card" style={{ background: "var(--bg3)", border: "1px dashed var(--border2)" }}>
        <div style={{ textAlign: "center", padding: "32px 0", color: "var(--text3)" }}>
          <div style={{ fontSize: 28, marginBottom: 10 }}>🔬</div>
          <div style={{ fontSize: 13 }}>Validate a Part # first to proceed with Quality Entry</div>
          <div style={{ fontSize: 11, marginTop: 6 }}>System will check JDE for open Rate Schedule and recorded good completions</div>
        </div>
      </div>}
    </div>
  );
}

// ─── SHOP FLOOR MONITOR ───────────────────────────────────────────────────────
function SFMScreen() {
  const [branch, setBranch] = useState("All");
  const maxGood = Math.max(...SFM_DATA.weekTrend.map(d => d.good));

  const filtered = branch === "All" ? SFM_DATA.daily : SFM_DATA.daily.filter(r => r.branch === branch);
  const totalGood = filtered.reduce((a, r) => a + r.good, 0);
  const totalDefects = filtered.reduce((a, r) => a + r.defects, 0);
  const totalPlanned = filtered.reduce((a, r) => a + r.planned, 0);
  const overallEff = totalPlanned ? ((totalGood / totalPlanned) * 100).toFixed(1) : "0";

  return (
    <div>
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div><div className="page-title">Shop Floor Monitor (SFM)</div>
            <div className="page-desc">Daily Production Report — real-time visibility across branches</div></div>
          <div className="flex gap-2 items-center">
            <select value={branch} onChange={e => setBranch(e.target.value)} style={{ width: "auto", padding: "6px 10px", fontSize: 12 }}>
              <option value="All">All Branches</option><option>TGNA-OH</option><option>TGNA-GA</option>
            </select>
            <span className="badge badge-green">● LIVE</span>
          </div>
        </div>
      </div>

      <div className="stat-grid">
        {[
          { label: "Total Good Parts", value: totalGood.toLocaleString(), sub: "Today", up: true },
          { label: "Total Defects", value: totalDefects.toLocaleString(), sub: `${((totalDefects / (totalGood + totalDefects)) * 100).toFixed(1)}% defect rate`, up: false },
          { label: "Overall Efficiency", value: overallEff + "%", sub: "vs planned", up: parseFloat(overallEff) >= 90 },
          { label: "Active Entries", value: SESSION_ENTRIES.length.toString(), sub: "This session", up: true },
        ].map(s => <div className="stat-card" key={s.label}>
          <div className="stat-value">{s.value}</div>
          <div className="stat-label">{s.label}</div>
          <div className={`stat-change ${s.up ? "stat-up" : "stat-down"}`}>{s.up ? "▲" : "▼"} {s.sub}</div>
        </div>)}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-header"><div className="card-title">Week Trend — Good Parts</div></div>
          <div className="bar-chart">
            {SFM_DATA.weekTrend.map(d => <div className="bar-col" key={d.day}>
              <div className="bar" style={{ height: `${(d.good / maxGood) * 80}px`, background: "linear-gradient(to top, var(--amber-dim), var(--amber))" }} />
              <div className="bar-label">{d.day}</div>
            </div>)}
          </div>
          <div style={{ fontSize: 10, color: "var(--text3)", fontFamily: "var(--mono)", marginTop: 4 }}>Good Parts Produced — Last 6 Days</div>
        </div>
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-header"><div className="card-title">Defect Rate by Day</div></div>
          <div className="bar-chart">
            {SFM_DATA.weekTrend.map(d => <div className="bar-col" key={d.day}>
              <div className="bar" style={{ height: `${(d.defects / 80) * 80}px`, background: "linear-gradient(to top, #b91c1c, var(--red))" }} />
              <div className="bar-label">{d.day}</div>
            </div>)}
          </div>
          <div style={{ fontSize: 10, color: "var(--text3)", fontFamily: "var(--mono)", marginTop: 4 }}>Defects Recorded — Last 6 Days</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><div className="card-title">Daily Production Report — Part Level</div><div className="card-subtitle">Branch: {branch}</div></div>
        <div className="table-wrap">
          <table>
            <thead><tr>
              <th>Branch</th><th>Part #</th><th>Planned</th><th>Good</th><th>Defects</th><th>Setup</th><th>QC</th><th>Efficiency</th><th>JDE Status</th>
            </tr></thead>
            <tbody>{filtered.map((r, i) => {
              const eff = parseFloat(r.efficiency);
              return <tr key={i}>
                <td><span className="mono text-muted" style={{ fontSize: 11 }}>{r.branch}</span></td>
                <td><span className="mono text-amber">{r.part}</span></td>
                <td className="mono">{r.planned.toLocaleString()}</td>
                <td className="mono text-green">{r.good.toLocaleString()}</td>
                <td className="mono text-red">{r.defects}</td>
                <td className="mono text-muted">{r.setup}</td>
                <td className="mono text-muted">{Math.floor(r.defects / 2)}</td>
                <td><span className={`badge ${eff >= 95 ? "badge-green" : eff >= 90 ? "badge-amber" : "badge-red"}`}>{r.efficiency}</span></td>
                <td><span className="badge badge-blue">IC/IM/IS ✓</span></td>
              </tr>;
            })}</tbody>
          </table>
        </div>
        <div style={{ fontSize: 10, color: "var(--text3)", fontFamily: "var(--mono)", marginTop: 10, padding: "8px 0", borderTop: "1px solid var(--border)" }}>
          IC = Inventory Completion (Good Parts)  |  IM = Inventory Move (BOM Child Parts)  |  IS = Inventory Scrap (Defects + Setup + QC)
        </div>
      </div>
    </div>
  );
}

// ─── MOLD MAINTENANCE ─────────────────────────────────────────────────────────
function MoldScreen({ toast }) {
  const [molds, setMolds] = useState(MOLDS_DATA);
  const [showAdd, setShowAdd] = useState(false);
  const [showClean, setShowClean] = useState(null);
  const [newMold, setNewMold] = useState({ id: "", part: "TG-10245", status: "Active" });

  const retireMold = (id) => { setMolds(m => m.map(x => x.id === id ? { ...x, status: "Retired" } : x)); toast.warn(`Mold ${id} retired. It will no longer appear in Data Entry.`); };
  const recordClean = (id) => { setMolds(m => m.map(x => x.id === id ? { ...x, last_clean: new Date().toISOString().split("T")[0], clean_by: "Current User" } : x)); setShowClean(null); toast.success(`Face cleaning recorded for ${id}.`); };
  const addMold = () => {
    if (!newMold.id) { toast.error("Mold ID is required."); return; }
    if (molds.find(m => m.id === newMold.id)) { toast.error("Mold ID already exists."); return; }
    setMolds(m => [...m, { ...newMold, last_clean: "—", clean_by: "—" }]);
    setShowAdd(false); setNewMold({ id: "", part: "TG-10245", status: "Active" });
    toast.success(`Mold ${newMold.id} added successfully.`);
  };

  return (
    <div>
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div><div className="page-title">Mold Maintenance</div>
            <div className="page-desc">Manage mold lifecycle: Add → Active → Retired. Record face cleaning events.</div></div>
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}>+ Add Mold</button>
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <thead><tr><th>Mold ID</th><th>Part #</th><th>Status</th><th>Last Face Clean</th><th>Cleaned By</th><th>Actions</th></tr></thead>
          <tbody>{molds.map(m => <tr key={m.id}>
            <td><span className="mono text-amber">{m.id}</span></td>
            <td><span className="mono" style={{ fontSize: 11 }}>{m.part}</span></td>
            <td><span className={`badge ${m.status === "Active" ? "badge-green" : "badge-gray"}`}>{m.status}</span></td>
            <td className="mono text-muted" style={{ fontSize: 11 }}>{m.last_clean}</td>
            <td className="text-muted" style={{ fontSize: 11 }}>{m.clean_by}</td>
            <td><div className="flex gap-2">
              <button className="btn btn-sm btn-secondary" onClick={() => setShowClean(m.id)} disabled={m.status === "Retired"}>🧹 Record Clean</button>
              {m.status === "Active" && <button className="btn btn-sm btn-danger" onClick={() => retireMold(m.id)}>Retire</button>}
            </div></td>
          </tr>)}</tbody>
        </table>
      </div>

      <div style={{ marginTop: 12, fontSize: 11, color: "var(--text3)", fontFamily: "var(--mono)", padding: "10px 14px", background: "var(--bg3)", borderRadius: "var(--radius)", border: "1px solid var(--border)" }}>
        ℹ Retired molds are kept in the database for historical records. They will NOT appear in the Data Entry screen mold selection dropdown. Records are never hard-deleted.
      </div>

      {showAdd && <div className="modal-overlay">
        <div className="modal">
          <div className="modal-header"><div className="modal-title">Add New Mold</div><button className="modal-close" onClick={() => setShowAdd(false)}>✕</button></div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div className="field"><label className="field-label required">Mold ID</label><input placeholder="e.g. MLD-E501" value={newMold.id} onChange={e => setNewMold(n => ({ ...n, id: e.target.value.toUpperCase() }))} style={{ fontFamily: "var(--mono)" }} /></div>
            <div className="field"><label className="field-label required">Associated Part #</label>
              <select value={newMold.part} onChange={e => setNewMold(n => ({ ...n, part: e.target.value }))}>
                {Object.keys(MOCK_PARTS).map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div className="field"><label className="field-label">Initial Status</label>
              <select value={newMold.status} onChange={e => setNewMold(n => ({ ...n, status: e.target.value }))}>
                <option>Active</option><option>Retired</option>
              </select>
            </div>
            <div className="flex gap-2 justify-between mt-2">
              <button className="btn btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={addMold}>Add Mold</button>
            </div>
          </div>
        </div>
      </div>}

      {showClean && <div className="modal-overlay">
        <div className="modal">
          <div className="modal-header"><div className="modal-title">Record Face Cleaning — {showClean}</div><button className="modal-close" onClick={() => setShowClean(null)}>✕</button></div>
          <div style={{ fontSize: 13, color: "var(--text2)", marginBottom: 16 }}>This will record a face cleaning event with the current timestamp and your User ID.</div>
          <div style={{ background: "var(--bg3)", borderRadius: "var(--radius)", padding: 12, fontFamily: "var(--mono)", fontSize: 12, marginBottom: 16 }}>
            <div>Date/Time: <span className="text-amber">{new Date().toLocaleString()}</span></div>
            <div style={{ marginTop: 4 }}>Performed By: <span className="text-amber">Current User</span></div>
          </div>
          <div className="flex gap-2 justify-between">
            <button className="btn btn-secondary" onClick={() => setShowClean(null)}>Cancel</button>
            <button className="btn btn-success" onClick={() => recordClean(showClean)}>🧹 Confirm Face Clean</button>
          </div>
        </div>
      </div>}
    </div>
  );
}

// ─── ADMIN TOOLS ──────────────────────────────────────────────────────────────
function AdminScreen({ user, toast, appEnabled, setAppEnabled }) {
  const [tab, setTab] = useState("reasons");
  const [reasons, setReasons] = useState([...DT_REASONS.scheduled.map(r => ({ type: "Scheduled DT", reason: r })), ...DT_REASONS.unscheduled.map(r => ({ type: "Unscheduled DT", reason: r })), ...DEFECT_REASONS.map(r => ({ type: "Defect", reason: r }))]);
  const [newReason, setNewReason] = useState({ type: "Scheduled DT", reason: "" });
  const [pwPrompt, setPwPrompt] = useState(true);
  const [pw, setPw] = useState("");
  const [pwError, setPwError] = useState("");

  if (pwPrompt) return (
    <div>
      <div className="page-header"><div className="page-title">Admin Tools</div><div className="page-desc">Password protected — additional authentication required.</div></div>
      <div className="card" style={{ maxWidth: 400 }}>
        <div className="card-header"><div className="card-title">🔒 Admin Authentication</div></div>
        <div className="field"><label className="field-label required">Admin Password</label><input type="password" placeholder="Enter admin password" value={pw} onChange={e => setPw(e.target.value)} onKeyDown={e => e.key === "Enter" && (pw === "admin123" ? (setPwPrompt(false), setPwError("")) : setPwError("Incorrect password."))} /></div>
        {pwError && <div style={{ fontSize: 11, color: "var(--red)", marginTop: 6 }}>✗ {pwError}</div>}
        <div style={{ fontSize: 10, color: "var(--text3)", marginTop: 8, fontFamily: "var(--mono)" }}>Demo password: admin123</div>
        <button className="btn btn-primary mt-3" onClick={() => pw === "admin123" ? (setPwPrompt(false), setPwError("")) : setPwError("Incorrect password.")}>Authenticate</button>
      </div>
    </div>
  );

  const isController = user.role === "APP_CONTROLLER";

  return (
    <div>
      <div className="page-header"><div className="page-title">Admin Tools</div><div className="page-desc">Branch administration — Reason Codes, Machine IDs, Application Control</div></div>
      <div className="flex gap-2" style={{ marginBottom: 16, borderBottom: "1px solid var(--border)", paddingBottom: 12 }}>
        {[["reasons", "📋 Reason Codes"], ["machines", "🔩 Machine IDs"], ["controller", "🔴 App Controller"], ["parts", "🔍 Part # Lookup"], ["session", "📁 Session Entries"]].map(([k, l]) =>
          <button key={k} className={`btn btn-sm ${tab === k ? "btn-primary" : "btn-secondary"}`} onClick={() => setTab(k)}>{l}</button>
        )}
      </div>

      {tab === "reasons" && <div className="card">
        <div className="card-header"><div className="card-title">Reason Code Management</div><div className="card-subtitle">Dept-specific · Type-specific</div></div>
        <div className="table-wrap" style={{ marginBottom: 16 }}>
          <table><thead><tr><th>Type</th><th>Reason Code</th><th>Action</th></tr></thead>
            <tbody>{reasons.map((r, i) => <tr key={i}><td><span className={`badge ${r.type.includes("Scheduled") ? "badge-amber" : r.type === "Defect" ? "badge-red" : "badge-blue"}`}>{r.type}</span></td>
              <td>{r.reason}</td>
              <td><button className="btn btn-sm btn-danger" onClick={() => { setReasons(reasons.filter((_, j) => j !== i)); toast.warn(`Reason code removed: ${r.reason}`); }}>Remove</button></td></tr>)}
            </tbody>
          </table>
        </div>
        <div className="flex gap-2">
          <select value={newReason.type} onChange={e => setNewReason(n => ({ ...n, type: e.target.value }))} style={{ width: "auto" }}>
            <option>Scheduled DT</option><option>Unscheduled DT</option><option>Defect</option>
          </select>
          <input placeholder="Enter new reason code..." value={newReason.reason} onChange={e => setNewReason(n => ({ ...n, reason: e.target.value }))} style={{ flex: 1 }} />
          <button className="btn btn-primary" onClick={() => { if (!newReason.reason) return; setReasons([...reasons, { ...newReason }]); setNewReason(n => ({ ...n, reason: "" })); toast.success("Reason code added."); }}>+ Add</button>
        </div>
        <div style={{ fontSize: 10, color: "var(--text3)", fontFamily: "var(--mono)", marginTop: 10 }}>⚠ Keep reason codes minimal — too many codes make reports meaningless. GM must approve admin role assignments.</div>
      </div>}

      {tab === "machines" && <div className="card">
        <div className="card-header"><div className="card-title">Machine ID Management</div><div className="card-subtitle">Per-branch registry</div></div>
        <div className="table-wrap">
          <table><thead><tr><th>Machine ID</th><th>Branch</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>{MACHINES.map(m => <tr key={m}><td className="mono text-amber">{m}</td><td className="mono text-muted" style={{ fontSize: 11 }}>{user.branch}</td><td><span className="badge badge-green">Active</span></td>
              <td><button className="btn btn-sm btn-danger" onClick={() => toast.warn(`Machine ${m} retire action logged.`)}>Retire</button></td></tr>)}
            </tbody>
          </table>
        </div>
        <div style={{ marginTop: 12, fontSize: 10, color: "var(--text3)", fontFamily: "var(--mono)" }}>Machine IDs are per-branch. Use Add/Edit/Retire lifecycle — never hard-delete records.</div>
      </div>}

      {tab === "controller" && <div>
        {isController ? <div>
          <div className={appEnabled ? "enabled-banner" : "controller-banner"}>
            <span style={{ fontSize: 22 }}>{appEnabled ? "🟢" : "🔴"}</span>
            <div>
              <strong>APPLICATION IS {appEnabled ? "ENABLED" : "DISABLED"}</strong><br />
              <span style={{ fontSize: 11 }}>{appEnabled ? "All users can currently enter data." : "All active sessions are blocked from saving entries."}</span>
            </div>
          </div>
          <div className="card">
            <div className="card-header"><div className="card-title">Application Controller</div><div className="card-subtitle">Max 2 per company · Propagates to all active sessions immediately</div></div>
            <div style={{ fontSize: 13, color: "var(--text2)", marginBottom: 16 }}>Toggling this will {appEnabled ? "DISABLE" : "ENABLE"} data entry for ALL users across all active sessions. Use this during maintenance, analysis, or audit windows.</div>
            <button className={`btn ${appEnabled ? "btn-danger" : "btn-success"}`} style={{ padding: "12px 24px", fontSize: 13 }} onClick={() => { setAppEnabled(!appEnabled); toast[appEnabled ? "error" : "success"](`Application ${appEnabled ? "DISABLED" : "ENABLED"} — all sessions updated.`); }}>
              {appEnabled ? "🔴 Disable Application" : "🟢 Enable Application"}
            </button>
          </div>
        </div> : <div className="card"><div style={{ textAlign: "center", padding: "32px 0", color: "var(--text3)" }}><div style={{ fontSize: 28, marginBottom: 10 }}>🔒</div><div>Application Controller role required.</div><div style={{ fontSize: 11, marginTop: 6 }}>Only 2 designated users per company hold this role.</div></div></div>}
      </div>}

      {tab === "parts" && <div className="card">
        <div className="card-header"><div className="card-title">Part # Lookup</div><div className="card-subtitle">Validate against JDE Item Master</div></div>
        <div className="table-wrap">
          <table><thead><tr><th>Part #</th><th>Description</th><th>Type</th><th>Department</th><th>Std Parts/Hr</th><th>BOM Items</th></tr></thead>
            <tbody>{Object.entries(MOCK_PARTS).map(([pn, p]) => <tr key={pn}>
              <td className="mono text-amber">{pn}</td><td style={{ fontSize: 12 }}>{p.desc}</td>
              <td><span className={`badge ${p.type === "Manufactured" ? "badge-blue" : p.type === "Stock" ? "badge-green" : "badge-amber"}`}>{p.type}</span></td>
              <td className="text-muted" style={{ fontSize: 11 }}>{p.dept}</td>
              <td className="mono">{p.std_per_hr}</td>
              <td><span className="badge badge-gray">{p.bom.length} items</span></td>
            </tr>)}
            </tbody>
          </table>
        </div>
      </div>}

      {tab === "session" && <div className="card">
        <div className="card-header"><div className="card-title">Session Entries</div><div className="card-subtitle">All entries recorded in this session</div></div>
        <div className="table-wrap">
          <table><thead><tr><th>Time</th><th>Part #</th><th>Machine</th><th>Mold</th><th>Good Qty</th><th>Defects</th><th>Shift</th><th>JDE</th></tr></thead>
            <tbody>{SESSION_ENTRIES.map((e, i) => <tr key={i}>
              <td className="mono text-muted" style={{ fontSize: 11 }}>{e.time}</td>
              <td className="mono text-amber">{e.part}</td>
              <td className="mono" style={{ fontSize: 11 }}>{e.machine}</td>
              <td className="mono" style={{ fontSize: 11 }}>{e.mold}</td>
              <td className="mono text-green">{e.good.toLocaleString()}</td>
              <td className="mono text-red">{e.defects}</td>
              <td><span className="badge badge-blue">{e.shift}</span></td>
              <td><span className="badge badge-green">IC/IM ✓</span></td>
            </tr>)}
            </tbody>
          </table>
        </div>
      </div>}
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [screen, setScreen] = useState("data_entry");
  const [appEnabled, setAppEnabled] = useState(true);
  const toast = useToast();

  const NAV = [
    { section: "Production" },
    { id: "data_entry", icon: "⌨", label: "Data Entry" },
    { id: "qc_entry", icon: "🔬", label: "Quality Entry" },
    { section: "Reporting" },
    { id: "sfm", icon: "📊", label: "Shop Floor Monitor" },
    { section: "Management" },
    { id: "molds", icon: "🔩", label: "Mold Maintenance" },
    { id: "admin", icon: "⚙", label: "Admin Tools" },
  ];

  if (!user) return (
    <>
      <style>{css}</style>
      <Toasts toasts={toast.toasts} />
      <LoginScreen onLogin={(u) => { setUser(u); toast.success(`Welcome ${u.name} — ${u.role} · ${u.branch}`); }} />
    </>
  );

  const renderScreen = () => {
    if (screen === "data_entry") return <DataEntryScreen user={user} appEnabled={appEnabled} toast={toast} />;
    if (screen === "qc_entry") return <QCEntryScreen user={user} toast={toast} />;
    if (screen === "sfm") return <SFMScreen />;
    if (screen === "molds") return <MoldScreen toast={toast} />;
    if (screen === "admin") return <AdminScreen user={user} toast={toast} appEnabled={appEnabled} setAppEnabled={setAppEnabled} />;
  };

  return (
    <>
      <style>{css}</style>
      <Toasts toasts={toast.toasts} />
      <div className="app">
        {/* TOPBAR */}
        <div className="topbar">
          <div className="topbar-left">
            <div>
              <div className="logo">SFDE</div>
              <div className="logo-sub">SHOP FLOOR DATA ENTRY</div>
            </div>
            <div style={{ width: 1, height: 28, background: "var(--border)", margin: "0 8px" }} />
            <div style={{ fontSize: 11, color: "var(--text3)" }}>Toyoda Gosei North America  |  <span style={{ color: "var(--amber)" }}>{user.branch}</span></div>
          </div>
          <div className="topbar-right">
            {!appEnabled && <span className="badge badge-red">● APP DISABLED</span>}
            <Clock />
            <div style={{ fontSize: 11, color: "var(--text2)", fontFamily: "var(--mono)", background: "var(--bg3)", padding: "4px 10px", borderRadius: "var(--radius)", border: "1px solid var(--border)" }}>
              {user.empId} · <span style={{ color: "var(--amber)" }}>{user.name}</span> · {user.role}
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => setUser(null)}>Logout</button>
          </div>
        </div>

        <div className="main-layout">
          {/* SIDEBAR */}
          <div className="sidebar">
            {NAV.map((item, i) => {
              if (item.section) return <div key={i} className="nav-section">{item.section}</div>;
              return <div key={item.id} className={`nav-item ${screen === item.id ? "active" : ""}`} onClick={() => setScreen(item.id)}>
                <span className="nav-icon">{item.icon}</span>{item.label}
                {item.id === "data_entry" && !appEnabled && <span style={{ marginLeft: "auto", fontSize: 10 }}>🔴</span>}
              </div>;
            })}
            <div style={{ marginTop: "auto", padding: "16px", borderTop: "1px solid var(--border)" }}>
              <div style={{ fontSize: 10, fontFamily: "var(--mono)", color: "var(--text3)" }}>
                <div>● JDE: Connected</div>
                <div style={{ marginTop: 3 }}>● SQL DB: Connected</div>
                <div style={{ marginTop: 3, color: appEnabled ? "var(--green)" : "var(--red)" }}>● App: {appEnabled ? "Enabled" : "Disabled"}</div>
                <div style={{ marginTop: 8, color: "var(--border2)" }}>SFDE v4.0 · March 2026</div>
              </div>
            </div>
          </div>

          {/* CONTENT */}
          <div className="content">{renderScreen()}</div>
        </div>

        {/* STATUS BAR */}
        <div className="status-bar">
          <div className="status-item"><div className="status-dot" /><span>JDE EnterpriseOne: CONNECTED</span></div>
          <div className="status-item"><div className="status-dot" /><span>Shop Floor SQL DB: CONNECTED</span></div>
          <div className="status-item"><span>User: {user.name}</span></div>
          <div className="status-item"><span>Branch: {user.branch}</span></div>
          <div className="status-item"><span>Dept: {user.dept}</span></div>
          <div className="status-item" style={{ marginLeft: "auto" }}><span>TGNA · SFDE System · <Clock /></span></div>
        </div>
      </div>
    </>
  );
}

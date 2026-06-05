/* Add Company — creation flow modal.
   Collects company details, owner, and initial module setup, then drops a
   fully-formed company (status: Onboarding) into the list. */
const { MODULES: M_MODS, I: M_I } = window.AFO;

const NICHES  = ["Agro", "Retail", "Logistics", "Manufacturing", "Hospitality", "Other"];
const REGIONS = ["South America · BR", "South America · AR", "North America · US", "North America · CA", "Europe · DE", "Europe · ES", "Asia-Pacific"];
const PLANS   = ["Growth", "Scale", "Enterprise"];

function codeFor(name) {
  const a = (name.replace(/[^a-zA-Z]/g, "").toUpperCase() + "XXX").slice(0, 3);
  return `${a}-${Math.floor(1000 + Math.random() * 8999)}`;
}

function AddCompanyModal({ onClose, onCreate }) {
  const [name, setName] = React.useState("");
  const [niche, setNiche] = React.useState("Agro");
  const [email, setEmail] = React.useState("");
  const [region, setRegion] = React.useState(REGIONS[0]);
  const [plan, setPlan] = React.useState("Growth");
  const [mods, setMods] = React.useState(["Dashboard"]);
  const [tried, setTried] = React.useState(false);

  const nameOk = name.trim().length > 1;
  const emailOk = email.trim() === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const valid = nameOk && emailOk;

  function toggleMod(m) {
    setMods((s) => (s.includes(m) ? s.filter((x) => x !== m) : [...s, m]));
  }

  function submit() {
    setTried(true);
    if (!valid) return;
    const owner = email.trim() || null;
    const company = {
      id: "c" + Date.now(),
      name: name.trim(),
      niche,
      status: "onboarding",
      owner,
      ownerState: owner ? "invited" : "unassigned",
      importState: "queued",
      importLabel: "Queued",
      lastImport: "—",
      modules: mods.length,
      modulesSel: mods,
      created: "Jun 5, 2026",
      checklist: owner ? 2 : 1,
      region, plan,
      source: "CSV upload",
      records: "—",
      company: codeFor(name),
    };
    onCreate(company);
  }

  React.useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal afo" role="dialog" aria-modal="true">
        <div className="modal-head">
          <div>
            <div className="modal-title">Add company</div>
            <div className="modal-sub">Create a new company on the platform. It starts in <strong>Onboarding</strong> until the owner is active and data is imported.</div>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close"><ShIcon html={M_I.x("currentColor", 18)} /></button>
        </div>

        <div className="modal-body">
          <div className="field">
            <label>Company name <span className="req">*</span></label>
            <input className={"input" + (tried && !nameOk ? " invalid" : "")} value={name} autoFocus
              onChange={(e) => setName(e.target.value)} placeholder="e.g. Verde Harvest Co." />
            {tried && !nameOk && <span className="field-err">Enter a company name.</span>}
          </div>

          <div className="field-row">
            <div className="field">
              <label>Niche</label>
              <select className="select" value={niche} onChange={(e) => setNiche(e.target.value)}>
                {NICHES.map((n) => <option key={n}>{n}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Region</label>
              <select className="select" value={region} onChange={(e) => setRegion(e.target.value)}>
                {REGIONS.map((r) => <option key={r}>{r}</option>)}
              </select>
            </div>
          </div>

          <div className="field">
            <label>Owner email</label>
            <input className={"input" + (tried && !emailOk ? " invalid" : "")} value={email} type="email"
              onChange={(e) => setEmail(e.target.value)} placeholder="owner@company.com" />
            {tried && !emailOk
              ? <span className="field-err">Enter a valid email address.</span>
              : <span className="field-hint">Optional — leave blank to assign and invite later.</span>}
          </div>

          <div className="field">
            <label>Plan</label>
            <select className="select" value={plan} onChange={(e) => setPlan(e.target.value)} style={{ maxWidth: 220 }}>
              {PLANS.map((p) => <option key={p}>{p}</option>)}
            </select>
          </div>

          <div className="field">
            <div className="section-label" style={{ marginBottom: 2 }}>Enable modules · {mods.length}/8</div>
            <span className="field-hint" style={{ marginBottom: 4 }}>Pick the finance modules to switch on for this workspace.</span>
            <div className="chip-group">
              {M_MODS.map((m) => (
                <span key={m} className={"chip" + (mods.includes(m) ? " on" : "")} onClick={() => toggleMod(m)}>
                  {mods.includes(m) && <ShIcon html={M_I.check("var(--green-ink)", 12)} />}{m}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="modal-foot">
          <span className="field-hint">A setup checklist is created automatically.</span>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary btn-sm" onClick={submit} style={{ opacity: tried && !valid ? .6 : 1 }}>
              <ShIcon html={M_I.plus("#fff", 15)} /> Create company
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
window.AddCompanyModal = AddCompanyModal;

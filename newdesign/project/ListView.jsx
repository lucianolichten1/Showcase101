/* Interactive Companies list — card grid with live search + status filter. */
const { STATUS_META: L_S, IMPORT_META: L_IMP, OWNER_META: L_OWN, I: L_I } = window.AFO;

function Ring({ done, total }) {
  const r = 9, c = 2 * Math.PI * r, pct = done / total;
  return (
    <span style={{ width: 24, height: 24, flex: "none", display: "inline-block" }}>
      <svg width="24" height="24" viewBox="0 0 24 24" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="12" cy="12" r={r} fill="none" stroke="var(--sunken)" strokeWidth="3" />
        <circle cx="12" cy="12" r={r} fill="none" stroke={done === total ? "var(--green-600)" : "var(--amber)"} strokeWidth="3"
          strokeDasharray={c} strokeDashoffset={c * (1 - pct)} strokeLinecap="round" />
      </svg>
    </span>
  );
}
window.Ring = Ring;

function LRow({ label, children }) {
  return (
    <div className="fact-row">
      <span className="lbl">{label}</span>
      <div className="val">{children}</div>
    </div>
  );
}

function LCard({ c, onOpen, justAdded }) {
  const s = L_S[c.status], imp = L_IMP[c.importState], o = L_OWN[c.ownerState];
  return (
    <div className={"co-card" + (justAdded ? " justadded" : "")} onClick={() => onOpen(c.id)}>
      <div className="co-head">
        <div className="co-namewrap">
          <div className="co-name" title={c.name}>{c.name}</div>
          <span className="tag">{c.niche}</span>
        </div>
        <span className={"pill " + s.tone} style={{ flex: "none" }}><span className={"dot " + s.tone}></span>{s.label}</span>
      </div>

      <div className="co-facts">
        <LRow label="Owner">
          {c.owner
            ? <span className="mono" title={c.owner} style={{ fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>{c.owner}</span>
            : <span style={{ fontSize: 13, color: "var(--ink-3)", fontStyle: "italic" }}>Not assigned</span>}
        </LRow>
        <LRow label="Data import">
          <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 13, fontWeight: 500 }}>
            <span className={"dot " + imp.tone}></span>{c.importLabel}
          </span>
        </LRow>
        <LRow label="Onboarding">
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <Ring done={c.checklist} total={5} />
            <span className="mono" style={{ fontSize: 12.5, color: "var(--ink-2)" }}>{c.checklist}/5</span>
          </span>
        </LRow>
        <LRow label="Modules">
          <span className="mono" style={{ fontSize: 12.5, color: "var(--ink-2)" }}>{c.modules} <span style={{ color: "var(--ink-4)" }}>/ 8</span></span>
        </LRow>
      </div>

      <div className="co-actions" onClick={(e) => e.stopPropagation()}>
        <button className="btn btn-primary btn-sm" style={{ flex: 1, justifyContent: "center" }} onClick={() => onOpen(c.id)}>
          View details <ShIcon html={L_I.arrow("#fff", 14)} />
        </button>
        <button className="btn btn-ghost btn-sm" style={{ padding: "7px 11px" }} title="Open workspace"><ShIcon html={L_I.ext("var(--ink-2)", 15)} /></button>
      </div>
    </div>
  );
}

function ListView({ companies, onOpen, onAdd, justAddedId }) {
  const [q, setQ] = React.useState("");
  const [filter, setFilter] = React.useState("All");
  const filters = ["All", "Onboarding", "Active", "Paused"];

  const list = companies.filter((c) => {
    const matchF = filter === "All" || c.status === filter.toLowerCase();
    const t = q.trim().toLowerCase();
    const matchQ = !t || c.name.toLowerCase().includes(t) || c.niche.toLowerCase().includes(t) || (c.owner || "").toLowerCase().includes(t);
    return matchF && matchQ;
  });

  return (
    <React.Fragment>
      <div className="page-head">
        <div>
          <div className="page-title">Companies</div>
          <p className="page-sub">Manage every company on the platform — onboarding, owner access, modules and data migration, all in one place.</p>
        </div>
        <button className="btn btn-primary" onClick={onAdd}><ShIcon html={L_I.plus("#fff", 16)} /> Add Company</button>
      </div>

      <div className="toolbar">
        <div className="search">
          <ShIcon html={L_I.search("var(--ink-4)", 17)} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search companies, owners, niches…" />
        </div>
        <div className="seg">
          {filters.map((f) => (
            <button key={f} className={filter === f ? "on" : ""} onClick={() => setFilter(f)}>{f}</button>
          ))}
        </div>
        <span style={{ marginLeft: "auto", fontSize: 13, color: "var(--ink-3)" }} className="mono">{list.length} {list.length === 1 ? "company" : "companies"}</span>
      </div>

      {list.length ? (
        <div className="card-grid" style={{ marginTop: 24 }}>
          {list.map((c) => <LCard key={c.id} c={c} onOpen={onOpen} justAdded={c.id === justAddedId} />)}
        </div>
      ) : (
        <div style={{ marginTop: 60, textAlign: "center", color: "var(--ink-3)", fontSize: 14 }}>No companies match your search.</div>
      )}
    </React.Fragment>
  );
}
window.ListView = ListView;

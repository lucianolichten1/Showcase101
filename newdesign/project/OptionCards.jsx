/* Direction B — Company Cards.
   Each company is a calm card / mini command-center preview. More
   breathing room, owner + import + onboarding progress visible at a glance.
   Matches the card/grid lean; great when company count is small. */
const { COMPANIES: B_CO, STATUS_META: B_S, IMPORT_META: B_IMP, OWNER_META: B_OWN, I: B_I } = window.AFO;

function ChecklistRing({ done, total }) {
  const r = 9, c = 2 * Math.PI * r, pct = done / total;
  return (
    <span style={{ position: "relative", width: 24, height: 24, flex: "none" }}>
      <svg width="24" height="24" viewBox="0 0 24 24" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="12" cy="12" r={r} fill="none" stroke="var(--sunken)" strokeWidth="3" />
        <circle cx="12" cy="12" r={r} fill="none" stroke={done === total ? "var(--green-600)" : "var(--amber)"} strokeWidth="3"
          strokeDasharray={c} strokeDashoffset={c * (1 - pct)} strokeLinecap="round" />
      </svg>
    </span>
  );
}

function CompanyCard({ c }) {
  const s = B_S[c.status], imp = B_IMP[c.importState], o = B_OWN[c.ownerState];
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--radius)", boxShadow: "var(--shadow-sm)", padding: 20, display: "flex", flexDirection: "column", gap: 16 }}
         onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "var(--shadow-md)"; e.currentTarget.style.borderColor = "var(--line-2)"; }}
         onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "var(--shadow-sm)"; e.currentTarget.style.borderColor = "var(--line)"; }}>
      {/* head */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: "-0.02em" }}>{c.name}</div>
          <span className="tag" style={{ marginTop: 8 }}>{c.niche}</span>
        </div>
        <span className={"pill " + s.tone}><span className={"dot " + s.tone}></span>{s.label}</span>
      </div>

      {/* facts */}
      <div style={{ display: "flex", flexDirection: "column", gap: 11, paddingTop: 4, borderTop: "1px solid var(--line)" }}>
        <Row label="Owner">
          {c.owner
            ? <span className="mono" title={c.owner} style={{ fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>{c.owner}</span>
            : <span style={{ fontSize: 13, color: "var(--ink-3)", fontStyle: "italic" }}>Not assigned</span>}
        </Row>
        <Row label="Data import">
          <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 13, fontWeight: 500 }}>
            <span className={"dot " + imp.tone}></span>{c.importLabel}
          </span>
        </Row>
        <Row label="Onboarding">
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <ChecklistRing done={c.checklist} total={5} />
            <span className="mono" style={{ fontSize: 12.5, color: "var(--ink-2)" }}>{c.checklist}/5</span>
          </span>
        </Row>
        <Row label="Modules">
          <span className="mono" style={{ fontSize: 12.5, color: "var(--ink-2)" }}>{c.modules} <span style={{ color: "var(--ink-4)" }}>/ 8</span></span>
        </Row>
      </div>

      {/* actions */}
      <div style={{ display: "flex", gap: 9, marginTop: 2 }}>
        <button className="btn btn-primary btn-sm" style={{ flex: 1, justifyContent: "center" }}>View details <Icon html={B_I.arrow("#fff", 14)} style={{ display: "flex" }} /></button>
        <button className="btn btn-ghost btn-sm" style={{ padding: "7px 11px" }}><Icon html={B_I.ext("var(--ink-2)", 15)} style={{ display: "flex" }} /></button>
      </div>
    </div>
  );
}

function Row({ label, children }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14 }}>
      <span style={{ fontSize: 12.5, color: "var(--ink-3)", whiteSpace: "nowrap", flex: "none" }}>{label}</span>
      <div style={{ minWidth: 0, textAlign: "right", whiteSpace: "nowrap" }}>{children}</div>
    </div>
  );
}

function OptionCards() {
  return (
    <Shell>
      <PageHead
        title="Companies"
        sub="Manage every company on the platform — onboarding, owner access, modules and data migration, all in one place."
      />
      <Toolbar />
      <div style={{ marginTop: 24, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18 }}>
        {B_CO.map((c) => <CompanyCard key={c.id} c={c} />)}
      </div>
    </Shell>
  );
}
window.OptionCards = OptionCards;

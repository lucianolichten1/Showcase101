/* Direction C — Lifecycle Board.
   Companies grouped into columns by lifecycle stage (Onboarding · Active ·
   Paused). Turns the list into a pipeline so onboarding progress is the
   organizing principle — the most "command-center" feel of the three. */
const { COMPANIES: C_CO, STATUS_META: C_S, IMPORT_META: C_IMP, OWNER_META: C_OWN, I: C_I } = window.AFO;

function BoardCard({ c }) {
  const imp = C_IMP[c.importState], o = C_OWN[c.ownerState];
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--radius-sm)", padding: 15, display: "flex", flexDirection: "column", gap: 12, cursor: "pointer" }}
         onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--green-tint-2)"; e.currentTarget.style.boxShadow = "var(--shadow-sm)"; }}
         onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--line)"; e.currentTarget.style.boxShadow = "none"; }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
        <div style={{ fontSize: 14.5, fontWeight: 600, letterSpacing: "-0.015em" }}>{c.name}</div>
        <span className="tag" style={{ fontSize: 11 }}>{c.niche}</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 12.5 }}>
          <span className={"dot " + imp.tone}></span>{c.importLabel}
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 12.5, color: "var(--ink-3)" }}>
          <span className={"dot " + o.tone}></span>{c.owner ? o.label : "No owner yet"}
        </span>
      </div>

      {/* onboarding progress segments */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ display: "flex", gap: 3, flex: 1 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i < c.checklist ? (c.checklist === 5 ? "var(--green-600)" : "var(--amber)") : "var(--sunken)" }} />
          ))}
        </div>
        <span className="mono" style={{ fontSize: 11, color: "var(--ink-3)" }}>{c.checklist}/5</span>
      </div>
    </div>
  );
}

function BoardColumn({ status }) {
  const meta = C_S[status];
  const list = C_CO.filter((c) => c.status === status);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 13, background: "var(--sunken)", borderRadius: "var(--radius)", padding: 13, minHeight: 460 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "4px 4px 0" }}>
        <span className={"dot " + meta.tone}></span>
        <span style={{ fontSize: 13.5, fontWeight: 600 }}>{meta.label}</span>
        <span className="mono" style={{ fontSize: 12, color: "var(--ink-3)", marginLeft: "auto" }}>{list.length}</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
        {list.map((c) => <BoardCard key={c.id} c={c} />)}
      </div>
    </div>
  );
}

function OptionBoard() {
  return (
    <Shell>
      <PageHead
        title="Companies"
        sub="Manage every company on the platform — onboarding, owner access, modules and data migration, all in one place."
      />
      <Toolbar />
      <div style={{ marginTop: 24, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, alignItems: "start" }}>
        <BoardColumn status="onboarding" />
        <BoardColumn status="active" />
        <BoardColumn status="paused" />
      </div>
    </Shell>
  );
}
window.OptionBoard = OptionBoard;

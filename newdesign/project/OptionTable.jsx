/* Direction A — Refined Table.
   The classic admin table, made premium: hairlines, quiet status,
   monospace data, restrained color. Built for fast vertical scanning. */
const { COMPANIES: A_CO, STATUS_META: A_S, IMPORT_META: A_IMP, OWNER_META: A_OWN, I: A_I } = window.AFO;

function ImportCell({ c }) {
  const m = A_IMP[c.importState];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13.5, fontWeight: 500 }}>
        <span className={"dot " + m.tone}></span>{c.importLabel}
      </span>
      <span className="mono" style={{ fontSize: 11.5, color: "var(--ink-3)" }}>{c.lastImport}</span>
    </div>
  );
}

function ModuleBar({ n }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, width: 92 }}>
      <span className="mono" style={{ fontSize: 12.5, color: "var(--ink-2)" }}>{n} <span style={{ color: "var(--ink-4)" }}>/ 8</span></span>
      <div style={{ height: 3, borderRadius: 3, background: "var(--sunken)", overflow: "hidden" }}>
        <div style={{ height: "100%", width: (n / 8 * 100) + "%", background: n === 0 ? "var(--line-2)" : "var(--green-600)", borderRadius: 3 }} />
      </div>
    </div>
  );
}

function OptionTable() {
  return (
    <Shell>
      <PageHead
        title="Companies"
        sub="Manage every company on the platform — onboarding, owner access, modules and data migration, all in one place."
      />
      <Toolbar />

      <div style={{ marginTop: 24, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--radius)", boxShadow: "var(--shadow-sm)", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--line)" }}>
              {["Company","Owner access","Status","Data import","Modules","Created",""].map((h, i) => (
                <th key={i} className="eyebrow" style={{ textAlign: i === 6 ? "right" : "left", padding: "13px 22px", fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {A_CO.map((c, i) => {
              const s = A_S[c.status], o = A_OWN[c.ownerState];
              return (
                <tr key={c.id} style={{ borderBottom: i === A_CO.length - 1 ? "none" : "1px solid var(--line)" }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "var(--surface-2)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                  <td style={{ padding: "16px 22px" }}>
                    <div style={{ fontSize: 14.5, fontWeight: 600 }}>{c.name}</div>
                    <span className="tag" style={{ marginTop: 6 }}>{c.niche}</span>
                  </td>
                  <td style={{ padding: "16px 22px" }}>
                    {c.owner ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <span className="mono" style={{ fontSize: 12.5, color: "var(--ink-2)" }}>{c.owner}</span>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 12, color: "var(--ink-3)" }}>
                          <span className={"dot " + o.tone}></span>{o.label}
                        </span>
                      </div>
                    ) : (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 13, color: "var(--ink-3)", fontStyle: "italic" }}>
                        <span className={"dot " + o.tone}></span>Not assigned
                      </span>
                    )}
                  </td>
                  <td style={{ padding: "16px 22px" }}><span className={"pill " + s.tone}><span className={"dot " + s.tone}></span>{s.label}</span></td>
                  <td style={{ padding: "16px 22px" }}><ImportCell c={c} /></td>
                  <td style={{ padding: "16px 22px" }}><ModuleBar n={c.modules} /></td>
                  <td style={{ padding: "16px 22px" }}><span className="mono" style={{ fontSize: 12.5, color: "var(--ink-3)" }}>{c.created}</span></td>
                  <td style={{ padding: "16px 22px", textAlign: "right", whiteSpace: "nowrap" }}>
                    <button className="btn btn-ghost btn-sm">View</button>
                    <button className="btn btn-ghost btn-sm" style={{ marginLeft: 8, padding: "7px 9px" }}><Icon html={A_I.dots("var(--ink-3)", 16)} style={{ display: "flex" }} /></button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Shell>
  );
}
window.OptionTable = OptionTable;

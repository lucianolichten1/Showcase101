/* Company Detail — internal command center.
   Interactive: toggle onboarding steps, enable/disable modules, run a data
   import (simulated), and add internal notes. */
const { buildDetail: D_build, STATUS_META: D_S, IMPORT_META: D_IMP, OWNER_META: D_OWN, I: D_I } = window.AFO;

function Panel({ icon, title, right, children, bodyStyle }) {
  return (
    <div className="panel">
      <div className="panel-head">
        {icon && <span className="ph-icon" dangerouslySetInnerHTML={{ __html: icon }} />}
        <span className="ph-title">{title}</span>
        {right && <span className="ph-right">{right}</span>}
      </div>
      <div className="panel-body" style={bodyStyle}>{children}</div>
    </div>
  );
}

function DetailView({ id, onBack }) {
  const base = React.useMemo(() => D_build(window.AFO.COMPANIES.find((c) => c.id === id)), [id]);

  const [checklist, setChecklist] = React.useState(base.checklist);
  const [modules, setModules] = React.useState(base.modulesOn);
  const [notes, setNotes] = React.useState(base.notes);
  const [draft, setDraft] = React.useState("");
  const [activity, setActivity] = React.useState(base.activity);
  const [importState, setImportState] = React.useState(base.importState);
  const [importLabel, setImportLabel] = React.useState(base.importLabel);
  const [lastImport, setLastImport] = React.useState(base.lastImport);
  const [progress, setProgress] = React.useState(null); // null | 0..100

  const done = checklist.filter((s) => s.done).length;
  const modCount = modules.filter((m) => m.on).length;
  const s = D_S[base.status];
  const imp = D_IMP[importState];
  const o = D_OWN[base.ownerState];

  function toggleStep(i) {
    setChecklist((cl) => cl.map((s, j) => (j === i ? { ...s, done: !s.done } : s)));
  }
  function toggleMod(i) {
    setModules((m) => m.map((mm, j) => (j === i ? { ...mm, on: !mm.on } : mm)));
  }
  function addNote() {
    const t = draft.trim();
    if (!t) return;
    setNotes((n) => [{ author: "You", when: "just now", text: t }, ...n]);
    setDraft("");
  }
  function runImport() {
    if (progress !== null) return;
    setImportState("running"); setImportLabel("Importing…"); setProgress(0);
    let p = 0;
    const t = setInterval(() => {
      p += Math.random() * 18 + 8;
      if (p >= 100) {
        clearInterval(t);
        setProgress(100);
        setTimeout(() => {
          setProgress(null);
          setImportState("synced"); setImportLabel("Synced"); setLastImport("just now");
          setChecklist((cl) => cl.map((s) => (s.key === "imported" ? { ...s, done: true } : s)));
          setActivity((a) => [{ tone: "green", when: "just now", text: `Data import completed from ${base.source}` }, ...a]);
        }, 500);
      } else setProgress(Math.round(p));
    }, 260);
  }

  return (
    <React.Fragment>
      <div className="back-link" onClick={onBack}><ShIcon html={D_I.back("currentColor", 16)} /> All companies</div>

      {/* header */}
      <div className="detail-head">
        <div>
          <div className="detail-title">
            <h1>{base.name}</h1>
            <span className={"pill " + s.tone}><span className={"dot " + s.tone}></span>{s.label}</span>
          </div>
          <div className="detail-meta">
            <span className="tag">{base.niche}</span>
            <span className="sep"></span><span className="mono">{base.company}</span>
            <span className="sep"></span><span>{base.region}</span>
            <span className="sep"></span><span>Created {base.created}</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 9, flex: "none" }}>
          <button className="btn btn-ghost btn-sm">{base.ownerState === "active" ? "Manage access" : base.ownerState === "invited" ? "Resend invite" : "Assign owner"}</button>
          <button className="btn btn-ghost btn-sm"><ShIcon html={D_I.refresh("var(--ink-2)", 15)} /> Import data</button>
          <button className="btn btn-primary btn-sm"><ShIcon html={D_I.ext("#fff", 15)} /> Open workspace</button>
        </div>
      </div>

      <div className="detail-grid">
        {/* ===== MAIN COLUMN ===== */}
        <div>
          {/* onboarding checklist */}
          <Panel
            icon={D_I.check("var(--ink-3)", 16)}
            title="Setup checklist"
            right={<span className="mono" style={{ fontSize: 13, color: done === 5 ? "var(--green-ink)" : "var(--amber)", fontWeight: 600 }}>{done}/5 complete</span>}
          >
            <div className="progress-track" style={{ marginBottom: 6 }}>
              <div className="progress-fill" style={{ width: (done / 5 * 100) + "%", background: done === 5 ? "var(--green-600)" : "var(--amber)" }} />
            </div>
            <div>
              {checklist.map((step, i) => (
                <div key={step.key} className={"check-item" + (step.done ? " on" : "")} onClick={() => toggleStep(i)}>
                  <span className="check-box"><ShIcon html={D_I.check("#fff", 13)} /></span>
                  <div>
                    <div className="ci-label">{step.label}</div>
                    <div className="ci-hint">{step.hint}</div>
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          {/* data migration */}
          <Panel
            icon={D_I.db("var(--ink-3)", 16)}
            title="Data migration"
            right={<span className={"pill " + imp.tone}><span className={"dot " + imp.tone}></span>{importLabel}</span>}
          >
            <div className="import-stat">
              <div className="is"><span className="k">Source</span><span className="v">{base.source}</span></div>
              <div className="is"><span className="k">Records</span><span className="v mono">{base.records}</span></div>
              <div className="is"><span className="k">Last import</span><span className="v">{lastImport}</span></div>
              <div className="is"><span className="k">Database</span><span className="v" style={{ color: "var(--amber)" }}>Not connected</span></div>
            </div>

            {progress !== null && (
              <div style={{ marginTop: 18 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, color: "var(--ink-2)", marginBottom: 7 }}>
                  <span>Importing from {base.source}…</span><span className="mono">{progress}%</span>
                </div>
                <div className="progress-track"><div className="progress-fill" style={{ width: progress + "%" }} /></div>
              </div>
            )}

            <div style={{ display: "flex", gap: 9, marginTop: 18 }}>
              <button className="btn btn-primary btn-sm" onClick={runImport} disabled={progress !== null} style={{ opacity: progress !== null ? .6 : 1 }}>
                <ShIcon html={D_I.refresh("#fff", 15)} /> {importState === "failed" ? "Retry import" : importState === "synced" ? "Re-run import" : "Start import"}
              </button>
              <button className="btn btn-ghost btn-sm">View import log</button>
            </div>
          </Panel>

          {/* modules */}
          <Panel
            icon={D_I.grid("var(--ink-3)", 16)}
            title="Enabled modules"
            right={<span className="mono" style={{ fontSize: 13, color: "var(--ink-3)" }}>{modCount}/8 on</span>}
          >
            <div className="mod-grid">
              {modules.map((m, i) => (
                <div key={m.name} className={"mod" + (m.on ? " on" : "")} onClick={() => toggleMod(i)}>
                  <span className="mod-name">{m.name}</span>
                  <span className="toggle"></span>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        {/* ===== SIDEBAR COLUMN ===== */}
        <div>
          {/* overview */}
          <Panel icon={D_I.building("var(--ink-3)", 16)} title="Company overview">
            <div className="kv"><span className="k">Company ID</span><span className="v mono">{base.company}</span></div>
            <div className="kv"><span className="k">Niche</span><span className="v">{base.niche}</span></div>
            <div className="kv"><span className="k">Region</span><span className="v">{base.region}</span></div>
            <div className="kv"><span className="k">Plan</span><span className="v">{base.plan}</span></div>
            <div className="kv"><span className="k">Created</span><span className="v">{base.created}</span></div>
          </Panel>

          {/* owner access */}
          <Panel icon={D_I.user("var(--ink-3)", 16)} title="Owner & access">
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
              <span style={{ width: 38, height: 38, borderRadius: "50%", background: "var(--green-tint)", color: "var(--green-ink)", display: "grid", placeItems: "center", flex: "none", fontWeight: 600, fontSize: 14 }}>
                {base.owner ? base.owner[0].toUpperCase() : "?"}
              </span>
              <div style={{ minWidth: 0 }}>
                {base.owner
                  ? <div className="mono" style={{ fontSize: 12.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{base.owner}</div>
                  : <div style={{ fontSize: 13.5, fontWeight: 500, fontStyle: "italic", color: "var(--ink-3)" }}>No owner assigned</div>}
                <div style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 12, color: "var(--ink-3)", marginTop: 4 }}>
                  <span className={"dot " + o.tone}></span>{o.label}
                </div>
              </div>
            </div>
            <button className="btn btn-ghost btn-sm" style={{ width: "100%", justifyContent: "center" }}>
              <ShIcon html={D_I.mail("var(--ink-2)", 15)} /> {base.ownerState === "active" ? "Manage access" : base.ownerState === "invited" ? "Resend invitation" : "Invite owner"}
            </button>
          </Panel>

          {/* internal notes */}
          <Panel icon={D_I.note("var(--ink-3)", 16)} title="Internal notes" right={<span className="mono" style={{ fontSize: 12.5, color: "var(--ink-3)" }}>{notes.length}</span>}>
            <textarea className="note-input" rows="2" placeholder="Add an internal note for the team…" value={draft} onChange={(e) => setDraft(e.target.value)} />
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 9, marginBottom: notes.length ? 16 : 0 }}>
              <button className="btn btn-primary btn-sm" onClick={addNote} disabled={!draft.trim()} style={{ opacity: draft.trim() ? 1 : .5 }}>Add note</button>
            </div>
            {notes.length === 0
              ? <div className="empty">No notes yet.</div>
              : notes.map((n, i) => (
                  <div className="note" key={i}>
                    <div className="note-meta"><strong style={{ color: "var(--ink-2)", fontWeight: 600 }}>{n.author}</strong> · {n.when}</div>
                    <div className="note-text">{n.text}</div>
                  </div>
                ))}
          </Panel>

          {/* activity */}
          <Panel icon={D_I.clock("var(--ink-3)", 16)} title="Recent activity">
            <div className="timeline">
              {activity.map((a, i) => (
                <div className="tl-item" key={i}>
                  <div className="tl-rail">
                    <span className={"tl-dot " + a.tone} style={{ background: `var(--${a.tone === "green" ? "green-600" : a.tone})` }}></span>
                    <span className="tl-line"></span>
                  </div>
                  <div>
                    <div className="tl-text">{a.text}</div>
                    <div className="tl-when mono">{a.when}</div>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </React.Fragment>
  );
}
window.DetailView = DetailView;

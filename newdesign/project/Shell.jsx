/* Shared admin shell: sidebar + main scroll region.
   Used by all three Companies-List directions for a fair comparison. */
const { I } = window.AFO;

function Icon({ html, style }) {
  return <span style={style} dangerouslySetInnerHTML={{ __html: html }} />;
}
window.Icon = Icon;

function Shell({ children, accent }) {
  return (
    <div className="afo shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark"><Icon html={I.chart("#eaf3ee", 19)} /></div>
          <div>
            <div className="brand-name">AI Finance OS</div>
            <div className="brand-sub">Super Admin</div>
          </div>
        </div>

        <nav className="nav">
          <div className="nav-label eyebrow">Platform</div>
          <div className="nav-item active">
            <Icon html={I.building("currentColor", 18)} /> Companies
          </div>
          <div className="nav-item">
            <Icon html={I.chart("currentColor", 18)} /> Usage
          </div>
          <div className="nav-item">
            <Icon html={I.ext("currentColor", 16)} /> Audit log
          </div>
        </nav>

        <div className="sidebar-foot">
          <div className="signed">
            <div className="eyebrow">Signed in</div>
            <div className="who">admin@gmail.com</div>
            <div className="role">Role · Super Admin</div>
          </div>
          <div className="signout">
            <Icon html={I.signout("currentColor", 16)} /> Sign out
          </div>
        </div>
      </aside>

      <main className="main">
        <div className="main-scroll">{children}</div>
      </main>
    </div>
  );
}
window.Shell = Shell;

/* shared page header used across options */
function PageHead({ title, sub, count }) {
  return (
    <div className="page-head">
      <div>
        <div className="page-title">{title}</div>
        <p className="page-sub">{sub}</p>
      </div>
      <button className="btn btn-primary">
        <Icon html={I.plus("#fff", 16)} /> Add Company
      </button>
    </div>
  );
}
window.PageHead = PageHead;

function Toolbar({ view, setView, views }) {
  return (
    <div className="toolbar">
      <div className="search">
        <Icon html={I.search("var(--ink-4)", 17)} style={{ display: "flex" }} />
        <input placeholder="Search companies, owners, niches…" />
      </div>
      <div className="seg">
        <button className="on">All</button>
        <button>Onboarding</button>
        <button>Active</button>
        <button>Paused</button>
      </div>
      {views && (
        <div className="seg" style={{ marginLeft: "auto" }}>
          {views.map((v) => (
            <button key={v} className={view === v ? "on" : ""} onClick={() => setView && setView(v)}>{v}</button>
          ))}
        </div>
      )}
    </div>
  );
}
window.Toolbar = Toolbar;

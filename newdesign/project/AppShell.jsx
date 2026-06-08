/* App shell for the interactive prototype (sidebar + main scroll region). */
const { I: SH_I } = window.AFO;

function ShIcon({ html, style }) {
  return <span style={{ display: "inline-flex", ...style }} dangerouslySetInnerHTML={{ __html: html }} />;
}
window.ShIcon = ShIcon;

function AppShell({ children, onHome }) {
  return (
    <div className="afo shell">
      <aside className="sidebar">
        <div className="brand" style={{ cursor: "pointer" }} onClick={onHome}>
          <div className="brand-mark"><ShIcon html={SH_I.chart("#eaf3ee", 19)} /></div>
          <div>
            <div className="brand-name">AI Finance OS</div>
            <div className="brand-sub">Super Admin</div>
          </div>
        </div>

        <nav className="nav">
          <div className="nav-label eyebrow">Platform</div>
          <div className="nav-item active" onClick={onHome}>
            <ShIcon html={SH_I.building("currentColor", 18)} /> Companies
          </div>
          <div className="nav-item"><ShIcon html={SH_I.chart("currentColor", 18)} /> Usage</div>
          <div className="nav-item"><ShIcon html={SH_I.clock("currentColor", 16)} /> Audit log</div>
        </nav>

        <div className="sidebar-foot">
          <div className="signed">
            <div className="eyebrow">Signed in</div>
            <div className="who">admin@gmail.com</div>
            <div className="role">Role · Super Admin</div>
          </div>
          <div className="signout"><ShIcon html={SH_I.signout("currentColor", 16)} /> Sign out</div>
        </div>
      </aside>

      <main className="main" id="mainscroll">
        <div className="main-scroll">{children}</div>
      </main>
    </div>
  );
}
window.AppShell = AppShell;

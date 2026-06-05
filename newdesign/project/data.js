/* Sample company data + shared icons + shell — exposed on window */
(function () {
  const MODULES = ["Dashboard","Revenue","Expenses","Customers","A/R","Reports","Import/Export","Invoices"];

  const COMPANIES = [
    { id:"verde",  name:"Verde Harvest Co.", niche:"Agro", status:"active",
      owner:"maria@verdeharvest.com", ownerState:"active",
      importState:"synced", importLabel:"Synced", lastImport:"2 days ago",
      modules:8, created:"Mar 4, 2026", checklist:5 },
    { id:"north",  name:"Northwind Trading", niche:"Retail", status:"onboarding",
      owner:"ops@northwind.co", ownerState:"invited",
      importState:"running", importLabel:"Importing · 60%", lastImport:"in progress",
      modules:3, created:"May 22, 2026", checklist:3 },
    { id:"atlas",  name:"Atlas Logistics", niche:"Logistics", status:"onboarding",
      owner:null, ownerState:"unassigned",
      importState:"queued", importLabel:"Queued", lastImport:"—",
      modules:0, created:"May 27, 2026", checklist:1 },
    { id:"solano", name:"Solano Foods", niche:"Agro", status:"active",
      owner:"finance@solano.com", ownerState:"active",
      importState:"synced", importLabel:"Synced", lastImport:"5 hours ago",
      modules:6, created:"Jan 18, 2026", checklist:5 },
    { id:"bright", name:"Brightline Mfg.", niche:"Manufacturing", status:"paused",
      owner:"admin@brightline.com", ownerState:"active",
      importState:"stale", importLabel:"Stale · 28 days", lastImport:"28 days ago",
      modules:5, created:"Nov 2, 2025", checklist:5 },
    { id:"cedar",  name:"Cedar & Co.", niche:"Hospitality", status:"active",
      owner:"ana@cedar.co", ownerState:"active",
      importState:"synced", importLabel:"Synced", lastImport:"1 day ago",
      modules:7, created:"Feb 9, 2026", checklist:5 },
    { id:"pampa",  name:"Pampa Grains", niche:"Agro", status:"onboarding",
      owner:"carlos@pampagrains.com", ownerState:"invited",
      importState:"failed", importLabel:"Import failed", lastImport:"failed",
      modules:1, created:"May 30, 2026", checklist:2 },
    { id:"merid",  name:"Meridian Retail", niche:"Retail", status:"active",
      owner:"cto@meridian.io", ownerState:"active",
      importState:"synced", importLabel:"Synced", lastImport:"3 hours ago",
      modules:8, created:"Dec 12, 2025", checklist:5 },
  ];

  const STATUS_META = {
    active:     { tone:"green", label:"Active" },
    onboarding: { tone:"amber", label:"Onboarding" },
    paused:     { tone:"slate", label:"Paused" },
  };
  const IMPORT_META = {
    synced:  { tone:"green", label:"Synced" },
    running: { tone:"sky",   label:"Importing" },
    queued:  { tone:"slate", label:"Queued" },
    stale:   { tone:"amber", label:"Stale" },
    failed:  { tone:"rust",  label:"Failed" },
  };
  const OWNER_META = {
    active:     { tone:"green", label:"Owner active" },
    invited:    { tone:"amber", label:"Invite pending" },
    unassigned: { tone:"slate", label:"No owner" },
  };

  /* --- minimal stroke icons --- */
  const I = {
    chart: (c="#fff",s=20)=>`<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="6" y1="20" x2="6" y2="13"/><line x1="12" y1="20" x2="12" y2="8"/><line x1="18" y1="20" x2="18" y2="4"/></svg>`,
    building: (c="currentColor",s=18)=>`<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="3" width="11" height="18" rx="1.5"/><path d="M15 8h4a1.5 1.5 0 0 1 1.5 1.5V21M8 7h3M8 11h3M8 15h3"/></svg>`,
    search: (c="currentColor",s=17)=>`<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.5" y2="16.5"/></svg>`,
    plus: (c="currentColor",s=16)=>`<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
    signout: (c="currentColor",s=17)=>`<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`,
    arrow: (c="currentColor",s=15)=>`<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="13 6 19 12 13 18"/></svg>`,
    ext: (c="currentColor",s=15)=>`<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>`,
    dots: (c="currentColor",s=18)=>`<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="${c}"><circle cx="12" cy="5" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="12" cy="19" r="1.6"/></svg>`,
    back: (c="currentColor",s=16)=>`<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="11 18 5 12 11 6"/></svg>`,
    check: (c="currentColor",s=14)=>`<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
    user: (c="currentColor",s=16)=>`<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1"/></svg>`,
    mail: (c="currentColor",s=16)=>`<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>`,
    db: (c="currentColor",s=16)=>`<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/></svg>`,
    grid: (c="currentColor",s=16)=>`<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>`,
    note: (c="currentColor",s=16)=>`<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16v12H9l-5 4z"/></svg>`,
    clock: (c="currentColor",s=16)=>`<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 16 14"/></svg>`,
    refresh: (c="currentColor",s=15)=>`<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-2.64-6.36M21 3v6h-6"/></svg>`,
    bolt: (c="currentColor",s=15)=>`<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 4 14 11 14 10 22 19 10 12 10"/></svg>`,
    x: (c="currentColor",s=18)=>`<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
  };

  /* --- per-company extras for the detail command-center --- */
  const EXTRA = {
    verde:  { region:"South America · BR", plan:"Scale",       source:"QuickBooks", records:"48,210", company:"VRD-1042" },
    north:  { region:"North America · US", plan:"Growth",      source:"Xero",       records:"12,540", company:"NWT-2087" },
    atlas:  { region:"Europe · DE",        plan:"Growth",      source:"CSV upload", records:"—",      company:"ATL-2091" },
    solano: { region:"South America · AR", plan:"Scale",       source:"QuickBooks", records:"63,880", company:"SOL-1009" },
    bright: { region:"North America · US", plan:"Enterprise",  source:"NetSuite",   records:"91,300", company:"BRT-0461" },
    cedar:  { region:"Europe · ES",        plan:"Growth",      source:"Xero",       records:"22,470", company:"CDR-1133" },
    pampa:  { region:"South America · AR", plan:"Growth",      source:"CSV upload", records:"3,120",  company:"PMP-2099" },
    merid:  { region:"North America · CA", plan:"Scale",       source:"QuickBooks", records:"57,640", company:"MRD-0712" },
  };

  const CHECK_STEPS = [
    { key:"created",  label:"Company created",        hint:"Record provisioned on the platform" },
    { key:"invited",  label:"Owner invited",          hint:"Invitation email sent to the owner" },
    { key:"activated",label:"Owner activated account",hint:"Owner accepted and signed in" },
    { key:"modules",  label:"Modules configured",     hint:"Finance modules enabled for the workspace" },
    { key:"imported", label:"Initial data imported",  hint:"First migration completed & verified" },
  ];

  function buildDetail(c) {
    const x = EXTRA[c.id] || {};
    const merged = { ...x, ...c };
    return {
      ...merged,
      checklist: CHECK_STEPS.map((s, i) => ({ ...s, done: i < c.checklist })),
      modulesOn: MODULES.map((m, i) => ({ name: m, on: c.modulesSel ? c.modulesSel.includes(m) : i < c.modules })),
      notes: c.id === "atlas"
        ? [{ author:"You", when:"2 days ago", text:"Owner not assigned yet — chasing the finance lead for the right contact before sending the invite." }]
        : c.id === "pampa"
        ? [{ author:"R. Mehta", when:"yesterday", text:"CSV import failed on the accounts-receivable sheet — encoding issue. Asked client to re-export as UTF-8." }]
        : [],
      activity: [
        c.importState === "failed" ? { tone:"rust",  when:"Yesterday · 14:22", text:`Data import failed from ${x.source || "source"}` }
                                    : { tone:"green", when:"Today · 09:14",     text:`Owner ${c.owner ? c.owner : "—"} viewed the workspace` },
        { tone:"sky",   when:"2 days ago",  text:`${c.modules} of 8 modules enabled` },
        c.ownerState === "active" ? { tone:"green", when:"4 days ago", text:"Owner activated their account" }
                                  : { tone:"amber", when:"4 days ago", text:"Owner invitation sent" },
        { tone:"slate", when:c.created, text:"Company record created" },
      ],
    };
  }

  window.AFO = { MODULES, COMPANIES, STATUS_META, IMPORT_META, OWNER_META, EXTRA, CHECK_STEPS, buildDetail, I };
})();

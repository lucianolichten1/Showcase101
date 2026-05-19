# Collaboration guide

How two developers can work on this repo without stepping on each other.

## Recommended Git workflow

1. **`main`** — always deployable; demo-ready for the owner meeting
2. **Feature branches** — one task per branch, short-lived (1–3 days)
3. **Pull requests** — review before merge; run `npm run lint` and `npm run build` locally

```bash
git checkout main
git pull
git checkout -b feature/your-task-name
# ... work, commit ...
git push -u origin feature/your-task-name
# Open PR on GitHub/GitLab
```

## Branch naming

| Prefix | Use for |
|--------|---------|
| `feature/` | New UI, data, or behavior |
| `fix/` | Bug fixes |
| `docs/` | Documentation only |
| `chore/` | Tooling, deps, config |

Examples: `feature/unified-financial-state`, `fix/dashboard-kpi-revenue`, `docs/roadmap-update`

## Commit message examples

Use clear, imperative subjects:

```
Add receivables types and wire AR page to App state
Fix TypeScript path alias for @/ imports
Document React Router routes in ARCHITECTURE.md
Derive dashboard cattle KPI from useAgroData
```

## How to divide tasks (current — multi-page demo)

### Developer A — UI / product surface

- Page layouts (`*Page.tsx`), `AppLayout`, sidebar
- Presentational components (`KPICard`, charts, tables, dialogs)
- Tailwind styling, responsive grids
- Meeting polish (logo, spacing, placeholder buttons)
- Recharts configuration

**Typical files:** `src/components/**`, `src/config/navigation.ts`, `src/index.css`

### Developer B — Data / domains / structure

- `src/domains/financial/` and `src/domains/agro/`
- `src/data/mockData.ts`, `types.ts`, legacy re-exports
- `App.tsx` shared state (receivables, customers)
- KPI calculations and hook design
- Supabase schema drafts (later)

**Typical files:** `src/domains/**`, `src/data/**`, `src/App.tsx`, `ARCHITECTURE.md`

## How to divide tasks (later — full product)

| Developer A | Developer B |
|-------------|---------------|
| Frontend pages and UX | Supabase schema, RLS, APIs |
| Component library | Domain logic and API mappers |
| Charts and dashboards | Excel import/export pipeline |
| Auth UI (login, settings) | Edge Functions / AI backend |
| E2E/UI tests | Integration tests, seeds |

## Parallel work without merge conflicts

**Safe to split simultaneously:**

- Developer A edits `FinancialChart.tsx` while Developer B edits `domains/financial/mockData.ts`
- Developer A styles `LivestockTable` while Developer B adds fields to agro `Plot` type
- One person on `docs/` while the other on a single page component

**Coordinate before editing together:**

- `App.tsx` (routes + shared AR/customer state)
- `DashboardPage.tsx` (many child widgets)
- `mockData.ts` and domain mock files when KPIs must stay aligned
- `package.json` (one person owns dep changes per PR)

## Rules to reduce conflicts

1. **Pull `main` before starting a branch**
2. **Keep PRs small** (< 400 lines when possible)
3. **One feature per PR**
4. **Don’t rename files** without syncing in chat
5. **Mock or domain data changes** — note in PR description which KPIs/pages to re-test
6. **Run before push:** `npm run lint && npm run build`

## Local setup

```bash
cd "Agro Dashboard MVP"
npm install
npm run dev
```

Open the URL Vite prints (usually port 3000). Test routes directly, e.g. `/accounts-receivable`.

## Code review checklist

- [ ] App loads at `npm run dev`; `npm run build` passes
- [ ] No secrets in commits (`.env` ignored)
- [ ] Data changes documented in PR (which pages/KPIs affected)
- [ ] TypeScript passes (`npm run lint`)
- [ ] Sidebar links match `config/navigation.ts` and `App.tsx` routes
- [ ] New routes documented in README if added

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

Examples: `feature/date-range-filter`, `fix/kpi-trend-colors`, `docs/roadmap-update`

## Commit message examples

Use clear, imperative subjects:

```
Add receivables types and wire table to mockData
Fix TypeScript path alias for @/ imports
Document Phase 2 data model in ARCHITECTURE.md
Update mock KPIs for customer meeting
```

## How to divide tasks (now — demo phase)

### Developer 1 — UI / product surface

- `DashboardPage` layout and header
- Individual components (`KPICard`, charts, tables)
- Tailwind styling, responsive grids
- Meeting polish (logo, spacing, export button UI)
- Recharts configuration

**Typical files:** `src/components/**`, `src/index.css`

### Developer 2 — Data / structure / future backend

- `src/data/types.ts` and `mockData.ts`
- Computed KPIs from underlying records
- Import/export planning and prototypes
- Supabase schema drafts and migrations (later)
- AI insight API design (later)

**Typical files:** `src/data/**`, `ARCHITECTURE.md`, future `src/lib/`, `src/hooks/`

## How to divide tasks (later — full product)

| Developer 1 | Developer 2 |
|-------------|---------------|
| Frontend pages and UX | Supabase schema, RLS, APIs |
| Component library | Transaction and agro domain logic |
| Charts and dashboards | Excel import/export pipeline |
| Auth UI (login, settings) | Edge Functions / AI backend |
| E2E/UI tests | Integration tests, seeds |

## Parallel work without merge conflicts

**Safe to split simultaneously:**

- Developer 1 edits `FinancialChart.tsx` while Developer 2 edits `mockData.ts` (coordinate if chart fields change)
- Developer 1 styles `LivestockTable` while Developer 2 adds columns to `livestockGroups` data
- One person on `docs/` while the other on a single component

**Avoid editing the same file at once:**

- `DashboardPage.tsx` (layout hub — communicate first)
- `mockData.ts` (merge conflicts common — pull often, small PRs)
- `package.json` (one person owns dep changes per PR)

## Rules to reduce conflicts

1. **Pull `main` before starting a branch**
2. **Keep PRs small** (< 400 lines when possible)
3. **One feature per PR**
4. **Don’t rename files** without syncing in chat
5. **Mock data changes** — announce in PR description so UI devs can adjust
6. **Run before push:** `npm run lint && npm run build`

## First-time repo setup (either developer)

```bash
cd "Agro Dashboard MVP"
git init
git add .
git commit -m "Initial commit: Agro Dashboard MVP demo"
git branch -M main
git remote add origin <your-repo-url>
git push -u origin main
```

Invite collaborator with write access on GitHub/GitLab.

## Code review checklist

- [ ] Dashboard still loads at `npm run dev`
- [ ] No secrets in commits (`.env` ignored)
- [ ] Mock data changes documented in PR
- [ ] TypeScript passes (`npm run lint`)

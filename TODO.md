# Developer TODO

Practical task list for the team. Check items off in PRs or commits.

## UI improvements

- [ ] Add company logo and customer name to header
- [ ] Improve mobile layout (KPI grid, table horizontal scroll labels)
- [ ] Wire “This Month” on Dashboard to a date-range picker
- [ ] Implement “Export Report” on Dashboard (PDF or Excel stub)
- [ ] Consistent empty/loading states for tables
- [ ] Use or remove `src/components/ui/card.tsx` (currently unused by most widgets)
- [ ] Fix Recharts container sizing warning on Dashboard (console)
- [ ] Dark mode (low priority for MVP meeting)

## Data / model improvements

- [ ] Fix dashboard `dashboardKPIs` Total Revenue value (`Bs 67` → align with May `monthlyFinancials`)
- [ ] Derive remaining Dashboard financial KPI cards from `monthlyFinancials` or financial domain
- [ ] Lift `useFinancialData()` to App or a provider so Revenue/Expenses/Dashboard share state
- [ ] Wire `ReceivablesTable` on Dashboard to App-level receivables (same as AR page)
- [ ] Remove unused `cropPlots` / `livestockGroups` from `mockData.ts` (superseded by agro domain)
- [ ] Add `organization` and `period` types in `types.ts` when planning backend
- [ ] Add `src/data/index.ts` re-exports for cleaner imports (optional)

## Routing / navigation

- [x] React Router with `BrowserRouter` and routes in `App.tsx`
- [x] Sidebar `NavLink` active state
- [ ] Optional: catch-all route redirect unknown paths (e.g. `/settings`) to `/dashboard`
- [ ] Document SPA fallback in deploy config for production direct URLs

## Backend / database (future)

- [ ] Choose Supabase region and create project
- [ ] Write SQL migrations for core tables
- [ ] Implement RLS policies
- [ ] Create seed data for demo tenant
- [ ] API layer or Supabase client in `src/lib/supabase.ts`

## AI features

- [ ] Design insight prompt template
- [ ] Add server route or Edge Function for LLM calls
- [ ] Replace static `aiInsights` with API response
- [ ] Add loading and error states on `AIInsightsPanel`
- [ ] Store insight history per period

## Agro module features

- [ ] Expose `useAgroData` date-range filter in UI (shipments / imports)
- [ ] Expand crop table with season / status columns (data exists on `Plot`)
- [ ] Show vet cost column in livestock table (data exists, UI hidden)
- [ ] Plot map or simple list view for land assets
- [ ] Link expenses to plot or livestock group in data model

## Collaboration / Git

- [ ] Create GitHub/GitLab repo and push (if not done)
- [ ] Add branch protection on `main` (optional)
- [ ] Agree on PR review rule: one approval before merge
- [ ] Set up preview deploys on PR (Vercel/Netlify)
- [ ] Run `npm run lint` and `npm run build` in CI

## Bugs / cleanup

- [x] Fix TypeScript `@/` path alias in `tsconfig.json`
- [x] Financial domain (`src/domains/financial/`)
- [x] Agro domain (`src/domains/agro/`)
- [x] React Router navigation
- [ ] Reduce Recharts bundle size (code-split chart if needed)
- [ ] Fix `vite.config.ts` encoding artifact in comment (optional)
- [ ] Remove `metadata.json` from repo if not needed outside AI Studio
- [ ] Update `ARCHITECTURE.md` diagrams when data layer is unified

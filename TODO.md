# Developer TODO

Practical task list for the two-person team. Check items off in PRs or commits.

## UI improvements

- [ ] Add company logo and customer name to header
- [ ] Improve mobile layout (KPI grid, table horizontal scroll labels)
- [ ] Wire “This Month” to a date-range picker (UI state only at first)
- [ ] Implement “Export Report” (PDF or Excel stub)
- [ ] Consistent empty/loading states for tables
- [ ] Use or remove `src/components/ui/card.tsx` (currently unused by most widgets)
- [ ] Dark mode (low priority for MVP meeting)

## Data / model improvements

- [ ] Update `mockData.ts` with real customer ballpark numbers
- [ ] Derive KPI card values from `monthlyFinancials` (May row) programmatically
- [ ] Add `organization` and `period` types in `types.ts`
- [ ] Validate expense percentages sum to 100%
- [ ] Use ISO dates for receivables instead of strings like "May 10"
- [ ] Add `src/data/index.ts` re-exports for cleaner imports

## Backend / database (future)

- [ ] Choose Supabase region and create project
- [ ] Write SQL migrations for core tables
- [ ] Implement RLS policies
- [ ] Create seed data for demo tenant
- [ ] API layer or Supabase client in `src/lib/supabase.ts`

## AI features

- [ ] Design insight prompt template
- [ ] Add server route or Edge Function for LLM calls
- [ ] Replace static `aiInsights` array with API response
- [ ] Add loading and error states on `AIInsightsPanel`
- [ ] Store insight history per period

## Agro module features

- [ ] Expand crop table with season / variety columns
- [ ] Show vet cost column in livestock table (data exists, UI hidden)
- [ ] Plot map or simple list view for land assets
- [ ] Link expenses to plot or livestock group in data model

## Collaboration / Git

- [ ] `git init` and first commit
- [ ] Create GitHub/GitLab repo and push
- [ ] Add branch protection on `main` (optional)
- [ ] Agree on PR review rule: one approval before merge
- [ ] Set up preview deploys on PR (Vercel/Netlify)

## Bugs / cleanup

- [x] Fix TypeScript `@/` path alias in `tsconfig.json`
- [x] Centralize mock data in `src/data/`
- [x] Remove unused Gemini/Express/Motion dependencies from `package.json`
- [ ] Run `npm run lint` in CI
- [ ] Reduce Recharts bundle size (code-split chart if needed)
- [ ] Fix `vite.config.ts` encoding artifact in comment (optional)
- [ ] Remove `metadata.json` from repo if not needed outside AI Studio

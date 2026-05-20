# Developer TODO

Practical task list. Check items off in PRs.

## Import & financial (recent — verify / harden)

- [x] Excel `.xlsx` import with flexible mapping
- [x] Merge imports + dedupe (`merge.ts`)
- [x] Empty default financial state
- [x] localStorage persistence + clear import
- [ ] Add `npm run test:import-merge` script to `package.json` (optional)
- [ ] E2E smoke test checklist in CI (manual doc in README for now)
- [ ] Wire legacy CSV confirm path to financial merge (or remove CSV UI)

## UI improvements

- [ ] Settings page route and placeholder content
- [ ] Improve mobile chart axis density when 12 months shown
- [ ] Export Report / P&L PDF from imported data
- [ ] Consistent empty states on all financial pages
- [ ] Dark mode (low priority)

## Data / domain

- [ ] Import mapping for Customers sheet
- [ ] Import mapping for Accounts Receivable
- [ ] Inventory module (future)
- [ ] Receivable due dates as ISO in demo data
- [ ] Document customer-specific COGS categories for Reports

## Backend / database (future)

- [ ] Supabase project + migrations
- [ ] RLS policies
- [ ] API layer; sync `FinancialDataProvider` with fetch

## AI features

- [ ] Replace static `AIInsightsPanel` with metrics-driven copy or LLM
- [ ] Loading/error states on insights

## Agro module

- [ ] Link plot/livestock widgets to real data or hide when import-only demo
- [ ] Vet cost column in livestock table (data exists)

## Collaboration / Git

- [ ] Run `npm run lint` and `npm run build` in CI
- [ ] Preview deploys on PR

## Bugs / cleanup

- [x] React Router + `FinancialDataProvider` in `main.tsx`
- [x] Centralize import storage keys
- [ ] Update/supersede ADR 0001 (routing) — see docs
- [ ] Reduce Recharts bundle (code-split if needed)

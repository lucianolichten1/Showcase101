# Product roadmap

Phased plan from demo to SaaS. Adjust timelines as you learn from the first customer.

---

## Phase 1: Demo dashboard

**Goal:** Impress the owner in a meeting with a polished, credible UI.

- [x] Multi-page dashboard layout with sidebar navigation
- [x] KPI cards, chart, tables, expense breakdown, AI panel
- [x] Mock data in `src/data/mockData.ts` plus domain modules
- [x] React Router (`BrowserRouter`, routes in `App.tsx`, paths in `navigation.ts`)
- [x] Customers, Accounts Receivable, Reports, Expenses, Revenue, Export/Import pages
- [x] Expenses and Revenue modules with search, filter, sort, and Add modals
- [x] Export/Import CSV pipeline (client-side)
- [x] Record Payment and Add Invoice on Accounts Receivable (App-level state)
- [ ] Settings page (sidebar item is disabled placeholder only)
- [ ] Align dashboard financial KPI strings with computed totals (e.g. fix `Bs 67` revenue typo)
- [ ] Polish responsive layout for tablet/laptop in meeting
- [ ] Optional: company name / logo in header
- [ ] Deploy static build (Vercel, Netlify, or similar) with SPA fallback for direct URLs

---

## Phase 2: Real data structure (in progress)

**Goal:** Replace ad-hoc mocks with a clear domain model in code (still no DB).

- [x] Define TypeScript types for transactions, categories, plots, livestock (`domains/financial`, `domains/agro`)
- [x] Split domain modules (`financial/`, `agro/`) with mock data, calculations, hooks
- [x] Add `useFinancialData()` and `useAgroData()` hooks
- [x] Compute KPIs from underlying records on Revenue, Expenses, and AR pages
- [x] Compute agro KPIs (corn yield, cattle count) on Dashboard from agro domain
- [x] Default date-range filter in financial hook (2026 full year; no UI yet)
- [x] Document data shapes in domain READMEs
- [ ] Derive **all** Dashboard financial KPI cards from records (not hardcoded strings)
- [ ] Single shared financial state across Dashboard, Revenue, Expenses, and Reports
- [ ] Wire Dashboard receivables table to App-level AR state
- [ ] Expose date-range picker in UI and filter agro shipments/imports consistently

---

## Phase 3: Excel import/export

**Goal:** Meet customers where they are — spreadsheets today.

- [x] Import CSV in browser with preview and confirm (Export/Import page)
- [x] Export confirmed rows to CSV download
- [ ] Robust CSV parsing (quoted commas, Papa Parse)
- [ ] Excel (.xlsx) import and export
- [ ] Export dashboard summary to Excel (.xlsx)
- [ ] Map columns to categories with validation UI
- [ ] Persist imports to database (not session-only)

---

## Phase 4: Authentication and organizations

**Goal:** Multi-user access per farm/business.

- [ ] Sign up / login (email or OAuth)
- [ ] Organization (tenant) model — one business per org
- [ ] Invite team members with roles (owner, manager, viewer)
- [ ] Protect routes and API by `organization_id`
- [ ] Settings page (org name, currency, fiscal year) with real `/settings` route

---

## Phase 5: Database with Supabase

**Goal:** Persistent, queryable data.

- [ ] Supabase project setup (Postgres + Auth optional overlap with Phase 4)
- [ ] Migrations for core tables (see `ARCHITECTURE.md`)
- [ ] Row Level Security (RLS) per organization
- [ ] CRUD APIs for transactions, categories, receivables, agro entities
- [ ] Replace mock loaders with Supabase queries
- [ ] Seed script for demo org

---

## Phase 6: AI insights connected to real data

**Goal:** Insights that reflect actual business performance.

- [ ] Aggregate metrics server-side (or Edge Function)
- [ ] Prompt template with KPIs, overdue AR, top expenses, plot variance
- [ ] Call LLM API (Gemini or other) with structured context
- [ ] Cache insights per org / period; show “last updated” from DB
- [ ] Guardrails: no hallucinated numbers; cite metrics used

---

## Phase 7: Agro module expansion

**Goal:** Deep operational tracking beyond finance-only.

- [x] Plot registry with yield and financial fields (mock domain)
- [x] Livestock groups with feed/vet costs and estimated value (mock domain)
- [x] Shipments list with status filtering (mock domain)
- [ ] Plot map or extended season / variety UI
- [ ] Livestock events (births, sales, vet, weight)
- [ ] Cost allocation: assign expenses to plot or livestock group
- [ ] Seasonal reports and benchmarks
- [ ] Optional: weather or market price integrations

---

## Phase 8: Subscription / business model

**Goal:** Sustainable SaaS.

- [ ] Pricing tiers (solo farm, team, enterprise)
- [ ] Stripe (or local payment) integration
- [ ] Usage limits (users, plots, transactions)
- [ ] Onboarding flow and in-app help
- [ ] Customer feedback loop from first paying users

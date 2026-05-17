# Product roadmap

Phased plan from demo to SaaS. Adjust timelines as you learn from the first customer.

---

## Phase 1: Demo dashboard (current)

**Goal:** Impress the owner in a meeting with a polished, credible UI.

- [x] Single-page dashboard layout
- [x] KPI cards, chart, tables, expense breakdown, AI panel
- [x] Mock data centralized in `src/data/mockData.ts`
- [ ] Align mock numbers with customer’s real ballpark figures
- [ ] Polish responsive layout for tablet/laptop in meeting
- [ ] Optional: company name / logo in header
- [ ] Deploy static build (Vercel, Netlify, or similar) for easy sharing

---

## Phase 2: Real data structure

**Goal:** Replace ad-hoc mocks with a clear domain model in code (still no DB).

- [ ] Define TypeScript types for transactions, categories, plots, livestock
- [ ] Split `mockData.ts` into domain modules (`financial`, `agro`, `receivables`)
- [ ] Add simple data loaders / hooks (`useDashboardData`)
- [ ] Compute KPIs from underlying records (not hardcoded strings)
- [ ] Add date-range state and filter mock records
- [ ] Document data shape for future API parity

---

## Phase 3: Excel import/export

**Goal:** Meet customers where they are — spreadsheets today.

- [ ] Export dashboard summary to Excel (.xlsx)
- [ ] Export transaction template for customer to fill
- [ ] Import transactions from Excel with validation errors UI
- [ ] Map columns to categories (feed, labor, fertilizer, etc.)
- [ ] Store imported data in memory / local JSON first

---

## Phase 4: Authentication and organizations

**Goal:** Multi-user access per farm/business.

- [ ] Sign up / login (email or OAuth)
- [ ] Organization (tenant) model — one business per org
- [ ] Invite team members with roles (owner, manager, viewer)
- [ ] Protect routes and API by `organization_id`
- [ ] Basic settings page (org name, currency, fiscal year)

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

- [ ] Plot registry (hectares, location, soil notes)
- [ ] Crop cycles (planting, harvest, expected vs actual yield)
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

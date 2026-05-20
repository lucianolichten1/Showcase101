# Product roadmap

Phased plan from demo to SaaS. Adjust timelines as you learn from the first customer.

---

## Phase 1: Demo dashboard + Excel import (current)

**Goal:** Customer meeting with import-driven financials and credible operations UI.

- [x] Multi-page app with React Router
- [x] `FinancialDataProvider` for shared financial state
- [x] Empty default financial state (no mock KPIs until import)
- [x] Flexible Excel `.xlsx` import (sheet roles + column mapping)
- [x] Saved mappings + import history in `localStorage`
- [x] Merge multiple imports + duplicate detection
- [x] Dashboard KPIs + chart from imported data
- [x] Expenses, Revenue, Reports wired to imported data
- [x] Clear import resets financial UI
- [x] Period filter: All / YTD / Month+year; chart max 12 months
- [ ] Settings page (sidebar only)
- [ ] Deploy static build for sharing (Vercel/Netlify)
- [ ] Polish responsive layout for meeting devices

---

## Phase 2: Data model & operations alignment

**Goal:** Clear domain boundaries and less demo/ops confusion.

- [ ] Import Customers / AR sheets (or link sales to customer entities)
- [ ] Unify or label demo operations data vs imported financials in UI
- [ ] Deeper Reports P&L mapping to customer chart of accounts
- [ ] Export P&L / expenses to Excel or PDF from real data
- [ ] Server-side or worker-based Excel validation

---

## Phase 3: Persistence & import hardening

**Goal:** Beyond single-browser `localStorage`.

- [ ] Supabase (or API) for organizations and transactions
- [ ] Import batches stored per org (not only local)
- [ ] Robust CSV path merged into same financial pipeline (or deprecate)
- [ ] Background re-import / scheduled sync (future)

---

## Phase 4: Authentication and organizations

**Goal:** Multi-user access per farm/business.

- [ ] Sign up / login
- [ ] Organization (tenant) model
- [ ] Roles (owner, manager, viewer)
- [ ] RLS on all tenant data
- [ ] Settings page (org name, currency, fiscal year)

---

## Phase 5: Database with Supabase

**Goal:** Persistent, queryable data.

- [ ] Migrations for core tables (see `ARCHITECTURE.md`)
- [ ] Replace `FinancialDataProvider` loaders with API
- [ ] Seed script for demo org

---

## Phase 6: AI insights connected to real data

**Goal:** Replace static insight cards with metrics-based summaries.

- [ ] Aggregate metrics from imported + operational data
- [ ] LLM insights with guardrails
- [ ] Cache per org / period

---

## Phase 7: Agro module expansion

**Goal:** Deep operational tracking.

- [ ] Plot registry, crop cycles, livestock events
- [ ] Cost allocation to plot / group
- [ ] Inventory / logistics (if required by customer)

---

## Phase 8: Subscription / business model

**Goal:** Sustainable SaaS.

- [ ] Pricing tiers, payments, onboarding

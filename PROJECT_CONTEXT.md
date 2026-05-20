# Project context

## Business idea

We are building an **AI-powered financial and agro management SaaS** for agricultural businesses in Latin America (starting in Bolivia). The product should eventually cover P&L, receivables, Excel import/export, AI insights, crop/livestock tracking, and multi-tenant access.

## First customer context

An **agro company** with corn plots, cattle, and mixed expenses. The owner needs a **clear dashboard** in meetings — not a full accounting system yet.

## What this MVP demonstrates today

### Financial (import-driven)

1. **Empty start** — no fake revenue/expense until Excel is imported.
2. **Flexible Excel import** — any `.xlsx` with mappable Sales/Expenses sheets.
3. **Persistent local data** — refresh keeps imports; multiple files merge.
4. **Dashboard, Expenses, Revenue, Reports** — one active dataset from import.

### Operations (still largely demo)

- Corn plots, livestock tables, static AI insight text.
- Customers and Accounts Receivable lists (demo data in `mockData.ts` / `App.tsx`).
- Not yet loaded from customer Excel.

Currency: **Bolivianos (Bs)**.

## Problem we are solving

Owners track finances in spreadsheets. This MVP shows:

- A single view after import (KPIs, trends, expenses).
- That **their** Excel structure can be mapped without a rigid template.
- A path to receivables, customers, and cloud data later.

## What the owner should understand from a demo

- “The app starts empty — then **my** Excel fills it.”
- “I can add another year’s file and still see everything together.”
- “I know who owes me money” (AR demo) and “I see farm operations” (plots/livestock demo).
- “This could grow into advice and team access, not just numbers.”

## Long-term product vision

| Area | Vision |
|------|--------|
| Finance | Transactions, categories, P&L, invoicing, receivables |
| Agro | Plots, crop cycles, livestock, cost allocation |
| Data | Excel import (done locally), later bank feeds + API |
| AI | Insights from real business data |
| Platform | Multi-tenant orgs, roles, subscriptions |

## What is mock / demo vs imported

| Data | Source | Used in |
|------|--------|---------|
| Sales & expenses (financial) | **Excel import** → `agro-import-data` | Dashboard KPIs/chart, Expenses, Revenue, Reports |
| Customers, receivables (AR) | `mockData.ts` / `App` state | Customers, AR pages, dashboard receivables table |
| Crop plots, livestock | `domains/agro/mockData.ts` | Dashboard operations |
| AI insight strings | Static arrays | `AIInsightsPanel` |
| `dashboardKPIs` template | `mockData.ts` | KPI card layout/trends for non-financial cards |

**Financial KPI values** are computed from imported records when `usesImportedData` is true; otherwise they show zero with import prompts.

## What should become dynamic next

- Customers and AR from import or API.
- Operations tables optionally fed from import or manual entry.
- Cloud persistence and auth.
- AI insights from aggregated metrics.

## Related docs

- [README.md](./README.md) — setup, import flow, localStorage keys, testing
- [DEMO.md](./DEMO.md) — meeting script (Excel-first)

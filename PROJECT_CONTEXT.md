# Project context

## Business idea

We are building an **AI-powered financial and agro management SaaS** for agricultural businesses in Latin America (starting in Bolivia). Think of it as a simpler, industry-specific alternative to QuickBooks — designed for owners who manage:

- Crop production (e.g. corn on multiple plots)
- Livestock (cattle and related costs)
- Mixed farm expenses (feed, fertilizer, labor, transport, veterinary, fuel)
- Customer receivables and cash flow

The product should eventually support P&L reporting, accounts receivable, Excel import/export, AI business insights, crop/land tracking, livestock tracking, expense analytics, role-based permissions, authentication, bank integrations, and modular agro features.

**Today’s MVP has no backend, database, or login** — it runs entirely in the browser with mock and session-local data.

## First customer context

The first prospect is an **agro company** with:

- Land under corn cultivation (multiple plots)
- Cattle / livestock operations
- Other agro-related activities

The owner is not deeply technical. They need a **clear, professional dashboard** in a meeting — not a full accounting system yet.

## Agro dashboard goal (this MVP)

Show one screen that answers, at a glance:

1. **How is the business doing financially this month?** (revenue, expenses, net profit)
2. **How much money is owed to us?** (accounts receivable, overdue customers)
3. **How is corn production performing?** (yield and profit by plot)
4. **How is livestock doing?** (head count, feed costs, estimated value)
5. **Where is money going?** (expense breakdown)
6. **What should the owner pay attention to?** (AI-style insights — static demo text today)

Currency in the demo is **Bolivianos (Bs)** to match the local context.

## Problem we are solving

Agro owners often track finances in spreadsheets, notebooks, or memory. They lack:

- A single view of financial + operational performance
- Easy receivables visibility
- Plot-level and livestock-level profitability
- Actionable summaries without hiring an analyst

This MVP proves we understand their world and can present data clearly before investing in backend, auth, and integrations.

## What the owner should understand from the dashboard

After a 10–15 minute walkthrough, the owner should feel:

- “I can see my month’s profit and biggest costs.”
- “I know who owes me money and who is late.”
- “I can compare my corn plots and cattle groups.”
- “The system could eventually give me advice, not just numbers.”

## Long-term product vision

| Area | Vision |
|------|--------|
| Finance | Transactions, categories, P&L, invoicing, receivables |
| Agro | Plots, crop cycles, livestock groups, cost allocation |
| Data | Excel import/export, later bank feeds |
| AI | Insights generated from real business data |
| Platform | Multi-tenant orgs, roles, subscriptions |

## Application structure (current)

| Area | Routes | Data |
|------|--------|------|
| Dashboard | `/dashboard` | Mixed: static financial KPIs, agro-computed corn/cattle, charts from `mockData.ts` |
| Customers | `/customers` | Customers + App-level receivables |
| Accounts Receivable | `/accounts-receivable` | App state; Record Payment works in session |
| Export/Import | `/export-import` | CSV pipeline + agro import seeds |
| Expenses | `/expenses` | `domains/financial` via `useFinancialData()` |
| Revenue | `/revenue` | `domains/financial` via `useFinancialData()` |
| Reports | `/reports` | `mockData.ts` + agro plots |
| Settings | *(no route)* | Sidebar placeholder only |

Navigation uses **React Router**. See [README.md](./README.md) and [DEMO.md](./DEMO.md) for detail.

## What is mock or static today

| Data | Source | Used in |
|------|--------|---------|
| `dashboardKPIs` (financial strings) | `mockData.ts` | Dashboard KPI cards (except corn/cattle) |
| `monthlyFinancials` | `mockData.ts` | Chart, Reports |
| `expenseCategories` | `mockData.ts` | Expense breakdown, Reports |
| `customers` | `mockData.ts` | Customers page |
| `plots`, `livestock` | `domains/agro/mockData.ts` | Crop/Livestock tables, partial Dashboard KPIs |
| `initialRevenueRecords` / `initialExpenseRecords` | `domains/financial/mockData.ts` | Revenue/Expenses pages (per-session) |
| `initialReceivableRecords` | `domains/financial/mockData.ts` | App seed → AR page (mutable until refresh) |
| `aiInsights` | `domains/agro/mockData.ts` | AI panel |
| Dashboard `ReceivablesTable` | Static export from `mockData.ts` | Does not follow AR page payments |

Non-functional UI placeholders:

- Dashboard “This Month” and “Export Report”
- Customers “Add Customer”
- Reports “Export” button
- Settings sidebar item
- “Last updated” on AI panel

## What is computed or interactive (still client-only)

- Revenue and Expenses KPIs, filters, sort, Add modals (`useFinancialData`)
- AR KPIs, filters, sort, Record Payment, Add Invoice, CSV export (App state)
- Agro KPIs for corn tons and cattle head count on Dashboard
- Reports P&L when switching months (Jan–Jun)
- CSV import/export on Export/Import page

## What should eventually become dynamic

- All KPI values from one organization’s transactions and agro records
- Unified state across Dashboard, Reports, Revenue, Expenses, and AR
- Chart and P&L from database aggregates
- AI insights from an API with real metrics
- Persistence across refresh, users, and organizations

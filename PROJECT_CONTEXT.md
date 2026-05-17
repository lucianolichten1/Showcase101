# Project context

## Business idea

We are building an **AI-powered financial and agro management SaaS** for agricultural businesses in Latin America (starting in Bolivia). Think of it as a simpler, industry-specific alternative to QuickBooks — designed for owners who manage:

- Crop production (e.g. corn on multiple plots)
- Livestock (cattle and related costs)
- Mixed farm expenses (feed, fertilizer, labor, transport, veterinary, fuel)
- Customer receivables and cash flow

The product should eventually support P&L reporting, accounts receivable, Excel import/export, AI business insights, crop/land tracking, livestock tracking, expense analytics, role-based permissions, authentication, bank integrations, and modular agro features.

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
6. **What should the owner pay attention to?** (AI-style insights — currently static demo text)

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

## What is currently mock data

Everything on the dashboard is static. See `src/data/mockData.ts`:

| Data | Used in |
|------|---------|
| `dashboardKPIs` | KPI cards on `DashboardPage` |
| `monthlyFinancials` | `FinancialChart` |
| `cropPlots` | `CropTable` |
| `livestockGroups` | `LivestockTable` |
| `expenseCategories` | `ExpenseBreakdown` |
| `receivables` | `ReceivablesTable` |
| `aiInsights` | `AIInsightsPanel` |

Also mock / non-functional UI:

- “This Month” date selector (no logic)
- “Export Report” button (no download)
- “Last updated: Today, 08:42 AM” (hardcoded)

## What should eventually become dynamic

- All KPI values computed from transactions and agro records
- Chart data from monthly aggregates in a database
- Tables loaded per organization with filters (date range, plot, group)
- Receivables synced from invoices / payments
- AI insights generated via API from real metrics
- User-specific org, permissions, and audit trail

# Financial domain

Isolated financial data layer for Revenue, Expenses, and Accounts Receivable. No database yet — all records live in React state seeded from `mockData.ts`.

## Record types

| Type | File field | Purpose |
|------|------------|---------|
| `RevenueRecord` | `date` (ISO), `sourceClient`, `productService`, `category`, `status`, … | Sales income lines |
| `ExpenseRecord` | `date` (ISO), `category`, `description`, `vendor`, `status`, … | Operational costs |
| `ReceivableRecord` | `dueDate` (display), `customer`, `amount`, `amountPaid`, `overdueDays`, … | Outstanding invoices |

All revenue and expense rows extend `FinancialTransaction` (`id`, `date`, `amount`, `currency`).

## Mock data

- `initialRevenueRecords` — 10 demo revenue lines
- `initialExpenseRecords` — 10 demo expense lines
- `initialReceivableRecords` — 8 demo AR invoices

Legacy imports: `src/data/revenue.ts`, `src/data/expenses.ts`, and `receivables` in `src/data/mockData.ts` re-export from this domain.

## KPIs (`calculations.ts`)

KPIs are **derived from records**, never hardcoded:

- **Revenue:** `totalRevenue` (excludes Cancelled), `collectedRevenue`, `pendingRevenue`, `overdueRevenue`, `topRevenueCategory`
- **Expenses:** `totalExpenses`, `paidExpenses`, `pendingExpenses`, `overdueExpenses`, `largestExpenseCategory`
- **Profit:** `netProfit` = total revenue − total expenses; `profitMargin` = net / total revenue (%)
- **Receivables:** outstanding balance, overdue amount, invoice count, collection rate

Use `computeFinancialKPIs(revenue, expenses, receivables)` for the full bundle.

## Date range

`DateRange` has optional `startDate` / `endDate` (ISO strings). `filterRecordsByDateRange` applies to revenue and expense rows. Default in the hook is `2026-01-01` → `2026-12-31`.

**UI note:** Pages do not expose date-range controls yet. Revenue and Expenses tables apply the same date filter as KPIs before search/category/status filters and sorting.

Receivable rows use display due dates (`"May 10"`) and are not date-range filtered in the hook.

## Hook: `useFinancialData`

Returns record state, setters, `dateRange` / `setDateRange`, date-filtered revenue/expense slices, and `kpis`.

Revenue and Expenses pages each call the hook independently. Accounts Receivable still receives receivable state from `App.tsx` (shared with Customers) but uses `calculations.ts` for KPIs.

## Future API / database

1. Replace `mockData.ts` seeds with fetch/loaders in `hooks.ts`.
2. Keep `types.ts` and `calculations.ts` unchanged — they become the client contract.
3. Map API DTOs → `RevenueRecord` / `ExpenseRecord` / `ReceivableRecord` at the boundary.
4. Centralize receivable state in a provider or App-level hook when Customers and AR must stay in sync.

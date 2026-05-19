# Financial domain

Financial data layer for Revenue, Expenses, and Accounts Receivable.

**No database** — records are seeded from `mockData.ts` into React state. Persistence is session-only (lost on full page refresh except where App-level state applies).

## Record types

| Type | Key fields | Purpose |
|------|------------|---------|
| `RevenueRecord` | ISO `date`, `sourceClient`, `productService`, `category`, `status`, … | Sales income lines |
| `ExpenseRecord` | ISO `date`, `category`, `description`, `vendor`, `status`, … | Operating costs |
| `ReceivableRecord` | `dueDate` (display), `customer`, `amount`, `amountPaid`, `overdueDays`, … | Outstanding invoices |

Revenue and expense rows extend `FinancialTransaction` (`id`, `date`, `amount`, `currency`).

## Mock data (`mockData.ts`)

- `initialRevenueRecords` — 10 demo lines
- `initialExpenseRecords` — 10 demo lines
- `initialReceivableRecords` — 8 demo AR invoices
- `defaultDateRange` — `2026-01-01` … `2026-12-31` (used by hook; no date UI on pages yet)

**Legacy re-exports:** `src/data/revenue.ts`, `src/data/expenses.ts`, and `receivables` in `src/data/mockData.ts` point here for backward compatibility. Page components import from `@/domains/financial/` directly.

## KPIs (`calculations.ts`)

Derived from records, not hardcoded:

- **Revenue:** `totalRevenue` (excludes Cancelled), `collectedRevenue`, `pendingRevenue`, `overdueRevenue`, `topRevenueCategory`
- **Expenses:** `totalExpenses`, `paidExpenses`, `pendingExpenses`, `overdueExpenses`, `largestExpenseCategory`
- **Profit:** `netProfit`, `profitMargin`
- **Receivables:** outstanding, overdue amount, overdue count, collection rate

`computeFinancialKPIs(revenue, expenses, receivables)` returns the full bundle.

Sorting: `sortRevenueRecords`, `sortExpenseRecords`.

## Date range

`DateRange` optional ISO `startDate` / `endDate`. `filterRecordsByDateRange` applies to revenue and expense rows in the hook.

Receivable rows use display due dates (`"May 10"`) and are **not** date-range filtered in the hook.

## Hook: `useFinancialData`

Returns record state, setters, `dateRange` / `setDateRange`, filtered revenue/expense slices, and `kpis`.

| Consumer | How receivables are handled |
|----------|----------------------------|
| `RevenuePage` | Own hook instance; revenue + expense state |
| `ExpensesPage` | Own hook instance (separate from Revenue) |
| `AccountsReceivablePage` | Receivables from **App.tsx** props; KPIs via `calculations.ts` |
| `CustomersPage` | Receivables from App props for risk/outstanding |

Add Revenue / Add Expense update the **page-local** hook state only. Record Payment on AR updates **App** state via `onUpdateReceivable`.

## Pages

| Route | Domain usage |
|-------|----------------|
| `/revenue` | `useFinancialData`, filters, sort, Add Revenue |
| `/expenses` | `useFinancialData`, filters, sort, Add Expense |
| `/accounts-receivable` | Calculations + types; state from App |

Dashboard financial KPIs and Reports P&L are **not** wired to this hook yet.

## Future API / database

1. Replace seeds with fetch/loaders in `hooks.ts` (or a provider).
2. Keep `types.ts` and `calculations.ts` as the client contract.
3. Map API DTOs → domain records at the boundary.
4. Centralize receivable + revenue + expense state when Dashboard and Reports must stay in sync.

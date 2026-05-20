# Financial domain

Revenue, expenses, and KPI calculations. **Active financial records come from Excel import** via `FinancialDataProvider`; without import, arrays are empty (mock seeds are not shown in the UI).

## Provider (`FinancialDataContext.tsx`)

Wrapped in `main.tsx` around the app.

| State | Source |
|-------|--------|
| `importedData` | `localStorage` `agro-import-data` |
| `revenueRecords` | Derived from `importedData.sales` when `usesImportedData` |
| `expenseRecords` | Derived from `importedData.expenses` when `usesImportedData` |
| `receivableRecords` | Demo seed `initialReceivableRecords` (AR page) |
| `dateRange` | Period filter (All / YTD / Month) |

`usesImportedData` = `sales.length > 0 || expenses.length > 0`.

## Hooks

- `useFinancialData()` — records, filtered slices, KPIs, import actions.
- `useSyncFinancialPeriod(period, setDateRange)` — keep shared `dateRange` aligned with page period controls.

## Period (`period.ts`)

| Mode | Behavior |
|------|----------|
| `all` | No date filter on records; chart uses last **12** month buckets |
| `ytd` | Current calendar year, Jan 1 → today |
| `month` | Specific year + month (`YYYY-MM` input) |

## KPIs (`calculations.ts`)

`computeFinancialKPIs(filteredRevenue, filteredExpenses, receivables)` — all derived from records.

Chart: `computeMonthlyFinancials()` with `useDataDrivenMonths: true` when imported; X-axis labels **MM/YY**.

## Mock data (`mockData.ts` in this folder)

`initialRevenueRecords` / `initialExpenseRecords` remain for dev/reference but are **not** the default UI source. Receivables still seed AR demo.

## Pages using this domain

- `DashboardPage`, `FinancialChart`, `ExpenseBreakdown`
- `ExpensesPage`, `RevenuePage`, `ReportsPage`
- `ExcelImportWizard` → `applyImportedData`

## Future API

Keep `types.ts` and `calculations.ts` as the client contract; replace provider internals with fetch + same shapes.

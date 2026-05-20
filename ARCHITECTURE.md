# Architecture

## Runtime shell

```
index.html
  └── src/main.tsx
        ├── BrowserRouter
        └── FinancialDataProvider
              └── App.tsx (Routes)
                    ├── DashboardPage
                    ├── ExportImportPage (+ ExcelImportWizard)
                    ├── ExpensesPage | RevenuePage | ReportsPage
                    └── CustomersPage | AccountsReceivablePage
```

- **Routing:** React Router v7 (`src/App.tsx`, paths in `src/config/navigation.ts`)
- **Financial state:** React Context — not Redux/Zustand
- **Path alias:** `@/` → `src/`

> **Note:** [docs/adr/0001-useState-routing.md](./docs/adr/0001-useState-routing.md) described early `useState` routing; the app now uses React Router.

## Financial data flow (import-first)

```
localStorage: agro-import-data
        │
        ▼
FinancialDataProvider
  ├── importedData (sales[], expenses[])
  ├── revenueRecords  ← salesToRevenueRecords() when usesImportedData
  ├── expenseRecords  ← importExpensesToFinancial() when usesImportedData
  ├── dateRange       ← period filter (All / YTD / Month)
  ├── filtered*Records
  └── kpis            ← computeFinancialKPIs()
        │
        ├── DashboardPage / FinancialChart
        ├── ExpensesPage / RevenuePage
        └── ReportsPage
```

**Import path:**

```
.xlsx file
  → parseWorkbook / runImportFromWorkbook (domains/import)
  → applyImportedData → mergeImportedData → save localStorage
  → provider state update
```

## Operations / demo data flow

```
src/data/mockData.ts          ← customers, receivables (App state)
src/domains/agro/mockData.ts  ← plots, livestock
Dashboard widgets             ← CropTable, LivestockTable, AIInsightsPanel (static)
```

These are **not** tied to Excel import in the current MVP.

## Domain folders

| Folder | Responsibility |
|--------|----------------|
| `src/domains/financial/` | Types, calculations, period, `FinancialDataContext`, hooks |
| `src/domains/import/` | Excel parse, map, normalize, merge, storage |
| `src/domains/agro/` | Crop/livestock demo types and data |
| `src/components/` | Pages and UI |
| `src/lib/csv.ts` | Legacy CSV helpers (Export/Import page) |

## Key components

| Component | Responsibility |
|-----------|----------------|
| `FinancialDataProvider` | Single source of truth for imported financial records |
| `ExcelImportWizard` | Upload, map, import Excel |
| `FinancialPeriodFilter` | All / YTD / Month+year |
| `FinancialChart` | Recharts bar chart; max 12 months; MM/YY axis |
| `DashboardPage` | KPIs + chart + operations widgets |

## Styling

- Tailwind CSS v4 (`@tailwindcss/vite`)
- Global: `src/index.css`
- Icons: `lucide-react`
- `cn()` in `src/lib/utils.ts`

## Suggested future architecture

```
React SPA
  ├── Auth (Supabase or similar)
  ├── API / Supabase Postgres
  │     organizations, transactions, imports
  └── Edge/worker for heavy Excel parse (optional)
```

### Suggested tables (unchanged direction)

See prior sections in this file for `organizations`, `transactions`, `customers`, `invoices`, `agro_plots`, `agro_livestock_groups`, etc. Import jobs might add:

**import_batches**
- `id`, `organization_id`, `file_name`, `imported_at`, `row_counts`, `mapping_snapshot` (jsonb)

Tenant rows should use `organization_id` + RLS.

## localStorage (current persistence)

| Key | Purpose |
|-----|---------|
| `agro-import-data` | Merged sales + expenses |
| `agro-import-mapping` | Column mapping template |
| `agro-import-history` | Recent import log |

Replace with API persistence in a later phase; keep client types stable.

# Architecture

## Current frontend architecture

```
index.html
    └── src/main.tsx              (BrowserRouter + ReactDOM.createRoot)
            └── App.tsx           (Routes, App-level receivables + customers state)
                    └── AppLayout (Sidebar + <Outlet />)
                            ├── DashboardPage
                            ├── CustomersPage
                            ├── AccountsReceivablePage
                            ├── ExportImportPage
                            ├── ExpensesPage
                            ├── RevenuePage
                            └── ReportsPage
```

- **Pattern:** Page components + domain hooks/calculations + static or App-level state
- **Routing:** React Router v7 (`react-router-dom`) — URL paths, refresh-safe in dev
- **Global state:** Minimal — receivables and customers in `App.tsx`; no Redux/Zustand
- **Path alias:** `@/` → `src/` (Vite + TypeScript)

## Component structure

| Component | Responsibility |
|-----------|----------------|
| `AppLayout` | Sidebar (desktop + mobile), main column with `<Outlet />` |
| `Sidebar` / `SidebarNavItem` | Navigation from `config/navigation.ts`; Settings disabled |
| `DashboardPage` | KPI grid, chart, agro tables, expense breakdown, AR snapshot, AI panel |
| `CustomersPage` | Customer registry; receivables from App props |
| `AccountsReceivablePage` | AR table, KPIs, aging, Record Payment, Add Invoice, CSV export |
| `ExportImportPage` | CSV import pipeline, recent imports, export cards (UI) |
| `ExpensesPage` | Expense table, KPIs, filters, Add Expense (`useFinancialData`) |
| `RevenuePage` | Revenue table, KPIs, filters, Add Revenue (`useFinancialData`) |
| `ReportsPage` | P&L, monthly trend, month selector |
| `KPICard`, `FinancialChart`, etc. | Dashboard widgets |

## Domain modules

### Financial (`src/domains/financial/`)

| File | Role |
|------|------|
| `types.ts` | `RevenueRecord`, `ExpenseRecord`, `ReceivableRecord`, categories, sort keys |
| `mockData.ts` | Seed records (10 revenue, 10 expense, 8 receivables) |
| `calculations.ts` | KPI helpers, date-range filter, sort functions |
| `hooks.ts` | `useFinancialData()` — local state + filtered slices + KPIs |

Used by: `RevenuePage`, `ExpensesPage`, `AccountsReceivablePage` (calculations + types). Receivable **state** for AR and Customers lives in `App.tsx`, seeded from `initialReceivableRecords`.

### Agro (`src/domains/agro/`)

| File | Role |
|------|------|
| `types.ts` | `Plot`, `Livestock`, `Shipment`, `ExportImportRecord`, `AgroKPIs` |
| `mockData.ts` | Plots, livestock, shipments, import seeds, AI insight strings |
| `calculations.ts` | Plot/livestock/shipment KPIs, date-range filters |
| `hooks.ts` | `useAgroData()` — filtered shipments/imports + full-dataset KPIs |

Used by: `DashboardPage` (partial KPIs), `CropTable`, `LivestockTable`, `AIInsightsPanel`, `ReportsPage`, `ExportImportPage` (seed imports).

## Data flow (today)

```
domains/financial/mockData.ts
        │
        ├── useFinancialData() ──► RevenuePage / ExpensesPage (independent instances)
        └── initialReceivableRecords ──► App.tsx state ──► AccountsReceivablePage, CustomersPage

domains/agro/mockData.ts
        │
        ├── useAgroData() ──► DashboardPage (corn + cattle KPIs only)
        ├── plots ──────────► CropTable, ReportsPage (revenue lines)
        ├── livestock ──────► LivestockTable
        ├── aiInsights ─────► AIInsightsPanel
        └── exportImportRecords ──► ExportImportPage (seed)

src/data/mockData.ts
        │
        ├── dashboardKPIs ──────► DashboardPage → KPICard (mostly static strings)
        ├── monthlyFinancials ──► FinancialChart, ReportsPage
        ├── expenseCategories ──► ExpenseBreakdown, ReportsPage
        ├── receivables ────────► ReceivablesTable (static; NOT App state)
        └── customers ──────────► CustomersPage (+ App receivables for risk)
```

**Gaps:** Dashboard financial KPIs and receivables table are not wired to live domain/App state. Revenue and Expenses do not share one hook instance.

## Routing

Defined in `src/App.tsx`:

| Path | Component |
|------|-----------|
| `/` | Redirect → `/dashboard` |
| `/dashboard` | `DashboardPage` |
| `/export-import` | `ExportImportPage` |
| `/expenses` | `ExpensesPage` |
| `/revenue` | `RevenuePage` |
| `/accounts-receivable` | `AccountsReceivablePage` |
| `/reports` | `ReportsPage` |
| `/customers` | `CustomersPage` |

Settings: sidebar-only in `navigation.ts` (no route). `/settings` renders an empty outlet.

## Mock data explanation

Demo data simulates a Bolivian agro business:

- ~Bs 185k monthly revenue, ~Bs 128k expenses (May in `monthlyFinancials`)
- Three corn plots (agro domain), three livestock groups
- Ten revenue and ten expense lines (financial domain)
- Eight receivable invoices (financial domain seed → App state on AR page)
- Eight customers in `mockData.ts`
- Static AI insight sentences (agro `mockData.ts`)

Legacy `cropPlots` / `livestockGroups` in `mockData.ts` are unused; agro domain is canonical.

Types: `src/data/types.ts` (shared UI types + `Receivable` alias), domain types in `domains/*/types.ts`.

## Styling system

- **Tailwind CSS v4** via `@tailwindcss/vite` plugin
- Global styles: `src/index.css` (`@import "tailwindcss"`)
- **Design tokens:** Stone palette, green accents (`green-700`, `green-800`), off-white page background `#FBFBF9`
- **Icons:** `lucide-react`
- **Utility:** `cn()` in `src/lib/utils.ts` (clsx + tailwind-merge)

## Hardcoded or session-only values

| Location | What |
|----------|------|
| `mockData.ts` → `dashboardKPIs` | Financial KPI card strings (revenue, expenses, profit, AR) |
| `DashboardPage` | Header “This Month”, Export Report button |
| `AIInsightsPanel` | “Last updated” timestamp |
| `ReceivableRecord.dueDate` | Display strings like `"May 10"` (not ISO) |
| `useFinancialData` per page | Revenue/Expense adds lost on refresh |
| `App.tsx` receivables | AR payments lost on full refresh |
| Export/Import | Confirmed imports in component state only |

## Suggested future architecture

```
┌─────────────────────────────────────────────────────────┐
│  React SPA (Vite)                                       │
│  ├── routes in App.tsx (or pages/)                      │
│  ├── components/                                        │
│  ├── domains/ (financial, agro) + API loaders           │
│  └── lib/ (supabase client, formatters, csv)            │
└──────────────────────────┬──────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────┐
│  Supabase                                               │
│  ├── Auth (users, sessions)                             │
│  ├── Postgres (tables below)                            │
│  ├── RLS (organization_id on all tenant data)           │
│  └── Edge Functions (AI insights, Excel parse)          │
└─────────────────────────────────────────────────────────┘
```

Optional later: separate API service if logic outgrows Edge Functions.

## Suggested database tables (Supabase / Postgres)

### Core tenancy

**organizations**
- `id` (uuid, PK)
- `name`, `slug`, `currency`, `created_at`

**users**
- `id` (uuid, PK, links to auth.users)
- `email`, `full_name`, `created_at`

**organization_members**
- `id`, `organization_id`, `user_id`, `role` (owner | manager | viewer)
- Unique `(organization_id, user_id)`

### Finance

**categories**
- `id`, `organization_id`, `name`, `type` (income | expense), `parent_id`

**transactions**
- `id`, `organization_id`, `category_id`, `amount`, `date`, `description`, `reference`
- Optional: `plot_id`, `livestock_group_id` for allocation

**customers**
- `id`, `organization_id`, `name`, `contact_info`

**invoices**
- `id`, `organization_id`, `customer_id`, `amount`, `issued_at`, `due_at`, `status`

**receivables**
- `id`, `organization_id`, `invoice_id`, `amount_due`, `due_date`, `status`, `paid_at`

### Agro

**agro_plots**
- `id`, `organization_id`, `name`, `hectares`, `location`, `notes`

**agro_crop_cycles**
- `id`, `organization_id`, `plot_id`, `crop`, `season`, `expected_yield`, `actual_yield`, `revenue`, `cost`

**agro_livestock_groups**
- `id`, `organization_id`, `name`, `species`, `count`, `avg_weight`

**agro_costs**
- `id`, `organization_id`, `transaction_id` or standalone, `plot_id`, `livestock_group_id`, `cost_type`

### AI

**ai_insights**
- `id`, `organization_id`, `period_start`, `period_end`, `content` (jsonb), `model`, `created_at`

All tenant tables should include `organization_id` and RLS policies restricting rows to the user’s org memberships.

## Related docs

- [docs/adr/0001-useState-routing.md](./docs/adr/0001-useState-routing.md) — superseded
- [docs/adr/0002-react-router.md](./docs/adr/0002-react-router.md) — current routing decision

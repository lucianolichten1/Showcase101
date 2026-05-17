# Architecture

## Current frontend architecture

```
index.html
    └── src/main.tsx          (ReactDOM.createRoot)
            └── App.tsx
                    └── DashboardPage.tsx   (page layout)
                            ├── KPICard × N
                            ├── FinancialChart
                            ├── AIInsightsPanel
                            ├── CropTable | LivestockTable | ExpenseBreakdown
                            └── ReceivablesTable
```

- **Pattern:** Presentational components + static data imports
- **No router:** Single view only
- **No global state:** No Redux, Zustand, or Context yet
- **Path alias:** `@/` → `src/` (Vite + TypeScript)

## Component structure

| Component | Responsibility |
|-----------|----------------|
| `DashboardPage` | Page shell, header, grid layout, maps KPIs from data |
| `KPICard` | One metric with trend indicator |
| `FinancialChart` | Recharts bar chart (revenue vs expenses) |
| `CropTable` | Corn plots table |
| `LivestockTable` | Cattle groups table |
| `ExpenseBreakdown` | Horizontal bar list by category |
| `ReceivablesTable` | AR with overdue badges |
| `AIInsightsPanel` | Static insight cards |
| `ui/card` | Reusable card primitives (shadcn-style, minimal use) |

## Data flow (today)

```
src/data/mockData.ts
        │
        ├── dashboardKPIs ──────────► DashboardPage → KPICard
        ├── monthlyFinancials ──────► FinancialChart
        ├── cropPlots ────────────────► CropTable
        ├── livestockGroups ──────────► LivestockTable
        ├── expenseCategories ────────► ExpenseBreakdown
        ├── receivables ──────────────► ReceivablesTable
        └── aiInsights ───────────────► AIInsightsPanel
```

To change demo numbers, edit **`src/data/mockData.ts`** first.

## Mock data explanation

Mock data simulates a Bolivian agro business with:

- ~Bs 185k monthly revenue, ~Bs 128k expenses
- Three corn plots (A, B, C)
- Three livestock groups (cows, calves, bulls)
- Seven expense categories
- Three receivable customers (two overdue)
- Four static AI insight sentences

Types live in `src/data/types.ts` to prepare for API responses later.

## Styling system

- **Tailwind CSS v4** via `@tailwindcss/vite` plugin
- Global styles: `src/index.css` (`@import "tailwindcss"`)
- **Design tokens:** Stone palette, green accents (`green-700`, `green-800`), off-white page background `#FBFBF9`
- **Icons:** `lucide-react`
- **Utility:** `cn()` in `src/lib/utils.ts` (clsx + tailwind-merge)

## Hardcoded values to make dynamic later

| Location | What |
|----------|------|
| `DashboardPage` | Header title, period label, export button |
| `mockData.ts` | All business numbers |
| `AIInsightsPanel` | “Last updated” timestamp |
| `FinancialChart` | Y-axis `Bs Xk` formatter |
| `ReceivablesTable` | Due dates as display strings |

## Suggested future architecture

```
┌─────────────────────────────────────────────────────────┐
│  React SPA (Vite)                                       │
│  ├── pages/ (dashboard, settings, imports)              │
│  ├── components/                                        │
│  ├── hooks/ (useOrg, useTransactions, useInsights)    │
│  └── lib/ (supabase client, formatters)                 │
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

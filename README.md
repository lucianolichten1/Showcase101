# Agro Dashboard MVP

A browser-based MVP for agro and export businesses. **Financial KPIs, charts, expenses, and reports are driven by flexible Excel import** — the app starts empty until the user imports `.xlsx` workbooks. Operations sections (crops, livestock, customers, receivables) still use demo data for the meeting UI.

**Currency:** Bolivianos (`Bs`) in labels and formatting.

## Project overview

This product demonstrates:

1. **Excel-first onboarding** — any `.xlsx` workbook with Sales and/or Expenses sheets, mapped by the user (no fixed template).
2. **Local persistence** — imported rows, column mappings, and import history survive refresh in `localStorage`.
3. **Multi-file merge** — importing 2025 then 2026 **adds** to the active dataset; duplicates are skipped by stable row keys.
4. **Unified financial views** — Dashboard, Expenses, Revenue, and Reports read the same imported dataset via `FinancialDataProvider`.

There is **no backend**, **no database**, and **no authentication** in this version.

## Tech stack

| Layer | Technology |
|-------|------------|
| Framework | React 19 + TypeScript |
| Build | Vite 6 |
| Styling | Tailwind CSS v4 |
| Charts | Recharts |
| Excel | `xlsx` (SheetJS) |
| Routing | React Router v7 (`BrowserRouter` in `main.tsx`) |
| Financial state | React Context (`FinancialDataProvider`) |

## Prerequisites

- Node.js 18+ (20+ recommended)
- npm

## Development commands

```bash
npm install
npm run dev          # http://localhost:3000
npm run lint         # TypeScript check (tsc --noEmit)
npm run build        # production build → dist/
npm run preview      # serve production build
npm run test:import-dates   # Excel/date parsing unit checks
npm run test:import-merge   # import merge/dedupe unit checks
```

No API keys required.

## Routes

| Path | Page | Financial data |
|------|------|----------------|
| `/dashboard` | Dashboard | Imported KPIs + chart (empty until import) |
| `/export-import` | Export / Import | Excel wizard + CSV legacy UI + recent imports |
| `/expenses` | Expenses | Imported expenses when active |
| `/revenue` | Revenue | Imported sales as revenue rows |
| `/reports` | Reports | P&L + trend from imported data |
| `/accounts-receivable` | Accounts Receivable | Demo receivables (`App.tsx` state) |
| `/customers` | Customers | Demo customers + receivables |
| Settings (sidebar) | — | Not routed (`href: "#"`) |

## Current working features

### Financial (import-driven)

- **Empty default state** — no mock revenue/expense on Dashboard, Expenses, Revenue, or Reports until Excel import.
- **Flexible Excel `.xlsx` import** — `ExcelImportWizard` on Export/Import.
- **Sheet preview** — workbook sheets and column headers.
- **Column mapping** — per sheet: Sales, Expenses, or Ignore; map required/optional fields.
- **Saved mappings** — reused on the next import (`agro-import-mapping`).
- **Import history / Recent imports** — each file listed with row counts and dedupe stats.
- **Merge on import** — new files append to `agro-import-data`; duplicates skipped.
- **Clear import** — removes all imported data, history, and mapping persistence; financial pages return to empty.
- **Dashboard** — KPIs, monthly chart (max 12 months on chart; “All” shows last 12), period filter (All / YTD / Month+Year).
- **Expenses / Revenue pages** — tables and KPIs from imported records; period filter shared via context.
- **Reports** — summary KPIs, P&L, monthly trend when imported data exists.

### Operations (demo / partial)

- **Dashboard operations** — corn plots, livestock, expense breakdown (from imported expenses when active), receivables table, static AI insights.
- **Customers & AR** — demo data in `mockData.ts` / `App.tsx` state (not from Excel import yet).

### Export/Import extras

- Legacy **CSV** upload area (separate from Excel wizard; does not feed financial provider).
- Export report cards — UI placeholders.

## Excel import flow

1. Open **Export / Import** (`/export-import`).
2. In **Excel financial import**, upload a `.xlsx` workbook.
3. Preview sheets; for each sheet choose role: **Sales**, **Expenses**, or **Ignore**.
4. Map columns to fields (required fields must be assigned).
5. Click **Import** — data merges into the active dataset; mapping and history are saved.
6. Open **Dashboard** — KPIs and chart populate from imported rows.
7. On a later visit, upload another year’s file — data **merges**; saved mapping pre-fills column choices.
8. **Clear import** (wizard) resets financial data and history.

Implementation lives under `src/domains/import/` and `src/components/ExcelImportWizard.tsx`.

## Supported mapped fields

Internal models: `SalesRecord`, `ImportExpenseRecord` → converted to `RevenueRecord` / `ExpenseRecord`.

### Sales (required)

| Field | Purpose |
|-------|---------|
| `date` | ISO date after normalization |
| `revenue` | Amount |

### Sales (optional)

| Field | Purpose |
|-------|---------|
| `customerName` | Client name |
| `product` | Product / service |
| `quantity` | Numeric quantity |
| `cost` | COGS for gross profit |

### Expenses (required)

| Field | Purpose |
|-------|---------|
| `date` | ISO date |
| `amount` | Expense amount |

### Expenses (optional)

| Field | Purpose |
|-------|---------|
| `category` | Category label |
| `description` | Line description |
| `vendor` | Vendor / payee |

## Multi-file import behavior

- Importing **2025** then **2026** builds **one** combined dataset in `agro-import-data`.
- **All records** period — KPIs/tables use full imported range; chart shows **last 12 months** max.
- **Month** period — uses `<input type="month">` (year + month); January 2025 and January 2026 are distinct.
- **YTD** — current calendar year, Jan 1 through today.
- **Re-importing the same file** — duplicate rows skipped (stable keys on date, amounts, customer, etc., not generated ids).
- **Clear import** — wipes data, history, and returns UI to empty financial state.

Dedupe logic: `src/domains/import/merge.ts`.

## LocalStorage

| Key | Contents |
|-----|----------|
| `agro-import-data` | Combined `{ sales, expenses, importedAt, sourceFileName? }` |
| `agro-import-mapping` | Saved sheet/column mapping for reuse |
| `agro-import-history` | Recent import events (up to 20) |

- Survives browser refresh.
- **Clear import** removes `agro-import-data` and `agro-import-history` (mapping may remain until overwritten).

Defined in `src/domains/import/storage.ts` as `IMPORT_STORAGE_KEYS`.

## Financial data flow

```
ExcelImportWizard
    → runImportFromWorkbook() → ImportedData
    → FinancialDataProvider.applyImportedData()
        → mergeImportedData(existing, incoming)
        → saveImportedData + saveImportMapping + history
    → revenueRecords / expenseRecords (derived from importedData)
    → filterRecordsByDateRange(dateRange)
    → Dashboard, FinancialChart, ExpensesPage, ReportsPage, RevenuePage
```

- `usesImportedData` is true when `sales` or `expenses` arrays are non-empty.
- Without import: financial record arrays are **empty** (not mock).
- Mock seeds remain in `src/domains/financial/mockData.ts` for development/receivables only.

## Project structure

```
├── README.md
├── DEMO.md                 ← customer meeting script
├── ARCHITECTURE.md
├── ROADMAP.md
├── TODO.md
├── PROJECT_CONTEXT.md
├── src/
│   ├── main.tsx            ← BrowserRouter + FinancialDataProvider
│   ├── App.tsx             ← React Router routes
│   ├── config/navigation.ts
│   ├── components/
│   │   ├── DashboardPage.tsx
│   │   ├── ExcelImportWizard.tsx
│   │   ├── ExportImportPage.tsx
│   │   ├── FinancialChart.tsx
│   │   └── …
│   ├── domains/
│   │   ├── financial/      ← context, calculations, period, hooks
│   │   ├── import/         ← parse, map, merge, storage
│   │   └── agro/           ← crop/livestock demo data
│   └── data/mockData.ts    ← dashboard layout KPIs template, AR, customers, ops
└── docs/adr/
```

## Testing checklist

Manual:

- [ ] Fresh browser / clear import → Dashboard shows empty financial state + import banner
- [ ] Import 2025 Excel file → Dashboard KPIs and chart update
- [ ] Import 2026 Excel file → combined 2025+2026 data
- [ ] Period **All** → chart shows at most last 12 months (MM/YY labels)
- [ ] Period **Month** → select 2025 month vs 2026 month; data matches
- [ ] Expenses page lists imported expenses
- [ ] Reports P&L and trend when imported
- [ ] Refresh page → data persists
- [ ] Re-import same 2025 file → duplicates skipped; history shows new/duplicate counts
- [ ] Clear import → empty financial state; history cleared

Automated:

```bash
npm run lint
npm run build
npm run test:import-dates
npx tsx src/domains/import/merge.test.ts
```

## Known limitations / next steps

- **Customers** — not imported from Excel; demo list only.
- **Accounts Receivable** — demo data; no AR sheet mapping.
- **Inventory** — not implemented.
- **Operations** — crops, livestock, static AI insights use demo/static data.
- **No Supabase / API** — browser-only persistence.
- **No authentication** or multi-tenant orgs.
- **CSV path** on Export/Import does not merge into financial dataset (Excel wizard does).
- **Reports P&L** — category breakdown is simplified for imported data; may need customer-specific COGS rules later.
- **Settings** — sidebar only.
- **Add Expense / Add Revenue** — only persist when import is already active (updates merged store).

See [ROADMAP.md](./ROADMAP.md) and [TODO.md](./TODO.md).

## Customer demo (short)

1. Show **empty Dashboard** — “starts clean.”
2. **Export / Import** → upload customer Excel → map columns (no rigid template).
3. **Dashboard** fills — KPIs + chart.
4. **Expenses** and **Reports** — same data.
5. Optional: second file (another year) → merged dataset.
6. **Clear import** → back to empty.

Full script: **[DEMO.md](./DEMO.md)**.

## Related documentation

| File | Purpose |
|------|---------|
| [DEMO.md](./DEMO.md) | Presenter walkthrough |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Technical layout and future DB sketch |
| [PROJECT_CONTEXT.md](./PROJECT_CONTEXT.md) | Business vision |
| [src/domains/financial/README.md](./src/domains/financial/README.md) | Financial domain |
| [src/domains/import/README.md](./src/domains/import/README.md) | Import domain |
| [docs/adr/0001-useState-routing.md](./docs/adr/0001-useState-routing.md) | Historical routing ADR (superseded) |

## License

Apache-2.0 (see SPDX headers in source files).

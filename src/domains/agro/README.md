# Agro domain

Agricultural and operations data for the Agro Dashboard MVP. Parallel structure to `src/domains/financial/`.

**No database** — all records are static mock arrays; hooks filter in memory only.

## Entities

| Entity | File | Description |
|--------|------|-------------|
| `Plot` | `types.ts` | Crop field with yield, revenue, cost, profit, season, status |
| `Livestock` | `types.ts` | Animal group (head count, feed/vet costs, herd value) |
| `Product` | `types.ts` | Tradeable commodity with unit price |
| `Shipment` | `types.ts` | Delivery with status and expected revenue |
| `ExportImportRecord` | `types.ts` | File uploaded or exported on Export/Import page |
| `AgroKPIs` | `types.ts` | Computed KPI shape from `computeAgroKPIs()` |

## Mock data (`mockData.ts`)

- **3 plots** — Plot A/B (harvested), Plot C (active)
- **3 livestock groups** — Adult Cows (92), Calves (54), Bulls (40)
- **8 shipments** — Jan–Jun 2026 (Delivered / In Transit / Pending)
- **3 export/import records** — seed rows for Recent Imports on Export/Import page
- **4 AI insights** — static strings for Dashboard panel

Legacy `cropPlots` / `livestockGroups` in `src/data/mockData.ts` are **unused**; this module is canonical.

## KPI calculations (`calculations.ts`)

Computed from records (not hardcoded strings):

| KPI | Formula |
|-----|---------|
| `totalActualYieldTons` | `sum(plot.actualYield)` |
| `totalHeadCount` | `sum(livestock.count)` |
| `totalLivestockValue` | `sum(livestock.estimatedValue)` |
| `totalCropRevenue` | `sum(plot.revenue)` |
| `shipmentsInTransit` | count where `status === "In Transit"` |
| `shipmentsDelivered` | count where `status === "Delivered"` |

## Hook (`hooks.ts`)

```ts
const {
  plots,
  livestock,
  shipments,
  exportImportRecords,
  aiInsights,
  kpis,
  dateRange,
  setDateRange,
} = useAgroData();
```

- `plots` and `livestock` — full arrays (unfiltered)
- `shipments` and `exportImportRecords` — filtered by `dateRange`
- `kpis` — always from **full** dataset (not date-filtered)
- `dateRange` defaults to `{ startDate: null, endDate: null }` (no filter until UI is wired)

## Pages that use this domain

| Page | Usage |
|------|--------|
| `DashboardPage` | `kpis.totalActualYieldTons`, `kpis.totalHeadCount` for two KPI cards only |
| `CropTable` | `plots` |
| `LivestockTable` | `livestock` |
| `AIInsightsPanel` | `aiInsights` |
| `ReportsPage` | `plots` for P&L revenue line items |
| `ExportImportPage` | `exportImportRecords` as seed for Recent Imports |

**Note:** Dashboard **financial** KPI cards still use hardcoded strings from `mockData.dashboardKPIs`, not this domain.

## Preparing for a real API

Replace static exports in `mockData.ts` with fetch calls inside `hooks.ts`. Keep `types.ts`, `calculations.ts`, and component prop shapes stable; map API DTOs at the boundary.

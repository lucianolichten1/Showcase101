# Agro Domain

Owns all agricultural and operations data for Showcase101. Mirrors the structure of `src/domains/financial/` built by Person A.

## Entities

| Entity | File | Description |
|---|---|---|
| `Plot` | `types.ts` | A crop field with yield, revenue, cost, profit per season |
| `Livestock` | `types.ts` | A group of animals (head count, feed/vet costs, herd value) |
| `Product` | `types.ts` | A tradeable commodity (corn, cattle) with unit price |
| `Shipment` | `types.ts` | An outgoing/incoming delivery with status and expected revenue |
| `ExportImportRecord` | `types.ts` | A file uploaded or exported through the Import/Export page |
| `AgroKPIs` | `types.ts` | Computed KPI shape returned by `useAgroData()` |

## Mock data (`mockData.ts`)

- **3 plots** — Plot A (25 ha, harvested), Plot B (18 ha, harvested), Plot C (12 ha, active)
- **3 livestock groups** — Adult Cows (92), Calves (54), Bulls (40)
- **8 shipments** — Jan–Jun 2026, mix of Delivered / In Transit / Pending
- **3 export/import records** — seed rows for the Import/Export page
- **4 AI insights** — strings displayed in the Dashboard panel

## How KPIs are calculated (`calculations.ts`)

All KPIs are computed from records — nothing is hardcoded as a string:

| KPI | Formula |
|---|---|
| `totalActualYieldTons` | `sum(plot.actualYield)` |
| `totalHeadCount` | `sum(livestock.count)` |
| `totalLivestockValue` | `sum(livestock.estimatedValue)` |
| `totalCropRevenue` | `sum(plot.revenue)` |
| `shipmentsInTransit` | `count(shipments where status = "In Transit")` |
| `shipmentsDelivered` | `count(shipments where status = "Delivered")` |

## Hook (`hooks.ts`)

```ts
const { plots, livestock, shipments, exportImportRecords, kpis, dateRange, setDateRange } = useAgroData();
```

- `plots` and `livestock` are always the full unfiltered arrays
- `shipments` and `exportImportRecords` are filtered by `dateRange`
- `kpis` are always computed from the full dataset (not filtered)
- `dateRange` defaults to `{ startDate: null, endDate: null }` (no filter)

## Pages that use this domain

| Page | What it uses |
|---|---|
| `DashboardPage` | `kpis.totalActualYieldTons`, `kpis.totalHeadCount` (replaces hardcoded strings) |
| `CropTable` | `plots` array |
| `LivestockTable` | `livestock` array |
| `AIInsightsPanel` | `aiInsights` strings |
| `ReportsPage` | `plots` to derive revenue line labels and amounts |
| `ExportImportPage` | `exportImportRecords` as seed state for Recent Imports |

## Preparing for a real API

When a backend is ready, replace the exports in `mockData.ts` with API responses and update `hooks.ts` to call the API instead of importing static arrays. The types, calculations, and component interfaces stay the same.

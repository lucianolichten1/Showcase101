import { useMemo, useState } from "react";
import { computeAgroKPIs, filterByDateRange, filterImportsByDateRange } from "./calculations";
import {
  aiInsights,
  defaultDateRange,
  exportImportRecords as initialExportImportRecords,
  livestock as allLivestock,
  plots as allPlots,
  shipments as allShipments,
} from "./mockData";
import type { AgroKPIs, DateRange, ExportImportRecord, Livestock, Plot, Shipment } from "./types";

// ─── Hook result shape ────────────────────────────────────────────────────────

export interface UseAgroDataResult {
  /** All plot records (unfiltered) */
  plots: Plot[];
  /** All livestock groups (unfiltered) */
  livestock: Livestock[];
  /** Shipments filtered by current dateRange */
  shipments: Shipment[];
  /** Export/Import records filtered by current dateRange */
  exportImportRecords: ExportImportRecord[];
  /** AI insight strings for the dashboard */
  aiInsights: string[];
  /** Computed KPIs from all (unfiltered) agro records */
  kpis: AgroKPIs;
  /** Current active date range filter */
  dateRange: DateRange;
  /** Update the date range filter */
  setDateRange: (range: DateRange) => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAgroData(): UseAgroDataResult {
  const [dateRange, setDateRange] = useState<DateRange>(defaultDateRange);

  const filteredShipments = useMemo(
    () => filterByDateRange(allShipments, dateRange),
    [dateRange]
  );

  const filteredExportImport = useMemo(
    () => filterImportsByDateRange(initialExportImportRecords, dateRange),
    [dateRange]
  );

  // KPIs always computed from full dataset (not filtered) so header cards
  // always reflect the whole operation, not just a date window
  const kpis = useMemo(
    () => computeAgroKPIs(allPlots, allLivestock, allShipments),
    []
  );

  return {
    plots: allPlots,
    livestock: allLivestock,
    shipments: filteredShipments,
    exportImportRecords: filteredExportImport,
    aiInsights,
    kpis,
    dateRange,
    setDateRange,
  };
}

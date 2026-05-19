import type {
  AgroKPIs,
  DateRange,
  ExportImportRecord,
  Livestock,
  Plot,
  Shipment,
  ShipmentStatus,
} from "./types";

// ─── Plot calculations ────────────────────────────────────────────────────────

export const countPlots = (plots: Plot[]): number => plots.length;

export const countActivePlots = (plots: Plot[]): number =>
  plots.filter((p) => p.status === "Active").length;

export const totalHectares = (plots: Plot[]): number =>
  plots.reduce((sum, p) => sum + p.hectares, 0);

export const totalActualYield = (plots: Plot[]): number =>
  plots.reduce((sum, p) => sum + p.actualYield, 0);

export const totalCropRevenue = (plots: Plot[]): number =>
  plots.reduce((sum, p) => sum + p.revenue, 0);

export const totalCropProfit = (plots: Plot[]): number =>
  plots.reduce((sum, p) => sum + p.profit, 0);

export const plotsByStatus = (plots: Plot[], status: Plot["status"]): Plot[] =>
  plots.filter((p) => p.status === status);

export const topPlotByProfit = (plots: Plot[]): Plot | null =>
  plots.length === 0
    ? null
    : [...plots].sort((a, b) => b.profit - a.profit)[0];

// ─── Livestock calculations ───────────────────────────────────────────────────

export const totalHeadCount = (livestock: Livestock[]): number =>
  livestock.reduce((sum, l) => sum + l.count, 0);

export const totalLivestockValue = (livestock: Livestock[]): number =>
  livestock.reduce((sum, l) => sum + l.estimatedValue, 0);

export const totalFeedCostPerMonth = (livestock: Livestock[]): number =>
  livestock.reduce((sum, l) => sum + l.feedCostPerMonth, 0);

export const totalVetCostPerMonth = (livestock: Livestock[]): number =>
  livestock.reduce((sum, l) => sum + l.vetCostPerMonth, 0);

// ─── Shipment calculations ────────────────────────────────────────────────────

export const shipmentsByStatus = (
  shipments: Shipment[],
  status: ShipmentStatus
): Shipment[] => shipments.filter((s) => s.status === status);

export const countShipmentsByStatus = (
  shipments: Shipment[],
  status: ShipmentStatus
): number => shipmentsByStatus(shipments, status).length;

export const totalShipmentRevenue = (shipments: Shipment[]): number =>
  shipments.reduce((sum, s) => sum + s.revenueExpected, 0);

export const topShipmentDestination = (shipments: Shipment[]): string | null => {
  const counts: Record<string, number> = {};
  shipments.forEach((s) => {
    counts[s.destination] = (counts[s.destination] ?? 0) + 1;
  });
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  return top?.[0] ?? null;
};

// ─── Date-range filtering ─────────────────────────────────────────────────────

/** Filters any array of records that have an ISO `date` field */
export const filterByDateRange = <T extends { date: string }>(
  records: T[],
  range: DateRange
): T[] => {
  if (!range.startDate && !range.endDate) return records;
  return records.filter((r) => {
    if (range.startDate && r.date < range.startDate) return false;
    if (range.endDate && r.date > range.endDate) return false;
    return true;
  });
};

/** Filters ExportImportRecord by isoDate (falls back to all records if no isoDate) */
export const filterImportsByDateRange = (
  records: ExportImportRecord[],
  range: DateRange
): ExportImportRecord[] => {
  if (!range.startDate && !range.endDate) return records;
  return records.filter((r) => {
    const iso = r.isoDate;
    if (!iso) return true;
    if (range.startDate && iso < range.startDate) return false;
    if (range.endDate && iso > range.endDate) return false;
    return true;
  });
};

export const topImportCategory = (records: ExportImportRecord[]): string | null => {
  const counts: Record<string, number> = {};
  records.forEach((r) => {
    if (r.status === "Completed") {
      counts[r.type] = (counts[r.type] ?? 0) + 1;
    }
  });
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  return top?.[0] ?? null;
};

// ─── Composite KPI builder ────────────────────────────────────────────────────

export const computeAgroKPIs = (
  plots: Plot[],
  livestock: Livestock[],
  shipments: Shipment[]
): AgroKPIs => ({
  totalPlots: countPlots(plots),
  activePlots: countActivePlots(plots),
  totalHectares: totalHectares(plots),
  totalActualYieldTons: totalActualYield(plots),
  totalCropRevenue: totalCropRevenue(plots),
  totalCropProfit: totalCropProfit(plots),
  totalHeadCount: totalHeadCount(livestock),
  totalLivestockValue: totalLivestockValue(livestock),
  totalFeedCostPerMonth: totalFeedCostPerMonth(livestock),
  shipmentsInTransit: countShipmentsByStatus(shipments, "In Transit"),
  shipmentsDelivered: countShipmentsByStatus(shipments, "Delivered"),
});

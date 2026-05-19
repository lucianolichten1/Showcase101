// ─── Primitives & Unions ─────────────────────────────────────────────────────

export type AgroCategory = "Corn" | "Livestock" | "Soy" | "Wheat" | "Other";
export type PlotStatus = "Active" | "Harvested" | "Fallow";
export type LivestockCategory = "Cattle" | "Poultry" | "Swine" | "Other";
export type ShipmentStatus = "Pending" | "In Transit" | "Delivered" | "Cancelled";
export type ImportFileType = "CSV" | "Excel";
export type ImportStatus = "Completed" | "Needs Review" | "Failed";

// ─── Date range (used by hooks for filtering) ─────────────────────────────────

export interface DateRange {
  /** ISO date string YYYY-MM-DD or null for open start */
  startDate: string | null;
  /** ISO date string YYYY-MM-DD or null for open end */
  endDate: string | null;
}

// ─── Core agro entities ───────────────────────────────────────────────────────

/** A crop plot / field with yield and financial data for a season */
export interface Plot {
  id: number;
  name: string;           // "Plot A"
  hectares: number;
  crop: AgroCategory;
  expectedYield: number;  // tons
  actualYield: number;    // tons
  revenue: number;        // Bs
  cost: number;           // Bs
  profit: number;         // Bs — always revenue - cost
  season: string;         // "2026"
  status: PlotStatus;
}

/** A group of animals managed together */
export interface Livestock {
  id: number;
  group: string;              // "Adult Cows"
  count: number;              // head count
  avgWeightKg: number;
  feedCostPerMonth: number;   // Bs
  vetCostPerMonth: number;    // Bs
  estimatedValue: number;     // Bs total herd value
  category: LivestockCategory;
}

/** A product or commodity the farm produces or trades */
export interface Product {
  id: number;
  name: string;
  category: AgroCategory;
  unit: string;           // "ton", "kg", "head"
  pricePerUnit: number;   // Bs
}

/** An outgoing or incoming shipment of agro goods */
export interface Shipment {
  id: number;
  date: string;           // ISO date "2026-05-10"
  product: string;
  category: AgroCategory;
  quantityTons: number;
  destination: string;
  status: ShipmentStatus;
  revenueExpected: number; // Bs
}

/** A file that was imported or exported through the Export/Import page */
export interface ExportImportRecord {
  id: string;
  fileName: string;
  type: ImportFileType;
  rows: number;
  status: ImportStatus;
  uploadedBy: string;
  date: string;           // Display format "May 17, 2026"
  isoDate?: string;       // ISO date for date-range filtering
}

// ─── Computed KPI shape returned by useAgroData ───────────────────────────────

export interface AgroKPIs {
  totalPlots: number;
  activePlots: number;
  totalHectares: number;
  totalActualYieldTons: number;
  totalCropRevenue: number;   // Bs
  totalCropProfit: number;    // Bs
  totalHeadCount: number;
  totalLivestockValue: number; // Bs
  totalFeedCostPerMonth: number; // Bs
  shipmentsInTransit: number;
  shipmentsDelivered: number;
}

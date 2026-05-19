import type {
  DateRange,
  ExportImportRecord,
  Livestock,
  Plot,
  Product,
  Shipment,
} from "./types";

// ─── Plots ────────────────────────────────────────────────────────────────────

export const plots: Plot[] = [
  {
    id: 1,
    name: "Plot A",
    hectares: 25,
    crop: "Corn",
    expectedYield: 30,
    actualYield: 28,
    revenue: 72000,
    cost: 48000,
    profit: 24000,
    season: "2026",
    status: "Harvested",
  },
  {
    id: 2,
    name: "Plot B",
    hectares: 18,
    crop: "Corn",
    expectedYield: 22,
    actualYield: 24,
    revenue: 61000,
    cost: 39500,
    profit: 21500,
    season: "2026",
    status: "Harvested",
  },
  {
    id: 3,
    name: "Plot C",
    hectares: 12,
    crop: "Corn",
    expectedYield: 15,
    actualYield: 14,
    revenue: 36000,
    cost: 27000,
    profit: 9000,
    season: "2026",
    status: "Active",
  },
];

// ─── Livestock ────────────────────────────────────────────────────────────────

export const livestock: Livestock[] = [
  {
    id: 1,
    group: "Adult Cows",
    count: 92,
    avgWeightKg: 430,
    feedCostPerMonth: 18500,
    vetCostPerMonth: 4200,
    estimatedValue: 414000,
    category: "Cattle",
  },
  {
    id: 2,
    group: "Calves",
    count: 54,
    avgWeightKg: 180,
    feedCostPerMonth: 9800,
    vetCostPerMonth: 2100,
    estimatedValue: 121500,
    category: "Cattle",
  },
  {
    id: 3,
    group: "Bulls",
    count: 40,
    avgWeightKg: 520,
    feedCostPerMonth: 11200,
    vetCostPerMonth: 3600,
    estimatedValue: 240000,
    category: "Cattle",
  },
];

// ─── Products ─────────────────────────────────────────────────────────────────

export const products: Product[] = [
  { id: 1, name: "Corn", category: "Corn", unit: "ton", pricePerUnit: 2571 },
  { id: 2, name: "Cattle", category: "Livestock", unit: "head", pricePerUnit: 4500 },
];

// ─── Shipments ────────────────────────────────────────────────────────────────

export const shipments: Shipment[] = [
  {
    id: 1,
    date: "2026-01-15",
    product: "Corn",
    category: "Corn",
    quantityTons: 28,
    destination: "Santa Cruz",
    status: "Delivered",
    revenueExpected: 71988,
  },
  {
    id: 2,
    date: "2026-02-08",
    product: "Cattle",
    category: "Livestock",
    quantityTons: 8.6,
    destination: "La Paz",
    status: "Delivered",
    revenueExpected: 40500,
  },
  {
    id: 3,
    date: "2026-03-20",
    product: "Corn",
    category: "Corn",
    quantityTons: 24,
    destination: "Cochabamba",
    status: "Delivered",
    revenueExpected: 61704,
  },
  {
    id: 4,
    date: "2026-04-10",
    product: "Corn",
    category: "Corn",
    quantityTons: 14,
    destination: "Trinidad",
    status: "Delivered",
    revenueExpected: 35994,
  },
  {
    id: 5,
    date: "2026-05-03",
    product: "Cattle",
    category: "Livestock",
    quantityTons: 5.2,
    destination: "Santa Cruz",
    status: "Delivered",
    revenueExpected: 27000,
  },
  {
    id: 6,
    date: "2026-05-18",
    product: "Corn",
    category: "Corn",
    quantityTons: 14,
    destination: "Oruro",
    status: "In Transit",
    revenueExpected: 35994,
  },
  {
    id: 7,
    date: "2026-06-02",
    product: "Corn",
    category: "Corn",
    quantityTons: 22,
    destination: "Beni",
    status: "Pending",
    revenueExpected: 56562,
  },
  {
    id: 8,
    date: "2026-06-15",
    product: "Cattle",
    category: "Livestock",
    quantityTons: 10.4,
    destination: "La Paz",
    status: "Pending",
    revenueExpected: 54000,
  },
];

// ─── Export / Import records ───────────────────────────────────────────────────

export const exportImportRecords: ExportImportRecord[] = [
  {
    id: "seed-1",
    fileName: "january_transactions.xlsx",
    type: "Excel",
    rows: 248,
    status: "Completed",
    uploadedBy: "Luciano",
    date: "May 17, 2026",
    isoDate: "2026-05-17",
  },
  {
    id: "seed-2",
    fileName: "cattle_expenses.csv",
    type: "CSV",
    rows: 86,
    status: "Completed",
    uploadedBy: "Admin",
    date: "May 14, 2026",
    isoDate: "2026-05-14",
  },
  {
    id: "seed-3",
    fileName: "corn_sales_april.xlsx",
    type: "Excel",
    rows: 132,
    status: "Needs Review",
    uploadedBy: "Accountant",
    date: "May 10, 2026",
    isoDate: "2026-05-10",
  },
];

// ─── AI insights ──────────────────────────────────────────────────────────────

export const aiInsights: string[] = [
  "Net profit is positive this month, but feed and fertilizer costs represent 38% of total expenses.",
  "Plot B produced more corn than expected, generating the highest profit per hectare.",
  "Two customers are overdue, representing Bs 25,500 in delayed cash collection.",
  "Cattle feed costs increased compared to last month. Review supplier pricing or feeding efficiency.",
];

// ─── Default date range ───────────────────────────────────────────────────────

export const defaultDateRange: DateRange = {
  startDate: null,
  endDate: null,
};

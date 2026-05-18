export interface MonthlyFinancial {
  month: string;
  revenue: number;
  expenses: number;
  profit: number;
}

export interface CropPlot {
  id: number;
  plot: string;
  hectares: number;
  crop: string;
  expectedYield: number;
  actualYield: number;
  revenue: number;
  cost: number;
  profit: number;
}

export interface LivestockGroup {
  id: number;
  group: string;
  count: number;
  weight: number;
  feedCost: number;
  vetCost: number;
  estValue: number;
}

/** @deprecated Use ReceivableRecord from `@/domains/financial/types` */
export type { ReceivableRecord as Receivable } from "@/domains/financial/types";

export interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  city: string;
  industry: string;
  totalInvoiced: number;
  totalPaid: number;
  status: "Active" | "Inactive";
}

export interface ExpenseCategory {
  category: string;
  amount: number;
  percentage: number;
}

export interface KPIData {
  title: string;
  value: string;
  trend: number;
  trendText: string;
  trendStatus: "positive" | "negative" | "neutral";
}

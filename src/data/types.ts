export interface MonthlyFinancial {
  month: string;
  revenue: number;
  expenses: number;
  profit: number;
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

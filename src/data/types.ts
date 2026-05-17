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

export interface Receivable {
  id: number;
  customer: string;
  amount: number;
  dueDate: string;
  overdueDays: number;
  status: "Overdue" | "Pending";
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

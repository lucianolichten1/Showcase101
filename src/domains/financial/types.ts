import type { Dispatch, SetStateAction } from "react";
import type { ImportedData, ImportMapping } from "@/domains/import/types";

/** ISO date string (YYYY-MM-DD) */
export type ISODate = string;

export type CurrencyCode = "Bs" | (string & {});

export type PaymentMethod =
  | "Cash"
  | "Bank Transfer"
  | "Card"
  | "Check"
  | "Other";

export type RevenuePaymentStatus =
  | "Collected"
  | "Pending"
  | "Overdue"
  | "Cancelled";

export type ExpensePaymentStatus = "Paid" | "Pending" | "Overdue";

export type ReceivablePaymentStatus =
  | "Pending"
  | "Partially Paid"
  | "Paid"
  | "Overdue";

/** Union of payment statuses across financial record types */
export type PaymentStatus =
  | RevenuePaymentStatus
  | ExpensePaymentStatus
  | ReceivablePaymentStatus;

export const REVENUE_CATEGORIES = [
  "Export Sale",
  "Import Sale",
  "Local Sale",
  "Wholesale",
  "Retail",
  "Service Fee",
  "Commission",
  "Other",
] as const;

export const EXPENSE_CATEGORIES = [
  "Transport",
  "Labor",
  "Storage",
  "Packaging",
  "Customs",
  "Taxes",
  "Supplier Payment",
  "Maintenance",
  "Fuel",
  "Other",
] as const;

export type RevenueCategory = (typeof REVENUE_CATEGORIES)[number];
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

/** Category label for either revenue or expense lines */
export type FinancialCategory = RevenueCategory | ExpenseCategory;

export interface DateRange {
  /** ISO date inclusive lower bound; null = no lower bound */
  startDate: ISODate | null;
  /** ISO date inclusive upper bound; null = no upper bound */
  endDate: ISODate | null;
}

/** Shared fields for dated monetary transactions (revenue & expenses) */
export interface FinancialTransaction {
  id: string;
  date: ISODate;
  amount: number;
  currency: CurrencyCode;
}

export interface RevenueRecord extends FinancialTransaction {
  sourceClient: string;
  productService: string;
  category: RevenueCategory;
  status: RevenuePaymentStatus;
  paymentMethod: PaymentMethod;
  invoiceNumber: string;
  notes: string;
  /** Product cost from import (COGS); defaults to 0 when absent */
  cost?: number;
}

export interface ExpenseRecord extends FinancialTransaction {
  category: ExpenseCategory;
  description: string;
  vendor: string;
  status: ExpensePaymentStatus;
  paymentMethod: PaymentMethod;
  notes: string;
}

/** Accounts receivable invoice (display due dates; numeric id for legacy UI) */
export interface ReceivableRecord {
  id: number;
  customer: string;
  invoiceNumber: string;
  amount: number;
  amountPaid: number;
  dueDate: string;
  overdueDays: number;
  status: ReceivablePaymentStatus;
}

export const REVENUE_STATUSES = [
  "Collected",
  "Pending",
  "Overdue",
  "Cancelled",
] as const satisfies readonly RevenuePaymentStatus[];

export const EXPENSE_STATUSES = ["Paid", "Pending", "Overdue"] as const satisfies readonly ExpensePaymentStatus[];

export const REVENUE_PAYMENT_METHODS = [
  "Cash",
  "Bank Transfer",
  "Card",
  "Check",
  "Other",
] as const satisfies readonly PaymentMethod[];

export const EXPENSE_PAYMENT_METHODS = REVENUE_PAYMENT_METHODS;

export const REVENUE_SORT_KEYS = [
  "date",
  "sourceClient",
  "productService",
  "category",
  "amount",
  "status",
  "paymentMethod",
  "invoiceNumber",
] as const;

export const EXPENSE_SORT_KEYS = [
  "date",
  "category",
  "description",
  "vendor",
  "amount",
  "status",
  "paymentMethod",
] as const;

export type RevenueSortKey = (typeof REVENUE_SORT_KEYS)[number];
export type ExpenseSortKey = (typeof EXPENSE_SORT_KEYS)[number];
export type RevenueSortDirection = "asc" | "desc";
export type ExpenseSortDirection = "asc" | "desc";

/** One period bucket for charts and summaries */
export interface MonthlyFinancialSummary {
  month: string;
  revenue: number;
  cost: number;
  expenses: number;
  profit: number;
}

/** Computed KPI bundle returned by useFinancialData */
export interface FinancialKPIs {
  totalRevenue: number;
  collectedRevenue: number;
  pendingRevenue: number;
  overdueRevenue: number;
  topRevenueCategory: string;
  totalExpenses: number;
  paidExpenses: number;
  pendingExpenses: number;
  overdueExpenses: number;
  largestExpenseCategory: string;
  totalCost: number;
  grossProfit: number;
  netProfit: number;
  profitMargin: number;
  usesImportedData: boolean;
  receivablesTotalOutstanding: number;
  receivablesOverdueAmount: number;
  receivablesInvoicesOverdue: number;
  receivablesCollectionRate: number;
}

export interface UseFinancialDataResult {
  revenueRecords: RevenueRecord[];
  setRevenueRecords: Dispatch<SetStateAction<RevenueRecord[]>>;
  expenseRecords: ExpenseRecord[];
  setExpenseRecords: Dispatch<SetStateAction<ExpenseRecord[]>>;
  receivableRecords: ReceivableRecord[];
  setReceivableRecords: Dispatch<SetStateAction<ReceivableRecord[]>>;
  dateRange: DateRange;
  setDateRange: Dispatch<SetStateAction<DateRange>>;
  filteredRevenueRecords: RevenueRecord[];
  filteredExpenseRecords: ExpenseRecord[];
  kpis: FinancialKPIs;
  usesImportedData: boolean;
  importedData: ImportedData | null;
  importMapping: ImportMapping | null;
  applyImportedData: (data: ImportedData, mapping: ImportMapping) => void;
  clearImportedData: () => void;
}

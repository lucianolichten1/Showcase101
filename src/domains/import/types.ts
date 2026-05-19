/** Standardized sales row after Excel import + column mapping */
export interface SalesRecord {
  id: string;
  date: string;
  customerName?: string;
  product?: string;
  quantity?: number;
  revenue: number;
  cost?: number;
}

/** Standardized expense row after Excel import + column mapping */
export interface ImportExpenseRecord {
  id: string;
  date: string;
  category?: string;
  description?: string;
  vendor?: string;
  amount: number;
}

export type SheetRole = "sales" | "expenses" | "ignore";

export interface SheetPreview {
  sheetName: string;
  headers: string[];
  previewRows: Record<string, unknown>[];
}

export interface WorkbookPreview {
  sheets: SheetPreview[];
}

export interface SheetMapping {
  sheetName: string;
  role: SheetRole;
  columnMap: Record<string, string>;
}

export interface ImportMapping {
  id: string;
  name: string;
  sheetMappings: SheetMapping[];
  updatedAt: string;
}

export interface ImportedData {
  sales: SalesRecord[];
  expenses: ImportExpenseRecord[];
  importedAt: string;
  sourceFileName?: string;
}

export const SALES_FIELD_KEYS = [
  "date",
  "revenue",
  "customerName",
  "product",
  "quantity",
  "cost",
] as const;

export const EXPENSE_FIELD_KEYS = [
  "date",
  "amount",
  "category",
  "description",
  "vendor",
] as const;

export type SalesFieldKey = (typeof SALES_FIELD_KEYS)[number];
export type ExpenseFieldKey = (typeof EXPENSE_FIELD_KEYS)[number];

export const SALES_REQUIRED_FIELDS: SalesFieldKey[] = ["date", "revenue"];
export const EXPENSE_REQUIRED_FIELDS: ExpenseFieldKey[] = ["date", "amount"];

export const SALES_FIELD_LABELS: Record<SalesFieldKey, string> = {
  date: "Date",
  revenue: "Revenue",
  customerName: "Customer",
  product: "Product",
  quantity: "Quantity",
  cost: "Cost",
};

export const EXPENSE_FIELD_LABELS: Record<ExpenseFieldKey, string> = {
  date: "Date",
  amount: "Amount",
  category: "Category",
  description: "Description",
  vendor: "Vendor",
};

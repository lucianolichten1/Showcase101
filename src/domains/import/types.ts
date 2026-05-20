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

/** Standardized AR/invoice row after Excel import + column mapping */
export interface ImportARRecord {
  id: string;
  invoiceDate: string;     // ISO date — primary date, used as dueDate
  amount: number;
  customerName?: string;
  customerId?: string;
  dueDate?: string;        // ISO date — overrides invoiceDate when present
  status?: string;         // raw string; normalized to ReceivablePaymentStatus on convert
  invoiceNumber?: string;
}

/** Standardized customer row after Excel import + column mapping */
export interface ImportCustomerRecord {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  city?: string;
  industry?: string;
  status?: string;  // raw string, normalized to "Active"|"Inactive" on convert
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

export type SheetRole = "sales" | "expenses" | "accounts-receivable" | "customers" | "ignore";

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
  arReceivables: ImportARRecord[];
  customers: ImportCustomerRecord[];
  importedAt: string;
  sourceFileName?: string;
}

/** One completed import shown in Recent imports */
export interface ImportHistoryItem {
  id: string;
  fileName: string;
  importedAt: string;
  /** Rows parsed from the file */
  salesRows: number;
  expenseRows: number;
  /** Rows added to the combined dataset after dedupe */
  newSalesRows?: number;
  newExpenseRows?: number;
  /** Duplicate rows skipped during merge */
  duplicateRows?: number;
  skippedRows: number;
  warningCount: number;
}

/** Metadata recorded when an Excel import succeeds */
export interface ImportHistoryMeta {
  fileName: string;
  salesRows: number;
  expenseRows: number;
  skippedRows: number;
  warningCount: number;
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

export const AR_FIELD_KEYS = [
  "invoiceDate",
  "amount",
  "customerName",
  "customerId",
  "dueDate",
  "status",
  "invoiceNumber",
] as const;

export type ARFieldKey = (typeof AR_FIELD_KEYS)[number];
export const AR_REQUIRED_FIELDS: ARFieldKey[] = ["invoiceDate", "amount"];

export const AR_FIELD_LABELS: Record<ARFieldKey, string> = {
  invoiceDate: "Invoice Date",
  amount: "Amount",
  customerName: "Customer Name",
  customerId: "Customer ID",
  dueDate: "Due Date (if different)",
  status: "Status",
  invoiceNumber: "Invoice #",
};

export const CUSTOMER_FIELD_KEYS = [
  "name",
  "email",
  "phone",
  "city",
  "industry",
  "status",
] as const;

export type CustomerImportFieldKey = (typeof CUSTOMER_FIELD_KEYS)[number];
export const CUSTOMER_REQUIRED_FIELDS: CustomerImportFieldKey[] = ["name"];

export const CUSTOMER_FIELD_LABELS: Record<CustomerImportFieldKey, string> = {
  name: "Name",
  email: "Email",
  phone: "Phone",
  city: "City / Location",
  industry: "Industry / Category",
  status: "Status",
};

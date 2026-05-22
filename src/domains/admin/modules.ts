/** Base financial/accounting modules enabled for every company (MVP). */
export const BASE_FINANCIAL_MODULES = [
  "Dashboard",
  "Revenue",
  "Expenses",
  "Customers",
  "Accounts Receivable",
  "Reports",
  "Import/Export",
] as const;

export type BaseFinancialModule = (typeof BASE_FINANCIAL_MODULES)[number];

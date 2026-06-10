/** Base financial/accounting modules (MVP). Keys stored on CompanyRecord.enabledModules. */

export const DASHBOARD_MODULE_KEY = "dashboard";

export const BASE_FINANCIAL_MODULE_DEFINITIONS = [
  {
    key: "dashboard",
    name: "Dashboard",
    description: "Overview of financial KPIs and activity.",
    required: true,
  },
  {
    key: "revenue",
    name: "Revenue",
    description: "Track income and revenue transactions.",
  },
  {
    key: "expenses",
    name: "Expenses",
    description: "Manage and categorize business expenses.",
  },
  {
    key: "customers",
    name: "Customers",
    description: "Customer directory and account status.",
  },
  {
    key: "accounts-receivable",
    name: "Accounts Receivable",
    description: "Invoices, payments, and outstanding balances.",
  },
  {
    key: "reports",
    name: "Reports",
    description: "Financial summaries and exportable reports.",
  },
  {
    key: "import-export",
    name: "Import/Export",
    description: "Import and export financial data.",
  },
  {
    key: "inventory",
    name: "Inventory",
    description: "Products, stock levels, purchase and sales orders.",
  },
] as const;

export type BaseFinancialModuleKey =
  (typeof BASE_FINANCIAL_MODULE_DEFINITIONS)[number]["key"];

/** Display names for base financial modules. */
export const BASE_FINANCIAL_MODULES = BASE_FINANCIAL_MODULE_DEFINITIONS.map(
  (m) => m.name
);

export type BaseFinancialModule = (typeof BASE_FINANCIAL_MODULE_DEFINITIONS)[number]["name"];

export const ALL_BASE_MODULE_KEYS: BaseFinancialModuleKey[] =
  BASE_FINANCIAL_MODULE_DEFINITIONS.map((m) => m.key);

/** Default: all base financial modules enabled for new companies. */
export const DEFAULT_ENABLED_MODULES: string[] = [...ALL_BASE_MODULE_KEYS];

export function isModuleEnabled(
  enabledModules: string[],
  moduleKey: string
): boolean {
  return enabledModules.includes(moduleKey);
}

export function ensureRequiredModules(enabledModules: string[]): string[] {
  const set = new Set(enabledModules);
  set.add(DASHBOARD_MODULE_KEY);
  return ALL_BASE_MODULE_KEYS.filter((key) => set.has(key));
}

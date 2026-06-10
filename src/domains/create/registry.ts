import {
  BASE_FINANCIAL_MODULE_DEFINITIONS,
  isModuleEnabled,
} from "@/domains/admin/modules";
import type { CreateActionDefinition, CreateActionGroup } from "./types";

/**
 * Registry of create flows discovered across the app.
 * Add an entry here when a module gains a new creation form — it will
 * automatically appear in the sidebar Create menu for enabled companies.
 */
export const CREATE_ACTION_REGISTRY: CreateActionDefinition[] = [
  {
    id: "revenue",
    moduleKey: "revenue",
    label: "Revenue entry",
    path: "/revenue",
    pattern: "modal",
    source: "RevenuePage",
  },
  {
    id: "expense",
    moduleKey: "expenses",
    label: "Expense",
    path: "/expenses",
    pattern: "modal",
    source: "ExpensesPage",
  },
  {
    id: "customer",
    moduleKey: "customers",
    label: "Customer",
    path: "/customers",
    pattern: "modal",
    source: "CustomersPage / AddCustomerDialog",
  },
  {
    id: "invoice",
    moduleKey: "accounts-receivable",
    label: "Invoice",
    path: "/accounts-receivable",
    pattern: "modal",
    source: "AccountsReceivablePage / AddInvoiceDialog",
  },
  {
    id: "product",
    moduleKey: "inventory",
    label: "Product or service",
    path: "/inventory/products",
    pattern: "modal",
    source: "InventoryProductsPage / ProductFormDialog",
  },
  {
    id: "purchase-order",
    moduleKey: "inventory",
    label: "Purchase order",
    path: "/inventory/purchase-orders",
    pattern: "page-form",
    source: "PurchaseOrdersPage",
  },
  {
    id: "sales-order",
    moduleKey: "inventory",
    label: "Sales order",
    path: "/inventory/sales-orders",
    pattern: "page-form",
    source: "SalesOrdersPage",
  },
  {
    id: "adjustment",
    moduleKey: "inventory",
    label: "Stock adjustment",
    path: "/inventory/adjustments",
    pattern: "page-inline",
    source: "InventoryAdjustmentsPage",
  },
];

const MODULE_NAMES = Object.fromEntries(
  BASE_FINANCIAL_MODULE_DEFINITIONS.map((m) => [m.key, m.name])
) as Record<string, string>;

export function getCreateActionById(id: string): CreateActionDefinition | undefined {
  return CREATE_ACTION_REGISTRY.find((a) => a.id === id);
}

export function getGroupedCreateActions(
  enabledModules: string[]
): CreateActionGroup[] {
  const groups = new Map<string, CreateActionDefinition[]>();

  for (const action of CREATE_ACTION_REGISTRY) {
    if (!isModuleEnabled(enabledModules, action.moduleKey)) continue;
    const list = groups.get(action.moduleKey) ?? [];
    list.push(action);
    groups.set(action.moduleKey, list);
  }

  return BASE_FINANCIAL_MODULE_DEFINITIONS.filter((m) => groups.has(m.key)).map(
    (m) => ({
      moduleKey: m.key,
      moduleName: MODULE_NAMES[m.key] ?? m.name,
      actions: groups.get(m.key) ?? [],
    })
  );
}

export function buildCreateActionUrl(
  action: CreateActionDefinition,
  companyId: string | null
): string {
  const params = new URLSearchParams();
  if (companyId) params.set("companyId", companyId);
  if (action.pattern !== "page-inline") params.set("create", action.id);
  const qs = params.toString();
  return qs ? `${action.path}?${qs}` : action.path;
}

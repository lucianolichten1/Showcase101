/** Dashboard KPI and chart widget keys stored per company. */

export const DASHBOARD_WIDGET_DEFINITIONS = [
  {
    key: "total-revenue",
    name: "Total Revenue",
    description: "Revenue KPI card on the dashboard.",
    kind: "kpi",
  },
  {
    key: "total-costs",
    name: "Total Costs",
    description: "Total costs KPI card on the dashboard.",
    kind: "kpi",
  },
  {
    key: "net-profit",
    name: "Net Profit",
    description: "Net profit KPI card on the dashboard.",
    kind: "kpi",
  },
  {
    key: "accounts-receivable",
    name: "Accounts Receivable",
    description: "Outstanding receivables KPI card on the dashboard.",
    kind: "kpi",
  },
  {
    key: "gross-profit",
    name: "Gross Profit",
    description: "Revenue minus cost of goods sold KPI card.",
    kind: "kpi",
  },
  {
    key: "profit-margin",
    name: "Profit Margin",
    description: "Net profit as a percentage of revenue KPI card.",
    kind: "kpi",
  },
  {
    key: "collected-revenue",
    name: "Collected Revenue",
    description: "Revenue already collected KPI card.",
    kind: "kpi",
  },
  {
    key: "overdue-receivables",
    name: "Overdue Receivables",
    description: "Overdue invoice balance KPI card.",
    kind: "kpi",
  },
  {
    key: "outstanding-expenses",
    name: "Outstanding Expenses",
    description: "Pending and overdue expenses KPI card.",
    kind: "kpi",
  },
  {
    key: "financial-overview",
    name: "Financial overview",
    description: "Monthly revenue and expenses chart.",
    kind: "chart",
  },
  {
    key: "profit-trend",
    name: "Profit trend",
    description: "Monthly net profit trend chart.",
    kind: "chart",
  },
  {
    key: "cash-flow",
    name: "Cumulative cash flow",
    description: "Running net cash flow chart.",
    kind: "chart",
  },
  {
    key: "revenue-by-category",
    name: "Revenue by category",
    description: "Revenue category donut chart.",
    kind: "chart",
  },
  {
    key: "top-customers",
    name: "Top customers",
    description: "Top clients by revenue bar chart.",
    kind: "chart",
  },
  {
    key: "expense-breakdown",
    name: "Expense breakdown",
    description: "Expense category donut chart.",
    kind: "chart",
  },
  {
    key: "bank-accounts",
    name: "Bank accounts",
    description: "Cash balances across bank accounts.",
    kind: "chart",
  },
  {
    key: "receivables-aging",
    name: "Receivables aging",
    description: "Outstanding invoices grouped by days overdue.",
    kind: "chart",
  },
  {
    key: "receivables-table",
    name: "Receivables table",
    description: "Outstanding invoices table.",
    kind: "chart",
  },
  {
    key: "inventory-total-products",
    name: "Total Products",
    description: "Inventory KPI — count of active products.",
    kind: "inventory",
  },
  {
    key: "inventory-stock-value",
    name: "Stock Value",
    description: "Inventory KPI — total stock value at cost.",
    kind: "inventory",
  },
  {
    key: "inventory-low-stock",
    name: "Low on Stock",
    description: "Inventory KPI — products that are limited or out of stock.",
    kind: "inventory",
  },
  {
    key: "inventory-open-pos",
    name: "Open POs",
    description: "Inventory KPI — purchase orders pending delivery.",
    kind: "inventory",
  },
] as const;

export type DashboardWidgetKey = (typeof DASHBOARD_WIDGET_DEFINITIONS)[number]["key"];
export type DashboardWidgetKind = (typeof DASHBOARD_WIDGET_DEFINITIONS)[number]["kind"];

export const ALL_DASHBOARD_WIDGET_KEYS: DashboardWidgetKey[] =
  DASHBOARD_WIDGET_DEFINITIONS.map((w) => w.key);

export const DEFAULT_ENABLED_DASHBOARD_WIDGETS: DashboardWidgetKey[] = [
  ...ALL_DASHBOARD_WIDGET_KEYS,
];

const WIDGET_KEY_SET = new Set<string>(ALL_DASHBOARD_WIDGET_KEYS);

/** Maps legacy dashboard KPI titles to widget keys. */
export const KPI_TITLE_TO_WIDGET_KEY: Record<string, DashboardWidgetKey> = {
  "Total Revenue": "total-revenue",
  "Total Costs": "total-costs",
  "Net Profit": "net-profit",
  "Accounts Receivable": "accounts-receivable",
  "Gross Profit": "gross-profit",
  "Profit Margin": "profit-margin",
  "Collected Revenue": "collected-revenue",
  "Overdue Receivables": "overdue-receivables",
  "Outstanding Expenses": "outstanding-expenses",
  "Total Products": "inventory-total-products",
  "Stock Value": "inventory-stock-value",
  "Low on Stock": "inventory-low-stock",
  "Open POs": "inventory-open-pos",
};

export function isKnownDashboardWidgetKey(key: string): key is DashboardWidgetKey {
  return WIDGET_KEY_SET.has(key);
}

export function normalizeEnabledDashboardWidgets(
  keys: string[] | null | undefined
): DashboardWidgetKey[] {
  if (!keys || keys.length === 0) {
    return [...DEFAULT_ENABLED_DASHBOARD_WIDGETS];
  }

  const valid = keys.filter(isKnownDashboardWidgetKey);
  return valid.length > 0 ? valid : [...DEFAULT_ENABLED_DASHBOARD_WIDGETS];
}

export function isDashboardWidgetEnabled(
  enabledWidgets: string[],
  widgetKey: string
): boolean {
  return normalizeEnabledDashboardWidgets(enabledWidgets).includes(
    widgetKey as DashboardWidgetKey
  );
}

export function dashboardWidgetKeyForKpiTitle(title: string): DashboardWidgetKey | null {
  return KPI_TITLE_TO_WIDGET_KEY[title] ?? null;
}

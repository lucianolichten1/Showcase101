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
    key: "financial-overview",
    name: "Financial overview",
    description: "Monthly revenue and expenses chart.",
    kind: "chart",
  },
  {
    key: "expense-breakdown",
    name: "Expense breakdown",
    description: "Expense category donut chart.",
    kind: "chart",
  },
  {
    key: "receivables-table",
    name: "Receivables table",
    description: "Outstanding invoices table.",
    kind: "chart",
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

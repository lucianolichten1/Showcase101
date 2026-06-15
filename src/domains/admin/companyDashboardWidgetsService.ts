import {
  ALL_DASHBOARD_WIDGET_KEYS,
  isKnownDashboardWidgetKey,
  type DashboardWidgetKey,
} from "./dashboardWidgets";
import { updateCompanyDashboardWidgets } from "./companyService";
import type { CompanyRecord } from "./types";
import { dispatchCompanyDashboardWidgetsChanged } from "@/domains/company/companyWorkspaceEvents";

export function validateDashboardWidgetKeys(keys: string[]): string | null {
  if (keys.length === 0) {
    return "Select at least one chart or KPI.";
  }

  const unknown = keys.filter((key) => !isKnownDashboardWidgetKey(key));
  if (unknown.length > 0) {
    return `Unknown widget keys: ${unknown.join(", ")}`;
  }

  return null;
}

export async function saveCompanyDashboardWidgets(
  companyId: string,
  keys: string[]
): Promise<CompanyRecord> {
  const validationError = validateDashboardWidgetKeys(keys);
  if (validationError) throw new Error(validationError);

  const ordered = ALL_DASHBOARD_WIDGET_KEYS.filter((key) =>
    keys.includes(key)
  ) as DashboardWidgetKey[];

  const updated = await updateCompanyDashboardWidgets(companyId, ordered);
  dispatchCompanyDashboardWidgetsChanged(companyId);
  return updated;
}

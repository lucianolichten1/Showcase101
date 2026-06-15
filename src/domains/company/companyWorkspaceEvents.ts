/** Fired when admin toggles company modules (localStorage). */
export const COMPANY_ENABLED_MODULES_CHANGED = "company-enabled-modules-changed";

/** Fired when admin saves dashboard widget toggles (Supabase). */
export const COMPANY_DASHBOARD_WIDGETS_CHANGED = "company-dashboard-widgets-changed";

export function dispatchCompanyEnabledModulesChanged(companyId: string): void {
  window.dispatchEvent(
    new CustomEvent(COMPANY_ENABLED_MODULES_CHANGED, { detail: { companyId } })
  );
}

export function dispatchCompanyDashboardWidgetsChanged(companyId: string): void {
  window.dispatchEvent(
    new CustomEvent(COMPANY_DASHBOARD_WIDGETS_CHANGED, { detail: { companyId } })
  );
}

import {
  LayoutDashboard,
  ArrowUpDown,
  Receipt,
  HandCoins,
  FileBarChart,
  Users,
  Building2,
  LayoutGrid,
  type LucideIcon,
} from "lucide-react";
import type { AppRole } from "./types";

export interface RoleNavItem {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
}

export interface NavigationContext {
  role: AppRole | null | undefined;
  primaryCompanyId: string | null | undefined;
  pathname: string;
  routeCompanyId?: string | null;
  queryCompanyId?: string | null;
}

const FINANCIAL_MODULE_PATHS = [
  { id: "dashboard", label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { id: "reports", label: "Reports", path: "/reports", icon: FileBarChart },
  { id: "expenses", label: "Expenses", path: "/expenses", icon: Receipt },
  {
    id: "accounts-receivable",
    label: "Accounts Receivable",
    path: "/accounts-receivable",
    icon: HandCoins,
  },
  { id: "customers", label: "Customers", path: "/customers", icon: Users },
  { id: "export-import", label: "Import / Export", path: "/export-import", icon: ArrowUpDown },
] as const;

const FINANCIAL_PATH_PREFIXES = [
  "/dashboard",
  "/reports",
  "/expenses",
  "/revenue",
  "/accounts-receivable",
  "/customers",
  "/export-import",
] as const;

function withCompanyId(path: string, companyId: string): string {
  return `${path}?companyId=${encodeURIComponent(companyId)}`;
}

function isFinancialModulePath(pathname: string): boolean {
  return FINANCIAL_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

/** Sidebar items for platform admin area (`/admin/*`). */
export function getAdminNavigation(): RoleNavItem[] {
  return [
    {
      id: "admin-companies",
      label: "Companies",
      href: "/admin/companies",
      icon: Building2,
    },
  ];
}

/** @deprecated Use getAdminNavigation — superadmin default is admin-only nav. */
export function getSuperAdminNavigation(): RoleNavItem[] {
  return getAdminNavigation();
}

function getCompanyScopedNavigation(
  companyId: string,
  options?: { includeAdminLink?: boolean }
): RoleNavItem[] {
  const items: RoleNavItem[] = [];

  if (options?.includeAdminLink) {
    items.push({
      id: "admin-companies",
      label: "Companies",
      href: "/admin/companies",
      icon: Building2,
    });
  }

  items.push(
    {
      id: "company-workspace",
      label: "Workspace",
      href: `/company/${companyId}/dashboard`,
      icon: LayoutGrid,
    },
    ...FINANCIAL_MODULE_PATHS.map((m) => ({
      id: m.id,
      label: m.label,
      href: withCompanyId(m.path, companyId),
      icon: m.icon,
    }))
  );

  return items;
}

// TODO: Support multiple companies per owner in a later version.
// TODO: Add company switcher later if needed.

/** Sidebar items for company_owner (workspace + scoped financial modules only). */
export function getCompanyOwnerNavigation(companyId: string): RoleNavItem[] {
  return getCompanyScopedNavigation(companyId);
}

function resolveSuperAdminCompanyId(ctx: NavigationContext): string | null {
  if (ctx.pathname.startsWith("/company/") && ctx.routeCompanyId) {
    return ctx.routeCompanyId;
  }
  if (isFinancialModulePath(ctx.pathname) && ctx.queryCompanyId) {
    return ctx.queryCompanyId;
  }
  return null;
}

export function getNavigationForContext(ctx: NavigationContext): RoleNavItem[] {
  const { role, primaryCompanyId } = ctx;

  if (role === "superadmin") {
    const companyId = resolveSuperAdminCompanyId(ctx);
    if (companyId) {
      return getCompanyScopedNavigation(companyId, { includeAdminLink: true });
    }
    return getAdminNavigation();
  }

  if (role === "company_owner" && primaryCompanyId) {
    return getCompanyOwnerNavigation(primaryCompanyId);
  }

  return [];
}

export function getNavigationForRole(
  role: AppRole | null | undefined,
  companyId: string | null | undefined
): RoleNavItem[] {
  return getNavigationForContext({
    role,
    primaryCompanyId: companyId,
    pathname: "",
  });
}

import {
  LayoutDashboard,
  ArrowUpDown,
  Receipt,
  HandCoins,
  FileBarChart,
  Users,
  Building2,
  Package,
  Landmark,
  type LucideIcon,
} from "lucide-react";
import { isModuleEnabled } from "@/domains/admin/modules";
import { isAppModulePath } from "@/domains/admin/modulePaths";
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
  enabledModules?: string[];
}

const MODULE_NAV_PATHS = [
  { id: "dashboard", label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { id: "reports", label: "Reports", path: "/reports", icon: FileBarChart },
  { id: "expenses", label: "Expenses", path: "/expenses", icon: Receipt },
  {
    id: "bank-accounts",
    label: "Cuentas bancarias",
    path: "/accounts",
    icon: Landmark,
  },
  {
    id: "accounts-receivable",
    label: "Accounts Receivable",
    path: "/accounts-receivable",
    icon: HandCoins,
  },
  { id: "customers", label: "Customers", path: "/customers", icon: Users },
  { id: "inventory", label: "Inventory", path: "/inventory", icon: Package },
  { id: "export-import", label: "Import / Export", path: "/export-import", icon: ArrowUpDown },
] as const;

function withCompanyId(path: string, companyId: string): string {
  return `${path}?companyId=${encodeURIComponent(companyId)}`;
}

/** Default financial home for a company (used after login and admin links). */
export function companyDashboardPath(companyId: string): string {
  return withCompanyId("/dashboard", companyId);
}

function isCompanyModulePath(pathname: string): boolean {
  return isAppModulePath(pathname);
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
  options?: { includeAdminLink?: boolean; enabledModules?: string[] }
): RoleNavItem[] {
  const items: RoleNavItem[] = [];
  const modules = options?.enabledModules;

  if (options?.includeAdminLink) {
    items.push({
      id: "admin-companies",
      label: "Companies",
      href: "/admin/companies",
      icon: Building2,
    });
  }

  const visible = MODULE_NAV_PATHS.filter(
    (m) => !modules || isModuleEnabled(modules, m.id)
  );

  items.push(
    ...visible.map((m) => ({
      id: m.id,
      label: m.label,
      href: withCompanyId(m.path, companyId),
      icon: m.icon,
    }))
  );

  return items;
}

/** Sidebar items for company_owner (scoped modules). */
export function getCompanyOwnerNavigation(
  companyId: string,
  enabledModules?: string[]
): RoleNavItem[] {
  return getCompanyScopedNavigation(companyId, { enabledModules });
}

function resolveSuperAdminCompanyId(ctx: NavigationContext): string | null {
  if (isCompanyModulePath(ctx.pathname) && ctx.queryCompanyId) {
    return ctx.queryCompanyId;
  }
  return null;
}

export function getNavigationForContext(ctx: NavigationContext): RoleNavItem[] {
  const { role, primaryCompanyId, enabledModules } = ctx;

  if (role === "superadmin") {
    const companyId = resolveSuperAdminCompanyId(ctx);
    if (companyId) {
      return getCompanyScopedNavigation(companyId, {
        includeAdminLink: true,
        enabledModules,
      });
    }
    return getAdminNavigation();
  }

  if (role === "company_owner" && primaryCompanyId) {
    return getCompanyOwnerNavigation(primaryCompanyId, enabledModules);
  }

  return [];
}

export function getNavigationForRole(
  role: AppRole | null | undefined,
  companyId: string | null | undefined,
  enabledModules?: string[]
): RoleNavItem[] {
  return getNavigationForContext({
    role,
    primaryCompanyId: companyId,
    pathname: "",
    enabledModules,
  });
}

import {
  LayoutDashboard,
  ArrowUpDown,
  Receipt,
  HandCoins,
  FileBarChart,
  Users,
  Building2,
  LayoutGrid,
  Shield,
  type LucideIcon,
} from "lucide-react";
import type { AppRole } from "./types";

export interface RoleNavItem {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
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

function withCompanyId(path: string, companyId: string): string {
  return `${path}?companyId=${encodeURIComponent(companyId)}`;
}

/** Sidebar items for superadmin (financial modules + admin area). */
export function getSuperAdminNavigation(): RoleNavItem[] {
  return [
    ...FINANCIAL_MODULE_PATHS.map((m) => ({
      id: m.id,
      label: m.label,
      href: m.path,
      icon: m.icon,
    })),
    {
      id: "admin",
      label: "Admin",
      href: "/admin",
      icon: Shield,
    },
    {
      id: "admin-companies",
      label: "Companies",
      href: "/admin/companies",
      icon: Building2,
    },
  ];
}

/** Sidebar items for company_owner (workspace + scoped financial modules only). */
export function getCompanyOwnerNavigation(companyId: string): RoleNavItem[] {
  return [
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
    })),
  ];
}

export function getNavigationForRole(
  role: AppRole | null | undefined,
  companyId: string | null | undefined
): RoleNavItem[] {
  if (role === "superadmin") return getSuperAdminNavigation();
  if (role === "company_owner" && companyId) {
    return getCompanyOwnerNavigation(companyId);
  }
  return [];
}

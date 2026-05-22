import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  ArrowUpDown,
  Receipt,
  TrendingUp,
  HandCoins,
  FileBarChart,
  Users,
  Building2,
  Settings,
} from "lucide-react";

/** Stable ids for active state and future React Router paths */
export type NavItemId =
  | "dashboard"
  | "export-import"
  | "expenses"
  | "revenue"
  | "accounts-receivable"
  | "reports"
  | "customers"
  | "admin-companies"
  | "settings";

export interface NavItem {
  id: NavItemId;
  label: string;
  href: string;
  icon: LucideIcon;
}

/** Route paths for navigable sidebar items (settings is visual-only). */
export const navPaths: Record<Exclude<NavItemId, "settings">, string> = {
  dashboard: "/dashboard",
  "export-import": "/export-import",
  expenses: "/expenses",
  revenue: "/revenue",
  "accounts-receivable": "/accounts-receivable",
  reports: "/reports",
  customers: "/customers",
  "admin-companies": "/admin/companies",
};

export function isNavigableNavItem(id: NavItemId): id is Exclude<NavItemId, "settings"> {
  return id !== "settings";
}

export const navigationItems: NavItem[] = [
  { id: "dashboard", label: "Dashboard", href: navPaths.dashboard, icon: LayoutDashboard },
  { id: "export-import", label: "Export/Import", href: navPaths["export-import"], icon: ArrowUpDown },
  { id: "expenses", label: "Expenses", href: navPaths.expenses, icon: Receipt },
  { id: "revenue", label: "Revenue", href: navPaths.revenue, icon: TrendingUp },
  {
    id: "accounts-receivable",
    label: "Accounts Receivable",
    href: navPaths["accounts-receivable"],
    icon: HandCoins,
  },
  { id: "reports", label: "Reports", href: navPaths.reports, icon: FileBarChart },
  { id: "customers", label: "Customers", href: navPaths.customers, icon: Users },
  {
    id: "admin-companies",
    label: "Companies",
    href: navPaths["admin-companies"],
    icon: Building2,
  },
  { id: "settings", label: "Settings", href: "#", icon: Settings },
];

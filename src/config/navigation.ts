import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  ArrowUpDown,
  Receipt,
  TrendingUp,
  HandCoins,
  FileBarChart,
  Users,
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
  | "settings";

export interface NavItem {
  id: NavItemId;
  label: string;
  href: string;
  icon: LucideIcon;
}

export const navigationItems: NavItem[] = [
  { id: "dashboard", label: "Dashboard", href: "#", icon: LayoutDashboard },
  { id: "export-import", label: "Export/Import", href: "#", icon: ArrowUpDown },
  { id: "expenses", label: "Expenses", href: "#", icon: Receipt },
  { id: "revenue", label: "Revenue", href: "#", icon: TrendingUp },
  {
    id: "accounts-receivable",
    label: "Accounts Receivable",
    href: "#",
    icon: HandCoins,
  },
  { id: "reports", label: "Reports", href: "#", icon: FileBarChart },
  { id: "customers", label: "Customers", href: "#", icon: Users },
  { id: "settings", label: "Settings", href: "#", icon: Settings },
];

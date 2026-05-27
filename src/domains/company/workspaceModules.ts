import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  FileBarChart,
  Receipt,
  HandCoins,
  Wallet,
  Users,
  ArrowUpDown,
} from "lucide-react";

export interface WorkspaceModule {
  key: string;
  name: string;
  description: string;
  icon: LucideIcon;
  /** Global app route (mock data shared until per-company DB exists). */
  href?: string;
  comingSoon?: boolean;
}

/** Modules shown on the company workspace hub. */
export const WORKSPACE_MODULES: WorkspaceModule[] = [
  {
    key: "dashboard",
    name: "Dashboard",
    description: "Financial overview and KPIs for this company.",
    icon: LayoutDashboard,
    href: "/dashboard",
  },
  {
    key: "reports",
    name: "Reports",
    description: "Summaries and exportable financial reports.",
    icon: FileBarChart,
    href: "/reports",
  },
  {
    key: "expenses",
    name: "Expenses",
    description: "Track and categorize company expenses.",
    icon: Receipt,
    href: "/expenses",
  },
  {
    key: "accounts-receivable",
    name: "Accounts Receivable",
    description: "Invoices, payments, and outstanding balances.",
    icon: HandCoins,
    href: "/accounts-receivable",
  },
  {
    key: "accounts-payable",
    name: "Accounts Payable",
    description: "Vendor bills and outgoing payments.",
    icon: Wallet,
    comingSoon: true,
  },
  {
    key: "customers",
    name: "Customers",
    description: "Customer directory and account status.",
    icon: Users,
    href: "/customers",
  },
  {
    key: "import-export",
    name: "Import / Export",
    description: "Import and export financial data.",
    icon: ArrowUpDown,
    href: "/export-import",
  },
];

export function workspaceModuleHref(
  module: WorkspaceModule,
  companyId: string
): string | undefined {
  if (!module.href || module.comingSoon) return undefined;
  return `${module.href}?companyId=${encodeURIComponent(companyId)}`;
}

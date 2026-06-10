import type { ReactNode } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { cn } from "@/lib/utils";

const INVENTORY_TABS = [
  { label: "Overview", path: "/inventory" },
  { label: "Products", path: "/inventory/products" },
  { label: "Purchase Orders", path: "/inventory/purchase-orders" },
  { label: "Sales Orders", path: "/inventory/sales-orders" },
  { label: "Adjustments", path: "/inventory/adjustments" },
  { label: "Reports", path: "/inventory/reports" },
] as const;

export function InventoryPageShell({
  title,
  description,
  actions,
  children,
  showTabs = true,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  showTabs?: boolean;
}) {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const qs = searchParams.toString();
  const suffix = qs ? `?${qs}` : "";

  return (
    <div className="flex flex-1 flex-col text-[#1C1917] font-sans min-h-0 bg-stone-50/40">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-10 py-4 sm:py-5 space-y-5">
          <section className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 rounded-xl border border-stone-200 bg-white shadow-sm px-4 py-3.5 sm:px-5">
            <div>
              <h1 className="text-2xl font-bold text-stone-900 tracking-tight">{title}</h1>
              {description && (
                <p className="text-sm text-stone-700 mt-1 max-w-2xl">{description}</p>
              )}
            </div>
            {actions && <div className="flex flex-wrap gap-2 shrink-0">{actions}</div>}
          </section>

          {showTabs && (
            <nav className="flex flex-wrap gap-1 border-b border-stone-200 pb-0">
              {INVENTORY_TABS.map((tab) => {
                const active =
                  tab.path === "/inventory"
                    ? location.pathname === "/inventory"
                    : location.pathname.startsWith(tab.path);
                return (
                  <Link
                    key={tab.path}
                    to={`${tab.path}${suffix}`}
                    className={cn(
                      "px-3 py-2 text-xs font-semibold border-b-2 -mb-px transition-colors",
                      active
                        ? "border-green-800 text-green-800"
                        : "border-transparent text-stone-600 hover:text-stone-900"
                    )}
                  >
                    {tab.label}
                  </Link>
                );
              })}
            </nav>
          )}

          {children}
        </div>
      </div>
    </div>
  );
}

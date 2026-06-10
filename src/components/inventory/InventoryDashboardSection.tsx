import { Fragment, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { KPICard } from "@/components/KPICard";
import { formatCurrency } from "@/data/mockData";
import { dashboardWidgetKeyForKpiTitle } from "@/domains/admin/dashboardWidgets";
import { useCompanyBranding } from "@/domains/company/CompanyBrandingContext";
import { useInventoryData } from "@/domains/inventory/hooks";
import { cn } from "@/lib/utils";

function kpiGridClassName(count: number): string {
  if (count <= 1) return "grid grid-cols-1 gap-2 sm:gap-3";
  if (count === 2) return "grid grid-cols-2 gap-2 sm:gap-3";
  if (count === 3) return "grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3";
  return "grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3";
}

export function InventoryDashboardSection() {
  const { kpis } = useInventoryData();
  const { isWidgetEnabled } = useCompanyBranding();
  const [searchParams] = useSearchParams();
  const qs = searchParams.toString();
  const invHref = `/inventory${qs ? `?${qs}` : ""}`;

  const kpiCards = useMemo(
    () => [
      {
        title: "Total Products",
        value: String(kpis.totalProducts),
        subtitle: "Active items",
      },
      {
        title: "Stock Value",
        value: formatCurrency(kpis.totalStockValue),
        subtitle: "At cost price",
      },
      {
        title: "Low on Stock",
        value: String(kpis.lowStockCount),
        subtitle: "Limited or out",
      },
      {
        title: "Open POs",
        value: String(kpis.openPurchaseOrders),
        subtitle: "Pending delivery",
      },
    ],
    [kpis]
  );

  const visibleKpiCards = useMemo(
    () =>
      kpiCards.filter((kpi) => {
        const key = dashboardWidgetKeyForKpiTitle(kpi.title);
        return key ? isWidgetEnabled(key) : false;
      }),
    [kpiCards, isWidgetEnabled]
  );

  if (visibleKpiCards.length === 0) return null;

  return (
    <section>
      <div className="flex items-end justify-between mb-2">
        <div>
          <h2 className="text-[10px] font-bold uppercase tracking-wider text-green-800">
            Inventory
          </h2>
          <p className="text-xs text-stone-600 mt-0.5">Stock and orders at a glance</p>
        </div>
        <Link
          to={invHref}
          className="text-xs font-semibold text-green-800 hover:underline"
        >
          View inventory →
        </Link>
      </div>
      <div className={cn(kpiGridClassName(visibleKpiCards.length))}>
        {visibleKpiCards.map((kpi) => (
          <Fragment key={kpi.title}>
            <KPICard
              title={kpi.title}
              value={kpi.value}
              trend={0}
              trendText=""
              trendStatus="neutral"
              subtitle={kpi.subtitle}
            />
          </Fragment>
        ))}
      </div>
    </section>
  );
}

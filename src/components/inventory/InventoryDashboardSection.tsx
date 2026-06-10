import { Link, useSearchParams } from "react-router-dom";
import { KPICard } from "@/components/KPICard";
import { formatCurrency } from "@/data/mockData";
import { useInventoryData } from "@/domains/inventory/hooks";

export function InventoryDashboardSection() {
  const { kpis } = useInventoryData();
  const [searchParams] = useSearchParams();
  const qs = searchParams.toString();
  const invHref = `/inventory${qs ? `?${qs}` : ""}`;

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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        <KPICard
          title="Total Products"
          value={String(kpis.totalProducts)}
          trend={0}
          trendText=""
          trendStatus="neutral"
          subtitle="Active items"
        />
        <KPICard
          title="Stock Value"
          value={formatCurrency(kpis.totalStockValue)}
          trend={0}
          trendText=""
          trendStatus="neutral"
          subtitle="At cost price"
        />
        <KPICard
          title="Low on Stock"
          value={String(kpis.lowStockCount)}
          trend={0}
          trendText=""
          trendStatus="neutral"
          subtitle="Limited or out"
        />
        <KPICard
          title="Open POs"
          value={String(kpis.openPurchaseOrders)}
          trend={0}
          trendText=""
          trendStatus="neutral"
          subtitle="Pending delivery"
        />
      </div>
    </section>
  );
}

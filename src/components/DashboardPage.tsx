import { Fragment, useMemo } from "react";
import { KPICard } from "./KPICard";
import { FinancialChart } from "./FinancialChart";
import { CropTable } from "./CropTable";
import { LivestockTable } from "./LivestockTable";
import { ReceivablesTable } from "./ReceivablesTable";
import { ExpenseBreakdown } from "./ExpenseBreakdown";
import { AIInsightsPanel } from "./AIInsightsPanel";
import { dashboardKPIs } from "@/data/mockData";
import { useAgroData } from "@/domains/agro/hooks";
import type { KPIData } from "@/data/types";
import { Download, Calendar } from "lucide-react";

export function DashboardPage() {
  const { kpis } = useAgroData();

  // Replace the two static agro KPI entries with computed values from the domain
  const kpiCards = useMemo((): KPIData[] => {
    return dashboardKPIs.map((kpi) => {
      if (kpi.title === "Corn Production") {
        return { ...kpi, value: `${kpis.totalActualYieldTons} tons` };
      }
      if (kpi.title === "Cattle Count") {
        return { ...kpi, value: `${kpis.totalHeadCount} head` };
      }
      return kpi;
    });
  }, [kpis]);

  return (
    <div className="flex flex-1 flex-col text-[#1C1917] font-sans min-h-0">
      <header className="h-14 bg-white border-b border-stone-200 px-6 sm:px-10 flex items-center justify-between shadow-sm flex-shrink-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between w-full max-w-7xl mx-auto">
          <div className="flex flex-col">
            <h1 className="text-lg font-bold text-stone-900 leading-none flex items-center">
              Agro Dashboard
            </h1>
            <p className="text-[10px] text-stone-500 uppercase tracking-wider font-semibold mt-1">Financial & Operational Overview</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 bg-stone-100 rounded border border-stone-200 text-xs text-stone-600 font-medium flex items-center gap-2">
              <Calendar className="w-3 h-3 text-stone-600" />
              This Month
            </div>
            <button className="bg-stone-800 text-white px-4 py-1.5 rounded text-xs font-bold hover:bg-stone-700 transition-colors shadow-sm flex items-center">
              <Download className="mr-2 h-3 w-3" />
              Export Report
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 p-6 sm:p-10 max-w-7xl mx-auto w-full space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
          {kpiCards.map((kpi) => (
            <Fragment key={kpi.title}>
              <KPICard
                title={kpi.title}
                value={kpi.value}
                trend={kpi.trend}
                trendText={kpi.trendText}
                trendStatus={kpi.trendStatus}
              />
            </Fragment>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="col-span-1 lg:col-span-8">
            <FinancialChart />
          </div>
          <div className="col-span-1 lg:col-span-4 h-full">
            <AIInsightsPanel />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="col-span-1 lg:col-span-4">
            <CropTable />
          </div>
          <div className="col-span-1 lg:col-span-4">
            <LivestockTable />
          </div>
          <div className="col-span-1 lg:col-span-4">
            <ExpenseBreakdown />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="col-span-1 lg:col-span-12">
            <ReceivablesTable />
          </div>
        </div>
      </main>
    </div>
  );
}
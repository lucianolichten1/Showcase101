import { Fragment, useMemo, useState } from "react";
import { FinancialPeriodFilter } from "./FinancialPeriodFilter";
import { KPICard } from "./KPICard";
import { FinancialChart } from "./FinancialChart";
import { CropTable } from "./CropTable";
import { LivestockTable } from "./LivestockTable";
import { ReceivablesTable } from "./ReceivablesTable";
import { ExpenseBreakdown } from "./ExpenseBreakdown";
import { AIInsightsPanel } from "./AIInsightsPanel";
import { dashboardKPIs, formatCurrency } from "@/data/mockData";
import { useAgroData } from "@/domains/agro/hooks";
import { useFinancialData } from "@/domains/financial/hooks";
import {
  DEFAULT_FINANCIAL_PERIOD,
  getDateRangeForPeriod,
  getFinancialPeriodLabel,
  type FinancialPeriod,
} from "@/domains/financial/period";
import type { KPIData } from "@/data/types";

function kpiPeriodSubtitle(title: string, periodLabel: string): string | undefined {
  if (title === "Total Revenue" || title === "Total Expenses" || title === "Net Profit") {
    return periodLabel;
  }
  if (title === "Accounts Receivable") return "Outstanding receivables (all open invoices)";
  if (title === "Corn Production" || title === "Cattle Count") return "Current operation data";
  return undefined;
}

export function DashboardPage() {
  const { kpis: agroKpis } = useAgroData();
  const { kpis: financialKpis, setDateRange } = useFinancialData();
  const [period, setPeriod] = useState<FinancialPeriod>(DEFAULT_FINANCIAL_PERIOD);
  const periodLabel = getFinancialPeriodLabel(period);

  const handlePeriodChange = (next: FinancialPeriod) => {
    setPeriod(next);
    setDateRange(getDateRangeForPeriod(next));
  };

  const kpiCards = useMemo((): KPIData[] => {
    return dashboardKPIs.map((kpi) => {
      if (kpi.title === "Corn Production")
        return { ...kpi, value: `${agroKpis.totalActualYieldTons} tons` };
      if (kpi.title === "Cattle Count")
        return { ...kpi, value: `${agroKpis.totalHeadCount} head` };
      if (kpi.title === "Total Revenue")
        return { ...kpi, value: formatCurrency(financialKpis.totalRevenue) };
      if (kpi.title === "Total Expenses")
        return { ...kpi, value: formatCurrency(financialKpis.totalExpenses) };
      if (kpi.title === "Net Profit")
        return { ...kpi, value: formatCurrency(financialKpis.netProfit) };
      if (kpi.title === "Accounts Receivable")
        return { ...kpi, value: formatCurrency(financialKpis.receivablesTotalOutstanding) };
      return kpi;
    });
  }, [agroKpis, financialKpis]);

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
            <FinancialPeriodFilter
              id="dashboard-period"
              period={period}
              onPeriodChange={handlePeriodChange}
              className="w-44"
            />
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
                subtitle={kpiPeriodSubtitle(kpi.title, periodLabel)}
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
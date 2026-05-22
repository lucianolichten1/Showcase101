import { Fragment, useMemo, useState } from "react";
import { FinancialPeriodFilter } from "./FinancialPeriodFilter";
import { KPICard } from "./KPICard";
import { FinancialChart } from "./FinancialChart";
import { ReceivablesTable } from "./ReceivablesTable";
import { ExpenseBreakdown } from "./ExpenseBreakdown";
import { AIInsightsPanel } from "./AIInsightsPanel";
import { FinancialEmptyBanner } from "./FinancialEmptyBanner";
import { dashboardKPIs, formatCurrency } from "@/data/mockData";
import { useFinancialData, useSyncFinancialPeriod } from "@/domains/financial/hooks";
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
  return undefined;
}

function SectionHeading({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-4">
      <h2 className="text-xs font-bold uppercase tracking-wider text-stone-500">{title}</h2>
      {description && (
        <p className="text-sm text-stone-600 mt-1">{description}</p>
      )}
    </div>
  );
}

export function DashboardPage() {
  const { kpis: financialKpis, setDateRange, usesImportedData, importedData } =
    useFinancialData();
  const [period, setPeriod] = useState<FinancialPeriod>(DEFAULT_FINANCIAL_PERIOD);
  const periodLabel = getFinancialPeriodLabel(period);

  useSyncFinancialPeriod(period, setDateRange);

  const handlePeriodChange = (next: FinancialPeriod) => {
    setPeriod(next);
    setDateRange(getDateRangeForPeriod(next));
  };

  const kpiCards = useMemo((): KPIData[] => {
    return dashboardKPIs.map((kpi) => {
      if (kpi.title === "Total Revenue")
        return {
          ...kpi,
          value: formatCurrency(financialKpis.totalRevenue),
          trend: 0,
          trendText: usesImportedData ? "" : "Import Excel to populate",
          trendStatus: "neutral" as const,
        };
      if (kpi.title === "Total Expenses")
        return {
          ...kpi,
          value: formatCurrency(financialKpis.totalExpenses),
          trend: 0,
          trendText: usesImportedData ? "" : "Import Excel to populate",
          trendStatus: "neutral" as const,
        };
      if (kpi.title === "Net Profit")
        return {
          ...kpi,
          value: formatCurrency(financialKpis.netProfit),
          trend: 0,
          trendText: usesImportedData
            ? financialKpis.totalRevenue > 0
              ? `${financialKpis.profitMargin}% margin`
              : ""
            : "Import Excel to populate",
          trendStatus: "neutral" as const,
        };
      if (kpi.title === "Accounts Receivable")
        return { ...kpi, value: formatCurrency(financialKpis.receivablesTotalOutstanding) };
      return kpi;
    });
  }, [financialKpis, usesImportedData]);

  return (
    <div className="flex flex-1 flex-col text-[#1C1917] font-sans min-h-0 bg-stone-50/40">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-10 py-6 sm:py-8 space-y-8 sm:space-y-10">
          {/* Page header */}
          <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-stone-900 tracking-tight">
                Financial Dashboard
              </h1>
              <p className="text-sm text-stone-600 mt-1 max-w-xl">
                Financial overview for your company. Use the period selector to focus
                KPIs and charts on a specific timeframe.
              </p>
            </div>
            <FinancialPeriodFilter
              id="dashboard-period"
              period={period}
              onPeriodChange={handlePeriodChange}
              className="w-full sm:w-52 shrink-0 sm:ml-auto sm:mr-8 lg:mr-16"
            />
          </section>

          {!usesImportedData && (
            <FinancialEmptyBanner
              title="No financial data imported yet"
              description="Upload an Excel workbook to populate the dashboard with revenue, expenses, and financial charts."
            />
          )}

          {/* KPIs */}
          <section>
            <SectionHeading
              title="Key metrics"
              description={
                usesImportedData && importedData
                  ? `Imported data · ${periodLabel.toLowerCase()}`
                  : "Financial KPIs show $0 until you import Excel data"
              }
            />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
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
          </section>

          {/* Financial chart + insights */}
          <section>
            <SectionHeading
              title="Financial overview"
              description={
                usesImportedData
                  ? "Monthly revenue and expenses from imported data"
                  : "Monthly revenue and expenses based on your selected period"
              }
            />
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
              <div className="lg:col-span-8">
                <FinancialChart period={period} />
              </div>
              <div className="lg:col-span-4">
                <AIInsightsPanel />
              </div>
            </div>
          </section>

          {/* Expenses + Receivables */}
          <section>
            <SectionHeading
              title="Expenses & Receivables"
              description="Category breakdown and outstanding invoices"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
              <ExpenseBreakdown />
              <ReceivablesTable />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

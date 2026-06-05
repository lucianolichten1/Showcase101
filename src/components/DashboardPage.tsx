import { Fragment, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, PlusCircle, BarChart3 } from "lucide-react";
import { FinancialPeriodFilter } from "./FinancialPeriodFilter";
import { KPICard } from "./KPICard";
import { FinancialChart } from "./FinancialChart";
import { ReceivablesTable } from "./ReceivablesTable";
import { ExpenseBreakdown } from "./ExpenseBreakdown";
import { FinancialEmptyBanner } from "./FinancialEmptyBanner";
import { CompanyContextBanner } from "./company/CompanyContextBanner";
import { dashboardKPIs, formatCurrency } from "@/data/mockData";
import { useSyncFinancialPeriod } from "@/domains/financial/hooks";
import { useCompanyScopedFinancialData } from "@/domains/company/useCompanyScopedFinancialData";
import {
  DEFAULT_FINANCIAL_PERIOD,
  getDateRangeForPeriod,
  getFinancialPeriodLabel,
  type FinancialPeriod,
} from "@/domains/financial/period";
import type { KPIData } from "@/data/types";

function kpiPeriodSubtitle(title: string, periodLabel: string): string | undefined {
  if (title === "Total Revenue" || title === "Total Costs" || title === "Net Profit") {
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

function DashboardGetStarted() {
  const navigate = useNavigate();
  const steps = [
    {
      icon: Upload,
      title: "Import your data",
      description: "Upload an Excel workbook with Sales, Expenses, or AR sheets to populate all charts and KPIs automatically.",
      action: "Go to Import",
      onClick: () => navigate("/export-import"),
      primary: true,
    },
    {
      icon: PlusCircle,
      title: "Add revenue manually",
      description: "Record sales and income one entry at a time. No file needed — just type in the details.",
      action: "Add Revenue",
      onClick: () => navigate("/revenue"),
      primary: false,
    },
    {
      icon: BarChart3,
      title: "Add expenses manually",
      description: "Track operational costs, supplier payments, and business expenses by entering them directly.",
      action: "Add Expense",
      onClick: () => navigate("/expenses"),
      primary: false,
    },
  ];

  return (
    <section className="rounded-xl border border-stone-200 bg-white shadow-sm p-6 sm:p-8">
      <div className="mb-6">
        <h2 className="text-base font-bold text-stone-900 tracking-tight">Get started with your financial data</h2>
        <p className="text-sm text-stone-500 mt-1">Choose how you'd like to populate your dashboard. You can always mix both methods.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {steps.map(({ icon: Icon, title, description, action, onClick, primary }) => (
          <div key={title} className={`rounded-lg border p-4 flex flex-col gap-3 ${primary ? "border-green-200 bg-green-50/50" : "border-stone-200 bg-stone-50/50"}`}>
            <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${primary ? "bg-green-800 text-white" : "bg-stone-200 text-stone-600"}`}>
              <Icon size={18} />
            </div>
            <div>
              <p className="text-sm font-semibold text-stone-900">{title}</p>
              <p className="text-xs text-stone-500 mt-1 leading-relaxed">{description}</p>
            </div>
            <button
              type="button"
              onClick={onClick}
              className={`mt-auto self-start px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${primary ? "bg-green-800 text-white hover:bg-green-700" : "bg-white border border-stone-200 text-stone-700 hover:bg-stone-50"}`}
            >
              {action} →
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

export function DashboardPage() {
  const { kpis: financialKpis, setDateRange, usesImportedData, importedData } =
    useCompanyScopedFinancialData();
  const [period, setPeriod] = useState<FinancialPeriod>(DEFAULT_FINANCIAL_PERIOD);
  const periodLabel =
    usesImportedData && period.kind === "all"
      ? "Last 12 months"
      : getFinancialPeriodLabel(period);

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
      if (kpi.title === "Total Costs")
        return {
          ...kpi,
          value: formatCurrency(financialKpis.totalCosts),
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
          <CompanyContextBanner />
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

          {!usesImportedData && <DashboardGetStarted />}

          {/* KPIs */}
          <section>
            <SectionHeading
              title="Key metrics"
              description={
                usesImportedData && importedData
                  ? `Imported data · ${periodLabel.toLowerCase()}`
                  : "KPIs will populate once you add or import financial data"
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

          {/* Financial chart */}
          <section>
            <SectionHeading
              title="Financial overview"
              description={
                usesImportedData
                  ? "Monthly revenue and expenses from imported data"
                  : "Monthly revenue and expenses based on your selected period"
              }
            />
            <FinancialChart period={period} />
          </section>

          {/* Expenses + Receivables */}
          <section>
            <SectionHeading
              title="Expenses & Receivables"
              description="Category breakdown and outstanding invoices"
            />
            <div className="flex flex-col gap-4 lg:gap-6">
              <ReceivablesTable />
              <ExpenseBreakdown />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

import { Fragment, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, PlusCircle, BarChart3 } from "lucide-react";
import { FinancialPeriodFilter } from "./FinancialPeriodFilter";
import { KPICard } from "./KPICard";
import { FinancialChart } from "./FinancialChart";
import { ReceivablesTable } from "./ReceivablesTable";
import { ExpenseBreakdown } from "./ExpenseBreakdown";
import { dashboardKPIs, formatCurrency } from "@/data/mockData";
import { useSyncFinancialPeriod } from "@/domains/financial/hooks";
import { dashboardWidgetKeyForKpiTitle } from "@/domains/admin/dashboardWidgets";
import { useCompanyBranding } from "@/domains/company/CompanyBrandingContext";
import { useCompanyScopedFinancialData } from "@/domains/company/useCompanyScopedFinancialData";
import { cn } from "@/lib/utils";
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
  if (title === "Accounts Receivable") return "Open invoices";
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
    <div className="mb-2">
      <h2 className="text-[10px] font-bold uppercase tracking-wider text-company-primary">{title}</h2>
      {description && (
        <p className="text-xs text-stone-600 mt-0.5">{description}</p>
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
        <p className="text-sm text-stone-700 mt-1">Choose how you'd like to populate your dashboard. You can always mix both methods.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {steps.map(({ icon: Icon, title, description, action, onClick, primary }) => (
          <div key={title} className={`rounded-lg border p-4 flex flex-col gap-3 ${primary ? "border-company-primary-soft bg-company-primary-soft" : "border-stone-200 bg-stone-50/50"}`}>
            <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${primary ? "bg-company-primary text-white" : "bg-stone-200 text-stone-600"}`}>
              <Icon size={18} />
            </div>
            <div>
              <p className="text-sm font-semibold text-stone-900">{title}</p>
              <p className="text-xs text-stone-700 mt-1 leading-relaxed">{description}</p>
            </div>
            <button
              type="button"
              onClick={onClick}
              className={`mt-auto self-start px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${primary ? "bg-company-primary text-white hover:bg-company-primary-dark" : "bg-white border border-stone-200 text-stone-700 hover:bg-stone-50"}`}
            >
              {action} →
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

function kpiGridClassName(count: number): string {
  if (count <= 1) return "grid grid-cols-1 gap-2 sm:gap-3";
  if (count === 2) return "grid grid-cols-2 gap-2 sm:gap-3";
  if (count === 3) return "grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3";
  return "grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3";
}

export function DashboardPage() {
  const { isWidgetEnabled } = useCompanyBranding();
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
        return {
          ...kpi,
          value: formatCurrency(financialKpis.receivablesTotalOutstanding),
          trend: 0,
          trendText: "",
          trendStatus: "neutral" as const,
        };
      return kpi;
    });
  }, [financialKpis, usesImportedData]);

  const visibleKpiCards = useMemo(
    () =>
      kpiCards.filter((kpi) => {
        const key = dashboardWidgetKeyForKpiTitle(kpi.title);
        return key ? isWidgetEnabled(key) : true;
      }),
    [kpiCards, isWidgetEnabled]
  );

  const showFinancialOverview = isWidgetEnabled("financial-overview");
  const showReceivablesTable = isWidgetEnabled("receivables-table");
  const showExpenseBreakdown = isWidgetEnabled("expense-breakdown");
  const showExpensesReceivablesSection = showReceivablesTable || showExpenseBreakdown;

  return (
    <div className="flex flex-1 flex-col text-[#1C1917] font-sans min-h-0 bg-stone-50/40">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-10 py-4 sm:py-5 space-y-5">
          {/* Page header */}
          <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between rounded-xl border border-stone-200 bg-white shadow-sm px-4 py-3.5 sm:px-5">
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

          {visibleKpiCards.length > 0 && (
            <section>
              <SectionHeading
                title="Key metrics"
                description={
                  usesImportedData && importedData
                    ? `Imported data · ${periodLabel.toLowerCase()}`
                    : "KPIs will populate once you add or import financial data"
                }
              />
              <div className={cn(kpiGridClassName(visibleKpiCards.length))}>
                {visibleKpiCards.map((kpi) => (
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
          )}

          {showFinancialOverview && (
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
          )}

          {showExpensesReceivablesSection && (
            <section>
              <SectionHeading
                title="Expenses & Receivables"
                description="Category breakdown and outstanding invoices"
              />
              <div className="flex flex-col gap-4 lg:gap-6">
                {showReceivablesTable && <ReceivablesTable />}
                {showExpenseBreakdown && <ExpenseBreakdown />}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

import { useMemo, useState, Fragment } from "react";
import { Download, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { FinancialEmptyBanner } from "@/components/FinancialEmptyBanner";
import { FinancialPeriodFilter } from "@/components/FinancialPeriodFilter";
import { monthlyFinancials, expenseCategories, formatCurrency } from "@/data/mockData";
import {
  calculateTotalCost,
  calculateTotalExpenses,
  calculateTotalRevenue,
  computeMonthlyFinancials,
  isActiveRevenue,
} from "@/domains/financial/calculations";
import type { RevenueRecord } from "@/domains/financial/types";
import { useSyncFinancialPeriod } from "@/domains/financial/hooks";
import { useCompanyScopedFinancialData } from "@/domains/company/useCompanyScopedFinancialData";
import {
  DEFAULT_FINANCIAL_PERIOD,
  DEMO_FINANCIAL_YEAR,
  getDateRangeForPeriod,
  getDemoPlMonthIndex,
  getFinancialPeriodLabel,
  getPlSectionSubtitle,
  type FinancialPeriod,
} from "@/domains/financial/period";
import { rowsToCsv, downloadCsvFile } from "@/lib/csv";
import { cn } from "@/lib/utils";
import { KPICard } from "@/components/KPICard";

// ─── Constants ────────────────────────────────────────────────────────────────

const MAY_IDX = 4;
const MAY_REVENUE = monthlyFinancials[MAY_IDX].revenue;
const MAY_EXPENSES = monthlyFinancials[MAY_IDX].expenses;

const COGS_CATEGORIES = ["Cost of Goods", "Direct Materials"];

// Generic revenue breakdown for demo P&L — replaced by imported data when available
const BASE_REVENUE_LINES = [
  { label: "Product Sales", amount: Math.round(MAY_REVENUE * 0.75) },
  { label: "Service Revenue", amount: Math.round(MAY_REVENUE * 0.15) },
  { label: "Other Income", amount: MAY_REVENUE - Math.round(MAY_REVENUE * 0.75) - Math.round(MAY_REVENUE * 0.15) },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function PLRow({ label, amount, indent = false, bold = false, positive }: {
  label: string; amount: number; indent?: boolean; bold?: boolean; positive?: boolean;
}) {
  const amountColor =
    positive === true ? "text-stone-900"
    : positive === false ? "text-stone-900"
    : "text-stone-900";
  return (
    <div className={cn("flex items-center justify-between gap-3 py-2 border-b border-stone-50 last:border-0 min-w-0", indent && "pl-4")}>
      <span className={cn("text-sm text-stone-600 min-w-0 truncate", bold && "font-bold text-stone-900", indent && "text-xs")}>
        {label}
      </span>
      <span className={cn("text-sm shrink-0 tabular-nums", bold && "font-bold", amountColor)}>
        {formatCurrency(amount)}
      </span>
    </div>
  );
}

function SectionHeader({ label }: { label: string }) {
  return <p className="text-xs font-bold uppercase tracking-wider text-green-800 mt-4 mb-1">{label}</p>;
}

function Divider() {
  return <div className="border-t-2 border-stone-200 my-2" />;
}

function TrendBadge({ pct }: { pct: number | null }) {
  if (pct === null) return <span className="text-[10px] text-stone-600">First month</span>;
  if (pct === 0) return (
    <span className="flex items-center gap-0.5 text-[10px] text-stone-600 font-medium">
      <Minus size={10} /> 0% vs prev
    </span>
  );
  const up = pct > 0;
  return (
    <span className={cn("flex items-center gap-0.5 text-[10px] font-medium text-stone-600")}>
      {up ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
      {up ? "+" : ""}{pct}% vs prev
    </span>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

function groupExpenseAmountsByCategory(
  records: { category: string; amount: number }[]
): { label: string; amount: number }[] {
  const totals = new Map<string, number>();
  for (const record of records) {
    const label = record.category || "Other";
    totals.set(label, (totals.get(label) ?? 0) + record.amount);
  }
  return Array.from(totals.entries())
    .map(([label, amount]) => ({ label, amount }))
    .sort((a, b) => b.amount - a.amount);
}

function groupExpensesWithPercentage(
  records: { category: string; amount: number }[]
): { label: string; amount: number; percentage: number }[] {
  const grouped = groupExpenseAmountsByCategory(records);
  const grand = grouped.reduce((s, r) => s + r.amount, 0);
  return grouped.map((r) => ({
    ...r,
    percentage: grand > 0 ? Math.round((r.amount / grand) * 100) : 0,
  }));
}

function groupRevenueAmountsByProduct(
  records: RevenueRecord[]
): { label: string; amount: number }[] {
  const totals = new Map<string, number>();
  for (const record of records) {
    if (!isActiveRevenue(record)) continue;
    const label = record.productService.trim() || "Other";
    totals.set(label, (totals.get(label) ?? 0) + record.amount);
  }
  return Array.from(totals.entries())
    .map(([label, amount]) => ({ label, amount }))
    .sort((a, b) => b.amount - a.amount);
}

export function ReportsPage() {
  const {
    kpis: financialKpis,
    setDateRange,
    usesImportedData,
    filteredRevenueRecords,
    filteredExpenseRecords,
    revenueRecords,
    expenseRecords,
  } = useCompanyScopedFinancialData();
  const [period, setPeriod] = useState<FinancialPeriod>(DEFAULT_FINANCIAL_PERIOD);
  const periodLabel = getFinancialPeriodLabel(period);
  const plMonthIdx = getDemoPlMonthIndex(period);
  const plSubtitle = getPlSectionSubtitle(period);

  useSyncFinancialPeriod(period, setDateRange);

  const handlePeriodChange = (next: FinancialPeriod) => {
    setPeriod(next);
    setDateRange(getDateRangeForPeriod(next));
  };

  const handlePlMonthSelect = (idx: number) => {
    handlePeriodChange({
      kind: "month",
      year: DEMO_FINANCIAL_YEAR,
      month: idx + 1,
    });
  };

  const trendRows = useMemo(() => {
    if (!usesImportedData) return [];
    return computeMonthlyFinancials(revenueRecords, expenseRecords, { kind: "all" }, {
      useDataDrivenMonths: true,
    });
  }, [usesImportedData, revenueRecords, expenseRecords]);

  const current = monthlyFinancials[plMonthIdx];
  const prev = plMonthIdx > 0 ? monthlyFinancials[plMonthIdx - 1] : null;

  const trendPct = (cur: number, prv: number | undefined) =>
    prv && prv > 0 ? Math.round(((cur - prv) / prv) * 100) : null;

  const revenueScale = current.revenue / MAY_REVENUE;
  const expenseScale = current.expenses / MAY_EXPENSES;

  const demoRevenueLines = useMemo(
    () =>
      BASE_REVENUE_LINES.map((l) => ({
        ...l,
        amount: Math.round(l.amount * revenueScale),
      })),
    [revenueScale]
  );

  const scaledExpenses = useMemo(
    () =>
      expenseCategories.map((e) => ({
        ...e,
        amount: Math.round(e.amount * expenseScale),
      })),
    [expenseScale]
  );

  const importedPl = useMemo(() => {
    const totalRevenue = calculateTotalRevenue(filteredRevenueRecords);
    const totalCOGS = calculateTotalCost(filteredRevenueRecords);
    const totalExpenses = calculateTotalExpenses(filteredExpenseRecords);
    const grossProfit = totalRevenue - totalCOGS;
    const netProfit = grossProfit - totalExpenses;
    const expenseLines = groupExpenseAmountsByCategory(filteredExpenseRecords);
    const expenseBreakdown = groupExpensesWithPercentage(filteredExpenseRecords);
    const topExpenseCategory = expenseBreakdown[0]?.label ?? null;
    return {
      revenueLines: groupRevenueAmountsByProduct(filteredRevenueRecords),
      expenseLines,
      expenseBreakdown,
      topExpenseCategory,
      totalRevenue,
      totalCOGS,
      grossProfit,
      totalExpenses,
      netProfit,
      grossMargin:
        totalRevenue > 0 ? Math.round((grossProfit / totalRevenue) * 100) : 0,
      netMargin: totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : 0,
    };
  }, [filteredRevenueRecords, filteredExpenseRecords]);

  const revenueLines = usesImportedData ? importedPl.revenueLines : demoRevenueLines;

  const cogsCategories = usesImportedData
    ? []
    : scaledExpenses.filter((e) => COGS_CATEGORIES.includes(e.category));
  const opexCategories = usesImportedData
    ? importedPl.expenseLines
    : scaledExpenses.filter((e) => !COGS_CATEGORIES.includes(e.category)).map((e) => ({ label: e.category, amount: e.amount }));

  const totalRevenue = usesImportedData ? importedPl.totalRevenue : current.revenue;
  const totalCOGS = usesImportedData ? importedPl.totalCOGS : cogsCategories.reduce((s, e) => s + e.amount, 0);
  const grossProfit = usesImportedData ? importedPl.grossProfit : totalRevenue - totalCOGS;
  const totalOpEx = usesImportedData
    ? importedPl.totalExpenses
    : opexCategories.reduce((s, e) => s + e.amount, 0);
  const netProfit = usesImportedData ? importedPl.netProfit : grossProfit - totalOpEx;
  const grossMargin = usesImportedData
    ? importedPl.grossMargin
    : totalRevenue > 0
      ? Math.round((grossProfit / totalRevenue) * 100)
      : 0;
  const netMargin = usesImportedData
    ? importedPl.netMargin
    : totalRevenue > 0
      ? Math.round((netProfit / totalRevenue) * 100)
      : 0;

  const handleExport = () => {
    const headers = ["Item", "Category", "Amount (Bs)"];
    const rows = [
      ...revenueLines.map((l) => ({ "Item": l.label, "Category": "Revenue", "Amount (Bs)": l.amount.toString() })),
      { "Item": "Total Revenue", "Category": "Revenue", "Amount (Bs)": totalRevenue.toString() },
      ...cogsCategories.map((e) => ({ "Item": e.category, "Category": "COGS", "Amount (Bs)": e.amount.toString() })),
      { "Item": "Total COGS", "Category": "COGS", "Amount (Bs)": totalCOGS.toString() },
      { "Item": "Gross Profit", "Category": "Summary", "Amount (Bs)": grossProfit.toString() },
      ...opexCategories.map((e) => ({ "Item": e.label, "Category": "Operating Expense", "Amount (Bs)": e.amount.toString() })),
      { "Item": "Total OpEx", "Category": "Operating Expense", "Amount (Bs)": totalOpEx.toString() },
      { "Item": "Net Profit", "Category": "Summary", "Amount (Bs)": netProfit.toString() },
    ];
    downloadCsvFile(rowsToCsv(headers, rows), `pl-${current.month}-2026.csv`);
  };

  return (
    <div className="flex flex-1 flex-col text-[#1C1917] font-sans min-h-0 bg-stone-50/40">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-10 py-4 sm:py-5 space-y-5">
      <section className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 rounded-xl border border-stone-200 bg-white shadow-sm px-4 py-3.5 sm:px-5">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Reports</h1>
          <p className="text-sm text-stone-700 mt-1">
            Financial summary for <span className="font-semibold text-stone-900">{periodLabel}</span>
          </p>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-end gap-2">
          <FinancialPeriodFilter
            id="reports-period"
            period={period}
            onPeriodChange={handlePeriodChange}
            className="w-full sm:w-auto"
          />
          <button
            onClick={handleExport}
            disabled={!usesImportedData}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-700 shadow-sm hover:bg-stone-50 transition-colors h-[34px] sm:mb-0 mb-0 self-end disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download size={13} />
            Export
          </button>
        </div>
      </section>

      {!usesImportedData && (
        <FinancialEmptyBanner
          title="Import financial data to generate reports"
          description="Upload an Excel workbook with Sales and Expenses sheets. Profit & Loss and monthly trends will appear here after import."
        />
      )}

      <section>
        <div className="mb-2">
          <h2 className="text-[10px] font-bold uppercase tracking-wider text-green-800">Overview</h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
          <KPICard title="Total Revenue" value={formatCurrency(financialKpis.totalRevenue)} trend={0} trendText="" trendStatus="neutral" subtitle={usesImportedData ? `${periodLabel} · from records` : "Import Excel to populate"} />
          <KPICard title="Gross Profit" value={formatCurrency(usesImportedData ? grossProfit : financialKpis.grossProfit)} trend={0} trendText="" trendStatus="neutral" subtitle={usesImportedData ? `${grossMargin}% margin` : "Import Excel to populate"} />
          <KPICard title="Total Expenses" value={formatCurrency(financialKpis.totalExpenses)} trend={0} trendText="" trendStatus="neutral" subtitle={usesImportedData ? `${periodLabel} · from records` : "Import Excel to populate"} />
          <KPICard title="Net Profit" value={formatCurrency(financialKpis.netProfit)} trend={0} trendText="" trendStatus="neutral" subtitle={usesImportedData && financialKpis.totalRevenue > 0 ? `${Math.round((financialKpis.netProfit / financialKpis.totalRevenue) * 100)}% margin` : usesImportedData ? periodLabel : "Import Excel to populate"} />
        </div>
      </section>

      {usesImportedData && (
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-3">
          <h3 className="text-xs font-bold text-green-800 uppercase tracking-wider">Profit & Loss Statement</h3>
          <span className="text-[10px] font-medium text-stone-600 sm:text-right">
            {plSubtitle}
          </span>
        </div>

        <SectionHeader label="Revenue" />
        {revenueLines.map((l) => <Fragment key={l.label}><PLRow label={l.label} amount={l.amount} indent /></Fragment>)}
        <Divider />
        <PLRow label="Total Revenue" amount={totalRevenue} bold positive={true} />

        <SectionHeader label="Cost of Goods Sold (COGS)" />
        {usesImportedData ? (
          totalCOGS > 0 ? (
            <PLRow label="Cost of sales (from import)" amount={totalCOGS} indent />
          ) : (
            <p className="text-xs text-stone-600 pl-4 py-1">No cost column mapped in import</p>
          )
        ) : (
          cogsCategories.map((e) => (
            <Fragment key={e.category}>
              <PLRow label={e.category} amount={e.amount} indent />
            </Fragment>
          ))
        )}
        <Divider />
        <PLRow label="Total COGS" amount={totalCOGS} bold />

        <div className="flex items-center justify-between py-3 mt-1 bg-stone-50 rounded-lg px-3 mb-2">
          <span className="text-sm font-bold text-stone-900">Gross Profit</span>
          <div className="text-right">
            <span className="text-sm font-bold text-stone-900">{formatCurrency(grossProfit)}</span>
            <span className="ml-2 text-[10px] text-stone-600">{grossMargin}% margin</span>
          </div>
        </div>

        <SectionHeader label="Operating Expenses" />
        {opexCategories.map((e) => (
          <Fragment key={e.label}>
            <PLRow label={e.label} amount={e.amount} indent />
          </Fragment>
        ))}
        <Divider />
        <PLRow label="Total Operating Expenses" amount={totalOpEx} bold />

        <div className="flex items-center justify-between py-3 mt-2 bg-stone-50 rounded-lg px-3 border border-stone-200">
          <span className="text-sm font-bold text-stone-900">Net Profit</span>
          <div className="text-right">
            <span className="text-sm font-bold text-stone-900">{formatCurrency(netProfit)}</span>
            <span className="ml-2 text-[10px] text-stone-600">{netMargin}% margin</span>
          </div>
        </div>

        {usesImportedData && importedPl.netProfit !== 0 && (
          <div className="mt-4 rounded-lg bg-stone-50 border border-stone-100 px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-green-800 mb-1">Summary</p>
            <p className="text-xs text-stone-700 leading-relaxed">
              Net profit of <span className="font-semibold text-stone-700">{formatCurrency(importedPl.netProfit)}</span> represents a <span className="font-semibold text-stone-700">{importedPl.netMargin}%</span> margin for {periodLabel.toLowerCase()}.
              {importedPl.topExpenseCategory && (
                <> Largest expense category: <span className="font-semibold text-stone-700">{importedPl.topExpenseCategory}</span> ({formatCurrency(importedPl.expenseLines[0]?.amount ?? 0)}).</>
              )}
              {importedPl.grossMargin > 0 && (
                <> Gross margin after cost of sales: <span className="font-semibold text-stone-700">{importedPl.grossMargin}%</span>.</>
              )}
            </p>
          </div>
        )}
      </div>
      )}

      {usesImportedData && importedPl.expenseBreakdown.length > 1 && (
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-4 sm:p-5">
        <h3 className="text-xs font-bold text-green-800 uppercase tracking-wider mb-4">
          Expense Breakdown by Category
          <span className="ml-2 text-[10px] font-medium normal-case text-stone-600">({periodLabel})</span>
        </h3>
        <div className="space-y-3">
          {importedPl.expenseBreakdown.map((cat) => (
            <div key={cat.label}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-stone-700">{cat.label}</span>
                <span className="text-xs text-stone-700">
                  {formatCurrency(cat.amount)} <span className="text-stone-600">· {cat.percentage}%</span>
                </span>
              </div>
              <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-stone-600 rounded-full transition-all"
                  style={{ width: `${cat.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-stone-600 mt-4">
          Total operating expenses: {formatCurrency(importedPl.totalExpenses)} for {periodLabel.toLowerCase()}.
        </p>
      </div>
      )}

      {usesImportedData && (
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-4 sm:p-5">
        <h3 className="text-xs font-bold text-green-800 uppercase tracking-wider mb-1">Monthly Trend</h3>
        <p className="text-[10px] text-stone-600 mb-3">
          {usesImportedData
            ? "Monthly totals from imported records. Net profit = revenue − total costs (COGS + operating expenses)."
            : `Demo P&L months (Jan–Jun ${DEMO_FINANCIAL_YEAR}). Click a row to set period to that month.`}
        </p>
        <div className="rounded-lg border border-stone-100 overflow-hidden">
          <table className="w-full table-fixed text-left border-collapse">
            <colgroup>
              <col className="w-[52px]" />
              <col className="w-[19%]" />
              <col className="w-[19%]" />
              <col className="w-[19%]" />
              <col className="w-[11%]" />
              <col className="w-[11%]" />
            </colgroup>
            <thead>
              <tr className="border-b-2 border-stone-200 bg-stone-50">
                <th className="px-2 py-2 text-[10px] uppercase font-bold text-stone-800 tracking-wider">Month</th>
                <th className="px-2 py-2 text-[10px] uppercase font-bold text-stone-800 tracking-wider text-right">Revenue</th>
                <th className="px-2 py-2 text-[10px] uppercase font-bold text-stone-800 tracking-wider text-right">Costs</th>
                <th className="px-2 py-2 text-[10px] uppercase font-bold text-stone-800 tracking-wider text-right">Profit</th>
                <th className="px-2 py-2 text-[10px] uppercase font-bold text-stone-800 tracking-wider text-right">Margin</th>
                <th className="px-2 py-2 text-[10px] uppercase font-bold text-stone-800 tracking-wider text-right">Change</th>
              </tr>
            </thead>
            <tbody className="text-[11px] text-stone-900">
              {trendRows.map((row, idx) => {
                const totalCosts = row.cost + row.expenses;
                const margin = row.revenue > 0 ? Math.round((row.profit / row.revenue) * 100) : 0;
                const isSelected = !usesImportedData && idx === plMonthIdx;
                const prevRow = idx > 0 ? trendRows[idx - 1] : null;
                const profitTrend = prevRow ? trendPct(row.profit, prevRow.profit) : null;
                return (
                  <tr
                    key={row.month}
                    onClick={() => !usesImportedData && handlePlMonthSelect(idx)}
                    className={cn(
                      "border-b border-stone-100 last:border-0 cursor-pointer transition-colors",
                      isSelected ? "bg-stone-100/80 hover:bg-stone-100/80" : "hover:bg-stone-50/80"
                    )}
                  >
                    <td className={cn("px-2 py-2 font-semibold whitespace-nowrap", isSelected && "text-stone-900")}>
                      {row.month}
                      {isSelected && <span className="text-[9px] text-stone-500 font-bold ml-0.5">*</span>}
                    </td>
                    <td className="px-2 py-2 text-right tabular-nums truncate">{formatCurrency(row.revenue)}</td>
                    <td className="px-2 py-2 text-right tabular-nums truncate">{formatCurrency(totalCosts)}</td>
                    <td className="px-2 py-2 text-right tabular-nums font-semibold truncate text-stone-900">
                      {formatCurrency(row.profit)}
                    </td>
                    <td className="px-2 py-2 text-right tabular-nums text-stone-700">{margin}%</td>
                    <td className="px-2 py-2 text-right">
                      {profitTrend === null ? (
                        <span className="text-stone-300">—</span>
                      ) : (
                        <span className={cn("font-semibold", profitTrend >= 0 ? "text-green-600" : "text-red-500")}>
                          {profitTrend >= 0 ? "+" : ""}{profitTrend}%
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-[10px] text-stone-600 mt-2">
          {usesImportedData
            ? "P&L and KPI totals use imported sales and expenses for the selected period."
            : `When period is All or YTD, P&L shows the latest demo month (Jun ${DEMO_FINANCIAL_YEAR}) as a sample breakdown.`}
        </p>
      </div>
      )}
        </div>
      </div>
    </div>
  );
}

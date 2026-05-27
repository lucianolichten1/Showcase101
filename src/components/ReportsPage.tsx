import { useMemo, useState, Fragment } from "react";
import { Download, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { FinancialEmptyBanner } from "@/components/FinancialEmptyBanner";
import { CompanyContextBanner } from "@/components/company/CompanyContextBanner";
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
    positive === true ? "text-green-700"
    : positive === false ? "text-red-600"
    : "text-stone-900";
  return (
    <div className={cn("flex items-center justify-between py-2 border-b border-stone-50 last:border-0", indent && "pl-4")}>
      <span className={cn("text-sm text-stone-600", bold && "font-bold text-stone-900", indent && "text-xs")}>
        {label}
      </span>
      <span className={cn("text-sm", bold && "font-bold", amountColor)}>
        {formatCurrency(amount)}
      </span>
    </div>
  );
}

function SectionHeader({ label }: { label: string }) {
  return <p className="text-xs font-bold uppercase tracking-wider text-stone-400 mt-4 mb-1">{label}</p>;
}

function Divider() {
  return <div className="border-t-2 border-stone-200 my-2" />;
}

function TrendBadge({ pct }: { pct: number | null }) {
  if (pct === null) return <span className="text-[10px] text-stone-400">First month</span>;
  if (pct === 0) return (
    <span className="flex items-center gap-0.5 text-[10px] text-stone-400 font-medium">
      <Minus size={10} /> 0% vs prev
    </span>
  );
  const up = pct > 0;
  return (
    <span className={cn("flex items-center gap-0.5 text-[10px] font-bold", up ? "text-green-600" : "text-red-500")}>
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
    <main className="flex flex-col flex-1 min-h-0 overflow-auto bg-stone-50/30">
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-10 py-6 sm:py-8 space-y-6">
      <CompanyContextBanner />
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-stone-900 tracking-tight">Reports</h1>
          <p className="text-sm text-stone-500 mt-1">
            Financial summary for <span className="font-medium text-stone-700">{periodLabel}</span>
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
      </div>

      {!usesImportedData && (
        <FinancialEmptyBanner
          title="Import financial data to generate reports"
          description="Upload an Excel workbook with Sales and Expenses sheets. Profit & Loss and monthly trends will appear here after import."
        />
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-3 rounded-xl border border-stone-200 shadow-sm flex flex-col gap-1">
          <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wide">Total Revenue</span>
          <span className="text-lg font-bold text-stone-900">{formatCurrency(financialKpis.totalRevenue)}</span>
          <span className="text-[10px] text-stone-400">
            {usesImportedData ? `${periodLabel} · from records` : "Import Excel to populate"}
          </span>
        </div>
        <div className="bg-white p-3 rounded-xl border border-stone-200 shadow-sm flex flex-col gap-1">
          <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wide">Gross Profit</span>
          <span className="text-lg font-bold text-stone-900">
            {formatCurrency(usesImportedData ? grossProfit : financialKpis.grossProfit)}
          </span>
          <span className="text-[10px] text-stone-400 font-medium">
            {usesImportedData
              ? `${grossMargin}% margin · ${plSubtitle}`
              : "Import Excel to populate"}
          </span>
        </div>
        <div className="bg-white p-3 rounded-xl border border-stone-200 shadow-sm flex flex-col gap-1">
          <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wide">Total Expenses</span>
          <span className="text-lg font-bold text-stone-900">{formatCurrency(financialKpis.totalExpenses)}</span>
          <span className="text-[10px] text-stone-400">
            {usesImportedData ? `${periodLabel} · from records` : "Import Excel to populate"}
          </span>
        </div>
        <div className="bg-white p-3 rounded-xl border border-stone-200 shadow-sm flex flex-col gap-1">
          <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wide">Net Profit</span>
          <span className="text-lg font-bold text-green-700">{formatCurrency(financialKpis.netProfit)}</span>
          <span className="text-[10px] text-stone-400 font-medium">
            {usesImportedData
              ? financialKpis.totalRevenue > 0
                ? `${Math.round((financialKpis.netProfit / financialKpis.totalRevenue) * 100)}% margin · ${periodLabel}`
                : `— · ${periodLabel}`
              : "Import Excel to populate"}
          </span>
        </div>
      </div>

      {usesImportedData && (
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-stone-800 uppercase tracking-tight">Profit & Loss Statement</h3>
          <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wide text-right max-w-[220px]">
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
            <p className="text-xs text-stone-400 pl-4 py-1">No cost column mapped in import</p>
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
            <span className="text-sm font-bold text-green-700">{formatCurrency(grossProfit)}</span>
            <span className="ml-2 text-[10px] text-stone-400">{grossMargin}% margin</span>
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

        <div className="flex items-center justify-between py-3 mt-2 bg-green-50 rounded-lg px-3 border border-green-100">
          <span className="text-sm font-bold text-green-900">Net Profit</span>
          <div className="text-right">
            <span className="text-sm font-bold text-green-700">{formatCurrency(netProfit)}</span>
            <span className="ml-2 text-[10px] text-stone-400">{netMargin}% margin</span>
          </div>
        </div>

        {usesImportedData && importedPl.netProfit !== 0 && (
          <div className="mt-4 rounded-lg bg-stone-50 border border-stone-100 px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">Summary</p>
            <p className="text-xs text-stone-500 leading-relaxed">
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
        <h3 className="text-sm font-bold text-stone-800 uppercase tracking-tight mb-4">
          Expense Breakdown by Category
          <span className="ml-2 text-[10px] font-medium normal-case text-stone-400">({periodLabel})</span>
        </h3>
        <div className="space-y-3">
          {importedPl.expenseBreakdown.map((cat) => (
            <div key={cat.label}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-stone-700">{cat.label}</span>
                <span className="text-xs text-stone-500">
                  {formatCurrency(cat.amount)} <span className="text-stone-400">· {cat.percentage}%</span>
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
        <p className="text-[10px] text-stone-400 mt-4">
          Total operating expenses: {formatCurrency(importedPl.totalExpenses)} for {periodLabel.toLowerCase()}.
        </p>
      </div>
      )}

      {usesImportedData && (
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-4 sm:p-5">
        <h3 className="text-sm font-bold text-stone-800 uppercase tracking-tight mb-1">Monthly Trend</h3>
        <p className="text-[10px] text-stone-400 mb-3">
          {usesImportedData
            ? "Monthly totals from imported financial records."
            : `Demo P&L months (Jan–Jun ${DEMO_FINANCIAL_YEAR}). Click a row to set period to that month.`}
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="text-[9px] uppercase text-stone-400 font-bold border-b border-stone-100">
              <tr className="h-8">
                <th className="font-bold pr-6">Month</th>
                <th className="font-bold pr-6">Revenue</th>
                <th className="font-bold pr-6">Expenses</th>
                <th className="font-bold pr-6">Net Profit</th>
                <th className="font-bold pr-6">Margin</th>
                <th className="font-bold">vs Prev</th>
              </tr>
            </thead>
            <tbody className="text-[11px] text-stone-800">
              {trendRows.map((row, idx) => {
                const margin = row.revenue > 0 ? Math.round((row.profit / row.revenue) * 100) : 0;
                const isSelected = !usesImportedData && idx === plMonthIdx;
                const prevRow = idx > 0 ? trendRows[idx - 1] : null;
                const profitTrend = prevRow ? trendPct(row.profit, prevRow.profit) : null;
                return (
                  <tr
                    key={row.month}
                    onClick={() => !usesImportedData && handlePlMonthSelect(idx)}
                    className={cn(
                      "h-10 border-b border-stone-50 last:border-0 cursor-pointer transition-colors",
                      isSelected ? "bg-green-50 hover:bg-green-50" : "hover:bg-stone-50"
                    )}
                  >
                    <td className={cn("pr-6 font-semibold", isSelected && "text-green-800")}>
                      {row.month}
                      {!usesImportedData && ` ${DEMO_FINANCIAL_YEAR}`}
                      {isSelected && <span className="text-[9px] text-green-600 font-bold ml-1">← period</span>}
                    </td>
                    <td className="pr-6">{formatCurrency(row.revenue)}</td>
                    <td className="pr-6">{formatCurrency(row.expenses)}</td>
                    <td className={cn("pr-6 font-bold", row.profit > 0 ? "text-green-700" : "text-red-600")}>
                      {formatCurrency(row.profit)}
                    </td>
                    <td className="pr-6 text-stone-500">{margin}%</td>
                    <td>
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
        <p className="text-[10px] text-stone-400 mt-2">
          {usesImportedData
            ? "P&L and KPI totals use imported sales and expenses for the selected period."
            : `When period is All or YTD, P&L shows the latest demo month (Jun ${DEMO_FINANCIAL_YEAR}) as a sample breakdown.`}
        </p>
      </div>
      )}
      </div>
    </main>
  );
}

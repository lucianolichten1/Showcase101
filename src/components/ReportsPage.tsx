import { useMemo, useState, Fragment } from "react";
import { Download, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { FinancialPeriodFilter } from "@/components/FinancialPeriodFilter";
import { monthlyFinancials, expenseCategories, formatCurrency } from "@/data/mockData";
import { plots } from "@/domains/agro/mockData";
import { useFinancialData } from "@/domains/financial/hooks";
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

const COGS_CATEGORIES = ["Feed", "Fertilizer"];

const plotRevenue = plots.reduce((sum, p) => sum + p.revenue, 0);
const BASE_REVENUE_LINES = [
  ...plots.map((p) => ({ label: `Corn Sales — ${p.name}`, amount: p.revenue })),
  { label: "Livestock Sales", amount: MAY_REVENUE - plotRevenue },
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
  return <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mt-4 mb-1">{label}</p>;
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

export function ReportsPage() {
  const { kpis: financialKpis, setDateRange } = useFinancialData();
  const [period, setPeriod] = useState<FinancialPeriod>(DEFAULT_FINANCIAL_PERIOD);
  const periodLabel = getFinancialPeriodLabel(period);
  const plMonthIdx = getDemoPlMonthIndex(period);
  const plSubtitle = getPlSectionSubtitle(period);

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

  const current = monthlyFinancials[plMonthIdx];
  const prev = plMonthIdx > 0 ? monthlyFinancials[plMonthIdx - 1] : null;

  const trendPct = (cur: number, prv: number | undefined) =>
    prv && prv > 0 ? Math.round(((cur - prv) / prv) * 100) : null;

  const revenueScale = current.revenue / MAY_REVENUE;
  const expenseScale = current.expenses / MAY_EXPENSES;

  const revenueLines = useMemo(() =>
    BASE_REVENUE_LINES.map((l) => ({ ...l, amount: Math.round(l.amount * revenueScale) })),
    [revenueScale]
  );

  const scaledExpenses = useMemo(() =>
    expenseCategories.map((e) => ({ ...e, amount: Math.round(e.amount * expenseScale) })),
    [expenseScale]
  );

  const cogsCategories = scaledExpenses.filter((e) => COGS_CATEGORIES.includes(e.category));
  const opexCategories = scaledExpenses.filter((e) => !COGS_CATEGORIES.includes(e.category));

  const totalRevenue = current.revenue;
  const totalCOGS = cogsCategories.reduce((s, e) => s + e.amount, 0);
  const grossProfit = totalRevenue - totalCOGS;
  const totalOpEx = opexCategories.reduce((s, e) => s + e.amount, 0);
  const netProfit = grossProfit - totalOpEx;
  const grossMargin = totalRevenue > 0 ? Math.round((grossProfit / totalRevenue) * 100) : 0;
  const netMargin = totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : 0;

  const handleExport = () => {
    const headers = ["Item", "Category", "Amount (Bs)"];
    const rows = [
      ...revenueLines.map((l) => ({ "Item": l.label, "Category": "Revenue", "Amount (Bs)": l.amount.toString() })),
      { "Item": "Total Revenue", "Category": "Revenue", "Amount (Bs)": totalRevenue.toString() },
      ...cogsCategories.map((e) => ({ "Item": e.category, "Category": "COGS", "Amount (Bs)": e.amount.toString() })),
      { "Item": "Total COGS", "Category": "COGS", "Amount (Bs)": totalCOGS.toString() },
      { "Item": "Gross Profit", "Category": "Summary", "Amount (Bs)": grossProfit.toString() },
      ...opexCategories.map((e) => ({ "Item": e.category, "Category": "Operating Expense", "Amount (Bs)": e.amount.toString() })),
      { "Item": "Total OpEx", "Category": "Operating Expense", "Amount (Bs)": totalOpEx.toString() },
      { "Item": "Net Profit", "Category": "Summary", "Amount (Bs)": netProfit.toString() },
    ];
    downloadCsvFile(rowsToCsv(headers, rows), `pl-${current.month}-2026.csv`);
  };

  return (
    <main className="flex flex-col gap-5 p-5 lg:p-6">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-stone-900">Reports</h1>
          <p className="text-xs text-stone-500 mt-0.5">
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
            className="flex items-center justify-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-700 shadow-sm hover:bg-stone-50 transition-colors h-[34px] sm:mb-0 mb-0 self-end"
          >
            <Download size={13} />
            Export
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-3 rounded-xl border border-stone-200 shadow-sm flex flex-col gap-1">
          <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wide">Total Revenue</span>
          <span className="text-lg font-bold text-stone-900">{formatCurrency(financialKpis.totalRevenue)}</span>
          <span className="text-[10px] text-stone-400">{periodLabel} · from records</span>
        </div>
        <div className="bg-white p-3 rounded-xl border border-stone-200 shadow-sm flex flex-col gap-1">
          <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wide">Gross Profit</span>
          <span className="text-lg font-bold text-stone-900">{formatCurrency(grossProfit)}</span>
          <span className="text-[10px] text-stone-400 font-medium">
            {grossMargin}% margin · {plSubtitle}
          </span>
        </div>
        <div className="bg-white p-3 rounded-xl border border-stone-200 shadow-sm flex flex-col gap-1">
          <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wide">Total Expenses</span>
          <span className="text-lg font-bold text-stone-900">{formatCurrency(financialKpis.totalExpenses)}</span>
          <span className="text-[10px] text-stone-400">{periodLabel} · from records</span>
        </div>
        <div className="bg-white p-3 rounded-xl border border-stone-200 shadow-sm flex flex-col gap-1">
          <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wide">Net Profit</span>
          <span className="text-lg font-bold text-green-700">{formatCurrency(financialKpis.netProfit)}</span>
          <span className="text-[10px] text-stone-400 font-medium">
            {financialKpis.totalRevenue > 0
              ? `${Math.round((financialKpis.netProfit / financialKpis.totalRevenue) * 100)}% margin`
              : "—"}{" "}
            · {periodLabel} · from records
          </span>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5">
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
        {cogsCategories.map((e) => <Fragment key={e.category}><PLRow label={e.category} amount={e.amount} indent /></Fragment>)}
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
        {opexCategories.map((e) => <Fragment key={e.category}><PLRow label={e.category} amount={e.amount} indent /></Fragment>)}
        <Divider />
        <PLRow label="Total Operating Expenses" amount={totalOpEx} bold />

        <div className="flex items-center justify-between py-3 mt-2 bg-green-50 rounded-lg px-3 border border-green-100">
          <span className="text-sm font-bold text-green-900">Net Profit</span>
          <div className="text-right">
            <span className="text-sm font-bold text-green-700">{formatCurrency(netProfit)}</span>
            <span className="ml-2 text-[10px] text-stone-400">{netMargin}% margin</span>
          </div>
        </div>

        <div className="mt-4 rounded-lg bg-stone-50 border border-stone-100 px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">AI Insight — coming soon</p>
          <p className="text-xs text-stone-500 leading-relaxed">
            Net profit of {formatCurrency(netProfit)} represents a {netMargin}% margin in {current.month} {DEMO_FINANCIAL_YEAR}.
            Feed and fertilizer costs account for the largest share of COGS at {formatCurrency(totalCOGS)}.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-4">
        <h3 className="text-sm font-bold text-stone-800 uppercase tracking-tight mb-1">Monthly Trend</h3>
        <p className="text-[10px] text-stone-400 mb-3">
          Demo P&L months (Jan–Jun {DEMO_FINANCIAL_YEAR}). Click a row to set period to that month.
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
              {monthlyFinancials.map((row, idx) => {
                const margin = row.revenue > 0 ? Math.round((row.profit / row.revenue) * 100) : 0;
                const isSelected = idx === plMonthIdx;
                const prevRow = idx > 0 ? monthlyFinancials[idx - 1] : null;
                const profitTrend = prevRow ? trendPct(row.profit, prevRow.profit) : null;
                return (
                  <tr
                    key={row.month}
                    onClick={() => handlePlMonthSelect(idx)}
                    className={cn(
                      "h-10 border-b border-stone-50 last:border-0 cursor-pointer transition-colors",
                      isSelected ? "bg-green-50 hover:bg-green-50" : "hover:bg-stone-50"
                    )}
                  >
                    <td className={cn("pr-6 font-semibold", isSelected && "text-green-800")}>
                      {row.month} {DEMO_FINANCIAL_YEAR}
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
          When period is All or YTD, P&L shows the latest demo month (Jun {DEMO_FINANCIAL_YEAR}) as a sample breakdown.
        </p>
      </div>
    </main>
  );
}

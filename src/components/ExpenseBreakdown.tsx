import { useMemo } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { useCompanyScopedFinancialData } from "@/domains/company/useCompanyScopedFinancialData";
import { formatCurrency } from "@/data/mockData";
import type { ExpenseRecord } from "@/domains/financial/types";

function groupByCategory(
  records: ExpenseRecord[]
): { category: string; amount: number; percentage: number }[] {
  const totals = new Map<string, number>();
  for (const r of records) {
    totals.set(r.category, (totals.get(r.category) ?? 0) + r.amount);
  }
  const grand = Array.from(totals.values()).reduce((s, v) => s + v, 0);
  return Array.from(totals.entries())
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: grand > 0 ? Math.round((amount / grand) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount);
}

const DONUT_COLORS = [
  "#166534",
  "#15803d",
  "#16a34a",
  "#059669",
  "#0d9488",
  "#22c55e",
  "#4ade80",
  "#86efac",
] as const;

interface DonutTooltipProps {
  active?: boolean;
  payload?: { payload: { category: string; amount: number; percentage: number } }[];
}

function DonutTooltip({ active, payload }: DonutTooltipProps) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  return (
    <div className="rounded-lg border border-stone-200 bg-white px-3 py-2 shadow-sm text-xs">
      <p className="font-bold text-stone-900">{item.category}</p>
      <p className="text-stone-600 mt-0.5">{formatCurrency(item.amount)}</p>
      <p className="text-green-800 font-semibold mt-0.5">{item.percentage}%</p>
    </div>
  );
}

export function ExpenseBreakdown() {
  const { expenseRecords, usesImportedData } = useCompanyScopedFinancialData();

  const breakdown = useMemo(() => groupByCategory(expenseRecords), [expenseRecords]);

  const chartData = useMemo(
    () =>
      breakdown.map((item) => ({
        category: item.category,
        amount: item.amount,
        percentage: item.percentage,
      })),
    [breakdown]
  );

  const totalExpenses = useMemo(
    () => breakdown.reduce((sum, item) => sum + item.amount, 0),
    [breakdown]
  );

  return (
    <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-4 sm:p-5 overflow-hidden flex flex-col w-full">
      <h3 className="text-sm font-bold text-stone-900 uppercase tracking-tight mb-4">
        Expense Breakdown
      </h3>
      <div className="flex-1">
        {!usesImportedData || breakdown.length === 0 ? (
          <p className="text-xs text-stone-600 leading-relaxed py-2">
            {usesImportedData
              ? "No expenses in the selected period."
              : "Import an Excel workbook with an Expenses sheet to see category breakdown."}
          </p>
        ) : (
          <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
            <div className="relative w-full sm:w-[220px] h-[220px] shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="amount"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    innerRadius="58%"
                    outerRadius="88%"
                    paddingAngle={breakdown.length > 1 ? 2 : 0}
                    stroke="#fff"
                    strokeWidth={2}
                  >
                    {chartData.map((_, index) => (
                      <Cell
                        key={index}
                        fill={DONUT_COLORS[index % DONUT_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<DonutTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center px-4">
                <span className="text-[9px] font-bold uppercase tracking-wider text-stone-500">
                  Total
                </span>
                <span className="text-sm font-bold text-stone-900 leading-tight mt-0.5">
                  {formatCurrency(totalExpenses)}
                </span>
              </div>
            </div>

            <ul className="flex-1 w-full space-y-2.5 min-w-0">
              {breakdown.map((expense, index) => (
                <li
                  key={expense.category}
                  className="flex items-center gap-3 text-xs"
                >
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: DONUT_COLORS[index % DONUT_COLORS.length] }}
                  />
                  <span className="flex-1 min-w-0 font-semibold text-stone-900 truncate">
                    {expense.category}
                  </span>
                  <span className="shrink-0 font-bold text-green-800">
                    {expense.percentage}%
                  </span>
                  <span className="shrink-0 font-semibold text-stone-600 tabular-nums">
                    {formatCurrency(expense.amount)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

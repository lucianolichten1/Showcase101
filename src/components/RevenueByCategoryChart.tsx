import { useMemo } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { useCompanyScopedFinancialData } from "@/domains/company/useCompanyScopedFinancialData";
import { isActiveRevenue } from "@/domains/financial/calculations";
import { formatCurrency } from "@/data/mockData";
import type { RevenueRecord } from "@/domains/financial/types";

const DONUT_COLORS = [
  "#1e40af",
  "#1d4ed8",
  "#2563eb",
  "#0284c7",
  "#0891b2",
  "#3b82f6",
  "#60a5fa",
  "#93c5fd",
] as const;

function groupByCategory(
  records: RevenueRecord[]
): { category: string; amount: number; percentage: number }[] {
  const totals = new Map<string, number>();
  for (const r of records) {
    if (!isActiveRevenue(r)) continue;
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
      <p className="text-blue-800 font-semibold mt-0.5">{item.percentage}%</p>
    </div>
  );
}

export function RevenueByCategoryChart() {
  const { filteredRevenueRecords, usesImportedData } = useCompanyScopedFinancialData();

  const breakdown = useMemo(
    () => groupByCategory(filteredRevenueRecords),
    [filteredRevenueRecords]
  );

  const totalRevenue = useMemo(
    () => breakdown.reduce((sum, item) => sum + item.amount, 0),
    [breakdown]
  );

  return (
    <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-4 sm:p-5 overflow-hidden flex flex-col w-full">
      <h3 className="text-sm font-bold text-stone-900 uppercase tracking-tight mb-4">
        Revenue by Category
      </h3>
      <div className="flex-1">
        {!usesImportedData || breakdown.length === 0 ? (
          <p className="text-xs text-stone-600 leading-relaxed py-2">
            {usesImportedData
              ? "No revenue in the selected period."
              : "Import an Excel workbook with a Sales sheet to see revenue by category."}
          </p>
        ) : (
          <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
            <div className="relative w-full sm:w-[220px] h-[220px] shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={breakdown}
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
                    {breakdown.map((_, index) => (
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
                  {formatCurrency(totalRevenue)}
                </span>
              </div>
            </div>

            <ul className="flex-1 w-full space-y-2.5 min-w-0">
              {breakdown.map((item, index) => (
                <li key={item.category} className="flex items-center gap-3 text-xs">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: DONUT_COLORS[index % DONUT_COLORS.length] }}
                  />
                  <span className="flex-1 min-w-0 font-semibold text-stone-900 truncate">
                    {item.category}
                  </span>
                  <span className="text-stone-600 tabular-nums shrink-0">
                    {item.percentage}%
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

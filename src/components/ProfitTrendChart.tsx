import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency } from "@/data/mockData";
import { computeMonthlyFinancials } from "@/domains/financial/calculations";
import { useCompanyScopedFinancialData } from "@/domains/company/useCompanyScopedFinancialData";
import {
  getFinancialChartSubtitle,
  type FinancialPeriod,
} from "@/domains/financial/period";

const PROFIT_COLOR = "#15803d";
const LOSS_COLOR = "#b91c1c";

interface ProfitTrendChartProps {
  period: FinancialPeriod;
}

interface TrendTooltipProps {
  active?: boolean;
  payload?: { payload: { month: string; profit: number } }[];
  label?: string;
}

function TrendTooltip({ active, payload, label }: TrendTooltipProps) {
  if (!active || !payload?.length) return null;
  const { profit } = payload[0].payload;
  return (
    <div className="rounded-lg border border-stone-200 bg-white px-3 py-2 shadow-sm text-xs">
      <p className="font-bold text-stone-900">{label}</p>
      <div className="flex items-center justify-between gap-4 mt-1">
        <span className="text-stone-600">Net Profit</span>
        <span
          className="font-semibold tabular-nums"
          style={{ color: profit >= 0 ? PROFIT_COLOR : LOSS_COLOR }}
        >
          {formatCurrency(profit)}
        </span>
      </div>
    </div>
  );
}

export function ProfitTrendChart({ period }: ProfitTrendChartProps) {
  const {
    revenueRecords,
    expenseRecords,
    filteredRevenueRecords,
    filteredExpenseRecords,
    usesImportedData,
  } = useCompanyScopedFinancialData();

  const chartRevenue = usesImportedData ? filteredRevenueRecords : revenueRecords;
  const chartExpenses = usesImportedData ? filteredExpenseRecords : expenseRecords;

  const data = useMemo(
    () =>
      computeMonthlyFinancials(chartRevenue, chartExpenses, period, {
        useDataDrivenMonths: usesImportedData,
      }).map((row) => ({
        month: row.month,
        profit: row.revenue - row.cost - row.expenses,
      })),
    [chartRevenue, chartExpenses, period, usesImportedData]
  );

  const hasData =
    usesImportedData && data.length > 0 && data.some((row) => row.profit !== 0);

  const emptyMessage = !usesImportedData
    ? "Import Excel data to view the profit trend."
    : "No financial data for this period.";

  return (
    <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5 flex flex-col w-full">
      <div className="mb-5">
        <h3 className="text-sm font-bold text-stone-800 uppercase tracking-tight">
          Profit Trend
        </h3>
        <p className="text-xs text-stone-700 mt-1">
          Net profit · {getFinancialChartSubtitle(period)}
        </p>
      </div>
      <div className="w-full h-[260px]">
        {!hasData ? (
          <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-stone-200 bg-stone-50/50">
            <p className="text-sm text-stone-600 text-center px-4">{emptyMessage}</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="profitTrendFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={PROFIT_COLOR} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={PROFIT_COLOR} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f4" />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#1c1917", fontSize: 11, fontWeight: 600 }}
                dy={10}
                interval={0}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#57534e", fontSize: 10, fontWeight: 500 }}
                tickFormatter={(val) => `Bs ${val / 1000}k`}
                dx={-10}
              />
              <ReferenceLine y={0} stroke="#e7e5e4" strokeWidth={1} />
              <Tooltip content={<TrendTooltip />} cursor={{ stroke: "#d6d3d1" }} />
              <Area
                type="monotone"
                dataKey="profit"
                name="Net Profit"
                stroke={PROFIT_COLOR}
                strokeWidth={2}
                fill="url(#profitTrendFill)"
                dot={{ r: 3, fill: PROFIT_COLOR, strokeWidth: 0 }}
                activeDot={{ r: 4 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

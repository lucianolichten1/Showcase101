import { useMemo, useState } from "react";
import {
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { formatCurrency } from "@/data/mockData";
import { computeMonthlyFinancials } from "@/domains/financial/calculations";
import { useCompanyScopedFinancialData } from "@/domains/company/useCompanyScopedFinancialData";
import {
  getFinancialChartSubtitle,
  type FinancialPeriod,
} from "@/domains/financial/period";
import { cn } from "@/lib/utils";

interface FinancialChartProps {
  period: FinancialPeriod;
}

const REVENUE_COLOR = "#15803d";
const EXPENSES_COLOR = "#d6d3d1";

type SeriesKey = "revenue" | "expenses";

interface SeriesConfig {
  key: SeriesKey;
  label: string;
  color: string;
}

const SERIES: SeriesConfig[] = [
  { key: "revenue", label: "Revenue", color: REVENUE_COLOR },
  { key: "expenses", label: "Total Costs", color: EXPENSES_COLOR },
];

interface ChartRow {
  month: string;
  revenue: number;
  expenses: number;
  profit: number;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: { payload: ChartRow; dataKey: string; value: number }[];
  label?: string;
  visible: Record<SeriesKey, boolean>;
}

function ChartTooltip({ active, payload, label, visible }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;

  const row = payload[0].payload;

  return (
    <div className="rounded-lg border border-stone-200 bg-white px-3 py-2.5 shadow-sm text-xs">
      <p className="font-bold text-stone-900 mb-2">{label}</p>
      <div className="space-y-1">
        {visible.revenue && (
          <div className="flex items-center justify-between gap-4">
            <span className="text-stone-600">Revenue</span>
            <span className="font-semibold text-stone-900 tabular-nums">
              {formatCurrency(row.revenue)}
            </span>
          </div>
        )}
        {visible.expenses && (
          <div className="flex items-center justify-between gap-4">
            <span className="text-stone-600">Total Costs</span>
            <span className="font-semibold text-stone-900 tabular-nums">
              {formatCurrency(row.expenses)}
            </span>
          </div>
        )}
        <div className="flex items-center justify-between gap-4 pt-1 border-t border-stone-100">
          <span className="text-stone-600">Net Profit</span>
          <span className="font-bold text-green-800 tabular-nums">
            {formatCurrency(row.profit)}
          </span>
        </div>
      </div>
    </div>
  );
}

export function FinancialChart({ period }: FinancialChartProps) {
  const {
    revenueRecords,
    expenseRecords,
    filteredRevenueRecords,
    filteredExpenseRecords,
    usesImportedData,
  } = useCompanyScopedFinancialData();

  const chartRevenue = usesImportedData ? filteredRevenueRecords : revenueRecords;
  const chartExpenses = usesImportedData ? filteredExpenseRecords : expenseRecords;

  const [visible, setVisible] = useState<Record<SeriesKey, boolean>>({
    revenue: true,
    expenses: true,
  });

  const toggleSeries = (key: SeriesKey) => {
    const activeCount = Object.values(visible).filter(Boolean).length;
    if (activeCount === 1 && visible[key]) return;
    setVisible((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const rawMonthly = useMemo(
    () =>
      computeMonthlyFinancials(chartRevenue, chartExpenses, period, {
        useDataDrivenMonths: usesImportedData,
      }),
    [chartRevenue, chartExpenses, period, usesImportedData]
  );

  const monthlyFinancials = useMemo(
    () =>
      rawMonthly.map((row) => ({
        ...row,
        expenses: row.cost + row.expenses,
        profit: row.revenue - row.cost - row.expenses,
      })),
    [rawMonthly]
  );

  const chartSubtitle = getFinancialChartSubtitle(period);
  const barSize =
    monthlyFinancials.length <= 2
      ? 40
      : monthlyFinancials.length <= 5
        ? 28
        : 16;
  const hasData =
    usesImportedData &&
    monthlyFinancials.length > 0 &&
    monthlyFinancials.some(
      (row) => row.revenue > 0 || row.expenses > 0 || row.profit !== 0
    );

  const emptyMessage = !usesImportedData
    ? "Import Excel data to view monthly financial trends."
    : "No financial data for this period.";

  return (
    <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5 flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-5">
        <div>
          <h3 className="text-sm font-bold text-stone-800 uppercase tracking-tight">
            Financial Performance
          </h3>
          <p className="text-xs text-stone-700 mt-1">{chartSubtitle}</p>
        </div>

        <div className="flex flex-wrap gap-2 shrink-0">
          {SERIES.map(({ key, label, color }) => {
            const isActive = visible[key];
            return (
              <button
                key={key}
                type="button"
                onClick={() => toggleSeries(key)}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wide transition-all",
                  isActive
                    ? "bg-white border-stone-300 text-stone-800 shadow-sm"
                    : "bg-stone-50 border-stone-200 text-stone-400"
                )}
              >
                <span
                  className="w-2 h-2 rounded-sm shrink-0"
                  style={{ backgroundColor: isActive ? color : "#d6d3d1" }}
                />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="w-full h-[300px]">
        {!hasData ? (
          <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-stone-200 bg-stone-50/50">
            <p className="text-sm text-stone-600 text-center px-4">{emptyMessage}</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={monthlyFinancials}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              barSize={barSize}
              barGap={4}
            >
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
              <Tooltip
                content={<ChartTooltip visible={visible} />}
                cursor={{ fill: "#f5f5f4" }}
              />
              <Bar
                dataKey="revenue"
                name="Revenue"
                fill={REVENUE_COLOR}
                radius={[4, 4, 0, 0]}
                hide={!visible.revenue}
              />
              <Bar
                dataKey="expenses"
                name="Expenses"
                fill={EXPENSES_COLOR}
                radius={[4, 4, 0, 0]}
                hide={!visible.expenses}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

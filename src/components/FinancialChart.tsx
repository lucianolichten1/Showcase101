import { useMemo, useState } from "react";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { formatCurrency } from "@/data/mockData";
import { computeMonthlyFinancials } from "@/domains/financial/calculations";
import { useFinancialData } from "@/domains/financial/hooks";
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
const NET_PROFIT_COLOR = "#3b82f6";

type SeriesKey = "revenue" | "expenses" | "profit";

interface SeriesConfig {
  key: SeriesKey;
  label: string;
  color: string;
  type: "bar" | "line";
}

const SERIES: SeriesConfig[] = [
  { key: "revenue",  label: "Revenue",    color: REVENUE_COLOR,    type: "bar" },
  { key: "expenses", label: "Total Costs", color: EXPENSES_COLOR,   type: "bar" },
  { key: "profit",   label: "Net Profit", color: NET_PROFIT_COLOR, type: "line" },
];

function tooltipLabel(name: string): string {
  if (name.toLowerCase() === "revenue") return "Revenue";
  if (name.toLowerCase() === "expenses") return "Total Costs";
  if (name.toLowerCase() === "profit") return "Net Profit";
  return name;
}

export function FinancialChart({ period }: FinancialChartProps) {
  const { revenueRecords, expenseRecords, usesImportedData } = useFinancialData();

  // Which series are currently visible — all on by default
  const [visible, setVisible] = useState<Record<SeriesKey, boolean>>({
    revenue: true,
    expenses: true,
    profit: true,
  });

  const toggleSeries = (key: SeriesKey) => {
    // Keep at least one series visible
    const activeCount = Object.values(visible).filter(Boolean).length;
    if (activeCount === 1 && visible[key]) return;
    setVisible((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const rawMonthly = useMemo(
    () =>
      computeMonthlyFinancials(revenueRecords, expenseRecords, period, {
        useDataDrivenMonths: usesImportedData,
      }),
    [revenueRecords, expenseRecords, period, usesImportedData]
  );

  // Merge COGS (cost on revenue records) into the expenses bar so that
  // Revenue bar − Expenses bar = Net Profit line is visually consistent.
  const monthlyFinancials = useMemo(
    () => rawMonthly.map((row) => ({ ...row, expenses: row.cost + row.expenses })),
    [rawMonthly]
  );

  const chartSubtitle = getFinancialChartSubtitle(period);
  const barSize =
    monthlyFinancials.length <= 2
      ? 40
      : monthlyFinancials.length <= 5
        ? 28
        : 16;
  const hasData = usesImportedData && monthlyFinancials.some(
    (row) => row.revenue > 0 || row.expenses > 0
  );

  const emptyMessage = !usesImportedData
    ? "Import Excel data to view monthly financial trends."
    : "No financial data for this period.";

  return (
    <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5 h-full flex flex-col min-h-[360px]">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-5">
        <div>
          <h3 className="text-sm font-bold text-stone-800 uppercase tracking-tight">
            Financial Performance
          </h3>
          <p className="text-xs text-stone-500 mt-1">{chartSubtitle}</p>
        </div>

        {/* Clickable series toggles */}
        <div className="flex flex-wrap gap-2 shrink-0">
          {SERIES.map(({ key, label, color, type }) => {
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
                {type === "bar" ? (
                  <span
                    className="w-2 h-2 rounded-sm shrink-0"
                    style={{ backgroundColor: isActive ? color : "#d6d3d1" }}
                  />
                ) : (
                  <span
                    className="inline-block w-4 h-0.5 rounded-full shrink-0"
                    style={{ backgroundColor: isActive ? color : "#d6d3d1" }}
                  />
                )}
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 min-h-[280px] w-full">
        {!hasData ? (
          <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-stone-200 bg-stone-50/50">
            <p className="text-sm text-stone-500 text-center px-4">{emptyMessage}</p>
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
                tick={{ fill: "#a8a29e", fontSize: 10 }}
                tickFormatter={(val) => `Bs ${val / 1000}k`}
                dx={-10}
              />
              <ReferenceLine y={0} stroke="#e7e5e4" strokeWidth={1} />
              <Tooltip
                formatter={(value: number, name: string) => [
                  formatCurrency(value),
                  tooltipLabel(name),
                ]}
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid #e7e5e4",
                  boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
                  fontSize: "12px",
                }}
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
              <Line
                type="monotone"
                dataKey="profit"
                name="Profit"
                stroke={NET_PROFIT_COLOR}
                strokeWidth={2}
                dot={{ r: 4, fill: NET_PROFIT_COLOR, strokeWidth: 2, stroke: "#fff" }}
                activeDot={{ r: 6, fill: NET_PROFIT_COLOR, stroke: "#fff", strokeWidth: 2 }}
                hide={!visible.profit}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

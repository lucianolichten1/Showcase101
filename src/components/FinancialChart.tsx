import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatCurrency } from "@/data/mockData";
import { computeMonthlyFinancials } from "@/domains/financial/calculations";
import { useFinancialData } from "@/domains/financial/hooks";
import {
  getFinancialChartSubtitle,
  type FinancialPeriod,
} from "@/domains/financial/period";

interface FinancialChartProps {
  period: FinancialPeriod;
}

const REVENUE_COLOR = "#15803d";
const EXPENSES_COLOR = "#d6d3d1";

function tooltipLabel(name: string): string {
  if (name.toLowerCase() === "revenue") return "Revenue";
  if (name.toLowerCase() === "expenses") return "Expenses";
  return name;
}

export function FinancialChart({ period }: FinancialChartProps) {
  const { revenueRecords, expenseRecords, usesImportedData } = useFinancialData();

  const monthlyFinancials = useMemo(
    () =>
      computeMonthlyFinancials(revenueRecords, expenseRecords, period, {
        useDataDrivenMonths: usesImportedData,
      }),
    [revenueRecords, expenseRecords, period, usesImportedData]
  );

  const chartSubtitle = getFinancialChartSubtitle(period);
  const barSize =
    monthlyFinancials.length <= 2
      ? 40
      : monthlyFinancials.length <= 5
        ? 28
        : 16;
  const hasData = monthlyFinancials.some(
    (row) => row.revenue > 0 || row.expenses > 0
  );

  return (
    <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5 h-full flex flex-col min-h-[360px]">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-5">
        <div>
          <h3 className="text-sm font-bold text-stone-800 uppercase tracking-tight">
            Financial Performance
          </h3>
          <p className="text-xs text-stone-500 mt-1">{chartSubtitle}</p>
        </div>
        <div className="flex gap-4 text-[10px] font-bold uppercase shrink-0">
          <span className="flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: REVENUE_COLOR }}
              aria-hidden
            />
            Revenue
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: EXPENSES_COLOR }}
              aria-hidden
            />
            Expenses
          </span>
        </div>
      </div>

      <div className="flex-1 min-h-[280px] w-full">
        {!hasData ? (
          <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-stone-200 bg-stone-50/50">
            <p className="text-sm text-stone-500">No financial data for this period.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
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
              />
              <Bar
                dataKey="expenses"
                name="Expenses"
                fill={EXPENSES_COLOR}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

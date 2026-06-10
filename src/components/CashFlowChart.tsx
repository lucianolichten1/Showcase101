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

const FLOW_COLOR = "#0d9488";

interface CashFlowChartProps {
  period: FinancialPeriod;
}

interface FlowRow {
  month: string;
  net: number;
  cumulative: number;
}

interface FlowTooltipProps {
  active?: boolean;
  payload?: { payload: FlowRow }[];
  label?: string;
}

function FlowTooltip({ active, payload, label }: FlowTooltipProps) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div className="rounded-lg border border-stone-200 bg-white px-3 py-2 shadow-sm text-xs">
      <p className="font-bold text-stone-900 mb-1">{label}</p>
      <div className="flex items-center justify-between gap-4">
        <span className="text-stone-600">Net this period</span>
        <span className="font-semibold text-stone-900 tabular-nums">
          {formatCurrency(row.net)}
        </span>
      </div>
      <div className="flex items-center justify-between gap-4 mt-0.5">
        <span className="text-stone-600">Cumulative</span>
        <span className="font-bold tabular-nums" style={{ color: FLOW_COLOR }}>
          {formatCurrency(row.cumulative)}
        </span>
      </div>
    </div>
  );
}

export function CashFlowChart({ period }: CashFlowChartProps) {
  const {
    revenueRecords,
    expenseRecords,
    filteredRevenueRecords,
    filteredExpenseRecords,
    usesImportedData,
  } = useCompanyScopedFinancialData();

  const chartRevenue = usesImportedData ? filteredRevenueRecords : revenueRecords;
  const chartExpenses = usesImportedData ? filteredExpenseRecords : expenseRecords;

  const data = useMemo((): FlowRow[] => {
    const monthly = computeMonthlyFinancials(chartRevenue, chartExpenses, period, {
      useDataDrivenMonths: usesImportedData,
    });
    let running = 0;
    return monthly.map((row) => {
      const net = row.revenue - row.cost - row.expenses;
      running += net;
      return { month: row.month, net, cumulative: running };
    });
  }, [chartRevenue, chartExpenses, period, usesImportedData]);

  const hasData =
    usesImportedData && data.length > 0 && data.some((row) => row.net !== 0);

  const emptyMessage = !usesImportedData
    ? "Import Excel data to view cumulative cash flow."
    : "No financial data for this period.";

  return (
    <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5 flex flex-col w-full">
      <div className="mb-5">
        <h3 className="text-sm font-bold text-stone-800 uppercase tracking-tight">
          Cumulative Cash Flow
        </h3>
        <p className="text-xs text-stone-700 mt-1">
          Running revenue minus costs · {getFinancialChartSubtitle(period)}
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
                <linearGradient id="cashFlowFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={FLOW_COLOR} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={FLOW_COLOR} stopOpacity={0.02} />
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
              <Tooltip content={<FlowTooltip />} cursor={{ stroke: "#d6d3d1" }} />
              <Area
                type="monotone"
                dataKey="cumulative"
                name="Cumulative cash flow"
                stroke={FLOW_COLOR}
                strokeWidth={2}
                fill="url(#cashFlowFill)"
                dot={{ r: 3, fill: FLOW_COLOR, strokeWidth: 0 }}
                activeDot={{ r: 4 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

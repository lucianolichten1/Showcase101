import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useCompanyScopedFinancialData } from "@/domains/company/useCompanyScopedFinancialData";
import { isActiveRevenue } from "@/domains/financial/calculations";
import { formatCurrency } from "@/data/mockData";

const MAX_CUSTOMERS = 5;

const BAR_COLORS = [
  "#166534",
  "#15803d",
  "#16a34a",
  "#22c55e",
  "#4ade80",
] as const;

interface CustomerRow {
  customer: string;
  amount: number;
}

interface BarTooltipProps {
  active?: boolean;
  payload?: { payload: CustomerRow }[];
}

function BarTooltip({ active, payload }: BarTooltipProps) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div className="rounded-lg border border-stone-200 bg-white px-3 py-2 shadow-sm text-xs">
      <p className="font-bold text-stone-900">{row.customer}</p>
      <p className="text-green-800 font-semibold mt-0.5 tabular-nums">
        {formatCurrency(row.amount)}
      </p>
    </div>
  );
}

export function TopCustomersChart() {
  const { filteredRevenueRecords, usesImportedData } = useCompanyScopedFinancialData();

  const data = useMemo((): CustomerRow[] => {
    const totals = new Map<string, number>();
    for (const r of filteredRevenueRecords) {
      if (!isActiveRevenue(r)) continue;
      const name = r.sourceClient.trim() || "Unknown";
      totals.set(name, (totals.get(name) ?? 0) + r.amount);
    }
    return Array.from(totals.entries())
      .map(([customer, amount]) => ({ customer, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, MAX_CUSTOMERS);
  }, [filteredRevenueRecords]);

  const hasData = usesImportedData && data.length > 0;

  return (
    <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-4 sm:p-5 flex flex-col w-full">
      <h3 className="text-sm font-bold text-stone-900 uppercase tracking-tight mb-1">
        Top Customers
      </h3>
      <p className="text-xs text-stone-700 mb-4">
        Highest revenue clients in the selected period
      </p>
      <div className="w-full h-[220px]">
        {!hasData ? (
          <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-stone-200 bg-stone-50/50">
            <p className="text-sm text-stone-600 text-center px-4">
              {usesImportedData
                ? "No revenue in the selected period."
                : "Import an Excel workbook with a Sales sheet to rank customers."}
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 0, right: 16, left: 8, bottom: 0 }}
              barSize={18}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f5f5f4" />
              <XAxis
                type="number"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#57534e", fontSize: 10, fontWeight: 500 }}
                tickFormatter={(val) => `Bs ${val / 1000}k`}
              />
              <YAxis
                type="category"
                dataKey="customer"
                width={120}
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#1c1917", fontSize: 11, fontWeight: 600 }}
              />
              <Tooltip content={<BarTooltip />} cursor={{ fill: "#f5f5f4" }} />
              <Bar dataKey="amount" name="Revenue" radius={[0, 4, 4, 0]}>
                {data.map((_, index) => (
                  <Cell key={index} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

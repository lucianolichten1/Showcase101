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

export function FinancialChart() {
  const { revenueRecords, expenseRecords } = useFinancialData();

  const monthlyFinancials = useMemo(
    () => computeMonthlyFinancials(revenueRecords, expenseRecords),
    [revenueRecords, expenseRecords]
  );

  return (
    <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-4 h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-bold text-stone-800 uppercase tracking-tight">Financial Performance Overview</h3>
        <div className="flex gap-4 text-[10px] font-bold uppercase">
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-700 rounded-full"></div>Revenue
          </span>
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 bg-stone-300 rounded-full"></div>Expenses
          </span>
        </div>
      </div>
      
      <div className="flex-1 min-h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={monthlyFinancials}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            barSize={16}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f4" />
            <XAxis 
              dataKey="month" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: "#1c1917", fontSize: 10, fontWeight: "bold" }} 
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: "#a8a29e", fontSize: 10 }}
              tickFormatter={(val) => `Bs ${val / 1000}k`}
              dx={-10}
            />
            <Tooltip
              formatter={(value: number) => [formatCurrency(value), ""]}
              contentStyle={{ borderRadius: "8px", border: "1px solid #e7e5e4", boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)", fontSize: "12px" }}
              cursor={{fill: '#f5f5f4'}}
            />
            <Bar
              dataKey="revenue"
              name="Revenue"
              fill="#15803d"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="expenses"
              name="Expenses"
              fill="#d6d3d1"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

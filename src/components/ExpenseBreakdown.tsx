import { useMemo } from "react";
import { useFinancialData } from "@/domains/financial/hooks";
import type { ExpenseRecord } from "@/domains/financial/types";

function groupByCategory(records: ExpenseRecord[]): { category: string; amount: number; percentage: number }[] {
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

export function ExpenseBreakdown() {
  const { expenseRecords, usesImportedData } = useFinancialData();

  const breakdown = useMemo(() => groupByCategory(expenseRecords), [expenseRecords]);

  return (
    <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-4 overflow-hidden flex flex-col h-full">
      <h3 className="text-sm font-bold text-stone-800 uppercase tracking-tight mb-3">Expense Breakdown</h3>
      <div className="space-y-2.5 flex-1">
        {!usesImportedData || breakdown.length === 0 ? (
          <p className="text-xs text-stone-500 leading-relaxed py-2">
            {usesImportedData
              ? "No expenses in the selected period."
              : "Import an Excel workbook with an Expenses sheet to see category breakdown."}
          </p>
        ) : (
          breakdown.map((expense) => (
            <div key={expense.category} className="flex flex-col gap-1">
              <div className="flex justify-between text-[10px] font-bold uppercase text-stone-800">
                <span>{expense.category}</span>
                <span>{expense.percentage}%</span>
              </div>
              <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-stone-600 transition-all"
                  style={{ width: `${expense.percentage}%` }}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

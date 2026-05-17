import { expenseCategories } from "@/data/mockData";

export function ExpenseBreakdown() {
  return (
    <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-4 overflow-hidden flex flex-col h-full">
      <h3 className="text-sm font-bold text-stone-800 uppercase tracking-tight mb-3">Expense Breakdown</h3>
      <div className="space-y-2.5 flex-1">
        {expenseCategories.map((expense) => (
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
        ))}
      </div>
    </div>
  );
}

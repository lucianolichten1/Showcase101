import { useState } from "react";
import { Sparkles, ChevronDown } from "lucide-react";
import { useCompanyScopedFinancialData } from "@/domains/company/useCompanyScopedFinancialData";
import { formatCurrency } from "@/data/mockData";
import { cn } from "@/lib/utils";

const GENERIC_INSIGHTS = [
  "Import your Excel workbooks to unlock real-time P&L and cash flow analysis.",
  "Monitor accounts receivable aging — invoices overdue 30+ days signal collection risk.",
  "Expense categories help identify where costs can be optimized. Map categories during import.",
  "A healthy net profit margin typically runs 10–20% for small businesses. Track it monthly.",
];

function computeInsights(
  kpis: {
    totalRevenue: number;
    totalExpenses: number;
    netProfit: number;
    profitMargin: number;
    receivablesTotalOutstanding: number;
    receivablesOverdueAmount: number;
    receivablesInvoicesOverdue: number;
    receivablesCollectionRate: number;
  },
  largestExpenseCategory: string | null
): string[] {
  const insights: string[] = [];

  if (kpis.totalRevenue > 0) {
    const margin = kpis.profitMargin;
    if (margin >= 20) {
      insights.push(
        `Strong performance — net margin is ${margin}%. Keep monitoring expenses to protect this.`
      );
    } else if (margin >= 10) {
      insights.push(
        `Net margin is ${margin}% — within healthy range. Look for ways to grow revenue faster than costs.`
      );
    } else if (margin >= 0) {
      insights.push(
        `Net margin is ${margin}% — low but positive. Review your largest expense categories for savings.`
      );
    } else {
      insights.push(
        `Net margin is ${margin}% — currently at a loss. Revenue of ${formatCurrency(kpis.totalRevenue)} is not covering expenses of ${formatCurrency(kpis.totalExpenses)}.`
      );
    }
  }

  if (largestExpenseCategory) {
    insights.push(
      `Your biggest cost category is "${largestExpenseCategory}". Focus cost-reduction efforts here first for the most impact.`
    );
  }

  if (kpis.receivablesTotalOutstanding > 0) {
    const rate = kpis.receivablesCollectionRate;
    if (rate >= 70) {
      insights.push(
        `Collection rate is ${rate}% — healthy. ${kpis.receivablesInvoicesOverdue} invoice${kpis.receivablesInvoicesOverdue !== 1 ? "s" : ""} overdue — follow up to close remaining balances.`
      );
    } else {
      insights.push(
        `Collection rate is ${rate}% — below 70% target. ${formatCurrency(kpis.receivablesOverdueAmount)} is overdue. Prioritize follow-ups to improve cash flow.`
      );
    }
  }

  if (kpis.totalRevenue > 0 && kpis.totalExpenses > 0) {
    const ratio = Math.round((kpis.totalExpenses / kpis.totalRevenue) * 100);
    if (ratio > 90) {
      insights.push(
        `Expenses are ${ratio}% of revenue — very tight margins. Consider which costs can be reduced or deferred.`
      );
    } else if (ratio <= 50) {
      insights.push(
        `Expenses are ${ratio}% of revenue — excellent efficiency. You have room to invest in growth.`
      );
    }
  }

  if (insights.length === 0) {
    insights.push(
      "Add more financial data to unlock personalized insights about your business performance."
    );
  }

  return insights.slice(0, 4);
}

export function AIInsightsPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const { kpis, expenseRecords, usesImportedData } = useCompanyScopedFinancialData();

  const largestExpenseCategory = (() => {
    if (expenseRecords.length === 0) return null;
    const totals = new Map<string, number>();
    expenseRecords.forEach((e) =>
      totals.set(e.category, (totals.get(e.category) ?? 0) + e.amount)
    );
    return Array.from(totals.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  })();

  const hasData =
    usesImportedData || expenseRecords.length > 0 || kpis.totalRevenue > 0;
  const insights = hasData
    ? computeInsights(kpis, largestExpenseCategory)
    : GENERIC_INSIGHTS;

  const statusLabel = hasData
    ? `${insights.length} insight${insights.length !== 1 ? "s" : ""} from your data`
    : "Import data to unlock insights";

  return (
    <div className="rounded-xl border border-stone-200 bg-white shadow-sm overflow-hidden self-start w-full">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        className={cn(
          "w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors",
          isOpen
            ? "bg-green-800 text-white"
            : "bg-green-800 text-white hover:bg-green-900"
        )}
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green-700/60 border border-green-600/40">
          <Sparkles className="h-4 w-4 text-green-300" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold uppercase tracking-wider">Business Insights</p>
          <p
            className={cn(
              "text-[11px] mt-0.5 truncate",
              isOpen ? "text-green-200" : "text-green-100/90"
            )}
          >
            {isOpen ? "Click to hide insights" : statusLabel}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {!isOpen && (
            <span className="rounded-full bg-green-700 px-2 py-0.5 text-[10px] font-bold text-green-100">
              {insights.length}
            </span>
          )}
          <ChevronDown
            className={cn(
              "h-4 w-4 text-green-300 transition-transform duration-200",
              isOpen && "rotate-180"
            )}
          />
        </div>
      </button>

      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-200 ease-out",
          isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div className="overflow-hidden">
          <div className="px-4 py-3 space-y-2.5 border-t border-stone-100 bg-stone-50/80">
            {insights.map((insight, idx) => (
              <div
                key={idx}
                className="flex gap-2.5 rounded-lg border border-stone-200 bg-white px-3 py-2.5 shadow-sm"
              >
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-100 text-[10px] font-bold text-green-800">
                  {idx + 1}
                </span>
                <p className="text-xs leading-relaxed text-stone-700">{insight}</p>
              </div>
            ))}

            <p className="pt-1 text-[10px] font-semibold uppercase tracking-wide text-stone-400">
              {hasData
                ? "Computed from your financial data"
                : "Add data to unlock personalized insights"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

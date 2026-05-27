import { Sparkles } from "lucide-react";
import { useCompanyScopedFinancialData } from "@/domains/company/useCompanyScopedFinancialData";
import { formatCurrency } from "@/data/mockData";

const GENERIC_INSIGHTS = [
  "Import your Excel workbooks to unlock real-time P&L and cash flow analysis.",
  "Monitor accounts receivable aging — invoices overdue 30+ days signal collection risk.",
  "Expense categories help identify where costs can be optimized. Map categories during import.",
  "A healthy net profit margin typically runs 10–20% for small businesses. Track it monthly.",
];

function computeInsights(kpis: {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  receivablesTotalOutstanding: number;
  receivablesOverdueAmount: number;
  receivablesInvoicesOverdue: number;
  receivablesCollectionRate: number;
}, largestExpenseCategory: string | null): string[] {
  const insights: string[] = [];

  // Net profit margin
  if (kpis.totalRevenue > 0) {
    const margin = kpis.profitMargin;
    if (margin >= 20) {
      insights.push(`Strong performance — net margin is ${margin}%. Keep monitoring expenses to protect this.`);
    } else if (margin >= 10) {
      insights.push(`Net margin is ${margin}% — within healthy range. Look for ways to grow revenue faster than costs.`);
    } else if (margin >= 0) {
      insights.push(`Net margin is ${margin}% — low but positive. Review your largest expense categories for savings.`);
    } else {
      insights.push(`Net margin is ${margin}% — currently at a loss. Revenue of ${formatCurrency(kpis.totalRevenue)} is not covering expenses of ${formatCurrency(kpis.totalExpenses)}.`);
    }
  }

  // Largest expense category
  if (largestExpenseCategory) {
    insights.push(`Your biggest cost category is "${largestExpenseCategory}". Focus cost-reduction efforts here first for the most impact.`);
  }

  // Collection rate
  if (kpis.receivablesTotalOutstanding > 0) {
    const rate = kpis.receivablesCollectionRate;
    if (rate >= 70) {
      insights.push(`Collection rate is ${rate}% — healthy. ${kpis.receivablesInvoicesOverdue} invoice${kpis.receivablesInvoicesOverdue !== 1 ? "s" : ""} overdue — follow up to close remaining balances.`);
    } else {
      insights.push(`Collection rate is ${rate}% — below 70% target. ${formatCurrency(kpis.receivablesOverdueAmount)} is overdue. Prioritize follow-ups to improve cash flow.`);
    }
  }

  // Expense vs revenue ratio
  if (kpis.totalRevenue > 0 && kpis.totalExpenses > 0) {
    const ratio = Math.round((kpis.totalExpenses / kpis.totalRevenue) * 100);
    if (ratio > 90) {
      insights.push(`Expenses are ${ratio}% of revenue — very tight margins. Consider which costs can be reduced or deferred.`);
    } else if (ratio <= 50) {
      insights.push(`Expenses are ${ratio}% of revenue — excellent efficiency. You have room to invest in growth.`);
    }
  }

  // Fallback if nothing computed
  if (insights.length === 0) {
    insights.push("Add more financial data to unlock personalized insights about your business performance.");
  }

  return insights.slice(0, 4);
}

export function AIInsightsPanel() {
  const { kpis, expenseRecords, usesImportedData } = useCompanyScopedFinancialData();

  // Find largest expense category from records
  const largestExpenseCategory = (() => {
    if (expenseRecords.length === 0) return null;
    const totals = new Map<string, number>();
    expenseRecords.forEach(e => totals.set(e.category, (totals.get(e.category) ?? 0) + e.amount));
    return Array.from(totals.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  })();

  const hasData = usesImportedData || expenseRecords.length > 0 || kpis.totalRevenue > 0;
  const insights = hasData ? computeInsights(kpis, largestExpenseCategory) : GENERIC_INSIGHTS;

  return (
    <div className="bg-green-800 text-white rounded-xl shadow-lg p-5 relative overflow-hidden h-full flex flex-col">
      <div className="absolute top-[-20px] right-[-20px] w-40 h-40 bg-green-700/30 rounded-full blur-3xl" />

      <div className="relative z-10 flex flex-col h-full">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-green-300" />
          <h3 className="text-sm font-bold uppercase tracking-widest">Business Insights</h3>
        </div>

        <div className="space-y-3 flex-1">
          {insights.map((insight, idx) => (
            <div key={idx} className="p-3 bg-white/10 rounded-lg border border-white/10">
              <p className="text-xs leading-relaxed font-medium">{insight}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-white/10 text-[10px] uppercase font-bold tracking-tighter opacity-70">
          {hasData ? "Computed from your financial data" : "Add data to unlock personalized insights"}
        </div>
      </div>
    </div>
  );
}

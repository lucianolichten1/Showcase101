import { Sparkles } from "lucide-react";

const FINANCIAL_INSIGHTS = [
  "Import your Excel workbooks to unlock real-time P&L and cash flow analysis.",
  "Monitor accounts receivable aging — invoices overdue 30+ days signal collection risk.",
  "Expense categories help identify where costs can be optimized. Map categories during import.",
  "A healthy net profit margin typically runs 10–20% for small businesses. Track it monthly.",
];

export function AIInsightsPanel() {
  return (
    <div className="bg-green-800 text-white rounded-xl shadow-lg p-5 relative overflow-hidden h-full flex flex-col">
      <div className="absolute top-[-20px] right-[-20px] w-40 h-40 bg-green-700/30 rounded-full blur-3xl" />

      <div className="relative z-10 flex flex-col h-full">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-green-300" />
          <h3 className="text-sm font-bold uppercase tracking-widest">Business Insights</h3>
        </div>

        <div className="space-y-4 flex-1">
          {FINANCIAL_INSIGHTS.map((insight, idx) => (
            <div key={idx} className="p-3 bg-white/10 rounded-lg backdrop-blur-md border border-white/10">
              <p className="text-xs leading-relaxed font-medium">{insight}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-white/10 text-[10px] uppercase font-bold tracking-tighter opacity-70">
          AI-powered insights coming soon
        </div>
      </div>
    </div>
  );
}

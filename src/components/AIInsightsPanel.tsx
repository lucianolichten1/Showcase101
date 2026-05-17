import { aiInsights } from "@/data/mockData";
import { Sparkles } from "lucide-react";

export function AIInsightsPanel() {
  return (
    <div className="bg-green-800 text-white rounded-xl shadow-lg p-5 relative overflow-hidden h-full flex flex-col">
      <div className="absolute top-[-20px] right-[-20px] w-40 h-40 bg-green-700/30 rounded-full blur-3xl" />
      
      <div className="relative z-10 flex flex-col h-full">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-green-300" />
          <h3 className="text-sm font-bold uppercase tracking-widest">AI Business Insights</h3>
        </div>
        
        <div className="space-y-4 flex-1">
          {aiInsights.map((insight, idx) => (
            <div key={idx} className="p-3 bg-white/10 rounded-lg backdrop-blur-md border border-white/10">
              <p className="text-xs leading-relaxed font-medium">{insight}</p>
            </div>
          ))}
        </div>
        
        <div className="mt-4 pt-4 border-t border-white/10 text-[10px] uppercase font-bold tracking-tighter opacity-70">
          Last updated: Today, 08:42 AM
        </div>
      </div>
    </div>
  );
}

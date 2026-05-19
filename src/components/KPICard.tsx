import type { KPIData } from "@/data/types";

type KPICardProps = Pick<
  KPIData,
  "title" | "value" | "trend" | "trendText" | "trendStatus"
> & {
  subtitle?: string;
};

export function KPICard({
  title,
  value,
  trend,
  trendText,
  trendStatus = "neutral",
  subtitle,
}: KPICardProps) {
  return (
    <div className="bg-white p-3 rounded-xl border border-stone-200 shadow-sm flex flex-col justify-center gap-1">
      <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wide">{title}</span>
      <div className="flex items-baseline gap-2">
        <span className="text-lg sm:text-xl font-bold text-stone-900">{value}</span>
        {trendStatus === "positive" && (
          <span className="text-[10px] text-green-600 font-bold">+{trend}%</span>
        )}
        {trendStatus === "negative" && (
          <span className="text-[10px] text-red-600 font-bold">{trend}%</span>
        )}
        {trendStatus === "neutral" && (
          <span className="text-[10px] text-stone-400 font-medium">{trendText || "Stable"}</span>
        )}
      </div>
      {subtitle && (
        <span className="text-[10px] text-stone-400 leading-relaxed">{subtitle}</span>
      )}
    </div>
  );
}

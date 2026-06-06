import type { KPIData } from "@/data/types";
import { cn } from "@/lib/utils";

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
  const showTrend =
    trendStatus === "positive" ||
    trendStatus === "negative" ||
    (trendStatus === "neutral" && Boolean(trendText));

  return (
    <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm flex flex-col items-center justify-center gap-1.5 text-center min-h-[118px]">
      <span className="text-[10px] text-stone-600 font-semibold uppercase tracking-wide">
        {title}
      </span>
      <span className="text-xl font-bold text-stone-900 tabular-nums">{value}</span>
      {showTrend && (
        <span
          className={cn(
            "text-[11px] font-medium",
            trendStatus === "positive" && "text-green-700",
            trendStatus === "negative" && "text-red-700",
            trendStatus === "neutral" && "text-stone-600"
          )}
        >
          {trendStatus === "positive" && `+${trend}%`}
          {trendStatus === "negative" && `${trend}%`}
          {trendStatus === "neutral" && trendText}
        </span>
      )}
      {subtitle && (
        <span className="text-[10px] text-stone-500">{subtitle}</span>
      )}
    </div>
  );
}

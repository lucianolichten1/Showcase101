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
  const trendLine =
    trendStatus === "positive"
      ? `+${trend}%`
      : trendStatus === "negative"
        ? `${trend}%`
        : trendStatus === "neutral" && trendText
          ? trendText
          : "";

  return (
    <div className="bg-white p-3 rounded-xl border border-stone-200 shadow-sm flex flex-col min-h-[96px] text-center">
      <span className="text-[9px] text-stone-600 font-semibold uppercase tracking-wide leading-tight min-h-[22px] flex items-start justify-center">
        {title}
      </span>
      <div className="flex-1 flex items-center justify-center min-h-[28px] py-0.5">
        <span className="text-lg font-bold text-stone-900 tabular-nums leading-tight max-w-full truncate px-1">
          {value}
        </span>
      </div>
      <span
        className={cn(
          "text-[10px] font-medium text-stone-600 leading-tight min-h-[15px] max-w-full truncate px-1"
        )}
      >
        {trendLine || "\u00a0"}
      </span>
      <span className="text-[9px] text-stone-500 leading-tight min-h-[13px] max-w-full truncate px-1">
        {subtitle || "\u00a0"}
      </span>
    </div>
  );
}

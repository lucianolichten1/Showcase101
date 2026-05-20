import { Link } from "react-router-dom";
import { FileSpreadsheet } from "lucide-react";
import { cn } from "@/lib/utils";

interface FinancialEmptyBannerProps {
  title: string;
  description: string;
  className?: string;
  showImportLink?: boolean;
}

export function FinancialEmptyBanner({
  title,
  description,
  className,
  showImportLink = true,
}: FinancialEmptyBannerProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-dashed border-stone-300 bg-stone-50/80 px-4 py-5 sm:px-6 sm:py-6",
        className
      )}
    >
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white border border-stone-200 shadow-sm">
          <FileSpreadsheet className="h-5 w-5 text-stone-500" aria-hidden />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-stone-900">{title}</p>
          <p className="text-sm text-stone-600 mt-1 leading-relaxed">{description}</p>
          {showImportLink && (
            <Link
              to="/export-import"
              className="inline-flex mt-3 text-xs font-bold text-green-800 hover:text-green-900 underline underline-offset-2"
            >
              Go to Export / Import →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

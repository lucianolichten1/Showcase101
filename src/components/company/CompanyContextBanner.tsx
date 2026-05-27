import { Link } from "react-router-dom";
import { AlertTriangle, Building2, Database } from "lucide-react";
import { databaseStatusLabel } from "@/domains/admin/database";
import { getNicheDisplayName } from "@/domains/admin/niches";
import { databaseStatusBadgeClass } from "@/domains/admin/utils";
import { useCompanyFromQuery } from "@/domains/company/useCompanyFromQuery";
import { cn } from "@/lib/utils";

// TODO: Load company-scoped data from dedicated Supabase project when routing exists.

/**
 * Shows company context when `?companyId=` is present on financial module routes.
 * Renders nothing when no companyId query param is set.
 */
export function CompanyContextBanner({ className }: { className?: string }) {
  const { companyId, company, isInvalid, hasCompanyContext, isResolving } =
    useCompanyFromQuery();

  if (!hasCompanyContext) return null;

  if (isResolving) return null;

  if (isInvalid || !company) {
    return (
      <div
        className={cn(
          "rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 flex gap-3",
          className
        )}
        role="status"
      >
        <AlertTriangle size={16} className="shrink-0 text-amber-600 mt-0.5" />
        <div className="min-w-0 text-[11px] text-amber-900 leading-relaxed">
          <p className="font-semibold">Unknown company context</p>
          <p className="mt-0.5">
            No company matches <code className="font-mono text-[10px]">{companyId}</code>. This
            page still uses shared local mock data.{" "}
            <Link to="/admin/companies" className="font-semibold underline hover:text-amber-950">
              View companies
            </Link>
          </p>
        </div>
      </div>
    );
  }

  const nicheName = getNicheDisplayName(company.niche);
  const dbStatus = databaseStatusLabel(company.databaseStatus);

  return (
    <div
      className={cn(
        "rounded-xl border border-green-200 bg-green-50/70 px-4 py-3",
        className
      )}
      role="status"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3 min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-green-100 text-green-800">
            <Building2 size={15} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-green-800">
              Company workspace context
            </p>
            <p className="text-sm font-bold text-stone-900 truncate">{company.name}</p>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className="text-[10px] text-stone-600">
                Niche: <span className="font-semibold text-stone-800">{nicheName}</span>
              </span>
              <span className="text-stone-300">·</span>
              <span className="inline-flex items-center gap-1 text-[10px] text-stone-600">
                <Database size={11} className="text-stone-400" />
                Database:{" "}
                <span
                  className={cn(
                    "inline-flex items-center rounded-full border px-1.5 py-0.5 text-[9px] font-bold",
                    databaseStatusBadgeClass(company.databaseStatus)
                  )}
                >
                  {dbStatus}
                </span>
              </span>
              <span className="text-stone-300">·</span>
              <span className="text-[10px] text-stone-600">
                Provider:{" "}
                <span className="font-semibold text-stone-800">{company.databaseProvider}</span>
              </span>
            </div>
          </div>
        </div>
        <Link
          to={`/company/${company.id}/dashboard`}
          className="shrink-0 text-[10px] font-semibold text-green-800 hover:text-green-950 underline underline-offset-2"
        >
          Back to workspace
        </Link>
      </div>
      <p className="text-[10px] text-stone-600 mt-2 pt-2 border-t border-green-200/80 leading-relaxed">
        {company.databaseLabel}. Figures on this page are still shared local mock data until the
        per-company database phase — not live Supabase data for this company yet.
      </p>
    </div>
  );
}

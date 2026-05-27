import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  Database,
  ExternalLink,
  LayoutGrid,
} from "lucide-react";
import type { CompanyRecord } from "@/domains/admin/types";
import { isModuleEnabled } from "@/domains/admin/modules";
import { getNicheDisplayName } from "@/domains/admin/niches";
import { findCompanyById } from "@/domains/admin/utils";
import {
  WORKSPACE_MODULES,
  workspaceModuleHref,
} from "@/domains/company/workspaceModules";
import { cn } from "@/lib/utils";

// TODO: Load company workspace from dedicated company Supabase project.
// TODO: Replace mock/local financial data with company-scoped queries.

const DATABASE_STATUS = "Not connected";
const DATABASE_PROVIDER = "Supabase planned";

interface Props {
  companies: CompanyRecord[];
}

export function CompanyWorkspacePage({ companies }: Props) {
  const { companyId } = useParams<{ companyId: string }>();
  const company = findCompanyById(companies, companyId);

  if (!company) {
    return (
      <main className="flex flex-col items-center justify-center gap-4 p-5 lg:p-6 min-h-[50vh]">
        <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-8 text-center max-w-sm">
          <Building2 size={28} className="mx-auto text-stone-300 mb-3" />
          <h1 className="text-sm font-bold text-stone-900">Company not found</h1>
          <p className="text-xs text-stone-500 mt-1.5">
            This workspace does not exist or the company was removed.
          </p>
          <Link
            to="/admin/companies"
            className="inline-flex mt-4 items-center gap-1.5 rounded-lg bg-green-800 px-3 py-2 text-xs font-semibold text-white hover:bg-green-900 transition-colors"
          >
            <ArrowLeft size={13} />
            Back to Companies
          </Link>
        </div>
      </main>
    );
  }

  const nicheName = getNicheDisplayName(company.niche);
  const enabledModuleCount = WORKSPACE_MODULES.filter(
    (m) => m.comingSoon || isModuleEnabled(company.enabledModules, m.key)
  ).length;

  return (
    <main className="flex flex-col gap-5 p-5 lg:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to={`/admin/companies/${company.id}`}
          className="inline-flex w-fit items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-green-800 transition-colors"
        >
          <ArrowLeft size={13} />
          Back to company admin
        </Link>
        <Link
          to="/admin/companies"
          className="text-[10px] font-semibold text-stone-400 hover:text-stone-600 transition-colors"
        >
          All companies
        </Link>
      </div>

      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-green-800 mb-1">
            Company Workspace
          </p>
          <h1 className="text-lg font-bold text-stone-900">{company.name}</h1>
          <p className="text-xs text-stone-500 mt-0.5 max-w-2xl">
            You are viewing the financial workspace for this company. Data shown in modules
            is still local mock state until the dedicated database phase is implemented.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-3 rounded-xl border border-stone-200 shadow-sm flex flex-col gap-1">
          <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wide">
            Niche
          </span>
          <span className="text-sm font-bold text-stone-900">{nicheName}</span>
        </div>
        <div className="bg-white p-3 rounded-xl border border-stone-200 shadow-sm flex flex-col gap-1">
          <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wide">
            Database
          </span>
          <span className="text-sm font-bold text-amber-700">{DATABASE_STATUS}</span>
        </div>
        <div className="bg-white p-3 rounded-xl border border-stone-200 shadow-sm flex flex-col gap-1">
          <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wide">
            Provider
          </span>
          <span className="text-sm font-bold text-stone-800">{DATABASE_PROVIDER}</span>
        </div>
        <div className="bg-white p-3 rounded-xl border border-stone-200 shadow-sm flex flex-col gap-1 col-span-2 lg:col-span-1">
          <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wide">
            Modules
          </span>
          <span className="text-sm font-bold text-stone-900">{enabledModuleCount} available</span>
        </div>
      </div>

      <div className="flex gap-3 rounded-xl border border-amber-100 bg-amber-50/60 px-4 py-3">
        <Database size={16} className="shrink-0 text-amber-600 mt-0.5" />
        <p className="text-[11px] text-amber-900 leading-relaxed">
          <span className="font-semibold">Local mock data.</span> This company will eventually
          use its own Supabase database. Financial modules below open the shared MVP screens
          with sample data until per-company routing is built.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-4">
        <div className="flex items-center gap-2 mb-4">
          <LayoutGrid size={14} className="text-stone-400" />
          <h2 className="text-sm font-bold text-stone-800 uppercase tracking-tight">
            Financial Modules
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {WORKSPACE_MODULES.map((module) => {
            const Icon = module.icon;
            const enabled =
              module.comingSoon || isModuleEnabled(company.enabledModules, module.key);
            const href = workspaceModuleHref(module, company.id);

            const cardClass = cn(
              "flex flex-col gap-2 rounded-xl border p-4 transition-colors",
              module.comingSoon
                ? "border-dashed border-stone-300 bg-stone-50/50"
                : enabled
                  ? "border-stone-200 bg-white hover:border-green-200 hover:bg-green-50/30"
                  : "border-stone-100 bg-stone-50 opacity-60"
            );

            const inner = (
              <>
                <div className="flex items-start justify-between gap-2">
                  <div
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-lg",
                      enabled && !module.comingSoon
                        ? "bg-green-50 text-green-800"
                        : "bg-stone-100 text-stone-400"
                    )}
                  >
                    <Icon size={16} />
                  </div>
                  {!module.comingSoon && enabled && href && (
                    <ExternalLink size={12} className="text-stone-300 shrink-0" />
                  )}
                </div>
                <div>
                  <p className="text-xs font-bold text-stone-900">{module.name}</p>
                  <p className="text-[10px] text-stone-500 mt-0.5 leading-relaxed">
                    {module.description}
                  </p>
                </div>
                <span
                  className={cn(
                    "inline-flex w-fit items-center rounded-full border px-2 py-0.5 text-[9px] font-bold",
                    module.comingSoon
                      ? "border-stone-200 bg-stone-100 text-stone-500"
                      : enabled
                        ? "border-green-100 bg-green-50 text-green-700"
                        : "border-stone-200 bg-white text-stone-400"
                  )}
                >
                  {module.comingSoon
                    ? "Coming soon"
                    : enabled
                      ? "Open module"
                      : "Disabled for company"}
                </span>
              </>
            );

            if (href && enabled && !module.comingSoon) {
              return (
                <Link key={module.key} to={href} className={cardClass}>
                  {inner}
                </Link>
              );
            }

            return (
              <div
                key={module.key}
                className={cardClass}
                aria-disabled={!enabled || module.comingSoon}
              >
                {inner}
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}

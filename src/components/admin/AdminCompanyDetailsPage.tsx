import type { ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Building2, Database, HardDrive, Layers, Sparkles } from "lucide-react";
import type { CompanyRecord } from "@/domains/admin/types";
import {
  BASE_FINANCIAL_MODULE_DEFINITIONS,
  DASHBOARD_MODULE_KEY,
  isModuleEnabled,
} from "@/domains/admin/modules";
import {
  getNicheByKey,
  getNicheDisplayName,
  nicheStatusLabel,
} from "@/domains/admin/niches";
import {
  COMPANY_DATABASE_SCOPE,
  databaseStatusLabel,
} from "@/domains/admin/database";
import {
  databaseStatusBadgeClass,
  formatCreatedDate,
  findCompanyById,
  statusBadgeClass,
} from "@/domains/admin/utils";
import { cn } from "@/lib/utils";

// TODO: Load company from central platform Supabase.
// TODO: Restrict page to super_admin users only.
// TODO: Persist enabled modules to central platform Supabase.
// TODO: Load niche-specific modules based on company.niche.
// TODO: Use enabled modules to control sidebar visibility for company users.

interface Props {
  companies: CompanyRecord[];
  onUpdateCompany: (company: CompanyRecord) => void;
}

function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4 py-2.5 border-b border-stone-50 last:border-0">
      <span className="text-[9px] font-bold uppercase tracking-wider text-stone-400 shrink-0">
        {label}
      </span>
      <span className="text-xs text-stone-800 sm:text-right">{value}</span>
    </div>
  );
}

function ModuleToggle({
  enabled,
  disabled,
  onToggle,
  label,
}: {
  enabled: boolean;
  disabled?: boolean;
  onToggle: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label={label}
      disabled={disabled}
      onClick={onToggle}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-green-700 focus-visible:ring-offset-1",
        disabled ? "cursor-not-allowed opacity-50 bg-stone-200" : "cursor-pointer",
        enabled && !disabled ? "bg-green-800" : !disabled ? "bg-stone-300" : "bg-stone-200"
      )}
    >
      <span
        className={cn(
          "inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform",
          enabled ? "translate-x-4" : "translate-x-1"
        )}
      />
    </button>
  );
}

export function AdminCompanyDetailsPage({ companies, onUpdateCompany }: Props) {
  const { companyId } = useParams<{ companyId: string }>();
  const company = findCompanyById(companies, companyId);

  if (!company) {
    return (
      <main className="flex flex-col items-center justify-center gap-4 p-5 lg:p-6 min-h-[50vh]">
        <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-8 text-center max-w-sm">
          <Building2 size={28} className="mx-auto text-stone-300 mb-3" />
          <h1 className="text-sm font-bold text-stone-900">Company not found</h1>
          <p className="text-xs text-stone-500 mt-1.5">
            This company does not exist or may have been removed.
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

  const nicheConfig = getNicheByKey(company.niche);

  const totalModules = BASE_FINANCIAL_MODULE_DEFINITIONS.length;
  const enabledCount = BASE_FINANCIAL_MODULE_DEFINITIONS.filter((m) =>
    isModuleEnabled(company.enabledModules, m.key)
  ).length;
  const disabledCount = totalModules - enabledCount;

  const handleToggleModule = (moduleKey: string, required?: boolean) => {
    if (required || moduleKey === DASHBOARD_MODULE_KEY) return;

    const currentlyEnabled = isModuleEnabled(company.enabledModules, moduleKey);
    const nextModules = currentlyEnabled
      ? company.enabledModules.filter((k) => k !== moduleKey)
      : [...company.enabledModules, moduleKey];

    onUpdateCompany({
      ...company,
      enabledModules: nextModules.includes(DASHBOARD_MODULE_KEY)
        ? nextModules
        : [...nextModules, DASHBOARD_MODULE_KEY],
    });
  };

  return (
    <main className="flex flex-col gap-5 p-5 lg:p-6">
      <Link
        to="/admin/companies"
        className="inline-flex w-fit items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-green-800 transition-colors"
      >
        <ArrowLeft size={13} />
        Back to Companies
      </Link>

      <div>
        <h1 className="text-lg font-bold text-stone-900">{company.name}</h1>
        <p className="text-xs text-stone-500 mt-0.5 max-w-2xl">
          Super admin view for this company&apos;s niche, dedicated database plan, and
          financial module access. Data is local mock state — Supabase routing per company
          will be added later.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white p-3 rounded-xl border border-stone-200 shadow-sm flex flex-col gap-1">
          <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wide">
            Total Modules
          </span>
          <span className="text-lg font-bold text-stone-900">{totalModules}</span>
        </div>
        <div className="bg-white p-3 rounded-xl border border-stone-200 shadow-sm flex flex-col gap-1">
          <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wide">
            Enabled
          </span>
          <span className="text-lg font-bold text-green-800">{enabledCount}</span>
        </div>
        <div className="bg-white p-3 rounded-xl border border-stone-200 shadow-sm flex flex-col gap-1">
          <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wide">
            Disabled
          </span>
          <span className="text-lg font-bold text-stone-500">{disabledCount}</span>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-4">
        <div className="flex items-center gap-2 mb-3">
          <Building2 size={14} className="text-stone-400" />
          <h2 className="text-sm font-bold text-stone-800 uppercase tracking-tight">
            Company Info
          </h2>
        </div>
        <InfoRow label="Company Name" value={company.name} />
        <InfoRow
          label="Niche"
          value={
            <span className="inline-flex items-center rounded-full border border-green-100 bg-green-50 px-2 py-0.5 text-[10px] font-bold text-green-800">
              {getNicheDisplayName(company.niche)}
            </span>
          }
        />
        <InfoRow label="Owner Email" value={company.ownerEmail} />
        <InfoRow
          label="Status"
          value={
            <span
              className={cn(
                "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold",
                statusBadgeClass(company.status)
              )}
            >
              {company.status}
            </span>
          }
        />
        <InfoRow label="Created Date" value={formatCreatedDate(company.createdAt)} />
      </div>

      <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-4">
        <div className="flex items-center gap-2 mb-3">
          <HardDrive size={14} className="text-stone-400" />
          <h2 className="text-sm font-bold text-stone-800 uppercase tracking-tight">
            Company Database
          </h2>
        </div>
        <p className="text-[10px] text-stone-400 mb-3">
          Each company will eventually connect to its own Supabase database. No live
          connection exists in this MVP.
        </p>
        <InfoRow
          label="Status"
          value={
            <span
              className={cn(
                "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold",
                databaseStatusBadgeClass(company.databaseStatus)
              )}
            >
              {databaseStatusLabel(company.databaseStatus)}
            </span>
          }
        />
        <InfoRow label="Provider" value={company.databaseProvider} />
        <InfoRow label="Scope" value={COMPANY_DATABASE_SCOPE} />
        <InfoRow label="Label" value={company.databaseLabel} />
        <p className="text-[10px] text-stone-400 mt-2 pt-2 border-t border-stone-100">
          Database routing will be connected in a later technical phase. Supabase clients,
          credentials, and per-company routing are not implemented yet.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-4">
        <div className="flex items-center gap-2 mb-3">
          <Database size={14} className="text-stone-400" />
          <h2 className="text-sm font-bold text-stone-800 uppercase tracking-tight">
            Niche Configuration
          </h2>
        </div>
        <p className="text-[10px] text-stone-400 mb-3">
          The company&apos;s niche defines its business vertical. Niche-level Supabase
          templates may be used later; company data still lives in a dedicated database per
          company.
        </p>
        {nicheConfig ? (
          <>
            <InfoRow label="Niche" value={nicheConfig.name} />
            <InfoRow
              label="Niche Status"
              value={
                <span
                  className={cn(
                    "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold",
                    nicheConfig.status === "active"
                      ? "bg-green-50 text-green-700 border-green-100"
                      : "bg-stone-100 text-stone-600 border-stone-200"
                  )}
                >
                  {nicheStatusLabel(nicheConfig.status)}
                </span>
              }
            />
            <InfoRow label="Description" value={nicheConfig.description} />
            <InfoRow
              label="Planned Niche Project Key"
              value={
                <code className="text-[10px] font-mono text-stone-600 bg-stone-100 px-1.5 py-0.5 rounded">
                  {nicheConfig.supabaseProjectKey}
                </code>
              }
            />
            <p className="text-[10px] text-stone-400 mt-2 pt-2 border-t border-stone-100">
              Niche routing is a future platform concern. Supabase project switching is not
              active — see Company Database above for per-company connection status.
            </p>
          </>
        ) : (
          <p className="text-xs text-stone-500">
            Unknown niche &quot;{company.niche}&quot;. Registry entry not found.
          </p>
        )}
      </div>

      <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-4">
        <div className="flex items-center gap-2 mb-1">
          <Layers size={14} className="text-stone-400" />
          <h2 className="text-sm font-bold text-stone-800 uppercase tracking-tight">
            Enabled Modules
          </h2>
        </div>
        <p className="text-[10px] text-stone-400 mb-4">
          Toggle financial and accounting modules for this company. Changes are stored
          locally until platform persistence is connected.
        </p>
        <ul className="flex flex-col gap-2">
          {BASE_FINANCIAL_MODULE_DEFINITIONS.map((module) => {
            const enabled = isModuleEnabled(company.enabledModules, module.key);
            const isRequired = module.key === DASHBOARD_MODULE_KEY;

            return (
              <li
                key={module.key}
                className={cn(
                  "flex items-center justify-between gap-4 rounded-lg border px-3 py-3 transition-colors",
                  enabled
                    ? "border-green-100 bg-green-50/40"
                    : "border-stone-200 bg-stone-50/50"
                )}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold text-stone-900">{module.name}</span>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-bold",
                        enabled
                          ? "border-green-100 bg-green-50 text-green-700"
                          : "border-stone-200 bg-white text-stone-500"
                      )}
                    >
                      {enabled ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                  <p className="text-[10px] text-stone-500 mt-0.5">{module.description}</p>
                  {isRequired && (
                    <p className="text-[9px] text-stone-400 mt-1 font-medium">
                      Required base module
                    </p>
                  )}
                </div>
                <ModuleToggle
                  enabled={enabled}
                  disabled={isRequired}
                  onToggle={() => handleToggleModule(module.key, isRequired)}
                  label={`Toggle ${module.name}`}
                />
              </li>
            );
          })}
        </ul>
      </div>

      <div className="bg-white rounded-xl border border-dashed border-stone-300 shadow-sm p-4">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles size={14} className="text-stone-400" />
          <h2 className="text-sm font-bold text-stone-800 uppercase tracking-tight">
            Future Niche Modules
          </h2>
        </div>
        <p className="text-xs text-stone-500">
          Niche-specific modules will be configured here later based on the company&apos;s
          selected niche.
        </p>
      </div>
    </main>
  );
}

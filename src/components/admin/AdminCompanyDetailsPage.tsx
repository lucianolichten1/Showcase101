import type { ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Building2, Layers } from "lucide-react";
import type { CompanyRecord } from "@/domains/admin/types";
import { BASE_FINANCIAL_MODULES } from "@/domains/admin/modules";
import { formatCreatedDate, findCompanyById, statusBadgeClass } from "@/domains/admin/utils";
import { cn } from "@/lib/utils";

// TODO: Load company from central platform Supabase.
// TODO: Restrict page to super_admin users only.
// TODO: Enable niche-specific module configuration later.

interface Props {
  companies: CompanyRecord[];
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

export function AdminCompanyDetailsPage({ companies }: Props) {
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
        <p className="text-xs text-stone-500 mt-0.5 max-w-xl">
          Super admins can view and manage this company&apos;s configuration and
          enabled modules.
        </p>
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
              {company.niche}
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
          <Layers size={14} className="text-stone-400" />
          <h2 className="text-sm font-bold text-stone-800 uppercase tracking-tight">
            Enabled Modules
          </h2>
        </div>
        <p className="text-[10px] text-stone-400 mb-3">
          Financial and accounting modules included with this company.
        </p>
        <ul className="flex flex-wrap gap-2">
          {BASE_FINANCIAL_MODULES.map((module) => (
            <li
              key={module}
              className="inline-flex items-center gap-2 rounded-lg border border-stone-200 bg-stone-50 px-3 py-2"
            >
              <span className="text-xs font-semibold text-stone-800">{module}</span>
              <span className="inline-flex items-center rounded-full border border-green-100 bg-green-50 px-2 py-0.5 text-[9px] font-bold text-green-700">
                Enabled
              </span>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}

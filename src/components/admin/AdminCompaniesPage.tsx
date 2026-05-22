import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Building2, Eye } from "lucide-react";
import type { CompanyRecord, NewCompanyInput } from "@/domains/admin/types";
import { formatCreatedDate, nextCompanyId, statusBadgeClass } from "@/domains/admin/utils";
import { cn } from "@/lib/utils";
import { AddCompanyDialog } from "./AddCompanyDialog";

// TODO: Restrict this page to super_admin users only.

interface Props {
  companies: CompanyRecord[];
  onAddCompany: (company: CompanyRecord) => void;
}

export function AdminCompaniesPage({ companies, onAddCompany }: Props) {
  const [showAddCompany, setShowAddCompany] = useState(false);

  const activeCount = companies.filter((c) => c.status === "Active").length;

  const handleAddCompany = (input: NewCompanyInput) => {
    const createdAt = new Date().toISOString().slice(0, 10);
    onAddCompany({
      id: nextCompanyId(companies),
      name: input.name,
      niche: input.niche,
      ownerEmail: input.ownerEmail,
      status: input.status,
      createdAt,
    });
    setShowAddCompany(false);
  };

  return (
    <>
      <main className="flex flex-col gap-5 p-5 lg:p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold text-stone-900">Companies</h1>
            <p className="text-xs text-stone-500 mt-0.5 max-w-xl">
              Super admins can create and manage platform companies and assign each
              company to a niche. Niches will later map to dedicated databases.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowAddCompany(true)}
            className="flex shrink-0 items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-700 shadow-sm hover:bg-stone-50 transition-colors"
          >
            <Plus size={13} />
            Add Company
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="bg-white p-3 rounded-xl border border-stone-200 shadow-sm flex flex-col gap-1">
            <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wide">
              Total Companies
            </span>
            <span className="text-lg font-bold text-stone-900">{companies.length}</span>
          </div>
          <div className="bg-white p-3 rounded-xl border border-stone-200 shadow-sm flex flex-col gap-1">
            <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wide">
              Active
            </span>
            <span className="text-lg font-bold text-green-800">{activeCount}</span>
          </div>
          <div className="bg-white p-3 rounded-xl border border-stone-200 shadow-sm flex flex-col gap-1 col-span-2 lg:col-span-1">
            <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wide">
              Niches
            </span>
            <span className="text-lg font-bold text-stone-900">Agro</span>
            <span className="text-[10px] text-stone-400">More niches coming soon</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-4 overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Building2 size={14} className="text-stone-400" />
              <h3 className="text-sm font-bold text-stone-800 uppercase tracking-tight">
                All Companies
              </h3>
            </div>
            <span className="text-[10px] text-stone-400">{companies.length} companies</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="text-[9px] uppercase text-stone-400 font-bold border-b border-stone-100">
                <tr className="h-8">
                  <th className="font-bold pr-4">Company Name</th>
                  <th className="font-bold pr-4">Niche</th>
                  <th className="font-bold pr-4">Owner Email</th>
                  <th className="font-bold pr-4">Status</th>
                  <th className="font-bold pr-4">Created Date</th>
                  <th className="font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-[11px] text-stone-800">
                {companies.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-xs text-stone-400">
                      No companies yet. Add your first company to get started.
                    </td>
                  </tr>
                ) : (
                  companies.map((company) => (
                    <tr
                      key={company.id}
                      className="border-b border-stone-50 hover:bg-stone-50/80 transition-colors"
                    >
                      <td className="py-2.5 pr-4 font-semibold text-stone-900">
                        {company.name}
                      </td>
                      <td className="py-2.5 pr-4">
                        <span className="inline-flex items-center rounded-full border border-green-100 bg-green-50 px-2 py-0.5 text-[10px] font-bold text-green-800">
                          {company.niche}
                        </span>
                      </td>
                      <td className="py-2.5 pr-4 text-stone-600">{company.ownerEmail}</td>
                      <td className="py-2.5 pr-4">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold",
                            statusBadgeClass(company.status)
                          )}
                        >
                          {company.status}
                        </span>
                      </td>
                      <td className="py-2.5 pr-4 text-stone-500">
                        {formatCreatedDate(company.createdAt)}
                      </td>
                      <td className="py-2.5 text-right">
                        <Link
                          to={`/admin/companies/${company.id}`}
                          className="inline-flex items-center gap-1 rounded-md border border-stone-200 bg-white px-2 py-1 text-[10px] font-semibold text-stone-600 hover:border-green-200 hover:text-green-800 hover:bg-green-50 transition-colors"
                        >
                          <Eye size={12} />
                          View
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <AddCompanyDialog
        open={showAddCompany}
        onClose={() => setShowAddCompany(false)}
        onConfirm={handleAddCompany}
      />
    </>
  );
}

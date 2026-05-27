import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Building2, Eye, ExternalLink, Info, Loader2, AlertCircle } from "lucide-react";
import { createCompany, listCompanies } from "@/domains/admin/companyService";
import { databaseStatusLabel } from "@/domains/admin/database";
import { getNicheDisplayName } from "@/domains/admin/niches";
import type { CompanyRecord, NewCompanyInput } from "@/domains/admin/types";
import {
  databaseStatusBadgeClass,
  formatCreatedDate,
  statusBadgeClass,
} from "@/domains/admin/utils";
import { cn } from "@/lib/utils";
import { AddCompanyDialog } from "./AddCompanyDialog";

function ownerDisplay(email: string): string {
  return email.trim() ? email : "Not assigned";
}

export function AdminCompaniesPage() {
  const [companies, setCompanies] = useState<CompanyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddCompany, setShowAddCompany] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const loadCompanies = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listCompanies();
      setCompanies(data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load companies from Supabase.";
      setError(message);
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCompanies();
  }, [loadCompanies]);

  const activeCount = companies.filter((c) => c.status === "Active").length;
  const connectedDbCount = companies.filter(
    (c) => c.databaseStatus !== "not_connected"
  ).length;

  const handleAddCompany = async (input: NewCompanyInput) => {
    setCreating(true);
    setCreateError(null);
    try {
      await createCompany(input);
      await loadCompanies();
      setShowAddCompany(false);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to create company.";
      setCreateError(message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      <main className="flex flex-col gap-5 p-5 lg:p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold text-stone-900">Companies</h1>
            <p className="text-xs text-stone-500 mt-0.5 max-w-2xl">
              Manage platform companies on AI Finance OS. Each company belongs to a
              niche (currently Agro only) and will eventually use its own dedicated
              Supabase database. Database routing is not connected yet — this admin
              area reflects the planned architecture only.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setCreateError(null);
              setShowAddCompany(true);
            }}
            disabled={loading}
            className="flex shrink-0 items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-700 shadow-sm hover:bg-stone-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus size={13} />
            Add Company
          </button>
        </div>

        <div className="flex gap-3 rounded-xl border border-stone-200 bg-stone-50/80 px-4 py-3">
          <Info size={16} className="shrink-0 text-stone-400 mt-0.5" />
          <p className="text-[11px] text-stone-600 leading-relaxed">
            <span className="font-semibold text-stone-800">Multi-company platform.</span>{" "}
            Companies are grouped by niche. Each company will get a separate database in a
            later phase. All companies show database status{" "}
            <span className="font-semibold">Not connected</span> until Supabase routing is
            implemented.
          </p>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <AlertCircle size={16} className="shrink-0 text-red-600 mt-0.5" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-red-800">Could not load companies</p>
              <p className="text-[11px] text-red-700 mt-0.5">{error}</p>
              <button
                type="button"
                onClick={() => void loadCompanies()}
                className="mt-2 text-[11px] font-semibold text-red-800 underline hover:no-underline"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white p-3 rounded-xl border border-stone-200 shadow-sm flex flex-col gap-1">
            <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wide">
              Total Companies
            </span>
            <span className="text-lg font-bold text-stone-900">
              {loading ? "—" : companies.length}
            </span>
          </div>
          <div className="bg-white p-3 rounded-xl border border-stone-200 shadow-sm flex flex-col gap-1">
            <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wide">
              Active
            </span>
            <span className="text-lg font-bold text-green-800">
              {loading ? "—" : activeCount}
            </span>
          </div>
          <div className="bg-white p-3 rounded-xl border border-stone-200 shadow-sm flex flex-col gap-1">
            <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wide">
              Niches
            </span>
            <span className="text-lg font-bold text-stone-900">Agro</span>
            <span className="text-[10px] text-stone-400">More niches planned</span>
          </div>
          <div className="bg-white p-3 rounded-xl border border-stone-200 shadow-sm flex flex-col gap-1 col-span-2 lg:col-span-1">
            <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wide">
              Databases
            </span>
            <span className="text-lg font-bold text-amber-700">
              {loading ? "—" : `${connectedDbCount} connected`}
            </span>
            <span className="text-[10px] text-stone-400">Supabase routing later</span>
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
            <span className="text-[10px] text-stone-400">
              {loading ? "Loading…" : `${companies.length} companies`}
            </span>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-stone-400">
              <Loader2 size={24} className="animate-spin" />
              <p className="text-xs">Loading companies…</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="text-[9px] uppercase text-stone-400 font-bold border-b border-stone-100">
                  <tr className="h-8">
                    <th className="font-bold pr-4">Company Name</th>
                    <th className="font-bold pr-4">Niche</th>
                    <th className="font-bold pr-4">Database</th>
                    <th className="font-bold pr-4">Owner Email</th>
                    <th className="font-bold pr-4">Status</th>
                    <th className="font-bold pr-4">Created Date</th>
                    <th className="font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-[11px] text-stone-800">
                  {companies.length === 0 && !error ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center">
                        <Building2
                          size={32}
                          className="mx-auto text-stone-300 mb-3"
                          strokeWidth={1.5}
                          aria-hidden
                        />
                        <p className="text-sm font-semibold text-stone-600">
                          No companies yet
                        </p>
                        <p className="text-xs text-stone-400 mt-1 max-w-xs mx-auto leading-relaxed">
                          Create your first company using the <strong>+ Add Company</strong> button above.
                          You can assign an owner after creation.
                        </p>
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
                            {getNicheDisplayName(company.niche)}
                          </span>
                        </td>
                        <td className="py-2.5 pr-4">
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold",
                              databaseStatusBadgeClass(company.databaseStatus)
                            )}
                            title={company.databaseLabel}
                          >
                            {databaseStatusLabel(company.databaseStatus)}
                          </span>
                        </td>
                        <td className="py-2.5 pr-4 text-stone-500 italic">
                          {ownerDisplay(company.ownerEmail)}
                        </td>
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
                          <div className="inline-flex items-center gap-1.5 justify-end">
                            <Link
                              to={`/admin/companies/${company.id}`}
                              className="inline-flex items-center gap-1 rounded-md border border-stone-200 bg-white px-2 py-1 text-[10px] font-semibold text-stone-600 hover:border-green-200 hover:text-green-800 hover:bg-green-50 transition-colors"
                            >
                              <Eye size={12} />
                              View
                            </Link>
                            <Link
                              to={`/company/${company.id}/dashboard`}
                              className="inline-flex items-center gap-1 rounded-md border border-green-200 bg-green-50 px-2 py-1 text-[10px] font-semibold text-green-800 hover:bg-green-100 transition-colors"
                              title="Enter company workspace"
                            >
                              <ExternalLink size={12} />
                              Workspace
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      <AddCompanyDialog
        open={showAddCompany}
        saving={creating}
        saveError={createError}
        onClose={() => {
          if (!creating) {
            setShowAddCompany(false);
            setCreateError(null);
          }
        }}
        onConfirm={(input) => void handleAddCompany(input)}
      />
    </>
  );
}

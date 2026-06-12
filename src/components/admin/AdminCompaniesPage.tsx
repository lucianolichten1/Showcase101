import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Plus } from "lucide-react";
import { createCompany } from "@/domains/admin/companyService";
import {
  assignCompanyOwner,
  findProfileByEmail,
  PROFILE_NOT_FOUND_MESSAGE,
} from "@/domains/admin/companyOwnerService";
import {
  loadCompaniesWithOwners,
  matchesSearchQuery,
  matchesStatusFilter,
  toCompanyCardModel,
  type AdminCompanyCardModel,
  type StatusFilter,
} from "@/domains/admin/displayModel";
import type { NewCompanyInput } from "@/domains/admin/types";
import { getSupabaseErrorMessage } from "@/lib/supabaseError";
import { CompanyCard } from "./CompanyCard";
import { AddCompanyDialog } from "./AddCompanyDialog";
import { AdminButton } from "./ui/AdminButton";
import { AdminSearch } from "./ui/AdminSearch";
import { AdminSegmentedControl } from "./ui/AdminSegmentedControl";
import { AdminToast } from "./ui/AdminToast";

const STATUS_FILTERS: StatusFilter[] = ["All", "Onboarding", "Active", "Paused"];

export function AdminCompaniesPage() {
  const navigate = useNavigate();
  const [models, setModels] = useState<AdminCompanyCardModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<StatusFilter>("All");
  const [showAddCompany, setShowAddCompany] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [justAddedId, setJustAddedId] = useState<string | null>(null);

  const loadCompanies = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await loadCompaniesWithOwners();
      setModels(rows.map(({ company, owner }) => toCompanyCardModel(company, owner)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load companies.");
      setModels([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCompanies();
  }, [loadCompanies]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!justAddedId) return;
    const timer = window.setTimeout(() => setJustAddedId(null), 1600);
    return () => window.clearTimeout(timer);
  }, [justAddedId]);

  const filtered = models.filter(
    (m) => matchesStatusFilter(m, filter) && matchesSearchQuery(m, search)
  );

  const handleAddCompany = async (
    input: NewCompanyInput,
    ownerEmail?: string
  ) => {
    setCreating(true);
    setCreateError(null);
    try {
      const created = await createCompany(input);

      if (ownerEmail?.trim()) {
        const profile = await findProfileByEmail(ownerEmail.trim());
        if (!profile) {
          throw new Error(PROFILE_NOT_FOUND_MESSAGE);
        }
        await assignCompanyOwner(created.id, profile.id);
      }

      await loadCompanies();
      setShowAddCompany(false);
      setJustAddedId(created.id);
      setToast(`${created.name} created — onboarding started.`);
    } catch (err) {
      setCreateError(getSupabaseErrorMessage(err, "Failed to create company."));
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      <div className="admin-page-head">
        <div>
          <div className="admin-page-title">Companies</div>
        </div>
        <AdminButton
          variant="primary"
          onClick={() => {
            setCreateError(null);
            setShowAddCompany(true);
          }}
        >
          <Plus className="h-4 w-4" />
          Add Company
        </AdminButton>
      </div>

      <div className="admin-toolbar">
        <AdminSearch value={search} onChange={setSearch} />
        <AdminSegmentedControl options={STATUS_FILTERS} value={filter} onChange={setFilter} />
        <span className="mono ml-auto text-[13px] text-[var(--admin-ink-3)]">
          {filtered.length} {filtered.length === 1 ? "company" : "companies"}
        </span>
      </div>

      {error && (
        <div className="admin-alert admin-alert-error mt-6">
          {error}
          <button
            type="button"
            className="ml-3 underline font-semibold"
            onClick={() => void loadCompanies()}
          >
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-20 text-[var(--admin-ink-3)]">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="text-sm">Loading companies…</span>
        </div>
      ) : filtered.length > 0 ? (
        <div className="admin-card-grid mt-6">
          {filtered.map((model) => (
            <CompanyCard
              key={model.id}
              model={model}
              justAdded={model.id === justAddedId}
              onOpen={(id) => {
                void navigate(`/admin/companies/${id}`);
              }}
            />
          ))}
        </div>
      ) : (
        <p className="mt-[60px] text-center text-sm text-[var(--admin-ink-3)]">
          {models.length === 0
            ? "No companies yet. Add your first company to get started."
            : "No companies match your search."}
        </p>
      )}

      <AddCompanyDialog
        open={showAddCompany}
        saving={creating}
        saveError={createError}
        onClose={() => setShowAddCompany(false)}
        onConfirm={handleAddCompany}
      />

      {toast && <AdminToast message={toast} />}
    </>
  );
}

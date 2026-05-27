import { useCallback, useEffect, useState, type FormEvent } from "react";
import { CheckCircle2, Loader2, UserCircle } from "lucide-react";
import {
  assignCompanyOwner,
  findProfileByEmail,
  listCompanyOwners,
  PROFILE_NOT_FOUND_MESSAGE,
  type CompanyOwnerInfo,
} from "@/domains/admin/companyOwnerService";
import { formatCreatedDate } from "@/domains/admin/utils";
import { cn } from "@/lib/utils";

interface Props {
  companyId: string;
}

export function CompanyOwnerSection({ companyId }: Props) {
  const [owners, setOwners] = useState<CompanyOwnerInfo[]>([]);
  const [loadingOwner, setLoadingOwner] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const primaryOwner = owners[0] ?? null;

  const loadOwners = useCallback(async () => {
    setLoadingOwner(true);
    setLoadError(null);
    try {
      const records = await listCompanyOwners(companyId);
      setOwners(records);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load company owner.";
      setLoadError(message);
      setOwners([]);
    } finally {
      setLoadingOwner(false);
    }
  }, [companyId]);

  useEffect(() => {
    void loadOwners();
  }, [loadOwners]);

  useEffect(() => {
    if (!successMessage) return;
    const timer = window.setTimeout(() => setSuccessMessage(null), 5000);
    return () => window.clearTimeout(timer);
  }, [successMessage]);

  const handleAssign = async (e: FormEvent) => {
    e.preventDefault();
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setAssignError("Owner email is required.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setAssignError("Enter a valid email address.");
      return;
    }

    setAssigning(true);
    setAssignError(null);
    setSuccessMessage(null);

    try {
      const profile = await findProfileByEmail(trimmedEmail);
      if (!profile) {
        setAssignError(PROFILE_NOT_FOUND_MESSAGE);
        return;
      }

      await assignCompanyOwner(companyId, profile.id);
      await loadOwners();
      setEmail("");
      setSuccessMessage(`Owner assigned: ${profile.email}`);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to assign company owner.";
      setAssignError(message);
    } finally {
      setAssigning(false);
    }
  };

  const inputClass = cn(
    "w-full rounded-lg border px-3 py-2 text-xs text-stone-900 outline-none transition-colors placeholder:text-stone-300",
    "border-stone-200 bg-white focus:border-green-700"
  );

  return (
    <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-4">
      <div className="flex items-center gap-2 mb-3">
        <UserCircle size={14} className="text-stone-400" />
        <h2 className="text-sm font-bold text-stone-800 uppercase tracking-tight">
          Company Owner
        </h2>
      </div>

      <p className="text-[10px] text-stone-400 mb-4 leading-relaxed">
        Assign an existing platform user as owner. The user must already exist in Supabase
        Auth with a matching profile — accounts cannot be created from this screen.
      </p>

      {loadingOwner ? (
        <div className="flex items-center gap-2 py-3 text-stone-400">
          <Loader2 size={16} className="animate-spin" />
          <span className="text-xs">Loading owner…</span>
        </div>
      ) : loadError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 mb-4">
          <p className="text-[11px] text-red-800">{loadError}</p>
          <button
            type="button"
            onClick={() => void loadOwners()}
            className="mt-1.5 text-[11px] font-semibold text-red-800 underline hover:no-underline"
          >
            Try again
          </button>
        </div>
      ) : primaryOwner ? (
        <div className="rounded-lg border border-green-100 bg-green-50/50 px-3 py-3 mb-4">
          <p className="text-[9px] font-bold uppercase tracking-wider text-green-800 mb-2">
            Current owner
          </p>
          <dl className="flex flex-col gap-1.5 text-xs text-stone-800">
            <div className="flex justify-between gap-4">
              <dt className="text-stone-500">Email</dt>
              <dd className="font-semibold text-right">{primaryOwner.email}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-stone-500">Name</dt>
              <dd className="text-right">
                {primaryOwner.fullName?.trim() ? (
                  primaryOwner.fullName
                ) : (
                  <span className="text-stone-400 italic">Not set</span>
                )}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-stone-500">Assigned</dt>
              <dd className="text-stone-600 text-right">
                {formatCreatedDate(primaryOwner.assignedAt.slice(0, 10))}
              </dd>
            </div>
          </dl>
        </div>
      ) : (
        <p className="text-xs text-stone-500 mb-4 italic">No owner assigned yet.</p>
      )}

      {successMessage && (
        <div className="flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 mb-4">
          <CheckCircle2 size={16} className="shrink-0 text-green-700 mt-0.5" />
          <p className="text-[11px] text-green-800 font-medium">{successMessage}</p>
        </div>
      )}

      {assignError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 mb-4">
          <p className="text-[11px] text-red-800">{assignError}</p>
        </div>
      )}

      <form onSubmit={(e) => void handleAssign(e)} className="flex flex-col gap-3">
        <div>
          <label
            htmlFor="owner-email"
            className="block text-[9px] font-bold uppercase tracking-wider text-stone-500 mb-1.5"
          >
            Owner email
          </label>
          <input
            id="owner-email"
            type="email"
            value={email}
            disabled={assigning}
            placeholder="owner@company.com"
            onChange={(e) => {
              setEmail(e.target.value);
              setAssignError(null);
            }}
            className={inputClass}
          />
        </div>

        <button
          type="submit"
          disabled={assigning || !email.trim()}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-green-800 px-3 py-2 text-xs font-semibold text-white hover:bg-green-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-fit"
        >
          {assigning ? (
            <>
              <Loader2 size={13} className="animate-spin" />
              Assigning…
            </>
          ) : (
            "Assign Owner"
          )}
        </button>
      </form>
    </div>
  );
}

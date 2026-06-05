import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { Loader2, Mail } from "lucide-react";
import {
  assignCompanyOwner,
  findProfileByEmail,
  listCompanyOwners,
  OWNER_ALREADY_ASSIGNED_THIS_COMPANY_MESSAGE,
  PROFILE_NOT_FOUND_MESSAGE,
  type CompanyOwnerInfo,
} from "@/domains/admin/companyOwnerService";
import { OWNER_META, type AdminOwnerState } from "@/domains/admin/displayModel";
import { AdminButton } from "./ui/AdminButton";

interface Props {
  companyId: string;
  onOwnerLoaded?: (owner: CompanyOwnerInfo | null) => void;
  onOwnerAssigned?: (owner: CompanyOwnerInfo) => void;
}

export function CompanyOwnerSection({
  companyId,
  onOwnerLoaded,
  onOwnerAssigned,
}: Props) {
  const onOwnerLoadedRef = useRef(onOwnerLoaded);
  const onOwnerAssignedRef = useRef(onOwnerAssigned);

  useEffect(() => {
    onOwnerLoadedRef.current = onOwnerLoaded;
  }, [onOwnerLoaded]);

  useEffect(() => {
    onOwnerAssignedRef.current = onOwnerAssigned;
  }, [onOwnerAssigned]);

  const [owners, setOwners] = useState<CompanyOwnerInfo[]>([]);
  const [loadingOwner, setLoadingOwner] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showAssignForm, setShowAssignForm] = useState(false);

  const [email, setEmail] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);

  const primaryOwner = owners[0] ?? null;
  const ownerState: AdminOwnerState = primaryOwner ? "active" : "unassigned";
  const ownerMeta = OWNER_META[ownerState];

  const loadOwners = useCallback(async () => {
    setLoadingOwner(true);
    setLoadError(null);
    try {
      const records = await listCompanyOwners(companyId);
      setOwners(records);
      onOwnerLoadedRef.current?.(records[0] ?? null);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to load company owner.");
      setOwners([]);
      onOwnerLoadedRef.current?.(null);
    } finally {
      setLoadingOwner(false);
    }
  }, [companyId]);

  useEffect(() => {
    void loadOwners();
  }, [loadOwners]);

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

    try {
      const profile = await findProfileByEmail(trimmedEmail);
      if (!profile) {
        setAssignError(PROFILE_NOT_FOUND_MESSAGE);
        return;
      }

      const result = await assignCompanyOwner(companyId, profile.id);
      await loadOwners();
      setEmail("");
      setShowAssignForm(false);
      if (result.outcome === "already_here") {
        setAssignError(OWNER_ALREADY_ASSIGNED_THIS_COMPANY_MESSAGE);
      } else {
        onOwnerAssignedRef.current?.(result.owner);
      }
    } catch (err) {
      setAssignError(err instanceof Error ? err.message : "Failed to assign company owner.");
    } finally {
      setAssigning(false);
    }
  };

  if (loadingOwner) {
    return (
      <div className="flex items-center gap-2 py-2 text-[var(--admin-ink-3)]">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">Loading owner…</span>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="admin-alert admin-alert-error">
        {loadError}
        <button type="button" className="ml-2 underline" onClick={() => void loadOwners()}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-3.5">
        <span className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full bg-[var(--admin-green-tint)] text-sm font-semibold text-[var(--admin-green-ink)]">
          {primaryOwner ? primaryOwner.email[0]?.toUpperCase() : "?"}
        </span>
        <div className="min-w-0">
          {primaryOwner ? (
            <div className="mono truncate text-[12.5px]" title={primaryOwner.email}>
              {primaryOwner.email}
            </div>
          ) : (
            <div className="text-[13.5px] font-medium italic text-[var(--admin-ink-3)]">
              No owner assigned
            </div>
          )}
          <div className="mt-1 inline-flex items-center gap-[7px] text-xs text-[var(--admin-ink-3)]">
            <span className={`admin-dot ${ownerMeta.tone}`} />
            {ownerMeta.label}
          </div>
        </div>
      </div>

      {assignError && <p className="admin-field-err mb-3">{assignError}</p>}

      {showAssignForm ? (
        <form onSubmit={(e) => void handleAssign(e)} className="flex flex-col gap-3">
          <input
            type="email"
            className="admin-input"
            value={email}
            disabled={assigning}
            placeholder="owner@company.com"
            onChange={(e) => {
              setEmail(e.target.value);
              setAssignError(null);
            }}
          />
          <div className="flex gap-2">
            <AdminButton
              variant="primary"
              size="sm"
              type="submit"
              disabled={assigning || !email.trim()}
              className="flex-1 justify-center"
            >
              {assigning ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Assigning…
                </>
              ) : (
                "Assign owner"
              )}
            </AdminButton>
            <AdminButton size="sm" onClick={() => setShowAssignForm(false)} disabled={assigning}>
              Cancel
            </AdminButton>
          </div>
        </form>
      ) : (
        <AdminButton
          size="sm"
          className="w-full justify-center"
          onClick={() => setShowAssignForm(true)}
        >
          <Mail className="h-[15px] w-[15px]" />
          {primaryOwner ? "Manage access" : "Invite owner"}
        </AdminButton>
      )}
    </div>
  );
}

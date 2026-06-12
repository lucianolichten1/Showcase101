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
import { getSupabaseErrorMessage } from "@/lib/supabaseError";
import { AdminButton } from "./ui/AdminButton";

interface Props {
  companyId: string;
  showAssignForm?: boolean;
  onShowAssignFormChange?: (open: boolean) => void;
  onOwnerLoaded?: (owner: CompanyOwnerInfo | null) => void;
  onOwnerAssigned?: (owner: CompanyOwnerInfo) => void;
}

export function CompanyOwnerSection({
  companyId,
  showAssignForm: showAssignFormProp,
  onShowAssignFormChange,
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
  const [showAssignFormInternal, setShowAssignFormInternal] = useState(false);

  const [email, setEmail] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);

  const showAssignForm = showAssignFormProp ?? showAssignFormInternal;

  const setShowAssignForm = useCallback(
    (open: boolean) => {
      if (onShowAssignFormChange) {
        onShowAssignFormChange(open);
      } else {
        setShowAssignFormInternal(open);
      }
    },
    [onShowAssignFormChange]
  );

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
      setLoadError(getSupabaseErrorMessage(err, "Failed to load company owner."));
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
      setAssignError(getSupabaseErrorMessage(err, "Failed to assign company owner."));
    } finally {
      setAssigning(false);
    }
  };

  const openAssignForm = () => {
    setAssignError(null);
    setShowAssignForm(true);
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-3.5">
        <span className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full bg-[var(--admin-green-tint)] text-sm font-semibold text-[var(--admin-green-ink)]">
          {primaryOwner ? primaryOwner.email[0]?.toUpperCase() : "?"}
        </span>
        <div className="min-w-0 flex-1">
          {loadingOwner ? (
            <div className="flex items-center gap-2 text-[var(--admin-ink-3)]">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span className="text-sm">Loading owner…</span>
            </div>
          ) : primaryOwner ? (
            <div className="mono truncate text-[12.5px]" title={primaryOwner.email}>
              {primaryOwner.email}
            </div>
          ) : (
            <div className="text-[13.5px] font-medium italic text-[var(--admin-ink-3)]">
              No owner assigned
            </div>
          )}
          {!loadingOwner && (
            <div className="mt-1 inline-flex items-center gap-[7px] text-xs text-[var(--admin-ink-3)]">
              <span className={`admin-dot ${ownerMeta.tone}`} />
              {ownerMeta.label}
            </div>
          )}
        </div>
      </div>

      {loadError && (
        <div className="admin-alert admin-alert-error mb-3">
          {loadError}
          <button type="button" className="ml-2 underline" onClick={() => void loadOwners()}>
            Retry
          </button>
        </div>
      )}

      {assignError && <p className="admin-field-err mb-3">{assignError}</p>}

      {showAssignForm ? (
        <form onSubmit={(e) => void handleAssign(e)} className="flex flex-col gap-3">
          <input
            type="email"
            className="admin-input"
            value={email}
            autoFocus
            disabled={assigning}
            placeholder="company@gmail.com"
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
              disabled={assigning}
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
            <AdminButton
              size="sm"
              type="button"
              onClick={() => setShowAssignForm(false)}
              disabled={assigning}
            >
              Cancel
            </AdminButton>
          </div>
        </form>
      ) : (
        <AdminButton
          size="sm"
          type="button"
          className="w-full justify-center"
          onClick={openAssignForm}
        >
          <Mail className="h-[15px] w-[15px]" />
          {primaryOwner ? "Manage access" : "Invite owner"}
        </AdminButton>
      )}
    </div>
  );
}

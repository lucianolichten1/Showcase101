import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Loader2, Trash2, X } from "lucide-react";
import { AdminButton } from "./ui/AdminButton";

export const DELETE_COMPANY_CONFIRM_TEXT = "CONFIRM";

interface Props {
  open: boolean;
  companyName: string;
  deleting?: boolean;
  deleteError?: string | null;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteCompanyDialog({
  open,
  companyName,
  deleting = false,
  deleteError = null,
  onClose,
  onConfirm,
}: Props) {
  const [confirmText, setConfirmText] = useState("");

  useEffect(() => {
    if (open) setConfirmText("");
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !deleting) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, deleting, onClose]);

  if (!open) return null;

  const canDelete = confirmText === DELETE_COMPANY_CONFIRM_TEXT && !deleting;

  return createPortal(
    <div
      className="admin-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget && !deleting) onClose();
      }}
    >
      <div
        className="admin-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-company-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="admin-modal-head">
          <div>
            <div id="delete-company-title" className="admin-modal-title">
              Delete company
            </div>
            <div className="admin-modal-sub">
              This permanently removes <strong>{companyName}</strong> and all linked
              data (members, expenses, revenue, bank accounts, etc.). This cannot be
              undone.
            </div>
          </div>
          <button
            type="button"
            className="admin-icon-btn"
            onClick={onClose}
            disabled={deleting}
            aria-label="Close"
          >
            <X className="h-[18px] w-[18px]" />
          </button>
        </div>

        <div className="admin-modal-body">
          {deleteError && (
            <div className="admin-alert admin-alert-error">{deleteError}</div>
          )}

          <div className="admin-field">
            <label>
              Type <span className="mono font-semibold">{DELETE_COMPANY_CONFIRM_TEXT}</span> to
              proceed
            </label>
            <input
              className="admin-input"
              value={confirmText}
              autoFocus
              disabled={deleting}
              autoComplete="off"
              spellCheck={false}
              placeholder={DELETE_COMPANY_CONFIRM_TEXT}
              onChange={(e) => setConfirmText(e.target.value)}
            />
            <span className="admin-field-hint">
              Deletion only proceeds when the text matches exactly.
            </span>
          </div>
        </div>

        <div className="admin-modal-foot">
          <span className="admin-field-hint">Superadmin action — irreversible.</span>
          <div className="flex gap-2.5">
            <AdminButton size="sm" type="button" onClick={onClose} disabled={deleting}>
              Cancel
            </AdminButton>
            <AdminButton
              size="sm"
              type="button"
              disabled={!canDelete}
              className="!bg-[var(--admin-rust)] !text-white hover:!bg-[#8f3f24] disabled:!opacity-50"
              onClick={onConfirm}
            >
              {deleting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Deleting…
                </>
              ) : (
                <>
                  <Trash2 className="h-[15px] w-[15px]" />
                  Delete company
                </>
              )}
            </AdminButton>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

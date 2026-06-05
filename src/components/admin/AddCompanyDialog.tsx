import { useEffect, useState } from "react";
import { Check, Loader2, Plus, X } from "lucide-react";
import {
  DEFAULT_NICHE_KEY,
  getActiveNiches,
  type NicheKey,
} from "@/domains/admin/niches";
import {
  MODAL_MODULE_OPTIONS,
  MODAL_PLANS,
  MODAL_REGIONS,
} from "@/domains/admin/displayModel";
import type { NewCompanyInput } from "@/domains/admin/types";
import { AdminButton } from "./ui/AdminButton";

interface Props {
  open: boolean;
  saving?: boolean;
  saveError?: string | null;
  onClose: () => void;
  onConfirm: (input: NewCompanyInput, ownerEmail?: string) => void;
}

export function AddCompanyDialog({
  open,
  saving = false,
  saveError = null,
  onClose,
  onConfirm,
}: Props) {
  const [name, setName] = useState("");
  const [niche, setNiche] = useState<NicheKey>(DEFAULT_NICHE_KEY);
  const [email, setEmail] = useState("");
  const [region, setRegion] = useState<string>(MODAL_REGIONS[0]);
  const [plan, setPlan] = useState<string>(MODAL_PLANS[0]);
  const [mods, setMods] = useState<string[]>(["Dashboard"]);
  const [tried, setTried] = useState(false);

  const activeNiches = getActiveNiches();

  useEffect(() => {
    if (open) {
      setName("");
      setNiche(DEFAULT_NICHE_KEY);
      setEmail("");
      setRegion(MODAL_REGIONS[0]);
      setPlan(MODAL_PLANS[0]);
      setMods(["Dashboard"]);
      setTried(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !saving) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, saving, onClose]);

  if (!open) return null;

  const nameOk = name.trim().length > 1;
  const emailOk = email.trim() === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const valid = nameOk && emailOk;

  const toggleMod = (mod: string) => {
    setMods((prev) =>
      prev.includes(mod) ? prev.filter((m) => m !== mod) : [...prev, mod]
    );
  };

  const submit = () => {
    setTried(true);
    if (!valid || saving) return;
    onConfirm(
      { name: name.trim(), niche, status: "Active" },
      email.trim() || undefined
    );
  };

  return (
    <div
      className="admin-modal-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !saving) onClose();
      }}
    >
      <div className="admin-modal" role="dialog" aria-modal="true">
        <div className="admin-modal-head">
          <div>
            <div className="admin-modal-title">Add company</div>
            <div className="admin-modal-sub">
              Create a new company on the platform. It starts in{" "}
              <strong>Onboarding</strong> until the owner is active and data is imported.
            </div>
          </div>
          <button
            type="button"
            className="admin-icon-btn"
            onClick={onClose}
            disabled={saving}
            aria-label="Close"
          >
            <X className="h-[18px] w-[18px]" />
          </button>
        </div>

        <div className="admin-modal-body">
          {saveError && (
            <div className="admin-alert admin-alert-error">{saveError}</div>
          )}

          <div className="admin-field">
            <label>
              Company name <span className="req">*</span>
            </label>
            <input
              className={`admin-input${tried && !nameOk ? " invalid" : ""}`}
              value={name}
              autoFocus
              disabled={saving}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Verde Harvest Co."
            />
            {tried && !nameOk && (
              <span className="admin-field-err">Enter a company name.</span>
            )}
          </div>

          <div className="admin-field-row">
            <div className="admin-field">
              <label>Niche</label>
              <select
                className="admin-select"
                value={niche}
                disabled={saving}
                onChange={(e) => setNiche(e.target.value as NicheKey)}
              >
                {activeNiches.map((n) => (
                  <option key={n.key} value={n.key}>
                    {n.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="admin-field">
              <label>Region</label>
              <select
                className="admin-select"
                value={region}
                disabled={saving}
                onChange={(e) => setRegion(e.target.value)}
              >
                {MODAL_REGIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              <span className="admin-field-hint">Not persisted yet — display only.</span>
            </div>
          </div>

          <div className="admin-field">
            <label>Owner email</label>
            <input
              className={`admin-input${tried && !emailOk ? " invalid" : ""}`}
              value={email}
              type="email"
              disabled={saving}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="owner@company.com"
            />
            {tried && !emailOk ? (
              <span className="admin-field-err">Enter a valid email address.</span>
            ) : (
              <span className="admin-field-hint">
                Optional — leave blank to assign and invite later.
              </span>
            )}
          </div>

          <div className="admin-field">
            <label>Plan</label>
            <select
              className="admin-select max-w-[220px]"
              value={plan}
              disabled={saving}
              onChange={(e) => setPlan(e.target.value)}
            >
              {MODAL_PLANS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <span className="admin-field-hint">Not persisted yet — display only.</span>
          </div>

          <div className="admin-field">
            <div className="eyebrow mb-1">
              Enable modules · {mods.length}/{MODAL_MODULE_OPTIONS.length}
            </div>
            <span className="admin-field-hint mb-1 block">
              Pick the finance modules to switch on for this workspace.
            </span>
            <div className="admin-chip-group">
              {MODAL_MODULE_OPTIONS.map((m) => (
                <span
                  key={m}
                  className={`admin-chip${mods.includes(m) ? " on" : ""}`}
                  onClick={() => !saving && toggleMod(m)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      if (!saving) toggleMod(m);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                >
                  {mods.includes(m) && <Check className="h-3 w-3" />}
                  {m}
                </span>
              ))}
            </div>
            <span className="admin-field-hint mt-1 block">
              Module selection is visual only until platform persistence is connected.
            </span>
          </div>
        </div>

        <div className="admin-modal-foot">
          <span className="admin-field-hint">A setup checklist is created automatically.</span>
          <div className="flex gap-2.5">
            <AdminButton size="sm" onClick={onClose} disabled={saving}>
              Cancel
            </AdminButton>
            <AdminButton
              variant="primary"
              size="sm"
              onClick={submit}
              disabled={saving || (tried && !valid)}
            >
              {saving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Creating…
                </>
              ) : (
                <>
                  <Plus className="h-[15px] w-[15px]" />
                  Create company
                </>
              )}
            </AdminButton>
          </div>
        </div>
      </div>
    </div>
  );
}

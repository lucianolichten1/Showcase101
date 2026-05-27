import { useState, useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import {
  DEFAULT_NICHE_KEY,
  getActiveNiches,
  type NicheKey,
} from "@/domains/admin/niches";
import type { CompanyStatus, NewCompanyInput } from "@/domains/admin/types";
import { cn } from "@/lib/utils";

const STATUSES: CompanyStatus[] = ["Active", "Inactive"];
const activeNiches = getActiveNiches();

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: (input: NewCompanyInput) => void;
}

export function AddCompanyDialog({ open, onClose, onConfirm }: Props) {
  const [name, setName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [niche, setNiche] = useState<NicheKey>(DEFAULT_NICHE_KEY);
  const [status, setStatus] = useState<CompanyStatus>("Active");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setName("");
      setOwnerEmail("");
      setNiche(DEFAULT_NICHE_KEY);
      setStatus("Active");
      setErrors({});
    }
  }, [open]);

  if (!open) return null;

  const validate = () => {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = "Company name is required.";
    if (!ownerEmail.trim()) next.ownerEmail = "Owner email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ownerEmail.trim()))
      next.ownerEmail = "Enter a valid email.";
    return next;
  };

  const handleConfirm = () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    onConfirm({
      name: name.trim(),
      ownerEmail: ownerEmail.trim(),
      niche,
      status,
    });
  };

  const inputClass = (err?: string) =>
    cn(
      "w-full rounded-lg border px-3 py-2 text-xs text-stone-900 outline-none transition-colors placeholder:text-stone-300",
      err
        ? "border-red-300 bg-red-50 focus:border-red-400"
        : "border-stone-200 bg-white focus:border-green-700"
    );

  const Field = ({
    label,
    error,
    children,
  }: {
    label: string;
    error?: string;
    children: ReactNode;
  }) => (
    <div>
      <label className="block text-[9px] font-bold uppercase tracking-wider text-stone-500 mb-1.5">
        {label}
      </label>
      {children}
      {error && <p className="text-[9px] text-red-600 mt-1">{error}</p>}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/25 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl border border-stone-200 shadow-xl w-full max-w-sm mx-4 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-stone-900">Add Company</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <p className="text-[10px] text-stone-500 mb-4 leading-relaxed rounded-lg border border-stone-100 bg-stone-50 px-3 py-2">
          New companies are stored locally for now. A dedicated Supabase database will be
          provisioned per company in a future technical phase.
        </p>

        <div className="flex flex-col gap-3 mb-5">
          <Field label="Company name *" error={errors.name}>
            <input
              type="text"
              value={name}
              placeholder="e.g. Santa Fe Agro"
              onChange={(e) => {
                setName(e.target.value);
                setErrors((p) => ({ ...p, name: "" }));
              }}
              className={inputClass(errors.name)}
            />
          </Field>

          <Field label="Owner email *" error={errors.ownerEmail}>
            <input
              type="email"
              value={ownerEmail}
              placeholder="owner@company.com"
              onChange={(e) => {
                setOwnerEmail(e.target.value);
                setErrors((p) => ({ ...p, ownerEmail: "" }));
              }}
              className={inputClass(errors.ownerEmail)}
            />
          </Field>

          <Field label="Niche">
            <select
              value={niche}
              onChange={(e) => setNiche(e.target.value as NicheKey)}
              className={inputClass()}
            >
              {activeNiches.map((n) => (
                <option key={n.key} value={n.key}>
                  {n.name}
                </option>
              ))}
            </select>
            <p className="text-[9px] text-stone-400 mt-1.5 leading-relaxed">
              Assigns the company to a business niche. Only Agro is available today. Each
              company will later receive its own dedicated database — connection is not
              configured yet.
            </p>
          </Field>

          <Field label="Status">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as CompanyStatus)}
              className={inputClass()}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-stone-200 px-3 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="flex-1 rounded-lg bg-green-800 px-3 py-2 text-xs font-semibold text-white hover:bg-green-900 transition-colors"
          >
            Add Company
          </button>
        </div>
      </div>
    </div>
  );
}

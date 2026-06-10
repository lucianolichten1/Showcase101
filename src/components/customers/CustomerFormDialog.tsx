import { useEffect, useState, type ReactNode } from "react";
import { X } from "lucide-react";
import type { CustomerRecord } from "@/domains/customers/types";
import {
  CUSTOMER_CITIES,
  CUSTOMER_FORM_COPY,
  CUSTOMER_INDUSTRIES,
  CUSTOMER_INDUSTRY_LABELS,
} from "@/domains/customers/labels";
import { cn } from "@/lib/utils";

export type CustomerFormState = Omit<CustomerRecord, "id">;

interface Props {
  open: boolean;
  customer: CustomerRecord | null;
  saving?: boolean;
  onClose: () => void;
  onSave: (input: CustomerFormState) => void;
}

export function CustomerFormDialog({ open, customer, saving = false, onClose, onSave }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [industry, setIndustry] = useState("");
  const [status, setStatus] = useState<"Active" | "Inactive">("Active");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    if (customer) {
      setName(customer.name);
      setEmail(customer.email ?? "");
      setPhone(customer.phone ?? "");
      setCity(customer.city ?? "");
      setIndustry(customer.industry ?? "");
      setStatus(customer.status ?? "Active");
    } else {
      setName("");
      setEmail("");
      setPhone("");
      setCity("");
      setIndustry("");
      setStatus("Active");
    }
    setErrors({});
  }, [open, customer]);

  if (!open) return null;

  const validate = () => {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = CUSTOMER_FORM_COPY.nameRequired;
    if (!email.trim()) next.email = CUSTOMER_FORM_COPY.emailRequired;
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      next.email = CUSTOMER_FORM_COPY.emailInvalid;
    }
    return next;
  };

  const handleConfirm = () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    onSave({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      city: city.trim(),
      industry: industry.trim(),
      status,
      createdAt: customer?.createdAt ?? new Date().toISOString().slice(0, 10),
    });
  };

  const inputClass = (err?: string) =>
    cn(
      "w-full rounded-lg border px-3 py-2 text-xs text-stone-900 outline-none transition-colors placeholder:text-stone-300",
      err ? "border-red-300 bg-red-50 focus:border-red-400" : "border-stone-200 bg-white focus:border-green-700"
    );

  const Field = ({ label, error, children }: { label: string; error?: string; children: ReactNode }) => (
    <div>
      <label className="block text-[9px] font-bold uppercase tracking-wider text-green-800 mb-1.5">
        {label}
      </label>
      {children}
      {error && <p className="text-[9px] text-red-600 mt-1">{error}</p>}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-stone-900/40"
        aria-label="Cerrar"
        onClick={() => !saving && onClose()}
      />
      <div className="relative bg-white rounded-xl border border-stone-200 shadow-xl w-full max-w-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-stone-900">
            {customer ? CUSTOMER_FORM_COPY.editTitle : CUSTOMER_FORM_COPY.addTitle}
          </h2>
          <button type="button" onClick={onClose} disabled={saving} className="text-stone-400 hover:text-stone-600">
            <X size={16} />
          </button>
        </div>

        <div className="flex flex-col gap-3 mb-5">
          <Field label={`${CUSTOMER_FORM_COPY.name} *`} error={errors.name}>
            <input
              type="text"
              value={name}
              placeholder={CUSTOMER_FORM_COPY.namePlaceholder}
              onChange={(e) => {
                setName(e.target.value);
                setErrors((p) => ({ ...p, name: "" }));
              }}
              className={inputClass(errors.name)}
            />
          </Field>

          <Field label={`${CUSTOMER_FORM_COPY.email} *`} error={errors.email}>
            <input
              type="email"
              value={email}
              placeholder={CUSTOMER_FORM_COPY.emailPlaceholder}
              onChange={(e) => {
                setEmail(e.target.value);
                setErrors((p) => ({ ...p, email: "" }));
              }}
              className={inputClass(errors.email)}
            />
          </Field>

          <Field label={CUSTOMER_FORM_COPY.phone}>
            <input
              type="tel"
              value={phone}
              placeholder={CUSTOMER_FORM_COPY.phonePlaceholder}
              onChange={(e) => setPhone(e.target.value)}
              className={inputClass()}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label={CUSTOMER_FORM_COPY.city}>
              <select value={city} onChange={(e) => setCity(e.target.value)} className={inputClass()}>
                <option value="">{CUSTOMER_FORM_COPY.select}</option>
                {CUSTOMER_CITIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>

            <Field label={CUSTOMER_FORM_COPY.industry}>
              <select value={industry} onChange={(e) => setIndustry(e.target.value)} className={inputClass()}>
                <option value="">{CUSTOMER_FORM_COPY.select}</option>
                {CUSTOMER_INDUSTRIES.map((i) => (
                  <option key={i} value={i}>
                    {CUSTOMER_INDUSTRY_LABELS[i] ?? i}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label={CUSTOMER_FORM_COPY.status}>
            <div className="flex gap-2">
              {(["Active", "Inactive"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  className={cn(
                    "flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-colors",
                    status === s
                      ? s === "Active"
                        ? "bg-green-800 text-white border-green-800"
                        : "bg-stone-700 text-white border-stone-700"
                      : "bg-white text-stone-500 border-stone-200 hover:border-stone-400"
                  )}
                >
                  {s === "Active" ? CUSTOMER_FORM_COPY.active : CUSTOMER_FORM_COPY.inactive}
                </button>
              ))}
            </div>
          </Field>
        </div>

        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg border border-stone-200 px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-50"
          >
            {CUSTOMER_FORM_COPY.cancel}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={saving}
            className="rounded-lg bg-green-800 px-4 py-2 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50"
          >
            {CUSTOMER_FORM_COPY.save}
          </button>
        </div>
      </div>
    </div>
  );
}

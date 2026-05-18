import { useState, useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import type { Customer } from "@/data/types";
import { cn } from "@/lib/utils";

const INDUSTRIES = ["Agriculture", "Retail", "Distribution", "Export"];
const CITIES = ["Santa Cruz", "La Paz", "Cochabamba", "Trinidad", "Beni", "Oruro", "Potosí", "Sucre"];

interface Props {
  open: boolean;
  nextId: number;
  onClose: () => void;
  onConfirm: (customer: Customer) => void;
}

export function AddCustomerDialog({ open, nextId, onClose, onConfirm }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [industry, setIndustry] = useState("");
  const [status, setStatus] = useState<"Active" | "Inactive">("Active");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setName(""); setEmail(""); setPhone("");
      setCity(""); setIndustry(""); setStatus("Active");
      setErrors({});
    }
  }, [open]);

  if (!open) return null;

  const validate = () => {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = "Name is required.";
    if (!email.trim()) next.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) next.email = "Enter a valid email.";
    return next;
  };

  const handleConfirm = () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    onConfirm({
      id: nextId,
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      city: city.trim(),
      industry: industry.trim(),
      totalInvoiced: 0,
      totalPaid: 0,
      status,
    });
  };

  const inputClass = (err?: string) => cn(
    "w-full rounded-lg border px-3 py-2 text-xs text-stone-900 outline-none transition-colors placeholder:text-stone-300",
    err ? "border-red-300 bg-red-50 focus:border-red-400" : "border-stone-200 bg-white focus:border-green-700"
  );

  const Field = ({ label, error, children }: { label: string; error?: string; children: ReactNode }) => (
    <div>
      <label className="block text-[9px] font-bold uppercase tracking-wider text-stone-500 mb-1.5">{label}</label>
      {children}
      {error && <p className="text-[9px] text-red-600 mt-1">{error}</p>}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/25 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl border border-stone-200 shadow-xl w-full max-w-sm mx-4 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-stone-900">Add Customer</h2>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600 transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="flex flex-col gap-3 mb-5">
          <Field label="Name *" error={errors.name}>
            <input type="text" value={name} placeholder="e.g. Agro Norte SRL"
              onChange={(e) => { setName(e.target.value); setErrors(p => ({ ...p, name: "" })); }}
              className={inputClass(errors.name)} />
          </Field>

          <Field label="Email *" error={errors.email}>
            <input type="email" value={email} placeholder="contacto@empresa.bo"
              onChange={(e) => { setEmail(e.target.value); setErrors(p => ({ ...p, email: "" })); }}
              className={inputClass(errors.email)} />
          </Field>

          <Field label="Phone">
            <input type="tel" value={phone} placeholder="+591 3 333-0000"
              onChange={(e) => setPhone(e.target.value)}
              className={inputClass()} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="City">
              <select value={city} onChange={(e) => setCity(e.target.value)} className={inputClass()}>
                <option value="">Select…</option>
                {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>

            <Field label="Industry">
              <select value={industry} onChange={(e) => setIndustry(e.target.value)} className={inputClass()}>
                <option value="">Select…</option>
                {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </Field>
          </div>

          <Field label="Status">
            <div className="flex gap-2">
              {(["Active", "Inactive"] as const).map(s => (
                <button key={s} onClick={() => setStatus(s)}
                  className={cn(
                    "flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-colors",
                    status === s
                      ? s === "Active" ? "bg-green-800 text-white border-green-800" : "bg-stone-700 text-white border-stone-700"
                      : "bg-white text-stone-500 border-stone-200 hover:border-stone-400"
                  )}>
                  {s}
                </button>
              ))}
            </div>
          </Field>
        </div>

        <div className="flex gap-2 justify-end">
          <button onClick={onClose}
            className="rounded-lg border border-stone-200 px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-50 transition-colors">
            Cancel
          </button>
          <button onClick={handleConfirm}
            className="rounded-lg bg-green-800 px-4 py-2 text-xs font-semibold text-white hover:bg-green-700 transition-colors">
            Add Customer
          </button>
        </div>
      </div>
    </div>
  );
}

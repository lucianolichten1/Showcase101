import { useEffect, useState, type FormEvent } from "react";
import { X } from "lucide-react";
import { BankAccountSelect } from "./BankAccountSelect";
import { MANUAL_TRANSACTION_FORM_COPY } from "@/domains/financial/bank-accounts/labels";
import type { BankAccountRecord, TransferInput } from "@/domains/financial/bank-accounts/types";

interface Props {
  open: boolean;
  fromAccountId: string;
  accounts: BankAccountRecord[];
  saving?: boolean;
  onClose: () => void;
  onSave: (input: TransferInput) => void;
}

export function TransferDialog({
  open,
  fromAccountId,
  accounts,
  saving = false,
  onClose,
  onSave,
}: Props) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState(0);
  const [toAccountId, setToAccountId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setDate(new Date().toISOString().slice(0, 10));
    setDescription("");
    setAmount(0);
    setToAccountId(null);
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

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!toAccountId || amount <= 0 || toAccountId === fromAccountId) return;
    onSave({
      fromAccountId,
      toAccountId,
      date,
      amount,
      description: description.trim() || "Transferencia entre cuentas",
    });
  };

  const destinationAccounts = accounts.filter((a) => a.id !== fromAccountId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <button
        type="button"
        className="absolute inset-0 bg-stone-900/40"
        aria-label="Cerrar"
        onClick={() => !saving && onClose()}
      />
      <div className="relative z-10 w-full max-w-md bg-white rounded-xl border border-stone-200 shadow-xl">
        <div className="flex items-center justify-between border-b border-stone-200 px-5 py-4">
          <h2 className="text-sm font-bold text-stone-900">
            {MANUAL_TRANSACTION_FORM_COPY.transferTitle}
          </h2>
          <button type="button" onClick={onClose} disabled={saving} className="rounded-md p-1.5 text-stone-500 hover:bg-stone-100">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-[10px] font-bold uppercase text-green-800 mb-1">
              {MANUAL_TRANSACTION_FORM_COPY.date}
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full py-2 px-3 text-xs border border-stone-200 rounded-lg"
            />
          </div>
          <BankAccountSelect
            label={MANUAL_TRANSACTION_FORM_COPY.toAccount}
            placeholder={MANUAL_TRANSACTION_FORM_COPY.toAccount}
            value={toAccountId}
            accounts={destinationAccounts}
            required
            onChange={setToAccountId}
          />
          <div>
            <label className="block text-[10px] font-bold uppercase text-green-800 mb-1">
              {MANUAL_TRANSACTION_FORM_COPY.description}
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full py-2 px-3 text-xs border border-stone-200 rounded-lg"
              placeholder="Transferencia entre cuentas"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase text-green-800 mb-1">
              {MANUAL_TRANSACTION_FORM_COPY.amount}
            </label>
            <input
              type="number"
              required
              min={0.01}
              step={0.01}
              value={amount || ""}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              className="w-full py-2 px-3 text-xs border border-stone-200 rounded-lg"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-xs font-bold text-stone-600 border border-stone-200 rounded-lg"
            >
              {MANUAL_TRANSACTION_FORM_COPY.cancel}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-xs font-bold text-white bg-green-800 rounded-lg hover:bg-green-900 disabled:opacity-50"
            >
              {MANUAL_TRANSACTION_FORM_COPY.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

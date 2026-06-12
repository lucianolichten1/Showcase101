import { useEffect, useState, type FormEvent } from "react";
import { X } from "lucide-react";
import type {
  BankAccountInput,
  BankAccountRecord,
  BankAccountType,
  CreateBankAccountInput,
} from "@/domains/financial/bank-accounts/types";
import {
  BANK_ACCOUNT_FORM_COPY,
  BANK_ACCOUNT_TYPES,
  bankAccountTypeLabel,
} from "@/domains/financial/bank-accounts/labels";

export type BankAccountFormState = CreateBankAccountInput;

const emptyForm = (): BankAccountFormState => ({
  accountName: "",
  bankName: "",
  accountNumber: "",
  accountType: "Corriente",
  currency: "Bs",
  active: true,
  openingBalance: 0,
});

interface Props {
  open: boolean;
  account: BankAccountRecord | null;
  saving?: boolean;
  saveError?: string | null;
  onClose: () => void;
  onSave: (input: BankAccountFormState | BankAccountInput) => void;
}

export function BankAccountFormDialog({
  open,
  account,
  saving = false,
  saveError = null,
  onClose,
  onSave,
}: Props) {
  const [form, setForm] = useState<BankAccountFormState>(emptyForm);
  const [validationError, setValidationError] = useState<string | null>(null);
  const isEdit = Boolean(account);

  useEffect(() => {
    if (!open) return;
    if (account) {
      setForm({
        accountName: account.accountName,
        bankName: account.bankName,
        accountNumber: account.accountNumber,
        accountType: account.accountType,
        currency: account.currency,
        active: account.active,
        openingBalance: 0,
      });
    } else {
      setForm(emptyForm());
    }
  }, [open, account]);

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
    if (!form.accountName.trim() || !form.bankName.trim()) {
      setValidationError("Complete el nombre de la cuenta y el banco.");
      return;
    }
    setValidationError(null);

    if (isEdit) {
      const { openingBalance: _opening, ...input } = form;
      onSave({
        ...input,
        accountName: form.accountName.trim(),
        bankName: form.bankName.trim(),
        accountNumber: form.accountNumber.replace(/\D/g, "").slice(-4),
      });
      return;
    }

    onSave({
      ...form,
      accountName: form.accountName.trim(),
      bankName: form.bankName.trim(),
      accountNumber: form.accountNumber.replace(/\D/g, "").slice(-4),
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="bank-account-form-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-stone-900/40"
        aria-label="Cerrar"
        onClick={() => !saving && onClose()}
      />
      <div className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded-xl border border-stone-200 shadow-xl">
        <div className="flex items-center justify-between border-b border-stone-200 px-5 py-4">
          <h2 id="bank-account-form-title" className="text-sm font-bold text-stone-900">
            {isEdit ? BANK_ACCOUNT_FORM_COPY.editTitle : BANK_ACCOUNT_FORM_COPY.addTitle}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-md p-1.5 text-stone-500 hover:bg-stone-100 disabled:opacity-50"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-[10px] font-bold uppercase text-green-800 mb-1">
              {BANK_ACCOUNT_FORM_COPY.accountName}
            </label>
            <input
              type="text"
              required
              value={form.accountName}
              onChange={(e) => setForm((f) => ({ ...f, accountName: e.target.value }))}
              className="w-full py-2 px-3 text-xs border border-stone-200 rounded-lg"
              placeholder={BANK_ACCOUNT_FORM_COPY.accountNamePlaceholder}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase text-green-800 mb-1">
                {BANK_ACCOUNT_FORM_COPY.bankName}
              </label>
              <input
                type="text"
                required
                value={form.bankName}
                onChange={(e) => setForm((f) => ({ ...f, bankName: e.target.value }))}
                className="w-full py-2 px-3 text-xs border border-stone-200 rounded-lg"
                placeholder={BANK_ACCOUNT_FORM_COPY.bankNamePlaceholder}
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-green-800 mb-1">
                {BANK_ACCOUNT_FORM_COPY.accountNumber}
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={4}
                value={form.accountNumber}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    accountNumber: e.target.value.replace(/\D/g, "").slice(0, 4),
                  }))
                }
                className="w-full py-2 px-3 text-xs border border-stone-200 rounded-lg"
                placeholder={BANK_ACCOUNT_FORM_COPY.accountNumberPlaceholder}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase text-green-800 mb-1">
                {BANK_ACCOUNT_FORM_COPY.accountType}
              </label>
              <select
                required
                value={form.accountType}
                onChange={(e) =>
                  setForm((f) => ({ ...f, accountType: e.target.value as BankAccountType }))
                }
                className="w-full py-2 px-3 text-xs border border-stone-200 rounded-lg"
              >
                {BANK_ACCOUNT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {bankAccountTypeLabel(type)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-green-800 mb-1">
                {BANK_ACCOUNT_FORM_COPY.currency}
              </label>
              <input
                type="text"
                required
                value={form.currency}
                onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
                className="w-full py-2 px-3 text-xs border border-stone-200 rounded-lg"
              />
            </div>
          </div>

          {!isEdit && (
            <div>
              <label className="block text-[10px] font-bold uppercase text-green-800 mb-1">
                {BANK_ACCOUNT_FORM_COPY.openingBalance}
              </label>
              <input
                type="number"
                step={0.01}
                value={form.openingBalance || ""}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    openingBalance: parseFloat(e.target.value) || 0,
                  }))
                }
                className="w-full py-2 px-3 text-xs border border-stone-200 rounded-lg"
              />
            </div>
          )}

          {isEdit && (
            <label className="flex items-center gap-2 text-xs text-stone-700">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
                className="rounded border-stone-300"
              />
              {BANK_ACCOUNT_FORM_COPY.active}
            </label>
          )}

          {(validationError || saveError) && (
            <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {validationError ?? saveError}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-xs font-bold text-stone-600 border border-stone-200 rounded-lg hover:bg-stone-50 disabled:opacity-50"
            >
              {BANK_ACCOUNT_FORM_COPY.cancel}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-xs font-bold text-white bg-green-800 rounded-lg hover:bg-green-900 disabled:opacity-50"
            >
              {BANK_ACCOUNT_FORM_COPY.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

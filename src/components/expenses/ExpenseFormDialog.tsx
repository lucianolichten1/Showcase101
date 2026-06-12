import { useEffect, useState, type FormEvent } from "react";
import { X } from "lucide-react";
import type {
  ExpenseCategory,
  ExpensePaymentStatus,
  ExpenseRecord,
  PaymentMethod,
} from "@/domains/financial/types";
import { BankAccountSelect } from "@/components/bank-accounts/BankAccountSelect";
import { useCompanyScopedFinancialData } from "@/domains/company/useCompanyScopedFinancialData";
import {
  EXPENSE_CATEGORIES,
  EXPENSE_FORM_COPY,
  EXPENSE_PAYMENT_METHODS,
  EXPENSE_STATUSES,
  expenseCategoryLabel,
  expenseStatusLabel,
  paymentMethodLabel,
} from "@/domains/financial/expenses/labels";

export type ExpenseFormState = Omit<ExpenseRecord, "id">;

const emptyForm = (): ExpenseFormState => ({
  date: new Date().toISOString().slice(0, 10),
  category: "Other",
  description: "",
  vendor: "",
  amount: 0,
  currency: "Bs",
  status: "Paid",
  paymentMethod: "Bank Transfer",
  bankAccountId: null,
  notes: "",
});

interface Props {
  open: boolean;
  expense: ExpenseRecord | null;
  saving?: boolean;
  saveError?: string | null;
  onClose: () => void;
  onSave: (input: ExpenseFormState) => void;
}

export function ExpenseFormDialog({
  open,
  expense,
  saving = false,
  saveError = null,
  onClose,
  onSave,
}: Props) {
  const [form, setForm] = useState<ExpenseFormState>(emptyForm);
  const [bankAccountError, setBankAccountError] = useState<string | null>(null);
  const { activeBankAccounts } = useCompanyScopedFinancialData();
  const isEdit = Boolean(expense);
  const showBankAccount = form.paymentMethod === "Bank Transfer";

  useEffect(() => {
    if (!open) return;
    if (expense) {
      setForm({
        date: expense.date,
        category: expense.category,
        description: expense.description,
        vendor: expense.vendor,
        amount: expense.amount,
        currency: expense.currency,
        status: expense.status,
        paymentMethod: expense.paymentMethod,
        bankAccountId: expense.bankAccountId ?? null,
        notes: expense.notes,
      });
    } else {
      setForm(emptyForm());
    }
  }, [open, expense]);

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
    if (!form.description.trim() || !form.vendor.trim() || form.amount <= 0) return;
    if (showBankAccount && !form.bankAccountId) {
      setBankAccountError(EXPENSE_FORM_COPY.bankAccountRequired);
      return;
    }
    setBankAccountError(null);
    onSave({
      ...form,
      description: form.description.trim(),
      vendor: form.vendor.trim(),
      notes: form.notes.trim(),
      bankAccountId: showBankAccount ? form.bankAccountId ?? null : null,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="expense-form-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-stone-900/40"
        aria-label="Cerrar"
        onClick={() => !saving && onClose()}
      />
      <div className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded-xl border border-stone-200 shadow-xl">
        <div className="flex items-center justify-between border-b border-stone-200 px-5 py-4">
          <h2 id="expense-form-title" className="text-sm font-bold text-stone-900">
            {isEdit ? EXPENSE_FORM_COPY.editTitle : EXPENSE_FORM_COPY.addTitle}
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
          {saveError && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
              {saveError}
            </p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase text-green-800 mb-1">
                {EXPENSE_FORM_COPY.date}
              </label>
              <input
                type="date"
                required
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                className="w-full py-2 px-3 text-xs border border-stone-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-green-800 mb-1">
                {EXPENSE_FORM_COPY.category}
              </label>
              <select
                required
                value={form.category}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    category: e.target.value as ExpenseCategory,
                  }))
                }
                className="w-full py-2 px-3 text-xs border border-stone-200 rounded-lg"
              >
                {EXPENSE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {expenseCategoryLabel(cat)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase text-green-800 mb-1">
              {EXPENSE_FORM_COPY.description}
            </label>
            <input
              type="text"
              required
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="w-full py-2 px-3 text-xs border border-stone-200 rounded-lg"
              placeholder={EXPENSE_FORM_COPY.descriptionPlaceholder}
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase text-green-800 mb-1">
              {EXPENSE_FORM_COPY.vendor}
            </label>
            <input
              type="text"
              required
              value={form.vendor}
              onChange={(e) => setForm((f) => ({ ...f, vendor: e.target.value }))}
              className="w-full py-2 px-3 text-xs border border-stone-200 rounded-lg"
              placeholder={EXPENSE_FORM_COPY.vendorPlaceholder}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase text-green-800 mb-1">
                {EXPENSE_FORM_COPY.amount}
              </label>
              <input
                type="number"
                required
                min={0.01}
                step={0.01}
                value={form.amount || ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, amount: parseFloat(e.target.value) || 0 }))
                }
                className="w-full py-2 px-3 text-xs border border-stone-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-green-800 mb-1">
                {EXPENSE_FORM_COPY.currency}
              </label>
              <input
                type="text"
                required
                value={form.currency}
                onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
                className="w-full py-2 px-3 text-xs border border-stone-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-green-800 mb-1">
                {EXPENSE_FORM_COPY.status}
              </label>
              <select
                value={form.status}
                onChange={(e) =>
                  setForm((f) => ({ ...f, status: e.target.value as ExpensePaymentStatus }))
                }
                className="w-full py-2 px-3 text-xs border border-stone-200 rounded-lg"
              >
                {EXPENSE_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {expenseStatusLabel(status)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase text-green-800 mb-1">
              {EXPENSE_FORM_COPY.paymentMethod}
            </label>
            <select
              value={form.paymentMethod}
              onChange={(e) => {
                const paymentMethod = e.target.value as PaymentMethod;
                setForm((f) => ({
                  ...f,
                  paymentMethod,
                  bankAccountId:
                    paymentMethod === "Bank Transfer" ? f.bankAccountId ?? null : null,
                }));
              }}
              className="w-full py-2 px-3 text-xs border border-stone-200 rounded-lg"
            >
              {EXPENSE_PAYMENT_METHODS.map((method) => (
                <option key={method} value={method}>
                  {paymentMethodLabel(method)}
                </option>
              ))}
            </select>
          </div>

          {showBankAccount && (
            <div>
              <BankAccountSelect
                label={EXPENSE_FORM_COPY.bankAccount}
                placeholder={EXPENSE_FORM_COPY.bankAccountPlaceholder}
                value={form.bankAccountId}
                accounts={activeBankAccounts}
                required
                onChange={(bankAccountId) => {
                  setBankAccountError(null);
                  setForm((f) => ({ ...f, bankAccountId }));
                }}
              />
              {bankAccountError && (
                <p className="mt-1 text-xs text-red-700">{bankAccountError}</p>
              )}
              {!bankAccountError && form.status !== "Paid" && (
                <p className="mt-1 text-xs text-amber-800">{EXPENSE_FORM_COPY.bankBalanceHint}</p>
              )}
              {activeBankAccounts.length === 0 && (
                <p className="mt-1 text-xs text-amber-800">
                  {EXPENSE_FORM_COPY.bankAccountMissingHint}
                </p>
              )}
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold uppercase text-green-800 mb-1">
              {EXPENSE_FORM_COPY.notes}
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              rows={2}
              className="w-full py-2 px-3 text-xs border border-stone-200 rounded-lg resize-none"
              placeholder={EXPENSE_FORM_COPY.notesPlaceholder}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-xs font-bold text-stone-600 border border-stone-200 rounded-lg hover:bg-stone-50 disabled:opacity-50"
            >
              {EXPENSE_FORM_COPY.cancel}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-xs font-bold text-white bg-green-800 rounded-lg hover:bg-green-900 disabled:opacity-50"
            >
              {EXPENSE_FORM_COPY.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

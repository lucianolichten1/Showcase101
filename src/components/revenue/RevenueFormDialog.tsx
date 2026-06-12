import { useEffect, useState, type FormEvent } from "react";
import { X } from "lucide-react";
import type {
  PaymentMethod,
  RevenueCategory,
  RevenuePaymentStatus,
  RevenueRecord,
} from "@/domains/financial/types";
import { BankAccountSelect } from "@/components/bank-accounts/BankAccountSelect";
import { useCompanyScopedFinancialData } from "@/domains/company/useCompanyScopedFinancialData";
import {
  REVENUE_CATEGORIES,
  REVENUE_FORM_COPY,
  REVENUE_PAYMENT_METHODS,
  REVENUE_STATUSES,
  paymentMethodLabel,
  revenueCategoryLabel,
  revenueStatusLabel,
} from "@/domains/financial/revenue/labels";

export type RevenueFormState = Omit<RevenueRecord, "id">;

const emptyForm = (): RevenueFormState => ({
  date: new Date().toISOString().slice(0, 10),
  sourceClient: "",
  productService: "",
  category: "Other",
  amount: 0,
  currency: "Bs",
  status: "Pending",
  paymentMethod: "Bank Transfer",
  bankAccountId: null,
  invoiceNumber: "",
  notes: "",
});

interface Props {
  open: boolean;
  revenue: RevenueRecord | null;
  saving?: boolean;
  onClose: () => void;
  onSave: (input: RevenueFormState) => void;
}

export function RevenueFormDialog({
  open,
  revenue,
  saving = false,
  onClose,
  onSave,
}: Props) {
  const [form, setForm] = useState<RevenueFormState>(emptyForm);
  const [bankAccountError, setBankAccountError] = useState<string | null>(null);
  const { activeBankAccounts } = useCompanyScopedFinancialData();
  const isEdit = Boolean(revenue);
  const showBankAccount = form.paymentMethod === "Bank Transfer";

  useEffect(() => {
    if (!open) return;
    if (revenue) {
      setForm({
        date: revenue.date,
        sourceClient: revenue.sourceClient,
        productService: revenue.productService,
        category: revenue.category,
        amount: revenue.amount,
        currency: revenue.currency,
        status: revenue.status,
        paymentMethod: revenue.paymentMethod,
        bankAccountId: revenue.bankAccountId ?? null,
        invoiceNumber: revenue.invoiceNumber,
        notes: revenue.notes,
        cost: revenue.cost,
      });
    } else {
      setForm(emptyForm());
    }
  }, [open, revenue]);

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
    if (
      !form.sourceClient.trim() ||
      !form.productService.trim() ||
      !form.invoiceNumber.trim() ||
      (form.status !== "Cancelled" && form.amount <= 0)
    ) {
      return;
    }
    if (showBankAccount && !form.bankAccountId) {
      setBankAccountError(REVENUE_FORM_COPY.bankAccountRequired);
      return;
    }
    setBankAccountError(null);
    onSave({
      ...form,
      sourceClient: form.sourceClient.trim(),
      productService: form.productService.trim(),
      invoiceNumber: form.invoiceNumber.trim(),
      notes: form.notes.trim(),
      bankAccountId: showBankAccount ? form.bankAccountId ?? null : null,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="revenue-form-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-stone-900/40"
        aria-label="Cerrar"
        onClick={() => !saving && onClose()}
      />
      <div className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded-xl border border-stone-200 shadow-xl">
        <div className="flex items-center justify-between border-b border-stone-200 px-5 py-4">
          <h2 id="revenue-form-title" className="text-sm font-bold text-stone-900">
            {isEdit ? REVENUE_FORM_COPY.editTitle : REVENUE_FORM_COPY.addTitle}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase text-green-800 mb-1">
                {REVENUE_FORM_COPY.date}
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
                {REVENUE_FORM_COPY.category}
              </label>
              <select
                required
                value={form.category}
                onChange={(e) =>
                  setForm((f) => ({ ...f, category: e.target.value as RevenueCategory }))
                }
                className="w-full py-2 px-3 text-xs border border-stone-200 rounded-lg"
              >
                {REVENUE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {revenueCategoryLabel(cat)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase text-green-800 mb-1">
              {REVENUE_FORM_COPY.sourceClient}
            </label>
            <input
              type="text"
              required
              value={form.sourceClient}
              onChange={(e) => setForm((f) => ({ ...f, sourceClient: e.target.value }))}
              className="w-full py-2 px-3 text-xs border border-stone-200 rounded-lg"
              placeholder={REVENUE_FORM_COPY.sourceClientPlaceholder}
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase text-green-800 mb-1">
              {REVENUE_FORM_COPY.productService}
            </label>
            <input
              type="text"
              required
              value={form.productService}
              onChange={(e) => setForm((f) => ({ ...f, productService: e.target.value }))}
              className="w-full py-2 px-3 text-xs border border-stone-200 rounded-lg"
              placeholder={REVENUE_FORM_COPY.productServicePlaceholder}
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase text-green-800 mb-1">
              {REVENUE_FORM_COPY.invoiceNumber}
            </label>
            <input
              type="text"
              required
              value={form.invoiceNumber}
              onChange={(e) => setForm((f) => ({ ...f, invoiceNumber: e.target.value }))}
              className="w-full py-2 px-3 text-xs border border-stone-200 rounded-lg"
              placeholder={REVENUE_FORM_COPY.invoiceNumberPlaceholder}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase text-green-800 mb-1">
                {REVENUE_FORM_COPY.amount}
              </label>
              <input
                type="number"
                required={form.status !== "Cancelled"}
                min={0}
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
                {REVENUE_FORM_COPY.currency}
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
                {REVENUE_FORM_COPY.status}
              </label>
              <select
                value={form.status}
                onChange={(e) =>
                  setForm((f) => ({ ...f, status: e.target.value as RevenuePaymentStatus }))
                }
                className="w-full py-2 px-3 text-xs border border-stone-200 rounded-lg"
              >
                {REVENUE_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {revenueStatusLabel(status)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase text-green-800 mb-1">
              {REVENUE_FORM_COPY.paymentMethod}
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
              {REVENUE_PAYMENT_METHODS.map((method) => (
                <option key={method} value={method}>
                  {paymentMethodLabel(method)}
                </option>
              ))}
            </select>
          </div>

          {showBankAccount && (
            <div>
              <BankAccountSelect
                label={REVENUE_FORM_COPY.bankAccount}
                placeholder={REVENUE_FORM_COPY.bankAccountPlaceholder}
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
              {activeBankAccounts.length === 0 && (
                <p className="mt-1 text-xs text-amber-800">
                  {REVENUE_FORM_COPY.bankAccountMissingHint}
                </p>
              )}
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold uppercase text-green-800 mb-1">
              {REVENUE_FORM_COPY.notes}
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              rows={2}
              className="w-full py-2 px-3 text-xs border border-stone-200 rounded-lg resize-none"
              placeholder={REVENUE_FORM_COPY.notesPlaceholder}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-xs font-bold text-stone-600 border border-stone-200 rounded-lg hover:bg-stone-50 disabled:opacity-50"
            >
              {REVENUE_FORM_COPY.cancel}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-xs font-bold text-white bg-green-800 rounded-lg hover:bg-green-900 disabled:opacity-50"
            >
              {REVENUE_FORM_COPY.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

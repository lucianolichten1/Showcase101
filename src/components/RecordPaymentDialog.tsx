import { useState, useEffect } from "react";
import { X } from "lucide-react";
import type { ReceivableRecord, PaymentMethod } from "@/domains/financial/types";
import { BankAccountSelect } from "@/components/bank-accounts/BankAccountSelect";
import { useCompanyScopedFinancialData } from "@/domains/company/useCompanyScopedFinancialData";
import { formatCurrency } from "@/data/mockData";
import { cn } from "@/lib/utils";
import { PAYMENT_METHOD_LABELS } from "@/domains/financial/expenses/labels";
import { RECORD_PAYMENT_COPY } from "@/domains/financial/receivables/labels";
import type { ReceivablePaymentInput } from "@/domains/financial/receivables/receivablePaymentTypes";

const AR_PAYMENT_METHODS: PaymentMethod[] = ["Bank Transfer", "Cash", "Check"];

interface Props {
  open: boolean;
  receivable: ReceivableRecord | null;
  saving?: boolean;
  onClose: () => void;
  onConfirm: (receivableId: number, input: ReceivablePaymentInput) => void;
}

export function RecordPaymentDialog({ open, receivable, saving = false, onClose, onConfirm }: Props) {
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("Bank Transfer");
  const [bankAccountId, setBankAccountId] = useState<string | null>(null);
  const [bankAccountError, setBankAccountError] = useState<string | null>(null);
  const { activeBankAccounts } = useCompanyScopedFinancialData();

  useEffect(() => {
    if (open) {
      setAmount("");
      setDate(new Date().toISOString().split("T")[0]);
      setPaymentMethod("Bank Transfer");
      setBankAccountId(null);
      setBankAccountError(null);
    }
  }, [open, receivable?.id]);

  if (!open || !receivable) return null;

  const balance = receivable.amount - receivable.amountPaid;
  const parsed = parseFloat(amount);
  const needsBankAccount = paymentMethod === "Bank Transfer";
  const bankValid = !needsBankAccount || Boolean(bankAccountId);
  const isValid = !isNaN(parsed) && parsed > 0 && parsed <= balance && bankValid;

  const handleConfirm = () => {
    if (!isValid) {
      if (needsBankAccount && !bankAccountId) {
        setBankAccountError(RECORD_PAYMENT_COPY.bankAccountRequired);
      }
      return;
    }
    onConfirm(receivable.id, {
      amount: parsed,
      paymentDateIso: date,
      paymentMethod,
      bankAccountId: needsBankAccount ? bankAccountId : null,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/25 backdrop-blur-sm"
        onClick={saving ? undefined : onClose}
      />
      <div className="relative bg-white rounded-xl border border-stone-200 shadow-xl w-full max-w-sm mx-4 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-stone-900">{RECORD_PAYMENT_COPY.title}</h2>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="text-stone-400 hover:text-stone-600 transition-colors disabled:opacity-50"
          >
            <X size={16} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-wider text-stone-400 mb-1">Customer</p>
            <p className="text-xs font-medium text-stone-800">{receivable.customer}</p>
          </div>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-wider text-stone-400 mb-1">Invoice #</p>
            <p className="text-xs font-mono text-stone-600">{receivable.invoiceNumber}</p>
          </div>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-wider text-stone-400 mb-1">Invoice Total</p>
            <p className="text-xs text-stone-700">{formatCurrency(receivable.amount)}</p>
          </div>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-wider text-stone-400 mb-1">Balance Due</p>
            <p className="text-xs font-bold text-stone-900">{formatCurrency(balance)}</p>
          </div>
        </div>

        <div className="h-px bg-stone-100 mb-4" />

        <div className="flex flex-col gap-3 mb-5">
          <div>
            <label className="block text-[9px] font-bold uppercase tracking-wider text-stone-500 mb-1.5">
              {RECORD_PAYMENT_COPY.amount}
            </label>
            <input
              type="number"
              min={0.01}
              max={balance}
              step={0.01}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={`Max ${formatCurrency(balance)}`}
              className={cn(
                "w-full rounded-lg border px-3 py-2 text-xs text-stone-900 outline-none transition-colors",
                "placeholder:text-stone-300",
                !isValid && amount !== ""
                  ? "border-red-300 bg-red-50 focus:border-red-400"
                  : "border-stone-200 bg-white focus:border-green-700"
              )}
            />
            {!isValid && amount !== "" && parsed > balance && (
              <p className="text-[9px] text-red-600 mt-1">
                Enter an amount between Bs 0.01 and {formatCurrency(balance)}.
              </p>
            )}
          </div>

          <div>
            <label className="block text-[9px] font-bold uppercase tracking-wider text-stone-500 mb-1.5">
              {RECORD_PAYMENT_COPY.paymentDate}
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs text-stone-900 outline-none focus:border-green-700 transition-colors"
            />
          </div>

          <div>
            <label className="block text-[9px] font-bold uppercase tracking-wider text-stone-500 mb-1.5">
              {RECORD_PAYMENT_COPY.paymentMethod}
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => {
                const method = e.target.value as PaymentMethod;
                setPaymentMethod(method);
                setBankAccountError(null);
                if (method !== "Bank Transfer") setBankAccountId(null);
              }}
              className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs text-stone-900 outline-none focus:border-green-700"
            >
              {AR_PAYMENT_METHODS.map((method) => (
                <option key={method} value={method}>
                  {PAYMENT_METHOD_LABELS[method]}
                </option>
              ))}
            </select>
          </div>

          {needsBankAccount && (
            <div>
              <BankAccountSelect
                label={RECORD_PAYMENT_COPY.bankAccount}
                placeholder={RECORD_PAYMENT_COPY.bankAccountPlaceholder}
                value={bankAccountId}
                accounts={activeBankAccounts}
                required
                onChange={(id) => {
                  setBankAccountError(null);
                  setBankAccountId(id);
                }}
              />
              {bankAccountError && (
                <p className="mt-1 text-xs text-red-700">{bankAccountError}</p>
              )}
              {!bankAccountError && (
                <p className="mt-1 text-xs text-amber-800">{RECORD_PAYMENT_COPY.bankBalanceHint}</p>
              )}
              {activeBankAccounts.length === 0 && (
                <p className="mt-1 text-xs text-amber-800">
                  {RECORD_PAYMENT_COPY.bankAccountMissingHint}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg border border-stone-200 px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-50 transition-colors disabled:opacity-50"
          >
            {RECORD_PAYMENT_COPY.cancel}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!isValid || saving}
            className={cn(
              "rounded-lg px-4 py-2 text-xs font-semibold text-white transition-colors",
              isValid && !saving
                ? "bg-green-800 hover:bg-green-700"
                : "bg-stone-200 text-stone-400 cursor-not-allowed"
            )}
          >
            {RECORD_PAYMENT_COPY.confirm}
          </button>
        </div>
      </div>
    </div>
  );
}

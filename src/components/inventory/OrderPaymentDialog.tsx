import { useEffect, useState } from "react";
import { X } from "lucide-react";
import type { OrderPaymentInput, PaymentMethod } from "@/domains/inventory/types";
import { BankAccountSelect } from "@/components/bank-accounts/BankAccountSelect";
import { useCompanyScopedFinancialData } from "@/domains/company/useCompanyScopedFinancialData";
import { PAYMENT_METHOD_LABELS } from "@/domains/financial/expenses/labels";
import { formatCurrency } from "@/data/mockData";
import { cn } from "@/lib/utils";

const ORDER_PAYMENT_METHODS: PaymentMethod[] = ["Bank Transfer", "Cash", "Check"];

interface Props {
  open: boolean;
  title: string;
  orderLabel: string;
  orderNumber: string;
  total: number;
  balanceHint: string;
  saving?: boolean;
  onClose: () => void;
  onConfirm: (input: OrderPaymentInput) => void;
}

export function OrderPaymentDialog({
  open,
  title,
  orderLabel,
  orderNumber,
  total,
  balanceHint,
  saving = false,
  onClose,
  onConfirm,
}: Props) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("Bank Transfer");
  const [bankAccountId, setBankAccountId] = useState<string | null>(null);
  const [bankAccountError, setBankAccountError] = useState<string | null>(null);
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const { activeBankAccounts } = useCompanyScopedFinancialData();

  useEffect(() => {
    if (open) {
      setPaymentMethod("Bank Transfer");
      setBankAccountId(null);
      setBankAccountError(null);
      setDate(new Date().toISOString().split("T")[0]);
    }
  }, [open, orderNumber]);

  if (!open) return null;

  const needsBankAccount = paymentMethod === "Bank Transfer";
  const isValid = !needsBankAccount || Boolean(bankAccountId);

  const handleConfirm = () => {
    if (needsBankAccount && !bankAccountId) {
      setBankAccountError("Seleccione una cuenta bancaria para transferencias.");
      return;
    }
    onConfirm({
      paymentMethod,
      bankAccountId: needsBankAccount ? bankAccountId : null,
      paymentDateIso: date,
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
          <h2 className="text-sm font-bold text-stone-900">{title}</h2>
          <button type="button" onClick={onClose} disabled={saving} className="text-stone-400 hover:text-stone-600">
            <X size={16} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-wider text-stone-400 mb-1">{orderLabel}</p>
            <p className="text-xs font-mono text-stone-600">{orderNumber}</p>
          </div>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-wider text-stone-400 mb-1">Total</p>
            <p className="text-xs font-bold text-stone-900">{formatCurrency(total)}</p>
          </div>
        </div>

        <div className="flex flex-col gap-3 mb-5">
          <div>
            <label className="block text-[9px] font-bold uppercase tracking-wider text-stone-500 mb-1.5">
              Fecha
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs"
            />
          </div>
          <div>
            <label className="block text-[9px] font-bold uppercase tracking-wider text-stone-500 mb-1.5">
              Método de pago
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => {
                const method = e.target.value as PaymentMethod;
                setPaymentMethod(method);
                setBankAccountError(null);
                if (method !== "Bank Transfer") setBankAccountId(null);
              }}
              className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs"
            >
              {ORDER_PAYMENT_METHODS.map((method) => (
                <option key={method} value={method}>
                  {PAYMENT_METHOD_LABELS[method]}
                </option>
              ))}
            </select>
          </div>
          {needsBankAccount && (
            <div>
              <BankAccountSelect
                label="Cuenta bancaria"
                placeholder="Seleccione una cuenta"
                value={bankAccountId}
                accounts={activeBankAccounts}
                required
                onChange={(id) => {
                  setBankAccountError(null);
                  setBankAccountId(id);
                }}
              />
              {bankAccountError && <p className="mt-1 text-xs text-red-700">{bankAccountError}</p>}
              {!bankAccountError && (
                <p className="mt-1 text-xs text-amber-800">{balanceHint}</p>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg border border-stone-200 px-4 py-2 text-xs font-semibold text-stone-600"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!isValid || saving}
            className={cn(
              "rounded-lg px-4 py-2 text-xs font-semibold text-white",
              isValid && !saving ? "bg-green-800 hover:bg-green-700" : "bg-stone-200 text-stone-400"
            )}
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}

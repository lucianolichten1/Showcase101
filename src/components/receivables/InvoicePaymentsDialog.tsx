import { Trash2, X } from "lucide-react";
import type { ReceivableRecord } from "@/domains/financial/types";
import type { BankAccountRecord } from "@/domains/financial/bank-accounts/types";
import type { ReceivablePaymentRecord } from "@/domains/financial/receivables/receivablePaymentTypes";
import { PAYMENT_METHOD_LABELS } from "@/domains/financial/expenses/labels";
import { INVOICE_PAYMENTS_COPY } from "@/domains/financial/receivables/labels";
import { formatCurrency } from "@/data/mockData";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  receivable: ReceivableRecord | null;
  payments: ReceivablePaymentRecord[];
  bankAccounts: BankAccountRecord[];
  deletingPaymentId: number | null;
  onClose: () => void;
  onRecordPayment: () => void;
  onDeletePayment: (paymentId: number) => void;
}

function bankAccountLabel(
  bankAccountId: string | null,
  accounts: BankAccountRecord[]
): string {
  if (!bankAccountId) return "—";
  return accounts.find((a) => a.id === bankAccountId)?.accountName ?? INVOICE_PAYMENTS_COPY.unknownAccount;
}

export function InvoicePaymentsDialog({
  open,
  receivable,
  payments,
  bankAccounts,
  deletingPaymentId,
  onClose,
  onRecordPayment,
  onDeletePayment,
}: Props) {
  if (!open || !receivable) return null;

  const balance = receivable.amount - receivable.amountPaid;
  const invoicePayments = payments
    .filter((p) => p.invoiceId === receivable.id)
    .sort((a, b) => b.paymentDate.localeCompare(a.paymentDate));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/25 backdrop-blur-sm"
        onClick={deletingPaymentId ? undefined : onClose}
      />
      <div className="relative bg-white rounded-xl border border-stone-200 shadow-xl w-full max-w-lg mx-4 max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-stone-100 px-5 py-4">
          <div>
            <h2 className="text-sm font-bold text-stone-900">{INVOICE_PAYMENTS_COPY.title}</h2>
            <p className="text-xs text-stone-600 mt-0.5">
              {receivable.invoiceNumber} · {receivable.customer}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={Boolean(deletingPaymentId)}
            className="text-stone-400 hover:text-stone-600 transition-colors disabled:opacity-50"
          >
            <X size={16} />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3 px-5 py-4 border-b border-stone-100 bg-stone-50/60">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-wider text-stone-400">{INVOICE_PAYMENTS_COPY.total}</p>
            <p className="text-xs font-semibold text-stone-800">{formatCurrency(receivable.amount)}</p>
          </div>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-wider text-stone-400">{INVOICE_PAYMENTS_COPY.paid}</p>
            <p className="text-xs font-semibold text-stone-800">{formatCurrency(receivable.amountPaid)}</p>
          </div>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-wider text-stone-400">{INVOICE_PAYMENTS_COPY.balance}</p>
            <p className="text-xs font-bold text-stone-900">{formatCurrency(balance)}</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {invoicePayments.length === 0 ? (
            <p className="text-sm text-stone-600 text-center py-8">{INVOICE_PAYMENTS_COPY.empty}</p>
          ) : (
            <ul className="space-y-2">
              {invoicePayments.map((payment) => (
                <li
                  key={payment.id}
                  className="rounded-lg border border-stone-200 px-3 py-2.5 flex items-start justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-stone-900 tabular-nums">
                      {formatCurrency(payment.amount)}
                    </p>
                    <p className="text-[10px] text-stone-600 mt-0.5">
                      {payment.paymentDate} · {PAYMENT_METHOD_LABELS[payment.paymentMethod]}
                    </p>
                    {payment.paymentMethod === "Bank Transfer" && (
                      <p className="text-[10px] text-green-800 font-medium mt-0.5 truncate">
                        {INVOICE_PAYMENTS_COPY.depositedTo}{" "}
                        {bankAccountLabel(payment.bankAccountId, bankAccounts)}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => onDeletePayment(payment.id)}
                    disabled={deletingPaymentId === payment.id}
                    className={cn(
                      "shrink-0 rounded-md p-1.5 text-stone-400 hover:text-red-700 hover:bg-red-50 transition-colors",
                      deletingPaymentId === payment.id && "opacity-50 cursor-wait"
                    )}
                    title={INVOICE_PAYMENTS_COPY.deletePayment}
                  >
                    <Trash2 size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-stone-100 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={Boolean(deletingPaymentId)}
            className="rounded-lg border border-stone-200 px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-50 transition-colors disabled:opacity-50"
          >
            {INVOICE_PAYMENTS_COPY.close}
          </button>
          {balance > 0 && (
            <button
              type="button"
              onClick={onRecordPayment}
              disabled={Boolean(deletingPaymentId)}
              className="rounded-lg bg-green-800 px-4 py-2 text-xs font-semibold text-white hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {INVOICE_PAYMENTS_COPY.recordPayment}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

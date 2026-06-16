import { useEffect } from "react";
import { MessageCircle, QrCode, X } from "lucide-react";
import { formatCurrency } from "@/data/mockData";
import type { ReceivableRecord } from "@/domains/financial/types";
import { COLLECT_INVOICE_COPY } from "@/domains/financial/receivables/labels";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  receivable: ReceivableRecord | null;
  balance: number;
  hasPhone: boolean;
  hasBankAccount: boolean;
  whatsAppSent: boolean;
  qrExpired: boolean;
  loadingQr: boolean;
  onClose: () => void;
  onWhatsApp: () => void;
  onQr: () => void;
}

export function CollectInvoiceDialog({
  open,
  receivable,
  balance,
  hasPhone,
  hasBankAccount,
  whatsAppSent,
  qrExpired,
  loadingQr,
  onClose,
  onWhatsApp,
  onQr,
}: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !loadingQr) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, loadingQr, onClose]);

  if (!open || !receivable) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-stone-900/40"
        aria-label={COLLECT_INVOICE_COPY.cancel}
        onClick={() => !loadingQr && onClose()}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="collect-invoice-title"
        className="relative w-full max-w-md rounded-xl border border-stone-200 bg-white shadow-xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-stone-100 px-5 py-4">
          <div>
            <h2 id="collect-invoice-title" className="text-base font-bold text-stone-900">
              {COLLECT_INVOICE_COPY.title}
            </h2>
            <p className="text-xs text-stone-600 mt-1">
              {receivable.invoiceNumber} · {receivable.customer}
            </p>
            <p className="text-sm font-bold text-green-800 tabular-nums mt-1">
              {formatCurrency(balance)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loadingQr}
            className="p-1.5 rounded-lg text-stone-500 hover:bg-stone-100 disabled:opacity-50"
            aria-label={COLLECT_INVOICE_COPY.cancel}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-3">
          <p className="text-sm text-stone-600">{COLLECT_INVOICE_COPY.description}</p>

          <button
            type="button"
            onClick={onWhatsApp}
            disabled={!hasPhone}
            className={cn(
              "w-full text-left rounded-lg border px-4 py-3 transition-colors",
              hasPhone
                ? "border-stone-200 hover:border-green-800/30 hover:bg-green-50/40"
                : "border-stone-200 opacity-60 cursor-not-allowed"
            )}
          >
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green-50 text-green-800">
                <MessageCircle className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-bold text-stone-900">
                  {COLLECT_INVOICE_COPY.whatsApp}
                </p>
                <p className="text-xs text-stone-600 mt-0.5">
                  {hasPhone
                    ? COLLECT_INVOICE_COPY.whatsAppHint
                    : COLLECT_INVOICE_COPY.whatsAppNoPhone}
                </p>
                {whatsAppSent && hasPhone && (
                  <p className="text-[10px] font-bold uppercase text-stone-500 mt-1">
                    {COLLECT_INVOICE_COPY.whatsAppSent}
                  </p>
                )}
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={onQr}
            disabled={!hasBankAccount || loadingQr}
            className={cn(
              "w-full text-left rounded-lg border px-4 py-3 transition-colors",
              hasBankAccount && !loadingQr
                ? "border-stone-200 hover:border-green-800/30 hover:bg-green-50/40"
                : "border-stone-200 opacity-60 cursor-not-allowed"
            )}
          >
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green-50 text-green-800">
                <QrCode className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-bold text-stone-900">
                  {qrExpired ? COLLECT_INVOICE_COPY.qrNew : COLLECT_INVOICE_COPY.qr}
                </p>
                <p className="text-xs text-stone-600 mt-0.5">
                  {hasBankAccount
                    ? COLLECT_INVOICE_COPY.qrHint
                    : COLLECT_INVOICE_COPY.qrNoBank}
                </p>
                {qrExpired && hasBankAccount && (
                  <p className="text-[10px] font-bold uppercase text-amber-700 mt-1">
                    {COLLECT_INVOICE_COPY.qrExpired}
                  </p>
                )}
              </div>
            </div>
          </button>
        </div>

        <div className="border-t border-stone-100 px-5 py-4 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={loadingQr}
            className="px-4 py-2 text-xs font-bold text-stone-700 border border-stone-200 rounded-lg hover:bg-stone-50 disabled:opacity-50"
          >
            {COLLECT_INVOICE_COPY.cancel}
          </button>
        </div>
      </div>
    </div>
  );
}

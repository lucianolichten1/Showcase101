import { useState, useEffect } from "react";
import { X } from "lucide-react";
import type { Receivable } from "@/data/types";
import { formatCurrency } from "@/data/mockData";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  receivable: Receivable | null;
  onClose: () => void;
  onConfirm: (receivableId: number, payment: number, date: string) => void;
}

export function RecordPaymentDialog({ open, receivable, onClose, onConfirm }: Props) {
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);

  useEffect(() => {
    if (open) {
      setAmount("");
      setDate(new Date().toISOString().split("T")[0]);
    }
  }, [open, receivable?.id]);

  if (!open || !receivable) return null;

  const balance = receivable.amount - receivable.amountPaid;
  const parsed = parseFloat(amount);
  const isValid = !isNaN(parsed) && parsed > 0 && parsed <= balance;

  const handleConfirm = () => {
    if (!isValid) return;
    onConfirm(receivable.id, parsed, date);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/25 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-xl border border-stone-200 shadow-xl w-full max-w-sm mx-4 p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-stone-900">Record Payment</h2>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Read-only info */}
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

        {/* Inputs */}
        <div className="flex flex-col gap-3 mb-5">
          <div>
            <label className="block text-[9px] font-bold uppercase tracking-wider text-stone-500 mb-1.5">
              Amount to Pay (Bs)
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
            {!isValid && amount !== "" && (
              <p className="text-[9px] text-red-600 mt-1">
                Enter an amount between Bs 0.01 and {formatCurrency(balance)}.
              </p>
            )}
          </div>
          <div>
            <label className="block text-[9px] font-bold uppercase tracking-wider text-stone-500 mb-1.5">
              Payment Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs text-stone-900 outline-none focus:border-green-700 transition-colors"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="rounded-lg border border-stone-200 px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!isValid}
            className={cn(
              "rounded-lg px-4 py-2 text-xs font-semibold text-white transition-colors",
              isValid
                ? "bg-green-800 hover:bg-green-700"
                : "bg-stone-200 text-stone-400 cursor-not-allowed"
            )}
          >
            Confirm Payment
          </button>
        </div>
      </div>
    </div>
  );
}

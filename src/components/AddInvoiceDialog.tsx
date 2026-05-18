import { useState, useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import type { Receivable } from "@/data/types";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  customerNames: string[];
  nextInvoiceNumber: string;
  onClose: () => void;
  onConfirm: (receivable: Receivable) => void;
  nextId: number;
}

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function formatDueDateForDisplay(isoDate: string): string {
  const [, month, day] = isoDate.split("-").map(Number);
  return `${MONTH_NAMES[month - 1]} ${day}`;
}

function calcOverdueDays(isoDate: string): number {
  const [year, month, day] = isoDate.split("-").map(Number);
  const due = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
}

export function AddInvoiceDialog({ open, customerNames, nextInvoiceNumber, nextId, onClose, onConfirm }: Props) {
  const [customer, setCustomer] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState(nextInvoiceNumber);
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setCustomer("");
      setInvoiceNumber(nextInvoiceNumber);
      setAmount("");
      setDueDate("");
      setErrors({});
    }
  }, [open, nextInvoiceNumber]);

  if (!open) return null;

  const validate = () => {
    const next: Record<string, string> = {};
    if (!customer.trim()) next.customer = "Select a customer.";
    if (!invoiceNumber.trim()) next.invoiceNumber = "Invoice number is required.";
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) next.amount = "Enter a valid amount greater than 0.";
    if (!dueDate) next.dueDate = "Select a due date.";
    return next;
  };

  const handleConfirm = () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    const overdueDays = calcOverdueDays(dueDate);
    const status: Receivable["status"] = overdueDays > 0 ? "Overdue" : "Pending";
    onConfirm({
      id: nextId,
      customer: customer.trim(),
      invoiceNumber: invoiceNumber.trim(),
      amount: parseFloat(amount),
      amountPaid: 0,
      dueDate: formatDueDateForDisplay(dueDate),
      overdueDays,
      status,
    });
  };

  const field = (label: string, error?: string, children?: ReactNode) => (
    <div>
      <label className="block text-[9px] font-bold uppercase tracking-wider text-stone-500 mb-1.5">
        {label}
      </label>
      {children}
      {error && <p className="text-[9px] text-red-600 mt-1">{error}</p>}
    </div>
  );

  const inputClass = (hasError?: boolean) =>
    cn(
      "w-full rounded-lg border px-3 py-2 text-xs text-stone-900 outline-none transition-colors placeholder:text-stone-300",
      hasError
        ? "border-red-300 bg-red-50 focus:border-red-400"
        : "border-stone-200 bg-white focus:border-green-700"
    );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/25 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl border border-stone-200 shadow-xl w-full max-w-sm mx-4 p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-stone-900">Add Invoice</h2>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600 transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="flex flex-col gap-3 mb-5">
          {field(
            "Customer *",
            errors.customer,
            <select
              value={customer}
              onChange={(e) => { setCustomer(e.target.value); setErrors((p) => ({ ...p, customer: "" })); }}
              className={inputClass(!!errors.customer)}
            >
              <option value="">Select customer…</option>
              {customerNames.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          )}

          {field(
            "Invoice # *",
            errors.invoiceNumber,
            <input
              type="text"
              value={invoiceNumber}
              onChange={(e) => { setInvoiceNumber(e.target.value); setErrors((p) => ({ ...p, invoiceNumber: "" })); }}
              className={inputClass(!!errors.invoiceNumber)}
            />
          )}

          {field(
            "Total Amount (Bs) *",
            errors.amount,
            <input
              type="number"
              min={0.01}
              step={0.01}
              value={amount}
              onChange={(e) => { setAmount(e.target.value); setErrors((p) => ({ ...p, amount: "" })); }}
              placeholder="0.00"
              className={inputClass(!!errors.amount)}
            />
          )}

          {field(
            "Due Date *",
            errors.dueDate,
            <input
              type="date"
              value={dueDate}
              onChange={(e) => { setDueDate(e.target.value); setErrors((p) => ({ ...p, dueDate: "" })); }}
              className={inputClass(!!errors.dueDate)}
            />
          )}
        </div>

        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="rounded-lg border border-stone-200 px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="rounded-lg bg-green-800 px-4 py-2 text-xs font-semibold text-white hover:bg-green-700 transition-colors"
          >
            Add Invoice
          </button>
        </div>
      </div>
    </div>
  );
}

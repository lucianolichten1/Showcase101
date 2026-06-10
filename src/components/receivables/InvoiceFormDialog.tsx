import { useEffect, useState, type ReactNode } from "react";
import { X } from "lucide-react";
import type { ReceivableRecord } from "@/domains/financial/types";
import { RECEIVABLE_FORM_COPY } from "@/domains/financial/receivables/labels";
import { displayDueDateToIso } from "@/domains/financial/receivables/receivableDates";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  receivable: ReceivableRecord | null;
  customerNames: string[];
  nextInvoiceNumber: string;
  saving?: boolean;
  onClose: () => void;
  onSave: (input: {
    customer: string;
    invoiceNumber: string;
    amount: number;
    dueDateIso: string;
    amountPaid: number;
  }) => void;
}

export function InvoiceFormDialog({
  open,
  receivable,
  customerNames,
  nextInvoiceNumber,
  saving = false,
  onClose,
  onSave,
}: Props) {
  const [customer, setCustomer] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState(nextInvoiceNumber);
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    if (receivable) {
      setCustomer(receivable.customer);
      setInvoiceNumber(receivable.invoiceNumber);
      setAmount(String(receivable.amount));
      const iso = displayDueDateToIso(receivable.dueDate) ?? "";
      setDueDate(iso);
    } else {
      setCustomer("");
      setInvoiceNumber(nextInvoiceNumber);
      setAmount("");
      setDueDate("");
    }
    setErrors({});
  }, [open, receivable, nextInvoiceNumber]);

  if (!open) return null;

  const validate = () => {
    const next: Record<string, string> = {};
    if (!customer.trim()) next.customer = RECEIVABLE_FORM_COPY.customerRequired;
    if (!invoiceNumber.trim()) next.invoiceNumber = RECEIVABLE_FORM_COPY.invoiceRequired;
    const parsedAmount = parseFloat(amount);
    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      next.amount = RECEIVABLE_FORM_COPY.amountRequired;
    }
    if (!dueDate) next.dueDate = RECEIVABLE_FORM_COPY.dueDateRequired;
    return next;
  };

  const handleConfirm = () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    onSave({
      customer: customer.trim(),
      invoiceNumber: invoiceNumber.trim(),
      amount: parseFloat(amount),
      dueDateIso: dueDate,
      amountPaid: receivable?.amountPaid ?? 0,
    });
  };

  const field = (label: string, error?: string, children?: ReactNode) => (
    <div>
      <label className="block text-[9px] font-bold uppercase tracking-wider text-green-800 mb-1.5">
        {label}
      </label>
      {children}
      {error && <p className="text-[9px] text-red-600 mt-1">{error}</p>}
    </div>
  );

  const inputClass = (err?: string) =>
    cn(
      "w-full rounded-lg border px-3 py-2 text-xs text-stone-900 outline-none",
      err ? "border-red-300 bg-red-50" : "border-stone-200 bg-white focus:border-green-700"
    );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-stone-900/40" onClick={() => !saving && onClose()} />
      <div className="relative bg-white rounded-xl border border-stone-200 shadow-xl w-full max-w-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-stone-900">
            {receivable ? RECEIVABLE_FORM_COPY.editTitle : RECEIVABLE_FORM_COPY.addTitle}
          </h2>
          <button type="button" onClick={onClose} disabled={saving}>
            <X size={16} className="text-stone-400" />
          </button>
        </div>

        <div className="flex flex-col gap-3 mb-5">
          {field(`${RECEIVABLE_FORM_COPY.customer} *`, errors.customer, (
            <select value={customer} onChange={(e) => setCustomer(e.target.value)} className={inputClass(errors.customer)}>
              <option value="">{RECEIVABLE_FORM_COPY.selectCustomer}</option>
              {customerNames.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          ))}

          {field(`${RECEIVABLE_FORM_COPY.invoiceNumber} *`, errors.invoiceNumber, (
            <input
              type="text"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              className={inputClass(errors.invoiceNumber)}
            />
          ))}

          {field(`${RECEIVABLE_FORM_COPY.amount} *`, errors.amount, (
            <input
              type="number"
              min={0.01}
              step={0.01}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={inputClass(errors.amount)}
            />
          ))}

          {field(`${RECEIVABLE_FORM_COPY.dueDate} *`, errors.dueDate, (
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className={inputClass(errors.dueDate)}
            />
          ))}
        </div>

        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg border border-stone-200 px-4 py-2 text-xs font-semibold text-stone-600"
          >
            {RECEIVABLE_FORM_COPY.cancel}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={saving}
            className="rounded-lg bg-green-800 px-4 py-2 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50"
          >
            {RECEIVABLE_FORM_COPY.save}
          </button>
        </div>
      </div>
    </div>
  );
}

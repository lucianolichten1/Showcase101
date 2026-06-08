import { X, Mail, Phone, MapPin, Building2 } from "lucide-react";
import type { CustomerRecord } from "@/domains/customers/types";
import type { ReceivableRecord } from "@/domains/financial/types";
import { formatCurrency } from "@/data/mockData";
import { cn } from "@/lib/utils";
import { receivableStatusTextClass, riskTextClass } from "@/lib/statusText";

interface Props {
  customer: CustomerRecord | null;
  receivables: ReceivableRecord[];
  onClose: () => void;
}

function getRiskLevel(overdueDays: number, status: string) {
  if (status !== "Overdue") return "Low";
  if (overdueDays > 45) return "High";
  if (overdueDays >= 15) return "Medium";
  return "Low";
}

export function CustomerDetailPanel({ customer, receivables, onClose }: Props) {
  if (!customer) return null;

  const invoices = receivables.filter((r) => r.customer === customer.name);
  const outstanding = invoices
    .filter((r) => r.status !== "Paid")
    .reduce((sum, r) => sum + (r.amount - r.amountPaid), 0);
  const totalInvoiced = invoices.reduce((s, r) => s + r.amount, 0);
  const totalPaid = invoices.reduce((s, r) => s + r.amountPaid, 0);
  const collectionRate = totalInvoiced > 0 ? Math.round((totalPaid / totalInvoiced) * 100) : 0;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Panel */}
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-white border-l border-stone-200 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-stone-100">
          <div>
            <h2 className="text-sm font-bold text-stone-900">{customer.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className={customer.status === "Active" ? "text-xs font-medium text-green-800" : "text-xs font-medium text-stone-600"}>
                {customer.status}
              </span>
              {customer.industry && (
                <span className="text-[10px] text-stone-600">{customer.industry} · {customer.city}</span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600 transition-colors mt-0.5">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Contact info */}
          <div className="p-5 border-b border-stone-100">
            <p className="text-[10px] font-bold uppercase tracking-wider text-green-800 mb-3">Contact</p>
            <div className="flex flex-col gap-2">
              {customer.email && (
                <div className="flex items-center gap-2 text-xs text-stone-600">
                  <Mail size={12} className="text-stone-400 shrink-0" />
                  <a href={`mailto:${customer.email}`} className="hover:text-green-700 transition-colors">{customer.email}</a>
                </div>
              )}
              {customer.phone && (
                <div className="flex items-center gap-2 text-xs text-stone-600">
                  <Phone size={12} className="text-stone-400 shrink-0" />
                  <span>{customer.phone}</span>
                </div>
              )}
              {customer.city && (
                <div className="flex items-center gap-2 text-xs text-stone-600">
                  <MapPin size={12} className="text-stone-400 shrink-0" />
                  <span>{customer.city}, Bolivia</span>
                </div>
              )}
              {customer.industry && (
                <div className="flex items-center gap-2 text-xs text-stone-600">
                  <Building2 size={12} className="text-stone-400 shrink-0" />
                  <span>{customer.industry}</span>
                </div>
              )}
            </div>
          </div>

          {/* Account summary */}
          <div className="p-5 border-b border-stone-100">
            <p className="text-[10px] font-bold uppercase tracking-wider text-green-800 mb-3">Account Summary</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-stone-50 rounded-lg p-3">
                <p className="text-[9px] text-stone-600 font-semibold uppercase tracking-wide">Total Invoiced</p>
                <p className="text-sm font-bold text-stone-900 mt-0.5">{formatCurrency(totalInvoiced)}</p>
              </div>
              <div className="bg-stone-50 rounded-lg p-3">
                <p className="text-[9px] text-stone-600 font-semibold uppercase tracking-wide">Total Paid</p>
                <p className="text-sm font-bold text-green-700 mt-0.5">{totalPaid > 0 ? formatCurrency(totalPaid) : "—"}</p>
              </div>
              <div className="bg-stone-50 rounded-lg p-3">
                <p className="text-[9px] text-stone-600 font-semibold uppercase tracking-wide">Outstanding</p>
                <p className={cn("text-sm font-bold mt-0.5", outstanding > 0 ? "text-stone-900" : "text-green-600")}>
                  {outstanding > 0 ? formatCurrency(outstanding) : "Settled"}
                </p>
              </div>
              <div className="bg-stone-50 rounded-lg p-3">
                <p className="text-[9px] text-stone-600 font-semibold uppercase tracking-wide">Collection Rate</p>
                <p className={cn("text-sm font-bold mt-0.5", collectionRate >= 70 ? "text-green-700" : "text-amber-600")}>
                  {collectionRate}%
                </p>
                <div className="w-full bg-stone-200 rounded-full h-1 mt-1">
                  <div
                    className={cn("h-1 rounded-full", collectionRate >= 70 ? "bg-green-600" : "bg-amber-500")}
                    style={{ width: `${collectionRate}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Invoices */}
          <div className="p-5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-green-800 mb-3">
              Invoices ({invoices.length})
            </p>
            {invoices.length === 0 ? (
              <p className="text-xs text-stone-600 py-4 text-center">No invoices found for this customer.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {invoices.map((inv) => {
                  const balance = inv.amount - inv.amountPaid;
                  const risk = getRiskLevel(inv.overdueDays, inv.status);
                  return (
                    <div key={inv.id} className="rounded-lg border border-stone-100 p-3 flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-stone-500">{inv.invoiceNumber}</span>
                        <div className="flex items-center gap-2 text-[10px]">
                          <span className={riskTextClass(risk)}>{risk}</span>
                          <span className={receivableStatusTextClass(inv.status)}>{inv.status}</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-[10px]">
                        <div>
                          <p className="text-stone-600">Total</p>
                          <p className="font-semibold text-stone-800">{formatCurrency(inv.amount)}</p>
                        </div>
                        <div>
                          <p className="text-stone-600">Paid</p>
                          <p className="font-semibold text-green-700">{inv.amountPaid > 0 ? formatCurrency(inv.amountPaid) : "—"}</p>
                        </div>
                        <div>
                          <p className="text-stone-600">Balance</p>
                          <p className={cn("font-bold", balance > 0 ? "text-stone-900" : "text-green-600")}>
                            {balance > 0 ? formatCurrency(balance) : "Paid"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-stone-400">
                        <span>Due {inv.dueDate}</span>
                        {inv.overdueDays > 0 && (
                          <span className="text-red-600 font-medium">{inv.overdueDays}d overdue</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

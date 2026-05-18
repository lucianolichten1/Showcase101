import { receivables, formatCurrency } from "@/data/mockData";
import { cn } from "@/lib/utils";

function getRiskLevel(overdueDays: number, status: string) {
  if (status !== "Overdue") return "Low";
  if (overdueDays > 45) return "High";
  if (overdueDays >= 15) return "Medium";
  return "Low";
}

function getRiskBadgeClass(risk: string) {
  if (risk === "High") return "bg-red-50 text-red-700 border-red-100";
  if (risk === "Medium") return "bg-amber-50 text-amber-700 border-amber-100";
  return "bg-green-50 text-green-700 border-green-100";
}

function getStatusBadgeClass(status: string) {
  if (status === "Overdue") return "bg-red-50 text-red-700 border-red-100";
  if (status === "Paid") return "bg-green-50 text-green-700 border-green-100";
  if (status === "Partially Paid") return "bg-amber-50 text-amber-700 border-amber-100";
  return "bg-stone-50 text-stone-600 border-stone-200";
}

export function AccountsReceivablePage() {
  const activeReceivables = receivables.filter(
    (r) => r.status === "Pending" || r.status === "Partially Paid" || r.status === "Overdue"
  );
  const totalOutstanding = activeReceivables.reduce((sum, r) => sum + (r.amount - r.amountPaid), 0);
  const overdueRows = receivables.filter((r) => r.status === "Overdue");
  const overdueAmount = overdueRows.reduce((sum, r) => sum + (r.amount - r.amountPaid), 0);
  const invoicesOverdue = overdueRows.length;
  const avgDaysOverdue =
    overdueRows.length > 0
      ? Math.round(overdueRows.reduce((sum, r) => sum + r.overdueDays, 0) / overdueRows.length)
      : 0;

  const agingCurrent = activeReceivables
    .filter((r) => r.overdueDays === 0)
    .reduce((sum, r) => sum + (r.amount - r.amountPaid), 0);
  const aging1to30 = receivables
    .filter((r) => r.overdueDays >= 1 && r.overdueDays <= 30)
    .reduce((sum, r) => sum + (r.amount - r.amountPaid), 0);
  const aging31to60 = receivables
    .filter((r) => r.overdueDays >= 31 && r.overdueDays <= 60)
    .reduce((sum, r) => sum + (r.amount - r.amountPaid), 0);
  const aging60plus = receivables
    .filter((r) => r.overdueDays > 60)
    .reduce((sum, r) => sum + (r.amount - r.amountPaid), 0);

  return (
    <main className="flex flex-col gap-5 p-5 lg:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-stone-900">Accounts Receivable</h1>
          <p className="text-xs text-stone-500 mt-0.5">Outstanding balances and payment status</p>
        </div>
        <button
          type="button"
          className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-700 shadow-sm hover:bg-stone-50 transition-colors"
        >
          Record Payment
        </button>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-3 rounded-xl border border-stone-200 shadow-sm flex flex-col gap-1">
          <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wide">Total Outstanding</span>
          <span className="text-lg font-bold text-stone-900">{formatCurrency(totalOutstanding)}</span>
          <span className="text-[10px] text-stone-400">Pending + Overdue</span>
        </div>
        <div className="bg-white p-3 rounded-xl border border-stone-200 shadow-sm flex flex-col gap-1">
          <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wide">Overdue Amount</span>
          <span className="text-lg font-bold text-red-600">{formatCurrency(overdueAmount)}</span>
          <span className="text-[10px] text-stone-400">Past due date</span>
        </div>
        <div className="bg-white p-3 rounded-xl border border-stone-200 shadow-sm flex flex-col gap-1">
          <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wide">Invoices Overdue</span>
          <span className="text-lg font-bold text-stone-900">{invoicesOverdue}</span>
          <span className="text-[10px] text-stone-400">Customers with late balance</span>
        </div>
        <div className="bg-white p-3 rounded-xl border border-stone-200 shadow-sm flex flex-col gap-1">
          <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wide">Avg Days Overdue</span>
          <span className="text-lg font-bold text-stone-900">{avgDaysOverdue} days</span>
          <span className="text-[10px] text-stone-400">Across overdue invoices</span>
        </div>
      </div>

      {/* Full Receivables Table */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-4 overflow-hidden">
        <h3 className="text-sm font-bold text-stone-800 uppercase tracking-tight mb-3">All Receivables</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="text-[9px] uppercase text-stone-400 font-bold border-b border-stone-100">
              <tr className="h-8">
                <th className="font-bold pr-4">Invoice #</th>
                <th className="font-bold pr-4">Customer</th>
                <th className="font-bold pr-4">Total</th>
                <th className="font-bold pr-4">Paid</th>
                <th className="font-bold pr-4">Balance Due</th>
                <th className="font-bold pr-4">Due Date</th>
                <th className="font-bold pr-4">Days Overdue</th>
                <th className="font-bold pr-4">Status</th>
                <th className="font-bold">Risk</th>
              </tr>
            </thead>
            <tbody className="text-[11px] text-stone-800">
              {receivables.map((row) => {
                const balance = row.amount - row.amountPaid;
                const risk = getRiskLevel(row.overdueDays, row.status);
                return (
                  <tr key={row.id} className="h-10 border-b border-stone-50 last:border-0 hover:bg-stone-50 cursor-pointer transition-colors">
                    <td className="pr-4 font-mono text-stone-500">{row.invoiceNumber}</td>
                    <td className="pr-4 font-medium">{row.customer}</td>
                    <td className="pr-4">{formatCurrency(row.amount)}</td>
                    <td className="pr-4 text-green-700">{row.amountPaid > 0 ? formatCurrency(row.amountPaid) : "—"}</td>
                    <td className="pr-4 font-bold">{balance > 0 ? formatCurrency(balance) : <span className="text-green-600">Paid</span>}</td>
                    <td className="pr-4 text-stone-500">{row.dueDate}</td>
                    <td className="pr-4">
                      {row.overdueDays > 0 ? (
                        <span className="text-red-700 font-medium">{row.overdueDays}d</span>
                      ) : (
                        <span className="text-stone-400">—</span>
                      )}
                    </td>
                    <td className="pr-4">
                      <span className={cn("px-2 py-0.5 text-[9px] font-bold uppercase rounded-full tracking-wider border", getStatusBadgeClass(row.status))}>
                        {row.status}
                      </span>
                    </td>
                    <td>
                      <span className={cn("px-2 py-0.5 text-[9px] font-bold uppercase rounded-full tracking-wider border", getRiskBadgeClass(risk))}>
                        {risk}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Aging Summary */}
      <div>
        <h3 className="text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-2">Aging Summary</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white p-3 rounded-xl border border-stone-200 shadow-sm flex flex-col gap-1">
            <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wide">Current</span>
            <span className="text-base font-bold text-stone-900">{formatCurrency(agingCurrent)}</span>
            <span className="text-[10px] text-stone-400">Not yet overdue</span>
          </div>
          <div className="bg-white p-3 rounded-xl border border-amber-100 shadow-sm flex flex-col gap-1">
            <span className="text-[10px] text-amber-600 font-bold uppercase tracking-wide">1–30 Days</span>
            <span className="text-base font-bold text-stone-900">{formatCurrency(aging1to30)}</span>
            <span className="text-[10px] text-stone-400">Slightly overdue</span>
          </div>
          <div className="bg-white p-3 rounded-xl border border-orange-100 shadow-sm flex flex-col gap-1">
            <span className="text-[10px] text-orange-600 font-bold uppercase tracking-wide">31–60 Days</span>
            <span className="text-base font-bold text-stone-900">{formatCurrency(aging31to60)}</span>
            <span className="text-[10px] text-stone-400">At risk</span>
          </div>
          <div className="bg-white p-3 rounded-xl border border-red-100 shadow-sm flex flex-col gap-1">
            <span className="text-[10px] text-red-600 font-bold uppercase tracking-wide">60+ Days</span>
            <span className="text-base font-bold text-stone-900">{formatCurrency(aging60plus)}</span>
            <span className="text-[10px] text-stone-400">High risk</span>
          </div>
        </div>
      </div>
    </main>
  );
}

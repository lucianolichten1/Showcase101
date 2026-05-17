import { receivables } from "@/data/mockData";
import { cn } from "@/lib/utils";

export function ReceivablesTable() {
  return (
    <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-4 overflow-hidden flex flex-col w-full h-full">
      <h3 className="text-sm font-bold text-stone-800 uppercase tracking-tight mb-3">Accounts Receivable</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="text-[9px] uppercase text-stone-400 font-bold border-b border-stone-100">
            <tr className="h-8">
              <th className="font-bold">Customer</th>
              <th className="font-bold">Amount Due</th>
              <th className="font-bold">Due Date</th>
              <th className="font-bold">Days Overdue</th>
              <th className="font-bold">Status</th>
            </tr>
          </thead>
          <tbody className="text-[11px] text-stone-800">
            {receivables.map((row) => (
              <tr key={row.id} className="h-10 border-b border-stone-50 last:border-0 hover:bg-stone-100 cursor-pointer transition-colors">
                <td className="font-medium">{row.customer}</td>
                <td className="font-bold">Bs {row.amount.toLocaleString()}</td>
                <td>{row.dueDate}</td>
                <td>
                  {row.overdueDays > 0 ? (
                    <span className="text-red-700 font-medium">{row.overdueDays} days</span>
                  ) : (
                    <span className="text-stone-400">Not overdue</span>
                  )}
                </td>
                <td>
                  <span
                    className={cn(
                      "px-2 py-0.5 text-[9px] font-bold uppercase rounded-full tracking-wider border",
                      row.status === "Overdue" ? "bg-red-50 text-red-700 border-red-100" : "bg-stone-50 text-stone-600 border-stone-200"
                    )}
                  >
                    {row.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

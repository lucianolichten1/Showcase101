import { useCompanyScopedFinancialData } from "@/domains/company/useCompanyScopedFinancialData";

function statusTextClass(status: string): string {
  if (status === "Overdue") return "font-semibold text-red-700";
  if (status === "Paid") return "font-medium text-green-800";
  if (status === "Partially Paid") return "font-medium text-amber-800";
  return "font-medium text-stone-600";
}

/** ~48px per row — shows 5 rows then scrolls */
const VISIBLE_ROW_COUNT = 5;
const ROW_SCROLL_MAX_HEIGHT = VISIBLE_ROW_COUNT * 48;

export function ReceivablesTable() {
  const { receivableRecords } = useCompanyScopedFinancialData();
  const hasMore = receivableRecords.length > VISIBLE_ROW_COUNT;

  return (
    <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-4 sm:p-5 overflow-hidden flex flex-col w-full">
      <div className="flex items-baseline justify-between gap-3 mb-4">
        <h3 className="text-sm font-bold text-stone-900 uppercase tracking-tight">
          Accounts Receivable
        </h3>
        {receivableRecords.length > 0 && (
          <span className="text-[10px] font-semibold text-stone-500">
            {receivableRecords.length} invoice{receivableRecords.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>
      <div
        className="overflow-x-auto overflow-y-auto -mx-1 rounded-lg border border-stone-100"
        style={{ maxHeight: ROW_SCROLL_MAX_HEIGHT + 40 }}
      >
        <table className="w-full text-left border-collapse min-w-[640px]">
          <thead className="sticky top-0 z-10">
            <tr className="border-b-2 border-green-800/20 bg-green-50">
              <th className="px-3 py-2.5 text-[10px] uppercase font-bold text-green-900 tracking-wider">
                Customer
              </th>
              <th className="px-3 py-2.5 text-[10px] uppercase font-bold text-green-900 tracking-wider">
                Amount Due
              </th>
              <th className="px-3 py-2.5 text-[10px] uppercase font-bold text-green-900 tracking-wider">
                Due Date
              </th>
              <th className="px-3 py-2.5 text-[10px] uppercase font-bold text-green-900 tracking-wider">
                Days Overdue
              </th>
              <th className="px-3 py-2.5 text-[10px] uppercase font-bold text-green-900 tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="text-xs text-stone-900">
            {receivableRecords.map((row) => (
              <tr
                key={row.id}
                className="border-b border-stone-100 last:border-0 hover:bg-green-50/40 transition-colors"
              >
                <td className="px-3 py-3 font-semibold">{row.customer}</td>
                <td className="px-3 py-3 font-bold text-stone-900">
                  Bs {(row.amount - row.amountPaid).toLocaleString()}
                </td>
                <td className="px-3 py-3 font-medium text-stone-700">{row.dueDate}</td>
                <td className="px-3 py-3">
                  {row.overdueDays > 0 ? (
                    <span className="font-bold text-red-700">{row.overdueDays} days</span>
                  ) : (
                    <span className="font-medium text-green-700">On time</span>
                  )}
                </td>
                <td className="px-3 py-3">
                  <span className={statusTextClass(row.status)}>{row.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {hasMore && (
        <p className="mt-2 text-[10px] font-medium text-stone-500 text-right">
          Scroll to see all {receivableRecords.length} receivables
        </p>
      )}
    </div>
  );
}

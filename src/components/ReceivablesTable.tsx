import { useCompanyScopedFinancialData } from "@/domains/company/useCompanyScopedFinancialData";
import { receivableStatusLabel } from "@/domains/financial/receivables/labels";
import { receivableTableStatusClass } from "@/lib/statusText";
import { cn } from "@/lib/utils";

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
          <span className="text-[10px] font-semibold text-stone-600">
            {receivableRecords.length} invoice{receivableRecords.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>
      <div
        className="overflow-y-auto -mx-1 rounded-lg border border-stone-100"
        style={{ maxHeight: ROW_SCROLL_MAX_HEIGHT + 40 }}
      >
        <table className="w-full table-fixed text-left border-collapse">
          <colgroup>
            <col className="w-[38%]" />
            <col className="w-[22%]" />
            <col className="w-[22%]" />
            <col className="w-[18%]" />
          </colgroup>
          <thead className="sticky top-0 z-10">
            <tr className="border-b-2 border-stone-200 bg-stone-50">
              <th className="px-2 sm:px-3 py-2.5 text-[10px] uppercase font-bold text-stone-800 tracking-wider">
                Customer
              </th>
              <th className="px-2 sm:px-3 py-2.5 text-[10px] uppercase font-bold text-stone-800 tracking-wider text-right">
                Balance
              </th>
              <th className="px-2 sm:px-3 py-2.5 text-[10px] uppercase font-bold text-stone-800 tracking-wider">
                Due
              </th>
              <th className="px-2 sm:px-3 py-2.5 text-[10px] uppercase font-bold text-stone-800 tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="text-xs text-stone-900">
            {receivableRecords.map((row) => (
              <tr
                key={row.id}
                className="border-b border-stone-100 last:border-0 transition-colors hover:bg-stone-50/80"
              >
                <td className="px-2 sm:px-3 py-3 font-semibold truncate">{row.customer}</td>
                <td className="px-2 sm:px-3 py-3 font-bold text-stone-900 text-right tabular-nums">
                  Bs {(row.amount - row.amountPaid).toLocaleString()}
                </td>
                <td className="px-2 sm:px-3 py-3">
                  <div className="font-medium text-stone-900 leading-snug truncate">{row.dueDate}</div>
                </td>
                <td className="px-2 sm:px-3 py-3">
                  <span className={cn(receivableTableStatusClass(row.status), "leading-snug")}>
                    {receivableStatusLabel(row.status)}
                  </span>
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

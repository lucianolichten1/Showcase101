import { formatCurrency } from "@/data/mockData";
import { livestock } from "@/domains/agro/mockData";

export function LivestockTable() {
  return (
    <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-4 overflow-hidden flex flex-col h-full">
      <h3 className="text-sm font-bold text-stone-800 uppercase tracking-tight mb-3">Livestock Management</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="text-[9px] uppercase text-stone-400 font-bold border-b border-stone-100">
            <tr className="h-8">
              <th className="font-bold">Group</th>
              <th className="font-bold">Count</th>
              <th className="font-bold">Feed Cost</th>
              <th className="font-bold">Value</th>
            </tr>
          </thead>
          <tbody className="text-[11px] text-stone-800">
            {livestock.map((row) => (
              <tr key={row.id} className="h-10 border-b border-stone-50 last:border-0 hover:bg-stone-100 cursor-pointer transition-colors">
                <td>{row.group}</td>
                <td>{row.count}</td>
                <td>{formatCurrency(row.feedCostPerMonth)}</td>
                <td className="font-bold">{formatCurrency(row.estimatedValue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import { formatCurrency } from "@/data/mockData";
import { plots } from "@/domains/agro/mockData";

export function CropTable() {
  return (
    <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-4 overflow-hidden flex flex-col h-full">
      <h3 className="text-sm font-bold text-stone-800 uppercase tracking-tight mb-3">Corn Production</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="text-[9px] uppercase text-stone-400 font-bold border-b border-stone-100">
            <tr className="h-8">
              <th className="font-bold">Plot Name</th>
              <th className="font-bold">Hectares</th>
              <th className="font-bold">Crop</th>
              <th className="font-bold">Expected</th>
              <th className="font-bold">Actual</th>
              <th className="font-bold">Profit</th>
              <th className="font-bold">Profit/ha</th>
            </tr>
          </thead>
          <tbody className="text-[11px] text-stone-800">
            {plots.map((row) => (
              <tr key={row.id} className="h-10 border-b border-stone-50 last:border-0 hover:bg-stone-100 cursor-pointer transition-colors">
                <td>{row.name}</td>
                <td>{row.hectares} ha</td>
                <td>{row.crop}</td>
                <td>{row.expectedYield} t</td>
                <td>{row.actualYield} t</td>
                <td className="font-bold">{formatCurrency(row.profit)}</td>
                <td className="font-bold text-stone-500">{formatCurrency(Math.round(row.profit / row.hectares))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

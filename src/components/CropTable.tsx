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
              <th className="font-bold pr-4 whitespace-nowrap">Plot Name</th>
              <th className="font-bold pr-4 whitespace-nowrap">Hectares</th>
              <th className="font-bold pr-4 whitespace-nowrap">Crop</th>
              <th className="font-bold pr-4 whitespace-nowrap">Expected</th>
              <th className="font-bold pr-4 whitespace-nowrap">Actual</th>
              <th className="font-bold pr-4 whitespace-nowrap">Profit</th>
              <th className="font-bold whitespace-nowrap">Profit/ha</th>
            </tr>
          </thead>
          <tbody className="text-[11px] text-stone-800">
            {plots.map((row) => (
              <tr key={row.id} className="h-10 border-b border-stone-50 last:border-0 hover:bg-stone-100 cursor-pointer transition-colors">
                <td className="pr-4 whitespace-nowrap">{row.name}</td>
                <td className="pr-4 whitespace-nowrap">{row.hectares} ha</td>
                <td className="pr-4 whitespace-nowrap">{row.crop}</td>
                <td className="pr-4 whitespace-nowrap">{row.expectedYield} t</td>
                <td className="pr-4 whitespace-nowrap">{row.actualYield} t</td>
                <td className="pr-4 font-bold whitespace-nowrap">{formatCurrency(row.profit)}</td>
                <td className="font-bold text-stone-500 whitespace-nowrap">{formatCurrency(Math.round(row.profit / row.hectares))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

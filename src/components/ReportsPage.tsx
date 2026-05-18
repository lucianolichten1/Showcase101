import { monthlyFinancials, expenseCategories, formatCurrency } from "@/data/mockData";

// Split expense categories into COGS and Operating Expenses
// COGS: direct production costs (Feed, Fertilizer)
// OpEx: everything else (Labor, Transport, Veterinary, Fuel, Maintenance)
const cogsCategories = expenseCategories.filter((e) =>
  ["Feed", "Fertilizer"].includes(e.category)
);
const opexCategories = expenseCategories.filter(
  (e) => !["Feed", "Fertilizer"].includes(e.category)
);

const currentMonth = monthlyFinancials[4]; // May
const totalRevenue = currentMonth.revenue;
const totalCOGS = cogsCategories.reduce((sum, e) => sum + e.amount, 0);
const grossProfit = totalRevenue - totalCOGS;
const totalOpEx = opexCategories.reduce((sum, e) => sum + e.amount, 0);
const netProfit = grossProfit - totalOpEx;
const grossMargin = Math.round((grossProfit / totalRevenue) * 100);
const netMargin = Math.round((netProfit / totalRevenue) * 100);

function PLRow({
  label,
  amount,
  indent = false,
  bold = false,
  positive,
}: {
  label: string;
  amount: number;
  indent?: boolean;
  bold?: boolean;
  positive?: boolean;
}) {
  const amountColor =
    positive === true
      ? "text-green-700"
      : positive === false
        ? "text-red-600"
        : "text-stone-900";

  return (
    <div
      className={`flex items-center justify-between py-2 border-b border-stone-50 last:border-0 ${
        indent ? "pl-4" : ""
      }`}
    >
      <span
        className={`text-sm ${bold ? "font-bold text-stone-900" : "text-stone-600"} ${
          indent ? "text-xs" : ""
        }`}
      >
        {label}
      </span>
      <span className={`text-sm ${bold ? "font-bold" : ""} ${amountColor}`}>
        {formatCurrency(amount)}
      </span>
    </div>
  );
}

function SectionHeader({ label }: { label: string }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mt-4 mb-1">
      {label}
    </p>
  );
}

function Divider() {
  return <div className="border-t-2 border-stone-200 my-2" />;
}

export function ReportsPage() {
  return (
    <main className="flex flex-col gap-5 p-5 lg:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-stone-900">Reports</h1>
          <p className="text-xs text-stone-500 mt-0.5">Financial performance overview</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-500 shadow-sm">
            May 2026
          </span>
          <button
            type="button"
            className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-700 shadow-sm hover:bg-stone-50 transition-colors"
          >
            Export
          </button>
        </div>
      </div>

      {/* KPI Summary Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-3 rounded-xl border border-stone-200 shadow-sm flex flex-col gap-1">
          <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wide">Total Revenue</span>
          <span className="text-lg font-bold text-stone-900">{formatCurrency(totalRevenue)}</span>
          <span className="text-[10px] text-green-600 font-bold">+12% vs Apr</span>
        </div>
        <div className="bg-white p-3 rounded-xl border border-stone-200 shadow-sm flex flex-col gap-1">
          <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wide">Gross Profit</span>
          <span className="text-lg font-bold text-stone-900">{formatCurrency(grossProfit)}</span>
          <span className="text-[10px] text-stone-400 font-medium">{grossMargin}% margin</span>
        </div>
        <div className="bg-white p-3 rounded-xl border border-stone-200 shadow-sm flex flex-col gap-1">
          <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wide">Total Expenses</span>
          <span className="text-lg font-bold text-stone-900">{formatCurrency(currentMonth.expenses)}</span>
          <span className="text-[10px] text-red-500 font-bold">+5% vs Apr</span>
        </div>
        <div className="bg-white p-3 rounded-xl border border-stone-200 shadow-sm flex flex-col gap-1">
          <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wide">Net Profit</span>
          <span className="text-lg font-bold text-green-700">{formatCurrency(netProfit)}</span>
          <span className="text-[10px] text-stone-400 font-medium">{netMargin}% margin</span>
        </div>
      </div>

      {/* P&L Statement */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-stone-800 uppercase tracking-tight">
            Profit & Loss Statement
          </h3>
          <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wide">
            May 2026
          </span>
        </div>

        {/* Revenue */}
        <SectionHeader label="Revenue" />
        <PLRow label="Corn Sales — Plot A" amount={72000} indent />
        <PLRow label="Corn Sales — Plot B" amount={61000} indent />
        <PLRow label="Corn Sales — Plot C" amount={36000} indent />
        <PLRow label="Livestock Sales" amount={16400} indent />
        <Divider />
        <PLRow label="Total Revenue" amount={totalRevenue} bold positive={true} />

        {/* COGS */}
        <SectionHeader label="Cost of Goods Sold (COGS)" />
        {cogsCategories.map((e) => (
          <div key={e.category}><PLRow label={e.category} amount={e.amount} indent /></div>
        ))}
        <Divider />
        <PLRow label="Total COGS" amount={totalCOGS} bold />

        {/* Gross Profit */}
        <div className="flex items-center justify-between py-3 mt-1 bg-stone-50 rounded-lg px-3 mb-2">
          <span className="text-sm font-bold text-stone-900">Gross Profit</span>
          <div className="text-right">
            <span className="text-sm font-bold text-green-700">{formatCurrency(grossProfit)}</span>
            <span className="ml-2 text-[10px] text-stone-400">{grossMargin}% margin</span>
          </div>
        </div>

        {/* Operating Expenses */}
        <SectionHeader label="Operating Expenses" />
        {opexCategories.map((e) => (
          <div key={e.category}><PLRow label={e.category} amount={e.amount} indent /></div>
        ))}
        <Divider />
        <PLRow label="Total Operating Expenses" amount={totalOpEx} bold />

        {/* Net Profit */}
        <div className="flex items-center justify-between py-3 mt-2 bg-green-50 rounded-lg px-3 border border-green-100">
          <span className="text-sm font-bold text-green-900">Net Profit</span>
          <div className="text-right">
            <span className="text-sm font-bold text-green-700">{formatCurrency(netProfit)}</span>
            <span className="ml-2 text-[10px] text-stone-400">{netMargin}% margin</span>
          </div>
        </div>

        {/* AI explanation placeholder */}
        <div className="mt-4 rounded-lg bg-stone-50 border border-stone-100 px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">
            AI Insight — coming soon
          </p>
          <p className="text-xs text-stone-500 leading-relaxed">
            Net profit of {formatCurrency(netProfit)} represents a {netMargin}% margin this month.
            Feed and fertilizer costs account for the largest share of COGS at{" "}
            {formatCurrency(totalCOGS)}.
          </p>
        </div>
      </div>

      {/* Monthly Trend Table */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-4">
        <h3 className="text-sm font-bold text-stone-800 uppercase tracking-tight mb-3">
          Monthly Trend
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="text-[9px] uppercase text-stone-400 font-bold border-b border-stone-100">
              <tr className="h-8">
                <th className="font-bold pr-6">Month</th>
                <th className="font-bold pr-6">Revenue</th>
                <th className="font-bold pr-6">Expenses</th>
                <th className="font-bold pr-6">Net Profit</th>
                <th className="font-bold">Margin</th>
              </tr>
            </thead>
            <tbody className="text-[11px] text-stone-800">
              {monthlyFinancials.map((row) => {
                const margin = Math.round((row.profit / row.revenue) * 100);
                const isCurrent = row.month === "May";
                return (
                  <tr
                    key={row.month}
                    className={`h-10 border-b border-stone-50 last:border-0 transition-colors ${
                      isCurrent ? "bg-green-50" : "hover:bg-stone-50"
                    }`}
                  >
                    <td className={`pr-6 font-semibold ${isCurrent ? "text-green-800" : ""}`}>
                      {row.month} {isCurrent && <span className="text-[9px] text-green-600 font-bold ml-1">← current</span>}
                    </td>
                    <td className="pr-6">{formatCurrency(row.revenue)}</td>
                    <td className="pr-6">{formatCurrency(row.expenses)}</td>
                    <td className={`pr-6 font-bold ${row.profit > 0 ? "text-green-700" : "text-red-600"}`}>
                      {formatCurrency(row.profit)}
                    </td>
                    <td className="text-stone-500">{margin}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}

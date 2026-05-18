import { customers, receivables, formatCurrency } from "@/data/mockData";
import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";

const customerAiInsights = [
  {
    type: "Opportunity",
    text: "Finca El Palmar has partially paid 2 invoices on time. High potential for upsell — consider offering a larger crop cycle contract next season.",
  },
  {
    type: "Risk",
    text: "Exportadora Oriente is 45 days overdue with no payment activity. Recommend a direct follow-up call before escalating to collections.",
  },
  {
    type: "Opportunity",
    text: "Agro Bolivia SRL has a perfect payment record. They are your most reliable customer — prioritize relationship and offer early access to new services.",
  },
  {
    type: "Watch",
    text: "Cooperativa Yungas is currently inactive. Their last payment was partial. A re-engagement offer or discount could recover this account.",
  },
];

// Calculate outstanding balance per customer from receivables
function getOutstandingBalance(customerName: string): number {
  return receivables
    .filter((r) => r.customer === customerName && r.status !== "Paid")
    .reduce((sum, r) => sum + (r.amount - r.amountPaid), 0);
}

// Calculate risk level from receivables overdue days
function getCustomerRisk(customerName: string): "Low" | "Medium" | "High" {
  const overdueReceivable = receivables
    .filter((r) => r.customer === customerName && r.status === "Overdue")
    .sort((a, b) => b.overdueDays - a.overdueDays)[0];

  if (!overdueReceivable) return "Low";
  if (overdueReceivable.overdueDays > 45) return "High";
  if (overdueReceivable.overdueDays >= 15) return "Medium";
  return "Low";
}

function getRiskBadgeClass(risk: string) {
  if (risk === "High") return "bg-red-50 text-red-700 border-red-100";
  if (risk === "Medium") return "bg-amber-50 text-amber-700 border-amber-100";
  return "bg-green-50 text-green-700 border-green-100";
}

const totalCustomers = customers.length;
const activeCustomers = customers.filter((c) => c.status === "Active").length;
const totalOutstanding = customers.reduce(
  (sum, c) => sum + getOutstandingBalance(c.name),
  0
);
const atRiskCount = customers.filter(
  (c) => getCustomerRisk(c.name) === "High"
).length;

export function CustomersPage() {
  return (
    <main className="flex flex-col gap-5 p-5 lg:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-stone-900">Customers</h1>
          <p className="text-xs text-stone-500 mt-0.5">All customers and their account status</p>
        </div>
        <button
          type="button"
          className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-700 shadow-sm hover:bg-stone-50 transition-colors"
        >
          Add Customer
        </button>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-3 rounded-xl border border-stone-200 shadow-sm flex flex-col gap-1">
          <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wide">Total Customers</span>
          <span className="text-lg font-bold text-stone-900">{totalCustomers}</span>
          <span className="text-[10px] text-stone-400">All time</span>
        </div>
        <div className="bg-white p-3 rounded-xl border border-stone-200 shadow-sm flex flex-col gap-1">
          <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wide">Active</span>
          <span className="text-lg font-bold text-stone-900">{activeCustomers}</span>
          <span className="text-[10px] text-green-600 font-bold">Currently buying</span>
        </div>
        <div className="bg-white p-3 rounded-xl border border-stone-200 shadow-sm flex flex-col gap-1">
          <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wide">Total Outstanding</span>
          <span className="text-lg font-bold text-stone-900">{formatCurrency(totalOutstanding)}</span>
          <span className="text-[10px] text-stone-400">Unpaid balances</span>
        </div>
        <div className="bg-white p-3 rounded-xl border border-stone-200 shadow-sm flex flex-col gap-1">
          <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wide">At Risk</span>
          <span className="text-lg font-bold text-red-600">{atRiskCount}</span>
          <span className="text-[10px] text-stone-400">High overdue risk</span>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-4 overflow-hidden">
        <h3 className="text-sm font-bold text-stone-800 uppercase tracking-tight mb-3">All Customers</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="text-[9px] uppercase text-stone-400 font-bold border-b border-stone-100">
              <tr className="h-8">
                <th className="font-bold pr-4">Customer</th>
                <th className="font-bold pr-4">City</th>
                <th className="font-bold pr-4">Industry</th>
                <th className="font-bold pr-4">Contact</th>
                <th className="font-bold pr-4">Total Invoiced</th>
                <th className="font-bold pr-4">Total Paid</th>
                <th className="font-bold pr-4">Outstanding</th>
                <th className="font-bold pr-4">Status</th>
                <th className="font-bold">Risk</th>
              </tr>
            </thead>
            <tbody className="text-[11px] text-stone-800">
              {customers.map((c) => {
                const outstanding = getOutstandingBalance(c.name);
                const risk = getCustomerRisk(c.name);
                return (
                  <tr
                    key={c.id}
                    className="h-11 border-b border-stone-50 last:border-0 hover:bg-stone-50 cursor-pointer transition-colors"
                  >
                    <td className="pr-4">
                      <div className="font-semibold text-stone-900">{c.name}</div>
                      <div className="text-[10px] text-stone-400">{c.email}</div>
                    </td>
                    <td className="pr-4 text-stone-600">{c.city}</td>
                    <td className="pr-4 text-stone-600">{c.industry}</td>
                    <td className="pr-4 text-stone-500 font-mono text-[10px]">{c.phone}</td>
                    <td className="pr-4 font-medium">{formatCurrency(c.totalInvoiced)}</td>
                    <td className="pr-4 text-green-700">
                      {c.totalPaid > 0 ? formatCurrency(c.totalPaid) : "—"}
                    </td>
                    <td className="pr-4 font-bold">
                      {outstanding > 0 ? (
                        formatCurrency(outstanding)
                      ) : (
                        <span className="text-green-600 font-medium">Settled</span>
                      )}
                    </td>
                    <td className="pr-4">
                      <span
                        className={cn(
                          "px-2 py-0.5 text-[9px] font-bold uppercase rounded-full tracking-wider border",
                          c.status === "Active"
                            ? "bg-green-50 text-green-700 border-green-100"
                            : "bg-stone-50 text-stone-500 border-stone-200"
                        )}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td>
                      <span
                        className={cn(
                          "px-2 py-0.5 text-[9px] font-bold uppercase rounded-full tracking-wider border",
                          getRiskBadgeClass(risk)
                        )}
                      >
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

      {/* Industry Breakdown */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-4">
        <h3 className="text-sm font-bold text-stone-800 uppercase tracking-tight mb-3">By Industry</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from(new Set(customers.map((c) => c.industry))).map((industry) => {
            const count = customers.filter((c) => c.industry === industry).length;
            const total = customers
              .filter((c) => c.industry === industry)
              .reduce((sum, c) => sum + c.totalInvoiced, 0);
            return (
              <div key={industry} className="rounded-lg border border-stone-100 bg-stone-50 p-3 flex flex-col gap-1">
                <span className="text-[10px] font-bold uppercase tracking-wide text-stone-500">{industry}</span>
                <span className="text-sm font-bold text-stone-900">{count} customer{count > 1 ? "s" : ""}</span>
                <span className="text-[10px] text-stone-400">{formatCurrency(total)} invoiced</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* AI Customer Insights */}
      <div className="bg-green-800 text-white rounded-xl shadow-lg p-5 relative overflow-hidden">
        <div className="absolute top-[-20px] right-[-20px] w-48 h-48 bg-green-700/30 rounded-full blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-green-300" />
            <h3 className="text-sm font-bold uppercase tracking-widest">AI Customer Insights</h3>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {customerAiInsights.map((insight, idx) => (
              <div key={idx} className="p-3 bg-white/10 rounded-lg border border-white/10 flex flex-col gap-1.5">
                <span
                  className={cn(
                    "text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full self-start border",
                    insight.type === "Opportunity" && "bg-green-600/40 text-green-200 border-green-500/30",
                    insight.type === "Risk" && "bg-red-500/30 text-red-200 border-red-400/30",
                    insight.type === "Watch" && "bg-amber-500/30 text-amber-200 border-amber-400/30",
                  )}
                >
                  {insight.type}
                </span>
                <p className="text-xs leading-relaxed font-medium text-white/90">{insight.text}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-white/10 text-[10px] uppercase font-bold tracking-tighter opacity-60">
            AI insights are static demo data — live analysis coming in Phase 2
          </div>
        </div>
      </div>
    </main>
  );
}

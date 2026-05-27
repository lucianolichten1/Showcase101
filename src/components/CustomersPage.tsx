import { useState, useMemo } from "react";
import { Search, ArrowUp, ArrowDown, ArrowUpDown, Plus, Download, Sparkles } from "lucide-react";
import type { CustomerRecord } from "@/domains/customers/types";
import type { ReceivableRecord } from "@/domains/financial/types";
import { useCompanyScopedFinancialData } from "@/domains/company/useCompanyScopedFinancialData";
import { formatCurrency } from "@/data/mockData";
import { cn } from "@/lib/utils";
import { AddCustomerDialog } from "./AddCustomerDialog";
import { CustomerDetailPanel } from "./CustomerDetailPanel";
import { rowsToCsv, downloadCsvFile } from "@/lib/csv";
import { CompanyContextBanner } from "@/components/company/CompanyContextBanner";

// ─── Types ────────────────────────────────────────────────────────────────────

type SortKey = "name" | "invoiced" | "paid" | "outstanding" | "risk";
type RiskLevel = "Low" | "Medium" | "High";

interface Props {
  onAddCustomer?: (c: CustomerRecord) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const RISK_ORDER: Record<RiskLevel, number> = { Low: 0, Medium: 1, High: 2 };

function getOutstandingBalance(customerName: string, receivables: ReceivableRecord[]): number {
  return receivables
    .filter((r) => r.customer === customerName && r.status !== "Paid")
    .reduce((sum, r) => sum + (r.amount - r.amountPaid), 0);
}

function getCustomerRisk(customerName: string, receivables: ReceivableRecord[]): RiskLevel {
  const worst = receivables
    .filter((r) => r.customer === customerName && r.status === "Overdue")
    .sort((a, b) => b.overdueDays - a.overdueDays)[0];
  if (!worst) return "Low";
  if (worst.overdueDays > 45) return "High";
  if (worst.overdueDays >= 15) return "Medium";
  return "Low";
}

function getRiskBadgeClass(risk: RiskLevel) {
  if (risk === "High") return "bg-red-50 text-red-700 border-red-100";
  if (risk === "Medium") return "bg-amber-50 text-amber-700 border-amber-100";
  return "bg-green-50 text-green-700 border-green-100";
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FilterChip({
  label, active, onClick,
  color = "stone",
}: {
  label: string; active: boolean; onClick: () => void; color?: "stone" | "red" | "amber" | "green";
}) {
  const activeColors: Record<string, string> = {
    stone: "bg-stone-800 text-white border-stone-800",
    red: "bg-red-600 text-white border-red-600",
    amber: "bg-amber-500 text-white border-amber-500",
    green: "bg-green-700 text-white border-green-700",
  };
  return (
    <button onClick={onClick} className={cn(
      "px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full border transition-colors",
      active ? activeColors[color] : "bg-white text-stone-500 border-stone-200 hover:border-stone-400 hover:text-stone-700"
    )}>
      {label}
    </button>
  );
}

function SortIcon({ colKey, sortKey, sortDir }: { colKey: SortKey; sortKey: SortKey | null; sortDir: "asc" | "desc" }) {
  if (sortKey !== colKey) return <ArrowUpDown size={10} className="inline ml-1 text-stone-300" />;
  return sortDir === "asc"
    ? <ArrowUp size={10} className="inline ml-1 text-green-700" />
    : <ArrowDown size={10} className="inline ml-1 text-green-700" />;
}

const customerAiInsights = [
  { type: "Opportunity", text: "Customers with consistent partial payments show buying intent. Consider offering flexible payment plans to convert them to full payers." },
  { type: "Risk", text: "Customers overdue by 45+ days with no payment activity are high collection risk. Prioritize direct outreach before escalating." },
  { type: "Opportunity", text: "Your highest-paying customers deserve priority service. Nurture these relationships with early access to new offerings and dedicated support." },
  { type: "Watch", text: "Inactive customers who made partial payments may respond to re-engagement offers or targeted discounts. Review their history before reaching out." },
];

// ─── Main component ───────────────────────────────────────────────────────────

export function CustomersPage({ onAddCustomer: onAddCustomerProp }: Props = {}) {
  const {
    customerRecords: customers,
    receivableRecords: receivables,
    setCustomerRecords,
  } = useCompanyScopedFinancialData();

  const onAddCustomer =
    onAddCustomerProp ??
    ((customer: CustomerRecord) => setCustomerRecords((prev) => [...prev, customer]));
  // Filter state
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [industryFilter, setIndustryFilter] = useState<string>("");
  const [riskFilter, setRiskFilter] = useState<string>("");
  const [cityFilter, setCityFilter] = useState<string>("");

  // Sort state
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  // Dialog / panel state
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRecord | null>(null);

  // ── KPIs (full unfiltered) ───────────────────────────────────────────────────

  const totalCustomers = customers.length;
  const activeCustomers = customers.filter((c) => c.status === "Active").length;
  const totalOutstanding = customers.reduce((sum, c) => sum + getOutstandingBalance(c.name, receivables), 0);
  const atRiskCount = customers.filter((c) => getCustomerRisk(c.name, receivables) === "High").length;

  // ── Unique filter values ─────────────────────────────────────────────────────

  const industries = useMemo(() => Array.from(new Set(customers.map((c) => c.industry).filter(Boolean))).sort(), [customers]);
  const cities = useMemo(() => Array.from(new Set(customers.map((c) => c.city).filter(Boolean))).sort(), [customers]);

  // ── Filtered + sorted rows ───────────────────────────────────────────────────

  const displayed = useMemo(() => {
    let list = customers.map((c) => ({
      ...c,
      outstanding: getOutstandingBalance(c.name, receivables),
      risk: getCustomerRisk(c.name, receivables),
      // Compute from live receivable records — not stored on customer
      totalInvoiced: receivables.filter((r) => r.customer === c.name).reduce((s, r) => s + r.amount, 0),
      totalPaid: receivables.filter((r) => r.customer === c.name).reduce((s, r) => s + r.amountPaid, 0),
    }));

    if (search.trim())
      list = list.filter((c) => c.name.toLowerCase().includes(search.trim().toLowerCase()));
    if (statusFilter)
      list = list.filter((c) => c.status === statusFilter);
    if (industryFilter)
      list = list.filter((c) => c.industry === industryFilter);
    if (riskFilter)
      list = list.filter((c) => c.risk === riskFilter);
    if (cityFilter)
      list = list.filter((c) => c.city === cityFilter);

    if (sortKey) {
      list.sort((a, b) => {
        let av: number | string = 0;
        let bv: number | string = 0;
        if (sortKey === "name") { av = a.name; bv = b.name; }
        else if (sortKey === "invoiced") { av = a.totalInvoiced; bv = b.totalInvoiced; }
        else if (sortKey === "paid") { av = a.totalPaid; bv = b.totalPaid; }
        else if (sortKey === "outstanding") { av = a.outstanding; bv = b.outstanding; }
        else if (sortKey === "risk") { av = RISK_ORDER[a.risk]; bv = RISK_ORDER[b.risk]; }
        if (av < bv) return sortDir === "asc" ? -1 : 1;
        if (av > bv) return sortDir === "asc" ? 1 : -1;
        return 0;
      });
    }

    return list;
  }, [customers, receivables, search, statusFilter, industryFilter, riskFilter, cityFilter, sortKey, sortDir]);

  // Industry breakdown (always full list, not filtered)
  const industryBreakdown = useMemo(() =>
    Array.from(new Set(customers.map((c) => c.industry))).map((ind) => ({
      industry: ind,
      count: customers.filter((c) => c.industry === ind).length,
      total: customers.filter((c) => c.industry === ind).reduce((s, c) => s + receivables.filter((r) => r.customer === c.name).reduce((rs, r) => rs + r.amount, 0), 0),
    })), [customers, receivables]);

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  };

  const handleAddCustomer = (c: CustomerRecord) => {
    onAddCustomer(c);
    setShowAddCustomer(false);
  };

  const handleExportCsv = () => {
    const headers = ["Customer", "Email", "Phone", "City", "Industry", "Status", "Total Invoiced", "Total Paid", "Outstanding", "Risk"];
    const rows = displayed.map((c) => ({
      "Customer": c.name,
      "Email": c.email,
      "Phone": c.phone,
      "City": c.city,
      "Industry": c.industry,
      "Status": c.status,
      "Total Invoiced": c.totalInvoiced.toString(),
      "Total Paid": c.totalPaid.toString(),
      "Outstanding": c.outstanding.toString(),
      "Risk": c.risk,
    }));
    downloadCsvFile(rowsToCsv(headers, rows), "customers.csv");
  };

  const nextId = customers.length > 0 ? Math.max(...customers.map((c) => c.id)) + 1 : 1;

  const activeFiltersCount = [search, statusFilter, industryFilter, riskFilter, cityFilter].filter(Boolean).length;

  const clearAll = () => {
    setSearch(""); setStatusFilter(""); setIndustryFilter("");
    setRiskFilter(""); setCityFilter("");
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <>
      <main className="flex flex-col gap-5 p-5 lg:p-6">
        <CompanyContextBanner />
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-stone-900">Customers</h1>
            <p className="text-xs text-stone-500 mt-0.5">All customers and their account status</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleExportCsv}
              className="flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-600 shadow-sm hover:bg-stone-50 transition-colors">
              <Download size={13} />
              Export
            </button>
            <button onClick={() => setShowAddCustomer(true)}
              className="flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-700 shadow-sm hover:bg-stone-50 transition-colors">
              <Plus size={13} />
              Add Customer
            </button>
          </div>
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

        {/* Filters + Table */}
        <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-4 overflow-hidden">
          <div className="flex flex-col gap-3 mb-4">
            {/* Search */}
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                placeholder="Search by customer name…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-stone-200 bg-stone-50 pl-8 pr-3 py-2 text-xs text-stone-900 outline-none focus:border-green-700 focus:bg-white transition-colors placeholder:text-stone-400"
              />
            </div>

            {/* Status chips */}
            <div className="flex flex-wrap gap-1.5 items-center">
              <span className="text-[9px] font-bold uppercase tracking-wider text-stone-400 mr-1">Status</span>
              <FilterChip label="All" active={!statusFilter} onClick={() => setStatusFilter("")} />
              <FilterChip label="Active" active={statusFilter === "Active"} onClick={() => setStatusFilter(statusFilter === "Active" ? "" : "Active")} color="green" />
              <FilterChip label="Inactive" active={statusFilter === "Inactive"} onClick={() => setStatusFilter(statusFilter === "Inactive" ? "" : "Inactive")} color="stone" />
            </div>

            {/* Risk chips */}
            <div className="flex flex-wrap gap-1.5 items-center">
              <span className="text-[9px] font-bold uppercase tracking-wider text-stone-400 mr-1">Risk</span>
              <FilterChip label="All" active={!riskFilter} onClick={() => setRiskFilter("")} />
              <FilterChip label="Low" active={riskFilter === "Low"} onClick={() => setRiskFilter(riskFilter === "Low" ? "" : "Low")} color="green" />
              <FilterChip label="Medium" active={riskFilter === "Medium"} onClick={() => setRiskFilter(riskFilter === "Medium" ? "" : "Medium")} color="amber" />
              <FilterChip label="High" active={riskFilter === "High"} onClick={() => setRiskFilter(riskFilter === "High" ? "" : "High")} color="red" />
            </div>

            {/* Industry + City dropdowns */}
            <div className="flex gap-2">
              <select
                value={industryFilter}
                onChange={(e) => setIndustryFilter(e.target.value)}
                className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs text-stone-700 outline-none focus:border-green-700 transition-colors"
              >
                <option value="">All Industries</option>
                {industries.map((i) => <option key={i} value={i}>{i}</option>)}
              </select>
              <select
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs text-stone-700 outline-none focus:border-green-700 transition-colors"
              >
                <option value="">All Cities</option>
                {cities.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              {activeFiltersCount > 0 && (
                <button onClick={clearAll}
                  className="text-[10px] font-semibold text-stone-400 hover:text-red-600 transition-colors ml-1">
                  Clear all ({activeFiltersCount})
                </button>
              )}
            </div>
          </div>

          {/* Results count */}
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-stone-800 uppercase tracking-tight">All Customers</h3>
            <span className="text-[10px] text-stone-400">{displayed.length} of {customers.length} customers</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="text-[9px] uppercase text-stone-400 font-bold border-b border-stone-100">
                <tr className="h-8">
                  <th className="font-bold pr-4 cursor-pointer hover:text-stone-600 select-none" onClick={() => handleSort("name")}>
                    Customer <SortIcon colKey="name" sortKey={sortKey} sortDir={sortDir} />
                  </th>
                  <th className="font-bold pr-4">City</th>
                  <th className="font-bold pr-4">Industry</th>
                  <th className="font-bold pr-4">Contact</th>
                  <th className="font-bold pr-4 cursor-pointer hover:text-stone-600 select-none" onClick={() => handleSort("invoiced")}>
                    Total Invoiced <SortIcon colKey="invoiced" sortKey={sortKey} sortDir={sortDir} />
                  </th>
                  <th className="font-bold pr-4 cursor-pointer hover:text-stone-600 select-none" onClick={() => handleSort("paid")}>
                    Total Paid <SortIcon colKey="paid" sortKey={sortKey} sortDir={sortDir} />
                  </th>
                  <th className="font-bold pr-4 cursor-pointer hover:text-stone-600 select-none" onClick={() => handleSort("outstanding")}>
                    Outstanding <SortIcon colKey="outstanding" sortKey={sortKey} sortDir={sortDir} />
                  </th>
                  <th className="font-bold pr-4">Status</th>
                  <th className="font-bold cursor-pointer hover:text-stone-600 select-none" onClick={() => handleSort("risk")}>
                    Risk <SortIcon colKey="risk" sortKey={sortKey} sortDir={sortDir} />
                  </th>
                </tr>
              </thead>
              <tbody className="text-[11px] text-stone-800">
                {displayed.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-xs text-stone-400">
                      No customers match your filters.
                    </td>
                  </tr>
                ) : (
                  displayed.map((c) => (
                    <tr
                      key={c.id}
                      onClick={() => setSelectedCustomer(selectedCustomer?.id === c.id ? null : c)}
                      className={cn(
                        "h-11 border-b border-stone-50 last:border-0 cursor-pointer transition-colors",
                        selectedCustomer?.id === c.id
                          ? "bg-green-50 hover:bg-green-50"
                          : "hover:bg-stone-50"
                      )}
                    >
                      <td className="pr-4">
                        <div className="font-semibold text-stone-900">{c.name}</div>
                        <div className="text-[10px] text-stone-400">{c.email}</div>
                      </td>
                      <td className="pr-4 text-stone-600">{c.city || "—"}</td>
                      <td className="pr-4 text-stone-600">{c.industry || "—"}</td>
                      <td className="pr-4 text-stone-500 font-mono text-[10px]">{c.phone || "—"}</td>
                      <td className="pr-4 font-medium">{formatCurrency(c.totalInvoiced)}</td>
                      <td className="pr-4 text-green-700">
                        {c.totalPaid > 0 ? formatCurrency(c.totalPaid) : "—"}
                      </td>
                      <td className="pr-4 font-bold">
                        {c.outstanding > 0
                          ? formatCurrency(c.outstanding)
                          : <span className="text-green-600 font-medium">Settled</span>}
                      </td>
                      <td className="pr-4">
                        <span className={cn(
                          "px-2 py-0.5 text-[9px] font-bold uppercase rounded-full tracking-wider border",
                          c.status === "Active"
                            ? "bg-green-50 text-green-700 border-green-100"
                            : "bg-stone-50 text-stone-500 border-stone-200"
                        )}>
                          {c.status}
                        </span>
                      </td>
                      <td>
                        <span className={cn("px-2 py-0.5 text-[9px] font-bold uppercase rounded-full tracking-wider border", getRiskBadgeClass(c.risk))}>
                          {c.risk}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Industry Breakdown */}
        <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-4">
          <h3 className="text-sm font-bold text-stone-800 uppercase tracking-tight mb-3">By Industry</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {industryBreakdown.map(({ industry, count, total }) => (
              <div key={industry} className="rounded-lg border border-stone-100 bg-stone-50 p-3 flex flex-col gap-1">
                <span className="text-[10px] font-bold uppercase tracking-wide text-stone-500">{industry}</span>
                <span className="text-sm font-bold text-stone-900">{count} customer{count > 1 ? "s" : ""}</span>
                <span className="text-[10px] text-stone-400">{formatCurrency(total)} invoiced</span>
              </div>
            ))}
          </div>
        </div>

        {/* AI Insights */}
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
                  <span className={cn(
                    "text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full self-start border",
                    insight.type === "Opportunity" && "bg-green-600/40 text-green-200 border-green-500/30",
                    insight.type === "Risk" && "bg-red-500/30 text-red-200 border-red-400/30",
                    insight.type === "Watch" && "bg-amber-500/30 text-amber-200 border-amber-400/30",
                  )}>
                    {insight.type}
                  </span>
                  <p className="text-xs leading-relaxed font-medium text-white/90">{insight.text}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-white/10 text-[10px] uppercase font-bold tracking-tighter opacity-60">
              AI insights are static demo data — live analysis coming in Phase 3
            </div>
          </div>
        </div>
      </main>

      {/* Dialogs & Panels */}
      <AddCustomerDialog
        open={showAddCustomer}
        nextId={nextId}
        onClose={() => setShowAddCustomer(false)}
        onConfirm={handleAddCustomer}
      />
      <CustomerDetailPanel
        customer={selectedCustomer}
        receivables={receivables}
        onClose={() => setSelectedCustomer(null)}
      />
    </>
  );
}

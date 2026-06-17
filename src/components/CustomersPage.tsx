import { useCallback, useState, useMemo } from "react";
import { useOpenCreateFromQuery } from "@/hooks/useOpenCreateFromQuery";
import { Search, ArrowUp, ArrowDown, ArrowUpDown, Plus, Download, Users } from "lucide-react";
import type { CustomerRecord } from "@/domains/customers/types";
import type { ReceivableRecord } from "@/domains/financial/types";
import { useCompanyScopedFinancialData } from "@/domains/company/useCompanyScopedFinancialData";
import { formatCurrency } from "@/data/mockData";
import { cn } from "@/lib/utils";
import { ConfirmDialog } from "./ConfirmDialog";
import { CustomerFormDialog } from "./customers/CustomerFormDialog";
import { CustomerDetailPanel } from "./CustomerDetailPanel";
import { CUSTOMER_PAGE_COPY, CUSTOMER_INDUSTRY_LABELS } from "@/domains/customers/labels";
import { KPICard } from "./KPICard";
import { rowsToCsv, downloadCsvFile } from "@/lib/csv";
import { customerTableStatusClass, riskTableTextClass } from "@/lib/statusText";
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

function customerStatusTextClass(status: string): string {
  return customerTableStatusClass(status);
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
      "px-2.5 py-1 text-[10px] font-semibold rounded-md border transition-colors",
      active ? activeColors[color] : "bg-white text-stone-700 border-stone-200 hover:border-stone-300"
    )}>
      {label}
    </button>
  );
}

function SortIcon({ colKey, sortKey, sortDir }: { colKey: SortKey; sortKey: SortKey | null; sortDir: "asc" | "desc" }) {
  if (sortKey !== colKey) return <ArrowUpDown size={10} className="inline ml-1 text-stone-300" />;
  return sortDir === "asc"
    ? <ArrowUp size={10} className="inline ml-1 text-stone-400" />
    : <ArrowDown size={10} className="inline ml-1 text-stone-400" />;
}

// ─── Main component ───────────────────────────────────────────────────────────

export function CustomersPage({ onAddCustomer: onAddCustomerProp }: Props = {}) {
  const {
    customerRecords: customers,
    receivableRecords: receivables,
    saveCustomer,
    deleteCustomer,
    customersError,
  } = useCompanyScopedFinancialData();
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
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<CustomerRecord | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CustomerRecord | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRecord | null>(null);

  const openAddCustomer = useCallback(() => {
    setEditTarget(null);
    setFormOpen(true);
  }, []);
  useOpenCreateFromQuery("customer", openAddCustomer);

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

  const handleSaveCustomer = async (input: Omit<CustomerRecord, "id">) => {
    setSaving(true);
    try {
      if (onAddCustomerProp && !editTarget) {
        const nextId = customers.length > 0 ? Math.max(...customers.map((c) => c.id)) + 1 : 1;
        onAddCustomerProp({ id: nextId, ...input });
      } else {
        await saveCustomer(editTarget?.id ?? null, input);
      }
      setFormOpen(false);
      setEditTarget(null);
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteCustomer(deleteTarget.id);
      setDeleteTarget(null);
      if (selectedCustomer?.id === deleteTarget.id) setSelectedCustomer(null);
    } finally {
      setDeleting(false);
    }
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

  const activeFiltersCount = [search, statusFilter, industryFilter, riskFilter, cityFilter].filter(Boolean).length;

  const clearAll = () => {
    setSearch(""); setStatusFilter(""); setIndustryFilter("");
    setRiskFilter(""); setCityFilter("");
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <>
      <div className="flex flex-1 flex-col text-[#1C1917] font-sans min-h-0 bg-stone-50/40">
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-10 py-4 sm:py-5 space-y-5">
        {/* Header */}
        <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between rounded-xl border border-stone-200 bg-white shadow-sm px-4 py-3.5 sm:px-5">
          <div>
            <h1 className="text-2xl font-bold text-stone-900 tracking-tight">{CUSTOMER_PAGE_COPY.title}</h1>
            <p className="text-sm text-stone-700 mt-1">{CUSTOMER_PAGE_COPY.subtitle}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={handleExportCsv}
              className="flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-700 shadow-sm hover:bg-stone-50 transition-colors">
              <Download size={13} />
              {CUSTOMER_PAGE_COPY.export}
            </button>
            <button onClick={openAddCustomer}
              className="flex items-center gap-1.5 rounded-lg bg-green-800 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-green-700 transition-colors">
              <Plus size={13} />
              {CUSTOMER_PAGE_COPY.addButton}
            </button>
          </div>
        </section>

        {customersError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-800">
            {customersError}
          </div>
        )}

        {/* KPI Row */}
        <section>
          <div className="mb-2">
            <h2 className="text-[10px] font-bold uppercase tracking-wider text-green-800">{CUSTOMER_PAGE_COPY.overview}</h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
            <KPICard
              title={CUSTOMER_PAGE_COPY.totalCustomers}
              value={String(totalCustomers)}
              trend={0}
              trendText=""
              trendStatus="neutral"
              subtitle={CUSTOMER_PAGE_COPY.allTime}
            />
            <KPICard
              title={CUSTOMER_PAGE_COPY.active}
              value={String(activeCustomers)}
              trend={0}
              trendText={CUSTOMER_PAGE_COPY.currentlyBuying}
              trendStatus="neutral"
            />
            <KPICard
              title={CUSTOMER_PAGE_COPY.totalOutstanding}
              value={formatCurrency(totalOutstanding)}
              trend={0}
              trendText=""
              trendStatus="neutral"
              subtitle={CUSTOMER_PAGE_COPY.unpaidBalances}
            />
            <KPICard
              title={CUSTOMER_PAGE_COPY.atRisk}
              value={String(atRiskCount)}
              trend={0}
              trendText=""
              trendStatus="neutral"
              subtitle={CUSTOMER_PAGE_COPY.highOverdueRisk}
            />
          </div>
        </section>

        {/* Filters + Table */}
        <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-4 overflow-hidden">
          <div className="flex flex-col gap-3 mb-4">
            {/* Search */}
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                placeholder={CUSTOMER_PAGE_COPY.searchPlaceholder}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-stone-200 bg-white pl-8 pr-3 py-2 text-xs text-stone-900 outline-none focus:border-green-700 transition-colors placeholder:text-stone-500"
              />
            </div>

            {/* Status chips */}
            <div className="flex flex-wrap gap-1.5 items-center">
              <span className="text-[10px] font-semibold text-stone-700 mr-1">Status</span>
              <FilterChip label="All" active={!statusFilter} onClick={() => setStatusFilter("")} />
              <FilterChip label="Active" active={statusFilter === "Active"} onClick={() => setStatusFilter(statusFilter === "Active" ? "" : "Active")} color="green" />
              <FilterChip label="Inactive" active={statusFilter === "Inactive"} onClick={() => setStatusFilter(statusFilter === "Inactive" ? "" : "Inactive")} color="stone" />
            </div>

            {/* Risk chips */}
            <div className="flex flex-wrap gap-1.5 items-center">
              <span className="text-[10px] font-semibold text-stone-700 mr-1">Risk</span>
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
                  className="text-[10px] font-semibold text-stone-600 hover:text-red-700 transition-colors ml-1">
                  Clear all ({activeFiltersCount})
                </button>
              )}
            </div>
          </div>

          {/* Results count */}
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-green-800">All Customers</h3>
            <span className="text-[10px] font-medium text-stone-600">{displayed.length} of {customers.length} customers</span>
          </div>

          <div className="overflow-x-auto rounded-lg border border-stone-100">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b-2 border-stone-200 bg-stone-50">
                  <th className="px-3 py-2.5 text-[10px] uppercase font-bold text-stone-800 tracking-wider cursor-pointer select-none" onClick={() => handleSort("name")}>
                    Customer <SortIcon colKey="name" sortKey={sortKey} sortDir={sortDir} />
                  </th>
                  <th className="px-3 py-2.5 text-[10px] uppercase font-bold text-stone-800 tracking-wider">City</th>
                  <th className="px-3 py-2.5 text-[10px] uppercase font-bold text-stone-800 tracking-wider">Industry</th>
                  <th className="px-3 py-2.5 text-[10px] uppercase font-bold text-stone-800 tracking-wider">Contact</th>
                  <th className="px-3 py-2.5 text-[10px] uppercase font-bold text-stone-800 tracking-wider cursor-pointer select-none" onClick={() => handleSort("invoiced")}>
                    Total Invoiced <SortIcon colKey="invoiced" sortKey={sortKey} sortDir={sortDir} />
                  </th>
                  <th className="px-3 py-2.5 text-[10px] uppercase font-bold text-stone-800 tracking-wider cursor-pointer select-none" onClick={() => handleSort("paid")}>
                    Total Paid <SortIcon colKey="paid" sortKey={sortKey} sortDir={sortDir} />
                  </th>
                  <th className="px-3 py-2.5 text-[10px] uppercase font-bold text-stone-800 tracking-wider cursor-pointer select-none" onClick={() => handleSort("outstanding")}>
                    Outstanding <SortIcon colKey="outstanding" sortKey={sortKey} sortDir={sortDir} />
                  </th>
                  <th className="px-3 py-2.5 text-[10px] uppercase font-bold text-stone-800 tracking-wider">Status</th>
                  <th className="px-3 py-2.5 text-[10px] uppercase font-bold text-stone-800 tracking-wider cursor-pointer select-none" onClick={() => handleSort("risk")}>
                    Risk <SortIcon colKey="risk" sortKey={sortKey} sortDir={sortDir} />
                  </th>
                  <th className="px-3 py-2.5 text-[10px] uppercase font-bold text-stone-800 tracking-wider">
                    {CUSTOMER_PAGE_COPY.actions}
                  </th>
                </tr>
              </thead>
              <tbody className="text-xs text-stone-900">
                {displayed.length === 0 ? (
                  <tr>
                    <td colSpan={10}>
                      <div className="flex flex-col items-center gap-2 py-12 text-stone-600">
                        <Users size={32} strokeWidth={1.5} />
                        <p className="text-sm font-medium text-stone-800">No customers found</p>
                        <p className="text-xs text-stone-600 text-center max-w-xs">
                          {customers.length === 0
                            ? "Add your first customer using the button above."
                            : "No customers match your current filters."}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  displayed.map((c) => (
                    <tr
                      key={c.id}
                      onClick={() => setSelectedCustomer(selectedCustomer?.id === c.id ? null : c)}
                      className={cn(
                        "border-b border-stone-100 last:border-0 cursor-pointer transition-colors",
                        selectedCustomer?.id === c.id
                          ? "bg-stone-100/80 hover:bg-stone-100/80"
                          : "hover:bg-stone-50/80"
                      )}
                    >
                      <td className="px-3 py-3">
                        <div className="font-semibold text-stone-900">{c.name}</div>
                        <div className="text-[10px] text-stone-600">{c.email}</div>
                      </td>
                      <td className="px-3 py-3 font-medium text-stone-700">{c.city || "—"}</td>
                      <td className="px-3 py-3 font-medium text-stone-700">{c.industry || "—"}</td>
                      <td className="px-3 py-3 font-mono text-[10px] text-stone-600">{c.phone || "—"}</td>
                      <td className="px-3 py-3 font-semibold">{formatCurrency(c.totalInvoiced)}</td>
                      <td className="px-3 py-3 font-semibold text-stone-900">
                        {c.totalPaid > 0 ? formatCurrency(c.totalPaid) : "—"}
                      </td>
                      <td className="px-3 py-3 font-bold">
                        {c.outstanding > 0
                          ? formatCurrency(c.outstanding)
                          : <span className="text-stone-600 font-medium">Settled</span>}
                      </td>
                      <td className="px-3 py-3">
                        <span className={customerStatusTextClass(c.status)}>{c.status}</span>
                      </td>
                      <td className="px-3 py-3">
                        <span className={riskTableTextClass(c.risk)}>{c.risk}</span>
                      </td>
                      <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex flex-col gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditTarget(c);
                              setFormOpen(true);
                            }}
                            className="text-left text-[10px] font-semibold text-stone-700 hover:text-stone-900"
                          >
                            {CUSTOMER_PAGE_COPY.edit}
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(c)}
                            className="text-left text-[10px] font-semibold text-red-700 hover:text-red-800"
                          >
                            {CUSTOMER_PAGE_COPY.delete}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Industry Breakdown */}
        <section className="bg-white rounded-xl border border-stone-200 shadow-sm p-4 sm:p-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-green-800 mb-4">By Industry</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {industryBreakdown.map(({ industry, count, total }) => (
              <div key={industry} className="rounded-lg border border-stone-200 bg-white p-3 flex flex-col gap-1">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-stone-700">{industry}</span>
                <span className="text-sm font-bold text-stone-900">{count} customer{count > 1 ? "s" : ""}</span>
                <span className="text-[10px] text-stone-600">{formatCurrency(total)} invoiced</span>
              </div>
            ))}
          </div>
        </section>
          </div>
        </div>
      </div>

      {/* Dialogs & Panels */}
      <CustomerFormDialog
        open={formOpen}
        customer={editTarget}
        saving={saving}
        onClose={() => {
          if (!saving) {
            setFormOpen(false);
            setEditTarget(null);
          }
        }}
        onSave={handleSaveCustomer}
      />
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={CUSTOMER_PAGE_COPY.deleteTitle}
        message={deleteTarget ? CUSTOMER_PAGE_COPY.deleteMessage(deleteTarget.name) : ""}
        confirmLabel={CUSTOMER_PAGE_COPY.deleteConfirm}
        cancelLabel="Cancelar"
        destructive
        loading={deleting}
        onConfirm={() => void handleConfirmDelete()}
        onClose={() => !deleting && setDeleteTarget(null)}
      />
      <CustomerDetailPanel
        customer={selectedCustomer}
        receivables={receivables}
        onClose={() => setSelectedCustomer(null)}
      />
    </>
  );
}

import { useState, useMemo } from "react";
import { Search, ArrowUp, ArrowDown, ArrowUpDown, Plus, Download, FileSearch } from "lucide-react";
import type { ReceivableRecord } from "@/domains/financial/types";
import {
  calculateAverageDaysOverdue,
  calculateReceivablesCollectionRate,
  calculateReceivablesInvoicesOverdue,
  calculateReceivablesOverdueAmount,
  calculateReceivablesTotalOutstanding,
  getReceivableBalance,
  isActiveReceivable,
} from "@/domains/financial/calculations";
import { formatCurrency, customers as allCustomers } from "@/data/mockData";
import { cn } from "@/lib/utils";
import { RecordPaymentDialog } from "./RecordPaymentDialog";
import { AddInvoiceDialog } from "./AddInvoiceDialog";
import { rowsToCsv, downloadCsvFile } from "@/lib/csv";

// ─── Types ────────────────────────────────────────────────────────────────────

type SortKey = "customer" | "amount" | "balance" | "overdueDays" | "dueDate";
type RiskLevel = "Low" | "Medium" | "High";

interface Props {
  receivables: ReceivableRecord[];
  onUpdateReceivable: (updated: ReceivableRecord) => void;
  onAddReceivable: (newR: ReceivableRecord) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function getRiskLevel(overdueDays: number, status: string): RiskLevel {
  if (status !== "Overdue") return "Low";
  if (overdueDays > 45) return "High";
  if (overdueDays >= 15) return "Medium";
  return "Low";
}

function parseDueDate(dueDate: string): Date | null {
  const [monthStr, dayStr] = dueDate.split(" ");
  const monthIdx = MONTH_NAMES.indexOf(monthStr);
  const day = parseInt(dayStr, 10);
  if (monthIdx === -1 || isNaN(day)) return null;
  return new Date(2026, monthIdx, day);
}

function getRiskBadgeClass(risk: RiskLevel) {
  if (risk === "High") return "bg-red-50 text-red-700 border-red-100";
  if (risk === "Medium") return "bg-amber-50 text-amber-700 border-amber-100";
  return "bg-green-50 text-green-700 border-green-100";
}

function getStatusBadgeClass(status: string) {
  if (status === "Overdue") return "bg-red-50 text-red-700 border-red-100";
  if (status === "Paid") return "bg-green-50 text-green-700 border-green-100";
  if (status === "Partially Paid") return "bg-amber-50 text-amber-700 border-amber-100";
  return "bg-stone-50 text-stone-600 border-stone-200";
}

function getRowBgClass(risk: RiskLevel) {
  if (risk === "High") return "bg-red-50/50 hover:bg-red-50";
  if (risk === "Medium") return "bg-amber-50/40 hover:bg-amber-50";
  return "hover:bg-stone-50";
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FilterChip({
  label,
  active,
  onClick,
  color = "stone",
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  color?: "stone" | "red" | "amber" | "green" | "blue";
}) {
  const activeColors: Record<string, string> = {
    stone: "bg-stone-800 text-white border-stone-800",
    red: "bg-red-600 text-white border-red-600",
    amber: "bg-amber-500 text-white border-amber-500",
    green: "bg-green-700 text-white border-green-700",
    blue: "bg-blue-600 text-white border-blue-600",
  };
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full border transition-colors",
        active
          ? activeColors[color]
          : "bg-white text-stone-500 border-stone-200 hover:border-stone-400 hover:text-stone-700"
      )}
    >
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

// ─── Main component ───────────────────────────────────────────────────────────

export function AccountsReceivablePage({ receivables, onUpdateReceivable, onAddReceivable }: Props) {
  // Filter state
  const [statusFilters, setStatusFilters] = useState<Set<string>>(new Set());
  const [riskFilters, setRiskFilters] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");

  // Sort state
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  // Dialog state
  const [paymentTarget, setPaymentTarget] = useState<ReceivableRecord | null>(null);
  const [showAddInvoice, setShowAddInvoice] = useState(false);

  // ── KPIs (all receivables; period filter needs ISO due dates) ─

  const activeReceivables = receivables.filter(isActiveReceivable);
  const totalOutstanding = calculateReceivablesTotalOutstanding(receivables);
  const overdueAmount = calculateReceivablesOverdueAmount(receivables);
  const invoicesOverdue = calculateReceivablesInvoicesOverdue(receivables);
  const avgDaysOverdue = calculateAverageDaysOverdue(receivables);
  const collectionRate = calculateReceivablesCollectionRate(receivables);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const in7Days = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  const dueSoon = receivables.filter((r) => {
    if (r.status === "Paid") return false;
    const due = parseDueDate(r.dueDate);
    if (!due) return false;
    return due >= today && due <= in7Days;
  }).length;

  // ── Aging (full receivables) ─────────────────────────────────────────────────

  const agingCurrent = activeReceivables
    .filter((r) => r.overdueDays === 0)
    .reduce((sum, r) => sum + getReceivableBalance(r), 0);
  const aging1to30 = receivables
    .filter((r) => r.overdueDays >= 1 && r.overdueDays <= 30)
    .reduce((sum, r) => sum + getReceivableBalance(r), 0);
  const aging31to60 = receivables
    .filter((r) => r.overdueDays >= 31 && r.overdueDays <= 60)
    .reduce((sum, r) => sum + getReceivableBalance(r), 0);
  const aging60plus = receivables
    .filter((r) => r.overdueDays > 60)
    .reduce((sum, r) => sum + getReceivableBalance(r), 0);

  // ── Filtered + sorted table rows ─────────────────────────────────────────────

  const displayed = useMemo(() => {
    let list = [...receivables];

    if (statusFilters.size > 0)
      list = list.filter((r) => statusFilters.has(r.status));

    if (riskFilters.size > 0)
      list = list.filter((r) => riskFilters.has(getRiskLevel(r.overdueDays, r.status)));

    if (search.trim())
      list = list.filter((r) =>
        r.customer.toLowerCase().includes(search.trim().toLowerCase())
      );

    if (sortKey) {
      list.sort((a, b) => {
        let av: number | string = 0;
        let bv: number | string = 0;
        if (sortKey === "customer") { av = a.customer; bv = b.customer; }
        else if (sortKey === "amount") { av = a.amount; bv = b.amount; }
        else if (sortKey === "balance") { av = a.amount - a.amountPaid; bv = b.amount - b.amountPaid; }
        else if (sortKey === "overdueDays") { av = a.overdueDays; bv = b.overdueDays; }
        else if (sortKey === "dueDate") {
          av = parseDueDate(a.dueDate)?.getTime() ?? 0;
          bv = parseDueDate(b.dueDate)?.getTime() ?? 0;
        }
        if (av < bv) return sortDir === "asc" ? -1 : 1;
        if (av > bv) return sortDir === "asc" ? 1 : -1;
        return 0;
      });
    }

    return list;
  }, [receivables, statusFilters, riskFilters, search, sortKey, sortDir]);

  // Table footer totals
  const footerAmount = displayed.reduce((s, r) => s + r.amount, 0);
  const footerPaid = displayed.reduce((s, r) => s + r.amountPaid, 0);
  const footerBalance = displayed.reduce((s, r) => s + (r.amount - r.amountPaid), 0);

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const toggleStatusFilter = (status: string) => {
    setStatusFilters((prev) => {
      const next = new Set(prev);
      next.has(status) ? next.delete(status) : next.add(status);
      return next;
    });
  };

  const toggleRiskFilter = (risk: string) => {
    setRiskFilters((prev) => {
      const next = new Set(prev);
      next.has(risk) ? next.delete(risk) : next.add(risk);
      return next;
    });
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const handleConfirmPayment = (id: number, payment: number) => {
    const r = receivables.find((x) => x.id === id);
    if (!r) return;
    const newTotalPaid = r.amountPaid + payment;
    const status: ReceivableRecord["status"] =
      newTotalPaid <= 0 ? "Pending"
      : newTotalPaid < r.amount ? "Partially Paid"
      : "Paid";
    onUpdateReceivable({ ...r, amountPaid: newTotalPaid, status });
    setPaymentTarget(null);
  };

  const handleAddInvoice = (newR: ReceivableRecord) => {
    onAddReceivable(newR);
    setShowAddInvoice(false);
  };

  const handleExportCsv = () => {
    const headers = ["Invoice #", "Customer", "Total", "Paid", "Balance Due", "Due Date", "Days Overdue", "Status", "Risk"];
    const rows = displayed.map((r) => ({
      "Invoice #": r.invoiceNumber,
      "Customer": r.customer,
      "Total": r.amount.toString(),
      "Paid": r.amountPaid.toString(),
      "Balance Due": (r.amount - r.amountPaid).toString(),
      "Due Date": r.dueDate,
      "Days Overdue": r.overdueDays.toString(),
      "Status": r.status,
      "Risk": getRiskLevel(r.overdueDays, r.status),
    }));
    downloadCsvFile(rowsToCsv(headers, rows), "accounts-receivable.csv");
  };

  // ── Derived values for AddInvoiceDialog ──────────────────────────────────────

  const nextId = receivables.length > 0 ? Math.max(...receivables.map((r) => r.id)) + 1 : 1;
  const nextInvoiceNumber = `INV-${String(nextId).padStart(3, "0")}`;
  const customerNames = allCustomers.map((c) => c.name);

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <>
      <main className="flex flex-col flex-1 min-h-0 overflow-auto bg-stone-50/30">
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-10 py-6 sm:py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-stone-900 tracking-tight">Accounts Receivable</h1>
            <p className="text-sm text-stone-500 mt-1">
              Outstanding balances and payment status · period filter requires ISO due dates
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-600 shadow-sm hover:bg-stone-50 transition-colors"
            >
              <Download size={13} />
              Export
            </button>
            <button
              onClick={() => setShowAddInvoice(true)}
              className="flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-700 shadow-sm hover:bg-stone-50 transition-colors"
            >
              <Plus size={13} />
              Add Invoice
            </button>
          </div>
        </div>

        {/* KPI Row — 6 cards */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          <div className="bg-white p-3 rounded-xl border border-stone-200 shadow-sm flex flex-col gap-1">
            <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wide">Total Outstanding</span>
            <span className="text-lg font-bold text-stone-900">{formatCurrency(totalOutstanding)}</span>
            <span className="text-[10px] text-stone-400">Outstanding receivables</span>
          </div>
          <div className="bg-white p-3 rounded-xl border border-stone-200 shadow-sm flex flex-col gap-1">
            <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wide">Overdue Amount</span>
            <span className="text-lg font-bold text-red-600">{formatCurrency(overdueAmount)}</span>
            <span className="text-[10px] text-stone-400">Past due date</span>
          </div>
          <div className="bg-white p-3 rounded-xl border border-stone-200 shadow-sm flex flex-col gap-1">
            <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wide">Invoices Overdue</span>
            <span className="text-lg font-bold text-stone-900">{invoicesOverdue}</span>
            <span className="text-[10px] text-stone-400">Customers with late balance</span>
          </div>
          <div className="bg-white p-3 rounded-xl border border-stone-200 shadow-sm flex flex-col gap-1">
            <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wide">Avg Days Overdue</span>
            <span className="text-lg font-bold text-stone-900">{avgDaysOverdue}d</span>
            <span className="text-[10px] text-stone-400">Across overdue invoices</span>
          </div>
          <div className="bg-white p-3 rounded-xl border border-stone-200 shadow-sm flex flex-col gap-1">
            <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wide">Collection Rate</span>
            <span className={cn("text-lg font-bold", collectionRate >= 70 ? "text-green-700" : "text-amber-600")}>
              {collectionRate}%
            </span>
            <div className="w-full bg-stone-100 rounded-full h-1 mt-0.5">
              <div
                className={cn("h-1 rounded-full", collectionRate >= 70 ? "bg-green-600" : "bg-amber-500")}
                style={{ width: `${collectionRate}%` }}
              />
            </div>
          </div>
          <div className="bg-white p-3 rounded-xl border border-stone-200 shadow-sm flex flex-col gap-1">
            <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wide">Due This Week</span>
            <span className={cn("text-lg font-bold", dueSoon > 0 ? "text-amber-600" : "text-stone-900")}>
              {dueSoon}
            </span>
            <span className="text-[10px] text-stone-400">Invoices due in 7 days</span>
          </div>
        </div>

        {/* Filters + Table */}
        <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-4 sm:p-5 overflow-hidden">
          <div className="flex flex-col gap-3 mb-4">
            {/* Search */}
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                placeholder="Search by customer…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-stone-200 bg-stone-50 pl-8 pr-3 py-2 text-xs text-stone-900 outline-none focus:border-green-700 focus:bg-white transition-colors placeholder:text-stone-400"
              />
            </div>

            {/* Status chips */}
            <div className="flex flex-wrap gap-1.5 items-center">
              <span className="text-[9px] font-bold uppercase tracking-wider text-stone-400 mr-1">Status</span>
              <FilterChip label="All" active={statusFilters.size === 0} onClick={() => setStatusFilters(new Set())} />
              <FilterChip label="Pending" active={statusFilters.has("Pending")} onClick={() => toggleStatusFilter("Pending")} color="stone" />
              <FilterChip label="Partially Paid" active={statusFilters.has("Partially Paid")} onClick={() => toggleStatusFilter("Partially Paid")} color="amber" />
              <FilterChip label="Paid" active={statusFilters.has("Paid")} onClick={() => toggleStatusFilter("Paid")} color="green" />
              <FilterChip label="Overdue" active={statusFilters.has("Overdue")} onClick={() => toggleStatusFilter("Overdue")} color="red" />
            </div>

            {/* Risk chips */}
            <div className="flex flex-wrap gap-1.5 items-center">
              <span className="text-[9px] font-bold uppercase tracking-wider text-stone-400 mr-1">Risk</span>
              <FilterChip label="All" active={riskFilters.size === 0} onClick={() => setRiskFilters(new Set())} />
              <FilterChip label="Low" active={riskFilters.has("Low")} onClick={() => toggleRiskFilter("Low")} color="green" />
              <FilterChip label="Medium" active={riskFilters.has("Medium")} onClick={() => toggleRiskFilter("Medium")} color="amber" />
              <FilterChip label="High" active={riskFilters.has("High")} onClick={() => toggleRiskFilter("High")} color="red" />
            </div>
          </div>

          {/* Results count */}
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-stone-800 uppercase tracking-tight">
              All Receivables
            </h3>
            <span className="text-[10px] text-stone-400">
              {displayed.length} of {receivables.length} invoices
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="text-[9px] uppercase text-stone-400 font-bold border-b border-stone-100">
                <tr className="h-8">
                  <th className="font-bold pr-4">Invoice #</th>
                  <th
                    className="font-bold pr-4 cursor-pointer hover:text-stone-600 select-none"
                    onClick={() => handleSort("customer")}
                  >
                    Customer <SortIcon colKey="customer" sortKey={sortKey} sortDir={sortDir} />
                  </th>
                  <th
                    className="font-bold pr-4 cursor-pointer hover:text-stone-600 select-none"
                    onClick={() => handleSort("amount")}
                  >
                    Total <SortIcon colKey="amount" sortKey={sortKey} sortDir={sortDir} />
                  </th>
                  <th className="font-bold pr-4">Paid</th>
                  <th
                    className="font-bold pr-4 cursor-pointer hover:text-stone-600 select-none"
                    onClick={() => handleSort("balance")}
                  >
                    Balance Due <SortIcon colKey="balance" sortKey={sortKey} sortDir={sortDir} />
                  </th>
                  <th
                    className="font-bold pr-4 cursor-pointer hover:text-stone-600 select-none"
                    onClick={() => handleSort("dueDate")}
                  >
                    Due Date <SortIcon colKey="dueDate" sortKey={sortKey} sortDir={sortDir} />
                  </th>
                  <th
                    className="font-bold pr-4 cursor-pointer hover:text-stone-600 select-none"
                    onClick={() => handleSort("overdueDays")}
                  >
                    Days Overdue <SortIcon colKey="overdueDays" sortKey={sortKey} sortDir={sortDir} />
                  </th>
                  <th className="font-bold pr-4">Status</th>
                  <th className="font-bold pr-4">Risk</th>
                  <th className="font-bold" />
                </tr>
              </thead>
              <tbody className="text-[11px] text-stone-800">
                {displayed.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-2 text-stone-400">
                        <FileSearch size={32} strokeWidth={1.5} />
                        <p className="text-sm font-medium">No invoices match your filters</p>
                        <p className="text-xs">Try adjusting the search, status, or risk filters</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  displayed.map((row) => {
                    const balance = row.amount - row.amountPaid;
                    const risk = getRiskLevel(row.overdueDays, row.status);
                    return (
                      <tr
                        key={row.id}
                        className={cn(
                          "h-10 border-b border-stone-50 last:border-0 transition-colors",
                          getRowBgClass(risk)
                        )}
                      >
                        <td className="pr-4 font-mono text-stone-500">{row.invoiceNumber}</td>
                        <td className="pr-4 font-medium">{row.customer}</td>
                        <td className="pr-4">{formatCurrency(row.amount)}</td>
                        <td className="pr-4 text-green-700">
                          {row.amountPaid > 0 ? formatCurrency(row.amountPaid) : "—"}
                        </td>
                        <td className="pr-4 font-bold">
                          {balance > 0 ? formatCurrency(balance) : <span className="text-green-600">Paid</span>}
                        </td>
                        <td className="pr-4 text-stone-500">{row.dueDate}</td>
                        <td className="pr-4">
                          {row.overdueDays > 0 ? (
                            <span className="text-red-700 font-medium">{row.overdueDays}d</span>
                          ) : (
                            <span className="text-stone-400">—</span>
                          )}
                        </td>
                        <td className="pr-4">
                          <span className={cn("px-2 py-0.5 text-[9px] font-bold uppercase rounded-full tracking-wider border", getStatusBadgeClass(row.status))}>
                            {row.status}
                          </span>
                        </td>
                        <td className="pr-4">
                          <span className={cn("px-2 py-0.5 text-[9px] font-bold uppercase rounded-full tracking-wider border", getRiskBadgeClass(risk))}>
                            {risk}
                          </span>
                        </td>
                        <td>
                          {row.status !== "Paid" && (
                            <button
                              onClick={() => setPaymentTarget(row)}
                              className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded border border-green-200 bg-green-50 text-green-700 hover:bg-green-100 transition-colors whitespace-nowrap"
                            >
                              Pay
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              {/* Footer totals */}
              {displayed.length > 0 && (
                <tfoot className="text-[10px] font-bold text-stone-600 border-t border-stone-200">
                  <tr className="h-9">
                    <td className="pr-4 text-stone-400 text-[9px] uppercase tracking-wider pt-2" colSpan={2}>
                      Totals ({displayed.length})
                    </td>
                    <td className="pr-4 pt-2">{formatCurrency(footerAmount)}</td>
                    <td className="pr-4 pt-2 text-green-700">{formatCurrency(footerPaid)}</td>
                    <td className="pr-4 pt-2">{formatCurrency(footerBalance)}</td>
                    <td colSpan={5} />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        {/* Aging Summary */}
        <div>
          <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Aging Summary</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white p-3 rounded-xl border border-stone-200 shadow-sm flex flex-col gap-1">
              <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wide">Current</span>
              <span className="text-base font-bold text-stone-900">{formatCurrency(agingCurrent)}</span>
              <span className="text-[10px] text-stone-400">Not yet overdue</span>
            </div>
            <div className="bg-white p-3 rounded-xl border border-amber-100 shadow-sm flex flex-col gap-1">
              <span className="text-[10px] text-amber-600 font-bold uppercase tracking-wide">1–30 Days</span>
              <span className="text-base font-bold text-stone-900">{formatCurrency(aging1to30)}</span>
              <span className="text-[10px] text-stone-400">Slightly overdue</span>
            </div>
            <div className="bg-white p-3 rounded-xl border border-orange-100 shadow-sm flex flex-col gap-1">
              <span className="text-[10px] text-orange-600 font-bold uppercase tracking-wide">31–60 Days</span>
              <span className="text-base font-bold text-stone-900">{formatCurrency(aging31to60)}</span>
              <span className="text-[10px] text-stone-400">At risk</span>
            </div>
            <div className="bg-white p-3 rounded-xl border border-red-100 shadow-sm flex flex-col gap-1">
              <span className="text-[10px] text-red-600 font-bold uppercase tracking-wide">60+ Days</span>
              <span className="text-base font-bold text-stone-900">{formatCurrency(aging60plus)}</span>
              <span className="text-[10px] text-stone-400">High risk</span>
            </div>
          </div>
        </div>
        </div>
      </main>

      {/* Dialogs */}
      <RecordPaymentDialog
        open={paymentTarget !== null}
        receivable={paymentTarget}
        onClose={() => setPaymentTarget(null)}
        onConfirm={handleConfirmPayment}
      />
      <AddInvoiceDialog
        open={showAddInvoice}
        customerNames={customerNames}
        nextInvoiceNumber={nextInvoiceNumber}
        nextId={nextId}
        onClose={() => setShowAddInvoice(false)}
        onConfirm={handleAddInvoice}
      />
    </>
  );
}

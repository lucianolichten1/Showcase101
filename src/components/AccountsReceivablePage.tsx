import { useCallback, useState, useMemo } from "react";
import { useOpenCreateFromQuery } from "@/hooks/useOpenCreateFromQuery";
import { Search, ArrowUp, ArrowDown, ArrowUpDown, Plus, Download, FileSearch, Wallet, History } from "lucide-react";
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
import { ConfirmDialog } from "./ConfirmDialog";
import { InvoiceFormDialog } from "./receivables/InvoiceFormDialog";
import { InvoicePaymentsDialog } from "./receivables/InvoicePaymentsDialog";
import { RecordPaymentDialog } from "./RecordPaymentDialog";
import { RECEIVABLE_PAGE_COPY } from "@/domains/financial/receivables/labels";
import type { ReceivablePaymentInput, ReceivablePaymentRecord } from "@/domains/financial/receivables/receivablePaymentTypes";
import { getSupabaseErrorMessage } from "@/lib/supabaseError";
import { KPICard } from "./KPICard";
import { rowsToCsv, downloadCsvFile } from "@/lib/csv";
import { receivableStatusTextClass, riskTextClass } from "@/lib/statusText";
import {
  buildWhatsAppChaseUrl,
  isChaseableReceivable,
} from "@/lib/invoiceChaser";
import { useCompanyScopedFinancialData } from "@/domains/company/useCompanyScopedFinancialData";

// ─── Types ────────────────────────────────────────────────────────────────────

type SortKey = "customer" | "amount" | "balance" | "overdueDays" | "dueDate";
type RiskLevel = "Low" | "Medium" | "High";

interface Props {
  onUpdateReceivable?: (updated: ReceivableRecord) => void;
  onAddReceivable?: (newR: ReceivableRecord) => void;
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

function latestBankDepositName(
  payments: ReceivablePaymentRecord[],
  bankAccountNameById: Map<string, string>
): string | null {
  const bankPayments = payments
    .filter((p) => p.paymentMethod === "Bank Transfer" && p.bankAccountId)
    .sort((a, b) => b.paymentDate.localeCompare(a.paymentDate));
  if (bankPayments.length === 0) return null;
  const accountId = bankPayments[0].bankAccountId;
  if (!accountId) return null;
  return bankAccountNameById.get(accountId) ?? null;
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
        "px-2.5 py-1 text-[10px] font-semibold rounded-md border transition-colors",
        active
          ? activeColors[color]
          : "bg-white text-stone-700 border-stone-200 hover:border-stone-300"
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

export function AccountsReceivablePage({
  onUpdateReceivable: onUpdateReceivableProp,
  onAddReceivable: onAddReceivableProp,
}: Props = {}) {
  const {
    receivableRecords: receivables,
    receivablePayments,
    customerRecords,
    activeCompanyId,
    activeBankAccounts,
    bankAccounts,
    saveReceivable,
    deleteReceivable,
    recordReceivablePayment,
    deleteReceivablePayment,
    receivablesError,
  } = useCompanyScopedFinancialData();

  // Filter state
  const [statusFilters, setStatusFilters] = useState<Set<string>>(new Set());
  const [riskFilters, setRiskFilters] = useState<Set<string>>(new Set());
  const [bankAccountFilter, setBankAccountFilter] = useState("");
  const [search, setSearch] = useState("");

  // Sort state
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  // Dialog state
  const [paymentTarget, setPaymentTarget] = useState<ReceivableRecord | null>(null);
  const [paymentsTarget, setPaymentsTarget] = useState<ReceivableRecord | null>(null);
  const [savingPayment, setSavingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [deletingPaymentId, setDeletingPaymentId] = useState<number | null>(null);
  const [invoiceFormOpen, setInvoiceFormOpen] = useState(false);
  const [editInvoice, setEditInvoice] = useState<ReceivableRecord | null>(null);
  const [savingInvoice, setSavingInvoice] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ReceivableRecord | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [chasedIds, setChasedIds] = useState<Set<number>>(() => new Set());

  const openAddInvoice = useCallback(() => {
    setEditInvoice(null);
    setInvoiceFormOpen(true);
  }, []);
  useOpenCreateFromQuery("invoice", openAddInvoice);

  const bankAccountNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const account of bankAccounts) {
      map.set(account.id, account.accountName);
    }
    return map;
  }, [bankAccounts]);

  const paymentsByInvoiceId = useMemo(() => {
    const map = new Map<number, ReceivablePaymentRecord[]>();
    for (const payment of receivablePayments) {
      const list = map.get(payment.invoiceId) ?? [];
      list.push(payment);
      map.set(payment.invoiceId, list);
    }
    return map;
  }, [receivablePayments]);

  const showDepositColumn = activeBankAccounts.length > 0;

  const customerPhoneByName = useMemo(() => {
    const map = new Map<string, string>();
    for (const customer of customerRecords) {
      if (customer.phone?.trim()) {
        map.set(customer.name, customer.phone.trim());
      }
    }
    for (const customer of allCustomers) {
      if (customer.phone?.trim() && !map.has(customer.name)) {
        map.set(customer.name, customer.phone.trim());
      }
    }
    return map;
  }, [customerRecords]);

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

    if (bankAccountFilter) {
      list = list.filter((r) => {
        const payments = paymentsByInvoiceId.get(r.id) ?? [];
        return payments.some((p) => p.bankAccountId === bankAccountFilter);
      });
    }

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
  }, [receivables, statusFilters, riskFilters, search, bankAccountFilter, paymentsByInvoiceId, sortKey, sortDir]);

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

  const handleConfirmPayment = async (id: number, input: ReceivablePaymentInput) => {
    setSavingPayment(true);
    setPaymentError(null);
    try {
      if (onUpdateReceivableProp) {
        const r = receivables.find((x) => x.id === id);
        if (!r) return;
        const newTotalPaid = r.amountPaid + input.amount;
        const status: ReceivableRecord["status"] =
          newTotalPaid <= 0 ? "Pending" : newTotalPaid < r.amount ? "Partially Paid" : "Paid";
        onUpdateReceivableProp({ ...r, amountPaid: newTotalPaid, status });
      } else {
        await recordReceivablePayment(id, input);
      }
      setPaymentTarget(null);
      setPaymentsTarget(null);
    } catch (err) {
      setPaymentError(getSupabaseErrorMessage(err, RECEIVABLE_PAGE_COPY.paymentError));
    } finally {
      setSavingPayment(false);
    }
  };

  const handleDeletePayment = async (paymentId: number) => {
    setDeletingPaymentId(paymentId);
    setPaymentError(null);
    try {
      await deleteReceivablePayment(paymentId);
    } catch (err) {
      setPaymentError(getSupabaseErrorMessage(err, RECEIVABLE_PAGE_COPY.paymentError));
    } finally {
      setDeletingPaymentId(null);
    }
  };

  const handleSaveInvoice = async (input: {
    customer: string;
    invoiceNumber: string;
    amount: number;
    dueDateIso: string;
    amountPaid: number;
  }) => {
    setSavingInvoice(true);
    try {
      if (onAddReceivableProp && !editInvoice) {
        const nextId = receivables.length > 0 ? Math.max(...receivables.map((r) => r.id)) + 1 : 1;
        onAddReceivableProp({
          id: nextId,
          customer: input.customer,
          invoiceNumber: input.invoiceNumber,
          amount: input.amount,
          amountPaid: 0,
          dueDate: input.dueDateIso,
          overdueDays: 0,
          status: "Pending",
        });
      } else {
        await saveReceivable(editInvoice?.id ?? null, input);
      }
      setInvoiceFormOpen(false);
      setEditInvoice(null);
    } finally {
      setSavingInvoice(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteReceivable(deleteTarget.id);
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const handleChase = (row: ReceivableRecord) => {
    const phone = customerPhoneByName.get(row.customer);
    if (!phone) return;

    const balance = row.amount - row.amountPaid;
    const url = buildWhatsAppChaseUrl({
      phone,
      clientName: row.customer,
      invoiceNumber: row.invoiceNumber,
      balanceDue: balance,
      overdueDays: row.overdueDays,
    });
    if (!url) return;

    window.open(url, "_blank", "noopener,noreferrer");
    setChasedIds((prev) => new Set(prev).add(row.id));
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
  const customerNames = useMemo(() => {
    const names = new Set<string>();
    for (const c of customerRecords) names.add(c.name);
    for (const c of allCustomers) names.add(c.name);
    return [...names].sort();
  }, [customerRecords]);

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <>
      <div className="flex flex-1 flex-col text-[#1C1917] font-sans min-h-0 bg-stone-50/40">
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-10 py-4 sm:py-5 space-y-5">
        <section className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 rounded-xl border border-stone-200 bg-white shadow-sm px-4 py-3.5 sm:px-5">
          <div>
            <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Accounts Receivable</h1>
            <p className="text-sm text-stone-700 mt-1">
              Outstanding balances and payment status
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-700 shadow-sm hover:bg-stone-50 transition-colors"
            >
              <Download size={13} />
              Export
            </button>
            <button
              onClick={openAddInvoice}
              className="flex items-center gap-1.5 rounded-lg bg-green-800 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-green-700 transition-colors"
            >
              <Plus size={13} />
              Add Invoice
            </button>
          </div>
        </section>

        {receivablesError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-800">
            {receivablesError}
          </div>
        )}

        {paymentError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-800">
            {paymentError}
          </div>
        )}

        {!activeCompanyId && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">
            Selecciona una empresa para registrar pagos y sincronizar con cuentas bancarias.
          </div>
        )}

        <section>
          <div className="mb-2">
            <h2 className="text-[10px] font-bold uppercase tracking-wider text-green-800">Overview</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2 sm:gap-3">
            <KPICard title="Total Outstanding" value={formatCurrency(totalOutstanding)} trend={0} trendText="" trendStatus="neutral" subtitle="Outstanding receivables" />
            <KPICard title="Overdue Amount" value={formatCurrency(overdueAmount)} trend={0} trendText="" trendStatus="neutral" subtitle="Past due date" />
            <KPICard title="Invoices Overdue" value={String(invoicesOverdue)} trend={0} trendText="" trendStatus="neutral" subtitle="Late balances" />
            <KPICard title="Avg Days Overdue" value={`${avgDaysOverdue}d`} trend={0} trendText="" trendStatus="neutral" subtitle="Across overdue" />
            <KPICard title="Collection Rate" value={`${collectionRate}%`} trend={0} trendText="" trendStatus="neutral" subtitle="Paid vs invoiced" />
            <KPICard title="Due This Week" value={String(dueSoon)} trend={0} trendText="" trendStatus="neutral" subtitle="Next 7 days" />
          </div>
        </section>

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
                className="w-full rounded-lg border border-stone-200 bg-white pl-8 pr-3 py-2 text-xs text-stone-900 outline-none focus:border-green-700 transition-colors placeholder:text-stone-500"
              />
            </div>

            {/* Status chips */}
            <div className="flex flex-wrap gap-1.5 items-center">
              <span className="text-[10px] font-semibold text-stone-700 mr-1">Status</span>
              <FilterChip label="All" active={statusFilters.size === 0} onClick={() => setStatusFilters(new Set())} />
              <FilterChip label="Pending" active={statusFilters.has("Pending")} onClick={() => toggleStatusFilter("Pending")} color="stone" />
              <FilterChip label="Partially Paid" active={statusFilters.has("Partially Paid")} onClick={() => toggleStatusFilter("Partially Paid")} color="amber" />
              <FilterChip label="Paid" active={statusFilters.has("Paid")} onClick={() => toggleStatusFilter("Paid")} color="green" />
              <FilterChip label="Overdue" active={statusFilters.has("Overdue")} onClick={() => toggleStatusFilter("Overdue")} color="red" />
            </div>

            {/* Risk chips */}
            <div className="flex flex-wrap gap-1.5 items-center">
              <span className="text-[10px] font-semibold text-stone-700 mr-1">Risk</span>
              <FilterChip label="All" active={riskFilters.size === 0} onClick={() => setRiskFilters(new Set())} />
              <FilterChip label="Low" active={riskFilters.has("Low")} onClick={() => toggleRiskFilter("Low")} color="green" />
              <FilterChip label="Medium" active={riskFilters.has("Medium")} onClick={() => toggleRiskFilter("Medium")} color="amber" />
              <FilterChip label="High" active={riskFilters.has("High")} onClick={() => toggleRiskFilter("High")} color="red" />
            </div>

            {activeBankAccounts.length > 0 && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <label className="text-[10px] font-semibold text-stone-700 shrink-0">
                  {RECEIVABLE_PAGE_COPY.bankAccountFilter}
                </label>
                <select
                  value={bankAccountFilter}
                  onChange={(e) => setBankAccountFilter(e.target.value)}
                  className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs text-stone-900 outline-none focus:border-green-700 max-w-xs"
                >
                  <option value="">{RECEIVABLE_PAGE_COPY.bankAccountFilterAll}</option>
                  {activeBankAccounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.accountName}
                    </option>
                  ))}
                </select>
                {bankAccountFilter && (
                  <p className="text-[10px] text-stone-600">{RECEIVABLE_PAGE_COPY.bankAccountFilterHint}</p>
                )}
              </div>
            )}
          </div>

          {/* Results count */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-green-800">
              All Receivables
            </h3>
            <span className="text-[10px] font-medium text-stone-600">
              {displayed.length} of {receivables.length} invoices
            </span>
          </div>

          <div className="rounded-lg border border-stone-100 overflow-hidden overflow-x-auto">
            <table className="w-full table-fixed text-left border-collapse min-w-[720px]">
              <colgroup>
                <col />
                <col className="w-[112px]" />
                <col className="w-[88px]" />
                <col className="w-[92px]" />
                {showDepositColumn && <col className="w-[108px]" />}
                <col className="w-[128px]" />
              </colgroup>
              <thead>
                <tr className="border-b-2 border-green-800/20 bg-green-50">
                  <th
                    className="px-3 py-2.5 text-[10px] uppercase font-bold text-green-900 tracking-wider cursor-pointer select-none"
                    onClick={() => handleSort("customer")}
                  >
                    Customer <SortIcon colKey="customer" sortKey={sortKey} sortDir={sortDir} />
                  </th>
                  <th
                    className="px-3 py-2.5 text-[10px] uppercase font-bold text-green-900 tracking-wider text-right cursor-pointer select-none"
                    onClick={() => handleSort("balance")}
                  >
                    Balance <SortIcon colKey="balance" sortKey={sortKey} sortDir={sortDir} />
                  </th>
                  <th
                    className="px-3 py-2.5 text-[10px] uppercase font-bold text-green-900 tracking-wider cursor-pointer select-none"
                    onClick={() => handleSort("dueDate")}
                  >
                    Due <SortIcon colKey="dueDate" sortKey={sortKey} sortDir={sortDir} />
                  </th>
                  <th className="px-3 py-2.5 text-[10px] uppercase font-bold text-green-900 tracking-wider">Status</th>
                  {showDepositColumn && (
                    <th className="px-3 py-2.5 text-[10px] uppercase font-bold text-green-900 tracking-wider">
                      {RECEIVABLE_PAGE_COPY.depositColumn}
                    </th>
                  )}
                  <th className="px-3 py-2.5 text-[10px] uppercase font-bold text-green-900 tracking-wider text-right">
                    {RECEIVABLE_PAGE_COPY.actions}
                  </th>
                </tr>
              </thead>
              <tbody className="text-xs text-stone-900">
                {displayed.length === 0 ? (
                  <tr>
                    <td colSpan={showDepositColumn ? 6 : 5} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-2 text-stone-600">
                        <FileSearch size={32} strokeWidth={1.5} />
                        <p className="text-sm font-medium text-stone-800">No invoices match your filters</p>
                        <p className="text-xs text-stone-600">Try adjusting the search, status, or risk filters</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  displayed.map((row) => {
                    const balance = row.amount - row.amountPaid;
                    const risk = getRiskLevel(row.overdueDays, row.status);
                    const invoicePayments = paymentsByInvoiceId.get(row.id) ?? [];
                    const depositName = latestBankDepositName(invoicePayments, bankAccountNameById);
                    return (
                      <tr
                        key={row.id}
                        className="border-b border-stone-100 last:border-0 transition-colors hover:bg-green-50/40"
                      >
                        <td className="px-3 py-3 min-w-0 align-top">
                          <div className="font-semibold truncate leading-snug" title={row.customer}>
                            {row.customer}
                          </div>
                          <div className="text-[10px] font-mono text-stone-500 mt-0.5 truncate">
                            {row.invoiceNumber}
                          </div>
                        </td>
                        <td className="px-3 py-3 text-right align-top">
                          <div className="font-bold tabular-nums leading-snug">
                            {balance > 0 ? formatCurrency(balance) : <span className="text-green-800 font-medium">Paid</span>}
                          </div>
                          {row.amountPaid > 0 && balance > 0 && (
                            <div className="text-[10px] text-stone-500 tabular-nums mt-0.5 leading-snug">
                              {formatCurrency(row.amountPaid)} paid
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-3 align-top">
                          <div className="font-medium text-stone-700 leading-snug">{row.dueDate}</div>
                          {row.overdueDays > 0 ? (
                            <div className="text-[10px] text-red-700 font-semibold mt-0.5">{row.overdueDays}d overdue</div>
                          ) : (
                            <div className="text-[10px] text-stone-500 mt-0.5">On time</div>
                          )}
                        </td>
                        <td className="px-3 py-3 align-top">
                          <div className={cn(receivableStatusTextClass(row.status), "leading-snug")}>{row.status}</div>
                          {risk !== "Low" && (
                            <div className={cn(riskTextClass(risk), "text-[10px] mt-0.5")}>{risk}</div>
                          )}
                        </td>
                        {showDepositColumn && (
                          <td className="px-3 py-3 align-top">
                            {depositName ? (
                              <div className="text-[10px] font-medium text-green-800 leading-snug truncate" title={depositName}>
                                {depositName}
                              </div>
                            ) : (
                              <div className="text-[10px] text-stone-400 leading-snug">
                                {RECEIVABLE_PAGE_COPY.noDepositYet}
                              </div>
                            )}
                          </td>
                        )}
                        <td className="px-3 py-3 align-top text-right">
                          <div className="flex flex-col items-end gap-1.5">
                            {row.status !== "Paid" && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (!activeCompanyId) {
                                    setPaymentError(
                                      "Selecciona una empresa antes de registrar pagos."
                                    );
                                    return;
                                  }
                                  setPaymentError(null);
                                  setPaymentTarget(row);
                                }}
                                className="inline-flex items-center gap-1 rounded-md bg-green-800 px-2 py-1 text-[10px] font-semibold text-white hover:bg-green-700 transition-colors"
                              >
                                <Wallet size={11} />
                                {RECEIVABLE_PAGE_COPY.pay}
                              </button>
                            )}
                            {invoicePayments.length > 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  setPaymentError(null);
                                  setPaymentsTarget(row);
                                }}
                                className="inline-flex items-center gap-1 text-[10px] font-semibold text-stone-700 hover:text-green-800"
                              >
                                <History size={11} />
                                {RECEIVABLE_PAGE_COPY.viewPayments} ({invoicePayments.length})
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                setEditInvoice(row);
                                setInvoiceFormOpen(true);
                              }}
                              className="text-[10px] font-semibold text-green-800 hover:underline"
                            >
                              {RECEIVABLE_PAGE_COPY.edit}
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(row)}
                              className="text-[10px] font-semibold text-red-700 hover:underline"
                            >
                              {RECEIVABLE_PAGE_COPY.delete}
                            </button>
                            {isChaseableReceivable(row.status) &&
                              (chasedIds.has(row.id) ? (
                                <span className="text-[10px] font-medium text-stone-500">
                                  Enviado
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleChase(row)}
                                  disabled={!customerPhoneByName.has(row.customer)}
                                  title={
                                    customerPhoneByName.has(row.customer)
                                      ? "Send payment reminder via WhatsApp"
                                      : "No phone number on file for this customer"
                                  }
                                  className="text-[10px] font-semibold text-green-800 hover:underline disabled:text-stone-400 disabled:no-underline disabled:cursor-not-allowed"
                                >
                                  {RECEIVABLE_PAGE_COPY.chase}
                                </button>
                              ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              {/* Footer totals */}
              {displayed.length > 0 && (
                <tfoot className="text-xs font-bold text-stone-700 border-t border-stone-200 bg-stone-50/50">
                  <tr>
                    <td className="px-3 py-2.5 text-stone-600 text-[10px] uppercase tracking-wider">
                      Totals ({displayed.length})
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums">
                      <div>{formatCurrency(footerBalance)}</div>
                      {footerPaid > 0 && (
                        <div className="text-[10px] font-medium text-stone-500 mt-0.5">
                          {formatCurrency(footerPaid)} paid
                        </div>
                      )}
                    </td>
                    <td colSpan={showDepositColumn ? 4 : 3} />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        <section>
          <h3 className="text-xs font-bold text-green-800 uppercase tracking-wider mb-2">Aging Summary</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
            <KPICard title="Current" value={formatCurrency(agingCurrent)} trend={0} trendText="" trendStatus="neutral" subtitle="Not yet overdue" />
            <KPICard title="1–30 Days" value={formatCurrency(aging1to30)} trend={0} trendText="" trendStatus="neutral" subtitle="Slightly overdue" />
            <KPICard title="31–60 Days" value={formatCurrency(aging31to60)} trend={0} trendText="" trendStatus="neutral" subtitle="At risk" />
            <KPICard title="60+ Days" value={formatCurrency(aging60plus)} trend={0} trendText="" trendStatus="neutral" subtitle="High risk" />
          </div>
        </section>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <RecordPaymentDialog
        open={paymentTarget !== null}
        receivable={paymentTarget}
        saving={savingPayment}
        onClose={() => !savingPayment && setPaymentTarget(null)}
        onConfirm={handleConfirmPayment}
      />
      <InvoicePaymentsDialog
        open={paymentsTarget !== null}
        receivable={paymentsTarget}
        payments={receivablePayments}
        bankAccounts={bankAccounts}
        deletingPaymentId={deletingPaymentId}
        onClose={() => !deletingPaymentId && setPaymentsTarget(null)}
        onRecordPayment={() => {
          if (!paymentsTarget) return;
          setPaymentTarget(paymentsTarget);
          setPaymentsTarget(null);
        }}
        onDeletePayment={(paymentId) => void handleDeletePayment(paymentId)}
      />
      <InvoiceFormDialog
        open={invoiceFormOpen}
        receivable={editInvoice}
        customerNames={customerNames}
        nextInvoiceNumber={nextInvoiceNumber}
        saving={savingInvoice}
        onClose={() => {
          if (!savingInvoice) {
            setInvoiceFormOpen(false);
            setEditInvoice(null);
          }
        }}
        onSave={handleSaveInvoice}
      />
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={RECEIVABLE_PAGE_COPY.deleteTitle}
        message={
          deleteTarget
            ? RECEIVABLE_PAGE_COPY.deleteMessage(deleteTarget.invoiceNumber)
            : ""
        }
        confirmLabel={RECEIVABLE_PAGE_COPY.deleteConfirm}
        cancelLabel="Cancelar"
        destructive
        loading={deleting}
        onConfirm={() => void handleConfirmDelete()}
        onClose={() => !deleting && setDeleteTarget(null)}
      />
    </>
  );
}

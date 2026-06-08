import { useMemo, useState, type FormEvent } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Plus, Search, X } from "lucide-react";
import { formatCurrency } from "@/data/mockData";
import { FinancialEmptyBanner } from "@/components/FinancialEmptyBanner";
import { FinancialPeriodFilter } from "@/components/FinancialPeriodFilter";
import { isActiveRevenue, sortRevenueRecords } from "@/domains/financial/calculations";
import { useFinancialData, useSyncFinancialPeriod } from "@/domains/financial/hooks";
import {
  DEFAULT_FINANCIAL_PERIOD,
  getDateRangeForPeriod,
  getFinancialPeriodLabel,
  type FinancialPeriod,
} from "@/domains/financial/period";
import {
  REVENUE_CATEGORIES,
  REVENUE_PAYMENT_METHODS,
  REVENUE_STATUSES,
  type RevenueCategory,
  type PaymentMethod,
  type RevenueRecord,
  type RevenuePaymentStatus,
  type RevenueSortDirection,
  type RevenueSortKey,
} from "@/domains/financial/types";
import { cn } from "@/lib/utils";
import { KPICard } from "@/components/KPICard";
import { revenueStatusTextClass } from "@/lib/statusText";

const ALL_FILTER = "all";
type RevenueFormState = Omit<RevenueRecord, "id">;

const emptyForm = (): RevenueFormState => ({
  date: new Date().toISOString().slice(0, 10),
  sourceClient: "",
  productService: "",
  category: "Other",
  amount: 0,
  currency: "Bs",
  status: "Pending",
  paymentMethod: "Bank Transfer",
  invoiceNumber: "",
  notes: "",
});

function formatDisplayDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  const m = parseInt(month, 10) - 1;
  return `${months[m] ?? month} ${parseInt(day, 10)}, ${year}`;
}

const SORTABLE_COLUMNS: { key: RevenueSortKey; label: string }[] = [
  { key: "date", label: "Date" },
  { key: "sourceClient", label: "Source / Client" },
  { key: "productService", label: "Product / Service" },
  { key: "category", label: "Category" },
  { key: "amount", label: "Amount" },
  { key: "status", label: "Status" },
  { key: "paymentMethod", label: "Payment" },
  { key: "invoiceNumber", label: "Invoice #" },
];

function SortIcon({
  column,
  sortKey,
  sortDirection,
}: {
  column: RevenueSortKey;
  sortKey: RevenueSortKey | null;
  sortDirection: RevenueSortDirection;
}) {
  if (sortKey !== column) {
    return <ArrowUpDown className="h-3 w-3 shrink-0 opacity-30" aria-hidden />;
  }
  if (sortDirection === "asc") {
    return <ArrowUp className="h-3 w-3 shrink-0 text-stone-600" aria-hidden />;
  }
  return <ArrowDown className="h-3 w-3 shrink-0 text-stone-600" aria-hidden />;
}

export function RevenuePage() {
  const { setRevenueRecords, setDateRange, filteredRevenueRecords, kpis, usesImportedData } =
    useFinancialData();
  const [period, setPeriod] = useState<FinancialPeriod>(DEFAULT_FINANCIAL_PERIOD);
  const periodLabel = getFinancialPeriodLabel(period);

  useSyncFinancialPeriod(period, setDateRange);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>(ALL_FILTER);
  const [statusFilter, setStatusFilter] = useState<string>(ALL_FILTER);
  const [sortKey, setSortKey] = useState<RevenueSortKey | null>(null);
  const [sortDirection, setSortDirection] = useState<RevenueSortDirection>("asc");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<RevenueFormState>(emptyForm);

  const filteredRevenue = useMemo(() => {
    const query = search.trim().toLowerCase();
    return filteredRevenueRecords.filter((record) => {
      const matchesSearch =
        query === "" ||
        record.sourceClient.toLowerCase().includes(query) ||
        record.productService.toLowerCase().includes(query) ||
        record.category.toLowerCase().includes(query) ||
        record.invoiceNumber.toLowerCase().includes(query);
      const matchesCategory =
        categoryFilter === ALL_FILTER || record.category === categoryFilter;
      const matchesStatus =
        statusFilter === ALL_FILTER || record.status === statusFilter;
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [filteredRevenueRecords, search, categoryFilter, statusFilter]);

  const sortedRevenue = useMemo(() => {
    if (!sortKey) return filteredRevenue;
    return sortRevenueRecords(filteredRevenue, sortKey, sortDirection);
  }, [filteredRevenue, sortKey, sortDirection]);

  const handlePeriodChange = (next: FinancialPeriod) => {
    setPeriod(next);
    setDateRange(getDateRangeForPeriod(next));
  };

  const handleOpenModal = () => {
    setForm(emptyForm());
    setIsModalOpen(true);
  };

  const handleCloseModal = () => setIsModalOpen(false);

  const handleSort = (column: RevenueSortKey) => {
    if (sortKey !== column) {
      setSortKey(column);
      setSortDirection("asc");
      return;
    }
    if (sortDirection === "asc") {
      setSortDirection("desc");
      return;
    }
    setSortKey(null);
    setSortDirection("asc");
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (
      !form.sourceClient.trim() ||
      !form.productService.trim() ||
      !form.invoiceNumber.trim() ||
      (form.status !== "Cancelled" && form.amount <= 0)
    ) {
      return;
    }

    const newRecord: RevenueRecord = {
      id: `rev-${Date.now()}`,
      ...form,
      sourceClient: form.sourceClient.trim(),
      productService: form.productService.trim(),
      invoiceNumber: form.invoiceNumber.trim(),
      notes: form.notes.trim(),
    };

    setRevenueRecords((prev) => [newRecord, ...prev]);
    setIsModalOpen(false);
    setForm(emptyForm());
  };

  return (
    <>
      <div className="flex flex-1 flex-col text-[#1C1917] font-sans min-h-0 bg-stone-50/40">
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-10 py-4 sm:py-5 space-y-5">
        <section className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 rounded-xl border border-stone-200 bg-white shadow-sm px-4 py-3.5 sm:px-5">
          <div>
            <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Revenue</h1>
            <p className="text-sm text-stone-700 mt-1 max-w-xl">
              Track sales income, client payments, and pending receivables.
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenModal}
            className="inline-flex items-center justify-center gap-2 bg-green-800 text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-green-700 transition-colors shadow-sm shrink-0"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Revenue
          </button>
        </section>

        {!usesImportedData && (
          <FinancialEmptyBanner
            title="No revenue yet"
            description="Add revenue manually using the button above, or import an Excel workbook with a Sales sheet."
          />
        )}

        <section>
          <div className="mb-2">
            <h2 className="text-[10px] font-bold uppercase tracking-wider text-green-800">Overview</h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
            <KPICard title="Total Revenue" value={formatCurrency(kpis.totalRevenue)} trend={0} trendText="" trendStatus="neutral" subtitle={usesImportedData ? `${periodLabel} · ${filteredRevenueRecords.filter(isActiveRevenue).length} records` : "Import Excel to populate"} />
            <KPICard title="Collected Revenue" value={formatCurrency(kpis.collectedRevenue)} trend={0} trendText="" trendStatus="neutral" subtitle={`${periodLabel} · payments received`} />
            <KPICard title="Pending Revenue" value={formatCurrency(kpis.pendingRevenue)} trend={0} trendText="" trendStatus="neutral" subtitle={`${periodLabel} · awaiting collection`} />
            <KPICard title="Top Revenue Source" value={kpis.topRevenueCategory} trend={0} trendText="" trendStatus="neutral" subtitle={`${periodLabel} · by category`} />
          </div>
        </section>

        <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-4 overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-end gap-3 mb-4">
            <div className="flex-1 min-w-[200px]">
              <label
                htmlFor="revenue-search"
                className="block text-[10px] font-semibold text-stone-700 mb-1"
              >
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400" />
                <input
                  id="revenue-search"
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Client, product, category, or invoice #…"
                  className="w-full pl-8 pr-3 py-2 text-xs border border-stone-200 rounded-lg bg-stone-50 focus:outline-none focus:ring-1 focus:ring-green-700 focus:border-green-700"
                />
              </div>
            </div>
            <div className="w-full lg:w-44">
              <label
                htmlFor="revenue-category-filter"
                className="block text-[10px] font-semibold text-stone-700 mb-1"
              >
                Category
              </label>
              <select
                id="revenue-category-filter"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full py-2 px-3 text-xs border border-stone-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-green-700"
              >
                <option value={ALL_FILTER}>All categories</option>
                {REVENUE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-full lg:w-36">
              <label
                htmlFor="revenue-status-filter"
                className="block text-[10px] font-semibold text-stone-700 mb-1"
              >
                Status
              </label>
              <select
                id="revenue-status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full py-2 px-3 text-xs border border-stone-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-green-700"
              >
                <option value={ALL_FILTER}>All statuses</option>
                {REVENUE_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
            <FinancialPeriodFilter
              id="revenue-period"
              period={period}
              onPeriodChange={handlePeriodChange}
              className="w-full lg:w-44"
            />
          </div>

          <h3 className="text-xs font-bold uppercase tracking-wider text-green-800 mb-3">
            All Revenue
            <span className="ml-2 text-stone-600 font-medium normal-case">
              ({filteredRevenue.length})
            </span>
          </h3>

          <div className="overflow-x-auto rounded-lg border border-stone-100">
            <table className="w-full text-left border-collapse min-w-[1040px]">
              <thead>
                <tr className="border-b-2 border-green-800/20 bg-green-50">
                  {SORTABLE_COLUMNS.map(({ key, label }) => (
                    <th key={key} className="px-3 py-2.5 text-[10px] uppercase font-bold text-green-900 tracking-wider">
                      <button
                        type="button"
                        onClick={() => handleSort(key)}
                        className={cn(
                          "inline-flex items-center gap-1 cursor-pointer",
                          "hover:text-green-800 transition-colors",
                          sortKey === key && "text-green-800"
                        )}
                        aria-label={`Sort by ${label}${
                          sortKey === key
                            ? `, ${sortDirection === "asc" ? "ascending" : "descending"}`
                            : ""
                        }`}
                      >
                        <span>{label}</span>
                        <SortIcon column={key} sortKey={sortKey} sortDirection={sortDirection} />
                      </button>
                    </th>
                  ))}
                  <th className="px-3 py-2.5 text-[10px] uppercase font-bold text-green-900 tracking-wider">Notes</th>
                </tr>
              </thead>
              <tbody className="text-xs text-stone-900">
                {sortedRevenue.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-stone-500">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-stone-600">No revenue records yet</p>
                        <p className="text-xs max-w-sm mx-auto">
                          {sortedRevenue.length === 0 && !usesImportedData
                            ? "Add revenue manually with the button above, or import an Excel workbook."
                            : "No revenue records match your search or filters."}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  sortedRevenue.map((record) => (
                    <tr
                      key={record.id}
                      className="border-b border-stone-100 last:border-0 hover:bg-green-50/40 transition-colors"
                    >
                      <td className="pr-3 py-2 whitespace-nowrap">
                        {formatDisplayDate(record.date)}
                      </td>
                      <td className="pr-3 py-2 whitespace-nowrap">{record.sourceClient}</td>
                      <td
                        className="pr-3 py-2 max-w-[160px] truncate"
                        title={record.productService}
                      >
                        {record.productService}
                      </td>
                      <td className="pr-3 py-2 whitespace-nowrap">{record.category}</td>
                      <td className="pr-3 py-2 font-bold whitespace-nowrap">
                        {record.currency} {record.amount.toLocaleString()}
                      </td>
                      <td className="px-3 py-3">
                        <span className={revenueStatusTextClass(record.status)}>{record.status}</span>
                      </td>
                      <td className="pr-3 py-2 whitespace-nowrap">{record.paymentMethod}</td>
                      <td className="pr-3 py-2 whitespace-nowrap font-medium">
                        {record.invoiceNumber}
                      </td>
                      <td
                        className="px-3 py-3 max-w-[120px] truncate text-stone-600"
                        title={record.notes}
                      >
                        {record.notes || "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-revenue-title"
        >
          <button
            type="button"
            className="absolute inset-0 bg-stone-900/40"
            aria-label="Close dialog"
            onClick={handleCloseModal}
          />
          <div className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded-xl border border-stone-200 shadow-xl">
            <div className="flex items-center justify-between border-b border-stone-200 px-5 py-4">
              <h2 id="add-revenue-title" className="text-sm font-bold text-stone-900">
                Add Revenue
              </h2>
              <button
                type="button"
                onClick={handleCloseModal}
                className="rounded-md p-1.5 text-stone-500 hover:bg-stone-100"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-stone-500 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    required
                    value={form.date}
                    onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                    className="w-full py-2 px-3 text-xs border border-stone-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-stone-500 mb-1">
                    Category
                  </label>
                  <select
                    required
                    value={form.category}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        category: e.target.value as RevenueCategory,
                      }))
                    }
                    className="w-full py-2 px-3 text-xs border border-stone-200 rounded-lg"
                  >
                    {REVENUE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-stone-500 mb-1">
                  Source / Client
                </label>
                <input
                  type="text"
                  required
                  value={form.sourceClient}
                  onChange={(e) => setForm((f) => ({ ...f, sourceClient: e.target.value }))}
                  className="w-full py-2 px-3 text-xs border border-stone-200 rounded-lg"
                  placeholder="Buyer or client name"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-stone-500 mb-1">
                  Product / Service
                </label>
                <input
                  type="text"
                  required
                  value={form.productService}
                  onChange={(e) => setForm((f) => ({ ...f, productService: e.target.value }))}
                  className="w-full py-2 px-3 text-xs border border-stone-200 rounded-lg"
                  placeholder="e.g. Consulting Services — Q1"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-stone-500 mb-1">
                  Invoice Number
                </label>
                <input
                  type="text"
                  required
                  value={form.invoiceNumber}
                  onChange={(e) => setForm((f) => ({ ...f, invoiceNumber: e.target.value }))}
                  className="w-full py-2 px-3 text-xs border border-stone-200 rounded-lg"
                  placeholder="INV-2026-0000"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-stone-500 mb-1">
                    Amount
                  </label>
                  <input
                    type="number"
                    required={form.status !== "Cancelled"}
                    min={0}
                    step={0.01}
                    value={form.amount || ""}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, amount: parseFloat(e.target.value) || 0 }))
                    }
                    className="w-full py-2 px-3 text-xs border border-stone-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-stone-500 mb-1">
                    Currency
                  </label>
                  <input
                    type="text"
                    required
                    value={form.currency}
                    onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
                    className="w-full py-2 px-3 text-xs border border-stone-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-stone-500 mb-1">
                    Status
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, status: e.target.value as RevenuePaymentStatus }))
                    }
                    className="w-full py-2 px-3 text-xs border border-stone-200 rounded-lg"
                  >
                    {REVENUE_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-stone-500 mb-1">
                  Payment Method
                </label>
                <select
                  value={form.paymentMethod}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      paymentMethod: e.target.value as PaymentMethod,
                    }))
                  }
                  className="w-full py-2 px-3 text-xs border border-stone-200 rounded-lg"
                >
                  {REVENUE_PAYMENT_METHODS.map((method) => (
                    <option key={method} value={method}>
                      {method}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-stone-500 mb-1">
                  Notes
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  rows={2}
                  className="w-full py-2 px-3 text-xs border border-stone-200 rounded-lg resize-none"
                  placeholder="Optional notes"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-xs font-bold text-stone-600 border border-stone-200 rounded-lg hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-green-800 rounded-lg hover:bg-green-900"
                >
                  Save Revenue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

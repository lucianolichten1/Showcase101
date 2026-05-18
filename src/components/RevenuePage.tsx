import { useMemo, useState, type FormEvent } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Plus, Search, X } from "lucide-react";
import { formatCurrency } from "@/data/mockData";
import { isActiveRevenue, sortRevenueRecords } from "@/domains/financial/calculations";
import { useFinancialData } from "@/domains/financial/hooks";
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

function getStatusBadgeClass(status: RevenuePaymentStatus): string {
  if (status === "Collected") return "bg-green-50 text-green-800 border-green-100";
  if (status === "Overdue") return "bg-red-50 text-red-800 border-red-100";
  if (status === "Cancelled") return "bg-stone-100 text-stone-500 border-stone-200";
  return "bg-amber-50 text-amber-800 border-amber-100";
}

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
  const { setRevenueRecords, filteredRevenueRecords, kpis } = useFinancialData();
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
      <main className="flex flex-col gap-5 p-5 lg:p-6 flex-1 min-h-0 overflow-auto">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold text-stone-900">Revenue</h1>
            <p className="text-xs text-stone-500 mt-1 max-w-xl leading-relaxed">
              Track sales income, client payments, export and import revenue, and pending
              receivables across your agro commercial operations.
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenModal}
            className="inline-flex items-center justify-center gap-2 bg-stone-800 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-stone-700 transition-colors shadow-sm shrink-0"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Revenue
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white p-3 rounded-xl border border-stone-200 shadow-sm flex flex-col gap-1">
            <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wide">
              Total Revenue
            </span>
            <span className="text-lg font-bold text-stone-900">
              {formatCurrency(kpis.totalRevenue)}
            </span>
            <span className="text-[10px] text-stone-400">
              {filteredRevenueRecords.filter(isActiveRevenue).length} active records
            </span>
          </div>
          <div className="bg-white p-3 rounded-xl border border-stone-200 shadow-sm flex flex-col gap-1">
            <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wide">
              Collected Revenue
            </span>
            <span className="text-lg font-bold text-green-700">
              {formatCurrency(kpis.collectedRevenue)}
            </span>
            <span className="text-[10px] text-stone-400">Payments received</span>
          </div>
          <div className="bg-white p-3 rounded-xl border border-stone-200 shadow-sm flex flex-col gap-1">
            <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wide">
              Pending Revenue
            </span>
            <span className="text-lg font-bold text-amber-700">
              {formatCurrency(kpis.pendingRevenue)}
            </span>
            <span className="text-[10px] text-stone-400">Awaiting collection</span>
          </div>
          <div className="bg-white p-3 rounded-xl border border-stone-200 shadow-sm flex flex-col gap-1">
            <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wide">
              Top Revenue Source
            </span>
            <span className="text-lg font-bold text-stone-900 truncate">
              {kpis.topRevenueCategory}
            </span>
            <span className="text-[10px] text-stone-400">By category total</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-4 overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-end gap-3 mb-4">
            <div className="flex-1 min-w-[200px]">
              <label
                htmlFor="revenue-search"
                className="block text-[10px] font-bold uppercase tracking-wide text-stone-500 mb-1"
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
                className="block text-[10px] font-bold uppercase tracking-wide text-stone-500 mb-1"
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
                className="block text-[10px] font-bold uppercase tracking-wide text-stone-500 mb-1"
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
          </div>

          <h3 className="text-sm font-bold text-stone-800 uppercase tracking-tight mb-3">
            All Revenue
            <span className="ml-2 text-stone-400 font-medium normal-case">
              ({filteredRevenue.length})
            </span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1040px]">
              <thead className="text-[9px] uppercase text-stone-400 font-bold border-b border-stone-100">
                <tr className="h-8">
                  {SORTABLE_COLUMNS.map(({ key, label }) => (
                    <th key={key} className="font-bold pr-3">
                      <button
                        type="button"
                        onClick={() => handleSort(key)}
                        className={cn(
                          "inline-flex items-center gap-1 cursor-pointer rounded px-0.5 -mx-0.5",
                          "hover:text-stone-600 transition-colors",
                          sortKey === key && "text-stone-600"
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
                  <th className="font-bold">Notes</th>
                </tr>
              </thead>
              <tbody className="text-[11px] text-stone-800">
                {sortedRevenue.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-stone-500">
                      No revenue records match your search or filters.
                    </td>
                  </tr>
                ) : (
                  sortedRevenue.map((record) => (
                    <tr
                      key={record.id}
                      className="h-11 border-b border-stone-50 last:border-0 hover:bg-stone-50 transition-colors"
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
                      <td className="pr-3 py-2">
                        <span
                          className={cn(
                            "inline-flex px-2 py-0.5 text-[9px] font-bold uppercase rounded-full tracking-wider border",
                            getStatusBadgeClass(record.status)
                          )}
                        >
                          {record.status}
                        </span>
                      </td>
                      <td className="pr-3 py-2 whitespace-nowrap">{record.paymentMethod}</td>
                      <td className="pr-3 py-2 whitespace-nowrap font-medium">
                        {record.invoiceNumber}
                      </td>
                      <td
                        className="py-2 max-w-[120px] truncate text-stone-500"
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
      </main>

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
                  placeholder="e.g. Yellow corn — 28 tons"
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

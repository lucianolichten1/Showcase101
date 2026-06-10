import { useCallback, useMemo, useState, type FormEvent } from "react";
import { useOpenCreateFromQuery } from "@/hooks/useOpenCreateFromQuery";
import { ArrowDown, ArrowUp, ArrowUpDown, Plus, ReceiptText, Search, X } from "lucide-react";
import { formatCurrency } from "@/data/mockData";
import { FinancialEmptyBanner } from "@/components/FinancialEmptyBanner";
import { FinancialPeriodFilter } from "@/components/FinancialPeriodFilter";
import { sortExpenseRecords } from "@/domains/financial/calculations";
import { useSyncFinancialPeriod } from "@/domains/financial/hooks";
import { useCompanyScopedFinancialData } from "@/domains/company/useCompanyScopedFinancialData";
import {
  DEFAULT_FINANCIAL_PERIOD,
  getDateRangeForPeriod,
  getFinancialPeriodLabel,
  type FinancialPeriod,
} from "@/domains/financial/period";
import {
  EXPENSE_CATEGORIES,
  EXPENSE_STATUSES,
  EXPENSE_PAYMENT_METHODS,
  type ExpenseRecord,
  type ExpenseCategory,
  type ExpensePaymentStatus,
  type ExpenseSortDirection,
  type ExpenseSortKey,
  type PaymentMethod,
} from "@/domains/financial/types";
import { cn } from "@/lib/utils";
import { KPICard } from "@/components/KPICard";
import { expenseStatusTextClass } from "@/lib/statusText";

const ALL_FILTER = "all";
type ExpenseFormState = Omit<ExpenseRecord, "id">;

const emptyForm = (): ExpenseFormState => ({
  date: new Date().toISOString().slice(0, 10),
  category: "Other",
  description: "",
  vendor: "",
  amount: 0,
  currency: "Bs",
  status: "Pending",
  paymentMethod: "Bank Transfer",
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

const TABLE_COLUMNS: {
  key: ExpenseSortKey | "details";
  label: string;
  sortKey: ExpenseSortKey;
  align?: "right";
}[] = [
  { key: "date", label: "Date", sortKey: "date" },
  { key: "details", label: "Expense", sortKey: "description" },
  { key: "category", label: "Category", sortKey: "category" },
  { key: "amount", label: "Amount", sortKey: "amount", align: "right" },
  { key: "status", label: "Status", sortKey: "status" },
];

function SortIcon({
  column,
  sortKey,
  sortDirection,
}: {
  column: ExpenseSortKey;
  sortKey: ExpenseSortKey | null;
  sortDirection: ExpenseSortDirection;
}) {
  if (sortKey !== column) {
    return <ArrowUpDown className="h-3 w-3 shrink-0 opacity-30" aria-hidden />;
  }
  if (sortDirection === "asc") {
    return <ArrowUp className="h-3 w-3 shrink-0 text-stone-600" aria-hidden />;
  }
  return <ArrowDown className="h-3 w-3 shrink-0 text-stone-600" aria-hidden />;
}

export function ExpensesPage() {
  const { setExpenseRecords, setDateRange, filteredExpenseRecords, kpis, usesImportedData } =
    useCompanyScopedFinancialData();
  const [period, setPeriod] = useState<FinancialPeriod>(DEFAULT_FINANCIAL_PERIOD);
  const periodLabel = getFinancialPeriodLabel(period);

  useSyncFinancialPeriod(period, setDateRange);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>(ALL_FILTER);
  const [statusFilter, setStatusFilter] = useState<string>(ALL_FILTER);
  const [sortKey, setSortKey] = useState<ExpenseSortKey | null>(null);
  const [sortDirection, setSortDirection] = useState<ExpenseSortDirection>("asc");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<ExpenseFormState>(emptyForm);

  const filteredExpenses = useMemo(() => {
    const query = search.trim().toLowerCase();
    return filteredExpenseRecords.filter((expense) => {
      const matchesSearch =
        query === "" ||
        expense.description.toLowerCase().includes(query) ||
        expense.vendor.toLowerCase().includes(query) ||
        expense.category.toLowerCase().includes(query);
      const matchesCategory =
        categoryFilter === ALL_FILTER || expense.category === categoryFilter;
      const matchesStatus =
        statusFilter === ALL_FILTER || expense.status === statusFilter;
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [filteredExpenseRecords, search, categoryFilter, statusFilter]);

  const sortedExpenses = useMemo(() => {
    if (!sortKey) return filteredExpenses;
    return sortExpenseRecords(filteredExpenses, sortKey, sortDirection);
  }, [filteredExpenses, sortKey, sortDirection]);

  const handlePeriodChange = (next: FinancialPeriod) => {
    setPeriod(next);
    setDateRange(getDateRangeForPeriod(next));
  };

  const handleOpenModal = useCallback(() => {
    setForm(emptyForm());
    setIsModalOpen(true);
  }, []);

  useOpenCreateFromQuery("expense", handleOpenModal);

  const handleCloseModal = () => setIsModalOpen(false);

  const handleSort = (column: ExpenseSortKey) => {
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
    if (!form.description.trim() || !form.vendor.trim() || form.amount <= 0) {
      return;
    }

    const newExpense: ExpenseRecord = {
      id: `exp-${Date.now()}`,
      ...form,
      description: form.description.trim(),
      vendor: form.vendor.trim(),
      notes: form.notes.trim(),
    };

    setExpenseRecords((prev) => [newExpense, ...prev]);
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
            <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Expenses</h1>
            <p className="text-sm text-stone-700 mt-1 max-w-xl">
              Track operational costs, supplier payments, and pending expenses.
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenModal}
            className="inline-flex items-center justify-center gap-2 bg-green-800 text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-green-700 transition-colors shadow-sm shrink-0"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Expense
          </button>
        </section>

        {!usesImportedData && (
          <FinancialEmptyBanner
            title="No expenses yet"
            description="Add expenses manually using the button above, or import an Excel workbook with an Expenses sheet."
          />
        )}

        <section>
          <div className="mb-2">
            <h2 className="text-[10px] font-bold uppercase tracking-wider text-green-800">Overview</h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
            <KPICard title="Total Expenses" value={formatCurrency(kpis.totalExpenses)} trend={0} trendText="" trendStatus="neutral" subtitle={usesImportedData ? `${periodLabel} · ${filteredExpenseRecords.length} records` : "Import Excel to populate"} />
            <KPICard title="Paid Expenses" value={formatCurrency(kpis.paidExpenses)} trend={0} trendText="" trendStatus="neutral" subtitle={`${periodLabel} · settled payments`} />
            <KPICard title="Pending Expenses" value={formatCurrency(kpis.pendingExpenses)} trend={0} trendText="" trendStatus="neutral" subtitle={`${periodLabel} · awaiting payment`} />
            <KPICard title="Largest Category" value={kpis.largestExpenseCategory} trend={0} trendText="" trendStatus="neutral" subtitle={`${periodLabel} · by total amount`} />
          </div>
        </section>

        <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-4 sm:p-5 overflow-hidden">
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-2 mb-3">
            <div className="col-span-2 xl:col-span-1">
              <label
                htmlFor="expense-search"
                className="block text-[10px] font-semibold text-stone-700 mb-1"
              >
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400" />
                <input
                  id="expense-search"
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Description, vendor, or category…"
                  className="w-full pl-8 pr-3 py-2 text-xs border border-stone-200 rounded-lg bg-stone-50 focus:outline-none focus:ring-1 focus:ring-green-700 focus:border-green-700"
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="category-filter"
                className="block text-[10px] font-semibold text-stone-700 mb-1"
              >
                Category
              </label>
              <select
                id="category-filter"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full py-2 px-3 text-xs border border-stone-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-green-700"
              >
                <option value={ALL_FILTER}>All categories</option>
                {EXPENSE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="status-filter"
                className="block text-[10px] font-semibold text-stone-700 mb-1"
              >
                Status
              </label>
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full py-2 px-3 text-xs border border-stone-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-green-700"
              >
                <option value={ALL_FILTER}>All statuses</option>
                {EXPENSE_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
            <FinancialPeriodFilter
              id="expense-period"
              period={period}
              onPeriodChange={handlePeriodChange}
              className="col-span-2 xl:col-span-1 w-full"
            />
          </div>

          <h3 className="text-xs font-bold uppercase tracking-wider text-green-800 mb-3">
            All Expenses
            <span className="ml-2 text-stone-600 font-medium normal-case">
              ({filteredExpenses.length})
            </span>
          </h3>

          <div className="rounded-lg border border-stone-100 overflow-hidden">
            <table className="w-full table-fixed text-left border-collapse">
              <colgroup>
                <col className="w-[72px]" />
                <col />
                <col className="w-[96px]" />
                <col className="w-[96px]" />
                <col className="w-[72px]" />
              </colgroup>
              <thead>
                <tr className="border-b-2 border-green-800/20 bg-green-50">
                  {TABLE_COLUMNS.map(({ key, label, sortKey: columnSortKey, align }) => (
                    <th
                      key={key}
                      className={cn(
                        "px-2 py-2 text-[10px] uppercase font-bold text-green-900 tracking-wider",
                        align === "right" && "text-right"
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => handleSort(columnSortKey)}
                        className={cn(
                          "inline-flex items-center gap-0.5 cursor-pointer max-w-full",
                          align === "right" && "ml-auto",
                          "hover:text-green-800 transition-colors",
                          sortKey === columnSortKey && "text-green-800"
                        )}
                        aria-label={`Sort by ${label}${
                          sortKey === columnSortKey
                            ? `, ${sortDirection === "asc" ? "ascending" : "descending"}`
                            : ""
                        }`}
                      >
                        <span className="truncate">{label}</span>
                        <SortIcon column={columnSortKey} sortKey={sortKey} sortDirection={sortDirection} />
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="text-[11px] text-stone-900">
                {sortedExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-2 text-stone-400">
                        <ReceiptText size={32} strokeWidth={1.5} />
                        {sortedExpenses.length === 0 && !usesImportedData ? (
                          <>
                            <p className="text-sm font-medium">No expenses yet</p>
                            <p className="text-xs max-w-sm text-center">
                              Add expenses manually with the button above, or import an Excel workbook.
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="text-sm font-medium">No expenses match your filters</p>
                            <p className="text-xs">Try adjusting the search or filter options above</p>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  sortedExpenses.map((expense) => (
                    <tr
                      key={expense.id}
                      className="border-b border-stone-100 last:border-0 hover:bg-green-50/40 transition-colors"
                    >
                      <td className="px-2 py-2 whitespace-nowrap align-top">
                        {formatDisplayDate(expense.date)}
                      </td>
                      <td className="px-2 py-2 min-w-0 align-top">
                        <div
                          className="font-medium truncate"
                          title={[expense.description, expense.vendor, expense.notes].filter(Boolean).join(" · ")}
                        >
                          {expense.description}
                        </div>
                        <div className="text-[10px] text-stone-600 truncate">
                          {expense.vendor}
                          {expense.paymentMethod ? ` · ${expense.paymentMethod}` : ""}
                        </div>
                      </td>
                      <td className="px-2 py-2 truncate align-top">{expense.category}</td>
                      <td className="px-2 py-2 font-semibold text-right tabular-nums whitespace-nowrap align-top">
                        {formatCurrency(expense.amount)}
                      </td>
                      <td className="px-2 py-2 align-top">
                        <span className={expenseStatusTextClass(expense.status)}>{expense.status}</span>
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
          aria-labelledby="add-expense-title"
        >
          <button
            type="button"
            className="absolute inset-0 bg-stone-900/40"
            aria-label="Close dialog"
            onClick={handleCloseModal}
          />
          <div className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded-xl border border-stone-200 shadow-xl">
            <div className="flex items-center justify-between border-b border-stone-200 px-5 py-4">
              <h2 id="add-expense-title" className="text-sm font-bold text-stone-900">
                Add Expense
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
                        category: e.target.value as ExpenseCategory,
                      }))
                    }
                    className="w-full py-2 px-3 text-xs border border-stone-200 rounded-lg"
                  >
                    {EXPENSE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-stone-500 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  required
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full py-2 px-3 text-xs border border-stone-200 rounded-lg"
                  placeholder="What was this expense for?"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-stone-500 mb-1">
                  Vendor / Payee
                </label>
                <input
                  type="text"
                  required
                  value={form.vendor}
                  onChange={(e) => setForm((f) => ({ ...f, vendor: e.target.value }))}
                  className="w-full py-2 px-3 text-xs border border-stone-200 rounded-lg"
                  placeholder="Supplier or payee name"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-stone-500 mb-1">
                    Amount
                  </label>
                  <input
                    type="number"
                    required
                    min={0.01}
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
                      setForm((f) => ({ ...f, status: e.target.value as ExpensePaymentStatus }))
                    }
                    className="w-full py-2 px-3 text-xs border border-stone-200 rounded-lg"
                  >
                    {EXPENSE_STATUSES.map((status) => (
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
                  {EXPENSE_PAYMENT_METHODS.map((method) => (
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
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

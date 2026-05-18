import { useMemo, useState, type FormEvent } from "react";
import { Plus, Search, X } from "lucide-react";
import { formatCurrency } from "@/data/mockData";
import {
  EXPENSE_CATEGORIES,
  EXPENSE_STATUSES,
  INITIAL_EXPENSES,
  PAYMENT_METHODS,
  type Expense,
  type ExpenseCategory,
  type ExpenseStatus,
  type PaymentMethod,
} from "@/data/expenses";
import { cn } from "@/lib/utils";

const ALL_FILTER = "all";

type ExpenseFormState = Omit<Expense, "id">;

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

function getStatusBadgeClass(status: ExpenseStatus): string {
  if (status === "Paid") return "bg-green-50 text-green-800 border-green-100";
  if (status === "Overdue") return "bg-red-50 text-red-800 border-red-100";
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

function computeLargestCategory(expenses: Expense[]): string {
  if (expenses.length === 0) return "—";
  const totals = new Map<string, number>();
  for (const expense of expenses) {
    totals.set(expense.category, (totals.get(expense.category) ?? 0) + expense.amount);
  }
  let largest = "";
  let max = 0;
  for (const [category, total] of totals) {
    if (total > max) {
      max = total;
      largest = category;
    }
  }
  return largest || "—";
}

export function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>(INITIAL_EXPENSES);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>(ALL_FILTER);
  const [statusFilter, setStatusFilter] = useState<string>(ALL_FILTER);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<ExpenseFormState>(emptyForm);

  const filteredExpenses = useMemo(() => {
    const query = search.trim().toLowerCase();
    return expenses.filter((expense) => {
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
  }, [expenses, search, categoryFilter, statusFilter]);

  const kpis = useMemo(() => {
    const total = expenses.reduce((sum, e) => sum + e.amount, 0);
    const paid = expenses
      .filter((e) => e.status === "Paid")
      .reduce((sum, e) => sum + e.amount, 0);
    const pending = expenses
      .filter((e) => e.status === "Pending")
      .reduce((sum, e) => sum + e.amount, 0);
    return {
      total,
      paid,
      pending,
      largestCategory: computeLargestCategory(expenses),
    };
  }, [expenses]);

  const handleOpenModal = () => {
    setForm(emptyForm());
    setIsModalOpen(true);
  };

  const handleCloseModal = () => setIsModalOpen(false);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!form.description.trim() || !form.vendor.trim() || form.amount <= 0) {
      return;
    }

    const newExpense: Expense = {
      id: `exp-${Date.now()}`,
      ...form,
      description: form.description.trim(),
      vendor: form.vendor.trim(),
      notes: form.notes.trim(),
    };

    setExpenses((prev) => [newExpense, ...prev]);
    setIsModalOpen(false);
    setForm(emptyForm());
  };

  return (
    <>
      <main className="flex flex-col gap-5 p-5 lg:p-6 flex-1 min-h-0 overflow-auto">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold text-stone-900">Expenses</h1>
            <p className="text-xs text-stone-500 mt-1 max-w-xl leading-relaxed">
              Track operational costs, supplier payments, logistics, and pending expenses for your
              agro and export operations.
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenModal}
            className="inline-flex items-center justify-center gap-2 bg-stone-800 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-stone-700 transition-colors shadow-sm shrink-0"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Expense
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white p-3 rounded-xl border border-stone-200 shadow-sm flex flex-col gap-1">
            <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wide">
              Total Expenses
            </span>
            <span className="text-lg font-bold text-stone-900">
              {formatCurrency(kpis.total)}
            </span>
            <span className="text-[10px] text-stone-400">{expenses.length} records</span>
          </div>
          <div className="bg-white p-3 rounded-xl border border-stone-200 shadow-sm flex flex-col gap-1">
            <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wide">
              Paid Expenses
            </span>
            <span className="text-lg font-bold text-green-700">
              {formatCurrency(kpis.paid)}
            </span>
            <span className="text-[10px] text-stone-400">Settled payments</span>
          </div>
          <div className="bg-white p-3 rounded-xl border border-stone-200 shadow-sm flex flex-col gap-1">
            <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wide">
              Pending Expenses
            </span>
            <span className="text-lg font-bold text-amber-700">
              {formatCurrency(kpis.pending)}
            </span>
            <span className="text-[10px] text-stone-400">Awaiting payment</span>
          </div>
          <div className="bg-white p-3 rounded-xl border border-stone-200 shadow-sm flex flex-col gap-1">
            <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wide">
              Largest Expense Category
            </span>
            <span className="text-lg font-bold text-stone-900 truncate">
              {kpis.largestCategory}
            </span>
            <span className="text-[10px] text-stone-400">By total amount</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-4 overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-end gap-3 mb-4">
            <div className="flex-1 min-w-[200px]">
              <label
                htmlFor="expense-search"
                className="block text-[10px] font-bold uppercase tracking-wide text-stone-500 mb-1"
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
            <div className="w-full lg:w-44">
              <label
                htmlFor="category-filter"
                className="block text-[10px] font-bold uppercase tracking-wide text-stone-500 mb-1"
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
            <div className="w-full lg:w-36">
              <label
                htmlFor="status-filter"
                className="block text-[10px] font-bold uppercase tracking-wide text-stone-500 mb-1"
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
          </div>

          <h3 className="text-sm font-bold text-stone-800 uppercase tracking-tight mb-3">
            All Expenses
            <span className="ml-2 text-stone-400 font-medium normal-case">
              ({filteredExpenses.length})
            </span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[960px]">
              <thead className="text-[9px] uppercase text-stone-400 font-bold border-b border-stone-100">
                <tr className="h-8">
                  <th className="font-bold pr-3">Date</th>
                  <th className="font-bold pr-3">Category</th>
                  <th className="font-bold pr-3">Description</th>
                  <th className="font-bold pr-3">Vendor / Payee</th>
                  <th className="font-bold pr-3">Amount</th>
                  <th className="font-bold pr-3">Status</th>
                  <th className="font-bold pr-3">Payment</th>
                  <th className="font-bold">Notes</th>
                </tr>
              </thead>
              <tbody className="text-[11px] text-stone-800">
                {filteredExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-stone-500">
                      No expenses match your search or filters.
                    </td>
                  </tr>
                ) : (
                  filteredExpenses.map((expense) => (
                    <tr
                      key={expense.id}
                      className="h-11 border-b border-stone-50 last:border-0 hover:bg-stone-50 transition-colors"
                    >
                      <td className="pr-3 py-2 whitespace-nowrap">
                        {formatDisplayDate(expense.date)}
                      </td>
                      <td className="pr-3 py-2 whitespace-nowrap">{expense.category}</td>
                      <td className="pr-3 py-2 max-w-[180px] truncate" title={expense.description}>
                        {expense.description}
                      </td>
                      <td className="pr-3 py-2 whitespace-nowrap">{expense.vendor}</td>
                      <td className="pr-3 py-2 font-bold whitespace-nowrap">
                        {expense.currency} {expense.amount.toLocaleString()}
                      </td>
                      <td className="pr-3 py-2">
                        <span
                          className={cn(
                            "inline-flex px-2 py-0.5 text-[9px] font-bold uppercase rounded-full tracking-wider border",
                            getStatusBadgeClass(expense.status)
                          )}
                        >
                          {expense.status}
                        </span>
                      </td>
                      <td className="pr-3 py-2 whitespace-nowrap">{expense.paymentMethod}</td>
                      <td className="py-2 max-w-[140px] truncate text-stone-500" title={expense.notes}>
                        {expense.notes || "—"}
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
                      setForm((f) => ({ ...f, status: e.target.value as ExpenseStatus }))
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
                  {PAYMENT_METHODS.map((method) => (
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

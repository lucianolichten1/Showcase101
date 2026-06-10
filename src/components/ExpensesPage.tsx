import { useCallback, useMemo, useState } from "react";
import { useOpenCreateFromQuery } from "@/hooks/useOpenCreateFromQuery";
import { ArrowDown, ArrowUp, ArrowUpDown, Plus, ReceiptText, Search } from "lucide-react";
import { formatCurrency } from "@/data/mockData";
import { FinancialEmptyBanner } from "@/components/FinancialEmptyBanner";
import { FinancialPeriodFilter } from "@/components/FinancialPeriodFilter";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { ExpenseFormDialog } from "@/components/expenses/ExpenseFormDialog";
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
  EXPENSE_PAGE_COPY,
  EXPENSE_STATUSES,
  expenseCategoryLabel,
  expenseStatusLabel,
  paymentMethodLabel,
} from "@/domains/financial/expenses/labels";
import type {
  ExpenseRecord,
  ExpenseSortDirection,
  ExpenseSortKey,
} from "@/domains/financial/types";
import { cn } from "@/lib/utils";
import { KPICard } from "@/components/KPICard";
import { expenseStatusTextClass } from "@/lib/statusText";

const ALL_FILTER = "all";

function formatDisplayDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");
  const months = [
    "ene", "feb", "mar", "abr", "may", "jun",
    "jul", "ago", "sep", "oct", "nov", "dic",
  ];
  const m = parseInt(month, 10) - 1;
  return `${parseInt(day, 10)} ${months[m] ?? month} ${year}`;
}

const TABLE_COLUMNS: {
  key: ExpenseSortKey | "details" | "actions";
  label: string;
  sortKey?: ExpenseSortKey;
  align?: "right";
}[] = [
  { key: "date", label: EXPENSE_PAGE_COPY.dateColumn, sortKey: "date" },
  { key: "details", label: EXPENSE_PAGE_COPY.expenseColumn, sortKey: "description" },
  { key: "category", label: EXPENSE_PAGE_COPY.categoryColumn, sortKey: "category" },
  { key: "amount", label: EXPENSE_PAGE_COPY.amountColumn, sortKey: "amount", align: "right" },
  { key: "status", label: EXPENSE_PAGE_COPY.statusColumn, sortKey: "status" },
  { key: "actions", label: EXPENSE_PAGE_COPY.actionsColumn },
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
  const {
    setDateRange,
    filteredExpenseRecords,
    expenseRecords,
    kpis,
    saveExpense,
    deleteExpense,
    expensesError,
  } = useCompanyScopedFinancialData();

  const [period, setPeriod] = useState<FinancialPeriod>(DEFAULT_FINANCIAL_PERIOD);
  const periodLabel = getFinancialPeriodLabel(period);

  useSyncFinancialPeriod(period, setDateRange);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>(ALL_FILTER);
  const [statusFilter, setStatusFilter] = useState<string>(ALL_FILTER);
  const [sortKey, setSortKey] = useState<ExpenseSortKey | null>(null);
  const [sortDirection, setSortDirection] = useState<ExpenseSortDirection>("asc");
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ExpenseRecord | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ExpenseRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  const hasAnyExpenses = expenseRecords.length > 0;

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

  const handleOpenCreate = useCallback(() => {
    setEditTarget(null);
    setFormOpen(true);
  }, []);

  useOpenCreateFromQuery("expense", handleOpenCreate);

  const handleOpenEdit = (expense: ExpenseRecord) => {
    setEditTarget(expense);
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    if (saving) return;
    setFormOpen(false);
    setEditTarget(null);
  };

  const handleSave = async (input: Omit<ExpenseRecord, "id">) => {
    setSaving(true);
    try {
      await saveExpense(editTarget?.id ?? null, input);
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
      await deleteExpense(deleteTarget.id);
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

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

  return (
    <>
      <div className="flex flex-1 flex-col text-[#1C1917] font-sans min-h-0 bg-stone-50/40">
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-10 py-4 sm:py-5 space-y-5">
            <section className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 rounded-xl border border-stone-200 bg-white shadow-sm px-4 py-3.5 sm:px-5">
              <div>
                <h1 className="text-2xl font-bold text-stone-900 tracking-tight">
                  {EXPENSE_PAGE_COPY.title}
                </h1>
                <p className="text-sm text-stone-700 mt-1 max-w-xl">
                  {EXPENSE_PAGE_COPY.subtitle}
                </p>
              </div>
              <button
                type="button"
                onClick={handleOpenCreate}
                className="inline-flex items-center justify-center gap-2 bg-green-800 text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-green-700 transition-colors shadow-sm shrink-0"
              >
                <Plus className="h-3.5 w-3.5" />
                {EXPENSE_PAGE_COPY.addButton}
              </button>
            </section>

            {expensesError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-800">
                {expensesError}
              </div>
            )}

            {!hasAnyExpenses && (
              <FinancialEmptyBanner
                title={EXPENSE_PAGE_COPY.noExpensesTitle}
                description={EXPENSE_PAGE_COPY.noExpensesDescription}
              />
            )}

            <section>
              <div className="mb-2">
                <h2 className="text-[10px] font-bold uppercase tracking-wider text-green-800">
                  {EXPENSE_PAGE_COPY.overview}
                </h2>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
                <KPICard
                  title={EXPENSE_PAGE_COPY.totalExpenses}
                  value={formatCurrency(kpis.totalExpenses)}
                  trend={0}
                  trendText=""
                  trendStatus="neutral"
                  subtitle={
                    hasAnyExpenses
                      ? `${periodLabel} · ${filteredExpenseRecords.length} ${EXPENSE_PAGE_COPY.recordsSubtitle}`
                      : "Importa Excel o agrega gastos manualmente"
                  }
                />
                <KPICard
                  title={EXPENSE_PAGE_COPY.paidExpenses}
                  value={formatCurrency(kpis.paidExpenses)}
                  trend={0}
                  trendText=""
                  trendStatus="neutral"
                  subtitle={`${periodLabel} · ${EXPENSE_PAGE_COPY.settledSubtitle}`}
                />
                <KPICard
                  title={EXPENSE_PAGE_COPY.pendingExpenses}
                  value={formatCurrency(kpis.pendingExpenses)}
                  trend={0}
                  trendText=""
                  trendStatus="neutral"
                  subtitle={`${periodLabel} · ${EXPENSE_PAGE_COPY.awaitingSubtitle}`}
                />
                <KPICard
                  title={EXPENSE_PAGE_COPY.largestCategory}
                  value={
                    kpis.largestExpenseCategory === "—"
                      ? "—"
                      : expenseCategoryLabel(
                          kpis.largestExpenseCategory as (typeof EXPENSE_CATEGORIES)[number]
                        )
                  }
                  trend={0}
                  trendText=""
                  trendStatus="neutral"
                  subtitle={`${periodLabel} · ${EXPENSE_PAGE_COPY.byAmountSubtitle}`}
                />
              </div>
            </section>

            <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-4 sm:p-5 overflow-hidden">
              <div className="grid grid-cols-2 xl:grid-cols-4 gap-2 mb-3">
                <div className="col-span-2 xl:col-span-1">
                  <label
                    htmlFor="expense-search"
                    className="block text-[10px] font-semibold text-stone-700 mb-1"
                  >
                    {EXPENSE_PAGE_COPY.search}
                  </label>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400" />
                    <input
                      id="expense-search"
                      type="search"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder={EXPENSE_PAGE_COPY.searchPlaceholder}
                      className="w-full pl-8 pr-3 py-2 text-xs border border-stone-200 rounded-lg bg-stone-50 focus:outline-none focus:ring-1 focus:ring-green-700 focus:border-green-700"
                    />
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="category-filter"
                    className="block text-[10px] font-semibold text-stone-700 mb-1"
                  >
                    {EXPENSE_PAGE_COPY.categoryFilter}
                  </label>
                  <select
                    id="category-filter"
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="w-full py-2 px-3 text-xs border border-stone-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-green-700"
                  >
                    <option value={ALL_FILTER}>{EXPENSE_PAGE_COPY.allCategories}</option>
                    {EXPENSE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {expenseCategoryLabel(cat)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="status-filter"
                    className="block text-[10px] font-semibold text-stone-700 mb-1"
                  >
                    {EXPENSE_PAGE_COPY.statusFilter}
                  </label>
                  <select
                    id="status-filter"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full py-2 px-3 text-xs border border-stone-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-green-700"
                  >
                    <option value={ALL_FILTER}>{EXPENSE_PAGE_COPY.allStatuses}</option>
                    {EXPENSE_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {expenseStatusLabel(status)}
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
                {EXPENSE_PAGE_COPY.allExpenses}
                <span className="ml-2 text-stone-600 font-medium normal-case">
                  ({filteredExpenses.length})
                </span>
              </h3>

              <div className="rounded-lg border border-stone-100 overflow-hidden">
                <table className="w-full table-fixed text-left border-collapse">
                  <colgroup>
                    <col className="w-[80px]" />
                    <col />
                    <col className="w-[100px]" />
                    <col className="w-[88px]" />
                    <col className="w-[76px]" />
                    <col className="w-[88px]" />
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
                          {columnSortKey ? (
                            <button
                              type="button"
                              onClick={() => handleSort(columnSortKey)}
                              className={cn(
                                "inline-flex items-center gap-0.5 cursor-pointer max-w-full",
                                align === "right" && "ml-auto",
                                "hover:text-green-800 transition-colors",
                                sortKey === columnSortKey && "text-green-800"
                              )}
                              aria-label={`Ordenar por ${label}${
                                sortKey === columnSortKey
                                  ? `, ${sortDirection === "asc" ? "ascendente" : "descendente"}`
                                  : ""
                              }`}
                            >
                              <span className="truncate">{label}</span>
                              <SortIcon
                                column={columnSortKey}
                                sortKey={sortKey}
                                sortDirection={sortDirection}
                              />
                            </button>
                          ) : (
                            <span className="truncate">{label}</span>
                          )}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="text-[11px] text-stone-900">
                    {sortedExpenses.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-16 text-center">
                          <div className="flex flex-col items-center gap-2 text-stone-400">
                            <ReceiptText size={32} strokeWidth={1.5} />
                            {!hasAnyExpenses ? (
                              <>
                                <p className="text-sm font-medium">
                                  {EXPENSE_PAGE_COPY.noExpensesTitle}
                                </p>
                                <p className="text-xs max-w-sm text-center">
                                  {EXPENSE_PAGE_COPY.noExpensesDescription}
                                </p>
                              </>
                            ) : (
                              <>
                                <p className="text-sm font-medium">
                                  {EXPENSE_PAGE_COPY.noMatchTitle}
                                </p>
                                <p className="text-xs">{EXPENSE_PAGE_COPY.noMatchDescription}</p>
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
                              title={[expense.description, expense.vendor, expense.notes]
                                .filter(Boolean)
                                .join(" · ")}
                            >
                              {expense.description}
                            </div>
                            <div className="text-[10px] text-stone-600 truncate">
                              {expense.vendor}
                              {expense.paymentMethod
                                ? ` · ${paymentMethodLabel(expense.paymentMethod)}`
                                : ""}
                            </div>
                          </td>
                          <td className="px-2 py-2 truncate align-top">
                            {expenseCategoryLabel(expense.category)}
                          </td>
                          <td className="px-2 py-2 font-semibold text-right tabular-nums whitespace-nowrap align-top">
                            {formatCurrency(expense.amount)}
                          </td>
                          <td className="px-2 py-2 align-top">
                            <span className={expenseStatusTextClass(expense.status)}>
                              {expenseStatusLabel(expense.status)}
                            </span>
                          </td>
                          <td className="px-2 py-2 align-top">
                            <div className="flex flex-col gap-1">
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(expense)}
                                className="text-left text-[10px] font-semibold text-green-800 hover:text-green-900"
                              >
                                {EXPENSE_PAGE_COPY.edit}
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteTarget(expense)}
                                className="text-left text-[10px] font-semibold text-red-700 hover:text-red-800"
                              >
                                {EXPENSE_PAGE_COPY.delete}
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
          </div>
        </div>
      </div>

      <ExpenseFormDialog
        open={formOpen}
        expense={editTarget}
        saving={saving}
        onClose={handleCloseForm}
        onSave={handleSave}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={EXPENSE_PAGE_COPY.deleteTitle}
        message={
          deleteTarget
            ? EXPENSE_PAGE_COPY.deleteMessage(deleteTarget.description)
            : ""
        }
        confirmLabel={EXPENSE_PAGE_COPY.deleteConfirm}
        cancelLabel="Cancelar"
        destructive
        loading={deleting}
        onConfirm={() => void handleConfirmDelete()}
        onClose={() => !deleting && setDeleteTarget(null)}
      />
    </>
  );
}

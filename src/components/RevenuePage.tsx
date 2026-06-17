import { useCallback, useMemo, useState } from "react";
import { useOpenCreateFromQuery } from "@/hooks/useOpenCreateFromQuery";
import { ArrowDown, ArrowUp, ArrowUpDown, Plus, Search, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/data/mockData";
import { FinancialEmptyBanner } from "@/components/FinancialEmptyBanner";
import { FinancialPeriodFilter } from "@/components/FinancialPeriodFilter";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { RevenueFormDialog } from "@/components/revenue/RevenueFormDialog";
import { isActiveRevenue, sortRevenueRecords } from "@/domains/financial/calculations";
import { useSyncFinancialPeriod } from "@/domains/financial/hooks";
import { useCompanyScopedFinancialData } from "@/domains/company/useCompanyScopedFinancialData";
import {
  DEFAULT_FINANCIAL_PERIOD,
  getDateRangeForPeriod,
  getFinancialPeriodLabel,
  type FinancialPeriod,
} from "@/domains/financial/period";
import {
  REVENUE_CATEGORIES,
  REVENUE_PAGE_COPY,
  REVENUE_STATUSES,
  paymentMethodLabel,
  revenueCategoryLabel,
  revenueStatusLabel,
} from "@/domains/financial/revenue/labels";
import type {
  RevenueRecord,
  RevenueSortDirection,
  RevenueSortKey,
} from "@/domains/financial/types";
import { cn } from "@/lib/utils";
import { KPICard } from "@/components/KPICard";
import { revenueTableStatusClass } from "@/lib/statusText";

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
  key: RevenueSortKey | "actions";
  label: string;
  sortKey?: RevenueSortKey;
  align?: "right";
}[] = [
  { key: "date", label: REVENUE_PAGE_COPY.dateColumn, sortKey: "date" },
  { key: "sourceClient", label: REVENUE_PAGE_COPY.sourceColumn, sortKey: "sourceClient" },
  { key: "productService", label: REVENUE_PAGE_COPY.productColumn, sortKey: "productService" },
  { key: "category", label: REVENUE_PAGE_COPY.categoryColumn, sortKey: "category" },
  { key: "amount", label: REVENUE_PAGE_COPY.amountColumn, sortKey: "amount", align: "right" },
  { key: "status", label: REVENUE_PAGE_COPY.statusColumn, sortKey: "status" },
  { key: "paymentMethod", label: REVENUE_PAGE_COPY.paymentColumn, sortKey: "paymentMethod" },
  { key: "invoiceNumber", label: REVENUE_PAGE_COPY.invoiceColumn, sortKey: "invoiceNumber" },
  { key: "actions", label: REVENUE_PAGE_COPY.actionsColumn },
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
  const {
    setDateRange,
    filteredRevenueRecords,
    revenueRecords,
    kpis,
    saveRevenue,
    deleteRevenue,
    revenueError,
  } = useCompanyScopedFinancialData();

  const [period, setPeriod] = useState<FinancialPeriod>(DEFAULT_FINANCIAL_PERIOD);
  const periodLabel = getFinancialPeriodLabel(period);

  useSyncFinancialPeriod(period, setDateRange);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>(ALL_FILTER);
  const [statusFilter, setStatusFilter] = useState<string>(ALL_FILTER);
  const [sortKey, setSortKey] = useState<RevenueSortKey | null>(null);
  const [sortDirection, setSortDirection] = useState<RevenueSortDirection>("asc");
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<RevenueRecord | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<RevenueRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  const hasAnyRevenue = revenueRecords.length > 0;

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

  const handleOpenCreate = useCallback(() => {
    setEditTarget(null);
    setFormOpen(true);
  }, []);

  useOpenCreateFromQuery("revenue", handleOpenCreate);

  const handleOpenEdit = (record: RevenueRecord) => {
    setEditTarget(record);
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    if (saving) return;
    setFormOpen(false);
    setEditTarget(null);
  };

  const handleSave = async (input: Omit<RevenueRecord, "id">) => {
    setSaving(true);
    try {
      await saveRevenue(editTarget?.id ?? null, input);
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
      await deleteRevenue(deleteTarget.id);
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

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

  return (
    <>
      <div className="flex flex-1 flex-col text-[#1C1917] font-sans min-h-0 bg-stone-50/40">
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-10 py-4 sm:py-5 space-y-5">
            <section className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 rounded-xl border border-stone-200 bg-white shadow-sm px-4 py-3.5 sm:px-5">
              <div>
                <h1 className="text-2xl font-bold text-stone-900 tracking-tight">
                  {REVENUE_PAGE_COPY.title}
                </h1>
                <p className="text-sm text-stone-700 mt-1 max-w-xl">
                  {REVENUE_PAGE_COPY.subtitle}
                </p>
              </div>
              <button
                type="button"
                onClick={handleOpenCreate}
                className="inline-flex items-center justify-center gap-2 bg-green-800 text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-green-700 transition-colors shadow-sm shrink-0"
              >
                <Plus className="h-3.5 w-3.5" />
                {REVENUE_PAGE_COPY.addButton}
              </button>
            </section>

            {revenueError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-800">
                {revenueError}
              </div>
            )}

            {!hasAnyRevenue && (
              <FinancialEmptyBanner
                title={REVENUE_PAGE_COPY.noRevenueTitle}
                description={REVENUE_PAGE_COPY.noRevenueDescription}
              />
            )}

            <section>
              <div className="mb-2">
                <h2 className="text-[10px] font-bold uppercase tracking-wider text-green-800">
                  {REVENUE_PAGE_COPY.overview}
                </h2>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
                <KPICard
                  title={REVENUE_PAGE_COPY.totalRevenue}
                  value={formatCurrency(kpis.totalRevenue)}
                  trend={0}
                  trendText=""
                  trendStatus="neutral"
                  subtitle={
                    hasAnyRevenue
                      ? `${periodLabel} · ${filteredRevenueRecords.filter(isActiveRevenue).length} ${REVENUE_PAGE_COPY.recordsSubtitle}`
                      : "Importa Excel o agrega ingresos manualmente"
                  }
                />
                <KPICard
                  title={REVENUE_PAGE_COPY.collectedRevenue}
                  value={formatCurrency(kpis.collectedRevenue)}
                  trend={0}
                  trendText=""
                  trendStatus="neutral"
                  subtitle={`${periodLabel} · ${REVENUE_PAGE_COPY.paymentsReceived}`}
                />
                <KPICard
                  title={REVENUE_PAGE_COPY.pendingRevenue}
                  value={formatCurrency(kpis.pendingRevenue)}
                  trend={0}
                  trendText=""
                  trendStatus="neutral"
                  subtitle={`${periodLabel} · ${REVENUE_PAGE_COPY.awaitingCollection}`}
                />
                <KPICard
                  title={REVENUE_PAGE_COPY.topSource}
                  value={
                    kpis.topRevenueCategory === "—"
                      ? "—"
                      : revenueCategoryLabel(
                          kpis.topRevenueCategory as (typeof REVENUE_CATEGORIES)[number]
                        )
                  }
                  trend={0}
                  trendText=""
                  trendStatus="neutral"
                  subtitle={`${periodLabel} · ${REVENUE_PAGE_COPY.byCategory}`}
                />
              </div>
            </section>

            <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-4 sm:p-5 overflow-hidden">
              <div className="grid grid-cols-2 xl:grid-cols-4 gap-2 mb-3">
                <div className="col-span-2 xl:col-span-1">
                  <label
                    htmlFor="revenue-search"
                    className="block text-[10px] font-semibold text-stone-700 mb-1"
                  >
                    {REVENUE_PAGE_COPY.search}
                  </label>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400" />
                    <input
                      id="revenue-search"
                      type="search"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder={REVENUE_PAGE_COPY.searchPlaceholder}
                      className="w-full pl-8 pr-3 py-2 text-xs border border-stone-200 rounded-lg bg-stone-50 focus:outline-none focus:ring-1 focus:ring-green-700 focus:border-green-700"
                    />
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="revenue-category-filter"
                    className="block text-[10px] font-semibold text-stone-700 mb-1"
                  >
                    {REVENUE_PAGE_COPY.categoryFilter}
                  </label>
                  <select
                    id="revenue-category-filter"
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="w-full py-2 px-3 text-xs border border-stone-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-green-700"
                  >
                    <option value={ALL_FILTER}>{REVENUE_PAGE_COPY.allCategories}</option>
                    {REVENUE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {revenueCategoryLabel(cat)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="revenue-status-filter"
                    className="block text-[10px] font-semibold text-stone-700 mb-1"
                  >
                    {REVENUE_PAGE_COPY.statusFilter}
                  </label>
                  <select
                    id="revenue-status-filter"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full py-2 px-3 text-xs border border-stone-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-green-700"
                  >
                    <option value={ALL_FILTER}>{REVENUE_PAGE_COPY.allStatuses}</option>
                    {REVENUE_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {revenueStatusLabel(status)}
                      </option>
                    ))}
                  </select>
                </div>
                <FinancialPeriodFilter
                  id="revenue-period"
                  period={period}
                  onPeriodChange={handlePeriodChange}
                  className="col-span-2 xl:col-span-1 w-full"
                />
              </div>

              <h3 className="text-xs font-bold uppercase tracking-wider text-green-800 mb-3">
                {REVENUE_PAGE_COPY.allRevenue}
                <span className="ml-2 text-stone-600 font-medium normal-case">
                  ({filteredRevenue.length})
                </span>
              </h3>

              <div className="rounded-lg border border-stone-100 overflow-x-auto">
                <table className="w-full table-fixed text-left border-collapse min-w-[960px]">
                  <colgroup>
                    <col className="w-[80px]" />
                    <col className="w-[110px]" />
                    <col />
                    <col className="w-[100px]" />
                    <col className="w-[88px]" />
                    <col className="w-[76px]" />
                    <col className="w-[100px]" />
                    <col className="w-[88px]" />
                    <col className="w-[72px]" />
                  </colgroup>
                  <thead>
                    <tr className="border-b-2 border-stone-200 bg-stone-50">
                      {TABLE_COLUMNS.map(({ key, label, sortKey: columnSortKey, align }) => (
                        <th
                          key={key}
                          className={cn(
                            "px-2 py-2 text-[10px] uppercase font-bold text-stone-800 tracking-wider",
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
                                "hover:text-stone-900 transition-colors",
                                sortKey === columnSortKey && "text-stone-900"
                              )}
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
                    {sortedRevenue.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-16 text-center">
                          <div className="flex flex-col items-center gap-2 text-stone-400">
                            <TrendingUp size={32} strokeWidth={1.5} />
                            {!hasAnyRevenue ? (
                              <>
                                <p className="text-sm font-medium">
                                  {REVENUE_PAGE_COPY.noRevenueTitle}
                                </p>
                                <p className="text-xs max-w-sm text-center">
                                  {REVENUE_PAGE_COPY.noRevenueDescription}
                                </p>
                              </>
                            ) : (
                              <>
                                <p className="text-sm font-medium">
                                  {REVENUE_PAGE_COPY.noMatchTitle}
                                </p>
                                <p className="text-xs">{REVENUE_PAGE_COPY.noMatchDescription}</p>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ) : (
                      sortedRevenue.map((record) => (
                        <tr
                          key={record.id}
                          className="border-b border-stone-100 last:border-0 hover:bg-stone-50/80 transition-colors"
                        >
                          <td className="px-2 py-2 whitespace-nowrap align-top">
                            {formatDisplayDate(record.date)}
                          </td>
                          <td className="px-2 py-2 truncate align-top" title={record.sourceClient}>
                            {record.sourceClient}
                          </td>
                          <td className="px-2 py-2 min-w-0 align-top">
                            <div className="font-medium truncate" title={record.productService}>
                              {record.productService}
                            </div>
                            {record.notes && (
                              <div className="text-[10px] text-stone-600 truncate" title={record.notes}>
                                {record.notes}
                              </div>
                            )}
                          </td>
                          <td className="px-2 py-2 truncate align-top">
                            {revenueCategoryLabel(record.category)}
                          </td>
                          <td className="px-2 py-2 font-semibold text-right tabular-nums whitespace-nowrap align-top">
                            {formatCurrency(record.amount)}
                          </td>
                          <td className="px-2 py-2 align-top">
                            <span className={revenueTableStatusClass(record.status)}>
                              {revenueStatusLabel(record.status)}
                            </span>
                          </td>
                          <td className="px-2 py-2 truncate align-top">
                            {paymentMethodLabel(record.paymentMethod)}
                          </td>
                          <td className="px-2 py-2 font-medium truncate align-top">
                            {record.invoiceNumber}
                          </td>
                          <td className="px-2 py-2 align-top">
                            <div className="flex flex-col gap-1">
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(record)}
                                className="text-left text-[10px] font-semibold text-stone-700 hover:text-stone-900"
                              >
                                {REVENUE_PAGE_COPY.edit}
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteTarget(record)}
                                className="text-left text-[10px] font-semibold text-red-700 hover:text-red-800"
                              >
                                {REVENUE_PAGE_COPY.delete}
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

      <RevenueFormDialog
        open={formOpen}
        revenue={editTarget}
        saving={saving}
        onClose={handleCloseForm}
        onSave={handleSave}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={REVENUE_PAGE_COPY.deleteTitle}
        message={
          deleteTarget
            ? REVENUE_PAGE_COPY.deleteMessage(
                deleteTarget.productService || deleteTarget.invoiceNumber
              )
            : ""
        }
        confirmLabel={REVENUE_PAGE_COPY.deleteConfirm}
        cancelLabel="Cancelar"
        destructive
        loading={deleting}
        onConfirm={() => void handleConfirmDelete()}
        onClose={() => !deleting && setDeleteTarget(null)}
      />
    </>
  );
}

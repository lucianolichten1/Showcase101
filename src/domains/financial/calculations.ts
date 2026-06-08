import {
  DEMO_FINANCIAL_YEAR,
  DEMO_PL_MONTH_LABELS,
  DEMO_YTD_END_MONTH,
  FINANCIAL_ALL_DATE_RANGE,
  getDateRangeForPeriod,
  type FinancialPeriod,
} from "./period";
import type {
  DateRange,
  ExpenseRecord,
  ExpenseSortDirection,
  ExpenseSortKey,
  FinancialKPIs,
  MonthlyFinancialSummary,
  ReceivableRecord,
  RevenueRecord,
  RevenueSortDirection,
  RevenueSortKey,
} from "./types";

export type ChartMonthBucket = { isoPrefix: string; label: string };

/** Maximum month columns shown on the dashboard financial chart */
export const MAX_CHART_MONTH_BUCKETS = 12;

function limitToLastChartMonths(
  buckets: ChartMonthBucket[],
  max = MAX_CHART_MONTH_BUCKETS
): ChartMonthBucket[] {
  if (buckets.length <= max) return buckets;
  return buckets.slice(-max);
}

/** Dashboard chart X-axis: month number and two-digit year (e.g. 03/25). */
export function formatChartAxisMonthLabel(
  isoPrefix: string,
  fallbackLabel: string
): string {
  const monthMatch = /^(\d{4})-(\d{2})$/.exec(isoPrefix);
  if (monthMatch) {
    return `${monthMatch[2]}/${monthMatch[1].slice(-2)}`;
  }
  return fallbackLabel;
}

export type ChartWeekBucket = {
  startDate: string;
  endDate: string;
  label: string;
};

const SHORT_MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function chartBucket(
  year: number,
  month: number,
  options?: { includeYearInLabel?: boolean }
): ChartMonthBucket {
  const short = SHORT_MONTH_LABELS[month - 1] ?? `${year}-${pad2(month)}`;
  return {
    isoPrefix: `${year}-${pad2(month)}`,
    label: options?.includeYearInLabel ? `${short} ${year}` : short,
  };
}

function datesSpanMultipleYears(dates: string[]): boolean {
  const years = new Set(dates.map((d) => d.slice(0, 4)).filter(Boolean));
  return years.size > 1;
}

function lastDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function isDateWithinInclusive(isoDate: string, startDate: string, endDate: string): boolean {
  return isoDate >= startDate && isoDate <= endDate;
}

/** Splits a calendar month into week buckets (days 1–7, 8–14, 15–21, 22–28, 29–end) */
export function getChartWeekBuckets(year: number, month: number): ChartWeekBucket[] {
  const lastDay = lastDayOfMonth(year, month);
  const weekStarts = [1, 8, 15, 22, 29];
  const buckets: ChartWeekBucket[] = [];

  for (const startDay of weekStarts) {
    if (startDay > lastDay) break;
    const endDay = Math.min(startDay + 6, lastDay);
    buckets.push({
      startDate: `${year}-${pad2(month)}-${pad2(startDay)}`,
      endDate: `${year}-${pad2(month)}-${pad2(endDay)}`,
      label: `${startDay}–${endDay}`,
    });
  }

  return buckets;
}

/** All demo months with financial data (Jan–Jun 2026) */
export function getAllDemoChartMonthBuckets(): ChartMonthBucket[] {
  return DEMO_PL_MONTH_LABELS.map((label, index) => ({
    isoPrefix: `${DEMO_FINANCIAL_YEAR}-${pad2(index + 1)}`,
    label,
  }));
}

/** Month buckets for charts based on the selected financial period */
export function getChartMonthBuckets(period: FinancialPeriod): ChartMonthBucket[] {
  if (period.kind === "month") {
    return [chartBucket(period.year, period.month)];
  }
  if (period.kind === "ytd") {
    return limitToLastChartMonths(
      Array.from({ length: DEMO_YTD_END_MONTH }, (_, i) =>
        chartBucket(DEMO_FINANCIAL_YEAR, i + 1)
      )
    );
  }
  return limitToLastChartMonths(getAllDemoChartMonthBuckets());
}

/** Month buckets for an arbitrary inclusive date range (fills gaps with zero totals) */
export function getChartMonthBucketsForDateRange(
  range: DateRange,
  options?: { includeYearInLabel?: boolean }
): ChartMonthBucket[] {
  if (!range.startDate && !range.endDate) {
    return getAllDemoChartMonthBuckets();
  }
  if (!range.startDate || !range.endDate) {
    return getAllDemoChartMonthBuckets();
  }

  const startYear = Number(range.startDate.slice(0, 4));
  const startMonth = Number(range.startDate.slice(5, 7));
  const endYear = Number(range.endDate.slice(0, 4));
  const endMonth = Number(range.endDate.slice(5, 7));

  const includeYearInLabel =
    options?.includeYearInLabel ?? startYear !== endYear;

  const buckets: ChartMonthBucket[] = [];
  let year = startYear;
  let month = startMonth;

  while (year < endYear || (year === endYear && month <= endMonth)) {
    buckets.push(chartBucket(year, month, { includeYearInLabel }));
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }

  const result = buckets.length > 0 ? buckets : getAllDemoChartMonthBuckets();
  return limitToLastChartMonths(result);
}

// ─── Date range ───────────────────────────────────────────────────────────────

export function isWithinDateRange(isoDate: string, range: DateRange): boolean {
  if (range.startDate && isoDate < range.startDate) return false;
  if (range.endDate && isoDate > range.endDate) return false;
  return true;
}

export function filterRecordsByDateRange<T extends { date: string }>(
  records: T[],
  range: DateRange
): T[] {
  if (!range.startDate && !range.endDate) return records;
  return records.filter((r) => isWithinDateRange(r.date, range));
}

/**
 * Date range used for KPI cards and charts.
 * For imported data on "All", aligns to the chart's last-12-months window so totals match.
 */
export function resolveFinancialViewDateRange(
  period: FinancialPeriod,
  revenueRecords: RevenueRecord[],
  expenseRecords: ExpenseRecord[],
  options?: { useChartAlignedAllPeriod?: boolean }
): DateRange {
  const base = getDateRangeForPeriod(period);
  if (period.kind !== "all" || !options?.useChartAlignedAllPeriod) {
    return base;
  }

  const dates = [
    ...revenueRecords.map((r) => r.date),
    ...expenseRecords.map((e) => e.date),
  ];
  const buckets = getChartMonthBucketsFromRecordDates(dates, { emptyWhenNoDates: true });
  if (buckets.length === 0) return base;

  const startPrefix = buckets[0].isoPrefix;
  const endPrefix = buckets[buckets.length - 1].isoPrefix;
  const [endYear, endMonth] = endPrefix.split("-").map(Number);
  const endDay = lastDayOfMonth(endYear, endMonth);

  return {
    startDate: `${startPrefix}-01`,
    endDate: `${endPrefix}-${pad2(endDay)}`,
  };
}

/** Same window as dashboard chart/KPIs when period is "all" and data is imported. */
export function resolveImportedAllPeriodDateRange(
  revenueRecords: RevenueRecord[],
  expenseRecords: ExpenseRecord[]
): DateRange {
  const aligned = resolveFinancialViewDateRange(
    { kind: "all" },
    revenueRecords,
    expenseRecords,
    { useChartAlignedAllPeriod: true }
  );
  if (aligned.startDate && aligned.endDate) return aligned;
  return FINANCIAL_ALL_DATE_RANGE;
}

/** Short month abbreviations used in receivable dueDate display (e.g. "May 10") */
const RECEIVABLE_DUE_MONTH_ABBREV = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

/** Converts AR display due dates to ISO; demo data uses calendar year 2026 */
export function receivableDueDateToIso(
  dueDate: string,
  year = 2026
): string | null {
  const [monthStr, dayStr] = dueDate.trim().split(/\s+/);
  const monthIdx = RECEIVABLE_DUE_MONTH_ABBREV.indexOf(
    monthStr as (typeof RECEIVABLE_DUE_MONTH_ABBREV)[number]
  );
  const day = parseInt(dayStr ?? "", 10);
  if (monthIdx === -1 || Number.isNaN(day)) return null;
  const month = String(monthIdx + 1).padStart(2, "0");
  const dayPadded = String(day).padStart(2, "0");
  return `${year}-${month}-${dayPadded}`;
}

export function filterReceivablesByDateRange(
  records: ReceivableRecord[],
  range: DateRange
): ReceivableRecord[] {
  if (!range.startDate && !range.endDate) return records;
  return records.filter((r) => {
    const iso = receivableDueDateToIso(r.dueDate);
    return iso !== null && isWithinDateRange(iso, range);
  });
}

// ─── Revenue ──────────────────────────────────────────────────────────────────

export function isActiveRevenue(record: RevenueRecord): boolean {
  return record.status !== "Cancelled";
}

export function calculateTotalRevenue(records: RevenueRecord[]): number {
  return records.filter(isActiveRevenue).reduce((sum, r) => sum + r.amount, 0);
}

export function calculateTotalCost(records: RevenueRecord[]): number {
  return records
    .filter(isActiveRevenue)
    .reduce((sum, r) => sum + (r.cost ?? 0), 0);
}

export function calculateCollectedRevenue(records: RevenueRecord[]): number {
  return records
    .filter((r) => isActiveRevenue(r) && r.status === "Collected")
    .reduce((sum, r) => sum + r.amount, 0);
}

export function calculatePendingRevenue(records: RevenueRecord[]): number {
  return records
    .filter((r) => isActiveRevenue(r) && r.status === "Pending")
    .reduce((sum, r) => sum + r.amount, 0);
}

export function calculateOverdueRevenue(records: RevenueRecord[]): number {
  return records
    .filter((r) => isActiveRevenue(r) && r.status === "Overdue")
    .reduce((sum, r) => sum + r.amount, 0);
}

export function calculateTopRevenueCategory(records: RevenueRecord[]): string {
  const active = records.filter(isActiveRevenue);
  if (active.length === 0) return "—";
  const totals = new Map<string, number>();
  for (const record of active) {
    totals.set(record.category, (totals.get(record.category) ?? 0) + record.amount);
  }
  let top = "";
  let max = 0;
  for (const [category, total] of totals) {
    if (total > max) {
      max = total;
      top = category;
    }
  }
  return top || "—";
}

// ─── Expenses ─────────────────────────────────────────────────────────────────

export function calculateTotalExpenses(records: ExpenseRecord[]): number {
  return records.reduce((sum, e) => sum + e.amount, 0);
}

export function calculatePaidExpenses(records: ExpenseRecord[]): number {
  return records.filter((e) => e.status === "Paid").reduce((sum, e) => sum + e.amount, 0);
}

export function calculatePendingExpenses(records: ExpenseRecord[]): number {
  return records
    .filter((e) => e.status === "Pending")
    .reduce((sum, e) => sum + e.amount, 0);
}

export function calculateOverdueExpenses(records: ExpenseRecord[]): number {
  return records
    .filter((e) => e.status === "Overdue")
    .reduce((sum, e) => sum + e.amount, 0);
}

export function calculateLargestExpenseCategory(records: ExpenseRecord[]): string {
  if (records.length === 0) return "—";
  const totals = new Map<string, number>();
  for (const expense of records) {
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

// ─── Profit ───────────────────────────────────────────────────────────────────

export function calculateGrossProfit(revenue: RevenueRecord[]): number {
  return calculateTotalRevenue(revenue) - calculateTotalCost(revenue);
}

export function calculateNetProfit(
  revenue: RevenueRecord[],
  expenses: ExpenseRecord[]
): number {
  return (
    calculateTotalRevenue(revenue) -
    calculateTotalCost(revenue) -
    calculateTotalExpenses(expenses)
  );
}

export function calculateProfitMargin(
  revenue: RevenueRecord[],
  expenses: ExpenseRecord[]
): number {
  const total = calculateTotalRevenue(revenue);
  if (total <= 0) return 0;
  return Math.round((calculateNetProfit(revenue, expenses) / total) * 100);
}

/** Month buckets derived from actual record dates (for imported data). */
export function getChartMonthBucketsFromRecordDates(
  dates: string[],
  options?: { emptyWhenNoDates?: boolean }
): ChartMonthBucket[] {
  if (dates.length === 0) {
    return options?.emptyWhenNoDates ? [] : getAllDemoChartMonthBuckets();
  }
  const sorted = [...dates].sort();
  const startMonth = sorted[0].slice(0, 7);
  const endMonth = sorted[sorted.length - 1].slice(0, 7);
  const [sy, sm] = startMonth.split("-").map(Number);
  const [ey, em] = endMonth.split("-").map(Number);
  const endDay = lastDayOfMonth(ey, em);
  const fullRange = getChartMonthBucketsForDateRange(
    {
      startDate: `${sy}-${pad2(sm)}-01`,
      endDate: `${ey}-${pad2(em)}-${pad2(endDay)}`,
    },
    { includeYearInLabel: datesSpanMultipleYears(dates) }
  );
  return limitToLastChartMonths(fullRange);
}

function resolveChartMonthBuckets(
  period: FinancialPeriod,
  revenueRecords: RevenueRecord[],
  expenseRecords: ExpenseRecord[],
  useDataDrivenMonths: boolean
): ChartMonthBucket[] {
  if (period.kind === "month") {
    return getChartWeekBuckets(period.year, period.month).map((w) => ({
      isoPrefix: w.startDate,
      label: w.label,
    }));
  }

  const allDates = [
    ...revenueRecords.map((r) => r.date),
    ...expenseRecords.map((e) => e.date),
  ];
  const spansMultipleYears = datesSpanMultipleYears(allDates);

  if (useDataDrivenMonths && period.kind === "all") {
    return getChartMonthBucketsFromRecordDates(allDates, {
      emptyWhenNoDates: true,
    });
  }

  if (useDataDrivenMonths && period.kind === "ytd") {
    const range = getDateRangeForPeriod(period);
    return getChartMonthBucketsForDateRange(range, {
      includeYearInLabel: spansMultipleYears,
    });
  }

  return getChartMonthBuckets(period);
}

function aggregateBucket(
  scopedRevenue: RevenueRecord[],
  scopedExpenses: ExpenseRecord[],
  matchRevenue: (r: RevenueRecord) => boolean,
  matchExpense: (e: ExpenseRecord) => boolean,
  label: string
): MonthlyFinancialSummary {
  const revenue = scopedRevenue
    .filter((r) => isActiveRevenue(r) && matchRevenue(r))
    .reduce((sum, r) => sum + r.amount, 0);
  const cost = scopedRevenue
    .filter((r) => isActiveRevenue(r) && matchRevenue(r))
    .reduce((sum, r) => sum + (r.cost ?? 0), 0);
  const expenses = scopedExpenses
    .filter((e) => matchExpense(e))
    .reduce((sum, e) => sum + e.amount, 0);
  return {
    month: label,
    revenue,
    cost,
    expenses,
    profit: revenue - cost - expenses,
  };
}

// ─── Monthly aggregation (charts) ─────────────────────────────────────────────

/** Groups revenue and expense records by calendar month or week for charting */
export function computeMonthlyFinancials(
  revenueRecords: RevenueRecord[],
  expenseRecords: ExpenseRecord[],
  period: FinancialPeriod,
  options?: { useDataDrivenMonths?: boolean }
): MonthlyFinancialSummary[] {
  const useDataDrivenMonths = options?.useDataDrivenMonths ?? false;
  const dateRange = resolveFinancialViewDateRange(
    period,
    revenueRecords,
    expenseRecords,
    { useChartAlignedAllPeriod: useDataDrivenMonths }
  );
  const scopedRevenue = filterRecordsByDateRange(revenueRecords, dateRange);
  const scopedExpenses = filterRecordsByDateRange(expenseRecords, dateRange);

  if (period.kind === "month") {
    const weekBuckets = getChartWeekBuckets(period.year, period.month);
    return weekBuckets.map(({ startDate, endDate, label }) =>
      aggregateBucket(
        scopedRevenue,
        scopedExpenses,
        (r) => isDateWithinInclusive(r.date, startDate, endDate),
        (e) => isDateWithinInclusive(e.date, startDate, endDate),
        label
      )
    );
  }

  const buckets = resolveChartMonthBuckets(
    period,
    revenueRecords,
    expenseRecords,
    useDataDrivenMonths
  );

  return buckets.map(({ isoPrefix, label }) =>
    aggregateBucket(
      scopedRevenue,
      scopedExpenses,
      (r) => r.date.startsWith(isoPrefix),
      (e) => e.date.startsWith(isoPrefix),
      formatChartAxisMonthLabel(isoPrefix, label)
    )
  );
}

// ─── Receivables ──────────────────────────────────────────────────────────────

export function getReceivableBalance(record: ReceivableRecord): number {
  return record.amount - record.amountPaid;
}

export function isActiveReceivable(record: ReceivableRecord): boolean {
  return (
    record.status === "Pending" ||
    record.status === "Partially Paid" ||
    record.status === "Overdue"
  );
}

export function calculateReceivablesTotalOutstanding(
  records: ReceivableRecord[]
): number {
  return records
    .filter(isActiveReceivable)
    .reduce((sum, r) => sum + getReceivableBalance(r), 0);
}

export function calculateReceivablesOverdueAmount(records: ReceivableRecord[]): number {
  return records
    .filter((r) => r.status === "Overdue")
    .reduce((sum, r) => sum + getReceivableBalance(r), 0);
}

export function calculateReceivablesInvoicesOverdue(records: ReceivableRecord[]): number {
  return records.filter((r) => r.status === "Overdue").length;
}

export function calculateReceivablesCollectionRate(records: ReceivableRecord[]): number {
  const totalInvoiced = records.reduce((sum, r) => sum + r.amount, 0);
  const totalPaid = records.reduce((sum, r) => sum + r.amountPaid, 0);
  return totalInvoiced > 0 ? Math.round((totalPaid / totalInvoiced) * 100) : 0;
}

export function calculateAverageDaysOverdue(records: ReceivableRecord[]): number {
  const overdue = records.filter((r) => r.status === "Overdue");
  if (overdue.length === 0) return 0;
  return Math.round(
    overdue.reduce((sum, r) => sum + r.overdueDays, 0) / overdue.length
  );
}

/** Aggregate KPI object for hook consumers */
export function computeFinancialKPIs(
  revenue: RevenueRecord[],
  expenses: ExpenseRecord[],
  receivables: ReceivableRecord[],
  options?: { usesImportedData?: boolean }
): FinancialKPIs {
  const totalRevenue = calculateTotalRevenue(revenue);
  const totalCost = calculateTotalCost(revenue);
  const grossProfit = totalRevenue - totalCost;
  const totalExpenses = calculateTotalExpenses(expenses);
  const totalCosts = totalCost + totalExpenses;
  const netProfit = grossProfit - totalExpenses;

  return {
    totalRevenue,
    collectedRevenue: calculateCollectedRevenue(revenue),
    pendingRevenue: calculatePendingRevenue(revenue),
    overdueRevenue: calculateOverdueRevenue(revenue),
    topRevenueCategory: calculateTopRevenueCategory(revenue),
    totalCost,
    grossProfit,
    totalExpenses,
    totalCosts,
    paidExpenses: calculatePaidExpenses(expenses),
    pendingExpenses: calculatePendingExpenses(expenses),
    overdueExpenses: calculateOverdueExpenses(expenses),
    largestExpenseCategory: calculateLargestExpenseCategory(expenses),
    netProfit,
    profitMargin:
      totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : 0,
    receivablesTotalOutstanding: calculateReceivablesTotalOutstanding(receivables),
    receivablesOverdueAmount: calculateReceivablesOverdueAmount(receivables),
    receivablesInvoicesOverdue: calculateReceivablesInvoicesOverdue(receivables),
    receivablesCollectionRate: calculateReceivablesCollectionRate(receivables),
    usesImportedData: options?.usesImportedData ?? false,
  };
}

// ─── Sorting (used by Revenue / Expenses pages) ───────────────────────────────

function compareText(a: string, b: string): number {
  return a.localeCompare(b, undefined, { sensitivity: "base" });
}

export function sortRevenueRecords(
  records: RevenueRecord[],
  sortKey: RevenueSortKey,
  direction: RevenueSortDirection
): RevenueRecord[] {
  const sign = direction === "asc" ? 1 : -1;

  return [...records].sort((a, b) => {
    let result = 0;

    switch (sortKey) {
      case "date": {
        const aTime = new Date(`${a.date}T12:00:00`).getTime();
        const bTime = new Date(`${b.date}T12:00:00`).getTime();
        result = aTime - bTime;
        break;
      }
      case "amount":
        result = a.amount - b.amount;
        break;
      case "sourceClient":
        result = compareText(a.sourceClient, b.sourceClient);
        break;
      case "productService":
        result = compareText(a.productService, b.productService);
        break;
      case "category":
        result = compareText(a.category, b.category);
        break;
      case "status":
        result = compareText(a.status, b.status);
        break;
      case "paymentMethod":
        result = compareText(a.paymentMethod, b.paymentMethod);
        break;
      case "invoiceNumber":
        result = compareText(a.invoiceNumber, b.invoiceNumber);
        break;
    }

    return sign * result;
  });
}

export function sortExpenseRecords(
  records: ExpenseRecord[],
  sortKey: ExpenseSortKey,
  direction: ExpenseSortDirection
): ExpenseRecord[] {
  const sign = direction === "asc" ? 1 : -1;

  return [...records].sort((a, b) => {
    let result = 0;

    switch (sortKey) {
      case "date": {
        const aTime = new Date(`${a.date}T12:00:00`).getTime();
        const bTime = new Date(`${b.date}T12:00:00`).getTime();
        result = aTime - bTime;
        break;
      }
      case "amount":
        result = a.amount - b.amount;
        break;
      case "category":
        result = compareText(a.category, b.category);
        break;
      case "description":
        result = compareText(a.description, b.description);
        break;
      case "vendor":
        result = compareText(a.vendor, b.vendor);
        break;
      case "status":
        result = compareText(a.status, b.status);
        break;
      case "paymentMethod":
        result = compareText(a.paymentMethod, b.paymentMethod);
        break;
    }

    return sign * result;
  });
}

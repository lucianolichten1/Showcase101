import {
  DEMO_FINANCIAL_YEAR,
  DEMO_PL_MONTH_LABELS,
  DEMO_YTD_END_MONTH,
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

function chartBucket(year: number, month: number): ChartMonthBucket {
  return {
    isoPrefix: `${year}-${pad2(month)}`,
    label: SHORT_MONTH_LABELS[month - 1] ?? `${year}-${pad2(month)}`,
  };
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
    return Array.from({ length: DEMO_YTD_END_MONTH }, (_, i) =>
      chartBucket(DEMO_FINANCIAL_YEAR, i + 1)
    );
  }
  return getAllDemoChartMonthBuckets();
}

/** Month buckets for an arbitrary inclusive date range (fills gaps with zero totals) */
export function getChartMonthBucketsForDateRange(range: DateRange): ChartMonthBucket[] {
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

  const buckets: ChartMonthBucket[] = [];
  let year = startYear;
  let month = startMonth;

  while (year < endYear || (year === endYear && month <= endMonth)) {
    buckets.push(chartBucket(year, month));
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }

  return buckets.length > 0 ? buckets : getAllDemoChartMonthBuckets();
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

export function calculateNetProfit(
  revenue: RevenueRecord[],
  expenses: ExpenseRecord[]
): number {
  return calculateTotalRevenue(revenue) - calculateTotalExpenses(expenses);
}

export function calculateProfitMargin(
  revenue: RevenueRecord[],
  expenses: ExpenseRecord[]
): number {
  const total = calculateTotalRevenue(revenue);
  if (total <= 0) return 0;
  return Math.round((calculateNetProfit(revenue, expenses) / total) * 100);
}

// ─── Monthly aggregation (charts) ─────────────────────────────────────────────

/** Groups revenue and expense records by calendar month or week for charting */
export function computeMonthlyFinancials(
  revenueRecords: RevenueRecord[],
  expenseRecords: ExpenseRecord[],
  period: FinancialPeriod
): MonthlyFinancialSummary[] {
  const dateRange = getDateRangeForPeriod(period);
  const scopedRevenue = filterRecordsByDateRange(revenueRecords, dateRange);
  const scopedExpenses = filterRecordsByDateRange(expenseRecords, dateRange);

  if (period.kind === "month") {
    const weekBuckets = getChartWeekBuckets(period.year, period.month);
    return weekBuckets.map(({ startDate, endDate, label }) => {
      const revenue = scopedRevenue
        .filter(
          (r) =>
            isActiveRevenue(r) && isDateWithinInclusive(r.date, startDate, endDate)
        )
        .reduce((sum, r) => sum + r.amount, 0);
      const expenses = scopedExpenses
        .filter((e) => isDateWithinInclusive(e.date, startDate, endDate))
        .reduce((sum, e) => sum + e.amount, 0);
      return {
        month: label,
        revenue,
        expenses,
        profit: revenue - expenses,
      };
    });
  }

  const buckets = getChartMonthBuckets(period);
  return buckets.map(({ isoPrefix, label }) => {
    const revenue = scopedRevenue
      .filter((r) => isActiveRevenue(r) && r.date.startsWith(isoPrefix))
      .reduce((sum, r) => sum + r.amount, 0);
    const expenses = scopedExpenses
      .filter((e) => e.date.startsWith(isoPrefix))
      .reduce((sum, e) => sum + e.amount, 0);
    return {
      month: label,
      revenue,
      expenses,
      profit: revenue - expenses,
    };
  });
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
  receivables: ReceivableRecord[]
): FinancialKPIs {
  return {
    totalRevenue: calculateTotalRevenue(revenue),
    collectedRevenue: calculateCollectedRevenue(revenue),
    pendingRevenue: calculatePendingRevenue(revenue),
    overdueRevenue: calculateOverdueRevenue(revenue),
    topRevenueCategory: calculateTopRevenueCategory(revenue),
    totalExpenses: calculateTotalExpenses(expenses),
    paidExpenses: calculatePaidExpenses(expenses),
    pendingExpenses: calculatePendingExpenses(expenses),
    overdueExpenses: calculateOverdueExpenses(expenses),
    largestExpenseCategory: calculateLargestExpenseCategory(expenses),
    netProfit: calculateNetProfit(revenue, expenses),
    profitMargin: calculateProfitMargin(revenue, expenses),
    receivablesTotalOutstanding: calculateReceivablesTotalOutstanding(receivables),
    receivablesOverdueAmount: calculateReceivablesOverdueAmount(receivables),
    receivablesInvoicesOverdue: calculateReceivablesInvoicesOverdue(receivables),
    receivablesCollectionRate: calculateReceivablesCollectionRate(receivables),
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

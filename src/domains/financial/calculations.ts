import type {
  DateRange,
  ExpenseRecord,
  ExpenseSortDirection,
  ExpenseSortKey,
  FinancialKPIs,
  ReceivableRecord,
  RevenueRecord,
  RevenueSortDirection,
  RevenueSortKey,
} from "./types";

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

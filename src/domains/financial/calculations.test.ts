import { strict as assert } from "node:assert";
import {
  computeFinancialKPIs,
  computeMonthlyFinancials,
  filterRecordsByDateRange,
  resolveFinancialViewDateRange,
} from "./calculations";
import type { ExpenseRecord, RevenueRecord } from "./types";

function revenue(
  id: string,
  date: string,
  amount: number,
  cost = 0
): RevenueRecord {
  return {
    id,
    date,
    amount,
    cost,
    currency: "Bs",
    sourceClient: "Client",
    productService: "Product",
    category: "Local Sale",
    status: "Collected",
    paymentMethod: "Cash",
    invoiceNumber: id,
    notes: "",
  };
}

function expense(id: string, date: string, amount: number): ExpenseRecord {
  return {
    id,
    date,
    amount,
    currency: "Bs",
    category: "Labor",
    description: "Payroll",
    vendor: "Vendor",
    status: "Paid",
    paymentMethod: "Bank Transfer",
    notes: "",
  };
}

const sampleRevenue: RevenueRecord[] = [
  revenue("r1", "2025-03-15", 100_000, 30_000),
  revenue("r2", "2025-04-10", 80_000, 20_000),
  revenue("r3", "2026-01-20", 120_000, 40_000),
];

const sampleExpenses: ExpenseRecord[] = [
  expense("e1", "2025-03-20", 15_000),
  expense("e2", "2025-04-05", 10_000),
  expense("e3", "2026-01-25", 25_000),
];

const alignedRange = resolveFinancialViewDateRange(
  { kind: "all" },
  sampleRevenue,
  sampleExpenses,
  { useChartAlignedAllPeriod: true }
);

assert.ok(alignedRange.startDate, "All-period chart window should have a start date");
assert.ok(alignedRange.endDate, "All-period chart window should have an end date");

const scopedRevenue = filterRecordsByDateRange(sampleRevenue, alignedRange);
const scopedExpenses = filterRecordsByDateRange(sampleExpenses, alignedRange);

const kpis = computeFinancialKPIs(scopedRevenue, scopedExpenses, [], {
  usesImportedData: true,
});

assert.equal(
  kpis.totalRevenue,
  kpis.totalCosts + kpis.netProfit,
  "Total Revenue should equal Total Costs + Net Profit"
);

const monthly = computeMonthlyFinancials(sampleRevenue, sampleExpenses, { kind: "all" }, {
  useDataDrivenMonths: true,
});

const chartRevenue = monthly.reduce((sum, row) => sum + row.revenue, 0);
const chartCosts = monthly.reduce((sum, row) => sum + row.cost + row.expenses, 0);
const chartProfit = monthly.reduce((sum, row) => sum + row.profit, 0);

assert.equal(chartRevenue, chartCosts + chartProfit, "Chart totals should balance");
assert.equal(chartRevenue, kpis.totalRevenue, "Chart revenue total should match KPI revenue");
assert.equal(chartCosts, kpis.totalCosts, "Chart costs total should match KPI total costs");
assert.equal(chartProfit, kpis.netProfit, "Chart profit total should match KPI net profit");

console.log("calculations.test.ts: all assertions passed");

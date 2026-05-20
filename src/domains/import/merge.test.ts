/**
 * Run: npx tsx src/domains/import/merge.test.ts
 */
import assert from "node:assert/strict";
import {
  expenseDedupeKey,
  mergeImportedData,
  salesDedupeKey,
} from "./merge";
import type { ImportedData } from "./types";

function test(name: string, fn: () => void) {
  fn();
  console.log(`  ✓ ${name}`);
}

console.log("mergeImportedData");

const base: ImportedData = {
  sales: [
    {
      id: "a1",
      date: "2025-03-01",
      revenue: 100,
      customerName: "Farm A",
    },
  ],
  expenses: [
    {
      id: "e1",
      date: "2025-03-02",
      amount: 50,
      vendor: "Vendor",
    },
  ],
  arReceivables: [],
  importedAt: "2025-01-01T00:00:00.000Z",
  sourceFileName: "2025.xlsx",
};

test("merges new rows and skips duplicates", () => {
  const incoming: ImportedData = {
    sales: [
      {
        id: "b1",
        date: "2025-03-01",
        revenue: 100,
        customerName: "Farm A",
      },
      {
        id: "b2",
        date: "2026-01-15",
        revenue: 200,
        customerName: "Farm B",
      },
    ],
    expenses: [
      {
        id: "e2",
        date: "2025-03-02",
        amount: 50,
        vendor: "Vendor",
      },
      {
        id: "e3",
        date: "2026-02-01",
        amount: 75,
        vendor: "Other",
      },
    ],
    arReceivables: [],
    importedAt: "2026-01-01T00:00:00.000Z",
    sourceFileName: "2026.xlsx",
  };

  const result = mergeImportedData(base, incoming);
  assert.equal(result.merged.sales.length, 2);
  assert.equal(result.merged.expenses.length, 2);
  assert.equal(result.newSalesCount, 1);
  assert.equal(result.newExpenseCount, 1);
  assert.equal(result.duplicateSalesCount, 1);
  assert.equal(result.duplicateExpenseCount, 1);
});

test("stable keys ignore generated ids", () => {
  const rowA = {
    id: "x",
    date: "2025-06-01",
    revenue: 10,
    product: "Corn",
  };
  const rowB = { ...rowA, id: "y" };
  assert.equal(salesDedupeKey(rowA), salesDedupeKey(rowB));
  assert.equal(
    expenseDedupeKey({ id: "1", date: "2025-01-01", amount: 5 }),
    expenseDedupeKey({ id: "2", date: "2025-01-01", amount: 5 })
  );
});

console.log("All merge tests passed.");

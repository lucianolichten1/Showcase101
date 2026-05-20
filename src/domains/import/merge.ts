import type { ImportedData, ImportExpenseRecord, SalesRecord } from "./types";

/** Stable dedupe key for imported sales (ignores generated id). */
export function salesDedupeKey(row: SalesRecord): string {
  return [
    row.date,
    row.customerName ?? "",
    row.product ?? "",
    row.quantity ?? "",
    row.revenue,
    row.cost ?? "",
  ].join("|");
}

/** Stable dedupe key for imported expenses (ignores generated id). */
export function expenseDedupeKey(row: ImportExpenseRecord): string {
  return [
    row.date,
    row.category ?? "",
    row.vendor ?? "",
    row.description ?? "",
    row.amount,
  ].join("|");
}

export interface MergeImportResult {
  merged: ImportedData;
  newSalesCount: number;
  newExpenseCount: number;
  duplicateSalesCount: number;
  duplicateExpenseCount: number;
}

function mergeRowList<T>(
  existing: T[],
  incoming: T[],
  keyFn: (row: T) => string
): { merged: T[]; newCount: number; duplicateCount: number } {
  const keys = new Set(existing.map(keyFn));
  const added: T[] = [];
  let duplicateCount = 0;

  for (const row of incoming) {
    const key = keyFn(row);
    if (keys.has(key)) {
      duplicateCount += 1;
    } else {
      keys.add(key);
      added.push(row);
    }
  }

  return {
    merged: [...existing, ...added],
    newCount: added.length,
    duplicateCount,
  };
}

/** Merge incoming import into existing data, skipping duplicate rows by stable key. */
export function mergeImportedData(
  existing: ImportedData | null,
  incoming: ImportedData
): MergeImportResult {
  const baseSales = existing?.sales ?? [];
  const baseExpenses = existing?.expenses ?? [];

  const salesMerge = mergeRowList(baseSales, incoming.sales, salesDedupeKey);
  const expenseMerge = mergeRowList(
    baseExpenses,
    incoming.expenses,
    expenseDedupeKey
  );

  const merged: ImportedData = {
    sales: salesMerge.merged,
    expenses: expenseMerge.merged,
    importedAt: incoming.importedAt,
    sourceFileName: incoming.sourceFileName ?? existing?.sourceFileName,
  };

  return {
    merged,
    newSalesCount: salesMerge.newCount,
    newExpenseCount: expenseMerge.newCount,
    duplicateSalesCount: salesMerge.duplicateCount,
    duplicateExpenseCount: expenseMerge.duplicateCount,
  };
}

import type { ExpenseRecord } from "@/domains/financial/types";

/** Merges imported and native expense lists; native wins on id collision. */
export function mergeExpenseRecords(
  imported: ExpenseRecord[],
  native: ExpenseRecord[]
): ExpenseRecord[] {
  const byId = new Map<string, ExpenseRecord>();
  for (const row of imported) byId.set(row.id, row);
  for (const row of native) byId.set(row.id, row);
  return [...byId.values()].sort((a, b) => b.date.localeCompare(a.date));
}

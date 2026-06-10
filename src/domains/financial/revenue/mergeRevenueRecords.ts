import type { RevenueRecord } from "@/domains/financial/types";

/** Merges imported and native revenue lists; native wins on id collision. */
export function mergeRevenueRecords(
  imported: RevenueRecord[],
  native: RevenueRecord[]
): RevenueRecord[] {
  const byId = new Map<string, RevenueRecord>();
  for (const row of imported) byId.set(row.id, row);
  for (const row of native) byId.set(row.id, row);
  return [...byId.values()].sort((a, b) => b.date.localeCompare(a.date));
}

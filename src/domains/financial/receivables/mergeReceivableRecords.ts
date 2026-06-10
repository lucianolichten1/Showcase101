import type { ReceivableRecord } from "@/domains/financial/types";

export function mergeReceivableRecords(
  imported: ReceivableRecord[],
  native: ReceivableRecord[]
): ReceivableRecord[] {
  const byId = new Map<number, ReceivableRecord>();
  for (const row of imported) byId.set(row.id, row);
  for (const row of native) byId.set(row.id, row);
  return [...byId.values()];
}

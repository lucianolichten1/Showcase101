import type { CustomerRecord } from "./types";

export function mergeCustomerRecords(
  imported: CustomerRecord[],
  native: CustomerRecord[]
): CustomerRecord[] {
  const byId = new Map<number, CustomerRecord>();
  for (const row of imported) byId.set(row.id, row);
  for (const row of native) byId.set(row.id, row);
  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
}

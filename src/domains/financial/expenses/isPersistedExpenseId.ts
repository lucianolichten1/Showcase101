import { isPersistedRecordId } from "@/domains/financial/persistence/isPersistedRecordId";

/** True when the expense id comes from `company_expenses` (not import/local ids). */
export function isPersistedExpenseId(id: string): boolean {
  return isPersistedRecordId(id);
}

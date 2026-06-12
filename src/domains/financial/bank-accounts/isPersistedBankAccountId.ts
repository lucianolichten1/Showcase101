import { isPersistedRecordId } from "@/domains/financial/persistence/isPersistedRecordId";

export function isPersistedBankAccountId(id: string): boolean {
  return isPersistedRecordId(id);
}

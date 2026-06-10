import type { ExpenseRecord } from "@/domains/financial/types";

const STORAGE_PREFIX = "agro-company-expenses-v1";

function storageKey(companyId: string): string {
  return `${STORAGE_PREFIX}-${companyId}`;
}

export function loadCompanyExpensesFromStorage(companyId: string): ExpenseRecord[] {
  try {
    const raw = localStorage.getItem(storageKey(companyId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ExpenseRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveCompanyExpensesToStorage(
  companyId: string,
  expenses: ExpenseRecord[]
): void {
  localStorage.setItem(storageKey(companyId), JSON.stringify(expenses));
}

import type { RevenueRecord } from "@/domains/financial/types";

const STORAGE_PREFIX = "agro-company-revenue-v1";

function storageKey(companyId: string): string {
  return `${STORAGE_PREFIX}-${companyId}`;
}

export function loadCompanyRevenueFromStorage(companyId: string): RevenueRecord[] {
  try {
    const raw = localStorage.getItem(storageKey(companyId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RevenueRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveCompanyRevenueToStorage(
  companyId: string,
  records: RevenueRecord[]
): void {
  localStorage.setItem(storageKey(companyId), JSON.stringify(records));
}

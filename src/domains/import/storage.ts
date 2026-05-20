import type { ImportedData, ImportHistoryItem, ImportMapping } from "./types";

/** Centralized localStorage keys for import persistence */
export const IMPORT_STORAGE_KEYS = {
  mapping: "agro-import-mapping",
  data: "agro-import-data",
  history: "agro-import-history",
} as const;

const MAPPING_KEY = IMPORT_STORAGE_KEYS.mapping;
const DATA_KEY = IMPORT_STORAGE_KEYS.data;
const HISTORY_KEY = IMPORT_STORAGE_KEYS.history;

const MAX_HISTORY_ITEMS = 20;

export function loadImportMapping(): ImportMapping | null {
  try {
    const raw = localStorage.getItem(MAPPING_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ImportMapping;
  } catch {
    return null;
  }
}

export function saveImportMapping(mapping: ImportMapping): void {
  localStorage.setItem(MAPPING_KEY, JSON.stringify(mapping));
}

function normalizeImportedData(data: Partial<ImportedData>): ImportedData {
  return {
    sales: Array.isArray(data.sales) ? data.sales : [],
    expenses: Array.isArray(data.expenses) ? data.expenses : [],
    arReceivables: Array.isArray(data.arReceivables) ? data.arReceivables : [],
    customers: Array.isArray(data.customers) ? data.customers : [],
    importedAt:
      typeof data.importedAt === "string"
        ? data.importedAt
        : new Date().toISOString(),
    sourceFileName:
      typeof data.sourceFileName === "string" ? data.sourceFileName : undefined,
  };
}

export function loadImportedData(): ImportedData | null {
  try {
    const raw = localStorage.getItem(DATA_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ImportedData>;
    const data = normalizeImportedData(parsed);
    if (data.sales.length === 0 && data.expenses.length === 0 && data.arReceivables.length === 0 && data.customers.length === 0) return null;
    return data;
  } catch {
    return null;
  }
}

export function saveImportedData(data: ImportedData): void {
  localStorage.setItem(DATA_KEY, JSON.stringify(data));
}

export function clearImportedData(): void {
  localStorage.removeItem(DATA_KEY);
}

export function hasImportedData(): boolean {
  const data = loadImportedData();
  return Boolean(data && (data.sales.length > 0 || data.expenses.length > 0));
}

export function loadImportHistory(): ImportHistoryItem[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const items = JSON.parse(raw) as ImportHistoryItem[];
    return Array.isArray(items) ? items : [];
  } catch {
    return [];
  }
}

export function saveImportHistory(items: ImportHistoryItem[]): void {
  localStorage.setItem(
    HISTORY_KEY,
    JSON.stringify(items.slice(0, MAX_HISTORY_ITEMS))
  );
}

export function addImportHistoryItem(item: ImportHistoryItem): ImportHistoryItem[] {
  const next = [item, ...loadImportHistory()].slice(0, MAX_HISTORY_ITEMS);
  saveImportHistory(next);
  return next;
}

export function clearImportHistory(): void {
  localStorage.removeItem(HISTORY_KEY);
}

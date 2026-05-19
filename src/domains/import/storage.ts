import type { ImportedData, ImportMapping } from "./types";

const MAPPING_KEY = "agro-import-mapping";
const DATA_KEY = "agro-import-data";

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

export function loadImportedData(): ImportedData | null {
  try {
    const raw = localStorage.getItem(DATA_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as ImportedData;
    if (!data.sales?.length && !data.expenses?.length) return null;
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

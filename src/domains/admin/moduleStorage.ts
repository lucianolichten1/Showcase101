const STORAGE_KEY = "agro-company-enabled-modules-v1";

type ModuleMap = Record<string, string[]>;

function readAll(): ModuleMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as ModuleMap;
  } catch {
    return {};
  }
}

export function loadCompanyEnabledModules(
  companyId: string,
  fallback: string[]
): string[] {
  const stored = readAll()[companyId];
  return stored && stored.length > 0 ? stored : fallback;
}

export function saveCompanyEnabledModules(
  companyId: string,
  modules: string[]
): void {
  const all = readAll();
  all[companyId] = modules;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

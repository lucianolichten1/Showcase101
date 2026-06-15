import { dispatchCompanyEnabledModulesChanged } from "@/domains/company/companyWorkspaceEvents";

const STORAGE_KEY = "agro-company-enabled-modules-v1";

export { STORAGE_KEY as COMPANY_ENABLED_MODULES_STORAGE_KEY };

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
  dispatchCompanyEnabledModulesChanged(companyId);
}

export function removeCompanyEnabledModules(companyId: string): void {
  const all = readAll();
  if (!(companyId in all)) return;
  delete all[companyId];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  dispatchCompanyEnabledModulesChanged(companyId);
}

/** Maps URL prefixes to module keys for route gating and nav filtering. */
export const MODULE_PATH_RULES = [
  { prefix: "/dashboard", moduleKey: "dashboard" },
  { prefix: "/revenue", moduleKey: "revenue" },
  { prefix: "/expenses", moduleKey: "expenses" },
  { prefix: "/accounts", moduleKey: "bank-accounts" },
  { prefix: "/customers", moduleKey: "customers" },
  { prefix: "/accounts-receivable", moduleKey: "accounts-receivable" },
  { prefix: "/reports", moduleKey: "reports" },
  { prefix: "/export-import", moduleKey: "import-export" },
  { prefix: "/inventory", moduleKey: "inventory" },
] as const;

export function resolveModuleKeyForPath(pathname: string): string | null {
  for (const rule of MODULE_PATH_RULES) {
    if (pathname === rule.prefix || pathname.startsWith(`${rule.prefix}/`)) {
      return rule.moduleKey;
    }
  }
  return null;
}

export function isAppModulePath(pathname: string): boolean {
  return resolveModuleKeyForPath(pathname) !== null;
}

/** How the target module opens its creation UI (see `source` in registry). */
export type CreateActionPattern = "modal" | "page-form" | "page-inline";

export interface CreateActionDefinition {
  /** URL `?create=` value; unique per action. */
  id: string;
  /** Module key from `BASE_FINANCIAL_MODULE_DEFINITIONS` — used for enablement filtering. */
  moduleKey: string;
  label: string;
  /** Route path for the module page. */
  path: string;
  pattern: CreateActionPattern;
  /** Component/file that implements this flow (documentation + traceability). */
  source: string;
}

export interface CreateActionGroup {
  moduleKey: string;
  moduleName: string;
  actions: CreateActionDefinition[];
}

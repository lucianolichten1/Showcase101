import { DEFAULT_COMPANY_DATABASE } from "./database";
import { DEFAULT_ENABLED_MODULES } from "./modules";
import type { CompanyRecord } from "./types";

const withDatabaseDefaults = (
  company: Omit<CompanyRecord, "databaseStatus" | "databaseLabel" | "databaseProvider">
): CompanyRecord => ({
  ...company,
  ...DEFAULT_COMPANY_DATABASE,
});

export const initialCompanies: CompanyRecord[] = [
  withDatabaseDefaults({
    id: "co-1",
    name: "Santa Fe Agro",
    niche: "agro",
    ownerEmail: "owner@santafe.com",
    status: "Active",
    createdAt: "2025-11-12",
    enabledModules: [...DEFAULT_ENABLED_MODULES],
  }),
  withDatabaseDefaults({
    id: "co-2",
    name: "Ganadera Norte",
    niche: "agro",
    ownerEmail: "admin@ganadera.com",
    status: "Active",
    createdAt: "2026-01-08",
    enabledModules: [...DEFAULT_ENABLED_MODULES],
  }),
  withDatabaseDefaults({
    id: "co-3",
    name: "Demo Company",
    niche: "agro",
    ownerEmail: "demo@example.com",
    status: "Inactive",
    createdAt: "2026-03-20",
    enabledModules: [...DEFAULT_ENABLED_MODULES],
  }),
];

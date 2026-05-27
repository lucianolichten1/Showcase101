/** Frontend-only placeholders for per-company database routing (not connected yet). */

export type CompanyDatabaseStatus = "not_connected";

export const DEFAULT_COMPANY_DATABASE = {
  databaseStatus: "not_connected" as CompanyDatabaseStatus,
  databaseLabel: "Company database not connected",
  databaseProvider: "Supabase planned",
} as const;

export const COMPANY_DATABASE_SCOPE = "Dedicated database per company";

export function databaseStatusLabel(status: CompanyDatabaseStatus): string {
  if (status === "not_connected") return "Not connected";
  return status;
}

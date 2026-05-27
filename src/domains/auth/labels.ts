import type { AppRole } from "./types";

export function formatRoleLabel(role: AppRole | null | undefined): string {
  if (role === "superadmin") return "Super Admin";
  if (role === "company_owner") return "Company Owner";
  return "Unknown";
}

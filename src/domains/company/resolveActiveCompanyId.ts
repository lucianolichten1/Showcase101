import type { AppRole } from "@/domains/auth/types";

/**
 * Resolves the active company for company-scoped pages.
 * Superadmins use `?companyId=`; company owners use their assigned company.
 */
export function resolveActiveCompanyId(
  role: AppRole | null,
  primaryCompanyId: string | null,
  queryCompanyId: string | null
): string | null {
  if (role === "superadmin") {
    return queryCompanyId ?? primaryCompanyId;
  }
  return primaryCompanyId ?? queryCompanyId;
}

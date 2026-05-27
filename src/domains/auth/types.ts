export type AppRole = "superadmin" | "company_owner";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: AppRole;
}

export interface CompanyMember {
  id: string;
  company_id: string;
  user_id: string;
  role: string;
  created_at: string;
}

export function isAppRole(value: string | null | undefined): value is AppRole {
  return value === "superadmin" || value === "company_owner";
}

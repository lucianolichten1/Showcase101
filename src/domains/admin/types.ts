import type { CompanyDatabaseStatus } from "./database";
import type { NicheKey } from "./niches";

export type CompanyNiche = NicheKey;

export type CompanyStatus = "Active" | "Inactive";

export interface CompanyBranding {
  displayName: string | null;
  primaryColor: string;
  logoUrl: string | null;
}

export type CompanyBrandingPatch = Partial<CompanyBranding>;

export interface CompanyRecord {
  id: string;
  name: string;
  niche: CompanyNiche;
  ownerEmail: string;
  status: CompanyStatus;
  createdAt: string;
  /** Module keys enabled for this company (financial/accounting base). */
  enabledModules: string[];
  /** Dashboard KPI and chart widget keys enabled for this company. */
  enabledDashboardWidgets: string[];
  /** Frontend placeholder — no live database connection yet. */
  databaseStatus: CompanyDatabaseStatus;
  databaseLabel: string;
  databaseProvider: string;
  branding: CompanyBranding;
}

export interface NewCompanyInput {
  name: string;
  niche: CompanyNiche;
  status: CompanyStatus;
}

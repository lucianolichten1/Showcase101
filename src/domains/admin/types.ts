import type { CompanyDatabaseStatus } from "./database";
import type { NicheKey } from "./niches";

export type CompanyNiche = NicheKey;

export type CompanyStatus = "Active" | "Inactive";

export interface CompanyRecord {
  id: string;
  name: string;
  niche: CompanyNiche;
  ownerEmail: string;
  status: CompanyStatus;
  createdAt: string;
  /** Module keys enabled for this company (financial/accounting base). */
  enabledModules: string[];
  /** Frontend placeholder — no live database connection yet. */
  databaseStatus: CompanyDatabaseStatus;
  databaseLabel: string;
  databaseProvider: string;
}

export interface NewCompanyInput {
  name: string;
  ownerEmail: string;
  niche: CompanyNiche;
  status: CompanyStatus;
}

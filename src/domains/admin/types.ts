export type CompanyNiche = "Agro";

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
}

export interface NewCompanyInput {
  name: string;
  ownerEmail: string;
  niche: CompanyNiche;
  status: CompanyStatus;
}

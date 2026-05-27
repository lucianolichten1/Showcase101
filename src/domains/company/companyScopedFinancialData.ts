import type { CompanyRecord } from "@/domains/admin/types";
import { findCompanyById } from "@/domains/admin/utils";
import type { CustomerRecord } from "@/domains/customers/types";
import type {
  ExpenseRecord,
  FinancialKPIs,
  ReceivableRecord,
  RevenueRecord,
} from "@/domains/financial/types";

// TODO: Route financial reads to the company's dedicated Supabase database.
// TODO: Route imports to the selected company workspace.
// TODO: Replace shared mock data with company-specific records per companyId.

/** Active financial record sets used by MVP pages (before company DB routing). */
export interface FinancialDataSource {
  revenueRecords: RevenueRecord[];
  expenseRecords: ExpenseRecord[];
  receivableRecords: ReceivableRecord[];
  customerRecords: CustomerRecord[];
  filteredRevenueRecords: RevenueRecord[];
  filteredExpenseRecords: ExpenseRecord[];
  kpis: FinancialKPIs;
  usesImportedData: boolean;
}

export interface CompanyFinancialScope {
  companyId: string | null;
  company: CompanyRecord | null;
  /** True when `companyId` is present in the URL. */
  hasCompanyContext: boolean;
  /** True when `companyId` matches a known company. */
  isValidCompany: boolean;
}

export interface CompanyScopedFinancialData extends FinancialDataSource {
  scope: CompanyFinancialScope;
}

/**
 * Resolves financial data for the current view.
 * MVP: all companies receive the same in-memory records; structure is ready for per-company DB reads.
 */
export function getCompanyScopedFinancialData(
  companyId: string | null | undefined,
  companies: CompanyRecord[],
  source: FinancialDataSource
): CompanyScopedFinancialData {
  if (!companyId) {
    return {
      ...source,
      scope: {
        companyId: null,
        company: null,
        hasCompanyContext: false,
        isValidCompany: false,
      },
    };
  }

  const company = findCompanyById(companies, companyId) ?? null;

  if (!company) {
    return {
      ...source,
      scope: {
        companyId,
        company: null,
        hasCompanyContext: true,
        isValidCompany: false,
      },
    };
  }

  // Future: load `source` from company.database / niche Supabase project.
  return {
    ...source,
    scope: {
      companyId,
      company,
      hasCompanyContext: true,
      isValidCompany: true,
    },
  };
}

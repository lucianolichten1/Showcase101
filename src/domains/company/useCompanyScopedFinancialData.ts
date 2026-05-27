import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import type { UseFinancialDataResult } from "@/domains/financial/types";
import { useFinancialData } from "@/domains/financial/hooks";
import { useCompanyRecords } from "./CompanyDataContext";
import {
  getCompanyScopedFinancialData,
  type CompanyFinancialScope,
  type CompanyScopedFinancialData,
} from "./companyScopedFinancialData";

export type CompanyScopedFinancialDataResult = UseFinancialDataResult &
  CompanyScopedFinancialData & {
    scope: CompanyFinancialScope;
  };

/**
 * Financial data for the current page, optionally scoped by `?companyId=`.
 * Without a companyId, behavior matches the shared `useFinancialData()` hook.
 */
export function useCompanyScopedFinancialData(): CompanyScopedFinancialDataResult {
  const financial = useFinancialData();
  const companies = useCompanyRecords();
  const [searchParams] = useSearchParams();
  const companyIdParam = searchParams.get("companyId");

  const scoped = useMemo(
    () =>
      getCompanyScopedFinancialData(
        companyIdParam,
        companies,
        {
          revenueRecords: financial.revenueRecords,
          expenseRecords: financial.expenseRecords,
          receivableRecords: financial.receivableRecords,
          customerRecords: financial.customerRecords,
          filteredRevenueRecords: financial.filteredRevenueRecords,
          filteredExpenseRecords: financial.filteredExpenseRecords,
          kpis: financial.kpis,
          usesImportedData: financial.usesImportedData,
        }
      ),
    [
      companyIdParam,
      companies,
      financial.revenueRecords,
      financial.expenseRecords,
      financial.receivableRecords,
      financial.customerRecords,
      financial.filteredRevenueRecords,
      financial.filteredExpenseRecords,
      financial.kpis,
      financial.usesImportedData,
    ]
  );

  return {
    ...financial,
    ...scoped,
  };
}

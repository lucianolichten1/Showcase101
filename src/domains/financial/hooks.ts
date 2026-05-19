import { useFinancialDataContext } from "./FinancialDataContext";
import type { UseFinancialDataResult } from "./types";

export type { UseFinancialDataResult } from "./types";

/** Shared financial state (imported data or mock fallback). */
export function useFinancialData(): UseFinancialDataResult {
  const ctx = useFinancialDataContext();
  return {
    revenueRecords: ctx.revenueRecords,
    setRevenueRecords: ctx.setRevenueRecords,
    expenseRecords: ctx.expenseRecords,
    setExpenseRecords: ctx.setExpenseRecords,
    receivableRecords: ctx.receivableRecords,
    setReceivableRecords: ctx.setReceivableRecords,
    dateRange: ctx.dateRange,
    setDateRange: ctx.setDateRange,
    filteredRevenueRecords: ctx.filteredRevenueRecords,
    filteredExpenseRecords: ctx.filteredExpenseRecords,
    kpis: ctx.kpis,
    usesImportedData: ctx.usesImportedData,
    importedData: ctx.importedData,
    importMapping: ctx.importMapping,
    applyImportedData: ctx.applyImportedData,
    clearImportedData: ctx.clearImportedData,
  };
}

import { useEffect } from "react";
import { useFinancialDataContext } from "./FinancialDataContext";
import { getDateRangeForPeriod, type FinancialPeriod } from "./period";
import type { UseFinancialDataResult } from "./types";

export type { UseFinancialDataResult } from "./types";

/** Keeps shared dateRange aligned with the page's local period selector. */
export function useSyncFinancialPeriod(
  period: FinancialPeriod,
  setDateRange: UseFinancialDataResult["setDateRange"]
): void {
  useEffect(() => {
    setDateRange(getDateRangeForPeriod(period));
  }, [period, setDateRange]);
}

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
    importHistory: ctx.importHistory,
    applyImportedData: ctx.applyImportedData,
    appendImportHistory: ctx.appendImportHistory,
    clearImportedData: ctx.clearImportedData,
  };
}

import { useMemo, useState, type Dispatch, type SetStateAction } from "react";
import {
  computeFinancialKPIs,
  filterRecordsByDateRange,
} from "./calculations";
import {
  defaultDateRange,
  initialExpenseRecords,
  initialReceivableRecords,
  initialRevenueRecords,
} from "./mockData";
import type {
  DateRange,
  ExpenseRecord,
  FinancialKPIs,
  ReceivableRecord,
  RevenueRecord,
} from "./types";

export interface UseFinancialDataOptions {
  /** Initial revenue rows (defaults to domain mock) */
  initialRevenue?: RevenueRecord[];
  /** Initial expense rows (defaults to domain mock) */
  initialExpenses?: ExpenseRecord[];
  /** Initial receivable rows (defaults to domain mock) */
  initialReceivables?: ReceivableRecord[];
  /** Starting date range filter */
  initialDateRange?: DateRange;
}

export interface UseFinancialDataResult {
  revenueRecords: RevenueRecord[];
  setRevenueRecords: Dispatch<SetStateAction<RevenueRecord[]>>;
  expenseRecords: ExpenseRecord[];
  setExpenseRecords: Dispatch<SetStateAction<ExpenseRecord[]>>;
  receivableRecords: ReceivableRecord[];
  setReceivableRecords: Dispatch<SetStateAction<ReceivableRecord[]>>;
  dateRange: DateRange;
  setDateRange: Dispatch<SetStateAction<DateRange>>;
  filteredRevenueRecords: RevenueRecord[];
  filteredExpenseRecords: ExpenseRecord[];
  kpis: FinancialKPIs;
}

/**
 * Local financial data loader — mock-backed state with date-range filtering and KPIs.
 * Receivable state is included for future centralization; AR page may still receive props from App.
 */
export function useFinancialData(
  options: UseFinancialDataOptions = {}
): UseFinancialDataResult {
  const [revenueRecords, setRevenueRecords] = useState<RevenueRecord[]>(
    options.initialRevenue ?? initialRevenueRecords
  );
  const [expenseRecords, setExpenseRecords] = useState<ExpenseRecord[]>(
    options.initialExpenses ?? initialExpenseRecords
  );
  const [receivableRecords, setReceivableRecords] = useState<ReceivableRecord[]>(
    options.initialReceivables ?? initialReceivableRecords
  );
  const [dateRange, setDateRange] = useState<DateRange>(
    options.initialDateRange ?? {
      startDate: defaultDateRange.startDate,
      endDate: defaultDateRange.endDate,
    }
  );

  const filteredRevenueRecords = useMemo(
    () => filterRecordsByDateRange(revenueRecords, dateRange),
    [revenueRecords, dateRange]
  );

  const filteredExpenseRecords = useMemo(
    () => filterRecordsByDateRange(expenseRecords, dateRange),
    [expenseRecords, dateRange]
  );

  const kpis = useMemo(
    () =>
      computeFinancialKPIs(
        filteredRevenueRecords,
        filteredExpenseRecords,
        receivableRecords
      ),
    [filteredRevenueRecords, filteredExpenseRecords, receivableRecords]
  );

  return {
    revenueRecords,
    setRevenueRecords,
    expenseRecords,
    setExpenseRecords,
    receivableRecords,
    setReceivableRecords,
    dateRange,
    setDateRange,
    filteredRevenueRecords,
    filteredExpenseRecords,
    kpis,
  };
}

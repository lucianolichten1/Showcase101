import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import {
  importExpensesToFinancial,
  salesToRevenueRecords,
} from "@/domains/import/convert";
import {
  loadImportedData,
  loadImportMapping,
  saveImportedData,
  saveImportMapping,
} from "@/domains/import/storage";
import type { ImportedData, ImportMapping } from "@/domains/import/types";
import { computeFinancialKPIs, filterRecordsByDateRange } from "./calculations";
import {
  initialExpenseRecords,
  initialReceivableRecords,
  initialRevenueRecords,
} from "./mockData";
import { DEFAULT_FINANCIAL_PERIOD, getDateRangeForPeriod } from "./period";
import type {
  DateRange,
  ExpenseRecord,
  FinancialKPIs,
  ReceivableRecord,
  RevenueRecord,
} from "./types";

export interface FinancialDataContextValue {
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
  usesImportedData: boolean;
  importedData: ImportedData | null;
  importMapping: ImportMapping | null;
  applyImportedData: (data: ImportedData, mapping: ImportMapping) => void;
  clearImportedData: () => void;
}

const FinancialDataContext = createContext<FinancialDataContextValue | null>(
  null
);

function buildRecordsFromImport(data: ImportedData | null): {
  revenue: RevenueRecord[];
  expenses: ExpenseRecord[];
  usesImported: boolean;
} {
  if (!data || (data.sales.length === 0 && data.expenses.length === 0)) {
    return {
      revenue: initialRevenueRecords,
      expenses: initialExpenseRecords,
      usesImported: false,
    };
  }
  return {
    revenue:
      data.sales.length > 0
        ? salesToRevenueRecords(data.sales)
        : [],
    expenses:
      data.expenses.length > 0
        ? importExpensesToFinancial(data.expenses)
        : [],
    usesImported: true,
  };
}

export function FinancialDataProvider({ children }: { children: ReactNode }) {
  const [importedData, setImportedData] = useState<ImportedData | null>(() =>
    loadImportedData()
  );
  const [importMapping, setImportMapping] = useState<ImportMapping | null>(() =>
    loadImportMapping()
  );

  const initialRecords = useMemo(
    () => buildRecordsFromImport(importedData),
    [importedData]
  );

  const [revenueRecords, setRevenueRecords] = useState<RevenueRecord[]>(
    initialRecords.revenue
  );
  const [expenseRecords, setExpenseRecords] = useState<ExpenseRecord[]>(
    initialRecords.expenses
  );
  const [receivableRecords, setReceivableRecords] = useState<ReceivableRecord[]>(
    initialReceivableRecords
  );
  const [dateRange, setDateRange] = useState<DateRange>(
    getDateRangeForPeriod(DEFAULT_FINANCIAL_PERIOD)
  );

  const usesImportedData = initialRecords.usesImported;

  const applyImportedData = useCallback(
    (data: ImportedData, mapping: ImportMapping) => {
      saveImportedData(data);
      saveImportMapping(mapping);
      setImportedData(data);
      setImportMapping(mapping);
      const next = buildRecordsFromImport(data);
      setRevenueRecords(next.revenue);
      setExpenseRecords(next.expenses);
    },
    []
  );

  const clearImportedData = useCallback(() => {
    localStorage.removeItem("agro-import-data");
    setImportedData(null);
    setRevenueRecords(initialRevenueRecords);
    setExpenseRecords(initialExpenseRecords);
  }, []);

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
        receivableRecords,
        { usesImportedData }
      ),
    [
      filteredRevenueRecords,
      filteredExpenseRecords,
      receivableRecords,
      usesImportedData,
    ]
  );

  const value = useMemo(
    (): FinancialDataContextValue => ({
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
      usesImportedData,
      importedData,
      importMapping,
      applyImportedData,
      clearImportedData,
    }),
    [
      revenueRecords,
      expenseRecords,
      receivableRecords,
      dateRange,
      filteredRevenueRecords,
      filteredExpenseRecords,
      kpis,
      usesImportedData,
      importedData,
      importMapping,
      applyImportedData,
      clearImportedData,
    ]
  );

  return (
    <FinancialDataContext.Provider value={value}>
      {children}
    </FinancialDataContext.Provider>
  );
}

export function useFinancialDataContext(): FinancialDataContextValue {
  const ctx = useContext(FinancialDataContext);
  if (!ctx) {
    throw new Error(
      "useFinancialDataContext must be used within FinancialDataProvider"
    );
  }
  return ctx;
}

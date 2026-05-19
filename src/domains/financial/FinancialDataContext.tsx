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
  expenseRecordsToImport,
  importExpensesToFinancial,
  revenueRecordsToSales,
  salesToRevenueRecords,
} from "@/domains/import/convert";
import {
  addImportHistoryItem,
  clearImportHistory,
  clearImportedData as clearPersistedImportedData,
  loadImportedData,
  loadImportHistory,
  loadImportMapping,
  saveImportedData,
  saveImportMapping,
} from "@/domains/import/storage";
import type {
  ImportedData,
  ImportHistoryItem,
  ImportHistoryMeta,
  ImportMapping,
} from "@/domains/import/types";
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
  importHistory: ImportHistoryItem[];
  applyImportedData: (
    data: ImportedData,
    mapping: ImportMapping,
    historyMeta: ImportHistoryMeta
  ) => void;
  appendImportHistory: (item: ImportHistoryItem) => void;
  clearImportedData: () => void;
}

const FinancialDataContext = createContext<FinancialDataContextValue | null>(
  null
);

function hasActiveImport(data: ImportedData | null): boolean {
  return Boolean(data && (data.sales.length > 0 || data.expenses.length > 0));
}

function createHistoryItem(
  meta: ImportHistoryMeta,
  importedAt: string
): ImportHistoryItem {
  return {
    id: `import-${Date.now()}`,
    fileName: meta.fileName,
    importedAt,
    salesRows: meta.salesRows,
    expenseRows: meta.expenseRows,
    skippedRows: meta.skippedRows,
    warningCount: meta.warningCount,
  };
}

export function FinancialDataProvider({ children }: { children: ReactNode }) {
  const [importedData, setImportedData] = useState<ImportedData | null>(() =>
    loadImportedData()
  );
  const [importMapping, setImportMapping] = useState<ImportMapping | null>(() =>
    loadImportMapping()
  );
  const [importHistory, setImportHistory] = useState<ImportHistoryItem[]>(() =>
    loadImportHistory()
  );

  const [mockRevenueRecords, setMockRevenueRecords] = useState<RevenueRecord[]>(
    () => initialRevenueRecords
  );
  const [mockExpenseRecords, setMockExpenseRecords] = useState<ExpenseRecord[]>(
    () => initialExpenseRecords
  );
  const [receivableRecords, setReceivableRecords] = useState<ReceivableRecord[]>(
    initialReceivableRecords
  );
  const [dateRange, setDateRange] = useState<DateRange>(
    getDateRangeForPeriod(DEFAULT_FINANCIAL_PERIOD)
  );

  const usesImportedData = hasActiveImport(importedData);

  /** Active revenue: derived from imported sales when import is active, else mock. */
  const revenueRecords = useMemo(() => {
    if (!usesImportedData || !importedData) return mockRevenueRecords;
    if (importedData.sales.length === 0) return [];
    return salesToRevenueRecords(importedData.sales);
  }, [usesImportedData, importedData, mockRevenueRecords]);

  /** Active expenses: derived from imported rows when import is active, else mock. */
  const expenseRecords = useMemo(() => {
    if (!usesImportedData || !importedData) return mockExpenseRecords;
    if (importedData.expenses.length === 0) return [];
    return importExpensesToFinancial(importedData.expenses);
  }, [usesImportedData, importedData, mockExpenseRecords]);

  const setRevenueRecords = useCallback(
    (action: SetStateAction<RevenueRecord[]>) => {
      if (usesImportedData && importedData) {
        const current =
          importedData.sales.length > 0
            ? salesToRevenueRecords(importedData.sales)
            : [];
        const next = typeof action === "function" ? action(current) : action;
        const updated: ImportedData = {
          ...importedData,
          sales: revenueRecordsToSales(next),
        };
        saveImportedData(updated);
        setImportedData(updated);
        return;
      }
      setMockRevenueRecords(action);
    },
    [usesImportedData, importedData]
  );

  const setExpenseRecords = useCallback(
    (action: SetStateAction<ExpenseRecord[]>) => {
      if (usesImportedData && importedData) {
        const current =
          importedData.expenses.length > 0
            ? importExpensesToFinancial(importedData.expenses)
            : [];
        const next = typeof action === "function" ? action(current) : action;
        const updated: ImportedData = {
          ...importedData,
          expenses: expenseRecordsToImport(next),
        };
        saveImportedData(updated);
        setImportedData(updated);
        return;
      }
      setMockExpenseRecords(action);
    },
    [usesImportedData, importedData]
  );

  const applyImportedData = useCallback(
    (data: ImportedData, mapping: ImportMapping, historyMeta: ImportHistoryMeta) => {
      saveImportedData(data);
      saveImportMapping(mapping);
      const historyItem = createHistoryItem(historyMeta, data.importedAt);
      const nextHistory = addImportHistoryItem(historyItem);

      setImportedData(data);
      setImportMapping(mapping);
      setImportHistory(nextHistory);
    },
    []
  );

  const appendImportHistory = useCallback((item: ImportHistoryItem) => {
    const nextHistory = addImportHistoryItem(item);
    setImportHistory(nextHistory);
  }, []);

  const clearImportedDataHandler = useCallback(() => {
    clearPersistedImportedData();
    clearImportHistory();
    setImportedData(null);
    setImportHistory([]);
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
      importHistory,
      applyImportedData,
      appendImportHistory,
      clearImportedData: clearImportedDataHandler,
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
      importHistory,
      setRevenueRecords,
      setExpenseRecords,
      applyImportedData,
      appendImportHistory,
      clearImportedDataHandler,
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

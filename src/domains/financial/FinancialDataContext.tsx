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
  arToReceivableRecords,
  expenseRecordsToImport,
  importExpensesToFinancial,
  revenueRecordsToSales,
  salesToRevenueRecords,
} from "@/domains/import/convert";
import { mergeImportedData, type MergeImportResult } from "@/domains/import/merge";
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

export type { MergeImportResult } from "@/domains/import/merge";
import { computeFinancialKPIs, filterRecordsByDateRange } from "./calculations";
import { initialReceivableRecords } from "./mockData";
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
  ) => MergeImportResult;
  appendImportHistory: (item: ImportHistoryItem) => void;
  clearImportedData: () => void;
}

const FinancialDataContext = createContext<FinancialDataContextValue | null>(
  null
);

function hasActiveImport(data: ImportedData | null): boolean {
  return Boolean(
    data &&
    (data.sales.length > 0 || data.expenses.length > 0 || data.arReceivables.length > 0)
  );
}

function createHistoryItem(
  meta: ImportHistoryMeta,
  importedAt: string,
  mergeResult: MergeImportResult
): ImportHistoryItem {
  return {
    id: `import-${Date.now()}`,
    fileName: meta.fileName,
    importedAt,
    salesRows: meta.salesRows,
    expenseRows: meta.expenseRows,
    newSalesRows: mergeResult.newSalesCount,
    newExpenseRows: mergeResult.newExpenseCount,
    duplicateRows:
      mergeResult.duplicateSalesCount + mergeResult.duplicateExpenseCount,
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

  const [receivableRecords, setReceivableRecords] = useState<ReceivableRecord[]>(() => {
    const persisted = loadImportedData();
    if (persisted?.arReceivables?.length) {
      return arToReceivableRecords(persisted.arReceivables);
    }
    return initialReceivableRecords;
  });
  const [dateRange, setDateRange] = useState<DateRange>(
    getDateRangeForPeriod(DEFAULT_FINANCIAL_PERIOD)
  );

  const usesImportedData = hasActiveImport(importedData);

  /** Active revenue: imported sales only; empty when no import. */
  const revenueRecords = useMemo(() => {
    if (!usesImportedData || !importedData || importedData.sales.length === 0) {
      return [];
    }
    return salesToRevenueRecords(importedData.sales);
  }, [usesImportedData, importedData]);

  /** Active expenses: imported rows only; empty when no import. */
  const expenseRecords = useMemo(() => {
    if (!usesImportedData || !importedData || importedData.expenses.length === 0) {
      return [];
    }
    return importExpensesToFinancial(importedData.expenses);
  }, [usesImportedData, importedData]);

  const setRevenueRecords = useCallback(
    (action: SetStateAction<RevenueRecord[]>) => {
      if (!usesImportedData || !importedData) return;
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
    },
    [usesImportedData, importedData]
  );

  const setExpenseRecords = useCallback(
    (action: SetStateAction<ExpenseRecord[]>) => {
      if (!usesImportedData || !importedData) return;
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
    },
    [usesImportedData, importedData]
  );

  const applyImportedData = useCallback(
    (
      incoming: ImportedData,
      mapping: ImportMapping,
      historyMeta: ImportHistoryMeta
    ): MergeImportResult => {
      let mergeResult!: MergeImportResult;
      setImportedData((current) => {
        mergeResult = mergeImportedData(current, incoming);
        saveImportedData(mergeResult.merged);
        return mergeResult.merged;
      });
      // Sync receivableRecords when AR data is present in the merged result
      if (mergeResult.merged.arReceivables.length > 0) {
        setReceivableRecords(arToReceivableRecords(mergeResult.merged.arReceivables));
      }
      saveImportMapping(mapping);
      const historyItem = createHistoryItem(
        historyMeta,
        incoming.importedAt,
        mergeResult
      );
      const nextHistory = addImportHistoryItem(historyItem);
      setImportMapping(mapping);
      setImportHistory(nextHistory);
      return mergeResult;
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
    setReceivableRecords(initialReceivableRecords);
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

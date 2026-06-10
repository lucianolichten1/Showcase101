import { useCallback, useEffect, useState } from "react";
import { useSupabaseRealtimeRefresh } from "@/lib/useSupabaseRealtimeRefresh";
import type { ExpenseRecord } from "@/domains/financial/types";
import {
  createCompanyExpense,
  deleteCompanyExpense,
  fetchCompanyExpenses,
  updateCompanyExpense,
  type ExpenseInput,
} from "./expenseService";

export interface UseCompanyNativeExpensesResult {
  nativeExpenses: ExpenseRecord[];
  loading: boolean;
  error: string | null;
  createExpense: (input: ExpenseInput) => Promise<ExpenseRecord>;
  updateExpense: (id: string, input: ExpenseInput) => Promise<ExpenseRecord>;
  deleteExpense: (id: string) => Promise<void>;
  refreshExpenses: () => Promise<void>;
}

export function useCompanyNativeExpenses(
  companyId: string | null
): UseCompanyNativeExpensesResult {
  const [nativeExpenses, setNativeExpenses] = useState<ExpenseRecord[]>([]);
  const [loading, setLoading] = useState(Boolean(companyId));
  const [error, setError] = useState<string | null>(null);

  const refreshExpenses = useCallback(async () => {
    if (!companyId) {
      setNativeExpenses([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const rows = await fetchCompanyExpenses(companyId);
      setNativeExpenses(rows);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar los gastos");
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    void refreshExpenses();
  }, [refreshExpenses]);

  useSupabaseRealtimeRefresh(companyId, "company-expenses", "company_expenses", refreshExpenses);

  const createExpense = useCallback(
    async (input: ExpenseInput) => {
      if (!companyId) throw new Error("No hay empresa activa");
      const created = await createCompanyExpense(companyId, input);
      setNativeExpenses((prev) => [created, ...prev]);
      setError(null);
      return created;
    },
    [companyId]
  );

  const updateExpense = useCallback(
    async (id: string, input: ExpenseInput) => {
      if (!companyId) throw new Error("No hay empresa activa");
      const updated = await updateCompanyExpense(companyId, id, input);
      setNativeExpenses((prev) => prev.map((row) => (row.id === id ? updated : row)));
      setError(null);
      return updated;
    },
    [companyId]
  );

  const deleteExpense = useCallback(
    async (id: string) => {
      if (!companyId) throw new Error("No hay empresa activa");
      await deleteCompanyExpense(companyId, id);
      setNativeExpenses((prev) => prev.filter((row) => row.id !== id));
      setError(null);
    },
    [companyId]
  );

  return {
    nativeExpenses,
    loading,
    error,
    createExpense,
    updateExpense,
    deleteExpense,
    refreshExpenses,
  };
}

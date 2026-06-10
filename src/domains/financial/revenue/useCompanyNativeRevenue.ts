import { useCallback, useEffect, useState } from "react";
import { useSupabaseRealtimeRefresh } from "@/lib/useSupabaseRealtimeRefresh";
import type { RevenueRecord } from "@/domains/financial/types";
import {
  createCompanyRevenue,
  deleteCompanyRevenue,
  fetchCompanyRevenue,
  updateCompanyRevenue,
  type RevenueInput,
} from "./revenueService";

export interface UseCompanyNativeRevenueResult {
  nativeRevenue: RevenueRecord[];
  loading: boolean;
  error: string | null;
  createRevenue: (input: RevenueInput) => Promise<RevenueRecord>;
  updateRevenue: (id: string, input: RevenueInput) => Promise<RevenueRecord>;
  deleteRevenue: (id: string) => Promise<void>;
  refreshRevenue: () => Promise<void>;
}

export function useCompanyNativeRevenue(
  companyId: string | null
): UseCompanyNativeRevenueResult {
  const [nativeRevenue, setNativeRevenue] = useState<RevenueRecord[]>([]);
  const [loading, setLoading] = useState(Boolean(companyId));
  const [error, setError] = useState<string | null>(null);

  const refreshRevenue = useCallback(async () => {
    if (!companyId) {
      setNativeRevenue([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const rows = await fetchCompanyRevenue(companyId);
      setNativeRevenue(rows);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cargar los ingresos");
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    void refreshRevenue();
  }, [refreshRevenue]);

  useSupabaseRealtimeRefresh(companyId, "company-revenue", "company_revenue", refreshRevenue);

  const createRevenue = useCallback(
    async (input: RevenueInput) => {
      if (!companyId) throw new Error("No hay empresa activa");
      const created = await createCompanyRevenue(companyId, input);
      setNativeRevenue((prev) => [created, ...prev]);
      setError(null);
      return created;
    },
    [companyId]
  );

  const updateRevenue = useCallback(
    async (id: string, input: RevenueInput) => {
      if (!companyId) throw new Error("No hay empresa activa");
      const updated = await updateCompanyRevenue(companyId, id, input);
      setNativeRevenue((prev) => prev.map((row) => (row.id === id ? updated : row)));
      setError(null);
      return updated;
    },
    [companyId]
  );

  const deleteRevenue = useCallback(
    async (id: string) => {
      if (!companyId) throw new Error("No hay empresa activa");
      await deleteCompanyRevenue(companyId, id);
      setNativeRevenue((prev) => prev.filter((row) => row.id !== id));
      setError(null);
    },
    [companyId]
  );

  return {
    nativeRevenue,
    loading,
    error,
    createRevenue,
    updateRevenue,
    deleteRevenue,
    refreshRevenue,
  };
}

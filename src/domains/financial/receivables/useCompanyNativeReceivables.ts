import { useCallback, useEffect, useState } from "react";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type { ReceivableRecord } from "@/domains/financial/types";
import {
  createCompanyReceivable,
  deleteCompanyReceivable,
  fetchCompanyReceivables,
  recordCompanyReceivablePayment,
  updateCompanyReceivable,
  type ReceivableInput,
} from "./receivableService";

export function useCompanyNativeReceivables(companyId: string | null) {
  const [nativeReceivables, setNativeReceivables] = useState<ReceivableRecord[]>([]);
  const [loading, setLoading] = useState(Boolean(companyId));
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!companyId) {
      setNativeReceivables([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setNativeReceivables(await fetchCompanyReceivables(companyId));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar las facturas");
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!companyId || !isSupabaseConfigured) return;
    const channel = supabase
      .channel(`company-receivables-${companyId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "company_receivables", filter: `company_id=eq.${companyId}` },
        () => void refresh()
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [companyId, refresh]);

  const createReceivable = useCallback(
    async (input: ReceivableInput) => {
      if (!companyId) throw new Error("No hay empresa activa");
      const created = await createCompanyReceivable(companyId, input);
      setNativeReceivables((prev) => [created, ...prev]);
      return created;
    },
    [companyId]
  );

  const updateReceivable = useCallback(
    async (id: number, input: ReceivableInput) => {
      if (!companyId) throw new Error("No hay empresa activa");
      const updated = await updateCompanyReceivable(companyId, id, input);
      setNativeReceivables((prev) => prev.map((r) => (r.id === id ? updated : r)));
      return updated;
    },
    [companyId]
  );

  const deleteReceivable = useCallback(
    async (id: number) => {
      if (!companyId) throw new Error("No hay empresa activa");
      await deleteCompanyReceivable(companyId, id);
      setNativeReceivables((prev) => prev.filter((r) => r.id !== id));
    },
    [companyId]
  );

  const recordPayment = useCallback(
    async (id: number, payment: number) => {
      if (!companyId) throw new Error("No hay empresa activa");
      const updated = await recordCompanyReceivablePayment(companyId, id, payment);
      setNativeReceivables((prev) => prev.map((r) => (r.id === id ? updated : r)));
      return updated;
    },
    [companyId]
  );

  return {
    nativeReceivables,
    loading,
    error,
    createReceivable,
    updateReceivable,
    deleteReceivable,
    recordPayment,
    refresh,
  };
}

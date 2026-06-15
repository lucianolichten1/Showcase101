import { useCallback, useEffect, useState } from "react";
import { useSupabaseRealtimeRefresh } from "@/lib/useSupabaseRealtimeRefresh";
import type { ReceivableRecord } from "@/domains/financial/types";
import {
  createCompanyReceivable,
  deleteCompanyReceivable,
  deleteCompanyReceivablePayment,
  fetchCompanyReceivables,
  recordCompanyReceivablePayment,
  updateCompanyReceivable,
  type ReceivableInput,
} from "./receivableService";
import type { ReceivablePaymentInput } from "./receivablePaymentTypes";

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

  useSupabaseRealtimeRefresh(companyId, "company-receivables", "company_receivables", refresh);
  useSupabaseRealtimeRefresh(companyId, "company-receivable-payments", "company_receivable_payments", refresh);

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
    async (id: number, input: ReceivablePaymentInput) => {
      if (!companyId) throw new Error("No hay empresa activa");
      const { invoice } = await recordCompanyReceivablePayment(companyId, id, input);
      setNativeReceivables((prev) => prev.map((r) => (r.id === id ? invoice : r)));
      return invoice;
    },
    [companyId]
  );

  const deletePayment = useCallback(
    async (paymentId: number) => {
      if (!companyId) throw new Error("No hay empresa activa");
      const invoice = await deleteCompanyReceivablePayment(companyId, paymentId);
      setNativeReceivables((prev) => prev.map((r) => (r.id === invoice.id ? invoice : r)));
      return invoice;
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
    deletePayment,
    refresh,
  };
}

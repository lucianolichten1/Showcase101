import { useCallback, useEffect, useState } from "react";
import { useSupabaseRealtimeRefresh } from "@/lib/useSupabaseRealtimeRefresh";
import type { ReceivableRecord } from "@/domains/financial/types";
import {
  createCompanyReceivable,
  deleteCompanyReceivable,
  deleteCompanyReceivablePayment,
  fetchCompanyReceivablePayments,
  fetchCompanyReceivables,
  recordCompanyReceivablePayment,
  updateCompanyReceivable,
  type ReceivableInput,
} from "./receivableService";
import type { ReceivablePaymentInput, ReceivablePaymentRecord } from "./receivablePaymentTypes";

export function useCompanyNativeReceivables(companyId: string | null) {
  const [nativeReceivables, setNativeReceivables] = useState<ReceivableRecord[]>([]);
  const [receivablePayments, setReceivablePayments] = useState<ReceivablePaymentRecord[]>([]);
  const [loading, setLoading] = useState(Boolean(companyId));
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!companyId) {
      setNativeReceivables([]);
      setReceivablePayments([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [receivables, payments] = await Promise.all([
        fetchCompanyReceivables(companyId),
        fetchCompanyReceivablePayments(companyId),
      ]);
      setNativeReceivables(receivables);
      setReceivablePayments(payments);
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
      setReceivablePayments((prev) => prev.filter((p) => p.invoiceId !== id));
    },
    [companyId]
  );

  const recordPayment = useCallback(
    async (id: number, input: ReceivablePaymentInput) => {
      if (!companyId) throw new Error("No hay empresa activa");
      const { invoice, payment } = await recordCompanyReceivablePayment(companyId, id, input);
      setNativeReceivables((prev) => prev.map((r) => (r.id === id ? invoice : r)));
      setReceivablePayments((prev) => [payment, ...prev.filter((p) => p.id !== payment.id)]);
      return invoice;
    },
    [companyId]
  );

  const deletePayment = useCallback(
    async (paymentId: number) => {
      if (!companyId) throw new Error("No hay empresa activa");
      const invoice = await deleteCompanyReceivablePayment(companyId, paymentId);
      setNativeReceivables((prev) => prev.map((r) => (r.id === invoice.id ? invoice : r)));
      setReceivablePayments((prev) => prev.filter((p) => p.id !== paymentId));
      return invoice;
    },
    [companyId]
  );

  return {
    nativeReceivables,
    receivablePayments,
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

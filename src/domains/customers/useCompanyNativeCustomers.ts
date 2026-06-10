import { useCallback, useEffect, useState } from "react";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type { CustomerRecord } from "./types";
import {
  createCompanyCustomer,
  deleteCompanyCustomer,
  fetchCompanyCustomers,
  updateCompanyCustomer,
  type CustomerInput,
} from "./customerService";

export function useCompanyNativeCustomers(companyId: string | null) {
  const [nativeCustomers, setNativeCustomers] = useState<CustomerRecord[]>([]);
  const [loading, setLoading] = useState(Boolean(companyId));
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!companyId) {
      setNativeCustomers([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setNativeCustomers(await fetchCompanyCustomers(companyId));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar los clientes");
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
      .channel(`company-customers-${companyId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "company_customers", filter: `company_id=eq.${companyId}` },
        () => void refresh()
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [companyId, refresh]);

  const createCustomer = useCallback(
    async (input: CustomerInput) => {
      if (!companyId) throw new Error("No hay empresa activa");
      const created = await createCompanyCustomer(companyId, input);
      setNativeCustomers((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      return created;
    },
    [companyId]
  );

  const updateCustomer = useCallback(
    async (id: number, input: CustomerInput) => {
      if (!companyId) throw new Error("No hay empresa activa");
      const updated = await updateCompanyCustomer(companyId, id, input);
      setNativeCustomers((prev) => prev.map((r) => (r.id === id ? updated : r)));
      return updated;
    },
    [companyId]
  );

  const deleteCustomer = useCallback(
    async (id: number) => {
      if (!companyId) throw new Error("No hay empresa activa");
      await deleteCompanyCustomer(companyId, id);
      setNativeCustomers((prev) => prev.filter((r) => r.id !== id));
    },
    [companyId]
  );

  return { nativeCustomers, loading, error, createCustomer, updateCustomer, deleteCustomer, refresh };
}

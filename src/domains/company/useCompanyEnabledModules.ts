import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { DEFAULT_ENABLED_MODULES } from "@/domains/admin/modules";
import { loadCompanyEnabledModules } from "@/domains/admin/moduleStorage";
import { getCompanyById } from "@/domains/admin/companyService";
import { useAuth } from "@/domains/auth/AuthContext";

/**
 * Enabled module keys for the active company context (`?companyId=` or owner primary).
 * Merges Supabase company defaults with admin overrides persisted in localStorage.
 */
export function useCompanyEnabledModules(): {
  companyId: string | null;
  enabledModules: string[];
  loading: boolean;
} {
  const { primaryCompanyId, isSuperadmin } = useAuth();
  const [searchParams] = useSearchParams();
  const queryCompanyId = searchParams.get("companyId");
  const companyId =
    (isSuperadmin ? queryCompanyId : primaryCompanyId) ?? queryCompanyId ?? primaryCompanyId;

  const [enabledModules, setEnabledModules] = useState<string[]>(DEFAULT_ENABLED_MODULES);
  const [loading, setLoading] = useState(Boolean(companyId));

  useEffect(() => {
    if (!companyId) {
      setEnabledModules(DEFAULT_ENABLED_MODULES);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    void (async () => {
      try {
        const record = await getCompanyById(companyId);
        const fallback = record?.enabledModules ?? DEFAULT_ENABLED_MODULES;
        const modules = loadCompanyEnabledModules(companyId, fallback);
        if (!cancelled) setEnabledModules(modules);
      } catch {
        if (!cancelled) {
          setEnabledModules(loadCompanyEnabledModules(companyId, DEFAULT_ENABLED_MODULES));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    const onStorage = (e: StorageEvent) => {
      if (e.key?.includes("agro-company-enabled-modules")) {
        const fallback = DEFAULT_ENABLED_MODULES;
        setEnabledModules(loadCompanyEnabledModules(companyId, fallback));
      }
    };
    window.addEventListener("storage", onStorage);

    return () => {
      cancelled = true;
      window.removeEventListener("storage", onStorage);
    };
  }, [companyId]);

  return { companyId, enabledModules, loading };
}

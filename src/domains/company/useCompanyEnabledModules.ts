import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { DEFAULT_ENABLED_MODULES } from "@/domains/admin/modules";
import {
  COMPANY_ENABLED_MODULES_STORAGE_KEY,
  loadCompanyEnabledModules,
} from "@/domains/admin/moduleStorage";
import { getCompanyById } from "@/domains/admin/companyService";
import { useAuth } from "@/domains/auth/AuthContext";
import { COMPANY_ENABLED_MODULES_CHANGED } from "@/domains/company/companyWorkspaceEvents";

/**
 * Enabled module keys for the active company context (`?companyId=` or owner primary).
 * Merges Supabase company defaults with admin overrides persisted in localStorage.
 */
export function useCompanyEnabledModules(): {
  companyId: string | null;
  enabledModules: string[];
  loading: boolean;
  refreshEnabledModules: () => Promise<void>;
} {
  const { primaryCompanyId, isSuperadmin } = useAuth();
  const [searchParams] = useSearchParams();
  const queryCompanyId = searchParams.get("companyId");
  const companyId =
    (isSuperadmin ? queryCompanyId : primaryCompanyId) ?? queryCompanyId ?? primaryCompanyId;

  const [enabledModules, setEnabledModules] = useState<string[]>(DEFAULT_ENABLED_MODULES);
  const [loading, setLoading] = useState(Boolean(companyId));
  const [fallbackModules, setFallbackModules] = useState<string[]>(DEFAULT_ENABLED_MODULES);

  const refreshEnabledModules = useCallback(async () => {
    if (!companyId) {
      setEnabledModules(DEFAULT_ENABLED_MODULES);
      setFallbackModules(DEFAULT_ENABLED_MODULES);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const record = await getCompanyById(companyId);
      const fallback = record?.enabledModules ?? DEFAULT_ENABLED_MODULES;
      setFallbackModules(fallback);
      setEnabledModules(loadCompanyEnabledModules(companyId, fallback));
    } catch {
      setFallbackModules(DEFAULT_ENABLED_MODULES);
      setEnabledModules(loadCompanyEnabledModules(companyId, DEFAULT_ENABLED_MODULES));
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    void refreshEnabledModules();
  }, [refreshEnabledModules]);

  useEffect(() => {
    if (!companyId) return;

    const reloadFromStorage = () => {
      setEnabledModules(loadCompanyEnabledModules(companyId, fallbackModules));
    };

    const onStorage = (e: StorageEvent) => {
      if (e.key === COMPANY_ENABLED_MODULES_STORAGE_KEY || e.key === null) {
        void refreshEnabledModules();
      }
    };

    const onModulesChanged = (e: Event) => {
      const detail = (e as CustomEvent<{ companyId: string }>).detail;
      if (!detail?.companyId || detail.companyId === companyId) {
        reloadFromStorage();
      }
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener(COMPANY_ENABLED_MODULES_CHANGED, onModulesChanged);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(COMPANY_ENABLED_MODULES_CHANGED, onModulesChanged);
    };
  }, [companyId, fallbackModules, refreshEnabledModules]);

  return { companyId, enabledModules, loading, refreshEnabledModules };
}

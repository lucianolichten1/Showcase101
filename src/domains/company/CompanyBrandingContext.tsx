import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { useSearchParams } from "react-router-dom";
import { getCompanyById } from "@/domains/admin/companyService";
import type { CompanyRecord } from "@/domains/admin/types";
import { findCompanyById } from "@/domains/admin/utils";
import { useAuth } from "@/domains/auth/AuthContext";
import {
  DEFAULT_ENABLED_DASHBOARD_WIDGETS,
  isDashboardWidgetEnabled,
  normalizeEnabledDashboardWidgets,
} from "@/domains/admin/dashboardWidgets";
import { brandingToCssVars, resolveCompanyBranding } from "./branding";
import { useCompanyRecords } from "./CompanyDataContext";

type ResolvedBranding = ReturnType<typeof resolveCompanyBranding>;

interface CompanyBrandingContextValue {
  company: CompanyRecord | null;
  branding: ResolvedBranding;
  cssVars: Record<string, string>;
  enabledDashboardWidgets: string[];
  isWidgetEnabled: (key: string) => boolean;
  isLoading: boolean;
  companyId: string | null;
}

const CompanyBrandingContext = createContext<CompanyBrandingContextValue | null>(null);

function resolveActiveCompanyId(
  queryCompanyId: string | null,
  primaryCompanyId: string | null
): string | null {
  return queryCompanyId ?? primaryCompanyId;
}

export function CompanyBrandingProvider({ children }: { children: ReactNode }) {
  const [searchParams] = useSearchParams();
  const { primaryCompanyId } = useAuth();
  const companies = useCompanyRecords();
  const queryCompanyId = searchParams.get("companyId");
  const activeCompanyId = resolveActiveCompanyId(queryCompanyId, primaryCompanyId);

  const fromContext = useMemo(
    () => (activeCompanyId ? findCompanyById(companies, activeCompanyId) : undefined),
    [companies, activeCompanyId]
  );

  const [fetchedCompany, setFetchedCompany] = useState<CompanyRecord | null>(null);
  /** Company id whose fetch has finished (found or not). Used to detect stale results. */
  const [resolvedCompanyId, setResolvedCompanyId] = useState<string | null>(null);

  useEffect(() => {
    if (!activeCompanyId) {
      setFetchedCompany(null);
      setResolvedCompanyId(null);
      return;
    }

    if (fromContext) {
      setFetchedCompany(fromContext);
      setResolvedCompanyId(activeCompanyId);
      return;
    }

    let cancelled = false;
    getCompanyById(activeCompanyId)
      .then((record) => {
        if (!cancelled) setFetchedCompany(record);
      })
      .catch(() => {
        if (!cancelled) setFetchedCompany(null);
      })
      .finally(() => {
        if (!cancelled) setResolvedCompanyId(activeCompanyId);
      });

    return () => {
      cancelled = true;
    };
  }, [activeCompanyId, fromContext]);

  const company = fromContext ?? fetchedCompany;
  // True from the first render whenever a company is expected but not yet
  // resolved — prevents painting the workspace with default branding/widgets.
  const isLoading = Boolean(
    activeCompanyId && !fromContext && resolvedCompanyId !== activeCompanyId
  );
  const branding = useMemo(() => resolveCompanyBranding(company), [company]);
  const cssVars = useMemo(() => brandingToCssVars(branding), [branding]);
  const enabledDashboardWidgets = useMemo(
    () =>
      company
        ? normalizeEnabledDashboardWidgets(company.enabledDashboardWidgets)
        : [...DEFAULT_ENABLED_DASHBOARD_WIDGETS],
    [company]
  );
  const isWidgetEnabled = useMemo(
    () => (key: string) => isDashboardWidgetEnabled(enabledDashboardWidgets, key),
    [enabledDashboardWidgets]
  );

  const value = useMemo(
    () => ({
      company,
      branding,
      cssVars,
      enabledDashboardWidgets,
      isWidgetEnabled,
      isLoading,
      companyId: activeCompanyId,
    }),
    [company, branding, cssVars, enabledDashboardWidgets, isWidgetEnabled, activeCompanyId, isLoading]
  );

  return (
    <CompanyBrandingContext.Provider value={value}>{children}</CompanyBrandingContext.Provider>
  );
}

export function useCompanyBranding(): CompanyBrandingContextValue {
  const ctx = useContext(CompanyBrandingContext);
  if (!ctx) {
    const branding = resolveCompanyBranding(null);
    const defaultWidgets = [...DEFAULT_ENABLED_DASHBOARD_WIDGETS];
    return {
      company: null,
      branding,
      cssVars: brandingToCssVars(branding),
      enabledDashboardWidgets: defaultWidgets,
      isWidgetEnabled: (key: string) => isDashboardWidgetEnabled(defaultWidgets, key),
      isLoading: false,
      companyId: null,
    };
  }
  return ctx;
}

export function useCompanyBrandingStyle(): CSSProperties {
  const { cssVars } = useCompanyBranding();
  return cssVars as CSSProperties;
}

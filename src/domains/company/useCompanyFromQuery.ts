import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getCompanyById } from "@/domains/admin/companyService";
import type { CompanyRecord } from "@/domains/admin/types";
import { findCompanyById } from "@/domains/admin/utils";
import { useCompanyRecords } from "./CompanyDataContext";

export interface CompanyFromQueryResult {
  /** Raw `companyId` query param, if present. */
  companyId: string | null;
  /** Resolved company when `companyId` matches a known record. */
  company: CompanyRecord | null;
  /** True when `companyId` is in the URL but no company was found. */
  isInvalid: boolean;
  /** True when any `companyId` query param is present. */
  hasCompanyContext: boolean;
  /** True while resolving company from Supabase (after context miss). */
  isResolving: boolean;
}

/**
 * Reads `companyId` from the URL query string and resolves it against platform company records.
 * Falls back to Supabase when the id is not in local context (e.g. after admin loads from DB).
 * Financial data itself stays local — this only resolves company metadata.
 */
export function useCompanyFromQuery(): CompanyFromQueryResult {
  const [searchParams] = useSearchParams();
  const companies = useCompanyRecords();
  const companyIdParam = searchParams.get("companyId");
  const [fetchedCompany, setFetchedCompany] = useState<CompanyRecord | null>(null);
  const [isResolving, setIsResolving] = useState(false);

  const fromContext = useMemo(
    () => (companyIdParam ? findCompanyById(companies, companyIdParam) : undefined),
    [companies, companyIdParam]
  );

  useEffect(() => {
    if (!companyIdParam) {
      setFetchedCompany(null);
      setIsResolving(false);
      return;
    }

    if (fromContext) {
      setFetchedCompany(fromContext);
      setIsResolving(false);
      return;
    }

    let cancelled = false;
    setIsResolving(true);
    getCompanyById(companyIdParam)
      .then((record) => {
        if (!cancelled) setFetchedCompany(record);
      })
      .catch(() => {
        if (!cancelled) setFetchedCompany(null);
      })
      .finally(() => {
        if (!cancelled) setIsResolving(false);
      });

    return () => {
      cancelled = true;
    };
  }, [companyIdParam, fromContext]);

  return useMemo(() => {
    const companyId = companyIdParam;
    if (!companyId) {
      return {
        companyId: null,
        company: null,
        isInvalid: false,
        hasCompanyContext: false,
        isResolving: false,
      };
    }

    const company = fromContext ?? fetchedCompany;
    return {
      companyId,
      company,
      isInvalid: !isResolving && company === null,
      hasCompanyContext: true,
      isResolving,
    };
  }, [companyIdParam, fromContext, fetchedCompany, isResolving]);
}

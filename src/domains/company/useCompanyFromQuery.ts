import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
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
}

/**
 * Reads `companyId` from the URL query string and resolves it against platform company records.
 * Frontend-only — does not load data from a company database.
 */
export function useCompanyFromQuery(): CompanyFromQueryResult {
  const [searchParams] = useSearchParams();
  const companies = useCompanyRecords();
  const companyIdParam = searchParams.get("companyId");

  return useMemo(() => {
    const companyId = companyIdParam;
    if (!companyId) {
      return {
        companyId: null,
        company: null,
        isInvalid: false,
        hasCompanyContext: false,
      };
    }

    const company = findCompanyById(companies, companyId) ?? null;
    return {
      companyId,
      company,
      isInvalid: company === null,
      hasCompanyContext: true,
    };
  }, [companyIdParam, companies]);
}

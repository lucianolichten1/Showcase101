import { createContext, useContext, type ReactNode } from "react";
import { initialCompanies } from "@/domains/admin/mockData";
import type { CompanyRecord } from "@/domains/admin/types";

const CompanyDataContext = createContext<CompanyRecord[]>(initialCompanies);

export function CompanyDataProvider({
  companies,
  children,
}: {
  companies: CompanyRecord[];
  children: ReactNode;
}) {
  return (
    <CompanyDataContext.Provider value={companies}>{children}</CompanyDataContext.Provider>
  );
}

export function useCompanyRecords(): CompanyRecord[] {
  return useContext(CompanyDataContext);
}

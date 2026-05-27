import { createContext, useContext, type ReactNode } from "react";
import type { CompanyRecord } from "@/domains/admin/types";

const CompanyDataContext = createContext<CompanyRecord[]>([]);

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

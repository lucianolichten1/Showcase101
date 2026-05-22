import type { CompanyRecord } from "./types";

export const initialCompanies: CompanyRecord[] = [
  {
    id: "co-1",
    name: "Santa Fe Agro",
    niche: "Agro",
    ownerEmail: "owner@santafe.com",
    status: "Active",
    createdAt: "2025-11-12",
  },
  {
    id: "co-2",
    name: "Ganadera Norte",
    niche: "Agro",
    ownerEmail: "admin@ganadera.com",
    status: "Active",
    createdAt: "2026-01-08",
  },
  {
    id: "co-3",
    name: "Demo Company",
    niche: "Agro",
    ownerEmail: "demo@example.com",
    status: "Inactive",
    createdAt: "2026-03-20",
  },
];

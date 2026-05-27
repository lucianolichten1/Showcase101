import type { CompanyDatabaseStatus } from "./database";
import type { CompanyRecord } from "./types";

export function formatCreatedDate(iso: string): string {
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function statusBadgeClass(status: CompanyRecord["status"]) {
  return status === "Active"
    ? "bg-green-50 text-green-700 border-green-100"
    : "bg-stone-100 text-stone-600 border-stone-200";
}

export function databaseStatusBadgeClass(status: CompanyDatabaseStatus) {
  if (status === "not_connected") {
    return "bg-amber-50 text-amber-800 border-amber-100";
  }
  return "bg-stone-100 text-stone-600 border-stone-200";
}

export function nextCompanyId(companies: CompanyRecord[]): string {
  const nums = companies
    .map((c) => /^co-(\d+)$/.exec(c.id)?.[1])
    .filter(Boolean)
    .map((n) => Number(n));
  const max = nums.length ? Math.max(...nums) : 0;
  return `co-${max + 1}`;
}

export function findCompanyById(
  companies: CompanyRecord[],
  companyId: string | undefined
): CompanyRecord | undefined {
  if (!companyId) return undefined;
  return companies.find((c) => c.id === companyId);
}

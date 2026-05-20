import type { CustomerRecord } from "./types";
import type { ReceivableRecord } from "@/domains/financial/types";

// ─── Customer counts ──────────────────────────────────────────────────────────

export const countCustomers = (customers: CustomerRecord[]): number =>
  customers.length;

export const countActiveCustomers = (customers: CustomerRecord[]): number =>
  customers.filter((c) => c.status === "Active").length;

// ─── Per-customer financials (computed from receivables) ──────────────────────

export function getCustomerTotalInvoiced(
  customerName: string,
  receivables: ReceivableRecord[]
): number {
  return receivables
    .filter((r) => r.customer === customerName)
    .reduce((sum, r) => sum + r.amount, 0);
}

export function getCustomerTotalPaid(
  customerName: string,
  receivables: ReceivableRecord[]
): number {
  return receivables
    .filter((r) => r.customer === customerName)
    .reduce((sum, r) => sum + r.amountPaid, 0);
}

export function getCustomerOutstanding(
  customerName: string,
  receivables: ReceivableRecord[]
): number {
  return receivables
    .filter((r) => r.customer === customerName && r.status !== "Paid")
    .reduce((sum, r) => sum + (r.amount - r.amountPaid), 0);
}

export function getCustomerRisk(
  customerName: string,
  receivables: ReceivableRecord[]
): "Low" | "Medium" | "High" {
  const worst = receivables
    .filter((r) => r.customer === customerName && r.status === "Overdue")
    .sort((a, b) => b.overdueDays - a.overdueDays)[0];
  if (!worst) return "Low";
  if (worst.overdueDays > 45) return "High";
  if (worst.overdueDays >= 15) return "Medium";
  return "Low";
}

// ─── Aggregate helpers ────────────────────────────────────────────────────────

export function totalOutstandingAcrossCustomers(
  customers: CustomerRecord[],
  receivables: ReceivableRecord[]
): number {
  return customers.reduce(
    (sum, c) => sum + getCustomerOutstanding(c.name, receivables),
    0
  );
}

export function countHighRiskCustomers(
  customers: CustomerRecord[],
  receivables: ReceivableRecord[]
): number {
  return customers.filter(
    (c) => getCustomerRisk(c.name, receivables) === "High"
  ).length;
}

/** Group customers by industry/category with invoice totals computed from receivables */
export function groupByIndustry(
  customers: CustomerRecord[],
  receivables: ReceivableRecord[]
): { industry: string; count: number; totalInvoiced: number }[] {
  const industries = Array.from(new Set(customers.map((c) => c.industry ?? "Other")));
  return industries.map((industry) => {
    const group = customers.filter((c) => (c.industry ?? "Other") === industry);
    const totalInvoiced = group.reduce(
      (sum, c) => sum + getCustomerTotalInvoiced(c.name, receivables),
      0
    );
    return { industry, count: group.length, totalInvoiced };
  });
}

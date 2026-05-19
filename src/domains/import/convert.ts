import type { ExpenseRecord, RevenueRecord } from "@/domains/financial/types";
import type { ImportExpenseRecord, SalesRecord } from "./types";

/** Convert imported sales into financial revenue records (optional cost preserved). */
export function salesToRevenueRecords(sales: SalesRecord[]): RevenueRecord[] {
  return sales.map((sale) => ({
    id: sale.id,
    date: sale.date,
    amount: sale.revenue,
    currency: "Bs",
    sourceClient: sale.customerName ?? "—",
    productService: sale.product ?? "—",
    category: "Other" as const,
    status: "Collected",
    paymentMethod: "Other",
    invoiceNumber: "",
    notes: sale.quantity != null ? `Qty: ${sale.quantity}` : "",
    cost: sale.cost ?? 0,
  }));
}

/** Convert imported expenses into financial expense records. */
export function importExpensesToFinancial(
  expenses: ImportExpenseRecord[]
): ExpenseRecord[] {
  return expenses.map((row) => ({
    id: row.id,
    date: row.date,
    amount: row.amount,
    currency: "Bs",
    category: "Other" as const,
    description: row.description ?? row.category ?? "—",
    vendor: row.vendor ?? "—",
    status: "Paid",
    paymentMethod: "Other",
    notes: row.category ?? "",
  }));
}

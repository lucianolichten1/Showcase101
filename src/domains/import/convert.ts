import type { ExpenseRecord, ReceivableRecord, ReceivablePaymentStatus, RevenueRecord } from "@/domains/financial/types";
import type { CustomerRecord } from "@/domains/customers/types";
import type { ImportARRecord, ImportCustomerRecord, ImportExpenseRecord, SalesRecord } from "./types";

// ─── Customer conversion ──────────────────────────────────────────────────────

function normalizeCustomerStatus(raw: string | undefined): "Active" | "Inactive" {
  const s = (raw ?? "").toLowerCase().trim();
  if (s === "inactive" || s === "false" || s === "no") return "Inactive";
  return "Active";
}

/** Convert imported customer rows into CustomerRecord[] for the Customers page. */
export function importCustomersToRecords(records: ImportCustomerRecord[]): CustomerRecord[] {
  return records.map((r, i) => ({
    id: i + 1,
    name: r.name,
    email: r.email,
    phone: r.phone,
    city: r.city,
    industry: r.industry,
    status: normalizeCustomerStatus(r.status),
    createdAt: new Date().toISOString().split("T")[0],
  }));
}

// ─── AR conversion helpers ────────────────────────────────────────────────────

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function isoToDisplayDate(isoDate: string): string {
  const [, month, day] = isoDate.split("-").map(Number);
  return `${MONTH_NAMES[(month ?? 1) - 1]} ${day}`;
}

function computeOverdueDays(isoDate: string): number {
  const due = new Date(isoDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.max(0, Math.floor((today.getTime() - due.getTime()) / 86_400_000));
}

function normalizeARStatus(raw: string | undefined, overdueDays: number): ReceivablePaymentStatus {
  const s = (raw ?? "").toLowerCase().trim();
  if (s === "paid") return "Paid";
  if (s === "partially paid" || s === "partial") return "Partially Paid";
  if (overdueDays > 0) return "Overdue";
  return "Pending";
}

/** Convert imported AR records into ReceivableRecord[] for the AR page. */
export function arToReceivableRecords(records: ImportARRecord[]): ReceivableRecord[] {
  return records.map((r, i) => {
    const dueDateIso = r.dueDate ?? r.invoiceDate;
    const overdueDays = computeOverdueDays(dueDateIso);
    return {
      id: i + 1,
      customer: r.customerName ?? "—",
      invoiceNumber: r.invoiceNumber ?? `IMP-${String(i + 1).padStart(3, "0")}`,
      amount: r.amount,
      amountPaid: 0,
      dueDate: isoToDisplayDate(dueDateIso),
      overdueDays,
      status: normalizeARStatus(r.status, overdueDays),
    };
  });
}

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

/** Convert financial revenue records back to imported sales shape (for edits/persistence). */
export function revenueRecordsToSales(revenue: RevenueRecord[]): SalesRecord[] {
  return revenue.map((record) => ({
    id: record.id,
    date: record.date,
    revenue: record.amount,
    customerName:
      record.sourceClient && record.sourceClient !== "—"
        ? record.sourceClient
        : undefined,
    product:
      record.productService && record.productService !== "—"
        ? record.productService
        : undefined,
    cost: record.cost,
  }));
}

/** Convert financial expense records back to imported expense shape (for edits/persistence). */
export function expenseRecordsToImport(
  expenses: ExpenseRecord[]
): ImportExpenseRecord[] {
  return expenses.map((record) => ({
    id: record.id,
    date: record.date,
    amount: record.amount,
    category: record.notes || record.category,
    description: record.description,
    vendor: record.vendor !== "—" ? record.vendor : undefined,
  }));
}

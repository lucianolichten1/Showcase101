import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { getSupabaseErrorMessage } from "@/lib/supabaseError";
import type { ExpenseRecord, RevenueRecord } from "@/domains/financial/types";
import type { BankTransactionReferenceType } from "./types";
import type {
  PurchaseOrderBankSyncInput,
  ReceivablePaymentBankSyncInput,
  SalesOrderBankSyncInput,
} from "./bankAccountSyncLogic";

/** Remove ledger rows linked to a reference type + id. */
export async function removeServerLinkedBankTransactions(
  companyId: string,
  referenceType: BankTransactionReferenceType,
  referenceId: string
): Promise<void> {
  if (!isSupabaseConfigured) return;

  const { error } = await supabase
    .from("company_bank_transactions")
    .delete()
    .eq("company_id", companyId)
    .eq("reference_type", referenceType)
    .eq("reference_id", referenceId);

  if (error) {
    throw new Error(getSupabaseErrorMessage(error, "No se pudo actualizar el movimiento bancario."));
  }
}

/**
 * Upsert bank ledger row for a paid bank-transfer expense.
 * Mirrors DB trigger sync_expense_bank_transaction (app layer for reliability).
 */
export async function syncServerExpenseBankTransaction(
  companyId: string,
  expense: ExpenseRecord
): Promise<void> {
  if (!isSupabaseConfigured) return;

  await removeServerLinkedBankTransactions(companyId, "expense", expense.id);

  if (
    expense.status !== "Paid" ||
    expense.paymentMethod !== "Bank Transfer" ||
    !expense.bankAccountId
  ) {
    return;
  }

  const description = expense.description.trim() || expense.vendor;
  const { error } = await supabase.from("company_bank_transactions").insert({
    company_id: companyId,
    bank_account_id: expense.bankAccountId,
    transaction_date: expense.date,
    description,
    amount: expense.amount,
    type: "expense",
    reference_type: "expense",
    reference_id: expense.id,
  });

  if (error) {
    throw new Error(getSupabaseErrorMessage(error, "No se pudo registrar el gasto en la cuenta bancaria."));
  }
}

/**
 * Upsert bank ledger row for collected bank-transfer revenue.
 * Mirrors DB trigger sync_revenue_bank_transaction.
 */
export async function syncServerRevenueBankTransaction(
  companyId: string,
  revenue: RevenueRecord
): Promise<void> {
  if (!isSupabaseConfigured) return;

  await removeServerLinkedBankTransactions(companyId, "revenue", revenue.id);

  if (
    revenue.status !== "Collected" ||
    revenue.paymentMethod !== "Bank Transfer" ||
    !revenue.bankAccountId
  ) {
    return;
  }

  const description =
    revenue.productService.trim() || revenue.sourceClient.trim() || "Ingreso";
  const { error } = await supabase.from("company_bank_transactions").insert({
    company_id: companyId,
    bank_account_id: revenue.bankAccountId,
    transaction_date: revenue.date,
    description,
    amount: revenue.amount,
    type: "income",
    reference_type: "revenue",
    reference_id: revenue.id,
  });

  if (error) {
    throw new Error(getSupabaseErrorMessage(error, "No se pudo registrar el ingreso en la cuenta bancaria."));
  }
}

export async function syncServerReceivablePaymentBankTransaction(
  companyId: string,
  payment: ReceivablePaymentBankSyncInput
): Promise<void> {
  if (!isSupabaseConfigured) return;

  const refId = String(payment.id);
  await removeServerLinkedBankTransactions(companyId, "receivable", refId);

  if (payment.paymentMethod !== "Bank Transfer" || !payment.bankAccountId) {
    return;
  }

  const description = `Cobro ${payment.invoiceNumber} — ${payment.customerName}`;
  const { error } = await supabase.from("company_bank_transactions").insert({
    company_id: companyId,
    bank_account_id: payment.bankAccountId,
    transaction_date: payment.paymentDate,
    description,
    amount: payment.amount,
    type: "income",
    reference_type: "receivable",
    reference_id: refId,
  });

  if (error) {
    throw new Error(
      getSupabaseErrorMessage(error, "No se pudo registrar el cobro en la cuenta bancaria.")
    );
  }
}

export async function syncServerPurchaseOrderBankTransaction(
  companyId: string,
  po: PurchaseOrderBankSyncInput
): Promise<void> {
  if (!isSupabaseConfigured) return;

  const refId = String(po.id);
  await removeServerLinkedBankTransactions(companyId, "purchase_order", refId);

  if (
    po.status !== "Received" ||
    po.paymentMethod !== "Bank Transfer" ||
    !po.bankAccountId
  ) {
    return;
  }

  const { error } = await supabase.from("company_bank_transactions").insert({
    company_id: companyId,
    bank_account_id: po.bankAccountId,
    transaction_date: po.receivedDate ?? new Date().toISOString().slice(0, 10),
    description: `Orden de compra ${po.poNumber}`,
    amount: po.total,
    type: "expense",
    reference_type: "purchase_order",
    reference_id: refId,
  });

  if (error) {
    throw new Error(
      getSupabaseErrorMessage(error, "No se pudo registrar la orden de compra en la cuenta bancaria.")
    );
  }
}

export async function syncServerSalesOrderBankTransaction(
  companyId: string,
  so: SalesOrderBankSyncInput
): Promise<void> {
  if (!isSupabaseConfigured) return;

  const refId = String(so.id);
  await removeServerLinkedBankTransactions(companyId, "sales_order", refId);

  if (
    so.status !== "Fulfilled" ||
    so.paymentMethod !== "Bank Transfer" ||
    !so.bankAccountId
  ) {
    return;
  }

  const { error } = await supabase.from("company_bank_transactions").insert({
    company_id: companyId,
    bank_account_id: so.bankAccountId,
    transaction_date: so.fulfilledDate ?? new Date().toISOString().slice(0, 10),
    description: `Orden de venta ${so.soNumber}`,
    amount: so.total,
    type: "income",
    reference_type: "sales_order",
    reference_id: refId,
  });

  if (error) {
    throw new Error(
      getSupabaseErrorMessage(error, "No se pudo registrar la orden de venta en la cuenta bancaria.")
    );
  }
}

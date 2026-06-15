import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { isPersistedNumericId } from "@/domains/financial/persistence/isPersistedNumericId";
import type { PaymentMethod, ReceivablePaymentStatus, ReceivableRecord } from "@/domains/financial/types";
import { loadCompanyBankAccountsFromStorage, saveCompanyBankAccountsToStorage } from "@/domains/financial/bank-accounts/bankAccountStorage";
import {
  syncLocalReceivablePaymentBankTransaction,
  removeLocalReceivablePaymentBankTransaction,
} from "@/domains/financial/bank-accounts/bankAccountLocalSync";
import { syncServerReceivablePaymentBankTransaction } from "@/domains/financial/bank-accounts/bankAccountLinkedSync";
import {
  calcOverdueDaysFromIso,
  deriveReceivableStatus,
  isoToDisplayDueDate,
} from "./receivableDates";
import type { ReceivablePaymentInput, ReceivablePaymentRecord } from "./receivablePaymentTypes";

export interface CompanyReceivableRow {
  id: number;
  company_id: string;
  customer_name: string;
  invoice_number: string;
  amount: number;
  amount_paid: number;
  due_date: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface CompanyReceivablePaymentRow {
  id: number;
  company_id: string;
  invoice_id: number;
  amount: number;
  payment_date: string;
  payment_method: string;
  bank_account_id: string | null;
  created_at: string;
}

export interface ReceivableInput {
  customer: string;
  invoiceNumber: string;
  amount: number;
  amountPaid: number;
  dueDateIso: string;
}

const STORAGE_PREFIX = "agro-company-receivables-v1";
const PAYMENTS_STORAGE_PREFIX = "agro-company-receivable-payments-v1";

function storageKey(companyId: string): string {
  return `${STORAGE_PREFIX}-${companyId}`;
}

function paymentsStorageKey(companyId: string): string {
  return `${PAYMENTS_STORAGE_PREFIX}-${companyId}`;
}

function loadFromStorage(companyId: string): ReceivableRecord[] {
  try {
    const raw = localStorage.getItem(storageKey(companyId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ReceivableRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveToStorage(companyId: string, records: ReceivableRecord[]): void {
  localStorage.setItem(storageKey(companyId), JSON.stringify(records));
}

function loadPaymentsFromStorage(companyId: string): ReceivablePaymentRecord[] {
  try {
    const raw = localStorage.getItem(paymentsStorageKey(companyId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ReceivablePaymentRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function savePaymentsToStorage(companyId: string, records: ReceivablePaymentRecord[]): void {
  localStorage.setItem(paymentsStorageKey(companyId), JSON.stringify(records));
}

function mapPaymentRow(row: CompanyReceivablePaymentRow): ReceivablePaymentRecord {
  return {
    id: Number(row.id),
    invoiceId: Number(row.invoice_id),
    amount: Number(row.amount),
    paymentDate: row.payment_date.slice(0, 10),
    paymentMethod: row.payment_method as PaymentMethod,
    bankAccountId: row.bank_account_id,
    createdAt: row.created_at,
  };
}

function mapRowToRecord(row: CompanyReceivableRow): ReceivableRecord {
  const amount = Number(row.amount);
  const amountPaid = Number(row.amount_paid);
  const dueDateIso = row.due_date.slice(0, 10);
  const overdueDays = calcOverdueDaysFromIso(dueDateIso);
  const status = deriveReceivableStatus(amount, amountPaid, dueDateIso, row.status);
  return {
    id: Number(row.id),
    customer: row.customer_name,
    invoiceNumber: row.invoice_number,
    amount,
    amountPaid,
    dueDate: isoToDisplayDueDate(dueDateIso),
    overdueDays,
    status,
  };
}

function toRecord(id: number, input: ReceivableInput): ReceivableRecord {
  const overdueDays = calcOverdueDaysFromIso(input.dueDateIso);
  const status = deriveReceivableStatus(input.amount, input.amountPaid, input.dueDateIso);
  return {
    id,
    customer: input.customer,
    invoiceNumber: input.invoiceNumber,
    amount: input.amount,
    amountPaid: input.amountPaid,
    dueDate: isoToDisplayDueDate(input.dueDateIso),
    overdueDays,
    status,
  };
}

function mapInputToRow(input: ReceivableInput, status: ReceivablePaymentStatus) {
  return {
    customer_name: input.customer,
    invoice_number: input.invoiceNumber,
    amount: input.amount,
    amount_paid: input.amountPaid,
    due_date: input.dueDateIso,
    status,
    updated_at: new Date().toISOString(),
  };
}

function receivableDueDateIso(current: ReceivableRecord): string {
  if (current.dueDate.includes("-")) return current.dueDate.slice(0, 10);
  const parts = current.dueDate.split(" ");
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const m = months.indexOf(parts[0]) + 1;
  return `${new Date().getFullYear()}-${String(m).padStart(2, "0")}-${String(parseInt(parts[1], 10)).padStart(2, "0")}`;
}

async function syncPaymentBankLedger(
  companyId: string,
  payment: ReceivablePaymentRecord,
  invoice: ReceivableRecord
): Promise<void> {
  const bankInput = {
    id: payment.id,
    amount: payment.amount,
    paymentDate: payment.paymentDate,
    paymentMethod: payment.paymentMethod,
    bankAccountId: payment.bankAccountId,
    invoiceNumber: invoice.invoiceNumber,
    customerName: invoice.customer,
  };

  if (!isSupabaseConfigured) {
    const accounts = loadCompanyBankAccountsFromStorage(companyId);
    const synced = syncLocalReceivablePaymentBankTransaction(companyId, accounts, bankInput);
    saveCompanyBankAccountsToStorage(companyId, synced);
    return;
  }

  await syncServerReceivablePaymentBankTransaction(companyId, bankInput);
}

async function removePaymentBankLedger(companyId: string, paymentId: number): Promise<void> {
  if (!isSupabaseConfigured) {
    const accounts = loadCompanyBankAccountsFromStorage(companyId);
    const synced = removeLocalReceivablePaymentBankTransaction(companyId, accounts, paymentId);
    saveCompanyBankAccountsToStorage(companyId, synced);
    return;
  }

  const { error } = await supabase
    .from("company_bank_transactions")
    .delete()
    .eq("company_id", companyId)
    .eq("reference_type", "receivable")
    .eq("reference_id", String(paymentId));

  if (error) throw error;
}

export async function fetchCompanyReceivables(companyId: string): Promise<ReceivableRecord[]> {
  if (!isSupabaseConfigured) return loadFromStorage(companyId);

  const { data, error } = await supabase
    .from("company_receivables")
    .select("*")
    .eq("company_id", companyId)
    .order("due_date", { ascending: false });

  if (error) throw error;
  return (data as CompanyReceivableRow[]).map(mapRowToRecord);
}

/** Copies an import/mock invoice into the native store so payments can post to the ledger. */
export async function promoteImportedReceivableToNative(
  companyId: string,
  receivable: ReceivableRecord
): Promise<ReceivableRecord> {
  if (isPersistedNumericId(receivable.id)) return receivable;

  return createCompanyReceivable(companyId, {
    customer: receivable.customer,
    invoiceNumber: receivable.invoiceNumber,
    amount: receivable.amount,
    amountPaid: receivable.amountPaid,
    dueDateIso: receivableDueDateIso(receivable),
  });
}

export async function fetchCompanyReceivablePayments(
  companyId: string,
  invoiceId?: number
): Promise<ReceivablePaymentRecord[]> {
  if (!isSupabaseConfigured) {
    const all = loadPaymentsFromStorage(companyId);
    return invoiceId ? all.filter((p) => p.invoiceId === invoiceId) : all;
  }

  let query = supabase
    .from("company_receivable_payments")
    .select("*")
    .eq("company_id", companyId)
    .order("payment_date", { ascending: false });

  if (invoiceId !== undefined) {
    query = query.eq("invoice_id", invoiceId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data as CompanyReceivablePaymentRow[]).map(mapPaymentRow);
}

export async function createCompanyReceivable(
  companyId: string,
  input: ReceivableInput
): Promise<ReceivableRecord> {
  const status = deriveReceivableStatus(input.amount, input.amountPaid, input.dueDateIso);

  if (!isSupabaseConfigured) {
    const records = loadFromStorage(companyId);
    const id = records.length > 0 ? Math.max(...records.map((r) => r.id), 999999) + 1 : 1_000_000;
    const record = toRecord(id, input);
    saveToStorage(companyId, [record, ...records]);
    return record;
  }

  const { data, error } = await supabase
    .from("company_receivables")
    .insert({
      company_id: companyId,
      ...mapInputToRow(input, status),
    })
    .select("*")
    .single();

  if (error) throw error;
  return mapRowToRecord(data as CompanyReceivableRow);
}

export async function updateCompanyReceivable(
  companyId: string,
  id: number,
  input: ReceivableInput
): Promise<ReceivableRecord> {
  const status = deriveReceivableStatus(input.amount, input.amountPaid, input.dueDateIso);

  if (!isSupabaseConfigured) {
    const records = loadFromStorage(companyId);
    const record = toRecord(id, input);
    const next = records.map((r) => (r.id === id ? record : r));
    saveToStorage(companyId, next);
    return record;
  }

  const { data, error } = await supabase
    .from("company_receivables")
    .update(mapInputToRow(input, status))
    .eq("company_id", companyId)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  return mapRowToRecord(data as CompanyReceivableRow);
}

export async function deleteCompanyReceivable(companyId: string, id: number): Promise<void> {
  if (!isPersistedNumericId(id)) {
    throw new Error("Cannot delete imported receivable via native store");
  }

  if (!isSupabaseConfigured) {
    const payments = loadPaymentsFromStorage(companyId).filter((p) => p.invoiceId === id);
    for (const payment of payments) {
      await removePaymentBankLedger(companyId, payment.id);
    }
    saveToStorage(companyId, loadFromStorage(companyId).filter((r) => r.id !== id));
    savePaymentsToStorage(
      companyId,
      loadPaymentsFromStorage(companyId).filter((p) => p.invoiceId !== id)
    );
    return;
  }

  const { error } = await supabase
    .from("company_receivables")
    .delete()
    .eq("company_id", companyId)
    .eq("id", id);

  if (error) throw error;
}

export async function recordCompanyReceivablePayment(
  companyId: string,
  invoiceId: number,
  input: ReceivablePaymentInput
): Promise<{ invoice: ReceivableRecord; payment: ReceivablePaymentRecord }> {
  const records = isSupabaseConfigured
    ? await fetchCompanyReceivables(companyId)
    : loadFromStorage(companyId);
  const current = records.find((r) => r.id === invoiceId);
  if (!current) throw new Error("Invoice not found");

  const balance = current.amount - current.amountPaid;
  if (input.amount <= 0 || input.amount > balance) {
    throw new Error("Invalid payment amount");
  }
  if (input.paymentMethod === "Bank Transfer" && !input.bankAccountId) {
    throw new Error("Bank account required for bank transfer payments");
  }

  if (!isSupabaseConfigured) {
    const payments = loadPaymentsFromStorage(companyId);
    const paymentId =
      payments.length > 0 ? Math.max(...payments.map((p) => p.id), 999999) + 1 : 1_000_000;
    const payment: ReceivablePaymentRecord = {
      id: paymentId,
      invoiceId,
      amount: input.amount,
      paymentDate: input.paymentDateIso,
      paymentMethod: input.paymentMethod,
      bankAccountId: input.bankAccountId,
      createdAt: new Date().toISOString(),
    };
    savePaymentsToStorage(companyId, [payment, ...payments]);
    await syncPaymentBankLedger(companyId, payment, current);

    const amountPaid = current.amountPaid + input.amount;
    const dueDateIso = receivableDueDateIso(current);
    const invoice = toRecord(invoiceId, {
      customer: current.customer,
      invoiceNumber: current.invoiceNumber,
      amount: current.amount,
      amountPaid,
      dueDateIso,
    });
    saveToStorage(
      companyId,
      loadFromStorage(companyId).map((r) => (r.id === invoiceId ? invoice : r))
    );
    return { invoice, payment };
  }

  const { data: paymentRow, error: paymentError } = await supabase
    .from("company_receivable_payments")
    .insert({
      company_id: companyId,
      invoice_id: invoiceId,
      amount: input.amount,
      payment_date: input.paymentDateIso,
      payment_method: input.paymentMethod,
      bank_account_id: input.bankAccountId,
    })
    .select("*")
    .single();

  if (paymentError) throw paymentError;
  const payment = mapPaymentRow(paymentRow as CompanyReceivablePaymentRow);

  await syncPaymentBankLedger(companyId, payment, current);

  const payments = await fetchCompanyReceivablePayments(companyId, invoiceId);
  const amountPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const dueDateIso = receivableDueDateIso(current);
  const status = deriveReceivableStatus(current.amount, amountPaid, dueDateIso);

  const { data: invoiceRow, error: invoiceError } = await supabase
    .from("company_receivables")
    .update({
      amount_paid: amountPaid,
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("company_id", companyId)
    .eq("id", invoiceId)
    .select("*")
    .single();

  if (invoiceError) throw invoiceError;
  return { invoice: mapRowToRecord(invoiceRow as CompanyReceivableRow), payment };
}

export async function deleteCompanyReceivablePayment(
  companyId: string,
  paymentId: number
): Promise<ReceivableRecord> {
  if (!isSupabaseConfigured) {
    const payments = loadPaymentsFromStorage(companyId);
    const payment = payments.find((p) => p.id === paymentId);
    if (!payment) throw new Error("Payment not found");

    await removePaymentBankLedger(companyId, paymentId);
    const remaining = payments.filter((p) => p.id !== paymentId);
    savePaymentsToStorage(companyId, remaining);

    const records = loadFromStorage(companyId);
    const current = records.find((r) => r.id === payment.invoiceId);
    if (!current) throw new Error("Invoice not found");

    const amountPaid = remaining
      .filter((p) => p.invoiceId === payment.invoiceId)
      .reduce((sum, p) => sum + p.amount, 0);
    const dueDateIso = receivableDueDateIso(current);
    const invoice = toRecord(payment.invoiceId, {
      customer: current.customer,
      invoiceNumber: current.invoiceNumber,
      amount: current.amount,
      amountPaid,
      dueDateIso,
    });
    saveToStorage(
      companyId,
      records.map((r) => (r.id === payment.invoiceId ? invoice : r))
    );
    return invoice;
  }

  const { data: paymentRow, error: fetchError } = await supabase
    .from("company_receivable_payments")
    .select("*")
    .eq("company_id", companyId)
    .eq("id", paymentId)
    .single();

  if (fetchError) throw fetchError;
  const payment = mapPaymentRow(paymentRow as CompanyReceivablePaymentRow);

  const { error: deleteError } = await supabase
    .from("company_receivable_payments")
    .delete()
    .eq("company_id", companyId)
    .eq("id", paymentId);

  if (deleteError) throw deleteError;

  const payments = await fetchCompanyReceivablePayments(companyId, payment.invoiceId);
  const amountPaid = payments.reduce((sum, p) => sum + p.amount, 0);

  const { data: invoiceRow, error: invoiceError } = await supabase
    .from("company_receivables")
    .select("*")
    .eq("company_id", companyId)
    .eq("id", payment.invoiceId)
    .single();

  if (invoiceError) throw invoiceError;
  const current = mapRowToRecord(invoiceRow as CompanyReceivableRow);
  const dueDateIso = receivableDueDateIso(current);
  const status = deriveReceivableStatus(current.amount, amountPaid, dueDateIso);

  const { data: updatedRow, error: updateError } = await supabase
    .from("company_receivables")
    .update({
      amount_paid: amountPaid,
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("company_id", companyId)
    .eq("id", payment.invoiceId)
    .select("*")
    .single();

  if (updateError) throw updateError;
  return mapRowToRecord(updatedRow as CompanyReceivableRow);
}

import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { isPersistedNumericId } from "@/domains/financial/persistence/isPersistedNumericId";
import type { ReceivablePaymentStatus, ReceivableRecord } from "@/domains/financial/types";
import {
  calcOverdueDaysFromIso,
  deriveReceivableStatus,
  isoToDisplayDueDate,
} from "./receivableDates";

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

export interface ReceivableInput {
  customer: string;
  invoiceNumber: string;
  amount: number;
  amountPaid: number;
  dueDateIso: string;
}

const STORAGE_PREFIX = "agro-company-receivables-v1";

function storageKey(companyId: string): string {
  return `${STORAGE_PREFIX}-${companyId}`;
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
    saveToStorage(companyId, loadFromStorage(companyId).filter((r) => r.id !== id));
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
  id: number,
  payment: number
): Promise<ReceivableRecord> {
  const records = isSupabaseConfigured
    ? await fetchCompanyReceivables(companyId)
    : loadFromStorage(companyId);
  const current = records.find((r) => r.id === id);
  if (!current) throw new Error("Invoice not found");

  const amountPaid = current.amountPaid + payment;
  const dueDateIso =
    current.dueDate.includes("-")
      ? current.dueDate.slice(0, 10)
      : (() => {
          const parts = current.dueDate.split(" ");
          const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
          const m = months.indexOf(parts[0]) + 1;
          return `${new Date().getFullYear()}-${String(m).padStart(2, "0")}-${String(parseInt(parts[1], 10)).padStart(2, "0")}`;
        })();

  return updateCompanyReceivable(companyId, id, {
    customer: current.customer,
    invoiceNumber: current.invoiceNumber,
    amount: current.amount,
    amountPaid,
    dueDateIso,
  });
}

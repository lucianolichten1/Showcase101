import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type {
  ExpenseCategory,
  ExpensePaymentStatus,
  ExpenseRecord,
  PaymentMethod,
} from "@/domains/financial/types";
import {
  loadCompanyExpensesFromStorage,
  saveCompanyExpensesToStorage,
} from "./expenseStorage";
import { isPersistedExpenseId } from "./isPersistedExpenseId";

export interface CompanyExpenseRow {
  id: string;
  company_id: string;
  expense_date: string;
  category: string;
  description: string;
  vendor: string;
  amount: number;
  currency: string;
  status: string;
  payment_method: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export type ExpenseInput = Omit<ExpenseRecord, "id">;

function mapRowToRecord(row: CompanyExpenseRow): ExpenseRecord {
  return {
    id: row.id,
    date: row.expense_date,
    category: row.category as ExpenseCategory,
    description: row.description,
    vendor: row.vendor,
    amount: Number(row.amount),
    currency: row.currency,
    status: row.status as ExpensePaymentStatus,
    paymentMethod: row.payment_method as PaymentMethod,
    notes: row.notes ?? "",
  };
}

function mapRecordToInsert(companyId: string, input: ExpenseInput) {
  return {
    company_id: companyId,
    expense_date: input.date,
    category: input.category,
    description: input.description,
    vendor: input.vendor,
    amount: input.amount,
    currency: input.currency,
    status: input.status,
    payment_method: input.paymentMethod,
    notes: input.notes,
  };
}

function mapRecordToUpdate(input: ExpenseInput) {
  return {
    expense_date: input.date,
    category: input.category,
    description: input.description,
    vendor: input.vendor,
    amount: input.amount,
    currency: input.currency,
    status: input.status,
    payment_method: input.paymentMethod,
    notes: input.notes,
    updated_at: new Date().toISOString(),
  };
}

export async function fetchCompanyExpenses(companyId: string): Promise<ExpenseRecord[]> {
  if (!isSupabaseConfigured) {
    return loadCompanyExpensesFromStorage(companyId);
  }

  const { data, error } = await supabase
    .from("company_expenses")
    .select("*")
    .eq("company_id", companyId)
    .order("expense_date", { ascending: false });

  if (error) throw error;
  return (data as CompanyExpenseRow[]).map(mapRowToRecord);
}

export async function createCompanyExpense(
  companyId: string,
  input: ExpenseInput
): Promise<ExpenseRecord> {
  if (!isSupabaseConfigured) {
    const record: ExpenseRecord = {
      id: crypto.randomUUID(),
      ...input,
    };
    const next = [record, ...loadCompanyExpensesFromStorage(companyId)];
    saveCompanyExpensesToStorage(companyId, next);
    return record;
  }

  const { data, error } = await supabase
    .from("company_expenses")
    .insert(mapRecordToInsert(companyId, input))
    .select("*")
    .single();

  if (error) throw error;
  return mapRowToRecord(data as CompanyExpenseRow);
}

export async function updateCompanyExpense(
  companyId: string,
  id: string,
  input: ExpenseInput
): Promise<ExpenseRecord> {
  if (!isSupabaseConfigured) {
    const current = loadCompanyExpensesFromStorage(companyId);
    const next = current.map((row) =>
      row.id === id ? { id, ...input } : row
    );
    saveCompanyExpensesToStorage(companyId, next);
    const updated = next.find((row) => row.id === id);
    if (!updated) throw new Error("Expense not found");
    return updated;
  }

  const { data, error } = await supabase
    .from("company_expenses")
    .update(mapRecordToUpdate(input))
    .eq("company_id", companyId)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  return mapRowToRecord(data as CompanyExpenseRow);
}

export async function deleteCompanyExpense(companyId: string, id: string): Promise<void> {
  if (!isPersistedExpenseId(id)) {
    throw new Error("Cannot delete imported expense via native store");
  }

  if (!isSupabaseConfigured) {
    const current = loadCompanyExpensesFromStorage(companyId);
    saveCompanyExpensesToStorage(
      companyId,
      current.filter((row) => row.id !== id)
    );
    return;
  }

  const { error } = await supabase
    .from("company_expenses")
    .delete()
    .eq("company_id", companyId)
    .eq("id", id);

  if (error) throw error;
}

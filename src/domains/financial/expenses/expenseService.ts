import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type {
  ExpenseCategory,
  ExpensePaymentStatus,
  ExpenseRecord,
  PaymentMethod,
} from "@/domains/financial/types";
import {
  loadCompanyBankAccountsFromStorage,
  saveCompanyBankAccountsToStorage,
} from "@/domains/financial/bank-accounts/bankAccountStorage";
import {
  removeLocalLinkedTransactions,
  syncLocalExpenseBankTransaction,
} from "@/domains/financial/bank-accounts/bankAccountLocalSync";
import {
  removeServerLinkedBankTransactions,
  syncServerExpenseBankTransaction,
} from "@/domains/financial/bank-accounts/bankAccountLinkedSync";
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
  bank_account_id: string | null;
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
    bankAccountId: row.bank_account_id ?? null,
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
    bank_account_id: input.bankAccountId ?? null,
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
    bank_account_id: input.bankAccountId ?? null,
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
    const accounts = loadCompanyBankAccountsFromStorage(companyId);
    const synced = syncLocalExpenseBankTransaction(companyId, accounts, record);
    saveCompanyBankAccountsToStorage(companyId, synced);
    return record;
  }

  const { data, error } = await supabase
    .from("company_expenses")
    .insert(mapRecordToInsert(companyId, input))
    .select("*")
    .single();

  if (error) throw error;
  const record = mapRowToRecord(data as CompanyExpenseRow);
  await syncServerExpenseBankTransaction(companyId, record);
  return record;
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
    const accounts = loadCompanyBankAccountsFromStorage(companyId);
    const synced = syncLocalExpenseBankTransaction(companyId, accounts, updated);
    saveCompanyBankAccountsToStorage(companyId, synced);
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
  const record = mapRowToRecord(data as CompanyExpenseRow);
  await syncServerExpenseBankTransaction(companyId, record);
  return record;
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
    const accounts = loadCompanyBankAccountsFromStorage(companyId);
    const synced = removeLocalLinkedTransactions(companyId, accounts, "expense", id);
    saveCompanyBankAccountsToStorage(companyId, synced);
    return;
  }

  await removeServerLinkedBankTransactions(companyId, "expense", id);

  const { error } = await supabase
    .from("company_expenses")
    .delete()
    .eq("company_id", companyId)
    .eq("id", id);

  if (error) throw error;
}

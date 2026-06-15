import type { BnbAccountBalance } from "@/domains/banking/bnbTypes";
import {
  mapBnbAccountType,
  mapBnbCurrency,
} from "@/domains/banking/bnbService";
import { BNB_BANK_NAME } from "@/domains/banking/bnbLabels";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import {
  loadCompanyBankAccountsFromStorage,
  loadCompanyBankTransactionsFromStorage,
  saveCompanyBankAccountsToStorage,
  saveCompanyBankTransactionsToStorage,
} from "./bankAccountStorage";
import {
  recalculateLocalAccountBalances,
} from "./bankAccountLocalSync";
import { isPersistedBankAccountId } from "./isPersistedBankAccountId";
import type {
  BankAccountInput,
  BankAccountRecord,
  BankTransactionRecord,
  CreateBankAccountInput,
  ManualTransactionInput,
  TransferInput,
} from "./types";

export interface CompanyBankAccountRow {
  id: string;
  company_id: string;
  account_name: string;
  bank_name: string;
  account_number: string;
  account_type: string;
  currency: string;
  current_balance: number;
  active: boolean;
  created_at: string;
  updated_at: string;
  bnb_account_number: string | null;
  bnb_connected: boolean;
  bnb_last_synced_at: string | null;
}

export interface CompanyBankTransactionRow {
  id: string;
  company_id: string;
  bank_account_id: string;
  transaction_date: string;
  description: string;
  amount: number;
  type: string;
  reference_type: string;
  reference_id: string | null;
  transfer_group_id: string | null;
  running_balance: number;
  created_at: string;
}

function mapAccountRow(row: CompanyBankAccountRow): BankAccountRecord {
  return {
    id: row.id,
    accountName: row.account_name,
    bankName: row.bank_name,
    accountNumber: row.account_number,
    accountType: row.account_type as BankAccountRecord["accountType"],
    currency: row.currency,
    currentBalance: Number(row.current_balance),
    active: row.active,
    createdAt: row.created_at,
    bnbAccountNumber: row.bnb_account_number ?? null,
    bnbConnected: Boolean(row.bnb_connected),
    bnbLastSyncedAt: row.bnb_last_synced_at ?? null,
  };
}

function defaultBnbFields(): Pick<
  BankAccountRecord,
  "bnbAccountNumber" | "bnbConnected" | "bnbLastSyncedAt"
> {
  return {
    bnbAccountNumber: null,
    bnbConnected: false,
    bnbLastSyncedAt: null,
  };
}

function mapTransactionRow(row: CompanyBankTransactionRow): BankTransactionRecord {
  return {
    id: row.id,
    bankAccountId: row.bank_account_id,
    date: row.transaction_date,
    description: row.description,
    amount: Number(row.amount),
    type: row.type as BankTransactionRecord["type"],
    referenceType: row.reference_type as BankTransactionRecord["referenceType"],
    referenceId: row.reference_id,
    transferGroupId: row.transfer_group_id,
    runningBalance: Number(row.running_balance),
    createdAt: row.created_at,
  };
}

function sanitizeLastFour(value: string): string {
  return value.replace(/\D/g, "").slice(-4);
}

function mapAccountToInsert(companyId: string, input: BankAccountInput) {
  return {
    company_id: companyId,
    account_name: input.accountName,
    bank_name: input.bankName,
    account_number: sanitizeLastFour(input.accountNumber),
    account_type: input.accountType,
    currency: input.currency,
    active: input.active,
  };
}

export async function fetchCompanyBankAccounts(
  companyId: string
): Promise<BankAccountRecord[]> {
  if (!isSupabaseConfigured) {
    return loadCompanyBankAccountsFromStorage(companyId);
  }

  const { data, error } = await supabase
    .from("company_bank_accounts")
    .select("*")
    .eq("company_id", companyId)
    .order("account_name", { ascending: true });

  if (error) throw error;
  return (data as CompanyBankAccountRow[]).map(mapAccountRow);
}

export async function fetchCompanyBankTransactions(
  companyId: string,
  bankAccountId?: string
): Promise<BankTransactionRecord[]> {
  if (!isSupabaseConfigured) {
    const all = loadCompanyBankTransactionsFromStorage(companyId);
    const filtered = bankAccountId
      ? all.filter((t) => t.bankAccountId === bankAccountId)
      : all;
    return filtered.sort((a, b) => {
      const dateCmp = b.date.localeCompare(a.date);
      if (dateCmp !== 0) return dateCmp;
      return b.createdAt.localeCompare(a.createdAt);
    });
  }

  let query = supabase
    .from("company_bank_transactions")
    .select("*")
    .eq("company_id", companyId);

  if (bankAccountId) {
    query = query.eq("bank_account_id", bankAccountId);
  }

  const { data, error } = await query
    .order("transaction_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data as CompanyBankTransactionRow[]).map(mapTransactionRow);
}

export async function createCompanyBankAccount(
  companyId: string,
  input: CreateBankAccountInput
): Promise<BankAccountRecord> {
  if (!isSupabaseConfigured) {
    const record: BankAccountRecord = {
      id: crypto.randomUUID(),
      accountName: input.accountName,
      bankName: input.bankName,
      accountNumber: sanitizeLastFour(input.accountNumber),
      accountType: input.accountType,
      currency: input.currency,
      currentBalance: 0,
      active: input.active,
      createdAt: new Date().toISOString(),
      ...defaultBnbFields(),
    };
    const accounts = [record, ...loadCompanyBankAccountsFromStorage(companyId)];
    saveCompanyBankAccountsToStorage(companyId, accounts);

    if (input.openingBalance !== 0) {
      const transactions = loadCompanyBankTransactionsFromStorage(companyId);
      const isIncome = input.openingBalance > 0;
      transactions.push({
        id: crypto.randomUUID(),
        bankAccountId: record.id,
        date: new Date().toISOString().slice(0, 10),
        description: "Saldo inicial",
        amount: Math.abs(input.openingBalance),
        type: isIncome ? "income" : "expense",
        referenceType: "opening",
        referenceId: null,
        transferGroupId: null,
        runningBalance: 0,
        createdAt: new Date().toISOString(),
      });
      const recalculated = recalculateLocalAccountBalances(accounts, transactions);
      saveCompanyBankAccountsToStorage(companyId, recalculated.accounts);
      saveCompanyBankTransactionsToStorage(companyId, recalculated.transactions);
      return recalculated.accounts.find((a) => a.id === record.id) ?? record;
    }

    return record;
  }

  const { data, error } = await supabase
    .from("company_bank_accounts")
    .insert(mapAccountToInsert(companyId, input))
    .select("*")
    .single();

  if (error) throw error;
  const created = mapAccountRow(data as CompanyBankAccountRow);

  if (input.openingBalance !== 0) {
    const isIncome = input.openingBalance > 0;
    const { error: txError } = await supabase.from("company_bank_transactions").insert({
      company_id: companyId,
      bank_account_id: created.id,
      transaction_date: new Date().toISOString().slice(0, 10),
      description: "Saldo inicial",
      amount: Math.abs(input.openingBalance),
      type: isIncome ? "income" : "expense",
      reference_type: "opening",
    });
    if (txError) throw txError;

    const refreshed = await fetchCompanyBankAccounts(companyId);
    return refreshed.find((a) => a.id === created.id) ?? created;
  }

  return created;
}

export async function updateCompanyBankAccount(
  companyId: string,
  id: string,
  input: BankAccountInput
): Promise<BankAccountRecord> {
  if (!isSupabaseConfigured) {
    const current = loadCompanyBankAccountsFromStorage(companyId);
    const next = current.map((row) =>
      row.id === id
        ? {
            ...row,
            accountName: input.accountName,
            bankName: input.bankName,
            accountNumber: sanitizeLastFour(input.accountNumber),
            accountType: input.accountType,
            currency: input.currency,
            active: input.active,
          }
        : row
    );
    saveCompanyBankAccountsToStorage(companyId, next);
    const updated = next.find((row) => row.id === id);
    if (!updated) throw new Error("Cuenta bancaria no encontrada");
    return updated;
  }

  const { data, error } = await supabase
    .from("company_bank_accounts")
    .update({
      account_name: input.accountName,
      bank_name: input.bankName,
      account_number: sanitizeLastFour(input.accountNumber),
      account_type: input.accountType,
      currency: input.currency,
      active: input.active,
      updated_at: new Date().toISOString(),
    })
    .eq("company_id", companyId)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  return mapAccountRow(data as CompanyBankAccountRow);
}

export async function deleteCompanyBankAccount(
  companyId: string,
  id: string
): Promise<void> {
  if (!isPersistedBankAccountId(id)) {
    throw new Error("No se puede eliminar una cuenta importada");
  }

  if (!isSupabaseConfigured) {
    const transactions = loadCompanyBankTransactionsFromStorage(companyId);
    if (transactions.some((t) => t.bankAccountId === id)) {
      throw new Error("No se puede eliminar una cuenta con movimientos. Márquela como inactiva.");
    }
    const current = loadCompanyBankAccountsFromStorage(companyId);
    saveCompanyBankAccountsToStorage(
      companyId,
      current.filter((row) => row.id !== id)
    );
    return;
  }

  const { error } = await supabase
    .from("company_bank_accounts")
    .delete()
    .eq("company_id", companyId)
    .eq("id", id);

  if (error) throw error;
}

export async function createManualBankTransaction(
  companyId: string,
  input: ManualTransactionInput
): Promise<BankTransactionRecord> {
  if (!isSupabaseConfigured) {
    const accounts = loadCompanyBankAccountsFromStorage(companyId);
    const transactions = loadCompanyBankTransactionsFromStorage(companyId);
    const record: BankTransactionRecord = {
      id: crypto.randomUUID(),
      bankAccountId: input.bankAccountId,
      date: input.date,
      description: input.description,
      amount: input.amount,
      type: input.type,
      referenceType: "manual",
      referenceId: null,
      transferGroupId: null,
      runningBalance: 0,
      createdAt: new Date().toISOString(),
    };
    transactions.push(record);
    const recalculated = recalculateLocalAccountBalances(accounts, transactions);
    saveCompanyBankAccountsToStorage(companyId, recalculated.accounts);
    saveCompanyBankTransactionsToStorage(companyId, recalculated.transactions);
    return recalculated.transactions.find((t) => t.id === record.id) ?? record;
  }

  const { data, error } = await supabase
    .from("company_bank_transactions")
    .insert({
      company_id: companyId,
      bank_account_id: input.bankAccountId,
      transaction_date: input.date,
      description: input.description,
      amount: input.amount,
      type: input.type,
      reference_type: "manual",
    })
    .select("*")
    .single();

  if (error) throw error;
  return mapTransactionRow(data as CompanyBankTransactionRow);
}

export async function createBankTransfer(
  companyId: string,
  input: TransferInput
): Promise<string> {
  if (!isSupabaseConfigured) {
    const groupId = crypto.randomUUID();
    const accounts = loadCompanyBankAccountsFromStorage(companyId);
    const transactions = loadCompanyBankTransactionsFromStorage(companyId);
    const desc = input.description.trim() || "Transferencia entre cuentas";
    const now = new Date().toISOString();

    transactions.push(
      {
        id: crypto.randomUUID(),
        bankAccountId: input.fromAccountId,
        date: input.date,
        description: desc,
        amount: input.amount,
        type: "expense",
        referenceType: "transfer",
        referenceId: null,
        transferGroupId: groupId,
        runningBalance: 0,
        createdAt: now,
      },
      {
        id: crypto.randomUUID(),
        bankAccountId: input.toAccountId,
        date: input.date,
        description: desc,
        amount: input.amount,
        type: "income",
        referenceType: "transfer",
        referenceId: null,
        transferGroupId: groupId,
        runningBalance: 0,
        createdAt: now,
      }
    );

    const recalculated = recalculateLocalAccountBalances(accounts, transactions);
    saveCompanyBankAccountsToStorage(companyId, recalculated.accounts);
    saveCompanyBankTransactionsToStorage(companyId, recalculated.transactions);
    return groupId;
  }

  const { data, error } = await supabase.rpc("create_bank_transfer", {
    p_company_id: companyId,
    p_from_account_id: input.fromAccountId,
    p_to_account_id: input.toAccountId,
    p_amount: input.amount,
    p_transaction_date: input.date,
    p_description: input.description,
  });

  if (error) throw error;
  return data as string;
}

export async function accountHasTransactions(
  companyId: string,
  accountId: string
): Promise<boolean> {
  if (!isSupabaseConfigured) {
    return loadCompanyBankTransactionsFromStorage(companyId).some(
      (t) => t.bankAccountId === accountId
    );
  }

  const { count, error } = await supabase
    .from("company_bank_transactions")
    .select("id", { count: "exact", head: true })
    .eq("company_id", companyId)
    .eq("bank_account_id", accountId);

  if (error) throw error;
  return (count ?? 0) > 0;
}

function bnbAccountDisplayName(account: BnbAccountBalance): string {
  const typeLabel = mapBnbAccountType(account.accountType);
  const last4 = sanitizeLastFour(account.accountNumber);
  return `${account.partyName} · ${typeLabel} ${last4}`;
}

async function updateBnbAccountLink(
  companyId: string,
  accountId: string,
  bnb: BnbAccountBalance,
  options: { updateBalance: boolean }
): Promise<BankAccountRecord> {
  const now = new Date().toISOString();

  if (!isSupabaseConfigured) {
    const accounts = loadCompanyBankAccountsFromStorage(companyId);
    const next = accounts.map((row) => {
      if (row.id !== accountId) return row;
      return {
        ...row,
        bnbAccountNumber: bnb.accountNumber,
        bnbConnected: true,
        bnbLastSyncedAt: now,
        currentBalance: options.updateBalance ? bnb.balanceAmount : row.currentBalance,
      };
    });
    saveCompanyBankAccountsToStorage(companyId, next);
    const updated = next.find((row) => row.id === accountId);
    if (!updated) throw new Error("Cuenta bancaria no encontrada");
    return updated;
  }

  const patch: Record<string, unknown> = {
    bnb_account_number: bnb.accountNumber,
    bnb_connected: true,
    bnb_last_synced_at: now,
    updated_at: now,
  };
  if (options.updateBalance) {
    patch.current_balance = bnb.balanceAmount;
  }

  const { data, error } = await supabase
    .from("company_bank_accounts")
    .update(patch)
    .eq("company_id", companyId)
    .eq("id", accountId)
    .select("*")
    .single();

  if (error) throw error;
  return mapAccountRow(data as CompanyBankAccountRow);
}

export async function importBnbBankAccounts(
  companyId: string,
  accounts: BnbAccountBalance[]
): Promise<BankAccountRecord[]> {
  const existing = await fetchCompanyBankAccounts(companyId);
  const imported: BankAccountRecord[] = [];

  for (const bnb of accounts) {
    const match = existing.find((row) => row.bnbAccountNumber === bnb.accountNumber);
    if (match) {
      imported.push(
        await updateBnbAccountLink(companyId, match.id, bnb, { updateBalance: true })
      );
      continue;
    }

    const created = await createCompanyBankAccount(companyId, {
      accountName: bnbAccountDisplayName(bnb),
      bankName: BNB_BANK_NAME,
      accountNumber: bnb.accountNumber,
      accountType: mapBnbAccountType(bnb.accountType),
      currency: mapBnbCurrency(bnb.currency),
      openingBalance: bnb.balanceAmount,
      active: true,
    });

    imported.push(
      await updateBnbAccountLink(companyId, created.id, bnb, { updateBalance: true })
    );
  }

  return imported;
}

export async function syncBnbBankAccountBalance(
  companyId: string,
  accountId: string,
  bnb: BnbAccountBalance
): Promise<BankAccountRecord> {
  return updateBnbAccountLink(companyId, accountId, bnb, { updateBalance: true });
}

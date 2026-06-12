import { useCallback, useEffect, useState } from "react";
import { getSupabaseErrorMessage } from "@/lib/supabaseError";
import { useSupabaseRealtimeRefresh } from "@/lib/useSupabaseRealtimeRefresh";
import type {
  BankAccountInput,
  BankAccountRecord,
  BankTransactionRecord,
  CreateBankAccountInput,
  ManualTransactionInput,
  TransferInput,
} from "./types";
import {
  accountHasTransactions,
  createBankTransfer,
  createCompanyBankAccount,
  createManualBankTransaction,
  deleteCompanyBankAccount,
  fetchCompanyBankAccounts,
  fetchCompanyBankTransactions,
  updateCompanyBankAccount,
} from "./bankAccountService";

export interface UseCompanyNativeBankAccountsResult {
  bankAccounts: BankAccountRecord[];
  loading: boolean;
  error: string | null;
  createBankAccount: (input: CreateBankAccountInput) => Promise<BankAccountRecord>;
  updateBankAccount: (id: string, input: BankAccountInput) => Promise<BankAccountRecord>;
  deleteBankAccount: (id: string) => Promise<void>;
  deactivateBankAccount: (id: string) => Promise<BankAccountRecord>;
  refreshBankAccounts: () => Promise<void>;
  fetchTransactions: (bankAccountId: string) => Promise<BankTransactionRecord[]>;
  createManualTransaction: (input: ManualTransactionInput) => Promise<BankTransactionRecord>;
  createTransfer: (input: TransferInput) => Promise<string>;
  hasTransactions: (accountId: string) => Promise<boolean>;
}

export function useCompanyNativeBankAccounts(
  companyId: string | null
): UseCompanyNativeBankAccountsResult {
  const [bankAccounts, setBankAccounts] = useState<BankAccountRecord[]>([]);
  const [loading, setLoading] = useState(Boolean(companyId));
  const [error, setError] = useState<string | null>(null);

  const refreshBankAccounts = useCallback(async () => {
    if (!companyId) {
      setBankAccounts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const rows = await fetchCompanyBankAccounts(companyId);
      setBankAccounts(rows);
      setError(null);
    } catch (err) {
      setError(
        getSupabaseErrorMessage(err, "No se pudieron cargar las cuentas bancarias")
      );
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    void refreshBankAccounts();
  }, [refreshBankAccounts]);

  useSupabaseRealtimeRefresh(
    companyId,
    "company-bank-accounts",
    "company_bank_accounts",
    refreshBankAccounts
  );

  useSupabaseRealtimeRefresh(
    companyId,
    "company-bank-transactions",
    "company_bank_transactions",
    refreshBankAccounts
  );

  const createBankAccount = useCallback(
    async (input: CreateBankAccountInput) => {
      if (!companyId) throw new Error("No hay empresa activa");
      try {
        const created = await createCompanyBankAccount(companyId, input);
        setBankAccounts((prev) => {
          const without = prev.filter((a) => a.id !== created.id);
          return [...without, created].sort((a, b) =>
            a.accountName.localeCompare(b.accountName)
          );
        });
        setError(null);
        return created;
      } catch (err) {
        const message = getSupabaseErrorMessage(err, "No se pudo crear la cuenta bancaria");
        setError(message);
        throw err;
      }
    },
    [companyId]
  );

  const updateBankAccount = useCallback(
    async (id: string, input: BankAccountInput) => {
      if (!companyId) throw new Error("No hay empresa activa");
      try {
        const updated = await updateCompanyBankAccount(companyId, id, input);
        setBankAccounts((prev) => prev.map((row) => (row.id === id ? updated : row)));
        setError(null);
        return updated;
      } catch (err) {
        const message = getSupabaseErrorMessage(err, "No se pudo actualizar la cuenta bancaria");
        setError(message);
        throw err;
      }
    },
    [companyId]
  );

  const deleteBankAccount = useCallback(
    async (id: string) => {
      if (!companyId) throw new Error("No hay empresa activa");
      await deleteCompanyBankAccount(companyId, id);
      setBankAccounts((prev) => prev.filter((row) => row.id !== id));
      setError(null);
    },
    [companyId]
  );

  const deactivateBankAccount = useCallback(
    async (id: string) => {
      const current = bankAccounts.find((a) => a.id === id);
      if (!current) throw new Error("Cuenta bancaria no encontrada");
      return updateBankAccount(id, {
        accountName: current.accountName,
        bankName: current.bankName,
        accountNumber: current.accountNumber,
        accountType: current.accountType,
        currency: current.currency,
        active: false,
      });
    },
    [bankAccounts, updateBankAccount]
  );

  const fetchTransactions = useCallback(
    async (bankAccountId: string) => {
      if (!companyId) return [];
      return fetchCompanyBankTransactions(companyId, bankAccountId);
    },
    [companyId]
  );

  const createManualTransaction = useCallback(
    async (input: ManualTransactionInput) => {
      if (!companyId) throw new Error("No hay empresa activa");
      const created = await createManualBankTransaction(companyId, input);
      await refreshBankAccounts();
      return created;
    },
    [companyId, refreshBankAccounts]
  );

  const createTransfer = useCallback(
    async (input: TransferInput) => {
      if (!companyId) throw new Error("No hay empresa activa");
      const groupId = await createBankTransfer(companyId, input);
      await refreshBankAccounts();
      return groupId;
    },
    [companyId, refreshBankAccounts]
  );

  const hasTransactions = useCallback(
    async (accountId: string) => {
      if (!companyId) return false;
      return accountHasTransactions(companyId, accountId);
    },
    [companyId]
  );

  return {
    bankAccounts,
    loading,
    error,
    createBankAccount,
    updateBankAccount,
    deleteBankAccount,
    deactivateBankAccount,
    refreshBankAccounts,
    fetchTransactions,
    createManualTransaction,
    createTransfer,
    hasTransactions,
  };
}

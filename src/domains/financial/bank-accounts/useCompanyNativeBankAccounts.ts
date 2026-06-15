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
import type { BnbAccountBalance } from "@/domains/banking/bnbTypes";
import { getAccountBalances } from "@/domains/banking/bnbService";
import { bnbErrorMessage } from "@/domains/banking/bnbLabels";
import {
  accountHasTransactions,
  createBankTransfer,
  createCompanyBankAccount,
  createManualBankTransaction,
  deleteCompanyBankAccount,
  fetchCompanyBankAccounts,
  fetchCompanyBankTransactions,
  importBnbBankAccounts,
  syncBnbBankAccountBalance,
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
  importBnbAccounts: (accounts: BnbAccountBalance[]) => Promise<BankAccountRecord[]>;
  syncBnbAccount: (accountId: string) => Promise<BankAccountRecord>;
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

  const importBnbAccounts = useCallback(
    async (accounts: BnbAccountBalance[]) => {
      if (!companyId) throw new Error("No hay empresa activa");
      try {
        const imported = await importBnbBankAccounts(companyId, accounts);
        await refreshBankAccounts();
        setError(null);
        return imported;
      } catch (err) {
        const message = getSupabaseErrorMessage(err, "No se pudieron importar las cuentas BNB");
        setError(message);
        throw err;
      }
    },
    [companyId, refreshBankAccounts]
  );

  const syncBnbAccount = useCallback(
    async (accountId: string) => {
      if (!companyId) throw new Error("No hay empresa activa");
      const current = bankAccounts.find((row) => row.id === accountId);
      if (!current?.bnbAccountNumber) {
        throw new Error("La cuenta no está vinculada a BNB");
      }

      const balanceResult = await getAccountBalances();
      if (balanceResult.ok === false) {
        const message = bnbErrorMessage(balanceResult.error);
        setError(message);
        throw new Error(message);
      }

      const match = balanceResult.data.find(
        (row) => row.accountNumber === current.bnbAccountNumber
      );
      if (!match) {
        const message = "La cuenta ya no aparece en BNB";
        setError(message);
        throw new Error(message);
      }

      try {
        const updated = await syncBnbBankAccountBalance(companyId, accountId, match);
        setBankAccounts((prev) => prev.map((row) => (row.id === accountId ? updated : row)));
        setError(null);
        return updated;
      } catch (err) {
        const message = getSupabaseErrorMessage(err, "No se pudo sincronizar con BNB");
        setError(message);
        throw err;
      }
    },
    [companyId, bankAccounts]
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
    importBnbAccounts,
    syncBnbAccount,
  };
}

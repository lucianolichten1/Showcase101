import type { ExpenseRecord, RevenueRecord } from "@/domains/financial/types";
import type { BankAccountRecord } from "./types";
import {
  applyExpenseBankSync,
  applyRevenueBankSync,
  recalculateAccountBalances,
} from "./bankAccountSyncLogic";
import {
  loadCompanyBankTransactionsFromStorage,
  saveCompanyBankTransactionsToStorage,
} from "./bankAccountStorage";

export { recalculateAccountBalances as recalculateLocalAccountBalances } from "./bankAccountSyncLogic";

export function syncLocalExpenseBankTransaction(
  companyId: string,
  accounts: BankAccountRecord[],
  expense: ExpenseRecord
): BankAccountRecord[] {
  const transactions = applyExpenseBankSync(
    loadCompanyBankTransactionsFromStorage(companyId),
    expense
  );
  const recalculated = recalculateAccountBalances(accounts, transactions);
  saveCompanyBankTransactionsToStorage(companyId, recalculated.transactions);
  return recalculated.accounts;
}

export function syncLocalRevenueBankTransaction(
  companyId: string,
  accounts: BankAccountRecord[],
  revenue: RevenueRecord
): BankAccountRecord[] {
  const transactions = applyRevenueBankSync(
    loadCompanyBankTransactionsFromStorage(companyId),
    revenue
  );
  const recalculated = recalculateAccountBalances(accounts, transactions);
  saveCompanyBankTransactionsToStorage(companyId, recalculated.transactions);
  return recalculated.accounts;
}

export function removeLocalLinkedTransactions(
  companyId: string,
  accounts: BankAccountRecord[],
  referenceType: "expense" | "revenue",
  referenceId: string
): BankAccountRecord[] {
  const transactions = loadCompanyBankTransactionsFromStorage(companyId).filter(
    (t) => !(t.referenceType === referenceType && t.referenceId === referenceId)
  );
  const recalculated = recalculateAccountBalances(accounts, transactions);
  saveCompanyBankTransactionsToStorage(companyId, recalculated.transactions);
  return recalculated.accounts;
}

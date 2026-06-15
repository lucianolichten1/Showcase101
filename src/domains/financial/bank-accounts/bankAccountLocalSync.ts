import type { ExpenseRecord, RevenueRecord } from "@/domains/financial/types";
import type { BankAccountRecord, BankTransactionReferenceType } from "./types";
import {
  applyExpenseBankSync,
  applyPurchaseOrderBankSync,
  applyReceivablePaymentBankSync,
  applyRevenueBankSync,
  applySalesOrderBankSync,
  recalculateAccountBalances,
  removeLinkedTransaction,
  removeReceivablePaymentBankSync,
  type PurchaseOrderBankSyncInput,
  type ReceivablePaymentBankSyncInput,
  type SalesOrderBankSyncInput,
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

export function syncLocalReceivablePaymentBankTransaction(
  companyId: string,
  accounts: BankAccountRecord[],
  payment: ReceivablePaymentBankSyncInput
): BankAccountRecord[] {
  const transactions = applyReceivablePaymentBankSync(
    loadCompanyBankTransactionsFromStorage(companyId),
    payment
  );
  const recalculated = recalculateAccountBalances(accounts, transactions);
  saveCompanyBankTransactionsToStorage(companyId, recalculated.transactions);
  return recalculated.accounts;
}

export function syncLocalPurchaseOrderBankTransaction(
  companyId: string,
  accounts: BankAccountRecord[],
  po: PurchaseOrderBankSyncInput
): BankAccountRecord[] {
  const transactions = applyPurchaseOrderBankSync(
    loadCompanyBankTransactionsFromStorage(companyId),
    po
  );
  const recalculated = recalculateAccountBalances(accounts, transactions);
  saveCompanyBankTransactionsToStorage(companyId, recalculated.transactions);
  return recalculated.accounts;
}

export function syncLocalSalesOrderBankTransaction(
  companyId: string,
  accounts: BankAccountRecord[],
  so: SalesOrderBankSyncInput
): BankAccountRecord[] {
  const transactions = applySalesOrderBankSync(
    loadCompanyBankTransactionsFromStorage(companyId),
    so
  );
  const recalculated = recalculateAccountBalances(accounts, transactions);
  saveCompanyBankTransactionsToStorage(companyId, recalculated.transactions);
  return recalculated.accounts;
}

export function removeLocalLinkedTransactions(
  companyId: string,
  accounts: BankAccountRecord[],
  referenceType: BankTransactionReferenceType,
  referenceId: string
): BankAccountRecord[] {
  const transactions = removeLinkedTransaction(
    loadCompanyBankTransactionsFromStorage(companyId),
    referenceType,
    referenceId
  );
  const recalculated = recalculateAccountBalances(accounts, transactions);
  saveCompanyBankTransactionsToStorage(companyId, recalculated.transactions);
  return recalculated.accounts;
}

export function removeLocalReceivablePaymentBankTransaction(
  companyId: string,
  accounts: BankAccountRecord[],
  paymentId: number | string
): BankAccountRecord[] {
  const transactions = removeReceivablePaymentBankSync(
    loadCompanyBankTransactionsFromStorage(companyId),
    paymentId
  );
  const recalculated = recalculateAccountBalances(accounts, transactions);
  saveCompanyBankTransactionsToStorage(companyId, recalculated.transactions);
  return recalculated.accounts;
}

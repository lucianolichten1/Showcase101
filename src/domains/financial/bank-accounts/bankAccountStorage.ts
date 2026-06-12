import type { BankAccountRecord, BankTransactionRecord } from "./types";

const ACCOUNTS_KEY_PREFIX = "agro-company-bank-accounts-v1-";
const TRANSACTIONS_KEY_PREFIX = "agro-company-bank-transactions-v1-";

export function loadCompanyBankAccountsFromStorage(companyId: string): BankAccountRecord[] {
  try {
    const raw = localStorage.getItem(`${ACCOUNTS_KEY_PREFIX}${companyId}`);
    if (!raw) return [];
    return JSON.parse(raw) as BankAccountRecord[];
  } catch {
    return [];
  }
}

export function saveCompanyBankAccountsToStorage(
  companyId: string,
  accounts: BankAccountRecord[]
): void {
  localStorage.setItem(`${ACCOUNTS_KEY_PREFIX}${companyId}`, JSON.stringify(accounts));
}

export function loadCompanyBankTransactionsFromStorage(
  companyId: string
): BankTransactionRecord[] {
  try {
    const raw = localStorage.getItem(`${TRANSACTIONS_KEY_PREFIX}${companyId}`);
    if (!raw) return [];
    return JSON.parse(raw) as BankTransactionRecord[];
  } catch {
    return [];
  }
}

export function saveCompanyBankTransactionsToStorage(
  companyId: string,
  transactions: BankTransactionRecord[]
): void {
  localStorage.setItem(`${TRANSACTIONS_KEY_PREFIX}${companyId}`, JSON.stringify(transactions));
}

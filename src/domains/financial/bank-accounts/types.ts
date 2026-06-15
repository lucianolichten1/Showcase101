import type { CurrencyCode, ISODate } from "@/domains/financial/types";

export const BANK_ACCOUNT_TYPES = [
  "Ahorros",
  "Corriente",
  "Caja Chica",
  "Inversión",
  "Otro",
] as const;

export type BankAccountType = (typeof BANK_ACCOUNT_TYPES)[number];

export type BankTransactionType = "income" | "expense" | "transfer";

export type BankTransactionReferenceType =
  | "expense"
  | "revenue"
  | "manual"
  | "transfer"
  | "opening"
  | "receivable"
  | "purchase_order"
  | "sales_order";

export interface BankAccountRecord {
  id: string;
  accountName: string;
  bankName: string;
  /** Last 4 digits only */
  accountNumber: string;
  accountType: BankAccountType;
  currency: CurrencyCode;
  currentBalance: number;
  active: boolean;
  createdAt: string;
  /** Full BNB account number when linked to Banco Nacional de Bolivia */
  bnbAccountNumber: string | null;
  bnbConnected: boolean;
  bnbLastSyncedAt: string | null;
}

export interface BankTransactionRecord {
  id: string;
  bankAccountId: string;
  date: ISODate;
  description: string;
  amount: number;
  type: BankTransactionType;
  referenceType: BankTransactionReferenceType;
  referenceId: string | null;
  transferGroupId: string | null;
  runningBalance: number;
  createdAt: string;
}

export interface BankAccountInput {
  accountName: string;
  bankName: string;
  accountNumber: string;
  accountType: BankAccountType;
  currency: CurrencyCode;
  active: boolean;
}

export interface CreateBankAccountInput extends BankAccountInput {
  openingBalance: number;
}

export interface ManualTransactionInput {
  bankAccountId: string;
  date: ISODate;
  description: string;
  amount: number;
  type: "income" | "expense";
}

export interface TransferInput {
  fromAccountId: string;
  toAccountId: string;
  date: ISODate;
  amount: number;
  description: string;
}

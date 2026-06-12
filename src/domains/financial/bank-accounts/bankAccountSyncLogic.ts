import type { ExpenseRecord, RevenueRecord } from "@/domains/financial/types";
import type { BankAccountRecord, BankTransactionRecord } from "./types";

function sortTransactions(rows: BankTransactionRecord[]): BankTransactionRecord[] {
  return [...rows].sort((a, b) => {
    const dateCmp = a.date.localeCompare(b.date);
    if (dateCmp !== 0) return dateCmp;
    return a.createdAt.localeCompare(b.createdAt);
  });
}

export function recalculateAccountBalances(
  accounts: BankAccountRecord[],
  transactions: BankTransactionRecord[]
): { accounts: BankAccountRecord[]; transactions: BankTransactionRecord[] } {
  const nextAccounts = accounts.map((a) => ({ ...a }));
  const nextTransactions = transactions.map((t) => ({ ...t }));

  for (const account of nextAccounts) {
    const accountTx = sortTransactions(
      nextTransactions.filter((t) => t.bankAccountId === account.id)
    );
    let balance = 0;
    for (const tx of accountTx) {
      balance = tx.type === "expense" ? balance - tx.amount : balance + tx.amount;
      const idx = nextTransactions.findIndex((r) => r.id === tx.id);
      if (idx >= 0) nextTransactions[idx].runningBalance = balance;
    }
    account.currentBalance = balance;
  }

  return { accounts: nextAccounts, transactions: nextTransactions };
}

function removeLinkedTransaction(
  transactions: BankTransactionRecord[],
  referenceType: "expense" | "revenue",
  referenceId: string
): BankTransactionRecord[] {
  return transactions.filter(
    (t) => !(t.referenceType === referenceType && t.referenceId === referenceId)
  );
}

/** Pure sync — mirrors DB trigger sync_expense_bank_transaction. */
export function applyExpenseBankSync(
  transactions: BankTransactionRecord[],
  expense: ExpenseRecord,
  now = new Date().toISOString()
): BankTransactionRecord[] {
  const next = removeLinkedTransaction(transactions, "expense", expense.id);

  if (
    expense.status === "Paid" &&
    expense.paymentMethod === "Bank Transfer" &&
    expense.bankAccountId
  ) {
    next.push({
      id: `tx-expense-${expense.id}`,
      bankAccountId: expense.bankAccountId,
      date: expense.date,
      description: expense.description.trim() || expense.vendor,
      amount: expense.amount,
      type: "expense",
      referenceType: "expense",
      referenceId: expense.id,
      transferGroupId: null,
      runningBalance: 0,
      createdAt: now,
    });
  }

  return next;
}

/** Pure sync — mirrors DB trigger sync_revenue_bank_transaction. */
export function applyRevenueBankSync(
  transactions: BankTransactionRecord[],
  revenue: RevenueRecord,
  now = new Date().toISOString()
): BankTransactionRecord[] {
  const next = removeLinkedTransaction(transactions, "revenue", revenue.id);

  if (
    revenue.status === "Collected" &&
    revenue.paymentMethod === "Bank Transfer" &&
    revenue.bankAccountId
  ) {
    next.push({
      id: `tx-revenue-${revenue.id}`,
      bankAccountId: revenue.bankAccountId,
      date: revenue.date,
      description: revenue.productService.trim() || revenue.sourceClient || "Ingreso",
      amount: revenue.amount,
      type: "income",
      referenceType: "revenue",
      referenceId: revenue.id,
      transferGroupId: null,
      runningBalance: 0,
      createdAt: now,
    });
  }

  return next;
}

export function sumBalancesByCurrency(
  accounts: BankAccountRecord[]
): { currency: string; total: number }[] {
  const totals = new Map<string, number>();
  for (const account of accounts) {
    if (!account.active) continue;
    const currency = account.currency || "Bs";
    totals.set(currency, (totals.get(currency) ?? 0) + account.currentBalance);
  }
  return [...totals.entries()]
    .map(([currency, total]) => ({ currency, total }))
    .sort((a, b) => a.currency.localeCompare(b.currency));
}

export function formatBalanceWithCurrency(value: number, currency: string): string {
  return `${currency} ${value.toLocaleString()}`;
}

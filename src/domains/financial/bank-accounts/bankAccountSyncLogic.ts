import type { ExpenseRecord, PaymentMethod, RevenueRecord } from "@/domains/financial/types";
import type { POStatus, SOStatus } from "@/domains/inventory/types";
import type {
  BankAccountRecord,
  BankTransactionRecord,
  BankTransactionReferenceType,
} from "./types";

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

export function removeLinkedTransaction(
  transactions: BankTransactionRecord[],
  referenceType: BankTransactionReferenceType,
  referenceId: string
): BankTransactionRecord[] {
  return transactions.filter(
    (t) => !(t.referenceType === referenceType && t.referenceId === referenceId)
  );
}

function shouldPostBankTransfer(
  paymentMethod: PaymentMethod | null | undefined,
  bankAccountId: string | null | undefined
): bankAccountId is string {
  return paymentMethod === "Bank Transfer" && Boolean(bankAccountId);
}

/** Pure sync — mirrors DB trigger sync_expense_bank_transaction. */
export function applyExpenseBankSync(
  transactions: BankTransactionRecord[],
  expense: ExpenseRecord,
  now = new Date().toISOString()
): BankTransactionRecord[] {
  const next = removeLinkedTransaction(transactions, "expense", expense.id);

  if (expense.status === "Paid" && shouldPostBankTransfer(expense.paymentMethod, expense.bankAccountId)) {
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
    shouldPostBankTransfer(revenue.paymentMethod, revenue.bankAccountId)
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

export interface ReceivablePaymentBankSyncInput {
  id: number | string;
  amount: number;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  bankAccountId: string | null;
  invoiceNumber: string;
  customerName: string;
}

/** Append a bank credit for one AR payment (partial payments stack as separate rows). */
export function applyReceivablePaymentBankSync(
  transactions: BankTransactionRecord[],
  payment: ReceivablePaymentBankSyncInput,
  now = new Date().toISOString()
): BankTransactionRecord[] {
  if (!shouldPostBankTransfer(payment.paymentMethod, payment.bankAccountId)) {
    return transactions;
  }

  const refId = String(payment.id);
  const withoutDup = removeLinkedTransaction(transactions, "receivable", refId);
  withoutDup.push({
    id: `tx-receivable-${refId}`,
    bankAccountId: payment.bankAccountId,
    date: payment.paymentDate,
    description: `Cobro ${payment.invoiceNumber} — ${payment.customerName}`,
    amount: payment.amount,
    type: "income",
    referenceType: "receivable",
    referenceId: refId,
    transferGroupId: null,
    runningBalance: 0,
    createdAt: now,
  });
  return withoutDup;
}

export function removeReceivablePaymentBankSync(
  transactions: BankTransactionRecord[],
  paymentId: number | string
): BankTransactionRecord[] {
  return removeLinkedTransaction(transactions, "receivable", String(paymentId));
}

export interface PurchaseOrderBankSyncInput {
  id: number;
  poNumber: string;
  total: number;
  status: POStatus;
  paymentMethod: PaymentMethod | null;
  bankAccountId: string | null;
  receivedDate: string | null;
}

export function applyPurchaseOrderBankSync(
  transactions: BankTransactionRecord[],
  po: PurchaseOrderBankSyncInput,
  now = new Date().toISOString()
): BankTransactionRecord[] {
  const refId = String(po.id);
  const next = removeLinkedTransaction(transactions, "purchase_order", refId);

  if (
    po.status === "Received" &&
    shouldPostBankTransfer(po.paymentMethod, po.bankAccountId)
  ) {
    next.push({
      id: `tx-po-${refId}`,
      bankAccountId: po.bankAccountId,
      date: po.receivedDate ?? new Date().toISOString().slice(0, 10),
      description: `Orden de compra ${po.poNumber}`,
      amount: po.total,
      type: "expense",
      referenceType: "purchase_order",
      referenceId: refId,
      transferGroupId: null,
      runningBalance: 0,
      createdAt: now,
    });
  }

  return next;
}

export interface SalesOrderBankSyncInput {
  id: number;
  soNumber: string;
  total: number;
  status: SOStatus;
  paymentMethod: PaymentMethod | null;
  bankAccountId: string | null;
  fulfilledDate: string | null;
}

export function applySalesOrderBankSync(
  transactions: BankTransactionRecord[],
  so: SalesOrderBankSyncInput,
  now = new Date().toISOString()
): BankTransactionRecord[] {
  const refId = String(so.id);
  const next = removeLinkedTransaction(transactions, "sales_order", refId);

  if (
    so.status === "Fulfilled" &&
    shouldPostBankTransfer(so.paymentMethod, so.bankAccountId)
  ) {
    next.push({
      id: `tx-so-${refId}`,
      bankAccountId: so.bankAccountId,
      date: so.fulfilledDate ?? new Date().toISOString().slice(0, 10),
      description: `Orden de venta ${so.soNumber}`,
      amount: so.total,
      type: "income",
      referenceType: "sales_order",
      referenceId: refId,
      transferGroupId: null,
      runningBalance: 0,
      createdAt: now,
    });
  }

  return next;
}

/** Apply a two-legged transfer; net cash across accounts is unchanged. */
export function applyTransferBankSync(
  transactions: BankTransactionRecord[],
  input: {
    fromAccountId: string;
    toAccountId: string;
    date: string;
    amount: number;
    description: string;
    transferGroupId: string;
  },
  now = new Date().toISOString()
): BankTransactionRecord[] {
  const desc = input.description.trim() || "Transferencia entre cuentas";
  const next = [...transactions];
  next.push(
    {
      id: `tx-transfer-out-${input.transferGroupId}`,
      bankAccountId: input.fromAccountId,
      date: input.date,
      description: desc,
      amount: input.amount,
      type: "expense",
      referenceType: "transfer",
      referenceId: null,
      transferGroupId: input.transferGroupId,
      runningBalance: 0,
      createdAt: now,
    },
    {
      id: `tx-transfer-in-${input.transferGroupId}`,
      bankAccountId: input.toAccountId,
      date: input.date,
      description: desc,
      amount: input.amount,
      type: "income",
      referenceType: "transfer",
      referenceId: null,
      transferGroupId: input.transferGroupId,
      runningBalance: 0,
      createdAt: now,
    }
  );
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

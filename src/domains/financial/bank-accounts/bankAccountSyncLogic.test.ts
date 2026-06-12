import { strict as assert } from "node:assert";
import type { ExpenseRecord } from "@/domains/financial/types";
import type { BankAccountRecord } from "./types";
import {
  applyExpenseBankSync,
  recalculateAccountBalances,
  sumBalancesByCurrency,
} from "./bankAccountSyncLogic";

const ACCOUNT_A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const ACCOUNT_B = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const EXPENSE_ID = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";

function account(id: string, balance = 0): BankAccountRecord {
  return {
    id,
    accountName: `Account ${id.slice(0, 4)}`,
    bankName: "Test Bank",
    accountNumber: "1234",
    accountType: "Corriente",
    currency: "Bs",
    currentBalance: balance,
    active: true,
    createdAt: "2026-01-01T00:00:00Z",
  };
}

function paidBankExpense(
  overrides: Partial<ExpenseRecord> & Pick<ExpenseRecord, "amount">
): ExpenseRecord {
  return {
    id: EXPENSE_ID,
    date: "2026-06-01",
    category: "Other",
    description: "Test expense",
    vendor: "Vendor",
    amount: overrides.amount,
    currency: "Bs",
    status: "Paid",
    paymentMethod: "Bank Transfer",
    bankAccountId: ACCOUNT_A,
    notes: "",
    ...overrides,
  };
}

function openingTransaction(amount: number) {
  return {
    id: "tx-opening",
    bankAccountId: ACCOUNT_A,
    date: "2026-01-01",
    description: "Saldo inicial",
    amount,
    type: "income" as const,
    referenceType: "opening" as const,
    referenceId: null,
    transferGroupId: null,
    runningBalance: 0,
    createdAt: "2026-01-01T00:00:00Z",
  };
}

function syncAndBalance(expense: ExpenseRecord, openingBalance = 10_000) {
  const accounts = [account(ACCOUNT_A, 0)];
  const base =
    openingBalance > 0 ? [openingTransaction(openingBalance)] : [];
  const transactions = applyExpenseBankSync(base, expense, "2026-06-01T12:00:00Z");
  const result = recalculateAccountBalances(accounts, transactions);
  return result.accounts[0].currentBalance;
}

console.log("bank account sync edge cases");

// Core integrity: amount edit 1,000 → 1,500
{
  const initial = syncAndBalance(paidBankExpense({ amount: 1_000 }));
  assert.equal(initial, 9_000, "initial paid expense deducts 1,000");

  const updated = syncAndBalance(paidBankExpense({ amount: 1_500 }));
  assert.equal(updated, 8_500, "amount edit to 1,500 deducts 1,500 total");
}

// Paid → Pending reverses balance
{
  const balance = syncAndBalance(
    paidBankExpense({ amount: 1_000, status: "Pending" })
  );
  assert.equal(balance, 10_000, "pending expense does not touch bank balance");
}

// Delete paid expense (no matching transaction row)
{
  const accounts = [account(ACCOUNT_A, 0)];
  const afterPaid = recalculateAccountBalances(
    accounts,
    applyExpenseBankSync([openingTransaction(10_000)], paidBankExpense({ amount: 1_000 }))
  );
  assert.equal(afterPaid.accounts[0].currentBalance, 9_000);

  const afterDelete = recalculateAccountBalances(afterPaid.accounts, [openingTransaction(10_000)]);
  assert.equal(afterDelete.accounts[0].currentBalance, 10_000, "delete removes ledger effect");
}

// Switch bank account on paid expense
{
  const accounts = [account(ACCOUNT_A, 0), account(ACCOUNT_B, 0)];
  const openingB = {
    ...openingTransaction(5_000),
    id: "tx-opening-b",
    bankAccountId: ACCOUNT_B,
  };
  const paidOnA = applyExpenseBankSync(
    [openingTransaction(10_000), openingB],
    paidBankExpense({ amount: 1_000 }),
    "t1"
  );
  const step1 = recalculateAccountBalances(accounts, paidOnA);
  assert.equal(step1.accounts[0].currentBalance, 9_000);
  assert.equal(step1.accounts[1].currentBalance, 5_000);

  const paidOnB = applyExpenseBankSync(
    paidOnA,
    paidBankExpense({ amount: 1_000, bankAccountId: ACCOUNT_B }),
    "t2"
  );
  const step2 = recalculateAccountBalances(accounts, paidOnB);
  assert.equal(step2.accounts[0].currentBalance, 10_000, "old account restored");
  assert.equal(step2.accounts[1].currentBalance, 4_000, "new account debited");
}

// Cash → no transaction even if Paid
{
  const balance = syncAndBalance(
    paidBankExpense({ amount: 1_000, paymentMethod: "Cash", bankAccountId: null })
  );
  assert.equal(balance, 10_000, "cash payment does not affect bank ledger");
}

// Bank Transfer without account → no transaction (API edge; form should block)
{
  const balance = syncAndBalance(
    paidBankExpense({ amount: 1_000, bankAccountId: null })
  );
  assert.equal(balance, 10_000, "transfer without account does not post");
}

// Multi-currency totals stay separate
{
  const totals = sumBalancesByCurrency([
    account(ACCOUNT_A, 0),
    { ...account(ACCOUNT_B, 0), currency: "USD", currentBalance: 500 },
  ]);
  assert.deepEqual(
    totals,
    [
      { currency: "Bs", total: 0 },
      { currency: "USD", total: 500 },
    ],
    "totals grouped by currency"
  );
}

console.log("all bank account sync edge cases passed");

import { strict as assert } from "node:assert";
import type { ExpenseRecord, RevenueRecord } from "@/domains/financial/types";
import type { BankAccountRecord, BankTransactionRecord } from "./types";
import {
  applyExpenseBankSync,
  applyPurchaseOrderBankSync,
  applyReceivablePaymentBankSync,
  applyRevenueBankSync,
  applySalesOrderBankSync,
  applyTransferBankSync,
  recalculateAccountBalances,
  removeReceivablePaymentBankSync,
  sumBalancesByCurrency,
} from "./bankAccountSyncLogic";

const ACCOUNT_A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const ACCOUNT_B = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const EXPENSE_ID = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";
const REVENUE_ID = "rrrrrrrr-rrrr-4rrr-8rrr-rrrrrrrrrrrr";
const TRANSFER_GROUP = "tttttttt-tttt-4ttt-8ttt-tttttttttttt";

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
    bnbAccountNumber: null,
    bnbConnected: false,
    bnbLastSyncedAt: null,
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

function collectedBankRevenue(
  overrides: Partial<RevenueRecord> & Pick<RevenueRecord, "amount">
): RevenueRecord {
  return {
    id: REVENUE_ID,
    date: "2026-06-01",
    sourceClient: "Client",
    productService: "Service",
    category: "Other",
    amount: overrides.amount,
    currency: "Bs",
    status: "Collected",
    paymentMethod: "Bank Transfer",
    bankAccountId: ACCOUNT_A,
    invoiceNumber: "INV-001",
    notes: "",
    cost: 0,
    ...overrides,
  };
}

function openingTransaction(amount: number, accountId = ACCOUNT_A) {
  return {
    id: `tx-opening-${accountId.slice(0, 4)}`,
    bankAccountId: accountId,
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
  const base = openingBalance > 0 ? [openingTransaction(openingBalance)] : [];
  const transactions = applyExpenseBankSync(base, expense, "2026-06-01T12:00:00Z");
  const result = recalculateAccountBalances(accounts, transactions);
  return result.accounts[0].currentBalance;
}

function syncRevenueBalance(revenue: RevenueRecord, openingBalance = 10_000) {
  const accounts = [account(ACCOUNT_A, 0)];
  const base = openingBalance > 0 ? [openingTransaction(openingBalance)] : [];
  const transactions = applyRevenueBankSync(base, revenue, "2026-06-01T12:00:00Z");
  return recalculateAccountBalances(accounts, transactions).accounts[0].currentBalance;
}

console.log("bank account sync edge cases");

// ── Expense tests ─────────────────────────────────────────────────────────────

{
  const initial = syncAndBalance(paidBankExpense({ amount: 1_000 }));
  assert.equal(initial, 9_000, "initial paid expense deducts 1,000");

  const updated = syncAndBalance(paidBankExpense({ amount: 1_500 }));
  assert.equal(updated, 8_500, "amount edit to 1,500 deducts 1,500 total");
}

{
  const balance = syncAndBalance(paidBankExpense({ amount: 1_000, status: "Pending" }));
  assert.equal(balance, 10_000, "pending expense does not touch bank balance");
}

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

{
  const accounts = [account(ACCOUNT_A, 0), account(ACCOUNT_B, 0)];
  const openingB = openingTransaction(5_000, ACCOUNT_B);
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

{
  const balance = syncAndBalance(
    paidBankExpense({ amount: 1_000, paymentMethod: "Cash", bankAccountId: null })
  );
  assert.equal(balance, 10_000, "cash payment does not affect bank ledger");
}

{
  const balance = syncAndBalance(paidBankExpense({ amount: 1_000, bankAccountId: null }));
  assert.equal(balance, 10_000, "transfer without account does not post");
}

// ── Revenue tests ─────────────────────────────────────────────────────────────

{
  const balance = syncRevenueBalance(collectedBankRevenue({ amount: 2_000 }));
  assert.equal(balance, 12_000, "collected bank revenue credits account");
}

{
  const balance = syncRevenueBalance(
    collectedBankRevenue({ amount: 2_000, status: "Pending" })
  );
  assert.equal(balance, 10_000, "pending revenue does not credit bank");
}

{
  const accounts = [account(ACCOUNT_A, 0)];
  const afterCollected = recalculateAccountBalances(
    accounts,
    applyRevenueBankSync([openingTransaction(10_000)], collectedBankRevenue({ amount: 500 }))
  );
  assert.equal(afterCollected.accounts[0].currentBalance, 10_500);

  const afterRevert = recalculateAccountBalances(
    afterCollected.accounts,
    applyRevenueBankSync(
      afterCollected.transactions,
      collectedBankRevenue({ amount: 500, status: "Pending" })
    )
  );
  assert.equal(afterRevert.accounts[0].currentBalance, 10_000, "Collected → Pending reverses credit");
}

{
  const accounts = [account(ACCOUNT_A, 0), account(ACCOUNT_B, 0)];
  const base = [openingTransaction(10_000), openingTransaction(3_000, ACCOUNT_B)];
  const onA = applyRevenueBankSync(base, collectedBankRevenue({ amount: 1_000 }), "t1");
  const step1 = recalculateAccountBalances(accounts, onA);
  assert.equal(step1.accounts[0].currentBalance, 11_000);

  const onB = applyRevenueBankSync(
    onA,
    collectedBankRevenue({ amount: 1_000, bankAccountId: ACCOUNT_B }),
    "t2"
  );
  const step2 = recalculateAccountBalances(accounts, onB);
  assert.equal(step2.accounts[0].currentBalance, 10_000, "revenue moved off old account");
  assert.equal(step2.accounts[1].currentBalance, 4_000, "revenue credited new account");
}

{
  const accounts = [account(ACCOUNT_A, 0)];
  const withRevenue = recalculateAccountBalances(
    accounts,
    applyRevenueBankSync([openingTransaction(10_000)], collectedBankRevenue({ amount: 800 }))
  );
  assert.equal(withRevenue.accounts[0].currentBalance, 10_800);

  const afterDelete = recalculateAccountBalances(withRevenue.accounts, [openingTransaction(10_000)]);
  assert.equal(afterDelete.accounts[0].currentBalance, 10_000, "revenue delete restores balance");
}

// ── AR partial payments ───────────────────────────────────────────────────────

{
  const accounts = [account(ACCOUNT_A, 0)];
  let txs: BankTransactionRecord[] = [openingTransaction(10_000)];

  txs = applyReceivablePaymentBankSync(txs, {
    id: 1_000_001,
    amount: 300,
    paymentDate: "2026-06-02",
    paymentMethod: "Bank Transfer",
    bankAccountId: ACCOUNT_A,
    invoiceNumber: "INV-100",
    customerName: "Acme",
  });
  txs = applyReceivablePaymentBankSync(txs, {
    id: 1_000_002,
    amount: 700,
    paymentDate: "2026-06-03",
    paymentMethod: "Bank Transfer",
    bankAccountId: ACCOUNT_A,
    invoiceNumber: "INV-100",
    customerName: "Acme",
  });

  const result = recalculateAccountBalances(accounts, txs);
  assert.equal(result.accounts[0].currentBalance, 11_000, "partial AR payments stack");
  assert.equal(result.transactions.filter((t) => t.referenceType === "receivable").length, 2);
}

{
  const accounts = [account(ACCOUNT_A, 0)];
  let txs = applyReceivablePaymentBankSync([openingTransaction(10_000)], {
    id: 1_000_003,
    amount: 500,
    paymentDate: "2026-06-02",
    paymentMethod: "Bank Transfer",
    bankAccountId: ACCOUNT_A,
    invoiceNumber: "INV-101",
    customerName: "Beta",
  });
  const afterPayment = recalculateAccountBalances(accounts, txs);
  assert.equal(afterPayment.accounts[0].currentBalance, 10_500);

  txs = removeReceivablePaymentBankSync(txs, 1_000_003);
  const afterDelete = recalculateAccountBalances(accounts, txs);
  assert.equal(afterDelete.accounts[0].currentBalance, 10_000, "AR payment delete reverses credit");
}

{
  const accounts = [account(ACCOUNT_A, 0)];
  const txs = applyReceivablePaymentBankSync([openingTransaction(10_000)], {
    id: 1_000_004,
    amount: 200,
    paymentDate: "2026-06-02",
    paymentMethod: "Cash",
    bankAccountId: null,
    invoiceNumber: "INV-102",
    customerName: "Gamma",
  });
  const result = recalculateAccountBalances(accounts, txs);
  assert.equal(result.accounts[0].currentBalance, 10_000, "cash AR payment stays off-ledger");
}

// ── Purchase order ────────────────────────────────────────────────────────────

{
  const accounts = [account(ACCOUNT_A, 0)];
  const txs = applyPurchaseOrderBankSync([openingTransaction(10_000)], {
    id: 1_000_010,
    poNumber: "PO-001",
    total: 1_200,
    status: "Received",
    paymentMethod: "Bank Transfer",
    bankAccountId: ACCOUNT_A,
    receivedDate: "2026-06-05",
  });
  const result = recalculateAccountBalances(accounts, txs);
  assert.equal(result.accounts[0].currentBalance, 8_800, "PO received debits bank account");
}

{
  const accounts = [account(ACCOUNT_A, 0)];
  const txs = applyPurchaseOrderBankSync([openingTransaction(10_000)], {
    id: 1_000_011,
    poNumber: "PO-002",
    total: 900,
    status: "Received",
    paymentMethod: "Cash",
    bankAccountId: null,
    receivedDate: "2026-06-05",
  });
  const result = recalculateAccountBalances(accounts, txs);
  assert.equal(result.accounts[0].currentBalance, 10_000, "PO cash payment stays off-ledger");
}

// ── Sales order ───────────────────────────────────────────────────────────────

{
  const accounts = [account(ACCOUNT_A, 0)];
  const txs = applySalesOrderBankSync([openingTransaction(10_000)], {
    id: 1_000_020,
    soNumber: "SO-001",
    total: 2_500,
    status: "Fulfilled",
    paymentMethod: "Bank Transfer",
    bankAccountId: ACCOUNT_A,
    fulfilledDate: "2026-06-06",
  });
  const result = recalculateAccountBalances(accounts, txs);
  assert.equal(result.accounts[0].currentBalance, 12_500, "SO fulfilled credits bank account");
}

// ── Transfer ──────────────────────────────────────────────────────────────────

{
  const accounts = [account(ACCOUNT_A, 0), account(ACCOUNT_B, 0)];
  const txs = applyTransferBankSync(
    [openingTransaction(10_000), openingTransaction(2_000, ACCOUNT_B)],
    {
      fromAccountId: ACCOUNT_A,
      toAccountId: ACCOUNT_B,
      date: "2026-06-07",
      amount: 1_500,
      description: "Internal transfer",
      transferGroupId: TRANSFER_GROUP,
    }
  );
  const result = recalculateAccountBalances(accounts, txs);
  assert.equal(result.accounts[0].currentBalance, 8_500, "transfer debits source");
  assert.equal(result.accounts[1].currentBalance, 3_500, "transfer credits destination");

  const totalCash = result.accounts.reduce((sum, a) => sum + a.currentBalance, 0);
  assert.equal(totalCash, 12_000, "transfer does not change total cash");
}

// ── Multi-currency ────────────────────────────────────────────────────────────

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

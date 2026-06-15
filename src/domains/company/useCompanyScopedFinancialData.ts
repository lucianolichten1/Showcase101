import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/domains/auth/AuthContext";
import { mergeCustomerRecords } from "@/domains/customers/mergeCustomerRecords";
import type { CustomerInput } from "@/domains/customers/customerService";
import { useCompanyNativeCustomers } from "@/domains/customers/useCompanyNativeCustomers";
import type { CustomerRecord } from "@/domains/customers/types";
import type { ExpenseRecord, ReceivableRecord, RevenueRecord, UseFinancialDataResult } from "@/domains/financial/types";
import { computeFinancialKPIs, filterRecordsByDateRange } from "@/domains/financial/calculations";
import { useFinancialData } from "@/domains/financial/hooks";
import type { ExpenseInput } from "@/domains/financial/expenses/expenseService";
import { isPersistedExpenseId } from "@/domains/financial/expenses/isPersistedExpenseId";
import { mergeExpenseRecords } from "@/domains/financial/expenses/mergeExpenseRecords";
import { useCompanyNativeExpenses } from "@/domains/financial/expenses/useCompanyNativeExpenses";
import { isPersistedNumericId } from "@/domains/financial/persistence/isPersistedNumericId";
import { isPersistedRecordId } from "@/domains/financial/persistence/isPersistedRecordId";
import { mergeReceivableRecords } from "@/domains/financial/receivables/mergeReceivableRecords";
import {
  calcOverdueDaysFromIso,
  deriveReceivableStatus,
  isoToDisplayDueDate,
} from "@/domains/financial/receivables/receivableDates";
import type { ReceivableInput } from "@/domains/financial/receivables/receivableService";
import type {
  ReceivablePaymentInput,
  ReceivablePaymentRecord,
} from "@/domains/financial/receivables/receivablePaymentTypes";
import { promoteImportedReceivableToNative } from "@/domains/financial/receivables/receivableService";
import { useCompanyNativeReceivables } from "@/domains/financial/receivables/useCompanyNativeReceivables";
import type { BankAccountInput, CreateBankAccountInput } from "@/domains/financial/bank-accounts/types";
import type { ManualTransactionInput, TransferInput } from "@/domains/financial/bank-accounts/types";
import type { BankAccountRecord, BankTransactionRecord } from "@/domains/financial/bank-accounts/types";
import { useCompanyNativeBankAccounts } from "@/domains/financial/bank-accounts/useCompanyNativeBankAccounts";
import type { RevenueInput } from "@/domains/financial/revenue/revenueService";
import { mergeRevenueRecords } from "@/domains/financial/revenue/mergeRevenueRecords";
import { useCompanyNativeRevenue } from "@/domains/financial/revenue/useCompanyNativeRevenue";
import { useCompanyRecords } from "./CompanyDataContext";
import { resolveActiveCompanyId } from "./resolveActiveCompanyId";
import {
  getCompanyScopedFinancialData,
  type CompanyFinancialScope,
  type CompanyScopedFinancialData,
} from "./companyScopedFinancialData";

export type CompanyScopedFinancialDataResult = UseFinancialDataResult &
  CompanyScopedFinancialData & {
    scope: CompanyFinancialScope;
    activeCompanyId: string | null;
    expensesLoading: boolean;
    expensesError: string | null;
    revenueLoading: boolean;
    revenueError: string | null;
    customersLoading: boolean;
    customersError: string | null;
    receivablesLoading: boolean;
    receivablesError: string | null;
    createExpense: (input: ExpenseInput) => Promise<ExpenseRecord>;
    updateExpense: (id: string, input: ExpenseInput) => Promise<ExpenseRecord>;
    deleteExpense: (id: string) => Promise<void>;
    saveExpense: (id: string | null, input: ExpenseInput) => Promise<void>;
    createRevenue: (input: RevenueInput) => Promise<RevenueRecord>;
    updateRevenue: (id: string, input: RevenueInput) => Promise<RevenueRecord>;
    deleteRevenue: (id: string) => Promise<void>;
    saveRevenue: (id: string | null, input: RevenueInput) => Promise<void>;
    saveCustomer: (id: number | null, input: CustomerInput) => Promise<void>;
    deleteCustomer: (id: number) => Promise<void>;
    saveReceivable: (id: number | null, input: ReceivableInput) => Promise<void>;
    deleteReceivable: (id: number) => Promise<void>;
    recordReceivablePayment: (id: number, input: ReceivablePaymentInput) => Promise<void>;
    deleteReceivablePayment: (paymentId: number) => Promise<void>;
    receivablePayments: ReceivablePaymentRecord[];
    bankAccounts: BankAccountRecord[];
    bankAccountsLoading: boolean;
    bankAccountsError: string | null;
    activeBankAccounts: BankAccountRecord[];
    saveBankAccount: (
      id: string | null,
      input: CreateBankAccountInput | BankAccountInput
    ) => Promise<void>;
    deactivateBankAccount: (id: string) => Promise<void>;
    hasBankAccountTransactions: (accountId: string) => Promise<boolean>;
    fetchBankAccountTransactions: (accountId: string) => Promise<BankTransactionRecord[]>;
    createManualBankTransaction: (input: ManualTransactionInput) => Promise<BankTransactionRecord>;
    createBankTransfer: (input: TransferInput) => Promise<string>;
    refreshBankAccounts: () => Promise<void>;
  };

export function useCompanyScopedFinancialData(): CompanyScopedFinancialDataResult {
  const financial = useFinancialData();
  const companies = useCompanyRecords();
  const { role, primaryCompanyId } = useAuth();
  const [searchParams] = useSearchParams();
  const companyIdParam = searchParams.get("companyId");
  const activeCompanyId = resolveActiveCompanyId(role, primaryCompanyId, companyIdParam);

  const expenseHook = useCompanyNativeExpenses(activeCompanyId);
  const revenueHook = useCompanyNativeRevenue(activeCompanyId);
  const customerHook = useCompanyNativeCustomers(activeCompanyId);
  const receivableHook = useCompanyNativeReceivables(activeCompanyId);
  const bankAccountHook = useCompanyNativeBankAccounts(activeCompanyId);

  const mergedExpenseRecords = useMemo(
    () => mergeExpenseRecords(financial.expenseRecords, expenseHook.nativeExpenses),
    [financial.expenseRecords, expenseHook.nativeExpenses]
  );

  const mergedRevenueRecords = useMemo(
    () => mergeRevenueRecords(financial.revenueRecords, revenueHook.nativeRevenue),
    [financial.revenueRecords, revenueHook.nativeRevenue]
  );

  const mergedCustomerRecords = useMemo(
    () => mergeCustomerRecords(financial.customerRecords, customerHook.nativeCustomers),
    [financial.customerRecords, customerHook.nativeCustomers]
  );

  const mergedReceivableRecords = useMemo(
    () => mergeReceivableRecords(financial.receivableRecords, receivableHook.nativeReceivables),
    [financial.receivableRecords, receivableHook.nativeReceivables]
  );

  const hasNativeFinancialData =
    mergedExpenseRecords.length > 0 ||
    mergedRevenueRecords.length > 0 ||
    mergedCustomerRecords.length > 0 ||
    mergedReceivableRecords.length > 0;

  const effectiveUsesImportedData = financial.usesImportedData || hasNativeFinancialData;

  const filteredMergedExpenseRecords = useMemo(
    () => filterRecordsByDateRange(mergedExpenseRecords, financial.dateRange),
    [mergedExpenseRecords, financial.dateRange]
  );

  const filteredMergedRevenueRecords = useMemo(
    () => filterRecordsByDateRange(mergedRevenueRecords, financial.dateRange),
    [mergedRevenueRecords, financial.dateRange]
  );

  const mergedKpis = useMemo(
    () =>
      computeFinancialKPIs(
        filteredMergedRevenueRecords,
        filteredMergedExpenseRecords,
        mergedReceivableRecords,
        { usesImportedData: effectiveUsesImportedData }
      ),
    [
      filteredMergedRevenueRecords,
      filteredMergedExpenseRecords,
      mergedReceivableRecords,
      effectiveUsesImportedData,
    ]
  );

  const saveExpense = useCallback(
    async (id: string | null, input: ExpenseInput) => {
      if (id) {
        if (isPersistedExpenseId(id)) await expenseHook.updateExpense(id, input);
        else financial.setExpenseRecords((prev) => prev.map((r) => (r.id === id ? { id, ...input } : r)));
      } else {
        await expenseHook.createExpense(input);
      }
      await bankAccountHook.refreshBankAccounts();
    },
    [expenseHook, financial, bankAccountHook]
  );

  const deleteExpense = useCallback(
    async (id: string) => {
      if (isPersistedExpenseId(id)) await expenseHook.deleteExpense(id);
      else financial.setExpenseRecords((prev) => prev.filter((r) => r.id !== id));
      await bankAccountHook.refreshBankAccounts();
    },
    [expenseHook, financial, bankAccountHook]
  );

  const saveRevenue = useCallback(
    async (id: string | null, input: RevenueInput) => {
      if (id) {
        if (isPersistedRecordId(id)) await revenueHook.updateRevenue(id, input);
        else financial.setRevenueRecords((prev) => prev.map((r) => (r.id === id ? { id, ...input, cost: input.cost ?? 0 } : r)));
      } else {
        await revenueHook.createRevenue(input);
      }
      await bankAccountHook.refreshBankAccounts();
    },
    [revenueHook, financial, bankAccountHook]
  );

  const deleteRevenue = useCallback(
    async (id: string) => {
      if (isPersistedRecordId(id)) await revenueHook.deleteRevenue(id);
      else financial.setRevenueRecords((prev) => prev.filter((r) => r.id !== id));
      await bankAccountHook.refreshBankAccounts();
    },
    [revenueHook, financial, bankAccountHook]
  );

  const saveCustomer = useCallback(
    async (id: number | null, input: CustomerInput) => {
      if (id) {
        if (isPersistedNumericId(id)) await customerHook.updateCustomer(id, input);
        else financial.setCustomerRecords((prev) => prev.map((r) => (r.id === id ? { ...r, ...input } : r)));
        return;
      }
      await customerHook.createCustomer(input);
    },
    [customerHook, financial]
  );

  const deleteCustomer = useCallback(
    async (id: number) => {
      if (isPersistedNumericId(id)) await customerHook.deleteCustomer(id);
      else financial.setCustomerRecords((prev) => prev.filter((r) => r.id !== id));
    },
    [customerHook, financial]
  );

  const saveReceivable = useCallback(
    async (id: number | null, input: ReceivableInput) => {
      if (id) {
        if (isPersistedNumericId(id)) await receivableHook.updateReceivable(id, input);
        else {
          financial.setReceivableRecords((prev) =>
            prev.map((r) => {
              if (r.id !== id) return r;
              const overdueDays = calcOverdueDaysFromIso(input.dueDateIso);
              const status = deriveReceivableStatus(
                input.amount,
                input.amountPaid,
                input.dueDateIso
              );
              return {
                ...r,
                customer: input.customer,
                invoiceNumber: input.invoiceNumber,
                amount: input.amount,
                amountPaid: input.amountPaid,
                dueDate: isoToDisplayDueDate(input.dueDateIso),
                overdueDays,
                status,
              };
            })
          );
        }
        return;
      }
      await receivableHook.createReceivable(input);
    },
    [receivableHook, financial]
  );

  const deleteReceivable = useCallback(
    async (id: number) => {
      if (isPersistedNumericId(id)) await receivableHook.deleteReceivable(id);
      else financial.setReceivableRecords((prev) => prev.filter((r) => r.id !== id));
      await bankAccountHook.refreshBankAccounts();
    },
    [receivableHook, financial, bankAccountHook]
  );

  const activeBankAccounts = useMemo(
    () => bankAccountHook.bankAccounts.filter((a) => a.active),
    [bankAccountHook.bankAccounts]
  );

  const saveBankAccount = useCallback(
    async (id: string | null, input: CreateBankAccountInput | BankAccountInput) => {
      if (id) {
        await bankAccountHook.updateBankAccount(id, input as BankAccountInput);
        return;
      }
      await bankAccountHook.createBankAccount(input as CreateBankAccountInput);
    },
    [bankAccountHook]
  );

  const recordReceivablePayment = useCallback(
    async (id: number, input: ReceivablePaymentInput) => {
      let targetId = id;
      if (!isPersistedNumericId(id)) {
        const current = mergedReceivableRecords.find((r) => r.id === id);
        if (!current) throw new Error("Factura no encontrada");
        if (!activeCompanyId) throw new Error("No hay empresa activa");
        const promoted = await promoteImportedReceivableToNative(activeCompanyId, current);
        targetId = promoted.id;
        financial.setReceivableRecords((prev) => prev.filter((r) => r.id !== id));
        await receivableHook.refresh();
      }
      await receivableHook.recordPayment(targetId, input);
      await bankAccountHook.refreshBankAccounts();
    },
    [receivableHook, financial, bankAccountHook, mergedReceivableRecords, activeCompanyId]
  );

  const deleteReceivablePayment = useCallback(
    async (paymentId: number) => {
      await receivableHook.deletePayment(paymentId);
      await bankAccountHook.refreshBankAccounts();
    },
    [receivableHook, bankAccountHook]
  );

  const scoped = useMemo(
    () =>
      getCompanyScopedFinancialData(companyIdParam, companies, {
        revenueRecords: mergedRevenueRecords,
        expenseRecords: mergedExpenseRecords,
        receivableRecords: mergedReceivableRecords,
        customerRecords: mergedCustomerRecords,
        filteredRevenueRecords: filteredMergedRevenueRecords,
        filteredExpenseRecords: filteredMergedExpenseRecords,
        kpis: mergedKpis,
        usesImportedData: effectiveUsesImportedData,
      }),
    [
      companyIdParam,
      companies,
      mergedRevenueRecords,
      mergedExpenseRecords,
      mergedReceivableRecords,
      mergedCustomerRecords,
      filteredMergedRevenueRecords,
      filteredMergedExpenseRecords,
      mergedKpis,
      effectiveUsesImportedData,
    ]
  );

  return {
    ...financial,
    ...scoped,
    revenueRecords: mergedRevenueRecords,
    expenseRecords: mergedExpenseRecords,
    customerRecords: mergedCustomerRecords,
    receivableRecords: mergedReceivableRecords,
    filteredRevenueRecords: filteredMergedRevenueRecords,
    filteredExpenseRecords: filteredMergedExpenseRecords,
    kpis: mergedKpis,
    usesImportedData: effectiveUsesImportedData,
    activeCompanyId,
    expensesLoading: expenseHook.loading,
    expensesError: expenseHook.error,
    revenueLoading: revenueHook.loading,
    revenueError: revenueHook.error,
    customersLoading: customerHook.loading,
    customersError: customerHook.error,
    receivablesLoading: receivableHook.loading,
    receivablesError: receivableHook.error,
    createExpense: expenseHook.createExpense,
    updateExpense: expenseHook.updateExpense,
    deleteExpense,
    saveExpense,
    createRevenue: revenueHook.createRevenue,
    updateRevenue: revenueHook.updateRevenue,
    deleteRevenue,
    saveRevenue,
    saveCustomer,
    deleteCustomer,
    saveReceivable,
    deleteReceivable,
    recordReceivablePayment,
    deleteReceivablePayment,
    receivablePayments: receivableHook.receivablePayments,
    bankAccounts: bankAccountHook.bankAccounts,
    bankAccountsLoading: bankAccountHook.loading,
    bankAccountsError: bankAccountHook.error,
    activeBankAccounts,
    saveBankAccount,
    deactivateBankAccount: bankAccountHook.deactivateBankAccount,
    hasBankAccountTransactions: bankAccountHook.hasTransactions,
    fetchBankAccountTransactions: bankAccountHook.fetchTransactions,
    createManualBankTransaction: bankAccountHook.createManualTransaction,
    createBankTransfer: bankAccountHook.createTransfer,
    refreshBankAccounts: bankAccountHook.refreshBankAccounts,
  };
}

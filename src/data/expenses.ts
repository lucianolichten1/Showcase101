/** @deprecated Import from `@/domains/financial` — re-exports for backward compatibility */
export {
  EXPENSE_CATEGORIES,
  EXPENSE_STATUSES,
  EXPENSE_PAYMENT_METHODS as PAYMENT_METHODS,
  EXPENSE_SORT_KEYS,
  type ExpenseCategory,
  type ExpensePaymentStatus as ExpenseStatus,
  type PaymentMethod,
  type ExpenseRecord,
  type ExpenseSortKey,
  type ExpenseSortDirection,
} from "@/domains/financial/types";

/** @deprecated Use ExpenseRecord */
export type { ExpenseRecord as Expense } from "@/domains/financial/types";

export { initialExpenseRecords as INITIAL_EXPENSES } from "@/domains/financial/mockData";

export { sortExpenseRecords } from "@/domains/financial/calculations";

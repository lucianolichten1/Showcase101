/** @deprecated Import from `@/domains/financial` — re-exports for backward compatibility */
export {
  REVENUE_CATEGORIES,
  REVENUE_STATUSES,
  REVENUE_PAYMENT_METHODS,
  REVENUE_SORT_KEYS,
  type RevenueCategory,
  type RevenuePaymentStatus as RevenueStatus,
  type PaymentMethod as RevenuePaymentMethod,
  type RevenueRecord,
  type RevenueSortKey,
  type RevenueSortDirection,
} from "@/domains/financial/types";

export { initialRevenueRecords as INITIAL_REVENUE } from "@/domains/financial/mockData";

export { isActiveRevenue, sortRevenueRecords } from "@/domains/financial/calculations";

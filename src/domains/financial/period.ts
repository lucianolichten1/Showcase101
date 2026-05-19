import type { DateRange } from "./types";

/** Preset or calendar-month financial reporting period */
export type FinancialPeriod =
  | { kind: "ytd" }
  | { kind: "all" }
  | { kind: "month"; year: number; month: number };

export type FinancialPeriodMode = "all" | "ytd" | "month";

/** Demo dataset calendar year */
export const DEMO_FINANCIAL_YEAR = 2026;

/** Last month included in demo YTD and P&L sample data */
export const DEMO_YTD_END_MONTH = 6;

/** Default month when switching to month mode (May — matches demo highlight month) */
export const DEFAULT_FINANCIAL_MONTH = { year: DEMO_FINANCIAL_YEAR, month: 5 } as const;

/** Short labels for demo P&L / trend rows (Jan–Jun) */
export const DEMO_PL_MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
] as const;

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

export const DEFAULT_FINANCIAL_PERIOD: FinancialPeriod = { kind: "ytd" };

export const FINANCIAL_ALL_DATE_RANGE: DateRange = {
  startDate: null,
  endDate: null,
};

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function lastDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/** Demo YTD: Jan 1 through end of June for the demo year */
export function getDemoYtdDateRange(year = DEMO_FINANCIAL_YEAR): DateRange {
  const endDay = lastDayOfMonth(year, DEMO_YTD_END_MONTH);
  return {
    startDate: `${year}-01-01`,
    endDate: `${year}-${pad2(DEMO_YTD_END_MONTH)}-${pad2(endDay)}`,
  };
}

export function getDateRangeForPeriod(period: FinancialPeriod): DateRange {
  if (period.kind === "ytd") return getDemoYtdDateRange();
  if (period.kind === "all") return FINANCIAL_ALL_DATE_RANGE;

  const startDate = `${period.year}-${pad2(period.month)}-01`;
  const endDay = lastDayOfMonth(period.year, period.month);
  const endDate = `${period.year}-${pad2(period.month)}-${pad2(endDay)}`;
  return { startDate, endDate };
}

export function getFinancialPeriodMode(period: FinancialPeriod): FinancialPeriodMode {
  return period.kind;
}

export function getFinancialPeriodLabel(period: FinancialPeriod): string {
  if (period.kind === "ytd") return `YTD ${DEMO_FINANCIAL_YEAR}`;
  if (period.kind === "all") return "All records";

  const monthName = MONTH_NAMES[period.month - 1];
  return `${monthName} ${period.year}`;
}

/** Value for `<input type="month" />` (YYYY-MM) */
export function monthInputValueFromPeriod(period: FinancialPeriod): string {
  if (period.kind === "month") {
    return `${period.year}-${pad2(period.month)}`;
  }
  return `${DEFAULT_FINANCIAL_MONTH.year}-${pad2(DEFAULT_FINANCIAL_MONTH.month)}`;
}

export function parseMonthInputValue(
  value: string
): { year: number; month: number } | null {
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12) return null;
  return { year, month };
}

export function periodFromModeAndMonth(
  mode: FinancialPeriodMode,
  monthInputValue?: string
): FinancialPeriod {
  if (mode === "all") return { kind: "all" };
  if (mode === "ytd") return { kind: "ytd" };

  const parsed = monthInputValue
    ? parseMonthInputValue(monthInputValue)
    : null;
  if (parsed) return { kind: "month", ...parsed };
  return {
    kind: "month",
    year: DEFAULT_FINANCIAL_MONTH.year,
    month: DEFAULT_FINANCIAL_MONTH.month,
  };
}

/** Index into demo `monthlyFinancials` for P&L / trend (0 = Jan … 5 = Jun) */
export function getDemoPlMonthIndex(period: FinancialPeriod): number {
  if (
    period.kind === "month" &&
    period.year === DEMO_FINANCIAL_YEAR &&
    period.month >= 1 &&
    period.month <= DEMO_PL_MONTH_LABELS.length
  ) {
    return period.month - 1;
  }
  return DEMO_PL_MONTH_LABELS.length - 1;
}

export function getDemoPlMonthLabel(period: FinancialPeriod): string {
  return DEMO_PL_MONTH_LABELS[getDemoPlMonthIndex(period)];
}

/** Subtitle for Reports P&L section */
export function getPlSectionSubtitle(period: FinancialPeriod): string {
  if (
    period.kind === "month" &&
    period.year === DEMO_FINANCIAL_YEAR &&
    period.month >= 1 &&
    period.month <= DEMO_PL_MONTH_LABELS.length
  ) {
    return `${getFinancialPeriodLabel(period)} · P&L breakdown`;
  }
  if (period.kind === "month") {
    return `Sample P&L: Jun ${DEMO_FINANCIAL_YEAR} (no breakdown for ${getFinancialPeriodLabel(period)})`;
  }
  return `Sample P&L: Jun ${DEMO_FINANCIAL_YEAR} · ${getFinancialPeriodLabel(period)} overview`;
}

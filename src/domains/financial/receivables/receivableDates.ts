import type { ReceivablePaymentStatus } from "@/domains/financial/types";

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export function isoToDisplayDueDate(isoDate: string): string {
  const [, month, day] = isoDate.split("-").map(Number);
  return `${MONTH_NAMES[(month ?? 1) - 1]} ${day}`;
}

export function displayDueDateToIso(display: string, year = new Date().getFullYear()): string | null {
  const [monthStr, dayStr] = display.split(" ");
  const monthIdx = MONTH_NAMES.indexOf(monthStr);
  const day = parseInt(dayStr, 10);
  if (monthIdx === -1 || Number.isNaN(day)) return null;
  const month = String(monthIdx + 1).padStart(2, "0");
  const dayPadded = String(day).padStart(2, "0");
  return `${year}-${month}-${dayPadded}`;
}

export function calcOverdueDaysFromIso(isoDate: string): number {
  const [year, month, day] = isoDate.split("-").map(Number);
  const due = new Date(year, (month ?? 1) - 1, day ?? 1);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.max(0, Math.floor((today.getTime() - due.getTime()) / 86_400_000));
}

export function deriveReceivableStatus(
  amount: number,
  amountPaid: number,
  dueDateIso: string,
  explicit?: string
): ReceivablePaymentStatus {
  if (explicit === "Paid" || amountPaid >= amount) return "Paid";
  if (explicit === "Partially Paid" || (amountPaid > 0 && amountPaid < amount)) {
    return "Partially Paid";
  }
  const overdueDays = calcOverdueDaysFromIso(dueDateIso);
  if (overdueDays > 0) return "Overdue";
  return "Pending";
}

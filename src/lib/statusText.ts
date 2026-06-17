export function receivableTableStatusClass(status: string): string {
  return status === "Paid" ? "font-medium text-green-800" : "font-medium text-stone-900";
}

export function revenueTableStatusClass(status: string): string {
  return status === "Collected" ? "font-medium text-green-800" : "font-medium text-stone-900";
}

export function expenseTableStatusClass(status: string): string {
  return status === "Paid" ? "font-medium text-green-800" : "font-medium text-stone-900";
}

export function customerTableStatusClass(status: string): string {
  return status === "Active" ? "font-medium text-stone-900" : "font-medium text-stone-600";
}

export function riskTableTextClass(_risk: string): string {
  return "font-medium text-stone-900";
}

export function receivableStatusTextClass(status: string): string {
  if (status === "Overdue") return "font-semibold text-red-700";
  if (status === "Paid") return "font-medium text-green-800";
  if (status === "Partially Paid") return "font-medium text-amber-800";
  return "font-medium text-stone-600";
}

export function riskTextClass(risk: string): string {
  if (risk === "High") return "font-semibold text-red-700";
  if (risk === "Medium") return "font-medium text-amber-800";
  return "font-medium text-green-800";
}

export function revenueStatusTextClass(status: string): string {
  if (status === "Collected") return "font-medium text-green-800";
  if (status === "Overdue") return "font-semibold text-red-700";
  if (status === "Cancelled") return "font-medium text-stone-600";
  return "font-medium text-amber-800";
}

export function expenseStatusTextClass(status: string): string {
  if (status === "Paid") return "font-medium text-green-800";
  if (status === "Overdue") return "font-semibold text-red-700";
  return "font-medium text-amber-800";
}

export function importStatusTextClass(status: string): string {
  if (status === "Completed") return "font-medium text-green-800";
  return "font-medium text-amber-800";
}

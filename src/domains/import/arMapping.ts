import type { ARFieldKey } from "./types";

/** Normalized header tokens that map to AR fields (heuristic + AI hints). */
export const AR_HEADER_HINTS: Record<ARFieldKey, string[]> = {
  invoiceNumber: [
    "invoice #",
    "invoice no",
    "invoice number",
    "invoice num",
    "factura",
    "nro factura",
    "num factura",
    "n° factura",
    "# factura",
  ],
  customerName: ["customer", "cliente", "client", "buyer", "razon social"],
  totalAmount: ["total", "amount", "monto total", "monto", "importe", "total bs"],
  paidAmount: ["paid", "pagado", "amount paid", "monto pagado"],
  balanceDue: ["balance due", "balance", "saldo", "saldo pendiente", "outstanding"],
  dueDate: ["due date", "fecha vencimiento", "vencimiento", "fecha de vencimiento"],
  status: ["status", "estado", "estatus", "payment status"],
  daysOverdue: [
    "days overdue",
    "dias vencido",
    "días vencido",
    "dias mora",
    "días mora",
    "overdue days",
  ],
  invoiceDate: [
    "invoice date",
    "fecha factura",
    "fecha emision",
    "issue date",
    "fecha de factura",
  ],
};

/** Headers that are valid AR columns — never warn as “non-standard”. */
export const AR_KNOWN_HEADER_PATTERNS = [
  ...Object.values(AR_HEADER_HINTS).flat(),
  "invoice",
  "customer",
  "total",
  "paid",
  "balance",
  "due",
  "overdue",
  "status",
  "factura",
  "cliente",
  "monto",
  "saldo",
  "vencimiento",
  "pagado",
];

export function normalizeImportHeader(header: string): string {
  return header.trim().toLowerCase().replace(/\s+/g, " ");
}

export function isKnownARHeader(header: string): boolean {
  const key = normalizeImportHeader(header);
  return AR_KNOWN_HEADER_PATTERNS.some(
    (pattern) => key === pattern || key.includes(pattern)
  );
}

/** Drop AI warnings that flag standard AR columns as unknown. */
export function filterArAiWarnings(warnings: string[]): string[] {
  return warnings.filter((w) => {
    const lower = w.toLowerCase();
    const flagsNonStandard =
      lower.includes("standard schema") ||
      lower.includes("not part of") ||
      lower.includes("not standard") ||
      lower.includes("extra column");
    if (!flagsNonStandard) return true;
    return !AR_KNOWN_HEADER_PATTERNS.some((term) => lower.includes(term));
  });
}

export function getMappedTotalAmountColumn(
  columnMap: Record<string, string>
): string | undefined {
  return columnMap.totalAmount?.trim() || columnMap.amount?.trim() || undefined;
}

export function hasARPrimaryDateMapping(columnMap: Record<string, string>): boolean {
  return Boolean(columnMap.dueDate?.trim() || columnMap.invoiceDate?.trim());
}

/** Normalize legacy AI/saved mappings (`amount` → `totalAmount`). */
export function normalizeArColumnMap(
  columnMap: Record<string, string>
): Record<string, string> {
  const next = { ...columnMap };
  if (next.amount && !next.totalAmount) {
    next.totalAmount = next.amount;
    delete next.amount;
  }
  delete next.customerId;
  return next;
}

export function getUnmappedArColumnWarnings(
  headers: string[],
  columnMap: Record<string, string>
): string[] {
  const used = new Set(
    Object.values(columnMap)
      .map((c) => c?.trim())
      .filter(Boolean)
  );
  const unknown = headers.filter((h) => !used.has(h) && !isKnownARHeader(h));
  if (unknown.length === 0) return [];
  return [`Unmapped columns (not recognized for AR): ${unknown.join(", ")}`];
}

export function countMappedARFields(columnMap: Record<string, string>): number {
  const keys: ARFieldKey[] = [
    "dueDate",
    "totalAmount",
    "customerName",
    "invoiceNumber",
    "paidAmount",
    "balanceDue",
    "status",
    "daysOverdue",
    "invoiceDate",
  ];
  return keys.filter((k) => columnMap[k]?.trim()).length;
}

import { parseDateValue } from "./dateUtils";
import type {
  ImportARRecord,
  ImportExpenseRecord,
  SalesRecord,
  SheetMapping,
} from "./types";
import {
  AR_REQUIRED_FIELDS,
  EXPENSE_REQUIRED_FIELDS,
  SALES_REQUIRED_FIELDS,
} from "./types";

export { parseDateValue } from "./dateUtils";

export interface NormalizeResult<T> {
  records: T[];
  skipped: number;
  warnings: string[];
}

export function parseNumberValue(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;

  const cleaned = String(value)
    .trim()
    .replace(/[Bs$€£,\s]/gi, "")
    .replace(/\(([^)]+)\)/, "-$1");

  const num = Number(cleaned);
  return Number.isFinite(num) ? num : null;
}

function trimText(value: unknown): string | undefined {
  const text = String(value ?? "").trim();
  return text || undefined;
}

function getMappedValue(
  row: Record<string, unknown>,
  columnMap: Record<string, string>,
  field: string
): unknown {
  const column = columnMap[field];
  if (!column) return undefined;
  return row[column];
}

function missingRequiredFields(
  columnMap: Record<string, string>,
  required: readonly string[]
): string[] {
  return required.filter((field) => !columnMap[field]?.trim());
}

export function normalizeSalesRows(
  rows: Record<string, unknown>[],
  mapping: SheetMapping,
  idPrefix: string
): NormalizeResult<SalesRecord> {
  const warnings: string[] = [];
  const missing = missingRequiredFields(mapping.columnMap, SALES_REQUIRED_FIELDS);
  if (missing.length > 0) {
    return {
      records: [],
      skipped: rows.length,
      warnings: [`Missing required sales mappings: ${missing.join(", ")}`],
    };
  }

  const records: SalesRecord[] = [];
  let skipped = 0;

  rows.forEach((row, index) => {
    const date = parseDateValue(getMappedValue(row, mapping.columnMap, "date"));
    const revenue = parseNumberValue(
      getMappedValue(row, mapping.columnMap, "revenue")
    );

    if (!date || revenue === null) {
      skipped += 1;
      warnings.push(`Sales row ${index + 2}: invalid date or revenue`);
      return;
    }

    const quantity = parseNumberValue(
      getMappedValue(row, mapping.columnMap, "quantity")
    );
    const cost = parseNumberValue(getMappedValue(row, mapping.columnMap, "cost"));

    records.push({
      id: `${idPrefix}-sales-${index + 1}`,
      date,
      revenue,
      customerName: trimText(
        getMappedValue(row, mapping.columnMap, "customerName")
      ),
      product: trimText(getMappedValue(row, mapping.columnMap, "product")),
      quantity: quantity ?? undefined,
      cost: cost ?? undefined,
    });
  });

  return { records, skipped, warnings };
}

export function normalizeExpenseRows(
  rows: Record<string, unknown>[],
  mapping: SheetMapping,
  idPrefix: string
): NormalizeResult<ImportExpenseRecord> {
  const warnings: string[] = [];
  const missing = missingRequiredFields(mapping.columnMap, EXPENSE_REQUIRED_FIELDS);
  if (missing.length > 0) {
    return {
      records: [],
      skipped: rows.length,
      warnings: [`Missing required expense mappings: ${missing.join(", ")}`],
    };
  }

  const records: ImportExpenseRecord[] = [];
  let skipped = 0;

  rows.forEach((row, index) => {
    const date = parseDateValue(getMappedValue(row, mapping.columnMap, "date"));
    const amount = parseNumberValue(
      getMappedValue(row, mapping.columnMap, "amount")
    );

    if (!date || amount === null) {
      skipped += 1;
      warnings.push(`Expense row ${index + 2}: invalid date or amount`);
      return;
    }

    records.push({
      id: `${idPrefix}-expense-${index + 1}`,
      date,
      amount,
      category: trimText(getMappedValue(row, mapping.columnMap, "category")),
      description: trimText(
        getMappedValue(row, mapping.columnMap, "description")
      ),
      vendor: trimText(getMappedValue(row, mapping.columnMap, "vendor")),
    });
  });

  return { records, skipped, warnings };
}

export function normalizeARRows(
  rows: Record<string, unknown>[],
  mapping: SheetMapping,
  idPrefix: string
): NormalizeResult<ImportARRecord> {
  const warnings: string[] = [];
  const missing = missingRequiredFields(mapping.columnMap, AR_REQUIRED_FIELDS);
  if (missing.length > 0) {
    return {
      records: [],
      skipped: rows.length,
      warnings: [`Missing required AR mappings: ${missing.join(", ")}`],
    };
  }

  const records: ImportARRecord[] = [];
  let skipped = 0;

  rows.forEach((row, index) => {
    const invoiceDate = parseDateValue(
      getMappedValue(row, mapping.columnMap, "invoiceDate")
    );
    const amount = parseNumberValue(
      getMappedValue(row, mapping.columnMap, "amount")
    );

    if (!invoiceDate || amount === null) {
      skipped += 1;
      warnings.push(`AR row ${index + 2}: invalid invoiceDate or amount`);
      return;
    }

    const dueDateRaw = parseDateValue(
      getMappedValue(row, mapping.columnMap, "dueDate")
    );

    records.push({
      id: `${idPrefix}-ar-${index + 1}`,
      invoiceDate,
      amount,
      dueDate: dueDateRaw ?? undefined,
      customerName: trimText(getMappedValue(row, mapping.columnMap, "customerName")),
      customerId: trimText(getMappedValue(row, mapping.columnMap, "customerId")),
      status: trimText(getMappedValue(row, mapping.columnMap, "status")),
      invoiceNumber: trimText(getMappedValue(row, mapping.columnMap, "invoiceNumber")),
    });
  });

  return { records, skipped, warnings };
}

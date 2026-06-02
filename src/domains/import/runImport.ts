import {
  getMappedTotalAmountColumn,
  hasARPrimaryDateMapping,
} from "./arMapping";
import { readSheetRows } from "./parseWorkbook";
import { normalizeARRows, normalizeCustomerRows, normalizeExpenseRows, normalizeSalesRows } from "./normalize";
import type { ImportedData, SheetMapping } from "./types";

export interface RunImportOptions {
  /** Year for AR due dates like "May 10" without a year */
  defaultYear?: number;
}

export interface RunImportResult {
  data: ImportedData;
  warnings: string[];
  salesCount: number;
  expensesCount: number;
  arCount: number;
  customerCount: number;
  skipped: number;
}

export function runImportFromWorkbook(
  fileBuffer: ArrayBuffer,
  sheetMappings: SheetMapping[],
  sourceFileName: string,
  options?: RunImportOptions
): RunImportResult {
  const idPrefix = `import-${Date.now()}`;
  const allWarnings: string[] = [];
  const sales: ImportedData["sales"] = [];
  const expenses: ImportedData["expenses"] = [];
  const arReceivables: ImportedData["arReceivables"] = [];
  const customers: ImportedData["customers"] = [];
  let skipped = 0;

  for (const mapping of sheetMappings) {
    if (mapping.role === "ignore") continue;

    const { rows } = readSheetRows(fileBuffer, mapping.sheetName);
    if (mapping.role === "sales") {
      const result = normalizeSalesRows(rows, mapping, idPrefix);
      sales.push(...result.records);
      skipped += result.skipped;
      allWarnings.push(...result.warnings);
    } else if (mapping.role === "expenses") {
      const result = normalizeExpenseRows(rows, mapping, idPrefix);
      expenses.push(...result.records);
      skipped += result.skipped;
      allWarnings.push(...result.warnings);
    } else if (mapping.role === "accounts-receivable") {
      const result = normalizeARRows(rows, mapping, idPrefix, {
        defaultYear: options?.defaultYear,
      });
      arReceivables.push(...result.records);
      skipped += result.skipped;
      allWarnings.push(...result.warnings);
    } else if (mapping.role === "customers") {
      const result = normalizeCustomerRows(rows, mapping, idPrefix);
      customers.push(...result.records);
      skipped += result.skipped;
      allWarnings.push(...result.warnings);
    }
  }

  return {
    data: {
      sales,
      expenses,
      arReceivables,
      customers,
      importedAt: new Date().toISOString(),
      sourceFileName,
    },
    warnings: allWarnings,
    salesCount: sales.length,
    expensesCount: expenses.length,
    arCount: arReceivables.length,
    customerCount: customers.length,
    skipped,
  };
}

export function validateSheetMappings(
  sheetMappings: SheetMapping[]
): string | null {
  const salesSheets = sheetMappings.filter((m) => m.role === "sales");
  const expenseSheets = sheetMappings.filter((m) => m.role === "expenses");
  const arSheets = sheetMappings.filter((m) => m.role === "accounts-receivable");

  const customerSheets = sheetMappings.filter((m) => m.role === "customers");

  if (salesSheets.length === 0 && expenseSheets.length === 0 && arSheets.length === 0 && customerSheets.length === 0) {
    return "Assign at least one sheet a role (Sales, Expenses, Accounts Receivable, or Customers) before importing.";
  }

  for (const sheet of salesSheets) {
    if (!sheet.columnMap.date || !sheet.columnMap.revenue) {
      return `Sales sheet "${sheet.sheetName}" requires Date and Revenue column mappings.`;
    }
  }

  for (const sheet of expenseSheets) {
    if (!sheet.columnMap.date || !sheet.columnMap.amount) {
      return `Expenses sheet "${sheet.sheetName}" requires Date and Amount column mappings.`;
    }
  }

  for (const sheet of arSheets) {
    if (!getMappedTotalAmountColumn(sheet.columnMap)) {
      return `Accounts Receivable sheet "${sheet.sheetName}" requires a Total Amount column mapping.`;
    }
    if (!hasARPrimaryDateMapping(sheet.columnMap)) {
      return `Accounts Receivable sheet "${sheet.sheetName}" requires Due Date or Invoice Date column mapping.`;
    }
  }

  for (const sheet of customerSheets) {
    if (!sheet.columnMap.name) {
      return `Customers sheet "${sheet.sheetName}" requires a Name column mapping.`;
    }
  }

  return null;
}

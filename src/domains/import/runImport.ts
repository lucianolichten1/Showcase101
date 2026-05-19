import { readSheetRows } from "./parseWorkbook";
import { normalizeExpenseRows, normalizeSalesRows } from "./normalize";
import type { ImportedData, SheetMapping } from "./types";

export interface RunImportResult {
  data: ImportedData;
  warnings: string[];
  salesCount: number;
  expensesCount: number;
  skipped: number;
}

export function runImportFromWorkbook(
  fileBuffer: ArrayBuffer,
  sheetMappings: SheetMapping[],
  sourceFileName: string
): RunImportResult {
  const idPrefix = `import-${Date.now()}`;
  const allWarnings: string[] = [];
  const sales: ImportedData["sales"] = [];
  const expenses: ImportedData["expenses"] = [];
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
    }
  }

  return {
    data: {
      sales,
      expenses,
      importedAt: new Date().toISOString(),
      sourceFileName,
    },
    warnings: allWarnings,
    salesCount: sales.length,
    expensesCount: expenses.length,
    skipped,
  };
}

export function validateSheetMappings(
  sheetMappings: SheetMapping[]
): string | null {
  const salesSheets = sheetMappings.filter((m) => m.role === "sales");
  const expenseSheets = sheetMappings.filter((m) => m.role === "expenses");

  if (salesSheets.length === 0 && expenseSheets.length === 0) {
    return "Assign at least one sheet as Sales or Expenses before importing.";
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

  return null;
}

import type {
  ImportMapping,
  SheetMapping,
  SheetPreview,
  SheetRole,
  WorkbookPreview,
} from "./types";

const SALES_HEADER_HINTS: Record<string, string[]> = {
  date: ["fecha", "date", "invoice date", "sale date"],
  revenue: ["total", "revenue", "gross", "sale", "amount", "total bs", "venta"],
  customerName: ["cliente", "customer", "buyer", "client"],
  product: ["producto", "product", "item", "service"],
  quantity: ["cantidad", "quantity", "qty", "units"],
  cost: ["costo", "cost", "product cost", "cogs"],
};

const EXPENSE_HEADER_HINTS: Record<string, string[]> = {
  date: ["fecha", "date", "expense date"],
  amount: ["amount", "total", "monto", "importe", "expense"],
  category: ["category", "categoria", "tipo", "type"],
  description: ["description", "descripcion", "detail", "concepto"],
  vendor: ["vendor", "proveedor", "supplier", "payee"],
};

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase();
}

function guessColumn(headers: string[], hints: string[]): string | undefined {
  const normalized = headers.map((h) => ({
    original: h,
    key: normalizeHeader(h),
  }));

  for (const hint of hints) {
    const exact = normalized.find((h) => h.key === hint);
    if (exact) return exact.original;
  }

  for (const hint of hints) {
    const partial = normalized.find((h) => h.key.includes(hint));
    if (partial) return partial.original;
  }

  return undefined;
}

function guessSalesColumnMap(headers: string[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const [field, hints] of Object.entries(SALES_HEADER_HINTS)) {
    const match = guessColumn(headers, hints);
    if (match) map[field] = match;
  }
  return map;
}

function guessExpenseColumnMap(headers: string[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const [field, hints] of Object.entries(EXPENSE_HEADER_HINTS)) {
    const match = guessColumn(headers, hints);
    if (match) map[field] = match;
  }
  return map;
}

function guessSheetRole(sheetName: string, headers: string[]): SheetRole {
  const name = sheetName.toLowerCase();
  const headerText = headers.map(normalizeHeader).join(" ");

  if (
    name.includes("expense") ||
    name.includes("gasto") ||
    headerText.includes("vendor") ||
    headerText.includes("proveedor")
  ) {
    return "expenses";
  }

  if (
    name.includes("sale") ||
    name.includes("revenue") ||
    name.includes("venta") ||
    headerText.includes("cliente") ||
    headerText.includes("customer") ||
    headerText.includes("revenue")
  ) {
    return "sales";
  }

  return "ignore";
}

/** Build initial sheet mappings from workbook structure. */
export function buildDefaultSheetMappings(
  preview: WorkbookPreview
): SheetMapping[] {
  return preview.sheets.map((sheet) => {
    const role = guessSheetRole(sheet.sheetName, sheet.headers);
    const columnMap =
      role === "sales"
        ? guessSalesColumnMap(sheet.headers)
        : role === "expenses"
          ? guessExpenseColumnMap(sheet.headers)
          : {};
    return { sheetName: sheet.sheetName, role, columnMap };
  });
}

/** Merge saved mapping onto current workbook when sheet/column names match. */
export function applySavedMapping(
  preview: WorkbookPreview,
  saved: ImportMapping | null
): SheetMapping[] {
  const defaults = buildDefaultSheetMappings(preview);
  if (!saved) return defaults;

  return preview.sheets.map((sheet) => {
    const savedSheet = saved.sheetMappings.find(
      (m) => m.sheetName === sheet.sheetName
    );
    if (!savedSheet) {
      return (
        defaults.find((d) => d.sheetName === sheet.sheetName) ?? {
          sheetName: sheet.sheetName,
          role: "ignore" as const,
          columnMap: {},
        }
      );
    }

    const columnMap: Record<string, string> = {};
    for (const [field, column] of Object.entries(savedSheet.columnMap)) {
      if (sheet.headers.includes(column)) {
        columnMap[field] = column;
      }
    }

    return {
      sheetName: sheet.sheetName,
      role: savedSheet.role,
      columnMap:
        Object.keys(columnMap).length > 0
          ? columnMap
          : (defaults.find((d) => d.sheetName === sheet.sheetName)?.columnMap ??
            {}),
    };
  });
}

export function createImportMapping(
  name: string,
  sheetMappings: SheetMapping[]
): ImportMapping {
  return {
    id: `mapping-${Date.now()}`,
    name,
    sheetMappings,
    updatedAt: new Date().toISOString(),
  };
}

export function getSheetPreview(
  preview: WorkbookPreview,
  sheetName: string
): SheetPreview | undefined {
  return preview.sheets.find((s) => s.sheetName === sheetName);
}

export type ParsedRow = Record<string, string>;

export type DetectedField =
  | "date"
  | "amount"
  | "description"
  | "customer"
  | "vendor"
  | "category"
  | "type";

export type DetectedMapping = Record<DetectedField, string | null>;

const FIELD_ALIASES: Record<DetectedField, string[]> = {
  date: ["date", "fecha"],
  amount: ["amount", "monto", "total", "valor"],
  description: ["description", "descripcion", "detalle", "concept"],
  customer: ["customer", "cliente"],
  vendor: ["vendor", "proveedor"],
  category: ["category", "categoria"],
  type: ["type", "tipo"],
};

const FIELD_LABELS: Record<DetectedField, string> = {
  date: "Date",
  amount: "Amount",
  description: "Description",
  customer: "Customer",
  vendor: "Vendor",
  category: "Category",
  type: "Type",
};

export function getFieldLabel(field: DetectedField): string {
  return FIELD_LABELS[field];
}

export const DETECTED_FIELDS = Object.keys(FIELD_LABELS) as DetectedField[];

export function parseSimpleCsv(text: string): { headers: string[]; rows: ParsedRow[] } {
  const lines = text.split(/\r?\n/).filter((line) => line.trim() !== "");
  if (lines.length === 0) throw new Error("The file is empty. Please upload a CSV with headers and data.");
  const headers = lines[0].split(",").map((cell) => cell.trim());
  if (headers.length === 0 || headers.every((h) => h === "")) throw new Error("Could not read column headers from the CSV.");
  if (lines.length === 1) throw new Error("The CSV only contains headers. Add at least one data row.");
  const rows: ParsedRow[] = lines.slice(1).map((line) => {
    const cells = line.split(",").map((cell) => cell.trim());
    const row: ParsedRow = {};
    headers.forEach((header, index) => { row[header] = cells[index] ?? ""; });
    return row;
  });
  return { headers, rows };
}

export function detectColumns(headers: string[]): DetectedMapping {
  const mapping = Object.fromEntries(DETECTED_FIELDS.map((field) => [field, null])) as DetectedMapping;
  const normalizedHeaders = headers.map((header) => ({ original: header, lower: header.trim().toLowerCase() }));
  for (const field of DETECTED_FIELDS) {
    const aliases = FIELD_ALIASES[field];
    for (const { original, lower } of normalizedHeaders) {
      if (aliases.some((alias) => lower === alias || lower.includes(alias))) {
        mapping[field] = original;
        break;
      }
    }
  }
  return mapping;
}

function escapeCsvCell(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export function rowsToCsv(headers: string[], rows: ParsedRow[]): string {
  const headerLine = headers.map(escapeCsvCell).join(",");
  const dataLines = rows.map((row) => headers.map((header) => escapeCsvCell(row[header] ?? "")).join(","));
  return [headerLine, ...dataLines].join("\n");
}

export function downloadCsvFile(content: string, filename: string): void {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function isCsvFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return name.endsWith(".csv") || file.type === "text/csv";
}

export function isExcelFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return name.endsWith(".xlsx") || name.endsWith(".xls");
}

export function formatDisplayDate(date: Date = new Date()): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

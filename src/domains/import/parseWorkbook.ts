import * as XLSX from "xlsx";
import type { SheetPreview, WorkbookPreview } from "./types";

const PREVIEW_ROW_LIMIT = 5;

function rowToRecord(
  headers: string[],
  row: unknown[]
): Record<string, unknown> {
  const record: Record<string, unknown> = {};
  headers.forEach((header, index) => {
    const key = header.trim() || `Column ${index + 1}`;
    record[key] = row[index] ?? "";
  });
  return record;
}

function sheetToPreview(sheetName: string, worksheet: XLSX.WorkSheet): SheetPreview {
  const rows = XLSX.utils.sheet_to_json<unknown[]>(worksheet, {
    header: 1,
    defval: "",
    raw: false,
  }) as unknown[][];

  if (rows.length === 0) {
    return { sheetName, headers: [], previewRows: [] };
  }

  const headerRow = rows[0] ?? [];
  const headers = headerRow.map((cell, index) => {
    const text = String(cell ?? "").trim();
    return text || `Column ${index + 1}`;
  });

  const dataRows = rows.slice(1).filter((row) =>
    row.some((cell) => String(cell ?? "").trim() !== "")
  );

  const previewRows = dataRows
    .slice(0, PREVIEW_ROW_LIMIT)
    .map((row) => rowToRecord(headers, row as unknown[]));

  return { sheetName, headers, previewRows };
}

/** Parse an .xlsx file into sheet previews (headers + first rows). */
export async function parseWorkbookFile(file: File): Promise<WorkbookPreview> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array", cellDates: true });

  const sheets = workbook.SheetNames.map((sheetName) =>
    sheetToPreview(sheetName, workbook.Sheets[sheetName])
  );

  return { sheets };
}

/** Read all data rows from a sheet (for normalization). */
export function readSheetRows(
  file: ArrayBuffer,
  sheetName: string
): { headers: string[]; rows: Record<string, unknown>[] } {
  const workbook = XLSX.read(file, { type: "array", cellDates: true });
  const worksheet = workbook.Sheets[sheetName];
  if (!worksheet) {
    return { headers: [], rows: [] };
  }

  // raw: true preserves Excel Date objects and serial numbers for normalize.ts
  const matrix = XLSX.utils.sheet_to_json<unknown[]>(worksheet, {
    header: 1,
    defval: "",
    raw: true,
  }) as unknown[][];

  if (matrix.length === 0) {
    return { headers: [], rows: [] };
  }

  const headers = (matrix[0] ?? []).map((cell, index) => {
    const text = String(cell ?? "").trim();
    return text || `Column ${index + 1}`;
  });

  const rows = matrix
    .slice(1)
    .filter((row) => row.some((cell) => String(cell ?? "").trim() !== ""))
    .map((row) => rowToRecord(headers, row as unknown[]));

  return { headers, rows };
}

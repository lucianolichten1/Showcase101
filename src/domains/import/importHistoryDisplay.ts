import type { ImportHistoryItem } from "./types";

export type ImportHistoryDisplayStatus = "Completed" | "Needs Review";

export interface ImportHistoryDisplayRow {
  id: string;
  fileName: string;
  type: "Excel" | "CSV";
  rows: number;
  status: ImportHistoryDisplayStatus;
  uploadedBy: string;
  date: string;
  salesRows: number;
  expenseRows: number;
}

export function formatImportHistoryDate(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return iso;
  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function importHistoryToDisplayRow(
  item: ImportHistoryItem,
  type: "Excel" | "CSV" = "Excel"
): ImportHistoryDisplayRow {
  const needsReview = item.warningCount > 0 || item.skippedRows > 0;
  return {
    id: item.id,
    fileName: item.fileName,
    type,
    rows: item.salesRows + item.expenseRows,
    status: needsReview ? "Needs Review" : "Completed",
    uploadedBy: "Imported",
    date: formatImportHistoryDate(item.importedAt),
    salesRows: item.salesRows,
    expenseRows: item.expenseRows,
  };
}

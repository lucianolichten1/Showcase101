import { useCallback, useMemo, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, FileSpreadsheet, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { parseWorkbookFile } from "@/domains/import/parseWorkbook";
import {
  applySavedMapping,
  buildDefaultSheetMappings,
  createImportMapping,
  getSheetPreview,
} from "@/domains/import/mapping";
import { runImportFromWorkbook, validateSheetMappings } from "@/domains/import/runImport";
import type { SheetMapping, SheetRole, WorkbookPreview } from "@/domains/import/types";
import {
  EXPENSE_FIELD_KEYS,
  EXPENSE_FIELD_LABELS,
  EXPENSE_REQUIRED_FIELDS,
  SALES_FIELD_KEYS,
  SALES_FIELD_LABELS,
  SALES_REQUIRED_FIELDS,
} from "@/domains/import/types";
import { useFinancialData } from "@/domains/financial/hooks";

const ROLE_OPTIONS: { value: SheetRole; label: string }[] = [
  { value: "sales", label: "Sales" },
  { value: "expenses", label: "Expenses" },
  { value: "ignore", label: "Ignore" },
];

function FieldMapper({
  title,
  fields,
  labels,
  required,
  headers,
  columnMap,
  onChange,
}: {
  title: string;
  fields: readonly string[];
  labels: Record<string, string>;
  required: readonly string[];
  headers: string[];
  columnMap: Record<string, string>;
  onChange: (field: string, column: string) => void;
}) {
  return (
    <div className="space-y-2 border border-stone-100 rounded-lg p-3 bg-stone-50/50">
      <p className="text-[10px] font-bold uppercase tracking-wide text-stone-500">
        {title}
      </p>
      {fields.map((field) => (
        <div key={field} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
          <label className="text-xs text-stone-700 sm:w-28 shrink-0">
            {labels[field]}
            {required.includes(field) && (
              <span className="text-red-500 ml-0.5">*</span>
            )}
          </label>
          <select
            value={columnMap[field] ?? ""}
            onChange={(e) => onChange(field, e.target.value)}
            className="flex-1 py-1.5 px-2 text-xs border border-stone-200 rounded-lg bg-white"
          >
            <option value="">— Select column —</option>
            {headers.map((header) => (
              <option key={header} value={header}>
                {header}
              </option>
            ))}
          </select>
        </div>
      ))}
    </div>
  );
}

export function ExcelImportWizard() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    importMapping,
    importedData,
    applyImportedData,
    clearImportedData,
    usesImportedData,
  } = useFinancialData();

  const [fileName, setFileName] = useState<string | null>(null);
  const [fileBuffer, setFileBuffer] = useState<ArrayBuffer | null>(null);
  const [workbook, setWorkbook] = useState<WorkbookPreview | null>(null);
  const [sheetMappings, setSheetMappings] = useState<SheetMapping[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>("");
  const [mappingName, setMappingName] = useState("Default company mapping");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [importWarnings, setImportWarnings] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const activeSheet = useMemo(
    () => (workbook ? getSheetPreview(workbook, selectedSheet) : undefined),
    [workbook, selectedSheet]
  );

  const activeMapping = sheetMappings.find((m) => m.sheetName === selectedSheet);

  const processFile = useCallback(
    async (file: File) => {
      setErrorMessage(null);
      setSuccessMessage(null);
      setImportWarnings([]);

      if (!file.name.toLowerCase().endsWith(".xlsx")) {
        setErrorMessage("Please upload an Excel workbook (.xlsx).");
        return;
      }

      try {
        const buffer = await file.arrayBuffer();
        const preview = await parseWorkbookFile(file);
        const mappings = applySavedMapping(preview, importMapping);

        setFileName(file.name);
        setFileBuffer(buffer);
        setWorkbook(preview);
        setSheetMappings(mappings);
        setSelectedSheet(preview.sheets[0]?.sheetName ?? "");
        setMappingName(importMapping?.name ?? `${file.name} mapping`);
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "Could not read the Excel file."
        );
      }
    },
    [importMapping]
  );

  const updateSheetMapping = (sheetName: string, patch: Partial<SheetMapping>) => {
    setSheetMappings((prev) =>
      prev.map((m) => {
        if (m.sheetName !== sheetName) return m;
        const next = { ...m, ...patch };
        if (patch.role && patch.role !== "ignore" && workbook) {
          const sheet = getSheetPreview(workbook, sheetName);
          if (sheet && Object.keys(next.columnMap).length === 0) {
            const defaults = buildDefaultSheetMappings(workbook).find(
              (d) => d.sheetName === sheetName
            );
            if (defaults) next.columnMap = { ...defaults.columnMap };
          }
        }
        return next;
      })
    );
  };

  const updateColumnMap = (sheetName: string, field: string, column: string) => {
    setSheetMappings((prev) =>
      prev.map((m) => {
        if (m.sheetName !== sheetName) return m;
        const columnMap = { ...m.columnMap };
        if (column) columnMap[field] = column;
        else delete columnMap[field];
        return { ...m, columnMap };
      })
    );
  };

  const handleImport = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setImportWarnings([]);

    if (!fileBuffer || !fileName) {
      setErrorMessage("Upload an Excel file first.");
      return;
    }

    const validationError = validateSheetMappings(sheetMappings);
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    const result = runImportFromWorkbook(fileBuffer, sheetMappings, fileName);
    if (result.salesCount === 0 && result.expensesCount === 0) {
      setErrorMessage(
        "No valid rows were imported. Check your column mappings and try again."
      );
      setImportWarnings(result.warnings.slice(0, 10));
      return;
    }

    const mapping = createImportMapping(mappingName.trim() || "Company mapping", sheetMappings);
    applyImportedData(result.data, mapping, {
      fileName,
      salesRows: result.salesCount,
      expenseRows: result.expensesCount,
      skippedRows: result.skipped,
      warningCount: result.warnings.length,
    });
    setImportWarnings(result.warnings.slice(0, 15));
    setSuccessMessage(
      `Imported ${result.salesCount} sales and ${result.expensesCount} expense rows` +
        (result.skipped > 0 ? ` (${result.skipped} rows skipped).` : ".")
    );
  };

  return (
    <section className="bg-white rounded-xl border border-stone-200 shadow-sm p-4 sm:p-5 space-y-5">
      <div>
        <h2 className="text-sm font-bold text-stone-800 uppercase tracking-tight">
          Excel financial import
        </h2>
        <p className="text-xs text-stone-500 mt-1 max-w-2xl">
          Upload any .xlsx workbook, map sheets and columns to Sales and Expenses,
          then import. Mappings are saved locally for faster re-imports.
        </p>
        {usesImportedData && importedData && (
          <p className="text-xs text-green-700 mt-2 font-medium">
            Using imported data ({importedData.sales.length} sales,{" "}
            {importedData.expenses.length} expenses)
            {importedData.sourceFileName
              ? ` from ${importedData.sourceFileName}`
              : ""}
            .
          </p>
        )}
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          const file = e.dataTransfer.files?.[0];
          if (file) void processFile(file);
        }}
        className={cn(
          "border-2 border-dashed rounded-xl p-8 text-center transition-colors",
          isDragging
            ? "border-green-600 bg-green-50/50"
            : "border-stone-200 bg-stone-50/30"
        )}
      >
        <FileSpreadsheet className="h-8 w-8 text-stone-400 mx-auto mb-2" />
        <p className="text-sm text-stone-600 mb-3">
          Drag and drop an .xlsx file, or choose a file
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void processFile(file);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wide bg-green-700 text-white rounded-lg hover:bg-green-800"
        >
          <Upload className="h-3.5 w-3.5" />
          Choose Excel file
        </button>
        {fileName && (
          <p className="text-xs text-stone-500 mt-3">Loaded: {fileName}</p>
        )}
      </div>

      {errorMessage && (
        <div className="flex items-start gap-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-800">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="flex items-start gap-2 rounded-lg border border-green-100 bg-green-50 px-3 py-2 text-sm text-green-800">
          <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{successMessage}</span>
        </div>
      )}

      {importWarnings.length > 0 && (
        <div className="rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-xs text-amber-900 space-y-1 max-h-32 overflow-y-auto">
          <p className="font-bold uppercase tracking-wide">Import warnings</p>
          {importWarnings.map((w) => (
            <p key={w}>{w}</p>
          ))}
        </div>
      )}

      {workbook && workbook.sheets.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-4 space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-wide text-stone-500">
              Sheets ({workbook.sheets.length})
            </p>
            <ul className="space-y-1 max-h-48 overflow-y-auto border border-stone-100 rounded-lg p-1">
              {workbook.sheets.map((sheet) => {
                const mapping = sheetMappings.find(
                  (m) => m.sheetName === sheet.sheetName
                );
                return (
                  <li key={sheet.sheetName}>
                    <button
                      type="button"
                      onClick={() => setSelectedSheet(sheet.sheetName)}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-lg text-xs transition-colors",
                        selectedSheet === sheet.sheetName
                          ? "bg-green-50 text-green-900 font-semibold"
                          : "hover:bg-stone-50 text-stone-700"
                      )}
                    >
                      {sheet.sheetName}
                      {mapping && mapping.role !== "ignore" && (
                        <span className="block text-[10px] text-stone-500 capitalize">
                          {mapping.role}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>

            {activeMapping && (
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wide text-stone-500">
                  Sheet role
                </label>
                <select
                  value={activeMapping.role}
                  onChange={(e) =>
                    updateSheetMapping(selectedSheet, {
                      role: e.target.value as SheetRole,
                    })
                  }
                  className="mt-1 w-full py-2 px-3 text-xs border border-stone-200 rounded-lg bg-white"
                >
                  {ROLE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="lg:col-span-8 space-y-4">
            {activeSheet && activeMapping && (
              <>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wide text-stone-500 mb-2">
                    Preview — {activeSheet.sheetName}
                  </p>
                  {activeSheet.headers.length === 0 ? (
                    <p className="text-sm text-stone-500">This sheet has no headers.</p>
                  ) : (
                    <div className="overflow-x-auto border border-stone-100 rounded-lg">
                      <table className="min-w-full text-xs">
                        <thead className="bg-stone-50">
                          <tr>
                            {activeSheet.headers.map((h) => (
                              <th
                                key={h}
                                className="px-2 py-2 text-left font-semibold text-stone-600 whitespace-nowrap"
                              >
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {activeSheet.previewRows.map((row, i) => (
                            <tr key={i} className="border-t border-stone-50">
                              {activeSheet.headers.map((h) => (
                                <td
                                  key={h}
                                  className="px-2 py-1.5 text-stone-700 whitespace-nowrap"
                                >
                                  {String(row[h] ?? "")}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {activeMapping.role === "sales" && (
                  <FieldMapper
                    title="Map sales columns"
                    fields={SALES_FIELD_KEYS}
                    labels={SALES_FIELD_LABELS}
                    required={SALES_REQUIRED_FIELDS}
                    headers={activeSheet.headers}
                    columnMap={activeMapping.columnMap}
                    onChange={(field, col) =>
                      updateColumnMap(selectedSheet, field, col)
                    }
                  />
                )}

                {activeMapping.role === "expenses" && (
                  <FieldMapper
                    title="Map expense columns"
                    fields={EXPENSE_FIELD_KEYS}
                    labels={EXPENSE_FIELD_LABELS}
                    required={EXPENSE_REQUIRED_FIELDS}
                    headers={activeSheet.headers}
                    columnMap={activeMapping.columnMap}
                    onChange={(field, col) =>
                      updateColumnMap(selectedSheet, field, col)
                    }
                  />
                )}

                {activeMapping.role === "ignore" && (
                  <p className="text-sm text-stone-500">
                    This sheet will be skipped during import.
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {workbook && (
        <div className="flex flex-col sm:flex-row sm:items-end gap-3 pt-2 border-t border-stone-100">
          <div className="flex-1">
            <label className="text-[10px] font-bold uppercase tracking-wide text-stone-500">
              Mapping name (saved locally)
            </label>
            <input
              type="text"
              value={mappingName}
              onChange={(e) => setMappingName(e.target.value)}
              className="mt-1 w-full py-2 px-3 text-xs border border-stone-200 rounded-lg"
            />
          </div>
          <div className="flex gap-2">
            {usesImportedData && (
              <button
                type="button"
                onClick={() => {
                  clearImportedData();
                  setSuccessMessage(null);
                  setErrorMessage(null);
                  setSuccessMessage("Cleared imported data. Using demo mock data.");
                }}
                className="px-4 py-2 text-xs font-bold uppercase border border-stone-200 rounded-lg text-stone-600 hover:bg-stone-50"
              >
                Clear import
              </button>
            )}
            <button
              type="button"
              onClick={handleImport}
              className="px-4 py-2 text-xs font-bold uppercase bg-green-700 text-white rounded-lg hover:bg-green-800"
            >
              Import mapped data
            </button>
          </div>
        </div>
      )}

      <p className="text-[10px] text-stone-400 border-t border-stone-100 pt-3">
        TODO: Customers, Accounts Receivable, and Inventory sheet mapping.
      </p>
    </section>
  );
}

import {
  useCallback,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type ReactNode,
} from "react";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  Circle,
  Download,
  Sparkles,
  AlertCircle,
  Database,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  importHistoryToDisplayRow,
  type ImportHistoryDisplayStatus,
} from "@/domains/import/importHistoryDisplay";
import { useFinancialData } from "@/domains/financial/hooks";
import { ExcelImportWizard } from "./ExcelImportWizard";
import { CompanyContextBanner } from "./company/CompanyContextBanner";
import {
  DETECTED_FIELDS,
  detectColumns,
  downloadCsvFile,
  formatDisplayDate,
  getFieldLabel,
  isCsvFile,
  isExcelFile,
  parseSimpleCsv,
  rowsToCsv,
  type DetectedMapping,
  type ParsedRow,
} from "@/lib/csv";

const exportOptions = [
  {
    title: "Profit & Loss Report",
    description: "Monthly revenue, expenses, and net profit summary.",
  },
  {
    title: "Expense Breakdown",
    description: "Category-level spending breakdown across all business operations.",
  },
  {
    title: "Revenue Report",
    description: "Sales and income by customer, product, or time period.",
  },
  {
    title: "Accounts Receivable Report",
    description: "Outstanding invoices, due dates, and overdue balances.",
  },
];

const aiBullets = [
  "Detect date, amount, customer, and category columns",
  "Flag missing or unusual values",
  "Suggest expense and revenue categories",
  "Preview data before saving",
];

function StatusBadge({ status }: { status: ImportHistoryDisplayStatus }) {
  return (
    <span
      className={cn(
        "inline-flex px-2 py-0.5 text-[9px] font-bold uppercase rounded-full tracking-wider border",
        status === "Completed"
          ? "bg-green-50 text-green-800 border-green-100"
          : "bg-amber-50 text-amber-800 border-amber-100"
      )}
    >
      {status}
    </span>
  );
}

function SectionCard({
  title,
  subtitle,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "bg-white rounded-xl border border-stone-200 shadow-sm p-4 sm:p-5",
        className
      )}
    >
      <div className="mb-4">
        <h2 className="text-sm font-bold text-stone-800 uppercase tracking-tight">{title}</h2>
        {subtitle && <p className="text-xs text-stone-500 mt-1">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

function MessageBanner({
  variant,
  children,
}: {
  variant: "error" | "success";
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-2 rounded-lg border px-3 py-2.5 text-sm",
        variant === "error"
          ? "bg-red-50 border-red-100 text-red-800"
          : "bg-green-50 border-green-100 text-green-800"
      )}
    >
      {variant === "error" ? (
        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
      ) : (
        <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
      )}
      <span>{children}</span>
    </div>
  );
}

export function ExportImportPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    importHistory,
    appendImportHistory,
    usesImportedData,
    importedData,
    clearImportedData,
  } = useFinancialData();

  const recentImports = importHistory.map((item) =>
    importHistoryToDisplayRow(
      item,
      item.fileName.toLowerCase().endsWith(".csv") ? "CSV" : "Excel"
    )
  );

  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedHeaders, setParsedHeaders] = useState<string[]>([]);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [detectedMapping, setDetectedMapping] = useState<DetectedMapping | null>(null);
  const [importedRows, setImportedRows] = useState<ParsedRow[]>([]);
  const [importedHeaders, setImportedHeaders] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const hasUpload = parsedRows.length > 0 && parsedHeaders.length > 0;
  const hasPreview = hasUpload;
  const hasConfirmed = importedRows.length > 0;

  const previewRows = parsedRows.slice(0, 10);
  const importedPreviewRows = importedRows.slice(0, 20);

  const resetUploadState = useCallback(() => {
    setParsedHeaders([]);
    setParsedRows([]);
    setDetectedMapping(null);
    setFileName(null);
  }, []);

  const processFile = useCallback(
    async (file: File) => {
      setErrorMessage(null);
      setSuccessMessage(null);

      if (isExcelFile(file)) {
        resetUploadState();
        setFileName(file.name);
        setErrorMessage(
          "Use the Excel Import section above to import .xlsx files."
        );
        return;
      }

      if (!isCsvFile(file)) {
        resetUploadState();
        setErrorMessage("Please upload a CSV (.csv) or Excel (.xlsx) file.");
        return;
      }

      try {
        const text = await file.text();
        const { headers, rows } = parseSimpleCsv(text);
        setFileName(file.name);
        setParsedHeaders(headers);
        setParsedRows(rows);
        setDetectedMapping(detectColumns(headers));
      } catch (error) {
        resetUploadState();
        setFileName(file.name);
        setErrorMessage(
          error instanceof Error ? error.message : "Could not read the CSV file."
        );
      }
    },
    [resetUploadState]
  );

  const handleFileInput = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) void processFile(file);
    event.target.value = "";
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (!file) {
      setErrorMessage("No file selected.");
      return;
    }
    void processFile(file);
  };

  const handleCancelImport = () => {
    resetUploadState();
    setErrorMessage(null);
    setSuccessMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleConfirmImport = () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!fileName || parsedRows.length === 0) {
      setErrorMessage("Upload and preview a CSV file before confirming import.");
      return;
    }

    setImportedRows(parsedRows);
    setImportedHeaders(parsedHeaders);

    appendImportHistory({
      id: `import-${Date.now()}`,
      fileName,
      importedAt: new Date().toISOString(),
      salesRows: parsedRows.length,
      expenseRows: 0,
      skippedRows: 0,
      warningCount: 0,
    });
    setSuccessMessage(`Imported ${parsedRows.length} rows from ${fileName}.`);
  };

  const handleExportImported = () => {
    setErrorMessage(null);
    if (importedRows.length === 0 || importedHeaders.length === 0) {
      setErrorMessage("No imported data to export yet.");
      return;
    }
    const csv = rowsToCsv(importedHeaders, importedRows);
    downloadCsvFile(csv, "agro-imported-data.csv");
    setSuccessMessage(`Exported ${importedRows.length} rows to agro-imported-data.csv.`);
  };

  return (
    <div className="flex flex-1 flex-col text-[#1C1917] font-sans min-h-0">
      {/* Page header */}
      <header className="h-auto min-h-14 bg-white border-b border-stone-200 px-6 sm:px-10 py-4 flex items-center shadow-sm flex-shrink-0">
        <div className="w-full max-w-7xl mx-auto">
          <h1 className="text-lg font-bold text-stone-900 leading-none">Import & Export</h1>
          <p className="text-sm text-stone-500 mt-1.5 max-w-2xl">
            Import financial data from Excel workbooks to populate your dashboard, reports, and receivables. Export clean summaries when you're done.
          </p>
        </div>
      </header>

      <main className="flex-1 p-6 sm:p-10 max-w-7xl mx-auto w-full space-y-6 overflow-auto">
        <CompanyContextBanner />

        {/* Active import banner */}
        {usesImportedData && importedData && (
          <div className="rounded-xl border border-green-200 bg-green-50 px-5 py-4 flex flex-col sm:flex-row sm:items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-100 border border-green-200">
              <Database className="h-4 w-4 text-green-700" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-green-900">Imported data is active</p>
              <p className="text-xs text-green-700 mt-0.5">
                {[
                  importedData.sales.length > 0 && `${importedData.sales.length} sales`,
                  importedData.expenses.length > 0 && `${importedData.expenses.length} expenses`,
                  importedData.arReceivables.length > 0 && `${importedData.arReceivables.length} receivables`,
                ].filter(Boolean).join(" · ")}
                {importedData.sourceFileName ? ` — from ${importedData.sourceFileName}` : ""}
                {" · "}Saved in this browser until you clear the import.
              </p>
            </div>
            <button
              type="button"
              onClick={() => clearImportedData()}
              className="shrink-0 px-3 py-1.5 text-xs font-bold rounded-lg border border-green-200 bg-white text-green-800 hover:bg-green-100 transition-colors"
            >
              Clear import
            </button>
          </div>
        )}

        {/* Primary: Excel Import Wizard */}
        <ExcelImportWizard />

        {/* CSV messages */}
        {(errorMessage || successMessage) && (
          <div className="space-y-2">
            {errorMessage && <MessageBanner variant="error">{errorMessage}</MessageBanner>}
            {successMessage && <MessageBanner variant="success">{successMessage}</MessageBanner>}
          </div>
        )}

        {/* Recent Imports */}
        <SectionCard
          title="Recent Imports"
          subtitle="History of files imported in this browser session."
        >
          {recentImports.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-stone-400">
              <FileSpreadsheet size={28} strokeWidth={1.5} />
              <p className="text-sm font-medium">No imports yet</p>
              <p className="text-xs">Complete an Excel import above to see it here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-1">
              <table className="w-full text-left border-collapse min-w-[580px]">
                <thead className="text-[9px] uppercase text-stone-400 font-bold border-b border-stone-100">
                  <tr className="h-8">
                    <th className="font-bold pr-4">File</th>
                    <th className="font-bold pr-4">Added</th>
                    <th className="font-bold pr-4">Status</th>
                    <th className="font-bold">Date</th>
                  </tr>
                </thead>
                <tbody className="text-[11px] text-stone-800">
                  {recentImports.map((row) => (
                    <tr
                      key={row.id}
                      className="h-11 border-b border-stone-50 last:border-0 hover:bg-stone-50 transition-colors"
                    >
                      <td className="pr-4 py-2">
                        <div className="flex items-center gap-2">
                          <FileSpreadsheet className="h-3.5 w-3.5 text-stone-400 shrink-0" />
                          <span className="font-medium truncate max-w-[220px]">{row.fileName}</span>
                          <span className="text-[9px] text-stone-400 uppercase font-bold">{row.type}</span>
                        </div>
                      </td>
                      <td className="pr-4 text-stone-500">
                        {row.rows > 0 ? `${row.rows} new rows` : "No new rows"}
                        {row.duplicateRows > 0 && (
                          <span className="ml-1 text-stone-400">· {row.duplicateRows} skipped</span>
                        )}
                      </td>
                      <td className="pr-4">
                        <StatusBadge status={row.status} />
                      </td>
                      <td className="text-stone-500">{row.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>

        {/* Legacy CSV quick import */}
        <details className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
          <summary className="px-4 sm:px-5 py-4 cursor-pointer list-none flex items-center justify-between">
            <div>
              <span className="text-sm font-bold text-stone-800 uppercase tracking-tight">CSV Quick Preview</span>
              <span className="ml-2 text-[10px] font-medium text-stone-400 normal-case uppercase tracking-wide">(legacy · CSV only)</span>
            </div>
            <span className="text-xs text-stone-400">For .csv preview only — use Excel Import above for full import</span>
          </summary>
          <div className="px-4 sm:px-5 pb-5 space-y-4 border-t border-stone-100 pt-4">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={handleFileInput}
            />
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={cn(
                "border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-center transition-colors",
                fileName ? "p-6 min-h-[80px]" : "p-8",
                isDragging ? "border-green-500 bg-green-50/50" : "border-stone-200 bg-stone-50/80"
              )}
            >
              {fileName ? (
                <p className="text-sm font-semibold text-stone-900 break-all px-2">{fileName}</p>
              ) : (
                <>
                  <Upload className="h-5 w-5 text-stone-400 mb-2" />
                  <p className="text-sm font-semibold text-stone-700">Drop a CSV file here</p>
                  <p className="text-xs text-stone-400 mt-1 mb-3">or choose a file to preview its contents</p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-stone-800 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-stone-700 transition-colors"
                  >
                    Choose CSV File
                  </button>
                </>
              )}
            </div>

            {detectedMapping && parsedHeaders.length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-2">Detected Columns</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {DETECTED_FIELDS.map((field) => (
                    <div key={field} className="flex items-center justify-between rounded-lg border border-stone-100 bg-stone-50 px-3 py-2 text-xs">
                      <span className="font-bold text-stone-700">{getFieldLabel(field)}</span>
                      <span className="text-stone-500">{detectedMapping[field] ? `→ ${detectedMapping[field]}` : "—"}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {hasPreview && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-2">
                  Preview ({parsedRows.length} rows{parsedRows.length > 10 ? ", showing first 10" : ""})
                </p>
                <div className="overflow-x-auto -mx-1 mb-3">
                  <table className="w-full text-left border-collapse min-w-[480px]">
                    <thead className="text-[9px] uppercase text-stone-400 font-bold border-b border-stone-100">
                      <tr className="h-8">
                        {parsedHeaders.map((header) => (
                          <th key={header} className="font-bold pr-4 whitespace-nowrap">{header}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="text-[11px] text-stone-800">
                      {previewRows.map((row, index) => (
                        <tr key={index} className="h-10 border-b border-stone-50 last:border-0 hover:bg-stone-50">
                          {parsedHeaders.map((header) => (
                            <td key={header} className="pr-4 py-2 whitespace-nowrap">{row[header] ?? ""}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button type="button" onClick={handleConfirmImport}
                    className="bg-green-800 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-green-900 transition-colors shadow-sm">
                    Confirm Import
                  </button>
                  <button type="button" onClick={handleCancelImport}
                    className="bg-white text-stone-700 px-4 py-2 rounded-lg text-xs font-bold border border-stone-200 hover:bg-stone-50 transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {hasConfirmed && (
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                  <p className="text-xs text-stone-500">
                    {importedRows.length} row{importedRows.length === 1 ? "" : "s"} in session
                    {importedRows.length > 20 ? " (showing first 20)" : ""}
                  </p>
                  <button type="button" onClick={handleExportImported} disabled={importedRows.length === 0}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-stone-800 text-white hover:bg-stone-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                    <Download className="h-3 w-3" />
                    Export CSV
                  </button>
                </div>
                <div className="overflow-x-auto -mx-1">
                  <table className="w-full text-left border-collapse min-w-[480px]">
                    <thead className="text-[9px] uppercase text-stone-400 font-bold border-b border-stone-100">
                      <tr className="h-8">
                        {importedHeaders.map((header) => (
                          <th key={header} className="font-bold pr-4 whitespace-nowrap">{header}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="text-[11px] text-stone-800">
                      {importedPreviewRows.map((row, index) => (
                        <tr key={index} className="h-10 border-b border-stone-50 last:border-0 hover:bg-stone-50">
                          {importedHeaders.map((header) => (
                            <td key={header} className="pr-4 py-2 whitespace-nowrap">{row[header] ?? ""}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </details>

        {/* Export Reports + AI Assistant */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <SectionCard title="Export Reports" subtitle="Download clean summaries from your imported data." className="xl:col-span-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {exportOptions.map((option) => (
                <div
                  key={option.title}
                  className="rounded-lg border border-stone-200 p-3 flex flex-col gap-2 hover:border-stone-300 hover:shadow-sm transition-all"
                >
                  <p className="text-sm font-bold text-stone-900">{option.title}</p>
                  <p className="text-xs text-stone-500 flex-1">{option.description}</p>
                  <button
                    type="button"
                    className="self-start mt-1 inline-flex items-center gap-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 px-3 py-1.5 rounded text-xs font-bold transition-colors"
                  >
                    <Download className="h-3 w-3" />
                    Export
                  </button>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-stone-400 mt-4">Export functionality coming in next release.</p>
          </SectionCard>

          <SectionCard title="AI Import Assistant">
            <div className="rounded-lg bg-green-800 text-white p-4 relative overflow-hidden">
              <div className="absolute top-[-30px] right-[-30px] w-32 h-32 bg-green-700/40 rounded-full blur-2xl" />
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="h-4 w-4 text-green-300" />
                  <p className="text-xs font-bold uppercase tracking-wider">Coming soon</p>
                </div>
                <p className="text-sm font-medium leading-relaxed mb-4">
                  AI will help detect columns, clean messy files, and suggest categories before importing.
                </p>
                <ul className="space-y-2">
                  {aiBullets.map((bullet) => (
                    <li key={bullet} className="flex items-start gap-2 text-xs text-green-50">
                      <Circle className="h-1.5 w-1.5 fill-green-300 text-green-300 mt-1.5 shrink-0" />
                      {bullet}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </SectionCard>
        </div>
      </main>
    </div>
  );
}

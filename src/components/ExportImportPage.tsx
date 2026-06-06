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
  Download,
  AlertCircle,
  Database,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  importHistoryToDisplayRow,
  type ImportHistoryDisplayStatus,
} from "@/domains/import/importHistoryDisplay";
import { useCompanyScopedFinancialData } from "@/domains/company/useCompanyScopedFinancialData";
import { formatCurrency } from "@/data/mockData";
import { ExcelImportWizard } from "./ExcelImportWizard";
import { importStatusTextClass } from "@/lib/statusText";
import {
  DETECTED_FIELDS,
  detectColumns,
  downloadCsvFile,
  getFieldLabel,
  isCsvFile,
  isExcelFile,
  parseSimpleCsv,
  rowsToCsv,
  type DetectedMapping,
  type ParsedRow,
} from "@/lib/csv";

// exportOptions are built dynamically inside the component (need financial data)

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
      <div className="mb-3">
        <h2 className="text-[10px] font-bold text-green-800 uppercase tracking-wider">{title}</h2>
        {subtitle && <p className="text-xs text-stone-700 mt-0.5">{subtitle}</p>}
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
    revenueRecords,
    expenseRecords,
    receivableRecords,
  } = useCompanyScopedFinancialData();

  // ── Export handlers ───────────────────────────────────────────────────────────

  const handleExportPL = () => {
    const rows = [
      { "Item": "Total Revenue", "Amount (Bs)": revenueRecords.filter(r => r.status !== "Cancelled").reduce((s, r) => s + r.amount, 0).toString(), "Notes": "" },
      { "Item": "Cost of Goods Sold", "Amount (Bs)": revenueRecords.filter(r => r.status !== "Cancelled").reduce((s, r) => s + (r.cost ?? 0), 0).toString(), "Notes": "" },
      { "Item": "Gross Profit", "Amount (Bs)": (revenueRecords.filter(r => r.status !== "Cancelled").reduce((s, r) => s + r.amount - (r.cost ?? 0), 0)).toString(), "Notes": "" },
      { "Item": "Total Expenses", "Amount (Bs)": expenseRecords.reduce((s, e) => s + e.amount, 0).toString(), "Notes": "" },
      { "Item": "Net Profit", "Amount (Bs)": (revenueRecords.filter(r => r.status !== "Cancelled").reduce((s, r) => s + r.amount - (r.cost ?? 0), 0) - expenseRecords.reduce((s, e) => s + e.amount, 0)).toString(), "Notes": "" },
    ];
    downloadCsvFile(rowsToCsv(["Item", "Amount (Bs)", "Notes"], rows), "profit-loss-report.csv");
  };

  const handleExportExpenses = () => {
    const grouped = new Map<string, number>();
    expenseRecords.forEach(e => grouped.set(e.category, (grouped.get(e.category) ?? 0) + e.amount));
    const total = Array.from(grouped.values()).reduce((s, v) => s + v, 0);
    const rows = Array.from(grouped.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([category, amount]) => ({
        "Category": category,
        "Amount (Bs)": amount.toString(),
        "Percentage": total > 0 ? `${Math.round((amount / total) * 100)}%` : "0%",
      }));
    downloadCsvFile(rowsToCsv(["Category", "Amount (Bs)", "Percentage"], rows), "expense-breakdown.csv");
  };

  const handleExportRevenue = () => {
    const rows = revenueRecords.map(r => ({
      "Date": r.date,
      "Client": r.sourceClient,
      "Product / Service": r.productService,
      "Category": r.category,
      "Amount (Bs)": r.amount.toString(),
      "Status": r.status,
      "Invoice #": r.invoiceNumber,
    }));
    downloadCsvFile(rowsToCsv(["Date", "Client", "Product / Service", "Category", "Amount (Bs)", "Status", "Invoice #"], rows), "revenue-report.csv");
  };

  const handleExportAR = () => {
    const rows = receivableRecords.map(r => ({
      "Customer": r.customer,
      "Invoice #": r.invoiceNumber,
      "Total (Bs)": r.amount.toString(),
      "Paid (Bs)": r.amountPaid.toString(),
      "Balance (Bs)": (r.amount - r.amountPaid).toString(),
      "Due Date": r.dueDate,
      "Days Overdue": r.overdueDays.toString(),
      "Status": r.status,
    }));
    downloadCsvFile(rowsToCsv(["Customer", "Invoice #", "Total (Bs)", "Paid (Bs)", "Balance (Bs)", "Due Date", "Days Overdue", "Status"], rows), "accounts-receivable-report.csv");
  };

  const exportOptions = [
    { title: "Profit & Loss Report", description: "Revenue, cost, and net profit summary.", handler: handleExportPL, hasData: revenueRecords.length > 0 || expenseRecords.length > 0 },
    { title: "Expense Breakdown", description: "Category-level spending across all business operations.", handler: handleExportExpenses, hasData: expenseRecords.length > 0 },
    { title: "Revenue Report", description: "Sales and income by customer, product, or time period.", handler: handleExportRevenue, hasData: revenueRecords.length > 0 },
    { title: "Accounts Receivable Report", description: "Outstanding invoices, due dates, and overdue balances.", handler: handleExportAR, hasData: receivableRecords.length > 0 },
  ];

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
    downloadCsvFile(csv, "imported-data.csv");
    setSuccessMessage(`Exported ${importedRows.length} rows to imported-data.csv.`);
  };

  return (
    <div className="flex flex-1 flex-col text-[#1C1917] font-sans min-h-0 bg-stone-50/40">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-10 py-4 sm:py-5 space-y-5">
        <section className="rounded-xl border border-stone-200 bg-white shadow-sm px-4 py-3.5 sm:px-5">
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Import & Export</h1>
          <p className="text-sm text-stone-700 mt-1 max-w-2xl">
            Import financial data from Excel workbooks to populate your dashboard, reports, and receivables. Export clean summaries when you're done.
          </p>
        </section>
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
            <div className="flex flex-col items-center gap-2 py-8 text-stone-700">
              <FileSpreadsheet size={28} strokeWidth={1.5} className="text-green-800" />
              <p className="text-sm font-medium text-stone-900">No imports yet</p>
              <p className="text-xs text-stone-600">Complete an Excel import above to see it here.</p>
            </div>
          ) : (
            <div className="rounded-lg border border-stone-100 overflow-hidden">
              <table className="w-full table-fixed text-left border-collapse">
                <colgroup>
                  <col />
                  <col className="w-[28%]" />
                  <col className="w-[88px]" />
                  <col className="w-[96px]" />
                </colgroup>
                <thead>
                  <tr className="border-b-2 border-green-800/20 bg-green-50">
                    <th className="px-3 py-2.5 text-[10px] uppercase font-bold text-green-900 tracking-wider">File</th>
                    <th className="px-3 py-2.5 text-[10px] uppercase font-bold text-green-900 tracking-wider">Added</th>
                    <th className="px-3 py-2.5 text-[10px] uppercase font-bold text-green-900 tracking-wider">Status</th>
                    <th className="px-3 py-2.5 text-[10px] uppercase font-bold text-green-900 tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody className="text-xs text-stone-900">
                  {recentImports.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-stone-100 last:border-0 hover:bg-green-50/40 transition-colors"
                    >
                      <td className="px-3 py-3 min-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                          <FileSpreadsheet className="h-3.5 w-3.5 text-green-800 shrink-0" />
                          <span className="font-semibold truncate" title={row.fileName}>{row.fileName}</span>
                        </div>
                        <span className="text-[10px] text-stone-600 uppercase font-medium">{row.type}</span>
                      </td>
                      <td className="px-3 py-3 text-stone-700 align-top">
                        {row.rows > 0 ? `${row.rows} new rows` : "No new rows"}
                        {row.duplicateRows > 0 && (
                          <div className="text-[10px] text-stone-600 mt-0.5">{row.duplicateRows} skipped</div>
                        )}
                      </td>
                      <td className="px-3 py-3 align-top">
                        <span className={importStatusTextClass(row.status)}>{row.status}</span>
                      </td>
                      <td className="px-3 py-3 text-stone-700 align-top whitespace-nowrap">{row.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>

        {/* Legacy CSV quick import */}
        <details className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
          <summary className="px-4 sm:px-5 py-4 cursor-pointer list-none flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
            <div>
              <span className="text-[10px] font-bold text-green-800 uppercase tracking-wider">CSV Quick Preview</span>
              <span className="ml-2 text-[10px] font-medium text-stone-600 normal-case">(legacy · CSV only)</span>
            </div>
            <span className="text-xs text-stone-600">For .csv preview only — use Excel Import above for full import</span>
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
                isDragging ? "border-green-500 bg-green-50/50" : "border-stone-200 bg-white"
              )}
            >
              {fileName ? (
                <p className="text-sm font-semibold text-stone-900 break-all px-2">{fileName}</p>
              ) : (
                <>
                  <Upload className="h-5 w-5 text-green-800 mb-2" />
                  <p className="text-sm font-semibold text-stone-900">Drop a CSV file here</p>
                  <p className="text-xs text-stone-600 mt-1 mb-3">or choose a file to preview its contents</p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-green-800 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-green-700 transition-colors"
                  >
                    Choose CSV File
                  </button>
                </>
              )}
            </div>

            {detectedMapping && parsedHeaders.length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-green-800 mb-2">Detected Columns</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {DETECTED_FIELDS.map((field) => (
                    <div key={field} className="flex items-center justify-between rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs">
                      <span className="font-semibold text-stone-800">{getFieldLabel(field)}</span>
                      <span className="text-stone-600 truncate ml-2">{detectedMapping[field] ? `→ ${detectedMapping[field]}` : "—"}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {hasPreview && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-green-800 mb-2">
                  Preview ({parsedRows.length} rows{parsedRows.length > 10 ? ", showing first 10" : ""})
                </p>
                <div className="rounded-lg border border-stone-100 overflow-hidden mb-3">
                  <table className="w-full table-fixed text-left border-collapse">
                    <thead>
                      <tr className="border-b-2 border-green-800/20 bg-green-50">
                        {parsedHeaders.map((header) => (
                          <th key={header} className="px-2 py-2 text-[10px] uppercase font-bold text-green-900 tracking-wider truncate">{header}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="text-xs text-stone-900">
                      {previewRows.map((row, index) => (
                        <tr key={index} className="border-b border-stone-100 last:border-0 hover:bg-green-50/40">
                          {parsedHeaders.map((header) => (
                            <td key={header} className="px-2 py-2 truncate" title={String(row[header] ?? "")}>{row[header] ?? ""}</td>
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
                    className="bg-white text-stone-700 px-4 py-2 rounded-lg text-xs font-bold border border-stone-200 hover:bg-green-50 transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {hasConfirmed && (
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                  <p className="text-xs text-stone-600">
                    {importedRows.length} row{importedRows.length === 1 ? "" : "s"} in session
                    {importedRows.length > 20 ? " (showing first 20)" : ""}
                  </p>
                  <button type="button" onClick={handleExportImported} disabled={importedRows.length === 0}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-green-800 text-white hover:bg-green-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                    <Download className="h-3 w-3" />
                    Export CSV
                  </button>
                </div>
                <div className="rounded-lg border border-stone-100 overflow-hidden">
                  <table className="w-full table-fixed text-left border-collapse">
                    <thead>
                      <tr className="border-b-2 border-green-800/20 bg-green-50">
                        {importedHeaders.map((header) => (
                          <th key={header} className="px-2 py-2 text-[10px] uppercase font-bold text-green-900 tracking-wider truncate">{header}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="text-xs text-stone-900">
                      {importedPreviewRows.map((row, index) => (
                        <tr key={index} className="border-b border-stone-100 last:border-0 hover:bg-green-50/40">
                          {importedHeaders.map((header) => (
                            <td key={header} className="px-2 py-2 truncate" title={String(row[header] ?? "")}>{row[header] ?? ""}</td>
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

        <SectionCard
          title="Export Reports"
          subtitle="Download clean summaries from your imported data."
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {exportOptions.map((option) => (
              <div
                key={option.title}
                className="rounded-lg border border-stone-200 p-4 flex flex-col gap-2 hover:border-green-200 hover:shadow-sm transition-all"
              >
                <p className="text-sm font-bold text-stone-900">{option.title}</p>
                <p className="text-xs text-stone-600 flex-1 leading-relaxed">{option.description}</p>
                <button
                  type="button"
                  onClick={option.handler}
                  disabled={!option.hasData}
                  title={option.hasData ? undefined : "No data available to export"}
                  className="self-start mt-1 inline-flex items-center gap-1.5 border border-green-200 bg-white hover:bg-green-50 text-green-800 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Download className="h-3 w-3" />
                  Export CSV
                </button>
              </div>
            ))}
          </div>
        </SectionCard>
        </div>
      </div>
    </div>
  );
}

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
} from "lucide-react";
import { cn } from "@/lib/utils";
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

const importSteps = [
  { label: "Upload file", step: 1 },
  { label: "Map columns", step: 2 },
  { label: "Review imported rows", step: 3 },
  { label: "Confirm import", step: 4 },
];

const INITIAL_RECENT_IMPORTS = [
  {
    id: "seed-1",
    fileName: "january_transactions.xlsx",
    type: "Excel" as const,
    rows: 248,
    status: "Completed" as const,
    uploadedBy: "Luciano",
    date: "May 17, 2026",
  },
  {
    id: "seed-2",
    fileName: "cattle_expenses.csv",
    type: "CSV" as const,
    rows: 86,
    status: "Completed" as const,
    uploadedBy: "Admin",
    date: "May 14, 2026",
  },
  {
    id: "seed-3",
    fileName: "corn_sales_april.xlsx",
    type: "Excel" as const,
    rows: 132,
    status: "Needs Review" as const,
    uploadedBy: "Accountant",
    date: "May 10, 2026",
  },
];

const exportOptions = [
  {
    title: "Profit & Loss Report",
    description: "Monthly revenue, expenses, and net profit summary.",
  },
  {
    title: "Expense Breakdown",
    description: "Category-level spending across feed, labor, and operations.",
  },
  {
    title: "Revenue Report",
    description: "Sales and income by customer, crop, or time period.",
  },
  {
    title: "Accounts Receivable Report",
    description: "Outstanding invoices, due dates, and overdue balances.",
  },
  {
    title: "Crop Performance Report",
    description: "Yield, cost, and profit per plot and season.",
  },
  {
    title: "Livestock Report",
    description: "Head count, feed costs, and estimated herd value.",
  },
];

const aiBullets = [
  "Detect date, amount, customer, and category columns",
  "Flag missing or unusual values",
  "Suggest expense and revenue categories",
  "Preview data before saving",
];

const PIPELINE_STEPS = ["Upload", "Preview", "Confirm", "Export"] as const;

type ImportStatus = "Completed" | "Needs Review";

interface RecentImport {
  id: string;
  fileName: string;
  type: "CSV" | "Excel";
  rows: number;
  status: ImportStatus;
  uploadedBy: string;
  date: string;
}

function StatusBadge({ status }: { status: ImportStatus }) {
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
  children,
  className,
}: {
  title: string;
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
      <h2 className="text-sm font-bold text-stone-800 uppercase tracking-tight mb-4">
        {title}
      </h2>
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

function getWorkflowProgress(state: {
  hasUpload: boolean;
  hasPreview: boolean;
  hasConfirmed: boolean;
}): number {
  if (state.hasConfirmed) return 4;
  if (state.hasPreview) return 3;
  if (state.hasUpload) return 2;
  return 1;
}

export function ExportImportPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [recentImports, setRecentImports] = useState<RecentImport[]>(INITIAL_RECENT_IMPORTS);
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
  const workflowProgress = getWorkflowProgress({ hasUpload, hasPreview, hasConfirmed });

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
          "For now, please upload a CSV file. Excel support is coming next."
        );
        return;
      }

      if (!isCsvFile(file)) {
        resetUploadState();
        setErrorMessage(
          "For now, please upload a CSV file. Excel support is coming next."
        );
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
    if (file) {
      void processFile(file);
    }
    event.target.value = "";
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (!file) {
      setErrorMessage("No file was selected. Please choose a CSV file.");
      return;
    }
    void processFile(file);
  };

  const handleCancelImport = () => {
    resetUploadState();
    setErrorMessage(null);
    setSuccessMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
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

    const entry: RecentImport = {
      id: `import-${Date.now()}`,
      fileName,
      type: "CSV",
      rows: parsedRows.length,
      status: "Completed",
      uploadedBy: "Luciano",
      date: formatDisplayDate(),
    };

    setRecentImports((prev) => [entry, ...prev]);
    setSuccessMessage(`Imported ${parsedRows.length} rows successfully.`);
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

  const activePipelineIndex = hasConfirmed
    ? 3
    : hasPreview
      ? 1
      : fileName
        ? 0
        : -1;

  return (
    <div className="flex flex-1 flex-col text-[#1C1917] font-sans min-h-0">
      <header className="h-auto min-h-14 bg-white border-b border-stone-200 px-6 sm:px-10 py-4 flex items-center shadow-sm flex-shrink-0">
        <div className="w-full max-w-7xl mx-auto">
          <h1 className="text-lg font-bold text-stone-900 leading-none">Export / Import</h1>
          <p className="text-sm text-stone-500 mt-1.5 max-w-2xl">
            Upload financial data from Excel or CSV, review it, and export clean reports.
          </p>
        </div>
      </header>

      <main className="flex-1 p-6 sm:p-10 max-w-7xl mx-auto w-full space-y-6">
        {(errorMessage || successMessage) && (
          <div className="space-y-2">
            {errorMessage && <MessageBanner variant="error">{errorMessage}</MessageBanner>}
            {successMessage && <MessageBanner variant="success">{successMessage}</MessageBanner>}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-stone-500">
          {PIPELINE_STEPS.map((label, index) => (
            <div key={label} className="flex items-center gap-2">
              <span
                className={cn(
                  "px-2.5 py-1 rounded-full border",
                  index <= activePipelineIndex
                    ? "bg-green-50 text-green-800 border-green-100"
                    : "bg-stone-50 text-stone-400 border-stone-200"
                )}
              >
                {label}
              </span>
              {index < PIPELINE_STEPS.length - 1 && (
                <span className="text-stone-300">→</span>
              )}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SectionCard title="Import Data">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={handleFileInput}
            />
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={cn(
                "border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-center transition-colors",
                fileName ? "p-6 min-h-[120px]" : "p-8",
                isDragging
                  ? "border-green-500 bg-green-50/50"
                  : "border-stone-200 bg-stone-50/80"
              )}
            >
              {fileName ? (
                <p className="text-sm font-semibold text-stone-900 break-all px-2">
                  {fileName}
                </p>
              ) : (
                <>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white border border-stone-200 shadow-sm mb-3">
                    <Upload className="h-5 w-5 text-stone-500" />
                  </div>
                  <p className="text-sm font-semibold text-stone-800">Upload CSV file</p>
                  <p className="text-xs text-stone-500 mt-1 mb-4">
                    Drag and drop your file here, or choose a file from your computer
                  </p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-stone-800 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-stone-700 transition-colors shadow-sm"
                  >
                    Choose File
                  </button>
                  <p className="text-[10px] text-stone-400 mt-3 font-medium uppercase tracking-wide">
                    CSV supported now · .xlsx coming next
                  </p>
                </>
              )}
            </div>
            <p className="text-xs text-stone-500 mt-3 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-green-700 shrink-0" />
              Excel support coming next · AI column mapping coming soon
            </p>
          </SectionCard>

          <SectionCard title="Import Workflow">
            <ol className="space-y-4">
              {importSteps.map(({ label, step }) => {
                const isComplete = step < workflowProgress;
                const isCurrent = step === workflowProgress;
                return (
                  <li key={step} className="flex items-start gap-3">
                    <div
                      className={cn(
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold",
                        isComplete
                          ? "bg-green-700 border-green-700 text-white"
                          : isCurrent
                            ? "bg-white border-green-700 text-green-700"
                            : "bg-white border-stone-200 text-stone-400"
                      )}
                    >
                      {isComplete ? <CheckCircle2 className="h-4 w-4" /> : <span>{step}</span>}
                    </div>
                    <div className="pt-0.5 flex-1">
                      <p
                        className={cn(
                          "text-sm font-semibold",
                          isComplete || isCurrent ? "text-stone-900" : "text-stone-500"
                        )}
                      >
                        {label}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </SectionCard>
        </div>

        {detectedMapping && parsedHeaders.length > 0 && (
          <SectionCard title="Detected Columns">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {DETECTED_FIELDS.map((field) => (
                <div
                  key={field}
                  className="flex items-center justify-between rounded-lg border border-stone-100 bg-stone-50 px-3 py-2 text-xs"
                >
                  <span className="font-bold text-stone-700">{getFieldLabel(field)}</span>
                  <span className="text-stone-500">
                    {detectedMapping[field] ? `→ ${detectedMapping[field]}` : "—"}
                  </span>
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        {hasPreview && (
          <SectionCard title="Upload Preview">
            <div className="overflow-x-auto -mx-1 mb-4">
              <table className="w-full text-left border-collapse min-w-[480px]">
                <thead className="text-[9px] uppercase text-stone-400 font-bold border-b border-stone-100">
                  <tr className="h-8">
                    {parsedHeaders.map((header) => (
                      <th key={header} className="font-bold pr-4 whitespace-nowrap">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="text-[11px] text-stone-800">
                  {previewRows.map((row, index) => (
                    <tr
                      key={index}
                      className="h-10 border-b border-stone-50 last:border-0 hover:bg-stone-50"
                    >
                      {parsedHeaders.map((header) => (
                        <td key={header} className="pr-4 py-2 whitespace-nowrap">
                          {row[header] ?? ""}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {parsedRows.length > 10 && (
              <p className="text-xs text-stone-500 mb-4">
                Showing first 10 of {parsedRows.length} rows.
              </p>
            )}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleConfirmImport}
                className="bg-green-800 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-green-900 transition-colors shadow-sm"
              >
                Confirm Import
              </button>
              <button
                type="button"
                onClick={handleCancelImport}
                className="bg-white text-stone-700 px-4 py-2 rounded-lg text-xs font-bold border border-stone-200 hover:bg-stone-50 transition-colors"
              >
                Cancel Import
              </button>
            </div>
          </SectionCard>
        )}

        {hasConfirmed && (
          <SectionCard title="Imported Data Preview">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <p className="text-xs text-stone-500">
                {importedRows.length} row{importedRows.length === 1 ? "" : "s"} stored in this
                session
                {importedRows.length > 20 ? " (showing first 20)" : ""}
              </p>
              <button
                type="button"
                onClick={handleExportImported}
                disabled={importedRows.length === 0}
                className={cn(
                  "inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-colors shadow-sm",
                  importedRows.length === 0
                    ? "bg-stone-100 text-stone-400 cursor-not-allowed"
                    : "bg-stone-800 text-white hover:bg-stone-700"
                )}
              >
                <Download className="h-3 w-3" />
                Export Imported Data
              </button>
            </div>
            <div className="overflow-x-auto -mx-1">
              <table className="w-full text-left border-collapse min-w-[480px]">
                <thead className="text-[9px] uppercase text-stone-400 font-bold border-b border-stone-100">
                  <tr className="h-8">
                    {importedHeaders.map((header) => (
                      <th key={header} className="font-bold pr-4 whitespace-nowrap">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="text-[11px] text-stone-800">
                  {importedPreviewRows.map((row, index) => (
                    <tr
                      key={index}
                      className="h-10 border-b border-stone-50 last:border-0 hover:bg-stone-50"
                    >
                      {importedHeaders.map((header) => (
                        <td key={header} className="pr-4 py-2 whitespace-nowrap">
                          {row[header] ?? ""}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
 feature/accounts-recievable-ui
=======
            {importedRows.length === 0 && (
              <p className="text-xs text-stone-500 mt-2">No imported data to export yet.</p>
            )}
 main
          </SectionCard>
        )}

        <SectionCard title="Recent Imports">
          <div className="overflow-x-auto -mx-1">
            <table className="w-full text-left border-collapse min-w-[640px]">
              <thead className="text-[9px] uppercase text-stone-400 font-bold border-b border-stone-100">
                <tr className="h-8">
                  <th className="font-bold pr-4">File Name</th>
                  <th className="font-bold pr-4">Type</th>
                  <th className="font-bold pr-4">Rows</th>
                  <th className="font-bold pr-4">Status</th>
                  <th className="font-bold pr-4">Uploaded By</th>
                  <th className="font-bold">Date</th>
                </tr>
              </thead>
              <tbody className="text-[11px] text-stone-800">
                {recentImports.map((row) => (
                  <tr
                    key={row.id}
                    className="h-11 border-b border-stone-50 last:border-0 hover:bg-stone-50 transition-colors"
                  >
                    <td className="pr-4 font-medium flex items-center gap-2 py-2">
                      <FileSpreadsheet className="h-3.5 w-3.5 text-stone-400 shrink-0" />
                      {row.fileName}
                    </td>
                    <td className="pr-4">{row.type}</td>
                    <td className="pr-4">{row.rows}</td>
                    <td className="pr-4">
                      <StatusBadge status={row.status} />
                    </td>
                    <td className="pr-4">{row.uploadedBy}</td>
                    <td>{row.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <SectionCard title="Export Reports" className="xl:col-span-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {exportOptions.map((option) => (
                <div
                  key={option.title}
                  className="rounded-lg border border-stone-200 p-3 flex flex-col gap-2 hover:border-stone-300 transition-colors"
                >
                  <p className="text-sm font-bold text-stone-900">{option.title}</p>
                  <p className="text-xs text-stone-500 flex-1">{option.description}</p>
                  <button
                    type="button"
                    className="self-start mt-1 inline-flex items-center gap-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 px-3 py-1.5 rounded text-xs font-bold transition-colors"
                  >
                    <Download className="h-3 w-3" />
                    Export
                  </button>
                </div>
              ))}
            </div>
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
                  AI will help detect columns, clean messy files, and suggest categories before
                  importing.
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

import { useCallback, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  AlertCircle,
  CheckCircle2,
  FileSpreadsheet,
  Upload,
  Sparkles,
  Loader2,
  X,
  ArrowRight,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { parseWorkbookFile } from "@/domains/import/parseWorkbook";
import {
  applySavedMapping,
  buildDefaultSheetMappings,
  createImportMapping,
  getSheetPreview,
} from "@/domains/import/mapping";
import {
  countMappedARFields,
  filterArAiWarnings,
  normalizeArColumnMap,
} from "@/domains/import/arMapping";
import { runImportFromWorkbook, validateSheetMappings } from "@/domains/import/runImport";
import type { SheetMapping, SheetRole, WorkbookPreview } from "@/domains/import/types";
import {
  AR_FIELD_KEYS,
  AR_FIELD_LABELS,
  AR_REQUIRED_FIELDS,
  CUSTOMER_FIELD_KEYS,
  CUSTOMER_FIELD_LABELS,
  CUSTOMER_REQUIRED_FIELDS,
  EXPENSE_FIELD_KEYS,
  EXPENSE_FIELD_LABELS,
  EXPENSE_REQUIRED_FIELDS,
  SALES_FIELD_KEYS,
  SALES_FIELD_LABELS,
  SALES_REQUIRED_FIELDS,
} from "@/domains/import/types";
import { useAuth } from "@/domains/auth/AuthContext";
import { useFinancialData } from "@/domains/financial/hooks";

const ROLE_OPTIONS: { value: SheetRole; label: string }[] = [
  { value: "sales", label: "Sales" },
  { value: "expenses", label: "Expenses" },
  { value: "accounts-receivable", label: "Accounts Receivable" },
  { value: "customers", label: "Customers" },
  { value: "ignore", label: "Ignore (skip)" },
];

const ROLE_LABELS: Record<SheetRole, string> = {
  sales: "Sales",
  expenses: "Expenses",
  "accounts-receivable": "Accounts Receivable",
  customers: "Customers",
  ignore: "Ignored",
};

const WIZARD_STEPS = [
  { id: 1, label: "Upload file" },
  { id: 2, label: "Map columns" },
  { id: 3, label: "Confirm import" },
] as const;

function WizardStepIndicator({ currentStep }: { currentStep: 1 | 2 | 3 }) {
  return (
    <ol className="flex flex-wrap items-center gap-2 sm:gap-3">
      {WIZARD_STEPS.map((step, index) => {
        const isComplete = step.id < currentStep;
        const isCurrent = step.id === currentStep;
        return (
          <li key={step.id} className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold border",
                  isComplete && "bg-green-700 border-green-700 text-white",
                  isCurrent && "bg-green-50 border-green-600 text-green-800",
                  !isComplete && !isCurrent && "bg-white border-stone-200 text-stone-600"
                )}
              >
                {isComplete ? <CheckCircle2 className="h-3.5 w-3.5" /> : step.id}
              </span>
              <span
                className={cn(
                  "text-[10px] font-bold uppercase tracking-wide",
                  isCurrent ? "text-green-800" : isComplete ? "text-stone-700" : "text-stone-600"
                )}
              >
                {step.label}
              </span>
            </div>
            {index < WIZARD_STEPS.length - 1 && (
              <span className="hidden sm:block h-px w-6 bg-stone-200" aria-hidden />
            )}
          </li>
        );
      })}
    </ol>
  );
}

function FieldMapper({
  title,
  fields,
  labels,
  required,
  headers,
  columnMap,
  onChange,
  aiSuggestedFields,
  showAiBadges = false,
  helperText,
}: {
  title: string;
  fields: readonly string[];
  labels: Record<string, string>;
  required: readonly string[];
  headers: string[];
  columnMap: Record<string, string>;
  onChange: (field: string, column: string) => void;
  aiSuggestedFields?: Set<string>;
  showAiBadges?: boolean;
  helperText?: string;
}) {
  return (
    <div className="space-y-2 border border-stone-200 rounded-lg p-3 bg-white">
      <p className="text-[10px] font-bold uppercase tracking-wider text-green-800">
        {title}
      </p>
      {helperText && (
        <p className="text-[10px] text-stone-600 -mt-1">{helperText}</p>
      )}
      {fields.map((field) => (
        <div key={field} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
          <label className="text-xs text-stone-700 sm:w-28 shrink-0 flex items-center gap-1">
            {labels[field]}
            {required.includes(field) && (
              <span className="text-red-500 ml-0.5">*</span>
            )}
            {showAiBadges && aiSuggestedFields?.has(field) && columnMap[field] && (
              <span className="ml-1 px-1 py-0.5 text-[8px] font-bold bg-green-100 text-green-700 rounded uppercase tracking-wide">AI</span>
            )}
          </label>
          <select
            value={columnMap[field] ?? ""}
            onChange={(e) => onChange(field, e.target.value)}
            className={cn(
              "flex-1 py-1.5 px-2 text-xs border rounded-lg bg-white",
              showAiBadges && aiSuggestedFields?.has(field) && columnMap[field]
                ? "border-green-300 bg-green-50/30"
                : "border-stone-200"
            )}
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
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { primaryCompanyId, isCompanyOwner } = useAuth();
  /** Enhanced upload/confirm flow is for company owners only — superadmin keeps legacy UI. */
  const isEnhancedFlow = isCompanyOwner;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    importMapping,
    importedData,
    applyImportedData,
    clearImportedData,
    usesImportedData,
    dateRange,
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
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importComplete, setImportComplete] = useState(false);

  // AI mapping state
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiSuggested, setAiSuggested] = useState<Record<string, Set<string>>>({});
  const [aiSummaryBySheet, setAiSummaryBySheet] = useState<Record<string, string>>({});
  const [showAiBadges, setShowAiBadges] = useState(false);

  const importDefaultYear = useMemo(() => {
    const fromRange = dateRange?.endDate?.slice(0, 4) ?? dateRange?.startDate?.slice(0, 4);
    const year = fromRange ? Number(fromRange) : new Date().getFullYear();
    return Number.isFinite(year) ? year : new Date().getFullYear();
  }, [dateRange]);

  const activeSheet = useMemo(
    () => (workbook ? getSheetPreview(workbook, selectedSheet) : undefined),
    [workbook, selectedSheet]
  );

  const activeMapping = sheetMappings.find((m) => m.sheetName === selectedSheet);

  const activeSheetMappings = useMemo(
    () => sheetMappings.filter((m) => m.role !== "ignore"),
    [sheetMappings]
  );

  const mappingValidationError = useMemo(
    () => (workbook ? validateSheetMappings(sheetMappings) : null),
    [workbook, sheetMappings]
  );

  const currentWizardStep = useMemo((): 1 | 2 | 3 => {
    if (!workbook) return 1;
    if (importComplete) return 3;
    return 2;
  }, [workbook, importComplete]);

  const dashboardPath = useMemo(() => {
    const companyId = searchParams.get("companyId") ?? primaryCompanyId;
    if (companyId) {
      return `/dashboard?companyId=${encodeURIComponent(companyId)}`;
    }
    return "/dashboard";
  }, [searchParams, primaryCompanyId]);

  const resetUpload = useCallback(() => {
    setFileName(null);
    setFileBuffer(null);
    setWorkbook(null);
    setSheetMappings([]);
    setSelectedSheet("");
    setMappingName("Default company mapping");
    setErrorMessage(null);
    setSuccessMessage(null);
    setImportWarnings([]);
    setAiError(null);
    setAiSuggested({});
    setAiSummaryBySheet({});
    setShowAiBadges(false);
    setImportComplete(false);
    setIsImporting(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const processFile = useCallback(
    async (file: File) => {
      setErrorMessage(null);
      setSuccessMessage(null);
      setImportWarnings([]);
      setAiError(null);
      setAiSuggested({});
      setAiSummaryBySheet({});
      setShowAiBadges(false);
      setImportComplete(false);

      if (!file.name.toLowerCase().endsWith(".xlsx")) {
        setErrorMessage("Please upload an Excel workbook (.xlsx).");
        return;
      }

      if (isEnhancedFlow) setIsProcessingFile(true);
      try {
        const buffer = await file.arrayBuffer();
        const preview = await parseWorkbookFile(file);
        const mappings = applySavedMapping(preview, importMapping);

        setFileName(file.name);
        setFileBuffer(buffer);
        setWorkbook(preview);
        setSheetMappings(
          mappings.map((m) =>
            m.role === "accounts-receivable"
              ? { ...m, columnMap: normalizeArColumnMap(m.columnMap) }
              : m
          )
        );
        setSelectedSheet(preview.sheets[0]?.sheetName ?? "");
        setMappingName(importMapping?.name ?? `${file.name} mapping`);
      } catch (error) {
        resetUpload();
        setErrorMessage(
          error instanceof Error ? error.message : "Could not read the Excel file."
        );
      } finally {
        setIsProcessingFile(false);
      }
    },
    [importMapping, resetUpload, isEnhancedFlow]
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

  const handleAnalyzeWithAI = async () => {
    if (!workbook) return;
    setAiLoading(true);
    setAiError(null);
    setImportWarnings([]);
    setAiSummaryBySheet({});
    setShowAiBadges(false);

    try {
      const payload = {
        importYear: importDefaultYear,
        sheets: workbook.sheets.map((sheet) => ({
          sheetName: sheet.sheetName,
          headers: sheet.headers,
          sampleRows: sheet.previewRows.slice(0, 5),
        })),
      };

      const { data, error } = await supabase.functions.invoke("analyze-import", {
        body: payload,
      });

      if (error || !data?.sheets) {
        setAiError("AI analysis failed — please map columns manually or try again.");
        return;
      }

      // Apply AI suggestions to sheetMappings state
      const newSuggested: Record<string, Set<string>> = {};
      const newSummaries: Record<string, string> = {};
      const collectedWarnings: string[] = [];

      setSheetMappings((prev) =>
        prev.map((mapping) => {
          const suggestion = (data.sheets as {
            sheetName: string;
            role: SheetRole;
            mappings: Record<string, string>;
            warnings?: string[];
          }[]).find((s) => s.sheetName === mapping.sheetName);
          if (!suggestion) return mapping;

          const role = suggestion.role ?? mapping.role;
          const mergedMap =
            role === "accounts-receivable"
              ? normalizeArColumnMap({
                  ...mapping.columnMap,
                  ...(suggestion.mappings ?? {}),
                })
              : { ...mapping.columnMap, ...(suggestion.mappings ?? {}) };

          newSuggested[mapping.sheetName] = new Set(Object.keys(mergedMap));

          if (suggestion.warnings?.length) {
            const filtered =
              role === "accounts-receivable"
                ? filterArAiWarnings(suggestion.warnings)
                : suggestion.warnings;
            collectedWarnings.push(...filtered);
          }

          if (role === "accounts-receivable") {
            const mappedCount = countMappedARFields(mergedMap);
            if (mappedCount >= 3) {
              newSummaries[mapping.sheetName] =
                `AI mapped ${mappedCount} of ${AR_FIELD_KEYS.length} columns. Review and confirm.`;
            }
          }

          return {
            ...mapping,
            role,
            columnMap: mergedMap,
          };
        })
      );

      setAiSuggested(newSuggested);
      setAiSummaryBySheet(newSummaries);
      setShowAiBadges(Object.keys(newSummaries).length > 0);
      if (collectedWarnings.length > 0) {
        setImportWarnings(collectedWarnings);
      }

      // Auto-select first non-ignore sheet
      const firstMapped = workbook.sheets.find((s) => {
        const suggestion = (data.sheets as { sheetName: string; role: string }[]).find((d) => d.sheetName === s.sheetName);
        return suggestion?.role !== "ignore";
      });
      if (firstMapped) setSelectedSheet(firstMapped.sheetName);
    } catch (err) {
      setAiError("AI analysis failed — please map columns manually or try again.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleImport = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setImportWarnings([]);
    setImportComplete(false);

    if (!fileBuffer || !fileName) {
      setErrorMessage("Upload an Excel file first.");
      return;
    }

    if (mappingValidationError) {
      setErrorMessage(mappingValidationError);
      return;
    }

    if (isEnhancedFlow) setIsImporting(true);
    try {
      const result = runImportFromWorkbook(fileBuffer, sheetMappings, fileName, {
        defaultYear: importDefaultYear,
      });
      if (
        result.salesCount === 0 &&
        result.expensesCount === 0 &&
        result.arCount === 0 &&
        result.customerCount === 0
      ) {
        setErrorMessage(
          "No valid rows were imported. Check your column mappings and try again."
        );
        setImportWarnings(result.warnings.slice(0, 10));
        return;
      }

      const mapping = createImportMapping(
        mappingName.trim() || "Company mapping",
        sheetMappings
      );
      const mergeResult = applyImportedData(result.data, mapping, {
        fileName,
        salesRows: result.salesCount,
        expenseRows: result.expensesCount,
        skippedRows: result.skipped,
        warningCount: result.warnings.length,
      });
      setImportWarnings(result.warnings.slice(0, 15));
      const addedSales = mergeResult.newSalesCount;
      const addedExpenses = mergeResult.newExpenseCount;
      const addedAr = mergeResult.newArCount;
      const addedCustomers = mergeResult.newCustomerCount;
      const duplicates =
        mergeResult.duplicateSalesCount +
        mergeResult.duplicateExpenseCount +
        mergeResult.duplicateArCount +
        mergeResult.duplicateCustomerCount;
      const totalSales = mergeResult.merged.sales.length;
      const totalExpenses = mergeResult.merged.expenses.length;
      const totalAr = mergeResult.merged.arReceivables.length;
      const totalCustomers = mergeResult.merged.customers.length;
      const parts = [];
      if (addedSales > 0) parts.push(`${addedSales} sales`);
      if (addedExpenses > 0) parts.push(`${addedExpenses} expense`);
      if (addedAr > 0) parts.push(`${addedAr} AR`);
      if (addedCustomers > 0) parts.push(`${addedCustomers} customer`);
      const addedStr =
        parts.length > 0 ? `Added ${parts.join(", ")} rows` : "No new rows added";
      const totals = [
        `${totalSales} sales`,
        `${totalExpenses} expenses`,
        `${totalAr} AR`,
        `${totalCustomers} customers`,
      ].join(", ");
      setSuccessMessage(
        addedStr +
          (duplicates > 0 ? ` (${duplicates} duplicates skipped).` : ".") +
          ` Active dataset: ${totals}.` +
          (result.skipped > 0 ? ` ${result.skipped} rows skipped in file.` : "")
      );
      if (isEnhancedFlow) {
        setImportComplete(true);
      }
    } finally {
      if (isEnhancedFlow) setIsImporting(false);
    }
  };

  return (
    <section className="bg-white rounded-xl border border-stone-200 shadow-sm p-4 sm:p-5 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h2 className="text-[10px] font-bold text-green-800 uppercase tracking-wider">
            Import from Excel Workbook
          </h2>
          <p className="text-xs text-stone-700 mt-1 max-w-2xl">
            Upload an .xlsx file, assign each sheet a role (Sales, Expenses, or Accounts Receivable),
            map the columns, and import. Column mappings are saved locally so re-importing the same format is instant.
          </p>
        </div>
        {usesImportedData && importedData && (
          <div className="shrink-0 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-800">
            <p className="font-semibold text-green-900">Data active</p>
            <p className="mt-0.5 text-green-700">
              {[
                importedData.sales.length > 0 && `${importedData.sales.length} sales`,
                importedData.expenses.length > 0 && `${importedData.expenses.length} expenses`,
                importedData.arReceivables.length > 0 && `${importedData.arReceivables.length} AR`,
                importedData.customers.length > 0 && `${importedData.customers.length} customers`,
              ].filter(Boolean).join(" · ")}
            </p>
          </div>
        )}
      </div>

      {isEnhancedFlow && <WizardStepIndicator currentStep={currentWizardStep} />}

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
          "border-2 border-dashed rounded-xl text-center transition-colors",
          workbook ? "p-4" : "p-8 sm:p-10",
          isDragging
            ? "border-green-500 bg-green-50/50"
            : workbook && isEnhancedFlow
              ? "border-green-300 bg-green-50/30"
              : "border-stone-200 bg-white"
        )}
      >
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
        {isEnhancedFlow && isProcessingFile ? (
          <div className="flex flex-col items-center gap-3 py-2">
            <Loader2 className="h-7 w-7 text-green-700 animate-spin" />
            <p className="text-sm font-semibold text-stone-700">Reading your Excel file…</p>
            <p className="text-xs text-stone-600">Detecting sheets and column headers</p>
          </div>
        ) : workbook && fileName ? (
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {isEnhancedFlow ? (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100 border border-green-200">
                  <CheckCircle2 className="h-5 w-5 text-green-700" />
                </div>
              ) : (
                <FileSpreadsheet className="h-6 w-6 text-green-700 shrink-0" />
              )}
              <div className="min-w-0 text-left">
                <p className="text-sm font-semibold text-stone-900 truncate">{fileName}</p>
                <p
                  className={cn(
                    "text-xs",
                    isEnhancedFlow ? "text-green-700 font-medium" : "text-stone-600"
                  )}
                >
                  {isEnhancedFlow ? "Uploaded successfully · " : ""}
                  {workbook.sheets.length} sheet
                  {workbook.sheets.length !== 1 ? "s" : ""} detected
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 text-xs font-bold border border-stone-200 rounded-lg text-stone-700 hover:bg-green-50 transition-colors"
              >
                Change file
              </button>
              {isEnhancedFlow && (
                <button
                  type="button"
                  onClick={resetUpload}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold border border-stone-200 rounded-lg text-stone-700 hover:bg-green-50 transition-colors"
                  title="Remove file and start over"
                >
                  <X className="h-3 w-3" />
                  Remove
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            <FileSpreadsheet className="h-8 w-8 text-green-800 mx-auto mb-3" />
            <p className="text-sm font-semibold text-stone-900 mb-1">
              Drag and drop an Excel file here
            </p>
            <p className="text-xs text-stone-600 mb-4">or choose a file from your computer</p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold bg-green-700 text-white rounded-lg hover:bg-green-800 transition-colors"
            >
              <Upload className="h-3.5 w-3.5" />
              Choose .xlsx file
            </button>
            <p className="text-[10px] text-stone-600 mt-3">Excel 2007+ (.xlsx) supported</p>
          </>
        )}
      </div>

      {isEnhancedFlow && workbook && fileName && !isProcessingFile && !importComplete && (
        <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
          <CheckCircle2 className="h-5 w-5 text-green-700 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-green-900">File ready for import</p>
            <p className="text-xs text-green-800 mt-0.5">
              <span className="font-medium">{fileName}</span> was loaded. Assign a role to each sheet,
              map the columns, then click <span className="font-semibold">Confirm & Import</span> at
              the bottom to add the data to your dashboard.
            </p>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-start gap-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-800">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && !isEnhancedFlow && (
        <div className="flex items-start gap-2 rounded-lg border border-green-100 bg-green-50 px-3 py-2 text-sm text-green-800">
          <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{successMessage}</span>
        </div>
      )}

      {importComplete && successMessage && isEnhancedFlow && (
        <div className="rounded-xl border-2 border-green-300 bg-green-50 px-4 py-4 space-y-3">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100 border border-green-200">
              <CheckCircle2 className="h-5 w-5 text-green-700" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-green-900">Import confirmed — data added successfully</p>
              <p className="text-xs text-green-800 mt-1">{successMessage}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 pl-[52px]">
            <button
              type="button"
              onClick={() => navigate(dashboardPath)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-green-700 text-white rounded-lg hover:bg-green-800 transition-colors shadow-sm"
            >
              View Dashboard
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={resetUpload}
              className="px-4 py-2 text-xs font-bold border border-green-200 rounded-lg text-green-800 bg-white hover:bg-green-100 transition-colors"
            >
              Import another file
            </button>
          </div>
        </div>
      )}

      {importWarnings.length > 0 && (
        <div className="rounded-lg border border-amber-100 bg-amber-50 px-3 py-2.5 text-xs text-amber-900 space-y-1 max-h-40 overflow-y-auto">
          <p className="font-bold uppercase tracking-wide text-amber-700">
            {importWarnings.length} note{importWarnings.length !== 1 ? "s" : ""}
            {importWarnings.some((w) => w.includes("row ") && w.includes("skipped"))
              ? " — some rows were skipped"
              : " — review before importing"}
          </p>
          {importWarnings.map((w) => (
            <p key={w} className="text-amber-800">{w}</p>
          ))}
        </div>
      )}

      {workbook && workbook.sheets.length > 0 && (!isEnhancedFlow || !importComplete) && (
        <div className="flex items-center justify-between gap-3 border border-stone-200 rounded-lg px-4 py-3 bg-white">
          <div>
            <p className="text-xs font-semibold text-stone-900">
              {workbook.sheets.length} sheet{workbook.sheets.length !== 1 ? "s" : ""} detected
            </p>
            <p className="text-[10px] text-stone-600 mt-0.5">
              Assign roles and map columns manually, or let AI do it for you.
            </p>
          </div>
          <div className="flex flex-col gap-1.5 items-end">
            <button
              type="button"
              onClick={handleAnalyzeWithAI}
              disabled={aiLoading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-800 text-white text-xs font-bold hover:bg-green-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
            >
              {aiLoading ? (
                <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Analyzing…</>
              ) : (
                <><Sparkles className="h-3.5 w-3.5" /> Analyze with AI</>
              )}
            </button>
            {aiError && (
              <p className="text-[10px] text-red-600 max-w-[220px] text-right">{aiError}</p>
            )}
          </div>
        </div>
      )}

      {workbook && workbook.sheets.length > 0 && (!isEnhancedFlow || !importComplete) && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-4 space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-green-800">
              Sheets ({workbook.sheets.length})
            </p>
            <ul className="space-y-1 max-h-48 overflow-y-auto border border-stone-200 rounded-lg p-1 bg-white">
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
                          ? "bg-green-800 text-white font-semibold"
                          : "hover:bg-green-50/60 text-stone-700"
                      )}
                    >
                      {sheet.sheetName}
                      {mapping && mapping.role !== "ignore" && (
                        <span className={cn(
                          "block text-[10px] mt-0.5",
                          selectedSheet === sheet.sheetName ? "text-green-100" : "text-stone-600"
                        )}>
                          {ROLE_LABELS[mapping.role] ?? mapping.role}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>

            {activeMapping && (
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-green-800">
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
                  <p className="text-[10px] font-bold uppercase tracking-wider text-green-800 mb-2">
                    Preview — {activeSheet.sheetName}
                  </p>
                  {activeSheet.headers.length === 0 ? (
                    <p className="text-sm text-stone-600">This sheet has no headers.</p>
                  ) : (
                    <div className="border border-stone-100 rounded-lg overflow-hidden">
                      <table className="w-full table-fixed text-xs">
                        <thead>
                          <tr className="border-b-2 border-stone-200 bg-stone-50">
                            {activeSheet.headers.map((h) => (
                              <th
                                key={h}
                                className="px-2 py-2 text-left text-[10px] uppercase font-bold text-stone-800 tracking-wider truncate"
                              >
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="text-stone-900">
                          {activeSheet.previewRows.map((row, i) => (
                            <tr key={i} className="border-b border-stone-100 last:border-0 hover:bg-stone-50/80">
                              {activeSheet.headers.map((h) => (
                                <td
                                  key={h}
                                  className="px-2 py-2 truncate"
                                  title={String(row[h] ?? "")}
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
                    onChange={(field, col) => updateColumnMap(selectedSheet, field, col)}
                    aiSuggestedFields={aiSuggested[selectedSheet]}
                    showAiBadges={showAiBadges}
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
                    onChange={(field, col) => updateColumnMap(selectedSheet, field, col)}
                    aiSuggestedFields={aiSuggested[selectedSheet]}
                    showAiBadges={showAiBadges}
                  />
                )}

                {activeMapping.role === "accounts-receivable" && (
                  <>
                    {aiSummaryBySheet[selectedSheet] && (
                      <p className="text-xs text-green-800 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
                        {aiSummaryBySheet[selectedSheet]}
                      </p>
                    )}
                    <FieldMapper
                      title="Map accounts receivable columns"
                      fields={AR_FIELD_KEYS}
                      labels={AR_FIELD_LABELS}
                      required={AR_REQUIRED_FIELDS}
                      headers={activeSheet.headers}
                      columnMap={activeMapping.columnMap}
                      onChange={(field, col) => updateColumnMap(selectedSheet, field, col)}
                      aiSuggestedFields={aiSuggested[selectedSheet]}
                      showAiBadges={showAiBadges}
                      helperText="Due Date or Invoice Date is required. Invoice Date is optional when Due Date is mapped."
                    />
                  </>
                )}

                {activeMapping.role === "customers" && (
                  <FieldMapper
                    title="Map customer columns"
                    fields={CUSTOMER_FIELD_KEYS}
                    labels={CUSTOMER_FIELD_LABELS}
                    required={CUSTOMER_REQUIRED_FIELDS}
                    headers={activeSheet.headers}
                    columnMap={activeMapping.columnMap}
                    onChange={(field, col) => updateColumnMap(selectedSheet, field, col)}
                    aiSuggestedFields={aiSuggested[selectedSheet]}
                    showAiBadges={showAiBadges}
                  />
                )}

                {activeMapping.role === "ignore" && (
                  <p className="text-sm text-stone-600">
                    This sheet will be skipped during import.
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {workbook && isEnhancedFlow && !importComplete && (
        <div className="border-t border-stone-100 pt-4 space-y-4">
          <div
            className={cn(
              "rounded-xl border-2 p-4 space-y-4",
              mappingValidationError
                ? "border-amber-200 bg-amber-50/40"
                : "border-green-200 bg-green-50/30"
            )}
          >
            <div>
              <p className="text-sm font-bold text-stone-900">Confirm import</p>
              <p className="text-xs text-stone-700 mt-1">
                Review the summary below. When everything looks right, confirm to add this file to your
                active dataset.
              </p>
            </div>

            <div className="rounded-lg border border-stone-200 bg-white px-3 py-2.5 space-y-1.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-green-800">
                Sheets to import
              </p>
              {activeSheetMappings.length === 0 ? (
                <p className="text-xs text-amber-800">
                  No sheets assigned yet — choose a role for at least one sheet above.
                </p>
              ) : (
                <ul className="space-y-1">
                  {activeSheetMappings.map((mapping) => (
                    <li
                      key={mapping.sheetName}
                      className="flex items-center justify-between gap-2 text-xs text-stone-700"
                    >
                      <span className="font-medium truncate">{mapping.sheetName}</span>
                      <span className="shrink-0 text-[10px] font-semibold text-green-800">
                        {ROLE_LABELS[mapping.role]}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              {sheetMappings.some((m) => m.role === "ignore") && (
                <p className="text-[10px] text-stone-600 pt-1">
                  {sheetMappings.filter((m) => m.role === "ignore").length} sheet
                  {sheetMappings.filter((m) => m.role === "ignore").length !== 1 ? "s" : ""} will be
                  skipped
                </p>
              )}
            </div>

            {mappingValidationError ? (
              <div className="flex items-start gap-2 text-xs text-amber-900">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{mappingValidationError}</span>
              </div>
            ) : (
              <div className="flex items-start gap-2 text-xs text-green-800">
                <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                <span>All required column mappings are set — ready to confirm.</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-end gap-3">
              <div className="flex-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-green-800">
                  Mapping name{" "}
                  <span className="normal-case font-normal text-stone-600">(saved locally for re-use)</span>
                </label>
                <input
                  type="text"
                  value={mappingName}
                  onChange={(e) => setMappingName(e.target.value)}
                  className="mt-1 w-full py-2 px-3 text-xs border border-stone-200 rounded-lg bg-white focus:outline-none focus:border-green-700 transition-colors"
                />
              </div>
              <div className="flex flex-wrap gap-2 shrink-0">
                <button
                  type="button"
                  onClick={resetUpload}
                  disabled={isImporting}
                  className="px-4 py-2 text-xs font-bold border border-stone-200 rounded-lg text-stone-700 bg-white hover:bg-green-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                {usesImportedData && (
                  <button
                    type="button"
                    onClick={() => {
                      clearImportedData();
                      setErrorMessage(null);
                      setImportComplete(false);
                      setSuccessMessage("Import cleared. Financial pages are now empty.");
                    }}
                    disabled={isImporting}
                    className="px-4 py-2 text-xs font-bold border border-stone-200 rounded-lg text-stone-700 bg-white hover:bg-green-50 transition-colors disabled:opacity-50"
                  >
                    Clear all data
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => void handleImport()}
                  disabled={!!mappingValidationError || isImporting}
                  className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold bg-green-700 text-white rounded-lg hover:bg-green-800 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Importing…
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Confirm & Import
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {workbook && !isEnhancedFlow && (
        <div className="border-t border-stone-100 pt-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-end gap-3">
            <div className="flex-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-green-800">
                Mapping name{" "}
                <span className="normal-case font-normal text-stone-600">(saved locally for re-use)</span>
              </label>
              <input
                type="text"
                value={mappingName}
                onChange={(e) => setMappingName(e.target.value)}
                className="mt-1 w-full py-2 px-3 text-xs border border-stone-200 rounded-lg focus:outline-none focus:border-green-700 transition-colors"
              />
            </div>
            <div className="flex gap-2 shrink-0">
              {usesImportedData && (
                <button
                  type="button"
                  onClick={() => {
                    clearImportedData();
                    setSuccessMessage(null);
                    setErrorMessage(null);
                    setSuccessMessage("Import cleared. Dashboard is now showing demo data.");
                  }}
                  className="px-4 py-2 text-xs font-bold border border-stone-200 rounded-lg text-stone-700 hover:bg-green-50 transition-colors"
                >
                  Clear import
                </button>
              )}
              <button
                type="button"
                onClick={() => void handleImport()}
                className="px-5 py-2 text-xs font-bold bg-green-700 text-white rounded-lg hover:bg-green-800 transition-colors shadow-sm"
              >
                Import now
              </button>
            </div>
          </div>
          <p className="text-[10px] text-stone-600">
            Sheet roles:{" "}
            <span className="text-stone-700 font-medium">
              Sales, Expenses, Accounts Receivable, Customers
            </span>{" "}
            — assign each sheet before importing.
          </p>
        </div>
      )}
    </section>
  );
}

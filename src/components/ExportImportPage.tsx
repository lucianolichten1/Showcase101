import type { ReactNode } from "react";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  Circle,
  Download,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

const importSteps = [
  { label: "Upload file", step: 1 },
  { label: "Map columns", step: 2 },
  { label: "Review imported rows", step: 3 },
  { label: "Confirm import", step: 4 },
];

const recentImports = [
  {
    fileName: "january_transactions.xlsx",
    type: "Excel",
    rows: 248,
    status: "Completed" as const,
    uploadedBy: "Luciano",
    date: "May 17, 2026",
  },
  {
    fileName: "cattle_expenses.csv",
    type: "CSV",
    rows: 86,
    status: "Completed" as const,
    uploadedBy: "Admin",
    date: "May 14, 2026",
  },
  {
    fileName: "corn_sales_april.xlsx",
    type: "Excel",
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

function StatusBadge({ status }: { status: "Completed" | "Needs Review" }) {
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

export function ExportImportPage() {
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SectionCard title="Import Data">
            <div className="border-2 border-dashed border-stone-200 rounded-xl bg-stone-50/80 p-8 flex flex-col items-center justify-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white border border-stone-200 shadow-sm mb-3">
                <Upload className="h-5 w-5 text-stone-500" />
              </div>
              <p className="text-sm font-semibold text-stone-800">Upload Excel or CSV</p>
              <p className="text-xs text-stone-500 mt-1 mb-4">
                Drag and drop your file here, or choose a file from your computer
              </p>
              <button
                type="button"
                className="bg-stone-800 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-stone-700 transition-colors shadow-sm"
              >
                Choose File
              </button>
              <p className="text-[10px] text-stone-400 mt-3 font-medium uppercase tracking-wide">
                Supported formats: .xlsx, .csv
              </p>
            </div>
            <p className="text-xs text-stone-500 mt-3 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-green-700 shrink-0" />
              AI column mapping coming soon
            </p>
          </SectionCard>

          <SectionCard title="Import Workflow">
            <ol className="space-y-4">
              {importSteps.map(({ label, step }, index) => {
                const isComplete = step <= 1;
                const isCurrent = step === 2;
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
                      {isComplete ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <span>{step}</span>
                      )}
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
                      {index < importSteps.length - 1 && (
                        <div className="mt-3 ml-3.5 h-4 border-l border-stone-200" />
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          </SectionCard>
        </div>

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
                    key={row.fileName}
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

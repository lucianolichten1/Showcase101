import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useCompanyScopedFinancialData } from "@/domains/company/useCompanyScopedFinancialData";
import {
  getReceivableBalance,
  isActiveReceivable,
} from "@/domains/financial/calculations";
import { formatCurrency } from "@/data/mockData";
import type { ReceivableRecord } from "@/domains/financial/types";

interface AgingBucket {
  label: string;
  color: string;
  matches: (record: ReceivableRecord) => boolean;
}

const AGING_BUCKETS: AgingBucket[] = [
  {
    label: "Not due",
    color: "#16a34a",
    matches: (r) => r.status !== "Overdue",
  },
  {
    label: "1–30 days",
    color: "#eab308",
    matches: (r) => r.status === "Overdue" && r.overdueDays <= 30,
  },
  {
    label: "31–60 days",
    color: "#f97316",
    matches: (r) => r.status === "Overdue" && r.overdueDays > 30 && r.overdueDays <= 60,
  },
  {
    label: "60+ days",
    color: "#dc2626",
    matches: (r) => r.status === "Overdue" && r.overdueDays > 60,
  },
];

interface AgingRow {
  bucket: string;
  amount: number;
  invoices: number;
  color: string;
}

interface AgingTooltipProps {
  active?: boolean;
  payload?: { payload: AgingRow }[];
}

function AgingTooltip({ active, payload }: AgingTooltipProps) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div className="rounded-lg border border-stone-200 bg-white px-3 py-2 shadow-sm text-xs">
      <p className="font-bold text-stone-900">{row.bucket}</p>
      <p className="text-stone-600 mt-0.5 tabular-nums">{formatCurrency(row.amount)}</p>
      <p className="text-stone-600 mt-0.5">
        {row.invoices} {row.invoices === 1 ? "invoice" : "invoices"}
      </p>
    </div>
  );
}

export function ReceivablesAgingChart() {
  const { receivableRecords, usesImportedData } = useCompanyScopedFinancialData();

  const data = useMemo((): AgingRow[] => {
    const open = receivableRecords.filter(isActiveReceivable);
    return AGING_BUCKETS.map(({ label, color, matches }) => {
      const bucketRecords = open.filter(matches);
      return {
        bucket: label,
        amount: bucketRecords.reduce((sum, r) => sum + getReceivableBalance(r), 0),
        invoices: bucketRecords.length,
        color,
      };
    });
  }, [receivableRecords]);

  const hasData = usesImportedData && data.some((row) => row.amount > 0);

  return (
    <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-4 sm:p-5 flex flex-col w-full">
      <h3 className="text-sm font-bold text-stone-900 uppercase tracking-tight mb-1">
        Receivables Aging
      </h3>
      <p className="text-xs text-stone-700 mb-4">
        Outstanding balance grouped by days overdue
      </p>
      <div className="w-full h-[220px]">
        {!hasData ? (
          <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-stone-200 bg-stone-50/50">
            <p className="text-sm text-stone-600 text-center px-4">
              {usesImportedData
                ? "No outstanding invoices."
                : "Import an Excel workbook with an AR sheet to see invoice aging."}
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              barSize={40}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f4" />
              <XAxis
                dataKey="bucket"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#1c1917", fontSize: 11, fontWeight: 600 }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#57534e", fontSize: 10, fontWeight: 500 }}
                tickFormatter={(val) => `Bs ${val / 1000}k`}
                dx={-10}
              />
              <Tooltip content={<AgingTooltip />} cursor={{ fill: "#f5f5f4" }} />
              <Bar dataKey="amount" name="Outstanding" radius={[4, 4, 0, 0]}>
                {data.map((row, index) => (
                  <Cell key={index} fill={row.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

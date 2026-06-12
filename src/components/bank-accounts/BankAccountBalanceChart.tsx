import { useMemo } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency } from "@/data/mockData";
import type { BankTransactionRecord } from "@/domains/financial/bank-accounts/types";
import { BANK_ACCOUNT_DETAIL_COPY } from "@/domains/financial/bank-accounts/labels";

const BALANCE_COLOR = "#15803d";

interface Props {
  transactions: BankTransactionRecord[];
}

function formatDisplayDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");
  const months = [
    "ene", "feb", "mar", "abr", "may", "jun",
    "jul", "ago", "sep", "oct", "nov", "dic",
  ];
  const m = parseInt(month, 10) - 1;
  return `${parseInt(day, 10)} ${months[m] ?? month} ${year}`;
}

export function BankAccountBalanceChart({ transactions }: Props) {
  const data = useMemo(() => {
    const chronological = [...transactions].sort((a, b) => {
      const dateCmp = a.date.localeCompare(b.date);
      if (dateCmp !== 0) return dateCmp;
      return a.createdAt.localeCompare(b.createdAt);
    });
    return chronological.map((tx) => ({
      date: formatDisplayDate(tx.date),
      balance: tx.runningBalance,
    }));
  }, [transactions]);

  const hasData = data.length > 0;

  return (
    <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5">
      <div className="mb-4">
        <h3 className="text-sm font-bold text-stone-800 uppercase tracking-tight">
          {BANK_ACCOUNT_DETAIL_COPY.balanceChart}
        </h3>
      </div>
      <div className="w-full h-[220px]">
        {!hasData ? (
          <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-stone-200 bg-stone-50/50">
            <p className="text-sm text-stone-600">{BANK_ACCOUNT_DETAIL_COPY.noTransactions}</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f4" />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#57534e", fontSize: 10 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#57534e", fontSize: 10 }}
                tickFormatter={(val) => `Bs ${val / 1000}k`}
              />
              <Tooltip
                formatter={(value: number) => [formatCurrency(value), "Saldo"]}
                contentStyle={{ fontSize: 12 }}
              />
              <Line
                type="monotone"
                dataKey="balance"
                stroke={BALANCE_COLOR}
                strokeWidth={2}
                dot={{ r: 3, fill: BALANCE_COLOR }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

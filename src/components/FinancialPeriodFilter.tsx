import { useEffect, useState } from "react";
import {
  getFinancialPeriodMode,
  monthInputValueFromPeriod,
  periodFromModeAndMonth,
  type FinancialPeriod,
  type FinancialPeriodMode,
} from "@/domains/financial/period";

interface FinancialPeriodFilterProps {
  period: FinancialPeriod;
  onPeriodChange: (period: FinancialPeriod) => void;
  id?: string;
  className?: string;
}

export function FinancialPeriodFilter({
  period,
  onPeriodChange,
  id = "financial-period",
  className,
}: FinancialPeriodFilterProps) {
  const mode = getFinancialPeriodMode(period);
  const [monthValue, setMonthValue] = useState(() => monthInputValueFromPeriod(period));

  useEffect(() => {
    if (period.kind === "month") {
      setMonthValue(monthInputValueFromPeriod(period));
    }
  }, [period]);

  const applyMode = (nextMode: FinancialPeriodMode) => {
    if (nextMode === "month") {
      onPeriodChange(periodFromModeAndMonth("month", monthValue));
    } else {
      onPeriodChange(periodFromModeAndMonth(nextMode));
    }
  };

  const handleMonthInput = (value: string) => {
    setMonthValue(value);
    onPeriodChange(periodFromModeAndMonth("month", value));
  };

  return (
    <div className={className}>
      <label
        htmlFor={`${id}-mode`}
        className="block text-[10px] font-bold uppercase tracking-wide text-stone-500 mb-1"
      >
        Period
      </label>
      <div className="flex flex-col sm:flex-row gap-2">
        <select
          id={`${id}-mode`}
          value={mode}
          onChange={(e) => applyMode(e.target.value as FinancialPeriodMode)}
          className="w-full sm:min-w-[8.5rem] py-2 px-3 text-xs border border-stone-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-green-700"
        >
          <option value="all">All records</option>
          <option value="ytd">Year to date</option>
          <option value="month">Month</option>
        </select>
        {mode === "month" && (
          <input
            id={`${id}-month`}
            type="month"
            value={monthValue}
            onChange={(e) => handleMonthInput(e.target.value)}
            className="w-full sm:min-w-[9rem] py-2 px-3 text-xs border border-stone-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-green-700"
            aria-label="Select month and year"
          />
        )}
      </div>
    </div>
  );
}

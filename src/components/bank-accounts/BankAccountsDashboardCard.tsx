import { Link, useSearchParams } from "react-router-dom";
import { Building2 } from "lucide-react";
import { useCompanyScopedFinancialData } from "@/domains/company/useCompanyScopedFinancialData";
import { DASHBOARD_BANK_ACCOUNTS_COPY } from "@/domains/financial/bank-accounts/labels";
import {
  formatBalanceWithCurrency,
  sumBalancesByCurrency,
} from "@/domains/financial/bank-accounts/bankAccountSyncLogic";

export function BankAccountsDashboardCard() {
  const { bankAccounts } = useCompanyScopedFinancialData();
  const [searchParams] = useSearchParams();
  const companyQuery = searchParams.get("companyId");
  const querySuffix = companyQuery ? `?companyId=${encodeURIComponent(companyQuery)}` : "";

  const activeAccounts = bankAccounts.filter((a) => a.active);
  const cashTotals = sumBalancesByCurrency(activeAccounts);

  return (
    <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-50 text-green-800">
            <Building2 className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-stone-800 uppercase tracking-tight">
              {DASHBOARD_BANK_ACCOUNTS_COPY.title}
            </h3>
            <p className="text-xs text-stone-600 mt-0.5">
              {DASHBOARD_BANK_ACCOUNTS_COPY.totalCash}:{" "}
              {cashTotals.length === 0
                ? "—"
                : cashTotals
                    .map((row) => formatBalanceWithCurrency(row.total, row.currency))
                    .join(" · ")}
            </p>
          </div>
        </div>
        <Link
          to={`/accounts${querySuffix}`}
          className="text-xs font-bold text-green-800 hover:text-green-900 shrink-0"
        >
          {DASHBOARD_BANK_ACCOUNTS_COPY.viewAll} →
        </Link>
      </div>

      {activeAccounts.length === 0 ? (
        <p className="text-sm text-stone-600">{DASHBOARD_BANK_ACCOUNTS_COPY.noAccounts}</p>
      ) : (
        <ul className="space-y-2">
          {activeAccounts.map((account) => (
            <li
              key={account.id}
              className="flex items-center justify-between gap-3 text-xs border-b border-stone-100 pb-2 last:border-0 last:pb-0"
            >
              <Link
                to={`/accounts/${account.id}${querySuffix}`}
                className="font-semibold text-stone-800 hover:text-green-800 truncate"
              >
                {account.accountName}
              </Link>
              <span className="font-bold tabular-nums text-stone-900 shrink-0">
                {formatBalanceWithCurrency(account.currentBalance, account.currency)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

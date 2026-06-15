import { useCallback, useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowLeftRight, Plus } from "lucide-react";
import { formatBalanceWithCurrency } from "@/domains/financial/bank-accounts/bankAccountSyncLogic";
import { BankAccountBalanceChart } from "@/components/bank-accounts/BankAccountBalanceChart";
import { ManualTransactionDialog } from "@/components/bank-accounts/ManualTransactionDialog";
import { TransferDialog } from "@/components/bank-accounts/TransferDialog";
import { useCompanyScopedFinancialData } from "@/domains/company/useCompanyScopedFinancialData";
import type { BankTransactionRecord } from "@/domains/financial/bank-accounts/types";
import {
  BANK_ACCOUNT_DETAIL_COPY,
  bankAccountTypeLabel,
  bankTransactionSourceLabel,
  bankTransactionTypeLabel,
  maskAccountNumber,
} from "@/domains/financial/bank-accounts/labels";
import { useSupabaseRealtimeRefresh } from "@/lib/useSupabaseRealtimeRefresh";
import { isSupabaseConfigured } from "@/lib/supabase";
import { cn } from "@/lib/utils";

function formatDisplayDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");
  const months = [
    "ene", "feb", "mar", "abr", "may", "jun",
    "jul", "ago", "sep", "oct", "nov", "dic",
  ];
  const m = parseInt(month, 10) - 1;
  return `${parseInt(day, 10)} ${months[m] ?? month} ${year}`;
}

function sourceLink(
  tx: BankTransactionRecord,
  querySuffix: string
): { label: string; href: string | null } {
  if (tx.referenceType === "expense" && tx.referenceId) {
    return { label: "Ver gasto", href: `/expenses${querySuffix}` };
  }
  if (tx.referenceType === "revenue" && tx.referenceId) {
    return { label: "Ver ingreso", href: `/revenue${querySuffix}` };
  }
  if (tx.referenceType === "receivable") {
    return { label: "Ver cuentas por cobrar", href: `/receivables${querySuffix}` };
  }
  if (tx.referenceType === "purchase_order") {
    return { label: "Ver órdenes de compra", href: `/inventory/purchase-orders${querySuffix}` };
  }
  if (tx.referenceType === "sales_order") {
    return { label: "Ver órdenes de venta", href: `/inventory/sales-orders${querySuffix}` };
  }
  return { label: bankTransactionSourceLabel(tx.referenceType), href: null };
}

export function BankAccountDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const companyQuery = searchParams.get("companyId");
  const querySuffix = companyQuery ? `?companyId=${encodeURIComponent(companyQuery)}` : "";

  const {
    activeCompanyId,
    bankAccounts,
    fetchBankAccountTransactions,
    createManualBankTransaction,
    createBankTransfer,
    refreshBankAccounts,
  } = useCompanyScopedFinancialData();

  const account = bankAccounts.find((a) => a.id === id);
  const [transactions, setTransactions] = useState<BankTransactionRecord[]>([]);
  const [loadingTx, setLoadingTx] = useState(true);
  const [manualOpen, setManualOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadTransactions = useCallback(async () => {
    if (!id) return;
    setLoadingTx(true);
    try {
      const rows = await fetchBankAccountTransactions(id);
      setTransactions(rows);
    } finally {
      setLoadingTx(false);
    }
  }, [id, fetchBankAccountTransactions]);

  useEffect(() => {
    void loadTransactions();
  }, [loadTransactions, account?.currentBalance]);

  useSupabaseRealtimeRefresh(
    activeCompanyId,
    "bank-detail-transactions",
    "company_bank_transactions",
    loadTransactions
  );

  if (!account) {
    return (
      <div className="p-8 text-center">
        <p className="text-sm text-stone-600">Cuenta no encontrada.</p>
        <Link to={`/accounts${querySuffix}`} className="text-sm font-bold text-green-800 mt-2 inline-block">
          {BANK_ACCOUNT_DETAIL_COPY.back}
        </Link>
      </div>
    );
  }

  const activeDestinations = bankAccounts.filter((a) => a.active && a.id !== account.id);

  return (
    <div className="flex flex-1 flex-col text-[#1C1917] font-sans min-h-0 bg-stone-50/40">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-10 py-4 sm:py-5 space-y-5">
          <Link
            to={`/accounts${querySuffix}`}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-green-800 hover:text-green-900"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {BANK_ACCOUNT_DETAIL_COPY.back}
          </Link>

          <section className="rounded-xl border border-stone-200 bg-white shadow-sm px-5 py-6">
            <p className="text-[10px] font-bold uppercase text-stone-500">
              {account.bankName} · {bankAccountTypeLabel(account.accountType)}
              {account.accountNumber ? ` · ${maskAccountNumber(account.accountNumber)}` : ""}
            </p>
            <h1 className="text-xl font-bold text-stone-900 mt-1">{account.accountName}</h1>
            <p className="text-[10px] font-bold uppercase text-green-800 mt-4">
              {BANK_ACCOUNT_DETAIL_COPY.currentBalance}
            </p>
            <p className="text-3xl font-bold text-stone-900 tabular-nums">
              {formatBalanceWithCurrency(account.currentBalance, account.currency)}
            </p>
            <div className="flex flex-wrap gap-2 mt-4">
              <button
                type="button"
                onClick={() => setManualOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-green-800 rounded-lg hover:bg-green-900"
              >
                <Plus className="h-3.5 w-3.5" />
                {BANK_ACCOUNT_DETAIL_COPY.addManual}
              </button>
              {activeDestinations.length > 0 && (
                <button
                  type="button"
                  onClick={() => setTransferOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-green-800 border border-green-800/30 rounded-lg hover:bg-green-50"
                >
                  <ArrowLeftRight className="h-3.5 w-3.5" />
                  {BANK_ACCOUNT_DETAIL_COPY.addTransfer}
                </button>
              )}
            </div>
          </section>

          <BankAccountBalanceChart transactions={transactions} />

          <section className="rounded-xl border border-stone-200 bg-white shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-stone-200">
              <h2 className="text-sm font-bold text-stone-900">
                {BANK_ACCOUNT_DETAIL_COPY.transactionHistory}
              </h2>
            </div>
            {loadingTx ? (
              <p className="px-5 py-8 text-sm text-stone-600">Cargando movimientos…</p>
            ) : transactions.length === 0 ? (
              <p className="px-5 py-8 text-sm text-stone-600 text-center">
                {BANK_ACCOUNT_DETAIL_COPY.noTransactions}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-green-800/20 bg-stone-50/80">
                      <th className="text-left px-4 py-2.5 font-bold uppercase text-green-800">
                        {BANK_ACCOUNT_DETAIL_COPY.dateColumn}
                      </th>
                      <th className="text-left px-4 py-2.5 font-bold uppercase text-green-800">
                        {BANK_ACCOUNT_DETAIL_COPY.descriptionColumn}
                      </th>
                      <th className="text-left px-4 py-2.5 font-bold uppercase text-green-800">
                        {BANK_ACCOUNT_DETAIL_COPY.typeColumn}
                      </th>
                      <th className="text-right px-4 py-2.5 font-bold uppercase text-green-800">
                        {BANK_ACCOUNT_DETAIL_COPY.amountColumn}
                      </th>
                      <th className="text-right px-4 py-2.5 font-bold uppercase text-green-800">
                        {BANK_ACCOUNT_DETAIL_COPY.balanceColumn}
                      </th>
                      <th className="text-left px-4 py-2.5 font-bold uppercase text-green-800">
                        {BANK_ACCOUNT_DETAIL_COPY.sourceColumn}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx) => {
                      const source = sourceLink(tx, querySuffix);
                      const isOutflow = tx.type === "expense";
                      return (
                        <tr key={tx.id} className="border-b border-stone-100 hover:bg-stone-50/50">
                          <td className="px-4 py-3 text-stone-700 whitespace-nowrap">
                            {formatDisplayDate(tx.date)}
                          </td>
                          <td className="px-4 py-3 text-stone-900">{tx.description}</td>
                          <td className="px-4 py-3 text-stone-600">
                            {bankTransactionTypeLabel(tx.type)}
                          </td>
                          <td
                            className={cn(
                              "px-4 py-3 text-right font-semibold tabular-nums",
                              isOutflow ? "text-red-700" : "text-green-800"
                            )}
                          >
                            {isOutflow ? "−" : "+"}
                            {formatBalanceWithCurrency(tx.amount, account.currency)}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums text-stone-900">
                            {formatBalanceWithCurrency(tx.runningBalance, account.currency)}
                          </td>
                          <td className="px-4 py-3">
                            {source.href ? (
                              <Link
                                to={source.href}
                                className="font-bold text-green-800 hover:text-green-900"
                              >
                                {source.label}
                              </Link>
                            ) : (
                              <span className="text-stone-600">{source.label}</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </div>

      <ManualTransactionDialog
        open={manualOpen}
        bankAccountId={account.id}
        saving={saving}
        onClose={() => !saving && setManualOpen(false)}
        onSave={async (input) => {
          setSaving(true);
          try {
            await createManualBankTransaction(input);
            setManualOpen(false);
            await loadTransactions();
            if (isSupabaseConfigured) await refreshBankAccounts();
          } finally {
            setSaving(false);
          }
        }}
      />

      <TransferDialog
        open={transferOpen}
        fromAccountId={account.id}
        accounts={bankAccounts}
        saving={saving}
        onClose={() => !saving && setTransferOpen(false)}
        onSave={async (input) => {
          setSaving(true);
          try {
            await createBankTransfer(input);
            setTransferOpen(false);
            await loadTransactions();
            if (isSupabaseConfigured) await refreshBankAccounts();
          } finally {
            setSaving(false);
          }
        }}
      />
    </div>
  );
}

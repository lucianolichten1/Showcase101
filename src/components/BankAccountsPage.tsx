import { useCallback, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Building2, Pencil, Plus, Power } from "lucide-react";
import {
  formatBalanceWithCurrency,
  sumBalancesByCurrency,
} from "@/domains/financial/bank-accounts/bankAccountSyncLogic";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { FinancialEmptyBanner } from "@/components/FinancialEmptyBanner";
import { BankAccountFormDialog } from "@/components/bank-accounts/BankAccountFormDialog";
import { useOpenCreateFromQuery } from "@/hooks/useOpenCreateFromQuery";
import { useCompanyScopedFinancialData } from "@/domains/company/useCompanyScopedFinancialData";
import type { BankAccountInput, BankAccountRecord } from "@/domains/financial/bank-accounts/types";
import type { CreateBankAccountInput } from "@/domains/financial/bank-accounts/types";
import {
  BANK_ACCOUNTS_PAGE_COPY,
  bankAccountTypeLabel,
  maskAccountNumber,
} from "@/domains/financial/bank-accounts/labels";
import { getSupabaseErrorMessage } from "@/lib/supabaseError";
import { cn } from "@/lib/utils";

export function BankAccountsPage() {
  const {
    activeCompanyId,
    bankAccounts,
    bankAccountsLoading,
    bankAccountsError,
    saveBankAccount,
    deactivateBankAccount,
  } = useCompanyScopedFinancialData();

  const [searchParams] = useSearchParams();
  const companyQuery = searchParams.get("companyId");
  const querySuffix = companyQuery ? `?companyId=${encodeURIComponent(companyQuery)}` : "";

  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<BankAccountRecord | null>(null);
  const [saving, setSaving] = useState(false);
  const [deactivateTarget, setDeactivateTarget] = useState<BankAccountRecord | null>(null);
  const [deactivating, setDeactivating] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleOpenCreate = useCallback(() => {
    setEditTarget(null);
    setSaveError(null);
    setFormOpen(true);
  }, []);

  useOpenCreateFromQuery("bank-account", handleOpenCreate);

  const activeAccounts = useMemo(
    () => bankAccounts.filter((a) => a.active),
    [bankAccounts]
  );
  const inactiveAccounts = useMemo(
    () => bankAccounts.filter((a) => !a.active),
    [bankAccounts]
  );
  const cashTotals = useMemo(
    () => sumBalancesByCurrency(activeAccounts),
    [activeAccounts]
  );

  const handleSave = async (input: CreateBankAccountInput | BankAccountInput) => {
    if (!activeCompanyId) {
      setSaveError(
        "No hay empresa activa. Use el enlace del menú lateral o agregue ?companyId= a la URL."
      );
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      await saveBankAccount(editTarget?.id ?? null, input);
      setFormOpen(false);
      setEditTarget(null);
    } catch (err) {
      setSaveError(
        getSupabaseErrorMessage(err, "No se pudo guardar la cuenta bancaria")
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async () => {
    if (!deactivateTarget) return;
    setDeactivating(true);
    try {
      await deactivateBankAccount(deactivateTarget.id);
      setDeactivateTarget(null);
    } finally {
      setDeactivating(false);
    }
  };

  const renderCard = (account: BankAccountRecord) => (
    <article
      key={account.id}
      className={cn(
        "rounded-xl border bg-white shadow-sm p-4 flex flex-col gap-3",
        account.active ? "border-stone-200" : "border-stone-200/70 opacity-75"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green-50 text-green-800">
            <Building2 className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <Link
              to={`/accounts/${account.id}${querySuffix}`}
              className="text-sm font-bold text-stone-900 hover:text-green-800 truncate block"
            >
              {account.accountName}
            </Link>
            <p className="text-xs text-stone-600 truncate">
              {account.bankName}
              {account.accountNumber ? ` · ${maskAccountNumber(account.accountNumber)}` : ""}
            </p>
          </div>
        </div>
        <span
          className={cn(
            "shrink-0 text-[9px] font-bold uppercase px-2 py-0.5 rounded-full",
            account.active
              ? "bg-green-50 text-green-800"
              : "bg-stone-100 text-stone-500"
          )}
        >
          {account.active ? BANK_ACCOUNTS_PAGE_COPY.active : BANK_ACCOUNTS_PAGE_COPY.inactive}
        </span>
      </div>

      <div className="flex items-end justify-between gap-2">
        <div>
          <p className="text-[9px] font-bold uppercase text-stone-500">
            {bankAccountTypeLabel(account.accountType)}
          </p>
          <p className="text-lg font-bold text-stone-900 tabular-nums">
            {formatBalanceWithCurrency(account.currentBalance, account.currency)}
          </p>
        </div>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => {
              setEditTarget(account);
              setSaveError(null);
              setFormOpen(true);
            }}
            className="p-2 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50"
            aria-label={BANK_ACCOUNTS_PAGE_COPY.editAccount}
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          {account.active && (
            <button
              type="button"
              onClick={() => setDeactivateTarget(account)}
              className="p-2 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50"
              aria-label={BANK_ACCOUNTS_PAGE_COPY.markInactive}
            >
              <Power className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      <Link
        to={`/accounts/${account.id}${querySuffix}`}
        className="text-xs font-bold text-green-800 hover:text-green-900"
      >
        {BANK_ACCOUNTS_PAGE_COPY.viewDetails} →
      </Link>
    </article>
  );

  return (
    <div className="flex flex-1 flex-col text-[#1C1917] font-sans min-h-0 bg-stone-50/40">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-10 py-4 sm:py-5 space-y-5">
          <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between rounded-xl border border-stone-200 bg-white shadow-sm px-4 py-3.5 sm:px-5">
            <div>
              <h1 className="text-2xl font-bold text-stone-900 tracking-tight">
                {BANK_ACCOUNTS_PAGE_COPY.title}
              </h1>
              <p className="text-sm text-stone-600 mt-1">{BANK_ACCOUNTS_PAGE_COPY.subtitle}</p>
            </div>
            <button
              type="button"
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-green-800 rounded-lg hover:bg-green-900"
            >
              <Plus className="h-4 w-4" />
              {BANK_ACCOUNTS_PAGE_COPY.addAccount}
            </button>
          </section>

          {!activeCompanyId && (
            <p className="text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
              Seleccione una empresa para administrar cuentas bancarias. Abra el módulo desde el
              menú lateral con una empresa activa.
            </p>
          )}

          {bankAccountsError && (
            <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              {bankAccountsError}
            </p>
          )}

          {activeAccounts.length > 0 && (
            <section className="rounded-xl border border-green-800/20 bg-green-50/50 px-4 py-3 flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-green-800">
                {BANK_ACCOUNTS_PAGE_COPY.totalCash}
              </span>
              <div className="text-right">
                {cashTotals.map((row) => (
                  <p key={row.currency} className="text-lg font-bold text-green-900 tabular-nums">
                    {formatBalanceWithCurrency(row.total, row.currency)}
                  </p>
                ))}
              </div>
            </section>
          )}

          {bankAccountsLoading ? (
            <p className="text-sm text-stone-600">Cargando cuentas…</p>
          ) : bankAccounts.length === 0 ? (
            <div className="space-y-3">
              <FinancialEmptyBanner
                title={BANK_ACCOUNTS_PAGE_COPY.noAccounts}
                description={BANK_ACCOUNTS_PAGE_COPY.noAccountsHint}
                showImportLink={false}
              />
              <button
                type="button"
                onClick={handleOpenCreate}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-green-800 rounded-lg hover:bg-green-900"
              >
                <Plus className="h-4 w-4" />
                {BANK_ACCOUNTS_PAGE_COPY.addAccount}
              </button>
            </div>
          ) : (
            <>
              {activeAccounts.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {activeAccounts.map(renderCard)}
                </div>
              )}
              {inactiveAccounts.length > 0 && (
                <section>
                  <h2 className="text-[10px] font-bold uppercase text-stone-500 mb-3">
                    {BANK_ACCOUNTS_PAGE_COPY.inactive}
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {inactiveAccounts.map(renderCard)}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </div>

      <BankAccountFormDialog
        open={formOpen}
        account={editTarget}
        saving={saving}
        saveError={saveError}
        onClose={() => {
          if (!saving) {
            setFormOpen(false);
            setEditTarget(null);
            setSaveError(null);
          }
        }}
        onSave={handleSave}
      />

      <ConfirmDialog
        open={Boolean(deactivateTarget)}
        title="Marcar cuenta como inactiva"
        message="La cuenta no aparecerá en los formularios de gastos e ingresos, pero se conservará su historial."
        confirmLabel={BANK_ACCOUNTS_PAGE_COPY.markInactive}
        loading={deactivating}
        onConfirm={handleDeactivate}
        onClose={() => !deactivating && setDeactivateTarget(null)}
      />
    </div>
  );
}

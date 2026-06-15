import { useEffect, useMemo, useState } from "react";
import { Loader2, X } from "lucide-react";
import {
  bnbAccountTypeLabel,
  getAccountBalances,
  isBnbSandboxMode,
  mapBnbCurrency,
  maskBnbAccountNumber,
} from "@/domains/banking/bnbService";
import { BNB_COPY, bnbErrorMessage } from "@/domains/banking/bnbLabels";
import type { BnbAccountBalance } from "@/domains/banking/bnbTypes";
import { formatBalanceWithCurrency } from "@/domains/financial/bank-accounts/bankAccountSyncLogic";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  linkedAccountNumbers: string[];
  importing?: boolean;
  onClose: () => void;
  onImport: (accounts: BnbAccountBalance[]) => Promise<void>;
}

export function BnbConnectDialog({
  open,
  linkedAccountNumbers,
  importing = false,
  onClose,
  onImport,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sandbox, setSandbox] = useState(false);
  const [accounts, setAccounts] = useState<BnbAccountBalance[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const linkedSet = useMemo(() => new Set(linkedAccountNumbers), [linkedAccountNumbers]);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError(null);
    setAccounts([]);
    setSelected(new Set());

    void (async () => {
      const result = await getAccountBalances();
      if (result.ok === false) {
        setError(bnbErrorMessage(result.error));
        setLoading(false);
        return;
      }
      setSandbox(result.sandbox);
      setAccounts(result.data);
      const preselected = result.data
        .filter((row) => !linkedSet.has(row.accountNumber))
        .map((row) => row.accountNumber);
      setSelected(new Set(preselected));
      setLoading(false);
    })();
  }, [open, linkedSet]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !importing && !loading) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, importing, loading, onClose]);

  if (!open) return null;

  const toggleAccount = (accountNumber: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(accountNumber)) next.delete(accountNumber);
      else next.add(accountNumber);
      return next;
    });
  };

  const handleImport = async () => {
    const picked = accounts.filter((row) => selected.has(row.accountNumber));
    if (picked.length === 0) {
      setError(BNB_COPY.selectAtLeastOne);
      return;
    }
    setError(null);
    await onImport(picked);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-stone-900/40"
        aria-label={BNB_COPY.cancel}
        onClick={() => !importing && !loading && onClose()}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="bnb-connect-title"
        className="relative w-full max-w-lg rounded-xl border border-stone-200 bg-white shadow-xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-stone-100 px-5 py-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 id="bnb-connect-title" className="text-base font-bold text-stone-900">
                {BNB_COPY.connectTitle}
              </h2>
              {(sandbox || isBnbSandboxMode()) && (
                <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-50 text-amber-800">
                  {BNB_COPY.sandboxBadge}
                </span>
              )}
            </div>
            <p className="text-sm text-stone-600 mt-1">{BNB_COPY.connectDescription}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={importing || loading}
            className="p-1.5 rounded-lg text-stone-500 hover:bg-stone-100 disabled:opacity-50"
            aria-label={BNB_COPY.cancel}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-3 max-h-[min(24rem,60vh)] overflow-y-auto">
          {loading && (
            <div className="flex items-center gap-2 text-sm text-stone-600 py-6 justify-center">
              <Loader2 className="h-4 w-4 animate-spin" />
              Cargando cuentas BNB…
            </div>
          )}

          {!loading && error && (
            <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {!loading && !error && accounts.length === 0 && (
            <p className="text-sm text-stone-600 py-4 text-center">{BNB_COPY.noAccountsFound}</p>
          )}

          {!loading &&
            accounts.map((row) => {
              const alreadyLinked = linkedSet.has(row.accountNumber);
              const checked = selected.has(row.accountNumber);
              return (
                <label
                  key={row.accountNumber}
                  className={cn(
                    "flex items-start gap-3 rounded-lg border px-3 py-3 cursor-pointer",
                    checked ? "border-green-800/30 bg-green-50/40" : "border-stone-200",
                    alreadyLinked && "opacity-80"
                  )}
                >
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={checked}
                    onChange={() => toggleAccount(row.accountNumber)}
                    disabled={importing}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-stone-900 truncate">{row.partyName}</p>
                    <p className="text-xs text-stone-600">
                      {bnbAccountTypeLabel(row.accountType)} · {maskBnbAccountNumber(row.accountNumber)}
                    </p>
                    <p className="text-sm font-bold text-stone-900 tabular-nums mt-1">
                      {formatBalanceWithCurrency(row.balanceAmount, mapBnbCurrency(row.currency))}
                    </p>
                    {alreadyLinked && (
                      <p className="text-[10px] font-bold uppercase text-green-800 mt-1">
                        {BNB_COPY.connected}
                      </p>
                    )}
                  </div>
                </label>
              );
            })}

          {sandbox && !loading && (
            <p className="text-xs text-amber-900 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              {BNB_COPY.credentialsHint}
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-stone-100 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={importing || loading}
            className="px-4 py-2 text-xs font-bold text-stone-700 border border-stone-200 rounded-lg hover:bg-stone-50 disabled:opacity-50"
          >
            {BNB_COPY.cancel}
          </button>
          <button
            type="button"
            onClick={() => void handleImport()}
            disabled={importing || loading || accounts.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-green-800 rounded-lg hover:bg-green-900 disabled:opacity-50"
          >
            {importing && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {BNB_COPY.importSelected}
          </button>
        </div>
      </div>
    </div>
  );
}

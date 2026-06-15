import type { PurchaseOrderRecord, SalesOrderRecord } from "@/domains/inventory/types";
import { isSupabaseConfigured } from "@/lib/supabase";
import { loadCompanyBankAccountsFromStorage } from "@/domains/financial/bank-accounts/bankAccountStorage";
import {
  syncLocalPurchaseOrderBankTransaction,
  syncLocalSalesOrderBankTransaction,
} from "@/domains/financial/bank-accounts/bankAccountLocalSync";
import {
  syncServerPurchaseOrderBankTransaction,
  syncServerSalesOrderBankTransaction,
} from "@/domains/financial/bank-accounts/bankAccountLinkedSync";

export async function syncPurchaseOrderBankLedger(
  companyId: string,
  po: PurchaseOrderRecord
): Promise<void> {
  const input = {
    id: po.id,
    poNumber: po.poNumber,
    total: po.total,
    status: po.status,
    paymentMethod: po.paymentMethod ?? null,
    bankAccountId: po.bankAccountId ?? null,
    receivedDate: po.receivedDate ?? null,
  };

  if (!isSupabaseConfigured) {
    const accounts = loadCompanyBankAccountsFromStorage(companyId);
    syncLocalPurchaseOrderBankTransaction(companyId, accounts, input);
    return;
  }

  await syncServerPurchaseOrderBankTransaction(companyId, input);
}

export async function syncSalesOrderBankLedger(
  companyId: string,
  so: SalesOrderRecord
): Promise<void> {
  const input = {
    id: so.id,
    soNumber: so.soNumber,
    total: so.total,
    status: so.status,
    paymentMethod: so.paymentMethod ?? null,
    bankAccountId: so.bankAccountId ?? null,
    fulfilledDate: so.fulfilledDate ?? null,
  };

  if (!isSupabaseConfigured) {
    const accounts = loadCompanyBankAccountsFromStorage(companyId);
    syncLocalSalesOrderBankTransaction(companyId, accounts, input);
    return;
  }

  await syncServerSalesOrderBankTransaction(companyId, input);
}

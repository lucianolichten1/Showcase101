import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type { ReceivableRecord } from "@/domains/financial/types";
import type { BankAccountRecord } from "@/domains/financial/bank-accounts/types";

export type BnbQrCodeStatus = "pending" | "paid" | "expired" | "cancelled";

export interface ReceivableQrCodeRecord {
  id: string;
  companyId: string;
  invoiceId: number;
  bnbQrId: string;
  amount: number;
  currency: string;
  status: BnbQrCodeStatus;
  expirationDate: string;
  voucherId: string | null;
  bankAccountId: string | null;
  createdAt: string;
}

interface BnbQrCodeRow {
  id: string;
  company_id: string;
  invoice_id: number;
  bnb_qr_id: string;
  amount: number;
  currency: string;
  status: BnbQrCodeStatus;
  expiration_date: string;
  voucher_id: string | null;
  bank_account_id: string | null;
  created_at: string;
}

const STORAGE_PREFIX = "agro-company-bnb-qrs-v1";

function storageKey(companyId: string): string {
  return `${STORAGE_PREFIX}-${companyId}`;
}

function mapRow(row: BnbQrCodeRow): ReceivableQrCodeRecord {
  return {
    id: row.id,
    companyId: row.company_id,
    invoiceId: Number(row.invoice_id),
    bnbQrId: row.bnb_qr_id,
    amount: Number(row.amount),
    currency: row.currency,
    status: row.status,
    expirationDate: row.expiration_date,
    voucherId: row.voucher_id,
    bankAccountId: row.bank_account_id,
    createdAt: row.created_at,
  };
}

function loadLocal(companyId: string): ReceivableQrCodeRecord[] {
  try {
    const raw = localStorage.getItem(storageKey(companyId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ReceivableQrCodeRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveLocal(companyId: string, rows: ReceivableQrCodeRecord[]): void {
  localStorage.setItem(storageKey(companyId), JSON.stringify(rows));
}

export async function createReceivableQrCode(
  companyId: string,
  invoiceId: number,
  bnbQrId: string,
  amount: number,
  expirationDate: string,
  bankAccountId: string | null
): Promise<ReceivableQrCodeRecord> {
  if (!isSupabaseConfigured) {
    const rows = loadLocal(companyId);
    const record: ReceivableQrCodeRecord = {
      id: crypto.randomUUID(),
      companyId,
      invoiceId,
      bnbQrId,
      amount,
      currency: "BOB",
      status: "pending",
      expirationDate,
      voucherId: null,
      bankAccountId,
      createdAt: new Date().toISOString(),
    };
    saveLocal(companyId, [record, ...rows]);
    return record;
  }

  const { data, error } = await supabase
    .from("bnb_qr_codes")
    .insert({
      company_id: companyId,
      invoice_id: invoiceId,
      bnb_qr_id: bnbQrId,
      amount,
      currency: "BOB",
      status: "pending",
      expiration_date: expirationDate,
      bank_account_id: bankAccountId,
    })
    .select("*")
    .single();
  if (error) throw error;
  return mapRow(data as BnbQrCodeRow);
}

export async function fetchLatestReceivableQrCode(
  companyId: string,
  invoiceId: number
): Promise<ReceivableQrCodeRecord | null> {
  if (!isSupabaseConfigured) {
    const rows = loadLocal(companyId)
      .filter((row) => row.invoiceId === invoiceId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return rows[0] ?? null;
  }

  const { data, error } = await supabase
    .from("bnb_qr_codes")
    .select("*")
    .eq("company_id", companyId)
    .eq("invoice_id", invoiceId)
    .order("created_at", { ascending: false })
    .limit(1);
  if (error) throw error;
  const row = (data as BnbQrCodeRow[])[0];
  return row ? mapRow(row) : null;
}

export async function updateReceivableQrCodeStatus(
  companyId: string,
  bnbQrId: string,
  status: BnbQrCodeStatus,
  voucherId?: string | null
): Promise<void> {
  if (!isSupabaseConfigured) {
    const rows = loadLocal(companyId).map((row) =>
      row.bnbQrId === bnbQrId ? { ...row, status, voucherId: voucherId ?? row.voucherId } : row
    );
    saveLocal(companyId, rows);
    return;
  }

  const patch: Record<string, unknown> = { status };
  if (voucherId !== undefined) patch.voucher_id = voucherId;

  const { error } = await supabase
    .from("bnb_qr_codes")
    .update(patch)
    .eq("company_id", companyId)
    .eq("bnb_qr_id", bnbQrId);
  if (error) throw error;
}

export function selectDefaultQrBankAccount(accounts: BankAccountRecord[]): string | null {
  const bnb = accounts.find((account) => account.active && account.bnbConnected);
  if (bnb) return bnb.id;
  return accounts.find((account) => account.active)?.id ?? null;
}

export function receivableBalance(receivable: ReceivableRecord): number {
  return Math.max(0, Number((receivable.amount - receivable.amountPaid).toFixed(2)));
}

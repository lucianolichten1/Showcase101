import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type {
  PaymentMethod,
  RevenueCategory,
  RevenuePaymentStatus,
  RevenueRecord,
} from "@/domains/financial/types";
import { isPersistedRecordId } from "@/domains/financial/persistence/isPersistedRecordId";
import {
  loadCompanyRevenueFromStorage,
  saveCompanyRevenueToStorage,
} from "./revenueStorage";

export interface CompanyRevenueRow {
  id: string;
  company_id: string;
  revenue_date: string;
  source_client: string;
  product_service: string;
  category: string;
  amount: number;
  currency: string;
  status: string;
  payment_method: string;
  invoice_number: string;
  notes: string;
  cost: number;
  created_at: string;
  updated_at: string;
}

export type RevenueInput = Omit<RevenueRecord, "id">;

function mapRowToRecord(row: CompanyRevenueRow): RevenueRecord {
  return {
    id: row.id,
    date: row.revenue_date,
    sourceClient: row.source_client,
    productService: row.product_service,
    category: row.category as RevenueCategory,
    amount: Number(row.amount),
    currency: row.currency,
    status: row.status as RevenuePaymentStatus,
    paymentMethod: row.payment_method as PaymentMethod,
    invoiceNumber: row.invoice_number,
    notes: row.notes ?? "",
    cost: Number(row.cost) || 0,
  };
}

function mapRecordToInsert(companyId: string, input: RevenueInput) {
  return {
    company_id: companyId,
    revenue_date: input.date,
    source_client: input.sourceClient,
    product_service: input.productService,
    category: input.category,
    amount: input.amount,
    currency: input.currency,
    status: input.status,
    payment_method: input.paymentMethod,
    invoice_number: input.invoiceNumber,
    notes: input.notes,
    cost: input.cost ?? 0,
  };
}

function mapRecordToUpdate(input: RevenueInput) {
  return {
    revenue_date: input.date,
    source_client: input.sourceClient,
    product_service: input.productService,
    category: input.category,
    amount: input.amount,
    currency: input.currency,
    status: input.status,
    payment_method: input.paymentMethod,
    invoice_number: input.invoiceNumber,
    notes: input.notes,
    cost: input.cost ?? 0,
    updated_at: new Date().toISOString(),
  };
}

export async function fetchCompanyRevenue(companyId: string): Promise<RevenueRecord[]> {
  if (!isSupabaseConfigured) {
    return loadCompanyRevenueFromStorage(companyId);
  }

  const { data, error } = await supabase
    .from("company_revenue")
    .select("*")
    .eq("company_id", companyId)
    .order("revenue_date", { ascending: false });

  if (error) throw error;
  return (data as CompanyRevenueRow[]).map(mapRowToRecord);
}

export async function createCompanyRevenue(
  companyId: string,
  input: RevenueInput
): Promise<RevenueRecord> {
  if (!isSupabaseConfigured) {
    const record: RevenueRecord = { id: crypto.randomUUID(), ...input, cost: input.cost ?? 0 };
    const next = [record, ...loadCompanyRevenueFromStorage(companyId)];
    saveCompanyRevenueToStorage(companyId, next);
    return record;
  }

  const { data, error } = await supabase
    .from("company_revenue")
    .insert(mapRecordToInsert(companyId, input))
    .select("*")
    .single();

  if (error) throw error;
  return mapRowToRecord(data as CompanyRevenueRow);
}

export async function updateCompanyRevenue(
  companyId: string,
  id: string,
  input: RevenueInput
): Promise<RevenueRecord> {
  if (!isSupabaseConfigured) {
    const current = loadCompanyRevenueFromStorage(companyId);
    const next = current.map((row) => (row.id === id ? { id, ...input, cost: input.cost ?? 0 } : row));
    saveCompanyRevenueToStorage(companyId, next);
    const updated = next.find((row) => row.id === id);
    if (!updated) throw new Error("Revenue record not found");
    return updated;
  }

  const { data, error } = await supabase
    .from("company_revenue")
    .update(mapRecordToUpdate(input))
    .eq("company_id", companyId)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  return mapRowToRecord(data as CompanyRevenueRow);
}

export async function deleteCompanyRevenue(companyId: string, id: string): Promise<void> {
  if (!isPersistedRecordId(id)) {
    throw new Error("Cannot delete imported revenue via native store");
  }

  if (!isSupabaseConfigured) {
    const current = loadCompanyRevenueFromStorage(companyId);
    saveCompanyRevenueToStorage(
      companyId,
      current.filter((row) => row.id !== id)
    );
    return;
  }

  const { error } = await supabase
    .from("company_revenue")
    .delete()
    .eq("company_id", companyId)
    .eq("id", id);

  if (error) throw error;
}

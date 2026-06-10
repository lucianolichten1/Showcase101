import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { isPersistedNumericId } from "@/domains/financial/persistence/isPersistedNumericId";
import type { CustomerRecord } from "./types";

export interface CompanyCustomerRow {
  id: number;
  company_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  city: string | null;
  industry: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export type CustomerInput = Omit<CustomerRecord, "id">;

const STORAGE_PREFIX = "agro-company-customers-v1";

function storageKey(companyId: string): string {
  return `${STORAGE_PREFIX}-${companyId}`;
}

function loadFromStorage(companyId: string): CustomerRecord[] {
  try {
    const raw = localStorage.getItem(storageKey(companyId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CustomerRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveToStorage(companyId: string, records: CustomerRecord[]): void {
  localStorage.setItem(storageKey(companyId), JSON.stringify(records));
}

function mapRowToRecord(row: CompanyCustomerRow): CustomerRecord {
  return {
    id: Number(row.id),
    name: row.name,
    email: row.email ?? undefined,
    phone: row.phone ?? undefined,
    city: row.city ?? undefined,
    industry: row.industry ?? undefined,
    status: row.status === "Inactive" ? "Inactive" : "Active",
    createdAt: row.created_at.slice(0, 10),
  };
}

function mapInputToRow(input: CustomerInput) {
  return {
    name: input.name,
    email: input.email?.trim() || null,
    phone: input.phone?.trim() || null,
    city: input.city?.trim() || null,
    industry: input.industry?.trim() || null,
    status: input.status ?? "Active",
    updated_at: new Date().toISOString(),
  };
}

export async function fetchCompanyCustomers(companyId: string): Promise<CustomerRecord[]> {
  if (!isSupabaseConfigured) return loadFromStorage(companyId);

  const { data, error } = await supabase
    .from("company_customers")
    .select("*")
    .eq("company_id", companyId)
    .order("name", { ascending: true });

  if (error) throw error;
  return (data as CompanyCustomerRow[]).map(mapRowToRecord);
}

export async function createCompanyCustomer(
  companyId: string,
  input: CustomerInput
): Promise<CustomerRecord> {
  if (!isSupabaseConfigured) {
    const records = loadFromStorage(companyId);
    const id = records.length > 0 ? Math.max(...records.map((r) => r.id), 999999) + 1 : 1_000_000;
    const record: CustomerRecord = {
      id,
      ...input,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    saveToStorage(companyId, [...records, record]);
    return record;
  }

  const { data, error } = await supabase
    .from("company_customers")
    .insert({ company_id: companyId, ...mapInputToRow(input) })
    .select("*")
    .single();

  if (error) throw error;
  return mapRowToRecord(data as CompanyCustomerRow);
}

export async function updateCompanyCustomer(
  companyId: string,
  id: number,
  input: CustomerInput
): Promise<CustomerRecord> {
  if (!isSupabaseConfigured) {
    const records = loadFromStorage(companyId);
    const next = records.map((r) => (r.id === id ? { ...r, ...input } : r));
    saveToStorage(companyId, next);
    const updated = next.find((r) => r.id === id);
    if (!updated) throw new Error("Customer not found");
    return updated;
  }

  const { data, error } = await supabase
    .from("company_customers")
    .update(mapInputToRow(input))
    .eq("company_id", companyId)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  return mapRowToRecord(data as CompanyCustomerRow);
}

export async function deleteCompanyCustomer(companyId: string, id: number): Promise<void> {
  if (!isPersistedNumericId(id)) {
    throw new Error("Cannot delete imported customer via native store");
  }

  if (!isSupabaseConfigured) {
    saveToStorage(companyId, loadFromStorage(companyId).filter((r) => r.id !== id));
    return;
  }

  const { error } = await supabase
    .from("company_customers")
    .delete()
    .eq("company_id", companyId)
    .eq("id", id);

  if (error) throw error;
}

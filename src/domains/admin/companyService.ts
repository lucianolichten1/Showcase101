import { supabase } from "@/lib/supabase";
import {
  DEFAULT_COMPANY_DATABASE,
  databaseStatusLabel,
  type CompanyDatabaseStatus,
} from "./database";
import { DEFAULT_ENABLED_MODULES } from "./modules";
import type { NicheKey } from "./niches";
import type { CompanyRecord, CompanyStatus, NewCompanyInput } from "./types";

/** Row shape from the platform `companies` table. */
export interface SupabaseCompanyRow {
  id: string;
  name: string;
  niche: string;
  status: string;
  database_status: string;
  database_provider: string;
  created_at: string;
}

function normalizeNiche(raw: string): NicheKey {
  const key = raw.trim().toLowerCase();
  if (key === "agro") return "agro";
  return "agro";
}

function mapDbStatusToUi(status: string): CompanyStatus {
  const normalized = status.trim().toLowerCase();
  if (normalized === "active") return "Active";
  if (normalized === "inactive") return "Inactive";
  if (status === "Active" || status === "Inactive") return status;
  return "Active";
}

function normalizeDatabaseStatus(raw: string): CompanyDatabaseStatus {
  if (raw === "not_connected") return "not_connected";
  return "not_connected";
}

function databaseLabelForStatus(status: CompanyDatabaseStatus): string {
  if (status === "not_connected") {
    return "Company database not connected";
  }
  return databaseStatusLabel(status);
}

/** Maps a Supabase `companies` row to the frontend `CompanyRecord`. */
export function mapCompanyRowToRecord(row: SupabaseCompanyRow): CompanyRecord {
  const databaseStatus = normalizeDatabaseStatus(row.database_status);

  return {
    id: row.id,
    name: row.name,
    niche: normalizeNiche(row.niche),
    ownerEmail: "",
    status: mapDbStatusToUi(row.status),
    createdAt: row.created_at.slice(0, 10),
    enabledModules: [...DEFAULT_ENABLED_MODULES],
    databaseStatus,
    databaseLabel: databaseLabelForStatus(databaseStatus),
    databaseProvider:
      row.database_provider?.trim() || DEFAULT_COMPANY_DATABASE.databaseProvider,
  };
}

export async function listCompanies(): Promise<CompanyRecord[]> {
  const { data, error } = await supabase
    .from("companies")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapCompanyRowToRecord(row as SupabaseCompanyRow));
}

export async function getCompanyById(id: string): Promise<CompanyRecord | null> {
  const { data, error } = await supabase
    .from("companies")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;
  return mapCompanyRowToRecord(data as SupabaseCompanyRow);
}

export async function createCompany(input: NewCompanyInput): Promise<CompanyRecord> {
  const { data, error } = await supabase
    .from("companies")
    .insert({
      name: input.name,
      niche: input.niche,
      status: input.status,
      database_status: "not_connected",
      database_provider: "Supabase planned",
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapCompanyRowToRecord(data as SupabaseCompanyRow);
}

export async function updateCompany(
  id: string,
  input: Partial<Pick<CompanyRecord, "name" | "status" | "niche">>
): Promise<CompanyRecord> {
  const patch: Record<string, string> = {};
  if (input.name !== undefined) patch.name = input.name;
  if (input.status !== undefined) patch.status = input.status;
  if (input.niche !== undefined) patch.niche = input.niche;

  const { data, error } = await supabase
    .from("companies")
    .update(patch)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapCompanyRowToRecord(data as SupabaseCompanyRow);
}

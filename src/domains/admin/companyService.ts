import { supabase } from "@/lib/supabase";
import { getSupabaseErrorMessage } from "@/lib/supabaseError";
import {
  DEFAULT_COMPANY_DATABASE,
  databaseStatusLabel,
  type CompanyDatabaseStatus,
} from "./database";
import { normalizeEnabledDashboardWidgets } from "./dashboardWidgets";
import { DEFAULT_ENABLED_MODULES } from "./modules";
import type { NicheKey } from "./niches";
import { DEFAULT_COMPANY_BRANDING } from "@/domains/company/branding";
import type {
  CompanyBranding,
  CompanyBrandingPatch,
  CompanyRecord,
  CompanyStatus,
  NewCompanyInput,
} from "./types";

/** Row shape from the platform `companies` table. */
export interface SupabaseCompanyRow {
  id: string;
  name: string;
  niche: string;
  status: string;
  database_status: string;
  database_provider: string;
  created_at: string;
  display_name?: string | null;
  primary_color?: string | null;
  accent_color?: string | null;
  background_color?: string | null;
  logo_url?: string | null;
  enabled_dashboard_widgets?: string[] | null;
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

function mapUiStatusToDb(status: CompanyStatus): string {
  return status === "Inactive" ? "inactive" : "active";
}

function normalizeDatabaseStatus(raw: string): CompanyDatabaseStatus {
  if (raw === "not_connected") return "not_connected";
  return "not_connected";
}

function mapBrandingFromRow(row: SupabaseCompanyRow): CompanyBranding {
  return {
    displayName: row.display_name?.trim() || null,
    primaryColor: row.primary_color?.trim() || DEFAULT_COMPANY_BRANDING.primaryColor,
    logoUrl: row.logo_url?.trim() || null,
  };
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
    enabledDashboardWidgets: normalizeEnabledDashboardWidgets(
      row.enabled_dashboard_widgets
    ),
    databaseStatus,
    databaseLabel: databaseLabelForStatus(databaseStatus),
    databaseProvider:
      row.database_provider?.trim() || DEFAULT_COMPANY_DATABASE.databaseProvider,
    branding: mapBrandingFromRow(row),
  };
}

export async function listCompanies(): Promise<CompanyRecord[]> {
  const { data, error } = await supabase
    .from("companies")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(getSupabaseErrorMessage(error, error.message));
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
      status: mapUiStatusToDb(input.status),
      database_status: "not_connected",
      database_provider: "Supabase planned",
    })
    .select()
    .single();

  if (error) throw new Error(getSupabaseErrorMessage(error, "Failed to create company."));
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

function brandingPatchToDb(patch: CompanyBrandingPatch): Record<string, string | null> {
  const dbPatch: Record<string, string | null> = {};
  if (patch.displayName !== undefined) {
    dbPatch.display_name = patch.displayName?.trim() || null;
  }
  if (patch.primaryColor !== undefined) dbPatch.primary_color = patch.primaryColor;
  if (patch.logoUrl !== undefined) dbPatch.logo_url = patch.logoUrl;
  return dbPatch;
}

export async function updateCompanyBranding(
  id: string,
  patch: CompanyBrandingPatch
): Promise<CompanyRecord> {
  const dbPatch = brandingPatchToDb(patch);
  if (Object.keys(dbPatch).length === 0) {
    const existing = await getCompanyById(id);
    if (!existing) throw new Error("Company not found.");
    return existing;
  }

  const { data, error } = await supabase
    .from("companies")
    .update(dbPatch)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapCompanyRowToRecord(data as SupabaseCompanyRow);
}

export async function updateCompanyDashboardWidgets(
  id: string,
  widgets: string[]
): Promise<CompanyRecord> {
  const normalized = normalizeEnabledDashboardWidgets(widgets);

  const { data, error } = await supabase
    .from("companies")
    .update({ enabled_dashboard_widgets: normalized })
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapCompanyRowToRecord(data as SupabaseCompanyRow);
}

export async function deleteCompany(id: string): Promise<void> {
  const { data, error } = await supabase
    .from("companies")
    .delete()
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) {
    throw new Error(getSupabaseErrorMessage(error, "Failed to delete company."));
  }

  if (!data) {
    throw new Error(
      "No company was deleted. Apply the companies_delete_superadmin RLS policy in Supabase SQL Editor, or confirm you are signed in as superadmin."
    );
  }
}

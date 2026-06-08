import { listCompanies } from "./companyService";
import { listCompanyOwners, type CompanyOwnerInfo } from "./companyOwnerService";
import { ALL_BASE_MODULE_KEYS } from "./modules";
import { getNicheDisplayName } from "./niches";
import type { CompanyRecord } from "./types";
import { formatCreatedDate } from "./utils";

export type AdminDisplayStatus = "active" | "onboarding" | "paused";
export type AdminImportState = "synced" | "running" | "queued" | "stale" | "failed";
export type AdminOwnerState = "active" | "invited" | "unassigned";
export type AdminPillTone = "green" | "amber" | "slate" | "rust" | "sky";

export interface AdminStatusMeta {
  tone: AdminPillTone;
  label: string;
}

export interface AdminCompanyCardModel {
  id: string;
  name: string;
  niche: string;
  status: AdminDisplayStatus;
  statusMeta: AdminStatusMeta;
  ownerEmail: string | null;
  ownerState: AdminOwnerState;
  ownerMeta: AdminStatusMeta;
  importState: AdminImportState;
  importLabel: string;
  importMeta: AdminStatusMeta;
  moduleCount: number;
  moduleTotal: number;
  checklistDone: number;
  checklistTotal: number;
  createdDisplay: string;
  companyCode: string;
  record: CompanyRecord;
}

export interface AdminChecklistStep {
  key: string;
  label: string;
  hint: string;
  done: boolean;
}

export interface AdminActivityItem {
  tone: AdminPillTone;
  when: string;
  text: string;
}

export interface AdminNoteItem {
  author: string;
  when: string;
  text: string;
}

export const STATUS_META: Record<AdminDisplayStatus, AdminStatusMeta> = {
  active: { tone: "green", label: "Active" },
  onboarding: { tone: "amber", label: "Onboarding" },
  paused: { tone: "slate", label: "Paused" },
};

export const IMPORT_META: Record<AdminImportState, AdminStatusMeta> = {
  synced: { tone: "green", label: "Synced" },
  running: { tone: "sky", label: "Importing" },
  queued: { tone: "slate", label: "Queued" },
  stale: { tone: "amber", label: "Stale" },
  failed: { tone: "rust", label: "Failed" },
};

export const OWNER_META: Record<AdminOwnerState, AdminStatusMeta> = {
  active: { tone: "green", label: "Owner active" },
  invited: { tone: "amber", label: "Invite pending" },
  unassigned: { tone: "slate", label: "No owner" },
};

export const CHECKLIST_TOTAL = 5;

export const MODAL_MODULE_OPTIONS = [
  "Dashboard",
  "Revenue",
  "Expenses",
  "Customers",
  "A/R",
  "Reports",
  "Import/Export",
  "Invoices",
] as const;

export const MODAL_REGIONS = [
  "South America · BR",
  "South America · AR",
  "North America · US",
  "North America · CA",
  "Europe · DE",
  "Europe · ES",
  "Asia-Pacific",
] as const;

export const MODAL_PLANS = ["Growth", "Scale", "Enterprise"] as const;

export function companyCodeFromRecord(company: CompanyRecord): string {
  const letters = company.name.replace(/[^a-zA-Z]/g, "").toUpperCase();
  const prefix = (letters + "XXX").slice(0, 3);
  const suffix = company.id.replace(/\D/g, "").slice(-4).padStart(4, "0");
  return `${prefix}-${suffix || "0001"}`;
}

function resolveOwnerState(owner: CompanyOwnerInfo | null): AdminOwnerState {
  if (!owner) return "unassigned";
  return "active";
}

function resolveDisplayStatus(
  company: CompanyRecord,
  owner: CompanyOwnerInfo | null
): AdminDisplayStatus {
  if (company.status === "Inactive") return "paused";
  if (!owner) return "onboarding";
  return "active";
}

function resolveImportState(company: CompanyRecord): {
  state: AdminImportState;
  label: string;
} {
  if (company.databaseStatus === "not_connected") {
    return { state: "queued", label: "Queued" };
  }
  return { state: "synced", label: "Synced" };
}

export function buildChecklistSteps(
  company: CompanyRecord,
  owner: CompanyOwnerInfo | null,
  modulesConfigured?: boolean
): AdminChecklistStep[] {
  const hasOwner = Boolean(owner);
  const modulesOn =
    modulesConfigured ??
    company.enabledModules.length >= ALL_BASE_MODULE_KEYS.length;

  return [
    {
      key: "created",
      label: "Company created",
      hint: "Record exists on the platform",
      done: true,
    },
    {
      key: "owner_invited",
      label: "Owner invited",
      hint: "Invitation sent to company owner email",
      done: hasOwner,
    },
    {
      key: "owner_active",
      label: "Owner activated account",
      hint: "Owner can sign in and access workspace",
      done: hasOwner,
    },
    {
      key: "modules",
      label: "Modules configured",
      hint: "Finance modules enabled for this company",
      done: modulesOn,
    },
    {
      key: "imported",
      label: "Initial data imported",
      hint: "First data sync from source completed",
      done: company.databaseStatus !== "not_connected",
    },
  ];
}

export function checklistDoneCount(steps: AdminChecklistStep[]): number {
  return steps.filter((s) => s.done).length;
}

export function buildInitialActivity(
  company: CompanyRecord,
  owner: CompanyOwnerInfo | null
): AdminActivityItem[] {
  const items: AdminActivityItem[] = [
    {
      tone: "green",
      when: formatCreatedDate(company.createdAt),
      text: `Company "${company.name}" created`,
    },
  ];
  if (owner) {
    items.unshift({
      tone: "amber",
      when: formatCreatedDate(owner.assignedAt.slice(0, 10)),
      text: `Owner ${owner.email} assigned`,
    });
  }
  return items;
}

export function toCompanyCardModel(
  company: CompanyRecord,
  owner: CompanyOwnerInfo | null
): AdminCompanyCardModel {
  const status = resolveDisplayStatus(company, owner);
  const ownerState = resolveOwnerState(owner);
  const importInfo = resolveImportState(company);
  const steps = buildChecklistSteps(company, owner);

  return {
    id: company.id,
    name: company.name,
    niche: getNicheDisplayName(company.niche),
    status,
    statusMeta: STATUS_META[status],
    ownerEmail: owner?.email ?? null,
    ownerState,
    ownerMeta: OWNER_META[ownerState],
    importState: importInfo.state,
    importLabel: importInfo.label,
    importMeta: IMPORT_META[importInfo.state],
    moduleCount: company.enabledModules.length,
    moduleTotal: ALL_BASE_MODULE_KEYS.length,
    checklistDone: checklistDoneCount(steps),
    checklistTotal: CHECKLIST_TOTAL,
    createdDisplay: formatCreatedDate(company.createdAt),
    companyCode: companyCodeFromRecord(company),
    record: company,
  };
}

export interface CompanyWithOwner {
  company: CompanyRecord;
  owner: CompanyOwnerInfo | null;
}

export async function loadCompaniesWithOwners(): Promise<CompanyWithOwner[]> {
  const companies = await listCompanies();
  const withOwners = await Promise.all(
    companies.map(async (company) => {
      const owners = await listCompanyOwners(company.id);
      return { company, owner: owners[0] ?? null };
    })
  );
  return withOwners;
}

export type StatusFilter = "All" | "Onboarding" | "Active" | "Paused";

export function matchesStatusFilter(
  model: AdminCompanyCardModel,
  filter: StatusFilter
): boolean {
  if (filter === "All") return true;
  return model.statusMeta.label === filter;
}

export function matchesSearchQuery(
  model: AdminCompanyCardModel,
  query: string
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    model.name.toLowerCase().includes(q) ||
    model.niche.toLowerCase().includes(q) ||
    (model.ownerEmail ?? "").toLowerCase().includes(q)
  );
}

import { supabase } from "@/lib/supabase";
import { getSupabaseErrorMessage } from "@/lib/supabaseError";
import type { AppRole } from "@/domains/auth/types";

export interface PlatformProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: AppRole | string;
}

export interface CompanyOwnerInfo {
  membershipId: string;
  userId: string;
  email: string;
  fullName: string | null;
  assignedAt: string;
}

export const PROFILE_NOT_FOUND_MESSAGE =
  "No profile found for this email. Create the user in Supabase Auth and add a profile first.";

export const OWNER_ALREADY_ASSIGNED_THIS_COMPANY_MESSAGE =
  "This owner is already assigned to this company.";

export const OWNER_ALREADY_ASSIGNED_OTHER_COMPANY_MESSAGE =
  "This owner is already assigned to another company. MVP supports one company per owner.";

export type AssignCompanyOwnerResult =
  | { outcome: "assigned"; owner: CompanyOwnerInfo }
  | { outcome: "already_here"; owner: CompanyOwnerInfo };

interface ProfileRow {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
}

interface MemberWithProfileRow {
  id: string;
  user_id: string;
  created_at: string;
  profiles: ProfileRow | ProfileRow[] | null;
}

interface OwnerMembershipRow {
  id: string;
  company_id: string;
  role: string;
  created_at: string;
}

function resolveProfile(
  profiles: ProfileRow | ProfileRow[] | null
): ProfileRow | null {
  if (!profiles) return null;
  return Array.isArray(profiles) ? profiles[0] ?? null : profiles;
}

function mapProfileRow(row: ProfileRow): PlatformProfile {
  return {
    id: row.id,
    email: row.email,
    full_name: row.full_name,
    role: row.role,
  };
}

function ownerInfoFromMembership(
  membership: { id: string; created_at: string },
  profile: ProfileRow
): CompanyOwnerInfo {
  return {
    membershipId: membership.id,
    userId: profile.id,
    email: profile.email,
    fullName: profile.full_name,
    assignedAt: membership.created_at,
  };
}

function mapMemberRowToOwnerInfo(row: MemberWithProfileRow): CompanyOwnerInfo | null {
  const profile = resolveProfile(row.profiles);
  if (!profile) return null;

  return ownerInfoFromMembership({ id: row.id, created_at: row.created_at }, profile);
}

/** Looks up a platform profile by email (case-insensitive). */
export async function findProfileByEmail(email: string): Promise<PlatformProfile | null> {
  const trimmed = email.trim();
  if (!trimmed) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, role")
    .ilike("email", trimmed)
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(getSupabaseErrorMessage(error, error.message));
  if (!data) return null;
  return mapProfileRow(data as ProfileRow);
}

/** Lists owner memberships for a company (role = owner). */
export async function listCompanyOwners(companyId: string): Promise<CompanyOwnerInfo[]> {
  const { data: members, error } = await supabase
    .from("company_members")
    .select("id, user_id, created_at")
    .eq("company_id", companyId)
    .eq("role", "owner")
    .order("created_at", { ascending: true });

  if (error) throw new Error(getSupabaseErrorMessage(error, error.message));
  if (!members?.length) return [];

  const owners: CompanyOwnerInfo[] = [];
  for (const member of members) {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, email, full_name, role")
      .eq("id", member.user_id)
      .maybeSingle();

    if (profileError) {
      throw new Error(getSupabaseErrorMessage(profileError, profileError.message));
    }
    if (!profile) continue;

    owners.push(
      ownerInfoFromMembership(
        { id: member.id, created_at: member.created_at },
        profile as ProfileRow
      )
    );
  }

  return owners;
}

/** Owner memberships for a user (MVP: at most one expected). */
async function listOwnerMembershipsForProfile(
  profileId: string
): Promise<OwnerMembershipRow[]> {
  const { data, error } = await supabase
    .from("company_members")
    .select("id, company_id, role, created_at")
    .eq("user_id", profileId)
    .eq("role", "owner");

  if (error) throw new Error(getSupabaseErrorMessage(error, error.message));
  return (data ?? []) as OwnerMembershipRow[];
}

/** Sets platform profile role (e.g. company_owner). Requires RLS to allow superadmin updates. */
export async function updateProfileRole(
  profileId: string,
  role: AppRole
): Promise<void> {
  const { error } = await supabase.from("profiles").update({ role }).eq("id", profileId);

  if (error) throw new Error(getSupabaseErrorMessage(error, error.message));
}

/**
 * Assigns an existing profile as company owner.
 * MVP: one owner membership per profile (one company per company_owner).
 * TODO: Support multiple companies per owner in a later version.
 */
export async function assignCompanyOwner(
  companyId: string,
  profileId: string
): Promise<AssignCompanyOwnerResult> {
  const { data: profileRow, error: profileError } = await supabase
    .from("profiles")
    .select("id, email, full_name, role")
    .eq("id", profileId)
    .maybeSingle();

  if (profileError) throw new Error(getSupabaseErrorMessage(profileError, profileError.message));
  if (!profileRow) {
    throw new Error(PROFILE_NOT_FOUND_MESSAGE);
  }

  const profile = profileRow as ProfileRow;

  if (profile.role === "superadmin") {
    throw new Error("A superadmin account cannot be assigned as a company owner.");
  }

  const ownerMemberships = await listOwnerMembershipsForProfile(profile.id);
  const ownerOnThisCompany = ownerMemberships.find((m) => m.company_id === companyId);

  if (ownerOnThisCompany) {
    return {
      outcome: "already_here",
      owner: ownerInfoFromMembership(ownerOnThisCompany, profile),
    };
  }

  if (ownerMemberships.length > 0) {
    throw new Error(OWNER_ALREADY_ASSIGNED_OTHER_COMPANY_MESSAGE);
  }

  const { data: existingMember, error: memberCheckError } = await supabase
    .from("company_members")
    .select("id, role")
    .eq("company_id", companyId)
    .eq("user_id", profile.id)
    .maybeSingle();

  if (memberCheckError) {
    throw new Error(getSupabaseErrorMessage(memberCheckError, memberCheckError.message));
  }

  if (existingMember) {
    throw new Error("This user is already a member of this company.");
  }

  if (profile.role !== "company_owner") {
    await updateProfileRole(profile.id, "company_owner");
  }

  const { data: membership, error: insertError } = await supabase
    .from("company_members")
    .insert({
      company_id: companyId,
      user_id: profile.id,
      role: "owner",
    })
    .select("id, user_id, created_at")
    .single();

  if (insertError) {
    throw new Error(getSupabaseErrorMessage(insertError, insertError.message));
  }

  return {
    outcome: "assigned",
    owner: {
      membershipId: membership.id,
      userId: profile.id,
      email: profile.email,
      fullName: profile.full_name,
      assignedAt: membership.created_at,
    },
  };
}

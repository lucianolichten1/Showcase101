import { supabase } from "@/lib/supabase";
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

function mapToOwnerInfo(row: MemberWithProfileRow): CompanyOwnerInfo | null {
  const profile = resolveProfile(row.profiles);
  if (!profile) return null;

  return {
    membershipId: row.id,
    userId: row.user_id,
    email: profile.email,
    fullName: profile.full_name,
    assignedAt: row.created_at,
  };
}

/** Looks up a platform profile by email (case-insensitive). */
export async function findProfileByEmail(email: string): Promise<PlatformProfile | null> {
  const trimmed = email.trim();
  if (!trimmed) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, role")
    .ilike("email", trimmed)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;
  return mapProfileRow(data as ProfileRow);
}

/** Lists owner memberships for a company (role = owner). */
export async function listCompanyOwners(companyId: string): Promise<CompanyOwnerInfo[]> {
  const { data, error } = await supabase
    .from("company_members")
    .select(
      `
      id,
      user_id,
      created_at,
      profiles (
        id,
        email,
        full_name,
        role
      )
    `
    )
    .eq("company_id", companyId)
    .eq("role", "owner")
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);

  return (data ?? [])
    .map((row) => mapToOwnerInfo(row as MemberWithProfileRow))
    .filter((owner): owner is CompanyOwnerInfo => owner !== null);
}

/** Sets platform profile role (e.g. company_owner). Requires RLS to allow superadmin updates. */
export async function updateProfileRole(
  profileId: string,
  role: AppRole
): Promise<void> {
  const { error } = await supabase.from("profiles").update({ role }).eq("id", profileId);

  if (error) throw new Error(error.message);
}

/**
 * Assigns an existing profile as company owner.
 * Updates role to company_owner when needed; skips duplicate memberships.
 */
export async function assignCompanyOwner(
  companyId: string,
  profileId: string
): Promise<CompanyOwnerInfo> {
  const { data: profileRow, error: profileError } = await supabase
    .from("profiles")
    .select("id, email, full_name, role")
    .eq("id", profileId)
    .maybeSingle();

  if (profileError) throw new Error(profileError.message);
  if (!profileRow) {
    throw new Error(PROFILE_NOT_FOUND_MESSAGE);
  }

  const profile = profileRow as ProfileRow;

  if (profile.role === "superadmin") {
    throw new Error("A superadmin account cannot be assigned as a company owner.");
  }

  const { data: existingMember, error: memberCheckError } = await supabase
    .from("company_members")
    .select("id, role")
    .eq("company_id", companyId)
    .eq("user_id", profile.id)
    .maybeSingle();

  if (memberCheckError) throw new Error(memberCheckError.message);

  if (existingMember) {
    throw new Error(
      existingMember.role === "owner"
        ? "This user is already assigned as owner of this company."
        : "This user is already a member of this company."
    );
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

  if (insertError) throw new Error(insertError.message);

  return {
    membershipId: membership.id,
    userId: profile.id,
    email: profile.email,
    fullName: profile.full_name,
    assignedAt: membership.created_at,
  };
}

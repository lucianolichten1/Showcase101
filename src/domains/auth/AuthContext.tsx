import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { companyDashboardPath } from "./navigation";
import type { AppRole, CompanyMember, Profile } from "./types";
import { isAppRole } from "./types";

export interface AuthContextValue {
  user: User | null;
  profile: Profile | null;
  /** Platform role from `profiles.role`. */
  role: AppRole | null;
  memberships: CompanyMember[];
  loading: boolean;
  authError: string | null;
  isSuperadmin: boolean;
  isCompanyOwner: boolean;
  /** True when company_owner has at least one company_members row. */
  hasCompanyAssignment: boolean;
  /** Assigned company for company_owner (MVP: one company per owner). */
  primaryCompanyId: string | null;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function fetchProfileAndMemberships(userId: string) {
  const [profileResult, membershipsResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, email, full_name, role")
      .eq("id", userId)
      .maybeSingle(),
    supabase
      .from("company_members")
      .select("id, company_id, user_id, role, created_at")
      .eq("user_id", userId),
  ]);

  if (profileResult.error) throw profileResult.error;
  if (membershipsResult.error) throw membershipsResult.error;

  const row = profileResult.data;
  if (!row || !isAppRole(row.role)) {
    return { profile: null, memberships: membershipsResult.data ?? [] };
  }

  const profile: Profile = {
    id: row.id,
    email: row.email,
    full_name: row.full_name,
    role: row.role,
  };

  return {
    profile,
    memberships: (membershipsResult.data ?? []) as CompanyMember[],
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [memberships, setMemberships] = useState<CompanyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const loadUserData = useCallback(async (nextUser: User | null) => {
    if (!nextUser) {
      setUser(null);
      setProfile(null);
      setMemberships([]);
      setAuthError(null);
      return;
    }

    setUser(nextUser);
    try {
      const { profile: nextProfile, memberships: nextMemberships } =
        await fetchProfileAndMemberships(nextUser.id);
      setProfile(nextProfile);
      setMemberships(nextMemberships);
      if (!nextProfile) {
        setAuthError("Your account is missing a valid platform profile.");
      } else {
        setAuthError(null);
      }
    } catch (err) {
      setProfile(null);
      setMemberships([]);
      setAuthError(err instanceof Error ? err.message : "Failed to load profile.");
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    await loadUserData(session?.user ?? null);
  }, [loadUserData]);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!mounted) return;
      await loadUserData(session?.user ?? null);
      if (mounted) setLoading(false);
    };

    void init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      void loadUserData(session?.user ?? null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadUserData]);

  const signIn = useCallback(async (email: string, password: string) => {
    setAuthError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return { error: null };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setMemberships([]);
    setAuthError(null);
  }, []);

  const role = profile?.role ?? null;
  const primaryCompanyId = getPrimaryCompanyId(profile, memberships);
  const hasCompanyAssignment =
    profile?.role === "company_owner"
      ? primaryCompanyId !== null
      : memberships.length > 0;
  const isSuperadmin = role === "superadmin";
  const isCompanyOwner = role === "company_owner";

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      role,
      memberships,
      loading,
      authError,
      isSuperadmin,
      isCompanyOwner,
      hasCompanyAssignment,
      primaryCompanyId,
      signIn,
      signOut,
      refreshProfile,
    }),
    [
      user,
      profile,
      role,
      memberships,
      loading,
      authError,
      isSuperadmin,
      isCompanyOwner,
      hasCompanyAssignment,
      primaryCompanyId,
      signIn,
      signOut,
      refreshProfile,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}

// TODO: Support multiple companies per owner in a later version.
// TODO: Add company switcher later if needed.

/**
 * MVP: company_owner has one assigned company (owner membership).
 * Superadmin has no primary company — they access all via admin routes.
 */
export function getPrimaryCompanyId(
  profile: Profile | null,
  memberships: CompanyMember[]
): string | null {
  if (!profile || profile.role !== "company_owner") return null;
  const ownerMembership =
    memberships.find((m) => m.role === "owner") ?? memberships[0];
  return ownerMembership?.company_id ?? null;
}

/** Post-login destination by role and company assignment. */
export function getPostLoginPath(
  profile: Profile | null,
  memberships: CompanyMember[]
): string {
  if (!profile) return "/login";
  if (profile.role === "superadmin") return "/admin";
  if (profile.role === "company_owner") {
    const companyId = getPrimaryCompanyId(profile, memberships);
    if (companyId) return companyDashboardPath(companyId);
    return "/no-company";
  }
  return "/login";
}

export function userCanAccessCompany(
  profile: Profile | null,
  memberships: CompanyMember[],
  companyId: string
): boolean {
  if (!profile) return false;
  if (profile.role === "superadmin") return true;
  if (profile.role === "company_owner") {
    return getPrimaryCompanyId(profile, memberships) === companyId;
  }
  return memberships.some((m) => m.company_id === companyId);
}

export function isUnassignedCompanyOwner(
  profile: Profile | null,
  memberships: CompanyMember[]
): boolean {
  return profile?.role === "company_owner" && memberships.length === 0;
}

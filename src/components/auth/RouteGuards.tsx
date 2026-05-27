import { Navigate, Outlet, useLocation, useParams, useSearchParams } from "react-router-dom";
import {
  useAuth,
  getPostLoginPath,
  userCanAccessCompany,
  isUnassignedCompanyOwner,
} from "@/domains/auth/AuthContext";
import { AuthLoadingScreen } from "./AuthLoadingScreen";
import { AccessDeniedPage } from "./AccessDeniedPage";

/** Requires authenticated user with a valid profile. */
export function RequireAuth() {
  const { user, profile, memberships, loading, isCompanyOwner, primaryCompanyId } =
    useAuth();
  const location = useLocation();

  if (loading) return <AuthLoadingScreen />;
  if (!user || !profile) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const unassignedOwner = isUnassignedCompanyOwner(profile, memberships);

  if (unassignedOwner) {
    if (location.pathname === "/no-company") return <Outlet />;
    return <Navigate to="/no-company" replace />;
  }

  if (isCompanyOwner && location.pathname.startsWith("/admin")) {
    if (primaryCompanyId) {
      return <Navigate to={`/company/${primaryCompanyId}/dashboard`} replace />;
    }
    return <Navigate to="/no-company" replace />;
  }

  return <Outlet />;
}

/** Redirects `/` to role-appropriate home. */
export function RootRedirect() {
  const { profile, memberships } = useAuth();
  return <Navigate to={getPostLoginPath(profile, memberships)} replace />;
}

/** Superadmin-only routes (`/admin/*`). */
export function RequireSuperAdmin() {
  const { profile, memberships, primaryCompanyId } = useAuth();

  if (profile?.role !== "superadmin") {
    if (profile?.role === "company_owner" && primaryCompanyId) {
      return <Navigate to={`/company/${primaryCompanyId}/dashboard`} replace />;
    }
    if (isUnassignedCompanyOwner(profile, memberships)) {
      return <Navigate to="/no-company" replace />;
    }
    return (
      <AccessDeniedPage message="Only platform super admins can access the admin area." />
    );
  }

  return <Outlet />;
}

/** `/company/:companyId/*` — superadmin or member of that company. */
export function RequireCompanyWorkspaceAccess() {
  const { companyId } = useParams<{ companyId: string }>();
  const { profile, memberships, primaryCompanyId, isSuperadmin } = useAuth();

  if (!companyId) return <Navigate to="/" replace />;

  if (!userCanAccessCompany(profile, memberships, companyId)) {
    if (!isSuperadmin && primaryCompanyId) {
      return <Navigate to={`/company/${primaryCompanyId}/dashboard`} replace />;
    }
    return (
      <AccessDeniedPage
        title="Company access denied"
        message="You can only open workspaces for companies you belong to."
      />
    );
  }

  return <Outlet />;
}

const FINANCIAL_PATHS = new Set([
  "/dashboard",
  "/reports",
  "/expenses",
  "/revenue",
  "/accounts-receivable",
  "/customers",
  "/export-import",
]);

/**
 * Financial module routes.
 * - superadmin: full access (optional companyId query).
 * - company_owner: must include own companyId query param.
 */
export function RequireFinancialModuleAccess() {
  const { profile, memberships, primaryCompanyId, isSuperadmin, isCompanyOwner } =
    useAuth();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  if (!FINANCIAL_PATHS.has(location.pathname)) {
    return <Outlet />;
  }

  if (isSuperadmin) {
    return <Outlet />;
  }

  if (isCompanyOwner) {
    if (isUnassignedCompanyOwner(profile, memberships)) {
      return <Navigate to="/no-company" replace />;
    }

    const queryCompanyId = searchParams.get("companyId");
    const allowedId = primaryCompanyId;

    if (!allowedId) {
      return <Navigate to="/no-company" replace />;
    }

    if (!queryCompanyId) {
      return (
        <Navigate
          to={{ pathname: location.pathname, search: `?companyId=${allowedId}` }}
          replace
        />
      );
    }

    if (!userCanAccessCompany(profile, memberships, queryCompanyId)) {
      return <Navigate to={`/company/${allowedId}/dashboard`} replace />;
    }

    return <Outlet />;
  }

  return <Navigate to="/login" replace />;
}

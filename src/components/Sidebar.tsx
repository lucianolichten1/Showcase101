import { BarChart3, LogOut, X } from "lucide-react";
import { useLocation, useParams, useSearchParams } from "react-router-dom";
import { getNavigationForContext } from "@/domains/auth/navigation";
import { useAuth } from "@/domains/auth/AuthContext";
import { formatRoleLabel } from "@/domains/auth/labels";
import { SidebarNavItem } from "./SidebarNavItem";
import { cn } from "@/lib/utils";

interface SidebarProps {
  className?: string;
  onClose?: () => void;
  onNavClick?: () => void;
}

export function Sidebar({ className, onClose, onNavClick }: SidebarProps) {
  const { profile, role, primaryCompanyId, signOut } = useAuth();
  const location = useLocation();
  const { companyId: routeCompanyId } = useParams();
  const [searchParams] = useSearchParams();
  const navItems = getNavigationForContext({
    role,
    primaryCompanyId,
    pathname: location.pathname,
    routeCompanyId,
    queryCompanyId: searchParams.get("companyId"),
  });
  const roleLabel = formatRoleLabel(role);
  const navLabel =
    role === "superadmin" && navItems.length === 1 && navItems[0]?.id === "admin-companies"
      ? "Admin navigation"
      : "Main navigation";

  return (
    <aside
      className={cn(
        "flex h-full w-64 shrink-0 flex-col border-r border-stone-200 bg-white",
        className
      )}
    >
      <div className="flex h-14 items-center justify-between gap-2 border-b border-stone-200 px-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-green-800 text-white">
            <BarChart3 className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-stone-900 leading-tight">
              AI Finance OS
            </p>
            <p className="truncate text-[10px] font-semibold uppercase tracking-wider text-stone-500">
              {roleLabel}
            </p>
          </div>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-stone-500 hover:bg-stone-100 hover:text-stone-800 lg:hidden"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label={navLabel}>
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.id}>
              <SidebarNavItem item={item} onNavClick={onNavClick} />
            </li>
          ))}
        </ul>
      </nav>

      <div className="border-t border-stone-200 px-4 py-3 space-y-2">
        {profile && (
          <div className="rounded-lg border border-stone-100 bg-stone-50 px-3 py-2 min-w-0">
            <p className="text-[9px] font-bold uppercase tracking-wider text-stone-400">
              Signed in
            </p>
            <p className="truncate text-xs font-semibold text-stone-800 mt-0.5">
              {profile.email}
            </p>
            <p className="text-[10px] text-stone-500 mt-0.5">Role: {roleLabel}</p>
          </div>
        )}
        <button
          type="button"
          onClick={() => void signOut()}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-stone-200 px-3 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-50 transition-colors"
        >
          <LogOut size={14} />
          Sign out
        </button>
      </div>
    </aside>
  );
}

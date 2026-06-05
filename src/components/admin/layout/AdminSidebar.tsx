import { BarChart3, Building2, Clock, LineChart, LogOut, X } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/domains/auth/AuthContext";
import { formatRoleLabel } from "@/domains/auth/labels";

interface AdminSidebarProps {
  onNavClick?: () => void;
  onClose?: () => void;
}

export function AdminSidebar({ onNavClick, onClose }: AdminSidebarProps) {
  const { profile, role, signOut } = useAuth();
  const location = useLocation();
  const roleLabel = formatRoleLabel(role);

  const isCompaniesActive = location.pathname.startsWith("/admin");

  return (
    <aside className="admin-sidebar h-full w-[248px] shrink-0">
      <Link to="/admin/companies" className="admin-brand" onClick={onNavClick}>
        <div className="admin-brand-mark">
          <BarChart3 className="h-[19px] w-[19px] text-[#eaf3ee]" />
        </div>
        <div>
          <div className="admin-brand-name">AI Finance OS</div>
          <div className="admin-brand-sub">Super Admin</div>
        </div>
      </Link>

      <nav className="admin-nav" aria-label="Admin navigation">
        <div className="admin-nav-label eyebrow">Platform</div>
        <Link
          to="/admin/companies"
          className={`admin-nav-item${isCompaniesActive ? " active" : ""}`}
          onClick={onNavClick}
        >
          <Building2 className="h-[18px] w-[18px] shrink-0" />
          Companies
        </Link>
        <button type="button" className="admin-nav-item" disabled>
          <LineChart className="h-[18px] w-[18px] shrink-0" />
          Usage
          <span className="admin-nav-soon">Soon</span>
        </button>
        <button type="button" className="admin-nav-item" disabled>
          <Clock className="h-4 w-4 shrink-0" />
          Audit log
          <span className="admin-nav-soon">Soon</span>
        </button>
      </nav>

      <div className="admin-sidebar-foot">
        {profile && (
          <div className="admin-signed">
            <div className="eyebrow">Signed in</div>
            <div className="who truncate">{profile.email}</div>
            <div className="role">Role · {roleLabel}</div>
          </div>
        )}
        <button
          type="button"
          className="admin-signout"
          onClick={() => void signOut()}
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>

      {onClose && (
        <button
          type="button"
          className="admin-icon-btn absolute top-4 right-4 lg:hidden"
          onClick={onClose}
          aria-label="Close menu"
        >
          <X className="h-[18px] w-[18px]" />
        </button>
      )}
    </aside>
  );
}

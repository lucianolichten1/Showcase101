import { NavLink } from "react-router-dom";
import type { RoleNavItem } from "@/domains/auth/navigation";
import { cn } from "@/lib/utils";

interface SidebarNavItemProps {
  item: RoleNavItem;
  onNavClick?: () => void;
}

const navItemClassName = (isActive: boolean) =>
  cn(
    "group flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
    isActive
      ? "bg-green-800 text-white shadow-sm"
      : "text-stone-700 hover:bg-stone-100 hover:text-stone-900"
  );

const iconClassName = (isActive: boolean) =>
  cn(
    "h-4 w-4 shrink-0",
    isActive ? "text-white" : "text-stone-500 group-hover:text-stone-700"
  );

export function SidebarNavItem({ item, onNavClick }: SidebarNavItemProps) {
  const Icon = item.icon;

  if (item.href === "#") {
    return (
      <span
        className={cn(navItemClassName(false), "cursor-not-allowed opacity-50")}
        aria-disabled="true"
      >
        <Icon className={iconClassName(false)} strokeWidth={2} />
        <span className="truncate">{item.label}</span>
      </span>
    );
  }

  return (
    <NavLink
      to={item.href}
      onClick={() => onNavClick?.()}
      className={({ isActive }) => navItemClassName(isActive)}
    >
      {({ isActive }) => (
        <>
          <Icon
            className={iconClassName(isActive)}
            strokeWidth={isActive ? 2.25 : 2}
          />
          <span className="truncate">{item.label}</span>
        </>
      )}
    </NavLink>
  );
}

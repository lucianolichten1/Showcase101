import { NavLink } from "react-router-dom";
import { isNavigableNavItem, type NavItem } from "@/config/navigation";
import { cn } from "@/lib/utils";

interface SidebarNavItemProps {
  item: NavItem;
  onNavClick?: () => void;
}

const navItemClassName = (isActive: boolean) =>
  cn(
    "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
    isActive
      ? "bg-green-50 text-green-900 border border-green-100"
      : "text-stone-600 hover:bg-stone-50 hover:text-stone-900 border border-transparent"
  );

const iconClassName = (isActive: boolean) =>
  cn(
    "h-4 w-4 shrink-0",
    isActive ? "text-green-700" : "text-stone-400 group-hover:text-stone-600"
  );

export function SidebarNavItem({ item, onNavClick }: SidebarNavItemProps) {
  const Icon = item.icon;

  if (!isNavigableNavItem(item.id)) {
    return (
      <span
        className={cn(
          navItemClassName(false),
          "cursor-not-allowed opacity-50"
        )}
        aria-disabled="true"
        title="Settings (coming soon)"
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

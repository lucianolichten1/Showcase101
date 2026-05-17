import type { NavItem, NavItemId } from "@/config/navigation";
import { cn } from "@/lib/utils";

interface SidebarNavItemProps {
  item: NavItem;
  activeId: NavItemId;
  onNavigate?: (id: NavItemId) => void;
}

export function SidebarNavItem({ item, activeId, onNavigate }: SidebarNavItemProps) {
  const isActive = item.id === activeId;
  const Icon = item.icon;

  return (
    <a
      href={item.href}
      onClick={(e) => {
        if (onNavigate) {
          e.preventDefault();
          onNavigate(item.id);
        }
      }}
      className={cn(
        "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
        isActive
          ? "bg-green-50 text-green-900 border border-green-100"
          : "text-stone-600 hover:bg-stone-50 hover:text-stone-900 border border-transparent"
      )}
      aria-current={isActive ? "page" : undefined}
    >
      <Icon
        className={cn(
          "h-4 w-4 shrink-0",
          isActive ? "text-green-700" : "text-stone-400 group-hover:text-stone-600"
        )}
        strokeWidth={isActive ? 2.25 : 2}
      />
      <span className="truncate">{item.label}</span>
    </a>
  );
}

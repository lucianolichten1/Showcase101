import { Tractor, X } from "lucide-react";
import { navigationItems } from "@/config/navigation";
import { SidebarNavItem } from "./SidebarNavItem";
import { cn } from "@/lib/utils";

interface SidebarProps {
  className?: string;
  onClose?: () => void;
  onNavClick?: () => void;
}

export function Sidebar({ className, onClose, onNavClick }: SidebarProps) {
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
            <Tractor className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-stone-900 leading-tight">Agro Dashboard</p>
            <p className="truncate text-[10px] font-semibold uppercase tracking-wider text-stone-500">
              Financial SaaS
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

      <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Main navigation">
        <ul className="space-y-1">
          {navigationItems.map((item) => (
            <li key={item.id}>
              <SidebarNavItem item={item} onNavClick={onNavClick} />
            </li>
          ))}
        </ul>
      </nav>

      <div className="border-t border-stone-200 px-4 py-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">
          MVP Demo
        </p>
        <p className="mt-0.5 text-xs text-stone-500">Navigation preview</p>
      </div>
    </aside>
  );
}

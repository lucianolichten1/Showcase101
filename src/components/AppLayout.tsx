import { useState, type ReactNode } from "react";
import { Menu } from "lucide-react";
import { Sidebar } from "./Sidebar";
import type { NavItemId } from "@/config/navigation";

interface AppLayoutProps {
  children: ReactNode;
  activeNavId?: NavItemId;
  onNavigate?: (id: NavItemId) => void;
}

export function AppLayout({ children, activeNavId = "dashboard", onNavigate }: AppLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNavigate = (id: NavItemId) => {
    onNavigate?.(id);
    setMobileOpen(false);
  };

  return (
    <div className="flex min-h-screen bg-[#FBFBF9]">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:fixed lg:inset-y-0 lg:left-0 lg:z-30">
        <Sidebar activeId={activeNavId} onNavigate={handleNavigate} />
      </div>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-stone-900/40 lg:hidden"
          aria-label="Close menu overlay"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <div
        className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-200 ease-out lg:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar activeId={activeNavId} onClose={() => setMobileOpen(false)} onNavigate={handleNavigate} />
      </div>

      {/* Main column */}
      <div className="flex min-h-screen flex-1 flex-col lg:pl-64">
        {/* Mobile top bar */}
        <div className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-stone-200 bg-white px-4 lg:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="rounded-md p-2 text-stone-600 hover:bg-stone-100"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="text-sm font-bold text-stone-900">Agro Dashboard</span>
        </div>

        {children}
      </div>
    </div>
  );
}

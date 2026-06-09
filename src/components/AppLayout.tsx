import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Menu } from "lucide-react";
import {
  CompanyBrandingProvider,
  useCompanyBranding,
  useCompanyBrandingStyle,
} from "@/domains/company/CompanyBrandingContext";
import { Sidebar } from "./Sidebar";
import { CompanyBrandMark } from "./CompanyBrandMark";

function AppLayoutShell() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { branding } = useCompanyBranding();
  const brandingStyle = useCompanyBrandingStyle();

  return (
    <div className="company-app flex min-h-screen bg-[#FBFBF9]" style={brandingStyle}>
      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:fixed lg:inset-y-0 lg:left-0 lg:z-30">
        <Sidebar onNavClick={() => setMobileOpen(false)} />
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
        <Sidebar onClose={() => setMobileOpen(false)} onNavClick={() => setMobileOpen(false)} />
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
          <CompanyBrandMark
            className="max-h-7"
            fallbackClassName="h-7 w-7"
            iconClassName="h-3.5 w-3.5"
          />
          <span className="truncate text-sm font-bold text-stone-900">
            {branding.resolvedDisplayName}
          </span>
        </div>

        <Outlet />
      </div>
    </div>
  );
}

export function AppLayout() {
  return (
    <CompanyBrandingProvider>
      <AppLayoutShell />
    </CompanyBrandingProvider>
  );
}

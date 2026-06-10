import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

function SkeletonBlock({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("animate-pulse rounded-lg bg-stone-200/70", className)} {...props} />
  );
}

/**
 * Full-page skeleton shown while the company workspace (branding, enabled
 * widgets, company record) is still resolving. Mirrors the AppLayout shell so
 * there is no layout shift once real content renders.
 */
export function CompanyWorkspaceLoading() {
  return (
    <div className="flex min-h-screen bg-[#FBFBF9]">
      {/* Desktop sidebar skeleton */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-stone-200 bg-white px-4 py-5 gap-6">
        <div className="flex items-center gap-3">
          <SkeletonBlock className="h-9 w-9 rounded-xl" />
          <SkeletonBlock className="h-4 w-28" />
        </div>
        <div className="space-y-2.5 mt-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <SkeletonBlock key={i} className="h-8 w-full" />
          ))}
        </div>
        <div className="mt-auto">
          <SkeletonBlock className="h-10 w-full" />
        </div>
      </aside>

      {/* Main column skeleton */}
      <div className="flex min-h-screen flex-1 flex-col">
        {/* Mobile top bar skeleton */}
        <div className="flex h-14 items-center gap-3 border-b border-stone-200 bg-white px-4 lg:hidden">
          <SkeletonBlock className="h-7 w-7 rounded-lg" />
          <SkeletonBlock className="h-4 w-32" />
        </div>

        <div className="flex-1 overflow-hidden">
          <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-10 py-4 sm:py-5 space-y-5">
            {/* Page header skeleton */}
            <div className="rounded-xl border border-stone-200 bg-white shadow-sm px-4 py-3.5 sm:px-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div className="space-y-2">
                <SkeletonBlock className="h-7 w-56" />
                <SkeletonBlock className="h-4 w-72 max-w-full" />
              </div>
              <SkeletonBlock className="h-9 w-full sm:w-52" />
            </div>

            {/* KPI grid skeleton */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-white p-3 rounded-xl border border-stone-200 shadow-sm min-h-[88px] flex flex-col items-center justify-center gap-2"
                >
                  <SkeletonBlock className="h-2.5 w-20" />
                  <SkeletonBlock className="h-5 w-24" />
                </div>
              ))}
            </div>

            {/* Chart skeleton */}
            <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5 space-y-4">
              <div className="space-y-2">
                <SkeletonBlock className="h-4 w-44" />
                <SkeletonBlock className="h-3 w-64 max-w-full" />
              </div>
              <SkeletonBlock className="h-[260px] w-full" />
            </div>

            <div className="flex items-center justify-center gap-2 pt-2 text-stone-400">
              <span className="h-4 w-4 rounded-full border-2 border-stone-300 border-t-transparent animate-spin" />
              <span className="text-xs">Loading workspace…</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

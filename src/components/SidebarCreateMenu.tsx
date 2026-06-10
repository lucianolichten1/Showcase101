import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ChevronDown, Plus } from "lucide-react";
import { useAuth } from "@/domains/auth/AuthContext";
import { useCompanyEnabledModules } from "@/domains/company/useCompanyEnabledModules";
import {
  buildCreateActionUrl,
  getGroupedCreateActions,
} from "@/domains/create/registry";
import { cn } from "@/lib/utils";

interface Props {
  onNavClick?: () => void;
}

export function SidebarCreateMenu({ onNavClick }: Props) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { role, primaryCompanyId, isSuperadmin } = useAuth();
  const { enabledModules } = useCompanyEnabledModules();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const companyId =
    searchParams.get("companyId") ??
    (role === "company_owner" ? primaryCompanyId : null);

  const showMenu =
    (role === "company_owner" && Boolean(primaryCompanyId)) ||
    (isSuperadmin && Boolean(companyId));

  const groups = useMemo(
    () => getGroupedCreateActions(enabledModules),
    [enabledModules]
  );

  const hasActions = groups.some((g) => g.actions.length > 0);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  if (!showMenu || !hasActions) return null;

  return (
    <div ref={rootRef} className="relative mb-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className={cn(
          "flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
          open
            ? "border-green-200 bg-green-50 text-green-800"
            : "border-stone-200 bg-white text-stone-700 hover:border-green-200 hover:bg-green-50/60 hover:text-green-800"
        )}
      >
        <Plus size={14} strokeWidth={2} className="shrink-0 text-green-800" />
        Create
        <ChevronDown
          size={14}
          className={cn(
            "ml-auto shrink-0 text-stone-400 transition-transform",
            open && "rotate-180 text-green-700"
          )}
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute left-0 right-0 top-full z-50 mt-1.5 max-h-[min(70vh,420px)] overflow-y-auto rounded-lg border border-stone-200 bg-white py-1.5 shadow-lg"
        >
          {groups.map((group) => (
            <div key={group.moduleKey} role="none">
              <p className="px-3 pt-2 pb-1 text-[9px] font-bold uppercase tracking-wider text-green-800">
                {group.moduleName}
              </p>
              <ul className="pb-1">
                {group.actions.map((action) => (
                  <li key={action.id} role="none">
                    <button
                      type="button"
                      role="menuitem"
                      className="w-full px-3 py-2 text-left text-xs font-medium text-stone-800 hover:bg-green-50 transition-colors"
                      onClick={() => {
                        setOpen(false);
                        onNavClick?.();
                        navigate(buildCreateActionUrl(action, companyId));
                      }}
                    >
                      {action.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

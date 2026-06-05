import { Link } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import { useAuth } from "@/domains/auth/AuthContext";
import { companyDashboardPath } from "@/domains/auth/navigation";

interface Props {
  title?: string;
  message?: string;
}

export function AccessDeniedPage({
  title = "Access denied",
  message = "You do not have permission to view this company or area.",
}: Props) {
  const { isSuperadmin, primaryCompanyId } = useAuth();

  const backHref = isSuperadmin
    ? "/admin"
    : primaryCompanyId
      ? companyDashboardPath(primaryCompanyId)
      : "/no-company";

  const backLabel = isSuperadmin ? "Back to Admin" : "Back to Dashboard";

  return (
    <main className="flex flex-col items-center justify-center gap-4 p-5 lg:p-6 min-h-[50vh]">
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-8 text-center max-w-sm">
        <ShieldAlert size={28} className="mx-auto text-amber-500 mb-3" />
        <h1 className="text-sm font-bold text-stone-900">{title}</h1>
        <p className="text-xs text-stone-500 mt-1.5 leading-relaxed">{message}</p>
        <Link
          to={backHref}
          className="inline-flex mt-4 items-center gap-1.5 rounded-lg bg-green-800 px-3 py-2 text-xs font-semibold text-white hover:bg-green-900 transition-colors"
        >
          {backLabel}
        </Link>
      </div>
    </main>
  );
}
